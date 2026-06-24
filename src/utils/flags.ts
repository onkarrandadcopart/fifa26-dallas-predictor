/** ISO 3166-1 alpha-2 code mapping for flag CDN */
const isoMap: Record<string, string> = {
  // ── Dallas-relevant groups ──────────────────────────────────
  united_states_d: 'us',
  usa: 'us',
  paraguay: 'py',
  australia: 'au',
  turkiye_d: 'tr',
  germany: 'de',
  ecuador: 'ec',
  ivory_coast: 'ci',
  curacao: 'cw',
  belgium: 'be',
  egypt: 'eg',
  iran: 'ir',
  new_zealand: 'nz',
  spain: 'es',
  uruguay: 'uy',
  saudi_arabia: 'sa',
  cape_verde: 'cv',
  france: 'fr',
  senegal: 'sn',
  norway: 'no',
  iraq_i: 'iq',
  argentina: 'ar',
  austria: 'at',
  jordan: 'jo',
  algeria: 'dz',
  portugal: 'pt',
  colombia: 'co',
  uzbekistan: 'uz',
  congo_dr_k: 'cd',
  england: 'gb-eng',
  croatia: 'hr',
  ghana: 'gh',
  panama: 'pa',
  // ── Other FIFA 2026 participating nations ───────────────────
  netherlands: 'nl',
  japan: 'jp',
  costa_rica: 'cr',
  morocco: 'ma',
  peru: 'pe',
  brazil: 'br',
  serbia: 'rs',
  mexico: 'mx',
  switzerland: 'ch',
  canada: 'ca',
  qatar: 'qa',
  scotland: 'gb-sct',
  wales: 'gb-wls',
  haiti: 'ht',
  venezuela: 've',
  jamaica: 'jm',
  honduras: 'hn',
  el_salvador: 'sv',
  cuba: 'cu',
  trinidad_tobago: 'tt',
  'trinidad_&_tobago': 'tt',
  south_korea: 'kr',
  korea_republic: 'kr',
  indonesia: 'id',
  thailand: 'th',
  bahrain: 'bh',
  china: 'cn',
  philippines: 'ph',
  nigeria: 'ng',
  south_africa: 'za',
  cameroon: 'cm',
  mali: 'ml',
  tunisia: 'tn',
  kenya: 'ke',
  zambia: 'zm',
  ukraine: 'ua',
  romania: 'ro',
  greece: 'gr',
  austria_b: 'at',
  'bosnia-herzegovina': 'ba',
  bosnia_herzegovina: 'ba',
  'bosnia_&_herzegovina': 'ba',
  slovakia: 'sk',
  hungary: 'hu',
  denmark: 'dk',
  sweden: 'se',
  poland: 'pl',
  czechia: 'cz',
  czech_republic: 'cz',
  // ── TBD slots ───────────────────────────────────────────────
  tbd_a3: 'xx',
  tbd_a4: 'xx',
  tbd_b2: 'xx',
  tbd_b3: 'xx',
  tbd_b4: 'xx',
  tbd_c4: 'xx',
  tbd_f4: 'xx',
};

/** Valid flagcdn.com widths */
const VALID_WIDTHS = [20, 40, 80, 160, 320] as const;

/** Snap to nearest valid CDN width (equal or larger) */
function snapWidth(w: number): number {
  for (const v of VALID_WIDTHS) {
    if (v >= w) return v;
  }
  return 320;
}

/** Flag image URL from flagcdn.com CDN */
export function getFlagUrl(teamId: string, width: number = 40): string {
  const w = snapWidth(width);
  const iso = isoMap[teamId];
  if (!iso || iso === 'xx') {
    return `https://flagcdn.com/w${w}/un.png`;
  }
  return `https://flagcdn.com/w${w}/${iso}.png`;
}

/** Get ISO code for a team */
export function getIsoCode(teamId: string): string {
  return isoMap[teamId] ?? 'xx';
}

/** Legacy emoji flag (used by engine internals and tests) */
const emojiMap: Record<string, string> = {
  united_states_d: '\u{1F1FA}\u{1F1F8}',
  usa: '\u{1F1FA}\u{1F1F8}',
  paraguay: '\u{1F1F5}\u{1F1FE}',
  australia: '\u{1F1E6}\u{1F1FA}',
  germany: '\u{1F1E9}\u{1F1EA}',
  ecuador: '\u{1F1EA}\u{1F1E8}',
  ivory_coast: '\u{1F1E8}\u{1F1EE}',
  curacao: '\u{1F3F3}\u{FE0F}',
  belgium: '\u{1F1E7}\u{1F1EA}',
  egypt: '\u{1F1EA}\u{1F1EC}',
  iran: '\u{1F1EE}\u{1F1F7}',
  new_zealand: '\u{1F1F3}\u{1F1FF}',
  spain: '\u{1F1EA}\u{1F1F8}',
  uruguay: '\u{1F1FA}\u{1F1FE}',
  saudi_arabia: '\u{1F1F8}\u{1F1E6}',
  cape_verde: '\u{1F1E8}\u{1F1FB}',
  france: '\u{1F1EB}\u{1F1F7}',
  senegal: '\u{1F1F8}\u{1F1F3}',
  norway: '\u{1F1F3}\u{1F1F4}',
  argentina: '\u{1F1E6}\u{1F1F7}',
  austria: '\u{1F1E6}\u{1F1F9}',
  jordan: '\u{1F1EF}\u{1F1F4}',
  algeria: '\u{1F1E9}\u{1F1FF}',
  portugal: '\u{1F1F5}\u{1F1F9}',
  colombia: '\u{1F1E8}\u{1F1F4}',
  uzbekistan: '\u{1F1FA}\u{1F1FF}',
  england: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
  croatia: '\u{1F1ED}\u{1F1F7}',
  ghana: '\u{1F1EC}\u{1F1ED}',
  panama: '\u{1F1F5}\u{1F1E6}',
  netherlands: '\u{1F1F3}\u{1F1F1}',
  japan: '\u{1F1EF}\u{1F1F5}',
  morocco: '\u{1F1F2}\u{1F1E6}',
  brazil: '\u{1F1E7}\u{1F1F7}',
  mexico: '\u{1F1F2}\u{1F1FD}',
  turkiye_d: '\u{1F1F9}\u{1F1F7}',
  iraq_i: '\u{1F1EE}\u{1F1F6}',
  congo_dr_k: '\u{1F1E8}\u{1F1E9}',
  peru: '\u{1F1F5}\u{1F1EA}',
  serbia: '\u{1F1F7}\u{1F1F8}',
  costa_rica: '\u{1F1E8}\u{1F1F7}',
};

export function getFlag(teamId: string): string {
  return emojiMap[teamId] ?? '\u{1F3F3}\u{FE0F}';
}
