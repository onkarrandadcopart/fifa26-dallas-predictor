import { describe, test, expect } from 'vitest';
import {
  generateR32Matchups,
  matchupSummary,
} from '../matchups';
import { calculateGroupProbabilities } from '../probability';
import { initialGroupOdds } from '../../data/initial-odds';

// Helper: get group probs
function groupProbs(group: string) {
  const inputs = initialGroupOdds.filter((o) => o.group === group);
  return calculateGroupProbabilities(inputs);
}

// ============================================================
// M78: 2E vs 2I (Dallas R32)
// ============================================================

describe('M78 — 2E vs 2I', () => {
  const groupE = groupProbs('E');
  const groupI = groupProbs('I');
  const matchups = generateR32Matchups('M78', groupE, groupI);

  test('generates 16 matchup combinations (4x4)', () => {
    expect(matchups).toHaveLength(16);
  });

  test('top matchup is Ecuador vs Norway', () => {
    expect(matchups[0]!.team1).toBe('ecuador');
    expect(matchups[0]!.team2).toBe('norway');
  });

  test('Ecuador vs Norway combined probability = ~11.1%', () => {
    expect(matchups[0]!.combined).toBeCloseTo(0.111, 2);
  });

  test('Ecuador vs Norway exact combined = 0.11145...', () => {
    expect(matchups[0]!.combined).toBeCloseTo(0.1114588137284466, 10);
  });

  test('#2 is Ecuador vs France', () => {
    expect(matchups[1]!.team1).toBe('ecuador');
    expect(matchups[1]!.team2).toBe('france');
    expect(matchups[1]!.combined).toBeCloseTo(0.09221660955717531, 10);
  });

  test('#3 is Germany vs Norway', () => {
    expect(matchups[2]!.team1).toBe('germany');
    expect(matchups[2]!.team2).toBe('norway');
    expect(matchups[2]!.combined).toBeCloseTo(0.07911467070439751, 10);
  });

  test('#4 is Ivory Coast vs Norway', () => {
    expect(matchups[3]!.team1).toBe('ivory_coast');
    expect(matchups[3]!.team2).toBe('norway');
    expect(matchups[3]!.combined).toBeCloseTo(0.06803180580715339, 10);
  });

  test('all 16 matchup combined probabilities from spreadsheet', () => {
    // Updated 2026-06: Iraq replaced tbd_i4 in Group I.
    const expected: Record<string, number> = {
      'germany|france':        0.06545634620126871,
      'germany|senegal':       0.046844455209442686,
      'germany|norway':        0.07911467070439751,
      'germany|iraq_i':        0.0009597710175817347,
      'ecuador|france':        0.09221660955717531,
      'ecuador|senegal':       0.06599569158175887,
      'ecuador|norway':        0.1114588137284466,
      'ecuador|iraq_i':        0.0013521504686571123,
      'ivory_coast|france':    0.05628682258248966,
      'ivory_coast|senegal':   0.040282198631126434,
      'ivory_coast|norway':    0.06803180580715339,
      'ivory_coast|iraq_i':    0.0008253204482316732,
      'curacao|france':        0.0014185320303914783,
      'curacao|senegal':       0.001015185906596562,
      'curacao|norway':        0.0017145273297562548,
      'curacao|iraq_i':        2.0799601708515846e-05,
    };

    for (const m of matchups) {
      const key = `${m.team1}|${m.team2}`;
      const exp = expected[key];
      expect(exp).toBeDefined();
      expect(m.combined).toBeCloseTo(exp!, 12);
    }
  });

  test('matchups are sorted by combined descending', () => {
    for (let i = 1; i < matchups.length; i++) {
      expect(matchups[i]!.combined).toBeLessThanOrEqual(matchups[i - 1]!.combined);
    }
  });
});

// ============================================================
// M88: 2D vs 2G (Dallas R32)
// ============================================================

describe('M88 — 2D vs 2G', () => {
  const groupD = groupProbs('D');
  const groupG = groupProbs('G');
  const matchups = generateR32Matchups('M88', groupD, groupG);

  test('generates 16 matchup combinations (4x4)', () => {
    expect(matchups).toHaveLength(16);
  });

  // Updated 2026-06: UEFA Playoff C resolved → Türkiye in Group D.
  test('top matchup is USA vs Belgium (CLAUDE.md test case)', () => {
    expect(matchups[0]!.team1).toBe('united_states_d');
    expect(matchups[0]!.team2).toBe('belgium');
  });

  test('USA vs Belgium combined = ~7.5%', () => {
    expect(matchups[0]!.combined).toBeCloseTo(0.075, 2);
  });

  test('USA vs Belgium exact combined = 0.07505...', () => {
    expect(matchups[0]!.combined).toBeCloseTo(0.0750525346639714, 10);
  });

  test('#2 is Türkiye vs Belgium', () => {
    expect(matchups[1]!.team1).toBe('turkiye_d');
    expect(matchups[1]!.team2).toBe('belgium');
    expect(matchups[1]!.combined).toBeCloseTo(0.0737359744057630, 10);
  });

  test('#3 is USA vs Egypt', () => {
    expect(matchups[2]!.team1).toBe('united_states_d');
    expect(matchups[2]!.team2).toBe('egypt');
    expect(matchups[2]!.combined).toBeCloseTo(0.0624119938844798, 10);
  });

  test('matchups are sorted by combined descending', () => {
    for (let i = 1; i < matchups.length; i++) {
      expect(matchups[i]!.combined).toBeLessThanOrEqual(matchups[i - 1]!.combined);
    }
  });
});

// ============================================================
// M83: 2K vs 2L (Toronto, feeds M93)
// ============================================================

describe('M83 — 2K vs 2L', () => {
  const groupK = groupProbs('K');
  const groupL = groupProbs('L');
  const matchups = generateR32Matchups('M83', groupK, groupL);

  test('top matchup is Colombia vs Croatia', () => {
    expect(matchups[0]!.team1).toBe('colombia');
    expect(matchups[0]!.team2).toBe('croatia');
    expect(matchups[0]!.combined).toBeCloseTo(0.09256985958649974, 10);
  });

  test('#2 is Colombia vs England', () => {
    expect(matchups[1]!.team1).toBe('colombia');
    expect(matchups[1]!.team2).toBe('england');
    expect(matchups[1]!.combined).toBeCloseTo(0.08602025385853322, 10);
  });
});

// ============================================================
// matchupSummary
// ============================================================

describe('matchupSummary', () => {
  test('returns top 3 with cumulative probability', () => {
    const groupE = groupProbs('E');
    const groupI = groupProbs('I');
    const matchups = generateR32Matchups('M78', groupE, groupI);
    const summary = matchupSummary(matchups, 3);

    expect(summary.top).toHaveLength(3);
    expect(summary.totalCombinations).toBe(16);
    // Top 3: Ecuador/Norway (11.1%) + Ecuador/France (9.2%) + Germany/Norway (7.9%) ≈ 28.3%
    expect(summary.cumulativePct).toBeCloseTo(0.283, 2);
  });
});
