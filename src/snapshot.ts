import { randomUUID } from 'crypto';
import {
  EvaluationContext,
  FeatureRule,
  ExperimentDefinition,
  FeatureSnapshot,
  FeatureSnapshotEntry,
  ExperimentSnapshotEntry,
  FeatureEvaluationResult
} from './models';
import { checkFeature } from './feature-engine';
import { assignExperimentVariant } from './experiment-engine';
import { computeChecksum, computeTenantHash } from './hash';
import {
  TenantIsolationError,
  SnapshotVerificationError,
  SnapshotExpiredError
} from './errors';

interface SnapshotOptions {
  expiresInMs?: number;
}

const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000;

function getUniqueFeatureIds(rules: FeatureRule[]): string[] {
  return [...new Set(rules.map(r => r.featureId))];
}

export function generateFeatureSnapshot(
  context: EvaluationContext,
  rules: FeatureRule[],
  experiments: ExperimentDefinition[],
  options: SnapshotOptions = {}
): FeatureSnapshot {
  const now = context.now ?? new Date();
  const expiresInMs = options.expiresInMs ?? DEFAULT_EXPIRY_MS;
  
  const tenantRules = rules.filter(r => r.tenantId === context.tenantId);
  const tenantExperiments = experiments.filter(e => e.tenantId === context.tenantId);
  
  const features: Record<string, FeatureSnapshotEntry> = {};
  const featureIds = getUniqueFeatureIds(tenantRules);
  
  for (const featureId of featureIds) {
    const result = checkFeature(featureId, context, tenantRules);
    features[featureId] = {
      featureId: result.featureId,
      enabled: result.enabled,
      source: result.source,
      ruleId: result.ruleId,
      reason: result.reason
    };
  }
  
  const experimentsMap: Record<string, ExperimentSnapshotEntry> = {};
  
  for (const experiment of tenantExperiments) {
    const assignment = assignExperimentVariant(experiment, context);
    experimentsMap[experiment.id] = {
      experimentId: assignment.experimentId,
      variantId: assignment.variantId,
      variantName: assignment.variantName,
      bucket: assignment.bucket
    };
  }
  
  const snapshotData = {
    tenantId: context.tenantId,
    subjectId: context.subjectId,
    features,
    experiments: experimentsMap,
    generatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + expiresInMs).toISOString()
  };
  
  const checksum = computeChecksum(snapshotData);
  const tenantHash = computeTenantHash(context.tenantId);
  
  return {
    id: randomUUID(),
    tenantId: context.tenantId,
    tenantHash,
    subjectId: context.subjectId,
    features,
    experiments: experimentsMap,
    generatedAt: now,
    expiresAt: new Date(now.getTime() + expiresInMs),
    checksum
  };
}

export function verifySnapshot(snapshot: FeatureSnapshot): boolean {
  const snapshotData = {
    tenantId: snapshot.tenantId,
    subjectId: snapshot.subjectId,
    features: snapshot.features,
    experiments: snapshot.experiments,
    generatedAt: snapshot.generatedAt.toISOString(),
    expiresAt: snapshot.expiresAt.toISOString()
  };
  
  const expectedChecksum = computeChecksum(snapshotData);
  const expectedTenantHash = computeTenantHash(snapshot.tenantId);
  
  if (snapshot.checksum !== expectedChecksum) {
    throw new SnapshotVerificationError('Snapshot checksum mismatch - data may have been tampered with');
  }
  
  if (snapshot.tenantHash !== expectedTenantHash) {
    throw new SnapshotVerificationError('Snapshot tenant hash mismatch - tenant isolation violated');
  }
  
  return true;
}

export function evaluateFromSnapshot(
  featureId: string,
  snapshot: FeatureSnapshot,
  now: Date = new Date(),
  contextTenantId?: string
): FeatureEvaluationResult {
  if (contextTenantId && contextTenantId !== snapshot.tenantId) {
    throw new TenantIsolationError(
      `Cannot evaluate snapshot for tenant ${snapshot.tenantId} with context tenant ${contextTenantId}`
    );
  }
  
  verifySnapshot(snapshot);
  
  if (now > snapshot.expiresAt) {
    throw new SnapshotExpiredError(
      `Snapshot expired at ${snapshot.expiresAt.toISOString()}, current time is ${now.toISOString()}`
    );
  }
  
  const entry = snapshot.features[featureId];
  
  if (!entry) {
    return {
      featureId,
      enabled: false,
      source: 'system',
      reason: 'Feature not found in snapshot, defaulting to disabled',
      evaluatedAt: now
    };
  }
  
  return {
    featureId: entry.featureId,
    enabled: entry.enabled,
    source: entry.source,
    ruleId: entry.ruleId,
    reason: `${entry.reason} (from verified snapshot)`,
    evaluatedAt: now
  };
}
