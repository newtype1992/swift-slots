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
