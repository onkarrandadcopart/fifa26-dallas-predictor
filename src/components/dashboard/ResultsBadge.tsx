import type { GroupId } from '@/engine/types';
import type { GroupStatus } from '@/engine/results';
import { cn } from '@/lib/utils';

interface ResultsBadgeProps {
  groupStatus?: Partial<Record<GroupId, GroupStatus>>;
  className?: string;
}

/**
 * Shows whether predictions are reflecting live match results.
 * Green when at least one group is constrained by actual results.
 */
export function ResultsBadge({ groupStatus, className }: ResultsBadgeProps) {
  if (!groupStatus) return null;

  const statuses = Object.values(groupStatus).filter(Boolean) as GroupStatus[];
  const active = statuses.filter((s) => s.matchesPlayed > 0);
  if (active.length === 0) return null;

  const complete = active.filter((s) => s.complete).length;
  const inProgress = active.length - complete;

  const label = complete > 0
    ? `Results live · ${complete} group${complete > 1 ? 's' : ''} final${inProgress ? `, ${inProgress} in play` : ''}`
    : `Results live · ${inProgress} group${inProgress > 1 ? 's' : ''} in play`;

  return (
    <div className={cn('flex items-center gap-1.5 bg-s2 rounded-full px-3 py-1', className)}>
      <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
      <span className="text-[10px] font-medium text-green">{label}</span>
    </div>
  );
}
