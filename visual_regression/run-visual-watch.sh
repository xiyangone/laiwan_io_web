#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
CHANGE_NAME=${1:-${VISUAL_CHANGE_NAME:-visual-change}}

cd "$REPO_ROOT"

VISUAL_CHANGE_NAME="$CHANGE_NAME" docker compose \
  -f deploy/docker-compose.visual.yml \
  run --rm \
  -e VISUAL_CHANGE_NAME="$CHANGE_NAME" \
  visual \
  sh -c 'rm -f /workspace/visual_regression/test/.visual-watch.lock && node /workspace/visual_regression/watch.js'
