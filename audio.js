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

  // ---------- Nhạc nền: nhạc thật (Pixabay) phát xáo trộn, theo mùa lễ hội ----------
  const TRACK = (list) => list.map(n => 'music/' + n + '.mp3');
  const PLAYLISTS = {
    daily: TRACK(['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd9', 'd10']),
    tet: TRACK(['t1', 't2', 't3', 't4', 't5', 't6']),
    trungthu: TRACK(['m1', 'm2', 'm3']),
    noel: TRACK(['n1', 'n2', 'n3', 'n4', 'n5', 'n6'])
  };
  // Mùng 1 Tết Nguyên Đán và rằm Trung Thu (dương lịch, theo lịch Việt Nam)
  const TET_DAYS = ['2026-02-17', '2027-02-06', '2028-01-26', '2029-02-13', '2030-02-03', '2031-01-23', '2032-02-11', '2033-02-01', '2034-01-22', '2035-02-10'];
  const MID_DAYS = ['2026-09-25', '2027-09-15', '2028-10-03', '2029-09-22', '2030-09-12', '2031-10-01', '2032-09-19', '2033-09-08', '2034-09-27', '2035-09-16'];
  const DAY_MS = 86400000;
  function dayTime(s) { const a = s.split('-').map(Number); return new Date(a[0], a[1] - 1, a[2]).getTime(); }
  function nearDay(list, before, after) {
    const now = Date.now();
    // tính trọn ngày: từ 0h ngày (mốc - before) đến hết ngày (mốc + after)
    return list.some(s => { const t = dayTime(s); return now >= t - before * DAY_MS && now < t + (after + 1) * DAY_MS; });
  }
  function seasonList() {
    const d = new Date(), m = d.getMonth() + 1, day = d.getDate();
    if ((m === 11 && day >= 10) || (m === 12 && day <= 25)) return PLAYLISTS.noel;   // 10/11 - 25/12
    if (nearDay(TET_DAYS, 15, 15)) return PLAYLISTS.tet;
    if (nearDay(MID_DAYS, 7, 1)) return PLAYLISTS.trungthu;
    return PLAYLISTS.daily;
  }

  let musicEl = null, musicList = null, musicIdx = -1, musicFails = 0, fadeTimer = null, fadingOut = false;
  const MUSIC_LEVEL = 0.55;   // nhạc thật to hơn nhạc tổng hợp nên hạ bớt
  function musicVolume() { return Math.max(0, Math.min(1, cfg().volume * MUSIC_LEVEL)); }
  function clearFade() { if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; } }
  function fadeTo(target, ms) {
    if (!musicEl) return;
    clearFade();
    const from = musicEl.volume, steps = Math.max(1, Math.round(ms / 60));
    let i = 0;
    fadeTimer = setInterval(() => {
      i++;
      if (!musicEl) { clearFade(); return; }
      musicEl.volume = Math.max(0, Math.min(1, from + (target - from) * (i / steps)));
      if (i >= steps) clearFade();
    }, 60);
  }
  function pickNext() {
    const list = seasonList();
    if (list !== musicList) { musicList = list; musicIdx = -1; }
    let i = Math.floor(Math.random() * list.length);
    while (list.length > 1 && i === musicIdx) i = Math.floor(Math.random() * list.length);
    musicIdx = i;
    return list[i];
  }
  function ensureEl() {
    if (musicEl) return musicEl;
    if (!window.Audio) return null;
    musicEl = new Audio();
    musicEl.preload = 'auto';
    musicEl.addEventListener('playing', () => { musicFails = 0; fadingOut = false; musicEl.volume = 0; fadeTo(musicVolume(), 1500); paintMusic(); });
    musicEl.addEventListener('timeupdate', () => {
      const left = (musicEl.duration || 0) - musicEl.currentTime;
      if (!fadingOut && left > 0 && left < 2.2) { fadingOut = true; fadeTo(0, Math.max(300, left * 850)); }
    });
    musicEl.addEventListener('ended', () => { if (cfg().music) playTrack(pickNext()); });
    musicEl.addEventListener('error', () => {
      if (++musicFails >= 3) { musicEl = null; startSynth(); return; }   // không tải được nhạc -> quay về nhạc tổng hợp
      if (cfg().music) playTrack(pickNext());
    });
    return musicEl;
  }
  function playTrack(src) {
    const el = ensureEl();
    if (!el) { startSynth(); return; }
    clearFade();
    fadingOut = false;
    el.volume = 0;
    el.src = src;
    const p = el.play();
    if (p && p.catch) p.catch(() => {});
  }

  // ---------- Nhạc tổng hợp dự phòng: vòng hợp âm chậm + điểm chuông thưa ----------
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
  function startSynth() {
    if (!build() || !cfg().music) return;
    if (musicTimer) return;
    scheduleLoop();
    musicTimer = setInterval(scheduleLoop, 8000);
  }
  function stopSynth() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }

  // ---------- Điều khiển nhạc nền ----------
  function startMusic() {
    if (!cfg().music) return;
    const el = ensureEl();
    if (!el) { startSynth(); return; }
    if (el.currentSrc && !el.ended) {        // đang có bài: giữ nguyên, chỉ phát tiếp nếu đang tạm dừng
      if (el.paused) {
        const p = el.play();
        if (p && p.catch) p.catch(() => {});
      }
      return;
    }
    playTrack(pickNext());
  }
  function stopMusic() {
    stopSynth();
    if (!musicEl) return;
    clearFade();
    fadingOut = false;
    try { musicEl.pause(); } catch (e) {}
  }

  // ---------- Bài đang phát trong Cài đặt ----------
  const TRACK_NAMES = {
    d1: 'Mặt hồ phẳng lặng', d2: 'Giai điệu dịu êm', d3: 'Quán cà phê sân vườn', d4: 'Piano trong gió', d5: 'Buổi sáng bình yên',
    d6: 'Rời xa phố thị', d7: 'Cánh đồng lúa Việt Nam', d9: 'Auld Lang Syne', d10: 'Nơi tôi sinh ra',
    t1: 'Xuân về', t2: 'Mùa xuân ơi', t3: 'Hoa mùa xuân', t4: 'Tết Nguyên Đán (EDM)', t5: 'Nhạc Tết không lời', t6: 'Xuân ca',
    m1: 'Chú Cuội chị Hằng', m2: 'Trăng tròn giữa trời cao', m3: 'Rước đèn ông sao',
    n1: 'Jingle Bells (Swing)', n2: 'We Wish You a Merry Christmas', n3: 'Giáng sinh vui vẻ',
    n4: 'Merry Christmas With You', n5: 'Noel ấm áp', n6: 'Giáng sinh an lành'
  };
  function trackKey(src) {
    return String(src || '').split('?')[0].replace(/^.*\//, '').replace(/\.mp3$/i, '');
  }
  function currentKey() { return musicEl ? trackKey(musicEl.currentSrc || musicEl.src) : ''; }
  function paintMusic() {
    const now = document.getElementById('music-now-name');
    if (!now) return;
    const cur = currentKey();
    now.textContent = !cfg().music ? 'Đang tắt'
      : cur ? (TRACK_NAMES[cur] || cur)
      : musicTimer ? 'Nhạc tổng hợp' : 'Đang chọn bài…';
  }
  function nextSong() {
    if (!cfg().music) { cfg().music = true; save(); }
    playTrack(pickNext());
    paintMusic();
  }

  function apply() {
    const a = cfg();
    if (master) master.gain.setTargetAtTime(a.volume, ctx.currentTime, 0.05);
    if (sfxBus) sfxBus.gain.setTargetAtTime(a.sfx ? 1 : 0, ctx.currentTime, 0.02);
    if (musicBus) musicBus.gain.setTargetAtTime(a.music ? 1 : 0, ctx.currentTime, 0.08);
    if (musicEl && !fadingOut) { clearFade(); musicEl.volume = musicVolume(); }
    if (a.music && unlocked) startMusic(); else stopMusic();
    syncControls();
  }

  function syncControls() {
    const a = cfg();
    const s = document.getElementById('cfg-sfx'), m = document.getElementById('cfg-music'), v = document.getElementById('cfg-volume');
    if (s) s.checked = !!a.sfx;
    if (m) m.checked = !!a.music;
    if (v) v.value = String(Math.round(a.volume * 100));
    paintMusic();
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
      if (document.hidden) stopMusic();
      else if (cfg().music && unlocked) startMusic();
    });
    syncControls();
  }

  window.Sound = {
    play, init: unlock,
    nextSong,
    current: currentKey,
    setMusic(on) { cfg().music = !!on; save(); apply(); },
    setSfx(on) { cfg().sfx = !!on; save(); apply(); },
    setVolume(v) { cfg().volume = Math.max(0, Math.min(1, +v || 0)); apply(); },
    get() { return Object.assign({}, cfg()); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
