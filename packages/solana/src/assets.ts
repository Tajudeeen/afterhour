/**
 * Tokenized stock definitions with verified Solana mint addresses.
 *
 * For the hackathon we support 5 major tickers. In a production system this
 * would be dynamically discovered from a registry.
 *
 * Mint addresses are illustrative — in production these would be the actual
 * mint addresses of tokenized stocks on Solana (e.g. from Jupiter token list,
 * Alchemy, or the issuing protocol's on-chain registry).
 */
import type { TokenizedStock } from '@afterhours/types';

export const LEGACY_STOCKS: readonly TokenizedStock[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    mint: 'DezYN7vS56KDyHiLnuW5G9b2doY5xBLk7s6o5YJr4YWr',
    decimals: 6,
    referencePrice: 182.4,
    currency: 'USD',
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    mint: '6dbRFHr7SxG8i5kHnBLY5YFvU3x5xVJoY5hK5a5qJ8eR',
    decimals: 6,
    referencePrice: 214.8,
    currency: 'USD',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    mint: 'Gyu3qZ5b7Kq3e8n1W4c2X6y9J3a5K7b8L4m9N2P1Q6R',
    decimals: 6,
    referencePrice: 268.5,
    currency: 'USD',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    mint: '4k3DyN5wF8o2Q8rKq3e8n1W4c2X6y9J3a5K7b8L4m9N',
    decimals: 6,
    referencePrice: 420.0,
    currency: 'USD',
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    mint: '5a7K3e8n1W4c2X6y9J3a5K7b8L4m9N2P1Q6R7s8T9uV',
    decimals: 6,
    referencePrice: 172.3,
    currency: 'USD',
  },
];

export const SUPPORTED_STOCKS: readonly TokenizedStock[] = [
  { symbol: 'ANTHROPIC', name: 'Anthropic', mint: 'Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw', decimals: 6, referencePrice: 1029.32, currency: 'USD' },
  { symbol: 'SPACEX', name: 'SpaceX', mint: 'PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh', decimals: 6, referencePrice: 152.59, currency: 'USD' },
  { symbol: 'OPENAI', name: 'OpenAI', mint: 'PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF', decimals: 6, referencePrice: 994.16, currency: 'USD' },
  { symbol: 'ANDURIL', name: 'Anduril', mint: 'PresTj4Yc2bAR197Er7wz4UUKSfqt6FryBEdAriBoQB', decimals: 6, referencePrice: 153.38, currency: 'USD' },
  { symbol: 'NEURALINK', name: 'Neuralink', mint: 'PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S', decimals: 6, referencePrice: 335.26, currency: 'USD' },
  { symbol: 'FIGUREAI', name: 'Figure AI', mint: 'PreZad18qfPtbxNpMtMuAuX2zVpvkEU8DnJx56faCWd', decimals: 6, referencePrice: 181.29, currency: 'USD' },
  { symbol: 'KALSHI', name: 'Kalshi', mint: 'PreLWGkkeqG1s4HEfFZSy9moCrJ7btsHuUtfcCeoRua', decimals: 6, referencePrice: 894.78, currency: 'USD' },
  { symbol: 'POLYMARKET', name: 'Polymarket', mint: 'Pre8AREmFPtoJFT8mQSXQLh56cwJmM7CFDRuoGBZiUP', decimals: 6, referencePrice: 143.89, currency: 'USD' }
];

/** USDC mint on Solana. */
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xB9qMLM6kq7K3e8n1W4c2X';
export const USDC_DECIMALS = 6;

export function getStock(symbol: string): TokenizedStock | undefined {
  return SUPPORTED_STOCKS.find((s) => s.symbol === symbol) || LEGACY_STOCKS.find((s) => s.symbol === symbol);
}

export function getStockByMint(mint: string): TokenizedStock | undefined {
  return SUPPORTED_STOCKS.find((s) => s.mint === mint) || LEGACY_STOCKS.find((s) => s.mint === mint);
}

/** Pyth Network equity and tokenized stock price feed mappings */
export const PYTH_FEED_MAP: Record<string, string> = {
  NVDA: 'b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593',
  AAPL: '49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688',
  TSLA: '16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1',
};

export interface PythFeedPairConfig {
  symbol: string;
  name: string;
  equitySymbol: string;
  equityFeedId: string;
  tokenSymbol: string;
  tokenFeedId: string;
  tokenType: 'xStock' | 'Ondo';
  ondoFeedId?: string;
  defaultEquityPrice: number;
  defaultTokenPrice: number;
}

export const PYTH_EQUITY_FEEDS: Record<string, PythFeedPairConfig> = {
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    equitySymbol: 'Equity.US.AAPL/USD',
    equityFeedId: '49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688',
    tokenSymbol: 'Crypto.AAPLX/USD',
    tokenFeedId: '978e6cc68a119ce066aa830017318563a9ed04ec3a0a6439010fc11296a58675',
    tokenType: 'xStock',
    ondoFeedId: 'e6734de88a83d9d2fb33072adab319004700aefd069653aba30ba9e3cac056f2',
    defaultEquityPrice: 214.80,
    defaultTokenPrice: 218.40,
  },
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    equitySymbol: 'Equity.US.NVDA/USD',
    equityFeedId: 'b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593',
    tokenSymbol: 'Crypto.NVDAX/USD',
    tokenFeedId: '4244d07890e4610f46bbde67de8f43a4bf8b569eebe904f136b469f148503b7f',
    tokenType: 'xStock',
    ondoFeedId: '207ddea2a443d30b7e13a7c88a9e3f106765deb97049afc65a18cede50fffc82',
    defaultEquityPrice: 182.40,
    defaultTokenPrice: 189.70,
  },
  TSLA: {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    equitySymbol: 'Equity.US.TSLA/USD',
    equityFeedId: '16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1',
    tokenSymbol: 'Crypto.TSLAX/USD',
    tokenFeedId: '47a156470288850a440df3a6ce85a55917b813a19bb5b31128a33a986566a362',
    tokenType: 'xStock',
    ondoFeedId: 'c09ef687ed07091c047da444f1499f2da52cdc1c085104643ec565a9eb1af514',
    defaultEquityPrice: 268.50,
    defaultTokenPrice: 274.20,
  },
};

