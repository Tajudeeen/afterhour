// Token mint mappings for tokenized stocks (mirrors packages/solana/src/assets.ts)
// This avoids importing the heavy @afterhours/solana package into the web client.

export interface StockInfo {
  mint: string;
  name: string;
  decimals: number;
  referencePrice: number;
}

export const STOCK_MINTS: Record<string, StockInfo> = {
  // Legacy pre-stocks (illustrative mints — production would use real token addresses)
  NVDA: { mint: 'DezYN7vS56KDyHiLnuW5G9b2doY5xBLk7s6o5YJr4YWr', name: 'NVIDIA Corporation', decimals: 6, referencePrice: 182.4 },
  AAPL: { mint: '6dbRFHr7SxG8i5kHnBLY5YFvU3x5xVJoY5hK5a5qJ8eR', name: 'Apple Inc.', decimals: 6, referencePrice: 214.8 },
  TSLA: { mint: 'Gyu3qZ5b7Kq3e8n1W4c2X6y9J3a5K7b8L4m9N2P1Q6R', name: 'Tesla, Inc.', decimals: 6, referencePrice: 268.5 },
  MSFT: { mint: '4k3DyN5wF8o2Q8rKq3e8n1W4c2X6y9J3a5K7b8L4m9N', name: 'Microsoft Corporation', decimals: 6, referencePrice: 420.0 },
  GOOGL: { mint: '5a7K3e8n1W4c2X6y9J3a5K7b8L4m9N2P1Q6R7s8T9uV', name: 'Alphabet Inc.', decimals: 6, referencePrice: 172.3 },
  // Pre-stocks
  ANTHROPIC: { mint: 'Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw', name: 'Anthropic', decimals: 6, referencePrice: 1029.32 },
  SPACEX: { mint: 'PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh', name: 'SpaceX', decimals: 6, referencePrice: 152.59 },
  OPENAI: { mint: 'PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF', name: 'OpenAI', decimals: 6, referencePrice: 994.16 },
  ANDURIL: { mint: 'PresTj4Yc2bAR197Er7wz4UUKSfqt6FryBEdAriBoQB', name: 'Anduril', decimals: 6, referencePrice: 153.38 },
  NEURALINK: { mint: 'PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S', name: 'Neuralink', decimals: 6, referencePrice: 335.26 },
  FIGUREAI: { mint: 'PreZad18qfPtbxNpMtMuAuX2zVpvkEU8DnJx56faCWd', name: 'Figure AI', decimals: 6, referencePrice: 181.29 },
  KALSHI: { mint: 'PreLWGkkeqG1s4HEfFZSy9moCrJ7btsHuUtfcCeoRua', name: 'Kalshi', decimals: 6, referencePrice: 894.78 },
  POLYMARKET: { mint: 'Pre8AREmFPtoJFT8mQSXQLh56cwJmM7CFDRuoGBZiUP', name: 'Polymarket', decimals: 6, referencePrice: 143.89 },
};

export function getStockBySymbol(symbol: string): StockInfo | undefined {
  return STOCK_MINTS[symbol.toUpperCase()];
}
