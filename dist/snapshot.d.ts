import { EvaluationContext, FeatureRule, ExperimentDefinition, FeatureSnapshot, FeatureEvaluationResult } from './models';
interface SnapshotOptions {
    expiresInMs?: number;
}
export declare function generateFeatureSnapshot(context: EvaluationContext, rules: FeatureRule[], experiments: ExperimentDefinition[], options?: SnapshotOptions): FeatureSnapshot;
export declare function verifySnapshot(snapshot: FeatureSnapshot): boolean;
export declare function evaluateFromSnapshot(featureId: string, snapshot: FeatureSnapshot, now?: Date, contextTenantId?: string): FeatureEvaluationResult;
export {};
//# sourceMappingURL=snapshot.d.ts.map