/**
 * Build-time constants injected by `define` in vite.config.ts. See
 * `src/lib/pwa/cacheBust.ts` for how they are used, and `bun run cache:bust`
 * for how the epoch is moved.
 */
declare const __BUILD_ID__: string;
declare const __BUILD_TIME__: string;
declare const __CACHE_EPOCH__: number;
