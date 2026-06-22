import type { TeamMarketInputs, KnockoutOdds, TournamentOdds, GroupId } from '@/engine/types';

/**
 * Seed data extracted from FIFA26_Dallas_Games_Predictor_v10or.xlsx
 * Used as fallback when live API data is unavailable.
 *
 * W = vig-removed P(Win group) as percentage
 * Q = P(Qualify from group) as percentage
 */
export const initialGroupOdds: TeamMarketInputs[] = [
  // Group D — feeds M88 (2D side). UEFA Playoff C resolved 2026-03-31: Türkiye in.
  // Numbers below are Kalshi snapshot ~Jun 2026 (USA/TUR/PAR/AUS sum ≈ 102¢ pre-vig).
  { teamId: 'united_states_d', group: 'D', winPct: 38.23529411764706, qualifyPct: 81 },
  { teamId: 'turkiye_d',       group: 'D', winPct: 33.33333333333333, qualifyPct: 78 },
  { teamId: 'paraguay',        group: 'D', winPct: 18.627450980392158, qualifyPct: 66 },
  { teamId: 'australia',       group: 'D', winPct: 9.803921568627452, qualifyPct: 49 },

  // Group E — feeds M78 (2E side)
  { teamId: 'germany',     group: 'E', winPct: 69.47368421052632, qualifyPct: 97 },
  { teamId: 'ecuador',     group: 'E', winPct: 18.947368421052634, qualifyPct: 88 },
  { teamId: 'ivory_coast', group: 'E', winPct: 10.526315789473683, qualifyPct: 73 },
  { teamId: 'curacao',     group: 'E', winPct: 1.0526315789473684, qualifyPct: 13 },

  // Group G — feeds M88 (2G side)
  { teamId: 'belgium',     group: 'G', winPct: 68.68686868686868, qualifyPct: 95 },
  { teamId: 'egypt',       group: 'G', winPct: 18.181818181818183, qualifyPct: 58 },
  { teamId: 'iran',        group: 'G', winPct: 8.080808080808081, qualifyPct: 35 },
  { teamId: 'new_zealand', group: 'G', winPct: 5.05050505050505, qualifyPct: 12 },

  // Group H — feeds M84 (1H side → M93)
  { teamId: 'spain',        group: 'H', winPct: 77.45098039215686, qualifyPct: 98 },
  { teamId: 'uruguay',      group: 'H', winPct: 14.705882352941178, qualifyPct: 72 },
  { teamId: 'saudi_arabia', group: 'H', winPct: 3.9215686274509802, qualifyPct: 22 },
  { teamId: 'cape_verde',   group: 'H', winPct: 3.9215686274509802, qualifyPct: 8 },

  // Group I — feeds M78 (2I side). Intercontinental playoff resolved: Iraq in.
  // Kalshi snapshot ~Jun 2026 (FRA/NOR/SEN/IRQ sum ≈ 102¢ pre-vig).
  { teamId: 'france',  group: 'I', winPct: 64.70588235294117,  qualifyPct: 94 },
  { teamId: 'norway',  group: 'I', winPct: 23.52941176470588,  qualifyPct: 78 },
  { teamId: 'senegal', group: 'I', winPct: 10.784313725490197, qualifyPct: 64 },
  { teamId: 'iraq_i',  group: 'I', winPct: 0.9803921568627451, qualifyPct: 10 },

  // Group J — Dallas group matches; 2J feeds M84 → M93
  { teamId: 'argentina', group: 'J', winPct: 68.80733944954129, qualifyPct: 97 },
  { teamId: 'austria',   group: 'J', winPct: 16.51376146788991, qualifyPct: 74 },
  { teamId: 'jordan',    group: 'J', winPct: 4.587155963302752, qualifyPct: 32 },
  { teamId: 'algeria',   group: 'J', winPct: 10.091743119266056, qualifyPct: 64 },

  // Group K — feeds M83 (2K side → M93). Intercontinental playoff resolved: DR Congo in.
  // Kalshi snapshot ~Jun 2026 (POR/COL/COD/UZB sum ≈ 102¢ pre-vig).
  { teamId: 'portugal',   group: 'K', winPct: 63.725490196078425, qualifyPct: 92 },
  { teamId: 'colombia',   group: 'K', winPct: 30.392156862745097, qualifyPct: 85 },
  { teamId: 'congo_dr_k', group: 'K', winPct: 3.9215686274509802, qualifyPct: 25 },
  { teamId: 'uzbekistan', group: 'K', winPct: 1.9607843137254901, qualifyPct: 29 },

  // Group L — Dallas group match M21; 2L feeds M83 → M93
  { teamId: 'england', group: 'L', winPct: 67.64705882352942, qualifyPct: 94 },
  { teamId: 'croatia', group: 'L', winPct: 21.568627450980394, qualifyPct: 68 },
  { teamId: 'ghana',   group: 'L', winPct: 9.803921568627452, qualifyPct: 28 },
  { teamId: 'panama',  group: 'L', winPct: 0.9803921568627451, qualifyPct: 10 },
];

/** Raw yes prices before vig removal, for reference */
export const rawYesPrices: Record<GroupId, Record<string, number>> = {
  D: { united_states_d: 39, turkiye_d: 34, paraguay: 19, australia: 10 },
  E: { germany: 66, ecuador: 18, ivory_coast: 10, curacao: 1 },
  G: { belgium: 68, egypt: 18, iran: 8, new_zealand: 5 },
  H: { spain: 79, uruguay: 15, saudi_arabia: 4, cape_verde: 4 },
  I: { france: 66, norway: 24, senegal: 11, iraq_i: 1 },
  J: { argentina: 75, austria: 18, jordan: 5, algeria: 11 },
  K: { portugal: 65, colombia: 31, congo_dr_k: 4, uzbekistan: 2 },
  L: { england: 69, croatia: 22, ghana: 10, panama: 1 },
  // Groups not in the prediction model
  A: {}, B: {}, C: {}, F: {},
};

/** Knockout match odds from the spreadsheet ODDS sheet */
export const knockoutOdds: KnockoutOdds[] = [
  {
    matchId: 'M83',
    side1Label: '2K side',
    side1WinPct: 55,
    side2Label: '2L side',
    side2WinPct: 45,
  },
  {
    matchId: 'M84',
    side1Label: '1H side',
    side1WinPct: 45,
    side2Label: '2J side',
    side2WinPct: 55,
  },
];

/** Tournament winner market odds (P(Reach final)) */
export const tournamentOdds: TournamentOdds[] = [
  { teamId: 'spain',       pFinalPct: 15.9, pSemifinalPct: 31.8 },
  { teamId: 'england',     pFinalPct: 13.0, pSemifinalPct: 26.0 },
  { teamId: 'france',      pFinalPct: 12.3, pSemifinalPct: 24.6 },
  { teamId: 'argentina',   pFinalPct: 10.4, pSemifinalPct: 20.8 },
  { teamId: 'brazil',      pFinalPct: 8.6,  pSemifinalPct: 17.2 },
  { teamId: 'portugal',    pFinalPct: 7.3,  pSemifinalPct: 14.6 },
  { teamId: 'germany',     pFinalPct: 5.8,  pSemifinalPct: 11.6 },
  { teamId: 'netherlands', pFinalPct: 3.3,  pSemifinalPct: 6.6 },
  { teamId: 'norway',      pFinalPct: 3.1,  pSemifinalPct: 6.2 },
  { teamId: 'morocco',     pFinalPct: 1.9,  pSemifinalPct: 3.8 },
  { teamId: 'belgium',     pFinalPct: 1.8,  pSemifinalPct: 3.6 },
  { teamId: 'colombia',    pFinalPct: 1.7,  pSemifinalPct: 3.4 },
  { teamId: 'croatia',     pFinalPct: 1.2,  pSemifinalPct: 2.4 },
  { teamId: 'uruguay',     pFinalPct: 1.2,  pSemifinalPct: 2.4 },
  { teamId: 'austria',     pFinalPct: 0.5,  pSemifinalPct: 1.0 },
];

/** Get odds for a specific group */
export function getGroupOdds(group: GroupId): TeamMarketInputs[] {
  return initialGroupOdds.filter((o) => o.group === group);
}

/** Get knockout odds for a specific match */
export function getKnockoutOdds(matchId: string): KnockoutOdds | undefined {
  return knockoutOdds.find((o) => o.matchId === matchId);
}
