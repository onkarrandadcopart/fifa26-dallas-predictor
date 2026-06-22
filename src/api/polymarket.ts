import type { OddsApiResponse } from './types';

/** Helper to POST to our Polymarket edge function */
async function polyProxy(body: Record<string, string>): Promise<OddsApiResponse | null> {
  try {
    const res = await fetch('/api/odds/polymarket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as OddsApiResponse;
    if (!data.teams) data.teams = [];
    return data;
  } catch {
    return null;
  }
}

/** Group winner odds — fifa-world-cup-group-{x}-winner */
export async function fetchPolymarketGroupOdds(group: string): Promise<OddsApiResponse | null> {
  return polyProxy({ group, market: 'group_winner' });
}

/** Tournament winner odds — 2026-fifa-world-cup-winner-595 */
export async function fetchPolymarketTournamentOdds(): Promise<OddsApiResponse | null> {
  return polyProxy({ market: 'tournament' });
}

/** Qualifying odds — 2026-fifa-world-cup-which-countries-qualify */
export async function fetchPolymarketQualifyingOdds(): Promise<OddsApiResponse | null> {
  return polyProxy({ market: 'qualifying' });
}

/** Fetch all 8 relevant groups from Polymarket */
export async function fetchAllPolymarketOdds(): Promise<OddsApiResponse[]> {
  const groups = ['D', 'E', 'G', 'H', 'I', 'J', 'K', 'L'];
  const results = await Promise.allSettled(
    groups.map((g) => fetchPolymarketGroupOdds(g)),
  );
  return results
    .filter((r): r is PromiseFulfilledResult<OddsApiResponse | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((v): v is OddsApiResponse => v !== null && Array.isArray(v.teams) && v.teams.length > 0);
}
