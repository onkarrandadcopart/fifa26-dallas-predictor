/**
 * Movement Detection Engine
 *
 * Compares two sets of predictions and detects meaningful changes
 * in Dallas match outcomes. Generates movement events with severity.
 */
import type { MatchupPrediction } from './types';
import type { DallasPredictions } from './predictions';
import { teamName } from './predictions';
import { pct } from '../utils/format';

export type MovementSeverity = 'critical' | 'notable' | 'minor';
export type MovementType = 'prediction_shift' | 'new_top3_entry' | 'top3_exit';

export interface MovementEvent {
  id: string;
  timestamp: string;
  matchId: string;
  type: MovementType;
  severity: MovementSeverity;
  description: string;
  before: { team1: string; team2: string; combined: number; rank: number };
  after: { team1: string; team2: string; combined: number; rank: number };
  delta: number;
  causedBy: { team: string; group: string; oldValue: number; newValue: number }[];
  reviewed: boolean;
}

const DALLAS_KNOCKOUT_MATCHES = ['M78', 'M88', 'M93', 'M101'];

/**
 * Compare two sets of predictions and generate movement events.
 */
export function detectMovements(
  before: DallasPredictions,
  after: DallasPredictions,
  timestamp: string = new Date().toISOString(),
): MovementEvent[] {
  const events: MovementEvent[] = [];

  for (const matchId of DALLAS_KNOCKOUT_MATCHES) {
    const bMatchups = getMatchups(before, matchId);
    const aMatchups = getMatchups(after, matchId);

    if (!bMatchups.length || !aMatchups.length) continue;

    const bTop3 = bMatchups.slice(0, 3);
    const aTop3 = aMatchups.slice(0, 3);

    // Check top-3 prediction shifts
    for (let i = 0; i < 3; i++) {
      const bm = bTop3[i];
      const am = aTop3[i];
      if (!bm || !am) continue;

      // Same matchup in same position — check for probability shift
      if (bm.team1 === am.team1 && bm.team2 === am.team2) {
        const delta = am.combined - bm.combined;
        const absDelta = Math.abs(delta) * 100; // percentage points

        if (absDelta > 0.1) {
          const severity = classifySeverity(absDelta);
          events.push({
            id: `${timestamp}-${matchId}-shift-${i}`,
            timestamp,
            matchId,
            type: 'prediction_shift',
            severity,
            description: `${matchId}: ${teamName(am.team1)} vs ${teamName(am.team2)} ${delta > 0 ? 'rose' : 'dropped'} ${pct(Math.abs(delta))}`,
            before: { team1: bm.team1, team2: bm.team2, combined: bm.combined, rank: i + 1 },
            after: { team1: am.team1, team2: am.team2, combined: am.combined, rank: i + 1 },
            delta: delta * 100,
            causedBy: [],
            reviewed: false,
          });
        }
      }
    }

    // Check for new entries in top-3
    for (const am of aTop3) {
      const key = `${am.team1}-${am.team2}`;
      const wasInTop3 = bTop3.some((bm) => `${bm.team1}-${bm.team2}` === key);
      if (!wasInTop3) {
        const rank = aTop3.indexOf(am) + 1;
        events.push({
          id: `${timestamp}-${matchId}-entry-${key}`,
          timestamp,
          matchId,
          type: 'new_top3_entry',
          severity: 'critical',
          description: `${matchId}: ${teamName(am.team1)} vs ${teamName(am.team2)} entered top 3 at #${rank}`,
          before: { team1: '', team2: '', combined: 0, rank: 0 },
          after: { team1: am.team1, team2: am.team2, combined: am.combined, rank },
          delta: am.combined * 100,
          causedBy: [],
          reviewed: false,
        });
      }
    }

    // Check for exits from top-3
    for (const bm of bTop3) {
      const key = `${bm.team1}-${bm.team2}`;
      const stillInTop3 = aTop3.some((am) => `${am.team1}-${am.team2}` === key);
      if (!stillInTop3) {
        const rank = bTop3.indexOf(bm) + 1;
        events.push({
          id: `${timestamp}-${matchId}-exit-${key}`,
          timestamp,
          matchId,
          type: 'top3_exit',
          severity: 'critical',
          description: `${matchId}: ${teamName(bm.team1)} vs ${teamName(bm.team2)} dropped out of top 3`,
          before: { team1: bm.team1, team2: bm.team2, combined: bm.combined, rank },
          after: { team1: '', team2: '', combined: 0, rank: 0 },
          delta: -bm.combined * 100,
          causedBy: [],
          reviewed: false,
        });
      }
    }
  }

  return events;
}

function classifySeverity(absDeltaPct: number): MovementSeverity {
  if (absDeltaPct > 2) return 'critical';
  if (absDeltaPct > 1) return 'notable';
  return 'minor';
}

function getMatchups(p: DallasPredictions, matchId: string): MatchupPrediction[] {
  switch (matchId) {
    case 'M78': return p.m78;
    case 'M88': return p.m88;
    case 'M93': return p.m93;
    case 'M101': return p.m101Matchups;
    default: return [];
  }
}

/** Count unreviewed events by severity */
export function countUnreviewed(events: MovementEvent[]): { critical: number; notable: number; total: number } {
  const unreviewed = events.filter((e) => !e.reviewed);
  return {
    critical: unreviewed.filter((e) => e.severity === 'critical').length,
    notable: unreviewed.filter((e) => e.severity === 'notable').length,
    total: unreviewed.length,
  };
}
