/**
 * Live-results engine.
 *
 * Takes actual group-stage match results and turns them into hard constraints
 * on the probability model, so the dashboard reflects what has *actually*
 * happened — not just the February market snapshot.
 *
 * Three levels of constraint, applied in priority order per group:
 *
 *   1. COMPLETED group (all 6 matches played) → final 1st/2nd are FACTS.
 *      P(1st)=1 / P(2nd)=1 for the actual finishers, 0 for everyone else.
 *
 *   2. PARTIAL group (some matches played):
 *      a. CLINCHED 1st  → P(1st)=1, P(2nd)=0 (can't finish 2nd if already 1st).
 *      b. ELIMINATED from top 2 → P(1st)=P(2nd)=0 (re-distributed to survivors).
 *      c. Remaining 2nd-place race → market model re-biased toward live standings
 *         (current points + goal difference), so e.g. a team that has collapsed
 *         on the pitch sees its P(2nd) fall even before it's mathematically out.
 *
 *   3. NOT STARTED group → untouched market model.
 *
 * The output is a corrected `TeamProbabilities[]` per group that the matchup
 * generators consume unchanged.
 */
import type { GroupId, TeamProbabilities } from './types';
import { THIRD_PLACE_FACTOR } from './types';

// ── Match + standings types ─────────────────────────────────────

export interface ResultMatch {
  group: GroupId;
  homeId: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  /** true once the match is full-time (only finished matches constrain the model) */
  finished: boolean;
}

export interface TeamStanding {
  teamId: string;
  group: GroupId;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  /** Live rank within group (1-based) after sorting by pts, GD, GF */
  rank: number;
}

export interface GroupStatus {
  group: GroupId;
  standings: TeamStanding[];
  matchesPlayed: number;
  /** A 4-team group plays 6 matches total */
  complete: boolean;
  /** teamIds that have clinched 1st place */
  clinchedFirst: string[];
  /** teamIds mathematically unable to finish in the top 2 */
  eliminatedFromTop2: string[];
}

/** Group sizes (all WC26 groups have 4 teams → 6 matches) */
const GROUP_SIZE = 4;
const GROUP_MATCHES = 6;
const POINTS_WIN = 3;

// ── Standings computation ───────────────────────────────────────

/**
 * Build standings for one group from its finished matches.
 * @param teamIds  the (up to 4) team ids that belong to this group, so teams
 *                 with zero played matches still appear with a 0 row.
 */
export function computeGroupStandings(
  group: GroupId,
  teamIds: string[],
  matches: ResultMatch[],
): TeamStanding[] {
  const table = new Map<string, TeamStanding>();
  for (const id of teamIds) {
    table.set(id, {
      teamId: id, group, played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, points: 0, rank: 0,
    });
  }

  for (const m of matches) {
    if (!m.finished) continue;
    const h = table.get(m.homeId);
    const a = table.get(m.awayId);
    if (!h || !a) continue; // ignore teams not in this group

    h.played++; a.played++;
    h.gf += m.homeScore; h.ga += m.awayScore;
    a.gf += m.awayScore; a.ga += m.homeScore;

    if (m.homeScore > m.awayScore) {
      h.won++; h.points += POINTS_WIN; a.lost++;
    } else if (m.homeScore < m.awayScore) {
      a.won++; a.points += POINTS_WIN; h.lost++;
    } else {
      h.drawn++; a.drawn++; h.points++; a.points++;
    }
  }

  const rows = [...table.values()];
  for (const r of rows) r.gd = r.gf - r.ga;
  rows.sort(compareStandings);
  rows.forEach((r, i) => { r.rank = i + 1; });
  return rows;
}

/** FIFA-style ordering: points, then goal difference, then goals for. */
function compareStandings(a: TeamStanding, b: TeamStanding): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.gd !== a.gd) return b.gd - a.gd;
  if (b.gf !== a.gf) return b.gf - a.gf;
  return 0;
}

// ── Qualification math (clinch / elimination) ───────────────────

/**
 * Derive the constraint status for a group from its standings.
 *
 * Uses a conservative, provably-correct rule set:
 *   - complete: every team has played all 3 games.
 *   - clinchedFirst: a team's current points are unreachable by every other
 *     team even if those teams win all remaining matches.
 *   - eliminatedFromTop2: a team cannot reach the points total of the team
 *     currently 2nd, even at max remaining points — AND can't overtake on the
 *     guaranteed-points comparison. We use the standard "max achievable points
 *     vs others' current points" bound, which never produces a false elimination.
 */
export function deriveGroupStatus(standings: TeamStanding[]): Omit<GroupStatus, 'group'> {
  const matchesPlayed = standings.reduce((s, t) => s + t.played, 0) / 2;
  const complete = standings.every((t) => t.played >= GROUP_SIZE - 1) &&
    matchesPlayed >= GROUP_MATCHES;

  const maxPts = (t: TeamStanding) => t.points + (GROUP_SIZE - 1 - t.played) * POINTS_WIN;

  const clinchedFirst: string[] = [];
  const eliminatedFromTop2: string[] = [];

  for (const t of standings) {
    // Clinched 1st: no other team can ever catch t's CURRENT points.
    const others = standings.filter((o) => o.teamId !== t.teamId);
    const clinch = others.every((o) => maxPts(o) < t.points);
    if (clinch) clinchedFirst.push(t.teamId);

    // Eliminated from top 2: at least 2 other teams already have current points
    // that t can never reach (t's max < their current). If 2+ teams are locked
    // ahead of t, t cannot finish 1st or 2nd.
    const lockedAhead = others.filter((o) => o.points > maxPts(t)).length;
    if (lockedAhead >= 2) eliminatedFromTop2.push(t.teamId);
  }

  return { standings, matchesPlayed, complete, clinchedFirst, eliminatedFromTop2 };
}

export function buildGroupStatus(
  group: GroupId,
  teamIds: string[],
  matches: ResultMatch[],
): GroupStatus {
  const standings = computeGroupStandings(group, teamIds, matches);
  return { group, ...deriveGroupStatus(standings) };
}

// ── Applying constraints to model probabilities ─────────────────

/**
 * How strongly live standings re-bias the 2nd-place race in a still-open group.
 * 0 = ignore standings (pure market), 1 = standings dominate.
 * Scales with how far the group has progressed: more games played → trust the
 * pitch more than the February market.
 */
function standingsWeight(matchesPlayed: number): number {
  // 0 played → 0.0, 3 → ~0.33, 6 → 0.67 (cap). Linear in matches played.
  return Math.min(0.67, (matchesPlayed / GROUP_MATCHES) * 0.67);
}

/**
 * Live "strength" of a team from its standings so far — used to derive
 * order-statistic finishing probabilities. Points dominate; GD is a nudge.
 */
function liveStrength(t: TeamStanding): number {
  return Math.max(0.05, t.points + 0.15 * t.gd + 0.05);
}

/**
 * Probability each contender finishes EXACTLY 2nd, from live strengths, using
 * an order-statistic (Plackett–Luce style) model:
 *
 *   P(1st = k)        ∝ g(k)
 *   P(2nd = t)        = Σ_{k≠t} P(1st=k) · g(t) / (G − g(k))
 *
 * This is the key correction over a naive "strongest = most likely 2nd" score:
 * a runaway leader has a HIGH P(1st) and therefore a LOW P(2nd) (they win the
 * group), while the team currently sitting 2nd gets the largest P(2nd) mass.
 *
 * @returns Map teamId → normalized P(finish 2nd) (sums to 1 over contenders)
 */
export function liveSecondPlaceShares(
  contenders: TeamStanding[],
): Map<string, number> {
  const out = new Map<string, number>();
  if (contenders.length === 0) return out;
  if (contenders.length === 1) {
    out.set(contenders[0]!.teamId, 1);
    return out;
  }

  const g = new Map(contenders.map((t) => [t.teamId, liveStrength(t)]));
  const G = [...g.values()].reduce((s, v) => s + v, 0);

  let total = 0;
  for (const t of contenders) {
    const gt = g.get(t.teamId)!;
    let p2 = 0;
    for (const k of contenders) {
      if (k.teamId === t.teamId) continue;
      const gk = g.get(k.teamId)!;
      const denom = G - gk;
      if (denom <= 0) continue;
      const pFirstK = gk / G;
      p2 += pFirstK * (gt / denom);
    }
    out.set(t.teamId, p2);
    total += p2;
  }

  // Normalize to sum 1.
  if (total > 0) {
    for (const [id, v] of out) out.set(id, v / total);
  }
  return out;
}

/**
 * Apply live-results constraints to one group's model probabilities.
 *
 * @param modelProbs  the market-derived TeamProbabilities for this group
 * @param status      the live GroupStatus (standings + clinch/elim)
 * @returns corrected TeamProbabilities[] (same teams), re-sorted by pSecond desc
 */
export function applyGroupConstraints(
  modelProbs: TeamProbabilities[],
  status: GroupStatus,
): TeamProbabilities[] {
  if (status.matchesPlayed === 0) return modelProbs; // not started → untouched

  const byId = new Map(status.standings.map((s) => [s.teamId, s]));

  // ── Case 1: completed group → facts only ──
  if (status.complete) {
    return modelProbs
      .map((p) => {
        const s = byId.get(p.teamId);
        const rank = s?.rank ?? 99;
        const isFirst = rank === 1;
        const isSecond = rank === 2;
        return {
          ...p,
          pWin: isFirst ? 1 : 0,
          pSecond: isSecond ? 1 : 0,
          pThird: rank === 3 ? 1 : 0,
          pQualify: rank <= 2 ? 1 : (rank === 3 ? THIRD_PLACE_FACTOR : 0),
        };
      })
      .sort((a, b) => b.pSecond - a.pSecond);
  }

  // ── Case 2: partial group → clinch / eliminate / re-bias ──
  const clinched = new Set(status.clinchedFirst);
  const eliminated = new Set(status.eliminatedFromTop2);
  const w = standingsWeight(status.matchesPlayed);

  // Step A: zero out impossible 2nd-place outcomes, set clinched firsts.
  const adjusted = modelProbs.map((p) => {
    if (clinched.has(p.teamId)) {
      return { ...p, pWin: 1, pSecond: 0 };
    }
    if (eliminated.has(p.teamId)) {
      return { ...p, pSecond: 0, pThird: 0 };
    }
    return { ...p };
  });

  // Step B: among teams still able to finish 2nd, blend the market P(2nd) share
  // with the live order-statistic P(2nd) share. Preserve the total P(2nd) mass
  // of the contenders so the column still sums sensibly.
  const contenders = adjusted.filter(
    (p) => !clinched.has(p.teamId) && !eliminated.has(p.teamId),
  );
  const massToDistribute = adjusted.reduce((s, p) => s + p.pSecond, 0);

  if (contenders.length > 0 && massToDistribute > 0) {
    const marketTotal = contenders.reduce((s, p) => s + p.pSecond, 0) || 1;
    const liveShares = liveSecondPlaceShares(
      contenders.map((p) => byId.get(p.teamId)).filter((s): s is TeamStanding => !!s),
    );

    for (const p of contenders) {
      const marketShare = p.pSecond / marketTotal;
      const liveShare = liveShares.get(p.teamId) ?? marketShare;
      const blended = (1 - w) * marketShare + w * liveShare;
      p.pSecond = blended * massToDistribute;
    }
  }

  return adjusted.sort((a, b) => b.pSecond - a.pSecond);
}

/**
 * Apply constraints across all groups.
 * @param modelByGroup  market probabilities keyed by group
 * @param statusByGroup live status keyed by group (may be partial)
 */
export function applyAllConstraints(
  modelByGroup: Record<GroupId, TeamProbabilities[]>,
  statusByGroup: Partial<Record<GroupId, GroupStatus>>,
): Record<GroupId, TeamProbabilities[]> {
  const out = {} as Record<GroupId, TeamProbabilities[]>;
  for (const [g, probs] of Object.entries(modelByGroup) as [GroupId, TeamProbabilities[]][]) {
    const status = statusByGroup[g];
    out[g] = status ? applyGroupConstraints(probs, status) : probs;
  }
  return out;
}
