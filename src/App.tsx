import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { MarketOddsView } from '@/components/odds/MarketOddsView';
import { ScenarioView } from '@/components/scenarios/ScenarioView';
import { ExecutiveView } from '@/components/executive/ExecutiveView';
import { ClientTrackerView } from '@/components/clients/ClientTrackerView';
import { MovementLogView } from '@/components/movement/MovementLogView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardView />} />
            <Route path="scenarios" element={<ScenarioView />} />
            <Route path="odds" element={<MarketOddsView />} />
            <Route path="movement" element={<MovementLogView />} />
            <Route path="executive" element={<ExecutiveView />} />
            <Route path="clients" element={<ClientTrackerView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
