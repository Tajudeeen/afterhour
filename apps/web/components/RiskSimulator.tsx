'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAssetIntelligence, type AssetIntelligence } from '@/lib/api';

interface RiskSimulatorProps {
  symbol: string;
  initialIntelligence: AssetIntelligence;
}

export function RiskSimulator({ symbol, initialIntelligence }: RiskSimulatorProps) {
  const [sliderValue, setSliderValue] = useState<number>(Math.round(initialIntelligence.gapPercent));
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [liveIntelligence, setLiveIntelligence] = useState<AssetIntelligence | null>(null);

  // When simulating, fetch the real engine output for the simulated gap
  const fetchSimulated = useCallback(async (gap: number) => {
    try {
      const intel = await getAssetIntelligence(symbol, gap);
      setLiveIntelligence(intel);
    } catch {
      setLiveIntelligence(null);
    }
  }, [symbol]);

  // Debounce the API call so we don't spam on every slider tick
  useEffect(() => {
    if (!isSimulating) return;
    const id = setTimeout(() => {
      void fetchSimulated(sliderValue);
    }, 150);
    return () => clearTimeout(id);
  }, [sliderValue, isSimulating, fetchSimulated]);

  // Use live intelligence if simulating, otherwise fall back to initial snapshot
  const intel = isSimulating && liveIntelligence ? liveIntelligence : initialIntelligence;
  const absGap = Math.abs(sliderValue);
  const referencePrice = intel.referencePrice;
  const simulatedOnchainPrice = Number((referencePrice * (1 + sliderValue / 100)).toFixed(2));

  const getBand = (score: number) => {
    if (score <= 20) return { name: 'Normal', tone: 'status-normal', color: 'var(--ink-muted)' };
    if (score <= 40) return { name: 'Watch', tone: 'status-watch', color: '#d9c98c' };
    if (score <= 60) return { name: 'Elevated', tone: 'status-elevated', color: '#f3d97d' };
    if (score <= 80) return { name: 'High', tone: 'status-high', color: '#ffd369' };
    return { name: 'Extreme', tone: 'status-extreme', color: '#ff6b6b' };
  };

  // Use the REAL engine's risk score when simulating, fall back to inline for initial state
  const simScoreClamped = isSimulating && liveIntelligence ? intel.riskScore.score : computeInlineRiskScore(intel, sliderValue);
  const bandInfo = getBand(simScoreClamped);

  // Dynamic slippage — use real engine value when available
  const pythConfUsd = intel.pythConfidenceUsd || Number((referencePrice * 0.0075).toFixed(2));
  const pythConfRatio = Number(((pythConfUsd / referencePrice) * 100).toFixed(2));
  const dynamicSlippageBps = intel.pythDynamicSlippageBps
    ? intel.pythDynamicSlippageBps + Math.round(absGap * 5)
    : Math.min(500, Math.max(50, 50 + Math.round(pythConfRatio * 100) + Math.round(absGap * 5)));

  // Governor verdict — derived from the real risk score when simulating
  let governorVerdict = 'PASS: Proposed trade within limits';
  let isBlocked = false;
  if (simScoreClamped >= 60) {
    governorVerdict = 'REJECTED: Policy Cap Exceeded (Projected exposure > 35%)';
    isBlocked = true;
  } else if (simScoreClamped >= 40) {
    governorVerdict = 'CLAMPED: Trade size restricted to $850 USD safe max';
  }

  const applyPreset = (gap: number) => {
    setSliderValue(gap);
    setIsSimulating(true);
  };

  const resetToLive = () => {
    setSliderValue(Math.round(initialIntelligence.gapPercent));
    setIsSimulating(false);
    setLiveIntelligence(null);
  };

  return (
    <div className="data-card" style={{ padding: '24px', borderRadius: '18px', border: isSimulating ? '1px solid var(--solana-green)' : '1px solid var(--line)', background: 'var(--surface-strong)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div className="eyebrow" style={{ margin: 0 }}>
            <span className="eyebrow-accent">Interactive Stress-Tester</span>
          </div>
          <h3 style={{ margin: '4px 0 0', fontFamily: 'Georgia, serif', fontSize: '1.25rem', color: 'var(--ink-heading)' }}>
            Simulate Market Gap Movement
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isSimulating && (
            <button type="button" onClick={resetToLive} className="button button-ghost" style={{ fontSize: '0.72rem', padding: '4px 10px', minHeight: '28px' }}>
              ↺ Reset to Live
            </button>
          )}
          <span className={`source-badge ${isSimulating ? 'source-live' : 'source-demo'}`} style={{ color: isSimulating ? 'var(--solana-green)' : 'var(--ink-subtle)' }}>
            {isSimulating ? '● Active Simulation' : 'Live Data Snapshot'}
          </span>
        </div>
      </div>

      <p style={{ margin: '0 0 20px', color: 'var(--ink-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>
        Drag the gap slider to stress-test how AfterHours' Risk Governor & Pyth Dynamic Slippage Engine react in real-time to sudden market shifts.
      </p>

      {/* Preset Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button type="button" onClick={() => applyPreset(5)} className="button button-compact" style={{ fontSize: '0.72rem', minHeight: '30px' }}>
          +5% Earnings Shift
        </button>
        <button type="button" onClick={() => applyPreset(15)} className="button button-compact" style={{ fontSize: '0.72rem', minHeight: '30px' }}>
          +15% Weekend Spike
        </button>
        <button type="button" onClick={() => applyPreset(-22)} className="button button-compact" style={{ fontSize: '0.72rem', minHeight: '30px' }}>
          -22% SpaceX Arbitrage
        </button>
        <button type="button" onClick={() => applyPreset(30)} className="button button-compact" style={{ fontSize: '0.72rem', minHeight: '30px', color: '#ff6b6b' }}>
          +30% Extreme Stress
        </button>
      </div>

      {/* Slider Control */}
      <div style={{ background: 'var(--surface)', padding: '18px 20px', borderRadius: '14px', border: '1px solid var(--line)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--ink-subtle)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Simulated Divergence Gap
          </span>
          <span style={{ fontFamily: 'SF Mono, monospace', fontSize: '1.4rem', fontWeight: 900, color: sliderValue > 0 ? 'var(--solana-green)' : sliderValue < 0 ? '#ff6b6b' : 'var(--ink-body)' }}>
            {sliderValue > 0 ? '+' : ''}{sliderValue}%
          </span>
        </div>

        <input
          type="range"
          min="-30"
          max="30"
          step="1"
          value={sliderValue}
          onChange={(e) => {
            setSliderValue(Number(e.target.value));
            setIsSimulating(true);
          }}
          style={{ width: '100%', accentColor: 'var(--solana-green)', cursor: 'pointer' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--ink-subtle)', marginTop: '6px', fontFamily: 'monospace' }}>
          <span>-30% (Severe Discount)</span>
          <span>0% (Parity)</span>
          <span>+30% (Extreme Premium)</span>
        </div>
      </div>

      {/* Real-time Simulated Outputs */}
      <div className="grid-3" style={{ gap: '12px' }}>
        <div style={{ padding: '14px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', textTransform: 'uppercase', fontWeight: 800 }}>Simulated DEX Price</div>
          <div style={{ fontFamily: 'SF Mono, monospace', fontSize: '1.2rem', fontWeight: 800, color: 'var(--ink-heading)', marginTop: '4px' }}>
            ${simulatedOnchainPrice.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--ink-subtle)', marginTop: '2px' }}>
            Ref: ${referencePrice.toFixed(2)}
          </div>
        </div>

        <div style={{ padding: '14px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', textTransform: 'uppercase', fontWeight: 800 }}>Gap Risk Score</div>
          <div style={{ fontFamily: 'SF Mono, monospace', fontSize: '1.2rem', fontWeight: 800, color: bandInfo.color, marginTop: '4px' }}>
            {simScoreClamped} <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>({bandInfo.name})</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--ink-subtle)', marginTop: '2px' }}>
            {isSimulating && liveIntelligence ? 'Live engine' : 'Deterministically computed'}
          </div>
        </div>

        <div style={{ padding: '14px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', textTransform: 'uppercase', fontWeight: 800 }}>Pyth Dynamic Slippage</div>
          <div style={{ fontFamily: 'SF Mono, monospace', fontSize: '1.2rem', fontWeight: 800, color: 'var(--pyth-lavender)', marginTop: '4px' }}>
            {dynamicSlippageBps} BPS
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--ink-subtle)', marginTop: '2px' }}>
            Pyth Band: ±${pythConfUsd.toFixed(2)} ({pythConfRatio}%)
          </div>
        </div>
      </div>

      {/* Live Governor Verdict */}
      <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: isBlocked ? 'rgba(155, 48, 39, 0.15)' : 'rgba(20, 241, 149, 0.08)', border: isBlocked ? '1px solid rgba(155, 48, 39, 0.4)' : '1px solid rgba(20, 241, 149, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.82rem', fontFamily: 'SF Mono, monospace', color: isBlocked ? '#ff8a80' : 'var(--solana-green)', fontWeight: 700 }}>
          🛡️ Governor: {governorVerdict}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline risk score fallback — used only for the initial non-simulated state
 * until the first real engine fetch completes.
 */
function computeInlineRiskScore(intelligence: AssetIntelligence, sliderGap: number): number {
  let score = 15;
  const absGap = Math.abs(sliderGap);
  if (absGap >= 20) score += 45;
  else if (absGap >= 10) score += 30;
  else if (absGap >= 5) score += 20;
  else if (absGap >= 2) score += 10;

  if (intelligence.marketStatus === 'closed') score += 20;
  if (intelligence.pythConfidenceRatioPercent && intelligence.pythConfidenceRatioPercent > 0.5) score += 10;

  return Math.min(100, Math.max(0, score));
}
