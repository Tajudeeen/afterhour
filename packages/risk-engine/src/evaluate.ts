/**
 * Risk evaluation logic — the core of the Governor's deterministic checks.
 */
import type {
  Portfolio,
  RiskEvaluation,
  RiskPolicy,
} from '@afterhours/types';

export interface RiskContext {
  proposal: {
    action: 'buy' | 'sell';
    asset: string;
    amountUsd: number;
  };
  portfolio: Portfolio;
  dailyPnLPercent: number;
}

/**
 * Evaluate a proposed trade against policy.
 * Returns PASS (passed=true) or BLOCK (passed=false) with a reason.
 */
export function evaluateRisk(policy: RiskPolicy, context: RiskContext): RiskEvaluation {
  const { proposal, portfolio, dailyPnLPercent } = context;

  // 1. Check max trade size
  if (proposal.amountUsd > policy.maxTradeUsd) {
    return blocked(policy, proposal, portfolio, dailyPnLPercent,
      `Trade size $${Math.round(proposal.amountUsd)} exceeds max trade limit $${policy.maxTradeUsd}`);
  }

  // 2. Check daily drawdown limit
  if (dailyPnLPercent < -policy.maxDailyDrawdownPercent) {
    return blocked(policy, proposal, portfolio, dailyPnLPercent,
      `Portfolio is already down ${Math.round(dailyPnLPercent)}% today, exceeding the daily drawdown limit of ${policy.maxDailyDrawdownPercent}%`);
  }

  // Compute portfolio composition after the proposed trade
  const currentExposure = getExposurePercent(portfolio, proposal.asset);
  const proposedExposure = computeProposedExposure(portfolio, proposal, currentExposure);
  const usdcAfterTrade = computeUsdcAfterTrade(portfolio, proposal);
  const totalValue = portfolio.totalValueUsd;
  const usdcReservePercent = totalValue > 0 ? (usdcAfterTrade / totalValue) * 100 : 0;

  // 3. Check exposure limit
  if (proposedExposure > policy.maxSingleAssetExposurePercent) {
    return blocked(policy, proposal, portfolio, dailyPnLPercent,
      `${proposal.asset} exposure after trade would be ${Math.round(proposedExposure)}% (limit: ${policy.maxSingleAssetExposurePercent}%)`);
  }

  // 4. Check USDC reserve
  if (usdcReservePercent < policy.minUsdcReservePercent) {
    return blocked(policy, proposal, portfolio, dailyPnLPercent,
      `USDC reserve after trade would be ${Math.round(usdcReservePercent)}% (minimum: ${policy.minUsdcReservePercent}%)`);
  }

  // 5. Check approval requirement
  if (policy.requireUserApproval) {
    return {
      policy,
      proposed: proposal,
      current: {
        exposurePercent: currentExposure,
        usdcReservePercent: totalValue > 0 ? (getUsdcValue(portfolio) / totalValue) * 100 : 0,
        dailyPnLPercent,
      },
      proposedState: {
        exposurePercent: proposedExposure,
        usdcReservePercent,
      },
      passed: true,
      reason: null,
    };
  }

  return {
    policy,
    proposed: proposal,
    current: {
      exposurePercent: currentExposure,
      usdcReservePercent: totalValue > 0 ? (getUsdcValue(portfolio) / totalValue) * 100 : 0,
      dailyPnLPercent,
    },
    proposedState: {
      exposurePercent: proposedExposure,
      usdcReservePercent,
    },
    passed: true,
    reason: null,
  };
}

function getExposurePercent(portfolio: Portfolio, symbol: string): number {
  const holding = portfolio.holdings.find((h) => h.symbol === symbol);
  if (!holding || portfolio.totalValueUsd === 0) return 0;
  return (holding.valueUsd / portfolio.totalValueUsd) * 100;
}

function getUsdcValue(portfolio: Portfolio): number {
  const usdc = portfolio.holdings.find((h) => h.symbol === 'USDC');
  return usdc?.valueUsd ?? 0;
}

function computeProposedExposure(
  portfolio: Portfolio,
  proposal: { action: 'buy' | 'sell'; asset: string; amountUsd: number },
  currentExposure: number,
): number {
  const totalValue = portfolio.totalValueUsd;
  if (totalValue === 0) return proposal.action === 'sell' ? 0 : 100;

  let newAssetValue: number;
  let newValue: number;

  if (proposal.action === 'sell') {
    // Selling reduces the asset, converts to USDC — total portfolio value unchanged
    const holding = portfolio.holdings.find((h) => h.symbol === proposal.asset);
    if (!holding) return currentExposure;
    newAssetValue = Math.max(0, holding.valueUsd - proposal.amountUsd);
    newValue = totalValue; // value stays the same, just rebalanced
  } else {
    // Buying increases the asset using USDC
    const holding = portfolio.holdings.find((h) => h.symbol === proposal.asset);
    const currentAssetValue = holding?.valueUsd ?? 0;
    newAssetValue = currentAssetValue + proposal.amountUsd;
    newValue = totalValue; // assuming we already have the USDC in the portfolio
  }

  return (newAssetValue / newValue) * 100;
}

function computeUsdcAfterTrade(
  portfolio: Portfolio,
  proposal: { action: 'buy' | 'sell'; amountUsd: number },
): number {
  const currentUsdc = getUsdcValue(portfolio);
  return proposal.action === 'sell'
    ? currentUsdc + proposal.amountUsd
    : Math.max(0, currentUsdc - proposal.amountUsd);
}

function blocked(
  policy: RiskPolicy,
  proposal: { action: 'buy' | 'sell'; asset: string; amountUsd: number },
  portfolio: Portfolio,
  dailyPnLPercent: number,
  reason: string,
): RiskEvaluation {
  const currentExposure = getExposurePercent(portfolio, proposal.asset);
  const totalValue = portfolio.totalValueUsd;
  return {
    policy,
    proposed: proposal,
    current: {
      exposurePercent: currentExposure,
      usdcReservePercent: totalValue > 0 ? (getUsdcValue(portfolio) / totalValue) * 100 : 0,
      dailyPnLPercent,
    },
    proposedState: {
      exposurePercent: 0, // unknown, blocked
      usdcReservePercent: 0,
    },
    passed: false,
    reason,
  };
}
