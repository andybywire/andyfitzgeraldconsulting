#!/usr/bin/env bash
#
# ── DEPLOY THE NGINX CONFIGURATION ──────────────────────────────────────────
#
#   AFC_SSH=root@164.92.65.133 nginx/deploy.sh
#
# ── WHY THIS IS A SCRIPT AND NOT A WORKFLOW ────────────────────────────────
#
# It was a workflow first. Decided 2026-09-21 to take it out of CI, and the
# reasoning is worth keeping because the obvious version of it is wrong.
#
# The apparent question was "how narrowly can the deploy user be permitted?" —
# grant sudo for five commands, or write to two directories, rather than
# NOPASSWD:ALL. Every version of that is theatre, because **writing nginx config
# is equivalent to being root**. The master process runs as root and it is the
# master that opens log files, so a config containing
#
#     access_log /etc/cron.d/anything;
#
# has root create and write that file on the next reload, with `log_format`
# controlling the contents. A wrapper script does not help either: the account
# still controls the bytes going into the config the wrapper installs. It is not
# a permissions problem. nginx config is a root-privileged language.
#
# So the real question was whether CI should deploy nginx config at all — and the
# answer is no, because the automation buys least exactly where it costs most.
# This config changes a handful of times during cutover and then approximately
# never, while a CI key that can write it is root-equivalent permanently.
#
# ── WHAT THIS DOES NOT CHANGE ──────────────────────────────────────────────
#
# The config is still AUTHORED IN THE REPO and never edited on the server
# (decided 2026-08-20). That decision was about where the file lives and how it is
# reviewed, not about what transport moves it. It is still version controlled,
# still diffable, still rolled back with a revert plus a re-run of this script.
#
# `.github/workflows/validate-nginx.yml` still runs `nginx -t` against these files
# in CI on every push, so a syntax error is caught without anyone running this.
#
# ── AND WHAT IT BUYS ───────────────────────────────────────────────────────
#
# `deploy-astro.yml` — the workflow that fires on every Sanity publish — uses no
# sudo at all. It writes only under /var/www/afc-preview, and its `chgrp www-data`
# works from group membership. So with nginx out of CI, **no key held by GitHub is
# root-equivalent on the droplet.** That is the whole point of the change.

set -euo pipefail

# ── Inputs ──────────────────────────────────────────────────────────────────

: "${AFC_SSH:?Set AFC_SSH to the droplet ssh target, e.g. root@164.92.65.133}"

# "user:password" for the staging host's basic auth. Optional — without it the
# smoke check below drops to a status probe and says so.
AFC_STAGING_AUTH="${AFC_STAGING_AUTH:-}"

PREVIEW_HOST="${PREVIEW_HOST:-preview.andyfitzgeraldconsulting.com}"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# afc-production.conf is DELIBERATELY ABSENT from this list. Installing it before
# the 11ty site is retired takes the live site down — its apex block collides with
# sites-enabled/andyfitzgeraldconsulting.com, conf.d loads first, and nginx
# reports the collision as a warning rather than an error so `nginx -t` passes.
# See the cutover sequence in that file's header; adding it here is one of those
# steps, paired with removing the sites-enabled symlink.
FILES=(afc.conf site-common.conf redirects.conf)

for f in "${FILES[@]}"; do
  [[ -f "$HERE/$f" ]] || { echo "missing: $HERE/$f" >&2; exit 1; }
done

echo ">>> Deploying ${#FILES[@]} files to $AFC_SSH"

# ── The remote half ─────────────────────────────────────────────────────────
#
# Generated here and shipped, rather than piped to `bash -s` over stdin. With a
# heredoc on stdin, `sudo` has to find a terminal to prompt on and the
# arrangement becomes fragile; sending a file and running `sudo bash <file>`
# leaves stdin alone and gives ONE password prompt for the whole run.
#
# 'REMOTE' is quoted so nothing expands locally — every variable below is
# evaluated on the droplet.

REMOTE_SCRIPT="$(mktemp)"
trap 'rm -f "$REMOTE_SCRIPT"' EXIT

cat > "$REMOTE_SCRIPT" <<'REMOTE'
set -euo pipefail

STAGED=/tmp/afc-nginx
BACKUP="/tmp/afc-nginx-backup-$(date +%Y%m%d%H%M%S)"

# afc.conf goes to conf.d/ because it holds `limit_req_zone`, an http-context
# directive. The other two hold server-context directives and MUST NOT be in
# conf.d/, which nginx includes at http level — they would fail to load.
CONF=/etc/nginx/conf.d/afc.conf
COMMON=/etc/nginx/snippets/afc-common.conf
REDIR=/etc/nginx/snippets/afc-redirects.conf

echo ">>> Backing up the installed configuration to $BACKUP"
mkdir -p "$BACKUP"
# `|| true` for the first deploy, when none of these exist yet.
for f in "$CONF" "$COMMON" "$REDIR"; do
  cp "$f" "$BACKUP/$(basename "$f")" 2>/dev/null || true
done

# ── WHY EVERY FAILURE PATH RESTORES ───────────────────────────────────────
#
# `nginx -s reload` on a bad config fails and leaves the RUNNING config in
# place. That gate protects the running process — not the files on disk.
#
# THE STATE THAT ACTUALLY BITES: new files installed, `nginx -t` fails, so we
# never reload. The site stays up and everything looks fine — until certbot's
# renewal hook or logrotate reloads nginx hours later and it goes down with no
# deploy anywhere near it. The invariant this preserves is that what is on disk
# always equals what is running.
restore() {
  echo "!!! Restoring the previous configuration" >&2
  for f in "$CONF" "$COMMON" "$REDIR"; do
    b="$BACKUP/$(basename "$f")"
    if [ -f "$b" ]; then
      install -m 644 -o root -g root "$b" "$f"
    else
      # Nothing was there before — this was a first deploy. Remove the file
      # rather than leaving a broken one behind.
      rm -f "$f"
    fi
  done
  # Prove the restored state is loadable before walking away from it.
  if nginx -t; then
    systemctl reload nginx || true
    echo "!!! Restored and reloaded." >&2
  else
    echo "!!! RESTORED FILES DO NOT PASS nginx -t — MANUAL ATTENTION NEEDED" >&2
  fi
}

echo ">>> Installing"
mkdir -p /etc/nginx/snippets
install -m 644 -o root -g root "$STAGED/afc.conf"         "$CONF"
install -m 644 -o root -g root "$STAGED/site-common.conf" "$COMMON"
install -m 644 -o root -g root "$STAGED/redirects.conf"   "$REDIR"

echo ">>> Testing"
if ! nginx -t; then restore; exit 1; fi

echo ">>> Reloading"
if ! systemctl reload nginx; then restore; exit 1; fi

# Keep the last few backups for post-mortems; they are plain text and cost
# nothing. Pruning matters on a droplet that has hit 100% disk once already.
find /tmp -maxdepth 1 -name 'afc-nginx-backup-*' -type d | sort -r | tail -n +6 | xargs -r rm -rf

echo ">>> Installed and reloaded."
REMOTE

# ── Ship and run ────────────────────────────────────────────────────────────

echo ">>> Copying files"
ssh "$AFC_SSH" 'mkdir -p /tmp/afc-nginx'
for f in "${FILES[@]}"; do
  scp -q "$HERE/$f" "$AFC_SSH:/tmp/afc-nginx/$f"
done
scp -q "$REMOTE_SCRIPT" "$AFC_SSH:/tmp/afc-nginx/install.sh"

# `-t` allocates a terminal so sudo can prompt. If the ssh user is root, sudo is
# a no-op and nothing is asked.
echo ">>> Running install on the droplet (sudo may prompt)"
ssh -t "$AFC_SSH" 'sudo bash /tmp/afc-nginx/install.sh'

# ── Smoke check, from HERE rather than from the droplet ─────────────────────
#
# Better than the CI version this replaces, which curled 127.0.0.1 with
# `--resolve` and so proved nothing about DNS, the certificate chain, or the
# firewall. From a laptop it is an ordinary request over the real internet.
#
# It cannot restore on failure — the reload already happened and this process is
# not on the droplet — so a failure here is a REPORT, not a rollback. Rolling
# back is re-running this script from an earlier commit.

echo
echo ">>> Smoke-checking https://$PREVIEW_HOST/"

smoke() {
  if [[ -n "$AFC_STAGING_AUTH" ]]; then
    curl -s --max-time 15 -u "$AFC_STAGING_AUTH" "$@"
  else
    curl -s --max-time 15 "$@"
  fi
}

CODE="$(smoke -o /dev/null -w '%{http_code}' "https://$PREVIEW_HOST/" || echo 000)"

# 401 passes ONLY when we have no credentials to offer. With them, a 401 means
# the htpasswd file is wrong, which should be reported rather than shrugged at.
if [[ -n "$AFC_STAGING_AUTH" ]]; then OK="200 301 302"; else OK="200 301 302 401"; fi
if [[ " $OK " != *" $CODE "* ]]; then
  echo "!!! / returned $CODE" >&2
  exit 1
fi
echo "    1. serving ($CODE)"

if [[ -z "$AFC_STAGING_AUTH" ]]; then
  echo "    2/3. SKIPPED — set AFC_STAGING_AUTH to check the 404 page and X-Robots-Tag."
  echo ">>> Done (verified less thoroughly than it could have been)."
  exit 0
fi

# A missing URL must get OUR 404 page, not nginx's.
#
# THIS IS THE SEMICOLON CASE. Deleting the `;` after `index index.html` PASSES
# `nginx -t`, because `index` accepts multiple arguments and swallows the
# `error_page` line that follows — and the site then serves nginx's grey default
# 404 with nothing reporting an error anywhere. Measured, along with two controls
# that nginx did catch. Matching on the version string nginx puts in its own error
# pages is a negative assertion on purpose: it stays true whatever our 404 says.
#
# The empty-body guard is checked FIRST and is not padding. `grep -q` for that
# marker also succeeds on an EMPTY string, so a fetch that failed outright would
# report success — a check that goes green precisely when it cannot see anything.
BODY="$(smoke "https://$PREVIEW_HOST/__smoke_check_missing__/" || true)"
if [[ -z "$BODY" ]]; then
  echo "!!! 404 probe returned an empty body — the server did not answer." >&2
  exit 1
fi
if printf '%s' "$BODY" | grep -q '<hr><center>nginx/'; then
  echo "!!! 404s are serving nginx's default page, not the site's." >&2
  echo "!!! Usually a swallowed error_page directive — check site-common.conf." >&2
  exit 1
fi
echo "    2. 404 is the site's own page"

# X-Robots-Tag is one of the two things keeping staging out of search results, and
# it is easy to lose silently: nginx REPLACES the inherited `add_header` set the
# moment a location declares its own, so a refactor of site-common.conf can strip
# it from every page while `curl -I /` still looks correct.
if ! smoke -D- -o /dev/null "https://$PREVIEW_HOST/" | grep -qi '^x-robots-tag: *noindex'; then
  echo "!!! X-Robots-Tag: noindex is MISSING." >&2
  echo "!!! Staging is indexable. See the add_header note in site-common.conf." >&2
  exit 1
fi
echo "    3. X-Robots-Tag present"

echo ">>> Done."
