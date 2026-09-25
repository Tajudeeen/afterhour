import { describe, it, expect } from 'vitest';
import { createApp, DEFAULT_RISK_POLICY } from '../src/index.js';
import type { Portfolio } from '@afterhours/types';

function testPortfolio(): Portfolio {
  return {
    wallet: 'test-wallet',
    totalValueUsd: 10000,
    holdings: [
      { symbol: 'NVDA', mint: 'mint1', amount: 25, valueUsd: 4600, weightPercent: 46 },
      { symbol: 'USDC', mint: 'mint3', amount: 2000, valueUsd: 2000, weightPercent: 20 },
    ],
    timestamp: new Date().toISOString(),
  };
}

const TEST_WALLET = '11111111111111111111111111111112';
const TEST_SIGNATURE = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789ABCDEFGHJKLMNPQRSTUVW';

// Integration-level tests that exercise the Hono app's route handlers
// end-to-end, including error handling and risk-governance enforcement.
describe('API security boundaries', () => {
  it('applies defensive headers to public responses', async () => {
    const response = await createApp().request('/health');
    expect(response.status).toBe(200);
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(response.headers.get('content-security-policy')).toBeTruthy();
    expect(response.headers.get('permissions-policy')).toBeTruthy();
  });

  it('returns 404 for unknown wallets', async () => {
    const app = createApp();
    const res = await app.request('/api/portfolio/unknown-wallet');
    expect(res.status).toBe(404);
  });

  it('returns 404 for unsupported assets', async () => {
    const app = createApp();
    const res = await app.request('/api/assets/UNKNOWN');
    expect(res.status).toBe(404);
  });

  it('rejects execution with invalid wallet format', async () => {
    const app = createApp({ portfolios: { test: testPortfolio() } });
    const res = await app.request('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: 'test', action: 'sell', asset: 'NVDA', amountUsd: 1150 }),
    });
    expect(res.status).toBe(400);
  });

  it('blocks execution without user signature (valid wallet format)', async () => {
    const app = createApp({ portfolios: { [TEST_WALLET]: testPortfolio() } });
    const res = await app.request('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: TEST_WALLET, action: 'sell', asset: 'NVDA', amountUsd: 1150 }),
    });
    expect(res.status).toBe(401);
  });

  it('blocks trade exceeding max trade size', async () => {
    const app = createApp({ portfolios: { [TEST_WALLET]: testPortfolio() } });
    const res = await app.request('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: TEST_WALLET, action: 'sell', asset: 'NVDA', amountUsd: 5000, signature: TEST_SIGNATURE }),
    });
    expect(res.status).toBe(403);
  });

  it('rejects negative amount', async () => {
    const app = createApp({ portfolios: { [TEST_WALLET]: testPortfolio() } });
    const res = await app.request('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: TEST_WALLET, action: 'sell', asset: 'NVDA', amountUsd: -100, signature: TEST_SIGNATURE }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects invalid asset symbol', async () => {
    const app = createApp({ portfolios: { [TEST_WALLET]: testPortfolio() } });
    const res = await app.request('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: TEST_WALLET, action: 'sell', asset: 'INVAID!@#', amountUsd: 1000, signature: TEST_SIGNATURE }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects invalid action', async () => {
    const app = createApp({ portfolios: { [TEST_WALLET]: testPortfolio() } });
    const res = await app.request('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: TEST_WALLET, action: 'hack', asset: 'NVDA', amountUsd: 1000, signature: TEST_SIGNATURE }),
    });
    expect(res.status).toBe(400);
  });

  it('enforces default risk policy limits', () => {
    expect(DEFAULT_RISK_POLICY.maxSingleAssetExposurePercent).toBe(35);
    expect(DEFAULT_RISK_POLICY.maxTradeUsd).toBe(1500);
  });
});
