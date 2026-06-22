import type { GroupId, TeamMarketInputs } from './types';

/**
 * Remove vig (overround) from raw yes prices.
 *
 * Raw Kalshi/Polymarket prices are in cents (0-100) and typically sum to >100
 * due to the vig. Normalize by dividing each by the group total.
 *
 * @param rawPrices  Map of teamId → yesPrice (cents, 0-100)
 * @returns Map of teamId → vig-removed win percentage (0-100, sums to 100)
 */
export function removeVig(rawPrices: Record<string, number>): Record<string, number> {
  const total = Object.values(rawPrices).reduce((sum, p) => sum + p, 0);
  if (total === 0) return rawPrices;

  const result: Record<string, number> = {};
  for (const [teamId, price] of Object.entries(rawPrices)) {
    result[teamId] = (price / total) * 100;
  }
  return result;
}

/**
 * Convert raw yes prices + qualification percentages into TeamMarketInputs.
 *
 * @param group       The group ID
 * @param rawPrices   Map of teamId → yesPrice (cents)
 * @param qualifyPcts Map of teamId → qualify percentage (0-100)
 * @returns Array of TeamMarketInputs ready for the probability engine
 */
export function buildMarketInputs(
  group: GroupId,
  rawPrices: Record<string, number>,
  qualifyPcts: Record<string, number>,
): TeamMarketInputs[] {
  const vigFree = removeVig(rawPrices);
  return Object.keys(rawPrices).map((teamId) => ({
    teamId,
    group,
    winPct: vigFree[teamId] ?? 0,
    qualifyPct: qualifyPcts[teamId] ?? 0,
  }));
}

/**
 * Validate that probabilities in a group are internally consistent.
 * P(2nd) values for all teams in a group should sum reasonably close to 1.0
 * (won't be exact because the model is an approximation).
 */
export function validateGroupConsistency(
  p2nds: { teamId: string; pSecond: number }[],
): { sum: number; isReasonable: boolean } {
  const sum = p2nds.reduce((total, t) => total + t.pSecond, 0);
  return {
    sum,
    isReasonable: sum > 0.5 && sum < 1.5,
  };
}
