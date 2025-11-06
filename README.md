# Swift Slots

## Seeding (Dev)

```bash
FIREBASE_PROJECT_ID=<your_id> ./scripts/firebase/deploy_rules_dev.sh
```

Then run the app and seed slots:

```bash
cd hello_swift_slots
flutter run -d chrome
```

While the app is running (debug only), open the Dev Menu from the bug icon and tap **Seed Firestore (10 slots)**. After verifying the data in Firestore, re-lock the rules:

```bash
cd ..
FIREBASE_PROJECT_ID=<your_id> ./scripts/firebase/deploy_rules_prod.sh
```

## Security & Secrets

- Firebase Web API keys are identifiers, not credentials; access is enforced by Firestore rules. Keep those rules tight.
- Never commit private keys or `.env` files. If a secret lands in git history, rotate it immediately and purge the history.
- The generated `hello_swift_slots/lib/firebase_options.dart` stays in source control because Flutter web clients require those identifiers at runtime.
- Use `.env` (see `.env.example`) for any future secrets such as admin tokens, and keep them out of git via the `.gitignore` rules above.
