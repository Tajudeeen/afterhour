/**
 * Transaction execution — build, sign, and send swap transactions on Solana.
 *
 * The Risk Governor has already approved the trade. The user has confirmed.
 * This layer executes the actual on-chain transaction.
 */
import type { Connection, Transaction } from '@solana/web3.js';
import { resolveSolanaNetwork, solscanTxUrl, type SolanaNetwork } from '@afterhours/types';
import type { SwapQuote } from './dex.js';
import type { WalletAdapter } from './wallet.js';

/**
 * Network the explorer links are built for. Derived from env so a receipt can
 * never point at a different cluster than the transaction settled on.
 */
const NETWORK: SolanaNetwork = resolveSolanaNetwork(
  process.env.SOLANA_NETWORK,
  process.env.SOLANA_RPC_URL,
);

export interface ExecutionResult {
  /** Transaction signature */
  signature: string;
  /**explorer URL */
  explorerUrl: string;
  /** Status: confirmed or failed */
  status: 'confirmed' | 'failed';
  /** Error message if failed */
  error?: string;
}

export interface ExecuteSwapInput {
  userAddress: string;
  quote: SwapQuote;
  wallet: WalletAdapter;
}

/**
 * Execute a swap: build transaction, sign with wallet, send to Solana.
 */
export async function executeSwap(
  connection: Connection,
  input: ExecuteSwapInput,
): Promise<ExecutionResult> {
  const { userAddress, quote, wallet } = input;

  if (!wallet.isConnected()) {
    throw new Error('Wallet is not connected');
  }

  try {
    // Build the swap transaction
    const transaction = await buildSwapTransaction(connection, {
      userAddress,
      quote,
    });

    // Sign and send
    const signature = await wallet.signAndSend(transaction);

    // Wait for confirmation
    const confirmed = await awaitConfirmation(connection, signature, 30_000);

    if (confirmed) {
      return {
        signature,
        explorerUrl: solscanTxUrl(signature, NETWORK),
        status: 'confirmed',
      };
    }

    return {
      signature,
      explorerUrl: solscanTxUrl(signature, NETWORK),
      status: 'failed',
      error: 'Transaction was not confirmed within timeout',
    };
  } catch (error) {
    return {
      signature: '',
      explorerUrl: '',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown execution error',
    };
  }
}

/**
 * Build a real Jupiter swap transaction for the user's wallet.
 * Calls Jupiter POST /swap to get a serialized transaction, then deserializes it.
 */
export async function buildSwapTransaction(
  connection: Connection,
  input: { userAddress: string; quote: SwapQuote },
): Promise<Transaction> {
  const { userAddress, quote } = input;
  const { Transaction, PublicKey } = await import('@solana/web3.js');

  // Call Jupiter API to get the swap transaction
  const swapRes = await fetch('https://api.jup.ag/swap/v1/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      routeInfo: {
        swapId: quote.route.inputMint,
        outAmount: quote.route.outputAmount,
      },
      userPublicKey: userAddress,
      wrapUnwrapUSD: true,
      computeUnitPriceMicroLamports: 1,
    }),
  });

  if (!swapRes.ok) {
    throw new Error(`Jupiter swap API failed: ${swapRes.status}`);
  }

  const swapData = await swapRes.json() as { swapTransaction: string };
  const swapBuffer = Buffer.from(swapData.swapTransaction, 'base64');
  const transaction = Transaction.from(swapBuffer);

  // Update with recent blockhash
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = new PublicKey(userAddress);

  return transaction;
}

/**
 * Sign and send a transaction to Solana.
 */
export async function signAndSend(
  connection: Connection,
  transaction: Transaction,
  wallet: WalletAdapter,
): Promise<string> {
  if (!wallet.isConnected()) {
    throw new Error('Wallet is not connected');
  }
  return wallet.signAndSend(transaction);
}

/**
 * Wait for transaction confirmation.
 */
async function awaitConfirmation(
  connection: Connection,
  signature: string,
  timeoutMs: number,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const sigStatus = await connection.getSignatureStatuses([signature]);
    const status = sigStatus.value?.[0];
    if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
      return true;
    }
    if (status?.err) {
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  return false;
}

/** Official Solana SPL Memo Program v2 */
export const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

/**
 * Format a verifiable on-chain risk governor attestation message for the SPL Memo program.
 */
export function buildRiskAttestationMemo(input: {
  action: 'buy' | 'sell';
  asset: string;
  amountUsd: number;
  maxExposurePercent?: number;
}): string {
  const exposureClause = input.maxExposurePercent ? ` (Cap: ${input.maxExposurePercent}%)` : '';
  return `AfterHours: ${input.action.toUpperCase()} $${Math.round(input.amountUsd)} ${input.asset} | Risk Governor: Approved${exposureClause}`;
}
