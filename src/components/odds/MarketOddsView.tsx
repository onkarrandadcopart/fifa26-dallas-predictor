import { useMemo } from 'react';
import { useOddsStatus, useKalshiOdds, usePolymarketOdds, formatAge } from '@/api/hooks';
import { initialGroupOdds } from '@/data/initial-odds';
import { teamName as getTeamName } from '@/engine/predictions';
import { spreadsheetNameToId } from '@/data/teams';
import { FlagImg } from '@/components/ui/FlagImg';
import type { FreshnessLevel } from '@/api/types';
import type { OddsApiResponse } from '@/api/types';
import type { GroupId } from '@/engine/types';
import { cn } from '@/lib/utils';

const GROUPS: GroupId[] = ['D', 'E', 'G', 'H', 'I', 'J', 'K', 'L'];

const GROUP_META: Record<string, { label: string; feeds: string }> = {
  D: { label: 'USA, Paraguay, Australia, TBD', feeds: 'M88 (2D)' },
  E: { label: 'Germany, Ecuador, Ivory Coast, Curacao', feeds: 'M78 (2E)' },
  G: { label: 'Belgium, Egypt, Iran, New Zealand', feeds: 'M88 (2G)' },
  H: { label: 'Spain, Uruguay, Saudi Arabia, Cape Verde', feeds: 'M84 (1H) → M93' },
  I: { label: 'France, Senegal, Norway, TBD', feeds: 'M78 (2I)' },
  J: { label: 'Argentina, Austria, Jordan, Algeria', feeds: 'M84 (2J) → M93' },
  K: { label: 'Portugal, Colombia, Uzbekistan, TBD', feeds: 'M83 (2K) → M93' },
  L: { label: 'England, Croatia, Ghana, Panama', feeds: 'M83 (2L) → M93' },
};

interface CompRow {
  teamId: string;
  name: string;
  seed: number;
  kalshi: number | null;
  polymarket: number | null;
  spread: number | null;
  qualifyPct: number;
}

export function MarketOddsView() {
  const status = useOddsStatus();
  const kalshi = useKalshiOdds();
  const polymarket = usePolymarketOdds();

  const comparisonByGroup = useMemo(() => {
    const result: Record<string, CompRow[]> = {};
    for (const group of GROUPS) {
      const seedTeams = initialGroupOdds.filter((o) => o.group === group);
      const kalshiGroup = kalshi.data?.find((d) => d.group.toUpperCase() === group);
      const polyGroup = polymarket.data?.find((d) => d.group.toUpperCase() === group);

      result[group] = seedTeams.map((st) => {
        const kMatch = findTeamInSource(kalshiGroup, st.teamId);
        const pMatch = findTeamInSource(polyGroup, st.teamId);
        const vals = [st.winPct, kMatch?.winPct ?? null, pMatch?.winPct ?? null].filter(
          (v): v is number => v !== null,
        );
        const spread = vals.length >= 2 ? Math.max(...vals) - Math.min(...vals) : null;
        return {
          teamId: st.teamId,
          name: getTeamName(st.teamId),
          seed: st.winPct,
          kalshi: kMatch?.winPct ?? null,
          polymarket: pMatch?.winPct ?? null,
          spread,
          qualifyPct: st.qualifyPct,
        };
      });
    }
    return result;
  }, [kalshi.data, polymarket.data]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-t1">Market Odds</h2>
        <p className="text-xs text-t3 mt-0.5">
          Seed data vs live markets. Spreads &gt;3% highlighted.
        </p>
      </div>

      {/* ── Source Status ── */}
      <div className="flex gap-3">
        <SourceCard label="Seed (Spreadsheet)" status={status.seed} isRefetching={false} />
        <SourceCard label="Kalshi" status={status.kalshi} isRefetching={kalshi.isRefetching} onRefetch={() => kalshi.refetch()} />
        <SourceCard label="Polymarket" status={status.polymarket} isRefetching={polymarket.isRefetching} onRefetch={() => polymarket.refetch()} />
      </div>

      {/* ── Group Tables ── */}
      {GROUPS.map((group) => {
        const rows = comparisonByGroup[group] ?? [];
        const meta = GROUP_META[group]!;
        return (
          <div key={group} className="bg-s2 rounded-xl border border-b2 overflow-hidden">
            <div className="px-4 py-2.5 bg-s3/50 border-b border-b1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-accent">Group {group}</span>
                <span className="text-[10px] text-t3">{meta.label}</span>
              </div>
              <span className="text-[9px] text-t3 bg-s4 px-1.5 py-0.5 rounded">{meta.feeds}</span>
            </div>

            <div className="grid grid-cols-[1fr_72px_72px_72px_56px_56px] gap-1 px-4 py-1.5 border-b border-b1 text-[9px] font-bold text-t3 uppercase tracking-wider">
              <span>Team</span>
              <span className="text-right">Seed</span>
              <span className="text-right">Kalshi</span>
              <span className="text-right">Poly</span>
              <span className="text-right">Spread</span>
              <span className="text-right">Q%</span>
            </div>

            {rows.sort((a, b) => b.seed - a.seed).map((row) => (
              <div key={row.teamId} className="grid grid-cols-[1fr_72px_72px_72px_56px_56px] gap-1 px-4 py-2 border-b border-b1 last:border-b-0 items-center hover:bg-s3/30 transition-colors">
                <div className="flex items-center gap-2">
                  <FlagImg teamId={row.teamId} size="xs" />
                  <span className="text-xs font-semibold text-t1">{row.name}</span>
                </div>
                <span className="text-xs font-bold text-t1 tabular-nums text-right">{row.seed.toFixed(1)}%</span>
                <OddsCell value={row.kalshi} seed={row.seed} />
                <OddsCell value={row.polymarket} seed={row.seed} />
                <span className={cn(
                  'text-xs font-bold tabular-nums text-right',
                  row.spread !== null && row.spread > 5 ? 'text-red' :
                    row.spread !== null && row.spread > 3 ? 'text-amber' : 'text-t3',
                )}>
                  {row.spread !== null ? row.spread.toFixed(1) : '—'}
                </span>
                <span className="text-xs text-t3 tabular-nums text-right">{row.qualifyPct}%</span>
              </div>
            ))}
          </div>
        );
      })}

      {/* ── Legend ── */}
      <div className="bg-s2 rounded-xl border border-b2 p-4">
        <h3 className="text-xs font-bold text-t1 mb-2">Reading This Data</h3>
        <div className="grid grid-cols-3 gap-4 text-[10px] text-t3">
          <div><span className="font-bold text-t2">Seed</span> — Vig-removed P(Win) from the spreadsheet. Baseline for all predictions.</div>
          <div><span className="font-bold text-t2">Kalshi / Poly</span> — Live market prices. <span className="text-amber font-bold">Yellow</span> = &gt;3% gap, <span className="text-red font-bold">Red</span> = &gt;5%.</div>
          <div><span className="font-bold text-t2">Q%</span> — P(Qualify) including 3rd-place. Feeds the P(2nd) engine calculation.</div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function OddsCell({ value, seed }: { value: number | null; seed: number }) {
  if (value === null) return <span className="text-xs text-t3 tabular-nums text-right">—</span>;
  const diff = value - seed;
  return (
    <div className="text-right">
      <span className="text-xs font-semibold text-t1 tabular-nums">{value.toFixed(1)}%</span>
      {Math.abs(diff) > 1 && (
        <span className={cn('text-[9px] font-bold ml-0.5 tabular-nums', diff > 0 ? 'text-green' : 'text-red')}>
          {diff > 0 ? '+' : ''}{diff.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// ── Team name matching ──────────────────────────────────────────

/** Match a team from API data to our internal teamId using the canonical name map */
function findTeamInSource(
  sourceGroup: OddsApiResponse | undefined,
  teamId: string,
): { winPct: number } | undefined {
  if (!sourceGroup?.teams?.length) return undefined;

  // Build reverse lookup: teamId → all known names
  const knownNames = new Set<string>();
  for (const [name, id] of Object.entries(spreadsheetNameToId)) {
    if (id === teamId) knownNames.add(name.toLowerCase());
  }
  // Also add our display name
  knownNames.add(getTeamName(teamId).toLowerCase());

  // Try exact match first, then partial
  for (const t of sourceGroup.teams) {
    const apiName = t.teamName.toLowerCase();
    if (knownNames.has(apiName)) return t;
  }
  for (const t of sourceGroup.teams) {
    const apiName = t.teamName.toLowerCase();
    for (const known of knownNames) {
      if (apiName.includes(known) || known.includes(apiName)) return t;
    }
  }
  return undefined;
}

function SourceCard({
  label,
  status,
  isRefetching,
  onRefetch,
}: {
  label: string;
  status: { freshness: FreshnessLevel; lastFetched: Date | null; error: string | null; teamCount: number };
  isRefetching: boolean;
  onRefetch?: () => void;
}) {
  const cfg: Record<FreshnessLevel, { dot: string; text: string }> = {
    fresh: { dot: 'bg-green', text: 'text-green' },
    stale: { dot: 'bg-amber', text: 'text-amber' },
    offline: { dot: 'bg-t3', text: 'text-t3' },
  };
  const c = cfg[status.freshness];

  return (
    <div className="flex-1 bg-s2 rounded-lg border border-b2 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className={cn('w-2 h-2 rounded-full', c.dot, isRefetching && 'animate-pulse')} />
          <span className="text-xs font-bold text-t1">{label}</span>
        </div>
        {onRefetch && (
          <button
            onClick={onRefetch}
            disabled={isRefetching}
            className="text-[9px] font-bold text-accent hover:text-accent-bright disabled:text-t3"
          >
            {isRefetching ? 'Fetching...' : 'Refresh'}
          </button>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className={cn('text-[10px] font-semibold capitalize', c.text)}>{status.freshness}</span>
        <span className="text-[10px] text-t3">{status.teamCount > 0 ? `${status.teamCount} teams` : 'No data'}</span>
      </div>
      <p className="text-[9px] text-t3 mt-1">
        {status.error ? <span className="text-red">{status.error}</span> : formatAge(status.lastFetched)}
      </p>
    </div>
  );
}
