import { Outlet, useLocation } from 'react-router';
import { LiveLineStrip } from './LiveLineStrip.tsx';
import { BottomTabBar } from './BottomTabBar.tsx';

export function AppShell() {
  const { pathname } = useLocation();
  return (
    <div className="fixed inset-0 flex flex-col bg-background text-foreground sm:bg-muted/60 dark:sm:bg-black">
      {/* Content frame: full-bleed on phones, a centered "device" on tablet/desktop. */}
      <div className="mx-auto flex h-full w-full max-w-md flex-col bg-background sm:my-6 sm:h-[calc(100dvh-3rem)] sm:overflow-hidden sm:rounded-[2rem] sm:border sm:border-border sm:shadow-2xl">
        <LiveLineStrip />
        <main
          id="app-scroll-container"
          key={pathname}
          className="page-enter min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          <Outlet />
        </main>
        <BottomTabBar />
      </div>
    </div>
  );
}
