"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const hash_1 = require("../hash");
(0, vitest_1.describe)('Hash Utilities', () => {
    (0, vitest_1.describe)('sha256', () => {
        (0, vitest_1.it)('should produce consistent hash for same input', () => {
            const input = 'test-input';
            const hash1 = (0, hash_1.sha256)(input);
            const hash2 = (0, hash_1.sha256)(input);
            (0, vitest_1.expect)(hash1).toBe(hash2);
        });
        (0, vitest_1.it)('should produce different hashes for different inputs', () => {
            const hash1 = (0, hash_1.sha256)('input-1');
            const hash2 = (0, hash_1.sha256)('input-2');
            (0, vitest_1.expect)(hash1).not.toBe(hash2);
        });
        (0, vitest_1.it)('should produce 64-character hex string', () => {
            const hash = (0, hash_1.sha256)('test');
            (0, vitest_1.expect)(hash).toHaveLength(64);
            (0, vitest_1.expect)(/^[a-f0-9]+$/.test(hash)).toBe(true);
        });
    });
    (0, vitest_1.describe)('computeBucket', () => {
        (0, vitest_1.it)('should return value between 0 and 99', () => {
            for (let i = 0; i < 100; i++) {
                const bucket = (0, hash_1.computeBucket)(`exp-${i}`, `user-${i}`, `tenant-${i}`, 'salt');
                (0, vitest_1.expect)(bucket).toBeGreaterThanOrEqual(0);
                (0, vitest_1.expect)(bucket).toBeLessThan(100);
            }
        });
        (0, vitest_1.it)('should be deterministic', () => {
            const bucket1 = (0, hash_1.computeBucket)('exp-1', 'user-1', 'tenant-1', 'salt');
            const bucket2 = (0, hash_1.computeBucket)('exp-1', 'user-1', 'tenant-1', 'salt');
            (0, vitest_1.expect)(bucket1).toBe(bucket2);
        });
        (0, vitest_1.it)('should produce different buckets for different inputs', () => {
            const bucket1 = (0, hash_1.computeBucket)('exp-1', 'user-1', 'tenant-1', 'salt');
            const bucket2 = (0, hash_1.computeBucket)('exp-1', 'user-2', 'tenant-1', 'salt');
            const bucket3 = (0, hash_1.computeBucket)('exp-2', 'user-1', 'tenant-1', 'salt');
            const buckets = new Set([bucket1, bucket2, bucket3]);
            (0, vitest_1.expect)(buckets.size).toBeGreaterThan(1);
        });
    });
    (0, vitest_1.describe)('computeChecksum', () => {
        (0, vitest_1.it)('should produce consistent checksum for same object', () => {
            const obj = { a: 1, b: 'test', c: [1, 2, 3] };
            const checksum1 = (0, hash_1.computeChecksum)(obj);
            const checksum2 = (0, hash_1.computeChecksum)(obj);
            (0, vitest_1.expect)(checksum1).toBe(checksum2);
        });
        (0, vitest_1.it)('should produce different checksum for different objects', () => {
            const checksum1 = (0, hash_1.computeChecksum)({ a: 1 });
            const checksum2 = (0, hash_1.computeChecksum)({ a: 2 });
            (0, vitest_1.expect)(checksum1).not.toBe(checksum2);
        });
    });
    (0, vitest_1.describe)('computeTenantHash', () => {
        (0, vitest_1.it)('should produce consistent hash for same tenant', () => {
            const hash1 = (0, hash_1.computeTenantHash)('tenant-123');
            const hash2 = (0, hash_1.computeTenantHash)('tenant-123');
            (0, vitest_1.expect)(hash1).toBe(hash2);
        });
        (0, vitest_1.it)('should produce different hashes for different tenants', () => {
            const hash1 = (0, hash_1.computeTenantHash)('tenant-1');
            const hash2 = (0, hash_1.computeTenantHash)('tenant-2');
            (0, vitest_1.expect)(hash1).not.toBe(hash2);
        });
    });
});
//# sourceMappingURL=hash.test.js.map