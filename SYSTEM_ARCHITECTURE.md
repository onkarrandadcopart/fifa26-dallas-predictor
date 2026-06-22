# FIFA 26 Dallas Predictor — System Architecture & Data Flow

## What This Tool Does

Predicts which teams will play in 8 Dallas-hosted FIFA World Cup 2026 matches at AT&T Stadium. Powered by live prediction market data from Kalshi and Polymarket. Built for Copart VPs to decide which clients to invite to each match.

---

## End-to-End Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL DATA SOURCES                       │
├────────────────────┬────────────────────┬───────────────────────┤
│   Kalshi API       │   Kalshi API       │   Polymarket API      │
│   KXWCGROUPWIN     │   KXWCGROUPQUAL    │   gamma-api           │
│   (Group Winner)   │   (Qualifying)     │   (Group Winner)      │
│   → W% per team    │   → Q% per team    │   → W% cross-check   │
└────────┬───────────┴────────┬───────────┴───────────┬───────────┘
         │                    │                       │
         ▼                    ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              VERCEL EDGE FUNCTIONS (api/odds/)                  │
│                                                                 │
│  /api/odds/kalshi      → Fetches from Kalshi, normalizes       │
│  /api/odds/polymarket  → Fetches from Polymarket, normalizes   │
│                                                                 │
│  • No auth needed (both APIs are public for reads)             │
│  • Cursor pagination to get ALL markets                         │
│  • Price extraction: yes_bid_dollars/yes_ask_dollars midpoint   │
│  • Vig removal: divide each price by sum → true probability    │
│  • Team name extraction from yes_sub_title                     │
│  • 5-min CDN cache (s-maxage=300)                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          FOUR-LAYER DATA FALLBACK CHAIN (data-source.ts)       │
│                                                                 │
│  Layer 1: Live Kalshi API (via edge function, 5-min poll)      │
│  Layer 2: Vercel Edge Cache (transparent, s-maxage=300)        │
│  Layer 3: Browser localStorage (last-known-good)               │
│  Layer 4: Seed JSON (bundled in repo, ultimate fallback)       │
│                                                                 │
│  Fetches BOTH W% (group winner) and Q% (qualifying) in        │
│  parallel. Maps Kalshi team names → internal teamIds.          │
│  Outputs: TeamMarketInputs[] with { teamId, group, W%, Q% }   │
│                                                                 │
│  DataSourceBadge shows: 🟢 Kalshi Live · Just now              │
│                         🟡 Local Cache · 3h ago                │
│                         🔴 Seed Data · 27d ago                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PROBABILITY ENGINE (engine/)                   │
│                                                                 │
│  INPUT per team:  W% (win group)  +  Q% (qualify from group)  │
│                                                                 │
│  Step 1: Alpha (strength factor)                               │
│    alpha = 3 × W / (100 + 2 × W)                              │
│    Measures: "if this team doesn't win, how likely are they    │
│    to be 2nd vs 3rd?"                                          │
│    Germany α=0.87 (strong), Curacao α=0.03 (weak)              │
│                                                                 │
│  Step 2: P(2nd in group)                                       │
│    remaining = max(0, (Q - W) / 100)                           │
│    P(2nd) = alpha × remaining / (0.67 + 0.33 × alpha)         │
│    The 0.67 = 8/12 third-place teams qualify in 48-team format │
│                                                                 │
│  Step 3: P(3rd in group)                                       │
│    P(3rd) = max(0, (remaining - P(2nd)) / 0.67)               │
│                                                                 │
│  Step 4: Matchup Combinations                                  │
│    For "2E vs 2I" (M78):                                       │
│    For each team_a in Group E × each team_b in Group I:        │
│      P(matchup) = P(team_a = 2nd in E) × P(team_b = 2nd in I)│
│    4×4 = 16 combinations, ranked by combined probability       │
│                                                                 │
│  Step 5: Knockout Propagation                                  │
│    M93 (R16) = Winner M83 × Winner M84                        │
│      M83 winners: P(team in slot) × knockout win rate (55/45)  │
│      M84 winners: P(team in slot) × knockout win rate (45/55)  │
│    M101 (SF): Uses tournament winner market directly           │
│      P(Reach SF) = 2 × P(Reach Final) from KXMENWORLDCUP      │
│                                                                 │
│  OUTPUT: DallasPredictions                                     │
│    .m78[]   — 16 matchup combos ranked by probability          │
│    .m88[]   — 16 matchup combos                                │
│    .m93[]   — 64 matchup combos (two-layer)                    │
│    .m101[]  — 20 semifinal matchup combos                      │
│    .groups  — P(Win), P(2nd), P(3rd), alpha per team per group │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DASHBOARD UI (React)                        │
│                                                                 │
│  Dashboard Tab:                                                │
│    Left: 8 Dallas match selector with flags + top prediction   │
│    Center: Hero card (biggest matchup + giant %) + full table  │
│                                                                 │
│  Odds Tab:                                                     │
│    Seed vs Kalshi vs Polymarket side-by-side per group          │
│    Spread column highlights disagreements >3%                   │
│                                                                 │
│  Scenarios Tab:                                                │
│    Lock teams → instant recalculation → impact on all 4 matches│
│    Save/Load/Share via URL                                      │
│                                                                 │
│  Executive Tab:                                                │
│    Print-ready one-pager with all 8 matches + star power tags  │
│                                                                 │
│  Movement Tab:                                                 │
│    Prediction shift tracking with severity (critical/notable)   │
│                                                                 │
│  Clients Tab:                                                  │
│    Assign clients to matches, notes, .ics calendar export      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Kalshi API Integration Detail

### Base URL
```
https://api.elections.kalshi.com/trade-api/v2
```
No authentication needed — GetMarkets is a public endpoint.

### Markets We Fetch

| Series Ticker | Event Pattern | What It Provides | How We Use It |
|---------------|--------------|------------------|---------------|
| `KXWCGROUPWIN` | `KXWCGROUPWIN-26D` through `26L` | P(Win Group) per team | **W%** — primary input to alpha and P(2nd) |
| `KXWCGROUPQUAL` | `KXWCGROUPQUAL-26D` through `26L` | P(Qualify from Group) per team | **Q%** — feeds remaining = Q-W for P(2nd) |
| `KXMENWORLDCUP` | `KXMENWORLDCUP-26` | P(Win Tournament) per team | **P(Final)** → P(SF) = 2×P(Final) for M101 |
| `KXWCROUND` | `KXWCROUND-26SEMI` | P(Reach Semifinal) per team | Cross-reference for M101 predictions |

### Price Extraction (from each market object)

```
Priority 1: yes_bid_dollars + yes_ask_dollars → midpoint × 100
            e.g. bid="0.66", ask="0.71" → (0.66+0.71)/2 × 100 = 68.5¢

Priority 2: last_price_dollars × 100
            e.g. "0.71" → 71¢

Priority 3: last_price (integer cents, DEPRECATED Jan 15 2026)
            e.g. 71

Priority 4: yes_bid (integer cents)
```

Midpoint is preferred because last_price can be stale (from the last trade which may have been hours ago on illiquid markets).

### Vig Removal

Raw Kalshi prices sum to ~97-116¢ depending on the group (overround from bid-ask spreads). We normalize:

```
Team_NormPct = (Team_Price / Sum_All_Prices) × 100

Example Group E:
  Germany 68.5 + Ecuador 19.5 + Ivory Coast 10.5 + Curacao 1.0 = 99.5
  Germany normalized = 68.5 / 99.5 × 100 = 68.8%
```

### Cursor Pagination

```
Request 1: /markets?event_ticker=KXWCGROUPWIN-26D&limit=200
Response:  { markets: [...], cursor: "abc" }

Request 2: /markets?event_ticker=KXWCGROUPWIN-26D&limit=200&cursor=abc
Response:  { markets: [...], cursor: "" }  ← done
```

Loops until cursor is empty. Ensures we get ALL teams even in groups with 7+ candidates (playoff slots).

### Team Name Mapping

Kalshi `yes_sub_title` → our `teamId`:
```
"USA"           → united_states_d
"IR Iran"       → iran
"Curaçao"       → curacao
"Côte d'Ivoire" → ivory_coast
"Turkiye"       → null (skipped, not in our model — playoff candidate)
```

Full mapping in `src/data/teams.ts → spreadsheetNameToId`.

---

## Seed Data

### What It Is
A snapshot of Kalshi prices from the original Excel spreadsheet (Feb 2026). Stored in `src/data/initial-odds.ts` as a hardcoded array of `{ teamId, group, winPct, qualifyPct }`.

### When It's Used
Only when ALL higher layers fail:
1. ❌ Kalshi API unreachable (Vercel edge function fails)
2. ❌ Edge cache expired
3. ❌ Browser localStorage empty (first visit, cleared cache)
4. ✅ → Fall back to seed

The DataSourceBadge on the dashboard shows 🔴 **Seed Data** when this happens.

### How It's Refreshed
`node scripts/fetch-kalshi-seed.cjs` — fetches live Kalshi data, writes to `src/data/seed/latest.json` and dated snapshots. Can run manually or via GitHub Action daily at 10am UTC.

---

## Probability Engine Math Summary

### Inputs (per team)
- **W%**: P(Win Group) — from Kalshi `KXWCGROUPWIN`
- **Q%**: P(Qualify from Group) — from Kalshi `KXWCGROUPQUAL` (or seed fallback)

### Outputs (per team)
- **P(1st)** = W / 100
- **Alpha** = 3W / (100 + 2W) — strength factor
- **P(2nd)** = alpha × max(0, (Q-W)/100) / (0.67 + 0.33 × alpha)
- **P(3rd)** = max(0, (remaining - P(2nd)) / 0.67)

### Dallas Match Predictions
- **M78** (R32, Jun 30): 2nd Group E × 2nd Group I → 16 combinations
- **M88** (R32, Jul 3): 2nd Group D × 2nd Group G → 16 combinations
- **M93** (R16, Jul 6): Winner M83 × Winner M84 → 64 combinations (two-layer)
- **M101** (SF, Jul 14): Tournament winner market → P(SF) = 2 × P(Final)

### Negative Probability Guard
If W% > Q% (stale Q% data), `remaining` would go negative. All calculations are clamped with `Math.max(0, ...)` to prevent negative probabilities.

---

## File Map

```
api/                              ← Vercel Edge Functions
  odds/kalshi.ts                  ← Kalshi proxy (4 market types)
  odds/polymarket.ts              ← Polymarket proxy (3 market types)
  scores/live.ts                  ← Live match scores proxy

src/
  engine/                         ← Probability math (pure, tested)
    probability.ts                ← Alpha, P(2nd), P(3rd) formulas
    matchups.ts                   ← Matchup combination generator
    knockout.ts                   ← M93 two-layer, M101 semifinal
    predictions.ts                ← Orchestrator — one call computes all
    movement.ts                   ← Prediction change detection
    types.ts                      ← All TypeScript interfaces
    __tests__/                    ← 118 tests

  api/                            ← Client-side API layer
    data-source.ts                ← Four-layer fallback chain
    kalshi.ts                     ← Kalshi fetch functions
    polymarket.ts                 ← Polymarket fetch functions
    hooks.ts                      ← TanStack Query hooks + polling
    types.ts                      ← API response types

  data/                           ← Static/seed data
    initial-odds.ts               ← Seed W%/Q% (ultimate fallback)
    teams.ts                      ← 48 teams + name mapping
    dallas-matches.ts             ← 8 AT&T Stadium matches
    groups.ts                     ← Group compositions
    seed/latest.json              ← Most recent Kalshi seed dump

  components/                     ← React UI
    dashboard/                    ← Main prediction view
    odds/                         ← Market comparison table
    scenarios/                    ← What-if modeler
    executive/                    ← VP print-ready summary
    movement/                     ← Prediction change log
    clients/                      ← Client assignment tracker

  store/                          ← Zustand state
    scenario-store.ts             ← Saved scenarios (localStorage)
    movement-store.ts             ← Movement events (localStorage)
    theme-store.ts                ← Dark/light toggle

scripts/
  fetch-kalshi-seed.cjs           ← Seed refresh script

.github/workflows/
  refresh-odds.yml                ← Daily seed auto-refresh
```

---

## Deployment

- **Hosting**: Vercel (auto-detects Vite + /api/ edge functions)
- **URL**: https://fifa26-dallas-predictor.vercel.app
- **Deploy**: `vercel --prod` from project root
- **Env vars**: `KALSHI_API_KEY` (optional), `FOOTBALL_DATA_API_KEY` (optional)
- **Edge functions**: Run at Vercel edge, no cold start, 5-min CDN cache
