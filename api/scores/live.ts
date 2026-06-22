/**
 * Vercel Edge Function — Live Scores Proxy
 *
 * Fetches live match scores from football-data.org (primary)
 * and ESPN hidden API (fallback). Proxied for CORS.
 *
 * POST body:
 *   {} → returns all today's FIFA World Cup matches
 *   { date: "2026-06-14" } → returns matches for a specific date
 *   { dateFrom: "2026-06-11", dateTo: "2026-06-26" } → all matches in a date range
 *     (used by the results engine to reconstruct group standings)
 */

export const config = { runtime: 'edge' };

const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4';
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';

// FIFA World Cup 2026 competition ID on football-data.org
const WC_COMPETITION_ID = 2000;

interface LiveMatch {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed';
  minute: number | null;
  startTime: string;
  venue: string;
  stage: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const body = await req.json().catch(() => ({})) as {
      date?: string;
      dateFrom?: string;
      dateTo?: string;
    };

    // Build the list of dates to query.
    // Single date (default today) OR an inclusive [dateFrom, dateTo] range.
    const dates = body.dateFrom && body.dateTo
      ? enumerateDates(body.dateFrom, body.dateTo)
      : [body.date ?? new Date().toISOString().slice(0, 10)];

    const dateLabel = dates.length === 1 ? dates[0]! : `${dates[0]}..${dates[dates.length - 1]}`;

    // Try football-data.org first (needs free API key)
    const fdKey = process.env.FOOTBALL_DATA_API_KEY;
    if (fdKey && dates.length === 1) {
      const matches = await fetchFootballData(fdKey, dates[0]!);
      if (matches.length > 0) {
        return Response.json(
          { source: 'football-data', date: dateLabel, matches, timestamp: new Date().toISOString() },
          { status: 200, headers: { ...corsHeaders(), 'Cache-Control': 's-maxage=30' } },
        );
      }
    }

    // Fallback: ESPN hidden API (no auth needed). Query each date and merge.
    const perDay = await Promise.all(dates.map((d) => fetchESPN(d)));
    const espnMatches = perDay.flat();
    return Response.json(
      { source: 'espn', date: dateLabel, matches: espnMatches, timestamp: new Date().toISOString() },
      { status: 200, headers: { ...corsHeaders(), 'Cache-Control': 's-maxage=30' } },
    );
  } catch (err) {
    return Response.json(
      { error: String(err), matches: [] },
      { status: 500, headers: corsHeaders() },
    );
  }
}

async function fetchFootballData(apiKey: string, date: string): Promise<LiveMatch[]> {
  try {
    const url = `${FOOTBALL_DATA_BASE}/competitions/${WC_COMPETITION_ID}/matches?dateFrom=${date}&dateTo=${date}`;
    const res = await fetch(url, {
      headers: { 'X-Auth-Token': apiKey, 'Accept': 'application/json' },
    });
    if (!res.ok) return [];

    const data = await res.json() as {
      matches: {
        id: number;
        homeTeam: { name: string };
        awayTeam: { name: string };
        score: { fullTime: { home: number | null; away: number | null } };
        status: string;
        minute: number | null;
        utcDate: string;
        venue: string;
        stage: string;
      }[];
    };

    return (data.matches ?? []).map((m) => ({
      matchId: String(m.id),
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
      homeScore: m.score?.fullTime?.home ?? null,
      awayScore: m.score?.fullTime?.away ?? null,
      status: mapFDStatus(m.status),
      minute: m.minute ?? null,
      startTime: m.utcDate,
      venue: m.venue ?? '',
      stage: m.stage ?? '',
    }));
  } catch {
    return [];
  }
}

async function fetchESPN(date: string): Promise<LiveMatch[]> {
  try {
    const espnDate = date.replace(/-/g, '');
    const url = `${ESPN_BASE}/scoreboard?dates=${espnDate}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return [];

    const data = await res.json() as {
      events?: {
        id: string;
        name: string;
        competitions: {
          competitors: { team: { displayName: string }; score: string; homeAway: string }[];
          status: { type: { name: string; description: string }; displayClock: string };
          venue?: { fullName: string };
        }[];
        date: string;
      }[];
    };

    return (data.events ?? []).map((e) => {
      const comp = e.competitions[0]!;
      const home = comp.competitors.find((c) => c.homeAway === 'home');
      const away = comp.competitors.find((c) => c.homeAway === 'away');
      const statusName = comp.status?.type?.name ?? '';

      const homeName = home?.team.displayName ?? '?';
      const awayName = away?.team.displayName ?? '?';

      return {
        matchId: e.id,
        homeTeam: homeName,
        awayTeam: awayName,
        homeScore: home?.score ? parseInt(home.score) : null,
        awayScore: away?.score ? parseInt(away.score) : null,
        status: mapESPNStatus(statusName),
        minute: null,
        startTime: e.date,
        venue: comp.venue?.fullName ?? '',
        // ESPN doesn't reliably expose group; the results engine derives it
        // from team membership, so stage is left blank here.
        stage: '',
      };
    });
  } catch {
    return [];
  }
}

function mapFDStatus(s: string): LiveMatch['status'] {
  switch (s) {
    case 'IN_PLAY': return 'live';
    case 'PAUSED': return 'halftime';
    case 'FINISHED': return 'finished';
    case 'POSTPONED': return 'postponed';
    default: return 'scheduled';
  }
}

function mapESPNStatus(s: string): LiveMatch['status'] {
  switch (s) {
    case 'STATUS_IN_PROGRESS':
    case 'STATUS_FIRST_HALF':
    case 'STATUS_SECOND_HALF':
      return 'live';
    case 'STATUS_HALFTIME':
      return 'halftime';
    // ESPN soccer uses STATUS_FULL_TIME for finished matches (not STATUS_FINAL).
    case 'STATUS_FULL_TIME':
    case 'STATUS_FINAL':
      return 'finished';
    case 'STATUS_POSTPONED':
    case 'STATUS_CANCELED':
      return 'postponed';
    default:
      return 'scheduled';
  }
}

/** Enumerate inclusive date range [from, to] as YYYY-MM-DD strings (capped at 60 days). */
function enumerateDates(from: string, to: string): string[] {
  const out: string[] = [];
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return [from];
  const cur = new Date(start);
  let guard = 0;
  while (cur <= end && guard < 60) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
    guard++;
  }
  return out;
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
