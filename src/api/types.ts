import type { OddsSource, GroupId } from '@/engine/types';

/** Normalized team odds from any source */
export interface OddsTeamData {
  teamName: string;
  yesPrice: number;   // cents, 0-100
  winPct: number;      // vig-removed percentage
  qualifyPct?: number; // from separate qualifying market
  volume?: number;
}

/** Response from our /api/odds/* proxy */
export interface OddsApiResponse {
  source: OddsSource;
  group: string;
  timestamp: string;
  teams: OddsTeamData[];
  totalVolume?: number;
  error?: string;
}

/** Comparison of a single team across sources */
export interface OddsComparison {
  teamId: string;
  teamName: string;
  group: GroupId;
  seed: number;        // win% from spreadsheet
  kalshi: number | null;
  polymarket: number | null;
  spread: number | null; // max diff between sources
}

/** Staleness status */
export type FreshnessLevel = 'fresh' | 'stale' | 'offline';

export interface SourceStatus {
  source: OddsSource;
  lastFetched: Date | null;
  freshness: FreshnessLevel;
  error: string | null;
  teamCount: number;
}
