import { describe, it, expect } from 'vitest';
import { sha256, computeBucket, computeChecksum, computeTenantHash } from '../hash';

describe('Hash Utilities', () => {
  describe('sha256', () => {
    it('should produce consistent hash for same input', () => {
      const input = 'test-input';
      const hash1 = sha256(input);
      const hash2 = sha256(input);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = sha256('input-1');
      const hash2 = sha256('input-2');
      expect(hash1).not.toBe(hash2);
    });

    it('should produce 64-character hex string', () => {
      const hash = sha256('test');
      expect(hash).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });
  });

  describe('computeBucket', () => {
    it('should return value between 0 and 99', () => {
      for (let i = 0; i < 100; i++) {
        const bucket = computeBucket(`exp-${i}`, `user-${i}`, `tenant-${i}`, 'salt');
        expect(bucket).toBeGreaterThanOrEqual(0);
        expect(bucket).toBeLessThan(100);
      }
    });

    it('should be deterministic', () => {
      const bucket1 = computeBucket('exp-1', 'user-1', 'tenant-1', 'salt');
      const bucket2 = computeBucket('exp-1', 'user-1', 'tenant-1', 'salt');
      expect(bucket1).toBe(bucket2);
    });

    it('should produce different buckets for different inputs', () => {
      const bucket1 = computeBucket('exp-1', 'user-1', 'tenant-1', 'salt');
      const bucket2 = computeBucket('exp-1', 'user-2', 'tenant-1', 'salt');
      const bucket3 = computeBucket('exp-2', 'user-1', 'tenant-1', 'salt');
      
      const buckets = new Set([bucket1, bucket2, bucket3]);
      expect(buckets.size).toBeGreaterThan(1);
    });
  });

  describe('computeChecksum', () => {
    it('should produce consistent checksum for same object', () => {
      const obj = { a: 1, b: 'test', c: [1, 2, 3] };
      const checksum1 = computeChecksum(obj);
      const checksum2 = computeChecksum(obj);
      expect(checksum1).toBe(checksum2);
    });

    it('should produce different checksum for different objects', () => {
      const checksum1 = computeChecksum({ a: 1 });
      const checksum2 = computeChecksum({ a: 2 });
      expect(checksum1).not.toBe(checksum2);
    });
  });

  describe('computeTenantHash', () => {
    it('should produce consistent hash for same tenant', () => {
      const hash1 = computeTenantHash('tenant-123');
      const hash2 = computeTenantHash('tenant-123');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different tenants', () => {
      const hash1 = computeTenantHash('tenant-1');
      const hash2 = computeTenantHash('tenant-2');
      expect(hash1).not.toBe(hash2);
    });
  });
});
