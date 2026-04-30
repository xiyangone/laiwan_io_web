#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
CHANGE_NAME=${1:-${VISUAL_CHANGE_NAME:-visual-change}}
TARGET_URL_ARG=${2:-${TARGET_URL:-${VISUAL_BASE_URL:-http://127.0.0.1:8080/#/}}}

cd "$REPO_ROOT"

VISUAL_CHANGE_NAME="$CHANGE_NAME" TARGET_URL="$TARGET_URL_ARG" docker compose \
  -f deploy/docker-compose.visual.yml \
  run --rm \
  -e VISUAL_CHANGE_NAME="$CHANGE_NAME" \
  -e TARGET_URL="$TARGET_URL_ARG" \
  visual \
  sh -c 'rm -f /workspace/visual_regression/test/.visual-watch.lock && node /workspace/visual_regression/watch.js'
