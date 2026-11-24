/**
 * A `node --test` reporter that fails the run when it ran no tests.
 *
 * ── WHY IT EXISTS: A GLOB THAT MATCHES NOTHING PASSES ───────────────────────
 *
 * `node --test 'src/**\/*.test.ts'` exits 0 when the glob matches no file, reporting
 * "tests 0" — measured on Node 24.19, 2026-11-21. So a renamed directory, a mistyped
 * pattern or a test file given the wrong suffix would leave the gate green while it tested
 * nothing, which is the one failure a gate must not have. Node has no flag for it.
 *
 * The external link check has the same trap and the same answer: lychee exits 0 on a run
 * that checked nothing, so check-external-links.mjs exits non-zero instead.
 *
 * ── HOW IT RUNS: AS A SECOND REPORTER, NOT A WRAPPER ────────────────────────
 *
 * web/package.json's `test` script names two reporters: Node's own `spec`, which prints
 * what a reader wants, and this one, which prints nothing unless the count is zero. A
 * wrapper calling `run()` from node:test was the alternative, and would have reimplemented
 * the CLI — its reporters, its exit code, its watch mode — to add one check.
 *
 * A reporter cannot fail a test, but it runs in the runner's own process, so setting
 * `process.exitCode` fails the run. Proven by pointing the script at a directory with no
 * tests: exit 1, with the message below.
 */
export default async function* requireTests(source) {
  let ran = 0
  for await (const event of source) {
    if (event.type === 'test:pass' || event.type === 'test:fail') ran++
  }
  if (ran === 0) {
    process.exitCode = 1
    yield '\nNo tests ran. The glob in web/package.json\'s "test" script matched no test file.\n'
  }
}
