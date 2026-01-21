"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFeatureSnapshot = generateFeatureSnapshot;
exports.verifySnapshot = verifySnapshot;
exports.evaluateFromSnapshot = evaluateFromSnapshot;
const crypto_1 = require("crypto");
const feature_engine_1 = require("./feature-engine");
const experiment_engine_1 = require("./experiment-engine");
const hash_1 = require("./hash");
const errors_1 = require("./errors");
const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000;
function getUniqueFeatureIds(rules) {
    return [...new Set(rules.map(r => r.featureId))];
}
function generateFeatureSnapshot(context, rules, experiments, options = {}) {
    const now = context.now ?? new Date();
    const expiresInMs = options.expiresInMs ?? DEFAULT_EXPIRY_MS;
    const tenantRules = rules.filter(r => r.tenantId === context.tenantId);
    const tenantExperiments = experiments.filter(e => e.tenantId === context.tenantId);
    const features = {};
    const featureIds = getUniqueFeatureIds(tenantRules);
    for (const featureId of featureIds) {
        const result = (0, feature_engine_1.checkFeature)(featureId, context, tenantRules);
        features[featureId] = {
            featureId: result.featureId,
            enabled: result.enabled,
            source: result.source,
            ruleId: result.ruleId,
            reason: result.reason
        };
    }
    const experimentsMap = {};
    for (const experiment of tenantExperiments) {
        const assignment = (0, experiment_engine_1.assignExperimentVariant)(experiment, context);
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
    const checksum = (0, hash_1.computeChecksum)(snapshotData);
    const tenantHash = (0, hash_1.computeTenantHash)(context.tenantId);
    return {
        id: (0, crypto_1.randomUUID)(),
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
function verifySnapshot(snapshot) {
    const snapshotData = {
        tenantId: snapshot.tenantId,
        subjectId: snapshot.subjectId,
        features: snapshot.features,
        experiments: snapshot.experiments,
        generatedAt: snapshot.generatedAt.toISOString(),
        expiresAt: snapshot.expiresAt.toISOString()
    };
    const expectedChecksum = (0, hash_1.computeChecksum)(snapshotData);
    const expectedTenantHash = (0, hash_1.computeTenantHash)(snapshot.tenantId);
    if (snapshot.checksum !== expectedChecksum) {
        throw new errors_1.SnapshotVerificationError('Snapshot checksum mismatch - data may have been tampered with');
    }
    if (snapshot.tenantHash !== expectedTenantHash) {
        throw new errors_1.SnapshotVerificationError('Snapshot tenant hash mismatch - tenant isolation violated');
    }
    return true;
}
function evaluateFromSnapshot(featureId, snapshot, now = new Date(), contextTenantId) {
    if (contextTenantId && contextTenantId !== snapshot.tenantId) {
        throw new errors_1.TenantIsolationError(`Cannot evaluate snapshot for tenant ${snapshot.tenantId} with context tenant ${contextTenantId}`);
    }
    verifySnapshot(snapshot);
    if (now > snapshot.expiresAt) {
        throw new errors_1.SnapshotExpiredError(`Snapshot expired at ${snapshot.expiresAt.toISOString()}, current time is ${now.toISOString()}`);
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
//# sourceMappingURL=snapshot.js.map