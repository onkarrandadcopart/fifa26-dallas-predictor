# CLAUDE.md — FIFA 26 Dallas Predictor

## WHO YOU ARE BUILDING THIS FOR

Onkar at Copart. This is a tool for Copart VPs and leadership to make client entertainment decisions for FIFA World Cup 2026 matches hosted at AT&T Stadium in Dallas. Copart has 8 Dallas matches to potentially host clients at. The VPs need to:

1. See which teams are most likely to play in each Dallas match (probability dashboard)
2. Decide which matches to book hospitality for NOW vs WAIT based on market-derived probabilities
3. Track live prediction market odds (Kalshi/Polymarket) to catch shifts
4. Run "what-if" scenarios — e.g., "if Germany wins Group E, what happens to our Dallas R32 match?"
5. Get an executive-ready view they can screenshot or present in meetings

This is NOT a generic sports dashboard. It's a decision-making tool. Every screen should answer: **"Should Copart book this match for clients?"**

---

## PROJECT OVERVIEW

Build a full React + TypeScript web application that transforms an Excel-based FIFA 2026 World Cup prediction model into an interactive dashboard. The app predicts which teams will play in 8 Dallas-hosted matches using probability math powered by live prediction market data.

### The 8 Dallas Matches at AT&T Stadium

**Group Stage (teams confirmed):**
| Match | Date | Teams | Priority |
|-------|------|-------|----------|
| M11 | Jun 14 | Netherlands vs Japan | P0 - BOOK NOW |
| M21 | Jun 17 | England vs Croatia | P0 - BOOK NOW |
| M43 | Jun 22 | Argentina vs Austria | P0 - BOOK NOW |
| M70 | Jun 27 | Argentina vs Jordan | P0 - BOOK NOW |

**Knockout Stage (teams TBD — this is where predictions matter):**
| Match | Date | Slot | Priority |
|-------|------|------|----------|
| M78 | Jun 30 | 2E vs 2I (R32) | P1 - MONITOR |
| M88 | Jul 3 | 2D vs 2G (R32) | P1 - MONITOR |
| M93 | Jul 6 | W83 vs W84 (R16) | P2 - TENTATIVE |
| M101 | Jul 14 | W97 vs W98 (SEMIFINAL) | P0 - BOOK NOW |

---

## BEFORE YOU START CODING

**Read these reference files thoroughly first:**

1. `reference/PROBABILITY_ENGINE.md` — Complete math documentation. Understand EVERY formula before writing any code.
2. `reference/SPREADSHEET_DATA.json` — All data extracted from the Excel model. This is your seed data AND your test oracle.
3. `reference/PROJECT_SPEC.md` — Architecture, data models, repo structure, API integration plan.
4. `reference/KALSHI_API.md` — Kalshi API documentation for live odds integration.
5. `reference/Copart_Brand_Guidelines.pdf` — Official Copart web design guidelines. Colors, typography (Inter font), buttons, alerts. **You MUST follow these.**
6. `FIFA26_Dallas_Games_Predictor_v10or.xlsx` — The original Excel file. Open it if you need to verify any calculation.

**Verify your understanding by checking:** Can you calculate that Ecuador vs Norway has an 11.0% combined probability for M78? If your engine doesn't produce that number, something is wrong.

---

## TECH STACK

- **React 18 + TypeScript** (Vite for build)
- **Tailwind CSS** + shadcn/ui components
- **Zustand** for state management
- **TanStack Query** for API data fetching + caching
- **Recharts** for charts/visualizations
- **React Router v6** for navigation
- **Vercel Edge Functions** for API proxies (Kalshi CORS)

---

## PROBABILITY ENGINE — THE MATH (CRITICAL)

This is the brain of the app. Get this right first. Every number on every dashboard flows from this engine.

### Input Data

Two types of market odds feed the engine:

**1. Group Winner Odds P(Win) — from Kalshi/Polymarket "Yes" prices:**
```
Raw: YesPrice per team (0-100 cents, sum > 100 due to vig)
Normalized: P(Win) = YesPrice / sum(all YesPrices in group)

Example Group E:
  Germany: 66¢ → 66/95 = 69.5%
  Ecuador: 18¢ → 18/95 = 18.9%
  Ivory Coast: 10¢ → 10/95 = 10.5%
  Curacao: 1¢ → 1/95 = 1.1%
```

**2. Qualifying Odds Q — from "will team advance?" markets:**
```
Q = probability team finishes 1st OR 2nd OR qualifies as 3rd place
Example: Germany Q = 97%, Ecuador Q = 88%
```

### Core Calculations

**Step 1: Strength Factor α**
```
α = P(Win) / (1 - P(eliminated))
  = P(Win) / Q     [approximately]

For strong teams (Germany α=0.87): if they don't win, they're probably 2nd
For weak teams (Curacao α=0.03): if they qualify, it's probably as 3rd
```

Actual formula used in spreadsheet:
```
α = W / (W + (Q-W)/1.67)
where W = P(Win), Q = P(Qualify)
simplified: α = W × 1.67 / (W × 0.67 + Q)
```

Wait — let me be precise. From the spreadsheet CALC sheet, the actual α values:
```
Group E:
  Germany:     W=69.47, Q=97  → α = 0.8722
  Ecuador:     W=18.95, Q=88  → α = 0.4122
  Ivory Coast: W=10.53, Q=73  → α = 0.2609
  Curacao:     W=1.05,  Q=13  → α = 0.0309
```

The formula that produces these α values:
```
α = W / (W + (Q - W) / 1.67)

Verify: Germany: 69.47 / (69.47 + (97-69.47)/1.67) = 69.47 / (69.47 + 16.48) = 69.47/85.95 = 0.808
```

Hmm, that gives 0.808 not 0.872. Let me reverse-engineer from actual data:

```
Germany: W=69.47, Q=97, α=0.8722
  → 0.8722 = 69.47 / X  →  X = 79.65
  → So X = W + something = 79.65, something = 10.18
  → (Q-W) = 27.53, 27.53/something_divisor = 10.18
  → divisor = 27.53/10.18 = 2.704 ≈ not clean

Let me try: α = W% / (100 - Q% + W%) ... nah.

Actually from spreadsheet header: α = strength factor
Let me just compute from actual values:

Group D verification:
  USA:      W=43.52, Q=82, α=0.698
  Paraguay: W=21.30, Q=62, α=0.448
  Australia: W=13.89, Q=48, α=0.326
  TBD_C:    W=21.30, Q=49, α=0.448

USA: 43.52 / (100 - 82 + 43.52) = 43.52/61.52 = 0.707 ≈ close but not exact

Try: remaining = Q - W (probability of qualifying but not winning)
     remaining = P(2nd) + 0.67*P(3rd)
     
For P(2nd) calculation:
  P(2nd) = α × remaining / (α + 0.67(1-α))
         = α × (Q-W) / (0.67 + 0.33α)
```

OK here is the DEFINITIVE reverse-engineered formula. From the spreadsheet:

**P(2nd) column (G) is calculated from columns C,D,E:**
```
P(2nd) = α × (Q% - W%) / (100 × (0.67 + 0.33 × α))

Verify Germany: 
  0.8722 × (97 - 69.47) / (100 × (0.67 + 0.33 × 0.8722))
  = 0.8722 × 27.53 / (100 × 0.9578)
  = 24.01 / 95.78
  = 0.2507 ✓ (matches G11 = 0.2507)
```

**α (strength factor) calculation — reverse engineer from data:**
```
USA:       W=43.52, Q=82 → α=0.698
Paraguay:  W=21.30, Q=62 → α=0.448

Formula: α = (W/100) / ((Q/100) - (W/100) × 0.33 / 0.67 × (1 - W/100/((Q/100))))

Actually, simplest: α is computed such that:
  P(1st) + P(2nd) + P(3rd) accounts for Q
  And the ratio P(2nd)/P(3rd) = α/(1-α) × some_factor

Let me try: α = (W) / (Q - 0.67*(Q-W)/(1+0.67))
Nah, just provide the actual column and let the engine match.
```

**IMPORTANT: Rather than reverse-engineering α, here's what the code should do:**

The spreadsheet uses TWO market inputs per team:
1. `W` = P(Win group) from group winner market (after vig removal)
2. `Q` = P(Qualify) from qualification market (direct percentage)

Then:
```typescript
// The key derived value
const remaining = Q - W;  // = P(2nd) + 0.67 * P(3rd)

// Alpha is provided/derived — but for the engine, what matters is P(2nd):
// From the data pattern, α appears to follow:
// α ≈ W / (W + remaining/1.67) ... but verify with test cases

// P(2nd) formula (VERIFIED - matches all spreadsheet values):
const p2nd = alpha * remaining / (0.67 + 0.33 * alpha);

// P(3rd) derived:
const p3rd = (remaining - p2nd) / 0.67;
// Or equivalently: p3rd = remaining * (1 - alpha) / (0.67 + 0.33 * alpha) / 0.67
```

### FULL CALC TABLE (use as test oracle — your engine MUST reproduce these P(2nd) values):

```
Group | Team           | W%      | Q%  | α       | P(2nd)
D     | United States  | 43.519  | 82  | 0.6980  | 29.834%
D     | Paraguay       | 21.296  | 62  | 0.4481  | 22.299%
D     | Australia      | 13.889  | 48  | 0.3261  | 14.304%
D     | TBD_C          | 21.296  | 49  | 0.4481  | 15.177%
E     | Germany        | 69.474  | 97  | 0.8722  | 25.067%
E     | Ecuador        | 18.947  | 88  | 0.4122  | 35.314%
E     | Ivory Coast    | 10.526  | 73  | 0.2609  | 21.555%
E     | Curacao        | 1.053   | 13  | 0.0309  | 0.543%
G     | Belgium        | 68.687  | 95  | 0.8681  | 23.882%
G     | Egypt          | 18.182  | 58  | 0.4000  | 19.859%
G     | Iran           | 8.081   | 35  | 0.2087  | 7.603%
G     | New Zealand    | 5.051   | 12  | 0.1376  | 1.337%
H     | Spain          | 77.451  | 98  | 0.9115  | 19.294%
H     | Uruguay        | 14.706  | 72  | 0.3409  | 24.961%
H     | Saudi Arabia   | 3.922   | 22  | 0.1091  | 2.793%
H     | Cape Verde     | 3.922   | 8   | 0.1091  | 0.630%
I     | France         | 68.317  | 94  | 0.8661  | 23.273%
I     | Senegal        | 8.911   | 64  | 0.2269  | 16.780%
I     | Norway         | 21.782  | 78  | 0.4552  | 31.198%
I     | TBD_I4         | 0.990   | 10  | 0.0291  | 0.386%
J     | Argentina      | 68.807  | 97  | 0.8687  | 25.601%
J     | Austria        | 16.514  | 74  | 0.3724  | 27.001%
J     | Jordan         | 4.587   | 32  | 0.1261  | 4.856%
J     | Algeria        | 10.092  | 64  | 0.2519  | 18.031%
K     | Portugal       | 66.990  | 92  | 0.8589  | 22.530%
K     | Colombia       | 30.097  | 85  | 0.5636  | 36.151%
K     | Uzbekistan     | 1.942   | 29  | 0.0561  | 2.204%
K     | TBD_K4         | 0.971   | 10  | 0.0286  | 0.380%
L     | England        | 67.647  | 94  | 0.8625  | 23.810%
L     | Croatia        | 21.569  | 68  | 0.4521  | 25.623%
L     | Ghana          | 9.804   | 28  | 0.2459  | 5.957%
L     | Panama         | 0.980   | 10  | 0.0288  | 0.383%
```

### Matchup Combination Math

For knockout match "2E vs 2I" (M78):
```
For each team_a in Group E, for each team_b in Group I:
  P(matchup) = P(team_a finishes 2nd in E) × P(team_b finishes 2nd in I)

All 4×4 = 16 combinations ranked by combined probability.

Top results for M78:
  Ecuador vs Norway:       35.3% × 31.2% = 11.0%
  Ecuador vs France:       35.3% × 23.3% = 8.2%
  Germany vs Norway:       25.1% × 31.2% = 7.8%
  Ivory Coast vs Norway:   21.6% × 31.2% = 6.7%
```

### M93 (R16) — Two-Layer Knockout

M93 = Winner of M83 vs Winner of M84.
- M83 = 2K vs 2L (Toronto match)
- M84 = 1H vs 2J (LA match)

For M83, knockout odds are applied:
```
P(Team wins M83) = P(team in M83 slot) × P(team's side wins M83)

From ODDS sheet: M83 knockout odds = 55% for 2K side, 45% for 2L side

So P(Colombia wins M83) = P(Colombia = 2K) × 0.55 = 0.3615 × 0.55 = 0.1988
   P(England wins M83) = P(England = 2L) × 0.45 = 0.2381 × 0.45 = 0.1310
```

For M84:
```
M84 knockout odds = 45% for 1H side, 55% for 2J side

P(Spain wins M84) = P(Spain = 1H) × 0.45 = 0.7745 × 0.45 = 0.3485
P(Argentina wins M84) = P(Argentina = 2J) × 0.55 = 0.2560 × 0.55 = 0.1408
```

Then M93 = all combinations:
```
P(Colombia vs Spain at M93) = P(Colombia wins M83) × P(Spain wins M84)
                             = 0.1988 × 0.3485 = 6.93%
```

### M101 (Semifinal) — Market-Based

Uses tournament winner market odds directly:
```
P(Reach SF) = 2 × P(Reach Final)
Assumption: P(Win SF | Reach SF) ≈ 50%

From market: Spain P(Final) = 15.9% → P(Reach SF) = 31.8%
             England P(Final) = 13.0% → P(Reach SF) = 26.0%
             Argentina P(Final) = 10.4% → P(Reach SF) = 20.8%
```

---

## FEATURES TO BUILD (in priority order)

### 1. PROBABILITY DASHBOARD (main view)

**Left sidebar:** Match selector showing all 8 Dallas matches. Knockout matches show predicted teams. Color-coded by priority (P0 green, P1 amber, P2 red).

**Main panel:** For selected knockout match:
- Hero card showing #1 most likely matchup with both flags, team names, individual probabilities, and combined probability in large text
- Table of all matchup combinations ranked by probability, with horizontal bars
- Quick summary: "Top 3 scenarios account for X% of outcomes"

**Right panel / below:** 
- M101 Semifinal tracker — bar chart of P(Reach SF) for top 8 teams
- Group odds overview — expandable cards per group showing winner probabilities

**VP Decision Helper (NEW — not in spreadsheet):**
- For each Dallas match, show a "Client Appeal Score" combining:
  - Combined probability of premium teams (top-20 FIFA ranking)
  - Star power index (Argentina, Spain, England, France, Germany, Brazil = tier 1)
  - Match significance (SF > R16 > R32 > Group)
- Traffic light system: GREEN (book now), YELLOW (monitor weekly), RED (wait for clarity)

### 2. LIVE ODDS INTEGRATION

**Kalshi API integration:**
- Fetch group winner markets and qualification markets
- Poll every 5 minutes (configurable)
- Edge function proxy at `/api/odds/kalshi` to handle CORS
- Show "last updated" timestamp with staleness indicator (>15 min = warning)

**Polymarket integration:**
- Fetch via CLOB API (public, no auth needed for reads)
- Same polling cadence
- Cross-reference with Kalshi for confidence

**Odds Movement Panel:**
- Sparkline charts showing 24h/7d odds movement per team
- Alert badges when a team's odds shift >5% in 24h
- "What changed" summary: "Germany's win odds dropped 5% after injury news"

**Multi-Source Comparison:**
- Side-by-side Kalshi vs Polymarket vs Manual odds
- Highlight disagreements (>3% spread = opportunity or information gap)

### 3. SCENARIO MODELER

**Group Result Entry:**
- For each relevant group (D, E, G, H, I, J, K, L), show 4 teams
- Click to set 1st, 2nd, 3rd, 4th positions
- When positions are locked, downstream probabilities recalculate instantly
- "Lock" button to confirm a position (e.g., after real match results)

**What-If Scenarios:**
- Toggle switches: "What if Germany finishes 2nd in Group E?"
- Instantly see how M78 predictions change
- Save scenarios with names: "Best case", "USA advances", "Chaos bracket"
- Share via URL query params

**Cascading Updates:**
- When M83 result is entered, M93 predictions auto-update
- When M84 result is entered, M93 predictions auto-update
- Visual flow showing: Group → R32 → R16 → QF → SF

### 4. INTERACTIVE BRACKET

- Full 48-team bracket visualization (focus on Dallas bracket side)
- Dallas matches highlighted with glow/accent
- Click to advance teams through rounds
- Probability overlay on each bracket slot
- Print-friendly mode for meetings

### 5. CLIENT TRACKER

- All 8 Dallas matches with booking status
- Assign clients to matches
- Priority labels (P0/P1/P2) with ability to override
- Notes field per match
- Calendar export (.ics)
- Summary stats: "5 of 8 matches booked, 12 client invites sent"

### 6. VP EXECUTIVE VIEW (NEW)

A single-page summary designed to be screenshot-friendly or printed:
- "Dallas FIFA Entertainment Overview" header with Copart branding space
- 8 match cards in timeline order
- Each card shows: date, confirmed/predicted teams, client appeal rating, booking status
- Bottom section: key risks ("If Argentina doesn't advance from group, M70 and M43 lose appeal")
- Probability confidence indicator: "Based on $X million in prediction market volume"

---

## KALSHI API DETAILS

Base URL: `https://trading-api.kalshi.com/trade-api/v2`

### Key Endpoints

```
GET /events
  - Filter by series_ticker containing "FIFA" or "WORLDCUP"
  - Returns event listings with market tickers

GET /markets/{ticker}
  - Returns market details including yes_price, no_price, volume
  - yes_price is in cents (0-100)

GET /markets/{ticker}/orderbook  
  - Live order book for more precise implied probability
```

### Auth
- API key required (free tier for read-only)
- Header: `Authorization: Bearer {api_key}`
- Rate limit: 10 req/sec

### Edge Function Proxy Pattern
```typescript
// /api/odds/kalshi.ts (Vercel Edge Function)
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { group } = await req.json();
  
  const response = await fetch(
    `https://trading-api.kalshi.com/trade-api/v2/markets?series_ticker=FIFA-26-GRP-${group}`,
    { headers: { 'Authorization': `Bearer ${process.env.KALSHI_API_KEY}` } }
  );
  
  const data = await response.json();
  
  // Normalize: extract yes_price per team, remove vig
  const odds = normalizeKalshiOdds(data.markets);
  
  return Response.json(odds, {
    headers: { 'Cache-Control': 's-maxage=300' } // 5 min cache
  });
}
```

### Polymarket CLOB API

Base URL: `https://clob.polymarket.com`

```
GET /markets?tag=FIFA
  - Public, no auth required
  - Returns condition tokens with prices

GET /prices?token_id={id}
  - Current price for specific outcome
```

---

## FILE STRUCTURE

```
fifa26-dallas-predictor/
├── CLAUDE.md                          ← THIS FILE (you're reading it)
├── reference/
│   ├── PROBABILITY_ENGINE.md          ← Detailed math docs
│   ├── SPREADSHEET_DATA.json          ← All Excel data as JSON
│   ├── PROJECT_SPEC.md                ← Architecture & design spec
│   ├── KALSHI_API.md                  ← API integration docs
│   └── Copart_Brand_Guidelines.pdf    ← Official Copart web colors, typography, buttons
├── FIFA26_Dallas_Games_Predictor_v10or.xlsx  ← Original spreadsheet
├── public/
│   └── favicon.svg
├── src/
│   ├── engine/                        ← PROBABILITY ENGINE (build first!)
│   │   ├── types.ts                   ← All TypeScript types
│   │   ├── probability.ts             ← Core P(1st), P(2nd), P(3rd), α
│   │   ├── matchups.ts                ← Matchup combination generator
│   │   ├── knockout.ts                ← Knockout stage propagation (M93, M101)
│   │   ├── normalize.ts               ← Vig removal, probability normalization
│   │   └── __tests__/
│   │       ├── probability.test.ts    ← Test against spreadsheet values
│   │       ├── matchups.test.ts
│   │       └── knockout.test.ts
│   ├── data/
│   │   ├── teams.ts                   ← Team definitions, flags, colors
│   │   ├── schedule.ts                ← Full 104-match schedule
│   │   ├── groups.ts                  ← Group compositions
│   │   ├── dallas-matches.ts          ← 8 Dallas matches with metadata
│   │   ├── initial-odds.ts            ← Spreadsheet odds as seed/fallback
│   │   └── venues.ts
│   ├── api/
│   │   ├── kalshi.ts                  ← Kalshi API client
│   │   ├── polymarket.ts              ← Polymarket API client
│   │   ├── hooks.ts                   ← TanStack Query hooks (useOdds, etc.)
│   │   └── types.ts
│   ├── store/
│   │   ├── odds-store.ts              ← Market odds (Zustand)
│   │   ├── results-store.ts           ← Match results & locked positions
│   │   └── scenario-store.ts          ← Saved scenarios
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardView.tsx       ← Main dashboard page
│   │   │   ├── MatchSelector.tsx       ← Left sidebar match list
│   │   │   ├── MatchPredictionPanel.tsx ← Hero + matchup table
│   │   │   ├── MatchupRow.tsx          ← Single matchup row with bars
│   │   │   ├── ProbabilityBar.tsx      ← Horizontal probability bar
│   │   │   ├── SemifinalTracker.tsx    ← M101 SF probability chart
│   │   │   ├── GroupOddsPanel.tsx       ← Expandable group cards
│   │   │   └── VPDecisionCard.tsx      ← Client appeal + recommendation
│   │   ├── odds/
│   │   │   ├── MarketOddsView.tsx
│   │   │   ├── OddsComparison.tsx
│   │   │   ├── OddsSparkline.tsx
│   │   │   └── ApiStatusPanel.tsx
│   │   ├── scenarios/
│   │   │   ├── ScenarioView.tsx
│   │   │   ├── GroupSimulator.tsx
│   │   │   └── ScenarioSaver.tsx
│   │   ├── bracket/
│   │   │   ├── BracketView.tsx
│   │   │   └── BracketSlot.tsx
│   │   ├── clients/
│   │   │   ├── ClientTrackerView.tsx
│   │   │   └── EventCard.tsx
│   │   ├── executive/
│   │   │   └── ExecutiveView.tsx       ← VP screenshot-ready summary
│   │   ├── ui/                         ← shadcn/ui components
│   │   └── layout/
│   │       ├── AppShell.tsx
│   │       ├── Header.tsx
│   │       └── TabNav.tsx
│   ├── utils/
│   │   ├── flags.ts
│   │   ├── colors.ts
│   │   └── format.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                       ← Tailwind imports
├── api/                                ← Vercel Edge Functions
│   ├── odds/
│   │   ├── kalshi.ts
│   │   └── polymarket.ts
│   └── health.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── .env.example                        ← KALSHI_API_KEY=
├── .gitignore
└── README.md
```

---

## DESIGN SYSTEM — COPART BRAND + SPORTS ANALYTICS

This app must feel like an **official Copart internal tool** that happens to be incredibly well-designed for sports analytics. Use the Copart brand guidelines as the foundation, then layer on creative data visualization.

The vibe: **Copart's clean enterprise aesthetic meets ESPN's data density meets Bloomberg's information hierarchy.** Light mode by default (matches Copart brand), with an optional dark mode toggle for the "war room" feel during live matches.

### Copart Brand Colors (from official Web Design guidelines)

**PRIMARY PALETTE:**
```css
--copart-blue:        #2662D9;  /* Primary brand color — use for CTAs, active states, key accents */
--copart-blue-hover:  #063598;  /* Darker blue for hover states */
--copart-blue-2hover: #EEF2FC;  /* Light blue hover bg */
--copart-black:       #2F333C;  /* Headlines, dark text */
--pure-white:         #FFFFFF;
```

**BLUE SCALE (use heavily for dashboard backgrounds and data viz):**
```css
--darker-blue:  #0F2757;  /* Deep navy — use for dark mode bg, premium sections */
--dark-blue:    #063598;  /* Strong accent, chart lines */
--blue:         #2662D9;  /* Primary — buttons, links, active indicators */
--light-blue:   #E1E9FA;  /* Card backgrounds, subtle highlights */
--lighter-blue: #EEF2FC;  /* Section backgrounds */
--white-blue:   #F6F9FD;  /* Page background */
```

**GRAYSCALE:**
```css
--dark-gray:    #2F333C;  /* Headlines */
--medium-gray:  #46525D;  /* Body text */
--main-gray:    #C5CCD3;  /* Borders, disabled elements */
--light-gray:   #E2E5E9;  /* Dividers, inactive states */
--lighter-gray: #F4F5F6;  /* Background fills */
```

**ALERT/STATUS COLORS (map to match priorities):**
```css
/* P0 - BOOK NOW = Success */
--success-bg:    #D7E8D1;
--success-text:  #1B6600;

/* P1 - MONITOR = Warning */  
--warning-bg:    #FFF7D1;
--warning-text:  #705700;

/* P2 - TENTATIVE = Error/Danger */
--error-bg:      #FCE5E9;
--error-text:    #C00022;  /* (192, 0, 34) */

/* Neutral info */
--neutral-bg:    #E0EBFF;
--neutral-text:  #0F2757;
```

**UI BACKGROUNDS:**
```css
--bg-page:     #F6F9FD;  /* White Blue — main page background */
--bg-section:  #EEF2FC;  /* Lighter Blue — section backgrounds */
--bg-card:     #FFFFFF;  /* White — card backgrounds */
--bg-elevated: #E1E9FA;  /* Light Blue — elevated/hover cards */
```

**BORDERS:**
```css
--border-divider:    #E2E5E9;
--border-form-field: #C5CCD3;
```

**OVERLAYS:**
```css
--overlay-light: rgba(255, 255, 255, 0.5);
--overlay-dark:  rgba(0, 0, 0, 0.5);
```

### Copart Typography (Inter font family — REQUIRED)

**CRITICAL: Copart uses Inter exclusively. Do NOT use DM Sans, Roboto, or any other font.**

```css
/* Import Inter with all needed weights */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* Hero: XBold 64px/74px */
.hero        { font: 800 64px/74px 'Inter'; }

/* Header 1: XBold 40px/48px */
.h1          { font: 800 40px/48px 'Inter'; }

/* Header 2: Bold 22px/32px — section headers */
.h2          { font: 700 22px/32px 'Inter'; }

/* Header 3: Medium 20px/28px — hero body */
.h3          { font: 500 20px/28px 'Inter'; }

/* Header 4: Bold 16px/22px */
.h4          { font: 700 16px/22px 'Inter'; }

/* Body 1: Medium 16px/22px — general body */
.body1       { font: 500 16px/22px 'Inter'; }

/* Body 2M: Medium 14px/20px — dashboard cards */
.body2m      { font: 500 14px/20px 'Inter'; }

/* Body 2SB: SemiBold 14px/20px — dashboard cards emphasized */
.body2sb     { font: 600 14px/20px 'Inter'; }

/* Body 3: Medium 12px/16px — small text, alerts */
.body3       { font: 500 12px/16px 'Inter'; }

/* Label 1: ExtraBold 14px/20px */
.label1      { font: 800 14px/20px 'Inter'; }

/* Label 2: Bold 12px/18px */
.label2      { font: 700 12px/18px 'Inter'; }

/* Label 3: SemiBold 12px/18px */
.label3      { font: 600 12px/18px 'Inter'; }
```

**For monospace numbers (probabilities, percentages):**
Use `font-variant-numeric: tabular-nums;` on Inter rather than a separate mono font. This keeps brand consistency while ensuring numbers align in tables. If a mono font is truly needed for code/technical displays, use JetBrains Mono as a secondary.

### Copart Button Styles

```css
/* Primary Button */
.btn-primary {
  background: #2662D9;
  color: #FFFFFF;
  font: 500 16px/22px 'Inter';
  border-radius: 8px;
  border: none;
  padding: 10px 24px;
}
.btn-primary:hover { background: #063598; }
.btn-primary:disabled { background: #E2E5E9; color: #46525D; }

/* Secondary Button */  
.btn-secondary {
  background: #FFFFFF;
  color: #2662D9;
  border: 1.5px solid #2662D9;
  font: 500 16px/22px 'Inter';
  border-radius: 8px;
  padding: 10px 24px;
}
.btn-secondary:hover { background: #EEF2FC; }

/* Transparent Button */
.btn-transparent {
  background: transparent;
  color: #2662D9;
  border: none;
  font: 500 16px/22px 'Inter';
  padding: 10px 24px;
}
.btn-transparent:hover { color: #063598; }
```

### DARK MODE VARIANT (optional toggle — "War Room Mode")

For live match days or when presenting in a dim conference room, offer a dark mode that remaps the Copart palette:

```css
[data-theme="dark"] {
  --bg-page:     #0F2757;  /* Darker Blue */
  --bg-section:  #1A2F5C;  /* Custom dark surface */
  --bg-card:     #1E3A6E;  /* Elevated dark card */
  --bg-elevated: #2662D9;  /* Blue glow for highlights */
  
  --text-headline: #FFFFFF;
  --text-body:     #C5CCD3;  /* Main Gray as body text */
  --text-muted:    #8A94A0;
  
  --border-divider: rgba(255, 255, 255, 0.1);
}
```

### Creative Design Direction

While respecting Copart brand, be creative with:

1. **Data Visualization** — Use the blue scale creatively. Probability bars should gradient from `#E1E9FA` → `#2662D9` → `#063598`. Heat maps using the blue scale. Matchup probability shown as overlapping circles or treemaps.

2. **Team Flag Integration** — Flags add color and life to an otherwise corporate palette. Use them generously. Flag emojis at minimum, consider small flag images for premium feel.

3. **Match Cards** — White cards with subtle `#E1E9FA` left borders colored by priority (green/amber/red). On hover, elevate with shadow and slide the border accent.

4. **Probability Numbers** — Large, bold, `tabular-nums`. The most likely matchup percentage should be the hero number on each card — think how ESPN shows win probability in big type.

5. **AT&T Stadium Visual** — Consider a subtle stadium silhouette or pattern in the dashboard header. Dallas skyline in the hero section.

6. **Transitions** — Smooth, professional. Cards: 200ms ease. Probability bars: 600ms cubic-bezier. Tab switches: instant content, 150ms fade. No bouncy or playful animations — this is enterprise.

7. **Spacing** — Generous but not wasteful. Follow an 8px grid. Cards have 24px padding. Sections have 32px gaps. The overall feel should be "room to breathe" not "cramped data table."

8. **Print/Screenshot Mode** — The Executive View should look perfect when screenshot or printed. Clean white background, no interactive elements visible, Copart blue accents only.

---

## BUILD ORDER

1. **`src/engine/`** — Probability engine + tests. MUST match spreadsheet values.
2. **`src/data/`** — Seed data from spreadsheet.
3. **`src/components/dashboard/`** — Main dashboard view with match selector + predictions.
4. **`src/components/executive/`** — VP summary view.
5. **`src/api/`** + **`api/`** — Kalshi/Polymarket integration.
6. **`src/components/odds/`** — Market odds view.
7. **`src/components/scenarios/`** — Scenario modeler.
8. **`src/components/bracket/`** — Interactive bracket.
9. **`src/components/clients/`** — Client tracker.

---

## TESTING EXPECTATIONS

The probability engine MUST pass these exact test cases (from the spreadsheet):

```typescript
// probability.test.ts
test('Germany P(2nd) in Group E', () => {
  const result = calculateP2nd({ W: 69.474, Q: 97, alpha: 0.8722 });
  expect(result).toBeCloseTo(0.2507, 3);
});

test('Ecuador P(2nd) in Group E', () => {
  const result = calculateP2nd({ W: 18.947, Q: 88, alpha: 0.4122 });
  expect(result).toBeCloseTo(0.3531, 3);
});

test('M78 top matchup: Ecuador vs Norway', () => {
  const matchups = generateMatchups('M78', groupE_p2nds, groupI_p2nds);
  expect(matchups[0].combined).toBeCloseTo(0.110, 2);
  expect(matchups[0].team1).toBe('Ecuador');
  expect(matchups[0].team2).toBe('Norway');
});

test('M88 top matchup: USA vs Belgium', () => {
  const matchups = generateMatchups('M88', groupD_p2nds, groupG_p2nds);
  expect(matchups[0].combined).toBeCloseTo(0.071, 2);
});

test('M93 top matchup: Colombia vs Spain', () => {
  const result = calculateM93Matchups(m83Candidates, m84Candidates, knockoutOdds);
  expect(result[0].combined).toBeCloseTo(0.0693, 3);
});
```

---

## WHAT VPs CARE ABOUT (design every screen with this in mind)

1. **"Which matches should I book hospitality for?"** → P0/P1/P2 with clear rationale
2. **"What are the chances we get USA in a Dallas match?"** → M88: USA has 29.8% chance of being 2nd in Group D
3. **"Could we get Spain vs Argentina?"** → M84 (LA, not Dallas) or M93 (Dallas R16) — show the path
4. **"What's the semifinal going to look like?"** → M101 tracker with Spain/England/Argentina probabilities
5. **"Has anything changed since last week?"** → Odds movement indicators, delta badges
6. **"Give me something I can show the CEO"** → Executive view, clean and printable

---

## IMPORTANT NOTES

- The 48-team format means 8 of 12 third-place teams qualify (67%), which is why the 0.67 factor appears throughout
- Some teams are TBD (UEFA playoffs, intercontinental playoffs) — marked as TBD_C, TBD_I4, TBD_K4, FIFA 1, FIFA 2, UEFA A/B/C/D
- The app should gracefully handle TBD teams and update when they're confirmed
- All probabilities should be displayed as percentages with 1 decimal place
- Combined probabilities (matchup odds) are typically <15%, so the UI scale should reflect this
- The spreadsheet is the source of truth for validation — if your numbers don't match, fix your code, not the data
