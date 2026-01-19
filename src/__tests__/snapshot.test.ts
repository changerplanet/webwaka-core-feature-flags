import { describe, it, expect } from 'vitest';
import {
  generateFeatureSnapshot,
  verifySnapshot,
  evaluateFromSnapshot
} from '../snapshot';
import { FeatureRule, ExperimentDefinition, EvaluationContext, FeatureSnapshot } from '../models';
import {
  TenantIsolationError,
  SnapshotVerificationError,
  SnapshotExpiredError
} from '../errors';

describe('Snapshot System', () => {
  const tenantId = 'tenant-123';
  const subjectId = 'user-456';
  const featureId = 'feature-premium';
  const now = new Date('2025-01-01T12:00:00Z');

  const baseContext: EvaluationContext = {
    tenantId,
    subjectId,
    now
  };

  const baseRules: FeatureRule[] = [
    { id: 'r1', featureId, tenantId, source: 'tenant', enabled: true, priority: 0 },
    { id: 'r2', featureId: 'feature-beta', tenantId, source: 'system', enabled: false, priority: 0 }
  ];

  const baseExperiments: ExperimentDefinition[] = [
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

  describe('generateFeatureSnapshot', () => {
    it('should generate a valid snapshot with all features evaluated', () => {
      const snapshot = generateFeatureSnapshot(baseContext, baseRules, baseExperiments);

      expect(snapshot.tenantId).toBe(tenantId);
      expect(snapshot.subjectId).toBe(subjectId);
      expect(snapshot.features[featureId]).toBeDefined();
      expect(snapshot.features['feature-beta']).toBeDefined();
      expect(snapshot.checksum).toBeDefined();
      expect(snapshot.tenantHash).toBeDefined();
    });

    it('should include experiment assignments in snapshot', () => {
      const snapshot = generateFeatureSnapshot(baseContext, baseRules, baseExperiments);

      expect(snapshot.experiments['exp-1']).toBeDefined();
      expect(snapshot.experiments['exp-1'].variantId).toBeDefined();
    });

    it('should set expiry based on options', () => {
      const expiresInMs = 60 * 60 * 1000;
      const snapshot = generateFeatureSnapshot(baseContext, baseRules, baseExperiments, { expiresInMs });

      const expectedExpiry = new Date(now.getTime() + expiresInMs);
      expect(snapshot.expiresAt.getTime()).toBe(expectedExpiry.getTime());
    });

    it('should only include rules for the context tenant', () => {
      const mixedRules: FeatureRule[] = [
        ...baseRules,
        { id: 'r3', featureId: 'other-feature', tenantId: 'other-tenant', source: 'system', enabled: true, priority: 0 }
      ];

      const snapshot = generateFeatureSnapshot(baseContext, mixedRules, baseExperiments);
      expect(snapshot.features['other-feature']).toBeUndefined();
    });

    it('should be deterministic - same inputs produce same snapshot content', () => {
      const snapshot1 = generateFeatureSnapshot(baseContext, baseRules, baseExperiments);
      const snapshot2 = generateFeatureSnapshot(baseContext, baseRules, baseExperiments);

      expect(snapshot1.features[featureId].enabled).toBe(snapshot2.features[featureId].enabled);
      expect(snapshot1.experiments['exp-1'].variantId).toBe(snapshot2.experiments['exp-1'].variantId);
      expect(snapshot1.checksum).toBe(snapshot2.checksum);
    });
  });

  describe('verifySnapshot', () => {
    it('should return true for valid snapshot', () => {
      const snapshot = generateFeatureSnapshot(baseContext, baseRules, baseExperiments);
      expect(verifySnapshot(snapshot)).toBe(true);
    });

    it('should throw SnapshotVerificationError when checksum is tampered', () => {
      const snapshot = generateFeatureSnapshot(baseContext, baseRules, baseExperiments);
      const tamperedSnapshot: FeatureSnapshot = {
        ...snapshot,
        checksum: 'tampered-checksum'
      };

      expect(() => verifySnapshot(tamperedSnapshot)).toThrow(SnapshotVerificationError);
    });

    it('should throw SnapshotVerificationError when tenant hash is tampered', () => {
      const snapshot = generateFeatureSnapshot(baseContext, baseRules, baseExperiments);
      const tamperedSnapshot: FeatureSnapshot = {
        ...snapshot,
        tenantHash: 'tampered-hash'
      };

      expect(() => verifySnapshot(tamperedSnapshot)).toThrow(SnapshotVerificationError);
    });

    it('should detect data tampering', () => {
      const snapshot = generateFeatureSnapshot(baseContext, baseRules, baseExperiments);
      const tamperedSnapshot: FeatureSnapshot = {
        ...snapshot,
        features: {
          ...snapshot.features,
          [featureId]: {
            ...snapshot.features[featureId],
            enabled: !snapshot.features[featureId].enabled
          }
        }
      };

      expect(() => verifySnapshot(tamperedSnapshot)).toThrow(SnapshotVerificationError);
    });
  });

  describe('evaluateFromSnapshot', () => {
    it('should return correct feature evaluation from valid snapshot', () => {
      const snapshot = generateFeatureSnapshot(baseContext, baseRules, baseExperiments);
      const result = evaluateFromSnapshot(featureId, snapshot, now);

      expect(result.featureId).toBe(featureId);
      expect(result.enabled).toBe(true);
      expect(result.reason).toContain('from verified snapshot');
    });

    it('should throw SnapshotExpiredError when snapshot is expired', () => {
      const snapshot = generateFeatureSnapshot(baseContext, baseRules, baseExperiments, {
        expiresInMs: 1000
      });
      const futureTime = new Date(now.getTime() + 2000);

      expect(() => evaluateFromSnapshot(featureId, snapshot, futureTime)).toThrow(SnapshotExpiredError);
    });

    it('should throw TenantIsolationError when context tenant does not match', () => {
      const snapshot = generateFeatureSnapshot(baseContext, baseRules, baseExperiments);

      expect(() => evaluateFromSnapshot(featureId, snapshot, now, 'other-tenant')).toThrow(TenantIsolationError);
    });

    it('should return disabled for feature not in snapshot', () => {
      const snapshot = generateFeatureSnapshot(baseContext, baseRules, baseExperiments);
      const result = evaluateFromSnapshot('non-existent-feature', snapshot, now);

      expect(result.enabled).toBe(false);
      expect(result.reason).toContain('not found in snapshot');
    });

    it('should verify snapshot integrity before evaluation', () => {
      const snapshot = generateFeatureSnapshot(baseContext, baseRules, baseExperiments);
      const tamperedSnapshot: FeatureSnapshot = {
        ...snapshot,
        checksum: 'tampered'
      };

      expect(() => evaluateFromSnapshot(featureId, tamperedSnapshot, now)).toThrow(SnapshotVerificationError);
    });

    it('should be usable offline with pre-generated snapshot', () => {
      const snapshot = generateFeatureSnapshot(baseContext, baseRules, baseExperiments, {
        expiresInMs: 24 * 60 * 60 * 1000
      });

      const laterTime = new Date(now.getTime() + 60 * 60 * 1000);
      const result = evaluateFromSnapshot(featureId, snapshot, laterTime);

      expect(result.enabled).toBe(true);
      expect(result.evaluatedAt.getTime()).toBe(laterTime.getTime());
    });
  });
});
