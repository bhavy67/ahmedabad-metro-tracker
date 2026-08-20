import { Outlet } from 'react-router';
import { LiveLineStrip } from './LiveLineStrip.tsx';
import { BottomTabBar } from './BottomTabBar.tsx';

export function AppShell() {
  return (
    <div className="fixed inset-0 flex flex-col bg-background text-foreground">
      <LiveLineStrip />
      <main id="app-scroll-container" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
}
