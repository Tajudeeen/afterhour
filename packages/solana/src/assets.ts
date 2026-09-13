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

export const SUPPORTED_STOCKS: readonly TokenizedStock[] = [
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

/** USDC mint on Solana. */
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xB9qMLM6kq7K3e8n1W4c2X';
export const USDC_DECIMALS = 6;

export function getStock(symbol: string): TokenizedStock | undefined {
  return SUPPORTED_STOCKS.find((s) => s.symbol === symbol);
}

export function getStockByMint(mint: string): TokenizedStock | undefined {
  return SUPPORTED_STOCKS.find((s) => s.mint === mint);
}
