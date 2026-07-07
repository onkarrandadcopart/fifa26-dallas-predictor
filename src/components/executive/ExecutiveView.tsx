import { SOURCE_LABELS } from '@/api/data-source';
import { useLivePredictions } from '@/engine/useLivePredictions';
import { teamName } from '@/engine/predictions';
import type { MatchupPrediction } from '@/engine/types';
import { dallasMatches, stageLabels } from '@/data/dallas-matches';
import { STAR_POWER_TIER1, STAR_POWER_TIER2 } from '@/data/teams';
import { pct } from '@/utils/format';
import { FlagImg } from '@/components/ui/FlagImg';
import { cn } from '@/lib/utils';

const CONFIRMED_IDS: Record<string, string[]> = {
  M11: ['netherlands', 'japan'],
  M21: ['england', 'croatia'],
  M43: ['argentina', 'austria'],
  M70: ['argentina', 'jordan'],
  M78: ['ivory_coast', 'norway'],
  M88: ['australia', 'egypt'],
  M93: ['portugal', 'spain'],
};

function isStar(id: string): boolean {
  return STAR_POWER_TIER1.includes(id) || STAR_POWER_TIER2.includes(id);
}

/** Get unique star-power teams from confirmed teams or top 3 predictions */
function getStars(confirmedIds: string[] | null, matchups: MatchupPrediction[] | null): string[] {
  if (confirmedIds) return confirmedIds.filter(isStar);
  if (!matchups || matchups.length === 0) return [];
  const stars = new Set<string>();
  for (const m of matchups.slice(0, 3)) {
    if (isStar(m.team1)) stars.add(m.team1);
    if (isStar(m.team2)) stars.add(m.team2);
  }
  return [...stars];
}

export function ExecutiveView() {
  const { predictions, resolved } = useLivePredictions();

  const dataSourceLabel = resolved ? SOURCE_LABELS[resolved.source].label : 'Loading';
  const dataTimestamp = resolved
    ? resolved.timestamp.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })
    : new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });

  function getMatchups(matchId: string): MatchupPrediction[] | null {
    const lookup: Record<string, MatchupPrediction[]> = {
      M78: predictions.m78, M88: predictions.m88,
      M93: predictions.m93, M101: predictions.m101Matchups,
    };
    return lookup[matchId] ?? null;
  }

  return (
    <div className="max-w-5xl mx-auto exec-page">
      {/* Header */}
      <div className="text-center pb-6 mb-6 border-b border-b2 print:border-black/10">
        <div className="flex items-center justify-center gap-3 mb-3">
          <img src="/copart-logo.png" alt="Copart" className="h-10 w-auto" />
        </div>
        <h1 className="text-3xl font-extrabold text-t1 print:text-black">
          Dallas FIFA Entertainment Brief
        </h1>
        <p className="text-sm text-t2 mt-2 print:text-gray-600">
          8 matches at AT&T Stadium &middot; FIFA World Cup 2026 &middot; Copart Client Hospitality
        </p>
        <p className="text-[10px] text-t3 mt-1 print:text-gray-400">
          {dataSourceLabel} &middot; {dataTimestamp}
        </p>
      </div>

      {/* Timeline Matches */}
      <div className="space-y-3 mb-8">
        {dallasMatches.map((match) => {
          const matchups = getMatchups(match.matchId);
          const top = matchups?.[0] ?? null;
          const top3 = matchups?.slice(0, 3) ?? [];
          const confirmedIds = CONFIRMED_IDS[match.matchId] ?? null;
          const stars = getStars(confirmedIds, matchups);

          return (
            <div
              key={match.matchId}
              className="bg-s2 rounded-xl border border-b2 overflow-hidden print:bg-white print:border-gray-200"
            >
              <div className="p-4">
                {/* Row 1: meta */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-accent print:text-blue-600 tabular-nums">
                      {match.matchId}
                    </span>
                    <span className="text-[10px] font-bold bg-s3 text-t3 px-1.5 py-0.5 rounded print:bg-gray-100 print:text-gray-500">
                      {stageLabels[match.stage]}
                    </span>
                    <span className="text-xs text-t3 print:text-gray-400">
                      {match.displayDate}
                    </span>
                  </div>
                </div>

                {/* Row 2: teams */}
                {match.teamsConfirmed && confirmedIds ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <FlagImg teamId={confirmedIds[0]!} size="md" />
                        <span className="text-base font-bold text-t1 print:text-black">
                          {teamName(confirmedIds[0]!)}
                        </span>
                      </div>
                      <span className="text-xs text-t3 font-semibold">vs</span>
                      <div className="flex items-center gap-2">
                        <FlagImg teamId={confirmedIds[1]!} size="md" />
                        <span className="text-base font-bold text-t1 print:text-black">
                          {teamName(confirmedIds[1]!)}
                        </span>
                      </div>
                    </div>
                    {match.result ? (
                      <span className="text-sm font-extrabold text-t1 tabular-nums bg-s3 px-2 py-1 rounded print:text-black">
                        {match.result} <span className="text-[10px] font-bold text-t3 ml-1">FT</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-green bg-green-dim px-2 py-1 rounded-full print:bg-green-50 print:text-green-700">
                        Confirmed
                      </span>
                    )}
                  </div>
                ) : top ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <FlagImg teamId={top.team1} size="md" />
                          <span className="text-base font-bold text-t1 print:text-black">
                            {teamName(top.team1)}
                          </span>
                        </div>
                        <span className="text-xs text-t3 font-semibold">vs</span>
                        <div className="flex items-center gap-2">
                          <FlagImg teamId={top.team2} size="md" />
                          <span className="text-base font-bold text-t1 print:text-black">
                            {teamName(top.team2)}
                          </span>
                        </div>
                      </div>
                      <span className="text-xl font-extrabold text-accent-bright tabular-nums print:text-blue-600">
                        {pct(top.combined)}
                      </span>
                    </div>

                    {top3.length > 1 && (
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[9px] font-bold text-t3 uppercase tracking-wider">Also:</span>
                        {top3.slice(1).map((m, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <FlagImg teamId={m.team1} size="xs" />
                            <FlagImg teamId={m.team2} size="xs" />
                            <span className="text-[10px] text-t3">
                              {teamName(m.team1)} vs {teamName(m.team2)}
                            </span>
                            <span className="text-[10px] font-bold text-t2 tabular-nums">
                              {pct(m.combined)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-t3">{match.teams}</p>
                )}

                {/* Star power tags */}
                {stars.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {stars.map((id) => (
                      <div key={id} className="flex items-center gap-1 bg-s3 rounded px-1.5 py-0.5 print:bg-gray-100">
                        <FlagImg teamId={id} size="xs" />
                        <span className="text-[10px] font-semibold text-t2 print:text-gray-700">
                          {teamName(id)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Semifinal Spotlight */}
      <div className="bg-s2 rounded-xl border border-b2 p-6 mb-6 print:bg-white print:border-gray-200">
        <h3 className="text-sm font-bold text-t1 mb-1 print:text-black">
          Semifinal Spotlight — M101 — Jul 14
        </h3>
        <p className="text-[10px] text-t3 mb-4 print:text-gray-400">
          Top teams by probability of reaching the AT&T Stadium semifinal
        </p>
        <div className="grid grid-cols-5 gap-3">
          {predictions.m101Predictions.slice(0, 5).map((p, i) => (
            <div
              key={p.teamId}
              className={cn(
                'text-center rounded-lg py-3 px-2 print:border print:border-gray-200',
                i === 0 ? 'bg-accent/10 ring-1 ring-accent/20' : 'bg-s3',
              )}
            >
              <FlagImg teamId={p.teamId} size="lg" className="mx-auto mb-2" />
              <p className="text-xs font-bold text-t1 print:text-black">{teamName(p.teamId)}</p>
              <p className="text-lg font-extrabold text-accent-bright tabular-nums print:text-blue-600">
                {pct(p.pSemifinal)}
              </p>
              <p className="text-[9px] text-t3 print:text-gray-400">
                P(Final): {pct(p.pFinal)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Risks */}
      <div className="bg-amber-dim border border-amber/20 rounded-xl p-5 mb-6 print:bg-yellow-50 print:border-yellow-300">
        <h3 className="text-xs font-bold text-amber mb-3 print:text-yellow-800">Key Risks &amp; Watch Items</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {[
            { match: 'M43/M70', risk: 'If Argentina doesn\'t advance from Group J, two Dallas matches lose their headliner' },
            { match: 'M78', risk: 'Germany or France finishing 2nd would make this a premium R32 match — monitor Group E/I closely' },
            { match: 'M88', risk: 'USA finishing 2nd in Group D would drive domestic client interest significantly' },
            { match: 'M93', risk: 'Two-layer prediction (depends on M83 + M84 results Jul 4) — highest uncertainty of all Dallas matches' },
            { match: 'M101', risk: 'Semifinal is the crown jewel regardless of teams — but a top-6 team makes it unforgettable' },
            { match: 'General', risk: 'Prediction market odds can shift 5-10% on injury news or friendlies — re-run this brief monthly' },
          ].map((item, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-[10px] font-bold text-amber shrink-0 w-14 print:text-yellow-700">{item.match}</span>
              <p className="text-[10px] text-amber/80 print:text-yellow-700">{item.risk}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8 border-t border-b2 pt-4 print:border-gray-200">
        <p className="text-[9px] text-t3 print:text-gray-400">
          Copart FIFA 26 Dallas Predictor &middot; Data from Kalshi &amp; Polymarket prediction markets &middot; Probabilities are estimates, not guarantees
        </p>
        <p className="text-[9px] text-t3 mt-0.5 print:text-gray-400">
          March 2026 &middot; For internal Copart use only
        </p>
      </div>
    </div>
  );
}
