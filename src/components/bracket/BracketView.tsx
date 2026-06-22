import { useLivePredictions } from '@/engine/useLivePredictions';
import { teamName } from '@/engine/predictions';
import { FlagImg } from '@/components/ui/FlagImg';
import { pct } from '@/utils/format';
import { cn } from '@/lib/utils';

/** Bracket slot — shows predicted teams or confirmed teams */
interface SlotData {
  matchId: string;
  label: string;
  stage: string;
  date: string;
  isDallas: boolean;
  team1?: { id: string; prob: number };
  team2?: { id: string; prob: number };
  confirmed?: boolean;
}

export function BracketView() {
  const { predictions } = useLivePredictions();

  const top = (matchups: typeof predictions.m78) => {
    const t = matchups[0];
    return t ? { t1: { id: t.team1, prob: t.p1 }, t2: { id: t.team2, prob: t.p2 }, combined: t.combined } : null;
  };

  // Build bracket data for Dallas side
  const m78 = top(predictions.m78);
  const m88 = top(predictions.m88);
  const m93 = top(predictions.m93);
  const m101 = top(predictions.m101Matchups);

  const bracketSlots: SlotData[][] = [
    // Column 1: Group Stage (Dallas)
    [
      { matchId: 'M11', label: 'M11', stage: 'Group', date: 'Jun 14', isDallas: true, team1: { id: 'netherlands', prob: 1 }, team2: { id: 'japan', prob: 1 }, confirmed: true },
      { matchId: 'M21', label: 'M21', stage: 'Group', date: 'Jun 17', isDallas: true, team1: { id: 'england', prob: 1 }, team2: { id: 'croatia', prob: 1 }, confirmed: true },
      { matchId: 'M43', label: 'M43', stage: 'Group', date: 'Jun 22', isDallas: true, team1: { id: 'argentina', prob: 1 }, team2: { id: 'austria', prob: 1 }, confirmed: true },
      { matchId: 'M70', label: 'M70', stage: 'Group', date: 'Jun 27', isDallas: true, team1: { id: 'argentina', prob: 1 }, team2: { id: 'jordan', prob: 1 }, confirmed: true },
    ],
    // Column 2: R32 (Dallas)
    [
      { matchId: 'M78', label: 'M78', stage: 'R32', date: 'Jun 30', isDallas: true, team1: m78?.t1, team2: m78?.t2 },
      { matchId: 'M88', label: 'M88', stage: 'R32', date: 'Jul 3', isDallas: true, team1: m88?.t1, team2: m88?.t2 },
    ],
    // Column 3: R32 feeders (not Dallas)
    [
      { matchId: 'M83', label: 'M83', stage: 'R32', date: 'Jul 4', isDallas: false, team1: { id: predictions.m93[0]?.team1 ?? 'congo_dr_k', prob: 0 }, team2: undefined },
      { matchId: 'M84', label: 'M84', stage: 'R32', date: 'Jul 4', isDallas: false, team1: { id: predictions.m93[0]?.team2 ?? 'congo_dr_k', prob: 0 }, team2: undefined },
    ],
    // Column 4: R16 (Dallas)
    [
      { matchId: 'M93', label: 'M93', stage: 'R16', date: 'Jul 6', isDallas: true, team1: m93?.t1, team2: m93?.t2 },
    ],
    // Column 5: Semifinal (Dallas)
    [
      { matchId: 'M101', label: 'M101', stage: 'SF', date: 'Jul 14', isDallas: true, team1: m101?.t1, team2: m101?.t2 },
    ],
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-t1">Dallas Bracket Path</h2>
        <p className="text-xs text-t3 mt-0.5">
          How teams flow through to AT&T Stadium knockout matches. Dallas matches are highlighted.
        </p>
      </div>

      {/* Bracket visualization */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1100px] items-start">
          {bracketSlots.map((column, ci) => (
            <div key={ci} className="flex flex-col gap-3" style={{ marginTop: ci > 1 ? `${ci * 24}px` : 0 }}>
              {/* Column header */}
              <div className="text-[9px] font-bold text-t3 uppercase tracking-widest text-center mb-1">
                {ci === 0 ? 'Group Stage' : ci <= 2 ? 'Round of 32' : ci === 3 ? 'Round of 16' : 'Semifinal'}
              </div>

              {column.map((slot) => (
                <BracketSlot key={slot.matchId} slot={slot} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Flow legend */}
      <div className="bg-s2 rounded-xl border border-b2 p-4">
        <h3 className="text-xs font-bold text-t1 mb-3">Dallas Match Flow</h3>
        <div className="space-y-2 text-[11px] text-t2">
          <FlowRow label="M78 (R32)" desc="2nd in Group E vs 2nd in Group I" top={m78} />
          <FlowRow label="M88 (R32)" desc="2nd in Group D vs 2nd in Group G" top={m88} />
          <FlowRow label="M93 (R16)" desc="Winner M83 (2K vs 2L) vs Winner M84 (1H vs 2J)" top={m93} />
          <FlowRow label="M101 (SF)" desc="Winner QF97 vs Winner QF98 — bracket-dependent" top={m101} />
        </div>
      </div>

      {/* Top 5 predictions per knockout match */}
      {[
        { id: 'M78', data: predictions.m78, title: 'M78 — R32 — Jun 30' },
        { id: 'M88', data: predictions.m88, title: 'M88 — R32 — Jul 3' },
        { id: 'M93', data: predictions.m93, title: 'M93 — R16 — Jul 6' },
        { id: 'M101', data: predictions.m101Matchups, title: 'M101 — SF — Jul 14' },
      ].map(({ id, data, title }) => (
        <div key={id} className="bg-s2 rounded-xl border border-b2 overflow-hidden">
          <div className="px-4 py-2 bg-s3/50 border-b border-b1">
            <span className="text-xs font-bold text-accent">{title}</span>
          </div>
          <div className="divide-y divide-b1">
            {data.slice(0, 5).map((m, i) => (
              <div key={`${m.team1}-${m.team2}`} className="flex items-center gap-3 px-4 py-2">
                <span className="text-[10px] font-bold text-t3 w-4 tabular-nums">{i + 1}</span>
                <FlagImg teamId={m.team1} size="xs" />
                <span className="text-xs font-semibold text-t1 w-24">{teamName(m.team1)}</span>
                <span className="text-[10px] text-t3">vs</span>
                <FlagImg teamId={m.team2} size="xs" />
                <span className="text-xs font-semibold text-t1 w-24">{teamName(m.team2)}</span>
                <div className="flex-1 h-1.5 bg-s3 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((m.combined / (data[0]?.combined ?? 0.01)) * 100, 100)}%`,
                      background: i < 3 ? 'linear-gradient(90deg, #2662D9, #5E9AFF)' : '#1D3E7A',
                    }}
                  />
                </div>
                <span className={cn(
                  'text-xs font-bold tabular-nums w-12 text-right',
                  i < 3 ? 'text-accent-bright' : 'text-t3',
                )}>
                  {pct(m.combined)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BracketSlot({ slot }: { slot: SlotData }) {
  return (
    <div className={cn(
      'w-52 rounded-lg border overflow-hidden',
      slot.isDallas
        ? 'border-accent/30 bg-s2 shadow-[0_0_12px_rgba(59,123,246,0.08)]'
        : 'border-b2 bg-s2/60',
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-3 py-1.5 border-b',
        slot.isDallas ? 'bg-accent/8 border-accent/15' : 'bg-s3/50 border-b1',
      )}>
        <div className="flex items-center gap-1.5">
          <span className={cn('text-[10px] font-bold', slot.isDallas ? 'text-accent-bright' : 'text-t3')}>
            {slot.label}
          </span>
          {slot.isDallas && (
            <span className="text-[8px] font-bold bg-accent/20 text-accent-bright px-1 py-0.5 rounded">
              DALLAS
            </span>
          )}
        </div>
        <span className="text-[9px] text-t3">{slot.date}</span>
      </div>

      {/* Teams */}
      <div className="p-2 space-y-1">
        {slot.team1 && (
          <TeamRow teamId={slot.team1.id} prob={slot.team1.prob} confirmed={slot.confirmed} />
        )}
        {slot.team2 && (
          <TeamRow teamId={slot.team2.id} prob={slot.team2.prob} confirmed={slot.confirmed} />
        )}
        {!slot.team1 && !slot.team2 && (
          <p className="text-[10px] text-t3 text-center py-1">TBD</p>
        )}
      </div>
    </div>
  );
}

function TeamRow({ teamId, prob, confirmed }: { teamId: string; prob: number; confirmed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-1">
      <FlagImg teamId={teamId} size="xs" />
      <span className="text-[11px] font-semibold text-t1 flex-1 truncate">{teamName(teamId)}</span>
      {!confirmed && prob > 0 && prob < 1 && (
        <span className="text-[9px] font-bold text-t3 tabular-nums">{pct(prob)}</span>
      )}
    </div>
  );
}

function FlowRow({ label, desc, top }: { label: string; desc: string; top: { t1: { id: string }; t2: { id: string }; combined: number } | null }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-bold text-accent w-20 shrink-0">{label}</span>
      <span className="text-[10px] text-t3 flex-1">{desc}</span>
      {top && (
        <div className="flex items-center gap-1.5 shrink-0">
          <FlagImg teamId={top.t1.id} size="xs" />
          <span className="text-[10px] font-semibold text-t1">{teamName(top.t1.id)}</span>
          <span className="text-[9px] text-t3">vs</span>
          <FlagImg teamId={top.t2.id} size="xs" />
          <span className="text-[10px] font-semibold text-t1">{teamName(top.t2.id)}</span>
          <span className="text-[10px] font-bold text-accent-bright tabular-nums">{pct(top.combined)}</span>
        </div>
      )}
    </div>
  );
}
