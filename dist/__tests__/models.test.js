"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const models_1 = require("../models");
(0, vitest_1.describe)('Domain Models', () => {
    (0, vitest_1.describe)('PRECEDENCE_ORDER', () => {
        (0, vitest_1.it)('should have correct precedence order', () => {
            (0, vitest_1.expect)(models_1.PRECEDENCE_ORDER).toEqual([
                'individual',
                'group',
                'tenant',
                'partner',
                'plan',
                'system'
            ]);
        });
    });
    (0, vitest_1.describe)('TimeWindowSchema', () => {
        (0, vitest_1.it)('should accept valid time window', () => {
            const result = models_1.TimeWindowSchema.safeParse({
                startsAt: new Date('2025-01-01'),
                endsAt: new Date('2025-12-31')
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should reject invalid time window where startsAt >= endsAt', () => {
            const result = models_1.TimeWindowSchema.safeParse({
                startsAt: new Date('2025-12-31'),
                endsAt: new Date('2025-01-01')
            });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should accept window with only startsAt', () => {
            const result = models_1.TimeWindowSchema.safeParse({
                startsAt: new Date('2025-01-01')
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should accept window with only endsAt', () => {
            const result = models_1.TimeWindowSchema.safeParse({
                endsAt: new Date('2025-12-31')
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should accept empty window', () => {
            const result = models_1.TimeWindowSchema.safeParse({});
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('FeatureRuleSchema', () => {
        (0, vitest_1.it)('should require tenantId', () => {
            const result = models_1.FeatureRuleSchema.safeParse({
                id: 'rule-1',
                featureId: 'feature-1',
                source: 'system',
                enabled: true
            });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should accept valid rule', () => {
            const result = models_1.FeatureRuleSchema.safeParse({
                id: 'rule-1',
                featureId: 'feature-1',
                tenantId: 'tenant-1',
                source: 'system',
                enabled: true
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should default priority to 0', () => {
            const result = models_1.FeatureRuleSchema.parse({
                id: 'rule-1',
                featureId: 'feature-1',
                tenantId: 'tenant-1',
                source: 'system',
                enabled: true
            });
            (0, vitest_1.expect)(result.priority).toBe(0);
        });
    });
    (0, vitest_1.describe)('ExperimentDefinitionSchema', () => {
        (0, vitest_1.it)('should require variants to sum to 100', () => {
            const result = models_1.ExperimentDefinitionSchema.safeParse({
                id: 'exp-1',
                name: 'Test',
                tenantId: 'tenant-1',
                salt: 'salt',
                variants: [
                    { id: 'a', name: 'A', trafficAllocation: 30 },
                    { id: 'b', name: 'B', trafficAllocation: 30 }
                ],
                createdAt: new Date(),
                updatedAt: new Date()
            });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should accept valid experiment with variants summing to 100', () => {
            const result = models_1.ExperimentDefinitionSchema.safeParse({
                id: 'exp-1',
                name: 'Test',
                tenantId: 'tenant-1',
                salt: 'salt',
                variants: [
                    { id: 'a', name: 'A', trafficAllocation: 50 },
                    { id: 'b', name: 'B', trafficAllocation: 50 }
                ],
                createdAt: new Date(),
                updatedAt: new Date()
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should require at least one variant', () => {
            const result = models_1.ExperimentDefinitionSchema.safeParse({
                id: 'exp-1',
                name: 'Test',
                tenantId: 'tenant-1',
                salt: 'salt',
                variants: [],
                createdAt: new Date(),
                updatedAt: new Date()
            });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('EvaluationContextSchema', () => {
        (0, vitest_1.it)('should require tenantId and subjectId', () => {
            const result = models_1.EvaluationContextSchema.safeParse({});
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should accept minimal valid context', () => {
            const result = models_1.EvaluationContextSchema.safeParse({
                tenantId: 'tenant-1',
                subjectId: 'user-1'
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should accept full context', () => {
            const result = models_1.EvaluationContextSchema.safeParse({
                tenantId: 'tenant-1',
                subjectId: 'user-1',
                groupIds: ['admin', 'beta'],
                partnerId: 'partner-1',
                planId: 'plan-pro',
                attributes: { role: 'admin' },
                now: new Date()
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('FeatureSnapshotSchema', () => {
        (0, vitest_1.it)('should require generatedAt before expiresAt', () => {
            const result = models_1.FeatureSnapshotSchema.safeParse({
                id: 'snap-1',
                tenantId: 'tenant-1',
                tenantHash: 'hash',
                subjectId: 'user-1',
                features: {},
                experiments: {},
                generatedAt: new Date('2025-12-31'),
                expiresAt: new Date('2025-01-01'),
                checksum: 'checksum'
            });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should accept valid snapshot', () => {
            const result = models_1.FeatureSnapshotSchema.safeParse({
                id: 'snap-1',
                tenantId: 'tenant-1',
                tenantHash: 'hash',
                subjectId: 'user-1',
                features: {},
                experiments: {},
                generatedAt: new Date('2025-01-01'),
                expiresAt: new Date('2025-12-31'),
                checksum: 'checksum'
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
});
//# sourceMappingURL=models.test.js.map