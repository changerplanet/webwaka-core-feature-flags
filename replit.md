# webwaka-core-feature-flags

## Overview

A TypeScript library module for feature flag management, part of the WebWaka Core Substrate. This is a headless library (no UI or server) that provides business logic and data access interfaces for feature flag operations.

## Project Structure

```
├── src/               # TypeScript source files
│   └── index.ts       # Main entry point and exports
├── dist/              # Compiled JavaScript output (generated)
├── package.json       # Project dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── module.manifest.json  # WebWaka module manifest
└── module.contract.md    # Module contract documentation
```

## Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Watch mode for development
- `npm run lint` - Type check without emitting files
- `npm test` - Run tests (not yet configured)

### Workflow

The "TypeScript Development" workflow runs `npm run dev` which watches for file changes and recompiles automatically.

## Architecture

This module follows WebWaka governance standards:
- Classification: Core module
- Type: Headless TypeScript library
- Consumers: Suite modules (POS, SVM, MVM, etc.)
- Tenant isolation: All data isolated by tenantId

## Recent Changes

- 2026-01-19: Initial project setup with TypeScript configuration
