import {defineConfig} from 'vite'
import react, {reactCompilerPreset} from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from "@tailwindcss/vite";
import path from 'node:path'
import {execFileSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {VitePWA} from 'vite-plugin-pwa'

/**
 * Cache busting has two levers, and they are deliberately separate.
 *
 * 1. `buildId` changes on every build. It is only an identity stamp — shown in
 *    the app footer and useful when someone reports "I'm still seeing the old
 *    thing". Ordinary deploys need nothing more: assets are content-hashed and
 *    the service worker picks the new precache up on its own.
 *
 * 2. `epoch` lives in cache-bust.json and only moves when a human runs
 *    `bun run cache:bust`. Bumping it renames every Workbox cache AND makes
 *    already-installed clients purge their storage on next load. That is the
 *    big red button for when a bad build is stuck on people's phones.
 */
const cacheBust = JSON.parse(
    readFileSync(new URL('./cache-bust.json', import.meta.url), 'utf8'),
) as {epoch: number; bustedAt: string; reason: string}

// The human-facing version, moved by `bun run release`. Unlike buildId it is
// stable across rebuilds of the same release, so it is what a bug report should
// quote first.
const {version} = JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as {version: string}

function gitShortSha(): string {
    try {
        return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {stdio: ['ignore', 'pipe', 'ignore']})
            .toString().trim()
    } catch {
        return 'nogit'
    }
}

// CI can pin this (e.g. to a deployment id); otherwise it is sha + build clock,
// which is enough to tell two builds of the same commit apart.
const buildId = process.env.BUILD_ID?.trim() || `${gitShortSha()}.${Date.now().toString(36)}`
const buildTime = new Date().toISOString()

// https://vite.dev/config/
export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(version),
        __BUILD_ID__: JSON.stringify(buildId),
        __BUILD_TIME__: JSON.stringify(buildTime),
        __CACHE_EPOCH__: JSON.stringify(cacheBust.epoch),
    },
    optimizeDeps: {
        exclude: ['maplibre-gl'],
    },
    plugins: [
        react(),
        tailwindcss(),
        babel({presets: [reactCompilerPreset()]}),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
            manifest: {
                id: '/',
                name: 'Pulse — Ahmedabad Metro',
                short_name: 'Pulse',
                description: 'Live train positions, timings and journey planning for the Ahmedabad Metro, computed from the official GMRC timetable.',
                theme_color: '#050507',
                background_color: '#050507',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                lang: 'en-IN',
                dir: 'ltr',
                categories: ['travel', 'navigation', 'transportation'],
                icons: [
                    {src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any'},
                    {src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any'},
                    {src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
                ],
                shortcuts: [
                    {name: 'Plan a journey', short_name: 'Plan', url: '/plan', icons: [{src: '/pwa-192x192.png', sizes: '192x192'}]},
                    {name: 'Live map', short_name: 'Live Map', url: '/map', icons: [{src: '/pwa-192x192.png', sizes: '192x192'}]},
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
                navigateFallback: '/index.html',
                // Every Workbox cache is namespaced by the epoch, so a bust
                // orphans the old ones wholesale instead of trying to
                // invalidate them entry by entry.
                cacheId: `metro-tracker-v${cacheBust.epoch}`,
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/tiles\.openfreemap\.org\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'basemap-tiles',
                            expiration: {maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 30},
                            cacheableResponse: {statuses: [0, 200]},
                        },
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './'),
        },
    },
})
