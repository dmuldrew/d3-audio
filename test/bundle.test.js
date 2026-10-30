import vm from 'node:vm';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, test } from 'node:test';
import { assert, assertEqual } from './helpers.js';
import * as src from '../src/index.js';

/**
 * Loads a built browser bundle in a fresh global context, the way a <script> tag would.
 */
function loadBundle(file) {
  const code = fs.readFileSync(fileURLToPath(new URL(`../dist/${file}`, import.meta.url)), 'utf-8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.d3Audio;
}

const exportNames = Object.keys(src).filter(name => name !== 'default');
const scaleNames = exportNames.filter(name => /^scale[A-Z]/.test(name));

describe("Built browser bundles", () => {
  for (const file of ['d3-audio.js', 'd3-audio.min.js']) {
    test(file, () => {
      const bundle = loadBundle(file);
      assert(bundle && typeof bundle === 'object', `${file} defines the d3Audio global`);

      const missing = exportNames.filter(name => !(name in bundle));
      assertEqual(missing, [], `${file} exposes every export of src/index.js`);

      // Calling each scale runs its helpers, catching modules left out of the concatenated bundle
      const failures = [];
      for (const name of scaleNames) {
        for (const input of [0.5, NaN]) {
          try {
            bundle[name]()(input);
          } catch (e) {
            failures.push(`${name}(${input}): ${e.message}`);
          }
        }
      }
      assertEqual(failures, [], `${file}: every scale evaluates valid and missing input without throwing`);

      assertEqual(bundle.scaleGain().domain([0, 100])(50), src.scaleGain().domain([0, 100])(50), `${file} scaleGain matches source output`);
      assertEqual(bundle.scalePitch().unknown("?")(NaN), "?", `${file} scalePitch honours unknown()`);
    });
  }
});
