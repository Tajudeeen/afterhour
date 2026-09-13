import { describe, it, expect } from 'vitest';
import { SUPPORTED_STOCKS, buildPortfolio } from '../src/index.js';

describe('solana package', () => {
  it('exports SUPPORTED_STOCKS with expected symbols', () => {
    const symbols = SUPPORTED_STOCKS.map((s) => s.symbol);
    expect(symbols).toContain('NVDA');
    expect(symbols).toContain('AAPL');
    expect(symbols).toContain('TSLA');
  });

  it('buildPortfolio is a function', () => {
    expect(typeof buildPortfolio).toBe('function');
  });
});
