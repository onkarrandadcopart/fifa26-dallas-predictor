import { useState, useMemo } from 'react';
import { useMovementStore } from '@/store/movement-store';
import { countUnreviewed } from '@/engine/movement';
import { MovementEventCard } from './MovementEventCard';
import { cn } from '@/lib/utils';

const MATCH_FILTERS = ['All', 'M78', 'M88', 'M93', 'M101'] as const;
const SEVERITY_FILTERS = ['All', 'critical', 'notable', 'minor'] as const;

export function MovementLogView() {
  const { events, markReviewed, markAllReviewed, clearAll } = useMovementStore();
  const [matchFilter, setMatchFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');

  const counts = useMemo(() => countUnreviewed(events), [events]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (matchFilter !== 'All' && e.matchId !== matchFilter) return false;
      if (severityFilter !== 'All' && e.severity !== severityFilter) return false;
      return true;
    });
  }, [events, matchFilter, severityFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const e of filtered) {
      const date = new Date(e.timestamp).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(e);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-t1">Movement Log</h2>
          <p className="text-xs text-t3 mt-0.5">
            Track prediction changes across Dallas matches. {counts.total > 0 && (
              <span className="text-amber font-bold">{counts.total} unreviewed</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {counts.total > 0 && (
            <button
              onClick={markAllReviewed}
              className="text-[10px] font-bold text-accent hover:text-accent-bright"
            >
              Mark All Reviewed
            </button>
          )}
          {events.length > 0 && (
            <button
              onClick={clearAll}
              className="text-[10px] font-bold text-t3 hover:text-red"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-t3 font-bold">Match:</span>
          {MATCH_FILTERS.map((m) => (
            <button
              key={m}
              onClick={() => setMatchFilter(m)}
              className={cn(
                'text-[10px] font-bold px-2 py-1 rounded transition-colors',
                matchFilter === m ? 'bg-accent text-white' : 'bg-s3 text-t3 hover:bg-s4',
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-t3 font-bold">Severity:</span>
          {SEVERITY_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={cn(
                'text-[10px] font-bold px-2 py-1 rounded transition-colors capitalize',
                severityFilter === s ? 'bg-accent text-white' : 'bg-s3 text-t3 hover:bg-s4',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Events grouped by date */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-s2 rounded-xl border border-b2 p-12 text-center">
          <p className="text-t3 text-sm">No movement events yet.</p>
          <p className="text-t3 text-xs mt-1">Events appear when prediction market odds shift and Dallas match predictions change.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, dateEvents]) => (
          <div key={date}>
            <h3 className="text-[10px] font-bold text-t3 uppercase tracking-widest mb-2">{date}</h3>
            <div className="space-y-2">
              {dateEvents.map((e) => (
                <MovementEventCard key={e.id} event={e} onMarkReviewed={markReviewed} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
