# OpenCamp mobile

Expo (React Native + TypeScript, Expo Router) client for OpenCamp: map of nearby free campsites, campsite details with verifications, reviews and photos, add campsite, saved campsites, and sign in / register.

## Run with Expo Go

Start the backend first (see `backend/README.md`), then:

```sh
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS or Android).

The app talks to the API at `EXPO_PUBLIC_API_URL` (default `http://localhost:8080`). `localhost` only works in a simulator on the same computer. On a physical phone, use your computer's LAN IP and make sure the phone is on the same network:

```sh
EXPO_PUBLIC_API_URL=http://192.168.1.20:8080 npx expo start
```

Or put it in `apps/mobile/.env.local` (git-ignored).

The JWT is stored with Expo SecureStore and cleared on sign-out.

## Checks

```sh
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npm test            # jest-expo + React Native Testing Library
npx expo-doctor
```

## Maps

Maps use `react-native-maps`, which runs in Expo Go (Apple Maps on iOS, Google Maps on Android). Android builds made with EAS need a Google Maps API key: set `android.config.googleMaps.apiKey` in `app.json` (or via an app config reading an EAS secret) before building.

## EAS builds

`eas.json` has `development` (internal debug build), `preview` (internal release, Android APK) and `production` profiles. Set `EXPO_PUBLIC_API_URL` for each EAS environment to the deployed API URL (`eas env:create`), then:

```sh
npx eas-cli build --profile preview --platform all
```
