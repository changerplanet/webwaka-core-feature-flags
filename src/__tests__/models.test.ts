import { describe, it, expect } from 'vitest';
import {
  TimeWindowSchema,
  FeatureRuleSchema,
  ExperimentDefinitionSchema,
  EvaluationContextSchema,
  FeatureSnapshotSchema,
  PRECEDENCE_ORDER
} from '../models';

describe('Domain Models', () => {
  describe('PRECEDENCE_ORDER', () => {
    it('should have correct precedence order', () => {
      expect(PRECEDENCE_ORDER).toEqual([
        'individual',
        'group',
        'tenant',
        'partner',
        'plan',
        'system'
      ]);
    });
  });

  describe('TimeWindowSchema', () => {
    it('should accept valid time window', () => {
      const result = TimeWindowSchema.safeParse({
        startsAt: new Date('2025-01-01'),
        endsAt: new Date('2025-12-31')
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid time window where startsAt >= endsAt', () => {
      const result = TimeWindowSchema.safeParse({
        startsAt: new Date('2025-12-31'),
        endsAt: new Date('2025-01-01')
      });
      expect(result.success).toBe(false);
    });

    it('should accept window with only startsAt', () => {
      const result = TimeWindowSchema.safeParse({
        startsAt: new Date('2025-01-01')
      });
      expect(result.success).toBe(true);
    });

    it('should accept window with only endsAt', () => {
      const result = TimeWindowSchema.safeParse({
        endsAt: new Date('2025-12-31')
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty window', () => {
      const result = TimeWindowSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('FeatureRuleSchema', () => {
    it('should require tenantId', () => {
      const result = FeatureRuleSchema.safeParse({
        id: 'rule-1',
        featureId: 'feature-1',
        source: 'system',
        enabled: true
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid rule', () => {
      const result = FeatureRuleSchema.safeParse({
        id: 'rule-1',
        featureId: 'feature-1',
        tenantId: 'tenant-1',
        source: 'system',
        enabled: true
      });
      expect(result.success).toBe(true);
    });

    it('should default priority to 0', () => {
      const result = FeatureRuleSchema.parse({
        id: 'rule-1',
        featureId: 'feature-1',
        tenantId: 'tenant-1',
        source: 'system',
        enabled: true
      });
      expect(result.priority).toBe(0);
    });
  });

  describe('ExperimentDefinitionSchema', () => {
    it('should require variants to sum to 100', () => {
      const result = ExperimentDefinitionSchema.safeParse({
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
      expect(result.success).toBe(false);
    });

    it('should accept valid experiment with variants summing to 100', () => {
      const result = ExperimentDefinitionSchema.safeParse({
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
      expect(result.success).toBe(true);
    });

    it('should require at least one variant', () => {
      const result = ExperimentDefinitionSchema.safeParse({
        id: 'exp-1',
        name: 'Test',
        tenantId: 'tenant-1',
        salt: 'salt',
        variants: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      expect(result.success).toBe(false);
    });
  });

  describe('EvaluationContextSchema', () => {
    it('should require tenantId and subjectId', () => {
      const result = EvaluationContextSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept minimal valid context', () => {
      const result = EvaluationContextSchema.safeParse({
        tenantId: 'tenant-1',
        subjectId: 'user-1'
      });
      expect(result.success).toBe(true);
    });

    it('should accept full context', () => {
      const result = EvaluationContextSchema.safeParse({
        tenantId: 'tenant-1',
        subjectId: 'user-1',
        groupIds: ['admin', 'beta'],
        partnerId: 'partner-1',
        planId: 'plan-pro',
        attributes: { role: 'admin' },
        now: new Date()
      });
      expect(result.success).toBe(true);
    });
  });

  describe('FeatureSnapshotSchema', () => {
    it('should require generatedAt before expiresAt', () => {
      const result = FeatureSnapshotSchema.safeParse({
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
      expect(result.success).toBe(false);
    });

    it('should accept valid snapshot', () => {
      const result = FeatureSnapshotSchema.safeParse({
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
      expect(result.success).toBe(true);
    });
  });
});
