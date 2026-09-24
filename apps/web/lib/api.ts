// API client for AfterHours backend
export interface PortfolioHolding {
  symbol: string;
  mint: string;
  amount: number;
  valueUsd: number;
  weightPercent: number;
}

export interface Portfolio {
  wallet: string;
  totalValueUsd: number;
  holdings: PortfolioHolding[];
  timestamp: string;
}

export interface RiskScore {
  score: number;
  band: string;
}

export interface AssetSummary {
  symbol: string;
  onchainPrice: number;
  referencePrice: number;
  gapPercent: number;
  valueUsd: number;
  weightPercent: number;
  riskScore: RiskScore;
  marketStatus: string;
  liquidity: string;
}

export interface PriceSnapshot {
  asset: string;
  onchainPrice: number;
  referencePrice: number;
  gapPercent: number;
  volume24h: number;
  liquidityUsd: number;
  liquidity: string;
  marketStatus: string;
  referenceUpdatedAt: string;
  observedAt: string;
}

export interface AIAnalysis {
  explanation: string;
  primaryRisk: string;
  recommendation: {
    action: 'buy' | 'sell' | 'hold';
    asset: string;
    amountUsd: number;
  };
  confidence: number;
  createdAt: string;
}

export interface AIAnalysisContext {
  asset: string;
  onchainPrice: number;
  referencePrice: number;
  gapPercent: number;
  marketStatus: string;
  liquidity: string;
  portfolioExposure: number;
  maxAllowedExposure: number;
  regime: {
    session: string;
    volatility: string;
    liquidity: string;
    gap: number;
    concentration: string;
    label: string;
    timestamp: string;
  };
}

export interface RiskEvaluation {
  policy: {
    maxSingleAssetExposurePercent: number;
    maxTradeUsd: number;
    minUsdcReservePercent: number;
    maxDailyDrawdownPercent: number;
    requireUserApproval: boolean;
  };
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

export interface ActivityItem {
  id: string;
  timestamp: string;
  description: string;
  txSignature?: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface ExecuteResult {
  signature: string;
  explorerUrl: string;
  status: 'confirmed' | 'failed';
}

export interface GapRadarAsset {
  symbol: string;
  name: string;
  mint: string;
  referencePrice: number;
  onchainPrice: number;
  gapPercent: number;
  gapDollar: number;
  gapDirection: 'premium' | 'discount' | 'neutral';
  riskScore: { score: number; band: string };
  marketStatus: string;
  liquidity: string;
  referenceSource: 'pyth-live' | 'pyth-stale' | 'prestocks-live' | 'yahoo-finance' | 'seeded';
  source: 'live' | 'demo';
  routes: number;
}

function apiUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787').replace(/\/+$/u, '');
}

async function requestJson<T>(path: string): Promise<T> {
  const res = await fetch(`${apiUrl()}${path}`, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function getPortfolio(wallet: string): Promise<{ portfolio: Portfolio; assets: AssetSummary[] }> {
  return requestJson(`/api/portfolio/${encodeURIComponent(wallet)}`);
}

export async function getAssetAnalysis(symbol: string): Promise<{ analysis: AIAnalysis; context: AIAnalysisContext }> {
  return requestJson(`/api/assets/${encodeURIComponent(symbol)}/analysis`);
}

export async function getAssetRisk(symbol: string): Promise<{ evaluation: RiskEvaluation; analysis: AIAnalysis }> {
  return requestJson(`/api/assets/${encodeURIComponent(symbol)}/risk`);
}

export interface RouteComparison {
  venue: string;
  inputMint: string;
  outputMint: string;
  inAmount: number;
  outAmount: number;
  price: number;
  priceImpact: number;
  fees: number;
  slippage: number;
  liquidityUsd: number;
  source: 'live' | 'demo';
}

export interface AssetIntelligence {
  symbol: string;
  name: string;
  mint: string;
  referencePrice: number;
  referenceSource: 'pyth-live' | 'pyth-stale' | 'prestocks-live' | 'yahoo-finance' | 'seeded';
  referenceUpdatedAt: string;
  onchainPrice: number;
  gapPercent: number;
  gapDollar: number;
  routes: RouteComparison[];
  bestRoute: RouteComparison | null;
  riskScore: RiskScore;
  marketStatus: string;
  liquidity: string;
  source: 'live' | 'demo';
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

export async function getAssetGap(symbol: string): Promise<{ snapshot: PriceSnapshot; riskScore: RiskScore }> {
  return requestJson(`/api/assets/${encodeURIComponent(symbol)}`);
}

export async function getAssetIntelligence(symbol: string, simulatedGapPercent?: number): Promise<AssetIntelligence> {
  const query = simulatedGapPercent !== undefined ? `?simulatedGap=${simulatedGapPercent}` : '';
  return requestJson(`/api/assets/${encodeURIComponent(symbol)}/intelligence${query}`);
}

export async function getActivity(wallet: string): Promise<{ activities: ActivityItem[] }> {
  return requestJson(`/api/activity/${encodeURIComponent(wallet)}`);
}

export async function getGapRadar(): Promise<{
  assets: GapRadarAsset[];
  regime: { label: string; session: string };
  marketHours: { status: string; nextOpenAt: string | null; lastCloseAt: string | null };
  observedAt: string;
}> {
  return requestJson('/api/radar');
}

export async function executeTrade(body: {
  wallet: string;
  action: 'buy' | 'sell';
  asset: string;
  amountUsd: number;
  signature: string;
}): Promise<{ result: ExecuteResult }> {
  const res = await fetch(`${apiUrl()}/api/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Execute failed: ${res.status}`);
  }
  return res.json();
}
