import { state } from './state.js';

let ctx = null;

function audio() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = 'sine', gain = 0.06, slideTo = null) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  const t0 = ac.currentTime + start;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function sfx(name) {
  if (!state.settings?.sound) return;
  switch (name) {
    case 'tap':
      tone(560, 0, 0.05, 'square', 0.03);
      break;
    case 'pop':
      tone(420, 0, 0.09, 'sine', 0.05, 720);
      break;
    case 'ready':
      tone(700, 0, 0.09, 'triangle', 0.06);
      tone(1040, 0.08, 0.12, 'triangle', 0.05);
      break;
    case 'coin':
      tone(980, 0, 0.07, 'square', 0.035);
      tone(1320, 0.06, 0.12, 'square', 0.03);
      break;
    case 'error':
      tone(200, 0, 0.16, 'sawtooth', 0.045, 120);
      break;
    case 'serve':
      tone(520, 0, 0.08, 'triangle', 0.05);
      tone(660, 0.07, 0.08, 'triangle', 0.05);
      tone(830, 0.14, 0.14, 'triangle', 0.05);
      break;
    case 'level':
      [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.2, 'triangle', 0.06));
      break;
    default:
      break;
  }
}
