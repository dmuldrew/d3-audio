import { assert, assertEqual, assertClose } from './run-tests.js';
import {
  SoundEngine,
  defaultEngine,
  SynthVoice,
  createSynth,
  SamplePlayer,
  createSamplePlayer,
  GranularScrubber,
  createGranularScrubber
} from '../src/index.js';

/**
 * Creates a lightweight mock Tone.js harness for testing audio graph wiring,
 * routing, parameter mapping, and voice lifecycle in headless Node environments.
 */
function createMockTone() {
  const mockContext = {
    state: 'suspended',
    sampleRate: 44100,
    resume: async function() { mockContext.state = 'running'; return Promise.resolve(); },
    rawContext: {
      state: 'suspended',
      sampleRate: 44100,
      resume: async function() { this.state = 'running'; return Promise.resolve(); },
      createBuffer: (channels, length, rate) => ({
        channels, length, rate,
        getChannelData: () => new Float32Array(length)
      }),
      createBufferSource: () => ({
        buffer: null,
        connect: () => {},
        start: () => {}
      }),
      destination: {}
    }
  };

  class MockParam {
    constructor(val = 0) {
      this.value = val;
    }
    rampTo(newVal, rampTime) {
      this.value = newVal;
    }
  }

  class MockAudioNode {
    constructor(val) {
      this.value = val;
      this.connectedTo = null;
      this.disposed = false;
    }
    connect(dest) {
      this.connectedTo = dest;
      return this;
    }
    toDestination() {
      this.connectedTo = 'destination';
      return this;
    }
    dispose() {
      this.disposed = true;
    }
  }

  class MockGain extends MockAudioNode {
    constructor(val = 1) {
      super();
      this.gain = new MockParam(val);
    }
  }

  class MockVolume extends MockAudioNode {
    constructor(vol = 0) {
      super();
      this.volume = new MockParam(vol);
    }
  }

  class MockPanner extends MockAudioNode {
    constructor(pan = 0) {
      super();
      this.pan = new MockParam(pan);
    }
  }

  class MockFilter extends MockAudioNode {
    constructor(options = {}, type = "lowpass") {
      super();
      const freq = typeof options === 'number' ? options : (options.frequency || 20000);
      this.frequency = new MockParam(freq);
      this.Q = new MockParam(options.Q || 1);
      this.type = type;
    }
  }

  class MockFreeverb extends MockAudioNode {
    constructor() {
      super();
      this.roomSize = new MockParam(0.65);
      this.wet = new MockParam(0.12);
      this.dampening = 3500;
    }
  }

  class MockFeedbackDelay extends MockAudioNode {
    constructor(delayTime = "8n.", feedback = 0.2) {
      super();
      this.delayTime = new MockParam(delayTime);
      this.feedback = new MockParam(feedback);
      this.wet = new MockParam(0.1);
    }
  }

  class MockSynth extends MockAudioNode {
    constructor() {
      super();
      this.history = [];
    }
    triggerAttackRelease(note, duration, time, velocity) {
      this.history.push({ type: 'triggerAttackRelease', note, duration, time, velocity });
    }
    triggerAttack(note, time, velocity) {
      this.history.push({ type: 'triggerAttack', note, time, velocity });
    }
    triggerRelease(time) {
      this.history.push({ type: 'triggerRelease', time });
    }
    releaseAll(time) {
      this.history.push({ type: 'releaseAll', time });
    }
  }

  class MockGrainPlayer extends MockAudioNode {
    constructor(options = {}) {
      super();
      this.buffer = options.buffer || { duration: 4.0 };
      this.grainSize = options.grainSize || 0.05;
      this.overlap = options.overlap || 0.02;
      this.playbackRate = options.playbackRate || 1.0;
      this.isPlaying = false;
      this.scrubOffset = 0;
    }
    start(time, offset) {
      this.isPlaying = true;
      this.scrubOffset = offset || 0;
    }
    stop() {
      this.isPlaying = false;
    }
  }

  class MockToneAudioBuffer {
    constructor(buf) {
      this.buffer = buf;
      this.duration = 4.0;
    }
  }

  return {
    context: mockContext,
    start: async () => Promise.resolve(),
    now: () => 0,
    dbToGain: (db) => Math.pow(10, db / 20),
    gainToDb: (gain) => 20 * Math.log10(gain),
    Gain: MockGain,
    Volume: MockVolume,
    Panner: MockPanner,
    Filter: MockFilter,
    Freeverb: MockFreeverb,
    FeedbackDelay: MockFeedbackDelay,
    PolySynth: MockSynth,
    Synth: MockSynth,
    FMSynth: MockSynth,
    AMSynth: MockSynth,
    MonoSynth: MockSynth,
    MembraneSynth: MockSynth,
    NoiseSynth: MockSynth,
    MetalSynth: MockSynth,
    PluckSynth: MockSynth,
    GrainPlayer: MockGrainPlayer,
    ToneAudioBuffer: MockToneAudioBuffer,
    getDestination: () => new MockAudioNode('masterDestination')
  };
}

export function testAudio() {
  const mockTone = createMockTone();

  // --------------------------------------------------------------------------
  // 1. SoundEngine & defaultEngine
  // --------------------------------------------------------------------------
  const engine = new SoundEngine();
  engine.setTone(mockTone);

  assert(engine !== null, "SoundEngine instantiated");
  assertEqual(engine.isReady, false, "SoundEngine starts not ready before start()");

  // Master bus routing
  const masterIn = engine.getMasterInput();
  assert(masterIn !== null, "getMasterInput() returns valid master node");
  assert(engine.masterGain !== null, "initMasterChain initializes masterGain");
  assert(engine.masterFilter !== null, "initMasterChain initializes masterFilter");

  // Volume controls (linear and dB)
  engine.setVolume(0.8, false);
  assertClose(engine.masterGain.gain.value, 0.8, 0.01, "setVolume linear 0.8 set correctly");

  engine.setVolume(-6, true);
  assertClose(engine.masterGain.gain.value, 0.501, 0.01, "setVolume dB -6 set correctly");

  // Filter controls
  engine.setFilter(4000, 2);
  assertEqual(engine.masterFilter.frequency.value, 4000, "setFilter frequency set to 4000 Hz");
  assertEqual(engine.masterFilter.Q.value, 2, "setFilter Q set to 2");

  // Reverb controls
  engine.setReverb(0.4);
  assertClose(engine.reverb.wet.value, 0.4, 0.01, "setReverb wet mix set to 0.4");

  // Voice registration and stopAll
  let voiceStopped = false;
  const dummyVoice = {
    id: "testVoice",
    releaseAll: () => { voiceStopped = true; }
  };
  engine.registerVoice(dummyVoice);
  assert(engine.voices.has(dummyVoice), "registerVoice adds voice to active set");
  engine.stopAll();
  assert(voiceStopped, "stopAll triggers releaseAll on registered voices");
  engine.unregisterVoice(dummyVoice);
  assert(!engine.voices.has(dummyVoice), "unregisterVoice removes voice from active set");

  // Hardware unlocking resilience in headless environment
  const rawCtx = mockTone.context.rawContext;
  engine.unlockIOS(rawCtx);
  assertEqual(rawCtx.state, 'running', "unlockIOS resumes suspended Web Audio context");

  engine.unlockIOSAudioSession();
  assert(true, "unlockIOSAudioSession completes gracefully without throwing");

  // --------------------------------------------------------------------------
  // 2. SynthVoice & createSynth
  // --------------------------------------------------------------------------
  const synth = createSynth({
    type: "polySynth",
    volume: -3,
    pan: -0.5,
    cutoff: 8000
  }, engine);

  assert(synth instanceof SynthVoice, "createSynth returns SynthVoice instance");
  assertEqual(synth.type, "polySynth", "SynthVoice preserves configured type");
  assert(synth.volumeNode !== null, "SynthVoice instantiates volume node");
  assert(synth.panner !== null, "SynthVoice instantiates panner node");

  // Panning & Volume modification
  synth.setPan(0.75);
  assertEqual(synth.panner.pan.value, 0.75, "setPan(0.75) updates panner node");

  synth.setVolume(-12);
  assertEqual(synth.volumeNode.volume.value, -12, "setVolume(-12) updates volume node");

  // Note triggering
  synth.triggerAttackRelease("C4", "8n", undefined, 0.85);
  assert(synth.instrument.history.length === 1, "triggerAttackRelease records note event");
  assertEqual(synth.instrument.history[0].note, "C4", "Triggered note matches C4");
  assertEqual(synth.instrument.history[0].velocity, 0.85, "Triggered velocity matches 0.85");

  synth.triggerAttack("E4", undefined, 0.7);
  synth.triggerRelease();
  assert(synth.instrument.history.length === 3, "triggerAttack & triggerRelease recorded in history");

  // Panning parameter override inside trigger
  synth.triggerAttackRelease("G4", "4n", undefined, 0.9, { pan: 0.2 });
  assertClose(synth.panner.pan.value, 0.2, 0.01, "triggerAttackRelease options override panner value");

  // Dispose voice
  synth.dispose();
  assert(synth.volumeNode.disposed, "synth.dispose() disposes volume node");
  assert(synth.panner.disposed, "synth.dispose() disposes panner node");

  // --------------------------------------------------------------------------
  // 3. SamplePlayer & createSamplePlayer
  // --------------------------------------------------------------------------
  const player = createSamplePlayer({
    volume: -2,
    pan: 0.3
  }, engine);

  assert(player instanceof SamplePlayer, "createSamplePlayer returns SamplePlayer instance");
  assertEqual(player.panner.pan.value, 0.3, "SamplePlayer pan initialized to 0.3");

  // Trigger synthesized soundbank instruments
  const drumTypes = ["kick", "snare", "hihat", "crash", "woodblock", "cowbell", "click"];
  drumTypes.forEach(type => {
    player.trigger(type, "8n", undefined, 0.8, { pan: -0.2 });
  });
  assert(true, "All built-in percussion soundbanks (kick, snare, hihat, crash, woodblock, cowbell, click) trigger without error");

  // Parameter override on percussion trigger
  player.trigger("kick", "8n", undefined, 0.95, { pan: 0.6 });
  assertClose(player.panner.pan.value, 0.6, 0.01, "SamplePlayer trigger option dynamically overrides pan");

  // Unknown sample name fallback resilience
  player.trigger("nonExistentSample", "16n");
  assert(true, "Unrecognized sample name triggers graceful fallback without throwing");

  player.dispose();
  assert(player.panner.disposed, "player.dispose() cleans up audio nodes");

  // --------------------------------------------------------------------------
  // 4. GranularScrubber & createGranularScrubber
  // --------------------------------------------------------------------------
  const scrubber = createGranularScrubber({
    grainSize: 0.08,
    overlap: 0.03,
    playbackRate: 1.2
  }, engine);

  assert(scrubber instanceof GranularScrubber, "createGranularScrubber returns GranularScrubber instance");
  assertEqual(scrubber.options.grainSize, 0.08, "GranularScrubber grainSize is 0.08");
  assertEqual(scrubber.options.overlap, 0.03, "GranularScrubber overlap is 0.03");
  assertEqual(scrubber.options.playbackRate, 1.2, "GranularScrubber playbackRate is 1.2");

  // Position scrubbing mapping
  scrubber.scrub(0.42);
  assertClose(scrubber.currentPosition, 0.42, 0.001, "scrubber.scrub(0.42) records position");

  // Out of bounds position clamping
  scrubber.scrub(-0.5);
  assertEqual(scrubber.currentPosition, 0, "scrubber.scrub(-0.5) clamps to 0");
  scrubber.scrub(1.5);
  assertEqual(scrubber.currentPosition, 1, "scrubber.scrub(1.5) clamps to 1");

  // Start / Stop controls
  scrubber.start();
  assertEqual(scrubber.isPlaying, true, "scrubber.start() sets isPlaying to true");
  scrubber.stop();
  assertEqual(scrubber.isPlaying, false, "scrubber.stop() sets isPlaying to false");
}