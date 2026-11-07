# Cash Crunch (Android & Web)

An incremental cash-shredding physics arcade game inspired by *What the Buck?!*. Shred banknotes across a workshop tabletop, earn funds, unlock upgrades, expand the Prestige Tree, trigger chain reactions, and build an automated money-destruction empire.

---

## Game Features
- **Physics Sandbox**: Top-down tabletop with bill ejection, rotational cutter, paper confetti particle arcs, and coin medallions.
- **Banknote Denominations & Variants**: $1, $5, $10, $20, $100 notes, bundles, plus special variants (Reinforced, Spark, Burst, Golden, Diamond, Prestige Coins).
- **Three-Tier Progression**:
  1. *Workshop Upgrades*: Radius, Damage, Cutting Speed, Crit Chance, Crit Damage, Bundled Bills, Automation.
  2. *Skill Tree (Cash $)*: In-shift tactical enhancements.
  3. *Prestige Tree (PP)*: Permanent cross-shift meta progression with deep pockets seed capital and piggy bank multipliers.
- **Offline & Native Ready**: Works 100% offline with HTML5 LocalStorage persistence and Web Audio API synthesizer.

---

## Project Structure
```
├── src/                    # Game source code (React, Canvas renderer, Physics simulation)
│   ├── game/               # Simulation, Canvas renderer, Upgrades definitions
│   ├── components/         # Skill Tree, Modals, Audio & Haptics controllers
│   └── types/              # Game models and data types
├── android/                # Native Capacitor Android project (Gradle, AndroidManifest)
│   ├── app/                # Android app module with assets, Java launcher & res
│   └── build.gradle        # Android project build script
├── .github/workflows/      # Automated GitHub Actions APK build workflow
├── capacitor.config.ts     # Capacitor configuration (com.mintoo.cashcrunch)
└── dist/                   # Bundled web production distribution
```

---

## Local Development & Web Build

### 1. Prerequisites
- Node.js 18+ or 20+
- npm

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build Web Distribution
```bash
npm run build
```

---

## Android Build via Capacitor

### 1. Sync Web Assets to Android
```bash
npm run cap:build
# or
npx cap sync android
```

### 2. Build Debug APK Locally (requires Android Studio / Android SDK)
```bash
cd android
./gradlew assembleDebug
```
The output APK will be at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## Automated GitHub Actions APK Builds

This repository includes a continuous integration workflow located at `.github/workflows/build-android.yml`.

### How to trigger the APK build and download the APK:
1. **Push to GitHub**: Push your changes to the `main` branch, or manually trigger the workflow:
   - Navigate to your repository on GitHub.
   - Click the **Actions** tab.
   - In the left sidebar, click **Build Android APK**.
   - Click **Run workflow** -> select branch `main` -> click **Run workflow**.
2. **Download Artifact**:
   - Once the build run turns green (success checkmark), click on the completed run.
   - Scroll down to the **Artifacts** section at the bottom of the summary page.
   - Click on **Cash-Crunch-APK** to download the ZIP file.
3. **Install on Android Device**:
   - Extract the ZIP file on your Android device (or transfer the extracted `app-debug.apk` to your phone via USB/Google Drive/Airdrop).
   - Tap the APK file to install. If prompted, enable "Install unknown apps" in Android settings.
   - Enjoy playing Cash Crunch in landscape mode!

---

## App Specifications
- **App Name**: Cash Crunch
- **Application ID**: `com.mintoo.cashcrunch`
- **Orientation**: Sensor Landscape (auto-rotates to match landscape grip)
- **Minimum Android Version**: Android 8.0 (API Level 26)
- **Target Android Version**: Android 15 (API Level 35)
