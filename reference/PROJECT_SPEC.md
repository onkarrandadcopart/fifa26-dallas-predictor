# FIFA 26 Dallas Predictor — Project Specification

## Overview

A full-stack web application for predicting FIFA World Cup 2026 Dallas-hosted match outcomes, powered by live prediction market data (Kalshi/Polymarket) and a custom probability engine. Built for Copart client entertainment planning.

**Live demo:** See the React prototype artifact for the dashboard UI.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18 + TypeScript | Component reuse, Lovable/v0 compatible |
| Styling | Tailwind CSS + shadcn/ui | Rapid iteration, consistent design system |
| State | Zustand | Lightweight, no boilerplate |
| Charts | Recharts + D3 | Probability bars, bracket viz, treemaps |
| Routing | React Router v6 | Tab-based navigation |
| API Client | TanStack Query | Caching, polling, background refresh |
| Build | Vite | Fast HMR, TypeScript native |
| Hosting | Vercel or Netlify | Free tier, instant deploys from GitHub |
| Backend (optional) | Vercel Edge Functions or Cloudflare Workers | Proxy for Kalshi API (CORS), caching |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │Dashboard │  │ Market   │  │ Scenario │  │ Client  │ │
│  │  View    │  │  Odds    │  │ Modeler  │  │ Tracker │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │              │              │              │      │
│  ┌────▼──────────────▼──────────────▼──────────────▼───┐ │
│  │              PROBABILITY ENGINE (TS)                 │ │
│  │  • P(1st), P(2nd), P(3rd) calculator                │ │
│  │  • Strength factor α                                │ │
│  │  • 3rd-place qualifier adjustment (67%)             │ │
│  │  • Matchup combination generator                    │ │
│  │  • Cascading knockout probability propagation       │ │
│  └────┬─────────────────────────────────────────┬──────┘ │
│       │                                         │        │
│  ┌────▼─────┐                            ┌──────▼──────┐ │
│  │ Zustand  │                            │  Local      │ │
│  │  Store   │                            │  Storage    │ │
│  └────┬─────┘                            └─────────────┘ │
└───────┼──────────────────────────────────────────────────┘
        │
   ┌────▼─────────────────────────────┐
   │       API LAYER (Edge Fn)        │
   │                                  │
   │  ┌──────────┐  ┌──────────────┐  │
   │  │  Kalshi  │  │  Polymarket  │  │
   │  │  Proxy   │  │    Proxy     │  │
   │  └──────────┘  └──────────────┘  │
   └──────────────────────────────────┘
```

---

## Data Models

### Core Types

```typescript
// teams.ts
interface Team {
  id: string;            // "usa", "spain", etc.
  name: string;          // "United States"
  group: string;         // "D"
  fifaRank?: number;
  flag: string;          // emoji or ISO code
}

// odds.ts
interface MarketOdds {
  teamId: string;
  market: "kalshi" | "polymarket" | "manual";
  contractType: "group_winner" | "tournament_winner" | "match_winner";
  yesPrice: number;      // 0-100 (cents)
  impliedProb: number;   // after vig removal
  timestamp: Date;
  groupId?: string;
}

// probability.ts
interface TeamProbabilities {
  teamId: string;
  group: string;
  pWin: number;          // P(1st in group)
  pSecond: number;       // P(2nd in group)
  pThird: number;        // P(3rd in group) — derived
  pQualify: number;      // Q = pWin + pSecond + 0.67 * pThird
  alpha: number;         // strength factor
  source: "market" | "calculated" | "confirmed";
}

// matches.ts
interface Match {
  id: string;            // "M78"
  stage: "group" | "R32" | "R16" | "QF" | "SF" | "F";
  date: string;
  venue: string;
  isDallas: boolean;
  team1Slot: string;     // "2E" or confirmed team
  team2Slot: string;     // "2I" or confirmed team
  winner?: string;
  team1Confirmed?: string;
  team2Confirmed?: string;
}

interface MatchupPrediction {
  matchId: string;
  team1: string;
  team2: string;
  p1: number;           // P(team1 in this slot)
  p2: number;           // P(team2 in this slot)
  combined: number;     // p1 × p2
}

// clients.ts
interface ClientEvent {
  matchId: string;
  priority: "P0" | "P1" | "P2";
  clients: string[];
  notes: string;
  booked: boolean;
}
```

---

## Probability Engine

The engine replicates and extends the spreadsheet's CALC logic:

### Step 1: Vig-Adjusted Win Probabilities
```
P(Win) = YesPrice / sum(all YesPrices in group)
```

### Step 2: Qualifying Probability
```
Q = P(Win) + P(2nd) + 0.67 × P(3rd)
```
Where 0.67 = 8/12 (8 of 12 third-place teams qualify in 48-team format).

### Step 3: Strength Factor α
```
α = P(Win) / (P(Win) + P(2nd) + P(3rd))
```
For strong teams α → 1 (if they don't win, they're likely 2nd, not 3rd). For weak teams α → 0.

### Step 4: P(2nd) Calculation
```
P(2nd) = α × (Q - P(Win)) / (0.67 + 0.33α)
```

### Step 5: Matchup Combinations
For a match like "2E vs 2I":
```
P(matchup) = P(TeamA finishes 2nd in E) × P(TeamB finishes 2nd in I)
```
All n×m combinations are generated and ranked.

### Step 6: Knockout Propagation
Once R32 results feed R16:
```
P(TeamX in R16) = Σ P(TeamX wins R32 match against each opponent) × P(opponent)
```

### Step 7: Semifinal Estimation
```
P(Reach SF) = 2 × P(Reach Final)     // from tournament winner markets
```
Assumes P(Win SF | Reach SF) ≈ 50%.

---

## API Integration

### Kalshi API

**Base URL:** `https://trading-api.kalshi.com/trade-api/v2`

**Relevant endpoints:**
- `GET /markets` — list all markets (filter by `series_ticker` for FIFA events)
- `GET /markets/{ticker}` — get specific market odds
- `GET /markets/{ticker}/orderbook` — live order book for implied probability

**Key markets to track:**
- Group winner markets (e.g., `FIFA-26-GRP-D-WINNER`)
- Match winner markets (per match)
- Tournament winner market

**Auth:** API key required. Free tier available for read-only market data.

**Polling strategy:** Every 5 minutes for group odds, every 60 seconds during live matches.

### Polymarket API

**Base URL:** `https://clob.polymarket.com`

**Relevant endpoints:**
- `GET /markets` — list markets by tag
- `GET /prices` — current prices for condition tokens

**Key:** Polymarket's CLOB API is public (no auth for read). Filter by FIFA/World Cup tagged markets.

### Edge Function Proxy

Required because both APIs have CORS restrictions. The edge function:
1. Proxies requests to Kalshi/Polymarket
2. Normalizes response format
3. Caches for 60 seconds (configurable)
4. Handles vig removal / probability normalization

```typescript
// /api/odds/[group].ts
export async function GET(request: Request) {
  const group = request.params.group;
  const [kalshi, poly] = await Promise.all([
    fetchKalshiGroupOdds(group),
    fetchPolymarketGroupOdds(group),
  ]);
  return Response.json(mergeAndNormalize(kalshi, poly));
}
```

---

## Feature Roadmap

### Phase 1 — Dashboard MVP (Week 1)
- [x] Static data from spreadsheet
- [ ] React + TypeScript + Vite scaffold
- [ ] Dashboard with match selector + probability bars
- [ ] Top matchup combinations for each Dallas match
- [ ] SF tracker visualization
- [ ] Responsive layout (mobile + desktop)
- [ ] Deploy to Vercel

### Phase 2 — Live Odds (Week 2)
- [ ] Kalshi API integration (edge function proxy)
- [ ] Polymarket API integration
- [ ] Auto-refresh odds with TanStack Query (5-min polling)
- [ ] Odds history chart (sparklines showing movement)
- [ ] Multi-source odds comparison view
- [ ] "Last updated" indicator with staleness warning

### Phase 3 — Scenario Engine (Week 3)
- [ ] Interactive group stage simulator
- [ ] Enter match results → auto-recalculate all downstream probabilities
- [ ] "What-if" toggle: lock specific teams into positions
- [ ] Cascading knockout bracket with live probability propagation
- [ ] Save/load scenarios to localStorage
- [ ] Share scenario via URL params

### Phase 4 — Interactive Bracket (Week 4)
- [ ] Full 48-team bracket visualization
- [ ] Click-to-advance teams through rounds
- [ ] Probability overlay on each bracket slot
- [ ] Dallas matches highlighted in bracket
- [ ] Animated transitions on team advancement
- [ ] Print-friendly bracket view

### Phase 5 — Client Tracker (Week 4)
- [ ] Client invite management per match
- [ ] Priority assignment (P0/P1/P2)
- [ ] Notes and status tracking
- [ ] Calendar export (ICS)
- [ ] Summary dashboard with booking stats
- [ ] Email template generator for client invites

---

## Repo Structure

```
fifa26-dallas-predictor/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── MatchCard.tsx
│   │   │   ├── MatchupRow.tsx
│   │   │   ├── ProbabilityBar.tsx
│   │   │   ├── SemifinalTracker.tsx
│   │   │   └── DashboardView.tsx
│   │   ├── odds/
│   │   │   ├── GroupOddsPanel.tsx
│   │   │   ├── OddsComparison.tsx
│   │   │   ├── OddsHistory.tsx
│   │   │   └── MarketOddsView.tsx
│   │   ├── scenarios/
│   │   │   ├── ScenarioModeler.tsx
│   │   │   ├── GroupSimulator.tsx
│   │   │   └── ScenarioView.tsx
│   │   ├── bracket/
│   │   │   ├── BracketSlot.tsx
│   │   │   ├── BracketConnector.tsx
│   │   │   └── BracketView.tsx
│   │   ├── clients/
│   │   │   ├── ClientTracker.tsx
│   │   │   ├── EventCard.tsx
│   │   │   └── ClientView.tsx
│   │   ├── ui/                  # shadcn components
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── TabNav.tsx
│   │       └── AppShell.tsx
│   ├── engine/
│   │   ├── probability.ts       # Core probability calculations
│   │   ├── matchups.ts          # Matchup combination generator
│   │   ├── knockout.ts          # Knockout stage propagation
│   │   ├── normalize.ts         # Vig removal, probability normalization
│   │   └── types.ts             # Shared types
│   ├── data/
│   │   ├── teams.ts             # Team definitions + flags
│   │   ├── schedule.ts          # Full 104-match schedule
│   │   ├── groups.ts            # Group compositions
│   │   ├── venues.ts            # Venue info (Dallas highlighted)
│   │   └── initial-odds.ts      # Spreadsheet odds as seed data
│   ├── api/
│   │   ├── kalshi.ts            # Kalshi client
│   │   ├── polymarket.ts        # Polymarket client
│   │   └── hooks.ts             # TanStack Query hooks
│   ├── store/
│   │   ├── odds-store.ts        # Market odds state
│   │   ├── results-store.ts     # Match results state
│   │   └── scenario-store.ts    # Scenario state
│   ├── utils/
│   │   ├── flags.ts
│   │   ├── colors.ts
│   │   └── format.ts
│   ├── App.tsx
│   └── main.tsx
├── api/                          # Vercel Edge Functions
│   ├── odds/
│   │   ├── kalshi.ts
│   │   └── polymarket.ts
│   └── health.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── .env.example                  # KALSHI_API_KEY, etc.
├── .gitignore
└── README.md
```

---

## Getting Started

```bash
# Clone
git clone https://github.com/[your-org]/fifa26-dallas-predictor.git
cd fifa26-dallas-predictor

# Install
npm install

# Environment
cp .env.example .env
# Add KALSHI_API_KEY if you have one

# Dev
npm run dev

# Build
npm run build

# Deploy
vercel deploy
```

---

## Design System

**Theme:** Dark mode, data-dense, sports analytics aesthetic.

**Colors:**
- Background: `#0B0F1A` (deep navy)
- Surface: `rgba(255,255,255,0.03)`
- Primary: `#6366F1` (indigo)
- Accent: `#A5B4FC` (light indigo)
- Success: `#10B981` (green — P0/confirmed)
- Warning: `#F59E0B` (amber — P1/monitor)
- Danger: `#EF4444` (red — P2/tentative)
- Text: `#E2E8F0` / `#94A3B8` / `#64748B`

**Fonts:**
- Display: DM Sans (800 weight)
- Body: DM Sans (400-600)
- Mono: JetBrains Mono (numbers, probabilities)

---

## Key Design Decisions

1. **Client-side probability engine** — All calculations run in the browser. No server needed for core functionality. This means instant what-if scenarios with zero latency.

2. **Edge function proxy for APIs** — Kalshi/Polymarket have CORS restrictions. Thin proxy caches responses and normalizes data format. Vercel Edge Functions have 0ms cold start.

3. **Spreadsheet as seed data** — The existing Excel model provides the initial odds and validates our engine. Once APIs are live, spreadsheet data becomes the fallback.

4. **Progressive enhancement** — App works fully offline with seed data. API integration adds live updates. Scenario engine adds interactivity. Each phase is independently useful.

5. **Lovable/v0 compatible** — React + TypeScript + Tailwind is the exact stack that Lovable and v0 work best with. You can use either tool to rapidly iterate on individual components, then merge back.
