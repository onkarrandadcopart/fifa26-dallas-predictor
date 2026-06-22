/** Format a probability (0-1) as a percentage string with 1 decimal place */
export function pct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/** Format a probability already in percentage form (0-100) */
export function pctRaw(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Format a date string for display */
export function formatMatchDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** Format a full date with day of week */
export function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Ordinal suffix for match position (1st, 2nd, 3rd, etc.) */
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/** Shorten team name for compact displays */
export function shortName(name: string): string {
  const shorts: Record<string, string> = {
    'United States': 'USA',
    'Ivory Coast': 'CIV',
    'Saudi Arabia': 'KSA',
    'New Zealand': 'NZL',
    'Cape Verde': 'CPV',
    'Costa Rica': 'CRC',
  };
  return shorts[name] ?? name;
}
