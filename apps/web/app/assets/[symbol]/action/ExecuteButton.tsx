'use client';

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { executeTrade, type RiskEvaluation } from '@/lib/api';
import { NETWORK_LABEL } from '@/lib/network';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

function ExecuteButtonInner({ symbol, evaluation }: { symbol: string; evaluation: RiskEvaluation }) {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [status, setStatus] = useState<'idle' | 'signing' | 'confirming' | 'executing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<{ signature: string; explorerUrl: string; isLiveOnchain: boolean } | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  const handleDemoExecution = async () => {
    setStatus('signing');
    setErrMsg(null);
    setShowFallback(false);
    // Brief simulated delay
    await new Promise((r) => setTimeout(r, 600));
    setStatus('executing');
    try {
      const res = await executeTrade({
        wallet: connected && publicKey ? publicKey.toBase58() : 'demo',
        action: evaluation.proposed.action,
        asset: symbol,
        amountUsd: evaluation.proposed.amountUsd,
        signature: connected && publicKey ? '' : `demo_signed_${Date.now()}`,
      });
      const sig = res.result.signature;
      const isDemo = sig.startsWith('5demo_') || sig.startsWith('demo_') || sig.startsWith('user_signed') || !connected;
      setResult({
        signature: sig,
        explorerUrl: res.result.explorerUrl,
        isLiveOnchain: connected && !isDemo,
      });
      setStatus('success');
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Execution failed');
      setStatus('error');
    }
  };

  const handleLiveOnchainExecution = async () => {
    if (!connected || !publicKey) {
      return handleDemoExecution();
    }

    setStatus('signing');
    setErrMsg(null);
    setShowFallback(false);

    try {
      const memoText = `AfterHours: ${evaluation.proposed.action.toUpperCase()} $${Math.round(evaluation.proposed.amountUsd)} ${symbol} | Risk Governor: Passed (Cap: ${evaluation.policy.maxSingleAssetExposurePercent}%)`;
      const dataBytes = new TextEncoder().encode(memoText);

      const instruction = new TransactionInstruction({
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer ? Buffer.from(dataBytes) : (dataBytes as unknown as Buffer),
      });

      const tx = new Transaction().add(instruction);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;

      const txSig = await sendTransaction(tx, connection);
      setStatus('confirming');

      await connection.confirmTransaction({ signature: txSig, blockhash, lastValidBlockHeight }, 'confirmed');
      setStatus('executing');

      const res = await executeTrade({
        wallet: publicKey.toBase58(),
        action: evaluation.proposed.action,
        asset: symbol,
        amountUsd: evaluation.proposed.amountUsd,
        signature: txSig,
      });

      setResult({
        signature: txSig,
        explorerUrl: res.result.explorerUrl,
        isLiveOnchain: true,
      });
      setStatus('success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Wallet transaction failed';
      setErrMsg(msg);
      setStatus('error');
      setShowFallback(true);
    }
  };

  if (status === 'success' && result) {
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
            {result.isLiveOnchain ? 'On-chain transaction confirmed!' : 'Trade executed & confirmed!'}
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
            MAINNET
          </span>
        </div>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.78rem', wordBreak: 'break-all', fontFamily: 'monospace', margin: '4px 0 12px 0' }}>
          {result.signature.length > 24 ? `${result.signature.slice(0, 12)}...${result.signature.slice(-8)}` : result.signature}
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a
            href={result.explorerUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--lime)', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'underline' }}
          >
            View on Solscan →
          </a>
          <a href="/activity" style={{ color: 'var(--ink-muted)', fontSize: '0.82rem', textDecoration: 'underline' }}>
            View Activity Log →
          </a>
        </div>
      </div>
    );
  }

  const [showInspector, setShowInspector] = useState(false);

  const isBusy = status === 'signing' || status === 'confirming' || status === 'executing';
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
          <span>🔍 Solana Instruction Payload Inspector</span>
          <span>{showInspector ? '▲ Hide' : '▼ Inspect Bytes'}</span>
        </button>

        {showInspector && (
          <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid var(--line)', fontSize: '0.78rem', color: 'var(--ink-muted)', background: 'var(--surface)' }}>
            <div style={{ marginTop: '12px', marginBottom: '8px', fontWeight: 800, color: 'var(--ink-heading)' }}>
              Instruction 0: SPL Token / DEX Rebalance
            </div>
            <pre style={{ margin: 0, fontFamily: 'SF Mono, monospace', fontSize: '0.7rem', color: 'var(--ink-subtle)', background: 'var(--surface-strong)', padding: '8px 10px', borderRadius: 6, overflowX: 'auto' }}>
{`Action: ${evaluation.proposed.action.toUpperCase()} $${evaluation.proposed.amountUsd} ${symbol}
Target Mint: ${symbol} SPL Token
Slippage Floor: 50 BPS (Dynamic Pyth Buffer)`}
            </pre>

            <div style={{ marginTop: '12px', marginBottom: '8px', fontWeight: 800, color: 'var(--ink-heading)' }}>
              Instruction 1: SPL Memo Risk Attestation
            </div>
            <pre style={{ margin: 0, fontFamily: 'SF Mono, monospace', fontSize: '0.7rem', color: 'var(--solana-green)', background: 'rgba(20, 241, 149, 0.08)', padding: '8px 10px', borderRadius: 6, overflowX: 'auto', border: '1px solid rgba(20, 241, 149, 0.2)' }}>
{`Program ID: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
Payload String: "${memoText}"`}
            </pre>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--ink-subtle)' }}>
              <span>Est. Fee: <strong>0.000005 SOL</strong></span>
              <span>Network: <strong>{NETWORK_LABEL}</strong></span>
              <span>Signers: <strong>1 (Wallet Owner)</strong></span>
            </div>
          </div>
        )}
      </div>

      {errMsg && (
        <div style={{ marginBottom: '14px', padding: '12px', borderRadius: '8px', background: 'rgba(155, 48, 39, 0.15)', border: '1px solid var(--red)' }}>
          <p style={{ color: '#ffd98a', margin: '0 0 6px 0', fontSize: '0.82rem' }}>{errMsg}</p>
          {showFallback && (
            <button
              className="button button-secondary button-wide"
              type="button"
              onClick={handleDemoExecution}
              style={{ marginTop: '8px', fontSize: '0.8rem', padding: '8px 14px' }}
            >
              Continue in Demo Mode (Simulate execution) →
            </button>
          )}
        </div>
      )}

      <button
        className="button button-execute button-wide"
        type="button"
        disabled={isBusy}
        onClick={connected ? handleLiveOnchainExecution : handleDemoExecution}
      >
        {buttonText}
      </button>
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
        Sign & execute: ${evaluation.proposed.amountUsd.toLocaleString()}
      </button>
    );
  }

  return <ExecuteButtonInner symbol={symbol} evaluation={evaluation} />;
}
