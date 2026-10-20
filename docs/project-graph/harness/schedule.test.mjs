/**
 * The schedule runner's tests, which launch nothing:
 * `node --test docs/project-graph/harness/schedule.test.mjs`.
 *
 * They pin what the 15 runs rest on: the order and prompts come from protocol.md as recorded, a
 * protocol that can't be read is refused, and every stop rule fires where it should. runOne() and
 * the CLI are stand-ins, so the launch itself is proven only by the first real run.
 *
 * Proven by failing (2026-10-19): a copy of schedule.mjs with the cap rule loosened to three and
 * the CLI check removed failed exactly the three tests for those rules: the second capped run, the
 * CLI change, and the resume that checks both. One expectation was wrong
 * at first, not the runner: with $185 spent, three $2 runs fit under $200 before a fourth could
 * pass it, and the test said one.
 */
import assert from 'node:assert/strict'
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join, resolve} from 'node:path'
import {test} from 'node:test'
import {fileURLToPath} from 'node:url'
import {SETTINGS, planFromProtocol, runSchedule, spentUnder, verdict} from './schedule.mjs'

const PROTOCOL = readFileSync(
  resolve(fileURLToPath(new URL('..', import.meta.url)), 'protocol.md'),
  'utf8',
)
const {plan, problems} = planFromProtocol(PROTOCOL)

const record = (over = {}) => ({
  completed: true,
  isolated: true,
  cli: {version: '2.1.302'},
  result: {total_cost_usd: 2, subtype: 'success'},
  ...over,
})
const capped = record({
  completed: false,
  result: {is_error: true, subtype: 'error_max_budget_usd', total_cost_usd: 10.4},
})

/** The schedule over the real plan, with stand-ins: `scripted` records by id, everything else clean. */
function schedule({scripted = {}, cli = () => '2.1.302', existing = () => null, spent = 20} = {}) {
  const launched = []
  const out = runSchedule({
    plan,
    runOne: (spec) => (launched.push(spec), scripted[spec.id] ?? record()),
    cliVersion: cli,
    existing,
    spent,
  })
  return {...out, launched}
}

test('the protocol reads as 15 runs in order, one per task per arm, with each prompt verbatim', () => {
  assert.deepEqual(problems, [])
  assert.deepEqual(
    plan.map((p) => p.id),
    Array.from({length: 15}, (_, i) => `r${String(i + 1).padStart(2, '0')}`),
  )
  assert.deepEqual(
    [plan[0], plan[6], plan[14]].map((p) => `${p.task}${p.arm}`),
    ['T1A', 'T3C', 'T5A'],
  )
  assert.equal(new Set(plan.map((p) => p.task + p.arm)).size, 15)
  assert.match(
    plan[0].prompt,
    /^After a message is sent on the contact page.*but don't edit any files\.$/,
  )
  assert.ok(plan.every((p) => p.prompt && /^pg-arm-[abc]$/.test(p.branch)))
})

test('a protocol with a wrong id and a missing prompt is refused on both counts', () => {
  const broken = PROTOCOL.replace('| T3   | C (`r07`)', '| T3   | C (`r16`)').replace(
    /^### T4:.*\n\n> /m,
    '### T4: x\n\n',
  )
  const found = planFromProtocol(broken).problems
  assert.equal(found.length, 2)
  assert.match(found.join(' '), /no prompt under "### T4:"/)
  assert.match(found.join(' '), /not r01 to r15/)
})

test('a clean schedule runs all 15 in order, each with the recorded settings', () => {
  const r = schedule()
  assert.equal(r.stopped, null)
  assert.deepEqual(
    r.ran,
    plan.map((p) => p.id),
  )
  for (const s of r.launched) {
    assert.equal(s.model, SETTINGS.model)
    assert.equal(s.effort, 'high')
    assert.equal(s.budgetUsd, 10)
    assert.deepEqual(s.allowedTools, SETTINGS.allowedTools)
  }
})

test('a run that is not isolated, or did not complete, stops the schedule after itself', () => {
  let r = schedule({scripted: {r03: record({isolated: false})}})
  assert.deepEqual(r.ran, ['r01', 'r02', 'r03'])
  assert.match(r.stopped, /r03 is invalid/)
  r = schedule({
    scripted: {
      r04: record({
        completed: false,
        result: {is_error: true, subtype: 'error_during_execution', total_cost_usd: 1},
      }),
    },
  })
  assert.equal(r.ran.at(-1), 'r04')
  assert.match(r.stopped, /invalid/)
})

test('one capped run is kept; a second, even by cost alone, stops the schedule', () => {
  assert.equal(schedule({scripted: {r02: capped}}).stopped, null)
  const r = schedule({
    scripted: {r02: capped, r09: record({result: {total_cost_usd: 10.01, subtype: 'success'}})},
  })
  assert.equal(r.ran.at(-1), 'r09')
  assert.match(r.stopped, /second run to hit the cap/)
  assert.equal(verdict({...capped, isolated: false}), 'invalid')
})

test('a CLI change stops the schedule before the next launch', () => {
  let calls = 0
  const r = schedule({cli: () => (++calls >= 5 ? '2.1.310' : '2.1.302')})
  assert.deepEqual(r.ran, ['r01', 'r02', 'r03', 'r04'])
  assert.match(r.stopped, /2\.1\.302 to 2\.1\.310/)
})

test('the budget stops the schedule before a launch could pass $200', () => {
  // $185 spent: $195, $197 and $199 at worst leave room, so three $2 runs go, and the fourth,
  // at $191 plus its $10 cap, could pass $200.
  const r = schedule({spent: 185})
  assert.deepEqual(r.ran, ['r01', 'r02', 'r03'])
  assert.match(r.stopped, /\$191\.00 spent/)
})

test('a resume skips good records, counts an earlier cap, and checks the CLI against them', () => {
  const done = {r01: record(), r02: capped, r03: record()}
  let r = schedule({
    scripted: {r07: record({result: {total_cost_usd: 11, subtype: 'success'}})},
    existing: (id) => done[id] ?? null,
  })
  assert.equal(r.ran[0], 'r04')
  assert.match(r.stopped, /r07 is the second run to hit the cap/)
  r = schedule({cli: () => '2.1.310', existing: (id) => (id === 'r01' ? record() : null)})
  assert.equal(r.launched.length, 0)
  assert.match(r.stopped, /changed/)
})

test('an invalid record on disk stops the schedule before anything launches', () => {
  const r = schedule({
    existing: (id) => (id === 'r02' ? record({isolated: false}) : id === 'r01' ? record() : null),
  })
  assert.equal(r.launched.length, 0)
  assert.match(r.stopped, /r02 has a record that is not valid/)
})

test('what was spent is summed from run records, and usage and meta files are not counted', () => {
  const dir = mkdtempSync(join(tmpdir(), 'spent-'))
  try {
    mkdirSync(join(dir, 'a'))
    writeFileSync(join(dir, 'a', 'a.json'), JSON.stringify({result: {total_cost_usd: 1.25}}))
    writeFileSync(join(dir, 'a', 'usage.json'), JSON.stringify({result: {total_cost_usd: 99}}))
    writeFileSync(join(dir, 'a', 'meta.json'), JSON.stringify({result: {total_cost_usd: 99}}))
    writeFileSync(join(dir, 'b.json'), JSON.stringify({result: {total_cost_usd: 2.5}}))
    writeFileSync(join(dir, 'c.json'), 'not JSON')
    assert.equal(spentUnder(dir), 3.75)
  } finally {
    rmSync(dir, {recursive: true, force: true})
  }
})
