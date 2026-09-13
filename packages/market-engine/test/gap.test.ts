import { describe, it, expect } from 'vitest';
import { calculateGapPercent, classifyLiquidity, computeGapRiskScore } from '../src/index.js';

describe('market-engine', () => {
  describe('calculateGapPercent', () => {
    it('computes positive gap correctly', () => {
      expect(calculateGapPercent(189.7, 182.4)).toBeCloseTo(4.0, 2);
    });

    it('computes negative gap correctly', () => {
      expect(calculateGapPercent(178.0, 182.4)).toBeCloseTo(-2.41, 2);
    });

    it('returns 0 for equal prices', () => {
      expect(calculateGapPercent(100, 100)).toBe(0);
    });

    it('throws for zero reference price', () => {
      expect(() => calculateGapPercent(100, 0)).toThrow('referencePrice must be positive');
    });
  });

  describe('classifyLiquidity', () => {
    it('classifies high liquidity', () => {
      expect(classifyLiquidity(150_000)).toBe('high');
    });

    it('classifies medium liquidity', () => {
      expect(classifyLiquidity(50_000)).toBe('medium');
    });

    it('classifies low liquidity', () => {
      expect(classifyLiquidity(5_000)).toBe('low');
    });
  });

  describe('computeGapRiskScore', () => {
    it('gives Normal for small gap in open market', () => {
      const result = computeGapRiskScore({
        gapPercent: 0.5,
        volume24h: 50_000,
        liquidityUsd: 200_000,
        marketStatus: 'open',
        volatilityLevel: 'low',
        hoursSinceReferenceUpdate: 1,
      });
      expect(result.score).toBeLessThanOrEqual(20);
      expect(result.band).toBe('Normal');
    });

    it('gives High for large gap during market close with low liquidity', () => {
      // 7.5% gap = 20 pts
      // closed = 20 pts
      // medium vol = 10 pts (reduced from high to lower total)
      // liquidity 8_000 = 15 pts
      // 16h stale = 10 pts (exactly 16, not > 16)
      // volume < 5k = 5 pts
      // Total: 20 + 20 + 10 + 15 + 10 + 5 = 80 → High (61-80)
      const result = computeGapRiskScore({
        gapPercent: 7.5,
        volume24h: 2_000,
        liquidityUsd: 8_000,
        marketStatus: 'closed',
        volatilityLevel: 'medium',
        hoursSinceReferenceUpdate: 16,
      });
      expect(result.band).toBe('High');
    });

    it('gives Extreme for very large gap with all risk factors', () => {
      // 15% gap = 30 pts, closed = 20, high vol = 20, liquidity 3k = 15,
      // 48h stale = 10, volume < 5k = 5 → total = 100 → Extreme
      const result = computeGapRiskScore({
        gapPercent: 15,
        volume24h: 500,
        liquidityUsd: 3_000,
        marketStatus: 'closed',
        volatilityLevel: 'high',
        hoursSinceReferenceUpdate: 48,
      });
      expect(result.band).toBe('Extreme');
      expect(result.score).toBeGreaterThanOrEqual(80);
    });

    it('score is clamped to 0-100', () => {
      const result = computeGapRiskScore({
        gapPercent: 50,
        volume24h: 0,
        liquidityUsd: 0,
        marketStatus: 'closed',
        volatilityLevel: 'high',
        hoursSinceReferenceUpdate: 100,
      });
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });
});
