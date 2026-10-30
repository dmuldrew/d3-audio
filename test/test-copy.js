import { assert, assertEqual } from './run-tests.js';
import * as d3Audio from '../src/index.js';

/**
 * For each scale: a non-default configuration, a change to apply to the copy,
 * and inputs whose output must match between original and copy.
 */
const CASES = {
  scalePitch: {
    configure: s => s.domain([0, 50]).range(["A2", "A5"]).scale("minor").root("A").quantize(false).clamp(false).equalLoudness(true).unknown("?"),
    mutate: s => s.domain([0, 500]),
    inputs: [0, 20, 75, NaN]
  },
  scaleGain: {
    configure: s => s.domain([10, 20]).range([0.1, 0.9]).curve("exponential").exponent(3).clamp(false).equalLoudness(true).unknown(0),
    mutate: s => s.range([0, 0.2]),
    inputs: [10, 15, 30, NaN]
  },
  scaleDuration: {
    configure: s => s.domain([0, 10]).range(["8n", "2n"]).quantize(false).bpm(90).clamp(false).unknown("4n"),
    mutate: s => s.bpm(200),
    inputs: [0, 5, 20, NaN]
  },
  scalePan: {
    configure: s => s.domain([0, 10]).range([-0.5, 0.5]).clamp(false).unknown(0),
    mutate: s => s.range([1, -1]),
    inputs: [0, 5, 20, NaN]
  },
  scaleFilter: {
    configure: s => s.domain([0, 10]).range([300, 3000]).qRange([2, 4]).type("linear").clamp(false).unknown(-1),
    mutate: s => s.type("exponential"),
    inputs: [0, 5, 20, NaN]
  },
  scaleSample: {
    configure: s => s.domain(["a", "b"]).range(["kick", "snare"]).unknown("hat"),
    mutate: s => s.range(["clap", "tom"]),
    inputs: ["a", "b", "z"]
  },
  scaleTempo: {
    configure: s => s.domain([0, 10]).range([80, 100]).clamp(false).unknown(120),
    mutate: s => s.range([40, 50]),
    inputs: [0, 5, 20, NaN]
  },
  scaleTension: {
    configure: s => s.domain([0, 10]).root("D3").detuneRange([5, 20]).filterRange([500, 5000]).tempoRange([1, 1.2]).gainRange([0.2, 0.6]).unknown(null),
    mutate: s => s.domain([0, 1000]),
    inputs: [0, 5, 10, NaN]
  },
  scaleUncertainty: {
    configure: s => s.domain([0, 0.05]).range([12, 4]).clamp(false),
    mutate: s => s.domain([0, 1]),
    inputs: [0, 0.02, 0.1, NaN]
  },
  scaleSpatial: {
    configure: s => s.domain([0, 10]).range([0.2, 0.6]).decay([1, 3]).clamp(false),
    mutate: s => s.decay([5, 9]),
    inputs: [0, 5, 20, NaN]
  },
  scaleEcho: {
    configure: s => s.domain([0, 200]).range([0.1, 0.3]).feedback([0.2, 0.5]).clamp(false),
    mutate: s => s.feedback([0.6, 0.9]),
    inputs: [0, 100, 400, NaN]
  },
  scaleChord: {
    configure: s => s.root("E3").quality("min7").voicing("drop2").inversion(1),
    mutate: s => s.quality("dim"),
    inputs: [undefined, "G3", ["A3", "maj7"]]
  },
  scaleRhythm: {
    configure: s => s.domain([0, 10]).steps(8).range([2, 6]).subdivision("8n").clamp(false),
    mutate: s => s.steps(12),
    inputs: [0, 5, 20, NaN]
  }
};

// Aliases share an implementation with the scale they point to
const ALIASES = { scaleCrush: "scaleUncertainty", scaleReverb: "scaleSpatial", scaleDelay: "scaleEcho", scaleHarmony: "scaleChord" };

const outputs = (scale, inputs) => JSON.stringify(inputs.map(x => scale(x)));

export function testCopy() {
  const scaleNames = Object.keys(d3Audio).filter(name => /^scale[A-Z]/.test(name));
  const untested = scaleNames.filter(name => !CASES[name] && !ALIASES[name]);
  assertEqual(untested, [], "Every exported scale has a copy() test case");

  for (const name of scaleNames) {
    const { configure, mutate, inputs } = CASES[name] || CASES[ALIASES[name]];
    const original = configure(d3Audio[name]());
    assertEqual(typeof original.copy, "function", `${name} has copy()`);

    const copy = original.copy();
    assert(typeof copy === "function" && copy !== original, `${name}.copy() returns a new scale`);
    assertEqual(outputs(copy, inputs), outputs(original, inputs), `${name}.copy() reproduces the original's configuration`);

    const before = outputs(original, inputs);
    mutate(copy);
    assert(outputs(copy, inputs) !== before, `${name} copy changes when reconfigured`);
    assertEqual(outputs(original, inputs), before, `${name} original is unaffected by changes to its copy`);
  }
}
