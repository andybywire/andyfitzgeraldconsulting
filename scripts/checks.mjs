// The code gates, run locally the way .github/workflows/checks.yml runs them on a push.
//
//   pnpm checks
//
// ── WHY IT EXISTS ──────────────────────────────────────────────────────────
//
// Added 2026-11-25, after a third Studio upgrade turned `main` red. Each of the
// five commands below could already be run by hand, and CLAUDE.md listed them,
// but nothing ran all five, so an upgrade went out checked by none of them. A
// Studio upgrade is exactly when to run this: TypeGen ships inside the `sanity`
// package, so upgrading the Studio upgrades the generator, and the types can
// change with no query touched. checks.yml's TypeGen step records the case.
//
// ── WHAT IT MIRRORS, AND THE ONE PLACE IT DIFFERS ──────────────────────────
//
// The same five commands, in the same order, as checks.yml's `code` job. Change
// one list and change the other: checks.yml → EACH CHECK SAYS WHAT FAILED says
// why the list is kept twice rather than CI calling this script.
//
// Order matters for the same reason it does there. TypeGen runs first and leaves
// the regenerated file in place, so `astro check` checks the code against the
// types the queries produce NOW, not against a stale file that could hide an
// error.
//
// Each check runs whatever the others did, as in CI, so one run lists every
// failure. Nothing here stops at the first.
//
// The difference is in the drift check. `git diff` with no revision compares
// the working tree with the INDEX, not with the last commit. In CI the two are
// the same thing. Here, a regenerated file that is staged passes and one that is
// not fails. That is the intended reading: "what you are about to commit
// matches what TypeGen generates." It does not prove the file is committed.
//
// ── WHAT IT DOES NOT DO ────────────────────────────────────────────────────
//
// It does not install. checks.yml installs from the lockfile first; here, run
// `pnpm install` yourself if the lockfile has moved.
//
// It runs none of the SITE gates (links, HTML validation, budgets,
// accessibility). Those need a production build, and each has its own command
// in CLAUDE.md → Commands.

import {spawnSync} from 'node:child_process'
import {join} from 'node:path'

const ROOT = join(import.meta.dirname, '..')

// `fix` is printed under a failed check in the summary. Each one says the same
// thing as that check's `::error::` message in checks.yml, worded for someone
// already at the terminal.
const CHECKS = [
  {
    name: 'TypeGen drift',
    commands: [
      ['pnpm', 'typegen'],
      // `--no-pager`, or a long diff opens `less` and the run waits on a keypress.
      ['git', '--no-pager', 'diff', '--exit-code', 'web/sanity.types.ts'],
    ],
    fix:
      'web/sanity.types.ts changed when regenerated, or has unstaged changes; the diff is above. ' +
      'Review it and commit it with this change. After a Studio upgrade, suspect the generator ' +
      'before any query.',
  },
  {
    name: 'astro check',
    commands: [['pnpm', '--filter', 'web', 'check']],
    fix: 'The site has a type or template error; the output above names the file and line.',
  },
  {
    name: 'Studio type-check',
    commands: [['pnpm', '--filter', 'studio', 'typecheck']],
    fix:
      'The Studio has a type error; the output above names the file and line. After an upgrade, ' +
      'check for two copies of one package (pnpm why), as with @sanity/client in e04044e.',
  },
  {
    name: 'Unit tests',
    commands: [['pnpm', 'test']],
    // checks.yml gives this step two minutes, for the reason its comment gives:
    // a synchronous infinite loop is a hang no test timeout can interrupt.
    timeout: 2 * 60 * 1000,
    fix: 'A unit test failed, timed out, or no test ran; the output above names which.',
  },
  {
    name: 'Prettier',
    commands: [['pnpm', 'exec', 'prettier', '--check', '.']],
    fix:
      'The files listed above are not formatted. `pnpm format` rewrites them; a generated file ' +
      'belongs in .prettierignore instead.',
  },
]

const failed = new Set()

for (const check of CHECKS) {
  console.log(`\n── ${check.name} ${'─'.repeat(Math.max(0, 70 - check.name.length))}\n`)
  // `every` stops at a check's first failing command, as `bash -e` does in a CI
  // step. Without that, a TypeGen crash would be followed by a diff of nothing.
  const passed = check.commands.every(([command, ...args]) => {
    const result = spawnSync(command, args, {
      cwd: ROOT,
      stdio: 'inherit',
      timeout: check.timeout,
    })
    // `status` is null when the process never ran or was killed, the timeout
    // included. Neither is a pass.
    return result.status === 0
  })
  if (!passed) failed.add(check)
}

console.log(`\n── Summary ${'─'.repeat(63)}\n`)
for (const check of CHECKS) {
  if (failed.has(check)) {
    console.log(`  ✘ ${check.name}`)
    console.log(`      ${check.fix}`)
  } else {
    console.log(`  ✔ ${check.name}`)
  }
}
console.log(
  failed.size
    ? `\n${failed.size} of ${CHECKS.length} checks failed.\n`
    : `\nAll ${CHECKS.length} checks passed.\n`,
)

process.exitCode = failed.size ? 1 : 0
