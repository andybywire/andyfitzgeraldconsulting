# Moz notes

Andy has a comped **Moz Pro "Large + 500 Keywords"** account, **without API access**. These notes
record which parts of it serve this site's actual goal, so a future look at it starts from a
judgment rather than from the feature list. Written 2026-10-02, after the first Site Crawl review
since cutover.

**The test for every feature is the business logic in CLAUDE.md:** work arrives through Andy's
network, so what matters is who finds, cites and remembers the work — not where it ranks. Most of
Moz measures search position, which is not that channel. The parts below that pass the test are the
ones that show **who links to the site** and **whether AI assistants name Andy** for his topics.

This is not a task list. Nothing here is scheduled.

## Already earning its keep: Site Crawl

An outside crawler, through Cloudflare, needing no setup. Its first review after cutover found two
real defects, neither visible to anything in the repo:

- **Redirect chains from the site's own links.** 45 hand-typed `https://www.…` hrefs in 17 articles,
  mostly to the Jekyll-era `/writing/` scheme. Fixed in the content; see the chain note in
  `nginx/redirects.conf`.
- **Cloudflare Email Obfuscation, on since the zone was created**, rewriting SSH `user@host`
  strings in code samples into 404 links. Off now; see the Cloudflare checklist in
  `nginx/afc-production.conf`, which also records the edge-versus-origin check that replaced the one
  that missed it.

Keep it as link checking even after phase 8's quality gates exist. CI checks the build; this checks
what the public is actually served, after the CDN.

**Deliberately ignored: "URL too long."** Most of the remaining crawl issues are this. It is a
readability heuristic, and this site has a long domain and descriptive slugs on purpose. Slugs are
also permanent — syndicated copies link to them — so shortening one creates a redirect, which is the
problem the first fix above removed.

## Worth investigating

**Link Explorer → Top Pages, filtered to 4xx.** Pages other sites link to that now return an error —
the one question Moz answers that nothing in this project can, because it sees inbound links. Run
once on 2026-10-02: the only hit was the Email Obfuscation link above. **Repeat after any URL
change** — a renamed slug, a document re-typed into another branch — since the 301 map only covers
URLs someone knew about.

**Link Explorer → discovered and lost linking domains, roughly monthly.** Read as a "who cited me"
feed, not a metric: a new linking domain is usually a person — a conference page, a reading list, a
peer's post — and often worth a thank-you. Limits: it catches only mentions that link, and Moz's index
of a small site is partial. Webmentions (phase 8) will do this better for IndieWeb sites; Moz covers
the rest of the web.

**AI Visibility — the closest match to "think of me for their project."** Tracks whether ChatGPT
and Gemini mention a name for prompts you define, how early in the answer, against up to three
others. Reported as on the **Medium plan and up** (The Next Web, May 2026), so check whether the
comped plan actually includes it. Treat any result as a trend line, not a score: AI answers vary run
to run, and the feature is new. What moves it is work this project already does — being cited
elsewhere, and a consistent entity in the JSON-LD `Person` and `Organization` nodes.

Related, and not Moz: **AI tools can only cite a site their crawlers can fetch.** On 2026-10-02,
requests sent as GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot and Google-Extended all got 200. That
is suggestive, not proof — Cloudflare verifies real bots by IP, which a faked user agent cannot test.
The authoritative answer is the AI-crawler setting under Security → Bots in the Cloudflare dashboard.
Moz also lists an "AI Agent Readiness Checker"; not yet looked at.

**Link Intersect — only if pitching.** Sites that link to peers you name but not to you. In this field
that means podcasts, conferences and publications covering these topics that haven't found Andy yet:
an invitation list, useful only if outreach is wanted.

## Probably not worth the time

- **Rank Tracker.** Leads don't come from rankings, and the terms Andy wants to own have tiny search
  volumes. Google Search Console shows the queries the site actually appears for, from Google's own
  data, for free — if it is not set up for the apex domain with the current sitemap, that comes first.
- **Keyword Explorer.** Most of these terms show no volume data. At most a tiebreaker when choosing
  between two labels for a Topic concept, since `prefLabel`s are now public filter names and search
  terms.
- **Domain Authority, Brand Authority, On-Page Grader, Keyword Gap.** Moz's own scores and generic
  checklists. None says anything about who knows the work.

## Sources

- [Moz Pro now tracks your brand inside ChatGPT and Gemini](https://thenextweb.com/news/moz-pro-ai-visibility-chatgpt-gemini-tracking) — The Next Web, May 2026
- [Moz Pro Review 2026](https://getspike.ai/blog/moz-pro-review-b2b-teams/) — Spike
- [The Complete Guide to Moz Pro](https://backlinko.com/hub/seo/moz-pro) — Backlinko
- [Email Address Obfuscation](https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/) — Cloudflare docs
