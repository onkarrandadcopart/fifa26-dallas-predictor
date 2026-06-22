import { teamName } from '@/engine/predictions';
import { pct } from '@/utils/format';
import { FlagImg } from '@/components/ui/FlagImg';
import { colors } from '@/utils/colors';

interface SemifinalTrackerProps {
  predictions: { teamId: string; pSemifinal: number; pFinal: number }[];
}

export function SemifinalTracker({ predictions }: SemifinalTrackerProps) {
  const data = predictions.slice(0, 8).map((p) => ({
    ...p,
    name: teamName(p.teamId),
    pctValue: p.pSemifinal * 100,
  }));

  return (
    <div className="bg-s2 rounded-xl border border-b2 p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-bold text-t1">Semifinal — M101</h3>
        <span className="text-[9px] font-bold bg-s3 text-t3 px-1.5 py-0.5 rounded">Jul 14</span>
      </div>
      <p className="text-[10px] text-t3 mb-4">P(Reach SF) at AT&T Stadium</p>

      <div className="space-y-1.5">
        {data.map((team, i) => (
          <div key={team.teamId} className="flex items-center gap-2">
            <FlagImg teamId={team.teamId} size="xs" />
            <span className="text-[11px] font-semibold text-t2 w-16 truncate">{team.name}</span>
            <div className="flex-1 h-4 bg-s3 rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm animate-bar-fill"
                style={{
                  width: `${Math.min((team.pctValue / 35) * 100, 100)}%`,
                  background: i < 3
                    ? 'linear-gradient(90deg, #2662D9, #5E9AFF)'
                    : i < 5 ? '#3B7BF6' : '#1D3E7A',
                }}
              />
            </div>
            <span
              className="text-[12px] font-bold tabular-nums text-right w-10"
              style={{ color: i < 3 ? '#5E9AFF' : colors.textSecondary }}
            >
              {pct(team.pSemifinal)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
