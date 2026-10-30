// ===================== NÔNG TRẠI: chủ trang trại (vườn · kho · đơn hàng · công nhân) =====================
// Toàn bộ dữ liệu trong window.state.farm, không đụng dữ liệu cũ.
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
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  const dayKey = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const sfx = (n) => { try { if (window.Sound) window.Sound.play(n); } catch (e) {} };
  const save = () => { try { if (typeof saveStorage === 'function') saveStorage(); } catch (e) {} };
  const wallet = () => +(S().walletBalance || 0);
  const toast = (msg) => {
    let el = document.getElementById('fg-toast');
    if (!el) { el = document.createElement('div'); el.id = 'fg-toast'; el.className = 'play-toast'; document.body.appendChild(el); }
    el.innerText = msg; el.style.display = 'block';
    clearTimeout(el.__t);
    el.__t = setTimeout(() => { el.style.display = 'none'; }, 2600);
  };
  function addMoney(n) {
    const f = FM(), before = wallet();
    S().walletBalance = Math.max(0, Math.round(before + n));
    const change = wallet() - before;
    if (change >= 0) f.ledger.in += change; else f.ledger.out -= change;
    save();
    try { if (typeof window.renderLifeModeUI === 'function') window.renderLifeModeUI(); } catch (e) {}
  }
  function pay(n) { if (wallet() < n) { toast('Không đủ tiền rồi.'); sfx('error'); return false; } addMoney(-Math.round(n)); return true; }

  // ===================== DỮ LIỆU =====================
  const CROPS = [
    { id: 'rau', n: 'Rau cải', e: '🥬', grow: 2 * 60000, seed: 5000, sell: 10000 },
    { id: 'ngo', n: 'Bắp ngô', e: '🌽', grow: 6 * 60000, seed: 15000, sell: 32000 },
    { id: 'ca', n: 'Cà chua', e: '🍅', grow: 15 * 60000, seed: 35000, sell: 90000 },
    { id: 'dua', n: 'Dưa hấu', e: '🍉', grow: 30 * 60000, seed: 80000, sell: 230000 }
  ];
  const MAX_PLOTS = 18, START_PLOTS = 6;
  const LAND_COST = (i) => i < 10 ? 400000 : i < 14 ? 1500000 : 4000000;
  const LAND_LVL = (i) => i < 8 ? 2 : i < 10 ? 3 : i < 12 ? 4 : i < 14 ? 5 : i < 16 ? 6 : 7;
  const BUILDINGS = {
    kho: { n: 'Kho lương thực', s: 'Kho', e: '🏚️', max: 4, cost: [0, 1000000, 3000000, 8000000, 20000000], cap: [0, 60, 180, 450, 1000], d: 'Chứa nông sản thu về.' },
    nha: { n: 'Nhà công nhân', s: 'Nhà ở', e: '🏠', max: 3, cost: [0, 2000000, 5000000, 12000000], slots: [0, 2, 4, 7], d: 'Chỗ ở cho công nhân, càng rộng tuyển càng đông.' },
    donggoi: { n: 'Khu đóng gói', s: 'Đóng gói', e: '📦', max: 3, cost: [0, 1500000, 4000000, 10000000], mult: [0, 1, 1.8, 2.8], d: 'Cần có mới đóng gói được đơn hàng.' },
    giaohang: { n: 'Khu giao hàng', s: 'Giao hàng', e: '🚚', max: 3, cost: [0, 1000000, 3000000, 8000000], d: 'Có xe mới giao đơn được, nâng cấp xe chạy nhanh hơn.' },
    cskh: { n: 'Phòng CSKH', s: 'CSKH', e: '🎧', max: 1, cost: [0, 2500000], d: 'Trợ lý nhắc việc, giữ mối khách quen.' },
    ketoan: { n: 'Phòng kế toán', s: 'Kế toán', e: '📒', max: 1, cost: [0, 2000000], d: 'Sổ sách rõ ràng, thanh tra không lo.' }
  };

  // ---- thế giới nhìn từ trên: kéo được mọi hướng ----
  const TILE = 44;
  const WORLD_COLS = 20, WORLD_ROWS = 26;
  const WORLD_W = WORLD_COLS * TILE, WORLD_H = WORLD_ROWS * TILE;
  const PAD = { c0: 1, r0: 2, c1: 9, r1: 9 };
  const FOOT = { kho: [2, 2], nha: [2, 2], donggoi: [2, 2], giaohang: [2, 2], cskh: [1, 1], ketoan: [1, 1] };
  const HOME_POS = { kho: { c: 2, r: 2 }, donggoi: { c: 5, r: 2 }, cskh: { c: 4, r: 2 }, ketoan: { c: 4, r: 4 }, nha: { c: 2, r: 5 }, giaohang: { c: 5, r: 5 } };
  const PLOT_COLS = 3, PLOT_ROW = 11;
  const plotRect = (i) => ({ x: (2 + (i % PLOT_COLS) * 2) * TILE + 4, y: (PLOT_ROW + Math.floor(i / PLOT_COLS) * 2) * TILE + 4, w: 2 * TILE - 8, h: 2 * TILE - 8 });
  const WALK = [{ x0: 430, x1: 800, y0: 340, y1: 1020 }, { x0: 80, x1: 780, y0: 1030, y1: 1090 }];
  const NAMES = ['Chị Hai', 'Anh Ba', 'Cô Tư', 'Chú Năm', 'Bé Sáu', 'Anh Bảy', 'Chị Tám', 'Chú Chín', 'Bé Mười', 'Anh Hai Một', 'Cô Ba Mốt', 'Chú Tư Bốn'];
  const WORKER_EMOJI = { vuon: ['🧑‍🌾', '👩‍🌾', '👨‍🌾'], donggoi: ['🧑‍🏭', '👩‍🏭', '👨‍🏭'] };
  const QUIRKS = [
    { id: 'sieng', n: 'Siêng năng', d: 'Làm nhanh hơn 10%', spd: 1.1, wage: 1 },
    { id: 'tam', n: 'Hay tám', d: 'Thích buôn chuyện', spd: 1, wage: 1 },
    { id: 'doi', n: 'Đòi hỏi', d: 'Đòi lương cao hơn 30%', spd: 1.05, wage: 1.3 },
    { id: 'vui', n: 'Vui tính', d: 'Cả xóm quý', spd: 1, wage: 1.1 },
    { id: 'kin', n: 'Kín tiếng', d: 'Ít nói, chỉ lo làm', spd: 1.05, wage: 0.95 }
  ];
  const CHATTER = [
    'Trễ lương nữa là em về quê!', 'Bà Tám hàng xóm đẻ heo đàn bảy con kìa!', 'Nắng thế này chắc cà chua chín mau.',
    'Tối qua ai trộm mất củ sắn nhà tui?', 'Sếp mua máy tưới rồi, đỡ quá!', 'Đất đai quá mà lương thì... hix.',
    'Cãi nhau hoài, làm không xong!', 'Tui thấy cậu kia nhìn cô này hoài à nha~', 'Hôm nay đơn nhiều, tay chân rụng rồi.',
    'Ai lấy trộm nước mía trong tủ chung không?!', 'Mùa này dưa hấu lên giá, sướng!', 'Đố bà biết sếp giàu cỡ nào.',
    'Nhà chật quá, ngủ gối lên nhau luôn.', 'Tui đang để dành cưới vợ đó nghen.', 'Rau này tưới phân là lên như thổi!',
    'Thấy bà con trong xóm bán rẻ hơn mình nhiều.', 'Đừng để tui bắt gặp ai lướt điện thoại lúc làm nha!', 'Nóng quá, cần trà đá gấp.',
    'Kho đầy rồi mà sếp chưa bán, kỳ ghê.', 'Đơn của bà Hai kỳ này to chà bá!', 'Tối nay ai đá bóng không, xả stress?',
    'Nghe đồn thanh tra sắp xuống huyện...', 'Em mới học được cách bắt sâu bằng tay, ghê chưa!'
  ];
  const CUST_NAMES = ['Bà Hai Đại Lý', 'Anh Ba Chợ Đầu Mối', 'Cô Tư Nhà Hàng', 'Chú Năm Siêu Thị', 'Bà Sáu Quán Cơm', 'Anh Bảy Cửa Hàng', 'Cô Tám Bách Hóa', 'Chú Chín Khu Du Lịch'];
  const CUST_EMOJI = ['🧕', '👨', '👩', '🧔', '👵', '🧑', '👱‍♀️', '👴'];
  const TET_DAYS = ['2026-02-17', '2027-02-06', '2028-01-26', '2029-02-13', '2030-02-03', '2031-01-23', '2032-02-11', '2033-02-01', '2034-01-22', '2035-02-10'];
  const MID_DAYS = ['2026-09-25', '2027-09-15', '2028-10-03', '2029-09-22', '2030-09-12', '2031-10-01', '2032-09-19', '2033-09-08', '2034-09-27', '2035-09-16'];
  const nearDate = (list, before, after) => {
    const now = Date.now();
    return list.some(s => { const a = s.split('-').map(Number); const t = new Date(a[0], a[1] - 1, a[2]).getTime(); return now >= t - before * 864e5 && now < t + (after + 1) * 864e5; });
  };
  const isFestive = () => nearDate(TET_DAYS, 2, 2) || nearDate(MID_DAYS, 1, 1) || (() => { const d = new Date(); return d.getMonth() === 11 && d.getDate() >= 22; })();

  // ===================== STATE =====================
  function FM() {
    const s = S();
    if (!s.farm || typeof s.farm !== 'object') s.farm = {};
    const f = s.farm;
    if (!Array.isArray(f.plots)) f.plots = [];
    const old = f.plots;
    f.plots = [];
    for (let i = 0; i < MAX_PLOTS; i++) f.plots.push(old[i] && typeof old[i] === 'object' ? old[i] : null);
    if (!f.stock || typeof f.stock !== 'object') f.stock = {};
    CROPS.forEach(c => { if (typeof f.stock[c.id] !== 'number' || f.stock[c.id] < 0) f.stock[c.id] = 0; });
    if (typeof f.level !== 'number' || f.level < 1) f.level = 1;
    if (typeof f.xp !== 'number' || f.xp < 0) f.xp = 0;
    if (!f.buildings || typeof f.buildings !== 'object') f.buildings = {};
    Object.keys(BUILDINGS).forEach(k => { if (typeof f.buildings[k] !== 'number' || f.buildings[k] < 0) f.buildings[k] = 0; });
    if (!f.buildingPos || typeof f.buildingPos !== 'object') f.buildingPos = {};
    if (typeof f.irrigate !== 'boolean') f.irrigate = false;
    if (typeof f.fertBags !== 'number') f.fertBags = 0;
    if (typeof f.sprays !== 'number') f.sprays = 0;
    if (!Array.isArray(f.workers)) f.workers = [];
    f.workers.forEach(w => { if (!w.__pw) { w.__pw = true; if (typeof w.tx === 'number' && w.tx <= 100) { w.tx = null; w.ty = null; } } });
    if (!Array.isArray(f.orders)) f.orders = [];
    if (!Array.isArray(f.contracts)) f.contracts = [];
    if (!Array.isArray(f.events)) f.events = [];
    if (!Array.isArray(f.candidates)) f.candidates = [];
    if (!Array.isArray(f.tasks)) f.tasks = [];
    if (!f.season || typeof f.season !== 'object') f.season = {};
    if (!Array.isArray(f.villagers)) f.villagers = [];
    if (!f.ledger || typeof f.ledger !== 'object') f.ledger = { day: dayKey(), in: 0, out: 0 };
    if (!Array.isArray(f.ledgerHist)) f.ledgerHist = [];
    if (typeof f.lastEventAt !== 'number') f.lastEventAt = Date.now();
    if (typeof f.nextOrderAt !== 'number') f.nextOrderAt = Date.now() + rand(60, 150) * 1000;
    if (typeof f.nextContractAt !== 'number') f.nextContractAt = 0;
    if (typeof f.negCooldownUntil !== 'number') f.negCooldownUntil = 0;
    if (typeof f.wageDebt !== 'boolean') f.wageDebt = false;
    if (typeof f.wageArrears !== 'number') f.wageArrears = 0;
    if (f.day !== dayKey()) newFarmDay(f);
    return f;
  }
  function xpNext(lvl) { return Math.round(60 * Math.pow(lvl, 1.5)); }
  function addXp(n) {
    const f = FM();
    f.xp += Math.round(n);
    while (f.xp >= xpNext(f.level) && f.level < 12) { f.xp -= xpNext(f.level); f.level++; toast('🌟 Nông trại lên cấp ' + f.level + '!'); sfx('win'); }
    save();
  }
  function newFarmDay(f) {
    const today = dayKey();
    const elapsedDays = f.day ? Math.max(1, Math.round((new Date(today) - new Date(f.day)) / 864e5)) : 0;
    // chốt sổ hôm trước
    if (f.ledger && f.ledger.day !== today) {
      f.ledgerHist.unshift({ day: f.ledger.day, in: Math.round(f.ledger.in || 0), out: Math.round(f.ledger.out || 0) });
      f.ledgerHist = f.ledgerHist.slice(0, 7);
    }
    f.ledger = { day: today, in: 0, out: 0 };
    f.day = today;
    const total = f.workers.reduce((s, w) => s + w.wage, 0) * elapsedDays + f.wageArrears;
    if (total > 0) {
      if (wallet() >= total) {
        S().walletBalance = Math.round(wallet() - total);
        f.ledger.out += total;
        f.wageArrears = 0;
        f.wageDebt = false;
        f.workers.forEach(w => { w.morale = Math.min(100, (w.morale ?? 70) + 5); });
      } else {
        f.wageArrears = total;
        f.wageDebt = true;
        f.workers.forEach(w => { w.morale = Math.max(0, (w.morale ?? 70) - 25); });
      }
    }
    f.tasks = genTasks();
    rollSeason(f);
    f.villagers = genVillagers();
    if (!f.candidates.length) f.candidates = genCandidates();
    f.contracts.forEach(c => { c.orderedToday = false; });
    f.workers.forEach(w => { w.workedToday = false; });
    save();
  }
  function genTasks() {
    const pool = [
      { id: 'harvest', txt: (n) => 'Thu hoạch ' + n + ' sản phẩm', n: () => rand(5, 12), reward: () => rand(8, 18) * 10000 },
      { id: 'order', txt: (n) => 'Hoàn thành ' + n + ' đơn hàng', n: () => rand(1, 2), reward: () => rand(10, 20) * 10000 },
      { id: 'pack', txt: (n) => 'Đóng gói ' + n + ' sản phẩm', n: () => rand(6, 15), reward: () => rand(8, 15) * 10000 },
      { id: 'buy', txt: (n) => 'Thu mua ' + n + ' sản phẩm của người dân', n: () => rand(4, 10), reward: () => rand(8, 15) * 10000 },
      { id: 'event', txt: () => 'Giải quyết 1 sự cố trên trại', n: () => 1, reward: () => rand(10, 20) * 10000 },
      { id: 'hire', txt: () => 'Tuyển 1 công nhân mới', n: () => 1, reward: () => rand(10, 18) * 10000 }
    ];
    return shuffle(pool.slice()).slice(0, 3).map(p => { const n = p.n(); return { id: p.id, txt: p.txt(n), need: n, have: 0, reward: p.reward(), claimed: false }; });
  }
  function rollSeason(f) {
    CROPS.forEach(c => {
      const prev = (f.season[c.id] && f.season[c.id].p) || 1;
      let p = Math.round((prev * (0.85 + Math.random() * 0.3)) * 100) / 100;
      p = Math.max(0.6, Math.min(1.6, p));
      f.season[c.id] = { p: p, prev: prev };
    });
  }
  function genVillagers() {
    const list = [];
    const used = shuffle(CROPS.map((c, i) => i));
    for (let i = 0; i < 3; i++) {
      const c = CROPS[used[i]];
      const mult = 0.5 * (0.9 + Math.random() * 0.25);
      list.push({ id: 'v' + Date.now() + i, crop: c.id, qty: rand(4, 14), unit: Math.max(1000, Math.round(c.sell * mult / 1000) * 1000), haggled: false, gone: false });
    }
    return list;
  }
  function genCandidates() {
    const out = [];
    const names = shuffle(NAMES.slice());
    for (let i = 0; i < 3; i++) {
      const role = Math.random() < 0.55 ? 'vuon' : 'donggoi';
      const quirk = pick(QUIRKS);
      const skill = Math.round((0.8 + Math.random() * 0.6) * 100) / 100;
      const wage = Math.round(70 * skill * quirk.wage) * 1000;
      out.push({ id: 'c' + Date.now() + i, name: names[i], role: role, skill: skill, wage: wage, quirk: quirk.id, quirkN: quirk.n, quirkD: quirk.d, emoji: pick(WORKER_EMOJI[role]) });
    }
    return out;
  }

  // ===================== TIỆN ÍCH =====================
  const stockTotal = (f) => CROPS.reduce((s, c) => s + (f.stock[c.id] || 0), 0);
  const stockCap = (f) => BUILDINGS.kho.cap[f.buildings.kho] || 0;
  const workerSlots = (f) => BUILDINGS.nha.slots[f.buildings.nha] || 0;
  const landCount = (f) => f.__landN || START_PLOTS;
  function cropOf(id) { return CROPS.find(c => c.id === id) || CROPS[0]; }
  function bpos(f, key) {
    if (!f.buildingPos || typeof f.buildingPos !== 'object') f.buildingPos = {};
    if (f.buildingPos[key]) return f.buildingPos[key];
    if ((f.buildings[key] || 0) > 0) { f.buildingPos[key] = { c: HOME_POS[key].c, r: HOME_POS[key].r }; return f.buildingPos[key]; }
    return null;
  }
  function footprintBusy(f, key, c, r) {
    const [fw, fh] = FOOT[key];
    return Object.keys(BUILDINGS).some(k => {
      if (k === key) return false;
      const p = bpos(f, k);
      if (!p) return false;
      const [w2, h2] = FOOT[k];
      return c < p.c + w2 && c + fw > p.c && r < p.r + h2 && r + fh > p.r;
    });
  }
  function canPlace(f, key, c, r) {
    const [fw, fh] = FOOT[key];
    if (c < PAD.c0 || r < PAD.r0 || c + fw - 1 > PAD.c1 || r + fh - 1 > PAD.r1) return false;
    return !footprintBusy(f, key, c, r);
  }

  // ===================== VƯỜN =====================
  let farmPick = 'rau';
  function plant(i, useFert) {
    const f = FM();
    if (i >= landCount(f)) return;
    if (f.plots[i]) return;
    const crop = cropOf(farmPick);
    let fert = false;
    if (useFert) {
      if (f.fertBags <= 0) { toast('Hết phân bón rồi, ghé Shop nhé.'); sfx('error'); return; }
      fert = true;
    }
    if (!pay(crop.seed)) return;
    if (fert) f.fertBags--;
    f.plots[i] = { crop: crop.id, at: Date.now(), watered: false, pest: Math.random() < 0.18, treated: false, fert: !!fert };
    if (Date.now() < f.__waterOffUntil) f.plots[i].pauseAt = Date.now();
    save(); sfx('plant'); render();
    toast('🌱 Đã trồng ' + crop.n + (fert ? ' (bón phân)' : ''));
  }
  function plotGrowTime(p) {
    const crop = cropOf(p.crop);
    return Math.round(crop.grow * (p.fert ? 0.65 : 1));
  }
  function plotElapsed(p, now = Date.now()) {
    const paused = p.pauseAt ? Math.max(0, Math.min(now, S().farm.__waterOffUntil) - p.pauseAt) : 0;
    return Math.max(0, now - p.at - paused);
  }
  function stopWater(f, duration) {
    const now = Date.now();
    f.__waterOffUntil = Math.max(f.__waterOffUntil || 0, now + duration);
    f.plots.forEach(p => { if (p && !p.pauseAt && plotElapsed(p, now) < plotGrowTime(p)) p.pauseAt = now; });
  }
  function water(i) {
    const f = FM(), p = f.plots[i];
    if (!p || p.watered) return;
    if (Date.now() < f.__waterOffUntil) return toast('Đang cúp nước, chưa tưới được.');
    const remaining = Math.max(0, plotGrowTime(p) - plotElapsed(p));
    p.at -= Math.round(remaining * 0.2);
    p.watered = true;
    save(); sfx('click'); render();
    toast('💧 Đã tưới, cây lớn nhanh hơn.');
  }
  function treat(i) {
    const f = FM(), p = f.plots[i];
    if (!p || p.treated || !p.pest) return;
    if (f.sprays <= 0) { toast('Hết thuốc trừ sâu, mua thêm ở Shop nhé.'); sfx('error'); return; }
    f.sprays--;
    p.treated = true;
    save(); sfx('buy'); render();
    toast('Đã phun thuốc, sạch sâu.');
  }
  function harvest(i) {
    const f = FM(), p = f.plots[i];
    if (!p) return;
    const crop = cropOf(p.crop);
    if (plotElapsed(p) < plotGrowTime(p)) return toast('Cây chưa chín đâu.');
    const bad = p.pest && !p.treated;
    const qty = bad ? 1 : (Math.random() < 0.3 ? 2 : 1);
    if (stockTotal(f) + qty > stockCap(f)) { toast('Kho đầy rồi! Nâng cấp kho hoặc bán bớt đi.'); sfx('error'); return; }
    f.plots[i] = null;
    f.stock[crop.id] += qty;
    taskBump('harvest', qty);
    addXp(qty);
    save(); sfx('coin'); render();
    toast('🧺 ' + crop.n + ' vào kho ×' + qty + (bad ? ' (sâu ăn mất nửa)' : ''));
  }
  function buyLand(i) {
    const f = FM();
    if (i !== landCount(f)) return;
    if (f.level < LAND_LVL(i)) { toast('Cần nông trại cấp ' + LAND_LVL(i) + ' mới mua được ô này.'); sfx('error'); return; }
    if (!pay(LAND_COST(i))) return;
    f.__landN = i + 1;
    save(); sfx('buy'); render();
    toast('🟫 Đã mở rộng thêm 1 luống đất!');
  }

  // ===================== SHOP =====================
  function buyItem(kind, arg) {
    const f = FM();
    if (kind === 'fert') { if (!pay(25000)) return; f.fertBags += 5; }
    else if (kind === 'spray') { if (!pay(50000)) return; f.sprays += 5; }
    else if (kind === 'irrig') {
      if (f.irrigate) return toast('Máy tưới đã lắp rồi.');
      if (!pay(3000000)) return;
      f.irrigate = true;
    }
    save(); sfx('buy'); render();
    toast('Đã mua xong!');
  }

  // ===================== XÂY DỰNG =====================
  function build(key) {
    const f = FM(), b = BUILDINGS[key];
    if (!b) return;
    const lv = f.buildings[key];
    if (lv <= 0) { startPlace(key); return; }
    if (lv >= b.max) { toast('Công trình đã tối đa cấp.'); return; }
    const cost = b.cost[lv + 1];
    if (key === 'nha' && f.workers.length > BUILDINGS.nha.slots[lv + 1]) { toast('Công nhân đang ở đông hơn chỗ mới, không hạ được đâu.'); return; }
    if (!pay(cost)) return;
    f.buildings[key] = lv + 1;
    if (key === 'nha') f.workers.forEach(w => { if (w.__upgLevel <= lv + 1) w.__upgDue = 0; });
    addXp(20);
    save(); sfx('merge'); render();
    toast(b.e + ' ' + b.n + ' lên cấp ' + (lv + 1) + '!');
  }

  // ===================== CÔNG NHÂN =====================
  function hire(id) {
    const f = FM();
    const c = f.candidates.find(x => x.id === id);
    if (!c) return;
    if (f.workers.length >= workerSlots(f)) { toast('Nhà công nhân hết chỗ, xây thêm tầng đi.'); sfx('error'); return; }
    f.workers.push({ id: 'w' + Date.now() + '-' + rand(0, 999999), name: c.name, role: c.role, skill: c.skill, wage: c.wage, quirk: c.quirk, quirkN: c.quirkN, emoji: c.emoji, morale: 75, tx: null, ty: null, __pw: true });
    f.candidates = f.candidates.filter(x => x.id !== id);
    if (f.candidates.length < 3) f.candidates = f.candidates.concat(genCandidates().slice(0, 3 - f.candidates.length));
    taskBump('hire', 1);
    save(); sfx('win'); render();
    toast('🤝 ' + c.name + ' đã nhận việc! Lương ' + money(c.wage) + '/ngày.');
  }
  function fire(id) {
    const f = FM();
    const w = f.workers.find(x => x.id === id);
    if (!w) return;
    f.workers = f.workers.filter(x => x.id !== id);
    save(); sfx('click'); render();
    toast(w.name + ' đã dọn về quê.');
  }
  function workersOf(f, role) { return f.workers.filter(w => w.role === role); }
  function quirkSpd(w) { const q = QUIRKS.find(x => x.id === w.quirk); return (q && q.spd) || 1; }

  // vị trí & thoại trong cảnh (chỉ lưu trong phiên)
  function workerTick(f, now) {
    f.workers.forEach(w => {
      if (w.tx == null || !w.__nextMove || now > w.__nextMove) {
        const a = WALK[Math.random() < 0.72 ? 0 : 1];
        w.tx = rand(a.x0, a.x1);
        w.ty = rand(a.y0, a.y1);
        w.__nextMove = now + rand(2600, 5200);
      }
      if (!w.__nextSay || now > w.__nextSay) {
        const chatty = w.quirk === 'tam' ? 0.5 : 1;
        w.__say = pick(CHATTER);
        w.__nextSay = now + rand(9, 22) * 1000 * chatty;
        w.__sayUntil = now + 4200;
      }
      if (w.__sayUntil && now > w.__sayUntil) { w.__say = null; w.__sayUntil = 0; }
    });
  }
  // AI làm việc: mỗi 3 giây một nhịp
  function workTick(f) {
    const gardeners = workersOf(f, 'vuon');
    const strike = Date.now() < f.__strikeUntil || f.events.some(e => e.type === 'dinhcong' && !e.done);
    if (gardeners.length && !strike) {
      gardeners.forEach(() => {
      // thu hoạch trước
      for (let i = 0; i < landCount(f); i++) {
        const p = f.plots[i];
        if (!p) continue;
        if (plotElapsed(p) >= plotGrowTime(p)) {
          const crop = cropOf(p.crop);
          const bad = p.pest && !p.treated;
          const qty = bad ? 1 : (Math.random() < 0.3 ? 2 : 1);
          if (stockTotal(f) + qty > stockCap(f)) break;
          f.plots[i] = null;
          f.stock[crop.id] += qty;
          taskBump('harvest', qty);
          addXp(qty);
          return;
        }
      }
      // phun thuốc
      if (f.sprays > 0) {
        for (let i = 0; i < landCount(f); i++) {
          const p = f.plots[i];
          if (p && p.pest && !p.treated) { f.sprays--; p.treated = true; return; }
        }
      }
      if (Date.now() < f.__waterOffUntil) return;
      for (let i = 0; i < landCount(f); i++) {
        const p = f.plots[i];
        if (p && !p.watered) {
          const remaining = Math.max(0, plotGrowTime(p) - plotElapsed(p));
          p.at -= Math.round(remaining * 0.2);
          p.watered = true;
          return;
        }
      }
      });
    }
    // đóng gói
    const packers = workersOf(f, 'donggoi');
    if (packers.length && !strike && !(Date.now() < f.__powerOffUntil)) {
      const o = f.orders.find(x => x.state === 'pack');
      if (o) {
        const spd = packers.reduce((s, w) => s + w.skill * quirkSpd(w) * (w.morale >= 40 ? 1 : 0.5), 0);
        o.prog += (100 / 240) * spd * (BUILDINGS.donggoi.mult[f.buildings.donggoi] || 1) * 3;
      }
    }
  }

  // ===================== ĐƠN HÀNG =====================
  function orderCap(f) { return Math.min(5, 2 + (f.buildings.giaohang || 0)); }
  function spawnWalkOrder(f) {
    const crop = pick(CROPS);
    const qty = Math.max(1, Math.round(rand(4, 10) * (30000 / crop.sell)));
    const price = Math.round(crop.sell * f.season[crop.id].p * (1.08 + Math.random() * 0.17) / 1000) * 1000;
    f.orders.push({ id: 'o' + Date.now() + rand(0, 999), kind: 'walk', cust: pick(['Khách vãng lai', 'Bác đi chợ sớm', 'Cô hàng xóm', 'Anh shipper']), emoji: pick(['🧑', '👵', '👨', '🧔']), crop: crop.id, qty: qty, price: price, state: 'offer', prog: 0, at: Date.now() });
  }
  function spawnContractOrder(f, c = pick(f.contracts)) {
    if (!c || f.orders.filter(o => o.state !== 'done').length >= orderCap(f)) return;
    const crop = pick(CROPS);
    const qty = Math.max(2, Math.round(rand(8, 20) * (30000 / crop.sell)));
    let price = Math.round(crop.sell * c.ceil * (f.season[crop.id].p) / 1000) * 1000;
    if (c.giftBoost > 0) { price = Math.round(price * 1.12 / 1000) * 1000; c.giftBoost--; }
    f.orders.push({ id: 'o' + Date.now() + rand(0, 999), kind: 'contract', cust: c.name, emoji: c.emoji, crop: crop.id, qty: qty, price: price, state: 'offer', prog: 0, at: Date.now() });
    c.orderedToday = true;
    c.lastOrderDay = dayKey();
  }
  function acceptOrder(id) {
    const f = FM();
    const o = f.orders.find(x => x.id === id);
    if (!o || o.state !== 'offer') return;
    if ((f.stock[o.crop] || 0) < o.qty) { toast('Kho không đủ ' + cropOf(o.crop).n + ' cho đơn này.'); sfx('error'); return; }
    if (!f.buildings.donggoi) { toast('Chưa có khu đóng gói, xây rồi hãy nhận đơn.'); sfx('error'); return; }
    f.stock[o.crop] -= o.qty;
    o.state = 'pack';
    save(); sfx('click'); render();
    toast('📦 Nhận đơn ' + o.cust + '!');
  }
  function packClick(id) {
    const f = FM();
    const o = f.orders.find(x => x.id === id);
    if (!o || o.state !== 'pack') return;
    const now = Date.now();
    if (now < f.__powerOffUntil) return toast('Đang cúp điện, máy đóng gói chưa chạy được.');
    if (o.__lastClick && now - o.__lastClick < 600) return;
    o.__lastClick = now;
    o.prog = Math.min(100, o.prog + 8);
    save(); sfx('click'); render();
  }
  function gift(custId) {
    const f = FM();
    const c = f.contracts.find(x => x.id === custId);
    if (!c) return;
    if (c.giftDay === dayKey()) { toast('Hôm nay tặng rồi, ngày mai nha.'); return; }
    if (!pay(250000)) return;
    c.giftDay = dayKey();
    c.giftBoost = 3;
    save(); sfx('buy'); render();
    toast('🎁 ' + c.name + ' cười tươi roi rói, đơn sắp tới giá đẹp hơn!');
  }
  // Đàm phán hợp đồng
  function negStart() {
    const f = FM();
    if (Date.now() < f.negCooldownUntil) { toast('Khách vừa về, để dành hơi tí rồi tìm người mới.'); return; }
    if (f.orders.filter(o => o.state !== 'done').length >= orderCap(f)) { toast('Đơn đang chờ quá nhiều, giao bớt đã.'); return; }
    const name = pick(CUST_NAMES.filter(n => !f.contracts.some(c => c.name === n))) || pick(CUST_NAMES);
    neg = { name: name, emoji: pick(CUST_EMOJI), offer: 1.5, ceil: Math.round((1.28 + Math.random() * 0.17) * 100) / 100, patience: 80, round: 1, log: ['Khách muốn hợp đồng đặt sỉ dài hạn, giá thương lượng.'] };
    fgPanel = 'neg';
    sfx('click'); render();
  }
  function negTactic(t) {
    const f = FM(), n = neg;
    if (!n) return;
    if (t === 'khen') { n.ceil = Math.round((n.ceil + 0.04) * 100) / 100; n.patience = Math.min(100, n.patience + 6); n.log.push('Bạn khen khéo, khách cười tươi hẳn.'); }
    else if (t === 'ep') {
      n.offer = Math.round((n.offer - 0.06) * 100) / 100;
      if (Math.random() < 0.35) { n.patience -= 22; n.log.push('Ép giá hơi mạnh, khách nhíu mày.'); }
      else { n.patience -= 6; n.log.push('Khách lầm bầm tính toán.'); }
    }
    else if (t === 'qua') {
      if (!pay(50000)) return;
      n.patience = Math.min(100, n.patience + 18);
      n.log.push('Mẫu thử ngon lành, khách gật gù khen.');
    }
    n.round++;
    n.patience -= 8;
    if (n.patience <= 0 || n.round > 3) negClose();
    else render();
  }
  function negClose() {
    const f = FM(), n = neg;
    if (!n) return;
    if (n.patience > 0 && n.offer <= n.ceil) {
      const customer = { id: 'k' + Date.now(), name: n.name, emoji: n.emoji, ceil: n.offer, giftDay: '', giftBoost: 0, lastOrderDay: dayKey(), orderedToday: false };
      f.contracts.push(customer);
      addXp(40);
      f.nextContractAt = Date.now() + rand(240, 420) * 1000;
      spawnContractOrder(f, customer);
      neg = null;
      fgPanel = 'orders';
      save(); sfx('win'); render();
      toast('✍️ Kí hợp đồng thành công! Khách đặt đơn đầu tiên rồi kìa.');
    } else {
      f.negCooldownUntil = Date.now() + 180000;
      neg = null;
      fgPanel = 'orders';
      save(); sfx('lose'); render();
      toast('Khách lắc đầu bỏ về. Lần sau mềm mỏng hơn nhé.');
    }
  }

  // ===================== SỰ CỐ =====================
  const EVENT_DEFS = [
    {
      id: 'doiluong', icon: '💸', when: (f) => f.workers.length > 0,
      make: (f, event) => {
        const w = event ? f.workers.find(w => w.id === event.target) : pick(f.workers);
        if (!w) return null;
        return { type: 'doiluong', target: w.id, txt: w.name + ' khoanh tay đứng giữa vườn: "Lương thế này khó sống lắm sếp ơi!"', choices: [
          { t: 'Thưởng nóng 300.000đ', run: (f) => { if (!pay(300000)) return false; w.morale = Math.min(100, w.morale + 25); return w.name + ' hừng hực khí thế làm việc.'; } },
          { t: 'Khất, cuối tháng tính', risk: 0.5 }
        ], ok: (f) => { w.morale = Math.min(100, w.morale + 10); return w.name + ' thở dài nhận lời, để mắt tới đấy.'; }, bad: (f) => { w.morale = Math.max(0, w.morale - 30); return w.name + ' hậm hực cả buổi.'; },
          expire: (f) => { w.morale = Math.max(0, w.morale - 40); if (w.morale < 25 && Math.random() < 0.5) quitWorker(f, w); } };
      }
    },
    {
      id: 'cainhau', icon: '🗯️', when: (f) => f.workers.length >= 2,
      make: (f, event) => {
        const a = event ? f.workers.find(w => w.id === event.target) : pick(f.workers);
        const b = event ? f.workers.find(w => w.id === event.otherId) : pick(f.workers.filter(w => w.id !== a.id));
        if (!a || !b) return null;
        return { type: 'cainhau', target: a.id, otherId: b.id, txt: a.name + ' và ' + b.name + ' cãi nhau inh ỏi giữa vườn, cả xóm ngoái nhìn!', choices: [
          { t: 'Mỗi người một ly trà sữa 150.000đ', run: (f) => { if (!pay(150000)) return false; a.morale = Math.min(100, a.morale + 15); b.morale = Math.min(100, b.morale + 15); return 'Hai người cười hàn gắn, vườn yên trở lại.'; } },
          { t: 'Quát cho im', run: (f) => { a.morale = Math.max(0, a.morale - 10); b.morale = Math.max(0, b.morale - 10); return 'Im thật, nhưng khí thế nguội lạnh.'; } }
        ], expire: (f) => { a.morale = Math.max(0, a.morale - 25); b.morale = Math.max(0, b.morale - 25); } };
      }
    },
    {
      id: 'yeuduong', icon: '💞', when: (f) => f.workers.length >= 2,
      make: (f, event) => {
        const a = event ? f.workers.find(w => w.id === event.target) : pick(f.workers);
        const b = event ? f.workers.find(w => w.id === event.otherId) : pick(f.workers.filter(w => w.id !== a.id));
        if (!a || !b) return null;
        return { type: 'yeuduong', target: a.id, otherId: b.id, txt: 'Người ta thấy ' + a.name + ' và ' + b.name + ' tình tứ sau luống dưa... tin đồn lan nhanh hơn sâu ăn!', choices: [
          { t: 'Làm ngơ cho tụi trẻ', run: (f) => { a.morale = Math.min(100, a.morale + 10); b.morale = Math.min(100, b.morale + 10); return 'Cả trại cười rộ, không khí vui hẳn.'; } },
          { t: 'Nhắc nhở giữ kẽ', run: (f) => { a.morale = Math.max(0, a.morale - 5); b.morale = Math.max(0, b.morale - 5); return 'Hai người đỏ mặt gật đầu, làm việc nghiêm túc hơn hẳn.'; } }
        ], expire: () => {} };
      }
    },
    {
      id: 'chenha', icon: '🏠', when: (f) => f.workers.length > 0 && f.buildings.nha < BUILDINGS.nha.max,
      make: (f, event) => {
        const w = event ? f.workers.find(w => w.id === event.target) : pick(f.workers);
        if (!w) return null;
        return { type: 'chenha', target: w.id, txt: w.name + ' than nhà chật ních người, đe dọa sẽ gọi thanh tra lao động!', choices: [
          { t: 'Hứa cải thiện trong 2 ngày', run: (f) => { w.__upgDue = Date.now() + 2 * 864e5; w.__upgLevel = f.buildings.nha + 1; return w.name + ' gật đầu, nhưng sẽ nhớ lời hứa đấy.'; } },
          { t: 'Thôi thì cho nghỉ việc', run: (f) => { quitWorker(f, w); return w.name + ' dỗi bỏ về quê luôn.'; } }
        ], expire: (f) => { quitWorker(f, w); queueEvent('thanhtra'); } };
      }
    },
    {
      id: 'dinhcong', icon: '✊', when: (f) => f.workers.length >= 2 && f.wageDebt,
      make: (f, event) => {
        return { type: 'dinhcong', target: 'farm', txt: 'Cả lũ bỏ cuốc đứng lại: "Trả lương đã, không thì đình công!"', choices: [
          { t: 'Trả lương nợ + thưởng 500.000đ', run: (f) => { if (!pay(500000 + f.wageArrears)) return false; f.wageArrears = 0; f.wageDebt = false; f.__strikeUntil = 0; f.workers.forEach(w => { w.morale = Math.min(100, w.morale + 30); }); return 'Đám đông reo hò, cuốc bừa vun lại ngay.'; } },
          { t: 'Để họ đình công', run: (f) => { f.__strikeUntil = Date.now() + 10 * 60000; return 'Không khí căng như dây đàn, mọi việc đình trệ 10 phút.'; } }
        ], expire: (f) => { f.workers.forEach(w => { w.morale = Math.max(0, w.morale - 20); }); } };
      }
    },
    {
      id: 'cupdien', icon: '⚡', when: (f) => (f.buildings.donggoi || 0) >= 1,
      make: (f, event) => {
        return { type: 'cupdien', target: 'donggoi', txt: 'Trạm điện báo cúp điện, khu đóng gói sắp đứng máy!', choices: [
          { t: 'Mua dầu chạy máy phát 400.000đ', run: (f) => { if (!pay(400000)) return false; return 'Máy phát nổ pù pù, dây chuyền chạy êm.'; } },
          { t: 'Chịu cúp 15 phút', run: (f) => { f.__powerOffUntil = Date.now() + 15 * 60000; return 'Đóng gói ngưng 15 phút, đơn chậm tiến độ.'; } }
        ], expire: (f) => { f.__powerOffUntil = Date.now() + 10 * 60000; } };
      }
    },
    {
      id: 'cupnuoc', icon: '🚱', when: () => true,
      make: (f, event) => {
        return { type: 'cupnuoc', target: 'farm', txt: 'Máy bơm chính bị hỏng, cả vườn khô rang chờ nước!', choices: [
          { t: 'Gọi thợ sửa gấp 350.000đ', run: (f) => { if (!pay(350000)) return false; return 'Nước phun ào ào, cây cối hồn nhiên trở lại.'; } },
          { t: 'Gánh tạm 15 phút', run: (f) => { stopWater(f, 15 * 60000); return 'Cả vườn chậm lớn 15 phút.'; } }
        ], expire: (f) => { stopWater(f, 10 * 60000); } };
      }
    },
    {
      id: 'thanhtra', icon: '🕵️', when: () => true,
      make: (f, event) => {
        const ok = event ? event.accountant : f.buildings.ketoan >= 1;
        return { type: 'thanhtra', accountant: ok, target: 'farm', txt: 'Đoàn thanh tra bất ngờ ghé thăm trại, giấy tờ đâu nào?!', choices: ok ? [
          { t: 'Đón tiếp chu đáo (có kế toán)', run: (f) => { addXp(20); return 'Sổ sách êm ru, đoàn khen nức nở, còn thưởng thêm uy tín.'; } }
        ] : [
          { t: 'Chạy vạy quyết toán 600.000đ', run: (f) => { if (!pay(600000)) return false; return 'Suýt thì toang, may mà lót kịp.'; } }
        ], expire: (f) => { addMoney(-1000000); } };
      }
    },
    {
      id: 'saudich', icon: '🐛', when: (f) => stockTotal(f) > 0 || f.plots.slice(0, landCount(f)).some(Boolean),
      make: (f, event) => {
        return { type: 'saudich', target: 'farm', txt: 'Sâu lạ kéo tới tấn công, lá rau rụng đầy gốc!', choices: [
          { t: 'Phun thuốc ngay (1 bình)', run: (f) => { if (f.sprays <= 0) { if (!pay(100000)) return false; } else f.sprays--; return 'Sâu nằm im hết, vườn thoát nạn.'; } },
          { t: 'Tay không bắt sâu', run: (f) => { const loss = Math.ceil(stockTotal(f) * 0.25); loseStock(f, loss); return 'Mất trắng ' + loss + ' sản phẩm trong kho...'; } }
        ], expire: (f) => { CROPS.forEach(c => { f.stock[c.id] = Math.max(0, Math.floor(f.stock[c.id] * 0.7)); }); } };
      }
    },
    {
      id: 'trom', icon: '🥷', when: (f) => stockTotal(f) >= 4,
      make: (f, event) => {
        return { type: 'trom', target: 'kho', txt: 'Đêm qua có tiếng động lạ gần kho, mấy bao rau rung bần bật!', choices: [
          { t: 'Thuê bảo vệ tuần đêm 300.000đ', run: (f) => { if (!pay(300000)) return false; return 'Đêm nay ngủ ngon, kho bình yên vô sự.'; } },
          { t: 'Tự canh thử xem sao', run: (f) => { if (Math.random() < 0.5) { return 'May quá, chỉ là con mèo hoang béo ú.'; } const loss = Math.ceil(stockTotal(f) * 0.1); loseStock(f, loss); return 'Trộm lấy mất ' + loss + ' sản phẩm!'; } }
        ], expire: (f) => { CROPS.forEach(c => { f.stock[c.id] = Math.max(0, f.stock[c.id] - Math.ceil(f.stock[c.id] * 0.12)); }); } };
      }
    },
    {
      id: 'khachvip', icon: '🌟', when: (f) => f.contracts.length > 0,
      make: (f, event) => {
        const c = event ? f.contracts.find(c => c.id === event.customerId) : pick(f.contracts);
        if (!c) return null;
        return { type: 'khachvip', customerId: c.id, target: 'farm', txt: c.name + ' gọi điện hỏi thăm, giọng tỉnh bơ: "Dạo này có gì ngon không ta?"', choices: [
          { t: 'Gửi giỏ quà 250.000đ', run: (f) => { if (!pay(250000)) return false; spawnWalkOrder(f); return c.name + ' vui lắm, chốt ngay một đơn mới.'; } },
          { t: 'Cảm ơn qua loa', run: (f) => { spawnWalkOrder(f); return 'Khách cũng đặt đơn, nhưng giá thường thôi.'; } }
        ], expire: () => {} };
      }
    }
  ];
  function loseStock(f, amount) {
    CROPS.forEach(c => {
      const taken = Math.min(f.stock[c.id], amount);
      f.stock[c.id] -= taken;
      amount -= taken;
    });
  }
  function quitWorker(f, w) {
    f.workers = f.workers.filter(x => x.id !== w.id);
  }
  function queueEvent(typeId) {
    const f = FM();
    const def = EVENT_DEFS.find(d => d.id === typeId);
    if (!def || !def.when(f) || f.events.some(e => e.type === typeId && !e.done)) return;
    const ev = def.make(f);
    ev.id = 'e' + Date.now() + rand(0, 999);
    ev.icon = def.icon;
    ev.until = Date.now() + 10 * 60000;
    ev.done = false;
    f.events.push(ev);
    save();
  }
  function maybeSpawnEvent(f, now) {
    if (now - f.lastEventAt < rand(240, 480) * 1000) return;
    if (f.events.filter(e => !e.done).length >= 2) { f.lastEventAt = now; return; }
    const defs = EVENT_DEFS.filter(d => d.when(f) && !f.events.some(e => e.type === d.id && !e.done));
    if (!defs.length) { f.lastEventAt = now; return; }
    if (Math.random() < 0.45) {
      const def = pick(defs);
      const ev = def.make(f);
      ev.id = 'e' + Date.now() + rand(0, 999);
      ev.icon = def.icon;
      ev.until = now + 10 * 60000;
      ev.done = false;
      f.events.push(ev);
      f.lastEventAt = now;
      sfx('catch');
      if (mounted) { fgPanel = 'event'; }
      toast('⚠️ Có chuyện cần ra tay trên trại!');
      save();
    } else f.lastEventAt = now;
  }
  function resolveEvent(id, choiceIdx) {
    const f = FM();
    const ev = f.events.find(e => e.id === id);
    if (!ev || ev.done) return;
    const handler = EVENT_DEFS.find(d => d.id === ev.type).make(f, ev);
    if (!handler) {
      ev.done = true; ev.doneAt = Date.now(); ev.result = 'Người liên quan không còn ở trại.';
      save(); render(); return;
    }
    const ch = handler.choices[choiceIdx];
    if (!ch) return;
    let msg = '';
    if (ch.run) msg = ch.run(f);
    else if (ch.risk != null) msg = Math.random() < ch.risk ? handler.ok(f) : handler.bad(f);
    if (msg === false) return;
    ev.done = true;
    ev.doneAt = Date.now();
    ev.result = msg || '';
    taskBump('event', 1);
    addXp(10);
    save(); sfx('win');
    render();
  }
  function eventTick(f, now) {
    let changed = false;
    f.events.forEach(ev => {
      if (!ev.done && now > ev.until) {
        const handler = EVENT_DEFS.find(d => d.id === ev.type).make(f, ev);
        ev.done = true;
        ev.doneAt = now;
        ev.expired = true;
        if (handler && handler.expire) ev.result = handler.expire(f) || 'Không xử lý kịp, trại chịu thiệt hại.';
        changed = true;
      }
    });
    f.events = f.events.filter(ev => !ev.done || now - ev.doneAt <= 60000);
    if (changed) save();
  }

  // ===================== THU MUA LẺ =====================
  function haggle(id) {
    const f = FM();
    const v = f.villagers.find(x => x.id === id);
    if (!v || v.gone || v.haggled) return;
    v.haggled = true;
    const falling = (f.season[v.crop] || { p: 1, prev: 1 }).p <= (f.season[v.crop] || { prev: 1 }).prev;
    if (Math.random() < (falling ? 0.75 : 0.55)) {
      v.unit = Math.round(v.unit * 0.9 / 1000) * 1000;
      save(); sfx('coin'); render();
      toast('Trả giá thành công, giảm 10%!');
    } else {
      v.gone = true;
      save(); sfx('lose'); render();
      toast('Người bán hừ lạnh rồi gánh đi mất!');
    }
  }
  function villagerBuy(id) {
    const f = FM();
    const v = f.villagers.find(x => x.id === id);
    if (!v || v.gone) return;
    const total = v.unit * v.qty;
    if (stockTotal(f) + v.qty > stockCap(f)) { toast('Kho chứa không hết, nâng cấp kho đi.'); sfx('error'); return; }
    if (!pay(total)) return;
    f.stock[v.crop] += v.qty;
    v.gone = true;
    taskBump('buy', v.qty);
    save(); sfx('buy'); render();
    toast('🤝 Mua ' + v.qty + ' ' + cropOf(v.crop).n + ' về kho!');
  }
  function villagerDecline(id) {
    const f = FM();
    const v = f.villagers.find(x => x.id === id);
    if (v) { v.gone = true; save(); render(); }
  }

  // ===================== NHIỆM VỤ =====================
  function taskBump(id, n) {
    const f = FM();
    f.tasks.forEach(t => { if (t.id === id && !t.claimed) t.have = Math.round((t.have + n) * 100) / 100; });
  }
  function claimTask(i) {
    const f = FM();
    const t = f.tasks[i];
    if (!t || t.claimed || t.have < t.need) return;
    t.claimed = true;
    addMoney(t.reward);
    addXp(25);
    save(); sfx('win'); render();
    toast('🏅 Xong nhiệm vụ! +' + money(t.reward));
  }

  // ===================== TRỢ LÝ =====================
  function assistantTick(f, now) {
    if (f.buildings.cskh < 1) return;
    if (tip.until && now < tip.until) return;
    let txt = null, act = null;
    const pendingEv = f.events.find(e => !e.done);
    const readyPlots = f.plots.slice(0, landCount(f)).filter(p => p && plotElapsed(p) >= plotGrowTime(p)).length;
    const giftCand = f.contracts.find(c => c.giftDay !== dayKey() && c.lastOrderDay && daysBetween(c.lastOrderDay, dayKey()) >= 1);
    if (pendingEv) txt = 'Sếp ơi ngoài vườn có chuyện kìa, ra xem gấp!';
    else if (stockTotal(f) >= stockCap(f) * 0.9 && stockCap(f) > 0) txt = 'Kho sắp đầy rồi sếp ơi, bán bớt hay nâng kho đi!';
    else if (readyPlots >= 3) txt = 'Ngoài vườn chín đỏ kìa, ai đó đi thu hoạch với!';
    else if (giftCand) { txt = giftCand.name + ' hợp tác lâu chưa tặng quà, sếp vào đơn hàng mà gửi tý lộc!'; act = 'orders'; }
    else if (isFestive()) txt = 'Dịp đặc biệt sắp tới rồi, tặng quà khách quen là đúng bài đó sếp!';
    else if (!f.workers.length && f.buildings.nha >= 1) txt = 'Nhà xây xong rồi mà chưa có ai ở, sếp đi tuyển người thôi!';
    else if (!f.plots.slice(0, landCount(f)).some(Boolean)) txt = 'Đất trống hoang hết rồi, trồng gì đi chứ sếp!';
    else txt = pick(['Sếp nhớ tưới cây đều đặn nha!', 'Trời đẹp quá, chắc sắp có đơn mới đó sếp.', 'Phân bón còn trong kho shop đó sếp.', 'Khách quen thích được hỏi thăm lắm đó.']);
    tip = { txt: txt, act: act, until: now + 7000, next: now + rand(25, 40) * 1000 };
  }
  function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 864e5); }

  // ===================== VÒNG LẶP =====================
  let mounted = false;
  let tickTimer = null;
  let lastWork = 0, lastSave = 0;
  let neg = null;
  let tip = {};
  let fgPanel = null;
  let uiSeed = 0;
  function tick() {
    if (!mounted || document.hidden) return;
    const f = FM();
    const now = Date.now();
    f.plots.forEach(p => {
      if (p && p.pauseAt && now >= f.__waterOffUntil) {
        p.at += Math.max(0, f.__waterOffUntil - p.pauseAt);
        delete p.pauseAt;
      }
    });
    if (f.irrigate && !(now < f.__waterOffUntil) && !(now < f.__powerOffUntil)) {
      for (let i = 0; i < landCount(f); i++) {
        const p = f.plots[i];
        if (p && !p.watered) {
          const remaining = Math.max(0, plotGrowTime(p) - plotElapsed(p, now));
          p.at -= Math.round(remaining * 0.2);
          p.watered = true;
        }
      }
    }
    // đơn hàng
    f.orders.forEach(o => {
      if (o.state === 'pack') {
        if (o.prog >= 100) {
          o.prog = 100;
          if (!o.packed) { taskBump('pack', o.qty); o.packed = true; }
          if (f.buildings.giaohang >= 1) { o.state = 'ship'; sfx('click'); }
        }
      } else if (o.state === 'ship') {
        o.shipProg = (o.shipProg || 0) + 100 / (30 / (f.buildings.giaohang || 1));
        if (o.shipProg >= 100) {
          o.state = 'done';
          const total = o.qty * o.price;
          addMoney(total);
          taskBump('order', 1);
          addXp(15);
          toast('🚚 Giao xong đơn ' + o.cust + ' · +' + money(total));
          sfx('coin');
        }
      }
    });
    f.orders = f.orders.filter(o => o.state !== 'done' || now - o.at < 30000);
    // sinh đơn vãng lai
    if (now > f.nextOrderAt) {
      const active = f.orders.filter(o => o.state === 'offer' || o.state === 'pack').length;
      if (active < orderCap(f)) spawnWalkOrder(f);
      f.nextOrderAt = now + rand(210, 390) * 1000;
      save();
    }
    // đơn hợp đồng
    if (f.contracts.length && now > f.nextContractAt) {
      const active = f.orders.filter(o => o.state !== 'done').length;
      if (active < orderCap(f)) spawnContractOrder(f);
      f.nextContractAt = now + rand(300, 540) * 1000;
      save();
    }
    // công nhân
    workerTick(f, now);
    if (now - lastWork > 3000) { workTick(f); lastWork = now; }
    // sự cố
    maybeSpawnEvent(f, now);
    eventTick(f, now);
    // trợ lý
    assistantTick(f, now);
    if (tip.until && now > tip.until) { tip.txt = null; tip.until = 0; }
    // nhắc nhở nhà nâng cấp trễ hạn
    f.workers.forEach(w => {
      if (w.__upgDue && now > w.__upgDue && f.buildings.nha < w.__upgLevel) {
        w.__upgDue = 0;
        w.morale = Math.max(0, w.morale - 20);
        queueEvent('thanhtra');
        toast('⚠️ ' + w.name + ' tố cáo lên thanh tra vì nhà chật!');
      }
    });
    // lưu nhẹ
    if (now - lastSave > 15000) { lastSave = now; save(); }
    render(true);
  }

  // ===================== RENDER =====================
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  let cam = { x: 0, y: 0 };
  let camEl = null, worldEl = null;
  let ptrBound = false, drag = null, moved = false, inertiaRaf = 0;
  let place = null;

  const DECO = (() => {
    const d = [];
    d.push('<div class="fg-court" style="left:' + PAD.c0 * TILE + 'px;top:' + PAD.r0 * TILE + 'px;width:' + (PAD.c1 - PAD.c0 + 1) * TILE + 'px;height:' + (PAD.r1 - PAD.r0 + 1) * TILE + 'px"></div>');
    d.push('<div class="fg-road" style="left:' + (18 * TILE) + 'px"></div>');
    d.push('<div class="fg-fence" style="left:76px;top:476px;width:290px;height:552px"></div>');
    d.push('<div class="fg-pond" style="left:560px;top:830px"></div><span class="fg-duck" style="left:604px;top:872px">🦆</span>');
    d.push('<button class="fg-stall" style="left:590px;top:468px" onclick="FarmGame.open(\'board\')"><span>🏪</span><small>Chợ làng</small></button>');
    d.push('<div class="fg-gate" style="left:650px;top:1052px">🚧<small>Cổng trại</small></div>');
    [[28, 258, '🌳'], [368, 58, '🌳'], [818, 250, '🌳'], [826, 556, '🌴'], [36, 1072, '🌳'], [300, 1100, '🌿'], [560, 1102, '🌳'], [822, 886, '🌳'], [472, 402, '🌼'], [560, 300, '🌼'], [486, 560, '🌼'], [596, 620, '🌳'], [744, 700, '🌳'], [468, 1180, '🌳'], [702, 566, '🌿'], [520, 660, '🌿'], [752, 1000, '🌿'], [664, 760, '🌼']].forEach(t => {
      d.push('<span class="' + (t[2] === '🌼' ? 'fg-flower' : 'fg-tree') + '" style="left:' + t[0] + 'px;top:' + t[1] + 'px">' + t[2] + '</span>');
    });
    [[600, 330, '🚜'], [700, 128, '🪣'], [500, 238, '🌾'], [530, 1000, '🐔'], [420, 1050, '🐕'], [618, 168, '🌾'], [684, 132, '🌾'], [736, 178, '🌾'], [624, 392, '🐄'], [722, 414, '🐖'], [562, 706, '🐐'], [706, 948, '🪵']].forEach(t => {
      d.push('<span class="fg-prop" style="left:' + t[0] + 'px;top:' + t[1] + 'px">' + t[2] + '</span>');
    });
    return d.join('');
  })();

  function applyCam() {
    if (worldEl) worldEl.style.transform = 'translate3d(' + Math.round(cam.x) + 'px,' + Math.round(cam.y) + 'px,0)';
  }
  function clampCam() {
    if (!camEl) return;
    const vw = camEl.clientWidth || 0, vh = camEl.clientHeight || 0;
    if (!vw || !vh) return;
    cam.x = vw >= WORLD_W ? Math.round((vw - WORLD_W) / 2) : Math.min(0, Math.max(vw - WORLD_W, cam.x));
    cam.y = vh >= WORLD_H ? Math.round((vh - WORLD_H) / 2) : Math.min(0, Math.max(vh - WORLD_H, cam.y));
  }
  function centerOn(x, y) {
    if (!camEl) return;
    cam.x = (camEl.clientWidth || 360) / 2 - x;
    cam.y = (camEl.clientHeight || 700) / 2 - y;
    clampCam(); applyCam();
  }
  function stopInertia() { if (inertiaRaf) cancelAnimationFrame(inertiaRaf); inertiaRaf = 0; }
  function startInertia(vx, vy) {
    stopInertia();
    if (Math.hypot(vx, vy) < 2.5) return;
    const step = () => {
      vx *= 0.9; vy *= 0.9;
      cam.x += vx; cam.y += vy;
      clampCam(); applyCam();
      inertiaRaf = Math.hypot(vx, vy) > 0.5 ? requestAnimationFrame(step) : 0;
    };
    inertiaRaf = requestAnimationFrame(step);
  }
  function onDown(e) {
    if (e.button > 0) return;
    stopInertia();
    moved = false;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, lx: e.clientX, ly: e.clientY, lt: performance.now(), vx: 0, vy: 0 };
    if (place) moveGhost(e.clientX, e.clientY);
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 7) moved = true;
    if (place) {
      const box = camEl.getBoundingClientRect(), edge = 70;
      let px = 0, py = 0;
      if (e.clientX < box.left + edge) px = 10; else if (e.clientX > box.right - edge) px = -10;
      if (e.clientY < box.top + edge) py = 10; else if (e.clientY > box.bottom - edge) py = -10;
      if (px || py) { cam.x += px; cam.y += py; clampCam(); applyCam(); }
      moveGhost(e.clientX, e.clientY);
      return;
    }
    cam.x = drag.cx + dx; cam.y = drag.cy + dy;
    clampCam(); applyCam();
    const t = performance.now(), dt = Math.max(8, t - drag.lt);
    drag.vx = (e.clientX - drag.lx) / dt * 16;
    drag.vy = (e.clientY - drag.ly) / dt * 16;
    drag.lx = e.clientX; drag.ly = e.clientY; drag.lt = t;
  }
  function onUp(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const d = drag; drag = null;
    if (!place && moved) startInertia(d.vx, d.vy);
    setTimeout(() => { moved = false; }, 0);
  }
  function onClickCap(e) {
    if (moved || place) { e.preventDefault(); e.stopPropagation(); }
  }
  function onResize() { clampCam(); applyCam(); }
  function bindPtr() {
    if (ptrBound || !camEl) return;
    ptrBound = true;
    camEl.addEventListener('pointerdown', onDown);
    camEl.addEventListener('click', onClickCap, true);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('resize', onResize);
  }
  function unbindPtr() {
    if (!ptrBound) return;
    ptrBound = false;
    if (camEl) { camEl.removeEventListener('pointerdown', onDown); camEl.removeEventListener('click', onClickCap, true); }
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    window.removeEventListener('resize', onResize);
  }

  function moveGhost(clientX, clientY) {
    if (!place || !camEl) return;
    const box = camEl.getBoundingClientRect();
    const wx = clientX - box.left - cam.x, wy = clientY - box.top - cam.y;
    const s = FOOT[place.key];
    place.c = Math.max(PAD.c0, Math.min(PAD.c1 - s[0] + 1, Math.round(wx / TILE - s[0] / 2)));
    place.r = Math.max(PAD.r0, Math.min(PAD.r1 - s[1] + 1, Math.round(wy / TILE - s[1] / 2)));
    place.ok = canPlace(FM(), place.key, place.c, place.r);
    paintGhost();
  }
  function paintGhost() {
    if (!place) return;
    const g = worldEl && worldEl.querySelector('.fg-ghost');
    if (g) {
      const s = FOOT[place.key];
      g.style.left = place.c * TILE + 'px';
      g.style.top = place.r * TILE + 'px';
      g.style.width = (s[0] * TILE - 4) + 'px';
      g.style.height = (s[1] * TILE - 4) + 'px';
      g.classList.toggle('bad', !place.ok);
    }
    const btn = document.querySelector('.fg-place-ok');
    if (btn) { btn.disabled = !place.ok; btn.classList.toggle('off', !place.ok); }
    const tipEl = document.querySelector('.fg-place-t span');
    if (tipEl) tipEl.innerText = (place.ok ? 'chỗ trống, đặt được' : 'vướng rồi, kéo chỗ khác');
  }
  function startPlace(key) {
    const f = FM(), b = BUILDINGS[key];
    if (!b || !FOOT[key] || f.buildings[key] > 0) return;
    if (wallet() < b.cost[1]) { toast('Chưa đủ ' + money(b.cost[1]) + ' để xây ' + b.n + '.'); sfx('error'); return; }
    const s = FOOT[key];
    let spot = null;
    for (let r = PAD.r0; r <= PAD.r1 - s[1] + 1 && !spot; r++) {
      for (let c = PAD.c0; c <= PAD.c1 - s[0] + 1; c++) {
        if (canPlace(f, key, c, r)) { spot = { c: c, r: r }; break; }
      }
    }
    if (!spot) { toast('Hết chỗ trống để xây rồi.'); sfx('error'); return; }
    fgPanel = null; neg = null;
    place = { key: key, c: spot.c, r: spot.r, ok: canPlace(f, key, spot.c, spot.r) };
    render();
    requestAnimationFrame(() => {
      centerOn((spot.c + s[0] / 2) * TILE, (spot.r + s[1] / 2) * TILE);
      paintGhost();
    });
  }
  function placeConfirm() {
    if (!place) return;
    const f = FM(), key = place.key, b = BUILDINGS[key];
    if (!place.ok) { toast('Chỗ này không đặt được, kéo chỗ khác nhé.'); return; }
    if (!pay(b.cost[1])) return;
    f.buildings[key] = 1;
    f.buildingPos[key] = { c: place.c, r: place.r };
    place = null;
    addXp(20);
    save(); sfx('merge'); render();
    toast(b.e + ' ' + b.n + ' dựng xong!');
  }
  function placeCancel() { place = null; fgPanel = 'build'; render(); }

  function render(soft) {
    const root = document.getElementById('farm-root');
    if (!mounted || !root || !worldEl) return;
    const f = FM();
    const now = Date.now();
    uiSeed++;
    const openOrders = f.orders.filter(o => o.state !== 'done');
    const pendingEvents = f.events.filter(e => !e.done);
    const claimable = f.tasks.some(t => !t.claimed && t.have >= t.need);

    const hud = '<button class="fg-back" onclick="FarmGame.leave()">⬅</button>'
      + '<div class="fg-hud-mid">'
      + '<div class="fg-hud-t">🌾 Nông trại <b>Cấp ' + f.level + '</b></div>'
      + '<div class="fg-xp"><i style="width:' + Math.min(100, Math.round(f.xp / xpNext(f.level) * 100)) + '%"></i></div>'
      + '</div>'
      + '<div class="fg-hud-r">'
      + '<span class="wallet-mini">💲' + bigMoney(wallet()) + '</span>'
      + '<span>🏚️ ' + stockTotal(f) + '/' + stockCap(f) + ' · 👷 ' + f.workers.length + '/' + workerSlots(f) + '</span>'
      + '</div>';

    const tools = '<button class="fg-tool" onclick="FarmGame.open(\'shop\')">🛒</button>'
      + '<button class="fg-tool" onclick="FarmGame.open(\'tasks\')">' + (claimable ? '<b class="fg-badge">!</b>' : '') + '🏅</button>'
      + '<button class="fg-tool" onclick="FarmGame.open(\'orders\')">' + (openOrders.length ? '<b class="fg-badge">' + openOrders.length + '</b>' : '') + '📋</button>'
      + '<button class="fg-tool" onclick="FarmGame.open(\'hire\')">👷</button>'
      + '<button class="fg-tool" onclick="FarmGame.open(\'build\')">' + (pendingEvents.length ? '<b class="fg-badge">' + pendingEvents.length + '</b>' : '') + '🏗️</button>'
      + '<button class="fg-tool" onclick="FarmGame.open(\'board\')">📰</button>'
      + '<button class="fg-tool" onclick="FarmGame.open(\'events\')">' + (pendingEvents.length ? '<b class="fg-badge warn">' + pendingEvents.length + '</b>' : '') + '🔔</button>';

    let blds = '';
    Object.keys(BUILDINGS).forEach(k => {
      const p = bpos(f, k);
      if (!p) return;
      const b = BUILDINGS[k], ev = pendingEvents.find(e => e.target === k), sz = FOOT[k];
      blds += '<button class="fg-bld" style="left:' + p.c * TILE + 'px;top:' + p.r * TILE + 'px;width:' + (sz[0] * TILE - 4) + 'px;height:' + (sz[1] * TILE - 4) + 'px" onclick="FarmGame.open(\'' + (ev ? 'events' : 'build') + '\')">'
        + '<span class="fg-bld-e">' + b.e + '</span><span class="fg-bld-lb">' + b.s + '</span>'
        + '<span class="fg-bld-lv">C' + f.buildings[k] + '</span>'
        + (ev ? '<b class="fg-bld-warn">⚠️</b>' : '') + '</button>';
    });

    let plots = '';
    for (let i = 0; i < MAX_PLOTS; i++) {
      const rct = plotRect(i);
      const st = 'left:' + rct.x + 'px;top:' + rct.y + 'px;width:' + rct.w + 'px;height:' + rct.h + 'px;';
      if (i >= landCount(f)) {
        const canBuy = i === landCount(f) && f.level >= LAND_LVL(i);
        plots += '<div class="fg-plot locked" style="' + st + '">'
          + (canBuy ? '<button class="fg-mini" onclick="FarmGame.buyLand(' + i + ')">🟫 ' + bigMoney(LAND_COST(i)) + '</button>'
            : '<span class="fg-p-lb">🔒 Cấp ' + LAND_LVL(i) + '</span>')
          + '</div>';
        continue;
      }
      const p = f.plots[i];
      if (!p) {
        const c = cropOf(farmPick);
        const fertBtn = f.fertBags > 0 ? '<button class="fg-mini alt" title="Trồng và bón phân" onclick="FarmGame.plant(' + i + ',true)">🌾</button>' : '';
        plots += '<div class="fg-plot empty" style="' + st + '"><button class="fg-mini" onclick="FarmGame.plant(' + i + ',false)">' + c.e + ' ' + (c.seed / 1000) + 'k</button>' + fertBtn + '</div>';
        continue;
      }
      const crop = cropOf(p.crop);
      const gt = plotGrowTime(p);
      const prog = Math.min(1, plotElapsed(p, now) / gt);
      const ready = prog >= 1;
      const pestVisible = p.pest && !p.treated && prog >= 0.5;
      const waterOff = f.__waterOffUntil && now < f.__waterOffUntil;
      let act;
      if (ready) act = '<button class="fg-mini pink" onclick="FarmGame.harvest(' + i + ')">🧺 Thu</button>';
      else if (pestVisible) act = '<button class="fg-mini red" onclick="FarmGame.treat(' + i + ')">🐛 Phun</button>';
      else if (!p.watered && !waterOff) act = '<button class="fg-mini blue" onclick="FarmGame.water(' + i + ')">💧 Tưới</button>';
      else act = '<span class="fg-p-lb">' + (waterOff ? '🚱 Cúp nước' : Math.max(1, Math.ceil((gt - plotElapsed(p, now)) / 60000)) + 'p') + '</span>';
      plots += '<div class="fg-plot" style="' + st + '">'
        + '<span class="fg-p-e">' + crop.e + '</span>'
        + '<div class="fg-p-bar"><i style="width:' + Math.round(prog * 100) + '%"></i></div>'
        + (pestVisible ? '<span class="fg-pest">🐛</span>' : '')
        + act + '</div>';
    }

    let workers = '';
    f.workers.forEach(w => {
      const ev = pendingEvents.find(e => e.target === w.id);
      const x = w.tx != null ? w.tx : 640, y = w.ty != null ? w.ty : 700;
      workers += '<div class="fg-worker" data-worker="' + esc(w.id) + '" style="left:' + x + 'px;top:' + y + 'px;">'
        + (ev ? '<button class="fg-warn w" onclick="FarmGame.open(\'events\')">⚠️</button>' : '')
        + (w.__say ? '<div class="fg-say">' + esc(w.__say) + '</div>' : '')
        + '<span class="fg-w-e">' + w.emoji + '</span></div>';
    });

    const cp = bpos(f, 'cskh');
    const astLeft = (cp ? cp.c : 13) * TILE + 22;
    const astTop = (cp ? cp.r + 1 : 3) * TILE + 20;
    let assistant = '';
    if (f.buildings.cskh) {
      assistant = '<div class="fg-assistant" style="left:' + astLeft + 'px;top:' + astTop + 'px;">'
        + (tip.txt ? '<div class="fg-say big">' + esc(tip.txt) + '</div>' : '')
        + '<span class="fg-w-e">🧑‍💼</span></div>';
    }

    const orderChips = openOrders.length ? openOrders.map(o => {
      const pr = o.state === 'pack' ? o.prog : (o.shipProg || 0);
      return '<button class="fg-ochip ' + o.state + '" onclick="FarmGame.open(\'orders\')">'
        + o.emoji + ' ' + esc(o.cust) + ' · ' + o.qty + cropOf(o.crop).e
        + '<i><b style="width:' + Math.min(100, Math.round(pr)) + '%"></b></i></button>';
    }).join('') : '';
    const orders = place ? '' : orderChips;

    const bar = place ? ('<div class="fg-placebar">'
      + '<div class="fg-place-t"><b>' + BUILDINGS[place.key].e + ' ' + BUILDINGS[place.key].n + '</b>'
      + '<span>' + (place.ok ? 'chỗ trống, đặt được' : 'vướng rồi, kéo chỗ khác') + '</span></div>'
      + '<button class="fg-btn ghost" onclick="FarmGame.placeCancel()">Hủy</button>'
      + '<button class="fg-btn fg-place-ok' + (place.ok ? '' : ' off') + '"' + (place.ok ? '' : ' disabled') + ' onclick="FarmGame.placeConfirm()">Đặt · ' + bigMoney(BUILDINGS[place.key].cost[1]) + '</button>'
      + '</div>') : '';

    const set = (sel, html) => { const el = root.querySelector(sel); if (el) el.innerHTML = html; };
    set('.fg-hud', hud);
    set('.fg-tools', tools);
    set('.fg-orders', orders);
    set('.fg-placebar', bar);
    set('.fg-blds', blds);
    set('.fg-plots', plots);

    const yard = worldEl.querySelector('.fg-yard');
    if (yard) {
      const holder = document.createElement('div');
      holder.innerHTML = workers;
      const next = Array.prototype.slice.call(holder.children);
      next.forEach(node => {
        const cur = Array.prototype.slice.call(yard.children).find(el => el.dataset.worker === node.dataset.worker);
        if (cur) { if (cur.innerHTML !== node.innerHTML) cur.innerHTML = node.innerHTML; }
        else yard.appendChild(node);
      });
      const ids = next.map(n => n.dataset.worker);
      Array.prototype.slice.call(yard.children).forEach(el => { if (ids.indexOf(el.dataset.worker) < 0) el.remove(); });
    }

    const oldAst = worldEl.querySelector('.fg-assistant');
    if (assistant) {
      let node = oldAst;
      if (!node) { node = document.createElement('div'); node.className = 'fg-assistant'; worldEl.appendChild(node); }
      node.style.left = astLeft + 'px';
      node.style.top = astTop + 'px';
      node.innerHTML = (tip.txt ? '<div class="fg-say big">' + esc(tip.txt) + '</div>' : '') + '<span class="fg-w-e">🧑‍💼</span>';
    } else if (oldAst) oldAst.remove();

    worldEl.classList.toggle('placing', !!place);
    let ghost = worldEl.querySelector('.fg-ghost');
    if (place) {
      if (!ghost) { ghost = document.createElement('div'); ghost.className = 'fg-ghost'; worldEl.appendChild(ghost); }
      paintGhost();
    } else if (ghost) ghost.remove();

    const host = root.querySelector('.fg-modal-host');
    if (host) {
      const nextHtml = modalHtml(f, now);
      const oldSheet = host.querySelector('.fg-sheet');
      if (!nextHtml) host.innerHTML = '';
      else if (oldSheet) {
        const sc = oldSheet.scrollTop;
        const wrap = document.createElement('div');
        wrap.innerHTML = nextHtml;
        oldSheet.innerHTML = wrap.querySelector('.fg-sheet').innerHTML;
        oldSheet.scrollTop = sc;
      } else host.innerHTML = nextHtml;
    }

    requestAnimationFrame(() => {
      f.workers.forEach(w => {
        const el = yard && yard.querySelector('[data-worker="' + w.id + '"]');
        if (!el) return;
        const x = w.tx != null ? w.tx : 640;
        el.style.left = x + 'px';
        el.style.top = (w.ty != null ? w.ty : 700) + 'px';
        el.classList.toggle('flip', x < (w.__px != null ? w.__px : x));
        w.__px = x;
      });
    });
  }

  function modalHtml(f, now) {
    if (!fgPanel) return '';
    let inner = '';
    if (fgPanel === 'shop') {
      const seeds = CROPS.map(c => '<div class="fg-row"><span>' + c.e + ' ' + c.n + '</span><span class="fg-sub">chín ' + (c.grow / 60000) + 'p · bán ' + money(c.sell) + '</span><button class="fg-btn" onclick="FarmGame.pick(\'' + c.id + '\')">' + (farmPick === c.id ? '✓ Đang chọn' : 'Chọn') + '</button></div>').join('');
      inner = '<div class="fg-h">🛒 Sạp hàng nông trại</div>'
        + '<div class="fg-sec">Hạt giống (trả tiền lúc trồng)</div>' + seeds
        + '<div class="fg-sec">Vật tư</div>'
        + '<div class="fg-row"><span>🌾 Phân bón ×5</span><span class="fg-sub">cây lớn nhanh 35%</span><button class="fg-btn" onclick="FarmGame.buyItem(\'fert\')">' + money(25000) + '</button></div>'
        + '<div class="fg-row"><span>🧪 Thuốc trừ sâu ×5</span><span class="fg-sub">cứu luống bị sâu phá</span><button class="fg-btn" onclick="FarmGame.buyItem(\'spray\')">' + money(50000) + '</button></div>'
        + '<div class="fg-row"><span>💦 Máy tưới tự động</span><span class="fg-sub">tưới hết vườn không cần tay</span><button class="fg-btn" onclick="FarmGame.buyItem(\'irrig\')">' + (f.irrigate ? 'Đã lắp ✓' : money(3000000)) + '</button></div>'
        + '<div class="fg-sec">Đất</div>'
        + '<div class="fg-row"><span>🟫 Luống đất tiếp theo</span><span class="fg-sub">' + (landCount(f) >= MAX_PLOTS ? 'đã mở hết' : 'chạm ô khóa trên vườn để mua') + '</span></div>'
        + '<div class="fg-note">Đang có: phân ×' + f.fertBags + ' · thuốc ×' + f.sprays + '</div>';
    } else if (fgPanel === 'tasks') {
      inner = '<div class="fg-h">🏅 Nhiệm vụ hôm nay</div>'
        + (f.tasks.length ? f.tasks.map((t, i) => {
          const done = t.have >= t.need;
          return '<div class="fg-row"><span>' + (done ? '✅ ' : '⬜ ') + t.txt + '</span><span class="fg-sub">' + Math.min(Math.round(t.have * 10) / 10, t.need) + '/' + t.need + '</span>'
            + (t.claimed ? '<b class="fg-done">Đã nhận</b>' : done ? '<button class="fg-btn" onclick="FarmGame.claim(' + i + ')">+' + money(t.reward) + '</button>' : '') + '</div>';
        }).join('') : '<div class="fg-note">Mai quay lại nhận nhiệm vụ mới nhé.</div>')
        + '<div class="fg-note">Làm xong nhớ bấm nhận thưởng, qua ngày là mất đó.</div>';
    } else if (fgPanel === 'orders') {
      const offers = f.orders.filter(o => o.state === 'offer');
      const doing = f.orders.filter(o => o.state === 'pack' || o.state === 'ship');
      const contracts = f.contracts.map(c => '<div class="fg-row"><span>' + c.emoji + ' ' + esc(c.name) + '</span><span class="fg-sub">giá hợp đồng ×' + c.ceil.toFixed(2) + '</span>'
        + (c.giftDay === dayKey() ? '<b class="fg-done">Đã tặng quà 🎁</b>' : '<button class="fg-btn" onclick="FarmGame.gift(\'' + c.id + '\')">🎁 ' + money(250000) + '</button>') + '</div>').join('');
      inner = '<div class="fg-h">📋 Đơn hàng</div>'
        + '<div class="fg-sec">Khách tự tìm đến · ' + offers.length + ' đơn chờ nhận</div>'
        + (offers.length ? offers.map(o => '<div class="fg-row"><span>' + o.emoji + ' ' + esc(o.cust) + ' cần ' + o.qty + cropOf(o.crop).e + ' ' + cropOf(o.crop).n + '</span><span class="fg-sub">' + money(o.qty * o.price) + '</span><button class="fg-btn" onclick="FarmGame.accept(\'' + o.id + '\')">Nhận đơn</button></div>').join('') : '<div class="fg-note">Chưa có khách lạ nào ghé.</div>')
        + '<div class="fg-sec">Đang làm · ' + doing.length + ' đơn</div>'
        + (doing.length ? doing.map(o => {
          const pr = o.state === 'pack' ? o.prog : (o.shipProg || 0);
          return '<div class="fg-row"><span>' + o.emoji + ' ' + esc(o.cust) + ' · ' + o.qty + cropOf(o.crop).e + '</span>'
            + '<span class="fg-prog"><i style="width:' + Math.min(100, Math.round(pr)) + '%"></i></span>'
            + (o.state === 'pack' ? '<button class="fg-btn" onclick="FarmGame.packClick(\'' + o.id + '\')">📦 Đóng gói</button>' : '<b class="fg-done">🚚 Đang giao</b>') + '</div>';
        }).join('') : '<div class="fg-note">Nhận đơn rồi đóng gói tại đây, có công nhân thì tụi nó lo.</div>')
        + '<div class="fg-sec">Khách hợp đồng · ' + f.contracts.length + '</div>'
        + (contracts || '<div class="fg-note">Chưa ai kí hợp đồng dài hạn.</div>')
        + '<button class="fg-btn wide" onclick="FarmGame.negStart()">✍️ Đi tìm khách kí hợp đồng</button>'
        + (f.buildings.cskh ? '<div class="fg-note">🧑‍💼 Trợ lý: tặng quà khách quen để đơn sau giá đẹp hơn 12%.</div>' : '');
    } else if (fgPanel === 'hire') {
      const cvs = f.candidates.map(c => '<div class="fg-cv"><div class="fg-cv-top"><span class="fg-cv-e">' + c.emoji + '</span><b>' + esc(c.name) + '</b><span class="fg-tag">' + (c.role === 'vuon' ? 'Làm vườn' : 'Đóng gói') + '</span></div>'
        + '<div class="fg-cv-body">Tay nghề ×' + c.skill.toFixed(2) + ' · Lương ' + money(c.wage) + '/ngày<br>' + c.quirkN + ' — ' + c.quirkD + '</div>'
        + '<button class="fg-btn" onclick="FarmGame.hire(\'' + c.id + '\')">🤝 Tuyển</button></div>').join('');
      inner = '<div class="fg-h">👷 Tuyển công nhân · chỗ trống ' + Math.max(0, workerSlots(f) - f.workers.length) + '</div>'
        + (workerSlots(f) <= 0 ? '<div class="fg-note">Xây Nhà công nhân trước đã nhé.</div>' : cvs)
        + (f.workers.length ? '<div class="fg-sec">Đội ngũ hiện tại</div>' + f.workers.map(w => '<div class="fg-row"><span>' + w.emoji + ' ' + esc(w.name) + ' · ' + (w.role === 'vuon' ? 'Làm vườn' : 'Đóng gói') + '</span><span class="fg-sub">' + money(w.wage) + '/ngày · ' + w.morale + '♥</span><button class="fg-btn danger" onclick="FarmGame.fire(\'' + w.id + '\')">Cho nghỉ</button></div>').join('') : '');
    } else if (fgPanel === 'build') {
      const rows = Object.keys(BUILDINGS).map(k => {
        const b = BUILDINGS[k], lv = f.buildings[k];
        const full = lv >= b.max;
        const extra = k === 'kho' ? 'Sức chứa ' + stockCap(f) : k === 'nha' ? 'Chỗ ở ' + workerSlots(f) + ' người' : k === 'donggoi' ? 'Tốc độ ×' + (BUILDINGS.donggoi.mult[lv] || 0) : '';
        return '<div class="fg-row"><span>' + b.e + ' ' + b.n + ' <b>Cấp ' + lv + '</b></span><span class="fg-sub">' + (full ? 'tối đa · ' + extra : money(b.cost[lv + 1]) + ' · ' + b.d + (extra ? ' · ' + extra : '')) + '</span>'
          + (full ? '<b class="fg-done">MAX</b>' : '<button class="fg-btn" onclick="FarmGame.' + (lv === 0 ? 'startPlace' : 'build') + '(\'' + k + '\')">' + (lv === 0 ? '🏗 Chọn chỗ' : 'Nâng cấp') + '</button>') + '</div>';
      }).join('');
      inner = '<div class="fg-h">🏗️ Xây dựng</div>' + rows
        + (f.buildings.ketoan ? '<div class="fg-sec">📒 Sổ sách hôm nay</div>'
          + '<div class="fg-row"><span>Thu</span><b class="fg-money">' + money(f.ledger.in) + '</b></div>'
          + '<div class="fg-row"><span>Chi</span><b class="fg-money out">' + money(f.ledger.out) + '</b></div>'
          + (f.ledgerHist.length ? '<div class="fg-note">' + f.ledgerHist.slice(0, 4).map(h => h.day.slice(5) + ': thu ' + money(h.in) + ' · chi ' + money(h.out)).join('<br>') + '</div>' : '')
          : '<div class="fg-note">Xây Phòng kế toán để xem sổ sách và đỡ lo thanh tra.</div>');
    } else if (fgPanel === 'board') {
      const vill = f.villagers.filter(v => !v.gone).map(v => {
        const c = cropOf(v.crop);
        const sea = f.season[v.crop] || { p: 1, prev: 1 };
        const chg = Math.round((sea.p - sea.prev) * 100);
        return '<div class="fg-row vill"><span>🧺 ' + v.qty + c.e + ' ' + c.n + '</span><span class="fg-sub">' + money(v.unit) + '/sp · ' + money(v.unit * v.qty) + '</span></div>'
          + '<div class="fg-row"><span class="fg-sub">thời vụ ' + c.e + ' ' + (chg >= 0 ? '▲' : '▼') + ' ' + Math.abs(chg) + '%</span>'
          + (v.haggled ? '<b class="fg-done">Đã trả giá</b>' : '<button class="fg-btn" onclick="FarmGame.haggle(\'' + v.id + '\')">🤏 Trả giá</button>')
          + '<button class="fg-btn" onclick="FarmGame.vBuy(\'' + v.id + '\')">Mua hết</button><button class="fg-btn ghost" onclick="FarmGame.vDecline(\'' + v.id + '\')">Bỏ qua</button></div>';
      }).join('');
      const seaRows = CROPS.map(c => {
        const sea = f.season[c.id] || { p: 1, prev: 1 };
        const chg = Math.round((sea.p - sea.prev) * 100);
        return '<div class="fg-row"><span>' + c.e + ' ' + c.n + '</span><span class="fg-sub">giá bán ' + money(Math.round(c.sell * sea.p / 1000) * 1000) + ' · ' + (chg >= 0 ? '▲' : '▼') + ' ' + Math.abs(chg) + '%</span></div>';
      }).join('');
      inner = '<div class="fg-h">📰 Bảng tin thời vụ</div>'
        + '<div class="fg-sec">Giá cả hôm nay</div>' + seaRows
        + '<div class="fg-sec">Người dân rao bán · mua về bán lại kiếm lời</div>'
        + (vill || '<div class="fg-note">Hôm nay chưa ai gánh hàng rao.</div>');
    } else if (fgPanel === 'events') {
      const list = f.events.length ? f.events.map(e => '<div class="fg-ev ' + (e.done ? 'done' : '') + '"><span class="fg-ev-i">' + e.icon + '</span><div><div class="fg-ev-t">' + esc(e.txt) + '</div>'
        + (e.done ? '<div class="fg-note">' + (e.expired ? '⌛ Bỏ mặc: ' : '') + esc(e.result || '') + '</div>'
          : '<div class="fg-ev-c">' + e.choices.map((c, i) => '<button class="fg-btn" onclick="FarmGame.resolve(\'' + e.id + '\',' + i + ')">' + c.t + '</button>').join('') + '</div>')
        + '</div></div>').join('') : '<div class="fg-note">Trại đang yên ổn, chưa có sự cố nào.</div>';
      inner = '<div class="fg-h">🔔 Sự cố trên trại</div>' + list;
    } else if (fgPanel === 'event') {
      const ev = pendingEvent(f);
      if (ev) {
        inner = '<div class="fg-h">' + ev.icon + ' Có chuyện rồi!</div>'
          + '<div class="fg-ev-t">' + esc(ev.txt) + '</div>'
          + '<div class="fg-ev-c">' + ev.choices.map((c, i) => '<button class="fg-btn" onclick="FarmGame.resolve(\'' + ev.id + '\',' + i + ')">' + c.t + '</button>').join('') + '</div>'
          + '<div class="fg-note">Không lo thì 10 phút sau nó tự động đến... theo hướng tệ hơn.</div>';
      } else fgPanel = null;
    } else if (fgPanel === 'neg' && neg) {
      const n = neg;
      const react = n.patience > 60 ? '😊' : n.patience > 30 ? '🤔' : '😤';
      inner = '<div class="fg-h">✍️ Đàm phán với ' + n.emoji + ' ' + esc(n.name) + '</div>'
        + '<div class="fg-neg"><div class="fg-row"><span>Giá bạn đề xuất</span><b class="fg-money">×' + n.offer.toFixed(2) + '</b></div>'
        + '<div class="fg-row"><span>Thái độ khách ' + react + '</span><span class="fg-prog"><i style="width:' + Math.max(0, n.patience) + '%"></i></span></div>'
        + '<div class="fg-row"><span>Vòng ' + Math.min(n.round, 3) + '/3</span></div></div>'
        + '<div class="fg-note">' + n.log.slice(-3).map(esc).join('<br>') + '</div>'
        + '<div class="fg-ev-c">'
        + '<button class="fg-btn" onclick="FarmGame.negTactic(\'khen\')">😊 Khen khéo</button>'
        + '<button class="fg-btn" onclick="FarmGame.negTactic(\'ep\')">💪 Ép giá (×' + (n.offer - 0.06).toFixed(2) + ')</button>'
        + '<button class="fg-btn" onclick="FarmGame.negTactic(\'qua\')">🎁 Tặng mẫu thử 50.000đ</button>'
        + '<button class="fg-btn pink" onclick="FarmGame.negClose()">🤝 Chốt deal</button></div>';
    }
    if (!fgPanel) return '';
    return '<div class="fg-modal" onclick="if(event.target===this)FarmGame.close()"><div class="fg-sheet"><button class="fg-x" onclick="FarmGame.close()">✕</button>' + inner + '</div></div>';
  }
  function pendingEvent(f) { return f.events.find(e => !e.done); }

  // ===================== MOUNT =====================
  function mount() {
    if (mounted) return;
    mounted = true;
    const root = document.getElementById('farm-root');
    const f = FM();
    if (root) {
      root.innerHTML = '<div class="fg-hud"></div>'
        + '<div class="fg-cam"><div class="fg-world">'
        + DECO
        + '<div class="fg-pad" style="left:' + PAD.c0 * TILE + 'px;top:' + PAD.r0 * TILE + 'px;width:' + (PAD.c1 - PAD.c0 + 1) * TILE + 'px;height:' + (PAD.r1 - PAD.r0 + 1) * TILE + 'px;"></div>'
        + '<div class="fg-blds"></div><div class="fg-plots"></div><div class="fg-yard"></div>'
        + '</div></div>'
        + '<div class="fg-tools"></div><div class="fg-orders"></div><div class="fg-placebar"></div><div class="fg-modal-host"></div>';
      camEl = root.querySelector('.fg-cam');
      worldEl = root.querySelector('.fg-world');
      bindPtr();
      clampCam();
      centerOn(170, 300);
    }
    if (!f.orders.some(o => o.state === 'offer') && !f.orders.length) spawnWalkOrder(f);
    save();
    render();
    tickTimer = setInterval(tick, 1000);
  }
  function unmount() {
    mounted = false;
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
    stopInertia();
    drag = null; place = null; fgPanel = null; neg = null;
    unbindPtr();
    camEl = null; worldEl = null;
    save();
  }
  function enter() {
    try { if (window.openFs) window.openFs('farm'); } catch (e) {}
    mount();
  }
  function leave() {
    unmount();
    try { if (window.closeFs) window.closeFs(); } catch (e) {}
  }

  window.FarmGame = {
    mount, unmount, render, enter, leave,
    open: (p) => { place = null; fgPanel = p; sfx('click'); render(); },
    close: () => { fgPanel = null; neg = null; render(); },
    pick: (id) => { farmPick = id; sfx('click'); render(); },
    plant, water, treat, harvest, buyLand, buyItem, build,
    startPlace, placeConfirm, placeCancel,
    hire, fire, accept: acceptOrder, packClick, gift,
    negStart, negTactic, negClose,
    resolve: resolveEvent, haggle, vBuy: villagerBuy, vDecline: villagerDecline,
    claim: claimTask,
    _debug: {
      FM, spawnWalkOrder, queueEvent, tick,
      placeAt: (key, c, r) => {
        startPlace(key);
        if (!place) return false;
        place.c = c; place.r = r;
        place.ok = canPlace(FM(), key, c, r);
        placeConfirm();
        return FM().buildings[key] > 0;
      }
    }
  };
})();
