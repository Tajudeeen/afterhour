import { describe, it, expect } from 'vitest';
import { SUPPORTED_STOCKS, LEGACY_STOCKS, buildPortfolio } from '../src/index.js';

describe('solana package', () => {
  it('exports SUPPORTED_STOCKS with PreStocks symbols', () => {
    const symbols = SUPPORTED_STOCKS.map((s) => s.symbol);
    expect(symbols).toContain('ANTHROPIC');
    expect(symbols).toContain('SPACEX');
    expect(symbols).toContain('OPENAI');
  });

  it('exports LEGACY_STOCKS with old symbols', () => {
    const symbols = LEGACY_STOCKS.map((s) => s.symbol);
    expect(symbols).toContain('NVDA');
    expect(symbols).toContain('AAPL');
  });

  it('buildPortfolio is a function', () => {
    expect(typeof buildPortfolio).toBe('function');
  });

  it('exports MEMO_PROGRAM_ID and builds risk attestation memo', async () => {
    const { MEMO_PROGRAM_ID, buildRiskAttestationMemo } = await import('../src/index.js');
    expect(MEMO_PROGRAM_ID).toBe('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    const memo = buildRiskAttestationMemo({
      action: 'sell',
      asset: 'NVDA',
      amountUsd: 500,
      maxExposurePercent: 35,
    });
    expect(memo).toContain('AfterHours: SELL $500 NVDA');
    expect(memo).toContain('Risk Governor: Approved');
    expect(memo).toContain('Cap: 35%');
  });

  it('exports PYTH_FEED_MAP with feed IDs', async () => {
    const { PYTH_FEED_MAP } = await import('../src/index.js');
    expect(PYTH_FEED_MAP.NVDA).toBe('b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593');
  });
});
