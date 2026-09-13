/**
 * AfterHours Market Engine — the heart of the product.
 *
 * For every supported tokenized stock:
 *   gap = (onchain_price - reference_price) / reference_price
 *
 * Combined with gap %, volume, liquidity, volatility, market status, and time
 * since reference update to produce a Gap Risk Score (0-100).
 */
import type {
  GapRiskScore,
  LiquidityLevel,
  MarketStatus,
  PriceSnapshot,
  RegimeState,
  RiskScoreBand,
  TokenizedStock,
  VolatilityLevel,
} from '@afterhours/types';
import { RISK_SCORE_BANDS } from '@afterhours/types';

export { RISK_SCORE_BANDS, type RiskScoreBand } from '@afterhours/types';

export const SUPPORTED_STOCKS: readonly TokenizedStock[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    mint: 'DezYN7vS56KDyHiLnuW5G9b2doY5xBLk7s6o5YJr4YWr',
    decimals: 6,
    referencePrice: 182.4,
    currency: 'USD',
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    mint: '6dbRFHr7SxG8i5kHnBLY5YFvU3x5xVJoY5hK5a5qJ8eR',
    decimals: 6,
    referencePrice: 214.8,
    currency: 'USD',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    mint: 'Gyu3qZ5b7Kq3e8n1W4c2X6y9J3a5K7b8L4m9N2P1Q6R',
    decimals: 6,
    referencePrice: 268.5,
    currency: 'USD',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    mint: '4k3DyN5wF8o2Q8rKq3e8n1W4c2X6y9J3a5K7b8L4m9N',
    decimals: 6,
    referencePrice: 420.0,
    currency: 'USD',
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    mint: '5a7K3e8n1W4c2X6y9J3a5K7b8L4m9N2P1Q6R7s8T9uV',
    decimals: 6,
    referencePrice: 172.3,
    currency: 'USD',
  },
];

/**
 * Market Hours detection — when is the traditional equity market open?
 * US stock markets: Mon-Fri 09:30-16:00 ET (UTC-5/-4 depending on DST).
 */
export interface MarketHours {
  status: MarketStatus;
  /** ISO-8601 of the next market open, or null if currently open. */
  nextOpenAt: string | null;
  /** ISO-8601 of the market close that just happened (or will happen today). */
  lastCloseAt: string | null;
}

function nowUtc(date: Date = new Date()): Date {
  return new Date(date.toISOString());
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function etOffsetMinutes(date: Date): number {
  // US Eastern Time: EST = UTC-5, EDT = UTC-4 (DST: 2nd Sun of March, 1st Sun of Nov)
  const year = date.getUTCFullYear();
  // 2nd Sunday of March: start from March 8, find the next Sunday
  let dstStart = new Date(Date.UTC(year, 2, 8, 1, 0, 0));
  const startDay = dstStart.getUTCDay(); // 0=Sunday
  dstStart = new Date(Date.UTC(year, 2, 8 + ((7 - startDay) % 7), 1, 0, 0));
  // 1st Sunday of November: start from Nov 1, find the next Sunday
  let dstEnd = new Date(Date.UTC(year, 10, 1, 6, 0, 0));
  const endDay = dstEnd.getUTCDay();
  dstEnd = new Date(Date.UTC(year, 10, 1 + ((7 - endDay) % 7), 6, 0, 0));
  return dstStart <= date && date < dstEnd ? -4 : -5;
}

export function getMarketHours(date: Date = new Date()): MarketHours {
  const utc = nowUtc(date);
  const etMinutes = utc.getTime() + etOffsetMinutes(utc) * 60_000;
  const et = new Date(etMinutes);

  const hour = et.getUTCHours();
  const minute = et.getUTCMinutes();
  const timeInMinutes = hour * 60 + minute;

  if (isWeekend(et)) {
    return { status: 'closed', nextOpenAt: getNextMondayOpen(et), lastCloseAt: getPreviousClose(et) };
  }

  // Market hours: 09:30-16:00 ET
  if (timeInMinutes < 570) {
    // Before 09:30
    return { status: 'closed', nextOpenAt: todayOpen(et), lastCloseAt: getPreviousClose(et) };
  }
  if (timeInMinutes < 585) {
    // 09:30-09:45 pre-market transition
    return { status: 'pre-market', nextOpenAt: null, lastCloseAt: getPreviousClose(et) };
  }
  if (timeInMinutes < 960) {
    // 09:45-16:00
    return { status: 'open', nextOpenAt: null, lastCloseAt: null };
  }
  if (timeInMinutes < 1005) {
    // 16:00-16:45 after-hours
    return { status: 'after-hours', nextOpenAt: getNextOpen(et), lastCloseAt: todayClose(et) };
  }
  return { status: 'closed', nextOpenAt: getNextOpen(et), lastCloseAt: todayClose(et) };
}

function todayOpen(date: Date): string {
  return new Date(date.getTime() + (570 - (date.getUTCHours() * 60 + date.getUTCMinutes())) * 60_000).toISOString();
}

function todayClose(date: Date): string {
  return new Date(date.getTime() + (960 - (date.getUTCHours() * 60 + date.getUTCMinutes())) * 60_000).toISOString();
}

function getNextOpen(date: Date): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + (d.getUTCDay() === 5 ? 3 : 1));
  d.setUTCHours(9, 30, 0, 0);
  return d.toISOString();
}

function getNextMondayOpen(date: Date): string {
  const d = new Date(date);
  const daysUntilMonday = (8 - d.getUTCDay()) % 7;
  d.setUTCDate(d.getUTCDate() + daysUntilMonday);
  d.setUTCHours(9, 30, 0, 0);
  return d.toISOString();
}

function getPreviousClose(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(16, 0, 0, 0);
  return d.toISOString();
}

/**
 * Calculate the raw gap percentage.
 *   gap = (onchain_price - reference_price) / reference_price * 100
 */
export function calculateGapPercent(onchainPrice: number, referencePrice: number): number {
  if (referencePrice <= 0) throw new Error('referencePrice must be positive');
  return ((onchainPrice - referencePrice) / referencePrice) * 100;
}

/**
 * Classify liquidity level from USD liquidity value.
 */
export function classifyLiquidity(liquidityUsd: number): LiquidityLevel {
  if (liquidityUsd >= 100_000) return 'high';
  if (liquidityUsd >= 25_000) return 'medium';
  return 'low';
}

/**
 * Produce a Gap Risk Score (0-100) from structured market data.
 *
 * This is intentionally a hackathon risk signal — not a perfect financial model.
 * It combines: gap %, volume, liquidity, volatility, market status, and time
 * since reference update into a single score.
 */
export function computeGapRiskScore(input: {
  gapPercent: number;
  volume24h: number;
  liquidityUsd: number;
  marketStatus: MarketStatus;
  volatilityLevel: VolatilityLevel;
  /** Hours since the reference price was last updated */
  hoursSinceReferenceUpdate: number;
}): GapRiskScore {
  let score = 0;

  // Gap magnitude — strongest signal (0-30 points)
  const absGap = Math.abs(input.gapPercent);
  if (absGap >= 10) score += 30;
  else if (absGap >= 5) score += 20;
  else if (absGap >= 2) score += 10;
  else score += 2;

  // Market status — if market is closed, gaps can persist (0-20 points)
  if (input.marketStatus === 'closed' || input.marketStatus === 'after-hours') {
    score += 20;
  } else if (input.marketStatus === 'pre-market') {
    score += 10;
  }

  // Volatility — high volatility amplifies gap risk (0-20 points)
  if (input.volatilityLevel === 'high') score += 20;
  else if (input.volatilityLevel === 'medium') score += 10;

  // Liquidity — thin liquidity = higher risk of price manipulation (0-15 points)
  if (input.liquidityUsd < 10_000) score += 15;
  else if (input.liquidityUsd < 50_000) score += 10;
  else if (input.liquidityUsd < 100_000) score += 5;

  // Stale reference price — if reference hasn't updated in a while, gap is more meaningful
  if (input.hoursSinceReferenceUpdate > 16) score += 10; // overnight
  else if (input.hoursSinceReferenceUpdate > 4) score += 5;

  // Volume — low volume confirms gap may not be real/converging (0-5 points)
  if (input.volume24h < 5_000) score += 5;

  const clamped = Math.max(0, Math.min(100, score));
  return { score: clamped, band: scoreToBand(clamped) };
}

function scoreToBand(score: number): RiskScoreBand {
  if (score <= 20) return RISK_SCORE_BANDS.NORMAL;
  if (score <= 40) return RISK_SCORE_BANDS.WATCH;
  if (score <= 60) return RISK_SCORE_BANDS.ELEVATED;
  if (score <= 80) return RISK_SCORE_BANDS.HIGH;
  return RISK_SCORE_BANDS.EXTREME;
}

/**
 * Build a PriceSnapshot from on-chain and reference data.
 */
export function buildPriceSnapshot(input: {
  symbol: string;
  onchainPrice: number;
  referencePrice: number;
  volume24h: number;
  liquidityUsd: number;
  marketStatus: MarketStatus;
  referenceUpdatedAt: string;
  observedAt: string;
}): PriceSnapshot {
  const gapPercent = calculateGapPercent(input.onchainPrice, input.referencePrice);
  return {
    asset: input.symbol,
    onchainPrice: input.onchainPrice,
    referencePrice: input.referencePrice,
    gapPercent,
    volume24h: input.volume24h,
    liquidityUsd: input.liquidityUsd,
    liquidity: classifyLiquidity(input.liquidityUsd),
    marketStatus: input.marketStatus,
    referenceUpdatedAt: input.referenceUpdatedAt,
    observedAt: input.observedAt,
  };
}

/**
 * Regime Memory Engine.
 *
 * Tracks the recent market state and classifies it into a regime.
 * This is borrowed from the Bitget architecture: the system remembers what
 * the market looked like recently, not just the current snapshot.
 */
export type RegimeTransition = {
  from: string;
  to: string;
  triggeredAt: string;
  reason: string;
};

export class RegimeMemory {
  private snapshots: RegimeState[] = [];
  private transitions: RegimeTransition[] = [];

  /**
   * Push a new regime state and record any transition.
   * Returns the new state (which may be the same as the previous).
   */
  push(state: RegimeState): RegimeState {
    const existing = this.snapshots[this.snapshots.length - 1];
    this.snapshots.push(state);
    if (!existing || existing.session !== state.session || existing.label !== state.label) {
      this.transitions.push({
        from: existing?.label ?? 'none',
        to: state.label,
        triggeredAt: state.timestamp,
        reason: this.classifyRegimeTransition(existing ?? null, state),
      });
    }
    return state;
  }

  /**
   * Get the current regime state.
   */
  current(): RegimeState | null {
    return this.snapshots[this.snapshots.length - 1] ?? null;
  }

  /**
   * Get all regime transitions (history).
   */
  history(): readonly RegimeTransition[] {
    return this.transitions;
  }

  /**
   * Get recent snapshots (last N).
   */
  recent(count: number = 10): readonly RegimeState[] {
    return this.snapshots.slice(-count);
  }

  private classifyRegimeTransition(from: RegimeState | null, to: RegimeState): string {
    if (!from) return `Initial regime: ${to.label}`;

    const changes: string[] = [];
    if (from.volatility !== to.volatility) changes.push(`volatility ${from.volatility} → ${to.volatility}`);
    if (from.liquidity !== to.liquidity) changes.push(`liquidity ${from.liquidity} → ${to.liquidity}`);
    if (from.session !== to.session) changes.push(`session ${from.session} → ${to.session}`);
    if (Math.abs(from.gap - to.gap) > 0.5) changes.push(`gap ${from.gap.toFixed(1)}% → ${to.gap.toFixed(1)}%`);

    return changes.length > 0 ? changes.join(', ') : `Regime unchanged: ${to.label}`;
  }
}

/**
 * Classify a regime state from market conditions.
 */
export function classifyRegime(input: {
  marketStatus: MarketStatus;
  volatilityLevel: VolatilityLevel;
  liquidity: LiquidityLevel;
  gapPercent: number;
  concentration: 'low' | 'medium' | 'high';
  isWeekend: boolean;
}): RegimeState {
  const session = input.isWeekend ? 'weekend' : input.marketStatus;
  const absGap = Math.abs(input.gapPercent);

  let label: string;
  if (input.isWeekend && input.volatilityLevel === 'high' && input.liquidity === 'low') {
    label = absGap > 3 ? 'HIGH GAP RISK' : 'ELEVATED RISK';
  } else if (input.marketStatus === 'closed' && absGap > 2) {
    label = 'PRICE DIVERGENCE';
  } else if (input.volatilityLevel === 'high') {
    label = 'VOLATILITY RISING';
  } else if (input.liquidity === 'low') {
    label = 'LIQUIDITY FALLING';
  } else if (input.marketStatus === 'closed') {
    label = 'MARKET CLOSED';
  } else {
    label = 'NORMAL';
  }

  const concentration: 'low' | 'medium' | 'high' =
    input.concentration === 'high' && absGap > 2 ? 'high' : input.concentration;

  return {
    session,
    volatility: input.volatilityLevel,
    liquidity: input.liquidity,
    gap: absGap,
    concentration,
    label,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Classify volatility level from a series of price changes.
 */
export function classifyVolatility(priceChanges: readonly number[]): VolatilityLevel {
  if (priceChanges.length === 0) return 'medium';
  const mean = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
  const variance = priceChanges.reduce((sum, x) => sum + (x - mean) ** 2, 0) / priceChanges.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev > 0.05) return 'high'; // >5% std dev
  if (stdDev > 0.02) return 'medium'; // 2-5%
  return 'low'; // <2%
}
