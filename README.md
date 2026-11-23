# Budget Cockpit: build and mobile project

Same app, now with a build step (Vite) and a mobile wrapper (Capacitor).
The web app behaves as before. The build gives hashed file names, so the
"new app.js with an old index.html" problem cannot happen, and the service
worker cache name changes by itself on every build.

## What goes where
- `index.html` and `src/app.js`: the app (your current code, plus a native hook).
- `src/native.js`: runs only inside the Android/iOS app. Schedules on-device
  notifications for loan repayment dates and the daily expense reminder.
- `public/`: files copied as they are: `config.js`, `boot-guard.js`, `sw.js`,
  `manifest.json`, `icons/`, `privacy.html`, `delete-account.html`.
- `.github/workflows/`: `deploy-web.yml` (GitHub Pages), `android.yml`, `ios.yml`.

## Before the first build (once)
1. Copy your LIVE `config.js` into `public/config.js`. `config.example.js` is only a
   template with placeholder keys. Do not commit the example in its place.
2. Copy your `icons/` folder (icon-192.png, icon-512.png) into `public/icons/`.
3. In `public/privacy.html` and `public/delete-account.html`, replace `SUPPORT_EMAIL`
   with a real address you read.
4. In `capacitor.config.json`, decide the `appId` now. It becomes permanent once the
   app is on a store. `com.budgetcockpit.app` is a placeholder.

## Move the website to the build (GitHub only, no CLI needed)
1. Upload this project's files to the repo root (keep the old files in a branch or folder first).
2. Repo Settings, Pages, Source: GitHub Actions.
3. Push to main. The "Deploy web" action builds and publishes. The live URL stays the same.
4. If anything is wrong, switch Pages back to "Deploy from a branch" and the old site returns.

## Android (Play Store)
1. Make a signing key once (any computer with Java, or ask me for a no-install route):
   `keytool -genkeypair -v -keystore release.keystore -alias budgetcockpit -keyalg RSA -keysize 2048 -validity 10000`
   Keep this file and its passwords safe forever. Losing it blocks future updates.
2. Add four repo secrets: ANDROID_KEYSTORE_BASE64 (the keystore, base64), ANDROID_KEYSTORE_PASSWORD,
   ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD.
3. Actions, "Android bundle", Run workflow. Download the .aab from the run and upload it to Play Console.
4. Also enroll in Play App Signing when Play Console offers it.

## iOS (App Store)
Needs an Apple Developer account first. Then add the secrets listed at the top of
`.github/workflows/ios.yml` and run "iOS TestFlight". This workflow is written but has
not been run against a real Apple account, so expect to adjust it once.

## Honest limits
- The Vite build and the strict-mode test run pass here, but nothing has been tried in a real
  browser or on a real phone yet. Test the deployed preview before pointing users at it.
- Web Push (the current reminder method) does not work inside the iOS app shell. Local
  notifications cover the daily reminder and loan dates there. Server push to the apps
  would need Firebase and APNs setup later.
- Fingerprint/face unlock uses the browser WebAuthn API today and may not work inside the
  native shells. A native biometric plugin is the follow-up.
