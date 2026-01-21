"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureSnapshotSchema = exports.ExperimentSnapshotEntrySchema = exports.FeatureSnapshotEntrySchema = exports.ExperimentAssignmentSchema = exports.FeatureEvaluationResultSchema = exports.EvaluationContextSchema = exports.ExperimentDefinitionSchema = exports.ExperimentVariantSchema = exports.FeatureFlagDefinitionSchema = exports.FeatureRuleSchema = exports.TimeWindowSchema = exports.PRECEDENCE_ORDER = exports.RuleSourceSchema = void 0;
const zod_1 = require("zod");
exports.RuleSourceSchema = zod_1.z.enum([
    'individual',
    'group',
    'tenant',
    'partner',
    'plan',
    'system'
]);
exports.PRECEDENCE_ORDER = [
    'individual',
    'group',
    'tenant',
    'partner',
    'plan',
    'system'
];
exports.TimeWindowSchema = zod_1.z.object({
    startsAt: zod_1.z.date().optional(),
    endsAt: zod_1.z.date().optional()
}).check((ctx) => {
    const { startsAt, endsAt } = ctx.value;
    if (startsAt && endsAt && startsAt >= endsAt) {
        ctx.issues.push({
            code: 'custom',
            input: ctx.value,
            message: 'startsAt must be before endsAt',
            path: ['startsAt']
        });
    }
});
exports.FeatureRuleSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    featureId: zod_1.z.string().min(1),
    tenantId: zod_1.z.string().min(1),
    source: exports.RuleSourceSchema,
    enabled: zod_1.z.boolean(),
    subjectId: zod_1.z.string().optional(),
    groupId: zod_1.z.string().optional(),
    partnerId: zod_1.z.string().optional(),
    planId: zod_1.z.string().optional(),
    timeWindow: exports.TimeWindowSchema.optional(),
    priority: zod_1.z.number().int().min(0).default(0)
});
exports.FeatureFlagDefinitionSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    tenantId: zod_1.z.string().min(1),
    defaultEnabled: zod_1.z.boolean().default(false),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.ExperimentVariantSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    trafficAllocation: zod_1.z.number().min(0).max(100)
});
exports.ExperimentDefinitionSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    tenantId: zod_1.z.string().min(1),
    salt: zod_1.z.string().min(1),
    variants: zod_1.z.array(exports.ExperimentVariantSchema).min(1),
    enabled: zod_1.z.boolean().default(true),
    timeWindow: exports.TimeWindowSchema.optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
}).check((ctx) => {
    const total = ctx.value.variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
    if (total !== 100) {
        ctx.issues.push({
            code: 'custom',
            input: ctx.value,
            message: 'Variant traffic allocations must sum to 100',
            path: ['variants']
        });
    }
});
exports.EvaluationContextSchema = zod_1.z.object({
    tenantId: zod_1.z.string().min(1),
    subjectId: zod_1.z.string().min(1),
    groupIds: zod_1.z.array(zod_1.z.string()).optional(),
    partnerId: zod_1.z.string().optional(),
    planId: zod_1.z.string().optional(),
    attributes: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    now: zod_1.z.date().optional()
});
exports.FeatureEvaluationResultSchema = zod_1.z.object({
    featureId: zod_1.z.string(),
    enabled: zod_1.z.boolean(),
    source: exports.RuleSourceSchema,
    ruleId: zod_1.z.string().optional(),
    reason: zod_1.z.string(),
    evaluatedAt: zod_1.z.date()
});
exports.ExperimentAssignmentSchema = zod_1.z.object({
    experimentId: zod_1.z.string(),
    variantId: zod_1.z.string(),
    variantName: zod_1.z.string(),
    bucket: zod_1.z.number().int().min(-1).max(99),
    tenantId: zod_1.z.string(),
    subjectId: zod_1.z.string(),
    assignedAt: zod_1.z.date(),
    reason: zod_1.z.string()
});
exports.FeatureSnapshotEntrySchema = zod_1.z.object({
    featureId: zod_1.z.string(),
    enabled: zod_1.z.boolean(),
    source: exports.RuleSourceSchema,
    ruleId: zod_1.z.string().optional(),
    reason: zod_1.z.string()
});
exports.ExperimentSnapshotEntrySchema = zod_1.z.object({
    experimentId: zod_1.z.string(),
    variantId: zod_1.z.string(),
    variantName: zod_1.z.string(),
    bucket: zod_1.z.number()
});
exports.FeatureSnapshotSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    tenantId: zod_1.z.string().min(1),
    tenantHash: zod_1.z.string().min(1),
    subjectId: zod_1.z.string().min(1),
    features: zod_1.z.record(zod_1.z.string(), exports.FeatureSnapshotEntrySchema),
    experiments: zod_1.z.record(zod_1.z.string(), exports.ExperimentSnapshotEntrySchema),
    generatedAt: zod_1.z.date(),
    expiresAt: zod_1.z.date(),
    checksum: zod_1.z.string().min(1)
}).check((ctx) => {
    if (ctx.value.generatedAt >= ctx.value.expiresAt) {
        ctx.issues.push({
            code: 'custom',
            input: ctx.value,
            message: 'generatedAt must be before expiresAt',
            path: ['generatedAt']
        });
    }
});
//# sourceMappingURL=models.js.map