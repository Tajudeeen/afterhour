/**
 * AfterHours Agent — the AI Analyst.
 *
 * DON'T let the LLM calculate everything. The deterministic backend computes:
 *   percentages, exposure, risk scores, price gaps, limits, portfolio weights,
 *   transaction sizes.
 *
 * The AI interprets the results. We give it structured data:
 *   { "asset": "NVDA", "gap_percent": 4.0, ... }
 *
 * Then ask: "Explain the situation, identify the primary risk, and propose
 * an action within the user's policy constraints."
 *
 * That keeps the AI useful without giving it dangerous authority.
 */
import type { AIAnalysis, AIAnalysisContext, RiskPolicy } from '@afterhours/types';
import { analyzeGap } from './analyze.js';
import type { LLMProvider } from './analyze.js';

export { buildAIContext, type AIContextInput } from './context.js';
export { analyzeGap, type LLMProvider, type AnalysisConfig } from './analyze.js';

/**
 * The AI Analyst interprets structured market data and produces an explanation
 * + bounded recommendation. It does NOT execute trades — that's the Risk Governor's
 * job, and the user must approve.
 */
export class AIAnalyst {
  private provider: LLMProvider;
  private defaultPolicy: RiskPolicy;

  constructor(provider: LLMProvider, defaultPolicy: RiskPolicy) {
    this.provider = provider;
    this.defaultPolicy = defaultPolicy;
  }

  /**
   * Analyze a market gap: the deterministic engine calls this with structured
   * context, the AI produces an explanation and recommendation.
   */
  async analyze(context: AIAnalysisContext, policy?: RiskPolicy): Promise<AIAnalysis> {
    return analyzeGap(this.provider, context, policy ?? this.defaultPolicy);
  }
}
