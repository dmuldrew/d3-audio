import { wiggle } from './presets/wiggle.js';
import { flip } from './presets/flip.js';
import { pulse } from './presets/pulse.js';
import { bounce } from './presets/bounce.js';
import { shake } from './presets/shake.js';
import { ripple } from './presets/ripple.js';
import { glow } from './presets/glow.js';
import { squash } from './presets/squash.js';

export const PRESETS = {
  wiggle,
  flip,
  pulse,
  bounce,
  shake,
  ripple,
  glow,
  squash
};

// For each element, the inline value every style property had before the
// movements currently writing it began, plus how many of them are writing it.
// A property is restored when its last writer ends, so overlapping movements
// never restore another movement's mid-animation frame, and a short movement's
// properties come back on time even while a longer one keeps running.
const restingStyles = new WeakMap();

// Writes an inline style on behalf of one movement, which tracks the
// properties it has claimed in `claims`.
function writeStyle(el, claims, prop, value) {
  if (!claims.has(prop)) {
    let props = restingStyles.get(el);
    if (!props) {
      props = new Map();
      restingStyles.set(el, props);
    }
    let resting = props.get(prop);
    if (!resting) {
      resting = { writers: 0, value: el.style[prop] || '' };
      props.set(prop, resting);
    }
    resting.writers++;
    claims.add(prop);
  }
  el.style[prop] = value;
}

// Releases a movement's claims, restoring each property it was the last writer of.
function releaseStyles(el, claims) {
  const props = restingStyles.get(el);
  if (!props) return;
  for (const prop of claims) {
    const resting = props.get(prop);
    resting.writers--;
    if (resting.writers === 0) {
      el.style[prop] = resting.value;
      props.delete(prop);
    }
  }
  claims.clear();
  if (props.size === 0) restingStyles.delete(el);
}

/**
 * Creates a D3 choreography animator that applies rhythmic physical movements to DOM/SVG elements.
 * 
 * @example
 * const choreo = choreography()
 *   .movement("wiggle")
 *   .duration(0.4)
 *   .intensity(d => d.value / 10);
 * 
 * d3.selectAll(".bubble").call(choreo);
 */
export function choreography() {
  let movementType = "wiggle"; // string or custom function (t, options) => { transform, ... }
  let durationVal = 0.35; // seconds
  let intensityAccessor = 1.0;
  let optionsAccessor = {};
  let onStartCallback = null;
  let onProgressCallback = null;
  let onEndCallback = null;

  function resolveMovementFn() {
    if (typeof movementType === 'function') {
      return movementType;
    }
    return PRESETS[movementType] || PRESETS.wiggle;
  }

  function resolveValue(accessor, datum, index, nodes) {
    if (typeof accessor === 'function') {
      return accessor(datum, index, nodes);
    }
    return accessor;
  }

  function animateElement(element, datum, index, nodes) {
    if (!element) return;

    const el = element.node ? element.node() : element;
    if (!el) return;

    const durationSec = resolveValue(durationVal, datum, index, nodes) || 0.35;
    const durationMs = durationSec * 1000;
    const intensity = resolveValue(intensityAccessor, datum, index, nodes) ?? 1.0;
    const extraOpts = resolveValue(optionsAccessor, datum, index, nodes) || {};
    const moveFn = typeof extraOpts.movement === 'function' ? extraOpts.movement :
      (extraOpts.movement ? PRESETS[extraOpts.movement] : resolveMovementFn());

    const options = {
      intensity,
      ...extraOpts
    };

    const claims = new Set();

    // Ensure transform origin is set for SVG/DOM elements
    const isSvg = typeof SVGElement !== 'undefined' && el instanceof SVGElement;
    if (isSvg) {
      writeStyle(el, claims, 'transformBox', 'fill-box');
    }
    writeStyle(el, claims, 'transformOrigin', extraOpts.origin || 'center');

    const rAF = typeof requestAnimationFrame !== 'undefined'
      ? requestAnimationFrame
      : (cb) => setTimeout(() => cb(Date.now()), 16);
    const cAF = typeof cancelAnimationFrame !== 'undefined'
      ? cancelAnimationFrame
      : (id) => clearTimeout(id);

    let startTime = null;
    let animId = null;
    let finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      releaseStyles(el, claims);
    }

    if (onStartCallback) {
      onStartCallback(el, datum, index);
    }

    function step(timestamp) {
      if (finished) return;
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const t = Math.min(1.0, elapsed / durationMs);

      const frameResult = moveFn(t, options);

      // Apply transform & styling
      if (frameResult.transform !== undefined) {
        const transform = frameResult.transform === 'none' ? '' : frameResult.transform;
        writeStyle(el, claims, 'transform', transform);
      }

      if (frameResult.filter !== undefined) {
        writeStyle(el, claims, 'filter', frameResult.filter);
      }

      if (frameResult.opacity !== undefined && movementType === 'ripple') {
        writeStyle(el, claims, 'opacity', frameResult.opacity);
      }

      if (onProgressCallback) {
        onProgressCallback(t, frameResult, el, datum);
        // The callback may have cancelled the movement
        if (finished) return;
      }

      if (t < 1.0) {
        animId = rAF(step);
      } else {
        // Return the element to the inline styles it had before moving
        finish();

        if (onEndCallback) {
          onEndCallback(el, datum, index);
        }
      }
    }

    animId = rAF(step);

    return {
      cancel: () => {
        if (animId) cAF(animId);
        finish();
      }
    };
  }

  function choreo(selection) {
    if (!selection) return;

    if (selection.each) {
      selection.each(function(d, i, nodes) {
        animateElement(this, d, i, nodes);
      });
    } else {
      animateElement(selection, selection.__data__, 0, [selection]);
    }
  }

  choreo.trigger = function(element, options = {}) {
    return animateElement(element, element.__data__ || null, 0, [element]);
  };

  choreo.movement = function(_) {
    if (!arguments.length) return movementType;
    movementType = _;
    return choreo;
  };

  choreo.duration = function(_) {
    if (!arguments.length) return durationVal;
    durationVal = _;
    return choreo;
  };

  choreo.intensity = function(_) {
    if (!arguments.length) return intensityAccessor;
    intensityAccessor = _;
    return choreo;
  };

  choreo.options = function(_) {
    if (!arguments.length) return optionsAccessor;
    optionsAccessor = _;
    return choreo;
  };

  choreo.onStart = function(cb) {
    if (!arguments.length) return onStartCallback;
    onStartCallback = cb;
    return choreo;
  };

  choreo.onProgress = function(cb) {
    if (!arguments.length) return onProgressCallback;
    onProgressCallback = cb;
    return choreo;
  };

  choreo.onEnd = function(cb) {
    if (!arguments.length) return onEndCallback;
    onEndCallback = cb;
    return choreo;
  };

  return choreo;
}
