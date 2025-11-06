#!/usr/bin/env bash
set -euo pipefail
ENV_FILE="${1:-.env}"
if [ ! -f "$ENV_FILE" ]; then
  echo "ℹ️  $ENV_FILE not found; skipping."
  exit 0
fi
grep -v '^\s*#' "$ENV_FILE" | grep -v '^\s*$' | while IFS='=' read -r key value; do
  key_trim="$(echo "$key" | xargs)"
  value_trim="$(echo "$value" | xargs)"
  echo "--dart-define=${key_trim}=${value_trim}"
done
