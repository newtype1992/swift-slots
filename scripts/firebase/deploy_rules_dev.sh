#!/usr/bin/env bash
set -e

if [ -z "$FIREBASE_PROJECT_ID" ]; then
  echo "❌ Please set FIREBASE_PROJECT_ID before running this script."
  echo "   Example: FIREBASE_PROJECT_ID=my-project ./scripts/firebase/deploy_rules_dev.sh"
  exit 1
fi

echo "⚙️  Applying DEV rules (relaxed) for project: $FIREBASE_PROJECT_ID"
cp firestore.rules.dev firestore.rules
firebase deploy --only firestore:rules --project="$FIREBASE_PROJECT_ID" --force
echo "✅ Dev Firestore rules deployed"
