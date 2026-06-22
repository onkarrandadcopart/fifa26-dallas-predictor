import { useState } from 'react';
import type { TeamProbabilities, GroupId } from '@/engine/types';
import { teamName } from '@/engine/predictions';
import { pct } from '@/utils/format';
import { FlagImg } from '@/components/ui/FlagImg';
import { ProbabilityBar } from './ProbabilityBar';
import { cn } from '@/lib/utils';

interface GroupOddsPanelProps {
  groups: Record<GroupId, TeamProbabilities[]>;
  relevantGroups: GroupId[];
  groupLabels: Record<string, string>;
}

export function GroupOddsPanel({ groups, relevantGroups, groupLabels }: GroupOddsPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="bg-s2 rounded-xl border border-b2 p-4">
      <h3 className="text-xs font-bold text-t1 mb-1">Group Odds</h3>
      <p className="text-[10px] text-t3 mb-3">Feeding Dallas knockout matches</p>

      <div className="space-y-0.5">
        {relevantGroups.map((gid) => {
          const probs = groups[gid];
          if (!probs) return null;
          const isOpen = expanded === gid;
          const winner = probs.reduce((a, b) => (a.pWin > b.pWin ? a : b));

          return (
            <div key={gid}>
              <button
                onClick={() => setExpanded(isOpen ? null : gid)}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors',
                  isOpen ? 'bg-s3' : 'hover:bg-s3/50',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-accent w-8">Grp {gid}</span>
                  <FlagImg teamId={winner.teamId} size="xs" />
                  <span className="text-[11px] font-semibold text-t2">
                    {teamName(winner.teamId)}
                  </span>
                  <span className="text-[10px] font-bold text-accent-bright tabular-nums">
                    {pct(winner.pWin)}
                  </span>
                </div>
                <svg
                  className={cn('w-3 h-3 text-t3 transition-transform', isOpen && 'rotate-180')}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="mt-1 mb-2 ml-2 mr-2 space-y-1">
                  <div className="text-[9px] text-t3 mb-1 px-1">{groupLabels[gid]}</div>
                  {probs
                    .sort((a, b) => b.pWin - a.pWin)
                    .map((tp) => (
                      <div key={tp.teamId} className="flex items-center gap-2 py-1 px-1">
                        <FlagImg teamId={tp.teamId} size="xs" />
                        <span className="text-[11px] font-semibold text-t2 w-20 truncate">
                          {teamName(tp.teamId)}
                        </span>
                        <ProbabilityBar value={tp.pWin} maxValue={winner.pWin} size="sm" />
                        <span className="text-[11px] font-bold text-t1 tabular-nums w-10 text-right">
                          {pct(tp.pWin)}
                        </span>
                        <span className="text-[11px] font-semibold text-accent tabular-nums w-10 text-right">
                          {pct(tp.pSecond)}
                        </span>
                      </div>
                    ))}
                  <div className="flex items-center gap-2 px-1 pt-1 border-t border-b1">
                    <span className="text-[9px] text-t3 ml-auto">P(Win)</span>
                    <span className="text-[9px] text-accent w-10 text-right">P(2nd)</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
