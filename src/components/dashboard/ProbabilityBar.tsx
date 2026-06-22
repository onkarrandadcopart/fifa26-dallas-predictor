import { cn } from '@/lib/utils';

interface ProbabilityBarProps {
  value: number;       // 0-1
  maxValue?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export function ProbabilityBar({
  value,
  maxValue,
  className,
  size = 'md',
  glow = false,
}: ProbabilityBarProps) {
  const pct = value * 100;
  const width = maxValue ? (value / maxValue) * 100 : Math.min(pct * 3, 100);

  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2.5' };

  return (
    <div className={cn('flex-1 rounded-full overflow-hidden', heights[size], 'bg-s3', className)}>
      <div
        className={cn('h-full rounded-full animate-bar-fill', glow && 'shadow-[0_0_8px_rgba(59,123,246,0.4)]')}
        style={{
          width: `${Math.min(width, 100)}%`,
          background: pct > 6
            ? 'linear-gradient(90deg, #2662D9, #5E9AFF)'
            : pct > 2
              ? '#3B7BF6'
              : '#1F2A4A',
        }}
      />
    </div>
  );
}
