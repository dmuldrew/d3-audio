import {
  scalePitch,
  scaleFilter,
  scalePan,
  audioLegend,
  choreography,
  defaultEngine,
  audioRamp
} from '../../src/index.js';

// Visual Container & SVG Setup
const container = document.getElementById('chart-area');
const width = container.clientWidth || 900;
const height = container.clientHeight || 400;

const svg = d3.select(container)
  .append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`);

// Audio Signal Chain: Synth -> Vibrato -> Resonant Filter -> Panner -> Destination
const carrierFilter = new Tone.Filter({
  frequency: 2400,
  type: "lowpass",
  rolloff: -24,
  Q: 4.0
});

const carrierPanner = new Tone.Panner(0);

const carrierVibrato = new Tone.Vibrato({
  frequency: 5.5,
  depth: 0.05
});

const carrierSynth = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.15, decay: 0.1, sustain: 1.0, release: 0.4 }
});

// Chain connections
carrierSynth.connect(carrierVibrato);
carrierVibrato.connect(carrierFilter);
carrierFilter.connect(carrierPanner);
carrierPanner.toDestination();

// Scales
const pitchScale = scalePitch()
  .domain([0, 1])
  .range(["E2", "E5"]);

const filterScale = scaleFilter()
  .domain([0, 1])
  .range([200, 14000])
  .type("logarithmic");

const panScale = scalePan()
  .domain([0, width])
  .range([-0.95, 0.95]);

// Mount Audio Legend
const legend = audioLegend()
  .title("Continuous Sound Parameter Mapping (PMSon)")
  .pitch(pitchScale, "Continuous Pitch Glissando (80 Hz Bass ➔ 1,200 Hz Treble)")
  .filter(filterScale, "Continuous Resonant Cutoff (200 Hz Deep ➔ 14,000 Hz Bright)")
  .pan(panScale, "Continuous Stereo Vector (-1.0 Left ↔ +1.0 Right)");

d3.select("#legend-mount").call(legend);

// State Variables
let isAudioActive = false;
let isPlaying = false;
let soundMode = 'continuous'; // 'continuous' | 'discrete'
let visualMode = 'stream';    // 'stream' | 'theremin' | 'laser'
let streamProfile = 'ocean';  // 'ocean' | 'seismic' | 'eeg'

let currentFreq = 440;
let currentCutoff = 2400;
let currentPan = 0;
let currentDerivative = 0;
let previousValue = 0.5;

let pointerX = width / 2;
let pointerY = height / 2;
let isPointerDown = false;

// Mode A: Stream buffer
const NUM_STREAM_POINTS = 64;
const streamPoints = d3.range(0, NUM_STREAM_POINTS).map(i => ({
  x: (i / (NUM_STREAM_POINTS - 1)) * width,
  y: height / 2
}));

// Mode C: Laser Scan curve
const NUM_SCAN_POINTS = 80;
const scanCurve = d3.range(0, NUM_SCAN_POINTS).map(i => {
  const t = i / (NUM_SCAN_POINTS - 1);
  // Multi-peak topographic curve with inflections
  const yNorm = 0.5 
    + 0.28 * Math.sin(t * Math.PI * 3) 
    + 0.15 * Math.sin(t * Math.PI * 7 + 0.4) 
    - 0.12 * Math.cos(t * Math.PI * 11);
  return {
    x: t * width,
    y: height * (1 - Math.max(0.08, Math.min(0.92, yNorm)))
  };
});
let laserPosition = 0;
let laserDirection = 1;

// Line Generator
const lineGen = d3.line()
  .x(d => d.x)
  .y(d => d.y)
  .curve(d3.curveBasis);

// SVG Visual Layers
const gridLayer = svg.append('g').attr('class', 'grid-layer');
const curveLayer = svg.append('g').attr('class', 'curve-layer');
const interactiveLayer = svg.append('g').attr('class', 'interactive-layer');

// Grid Lines & Labels
gridLayer.append('line')
  .attr('x1', 0).attr('y1', height / 2).attr('x2', width).attr('y2', height / 2)
  .attr('stroke', 'rgba(56, 189, 248, 0.12)').attr('stroke-dasharray', '4,4');

gridLayer.append('line')
  .attr('x1', width / 2).attr('y1', 0).attr('x2', width / 2).attr('y2', height)
  .attr('stroke', 'rgba(56, 189, 248, 0.12)').attr('stroke-dasharray', '4,4');

// Stream Waveform Path
const wavePath = curveLayer.append('path')
  .attr('fill', 'none')
  .attr('stroke', '#38bdf8')
  .attr('stroke-width', 3)
  .attr('filter', 'drop-shadow(0 0 8px rgba(56,189,248,0.4))');

// Static Scan Curve Path (Hidden until laser mode)
const scanPath = curveLayer.append('path')
  .datum(scanCurve)
  .attr('fill', 'none')
  .attr('stroke', '#a78bfa')
  .attr('stroke-width', 2.5)
  .attr('stroke-dasharray', '6,3')
  .attr('opacity', 0)
  .attr('d', lineGen(scanCurve));

// Laser Line & Target Head
const laserLine = interactiveLayer.append('line')
  .attr('y1', 0).attr('y2', height)
  .attr('stroke', '#fbbf24')
  .attr('stroke-width', 2)
  .attr('opacity', 0);

const laserPoint = interactiveLayer.append('circle')
  .attr('r', 7)
  .attr('fill', '#fbbf24')
  .attr('stroke', '#ffffff')
  .attr('stroke-width', 2)
  .attr('opacity', 0)
  .attr('filter', 'drop-shadow(0 0 10px #fbbf24)');

// Leading Wave Head / Theremin Crosshair Point
const targetNode = interactiveLayer.append('g').attr('class', 'target-node');
const targetRings = targetNode.append('circle')
  .attr('r', 16)
  .attr('fill', 'none')
  .attr('stroke', '#38bdf8')
  .attr('stroke-width', 1.5)
  .attr('opacity', 0.6);
const targetCore = targetNode.append('circle')
  .attr('r', 5)
  .attr('fill', '#38bdf8');

// Sound Generator & Synthesizer Controller
let streamPhase = 0;
let lastDiscreteTime = 0;

function computeStreamSignal(dt) {
  streamPhase += dt * 2.2;
  let val = 0.5;

  if (streamProfile === 'ocean') {
    // Majestic deep ocean rolling thermal layers
    val = 0.5 
      + 0.32 * Math.sin(streamPhase * 0.8) 
      + 0.12 * Math.sin(streamPhase * 1.7) 
      + 0.05 * Math.cos(streamPhase * 3.1);
  } else if (streamProfile === 'seismic') {
    // Geological micro-fractures with steep rupture spikes
    const microTremor = 0.08 * Math.sin(streamPhase * 9.5) + 0.04 * Math.sin(streamPhase * 17.3);
    const rupture = Math.sin(streamPhase * 0.4);
    val = 0.5 + microTremor + (rupture > 0.88 ? (rupture - 0.88) * 3.5 : 0);
  } else {
    // EEG Brainwave (Alpha burst ~10Hz & Theta drift)
    val = 0.5 
      + 0.22 * Math.sin(streamPhase * 4.2) 
      + 0.18 * Math.sin(streamPhase * 7.8) 
      * Math.cos(streamPhase * 0.7);
  }

  return Math.max(0.04, Math.min(0.96, val));
}

// Map normalized value [0, 1] to continuous frequency (Hz)
function normToFreq(norm) {
  // Continuous logarithmic frequency: 80 Hz (E2) to 1200 Hz (D6)
  return 80 * Math.pow(1200 / 80, norm);
}

// Update Audio Parameters & UI
function applySoundParameters(freq, cutoff, pan, derivative, nowSec) {
  currentFreq = freq;
  currentCutoff = cutoff;
  currentPan = pan;
  currentDerivative = derivative;

  // Update UI Telemetry HUD
  document.getElementById('val-pitch').innerText = `${freq.toFixed(1)} Hz`;
  document.getElementById('val-filter').innerText = `${Math.round(cutoff).toLocaleString()} Hz`;
  const panLabel = pan < -0.05 ? `${Math.abs(pan).toFixed(2)} L` : pan > 0.05 ? `${pan.toFixed(2)} R` : `0.00 C`;
  document.getElementById('val-pan').innerText = panLabel;
  document.getElementById('val-derivative').innerText = `${derivative >= 0 ? '+' : ''}${derivative.toFixed(2)}`;

  document.getElementById('hud-y').innerText = `${freq.toFixed(1)} Hz`;
  document.getElementById('hud-x').innerText = panLabel;

  if (!isPlaying) return;

  const rampTime = 0.045; // 45ms liquid-smooth gliding transition

  if (soundMode === 'continuous') {
    // 〰️ True Unbroken Continuous Glissando
    carrierSynth.frequency.rampTo(freq, rampTime);
    carrierFilter.frequency.rampTo(cutoff, rampTime);
    carrierPanner.pan.rampTo(pan, rampTime);

    // Instantaneous derivative modulates vibrato depth & harmonic overtones
    const vibDepth = Math.min(Math.abs(derivative) * 0.04, 0.75);
    carrierVibrato.depth.rampTo(vibDepth, rampTime);
  } else {
    // 🎹 Discrete Quantized Mode (Triggers notes on interval)
    if (nowSec - lastDiscreteTime > 0.18) {
      lastDiscreteTime = nowSec;
      const note = pitchScale(Math.max(0, Math.min(1, (freq - 80) / (1200 - 80))));
      carrierSynth.triggerAttackRelease(note, "16n", undefined, 0.7);
      carrierFilter.frequency.rampTo(cutoff, 0.08);
      carrierPanner.pan.rampTo(pan, 0.08);
    }
  }
}

// Animation Loop (60 FPS)
let lastTimestamp = performance.now();

function animate(timestamp) {
  const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
  lastTimestamp = timestamp;
  const nowSec = Tone.now();

  if (visualMode === 'stream') {
    // Hide laser elements
    scanPath.attr('opacity', 0);
    laserLine.attr('opacity', 0);
    laserPoint.attr('opacity', 0);
    wavePath.attr('opacity', 1);

    if (isPlaying) {
      const normVal = computeStreamSignal(dt);
      const dy = (normVal - previousValue) / Math.max(dt, 0.016);
      previousValue = normVal;

      // Update wave points buffer
      streamPoints.shift();
      const targetY = height * (1 - normVal);
      streamPoints.push({ x: width, y: targetY });

      streamPoints.forEach((pt, i) => {
        pt.x = (i / (NUM_STREAM_POINTS - 1)) * width;
      });

      wavePath.attr('d', lineGen(streamPoints));

      // Head position
      const headX = width;
      const headY = targetY;
      targetNode.attr('transform', `translate(${headX - 10}, ${headY})`);

      // Audio mapping
      const freq = normToFreq(normVal);
      const cutoff = 400 + normVal * 9000;
      const pan = (Math.sin(streamPhase * 0.5)) * 0.75;

      applySoundParameters(freq, cutoff, pan, dy, nowSec);
    }
  } else if (visualMode === 'theremin') {
    // Theremin 2D Vector Pad
    scanPath.attr('opacity', 0);
    laserLine.attr('opacity', 0);
    laserPoint.attr('opacity', 0);
    wavePath.attr('opacity', 0.25);

    // Target tracks pointer
    targetNode.attr('transform', `translate(${pointerX}, ${pointerY})`);

    const normY = 1 - (pointerY / height);
    const normX = pointerX / width;

    const freq = normToFreq(normY);
    const cutoff = filterScale(normY);
    const pan = panScale(pointerX);
    const dy = (normY - previousValue) / Math.max(dt, 0.016);
    previousValue = normY;

    applySoundParameters(freq, cutoff, pan, dy, nowSec);
  } else if (visualMode === 'laser') {
    // Continuous Laser Curve Scanner
    scanPath.attr('opacity', 1);
    wavePath.attr('opacity', 0.15);
    laserLine.attr('opacity', 0.85);
    laserPoint.attr('opacity', 1);

    if (isPlaying) {
      laserPosition += laserDirection * dt * (width * 0.22);
      if (laserPosition >= width) {
        laserPosition = width;
        laserDirection = -1;
      } else if (laserPosition <= 0) {
        laserPosition = 0;
        laserDirection = 1;
      }
    }

    // Interpolate curve height at laserPosition
    const t = laserPosition / width;
    const idx = t * (NUM_SCAN_POINTS - 1);
    const i0 = Math.floor(idx);
    const i1 = Math.min(i0 + 1, NUM_SCAN_POINTS - 1);
    const frac = idx - i0;
    const curveY = scanCurve[i0].y * (1 - frac) + scanCurve[i1].y * frac;

    laserLine.attr('x1', laserPosition).attr('x2', laserPosition);
    laserPoint.attr('cx', laserPosition).attr('cy', curveY);
    targetNode.attr('transform', `translate(${laserPosition}, ${curveY})`);

    const normY = 1 - (curveY / height);
    const freq = normToFreq(normY);
    const cutoff = 300 + normY * 11000;
    const pan = panScale(laserPosition);
    const dy = (normY - previousValue) / Math.max(dt, 0.016);
    previousValue = normY;

    applySoundParameters(freq, cutoff, pan, dy, nowSec);
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// Mouse & Touch Interaction on Canvas
svg.on('pointerdown', (e) => {
  isPointerDown = true;
  updatePointerCoordinates(e);
  if (!isPlaying) togglePlayback(true);
});

svg.on('pointermove', (e) => {
  if (isPointerDown || visualMode === 'theremin') {
    updatePointerCoordinates(e);
  }
});

window.addEventListener('pointerup', () => {
  isPointerDown = false;
});

function updatePointerCoordinates(e) {
  const [x, y] = d3.pointer(e, svg.node());
  pointerX = Math.max(0, Math.min(width, x));
  pointerY = Math.max(0, Math.min(height, y));
  if (visualMode === 'laser') {
    laserPosition = pointerX;
  }
}

// Playback Transport Toggle
async function togglePlayback(forceStart = false) {
  await defaultEngine.start();
  isAudioActive = true;

  if (isPlaying && !forceStart) {
    isPlaying = false;
    carrierSynth.triggerRelease();
    document.getElementById('stream-toggle-btn').innerText = "▶ Start Continuous Sound";
  } else {
    isPlaying = true;
    if (soundMode === 'continuous') {
      carrierSynth.triggerAttack(currentFreq);
    }
    document.getElementById('stream-toggle-btn').innerText = "⏸ Pause Continuous Sound";
  }
}

document.getElementById('stream-toggle-btn').addEventListener('click', () => {
  togglePlayback();
});

// Sound Mode Toggle (Continuous Glissando vs Discrete Notes)
document.getElementById('mode-continuous').addEventListener('click', () => {
  soundMode = 'continuous';
  document.getElementById('mode-continuous').classList.add('active');
  document.getElementById('mode-discrete').classList.remove('active');
  document.getElementById('hud-mode').innerText = "Continuous Glissando";
  document.getElementById('hud-mode').style.color = "var(--green)";
  if (isPlaying) {
    carrierSynth.triggerAttack(currentFreq);
  }
});

document.getElementById('mode-discrete').addEventListener('click', () => {
  soundMode = 'discrete';
  document.getElementById('mode-discrete').classList.add('active');
  document.getElementById('mode-continuous').classList.remove('active');
  document.getElementById('hud-mode').innerText = "Discrete Notes";
  document.getElementById('hud-mode').style.color = "var(--gold)";
  if (isPlaying) {
    carrierSynth.triggerRelease();
  }
});

// Interactive Space Mode Selectors
document.getElementById('vmode-stream').addEventListener('click', () => {
  visualMode = 'stream';
  setActiveVisualButton('vmode-stream');
  document.getElementById('dataset-group').style.display = 'flex';
});

document.getElementById('vmode-theremin').addEventListener('click', () => {
  visualMode = 'theremin';
  setActiveVisualButton('vmode-theremin');
  document.getElementById('dataset-group').style.display = 'none';
});

document.getElementById('vmode-laser').addEventListener('click', () => {
  visualMode = 'laser';
  setActiveVisualButton('vmode-laser');
  document.getElementById('dataset-group').style.display = 'none';
});

function setActiveVisualButton(activeId) {
  ['vmode-stream', 'vmode-theremin', 'vmode-laser'].forEach(id => {
    document.getElementById(id).classList.toggle('active', id === activeId);
  });
}

// Stream Profile Selector
document.getElementById('signal-select').addEventListener('change', (e) => {
  streamProfile = e.target.value;
});
