# Ahmedabad Metro — Live Tracker

A fast, offline-capable Progressive Web App for the Ahmedabad Metro network. Live train positions, departure boards, journey planning and more — all computed from the official GMRC timetable.

---

## Features

### Live Network
- **Live train positions** — every active train on the network shown on an interactive map, with heading indicators and crowd-level labels
- **Persistent train labels** — zoom past the network overview and every train carries its own label: next station, live ETA, and whether it is sitting on a platform or running
- **Per-line timeline** — scrollable timetable for each of the four lines (Blue, Red, Yellow, Violet)
- **Station departure boards** — next departures with countdown timers and last-train warnings

### Journey Planning
- **Journey planner** — fastest route between any two stations with fare, duration and transfer details
- **Station picker** — searchable by name, Gujarati and Hindi

### Home Screen
- **Nearest station** — one-tap location detection, shows live departures from wherever you are
- **Favourite stations** — pin any station to the home screen for instant access to its departure board

### App Experience
- **PWA / installable** — install to your home screen on Android and iOS; works fully offline using the cached schedule
- **Light & dark mode** — respects system preference, manually togglable
- **Responsive layout** — full mobile UI on phones; sidebar navigation on tablet and desktop
- **12-hour clock** throughout

---

## Upcoming Features

These are implemented on a feature branch and will be merged shortly.

| Feature | Description |
|---|---|
| **Arrive by mode** | Flip the journey planner from "depart now" to "I need to arrive by X:XX" — uses a reverse Connection Scan Algorithm to find the latest possible departure |
| **Recent journeys** | The planner remembers your last 3 origin–destination pairs for one-tap re-use |
| **Share a journey** | Share any planned route as a deep link (`/plan?from=…&to=…`) — opens the planner pre-filled on the recipient's device |
| **Commute mode** | Save a home and work station pair; a card on the home screen shows the next departure home → work, with a one-tap flip to the return leg that is remembered |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Components | shadcn (Base UI primitives) |
| Map | MapLibre GL |
| PWA | vite-plugin-pwa + Workbox |
| Fonts | Inter Variable · Bricolage Grotesque · JetBrains Mono |
| Routing | React Router v8 |
| Animations | anime.js · motion/react |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Production build
npm run build

# Preview the production build (service worker active)
npx serve dist
```

> The install prompt and service worker only activate in the production build served over HTTPS (or `localhost`). Use `npx serve dist` to test PWA features locally.

---

## Project Structure

```
src/
├── features/
│   ├── shell/          # App shell, header, sidebar, bottom nav
│   ├── map/            # Live map and train popover
│   ├── station/        # Station page and departure board
│   ├── timeline/       # Per-line timetable view
│   ├── journey/        # Journey planner and station picker
│   ├── commute/        # Commute mode card
│   └── pwa/            # Install prompt, offline banner, update banner
├── hooks/              # useMetroClock, useLiveTrains, useNearestStation, etc.
└── lib/
    ├── metro/          # Network data, timetable, CSA planner, fare logic
    └── pwa/            # Cache epoch guard and hard-reset helpers
```

---

## Releasing

```bash
bun run release                    # patch bump (0.1.2 -> 0.1.3), then rebuild
bun run release --minor            # 0.1.2 -> 0.2.0
bun run release --major            # 0.1.2 -> 1.0.0
bun run release --set 2.0.0-rc.1   # exact version
bun run release --no-build         # bump only
bun run release --show             # print the current version
```

The version is the human-facing label: it is stamped into the bundle and shown
in the app footer next to the build id, so it is what a bug report should quote.
It is deliberately *not* a cache lever — bumping it does not make installed
clients throw anything away, because ordinary releases invalidate themselves
through content hashing. When clients genuinely must discard their caches, run
`bun run cache:bust` as well; the script says so when it finishes.

If the build fails the bumped version is left in place — the build is the thing
to fix, and silently reverting would hide which version was being built.

---

## Caching & cache busting

The app is a service-worker PWA, so a client can keep serving an old build long
after a deploy. There are three levers, in increasing order of force.

**1. Ordinary deploys — automatic.** Assets are content-hashed and the service
worker swaps its precache on its own. `sw.js`, `index.html` and the manifest are
served `must-revalidate` (see `vercel.json`) so the browser always re-checks the
files that decide which build a client lands on; everything hashed is
`immutable`. The app re-checks for a new service worker every 15 minutes, on
regaining connectivity, and whenever it returns to the foreground — an installed
PWA is resumed far more often than it is cold-started. When one is ready the
update banner offers a one-tap reload.

**2. Force every client to wipe — `bun run cache:bust`.**

```bash
bun run cache:bust                       # bump the epoch by one
bun run cache:bust --reason "bad sw"     # bump, recording why
bun run cache:bust --show                # print the current epoch, change nothing
bun run cache:bust --set 12              # jump to a specific epoch
```

This bumps `epoch` in `cache-bust.json`. Commit it and deploy; then

- every Workbox cache is renamed (`cacheId` in `vite.config.ts`), so the new
  service worker cannot reuse a byte of the old precache, and
- every already-installed client compares the built-in epoch against the one it
  last booted with, and wipes Cache Storage plus its service workers before the
  first paint — once, then reloads.

It is blunt: clients re-download everything, including up to 3000 cached basemap
tiles. Use it when a bad build is stuck on people's devices, not for routine
releases.

**3. One stuck user — no deploy needed.** Open any app URL with `?cachebust=1`,
or tap **Clear cache & reload** in the footer of the home screen. Both run the
same wipe on demand. The footer also shows the build id and cache epoch, which
is what turns "it still shows the old version" into something diagnosable.

---

## Data

Ahmedabad Metro does not publish a real-time GTFS feed. All train positions and departure times are computed from the official GMRC schedule against the current clock. Delays and service disruptions cannot be detected.

---

*Built with React + Vite. Not affiliated with GMRC or the Ahmedabad Metro Rail Corporation.*
