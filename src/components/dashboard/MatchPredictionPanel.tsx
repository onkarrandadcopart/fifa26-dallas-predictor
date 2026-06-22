import { useMemo } from 'react';
import type { MatchupPrediction } from '@/engine/types';
import { teamName } from '@/engine/predictions';
import { pct } from '@/utils/format';
import { FlagImg } from '@/components/ui/FlagImg';
import { MatchupRow } from './MatchupRow';
import { dallasMatches, stageLabels } from '@/data/dallas-matches';

interface MatchPredictionPanelProps {
  matchId: string;
  matchups: MatchupPrediction[];
}

/** Hard-coded teamIds for confirmed group stage matches */
const confirmedTeams: Record<string, [string, string]> = {
  M11: ['netherlands', 'japan'],
  M21: ['england', 'croatia'],
  M43: ['argentina', 'austria'],
  M70: ['argentina', 'jordan'],
};

export function MatchPredictionPanel({ matchId, matchups }: MatchPredictionPanelProps) {
  const match = dallasMatches.find((m) => m.matchId === matchId);

  const { hero, top3Pct } = useMemo(() => {
    const h = matchups[0];
    const t3 = matchups.slice(0, 3).reduce((s, m) => s + m.combined, 0);
    return { hero: h, top3Pct: t3 };
  }, [matchups]);

  if (!match) return null;

  // ──── Group stage: confirmed teams ────
  if (match.teamsConfirmed) {
    const teams = confirmedTeams[matchId];
    if (!teams) return null;
    const [t1Name, t2Name] = match.teams.split(' vs ');

    return (
      <div>
        <PanelHeader match={match} />

        <div className="bg-s2 rounded-xl border border-b2 relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-accent/6 blur-3xl rounded-full pointer-events-none" />

          <div className="relative p-10">
            <div className="flex items-center justify-center gap-16">
              <TeamCard teamId={teams[0]} name={t1Name!} />
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-s3 border border-b3 flex items-center justify-center">
                  <span className="text-xs font-extrabold text-t3">VS</span>
                </div>
              </div>
              <TeamCard teamId={teams[1]} name={t2Name!} />
            </div>

            <div className="mt-8 text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green bg-green-dim px-4 py-2 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green" />
                Teams Confirmed — Plan client invites
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {match.notes && (
          <p className="text-[11px] text-t3 mt-3 px-1">{match.notes}</p>
        )}
      </div>
    );
  }

  // ──── Knockout: predictions ────
  if (!hero) return null;
  const maxCombined = hero.combined;

  return (
    <div>
      <PanelHeader match={match} />

      {/* ── Hero Card ── */}
      <div className="bg-s2 rounded-xl border border-b2 relative overflow-hidden mb-4">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/4 w-72 h-36 bg-accent/8 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-56 h-28 bg-accent/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative p-6">
          <p className="text-[10px] font-bold text-accent-bright uppercase tracking-[0.2em] mb-6">
            Most Likely Matchup
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Teams */}
            <div className="flex items-center gap-4 sm:gap-8">
              <div className="text-center">
                <div className="relative inline-block mb-3">
                  <FlagImg teamId={hero.team1} size="xl" className="rounded-md shadow-lg shadow-accent/10" />
                  <div className="absolute -bottom-1 -right-1 bg-s4 border border-b3 rounded px-1 py-0.5">
                    <span className="text-[9px] font-bold text-accent tabular-nums">{pct(hero.p1)}</span>
                  </div>
                </div>
                <p className="text-base font-bold text-t1">{teamName(hero.team1)}</p>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-s3 border border-b3 flex items-center justify-center">
                  <span className="text-xs font-extrabold text-t3">VS</span>
                </div>
              </div>

              <div className="text-center">
                <div className="relative inline-block mb-3">
                  <FlagImg teamId={hero.team2} size="xl" className="rounded-md shadow-lg shadow-accent/10" />
                  <div className="absolute -bottom-1 -right-1 bg-s4 border border-b3 rounded px-1 py-0.5">
                    <span className="text-[9px] font-bold text-accent tabular-nums">{pct(hero.p2)}</span>
                  </div>
                </div>
                <p className="text-base font-bold text-t1">{teamName(hero.team2)}</p>
              </div>
            </div>

            {/* Giant combined % */}
            <div className="text-right">
              <p className="text-[56px] leading-none font-extrabold text-accent-bright tabular-nums glow">
                {pct(hero.combined)}
              </p>
              <p className="text-[10px] text-t3 font-semibold mt-1.5 uppercase tracking-wider">
                Combined Probability
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="flex items-center gap-3 mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-bright" />
          <p className="text-[11px] text-t3">
            Top 3 = <span className="font-bold text-accent-bright">{pct(top3Pct)}</span>
          </p>
        </div>
        <span className="text-t3 text-[10px]">|</span>
        <p className="text-[11px] text-t3">{matchups.length} scenarios ranked</p>
      </div>

      {/* ── Matchup table ── */}
      <div className="bg-s1 rounded-xl border border-b1 overflow-hidden">
        {/* Column headers */}
        <div className="flex items-center gap-3 py-2 px-3 bg-s2/60 border-b border-b1">
          <span className="w-5 text-center text-[9px] font-bold text-t3 uppercase">#</span>
          <span className="w-[120px] text-[9px] font-bold text-t3 uppercase tracking-wider">Side 1</span>
          <span className="w-4" />
          <span className="w-[120px] text-[9px] font-bold text-t3 uppercase tracking-wider">Side 2</span>
          <span className="flex-1 text-[9px] font-bold text-t3 uppercase tracking-wider">Probability</span>
          <span className="w-14 text-right text-[9px] font-bold text-t3 uppercase tracking-wider">%</span>
        </div>

        {/* Data rows */}
        {matchups.map((m, i) => (
          <MatchupRow
            key={`${m.team1}-${m.team2}`}
            matchup={m}
            rank={i + 1}
            maxCombined={maxCombined}
          />
        ))}
      </div>
    </div>
  );
}

/** Reusable team card for hero display */
function TeamCard({ teamId, name }: { teamId: string; name: string }) {
  return (
    <div className="text-center">
      <FlagImg teamId={teamId} size="xl" className="mx-auto mb-3 rounded-md shadow-lg shadow-accent/10" />
      <p className="text-lg font-bold text-t1">{name}</p>
    </div>
  );
}

/** Panel header showing match ID, stage, date */
function PanelHeader({ match }: { match: (typeof dallasMatches)[number] }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2.5 mb-1">
        <h2 className="text-xl font-bold text-t1">{match.matchId}</h2>
        <span className="text-[10px] font-bold bg-s3 text-t3 px-2 py-0.5 rounded">
          {stageLabels[match.stage]}
        </span>
        {!match.teamsConfirmed && (
          <span className="text-xs text-t3 font-medium">{match.teams}</span>
        )}
      </div>
      <p className="text-xs text-t3">{match.displayDate} &middot; AT&T Stadium, Arlington TX</p>
    </div>
  );
}
