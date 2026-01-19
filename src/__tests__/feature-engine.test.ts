import { describe, it, expect, beforeEach } from 'vitest';
import { checkFeature } from '../feature-engine';
import { FeatureRule, EvaluationContext, RuleSource } from '../models';
import { TenantIsolationError } from '../errors';

describe('Feature Flag Evaluation Engine', () => {
  const tenantId = 'tenant-123';
  const subjectId = 'user-456';
  const featureId = 'feature-premium';
  const now = new Date('2025-01-01T12:00:00Z');

  const baseContext: EvaluationContext = {
    tenantId,
    subjectId,
    now
  };

  describe('Precedence Hierarchy', () => {
    it('should respect individual override as highest priority', () => {
      const rules: FeatureRule[] = [
        { id: 'r1', featureId, tenantId, source: 'system', enabled: false, priority: 0 },
        { id: 'r2', featureId, tenantId, source: 'tenant', enabled: false, priority: 0 },
        { id: 'r3', featureId, tenantId, source: 'individual', enabled: true, subjectId, priority: 0 }
      ];

      const result = checkFeature(featureId, baseContext, rules);
      expect(result.enabled).toBe(true);
      expect(result.source).toBe('individual');
      expect(result.ruleId).toBe('r3');
    });

    it('should respect group override over tenant-level rules', () => {
      const context: EvaluationContext = {
        ...baseContext,
        groupIds: ['admin-group']
      };
      const rules: FeatureRule[] = [
        { id: 'r1', featureId, tenantId, source: 'tenant', enabled: false, priority: 0 },
        { id: 'r2', featureId, tenantId, source: 'group', enabled: true, groupId: 'admin-group', priority: 0 }
      ];

      const result = checkFeature(featureId, context, rules);
      expect(result.enabled).toBe(true);
      expect(result.source).toBe('group');
    });

    it('should respect tenant-level over partner-level rules', () => {
      const context: EvaluationContext = {
        ...baseContext,
        partnerId: 'partner-1'
      };
      const rules: FeatureRule[] = [
        { id: 'r1', featureId, tenantId, source: 'partner', enabled: true, partnerId: 'partner-1', priority: 0 },
        { id: 'r2', featureId, tenantId, source: 'tenant', enabled: false, priority: 0 }
      ];

      const result = checkFeature(featureId, context, rules);
      expect(result.enabled).toBe(false);
      expect(result.source).toBe('tenant');
    });

    it('should respect partner-level over plan-level rules', () => {
      const context: EvaluationContext = {
        ...baseContext,
        partnerId: 'partner-1',
        planId: 'plan-pro'
      };
      const rules: FeatureRule[] = [
        { id: 'r1', featureId, tenantId, source: 'plan', enabled: false, planId: 'plan-pro', priority: 0 },
        { id: 'r2', featureId, tenantId, source: 'partner', enabled: true, partnerId: 'partner-1', priority: 0 }
      ];

      const result = checkFeature(featureId, context, rules);
      expect(result.enabled).toBe(true);
      expect(result.source).toBe('partner');
    });

    it('should respect plan-level over system defaults', () => {
      const context: EvaluationContext = {
        ...baseContext,
        planId: 'plan-enterprise'
      };
      const rules: FeatureRule[] = [
        { id: 'r1', featureId, tenantId, source: 'system', enabled: false, priority: 0 },
        { id: 'r2', featureId, tenantId, source: 'plan', enabled: true, planId: 'plan-enterprise', priority: 0 }
      ];

      const result = checkFeature(featureId, context, rules);
      expect(result.enabled).toBe(true);
      expect(result.source).toBe('plan');
    });

    it('should fall back to system default when no other rules match', () => {
      const rules: FeatureRule[] = [
        { id: 'r1', featureId, tenantId, source: 'system', enabled: true, priority: 0 }
      ];

      const result = checkFeature(featureId, baseContext, rules);
      expect(result.enabled).toBe(true);
      expect(result.source).toBe('system');
    });

    it('should return disabled when no rules match', () => {
      const rules: FeatureRule[] = [];
      const result = checkFeature(featureId, baseContext, rules);
      expect(result.enabled).toBe(false);
      expect(result.source).toBe('system');
      expect(result.reason).toContain('No matching rules found');
    });

    it('should enforce full precedence hierarchy in correct order', () => {
      const context: EvaluationContext = {
        tenantId,
        subjectId,
        groupIds: ['group-1'],
        partnerId: 'partner-1',
        planId: 'plan-1',
        now
      };

      const sources: RuleSource[] = ['system', 'plan', 'partner', 'tenant', 'group', 'individual'];
      
      for (let i = 0; i < sources.length; i++) {
        const rules: FeatureRule[] = sources.slice(0, i + 1).map((source, idx) => ({
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

        const result = checkFeature(featureId, context, rules);
        expect(result.source).toBe(sources[i]);
      }
    });
  });

  describe('Time-bound Rules', () => {
    it('should exclude rules that have not started yet', () => {
      const futureStart = new Date('2025-06-01T00:00:00Z');
      const rules: FeatureRule[] = [
        { id: 'r1', featureId, tenantId, source: 'tenant', enabled: true, priority: 0, timeWindow: { startsAt: futureStart } },
        { id: 'r2', featureId, tenantId, source: 'system', enabled: false, priority: 0 }
      ];

      const result = checkFeature(featureId, baseContext, rules);
      expect(result.enabled).toBe(false);
      expect(result.source).toBe('system');
    });

    it('should exclude rules that have expired', () => {
      const pastEnd = new Date('2024-12-01T00:00:00Z');
      const rules: FeatureRule[] = [
        { id: 'r1', featureId, tenantId, source: 'tenant', enabled: true, priority: 0, timeWindow: { endsAt: pastEnd } },
        { id: 'r2', featureId, tenantId, source: 'system', enabled: false, priority: 0 }
      ];

      const result = checkFeature(featureId, baseContext, rules);
      expect(result.enabled).toBe(false);
      expect(result.source).toBe('system');
    });

    it('should include rules within valid time window', () => {
      const validWindow = {
        startsAt: new Date('2024-12-01T00:00:00Z'),
        endsAt: new Date('2025-06-01T00:00:00Z')
      };
      const rules: FeatureRule[] = [
        { id: 'r1', featureId, tenantId, source: 'tenant', enabled: true, priority: 0, timeWindow: validWindow }
      ];

      const result = checkFeature(featureId, baseContext, rules);
      expect(result.enabled).toBe(true);
    });
  });

  describe('Tenant Isolation', () => {
    it('should throw TenantIsolationError when rule tenant does not match context', () => {
      const rules: FeatureRule[] = [
        { id: 'r1', featureId, tenantId: 'other-tenant', source: 'system', enabled: true, priority: 0 }
      ];

      expect(() => checkFeature(featureId, baseContext, rules)).toThrow(TenantIsolationError);
    });

    it('should only evaluate rules for the correct tenant', () => {
      const rules: FeatureRule[] = [
        { id: 'r1', featureId, tenantId, source: 'system', enabled: true, priority: 0 }
      ];

      const result = checkFeature(featureId, baseContext, rules);
      expect(result.enabled).toBe(true);
    });
  });

  describe('Determinism', () => {
    it('should return identical results for identical inputs (10x)', () => {
      const rules: FeatureRule[] = [
        { id: 'r1', featureId, tenantId, source: 'tenant', enabled: true, priority: 0 }
      ];

      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(checkFeature(featureId, baseContext, rules));
      }

      const first = results[0];
      for (const result of results) {
        expect(result.enabled).toBe(first.enabled);
        expect(result.source).toBe(first.source);
        expect(result.ruleId).toBe(first.ruleId);
        expect(result.reason).toBe(first.reason);
      }
    });
  });

  describe('Explainability', () => {
    it('should provide reason and source in result', () => {
      const rules: FeatureRule[] = [
        { id: 'r1', featureId, tenantId, source: 'individual', enabled: true, subjectId, priority: 0 }
      ];

      const result = checkFeature(featureId, baseContext, rules);
      expect(result.reason).toBeDefined();
      expect(result.reason.length).toBeGreaterThan(0);
      expect(result.source).toBe('individual');
      expect(result.ruleId).toBe('r1');
    });
  });
});
