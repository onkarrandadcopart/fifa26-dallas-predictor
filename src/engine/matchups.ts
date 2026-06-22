import type { TeamProbabilities, MatchupPrediction } from './types';
import { getFlag } from '../utils/flags';

/**
 * Candidate for a knockout match slot.
 * For "2E vs 2I", side1 candidates are Group E teams' P(2nd),
 * and side2 candidates are Group I teams' P(2nd).
 */
export interface SlotCandidate {
  teamId: string;
  probability: number;  // P(team occupies this slot), 0-1
}

/**
 * Generate all matchup combinations for a knockout match.
 *
 * For a match like "2E vs 2I":
 *   For each team_a in Group E, for each team_b in Group I:
 *     P(matchup) = P(team_a finishes 2nd in E) × P(team_b finishes 2nd in I)
 *
 * @param matchId       e.g. "M78"
 * @param side1         Candidates for the first slot (e.g. 2E teams with P(2nd))
 * @param side2         Candidates for the second slot (e.g. 2I teams with P(2nd))
 * @returns Array of MatchupPrediction sorted by combined probability descending
 */
export function generateMatchups(
  matchId: string,
  side1: SlotCandidate[],
  side2: SlotCandidate[],
): MatchupPrediction[] {
  const matchups: MatchupPrediction[] = [];

  for (const s1 of side1) {
    for (const s2 of side2) {
      matchups.push({
        matchId,
        team1: s1.teamId,
        team2: s2.teamId,
        team1Flag: getFlag(s1.teamId),
        team2Flag: getFlag(s2.teamId),
        p1: s1.probability,
        p2: s2.probability,
        combined: s1.probability * s2.probability,
      });
    }
  }

  return matchups.sort((a, b) => b.combined - a.combined);
}

/**
 * Convert group probabilities to slot candidates for "2nd place" matches.
 * Extracts P(2nd) for each team in the group.
 */
export function toSecondPlaceCandidates(groupProbs: TeamProbabilities[]): SlotCandidate[] {
  return groupProbs.map((tp) => ({
    teamId: tp.teamId,
    probability: tp.pSecond,
  }));
}

/**
 * Convert group probabilities to slot candidates for "1st place" matches.
 * Extracts P(1st) for each team in the group.
 */
export function toFirstPlaceCandidates(groupProbs: TeamProbabilities[]): SlotCandidate[] {
  return groupProbs.map((tp) => ({
    teamId: tp.teamId,
    probability: tp.pWin,
  }));
}

/**
 * Convenience: Generate matchups for a "2X vs 2Y" R32 match given two groups' probabilities.
 */
export function generateR32Matchups(
  matchId: string,
  group1Probs: TeamProbabilities[],
  group2Probs: TeamProbabilities[],
): MatchupPrediction[] {
  return generateMatchups(
    matchId,
    toSecondPlaceCandidates(group1Probs),
    toSecondPlaceCandidates(group2Probs),
  );
}

/**
 * Convenience: Generate matchups for a "1X vs 2Y" R32 match.
 */
export function generateR32MatchupsFirstVsSecond(
  matchId: string,
  firstPlaceGroup: TeamProbabilities[],
  secondPlaceGroup: TeamProbabilities[],
): MatchupPrediction[] {
  return generateMatchups(
    matchId,
    toFirstPlaceCandidates(firstPlaceGroup),
    toSecondPlaceCandidates(secondPlaceGroup),
  );
}

/**
 * Get a summary of top N matchups with cumulative probability.
 */
export function matchupSummary(
  matchups: MatchupPrediction[],
  topN: number = 3,
): { top: MatchupPrediction[]; cumulativePct: number; totalCombinations: number } {
  const top = matchups.slice(0, topN);
  const cumulativePct = top.reduce((sum, m) => sum + m.combined, 0);
  return {
    top,
    cumulativePct,
    totalCombinations: matchups.length,
  };
}
