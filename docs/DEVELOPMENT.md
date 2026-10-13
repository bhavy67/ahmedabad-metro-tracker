# Developing MetroNow

Everything a contributor or maintainer needs. For what the app *is*, see the [README](../README.md). For the rules this project follows (and future web + app projects reuse), see [WEB_APP_RULES.md](../WEB_APP_RULES.md).

---

## Run it

```bash
bun install          # or npm install (the repo's lockfile is bun.lock)
bun run dev          # http://localhost:5173
bun run test         # unit tests (Vitest)
bun run lint         # oxlint
bun run build        # type-check + production build into dist/
bun run preview      # serve the production build (service worker active)
```

Handy while developing:

- `?clock=18:10:00&day=3` — pretend it's 6:10 PM on a Wednesday. Every clock consumer (departures, live map, planner) follows the override. Great for testing late-night, first-train and weekend behaviour.
- `?cachebust=1` — wipe this browser's caches and service worker, then reload.

> The install prompt and service worker only behave like production in the production build (`bun run build && bun run preview`). Always test the map there too — it depends on a worker file the dev server hides.

---

## Stack

| Layer | Choice |
|---|---|
| App | React 19 + TypeScript, Vite, React Router |
| Styling | Tailwind CSS v4 + design tokens in `src/index.css` ("Pulse" design system) |
| Components | shadcn on Base UI primitives |
| Map | MapLibre GL + OpenFreeMap dark style |
| Place search | OpenStreetMap Nominatim |
| PWA | vite-plugin-pwa + Workbox |
| Fonts | Unbounded · Manrope · Geist Mono (self-hosted via @fontsource) |
| Tests / lint | Vitest · oxlint |
| Hosting | Vercel (`metro.bhavyladani.in`) |
| Android | Trusted Web Activity built with Bubblewrap (`android/`) |

---

## Where things live

```
src/
├── features/
│   ├── shell/       # App shell, top island, mobile dock, menu, footer, 404, privacy
│   ├── map/         # Live map, network schematic, train & station sheets
│   ├── station/     # Station page, departure board, last-train strip
│   ├── timeline/    # Line page
│   ├── journey/     # Journey planner + station picker
│   ├── commute/     # Commute card
│   ├── places/      # Nearest station to a place
│   └── pwa/         # Install button, offline + update banners
├── hooks/           # useMetroClock, useLiveTrains, useNearestStation, storage hooks…
├── lib/metro/       # Pure logic + tests: network, timetable, CSA planner, ETAs, fares, geo, places
├── lib/pwa/         # Cache-epoch guard + hard reset
└── data/generated/  # Built from data-source/ by scripts/build-network.ts — don't hand-edit
android/             # Bubblewrap TWA project (keystore is git-ignored)
design-concepts/     # The three original design explorations (reference — keep)
docs/screenshots/    # README images
```

Data pipeline: `bun run build:data` reads the GMRC workbook + OSM geometry in `data-source/` and regenerates `src/data/generated/`, then verifies it.

---

## Releasing the web app

```bash
bun run release                    # patch bump (0.1.2 -> 0.1.3), then rebuild
bun run release --minor            # 0.1.2 -> 0.2.0
bun run release --major            # 0.1.2 -> 1.0.0
bun run release --set 2.0.0-rc.1   # exact version
bun run release --no-build         # bump only
bun run release --show             # print the current version
```

Push to `master` → Vercel deploys → the website, installed PWAs and the Android app all update.

The version is the human-facing label. It's stamped into the bundle and shown in the **About live data** sheet (tap **Live**) next to the build id — that's what a bug report should quote. It is deliberately *not* a cache lever: ordinary releases invalidate themselves through content hashing.

If the build fails the bumped version is left in place — the build is the thing to fix.

---

## Caching & cache busting

The app is a service-worker PWA, so a client can keep serving an old build after a deploy. Three levers, in increasing order of force:

**1. Ordinary deploys — automatic.** Assets are content-hashed and the service worker swaps its precache on its own. `sw.js`, `index.html` and the manifest are served `must-revalidate` (`vercel.json`); hashed assets are `immutable`. The app re-checks for a new service worker every 15 minutes, on reconnect, and whenever it returns to the foreground. When one is ready, the update banner offers a one-tap reload.

**2. Force every client to wipe — `bun run cache:bust`.**

```bash
bun run cache:bust                       # bump the epoch by one
bun run cache:bust --reason "bad sw"     # bump, recording why
bun run cache:bust --show                # print the current epoch
bun run cache:bust --set 12              # jump to a specific epoch
```

This bumps `epoch` in `cache-bust.json`. Commit and deploy; every Workbox cache is renamed, and every installed client wipes Cache Storage + service workers before first paint, once, then reloads. It's blunt (clients re-download everything, including cached map tiles) — use it when a bad build is stuck on people's devices.

**3. One stuck user — no deploy needed.** Open any URL with `?cachebust=1`, or tap **Clear cache & reload** in the footer of the home screen.

---

## Android app (TWA)

The Play Store app is a thin Android shell around `https://metro.bhavyladani.in`.

- Project: `android/` (generated by Bubblewrap; config in `android/twa-manifest.json`)
- Package: `in.bhavyladani.metro` — permanent
- Ownership proof: `public/.well-known/assetlinks.json` (upload-key **and** Play-signing-key fingerprints)
- Toolchain: JDK 17 + Android SDK in `~/.bubblewrap/` (see WEB_APP_RULES.md §13)

```bash
cd android
npx @bubblewrap/cli build --skipPwaValidation   # asks for the keystore password
# → app-release-bundle.aab (Play) + app-release-signed.apk (sideload)
```

Web changes never need a new Android build. Only shell changes (name, colours, permissions, shortcuts, target SDK) do: bump `appVersionCode` in `twa-manifest.json`, `npx @bubblewrap/cli update`, build, upload.

---

## Data honesty

Ahmedabad Metro doesn't publish a real-time feed. Positions and departure times are computed from the GMRC timetable against the current clock, so delays and disruptions can't be detected. The timetable's effective date is shown in the app (About sheet + footer) and flagged while it's unverified against the source workbook.
