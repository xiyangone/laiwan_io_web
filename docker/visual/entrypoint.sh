#!/bin/sh

set -eu

cd /workspace/react_laiwan_com

if [ ! -d node_modules ] || [ ! -f node_modules/.yarn-integrity ]; then
  yarn install --network-timeout 600000 --ignore-engines
fi

exec "$@"
