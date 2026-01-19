import { describe, it, expect } from 'vitest';
import { assignExperimentVariant } from '../experiment-engine';
import { ExperimentDefinition, EvaluationContext } from '../models';
import { TenantIsolationError } from '../errors';

describe('Experiment Bucketing Engine', () => {
  const tenantId = 'tenant-123';
  const now = new Date('2025-01-01T12:00:00Z');

  const baseExperiment: ExperimentDefinition = {
    id: 'exp-pricing',
    name: 'Pricing Experiment',
    tenantId,
    salt: 'experiment-salt-2025',
    variants: [
      { id: 'control', name: 'Control', trafficAllocation: 50 },
      { id: 'treatment', name: 'Treatment', trafficAllocation: 50 }
    ],
    enabled: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const baseContext: EvaluationContext = {
    tenantId,
    subjectId: 'user-456',
    now
  };

  describe('Deterministic Bucketing', () => {
    it('should produce identical bucket for same inputs (10x)', () => {
      const buckets: number[] = [];
      for (let i = 0; i < 10; i++) {
        const result = assignExperimentVariant(baseExperiment, baseContext);
        buckets.push(result.bucket);
      }

      const first = buckets[0];
      for (const bucket of buckets) {
        expect(bucket).toBe(first);
      }
    });

    it('should produce different buckets for different subjects', () => {
      const results = [];
      for (let i = 0; i < 5; i++) {
        const context: EvaluationContext = {
          ...baseContext,
          subjectId: `user-${i}`
        };
        results.push(assignExperimentVariant(baseExperiment, context));
      }

      const uniqueBuckets = new Set(results.map(r => r.bucket));
      expect(uniqueBuckets.size).toBeGreaterThan(1);
    });

    it('should produce bucket between 0 and 99', () => {
      for (let i = 0; i < 100; i++) {
        const context: EvaluationContext = {
          tenantId,
          subjectId: `user-${i}`,
          now
        };
        const result = assignExperimentVariant(baseExperiment, context);
        expect(result.bucket).toBeGreaterThanOrEqual(0);
        expect(result.bucket).toBeLessThan(100);
      }
    });

    it('should assign variant based on bucket and traffic allocation', () => {
      const experiment: ExperimentDefinition = {
        ...baseExperiment,
        variants: [
          { id: 'a', name: 'Variant A', trafficAllocation: 30 },
          { id: 'b', name: 'Variant B', trafficAllocation: 30 },
          { id: 'c', name: 'Variant C', trafficAllocation: 40 }
        ]
      };

      const variantCounts: Record<string, number> = { a: 0, b: 0, c: 0 };
      for (let i = 0; i < 1000; i++) {
        const context: EvaluationContext = {
          tenantId,
          subjectId: `user-bucketing-${i}`,
          now
        };
        const result = assignExperimentVariant(experiment, context);
        variantCounts[result.variantId]++;
      }

      expect(variantCounts['a']).toBeGreaterThan(200);
      expect(variantCounts['b']).toBeGreaterThan(200);
      expect(variantCounts['c']).toBeGreaterThan(300);
    });

    it('should not use randomness - same input always same output', () => {
      const context: EvaluationContext = {
        tenantId,
        subjectId: 'determinism-test-user',
        now
      };

      const result1 = assignExperimentVariant(baseExperiment, context);
      const result2 = assignExperimentVariant(baseExperiment, context);
      const result3 = assignExperimentVariant(baseExperiment, context);

      expect(result1.variantId).toBe(result2.variantId);
      expect(result2.variantId).toBe(result3.variantId);
      expect(result1.bucket).toBe(result2.bucket);
      expect(result2.bucket).toBe(result3.bucket);
    });

    it('should not depend on time for bucketing', () => {
      const context1: EvaluationContext = {
        tenantId,
        subjectId: 'time-test-user',
        now: new Date('2020-01-01')
      };
      const context2: EvaluationContext = {
        tenantId,
        subjectId: 'time-test-user',
        now: new Date('2030-12-31')
      };

      const result1 = assignExperimentVariant(baseExperiment, context1);
      const result2 = assignExperimentVariant(baseExperiment, context2);

      expect(result1.bucket).toBe(result2.bucket);
      expect(result1.variantId).toBe(result2.variantId);
    });
  });

  describe('Inactive Experiments', () => {
    it('should return default variant when experiment is disabled', () => {
      const disabledExperiment: ExperimentDefinition = {
        ...baseExperiment,
        enabled: false
      };

      const result = assignExperimentVariant(disabledExperiment, baseContext);
      expect(result.variantId).toBe('control');
      expect(result.bucket).toBe(-1);
      expect(result.reason).toContain('not active');
    });

    it('should return default variant when experiment has not started', () => {
      const futureExperiment: ExperimentDefinition = {
        ...baseExperiment,
        timeWindow: {
          startsAt: new Date('2026-01-01')
        }
      };

      const result = assignExperimentVariant(futureExperiment, baseContext);
      expect(result.bucket).toBe(-1);
      expect(result.reason).toContain('not active');
    });

    it('should return default variant when experiment has ended', () => {
      const expiredExperiment: ExperimentDefinition = {
        ...baseExperiment,
        timeWindow: {
          endsAt: new Date('2024-01-01')
        }
      };

      const result = assignExperimentVariant(expiredExperiment, baseContext);
      expect(result.bucket).toBe(-1);
      expect(result.reason).toContain('not active');
    });
  });

  describe('Tenant Isolation', () => {
    it('should throw TenantIsolationError when experiment tenant does not match context', () => {
      const context: EvaluationContext = {
        tenantId: 'other-tenant',
        subjectId: 'user-1',
        now
      };

      expect(() => assignExperimentVariant(baseExperiment, context)).toThrow(TenantIsolationError);
    });
  });

  describe('Explainability', () => {
    it('should include bucket in assignment result', () => {
      const result = assignExperimentVariant(baseExperiment, baseContext);
      expect(result.bucket).toBeDefined();
      expect(typeof result.bucket).toBe('number');
    });

    it('should include reason in assignment result', () => {
      const result = assignExperimentVariant(baseExperiment, baseContext);
      expect(result.reason).toBeDefined();
      expect(result.reason.length).toBeGreaterThan(0);
    });
  });
});
