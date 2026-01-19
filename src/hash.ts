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

export function computeChecksum(data: object): string {
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  return sha256(canonical);
}

export function computeTenantHash(tenantId: string): string {
  return sha256(tenantId);
}
