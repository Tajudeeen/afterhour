/**
 * Web-side Solana network source of truth.
 *
 * Enforces Solana Devnet across all connected wallets, on-chain transactions,
 * and explorer links. Any mainnet reference is strictly rerouted to Devnet.
 */
import {
  resolveSolanaNetwork,
  solanaNetworkLabel,
  solscanTxUrl,
  type SolanaNetwork,
} from '@afterhours/types';

/** Active network: explicitly locked to devnet. */
export const NETWORK: SolanaNetwork = resolveSolanaNetwork(
  process.env.NEXT_PUBLIC_SOLANA_NETWORK,
  process.env.NEXT_PUBLIC_SOLANA_RPC,
);

/** Human-readable label: "Solana Devnet". */
export const NETWORK_LABEL = solanaNetworkLabel(NETWORK);

/** Solscan URL for a transaction signature on the active network (includes ?cluster=devnet). */
export function txExplorerUrl(signature: string): string {
  return solscanTxUrl(signature, NETWORK);
}
