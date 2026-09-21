/**
 * AfterHours shared types — tokenized stock gap intelligence on Solana.
 *
 * When Wall Street closes, Solana keeps trading. AfterHours detects the price
 * gap between on-chain markets and traditional reference prices, explains why,
 * assesses portfolio risk, and executes bounded actions on Solana.
 */

/** A tokenized stock supported by AfterHours (3-5 tickers for the hackathon). */
export interface TokenizedStock {
  /** e.g. "NVDA", "AAPL", "TSLA" */
  symbol: string;
  /** e.g. "NVIDIA Corporation" */
  name: string;
  /** Mint address of the SPL token on Solana */
  mint: `${string}`;
  decimals: number;
  /** Reference / fair-value price from traditional markets (USD) */
  referencePrice: number;
  /** ISO-4217 currency of the reference price */
  currency: 'USD';
}

/** Market session states for a tokenized stock. */
export type MarketStatus = 'open' | 'closed' | 'pre-market' | 'after-hours';

/** Liquidity classification for the on-chain market. */
export type LiquidityLevel = 'high' | 'medium' | 'low';

/** Volatility regime classification. */
export type VolatilityLevel = 'low' | 'medium' | 'high';

/** Portfolio concentration signal. */
export type ConcentrationLevel = 'low' | 'medium' | 'high';

/** Market regime state — Regime Memory engine output. */
export interface RegimeState {
  /** e.g. "weekend", "market-closed", "normal" */
  session: string;
  volatility: VolatilityLevel;
  liquidity: LiquidityLevel;
  gap: number; // percent
  concentration: ConcentrationLevel;
  /** Human-readable summary, e.g. "ELEVATED RISK" */
  label: string;
  /** ISO-8601 timestamp of the regime snapshot */
  timestamp: string;
}

/** Price snapshot captured by the Market Gap Engine. */
export interface PriceSnapshot {
  asset: string;
  onchainPrice: number;
  referencePrice: number;
  gapPercent: number; // (onchain - reference) / reference * 100
  volume24h: number;
  liquidityUsd: number;
  liquidity: LiquidityLevel;
  marketStatus: MarketStatus;
  /** ISO-8601 timestamp of the reference price update */
  referenceUpdatedAt: string;
  /** ISO-8601 timestamp of this on-chain observation */
  observedAt: string;
  /** Pyth confidence interval in USD (e.g. ±1.25) */
  pythConfidenceUsd?: number;
  /** Pyth confidence interval as % of price */
  pythConfidenceRatioPercent?: number;
}

/** Risk score bands for the Gap Risk Score. */
export const RISK_SCORE_BANDS = {
  NORMAL: 'Normal',
  WATCH: 'Watch',
  ELEVATED: 'Elevated',
  HIGH: 'High',
  EXTREME: 'Extreme',
} as const;

export type RiskScoreBand = (typeof RISK_SCORE_BANDS)[keyof typeof RISK_SCORE_BANDS];

/** Gap Risk Score: 0-100, mapped to a qualitative band. */
export interface GapRiskScore {
  score: number; // 0-100
  band: RiskScoreBand;
}

/** A single portfolio holding. */
export interface PortfolioHolding {
  /** e.g. "NVDA" */
  symbol: string;
  mint: `${string}`;
  /** Quantity of tokens held */
  amount: number;
  /** USD value of the holding */
  valueUsd: number;
  /** Percentage of total portfolio value */
  weightPercent: number;
}

/** Portfolio as seen by AfterHours. */
export interface Portfolio {
  /** Wallet public key (base58) */
  wallet: string;
  /** Total USD value across all holdings + USDC */
  totalValueUsd: number;
  holdings: readonly PortfolioHolding[];
  /** ISO-8601 timestamp */
  timestamp: string;
}

/** Structured context passed from deterministic backend to the AI Analyst. */
export interface AIAnalysisContext {
  asset: string;
  onchainPrice: number;
  referencePrice: number;
  gapPercent: number;
  marketStatus: MarketStatus;
  liquidity: LiquidityLevel;
  portfolioExposure: number; // percent of portfolio
  maxAllowedExposure: number; // policy limit percent
  regime: RegimeState;
  portfolioTotalValueUsd?: number;
}

/** AI Analyst output: explanation + bounded recommendation. */
export interface AIAnalysis {
  explanation: string;
  primaryRisk: string;
  recommendation: {
    action: 'buy' | 'sell' | 'hold';
    asset: string;
    amountUsd: number;
  };
  confidence: number; // 0-1
  /** ISO-8601 timestamp */
  createdAt: string;
}

/** Risk Governor policy configuration (user-scoped). */
export interface RiskPolicy {
  maxSingleAssetExposurePercent: number; // e.g. 35
  maxTradeUsd: number; // e.g. 1500
  minUsdcReservePercent: number; // e.g. 10
  maxDailyDrawdownPercent: number; // e.g. 3
  requireUserApproval: boolean;
}

/** Risk Governor evaluation result. */
export interface RiskEvaluation {
  policy: RiskPolicy;
  proposed: {
    action: 'buy' | 'sell';
    asset: string;
    amountUsd: number;
  };
  current: {
    exposurePercent: number;
    usdcReservePercent: number;
    dailyPnLPercent: number;
  };
  proposedState: {
    exposurePercent: number;
    usdcReservePercent: number;
  };
  passed: boolean;
  reason: string | null;
}

/** Transaction record for the audit trail. */
export interface Transaction {
  id: string;
  wallet: string;
  action: 'buy' | 'sell';
  asset: string;
  amount: string;
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
}

/** Activity log item for the Activity screen. */
export interface ActivityItem {
  id: string;
  timestamp: string;
  description: string;
  txSignature?: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface PreStocksAsset {
  name: string;
  symbol: string;
  description: string;
  image: string;
  contract_address: string;  // Solana mint
  markPrice: number;         // fair value (reference price)
  tokenPrice: number;        // on-chain DEX price
  supply: number;
  markValuation: number;
}

export interface RouteComparison {
  venue: string;              // 'PreStocks' | 'Jupiter' | 'Meteora'
  inputMint: string;
  outputMint: string;
  inAmount: number;           // USDC in lamports
  outAmount: number;          // token out amount
  price: number;              // effective price per token
  priceImpact: number;        // percent
  fees: number;               // USD
  slippage: number;           // bps
  liquidityUsd: number;
  source: 'live' | 'demo';
}

export interface AssetIntelligence {
  symbol: string;
  name: string;
  mint: string;
  referencePrice: number;      // Pyth or PreStocks markPrice
  referenceSource: 'pyth-live' | 'pyth-stale' | 'prestocks-live' | 'seeded';
  referenceUpdatedAt: string;
  onchainPrice: number;        // DEX price
  gapPercent: number;
  gapDollar: number;
  routes: RouteComparison[];
  bestRoute: RouteComparison | null;
  riskScore: GapRiskScore;
  marketStatus: MarketStatus;
  liquidity: LiquidityLevel;
  source: 'live' | 'demo';     // overall data source
  pythConfidenceUsd?: number;
  pythConfidenceRatioPercent?: number;
  pythDynamicSlippageBps?: number;
}
