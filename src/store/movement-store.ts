import { create } from 'zustand';
import type { MovementEvent } from '@/engine/movement';
import type { DallasPredictions } from '@/engine/predictions';

const STORAGE_KEY = 'fifa26-movements';
const BASELINE_KEY = 'fifa26-movements-baseline';

function loadEvents(): MovementEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: MovementEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, 500)));
  } catch { /* ignore */ }
}

function loadBaseline(): DallasPredictions | null {
  try {
    const raw = localStorage.getItem(BASELINE_KEY);
    return raw ? JSON.parse(raw) as DallasPredictions : null;
  } catch {
    return null;
  }
}

function saveBaseline(baseline: DallasPredictions | null) {
  try {
    if (baseline) localStorage.setItem(BASELINE_KEY, JSON.stringify(baseline));
    else localStorage.removeItem(BASELINE_KEY);
  } catch { /* ignore */ }
}

interface MovementState {
  events: MovementEvent[];
  baseline: DallasPredictions | null;
  addEvents: (newEvents: MovementEvent[]) => void;
  setBaseline: (b: DallasPredictions) => void;
  markReviewed: (id: string) => void;
  markAllReviewed: () => void;
  clearAll: () => void;
}

export const useMovementStore = create<MovementState>((set) => ({
  events: loadEvents(),
  baseline: loadBaseline(),

  addEvents: (newEvents) =>
    set((state) => {
      const existing = new Set(state.events.map((e) => e.id));
      const unique = newEvents.filter((e) => !existing.has(e.id));
      const merged = [...unique, ...state.events].slice(0, 500);
      saveEvents(merged);
      return { events: merged };
    }),

  setBaseline: (b) => {
    saveBaseline(b);
    set({ baseline: b });
  },

  markReviewed: (id) =>
    set((state) => {
      const events = state.events.map((e) => (e.id === id ? { ...e, reviewed: true } : e));
      saveEvents(events);
      return { events };
    }),

  markAllReviewed: () =>
    set((state) => {
      const events = state.events.map((e) => ({ ...e, reviewed: true }));
      saveEvents(events);
      return { events };
    }),

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BASELINE_KEY);
    set({ events: [], baseline: null });
  },
}));
