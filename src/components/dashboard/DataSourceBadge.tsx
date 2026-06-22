import { SOURCE_LABELS, type DataSourceLabel } from '@/api/data-source';
import { formatAge } from '@/api/hooks';
import { cn } from '@/lib/utils';

interface DataSourceBadgeProps {
  source: DataSourceLabel;
  timestamp: Date;
  className?: string;
}

export function DataSourceBadge({ source, timestamp, className }: DataSourceBadgeProps) {
  const cfg = SOURCE_LABELS[source];

  return (
    <div className={cn('flex items-center gap-1.5 bg-s2 rounded-full px-3 py-1', className)}>
      <div className={cn('w-1.5 h-1.5 rounded-full', cfg.dot, source === 'kalshi_live' && 'animate-pulse')} />
      <span className={cn('text-[10px] font-medium', cfg.color)}>{cfg.label}</span>
      <span className="text-[10px] text-t3">&middot;</span>
      <span className="text-[10px] text-t3">{formatAge(timestamp)}</span>
    </div>
  );
}
