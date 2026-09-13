/**
 * Wallet connection abstraction.
 *
 * Supports both browser (Solana Wallet Adapter) and headless (keypair) modes.
 * EIP-6913 multi-wallet support is handled via @solana/wallet-adapter-react
 * in the frontend; this package provides the shared store interface.
 */
import type { Transaction } from '@solana/web3.js';

export interface WalletAdapter {
  /** Connect the wallet. Returns the public key or throws. */
  connect(): Promise<string>;
  /** Disconnect the wallet. */
  disconnect(): Promise<void>;
  /** The connected public key, or null. */
  getPublicKey(): string | null;
  /** Sign and send a transaction. Returns the signature. */
  signAndSend(transaction: Transaction): Promise<string>;
  /** Whether the wallet is currently connected. */
  isConnected(): boolean;
}

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletStore {
  status: WalletStatus;
  publicKey: string | null;
  adapter: WalletAdapter | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSend: (tx: Transaction) => Promise<string>;
}

/**
 * Create a wallet store that wraps a wallet adapter.
 * Used in both the browser (via Wallet Adapter) and headless test contexts.
 */
export function createWalletStore(adapter: WalletAdapter): WalletStore {
  let status: WalletStatus = 'disconnected';
  let publicKey: string | null = null;

  return {
    get status() {
      return status;
    },
    get publicKey() {
      return publicKey;
    },
    get adapter() {
      return adapter;
    },
    async connect() {
      status = 'connecting';
      try {
        publicKey = await adapter.connect();
        status = 'connected';
      } catch {
        status = 'error';
        throw new Error('Wallet connection failed');
      }
    },
    async disconnect() {
      await adapter.disconnect();
      publicKey = null;
      status = 'disconnected';
    },
    async signAndSend(tx: Transaction) {
      if (!publicKey || status !== 'connected') {
        throw new Error('Wallet is not connected');
      }
      return adapter.signAndSend(tx);
    },
  };
}

/**
 * Headless wallet adapter — uses a local keypair for testing/demo.
 * In production, the browser adapter is used via @solana/wallet-adapter-react.
 */
export class KeypairWalletAdapter implements WalletAdapter {
  private keypair: { publicKey: string; secretKey: Uint8Array } | null = null;

  constructor(keypair?: { publicKey: string; secretKey: Uint8Array }) {
    this.keypair = keypair ?? null;
  }

  async connect(): Promise<string> {
    if (!this.keypair) throw new Error('No keypair configured');
    return this.keypair.publicKey;
  }

  async disconnect(): Promise<void> {
    // no-op for keypair
  }

  getPublicKey(): string | null {
    return this.keypair?.publicKey ?? null;
  }

  async signAndSend(_transaction: Transaction): Promise<string> {
    if (!this.keypair) throw new Error('Wallet not connected');
    // In a real implementation, this would sign with the keypair and send via RPC
    return 'simulated_tx_signature';
  }

  isConnected(): boolean {
    return this.keypair !== null;
  }
}
