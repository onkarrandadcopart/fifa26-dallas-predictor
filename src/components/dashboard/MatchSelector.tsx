import type { MatchupPrediction } from '@/engine/types';
import type { DallasPredictions } from '@/engine/predictions';
import { teamName } from '@/engine/predictions';
import { dallasMatches, stageLabels } from '@/data/dallas-matches';
import { FlagImg } from '@/components/ui/FlagImg';
import { pct } from '@/utils/format';
import { cn } from '@/lib/utils';

interface MatchSelectorProps {
  selectedMatchId: string;
  onSelect: (matchId: string) => void;
  predictions: DallasPredictions;
}

/** Hard-coded teamIds for confirmed matches */
const confirmedTeams: Record<string, [string, string]> = {
  M11: ['netherlands', 'japan'],
  M21: ['england', 'croatia'],
  M43: ['argentina', 'austria'],
  M70: ['argentina', 'jordan'],
  M78: ['ivory_coast', 'norway'],
  M88: ['australia', 'egypt'],
  M93: ['portugal', 'spain'],
};

/** Get top predicted teams for a knockout match */
function getTopPredicted(
  matchId: string,
  predictions: DallasPredictions,
): { t1: string; t2: string; prob: number } | null {
  let matchups: MatchupPrediction[] | undefined;
  switch (matchId) {
    case 'M78': matchups = predictions.m78; break;
    case 'M88': matchups = predictions.m88; break;
    case 'M93': matchups = predictions.m93; break;
    case 'M101': matchups = predictions.m101Matchups; break;
  }
  const top = matchups?.[0];
  if (!top) return null;
  return { t1: top.team1, t2: top.team2, prob: top.combined };
}

export function MatchSelector({ selectedMatchId, onSelect, predictions }: MatchSelectorProps) {
  return (
    <div>
      <h3 className="text-[10px] font-bold text-t3 uppercase tracking-widest px-1 mb-3">
        AT&T Stadium
      </h3>
      <div className="space-y-1">
        {dallasMatches.map((match) => {
          const isSelected = match.matchId === selectedMatchId;
          const confirmed = confirmedTeams[match.matchId];
          const predicted = !confirmed ? getTopPredicted(match.matchId, predictions) : null;

          return (
            <button
              key={match.matchId}
              onClick={() => onSelect(match.matchId)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 group',
                isSelected
                  ? 'bg-accent/12 ring-1 ring-accent/30'
                  : 'hover:bg-s3/50',
              )}
            >
              {/* Row 1: ID · Date · Stage */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'text-[10px] font-bold tabular-nums',
                    isSelected ? 'text-accent-bright' : 'text-t3',
                  )}>
                    {match.matchId}
                  </span>
                  <span className="text-[9px] text-t3">&middot;</span>
                  <span className="text-[10px] text-t3">{match.displayDate}</span>
                </div>
                <span className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded',
                  isSelected ? 'bg-accent/20 text-accent-bright' : 'bg-s3 text-t3',
                )}>
                  {stageLabels[match.stage]}
                </span>
              </div>

              {/* Row 2: Flags + Teams */}
              {confirmed ? (
                <div className="flex items-center gap-2">
                  <FlagImg teamId={confirmed[0]} size="xs" />
                  <span className={cn('text-xs font-semibold', isSelected ? 'text-t1' : 'text-t2')}>
                    {teamName(confirmed[0])}
                  </span>
                  {match.result ? (
                    <span className="text-[10px] font-bold text-t3 tabular-nums">{match.result}</span>
                  ) : (
                    <span className="text-[10px] text-t3">vs</span>
                  )}
                  <FlagImg teamId={confirmed[1]} size="xs" />
                  <span className={cn('text-xs font-semibold', isSelected ? 'text-t1' : 'text-t2')}>
                    {teamName(confirmed[1])}
                  </span>
                </div>
              ) : predicted ? (
                <div className="flex items-center gap-1.5">
                  <FlagImg teamId={predicted.t1} size="xs" />
                  <FlagImg teamId={predicted.t2} size="xs" />
                  <span className={cn(
                    'text-[11px] font-semibold truncate',
                    isSelected ? 'text-t1' : 'text-t2 group-hover:text-t1',
                  )}>
                    {teamName(predicted.t1)} vs {teamName(predicted.t2)}
                  </span>
                  <span className="text-[10px] font-bold text-accent tabular-nums ml-auto shrink-0">
                    {pct(predicted.prob)}
                  </span>
                </div>
              ) : (
                <span className={cn('text-xs', isSelected ? 'text-t2' : 'text-t3')}>
                  {match.teams}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
