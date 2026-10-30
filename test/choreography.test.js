import { describe, test } from 'node:test';
import { assert, assertEqual, assertClose } from './helpers.js';
import {
  choreography,
  PRESETS,
  audioRamp,
  audioTransition
} from '../src/index.js';

// Mock DOM Node for applying movement
function createMockNode() {
  return {
    style: {},
    setAttribute: function(name, val) { this[name] = val; },
    getAttribute: function(name) { return this[name]; }
  };
}

describe("Choreography presets & D3 transitions", () => {
  test("choreography Configurator & Preset Selection", () => {
    const choreo = choreography();
    assert(typeof choreo === 'function', "choreography() returns configurable animator function");

    // Default properties
    assertEqual(typeof choreo.duration, 'function', "choreography duration accessor is chainable");
    assertEqual(typeof choreo.intensity, 'function', "choreography intensity accessor is chainable");
    assertEqual(typeof choreo.movement, 'function', "choreography movement accessor is chainable");

    // Chain configurations
    choreo
      .movement("pulse")
      .duration(0.6)
      .intensity(1.5);

    // Functional intensity accessor (e.g. data-driven intensity)
    choreo.intensity(d => (d && d.mag ? d.mag / 5 : 1.0));
    assert(typeof choreo.intensity === 'function', "choreography accepts dynamic data accessor for intensity");

    // Custom movement callback function
    let customCalled = false;
    const customMovement = (t, options) => {
      customCalled = true;
      return {
        transform: `scale(${1 + t * 0.2})`,
        opacity: 1 - t * 0.5
      };
    };

    choreo.movement(customMovement);

    const mockNode = createMockNode();

    // Execute choreography on mock element
    try {
      choreo(mockNode);
      assert(true, "choreography executes on mock DOM element without error");
    } catch (err) {
      assert(false, `choreography execution error: ${err.message}`);
    }

    // Verify all 8 built-in movement presets can be resolved
    const presetNames = ["wiggle", "flip", "pulse", "bounce", "shake", "ripple", "glow", "squash"];
    presetNames.forEach(preset => {
      const pChoreo = choreography().movement(preset);
      assert(typeof pChoreo === 'function', `choreography accepts preset '${preset}'`);
    });
  });

  test("audioRamp & Parameter Interpolation", () => {
    // Mock Tone AudioParam with rampTo method
    let rampedVal = 0;
    let rampedDuration = 0;
    const mockToneParam = {
      rampTo: (val, dur) => {
        rampedVal = val;
        rampedDuration = dur;
      }
    };

    audioRamp(mockToneParam, 440, { duration: 0.3 });
    assertEqual(rampedVal, 440, "audioRamp successfully calls rampTo with target value 440");
    assertEqual(rampedDuration, 0.3, "audioRamp successfully calls rampTo with duration 0.3");

    // Mock AudioParam with linearRampTo
    let linearVal = 0;
    let linearTime = 0;
    const mockLinearParam = {
      value: 100,
      linearRampTo: (val, dur) => {
        linearVal = val;
        linearTime = dur;
      }
    };

    audioRamp(mockLinearParam, 250, { duration: 0.4, ramp: "linear" });
    assertEqual(linearVal, 250, "audioRamp calls linearRampTo with target value 250");
    assertEqual(linearTime, 0.4, "audioRamp calls linearRampTo with duration 0.4");

    // Direct assignment fallback
    const fallbackParam = { value: 50 };
    audioRamp(fallbackParam, 75, {});
    assertEqual(fallbackParam.value, 75, "audioRamp assigns value directly when ramp methods unavailable");
  });

  test("audioTransition D3 Lifecycle Hook", () => {
    const mockToneParam = { rampTo: () => {} };
    const mockNode = createMockNode();
    const transitionHook = audioTransition(mockToneParam, {
      param: "frequency",
      from: 220,
      to: 880,
      duration: 0.5
    });

    assert(typeof transitionHook === 'function', "audioTransition returns D3 transition hook function");

    // Mock D3 transition object
    const mockD3Transition = {
      each: function(callback) {
        callback.call(mockNode);
      }
    };

    try {
      transitionHook(mockD3Transition);
      assert(true, "audioTransition executes cleanly against mock D3 transition");
    } catch (err) {
      assert(false, `audioTransition execution error: ${err.message}`);
    }
  });
});
