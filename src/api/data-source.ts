/**
 * Four-layer data fallback chain:
 *   1. Live Kalshi API (5-min poll) — both W% and Q%
 *   2. Edge Cache (Vercel s-maxage=300, handled transparently)
 *   3. Client localStorage (last-known-good)
 *   4. Seed JSON (bundled, never changes)
 */
import type { TeamMarketInputs, GroupId, TournamentOdds } from '@/engine/types';
import type { OddsApiResponse } from './types';
import {
  fetchAllKalshiOdds,
  fetchAllKalshiQualifyingOdds,
  fetchKalshiReachRoundOdds,
  fetchKalshiTournamentOdds,
} from './kalshi';
import { initialGroupOdds, tournamentOdds as seedTournamentOdds } from '@/data/initial-odds';
import { spreadsheetNameToId, CANDIDATE_TO_TBD } from '@/data/teams';

export type DataSourceLabel = 'kalshi_live' | 'edge_cache' | 'local_cache' | 'seed';

export interface ResolvedOdds {
  odds: TeamMarketInputs[];
  source: DataSourceLabel;
  timestamp: Date;
  teamCount: number;
  /** Number of groups that had live (active) markets this fetch. */
  liveGroups?: number;
}

const CACHE_KEY = 'fifa26-odds-cache';

// ── localStorage cache helpers ──────────────────────────────────

function cacheGet(): ResolvedOdds | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { odds: TeamMarketInputs[]; timestamp: string };
    if (!data.odds?.length) return null;
    return { odds: data.odds, source: 'local_cache', timestamp: new Date(data.timestamp), teamCount: data.odds.length };
  } catch { return null; }
}

function cachePut(odds: TeamMarketInputs[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ odds, timestamp: new Date().toISOString() }));
  } catch { /* ignore */ }
}

// ── Kalshi → TeamMarketInputs mapping ───────────────────────────

function mapKalshiToInputs(
  winResponses: OddsApiResponse[],
  qualResponses: OddsApiResponse[],
): TeamMarketInputs[] {
  const result: TeamMarketInputs[] = [];

  // Build Q% lookup from qualifying data.
  // IMPORTANT: Only trust qualifying data that came from actual trades (yesPrice > 0 AND reasonable).
  // Many qualifying markets have zero trades (last_price=0), and the edge function falls back
  // to bid/ask midpoint which is garbage for these illiquid markets (spreads of 50¢+).
  // For those teams, we skip and let seed Q% be used instead.
  const qualLookup: Record<string, number> = {};
  for (const resp of qualResponses) {
    const group = resp.group;
    if (!group || group === 'ALL') continue;
    for (const team of resp.teams ?? []) {
      const teamId = resolveTeamId(team.teamName, group as GroupId);
      if (!teamId) continue;

      // winPct = the Q% from the edge function.
      // yesPrice = raw cents (last_price for qualifying, or midpoint fallback).
      // Only trust it if the price looks like it came from a real trade (> 5¢)
      // and the value is sensible (Q% should generally be > W% for any qualified team).
      const q = team.winPct;
      const seedTeam = initialGroupOdds.find((s) => s.teamId === teamId);
      const seedQ = seedTeam?.qualifyPct ?? 50;

      // Sanity: if Kalshi Q% is less than half of seed Q%, it's probably junk midpoint data
      if (q > 0 && q >= seedQ * 0.5) {
        qualLookup[teamId] = q;
      }
      // Otherwise: skip — seed Q% will be used as fallback
    }
  }

  // Build full inputs from winner data + qualifying lookup.
  // Consolidate playoff candidates into TBD slots before adding.
  for (const resp of winResponses) {
    const group = resp.group;
    if (!group || group === 'ALL') continue;
    const groupId = group as GroupId;

    // First pass: accumulate TBD candidate prices
    const tbdAccum: Record<string, number> = {}; // tbdId → sum of winPct

    for (const team of resp.teams ?? []) {
      const teamId = resolveTeamId(team.teamName, groupId);
      if (teamId) {
        // Known team — add directly
        const liveQ = qualLookup[teamId];
        const seedTeam = initialGroupOdds.find((s) => s.teamId === teamId);
        const qualifyPct = liveQ != null ? liveQ : (seedTeam?.qualifyPct ?? 50);

        result.push({ teamId, group: groupId, winPct: team.winPct, qualifyPct });
      } else {
        // Unknown team — check if it's a TBD candidate
        const tbdId = CANDIDATE_TO_TBD[team.teamName] ?? CANDIDATE_TO_TBD[team.teamName.toLowerCase()];
        if (tbdId) {
          tbdAccum[tbdId] = (tbdAccum[tbdId] ?? 0) + team.winPct;
        }
      }
    }

    // Second pass: add consolidated TBD slots
    for (const [tbdId, totalWinPct] of Object.entries(tbdAccum)) {
      const seedTeam = initialGroupOdds.find((s) => s.teamId === tbdId);
      if (!seedTeam || seedTeam.group !== groupId) continue;

      const liveQ = qualLookup[tbdId];
      const qualifyPct = liveQ != null ? liveQ : (seedTeam?.qualifyPct ?? 50);

      result.push({ teamId: tbdId, group: groupId, winPct: totalWinPct, qualifyPct });
    }
  }

  return result;
}

/** Resolve a Kalshi team name to our internal teamId */
function resolveTeamId(name: string, group: GroupId): string | null {
  const direct = spreadsheetNameToId[name];
  if (direct) return direct;

  const lower = name.toLowerCase();
  for (const [key, id] of Object.entries(spreadsheetNameToId)) {
    if (key.toLowerCase() === lower) return id;
  }

  for (const [key, id] of Object.entries(spreadsheetNameToId)) {
    if (id === null) continue; // skip TBD/null entries
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      const seedEntry = initialGroupOdds.find((o) => o.teamId === id);
      if (seedEntry && seedEntry.group === group) return id;
    }
  }

  return null;
}

// ── Main fallback chain ─────────────────────────────────────────

export async function resolveOdds(): Promise<ResolvedOdds> {
  // Layer 1: Live Kalshi API — fetch both W% and Q% in parallel.
  //
  // IMPORTANT (staleness fix): once a group finishes, Kalshi FINALIZES its
  // group-winner market and it drops out of the active feed. So mid-tournament
  // we get live data for only SOME groups (e.g. 16 of 32 teams). The old code
  // required >=20 live teams or it fell all the way back to the February seed —
  // which is why the dashboard froze on stale predictions.
  //
  // New behaviour: MERGE whatever live data we get OVER the seed, per-group.
  // Groups with active markets update; finalized/missing groups keep seed.
  // Result is always a full 32-team set, and "live" the moment ANY group is live.
  try {
    const [winData, qualData] = await Promise.all([
      fetchAllKalshiOdds(),
      fetchAllKalshiQualifyingOdds().catch(() => [] as OddsApiResponse[]),
    ]);

    if (winData.length > 0) {
      const live = mapKalshiToInputs(winData, qualData);
      if (live.length > 0) {
        const odds = mergeLiveOverSeed(live);
        cachePut(odds);
        const liveGroups = new Set(live.map((o) => o.group)).size;
        return {
          odds,
          source: 'kalshi_live',
          timestamp: new Date(),
          teamCount: odds.length,
          liveGroups,
        };
      }
    }
  } catch {
    // Kalshi failed — try next layer
  }

  // Layer 3: localStorage cache (last-known-good), also merged over seed so it's
  // always a complete set.
  const cached = cacheGet();
  if (cached && cached.odds.length > 0) {
    return { ...cached, odds: mergeLiveOverSeed(cached.odds) };
  }

  // Layer 4: Seed JSON (ultimate fallback)
  return { odds: initialGroupOdds, source: 'seed', timestamp: new Date('2026-02-01'), teamCount: initialGroupOdds.length };
}

/**
 * Overlay live odds on top of the full seed set.
 * Any team present in `live` replaces its seed row; everything else keeps seed.
 * Guarantees a complete 32-team result even when only some groups are live.
 */
function mergeLiveOverSeed(live: TeamMarketInputs[]): TeamMarketInputs[] {
  const liveById = new Map(live.map((o) => [o.teamId, o]));
  const merged = initialGroupOdds.map((seed) => liveById.get(seed.teamId) ?? seed);
  // Include any live teams not present in seed (defensive — shouldn't happen).
  for (const o of live) {
    if (!merged.some((m) => m.teamId === o.teamId)) merged.push(o);
  }
  return merged;
}

/**
 * Resolve tournament/semifinal odds for M101.
 *
 * Prefers Kalshi's "reach semifinal" market (KXWCROUND-26SEMI) — its raw
 * yes-prices ARE the direct P(reach SF) per team (independent yes/no contracts),
 * so we must NOT vig-normalize them. Falls back to the tournament-winner market
 * (P(final) → ×2 for P(SF)), then to the February seed.
 */
export async function resolveTournamentOdds(): Promise<{
  odds: TournamentOdds[];
  source: DataSourceLabel;
}> {
  // Preferred: reach-semifinal market → direct P(SF).
  try {
    const reach = await fetchKalshiReachRoundOdds();
    const teams = reach?.teams ?? [];
    if (teams.length >= 8) {
      const odds: TournamentOdds[] = teams
        .map((t) => {
          const teamId = resolveTournamentTeamId(t.teamName);
          if (!teamId) return null;
          // yesPrice is cents = direct P(reach SF) %. winPct here is vig-normalized
          // (wrong for independent contracts) so we use yesPrice.
          const pSemifinalPct = t.yesPrice;
          return { teamId, pSemifinalPct, pFinalPct: pSemifinalPct / 2 };
        })
        .filter((x): x is TournamentOdds => x !== null && x.pSemifinalPct > 0)
        .sort((a, b) => b.pSemifinalPct - a.pSemifinalPct);
      if (odds.length >= 8) return { odds, source: 'kalshi_live' };
    }
  } catch { /* fall through */ }

  // Fallback: tournament-winner market → P(final) ×2 = P(SF).
  try {
    const tourn = await fetchKalshiTournamentOdds();
    const teams = tourn?.teams ?? [];
    if (teams.length >= 8) {
      const odds: TournamentOdds[] = teams
        .map((t) => {
          const teamId = resolveTournamentTeamId(t.teamName);
          if (!teamId) return null;
          const pFinalPct = t.yesPrice; // direct % for independent winner contract
          return { teamId, pFinalPct, pSemifinalPct: Math.min(100, pFinalPct * 2) };
        })
        .filter((x): x is TournamentOdds => x !== null && x.pFinalPct > 0)
        .sort((a, b) => b.pSemifinalPct - a.pSemifinalPct);
      if (odds.length >= 8) return { odds, source: 'kalshi_live' };
    }
  } catch { /* fall through */ }

  return { odds: seedTournamentOdds, source: 'seed' };
}

/** Resolve a tournament-market team name to an internal teamId. */
function resolveTournamentTeamId(name: string): string | null {
  const direct = spreadsheetNameToId[name] ?? spreadsheetNameToId[name.trim()];
  if (direct) return direct;
  const lower = name.toLowerCase();
  for (const [key, id] of Object.entries(spreadsheetNameToId)) {
    if (key.toLowerCase() === lower) return id;
  }
  return null;
}

/** Source label for display */
export const SOURCE_LABELS: Record<DataSourceLabel, { label: string; color: string; dot: string }> = {
  kalshi_live: { label: 'Kalshi Live', color: 'text-green', dot: 'bg-green' },
  edge_cache: { label: 'Edge Cache', color: 'text-amber', dot: 'bg-amber' },
  local_cache: { label: 'Local Cache', color: 'text-amber', dot: 'bg-amber' },
  seed: { label: 'Seed Data', color: 'text-t3', dot: 'bg-red' },
};
