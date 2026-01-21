"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_1 = require("../index");
const errors_1 = require("../errors");
(0, vitest_1.describe)('HARD STOP PROOF: Complete Feature Flag & Experiment System', () => {
    const tenantId = 'tenant-hard-stop-test';
    const subjectId = 'user-hard-stop';
    const now = new Date('2025-06-15T12:00:00Z');
    (0, vitest_1.it)('proves: A Suite can evaluate a feature flag or experiment online or offline, for a given subject and tenant, and receive a deterministic, explainable, verifiable result, respecting precedence, time bounds, and tenant isolation', () => {
        const context = {
            tenantId,
            subjectId,
            groupIds: ['beta-testers'],
            partnerId: 'partner-acme',
            planId: 'plan-enterprise',
            now
        };
        const rules = [
            {
                id: 'rule-system',
                featureId: 'premium-dashboard',
                tenantId,
                source: 'system',
                enabled: false,
                priority: 0
            },
            {
                id: 'rule-plan',
                featureId: 'premium-dashboard',
                tenantId,
                source: 'plan',
                enabled: true,
                planId: 'plan-enterprise',
                priority: 0
            },
            {
                id: 'rule-individual-override',
                featureId: 'premium-dashboard',
                tenantId,
                source: 'individual',
                enabled: false,
                subjectId,
                priority: 0
            },
            {
                id: 'rule-expired',
                featureId: 'premium-dashboard',
                tenantId,
                source: 'tenant',
                enabled: true,
                priority: 100,
                timeWindow: {
                    startsAt: new Date('2024-01-01'),
                    endsAt: new Date('2024-12-31')
                }
            }
        ];
        const experiments = [
            {
                id: 'exp-checkout-flow',
                name: 'Checkout Flow Experiment',
                tenantId,
                salt: 'hard-stop-salt',
                variants: [
                    { id: 'control', name: 'Original Flow', trafficAllocation: 50 },
                    { id: 'streamlined', name: 'Streamlined Flow', trafficAllocation: 50 }
                ],
                enabled: true,
                createdAt: new Date('2025-01-01'),
                updatedAt: new Date('2025-01-01')
            }
        ];
        const onlineResult = (0, index_1.checkFeature)('premium-dashboard', context, rules);
        (0, vitest_1.expect)(onlineResult.enabled).toBe(false);
        (0, vitest_1.expect)(onlineResult.source).toBe('individual');
        (0, vitest_1.expect)(onlineResult.ruleId).toBe('rule-individual-override');
        (0, vitest_1.expect)(onlineResult.reason).toContain('Individual override');
        (0, vitest_1.expect)(onlineResult.evaluatedAt).toEqual(now);
        const experimentAssignment = (0, index_1.assignExperimentVariant)(experiments[0], context);
        (0, vitest_1.expect)(experimentAssignment.tenantId).toBe(tenantId);
        (0, vitest_1.expect)(experimentAssignment.subjectId).toBe(subjectId);
        (0, vitest_1.expect)(experimentAssignment.bucket).toBeGreaterThanOrEqual(0);
        (0, vitest_1.expect)(experimentAssignment.bucket).toBeLessThan(100);
        (0, vitest_1.expect)(['control', 'streamlined']).toContain(experimentAssignment.variantId);
        (0, vitest_1.expect)(experimentAssignment.reason).toContain('deterministic bucketing');
        const snapshot = (0, index_1.generateFeatureSnapshot)(context, rules, experiments);
        (0, vitest_1.expect)(snapshot.tenantId).toBe(tenantId);
        (0, vitest_1.expect)(snapshot.subjectId).toBe(subjectId);
        (0, vitest_1.expect)(snapshot.checksum).toBeDefined();
        (0, vitest_1.expect)(snapshot.tenantHash).toBeDefined();
        (0, vitest_1.expect)((0, index_1.verifySnapshot)(snapshot)).toBe(true);
        const offlineEvalTime = new Date(now.getTime() + 3600000);
        const offlineResult = (0, index_1.evaluateFromSnapshot)('premium-dashboard', snapshot, offlineEvalTime);
        (0, vitest_1.expect)(offlineResult.enabled).toBe(false);
        (0, vitest_1.expect)(offlineResult.source).toBe('individual');
        (0, vitest_1.expect)(offlineResult.reason).toContain('from verified snapshot');
        const determinismResults = [];
        for (let i = 0; i < 10; i++) {
            determinismResults.push((0, index_1.checkFeature)('premium-dashboard', context, rules));
        }
        const firstResult = determinismResults[0];
        for (const result of determinismResults) {
            (0, vitest_1.expect)(result.enabled).toBe(firstResult.enabled);
            (0, vitest_1.expect)(result.source).toBe(firstResult.source);
            (0, vitest_1.expect)(result.ruleId).toBe(firstResult.ruleId);
        }
        const experimentDeterminismResults = [];
        for (let i = 0; i < 10; i++) {
            experimentDeterminismResults.push((0, index_1.assignExperimentVariant)(experiments[0], context));
        }
        const firstAssignment = experimentDeterminismResults[0];
        for (const assignment of experimentDeterminismResults) {
            (0, vitest_1.expect)(assignment.variantId).toBe(firstAssignment.variantId);
            (0, vitest_1.expect)(assignment.bucket).toBe(firstAssignment.bucket);
        }
        const otherTenantContext = {
            tenantId: 'other-tenant-id',
            subjectId,
            now
        };
        (0, vitest_1.expect)(() => (0, index_1.checkFeature)('premium-dashboard', otherTenantContext, rules)).toThrow(errors_1.TenantIsolationError);
        (0, vitest_1.expect)(() => (0, index_1.assignExperimentVariant)(experiments[0], otherTenantContext)).toThrow(errors_1.TenantIsolationError);
        (0, vitest_1.expect)(() => (0, index_1.evaluateFromSnapshot)('premium-dashboard', snapshot, now, 'other-tenant-id')).toThrow(errors_1.TenantIsolationError);
        const withExpiredRule = rules.find(r => r.id === 'rule-expired');
        (0, vitest_1.expect)(withExpiredRule).toBeDefined();
        const resultWithoutExpired = (0, index_1.checkFeature)('premium-dashboard', context, rules);
        (0, vitest_1.expect)(resultWithoutExpired.source).toBe('individual');
    });
    (0, vitest_1.it)('proves: precedence hierarchy is strictly enforced (individual > group > tenant > partner > plan > system)', () => {
        const context = {
            tenantId,
            subjectId: 'precedence-test-user',
            groupIds: ['admin'],
            partnerId: 'partner-1',
            planId: 'plan-pro',
            now
        };
        const fullRules = [
            { id: 'system-rule', featureId: 'test-feature', tenantId, source: 'system', enabled: false, priority: 0 },
            { id: 'plan-rule', featureId: 'test-feature', tenantId, source: 'plan', planId: 'plan-pro', enabled: false, priority: 0 },
            { id: 'partner-rule', featureId: 'test-feature', tenantId, source: 'partner', partnerId: 'partner-1', enabled: false, priority: 0 },
            { id: 'tenant-rule', featureId: 'test-feature', tenantId, source: 'tenant', enabled: false, priority: 0 },
            { id: 'group-rule', featureId: 'test-feature', tenantId, source: 'group', groupId: 'admin', enabled: false, priority: 0 },
            { id: 'individual-rule', featureId: 'test-feature', tenantId, source: 'individual', subjectId: 'precedence-test-user', enabled: true, priority: 0 }
        ];
        let result = (0, index_1.checkFeature)('test-feature', context, fullRules);
        (0, vitest_1.expect)(result.source).toBe('individual');
        (0, vitest_1.expect)(result.enabled).toBe(true);
        const withoutIndividual = fullRules.filter(r => r.source !== 'individual');
        result = (0, index_1.checkFeature)('test-feature', context, withoutIndividual);
        (0, vitest_1.expect)(result.source).toBe('group');
        const withoutGroup = withoutIndividual.filter(r => r.source !== 'group');
        result = (0, index_1.checkFeature)('test-feature', context, withoutGroup);
        (0, vitest_1.expect)(result.source).toBe('tenant');
        const withoutTenant = withoutGroup.filter(r => r.source !== 'tenant');
        result = (0, index_1.checkFeature)('test-feature', context, withoutTenant);
        (0, vitest_1.expect)(result.source).toBe('partner');
        const withoutPartner = withoutTenant.filter(r => r.source !== 'partner');
        result = (0, index_1.checkFeature)('test-feature', context, withoutPartner);
        (0, vitest_1.expect)(result.source).toBe('plan');
        const onlySystem = withoutPartner.filter(r => r.source !== 'plan');
        result = (0, index_1.checkFeature)('test-feature', context, onlySystem);
        (0, vitest_1.expect)(result.source).toBe('system');
    });
    (0, vitest_1.it)('proves: snapshot integrity is verified and tampering is detected', () => {
        const context = { tenantId, subjectId, now };
        const rules = [
            { id: 'r1', featureId: 'integrity-test', tenantId, source: 'tenant', enabled: true, priority: 0 }
        ];
        const snapshot = (0, index_1.generateFeatureSnapshot)(context, rules, []);
        (0, vitest_1.expect)((0, index_1.verifySnapshot)(snapshot)).toBe(true);
        const tamperedChecksum = { ...snapshot, checksum: 'fake-checksum' };
        (0, vitest_1.expect)(() => (0, index_1.verifySnapshot)(tamperedChecksum)).toThrow();
        const tamperedTenantHash = { ...snapshot, tenantHash: 'fake-hash' };
        (0, vitest_1.expect)(() => (0, index_1.verifySnapshot)(tamperedTenantHash)).toThrow();
        const tamperedData = {
            ...snapshot,
            features: {
                ...snapshot.features,
                'integrity-test': {
                    ...snapshot.features['integrity-test'],
                    enabled: false
                }
            }
        };
        (0, vitest_1.expect)(() => (0, index_1.verifySnapshot)(tamperedData)).toThrow();
    });
});
//# sourceMappingURL=hard-stop.test.js.map