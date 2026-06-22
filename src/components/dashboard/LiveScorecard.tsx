import { useQuery } from '@tanstack/react-query';
import { FlagImg } from '@/components/ui/FlagImg';
import { cn } from '@/lib/utils';

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
}

interface LiveScoresResponse {
  source: string;
  date: string;
  matches: LiveMatch[];
  timestamp: string;
}

/** Map display names to our teamIds for flags */
const TEAM_NAME_TO_ID: Record<string, string> = {
  'Netherlands': 'netherlands', 'Japan': 'japan', 'England': 'england',
  'Croatia': 'croatia', 'Argentina': 'argentina', 'Austria': 'austria',
  'Jordan': 'jordan', 'Germany': 'germany', 'Ecuador': 'ecuador',
  'Ivory Coast': 'ivory_coast', 'Curaçao': 'curacao', 'Curacao': 'curacao',
  'Belgium': 'belgium', 'Egypt': 'egypt', 'Iran': 'iran',
  'New Zealand': 'new_zealand', 'Spain': 'spain', 'Uruguay': 'uruguay',
  'Saudi Arabia': 'saudi_arabia', 'Cape Verde': 'cape_verde',
  'France': 'france', 'Senegal': 'senegal', 'Norway': 'norway', 'Iraq': 'iraq_i',
  'Portugal': 'portugal', 'Colombia': 'colombia', 'Uzbekistan': 'uzbekistan',
  'Congo DR': 'congo_dr_k', 'DR Congo': 'congo_dr_k', 'DRC': 'congo_dr_k',
  'Ghana': 'ghana', 'Panama': 'panama', 'Algeria': 'algeria',
  'United States': 'united_states_d', 'USA': 'united_states_d',
  'Paraguay': 'paraguay', 'Australia': 'australia',
  'Türkiye': 'turkiye_d', 'Turkiye': 'turkiye_d', 'Turkey': 'turkiye_d',
  'Brazil': 'brazil', 'Mexico': 'mexico', 'Morocco': 'morocco',
};

function teamId(name: string): string {
  return TEAM_NAME_TO_ID[name] ?? name.toLowerCase().replace(/ /g, '_');
}

async function fetchLiveScores(): Promise<LiveScoresResponse> {
  try {
    const res = await fetch('/api/scores/live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!res.ok) return { source: 'none', date: '', matches: [], timestamp: '' };
    return (await res.json()) as LiveScoresResponse;
  } catch {
    return { source: 'none', date: '', matches: [], timestamp: '' };
  }
}

export function LiveScorecard() {
  const { data, isLoading } = useQuery({
    queryKey: ['liveScores'],
    queryFn: fetchLiveScores,
    refetchInterval: 30_000, // every 30 seconds during live matches
    staleTime: 15_000,
  });

  const matches = data?.matches ?? [];
  const hasLive = matches.some((m) => m.status === 'live' || m.status === 'halftime');

  if (isLoading) {
    return (
      <div className="bg-s2 rounded-xl border border-b2 p-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-t3 animate-pulse" />
          <span className="text-xs text-t3">Checking for live matches...</span>
        </div>
      </div>
    );
  }

  if (matches.length === 0) return null;

  return (
    <div className="bg-s2 rounded-xl border border-b2 overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-b1 bg-s3/50">
        <div className="flex items-center gap-2">
          {hasLive && <div className="w-2 h-2 rounded-full bg-red animate-pulse" />}
          <span className="text-xs font-bold text-t1">
            {hasLive ? 'LIVE' : "Today's Matches"}
          </span>
        </div>
        <span className="text-[9px] text-t3">
          {data?.source ?? ''} &middot; Updates every 30s
        </span>
      </div>

      {/* Match cards */}
      <div className="divide-y divide-b1">
        {matches.map((m) => (
          <div key={m.matchId} className={cn(
            'flex items-center gap-4 px-4 py-3',
            (m.status === 'live' || m.status === 'halftime') && 'bg-red-dim',
          )}>
            {/* Home team */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="text-sm font-bold text-t1 text-right">{m.homeTeam}</span>
              <FlagImg teamId={teamId(m.homeTeam)} size="sm" />
            </div>

            {/* Score */}
            <div className="flex items-center gap-1.5 w-24 justify-center">
              {m.status === 'scheduled' ? (
                <span className="text-xs text-t3">
                  {new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                <>
                  <span className="text-2xl font-extrabold text-t1 tabular-nums w-8 text-right">
                    {m.homeScore ?? '-'}
                  </span>
                  <span className="text-xs text-t3 font-bold">:</span>
                  <span className="text-2xl font-extrabold text-t1 tabular-nums w-8">
                    {m.awayScore ?? '-'}
                  </span>
                </>
              )}
            </div>

            {/* Away team */}
            <div className="flex items-center gap-2 flex-1">
              <FlagImg teamId={teamId(m.awayTeam)} size="sm" />
              <span className="text-sm font-bold text-t1">{m.awayTeam}</span>
            </div>

            {/* Status badge */}
            <div className="w-16 text-right">
              <StatusBadge status={m.status} minute={m.minute} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status, minute }: { status: LiveMatch['status']; minute: number | null }) {
  switch (status) {
    case 'live':
      return (
        <span className="text-[10px] font-bold text-red bg-red-dim px-2 py-0.5 rounded-full">
          {minute ? `${minute}'` : 'LIVE'}
        </span>
      );
    case 'halftime':
      return <span className="text-[10px] font-bold text-amber bg-amber-dim px-2 py-0.5 rounded-full">HT</span>;
    case 'finished':
      return <span className="text-[10px] font-bold text-green bg-green-dim px-2 py-0.5 rounded-full">FT</span>;
    case 'postponed':
      return <span className="text-[10px] font-bold text-t3 bg-s3 px-2 py-0.5 rounded-full">PPD</span>;
    default:
      return null;
  }
}
