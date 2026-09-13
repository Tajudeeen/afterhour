import { describe, it, expect } from 'vitest';
import * as types from '../src/index.js';

// Smoke test: verify core exports from the types package.
// Full type checking is handled by `tsc --noEmit` in the typecheck step.
describe('types package', () => {
  it('exports RISK_SCORE_BANDS with expected labels', () => {
    expect(types.RISK_SCORE_BANDS.NORMAL).toBe('Normal');
    expect(types.RISK_SCORE_BANDS.WATCH).toBe('Watch');
    expect(types.RISK_SCORE_BANDS.ELEVATED).toBe('Elevated');
    expect(types.RISK_SCORE_BANDS.HIGH).toBe('High');
    expect(types.RISK_SCORE_BANDS.EXTREME).toBe('Extreme');
  });
});
