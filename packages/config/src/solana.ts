/**
 * Solana network constants — verified public RPC endpoints and chain IDs.
 *
 * SOURCE OF TRUTH: Solana documentation and public RPC providers.
 * https://solana.com/docs/rpc
 */

/** Solana mainnet-beta chain ID (for reference; dev/demo uses devnet). */
export const SOLANA_CHAIN_ID = 101;

/** Local validator default RPC URL. */
export const SOLANA_LOCALNET_RPC_URL = 'http://127.0.0.1:8899';

/** Public devnet RPC — used for hackathon demos (free, no real funds needed). */
export const SOLANA_DEVNET_RPC_URL = 'https://api.devnet.solana.com';

/** Public testnet RPC. */
export const SOLANA_TESTNET_RPC_URL = 'https://api.testnet.solana.com';

/** Public mainnet RPC (Helius / Alchemy / etc.). */
export const SOLANA_MAINNET_RPC_URL = 'https://api.mainnet-beta.solana.com';
