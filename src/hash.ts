import { createHash } from 'crypto';

export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function computeBucket(
  experimentId: string,
  subjectId: string,
  tenantId: string,
  salt: string
): number {
  const hashInput = `${experimentId}${subjectId}${tenantId}${salt}`;
  const hash = sha256(hashInput);
  const hashInt = parseInt(hash.substring(0, 8), 16);
  return hashInt % 100;
}

function sortObjectDeep(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectDeep);
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    for (const key of keys) {
      sorted[key] = sortObjectDeep((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

export function computeChecksum(data: object): string {
  const sorted = sortObjectDeep(data);
  const canonical = JSON.stringify(sorted);
  return sha256(canonical);
}

export function computeTenantHash(tenantId: string): string {
  return sha256(tenantId);
}
