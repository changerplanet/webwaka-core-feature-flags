"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const experiment_engine_1 = require("../experiment-engine");
const errors_1 = require("../errors");
(0, vitest_1.describe)('Experiment Bucketing Engine', () => {
    const tenantId = 'tenant-123';
    const now = new Date('2025-01-01T12:00:00Z');
    const baseExperiment = {
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
    const baseContext = {
        tenantId,
        subjectId: 'user-456',
        now
    };
    (0, vitest_1.describe)('Deterministic Bucketing', () => {
        (0, vitest_1.it)('should produce identical bucket for same inputs (10x)', () => {
            const buckets = [];
            for (let i = 0; i < 10; i++) {
                const result = (0, experiment_engine_1.assignExperimentVariant)(baseExperiment, baseContext);
                buckets.push(result.bucket);
            }
            const first = buckets[0];
            for (const bucket of buckets) {
                (0, vitest_1.expect)(bucket).toBe(first);
            }
        });
        (0, vitest_1.it)('should produce different buckets for different subjects', () => {
            const results = [];
            for (let i = 0; i < 5; i++) {
                const context = {
                    ...baseContext,
                    subjectId: `user-${i}`
                };
                results.push((0, experiment_engine_1.assignExperimentVariant)(baseExperiment, context));
            }
            const uniqueBuckets = new Set(results.map(r => r.bucket));
            (0, vitest_1.expect)(uniqueBuckets.size).toBeGreaterThan(1);
        });
        (0, vitest_1.it)('should produce bucket between 0 and 99', () => {
            for (let i = 0; i < 100; i++) {
                const context = {
                    tenantId,
                    subjectId: `user-${i}`,
                    now
                };
                const result = (0, experiment_engine_1.assignExperimentVariant)(baseExperiment, context);
                (0, vitest_1.expect)(result.bucket).toBeGreaterThanOrEqual(0);
                (0, vitest_1.expect)(result.bucket).toBeLessThan(100);
            }
        });
        (0, vitest_1.it)('should assign variant based on bucket and traffic allocation', () => {
            const experiment = {
                ...baseExperiment,
                variants: [
                    { id: 'a', name: 'Variant A', trafficAllocation: 30 },
                    { id: 'b', name: 'Variant B', trafficAllocation: 30 },
                    { id: 'c', name: 'Variant C', trafficAllocation: 40 }
                ]
            };
            const variantCounts = { a: 0, b: 0, c: 0 };
            for (let i = 0; i < 1000; i++) {
                const context = {
                    tenantId,
                    subjectId: `user-bucketing-${i}`,
                    now
                };
                const result = (0, experiment_engine_1.assignExperimentVariant)(experiment, context);
                variantCounts[result.variantId]++;
            }
            (0, vitest_1.expect)(variantCounts['a']).toBeGreaterThan(200);
            (0, vitest_1.expect)(variantCounts['b']).toBeGreaterThan(200);
            (0, vitest_1.expect)(variantCounts['c']).toBeGreaterThan(300);
        });
        (0, vitest_1.it)('should not use randomness - same input always same output', () => {
            const context = {
                tenantId,
                subjectId: 'determinism-test-user',
                now
            };
            const result1 = (0, experiment_engine_1.assignExperimentVariant)(baseExperiment, context);
            const result2 = (0, experiment_engine_1.assignExperimentVariant)(baseExperiment, context);
            const result3 = (0, experiment_engine_1.assignExperimentVariant)(baseExperiment, context);
            (0, vitest_1.expect)(result1.variantId).toBe(result2.variantId);
            (0, vitest_1.expect)(result2.variantId).toBe(result3.variantId);
            (0, vitest_1.expect)(result1.bucket).toBe(result2.bucket);
            (0, vitest_1.expect)(result2.bucket).toBe(result3.bucket);
        });
        (0, vitest_1.it)('should not depend on time for bucketing', () => {
            const context1 = {
                tenantId,
                subjectId: 'time-test-user',
                now: new Date('2020-01-01')
            };
            const context2 = {
                tenantId,
                subjectId: 'time-test-user',
                now: new Date('2030-12-31')
            };
            const result1 = (0, experiment_engine_1.assignExperimentVariant)(baseExperiment, context1);
            const result2 = (0, experiment_engine_1.assignExperimentVariant)(baseExperiment, context2);
            (0, vitest_1.expect)(result1.bucket).toBe(result2.bucket);
            (0, vitest_1.expect)(result1.variantId).toBe(result2.variantId);
        });
    });
    (0, vitest_1.describe)('Inactive Experiments', () => {
        (0, vitest_1.it)('should return default variant when experiment is disabled', () => {
            const disabledExperiment = {
                ...baseExperiment,
                enabled: false
            };
            const result = (0, experiment_engine_1.assignExperimentVariant)(disabledExperiment, baseContext);
            (0, vitest_1.expect)(result.variantId).toBe('control');
            (0, vitest_1.expect)(result.bucket).toBe(-1);
            (0, vitest_1.expect)(result.reason).toContain('not active');
        });
        (0, vitest_1.it)('should return default variant when experiment has not started', () => {
            const futureExperiment = {
                ...baseExperiment,
                timeWindow: {
                    startsAt: new Date('2026-01-01')
                }
            };
            const result = (0, experiment_engine_1.assignExperimentVariant)(futureExperiment, baseContext);
            (0, vitest_1.expect)(result.bucket).toBe(-1);
            (0, vitest_1.expect)(result.reason).toContain('not active');
        });
        (0, vitest_1.it)('should return default variant when experiment has ended', () => {
            const expiredExperiment = {
                ...baseExperiment,
                timeWindow: {
                    endsAt: new Date('2024-01-01')
                }
            };
            const result = (0, experiment_engine_1.assignExperimentVariant)(expiredExperiment, baseContext);
            (0, vitest_1.expect)(result.bucket).toBe(-1);
            (0, vitest_1.expect)(result.reason).toContain('not active');
        });
    });
    (0, vitest_1.describe)('Tenant Isolation', () => {
        (0, vitest_1.it)('should throw TenantIsolationError when experiment tenant does not match context', () => {
            const context = {
                tenantId: 'other-tenant',
                subjectId: 'user-1',
                now
            };
            (0, vitest_1.expect)(() => (0, experiment_engine_1.assignExperimentVariant)(baseExperiment, context)).toThrow(errors_1.TenantIsolationError);
        });
    });
    (0, vitest_1.describe)('Explainability', () => {
        (0, vitest_1.it)('should include bucket in assignment result', () => {
            const result = (0, experiment_engine_1.assignExperimentVariant)(baseExperiment, baseContext);
            (0, vitest_1.expect)(result.bucket).toBeDefined();
            (0, vitest_1.expect)(typeof result.bucket).toBe('number');
        });
        (0, vitest_1.it)('should include reason in assignment result', () => {
            const result = (0, experiment_engine_1.assignExperimentVariant)(baseExperiment, baseContext);
            (0, vitest_1.expect)(result.reason).toBeDefined();
            (0, vitest_1.expect)(result.reason.length).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=experiment-engine.test.js.map