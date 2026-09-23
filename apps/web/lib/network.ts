/**
 * Web-side Solana network source of truth.
 *
 * Next.js only inlines env vars prefixed `NEXT_PUBLIC_` into the client bundle,
 * so this wraps the shared resolver in `@afterhours/types` for browser use.
 * Every network label and explorer link in the UI should come from here, so a
 * label can never claim a different cluster than the transaction settled on.
 */
import {
  resolveSolanaNetwork,
  solanaNetworkLabel,
  solscanTxUrl,
  type SolanaNetwork,
} from '@afterhours/types';

/** Active network. Defaults to mainnet-beta (see `resolveSolanaNetwork`). */
export const NETWORK: SolanaNetwork = resolveSolanaNetwork(
  process.env.NEXT_PUBLIC_SOLANA_NETWORK,
  process.env.NEXT_PUBLIC_SOLANA_RPC,
);

/** Human-readable label, e.g. "Solana Mainnet-Beta". */
export const NETWORK_LABEL = solanaNetworkLabel(NETWORK);

/** Solscan URL for a transaction signature on the active network. */
export function txExplorerUrl(signature: string): string {
  return solscanTxUrl(signature, NETWORK);
}
