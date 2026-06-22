import type { MatchupPrediction } from '@/engine/types';
import { teamName } from '@/engine/predictions';
import { pct } from '@/utils/format';
import { FlagImg } from '@/components/ui/FlagImg';
import { ProbabilityBar } from './ProbabilityBar';
import { cn } from '@/lib/utils';

interface MatchupRowProps {
  matchup: MatchupPrediction;
  rank: number;
  maxCombined: number;
}

export function MatchupRow({ matchup, rank, maxCombined }: MatchupRowProps) {
  const isTop3 = rank <= 3;

  return (
    <div className={cn(
      'flex items-center gap-3 py-2 px-3 transition-colors',
      isTop3 ? 'bg-accent-glow' : 'hover:bg-s2/60',
    )}>
      {/* Rank */}
      <span className={cn(
        'w-5 text-center text-[11px] font-bold tabular-nums',
        isTop3 ? 'text-accent-bright' : 'text-t3',
      )}>
        {rank}
      </span>

      {/* Team 1 */}
      <div className="flex items-center gap-1.5 w-[120px] shrink-0">
        <FlagImg teamId={matchup.team1} size="sm" />
        <span className={cn(
          'text-[13px] font-semibold truncate',
          isTop3 ? 'text-t1' : 'text-t2',
        )}>
          {teamName(matchup.team1)}
        </span>
      </div>

      {/* VS */}
      <span className="text-[10px] text-t3 font-medium w-4 text-center">vs</span>

      {/* Team 2 */}
      <div className="flex items-center gap-1.5 w-[120px] shrink-0">
        <FlagImg teamId={matchup.team2} size="sm" />
        <span className={cn(
          'text-[13px] font-semibold truncate',
          isTop3 ? 'text-t1' : 'text-t2',
        )}>
          {teamName(matchup.team2)}
        </span>
      </div>

      {/* Bar */}
      <div className="flex-1">
        <ProbabilityBar value={matchup.combined} maxValue={maxCombined} size="sm" glow={isTop3} />
      </div>

      {/* Pct */}
      <span className={cn(
        'w-14 text-right text-[13px] tabular-nums font-bold',
        isTop3 ? 'text-accent-bright' : 'text-t3',
      )}>
        {pct(matchup.combined)}
      </span>
    </div>
  );
}
