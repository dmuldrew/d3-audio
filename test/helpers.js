import nodeAssert from 'node:assert/strict';

/**
 * Assertion helpers shared by the test files. Each one throws an AssertionError
 * carrying `message`, so node:test reports the failing check by name.
 */

export function assert(condition, message) {
  nodeAssert.ok(condition, message);
}

// Objects and arrays compare by JSON serialisation, as the suite always has:
// key order matters and functions are ignored. Primitives compare with ===
// (so 0 equals -0, unlike node:assert's Object.is).
export function assertEqual(actual, expected, message) {
  if (typeof actual === 'object' && actual !== null) {
    nodeAssert.equal(JSON.stringify(actual), JSON.stringify(expected), message);
  } else if (actual !== expected) {
    throw new nodeAssert.AssertionError({ actual, expected, operator: '===', message });
  }
}

export function assertClose(actual, expected, tolerance = 0.01, message = "") {
  const diff = Math.abs(actual - expected);
  nodeAssert.ok(diff <= tolerance, `${message} (Expected ~${expected}, Got: ${actual}, Diff: ${diff})`);
}
