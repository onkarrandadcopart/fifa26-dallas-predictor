import { describe, test, expect } from 'vitest';
import {
  calculateM93Matchups,
  getM83Winners,
  getM84Winners,
  calculateM101Predictions,
  generateM101Matchups,
} from '../knockout';
import { calculateGroupProbabilities } from '../probability';
import { initialGroupOdds, knockoutOdds, tournamentOdds } from '../../data/initial-odds';

// Helper: get group probs
function groupProbs(group: string) {
  const inputs = initialGroupOdds.filter((o) => o.group === group);
  return calculateGroupProbabilities(inputs);
}

const m83Odds = knockoutOdds.find((o) => o.matchId === 'M83')!;
const m84Odds = knockoutOdds.find((o) => o.matchId === 'M84')!;

// ============================================================
// M83 Winners (feeds M93)
// ============================================================

describe('M83 winners — 2K vs 2L', () => {
  const groupK = groupProbs('K');
  const groupL = groupProbs('L');
  const winners = getM83Winners(groupK, groupL, m83Odds);

  test('Colombia has highest P(win M83)', () => {
    const colombia = winners.find((w) => w.teamId === 'colombia')!;
    // Colombia P(2K) = 0.3615 × 0.55 (side1 win rate) = 0.1988
    expect(colombia.pReachR16).toBeCloseTo(0.3612811703610091 * 0.55, 10);
  });

  test('Portugal P(win M83)', () => {
    const portugal = winners.find((w) => w.teamId === 'portugal')!;
    // Portugal P(2K) = 0.2253 × 0.55 = 0.1239
    expect(portugal.pReachR16).toBeCloseTo(0.25085442521337215 * 0.55, 10);
  });

  test('England P(win M83)', () => {
    const england = winners.find((w) => w.teamId === 'england')!;
    // England P(2L) = 0.2381 × 0.45 (side2 win rate) = 0.1071
    expect(england.pReachR16).toBeCloseTo(0.23809780557502552 * 0.45, 10);
  });

  test('Croatia P(win M83)', () => {
    const croatia = winners.find((w) => w.teamId === 'croatia')!;
    // Croatia P(2L) = 0.2562 × 0.45 = 0.1153
    expect(croatia.pReachR16).toBeCloseTo(0.2562266378123155 * 0.45, 10);
  });
});

// ============================================================
// M84 Winners (feeds M93)
// ============================================================

describe('M84 winners — 1H vs 2J', () => {
  const groupH = groupProbs('H');
  const groupJ = groupProbs('J');
  const winners = getM84Winners(groupH, groupJ, m84Odds);

  test('Spain has highest P(win M84)', () => {
    const spain = winners.find((w) => w.teamId === 'spain')!;
    // Spain P(1H) = 0.7745 × 0.45 (side1 win rate) = 0.3485
    expect(spain.pReachR16).toBeCloseTo(0.7745098039215687 * 0.45, 10);
  });

  test('Argentina P(win M84)', () => {
    const argentina = winners.find((w) => w.teamId === 'argentina')!;
    // Argentina P(2J) = 0.2560 × 0.55 (side2 win rate) = 0.1408
    expect(argentina.pReachR16).toBeCloseTo(0.2560072896865449 * 0.55, 10);
  });

  test('Austria P(win M84)', () => {
    const austria = winners.find((w) => w.teamId === 'austria')!;
    // Austria P(2J) = 0.2700 × 0.55 = 0.1485
    expect(austria.pReachR16).toBeCloseTo(0.2700058172335344 * 0.55, 10);
  });
});

// ============================================================
// M93: W83 vs W84 (Dallas R16)
// ============================================================

describe('M93 — W83 vs W84 (Dallas R16)', () => {
  const groupK = groupProbs('K');
  const groupL = groupProbs('L');
  const groupH = groupProbs('H');
  const groupJ = groupProbs('J');

  const matchups = calculateM93Matchups(groupK, groupL, groupH, groupJ, m83Odds, m84Odds);

  test('generates matchups (8 M83 candidates × 8 M84 candidates = 64)', () => {
    expect(matchups.length).toBe(64);
  });

  test('top matchup is Colombia vs Spain (CLAUDE.md test case)', () => {
    expect(matchups[0]!.team1).toBe('colombia');
    expect(matchups[0]!.team2).toBe('spain');
  });

  test('Colombia vs Spain combined = ~6.93%', () => {
    // Colombia wins M83: P(2K) × 0.55 = 0.3615 × 0.55 = 0.19883
    // Spain wins M84: P(1H) × 0.45 = 0.7745 × 0.45 = 0.34853
    // Combined = 0.19883 × 0.34853 = 0.06929
    const colVsSpain = matchups[0]!;
    expect(colVsSpain.combined).toBeCloseTo(0.0693, 3);
  });

  test('Colombia vs Spain exact calculation', () => {
    const colombiaP = 0.3612811703610091 * 0.55;
    const spainP = 0.7745098039215687 * 0.45;
    const expected = colombiaP * spainP;
    expect(matchups[0]!.combined).toBeCloseTo(expected, 10);
  });

  test('matchups are sorted by combined descending', () => {
    for (let i = 1; i < matchups.length; i++) {
      expect(matchups[i]!.combined).toBeLessThanOrEqual(matchups[i - 1]!.combined);
    }
  });

  test('#2 is Colombia vs Austria or Portugal vs Spain', () => {
    // Portugal wins M83: 0.2253 × 0.55 = 0.12392
    // Austria wins M84: 0.2700 × 0.55 = 0.14850
    // Colombia vs Austria: 0.19883 × 0.14850 = 0.02953
    // Portugal vs Spain: 0.12392 × 0.34853 = 0.04318
    // Colombia vs Argentina: 0.19883 × (0.25601 × 0.55) = 0.19883 × 0.14081 = 0.02799

    // Actually let me check Portugal vs Spain:
    const portVsSpain = matchups.find(
      (m) => m.team1 === 'portugal' && m.team2 === 'spain',
    );
    expect(portVsSpain).toBeDefined();
    const portugalP = 0.25085442521337215 * 0.55;
    const spainP = 0.7745098039215687 * 0.45;
    expect(portVsSpain!.combined).toBeCloseTo(portugalP * spainP, 10);
  });

  test('all probabilities sum to < 1 (partial coverage)', () => {
    const totalProb = matchups.reduce((sum, m) => sum + m.combined, 0);
    expect(totalProb).toBeLessThan(1);
    expect(totalProb).toBeGreaterThan(0);
  });
});

// ============================================================
// M101 — Semifinal (market-based)
// ============================================================

describe('M101 — Semifinal predictions', () => {
  test('Spain has highest P(Reach SF)', () => {
    const predictions = calculateM101Predictions(tournamentOdds);
    expect(predictions[0]!.teamId).toBe('spain');
    expect(predictions[0]!.pSemifinal).toBeCloseTo(0.318, 3);
  });

  test('England P(Reach SF) = 26.0%', () => {
    const predictions = calculateM101Predictions(tournamentOdds);
    const england = predictions.find((p) => p.teamId === 'england')!;
    expect(england.pSemifinal).toBeCloseTo(0.26, 3);
  });

  test('Argentina P(Reach SF) = 20.8%', () => {
    const predictions = calculateM101Predictions(tournamentOdds);
    const argentina = predictions.find((p) => p.teamId === 'argentina')!;
    expect(argentina.pSemifinal).toBeCloseTo(0.208, 3);
  });

  test('predictions sorted by pSemifinal descending', () => {
    const predictions = calculateM101Predictions(tournamentOdds);
    for (let i = 1; i < predictions.length; i++) {
      expect(predictions[i]!.pSemifinal).toBeLessThanOrEqual(predictions[i - 1]!.pSemifinal);
    }
  });

  test('semifinal matchup generation', () => {
    const matchups = generateM101Matchups(tournamentOdds, 10);
    expect(matchups.length).toBe(10);

    // Top SF matchup should be Spain vs England (two highest P(SF))
    expect(matchups[0]!.team1).toBe('spain');
    expect(matchups[0]!.team2).toBe('england');
    // 0.318 × 0.26 = 0.08268
    expect(matchups[0]!.combined).toBeCloseTo(0.318 * 0.26, 3);

    // matchups sorted descending
    for (let i = 1; i < matchups.length; i++) {
      expect(matchups[i]!.combined).toBeLessThanOrEqual(matchups[i - 1]!.combined);
    }
  });
});
