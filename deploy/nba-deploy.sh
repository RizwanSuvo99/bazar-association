#!/usr/bin/env bash
# Production deploy for নাঙ্গলকোট বাজার ব্যবসায়ী সংস্থা.
#
# Installed at /usr/local/bin/nba-deploy and pinned as the FORCED COMMAND for the
# GitHub Actions deploy key in root's authorized_keys. That key therefore cannot open
# a shell or run anything else — it can only trigger this script.
#
# THIS FILE IS A REFERENCE COPY. The server runs /usr/local/bin/nba-deploy, which this
# script does NOT update (a deploy must not rewrite itself mid-run). After editing here:
#   scp deploy/nba-deploy.sh root@<vps>:/usr/local/bin/nba-deploy
#   ssh root@<vps> 'chmod 755 /usr/local/bin/nba-deploy && bash -n /usr/local/bin/nba-deploy'
set -euo pipefail

APP=/opt/bazar-association
LOG_TAG="[nba-deploy]"
log() { echo "$LOG_TAG $(date '+%F %T') $*"; }
asnba() { sudo -u nba HOME=/home/nba "$@"; }

cd "$APP"

PREV_SHA="$(asnba git rev-parse HEAD)"
log "current commit: $PREV_SHA"

log "fetching origin/main"
asnba git fetch --quiet origin main
NEW_SHA="$(asnba git rev-parse origin/main)"

if [ "$PREV_SHA" = "$NEW_SHA" ]; then
  log "already up to date — nothing to deploy"
  exit 0
fi
log "deploying: $PREV_SHA -> $NEW_SHA"

asnba git reset --hard --quiet origin/main

log "installing backend deps"
asnba npm --prefix backend ci --omit=dev --no-audit --no-fund >/dev/null

log "running migrations"
asnba npm --prefix backend run migrate

log "installing frontend deps"
asnba npm --prefix frontend ci --no-audit --no-fund >/dev/null

log "building frontend"
if ! asnba npm --prefix frontend run build >/tmp/nba-build.log 2>&1; then
  log "BUILD FAILED — rolling back to $PREV_SHA, services left untouched"
  tail -30 /tmp/nba-build.log
  asnba git reset --hard --quiet "$PREV_SHA"
  asnba npm --prefix frontend ci --no-audit --no-fund >/dev/null
  asnba npm --prefix frontend run build >/dev/null 2>&1 || log "WARNING: rollback rebuild also failed"
  exit 1
fi

log "restarting services"
systemctl restart nba-backend nba-frontend

log "waiting for health"
for i in $(seq 1 30); do
  api=$(curl -s -o /dev/null -w '%{http_code}' -m 5 http://127.0.0.1:4000/api/health || true)
  web=$(curl -s -o /dev/null -w '%{http_code}' -m 5 http://127.0.0.1:3000/ || true)
  if [ "$api" = "200" ] && [ "$web" = "200" ]; then
    log "healthy (api=$api web=$web) — deployed $NEW_SHA"
    exit 0
  fi
  sleep 2
done

log "HEALTH CHECK FAILED (api=$api web=$web) after restart"
systemctl status nba-backend --no-pager -n 15 || true
systemctl status nba-frontend --no-pager -n 15 || true
exit 1
