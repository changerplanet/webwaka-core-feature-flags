import { z } from 'zod';
export declare const RuleSourceSchema: z.ZodEnum<{
    individual: "individual";
    group: "group";
    tenant: "tenant";
    partner: "partner";
    plan: "plan";
    system: "system";
}>;
export type RuleSource = z.infer<typeof RuleSourceSchema>;
export declare const PRECEDENCE_ORDER: RuleSource[];
export declare const TimeWindowSchema: z.ZodObject<{
    startsAt: z.ZodOptional<z.ZodDate>;
    endsAt: z.ZodOptional<z.ZodDate>;
}, z.core.$strip>;
export type TimeWindow = z.infer<typeof TimeWindowSchema>;
export declare const FeatureRuleSchema: z.ZodObject<{
    id: z.ZodString;
    featureId: z.ZodString;
    tenantId: z.ZodString;
    source: z.ZodEnum<{
        individual: "individual";
        group: "group";
        tenant: "tenant";
        partner: "partner";
        plan: "plan";
        system: "system";
    }>;
    enabled: z.ZodBoolean;
    subjectId: z.ZodOptional<z.ZodString>;
    groupId: z.ZodOptional<z.ZodString>;
    partnerId: z.ZodOptional<z.ZodString>;
    planId: z.ZodOptional<z.ZodString>;
    timeWindow: z.ZodOptional<z.ZodObject<{
        startsAt: z.ZodOptional<z.ZodDate>;
        endsAt: z.ZodOptional<z.ZodDate>;
    }, z.core.$strip>>;
    priority: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type FeatureRule = z.infer<typeof FeatureRuleSchema>;
export declare const FeatureFlagDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    tenantId: z.ZodString;
    defaultEnabled: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export type FeatureFlagDefinition = z.infer<typeof FeatureFlagDefinitionSchema>;
export declare const ExperimentVariantSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    trafficAllocation: z.ZodNumber;
}, z.core.$strip>;
export type ExperimentVariant = z.infer<typeof ExperimentVariantSchema>;
export declare const ExperimentDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    tenantId: z.ZodString;
    salt: z.ZodString;
    variants: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        trafficAllocation: z.ZodNumber;
    }, z.core.$strip>>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    timeWindow: z.ZodOptional<z.ZodObject<{
        startsAt: z.ZodOptional<z.ZodDate>;
        endsAt: z.ZodOptional<z.ZodDate>;
    }, z.core.$strip>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export type ExperimentDefinition = z.infer<typeof ExperimentDefinitionSchema>;
export declare const EvaluationContextSchema: z.ZodObject<{
    tenantId: z.ZodString;
    subjectId: z.ZodString;
    groupIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    partnerId: z.ZodOptional<z.ZodString>;
    planId: z.ZodOptional<z.ZodString>;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    now: z.ZodOptional<z.ZodDate>;
}, z.core.$strip>;
export type EvaluationContext = z.infer<typeof EvaluationContextSchema>;
export declare const FeatureEvaluationResultSchema: z.ZodObject<{
    featureId: z.ZodString;
    enabled: z.ZodBoolean;
    source: z.ZodEnum<{
        individual: "individual";
        group: "group";
        tenant: "tenant";
        partner: "partner";
        plan: "plan";
        system: "system";
    }>;
    ruleId: z.ZodOptional<z.ZodString>;
    reason: z.ZodString;
    evaluatedAt: z.ZodDate;
}, z.core.$strip>;
export type FeatureEvaluationResult = z.infer<typeof FeatureEvaluationResultSchema>;
export declare const ExperimentAssignmentSchema: z.ZodObject<{
    experimentId: z.ZodString;
    variantId: z.ZodString;
    variantName: z.ZodString;
    bucket: z.ZodNumber;
    tenantId: z.ZodString;
    subjectId: z.ZodString;
    assignedAt: z.ZodDate;
    reason: z.ZodString;
}, z.core.$strip>;
export type ExperimentAssignment = z.infer<typeof ExperimentAssignmentSchema>;
export declare const FeatureSnapshotEntrySchema: z.ZodObject<{
    featureId: z.ZodString;
    enabled: z.ZodBoolean;
    source: z.ZodEnum<{
        individual: "individual";
        group: "group";
        tenant: "tenant";
        partner: "partner";
        plan: "plan";
        system: "system";
    }>;
    ruleId: z.ZodOptional<z.ZodString>;
    reason: z.ZodString;
}, z.core.$strip>;
export type FeatureSnapshotEntry = z.infer<typeof FeatureSnapshotEntrySchema>;
export declare const ExperimentSnapshotEntrySchema: z.ZodObject<{
    experimentId: z.ZodString;
    variantId: z.ZodString;
    variantName: z.ZodString;
    bucket: z.ZodNumber;
}, z.core.$strip>;
export type ExperimentSnapshotEntry = z.infer<typeof ExperimentSnapshotEntrySchema>;
export declare const FeatureSnapshotSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    tenantHash: z.ZodString;
    subjectId: z.ZodString;
    features: z.ZodRecord<z.ZodString, z.ZodObject<{
        featureId: z.ZodString;
        enabled: z.ZodBoolean;
        source: z.ZodEnum<{
            individual: "individual";
            group: "group";
            tenant: "tenant";
            partner: "partner";
            plan: "plan";
            system: "system";
        }>;
        ruleId: z.ZodOptional<z.ZodString>;
        reason: z.ZodString;
    }, z.core.$strip>>;
    experiments: z.ZodRecord<z.ZodString, z.ZodObject<{
        experimentId: z.ZodString;
        variantId: z.ZodString;
        variantName: z.ZodString;
        bucket: z.ZodNumber;
    }, z.core.$strip>>;
    generatedAt: z.ZodDate;
    expiresAt: z.ZodDate;
    checksum: z.ZodString;
}, z.core.$strip>;
export type FeatureSnapshot = z.infer<typeof FeatureSnapshotSchema>;
//# sourceMappingURL=models.d.ts.map