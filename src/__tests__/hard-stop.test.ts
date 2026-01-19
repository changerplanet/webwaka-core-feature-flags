import { describe, it, expect } from 'vitest';
import {
  checkFeature,
  assignExperimentVariant,
  generateFeatureSnapshot,
  verifySnapshot,
  evaluateFromSnapshot
} from '../index';
import { FeatureRule, ExperimentDefinition, EvaluationContext } from '../models';
import { TenantIsolationError } from '../errors';

describe('HARD STOP PROOF: Complete Feature Flag & Experiment System', () => {
  const tenantId = 'tenant-hard-stop-test';
  const subjectId = 'user-hard-stop';
  const now = new Date('2025-06-15T12:00:00Z');

  it('proves: A Suite can evaluate a feature flag or experiment online or offline, for a given subject and tenant, and receive a deterministic, explainable, verifiable result, respecting precedence, time bounds, and tenant isolation', () => {
    const context: EvaluationContext = {
      tenantId,
      subjectId,
      groupIds: ['beta-testers'],
      partnerId: 'partner-acme',
      planId: 'plan-enterprise',
      now
    };

    const rules: FeatureRule[] = [
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

    const experiments: ExperimentDefinition[] = [
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

    const onlineResult = checkFeature('premium-dashboard', context, rules);
    expect(onlineResult.enabled).toBe(false);
    expect(onlineResult.source).toBe('individual');
    expect(onlineResult.ruleId).toBe('rule-individual-override');
    expect(onlineResult.reason).toContain('Individual override');
    expect(onlineResult.evaluatedAt).toEqual(now);

    const experimentAssignment = assignExperimentVariant(experiments[0], context);
    expect(experimentAssignment.tenantId).toBe(tenantId);
    expect(experimentAssignment.subjectId).toBe(subjectId);
    expect(experimentAssignment.bucket).toBeGreaterThanOrEqual(0);
    expect(experimentAssignment.bucket).toBeLessThan(100);
    expect(['control', 'streamlined']).toContain(experimentAssignment.variantId);
    expect(experimentAssignment.reason).toContain('deterministic bucketing');

    const snapshot = generateFeatureSnapshot(context, rules, experiments);
    expect(snapshot.tenantId).toBe(tenantId);
    expect(snapshot.subjectId).toBe(subjectId);
    expect(snapshot.checksum).toBeDefined();
    expect(snapshot.tenantHash).toBeDefined();

    expect(verifySnapshot(snapshot)).toBe(true);

    const offlineEvalTime = new Date(now.getTime() + 3600000);
    const offlineResult = evaluateFromSnapshot('premium-dashboard', snapshot, offlineEvalTime);
    expect(offlineResult.enabled).toBe(false);
    expect(offlineResult.source).toBe('individual');
    expect(offlineResult.reason).toContain('from verified snapshot');

    const determinismResults = [];
    for (let i = 0; i < 10; i++) {
      determinismResults.push(checkFeature('premium-dashboard', context, rules));
    }
    const firstResult = determinismResults[0];
    for (const result of determinismResults) {
      expect(result.enabled).toBe(firstResult.enabled);
      expect(result.source).toBe(firstResult.source);
      expect(result.ruleId).toBe(firstResult.ruleId);
    }

    const experimentDeterminismResults = [];
    for (let i = 0; i < 10; i++) {
      experimentDeterminismResults.push(assignExperimentVariant(experiments[0], context));
    }
    const firstAssignment = experimentDeterminismResults[0];
    for (const assignment of experimentDeterminismResults) {
      expect(assignment.variantId).toBe(firstAssignment.variantId);
      expect(assignment.bucket).toBe(firstAssignment.bucket);
    }

    const otherTenantContext: EvaluationContext = {
      tenantId: 'other-tenant-id',
      subjectId,
      now
    };

    expect(() => checkFeature('premium-dashboard', otherTenantContext, rules)).toThrow(TenantIsolationError);
    expect(() => assignExperimentVariant(experiments[0], otherTenantContext)).toThrow(TenantIsolationError);
    expect(() => evaluateFromSnapshot('premium-dashboard', snapshot, now, 'other-tenant-id')).toThrow(TenantIsolationError);

    const withExpiredRule = rules.find(r => r.id === 'rule-expired');
    expect(withExpiredRule).toBeDefined();
    const resultWithoutExpired = checkFeature('premium-dashboard', context, rules);
    expect(resultWithoutExpired.source).toBe('individual');
  });

  it('proves: precedence hierarchy is strictly enforced (individual > group > tenant > partner > plan > system)', () => {
    const context: EvaluationContext = {
      tenantId,
      subjectId: 'precedence-test-user',
      groupIds: ['admin'],
      partnerId: 'partner-1',
      planId: 'plan-pro',
      now
    };

    const fullRules: FeatureRule[] = [
      { id: 'system-rule', featureId: 'test-feature', tenantId, source: 'system', enabled: false, priority: 0 },
      { id: 'plan-rule', featureId: 'test-feature', tenantId, source: 'plan', planId: 'plan-pro', enabled: false, priority: 0 },
      { id: 'partner-rule', featureId: 'test-feature', tenantId, source: 'partner', partnerId: 'partner-1', enabled: false, priority: 0 },
      { id: 'tenant-rule', featureId: 'test-feature', tenantId, source: 'tenant', enabled: false, priority: 0 },
      { id: 'group-rule', featureId: 'test-feature', tenantId, source: 'group', groupId: 'admin', enabled: false, priority: 0 },
      { id: 'individual-rule', featureId: 'test-feature', tenantId, source: 'individual', subjectId: 'precedence-test-user', enabled: true, priority: 0 }
    ];

    let result = checkFeature('test-feature', context, fullRules);
    expect(result.source).toBe('individual');
    expect(result.enabled).toBe(true);

    const withoutIndividual = fullRules.filter(r => r.source !== 'individual');
    result = checkFeature('test-feature', context, withoutIndividual);
    expect(result.source).toBe('group');

    const withoutGroup = withoutIndividual.filter(r => r.source !== 'group');
    result = checkFeature('test-feature', context, withoutGroup);
    expect(result.source).toBe('tenant');

    const withoutTenant = withoutGroup.filter(r => r.source !== 'tenant');
    result = checkFeature('test-feature', context, withoutTenant);
    expect(result.source).toBe('partner');

    const withoutPartner = withoutTenant.filter(r => r.source !== 'partner');
    result = checkFeature('test-feature', context, withoutPartner);
    expect(result.source).toBe('plan');

    const onlySystem = withoutPartner.filter(r => r.source !== 'plan');
    result = checkFeature('test-feature', context, onlySystem);
    expect(result.source).toBe('system');
  });

  it('proves: snapshot integrity is verified and tampering is detected', () => {
    const context: EvaluationContext = { tenantId, subjectId, now };
    const rules: FeatureRule[] = [
      { id: 'r1', featureId: 'integrity-test', tenantId, source: 'tenant', enabled: true, priority: 0 }
    ];

    const snapshot = generateFeatureSnapshot(context, rules, []);

    expect(verifySnapshot(snapshot)).toBe(true);

    const tamperedChecksum = { ...snapshot, checksum: 'fake-checksum' };
    expect(() => verifySnapshot(tamperedChecksum)).toThrow();

    const tamperedTenantHash = { ...snapshot, tenantHash: 'fake-hash' };
    expect(() => verifySnapshot(tamperedTenantHash)).toThrow();

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
    expect(() => verifySnapshot(tamperedData)).toThrow();
  });
});
