import { useQuery } from '@tanstack/react-query';
import { initialGroupOdds, tournamentOdds } from '@/data/initial-odds';
import { fetchAllKalshiOdds, fetchKalshiTournamentOdds, fetchKalshiReachRoundOdds } from './kalshi';
import { fetchAllPolymarketOdds, fetchPolymarketTournamentOdds, fetchPolymarketQualifyingOdds } from './polymarket';
import type { TeamMarketInputs, TournamentOdds, GroupId } from '@/engine/types';
import type { OddsApiResponse, SourceStatus, FreshnessLevel } from './types';

/** Polling interval — reads from env or defaults to 5 minutes */
const POLL_MS = Number(import.meta.env.VITE_ODDS_POLL_INTERVAL) || 5 * 60 * 1000;

/** Staleness thresholds */
const STALE_AFTER_MS = 15 * 60 * 1000;   // 15 min = stale
const OFFLINE_AFTER_MS = 60 * 60 * 1000; // 60 min = offline

// ── Seed data (always available) ────────────────────────────────

export function useGroupOdds(group: GroupId) {
  return useQuery<TeamMarketInputs[]>({
    queryKey: ['groupOdds', group],
    queryFn: async () => initialGroupOdds.filter((o) => o.group === group),
    staleTime: Infinity,
  });
}

export function useAllGroupOdds() {
  return useQuery<TeamMarketInputs[]>({
    queryKey: ['allGroupOdds'],
    queryFn: async () => initialGroupOdds,
    staleTime: Infinity,
  });
}

export function useTournamentOdds() {
  return useQuery<TournamentOdds[]>({
    queryKey: ['tournamentOdds'],
    queryFn: async () => tournamentOdds,
    staleTime: Infinity,
  });
}

// ── Live Kalshi data ────────────────────────────────────────────

export function useKalshiOdds() {
  return useQuery<OddsApiResponse[]>({
    queryKey: ['kalshiOdds'],
    queryFn: fetchAllKalshiOdds,
    staleTime: POLL_MS,
    refetchInterval: POLL_MS,
    retry: 2,
    retryDelay: 5000,
  });
}

/** Kalshi tournament winner odds (KXMENWORLDCUP) */
export function useKalshiTournamentOdds() {
  return useQuery<OddsApiResponse | null>({
    queryKey: ['kalshiTournamentOdds'],
    queryFn: fetchKalshiTournamentOdds,
    staleTime: POLL_MS,
    refetchInterval: POLL_MS,
    retry: 2,
    retryDelay: 5000,
  });
}

/** Kalshi reach-round odds (KXWCROUND — quarterfinal/semifinal) */
export function useKalshiReachRound() {
  return useQuery<OddsApiResponse | null>({
    queryKey: ['kalshiReachRound'],
    queryFn: fetchKalshiReachRoundOdds,
    staleTime: POLL_MS,
    refetchInterval: POLL_MS,
    retry: 2,
    retryDelay: 5000,
  });
}

// ── Live Polymarket data ────────────────────────────────────────

export function usePolymarketOdds() {
  return useQuery<OddsApiResponse[]>({
    queryKey: ['polymarketOdds'],
    queryFn: fetchAllPolymarketOdds,
    staleTime: POLL_MS,
    refetchInterval: POLL_MS,
    retry: 2,
    retryDelay: 5000,
  });
}

/** Polymarket tournament winner odds */
export function usePolymarketTournamentOdds() {
  return useQuery<OddsApiResponse | null>({
    queryKey: ['polymarketTournamentOdds'],
    queryFn: fetchPolymarketTournamentOdds,
    staleTime: POLL_MS,
    refetchInterval: POLL_MS,
    retry: 2,
    retryDelay: 5000,
  });
}

/** Polymarket qualifying odds (feeds Q% input) */
export function usePolymarketQualifying() {
  return useQuery<OddsApiResponse | null>({
    queryKey: ['polymarketQualifying'],
    queryFn: fetchPolymarketQualifyingOdds,
    staleTime: POLL_MS,
    refetchInterval: POLL_MS,
    retry: 2,
    retryDelay: 5000,
  });
}

// ── Staleness / status helpers ──────────────────────────────────

export function getFreshness(lastFetched: Date | null): FreshnessLevel {
  if (!lastFetched) return 'offline';
  const age = Date.now() - lastFetched.getTime();
  if (age < STALE_AFTER_MS) return 'fresh';
  if (age < OFFLINE_AFTER_MS) return 'stale';
  return 'offline';
}

export function useOddsStatus(): {
  seed: SourceStatus;
  kalshi: SourceStatus;
  polymarket: SourceStatus;
} {
  const kalshi = useKalshiOdds();
  const poly = usePolymarketOdds();

  function buildStatus(
    source: 'kalshi' | 'polymarket' | 'manual',
    data: OddsApiResponse[] | undefined,
    error: Error | null,
    updatedAt: number,
  ): SourceStatus {
    const lastFetched = updatedAt > 0 ? new Date(updatedAt) : null;
    const teamCount = data?.reduce((s, d) => s + (d.teams?.length ?? 0), 0) ?? 0;
    const apiError = error?.message ?? (data?.find((d) => d.error)?.error ?? null);
    return {
      source,
      lastFetched,
      freshness: teamCount > 0 ? getFreshness(lastFetched) : 'offline',
      error: apiError,
      teamCount,
    };
  }

  return {
    seed: {
      source: 'manual',
      lastFetched: new Date('2026-02-01'),
      freshness: 'fresh',
      error: null,
      teamCount: initialGroupOdds.length,
    },
    kalshi: buildStatus('kalshi', kalshi.data, kalshi.error as Error | null, kalshi.dataUpdatedAt),
    polymarket: buildStatus('polymarket', poly.data, poly.error as Error | null, poly.dataUpdatedAt),
  };
}

/** Format age relative to now */
export function formatAge(date: Date | null): string {
  if (!date) return 'Never';
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
