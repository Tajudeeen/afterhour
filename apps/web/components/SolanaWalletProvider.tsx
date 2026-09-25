'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { NETWORK } from '@/lib/network';

// Default wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  // Always connect to Devnet (reroutes any mainnet requests to devnet)
  const network = useMemo(() => {
    switch (NETWORK) {
      case 'testnet':
        return WalletAdapterNetwork.Testnet;
      case 'devnet':
      default:
        return WalletAdapterNetwork.Devnet;
    }
  }, []);

  const endpoint = useMemo(() => {
    const customRpc = process.env.NEXT_PUBLIC_SOLANA_RPC?.trim();
    // Guard against any leftover mainnet RPC endpoint
    if (customRpc && !customRpc.toLowerCase().includes('mainnet')) {
      return customRpc;
    }
    return clusterApiUrl(network);
  }, [network]);

  // Wallet Standard automatically detects installed browser wallets (Phantom, Solflare, Backpack, etc.)
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
