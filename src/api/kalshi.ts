import type { OddsApiResponse } from './types';

/** Helper to POST to our Kalshi edge function */
async function kalshiProxy(body: Record<string, string>): Promise<OddsApiResponse | null> {
  try {
    const res = await fetch('/api/odds/kalshi', {
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

/** Group winner odds — KXWCGROUPWIN series */
export async function fetchKalshiGroupOdds(group: string): Promise<OddsApiResponse | null> {
  return kalshiProxy({ group, market: 'group_winner' });
}

/** Group qualifying odds — KXWCGROUPQUAL series (live Q%) */
export async function fetchKalshiQualifyingOdds(group: string): Promise<OddsApiResponse | null> {
  return kalshiProxy({ group, market: 'qualifying' });
}

/** Tournament winner odds — KXMENWORLDCUP series */
export async function fetchKalshiTournamentOdds(): Promise<OddsApiResponse | null> {
  return kalshiProxy({ market: 'tournament' });
}

/** Reach round odds — KXWCROUND series */
export async function fetchKalshiReachRoundOdds(): Promise<OddsApiResponse | null> {
  return kalshiProxy({ market: 'reach_round' });
}

/** Fetch all 8 groups: both winner AND qualifying odds */
export async function fetchAllKalshiOdds(): Promise<OddsApiResponse[]> {
  const groups = ['D', 'E', 'G', 'H', 'I', 'J', 'K', 'L'];
  const results = await Promise.allSettled(
    groups.map((g) => fetchKalshiGroupOdds(g)),
  );
  return results
    .filter((r): r is PromiseFulfilledResult<OddsApiResponse | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((v): v is OddsApiResponse => v !== null && Array.isArray(v.teams) && v.teams.length > 0);
}

/** Fetch all 8 groups qualifying odds */
export async function fetchAllKalshiQualifyingOdds(): Promise<OddsApiResponse[]> {
  const groups = ['D', 'E', 'G', 'H', 'I', 'J', 'K', 'L'];
  const results = await Promise.allSettled(
    groups.map((g) => fetchKalshiQualifyingOdds(g)),
  );
  return results
    .filter((r): r is PromiseFulfilledResult<OddsApiResponse | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((v): v is OddsApiResponse => v !== null && Array.isArray(v.teams) && v.teams.length > 0);
}
