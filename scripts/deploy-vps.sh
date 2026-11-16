#!/usr/bin/env bash
# Sends the current code to the VPS and restarts it. Run from the frontend folder:  bash scripts/deploy-vps.sh
# Needs the key ~/.ssh/gcp_key authorized on the VPS; the backend lives next to this folder (../asf-cleaner).
set -euo pipefail
HOST="${VPS_HOST:-34.132.241.116}"; USER_="${VPS_USER:-patrick}"; KEY="${VPS_KEY:-$HOME/.ssh/gcp_key}"
SSHK="ssh -i $KEY -o IdentitiesOnly=yes"
here="$(cd "$(dirname "$0")/.." && pwd)"; back="$here/../asf-cleaner"

echo "== frontend: build with the API at /api"
(cd "$here" && VITE_API_URL=/api npm run build)
rsync -az --delete -e "$SSHK" "$here/dist/" "$USER_@$HOST:~/saris-web/"

echo "== backend: send the code (not .venv, .git or caches), install what changed"
rsync -az --delete -e "$SSHK" --exclude='.venv' --exclude='.git' --exclude='__pycache__' --exclude='.pytest_cache' --exclude='*.pyc' --exclude='out/' --exclude='.env' "$back/" "$USER_@$HOST:~/asf-cleaner/"

$SSHK "$USER_@$HOST" 'set -e
  sudo rsync -a --delete ~/saris-web/ /var/www/saris/ && sudo chmod -R a+rX /var/www/saris
  cd ~/asf-cleaner && ~/.local/bin/uv sync --frozen -q
  sudo systemctl restart saris-api
  sleep 4; systemctl is-active saris-api nginx; curl -s http://127.0.0.1:8000/health; echo'
echo "== done: http://$HOST/"
