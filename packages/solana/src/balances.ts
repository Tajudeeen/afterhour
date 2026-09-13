/**
 * Token balance reader — reads SPL token balances from Solana RPC.
 */
import { Connection, PublicKey } from '@solana/web3.js';
import { USDC_DECIMALS, USDC_MINT } from './assets.js';

export interface TokenBalance {
  mint: string;
  symbol: string;
  amount: number; // raw units (before decimals)
  decimals: number;
  priceUsd: number; // per-token price in USD
  valueUsd: number; // total value
}

/**
 * Fetch token balances for a wallet address.
 * Returns USDC + all supported tokenized stocks the wallet holds.
 */
export async function getTokenBalances(
  connection: Connection,
  wallet: string,
): Promise<TokenBalance[]> {
  const balances: TokenBalance[] = [];

  // Fetch USDC balance
  const usdcBalance = await fetchTokenBalance(connection, wallet, USDC_MINT);
  if (usdcBalance && usdcBalance.amount > 0) {
    balances.push({
      mint: USDC_MINT,
      symbol: 'USDC',
      amount: usdcBalance.amount,
      decimals: USDC_DECIMALS,
      priceUsd: 1.0,
      valueUsd: (usdcBalance.amount / Math.pow(10, USDC_DECIMALS)) * 1.0,
    });
  }

  // Check each supported stock
  const { SUPPORTED_STOCKS } = await import('./assets.js');
  for (const stock of SUPPORTED_STOCKS) {
    const balance = await fetchTokenBalance(connection, wallet, stock.mint);
    if (balance && balance.amount > 0) {
      const priceUsd = await getTokenPriceUsd(stock.mint);
      balances.push({
        mint: stock.mint,
        symbol: stock.symbol,
        amount: balance.amount,
        decimals: stock.decimals,
        priceUsd,
        valueUsd: (balance.amount / Math.pow(10, stock.decimals)) * priceUsd,
      });
    }
  }

  return balances;
}

interface RawTokenBalance {
  amount: number;
}

/**
 * Fetch a single SPL token balance from Solana RPC.
 */
async function fetchTokenBalance(
  connection: Connection,
  wallet: string,
  mint: string,
): Promise<RawTokenBalance | null> {
  try {
    const pubkey = new PublicKey(wallet);
    const mintPubkey = new PublicKey(mint);
    const accounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
      mint: mintPubkey,
    });

    if (accounts.value.length === 0) return null;
    const account = accounts.value[0];
    if (!account) return null;

    const data = account.account.data as {
      parsed: { info: { tokenAmount: { amount: string; decimals: number } } };
    };

    return {
      amount: Number(data.parsed.info.tokenAmount.amount),
    };
  } catch {
    return null;
  }
}

/**
 * Get the current USD price of a token (mock for hackathon).
 * In production, this reads from Pyth, Switchboard, or Jupiter price feeds.
 */
export async function getTokenPriceUsd(mint: string): Promise<number> {
  // For the hackathon, we use a mock price feed that simulates gaps.
  // In production: fetch from Pyth (pyth.network) or Jupiter.
  const { SUPPORTED_STOCKS, USDC_MINT } = await import('./assets.js');

  if (mint === USDC_MINT) return 1.0;

  const stock = SUPPORTED_STOCKS.find((s) => s.mint === mint);
  if (!stock) return 0;

  // Simulate a small random gap from the reference price
  // (0-5% premium/discount) — in production this comes from real on-chain DEX price
  const randomGap = (Math.random() * 4 - 2) / 100; // -2% to +2%
  return stock.referencePrice * (1 + randomGap);
}
