import {
  ExperimentDefinition,
  EvaluationContext,
  ExperimentAssignment,
  ExperimentVariant
} from './models';
import { computeBucket } from './hash';
import { TenantIsolationError } from './errors';

function isExperimentActive(experiment: ExperimentDefinition, now: Date): boolean {
  if (!experiment.enabled) return false;
  if (!experiment.timeWindow) return true;
  
  const { startsAt, endsAt } = experiment.timeWindow;
  
  if (startsAt && now < startsAt) return false;
  if (endsAt && now > endsAt) return false;
  
  return true;
}

function assignVariantFromBucket(
  bucket: number,
  variants: ExperimentVariant[]
): ExperimentVariant {
  let cumulative = 0;
  
  for (const variant of variants) {
    cumulative += variant.trafficAllocation;
    if (bucket < cumulative) {
      return variant;
    }
  }
  
  return variants[variants.length - 1];
}

export function assignExperimentVariant(
  experiment: ExperimentDefinition,
  context: EvaluationContext
): ExperimentAssignment {
  const now = context.now ?? new Date();
  
  if (experiment.tenantId !== context.tenantId) {
    throw new TenantIsolationError(
      `Experiment ${experiment.id} belongs to tenant ${experiment.tenantId}, but context is for tenant ${context.tenantId}`
    );
  }
  
  if (!isExperimentActive(experiment, now)) {
    const defaultVariant = experiment.variants[0];
    return {
      experimentId: experiment.id,
      variantId: defaultVariant.id,
      variantName: defaultVariant.name,
      bucket: -1,
      tenantId: context.tenantId,
      subjectId: context.subjectId,
      assignedAt: now,
      reason: 'Experiment not active, assigned to default variant'
    };
  }
  
  const bucket = computeBucket(
    experiment.id,
    context.subjectId,
    context.tenantId,
    experiment.salt
  );
  
  const variant = assignVariantFromBucket(bucket, experiment.variants);
  
  return {
    experimentId: experiment.id,
    variantId: variant.id,
    variantName: variant.name,
    bucket,
    tenantId: context.tenantId,
    subjectId: context.subjectId,
    assignedAt: now,
    reason: `Assigned via deterministic bucketing (bucket ${bucket})`
  };
}
