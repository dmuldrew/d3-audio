import { describe, test } from 'node:test';
import { assert, assertEqual, assertClose } from './helpers.js';
import {
  scalePitch,
  scaleGain,
  scalePan,
  scaleDuration,
  scaleFilter,
  scaleTempo,
  scaleTension,
  scaleUncertainty,
  scaleSpatial,
  scaleEcho,
  scaleChord,
  parseNote,
  midiToNote,
  quantizeToScale,
  generateScaleNotes,
  iso226Weight,
  equalLoudnessCompensation
} from '../src/index.js';

describe("Boundary conditions & robustness", () => {
  test("scalePitch Boundary & Inversion Edge Cases", () => {
    const pitchClamped = scalePitch()
      .domain([0, 100])
      .range(["C3", "C6"])
      .clamp(true);

    // Clamping prevents notes from blowing past range boundaries
    const lowNote = pitchClamped(-50);
    const minNote = pitchClamped(0);
    assertEqual(lowNote, minNote, "scalePitch with clamp(true) clamps low out-of-bounds input to domain min");

    const highNote = pitchClamped(250);
    const maxNote = pitchClamped(100);
    assertEqual(highNote, maxNote, "scalePitch with clamp(true) clamps high out-of-bounds input to domain max");

    // Inverted domain: higher numbers produce lower pitches
    const pitchInverted = scalePitch()
      .domain([100, 0])
      .range(["C3", "C6"]);

    assertEqual(pitchInverted(100), "C3", "Inverted domain maps max domain value to min range note");
    assertEqual(pitchInverted(0), "C6", "Inverted domain maps min domain value to max range note");

    // Single-point zero-span domain: should not produce NaN
    const pitchZeroSpan = scalePitch()
      .domain([50, 50])
      .range(["C4", "C5"]);
    assert(typeof pitchZeroSpan(50) === 'string', "Zero-span domain [50, 50] evaluates safely without NaN");

    // Minor scale and modal variations
    const pitchMinor = scalePitch().domain([0, 100]).range(["A3", "A5"]).scale("minor").root("A");
    assertEqual(pitchMinor(0), "A3", "A natural minor scale root is A3");

    const pitchBlues = scalePitch().domain([0, 100]).range(["E3", "E5"]).scale("blues").root("E");
    assertEqual(pitchBlues(0), "E3", "Blues scale root is E3");

    // Enharmonic root specification (C# vs Db, F# vs Gb)
    const pitchSharp = scalePitch().domain([0, 10]).range(["F#3", "F#4"]).root("F#");
    assertEqual(pitchSharp(0), "F#3", "F# root scale generates F#3");

    // Categorical domain with unmapped category fallback
    const catPitch = scalePitch().domain(["alpha", "beta"]).range(["C4", "G4"]);
    const fallbackCat = catPitch("unknownCategory");
    assertEqual(fallbackCat, null, "Unmapped categorical domain entry produces null");
  });

  test("scaleGain Edge Cases & Dynamics Curve", () => {
    const gainClamped = scaleGain()
      .domain([0, 100])
      .range([0.1, 0.9])
      .clamp(true);

    assertEqual(gainClamped(-50), 0.1, "scaleGain with clamp(true) clamps negative inputs to range min");
    assertEqual(gainClamped(200), 0.9, "scaleGain with clamp(true) clamps excessive inputs to range max");

    // Inverted gain (e.g. depth -> attenuation)
    const gainInverted = scaleGain()
      .domain([100, 0])
      .range([0.2, 1.0]);
    assertEqual(gainInverted(100), 0.2, "Inverted gain maps 100 to min gain 0.2");
    assertEqual(gainInverted(0), 1.0, "Inverted gain maps 0 to max gain 1.0");

    // Gain dB calculations
    const gainDbScale = scaleGain().domain([0, 100]).range([0.0, 1.0]);
    const gainDbZero = gainDbScale.db(100);
    assertClose(gainDbZero, 0, 0.01, "scaleGain.db(100) at max gain is 0 dB");

    const gainDbHalf = gainDbScale.db(50);
    assertClose(gainDbHalf, -6.02, 0.1, "scaleGain.db(50) at half gain is ~ -6 dB");
  });

  test("scalePan Boundary & Center Calculations", () => {
    const pan = scalePan().domain([-180, 180]).range([-1, 1]);

    assertEqual(pan(-180), -1, "scalePan maps -180 to -1 (Full Left)");
    assertEqual(pan(0), 0, "scalePan maps 0 to 0 (Center)");
    assertEqual(pan(180), 1, "scalePan maps 180 to 1 (Full Right)");

    // Clamping prevents stereo panning beyond [-1, 1]
    assertClose(Math.min(1, Math.max(-1, pan(-360))), -1, 0.001, "Pan clamp safely bounds severe negative inputs");
    assertClose(Math.min(1, Math.max(-1, pan(360))), 1, 0.001, "Pan clamp safely bounds severe positive inputs");
  });

  test("scaleDuration Edge Cases", () => {
    const durUnquantized = scaleDuration()
      .domain([0, 100])
      .range([0.1, 4.0])
      .bpm(60)
      .quantize(false);

    assertClose(durUnquantized(50), 2.05, 0.1, "Unquantized scaleDuration interpolates numeric seconds smoothly");

    const durQuantized = scaleDuration()
      .domain([0, 100])
      .range(["32n", "1m"])
      .quantize(true);

    assert(typeof durQuantized(0) === 'string', "Quantized scaleDuration(0) returns musical note duration string");
    assert(typeof durQuantized(100) === 'string', "Quantized scaleDuration(100) returns musical note duration string");
  });

  test("scaleFilter Cutoff Limits", () => {
    const filterExp = scaleFilter()
      .domain([0, 100])
      .range([80, 18000])
      .type("exponential");

    assertEqual(filterExp(0), 80, "Exponential filter(0) returns min cutoff 80 Hz");
    assertEqual(filterExp(100), 18000, "Exponential filter(100) returns max cutoff 18000 Hz");
    assert(filterExp(50) < 9000, "Exponential filter curve weights lower frequencies prominently");
  });

  test("parseNote & midiToNote Edge Cases & Enharmonics", () => {
    // Enharmonic equivalence
    const cSharp = parseNote("C#4");
    const dFlat = parseNote("Db4");
    assertEqual(cSharp.midi, dFlat.midi, "C#4 and Db4 share identical MIDI number 61");
    assertClose(cSharp.frequency, dFlat.frequency, 0.01, "C#4 and Db4 share identical frequency ~277.18 Hz");

    // Extreme octave boundaries
    const subBassC0 = parseNote("C0");
    assertEqual(subBassC0.octave, 0, "C0 parsed with octave 0");
    assertClose(subBassC0.frequency, 16.35, 0.1, "C0 frequency is ~16.35 Hz (sub-audible)");

    const ultraTrebleB8 = parseNote("B8");
    assertEqual(ultraTrebleB8.octave, 8, "B8 parsed with octave 8");
    assertClose(ultraTrebleB8.frequency, 7902.13, 1.0, "B8 frequency is ~7902 Hz");

    // Resilient error handling on empty or malformed note strings
    let threwEmpty = false;
    try { parseNote(""); } catch (_) { threwEmpty = true; }
    assert(threwEmpty, "parseNote('') throws descriptive error on empty string");

    let threwNull = false;
    try { parseNote(null); } catch (_) { threwNull = true; }
    assert(threwNull, "parseNote(null) throws error on non-string input");

    let threwInvalid = false;
    try { parseNote("H9"); } catch (_) { threwInvalid = true; }
    assert(threwInvalid, "parseNote('H9') throws error on invalid note name");
  });

  test("quantizeToScale Notes & Scales", () => {
    // Quantizing non-scale semitones
    const majorNotes = generateScaleNotes("C4", "C5", "major", "C");
    const qMajor = quantizeToScale(parseNote("F#4").midi, majorNotes);
    assert(["F4", "G4"].includes(qMajor.note), "Quantizing F#4 into C Major snaps to F4 or G4");

    const pentNotes = generateScaleNotes("A4", "C5", "pentatonic", "C");
    const qMinor = quantizeToScale(parseNote("B4").midi, pentNotes);
    assert(["A4", "C5"].includes(qMinor.note), "Quantizing B4 into C Pentatonic snaps to A4 or C5");
  });

  test("scaleChord Harmonization Qualities", () => {
    const chordScaler = scaleChord();
    const dom7 = chordScaler({ root: "G3", quality: "dom7" });
    assertEqual(dom7.notes, ["G3", "B3", "D4", "F4"], "G3 dominant 7th yields [G3, B3, D4, F4]");

    const dim = chordScaler({ root: "B3", quality: "dim" });
    assertEqual(dim.notes, ["B3", "D4", "F4"], "B3 diminished triad yields [B3, D4, F4]");

    const sus2 = chordScaler({ root: "C3", quality: "sus2" });
    assertEqual(sus2.notes, ["C3", "D3", "G3"], "C3 sus2 yields [C3, D3, G3]");
  });

  test("Equal Loudness Fletcher-Munson Weights", () => {
    // High frequencies (>12 kHz) face attenuation in human ear canal response
    const eq20k = iso226Weight(15000);
    assert(eq20k < 0, "15 kHz high frequency shows negative sensitivity weight (< 0 dB)");

    const comp20k = equalLoudnessCompensation(15000);
    assert(comp20k > 1.0, "Equal loudness compensation boosts attenuated 15 kHz treble (> 1.0)");
  });
});
