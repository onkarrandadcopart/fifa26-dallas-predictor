import type { Match } from '@/engine/types';

/**
 * Dallas matches and feeder matches only.
 * Full 104-match schedule can be expanded later.
 */
export const dallasSchedule: Match[] = [
  // === GROUP STAGE — DALLAS ===
  {
    id: 'M11',
    matchNumber: 11,
    stage: 'group',
    date: '2026-06-14',
    displayDate: 'Jun 14',
    venue: 'AT&T Stadium',
    isDallas: true,
    team1Slot: 'netherlands',
    team2Slot: 'japan',
    team1Confirmed: 'netherlands',
    team2Confirmed: 'japan',
    description: 'Netherlands vs Japan',
  },
  {
    id: 'M21',
    matchNumber: 21,
    stage: 'group',
    date: '2026-06-17',
    displayDate: 'Jun 17',
    venue: 'AT&T Stadium',
    isDallas: true,
    team1Slot: 'england',
    team2Slot: 'croatia',
    team1Confirmed: 'england',
    team2Confirmed: 'croatia',
    description: 'England vs Croatia',
  },
  {
    id: 'M43',
    matchNumber: 43,
    stage: 'group',
    date: '2026-06-22',
    displayDate: 'Jun 22',
    venue: 'AT&T Stadium',
    isDallas: true,
    team1Slot: 'argentina',
    team2Slot: 'austria',
    team1Confirmed: 'argentina',
    team2Confirmed: 'austria',
    description: 'Argentina vs Austria',
  },
  {
    id: 'M70',
    matchNumber: 70,
    stage: 'group',
    date: '2026-06-27',
    displayDate: 'Jun 27',
    venue: 'AT&T Stadium',
    isDallas: true,
    team1Slot: 'argentina',
    team2Slot: 'jordan',
    team1Confirmed: 'argentina',
    team2Confirmed: 'jordan',
    description: 'Argentina vs Jordan',
  },

  // === KNOCKOUT — DALLAS ===
  {
    id: 'M78',
    matchNumber: 78,
    stage: 'R32',
    date: '2026-06-30',
    displayDate: 'Jun 30',
    venue: 'AT&T Stadium',
    isDallas: true,
    team1Slot: '2E',
    team2Slot: '2I',
    description: '2nd Group E vs 2nd Group I',
  },
  {
    id: 'M88',
    matchNumber: 88,
    stage: 'R32',
    date: '2026-07-03',
    displayDate: 'Jul 3',
    venue: 'AT&T Stadium',
    isDallas: true,
    team1Slot: '2D',
    team2Slot: '2G',
    description: '2nd Group D vs 2nd Group G',
  },
  {
    id: 'M93',
    matchNumber: 93,
    stage: 'R16',
    date: '2026-07-06',
    displayDate: 'Jul 6',
    venue: 'AT&T Stadium',
    isDallas: true,
    team1Slot: 'W83',
    team2Slot: 'W84',
    description: 'Winner M83 vs Winner M84',
  },
  {
    id: 'M101',
    matchNumber: 101,
    stage: 'SF',
    date: '2026-07-14',
    displayDate: 'Jul 14',
    venue: 'AT&T Stadium',
    isDallas: true,
    team1Slot: 'W97',
    team2Slot: 'W98',
    description: 'Semifinal',
  },

  // === FEEDER MATCHES (not in Dallas but feed Dallas knockout) ===
  {
    id: 'M83',
    matchNumber: 83,
    stage: 'R32',
    date: '2026-07-04',
    displayDate: 'Jul 4',
    venue: 'BMO Field, Toronto',
    isDallas: false,
    team1Slot: '2K',
    team2Slot: '2L',
    description: '2nd Group K vs 2nd Group L — feeds M93',
  },
  {
    id: 'M84',
    matchNumber: 84,
    stage: 'R32',
    date: '2026-07-04',
    displayDate: 'Jul 4',
    venue: 'SoFi Stadium, LA',
    isDallas: false,
    team1Slot: '1H',
    team2Slot: '2J',
    description: '1st Group H vs 2nd Group J — feeds M93',
  },
];

/** Get a match by its ID */
export function getMatch(id: string): Match | undefined {
  return dallasSchedule.find((m) => m.id === id);
}

/** Get only Dallas matches */
export function getDallasOnlyMatches(): Match[] {
  return dallasSchedule.filter((m) => m.isDallas);
}
