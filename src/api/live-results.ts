/**
 * Live group-stage results client.
 *
 * Fetches finished group-stage matches from /api/scores/live across the
 * group-stage window and resolves them into per-group GroupStatus objects
 * (standings + clinch/elimination locks) that the results engine consumes.
 */
import type { GroupId } from '@/engine/types';
import {
  buildGroupStatus,
  type GroupStatus,
  type ResultMatch,
} from '@/engine/results';
import { dallasKnockoutGroups } from '@/data/groups';
import { getGroupTeams } from '@/data/teams';

/** Group-stage date window for WC26 (matchday 1 → final group games). */
const GROUP_STAGE_FROM = '2026-06-11';
const GROUP_STAGE_TO = '2026-06-27';

interface LiveMatchDTO {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed';
  startTime: string;
}

interface LiveScoresResponse {
  source: string;
  date: string;
  matches: LiveMatchDTO[];
  timestamp: string;
}

/**
 * Map ESPN/football-data display names to our internal teamIds.
 * Only the 8 Dallas-relevant groups (D,E,G,H,I,J,K,L) matter here.
 * Kept local (not the global spreadsheetNameToId) because some ids are
 * group-suffixed (united_states_d, iraq_i, congo_dr_k) and we must not
 * collide with the Group-C United States.
 */
const NAME_TO_ID: Record<string, string> = {
  // Group D
  'United States': 'united_states_d', 'USA': 'united_states_d',
  'Paraguay': 'paraguay', 'Australia': 'australia',
  'Türkiye': 'turkiye_d', 'Turkiye': 'turkiye_d', 'Turkey': 'turkiye_d',
  // Group E
  'Germany': 'germany', 'Ecuador': 'ecuador',
  'Ivory Coast': 'ivory_coast', "Côte d'Ivoire": 'ivory_coast', "Cote d'Ivoire": 'ivory_coast',
  'Curaçao': 'curacao', 'Curacao': 'curacao',
  // Group G
  'Belgium': 'belgium', 'Egypt': 'egypt',
  'Iran': 'iran', 'IR Iran': 'iran', 'New Zealand': 'new_zealand',
  // Group H
  'Spain': 'spain', 'Uruguay': 'uruguay',
  'Saudi Arabia': 'saudi_arabia', 'Cape Verde': 'cape_verde', 'Cabo Verde': 'cape_verde',
  // Group I
  'France': 'france', 'Norway': 'norway', 'Senegal': 'senegal', 'Iraq': 'iraq_i',
  // Group J
  'Argentina': 'argentina', 'Austria': 'austria', 'Jordan': 'jordan', 'Algeria': 'algeria',
  // Group K
  'Portugal': 'portugal', 'Colombia': 'colombia', 'Uzbekistan': 'uzbekistan',
  'Congo DR': 'congo_dr_k', 'DR Congo': 'congo_dr_k', 'DRC': 'congo_dr_k',
  // Group L
  'England': 'england', 'Croatia': 'croatia', 'Ghana': 'ghana', 'Panama': 'panama',
};

/** teamId → group, for the relevant groups only. */
const ID_TO_GROUP: Record<string, GroupId> = (() => {
  const map: Record<string, GroupId> = {};
  for (const g of dallasKnockoutGroups) {
    for (const team of getGroupTeams(g)) map[team.id] = g;
  }
  return map;
})();

function resolveId(name: string): string | null {
  return NAME_TO_ID[name] ?? NAME_TO_ID[name.trim()] ?? null;
}

async function fetchGroupStageMatches(): Promise<LiveMatchDTO[]> {
  const res = await fetch('/api/scores/live', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dateFrom: GROUP_STAGE_FROM, dateTo: GROUP_STAGE_TO }),
  });
  if (!res.ok) throw new Error(`scores/live ${res.status}`);
  const data = (await res.json()) as LiveScoresResponse;
  return data.matches ?? [];
}

/**
 * Fetch live results and build GroupStatus for every relevant group.
 * Groups with no finished matches still get a status (matchesPlayed=0),
 * which the engine treats as "untouched".
 *
 * De-duplicates by team pair (ESPN can return the same fixture on adjacent
 * date queries near midnight UTC).
 */
export async function fetchGroupStatuses(): Promise<Partial<Record<GroupId, GroupStatus>>> {
  const matches = await fetchGroupStageMatches();

  const byGroup: Partial<Record<GroupId, ResultMatch[]>> = {};
  const seen = new Set<string>();

  for (const m of matches) {
    const homeId = resolveId(m.homeTeam);
    const awayId = resolveId(m.awayTeam);
    if (!homeId || !awayId) continue;

    const group = ID_TO_GROUP[homeId];
    const awayGroup = ID_TO_GROUP[awayId];
    // Both teams must be in the same relevant group (skip knockout/other groups).
    if (!group || group !== awayGroup) continue;

    const finished = m.status === 'finished' &&
      m.homeScore != null && m.awayScore != null;

    // Dedup key — unordered pair within group.
    const key = `${group}:${[homeId, awayId].sort().join('-')}`;
    if (seen.has(key)) continue;
    seen.add(key);

    (byGroup[group] ??= []).push({
      group,
      homeId,
      awayId,
      homeScore: m.homeScore ?? 0,
      awayScore: m.awayScore ?? 0,
      finished,
    });
  }

  const out: Partial<Record<GroupId, GroupStatus>> = {};
  for (const g of dallasKnockoutGroups) {
    const teamIds = getGroupTeams(g).map((t) => t.id);
    out[g] = buildGroupStatus(g, teamIds, byGroup[g] ?? []);
  }
  return out;
}
