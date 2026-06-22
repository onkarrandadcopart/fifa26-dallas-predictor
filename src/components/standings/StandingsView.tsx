import { useQuery } from '@tanstack/react-query';
import { fetchGroupStatuses } from '@/api/live-results';
import { relevantGroups } from '@/data/groups';
import { LiveScorecard } from '@/components/dashboard/LiveScorecard';
import { GroupStandingsTable } from './GroupStandingsTable';

/**
 * Points Table view (2nd tab).
 *
 * Top: today's matches (live scores).
 * Below: live points tables for all 8 Dallas-relevant groups — where each team
 * stands right now (W/D/L, GF/GA/GD, points), with clinch/elimination badges.
 *
 * Powered by the same live-results pipeline that drives the dashboard
 * predictions, so the table and the predictions can never disagree.
 */
export function StandingsView() {
  const { data: groupStatus, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['groupStatuses'],
    queryFn: fetchGroupStatuses,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

  const anyData = groupStatus
    ? Object.values(groupStatus).some((s) => s && s.matchesPlayed > 0)
    : false;

  return (
    <div className="space-y-5">
      {/* ── Today's matches ── */}
      <section>
        <h2 className="text-sm font-bold text-t1 mb-2.5 flex items-center gap-2">
          Today&apos;s Matches
        </h2>
        <LiveScorecard />
      </section>

      {/* ── Group points tables ── */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-bold text-t1">Group Standings</h2>
          {dataUpdatedAt > 0 && (
            <span className="text-[10px] text-t3">
              Updated {new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {' · auto-refresh 2m'}
            </span>
          )}
        </div>

        {isLoading && !groupStatus ? (
          <div className="bg-s2 rounded-xl border border-b2 p-6 text-center text-xs text-t3">
            Loading live standings…
          </div>
        ) : (
          <>
            {!anyData && (
              <div className="bg-s2 rounded-xl border border-b2 p-4 mb-4 text-xs text-t3">
                No group-stage results yet — tables show seeded groups and will populate as matches finish.
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {relevantGroups.map((g) => (
                <GroupStandingsTable
                  key={g.id}
                  group={g.id}
                  status={groupStatus?.[g.id]}
                  dallasNote={g.dallasRelevance}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
