<?php declare(strict_types=1);

/**
 * The contact endpoint. Served at /api/contact; nginx maps that path to this file.
 *
 * Descended from web/mailhandler.php, which stays where it is and keeps serving the live
 * 11ty site until the phase 6 cutover. Four things changed:
 *
 *   1. It answers JSON when asked, so the form can submit without navigating.
 *   2. reCAPTCHA is gone, replaced by a honeypot field plus nginx rate limiting.
 *   3. Failures are UNIFORM on the wire and specific only in the log.
 *   4. It returns the visitor to the page they submitted from.
 *
 * ── NO CORS HEADERS, AND THAT IS DELIBERATE ──────────────────────────────────
 *
 * Production and the SSR preview both serve this from their own origin, and the form
 * posts to a RELATIVE path, so every real request is same-origin. Local development uses
 * a dev-server stub at the same path rather than reaching across to the droplet — see the
 * Vite plugin in web-next/astro.config.mjs. Adding `Access-Control-Allow-Origin` here
 * would widen nothing useful; note it would also not be a security control, since CORS
 * governs whether a BROWSER may read a response, and anyone can post here with curl
 * regardless. The spam controls are the honeypot and the rate limit.
 *
 * Targets PHP 8.0 (`str_contains`, `str_starts_with`, `match`); nothing newer is used.
 */

require __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;
use Google\Client as GoogleClient;
use Google\Service\Gmail as GoogleGmail;

/*
 * The .env sits beside this file, OUTSIDE the web root — this whole directory is deployed
 * somewhere nginx does not serve, and only the /api/contact location is routed into it.
 * That is the fix for the live site's `chmod 644` .env, which is world-readable on the
 * droplet today with the Google client secret and refresh token in it.
 */
if (class_exists(Dotenv::class)) {
    Dotenv::createImmutable(__DIR__)->safeLoad();
}

const RECIPIENT = 'andy@andyfitzgeraldconsulting.com';

/** Where a no-JS visitor lands if `source_page` is missing or fails validation. */
const FALLBACK_RETURN = '/contact/';

// ── Response helpers ────────────────────────────────────────────────────────

/**
 * The fetch path sets `Accept: application/json`; a plain browser form POST does not.
 * That one header is the whole switch between the two response styles — no extra hidden
 * field, no query parameter, and nothing the no-JS path has to remember to omit.
 */
function wants_json(): bool
{
    return str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');
}

function env_value(string $key): string
{
    return (string) ($_ENV[$key] ?? getenv($key) ?: '');
}

/**
 * ── ONE FAILURE RESPONSE FOR EVERY NON-FIELD FAILURE ────────────────────────
 *
 * The honeypot, the injection guard, a rate limit, an expired Gmail token and an outright
 * PHP fatal all produce byte-identical output: HTTP 500 and `{"ok": false}`.
 *
 * That uniformity is the point, not an oversight. A honeypot's entire value is that its
 * rejection is indistinguishable from any other rejection — say "bot detected" and a
 * spammer flips one field at a time until the message changes, and now they know which
 * field to leave alone. The same logic protects the injection guard, which would
 * otherwise tell an attacker exactly which filter they tripped.
 *
 * THE STATUS CODE IS PART OF THAT. A semantically honest 400 for the honeypot would hand
 * back the same oracle as an honest message, because a status code is just as readable.
 * So it is 500 across the board even where 500 is a lie.
 *
 * The cost is that error monitoring cannot tell a bot from a real outage on the wire, and
 * `error_log` is where that is paid back: the real reason is always logged, and a
 * honeypot hit that looks like a real person is how you would discover a false positive.
 */
function fail_generic(string $log_reason): void
{
    error_log('[contact] ' . $log_reason);
    http_response_code(500);

    if (wants_json()) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false]);
        exit;
    }

    render_error_page();
    exit;
}

/**
 * Field-level rejection. The ONE case where this endpoint sends user-facing copy, because
 * which fields failed is genuinely the server's knowledge and the client cannot guess it.
 *
 * Reaching this at all means the client's validation and the server's disagreed, which
 * should be rare — the JS path checks the same constraints before sending, and the no-JS
 * path still gets native `required` and `type="email"` enforcement.
 */
function fail_fields(array $errors): void
{
    http_response_code(422);

    if (wants_json()) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'errors' => $errors]);
        exit;
    }

    render_error_page(array_values($errors));
    exit;
}

/**
 * The no-JS failure page.
 *
 * DELIBERATELY NOT STYLED LIKE THE SITE. Astro hashes its CSS filenames at build, so this
 * file cannot link the real stylesheet without being told the hash on every deploy — and a
 * page that half-matches the design reads worse than one that plainly does not try.
 *
 * The visitor's text IS LOST on this path, which is the honest cost of a full-page POST:
 * the browser navigated away and there is no body to restore. The JS path never gets here,
 * and never loses anything, because it does not navigate at all. Hence the routes out.
 *
 * ── THE TWO PROFILE URLs ARE DUPLICATED FROM web-next/src/lib/social.ts ─────
 *
 * Knowingly, and there is no way around it: PHP cannot import a TypeScript module, and
 * this page is rendered by the server rather than the build, so nothing can inject them.
 * Duplication with a note beats a build step that exists to share two strings.
 *
 * IF A PROFILE URL EVER MOVES, IT MOVES IN BOTH PLACES. `social.ts` carries the matching
 * note pointing back here.
 */
function render_error_page(array $problems = []): void
{
    header('Content-Type: text/html; charset=utf-8');

    $items = '';
    foreach ($problems as $problem) {
        $items .= '<li>' . htmlspecialchars($problem, ENT_QUOTES, 'UTF-8') . '</li>';
    }
    $list = $items === '' ? '' : "<ul>{$items}</ul>";

    $body = $problems === []
        ? '<p>There&rsquo;s been an error on my end and I wasn&rsquo;t able to send your '
          . 'message. You may want to try again in a few minutes, or you can reach me on '
          . '<a href="https://www.linkedin.com/in/andyfitzgerald">LinkedIn</a> or '
          . '<a href="https://bsky.app/profile/andyfitzgerald.bsky.social">Bluesky</a>.</p>'
        : '<p>Your message wasn&rsquo;t sent because of the following:</p>' . $list
          . '<p><a href="' . htmlspecialchars(FALLBACK_RETURN, ENT_QUOTES, 'UTF-8')
          . '">Go back to the contact form</a> and try again.</p>';

    echo <<<HTML
    <!doctype html>
    <html lang="en">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Message not sent</title>
    <style>
      body { margin: 0 auto; padding: 3rem 1rem; max-width: 40rem;
             font: 1rem/1.6 Georgia, serif; color: #051319; background: #f7f8f8 }
      h1 { font: 700 1.5rem/1.3 system-ui, sans-serif }
      a { color: #2b6a8f }
    </style>
    </head>
    <body>
    <h1>Message not sent</h1>
    {$body}
    </body>
    </html>
    HTML;
}

/**
 * ── `source_page` IS ATTACKER-CONTROLLED, SO IT IS VALIDATED BEFORE USE ─────
 *
 * It arrives as a hidden field, which means anyone can put anything in it. Redirecting to
 * it unchecked is an open redirect — a link to this endpoint could bounce a visitor to a
 * hostile site while wearing this domain's name in the address bar.
 *
 * Four rejections, and each one closes a real bypass rather than being belt-and-braces:
 *
 *   not starting with `/`   `https://evil.test` — an absolute URL
 *   starting with `//`      `//evil.test` — protocol-relative, and still absolute
 *   containing a backslash  `/\evil.test` — which some browsers normalize to `//`
 *   containing CR or LF     header injection through the Location line
 *
 * Anything rejected falls back to the contact page rather than failing the request; the
 * mail has already been sent by then, and losing the return path is not worth losing the
 * message over.
 */
function safe_return_path(string $raw): ?string
{
    if ($raw === '' || $raw[0] !== '/') {
        return null;
    }
    if (str_starts_with($raw, '//')) {
        return null;
    }
    if (str_contains($raw, '\\') || str_contains($raw, "\r") || str_contains($raw, "\n")) {
        return null;
    }

    return $raw;
}

function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

// ── Method guard ────────────────────────────────────────────────────────────

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit;
}

// ── Input ───────────────────────────────────────────────────────────────────
/*
 * Read as form-encoded in BOTH paths. The fetch call sends `URLSearchParams` rather than
 * JSON precisely so this file has one input shape to parse; a JSON branch here would be a
 * second parsing path that only one caller ever exercises.
 */

$name     = trim((string) ($_POST['name'] ?? ''));
$email    = trim((string) ($_POST['email'] ?? ''));
$subject  = trim((string) ($_POST['subject'] ?? ''));
$org      = trim((string) ($_POST['org'] ?? ''));
$message  = trim((string) ($_POST['message'] ?? ''));
$honeypot = trim((string) ($_POST['website'] ?? ''));
$source   = safe_return_path((string) ($_POST['source_page'] ?? '')) ?? FALLBACK_RETURN;

/*
 * ── THE HONEYPOT, CHECKED FIRST ────────────────────────────────────────────
 *
 * `website` is positioned off-screen and marked `tabindex="-1"`, `aria-hidden` and
 * `autocomplete="off"`, so no human and no assistive technology should ever reach it.
 * Anything in it is a bot filling every field it recognizes.
 *
 * First, so a bot costs nothing — no validation, no Gmail token exchange, no network call.
 * And logged, because a false positive would be a real person silently turned away, and
 * the log is the only place that would ever be visible.
 */
if ($honeypot !== '') {
    fail_generic('honeypot filled from ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
}

/*
 * Header injection guard, carried over intact. A newline in any of these fields would let
 * someone append their own headers to the message — a Bcc, most usefully — and turn this
 * form into an open relay. `$message` is exempt because it goes in the BODY, where a
 * newline is just a newline.
 */
if (preg_match('/[\r\n]|Content-Type:|Bcc:|Cc:/i', $name . $email . $subject . $org)) {
    fail_generic('header injection attempt from ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
}

// ── Validation ──────────────────────────────────────────────────────────────
/*
 * Keyed by FIELD NAME, matching the `name` attributes in ContactForm.astro, so the client
 * can attach each message to the control it belongs to without a translation table.
 */

$errors = [];

if ($name === '') {
    $errors['name'] = 'Enter your name.';
}
if ($email === '') {
    $errors['email'] = 'Enter your email address.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Enter a valid email address.';
}
if ($subject === '') {
    $errors['subject'] = 'Enter a subject.';
}
if ($message === '') {
    $errors['message'] = 'Enter a message.';
}

if ($errors !== []) {
    fail_fields($errors);
}

// ── Compose ─────────────────────────────────────────────────────────────────
/*
 * `Sent from` is the `source_page` field's second job (Andy, 2026-09-04) — the same hidden
 * value that steers the no-JS redirect also records WHICH page someone reached out from,
 * so the foot of an article can be told apart from the contact page itself.
 *
 * It is the validated path, not the raw one, so nothing unchecked reaches the mail body.
 */
$safe = fn(string $value): string => htmlspecialchars($value, ENT_QUOTES, 'UTF-8');

$body = sprintf(
    'Name: %s<br />Email: %s<br />Organization: %s<br />Sent from: %s<br /><br />%s',
    $safe($name),
    $safe($email),
    $safe($org === '' ? '—' : $org),
    $safe($source),
    nl2br($safe($message))
);

$plain = strip_tags(str_replace(['<br />', '<br /><br />'], "\n", $body));

$from = env_value('GMAIL_FROM') ?: RECIPIENT;
$boundary = 'b_' . bin2hex(random_bytes(8));

$raw =
    "From: {$from}\r\n" .
    'To: ' . RECIPIENT . "\r\n" .
    'Reply-To: ' . ($email ?: $from) . "\r\n" .
    'Subject: ' . mb_encode_mimeheader($subject, 'UTF-8') . "\r\n" .
    "MIME-Version: 1.0\r\n" .
    "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n" .
    "\r\n" .
    "--{$boundary}\r\n" .
    "Content-Type: text/plain; charset=UTF-8\r\n\r\n{$plain}\r\n\r\n" .
    "--{$boundary}\r\n" .
    "Content-Type: text/html; charset=UTF-8\r\n\r\n{$body}\r\n\r\n" .
    "--{$boundary}--\r\n";

// ── Send ────────────────────────────────────────────────────────────────────
/*
 * Gmail API over HTTPS rather than SMTP, unchanged from the live handler — the droplet's
 * outbound port 25 is blocked, which is why this uses OAuth against 443.
 *
 * ONE try/catch AROUND THE WHOLE EXCHANGE. The token fetch and the send can each throw,
 * and both mean the same thing to the visitor: it did not send. The distinction goes to
 * the log, where it is actionable, rather than to the wire, where it is not.
 */
try {
    $client = new GoogleClient();
    $client->setClientId(env_value('GOOGLE_CLIENT_ID'));
    $client->setClientSecret(env_value('GOOGLE_CLIENT_SECRET'));
    $client->setAccessType('offline');
    $client->setScopes(['https://www.googleapis.com/auth/gmail.send']);

    $token = $client->fetchAccessTokenWithRefreshToken(env_value('GOOGLE_REFRESH_TOKEN'));
    if (empty($token['access_token'])) {
        fail_generic('no access token: ' . json_encode($token));
    }

    (new GoogleGmail($client))
        ->users_messages
        ->send('me', new GoogleGmail\Message(['raw' => base64url_encode($raw)]));
} catch (Throwable $e) {
    fail_generic('gmail send failed: ' . $e->getMessage());
}

// ── Success ─────────────────────────────────────────────────────────────────

if (wants_json()) {
    /*
     * NO COPY IN THIS RESPONSE. The confirmation wording lives in the component, next to
     * the design it came from; sending it from here would put user-facing text in a second
     * place and let the two drift.
     */
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true]);
    exit;
}

/*
 * ── 303, NOT 302, AND IT MATTERS AFTER A POST ──────────────────────────────
 *
 * 303 tells the browser to follow up with a GET. A 302 leaves the method technically
 * unspecified, which is how a refresh on the landing page turns into a second submission.
 * The live handler sends a bare `Location:` — a 302 — and has exactly that weakness.
 *
 * The fragment is what the no-JS success block keys off: the page carries a hidden
 * confirmation revealed by `:target`, so a full-page POST can still confirm itself with
 * no JavaScript at all. That block lands with the client script; until it does, this
 * redirect returns the visitor to a page that says nothing.
 */
header('Location: ' . $source . '#contact-sent', true, 303);
exit;
