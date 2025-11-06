#!/usr/bin/env bash
set -e

if [ -z "$FIREBASE_PROJECT_ID" ]; then
  echo "❌ Please set FIREBASE_PROJECT_ID before running this script."
  echo "   Example: FIREBASE_PROJECT_ID=my-project ./scripts/firebase/deploy_rules_prod.sh"
  exit 1
fi

echo "🔒 Deploying PROD (locked) Firestore rules to project: $FIREBASE_PROJECT_ID"
firebase deploy --only firestore:rules --project="$FIREBASE_PROJECT_ID" --force
echo "✅ Production Firestore rules deployed"
