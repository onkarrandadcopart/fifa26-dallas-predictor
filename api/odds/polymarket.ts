/**
 * Vercel Edge Function — Polymarket Gamma API Proxy
 *
 * PUBLIC API — no auth needed. Proxy for CORS only.
 *
 * Base URL: https://gamma-api.polymarket.com
 *
 * Verified live slugs (Mar 2026):
 *   Group winners:   fifa-world-cup-group-{d..l}-winner
 *   Tournament:      2026-fifa-world-cup-winner-595
 *   Qualifying:      2026-fifa-world-cup-which-countries-qualify
 *
 * Response shape: each event has a markets[] array, each market has:
 *   question:       "Will Germany win Group E in the 2026 FIFA World Cup?"
 *   outcomePrices:  ["0.72", "0.28"]  (JSON string or array, Yes/No)
 *   outcomes:       ["Yes", "No"]
 *   volume:         5495.03
 *
 * POST body:
 *   { group: "E" }              → group winner odds
 *   { market: "tournament" }    → tournament winner odds
 *   { market: "qualifying" }    → qualifying odds (feeds Q% input)
 */

export const config = { runtime: 'edge' };

const GAMMA_BASE = 'https://gamma-api.polymarket.com';

interface PolyMarket {
  question: string;
  outcomePrices: string | string[];
  outcomes: string[];
  volume: number;
  active: boolean;
}

interface PolyEvent {
  markets: PolyMarket[];
}

interface NormalizedTeam {
  teamName: string;
  yesPrice: number;
  winPct: number;
  volume: number;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const body = await req.json().catch(() => ({})) as {
      group?: string;
      market?: 'group_winner' | 'tournament' | 'qualifying';
    };
    const marketType = body.market ?? 'group_winner';

    switch (marketType) {
      case 'tournament':
        return await fetchBySlug('2026-fifa-world-cup-winner-595', 'ALL', 'tournament_winner');
      case 'qualifying':
        return await fetchBySlug('2026-fifa-world-cup-which-countries-qualify', 'ALL', 'qualifying');
      default: {
        const group = (body.group ?? 'E').toLowerCase();
        return await fetchBySlug(`fifa-world-cup-group-${group}-winner`, group.toUpperCase(), 'group_winner');
      }
    }
  } catch (err) {
    return Response.json(
      { error: String(err), source: 'polymarket', teams: [] },
      { status: 500, headers: corsHeaders() },
    );
  }
}

async function fetchBySlug(slug: string, group: string, marketLabel: string): Promise<Response> {
  const url = `${GAMMA_BASE}/events?slug=${slug}`;

  let markets: PolyMarket[] = [];
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = (await res.json()) as PolyEvent[];
      markets = data?.[0]?.markets ?? [];
    } else {
      const text = await res.text().catch(() => '');
      return Response.json(
        { error: `Polymarket API ${res.status}: ${text.slice(0, 200)}`, source: 'polymarket', teams: [] },
        { status: 200, headers: corsHeaders() },
      );
    }
  } catch (err) {
    return Response.json(
      { error: `Fetch failed: ${err}`, source: 'polymarket', teams: [] },
      { status: 200, headers: corsHeaders() },
    );
  }

  if (markets.length === 0) {
    return Response.json(
      { source: 'polymarket', group, market: marketLabel, timestamp: new Date().toISOString(), teams: [], error: `No markets for slug: ${slug}` },
      { status: 200, headers: { ...corsHeaders(), 'Cache-Control': 's-maxage=60' } },
    );
  }

  // Parse each market's Yes price and extract team name from question
  const teams: NormalizedTeam[] = [];

  for (const m of markets) {
    const prices = typeof m.outcomePrices === 'string'
      ? JSON.parse(m.outcomePrices) as string[]
      : m.outcomePrices;

    if (!prices || prices.length === 0) continue;

    const yesPrice = Math.round(parseFloat(prices[0]!) * 100);
    if (yesPrice <= 0) continue;

    const teamName = extractTeamFromQuestion(m.question, marketLabel);

    teams.push({
      teamName,
      yesPrice,
      winPct: 0, // will normalize below
      volume: m.volume ?? 0,
    });
  }

  // Vig removal: normalize to 100%
  const totalYes = teams.reduce((s, t) => s + t.yesPrice, 0);
  for (const t of teams) {
    t.winPct = totalYes > 0 ? (t.yesPrice / totalYes) * 100 : 0;
  }

  teams.sort((a, b) => b.yesPrice - a.yesPrice);

  return Response.json(
    {
      source: 'polymarket', group, market: marketLabel,
      timestamp: new Date().toISOString(),
      teams,
      totalVolume: teams.reduce((s, t) => s + t.volume, 0),
      marketCount: markets.length,
    },
    { status: 200, headers: { ...corsHeaders(), 'Cache-Control': 's-maxage=300' } },
  );
}

/** Extract team name from Polymarket question text */
function extractTeamFromQuestion(question: string, marketType: string): string {
  // "Will Germany win Group E in the 2026 FIFA World Cup?" → "Germany"
  // "Will Spain win the 2026 FIFA World Cup?" → "Spain"
  // "Will Colombia qualify for the 2026 FIFA World Cup?" → "Colombia"
  const patterns = [
    /^Will (.+?) win Group [A-L]/i,
    /^Will (.+?) win the 2026/i,
    /^Will (.+?) qualify for/i,
    /^Will (.+?) (?:win|reach|qualify)/i,
  ];
  for (const p of patterns) {
    const match = question.match(p);
    if (match?.[1]) return match[1];
  }
  // Fallback: return the full question trimmed
  return question.replace(/\?$/, '').trim();
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
