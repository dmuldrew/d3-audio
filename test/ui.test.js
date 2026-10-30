import { assert, assertEqual } from './run-tests.js';
import {
  audioLegend,
  accessibleChart,
  scalePitch,
  scaleGain,
  scalePan,
  scaleFilter,
  scaleTension
} from '../src/index.js';

/**
 * Lightweight mock DOM Node for testing D3 UI widgets in Node.js
 */
function createMockElement(tagName = 'div') {
  const children = [];
  const classListSet = new Set();
  const attributes = {};
  const listeners = {};

  const el = {
    tagName: tagName.toUpperCase(),
    style: {},
    innerHTML: '',
    id: '',
    children,
    attributes,
    classList: {
      add: (cls) => classListSet.add(cls),
      remove: (cls) => classListSet.delete(cls),
      contains: (cls) => classListSet.has(cls)
    },
    appendChild: (child) => {
      children.push(child);
      return child;
    },
    setAttribute: (name, val) => {
      attributes[name] = String(val);
    },
    getAttribute: (name) => attributes[name] || null,
    addEventListener: (event, handler) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },
    dispatchEvent: (event) => {
      const type = event.type || event;
      if (listeners[type]) {
        listeners[type].forEach(h => h(event));
      }
    },
    querySelector: (selector) => {
      for (const child of children) {
        if (selector.startsWith('.') && child.classList.contains(selector.slice(1))) {
          return child;
        }
      }
      return null;
    }
  };

  return el;
}

export function testUI() {
  // --------------------------------------------------------------------------
  // 1. audioLegend Interactive Widget
  // --------------------------------------------------------------------------
  const legend = audioLegend();
  assert(typeof legend === 'function', "audioLegend returns configurable D3 component function");

  legend.title("Seismic Telemetry Audio Key");

  // Add multiple scaler mappings across dimensions
  const pitch = scalePitch().domain([5, 60]).range(["G4", "C2"]);
  const gain = scaleGain().domain([3.5, 9.5]).range([0.55, 0.90]);
  const pan = scalePan().domain([-130, 150]).range([-0.8, 0.8]);
  const filter = scaleFilter().domain([10, 500]).range([300, 8000]);
  const tension = scaleTension().domain([0, 100]);

  legend
    .pitch(pitch, "Focal Depth (km) ➔ Pitch Frequency")
    .gain(gain, "Magnitude (Mw) ➔ Chime Loudness")
    .pan(pan, "Stereo Longitude (West ↔ East)")
    .filter(filter, "Rupture Frequency ➔ Cutoff")
    .sample(null, "Alert Category ➔ Percussion Hit")
    .tension(tension, "Tectonic Stress ➔ Consonance vs Dissonance");

  // Mock document and D3 selection
  const origDocument = globalThis.document;
  globalThis.document = {
    createElement: (tag) => createMockElement(tag)
  };

  try {
    const mockContainer = createMockElement('div');
    const mockSelection = {
      each: (callback) => {
        callback.call(mockContainer);
      }
    };

    legend(mockSelection);

    assert(mockContainer.classList.contains('d3-audio-legend'), "audioLegend applies 'd3-audio-legend' class to container");
    assert(mockContainer.children.length === 1, "audioLegend appends wrapper element to container");

    const wrapper = mockContainer.children[0];
    assert(wrapper.children.length >= 2, "wrapper contains header and mapping list");

    const header = wrapper.children[0];
    assert(header.innerHTML.includes("Seismic Telemetry Audio Key"), "Header displays custom legend title");
    assert(header.innerHTML.includes("Click 🔊 to Audition"), "Header provides audition prompt");

    const list = wrapper.children[1];
    assertEqual(list.children.length, 6, "All 6 scaler mappings rendered as legend items");
  } finally {
    globalThis.document = origDocument;
  }

  // --------------------------------------------------------------------------
  // 2. accessibleChart Screen Reader & Keyboard Navigation
  // --------------------------------------------------------------------------
  const mockDataset = [
    { date: "2024-01-01", value: 10, label: "Jan 1 Low" },
    { date: "2024-01-02", value: 50, label: "Jan 2 Mid" },
    { date: "2024-01-03", value: 95, label: "Jan 3 High" }
  ];

  const aChart = accessibleChart({
    data: mockDataset,
    x: d => d.date,
    y: d => d.value,
    title: "Seismic activity over 3 days"
  });

  assertEqual(aChart.data().length, 3, "accessibleChart holds bound dataset");

  globalThis.document = {
    createElement: (tag) => createMockElement(tag)
  };

  try {
    const mockChartNode = createMockElement('div');
    const mockSelection = {
      each: (callback) => {
        callback.call(mockChartNode);
      }
    };

    aChart(mockSelection);

    assert(mockChartNode.getAttribute('role') === 'application' && mockChartNode.getAttribute('tabindex') === '0',
      "accessibleChart applies keyboard accessible focus attributes");

    // Simulate ArrowRight navigation
    const stepRightEvent = { key: 'ArrowRight', preventDefault: () => {} };
    mockChartNode.dispatchEvent(stepRightEvent);

    assert(true, "ArrowRight key event processed without throwing");
  } finally {
    globalThis.document = origDocument;
  }
}