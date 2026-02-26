import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getPlanLimits } from '../src/lib/planLimits';

describe('Pricing & Credit Regression', () => {
  it('should enforce unlimited exhibitions for all plans to ensure lock-in strategy', () => {
    const plans = ['free', 'starter', 'pro', 'enterprise'] as const;
    
    for (const plan of plans) {
      const limits = getPlanLimits(plan);
      assert.strictEqual(
        limits.exhibitions, 
        Infinity, 
        `Plan ${plan} muss unlimitierte Projekte haben (Lock-in Strategie).`
      );
    }
  });
});
