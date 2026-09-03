import {createHighlighter} from 'shiki'

/**
 * Syntax highlighting, built once and shared.
 *
 * ── IT RUNS AT BUILD TIME AND NEVER REACHES THE READER ───────────────────────
 *
 * Shiki is a server module here. The production build is static, so this executes
 * while pages are generated and what ships is plain HTML with coloured spans — no
 * runtime JS, no client bundle, nothing to hydrate. That is why the size of the
 * grammar bundle is a build cost and not a page-weight cost, and why the bundled
 * entry point is used rather than the fine-grained one: the tradeoff it makes is
 * in a currency this build does not spend.
 *
 * ── A SINGLETON, VIA TOP-LEVEL AWAIT ────────────────────────────────────────
 *
 * `createHighlighter` loads and compiles seven TextMate grammars and two themes.
 * Doing that per
 * block would repeat it 25 times in a build and, worse, ONCE PER REQUEST in the
 * SSR preview environment. Module scope makes it once per process.
 *
 * Top-level await rather than an exported async factory, so `Code.astro` stays a
 * SYNCHRONOUS component. That matters more than it looks: astro-portabletext
 * invokes type serializers itself, and keeping the component sync means not
 * depending on the library awaiting them.
 *
 * ── TWO REAL THEMES, SWITCHED BY `light-dark()` ─────────────────────────────
 *
 * GitHub's light and dark, chosen 2026-08-26 over a token-bound scheme that
 * proved too quiet to be worth the dependency.
 *
 * THE `-default` PAIR, NOT `github-light` / `github-dark`. Those two are the
 * legacy themes; the `-default` pair is what github.com actually renders today, so
 * this is the more faithful choice as well as the better-measuring one. The legacy
 * dark theme's comment grey is #6a737d, which fails AA on this project's dark code
 * ground at 3.35 — and fails on GitHub's OWN background too, at 3.05. The current
 * theme lightens it to #8b949e and measures 5.24 here.
 *
 * THE SWITCHING COSTS NOTHING, which is the reason this shape works. Shiki's
 * documented dual-theme pattern emits one theme inline and the other as a CSS
 * variable, then asks you to override it — with `!important`, because an inline
 * style wins. `defaultColor: 'light-dark()'` avoids all of that: each token comes
 * out as
 *
 *     color: light-dark(#24292e, #e1e4e8)
 *
 * and CSS `light-dark()` resolves against `color-scheme`, which base.css ALREADY
 * sets for all three theme states — `light dark` by default, pinned to one value
 * when a reader has chosen. So the code blocks follow the site's theme through the
 * mechanism that already exists, with no second set of theme blocks, no
 * `!important`, and nothing for a theme toggle to keep in step.
 *
 * Support is not a concern relative to what this build already requires:
 * `light-dark()` is Safari 17.5 where the style container queries the whole layout
 * rests on are Safari 18. And it fails safe — an unsupported `light-dark()` is an
 * invalid colour, so the token inherits the block's text colour and the code is
 * unhighlighted but perfectly readable.
 */
const THEMES = {light: 'github-light-default', dark: 'github-dark-default'} as const

/**
 * WHAT IS COVERED. The first four are confirmed against the dataset — `sh` (21
 * blocks), `yaml` (13), `javascript` (2), `css` (1) — plus one block with no
 * language at all, which falls to plain text.
 *
 * `shellscript` is the grammar's real name and registers `bash`, `sh`, `shell` and
 * `zsh` as ALIASES, which is why the stored value `sh` resolves without appearing
 * here. One grammar covers four things an editor might pick.
 *
 * `python`, `typescript` and `html` have NO content behind them yet — added
 * 2026-08-26 as likely. That is a deliberate exception to this project's rule
 * against building on spec, and the distinction is worth keeping straight: a
 * grammar is DATA, so pre-loading one costs a little build time and guesses at
 * nothing. A SERIALIZER written against no content would instead be guessing at
 * what the content looks like, which is why `table` is still unbuilt.
 *
 * Adding more is this list plus a rebuild — `json` and `markdown` are the obvious
 * next two. Until then `highlight()` degrades safely, so an unlisted language costs
 * colour rather than a build.
 */
const LANGS = ['shellscript', 'yaml', 'javascript', 'typescript', 'css', 'html', 'python']

const highlighter = await createHighlighter({themes: Object.values(THEMES), langs: LANGS})

/**
 * Highlight one block, returning a complete `<pre>` element.
 *
 * ── UNKNOWN LANGUAGES DEGRADE, THEY DO NOT FAIL THE BUILD ────────────────────
 *
 * `language` is a free string chosen from the code-input plugin's own list, which
 * is far longer than the seven grammars loaded above. Shiki THROWS on a language it
 * has not loaded, so an editor picking `rust` would otherwise break the build — a
 * content edit taking the site down is not an acceptable failure mode for a
 * styling nicety.
 *
 * So an unknown language falls back to plain text and warns at build time. The
 * block still renders, still scrolls, still reads correctly; it simply is not
 * coloured, and the warning says which grammar to add to LANGS.
 */
export function highlight(code: string, language?: string | null): string {
  const requested = language ?? 'text'

  const render = (lang: string) =>
    highlighter.codeToHtml(code, {
      lang,
      themes: THEMES,
      /* Emit `color: light-dark(light, dark)` rather than one theme inline and the
         other as a variable to be overridden. See the note on THEMES above. */
      defaultColor: 'light-dark()',
      transformers: [
        {
          pre(node) {
            /* Shiki writes the theme's own `background-color` and `color` inline
               on the <pre>. Dropped, so the block keeps OUR ground —
               `surface-muted`, seated in the tonal layering — rather than GitHub's
               #ffffff and #24292e. A pure-white panel on this page's near-white
               ground would stop reading as a panel at all.
               Only the <pre> is stripped; the token spans keep their colours,
               which is the half of the theme worth having. */
            delete node.properties.style

            /* Re-applied here because this `<pre>` is Shiki's, not the one the
               component used to write. `tabindex` keeps the scroll region keyboard
               reachable (WCAG 2.1.1) and `data-language` carries the stored value
               through to the markup. */
            node.properties.tabindex = '0'
            if (language) node.properties['data-language'] = language
          },
        },
      ],
    })

  try {
    return render(requested)
  } catch {
    console.warn(
      `[highlight] no grammar for "${requested}" — rendering it unhighlighted. ` +
        `Add it to LANGS in components/prose/highlighter.ts if it is here to stay.`,
    )
    return render('text')
  }
}
