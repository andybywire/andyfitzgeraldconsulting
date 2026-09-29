#!/usr/bin/env bash
#
# ── DEPLOY THE NGINX CONFIGURATION ──────────────────────────────────────────
#
#   AFC_SSH=<ssh target> AFC_STAGING_AUTH=user:pass nginx/deploy.sh
#
# AFC_SSH is handed to `ssh` and `scp` exactly as given, so it can be — and
# usually should be — a Host alias from ~/.ssh/config rather than `root@<ip>`.
# The alias is what selects the key. `root@<ip>` does not match a `Host` entry, so
# its `IdentityFile` is never offered, and with nothing in the agent the result is
# `Permission denied (publickey)` against a perfectly good key. That is how this
# header's old example failed on 2026-09-28.
#
# While the 11ty site's config is still enabled on the droplet, a run IS THE
# CUTOVER, and it will not happen by accident — see "THE INTERLOCKS" below:
#
#   AFC_SSH=<ssh target> AFC_STAGING_AUTH=user:pass AFC_CUTOVER=yes nginx/deploy.sh
#
# ── WHY THIS IS A SCRIPT AND NOT A WORKFLOW ────────────────────────────────
#
# It was a workflow first. Decided 2026-09-21 to take it out of CI, and the
# reasoning is worth keeping because the obvious version of it is wrong.
#
# The apparent question was "how narrowly can the deploy user be permitted?" —
# grant sudo for five commands, or write to two directories, rather than
# NOPASSWD:ALL. Every version of that is theatre, because **writing nginx config
# is equivalent to being root**. The master process runs as root and it is the
# master that opens log files, so a config containing
#
#     access_log /etc/cron.d/anything;
#
# has root create and write that file on the next reload, with `log_format`
# controlling the contents. A wrapper script does not help either: the account
# still controls the bytes going into the config the wrapper installs. It is not
# a permissions problem. nginx config is a root-privileged language.
#
# So the real question was whether CI should deploy nginx config at all — and the
# answer is no, because the automation buys least exactly where it costs most.
# This config changes a handful of times during cutover and then approximately
# never, while a CI key that can write it is root-equivalent permanently.
#
# ── WHAT THIS DOES NOT CHANGE ──────────────────────────────────────────────
#
# The config is still AUTHORED IN THE REPO and never edited on the server
# (decided 2026-08-20). That decision was about where the file lives and how it is
# reviewed, not about what transport moves it. It is still version controlled,
# still diffable, still rolled back with a revert plus a re-run of this script.
#
# `.github/workflows/validate-nginx.yml` still runs `nginx -t` against these files
# in CI on every push, so a syntax error is caught without anyone running this.
#
# ── AND WHAT IT BUYS ───────────────────────────────────────────────────────
#
# `deploy-astro.yml` — the workflow that fires on every Sanity publish — uses no
# sudo at all. It writes only under its own release base in /var/www, and its
# `chgrp www-data` works from group membership. So with nginx out of CI, **no key
# held by GitHub is root-equivalent on the droplet.** That is the whole point of
# the change.
#
# UNTIL 2026-09-28 THAT RESTED ON A PASSWORD. The deploy user `afc` was in the
# `sudo` group with `(ALL : ALL) ALL` — not NOPASSWD, so the GitHub key alone
# was not root, but the key plus one short password was. `afc` was removed from
# the group that day (`gpasswd -d afc sudo`); nothing it does needs sudo, and root
# work goes through a separate root login. So the claim now holds by construction.
# If `afc` is ever put back in `sudo`, this paragraph stops being true.

set -euo pipefail

# ── Inputs ──────────────────────────────────────────────────────────────────

: "${AFC_SSH:?Set AFC_SSH to the droplet ssh target — an ~/.ssh/config Host alias, see the header}"

# "user:password" for the staging host's basic auth. Optional — without it the
# preview smoke checks drop to a status probe and say so.
AFC_STAGING_AUTH="${AFC_STAGING_AUTH:-}"

# "yes" to permit THE CUTOVER. Only consulted while the 11ty site's config is
# still enabled on the droplet; after that it is ignored. See the interlocks.
AFC_CUTOVER="${AFC_CUTOVER:-}"

PREVIEW_HOST="${PREVIEW_HOST:-preview.andyfitzgeraldconsulting.com}"
APEX_HOST="${APEX_HOST:-andyfitzgeraldconsulting.com}"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# afc-production.conf was deliberately absent from this list until cutover was
# built (2026-09-28), because installing it alone takes the live site down: its
# apex block collides with sites-enabled/andyfitzgeraldconsulting.com, conf.d
# loads first, and nginx reports the collision as a warning rather than an error,
# so `nginx -t` passes. It is here now because the remote half below retires that
# link IN THE SAME INSTALL — the one-change sequence in afc-production.conf's
# header, done by the script rather than by hand.
#
# certbot-deploy-hook.sh is not nginx config, but it ships from here because it
# exists only to reload nginx, and this script already runs as root on the droplet.
FILES=(afc.conf afc-production.conf site-common.conf redirects.conf certbot-deploy-hook.sh)

for f in "${FILES[@]}"; do
  [[ -f "$HERE/$f" ]] || { echo "missing: $HERE/$f" >&2; exit 1; }
done

echo ">>> Deploying ${#FILES[@]} files to $AFC_SSH"

# ── The remote half ─────────────────────────────────────────────────────────
#
# Generated here and shipped, rather than piped to `bash -s` over stdin. With a
# heredoc on stdin, `sudo` has to find a terminal to prompt on and the
# arrangement becomes fragile; sending a file and running `sudo bash <file>`
# leaves stdin alone and gives ONE password prompt for the whole run.
#
# 'REMOTE' is quoted so nothing expands locally — every variable below is
# evaluated on the droplet.

REMOTE_SCRIPT="$(mktemp)"
trap 'rm -f "$REMOTE_SCRIPT"' EXIT

cat > "$REMOTE_SCRIPT" <<'REMOTE'
set -euo pipefail

# Passed as an argument rather than through the environment, because `sudo`
# resets the environment and would silently drop it.
CUTOVER="${1:-}"

STAGED=/tmp/afc-nginx
BACKUP="/tmp/afc-nginx-backup-$(date +%Y%m%d%H%M%S)"

# The two `.conf` files go to conf.d/ because they are complete server blocks and
# afc.conf also holds `limit_req_zone`, an http-context directive. The snippets
# hold server-context directives and MUST NOT be in conf.d/, which nginx includes
# at http level — they would fail to load.
CONF=/etc/nginx/conf.d/afc.conf
PROD=/etc/nginx/conf.d/afc-production.conf
COMMON=/etc/nginx/snippets/afc-common.conf
REDIR=/etc/nginx/snippets/afc-redirects.conf

# The 11ty site's server block, as sites-enabled/ links it. Only the LINK is ever
# removed. Its target in sites-available/ is never touched, which is what makes
# rollback a matter of re-creating one symlink.
LEGACY=/etc/nginx/sites-enabled/andyfitzgeraldconsulting.com
legacy_present() { [ -e "$LEGACY" ] || [ -L "$LEGACY" ]; }

# ── THE INTERLOCKS ────────────────────────────────────────────────────────
#
# All three run before anything is backed up, installed or removed, so a
# refusal leaves the droplet exactly as it was.
#
# 1. THE CUTOVER MUST BE ASKED FOR. While the 11ty link exists, this run would
#    retire it and move the apex — which is right exactly once, and wrong every
#    other time someone runs this to ship an unrelated fix. So it has to be
#    named. Once the link is gone this check has nothing to guard and passes.
#
# 2. A RELEASE MUST EXIST AT THE PRODUCTION ROOT. The precondition afc-
#    production.conf's header lists and `nginx -t` cannot check: nginx never
#    looks at web roots (measured, see validate-nginx.yml), so without this a
#    missing release validates, installs, reloads, and serves 404 to the whole
#    site. The root is READ FROM THE FILE BEING INSTALLED rather than written here
#    a second time, so the check cannot drift away from the config it protects.
#    `index.html` rather than the directory, because an empty release is as much
#    of an outage as a missing one.
#
# 3. THE PREVIEW UPSTREAM MUST ANSWER — WHEN THIS RUN IS THE FLIP. afc.conf
#    proxies the preview host to a Node process, and `nginx -t` looks at
#    upstreams no more than at web roots (measured, see validate-nginx.yml): a
#    proxy to a port nothing listens on validates, installs, reloads, and turns
#    preview into a 502. The address is READ FROM THE FILE BEING INSTALLED, as
#    the production root is, for the same reason.
#
#    It refuses only when the INSTALLED afc.conf does not already proxy there —
#    that is, when this run is the one that moves preview behind the proxy. Once
#    it does, a down process is already a 502 and reinstalling changes nothing,
#    so refusing would only stop an unrelated fix — a redirect, a production
#    header — from shipping because preview happens to be down. So after the
#    flip it warns instead. That is interlock 1's shape: strict for the
#    transition, quiet after it.
#
#    A 200 from `/`, not merely an answer. A process that is up but failing is as
#    broken behind the proxy as one that is not running — and the likeliest
#    failure is exactly that: a missing read token passes the build and 500s
#    every page (see the token check in web/astro.config.mjs).
if legacy_present; then
  if [ "$CUTOVER" != "yes" ]; then
    echo "!!! $LEGACY is still enabled, so this run would be THE CUTOVER:" >&2
    echo "!!! it would retire the 11ty site and move the apex to the Astro build." >&2
    echo "!!! Re-run with AFC_CUTOVER=yes when that is the intent. Nothing was changed." >&2
    exit 1
  fi
  echo ">>> CUTOVER requested: this run retires $LEGACY"
fi

PROD_ROOT="$(sed -nE 's#^[[:space:]]*root[[:space:]]+(/var/www/afc-production/[^;[:space:]]*);.*#\1#p' "$STAGED/afc-production.conf")"
if [ -z "$PROD_ROOT" ]; then
  echo "!!! Could not read the production root from afc-production.conf." >&2
  echo "!!! The interlock depends on it; refusing rather than guessing. Nothing was changed." >&2
  exit 1
fi
if [ ! -f "$PROD_ROOT/index.html" ]; then
  echo "!!! No release at $PROD_ROOT (no index.html)." >&2
  echo "!!! Installing now would serve 404 on the apex. Deploy the site first. Nothing was changed." >&2
  exit 1
fi
echo ">>> Production release present at $PROD_ROOT"

# The `host:port` a config file proxies to, or nothing. Succeeds on a missing
# file, so the first install of afc.conf does not trip `set -e`.
upstream_of() {
  [ -f "$1" ] || return 0
  sed -nE 's#^[[:space:]]*proxy_pass[[:space:]]+http://([0-9.]+:[0-9]+)[;/].*#\1#p' "$1"
}

UPSTREAM="$(upstream_of "$STAGED/afc.conf")"
if [ -z "$UPSTREAM" ]; then
  echo "!!! Could not read the preview upstream from afc.conf." >&2
  echo "!!! The interlock depends on it; refusing rather than guessing. Nothing was changed." >&2
  exit 1
fi
# `|| true`, not `|| echo 000`: curl already prints 000 when nothing answers,
# and appending another would report 000000.
UP_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "http://$UPSTREAM/" || true)"
if [ "$UP_CODE" = "200" ]; then
  echo ">>> Preview upstream answering at $UPSTREAM"
elif [ "$(upstream_of "$CONF")" = "$UPSTREAM" ]; then
  echo ">>> WARNING: the preview upstream $UPSTREAM answered $UP_CODE, not 200."
  echo ">>> The installed afc.conf already proxies there, so this run does not change that."
  echo ">>> Installing anyway. Preview stays broken until the process is fixed — pm2 status, as afc."
else
  echo "!!! The preview upstream $UPSTREAM answered $UP_CODE, not 200 (000 is no answer at all)." >&2
  echo "!!! This run would put preview behind a proxy that cannot serve it." >&2
  echo "!!! Get the preview process serving first. Nothing was changed." >&2
  exit 1
fi

echo ">>> Backing up the installed configuration to $BACKUP"
mkdir -p "$BACKUP"
# `|| true` for the first deploy of each, when it does not exist yet.
for f in "$CONF" "$PROD" "$COMMON" "$REDIR"; do
  cp "$f" "$BACKUP/$(basename "$f")" 2>/dev/null || true
done
# `cp -P` copies the symlink ITSELF rather than the file it points at, so restore
# puts back exactly what was there — the same link to the same target.
if legacy_present; then cp -P "$LEGACY" "$BACKUP/legacy-site"; fi

# ── WHY EVERY FAILURE PATH RESTORES ───────────────────────────────────────
#
# `nginx -s reload` on a bad config fails and leaves the RUNNING config in
# place. That gate protects the running process — not the files on disk.
#
# THE STATE THAT ACTUALLY BITES: new files installed, `nginx -t` fails, so we
# never reload. The site stays up and everything looks fine — until certbot's
# renewal hook or logrotate reloads nginx hours later and it goes down with no
# deploy anywhere near it. The invariant this preserves is that what is on disk
# always equals what is running.
restore() {
  echo "!!! Restoring the previous configuration" >&2
  for f in "$CONF" "$PROD" "$COMMON" "$REDIR"; do
    b="$BACKUP/$(basename "$f")"
    if [ -f "$b" ]; then
      install -m 644 -o root -g root "$b" "$f"
    else
      # Nothing was there before — this was a first deploy. Remove the file
      # rather than leaving a broken one behind.
      rm -f "$f"
    fi
  done
  # A failed cutover must hand the apex back to the 11ty site. Without this the
  # link is gone, afc-production.conf has been removed above, and NOTHING claims
  # the apex — a failed deploy turned into an outage by its own cleanup.
  if [ -e "$BACKUP/legacy-site" ] || [ -L "$BACKUP/legacy-site" ]; then
    cp -P "$BACKUP/legacy-site" "$LEGACY"
    echo "!!! Re-enabled $LEGACY -> $(readlink "$LEGACY" || echo '(a regular file)')" >&2
  fi
  # Prove the restored state is loadable before walking away from it.
  if nginx -t; then
    systemctl reload nginx || true
    echo "!!! Restored and reloaded." >&2
  else
    echo "!!! RESTORED FILES DO NOT PASS nginx -t — MANUAL ATTENTION NEEDED" >&2
  fi
}

echo ">>> Installing"
mkdir -p /etc/nginx/snippets
install -m 644 -o root -g root "$STAGED/afc.conf"            "$CONF"
install -m 644 -o root -g root "$STAGED/afc-production.conf" "$PROD"
install -m 644 -o root -g root "$STAGED/site-common.conf"    "$COMMON"
install -m 644 -o root -g root "$STAGED/redirects.conf"      "$REDIR"

# ── RETIRING THE 11TY SITE, IN THE SAME CHANGE ────────────────────────────
#
# After the install and before the test, so that the test and the reload see
# both halves at once: the new apex block present AND the old one gone. That is
# the whole of the one-change rule in afc-production.conf's header. Either half
# alone passes `nginx -t` and breaks the apex at reload.
CUTOVER_RAN=no
if legacy_present; then
  rm -f "$LEGACY"
  CUTOVER_RAN=yes
  echo ">>> Removed $LEGACY (sites-available/ keeps its target, for rollback)"
fi

echo ">>> Testing"
if ! nginx -t; then restore; exit 1; fi

echo ">>> Reloading"
if ! systemctl reload nginx; then restore; exit 1; fi

# ── THE CERTBOT DEPLOY HOOK ───────────────────────────────────────────────
#
# Installed AFTER the reload, and deliberately outside backup/restore. It is not
# nginx config, so it cannot affect `nginx -t`, and there is no running state
# for it to fall out of step with. If the nginx half above fails, this is never
# reached and whatever hook was installed before stays as it was.
#
# certbot runs only EXECUTABLE files in this directory, silently skipping
# anything else, so the mode is the part that matters. A 644 hook would install
# cleanly and never fire. The directory already exists on a certbot-managed host;
# `mkdir -p` covers a fresh one.
HOOK=/etc/letsencrypt/renewal-hooks/deploy/afc-reload-nginx
echo ">>> Installing the certbot deploy hook to $HOOK"
mkdir -p "$(dirname "$HOOK")"
install -m 755 -o root -g root "$STAGED/certbot-deploy-hook.sh" "$HOOK"

# Keep the last few backups for post-mortems; they are plain text and cost
# nothing. Pruning matters on a droplet that has hit 100% disk once already.
find /tmp -maxdepth 1 -name 'afc-nginx-backup-*' -type d | sort -r | tail -n +6 | xargs -r rm -rf

echo ">>> Installed and reloaded."

if [ "$CUTOVER_RAN" = yes ]; then
  echo
  echo ">>> CUTOVER DONE. One follow-up, once, after the smoke checks pass —"
  echo ">>> move the apex certificate off the nginx authenticator (see afc-production.conf):"
  echo "      certbot reconfigure --cert-name andyfitzgeraldconsulting.com --webroot -w /var/www/certbot"
fi
REMOTE

# ── Ship and run ────────────────────────────────────────────────────────────

echo ">>> Copying files"
ssh "$AFC_SSH" 'mkdir -p /tmp/afc-nginx'
for f in "${FILES[@]}"; do
  scp -q "$HERE/$f" "$AFC_SSH:/tmp/afc-nginx/$f"
done
scp -q "$REMOTE_SCRIPT" "$AFC_SSH:/tmp/afc-nginx/install.sh"

# `-t` allocates a terminal so sudo can prompt. If the ssh user is root, sudo is
# a no-op and nothing is asked.
echo ">>> Running install on the droplet (sudo may prompt)"
# Reduced to one of two fixed words HERE, so no user-supplied text is ever pasted
# into the remote command line and there is no quoting to get wrong.
if [[ "$AFC_CUTOVER" == "yes" ]]; then CUTOVER_ARG=yes; else CUTOVER_ARG=no; fi
ssh -t "$AFC_SSH" "sudo bash /tmp/afc-nginx/install.sh $CUTOVER_ARG"

# ── Smoke check, from HERE rather than from the droplet ─────────────────────
#
# Better than the CI version this replaces, which curled 127.0.0.1 with
# `--resolve` and so proved nothing about DNS, the certificate chain, or the
# firewall. From a laptop it is an ordinary request over the real internet.
#
# It cannot restore on failure — the reload already happened and this process is
# not on the droplet — so a failure here is a REPORT, not a rollback. For the
# preview host, rolling back is re-running this script from an earlier commit.
# FOR THE APEX IT IS NOT: earlier versions neither install nor remove
# afc-production.conf, so it would stay in conf.d/ and keep winning. The apex
# rollback is written out in that file's header.
#
# After a refusal none of this runs: an interlock exits non-zero on the droplet,
# `ssh` returns that, and `set -e` stops here before the first check.
#
# Every status probe below ends `|| true` rather than `|| echo 000`, for the
# reason given at interlock 3: curl prints 000 itself when nothing answers.

SKIPPED=""

echo
echo ">>> Smoke-checking https://$PREVIEW_HOST/"

smoke() {
  if [[ -n "$AFC_STAGING_AUTH" ]]; then
    curl -s --max-time 15 -u "$AFC_STAGING_AUTH" "$@"
  else
    curl -s --max-time 15 "$@"
  fi
}

CODE="$(smoke -o /dev/null -w '%{http_code}' "https://$PREVIEW_HOST/" || true)"

# 401 passes ONLY when we have no credentials to offer. With them, a 401 means
# the htpasswd file is wrong, which should be reported rather than shrugged at.
if [[ -n "$AFC_STAGING_AUTH" ]]; then OK="200 301 302"; else OK="200 301 302 401"; fi
if [[ " $OK " != *" $CODE "* ]]; then
  echo "!!! / returned $CODE" >&2
  # nginx itself is up if it can say this, so the fault is behind the proxy.
  if [[ "$CODE" == 50[234] ]]; then
    echo "!!! nginx answered, but nothing usable did on the proxy port — pm2 status, as afc." >&2
  fi
  exit 1
fi
echo "    1. serving ($CODE)"

# Checks 2–4 need credentials. Without them they are SKIPPED rather than
# ending the run, because the apex checks below need none and matter more.
if [[ -z "$AFC_STAGING_AUTH" ]]; then
  echo "    2–4. SKIPPED — set AFC_STAGING_AUTH to check the 404, X-Robots-Tag and which build answers."
  SKIPPED="preview checks 2–4"
else

  # A missing URL must get a real 404 with OUR page: the status AND the body.
  #
  # Under SSR that page comes from Astro, so the ways this fails are new ones.
  # A 200 is a SOFT 404 — a route rendering something for a slug that does not
  # exist, which a static build cannot do and the `[slug]` routes now guard
  # against by returning the site's 404 when rendered on demand. nginx's own page
  # means the request never reached Node at all, which is a 502 from a process
  # that is down. The version string nginx puts in its error pages is matched as
  # a negative assertion on purpose: it stays true whatever our 404 says.
  #
  # The semicolon case this check was first written for lives in check 8 now.
  # Preview has no `index` or `error_page` left to swallow.
  #
  # The empty-body guard is checked FIRST and is not padding. `grep -q` for that
  # marker also succeeds on an EMPTY string, so a fetch that failed outright would
  # report success — a check that goes green precisely when it cannot see anything.
  #
  # One request for both: the status is appended after a newline, and split back
  # off here, so the body the grep sees is exactly what the server sent.
  RESP="$(smoke -w '\n%{http_code}' "https://$PREVIEW_HOST/__smoke_check_missing__/" || true)"
  CODE="${RESP##*$'\n'}"
  BODY="${RESP%$'\n'*}"
  if [[ -z "$BODY" ]]; then
    echo "!!! 404 probe returned an empty body — the server did not answer." >&2
    exit 1
  fi
  if printf '%s' "$BODY" | grep -q '<hr><center>nginx/'; then
    echo "!!! A missing URL got nginx's own page ($CODE), so it never reached the site." >&2
    echo "!!! A 502 is the preview process being down — pm2 status, as afc." >&2
    exit 1
  fi
  if [[ "$CODE" != "404" ]]; then
    echo "!!! A missing URL returned $CODE, not 404 — the site's page, with the wrong status." >&2
    echo "!!! A 200 is a soft 404: some route is rendering for a slug that does not exist." >&2
    exit 1
  fi
  echo "    2. 404 is the site's own page, with a 404 status"

  # X-Robots-Tag is one of the two things keeping preview out of search results —
  # the ONLY two, since its canonicals now name this host (see afc.conf) — and it
  # is easy to lose silently. It is set once at server level, and nginx REPLACES
  # that inherited set the moment a location declares an `add_header` of its own:
  # give the proxy location one and every page loses the tag while `/.env` keeps
  # it (measured 2026-09-29). `/` goes through that location, so this catches it.
  if ! smoke -D- -o /dev/null "https://$PREVIEW_HOST/" | grep -qi '^x-robots-tag: *noindex'; then
    echo "!!! X-Robots-Tag: noindex is MISSING." >&2
    echo "!!! Preview is indexable. See the add_header note in afc.conf." >&2
    exit 1
  fi
  echo "    3. X-Robots-Tag present"

  # IT IS THE SSR PREVIEW BUILD answering, not merely something. Checks 1–3 pass
  # just as well against the old static staging build — and against the old
  # CONFIG, if this install had somehow not taken. The canonical is what
  # differs: the preview build's `site` is this host, while every static build
  # names the apex. BaseLayout writes the tag, with its attributes in this order.
  BODY="$(smoke "https://$PREVIEW_HOST/" || true)"
  if [[ -z "$BODY" ]]; then
    echo "!!! / returned an empty body — nothing to check." >&2
    exit 1
  fi
  #
  # A bash pattern match, NOT `printf | grep -q`, and that is a correctness fix:
  # the first draft of this check failed against the healthy build. `grep -q`
  # exits on its first match, `printf` is still writing a 225 KB page into the
  # pipe and dies of SIGPIPE (exit 141), and `pipefail` reports the whole
  # pipeline as failed — so a present canonical read as MISSING. Measured
  # 2026-09-29; `PIPESTATUS` read `141 0`. The other greps in this script are
  # piped the same way and survive only because a match there means a small
  # input: nginx's own error page, or a block of headers, both inside the pipe
  # buffer. Anything that has to FIND something in a real page matches this way.
  WANT="<link rel=\"canonical\" href=\"https://$PREVIEW_HOST/\">"
  if [[ "$BODY" != *"$WANT"* ]]; then
    echo "!!! / does not carry $WANT" >&2
    echo "!!! Something other than the SSR preview build is answering. A static build names the apex." >&2
    exit 1
  fi
  echo "    4. the SSR preview build is answering (its canonical names $PREVIEW_HOST)"

fi

# ── THE APEX: AT THE ORIGIN FIRST, THEN THROUGH CLOUDFLARE ────────────────
#
# The apex is proxied, so an ordinary request to it from here measures
# Cloudflare rather than nginx. So checks 5–8 pin the connection to the ORIGIN
# with `--resolve`, at the address ssh itself connects to — `ssh -G` prints the
# resolved client config without connecting, which makes an alias work as well
# as a bare IP. Check 9 then goes through the CDN, because that is what visitors
# actually get.
#
# `--resolve` needs an address. If the ssh target turns out to be a hostname, the
# origin checks are SKIPPED with a warning rather than quietly falling back to
# DNS, which would be Cloudflare again — a check that looks like it tested nginx
# and tested something else.
#
# No `-k` anywhere. The origin presents the real Let's Encrypt certificate for
# both names, so verifying it is part of what these checks prove.

echo
echo ">>> Smoke-checking https://$APEX_HOST/"

ORIGIN_IP="$(ssh -G "$AFC_SSH" | awk '$1 == "hostname" { print $2; exit }')"

origin() {
  curl -s --max-time 15 \
    --resolve "$APEX_HOST:443:$ORIGIN_IP" \
    --resolve "www.$APEX_HOST:443:$ORIGIN_IP" "$@"
}

if [[ ! "$ORIGIN_IP" =~ ^[0-9.]+$ && "$ORIGIN_IP" != *:* ]]; then
  echo "    5–8. SKIPPED — the ssh target resolves to '$ORIGIN_IP', not an IP address,"
  echo "         so the origin cannot be pinned. Use a Host alias whose HostName is an IP."
  SKIPPED="${SKIPPED:+$SKIPPED, }apex origin checks 5–8"
else
  echo "    (origin: $ORIGIN_IP)"

  CODE="$(origin -o /dev/null -w '%{http_code}' "https://$APEX_HOST/" || true)"
  if [[ "$CODE" != "200" ]]; then
    echo "!!! apex / at the origin returned $CODE" >&2
    echo "!!! 000 is no answer at all, or a certificate that did not verify." >&2
    exit 1
  fi
  echo "    5. apex serving at the origin ($CODE)"

  # PRODUCTION MUST BE INDEXABLE, and this is the preview host's check 3 turned
  # round. The two hosts used to share the locations that carried the header,
  # switched by an `$afc_robots` variable, so a mistake in either direction was
  # one variable away. Since the SSR flip production has no X-Robots-Tag
  # directive at all — so what this guards against now is one being ADDED, such
  # as preview's server-level line copied across with the rest of a block.
  #
  # The status-line guard is the empty-body lesson again: "no x-robots-tag
  # header" is ALSO what an empty response says.
  HEADERS="$(origin -D- -o /dev/null "https://$APEX_HOST/" || true)"
  if ! printf '%s' "$HEADERS" | grep -q '^HTTP/'; then
    echo "!!! apex / returned no response headers — nothing to check." >&2
    exit 1
  fi
  if printf '%s' "$HEADERS" | grep -qi '^x-robots-tag'; then
    echo "!!! The apex is sending X-Robots-Tag — production is telling search engines to leave." >&2
    echo "!!! Look for an X-Robots-Tag in afc-production.conf, or in a snippet it includes." >&2
    exit 1
  fi
  echo "    6. apex carries no X-Robots-Tag"

  # www → apex is a BEHAVIOR CHANGE at cutover (the 11ty config served both names
  # directly). A path rather than `/`, so the check also proves $request_uri
  # survives the hop instead of every www URL landing on the home page.
  GOT="$(origin -o /dev/null -w '%{http_code} %{redirect_url}' "https://www.$APEX_HOST/insights/" || true)"
  WANT="301 https://$APEX_HOST/insights/"
  if [[ "$GOT" != "$WANT" ]]; then
    echo "!!! www returned '$GOT', expected '$WANT'" >&2
    exit 1
  fi
  echo "    7. www 301s to the apex, path intact"

  # A missing URL must get OUR 404 page, not nginx's — and the static tier this
  # guards now lives only in afc-production.conf, so this is the only check left
  # that can see the failure it was written for.
  #
  # THE SEMICOLON CASE. Deleting the `;` after `index index.html` PASSES
  # `nginx -t`, because `index` accepts multiple arguments and swallows the
  # `error_page` line that follows — and the site then serves nginx's gray default
  # 404 with nothing reporting an error anywhere. Measured, along with two controls
  # that nginx did catch. The negative assertion and the empty-body guard are the
  # same as check 2's, for the same reasons.
  BODY="$(origin "https://$APEX_HOST/__smoke_check_missing__/" || true)"
  if [[ -z "$BODY" ]]; then
    echo "!!! apex 404 probe returned an empty body — the server did not answer." >&2
    exit 1
  fi
  if printf '%s' "$BODY" | grep -q '<hr><center>nginx/'; then
    echo "!!! apex 404s are serving nginx's default page, not the site's." >&2
    echo "!!! Usually a swallowed error_page directive — check the static tier in afc-production.conf." >&2
    exit 1
  fi
  echo "    8. apex 404 is the site's own page"
fi

# Through the CDN, as a visitor. `cf-ray` is what says the answer really came via
# Cloudflare. Its absence is reported rather than failed: it means the apex is no
# longer proxied, which is a dashboard change worth knowing about, not a broken
# deploy — but it also means every real_ip assumption in afc-production.conf has
# stopped applying.
CDN="$(curl -s --max-time 15 -D- -o /dev/null "https://$APEX_HOST/" || true)"
CODE="$(printf '%s' "$CDN" | awk 'toupper($1) ~ /^HTTP\// { code = $2 } END { print code + 0 }')"
if [[ "$CODE" != "200" ]]; then
  echo "!!! apex / through Cloudflare returned $CODE" >&2
  exit 1
fi
if printf '%s' "$CDN" | grep -qi '^cf-ray:'; then
  echo "    9. apex serving through Cloudflare ($CODE)"
else
  echo "    9. apex serving ($CODE), but WITHOUT a cf-ray header — is the proxy off?"
fi

if [[ -n "$SKIPPED" ]]; then
  echo ">>> Done, with $SKIPPED SKIPPED — verified less thoroughly than it could have been."
else
  echo ">>> Done."
fi
