import {escapeHTML, toHTML, uriLooksSafe} from '@portabletext/to-html'
import type {PortableTextComponents} from '@portabletext/to-html'
/* From `astro-portabletext/types`, not `@portabletext/types` — the house rule
   recorded in prose/Prose.astro. The type originates there, but that package is
   transitive and pnpm does not hoist, so a direct import fails to resolve. One
   version of it is installed, so this is the same type identity `toHTML` is
   written against. */
import type {TypedObject} from 'astro-portabletext/types'
import {feedImageAttrs, type SanityImageSource} from '../sanity/image'
import {headingId} from '../components/prose/headingId'

/**
 * Portable Text → HTML for the Atom feeds. Deliberately NOT the site's serializers.
 *
 * ── TWO SERIALIZERS IS THE POINT, NOT AN OVERSIGHT ─────────────────────────────
 *
 * `components/prose/*.astro` renders through Astro's component renderer and needs a
 * render context; this runs in a plain endpoint and returns a string. That alone
 * would force a second implementation. But even if it did not, the two want
 * different output: the site's Figure carries `data-thumbnail`/`data-outline` hooks
 * for scoped CSS that will not travel, and its Code emits Shiki's per-token
 * `color: light-dark()` spans.
 *
 * Andy's rule for the feeds is "standard HTML tags, no site styling imposed", so
 * everything here is semantic tags with no class attributes and no inline styles. A
 * subscriber's reader gets to apply its own typography, which is the whole appeal of
 * reading in one.
 *
 * ── WHAT THE CORPUS ACTUALLY CONTAINS (measured 2026-09-13, production-26) ──────
 *
 * Worth recording, because it is a much smaller surface than the schema allows and
 * the difference is where silent gaps hide:
 *
 *   types       block, figure, code            — nothing else
 *   styles      normal, h2, h3, h4, blockquote
 *   lists       bullet, number                 — 2 documents nest (level > 1)
 *   decorators  strong, em, code               — 0 underline, 0 strike-through
 *   marks       link, one field `href`
 *   table       allowed by the article schema, used by 0 documents
 *
 * `strike-through` is handled anyway because the schema still offers it, and Sanity
 * keeps marks it no longer offers — a stored `underline` from before 2026-08-26
 * would arrive as an unknown mark and be reported by `onMissingComponent` rather
 * than vanishing. `table` is deliberately NOT handled: implementing a renderer for
 * a block type nothing uses is a guess at what it should look like, and the warning
 * is more useful than the guess.
 */

/**
 * Every `href` is resolved against the entry's own permalink before it ships.
 *
 * ── THIS IS A GUARD, AND TODAY IT IS A NO-OP ───────────────────────────────────
 *
 * All 42 insights were checked: every `markDefs[].href` in the corpus is already
 * absolute, none relative, none a bare fragment. So this changes nothing right now
 * and the honest thing is to say so rather than imply it is load-bearing.
 *
 * It stays because the failure it prevents is invisible. A relative `href` in a feed
 * resolves against the READER'S origin, so it would 404 inside someone's reader
 * while working perfectly on the site and in every local check. `new URL(href, base)`
 * is idempotent on an absolute URL, so the guard costs one allocation per link and
 * removes a whole class of "works here, broken there".
 *
 * `uriLooksSafe` comes from the library and is what its own default link component
 * uses — it rejects `javascript:` and friends. Kept, because the content model lets
 * an editor type any string into a link annotation.
 */
function absolutize(href: string | undefined, permalink: string): string | null {
  if (!href) return null
  try {
    const resolved = new URL(href, permalink).href
    return uriLooksSafe(resolved) ? resolved : null
  } catch {
    /* A href that will not parse even against a base is not a link. Drop the
       anchor, keep the text — the sentence still reads. */
    return null
  }
}

/**
 * Escaping for the inside of a <pre>, and NOT the library's `escapeHTML`.
 *
 * ── THE LIBRARY'S VERSION TURNS SPACE RUNS INTO `&nbsp;`, WHICH BREAKS CODE ────
 *
 * Measured, not assumed: `escapeHTML('a    b')` returns `'a&nbsp;&nbsp;&nbsp; b'`.
 * For prose that is a considered default — consecutive spaces collapse in HTML, so
 * preserving an author's spacing means making them non-breaking, and it is left alone
 * everywhere else in this file.
 *
 * Inside a <pre> it is both unnecessary and harmful. Unnecessary because `white-space:
 * pre` already preserves runs, so nothing needs protecting. Harmful because the
 * character that arrives is U+00A0, not a space — so every indented line a reader
 * copies out carries non-breaking spaces into the paste. A shell will not run it, and
 * Python will not even parse it. Three code blocks are in range today, and the
 * indented ones are exactly the ones somebody would copy.
 *
 * So: the three characters that actually have meaning in HTML, and nothing else.
 * Quotes need no handling because this is character data, never an attribute value.
 */
const escapeCode = (code: string): string =>
  code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export interface FeedHtmlOptions {
  /**
   * The entry's canonical URL. The base for `absolutize`, so a relative link
   * resolves the way it would on the page it came from.
   */
  permalink: string
}

function components({permalink}: FeedHtmlOptions): PortableTextComponents {
  return {
    block: {
      /**
       * Headings carry the same ids the site gives them, via the shared
       * `headingId` — whose parameter types are structural precisely so a
       * non-Astro caller can reach it.
       *
       * An id is not styling, so it does not violate the no-site-styling rule, and
       * it costs roughly twenty bytes. What it buys is that a link written as
       * `…/insights/x/#some-heading` lands on the right place if a reader resolves
       * it, and that the fragment matches the site rather than inventing a second
       * scheme for the same document.
       */
      h2: ({value, children}) => `<h2 id="${escapeHTML(headingId(value))}">${children}</h2>`,
      h3: ({value, children}) => `<h3 id="${escapeHTML(headingId(value))}">${children}</h3>`,
      h4: ({value, children}) => `<h4 id="${escapeHTML(headingId(value))}">${children}</h4>`,
      /* normal → <p> and blockquote → <blockquote> are library defaults and are
         left alone. Restating them here would be a second place to get them wrong. */
    },

    marks: {
      link: ({value, children}) => {
        const href = absolutize(value?.href, permalink)
        return href ? `<a href="${escapeHTML(href)}">${children}</a>` : children
      },
      /**
       * `<s>`, not the library's default `<del>` — matching `prose/Strike.astro`,
       * which records the reason: `<del>` is an editorial revision and takes
       * `cite`/`datetime`, while this means "no longer accurate or relevant".
       * Unused in the corpus today; present because the schema still offers it.
       */
      'strike-through': ({children}) => `<s>${children}</s>`,
    },

    types: {
      /**
       * The figure block IS the image object — `asset`, `crop` and `hotspot` sit at
       * its top level, because the schema type extends `image`. So it goes straight
       * to the URL builder with no unwrapping, exactly as `prose/Figure.astro`
       * passes `node` to <SanityImage>.
       *
       * One URL, no srcset: see `feedImageAttrs`, which exists so that `width` and
       * `height` describe the file actually being served.
       *
       * A null return means an unusable asset ref, and emits nothing rather than a
       * broken image — same call as <SanityImage> makes.
       */
      figure: ({value}) => {
        const node = value as SanityImageSource & {caption?: string | null}
        const img = feedImageAttrs(node)
        if (!img) return ''

        /* Alt falls back to '' rather than to the caption. An empty alt marks an
           image as decorative, which is wrong here but honest; repeating the caption
           would make a screen reader read the same sentence twice. Body figures are
           clean anyway — 0 of 142 lack altText. */
        const alt = escapeHTML(node.altText ?? '')
        const caption = node.caption ? `<figcaption>${escapeHTML(node.caption)}</figcaption>` : ''

        return (
          `<figure>` +
          `<img src="${escapeHTML(img.src)}" width="${img.width}" height="${img.height}" alt="${alt}" />` +
          caption +
          `</figure>`
        )
      },

      /**
       * Plain <pre><code>, and NOT the site's Shiki highlighter.
       *
       * Shiki emits one <span style="color: light-dark(…)"> per token. That is site
       * styling imposed on the reader, which is the thing Andy ruled out — and it
       * would not even work: `light-dark()` goes unresolved in most feed readers, so
       * the likely outcome is unstyled-or-invisible text rather than pretty code.
       * It also multiplies the bytes of every code block several times over.
       *
       * `language-x` on the <code> is the HTML5 convention and is what a reader
       * would key its own highlighting off, so the information survives even though
       * the colors do not. Four languages in the corpus: sh, yaml, javascript, and
       * null — hence the conditional.
       *
       * The old 11ty serializer interpolated `value.code` unescaped. A sample
       * containing a raw `<` would have produced a malformed feed; escaping is not
       * optional here — but it is `escapeCode` rather than the library's `escapeHTML`,
       * for the copy-paste reason recorded above it.
       */
      code: ({value}) => {
        const node = value as {code?: string | null; language?: string | null}
        if (!node.code) return ''
        const lang = node.language ? ` class="language-${escapeHTML(node.language)}"` : ''
        return `<pre><code${lang}>${escapeCode(node.code)}</code></pre>`
      },
    },
  }
}

/**
 * Serialize one Portable Text array to feed HTML.
 *
 * ── `onMissingComponent` WARNS RATHER THAN DROPPING, ON PURPOSE ────────────────
 *
 * The library's default is already a console warning, but it is restated here with
 * a `[feed-html]` prefix so a message in a build log says which of the two
 * serializers produced it.
 *
 * This is the guard against the failure this build keeps re-learning: a block type
 * with no component renders as nothing at all, the feed stays valid, the build stays
 * green, and a document quietly ships with a hole in it. A `table` block, or a bare
 * `image` block of the kind `singleton.bodyText` still allows, would both land here.
 */
export function toFeedHtml(
  blocks: TypedObject[] | null | undefined,
  options: FeedHtmlOptions,
): string {
  if (!blocks || blocks.length === 0) return ''

  return toHTML(blocks, {
    components: components(options),
    onMissingComponent: (message, {type, nodeType}) => {
      console.warn(`[feed-html] ${message} (${nodeType} "${type}") in ${options.permalink}`)
    },
  })
}
