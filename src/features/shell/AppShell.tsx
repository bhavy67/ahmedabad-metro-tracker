import { useCallback, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { OfflineBanner } from '@/src/features/pwa/OfflineBanner.tsx';
import { UpdateBanner } from '@/src/features/pwa/UpdateBanner.tsx';
import { cn } from '@/lib/utils';
import { TopIsland } from './TopIsland.tsx';
import { BottomTabBar } from './BottomTabBar.tsx';
import { MenuOverlay } from './MenuOverlay.tsx';
import { LinesDrawer } from './LinesDrawer.tsx';

export function AppShell() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [linesOpen, setLinesOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openLines = useCallback(() => setLinesOpen(true), []);
  // The live map is edge-to-edge under the floating nav; every other screen scrolls.
  const fullBleed = pathname.startsWith('/map');

  return (
    <div className="fixed inset-0 overflow-hidden bg-background text-foreground">
      <div className="pulse-mesh" aria-hidden>
        <i />
        <i />
        <i />
      </div>
      <div className="pulse-grain" aria-hidden />

      <TopIsland menuOpen={menuOpen} onToggleMenu={() => setMenuOpen(o => !o)} onOpenLines={openLines} />
      <MenuOverlay open={menuOpen} onClose={closeMenu} onOpenLines={openLines} />

      {/* Status toasts float just under the island. */}
      <div className="fixed top-[calc(max(14px,env(safe-area-inset-top))+64px)] left-1/2 z-30 flex w-[min(440px,calc(100%-28px))] -translate-x-1/2 flex-col gap-2">
        <OfflineBanner />
        <UpdateBanner />
      </div>

      <main
        id="app-scroll-container"
        key={pathname}
        className={cn(
          'page-enter relative z-10 h-full overflow-x-hidden overscroll-contain',
          fullBleed
            ? 'overflow-hidden'
            : 'overflow-y-auto pt-[calc(max(14px,env(safe-area-inset-top))+76px)] pb-[calc(env(safe-area-inset-bottom)+112px)] md:pt-[104px] md:pb-16'
        )}
      >
        <Outlet />
      </main>

      <BottomTabBar onOpenLines={openLines} />
      <LinesDrawer open={linesOpen} onOpenChange={setLinesOpen} />
    </div>
  );
}
