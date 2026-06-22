import type { TeamMarketInputs, TeamProbabilities, GroupId } from './types';
import { THIRD_PLACE_FACTOR } from './types';

/**
 * Calculate the strength factor alpha from win probability.
 *
 * Formula (reverse-engineered from the spreadsheet, verified against all 32 teams):
 *   alpha = 3W / (100 + 2W)
 *
 * Alpha measures how likely a team is to finish 2nd (vs 3rd) when they don't win.
 * - Strong teams (Germany, alpha ~0.87): almost certainly 2nd if not 1st
 * - Weak teams (Curacao, alpha ~0.03): virtually always 3rd if they qualify
 *
 * @param winPct  W — vig-removed P(Win group), as percentage 0-100
 * @returns alpha in range [0, 1]
 */
export function calculateAlpha(winPct: number): number {
  return (3 * winPct) / (100 + 2 * winPct);
}

/**
 * Calculate P(2nd in group) for a team.
 *
 * Formula:
 *   remaining = (Q - W) / 100          (as fraction)
 *   P(2nd) = alpha * remaining / (0.67 + 0.33 * alpha)
 *
 * Where 0.67 = 8/12 (third-place qualifier factor in 48-team format).
 *
 * @param winPct     W — P(Win group) as percentage 0-100
 * @param qualifyPct Q — P(Qualify from group) as percentage 0-100
 * @param alpha      Strength factor (if not provided, calculated from winPct)
 * @returns P(2nd) as a fraction 0-1
 */
export function calculateP2nd(
  winPct: number,
  qualifyPct: number,
  alpha?: number,
): number {
  const a = alpha ?? calculateAlpha(winPct);
  const rawRemaining = (qualifyPct - winPct) / 100;
  // Safety clamp — should not trigger after TBD consolidation fix.
  // If it does, it means W% > Q% which indicates a data source mismatch.
  if (rawRemaining < 0) {
    console.warn(`[probability] W% > Q% for team: W=${winPct.toFixed(1)}, Q=${qualifyPct}, remaining=${rawRemaining.toFixed(4)}`);
  }
  const remaining = Math.max(0, rawRemaining);
  return (a * remaining) / (THIRD_PLACE_FACTOR + (1 - THIRD_PLACE_FACTOR) * a);
}

/**
 * Calculate P(3rd in group) for a team, derived from remaining and P(2nd).
 *
 * remaining = P(2nd) + 0.67 * P(3rd)
 * => P(3rd) = (remaining - P(2nd)) / 0.67
 *
 * @returns P(3rd) as a fraction 0-1
 */
export function calculateP3rd(
  winPct: number,
  qualifyPct: number,
  pSecond: number,
): number {
  const remaining = Math.max(0, (qualifyPct - winPct) / 100);
  return Math.max(0, (remaining - pSecond) / THIRD_PLACE_FACTOR);
}

/**
 * Calculate all probabilities for a single team given market inputs.
 */
export function calculateTeamProbabilities(input: TeamMarketInputs): TeamProbabilities {
  const alpha = calculateAlpha(input.winPct);
  const pWin = input.winPct / 100;
  const pSecond = calculateP2nd(input.winPct, input.qualifyPct, alpha);
  const pThird = calculateP3rd(input.winPct, input.qualifyPct, pSecond);
  const remaining = (input.qualifyPct - input.winPct) / 100;

  return {
    teamId: input.teamId,
    group: input.group,
    pWin: Math.max(0, pWin),
    pSecond: Math.max(0, pSecond),
    pThird: Math.max(0, pThird),
    pQualify: Math.max(0, pWin + pSecond + THIRD_PLACE_FACTOR * pThird),
    alpha,
    remaining: Math.max(0, remaining),
  };
}

/**
 * Calculate probabilities for all teams in a group.
 * Input: array of TeamMarketInputs for one group.
 * Returns: array of TeamProbabilities sorted by pSecond descending.
 */
export function calculateGroupProbabilities(
  inputs: TeamMarketInputs[],
): TeamProbabilities[] {
  return inputs
    .map(calculateTeamProbabilities)
    .sort((a, b) => b.pSecond - a.pSecond);
}

/**
 * Calculate probabilities for multiple groups at once.
 * Returns a map of GroupId → TeamProbabilities[].
 */
export function calculateAllGroupProbabilities(
  inputs: TeamMarketInputs[],
): Record<GroupId, TeamProbabilities[]> {
  const grouped: Partial<Record<GroupId, TeamMarketInputs[]>> = {};
  for (const input of inputs) {
    if (!grouped[input.group]) grouped[input.group] = [];
    grouped[input.group]!.push(input);
  }

  const result = {} as Record<GroupId, TeamProbabilities[]>;
  for (const [group, teamInputs] of Object.entries(grouped)) {
    result[group as GroupId] = calculateGroupProbabilities(teamInputs!);
  }
  return result;
}
