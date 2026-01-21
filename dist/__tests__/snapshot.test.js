"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const snapshot_1 = require("../snapshot");
const errors_1 = require("../errors");
(0, vitest_1.describe)('Snapshot System', () => {
    const tenantId = 'tenant-123';
    const subjectId = 'user-456';
    const featureId = 'feature-premium';
    const now = new Date('2025-01-01T12:00:00Z');
    const baseContext = {
        tenantId,
        subjectId,
        now
    };
    const baseRules = [
        { id: 'r1', featureId, tenantId, source: 'tenant', enabled: true, priority: 0 },
        { id: 'r2', featureId: 'feature-beta', tenantId, source: 'system', enabled: false, priority: 0 }
    ];
    const baseExperiments = [
        {
            id: 'exp-1',
            name: 'Test Experiment',
            tenantId,
            salt: 'salt-1',
            variants: [
                { id: 'control', name: 'Control', trafficAllocation: 50 },
                { id: 'treatment', name: 'Treatment', trafficAllocation: 50 }
            ],
            enabled: true,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
        }
    ];
    (0, vitest_1.describe)('generateFeatureSnapshot', () => {
        (0, vitest_1.it)('should generate a valid snapshot with all features evaluated', () => {
            const snapshot = (0, snapshot_1.generateFeatureSnapshot)(baseContext, baseRules, baseExperiments);
            (0, vitest_1.expect)(snapshot.tenantId).toBe(tenantId);
            (0, vitest_1.expect)(snapshot.subjectId).toBe(subjectId);
            (0, vitest_1.expect)(snapshot.features[featureId]).toBeDefined();
            (0, vitest_1.expect)(snapshot.features['feature-beta']).toBeDefined();
            (0, vitest_1.expect)(snapshot.checksum).toBeDefined();
            (0, vitest_1.expect)(snapshot.tenantHash).toBeDefined();
        });
        (0, vitest_1.it)('should include experiment assignments in snapshot', () => {
            const snapshot = (0, snapshot_1.generateFeatureSnapshot)(baseContext, baseRules, baseExperiments);
            (0, vitest_1.expect)(snapshot.experiments['exp-1']).toBeDefined();
            (0, vitest_1.expect)(snapshot.experiments['exp-1'].variantId).toBeDefined();
        });
        (0, vitest_1.it)('should set expiry based on options', () => {
            const expiresInMs = 60 * 60 * 1000;
            const snapshot = (0, snapshot_1.generateFeatureSnapshot)(baseContext, baseRules, baseExperiments, { expiresInMs });
            const expectedExpiry = new Date(now.getTime() + expiresInMs);
            (0, vitest_1.expect)(snapshot.expiresAt.getTime()).toBe(expectedExpiry.getTime());
        });
        (0, vitest_1.it)('should only include rules for the context tenant', () => {
            const mixedRules = [
                ...baseRules,
                { id: 'r3', featureId: 'other-feature', tenantId: 'other-tenant', source: 'system', enabled: true, priority: 0 }
            ];
            const snapshot = (0, snapshot_1.generateFeatureSnapshot)(baseContext, mixedRules, baseExperiments);
            (0, vitest_1.expect)(snapshot.features['other-feature']).toBeUndefined();
        });
        (0, vitest_1.it)('should be deterministic - same inputs produce same snapshot content', () => {
            const snapshot1 = (0, snapshot_1.generateFeatureSnapshot)(baseContext, baseRules, baseExperiments);
            const snapshot2 = (0, snapshot_1.generateFeatureSnapshot)(baseContext, baseRules, baseExperiments);
            (0, vitest_1.expect)(snapshot1.features[featureId].enabled).toBe(snapshot2.features[featureId].enabled);
            (0, vitest_1.expect)(snapshot1.experiments['exp-1'].variantId).toBe(snapshot2.experiments['exp-1'].variantId);
            (0, vitest_1.expect)(snapshot1.checksum).toBe(snapshot2.checksum);
        });
    });
    (0, vitest_1.describe)('verifySnapshot', () => {
        (0, vitest_1.it)('should return true for valid snapshot', () => {
            const snapshot = (0, snapshot_1.generateFeatureSnapshot)(baseContext, baseRules, baseExperiments);
            (0, vitest_1.expect)((0, snapshot_1.verifySnapshot)(snapshot)).toBe(true);
        });
        (0, vitest_1.it)('should throw SnapshotVerificationError when checksum is tampered', () => {
            const snapshot = (0, snapshot_1.generateFeatureSnapshot)(baseContext, baseRules, baseExperiments);
            const tamperedSnapshot = {
                ...snapshot,
                checksum: 'tampered-checksum'
            };
            (0, vitest_1.expect)(() => (0, snapshot_1.verifySnapshot)(tamperedSnapshot)).toThrow(errors_1.SnapshotVerificationError);
        });
        (0, vitest_1.it)('should throw SnapshotVerificationError when tenant hash is tampered', () => {
            const snapshot = (0, snapshot_1.generateFeatureSnapshot)(baseContext, baseRules, baseExperiments);
            const tamperedSnapshot = {
                ...snapshot,
                tenantHash: 'tampered-hash'
            };
            (0, vitest_1.expect)(() => (0, snapshot_1.verifySnapshot)(tamperedSnapshot)).toThrow(errors_1.SnapshotVerificationError);
        });
        (0, vitest_1.it)('should detect data tampering', () => {
            const snapshot = (0, snapshot_1.generateFeatureSnapshot)(baseContext, baseRules, baseExperiments);
            const tamperedSnapshot = {
                ...snapshot,
                features: {
                    ...snapshot.features,
                    [featureId]: {
                        ...snapshot.features[featureId],
                        enabled: !snapshot.features[featureId].enabled
                    }
                }
            };
            (0, vitest_1.expect)(() => (0, snapshot_1.verifySnapshot)(tamperedSnapshot)).toThrow(errors_1.SnapshotVerificationError);
        });
    });
    (0, vitest_1.describe)('evaluateFromSnapshot', () => {
        (0, vitest_1.it)('should return correct feature evaluation from valid snapshot', () => {
            const snapshot = (0, snapshot_1.generateFeatureSnapshot)(baseContext, baseRules, baseExperiments);
            const result = (0, snapshot_1.evaluateFromSnapshot)(featureId, snapshot, now);
            (0, vitest_1.expect)(result.featureId).toBe(featureId);
            (0, vitest_1.expect)(result.enabled).toBe(true);
            (0, vitest_1.expect)(result.reason).toContain('from verified snapshot');
        });
        (0, vitest_1.it)('should throw SnapshotExpiredError when snapshot is expired', () => {
            const snapshot = (0, snapshot_1.generateFeatureSnapshot)(baseContext, baseRules, baseExperiments, {
                expiresInMs: 1000
            });
            const futureTime = new Date(now.getTime() + 2000);
            (0, vitest_1.expect)(() => (0, snapshot_1.evaluateFromSnapshot)(featureId, snapshot, futureTime)).toThrow(errors_1.SnapshotExpiredError);
        });
        (0, vitest_1.it)('should throw TenantIsolationError when context tenant does not match', () => {
            const snapshot = (0, snapshot_1.generateFeatureSnapshot)(baseContext, baseRules, baseExperiments);
            (0, vitest_1.expect)(() => (0, snapshot_1.evaluateFromSnapshot)(featureId, snapshot, now, 'other-tenant')).toThrow(errors_1.TenantIsolationError);
        });
        (0, vitest_1.it)('should return disabled for feature not in snapshot', () => {
            const snapshot = (0, snapshot_1.generateFeatureSnapshot)(baseContext, baseRules, baseExperiments);
            const result = (0, snapshot_1.evaluateFromSnapshot)('non-existent-feature', snapshot, now);
            (0, vitest_1.expect)(result.enabled).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('not found in snapshot');
        });
        (0, vitest_1.it)('should verify snapshot integrity before evaluation', () => {
            const snapshot = (0, snapshot_1.generateFeatureSnapshot)(baseContext, baseRules, baseExperiments);
            const tamperedSnapshot = {
                ...snapshot,
                checksum: 'tampered'
            };
            (0, vitest_1.expect)(() => (0, snapshot_1.evaluateFromSnapshot)(featureId, tamperedSnapshot, now)).toThrow(errors_1.SnapshotVerificationError);
        });
        (0, vitest_1.it)('should be usable offline with pre-generated snapshot', () => {
            const snapshot = (0, snapshot_1.generateFeatureSnapshot)(baseContext, baseRules, baseExperiments, {
                expiresInMs: 24 * 60 * 60 * 1000
            });
            const laterTime = new Date(now.getTime() + 60 * 60 * 1000);
            const result = (0, snapshot_1.evaluateFromSnapshot)(featureId, snapshot, laterTime);
            (0, vitest_1.expect)(result.enabled).toBe(true);
            (0, vitest_1.expect)(result.evaluatedAt.getTime()).toBe(laterTime.getTime());
        });
    });
});
//# sourceMappingURL=snapshot.test.js.map