/**
 * Vercel Edge Function — Kalshi API Proxy
 *
 * PUBLIC endpoint (no auth). Proxied for CORS.
 * Base: https://api.elections.kalshi.com/trade-api/v2
 *
 * Series:
 *   KXWCGROUPWIN  — Group winner (W%)
 *   KXWCGROUPQUAL — Group qualifiers (Q%) ← NEW from CEO's model
 *   KXMENWORLDCUP — Tournament winner
 *   KXWCROUND     — Reach round (QF/SF)
 *
 * Prices: Prefers yes_bid_dollars/yes_ask_dollars midpoint (new API).
 *         Falls back to last_price cents (deprecated Jan 15 2026).
 * Pagination: Cursor-based to fetch ALL markets in a series.
 *
 * POST body:
 *   { group: "E" }                          → group winner W%
 *   { group: "E", market: "qualifying" }    → group qualifying Q%
 *   { market: "tournament" }                → tournament winner
 *   { market: "reach_round" }               → reach semifinal
 */

export const config = { runtime: 'edge' };

const KALSHI_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

const SERIES = {
  GROUP_WIN: 'KXWCGROUPWIN',
  GROUP_QUAL: 'KXWCGROUPQUAL',
  TOURNAMENT: 'KXMENWORLDCUP',
  REACH_ROUND: 'KXWCROUND',
};

interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  subtitle: string;
  yes_sub_title: string;
  // Dollar-string fields (current API — preferred)
  yes_bid_dollars?: string;
  yes_ask_dollars?: string;
  last_price_dollars?: string;
  // Integer cent fields (deprecated Jan 15 2026 — fallback)
  last_price: number;
  yes_bid: number;
  yes_ask: number;
  volume: number;
  volume_24h: number;
  open_interest: number;
  status: string;
}

interface NormalizedTeam {
  teamName: string;
  yesPrice: number;    // cents 0-100
  winPct: number;      // vig-removed %
  volume: number;
  volume24h: number;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const body = await req.json().catch(() => ({})) as {
      group?: string;
      market?: 'group_winner' | 'qualifying' | 'tournament' | 'reach_round';
    };
    const marketType = body.market ?? 'group_winner';
    const group = (body.group ?? 'E').toUpperCase();

    switch (marketType) {
      case 'tournament':
        return await fetchAndNormalize(SERIES.TOURNAMENT, null, 'ALL', 'tournament_winner');
      case 'reach_round':
        return await fetchAndNormalize(SERIES.REACH_ROUND, `${SERIES.REACH_ROUND}-26SEMI`, 'ALL', 'reach_semifinal');
      case 'qualifying':
        return await fetchAndNormalize(SERIES.GROUP_QUAL, `${SERIES.GROUP_QUAL}-26${group}`, group, 'qualifying');
      default:
        return await fetchAndNormalize(SERIES.GROUP_WIN, `${SERIES.GROUP_WIN}-26${group}`, group, 'group_winner');
    }
  } catch (err) {
    return Response.json(
      { error: String(err), source: 'kalshi', teams: [] },
      { status: 500, headers: corsHeaders() },
    );
  }
}

// ── Fetch with cursor pagination ────────────────────────────────

async function fetchAllMarkets(
  seriesTicker: string,
  eventTicker: string | null,
): Promise<KalshiMarket[]> {
  const allMarkets: KalshiMarket[] = [];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({ limit: '200' });
    if (eventTicker) params.set('event_ticker', eventTicker);
    else params.set('series_ticker', seriesTicker);
    if (cursor) params.set('cursor', cursor);

    const res = await fetch(`${KALSHI_BASE}/markets?${params}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) break;

    const data = (await res.json()) as { markets: KalshiMarket[]; cursor?: string };
    allMarkets.push(...(data.markets ?? []));
    cursor = data.cursor || undefined;
  } while (cursor);

  return allMarkets;
}

// ── Normalize and respond ───────────────────────────────────────

async function fetchAndNormalize(
  seriesTicker: string,
  eventTicker: string | null,
  group: string,
  marketLabel: string,
): Promise<Response> {
  let mkts: KalshiMarket[];
  try {
    mkts = await fetchAllMarkets(seriesTicker, eventTicker);
  } catch (err) {
    return Response.json(
      { error: `Fetch failed: ${err}`, source: 'kalshi', teams: [] },
      { status: 200, headers: corsHeaders() },
    );
  }

  const active = mkts.filter((m) => m.status === 'active');

  if (active.length === 0) {
    return Response.json(
      {
        source: 'kalshi', group, market: marketLabel,
        timestamp: new Date().toISOString(), teams: [],
        error: `No active markets (series: ${seriesTicker}, event: ${eventTicker ?? 'all'}, total: ${mkts.length})`,
      },
      { status: 200, headers: { ...corsHeaders(), 'Cache-Control': 's-maxage=60' } },
    );
  }

  // Extract price — prefer dollar strings, fallback to cents
  const priced = active.map((m) => ({ ...m, price: getPrice(m) }));

  // Normalization depends on market type:
  // - Group winner / tournament = multi-outcome pool → normalize to 100% (vig removal)
  // - Qualifying = independent yes/no contracts → use last_price (not midpoint) as direct %
  //   Qualifying markets are extremely illiquid — bid-ask spreads of 50¢+.
  //   last_price (last trade) is far more reliable than midpoint for these.
  const isIndependent = marketLabel === 'qualifying';

  // For qualifying, re-extract price preferring last_price over midpoint
  const finalPriced = isIndependent
    ? active.map((m) => ({ ...m, price: getQualifyingPrice(m) }))
    : priced;

  const totalPrice = finalPriced.reduce((s, m) => s + m.price, 0);

  const teams: NormalizedTeam[] = finalPriced
    .filter((m) => m.price > 0)
    .map((m) => ({
      teamName: m.yes_sub_title || m.subtitle || m.title || m.ticker.split('-').pop() || m.ticker,
      yesPrice: m.price,
      winPct: isIndependent
        ? m.price  // Raw cents = direct percentage for independent yes/no contracts
        : (totalPrice > 0 ? (m.price / totalPrice) * 100 : 0),  // Normalized for multi-outcome
      volume: m.volume ?? 0,
      volume24h: m.volume_24h ?? 0,
    }))
    .sort((a, b) => b.yesPrice - a.yesPrice);

  return Response.json(
    {
      source: 'kalshi', group, market: marketLabel,
      timestamp: new Date().toISOString(), teams,
      totalVolume: active.reduce((s, m) => s + (m.volume ?? 0), 0),
      marketCount: active.length,
    },
    { status: 200, headers: { ...corsHeaders(), 'Cache-Control': 's-maxage=300' } },
  );
}

// ── Price extraction (dollar-strings first, cents fallback) ─────

function getPrice(m: KalshiMarket): number {
  // Prefer dollar-string fields (current Kalshi API)
  const bidStr = m.yes_bid_dollars;
  const askStr = m.yes_ask_dollars;
  if (bidStr && askStr) {
    const bid = parseFloat(bidStr);
    const ask = parseFloat(askStr);
    if (!isNaN(bid) && !isNaN(ask) && (bid + ask) > 0) {
      return Math.round(((bid + ask) / 2) * 100);
    }
  }

  // Try last_price_dollars
  const lastStr = m.last_price_dollars;
  if (lastStr) {
    const last = parseFloat(lastStr);
    if (!isNaN(last) && last > 0) return Math.round(last * 100);
  }

  // Legacy fallback: integer cent fields
  if (m.last_price > 0) return m.last_price;
  if (m.yes_bid > 0) return m.yes_bid;
  if (m.yes_ask > 0) return m.yes_ask;
  return 0;
}

/**
 * Price for qualifying (independent yes/no) markets.
 * Prefers last_price over midpoint because these markets are extremely
 * illiquid — bid-ask spreads of 50¢+ make midpoint meaningless.
 * Example: Germany qualifying bid=0.45, ask=0.97, last=0.97 → use 97.
 */
function getQualifyingPrice(m: KalshiMarket): number {
  // Prefer last_price_dollars (most recent actual trade)
  const lastStr = m.last_price_dollars;
  if (lastStr) {
    const last = parseFloat(lastStr);
    if (!isNaN(last) && last > 0) return Math.round(last * 100);
  }
  // Legacy last_price cents
  if (m.last_price > 0) return m.last_price;
  // Fallback to midpoint only if no trades exist
  return getPrice(m);
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
