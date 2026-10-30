import { assert, assertEqual } from './run-tests.js';
import {
  scalePitch,
  scaleGain,
  scalePan,
  scaleFilter,
  scaleTempo,
  scaleDuration,
  scaleTension
} from '../src/index.js';

const MISSING = [
  [NaN, "NaN"],
  [null, "null"],
  [undefined, "undefined"],
  ["abc", "non-numeric string"]
];

export function testUnknown() {
  // --------------------------------------------------------------------------
  // 1. Every continuous scale returns unknown() for missing input, d3-style
  // --------------------------------------------------------------------------
  const scales = {
    scalePitch: () => scalePitch().domain([0, 100]).range(["C3", "C6"]),
    scaleGain: () => scaleGain().domain([0, 100]),
    scalePan: () => scalePan().domain([0, 100]),
    scaleFilter: () => scaleFilter().domain([0, 100]),
    scaleTempo: () => scaleTempo().domain([0, 100]),
    scaleDuration: () => scaleDuration().domain([0, 100]),
    scaleTension: () => scaleTension().domain([0, 100])
  };

  for (const [name, make] of Object.entries(scales)) {
    const s = make();
    assertEqual(s.unknown(), undefined, `${name}.unknown() defaults to undefined`);
    for (const [value, label] of MISSING) {
      assertEqual(s(value), undefined, `${name}(${label}) returns unknown()`);
    }

    s.unknown("fallback");
    assertEqual(s.unknown(), "fallback", `${name}.unknown(value) sets the fallback`);
    assertEqual(s(NaN), "fallback", `${name}(NaN) returns the configured fallback`);
    assert(s(50) !== "fallback", `${name} still maps valid input normally`);
    assertEqual(s.copy().unknown(), "fallback", `${name}.copy() preserves unknown()`);
  }

  // --------------------------------------------------------------------------
  // 2. Numeric strings coerce like d3 (only non-numeric input is missing)
  // --------------------------------------------------------------------------
  const gain = scaleGain().domain([0, 100]);
  assertEqual(gain("50"), gain(50), "scaleGain coerces numeric strings");
  assertEqual(scaleTempo().domain([0, 100])("100"), 180, "scaleTempo coerces numeric strings");

  // --------------------------------------------------------------------------
  // 3. Derived methods follow the same rule
  // --------------------------------------------------------------------------
  const pitch = scalePitch().domain([0, 100]).range(["C3", "C6"]).unknown(null).equalLoudness(true);
  assertEqual(pitch.frequency(NaN), null, "scalePitch.frequency(NaN) returns unknown()");
  assertEqual(pitch.midi(undefined), null, "scalePitch.midi(undefined) returns unknown()");
  assertEqual(pitch.gain(NaN), null, "scalePitch.gain(NaN) returns unknown()");

  assertEqual(scalePitch().unknown(0).gain(NaN), 0, "scalePitch.gain(NaN) returns unknown() with equalLoudness off (the default)");
  assertEqual(scalePitch().gain(50), 1.0, "scalePitch.gain() still returns 1.0 for valid input with equalLoudness off");

  const silent = scaleGain().domain([0, 100]).unknown(0);
  assertEqual(silent.db(NaN), 0, "scaleGain.db(NaN) returns unknown() rather than a dB value");
  assertEqual(silent(null), 0, "scaleGain.unknown(0) makes missing data silent");

  const filter = scaleFilter().domain([0, 100]).unknown(-1);
  assertEqual(filter.q(NaN), -1, "scaleFilter.q(NaN) returns unknown()");

  const duration = scaleDuration().domain([0, 100]).unknown("8n");
  assertEqual(duration.seconds(NaN), "8n", "scaleDuration.seconds(NaN) returns unknown() unconverted");

  const tension = scaleTension().domain([0, 100]).unknown(null);
  assertEqual(tension.chord(NaN), null, "scaleTension.chord(NaN) returns unknown()");
  assertEqual(tension.pitch(NaN), null, "scaleTension.pitch(NaN) returns unknown()");
  assertEqual(tension.filter(NaN), null, "scaleTension.filter(NaN) returns unknown()");
  assertEqual(tension.gain(NaN), null, "scaleTension.gain(NaN) returns unknown()");
  assertEqual(tension.detune(NaN), null, "scaleTension.detune(NaN) returns unknown()");
  assertEqual(tension.tempo(NaN), null, "scaleTension.tempo(NaN) returns unknown()");
  assertEqual(tension(100).tier, "dissonant", "scaleTension still maps valid input");

  // --------------------------------------------------------------------------
  // 4. Categorical domains are unaffected: strings are valid keys, not missing
  // --------------------------------------------------------------------------
  const catPitch = scalePitch().domain(["low", "mid", "high"]).range(["C3", "C5"]).unknown("X");
  assertEqual(catPitch("low"), "C3", "Categorical scalePitch still maps string keys");
  assertEqual(catPitch("other"), null, "Categorical scalePitch keeps its own unmatched-key result");

  const catGain = scaleGain().domain(["quiet", "loud"]).range([0.2, 1]).unknown(0);
  assertEqual(catGain("loud"), 1, "Categorical scaleGain still maps string keys");
  assert(catGain.db("loud") === 0, "Categorical scaleGain.db maps string keys to dB");
}
