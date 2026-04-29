#!/bin/sh

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

cd "$SCRIPT_DIR"

docker compose -f docker-compose.visual.yml run --rm visual sh -lc "rm -f /workspace/visual_regression/test/.visual-watch.lock && node test/visual/watch.js"
