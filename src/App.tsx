import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/src/features/shell/AppShell.tsx';
import { HomePage } from '@/src/features/shell/pages/HomePage.tsx';
import { LinePage } from '@/src/features/timeline/LinePage.tsx';
import { StationPage } from '@/src/features/station/StationPage.tsx';
import { PlanPage } from '@/src/features/journey/PlanPage.tsx';
import { PlacesPage } from '@/src/features/places/PlacesPage.tsx';
import { NotFoundPage } from '@/src/features/shell/pages/NotFoundPage.tsx';
import { PrivacyPage } from '@/src/features/shell/pages/PrivacyPage.tsx';

// maplibre-gl alone is ~800KB — split it into its own chunk so it only
// downloads when someone actually opens the live map, not on first load.
const MapPage = lazy(() => import('@/src/features/map/MapPage.tsx').then(m => ({ default: m.MapPage })));

function MapPageFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
      Loading map…
    </div>
  );
}

export default function App() {
  return (
    <TooltipProvider delay={200}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route
              path="map"
              element={
                <Suspense fallback={<MapPageFallback />}>
                  <MapPage />
                </Suspense>
              }
            />
            <Route path="line/:lineId" element={<LinePage />} />
            <Route path="station/:stationId" element={<StationPage />} />
            <Route path="plan" element={<PlanPage />} />
            <Route path="places" element={<PlacesPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}
