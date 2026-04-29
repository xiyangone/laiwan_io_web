#!/bin/sh

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/react_laiwan_com"

cd "$PROJECT_DIR"

export VISUAL_SCREENSHOT_DIR="${VISUAL_SCREENSHOT_DIR:-$SCRIPT_DIR/visual_regression/test}"
export VISUAL_CASE_FILE="${VISUAL_CASE_FILE:-${1:-visual_regression/test/manual/visual-watch.test.ts}}"

npm run test:visual:watch
