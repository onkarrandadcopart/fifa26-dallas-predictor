import type { Team, GroupId, Confederation } from '@/engine/types';

function t(
  id: string,
  name: string,
  group: GroupId,
  flag: string,
  confederation: Confederation,
  fifaRank?: number,
  isTBD?: boolean,
): Team {
  return { id, name, group, flag, confederation, fifaRank, isTBD };
}

/** All 48 teams in the tournament, organized by group */
export const teams: Team[] = [
  // Group A
  t('morocco', 'Morocco', 'A', '\u{1F1F2}\u{1F1E6}', 'CAF', 14),
  t('peru', 'Peru', 'A', '\u{1F1F5}\u{1F1EA}', 'CONMEBOL', 34),
  t('tbd_a3', 'UEFA Playoff A', 'A', '\u{1F3F3}\u{FE0F}', 'UEFA', undefined, true),
  t('tbd_a4', 'TBD A4', 'A', '\u{1F3F3}\u{FE0F}', 'TBD', undefined, true),

  // Group B
  t('mexico', 'Mexico', 'B', '\u{1F1F2}\u{1F1FD}', 'CONCACAF', 15),
  t('tbd_b2', 'TBD B2', 'B', '\u{1F3F3}\u{FE0F}', 'TBD', undefined, true),
  t('tbd_b3', 'TBD B3', 'B', '\u{1F3F3}\u{FE0F}', 'TBD', undefined, true),
  t('tbd_b4', 'TBD B4', 'B', '\u{1F3F3}\u{FE0F}', 'TBD', undefined, true),

  // Group C
  t('usa', 'United States', 'C', '\u{1F1FA}\u{1F1F8}', 'CONCACAF', 11),
  t('serbia', 'Serbia', 'C', '\u{1F1F7}\u{1F1F8}', 'UEFA', 33),
  t('brazil', 'Brazil', 'C', '\u{1F1E7}\u{1F1F7}', 'CONMEBOL', 5),
  t('tbd_c4', 'TBD C4', 'C', '\u{1F3F3}\u{FE0F}', 'TBD', undefined, true),

  // Group D — feeds M88 (2D). UEFA Playoff C resolved 2026-03-31: Türkiye beat Kosovo 1-0.
  t('united_states_d', 'United States', 'D', '\u{1F1FA}\u{1F1F8}', 'CONCACAF', 11),
  t('paraguay', 'Paraguay', 'D', '\u{1F1F5}\u{1F1FE}', 'CONMEBOL', 53),
  t('australia', 'Australia', 'D', '\u{1F1E6}\u{1F1FA}', 'AFC', 25),
  t('turkiye_d', 'Turkiye', 'D', '\u{1F1F9}\u{1F1F7}', 'UEFA', 24),

  // Group E — feeds M78 (2E)
  t('germany', 'Germany', 'E', '\u{1F1E9}\u{1F1EA}', 'UEFA', 8),
  t('ecuador', 'Ecuador', 'E', '\u{1F1EA}\u{1F1E8}', 'CONMEBOL', 32),
  t('ivory_coast', 'Ivory Coast', 'E', '\u{1F1E8}\u{1F1EE}', 'CAF', 44),
  t('curacao', 'Curacao', 'E', '\u{1F3F3}\u{FE0F}', 'CONCACAF', 85),

  // Group F — Dallas group match
  t('netherlands', 'Netherlands', 'F', '\u{1F1F3}\u{1F1F1}', 'UEFA', 3),
  t('japan', 'Japan', 'F', '\u{1F1EF}\u{1F1F5}', 'AFC', 13),
  t('costa_rica', 'Costa Rica', 'F', '\u{1F1E8}\u{1F1F7}', 'CONCACAF', 47),
  t('tbd_f4', 'TBD F4', 'F', '\u{1F3F3}\u{FE0F}', 'TBD', undefined, true),

  // Group G — feeds M88 (2G)
  t('belgium', 'Belgium', 'G', '\u{1F1E7}\u{1F1EA}', 'UEFA', 6),
  t('egypt', 'Egypt', 'G', '\u{1F1EA}\u{1F1EC}', 'CAF', 36),
  t('iran', 'Iran', 'G', '\u{1F1EE}\u{1F1F7}', 'AFC', 21),
  t('new_zealand', 'New Zealand', 'G', '\u{1F1F3}\u{1F1FF}', 'OFC', 93),

  // Group H — feeds M84 (1H → M93)
  t('spain', 'Spain', 'H', '\u{1F1EA}\u{1F1F8}', 'UEFA', 1),
  t('uruguay', 'Uruguay', 'H', '\u{1F1FA}\u{1F1FE}', 'CONMEBOL', 10),
  t('saudi_arabia', 'Saudi Arabia', 'H', '\u{1F1F8}\u{1F1E6}', 'AFC', 60),
  t('cape_verde', 'Cape Verde', 'H', '\u{1F1E8}\u{1F1FB}', 'CAF', 70),

  // Group I — feeds M78 (2I)
  t('france', 'France', 'I', '\u{1F1EB}\u{1F1F7}', 'UEFA', 2),
  t('senegal', 'Senegal', 'I', '\u{1F1F8}\u{1F1F3}', 'CAF', 17),
  t('norway', 'Norway', 'I', '\u{1F1F3}\u{1F1F4}', 'UEFA', 22),
  t('iraq_i', 'Iraq', 'I', '\u{1F1EE}\u{1F1F6}', 'AFC', 58),

  // Group J — Dallas group matches (M43, M70)
  t('argentina', 'Argentina', 'J', '\u{1F1E6}\u{1F1F7}', 'CONMEBOL', 4),
  t('austria', 'Austria', 'J', '\u{1F1E6}\u{1F1F9}', 'UEFA', 23),
  t('jordan', 'Jordan', 'J', '\u{1F1EF}\u{1F1F4}', 'AFC', 68),
  t('algeria', 'Algeria', 'J', '\u{1F1E9}\u{1F1FF}', 'CAF', 37),

  // Group K — feeds M83 (2K → M93)
  t('portugal', 'Portugal', 'K', '\u{1F1F5}\u{1F1F9}', 'UEFA', 7),
  t('colombia', 'Colombia', 'K', '\u{1F1E8}\u{1F1F4}', 'CONMEBOL', 12),
  t('uzbekistan', 'Uzbekistan', 'K', '\u{1F1FA}\u{1F1FF}', 'AFC', 62),
  t('congo_dr_k', 'DR Congo', 'K', '\u{1F1E8}\u{1F1E9}', 'CAF', 64),

  // Group L — Dallas group match (M21), feeds M83 (2L → M93)
  t('england', 'England', 'L', '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}', 'UEFA', 9),
  t('croatia', 'Croatia', 'L', '\u{1F1ED}\u{1F1F7}', 'UEFA', 16),
  t('ghana', 'Ghana', 'L', '\u{1F1EC}\u{1F1ED}', 'CAF', 67),
  t('panama', 'Panama', 'L', '\u{1F1F5}\u{1F1E6}', 'CONCACAF', 50),
];

/** Lookup a team by id */
export function getTeam(id: string): Team | undefined {
  return teams.find((t) => t.id === id);
}

/** Get all teams in a group */
export function getGroupTeams(group: GroupId): Team[] {
  return teams.filter((t) => t.group === group);
}

/**
 * Map from ANY known team name to our internal team id.
 * Includes spreadsheet names, Kalshi yes_sub_title names,
 * Polymarket names, and common aliases.
 */
export const spreadsheetNameToId: Record<string, string> = {
  // Spreadsheet names
  'United States': 'united_states_d',
  // Kalshi / Polymarket aliases
  'USA': 'united_states_d',
  'US': 'united_states_d',
  'Paraguay': 'paraguay',
  'Australia': 'australia',
  'Turkiye': 'turkiye_d',
  'Türkiye': 'turkiye_d',
  'Turkey': 'turkiye_d',
  'Germany': 'germany',
  'Ecuador': 'ecuador',
  'Ivory Coast': 'ivory_coast',
  'Côte d\'Ivoire': 'ivory_coast',
  'Cote d\'Ivoire': 'ivory_coast',
  'Curacao': 'curacao',
  'Curaçao': 'curacao',
  'Belgium': 'belgium',
  'Egypt': 'egypt',
  'Iran': 'iran',
  'IR Iran': 'iran',
  'New Zealand': 'new_zealand',
  'Spain': 'spain',
  'Uruguay': 'uruguay',
  'Saudi Arabia': 'saudi_arabia',
  'KSA': 'saudi_arabia',
  'Cape Verde': 'cape_verde',
  'Cabo Verde': 'cape_verde',
  'France': 'france',
  'Senegal': 'senegal',
  'Norway': 'norway',
  'Iraq': 'iraq_i',
  'Argentina': 'argentina',
  'Austria': 'austria',
  'Jordan': 'jordan',
  'Algeria': 'algeria',
  'Portugal': 'portugal',
  'Colombia': 'colombia',
  'Uzbekistan': 'uzbekistan',
  'Congo DR': 'congo_dr_k',
  'DR Congo': 'congo_dr_k',
  'Congo': 'congo_dr_k',
  'DRC': 'congo_dr_k',
  'England': 'england',
  'Croatia': 'croatia',
  'Ghana': 'ghana',
  'Panama': 'panama',
  'Netherlands': 'netherlands',
  'Japan': 'japan',
  'Morocco': 'morocco',
  'Brazil': 'brazil',
  'Mexico': 'mexico',
  'Peru': 'peru',
  'Serbia': 'serbia',
  'Costa Rica': 'costa_rica',
  'Switzerland': 'switzerland',
  'Canada': 'canada',
  'Qatar': 'qatar',
  'Scotland': 'scotland',
  'Wales': 'wales',
  'Haiti': 'haiti',
  'Venezuela': 'venezuela',
  'Jamaica': 'jamaica',
  'Honduras': 'honduras',
  'El Salvador': 'el_salvador',
  'Cuba': 'cuba',
  'Trinidad & Tobago': 'trinidad_tobago',
  'Trinidad and Tobago': 'trinidad_tobago',
  'Korea Republic': 'south_korea',
  'South Korea': 'south_korea',
  'Indonesia': 'indonesia',
  'Thailand': 'thailand',
  'Bahrain': 'bahrain',
  'China PR': 'china',
  'China': 'china',
  'Philippines': 'philippines',
  'Nigeria': 'nigeria',
  'South Africa': 'south_africa',
  'Cameroon': 'cameroon',
  'Mali': 'mali',
  'Tunisia': 'tunisia',
  'Ukraine': 'ukraine',
  'Romania': 'romania',
  'Bosnia & Herzegovina': 'bosnia-herzegovina',
  'Bosnia-Herzegovina': 'bosnia-herzegovina',
  'Bosnia and Herzegovina': 'bosnia-herzegovina',
  'Slovakia': 'slovakia',
  'Hungary': 'hungary',
  'Denmark': 'denmark',
  'Sweden': 'sweden',
  'Poland': 'poland',
};

/**
 * TBD Consolidation: maps playoff candidate teams to their TBD slot.
 * When processing Kalshi group winner markets, sum all candidates' prices
 * into the TBD slot BEFORE normalizing. This prevents inflated W% for
 * known teams and avoids negative probabilities.
 */
export const TBD_CONSOLIDATION: Record<string, string[]> = {
  // Group D's UEFA Playoff C resolved 2026-03-31 → Türkiye. Slot is now turkiye_d, no consolidation needed.

  // Group I's intercontinental playoff resolved → Iraq. Slot is now iraq_i, no consolidation needed.

  // Group K's intercontinental playoff resolved → DR Congo. Slot is now congo_dr_k, no consolidation needed.
};

/** Reverse lookup: candidate name → TBD slot teamId */
export const CANDIDATE_TO_TBD: Record<string, string> = {};
for (const [tbdId, candidates] of Object.entries(TBD_CONSOLIDATION)) {
  for (const name of candidates) {
    CANDIDATE_TO_TBD[name] = tbdId;
    CANDIDATE_TO_TBD[name.toLowerCase()] = tbdId;
  }
}

/** Tier 1 star power teams for client appeal */
export const STAR_POWER_TIER1 = [
  'argentina', 'spain', 'england', 'france', 'germany', 'brazil',
];

/** Tier 2 high-appeal teams */
export const STAR_POWER_TIER2 = [
  'portugal', 'netherlands', 'belgium', 'colombia', 'uruguay', 'croatia',
];
