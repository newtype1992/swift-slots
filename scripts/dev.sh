#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
APP_DIR="hello_swift_slots"
DEFINES=$(scripts/env/dotenv_to_defines.sh .env | xargs)
echo "🚀 Launching Flutter with defines: $DEFINES"
cd "$APP_DIR"
flutter pub get
flutter run -d chrome $DEFINES
