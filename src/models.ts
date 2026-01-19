import { z } from 'zod';

export const RuleSourceSchema = z.enum([
  'individual',
  'group',
  'tenant',
  'partner',
  'plan',
  'system'
]);
export type RuleSource = z.infer<typeof RuleSourceSchema>;

export const PRECEDENCE_ORDER: RuleSource[] = [
  'individual',
  'group',
  'tenant',
  'partner',
  'plan',
  'system'
];

export const TimeWindowSchema = z.object({
  startsAt: z.date().optional(),
  endsAt: z.date().optional()
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
export type TimeWindow = z.infer<typeof TimeWindowSchema>;

export const FeatureRuleSchema = z.object({
  id: z.string().min(1),
  featureId: z.string().min(1),
  tenantId: z.string().min(1),
  source: RuleSourceSchema,
  enabled: z.boolean(),
  subjectId: z.string().optional(),
  groupId: z.string().optional(),
  partnerId: z.string().optional(),
  planId: z.string().optional(),
  timeWindow: TimeWindowSchema.optional(),
  priority: z.number().int().min(0).default(0)
});
export type FeatureRule = z.infer<typeof FeatureRuleSchema>;

export const FeatureFlagDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  tenantId: z.string().min(1),
  defaultEnabled: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type FeatureFlagDefinition = z.infer<typeof FeatureFlagDefinitionSchema>;

export const ExperimentVariantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  trafficAllocation: z.number().min(0).max(100)
});
export type ExperimentVariant = z.infer<typeof ExperimentVariantSchema>;

export const ExperimentDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  tenantId: z.string().min(1),
  salt: z.string().min(1),
  variants: z.array(ExperimentVariantSchema).min(1),
  enabled: z.boolean().default(true),
  timeWindow: TimeWindowSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date()
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
export type ExperimentDefinition = z.infer<typeof ExperimentDefinitionSchema>;

export const EvaluationContextSchema = z.object({
  tenantId: z.string().min(1),
  subjectId: z.string().min(1),
  groupIds: z.array(z.string()).optional(),
  partnerId: z.string().optional(),
  planId: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  now: z.date().optional()
});
export type EvaluationContext = z.infer<typeof EvaluationContextSchema>;

export const FeatureEvaluationResultSchema = z.object({
  featureId: z.string(),
  enabled: z.boolean(),
  source: RuleSourceSchema,
  ruleId: z.string().optional(),
  reason: z.string(),
  evaluatedAt: z.date()
});
export type FeatureEvaluationResult = z.infer<typeof FeatureEvaluationResultSchema>;

export const ExperimentAssignmentSchema = z.object({
  experimentId: z.string(),
  variantId: z.string(),
  variantName: z.string(),
  bucket: z.number().int().min(-1).max(99),
  tenantId: z.string(),
  subjectId: z.string(),
  assignedAt: z.date(),
  reason: z.string()
});
export type ExperimentAssignment = z.infer<typeof ExperimentAssignmentSchema>;

export const FeatureSnapshotEntrySchema = z.object({
  featureId: z.string(),
  enabled: z.boolean(),
  source: RuleSourceSchema,
  ruleId: z.string().optional(),
  reason: z.string()
});
export type FeatureSnapshotEntry = z.infer<typeof FeatureSnapshotEntrySchema>;

export const ExperimentSnapshotEntrySchema = z.object({
  experimentId: z.string(),
  variantId: z.string(),
  variantName: z.string(),
  bucket: z.number()
});
export type ExperimentSnapshotEntry = z.infer<typeof ExperimentSnapshotEntrySchema>;

export const FeatureSnapshotSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  tenantHash: z.string().min(1),
  subjectId: z.string().min(1),
  features: z.record(z.string(), FeatureSnapshotEntrySchema),
  experiments: z.record(z.string(), ExperimentSnapshotEntrySchema),
  generatedAt: z.date(),
  expiresAt: z.date(),
  checksum: z.string().min(1)
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
export type FeatureSnapshot = z.infer<typeof FeatureSnapshotSchema>;
