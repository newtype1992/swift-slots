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
Firebase Web API keys are public identifiers. They do **not** grant direct database access; rules in `firestore.rules` enforce security:contentReference[oaicite:2]{index=2}. 
If GitHub flags these keys, you can safely ignore the alert or configure a `.github/secret_scanning.yml` with `paths-ignore` to exclude the file:contentReference[oaicite:3]{index=3}. 
Private tokens and credentials must be stored in `.env` files (excluded by `.gitignore`).

## 🔧 Environment Management
Local and CI builds now source configuration from `.env` files or GitHub environment variables.

**Local development**
```bash
./scripts/dev.sh
```
- Creates `.env` from `.env.example` if missing.
- Converts key/value pairs into `--dart-define` flags via `scripts/env/dotenv_to_defines.sh`.
- Runs `flutter pub get` and launches the app with those defines.

**CI builds**
- Configure repository variables or secrets for `FIREBASE_PROJECT_ID` and `API_BASE_URL` in **Settings → Secrets and variables → Actions**.
- The `flutter-build` workflow injects them as `--dart-define` flags before running `flutter build web --release`.

**Debugging defines in-app**
- Open the Dev Menu (bug icon) while running a debug build.
- Choose **View Env Debug** to see the active `dart-define` values resolved at runtime.
