import { create } from 'zustand';
import type { Scenario } from '@/engine/types';

const STORAGE_KEY = 'fifa26-scenarios';

function loadScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Scenario[];
    return data.map((s) => ({ ...s, createdAt: new Date(s.createdAt) }));
  } catch { return []; }
}

function persistScenarios(scenarios: Scenario[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  } catch { /* ignore */ }
}

interface ScenarioState {
  scenarios: Scenario[];
  activeScenarioId: string | null;
  saveScenario: (scenario: Scenario) => void;
  deleteScenario: (id: string) => void;
  activateScenario: (id: string | null) => void;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  scenarios: loadScenarios(),
  activeScenarioId: null,

  saveScenario: (scenario) =>
    set((state) => {
      const updated = [...state.scenarios.filter((s) => s.id !== scenario.id), scenario];
      persistScenarios(updated);
      return { scenarios: updated };
    }),

  deleteScenario: (id) =>
    set((state) => {
      const updated = state.scenarios.filter((s) => s.id !== id);
      persistScenarios(updated);
      return {
        scenarios: updated,
        activeScenarioId: state.activeScenarioId === id ? null : state.activeScenarioId,
      };
    }),

  activateScenario: (id) => set({ activeScenarioId: id }),
}));
