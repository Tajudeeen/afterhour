/**
 * Structured context builder — converts deterministic engine output into
 * the JSON payload given to the AI Analyst.
 */
import type {
  AIAnalysisContext,
  GapRiskScore,
  Portfolio,
  PriceSnapshot,
  RegimeState,
  RiskPolicy,
} from '@afterhours/types';

export interface AIContextInput {
  snapshot: PriceSnapshot;
  riskScore: GapRiskScore;
  regime: RegimeState;
  portfolio: Portfolio;
  policy: RiskPolicy;
}

/**
 * Build the structured context that gets passed to the LLM.
 * The LLM never sees raw market data — only this curated, typed structure.
 */
export function buildAIContext(input: AIContextInput): AIAnalysisContext {
  const { snapshot, regime, portfolio, policy } = input;
  const exposurePercent = getExposurePercent(portfolio, snapshot.asset);

  return {
    asset: snapshot.asset,
    onchainPrice: snapshot.onchainPrice,
    referencePrice: snapshot.referencePrice,
    gapPercent: snapshot.gapPercent,
    marketStatus: snapshot.marketStatus,
    liquidity: snapshot.liquidity,
    portfolioExposure: exposurePercent,
    maxAllowedExposure: policy.maxSingleAssetExposurePercent,
    regime,
  };
}

/**
 * Serialize the context as a human-readable prompt for the LLM.
 */
export function contextToLLMPrompt(context: AIAnalysisContext, riskScore: GapRiskScore): string {
  return `You are AfterHours, an AI analyst for 24/7 tokenized stock trading on Solana.

STRUCTURED MARKET DATA:
${JSON.stringify({
    asset: context.asset,
    onchain_price: context.onchainPrice,
    reference_price: context.referencePrice,
    gap_percent: context.gapPercent,
    market_status: context.marketStatus,
    liquidity: context.liquidity,
    portfolio_exposure_percent: context.portfolioExposure,
    max_allowed_exposure_percent: context.maxAllowedExposure,
    regime: {
      session: context.regime.session,
      volatility: context.regime.volatility,
      liquidity: context.regime.liquidity,
      label: context.regime.label,
    },
    gap_risk_score: riskScore.score,
    risk_band: riskScore.band,
  }, null, 2)}

TASK:
Explain the situation, identify the primary risk, and propose an action
within the user's policy constraints (max ${context.maxAllowedExposure}% single-asset exposure,
max $1,500 trade). Return JSON with: explanation (2-3 sentences), primaryRisk (1 sentence),
recommendation { action, asset, amountUsd }, confidence (0-1).

The on-chain market is trading while the traditional market is closed.
Do NOT recommend autonomous trading — this is advisory only.`;
}

function getExposurePercent(portfolio: Portfolio, symbol: string): number {
  const holding = portfolio.holdings.find((h) => h.symbol === symbol);
  if (!holding || portfolio.totalValueUsd === 0) return 0;
  return (holding.valueUsd / portfolio.totalValueUsd) * 100;
}
