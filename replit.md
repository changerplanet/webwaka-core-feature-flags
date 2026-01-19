# webwaka-core-feature-flags

## Overview

A pure, deterministic TypeScript library for feature flag evaluation and experiment bucketing. Part of the WebWaka Core Substrate.

**Version:** 0.0.0  
**Classification:** Core Module  
**Status:** Phase 3F-3 Implementation Complete

## Capabilities

- `feature:check` - Deterministic feature flag evaluation
- `experiment:assign` - SHA-256 based experiment bucketing
- `feature:snapshot.generate` - Offline-safe snapshot generation
- `feature:snapshot.verify` - Snapshot integrity verification
- `experiment:snapshot.evaluate` - Offline experiment evaluation

## Project Structure

```
src/
├── index.ts              # Public API exports
├── models.ts             # Zod-validated domain models
├── errors.ts             # Custom error types
├── hash.ts               # SHA-256 hashing utilities
├── feature-engine.ts     # Feature flag evaluation engine
├── experiment-engine.ts  # Experiment bucketing engine
├── snapshot.ts           # Snapshot generation and verification
└── __tests__/            # Comprehensive test suite
    ├── feature-engine.test.ts
    ├── experiment-engine.test.ts
    ├── snapshot.test.ts
    ├── hash.test.ts
    ├── models.test.ts
    └── hard-stop.test.ts  # Hard stop proof test
```

## Public APIs

### checkFeature(featureId, context, rules)
Evaluates a feature flag with full precedence hierarchy enforcement.

### assignExperimentVariant(experiment, context)
Assigns a deterministic experiment variant using SHA-256 bucketing.

### generateFeatureSnapshot(context, rules, experiments, options?)
Generates an offline-safe snapshot with integrity checksum.

### verifySnapshot(snapshot)
Verifies snapshot integrity and detects tampering.

### evaluateFromSnapshot(featureId, snapshot, now, contextTenantId?)
Evaluates a feature from a verified snapshot.

## Precedence Hierarchy

1. Individual overrides
2. Group overrides
3. Tenant-level rules
4. Partner-level rules
5. Plan-level rules
6. System defaults

## Technical Constraints

- Pure TypeScript library (no I/O, no side effects)
- SHA-256 for all hashing
- Strict tenant isolation (hard errors on cross-tenant access)
- Deterministic evaluation (same inputs = same outputs)
- Zod validation for all domain models

## Development

### Scripts

- `npm run build` - Compile TypeScript
- `npm run dev` - Watch mode
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Type check

### Test Coverage

- Lines: 93.83%
- Branches: 91.39%
- Functions: 93.75%
- Statements: 94.3%

## Recent Changes

- 2026-01-19: Phase 3F-3 implementation complete
  - Implemented all domain models with Zod validation
  - Built feature flag evaluation engine with precedence hierarchy
  - Built experiment bucketing engine with SHA-256
  - Implemented snapshot system with integrity verification
  - Added comprehensive test suite (72 tests)
  - Hard stop proof test passing
