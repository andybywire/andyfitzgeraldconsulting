/**
 * The harness's tests that need no launch: `node --test docs/project-graph/harness/harness.test.mjs`.
 *
 * They pin the parts a run's validity rests on: the launch switches memory off and scrubs every
 * inherited CLAUDE* variable, the control differs only in that, and the isolation check flags
 * each leak the guide's trial found while passing a clean transcript. The launch itself is proven
 * only by canary.mjs.
 *
 * Each was proven by failing: removing a fingerprint from BANNED, or never switching memory off,
 * failed exactly the tests for it (protocol.md → "The headless harness"). The CLAUDE_EFFORT test
 * was written before its fix and failed against the old CLAUDE_CODE_* filter, with the launch
 * still carrying 'xhigh'.
 */
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {BANNED, buildLaunch, changes, isolationProblems, userTexts} from './harness.mjs'

const base = {prompt: 'Say hello.', model: 'claude-opus-5-5', effort: 'low', budgetUsd: 1}
const line = (record) => JSON.stringify(record)
const user = (content) => line({type: 'user', message: {role: 'user', content}})

/**
 * Set `vars` in process.env for the length of `fn`, then put back what was there. Restoring
 * matters because these tests are often run from inside a Claude Code session, whose own
 * CLAUDECODE and CLAUDE_EFFORT are already set: deleting them afterward would change the
 * environment of every test that follows.
 */
function withEnv(vars, fn) {
  const before = Object.fromEntries(Object.keys(vars).map((key) => [key, process.env[key]]))
  Object.assign(process.env, vars)
  try {
    return fn()
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

test('the launch switches memory off, refuses unlisted tools, and loads no MCP servers', () => {
  const {command, args, env} = buildLaunch({...base, allowedTools: ['Read', 'Bash(ls *)']})
  assert.equal(command, 'claude')
  assert.equal(env.CLAUDE_CODE_DISABLE_AUTO_MEMORY, '1')
  assert.deepEqual(args.slice(0, 2), ['-p', 'Say hello.'])
  for (const flag of ['--output-format', '--max-budget-usd', '--strict-mcp-config'])
    assert.ok(args.includes(flag))
  assert.equal(args[args.indexOf('--permission-mode') + 1], 'dontAsk')
  assert.equal(args[args.indexOf('--allowedTools') + 1], 'Read Bash(ls *)')
})

test('the inherited Claude environment is scrubbed, and the control differs only in memory', () => {
  withEnv({CLAUDECODE: '1', CLAUDE_CODE_ENTRYPOINT: 'test'}, () => {
    const on = buildLaunch(base)
    const off = buildLaunch({...base, memoryOff: false})
    assert.equal(on.env.CLAUDECODE, undefined)
    assert.equal(on.env.CLAUDE_CODE_ENTRYPOINT, undefined)
    assert.equal(off.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY, undefined)
    assert.deepEqual(on.args, off.args)
  })
})

/*
 * The desktop app sets Claude variables OUTSIDE the CLAUDE_CODE_* pattern, and the first scrub let
 * them through. CLAUDE_EFFORT is the one that matters: the launch passes --effort, and which of the
 * two wins was never tested, so a run started from inside the app might take the app's effort
 * rather than its own. The second assertion is the general one: the only Claude variable a launch
 * carries is the one the harness sets.
 */
test('every inherited CLAUDE* variable is scrubbed, CLAUDE_EFFORT included', () => {
  withEnv({CLAUDE_EFFORT: 'xhigh', CLAUDE_PID: '1', CLAUDE_AGENT_SDK_VERSION: '0'}, () => {
    const {env} = buildLaunch(base)
    assert.equal(env.CLAUDE_EFFORT, undefined)
    assert.deepEqual(
      Object.keys(env).filter((key) => key.startsWith('CLAUDE')),
      ['CLAUDE_CODE_DISABLE_AUTO_MEMORY'],
    )
  })
})

test('a launch missing its model, effort, prompt or budget is refused', () => {
  for (const key of ['prompt', 'model', 'effort', 'budgetUsd']) {
    assert.throws(() => buildLaunch({...base, [key]: undefined}), new RegExp(key))
  }
})

test('a clean transcript, with the prompt verbatim, is isolated', () => {
  const transcript = [
    user('Say hello.'),
    line({type: 'assistant', message: {content: [{type: 'text', text: 'Hello.'}]}}),
  ].join('\n')
  assert.deepEqual(isolationProblems(transcript, 'Say hello.'), [])
})

/*
 * Written out here, NOT read from BANNED. The first version of this test looped over BANNED itself,
 * so removing an entry from the list removed it from the test too, and a weakened harness still
 * passed every test. These are the fingerprints the guide's trial actually showed (guide-trial.md).
 */
const TRIAL_LEAKS = [
  'MEMORY.md',
  'persistent file-based memory',
  'project-graph-experiment',
  'side-session-notes',
  'Shared notes folder',
  'Background (from the session that started this one)',
]

test("every fingerprint of the trial's leaks is banned", () => {
  for (const text of TRIAL_LEAKS) assert.ok(BANNED.includes(text), `BANNED lacks "${text}"`)
})

test('each leak the trial found is flagged', () => {
  for (const text of TRIAL_LEAKS) {
    const transcript = [
      user([{type: 'text', text: `<system-reminder>${text}</system-reminder>`}]),
      user('Say hello.'),
    ].join('\n')
    assert.deepEqual(isolationProblems(transcript, 'Say hello.'), [`contains "${text}"`])
  }
})

test('a prompt that arrives wrapped is flagged', () => {
  const transcript = user('Task:\nSay hello.')
  assert.deepEqual(isolationProblems(transcript, 'Say hello.'), [
    'no user message is the prompt exactly as sent',
  ])
})

test('user text is read from string and array content, skipping bad lines', () => {
  const transcript = [
    user('one'),
    'not json',
    user([{type: 'text', text: 'two'}, {type: 'image'}]),
  ].join('\n')
  assert.deepEqual(userTexts(transcript), ['one', 'two'])
})

test('snapshot changes report added, removed and modified files', () => {
  assert.deepEqual(changes({a: '1', b: '2'}, {a: '1', b: '3', c: '4'}), ['b', 'c'])
  assert.deepEqual(changes({a: '1'}, {}), ['a'])
})
