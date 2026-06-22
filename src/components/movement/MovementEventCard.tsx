import type { MovementEvent, MovementSeverity } from '@/engine/movement';
import { teamName } from '@/engine/predictions';
import { FlagImg } from '@/components/ui/FlagImg';
import { DeltaBadge } from './DeltaBadge';
import { pct } from '@/utils/format';
import { cn } from '@/lib/utils';

const SEVERITY_STYLES: Record<MovementSeverity, { bg: string; border: string; badge: string; badgeText: string }> = {
  critical: { bg: 'bg-red-dim', border: 'border-red/20', badge: 'bg-red', badgeText: 'text-s0' },
  notable: { bg: 'bg-amber-dim', border: 'border-amber/20', badge: 'bg-amber', badgeText: 'text-s0' },
  minor: { bg: 'bg-s3', border: 'border-b2', badge: 'bg-s4', badgeText: 'text-t3' },
};

interface Props {
  event: MovementEvent;
  onMarkReviewed: (id: string) => void;
}

export function MovementEventCard({ event, onMarkReviewed }: Props) {
  const style = SEVERITY_STYLES[event.severity];

  return (
    <div className={cn('rounded-lg border p-3', style.bg, style.border, event.reviewed && 'opacity-50')}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn('text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded', style.badge, style.badgeText)}>
            {event.severity}
          </span>
          <span className="text-[10px] font-bold text-accent tabular-nums">{event.matchId}</span>
          <span className="text-[10px] text-t3">
            {event.type === 'new_top3_entry' ? 'New Entry' : event.type === 'top3_exit' ? 'Dropped Out' : 'Shift'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-t3 tabular-nums">
            {new Date(event.timestamp).toLocaleDateString()}
          </span>
          {!event.reviewed && (
            <button
              onClick={() => onMarkReviewed(event.id)}
              className="text-[9px] font-bold text-accent hover:text-accent-bright"
            >
              Mark Reviewed
            </button>
          )}
        </div>
      </div>

      <p className="text-xs font-semibold text-t1 mb-2">{event.description}</p>

      {/* Before / After */}
      {event.before.team1 && event.after.team1 && (
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5 text-t3">
            <span>Before:</span>
            <FlagImg teamId={event.before.team1} size="xs" />
            <span>{teamName(event.before.team1)}</span>
            <span>vs</span>
            <FlagImg teamId={event.before.team2} size="xs" />
            <span>{teamName(event.before.team2)}</span>
            <span className="font-bold tabular-nums">{pct(event.before.combined)}</span>
          </div>
          <DeltaBadge delta={event.delta} />
          <div className="flex items-center gap-1.5 text-t1">
            <span>After:</span>
            <FlagImg teamId={event.after.team1} size="xs" />
            <span className="font-semibold">{teamName(event.after.team1)}</span>
            <span>vs</span>
            <FlagImg teamId={event.after.team2} size="xs" />
            <span className="font-semibold">{teamName(event.after.team2)}</span>
            <span className="font-bold tabular-nums">{pct(event.after.combined)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
