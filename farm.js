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
  // ví riêng của nông trại: mọi khoản thu vào đây, rút về ví chính bằng tay
  const farmCash = (f) => Math.max(0, Math.round(Number((f || FM()).cash) || 0));
  const toast = (msg) => {
    let el = document.getElementById('fg-toast');
    if (!el) { el = document.createElement('div'); el.id = 'fg-toast'; el.className = 'play-toast'; document.body.appendChild(el); }
    el.innerText = msg; el.style.display = 'block';
    clearTimeout(el.__t);
    el.__t = setTimeout(() => { el.style.display = 'none'; }, 2600);
  };
  function addMoney(n, src) {
    const f = FM();
    n = Math.round(Number(n) || 0);
    if (!n) return;
    if (n > 0) {
      f.cash = farmCash(f) + n;
      f.ledger.in += n;
      const k = src === 'ban' || src === 'don' ? src : 'khac';
      f.ledger.src[k] = (f.ledger.src[k] || 0) + n;
    } else {
      const need = -n;
      const fromCash = Math.min(farmCash(f), need);
      const rest = need - fromCash;
      const fromMain = Math.min(wallet(), rest);
      f.cash = farmCash(f) - fromCash;
      if (fromMain > 0) S().walletBalance = Math.max(0, Math.round(wallet() - fromMain));
      f.ledger.out += fromCash + fromMain;
    }
    save();
    try { if (typeof window.renderLifeModeUI === 'function') window.renderLifeModeUI(); } catch (e) {}
  }
  function pay(n) {
    n = Math.round(Number(n) || 0);
    if (n <= 0) return true;
    if (farmCash() + wallet() < n) { toast('Không đủ tiền rồi.'); sfx('error'); return false; }
    addMoney(-n);
    return true;
  }
  function withdraw() {
    const f = FM(), amt = farmCash(f);
    if (!amt) { toast('Ví nông trại chưa có gì để rút.'); sfx('error'); return; }
    f.cash = 0;
    S().walletBalance = Math.round(wallet() + amt);
    save(); sfx('coin'); render();
    toast('Đã rút ' + money(amt) + ' về ví chính.');
    try { if (typeof window.renderLifeModeUI === 'function') window.renderLifeModeUI(); } catch (e) {}
  }

  // ===================== DỮ LIỆU =====================
  const CROPS = [
    { id: 'rau', n: 'Rau cải', e: '🥬', grow: 2 * 60000, seed: 5000, sell: 10000 },
    { id: 'ngo', n: 'Bắp ngô', e: '🌽', grow: 6 * 60000, seed: 15000, sell: 32000 },
    { id: 'ca', n: 'Cà chua', e: '🍅', grow: 15 * 60000, seed: 35000, sell: 90000 },
    { id: 'dua', n: 'Dưa hấu', e: '🍉', grow: 30 * 60000, seed: 80000, sell: 230000 }
  ];
  const SEED_PACK = 5;
  const SEED_MAX = 10;
  const seedLv = (f, id) => { const v = Math.round(Number(f.seedLv && f.seedLv[id])); return v >= 1 && v <= SEED_MAX ? v : 1; };
  const seedUpCost = (c, lv) => Math.max(1000, Math.round(c.seed * SEED_PACK * 3 * lv / 1000) * 1000);
  const seedExtra = (lv) => Math.min(0.75, 0.3 + (lv - 1) * 0.05);
  const seedPest = (lv) => Math.max(0.03, 0.18 - (lv - 1) * 0.015);
  const TRUCK_MAX = 3;
  const TRUCK_SPEED = [0, 1, 1.35, 1.7];
  const TRUCK_BUY = (n) => 500000 + 250000 * Math.max(0, n - 1);
  const TRUCK_UP = (lv) => 600000 * lv;
  const JOB_COST = 30000;
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
  const MAX_PLOTS = 28, START_PLOTS = 6;
  const LAND_COST = (i) => i < 10 ? 400000 : i < 14 ? 1500000 : i < 18 ? 4000000 : i < 20 ? 6000000 : i < 22 ? 8000000 : i < 24 ? 12000000 : i < 26 ? 16000000 : 22000000;
  const LAND_LVL = (i) => i < 8 ? 2 : i < 10 ? 3 : i < 12 ? 4 : i < 14 ? 5 : i < 16 ? 6 : i < 18 ? 7 : i < 20 ? 8 : i < 22 ? 9 : i < 24 ? 10 : i < 26 ? 11 : 12;
  const MAX_BLD_LV = 8, MAX_BLD_COPIES = 3;
  const BUILDINGS = {
    kho: { n: 'Kho lương thực', s: 'Kho', e: '🏚️', lvl: 1, max: MAX_BLD_LV, cost: [0, 1000000, 3000000, 8000000, 20000000, 32000000, 50000000, 80000000, 120000000], cap: [0, 60, 180, 450, 1000, 2000, 3200, 4700, 6500], d: 'Chứa nông sản thu về.' },
    nha: { n: 'Nhà công nhân', s: 'Nhà ở', e: '🏠', lvl: 2, max: MAX_BLD_LV, cost: [0, 2000000, 5000000, 12000000, 24000000, 38000000, 58000000, 90000000, 130000000], slots: [0, 2, 4, 7, 10, 13, 16, 19, 22], d: 'Chỗ ở cho công nhân, càng rộng tuyển càng đông.' },
    donggoi: { n: 'Khu đóng gói', s: 'Đóng gói', e: '📦', lvl: 2, max: MAX_BLD_LV, cost: [0, 1500000, 4000000, 10000000, 20000000, 32000000, 50000000, 75000000, 100000000], mult: [0, 1, 1.8, 2.8, 3.8, 4.8, 5.8, 6.8, 7.6], d: 'Cần có mới đóng gói được đơn hàng.' },
    giaohang: { n: 'Khu giao hàng', s: 'Giao hàng', e: '🚚', lvl: 3, max: MAX_BLD_LV, cost: [0, 1000000, 3000000, 8000000, 16000000, 27000000, 42000000, 63000000, 90000000], d: 'Có xe mới giao đơn được, nâng cấp xe chạy nhanh hơn.' },
    nhansu: { n: 'Phòng nhân sự', s: 'Nhân sự', e: '🧑‍💼', lvl: 3, max: MAX_BLD_LV, cost: [0, 1500000, 4000000, 9000000, 18000000, 29000000, 45000000, 66000000, 95000000], cvN: [0, 3, 4, 5, 6, 7, 8, 9, 10], q: [0, 0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35], d: 'Đăng tin tuyển người, quản lý lương thưởng và thăng chức.' },
    cskh: { n: 'Phòng CSKH', s: 'CSKH', e: '🎧', lvl: 4, max: MAX_BLD_LV, cost: [0, 2500000, 6000000, 13000000, 24000000, 36000000, 54000000, 80000000, 110000000], d: 'Trợ lý nhắc việc, giữ mối khách quen.' },
    ketoan: { n: 'Phòng kế toán', s: 'Kế toán', e: '📒', lvl: 5, max: MAX_BLD_LV, cost: [0, 2000000, 5000000, 11000000, 21000000, 33000000, 50000000, 76000000, 105000000], d: 'Sổ sách rõ ràng, thanh tra không lo.' }
  };
  const LEVEL_TITLES = [[1, 'Vườn nhà'], [3, 'Trang trại nhỏ'], [5, 'Trang trại lớn'], [7, 'Hợp tác xã'], [9, 'Tổng công ty thu mua']];
  function levelTitle(lv) {
    let out = LEVEL_TITLES[0][1];
    for (let i = 0; i < LEVEL_TITLES.length; i++) if (lv >= LEVEL_TITLES[i][0]) out = LEVEL_TITLES[i][1];
    return out;
  }
  function bldLocked(f, key) { const b = BUILDINGS[key]; return !!b && (f.buildings[key] || 0) <= 0 && f.level < (b.lvl || 1); }
  // ---- danh sách bản sao công trình (mỗi loại tối đa MAX_BLD_COPIES căn, mỗi căn tối đa cấp 8) ----
  function bldLvV(v) { const n = Math.round(Number(v) || 0); return n < 1 ? 1 : n > MAX_BLD_LV ? MAX_BLD_LV : n; }
  function bldFaceV(v) { const n = Math.round(Number(v)); return n >= 0 && n < 4 ? n : 0; }
  function bldInsts(f, key) { return f.blds.filter(x => x.key === key); }
  function bldOf(f, sel) {
    if (!sel) return null;
    const inst = f.blds.find(x => x.id === sel);
    if (inst) return inst;
    if (BUILDINGS[sel]) return f.blds.find(x => x.key === sel) || null;
    return null;
  }
  function bldSumLv(f, key) { return bldInsts(f, key).reduce((s, x) => s + (x.lv || 0), 0); }
  function bldCount(f, key) { return bldInsts(f, key).length; }
  function newBldCost(f, key) { const c = BUILDINGS[key].cost[1]; return Math.round(c * (1 + 0.7 * bldCount(f, key)) / 1000) * 1000; }
  function newBldId(f) {
    let n = Math.max(0, Math.round(f.__bldSeq || 0));
    do { n++; } while (f.blds.some(x => x.id === 'bd' + n));
    f.__bldSeq = n;
    return 'bd' + n;
  }
  function addBld(f, key, lv, c, r, face) {
    const inst = { id: newBldId(f), key: key, lv: bldLvV(lv), c: Math.round(c), r: Math.round(r), face: bldFaceV(face) };
    f.blds.push(inst);
    syncBlds(f);
    return inst;
  }
  function syncBlds(f) {
    if (!Array.isArray(f.blds)) f.blds = [];
    f.blds = f.blds.filter(b => b && typeof b === 'object' && BUILDINGS[b.key]);
    f.blds.forEach((b, i) => {
      b.lv = bldLvV(b.lv);
      b.face = bldFaceV(b.face);
      b.c = Math.round(Number(b.c)); b.r = Math.round(Number(b.r));
      if (!isFinite(b.c) || !isFinite(b.r)) { b.c = null; b.r = null; }
      if (typeof b.id !== 'string' || !b.id || f.blds.some((o, j) => j < i && o.id === b.id)) b.id = newBldId(f);
    });
    if (!f.__bldMir || typeof f.__bldMir !== 'object') f.__bldMir = {};
    Object.keys(BUILDINGS).forEach(key => {
      let list = f.blds.filter(x => x.key === key);
      const mir = f.__bldMir[key] || (f.__bldMir[key] = { lv: null, c: null, r: null, face: null });
      const legacy = Math.max(0, Math.round(Number(f.buildings[key]) || 0));
      const lp = f.buildingPos && f.buildingPos[key];
      const lf = f.buildingFace && f.buildingFace[key];
      if (!list.length) {
        if (legacy > 0) {
          const home = HOME_POS[key] || { c: 1, r: 1 };
          list = [{ id: newBldId(f), key: key, lv: bldLvV(legacy), c: lp && isFinite(lp.c) ? Math.round(lp.c) : home.c, r: lp && isFinite(lp.r) ? Math.round(lp.r) : home.r, face: bldFaceV(lf) }];
          f.blds.push(list[0]);
        }
      } else if (mir.lv != null && legacy > 0 && legacy !== mir.lv) {
        list[0].lv = bldLvV(legacy);
      }
      if (list.length && lp && isFinite(lp.c) && isFinite(lp.r) && mir.c != null && (Math.round(lp.c) !== mir.c || Math.round(lp.r) !== mir.r)) {
        list[0].c = Math.round(lp.c); list[0].r = Math.round(lp.r);
      }
      if (list.length && typeof lf === 'number' && mir.face != null && bldFaceV(lf) !== mir.face) list[0].face = bldFaceV(lf);
      list.forEach(b => { if (b.c == null) { const home = HOME_POS[key] || { c: 1, r: 1 }; b.c = home.c; b.r = home.r; } });
      const maxLv = list.length ? list.reduce((m, x) => Math.max(m, x.lv), 0) : 0;
      f.buildings[key] = maxLv;
      const first = list[0];
      if (first) {
        f.buildingPos[key] = { c: first.c, r: first.r };
        f.buildingFace[key] = first.face;
      } else {
        delete f.buildingPos[key];
        delete f.buildingFace[key];
      }
      mir.lv = maxLv; mir.c = first ? first.c : null; mir.r = first ? first.r : null; mir.face = first ? first.face : null;
    });
  }
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
  const FOOT = { kho: [2, 2], nha: [2, 2], donggoi: [2, 2], giaohang: [2, 2], nhansu: [1, 1], cskh: [1, 1], ketoan: [1, 1] };
  const HOME_POS = { kho: { c: 2, r: 2 }, donggoi: { c: 5, r: 2 }, nhansu: { c: 4, r: 3 }, cskh: { c: 4, r: 2 }, ketoan: { c: 4, r: 4 }, nha: { c: 2, r: 5 }, giaohang: { c: 5, r: 5 } };
  const PLOT_COLS = 4, PLOT_ROW = 10, PLOT_W = 78, PLOT_STEP = 84;
  const plotRect = (i) => ({ x: 48 + (i % PLOT_COLS) * PLOT_STEP, y: (PLOT_ROW + Math.floor(i / PLOT_COLS) * 2) * TILE + 4, w: PLOT_W, h: PLOT_W });
  const plotCenter = (i) => { const r = plotRect(i); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; };
  const WALK = [{ x0: 430, x1: 800, y0: 340, y1: 1020 }, { x0: 80, x1: 780, y0: 1030, y1: 1090 }];
  const FIELD = { x0: 40, x1: 430, y0: 430, y1: 1030 };
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
    if (!f.seedLv || typeof f.seedLv !== 'object') f.seedLv = {};
    CROPS.forEach(c => { const v = Math.round(Number(f.seedLv[c.id])); f.seedLv[c.id] = v >= 1 && v <= SEED_MAX ? v : 1; });
    if (!f.ferts || typeof f.ferts !== 'object') f.ferts = { thuong: typeof f.fertBags === 'number' ? f.fertBags : 0, xanh: 0, cao: 0 };
    FERTS.forEach(t => { if (typeof f.ferts[t.id] !== 'number' || f.ferts[t.id] < 0) f.ferts[t.id] = 0; });
    if (typeof f.sprays !== 'number') f.sprays = 0;
    if (!Array.isArray(f.workers)) f.workers = [];
    f.workers.forEach(w => {
      if (!w.__pw) { w.__pw = true; if (typeof w.tx === 'number' && w.tx <= 100) { w.tx = null; w.ty = null; } }
      if (typeof w.due !== 'number' || w.due < 0) w.due = 0;
      if (typeof w.dueDays !== 'number' || w.dueDays < 0) w.dueDays = 0;
      if (typeof w.rank !== 'number' || w.rank < 0 || w.rank > 3) w.rank = 0;
      if (typeof w.bday !== 'string' || !/^\d{2}-\d{2}$/.test(w.bday)) w.bday = custBday(w);
    });
    if (!Array.isArray(f.orders)) f.orders = [];
    if (!Array.isArray(f.bills)) f.bills = [];
    f.bills = f.bills.filter(b => b && typeof b === 'object' && typeof b.amt === 'number' && b.amt >= 0);
    f.bills.forEach((b, i) => {
      if (typeof b.id !== 'string') b.id = 'b' + i + '-' + Math.round(b.born || 0);
      if (typeof b.kind !== 'string') b.kind = 'khac';
      if (typeof b.n !== 'string') b.n = 'Khoản phải trả';
      if (typeof b.due !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.due)) b.due = dayKey();
      if (typeof b.born !== 'number') b.born = Date.now();
      if (typeof b.icon !== 'string') b.icon = '🧾';
    });
    if (!Array.isArray(f.trucks)) f.trucks = [];
    f.trucks = f.trucks.filter(t => t && typeof t === 'object');
    f.trucks.forEach((t, i) => {
      if (typeof t.id !== 'string') t.id = 't' + i + '-' + Math.round(t.lv || 1);
      if (!(t.lv >= 1 && t.lv <= TRUCK_MAX)) t.lv = 1;
    });
    if ((f.buildings.giaohang || 0) > 0 && !f.trucks.length) f.trucks.push({ id: 't' + Date.now(), lv: 1 });
    const shipCount = f.orders.filter(o => o.state === 'ship').length;
    while (f.trucks.length < shipCount) f.trucks.push({ id: 't' + Date.now() + '-' + f.trucks.length, lv: 1 });
    const usedTrucks = {};
    f.orders.forEach(o => {
      if (o.state !== 'ship') return;
      if (!o.truck || !f.trucks.some(t => t.id === o.truck) || usedTrucks[o.truck]) {
        const free = f.trucks.find(t => !usedTrucks[t.id]);
        if (free) o.truck = free.id;
      }
      if (o.truck) usedTrucks[o.truck] = true;
    });
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
    if (!Array.isArray(f.deliveries)) f.deliveries = [];
    if (!Array.isArray(f.candidates)) f.candidates = [];
    if (!Array.isArray(f.tasks)) f.tasks = [];
    if (!f.season || typeof f.season !== 'object') f.season = {};
    if (!Array.isArray(f.villagers)) f.villagers = [];
    if (!f.ledger || typeof f.ledger !== 'object') f.ledger = { day: dayKey(), in: 0, out: 0 };
    if (!f.ledger.src || typeof f.ledger.src !== 'object') f.ledger.src = {};
    ['ban', 'don', 'khac'].forEach(k => { if (typeof f.ledger.src[k] !== 'number' || f.ledger.src[k] < 0) f.ledger.src[k] = 0; });
    if (typeof f.cash !== 'number' || !isFinite(f.cash) || f.cash < 0) f.cash = 0;
    f.cash = Math.round(f.cash);
    if (typeof f.__landN === 'number') f.__landN = Math.max(0, Math.min(MAX_PLOTS, Math.round(f.__landN)));
    if (!Array.isArray(f.ledgerHist)) f.ledgerHist = [];
    if (typeof f.lastEventAt !== 'number') f.lastEventAt = Date.now();
    if (typeof f.nextOrderAt !== 'number') f.nextOrderAt = Date.now() + rand(60, 150) * 1000;
    if (typeof f.nextContractAt !== 'number') f.nextContractAt = 0;
    if (typeof f.negCooldownUntil !== 'number') f.negCooldownUntil = 0;
    if (typeof f.wageDebt !== 'boolean') f.wageDebt = false;
    if (typeof f.wageArrears !== 'number') f.wageArrears = 0;
    if (!f.buildingFace || typeof f.buildingFace !== 'object') f.buildingFace = {};
    syncBlds(f);
    if (f.__wageMig !== true) {
      const dueSum = f.workers.reduce((s, w) => s + (w.due || 0), 0);
      if (dueSum === 0 && f.wageArrears > 0) {
        if (f.workers.length) {
          const n = f.workers.length, share = Math.round(f.wageArrears / n);
          f.workers.forEach((w, i) => { w.due = i === n - 1 ? Math.round(f.wageArrears) - share * (n - 1) : share; });
        } else {
          f.bills.push({ id: 'b' + Date.now() + '_luong', kind: 'luong', n: 'Nợ lương cũ', amt: Math.round(f.wageArrears), due: dayKey(), born: Date.now(), icon: '👥' });
          f.wageArrears = 0;
        }
      }
      f.__wageMig = true;
    }
    syncWage(f);
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
  function syncWage(f) {
    const due = Math.round(f.workers.reduce((s, w) => s + (w.due || 0), 0));
    f.wageArrears = due;
    f.wageDebt = due > 0;
    return due;
  }
  function dayAdd(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function billOverdue(b) {
    const diff = Math.round((new Date(dayKey()) - new Date(b.due)) / 864e5);
    return diff > 0 ? diff : 0;
  }
  function billFee(b) { return Math.round(b.amt * Math.min(0.2, billOverdue(b) * 0.02) / 1000) * 1000; }
  function billTotal(b) { return b.amt + billFee(b); }
  function genBills(f, prevIn, prevDeliv) {
    const cut = 1 - ketoanCut(f);
    const add = (kind, n, amt, days, icon) => {
      amt = Math.round(amt * cut / 1000) * 1000;
      if (amt <= 0) return;
      f.bills.push({ id: 'b' + Date.now() + '_' + kind, kind: kind, n: n, amt: amt, due: dayAdd(days), born: Date.now(), icon: icon });
    };
    const bldN = f.blds.length;
    add('dien', 'Tiền điện nước', 50000 + 8000 * landCount(f) + 20000 * bldN, 3, '💡');
    if (prevIn > 0) add('thue', 'Thuế doanh thu', Math.max(20000, prevIn * 0.04), 5, '🧾');
    if (prevDeliv > 0) add('xang', 'Xăng xe giao hàng', prevDeliv * 30000, 2, '⛽');
    if (f.bills.length > 24) f.bills = f.bills.slice(-24);
  }
  function newFarmDay(f) {
    const today = dayKey();
    const elapsedDays = f.day ? Math.max(1, Math.round((new Date(today) - new Date(f.day)) / 864e5)) : 0;
    const prevIn = f.ledger ? Math.max(0, f.ledger.in || 0) : 0;
    const prevDeliv = Array.isArray(f.deliveries) ? f.deliveries.filter(d => d.day === f.day).length : 0;
    // chốt sổ hôm trước
    if (f.ledger && f.ledger.day !== today) {
      f.ledgerHist.unshift({ day: f.ledger.day, in: Math.round(f.ledger.in || 0), out: Math.round(f.ledger.out || 0) });
      f.ledgerHist = f.ledgerHist.slice(0, 7);
    }
    f.ledger = { day: today, in: 0, out: 0, src: { ban: 0, don: 0, khac: 0 } };
    f.day = today;
    if (elapsedDays > 0) {
      f.workers.forEach(w => {
        const old = w.due || 0;
        if (old > 0) {
          w.dueDays = (w.dueDays || 0) + 1;
          if (w.dueDays >= 2) w.morale = Math.max(0, (w.morale ?? 70) - 8);
        } else w.dueDays = 0;
        w.due = Math.round(old + w.wage * elapsedDays);
      });
      syncWage(f);
      genBills(f, prevIn, prevDeliv);
      if (f.bills.some(b => billOverdue(b) > 0)) f.workers.forEach(w => { w.morale = Math.max(0, (w.morale ?? 70) - 3); });
    } else syncWage(f);
    f.tasks = genTasks();
    rollSeason(f);
    f.villagers = genVillagers();
    if (!f.candidates.length) f.candidates = genCandidates(cvSlots(f), hrBoost(f));
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
  function genCandidates(n, boost) {
    const out = [];
    n = Math.max(1, Math.round(n || 3));
    boost = boost || 0;
    const names = shuffle(NAMES.slice());
    for (let i = 0; i < n; i++) {
      const role = Math.random() < 0.55 ? 'vuon' : 'donggoi';
      const quirk = pick(QUIRKS);
      const skill = Math.round(Math.min(1.65, 0.8 + Math.random() * 0.6 + boost) * 100) / 100;
      const wage = Math.round(70 * skill * quirk.wage) * 1000;
      out.push({ id: 'c' + Date.now() + i, name: names[i % names.length], role: role, skill: skill, wage: wage, quirk: quirk.id, quirkN: quirk.n, quirkD: quirk.d, emoji: pick(WORKER_EMOJI[role]) });
    }
    return out;
  }
  const cvSlots = (f) => Math.min(12, bldInsts(f, 'nhansu').reduce((s, b) => s + (BUILDINGS.nhansu.cvN[b.lv] || 0), 0)) || 3;
  const hrBoost = (f) => Math.min(0.4, bldInsts(f, 'nhansu').reduce((s, b) => s + (BUILDINGS.nhansu.q[b.lv] || 0), 0));

  // ===================== TIỆN ÍCH =====================
  const stockTotal = (f) => CROPS.reduce((s, c) => s + (f.stock[c.id] || 0), 0);
  const stockCap = (f) => bldInsts(f, 'kho').reduce((s, b) => s + (BUILDINGS.kho.cap[b.lv] || 0), 0);
  const workerSlots = (f) => Math.min(36, bldInsts(f, 'nha').reduce((s, b) => s + (BUILDINGS.nha.slots[b.lv] || 0), 0));
  const packMult = (f) => Math.min(12, bldInsts(f, 'donggoi').reduce((s, b) => s + (BUILDINGS.donggoi.mult[b.lv] || 0), 0));
  const ketoanCut = (f) => Math.min(0.4, bldSumLv(f, 'ketoan') * 0.05);
  const cskhGift = (f) => Math.min(0.4, bldSumLv(f, 'cskh') * 0.05);
  const landCount = (f) => f.__landN || START_PLOTS;
  function cropOf(id) { return CROPS.find(c => c.id === id) || CROPS[0]; }
  function bpos(f, key) {
    if (!f.buildingPos || typeof f.buildingPos !== 'object') f.buildingPos = {};
    if (f.buildingPos[key]) return f.buildingPos[key];
    if ((f.buildings[key] || 0) > 0) { f.buildingPos[key] = { c: HOME_POS[key].c, r: HOME_POS[key].r }; return f.buildingPos[key]; }
    return null;
  }
  function footprintBusy(f, key, c, r, ignoreId) {
    const [fw, fh] = FOOT[key];
    return f.blds.some(x => {
      if (x.id === ignoreId) return false;
      const s = FOOT[x.key];
      if (!s) return false;
      return c < x.c + s[0] && c + fw > x.c && r < x.r + s[1] && r + fh > x.r;
    });
  }
  function canPlace(f, key, c, r, ignoreId) {
    const [fw, fh] = FOOT[key];
    if (c < BOUND.c0 || r < BOUND.r0 || c + fw - 1 > BOUND.c1 || r + fh - 1 > BOUND.r1) return false;
    if (NO_BUILD.some(z => c <= z.c1 && c + fw - 1 >= z.c0 && r <= z.r1 && r + fh - 1 >= z.r0)) return false;
    return !footprintBusy(f, key, c, r, ignoreId);
  }
  function bldFace(f, sel) {
    const b = bldOf(f, sel);
    if (b) return bldFaceV(b.face);
    const v = f.buildingFace && f.buildingFace[sel];
    return bldFaceV(v);
  }
  function doorOf(f, sel) {
    const b = bldOf(f, sel);
    if (!b) return null;
    const key = b.key, s = FOOT[key], face = bldFaceV(b.face);
    const cx = (b.c + s[0] / 2) * TILE, cy = (b.r + s[1] / 2) * TILE;
    if (face === 1) return { x: b.c * TILE + 8, y: cy };
    if (face === 2) return { x: cx, y: b.r * TILE + 10 };
    if (face === 3) return { x: (b.c + s[0]) * TILE - 8, y: cy };
    return { x: cx, y: (b.r + s[1]) * TILE - 10 };
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
    const lv = seedLv(f, crop.id);
    f.plots[i] = { crop: crop.id, lv: lv, at: Date.now(), watered: false, pest: Math.random() < seedPest(lv), bug: PESTS[Math.floor(Math.random() * PESTS.length)], treated: false, fert: !!fert };
    if (Date.now() < f.__waterOffUntil) f.plots[i].pauseAt = Date.now();
    save(); if (!quiet) sfx('plant');
    render();
    if (!quiet) toast('🌱 Đã trồng ' + crop.n + (fert ? ' (có bón phân)' : '') + (lv > 1 ? ' · giống cấp ' + lv : ''));
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
    const lv = Math.max(1, Math.min(SEED_MAX, p.lv || 1));
    const qty = bad ? 1 : 1 + (Math.random() < seedExtra(lv) ? 1 : 0);
    if (stockTotal(f) + qty > stockCap(f)) { toast('Kho đầy rồi! Nâng cấp kho hoặc bán bớt đi.'); sfx('error'); return; }
    f.plots[i] = null;
    f.stock[crop.id] += qty;
    taskBump('harvest', qty);
    addXp(qty);
    save(); sfx('coin'); render();
    toast('🧺 ' + crop.n + ' vào kho ×' + qty + (bad ? ' (sâu ăn mất nửa)' : '') + (lv > 1 ? ' · giống cấp ' + lv : '')
      + (!f.buildings.donggoi ? ' · mang ra Chợ làng bán nhé' : ''));
  }
  function buyLand(i) {
    const f = FM();
    if (i !== landCount(f) || i >= MAX_PLOTS) return;
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
  function upgradeSeed(id) {
    const f = FM();
    const crop = CROPS.find(c => c.id === id);
    if (!crop) return;
    const lv = seedLv(f, id);
    if (lv >= SEED_MAX) return toast('Giống ' + crop.n + ' đã đạt cấp ' + SEED_MAX + ' rồi.');
    const cost = seedUpCost(crop, lv);
    if (!pay(cost)) return;
    f.seedLv[id] = lv + 1;
    addXp(8 + lv * 2);
    save(); sfx('merge'); render();
    toast('🌱 Giống ' + crop.n + ' lên cấp ' + (lv + 1) + ' · hái thêm ' + Math.round(seedExtra(lv + 1) * 100) + '% cơ hội +1');
  }
  function retailUnit(f, id) {
    const crop = cropOf(id);
    const sea = (f.season[id] || { p: 1 }).p;
    return Math.max(1000, Math.round(crop.sell * sea * RETAIL / 1000) * 1000);
  }  function sellCrop(id, all) {
    const f = FM(), crop = cropOf(id);
    const have = f.stock[id] || 0;
    if (have <= 0) { toast('Kho không còn ' + crop.n + ' để bán.'); sfx('error'); return; }
    const n = all ? have : 1;
    const unit = retailUnit(f, id);
    f.stock[id] -= n;
    addMoney(unit * n, 'ban');
    addXp(Math.max(1, Math.round(n / 2)));
    save(); sfx('coin'); render();
    toast('🧺 Bán ' + n + crop.e + ' ' + crop.n + ' ở chợ · +' + money(unit * n));
  }

  // ===================== XÂY DỰNG =====================
  function build(sel) {
    const f = FM();
    const inst = bldOf(f, sel);
    const key = inst ? inst.key : (BUILDINGS[sel] ? sel : null);
    if (!key) return;
    const b = BUILDINGS[key];
    if (!inst) {
      if (bldLocked(f, key)) { toast(b.n + ' mở khóa ở cấp ' + b.lvl + ', ráng lên nhé.'); sfx('error'); return; }
      startPlace(key); return;
    }
    if (inst.lv >= MAX_BLD_LV) { toast('Căn này đã đạt cấp ' + MAX_BLD_LV + '.'); return; }
    const lv = inst.lv, cost = b.cost[lv + 1];
    if (!pay(cost)) return;
    inst.lv = lv + 1;
    if (key === 'nha') f.workers.forEach(w => { if (w.__upgLevel <= inst.lv) w.__upgDue = 0; });
    syncBlds(f);
    addXp(20);
    save(); sfx('merge'); render();
    toast(b.e + ' ' + b.n + ' lên cấp ' + inst.lv + '!');
  }

  // ===================== CÔNG NHÂN =====================
  function hire(id) {
    const f = FM();
    const c = f.candidates.find(x => x.id === id);
    if (!c) return;
    if (f.workers.length >= workerSlots(f)) { toast('Nhà công nhân hết chỗ, xây thêm tầng đi.'); sfx('error'); return; }
    f.workers.push({ id: 'w' + Date.now() + '-' + rand(0, 999999), name: c.name, role: c.role, skill: c.skill, wage: c.wage, quirk: c.quirk, quirkN: c.quirkN, quirkD: c.quirkD, emoji: c.emoji, morale: 75, tx: null, ty: null, __pw: true, rank: 0, due: 0, dueDays: 0, bday: custBday(c) });
    f.candidates = f.candidates.filter(x => x.id !== id);
    const fill = cvSlots(f);
    if (f.candidates.length < fill) f.candidates = f.candidates.concat(genCandidates(fill, hrBoost(f)).slice(0, fill - f.candidates.length));
    taskBump('hire', 1);
    save(); sfx('win'); render();
    toast('🤝 ' + c.name + ' đã nhận việc! Lương ' + money(c.wage) + '/ngày.');
  }
  function fire(id) {
    const f = FM();
    const w = f.workers.find(x => x.id === id);
    if (!w) return;
    if ((w.due || 0) > 0) { toast('Còn nợ lương ' + money(w.due) + ' của ' + w.name + ', trả xong đã.'); sfx('error'); return; }
    f.workers = f.workers.filter(x => x.id !== id);
    syncWage(f);
    save(); sfx('click'); render();
    toast(w.name + ' đã dọn về quê.');
  }
  function postJob() {
    const f = FM();
    if (!f.buildings.nhansu) return toast('Chưa có phòng nhân sự.');
    if (!pay(JOB_COST)) return;
    f.candidates = genCandidates(cvSlots(f), hrBoost(f));
    save(); sfx('win'); render();
    toast('📣 Đăng tin xong, ' + f.candidates.length + ' hồ sơ mới về.');
  }
  function rejectCandidate(id) {
    const f = FM();
    const c = f.candidates.find(x => x.id === id);
    if (!c) return;
    f.candidates = f.candidates.filter(x => x.id !== id);
    save(); sfx('click'); render();
    toast('Đã từ chối hồ sơ của ' + c.name + '.');
  }
  function payWageWorker(id) {
    const f = FM();
    const w = f.workers.find(x => x.id === id);
    if (!w || !(w.due > 0)) return;
    const due = Math.round(w.due);
    if (!pay(due)) return;
    w.due = 0; w.dueDays = 0;
    w.morale = Math.min(100, (w.morale ?? 70) + 3);
    syncWage(f);
    save(); sfx('coin'); render();
    toast('💵 Trả lương ' + w.name + ' · ' + money(due));
  }
  function payAllWages() {
    const f = FM();
    const due = syncWage(f);
    if (due <= 0) return toast('Không còn nợ lương.');
    if (!pay(due)) return;
    f.workers.forEach(w => { w.due = 0; w.dueDays = 0; w.morale = Math.min(100, (w.morale ?? 70) + 3); });
    syncWage(f);
    save(); sfx('coin'); render();
    toast('💵 Đã trả lương cả đội · ' + money(due));
  }
  function rewardWorker(id) {
    const f = FM();
    const w = f.workers.find(x => x.id === id);
    if (!w) return;
    if (w.rewardDay === dayKey()) return toast('Hôm nay thưởng rồi, mai nha.');
    if (!pay(100000)) return;
    const bday = w.bday && daysUntilMD(w.bday) === 0;
    w.rewardDay = dayKey();
    w.morale = Math.min(100, (w.morale ?? 70) + (bday ? 25 : 12));
    save(); sfx('win'); render();
    toast('🎁 Thưởng ' + w.name + ' · tinh thần ' + w.morale + '♥' + (bday ? ' · đúng sinh nhật luôn!' : ''));
  }
  function promoteWorker(id) {
    const f = FM();
    const w = f.workers.find(x => x.id === id);
    if (!w) return;
    const rank = w.rank || 0;
    if (rank >= 3) return toast(w.name + ' đã ở bậc cao nhất.');
    const cost = Math.round(w.wage * 2 * (rank + 1));
    if (!pay(cost)) return;
    w.rank = rank + 1;
    w.skill = Math.round(Math.min(1.8, w.skill * 1.08) * 100) / 100;
    w.wage = Math.round(w.wage * 1.1 / 1000) * 1000;
    w.morale = Math.min(100, (w.morale ?? 70) + 8);
    save(); sfx('merge'); render();
    toast('⬆ ' + w.name + ' lên bậc ' + w.rank + ' · tay nghề ×' + w.skill.toFixed(2) + ' · lương ' + money(w.wage) + '/ngày');
  }
  function payBill(id) {
    const f = FM();
    const b = f.bills.find(x => x.id === id);
    if (!b) return;
    const total = billTotal(b);
    if (!pay(total)) return;
    f.bills = f.bills.filter(x => x.id !== id);
    save(); sfx('coin'); render();
    toast(b.icon + ' Trả ' + b.n.toLowerCase() + ' · ' + money(total));
  }
  function payAllDebts() {
    const f = FM();
    const wages = syncWage(f);
    const bills = f.bills.reduce((s, b) => s + billTotal(b), 0);
    const total = wages + bills;
    if (total <= 0) return toast('Không còn khoản nào phải trả.');
    if (!pay(total)) return;
    f.workers.forEach(w => { w.due = 0; w.dueDays = 0; });
    f.bills = [];
    syncWage(f);
    save(); sfx('coin'); render();
    toast('✅ Trả hết nợ · ' + money(total));
  }
  function workersOf(f, role) { return f.workers.filter(w => w.role === role); }
  function quirkSpd(w) { const q = QUIRKS.find(x => x.id === w.quirk); return (q && q.spd) || 1; }
  function quirkDesc(w) { const q = QUIRKS.find(x => x.id === w.quirk); return w.quirkD || (q && q.d) || 'Làm chắc tay.'; }

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
    o.prog += (100 / 240) * spd * (packMult(f) || 1) * 3;
  }

  // ===================== ĐƠN HÀNG =====================
  function orderCap(f) { return Math.min(10, 2 + bldSumLv(f, 'giaohang')); }
  const truckCap = (f) => Math.max(1, Math.min(12, bldSumLv(f, 'giaohang')));
  const truckOf = (f, id) => f.trucks.find(t => t.id === id) || null;
  const truckIdle = (f, t) => !f.orders.some(o => o.state === 'ship' && o.truck === t.id);
  function dispatchTruck(f, o) {
    const t = f.trucks.find(t => truckIdle(f, t));
    if (!t) return false;
    o.truck = t.id;
    o.state = 'ship';
    return true;
  }
  function buyTruck() {
    const f = FM();
    if (!f.buildings.giaohang) return toast('Xây khu giao hàng trước đã.');
    const cap = truckCap(f);
    if (f.trucks.length >= cap) return toast('Bãi chỉ chứa ' + cap + ' xe. Nâng khu giao hàng để mua thêm.');
    const cost = TRUCK_BUY(f.trucks.length);
    if (!pay(cost)) return;
    f.trucks.push({ id: 't' + Date.now() + '-' + rand(0, 999), lv: 1 });
    save(); sfx('merge'); render();
    toast('🚛 Mua xe tải mới · ' + money(cost));
  }
  function upgradeTruck(id) {
    const f = FM(), t = truckOf(f, id);
    if (!t) return;
    if (t.lv >= TRUCK_MAX) return toast('Xe này hết nâng được rồi.');
    if (!pay(TRUCK_UP(t.lv))) return;
    t.lv++;
    save(); sfx('merge'); render();
    toast('🚛 Xe lên cấp ' + t.lv + ' · chạy nhanh ' + Math.round((TRUCK_SPEED[t.lv] - 1) * 100) + '%');
  }
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

  // ===================== XƯỞNG ĐÓNG GÓI: mini game =====================
  const PACK_W = 46, PACK_SPEED = 0.075;
  let packGame = null, packEls = null;
  function packPlay(id) {
    const f = FM();
    const o = f.orders.find(x => x.id === id);
    if (!o || o.state !== 'pack') return;
    if (Date.now() < f.__powerOffUntil) return toast('Đang cúp điện, xưởng chưa chạy được.');
    if (o.prog >= 100) return toast(f.buildings.giaohang ? 'Đơn này đóng xong rồi, chờ xe tới lấy.' : 'Đơn đóng xong rồi. Xây khu giao hàng để xe tới lấy nhé.');
    if (packGame) return;
    packGame = { id: id, x: -PACK_W - 6, combo: 0, hits: 0, best: 0, speed: PACK_SPEED, beltW: 300, zone: [156, 234], last: 0, checkAt: 0, raf: 0 };
    fgPanel = 'orders'; uiKey = '';
    render();
    buildPack();
    packGame.raf = requestAnimationFrame(packLoop);
    sfx('click');
  }
  function buildPack() {
    const root = document.getElementById('farm-root');
    const host = root && root.querySelector('.fg-pack-host');
    if (!host || !packGame) return;
    const f = FM(), o = f.orders.find(x => x.id === packGame.id);
    if (!o) return closePack();
    const crop = cropOf(o.crop);
    host.innerHTML = '<div class="fg-packback" onclick="if(event.target===this)FarmGame.closePack()">'
      + '<div class="fg-packcard">'
      + '<div class="fg-pack-top"><div><b>📦 Xưởng đóng gói</b><span>' + esc(o.cust) + ' · ' + o.qty + ' ' + crop.n + '</span></div>'
      + '<button class="fg-alert-x" onclick="FarmGame.closePack()">✕</button></div>'
      + '<div class="fg-pack-prog"><i></i></div>'
      + '<div class="fg-pack-meta"><span class="fg-pack-combo"></span><b class="fg-pack-count"></b></div>'
      + '<div class="fg-belt"><div class="fg-belt-zone"></div>'
      + '<button class="fg-crate" onpointerdown="event.preventDefault();FarmGame.packHit()"><span class="fg-crate-e">' + crop.e + '</span></button></div>'
      + '<div class="fg-pack-foot"><span>Hộp đúng ô xanh: +14%, chuỗi càng dài càng thêm</span><span class="fg-pack-hint"></span></div>'
      + '</div></div>';
    const belt = host.querySelector('.fg-belt');
    packGame.beltW = belt.clientWidth || 300;
    packGame.zone = [Math.round(packGame.beltW * 0.52), Math.round(packGame.beltW * 0.78)];
    const zoneEl = host.querySelector('.fg-belt-zone');
    zoneEl.style.left = packGame.zone[0] + 'px';
    zoneEl.style.width = (packGame.zone[1] - packGame.zone[0]) + 'px';
    packEls = {
      crate: host.querySelector('.fg-crate'),
      prog: host.querySelector('.fg-pack-prog i'),
      combo: host.querySelector('.fg-pack-combo'),
      count: host.querySelector('.fg-pack-count'),
      hint: host.querySelector('.fg-pack-hint')
    };
    updatePackUI();
  }
  function packLoop(ts) {
    if (!packGame) return;
    const pg = packGame;
    if (!packEls || !packEls.crate) { pg.raf = 0; return; }
    if (!pg.last) pg.last = ts;
    let dt = Math.min(90, ts - pg.last);
    pg.last = ts;
    if (alertEv) dt = 0;
    pg.x += dt * pg.speed;
    if (pg.x > pg.beltW + 4) { pg.x = -PACK_W - 6; pg.combo = 0; updatePackUI('Hộp chạy qua mất rồi'); }
    if (packEls.crate) packEls.crate.style.transform = 'translate(' + Math.round(pg.x) + 'px, -50%)';
    if (ts > pg.checkAt) {
      pg.checkAt = ts + 500;
      const f = FM(), o = f.orders.find(x => x.id === pg.id);
      if (!o || o.state !== 'pack' || o.prog >= 100) return packExternalDone(o);
      packEls.prog.style.width = Math.min(100, Math.round(o.prog)) + '%';
      packEls.count.innerText = Math.min(5, Math.floor(o.prog / 20)) + '/5';
    }
    pg.raf = requestAnimationFrame(packLoop);
  }
  function packExternalDone(o) {
    if (o && o.state === 'pack' && o.prog >= 100) {
      const f = FM();
      if (!o.packed) { taskBump('pack', o.qty); o.packed = true; }
      const sent = (f.buildings.giaohang || 0) >= 1 && dispatchTruck(f, o);
      save(); closePack(); sfx('win');
      toast(sent ? 'Công nhân đóng xong đơn của ' + o.cust + ' rồi, xe đang tới lấy!' : 'Công nhân đóng xong đơn của ' + o.cust + ' rồi, đang chờ xe trống.');
      render();
      return;
    }
    closePack();
    toast(o ? 'Đơn đã đóng gói xong, xe đang tới lấy.' : 'Đơn này không còn nữa.');
    render();
  }
  function updatePackUI(hint) {
    if (!packGame || !packEls) return;
    const f = FM(), o = f.orders.find(x => x.id === packGame.id);
    if (!o) return;
    if (packEls.prog) packEls.prog.style.width = Math.min(100, Math.round(o.prog)) + '%';
    if (packEls.count) packEls.count.innerText = Math.min(5, Math.floor(o.prog / 20)) + '/5';
    if (packEls.combo) packEls.combo.innerText = packGame.combo > 1 ? 'Chuỗi ×' + packGame.combo : 'Bấm hộp khi nó vào ô xanh';
    if (packEls.hint) packEls.hint.innerText = hint || '';
  }
  function packHit() {
    if (!packGame) return;
    const f = FM(), o = f.orders.find(x => x.id === packGame.id);
    if (!o || o.state !== 'pack') return closePack();
    const cx = packGame.x + PACK_W / 2;
    if (cx >= packGame.zone[0] && cx <= packGame.zone[1]) {
      o.prog = Math.min(100, o.prog + 14 + Math.min(10, packGame.combo * 2));
      packGame.combo++; packGame.hits++;
      packGame.best = Math.max(packGame.best, packGame.combo);
      packGame.x = -PACK_W - 6;
      sfx('click'); save();
      updatePackUI();
      if (o.prog >= 100) { finishPack(o, f); return; }
      render();
    } else {
      packGame.combo = 0;
      sfx('error');
      updatePackUI('Trượt rồi, canh đúng ô xanh mới tính');
    }
  }
  function finishPack(o, f) {
    if (!o.packed) { taskBump('pack', o.qty); o.packed = true; }
    const sent = (f.buildings.giaohang || 0) >= 1 && dispatchTruck(f, o);
    save(); closePack(); sfx('win');
    toast(sent ? '📦 Đóng gói xong! Xe đang tới lấy đơn của ' + o.cust + '.' : (f.buildings.giaohang ? '📦 Đóng gói xong đơn của ' + o.cust + ', đang chờ xe trống.' : '📦 Đóng gói xong đơn của ' + o.cust + '. Xây khu giao hàng để xe tới lấy nhé.'));
    render();
  }
  function closePack() {
    if (packGame && packGame.raf) cancelAnimationFrame(packGame.raf);
    packGame = null; packEls = null;
    const root = document.getElementById('farm-root');
    const host = root && root.querySelector('.fg-pack-host');
    if (host) host.innerHTML = '';
  }
  function shipBoost(id) {
    const f = FM();
    const o = f.orders.find(x => x.id === id);
    if (!o || o.state !== 'ship') return;
    if (o.__boosted) return toast('Chuyến này thuê xe nhanh rồi.');
    if (!pay(150000)) return;
    o.__boosted = true;
    o.shipProg = Math.min(100, (o.shipProg || 0) + 50);
    save(); sfx('click'); render();
    toast('🚚 Xe chạy nhanh, đơn của ' + o.cust + ' sắp tới nơi.');
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
    const add = Math.ceil(g.close * (1 + cskhGift(f)));
    c.close = Math.min(100, (c.close || 50) + add);
    save(); sfx('buy'); render();
    toast(g.e + ' ' + c.name + ' cười tươi, thân thiết +' + add + '!');
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
          { t: 'Hứa cải thiện trong 2 ngày', run: (f) => { w.__upgDue = Date.now() + 2 * 864e5; w.__upgLevel = Math.min(MAX_BLD_LV, f.buildings.nha + 1); return w.name + ' gật đầu, nhưng sẽ nhớ lời hứa đấy.'; } },
          { t: 'Thôi thì cho nghỉ việc', run: (f) => { quitWorker(f, w); return w.name + ' dỗi bỏ về quê luôn.'; } }
        ], expire: (f) => { quitWorker(f, w); queueEvent('thanhtra'); } };
      }
    },
    {
      id: 'dinhcong', icon: '✊', when: (f) => f.workers.length >= 2 && f.wageDebt,
      make: (f, event) => {
        return { type: 'dinhcong', target: 'farm', txt: 'Cả lũ bỏ cuốc đứng lại: "Trả lương đã, không thì đình công!"', choices: [
          { t: 'Trả lương nợ + thưởng 500.000đ', run: (f) => { if (!pay(500000 + f.wageArrears)) return false; f.wageArrears = 0; f.wageDebt = false; f.__strikeUntil = 0; f.workers.forEach(w => { w.due = 0; w.dueDays = 0; w.morale = Math.min(100, w.morale + 30); }); return 'Đám đông reo hò, cuốc bừa vun lại ngay.'; } },
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
    if (mounted) showAlert(ev);
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
      if (mounted) showAlert(ev);
      else toast('⚠️ Có chuyện cần ra tay trên trại!');
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
      if (alertEv === ev.id) closeAlert();
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
    if (alertEv === ev.id) closeAlert();
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
        if (alertEv === ev.id) closeAlert();
        changed = true;
      }
    });
    f.events = f.events.filter(ev => !ev.done || now - ev.doneAt <= 60000);
    if (changed) save();
  }

  // ===================== POPUP SỰ CỐ GIỮA MÀN HÌNH =====================
  function clockText(secs) {
    const s = Math.max(0, Math.round(secs));
    return ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2);
  }
  function showAlert(ev) {
    if (!mounted || !ev || ev.done || !document.getElementById('farm-root')) return;
    alertEv = ev.id;
    renderAlert();
    if (!alertTimer) alertTimer = setInterval(updateAlertClock, 1000);
  }
  function renderAlert() {
    const root = document.getElementById('farm-root');
    const host = root && root.querySelector('.fg-alert-host');
    if (!host) return;
    if (!alertEv) { host.innerHTML = ''; return; }
    const f = FM(), ev = f.events.find(e => e.id === alertEv);
    if (!ev || ev.done) { closeAlert(); return; }
    host.innerHTML = '<div class="fg-alertback"><div class="fg-alertcard">'
      + '<button class="fg-alert-x" onclick="FarmGame.closeAlert()">✕</button>'
      + '<div class="fg-alert-i">' + ev.icon + '</div>'
      + '<div class="fg-alert-t">Có chuyện rồi!</div>'
      + '<div class="fg-alert-txt">' + esc(ev.txt) + '</div>'
      + '<div class="fg-alert-c">' + ev.choices.map((c, i) => '<button class="fg-btn" onclick="FarmGame.resolve(\'' + ev.id + '\',' + i + ')">' + c.t + '</button>').join('') + '</div>'
      + '<div class="fg-alert-clock">Còn <b class="fg-alert-secs">' + clockText((ev.until - Date.now()) / 1000) + '</b> để quyết định, không thì tự diễn biến xấu hơn.</div>'
      + '</div></div>';
  }
  function updateAlertClock() {
    if (!alertEv) return;
    const f = FM(), ev = f.events.find(e => e.id === alertEv);
    if (!ev || ev.done) { closeAlert(); return; }
    const el = document.getElementById('farm-root') && document.getElementById('farm-root').querySelector('.fg-alert-secs');
    if (el) el.innerText = clockText((ev.until - Date.now()) / 1000);
  }
  function closeAlert() {
    alertEv = null;
    if (alertTimer) { clearInterval(alertTimer); alertTimer = null; }
    const root = document.getElementById('farm-root');
    const host = root && root.querySelector('.fg-alert-host');
    if (host) host.innerHTML = '';
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
  let alertEv = null, alertTimer = null;
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
          if (f.buildings.giaohang >= 1 && dispatchTruck(f, o)) sfx('click');
        }
      } else if (o.state === 'ship') {
        const tr = truckOf(f, o.truck);
        o.shipProg = (o.shipProg || 0) + (100 / 30) * (tr ? TRUCK_SPEED[tr.lv] : 1);
        if (o.shipProg >= 100) {
          o.state = 'done';
          const total = o.qty * o.price;
          addMoney(total, 'don');
          if (!Array.isArray(f.deliveries)) f.deliveries = [];
          f.deliveries.unshift({ at: now, day: dayKey(), cust: o.cust, emoji: o.emoji, crop: o.crop, qty: o.qty, total: total });
          f.deliveries = f.deliveries.slice(0, 30);
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
    if (!b || !FOOT[key]) return;
    const have = bldCount(f, key);
    if (have >= MAX_BLD_COPIES) { toast(b.n + ' đã đủ ' + MAX_BLD_COPIES + ' căn rồi.'); sfx('error'); return; }
    if (lift) { lift = null; detachLift(); }
    if (!have && bldLocked(f, key)) { toast(b.n + ' mở khóa ở cấp ' + b.lvl + ', ráng lên nhé.'); sfx('error'); return; }
    const cost = have ? newBldCost(f, key) : b.cost[1];
    if (wallet() < cost) { toast('Chưa đủ ' + money(cost) + ' để ' + (have ? 'mua thêm' : 'xây') + ' ' + b.n + '.'); sfx('error'); return; }
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
    place = { key: key, c: spot.c, r: spot.r, cost: cost, again: have > 0, ok: canPlace(f, key, spot.c, spot.r) };
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
    if (bldCount(f, key) >= MAX_BLD_COPIES) { place = null; toast(b.n + ' đã đủ ' + MAX_BLD_COPIES + ' căn rồi.'); render(); return; }
    if (!pay(place.cost)) return;
    addBld(f, key, 1, place.c, place.r, 0);
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
    const f = FM(), inst = bldOf(f, k);
    if (!inst) return;
    if (f.events.some(e => !e.done && e.target === inst.key)) openPanel('events');
    else openBld(inst.id);
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
  function liftFoot() { return FOOT[lift.key]; }
  function startLift(h) {
    const f = FM(), inst = bldOf(f, h.k);
    if (!inst) return;
    endBldHold();
    bldTapBlock = Date.now() + 700;
    lift = { k: inst.id, key: inst.key, c: inst.c, r: inst.r, from: { c: inst.c, r: inst.r }, ok: true, moved: false, hold: true, id: h.id, sx: h.sx, sy: h.sy, confirmRemove: false };
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
    lift.ok = canPlace(f, lift.key, c, r, lift.k);
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
      const f = FM(), inst = bldOf(f, lift.k);
      if (inst) { inst.c = lift.c; inst.r = lift.r; syncBlds(f); }
      lift = null;
      save(); sfx('merge'); render();
      toast('Đã kê chỗ mới cho ' + (inst ? BUILDINGS[inst.key].n.toLowerCase() : 'công trình') + '.');
      return;
    }
    lift.c = lift.from.c; lift.r = lift.from.r; lift.ok = true;
    sfx('error'); render();
    toast('Chỗ đó vướng, trả về chỗ cũ nhé.');
  }
  function bldRotate() {
    if (!lift) return;
    const f = FM(), inst = bldOf(f, lift.k);
    if (!inst) return;
    inst.face = (bldFaceV(inst.face) + 1) % 4;
    syncBlds(f);
    save(); sfx('click'); render();
  }
  function bldRemove() {
    if (!lift) return;
    if (!lift.confirmRemove) { lift.confirmRemove = true; render(); return; }
    const f = FM(), inst = bldOf(f, lift.k);
    if (!inst) { lift = null; render(); return; }
    const key = inst.key, b = BUILDINGS[key], lv = inst.lv;
    if (key === 'nha' && f.workers.length > workerSlots(f) - (BUILDINGS.nha.slots[lv] || 0)) {
      lift.confirmRemove = false; sfx('error'); render();
      toast('Còn công nhân ở căn này, tháo là hết chỗ. Xây căn khác rồi hẵng tháo nhé.');
      return;
    }
    if (key === 'kho' && stockTotal(f) > stockCap(f) - (BUILDINGS.kho.cap[lv] || 0)) {
      lift.confirmRemove = false; sfx('error'); render();
      toast('Kho còn hàng, bán bớt rồi hãy tháo căn này.');
      return;
    }
    let refund = 0;
    for (let i = 1; i <= lv; i++) refund += b.cost[i] || 0;
    f.blds = f.blds.filter(x => x.id !== inst.id);
    if (!bldCount(f, key)) {
      f.buildings[key] = 0;
      f.__bldMir[key] = { lv: 0, c: null, r: null, face: null };
      delete f.buildingPos[key];
      delete f.buildingFace[key];
    }
    syncBlds(f);
    lift = null;
    if (refund) addMoney(refund);
    save(); sfx('coin'); render();
    toast('Đã tháo ' + b.n + (refund ? ', hoàn lại ' + money(refund) : '') + '.');
  }
  function bldDone() {
    if (!lift) return;
    const f = FM(), inst = bldOf(f, lift.k);
    if (inst && lift.ok) { inst.c = lift.c; inst.r = lift.r; syncBlds(f); }
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
      + '<button class="wallet-mini fg-cash" onclick="FarmGame.open(\'money\')">💲' + bigMoney(farmCash(f)) + (farmCash(f) ? '<i>rút</i>' : '') + '</button>'
      + '<span>🏚️ ' + stockTotal(f) + '/' + stockCap(f) + ' · 👷 ' + f.workers.length + '/' + workerSlots(f) + '</span>'
      + '</div>';

    const tools = '<button class="fg-tool" onclick="FarmGame.open(\'shop\')">🛒</button>'
      + '<button class="fg-tool" onclick="FarmGame.open(\'tasks\')">' + (claimable ? '<b class="fg-badge">!</b>' : '') + '🏅</button>'
      + '<button class="fg-tool" onclick="FarmGame.open(\'orders\')">' + (openOrders.length ? '<b class="fg-badge">' + openOrders.length + '</b>' : '') + '📋</button>'
      + '<button class="fg-tool" onclick="FarmGame.openHire()">👷</button>'
      + '<button class="fg-tool" onclick="FarmGame.open(\'build\')">' + (pendingEvents.length ? '<b class="fg-badge">' + pendingEvents.length + '</b>' : '') + '🏗️</button>'
      + '<button class="fg-tool" onclick="FarmGame.open(\'board\')">📰</button>'
      + '<button class="fg-tool" onclick="FarmGame.open(\'events\')">' + (pendingEvents.length ? '<b class="fg-badge warn">' + pendingEvents.length + '</b>' : '') + '🔔</button>';

    let blds = '';
    const firstBldOf = {};
    f.blds.forEach(inst => { if (!firstBldOf[inst.key]) firstBldOf[inst.key] = inst.id; });
    f.blds.forEach(inst => {
      const b = BUILDINGS[inst.key];
      if (!b) return;
      const ev = inst.id === firstBldOf[inst.key] && pendingEvents.find(e => e.target === inst.key);
      const sz = FOOT[inst.key];
      const onLift = lift && lift.k === inst.id;
      const at = onLift ? { c: lift.c, r: lift.r } : inst;
      const z = 100 + (at.r + sz[1]) * TILE + (onLift ? 60 : 0);
      blds += '<button class="fg-bld' + (onLift ? ' lift' + (lift.ok ? '' : ' bad') : '') + '" data-bld="' + inst.id + '" data-key="' + inst.key + '"'
        + ' style="left:' + at.c * TILE + 'px;top:' + at.r * TILE + 'px;width:' + (sz[0] * TILE - 4) + 'px;height:' + (sz[1] * TILE - 4) + 'px;z-index:' + z + '"'
        + ' onpointerdown="FarmGame.bldPress(event,\'' + inst.id + '\')" onclick="FarmGame.bldTap(\'' + inst.id + '\')">'
        + '<span class="fg-bld-door f' + bldFaceV(inst.face) + '"></span>'
        + '<span class="fg-bld-e">' + b.e + '</span><span class="fg-bld-lb">' + b.s + '</span>'
        + '<span class="fg-bld-lv">C' + inst.lv + '</span>'
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
        + (p.lv > 1 ? '<span class="fg-p-lv">C' + p.lv + '</span>' : '')
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
        items = CROPS.map(c => {
          const lv = seedLv(f, c.id);
          return '<button class="fg-ps' + ((f.seeds[c.id] || 0) > 0 ? '' : ' off') + '"'
            + ' onpointerdown="FarmGame.seedGrab(event,\'' + c.id + '\')">'
            + '<span class="fg-ps-e">' + c.e + '</span><b>' + (f.seeds[c.id] || 0) + '</b>'
            + (lv > 1 ? '<i class="fg-ps-lv">C' + lv + '</i>' : '') + '</button>';
        }).join('');
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
      + '<button class="fg-btn fg-place-ok' + (place.ok ? '' : ' off') + '"' + (place.ok ? '' : ' disabled') + ' onclick="FarmGame.placeConfirm()">' + (place.again ? 'Thêm căn' : 'Đặt') + ' · ' + bigMoney(place.cost) + '</button>'
      + '</div>') : lift ? ('<div class="fg-placebar edit">'
        + '<div class="fg-place-t"><b>' + BUILDINGS[lift.key].e + ' ' + BUILDINGS[lift.key].n + '</b>'
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
    nhansu: [['cv', '📇 Ứng viên'], ['staff', '🧑‍💼 Nhân sự'], ['info', 'ℹ️ Thông tin']],
    cskh: [['khach', '🤝 Khách quen'], ['nhac', '📅 Nhắc việc']],
    ketoan: [['nhan', '👥 Nhân sự & lương'], ['no', '🧾 Công nợ'], ['dt', '📈 Doanh thu']],
    donggoi: [['info', '📦 Xưởng']],
    giaohang: [['ship', '🚚 Chuyến đang chạy'], ['fleet', '🚛 Đội xe'], ['info', 'Thông tin']]
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
    const f = FM(), inst = bldOf(f, k);
    if (!inst) return openPanel('build');
    bldSel = inst.id;
    bldTab = (BLD_TABS[inst.key] || [['info', 'Thông tin']])[0][0];
    openPanel('bld');
  }
  function openHire() {
    const f = FM(), inst = bldOf(f, 'nhansu');
    if (inst) { bldSel = inst.id; bldTab = 'cv'; openPanel('bld'); }
    else openPanel('hire');
  }
  function bldHead(f, sel) {
    const inst = bldOf(f, sel);
    if (!inst) return '';
    const key = inst.key, b = BUILDINGS[key], lv = inst.lv, full = lv >= MAX_BLD_LV, count = bldCount(f, key);
    const extra = key === 'kho' ? 'chứa ' + stockCap(f) + ' món'
      : key === 'nha' ? 'chỗ ở ' + workerSlots(f) + ' người'
        : key === 'donggoi' ? 'tổng tốc độ ×' + packMult(f)
          : key === 'giaohang' ? 'đơn tối đa ' + orderCap(f) + ' · ' + f.trucks.length + ' xe'
            : key === 'nhansu' ? 'hồ sơ ' + f.candidates.length + ' · ' + f.workers.length + ' người'
              : key === 'cskh' ? 'khách quen ' + f.contracts.length + ' · quà +' + Math.round(cskhGift(f) * 100) + '%'
                : 'giảm hoá đơn ' + Math.round(ketoanCut(f) * 100) + '%';
    const tag = count > 1 ? 'C' + lv + ' · ' + count + ' căn' : 'Cấp ' + lv + '/' + MAX_BLD_LV;
    const acts = (full ? '<b class="fg-done">C' + MAX_BLD_LV + '</b>'
      : '<button class="fg-btn" onclick="FarmGame.build(\'' + inst.id + '\')">Nâng cấp · ' + bigMoney(b.cost[lv + 1]) + '</button>')
      + (count >= MAX_BLD_COPIES ? '<b class="fg-done">Đủ ' + MAX_BLD_COPIES + ' căn</b>'
        : '<button class="fg-btn ghost" onclick="FarmGame.startPlace(\'' + key + '\')">+ Căn · ' + bigMoney(newBldCost(f, key)) + '</button>');
    return '<div class="fg-bld-top"><div class="fg-bld-title"><b>' + b.e + ' ' + b.n + '</b></div>'
      + '<span class="fg-tag">' + tag + '</span></div>'
      + '<div class="fg-bld-sub"><span class="fg-sub">' + extra + '</span>'
      + '<div class="fg-bld-acts">' + acts + '</div>'
      + '</div>';
  }
  function khoTab(f, tab) {
    if (tab === 'vat') {
      const seedTiles = CROPS.map(c => '<div class="fg-cell' + ((f.seeds[c.id] || 0) ? '' : ' off') + '">'
        + '<b class="fg-cell-b">' + (f.seeds[c.id] || 0) + '</b>'
        + '<span class="fg-cell-e">' + c.e + '</span><b class="fg-cell-n">Hạt ' + c.n + '</b>'
        + '<span class="fg-cell-s">giống C' + seedLv(f, c.id) + ' · 1 hạt</span></div>').join('');
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
    return '<div class="fg-row"><span>Quà tặng thêm</span><b class="fg-money">+' + Math.round(cskhGift(f) * 100) + '% thân thiết</b></div>'
      + rows + '<div class="fg-note">Khách càng thân, đơn càng dày. Mua quà trong kho quà tặng của Kho.</div>';
  }
  function infoTab(f, key) {
    if (key === 'donggoi') {
      return '<div class="fg-row"><span>Tốc độ đóng gói</span><b class="fg-money">×' + packMult(f) + '</b></div>'
        + '<div class="fg-note">Trong mục 📋 Đơn hàng, bấm Đóng gói để tự tay xếp hộp: canh hộp chạy vào ô xanh mà chạm. Có công nhân thì tụi nó đóng phụ.</div>';
    }
    if (key === 'giaohang') {
      return '<div class="fg-row"><span>Đơn tối đa cùng lúc</span><b class="fg-money">' + orderCap(f) + '</b></div>'
        + '<div class="fg-row"><span>Đội xe</span><b class="fg-money">' + f.trucks.length + '/' + truckCap(f) + ' xe</b></div>'
        + '<div class="fg-note">Xe chạy đơn đã đóng gói. Mỗi chuyến chiếm một xe; nâng khu để mở thêm chỗ đậu, mua và nâng xe ở tab Đội xe.</div>';
    }
    if (key === 'ketoan') {
      return '<div class="fg-row"><span>Giảm hoá đơn</span><b class="fg-money">' + Math.round(ketoanCut(f) * 100) + '%</b></div>'
        + '<div class="fg-sec">📒 Sổ sách hôm nay</div>'
        + '<div class="fg-row"><span>Thu</span><b class="fg-money">' + money(f.ledger.in) + '</b></div>'
        + '<div class="fg-row"><span>Chi</span><b class="fg-money out">' + money(f.ledger.out) + '</b></div>';
    }
    return '';
  }
  function giaohangTab(f, tab) {
    if (tab === 'info') return infoTab(f, 'giaohang');
    if (tab === 'fleet') return fleetTab(f);
    const ships = f.orders.filter(o => o.state === 'ship');
    const today = dayKey();
    const todayDeliv = f.deliveries.filter(d => d.day === today);
    const earn = todayDeliv.reduce((s, d) => s + (d.total || 0), 0);
    const ready = f.orders.filter(o => o.state === 'pack' && o.prog >= 100);
    const rows = ships.length ? ships.map(o => {
      const sp = Math.min(100, Math.round(o.shipProg || 0));
      const tr = truckOf(f, o.truck);
      const spd = tr ? TRUCK_SPEED[tr.lv] : 1;
      const eta = Math.max(1, Math.ceil((100 - sp) * 30 / (100 * spd)));
      return '<div class="fg-ship"><div class="fg-ship-top"><span>' + o.emoji + ' ' + esc(o.cust) + ' · ' + o.qty + cropOf(o.crop).e + '</span>'
        + '<span class="fg-sub">' + (tr ? '🚛 cấp ' + tr.lv : '🚛') + ' · còn ~' + eta + ' giây</span></div>'
        + '<span class="fg-prog"><i style="width:' + sp + '%"></i></span>'
        + '<div class="fg-ship-bot"><span class="fg-sub">' + money(o.qty * o.price) + '</span>'
        + (o.__boosted ? '<b class="fg-done">Đã thuê xe nhanh</b>'
          : '<button class="fg-btn" onclick="FarmGame.shipBoost(\'' + o.id + '\')">⚡ Thuê xe nhanh · 150.000đ</button>') + '</div></div>';
    }).join('') : '<div class="fg-note">Chưa có chuyến nào trên đường. Nhận đơn rồi đóng gói ở mục 📋 Đơn hàng.</div>';
    const recent = f.deliveries.length ? f.deliveries.slice(0, 6).map(d => '<div class="fg-row"><span>' + d.emoji + ' ' + esc(d.cust) + ' · ' + d.qty + cropOf(d.crop).e + '</span>'
      + '<span class="fg-sub">' + agoText(d.at) + ' trước</span><b class="fg-money">+' + money(d.total) + '</b></div>').join('')
      : '<div class="fg-note">Chưa giao đơn nào.</div>';
    return '<div class="fg-row"><span>Hôm nay giao</span><span class="fg-sub">' + todayDeliv.length + ' đơn · ' + money(earn) + '</span></div>'
      + (ready.length ? '<div class="fg-note">' + ready.length + ' đơn đóng xong đang chờ xe trống.</div>' : '')
      + '<div class="fg-sec">Xe đang chạy · ' + ships.length + ' chuyến</div>' + rows
      + '<div class="fg-sec">Đơn gần đây</div>' + recent;
  }
  function fleetTab(f) {
    const cap = truckCap(f);
    const idle = f.trucks.filter(t => truckIdle(f, t)).length;
    const rows = f.trucks.map((t, i) => {
      const job = f.orders.find(o => o.state === 'ship' && o.truck === t.id);
      return '<div class="fg-truck"><span class="fg-truck-e">🚛</span>'
        + '<div class="fg-truck-m"><b>Xe ' + (i + 1) + ' · cấp ' + t.lv + '</b>'
        + '<span>Tốc độ ×' + TRUCK_SPEED[t.lv].toFixed(2) + ' · ' + (job ? 'đang chở đơn của ' + esc(job.cust) : 'đang rảnh') + '</span></div>'
        + (job ? '<b class="fg-done">Đang chạy</b>'
          : (t.lv >= TRUCK_MAX ? '<b class="fg-done">Cấp tối đa</b>'
            : '<button class="fg-btn" onclick="FarmGame.upgradeTruck(\'' + t.id + '\')">Nâng · ' + bigMoney(TRUCK_UP(t.lv)) + '</button>')) + '</div>';
    }).join('');
    return '<div class="fg-row"><span>Đội xe</span><span class="fg-sub">' + idle + ' rảnh · ' + (f.trucks.length - idle) + ' đang chạy · bãi ' + f.trucks.length + '/' + cap + '</span></div>'
      + (rows || '<div class="fg-note">Chưa có xe nào.</div>')
      + (f.trucks.length < cap
        ? '<button class="fg-btn wide" onclick="FarmGame.buyTruck()">🚛 Mua xe mới · ' + bigMoney(TRUCK_BUY(f.trucks.length)) + '</button>'
        : '<div class="fg-note">Bãi đầy rồi. Nâng khu giao hàng để chứa thêm xe.</div>')
      + '<div class="fg-note">Xe rảnh mới nhận chuyến. Xe cấp cao chạy nhanh hơn, đỡ chờ lâu.</div>';
  }
  function nhanSuLuongTab(f) {
    const totalWage = f.workers.reduce((s, w) => s + w.wage, 0);
    const due = f.wageArrears;
    const rows = f.workers.length ? f.workers.map(w => {
      const rank = w.rank || 0;
      const d = w.bday ? daysUntilMD(w.bday) : -1;
      return '<div class="fg-pay"><div class="fg-pay-top"><span class="fg-pay-e">' + w.emoji + '</span>'
        + '<div class="fg-pay-m"><b>' + esc(w.name) + (rank ? ' · bậc ' + rank : '') + '</b>'
        + '<span>' + roleName(w.role) + ' · tay nghề ×' + w.skill.toFixed(2) + ' · ' + w.quirkN + '</span></div>'
        + '<b class="fg-money">' + money(w.wage) + '</b></div>'
        + '<div class="fg-pay-sub">' + quirkDesc(w) + (w.bday ? ' · 🎂 ' + w.bday.split('-').reverse().join('/') + (d === 0 ? ' hôm nay' : ' (còn ' + d + ' ngày)') : '') + ' · ' + (w.morale ?? 70) + '♥</div>'
        + '<div class="fg-pay-bot">' + (w.due > 0
          ? '<b class="fg-due">Nợ ' + money(w.due) + (w.dueDays >= 2 ? ' · trễ ' + w.dueDays + ' ngày' : '') + '</b>'
          + '<button class="fg-btn" onclick="FarmGame.payWorker(\'' + w.id + '\')">Trả lương</button>'
          : '<b class="fg-done">Đã trả đủ</b>'
          + '<button class="fg-btn ghost" onclick="FarmGame.rewardWorker(\'' + w.id + '\')">' + (w.rewardDay === dayKey() ? 'Đã thưởng hôm nay' : '🎁 Thưởng 100.000đ') + '</button>')
        + '</div></div>';
    }).join('') : '<div class="fg-note">Chưa có công nhân nào. Sang phòng nhân sự tuyển người.</div>';
    return '<div class="fg-row"><span>Quỹ lương mỗi ngày</span><b class="fg-money">' + money(totalWage) + '</b></div>'
      + '<div class="fg-row"><span>Đang nợ</span><b class="fg-money' + (due ? ' out' : '') + '">' + money(due) + '</b></div>'
      + (due > 0 ? '<button class="fg-btn wide" onclick="FarmGame.payAllWages()">💵 Trả lương tất cả · ' + money(due) + '</button>' : '')
      + '<div class="fg-sec">Từng người</div>' + rows
      + '<div class="fg-note">Lương chốt mỗi sáng, trả tay ở đây. Nợ quá 2 ngày là tinh thần tụt dần.</div>';
  }
  function congNoTab(f) {
    const wages = f.wageArrears;
    const bills = f.bills.slice().sort((a, b) => a.due < b.due ? -1 : a.due > b.due ? 1 : 0);
    const billRows = bills.map(b => {
      const late = billOverdue(b), fee = billFee(b);
      return '<div class="fg-bill"><div class="fg-bill-top"><span>' + (b.icon || '🧾') + ' ' + esc(b.n) + '</span>'
        + '<b class="fg-money out">' + money(b.amt + fee) + '</b></div>'
        + '<div class="fg-bill-bot"><span class="fg-sub">hạn ' + b.due.split('-').reverse().join('/')
        + (late ? ' · quá hạn ' + late + ' ngày (+' + money(fee) + ')' : '') + '</span>'
        + '<button class="fg-btn" onclick="FarmGame.payBill(\'' + b.id + '\')">Trả</button></div></div>';
    }).join('');
    const billsTotal = bills.reduce((s, b) => s + billTotal(b), 0);
    return '<div class="fg-row"><span>👥 Nợ lương</span><b class="fg-money' + (wages ? ' out' : '') + '">' + money(wages) + '</b></div>'
      + '<div class="fg-sec">Hoá đơn</div>' + (billRows || '<div class="fg-note">Không có hoá đơn nào đang chờ.</div>')
      + (wages + billsTotal > 0 ? '<button class="fg-btn wide" onclick="FarmGame.payAllDebts()">💵 Trả hết · ' + money(wages + billsTotal) + '</button>' : '')
      + '<div class="fg-note">Điện nước chốt mỗi ngày, thuế theo doanh thu hôm trước, xăng theo số chuyến giao. Quá hạn bị cộng phí.</div>';
  }
  function doanhThuTab(f) {
    const src = f.ledger.src || { ban: 0, don: 0, khac: 0 };
    const inTotal = Math.max(1, f.ledger.in || 0);
    const parts = [['ban', 'Bán lẻ', '🛒'], ['don', 'Đơn sỉ', '📦'], ['khac', 'Khác', '✨']];
    const bars = parts.map(p => {
      const v = src[p[0]] || 0;
      return '<div class="fg-rev"><span>' + p[2] + ' ' + p[1] + '</span>'
        + '<span class="fg-prog"><i style="width:' + Math.min(100, v / inTotal * 100) + '%"></i></span>'
        + '<b class="fg-sub">' + money(v) + '</b></div>';
    }).join('');
    const hist = f.ledgerHist.slice(0, 7);
    const max = Math.max(1, f.ledger.in || 0, f.ledger.out || 0, ...hist.map(h => Math.max(h.in || 0, h.out || 0)));
    const days = hist.map(h => '<div class="fg-rev"><span>' + h.day.slice(5).split('-').reverse().join('/') + '</span>'
      + '<span class="fg-rev-bars"><i class="in" style="width:' + (h.in || 0) / max * 100 + '%"></i><i class="out" style="width:' + (h.out || 0) / max * 100 + '%"></i></span>'
      + '<b class="fg-sub">+' + bigMoney(h.in || 0) + ' · -' + bigMoney(h.out || 0) + '</b></div>').join('');
    const profit = f.ledger.in - f.ledger.out;
    return '<div class="fg-row"><span>Thu hôm nay</span><b class="fg-money">' + money(f.ledger.in) + '</b></div>'
      + '<div class="fg-row"><span>Chi hôm nay</span><b class="fg-money out">' + money(f.ledger.out) + '</b></div>'
      + '<div class="fg-row"><span>Lãi tạm tính</span><b class="fg-money' + (profit < 0 ? ' out' : '') + '">' + money(profit) + '</b></div>'
      + '<div class="fg-sec">Nguồn thu hôm nay</div>' + bars
      + '<div class="fg-sec">7 ngày gần đây</div>' + (days || '<div class="fg-note">Chưa đủ ngày để chốt sổ.</div>')
      + '<div class="fg-note">Sổ chốt lúc giao ngày. Bán lẻ, đơn sỉ và thu nhập khác tách riêng để biết tiền vào từ đâu.</div>';
  }
  function ketoanTab(f, tab) {
    if (tab === 'no') return congNoTab(f);
    if (tab === 'dt') return doanhThuTab(f);
    return nhanSuLuongTab(f);
  }
  function cvTab(f) {
    const cvs = f.candidates.length ? f.candidates.map(c => {
      return '<div class="fg-cv fg-hr"><div class="fg-hr-photo"><span>' + c.emoji + '</span><i>' + esc(c.name.split(' ').slice(-1)[0]) + '</i></div>'
        + '<div class="fg-hr-main"><div class="fg-cv-top"><b>' + esc(c.name) + '</b><span class="fg-tag">' + roleName(c.role) + '</span></div>'
        + '<div class="fg-cv-body">Tay nghề ×' + c.skill.toFixed(2) + ' · Lương ' + money(c.wage) + '/ngày<br>' + c.quirkN + ' — ' + c.quirkD + '</div>'
        + '<div class="fg-hr-act"><button class="fg-btn" onclick="FarmGame.hire(\'' + c.id + '\')">🤝 Tuyển</button>'
        + '<button class="fg-btn ghost" onclick="FarmGame.rejectCandidate(\'' + c.id + '\')">Từ chối</button></div></div></div>';
    }).join('') : '<div class="fg-note">Chưa có hồ sơ. Đăng tin để người xin việc ghé.</div>';
    return '<div class="fg-row"><span>Đợt tuyển</span><span class="fg-sub">' + f.candidates.length + ' hồ sơ · còn ' + Math.max(0, workerSlots(f) - f.workers.length) + ' chỗ trống</span></div>'
      + cvs
      + '<button class="fg-btn wide" onclick="FarmGame.postJob()">📣 Đăng tin tuyển mới · ' + money(JOB_COST) + '</button>'
      + '<div class="fg-note">Phòng cấp ' + (f.buildings.nhansu || 1) + ' nhận ' + cvSlots(f) + ' hồ sơ mỗi đợt, tay nghề khá hơn theo cấp.</div>';
  }
  function staffTab(f) {
    const rows = f.workers.length ? f.workers.map(w => {
      const rank = w.rank || 0;
      const upCost = Math.round(w.wage * 2 * (rank + 1));
      return '<div class="fg-pay"><div class="fg-pay-top"><span class="fg-pay-e">' + w.emoji + '</span>'
        + '<div class="fg-pay-m"><b>' + esc(w.name) + ' · bậc ' + rank + '/3</b>'
        + '<span>' + roleName(w.role) + ' · tay nghề ×' + w.skill.toFixed(2) + ' · ' + money(w.wage) + '/ngày</span></div>'
        + '<span class="fg-sub">' + (w.morale ?? 70) + '♥</span></div>'
        + '<div class="fg-metric"><span class="fg-sub">Tinh thần</span><span class="fg-prog"><i style="width:' + Math.max(0, Math.min(100, w.morale ?? 70)) + '%"></i></span></div>'
        + '<div class="fg-pay-bot">'
        + (rank < 3 ? '<button class="fg-btn" onclick="FarmGame.promoteWorker(\'' + w.id + '\')">⬆ Thăng chức · ' + bigMoney(upCost) + '</button>'
          : '<b class="fg-done">Bậc cao nhất</b>')
        + '<button class="fg-btn" onclick="FarmGame.rewardWorker(\'' + w.id + '\')">' + (w.rewardDay === dayKey() ? 'Đã thưởng hôm nay' : '🎁 Khen thưởng') + '</button>'
        + '<button class="fg-btn danger" onclick="FarmGame.fire(\'' + w.id + '\')">Cho nghỉ</button>'
        + '</div></div>';
    }).join('') : '<div class="fg-note">Chưa có ai trong biên chế.</div>';
    return '<div class="fg-row"><span>Biên chế</span><span class="fg-sub">' + f.workers.length + '/' + workerSlots(f) + ' người · quỹ lương ' + money(f.workers.reduce((s, w) => s + w.wage, 0)) + '/ngày</span></div>'
      + rows
      + '<div class="fg-note">Thăng chức tăng tay nghề và lương; khen thưởng giữ tinh thần. Còn nợ lương thì chưa cho nghỉ được.</div>';
  }
  function hrInfoTab(f) {
    return '<div class="fg-row"><span>Chỗ làm</span><span class="fg-sub">' + f.workers.length + '/' + workerSlots(f) + ' người</span></div>'
      + '<div class="fg-row"><span>Hồ sơ mỗi đợt</span><b class="fg-money">' + cvSlots(f) + '</b></div>'
      + '<div class="fg-row"><span>Tay nghề cộng thêm</span><b class="fg-money">+' + Math.round(hrBoost(f) * 100) + '%</b></div>'
      + '<div class="fg-row"><span>Nợ lương</span><b class="fg-money' + (f.wageArrears ? ' out' : '') + '">' + money(f.wageArrears) + '</b></div>'
      + '<div class="fg-note">Nâng phòng để nhận thêm hồ sơ và ứng viên tay nghề cao hơn. Trả lương và xem chi tiết ở phòng kế toán.</div>';
  }
  function nhansuTab(f, tab) {
    if (tab === 'staff') return staffTab(f);
    if (tab === 'info') return hrInfoTab(f);
    return cvTab(f);
  }

  function modalHtml(f, now) {
    if (!fgPanel) return '';
    let inner = '';
    if (fgPanel === 'shop') {
      const seedTiles = CROPS.map(c => '<button class="fg-cell" onclick="FarmGame.buyItem(\'' + c.id + '\')">'
        + '<b class="fg-cell-b">' + (f.seeds[c.id] || 0) + '</b>'
        + '<span class="fg-cell-e">' + c.e + '</span>'
        + '<b class="fg-cell-n">Hạt ' + c.n + '</b>'
        + '<span class="fg-cell-s">giống C' + seedLv(f, c.id) + ' · ' + (c.grow / 60000) + ' phút</span>'
        + '<span class="fg-cell-p">×' + SEED_PACK + ' · ' + bigMoney(c.seed * SEED_PACK) + '</span></button>').join('');
      const seedUp = CROPS.map(c => {
        const lv = seedLv(f, c.id), max = lv >= SEED_MAX;
        const pips = Array.from({ length: SEED_MAX }, (_, i) => '<u' + (i < lv ? ' class="on"' : '') + '></u>').join('');
        return '<div class="fg-seedrow">'
          + '<span class="fg-seedrow-e">' + c.e + '</span>'
          + '<div class="fg-seedrow-m"><b>' + c.n + ' · giống cấp ' + lv + '/' + SEED_MAX + '</b>'
          + '<span>' + (max ? 'Giống tốt nhất rồi' : 'Hái thêm ' + Math.round(seedExtra(lv) * 100) + '% cơ hội +1 · sâu ' + Math.round(seedPest(lv) * 100) + '%') + '</span>'
          + '<i class="fg-lvdots">' + pips + '</i></div>'
          + (max ? '<b class="fg-done">Cấp ' + SEED_MAX + '</b>'
            : '<button class="fg-btn" onclick="FarmGame.upgradeSeed(\'' + c.id + '\')">Nâng · ' + bigMoney(seedUpCost(c, lv)) + '</button>')
          + '</div>';
      }).join('');
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
        + '<div class="fg-sec">Nâng cấp giống</div>' + seedUp
        + '<div class="fg-sec">Phân bón</div><div class="fg-grid">' + fertTiles + '</div>'
        + '<div class="fg-sec">Vật tư</div><div class="fg-grid">' + toolTiles + '</div>'
        + '<div class="fg-sec">Quà tặng khách</div><div class="fg-grid">' + giftTiles + '</div>'
        + '<div class="fg-note">Chạm ô để mua. Hàng mua về nằm trong kho. Luống đất mới thì chạm ô khóa trên vườn.</div>';
    } else if (fgPanel === 'money') {
      const cash = farmCash(f);
      inner = '<div class="fg-h">💲 Ví nông trại</div>'
        + '<div class="fg-cash-big">' + money(cash) + '</div>'
        + '<div class="fg-note">Tiền bán nông sản, đơn hàng và thưởng đều vào ví này trước.</div>'
        + '<div class="fg-row"><span>Ví chính</span><b class="fg-money">' + money(wallet()) + '</b></div>'
        + '<button class="fg-btn wide' + (cash ? '' : ' off') + '"' + (cash ? '' : ' disabled') + ' onclick="FarmGame.withdraw()">🏦 Rút hết về ví chính</button>'
        + '<div class="fg-note">Chi tiêu trong trại trừ ví nông trại trước, thiếu mới lấy thêm từ ví chính.</div>';
    } else if (fgPanel === 'bld' && bldSel && bldOf(f, bldSel)) {
      const bkey = bldOf(f, bldSel).key;
      const tabs = BLD_TABS[bkey] || [['info', 'Thông tin']];
      const active = tabs.some(t => t[0] === bldTab) ? bldTab : tabs[0][0];
      let body = '';
      if (bkey === 'kho') body = khoTab(f, active);
      else if (bkey === 'nha') body = nhaTab(f, active);
      else if (bkey === 'nhansu') body = nhansuTab(f, active);
      else if (bkey === 'cskh') body = cskhTab(f, active);
      else if (bkey === 'ketoan') body = ketoanTab(f, active);
      else if (bkey === 'giaohang') body = giaohangTab(f, active);
      else body = infoTab(f, bkey);
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
            + (o.state === 'pack' ? '<button class="fg-btn" onclick="FarmGame.packPlay(\'' + o.id + '\')">📦 Đóng gói</button>' : '<b class="fg-done">🚚 Đang giao</b>') + '</div>';
        }).join('') : '<div class="fg-note">Nhận đơn rồi đóng gói tại đây, có công nhân thì tụi nó lo.</div>')
        + (doing.some(o => o.state === 'ship') && f.buildings.giaohang ? '<div class="fg-note">Theo dõi chuyến xe ở phòng 🚚 Khu giao hàng.</div>' : '')
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
        const b = BUILDINGS[k], insts = bldInsts(f, k);
        if (!insts.length && bldLocked(f, k)) {
          return '<div class="fg-room locked"><div class="fg-room-top"><span class="fg-room-e">' + b.e + '</span>'
            + '<b>' + b.n + '</b><span class="fg-tag lock">🔒 Cấp ' + b.lvl + '</span></div>'
            + '<div class="fg-room-d">' + b.d + '</div></div>';
        }
        const lv = insts.reduce((m, x) => Math.max(m, x.lv), 0);
        const full = insts.length > 0 && insts.every(x => x.lv >= MAX_BLD_LV);
        const tag = !insts.length ? 'Chưa xây' : insts.length > 1 ? insts.length + ' căn · C' + lv : 'Cấp ' + lv + '/' + MAX_BLD_LV;
        const extra = k === 'kho' ? 'Sức chứa ' + stockCap(f)
          : k === 'nha' ? 'Chỗ ở ' + workerSlots(f) + ' người'
            : k === 'donggoi' ? 'Tốc độ ×' + packMult(f)
              : k === 'giaohang' ? 'Đơn tối đa ' + orderCap(f) + ' · ' + f.trucks.length + ' xe'
                : k === 'nhansu' ? 'Hồ sơ ' + f.candidates.length + ' · ' + f.workers.length + ' người'
                  : k === 'cskh' ? 'Khách quen ' + f.contracts.length + ' · quà +' + Math.round(cskhGift(f) * 100) + '%'
                    : 'Giảm hoá đơn ' + Math.round(ketoanCut(f) * 100) + '%';
        const up = insts.slice().sort((a, c) => a.lv - c.lv)[0];
        const acts = !insts.length
          ? '<span class="fg-sub">' + money(b.cost[1]) + '</span>'
            + '<button class="fg-btn" onclick="FarmGame.startPlace(\'' + k + '\')">🏗 Chọn chỗ xây</button>'
          : (full ? '<b class="fg-done">Tối đa cấp</b>'
            : '<button class="fg-btn" onclick="FarmGame.build(\'' + up.id + '\')">Nâng cấp · ' + bigMoney(b.cost[up.lv + 1]) + '</button>')
            + (insts.length >= MAX_BLD_COPIES ? ''
              : '<button class="fg-btn ghost" onclick="FarmGame.startPlace(\'' + k + '\')">+ Căn · ' + bigMoney(newBldCost(f, k)) + '</button>');
        return '<div class="fg-room"><div class="fg-room-top"><span class="fg-room-e">' + b.e + '</span><b>' + b.n + '</b>'
          + '<span class="fg-tag">' + tag + '</span></div>'
          + '<div class="fg-room-d">' + b.d + ' · ' + extra + '</div>'
          + '<div class="fg-room-a"><div class="fg-bld-acts">' + acts + '</div></div></div>';
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
        + '<div class="fg-tools"></div><div class="fg-orders"></div><div class="fg-placebar"></div><div class="fg-modal-host"></div>'
        + '<div class="fg-pack-host"></div><div class="fg-alert-host"></div>';
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
    closePack(); closeAlert();
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
    openHire,
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
    plant, water, treat, fertilize, harvest, buyLand, buyItem, sellCrop, build, upgradeSeed,
    withdraw,
    fert: fertilize,
    startPlace, placeConfirm, placeCancel,
    bldPress, bldTap, bldRotate, bldRemove, bldDone,
    hire, fire, accept: acceptOrder, packClick, packPlay, packHit, closePack, shipBoost, gift, visitWorker,
    postJob, rejectCandidate, promoteWorker, rewardWorker, payWorker: payWageWorker, payAllWages,
    payBill, payAllDebts, buyTruck, upgradeTruck,
    negStart, negTactic, negClose,
    resolve: resolveEvent, closeAlert, haggle, vBuy: villagerBuy, vDecline: villagerDecline,
    claim: claimTask,
    _debug: {
      FM, spawnWalkOrder, queueEvent, tick,
      canPlace: (key, c, r) => canPlace(FM(), key, c, r),
      face: (key) => bldFace(FM(), key),
      door: (key) => doorOf(FM(), key),
      alertId: () => alertEv,
      seedInfo: (id) => {
        const f = FM(), lv = seedLv(f, id);
        return { lv: lv, extra: seedExtra(lv), pest: seedPest(lv), cost: lv >= SEED_MAX ? 0 : seedUpCost(cropOf(id), lv) };
      },
      packInfo: () => packGame ? { id: packGame.id, x: packGame.x, zone: packGame.zone.slice(), combo: packGame.combo, hits: packGame.hits } : null,
      packSetX: (x) => { if (packGame) packGame.x = x; },
      packZone: () => packGame ? [packGame.zone[0] + PACK_W / 2, packGame.zone[1] + PACK_W / 2] : null,
      bldInfo: (key) => bldInsts(FM(), key).map(b => ({ id: b.id, lv: b.lv, c: b.c, r: b.r, face: b.face })),
      liftAt: (id) => {
        const inst = bldOf(FM(), id);
        if (!inst) return false;
        lift = { k: inst.id, key: inst.key, c: inst.c, r: inst.r, from: { c: inst.c, r: inst.r }, ok: true, moved: false, hold: false, confirmRemove: false };
        return true;
      },
      bldCount: (key) => bldCount(FM(), key),
      newBldCost: (key) => newBldCost(FM(), key),
      effects: () => {
        const f = FM();
        return { stockCap: stockCap(f), workerSlots: workerSlots(f), packMult: packMult(f), cvSlots: cvSlots(f), hrBoost: hrBoost(f), orderCap: orderCap(f), truckCap: truckCap(f), ketoanCut: ketoanCut(f), cskhGift: cskhGift(f) };
      },
      placeAt: (key, c, r) => {
        const before = bldCount(FM(), key);
        startPlace(key);
        if (!place) return false;
        place.c = c; place.r = r;
        place.ok = canPlace(FM(), key, c, r);
        placeConfirm();
        return bldCount(FM(), key) > before;
      }
    }
  };
})();
