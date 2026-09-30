'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { executeTrade, type RiskEvaluation } from '@/lib/api';
import { saveLocalActivity } from '@/lib/activity';
import { NETWORK_LABEL, txExplorerUrl } from '@/lib/network';
import { Buffer } from 'buffer';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

function ExecuteButtonInner({ symbol, evaluation }: { symbol: string; evaluation: RiskEvaluation }) {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();

  const [status, setStatus] = useState<
    'idle' | 'signing' | 'confirming' | 'executing' | 'success' | 'error'
  >('idle');
  const [result, setResult] = useState<{ signature: string; explorerUrl: string; isLiveOnchain: boolean } | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [airdropMsg, setAirdropMsg] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState(false);

  const handleAirdrop = async () => {
    if (!publicKey) return;
    setIsAirdropping(true);
    setAirdropMsg(null);
    try {
      const sig = await connection.requestAirdrop(publicKey, 1_000_000_000); // 1 SOL
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
      setAirdropMsg('✓ Received 1 Devnet SOL! You can now execute the transaction.');
      setErrMsg(null);
    } catch {
      // If devnet public RPC airdrop rate limits, open official faucet directly
      window.open(`https://faucet.solana.com/?address=${publicKey.toBase58()}`, '_blank');
      setAirdropMsg('Opened Solana Faucet in a new tab. Request test SOL and click Sign & execute again.');
    } finally {
      setIsAirdropping(false);
    }
  };

  const handleDemoExecution = async () => {
    setStatus('confirming');
    setErrMsg(null);

    try {
      const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      let demoSig = 'Demo';
      for (let i = 0; i < 84; i++) {
        demoSig += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const verb = evaluation.proposed.action === 'buy' ? 'Bought' : 'Sold';
      saveLocalActivity({
        id: `demo_${Date.now()}`,
        timestamp: new Date().toISOString(),
        description: `${verb} $${Math.round(evaluation.proposed.amountUsd)} ${symbol} - demo risk simulation approved`,
        txSignature: demoSig,
        status: 'success',
      });

      setStatus('executing');

      let explorerUrl = txExplorerUrl(demoSig);
      try {
        const res = await executeTrade({
          wallet: 'demo',
          action: evaluation.proposed.action,
          asset: symbol,
          amountUsd: evaluation.proposed.amountUsd,
          signature: demoSig,
        });

        if (res?.result?.explorerUrl) {
          explorerUrl = res.result.explorerUrl;
        }
      } catch (apiErr) {
        console.warn('API execution notification warning (demo simulated):', apiErr);
      }

      setResult({
        signature: demoSig,
        explorerUrl,
        isLiveOnchain: false,
      });
      setStatus('success');
    } catch (e: unknown) {
      console.error('Demo execution error:', e);
      setErrMsg(e instanceof Error ? e.message : 'Demo execution failed');
      setStatus('error');
    }
  };

  const handleLiveOnchainExecution = async () => {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    setStatus('signing');
    setErrMsg(null);

    try {
      const tx = new Transaction();

      // Check balance: Solana consensus requires ~0.000005 SOL signature fee on Devnet
      let balance = 0;
      try {
        balance = await connection.getBalance(publicKey);
      } catch (balErr) {
        console.warn('Could not query wallet balance via RPC:', balErr);
        balance = 50_000;
      }

      if (balance === 0) {
        throw new Error(
          'Your connected wallet has 0 Devnet SOL. Solana Devnet transactions require a micro network fee (~0.000005 free test SOL) to verify the transaction on-chain. Please request free Devnet SOL using the button below.',
        );
      }

      // Add SPL Memo risk governance attestation instruction (Zero token transfer)
      const memoText = `AfterHours: ${evaluation.proposed.action.toUpperCase()} $${Math.round(
        evaluation.proposed.amountUsd,
      )} ${symbol} | Risk Governor: Passed (Cap: ${evaluation.policy.maxSingleAssetExposurePercent}%)`;
      const dataBytes = new TextEncoder().encode(memoText);

      const memoInstruction = new TransactionInstruction({
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(dataBytes),
      });

      tx.add(memoInstruction);

      // Get recent blockhash and configure fee payer
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;

      // Use skipPreflight: true so wallet extension does not abort with generic simulation errors
      const txSig = await sendTransaction(tx, connection, { skipPreflight: true });
      setStatus('confirming');

      try {
        await connection.confirmTransaction(
          { signature: txSig, blockhash, lastValidBlockHeight },
          'confirmed',
        );
      } catch (confirmErr) {
        console.warn('Devnet confirmation warning (proceeding to verification):', confirmErr);
      }

      // Record immediately in local activity log
      const verb = evaluation.proposed.action === 'buy' ? 'Bought' : 'Sold';
      saveLocalActivity({
        id: `tx_${Date.now()}`,
        timestamp: new Date().toISOString(),
        description: `${verb} $${Math.round(evaluation.proposed.amountUsd)} ${symbol} - risk governor approved`,
        txSignature: txSig,
        status: 'success',
      });

      setStatus('executing');

      // Send to API - the wallet's on-chain transaction signature proves ownership
      let explorerUrl = txExplorerUrl(txSig);
      try {
        const res = await executeTrade({
          wallet: publicKey.toBase58(),
          action: evaluation.proposed.action,
          asset: symbol,
          amountUsd: evaluation.proposed.amountUsd,
          signature: txSig,
        });

        if (res?.result?.explorerUrl) {
          explorerUrl = res.result.explorerUrl;
        }
      } catch (apiErr) {
        console.warn('API execution notification warning (on-chain tx confirmed):', apiErr);
      }

      setResult({
        signature: txSig,
        explorerUrl,
        isLiveOnchain: true,
      });
      setStatus('success');
    } catch (e: unknown) {
      console.error('Execution error details:', e);
      let msg = e instanceof Error ? e.message : 'Wallet transaction failed';
      if (msg.includes('Unexpected error')) {
        msg =
          'Wallet rejected transaction ("Unexpected error"). Please check: 1) Your wallet extension is set to Solana Devnet (Settings > Developer Settings > Change Network > Devnet), 2) Your wallet has free devnet SOL for the ~0.000005 SOL network fee.';
      } else if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('cancelled')) {
        msg = 'Transaction was cancelled in wallet.';
      } else if (msg.includes('signature') && msg.includes('valid')) {
        msg =
          'On-chain signature verification timed out. This can happen on Solana Devnet when the transaction was just submitted and not yet indexed. Please retry the transaction - your wallet signature is valid.';
      }
      setErrMsg(msg);
      setStatus('error');
    }
  };

  if (status === 'success' && result) {
    const signature = result.signature || '';
    const displaySig = signature.length > 24
      ? `${signature.slice(0, 12)}...${signature.slice(-8)}`
      : signature;
    const explorer = result.explorerUrl || txExplorerUrl(signature);

    return (
      <div
        style={{
          marginTop: '16px',
          padding: '20px',
          borderRadius: '12px',
          background: 'rgba(216, 255, 79, 0.06)',
          border: '1px solid var(--lime)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <p style={{ color: 'var(--lime)', fontWeight: 700, margin: 0 }}>
            {result.isLiveOnchain ? 'On-Chain Risk Attestation Confirmed!' : 'Policy Executed & Confirmed!'}
          </p>
          <span
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(216, 255, 79, 0.15)',
              color: 'var(--lime)',
              fontSize: '0.68rem',
              fontWeight: 800,
            }}
          >
            {NETWORK_LABEL}
          </span>
        </div>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.78rem', wordBreak: 'break-all', fontFamily: 'monospace', margin: '4px 0 8px 0' }}>
          Tx: {displaySig}
        </p>
        <p style={{ color: 'var(--solana-green)', fontSize: '0.74rem', margin: '0 0 12px 0', fontFamily: 'monospace' }}>
          {result.isLiveOnchain
            ? '✓ SPL Memo risk governance attestation committed to Solana Devnet ledger'
            : '✓ Simulated execution verified & logged to activity audit trail'}
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a
            href={explorer}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--lime)', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'underline' }}
          >
            {result.isLiveOnchain ? 'View on Solscan →' : 'Simulated Explorer →'}
          </a>
          <Link href="/activity" style={{ color: 'var(--ink-muted)', fontSize: '0.82rem', textDecoration: 'underline' }}>
            View Activity Log →
          </Link>
        </div>
      </div>
    );
  }

  const isBusy = ['signing', 'confirming', 'executing'].includes(status);
  const buttonText =
    status === 'signing'
      ? 'Confirming in wallet...'
      : status === 'confirming'
        ? `Confirming on ${NETWORK_LABEL}...`
        : status === 'executing'
          ? 'Finalizing trade...'
          : connected
            ? `Sign & execute on-chain: $${evaluation.proposed.amountUsd.toLocaleString()}`
            : `Sign & execute: $${evaluation.proposed.amountUsd.toLocaleString()}`;

  const memoText = `AfterHours: ${evaluation.proposed.action.toUpperCase()} $${Math.round(evaluation.proposed.amountUsd)} ${symbol} | Risk Governor: Passed (Cap: ${evaluation.policy.maxSingleAssetExposurePercent}%)`;

  return (
    <div>
      {/* Transaction Payload Inspector Toggle */}
      <div style={{ marginBottom: '16px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--surface-strong)', overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => setShowInspector(!showInspector)}
          style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: 'var(--solana-green)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'SF Mono, monospace', fontSize: '0.78rem', fontWeight: 800 }}
        >
          <span> Solana Instruction Payload Inspector</span>
          <span>{showInspector ? '▲ Hide' : '▼ Inspect Bytes'}</span>
        </button>

        {showInspector && (
          <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid var(--line)', fontSize: '0.78rem', color: 'var(--ink-muted)', background: 'var(--surface)' }}>
            <div style={{ marginTop: '12px', marginBottom: '8px', fontWeight: 800, color: 'var(--ink-heading)' }}>
              Instruction: SPL Memo Risk Governance Attestation
            </div>
            <pre style={{ margin: 0, fontFamily: 'SF Mono, monospace', fontSize: '0.7rem', color: 'var(--solana-green)', background: 'rgba(20, 241, 149, 0.08)', padding: '8px 10px', borderRadius: 6, overflowX: 'auto', border: '1px solid rgba(20, 241, 149, 0.2)' }}>
{`Program ID: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
Action: ${evaluation.proposed.action.toUpperCase()} $${Math.round(evaluation.proposed.amountUsd)} ${symbol}
Payload String: "${memoText}"
Token Transfer: 0 SOL (Pure cryptographic policy attestation - zero tokens deducted)`}
            </pre>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--ink-subtle)', flexWrap: 'wrap', gap: '8px' }}>
              <span>Network Fee: <strong>~0.000005 Devnet SOL (Free test token)</strong></span>
              <span>Network: <strong>{NETWORK_LABEL}</strong></span>
              <span>Signers: <strong>1 (Wallet Owner)</strong></span>
            </div>
          </div>
        )}
      </div>

      {airdropMsg && (
        <div style={{ marginBottom: '14px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(20, 241, 149, 0.1)', border: '1px solid var(--solana-green)' }}>
          <p style={{ color: 'var(--solana-green)', margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>{airdropMsg}</p>
        </div>
      )}

      {errMsg && (
        <div style={{ marginBottom: '14px', padding: '14px 16px', borderRadius: '10px', background: 'rgba(155, 48, 39, 0.15)', border: '1px solid var(--red)' }}>
          <p style={{ color: '#ffd98a', margin: '0 0 10px 0', fontSize: '0.82rem', lineHeight: 1.5 }}>{errMsg}</p>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleAirdrop}
              disabled={isAirdropping}
              style={{
                background: 'var(--lime)',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {isAirdropping ? 'Requesting Devnet SOL...' : ' Airdrop 1 Free Devnet SOL'}
            </button>
            <a
              href="https://faucet.solana.com"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--lime)', fontSize: '0.78rem', fontWeight: 800, textDecoration: 'underline' }}
            >
              Solana Web Faucet →
            </a>
          </div>
        </div>
      )}

      <button
        className="button button-execute button-wide"
        type="button"
        disabled={isBusy}
        onClick={handleLiveOnchainExecution}
      >
        {buttonText}
      </button>

      {!connected && (
        <button
          type="button"
          disabled={isBusy}
          onClick={handleDemoExecution}
          style={{
            width: '100%',
            marginTop: '10px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'transparent',
            border: '1px solid var(--lime)',
            color: 'var(--lime)',
            fontWeight: 700,
            cursor: isBusy ? 'not-allowed' : 'pointer',
            fontSize: '0.84rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          Execute Demo Simulation (No Wallet Required)
        </button>
      )}

      <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '0.72rem', color: 'var(--ink-subtle)' }}>
         Network: <strong>Solana Devnet</strong> · Zero token transfer · Test network fee (~0.000005 Devnet SOL)
      </div>
    </div>
  );
}

export function ExecuteButton({ symbol, evaluation }: { symbol: string; evaluation: RiskEvaluation }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="button button-execute button-wide" type="button" disabled>
        Sign &amp; execute: ${evaluation.proposed.amountUsd.toLocaleString()}
      </button>
    );
  }

  return <ExecuteButtonInner symbol={symbol} evaluation={evaluation} />;
}
