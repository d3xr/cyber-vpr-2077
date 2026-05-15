#!/usr/bin/env bash
# CYBER VPR 2077 — safe idempotent deploy.
# Usage: ./scripts/deploy.sh <frontend|backend|audio|all|verify>
# See DEPLOY.md for the full runbook + gotchas.

set -euo pipefail

PROJ="$(cd "$(dirname "$0")/.." && pwd)"

# Infra values are NOT committed (public repo). Provide them via an untracked
# local file scripts/deploy.env (gitignored) or environment variables:
#   CVPR_DEPLOY_SERVER   e.g. root@HOST_IP
#   CVPR_DEPLOY_DOMAIN   e.g. vpr.example.com
#   CVPR_DEPLOY_IP       e.g. HOST_IP   (for curl --resolve)
[ -f "$PROJ/scripts/deploy.env" ] && . "$PROJ/scripts/deploy.env"

SERVER="${CVPR_DEPLOY_SERVER:?Set CVPR_DEPLOY_SERVER (see scripts/deploy.env.example)}"
DOMAIN="${CVPR_DEPLOY_DOMAIN:?Set CVPR_DEPLOY_DOMAIN}"
DEPLOY_IP="${CVPR_DEPLOY_IP:?Set CVPR_DEPLOY_IP}"
WEBROOT="${CVPR_WEBROOT:?Set CVPR_WEBROOT}"        # e.g. /var/www/app
APPDIR="${CVPR_APPDIR:?Set CVPR_APPDIR}"           # e.g. /opt/app
SERVICE="${CVPR_SERVICE:?Set CVPR_SERVICE}"        # systemd unit name
SSH="ssh -o BatchMode=yes -o ConnectTimeout=10 $SERVER"
RESOLVE="--resolve ${DOMAIN}:443:${DEPLOY_IP}"
BASE="https://${DOMAIN}"

c_green() { printf '\033[32m%s\033[0m\n' "$*"; }
c_red()   { printf '\033[31m%s\033[0m\n' "$*"; }
c_cyan()  { printf '\033[36m%s\033[0m\n' "$*"; }

deploy_frontend() {
  c_cyan "▶ FRONTEND: clean build"
  cd "$PROJ"
  rm -rf dist
  npm run build
  tar czf /tmp/cvpr_fe.tar.gz --exclude=".DS_Store" dist
  scp -q /tmp/cvpr_fe.tar.gz "$SERVER:/tmp/"
  $SSH "
    set -e
    rm -rf /tmp/dist && cd /tmp && tar xzf cvpr_fe.tar.gz
    find /tmp/dist -name '._*' -delete
    rm -rf $WEBROOT/assets
    cp -r /tmp/dist/* $WEBROOT/
    CUR_JS=\$(grep -oE 'index-[^\"]+\.js'  $WEBROOT/index.html)
    CUR_CSS=\$(grep -oE 'index-[^\"]+\.css' $WEBROOT/index.html)
    cd $WEBROOT/assets
    for f in index-*.js index-*.css; do
      if [ \"\$f\" != \"\$CUR_JS\" ] && [ \"\$f\" != \"\$CUR_CSS\" ]; then rm -f \"\$f\"; fi
    done
    echo \"deployed bundle: \$CUR_JS / \$CUR_CSS\"
  "
  c_green "✓ frontend deployed"
}

deploy_backend() {
  c_cyan "▶ BACKEND: tsc + restart"
  cd "$PROJ/server"
  rm -rf dist
  npx tsc
  tar czf /tmp/cvpr_be.tar.gz --exclude=".DS_Store" -C "$PROJ/server" dist
  scp -q /tmp/cvpr_be.tar.gz "$SERVER:/tmp/"
  $SSH "
    set -e
    cd $APPDIR/server && tar xzf /tmp/cvpr_be.tar.gz
    systemctl restart $SERVICE && sleep 1
    systemctl is-active $SERVICE
  "
  c_green "✓ backend deployed + restarted"
}

deploy_audio() {
  c_cyan "▶ AUDIO: pushing /public/sounds (large, slow)"
  cd "$PROJ"
  tar czf /tmp/cvpr_audio.tar.gz --exclude=".DS_Store" public/sounds
  scp -q /tmp/cvpr_audio.tar.gz "$SERVER:/tmp/"
  $SSH "
    set -e
    rm -rf /tmp/public && cd /tmp && tar xzf cvpr_audio.tar.gz
    find /tmp/public -name '._*' -delete
    mkdir -p $WEBROOT/sounds
    cp -r /tmp/public/sounds/* $WEBROOT/sounds/
    echo \"mission audio files: \$(ls $WEBROOT/sounds/missions 2>/dev/null | wc -l)\"
  "
  c_green "✓ audio deployed"
}

verify() {
  c_cyan "▶ SMOKE CHECKS (prod)"
  local fail=0

  local html_hdr
  html_hdr=$(curl -sI -m 10 $RESOLVE "$BASE/" | tr -d '\r')
  echo "$html_hdr" | grep -qE 'HTTP/2 200'        && c_green "  ✓ HTML 200"            || { c_red "  ✗ HTML not 200"; fail=1; }
  echo "$html_hdr" | grep -qi 'cache-control: no-cache' && c_green "  ✓ HTML no-cache"  || c_red "  ! HTML cache-control missing"

  local health
  health=$(curl -s -m 10 $RESOLVE "$BASE/api/health" || echo '{}')
  echo "$health" | grep -q '"ok":true'            && c_green "  ✓ API health ok"        || { c_red "  ✗ API health bad: $health"; fail=1; }
  echo "  $health"

  local js
  js=$(curl -s -m 10 $RESOLVE "$BASE/" | grep -oE 'index-[^"]+\.js' | head -1)
  if [ -n "$js" ]; then
    local code
    code=$(curl -s -o /dev/null -w '%{http_code}' -m 10 $RESOLVE "$BASE/assets/$js")
    [ "$code" = "200" ] && c_green "  ✓ bundle $js → 200" || { c_red "  ✗ bundle $js → $code (stale HTML!)"; fail=1; }
  fi

  local rs
  rs=$(curl -s -m 10 $RESOLVE -X POST -H 'Content-Type: application/json' \
        -d '{"callsign":"DEPLOY_CHECK","subject":"math"}' "$BASE/api/run/start" || echo '{}')
  echo "$rs" | grep -q '"run_id"'                 && c_green "  ✓ run/start ok"          || { c_red "  ✗ run/start: $rs"; fail=1; }

  if [ "$fail" = "0" ]; then c_green "ALL SMOKE GREEN"; else c_red "SMOKE FAILED — see above"; exit 1; fi
}

case "${1:-}" in
  frontend) deploy_frontend; verify ;;
  backend)  deploy_backend;  verify ;;
  audio)    deploy_audio;    verify ;;
  all)      deploy_backend; deploy_frontend; verify ;;
  verify)   verify ;;
  *) echo "Usage: $0 <frontend|backend|audio|all|verify>"; exit 2 ;;
esac
