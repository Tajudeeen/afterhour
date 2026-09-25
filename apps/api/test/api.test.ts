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

// Valid Solana address format for testing
const TEST_WALLET = '11111111111111111111111111111112';
// 88-char base58 string that matches Solana transaction signature format
const TEST_SIGNATURE = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789ABCDEFGHJKLMNPQRSTUVW';

describe('api portfolio', () => {
  it('returns portfolio for known wallet', async () => {
    const portfolio = testPortfolio();
    const app = createApp({ portfolios: { [TEST_WALLET]: portfolio } });
    const res = await app.request(`/api/portfolio/${TEST_WALLET}`);
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
  it('blocks execution without signature (validation happens first)', async () => {
    const portfolio = testPortfolio();
    const app = createApp({ portfolios: { [TEST_WALLET]: portfolio } });
    const res = await app.request('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: TEST_WALLET, action: 'sell', asset: 'ANTHROPIC', amountUsd: 1150 }),
    });
    // Without signature, returns 401 after wallet validation passes
    expect(res.status).toBe(401);
  });

  it('blocks trade exceeding max trade size', async () => {
    const portfolio = testPortfolio();
    const app = createApp({ portfolios: { [TEST_WALLET]: portfolio } });
    const res = await app.request('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: TEST_WALLET, action: 'sell', asset: 'ANTHROPIC', amountUsd: 5000, signature: TEST_SIGNATURE }),
    });
    expect(res.status).toBe(403);
  });

  it('executes trade within policy with signature', async () => {
    const portfolio = testPortfolio();
    const app = createApp({ portfolios: { [TEST_WALLET]: portfolio } });
    const res = await app.request('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: TEST_WALLET, action: 'sell', asset: 'ANTHROPIC', amountUsd: 1000, signature: TEST_SIGNATURE }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.status).toBe('confirmed');

    const anthropic = portfolio.holdings.find((h) => h.symbol === 'ANTHROPIC');
    const usdc = portfolio.holdings.find((h) => h.symbol === 'USDC');
    expect(anthropic?.valueUsd).toBe(2000);
    expect(usdc?.valueUsd).toBe(3000);
  });

  it('rejects invalid wallet address format', async () => {
    const portfolio = testPortfolio();
    const app = createApp({ portfolios: { test: portfolio } });
    const res = await app.request('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: 'test', action: 'sell', asset: 'ANTHROPIC', amountUsd: 1150, signature: TEST_SIGNATURE }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects negative amount', async () => {
    const portfolio = testPortfolio();
    const app = createApp({ portfolios: { [TEST_WALLET]: portfolio } });
    const res = await app.request('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: TEST_WALLET, action: 'sell', asset: 'ANTHROPIC', amountUsd: -100, signature: TEST_SIGNATURE }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects invalid asset symbol', async () => {
    const portfolio = testPortfolio();
    const app = createApp({ portfolios: { [TEST_WALLET]: portfolio } });
    const res = await app.request('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: TEST_WALLET, action: 'sell', asset: 'INVALID!@#', amountUsd: 1000, signature: TEST_SIGNATURE }),
    });
    expect(res.status).toBe(400);
  });
});
