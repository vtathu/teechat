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

  // ===== VÉ SỐ TRUYỀN THỐNG: sổ 16:30, vé giấy nằm trong túi, ra quầy dò =====
  const XSK_COST = 10000;
  const XSK_CUTOFF = 16 * 60 + 30;
  const XSK_PER_DAY = 20;
  const XSK_REGIONS = {
    mb: { name: 'Miền Bắc', short: 'Bắc', len: 5 },
    mt: { name: 'Miền Trung', short: 'Trung', len: 6 },
    mn: { name: 'Miền Nam', short: 'Nam', len: 6 }
  };
  const XSK_SOUTH_TIERS = [
    { key: 'db', name: 'Đặc biệt', len: 6, count: 1, value: 2000000000 },
    { key: 'nhat', name: 'Nhất', len: 5, count: 1, value: 30000000 },
    { key: 'nhi', name: 'Nhì', len: 5, count: 2, value: 15000000 },
    { key: 'ba', name: 'Ba', len: 5, count: 2, value: 10000000 },
    { key: 'tu', name: 'Tư', len: 5, count: 7, value: 3000000 },
    { key: 'nam', name: 'Năm', len: 4, count: 1, value: 1000000 },
    { key: 'sau', name: 'Sáu', len: 4, count: 3, value: 400000 },
    { key: 'bay', name: 'Bảy', len: 3, count: 1, value: 200000 },
    { key: 'tam', name: 'Tám', len: 2, count: 1, value: 100000 }
  ];
  const XSK_TIERS = {
    mb: [
      { key: 'db', name: 'Đặc biệt', len: 5, count: 1, value: 1000000000 },
      { key: 'nhat', name: 'Nhất', len: 5, count: 1, value: 10000000 },
      { key: 'nhi', name: 'Nhì', len: 5, count: 2, value: 5000000 },
      { key: 'ba', name: 'Ba', len: 5, count: 6, value: 1000000 },
      { key: 'tu', name: 'Tư', len: 4, count: 4, value: 400000 },
      { key: 'nam', name: 'Năm', len: 4, count: 6, value: 200000 },
      { key: 'sau', name: 'Sáu', len: 3, count: 3, value: 100000 },
      { key: 'bay', name: 'Bảy', len: 2, count: 4, value: 40000 }
    ],
    mt: XSK_SOUTH_TIERS,
    mn: XSK_SOUTH_TIERS
  };
  let xskRegion = 'mb', xskSaid = '';
  let xskLastCheck = null, xskFocus = '', currentStall = '';
  let lotClockTimer = null, lotClockMark = '', lotSayTimer = null;

  function addDay(day, n) {
    const a = day.split('-').map(Number);
    const d = new Date(a[0], a[1] - 1, a[2] + n);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  const dmy = (day) => day.slice(8, 10) + '/' + day.slice(5, 7);
  const xskDrawAt = (day) => { const a = day.split('-').map(Number); return new Date(a[0], a[1] - 1, a[2], 16, 30, 0, 0).getTime(); };
  const canDraw = (day) => Date.now() >= xskDrawAt(day);
  const currentDrawDay = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes() >= XSK_CUTOFF ? addDay(dayKey(), 1) : dayKey(); };
  // Vé 6 số (Trung, Nam) dò được ngay, không phải chờ 16:30; vé Bắc 5 số vẫn chờ giờ sổ
  const isSixDigit = (region) => !!(XSK_REGIONS[region] && XSK_REGIONS[region].len === 6);
  const drawDayOf = (region) => isSixDigit(region) ? dayKey() : currentDrawDay();
  const ticketOpen = (o) => !!(o && o.ticket && (isSixDigit(o.ticket.region) || canDraw(o.ticket.drawDay)));
  const fmtTicket = (s) => String(s || '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  function X() {
    const l = L();
    if (!l.xsk || typeof l.xsk !== 'object') l.xsk = {};
    const x = l.xsk;
    if (!x.results || typeof x.results !== 'object') x.results = {};
    if (!Array.isArray(x.history)) x.history = [];
    if (typeof x.buyDay !== 'string') x.buyDay = '';
    if (typeof x.buyCount !== 'number') x.buyCount = 0;
    return x;
  }
  function seedOf(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function seeded(str) {
    let a = seedOf(str);
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function digitRun(rng, len) { let s = ''; for (let i = 0; i < len; i++) s += Math.floor(rng() * 10); return s; }
  function xskResult(day, region) {
    const x = X();
    if (!x.results[day]) x.results[day] = {};
    if (x.results[day][region]) return x.results[day][region];
    const rng = seeded('xsk|' + day + '|' + region);
    const out = {};
    XSK_TIERS[region].forEach(t => {
      const arr = [];
      for (let i = 0; i < t.count; i++) arr.push(digitRun(rng, t.len));
      out[t.key] = arr;
    });
    x.results[day][region] = out;
    const days = Object.keys(x.results).sort();
    while (days.length > 20) delete x.results[days.shift()];
    save();
    return out;
  }
  function xskBoughtToday() {
    const x = X();
    if (x.buyDay !== dayKey()) { x.buyDay = dayKey(); x.buyCount = 0; }
    return x.buyCount;
  }
  function bagTickets(product) {
    return (S().inventory || []).filter(o => o && o.cat === 'ticket' && o.ticket && (!product || o.ticket.product === product));
  }
  function newXskTicket(region, digits, drawDay) {
    return {
      id: 'ticket-xsk-' + region,
      name: '🎟️ Vé ' + XSK_REGIONS[region].name + ' · ' + fmtTicket(digits),
      singleName: 'Vé số ' + XSK_REGIONS[region].short,
      qty: 1,
      cat: 'ticket',
      paid: XSK_COST,
      desc: 'Kỳ ' + dmy(drawDay) + (isSixDigit(region) ? ' · dò được ngay' : ' · sổ 16:30'),
      uniqueId: 'tk-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
      ticket: { product: 'xsk', region: region, digits: digits, drawDay: drawDay, paid: XSK_COST }
    };
  }
  const FAN_LETTERS = 'ABCDEFGHIJKLMNOPQRST';
  const FAN_DECK_VERSION = 2;
  function fanDeck(day, region) {
    const x = X();
    if (!x.fans || typeof x.fans !== 'object') x.fans = {};
    const key = day + '|' + region;
    let d = x.fans[key];
    if (!d || d.v !== FAN_DECK_VERSION || !Array.isArray(d.list) || d.list.length !== XSK_PER_DAY) {
      // Như xấp vé thật: thỉnh thoảng 2-3 tờ liền nhau trùng số để mua nhiều tờ một số
      const rng = seeded('xskfan2|' + day + '|' + region);
      const meta = XSK_REGIONS[region];
      d = { v: FAN_DECK_VERSION, list: [] };
      let run = 0;
      for (let i = 0; i < XSK_PER_DAY; i++) {
        let digits;
        if (i > 0 && run < 3 && rng() < 0.4) { digits = d.list[i - 1].digits; run++; }
        else { digits = digitRun(rng, meta.len); run = 0; }
        d.list.push({ digits: digits, serial: FAN_LETTERS[i], sold: false });
      }
      x.fans[key] = d;
      const keys = Object.keys(x.fans).sort();
      while (keys.length > 60) delete x.fans[keys.shift()];
      save();
    }
    return d;
  }
  function ticketPrize(t) {
    const res = xskResult(t.drawDay, t.region);
    const hits = [];
    let total = 0;
    XSK_TIERS[t.region].forEach(tier => (res[tier.key] || []).forEach(num => {
      if (t.digits.endsWith(num)) { hits.push({ tier: tier.name, num: num, value: tier.value }); total += tier.value; }
    }));
    return { total: total, hits: hits };
  }

  const SCRATCH_TYPES = {
    mystery: { name: 'Ô Số Bí Ẩn' },
    magic: { name: 'Số Thần Kỳ' }
  };
  // Giữ nguyên tỉ lệ cũ: trung bình hoàn 17.400đ trên vé 20.000đ
  const SCRATCH_ROWS = [
    { p: 0.003, prize: 2000000 },
    { p: 0.010, prize: 300000 },
    { p: 0.050, prize: 80000 },
    { p: 0.220, prize: 20000 }
  ];
  // Tiền in sẵn dưới mỗi ô / mỗi hàng, kể cả ô không trùng
  const SCRATCH_PRINTS = [
    20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000,
    30000, 30000, 30000, 30000, 50000, 50000, 50000, 50000,
    100000, 100000, 100000, 100000, 200000, 200000, 500000, 1000000, 2000000, 5000000
  ];
  const SCRATCH_PARTS = { 2000000: [2000000], 300000: [200000, 100000], 80000: [50000, 30000], 20000: [20000] };
  const pad2 = (n) => String(n).padStart(2, '0');

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
    if (l.scratchTicket && !l.scratchTicket.type) {
      // Vé kiểu cũ: chưa cào thì đổi sang vé mới giữ nguyên giải, cào rồi thì bỏ
      l.scratchTicket = l.scratchTicket.done ? null : makeScratch('mystery', l.scratchTicket.prize || 0);
    }
    if (l.scratchTicket && typeof l.scratchTicket.claimed !== 'boolean') l.scratchTicket.claimed = !!l.scratchTicket.done;
    return l;
  }
  function logPlay(g, v) { const l = L(); l.history.unshift({ g: g, v: Math.round(v || 0) }); l.history = l.history.slice(0, 6); }
  function rollScratch() {
    const r = Math.random();
    let acc = 0;
    for (let i = 0; i < SCRATCH_ROWS.length; i++) { acc += SCRATCH_ROWS[i].p; if (r < acc) return SCRATCH_ROWS[i]; }
    return null;
  }
  function uniqueNums(n, ban) {
    const out = [], blocked = new Set(ban || []);
    while (out.length < n) {
      const v = rand(1, 99);
      if (blocked.has(v) || out.indexOf(v) !== -1) continue;
      out.push(v);
    }
    return out;
  }
  const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
  function scratchParts(total) {
    if (total > 0 && SCRATCH_PARTS[total]) return SCRATCH_PARTS[total].slice();
    return total > 0 ? [Math.round(total)] : [];
  }
  function makeScratch(type, forcedPrize) {
    type = SCRATCH_TYPES[type] ? type : 'mystery';
    const row = forcedPrize === undefined || forcedPrize === null ? rollScratch() : null;
    const total = row ? row.prize : Math.max(0, Math.round(forcedPrize || 0));
    const base = {
      type: type,
      prize: total,
      parts: scratchParts(total),
      done: false,
      voided: false,
      claimed: false,
      issued: Date.now(),
      serial: 'TC' + rand(100000, 999999) + pad2(rand(1, 99))
    };
    return type === 'magic' ? makeMagicTicket(base) : makeMysteryTicket(base);
  }
  // Ô Số Bí Ẩn: 4 số trúng, 20 ô của bạn; trùng số nào ăn tiền in dưới ô đó
  function makeMysteryTicket(base) {
    const parts = base.parts.slice();
    const win = shuffle(uniqueNums(4)).sort((a, b) => a - b);
    const hitIdx = shuffle([...Array(20).keys()]).slice(0, parts.length).sort((a, b) => a - b);
    const prizes = Array.from({ length: 20 }, () => pickOne(SCRATCH_PRINTS));
    const nums = new Array(20).fill(0);
    hitIdx.forEach((idx, k) => { prizes[idx] = parts[k]; nums[idx] = win[k]; });
    const rest = uniqueNums(20 - parts.length, win);
    let ri = 0;
    for (let i = 0; i < 20; i++) if (!nums[i]) nums[i] = rest[ri++];
    base.winNums = win;
    base.cells = nums.map((n, i) => ({ n: n, prize: prizes[i], hit: hitIdx.indexOf(i) !== -1 }));
    base.hits = base.cells.filter(c => c.hit);
    return base;
  }
  // Số Thần Kỳ: 4 hàng độc lập, hàng có số may mắn thì ăn tiền của hàng đó
  function makeMagicTicket(base) {
    const parts = base.parts.slice();
    const winIdx = shuffle([0, 1, 2, 3]).slice(0, parts.length);
    base.rows = [0, 1, 2, 3].map(i => {
      const prize = winIdx.indexOf(i) !== -1 ? parts[winIdx.indexOf(i)] : pickOne(SCRATCH_PRINTS);
      const lucky = rand(1, 99);
      const nums = uniqueNums(4, [lucky]);
      if (winIdx.indexOf(i) !== -1) nums[rand(0, 3)] = lucky;
      return { lucky: lucky, nums: nums, prize: prize, win: winIdx.indexOf(i) !== -1 };
    });
    base.prize = base.rows.reduce((s, r) => s + (r.win ? r.prize : 0), 0);
    return base;
  }
  function buyScratch(type) {
    const l = L();
    type = SCRATCH_TYPES[type] ? type : 'mystery';
    if (l.scratchTicket && !l.scratchTicket.done) return toast('Cào hết vé đang có trước nhé.');
    if (l.scratchLeft <= 0) return toast('Hết vé cào hôm nay, mai quay lại nhé.');
    if (!pay(SCRATCH_COST)) return;
    l.scratchLeft--;
    l.scratchTicket = makeScratch(type);
    save(); sfx('scratch'); render();
  }
  function finishScratch(t) {
    const l = L();
    if (t.claimed) return;
    t.claimed = true;
    if (t.prize > 0 && !t.voided) {
      addMoney(t.prize); logPlay('Cào vé', t.prize); sfx('win');
      toast('🎉 Trúng ' + money(t.prize) + '!');
    } else {
      logPlay('Cào vé', 0); sfx('lose');
    }
    save();
    refreshWallets();
  }
  function scratchAll() {
    const t = L().scratchTicket;
    if (!t || t.done) return;
    t.done = true;
    finishScratch(t);
    renderStall(true);
  }
  function completeScratch() {
    const t = L().scratchTicket;
    if (!t || t.done) return;
    t.done = true;
    finishScratch(t);
    const cv = document.getElementById('scratch-canvas');
    if (cv) { cv.style.opacity = '0'; cv.style.pointerEvents = 'none'; }
    setTimeout(() => { if (currentStall === 'scratch') renderStall(true); }, 340);
  }
  function noScratch() {
    const t = L().scratchTicket;
    if (!t || t.done) return;
    if (!window.confirm('Đây là mã bảo mật của đại lý. Cào vào là vé vô hiệu, mất luôn tiền thưởng. Vẫn cào?')) return;
    t.voided = true; t.done = true; t.claimed = true; t.prize = 0;
    logPlay('Cào vé', 0);
    save(); sfx('error'); renderStall(true);
    toast('Vé đã bị vô hiệu vì cào vào phần mã bảo mật.');
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

  // ===================== PHỐ VÉ SỐ =====================
  function buyTicket(index) {
    const drawDay = drawDayOf(xskRegion);
    const deck = fanDeck(drawDay, xskRegion);
    const t = deck.list[index];
    if (!t || t.sold) return toast('Tờ này có người lấy rồi.');
    const bought = xskBoughtToday();
    if (bought >= XSK_PER_DAY) return toast('Hôm nay chỉ mua được ' + XSK_PER_DAY + ' vé thôi.');
    if (wallet() < XSK_COST) return toast('Không đủ tiền rồi.');
    addMoney(-XSK_COST);
    const x = X();
    x.buyCount = bought + 1;
    t.sold = true;
    (S().inventory || (S().inventory = [])).push(newXskTicket(xskRegion, t.digits, drawDay));
    const sameLeft = deck.list.filter(x => !x.sold && x.digits === t.digits).length;
    xskSaid = 'Tờ ' + t.serial + ' của con đó. '
      + (sameLeft ? 'Còn ' + sameLeft + ' tờ cùng số nếu con muốn lấy.' : 'Chúc trúng lớn nha!');
    save(); sfx('buy'); render();
    toast('Đã mua tờ ' + t.serial + ' · ' + fmtTicket(t.digits));
  }
  function xskCheck(uid) {
    const inv = S().inventory || [];
    const i = inv.findIndex(o => o && o.uniqueId === uid);
    if (i < 0) return;
    const t = inv[i];
    if (!t.ticket || !ticketOpen(t)) return toast('Chưa tới giờ sổ của vé này.');
    const r = ticketPrize(t.ticket);
    inv.splice(i, 1);
    const x = X();
    x.history.unshift({ day: t.ticket.drawDay, region: t.ticket.region, digits: t.ticket.digits, prize: r.total, hits: r.hits.map(h => h.tier), at: Date.now() });
    x.history = x.history.slice(0, 20);
    if (r.total > 0) addMoney(r.total);
    save(); sfx(r.total > 0 ? 'win' : 'lose');
    xskLastCheck = { ticket: t.ticket, total: r.total, hits: r.hits };
    xskFocus = '';
    xskSaid = r.total > 0 ? 'Trúng ' + money(r.total) + ' rồi con ơi! Cô mừng quá!' : 'Tờ này chưa trúng, mai thử vận may nha con.';
    render();
    toast(r.total > 0 ? 'Trúng ' + money(r.total) + '!' : 'Vé này chưa trúng, để dành may mắn lần sau.');
  }
  function xskCheckAll() {
    const inv = S().inventory || [];
    const ready = inv.filter(o => o && o.cat === 'ticket' && o.ticket && o.ticket.product === 'xsk' && ticketOpen(o));
    if (!ready.length) return toast('Chưa có vé nào tới giờ dò.');
    const x = X();
    let total = 0, wins = 0;
    ready.forEach(t => {
      const r = ticketPrize(t.ticket);
      total += r.total;
      if (r.total > 0) wins++;
      x.history.unshift({ day: t.ticket.drawDay, region: t.ticket.region, digits: t.ticket.digits, prize: r.total, hits: r.hits.map(h => h.tier), at: Date.now() });
    });
    x.history = x.history.slice(0, 20);
    const ids = new Set(ready.map(o => o.uniqueId));
    S().inventory = inv.filter(o => !ids.has(o.uniqueId));
    if (total > 0) addMoney(total);
    save(); sfx(total > 0 ? 'win' : 'lose');
    xskLastCheck = { bulk: true, count: ready.length, wins: wins, total: total };
    xskFocus = '';
    xskSaid = total > 0 ? 'Dò ' + ready.length + ' vé, trúng ' + money(total) + ' đó con!' : 'Cả xấp chưa trúng tờ nào, mai quay lại nha con.';
    render();
    toast(total > 0 ? 'Dò ' + ready.length + ' vé · trúng ' + money(total) + '!' : 'Dò ' + ready.length + ' vé · chưa vé nào trúng.');
  }
  function setXskRegion(r) { if (!XSK_REGIONS[r]) return; xskRegion = r; xskSaid = ''; renderStall(); }
  function openDraw(uid) {
    const t = (S().inventory || []).find(o => o && o.uniqueId === uid);
    if (!t || !t.ticket) return;
    xskRegion = t.ticket.region;
    xskFocus = uid;
    tab = 'lottery';
    if (typeof openFs === 'function') openFs('play');
    render();
    stall('xsk');
    setTimeout(() => { const el = document.getElementById('lot-' + uid); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 120);
  }
  function stall(name) {
    if (!name) return;
    currentStall = name;
    if (name === 'xsk') xskSaid = '';
    const title = document.getElementById('ticket-sheet-title');
    if (title) title.textContent = name === 'xsk' ? '🎟️ Vé số ba miền' : name === 'scratch' ? '🎟️ Cào vé' : '🎱 Vietlott';
    renderStall(true);
    if (typeof openModal === 'function') openModal('modal-ticket');
    sfx('click');
  }
  function closeStall() { currentStall = ''; stopSellerTimer(); if (typeof closeModal === 'function') closeModal('modal-ticket'); }
  function renderStall(reset) {
    const b = document.getElementById('ticket-sheet-body');
    if (!b || !currentStall) { stopSellerTimer(); return; }
    const keep = reset ? 0 : b.scrollTop;
    if (currentStall === 'xsk') b.innerHTML = xskPanel();
    else if (currentStall === 'scratch') b.innerHTML = scratchPanel();
    else b.innerHTML = vietPanel();
    b.scrollTop = keep;
    if (currentStall === 'xsk') startSellerTimer(); else stopSellerTimer();
    if (currentStall === 'scratch') setupScratchCanvas();
  }
  // Lớp bạc phủ mặt vé: vẽ gradient + chữ, cào bằng con trỏ tới khi lộ hơn nửa vé
  function drawFoil(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#c7cfdd'); g.addColorStop(.26, '#f3f6fb'); g.addColorStop(.5, '#a9b4c8');
    g.addColorStop(.74, '#e9eef6'); g.addColorStop(1, '#b3bed1');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.32)'; ctx.lineWidth = 2;
    for (let x = -h; x < w + h; x += 14) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke(); }
    ctx.restore();
    for (let i = 0; i < 46; i++) {
      ctx.fillStyle = 'rgba(255,255,255,' + (0.12 + Math.random() * 0.45).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 2.4 + 0.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(66,80,106,.5)';
    ctx.font = '700 ' + Math.max(15, Math.round(w * 0.055)) + 'px system-ui, sans-serif';
    for (let y = h * 0.16; y < h; y += h * 0.24) {
      ctx.save(); ctx.translate(w / 2, y); ctx.rotate(-0.14);
      ctx.fillText('CÀO LỚP BẠC', 0, 0);
      ctx.restore();
    }
    ctx.font = '600 ' + Math.max(10, Math.round(w * 0.034)) + 'px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(66,80,106,.4)';
    ctx.fillText('✦   ✦   ✦', w / 2, h * 0.08);
    ctx.fillText('✦   ✦   ✦', w / 2, h * 0.93);
    ctx.restore();
  }
  let scratchResize = null;
  function setupScratchCanvas(retry) {
    const cv = document.getElementById('scratch-canvas');
    const face = document.getElementById('scratch-face');
    const t = L().scratchTicket;
    if (!cv || !face || !t || t.done) {
      if (scratchResize) { window.removeEventListener('resize', scratchResize); scratchResize = null; }
      return;
    }
    const w = Math.round(face.clientWidth), h = Math.round(face.clientHeight);
    if (!w || !h) {
      if ((retry || 0) < 120) requestAnimationFrame(() => setupScratchCanvas((retry || 0) + 1));
      return;
    }
    if (!scratchResize) {
      scratchResize = () => setupScratchCanvas();
      window.addEventListener('resize', scratchResize);
    }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFoil(ctx, w, h);
    let down = false, lastX = 0, lastY = 0, moves = 0;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const rub = (x1, y1, x2, y2) => {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x2, y2, 17, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };
    const cleared = () => {
      try {
        const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
        let clear = 0, total = 0;
        for (let i = 3; i < d.length; i += 64) { total++; if (d[i] < 40) clear++; }
        return total ? clear / total : 0;
      } catch (e) { return 0; }
    };
    const onDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      down = true; moves = 0;
      const p = pos(e);
      lastX = p.x; lastY = p.y;
      rub(p.x, p.y, p.x, p.y);
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!down) return;
      const p = pos(e);
      rub(lastX, lastY, p.x, p.y);
      lastX = p.x; lastY = p.y;
      moves++;
      if (moves % 10 === 0) sfx('scratch');
      if (moves % 16 === 0 && cleared() > 0.5) { down = false; completeScratch(); }
      e.preventDefault();
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      if (cleared() > 0.5) completeScratch();
    };
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
  }
  // Cô Bảy lâu lâu buột miệng câu khác, đổi mỗi 3 phút để không nhảy chữ liên tục
  function xskIdleSay() {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    if (mins >= XSK_CUTOFF - 30 && mins < XSK_CUTOFF) return 'Sắp 16:30 sổ rồi, con có vé thì đem ra dò nha!';
    if (mins >= XSK_CUTOFF && mins < XSK_CUTOFF + 30) return 'Sổ rồi đó, ai có vé đem ra cô dò!';
    const flavors = [
      '16:30 sổ nha con, nhớ ra dò!',
      'Số đổi mỗi ngày, tờ nào cũng có duyên hết.',
      'Con coi tờ nào hợp mắt thì lấy, cô để riêng.',
      'Mấy tờ trùng số kìa, con lấy cả cặp cũng được.',
      'Mua một tờ cũng vui, không cần nhiều đâu.',
      'Sổ xong cô ngồi đây dò cho con, khỏi lo.'
    ];
    const rng = seeded('xskidle|' + Math.floor(Date.now() / 180000));
    if (rng() < 0.45) return flavors[Math.floor(rng() * flavors.length)];
    return 'Vé ba miền đây, mua giúp cô một tờ nha!';
  }
  function xskSayLine() {
    if (xskSaid) return xskSaid;
    const ready = bagTickets('xsk').filter(o => ticketOpen(o)).length;
    if (ready) return 'Có vé rồi, đưa cô dò cho!';
    if (!Math.max(0, XSK_PER_DAY - xskBoughtToday())) return 'Con mua nhiều quá, cô để phần người khác nha!';
    return xskIdleSay();
  }
  function stopSellerTimer() { if (lotSayTimer) { clearInterval(lotSayTimer); lotSayTimer = null; } }
  function startSellerTimer() {
    stopSellerTimer();
    lotSayTimer = setInterval(() => {
      if (currentStall !== 'xsk' || xskSaid) return;
      const el = document.querySelector('#ticket-sheet-body .lot-say span');
      if (!el) return;
      const s = xskSayLine();
      if (el.textContent !== s) el.textContent = s;
    }, 20000);
  }
  function xskPanel() {
    const meta = XSK_REGIONS[xskRegion];
    const all = bagTickets('xsk').sort((a, b) => a.ticket.drawDay.localeCompare(b.ticket.drawDay));
    const ready = all.filter(o => ticketOpen(o));
    const waiting = all.filter(o => !ticketOpen(o));
    const day = drawDayOf(xskRegion);
    const deck = fanDeck(day, xskRegion);
    const left = Math.max(0, XSK_PER_DAY - xskBoughtToday());
    const shelf = deck.list.map((t, i) => ({ t: t, i: i })).filter(o => !o.t.sold).slice(0, 5);
    const regionTabs = Object.keys(XSK_REGIONS).map(k =>
      '<button class="lot-region' + (k === xskRegion ? ' on' : '') + '" onclick="Play.xskRegion(\'' + k + '\')">' + XSK_REGIONS[k].short + '</button>'
    ).join('');
    const say = xskSayLine();
    const vendor = '<div class="lot-vendor">'
      + '<span class="lot-vface"><i class="ls-head"></i><i class="ls-hair"></i><i class="ls-body"></i><i class="ls-arm"></i></span>'
      + '<div class="lot-say"><b>Cô Bảy · quầy vé số</b><span>' + say + '</span></div>'
      + '</div>';
    const fan = shelf.length
      ? '<div class="lot-fan">' + shelf.map(o =>
        '<button class="lot-paper" onclick="Play.buyTicket(' + o.i + ')">'
        + '<span class="lp-side"><span class="lp-top">Vé số ' + meta.short + '</span><span class="lp-date">Sổ ' + dmy(day) + ' · 10.000đ</span></span>'
        + '<b class="lp-num">' + fmtTicket(o.t.digits) + '</b>'
        + '<span class="lp-serial">' + o.t.serial + '</span>'
        + '</button>').join('') + '</div>'
      : '<div class="lot-empty">Cô Bảy đã bán hết xấp vé hôm nay.</div>';
    const buy = vendor
      + '<div class="lot-sec-head"><b>Xấp vé · sổ ' + dmy(day) + '</b><span>' + meta.name + (isSixDigit(xskRegion) ? ' · dò ngay' : ' · chọn một tờ') + '</span></div>'
      + fan
      + '<div class="lot-buy-foot"><span>10.000đ/tờ · số đổi mỗi ngày</span><b>Còn ' + left + ' vé</b></div>';
    let last = '';
    if (xskLastCheck) {
      if (xskLastCheck.bulk) {
        last = '<div class="lot-check-card' + (xskLastCheck.total > 0 ? ' win' : '') + '">'
          + '<b>Đã dò ' + xskLastCheck.count + ' vé</b>'
          + '<span>' + (xskLastCheck.total > 0 ? 'Trúng ' + xskLastCheck.wins + ' vé · +' + money(xskLastCheck.total) : 'Chưa vé nào trúng') + '</span></div>';
      } else {
        const t = xskLastCheck.ticket;
        last = '<div class="lot-check-card' + (xskLastCheck.total > 0 ? ' win' : '') + '">'
          + '<b>Vé ' + fmtTicket(t.digits) + ' · ' + XSK_REGIONS[t.region].short + '</b>'
          + '<span>Kỳ ' + dmy(t.drawDay) + '</span>'
          + (xskLastCheck.total > 0
            ? '<div class="lot-hits">' + xskLastCheck.hits.map(h => '<i>' + h.tier + ' ' + h.num + ' · ' + money(h.value) + '</i>').join('') + '</div>'
            : '<span>Chưa trúng giải nào.</span>')
          + '<strong>' + (xskLastCheck.total > 0 ? '+' + money(xskLastCheck.total) : '0đ') + '</strong></div>';
      }
    }
    let check = '';
    if (ready.length) {
      check += '<div class="lot-sec-head"><b>Dò vé</b><span>' + ready.length + ' vé có kết quả</span></div>';
      if (ready.length > 1) check += '<button class="p-btn p-btn-mint" onclick="Play.xskCheckAll()">Dò tất cả</button>';
      check += ready.map(o => '<div class="lot-ticket' + (o.uniqueId === xskFocus ? ' focus' : '') + '" id="lot-' + o.uniqueId + '">'
        + '<div><b>' + fmtTicket(o.ticket.digits) + '</b><span>Vé ' + XSK_REGIONS[o.ticket.region].short + ' · kỳ ' + dmy(o.ticket.drawDay) + '</span></div>'
        + '<button class="lot-draw-btn" onclick="Play.xskCheck(\'' + o.uniqueId + '\')">Dò</button></div>').join('');
    }
    if (waiting.length) {
      check += '<div class="lot-sec-head"><b>Chờ sổ</b><span>' + waiting.length + ' vé trong túi</span></div>';
      check += waiting.map(o => '<div class="lot-ticket wait"><div><b>' + fmtTicket(o.ticket.digits) + '</b><span>Vé ' + XSK_REGIONS[o.ticket.region].short + ' · ' + (o.ticket.drawDay === dayKey() ? 'sổ 16:30 hôm nay' : 'sổ 16:30 ' + dmy(o.ticket.drawDay)) + '</span></div><span class="lot-wait-tag">Chờ 16:30</span></div>').join('');
    }
    if (!all.length) check += '<div class="lot-empty">Chưa có vé nào trong túi. Mua một tờ rồi quay lại dò nhé.</div>';
    let board;
    if (isSixDigit(xskRegion) || canDraw(dayKey())) {
      const res = xskResult(dayKey(), xskRegion);
      const hits = xskLastCheck && !xskLastCheck.bulk && xskLastCheck.ticket.region === xskRegion && xskLastCheck.ticket.drawDay === dayKey()
        ? xskLastCheck.hits : [];
      board = '<div class="lot-board"><div class="lot-board-head"><b>Kết quả ' + meta.short + ' · ' + dmy(dayKey()) + '</b><span>Sổ 16:30</span></div>'
        + XSK_TIERS[xskRegion].map(t => '<div class="lot-board-row"><span>' + t.name + '</span><b>'
          + (res[t.key] || []).map(n => '<i class="' + (hits.some(h => h.tier === t.name && h.num === n) ? 'on' : '') + '">' + n + '</i>').join('')
          + '</b></div>').join('')
        + '</div>';
    } else {
      board = '<div class="lot-board-off">Bảng kết quả mở lúc 16:30.</div>';
    }
    const hist = X().history.length
      ? '<div class="lot-hist">' + X().history.slice(0, 6).map(h =>
        '<div><span>Vé ' + XSK_REGIONS[h.region].short + ' ' + fmtTicket(h.digits) + ' · ' + dmy(h.day) + '</span><b class="' + (h.prize ? '' : 'zero') + '">' + (h.prize ? '+' + money(h.prize) : 'không trúng') + '</b></div>'
      ).join('') + '</div>'
      : '';
    return '<div class="lot-panel">'
      + '<div class="lot-region-tabs">' + regionTabs + '</div>'
      + buy
      + last
      + check
      + '<div class="lot-sec-head"><b>Bảng kết quả</b><span>' + meta.name + '</span></div>'
      + board
      + (hist ? '<div class="lot-sec-head"><b>Đã dò</b><span>gần đây</span></div>' + hist : '')
      + '</div>';
  }
  function scratchPanel() {
    const l = L(), t = l.scratchTicket;
    const head = '<div class="lot-buy-head"><b>Cào vé may mắn</b><span>Còn ' + Math.max(0, l.scratchLeft) + '/' + SCRATCH_PER_DAY + ' vé hôm nay</span></div>';
    const buyBtns = (sub) => '<div class="sc-buys">'
      + '<button class="sc-buy" onclick="Play.buyScratch(\'mystery\')"><b>Ô Số Bí Ẩn</b><span>' + (sub || '4 số trúng · 20 ô của bạn') + '</span><i>' + money(SCRATCH_COST) + '</i></button>'
      + '<button class="sc-buy" onclick="Play.buyScratch(\'magic\')"><b>Số Thần Kỳ</b><span>' + (sub || '4 hàng · mỗi hàng một số may mắn') + '</span><i>' + money(SCRATCH_COST) + '</i></button>'
      + '</div>';
    if (!t) {
      return '<div class="lot-panel">' + head
        + '<div class="scratch-empty"><div class="big">🎟️</div>'
        + '<div class="p-sub">Chọn loại vé, rồi lấy ngón tay cào lớp bạc.</div></div>'
        + buyBtns()
        + '</div>';
    }
    const done = !!t.done;
    const magic = t.type === 'magic';
    const typeName = SCRATCH_TYPES[t.type] ? SCRATCH_TYPES[t.type].name : 'Ô Số Bí Ẩn';
    const issued = new Date(t.issued || Date.now());
    const deadline = new Date(issued.getTime() + 180 * 864e5);
    const dateTxt = (d) => pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
    let face;
    if (magic) {
      face = '<div class="sc-rows">' + t.rows.map(r =>
        '<div class="sc-row' + (done && r.win ? ' hit' : '') + '">'
        + '<span class="sc-lucky"><em>Số may mắn</em><b>' + pad2(r.lucky) + '</b></span>'
        + '<span class="sc-nums">' + r.nums.map(n => '<i class="' + (n === r.lucky ? 'on' : '') + '">' + pad2(n) + '</i>').join('') + '</span>'
        + '<span class="sc-val">' + money(r.prize) + '</span>'
        + '</div>').join('') + '</div>';
    } else {
      face = '<div class="sc-wins"><span class="sc-lab">SỐ TRÚNG THƯỞNG</span>'
        + '<div class="sc-win-nums">' + t.winNums.map(n => '<i>' + pad2(n) + '</i>').join('') + '</div></div>'
        + '<div class="sc-sec"><span class="sc-lab">Ô SỐ CỦA BẠN <em>trùng số trúng là thắng</em></span>'
        + '<div class="sc-grid">' + t.cells.map(c =>
          '<div class="sc-cell' + (done && c.hit ? ' hit' : '') + '">'
          + '<b>' + pad2(c.n) + '</b><span>' + money(c.prize) + '</span></div>').join('') + '</div></div>';
    }
    let result = '';
    if (done) {
      if (t.voided) {
        result = '<div class="scratch-result lose"><b>Vé bị vô hiệu</b><span>Đã cào vào phần mã bảo mật của đại lý.</span></div>';
      } else if (t.prize > 0) {
        const detail = magic
          ? t.rows.filter(r => r.win).map(r => pad2(r.lucky) + ' · ' + money(r.prize)).join('  •  ')
          : t.hits.map(h => pad2(h.n) + ' · ' + money(h.prize)).join('  •  ');
        result = '<div class="scratch-result win"><b>🎉 Trúng ' + money(t.prize) + '</b><span>' + detail + '</span></div>';
      } else {
        result = '<div class="scratch-result lose"><b>Chưa trúng thưởng</b><span>Chúc may mắn lần sau!</span></div>';
      }
    }
    const ticket = '<div class="sc-ticket' + (done ? ' done' : '') + (t.voided ? ' void' : '') + '">'
      + '<div class="sc-top"><span class="sc-brand">VÉ CÀO MAY MẮN</span><span class="sc-type">' + typeName + '</span></div>'
      + '<div class="sc-id"><span>Seri ' + (t.serial || '') + '</span><span>Phát hành ' + dateTxt(issued) + '</span></div>'
      + '<div class="sc-face" id="scratch-face">' + face + (done ? '' : '<canvas id="scratch-canvas" class="sc-foil"></canvas>') + '</div>'
      + '<button class="sc-no' + (t.voided ? ' torn' : '') + '" onclick="Play.noScratch()">'
      + '<span class="sc-no-lab">KHÔNG CÀO NƠI NÀY</span>'
      + '<span class="sc-barcode"></span>'
      + '<span class="sc-no-sub">Mã vạch · mã bảo mật của đại lý</span>'
      + '</button>'
      + '<div class="sc-claim">Nhận thưởng trong <b>180 ngày</b> kể từ ngày phát hành · hạn ' + dateTxt(deadline) + '</div>'
      + '</div>';
    const actions = done
      ? buyBtns('Vé khác')
      : '<button class="p-btn p-btn-ghost" onclick="Play.scratchAll()">Cào hết vé</button>';
    return '<div class="lot-panel">' + head + ticket + result + actions + '</div>';
  }
  function vietPanel() {
    const l = L();
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
      last = '<div class="lot-board"><div class="lot-board-head"><b>Kết quả kỳ #' + (l.lastDraw.round || 1) + '</b><span>' + (l.lastDraw.jackpot ? 'hũ ' + bigMoney(l.lastDraw.jackpot) : '') + '</span></div>'
        + '<div class="viet-balls">' + balls(w, w) + '</div>' + rows + '</div>';
    }
    return '<div class="lot-panel">'
      + '<div class="viet-jackpot"><div class="vj-l"><span class="vj-k">💎 Hũ độc đắc</span><span class="vj-s">Còn ' + l.vietLeft + '/' + VIET_PER_DAY + ' vé hôm nay · ' + money(VIET_COST) + '/vé</span></div><b class="vj-v">' + bigMoney(l.jackpot) + '</b></div>'
      + '<div class="viet-grid">' + nums.join('') + '</div>'
      + '<div class="viet-balls">' + picked + '</div>'
      + '<div class="p-btn-row"><button class="p-btn p-btn-ghost" onclick="Play.luckyPick()">🎲 Chọn nhanh</button><button class="p-btn p-btn-pink" onclick="Play.buyViet()">🎱 Mua vé</button></div>'
      + '<div class="p-sub" style="margin-top:2px;">Vé đang giữ</div>' + tickets
      + '<button class="p-btn p-btn-night" onclick="Play.drawViet()">🎬 Quay số kỳ #' + l.round + '</button>'
      + '<div class="p-sub">Trúng 2 số 20.000đ · 3 số 100.000đ · 4 số 1.000.000đ · 5 số 10.000.000đ · 6 số ăn trọn hũ.</div>'
      + last
      + '</div>';
  }
  function stallBtn(name, title, sub, bubble) {
    return '<button class="lot-stall stall-' + name + '" onclick="Play.stall(\'' + name + '\')">'
      + '<span class="lot-bubble">' + bubble + '</span>'
      + '<span class="lot-kiosk">'
      + '<span class="lot-awning"></span>'
      + '<span class="lot-seller"><i class="ls-head"></i><i class="ls-hair"></i><i class="ls-body"></i><i class="ls-arm"></i></span>'
      + '<span class="lot-tray">🎟️</span>'
      + '<span class="lot-counter"></span>'
      + '</span>'
      + '<span class="lot-label">' + title + '<small>' + sub + '</small></span>'
      + '</button>';
  }
  function streetHtml(l) {
    const now = new Date();
    const night = now.getHours() >= 18 || now.getHours() < 6;
    const all = bagTickets('xsk');
    const ready = all.filter(o => ticketOpen(o)).length;
    return '<div class="lot-street' + (night ? ' night' : '') + '">'
      + '<div class="lot-sky"><i class="lot-sun"></i><i class="lot-cloud c1"></i><i class="lot-cloud c2"></i></div>'
      + '<div class="lot-skyline"></div>'
      + '<div class="lot-clockbox"><b id="lot-clock-live">--:--</b><span>Sổ 16:30</span></div>'
      + '<div class="lot-lamp lamp-a"></div><div class="lot-lamp lamp-b"></div>'
      + '<div class="lot-walkers"><i class="lot-walker w1">🚶</i><i class="lot-walker w2">🚶‍♀️</i><i class="lot-walker w3">🧍</i></div>'
      + '<div class="lot-stalls">'
      + stallBtn('xsk', 'Ba miền', 'Vé Bắc · Trung · Nam', ready ? ready + ' vé chờ dò!' : 'Mua giúp cô tờ vé!')
      + stallBtn('scratch', 'Cào vé', 'Trúng tới 2 triệu', 'Cào thử hông?')
      + stallBtn('viet', 'Vietlott', 'Hũ trăm tỷ', 'Hũ to lắm đó!')
      + '</div>'
      + '<div class="lot-road"><i></i></div>'
      + '</div>';
  }
  function lotHistoryCard() {
    const l = L();
    const rows = [];
    (X().history || []).slice(0, 4).forEach(h => {
      rows.push('<div class="p-hist"><span>Vé ' + XSK_REGIONS[h.region].short + ' ' + fmtTicket(h.digits) + ' · ' + dmy(h.day) + '</span>'
        + '<b class="' + (h.prize ? '' : 'zero') + '">' + (h.prize ? '+' + money(h.prize) : 'không trúng') + '</b></div>');
    });
    (l.history || []).slice(0, Math.max(0, 6 - rows.length)).forEach(h => {
      rows.push('<div class="p-hist"><span>' + h.g + '</span><b class="' + (h.v > 0 ? '' : 'zero') + '">' + (h.v > 0 ? '+' + bigMoney(h.v) : 'không trúng') + '</b></div>');
    });
    if (!rows.length) return '';
    return '<div class="p-card"><div class="p-sec"><span class="p-sec-ico">📜</span><b>Sổ tay gần đây</b></div>' + rows.join('') + '</div>';
  }
  function startLotClock() {
    stopLotClock();
    const paint = () => {
      const now = new Date();
      const el = document.getElementById('lot-clock-live');
      if (el) el.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
      const mark = dayKey() + '|' + (now.getHours() * 60 + now.getMinutes() >= XSK_CUTOFF ? '1' : '0');
      const crossed = lotClockMark && lotClockMark !== mark;
      lotClockMark = mark;
      if (crossed && tab === 'lottery') render();
    };
    paint();
    lotClockTimer = setInterval(paint, 15000);
  }
  function stopLotClock() { if (lotClockTimer) { clearInterval(lotClockTimer); lotClockTimer = null; } }

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
    const all = bagTickets('xsk');
    const ready = all.filter(o => ticketOpen(o)).length;
    const x = X();
    const spent = x.buyDay === dayKey() ? x.buyCount : 0;
    body.innerHTML = ''
      + hero('tone-gold', '🎟️', 'Ra phố', 'Phố vé số', 'Ba quầy đèn sáng cả ngày. Mua vé bỏ vào túi, 16:30 ra dò.',
        [['vé trong túi', all.length ? all.length + ' vé' : 'chưa có'], ['chờ dò', ready ? ready + ' vé' : '—'], ['vé mua hôm nay', spent + '/' + XSK_PER_DAY]])
      + streetHtml(l)
      + lotHistoryCard();
    startLotClock();
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
    if (tab !== 'lottery') stopLotClock();
    if (tab === 'fishing') { if (fishAnim) startFishLoop(); } else stopFishLoop();
    if (currentStall) renderStall();
    refreshWallets();
  }

  window.Play = {
    render: render,
    tab: (name) => {
      if (name === 'farm') { stopLotClock(); if (window.FarmGame) window.FarmGame.enter(); return; }
      if (name === tab) return;
      tab = name;
      render();
    },
    stop: () => { if (window.FarmGame) window.FarmGame.unmount(); stopFishLoop(); stopLotClock(); stopSellerTimer(); },
    buyScratch, scratchAll, noScratch, scratch: scratchAll,
    pickNum, luckyPick, buyViet, drawViet,
    fishCast, fishReel, fishSell, fishRelease, enterContest,
    mktBuy, mktSell,
    stall, closeStall, buyTicket,
    xskRegion: setXskRegion,
    xskCheck, xskCheckAll, openDraw, ticketReady: ticketOpen
  };
})();
