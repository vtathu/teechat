// ===================== ÂM THANH: SFX tổng hợp + nhạc nền nhẹ =====================
// Không dùng file âm thanh: SFX và nhạc đều tổng hợp bằng WebAudio để app vẫn nhẹ.
(function () {
  let ctx = null, master = null, sfxBus = null, musicBus = null;
  let unlocked = false, musicTimer = null, chordStep = 0;
  const pending = [];

  const S = () => window.state;
  function cfg() {
    const s = S();
    if (!s) return { sfx: true, music: true, volume: 0.6 };
    if (!s.audio || typeof s.audio !== 'object') s.audio = { sfx: true, music: true, volume: 0.6 };
    const a = s.audio;
    if (typeof a.sfx !== 'boolean') a.sfx = true;
    if (typeof a.music !== 'boolean') a.music = true;
    if (typeof a.volume !== 'number') a.volume = 0.6;
    return a;
  }
  function save() { try { if (typeof saveStorage === 'function') saveStorage(); } catch (e) {} }

  function build() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    master = ctx.createGain();
    master.gain.value = cfg().volume;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = cfg().sfx ? 1 : 0; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = cfg().music ? 1 : 0; musicBus.connect(master);
    return ctx;
  }

  function unlock() {
    if (unlocked) return;
    if (!build()) return;
    unlocked = true;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    cfg();
    if (cfg().music) startMusic();
    while (pending.length) { const n = pending.shift(); play(n); }
  }

  function env(node, t0, peak, dur) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    node.connect(g);
    g.connect(sfxBus);
    return g;
  }
  function tone(freq, dur, type, peak, slideTo, delay) {
    if (!build() || !cfg().sfx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur);
    env(o, t0, peak == null ? 0.12 : peak, dur);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }
  function noise(dur, freq, peak) {
    if (!build() || !cfg().sfx) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq || 1400; bp.Q.value = 0.9;
    const g = ctx.createGain(); g.gain.value = peak == null ? 0.1 : peak;
    src.connect(bp); bp.connect(g); g.connect(sfxBus);
    src.start();
  }

  const SFX = {
    click: () => tone(1100, 0.05, 'sine', 0.05),
    coin: () => { tone(880, 0.08, 'triangle', 0.08); tone(1320, 0.12, 'triangle', 0.07, null, 0.07); },
    win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, 'triangle', 0.09, null, i * 0.09)),
    lose: () => tone(392, 0.3, 'sine', 0.08, 180),
    merge: () => tone(560, 0.1, 'triangle', 0.08, 820),
    catch: () => { tone(320, 0.14, 'square', 0.05, 900); noise(0.12, 2200, 0.05); },
    scratch: () => noise(0.18, 1600, 0.07),
    plant: () => tone(440, 0.1, 'sine', 0.06, 660),
    buy: () => { tone(700, 0.07, 'sine', 0.06); tone(980, 0.09, 'sine', 0.05, null, 0.06); },
    error: () => tone(200, 0.16, 'square', 0.06),
    draw: () => { tone(1400, 0.04, 'square', 0.04); tone(1000, 0.04, 'square', 0.03, null, 0.05); }
  };

  function play(name) {
    if (!unlocked) { if (pending.length < 6) pending.push(name); return; }
    if (!cfg().sfx) return;
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    try { (SFX[name] || SFX.click)(); } catch (e) {}
  }

  // ---------- Nhạc nền: vòng hợp âm chậm + điểm chuông thưa ----------
  const CHORDS = [
    [261.63, 329.63, 392.00, 523.25],
    [220.00, 261.63, 329.63, 440.00],
    [174.61, 220.00, 349.23, 523.25],
    [196.00, 246.94, 392.00, 493.88]
  ];
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880.00];
  function pad(freqs, t0, dur) {
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? 'sine' : 'triangle';
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.035, t0 + 0.9);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(musicBus);
      o.start(t0); o.stop(t0 + dur + 0.1);
    });
  }
  function chime(t0) {
    const f = PENTA[Math.floor(Math.random() * PENTA.length)];
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.022, t0 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.1);
    o.connect(g); g.connect(musicBus);
    o.start(t0); o.stop(t0 + 1.2);
  }
  function scheduleLoop() {
    if (!ctx || !cfg().music) return;
    const t0 = ctx.currentTime + 0.05;
    pad(CHORDS[chordStep % CHORDS.length], t0, 7.5);
    chime(t0 + 2 + Math.random());
    if (Math.random() > 0.45) chime(t0 + 5 + Math.random());
    chordStep++;
  }
  function startMusic() {
    if (!build() || !cfg().music) return;
    if (musicTimer) return;
    scheduleLoop();
    musicTimer = setInterval(scheduleLoop, 8000);
  }
  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }

  function apply() {
    const a = cfg();
    if (master) master.gain.setTargetAtTime(a.volume, ctx.currentTime, 0.05);
    if (sfxBus) sfxBus.gain.setTargetAtTime(a.sfx ? 1 : 0, ctx.currentTime, 0.02);
    if (musicBus) musicBus.gain.setTargetAtTime(a.music ? 1 : 0, ctx.currentTime, 0.08);
    if (a.music && unlocked) startMusic(); else stopMusic();
    syncControls();
  }

  function syncControls() {
    const a = cfg();
    const s = document.getElementById('cfg-sfx'), m = document.getElementById('cfg-music'), v = document.getElementById('cfg-volume');
    if (s) s.checked = !!a.sfx;
    if (m) m.checked = !!a.music;
    if (v) v.value = String(Math.round(a.volume * 100));
  }

  function bind() {
    document.addEventListener('pointerdown', unlock, { passive: true });
    document.addEventListener('keydown', unlock);
    const s = document.getElementById('cfg-sfx'), m = document.getElementById('cfg-music'), v = document.getElementById('cfg-volume');
    if (s) s.addEventListener('change', () => { cfg().sfx = s.checked; save(); apply(); if (s.checked) play('click'); });
    if (m) m.addEventListener('change', () => { cfg().music = m.checked; save(); apply(); });
    if (v) v.addEventListener('input', () => { cfg().volume = Math.max(0, Math.min(1, (+v.value || 0) / 100)); apply(); });
    if (v) v.addEventListener('change', () => { save(); play('coin'); });
    // Nút bấm chung có tiếng "tách" nhẹ; nút tắt tiếng không kêu
    document.addEventListener('click', (e) => {
      const b = e.target && e.target.closest && e.target.closest('button, .play-tab');
      if (b && !b.disabled) play('click');
    }, true);
    const modal = document.getElementById('modal-settings');
    if (modal && window.MutationObserver) {
      new MutationObserver(() => { if (modal.classList.contains('active')) syncControls(); })
        .observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) stopMusic();
      else if (cfg().music && unlocked) startMusic();
    });
    syncControls();
  }

  window.Sound = {
    play, init: unlock,
    setMusic(on) { cfg().music = !!on; save(); apply(); },
    setSfx(on) { cfg().sfx = !!on; save(); apply(); },
    setVolume(v) { cfg().volume = Math.max(0, Math.min(1, +v || 0)); apply(); },
    get() { return Object.assign({}, cfg()); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
