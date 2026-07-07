// ============================================
// FIFA 26 Dallas Predictor — Core Types
// ============================================

/** A team in the tournament */
export interface Team {
  id: string;
  name: string;
  group: GroupId;
  fifaRank?: number;
  flag: string;        // emoji flag
  confederation: Confederation;
  isTBD?: boolean;
}

export type GroupId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

export type Confederation = 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'CAF' | 'AFC' | 'OFC' | 'TBD';

/** Market odds for a single team */
export interface MarketOdds {
  teamId: string;
  source: OddsSource;
  contractType: 'group_winner' | 'qualifier' | 'tournament_winner' | 'match_winner';
  yesPrice: number;       // 0-100 cents (raw)
  impliedProb: number;    // after vig removal, 0-1
  timestamp: Date;
  groupId?: GroupId;
}

export type OddsSource = 'kalshi' | 'polymarket' | 'manual';

/** Raw market inputs per team (what feeds the engine) */
export interface TeamMarketInputs {
  teamId: string;
  group: GroupId;
  winPct: number;         // W — vig-removed P(Win group), as percentage 0-100
  qualifyPct: number;     // Q — P(Qualify from group), as percentage 0-100
}

/** Calculated probabilities for a team in their group */
export interface TeamProbabilities {
  teamId: string;
  group: GroupId;
  pWin: number;           // P(1st in group), 0-1
  pSecond: number;        // P(2nd in group), 0-1
  pThird: number;         // P(3rd in group), derived, 0-1
  pQualify: number;       // Q = pWin + pSecond + 0.67 * pThird, 0-1
  alpha: number;          // strength factor, 0-1
  remaining: number;      // (Q - W) as fraction 0-1
}

/** A single matchup prediction for a knockout match */
export interface MatchupPrediction {
  matchId: string;
  team1: string;
  team2: string;
  team1Flag: string;
  team2Flag: string;
  p1: number;             // P(team1 in this slot), 0-1
  p2: number;             // P(team2 in this slot), 0-1
  combined: number;       // p1 * p2
}

/** A match in the tournament schedule */
export interface Match {
  id: string;             // "M11", "M78", etc.
  matchNumber: number;
  stage: MatchStage;
  date: string;           // ISO date
  displayDate: string;    // "Jun 14"
  venue: string;
  isDallas: boolean;
  team1Slot: string;      // "2E" or confirmed team id
  team2Slot: string;      // "2I" or confirmed team id
  team1Confirmed?: string;
  team2Confirmed?: string;
  winner?: string;
  description?: string;   // "Netherlands vs Japan"
}

export type MatchStage = 'group' | 'R32' | 'R16' | 'QF' | 'SF' | 'F';

/** Dallas match with client entertainment context */
export interface DallasMatch {
  matchId: string;
  date: string;
  displayDate: string;
  stage: MatchStage;
  teams: string;                // "Netherlands vs Japan" or "2E vs 2I"
  teamsConfirmed: boolean;
  notes: string;
  result?: string;              // Final score, e.g. "2–1" or "1–1 (4–2 pens)"
  feedsMatch?: string;          // e.g. M93 feeds from M83/M84
}

/** Knockout match odds (for M83, M84 etc.) */
export interface KnockoutOdds {
  matchId: string;
  side1Label: string;
  side1WinPct: number;
  side2Label: string;
  side2WinPct: number;
}

/** Final/semifinal market odds for a team */
export interface TournamentOdds {
  teamId: string;
  pFinalPct: number;      // P(Reach final) from market
  pSemifinalPct: number;  // 2 * pFinalPct (derived)
}

/** Scenario — a saved what-if configuration */
export interface Scenario {
  id: string;
  name: string;
  createdAt: Date;
  lockedPositions: Record<string, GroupPosition[]>;
}

export interface GroupPosition {
  teamId: string;
  position: 1 | 2 | 3 | 4;
}

/** 0.67 — 8 of 12 third-place teams qualify in the 48-team format */
export const THIRD_PLACE_FACTOR = 0.67;
