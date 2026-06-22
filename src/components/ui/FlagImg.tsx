import { getFlagUrl } from '@/utils/flags';
import { cn } from '@/lib/utils';

interface FlagImgProps {
  teamId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * flagcdn.com only serves these widths: 20, 40, 80, 160, 320
 * Map each display size to the nearest CDN width that covers it at 2x for retina.
 */
const sizeConfig = {
  xs: { cdnWidth: 40,  cls: 'w-5 h-[15px]' },
  sm: { cdnWidth: 40,  cls: 'w-6 h-[18px]' },
  md: { cdnWidth: 80,  cls: 'w-8 h-6' },
  lg: { cdnWidth: 80,  cls: 'w-12 h-9' },
  xl: { cdnWidth: 160, cls: 'w-20 h-[60px]' },
};

export function FlagImg({ teamId, size = 'md', className }: FlagImgProps) {
  const cfg = sizeConfig[size];
  const url = getFlagUrl(teamId, cfg.cdnWidth);

  return (
    <img
      src={url}
      alt=""
      className={cn(cfg.cls, 'object-cover rounded-[2px] shadow-sm shrink-0', className)}
      loading="lazy"
    />
  );
}
