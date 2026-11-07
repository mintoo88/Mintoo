# Cash Crunch - Native Android (Kotlin + Jetpack Compose)

This directory contains the complete native Android project source for **Cash Crunch**, written in Kotlin using Jetpack Compose and Compose Canvas.

## Project Structure

- `app/src/main/java/com/cashcrunch/game/MainActivity.kt`: Single Activity host with lifecycle hooks (pause on background, autosave on stop).
- `app/src/main/java/com/cashcrunch/game/viewmodel/GameViewModel.kt`: State management, time-based game loop, touch physics, and persistence.
- `app/src/main/java/com/cashcrunch/game/model/GameModels.kt`: Data classes for banknotes, particles, upgrades, and save state.
- `app/src/main/java/com/cashcrunch/game/ui/PlayfieldCanvas.kt`: 2D Compose Canvas rendering tabletop, banknotes, rotary shredder, and particles.
- `app/src/main/java/com/cashcrunch/game/ui/CashCrunchScreen.kt`: Jetpack Compose UI layout with HUD, tactile dispenser button, and navigation.
- `app/build.gradle.kts`: Gradle build configuration with Compose BOM 2024.10, Kotlin Compose compiler plugin, and Material 3.

## How to Build & Run on an Android Device

1. Open Android Studio (Ladybug / Koala or newer recommended).
2. Choose **File > Open** and select this `android` folder.
3. Allow Gradle to sync.
4. Connect an Android phone via USB (with Developer Options > USB Debugging enabled) or start an Android Emulator.
5. Click **Run 'app'** (or press Shift + F10).
6. To build an APK for direct installation:
   - Run `gradlew assembleDebug` in the terminal.
   - APK output location: `app/build/outputs/apk/debug/app-debug.apk`.
