import type { GroupStatus } from '@/engine/results';
import { teamName } from '@/engine/predictions';
import { FlagImg } from '@/components/ui/FlagImg';
import { cn } from '@/lib/utils';

interface GroupStandingsTableProps {
  group: string;
  status: GroupStatus | undefined;
  /** Short note on why this group matters for Dallas (e.g. "2E feeds M78") */
  dallasNote?: string;
}

/**
 * A single group's live points table: P W D L GF GA GD Pts.
 * Top 2 rows tinted green (qualify), 3rd amber (possible best-third).
 * Clinch / elimination badges surface the live constraints the engine derives.
 */
export function GroupStandingsTable({ group, status, dallasNote }: GroupStandingsTableProps) {
  const standings = status?.standings ?? [];
  const played = status?.matchesPlayed ?? 0;
  const clinched = new Set(status?.clinchedFirst ?? []);
  const eliminated = new Set(status?.eliminatedFromTop2 ?? []);

  return (
    <div className="bg-s2 rounded-xl border border-b2 overflow-hidden">
      {/* Group header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-b1 bg-s3/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-t1">Group {group}</span>
          {status?.complete ? (
            <span className="text-[9px] font-bold text-green bg-green-dim px-1.5 py-0.5 rounded-full">FINAL</span>
          ) : played > 0 ? (
            <span className="text-[9px] font-bold text-amber bg-amber-dim px-1.5 py-0.5 rounded-full">
              {played} of 6 played
            </span>
          ) : (
            <span className="text-[9px] font-bold text-t3 bg-s3 px-1.5 py-0.5 rounded-full">Not started</span>
          )}
        </div>
        {dallasNote && <span className="text-[9px] text-t3">{dallasNote}</span>}
      </div>

      {/* Table */}
      <table className="w-full text-xs tabular-nums">
        <thead>
          <tr className="text-t3 text-[10px] uppercase tracking-wide">
            <th className="text-left font-semibold px-3 py-1.5 w-6">#</th>
            <th className="text-left font-semibold py-1.5">Team</th>
            <th className="text-center font-semibold py-1.5 w-7" title="Played">P</th>
            <th className="text-center font-semibold py-1.5 w-7" title="Won">W</th>
            <th className="text-center font-semibold py-1.5 w-7" title="Drawn">D</th>
            <th className="text-center font-semibold py-1.5 w-7" title="Lost">L</th>
            <th className="text-center font-semibold py-1.5 w-9 hidden sm:table-cell" title="Goals for">GF</th>
            <th className="text-center font-semibold py-1.5 w-9 hidden sm:table-cell" title="Goals against">GA</th>
            <th className="text-center font-semibold py-1.5 w-9" title="Goal difference">GD</th>
            <th className="text-center font-bold py-1.5 px-3 w-10" title="Points">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const rank = i + 1;
            const qualifies = rank <= 2;
            const thirdPlace = rank === 3;
            return (
              <tr
                key={s.teamId}
                className={cn(
                  'border-t border-b1/60',
                  qualifies && 'bg-green-dim/40',
                  thirdPlace && 'bg-amber-dim/30',
                )}
              >
                <td className="px-3 py-2 text-t3 font-semibold">{rank}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FlagImg teamId={s.teamId} size="xs" />
                    <span className="font-semibold text-t1 truncate">{teamName(s.teamId)}</span>
                    {clinched.has(s.teamId) && (
                      <span className="text-[8px] font-bold text-green bg-green-dim px-1 py-0.5 rounded leading-none shrink-0">
                        ✓ 1st
                      </span>
                    )}
                    {eliminated.has(s.teamId) && (
                      <span className="text-[8px] font-bold text-red bg-red-dim px-1 py-0.5 rounded leading-none shrink-0">
                        OUT
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-center py-2 text-t2">{s.played}</td>
                <td className="text-center py-2 text-t2">{s.won}</td>
                <td className="text-center py-2 text-t2">{s.drawn}</td>
                <td className="text-center py-2 text-t2">{s.lost}</td>
                <td className="text-center py-2 text-t2 hidden sm:table-cell">{s.gf}</td>
                <td className="text-center py-2 text-t2 hidden sm:table-cell">{s.ga}</td>
                <td className={cn('text-center py-2 font-medium', s.gd > 0 ? 'text-green' : s.gd < 0 ? 'text-red' : 'text-t2')}>
                  {s.gd > 0 ? `+${s.gd}` : s.gd}
                </td>
                <td className="text-center py-2 px-3 font-extrabold text-t1">{s.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend footer (only once there's data) */}
      {played > 0 && (
        <div className="flex items-center gap-3 px-3 py-1.5 border-t border-b1 text-[9px] text-t3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-green-dim inline-block" /> Qualify (top 2)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-amber-dim inline-block" /> 3rd — best-third race
          </span>
        </div>
      )}
    </div>
  );
}
