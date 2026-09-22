// Aurora Precision H2 Dispensing Acoustic Feedback Engine
// Uses native Web Audio API to synthesize cryogenic gas flow and completion chime

let audioCtx = null;
let noiseSource = null;
let noiseFilter = null;
let noiseGain = null;
let isFlowing = false;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Generate 2 seconds of looping white noise buffer
const createNoiseBuffer = (ctx) => {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

/**
 * Start pressurized cryogenic gas dispensing sound
 * @param {number} pressure Current pressure in bar (0 - 700)
 */
export const startDispensingSound = (pressure = 350) => {
  try {
    const ctx = getAudioContext();
    if (!ctx || isFlowing) return;

    const noiseBuffer = createNoiseBuffer(ctx);
    noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Filter simulating high-pressure cryogenic nozzle hiss
    noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    const centerFreq = Math.min(1800, 450 + (pressure / 700) * 1200);
    noiseFilter.frequency.setValueAtTime(centerFreq, ctx.currentTime);
    noiseFilter.Q.setValueAtTime(2.5, ctx.currentTime);

    noiseGain = ctx.createGain();
    // Gentle fade in
    noiseGain.gain.setValueAtTime(0.001, ctx.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.6);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noiseSource.start();
    isFlowing = true;
  } catch (err) {
    console.warn('Acoustic engine start suppressed:', err);
  }
};

/**
 * Dynamically adjust flow pitch as pressure builds towards 700 bar
 */
export const updateDispensingAcousticPressure = (pressure = 350) => {
  try {
    if (!isFlowing || !noiseFilter || !audioCtx) return;
    const centerFreq = Math.min(2200, 500 + (pressure / 700) * 1400);
    noiseFilter.frequency.setTargetAtTime(centerFreq, audioCtx.currentTime, 0.2);
  } catch (err) {
    // Ignore audio update warnings
  }
};

/**
 * Stop gas flow hiss with smooth release
 */
export const stopDispensingSound = () => {
  try {
    if (!isFlowing || !noiseGain || !audioCtx) return;
    noiseGain.gain.setValueAtTime(noiseGain.gain.value, audioCtx.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
    setTimeout(() => {
      if (noiseSource) {
        try { noiseSource.stop(); } catch (e) {}
        noiseSource.disconnect();
      }
      isFlowing = false;
    }, 450);
  } catch (err) {
    isFlowing = false;
  }
};

/**
 * Play a futuristic 3-note harmonic arpeggio when 700-bar refueling is complete
 */
export const playRefuelCompleteChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Frequencies: E5 (659.25Hz), G#5 (830.61Hz), B5 (987.77Hz), E6 (1318.51Hz)
    const notes = [659.25, 830.61, 987.77, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + idx * 0.12;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.95);
    });
  } catch (err) {
    console.warn('Acoustic chime error:', err);
  }
};
