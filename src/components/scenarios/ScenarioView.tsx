import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { computeAllPredictions, teamName } from '@/engine/predictions';
import { initialGroupOdds } from '@/data/initial-odds';
import { FlagImg } from '@/components/ui/FlagImg';
import { pct } from '@/utils/format';
import { useScenarioStore } from '@/store/scenario-store';
import type { GroupId, TeamMarketInputs, MatchupPrediction } from '@/engine/types';
import { cn } from '@/lib/utils';

const GROUPS: GroupId[] = ['D', 'E', 'G', 'H', 'I', 'J', 'K', 'L'];
const DALLAS_MATCHES = ['M78', 'M88', 'M93', 'M101'];

const GROUP_FEEDS: Record<string, string> = {
  D: 'M88 (2D side)', E: 'M78 (2E side)', G: 'M88 (2G side)', H: 'M84 (1H) \u2192 M93',
  I: 'M78 (2I side)', J: 'M84 (2J) \u2192 M93', K: 'M83 (2K) \u2192 M93', L: 'M83 (2L) \u2192 M93',
};

interface LockedTeam { teamId: string; position: 1 | 2; }
type Locks = Record<string, LockedTeam[]>;

// ── URL encode/decode ───────────────────────────────────────────

function encodeLocks(locks: Locks): string {
  const parts: string[] = [];
  for (const [group, ls] of Object.entries(locks)) {
    for (const l of ls) parts.push(`${group}:${l.teamId}:${l.position}`);
  }
  return parts.join(',');
}

function decodeLocks(param: string): Locks {
  const locks: Locks = {};
  for (const part of param.split(',')) {
    const [group, teamId, pos] = part.split(':');
    if (!group || !teamId || !pos) continue;
    if (!locks[group]) locks[group] = [];
    locks[group].push({ teamId, position: parseInt(pos) as 1 | 2 });
  }
  return locks;
}

// ── Component ───────────────────────────────────────────────────

export function ScenarioView() {
  const { scenarios, saveScenario, deleteScenario, activateScenario, activeScenarioId } = useScenarioStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [locks, setLocks] = useState<Locks>({});
  const [scenarioName, setScenarioName] = useState('');
  const [copied, setCopied] = useState(false);

  // Load from URL on mount
  useEffect(() => {
    const param = searchParams.get('s');
    if (param) setLocks(decodeLocks(param));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const basePredictions = useMemo(() => computeAllPredictions(), []);

  const modifiedOdds = useMemo((): TeamMarketInputs[] => {
    return initialGroupOdds.map((o) => {
      const groupLocks = locks[o.group] ?? [];
      const lock = groupLocks.find((l) => l.teamId === o.teamId);
      if (lock) {
        if (lock.position === 1) return { ...o, winPct: 99, qualifyPct: 100 };
        if (lock.position === 2) return { ...o, winPct: 1, qualifyPct: 100 };
      }
      const otherLock1 = groupLocks.find((l) => l.position === 1 && l.teamId !== o.teamId);
      if (otherLock1) {
        const groupTeams = initialGroupOdds.filter((t) => t.group === o.group && t.teamId !== otherLock1.teamId);
        const myShare = o.winPct / groupTeams.reduce((s, t) => s + t.winPct, 0);
        return { ...o, winPct: 1 * myShare };
      }
      return o;
    });
  }, [locks]);

  const scenarioPredictions = useMemo(() => computeAllPredictions(modifiedOdds), [modifiedOdds]);
  const hasLocks = Object.values(locks).some((l) => l.length > 0);

  const toggleLock = useCallback((group: string, teamId: string, position: 1 | 2) => {
    setLocks((prev) => {
      const current = prev[group] ?? [];
      const existing = current.find((l) => l.teamId === teamId);
      if (existing?.position === position) {
        return { ...prev, [group]: current.filter((l) => l.teamId !== teamId) };
      }
      const filtered = current.filter((l) => l.teamId !== teamId && l.position !== position);
      return { ...prev, [group]: [...filtered, { teamId, position }] };
    });
    activateScenario(null);
  }, [activateScenario]);

  const clearAll = useCallback(() => {
    setLocks({});
    activateScenario(null);
    setSearchParams({});
  }, [activateScenario, setSearchParams]);

  const loadScenario = useCallback((scenario: typeof scenarios[0]) => {
    const newLocks: Locks = {};
    for (const [group, positions] of Object.entries(scenario.lockedPositions)) {
      newLocks[group] = positions.map((p) => ({ teamId: p.teamId, position: p.position as 1 | 2 }));
    }
    setLocks(newLocks);
    activateScenario(scenario.id);
  }, [activateScenario]);

  const handleSave = useCallback(() => {
    if (!scenarioName.trim()) return;
    saveScenario({
      id: Date.now().toString(),
      name: scenarioName.trim(),
      createdAt: new Date(),
      lockedPositions: Object.fromEntries(
        Object.entries(locks).map(([g, ls]) => [g, ls.map((l) => ({ teamId: l.teamId, position: l.position as 1 | 2 | 3 | 4 }))])
      ),
    });
    setScenarioName('');
  }, [scenarioName, locks, saveScenario]);

  const handleShare = useCallback(() => {
    const encoded = encodeLocks(locks);
    const url = `${window.location.origin}/scenarios?s=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [locks]);

  function getMatchDelta(matchId: string) {
    const bMap: Record<string, MatchupPrediction[]> = { M78: basePredictions.m78, M88: basePredictions.m88, M93: basePredictions.m93, M101: basePredictions.m101Matchups };
    const sMap: Record<string, MatchupPrediction[]> = { M78: scenarioPredictions.m78, M88: scenarioPredictions.m88, M93: scenarioPredictions.m93, M101: scenarioPredictions.m101Matchups };
    return { base: bMap[matchId]?.[0], scenario: sMap[matchId]?.[0] };
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-t1">Scenario Modeler</h2>
          <p className="text-xs text-t3 mt-0.5">Lock teams into positions. See instant impact on all Dallas knockout matches.</p>
        </div>
        <div className="flex items-center gap-2">
          {hasLocks && (
            <>
              <button onClick={handleShare} className="text-[10px] font-bold text-accent hover:text-accent-bright">
                {copied ? 'Copied!' : 'Share Link'}
              </button>
              <button onClick={clearAll} className="text-[10px] font-bold text-red hover:text-red/80">
                Reset to Live
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-5">
        {/* Left: Groups */}
        <div className="flex-1 space-y-3">
          {GROUPS.map((group) => {
            const teams = initialGroupOdds.filter((o) => o.group === group);
            const groupLocks = locks[group] ?? [];
            const scenarioProbs = scenarioPredictions.groups[group] ?? [];

            return (
              <div key={group} className="bg-s2 rounded-xl border border-b2 overflow-hidden">
                <div className="px-4 py-2 bg-s3/50 border-b border-b1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-accent">Group {group}</span>
                    <span className="text-[9px] text-t3">{GROUP_FEEDS[group]}</span>
                  </div>
                  {groupLocks.length > 0 && (
                    <span className="text-[9px] font-bold text-amber bg-amber-dim px-1.5 py-0.5 rounded">
                      {groupLocks.length} locked
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  {teams.map((t) => {
                    const lock = groupLocks.find((l) => l.teamId === t.teamId);
                    const sp = scenarioProbs.find((p) => p.teamId === t.teamId);
                    return (
                      <div key={t.teamId} className="flex items-center gap-2">
                        <FlagImg teamId={t.teamId} size="xs" />
                        <span className="text-xs font-semibold text-t1 w-24 truncate">{teamName(t.teamId)}</span>
                        <button
                          onClick={() => toggleLock(group, t.teamId, 1)}
                          className={cn('text-[9px] font-bold px-2 py-1 rounded transition-colors',
                            lock?.position === 1 ? 'bg-green text-s0' : 'bg-s3 text-t3 hover:bg-s4 hover:text-t2')}
                        >1st</button>
                        <button
                          onClick={() => toggleLock(group, t.teamId, 2)}
                          className={cn('text-[9px] font-bold px-2 py-1 rounded transition-colors',
                            lock?.position === 2 ? 'bg-accent-bright text-s0' : 'bg-s3 text-t3 hover:bg-s4 hover:text-t2')}
                        >2nd</button>
                        <span className="text-[11px] font-bold tabular-nums text-right ml-auto w-12"
                          style={{ color: sp && sp.pSecond > 0.3 ? '#5E9AFF' : '#9AA3B8' }}>
                          {sp ? pct(sp.pSecond) : '\u2014'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Impact + Saved */}
        <div className="w-80 shrink-0 space-y-4">
          {/* Impact — ALL 4 Dallas matches */}
          <div className="bg-s2 rounded-xl border border-b2 p-4">
            <h3 className="text-xs font-bold text-t1 mb-3">Impact on Dallas Matches</h3>
            {DALLAS_MATCHES.map((matchId) => {
              const { base, scenario } = getMatchDelta(matchId);
              if (!base || !scenario) return null;
              const changed = base.team1 !== scenario.team1 || base.team2 !== scenario.team2;
              const delta = (scenario.combined - base.combined) * 100;

              return (
                <div key={matchId} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-accent">{matchId}</span>
                    {changed && <span className="text-[9px] font-bold text-amber">CHANGED</span>}
                    {!changed && hasLocks && Math.abs(delta) > 0.1 && (
                      <span className={cn('text-[9px] font-bold tabular-nums', delta > 0 ? 'text-green' : 'text-red')}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-t3">
                    <span className="w-8">Base:</span>
                    <FlagImg teamId={base.team1} size="xs" />
                    <span className="truncate">{teamName(base.team1)}</span>
                    <span>vs</span>
                    <FlagImg teamId={base.team2} size="xs" />
                    <span className="truncate">{teamName(base.team2)}</span>
                    <span className="ml-auto font-bold tabular-nums">{pct(base.combined)}</span>
                  </div>
                  {hasLocks && (
                    <div className={cn('flex items-center gap-1.5 text-[10px] mt-0.5', changed ? 'text-amber' : 'text-t2')}>
                      <span className="w-8">Now:</span>
                      <FlagImg teamId={scenario.team1} size="xs" />
                      <span className="font-semibold truncate">{teamName(scenario.team1)}</span>
                      <span>vs</span>
                      <FlagImg teamId={scenario.team2} size="xs" />
                      <span className="font-semibold truncate">{teamName(scenario.team2)}</span>
                      <span className="ml-auto font-bold tabular-nums">{pct(scenario.combined)}</span>
                    </div>
                  )}
                </div>
              );
            })}
            {!hasLocks && <p className="text-[10px] text-t3 text-center py-2">Lock teams to see impact</p>}
          </div>

          {/* Save */}
          {hasLocks && (
            <div className="bg-s2 rounded-xl border border-b2 p-4">
              <h3 className="text-xs font-bold text-t1 mb-2">Save Scenario</h3>
              <div className="flex gap-2">
                <input value={scenarioName} onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="e.g. USA advances" onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  className="flex-1 bg-s3 border border-b2 rounded-lg px-3 py-1.5 text-xs text-t1 placeholder:text-t3 focus:outline-none focus:ring-1 focus:ring-accent" />
                <button onClick={handleSave} disabled={!scenarioName.trim()}
                  className="px-3 py-1.5 bg-accent text-white text-xs font-bold rounded-lg hover:bg-accent-bright disabled:bg-s3 disabled:text-t3 transition-colors">
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Saved list */}
          {scenarios.length > 0 && (
            <div className="bg-s2 rounded-xl border border-b2 p-4">
              <h3 className="text-xs font-bold text-t1 mb-2">Saved Scenarios</h3>
              <div className="space-y-1.5">
                {scenarios.map((s) => {
                  const isActive = activeScenarioId === s.id;
                  const lockCount = Object.values(s.lockedPositions).reduce((sum, ls) => sum + ls.length, 0);
                  return (
                    <div key={s.id} className={cn(
                      'flex items-center justify-between rounded-lg px-3 py-2',
                      isActive ? 'bg-accent/15 ring-1 ring-accent/30' : 'bg-s3',
                    )}>
                      <div>
                        <span className="text-xs font-semibold text-t1">{s.name}</span>
                        <span className="text-[9px] text-t3 ml-2">{lockCount} lock{lockCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => loadScenario(s)} className="text-[9px] font-bold text-accent hover:text-accent-bright">Load</button>
                        <button onClick={() => deleteScenario(s.id)} className="text-[9px] text-t3 hover:text-red">Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
