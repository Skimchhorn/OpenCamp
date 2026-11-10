# OpenCamp web

React + Vite + TypeScript client for the OpenCamp API: map search, campsite details, contributions (add, review, verify, report, photos), saved campsites and an admin moderation page.

Needs Node 22+.

## Run

Start the backend first (see [`backend/README.md`](../../backend/README.md)); it listens on `http://localhost:8080`.

```sh
npm install
npm run dev   # http://localhost:5173
```

In development, Vite proxies `/api` and `/uploads` to `http://localhost:8080`, so no CORS setup is needed.

## Environment

| Variable | Default | Use |
|---|---|---|
| `VITE_API_URL` | empty (same origin) | API origin for production builds, e.g. `https://api.example.com`. The backend must then list the web origin in `CORS_ORIGINS`. |

```sh
VITE_API_URL=https://api.example.com npm run build   # output in dist/
```

Map tiles come from OpenStreetMap's public tile server, which has a [usage policy](https://operations.osmfoundation.org/policies/tiles/); use a dedicated tile provider for real traffic.

## Checks

```sh
npm run lint      # oxlint
npm run build     # type-check + production build
npm test          # Vitest unit and component tests
npx playwright install chromium   # once
npm run test:e2e  # Playwright smoke test; needs the backend running, starts the dev server itself
```

The end-to-end test registers a new user, adds a campsite, checks its detail page shows "Not verified yet", then deletes it.
