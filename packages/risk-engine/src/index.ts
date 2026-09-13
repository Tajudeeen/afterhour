/**
 * AfterHours Risk Engine — the Risk Governor.
 *
 * This is your security layer. The AI proposes an action. The Governor checks
 * it against hard policy constraints. The AI cannot override these policies.
 *
 * AI → "Sell $1,150 NVDA"
 * Governor → checks policy → PASS / BLOCK
 * User → approves
 * Solana → executes
 */
import type {
  RiskEvaluation,
  RiskPolicy,
} from '@afterhours/types';
import { evaluateRisk } from './evaluate.js';
import type { RiskContext } from './evaluate.js';

export { DEFAULT_RISK_POLICY } from './policy.js';
export { evaluateRisk, type RiskContext } from './evaluate.js';

/**
 * The Risk Governor evaluates a proposed trade against a hard policy.
 *
 * The AI Analyst proposes; the Governor decides whether the proposal is allowed.
 * The AI's output NEVER reaches a signer without passing through this gate.
 */
export class RiskGovernor {
  private policy: RiskPolicy;

  constructor(policy: RiskPolicy) {
    this.policy = { ...policy };
  }

  /**
   * Evaluate a proposed trade against the current portfolio and policy.
   * Returns a RiskEvaluation with passed=true/false and a human-readable reason.
   */
  evaluate(context: RiskContext): RiskEvaluation {
    return evaluateRisk(this.policy, context);
  }

  /** Update the policy (e.g. user edits limits). */
  updatePolicy(policy: RiskPolicy): void {
    this.policy = { ...policy };
  }

  getPolicy(): RiskPolicy {
    return { ...this.policy };
  }
}
