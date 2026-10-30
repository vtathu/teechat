// ===================== GIẢI TRÍ: VÉ SỐ · CÂU CÁ · CHỢ ĐÊM · NÔNG TRẠI =====================
// Toàn bộ dữ liệu thêm vào window.state theo khoá mới, không ghi đè dữ liệu cũ.
(function () {
  const S = () => window.state;
  const pad = (n) => String(n).padStart(2, '0');
  const money = (n) => Math.round(n || 0).toLocaleString('vi-VN') + 'đ';
  const bigMoney = (n) => {
    n = Math.round(n || 0);
    if (n >= 1e9) return (n / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' tỷ';
    if (n >= 1e6) return (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' triệu';
    return money(n);
  };
  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const sfx = (n) => { try { if (window.Sound) window.Sound.play(n); } catch (e) {} };
  const save = () => { try { if (typeof saveStorage === 'function') saveStorage(); } catch (e) {} };
  const wallet = () => +(S().walletBalance || 0);
  const dayKey = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const weekKey = () => {
    const d = new Date();
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const j = new Date(d.getFullYear(), 0, 1);
    return d.getFullYear() + '-W' + Math.ceil((((t - j) / 864e5) + j.getDay() + 1) / 7);
  };
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };

  let tab = 'lottery';
  let toastTimer = null;
  function toast(msg) {
    let el = document.getElementById('play-toast');
    if (!el) { el = document.createElement('div'); el.id = 'play-toast'; el.className = 'play-toast'; document.body.appendChild(el); }
    el.innerText = msg; el.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.style.display = 'none'; }, 2600);
  }
  function addMoney(n) { S().walletBalance = Math.max(0, wallet() + Math.round(n)); save(); refreshWallets(); }
  function pay(n) { if (wallet() < n) { toast('Không đủ tiền rồi.'); sfx('error'); return false; } addMoney(-n); return true; }
  function refreshWallets() { try { if (typeof window.renderLifeModeUI === 'function') window.renderLifeModeUI(); } catch (e) {} }

  // ===================== VÉ SỐ =====================
  const SCRATCH_COST = 20000;
  const SCRATCH_PER_DAY = 5;
  const VIET_COST = 20000;
  const VIET_PER_DAY = 5;
  const JACKPOT_MIN = 100e9;
  const JACKPOT_MAX = 160e9;
  // Mỗi kỳ quay bốc lại một hũ ngẫu nhiên 100 - 160 tỷ.
  const rollJackpot = () => Math.round((JACKPOT_MIN + Math.random() * (JACKPOT_MAX - JACKPOT_MIN)) / 5e7) * 5e7;
  const SCRATCH_SYMBOLS = ['🍒', '🍋', '🍀', '⭐', '🔔', '7️⃣', '🍇', '🍑'];
  const SCRATCH_ROWS = [
    { p: 0.003, prize: 2000000, sym: '💎', name: 'Hũ kim cương' },
    { p: 0.010, prize: 300000, sym: '7️⃣', name: 'Ba số 7' },
    { p: 0.050, prize: 80000, sym: '🍀', name: 'Ba lá may mắn' },
    { p: 0.220, prize: 20000, sym: '⭐', name: 'Hoàn vốn' }
  ];

  function L() {
    const s = S();
    if (!s.lottery || typeof s.lottery !== 'object') s.lottery = {};
    const l = s.lottery;
    if (l.day !== dayKey()) { l.day = dayKey(); l.scratchLeft = SCRATCH_PER_DAY; l.vietLeft = VIET_PER_DAY; }
    if (typeof l.scratchLeft !== 'number') l.scratchLeft = SCRATCH_PER_DAY;
    if (typeof l.vietLeft !== 'number') l.vietLeft = VIET_PER_DAY;
    if (!Array.isArray(l.tickets)) l.tickets = [];
    if (!Array.isArray(l.pick)) l.pick = [];
    if (!Array.isArray(l.history)) l.history = [];
    if (!(typeof l.jackpot === 'number' && l.jackpot >= 1e10)) l.jackpot = rollJackpot();
    if (typeof l.round !== 'number' || l.round < 1) l.round = 1;
    if (typeof l.drawDay !== 'string') l.drawDay = '';
    if (!l.lastDraw || typeof l.lastDraw !== 'object') l.lastDraw = null;
    if (l.scratchTicket && typeof l.scratchTicket !== 'object') l.scratchTicket = null;
    return l;
  }
  function logPlay(g, v) { const l = L(); l.history.unshift({ g: g, v: Math.round(v || 0) }); l.history = l.history.slice(0, 6); }
  function rollScratch() {
    const r = Math.random();
    let acc = 0;
    for (let i = 0; i < SCRATCH_ROWS.length; i++) { acc += SCRATCH_ROWS[i].p; if (r < acc) return SCRATCH_ROWS[i]; }
    return null;
  }
  function makeScratch() {
    const win = rollScratch();
    const cells = new Array(9).fill('');
    const counts = {};
    if (win) {
      shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 3).forEach(i => { cells[i] = win.sym; });
      counts[win.sym] = 3;
    }
    const ban = win ? win.sym : null;
    for (let i = 0; i < 9; i++) {
      if (cells[i]) continue;
      const pool = SCRATCH_SYMBOLS.filter(s => s !== ban && (counts[s] || 0) < 2);
      const sym = pool[Math.floor(Math.random() * pool.length)];
      cells[i] = sym; counts[sym] = (counts[sym] || 0) + 1;
    }
    return { cells: cells, revealed: new Array(9).fill(false), prize: win ? win.prize : 0, name: win ? win.name : '', winSym: win ? win.sym : '', done: false };
  }
  function buyScratch() {
    const l = L();
    if (l.scratchTicket && !l.scratchTicket.done) return toast('Cào hết vé đang có trước nhé.');
    if (l.scratchLeft <= 0) return toast('Hết vé cào hôm nay, mai quay lại nhé.');
    if (!pay(SCRATCH_COST)) return;
    l.scratchLeft--;
    l.scratchTicket = makeScratch();
    save(); sfx('scratch'); render();
  }
  function scratchCell(i) {
    const l = L(), t = l.scratchTicket;
    if (!t || t.done || t.revealed[i]) return;
    t.revealed[i] = true;
    sfx('scratch');
    if (t.revealed.every(Boolean)) {
      t.done = true;
      if (t.prize > 0) {
        addMoney(t.prize); logPlay('Cào vé', t.prize); sfx('win');
        toast('🎉 Trúng ' + money(t.prize) + '!');
      } else {
        logPlay('Cào vé', 0); sfx('lose');
      }
    }
    save(); render();
  }
  function pickNum(n) {
    const l = L();
    if (l.pick.indexOf(n) !== -1) l.pick = l.pick.filter(x => x !== n);
    else if (l.pick.length >= 6) return toast('Mỗi vé chỉ chọn 6 số thôi.');
    else l.pick = l.pick.concat([n]).sort((a, b) => a - b);
    save(); render();
  }
  function luckyPick() {
    const l = L(), pool = [];
    for (let i = 1; i <= 45; i++) pool.push(i);
    l.pick = shuffle(pool).slice(0, 6).sort((a, b) => a - b);
    save(); sfx('draw'); render();
  }
  function buyViet() {
    const l = L();
    if (l.pick.length !== 6) return toast('Chọn đủ 6 số đã nhé.');
    if (l.vietLeft <= 0) return toast('Hết vé Vietlott hôm nay.');
    if (!pay(VIET_COST)) return;
    l.vietLeft--;
    l.tickets.push({ n: l.pick.slice(), day: dayKey() });
    l.pick = [];
    save(); sfx('buy'); render();
    toast('🎱 Đã mua vé, chờ quay số nhé!');
  }
  function drawViet() {
    const l = L();
    if (!l.tickets.length) return toast('Chưa có vé nào để quay.');
    if (l.drawDay === dayKey()) return toast('Hôm nay quay rồi, mai quay tiếp nhé.');
    const pot = l.jackpot, round = l.round;
    const pool = [];
    for (let i = 1; i <= 45; i++) pool.push(i);
    const win = shuffle(pool).slice(0, 6).sort((a, b) => a - b);
    let total = 0, jack = false;
    const rows = l.tickets.map(t => {
      const hit = t.n.filter(n => win.indexOf(n) !== -1).length;
      let prize = 0;
      if (hit === 6) { prize = pot; jack = true; }
      else if (hit === 5) prize = 10000000;
      else if (hit === 4) prize = 1000000;
      else if (hit === 3) prize = 100000;
      else if (hit === 2) prize = 20000;
      total += prize;
      return { n: t.n.slice(), hit: hit, prize: prize };
    });
    l.tickets = [];
    l.lastDraw = { day: dayKey(), round: round, jackpot: pot, win: win, rows: rows };
    l.drawDay = dayKey();
    l.round = round + 1;
    l.jackpot = rollJackpot();
    logPlay('Vietlott', total);
    if (total > 0) addMoney(total);
    save(); sfx(jack ? 'win' : total > 0 ? 'win' : 'lose'); render();
    if (jack) toast('🎉🎉 TRÚNG ĐỘC ĐẮC ' + bigMoney(total) + '!');
    else toast(total > 0 ? '🎉 Trúng ' + money(total) + '!' : 'Chưa trúng giải nào, chia buồn!');
  }

  // ===================== CÂU CÁ =====================
  const BAIT = 2000;
  const DAILY_CASTS = 12;
  const CONTEST_FEE = 100000;
  const CONTEST_PRIZES = [400000, 180000, 60000];
  const FISH_TABLE = [
    { c: 'Trắng', v: 12000, p: 0.620, pp: 0.420, name: 'Cá Bạch Kim', emoji: '🐟' },
    { c: 'Xám', v: 25000, p: 0.240, pp: 0.300, name: 'Cá Tro', emoji: '🐠' },
    { c: 'Nâu', v: 55000, p: 0.090, pp: 0.160, name: 'Cá Đồng', emoji: '🐡' },
    { c: 'Đen', v: 140000, p: 0.035, pp: 0.080, name: 'Cá Hắc Long', emoji: '🦈' },
    { c: 'Vàng', v: 380000, p: 0.012, pp: 0.032, name: 'Cá Hoàng Kim', emoji: '🐠' },
    { c: 'Vàng', v: 900000, p: 0.003, pp: 0.008, name: 'Cá Rồng Vàng', emoji: '🐉', rare: true }
  ];
  let fishAnim = null;

  function F() {
    const s = S();
    if (!s.fishing || typeof s.fishing !== 'object') s.fishing = {};
    const f = s.fishing;
    if (f.day !== dayKey()) { f.day = dayKey(); f.casts = DAILY_CASTS; }
    if (typeof f.casts !== 'number' || f.casts < 0) f.casts = DAILY_CASTS;
    if (!Array.isArray(f.log)) f.log = [];
    if (!f.contest || typeof f.contest !== 'object') f.contest = { week: '', castsLeft: 0, score: 0, done: false, prize: 0, rank: 0, rivals: [] };
    if (!Array.isArray(f.contest.rivals)) f.contest.rivals = [];
    if (f.pending && typeof f.pending !== 'object') f.pending = null;
    return f;
  }
  function logFish(txt) { const f = F(); f.log.unshift(txt); f.log = f.log.slice(0, 6); }
  function pickFish(perfect) {
    const r = Math.random();
    let acc = 0;
    for (let i = 0; i < FISH_TABLE.length; i++) {
      acc += perfect ? FISH_TABLE[i].pp : FISH_TABLE[i].p;
      if (r < acc) return FISH_TABLE[i];
    }
    return FISH_TABLE[FISH_TABLE.length - 1];
  }
  function fishCast() {
    const f = F(), c = f.contest;
    if (f.pending) return toast('Bán hoặc thả cá đang giữ trước đã.');
    if (fishAnim) return toast('Đang câu rồi, canh mà giật!');
    const contestOn = c.castsLeft > 0;
    if (!contestOn && f.casts <= 0) return toast('Hết 12 lượt câu hôm nay.');
    if (!pay(BAIT)) return;
    if (contestOn) c.castsLeft--; else f.casts--;
    fishAnim = { pos: 0, dir: 1, speed: 0.72 + Math.random() * 0.35, zoneC: 0.18 + Math.random() * 0.64, raf: 0, active: true, mode: contestOn ? 'contest' : 'daily' };
    save(); sfx('click'); render();
  }
  function startFishLoop() {
    const a = fishAnim;
    if (!a || !a.active) return;
    if (a.raf) cancelAnimationFrame(a.raf);
    const needle = document.getElementById('fish-needle');
    let t0 = performance.now();
    function frame(t) {
      if (fishAnim !== a || !a.active) { a.raf = 0; return; }
      const dt = Math.min(0.05, (t - t0) / 1000); t0 = t;
      a.pos += a.dir * a.speed * dt;
      if (a.pos >= 1) { a.pos = 1; a.dir = -1; }
      else if (a.pos <= 0) { a.pos = 0; a.dir = 1; }
      if (needle) needle.style.left = (a.pos * 100) + '%';
      a.raf = requestAnimationFrame(frame);
    }
    a.raf = requestAnimationFrame(frame);
  }
  function fishReel() {
    const a = fishAnim;
    if (!a || !a.active) return;
    a.active = false;
    if (a.raf) cancelAnimationFrame(a.raf);
    fishAnim = null;
    const d = Math.abs(a.pos - a.zoneC);
    const perfect = d <= 0.06;
    const hit = d <= 0.15;
    const f = F(), c = f.contest;
    if (!hit) {
      sfx('lose'); save(); render();
      toast(perfect ? 'Tuột mất rồi!' : 'Cá chạy mất rồi, thả lại nhé!');
      afterCatchResolved();
      return;
    }
    const fish = pickFish(perfect);
    f.pending = { c: fish.c, v: fish.v, name: fish.name, emoji: fish.emoji, rare: !!fish.rare, perfect: perfect };
    if (a.mode === 'contest') c.score += fish.v;
    save(); sfx('catch'); render();
  }
  function afterCatchResolved() {
    const f = F(), c = f.contest;
    if (c.castsLeft === 0 && !c.done) { settleContest(); return; }
    render();
  }
  function fishSell() {
    const f = F(), p = f.pending;
    if (!p) return;
    f.pending = null;
    addMoney(p.v);
    logFish('Bán ' + p.name + ' +' + money(p.v));
    save(); sfx('coin');
    toast('💰 Bán được ' + money(p.v));
    afterCatchResolved();
  }
  function fishRelease() {
    const f = F(), p = f.pending;
    if (!p) return;
    if (!window.PET || typeof window.PET.addFishToTank !== 'function') return toast('Bể cá chưa sẵn sàng.');
    const tank = window.PET.addFishToTank(p.c);
    if (!tank) { toast('Chưa có bể trống chỗ. Mua bể ở Teemall → Shop thú cưng nhé.'); return; }
    f.pending = null;
    logFish('Thả ' + p.name + ' vào ' + tank);
    save(); sfx('win');
    toast('🐟 Đã thả ' + p.name + ' vào ' + tank);
    afterCatchResolved();
  }
  function enterContest() {
    const f = F(), c = f.contest;
    if (c.castsLeft > 0) return toast('Đang thi rồi, câu nốt 5 lượt đi!');
    if (c.done && c.week === weekKey()) return toast('Tuần này thi rồi, tuần sau quay lại nhé.');
    if (!pay(CONTEST_FEE)) return;
    c.week = weekKey(); c.castsLeft = 5; c.score = 0; c.done = false; c.prize = 0; c.rank = 0;
    c.rivals = genRivals();
    save(); sfx('buy'); render();
    toast('🏆 Vào giải rồi, 5 lượt câu tính điểm!');
  }
  function genRivals() {
    return ['Chú Ba Cần Thủ', 'Cô Tư Bến Cá', 'Anh Sáu Lưới'].map(n => ({ n: n, score: rand(60, 260) * 1000 }));
  }
  function settleContest() {
    const f = F(), c = f.contest;
    if (c.done || c.castsLeft > 0) return;
    if (!c.rivals.length) c.rivals = genRivals();
    c.done = true;
    c.rank = 1 + c.rivals.filter(r => r.score > c.score).length;
    c.prize = CONTEST_PRIZES[c.rank - 1] || 0;
    if (c.prize > 0) addMoney(c.prize);
    save(); sfx(c.prize > 0 ? 'win' : 'lose'); render();
  }

  // ===================== CHỢ ĐÊM =====================
  const GOODS = [
    { id: 'gao', n: 'Gạo', e: '🌾', base: 80000 },
    { id: 'ca-phe', n: 'Cà phê', e: '☕', base: 120000 },
    { id: 'cao-su', n: 'Cao su', e: '🌳', base: 150000 },
    { id: 'tieu', n: 'Hạt tiêu', e: '🌶️', base: 180000 },
    { id: 'mat-ong', n: 'Mật ong', e: '🍯', base: 200000 },
    { id: 'tom-kho', n: 'Tôm khô', e: '🦐', base: 240000 }
  ];
  function M() {
    const s = S();
    if (!s.market || typeof s.market !== 'object') s.market = {};
    const m = s.market;
    if (!m.prices || typeof m.prices !== 'object') m.prices = {};
    if (!m.hold || typeof m.hold !== 'object') m.hold = {};
    if (!m.prev || typeof m.prev !== 'object') m.prev = {};
    if (!Array.isArray(m.events)) m.events = [];
    if (m.day !== dayKey()) rollMarket(m);
    return m;
  }
  function rollMarket(m) {
    const first = !m.prices || Object.keys(m.prices).length === 0;
    const idx = shuffle(GOODS.map((g, i) => i));
    const boostId = GOODS[idx[0]].id, crashId = GOODS[idx[1]].id;
    const prices = {}, prev = {}, events = [];
    GOODS.forEach(g => {
      const p0 = first ? g.base : (m.prices[g.id] || g.base);
      prev[g.id] = p0;
      let next = Math.round((p0 * (0.82 + Math.random() * 0.36)) / 1000) * 1000;
      if (g.id === boostId) { next = next * 1.22; events.push({ id: g.id, txt: g.n + ' khan hàng, giá tăng vọt!' }); }
      if (g.id === crashId) { next = next * 0.78; events.push({ id: g.id, txt: g.n + ' ế hàng, giá lao dốc.' }); }
      const lo = Math.round(g.base * 0.45 / 1000) * 1000, hi = Math.round(g.base * 2.2 / 1000) * 1000;
      prices[g.id] = Math.max(lo, Math.min(hi, Math.round(next / 1000) * 1000));
    });
    m.day = dayKey(); m.prices = prices; m.prev = prev; m.events = events;
    save();
  }
  function mktBuy(id, qty) {
    const m = M(), g = GOODS.find(x => x.id === id);
    if (!g) return;
    const price = Math.round((m.prices[id] || g.base) * 1.02);
    const total = price * qty;
    if (!pay(total)) return;
    const h = m.hold[id] || { qty: 0, cost: 0 };
    h.cost = (h.cost * h.qty + total) / (h.qty + qty);
    h.qty += qty;
    m.hold[id] = h;
    save(); sfx('buy'); render();
    toast('Mua ' + qty + ' ' + g.n + ' · ' + money(total));
  }
  function mktSell(id, qty) {
    const m = M(), g = GOODS.find(x => x.id === id);
    if (!g) return;
    const h = m.hold[id];
    if (!h || h.qty <= 0) return toast('Không có hàng để bán.');
    qty = Math.min(qty, h.qty);
    const price = Math.round((m.prices[id] || g.base) * 0.98);
    const total = price * qty, cost = h.cost * qty;
    h.qty -= qty;
    if (h.qty <= 0) delete m.hold[id];
    addMoney(total); save(); sfx('coin'); render();
    const diff = total - cost;
    toast('Bán ' + qty + ' ' + g.n + ' · ' + money(total) + (diff >= 0 ? ' · lời ' + money(diff) : ' · lỗ ' + money(-diff)));
  }

  // ===================== RENDER =====================
  function hero(tone, art, kicker, title, sub, stats) {
    return '<div class="p-hero ' + tone + '">'
      + '<div class="p-hero-art">' + art + '</div>'
      + '<div class="p-hero-body">'
      + '<div class="p-kicker">' + kicker + '</div>'
      + '<div class="p-hero-title">' + title + '</div>'
      + '<div class="p-hero-sub">' + sub + '</div>'
      + '<div class="p-stats">' + stats.map(s => '<div class="p-stat"><b>' + s[1] + '</b><span>' + s[0] + '</span></div>').join('') + '</div>'
      + '</div></div>';
  }
  function card(icon, title, meta, inner) {
    return '<div class="p-card"><div class="p-sec"><span class="p-sec-ico">' + icon + '</span><b>' + title + '</b>'
      + (meta ? '<span class="p-meta">' + meta + '</span>' : '') + '</div>' + inner + '</div>';
  }
  function balls(nums, hitList, small) {
    return nums.map(n => '<span class="viet-ball' + (small ? ' sm' : '') + (hitList && hitList.indexOf(n) !== -1 ? ' hit' : '') + '">' + n + '</span>').join('');
  }
  function rankList(c) {
    const list = (c.rivals || []).map(r => ({ n: r.n, s: r.score })).concat([{ n: 'Bạn', s: c.score, me: true }]);
    list.sort((a, b) => b.s - a.s);
    const medal = ['🥇', '🥈', '🥉'];
    return list.map((x, i) => '<div class="p-rank' + (x.me ? ' me' : '') + '">'
      + '<span class="pos">' + (i < 3 ? medal[i] : i + 1) + '</span>'
      + '<span class="who">' + x.n + '</span><span class="sc">' + money(x.s) + '</span></div>').join('');
  }

  function renderLottery(body) {
    const l = L();
    const t = l.scratchTicket;
    let scratchHtml;
    if (!t) {
      scratchHtml = '<div class="scratch-empty"><div class="big">🎟️</div>'
        + '<div class="p-sub">Cào 9 ô, ba biểu tượng trùng nhau là trúng vé.</div></div>'
        + '<button class="p-btn p-btn-gold" onclick="Play.buyScratch()">Mua vé · ' + money(SCRATCH_COST) + '</button>';
    } else {
      const cells = t.cells.map((sym, i) => {
        const rv = t.revealed[i];
        const win = rv && sym === t.winSym;
        return '<button class="scratch-cell' + (rv ? ' revealed' : '') + (win ? ' win' : '') + '" onclick="Play.scratch(' + i + ')">' + (rv ? sym : '?') + '</button>';
      }).join('');
      const done = t.done;
      scratchHtml = '<div class="scratch-grid">' + cells + '</div>'
        + '<div class="scratch-result ' + (done && t.prize > 0 ? 'win' : 'lose') + '">'
        + (done
          ? (t.prize > 0 ? '🎉 Trúng ' + money(t.prize) + ' · ' + t.name : 'Chưa trúng, chúc may mắn lần sau!')
          : 'Cào hết 9 ô để xem kết quả')
        + '</div>'
        + (done ? '<button class="p-btn p-btn-gold" onclick="Play.buyScratch()">Mua vé khác · ' + money(SCRATCH_COST) + '</button>' : '');
    }
    const nums = [];
    for (let i = 1; i <= 45; i++) nums.push('<button class="viet-num' + (l.pick.indexOf(i) !== -1 ? ' on' : '') + '" onclick="Play.pickNum(' + i + ')">' + i + '</button>');
    const picked = l.pick.length ? balls(l.pick) : '<span class="p-sub">Chạm bảng số để chọn 6 con.</span>';
    const tickets = l.tickets.length
      ? l.tickets.map((tk, i) => '<div class="viet-ticket"><b>Vé ' + (i + 1) + '</b>' + balls(tk.n, null, true) + '</div>').join('')
      : '<div class="viet-empty">Chưa giữ vé nào — chọn số rồi bấm Mua vé.</div>';
    let last = '';
    if (l.lastDraw) {
      const w = l.lastDraw.win || [];
      const rows = (l.lastDraw.rows || []).map(r => {
        const hits = r.n.filter(n => w.indexOf(n) !== -1).length;
        return '<div class="p-hist"><span>' + r.n.join(' · ') + '</span><b class="' + (r.prize ? '' : 'zero') + '">'
          + (r.prize ? '+' + bigMoney(r.prize) : 'trúng ' + hits + ' số') + '</b></div>';
      }).join('');
      last = card('🎬', 'Kết quả kỳ #' + (l.lastDraw.round || 1),
        l.lastDraw.jackpot ? 'hũ ' + bigMoney(l.lastDraw.jackpot) : '',
        '<div class="viet-balls">' + balls(w, w) + '</div>' + rows);
    }
    const history = l.history.length
      ? l.history.map(h => '<div class="p-hist"><span>' + h.g + '</span><b class="' + (h.v > 0 ? '' : 'zero') + '">'
        + (h.v > 0 ? '+' + bigMoney(h.v) : 'không trúng') + '</b></div>').join('')
      : '<div class="p-sub">Chưa chơi lần nào.</div>';
    body.innerHTML = ''
      + hero('tone-gold', '🎟️', 'Giải trí', 'Vé số & Vietlott', 'Cào vé 2 triệu, hũ độc đắc trăm tỷ đổi mỗi kỳ.',
        [['vé cào', l.scratchLeft + '/' + SCRATCH_PER_DAY], ['vé vietlott', l.vietLeft + '/' + VIET_PER_DAY], ['hũ độc đắc', bigMoney(l.jackpot)]])
      + card('🎟️', 'Cào vé may mắn', 'thưởng 2 triệu', scratchHtml)
      + card('🎱', 'Vietlott 6/45', 'kỳ #' + l.round,
        '<div class="viet-jackpot"><div class="vj-l"><span class="vj-k">💎 Hũ độc đắc</span><span class="vj-s">Quay mỗi ngày · ' + money(VIET_COST) + '/vé</span></div><b class="vj-v">' + bigMoney(l.jackpot) + '</b></div>'
        + '<div class="viet-grid">' + nums.join('') + '</div>'
        + '<div class="viet-balls">' + picked + '</div>'
        + '<div class="p-btn-row"><button class="p-btn p-btn-ghost" onclick="Play.luckyPick()">🎲 Chọn nhanh</button><button class="p-btn p-btn-pink" onclick="Play.buyViet()">🎱 Mua vé</button></div>'
        + '<div class="p-sub" style="margin-top:2px;">Vé đang giữ</div>' + tickets
        + '<button class="p-btn p-btn-night" onclick="Play.drawViet()">🎬 Quay số kỳ #' + l.round + '</button>'
        + '<div class="p-sub">Trúng 2 số 20.000đ · 3 số 100.000đ · 4 số 1.000.000đ · 5 số 10.000.000đ · 6 số ăn trọn hũ.</div>')
      + last
      + card('📜', 'Lịch sử gần đây', '', history);
  }

  function renderFishing(body) {
    const f = F(), c = f.contest;
    const contestOn = c.castsLeft > 0;
    const left = contestOn ? c.castsLeft : f.casts;
    const p = f.pending;
    let stage;
    if (p) {
      stage = '<div class="fish-result">'
        + '<div style="display:flex;align-items:center;gap:10px;">'
        + '<div class="fish-ico">' + p.emoji + '</div>'
        + '<div style="min-width:0;"><div class="nm">' + p.name + (p.rare ? ' · cá quý' : '') + '</div>'
        + '<div class="val">' + money(p.v) + '</div>'
        + '<div class="p-sub">' + (p.perfect ? 'Giật chuẩn xác! ' : '') + 'Bán hoặc thả vào bể.</div></div></div>'
        + '<div class="p-btn-row"><button class="p-btn p-btn-mint" onclick="Play.fishSell()">💰 Bán</button>'
        + '<button class="p-btn p-btn-ghost" onclick="Play.fishRelease()">🫧 Thả vào bể</button></div>'
        + '</div>';
    } else if (fishAnim) {
      const zl = Math.max(0, (fishAnim.zoneC - 0.15) * 100), zw = 30;
      stage = '<div class="fish-stage">'
        + '<div class="fish-water">🐟 🐠 🐡</div>'
        + '<div class="fish-bar" id="fish-bar"><div class="fish-zone" id="fish-zone" style="left:' + zl + '%;width:' + zw + '%;"></div><div class="fish-needle" id="fish-needle" style="left:' + (fishAnim.pos * 100) + '%;"></div></div>'
        + '<button class="p-btn p-btn-pink" onclick="Play.fishReel()">🎣 Giật!</button>'
        + '</div>';
    } else {
      stage = '<div class="fish-stage calm">'
        + '<div class="fish-water" style="animation:none;">🌊 🌊 🌊</div>'
        + '<button class="p-btn p-btn-pink" onclick="Play.fishCast()">🎣 Thả cần · ' + money(BAIT) + '</button>'
        + '</div>';
    }
    let contestHtml;
    if (c.castsLeft > 0) {
      contestHtml = '<div class="p-sub">Còn <b>' + c.castsLeft + '</b> lượt thi · điểm của bạn <b>' + money(c.score) + '</b></div>' + rankList(c);
    } else if (c.done) {
      contestHtml = '<div class="p-sub">Kết quả: hạng <b>' + c.rank + '</b> · điểm <b>' + money(c.score) + '</b> · thưởng <b>' + money(c.prize) + '</b></div>' + rankList(c)
        + (c.week === weekKey()
          ? '<div class="p-sub">Tuần sau mở giải mới.</div>'
          : '<button class="p-btn p-btn-gold" onclick="Play.enterContest()">🏆 Vào giải tuần này · ' + money(CONTEST_FEE) + '</button>');
    } else if (c.week === weekKey()) {
      contestHtml = '<div class="p-sub">Câu xong 5 lượt · điểm <b>' + money(c.score) + '</b>. Bán hoặc thả cá đang giữ để chốt điểm.</div>' + rankList(c);
    } else {
      contestHtml = '<div class="p-sub">Vé vào giải ' + money(CONTEST_FEE) + ' · câu 5 lượt tính điểm. Nhất 400.000đ · Nhì 180.000đ · Ba 60.000đ.</div>'
        + '<button class="p-btn p-btn-gold" onclick="Play.enterContest()">🏆 Vào giải · ' + money(CONTEST_FEE) + '</button>';
    }
    const log = f.log.length ? f.log.map(t => '<div>· ' + t + '</div>').join('') : '<div>Chưa câu được con nào.</div>';
    body.innerHTML = ''
      + hero('tone-sea', '🎣', 'Bến sông', 'Câu cá', 'Canh con trỏ vào vùng xanh rồi giật — càng gần tâm cá càng quý.',
        [['lượt còn', left + '/' + (contestOn ? 5 : DAILY_CASTS)], ['điểm giải', money(c.score)], ['hạng', c.done ? '#' + c.rank : '-']])
      + card('🌊', 'Bến cá', contestOn ? 'lượt thi' : 'mồi ' + money(BAIT), stage
        + '<div class="p-sub">Bấm Thả cần, chờ con trỏ chạy vào vùng xanh rồi Giật.</div>')
      + card('🏆', 'Giải đấu cần thủ', '5 lượt', contestHtml)
      + card('🧾', 'Nhật ký câu', '', '<div class="fish-log">' + log + '</div>');
  }

  function renderMarket(body) {
    const m = M();
    let qty = 0, cost = 0, val = 0;
    GOODS.forEach(g => {
      const h = m.hold[g.id];
      if (h && h.qty > 0) { qty += h.qty; cost += h.cost * h.qty; val += Math.round((m.prices[g.id] || g.base) * 0.98) * h.qty; }
    });
    const diff = val - cost;
    const rows = GOODS.map(g => {
      const price = m.prices[g.id] || g.base;
      const prev = m.prev[g.id] || g.base;
      const chg = Math.round((price - prev) / prev * 100);
      const h = m.hold[g.id];
      const buy = Math.round(price * 1.02), sell = Math.round(price * 0.98);
      const cls = chg > 0 ? 'up' : chg < 0 ? 'down' : 'flat';
      const arrow = chg > 0 ? '▲' : chg < 0 ? '▼' : '•';
      let holdTxt = '';
      if (h && h.qty > 0) {
        const d = sell * h.qty - h.cost * h.qty;
        holdTxt = '<div class="mkt-hold">Đang giữ <b>' + h.qty + '</b> · vốn ' + money(h.cost) + '/món · '
          + (d >= 0 ? 'lời <b class="profit">' + money(d) + '</b>' : 'lỗ <b class="loss">' + money(-d) + '</b>') + '</div>';
      }
      return '<div class="mkt-row">'
        + '<div class="mkt-top"><div class="mkt-ico">' + g.e + '</div>'
        + '<div class="mkt-name"><span class="nm">' + g.n + '</span><span class="sub">Mua ' + money(buy) + ' · Bán ' + money(sell) + '</span></div>'
        + '<div class="mkt-right"><span class="mkt-price">' + money(price) + '</span><span class="mkt-chg ' + cls + '">' + arrow + ' ' + Math.abs(chg) + '%</span></div></div>'
        + holdTxt
        + '<div class="mkt-btns">'
        + '<button onclick="Play.mktBuy(\'' + g.id + '\',1)">Mua 1</button>'
        + '<button onclick="Play.mktBuy(\'' + g.id + '\',5)">Mua 5</button>'
        + (h && h.qty > 0
          ? '<button class="sell" onclick="Play.mktSell(\'' + g.id + '\',1)">Bán 1</button><button class="ghost" onclick="Play.mktSell(\'' + g.id + '\',' + h.qty + ')">Bán hết</button>'
          : '')
        + '</div></div>';
    }).join('');
    const events = m.events.length
      ? m.events.map(e => '<div class="mkt-event">📣 ' + e.txt + '</div>').join('')
      : '<div class="mkt-event">🌙 Hôm nay chợ êm, không có tin gì.</div>';
    body.innerHTML = hero('tone-night', '🌙', 'Chợ đêm', 'Đầu cơ', 'Mua lúc rẻ, bán lúc đắt — chợ lấy 2% mỗi chiều.',
      [['đang giữ', qty ? qty + ' món' : 'chưa có'], ['lãi tạm tính', qty ? (diff >= 0 ? '+' : '-') + money(Math.abs(diff)) : '—']])
      + card('📰', 'Tin chợ', 'hôm nay', events)
      + card('🏷️', 'Bảng giá', 'mua +2% · bán −2%', rows);
  }

  function stopFishLoop() { if (fishAnim && fishAnim.raf) { cancelAnimationFrame(fishAnim.raf); fishAnim.raf = 0; } }

  function render() {
    const body = document.getElementById('play-body');
    if (!body) return;
    document.querySelectorAll('#play-tabs .play-tab').forEach(b => b.classList.toggle('on', b.getAttribute('data-tab') === tab));
    try {
      if (tab === 'lottery') renderLottery(body);
      else if (tab === 'fishing') renderFishing(body);
      else if (tab === 'market') renderMarket(body);
    } catch (e) { console.error('Play.render', e); }
    if (tab === 'fishing') { if (fishAnim) startFishLoop(); } else stopFishLoop();
    refreshWallets();
  }

  window.Play = {
    render: render,
    tab: (name) => {
      if (name === 'farm') { if (window.FarmGame) window.FarmGame.enter(); return; }
      if (name === tab) return;
      tab = name;
      render();
    },
    stop: () => { if (window.FarmGame) window.FarmGame.unmount(); stopFishLoop(); },
    buyScratch, scratch: scratchCell,
    pickNum, luckyPick, buyViet, drawViet,
    fishCast, fishReel, fishSell, fishRelease, enterContest,
    mktBuy, mktSell
  };
})();
