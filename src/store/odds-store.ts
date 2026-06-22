import { create } from 'zustand';
import type { TeamMarketInputs, GroupId, OddsSource } from '@/engine/types';
import { initialGroupOdds } from '@/data/initial-odds';

interface OddsState {
  /** Current odds per team, keyed by group */
  groupOdds: Record<GroupId, TeamMarketInputs[]>;

  /** Which source is active */
  activeSource: OddsSource;

  /** Timestamp of last odds update */
  lastUpdated: Date | null;

  /** Whether live odds are being fetched */
  isLive: boolean;

  /** Update odds for a specific group */
  setGroupOdds: (group: GroupId, odds: TeamMarketInputs[]) => void;

  /** Bulk-set all odds (e.g., from initial load) */
  setAllOdds: (odds: TeamMarketInputs[]) => void;

  /** Switch data source */
  setSource: (source: OddsSource) => void;
}

function groupOddsFromArray(odds: TeamMarketInputs[]): Record<GroupId, TeamMarketInputs[]> {
  const result = {} as Record<GroupId, TeamMarketInputs[]>;
  for (const o of odds) {
    if (!result[o.group]) result[o.group] = [];
    result[o.group].push(o);
  }
  return result;
}

export const useOddsStore = create<OddsState>((set) => ({
  groupOdds: groupOddsFromArray(initialGroupOdds),
  activeSource: 'manual',
  lastUpdated: new Date(),
  isLive: false,

  setGroupOdds: (group, odds) =>
    set((state) => ({
      groupOdds: { ...state.groupOdds, [group]: odds },
      lastUpdated: new Date(),
    })),

  setAllOdds: (odds) =>
    set({
      groupOdds: groupOddsFromArray(odds),
      lastUpdated: new Date(),
    }),

  setSource: (source) => set({ activeSource: source }),
}));
