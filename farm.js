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
  const SEED_PACK = 5;
  const FERTS = [
    { id: 'thuong', n: 'Phân chuồng', e: '🌾', cut: 0.25, price: 25000 },
    { id: 'xanh', n: 'Phân hữu cơ', e: '💚', cut: 0.45, price: 60000 },
    { id: 'cao', n: 'Phân vi sinh', e: '✨', cut: 0.65, price: 150000 }
  ];
  const fertSum = (f) => FERTS.reduce((s, t) => s + (f.ferts[t.id] || 0), 0);
  function spendFert(f) {
    for (let i = 0; i < FERTS.length; i++) {
      const t = FERTS[i];
      if (f.ferts[t.id] > 0) { f.ferts[t.id]--; return t; }
    }
    return null;
  }
  const PESTS = ['🐛', '🐜', '🦗', '🐌', '🪲'];
  const GIFTS = [
    { id: 'tra', n: 'Trà Thái Nguyên', e: '🍵', price: 120000, close: 5 },
    { id: 'banh', n: 'Bánh đậu xanh', e: '🥮', price: 180000, close: 7 },
    { id: 'ruou', n: 'Rượu nếp cẩm', e: '🍶', price: 260000, close: 9 },
    { id: 'gio', n: 'Giỏ quà Tết', e: '🎁', price: 420000, close: 14 }
  ];
  const CUST_TRAITS = [
    { id: 'kho', n: 'Khó tính', d: 'soi hàng kỹ' },
    { id: 'de', n: 'Dễ chịu', d: 'ít kèo, dễ nói' },
    { id: 'songphang', n: 'Sòng phẳng', d: 'trả đúng hẹn' },
    { id: 'cham', n: 'Chậm tiền', d: 'hay ghi nợ' },
    { id: 'thichqua', n: 'Mê quà', d: 'có quà là vui' },
    { id: 're', n: 'Chuộng giá rẻ', d: 'đòi giá mềm' }
  ];
  const VISIT_LINES = [
    'Căn phòng gọn gàng, chè thơm đãi khách.',
    'Kể chuyện mùa vụ, cười cả buổi.',
    'Đang vá lại cái nón lá bị rách.',
    'Nhờ sửa giùm cái quạt, vui ra mặt.',
    'Bày tỏ mong muốn có thêm chỗ phơi đồ.',
    'Khoe tấm hình con trai mới vào lớp một.',
    'Than mưa dột góc giường, hứa sửa mái.',
    'Được hỏi thăm, hát nghêu ngao cả buổi.'
  ];
  function hashNum(s) { let h = 7; s = String(s || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 99991; return h; }
  function custTraits(c) {
    const h = hashNum(c.id || c.name);
    const a = CUST_TRAITS[h % CUST_TRAITS.length], b = CUST_TRAITS[(h * 7 + 3) % CUST_TRAITS.length];
    return a.id === b.id ? [a] : [a, b];
  }
  function custBday(c) {
    const h = hashNum(c.id || c.name);
    return ('0' + (1 + h % 12)).slice(-2) + '-' + ('0' + (1 + Math.floor(h / 12) % 28)).slice(-2);
  }
  function daysUntilMD(md) {
    const p = String(md || '').split('-');
    if (p.length !== 2) return 0;
    const d = new Date(), y = d.getFullYear();
    const today = new Date(y, d.getMonth(), d.getDate());
    let t = new Date(y, Math.round(p[0]) - 1, Math.round(p[1]));
    if (t < today) t = new Date(y + 1, Math.round(p[0]) - 1, Math.round(p[1]));
    return Math.round((t - today) / 864e5);
  }
  const MAX_PLOTS = 18, START_PLOTS = 6;
  const LAND_COST = (i) => i < 10 ? 400000 : i < 14 ? 1500000 : 4000000;
  const LAND_LVL = (i) => i < 8 ? 2 : i < 10 ? 3 : i < 12 ? 4 : i < 14 ? 5 : i < 16 ? 6 : 7;
  const BUILDINGS = {
    kho: { n: 'Kho lương thực', s: 'Kho', e: '🏚️', lvl: 1, max: 4, cost: [0, 1000000, 3000000, 8000000, 20000000], cap: [0, 60, 180, 450, 1000], d: 'Chứa nông sản thu về.' },
    nha: { n: 'Nhà công nhân', s: 'Nhà ở', e: '🏠', lvl: 2, max: 3, cost: [0, 2000000, 5000000, 12000000], slots: [0, 2, 4, 7], d: 'Chỗ ở cho công nhân, càng rộng tuyển càng đông.' },
    donggoi: { n: 'Khu đóng gói', s: 'Đóng gói', e: '📦', lvl: 2, max: 3, cost: [0, 1500000, 4000000, 10000000], mult: [0, 1, 1.8, 2.8], d: 'Cần có mới đóng gói được đơn hàng.' },
    giaohang: { n: 'Khu giao hàng', s: 'Giao hàng', e: '🚚', lvl: 3, max: 3, cost: [0, 1000000, 3000000, 8000000], d: 'Có xe mới giao đơn được, nâng cấp xe chạy nhanh hơn.' },
    cskh: { n: 'Phòng CSKH', s: 'CSKH', e: '🎧', lvl: 4, max: 1, cost: [0, 2500000], d: 'Trợ lý nhắc việc, giữ mối khách quen.' },
    ketoan: { n: 'Phòng kế toán', s: 'Kế toán', e: '📒', lvl: 5, max: 1, cost: [0, 2000000], d: 'Sổ sách rõ ràng, thanh tra không lo.' }
  };
  const LEVEL_TITLES = [[1, 'Vườn nhà'], [3, 'Trang trại nhỏ'], [5, 'Trang trại lớn'], [7, 'Hợp tác xã'], [9, 'Tổng công ty thu mua']];
  function levelTitle(lv) {
    let out = LEVEL_TITLES[0][1];
    for (let i = 0; i < LEVEL_TITLES.length; i++) if (lv >= LEVEL_TITLES[i][0]) out = LEVEL_TITLES[i][1];
    return out;
  }
  function bldLocked(f, key) { const b = BUILDINGS[key]; return !!b && (f.buildings[key] || 0) <= 0 && f.level < (b.lvl || 1); }
  const RETAIL = 0.85;

  // ---- thế giới nhìn từ trên: kéo được mọi hướng ----
  const TILE = 44;
  const WORLD_COLS = 20, WORLD_ROWS = 26;
  const WORLD_W = WORLD_COLS * TILE, WORLD_H = WORLD_ROWS * TILE;
  const BOUND = { c0: 0, r0: 2, c1: 19, r1: 25 };
  // vùng không được chen công trình: ruộng, ao, chợ làng, cổng, con đường
  const NO_BUILD = [
    { c0: 1, r0: 10, c1: 8, r1: 23 },
    { c0: 12, r0: 18, c1: 17, r1: 21 },
    { c0: 13, r0: 10, c1: 15, r1: 12 },
    { c0: 14, r0: 23, c1: 16, r1: 25 },
    { c0: 18, r0: 0, c1: 19, r1: 25 }
  ];
  const FOOT = { kho: [2, 2], nha: [2, 2], donggoi: [2, 2], giaohang: [2, 2], cskh: [1, 1], ketoan: [1, 1] };
  const HOME_POS = { kho: { c: 2, r: 2 }, donggoi: { c: 5, r: 2 }, cskh: { c: 4, r: 2 }, ketoan: { c: 4, r: 4 }, nha: { c: 2, r: 5 }, giaohang: { c: 5, r: 5 } };
  const PLOT_COLS = 3, PLOT_ROW = 11;
  const plotRect = (i) => ({ x: (2 + (i % PLOT_COLS) * 2) * TILE + 4, y: (PLOT_ROW + Math.floor(i / PLOT_COLS) * 2) * TILE + 4, w: 2 * TILE - 8, h: 2 * TILE - 8 });
  const plotCenter = (i) => { const r = plotRect(i); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; };
  const WALK = [{ x0: 430, x1: 800, y0: 340, y1: 1020 }, { x0: 80, x1: 780, y0: 1030, y1: 1090 }];
  const FIELD = { x0: 60, x1: 430, y0: 470, y1: 1030 };
  const WALK_SPEED = 62;
  const RIPEN_GRACE = 20000;
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
    if (!f.seeds || typeof f.seeds !== 'object') f.seeds = { rau: 4, ngo: 2, ca: 1, dua: 0 };
    CROPS.forEach(c => { if (typeof f.seeds[c.id] !== 'number' || f.seeds[c.id] < 0) f.seeds[c.id] = 0; });
    if (!f.ferts || typeof f.ferts !== 'object') f.ferts = { thuong: typeof f.fertBags === 'number' ? f.fertBags : 0, xanh: 0, cao: 0 };
    FERTS.forEach(t => { if (typeof f.ferts[t.id] !== 'number' || f.ferts[t.id] < 0) f.ferts[t.id] = 0; });
    if (typeof f.sprays !== 'number') f.sprays = 0;
    if (!Array.isArray(f.workers)) f.workers = [];
    f.workers.forEach(w => { if (!w.__pw) { w.__pw = true; if (typeof w.tx === 'number' && w.tx <= 100) { w.tx = null; w.ty = null; } } });
    if (!Array.isArray(f.orders)) f.orders = [];
    if (!Array.isArray(f.contracts)) f.contracts = [];
    f.contracts.forEach(c => {
      if (typeof c.close !== 'number') c.close = 45 + hashNum(c.id || c.name) % 25;
      if (!Array.isArray(c.traits) || !c.traits.length) c.traits = custTraits(c).map(t => t.id);
      if (!c.bday) c.bday = custBday(c);
      if (typeof c.since !== 'number') c.since = Date.now();
    });
    if (!f.gifts || typeof f.gifts !== 'object') f.gifts = {};
    GIFTS.forEach(g => { if (typeof f.gifts[g.id] !== 'number' || f.gifts[g.id] < 0) f.gifts[g.id] = 0; });
    if (!Array.isArray(f.visits)) f.visits = [];
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
    if (!f.buildingFace || typeof f.buildingFace !== 'object') f.buildingFace = {};
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
    if (c < BOUND.c0 || r < BOUND.r0 || c + fw - 1 > BOUND.c1 || r + fh - 1 > BOUND.r1) return false;
    if (NO_BUILD.some(z => c <= z.c1 && c + fw - 1 >= z.c0 && r <= z.r1 && r + fh - 1 >= z.r0)) return false;
    return !footprintBusy(f, key, c, r);
  }
  function bldFace(f, key) {
    const v = f.buildingFace && f.buildingFace[key];
    return typeof v === 'number' && v >= 0 && v < 4 ? v : 0;
  }
  function doorOf(f, key) {
    const p = bpos(f, key);
    if (!p) return null;
    const s = FOOT[key], face = bldFace(f, key);
    const cx = (p.c + s[0] / 2) * TILE, cy = (p.r + s[1] / 2) * TILE;
    if (face === 1) return { x: p.c * TILE + 8, y: cy };
    if (face === 2) return { x: cx, y: p.r * TILE + 10 };
    if (face === 3) return { x: (p.c + s[0]) * TILE - 8, y: cy };
    return { x: cx, y: (p.r + s[1]) * TILE - 10 };
  }

  // ===================== VƯỜN =====================
  let farmPick = 'rau';
  function plant(i, useFert, quiet) {
    const f = FM();
    if (i >= landCount(f)) return;
    if (f.plots[i]) return;
    const crop = cropOf(farmPick);
    let fert = false;
    if (useFert && fertSum(f) <= 0) { toast('Hết phân bón rồi, ghé Shop nhé.'); sfx('error'); return; }
    if ((f.seeds[crop.id] || 0) <= 0) { toast('Hết hạt ' + crop.n + ', mua thêm ở Shop nhé.'); sfx('error'); return; }
    f.seeds[crop.id]--;
    if (useFert) { spendFert(f); fert = true; }
    f.plots[i] = { crop: crop.id, at: Date.now(), watered: false, pest: Math.random() < 0.18, bug: PESTS[Math.floor(Math.random() * PESTS.length)], treated: false, fert: !!fert };
    if (Date.now() < f.__waterOffUntil) f.plots[i].pauseAt = Date.now();
    save(); if (!quiet) sfx('plant');
    render();
    if (!quiet) toast('🌱 Đã trồng ' + crop.n + (fert ? ' (có bón phân)' : ''));
  }
  function plotGrowTime(p) {
    const crop = cropOf(p.crop);
    return Math.round(crop.grow * (p.fert === true ? 0.65 : 1));
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
  function applyWater(p) {
    const remaining = Math.max(0, plotGrowTime(p) - plotElapsed(p));
    p.at -= Math.round(remaining * 0.2);
    p.watered = true;
  }
  function water(i) {
    const f = FM(), p = f.plots[i];
    if (!p || p.watered) return;
    if (Date.now() < f.__waterOffUntil) return toast('Đang cúp nước, chưa tưới được.');
    applyWater(p);
    save(); sfx('click'); render();
    toast('💧 Đã tưới, cây lớn nhanh hơn.');
  }
  function fertilize(i, kind) {
    const f = FM(), p = f.plots[i];
    if (!p) return;
    const t = FERTS.find(x => x.id === kind) || FERTS[0];
    if (p.fert) return toast('Luống này bón phân rồi.');
    if (plotElapsed(p) >= plotGrowTime(p)) return toast('Cây chín rồi, bón thêm cũng vậy thôi.');
    if ((f.ferts[t.id] || 0) <= 0) { toast('Hết ' + t.n.toLowerCase() + ' rồi, ghé Shop nhé.'); sfx('error'); return; }
    const left = Math.max(0, plotGrowTime(p) - plotElapsed(p));
    f.ferts[t.id]--;
    p.fert = t.id;
    p.at -= Math.round(left * t.cut);
    save(); sfx('buy'); render();
    toast(t.e + ' Bón ' + t.n.toLowerCase() + ', cây lớn nhanh hơn.');
  }
  function treat(i) {
    const f = FM(), p = f.plots[i];
    if (!p) return;
    if (p.treated) return toast('Luống này vừa xử lý thuốc rồi.');
    if (f.sprays <= 0) { toast('Hết thuốc trừ sâu, mua thêm ở Shop nhé.'); sfx('error'); return; }
    const had = p.pest && !p.treated;
    f.sprays--;
    p.treated = true;
    p.pest = false;
    save(); sfx('buy'); render();
    toast(had ? 'Đã phun thuốc, sạch sâu.' : 'Phun phòng trước, sâu khỏi bén mảng.');
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
    toast('🧺 ' + crop.n + ' vào kho ×' + qty + (bad ? ' (sâu ăn mất nửa)' : '')
      + (!f.buildings.donggoi ? ' · mang ra Chợ làng bán nhé' : ''));
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
  function buyItem(kind) {
    const f = FM();
    const crop = CROPS.find(c => c.id === kind);
    if (crop) {
      if (!pay(crop.seed * SEED_PACK)) return;
      f.seeds[crop.id] += SEED_PACK;
      save(); sfx('buy'); render();
      toast('Đã mua ' + SEED_PACK + ' hạt ' + crop.n + '.');
      return;
    }
    const ft = FERTS.find(t => 'fert_' + t.id === kind);
    if (ft) {
      if (!pay(ft.price)) return;
      f.ferts[ft.id] += 5;
      save(); sfx('buy'); render();
      toast('Đã mua 5 bao ' + ft.n.toLowerCase() + '.');
      return;
    }
    const gf = GIFTS.find(g => 'gift_' + g.id === kind);
    if (gf) {
      if (!pay(gf.price)) return;
      f.gifts[gf.id] += 1;
      save(); sfx('buy'); render();
      toast('Đã mua ' + gf.e + ' ' + gf.n + '.');
      return;
    }
    if (kind === 'fert') { if (!pay(FERTS[0].price)) return; f.ferts.thuong += 5; }
    else if (kind === 'spray') { if (!pay(50000)) return; f.sprays += 5; }
    else if (kind === 'irrig') {
      if (f.irrigate) return toast('Máy tưới đã lắp rồi.');
      if (!pay(3000000)) return;
      f.irrigate = true;
    }
    save(); sfx('buy'); render();
    toast('Đã mua xong!');
  }
  function retailUnit(f, id) {
    const crop = cropOf(id);
    const sea = (f.season[id] || { p: 1 }).p;
    return Math.max(1000, Math.round(crop.sell * sea * RETAIL / 1000) * 1000);
  }
  function sellCrop(id, all) {
    const f = FM(), crop = cropOf(id);
    const have = f.stock[id] || 0;
    if (have <= 0) { toast('Kho không còn ' + crop.n + ' để bán.'); sfx('error'); return; }
    const n = all ? have : 1;
    const unit = retailUnit(f, id);
    f.stock[id] -= n;
    addMoney(unit * n);
    addXp(Math.max(1, Math.round(n / 2)));
    save(); sfx('coin'); render();
    toast('🧺 Bán ' + n + crop.e + ' ' + crop.n + ' ở chợ · +' + money(unit * n));
  }

  // ===================== XÂY DỰNG =====================
  function build(key) {
    const f = FM(), b = BUILDINGS[key];
    if (!b) return;
    const lv = f.buildings[key];
    if (lv <= 0) {
      if (bldLocked(f, key)) { toast(b.n + ' mở khóa ở cấp ' + b.lvl + ', ráng lên nhé.'); sfx('error'); return; }
      startPlace(key); return;
    }
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
  const CHAT_WORK = {
    water: ['Tưới chút nước cho tươi nào.', 'Luống này khát nước rồi.', 'Nước mát ghê, cây sướng lắm.', 'Tưới xong cái là lá vểnh lên liền.'],
    spray: ['Có sâu! Phun ngay mới kịp.', 'Thuốc này mùi kỳ ghê.', 'Sâu gì mà lì thế không biết.', 'Phun cho sạch, khỏi lây luống bên.'],
    fert: ['Bón chút phân cho bõ công.', 'Mùi phân mà thơm là biết tay nghề rồi.', 'Bón xong cây lớn như thổi.', 'Đừng bón nhiều quá, cây ngộp đó.'],
    harvest: ['Chín rồi, hái thôi!', 'Luống này nặng trĩu luôn.', 'Bội thu bội thu!', 'Hái khéo kẻo dập.', 'Được mùa quá sếp ơi.'],
    boxed: ['Cất kho xong rồi sếp!', 'Kho còn chỗ, để vô đây.', 'Xếp gọn vô góc nha.'],
    full: ['Kho đầy rồi sếp ơi!', 'Chất đống ngoài à sếp?', 'Không còn chỗ, bán bớt đi!'],
    fetch: ['Bốc kiện này qua xưởng.', 'Kho còn ê hề, làm tới đi.', 'Đơn này gấp lắm rồi.', 'Vai đau quá mà lương thì...'],
    drop: ['Đóng gói tới luôn!', 'Xưởng nhận hàng nha.', 'Xong kiện nữa rồi.'],
    idleBox: ['Máy đóng gói rảnh quá.', 'Không có đơn buồn ghê.', 'Ngồi chơi nãy giờ rồi đó nha.']
  };
  const recentSays = [];
  function pickLine(w, pool) {
    const avail = pool.filter(l => l !== w.__lastSay && recentSays.indexOf(l) < 0);
    const line = pick(avail.length ? avail : pool);
    w.__lastSay = line;
    recentSays.push(line);
    if (recentSays.length > 6) recentSays.shift();
    return line;
  }
  function say(w, pool, now) {
    w.__say = typeof pool === 'string' ? pool : pickLine(w, pool);
    w.__sayUntil = now + 4500;
  }
  function assignWalk(w, x, y, now, spd) {
    const cx = w.tx != null ? w.tx : 640, cy = w.ty != null ? w.ty : 700;
    const d = Math.hypot(x - cx, y - cy);
    w.tx = Math.round(x); w.ty = Math.round(y);
    w.__dur = Math.max(0.7, Math.round(d / (spd || WALK_SPEED) * 10) / 10);
    w.__arrive = now + Math.round(d / (spd || WALK_SPEED) * 1000);
  }
  const ripenAge = (p, now) => plotElapsed(p, now) - plotGrowTime(p);

  function gardenJob(f, now) {
    for (let i = 0; i < landCount(f); i++) {
      const p = f.plots[i];
      if (p && ripenAge(p, now) >= RIPEN_GRACE && f.buildings.kho > 0) return { kind: 'harvest', plot: i };
    }
    if (f.sprays > 0) {
      for (let i = 0; i < landCount(f); i++) {
        const p = f.plots[i];
        if (p && p.pest && !p.treated && plotElapsed(p, now) >= plotGrowTime(p) * 0.5) return { kind: 'spray', plot: i };
      }
    }
    if (!f.irrigate && !(now < f.__waterOffUntil)) {
      for (let i = 0; i < landCount(f); i++) {
        const p = f.plots[i];
        if (p && !p.watered && plotElapsed(p, now) < plotGrowTime(p)) return { kind: 'water', plot: i };
      }
    }
    if (fertSum(f) > 0) {
      for (let i = 0; i < landCount(f); i++) {
        const p = f.plots[i];
        if (p && !p.fert && plotElapsed(p, now) < plotGrowTime(p) * 0.75) return { kind: 'fert', plot: i };
      }
    }
    return null;
  }
  function gardenerTick(f, w, now) {
    const j = w.__job;
    if (j && now < w.__arrive) return;
    if (j && j.phase === 'kho') {
      const c = w.__carry;
      if (c && stockTotal(f) + c.qty <= stockCap(f)) {
        f.stock[c.crop] += c.qty;
        taskBump('harvest', c.qty);
        addXp(c.qty);
        say(w, CHAT_WORK.boxed, now);
        w.__carry = null;
      } else if (c) {
        say(w, CHAT_WORK.full, now);
        w.__carryWait = now + 20000;
      }
      w.__job = null;
      return;
    }
    if (j && j.phase === 'go') {
      const p = f.plots[j.plot];
      if (!p) { w.__job = null; return; }
      const gt = plotGrowTime(p), el = plotElapsed(p, now);
      if (j.kind === 'harvest') {
        if (el < gt) { w.__job = null; return; }
        const crop = cropOf(p.crop);
        const bad = p.pest && !p.treated;
        const qty = bad ? 1 : (Math.random() < 0.3 ? 2 : 1);
        f.plots[j.plot] = null;
        w.__carry = { crop: crop.id, qty: qty };
        say(w, CHAT_WORK.harvest, now);
        const kp = doorOf(f, 'kho');
        if (!kp) { w.__job = null; w.__carry = null; return; }
        j.phase = 'kho';
        assignWalk(w, kp.x + rand(-12, 12), kp.y, now);
        return;
      }
      if (j.kind === 'water') {
        if (p.watered || now < f.__waterOffUntil) { w.__job = null; return; }
        applyWater(p);
        say(w, CHAT_WORK.water, now);
      } else if (j.kind === 'spray') {
        if (!p.pest || p.treated || f.sprays <= 0) { w.__job = null; return; }
        f.sprays--; p.treated = true; p.pest = false;
        say(w, CHAT_WORK.spray, now);
      } else if (j.kind === 'fert') {
        if (p.fert || el >= gt) { w.__job = null; return; }
        const left = Math.max(0, gt - el);
        const ft = spendFert(f);
        if (!ft) { w.__job = null; return; }
        p.fert = ft.id;
        p.at -= Math.round(left * ft.cut);
        say(w, CHAT_WORK.fert, now);
      }
      w.__job = null;
      w.__nextJob = now + rand(1200, 3200);
      return;
    }
    if (!w.__job) {
      if (w.__carry && now > (w.__carryWait || 0)) {
        const kp = doorOf(f, 'kho');
        if (kp) { w.__job = { kind: 'deliver', phase: 'kho' }; assignWalk(w, kp.x + rand(-12, 12), kp.y, now); return; }
        w.__carry = null;
      }
      if (now < (w.__nextJob || 0)) return;
      const job = w.__carry ? null : gardenJob(f, now);
      if (job) {
        const pc = plotCenter(job.plot);
        w.__job = { kind: job.kind, plot: job.plot, phase: 'go' };
        assignWalk(w, pc.x + rand(-10, 10), pc.y + 26, now);
        return;
      }
      if (!w.__nextWander || now > w.__nextWander) {
        const sp = Math.random() < 0.65 ? FIELD : WALK[0];
        assignWalk(w, rand(sp.x0, sp.x1), rand(sp.y0, sp.y1), now);
        w.__nextWander = now + rand(7000, 13000);
      }
    }
  }
  function packerTick(f, w, now) {
    const j = w.__job;
    if (j && now < w.__arrive) return;
    const strike = now < f.__strikeUntil || f.events.some(e => e.type === 'dinhcong' && !e.done);
    const busy = f.orders.some(o => o.state === 'pack') && f.buildings.donggoi > 0 && !(now < f.__powerOffUntil) && !strike;
    if (!busy) {
      if (w.__carryBox) w.__carryBox = false;
      w.__job = null;
      if (!w.__nextWander || now > w.__nextWander) {
        const dp = doorOf(f, 'donggoi');
        if (dp) {
          assignWalk(w, dp.x + rand(-30, 30), dp.y + rand(0, 30), now);
          w.__nextWander = now + rand(8000, 14000);
          if (Math.random() < 0.3) say(w, CHAT_WORK.idleBox, now);
        }
      }
      return;
    }
    if (!j) {
      if (now < (w.__nextFetch || 0)) return;
      const kp = doorOf(f, 'kho');
      if (!kp) { w.__job = null; return; }
      w.__job = { kind: 'fetch', phase: 'kho' };
      assignWalk(w, kp.x + rand(-14, 14), kp.y, now);
      return;
    }
    if (j.phase === 'kho') {
      const dp = doorOf(f, 'donggoi');
      if (!dp) { w.__job = null; return; }
      w.__carryBox = true;
      say(w, CHAT_WORK.fetch, now);
      j.phase = 'x';
      assignWalk(w, dp.x + rand(-14, 14), dp.y, now);
      return;
    }
    if (j.phase === 'x') {
      w.__carryBox = false;
      w.__job = null;
      w.__nextFetch = now + rand(1500, 3500);
      say(w, CHAT_WORK.drop, now);
    }
  }
  function workerTick(f, now) {
    const strike = now < f.__strikeUntil || f.events.some(e => e.type === 'dinhcong' && !e.done);
    f.workers.forEach(w => {
      if (w.__sayUntil && now > w.__sayUntil) { w.__say = null; w.__sayUntil = 0; }
      if (!strike) {
        if (w.role === 'donggoi') packerTick(f, w, now); else gardenerTick(f, w, now);
      }
      if (!w.__say && (!w.__nextSay || now > w.__nextSay)) {
        const chatty = w.quirk === 'tam' ? 0.6 : 1.6;
        say(w, CHATTER, now);
        w.__nextSay = now + rand(18, 40) * 1000 * chatty;
      }
    });
  }
  // AI làm việc: mỗi 3 giây một nhịp
  function workTick(f) {
    const strike = Date.now() < f.__strikeUntil || f.events.some(e => e.type === 'dinhcong' && !e.done);
    const packers = workersOf(f, 'donggoi');
    if (!packers.length || strike || Date.now() < f.__powerOffUntil) return;
    const o = f.orders.find(x => x.state === 'pack');
    if (!o) return;
    const spd = packers.reduce((s, w) => s + w.skill * quirkSpd(w) * (w.morale >= 40 ? 1 : 0.5), 0);
    o.prog += (100 / 240) * spd * (BUILDINGS.donggoi.mult[f.buildings.donggoi] || 1) * 3;
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
    if (c.giftDay === dayKey()) { toast('Hôm nay tặng rồi, ngày mai nha.'); sfx('error'); return; }
    const g = GIFTS.find(x => f.gifts[x.id] > 0);
    if (!g) { toast('Kho quà đang trống, mua thêm ở sạp nhé.'); sfx('error'); fgPanel = 'shop'; render(); return; }
    f.gifts[g.id]--;
    c.giftDay = dayKey();
    c.giftBoost = 3;
    c.close = Math.min(100, (c.close || 50) + g.close);
    save(); sfx('buy'); render();
    toast(g.e + ' ' + c.name + ' cười tươi, thân thiết hơn hẳn!');
  }
  function visitWorker(id) {
    const f = FM();
    const w = f.workers.find(x => x.id === id);
    if (!w) return;
    if (w.visitDay === dayKey()) { toast(w.name + ' hôm nay được ghé rồi.'); sfx('error'); return; }
    w.visitDay = dayKey();
    w.morale = Math.min(100, (w.morale ?? 70) + 8);
    const line = pick(VISIT_LINES);
    f.visits.unshift({ id: w.id, name: w.name, emoji: w.emoji, txt: line, at: Date.now() });
    f.visits = f.visits.slice(0, 20);
    save(); sfx('win'); render();
    toast('🏠 ' + w.name + ' vui ra mặt.');
  }
  // Đàm phán hợp đồng
  function negStart() {
    const f = FM();
    if (!f.buildings.cskh) { toast('Có phòng CSKH mới đi đàm phán hợp đồng được.'); sfx('error'); return; }
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
      customer.close = 50;
      customer.traits = custTraits(customer).map(t => t.id);
      customer.bday = custBday(customer);
      customer.since = Date.now();
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
  let plotSel = null;
  let bldSel = null, bldTab = null;
  let uiKey = '';
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
      if (f.buildings.donggoi > 0 && active < orderCap(f)) spawnWalkOrder(f);
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
    d.push('<div class="fg-road" style="left:' + (18 * TILE) + 'px"></div>');
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
    if (e.target.closest && e.target.closest('.fg-plotbar')) return;
    if (lift) {
      if (e.target.closest && e.target.closest('.fg-bld, .fg-placebar')) return;
      bldDone(); return;
    }
    stopInertia();
    moved = false;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, lx: e.clientX, ly: e.clientY, lt: performance.now(), vx: 0, vy: 0,
      bg: !(e.target.closest && e.target.closest('.fg-plot, .fg-bld, .fg-stall')) };
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
    if (!moved && d.bg && plotSel != null) { plotSel = null; render(); }
    setTimeout(() => { moved = false; }, 0);
  }
  let seedDrag = null, seedGhostEl = null;
  function plotAtPoint(clientX, clientY) {
    if (!camEl) return null;
    const box = camEl.getBoundingClientRect();
    const wx = clientX - box.left - cam.x, wy = clientY - box.top - cam.y;
    for (let i = 0; i < landCount(FM()); i++) {
      const r = plotRect(i);
      if (wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h) return i;
    }
    return null;
  }
  function seedGrab(e, cropId) {
    e.preventDefault(); e.stopPropagation();
    const f = FM();
    if ((f.seeds[cropId] || 0) <= 0) {
      toast('Hết hạt ' + cropOf(cropId).n + ', mở sạp mua thêm nhé.');
      sfx('error');
      plotSel = null; fgPanel = 'shop'; render();
      return;
    }
    seedDrag = { crop: cropId, ox: e.clientX, oy: e.clientY, moved: false, last: plotSel };
    seedGhostEl = document.createElement('div');
    seedGhostEl.className = 'fg-seed-ghost';
    seedGhostEl.textContent = cropOf(cropId).e;
    seedGhostEl.style.left = e.clientX + 'px';
    seedGhostEl.style.top = e.clientY + 'px';
    document.body.appendChild(seedGhostEl);
    window.addEventListener('pointermove', seedMove);
    window.addEventListener('pointerup', seedUp);
    window.addEventListener('pointercancel', seedUp);
  }
  function seedMove(e) {
    if (!seedDrag) return;
    if (Math.abs(e.clientX - seedDrag.ox) + Math.abs(e.clientY - seedDrag.oy) > 6) seedDrag.moved = true;
    if (seedGhostEl) { seedGhostEl.style.left = e.clientX + 'px'; seedGhostEl.style.top = e.clientY + 'px'; }
    if (!seedDrag.moved) return;
    const idx = plotAtPoint(e.clientX, e.clientY);
    if (idx == null || idx === seedDrag.last) return;
    seedDrag.last = idx;
    const f = FM();
    if (!f.plots[idx] && (f.seeds[seedDrag.crop] || 0) > 0) { farmPick = seedDrag.crop; plant(idx, false, true); }
  }
  function seedUp(e) {
    if (!seedDrag) return;
    const d = seedDrag;
    seedDrag = null;
    if (!d.moved) {
      if (plotSel != null) { farmPick = d.crop; plant(plotSel, false); }
    } else if (e) {
      const idx = plotAtPoint(e.clientX, e.clientY);
      if (idx != null && idx !== d.last) {
        const f = FM();
        if (!f.plots[idx] && (f.seeds[d.crop] || 0) > 0) { farmPick = d.crop; plant(idx, false, true); }
      }
    }
    if (seedGhostEl) { seedGhostEl.remove(); seedGhostEl = null; }
    window.removeEventListener('pointermove', seedMove);
    window.removeEventListener('pointerup', seedUp);
    window.removeEventListener('pointercancel', seedUp);
    render();
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
    place.c = Math.max(BOUND.c0, Math.min(BOUND.c1 - s[0] + 1, Math.round(wx / TILE - s[0] / 2)));
    place.r = Math.max(BOUND.r0, Math.min(BOUND.r1 - s[1] + 1, Math.round(wy / TILE - s[1] / 2)));
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
    if (lift) { lift = null; detachLift(); }
    if (bldLocked(f, key)) { toast(b.n + ' mở khóa ở cấp ' + b.lvl + ', ráng lên nhé.'); sfx('error'); return; }
    if (wallet() < b.cost[1]) { toast('Chưa đủ ' + money(b.cost[1]) + ' để xây ' + b.n + '.'); sfx('error'); return; }
    const s = FOOT[key];
    const vx = camEl ? (camEl.clientWidth / 2 - cam.x) / TILE : 5;
    const vy = camEl ? (camEl.clientHeight / 2 - cam.y) / TILE : 5;
    let spot = null, best = Infinity;
    for (let r = BOUND.r0; r <= BOUND.r1 - s[1] + 1; r++) {
      for (let c = BOUND.c0; c <= BOUND.c1 - s[0] + 1; c++) {
        if (!canPlace(f, key, c, r)) continue;
        const d = Math.pow(c + s[0] / 2 - vx, 2) + Math.pow(r + s[1] / 2 - vy, 2);
        if (d < best) { best = d; spot = { c: c, r: r }; }
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

  // ============ ĐÈ CÔNG TRÌNH: kê lên để dời / xoay hướng / tháo ============
  let lift = null, bldHold = null, bldTapBlock = 0;
  function bldTap(k) {
    if (Date.now() < bldTapBlock) return;
    if (lift) { bldDone(); return; }
    const f = FM();
    if (f.events.some(e => !e.done && e.target === k)) openPanel('events');
    else openBld(k);
  }
  function bldPress(e, k) {
    if (e.button > 0) return;
    if (lift && lift.k === k) { startLiftDrag(e); return; }
    if (lift) bldDone();
    endBldHold();
    bldHold = { k: k, sx: e.clientX, sy: e.clientY, id: e.pointerId, timer: 0 };
    bldHold.timer = setTimeout(() => {
      const h = bldHold;
      if (!h || h.k !== k) return;
      h.timer = 0;
      startLift(h);
    }, 420);
    window.addEventListener('pointermove', bldHoldMove);
    window.addEventListener('pointerup', bldHoldUp);
    window.addEventListener('pointercancel', bldHoldUp);
  }
  function bldHoldMove(e) {
    if (!bldHold || e.pointerId !== bldHold.id) return;
    if (Math.abs(e.clientX - bldHold.sx) + Math.abs(e.clientY - bldHold.sy) > 10) endBldHold();
  }
  function bldHoldUp(e) {
    if (!bldHold || (e && e.pointerId !== bldHold.id)) return;
    endBldHold();
  }
  function endBldHold() {
    if (!bldHold) return;
    if (bldHold.timer) clearTimeout(bldHold.timer);
    bldHold = null;
    window.removeEventListener('pointermove', bldHoldMove);
    window.removeEventListener('pointerup', bldHoldUp);
    window.removeEventListener('pointercancel', bldHoldUp);
  }
  function liftFoot() { return FOOT[lift.k]; }
  function startLift(h) {
    const f = FM(), p = bpos(f, h.k);
    if (!p) return;
    endBldHold();
    bldTapBlock = Date.now() + 700;
    lift = { k: h.k, c: p.c, r: p.r, from: { c: p.c, r: p.r }, ok: true, moved: false, hold: true, id: h.id, sx: h.sx, sy: h.sy, confirmRemove: false };
    drag = null;
    sfx('click');
    render();
    window.addEventListener('pointermove', liftDrag);
    window.addEventListener('pointerup', liftRelease);
    window.addEventListener('pointercancel', liftRelease);
  }
  function startLiftDrag(e) {
    if (!lift) return;
    lift.hold = true; lift.moved = false;
    lift.id = e.pointerId; lift.sx = e.clientX; lift.sy = e.clientY;
    window.addEventListener('pointermove', liftDrag);
    window.addEventListener('pointerup', liftRelease);
    window.addEventListener('pointercancel', liftRelease);
  }
  function liftDrag(e) {
    if (!lift || !lift.hold || e.pointerId !== lift.id) return;
    if (!lift.moved && Math.abs(e.clientX - lift.sx) + Math.abs(e.clientY - lift.sy) < 8) return;
    lift.moved = true;
    const f = FM(), s = liftFoot(), box = camEl.getBoundingClientRect();
    const wx = e.clientX - box.left - cam.x, wy = e.clientY - box.top - cam.y;
    const c = Math.max(BOUND.c0, Math.min(BOUND.c1 - s[0] + 1, Math.round(wx / TILE - s[0] / 2)));
    const r = Math.max(BOUND.r0, Math.min(BOUND.r1 - s[1] + 1, Math.round(wy / TILE - s[1] / 2)));
    if (c === lift.c && r === lift.r) return;
    lift.c = c; lift.r = r;
    lift.ok = canPlace(f, lift.k, c, r);
    const el = worldEl && worldEl.querySelector('.fg-bld[data-bld="' + lift.k + '"]');
    if (el) {
      el.style.left = c * TILE + 'px';
      el.style.top = r * TILE + 'px';
      el.style.zIndex = 100 + (r + s[1]) * TILE + 60;
      el.classList.toggle('bad', !lift.ok);
    }
    const tip = document.querySelector('.fg-placebar.edit .fg-place-t span');
    if (tip) tip.innerText = lift.ok ? 'thả ra để đặt ở đây' : 'chỗ này vướng, kéo chỗ khác';
  }
  function detachLift() {
    window.removeEventListener('pointermove', liftDrag);
    window.removeEventListener('pointerup', liftRelease);
    window.removeEventListener('pointercancel', liftRelease);
    if (lift) lift.hold = false;
  }
  function liftRelease(e) {
    if (!lift || (e && e.pointerId !== lift.id)) return;
    detachLift();
    if (!lift.moved) { render(); return; }
    if (lift.ok) {
      const f = FM(), key = lift.k;
      f.buildingPos[key] = { c: lift.c, r: lift.r };
      lift = null;
      save(); sfx('merge'); render();
      toast('Đã kê chỗ mới cho ' + BUILDINGS[key].n.toLowerCase() + '.');
      return;
    }
    lift.c = lift.from.c; lift.r = lift.from.r; lift.ok = true;
    sfx('error'); render();
    toast('Chỗ đó vướng, trả về chỗ cũ nhé.');
  }
  function bldRotate() {
    if (!lift) return;
    const f = FM();
    f.buildingFace[lift.k] = (bldFace(f, lift.k) + 1) % 4;
    save(); sfx('click'); render();
  }
  function bldRemove() {
    if (!lift) return;
    if (!lift.confirmRemove) { lift.confirmRemove = true; render(); return; }
    const f = FM(), k = lift.k, b = BUILDINGS[k], lv = f.buildings[k] || 0;
    let refund = 0;
    for (let i = 1; i <= lv; i++) refund += b.cost[i] || 0;
    f.buildings[k] = 0;
    delete f.buildingPos[k];
    f.workers.forEach(w => { if (w.__job === k) { w.__job = null; w.__carry = null; w.__carryBox = false; } });
    lift = null;
    if (refund) addMoney(refund);
    save(); sfx('coin'); render();
    toast('Đã tháo ' + b.n + (refund ? ', hoàn lại ' + money(refund) : '') + '.');
  }
  function bldDone() {
    if (!lift) return;
    const f = FM(), key = lift.k;
    if (lift.ok) f.buildingPos[key] = { c: lift.c, r: lift.r };
    lift = null;
    detachLift();
    save(); render();
  }

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
      + '<div class="fg-hud-t">🌾 Nông trại <b>Cấp ' + f.level + '</b> <i class="fg-hud-lv">' + levelTitle(f.level) + '</i></div>'
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
      const onLift = lift && lift.k === k;
      const at = onLift ? { c: lift.c, r: lift.r } : p;
      const z = 100 + (at.r + sz[1]) * TILE + (onLift ? 60 : 0);
      blds += '<button class="fg-bld' + (onLift ? ' lift' + (lift.ok ? '' : ' bad') : '') + '" data-bld="' + k + '"'
        + ' style="left:' + at.c * TILE + 'px;top:' + at.r * TILE + 'px;width:' + (sz[0] * TILE - 4) + 'px;height:' + (sz[1] * TILE - 4) + 'px;z-index:' + z + '"'
        + ' onpointerdown="FarmGame.bldPress(event,\'' + k + '\')" onclick="FarmGame.bldTap(\'' + k + '\')">'
        + '<span class="fg-bld-door f' + bldFace(f, k) + '"></span>'
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
        plots += '<button class="fg-plot empty" style="' + st + '" onclick="FarmGame.openPlot(' + i + ')">'
          + '<span class="fg-p-e">🌱</span><span class="fg-p-lb">Trồng</span></button>';
        continue;
      }
      const crop = cropOf(p.crop);
      const gt = plotGrowTime(p), el = plotElapsed(p, now);
      const ready = el >= gt;
      const pestVisible = p.pest && !p.treated && el >= gt * 0.5;
      const waterOff = f.__waterOffUntil && now < f.__waterOffUntil;
      const secs = Math.max(0, Math.ceil((gt - el) / 1000));
      const hint = ready ? '🧺 Thu'
        : secs >= 60 ? Math.floor(secs / 60) + ':' + ('0' + (secs % 60)).slice(-2)
          : secs + 's';
      plots += '<button class="fg-plot' + (ready ? ' ready' : '') + '" style="' + st + '" onclick="FarmGame.openPlot(' + i + ')">'
        + '<span class="fg-p-e">' + crop.e + '</span>'
        + (pestVisible ? '<span class="fg-pest" onclick="event.stopPropagation();FarmGame.sprayPlot(' + i + ')">' + (p.bug || '🐛') + '</span>' : '')
        + (!p.watered && !waterOff && !ready ? '<span class="fg-thirst">💧</span>' : '')
        + '<span class="fg-p-lb">' + hint + '</span></button>';
    }

    let plotbar = '';
    if (plotSel != null && plotSel < landCount(f) && !place) {
      const rct = plotRect(plotSel), cx = rct.x + rct.w / 2;
      const p = f.plots[plotSel];
      let items;
      if (!p) {
        items = CROPS.map(c => '<button class="fg-ps' + ((f.seeds[c.id] || 0) > 0 ? '' : ' off') + '"'
          + ' onpointerdown="FarmGame.seedGrab(event,\'' + c.id + '\')">'
          + '<span class="fg-ps-e">' + c.e + '</span><b>' + (f.seeds[c.id] || 0) + '</b></button>').join('');
      } else if (plotElapsed(p, now) >= plotGrowTime(p)) {
        items = '<button class="fg-ps" onclick="FarmGame.harvest(' + plotSel + ')"><span class="fg-ps-e">🧺</span></button>';
      } else {
        const waterOff = f.__waterOffUntil && now < f.__waterOffUntil;
        items = (p.watered ? '' : waterOff ? '<span class="fg-ps off"><span class="fg-ps-e">🚱</span></span>'
          : '<button class="fg-ps" onclick="FarmGame.water(' + plotSel + ')"><span class="fg-ps-e">💧</span></button>')
          + FERTS.map(t => '<button class="fg-ps' + ((p.fert || f.ferts[t.id] <= 0) ? ' off' : '') + '"'
            + ' onclick="FarmGame.fert(' + plotSel + ',\'' + t.id + '\')">'
            + '<span class="fg-ps-e">' + t.e + '</span><b>' + f.ferts[t.id] + '</b></button>').join('');
      }
      plotbar = '<div class="fg-plotbar" style="left:' + Math.round(cx) + 'px;top:' + (rct.y - 8) + 'px">' + items + '</div>';
    }

    let workers = '';
    f.workers.forEach(w => {
      const ev = pendingEvents.find(e => e.target === w.id);
      const x = w.tx != null ? w.tx : 640, y = w.ty != null ? w.ty : 700;
      const carry = w.__carry ? '<span class="fg-carry">' + cropOf(w.__carry.crop).e + '×' + w.__carry.qty + '</span>'
        : w.__carryBox ? '<span class="fg-carry">📦</span>' : '';
      workers += '<div class="fg-worker" data-worker="' + esc(w.id) + '" style="left:' + x + 'px;top:' + y + 'px;z-index:1400;">'
        + (ev ? '<button class="fg-warn w" onclick="FarmGame.open(\'events\')">⚠️</button>' : '')
        + (w.__say ? '<div class="fg-say">' + esc(w.__say) + '</div>' : '')
        + carry
        + '<span class="fg-w-e">' + w.emoji + '</span></div>';
    });

    const cp = bpos(f, 'cskh');
    const astLeft = (cp ? cp.c : 13) * TILE + 22;
    const astTop = (cp ? cp.r + 1 : 3) * TILE + 20;
    let assistant = '';
    if (f.buildings.cskh) {
      assistant = '<div class="fg-assistant" style="left:' + astLeft + 'px;top:' + astTop + 'px;z-index:1400;">'
        + (tip.txt ? '<div class="fg-say big">' + esc(tip.txt) + '</div>' : '')
        + '<span class="fg-w-e">🧑‍💼</span></div>';
    }

    const orderChips = openOrders.length ? openOrders.map(o => {
      const pr = o.state === 'pack' ? o.prog : (o.shipProg || 0);
      return '<button class="fg-ochip ' + o.state + '" onclick="FarmGame.open(\'orders\')">'
        + o.emoji + ' ' + esc(o.cust) + ' · ' + o.qty + cropOf(o.crop).e
        + '<i><b style="width:' + Math.min(100, Math.round(pr)) + '%"></b></i></button>';
    }).join('') : '';
    const orders = place || lift ? '' : orderChips;

    const bar = place ? ('<div class="fg-placebar">'
      + '<div class="fg-place-t"><b>' + BUILDINGS[place.key].e + ' ' + BUILDINGS[place.key].n + '</b>'
      + '<span>' + (place.ok ? 'chỗ trống, đặt được' : 'vướng rồi, kéo chỗ khác') + '</span></div>'
      + '<button class="fg-btn ghost" onclick="FarmGame.placeCancel()">Hủy</button>'
      + '<button class="fg-btn fg-place-ok' + (place.ok ? '' : ' off') + '"' + (place.ok ? '' : ' disabled') + ' onclick="FarmGame.placeConfirm()">Đặt · ' + bigMoney(BUILDINGS[place.key].cost[1]) + '</button>'
      + '</div>') : lift ? ('<div class="fg-placebar edit">'
        + '<div class="fg-place-t"><b>' + BUILDINGS[lift.k].e + ' ' + BUILDINGS[lift.k].n + '</b>'
        + '<span>' + (lift.hold ? 'kê lên rồi, kéo tới chỗ mới' : 'kéo công trình để dời chỗ · xoay hướng · tháo') + '</span></div>'
        + '<div class="fg-edit-a">'
        + '<button class="fg-btn ghost" onclick="FarmGame.bldRotate()">↻ Xoay</button>'
        + '<button class="fg-btn danger' + (lift.confirmRemove ? ' hot' : '') + '" onclick="FarmGame.bldRemove()">' + (lift.confirmRemove ? 'Bấm lại để tháo' : '🗑 Tháo') + '</button>'
        + '<button class="fg-btn" onclick="FarmGame.bldDone()">✓ Xong</button>'
        + '</div></div>') : '';

    const set = (sel, html) => { const el = root.querySelector(sel); if (el) el.innerHTML = html; };
    set('.fg-hud', hud);
    set('.fg-tools', tools);
    set('.fg-orders', orders);
    set('.fg-placebar', bar);
    set('.fg-blds', blds);
    set('.fg-plots', plots);
    set('.fg-bar-slot', plotbar);
    if (plotSel != null && !place && worldEl) {
      const barEl = worldEl.querySelector('.fg-plotbar');
      const camW = camEl ? camEl.clientWidth : 0;
      if (barEl && camW) {
        const bw = barEl.offsetWidth, rct = plotRect(plotSel);
        if (bw && bw < camW - 16) {
          const want = cam.x + rct.x + rct.w / 2 - bw / 2;
          const left = Math.max(8, Math.min(camW - 8 - bw, want));
          if (Math.abs(left - want) > 0.5) barEl.style.left = Math.round(left - cam.x + bw / 2) + 'px';
        }
      }
    }

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
      node.style.zIndex = 1400;
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
      const key = [fgPanel, bldSel, bldTab, neg ? 'n' : '', plotSel == null ? '' : plotSel].join('|');
      if (!nextHtml) { host.innerHTML = ''; uiKey = ''; }
      else if (oldSheet) {
        const body = oldSheet.querySelector('.fg-body') || oldSheet;
        const sc = key === uiKey ? body.scrollTop : 0;
        uiKey = key;
        const wrap = document.createElement('div');
        wrap.innerHTML = nextHtml;
        oldSheet.innerHTML = wrap.querySelector('.fg-sheet').innerHTML;
        (oldSheet.querySelector('.fg-body') || oldSheet).scrollTop = sc;
      } else { uiKey = key; host.innerHTML = nextHtml; }
    }

    requestAnimationFrame(() => {
      f.workers.forEach(w => {
        const el = yard && yard.querySelector('[data-worker="' + w.id + '"]');
        if (!el) return;
        const x = w.tx != null ? w.tx : 640;
        el.style.left = x + 'px';
        el.style.top = (w.ty != null ? w.ty : 700) + 'px';
        el.style.transitionDuration = (w.__dur || 1.6) + 's';
        el.classList.toggle('flip', x < (w.__px != null ? w.__px : x));
        w.__px = x;
      });
    });
  }

  // ===================== BẢNG CÔNG TRÌNH =====================
  const BLD_TABS = {
    kho: [['san', '🌾 Nông sản'], ['vat', '🧰 Vật tư'], ['qua', '🎁 Quà tặng']],
    nha: [['o', '🛏 Đang ở'], ['tham', '📖 Nhật ký']],
    cskh: [['khach', '🤝 Khách quen'], ['nhac', '📅 Nhắc việc']],
    ketoan: [['so', '📒 Sổ sách']],
    donggoi: [['info', '📦 Xưởng']],
    giaohang: [['info', '🚚 Giao hàng']]
  };
  const roleName = (r) => r === 'vuon' ? 'Làm vườn' : 'Đóng gói';
  function agoText(at) {
    const s = Math.max(0, Math.round((Date.now() - at) / 1000));
    if (s < 15) return 'vừa xong';
    if (s < 60) return s + ' giây';
    if (s < 3600) return Math.round(s / 60) + ' phút';
    if (s < 86400) return Math.round(s / 3600) + ' giờ';
    return Math.round(s / 86400) + ' ngày';
  }
  function openPanel(p) {
    if (lift) { lift = null; detachLift(); }
    place = null; plotSel = null; fgPanel = p; sfx('click'); render();
  }
  function openBld(k) {
    const f = FM();
    if (!f.buildings[k]) return openPanel('build');
    bldSel = k;
    bldTab = (BLD_TABS[k] || [['info', 'Thông tin']])[0][0];
    openPanel('bld');
  }
  function bldHead(f, key) {
    const b = BUILDINGS[key], lv = f.buildings[key], full = lv >= b.max;
    const extra = key === 'kho' ? 'chứa ' + stockCap(f) + ' món'
      : key === 'nha' ? 'chỗ ở ' + workerSlots(f) + ' người'
        : key === 'donggoi' ? 'tốc độ ×' + (b.mult[lv] || 1)
          : key === 'giaohang' ? 'đơn tối đa ' + orderCap(f)
            : key === 'cskh' ? 'khách quen ' + f.contracts.length : 'thu hôm nay ' + bigMoney(f.ledger.in);
    return '<div class="fg-bld-top"><div class="fg-bld-title"><b>' + b.e + ' ' + b.n + '</b></div>'
      + '<span class="fg-tag">Cấp ' + lv + '</span></div>'
      + '<div class="fg-bld-sub"><span class="fg-sub">' + extra + '</span>'
      + (full ? '<b class="fg-done">Tối đa</b>'
        : '<button class="fg-btn" onclick="FarmGame.build(\'' + key + '\')">Nâng cấp · ' + bigMoney(b.cost[lv + 1]) + '</button>')
      + '</div>';
  }
  function khoTab(f, tab) {
    if (tab === 'vat') {
      const seedTiles = CROPS.map(c => '<div class="fg-cell' + ((f.seeds[c.id] || 0) ? '' : ' off') + '">'
        + '<b class="fg-cell-b">' + (f.seeds[c.id] || 0) + '</b>'
        + '<span class="fg-cell-e">' + c.e + '</span><b class="fg-cell-n">Hạt ' + c.n + '</b>'
        + '<span class="fg-cell-s">1 hạt · 1 luống</span></div>').join('');
      const fertTiles = FERTS.map(t => '<div class="fg-cell' + ((f.ferts[t.id] || 0) ? '' : ' off') + '">'
        + '<b class="fg-cell-b">' + (f.ferts[t.id] || 0) + '</b>'
        + '<span class="fg-cell-e">' + t.e + '</span><b class="fg-cell-n">' + t.n + '</b>'
        + '<span class="fg-cell-s">bớt ' + Math.round(t.cut * 100) + '% giờ lớn</span></div>').join('');
      const toolTiles = '<div class="fg-cell' + (f.sprays ? '' : ' off') + '">'
        + '<b class="fg-cell-b">' + f.sprays + '</b><span class="fg-cell-e">🧪</span>'
        + '<b class="fg-cell-n">Thuốc sâu</b><span class="fg-cell-s">cứu luống bị sâu</span></div>'
        + '<div class="fg-cell' + (f.irrigate ? '' : ' off') + '">'
        + '<span class="fg-cell-e">💦</span><b class="fg-cell-n">Máy tưới</b>'
        + '<span class="fg-cell-s">' + (f.irrigate ? 'đã lắp' : 'chưa có') + '</span></div>';
      return '<div class="fg-sec">Hạt giống</div><div class="fg-grid">' + seedTiles + '</div>'
        + '<div class="fg-sec">Phân bón</div><div class="fg-grid">' + fertTiles + '</div>'
        + '<div class="fg-sec">Vật tư</div><div class="fg-grid">' + toolTiles + '</div>'
        + '<div class="fg-note">Mua thêm ở sạp hàng, hàng mua về nằm ngay trong kho này.</div>';
    }
    if (tab === 'qua') {
      const tiles = GIFTS.map(g => '<div class="fg-cell' + ((f.gifts[g.id] || 0) ? '' : ' off') + '">'
        + '<b class="fg-cell-b">' + (f.gifts[g.id] || 0) + '</b>'
        + '<span class="fg-cell-e">' + g.e + '</span><b class="fg-cell-n">' + g.n + '</b>'
        + '<span class="fg-cell-s">+' + g.close + ' thân thiết</span></div>').join('');
      return '<div class="fg-sec">Quà trong kho</div><div class="fg-grid">' + tiles + '</div>'
        + '<div class="fg-note">Mua quà ở sạp hàng, đem tặng khách quen ở phòng CSKH.</div>';
    }
    const total = stockTotal(f), cap = Math.max(1, stockCap(f));
    const tiles = CROPS.map(c => {
      return '<div class="fg-cell' + ((f.stock[c.id] || 0) ? '' : ' off') + '">'
        + '<b class="fg-cell-b">' + (f.stock[c.id] || 0) + '</b>'
        + '<span class="fg-cell-e">' + c.e + '</span><b class="fg-cell-n">' + c.n + '</b>'
        + '<span class="fg-cell-s">chợ ' + bigMoney(retailUnit(f, c.id)) + '</span></div>';
    }).join('');
    return '<div class="fg-row"><span>Sức chứa</span>'
      + '<span class="fg-prog"><i style="width:' + Math.min(100, Math.round(total / cap * 100)) + '%"></i></span>'
      + '<span class="fg-sub">' + total + '/' + cap + '</span></div>'
      + '<div class="fg-sec">Nông sản trong kho</div><div class="fg-grid">' + tiles + '</div>'
      + '<div class="fg-note">Thu hoạch xong hàng về đây. Bán lẻ ở Chợ làng, có khu đóng gói thì nhận đơn sỉ giá cao hơn.</div>';
  }
  function nhaTab(f, tab) {
    if (tab === 'tham') {
      const rows = f.workers.length ? f.workers.map(w => {
        const done = w.visitDay === dayKey();
        return '<div class="fg-row"><span>' + w.emoji + ' ' + esc(w.name) + '</span><span class="fg-sub">' + (w.morale ?? 70) + '♥</span>'
          + (done ? '<b class="fg-done">Hôm nay ghé rồi</b>'
            : '<button class="fg-btn" onclick="FarmGame.visitWorker(\'' + w.id + '\')">Ghé thăm</button>') + '</div>';
      }).join('') : '<div class="fg-note">Chưa có ai ở.</div>';
      const log = f.visits.length ? f.visits.map(v => '<div class="fg-visit"><span>' + v.emoji + '</span><div><b>' + esc(v.name) + '</b> · ' + agoText(v.at) + ' trước'
        + '<div>' + esc(v.txt) + '</div></div></div>').join('') : '<div class="fg-note">Chưa ghé thăm ai.</div>';
      return '<div class="fg-sec">Phòng đang ở</div>' + rows + '<div class="fg-sec">Nhật ký ghé thăm</div>' + log;
    }
    const cap = workerSlots(f);
    const head = '<div class="fg-row"><span>Chỗ ở</span><span class="fg-sub">' + f.workers.length + '/' + cap + ' người</span></div>';
    const list = f.workers.length ? f.workers.map(w => '<div class="fg-row"><span>' + w.emoji + ' ' + esc(w.name) + '</span>'
      + '<span class="fg-sub">' + roleName(w.role) + ' · tay nghề ×' + w.skill.toFixed(2) + ' · ' + money(w.wage) + '/ngày</span>'
      + '<b class="fg-done">' + (w.morale ?? 70) + '♥</b></div>').join('')
      : '<div class="fg-note">Nhà trống, tuyển người về cho vui.</div>';
    return head + list + '<div class="fg-note">Ghé thăm mỗi người mỗi ngày để tăng tinh thần làm việc.</div>';
  }
  function cskhTab(f, tab) {
    if (!f.contracts.length) {
      return '<div class="fg-note">Chưa có khách quen. Vào 📋 Đơn hàng, bấm “Đi tìm khách kí hợp đồng” nhé.</div>';
    }
    if (tab === 'nhac') {
      const sorted = f.contracts.slice().sort((a, b) => daysUntilMD(a.bday) - daysUntilMD(b.bday));
      const dates = sorted.map(c => {
        const d = daysUntilMD(c.bday);
        return '<div class="fg-row"><span>🎂 ' + esc(c.name) + '</span><span class="fg-sub">' + c.bday.split('-').reverse().join('/')
          + ' · ' + (d === 0 ? 'hôm nay 🎉' : 'còn ' + d + ' ngày') + '</span></div>';
      }).join('');
      const care = f.contracts.filter(c => (c.close || 0) < 60 || !c.lastOrderDay).map(c => {
        const why = (c.close || 0) < 60 ? 'thân thiết mới ' + c.close + '/100' : 'lâu rồi chưa đặt đơn';
        return '<div class="fg-row"><span>' + c.emoji + ' ' + esc(c.name) + '</span><span class="fg-sub">' + why + '</span>'
          + '<span class="fg-sub">' + (c.giftDay === dayKey() ? 'đã tặng hôm nay' : 'nên tặng quà') + '</span></div>';
      }).join('');
      return '<div class="fg-sec">Ngày quan trọng</div>' + dates
        + '<div class="fg-sec">Nên chăm sóc</div>' + (care || '<div class="fg-note">Khách nào cũng đang vui.</div>');
    }
    const rows = f.contracts.map(c => {
      const chips = (c.traits || []).map(id => {
        const t = CUST_TRAITS.find(x => x.id === id);
        return t ? '<span class="fg-chip" title="' + esc(t.d) + '">' + t.n + '</span>' : '';
      }).join('');
      const g = GIFTS.find(x => f.gifts[x.id] > 0);
      const gifted = c.giftDay === dayKey();
      const giftBtn = gifted ? '<b class="fg-done">Đã tặng hôm nay</b>'
        : '<button class="fg-btn' + (g ? '' : ' ghost') + '" onclick="FarmGame.gift(\'' + c.id + '\')">'
          + (g ? g.e + ' Tặng' : '🎁 Mua quà') + '</button>';
      const d = daysUntilMD(c.bday);
      return '<div class="fg-cust"><div class="fg-cv-top"><span class="fg-cv-e">' + c.emoji + '</span>'
        + '<b>' + esc(c.name) + '</b><span class="fg-tag">hợp đồng ×' + c.ceil.toFixed(2) + '</span></div>'
        + '<div class="fg-chips">' + chips + '</div>'
        + '<div class="fg-metric"><span class="fg-sub">Thân thiết</span>'
        + '<span class="fg-prog"><i style="width:' + Math.max(0, Math.min(100, c.close || 0)) + '%"></i></span>'
        + '<span class="fg-sub">' + (c.close || 0) + '/100</span></div>'
        + '<div class="fg-metric"><span class="fg-sub">🎂 ' + c.bday.split('-').reverse().join('/') + ' · ' + (d === 0 ? 'hôm nay 🎉' : 'còn ' + d + ' ngày') + '</span>'
        + (c.giftBoost > 0 ? '<span class="fg-sub">đơn tới +12%</span>' : '') + '</div>'
        + '<div class="fg-cust-act">' + giftBtn + '</div></div>';
    }).join('');
    return rows + '<div class="fg-note">Khách càng thân, đơn càng dày. Mua quà trong kho quà tặng của Kho.</div>';
  }
  function infoTab(f, key) {
    if (key === 'donggoi') {
      return '<div class="fg-row"><span>Tốc độ đóng gói</span><b class="fg-money">×' + (BUILDINGS.donggoi.mult[f.buildings.donggoi] || 1) + '</b></div>'
        + '<div class="fg-note">Đơn nhận xong bấm đóng gói ở mục 📋; có công nhân thì tụi nó tự làm.</div>';
    }
    if (key === 'giaohang') {
      return '<div class="fg-row"><span>Đơn tối đa cùng lúc</span><b class="fg-money">' + orderCap(f) + '</b></div>'
        + '<div class="fg-note">Xe chạy đơn đã đóng gói. Nâng cấp khu để nhận được nhiều đơn hơn.</div>';
    }
    if (key === 'ketoan') {
      return '<div class="fg-sec">📒 Sổ sách hôm nay</div>'
        + '<div class="fg-row"><span>Thu</span><b class="fg-money">' + money(f.ledger.in) + '</b></div>'
        + '<div class="fg-row"><span>Chi</span><b class="fg-money out">' + money(f.ledger.out) + '</b></div>'
        + (f.ledgerHist.length ? '<div class="fg-note">' + f.ledgerHist.slice(0, 4).map(h => h.day.slice(5) + ': thu ' + money(h.in) + ' · chi ' + money(h.out)).join('<br>') + '</div>' : '');
    }
    return '';
  }

  function modalHtml(f, now) {
    if (!fgPanel) return '';
    let inner = '';
    if (fgPanel === 'shop') {
      const seedTiles = CROPS.map(c => '<button class="fg-cell" onclick="FarmGame.buyItem(\'' + c.id + '\')">'
        + '<b class="fg-cell-b">' + (f.seeds[c.id] || 0) + '</b>'
        + '<span class="fg-cell-e">' + c.e + '</span>'
        + '<b class="fg-cell-n">Hạt ' + c.n + '</b>'
        + '<span class="fg-cell-s">chín ' + (c.grow / 60000) + ' phút</span>'
        + '<span class="fg-cell-p">×' + SEED_PACK + ' · ' + bigMoney(c.seed * SEED_PACK) + '</span></button>').join('');
      const fertTiles = FERTS.map(t => '<button class="fg-cell" onclick="FarmGame.buyItem(\'fert_' + t.id + '\')">'
        + '<b class="fg-cell-b">' + (f.ferts[t.id] || 0) + '</b>'
        + '<span class="fg-cell-e">' + t.e + '</span>'
        + '<b class="fg-cell-n">' + t.n + '</b>'
        + '<span class="fg-cell-s">bớt ' + Math.round(t.cut * 100) + '% thời gian</span>'
        + '<span class="fg-cell-p">×5 · ' + bigMoney(t.price) + '</span></button>').join('');
      const giftTiles = GIFTS.map(g => '<button class="fg-cell" onclick="FarmGame.buyItem(\'gift_' + g.id + '\')">'
        + '<b class="fg-cell-b">' + (f.gifts[g.id] || 0) + '</b>'
        + '<span class="fg-cell-e">' + g.e + '</span>'
        + '<b class="fg-cell-n">' + g.n + '</b>'
        + '<span class="fg-cell-s">+' + g.close + ' thân thiết</span>'
        + '<span class="fg-cell-p">' + bigMoney(g.price) + '</span></button>').join('');
      const toolTiles = '<button class="fg-cell" onclick="FarmGame.buyItem(\'spray\')">'
        + '<b class="fg-cell-b">' + f.sprays + '</b><span class="fg-cell-e">🧪</span>'
        + '<b class="fg-cell-n">Thuốc trừ sâu</b><span class="fg-cell-s">cứu luống bị sâu</span>'
        + '<span class="fg-cell-p">×5 · ' + bigMoney(50000) + '</span></button>'
        + '<button class="fg-cell" onclick="FarmGame.buyItem(\'irrig\')">'
        + '<span class="fg-cell-e">💦</span><b class="fg-cell-n">Máy tưới</b>'
        + '<span class="fg-cell-s">tưới cả vườn</span>'
        + '<span class="fg-cell-p' + (f.irrigate ? ' on' : '') + '">' + (f.irrigate ? 'Đã lắp ✓' : bigMoney(3000000)) + '</span></button>';
      inner = '<div class="fg-h">🛒 Sạp hàng</div>'
        + '<div class="fg-sec">Hạt giống</div><div class="fg-grid">' + seedTiles + '</div>'
        + '<div class="fg-sec">Phân bón</div><div class="fg-grid">' + fertTiles + '</div>'
        + '<div class="fg-sec">Vật tư</div><div class="fg-grid">' + toolTiles + '</div>'
        + '<div class="fg-sec">Quà tặng khách</div><div class="fg-grid">' + giftTiles + '</div>'
        + '<div class="fg-note">Chạm ô để mua. Hàng mua về nằm trong kho. Luống đất mới thì chạm ô khóa trên vườn.</div>';
    } else if (fgPanel === 'bld' && bldSel && BUILDINGS[bldSel]) {
      const tabs = BLD_TABS[bldSel] || [['info', 'Thông tin']];
      const active = tabs.some(t => t[0] === bldTab) ? bldTab : tabs[0][0];
      let body = '';
      if (bldSel === 'kho') body = khoTab(f, active);
      else if (bldSel === 'nha') body = nhaTab(f, active);
      else if (bldSel === 'cskh') body = cskhTab(f, active);
      else body = infoTab(f, bldSel);
      inner = bldHead(f, bldSel)
        + (tabs.length > 1 ? '<div class="fg-tabs">' + tabs.map(t => '<button class="fg-tb' + (t[0] === active ? ' on' : '') + '"'
          + ' onclick="FarmGame.bldTabSet(\'' + t[0] + '\')">' + t[1] + '</button>').join('') + '</div>' : '')
        + body;
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
        + (c.giftDay === dayKey() ? '<b class="fg-done">Đã tặng quà 🎁</b>'
          : f.buildings.cskh ? '<button class="fg-btn ghost" onclick="FarmGame.openBld(\'cskh\')">🎁 Quà</button>' : '') + '</div>').join('');
      inner = '<div class="fg-h">📋 Đơn hàng</div>'
        + '<div class="fg-sec">Khách tự tìm đến · ' + offers.length + ' đơn chờ nhận</div>'
        + (offers.length ? offers.map(o => '<div class="fg-row"><span>' + o.emoji + ' ' + esc(o.cust) + ' cần ' + o.qty + cropOf(o.crop).e + ' ' + cropOf(o.crop).n + '</span><span class="fg-sub">' + money(o.qty * o.price) + '</span>'
          + (f.buildings.donggoi ? '<button class="fg-btn" onclick="FarmGame.accept(\'' + o.id + '\')">Nhận đơn</button>' : '<b class="fg-done">🔒 Cần khu đóng gói</b>') + '</div>').join('')
          + (f.buildings.donggoi ? '' : '<div class="fg-note">Xây Khu đóng gói ở cấp ' + BUILDINGS.donggoi.lvl + ' mới nhận đơn sỉ được. Giờ mang hàng ra Chợ làng bán lẻ nhé.</div>')
          : '<div class="fg-note">' + (f.buildings.donggoi ? 'Chưa có khách lạ nào ghé.' : 'Chưa có khu đóng gói nên chưa nhận đơn sỉ được. Mang hàng ra Chợ làng bán lẻ trước nhé.') + '</div>')
        + '<div class="fg-sec">Đang làm · ' + doing.length + ' đơn</div>'
        + (doing.length ? doing.map(o => {
          const pr = o.state === 'pack' ? o.prog : (o.shipProg || 0);
          return '<div class="fg-row"><span>' + o.emoji + ' ' + esc(o.cust) + ' · ' + o.qty + cropOf(o.crop).e + '</span>'
            + '<span class="fg-prog"><i style="width:' + Math.min(100, Math.round(pr)) + '%"></i></span>'
            + (o.state === 'pack' ? '<button class="fg-btn" onclick="FarmGame.packClick(\'' + o.id + '\')">📦 Đóng gói</button>' : '<b class="fg-done">🚚 Đang giao</b>') + '</div>';
        }).join('') : '<div class="fg-note">Nhận đơn rồi đóng gói tại đây, có công nhân thì tụi nó lo.</div>')
        + '<div class="fg-sec">Khách hợp đồng · ' + f.contracts.length + '</div>'
        + (contracts || '<div class="fg-note">Chưa ai kí hợp đồng dài hạn.</div>')
        + (f.buildings.cskh ? '<button class="fg-btn wide" onclick="FarmGame.negStart()">✍️ Đi tìm khách kí hợp đồng</button>'
          : '<div class="fg-note">🔒 Ký hợp đồng sỉ mở khi có Phòng CSKH (cấp ' + BUILDINGS.cskh.lvl + ').</div>');
    } else if (fgPanel === 'hire') {
      const cvs = f.candidates.map(c => '<div class="fg-cv"><div class="fg-cv-top"><span class="fg-cv-e">' + c.emoji + '</span><b>' + esc(c.name) + '</b><span class="fg-tag">' + (c.role === 'vuon' ? 'Làm vườn' : 'Đóng gói') + '</span></div>'
        + '<div class="fg-cv-body">Tay nghề ×' + c.skill.toFixed(2) + ' · Lương ' + money(c.wage) + '/ngày<br>' + c.quirkN + ' — ' + c.quirkD + '</div>'
        + '<button class="fg-btn" onclick="FarmGame.hire(\'' + c.id + '\')">🤝 Tuyển</button></div>').join('');
      inner = '<div class="fg-h">👷 Tuyển công nhân · chỗ trống ' + Math.max(0, workerSlots(f) - f.workers.length) + '</div>'
        + (workerSlots(f) <= 0 ? '<div class="fg-note">Xây Nhà công nhân trước đã nhé.</div>' : cvs)
        + (f.workers.length ? '<div class="fg-sec">Đội ngũ hiện tại</div>' + f.workers.map(w => '<div class="fg-row"><span>' + w.emoji + ' ' + esc(w.name) + ' · ' + (w.role === 'vuon' ? 'Làm vườn' : 'Đóng gói') + '</span><span class="fg-sub">' + money(w.wage) + '/ngày · ' + w.morale + '♥</span><button class="fg-btn danger" onclick="FarmGame.fire(\'' + w.id + '\')">Cho nghỉ</button></div>').join('') : '');
    } else if (fgPanel === 'build') {
      const order = Object.keys(BUILDINGS).sort((a, b) => BUILDINGS[a].lvl - BUILDINGS[b].lvl || BUILDINGS[a].cost[1] - BUILDINGS[b].cost[1]);
      const rows = order.map(k => {
        const b = BUILDINGS[k], lv = f.buildings[k];
        if (bldLocked(f, k)) {
          return '<div class="fg-room locked"><div class="fg-room-top"><span class="fg-room-e">' + b.e + '</span>'
            + '<b>' + b.n + '</b><span class="fg-tag lock">🔒 Cấp ' + b.lvl + '</span></div>'
            + '<div class="fg-room-d">' + b.d + '</div></div>';
        }
        const full = lv >= b.max;
        const extra = k === 'kho' ? 'Sức chứa ' + stockCap(f)
          : k === 'nha' ? 'Chỗ ở ' + workerSlots(f) + ' người'
            : k === 'donggoi' ? 'Tốc độ ×' + (BUILDINGS.donggoi.mult[lv] || 0)
              : k === 'giaohang' ? 'Đơn tối đa ' + orderCap(f)
                : k === 'cskh' ? 'Khách quen ' + f.contracts.length : 'Thu hôm nay ' + bigMoney(f.ledger.in);
        return '<div class="fg-room"><div class="fg-room-top"><span class="fg-room-e">' + b.e + '</span><b>' + b.n + '</b>'
          + '<span class="fg-tag">Cấp ' + lv + '</span></div>'
          + '<div class="fg-room-d">' + b.d + ' · ' + extra + '</div>'
          + '<div class="fg-room-a">'
          + (full ? '<span></span><b class="fg-done">Đã tối đa cấp</b>'
            : '<span class="fg-sub">' + money(b.cost[lv + 1]) + '</span>'
            + '<button class="fg-btn" onclick="FarmGame.' + (lv === 0 ? 'startPlace' : 'build') + '(\'' + k + '\')">' + (lv === 0 ? '🏗 Chọn chỗ xây' : 'Nâng cấp') + '</button>')
          + '</div></div>';
      }).join('');
      const nextLocked = order.find(k => bldLocked(f, k));
      inner = '<div class="fg-h">🏗️ Xây dựng</div>'
        + '<div class="fg-note">Cấp ' + f.level + ' · ' + levelTitle(f.level) + ' · '
        + (nextLocked ? 'cấp ' + BUILDINGS[nextLocked].lvl + ' mở ' + BUILDINGS[nextLocked].n.toLowerCase() + '.'
          : 'trại đủ phòng rồi, lo làm ăn thôi.') + '</div>'
        + rows
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
        return '<div class="fg-row"><span>' + c.e + ' ' + c.n + '</span><span class="fg-sub">chợ ' + money(retailUnit(f, c.id)) + ' · ' + (chg >= 0 ? '▲' : '▼') + ' ' + Math.abs(chg) + '%</span></div>';
      }).join('');
      const sellTiles = CROPS.map(c => {
        const unit = retailUnit(f, c.id);
        const have = f.stock[c.id] || 0;
        return '<div class="fg-cell' + (have ? '' : ' off') + '">'
          + '<b class="fg-cell-b">' + have + '</b>'
          + '<span class="fg-cell-e">' + c.e + '</span><b class="fg-cell-n">' + c.n + '</b>'
          + '<span class="fg-cell-s">' + bigMoney(unit) + '/món</span>'
          + (have ? '<span class="fg-cell-a">'
            + '<button class="fg-mini" onclick="FarmGame.sellCrop(\'' + c.id + '\',0)">Bán 1</button>'
            + '<button class="fg-mini alt" onclick="FarmGame.sellCrop(\'' + c.id + '\',1)">Hết</button></span>' : '')
          + '</div>';
      }).join('');
      inner = '<div class="fg-h">🏪 Chợ làng</div>'
        + '<div class="fg-sec">Bán nông sản của mình</div><div class="fg-grid">' + sellTiles + '</div>'
        + '<div class="fg-note">Giá chợ thấp hơn hợp đồng sỉ một chút, nhưng bán là có tiền liền.</div>'
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
    return '<div class="fg-modal"><div class="fg-sheet"><div class="fg-body">' + inner
      + '</div><button class="fg-x" onclick="FarmGame.close()">✕</button></div></div>';
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
        + '<div class="fg-pad" style="left:0;top:0;width:' + WORLD_W + 'px;height:' + WORLD_H + 'px;"></div>'
        + '<div class="fg-blds"></div><div class="fg-plots"></div><div class="fg-bar-slot"></div><div class="fg-yard"></div>'
        + '</div></div>'
        + '<div class="fg-tools"></div><div class="fg-orders"></div><div class="fg-placebar"></div><div class="fg-modal-host"></div>';
      camEl = root.querySelector('.fg-cam');
      worldEl = root.querySelector('.fg-world');
      bindPtr();
      clampCam();
      centerOn(170, 300);
    }
    if (f.buildings.donggoi > 0 && !f.orders.length) spawnWalkOrder(f);
    f.workers.forEach(w => { w.__job = null; w.__carry = null; w.__carryBox = false; w.__arrive = 0; w.__dur = 0; });
    save();
    render();
    tickTimer = setInterval(tick, 1000);
  }
  function unmount() {
    mounted = false;
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
    stopInertia();
    drag = null; place = null; fgPanel = null; neg = null; plotSel = null;
    lift = null; endBldHold(); detachLift();
    seedDrag = null;
    if (seedGhostEl) { seedGhostEl.remove(); seedGhostEl = null; }
    window.removeEventListener('pointermove', seedMove);
    window.removeEventListener('pointerup', seedUp);
    window.removeEventListener('pointercancel', seedUp);
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
    open: openPanel,
    openBld,
    bldTabSet: (t) => { bldTab = t; sfx('click'); render(); },
    openPlot: (i) => {
      const f = FM();
      if (!(i < landCount(f))) return;
      const p = f.plots[i];
      if (p && plotElapsed(p) >= plotGrowTime(p)) { plotSel = null; harvest(i); return; }
      plotSel = plotSel === i ? null : i;
      place = null; fgPanel = null; sfx('click'); render();
    },
    sprayPlot: (i) => treat(i),
    seedGrab,
    close: () => { fgPanel = null; neg = null; plotSel = null; bldSel = null; render(); },
    pick: (id) => { farmPick = id; sfx('click'); render(); },
    plant, water, treat, fertilize, harvest, buyLand, buyItem, sellCrop, build,
    fert: fertilize,
    startPlace, placeConfirm, placeCancel,
    bldPress, bldTap, bldRotate, bldRemove, bldDone,
    hire, fire, accept: acceptOrder, packClick, gift, visitWorker,
    negStart, negTactic, negClose,
    resolve: resolveEvent, haggle, vBuy: villagerBuy, vDecline: villagerDecline,
    claim: claimTask,
    _debug: {
      FM, spawnWalkOrder, queueEvent, tick,
      canPlace: (key, c, r) => canPlace(FM(), key, c, r),
      face: (key) => bldFace(FM(), key),
      door: (key) => doorOf(FM(), key),
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
