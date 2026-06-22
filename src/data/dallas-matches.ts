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
    teams: '2E vs 2I',
    teamsConfirmed: false,
    notes: 'Most likely: Ecuador vs Norway (11.0%)',
  },
  {
    matchId: 'M88',
    date: '2026-07-03',
    displayDate: 'Jul 3',
    stage: 'R32',
    teams: '2D vs 2G',
    teamsConfirmed: false,
    notes: 'USA/Belgium possible',
  },
  {
    matchId: 'M93',
    date: '2026-07-06',
    displayDate: 'Jul 6',
    stage: 'R16',
    teams: 'W83 vs W84',
    teamsConfirmed: false,
    notes: 'Feeds from M83 (2K vs 2L) and M84 (1H vs 2J)',
    feedsMatch: 'M83,M84',
  },
  {
    matchId: 'M101',
    date: '2026-07-14',
    displayDate: 'Jul 14',
    stage: 'SF',
    teams: 'W97 vs W98',
    teamsConfirmed: false,
    notes: 'SEMIFINAL — Premium entertainment',
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
