/**
 * AI Analyst — gap analysis logic.
 *
 * The LLM provider is injected so this works with any endpoint (OpenAI,
 * Azure OpenAI, local model via OpenRouter, etc.).
 */
import type { AIAnalysis, AIAnalysisContext, GapRiskScore, RiskPolicy, RiskScoreBand } from '@afterhours/types';
import { contextToLLMPrompt } from './context.js';
import { RISK_SCORE_BANDS } from '@afterhours/types';

export interface LLMProvider {
  /**
   * Generate a completion from a prompt. Returns the raw text response.
   */
  generate(prompt: string, options?: { maxTokens?: number; temperature?: number }): Promise<string>;
}

export interface AnalysisConfig {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Analyze a market gap using the LLM provider.
 *
 * The deterministic backend has already computed all numbers. The LLM
 * interprets them and produces a human-readable explanation + recommendation.
 */
export async function analyzeGap(
  provider: LLMProvider,
  context: AIAnalysisContext,
  policy: RiskPolicy,
  config: AnalysisConfig = {},
): Promise<AIAnalysis> {
  // Determine the risk score band from context
  const riskScore = computeContextualRiskScore(context);

  const prompt = contextToLLMPrompt(context, riskScore);
  const raw = await provider.generate(prompt, {
    maxTokens: config.maxTokens ?? 500,
    temperature: config.temperature ?? 0.3,
  });

  // Parse the LLM's JSON response, with fallback to a deterministic default
  const parsed = tryParseJson(raw);

  if (parsed && isValidAnalysis(parsed)) {
    return {
      explanation: parsed.explanation,
      primaryRisk: parsed.primaryRisk,
      recommendation: {
        action: parsed.recommendation.action,
        asset: parsed.recommendation.asset,
        amountUsd: parsed.recommendation.amountUsd,
      },
      confidence: clampConfidence(parsed.confidence),
      createdAt: new Date().toISOString(),
    };
  }

  // Fallback: deterministic recommendation if LLM output is unparseable
  return deterministicFallback(context, riskScore, policy);
}

/**
 * Compute a contextual risk score from the structured data.
 * This is used in the prompt so the LLM sees the same risk signal the engine produced.
 */
function computeContextualRiskScore(context: AIAnalysisContext): GapRiskScore {
  let score = 0;
  const absGap = Math.abs(context.gapPercent);

  if (absGap >= 10) score += 30;
  else if (absGap >= 5) score += 20;
  else if (absGap >= 2) score += 10;
  else score += 2;

  if (context.marketStatus === 'closed' || context.marketStatus === 'after-hours') score += 20;
  if (context.liquidity === 'low') score += 15;

  if (context.portfolioExposure > context.maxAllowedExposure) score += 10;
  else if (context.portfolioExposure > context.maxAllowedExposure * 0.8) score += 5;

  score = Math.max(0, Math.min(100, score));

  let band: RiskScoreBand;
  if (score <= 20) band = RISK_SCORE_BANDS.NORMAL;
  else if (score <= 40) band = RISK_SCORE_BANDS.WATCH;
  else if (score <= 60) band = RISK_SCORE_BANDS.ELEVATED;
  else if (score <= 80) band = RISK_SCORE_BANDS.HIGH;
  else band = RISK_SCORE_BANDS.EXTREME;

  return { score, band };
}

interface RawAnalysis {
  explanation: string;
  primaryRisk: string;
  recommendation: {
    action: 'buy' | 'sell' | 'hold';
    asset: string;
    amountUsd: number;
  };
  confidence: number;
}

function isValidAnalysis(value: unknown): value is RawAnalysis {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  const rec = r.recommendation;
  if (typeof rec !== 'object' || rec === null) return false;
  const recObj = rec as Record<string, unknown>;
  return (
    typeof r.explanation === 'string' &&
    typeof r.primaryRisk === 'string' &&
    (recObj.action === 'buy' || recObj.action === 'sell' || recObj.action === 'hold') &&
    typeof recObj.asset === 'string' &&
    typeof recObj.amountUsd === 'number' &&
    typeof r.confidence === 'number'
  );
}

function tryParseJson(text: string): RawAnalysis | null {
  try {
    const trimmed = text.trim();
    const jsonStart = trimmed.indexOf('{');
    const jsonEnd = trimmed.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) return null;
    return JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
  } catch {
    return null;
  }
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Deterministic fallback recommendation when the LLM fails to produce valid output.
 * This ensures the system always has a sensible default.
 */
function deterministicFallback(
  context: AIAnalysisContext,
  riskScore: { score: number; band: string },
  policy: RiskPolicy,
): AIAnalysis {
  const absGap = Math.abs(context.gapPercent);
  const exposure = context.portfolioExposure;
  const maxExposure = policy.maxSingleAssetExposurePercent;

  const explanation =
    `${context.asset} is trading ${context.gapPercent > 0 ? 'above' : 'below'} its reference price ` +
    `of $${context.referencePrice.toFixed(2)} at $${context.onchainPrice.toFixed(2)} ` +
    `(gap: ${context.gapPercent.toFixed(2)}%). The ${context.marketStatus} market ` +
    `and ${context.liquidity} liquidity create ${riskScore.band.toLowerCase()} risk conditions.`;

  const primaryRisk =
    exposure > maxExposure * 0.9
      ? `Portfolio concentration in ${context.asset} exceeds ${Math.round(exposure)}% of total value`
      : `Price divergence of ${absGap.toFixed(1)}% while the underlying market is ${context.marketStatus}`;

  // Suggest selling if exposure is too high and gap is positive (onchain > reference)
  let action: 'buy' | 'sell' | 'hold' = 'hold';
  let amountUsd = 0;

  if (exposure > maxExposure && context.gapPercent > 1) {
    action = 'sell';
    // Sell enough to bring exposure down to the limit
    const totalPortfolioValue = context.portfolioTotalValueUsd ?? 10000;
    amountUsd = Math.min(
      policy.maxTradeUsd,
      Math.max(0, ((exposure - maxExposure) / 100) * totalPortfolioValue),
    );
  } else if (context.gapPercent < -2 && exposure < maxExposure * 0.5) {
    action = 'buy';
    amountUsd = Math.min(policy.maxTradeUsd, 500);
  }

  return {
    explanation,
    primaryRisk,
    recommendation: { action, asset: context.asset, amountUsd },
    confidence: riskScore.score / 100,
    createdAt: new Date().toISOString(),
  };
}
