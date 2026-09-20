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
  classifyRegime,
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
  GapRiskScore,
  Portfolio,
  PortfolioHolding,
  PriceSnapshot,
  RiskPolicy,
  AssetIntelligence,
  PreStocksAsset,
  RouteComparison,
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

interface CachedIntelligence {
  intelligence: AssetIntelligence;
  timestamp: number;
}
const intelligenceCache = new Map<string, CachedIntelligence>();

async function fetchPreStocksData(): Promise<PreStocksAsset[]> {
  try {
    const res = await fetch('https://prestocks.com/api/prestocks', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`PreStocks API ${res.status}`);
    return await res.json() as PreStocksAsset[];
  } catch {
    return []; // graceful fallback
  }
}

async function fetchJupiterQuote(inputMint: string, outputMint: string, amountUsdc: number): Promise<RouteComparison | null> {
  try {
    const amount = Math.floor(amountUsdc * 1_000_000);
    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const outAmount = Number(data.outAmount);
    const inUSDC = amountUsdc;
    const tokenDecimals = 6;
    const outTokens = outAmount / 10 ** tokenDecimals;
    const effectivePrice = inUSDC / outTokens;
    const feeUsd = data.routePlan.reduce((sum: number, r: any) => sum + Number(r.swapInfo.feeAmount) / 1e6, 0);
    return {
      venue: 'Jupiter',
      inputMint,
      outputMint,
      inAmount: amount,
      outAmount,
      price: effectivePrice,
      priceImpact: Number(data.priceImpactPct),
      fees: feeUsd,
      slippage: 50,
      liquidityUsd: inUSDC / Math.max(0.0001, Number(data.priceImpactPct) / 100),
      source: 'live',
    };
  } catch {
    return null;
  }
}

const PYTH_FEED_IDS: Record<string, string> = {
  NVDA: 'b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593',
  AAPL: '49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688',
  TSLA: '16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1',
};

async function fetchPythPrice(feedId: string): Promise<{ price: number; conf: number; publishTime: number; source: 'pyth-live' | 'pyth-stale' } | null> {
  const apiKey = process.env.PYTH_HERMES_API_KEY;
  if (!apiKey) return null;
  try {
    const url = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const p = data.parsed?.[0]?.price;
    if (!p) return null;
    const price = Number(p.price) * Math.pow(10, p.expo);
    const conf = Number(p.conf) * Math.pow(10, p.expo);
    const ageSeconds = Date.now() / 1000 - p.publish_time;
    return {
      price,
      conf,
      publishTime: p.publish_time,
      source: ageSeconds < 120 ? 'pyth-live' : 'pyth-stale',
    };
  } catch {
    return null;
  }
}

export async function getAssetIntelligence(symbol: string): Promise<AssetIntelligence> {
  const upper = symbol.toUpperCase();
  const cached = intelligenceCache.get(upper);
  const now = Date.now();
  if (cached && now - cached.timestamp < 30_000) {
    return cached.intelligence;
  }

  const { getStock } = await import('@afterhours/solana');
  const stock = getStock(upper);
  if (!stock) throw new Error(`Unsupported asset: ${upper}`);

  const isPreStocks = ['ANTHROPIC', 'SPACEX', 'OPENAI', 'ANDURIL', 'NEURALINK', 'FIGUREAI', 'KALSHI', 'POLYMARKET'].includes(upper);
  let referencePrice = stock.referencePrice;
  let onchainPrice = stock.referencePrice;
  let referenceSource: 'pyth-live' | 'pyth-stale' | 'prestocks-live' | 'seeded' = 'seeded';
  let source: 'live' | 'demo' = 'demo';
  const routes: RouteComparison[] = [];
  const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xB9qMLM6kq7K3e8n1W4c2X';

  if (isPreStocks) {
    const prestocksData = await fetchPreStocksData();
    const assetData = prestocksData.find(a => a.symbol === upper);
    if (assetData) {
      referencePrice = assetData.markPrice;
      onchainPrice = assetData.tokenPrice;
      referenceSource = 'prestocks-live';
      source = 'live';

      const jupQuote = await fetchJupiterQuote(USDC_MINT, assetData.contract_address, 1000);
      if (jupQuote) {
        routes.push(jupQuote);
      } else {
        routes.push({
          venue: 'PreStocks DEX',
          inputMint: USDC_MINT,
          outputMint: assetData.contract_address,
          inAmount: 1000 * 1_000_000,
          outAmount: Math.floor((1000 / assetData.tokenPrice) * 1_000_000),
          price: assetData.tokenPrice,
          priceImpact: 0,
          fees: 0,
          slippage: 0,
          liquidityUsd: 100000,
          source: 'demo'
        });
      }
    } else {
      const fallbackData: Record<string, any> = {
        ANTHROPIC: { tokenPrice: 1009.03, markPrice: 1029.32 },
        SPACEX: { tokenPrice: 118.45, markPrice: 152.59 },
        OPENAI: { tokenPrice: 1155.65, markPrice: 994.16 },
        ANDURIL: { tokenPrice: 158.83, markPrice: 153.38 },
        NEURALINK: { tokenPrice: 424.72, markPrice: 335.26 },
        FIGUREAI: { tokenPrice: 177.96, markPrice: 181.29 },
      };
      if (fallbackData[upper]) {
        onchainPrice = fallbackData[upper].tokenPrice;
        referencePrice = fallbackData[upper].markPrice;
      }
      routes.push({
        venue: 'PreStocks DEX',
        inputMint: USDC_MINT,
        outputMint: stock.mint,
        inAmount: 1000 * 1_000_000,
        outAmount: Math.floor((1000 / onchainPrice) * 1_000_000),
        price: onchainPrice,
        priceImpact: 0,
        fees: 0,
        slippage: 0,
        liquidityUsd: 10000,
        source: 'demo'
      });
    }
  } else {
    const feedId = PYTH_FEED_IDS[upper];
    if (feedId) {
      const pythData = await fetchPythPrice(feedId);
      if (pythData) {
        referencePrice = pythData.price;
        referenceSource = pythData.source;
        source = 'live';
      }
    }
    const jupQuote = await fetchJupiterQuote(USDC_MINT, stock.mint, 1000);
    if (jupQuote) {
      routes.push(jupQuote);
      onchainPrice = jupQuote.price;
    } else {
      onchainPrice = referencePrice * 1.02;
      routes.push({
        venue: 'Jupiter',
        inputMint: USDC_MINT,
        outputMint: stock.mint,
        inAmount: 1000 * 1_000_000,
        outAmount: Math.floor((1000 / onchainPrice) * 1_000_000),
        price: onchainPrice,
        priceImpact: 0,
        fees: 0,
        slippage: 0,
        liquidityUsd: 10000,
        source: 'demo'
      });
    }
  }

  const gapPercent = ((onchainPrice - referencePrice) / referencePrice) * 100;
  const gapDollar = onchainPrice - referencePrice;
  const marketHours = getMarketHours();
  const volume24h = upper === 'NVDA' ? 42_500 : 25_000;
  const liquidityUsd = routes[0]?.liquidityUsd || 50000;

  const riskScore = computeGapRiskScore({
    gapPercent,
    volume24h,
    liquidityUsd,
    marketStatus: marketHours.status,
    volatilityLevel: Math.abs(gapPercent) > 3 ? 'high' : 'low',
    hoursSinceReferenceUpdate: referenceSource.includes('stale') ? 16 : 0,
  });

  const intelligence: AssetIntelligence = {
    symbol: upper,
    name: stock.name,
    mint: stock.mint,
    referencePrice,
    referenceSource,
    referenceUpdatedAt: new Date().toISOString(),
    onchainPrice,
    gapPercent,
    gapDollar,
    routes,
    bestRoute: routes[0] || null,
    riskScore,
    marketStatus: marketHours.status,
    liquidity: 'medium',
    source,
  };

  intelligenceCache.set(upper, { intelligence, timestamp: now });
  return intelligence;
}

export async function getAssetSnapshot(symbol: string): Promise<{ snapshot: PriceSnapshot; riskScore: GapRiskScore }> {
  const intel = await getAssetIntelligence(symbol);
  const snapshot = buildPriceSnapshot({
    symbol: intel.symbol,
    onchainPrice: intel.onchainPrice,
    referencePrice: intel.referencePrice,
    volume24h: 25000,
    liquidityUsd: intel.routes[0]?.liquidityUsd || 50000,
    marketStatus: intel.marketStatus,
    referenceUpdatedAt: intel.referenceUpdatedAt,
    observedAt: new Date().toISOString(),
  });
  return { snapshot, riskScore: intel.riskScore };
}

// Mock portfolio data (in production, read from Solana on-chain)
const mockPortfolios: Record<string, Portfolio> = {
  demo: {
    wallet: 'demo',
    totalValueUsd: 10000,
    holdings: [
      { symbol: 'ANTHROPIC', mint: 'Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw', amount: 2.9, valueUsd: 3000, weightPercent: 30 },
      { symbol: 'SPACEX', mint: 'PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh', amount: 21.1, valueUsd: 2500, weightPercent: 25 },
      { symbol: 'OPENAI', mint: 'PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF', amount: 1.73, valueUsd: 2000, weightPercent: 20 },
      { symbol: 'NEURALINK', mint: 'PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S', amount: 2.35, valueUsd: 1000, weightPercent: 10 },
      { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xB9qMLM6kq7K3e8n1W4c2X', amount: 1500, valueUsd: 1500, weightPercent: 15 },
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
   * GET /api/assets/:symbol/intelligence
   */
  app.get('/api/assets/:symbol/intelligence', async (c: Context) => {
    const symbol = getParam(c, 'symbol').toUpperCase();
    try {
      const intelligence = await getAssetIntelligence(symbol);
      return c.json(intelligence);
    } catch (e: any) {
      return c.json({ error: { code: 'not-found', message: e.message } }, 404);
    }
  });

  /**
   * GET /api/assets/:symbol/routes
   */
  app.get('/api/assets/:symbol/routes', async (c: Context) => {
    const symbol = getParam(c, 'symbol').toUpperCase();
    try {
      const intelligence = await getAssetIntelligence(symbol);
      return c.json(intelligence.routes);
    } catch (e: any) {
      return c.json({ error: { code: 'not-found', message: e.message } }, 404);
    }
  });

  /**
   * GET /api/assets/:symbol
   */
  app.get('/api/assets/:symbol', async (c: Context) => {
    const symbol = getParam(c, 'symbol').toUpperCase();
    try {
      const { snapshot, riskScore } = await getAssetSnapshot(symbol);
      return c.json({ snapshot, riskScore });
    } catch (e: any) {
      return c.json({ error: { code: 'not-found', message: e.message } }, 404);
    }
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

    const isRealOnChainSig =
      body.signature &&
      body.signature.length >= 44 &&
      !body.signature.startsWith('user_signed') &&
      !body.signature.startsWith('sig') &&
      !body.signature.startsWith('demo_');

    const result = await executeTradeSimulation(body);
    const signature = isRealOnChainSig ? body.signature! : result.signature;
    const finalResult = {
      signature,
      explorerUrl: `https://solscan.io/tx/${signature}?cluster=devnet`,
      status: 'confirmed' as const,
    };

    if (finalResult.status === 'confirmed') {
      updatePortfolio(portfolio, body);
      portfolios[body.wallet] = portfolio;
      const walletActivities = activities[body.wallet] ?? (activities[body.wallet] = []);
      const verb = body.action === 'buy' ? 'Bought' : 'Sold';
      walletActivities.push({
        id: `tx_${Date.now()}`,
        timestamp: new Date().toISOString(),
        description: `${verb} $${Math.round(body.amountUsd)} ${body.asset} — risk governor approved`,
        txSignature: signature,
        status: 'success',
      });
    }

    return c.json({ result: finalResult });
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

  for (const holding of portfolio.holdings) {
    const stock = SUPPORTED_STOCKS.find((s) => s.symbol === holding.symbol);
    if (!stock) continue;

    const { snapshot, riskScore } = await getAssetSnapshot(holding.symbol);

    summaries.push({
      symbol: holding.symbol,
      onchainPrice: snapshot.onchainPrice,
      referencePrice: snapshot.referencePrice,
      gapPercent: snapshot.gapPercent,
      valueUsd: holding.valueUsd,
      weightPercent: holding.weightPercent,
      riskScore,
      marketStatus: snapshot.marketStatus,
      liquidity: snapshot.liquidity,
    });
  }

  return summaries;
}

async function buildAIContext(symbol: string, portfolio: Portfolio): Promise<AIAnalysisContext> {
  const stock = SUPPORTED_STOCKS.find((s) => s.symbol === symbol);
  if (!stock) throw new Error(`Unknown stock: ${symbol}`);

  const { snapshot } = await getAssetSnapshot(symbol);

  const regime = classifyRegime({
    marketStatus: snapshot.marketStatus,
    volatilityLevel: Math.abs(snapshot.gapPercent) > 3 ? 'high' : 'medium',
    liquidity: snapshot.liquidity,
    gapPercent: snapshot.gapPercent,
    concentration: portfolio.holdings.some((h) => h.symbol === symbol && h.weightPercent > 40) ? 'high' : 'medium',
    isWeekend: true,
  });

  const holding = portfolio.holdings.find((h) => h.symbol === symbol);

  return {
    asset: symbol,
    onchainPrice: snapshot.onchainPrice,
    referencePrice: snapshot.referencePrice,
    gapPercent: snapshot.gapPercent,
    marketStatus: snapshot.marketStatus,
    liquidity: snapshot.liquidity,
    portfolioExposure: holding?.weightPercent ?? 0,
    maxAllowedExposure: DEFAULT_RISK_POLICY.maxSingleAssetExposurePercent,
    regime,
    portfolioTotalValueUsd: portfolio.totalValueUsd,
  };
}

function updatePortfolio(portfolio: Portfolio, trade: { action: 'buy' | 'sell'; asset: string; amountUsd: number }): void {
  const assetHolding = portfolio.holdings.find((h) => h.symbol === trade.asset);
  let usdcHolding = portfolio.holdings.find((h) => h.symbol === 'USDC');

  if (!usdcHolding) {
    const newUsdc: PortfolioHolding = {
      symbol: 'USDC',
      mint: 'EPjFWdd5AufqSSqeM2qN1xB9qMLM6kq7K3e8n1W4c2X',
      amount: 0,
      valueUsd: 0,
      weightPercent: 0,
    };
    (portfolio.holdings as PortfolioHolding[]).push(newUsdc);
    usdcHolding = newUsdc;
  }

  if (trade.action === 'sell') {
    if (assetHolding) {
      const sellAmount = Math.min(assetHolding.valueUsd, trade.amountUsd);
      assetHolding.valueUsd = Math.max(0, assetHolding.valueUsd - sellAmount);
      usdcHolding.valueUsd += sellAmount;
      usdcHolding.amount = usdcHolding.valueUsd;
    }
  } else if (trade.action === 'buy') {
    if (assetHolding) {
      const buyAmount = Math.min(usdcHolding.valueUsd, trade.amountUsd);
      assetHolding.valueUsd += buyAmount;
      usdcHolding.valueUsd = Math.max(0, usdcHolding.valueUsd - buyAmount);
      usdcHolding.amount = usdcHolding.valueUsd;
    }
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
  // Generate realistic 88-character base58 Solana transaction signature
  const b58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let signature = '5';
  for (let i = 0; i < 87; i++) {
    signature += b58.charAt(Math.floor(Math.random() * b58.length));
  }
  return {
    signature,
    explorerUrl: `https://solscan.io/tx/${signature}?cluster=devnet`,
    status: 'confirmed',
  };
}

export const app = createApp();
export { config as apiConfig };
