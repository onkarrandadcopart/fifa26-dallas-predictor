import type { TeamProbabilities, MatchupPrediction, KnockoutOdds, TournamentOdds } from './types';
import { getFlag } from '../utils/flags';
import {
  toSecondPlaceCandidates,
  toFirstPlaceCandidates,
  type SlotCandidate,
} from './matchups';

/**
 * Candidate for an R16 match slot, coming from the winner of an R32 match.
 * Each candidate has a probability of winning their R32 match.
 */
export interface R16Candidate {
  teamId: string;
  pReachR16: number;  // P(team wins their R32 match)
}

/**
 * Calculate M93 (R16 at Dallas) matchup predictions.
 *
 * M93 = Winner of M83 vs Winner of M84
 *   M83 = 2K vs 2L (Toronto) — knockout odds: 55% for 2K side, 45% for 2L side
 *   M84 = 1H vs 2J (LA)     — knockout odds: 45% for 1H side, 55% for 2J side
 *
 * For each team that could be in M83:
 *   P(team wins M83) = P(team in M83 slot) × P(team's side wins M83)
 *
 * Then for M93:
 *   P(teamA vs teamB at M93) = P(teamA wins M83) × P(teamB wins M84)
 *
 * @param groupK   Group K probabilities (for 2K slot in M83)
 * @param groupL   Group L probabilities (for 2L slot in M83)
 * @param groupH   Group H probabilities (for 1H slot in M84)
 * @param groupJ   Group J probabilities (for 2J slot in M84)
 * @param m83Odds  Knockout odds for M83
 * @param m84Odds  Knockout odds for M84
 * @returns Array of MatchupPrediction sorted by combined probability descending
 */
export function calculateM93Matchups(
  groupK: TeamProbabilities[],
  groupL: TeamProbabilities[],
  groupH: TeamProbabilities[],
  groupJ: TeamProbabilities[],
  m83Odds: KnockoutOdds,
  m84Odds: KnockoutOdds,
): MatchupPrediction[] {
  // M83 candidates: 2K side (wins with side1 %) + 2L side (wins with side2 %)
  const m83Winners = calculateR32Winners(
    toSecondPlaceCandidates(groupK),
    toSecondPlaceCandidates(groupL),
    m83Odds.side1WinPct / 100,
    m83Odds.side2WinPct / 100,
  );

  // M84 candidates: 1H side (wins with side1 %) + 2J side (wins with side2 %)
  const m84Winners = calculateR32Winners(
    toFirstPlaceCandidates(groupH),
    toSecondPlaceCandidates(groupJ),
    m84Odds.side1WinPct / 100,
    m84Odds.side2WinPct / 100,
  );

  // Generate all matchups between M83 winners and M84 winners
  const matchups: MatchupPrediction[] = [];
  for (const w83 of m83Winners) {
    for (const w84 of m84Winners) {
      matchups.push({
        matchId: 'M93',
        team1: w83.teamId,
        team2: w84.teamId,
        team1Flag: getFlag(w83.teamId),
        team2Flag: getFlag(w84.teamId),
        p1: w83.pReachR16,
        p2: w84.pReachR16,
        combined: w83.pReachR16 * w84.pReachR16,
      });
    }
  }

  return matchups.sort((a, b) => b.combined - a.combined);
}

/**
 * Calculate potential winners of an R32 match.
 *
 * Each side has candidates (teams that could fill that slot) and a win probability
 * for when any team from that side plays.
 *
 * P(team wins R32) = P(team in slot) × P(team's side wins)
 */
function calculateR32Winners(
  side1Candidates: SlotCandidate[],
  side2Candidates: SlotCandidate[],
  side1WinRate: number,
  side2WinRate: number,
): R16Candidate[] {
  const winners: R16Candidate[] = [];

  for (const c of side1Candidates) {
    winners.push({
      teamId: c.teamId,
      pReachR16: c.probability * side1WinRate,
    });
  }

  for (const c of side2Candidates) {
    winners.push({
      teamId: c.teamId,
      pReachR16: c.probability * side2WinRate,
    });
  }

  return winners.sort((a, b) => b.pReachR16 - a.pReachR16);
}

/**
 * Get M83 winner candidates (for display and M93 feed).
 */
export function getM83Winners(
  groupK: TeamProbabilities[],
  groupL: TeamProbabilities[],
  m83Odds: KnockoutOdds,
): R16Candidate[] {
  return calculateR32Winners(
    toSecondPlaceCandidates(groupK),
    toSecondPlaceCandidates(groupL),
    m83Odds.side1WinPct / 100,
    m83Odds.side2WinPct / 100,
  );
}

/**
 * Get M84 winner candidates (for display and M93 feed).
 */
export function getM84Winners(
  groupH: TeamProbabilities[],
  groupJ: TeamProbabilities[],
  m84Odds: KnockoutOdds,
): R16Candidate[] {
  return calculateR32Winners(
    toFirstPlaceCandidates(groupH),
    toSecondPlaceCandidates(groupJ),
    m84Odds.side1WinPct / 100,
    m84Odds.side2WinPct / 100,
  );
}

/**
 * Calculate M101 (Semifinal at Dallas) predictions.
 *
 * Uses tournament winner market odds directly:
 *   P(Reach SF) = 2 × P(Reach Final)
 *   Assumption: P(Win SF | Reach SF) ≈ 50%
 *
 * Returns teams sorted by P(Reach SF) descending.
 */
export function calculateM101Predictions(
  tournamentOdds: TournamentOdds[],
): { teamId: string; pSemifinal: number; pFinal: number }[] {
  return tournamentOdds
    .map((t) => ({
      teamId: t.teamId,
      pSemifinal: t.pSemifinalPct / 100,
      pFinal: t.pFinalPct / 100,
    }))
    .sort((a, b) => b.pSemifinal - a.pSemifinal);
}

/**
 * Generate M101 semifinal matchup predictions.
 * All pairwise combinations of teams that could reach the semifinal.
 * Combined probability = P(teamA reaches SF) × P(teamB reaches SF)
 *
 * Note: This is approximate — it doesn't account for bracket constraints
 * (two teams on the same side can't both reach the same SF).
 */
export function generateM101Matchups(
  tournamentOdds: TournamentOdds[],
  topN: number = 20,
): MatchupPrediction[] {
  const predictions = calculateM101Predictions(tournamentOdds);
  const matchups: MatchupPrediction[] = [];

  for (let i = 0; i < predictions.length; i++) {
    for (let j = i + 1; j < predictions.length; j++) {
      const a = predictions[i]!;
      const b = predictions[j]!;
      matchups.push({
        matchId: 'M101',
        team1: a.teamId,
        team2: b.teamId,
        team1Flag: getFlag(a.teamId),
        team2Flag: getFlag(b.teamId),
        p1: a.pSemifinal,
        p2: b.pSemifinal,
        combined: a.pSemifinal * b.pSemifinal,
      });
    }
  }

  matchups.sort((a, b) => b.combined - a.combined);
  return matchups.slice(0, topN);
}
