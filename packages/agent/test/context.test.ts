import { describe, it, expect } from 'vitest';
import { buildAIContext, contextToLLMPrompt, type AIContextInput } from '../src/context.js';
import type { AIAnalysisContext, GapRiskScore } from '@afterhours/types';

describe('buildAIContext', () => {
  const baseInput: AIContextInput = {
    snapshot: {
      asset: 'NVDA',
      onchainPrice: 150,
      referencePrice: 145,
      gapPercent: 3.44,
      volume24h: 100000,
      liquidityUsd: 500000,
      liquidity: 'medium',
      marketStatus: 'closed',
      referenceUpdatedAt: '2023-10-01T10:00:00Z',
      observedAt: '2023-10-01T10:05:00Z',
    },
    riskScore: { score: 80, band: 'High' },
    regime: {
      session: 'weekend',
      volatility: 'high',
      liquidity: 'low',
      gap: 3.44,
      concentration: 'medium',
      label: 'HIGH RISK',
      timestamp: '2023-10-01T10:05:00Z',
    },
    portfolio: {
      wallet: 'some-wallet',
      totalValueUsd: 1000,
      timestamp: '2023-10-01T10:05:00Z',
      holdings: [
        {
          symbol: 'NVDA',
          mint: 'nvda-mint' as const,
          amount: 2,
          valueUsd: 300,
          weightPercent: 30,
        },
      ],
    },
    policy: {
      maxSingleAssetExposurePercent: 35,
      maxTradeUsd: 1500,
      minUsdcReservePercent: 10,
      maxDailyDrawdownPercent: 3,
      requireUserApproval: true,
    },
  };

  it('correctly maps inputs to AIAnalysisContext and calculates portfolio exposure', () => {
    const context = buildAIContext(baseInput);

    expect(context.asset).toBe('NVDA');
    expect(context.onchainPrice).toBe(150);
    expect(context.referencePrice).toBe(145);
    expect(context.gapPercent).toBe(3.44);
    expect(context.marketStatus).toBe('closed');
    expect(context.liquidity).toBe('medium');
    expect(context.portfolioExposure).toBe(30); // 300 / 1000 * 100
    expect(context.maxAllowedExposure).toBe(35);
    expect(context.regime).toEqual(baseInput.regime);
  });

  it('calculates 0 portfolio exposure if the asset is not in holdings', () => {
    const inputWithoutAsset = {
      ...baseInput,
      portfolio: {
        ...baseInput.portfolio,
        holdings: [
          {
            symbol: 'AAPL',
            mint: 'aapl-mint' as const,
            amount: 5,
            valueUsd: 1000,
            weightPercent: 100,
          },
        ],
      },
    };

    const context = buildAIContext(inputWithoutAsset);
    expect(context.portfolioExposure).toBe(0);
  });

  it('calculates 0 portfolio exposure if total portfolio value is 0', () => {
    const inputWithZeroValue = {
      ...baseInput,
      portfolio: {
        ...baseInput.portfolio,
        totalValueUsd: 0,
        holdings: [
          {
            symbol: 'NVDA',
            mint: 'nvda-mint' as const,
            amount: 2,
            valueUsd: 0,
            weightPercent: 0,
          },
        ],
      },
    };

    const context = buildAIContext(inputWithZeroValue);
    expect(context.portfolioExposure).toBe(0);
  });
});

describe('contextToLLMPrompt', () => {
  const context: AIAnalysisContext = {
    asset: 'TSLA',
    onchainPrice: 210,
    referencePrice: 200,
    gapPercent: 5,
    marketStatus: 'after-hours',
    liquidity: 'high',
    portfolioExposure: 20,
    maxAllowedExposure: 35,
    regime: {
      session: 'normal',
      volatility: 'medium',
      liquidity: 'high',
      gap: 5,
      concentration: 'low',
      label: 'NORMAL',
      timestamp: '2023-10-01T10:05:00Z',
    },
  };

  const riskScore: GapRiskScore = {
    score: 60,
    band: 'Elevated',
  };

  it('generates a valid string prompt containing structured JSON and task description', () => {
    const prompt = contextToLLMPrompt(context, riskScore);

    // Check key strings in prompt
    expect(prompt).toContain('You are AfterHours, an AI analyst for 24/7 tokenized stock trading on Solana.');
    expect(prompt).toContain('STRUCTURED MARKET DATA:');

    // Check that important data values are present
    expect(prompt).toContain('"asset": "TSLA"');
    expect(prompt).toContain('"onchain_price": 210');
    expect(prompt).toContain('"gap_percent": 5');
    expect(prompt).toContain('"portfolio_exposure_percent": 20');
    expect(prompt).toContain('"gap_risk_score": 60');
    expect(prompt).toContain('"risk_band": "Elevated"');
    expect(prompt).toContain('"label": "NORMAL"');

    // Check policy limits mentioned in the task description
    expect(prompt).toContain('max 35% single-asset exposure');
  });
});
