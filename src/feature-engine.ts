import {
  FeatureRule,
  EvaluationContext,
  FeatureEvaluationResult,
  RuleSource,
  PRECEDENCE_ORDER
} from './models';
import { TenantIsolationError } from './errors';

function isRuleActive(rule: FeatureRule, now: Date): boolean {
  if (!rule.timeWindow) return true;
  
  const { startsAt, endsAt } = rule.timeWindow;
  
  if (startsAt && now < startsAt) return false;
  if (endsAt && now > endsAt) return false;
  
  return true;
}

function matchesContext(rule: FeatureRule, context: EvaluationContext): boolean {
  if (rule.tenantId !== context.tenantId) {
    return false;
  }
  
  switch (rule.source) {
    case 'individual':
      return rule.subjectId === context.subjectId;
    
    case 'group':
      return !!(rule.groupId && context.groupIds?.includes(rule.groupId));
    
    case 'tenant':
      return true;
    
    case 'partner':
      return rule.partnerId === context.partnerId;
    
    case 'plan':
      return rule.planId === context.planId;
    
    case 'system':
      return true;
    
    default:
      return false;
  }
}

function getReasonForSource(source: RuleSource, rule: FeatureRule): string {
  switch (source) {
    case 'individual':
      return `Individual override for subject ${rule.subjectId}`;
    case 'group':
      return `Group override for group ${rule.groupId}`;
    case 'tenant':
      return `Tenant-level rule for tenant ${rule.tenantId}`;
    case 'partner':
      return `Partner-level rule for partner ${rule.partnerId}`;
    case 'plan':
      return `Plan-level rule for plan ${rule.planId}`;
    case 'system':
      return 'System default rule';
    default:
      return 'Unknown source';
  }
}

export function checkFeature(
  featureId: string,
  context: EvaluationContext,
  rules: FeatureRule[]
): FeatureEvaluationResult {
  const now = context.now ?? new Date();
  
  const relevantRules = rules.filter(rule => {
    if (rule.featureId !== featureId) return false;
    if (rule.tenantId !== context.tenantId) {
      throw new TenantIsolationError(
        `Rule ${rule.id} belongs to tenant ${rule.tenantId}, but context is for tenant ${context.tenantId}`
      );
    }
    return true;
  });
  
  for (const source of PRECEDENCE_ORDER) {
    const sourceRules = relevantRules
      .filter(r => r.source === source)
      .filter(r => isRuleActive(r, now))
      .filter(r => matchesContext(r, context))
      .sort((a, b) => b.priority - a.priority);
    
    if (sourceRules.length > 0) {
      const matchingRule = sourceRules[0];
      return {
        featureId,
        enabled: matchingRule.enabled,
        source: matchingRule.source,
        ruleId: matchingRule.id,
        reason: getReasonForSource(matchingRule.source, matchingRule),
        evaluatedAt: now
      };
    }
  }
  
  return {
    featureId,
    enabled: false,
    source: 'system',
    reason: 'No matching rules found, defaulting to disabled',
    evaluatedAt: now
  };
}
