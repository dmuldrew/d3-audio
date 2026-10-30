import { testMusical } from './test-musical.js';
import { testScales } from './test-scales.js';
import { testMovements } from './test-movements.js';
import { testTimeline } from './test-timeline.js';
import { testAdvanced } from './test-advanced.js';
import { testAudio } from './test-audio.js';
import { testUI } from './test-ui.js';
import { testEdgeCases } from './test-edge-cases.js';
import { testChoreography } from './test-choreography.js';
import { testTimelinePlayback } from './test-timeline-playback.js';
import { testUnknown } from './test-unknown.js';

let passed = 0;
let failed = 0;

export function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${message}`);
  } else {
    failed++;
    console.error(`  \x1b[31m✗ FAIL:\x1b[0m ${message}`);
  }
}

export function assertEqual(actual, expected, message) {
  const isMatch = typeof actual === 'object' && actual !== null
    ? JSON.stringify(actual) === JSON.stringify(expected)
    : actual === expected;

  if (isMatch) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${message}`);
  } else {
    failed++;
    console.error(`  \x1b[31m✗ FAIL:\x1b[0m ${message} (Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)})`);
  }
}

export function assertClose(actual, expected, tolerance = 0.01, message = "") {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${message}`);
  } else {
    failed++;
    console.error(`  \x1b[31m✗ FAIL:\x1b[0m ${message} (Expected ~${expected}, Got: ${actual}, Diff: ${diff})`);
  }
}

async function runAll() {
  console.log('\n========================================');
  console.log('       d3-audio Unit Test Suite         ');
  console.log('========================================\n');

  console.log('\x1b[36m[1/11] Testing Musical Theory & Conversions...\x1b[0m');
  testMusical();

  console.log('\n\x1b[36m[2/11] Testing D3-like Audio Scalers...\x1b[0m');
  testScales();

  console.log('\n\x1b[36m[3/11] Testing Rhythmic Movements & Envelopes...\x1b[0m');
  testMovements();

  console.log('\n\x1b[36m[4/11] Testing Timeline & Track Orchestration...\x1b[0m');
  testTimeline();

  console.log('\n\x1b[36m[5/11] Testing Advanced Scalers, Theory & a11y...\x1b[0m');
  testAdvanced();

  console.log('\n\x1b[36m[6/11] Testing Audio Engine, Synths & Granular Scrubber...\x1b[0m');
  testAudio();

  console.log('\n\x1b[36m[7/11] Testing UI Components & Accessible Chart Bridge...\x1b[0m');
  testUI();

  console.log('\n\x1b[36m[8/11] Testing Boundary Conditions & Robustness...\x1b[0m');
  testEdgeCases();

  console.log('\n\x1b[36m[9/11] Testing Choreography Presets & D3 Transitions...\x1b[0m');
  testChoreography();

  console.log('\n\x1b[36m[10/11] Testing Timeline Playback & Transport Lifecycle...\x1b[0m');
  await testTimelinePlayback();

  console.log('\n\x1b[36m[11/11] Testing Missing-Data Handling via scale.unknown()...\x1b[0m');
  testUnknown();

  console.log('\n----------------------------------------');
  if (failed === 0) {
    console.log(`\x1b[32m✔ ALL ${passed} TESTS PASSED SUCCESSFULLY!\x1b[0m\n`);
    process.exit(0);
  } else {
    console.log(`\x1b[31m✖ ${failed} TESTS FAILED (${passed} passed)\x1b[0m\n`);
    process.exit(1);
  }
}

runAll();
