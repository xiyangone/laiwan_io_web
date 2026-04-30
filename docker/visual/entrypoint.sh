#!/bin/sh

set -eu

cd /workspace/react_laiwan_com

if [ ! -d node_modules ] \
  || [ ! -e node_modules/.bin/jest ] \
  || [ ! -e node_modules/.bin/playwright ] \
  || [ ! -e node_modules/.bin/webpack-dev-server ]; then
  bun install
fi

exec "$@"
