import { create } from 'zustand';
import type { GroupId } from '@/engine/types';

interface LockedPosition {
  teamId: string;
  position: 1 | 2 | 3 | 4;
}

interface ResultsState {
  /** Locked group positions (confirmed results) */
  lockedPositions: Record<GroupId, LockedPosition[]>;

  /** Confirmed match winners */
  matchWinners: Record<string, string>;

  /** Lock a team into a group position */
  lockPosition: (group: GroupId, teamId: string, position: 1 | 2 | 3 | 4) => void;

  /** Unlock a team from a group position */
  unlockPosition: (group: GroupId, teamId: string) => void;

  /** Set match winner */
  setMatchWinner: (matchId: string, teamId: string) => void;

  /** Clear all locks */
  clearAll: () => void;
}

export const useResultsStore = create<ResultsState>((set) => ({
  lockedPositions: {} as Record<GroupId, LockedPosition[]>,
  matchWinners: {},

  lockPosition: (group, teamId, position) =>
    set((state) => {
      const current = state.lockedPositions[group] ?? [];
      const filtered = current.filter((p) => p.teamId !== teamId && p.position !== position);
      return {
        lockedPositions: {
          ...state.lockedPositions,
          [group]: [...filtered, { teamId, position }],
        },
      };
    }),

  unlockPosition: (group, teamId) =>
    set((state) => ({
      lockedPositions: {
        ...state.lockedPositions,
        [group]: (state.lockedPositions[group] ?? []).filter((p) => p.teamId !== teamId),
      },
    })),

  setMatchWinner: (matchId, teamId) =>
    set((state) => ({
      matchWinners: { ...state.matchWinners, [matchId]: teamId },
    })),

  clearAll: () =>
    set({
      lockedPositions: {} as Record<GroupId, LockedPosition[]>,
      matchWinners: {},
    }),
}));
