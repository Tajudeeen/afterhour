/**
 * Default risk policy for AfterHours.
 *
 * These are hard constraints enforced deterministically by the Risk Governor.
 * The AI Analyst cannot override them.
 */
import type { RiskPolicy } from '@afterhours/types';

export const DEFAULT_RISK_POLICY: RiskPolicy = {
  /** Max 35% of portfolio value in any single asset */
  maxSingleAssetExposurePercent: 35,
  /** Max $1,500 per trade */
  maxTradeUsd: 1500,
  /** Min 10% of portfolio in USDC (stable reserve) */
  minUsdcReservePercent: 10,
  /** Max 3% portfolio loss in a single day before trading is paused */
  maxDailyDrawdownPercent: 3,
  /** Always require user approval before execution — never autonomous */
  requireUserApproval: true,
};

/**
 * Policy validation — fail closed on invalid configuration.
 */
export function validatePolicy(policy: RiskPolicy): string[] {
  const issues: string[] = [];

  if (policy.maxSingleAssetExposurePercent < 0 || policy.maxSingleAssetExposurePercent > 100) {
    issues.push('maxSingleAssetExposurePercent must be 0-100');
  }
  if (policy.maxTradeUsd < 0) {
    issues.push('maxTradeUsd must be non-negative');
  }
  if (policy.minUsdcReservePercent < 0 || policy.minUsdcReservePercent > 100) {
    issues.push('minUsdcReservePercent must be 0-100');
  }
  if (policy.maxDailyDrawdownPercent < 0) {
    issues.push('maxDailyDrawdownPercent must be non-negative');
  }

  if (issues.length > 0) {
    throw new Error(`Invalid risk policy: ${issues.join('; ')}`);
  }

  return issues;
}
