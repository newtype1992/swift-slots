# hello_swift_slots

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

## Seeding (Dev)

1. Configure your Firebase credentials by exporting `FIREBASE_PROJECT_ID` (or edit `<TODO_PROJECT_ID>` inside the scripts) and, if required, `FIREBASE_TOKEN`.
2. Temporarily relax the Firestore rules so the seeder can write slots:
   ```bash
   ./scripts/firebase/deploy_rules_dev.sh
   ```
3. Run the app (`flutter run -d chrome` or `./scripts/dev.sh`), open the Dev Menu (bug icon in the app bar), and tap **Seed Firestore (10 slots)**.
4. Restore the locked rules once seeding is finished:
   ```bash
   ./scripts/firebase/deploy_rules_prod.sh
   ```
