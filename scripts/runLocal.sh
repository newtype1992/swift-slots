#!/usr/bin/env bash
set -euo pipefail

# Always execute from the repository root.
cd "$(dirname "$0")/.."

ENV_FILE="functions/.env"
REQUIRED_VARS=(HOLD_MINUTES CURRENCY STRIPE_SECRET_KEY STRIPE_PUBLISHABLE_KEY)

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found. Copy functions/.env.example and populate it first." >&2
  exit 1
fi

missing_vars=()
for key in "${REQUIRED_VARS[@]}"; do
  value="$(grep -E "^[[:space:]]*${key}=" "$ENV_FILE" | tail -n 1 | cut -d '=' -f2-)"
  if [[ -z "${value// }" ]]; then
    missing_vars+=("$key")
  fi
done

if (( ${#missing_vars[@]} )); then
  echo "Error: Missing required values in $ENV_FILE: ${missing_vars[*]}" >&2
  exit 1
fi

EMULATOR_PID=""

cleanup() {
  if [[ -n "${EMULATOR_PID}" ]] && kill -0 "$EMULATOR_PID" 2>/dev/null; then
    echo "Stopping Firebase emulators (PID $EMULATOR_PID)..."
    kill "$EMULATOR_PID" >/dev/null 2>&1 || true
    wait "$EMULATOR_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

echo "Running npm run init inside functions/ to configure runtime, seed data, and deploy..."
pushd functions >/dev/null
npm run init
popd >/dev/null

echo "Starting Firebase emulators for Firestore and Functions..."
pushd functions >/dev/null
firebase emulators:start --only firestore,functions --project=swift-slots-mvp &
EMULATOR_PID=$!
popd >/dev/null

echo "Waiting for emulators to stabilize..."
sleep 10

echo "Launching Flutter app via scripts/dev.sh (includes --dart-define flags)..."
set +e
./scripts/dev.sh
DEV_EXIT=$?
set -e

cleanup
trap - EXIT

if [[ $DEV_EXIT -ne 0 ]]; then
  echo "Flutter dev script exited with status $DEV_EXIT."
  exit $DEV_EXIT
fi

echo ""
echo "Local workflow complete:"
echo "- Firebase config, seeding, and deployment executed via npm run init."
echo "- Firestore & Functions emulators ran for project swift-slots-mvp."
echo "- Flutter app launched with current environment defines."
echo "Reminder: Approve pilot businesses/users manually in Firestore (set approved: true) per the MVP plan."
