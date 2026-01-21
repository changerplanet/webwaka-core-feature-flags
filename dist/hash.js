"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256 = sha256;
exports.computeBucket = computeBucket;
exports.computeChecksum = computeChecksum;
exports.computeTenantHash = computeTenantHash;
const crypto_1 = require("crypto");
function sha256(input) {
    return (0, crypto_1.createHash)('sha256').update(input, 'utf8').digest('hex');
}
function computeBucket(experimentId, subjectId, tenantId, salt) {
    const hashInput = `${experimentId}${subjectId}${tenantId}${salt}`;
    const hash = sha256(hashInput);
    const hashInt = parseInt(hash.substring(0, 8), 16);
    return hashInt % 100;
}
function sortObjectDeep(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(sortObjectDeep);
    }
    if (typeof obj === 'object' && !(obj instanceof Date)) {
        const sorted = {};
        const keys = Object.keys(obj).sort();
        for (const key of keys) {
            sorted[key] = sortObjectDeep(obj[key]);
        }
        return sorted;
    }
    return obj;
}
function computeChecksum(data) {
    const sorted = sortObjectDeep(data);
    const canonical = JSON.stringify(sorted);
    return sha256(canonical);
}
function computeTenantHash(tenantId) {
    return sha256(tenantId);
}
//# sourceMappingURL=hash.js.map