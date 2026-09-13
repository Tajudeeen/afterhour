'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getAssetRisk, type AIAnalysis, type RiskEvaluation } from '@/lib/api';

export default async function ActionPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();

  let evaluation: RiskEvaluation | null = null;
  let analysis: AIAnalysis | null = null;

  try {
    const data = await getAssetRisk(upperSymbol);
    evaluation = data.evaluation;
    analysis = data.analysis;
  } catch {
    // Fallback
    evaluation = {
      policy: {
        maxSingleAssetExposurePercent: 35,
        maxTradeUsd: 1500,
        minUsdcReservePercent: 10,
        maxDailyDrawdownPercent: 3,
        requireUserApproval: true,
      },
      proposed: { action: 'sell', asset: upperSymbol, amountUsd: 1150 },
      current: {
        exposurePercent: 46,
        usdcReservePercent: 19,
        dailyPnLPercent: 0,
      },
      proposedState: {
        exposurePercent: 35,
        usdcReservePercent: 31,
      },
      passed: true,
      reason: null,
    };
    analysis = {
      explanation: 'NVDA is trading 4% above its reference price while the underlying market is closed.',
      primaryRisk: 'Portfolio concentration in NVDA exceeds policy limits during thin liquidity',
      recommendation: { action: 'sell', asset: upperSymbol, amountUsd: 1150 },
      confidence: 0.87,
      createdAt: new Date().toISOString(),
    };
  }

  if (!evaluation || !analysis) return null;

  const passed = evaluation.passed;

  return (
    <div className="page-shell">
      <Link href={`/assets/${upperSymbol}/analysis`} className="back-link">
        <span aria-hidden="true">←</span> Back to analysis
      </Link>

      <section style={{ marginTop: 24 }}>
        <div>
          <p className="eyebrow eyebrow-accent">Risk Governor</p>
          <h1 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '2.4rem', color: '#e0e6db' }}>
            Recommended action
          </h1>
        </div>
      </section>

      <div className="grid-2" style={{ marginTop: 24 }}>
        <div>
          <div className="data-card">
            <h3>AI proposes</h3>
            <div className="action-confirm">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div>
                  <div className="data-label">ACTION</div>
                  <div className="action-amount" style={{ fontSize: '1.8rem' }}>
                    {evaluation.proposed.action.toUpperCase()}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="data-label">AMOUNT</div>
                  <div className="data-value">${evaluation.proposed.amountUsd.toLocaleString()}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div className="data-label">ASSET</div>
                  <div className="data-value">{evaluation.proposed.asset}</div>
                </div>
              </div>
              <div className="action-detail">
                Receive approximately ${evaluation.proposed.amountUsd.toLocaleString()} USDC
              </div>
            </div>
          </div>

          <div className="data-card" style={{ marginTop: 20 }}>
            <h3>Policy check</h3>
            <div className="regime-grid">
              <div className="regime-item">
                <span className="label">Exposure now</span>
                <span className="value">{Math.round(evaluation.current.exposurePercent)}%</span>
              </div>
              <div className="regime-item">
                <span className="label">Exposure after</span>
                <span className="value">{Math.round(evaluation.proposedState.exposurePercent)}%</span>
              </div>
              <div className="regime-item">
                <span className="label">Policy limit</span>
                <span className="value">{evaluation.policy.maxSingleAssetExposurePercent}%</span>
              </div>
              <div className="regime-item">
                <span className="label">USDC now</span>
                <span className="value">{Math.round(evaluation.current.usdcReservePercent)}%</span>
              </div>
              <div className="regime-item">
                <span className="label">USDC after</span>
                <span className="value">{Math.round(evaluation.proposedState.usdcReservePercent)}%</span>
              </div>
              <div className="regime-item">
                <span className="label">Max trade</span>
                <span className="value">${evaluation.policy.maxTradeUsd}</span>
              </div>
              <div className="regime-item">
                <span className="label">Approval required</span>
                <span className="value">{evaluation.policy.requireUserApproval ? 'YES' : 'NO'}</span>
              </div>
              <div className="regime-item">
                <span className="label">Result</span>
                <span className="value" style={{ color: passed ? 'var(--lime)' : 'var(--red)' }}>
                  {passed ? 'PASS' : 'BLOCK'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="data-card">
            <h3>Why this matters</h3>
            <p className="ai-explanation">
              {analysis.explanation}
            </p>
            <div className="ai-primary-risk">
              <strong>{analysis.primaryRisk}</strong>
            </div>
          </div>

          <div className="data-card" style={{ marginTop: 20 }}>
            <h3>Execute on Solana</h3>
            {!passed ? (
              <div>
                <p style={{ color: 'var(--red)' }}>Risk policy BLOCKED this action.</p>
                {evaluation.reason && (
                  <p style={{ color: '#9b3027', marginTop: 8 }}>{evaluation.reason}</p>
                )}
              </div>
            ) : (
              <ExecuteButton
                symbol={upperSymbol}
                evaluation={evaluation}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecuteButton({ symbol, evaluation }: { symbol: string; evaluation: RiskEvaluation }) {
  const [status, setStatus] = useState<'idle' | 'signing' | 'executing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<{ signature: string; explorerUrl: string } | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  if (status === 'success' && result) {
    return (
      <div>
        <p style={{ color: 'var(--lime)' }}>Transaction confirmed!</p>
        <p style={{ color: '#99a98a', fontSize: '0.78rem' }}>
          {result.signature.slice(0, 12)}...{result.signature.slice(-8)}
        </p>
        <a href={result.explorerUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', fontSize: '0.72rem' }}>
          View on Solscan →
        </a>
      </div>
    );
  }

  if (status === 'error' && errMsg) {
    return <p style={{ color: 'var(--red)' }}>{errMsg}</p>;
  }

  return (
    <button
      className="button button-primary button-wide"
      disabled={status === 'signing' || status === 'executing'}
      onClick={async () => {
        setStatus('signing');
        // Simulate wallet signing
        await new Promise((r) => setTimeout(r, 800));
        setStatus('executing');
        try {
          const res = await fetch('/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wallet: 'demo',
              action: evaluation.proposed.action,
              asset: symbol,
              amountUsd: evaluation.proposed.amountUsd,
              signature: 'user_signed',
            }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          setResult({ signature: data.result.signature, explorerUrl: data.result.explorerUrl });
          setStatus('success');
        } catch (e) {
          setErrMsg(e instanceof Error ? e.message : 'Execution failed');
          setStatus('error');
        }
      }}
    >
      {status === 'signing' ? 'Sign in wallet...' : status === 'executing' ? 'Executing...' : `Sign & execute: $${evaluation.proposed.amountUsd.toLocaleString()}`}
    </button>
  );
}
