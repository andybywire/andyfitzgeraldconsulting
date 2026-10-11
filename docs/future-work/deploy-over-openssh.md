# Deploying over the runner's own OpenSSH — deferred

**Deferred 2026-10-10 (Andy):** planned, nothing built. It is the follow-up to the action pinning
merged that day (`2be8147`), which closed one route and recorded the one it could not. This file is
the pickup point.

**Read `.github/workflows/deploy-astro.yml`'s header first** — *WHAT THE PINS DO NOT COVER* and
*MOVING A PIN*. It is the record of the gap, and this file does not repeat its reasoning, only what
the work would be.

## The gap

Both deploys copy a release to the droplet with `appleboy/scp-action` and run the install script
with `appleboy/ssh-action`. Pinning them by commit fixed the wrappers, not what holds the key:

- **ssh-action downloads its `drone-ssh` binary at run time**, from a GitHub release, with no
  checksum. A release is not immutable.
- **scp-action is a Docker action built from an image tag**, `ghcr.io/appleboy/drone-scp`, which
  can be pushed again.
- **Neither sets `fingerprint`**, so both accept any host key. An impostor answering at `AFC_HOST`
  would receive the release and, from production's `envs:`, the Gmail secrets. Not the SSH key
  itself, which public-key authentication never sends.

The runner already has OpenSSH. Using it directly removes all three.

## What the work would be

In both `deploy-astro.yml` and `deploy-preview.yml`, replace the two appleboy steps with `run:`
steps that use the runner's `scp` and `ssh`:

1. **Write the key to a file** with `0600` permissions, from `AFC_SSH_KEY`.
2. **Pin the droplet's host key.** Store its public host key (the `known_hosts` line) as a secret
   or a repository variable, write it to a known-hosts file, and connect with
   `-o StrictHostKeyChecking=yes -o UserKnownHostsFile=<that file>`. Get the line from the droplet
   itself (`ssh-keyscan` from a trusted network, checked against the droplet's own
   `/etc/ssh/ssh_host_*_key.pub` fingerprints), never from a run's first connection.
3. **`scp` the tarball to `/tmp`**, as `target: "/tmp"` does today.
4. **Run the install script over `ssh`**, passing `envs:` explicitly. appleboy exported them
   into the remote session; plain `ssh` needs them sent, for example as `VAR=value` assignments in
   the remote command, or on stdin, so the Gmail secrets never appear in a process list or a log.

## Things the replacement must keep

- **The scripts' own assumptions about the session.** `deploy-preview.yml` already exports
  `XDG_RUNTIME_DIR` itself, so as not to depend on how appleboy opens the session, and a plain
  `ssh` command is non-interactive, so it reads no login profile. Check every other line of both
  scripts for anything that relied on a login shell.
- **`set -e` and the exit status.** A failing remote command must fail the step, as it does now.
- **No secret in a log.** Use `::add-mask::` for anything derived from a secret, and never `set -x`.

## How to prove it

The same as every gate here: green first, then a deliberate failure.

1. **Run `deploy-preview` on the branch** with `workflow_dispatch`, and confirm the preview is
   serving the new release.
2. **Make the host-key check fail on purpose:** run it once with a wrong known-hosts line and
   watch the step refuse to connect. If it connects anyway, the pin is not doing anything.
3. **Merge.** The merge deploys both hosts, because each deploy runs when its own file changes on
   `main`. That is the production proof.

When it is built, delete the "What the pins do not cover" paragraphs from both workflow headers,
the appleboy rows from *MOVING A PIN*, and this file, and update CLAUDE.md's *workflows' actions
and tokens* paragraph.
