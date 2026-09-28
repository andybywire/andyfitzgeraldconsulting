#!/bin/sh
#
# ── RELOAD NGINX WHEN A CERTIFICATE RENEWS ──────────────────────────────────
#
# Installed by nginx/deploy.sh to
#
#     /etc/letsencrypt/renewal-hooks/deploy/afc-reload-nginx
#
# certbot runs every executable in that directory after it SUCCESSFULLY renews a
# certificate, and never when a renewal was not due or when it failed. It is a
# GLOBAL hook: it fires for every certificate on the droplet, the uxmethods ones
# included. That is harmless, since a second reload after a renewal that already
# reloaded changes nothing. The `afc-` prefix records which repo owns the file,
# as with `snippets/afc-common.conf`, not which certificates it covers.
#
# ── WHY IT HAS TO EXIST ────────────────────────────────────────────────────
#
# nginx reads certificates once, at start or reload, and then serves them from
# memory. A certificate issued with `certbot certonly --webroot` has no installer,
# so on renewal certbot writes the new files and stops there. nginx carries on
# serving the OLD certificate until something else happens to reload it, and the
# site then fails at the old expiry date, 30 days after a renewal that reported
# success.
#
# Found 2026-09-28: `renewal/preview.andyfitzgeraldconsulting.com.conf` carried
# `authenticator = webroot`, no installer, no renew_hook, and all three
# renewal-hooks/ directories were empty. Its next renewal, around 2026-11-19,
# would have succeeded and been ignored. The other certificates on the droplet
# use certbot's nginx installer, which reloads on renewal, so a neighbour
# renewing in the right window would sometimes have rescued it. That would have
# been luck, not a mechanism.
#
# The apex joins it at cutover, when its renewal moves from the nginx
# authenticator to webroot — see afc-production.conf.
#
# ── WHY THERE IS NO `nginx -t` IN FRONT OF THE RELOAD ─────────────────────
#
# It looks like the careful version, and it would be redundant. MEASURED
# 2026-09-28 against nginx 1.24, the droplet's version: `nginx -s reload`, which
# is what `systemctl reload nginx` runs, parses the entire configuration,
# certificates included, BEFORE it signals the master. An unknown directive and a
# missing certificate file each made it exit 1, and the running config went on
# serving unchanged. The positive control, a valid change, reloaded and took
# effect, so the check could see a reload when one happened.
#
# So a bad config on disk already fails this hook loudly. certbot records the
# non-zero exit and the output in /var/log/letsencrypt/letsencrypt.log. nginx
# keeps serving the previous certificate, and the fix is to repair the config and
# reload by hand. deploy.sh's restore path exists so that this state does not
# arise: it keeps what is on disk equal to what is running.

set -eu

echo "afc-reload-nginx: renewed ${RENEWED_DOMAINS:-(domains not reported)}; reloading nginx"
systemctl reload nginx
