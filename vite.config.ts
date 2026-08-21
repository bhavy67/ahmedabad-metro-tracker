import {defineConfig} from 'vite'
import react, {reactCompilerPreset} from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from "@tailwindcss/vite";
import path from 'node:path'
import {VitePWA} from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
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
                name: 'Ahmedabad Metro',
                short_name: 'AhmMetro',
                description: 'Live train positions, timings and journey planning for the Ahmedabad Metro, computed from the official GMRC timetable.',
                theme_color: '#111726',
                background_color: '#111726',
                display: 'standalone',
                orientation: 'portrait',
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
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/[abc]\.basemaps\.cartocdn\.com\/.*/i,
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
