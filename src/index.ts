export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlagService {
  getFlag(tenantId: string, flagId: string): Promise<FeatureFlag | null>;
  getAllFlags(tenantId: string): Promise<FeatureFlag[]>;
  isEnabled(tenantId: string, flagId: string): Promise<boolean>;
  setEnabled(tenantId: string, flagId: string, enabled: boolean): Promise<void>;
}

export const VERSION = "0.0.0";
