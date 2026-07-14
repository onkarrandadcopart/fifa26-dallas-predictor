import type { DallasMatch } from '@/engine/types';

/**
 * The 8 Dallas matches at AT&T Stadium.
 * All tickets are booked — this data drives the prediction dashboard
 * so VPs know which clients to invite to which matches.
 */
export const dallasMatches: DallasMatch[] = [
  // === GROUP STAGE (teams confirmed) ===
  {
    matchId: 'M11',
    date: '2026-06-14',
    displayDate: 'Jun 14',
    stage: 'group',
    teams: 'Netherlands vs Japan',
    teamsConfirmed: true,
    notes: 'Group F opener — two strong sides',
  },
  {
    matchId: 'M21',
    date: '2026-06-17',
    displayDate: 'Jun 17',
    stage: 'group',
    teams: 'England vs Croatia',
    teamsConfirmed: true,
    notes: 'Premium European matchup — 2018 semifinal rematch',
  },
  {
    matchId: 'M43',
    date: '2026-06-22',
    displayDate: 'Jun 22',
    stage: 'group',
    teams: 'Argentina vs Austria',
    teamsConfirmed: true,
    notes: 'Defending champions',
  },
  {
    matchId: 'M70',
    date: '2026-06-27',
    displayDate: 'Jun 27',
    stage: 'group',
    teams: 'Argentina vs Jordan',
    teamsConfirmed: true,
    notes: 'Argentina\'s final group match',
  },

  // === KNOCKOUT STAGE (teams predicted) ===
  {
    matchId: 'M78',
    date: '2026-06-30',
    displayDate: 'Jun 30',
    stage: 'R32',
    teams: 'Ivory Coast vs Norway',
    teamsConfirmed: true,
    result: '1–2',
    notes: 'Norway won 2–1. Norway advances to R16.',
  },
  {
    matchId: 'M88',
    date: '2026-07-03',
    displayDate: 'Jul 3',
    stage: 'R32',
    teams: 'Australia vs Egypt',
    teamsConfirmed: true,
    result: '1–1 (4–2 pens)',
    notes: 'Egypt advances on penalties (4–2). Egypt moves to R16.',
  },
  {
    matchId: 'M93',
    date: '2026-07-06',
    displayDate: 'Jul 6',
    stage: 'R16',
    teams: 'Portugal vs Spain',
    teamsConfirmed: true,
    result: '0–1',
    notes: 'Spain won 1–0 (Merino stoppage-time). Spain advances to QF.',
  },
  {
    matchId: 'M101',
    date: '2026-07-14',
    displayDate: 'Jul 14',
    stage: 'SF',
    teams: 'France vs Spain',
    teamsConfirmed: true,
    notes: 'SEMIFINAL — France beat Morocco 2-0 in QF, Spain beat Belgium 2-1. Live in Dallas — Bastille Day.',
  },
];

/** Quick lookup by match ID */
export function getDallasMatch(matchId: string): DallasMatch | undefined {
  return dallasMatches.find((m) => m.matchId === matchId);
}

/** Stage display labels */
export const stageLabels: Record<string, string> = {
  group: 'Group Stage',
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarterfinal',
  SF: 'Semifinal',
  F: 'Final',
};
