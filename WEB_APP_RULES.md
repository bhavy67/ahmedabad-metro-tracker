# Web + App Project Rules

> A reusable rulebook for building **one product that runs as a website, an installable phone app, and a Google Play app — from a single codebase.**
> Distilled from shipping *MetroNow* (Ahmedabad Metro live tracker) end to end: design → PWA → audits → Play Store.
> Copy this file into the root of every new project. Point your AI coding agent at it (e.g. reference it from `CLAUDE.md` / `AGENTS.md`).

---

## 0. How to use this file

- **Rules are written as MUST / SHOULD / AVOID.** MUST = non-negotiable. SHOULD = default unless you have a reason. AVOID = learned the hard way.
- Every section ends with a **checklist**. A phase isn't done until its checklist is green.
- Each rule that came from a real incident is tagged **[lesson]** with what went wrong, so future-you knows *why*.
- When this file and a project's own docs disagree, the project wins — then update this file.

---

## 1. The strategy in one picture

```
           ┌──────────────── one codebase (React + TS) ────────────────┐
           │                                                           │
   Website (any browser)  ──►  PWA (installable, offline)  ──►  Play Store app (TWA)
           │                         │                              │
      deploy = live           same deploy = live              same deploy = live
                                                         (rebuild only when the
                                                          Android wrapper changes)
```

### Decision tree — pick the lightest option that works

| Need | Choose | Why |
|---|---|---|
| Website + "install to home screen" + offline | **PWA** | Zero extra code. Always start here. |
| …plus a Google Play listing | **PWA + TWA (Bubblewrap)** | ~1 MB Android shell around your live site. Web deploys update the app instantly, no store review. |
| …plus home-screen widgets, scheduled local notifications, background tasks, deep native APIs | **Capacitor** | Same React code, real native plugins. Each change = new store release. |
| …plus heavy native UI, complex gestures, 3D, offline-first DB sync at scale | **React Native / native** | Only when the web genuinely can't. Months, not days. |
| iOS App Store | **Capacitor** (TWA is Android-only) | Apple rejects thin web wrappers without native value — plan real native features. |

**MUST:** Build the PWA first and make it excellent. Every later option wraps it; a weak PWA makes a weak app.

---

## 2. Non-negotiables (the short list)

1. **Mobile-first, then scale up.** Design at 390 px; verify at 320 / 390 / 768 / 1024 / 1440 / 1920.
2. **Works offline** for its core job. Network = enhancement.
3. **Test the production build**, never only `dev`. **[lesson]** The live map worked in dev and was completely broken in production (MapLibre's worker file wasn't emitted). Only a prod-build E2E run caught it.
4. **No secrets in the client.** Ever. Anything in the bundle is public.
5. **A privacy page that matches reality** — audit actual network calls and storage before writing it.
6. **Accessibility 100 on Lighthouse/axe** is the floor, not the goal.
7. **Every dependency must earn its bytes.** **[lesson]** An animation library cost 46 KB gzipped for two sliding pills; CSS did it for free.
8. **Decisions that can't be undone get confirmed first:** package/app ID, domain, store publishing, signing keys, data deletion.
9. **Passwords and signing keys never pass through an AI agent or chat.** The human creates and stores them.
10. **One branch per phase, one commit per meaningful step**, simple imperative messages.

---

## 3. Default stack

| Layer | Default | Notes |
|---|---|---|
| Build | **Vite** | Fast, first-class PWA plugin. |
| UI | **React + TypeScript (strict)** | React Compiler on if available. |
| Styling | **Tailwind v4** + CSS custom properties for tokens | Tokens on `:p`; utilities for layout. |
| Components | **shadcn/ui on Base UI or Radix** | Copy-in components you own; restyle the primitives once. |
| Routing | **React Router** | URL is state (see §5). |
| Icons | **Tabler / Phosphor** (tree-shaken) | One family, one stroke weight. |
| PWA | **vite-plugin-pwa** (Workbox, `generateSW`) | `registerType: 'autoUpdate'`. |
| Maps (if needed) | **MapLibre GL** + **OpenFreeMap** tiles | Free, no API key. See §9. |
| Tests | **Vitest** (+ happy-dom) | Unit-test all domain logic. |
| Lint | **oxlint** (or ESLint) | Zero errors before merge. |
| Hosting | **Vercel** (custom domain) | `vercel.json` for headers + SPA rewrites. |
| Android | **Bubblewrap (TWA)** | §13. |
| Package manager | Whatever the repo's lockfile says | **[lesson]** Don't create a second lockfile — use `npx bun …` if the repo uses `bun.lock` and bun isn't installed. |

**AVOID** adding: animation libraries for simple transitions, state-management libraries before you have shared state pain, date libraries for one format, UI kits you'll fight.

---

## 4. Project structure

```
/
├─ WEB_APP_RULES.md          ← this file
├─ index.html                ← theme-color, viewport-fit=cover, color-scheme
├─ vite.config.ts            ← PWA manifest + workbox + define() build stamps
├─ vercel.json               ← SPA rewrite + security headers + cache headers
├─ public/
│  ├─ .well-known/assetlinks.json   ← Android ownership proof (TWA)
│  ├─ robots.txt
│  └─ icons (192, 512, maskable-512, apple-touch, favicon.svg)
├─ scripts/                  ← data build + icon generation (node/bun CLIs)
├─ android/                  ← Bubblewrap project (keystore git-ignored)
├─ components/               ← shared UI primitives (Bezel, Button, Drawer…)
├─ design-concepts/          ← kept HTML design explorations (reference only)
└─ src/
   ├─ lib/<domain>/          ← PURE logic + *.test.ts (no React, no DOM)
   ├─ hooks/                 ← useX(): storage, clock, geolocation, network
   ├─ features/<area>/       ← screens + their components
   │  └─ shell/              ← AppShell, nav, footer, 404, privacy, back button
   ├─ data/generated/        ← build output of scripts/ (committed, small)
   └─ index.css              ← tokens + component classes + keyframes
```

**Rules**
- **MUST:** Domain logic lives in `src/lib`, is pure, and is unit-tested. UI never re-implements it.
- **MUST:** Generated data is produced by a script, never hand-edited, and records its **source + effective date**.
- **SHOULD:** One component per file; colocate small helpers; no barrel files.
- **SHOULD:** Keep design explorations (`design-concepts/`) in the repo — they're the visual reference when extending the UI.

---

## 5. Architecture rules

### State
- **MUST: The URL is state** for anything shareable or refresh-worthy (search, filters, selected items, modes). Seed state from the URL **lazily in `useState(() => …)`**, then mirror back with `setSearchParams(…, { replace: true })`, preserving unrelated params.
  **[lesson]** The journey planner lost its result on refresh; shared links only worked via a button.
- **MUST:** Persisted user data (favourites, settings) goes through a tiny hook that wraps `localStorage` in `try/catch` and validates what it reads (old shapes, missing fields → sane defaults).
- **SHOULD:** Module-level caches for expensive one-time work (e.g. geolocation result, precomputed lookups) so navigating away and back is instant.
- **AVOID:** `setState` inside effects to "sync" values you could derive or initialise directly.

### Time, live data, animation
- **MUST:** One shared clock (`useSyncExternalStore` + one 1 s interval) for the whole app. Never a timer per component.
- **MUST:** 60 fps visuals (moving markers, progress) run in `requestAnimationFrame` and write to the DOM/SVG directly — **never re-render React per frame**.
- **SHOULD:** A dev-only time override (`?clock=HH:MM:SS&day=N`) for anything time-dependent. It makes edge cases (late night, first train, weekends) testable in seconds.

### Compute on device
- **SHOULD:** If the data is small and public, ship it and compute locally (routing, ETAs, nearest-X). Works offline, no server, no privacy surface.
- **MUST:** Benchmark hot paths. Rule of thumb: per-second work < 2 ms, per-frame work < 0.1 ms.

### Hooks order
- **MUST:** No early `return` before hooks. Resolve invalid params to a placeholder, run hooks, *then* redirect. **[lesson]** Lint caught conditional hooks in a page that redirected on bad IDs.

### Checklist
- [ ] Refresh any screen → same state
- [ ] Share any URL → recipient sees the same thing
- [ ] Storage blocked (private mode) → app still works
- [ ] No component owns its own interval
- [ ] Domain logic has tests; UI has none of it

---

## 6. Mobile UX rules

### Layout & viewport
- **MUST:** `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- **MUST:** Respect safe areas: `padding: env(safe-area-inset-top/bottom)` on fixed bars.
- **MUST:** Use `100dvh` / `min-h-[100dvh]`, never `100vh` (iOS URL bar jumps).
- **MUST:** No horizontal page scroll at 320 px. Test it; decorative glows must be clipped.
- **MUST:** Grid children that contain scrollers or long text get `min-width: 0` (`minmax(0,1fr)`). **[lesson]** Cards overflowed the right edge on mobile until this was added.
- **SHOULD:** Floating nav (top island on desktop, bottom dock on phones) over a single scroll container; give that container top/bottom padding equal to the bars + safe area.
- **[lesson] Sticky inside a padded scroll container:** `top` is measured from *inside* the padding. `top: 0` already sits below it — `top: <padding>` doubles it.

### Touch & interaction
- **MUST:** Tap targets ≥ 44×44 px. Make **whole rows/cards the link**, not just the text inside. **[lesson]** Departure rows had 23 px tap targets.
- **MUST:** Inputs ≥ 16 px font size (iOS zooms the page on focus otherwise).
- **MUST:** Press feedback (`:active` scale 0.97–0.98) on everything tappable.
- **MUST:** Back buttons go **back** (`navigate(-1)`) when there's in-app history, and to Home on a cold deep link (`location.key === 'default'`). **[lesson]** Back always went Home, losing context.
- **MUST:** A real **404 route** with a way out. **[lesson]** Unknown URLs rendered a blank black screen.
- **MUST:** Overlays (menus, sheets) close on Escape, trap/inert the background, and stop the page underneath from scrolling.
- **SHOULD:** Bottom sheets (drawers) for pickers and details on phones; centred max-width on desktop.
- **SHOULD:** Tell users *why* something failed and what still works ("Search needs a connection. Popular places below still work offline.").
- **SHOULD:** Don't offer silly options — e.g. suggest an auto/cab instead of a 50-minute walk.

### Accessibility
- **MUST:** Visible `:focus-visible` ring (2 px, offset 2 px, brand colour). Browser defaults vanish on dark themes. **[lesson]**
- **MUST:** Accessible name **contains the visible text** (axe `label-content-name-mismatch`). "Save" → `aria-label="Save to favourites"`, not "Add to favourites".
- **MUST:** `prefers-reduced-motion` turns animations into instant state changes.
- **MUST:** Colour is never the only signal (line colour + name, status colour + text).
- **SHOULD:** Bilingual/local-script labels where your users read them (e.g. Gujarati station names).

### Checklist
- [ ] 320 / 390 / 768 / 1024 / 1440 / 1920 screenshots reviewed
- [ ] No sideways scroll at any width
- [ ] Every interactive element reachable by keyboard with a visible ring
- [ ] axe: 0 violations on every route
- [ ] 404, offline, empty, error, and "no data right now" states designed

---

## 7. Design system rules

- **MUST:** All colours are **tokens on `:root`** (background, foreground, card, border, primary, destructive, live/success, plus brand/category colours). Components never hard-code hex — except places that can't read CSS (SVG filters, generated icons), which import a single constants map.
- **MUST:** Dark mode is a **token swap**, not a second stylesheet. If the product is dark-only by design, say so in `index.html` (`color-scheme: dark`, `class="dark"`, `theme-color`).
- **MUST:** Animate only `transform` and `opacity`. One easing curve for the whole app (e.g. `cubic-bezier(0.32,0.72,0,1)`).
- **MUST:** `backdrop-filter` only on fixed/sticky elements, never on scrolling content (mobile GPU death).
- **SHOULD:** CSS for UI motion (keyframes, transitions, sliding indicators). For equal-width tabs, slide the indicator with `translateX(index * 100%)`; for variable widths, measure in `useLayoutEffect` and write to the element directly.
- **SHOULD:** A small set of reusable surface classes (`.bezel`, `.surface`, `.glass`, `.pill-btn`) instead of repeating 15 utilities everywhere.
- **SHOULD:** Explore 2–3 genuinely different design directions as standalone HTML first (`design-concepts/`), pick one, then implement. Cheap to compare, keeps the winner as reference.
- **AVOID:** Generic fonts (Inter/Roboto/Arial) for a brand you want remembered; pick a display + body + mono trio and self-host via `@fontsource` (works offline).
- **AVOID:** Showing internal/dev data in the UI (build IDs, cache epochs). Put diagnostics one tap away (an "About" sheet), not on the home screen. **[lesson]**

### Naming the product
- **SHOULD:** The name says what it is and where (e.g. *MetroNow*). Abstract names (*Pulse*) read as unrelated categories. **[lesson]**
- **MUST NOT:** Use an official body's name/logo alone for an unofficial app (store impersonation policy). Say "unofficial" in the listing and privacy page.
- **SHOULD:** Check the name isn't an existing app in your category and not an obvious trademark.

---

## 8. PWA rules

### Manifest (via vite-plugin-pwa)
```ts
manifest: {
  id: '/',                       // stable identity
  name: 'AppName — What it is',  // full name
  short_name: 'AppName',         // ≤ 12 chars, shows under the icon
  description: '…',
  start_url: '/', scope: '/', display: 'standalone',
  theme_color: '#050507', background_color: '#050507',
  lang: 'en-IN', dir: 'ltr',
  categories: ['travel', 'navigation'],
  icons: [
    { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  shortcuts: [/* 2–4 deep links to top tasks */],
  // NO `orientation` lock if the layout is responsive. [lesson]
}
```
- **MUST:** Icons generated from one source mark by a script (`scripts/generate-icons.ts`) — any + maskable (content in the inner 72–80 %) + apple-touch + favicon.

### Service worker & updates
- **MUST:** `registerType: 'autoUpdate'`, `navigateFallback: '/index.html'`, precache app shell + data.
- **MUST:** An "update ready" banner, plus periodic `registration.update()` (on interval, on tab visible, on reconnect). Installed apps are *resumed*, not reloaded — without this, phones sit on old builds for weeks.
- **MUST:** A **cache epoch** ("big red button"): a number in a JSON file that, when bumped, renames Workbox caches and makes clients purge on boot. Plus a user-facing **"Clear cache & reload"**.
- **MUST:** Runtime-cache third-party assets you depend on offline (map tiles, styles, fonts) with `CacheFirst` + expiration.
- **MUST:** Offline banner when `navigator.onLine` is false — and features that need the network say so in place.

### Install UX
- **MUST:** Android/desktop: capture `beforeinstallprompt`, show an Install button.
- **MUST:** **iOS has no install prompt.** Detect iOS and show a 2-step "Share → Add to Home Screen" guide behind the same button. **[lesson]** The button was invisible on every iPhone.
- **MUST:** On phones, the install button is visible in the top bar — not buried in a menu. **[lesson]**
- **SHOULD:** In dev, force the button visible so it can be styled.

### Checklist
- [ ] Lighthouse installable; manifest has id/start_url/scope/maskable icon
- [ ] Airplane mode → reload → core features work
- [ ] New deploy → "update ready" appears on an open installed app
- [ ] Cache epoch bump purges old clients
- [ ] iOS shows install guide; Android shows native prompt

---

## 9. Third-party services

- **MUST:** Before depending on any free service, verify **today** that it needs no key and allows your usage. **[lesson]** Carto basemaps silently started returning "API KEY REQUIRED" watermark tiles (HTTP 200, 2 KB). Switched to **OpenFreeMap**.
- **MUST:** Check `res.ok` on every fetch; non-2xx is an error. Show a human message.
- **MUST:** Debounce + abort search-as-you-type (one request per pause, cancel stale ones).
- **MUST:** Respect usage policies (e.g. Nominatim: low rate, cache, attribute). Note: browsers can't set `User-Agent`; the `Referer` identifies you.
- **MUST:** Map/worker-based libraries: confirm their **worker files ship in the production build**. For MapLibre 6:
  ```ts
  import { setWorkerUrl } from 'maplibre-gl';
  import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
  setWorkerUrl(workerUrl);
  ```
- **MUST:** Don't gate your own content on a third party loading. **[lesson]** Trains and lines waited for the basemap's `load` event; offline or with a broken worker, the map showed nothing. Draw your layer immediately; the basemap is decoration.
- **SHOULD:** Silence harmless third-party warnings at the source (e.g. `map.setMissingStyleImageResolver` with a 1×1 transparent image) so the console stays a signal.

---

## 10. Security & privacy

### Headers (`vercel.json`, applies to all routes)
```json
{ "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://tiles.example.org; font-src 'self' data:; connect-src 'self' https://tiles.example.org https://api.example.org; worker-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" },
{ "key": "X-Content-Type-Options", "value": "nosniff" },
{ "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
{ "key": "Permissions-Policy", "value": "geolocation=(self), camera=(), microphone=(), payment=(), usb=()" },
{ "key": "X-Frame-Options", "value": "DENY" }
```
- **MUST:** **Test the CSP before shipping** on a server that applies the real headers (a 30-line Node server reading `vercel.json` works). Browse every route and collect violations. **[lesson]** Vite inlines assets < 4 KB as `data:` URLs — a font got blocked until `font-src data:` was added. MapLibre needs `worker-src blob:`.
- **MUST:** Verify the built `index.html` has no inline scripts before using `script-src 'self'`.
- **MUST:** Cache headers: `/assets/*` immutable for a year; `sw.js`, `index.html`, `manifest.webmanifest` `max-age=0, must-revalidate`.
- **MUST:** `robots.txt` as a real file (otherwise the SPA rewrite serves HTML and SEO audits fail).

### Privacy
- **MUST:** Before writing the privacy page, grep the code for every `fetch`, external URL, `localStorage` key, and analytics SDK. The page lists exactly those.
- **MUST:** Location used on-device only → say so plainly; never send it anywhere you don't name.
- **SHOULD:** Contact via the repo's Issues page instead of publishing a personal email.
- **SHOULD:** Keep a comment at the top of the privacy component: "if you add a network call, storage key or analytics, update this page".

---

## 11. Performance budgets

| Metric | Budget |
|---|---|
| Main JS (gzip) | ≤ 200 KB (heavy features lazy-loaded) |
| Lighthouse mobile | Performance ≥ 90 · Accessibility 100 · Best Practices 100 · SEO 100 |
| First Contentful Paint (mobile, simulated) | ≤ 2.5 s |
| Total Blocking Time | ≤ 100 ms |
| CLS | 0 |

- **MUST:** Lazy-load route-level heavy deps (maps, charts, editors) with `React.lazy` + `Suspense`.
- **MUST:** Measure, don't guess: build with sourcemaps and sum bytes per package; measure a library's real cost by building a one-line entry that imports it.
- **MUST:** Compare Lighthouse runs **on the same server type**. **[lesson]** A test server without compression made a faster build look 20 points slower.
- **SHOULD:** Remove unused dependencies from `package.json`, not just imports.

---

## 12. Testing & QA

### Layers
1. **Unit (Vitest):** every pure function in `src/lib`. Fixtures are tiny hand-built networks/datasets with known answers.
2. **Data guards:** tests that fail if data goes wrong (unique IDs, coordinates within N km of the network, required fields present). **[lesson]** Curated place coordinates were up to 11 km off; a guard now prevents regressions.
3. **Reference cross-check:** for algorithms (routing, pricing), write a slow, obviously-correct reference and compare across *all* inputs. (14,310 station pairs × 5 times → 0 mismatches.)
4. **E2E (production build):** drive real Chrome via the DevTools Protocol (CDP).
5. **Audits:** axe on every route; Lighthouse mobile; offline run; CSP run.

### E2E rules
- **MUST:** Run against `vite build && vite preview` (or a Vercel-like server with real headers), not the dev server.
- **MUST:** For every route × widths `[320, 390, 768, 1024, 1440, 1920]`, record: page exceptions, console errors, failed requests, elements overflowing the viewport, redirects.
- **MUST:** Script the core user flows with real clicks/typing (setup, search, save, share, reload-persistence, back navigation, offline).
- **MUST:** Edge cases: unknown URL, bad IDs, before/after service hours, weekend schedule, empty states, same origin/destination, offline search.

### Headless browser gotchas **[lesson]**
- Desktop Chrome has a ~500 px minimum window width → use **CDP `Emulation.setDeviceMetricsOverride`** (with `mobile: true`) for phone widths, not `--window-size`.
- `--virtual-time-budget` freezes CSS animations mid-way → entrance animations look "missing". Use real-time waits.
- Cross-origin iframes in headless throttle animations → don't use iframe harnesses for screenshots.
- `--force-prefers-reduced-motion` renders final states for layout checks.
- Always add a global timeout to scripts and kill stray headless Chromes; hung instances block later runs.

### Checklist
- [ ] Unit + data-guard tests green, coverage on `src/lib` ≥ 80 %
- [ ] Every route × width: 0 exceptions, 0 console errors, 0 overflow
- [ ] Core flows pass on the production build
- [ ] axe 0 · Lighthouse budgets met · offline works · CSP clean

---

## 13. Android app (TWA) playbook

> Prerequisite: the PWA is live on a **custom HTTPS domain** and passes §8.

### Decisions (confirm before generating — permanent)
| Item | Rule |
|---|---|
| Domain | Custom subdomain you own (e.g. `app.yourname.in`). The app is tied to it. |
| Package ID | Reverse domain: `in.yourname.app`. **Cannot change after first upload.** |
| Play account | Personal vs organisation (affects closed-testing rules and the public developer name). |

### Generate the project (non-interactive)
The Bubblewrap CLI's `init` is interactive; drive the library instead:
```js
// scratch dir: npm i @bubblewrap/core
const { TwaManifest, TwaGenerator, ConsoleLog } = require('@bubblewrap/core');
const m = await TwaManifest.fromWebManifest('https://app.example.in/manifest.webmanifest');
m.packageId = 'in.example.app';
m.launcherName = 'AppName';
m.appVersionName = '1.0.0'; m.appVersionCode = 1;
m.enableNotifications = false;                       // true only if you send web push
m.features = { locationDelegation: { enabled: true } }; // if you use geolocation
m.orientation = 'default';
m.minSdkVersion = 24;                                 // Play automatic protection requires ≥ 24
for (const k of ['themeColorDark','navigationColor','navigationColorDark','navigationDividerColor','navigationDividerColorDark']) m[k] = m.themeColor; // defaults are #000000
m.signingKey = { path: './android.keystore', alias: 'appname' };
await new TwaGenerator().createTwaProject('android', m, new ConsoleLog('gen'));
await m.saveToFile('android/twa-manifest.json');
// Write android/manifest-checksum.txt = sha1(twa-manifest.json) so `bubblewrap build` doesn't prompt to regenerate.
```
- **MUST:** `android/.gitignore` → `*.keystore`, `*.jks`, `keystore.properties`, `.gradle/`, `build/`, `local.properties`, `*.apk`, `*.aab`, `*.idsig`.
- **MUST:** `targetSdkVersion` = current Play requirement (check yearly).
- **MUST:** `minSdkVersion` ≥ **24** (Android 7.0). **[lesson]** Bubblewrap defaults to 21, and Play rejects the upload: "Play automatic protection requires a minimum SDK version of 24". Set `m.minSdkVersion = 24` when generating, or edit `twa-manifest.json` + `app/build.gradle` and recompute `manifest-checksum.txt`.

### Toolchain (no admin rights needed)
- Install into `~/.bubblewrap/`: **JDK 17**, **Android cmdline-tools** (`android_sdk/cmdline-tools/latest`), `platforms;android-<target>`, `build-tools;<version Bubblewrap expects>`, `platform-tools` (adb).
- Write `~/.bubblewrap/config.json` → `{ "jdkPath": "~/.bubblewrap/jdk", "androidSdkPath": "~/.bubblewrap/android_sdk" }` (absolute paths) and `android/local.properties` → `sdk.dir=…`.
- **[lesson]** Bubblewrap validates `<sdk>/bin` or `<sdk>/tools` (legacy layout). Add a wrapper script `<sdk>/bin/sdkmanager` that `exec`s `cmdline-tools/latest/bin/sdkmanager` — a folder symlink breaks sdkmanager's classpath.
- **[lesson]** Bubblewrap pins a build-tools version (`BUILD_TOOLS_VERSION` in `@bubblewrap/core`) — install exactly that one.
- **[lesson]** GitHub-hosted downloads (Adoptium JDK, Gradle distributions) can crawl on some networks. Use an alternative (Azul Zulu JDK; a Gradle mirror) **and verify the official SHA-256** before use. Drop the verified Gradle zip into `~/.gradle/wrapper/dists/<name>/<hash>/` — no repo changes.
- Run a **debug build** first (`./gradlew assembleDebug`) to validate the toolchain without the signing key.
- Run `npx @bubblewrap/cli doctor` → must print "valid".

### Signing (human-only step)
```bash
cd android
~/.bubblewrap/jdk/Contents/Home/bin/keytool -genkeypair -v -keystore android.keystore \
  -alias appname -keyalg RSA -keysize 2048 -validity 10000
```
- **MUST:** The owner types the password. Back up the keystore + password in a password manager **immediately**. Lose it → you can never update the app.
- **[lesson]** In Claude Code, `! command` runs in the session; in a normal terminal, drop the `!` (zsh treats it as negation).
- **[lesson]** Paths in instructions are relative to *where the terminal is*. Inside `android/`, it's `git add file`, not `git add android/file`.

### Prove ownership (Digital Asset Links)
1. Upload-key fingerprint: `keytool -list -v -keystore android.keystore -alias appname | grep SHA256:`
2. `public/.well-known/assetlinks.json`:
   ```json
   [{ "relation": ["delegate_permission/common.handle_all_urls"],
      "target": { "namespace": "android_app", "package_name": "in.example.app",
                  "sha256_cert_fingerprints": ["<UPLOAD KEY SHA256>", "<PLAY APP SIGNING SHA256>"] } }]
   ```
3. **Deploy to the production domain** (preview URLs don't count). Verify it returns JSON, not your SPA HTML.
4. After the first Play upload, add Google's **App signing key** fingerprint (Play Console → App integrity). Without both, the Play-installed app shows a browser bar.

### Build & test
```bash
cd android && npx @bubblewrap/cli build --skipPwaValidation
# → app-release-bundle.aab (Play) + app-release-signed.apk (phone)
```
Install the APK (send to phone or `adb install`) and verify:
- [ ] No browser bar (after assetlinks is live)
- [ ] Location prompt is Android's own and works
- [ ] Airplane mode → app still works
- [ ] Back button walks screens, then exits
- [ ] Shared links (`https://app.example.in/path?x=y`) open in the app
- [ ] Long-press icon shows shortcuts
- [ ] Status/nav bar colours match the app

---

## 14. Google Play launch checklist

- [ ] Developer account ready (one-time fee). New **personal** accounts have had to run a **closed test with ≥ 12 testers for 14 days** before production — verify the current rule in Play Console.
- [ ] App created: name "AppName – What it is", category, free/paid
- [ ] `.aab` uploaded to **Internal testing** first
- [ ] Play App Signing fingerprint added to `assetlinks.json` and deployed
- [ ] Store listing: icon 512×512, feature graphic 1024×500, ≥ 2 phone screenshots (generate with the CDP screenshot tooling at 1080×1920), short + full description
- [ ] Description states "unofficial / not affiliated with …" if applicable; no third-party logos
- [ ] Privacy policy URL (live on production)
- [ ] Data safety form matches the privacy page (on-device location = not collected)
- [ ] Content rating questionnaire, target audience, ads declaration
- [ ] Closed testing → production access → staged rollout

---

## 15. Release & operations

- **Web change** → deploy → website, installed PWA, and Play app all update. No store review.
- **Android wrapper change** (package config, colours, permissions, shortcuts, SDK target) → bump `appVersionCode` (+ `appVersionName`) in `twa-manifest.json` → rebuild → upload. Commit: `Release Android 1.0.1`.
- **Bad build stuck on phones** → bump the cache epoch → deploy.
- **SHOULD:** Show the data/timetable effective date in the app (About sheet + footer) and flag unverified sources honestly.
- **SHOULD:** Build stamp (version · build id · cache epoch) in the About sheet for bug reports.

---

## 16. Git workflow

- **MUST:** Branch per phase (`feature/<thing>`, `fix/<thing>`); never commit straight to `master` for multi-step work.
- **MUST:** Commit messages: simple, imperative, one line, one per phase/step.
  `Add privacy policy page for Play Store` · `Add Android TWA project for Play Store` · `Add Digital Asset Links for Android app`
- **MUST:** Never commit keystores, `.env` with secrets, build outputs, `local.properties`.
- **[lesson]** `git rm` *stages* the deletion; plain `rm` leaves it unstaged. Be consistent so staged changes don't surprise you.
- **[lesson]** On a **fork**, GitHub's PR page defaults the base to the *upstream* repo. Switch base to your fork before creating the PR.
- **[lesson]** Resolving a stale branch: `git merge origin/master --no-commit`, resolve keeping both sides' features, run tests/build/screenshots, then let the human commit. Test-merge first with `git merge-tree --write-tree` to see conflicts without touching the tree.
- **SHOULD:** Commit inline (`git commit -m "…"`) to avoid editor/swap-file traps.

---

## 17. Rules for the AI agent working on these projects

1. **Read before writing.** Trace the real flow end to end before changing it.
2. **Laziest correct solution.** Reuse what's in the repo → stdlib/platform → installed deps → minimal new code. No new dependency for something a few lines of CSS/TS can do.
3. **Verify in a real browser on the production build** at phone and desktop widths before saying "done". Screenshots or it didn't happen.
4. **Report honestly:** what was tested, what wasn't, what failed, and corrections to earlier claims.
5. **Ask before irreversible or outward-facing actions** (package IDs, publishing, pushing, deleting data, choosing paid services). Default sensibly for everything else and say what you defaulted.
6. **Never handle secrets.** Signing passwords, API keys, account credentials stay with the human; give them the exact command to run.
7. **Leave no mess:** remove temp harnesses, coverage folders, stray servers and headless browsers; don't create second lockfiles.
8. **Keep the human's mental model current:** short progress notes during long tasks; end each phase with a commit message and the next steps.
9. **Don't delete reference material** (design concepts, docs) unless asked.
10. **Update this file** when a new lesson is learned.

---

## 18. Phase map (copy into each new project's README)

| Phase | Deliverable | Done when |
|---|---|---|
| 0. Concepts | 2–3 standalone HTML design directions | One chosen, kept in `design-concepts/` |
| 1. Core web app | Screens, domain logic + tests, routing, URL state | §5 + §6 checklists green |
| 2. Design system | Tokens, surfaces, motion, responsive layouts | Screenshots at all widths approved |
| 3. PWA | Manifest, icons, SW, offline, install UX | §8 checklist green |
| 4. Hardening | Audit → fix critical/high/medium/low | §10–§12 checklists green |
| 5. Launch web | Custom domain, headers, privacy page, robots | Live, Lighthouse budgets met |
| 6. Android | TWA project, toolchain, signing, assetlinks | §13 phone checklist green |
| 7. Play Store | Listing, data safety, testing tracks | §14 checklist green, live |
| 8. Operate | Releases, cache epoch, data refresh | Documented in README |

---

## 19. Definition of Done (every PR)

- [ ] `tsc` clean · lint 0 errors · tests green
- [ ] Production build succeeds; bundle within budget
- [ ] Screenshots at 390 and 1440 (plus 320 if the header/nav changed)
- [ ] No new console errors on the production build
- [ ] Offline still works for core flows
- [ ] axe 0 on touched routes
- [ ] Privacy page still accurate (no new network calls/storage/analytics without updating it)
- [ ] One clear commit message; branch pushed; PR base is correct
