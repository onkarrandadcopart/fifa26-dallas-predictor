import { cn } from '@/lib/utils';

interface DeltaBadgeProps {
  delta: number;       // percentage points
  className?: string;
}

export function DeltaBadge({ delta, className }: DeltaBadgeProps) {
  const abs = Math.abs(delta);
  if (abs < 0.1) return <span className={cn('text-t3 text-xs tabular-nums', className)}>—</span>;

  const isUp = delta > 0;
  return (
    <span className={cn(
      'text-xs font-bold tabular-nums',
      isUp ? 'text-green' : 'text-red',
      abs > 1 && 'font-extrabold',
      className,
    )}>
      {isUp ? '▲' : '▼'}{abs.toFixed(1)}
    </span>
  );
}
