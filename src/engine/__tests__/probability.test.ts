import { describe, test, expect } from 'vitest';
import {
  calculateAlpha,
  calculateP2nd,
  calculateP3rd,
  calculateTeamProbabilities,
  calculateGroupProbabilities,
  calculateAllGroupProbabilities,
} from '../probability';
import { removeVig } from '../normalize';
import { initialGroupOdds, rawYesPrices } from '../../data/initial-odds';

// ============================================================
// Spreadsheet oracle values — every test case from CLAUDE.md
// ============================================================

const oracle = {
  D: [
    // Updated 2026-06: UEFA Playoff C resolved → Türkiye in. Numbers from Kalshi live.
    { team: 'united_states_d', W: 38.23529411764706,  Q: 81, alpha: 0.6500000000000000,  p2nd: 0.3142686130415988 },
    { team: 'turkiye_d',       W: 33.33333333333333,  Q: 78, alpha: 0.6000000000000000,  p2nd: 0.3087557603686636 },
    { team: 'paraguay',        W: 18.627450980392158, Q: 66, alpha: 0.40714285714285725, p2nd: 0.2397864571634533 },
    { team: 'australia',       W: 9.803921568627452,  Q: 49, alpha: 0.2459016393442623,  p2nd: 0.1283154029835417 },
  ],
  E: [
    { team: 'germany',     W: 69.47368421052632,  Q: 97, alpha: 0.8722466960352422,  p2nd: 0.2506650658288088 },
    { team: 'ecuador',     W: 18.947368421052634, Q: 88, alpha: 0.41221374045801534, p2nd: 0.35314348946521057 },
    { team: 'ivory_coast', W: 10.526315789473683, Q: 73, alpha: 0.2608695652173913,  p2nd: 0.21555037680457612 },
    { team: 'curacao',     W: 1.0526315789473684, Q: 13, alpha: 0.03092783505154639, p2nd: 0.005432268151433448 },
  ],
  G: [
    { team: 'belgium',     W: 68.68686868686868,  Q: 95, alpha: 0.8680851063829788,  p2nd: 0.23881651412015792 },
    { team: 'egypt',       W: 18.181818181818183, Q: 58, alpha: 0.4,                 p2nd: 0.19859442303332575 },
    { team: 'iran',        W: 8.080808080808081,  Q: 35, alpha: 0.20869565217391306, p2nd: 0.0760339656420626 },
    { team: 'new_zealand', W: 5.05050505050505,   Q: 12, alpha: 0.13761467889908258, p2nd: 0.013367841015955919 },
  ],
  H: [
    { team: 'spain',        W: 77.45098039215686,  Q: 98, alpha: 0.9115384615384616,  p2nd: 0.19294471879318661 },
    { team: 'uruguay',      W: 14.705882352941178, Q: 72, alpha: 0.3409090909090909,  p2nd: 0.249611317079838 },
    { team: 'saudi_arabia', W: 3.9215686274509802, Q: 22, alpha: 0.10909090909090909, p2nd: 0.027934738149702317 },
    { team: 'cape_verde',   W: 3.9215686274509802, Q: 8,  alpha: 0.10909090909090909, p2nd: 0.006301979973034796 },
  ],
  I: [
    // Updated 2026-06: intercontinental playoff resolved → Iraq in. Numbers from Kalshi live.
    { team: 'france',  W: 64.70588235294117,  Q: 94, alpha: 0.8461538461538463,  p2nd: 0.2611307083611403 },
    { team: 'norway',  W: 23.52941176470588,  Q: 78, alpha: 0.4799999999999999,  p2nd: 0.3156190530292271 },
    { team: 'senegal', W: 10.784313725490197, Q: 64, alpha: 0.26612903225806456, p2nd: 0.18688066904957154 },
    { team: 'iraq_i',  W: 0.9803921568627451, Q: 10, alpha: 0.028846153846153844, p2nd: 0.0038288981929265257 },
  ],
  J: [
    { team: 'argentina', W: 68.80733944954129,  Q: 97, alpha: 0.8687258687258688,  p2nd: 0.2560072896865449 },
    { team: 'austria',   W: 16.51376146788991,  Q: 74, alpha: 0.3724137931034483,  p2nd: 0.2700058172335344 },
    { team: 'jordan',    W: 4.587155963302752,  Q: 32, alpha: 0.12605042016806722, p2nd: 0.04855841527520769 },
    { team: 'algeria',   W: 10.091743119266056, Q: 64, alpha: 0.25190839694656486, p2nd: 0.1803134479083945 },
  ],
  K: [
    // Updated 2026-06: intercontinental playoff resolved → DR Congo in. Numbers from Kalshi live.
    { team: 'portugal',   W: 63.725490196078425, Q: 92, alpha: 0.8405172413793103,   p2nd: 0.25085442521337215 },
    { team: 'colombia',   W: 30.392156862745097, Q: 85, alpha: 0.5670731707317073,   p2nd: 0.3612811703610091 },
    { team: 'congo_dr_k', W: 3.9215686274509802, Q: 25, alpha: 0.10909090909090909,  p2nd: 0.03257032918755964 },
    { team: 'uzbekistan', W: 1.9607843137254901, Q: 29, alpha: 0.056603773584905655, p2nd: 0.02222401289282836 },
  ],
  L: [
    { team: 'england', W: 67.64705882352942,  Q: 94, alpha: 0.8625,               p2nd: 0.23809780557502552 },
    { team: 'croatia', W: 21.568627450980394, Q: 68, alpha: 0.452054794520548,    p2nd: 0.2562266378123155 },
    { team: 'ghana',   W: 9.803921568627452,  Q: 28, alpha: 0.24590163934426226,  p2nd: 0.0595681310498883 },
    { team: 'panama',  W: 0.9803921568627451, Q: 10, alpha: 0.028846153846153844, p2nd: 0.0038288981929265257 },
  ],
} as const;

const allOracle = Object.values(oracle).flat();

// ============================================================
// Alpha Tests
// ============================================================

describe('calculateAlpha', () => {
  test.each(allOracle)('$team: alpha matches spreadsheet', ({ W, alpha }) => {
    expect(calculateAlpha(W)).toBeCloseTo(alpha, 10);
  });

  test('alpha = 0 when W = 0', () => {
    expect(calculateAlpha(0)).toBe(0);
  });

  test('alpha approaches 1 as W approaches 100', () => {
    expect(calculateAlpha(99)).toBeCloseTo(0.9966, 3);
  });
});

// ============================================================
// P(2nd) Tests — MUST match spreadsheet exactly
// ============================================================

describe('calculateP2nd', () => {
  test.each(allOracle)('$team: P(2nd) matches spreadsheet', ({ W, Q, alpha, p2nd }) => {
    const result = calculateP2nd(W, Q, alpha);
    expect(result).toBeCloseTo(p2nd, 10);
  });

  // Specific CLAUDE.md test cases
  test('Germany P(2nd) in Group E = ~25.07%', () => {
    const result = calculateP2nd(69.474, 97, 0.8722);
    expect(result).toBeCloseTo(0.2507, 3);
  });

  test('Ecuador P(2nd) in Group E = ~35.31%', () => {
    const result = calculateP2nd(18.947, 88, 0.4122);
    expect(result).toBeCloseTo(0.3531, 3);
  });

  test('USA P(2nd) in Group D = ~29.83%', () => {
    const result = calculateP2nd(43.519, 82, 0.6980);
    expect(result).toBeCloseTo(0.2983, 3);
  });

  test('P(2nd) with auto-calculated alpha matches manual alpha', () => {
    // Germany: verify that passing alpha explicitly vs auto-calculating gives same result
    const withAlpha = calculateP2nd(69.47368421052632, 97, 0.8722466960352422);
    const autoAlpha = calculateP2nd(69.47368421052632, 97);
    expect(autoAlpha).toBeCloseTo(withAlpha, 10);
  });
});

// ============================================================
// P(3rd) Tests
// ============================================================

describe('calculateP3rd', () => {
  test('Germany P(3rd) is small (strong team)', () => {
    const p2nd = calculateP2nd(69.47368421052632, 97);
    const p3rd = calculateP3rd(69.47368421052632, 97, p2nd);
    expect(p3rd).toBeGreaterThan(0);
    expect(p3rd).toBeLessThan(0.1); // Strong teams rarely 3rd
  });

  test('Curacao P(3rd) > P(2nd) (weak team)', () => {
    const p2nd = calculateP2nd(1.0526315789473684, 13);
    const p3rd = calculateP3rd(1.0526315789473684, 13, p2nd);
    expect(p3rd).toBeGreaterThan(p2nd);
  });
});

// ============================================================
// Full Team Probabilities
// ============================================================

describe('calculateTeamProbabilities', () => {
  test('Germany — full probability set', () => {
    const result = calculateTeamProbabilities({
      teamId: 'germany', group: 'E',
      winPct: 69.47368421052632, qualifyPct: 97,
    });
    expect(result.pWin).toBeCloseTo(0.6947368421052631, 10);
    expect(result.pSecond).toBeCloseTo(0.2506650658288088, 10);
    expect(result.alpha).toBeCloseTo(0.8722466960352422, 10);
    expect(result.pQualify).toBeCloseTo(0.97, 2);
  });

  test('Q ≈ P(1st) + P(2nd) + 0.67 * P(3rd) for all teams', () => {
    for (const t of allOracle) {
      const result = calculateTeamProbabilities({
        teamId: t.team, group: 'E' as const,
        winPct: t.W, qualifyPct: t.Q,
      });
      const reconstructedQ = result.pWin + result.pSecond + 0.67 * result.pThird;
      expect(reconstructedQ).toBeCloseTo(t.Q / 100, 6);
    }
  });
});

// ============================================================
// Group-Level Calculations
// ============================================================

describe('calculateGroupProbabilities', () => {
  test('Group E — returns 4 teams sorted by P(2nd) descending', () => {
    const inputs = initialGroupOdds.filter((o) => o.group === 'E');
    const results = calculateGroupProbabilities(inputs);

    expect(results).toHaveLength(4);
    // Ecuador has highest P(2nd), then Germany, then Ivory Coast, then Curacao
    expect(results[0]!.teamId).toBe('ecuador');
    expect(results[1]!.teamId).toBe('germany');
    expect(results[2]!.teamId).toBe('ivory_coast');
    expect(results[3]!.teamId).toBe('curacao');
  });

  test('Group D — USA has highest P(2nd)', () => {
    const inputs = initialGroupOdds.filter((o) => o.group === 'D');
    const results = calculateGroupProbabilities(inputs);

    expect(results[0]!.teamId).toBe('united_states_d');
    expect(results[0]!.pSecond).toBeCloseTo(0.3142686130415988, 10);
  });
});

describe('calculateAllGroupProbabilities', () => {
  test('calculates all 8 groups', () => {
    const result = calculateAllGroupProbabilities(initialGroupOdds);
    expect(Object.keys(result)).toHaveLength(8);
    expect(result['E']).toHaveLength(4);
    expect(result['D']).toHaveLength(4);
  });
});

// ============================================================
// Vig Removal Tests
// ============================================================

describe('removeVig', () => {
  test('Group E vig removal matches spreadsheet', () => {
    const raw = rawYesPrices['E'];
    const result = removeVig(raw);
    expect(result['germany']).toBeCloseTo(69.47368421052632, 6);
    expect(result['ecuador']).toBeCloseTo(18.947368421052634, 6);
    expect(result['ivory_coast']).toBeCloseTo(10.526315789473683, 6);
    expect(result['curacao']).toBeCloseTo(1.0526315789473684, 6);
  });

  test('Group D vig removal matches spreadsheet', () => {
    const raw = rawYesPrices['D'];
    const result = removeVig(raw);
    expect(result['united_states_d']).toBeCloseTo(38.23529411764706, 6);
  });

  test('vig-removed probabilities sum to exactly 100', () => {
    for (const group of ['D', 'E', 'G', 'H', 'I', 'J', 'K', 'L'] as const) {
      const raw = rawYesPrices[group];
      const result = removeVig(raw);
      const sum = Object.values(result).reduce((s, v) => s + v, 0);
      expect(sum).toBeCloseTo(100, 10);
    }
  });
});
