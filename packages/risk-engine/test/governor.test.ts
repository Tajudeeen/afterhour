import { describe, it, expect } from 'vitest';
import { RiskGovernor } from '../src/index.js';
import { DEFAULT_RISK_POLICY } from '../src/policy.js';
import type { Portfolio } from '@afterhours/types';

describe('risk-engine governor', () => {
  function makePortfolio(totalUsd: number, nvdaUsd: number, usdcUsd: number): Portfolio {
    return {
      wallet: '11111111111111111111111111111112',
      totalValueUsd: totalUsd,
      holdings: [
        { symbol: 'NVDA', mint: 'm1', amount: 10, valueUsd: nvdaUsd, weightPercent: (nvdaUsd / totalUsd) * 100 },
        { symbol: 'USDC', mint: 'm3', amount: usdcUsd, valueUsd: usdcUsd, weightPercent: (usdcUsd / totalUsd) * 100 },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  it('can update policy', () => {
    const governor = new RiskGovernor(DEFAULT_RISK_POLICY);
    expect(governor.getPolicy().maxTradeUsd).toBe(1500);
    governor.updatePolicy({ ...DEFAULT_RISK_POLICY, maxTradeUsd: 2000 });
    expect(governor.getPolicy().maxTradeUsd).toBe(2000);
  });

  it('evaluates trades through the governor', () => {
    const governor = new RiskGovernor(DEFAULT_RISK_POLICY);
    const portfolio = makePortfolio(10_000, 4_600, 2_020);
    const result = governor.evaluate({
      proposal: { action: 'sell', asset: 'NVDA', amountUsd: 1_150 },
      portfolio,
      dailyPnLPercent: 0,
    });
    expect(result.passed).toBe(true);
  });
});
