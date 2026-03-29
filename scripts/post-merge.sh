#!/bin/bash
set -e

npm install --legacy-peer-deps
yes "" | npm run db:push || npm run db:push -- --force || true
