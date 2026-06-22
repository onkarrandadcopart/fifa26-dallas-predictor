/**
 * useMovementDetector — runs alongside the live odds poll.
 *
 * On every successful odds fetch:
 *   1. Compute fresh DallasPredictions.
 *   2. If we have a stored baseline, diff against it and persist any events.
 *   3. Store the fresh predictions as the new baseline.
 *
 * Baseline lives in localStorage (via movement-store) so first-time visitors
 * still get a baseline = seed → live diff on their first poll.
 */
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { resolveOdds, type ResolvedOdds } from '@/api/data-source';
import { computeAllPredictions, type DallasPredictions } from './predictions';
import { detectMovements } from './movement';
import { useMovementStore } from '@/store/movement-store';
import { initialGroupOdds } from '@/data/initial-odds';

/** Bootstrap the seed-data predictions once, used as the first baseline. */
function seedBaseline(): DallasPredictions {
  return computeAllPredictions(initialGroupOdds);
}

export function useMovementDetector() {
  const { baseline, setBaseline, addEvents } = useMovementStore();
  const lastTimestampRef = useRef<number>(0);

  const { data: resolved } = useQuery<ResolvedOdds>({
    queryKey: ['resolvedOdds'],
    queryFn: resolveOdds,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!resolved?.odds?.length) return;

    // Only act on data we haven't processed yet — guard against re-runs
    // from React strict mode or the same cache hit firing multiple times.
    const ts = resolved.timestamp.getTime();
    if (ts === lastTimestampRef.current) return;
    lastTimestampRef.current = ts;

    const next = computeAllPredictions(resolved.odds);
    const prev = baseline ?? seedBaseline();

    const events = detectMovements(prev, next, resolved.timestamp.toISOString());
    if (events.length > 0) addEvents(events);

    // Always advance baseline so the next poll diffs against the most recent snapshot.
    setBaseline(next);
  }, [resolved, baseline, addEvents, setBaseline]);
}
