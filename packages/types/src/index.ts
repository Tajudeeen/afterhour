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
  referenceSource: 'pyth-live' | 'pyth-stale' | 'prestocks-live' | 'yahoo-finance' | 'seeded';
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
  pythFeedPair?: {
    equitySymbol: string;
    tokenSymbol: string;
    equityPrice: number;
    tokenPrice: number;
    gapPercent: number;
    tokenType: 'xStock' | 'Ondo';
    equityFeedId: string;
    tokenFeedId: string;
  };
}

/* ------------------------------------------------------------------------- *
 * Solana network
 *
 * Single source of truth for BOTH the wallet connection and every network
 * label / explorer link shown to the user. Keeping these derived from one
 * place means a label can never claim a different network than the one the
 * transaction actually settled on.
 * ------------------------------------------------------------------------- */

/** Solana cluster the app is running against. */
export type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';

/**
 * Default when nothing is configured.
 *
 * Devnet is used so the demo flows (wallet connection, on-chain SPL Memo
 * transactions) work immediately without mainnet rate limits or real SOL.
 * Judges can connect a wallet, get devnet SOL from the faucet, and execute
 * real on-chain transactions. Set NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
 * to go to mainnet.
 */
export const DEFAULT_SOLANA_NETWORK: SolanaNetwork = 'devnet';

/** Infer a network from an RPC URL. Returns undefined when it can't tell. */
export function networkFromRpcUrl(url?: string | null): SolanaNetwork | undefined {
  const value = (url ?? '').trim().toLowerCase();
  if (!value) return undefined;
  if (value.includes('devnet')) return 'devnet';
  if (value.includes('testnet')) return 'testnet';
  if (value.includes('localhost') || value.includes('127.0.0.1')) return 'localnet';
  if (value.includes('mainnet')) return 'mainnet-beta';
  return undefined;
}

/**
 * Resolve the active network. An explicit name wins; otherwise it is inferred
 * from the RPC URL; otherwise it falls back to `DEFAULT_SOLANA_NETWORK`.
 */
export function resolveSolanaNetwork(
  raw?: string | null,
  rpcUrl?: string | null,
): SolanaNetwork {
  const value = (raw ?? '').trim().toLowerCase();
  if (value === 'devnet') return 'devnet';
  if (value === 'testnet') return 'testnet';
  if (value === 'localnet' || value === 'local' || value === 'localhost') return 'localnet';
  if (value === 'mainnet' || value === 'mainnet-beta') return 'mainnet-beta';
  return networkFromRpcUrl(rpcUrl) ?? DEFAULT_SOLANA_NETWORK;
}

/** Human-readable network label for UI copy. */
export function solanaNetworkLabel(network: SolanaNetwork): string {
  switch (network) {
    case 'devnet':
      return 'Solana Devnet';
    case 'testnet':
      return 'Solana Testnet';
    case 'localnet':
      return 'Solana Localnet';
    default:
      return 'Solana Mainnet-Beta';
  }
}

/** Solscan `?cluster=` query string. Mainnet takes no cluster parameter. */
export function solscanClusterQuery(network: SolanaNetwork): string {
  if (network === 'mainnet-beta') return '';
  if (network === 'localnet') return '?cluster=custom';
  return `?cluster=${network}`;
}

/** Solscan explorer URL for a transaction signature. */
export function solscanTxUrl(signature: string, network: SolanaNetwork): string {
  return `https://solscan.io/tx/${signature}${solscanClusterQuery(network)}`;
}

/** Solscan explorer URL for an account address. */
export function solscanAddressUrl(address: string, network: SolanaNetwork): string {
  return `https://solscan.io/account/${address}${solscanClusterQuery(network)}`;
}
