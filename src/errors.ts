export class TenantIsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantIsolationError';
  }
}

export class SnapshotVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotVerificationError';
  }
}

export class SnapshotExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotExpiredError';
  }
}

export class InvalidRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRuleError';
  }
}
