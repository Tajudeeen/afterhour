import { describe, it, expect } from 'vitest';
import { classifyRegime, RegimeMemory } from '../src/index.js';

describe('market-engine regime', () => {
  describe('classifyRegime', () => {
    it('classifies weekend + high volatility + low liquidity as HIGH GAP RISK', () => {
      const regime = classifyRegime({
        marketStatus: 'closed',
        volatilityLevel: 'high',
        liquidity: 'low',
        gapPercent: 5,
        concentration: 'high',
        isWeekend: true,
      });
      expect(regime.label).toBe('HIGH GAP RISK');
      expect(regime.session).toBe('weekend');
    });

    it('classifies market closed with large gap as PRICE DIVERGENCE', () => {
      const regime = classifyRegime({
        marketStatus: 'closed',
        volatilityLevel: 'medium',
        liquidity: 'medium',
        gapPercent: 3,
        concentration: 'low',
        isWeekend: false,
      });
      expect(regime.label).toBe('PRICE DIVERGENCE');
    });

    it('classifies high volatility as VOLATILITY RISING', () => {
      const regime = classifyRegime({
        marketStatus: 'open',
        volatilityLevel: 'high',
        liquidity: 'high',
        gapPercent: 0.5,
        concentration: 'low',
        isWeekend: false,
      });
      expect(regime.label).toBe('VOLATILITY RISING');
    });

    it('classifies as NORMAL for open market low vol', () => {
      const regime = classifyRegime({
        marketStatus: 'open',
        volatilityLevel: 'low',
        liquidity: 'high',
        gapPercent: 0.1,
        concentration: 'low',
        isWeekend: false,
      });
      expect(regime.label).toBe('NORMAL');
    });
  });

  describe('RegimeMemory', () => {
    it('tracks transitions', () => {
      const mem = new RegimeMemory();
      const normal = classifyRegime({
        marketStatus: 'open', volatilityLevel: 'low', liquidity: 'high',
        gapPercent: 0, concentration: 'low', isWeekend: false,
      });
      const high = classifyRegime({
        marketStatus: 'closed', volatilityLevel: 'high', liquidity: 'low',
        gapPercent: 5, concentration: 'high', isWeekend: true,
      });

      mem.push(normal);
      expect(mem.current()).toEqual(normal);
      // First push records the initial transition (from 'none' to 'NORMAL')
      expect(mem.history()).toHaveLength(1);

      mem.push(normal);
      // Same regime — no new transition
      expect(mem.history()).toHaveLength(1);

      mem.push(high);
      // Different label — new transition recorded
      expect(mem.history()).toHaveLength(2);
      expect(mem.history()[1]!.to).toBe('HIGH GAP RISK');
    });
  });
});
