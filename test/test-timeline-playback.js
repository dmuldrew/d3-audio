import { assert, assertEqual } from './run-tests.js';
import { Timeline } from '../src/timeline/index.js';

/**
 * Minimal Tone.js stand-in that records Transport state and every Part created,
 * so scheduling and playback can be asserted without an AudioContext.
 */
function createMockTone() {
  const transport = {
    bpm: { value: 120 },
    loop: false,
    loopStart: 0,
    loopEnd: "4m",
    timeSignature: [4, 4],
    seconds: 0,
    position: "0:0:0",
    progress: 0,
    state: 'stopped',
    start() { this.state = 'started'; },
    pause() { this.state = 'paused'; },
    stop() { this.state = 'stopped'; }
  };

  const parts = [];
  class Part {
    constructor(callback, events) {
      this.callback = callback;
      this.events = events;
      this.startedAt = null;
      this.disposed = false;
      parts.push(this);
    }
    start(t) { this.startedAt = t; return this; }
    dispose() { this.disposed = true; }
  }

  const drawn = [];
  const Draw = {
    schedule(fn, time) { drawn.push(time); fn(); }
  };

  return { transport, parts, drawn, Part, Draw, getTransport: () => transport };
}

function createMockEngine(Tone) {
  return {
    Tone,
    startCalls: 0,
    stopAllCalls: 0,
    setTone(t) { this.Tone = t; },
    async start() { this.startCalls++; return true; },
    stopAll() { this.stopAllCalls++; }
  };
}

function createMockInstrument() {
  return {
    notes: [],
    samples: [],
    disposed: false,
    triggerAttackRelease(pitch, duration, time, velocity, params) {
      this.notes.push({ pitch, duration, time, velocity, params });
    },
    trigger(name, duration, time, velocity, params) {
      this.samples.push({ name, duration, time, velocity, params });
    },
    dispose() { this.disposed = true; }
  };
}

function setup(options = {}) {
  const Tone = createMockTone();
  const engine = createMockEngine(Tone);
  const instrument = createMockInstrument();
  const tl = new Timeline({ instrument, ...options }, engine);
  return { Tone, engine, instrument, tl };
}

function recordEvents(tl) {
  const log = [];
  for (const name of ['start', 'pause', 'stop', 'step', 'progress']) {
    tl.on(name, data => log.push({ name, data }));
  }
  return log;
}

export async function testTimelinePlayback() {
  // --------------------------------------------------------------------------
  // 1. schedule() pushes settings onto the Transport and builds one Part per track
  // --------------------------------------------------------------------------
  {
    const { Tone, tl } = setup({ bpm: 96, loop: true, loopStart: "1m", loopEnd: "3m", timeSignature: [3, 4] });
    tl.data([{ pitch: "C4" }, { pitch: "E4" }]).time((d, i) => i * 0.5);
    tl.track("drums", { instrument: createMockInstrument() }).data([{ sample: "kick" }]);

    tl.schedule();

    assertEqual(Tone.transport.bpm.value, 96, "schedule() writes bpm to Transport");
    assertEqual(Tone.transport.loop, true, "schedule() writes loop flag to Transport");
    assertEqual(Tone.transport.loopStart, "1m", "schedule() writes loopStart to Transport");
    assertEqual(Tone.transport.loopEnd, "3m", "schedule() writes loopEnd to Transport");
    assertEqual(Tone.transport.timeSignature, [3, 4], "schedule() writes timeSignature to Transport");
    assertEqual(Tone.parts.length, 2, "schedule() creates one Part per track");
    assertEqual(Tone.parts[0].startedAt, 0, "Parts are started at transport time 0");
    assertEqual(Tone.parts[0].events.map(([t]) => t), [0, 0.5], "Part events are keyed by the time accessor");

    // Re-scheduling disposes the previous Parts instead of stacking duplicates
    tl.schedule();
    assert(Tone.parts[0].disposed && Tone.parts[1].disposed, "Re-scheduling disposes previously scheduled Parts");
    assertEqual(tl.scheduledParts.length, 2, "Re-scheduling keeps exactly one live Part per track");
  }

  // --------------------------------------------------------------------------
  // 2. Mute and solo decide which tracks get scheduled
  // --------------------------------------------------------------------------
  {
    const { Tone, tl } = setup();
    tl.data([{ pitch: "C4" }]);
    const bass = tl.track("bass", { instrument: createMockInstrument() }).data([{ pitch: "C2" }]);
    const lead = tl.track("lead", { instrument: createMockInstrument() }).data([{ pitch: "C5" }]);

    bass.mute(true);
    tl.schedule();
    assertEqual(Tone.parts.length, 2, "Muted track is skipped when scheduling");

    bass.mute(false);
    lead.solo(true);
    tl.schedule();
    const live = tl.scheduledParts;
    assertEqual(live.length, 1, "Only soloed tracks are scheduled when any track is soloed");
    assertEqual(live[0].events[0][1].pitch, "C5", "The scheduled Part belongs to the soloed track");

    lead.mute(true);
    tl.schedule();
    assertEqual(tl.scheduledParts.length, 0, "A track that is both soloed and muted stays silent");
  }

  // --------------------------------------------------------------------------
  // 3. Part callback triggers the instrument and emits a 'step' event via Tone.Draw
  // --------------------------------------------------------------------------
  {
    const { Tone, tl, instrument } = setup();
    const log = recordEvents(tl);
    tl.data([{ pitch: "G4", gain: 0.5, duration: "4n", pan: -0.25 }]);
    tl.schedule();

    const [time, event] = Tone.parts[0].events[0];
    Tone.parts[0].callback(1.25, event);

    assertEqual(instrument.notes.length, 1, "Part callback triggers the track instrument");
    assertEqual(instrument.notes[0].pitch, "G4", "Instrument receives the event pitch");
    assertEqual(instrument.notes[0].time, 1.25, "Instrument receives the audio-clock time");
    assertEqual(instrument.notes[0].velocity, 0.5, "Instrument receives event gain as velocity");
    assertEqual(instrument.notes[0].duration, "4n", "Instrument receives event duration");
    assertEqual(instrument.notes[0].params.pan, -0.25, "Instrument receives event pan");
    assert(Tone.drawn.includes(1.25), "Visual callbacks are scheduled on Tone.Draw at the event time");

    const steps = log.filter(e => e.name === 'step');
    assertEqual(steps.length, 1, "One 'step' event is emitted per triggered event");
    assertEqual(steps[0].data.time, 1.25, "'step' event carries the scheduled time");
    assertEqual(time, 0, "Event time defaults to index * 0.25 beats");
  }

  // --------------------------------------------------------------------------
  // 4. Track trigger details: zero gain, sample tracks, muted triggers
  // --------------------------------------------------------------------------
  {
    const { tl, instrument } = setup();
    tl.data([{ pitch: "C4", gain: 0 }]);
    const [event] = tl.defaultTrack.buildEvents();
    assertEqual(event.gain, 0, "A datum with gain 0 keeps gain 0 (not replaced by the 0.8 default)");
    const visuals = [];
    tl.defaultTrack.triggerVisuals = e => visuals.push(e);
    tl.defaultTrack.triggerEvent(event, 0, null);
    assertEqual(instrument.notes.length, 0, "Zero-gain event skips the instrument (real instruments floor velocity at 0.01)");
    assertEqual(visuals.length, 1, "Zero-gain event still runs its visuals");
    tl.defaultTrack.triggerEvent({ ...event, gain: 0.3 }, 0, null);
    assertEqual(instrument.notes[0].velocity, 0.3, "Non-zero gain reaches the instrument as velocity");

    const sampler = createMockInstrument();
    const drums = tl.track("drums", { type: "sample", instrument: sampler });
    drums.data([{ sample: "snare", pitch: "D4" }, {}]);
    const [snare, unnamed] = drums.buildEvents();
    drums.triggerEvent(snare, 2, null);
    drums.triggerEvent(unnamed, 3, null);
    drums.triggerEvent({ ...snare, gain: 0 }, 3.5, null);
    assertEqual(sampler.samples.map(s => s.name), ["snare", "kick"], "Sample tracks trigger named samples, fall back to 'kick', and skip zero-gain hits");
    assertEqual(sampler.samples[0].params.pitch, "D4", "Sample trigger forwards pitch in params");

    drums.mute(true);
    drums.triggerEvent(snare, 4, null);
    assertEqual(sampler.samples.length, 2, "Muted track ignores triggerEvent");
  }

  // --------------------------------------------------------------------------
  // 5. play / pause / resume / stop lifecycle and emitted events
  // --------------------------------------------------------------------------
  {
    const { Tone, engine, tl } = setup({ bpm: 140 });
    const log = recordEvents(tl);
    tl.data([{ pitch: "C4" }]);

    await tl.play();
    assertEqual(engine.startCalls, 1, "play() starts the audio engine");
    assertEqual(Tone.transport.state, 'started', "play() starts the Transport");
    assert(tl.isPlaying && !tl.isPaused, "play() marks timeline as playing");
    assertEqual(log.filter(e => e.name === 'start').length, 1, "play() emits 'start'");
    assertEqual(log.find(e => e.name === 'start').data.bpm, 140, "'start' event carries bpm");
    assert(tl.progressInterval !== null, "play() starts the progress tracker");

    // A second play() while already playing must not reschedule or re-emit
    const partsBefore = Tone.parts.length;
    await tl.play();
    assertEqual(Tone.parts.length, partsBefore, "play() while playing does not create duplicate Parts");
    assertEqual(log.filter(e => e.name === 'start').length, 1, "play() while playing does not re-emit 'start'");

    Tone.transport.seconds = 3.5;
    tl.pause();
    assertEqual(Tone.transport.state, 'paused', "pause() pauses the Transport");
    assert(!tl.isPlaying && tl.isPaused, "pause() marks timeline as paused");
    assertEqual(tl.progressInterval, null, "pause() clears the progress tracker");
    assertEqual(log.find(e => e.name === 'pause').data.time, 3.5, "'pause' event carries transport time");

    await tl.play();
    assert(tl.isPlaying && !tl.isPaused, "play() after pause resumes playback");
    assertEqual(tl.scheduledParts.length, 1, "Resuming keeps exactly one live Part per track");
    assertEqual(Tone.transport.seconds, 3.5, "Resuming does not reset transport position");

    tl.stop();
    assertEqual(Tone.transport.state, 'stopped', "stop() stops the Transport");
    assertEqual(Tone.transport.seconds, 0, "stop() rewinds the Transport to 0");
    assertEqual(tl.scheduledParts.length, 0, "stop() disposes scheduled Parts");
    assertEqual(engine.stopAllCalls, 1, "stop() silences all engine voices");
    assertEqual(tl.progressInterval, null, "stop() clears the progress tracker");
    assert(!tl.isPlaying && !tl.isPaused, "stop() clears playing and paused flags");
    assertEqual(log.find(e => e.name === 'stop').data.time, 0, "'stop' event reports time 0");
  }

  // --------------------------------------------------------------------------
  // 6. Progress tracker emits while playing
  // --------------------------------------------------------------------------
  {
    const { Tone, tl } = setup();
    const log = recordEvents(tl);
    tl.data([{ pitch: "C4" }]);
    await tl.play();
    Tone.transport.seconds = 1.5;
    Tone.transport.progress = 0.25;
    await new Promise(resolve => setTimeout(resolve, 80));
    tl.stop();

    const progress = log.filter(e => e.name === 'progress');
    assert(progress.length >= 1, "Progress tracker emits 'progress' while playing");
    assertEqual(progress[0].data.seconds, 1.5, "'progress' event carries transport seconds");
    assertEqual(progress[0].data.progress, 0.25, "'progress' event carries loop progress");

    const countAfterStop = log.filter(e => e.name === 'progress').length;
    await new Promise(resolve => setTimeout(resolve, 80));
    assertEqual(log.filter(e => e.name === 'progress').length, countAfterStop, "No 'progress' events are emitted after stop()");
  }

  // --------------------------------------------------------------------------
  // 7. seek(), transport setters, missing Tone, and dispose()
  // --------------------------------------------------------------------------
  {
    const { Tone, tl } = setup();
    const log = recordEvents(tl);

    tl.seek(12);
    assertEqual(Tone.transport.seconds, 12, "seek() moves the Transport");
    tl.seek(-5);
    assertEqual(Tone.transport.seconds, 0, "seek() clamps negative times to 0");
    assertEqual(log.filter(e => e.name === 'progress').length, 2, "seek() emits 'progress'");

    tl.bpm(88).loop(true).loopStart(2).loopEnd("8m").timeSignature([6, 8]);
    assertEqual(Tone.transport.bpm.value, 88, "bpm() setter updates a live Transport");
    assertEqual(Tone.transport.loop, true, "loop() setter updates a live Transport");
    assertEqual(Tone.transport.loopStart, 2, "loopStart() setter updates a live Transport");
    assertEqual(Tone.transport.loopEnd, "8m", "loopEnd() setter updates a live Transport");
    assertEqual(Tone.transport.timeSignature, [6, 8], "timeSignature() setter updates a live Transport");

    const extra = createMockInstrument();
    tl.track("extra", { instrument: extra });
    const defaultInstrument = tl.defaultTrack.instrument;
    tl.dispose();
    assert(extra.disposed && defaultInstrument.disposed, "dispose() disposes every track's instrument");
    assertEqual(tl.tracks.size, 0, "dispose() clears all tracks");
  }

  {
    const engine = createMockEngine(null);
    const tl = new Timeline({ instrument: createMockInstrument() }, engine);
    const originalWarn = console.warn;
    let warned = false;
    console.warn = () => { warned = true; };
    try {
      tl.schedule();
      await tl.play();
      tl.pause();
      tl.stop();
      tl.seek(3);
    } finally {
      console.warn = originalWarn;
    }
    assert(warned, "play() warns when Tone.js is unavailable");
    assert(!tl.isPlaying, "Timeline stays stopped when Tone.js is unavailable");
    assertEqual(tl.scheduledParts.length, 0, "schedule() is a no-op without Tone.js");
  }
}
