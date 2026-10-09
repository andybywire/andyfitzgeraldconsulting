# POSSE and syndication — deferred

**Deferred 2026-10-09 (Andy):** planned and researched, nothing built. Andy wants to do more writing
on the new site before taking on syndication. This file is the pickup point — the decisions made,
the ones still open, what the research found, and the order of work.

**Re-verify the platform facts before building.** Everything under *What the research found* was
true on 2026-10-09, and social platforms and their APIs move. Start by re-reading the sources at the
bottom.

Related context that stays in CLAUDE.md, phase 8, and is not repeated here: the **microformats
remainder** (`u-syndication`, `p-summary`, `dt-updated`, `rel="webmention"`, `h-feed`), and the
warning that **Cloudflare fails POSSE silently** by challenging the non-browser clients it depends on.

## What this covers

1. **Full-article copies on LinkedIn**, published by hand with the help of a copy tool.
2. **Receiving webmentions**, held for review, with display decided later.
3. **Bluesky and Mastodon**, through Bridgy Publish, chosen at publish time and posted by CI.

## Settled — Andy, 2026-10-09

- **LinkedIn: manual full articles for selected pieces, and no automation.** It is a real publishing
  need. What can be built is a tool that makes the manual copy fast and faithful.
- **Webmentions: receive now, hold everything, decide on display later** — with real data about
  what arrives, rather than a guess. If anything is displayed, start with replies; skip rows of
  liker avatars, which are where bot accounts would show up.
- **Bluesky and Mastodon: Bridgy Publish, with the choice made in the Studio at publish time.**
  Andy's idea was an interstitial on the Publish action. See *The timing catch* below for why the
  posting itself has to happen in CI.

## What the research found — 2026-10-09

### LinkedIn

- **No API creates a native LinkedIn Article** — the long-form editor is not exposed. The Posts API
  has an `article` content type, but it is a **link card**: a URL with a title, a description and a
  thumbnail, which the caller supplies because LinkedIn will not scrape the page.
- **Bridgy does not support LinkedIn at all**, for publishing or for backfeed. Nothing on LinkedIn
  will ever come back as a webmention.
- **A LinkedIn Article cannot name your page as its canonical.** LinkedIn canonicalizes each Article
  to itself. Google says republishing is not penalized but is filtered, so it may show the LinkedIn
  copy in your page's place. The usual practice: publish on the site first, end the LinkedIn copy
  with a link to the original, and consider adapting the copy rather than duplicating it. *Mostly
  SEO-blog sources, some with a commercial interest.*
- **Automating even link-card posts costs upkeep.** A self-serve app posting to a personal profile
  (`w_member_social`) gets a token that lasts 60 days and, as far as could be confirmed, no refresh
  token. Re-authorizing every two months, with automation that fails quietly in between, was judged
  not worth it. *The no-refresh detail rests partly on one vendor's account; check the Developer
  Portal before relying on it.*

### Bridgy Publish — Bluesky and Mastodon

- **What gets posted.** For an entry with a title, Mastodon gets **only the title and a link**.
  Bluesky gets the start of `e-content`, truncated to its limit, falling back to `p-summary` and
  then `p-name`. **An `e-bridgy-bluesky-content` (or `-mastodon-content`) element overrides the text
  per platform**, and can be hidden — which separates "syndication text" from what `p-summary`
  means.
- **How it is triggered.** The page links to `https://brid.gy/publish/bluesky` (an empty, invisible
  `<a>` is enough), and the site sends a webmention to `https://brid.gy/publish/webmention` with
  that link as the target. **Bridgy answers synchronously with `201 Created` and the new post's URL**
  in a JSON `url` field and the `Location` header — so publishing and recording `u-syndication` can
  be one step.
- **Limits.** Bridgy cannot edit a post it published; the documented route is delete and republish
  under a new URL. It will never publish the same URL twice, even after a deletion. Backfeed checks
  only the 30 most recent posts, about every 30 minutes.
- **Bridgy Fed was considered and set aside.** It makes the site itself a fediverse and Bluesky
  account (`@andyfitzgeraldconsulting.com@andyfitzgeraldconsulting.com`), polling the Atom feed.
  People would follow the site rather than Andy's existing accounts, which works against the
  network the site exists to grow.

### Webmentions

- **They are not crawler traffic.** A webmention is a deliberate notice that a page links to yours,
  and the receiving service checks the link is really there. The crawlers in the logs do not send
  them.
- **For this site they would come mostly from Bridgy's backfeed** — replies, likes and reposts on
  Andy's own Bluesky and Mastodon posts — and occasionally from other IndieWeb sites. Real people,
  plus some bot-account likes and reposts: the IndieWeb wiki warns that backfeed can carry
  "likespam". That is the realistic noise.
- **Spam sent straight to an endpoint is documented as rare** — a handful of cases from 2018 to 2024
  on the wiki, and in the 2024 one webmention.io rejected it at verification.
- **webmention.io moderates.** It can hold mentions from first-time senders, or all of them, until
  approved — and **held mentions do not appear in its API**, so a build-time fetch only ever sees
  approved ones. Deleting a mention blocks its source; sources and authors can be muted by domain;
  the API filters by type (`wm-property=in-reply-to` for replies only); and a signed web hook fires
  on each mention.

## The plan, in order

### 1. The LinkedIn-ready copy — first, because it is needed now

**Shape:** a "Copy for LinkedIn" control that puts formatted text on the clipboard — headings,
paragraphs, lists, block quotes, links, images — with a "first published on…" note at the end,
linking the original. **The hard part exists already:** `web/src/lib/feed-html.ts` renders Portable
Text to plain, class-free HTML with absolute URLs for the Atom feeds, which is the same job.

**Open the session with a paste test**, because the design depends on it and only Andy can run it,
in his LinkedIn account: paste a sample carrying each element into LinkedIn's article editor and
note what survives. The likely casualties are **images** — an editor may drop pictures hosted
elsewhere, in which case the fallback is a placeholder per image plus an ordered list to upload by
hand — and **heading levels**, which may flatten. Code blocks are worth testing too.

### 2. Receive webmentions

- Add `<link rel="webmention" href="https://webmention.io/andyfitzgeraldconsulting.com/webmention">`
  to `BaseLayout`.
- **Andy:** sign in at webmention.io with the domain — the footer's `rel="me"` links are what make
  that possible — and set the site to **hold everything**.
- **Prove Cloudflare lets webmention.io and Bridgy through**, per CLAUDE.md's warning, before
  anything depends on it: send a real test webmention and watch it verify, and use Bridgy's preview
  to fetch a real page.

### 3. Bluesky and Mastodon

**The timing catch.** When Andy clicks Publish, the page is not live yet — production rebuilds
about two minutes later — and Bridgy reads the *live* page. So the Publish action cannot call Bridgy
itself. The shape that keeps the choice at publish time:

1. The interstitial records which platforms were chosen, on the document.
2. The deploy finishes.
3. A step at the end of `deploy-astro.yml` sends Bridgy a webmention for each post that has a choice
   recorded and no syndication URL yet, and writes the returned URLs back to Sanity.
4. That write fires the existing publish webhook, and the rebuild puts the `u-syndication` links on
   the page.

**Properties worth keeping:** the dialog appears only on a document's first publish, not every typo
fix — Bridgy could not edit the post anyway. It cannot post twice: CI skips anything that already has
a URL, and Bridgy refuses repeats. **It needs** a Sanity token that can write, as a GitHub secret,
and Andy signed in to Bridgy with both accounts. The hidden `brid.gy/publish/…` links are rendered
from the recorded choice, so the page itself states the intent Bridgy checks for.

**Then the markup:** `u-syndication` from the syndication field, `p-summary`, `dt-updated` from
`_updatedAt`, and the `e-bridgy-*-content` override when syndication text is set. `h-feed` on the
index pages belongs to the same remainder but does not depend on any of this.

## Open questions — all Andy's

- **A. Where the LinkedIn copy lives.** Recommended: **an unlisted page per article on the preview
  site**, rendering the LinkedIn version with a Copy button — it reads drafts and reuses
  `feed-html.ts` as is — shown as a tab beside the document in the Studio. The alternative puts it
  entirely in the Studio, which is a separate package, so the conversion code would be duplicated or
  moved into a new shared package.
- **B. The closing note's wording.** For example, "This article was first published on
  andyfitzgeraldconsulting.com," linked.
- **C. The content model.** Recommended:
  - **`syndicateTo`** — the platforms chosen, Bluesky and/or Mastodon; set by the interstitial,
    visible on the form.
  - **`syndication`** — a list of URLs, filled by CI for Bluesky and Mastodon and pasted by hand for
    LinkedIn. One field for every copy, rendered as `u-syndication`.
  - **`syndicationText`** — optional, about 270 characters at most, falling back to
    `shortDescription`. Without any of it, Bluesky gets the article's opening cut at 300 characters.
    The alternatives were always using `shortDescription`, or making the field required. Mastodon
    gets the title and a link either way.
  - **Which types:** `article` and `note`, as CLAUDE.md has it — or presentations too?
- **D. The interstitial.** Recommended as Andy described it — first publish only — with checkboxes
  on the form too, so the choice can always be seen and changed.
- **Later:** whether to display webmentions at all, once there is data; and the element `h-feed`
  wraps on index pages.

## Sources — read 2026-10-09

- [Bridgy — About](https://brid.gy/about)
- [Bridgy Fed — Docs](https://fed.brid.gy/docs)
- [LinkedIn Posts API (Microsoft Learn)](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-09)
- [LinkedIn programmatic refresh tokens (Microsoft Learn)](https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens)
- [LinkedIn access token 60-day expiry (adaptlypost, vendor)](https://adaptlypost.com/blog/linkedin-access-token-60-days-expires)
- [IndieWeb wiki — Spam](https://indieweb.org/spam)
- [webmention.io (GitHub)](https://github.com/aaronpk/webmention.io)
- [Canonical cross-posting guide (StartupHub, vendor)](https://www.startuphub.ai/news/canonical-cross-posting-guide)
- [Moz Q&A — Republishing blog content on LinkedIn and Medium](https://mozprod.nodebb.com/community/q/topic/62646/republishing-blog-content-on-linkedin-and-medium/3)
