"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.evaluateFromSnapshot = exports.verifySnapshot = exports.generateFeatureSnapshot = exports.assignExperimentVariant = exports.checkFeature = void 0;
__exportStar(require("./models"), exports);
__exportStar(require("./errors"), exports);
__exportStar(require("./hash"), exports);
var feature_engine_1 = require("./feature-engine");
Object.defineProperty(exports, "checkFeature", { enumerable: true, get: function () { return feature_engine_1.checkFeature; } });
var experiment_engine_1 = require("./experiment-engine");
Object.defineProperty(exports, "assignExperimentVariant", { enumerable: true, get: function () { return experiment_engine_1.assignExperimentVariant; } });
var snapshot_1 = require("./snapshot");
Object.defineProperty(exports, "generateFeatureSnapshot", { enumerable: true, get: function () { return snapshot_1.generateFeatureSnapshot; } });
Object.defineProperty(exports, "verifySnapshot", { enumerable: true, get: function () { return snapshot_1.verifySnapshot; } });
Object.defineProperty(exports, "evaluateFromSnapshot", { enumerable: true, get: function () { return snapshot_1.evaluateFromSnapshot; } });
exports.VERSION = '0.0.0';
//# sourceMappingURL=index.js.map