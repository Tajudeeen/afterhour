/**
 * AfterHours API — REST API for the AfterHours hackathon product.
 *
 * Endpoints:
 *   GET  /health                    — liveness
 *   GET  /version                   — release identity
 *   GET  /ready                     — repository readiness
 *   GET  /api/portfolio/:wallet     — portfolio snapshot + risk summary
 *   GET  /api/assets/:symbol        — asset gap analysis (onchain vs reference)
 *   GET  /api/assets/:symbol/analysis — AI Analyst explanation + recommendation
 *   GET  /api/assets/:symbol/risk   — Risk Governor evaluation
 *   POST /api/execute               — execute a trade (after user approval)
 *   GET  /api/activity/:wallet      — activity log
 *
 * The AI Analyst explains. The Risk Governor enforces. The user approves.
 * Solana executes.
 */
import { getConfig } from '@afterhours/config';
import {
  calculateGapPercent,
  classifyLiquidity,
  classifyRegime,
  classifyVolatility,
  computeGapRiskScore,
  getMarketHours,
  RegimeMemory,
  SUPPORTED_STOCKS,
  buildPriceSnapshot,
} from '@afterhours/market-engine';
import { evaluateRisk, DEFAULT_RISK_POLICY, RiskGovernor } from '@afterhours/risk-engine';
import { AIAnalyst, type LLMProvider } from '@afterhours/agent';
import type {
  AIAnalysisContext,
  Portfolio,
  RiskPolicy,
} from '@afterhours/types';
import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

export const health = (context: Context) =>
  context.json({ status: 'ok', service: 'afterhours-api' });

export { DEFAULT_RISK_POLICY, RiskGovernor };
export { AIAnalyst, type LLMProvider };
export type { RiskPolicy };

// --- Module-level state (for hackathon; replaced with PostgreSQL in production) ---
const config = getConfig();
const _regimeMemory = new RegimeMemory();

// Mock portfolio data (in production, read from Solana on-chain)
const mockPortfolios: Record<string, Portfolio> = {
  demo: {
    wallet: 'demo',
    totalValueUsd: 10420,
    holdings: [
      { symbol: 'NVDA', mint: SUPPORTED_STOCKS[0]!.mint, amount: 26.34, valueUsd: 4800, weightPercent: 46 },
      { symbol: 'AAPL', mint: SUPPORTED_STOCKS[1]!.mint, amount: 9.8, valueUsd: 2100, weightPercent: 20 },
      { symbol: 'TSLA', mint: SUPPORTED_STOCKS[2]!.mint, amount: 5.6, valueUsd: 1500, weightPercent: 14 },
      { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xB9qMLM6kq7K3e8n1W4c2X', amount: 2020, valueUsd: 2020, weightPercent: 19 },
    ],
    timestamp: new Date().toISOString(),
  },
};

// Activity log (audit trail)
const mockActivities: Record<string, ActivityItem[]> = {
  demo: [
    { id: '1', timestamp: new Date(Date.now() - 30_000).toISOString(), description: 'Gap detected: NVDA +4.02%', status: 'info' },
    { id: '2', timestamp: new Date(Date.now() - 24_000).toISOString(), description: 'AI analysis generated', status: 'info' },
    { id: '3', timestamp: new Date(Date.now() - 18_000).toISOString(), description: 'Risk policy approved', status: 'success' },
    { id: '4', timestamp: new Date(Date.now() - 12_000).toISOString(), description: 'Trade executed on Solana', txSignature: '5xAbCdEf8F2', status: 'success' },
  ],
};

interface ActivityItem {
  id: string;
  timestamp: string;
  description: string;
  txSignature?: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

// --- LLM provider (OpenAI-compatible) ---
const llmProvider: LLMProvider = config.llmApiKey
  ? {
      async generate(prompt: string, options?: { maxTokens?: number; temperature?: number }): Promise<string> {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.llmApiKey}`,
          },
          body: JSON.stringify({
            model: config.llmModel,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: options?.maxTokens ?? 500,
            temperature: options?.temperature ?? 0.3,
          }),
        });
        if (!res.ok) {
          throw new Error(`LLM request failed: ${res.status}`);
        }
        const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        return data.choices?.[0]?.message?.content ?? '';
      },
    }
  : {
      // Mock provider — returns deterministic JSON for the hackathon demo
      async generate(_prompt: string): Promise<string> {
        return JSON.stringify({
          explanation: 'NVDA is trading 4% above its reference price while the underlying market is closed. Liquidity is currently thin and your portfolio has elevated exposure. This creates gap risk at the next market open.',
          primaryRisk: 'Portfolio concentration in NVDA exceeds policy limits during thin liquidity',
          recommendation: { action: 'sell', asset: 'NVDA', amountUsd: 1150 },
          confidence: 0.87,
        });
      },
    };

// --- App factory ---

export interface CreateAppOptions {
  portfolios?: Record<string, Portfolio>;
  activities?: Record<string, ActivityItem[]>;
}

/**
 * Create the AfterHours Hono app. Accepts optional overrides for testing.
 */
export function createApp(options: CreateAppOptions = {}): Hono {
  const app = new Hono();
  const portfolios = { ...mockPortfolios, ...options.portfolios };
  const activities = { ...mockActivities, ...options.activities };

  app.use('*', cors());
  app.use('*', logger());
  // Security headers on all responses
  app.use('*', async (c, next) => {
    await next();
    c.res.headers.set('x-content-type-options', 'nosniff');
    c.res.headers.set('x-frame-options', 'SAMEORIGIN');
    c.res.headers.set('referrer-policy', 'no-referrer');
  });

  app.get('/health', health);

  app.get('/version', (c: Context) =>
    c.json({ status: 'ok', service: 'afterhours-api', releaseId: process.env.AMBIT_RELEASE_ID ?? null }),
  );

  /**
   * GET /api/portfolio/:wallet
   */
  app.get('/api/portfolio/:wallet', async (c: Context) => {
    const wallet = getParam(c, 'wallet');
    const portfolio = portfolios[wallet];

    if (!portfolio) {
      return c.json({ error: { code: 'not-found', message: 'Portfolio not found for this wallet.' } }, 404);
    }

    const assets = await buildAssetSummaries(portfolio);
    return c.json({ portfolio, assets });
  });

  /**
   * GET /api/assets/:symbol
   */
  app.get('/api/assets/:symbol', async (c: Context) => {
    const symbol = getParam(c, 'symbol').toUpperCase();
    const stock = SUPPORTED_STOCKS.find((s) => s.symbol === symbol);

    if (!stock) {
      return c.json({ error: { code: 'not-found', message: `Unsupported asset: ${symbol}` } }, 404);
    }

    const marketHours = getMarketHours();
    const onchainPrice = stock.referencePrice * (1 + (Math.random() * 8 - 2) / 100);
    const snapshot = buildPriceSnapshot({
      symbol,
      onchainPrice,
      referencePrice: stock.referencePrice,
      volume24h: Math.random() * 50_000 + 5_000,
      liquidityUsd: Math.random() * 50_000 + 5_000,
      marketStatus: marketHours.status,
      referenceUpdatedAt: new Date(Date.now() - 16 * 3600_000).toISOString(),
      observedAt: new Date().toISOString(),
    });

    const riskScore = computeGapRiskScore({
      gapPercent: snapshot.gapPercent,
      volume24h: snapshot.volume24h,
      liquidityUsd: snapshot.liquidityUsd,
      marketStatus: snapshot.marketStatus,
      volatilityLevel: classifyVolatility([0.02, 0.03, snapshot.gapPercent / 100]),
      hoursSinceReferenceUpdate: 16,
    });

    return c.json({ snapshot, riskScore });
  });

  /**
   * GET /api/assets/:symbol/analysis
   */
  app.get('/api/assets/:symbol/analysis', async (c: Context) => {
    const symbol = getParam(c, 'symbol').toUpperCase();
    const analyst = new AIAnalyst(llmProvider, DEFAULT_RISK_POLICY);

    const portfolio = portfolios.demo!;
    const context = await buildAIContext(symbol, portfolio);
    const analysis = await analyst.analyze(context, DEFAULT_RISK_POLICY);

    return c.json({ analysis, context });
  });

  /**
   * GET /api/assets/:symbol/risk
   */
  app.get('/api/assets/:symbol/risk', async (c: Context) => {
    const symbol = getParam(c, 'symbol').toUpperCase();
    const portfolio = portfolios.demo!;

    const context = await buildAIContext(symbol, portfolio);
    const analysis = await new AIAnalyst(llmProvider, DEFAULT_RISK_POLICY).analyze(context);
    const evaluation = evaluateRisk(DEFAULT_RISK_POLICY, {
      proposal: {
        action: analysis.recommendation.action === 'hold' ? 'sell' : analysis.recommendation.action,
        asset: symbol,
        amountUsd: analysis.recommendation.amountUsd,
      },
      portfolio,
      dailyPnLPercent: 0,
    });

    return c.json({ evaluation, analysis });
  });

  /**
   * POST /api/execute
   */
  app.post('/api/execute', async (c: Context) => {
    const body = await c.req.json<{
      wallet: string;
      action: 'buy' | 'sell';
      asset: string;
      amountUsd: number;
      signature?: string;
    }>();

    if (!body.signature) {
      return c.json({ error: { code: 'unauthorized', message: 'User signature required for execution.' } }, 401);
    }

    const portfolio = portfolios[body.wallet] ?? portfolios.demo!;
    const evaluation = evaluateRisk(DEFAULT_RISK_POLICY, {
      proposal: { action: body.action, asset: body.asset, amountUsd: body.amountUsd },
      portfolio,
      dailyPnLPercent: 0,
    });

    if (!evaluation.passed) {
      return c.json({ error: { code: 'policy-rejected', message: evaluation.reason ?? 'Policy violation.' } }, 403);
    }

    const result = await executeTradeSimulation(body);

    if (result.status === 'confirmed') {
      updatePortfolio(portfolio, body);
      portfolios[body.wallet] = portfolio;
      const walletActivities = activities[body.wallet] ?? (activities[body.wallet] = []);
      walletActivities.push({
        id: `tx_${Date.now()}`,
        timestamp: new Date().toISOString(),
        description: `Sold $${Math.round(body.amountUsd)} ${body.asset} — risk governor approved`,
        txSignature: result.signature,
        status: 'success',
      });
    }

    return c.json({ result });
  });

  /**
   * GET /api/activity/:wallet
   */
  app.get('/api/activity/:wallet', async (c: Context) => {
    const wallet = getParam(c, 'wallet');
    const activity = activities[wallet] ?? [];
    return c.json({ activities: activity });
  });

  return app;
}

// --- Helpers ---

function getParam(c: Context, key: string): string {
  const value = c.req.param(key);
  if (!value) throw new Error(`Missing route parameter: ${key}`);
  return value;
}

async function buildAssetSummaries(portfolio: Portfolio): Promise<unknown[]> {
  const summaries: unknown[] = [];
  const marketHours = getMarketHours();

  for (const holding of portfolio.holdings) {
    const stock = SUPPORTED_STOCKS.find((s) => s.symbol === holding.symbol);
    if (!stock) continue;

    const gapSim = (Math.random() * 8 - 2) / 100;
    const onchainPrice = stock.referencePrice * (1 + gapSim);
    const gapPercent = calculateGapPercent(onchainPrice, stock.referencePrice);

    const riskScore = computeGapRiskScore({
      gapPercent,
      volume24h: Math.random() * 50_000 + 5_000,
      liquidityUsd: Math.random() * 50_000 + 5_000,
      marketStatus: marketHours.status,
      volatilityLevel: classifyVolatility([0.03, gapSim]),
      hoursSinceReferenceUpdate: 16,
    });

    summaries.push({
      symbol: holding.symbol,
      onchainPrice,
      referencePrice: stock.referencePrice,
      gapPercent,
      valueUsd: holding.valueUsd,
      weightPercent: holding.weightPercent,
      riskScore,
      marketStatus: marketHours.status,
      liquidity: classifyLiquidity(Math.random() * 50_000 + 5_000),
    });
  }

  return summaries;
}

async function buildAIContext(symbol: string, portfolio: Portfolio): Promise<AIAnalysisContext> {
  const stock = SUPPORTED_STOCKS.find((s) => s.symbol === symbol);
  if (!stock) throw new Error(`Unknown stock: ${symbol}`);

  const onchainPrice = stock.referencePrice * 1.04;
  const gapPercent = calculateGapPercent(onchainPrice, stock.referencePrice);

  const regime = classifyRegime({
    marketStatus: 'closed',
    volatilityLevel: 'high',
    liquidity: 'low',
    gapPercent,
    concentration: portfolio.holdings.some((h) => h.symbol === symbol && h.weightPercent > 40) ? 'high' : 'medium',
    isWeekend: true,
  });

  const holding = portfolio.holdings.find((h) => h.symbol === symbol);

  return {
    asset: symbol,
    onchainPrice,
    referencePrice: stock.referencePrice,
    gapPercent,
    marketStatus: 'closed',
    liquidity: 'low',
    portfolioExposure: holding?.weightPercent ?? 0,
    maxAllowedExposure: DEFAULT_RISK_POLICY.maxSingleAssetExposurePercent,
    regime,
  };
}

function updatePortfolio(portfolio: Portfolio, trade: { action: 'buy' | 'sell'; asset: string; amountUsd: number }): void {
  if (trade.action === 'sell') {
    const holding = portfolio.holdings.find((h) => h.symbol === trade.asset);
    if (holding) holding.valueUsd = Math.max(0, holding.valueUsd - trade.amountUsd);
  }

  const total = portfolio.holdings.reduce((sum, h) => sum + h.valueUsd, 0);
  for (const h of portfolio.holdings) {
    h.weightPercent = total > 0 ? (h.valueUsd / total) * 100 : 0;
  }
  portfolio.totalValueUsd = total;
  portfolio.timestamp = new Date().toISOString();
}

async function executeTradeSimulation(_trade: {
  action: 'buy' | 'sell';
  asset: string;
  amountUsd: number;
}): Promise<{ signature: string; explorerUrl: string; status: 'confirmed' | 'failed' }> {
  const signature = `5x${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 10)}8F2`;
  return {
    signature,
    explorerUrl: `https://solscan.io/tx/${signature}`,
    status: 'confirmed',
  };
}

export const app = createApp();
export { config as apiConfig };
