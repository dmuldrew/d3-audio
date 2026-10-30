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

  test("Movements restore the element's own inline styles", async () => {
    const run = (movement, node) => {
      const choreo = choreography().movement(movement).duration(0.05);
      const ended = new Promise(resolve => choreo.onEnd(resolve));
      const handle = choreo.trigger(node);
      return { ended, handle };
    };

    // Transform restored after a transform movement
    const positioned = createMockNode();
    positioned.style.transform = "translate(10px, 20px)";
    await run("wiggle", positioned).ended;
    assertEqual(positioned.style.transform, "translate(10px, 20px)", "Transform-based movement restores the element's original transform");

    // Filter restored after a filter movement; transform untouched by glow
    const filtered = createMockNode();
    filtered.style.filter = "blur(1px)";
    filtered.style.transform = "scale(2)";
    await run("glow", filtered).ended;
    assertEqual(filtered.style.filter, "blur(1px)", "Filter-based movement restores the element's original filter");
    assertEqual(filtered.style.transform, "scale(2)", "Movement leaves styles it never animated untouched");

    // Ripple restores opacity
    const faded = createMockNode();
    faded.style.opacity = "0.5";
    await run("ripple", faded).ended;
    assertEqual(faded.style.opacity, "0.5", "Ripple restores the element's original opacity");

    // Cancelling mid-movement also restores
    const cancelled = createMockNode();
    cancelled.style.transform = "rotate(5deg)";
    const { handle } = run("wiggle", cancelled);
    await new Promise(resolve => setTimeout(resolve, 25));
    handle.cancel();
    assertEqual(cancelled.style.transform, "rotate(5deg)", "cancel() restores the element's original transform");
  });

  test("Overlapping movements restore the pre-movement styles, not a mid-animation frame", async () => {
    const node = createMockNode();
    node.style.transform = "translate(4px, 4px)";

    const first = choreography().movement("wiggle").duration(0.1);
    const second = choreography().movement("pulse").duration(0.1);
    const firstEnded = new Promise(resolve => first.onEnd(resolve));
    const secondEnded = new Promise(resolve => second.onEnd(resolve));

    first.trigger(node);
    await new Promise(resolve => setTimeout(resolve, 50));
    assert(node.style.transform !== "translate(4px, 4px)", "First movement is mid-animation when the second starts");
    second.trigger(node);

    await firstEnded;
    assert(node.style.transform !== "translate(4px, 4px)", "Styles are not restored while another movement is still running");
    await secondEnded;
    assertEqual(node.style.transform, "translate(4px, 4px)", "Styles return to the pre-movement transform after the last movement ends");
  });

  test("Each style comes back when the last movement writing it ends", async () => {
    const node = createMockNode();
    node.style.filter = "blur(1px)";
    node.style.transform = "translate(4px, 4px)";

    const wiggle = choreography().movement("wiggle").duration(0.3);
    const glow = choreography().movement("glow").duration(0.05);
    const wiggleEnded = new Promise(resolve => wiggle.onEnd(resolve));
    const glowEnded = new Promise(resolve => glow.onEnd(resolve));

    wiggle.trigger(node);
    glow.trigger(node);
    await glowEnded;
    assertEqual(node.style.filter, "blur(1px)", "A short glow restores the filter on time while a longer wiggle is still running");
    assert(node.style.transform !== "translate(4px, 4px)", "The longer wiggle is still animating the transform");

    await wiggleEnded;
    assertEqual(node.style.transform, "translate(4px, 4px)", "The transform comes back when the wiggle ends");
  });

  test("Movements restore the transform origin they set", async () => {
    const node = createMockNode();
    node.style.transformOrigin = "left top";
    const choreo = choreography().movement("pulse").duration(0.05);
    const ended = new Promise(resolve => choreo.onEnd(resolve));
    choreo.trigger(node);
    assertEqual(node.style.transformOrigin, "center", "Movement centres the transform origin while running");
    await ended;
    assertEqual(node.style.transformOrigin, "left top", "Movement restores the element's transform origin");
  });

  test("cancel() from inside onProgress stops the movement for good", async () => {
    const node = createMockNode();
    node.style.transform = "rotate(5deg)";
    let handle;
    let frames = 0;
    const choreo = choreography()
      .movement("wiggle")
      .duration(0.2)
      .onProgress(() => {
        frames++;
        handle.cancel();
      });

    handle = choreo.trigger(node);
    await new Promise(resolve => setTimeout(resolve, 120));
    assertEqual(frames, 1, "No frames run after cancel() is called from onProgress");
    assertEqual(node.style.transform, "rotate(5deg)", "The transform stays restored after an in-callback cancel()");
  });
});
