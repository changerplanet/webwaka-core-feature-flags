export * from './models';
export * from './errors';
export * from './hash';
export { checkFeature } from './feature-engine';
export { assignExperimentVariant } from './experiment-engine';
export {
  generateFeatureSnapshot,
  verifySnapshot,
  evaluateFromSnapshot
} from './snapshot';

export const VERSION = '0.0.0';
