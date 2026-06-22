#!/usr/bin/env node
/**
 * Fetch latest Kalshi FIFA odds and write to seed files.
 * Run manually or via GitHub Action daily.
 *
 * Usage: node scripts/fetch-kalshi-seed.js
 * Env: KALSHI_API_KEY (optional — GetMarkets is public)
 */

const fs = require('fs');
const path = require('path');

const KALSHI_BASE = 'https://api.elections.kalshi.com/trade-api/v2';
const GROUPS = ['D', 'E', 'G', 'H', 'I', 'J', 'K', 'L'];
const SEED_DIR = path.join(__dirname, '..', 'src', 'data', 'seed');
const SNAPSHOT_DIR = path.join(SEED_DIR, 'snapshots');

// Team name mapping (Kalshi yes_sub_title → our teamId)
const TEAM_MAP = {
  'United States': 'united_states_d', 'USA': 'united_states_d',
  'Turkiye': 'turkiye_d', 'Türkiye': 'turkiye_d', 'Turkey': 'turkiye_d',
  'Paraguay': 'paraguay', 'Australia': 'australia',
  'Germany': 'germany', 'Ecuador': 'ecuador',
  'Ivory Coast': 'ivory_coast', 'Côte d\'Ivoire': 'ivory_coast',
  'Curaçao': 'curacao', 'Curacao': 'curacao',
  'Belgium': 'belgium', 'Egypt': 'egypt',
  'Iran': 'iran', 'IR Iran': 'iran',
  'New Zealand': 'new_zealand', 'Spain': 'spain', 'Uruguay': 'uruguay',
  'Saudi Arabia': 'saudi_arabia', 'Cape Verde': 'cape_verde', 'Cabo Verde': 'cape_verde',
  'France': 'france', 'Senegal': 'senegal', 'Norway': 'norway', 'Iraq': 'iraq_i',
  'Argentina': 'argentina', 'Austria': 'austria', 'Jordan': 'jordan',
  'Algeria': 'algeria', 'Portugal': 'portugal', 'Colombia': 'colombia',
  'Uzbekistan': 'uzbekistan', 'Congo DR': 'congo_dr_k', 'DR Congo': 'congo_dr_k',
  'England': 'england', 'Croatia': 'croatia',
  'Ghana': 'ghana', 'Panama': 'panama',
  'Netherlands': 'netherlands', 'Japan': 'japan',
  'Brazil': 'brazil', 'Morocco': 'morocco', 'Mexico': 'mexico',
};

// TBD consolidation: playoff candidates → TBD slot
// (All four playoffs resolved: Türkiye/Group D, Iraq/Group I, DR Congo/Group K.)
const TBD_CANDIDATES = {};

// Q% (qualifying) from initial seed — Kalshi doesn't have per-group qualifying markets
const QUALIFY_MAP = {
  'united_states_d': 81, 'turkiye_d': 78, 'paraguay': 66, 'australia': 49,
  'germany': 97, 'ecuador': 88, 'ivory_coast': 73, 'curacao': 13,
  'belgium': 95, 'egypt': 58, 'iran': 35, 'new_zealand': 12,
  'spain': 98, 'uruguay': 72, 'saudi_arabia': 22, 'cape_verde': 8,
  'france': 94, 'senegal': 64, 'norway': 78, 'iraq_i': 10,
  'argentina': 97, 'austria': 74, 'jordan': 32, 'algeria': 64,
  'portugal': 92, 'colombia': 85, 'uzbekistan': 29, 'congo_dr_k': 25,
  'england': 94, 'croatia': 68, 'ghana': 28, 'panama': 10,
};

async function fetchGroup(group) {
  const url = `${KALSHI_BASE}/markets?event_ticker=KXWCGROUPWIN-26${group}&limit=20`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      console.warn(`  Group ${group}: HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.markets || []).filter(m => m.status === 'active');
  } catch (err) {
    console.warn(`  Group ${group}: fetch error — ${err.message}`);
    return [];
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('Fetching Kalshi FIFA odds...');
  const allTeams = [];

  for (const group of GROUPS) {
    await sleep(200); // Rate limit protection
    const markets = await fetchGroup(group);
    if (markets.length === 0) {
      console.warn(`  Group ${group}: no markets found`);
      continue;
    }

    // Get prices
    const priced = markets.map(m => ({
      name: m.yes_sub_title || m.subtitle || m.ticker.split('-').pop(),
      price: m.last_price > 0 ? m.last_price : m.yes_bid > 0 ? m.yes_bid : 0,
    }));

    // Consolidate TBD candidates into TBD slots, then normalize
    const consolidated = {}; // teamId → price
    const tbdPrices = {};    // tbdId → accumulated price

    for (const m of priced) {
      const teamId = TEAM_MAP[m.name];
      if (teamId) {
        // Known team
        consolidated[teamId] = (consolidated[teamId] || 0) + m.price;
      } else if (TBD_CANDIDATES[m.name]) {
        // Playoff candidate → consolidate into TBD slot
        const tbdId = TBD_CANDIDATES[m.name];
        tbdPrices[tbdId] = (tbdPrices[tbdId] || 0) + m.price;
      } else {
        console.warn(`  Unknown team: ${m.name} in Group ${group}`);
      }
    }

    // Merge TBD slots into consolidated
    for (const [tbdId, price] of Object.entries(tbdPrices)) {
      consolidated[tbdId] = (consolidated[tbdId] || 0) + price;
    }

    // Normalize across ALL consolidated teams (known + TBD)
    const total = Object.values(consolidated).reduce((s, p) => s + p, 0);

    for (const [teamId, price] of Object.entries(consolidated)) {
      allTeams.push({
        teamId,
        group,
        winPct: total > 0 ? (price / total) * 100 : 0,
        qualifyPct: QUALIFY_MAP[teamId] || 50,
        rawPrice: price,
      });
    }

    console.log(`  Group ${group}: ${markets.length} teams, total ${total}¢`);
  }

  if (allTeams.length === 0) {
    console.error('No data fetched. Aborting.');
    process.exit(1);
  }

  // Compute predictions (simplified — just top matchup per Dallas match)
  const alpha = (W) => 3 * W / (100 + 2 * W);
  const p2nd = (W, Q) => {
    const a = alpha(W);
    const rem = Q - W;
    return a * (rem / 100) / (0.67 + 0.33 * a);
  };

  const groupTeams = {};
  for (const t of allTeams) {
    if (!groupTeams[t.group]) groupTeams[t.group] = [];
    groupTeams[t.group].push({ ...t, pSecond: p2nd(t.winPct, t.qualifyPct) });
  }

  // Generate top matchups for Dallas R32 matches
  function topMatchup(g1, g2, matchId) {
    const s1 = groupTeams[g1] || [];
    const s2 = groupTeams[g2] || [];
    const matchups = [];
    for (const a of s1) {
      for (const b of s2) {
        matchups.push({
          team1: a.teamId, team2: b.teamId,
          p1: a.pSecond, p2: b.pSecond,
          combined: a.pSecond * b.pSecond,
        });
      }
    }
    matchups.sort((a, b) => b.combined - a.combined);
    return matchups.slice(0, 5).map((m, i) => ({ ...m, rank: i + 1, matchId }));
  }

  const predictions = {
    M78: topMatchup('E', 'I', 'M78'),
    M88: topMatchup('D', 'G', 'M88'),
  };

  const today = new Date().toISOString().slice(0, 10);
  const snapshot = {
    timestamp: new Date().toISOString(),
    date: today,
    source: 'kalshi',
    teams: allTeams,
    predictions,
  };

  // Write files
  fs.mkdirSync(SEED_DIR, { recursive: true });
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

  const latestPath = path.join(SEED_DIR, 'latest.json');
  const snapshotPath = path.join(SNAPSHOT_DIR, `${today}.json`);

  fs.writeFileSync(latestPath, JSON.stringify(snapshot, null, 2));
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));

  console.log(`\nWritten:`);
  console.log(`  ${latestPath}`);
  console.log(`  ${snapshotPath}`);
  console.log(`  ${allTeams.length} teams across ${GROUPS.length} groups`);

  // Cleanup: delete snapshots older than 90 days
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  for (const file of fs.readdirSync(SNAPSHOT_DIR)) {
    const dateStr = file.replace('.json', '');
    const fileDate = new Date(dateStr).getTime();
    if (fileDate && fileDate < cutoff) {
      fs.unlinkSync(path.join(SNAPSHOT_DIR, file));
      console.log(`  Deleted old snapshot: ${file}`);
    }
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
