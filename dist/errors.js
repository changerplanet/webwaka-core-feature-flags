"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidRuleError = exports.SnapshotExpiredError = exports.SnapshotVerificationError = exports.TenantIsolationError = void 0;
class TenantIsolationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TenantIsolationError';
    }
}
exports.TenantIsolationError = TenantIsolationError;
class SnapshotVerificationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SnapshotVerificationError';
    }
}
exports.SnapshotVerificationError = SnapshotVerificationError;
class SnapshotExpiredError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SnapshotExpiredError';
    }
}
exports.SnapshotExpiredError = SnapshotExpiredError;
class InvalidRuleError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidRuleError';
    }
}
exports.InvalidRuleError = InvalidRuleError;
//# sourceMappingURL=errors.js.map