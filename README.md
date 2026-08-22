# Ahmedabad Metro — Live Tracker

A fast, offline-capable Progressive Web App for the Ahmedabad Metro network. Live train positions, departure boards, journey planning and more — all computed from the official GMRC timetable.

---

## Features

### Live Network
- **Live train positions** — every active train on the network shown on an interactive map, with heading indicators and crowd-level labels
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
| **Commute mode** | Save a home and work station pair; a smart card on the home screen shows the next departure in the right direction based on time of day |

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
    └── metro/          # Network data, timetable, CSA planner, fare logic
```

---

## Data

Ahmedabad Metro does not publish a real-time GTFS feed. All train positions and departure times are computed from the official GMRC schedule against the current clock. Delays and service disruptions cannot be detected.

---

*Built with React + Vite. Not affiliated with GMRC or the Ahmedabad Metro Rail Corporation.*
