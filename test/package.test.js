import { describe, test } from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { assert, assertEqual } from './helpers.js';
import * as src from '../src/index.js';

// Node resolves a package's own name through its "exports" map, so these
// imports behave exactly like a consumer's `import ... from "d3-audio"`.
describe("Package entry points", () => {
  test("import 'd3-audio' exposes the named exports of src/index.js", async () => {
    const pkg = await import('d3-audio');
    assertEqual(Object.keys(pkg).sort(), Object.keys(src).sort(), "Bare import has the same exports as src/index.js");
    assert(pkg.scalePitch === src.scalePitch, "Bare import resolves to the same module instance as src/index.js");
  });

  test("deep imports of src/ and dist/ stay resolvable", async () => {
    const scales = await import('d3-audio/src/scales/index.js');
    assertEqual(typeof scales.scaleGain, 'function', "d3-audio/src/... resolves");

    const bundlePath = fileURLToPath(import.meta.resolve('d3-audio/dist/d3-audio.js'));
    assert(bundlePath.endsWith('dist/d3-audio.js'), "d3-audio/dist/d3-audio.js resolves to the browser bundle");

    const require = createRequire(import.meta.url);
    assertEqual(require('d3-audio/package.json').name, 'd3-audio', "d3-audio/package.json resolves");
  });
});
