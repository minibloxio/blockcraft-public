"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const simplex_noise_js_1 = __importDefault(require("./simplex-noise.js"));
// dumb hack so there is a consistent way to import using commonjs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
simplex_noise_js_1.default['SimplexNoise'] = simplex_noise_js_1.default;
module.exports = simplex_noise_js_1.default;
//# sourceMappingURL=commonjs-wrapper.js.map