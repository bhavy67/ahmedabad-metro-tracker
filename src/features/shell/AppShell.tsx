import { Outlet, useLocation } from 'react-router';
import { LiveLineStrip } from './LiveLineStrip.tsx';
import { BottomTabBar } from './BottomTabBar.tsx';
import { Sidebar } from './Sidebar.tsx';

export function AppShell() {
  const { pathname } = useLocation();
  return (
    <div className="fixed inset-0 flex bg-background text-foreground">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile-only header */}
        <div className="lg:hidden">
          <LiveLineStrip />
        </div>

        <main
          id="app-scroll-container"
          key={pathname}
          className="page-enter min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          <Outlet />
        </main>

        {/* Mobile-only bottom tabs */}
        <div className="lg:hidden">
          <BottomTabBar />
        </div>
      </div>
    </div>
  );
}
