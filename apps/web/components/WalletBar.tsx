'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

function WalletBarInner() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected && publicKey) {
    const base58 = publicKey.toBase58();
    const shortAddr = `${base58.slice(0, 4)}...${base58.slice(-4)}`;
    return (
      <div className="wallet-bar">
        <button
          className="wallet-connect"
          type="button"
          onClick={() => disconnect()}
          title="Click to disconnect wallet"
          style={{ borderColor: 'var(--lime)', color: 'var(--lime)' }}
        >
          <span className="dot" />
          {shortAddr}
        </button>
        <span className="wallet-connected" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(216, 255, 79, 0.12)',
              color: 'var(--lime)',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}
          >
            MAINNET
          </span>
          <span>Live wallet connected</span>
        </span>
      </div>
    );
  }

  return (
    <div className="wallet-bar">
      <button className="wallet-connect" type="button" onClick={() => setVisible(true)}>
        <span className="dot" /> Connect Solana wallet
      </button>
      <span className="wallet-connected">Connected as demo (Risk Governor active)</span>
    </div>
  );
}

export function WalletBar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="wallet-bar">
        <button className="wallet-connect" type="button">
          <span className="dot" /> Connect Solana wallet
        </button>
        <span className="wallet-connected">Connected as demo</span>
      </div>
    );
  }

  return <WalletBarInner />;
}
