import { describe, it, expect } from 'vitest';
import { evaluateRisk } from '../src/index.js';
import { DEFAULT_RISK_POLICY } from '../src/policy.js';
import type { Portfolio } from '@afterhours/types';

function makePortfolio(totalUsd: number, nvdaUsd: number, usdcUsd: number): Portfolio {
  return {
    wallet: '11111111111111111111111111111112',
    totalValueUsd: totalUsd,
    holdings: [
      { symbol: 'NVDA', mint: 'mint1', amount: nvdaUsd / 182.4, valueUsd: nvdaUsd, weightPercent: (nvdaUsd / totalUsd) * 100 },
      { symbol: 'AAPL', mint: 'mint2', amount: 10, valueUsd: totalUsd - nvdaUsd - usdcUsd, weightPercent: ((totalUsd - nvdaUsd - usdcUsd) / totalUsd) * 100 },
      { symbol: 'USDC', mint: 'mint3', amount: usdcUsd, valueUsd: usdcUsd, weightPercent: (usdcUsd / totalUsd) * 100 },
    ],
    timestamp: new Date().toISOString(),
  };
}

describe('risk-engine', () => {
  it('PASSES when trade is within all limits', () => {
    const portfolio = makePortfolio(10_000, 4_600, 2_020);
    const result = evaluateRisk(DEFAULT_RISK_POLICY, {
      proposal: { action: 'sell', asset: 'NVDA', amountUsd: 1_150 },
      portfolio,
      dailyPnLPercent: 0,
    });
    expect(result.passed).toBe(true);
    expect(result.reason).toBeNull();
    // After sell: NVDA = (4600-1150)/10000 = 34.5%
    expect(result.proposedState.exposurePercent).toBeCloseTo(34.5, 1);
    // USDC after: 2020 + 1150 = 3170; 3170/10000 = 31.7%
    expect(result.proposedState.usdcReservePercent).toBeCloseTo(31.7, 1);
  });

  it('BLOCKS when trade exceeds max trade size', () => {
    const portfolio = makePortfolio(10_000, 4_600, 2_020);
    const result = evaluateRisk(DEFAULT_RISK_POLICY, {
      proposal: { action: 'sell', asset: 'NVDA', amountUsd: 2_000 },
      portfolio,
      dailyPnLPercent: 0,
    });
    expect(result.passed).toBe(false);
    expect(result.reason).toContain('exceeds max trade limit');
  });

  it('BLOCKS when exposure after trade exceeds limit', () => {
    const portfolio = makePortfolio(5_000, 4_000, 200); // 80% NVDA
    const result = evaluateRisk(DEFAULT_RISK_POLICY, {
      proposal: { action: 'buy', asset: 'NVDA', amountUsd: 500 },
      portfolio,
      dailyPnLPercent: 0,
    });
    expect(result.passed).toBe(false);
    expect(result.reason).toContain('exposure after trade would be');
  });

  it('BLOCKS when USDC reserve drops below minimum', () => {
    // Total = 10_000, NVDA = 1_000 (10%), AAPL = 8_500 (85%), USDC = 500 (5%)
    // Buying $600 NVDA: exposure after = 1600/10000 = 16% (within 35% limit)
    // USDC after = 500 - 600 = max(0, -100) = 0 → 0% (below 10% min)
    const portfolio = makePortfolio(10_000, 1_000, 500);
    const result = evaluateRisk(DEFAULT_RISK_POLICY, {
      proposal: { action: 'buy', asset: 'NVDA', amountUsd: 600 },
      portfolio,
      dailyPnLPercent: 0,
    });
    expect(result.passed).toBe(false);
    expect(result.reason).toContain('USDC reserve after trade would be');
  });

  it('BLOCKS when daily drawdown exceeds limit', () => {
    const portfolio = makePortfolio(10_000, 4_600, 2_020);
    const result = evaluateRisk(DEFAULT_RISK_POLICY, {
      proposal: { action: 'sell', asset: 'NVDA', amountUsd: 1_150 },
      portfolio,
      dailyPnLPercent: -3.5,
    });
    expect(result.passed).toBe(false);
    expect(result.reason).toContain('daily drawdown');
  });
});
