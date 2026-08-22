# Android / Android TV

This folder follows the React Native 0.87 stable Android template structure.

## Requirements

- Node.js >= 22.11
- Android Studio with an Android SDK installed
- Android SDK/Build Tools matching the project configuration
- JDK compatible with the React Native 0.87 Android toolchain

## Install dependencies

From `mobile/`:

```bash
npm install
```

## Configure backend

Edit:

```text
mobile/src/config.js
```

For the Android emulator, `http://10.0.2.2:3000` points to the host computer.
For a physical phone or TV, use the backend machine's LAN IP during development.
Use HTTPS in production.

## Run

```bash
npm start
npm run android
```

## Build release APK

From `mobile/android/`:

```bash
./gradlew assembleRelease
```

Output:

```text
mobile/android/app/build/outputs/apk/release/app-release.apk
```

The release build currently uses the debug signing key for development only. Create a proper release keystore before publishing.

## Android TV

The manifest includes `LEANBACK_LAUNCHER`, disables the touchscreen requirement, locks the initial UI to landscape, and the React Native UI uses focusable `Pressable` channel items for D-pad navigation.
