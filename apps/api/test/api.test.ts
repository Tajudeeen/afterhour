import { describe, it, expect } from 'vitest';
import { createApp } from '../src/index.js';
import type { Portfolio } from '@afterhours/types';

function testPortfolio(): Portfolio {
  return {
    wallet: 'test-wallet',
    totalValueUsd: 10000,
    holdings: [
      { symbol: 'ANTHROPIC', mint: 'mint1', amount: 2.9, valueUsd: 3000, weightPercent: 30 },
      { symbol: 'USDC', mint: 'mint3', amount: 2000, valueUsd: 2000, weightPercent: 20 },
    ],
    timestamp: new Date().toISOString(),
  };
}

describe('api portfolio', () => {
  it('returns portfolio for known wallet', async () => {
    const portfolio = testPortfolio();
    const app = createApp({ portfolios: { 'test-wallet': portfolio } });
    const res = await app.request('/api/portfolio/test-wallet');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.portfolio.totalValueUsd).toBe(10000);
  });

  it('returns 404 for unknown wallet', async () => {
    const app = createApp();
    const res = await app.request('/api/portfolio/unknown');
    expect(res.status).toBe(404);
  });
});

describe('api execute', () => {
  it('blocks execution without signature', async () => {
    const portfolio = testPortfolio();
    const app = createApp({ portfolios: { test: portfolio } });
    const res = await app.request('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: 'test', action: 'sell', asset: 'ANTHROPIC', amountUsd: 1150 }),
    });
    expect(res.status).toBe(401);
  });

  it('blocks trade exceeding max trade size', async () => {
    const portfolio = testPortfolio();
    const app = createApp({ portfolios: { test: portfolio } });
    const res = await app.request('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: 'test', action: 'sell', asset: 'ANTHROPIC', amountUsd: 5000, signature: 'sig' }),
    });
    expect(res.status).toBe(403);
  });

  it('executes trade within policy with signature', async () => {
    const portfolio = testPortfolio();
    const app = createApp({ portfolios: { test: portfolio } });
    const res = await app.request('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: 'test', action: 'sell', asset: 'ANTHROPIC', amountUsd: 1000, signature: 'sig' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.status).toBe('confirmed');

    const anthropic = portfolio.holdings.find((h) => h.symbol === 'ANTHROPIC');
    const usdc = portfolio.holdings.find((h) => h.symbol === 'USDC');
    expect(anthropic?.valueUsd).toBe(2000);
    expect(usdc?.valueUsd).toBe(3000);
  });
});
