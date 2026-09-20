const fs = require('fs');
let code = fs.readFileSync('apps/api/src/index.ts', 'utf8');

// Imports
code = code.replace(/import type \{([^}]+)\} from '@afterhours\/types';/, 
  (match, p1) => `import type { ${p1.trim()}, AssetIntelligence, PreStocksAsset, RouteComparison } from '@afterhours/types';`);

// Replace the getAssetSnapshot block
const snapshotBlockRegex = /interface CachedSnapshot \{[\s\S]*?export function getAssetSnapshot\(symbol: string\): \{ snapshot: PriceSnapshot; riskScore: GapRiskScore \} \{[\s\S]*?return \{ snapshot, riskScore \};\n\}/;

const newBlock = `
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
    if (!res.ok) throw new Error(\`PreStocks API \${res.status}\`);
    return await res.json() as PreStocksAsset[];
  } catch {
    return []; // graceful fallback
  }
}

async function fetchJupiterQuote(inputMint: string, outputMint: string, amountUsdc: number): Promise<RouteComparison | null> {
  try {
    const amount = Math.floor(amountUsdc * 1_000_000);
    const url = \`https://quote-api.jup.ag/v6/quote?inputMint=\${inputMint}&outputMint=\${outputMint}&amount=\${amount}&slippageBps=50\`;
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
    const url = \`https://hermes.pyth.network/v2/updates/price/latest?ids[]=\${feedId}\`;
    const res = await fetch(url, {
      headers: { Authorization: \`Bearer \${apiKey}\` },
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
  if (!stock) throw new Error(\`Unsupported asset: \${upper}\`);

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
`;

code = code.replace(snapshotBlockRegex, newBlock);

// Update mockPortfolios
code = code.replace(/const mockPortfolios: Record<string, Portfolio> = [\s\S]*?timestamp: new Date\(\)\.toISOString\(\),\n  \},\n\};/, `const mockPortfolios: Record<string, Portfolio> = {
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
};`);

// Add new endpoints
code = code.replace(/app\.get\('\/api\/assets\/:symbol', async \(c: Context\) => \{[\s\S]*?return c\.json\(\{ snapshot, riskScore \}\);\n  \}\);/, `app.get('/api/assets/:symbol/intelligence', async (c: Context) => {
    const symbol = getParam(c, 'symbol').toUpperCase();
    try {
      const intelligence = await getAssetIntelligence(symbol);
      return c.json(intelligence);
    } catch (e: any) {
      return c.json({ error: { code: 'not-found', message: e.message } }, 404);
    }
  });

  app.get('/api/assets/:symbol/routes', async (c: Context) => {
    const symbol = getParam(c, 'symbol').toUpperCase();
    try {
      const intelligence = await getAssetIntelligence(symbol);
      return c.json(intelligence.routes);
    } catch (e: any) {
      return c.json({ error: { code: 'not-found', message: e.message } }, 404);
    }
  });

  app.get('/api/assets/:symbol', async (c: Context) => {
    const symbol = getParam(c, 'symbol').toUpperCase();
    try {
      const { snapshot, riskScore } = await getAssetSnapshot(symbol);
      return c.json({ snapshot, riskScore });
    } catch (e: any) {
      return c.json({ error: { code: 'not-found', message: e.message } }, 404);
    }
  });`);

// Fix await getAssetSnapshot in buildAssetSummaries
code = code.replace(/const \{ snapshot, riskScore \} = getAssetSnapshot\(holding\.symbol\);/g, 'const { snapshot, riskScore } = await getAssetSnapshot(holding.symbol);');

// Fix await getAssetSnapshot in buildAIContext
code = code.replace(/const \{ snapshot \} = getAssetSnapshot\(symbol\);/g, 'const { snapshot } = await getAssetSnapshot(symbol);');

fs.writeFileSync('apps/api/src/index.ts', code);
console.log('done');
