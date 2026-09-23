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
  // Network comes from the single source of truth in @/lib/network, so the
  // connection and every UI label / explorer link always agree on the cluster.
  const network = useMemo(() => {
    switch (NETWORK) {
      case 'devnet':
        return WalletAdapterNetwork.Devnet;
      case 'testnet':
        return WalletAdapterNetwork.Testnet;
      default:
        return WalletAdapterNetwork.Mainnet;
    }
  }, []);
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl(network),
    [network]
  );

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
