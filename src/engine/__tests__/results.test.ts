import { describe, test, expect } from 'vitest';
import {
  computeGroupStandings,
  deriveGroupStatus,
  buildGroupStatus,
  applyGroupConstraints,
  type ResultMatch,
} from '../results';
import { calculateGroupProbabilities } from '../probability';
import { initialGroupOdds } from '../../data/initial-odds';
import type { GroupId, TeamProbabilities } from '../types';

/** Helper: build a finished ResultMatch */
function r(group: GroupId, h: string, a: string, hs: number, as: number, finished = true): ResultMatch {
  return { group, homeId: h, awayId: a, homeScore: hs, awayScore: as, finished };
}

function modelFor(group: GroupId): TeamProbabilities[] {
  return calculateGroupProbabilities(initialGroupOdds.filter((o) => o.group === group));
}

// ── Real Group E results (as of Matchday 2, June 2026) ──
// Germany 7-1 Curaçao, Ivory Coast 1-0 Ecuador, Germany 2-1 Ivory Coast, Ecuador 0-0 Curaçao
const GROUP_E_TEAMS = ['germany', 'ecuador', 'ivory_coast', 'curacao'];
const GROUP_E_MATCHES: ResultMatch[] = [
  r('E', 'germany', 'curacao', 7, 1),
  r('E', 'ivory_coast', 'ecuador', 1, 0),
  r('E', 'germany', 'ivory_coast', 2, 1),
  r('E', 'ecuador', 'curacao', 0, 0),
];

describe('computeGroupStandings — Group E (live)', () => {
  const standings = computeGroupStandings('E', GROUP_E_TEAMS, GROUP_E_MATCHES);

  test('Germany leads with 6 points', () => {
    const ger = standings.find((s) => s.teamId === 'germany')!;
    expect(ger.points).toBe(6);
    expect(ger.rank).toBe(1);
  });

  test('Ivory Coast is 2nd with 3 points', () => {
    const civ = standings.find((s) => s.teamId === 'ivory_coast')!;
    expect(civ.points).toBe(3);
    expect(civ.rank).toBe(2);
  });

  test('Ecuador has collapsed to 3rd (1 pt, 0 goals scored)', () => {
    const ecu = standings.find((s) => s.teamId === 'ecuador')!;
    expect(ecu.points).toBe(1);
    expect(ecu.gf).toBe(0);
    expect(ecu.rank).toBeGreaterThanOrEqual(3);
  });
});

describe('deriveGroupStatus — Group E (2 of 3 played)', () => {
  const standings = computeGroupStandings('E', GROUP_E_TEAMS, GROUP_E_MATCHES);
  const status = deriveGroupStatus(standings);

  test('Germany has NOT mathematically clinched (Ivory Coast can still reach 6 and tie)', () => {
    // Germany 6, Ivory Coast 3 → CIV max = 6. A tie is possible, so the
    // conservative clinch rule must NOT lock Germany as 1st yet.
    expect(status.clinchedFirst).not.toContain('germany');
  });

  test('group is not complete (matchday 3 unplayed)', () => {
    expect(status.complete).toBe(false);
  });

  test('never falsely eliminates a team that can still reach top 2', () => {
    // Ecuador (1pt) can reach 4; Ivory Coast has 3, Curaçao 1.
    // Ecuador is NOT mathematically out, so must not be in eliminated list.
    expect(status.eliminatedFromTop2).not.toContain('ecuador');
  });
});

describe('applyGroupConstraints — Group E re-bias', () => {
  const status = buildGroupStatus('E', GROUP_E_TEAMS, GROUP_E_MATCHES);
  const model = modelFor('E');
  const corrected = applyGroupConstraints(model, status);

  test("Germany's P(2nd) is pulled DOWN (runaway leader wins, not finishes 2nd)", () => {
    // Germany is not mathematically clinched, but as the dominant leader the
    // order-statistic model assigns it a LOW P(2nd) — it should be below the
    // teams actually racing for 2nd.
    const ger = corrected.find((p) => p.teamId === 'germany')!;
    const civ = corrected.find((p) => p.teamId === 'ivory_coast')!;
    expect(ger.pSecond).toBeLessThan(civ.pSecond);
  });

  test("Ivory Coast's P(2nd) overtakes Ecuador after live results", () => {
    // In the Feb seed model, Ecuador was the 2E favorite (~35%) over Ivory Coast (~22%).
    // After the actual results (CIV 2nd on pts, Ecuador 3rd, 0 goals), CIV must lead.
    const civ = corrected.find((p) => p.teamId === 'ivory_coast')!;
    const ecu = corrected.find((p) => p.teamId === 'ecuador')!;
    expect(civ.pSecond).toBeGreaterThan(ecu.pSecond);
  });

  test('total P(2nd) mass among survivors is conserved (no inflation)', () => {
    const before = model.reduce((s, p) => s + p.pSecond, 0);
    const after = corrected.reduce((s, p) => s + p.pSecond, 0);
    expect(after).toBeCloseTo(before, 5);
  });
});

describe('applyGroupConstraints — completed group locks facts', () => {
  // Synthetic completed group: all 6 matches played.
  const teams = ['germany', 'ecuador', 'ivory_coast', 'curacao'];
  const complete: ResultMatch[] = [
    ...GROUP_E_MATCHES,
    r('E', 'germany', 'ecuador', 3, 0),
    r('E', 'ivory_coast', 'curacao', 2, 0),
  ];
  const status = buildGroupStatus('E', teams, complete);
  const corrected = applyGroupConstraints(modelFor('E'), status);

  test('group reads as complete', () => {
    expect(status.complete).toBe(true);
  });

  test('exactly one team has P(2nd) = 1', () => {
    const seconds = corrected.filter((p) => p.pSecond === 1);
    expect(seconds).toHaveLength(1);
  });

  test('1st-place team is locked to P(1st)=1, P(2nd)=0', () => {
    const first = corrected.find((p) => p.pWin === 1)!;
    expect(first.teamId).toBe('germany');
    expect(first.pSecond).toBe(0);
  });
});

describe('applyGroupConstraints — untouched when not started', () => {
  const status = buildGroupStatus('I', ['france', 'norway', 'senegal', 'iraq_i'], []);
  const model = modelFor('I');
  const corrected = applyGroupConstraints(model, status);

  test('matchesPlayed is 0', () => {
    expect(status.matchesPlayed).toBe(0);
  });

  test('probabilities are unchanged', () => {
    expect(corrected).toEqual(model);
  });
});
