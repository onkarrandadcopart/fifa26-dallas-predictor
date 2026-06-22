# 🚀 Quick Start — Setting Up for Claude Code

## What's in this package

```
fifa26-claude-code-package/
├── CLAUDE.md                              ← THE PROMPT (Claude Code reads this automatically)
├── reference/
│   ├── SPREADSHEET_DATA.json              ← All Excel data as structured JSON
│   ├── PROJECT_SPEC.md                    ← Architecture & design spec
│   └── Copart_Brand_Guidelines.pdf        ← Official Copart web colors, typography, buttons
├── FIFA26_Dallas_Games_Predictor_v10or.xlsx  ← Original spreadsheet (for verification)
└── SETUP.md                               ← THIS FILE
```

## Step-by-step setup

### 1. Create your project folder

```bash
mkdir fifa26-dallas-predictor
cd fifa26-dallas-predictor
```

### 2. Copy all files from this package into it

```bash
# Copy these files into the root of fifa26-dallas-predictor/
cp CLAUDE.md fifa26-dallas-predictor/
cp FIFA26_Dallas_Games_Predictor_v10or.xlsx fifa26-dallas-predictor/

# Create reference folder
mkdir -p fifa26-dallas-predictor/reference
cp reference/SPREADSHEET_DATA.json fifa26-dallas-predictor/reference/
cp reference/PROJECT_SPEC.md fifa26-dallas-predictor/reference/
cp reference/Copart_Brand_Guidelines.pdf fifa26-dallas-predictor/reference/
```

### 3. Initialize Git repo

```bash
cd fifa26-dallas-predictor
git init
git add -A
git commit -m "Initial setup with CLAUDE.md and reference data"
```

### 4. (Optional) Create GitHub repo

```bash
gh repo create fifa26-dallas-predictor --private --source=. --push
```

### 5. Launch Claude Code

```bash
claude
```

That's it. Claude Code will automatically read `CLAUDE.md` and understand the entire project.

### 6. First commands to give Claude Code

Start with these prompts in order:

**Prompt 1 — Understand the project:**
```
Read CLAUDE.md and all files in reference/. Summarize your understanding of the probability engine math, 
the 8 Dallas matches, and what Copart VPs need. Then verify you can reproduce the P(2nd) calculation 
for Germany in Group E (should be ~25.07%).
```

**Prompt 2 — Scaffold the project:**
```
Initialize the Vite + React + TypeScript project with Tailwind, shadcn/ui, Zustand, TanStack Query, 
Recharts, and React Router. Set up the file structure from CLAUDE.md. Create all the data files from 
SPREADSHEET_DATA.json.
```

**Prompt 3 — Build the probability engine:**
```
Build the probability engine in src/engine/ with full test coverage. Every test case from CLAUDE.md 
must pass. Start with probability.ts, then matchups.ts, then knockout.ts.
```

**Prompt 4 — Build the dashboard:**
```
Build the main dashboard view. Match selector on the left, prediction panel in the center, 
SF tracker on the right. Use the design system from CLAUDE.md. Make it look like a Bloomberg 
terminal meets ESPN — dark mode, data-dense, beautiful.
```

**Prompt 5 — Build the VP Executive View:**
```
Build the executive summary view — a single page a VP can screenshot. Show all 8 Dallas matches 
in timeline order with client appeal scores, booking recommendations, and key risks. 
Make it print-friendly.
```

**Prompt 6 — Add Kalshi integration:**
```
Set up the Kalshi API proxy as a Vercel Edge Function and the TanStack Query hooks. 
Use the .env.example pattern for the API key. Add the odds comparison panel and 
staleness indicators.
```

## Environment variables

Create `.env` (not committed):
```bash
KALSHI_API_KEY=your_key_here
```

Get a free Kalshi API key at: https://kalshi.com/api

## Key things Claude Code will do

1. **Read CLAUDE.md** — It picks this up automatically and understands the full project
2. **Build the probability engine first** — With tests that validate against your spreadsheet
3. **Create a pixel-perfect dashboard** — Dark mode, probability bars, match cards
4. **Wire up live APIs** — Kalshi + Polymarket with edge function proxies
5. **Add VP-facing features** — Executive view, client appeal scores, booking recommendations

## Tips for working with Claude Code

- If it goes off track, say: "Check CLAUDE.md for the exact requirements"
- If probabilities don't match: "Compare against SPREADSHEET_DATA.json — that's the source of truth"
- For design tweaks: "Make it more [Bloomberg/ESPN/minimal] — reference the design system in CLAUDE.md"
- To add features: "Add [feature] following the patterns established in the existing components"
