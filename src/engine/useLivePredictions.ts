/**
 * Shared hook: resolves live odds + live tournament odds + live results
 * constraints and returns the corrected Dallas predictions.
 *
 * Used by DashboardView, ExecutiveView and BracketView so every surface shows
 * the SAME live-corrected numbers (no view drifts back to stale seed data).
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { resolveOdds, resolveTournamentOdds, type ResolvedOdds, type DataSourceLabel } from '@/api/data-source';
import { fetchGroupStatuses } from '@/api/live-results';
import { computeAllPredictions, type DallasPredictions } from './predictions';
import { knockoutOdds } from '../data/initial-odds';
import type { GroupId } from './types';
import type { GroupStatus } from './results';

export interface LivePredictions {
  predictions: DallasPredictions;
  resolved: ResolvedOdds | undefined;
  groupStatus: Partial<Record<GroupId, GroupStatus>> | undefined;
  tournamentSource: DataSourceLabel | undefined;
}

export function useLivePredictions(): LivePredictions {
  const { data: resolved } = useQuery<ResolvedOdds>({
    queryKey: ['resolvedOdds'],
    queryFn: resolveOdds,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: tournOdds } = useQuery({
    queryKey: ['resolvedTournamentOdds'],
    queryFn: resolveTournamentOdds,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: groupStatus } = useQuery({
    queryKey: ['groupStatuses'],
    queryFn: fetchGroupStatuses,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

  const predictions = useMemo(
    () => computeAllPredictions(
      resolved?.odds,
      knockoutOdds,
      tournOdds?.odds,
      groupStatus,
    ),
    [resolved?.odds, tournOdds?.odds, groupStatus],
  );

  return {
    predictions,
    resolved,
    groupStatus,
    tournamentSource: tournOdds?.source,
  };
}
