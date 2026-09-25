import { describe, it, expect } from 'vitest';
import { validatePolicy, DEFAULT_RISK_POLICY } from '../src/policy.js';
import type { RiskPolicy } from '@afterhours/types';

describe('policy validation', () => {
  it('validates a correct policy without throwing', () => {
    expect(() => validatePolicy(DEFAULT_RISK_POLICY)).not.toThrow();
    const result = validatePolicy(DEFAULT_RISK_POLICY);
    expect(result).toEqual([]);
  });

  describe('maxSingleAssetExposurePercent', () => {
    it('throws if < 0', () => {
      const policy: RiskPolicy = { ...DEFAULT_RISK_POLICY, maxSingleAssetExposurePercent: -1 };
      expect(() => validatePolicy(policy)).toThrowError(/maxSingleAssetExposurePercent must be 0-100/);
    });

    it('throws if > 100', () => {
      const policy: RiskPolicy = { ...DEFAULT_RISK_POLICY, maxSingleAssetExposurePercent: 101 };
      expect(() => validatePolicy(policy)).toThrowError(/maxSingleAssetExposurePercent must be 0-100/);
    });

    it('passes if exactly 0 or 100', () => {
      expect(() => validatePolicy({ ...DEFAULT_RISK_POLICY, maxSingleAssetExposurePercent: 0 })).not.toThrow();
      expect(() => validatePolicy({ ...DEFAULT_RISK_POLICY, maxSingleAssetExposurePercent: 100 })).not.toThrow();
    });
  });

  describe('maxTradeUsd', () => {
    it('throws if < 0', () => {
      const policy: RiskPolicy = { ...DEFAULT_RISK_POLICY, maxTradeUsd: -1 };
      expect(() => validatePolicy(policy)).toThrowError(/maxTradeUsd must be non-negative/);
    });

    it('passes if exactly 0', () => {
      expect(() => validatePolicy({ ...DEFAULT_RISK_POLICY, maxTradeUsd: 0 })).not.toThrow();
    });
  });

  describe('minUsdcReservePercent', () => {
    it('throws if < 0', () => {
      const policy: RiskPolicy = { ...DEFAULT_RISK_POLICY, minUsdcReservePercent: -1 };
      expect(() => validatePolicy(policy)).toThrowError(/minUsdcReservePercent must be 0-100/);
    });

    it('throws if > 100', () => {
      const policy: RiskPolicy = { ...DEFAULT_RISK_POLICY, minUsdcReservePercent: 101 };
      expect(() => validatePolicy(policy)).toThrowError(/minUsdcReservePercent must be 0-100/);
    });

    it('passes if exactly 0 or 100', () => {
      expect(() => validatePolicy({ ...DEFAULT_RISK_POLICY, minUsdcReservePercent: 0 })).not.toThrow();
      expect(() => validatePolicy({ ...DEFAULT_RISK_POLICY, minUsdcReservePercent: 100 })).not.toThrow();
    });
  });

  describe('maxDailyDrawdownPercent', () => {
    it('throws if < 0', () => {
      const policy: RiskPolicy = { ...DEFAULT_RISK_POLICY, maxDailyDrawdownPercent: -1 };
      expect(() => validatePolicy(policy)).toThrowError(/maxDailyDrawdownPercent must be non-negative/);
    });

    it('passes if exactly 0', () => {
      expect(() => validatePolicy({ ...DEFAULT_RISK_POLICY, maxDailyDrawdownPercent: 0 })).not.toThrow();
    });
  });

  it('accumulates multiple issues correctly', () => {
    const policy: RiskPolicy = {
      ...DEFAULT_RISK_POLICY,
      maxSingleAssetExposurePercent: -1,
      maxTradeUsd: -1,
      minUsdcReservePercent: 101,
      maxDailyDrawdownPercent: -1,
    };

    expect(() => validatePolicy(policy)).toThrowError(
      'Invalid risk policy: maxSingleAssetExposurePercent must be 0-100; maxTradeUsd must be non-negative; minUsdcReservePercent must be 0-100; maxDailyDrawdownPercent must be non-negative'
    );
  });
});
