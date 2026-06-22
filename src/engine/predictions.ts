/**
 * Pre-computed predictions for all Dallas knockout matches.
 * This is the single source of truth that UI components consume.
 */
import type { TeamProbabilities, MatchupPrediction, GroupId } from './types';
import { calculateAllGroupProbabilities } from './probability';
import { generateR32Matchups } from './matchups';
import { calculateM93Matchups, calculateM101Predictions, generateM101Matchups } from './knockout';
import { applyAllConstraints, type GroupStatus } from './results';
import { initialGroupOdds, knockoutOdds, tournamentOdds } from '../data/initial-odds';
import { getTeam } from '../data/teams';

export interface DallasPredictions {
  /** Group probabilities for all 8 relevant groups */
  groups: Record<GroupId, TeamProbabilities[]>;

  /** M78: 2E vs 2I matchup predictions */
  m78: MatchupPrediction[];

  /** M88: 2D vs 2G matchup predictions */
  m88: MatchupPrediction[];

  /** M93: W83 vs W84 matchup predictions (two-layer) */
  m93: MatchupPrediction[];

  /** M101: Semifinal — team probabilities of reaching SF */
  m101Predictions: { teamId: string; pSemifinal: number; pFinal: number }[];

  /** M101: Semifinal matchup combinations */
  m101Matchups: MatchupPrediction[];
}

/**
 * Compute all predictions from current odds data.
 * Call this whenever odds change — it's pure and fast.
 *
 * @param odds        market W%/Q% inputs (live-merged-over-seed)
 * @param koOdds      knockout side odds (M83/M84)
 * @param tournOdds   tournament/semifinal odds for M101 (live or seed)
 * @param groupStatus optional live results constraints per group; when present,
 *                    the group probabilities are corrected for clinched/eliminated
 *                    teams and the live 2nd-place race before matchups are built.
 */
export function computeAllPredictions(
  odds = initialGroupOdds,
  koOdds = knockoutOdds,
  tournOdds = tournamentOdds,
  groupStatus?: Partial<Record<GroupId, GroupStatus>>,
): DallasPredictions {
  const rawGroups = calculateAllGroupProbabilities(odds);
  const groups = groupStatus ? applyAllConstraints(rawGroups, groupStatus) : rawGroups;

  const groupD = groups['D'] ?? [];
  const groupE = groups['E'] ?? [];
  const groupG = groups['G'] ?? [];
  const groupH = groups['H'] ?? [];
  const groupI = groups['I'] ?? [];
  const groupJ = groups['J'] ?? [];
  const groupK = groups['K'] ?? [];
  const groupL = groups['L'] ?? [];

  const m83Odds = koOdds.find((o) => o.matchId === 'M83')!;
  const m84Odds = koOdds.find((o) => o.matchId === 'M84')!;

  return {
    groups,
    m78: generateR32Matchups('M78', groupE, groupI),
    m88: generateR32Matchups('M88', groupD, groupG),
    m93: calculateM93Matchups(groupK, groupL, groupH, groupJ, m83Odds, m84Odds),
    m101Predictions: calculateM101Predictions(tournOdds),
    m101Matchups: generateM101Matchups(tournOdds, 20),
  };
}

/** Resolve a teamId to a display name */
export function teamName(teamId: string): string {
  return getTeam(teamId)?.name ?? teamId;
}

/** Resolve a teamId to a flag emoji */
export function teamFlag(teamId: string): string {
  return getTeam(teamId)?.flag ?? '\u{1F3F3}\u{FE0F}';
}
