import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { TabNav } from './TabNav';
import { useThemeStore } from '@/store/theme-store';
import { useMovementDetector } from '@/engine/useMovementDetector';

export function AppShell() {
  const theme = useThemeStore((s) => s.theme);
  useMovementDetector();

  return (
    <div className="min-h-screen bg-s0" data-theme={theme}>
      <Header />
      <TabNav />
      <main className="max-w-[1600px] mx-auto px-6 py-5">
        <Outlet />
      </main>
    </div>
  );
}
