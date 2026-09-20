/**
 * AfterHours Solana integration layer.
 *
 * Provides:
 * - Wallet connection (EIP-6963-like multi-wallet via Solana Wallet Adapter)
 * - Token balance reading (SPL tokens)
 * - Swap execution via Jupiter (DEX aggregator)
 * - Transaction signing and submission
 *
 * Uses @solana/web3.js for on-chain interaction. Wallet Adapter for the UI.
 */
import type { Portfolio, PortfolioHolding, TokenizedStock } from '@afterhours/types';
import type { TokenBalance } from './balances.js';

export { SUPPORTED_STOCKS, LEGACY_STOCKS, PYTH_FEED_MAP, getStock, getStockByMint } from './assets.js';
export {
  createWalletStore,
  type WalletStore,
  type WalletAdapter,
} from './wallet.js';
export { JupiterSwapProvider, type SwapQuote, type SwapRoute } from './dex.js';
export {
  buildSwapTransaction,
  signAndSend,
  type ExecutionResult,
  MEMO_PROGRAM_ID,
  buildRiskAttestationMemo,
} from './execution.js';
export {
  getTokenBalances,
  getTokenPriceUsd,
  type TokenBalance,
} from './balances.js';

/**
 * Build a Portfolio from on-chain token balances + price data.
 */
export function buildPortfolio(
  wallet: string,
  balances: TokenBalance[],
  stocks: readonly TokenizedStock[],
): Portfolio {
  const holdings: PortfolioHolding[] = [];

  for (const balance of balances) {
    const stock = stocks.find((s) => s.mint === balance.mint);
    if (stock) {
      const valueUsd = balance.amount / Math.pow(10, stock.decimals) * balance.priceUsd;
      holdings.push({
        symbol: stock.symbol,
        mint: stock.mint,
        amount: balance.amount / Math.pow(10, stock.decimals),
        valueUsd,
        weightPercent: 0, // computed below
      });
    } else if (balance.symbol === 'USDC') {
      const valueUsd = balance.amount / Math.pow(10, balance.decimals) * balance.priceUsd;
      holdings.push({
        symbol: 'USDC',
        mint: balance.mint,
        amount: balance.amount / Math.pow(10, balance.decimals),
        valueUsd,
        weightPercent: 0,
      });
    }
  }

  const totalValueUsd = holdings.reduce((sum, h) => sum + h.valueUsd, 0);

  for (const h of holdings) {
    h.weightPercent = totalValueUsd > 0 ? (h.valueUsd / totalValueUsd) * 100 : 0;
  }

  return {
    wallet,
    totalValueUsd,
    holdings: holdings as readonly PortfolioHolding[],
    timestamp: new Date().toISOString(),
  };
}
