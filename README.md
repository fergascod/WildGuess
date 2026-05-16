# iNaturalistID

This project is a React application where a user can interact with [iNaturalist's API](https://api.inaturalist.org/v1/docs/)
to browse the taxonomy of all species that the citizen science portal has information on. It also offers the possibility to take a quizz on the different species within a taxonomic group to hone your visual ID skills!

Check it out: [https://wild-guess-game.vercel.app/](https://wild-guess-game.vercel.app/)

## Getting Started

This is an [Expo](https://expo.dev) app (React Native + react-native-web) that
runs on **web, iOS and Android** from a single codebase.

Install dependencies and start the dev server:

```bash
pnpm install
pnpm start        # then press w / i / a
# or directly:
pnpm web
pnpm ios
pnpm android
```

### Notes for native

- This project targets **Expo SDK 54**. `react-native-maps` and `expo-location`
  are bundled with Expo Go for SDK 54, so `pnpm start` + Expo Go is enough for
  day-to-day development.
- A **development build** (`npx expo prebuild` / `expo run:*`) is only needed
  once you require custom native config — most notably the Android Google Maps
  API key below, which Expo Go cannot pick up.
- **iOS** uses Apple Maps — no API key needed.
- **Android** uses Google Maps: add a Maps SDK API key to `app.json` under
  `android.config.googleMaps.apiKey` for the location picker map to render
  (requires a development build).
- The web build uses Leaflet instead of `react-native-maps` via platform-split
  files (`LocationPickerMap.web.tsx` / `LocationPickerMap.native.tsx`).

