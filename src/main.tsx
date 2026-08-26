import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { bootCacheGuard } from '@/src/lib/pwa/cacheBust.ts'

// Runs before the first paint: if this client is on a stale cache epoch (or
// arrived with `?cachebust=1`) it wipes its caches and reloads, and there is no
// point rendering a UI that is about to be thrown away.
if (!bootCacheGuard()) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
