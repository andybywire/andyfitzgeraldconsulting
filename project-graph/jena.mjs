/**
 * Apache Jena, pinned: one exact release, checksum-verified, fetched once into a shared cache.
 *
 *   node project-graph/jena.mjs      fetch it if needed, then print where it lives
 *
 * graph.mjs imports `runJena()` from here, so a check never has to think about where Jena is. Run
 * this file on its own to warm the cache ahead of time, which the experiment's arm runs need: see
 * WHY A SHARED CACHE.
 *
 * ── WHY JENA, AND WHY ITS COMMAND-LINE TOOLS ───────────────────────────────
 *
 * Jena is the reference implementation for SPARQL and SHACL in Java, and its `riot`, `shacl` and
 * `sparql` commands read local files with no triplestore. Java was already a dependency here,
 * for the HTML validator. Chosen by Andy, 2026-10-17, over Node libraries and Python (pySHACL,
 * maplib); docs/project-graph/README.md records the layout decisions.
 *
 * ── PINNED TO AN EXACT RELEASE, WITH ITS SHA-512 IN THIS FILE ────────────────
 *
 * Same reasoning as the HTML validator's exact pin: a check whose verdict changes when nothing in
 * this repo did is a check nobody trusts. The hash is the one Apache publishes beside the release
 * (`.sha512` on downloads.apache.org), copied here rather than fetched at run time, because a hash
 * fetched from the same server as the file proves only that the server is consistent.
 *
 * WHAT THE PIN DOES NOT COVER: Apache also signs each release with PGP, and that signature is not
 * checked. The SHA-512 proves this is the exact file that was pinned. The signature would prove
 * that file came from a Jena release manager, which matters most at the moment of choosing a pin.
 *
 * The URL is archive.apache.org, not downloads.apache.org. Apache removes superseded releases from
 * `downloads` and keeps every release on `archive`, so only an archive URL keeps working once 6.2.0
 * is no longer current.
 *
 * TO MOVE THE PIN: change VERSION, then copy the new hash from
 * https://downloads.apache.org/jena/binaries/apache-jena-<version>.tar.gz.sha512 (while that
 * version is current) and check the release notes. The old cached copy stays where it is,
 * harmless, keyed by its version.
 *
 * ── WHY A SHARED CACHE, OUTSIDE ANY CHECKOUT ────────────────────────────────
 *
 * Every arm run in the experiment is a fresh worktree. A copy inside the checkout would make each
 * arm C run start with a 23 MB download, inflating exactly the wall time and tool calls the
 * protocol measures, in that arm only. One copy per version, outside every checkout, removes that.
 * The default is `$XDG_CACHE_HOME/project-graph` (`~/.cache/project-graph` when that is unset).
 * Set PROJECT_GRAPH_CACHE to put it elsewhere, which is also how CI would point a cache action at
 * it.
 *
 * AN INSTALL IS ALL OR NOTHING. The archive is downloaded and verified, then extracted beside the
 * final directory and renamed into place. A rename within one filesystem is atomic, so the
 * versioned directory exists only once it is complete. A run that is interrupted, or two runs that
 * race, can never leave behind a half-extracted Jena that looks installed.
 *
 * ── FOUR THINGS JENA 6.2.0 DOES THAT ITS DOCS DO NOT SAY ────────────────────
 *
 * Probed by hand on 2026-10-17, before any of this was written:
 *
 *   JAVA 21     The classes are compiled for Java 21 (class-file major version 65). The `bin/`
 *               scripts still say "java (>=Java 11)", which is out of date. Checked below.
 *   LOGGING     Called without Jena's own logging config, its log lines go to STDOUT, ahead of
 *               the output. The `bin/` scripts pass the config; so does `runJena()`, which sends
 *               logs to stderr and leaves stdout clean.
 *   SHACL       `shacl validate` exits 0 whether the data conforms or not. graph.mjs reads the
 *               report instead of the exit status.
 *   RIOT        `riot --validate` exits 0 on a warning, such as a malformed IRI. graph.mjs reads
 *               stderr for warnings.
 *
 * `runJena()` calls Java directly rather than through the `bin/` shell scripts. They do nothing
 * but find Java and build a classpath. Calling Java here finds it the same way the HTML validator
 * does: $JAVA_HOME/bin/java when JAVA_HOME is set (which is how setup-java works in CI), or
 * whatever `java` is on the PATH.
 */
import {createHash} from 'node:crypto'
import {createReadStream, existsSync, mkdirSync, renameSync, rmSync, writeFileSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

export const VERSION = '6.2.0'
const SHA512 =
  '2b467d2ff940c207aea935e012ecbb0f0ab3e6bf59b3fc4b3fbc6cf9cea11f1428e97882ec078a5ffc57e114e0f5c88ea98c4575e687cc1dd232f99324b7b2a2'
const ARCHIVE_URL = `https://archive.apache.org/dist/jena/binaries/apache-jena-${VERSION}.tar.gz`
const JAVA_MAJOR = 21

const CACHE =
  process.env.PROJECT_GRAPH_CACHE ??
  join(process.env.XDG_CACHE_HOME ?? join(homedir(), '.cache'), 'project-graph')
const HOME = join(CACHE, `apache-jena-${VERSION}`)
const JAVA = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', 'java') : 'java'

/** Thrown for anything that stops Jena from running at all. graph.mjs maps it to exit 2. */
export class JenaUnavailable extends Error {}

/* ── Java ─────────────────────────────────────────────────────────────────── */

function checkJava() {
  // `java -version` writes to stderr, and names Java 8 as "1.8.0_…", where the major version is
  // the SECOND number. Same parsing as web/scripts/validate-html.mjs, with a higher floor.
  const probe = spawnSync(JAVA, ['-version'], {encoding: 'utf8'})
  const version = `${probe.stderr ?? ''}${probe.stdout ?? ''}`.match(/version "([^"]+)"/)?.[1]
  const major = version
    ? Number(version.startsWith('1.') ? version.split('.')[1] : version.split('.')[0])
    : null
  if (major === null || major < JAVA_MAJOR) {
    throw new JenaUnavailable(
      `Jena ${VERSION} needs Java ${JAVA_MAJOR} or newer, and ${JAVA} is ` +
        (major === null ? 'not runnable.' : `Java ${major}.`) +
        '\nOn a Mac: `brew install --cask temurin@21`.',
    )
  }
}

/* ── Fetch, verify, install ───────────────────────────────────────────────── */

async function sha512Of(file) {
  const hash = createHash('sha512')
  for await (const chunk of createReadStream(file)) hash.update(chunk)
  return hash.digest('hex')
}

async function install() {
  mkdirSync(CACHE, {recursive: true})
  // Unique per process, so two runs racing to install never write the same files.
  const staging = join(CACHE, `.staging-${VERSION}-${process.pid}`)
  const archive = `${staging}.tar.gz`
  try {
    console.error(`Fetching Apache Jena ${VERSION} into ${CACHE} (once per version)…`)
    const response = await fetch(ARCHIVE_URL)
    if (!response.ok) throw new JenaUnavailable(`${ARCHIVE_URL} answered ${response.status}.`)
    writeFileSync(archive, Buffer.from(await response.arrayBuffer()))

    const actual = await sha512Of(archive)
    if (actual !== SHA512) {
      throw new JenaUnavailable(
        `Checksum mismatch for apache-jena-${VERSION}.tar.gz. Expected ${SHA512}, got ${actual}. ` +
          'Nothing was installed.',
      )
    }

    mkdirSync(staging)
    const untar = spawnSync('tar', ['-xzf', archive, '-C', staging], {encoding: 'utf8'})
    if (untar.status !== 0) throw new JenaUnavailable(`tar failed: ${untar.stderr}`)

    try {
      renameSync(join(staging, `apache-jena-${VERSION}`), HOME)
    } catch (error) {
      // Another run finished first. Its copy is complete by construction, so use it.
      if (!existsSync(join(HOME, 'lib'))) throw error
    }
  } finally {
    rmSync(staging, {recursive: true, force: true})
    rmSync(archive, {force: true})
  }
}

/** Java checked, and Jena present in the cache: fetched and verified on first use. */
export async function ensureJena() {
  checkJava()
  if (!existsSync(join(HOME, 'lib'))) await install()
  return HOME
}

/**
 * Runs one of Jena's command-line tools by its main class (`riotcmd.riot`, `shacl.shacl`, …),
 * with Jena's logging config so log lines go to stderr. Returns spawnSync's result; reading it is
 * the caller's job, because what an exit status means differs by tool. See the header.
 */
export function runJena(mainClass, args) {
  return spawnSync(
    JAVA,
    [
      `-Dlog4j.configurationFile=file:${join(HOME, 'log4j2.properties')}`,
      '-cp',
      // A literal `*`: Java expands a classpath wildcard itself, and no shell is involved.
      join(HOME, 'lib', '*'),
      mainClass,
      ...args,
    ],
    {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024},
  )
}

/* ── Run on its own: warm the cache ───────────────────────────────────────── */

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    console.log(await ensureJena())
  } catch (error) {
    console.error(error.message)
    process.exit(2)
  }
}
