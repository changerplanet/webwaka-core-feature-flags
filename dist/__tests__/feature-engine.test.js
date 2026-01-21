"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const feature_engine_1 = require("../feature-engine");
const errors_1 = require("../errors");
(0, vitest_1.describe)('Feature Flag Evaluation Engine', () => {
    const tenantId = 'tenant-123';
    const subjectId = 'user-456';
    const featureId = 'feature-premium';
    const now = new Date('2025-01-01T12:00:00Z');
    const baseContext = {
        tenantId,
        subjectId,
        now
    };
    (0, vitest_1.describe)('Precedence Hierarchy', () => {
        (0, vitest_1.it)('should respect individual override as highest priority', () => {
            const rules = [
                { id: 'r1', featureId, tenantId, source: 'system', enabled: false, priority: 0 },
                { id: 'r2', featureId, tenantId, source: 'tenant', enabled: false, priority: 0 },
                { id: 'r3', featureId, tenantId, source: 'individual', enabled: true, subjectId, priority: 0 }
            ];
            const result = (0, feature_engine_1.checkFeature)(featureId, baseContext, rules);
            (0, vitest_1.expect)(result.enabled).toBe(true);
            (0, vitest_1.expect)(result.source).toBe('individual');
            (0, vitest_1.expect)(result.ruleId).toBe('r3');
        });
        (0, vitest_1.it)('should respect group override over tenant-level rules', () => {
            const context = {
                ...baseContext,
                groupIds: ['admin-group']
            };
            const rules = [
                { id: 'r1', featureId, tenantId, source: 'tenant', enabled: false, priority: 0 },
                { id: 'r2', featureId, tenantId, source: 'group', enabled: true, groupId: 'admin-group', priority: 0 }
            ];
            const result = (0, feature_engine_1.checkFeature)(featureId, context, rules);
            (0, vitest_1.expect)(result.enabled).toBe(true);
            (0, vitest_1.expect)(result.source).toBe('group');
        });
        (0, vitest_1.it)('should respect tenant-level over partner-level rules', () => {
            const context = {
                ...baseContext,
                partnerId: 'partner-1'
            };
            const rules = [
                { id: 'r1', featureId, tenantId, source: 'partner', enabled: true, partnerId: 'partner-1', priority: 0 },
                { id: 'r2', featureId, tenantId, source: 'tenant', enabled: false, priority: 0 }
            ];
            const result = (0, feature_engine_1.checkFeature)(featureId, context, rules);
            (0, vitest_1.expect)(result.enabled).toBe(false);
            (0, vitest_1.expect)(result.source).toBe('tenant');
        });
        (0, vitest_1.it)('should respect partner-level over plan-level rules', () => {
            const context = {
                ...baseContext,
                partnerId: 'partner-1',
                planId: 'plan-pro'
            };
            const rules = [
                { id: 'r1', featureId, tenantId, source: 'plan', enabled: false, planId: 'plan-pro', priority: 0 },
                { id: 'r2', featureId, tenantId, source: 'partner', enabled: true, partnerId: 'partner-1', priority: 0 }
            ];
            const result = (0, feature_engine_1.checkFeature)(featureId, context, rules);
            (0, vitest_1.expect)(result.enabled).toBe(true);
            (0, vitest_1.expect)(result.source).toBe('partner');
        });
        (0, vitest_1.it)('should respect plan-level over system defaults', () => {
            const context = {
                ...baseContext,
                planId: 'plan-enterprise'
            };
            const rules = [
                { id: 'r1', featureId, tenantId, source: 'system', enabled: false, priority: 0 },
                { id: 'r2', featureId, tenantId, source: 'plan', enabled: true, planId: 'plan-enterprise', priority: 0 }
            ];
            const result = (0, feature_engine_1.checkFeature)(featureId, context, rules);
            (0, vitest_1.expect)(result.enabled).toBe(true);
            (0, vitest_1.expect)(result.source).toBe('plan');
        });
        (0, vitest_1.it)('should fall back to system default when no other rules match', () => {
            const rules = [
                { id: 'r1', featureId, tenantId, source: 'system', enabled: true, priority: 0 }
            ];
            const result = (0, feature_engine_1.checkFeature)(featureId, baseContext, rules);
            (0, vitest_1.expect)(result.enabled).toBe(true);
            (0, vitest_1.expect)(result.source).toBe('system');
        });
        (0, vitest_1.it)('should return disabled when no rules match', () => {
            const rules = [];
            const result = (0, feature_engine_1.checkFeature)(featureId, baseContext, rules);
            (0, vitest_1.expect)(result.enabled).toBe(false);
            (0, vitest_1.expect)(result.source).toBe('system');
            (0, vitest_1.expect)(result.reason).toContain('No matching rules found');
        });
        (0, vitest_1.it)('should enforce full precedence hierarchy in correct order', () => {
            const context = {
                tenantId,
                subjectId,
                groupIds: ['group-1'],
                partnerId: 'partner-1',
                planId: 'plan-1',
                now
            };
            const sources = ['system', 'plan', 'partner', 'tenant', 'group', 'individual'];
            for (let i = 0; i < sources.length; i++) {
                const rules = sources.slice(0, i + 1).map((source, idx) => ({
                    id: `rule-${idx}`,
                    featureId,
                    tenantId,
                    source,
                    enabled: source === sources[i],
                    subjectId: source === 'individual' ? subjectId : undefined,
                    groupId: source === 'group' ? 'group-1' : undefined,
                    partnerId: source === 'partner' ? 'partner-1' : undefined,
                    planId: source === 'plan' ? 'plan-1' : undefined,
                    priority: 0
                }));
                const result = (0, feature_engine_1.checkFeature)(featureId, context, rules);
                (0, vitest_1.expect)(result.source).toBe(sources[i]);
            }
        });
    });
    (0, vitest_1.describe)('Time-bound Rules', () => {
        (0, vitest_1.it)('should exclude rules that have not started yet', () => {
            const futureStart = new Date('2025-06-01T00:00:00Z');
            const rules = [
                { id: 'r1', featureId, tenantId, source: 'tenant', enabled: true, priority: 0, timeWindow: { startsAt: futureStart } },
                { id: 'r2', featureId, tenantId, source: 'system', enabled: false, priority: 0 }
            ];
            const result = (0, feature_engine_1.checkFeature)(featureId, baseContext, rules);
            (0, vitest_1.expect)(result.enabled).toBe(false);
            (0, vitest_1.expect)(result.source).toBe('system');
        });
        (0, vitest_1.it)('should exclude rules that have expired', () => {
            const pastEnd = new Date('2024-12-01T00:00:00Z');
            const rules = [
                { id: 'r1', featureId, tenantId, source: 'tenant', enabled: true, priority: 0, timeWindow: { endsAt: pastEnd } },
                { id: 'r2', featureId, tenantId, source: 'system', enabled: false, priority: 0 }
            ];
            const result = (0, feature_engine_1.checkFeature)(featureId, baseContext, rules);
            (0, vitest_1.expect)(result.enabled).toBe(false);
            (0, vitest_1.expect)(result.source).toBe('system');
        });
        (0, vitest_1.it)('should include rules within valid time window', () => {
            const validWindow = {
                startsAt: new Date('2024-12-01T00:00:00Z'),
                endsAt: new Date('2025-06-01T00:00:00Z')
            };
            const rules = [
                { id: 'r1', featureId, tenantId, source: 'tenant', enabled: true, priority: 0, timeWindow: validWindow }
            ];
            const result = (0, feature_engine_1.checkFeature)(featureId, baseContext, rules);
            (0, vitest_1.expect)(result.enabled).toBe(true);
        });
    });
    (0, vitest_1.describe)('Tenant Isolation', () => {
        (0, vitest_1.it)('should throw TenantIsolationError when rule tenant does not match context', () => {
            const rules = [
                { id: 'r1', featureId, tenantId: 'other-tenant', source: 'system', enabled: true, priority: 0 }
            ];
            (0, vitest_1.expect)(() => (0, feature_engine_1.checkFeature)(featureId, baseContext, rules)).toThrow(errors_1.TenantIsolationError);
        });
        (0, vitest_1.it)('should only evaluate rules for the correct tenant', () => {
            const rules = [
                { id: 'r1', featureId, tenantId, source: 'system', enabled: true, priority: 0 }
            ];
            const result = (0, feature_engine_1.checkFeature)(featureId, baseContext, rules);
            (0, vitest_1.expect)(result.enabled).toBe(true);
        });
    });
    (0, vitest_1.describe)('Determinism', () => {
        (0, vitest_1.it)('should return identical results for identical inputs (10x)', () => {
            const rules = [
                { id: 'r1', featureId, tenantId, source: 'tenant', enabled: true, priority: 0 }
            ];
            const results = [];
            for (let i = 0; i < 10; i++) {
                results.push((0, feature_engine_1.checkFeature)(featureId, baseContext, rules));
            }
            const first = results[0];
            for (const result of results) {
                (0, vitest_1.expect)(result.enabled).toBe(first.enabled);
                (0, vitest_1.expect)(result.source).toBe(first.source);
                (0, vitest_1.expect)(result.ruleId).toBe(first.ruleId);
                (0, vitest_1.expect)(result.reason).toBe(first.reason);
            }
        });
    });
    (0, vitest_1.describe)('Explainability', () => {
        (0, vitest_1.it)('should provide reason and source in result', () => {
            const rules = [
                { id: 'r1', featureId, tenantId, source: 'individual', enabled: true, subjectId, priority: 0 }
            ];
            const result = (0, feature_engine_1.checkFeature)(featureId, baseContext, rules);
            (0, vitest_1.expect)(result.reason).toBeDefined();
            (0, vitest_1.expect)(result.reason.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.source).toBe('individual');
            (0, vitest_1.expect)(result.ruleId).toBe('r1');
        });
    });
});
//# sourceMappingURL=feature-engine.test.js.map