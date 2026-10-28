// ===================== THÚ CƯNG (pets.js) =====================
// Gồm: nhận nuôi từ túi đồ (Tặng / Nuôi / Bán), hồ sơ thú, chăm sóc, dắt đi chơi cùng nhân vật,
// shop thú (quần áo, chén ăn, thức ăn, đồ chơi, chuồng/bể, cá), đồ mặc, bể cá.
// Dữ liệu nằm trong window.state.pets (danh sách thú) và window.state.petBag (đồ trong kho thú).
(function () {
  'use strict';

  // ---------- CẤU HÌNH ĐỒ HỌA ----------
  // Ảnh thú: pets/<loài>_<giới>_<màu>_<dáng>.png  ví dụ pets/cat_male_trang_idle.png
  //   loài : cat, dog, golden, rabbit, parrot, hamster, fish
  //   giới : male, female
  //   màu  : trang, vang, nau, xam, den
  //   dáng : idle (bình thường), happy (vui), hungry (đói/buồn), sleep (ngủ)
  // Chưa có ảnh thì tự hiện emoji thay thế.
  const PET_ASSET_BASE = 'pets/';
  // Ảnh món đồ (điền khi có ảnh): ITEM_IMG['pt-acc-crown'] = 'pets/items/crown.png'
  const ITEM_IMG = {};

  const SPECIES = {
    cat:     { name: 'Mèo',        emoji: '🐱', walk: true },
    dog:     { name: 'Chó Corgi',  emoji: '🐶', walk: true },
    golden:  { name: 'Chó Golden', emoji: '🦮', walk: true },
    rabbit:  { name: 'Thỏ',        emoji: '🐰', walk: true },
    parrot:  { name: 'Vẹt',        emoji: '🦜', walk: false },
    hamster: { name: 'Hamster',    emoji: '🐹', walk: false },
    fish:    { name: 'Bể cá',      emoji: '🐠', walk: false, tank: true }
  };
  const PET_BY_ITEM = { 'item-1046': 'cat', 'item-1047': 'dog', 'item-1048': 'rabbit', 'item-1049': 'parrot', 'item-1050': 'hamster', 'item-1051': 'fish', 'item-1052': 'golden' };
  const COLORS = { 'Trắng': 'trang', 'Vàng': 'vang', 'Nâu': 'nau', 'Xám': 'xam', 'Đen': 'den' };
  const colorKey = (c) => COLORS[c] || 'trang';
  const DEFAULT_NAMES = ['Bơ', 'Mochi', 'Xíu', 'Bông', 'Cốm', 'Na', 'Susu', 'Mít', 'Sữa', 'Nấm'];

  // ---------- CÂN BẰNG GAME (chỉnh ở đây) ----------
  const TUNE = {
    walksPerDay: 2, playsPerDay: 3, tapsPerDay: 5,
    decayCapHours: 24,            // vắng app bao lâu cũng chỉ tính tối đa ngần này giờ
    foodPerHour: 2.4, moodPerHour: 1.0, moodPerHourHungry: 2.5, cleanPerHour: 1.2, energyRegenPerHour: 5,
    bathCost: 20000, tankCleanCost: 30000, vetCost: 300000,
    sellPetRate: 0.5, sellDeadPetRate: 0.4, fishSell: 30000,
    tankBaseCap: 6,
    breedLv: 5, breedCost: 200000, breedCooldownH: 72, maxPets: 24,
    xp: { feed: 6, bathe: 6, vet: 4, walk: 25, play: 15, tap: 1, breed: 10 }
  };
  // XP tích lũy để lên cấp (Lv1→10). Mua về Lv1, Lv5 mới sinh sản.
  const XP_STEPS = [0, 60, 150, 280, 450, 700, 1000, 1400, 1900, 2500];
  const RARITY = { 'Trắng': 1, 'Xám': 1, 'Nâu': 2, 'Đen': 3, 'Vàng': 4 };
  const RARITY_LABEL = { 1: 'Thường', 2: 'Hiếm', 3: 'Rất hiếm', 4: 'Cực hiếm' };
  const RARITY_STAR = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐', 4: '🌟🌟🌟🌟' };
  const SPECIES_ITEM = { cat: 'item-1046', dog: 'item-1047', rabbit: 'item-1048', parrot: 'item-1049', hamster: 'item-1050', fish: 'item-1051', golden: 'item-1052' };
  const WALK_SPECIES = { dog: 1, golden: 1, cat: 1, rabbit: 1 };
  const rarityOf = (p) => RARITY[p.color] || 1;
  const rarityLabel = (p) => `${RARITY_STAR[rarityOf(p)]} ${RARITY_LABEL[rarityOf(p)]}`;
  function levelOf(p) {
    const xp = Math.max(0, (p && p.xp) || 0);
    let lv = 1;
    for (let i = 1; i < XP_STEPS.length; i++) { if (xp >= XP_STEPS[i]) lv = i + 1; else break; }
    return Math.min(10, lv);
  }
  function xpProgress(p) {
    const xp = Math.max(0, (p && p.xp) || 0), lv = levelOf(p);
    const base = XP_STEPS[lv - 1] || 0, next = lv < 10 ? XP_STEPS[lv] : null;
    return { lv, xp, base, next, pct: next ? Math.round((xp - base) / (next - base) * 100) : 100 };
  }
  function addXp(p, n) {
    if (!p || !n) return;
    p.xp = ((p.xp || 0) + n);
    p.lv = levelOf(p);
  }

  // ---------- DANH MỤC SHOP THÚ ----------
  const P4 = ['cat', 'dog', 'golden', 'rabbit'];
  const PA = ['cat', 'dog', 'golden', 'rabbit', 'parrot', 'hamster'];
  const mk = (id, cat, emoji, name, price, forL, o) => Object.assign({ id: 'pt-' + id, cat, emoji, name, price, for: forL }, o || {});
  const PCATS = [['acc', '🎀', 'Phụ kiện'], ['outfit', '👕', 'Quần áo'], ['bowl', '🥣', 'Chén ăn'], ['food', '🍖', 'Thức ăn'], ['toy', '🧸', 'Đồ chơi'], ['home', '🏠', 'Chuồng & bể'], ['tankdecor', '🌿', 'Đồ bể']];
  const SLOT_LABEL = { acc: 'Phụ kiện', outfit: 'Quần áo', bowl: 'Chén ăn', toy: 'Đồ chơi', home: 'Nhà / Chuồng', gravel: 'Sỏi', plant: 'Cây thủy sinh', cave: 'Hang đá', light: 'Đèn', filter: 'Máy lọc' };
  const SLOTS_STD = ['acc', 'outfit', 'bowl', 'toy', 'home'];
  const SLOTS_TANK = ['home', 'gravel', 'plant', 'cave', 'light', 'filter'];

  const ITEMS = [
    // Phụ kiện
    mk('acc-bow', 'acc', '🎀', 'Nơ nhỏ', 40000, [...P4, 'parrot'], { slot: 'acc', desc: 'Một chiếc nơ xinh.' }),
    mk('acc-collar', 'acc', '🔔', 'Vòng cổ gắn chuông', 50000, P4, { slot: 'acc', desc: 'Leng keng mỗi khi chạy.' }),
    mk('acc-flower', 'acc', '🌸', 'Hoa cài đầu', 60000, [...P4, 'hamster'], { slot: 'acc', desc: 'Dịu dàng và đáng yêu.' }),
    mk('acc-shades', 'acc', '🕶️', 'Kính râm', 90000, PA, { slot: 'acc', desc: 'Ngầu hết cỡ.' }),
    mk('acc-party', 'acc', '🎉', 'Mũ sinh nhật', 100000, PA, { slot: 'acc', desc: 'Lúc nào cũng như đang tiệc.' }),
    mk('acc-scarf', 'acc', '🧣', 'Khăn quàng', 80000, P4, { slot: 'acc', desc: 'Ấm áp ngày se lạnh.' }),
    mk('acc-beanie', 'acc', '🧢', 'Mũ len', 120000, [...P4, 'hamster'], { slot: 'acc', desc: 'Mũ len tròn tròn.' }),
    mk('acc-crown', 'acc', '👑', 'Vương miện', 400000, PA, { slot: 'acc', desc: 'Bé là hoàng đế/hoàng hậu.' }),
    mk('acc-phones', 'acc', '🎧', 'Tai nghe', 250000, P4, { slot: 'acc', desc: 'Nghe nhạc cùng chủ.' }),
    mk('acc-wings', 'acc', '🦋', 'Cánh bướm', 500000, [...P4, 'hamster'], { slot: 'acc', desc: 'Như một tiểu tiên.' }),
    // Quần áo
    mk('out-tee', 'outfit', '👕', 'Áo thun', 300000, P4, { slot: 'outfit', desc: 'Áo thun mềm.' }),
    mk('out-sweater', 'outfit', '🧥', 'Áo len', 400000, P4, { slot: 'outfit', desc: 'Áo len dày dặn.' }),
    mk('out-dress', 'outfit', '👗', 'Váy', 500000, P4, { slot: 'outfit', desc: 'Váy xòe xinh xắn.' }),
    mk('out-rain', 'outfit', '🌧️', 'Áo mưa', 350000, ['cat', 'dog', 'golden'], { slot: 'outfit', desc: 'Đi dạo ngày mưa không ướt.' }),
    // Chén ăn
    mk('bowl-plain', 'bowl', '🥣', 'Bát tròn trơn', 30000, PA, { slot: 'bowl', fx: { feed: 1.1 }, desc: 'Ăn no hơn 10%.' }),
    mk('bowl-ceramic', 'bowl', '🍚', 'Bát gốm hoa', 80000, PA, { slot: 'bowl', fx: { feed: 1.2 }, desc: 'Ăn no hơn 20%.' }),
    mk('bowl-bone', 'bowl', '🦴', 'Bát hình xương', 90000, ['dog', 'golden'], { slot: 'bowl', fx: { feed: 1.2 }, desc: 'Ăn no hơn 20%.' }),
    mk('bowl-fish', 'bowl', '🐟', 'Bát hình cá', 90000, ['cat'], { slot: 'bowl', fx: { feed: 1.2 }, desc: 'Ăn no hơn 20%.' }),
    mk('bowl-hay', 'bowl', '🌾', 'Máng cỏ', 100000, ['rabbit'], { slot: 'bowl', fx: { feed: 1.2 }, desc: 'Ăn no hơn 20%.' }),
    mk('bowl-cup', 'bowl', '🥛', 'Cốc treo', 70000, ['parrot'], { slot: 'bowl', fx: { feed: 1.2 }, desc: 'Ăn no hơn 20%.' }),
    mk('bowl-mini', 'bowl', '🥄', 'Bát nhỏ', 40000, ['hamster'], { slot: 'bowl', fx: { feed: 1.1 }, desc: 'Ăn no hơn 10%.' }),
    mk('bowl-auto', 'bowl', '💧', 'Bình nước tự động', 150000, ['dog', 'golden', 'rabbit', 'hamster'], { slot: 'bowl', fx: { feed: 1.25 }, desc: 'Ăn no hơn 25%.' }),
    // Thức ăn (tiêu hao)
    mk('food-kibble', 'food', '🥣', 'Hạt khô chó mèo (túi 10 lần)', 100000, ['cat', 'dog', 'golden'], { gain: 30, mood: 3, pack: 10, desc: '+30 no mỗi lần.' }),
    mk('food-pate', 'food', '🥫', 'Pate mèo', 25000, ['cat'], { gain: 40, mood: 5, pack: 1, desc: '+40 no.' }),
    mk('food-bone', 'food', '🦴', 'Xương gặm', 40000, ['dog', 'golden'], { gain: 35, mood: 5, pack: 1, desc: '+35 no.' }),
    mk('food-carrot', 'food', '🥕', 'Bó cỏ & cà rốt (3 lần)', 60000, ['rabbit'], { gain: 35, mood: 3, pack: 3, desc: '+35 no mỗi lần.' }),
    mk('food-seed', 'food', '🌻', 'Hạt hướng dương (5 lần)', 40000, ['hamster'], { gain: 30, mood: 3, pack: 5, desc: '+30 no mỗi lần.' }),
    mk('food-birdmix', 'food', '🌽', 'Hạt vẹt trộn trái cây (5 lần)', 70000, ['parrot'], { gain: 35, mood: 3, pack: 5, desc: '+35 no mỗi lần.' }),
    mk('food-fishball', 'food', '🍤', 'Cá viên (20 lần)', 50000, ['fish'], { gain: 25, mood: 2, pack: 20, desc: '+25 no mỗi lần.' }),
    mk('food-treat', 'food', '🍪', 'Bánh thưởng', 30000, PA, { gain: 10, mood: 15, pack: 1, desc: '+10 no, +15 vui.' }),
    mk('food-premium', 'food', '⭐', 'Thức ăn cao cấp (3 lần)', 200000, [...PA, 'fish'], { gain: 60, mood: 8, pack: 3, desc: '+60 no, +8 vui mỗi lần.' }),
    // Đồ chơi
    mk('toy-ball', 'toy', '⚽', 'Quả bóng', 60000, ['dog', 'golden', 'cat'], { slot: 'toy', fx: { play: 1.25 }, desc: 'Chơi vui hơn 25%.' }),
    mk('toy-mouse', 'toy', '🐭', 'Chuột bông', 50000, ['cat'], { slot: 'toy', fx: { play: 1.25 }, desc: 'Chơi vui hơn 25%.' }),
    mk('toy-frisbee', 'toy', '🥏', 'Đĩa bay', 80000, ['dog', 'golden'], { slot: 'toy', fx: { play: 1.25 }, desc: 'Chơi vui hơn 25%.' }),
    mk('toy-wheel', 'toy', '🎡', 'Bánh xe chạy', 120000, ['hamster'], { slot: 'toy', fx: { play: 1.25 }, desc: 'Chơi vui hơn 25%.' }),
    mk('toy-mirror', 'toy', '🪞', 'Gương nhỏ', 60000, ['parrot'], { slot: 'toy', fx: { play: 1.25 }, desc: 'Chơi vui hơn 25%.' }),
    mk('toy-tunnel', 'toy', '🕳️', 'Ống chui', 90000, ['rabbit', 'hamster'], { slot: 'toy', fx: { play: 1.25 }, desc: 'Chơi vui hơn 25%.' }),
    // Chuồng, nhà, bể
    mk('home-bed', 'home', '🛏️', 'Ổ nệm', 250000, P4, { slot: 'home', fx: { regen: 1.3 }, desc: 'Hồi sức nhanh hơn 30%.' }),
    mk('home-cage-s', 'home', '🏠', 'Lồng hamster nhỏ', 300000, ['hamster'], { slot: 'home', fx: { regen: 1.3 }, desc: 'Hồi sức nhanh hơn 30%.' }),
    mk('home-cage-2', 'home', '🏘️', 'Lồng hamster 2 tầng', 900000, ['hamster'], { slot: 'home', fx: { regen: 1.4 }, desc: 'Hồi sức nhanh hơn 40%.' }),
    mk('home-birdcage', 'home', '🪺', 'Lồng chim', 800000, ['parrot'], { slot: 'home', fx: { regen: 1.3 }, desc: 'Hồi sức nhanh hơn 30%.' }),
    mk('home-hutch', 'home', '🏡', 'Chuồng thỏ', 1000000, ['rabbit'], { slot: 'home', fx: { regen: 1.4 }, desc: 'Hồi sức nhanh hơn 40%.' }),
    mk('home-cattree', 'home', '🌳', 'Cây leo mèo', 1200000, ['cat'], { slot: 'home', fx: { regen: 1.4 }, desc: 'Hồi sức nhanh hơn 40%.' }),
    mk('home-doghouse', 'home', '🛖', 'Nhà chó', 1500000, ['dog', 'golden'], { slot: 'home', fx: { regen: 1.4 }, desc: 'Hồi sức nhanh hơn 40%.' }),
    mk('tank-m', 'home', '🫙', 'Bể vừa (chứa 10 cá)', 2500000, ['fish'], { slot: 'home', cap: 10, desc: 'Chứa tối đa 10 cá.' }),
    mk('tank-l', 'home', '🪟', 'Bể lớn (chứa 16 cá)', 6000000, ['fish'], { slot: 'home', cap: 16, desc: 'Chứa tối đa 16 cá.' }),
    // Đồ bể
    mk('tank-gravel', 'tankdecor', '🪨', 'Sỏi màu', 60000, ['fish'], { slot: 'gravel', desc: 'Trang trí đáy bể.' }),
    mk('tank-plant', 'tankdecor', '🌿', 'Cây thủy sinh', 80000, ['fish'], { slot: 'plant', desc: 'Xanh mát cho bể.' }),
    mk('tank-cave', 'tankdecor', '🗿', 'Hang đá', 150000, ['fish'], { slot: 'cave', desc: 'Chỗ trốn cho cá.' }),
    mk('tank-light', 'tankdecor', '💡', 'Đèn bể', 200000, ['fish'], { slot: 'light', desc: 'Bể sáng lung linh.' }),
    mk('tank-filter', 'tankdecor', '🌀', 'Máy lọc nước', 400000, ['fish'], { slot: 'filter', fx: { cleanDecay: 0.5 }, desc: 'Nước bẩn chậm gấp đôi.' })
  ];
  // Cá: 5 màu đóng vai 5 loài, tên/giá/độ hiếm khác nhau
  const FISH_SPECIES = {
    'Trắng': { name: 'Cá Bạch Kim', price: 80000, sell: 20000 },
    'Xám': { name: 'Cá Tro', price: 90000, sell: 22000 },
    'Nâu': { name: 'Cá Đồng', price: 150000, sell: 40000 },
    'Đen': { name: 'Cá Hắc Long', price: 240000, sell: 70000 },
    'Vàng': { name: 'Cá Hoàng Kim', price: 380000, sell: 120000 }
  };
  const FISH_SELL = Object.keys(FISH_SPECIES).reduce((o, c) => { o[c] = FISH_SPECIES[c].sell; return o; }, {});
  Object.keys(COLORS).forEach(c => ['male', 'female'].forEach(g => {
    const sp = FISH_SPECIES[c] || { name: 'Cá ' + c, price: 80000 };
    ITEMS.push(mk('fish-' + colorKey(c) + '-' + g, 'fish', '🐟', sp.name + (g === 'male' ? ' (đực)' : ' (cái)'), sp.price, ['fish'], { fish: { g: g, c: c }, desc: 'Một bé ' + sp.name.toLowerCase() + ' thả vào bể cá.' }));
  }));
  const ITEM_BY_ID = {}; ITEMS.forEach(i => { ITEM_BY_ID[i.id] = i; });
  const okFor = (it, sp) => it.for === 'all' || (it.for || []).indexOf(sp) !== -1;

  // ---------- TIỆN ÍCH ----------
  const S = () => window.state;
  const now = () => (typeof nowTs === 'function' ? nowTs() : Date.now());
  const clamp = (v) => Math.max(0, Math.min(100, Math.round(v * 10) / 10));
  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const esc = (s) => (typeof escapeHtml === 'function' ? escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const money = (n) => (n || 0).toLocaleString('vi-VN') + 'đ';
  const isTank = (p) => !!(SPECIES[p.species] && SPECIES[p.species].tank);
  const hashStr = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 99991; return h; };

  function ensure() {
    const st = S();
    if (!Array.isArray(st.pets)) st.pets = st.pets && typeof st.pets === 'object' ? Object.values(st.pets) : [];
    if (!st.petBag || typeof st.petBag !== 'object') st.petBag = {};
    st.pets.forEach(p => {
      if (!p) return;
      if (typeof p.xp !== 'number') p.xp = 0;
      p.lv = levelOf(p);
      if (typeof p.breedTs !== 'number') p.breedTs = 0;
      if (!p.stats) p.stats = { food: 80, mood: 80, clean: 80, energy: 80 };
    });
    return st;
  }
  const findPet = (id) => ensure().pets.find(p => p && p.id === id);
  const bagQty = (id) => (ensure().petBag[id] || 0);
  function bagAdd(id, n) {
    const bag = ensure().petBag;
    bag[id] = (bag[id] || 0) + n;
    if (bag[id] <= 0) delete bag[id];
  }
  function save() { try { if (typeof saveStorage === 'function') saveStorage(); } catch (e) {} }
  function refreshWallet() {
    const el = document.getElementById('life-wallet-display');
    if (el) el.innerText = (S().walletBalance || 0).toLocaleString('vi-VN') + ' VNĐ';
  }
  function spend(n) {
    if ((S().walletBalance || 0) < n) { toast('Số dư ví không đủ (' + money(n) + ').'); return false; }
    S().walletBalance -= n;
    return true;
  }
  function commit() { save(); refreshWallet(); render(); try { if (window.__mallGear && typeof renderShopUI === 'function') renderShopUI(); if (typeof window.refreshUiBag === 'function') window.refreshUiBag(); } catch (e) {} }

  // ---------- THÚ: TRẠNG THÁI ----------
  function dayKey() { return new Date(now()).toDateString(); }
  function ensureDaily(p) {
    if (!p.daily || p.daily.d !== dayKey()) p.daily = { d: dayKey(), walks: 0, plays: 0, taps: 0 };
    return p.daily;
  }
  function wornFx(p) {
    const fx = { feed: 1, play: 1, regen: 1, cleanDecay: 1 };
    const w = p.worn || {};
    Object.keys(w).forEach(slot => {
      const it = ITEM_BY_ID[w[slot]];
      if (it && it.fx) Object.keys(it.fx).forEach(k => { fx[k] = (fx[k] || 1) * it.fx[k]; });
    });
    return fx;
  }
  function tankCap(p) {
    const it = p.worn && ITEM_BY_ID[p.worn.home];
    return Math.max(TUNE.tankBaseCap, (it && it.cap) || 0);
  }
  function tickPet(p, t) {
    t = t || now();
    if (!p.stats) p.stats = { food: 80, mood: 80, clean: 80, energy: 80 };
    if (!p.tickTs) p.tickTs = t;
    const dt = Math.max(0, t - p.tickTs);
    p.tickTs = t;
    const h = Math.min(dt, TUNE.decayCapHours * 3600000) / 3600000;
    if (h <= 0) return;
    const fx = wornFx(p), st = p.stats;
    st.food = clamp(st.food - TUNE.foodPerHour * h);
    st.mood = clamp(st.mood - (st.food < 25 ? TUNE.moodPerHourHungry : TUNE.moodPerHour) * h);
    st.clean = clamp(st.clean - TUNE.cleanPerHour * h * fx.cleanDecay);
    if (!isTank(p)) st.energy = clamp(st.energy + TUNE.energyRegenPerHour * h * fx.regen);
    if (!p.sick && (st.food < 8 || st.clean < 8)) p.sick = true;
    if (p.sick) st.mood = Math.min(st.mood, 40);
  }
  function tickAll() { ensure().pets.forEach(p => p && tickPet(p)); }
  function poseOf(p) {
    const st = p.stats || {};
    if (p.sick || p.injured || st.food < 35 || st.mood < 35) return 'hungry';
    if (!isTank(p) && st.energy < 20) return 'sleep';
    if (st.mood >= 80 && st.food >= 50) return 'happy';
    return 'idle';
  }

  // ---------- GIAO DIỆN: CSS ----------
  function injectStyle() {
    if (document.getElementById('pet-style')) return;
    const st = document.createElement('style');
    st.id = 'pet-style';
    st.textContent = `
      .pet-nav{display:flex;gap:6px}
      .pet-nav button{flex:1;padding:8px 4px;border-radius:12px;border:2px solid var(--app-green);background:#fff;color:var(--app-dark-green);font-weight:bold;font-size:0.8rem;cursor:pointer}
      .pet-nav button.on{background:var(--app-green);color:#fff}
      .pet-card{background:#fff;border:2px solid var(--app-green);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px}
      .pet-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
      .pet-name{font-weight:bold;color:var(--app-dark-green);font-size:1rem}
      .pet-sub{font-size:0.75rem;color:#718096}
      .pet-bars{display:grid;grid-template-columns:1fr 1fr;gap:3px 10px}
      .pet-bar{display:flex;align-items:center;gap:5px;font-size:0.66rem;color:#4a5568}
      .pet-bar .tr{flex:1;height:6px;background:#edf2f7;border-radius:5px;overflow:hidden}
      .pet-bar .tr i{display:block;height:100%;border-radius:5px}
      .pet-bar b{width:20px;text-align:right;font-size:0.62rem}
      .pet-btns{display:flex;flex-wrap:wrap;gap:4px}
      .pet-btns .btn{padding:4px 8px;font-size:0.7rem}
      .pet-young{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;transition:transform .35s ease;transform-origin:50% 100%}
      .pet-lv{display:flex;align-items:center;gap:6px;font-size:0.64rem;color:#718096}
      .pet-lv-badge{background:var(--app-green);color:#fff;border-radius:8px;padding:1px 6px;font-weight:bold;font-size:0.64rem;white-space:nowrap}
      .pet-lv-track{flex:1;height:6px;background:#edf2f7;border-radius:4px;overflow:hidden}
      .pet-lv-track i{display:block;height:100%;background:linear-gradient(90deg,#fbb6ce,#ec6f9a)}
      .pet-lv-txt{white-space:nowrap}
      .pet-rarity{font-size:0.62rem;color:#b7791f;background:#fefcbf;border-radius:8px;padding:1px 6px;white-space:nowrap}
      .pet-tag{font-size:0.62rem;font-weight:bold;border-radius:8px;padding:1px 6px;white-space:nowrap}
      .pet-tag.sick{color:#c53030;background:#fed7d7}
      .pet-bubble{position:absolute;bottom:6px;width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.65);animation:petBubble 5s linear infinite;pointer-events:none}
      .pg-canvas{width:100%;max-width:340px;display:block;margin:0 auto;border-radius:12px;touch-action:none;background:#eaf7ff}
      .pg-hint{font-size:0.76rem;color:#718096;text-align:center;line-height:1.4}
      .pg-score{display:flex;justify-content:space-between;font-size:0.76rem;color:#2d3748;font-weight:bold;padding:0 4px}
      .pg-lanes{display:flex;gap:6px}
      .pg-lanes button{flex:1;padding:10px 4px;border-radius:10px;border:2px solid var(--app-green);background:#fff;color:var(--app-dark-green);font-weight:bold;font-size:0.76rem;cursor:pointer}
      .pg-lanes button.on{background:var(--app-green);color:#fff}
      html.pet-paused .pet-img,html.pet-paused .pet-emoji,html.pet-paused .pet-fish,html.pet-paused .pet-fish>span,html.pet-paused .pet-fish>img,html.pet-paused .pet-bubble{animation-play-state:paused!important}
      .pet-chips{display:flex;flex-wrap:wrap;gap:6px}
      .pet-chip{padding:5px 10px;border-radius:14px;border:2px solid #e2e8f0;background:#fff;font-size:0.76rem;color:#4a5568;cursor:pointer}
      .pet-chip.on{border-color:var(--app-dark-green);background:#f0faf5;color:var(--app-dark-green);font-weight:bold}
      .pet-stage{position:relative;width:130px;height:130px;margin:0 auto;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;border-radius:16px;overflow:hidden;background:url('bg/pet_day.jpg') center bottom/cover no-repeat;box-shadow:inset 0 0 0 2px rgba(255,255,255,.55)}
      .pet-img{max-width:100%;max-height:100%;object-fit:contain;transform-origin:50% 100%;animation:petBreathe 3.2s ease-in-out infinite}
      .pet-emoji{font-size:70px;line-height:1;transform-origin:50% 100%;animation:petBreathe 3.2s ease-in-out infinite}
      .pose-sleep .pet-img,.pose-sleep .pet-emoji{animation-duration:5.5s}
      .pose-happy .pet-img,.pose-happy .pet-emoji{animation:petHop 1.1s ease-in-out infinite}
      .pose-hungry .pet-img,.pose-hungry .pet-emoji{animation:petSad 2.8s ease-in-out infinite}
      .pet-jump .pet-img,.pet-jump .pet-emoji{animation:petJump .5s ease-out 1}
      .pet-ov{position:absolute;pointer-events:none}
      .pet-ov.acc{top:2px;right:8px;font-size:26px}
      .pet-ov.outfit{bottom:6px;left:50%;transform:translateX(-50%);font-size:26px}
      .pet-ovimg{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none}
      .pet-fx{position:absolute;right:4px;top:0;font-weight:bold;color:#3182ce;font-size:1.1rem;pointer-events:none}
      .pose-sleep .pet-fx{animation:petZ 2.2s ease-in-out infinite}
      .pet-heart{position:absolute;pointer-events:none;font-size:20px;animation:petHeart .9s ease-out forwards}
      .pet-tank{position:relative;height:130px;border-radius:14px;overflow:hidden;background:linear-gradient(#bee3f8,#4299e1);border:2px solid #90cdf4}
      .pet-tank .dec{position:absolute;font-size:22px;pointer-events:none}
      .pet-fish{position:absolute;left:2%;animation:petSwim ease-in-out infinite alternate}
      .pet-fish>span,.pet-fish>img{display:block;animation:petFlip linear infinite;font-size:22px}
      .pet-fish img{width:34px;height:auto}
      .pet-item{display:flex;align-items:center;gap:8px;background:#f7faf8;border:1px solid #e2e8f0;border-radius:12px;padding:8px}
      .pet-item .ic{font-size:1.6rem;width:38px;text-align:center}
      .pet-item .ic img{width:34px;height:34px;object-fit:contain}
      .pet-item .tx{flex:1;min-width:0}
      .pet-item .tx b{font-size:0.85rem;color:#2d3748}
      .pet-item .tx div{font-size:0.72rem;color:#718096;line-height:1.35}
      #pet-toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:rgba(45,55,72,.92);color:#fff;padding:8px 14px;border-radius:16px;font-size:0.82rem;z-index:300;max-width:86vw;text-align:center;display:none}
      @keyframes petBreathe{0%,100%{transform:scale(1,1) rotate(0)}30%{transform:scale(1.02,.98) rotate(-1.2deg)}60%{transform:scale(1.03,.97) rotate(1deg)}}
      @keyframes petHop{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      @keyframes petSad{0%,100%{transform:rotate(0)}50%{transform:rotate(-2.5deg)}}
      @keyframes petJump{0%{transform:translateY(0)}40%{transform:translateY(-20px) scale(1.05,.95)}100%{transform:translateY(0)}}
      @keyframes petZ{0%{opacity:0;transform:translateY(6px)}50%{opacity:1}100%{opacity:0;transform:translateY(-10px)}}
      @keyframes petHeart{0%{opacity:1;transform:translateY(0) scale(.8)}100%{opacity:0;transform:translateY(-44px) scale(1.2)}}
      @keyframes petSwim{from{transform:translateX(0)}to{transform:translateX(96px)}}
      @keyframes petFlip{0%,49.9%{transform:scaleX(-1)}50%,100%{transform:scaleX(1)}}
      @keyframes petBubble{0%{transform:translateY(0);opacity:0}12%{opacity:.8}100%{transform:translateY(-112px);opacity:0}}
      @media (prefers-reduced-motion: reduce){.pet-img,.pet-emoji,.pet-fish,.pet-fish>span,.pet-fish>img,.pet-bubble{animation:none!important}}
    `;
    document.head.appendChild(st);
  }

  // ---------- GIAO DIỆN: THÀNH PHẦN ----------
  const failed = new Set();
  function petSrc(p, pose) { return PET_ASSET_BASE + p.species + '_' + p.gender + '_' + colorKey(p.color) + '_' + pose + '.png'; }
  function imgOrEmoji(src, emoji, cls) {
    if (failed.has(src)) return `<span class="${cls}">${emoji}</span>`;
    return `<img class="${cls}" src="${src}" alt="" onerror="PET.imgFail(this)"><span class="${cls}" style="display:none">${emoji}</span>`;
  }
  function stageHtml(p) {
    const sp = SPECIES[p.species], pose = poseOf(p), w = p.worn || {};
    let ov = '';
    ['outfit', 'acc'].forEach(slot => {
      const it = w[slot] && ITEM_BY_ID[w[slot]];
      if (!it) return;
      ov += ITEM_IMG[it.id] ? `<img class="pet-ovimg" src="${ITEM_IMG[it.id]}" alt="">` : `<span class="pet-ov ${slot}">${it.emoji}</span>`;
    });
    const fx = pose === 'sleep' ? '<span class="pet-fx">💤</span>' : '';
    // Lv1 còn nhỏ, lớn dần tới Lv5; ảnh không đổi, chỉ scale cả khối.
    const sc = (0.7 + 0.06 * (Math.min(5, levelOf(p)) - 1)).toFixed(2);
    return `<div class="pet-stage pose-${pose}" onclick="PET.tap('${p.id}',this,event)"><div class="pet-young" style="transform:scale(${sc})">${imgOrEmoji(petSrc(p, pose), sp.emoji, 'pet-img')}${ov}</div>${fx}</div>`;
  }
  function bar(icon, val, color) {
    return `<div class="pet-bar"><span>${icon}</span><div class="tr"><i style="width:${Math.round(val)}%;background:${color}"></i></div><b>${Math.round(val)}</b></div>`;
  }
  function itemIcon(it) { return ITEM_IMG[it.id] ? `<img src="${ITEM_IMG[it.id]}" alt="">` : it.emoji; }
  const forEmoji = (it) => (it.for || []).map(s => (SPECIES[s] || {}).emoji || '').join('');

  function fishHtml(f) {
    const h = hashStr(f.id || '');
    const top = 8 + (h % 55), dur = 6 + (h % 7), delay = -(h % 9);
    const src = PET_ASSET_BASE + 'fish_' + f.g + '_' + colorKey(f.c) + '_idle.png';
    const inner = failed.has(src) ? `<span style="animation-duration:${dur * 2}s;animation-delay:${delay}s">${colorKey(f.c) === 'vang' ? '🐠' : '🐟'}</span>`
      : `<img src="${src}" alt="" style="animation-duration:${dur * 2}s;animation-delay:${delay}s" onerror="PET.fishImgFail(this)"><span style="display:none;animation-duration:${dur * 2}s;animation-delay:${delay}s">🐟</span>`;
    return `<div class="pet-fish" style="top:${top}%;animation-duration:${dur}s;animation-delay:${delay}s">${inner}</div>`;
  }
  function tankHtml(p) {
    const w = p.worn || {};
    let dec = '';
    if (w.gravel) dec += `<span class="dec" style="bottom:2px;left:6px">${ITEM_BY_ID[w.gravel].emoji}</span>`;
    if (w.plant) dec += `<span class="dec" style="bottom:4px;left:42%">${ITEM_BY_ID[w.plant].emoji}</span>`;
    if (w.cave) dec += `<span class="dec" style="bottom:2px;right:10px;font-size:30px">${ITEM_BY_ID[w.cave].emoji}</span>`;
    if (w.light) dec += `<span class="dec" style="top:2px;right:8px">${ITEM_BY_ID[w.light].emoji}</span>`;
    if (w.filter) dec += `<span class="dec" style="top:2px;left:8px">${ITEM_BY_ID[w.filter].emoji}</span>`;
    let bub = '';
    for (let i = 0; i < 3; i++) bub += `<span class="pet-bubble" style="left:${16 + i * 30}%;animation-delay:${(i * 1.4).toFixed(1)}s"></span>`;
    const fish = (p.fish || []).map(fishHtml).join('');
    return `<div class="pet-tank">${dec}${bub}${fish}</div>`;
  }

  function petCardHtml(p) {
    ensureDaily(p);
    const sp = SPECIES[p.species], tank = isTank(p), st = p.stats;
    const gIcon = tank ? '' : (p.gender === 'male' ? '♂' : '♀');
    const q = xpProgress(p);
    const sub = tank
      ? `${(p.fish || []).length}/${tankCap(p)} cá`
      : `${sp.name} · ${gIcon} · ${esc(p.color)} · ${RARITY_LABEL[rarityOf(p)]}`;
    let tags = '';
    if (p.sick) tags += `<span class="pet-tag sick">${tank ? '🤢 Nước bẩn' : '🤒 Đang ốm'}</span>`;
    if (p.injured) tags += `<span class="pet-tag sick">🩹 Bị thương</span>`;
    if (!tank) tags += `<span class="pet-rarity">${rarityLabel(p)}</span>`;
    const walks = TUNE.walksPerDay - p.daily.walks, plays = TUNE.playsPerDay - p.daily.plays;
    const bars = `<div class="pet-bars">${bar('🍖', st.food, '#ed8936')}${bar('😊', st.mood, '#ec6f9a')}${bar(tank ? '💧' : '🛁', st.clean, '#4299e1')}${tank ? '' : bar('⚡', st.energy, '#ecc94b')}</div>`;
    const lvRow = tank ? '' : `<div class="pet-lv"><span class="pet-lv-badge">Lv.${q.lv}</span><div class="pet-lv-track"><i style="width:${q.pct}%"></i></div><span class="pet-lv-txt">${q.next ? q.xp + '/' + q.next + ' XP' : 'MAX'}</span></div>`;
    const playName = { cat: '🐾 Đuổi chấm sáng', dog: '🥏 Hứng đĩa', golden: '🥏 Hứng đĩa' }[p.species] || '🎮 Chơi';
    const vetBtn = (p.sick || p.injured) ? `<button class="btn btn-pink" onclick="PET.vet('${p.id}')">🩺 Khám (${money(TUNE.vetCost)})</button>` : '';
    const btns = tank
      ? `<button class="btn" onclick="PET.openFeed('${p.id}')">🍤 Cho ăn</button>
         <button class="btn" onclick="PET.bathe('${p.id}')">💧 Thay nước (${money(TUNE.tankCleanCost)})</button>
         <button class="btn" onclick="PET.openAddFish('${p.id}')">🐟 Chợ cá</button>
         <button class="btn btn-outline" onclick="PET.openEquip('${p.id}')">🪴 Đồ bể</button>
         ${vetBtn}
         <button class="btn btn-outline" onclick="PET.rename('${p.id}')">✏️ Tên</button>
         <button class="btn btn-outline" onclick="PET.sellPet('${p.id}')">💰 Bán</button>`
      : `<button class="btn" onclick="PET.openFeed('${p.id}')">🍖 Cho ăn</button>
         <button class="btn" onclick="PET.bathe('${p.id}')">🛁 Tắm (${money(TUNE.bathCost)})</button>
         <button class="btn" onclick="PET.play('${p.id}')">${playName} (${plays})</button>
         ${WALK_SPECIES[p.species] ? `<button class="btn btn-pink" onclick="PET.openWalk('${p.id}')">🦮 Dắt đi chơi (${walks})</button>` : ''}
         ${vetBtn}
         <button class="btn btn-outline" onclick="PET.openEquip('${p.id}')">👕 Đồ mặc</button>
         <button class="btn btn-outline" onclick="PET.openBreed('${p.id}')">🍼 Lai tạo</button>
         <button class="btn btn-outline" onclick="PET.rename('${p.id}')">✏️ Tên</button>
         <button class="btn btn-outline" onclick="PET.sellPet('${p.id}')">💰 Bán</button>`;
    let fishRow = '';
    if (tank && (p.fish || []).length) {
      fishRow = `<div class="pet-chips">${p.fish.map(f => `<span class="pet-chip" onclick="PET.sellFish('${p.id}','${f.id}')" title="Bấm để bán">${f.g === 'male' ? '♂' : '♀'} ${esc((FISH_SPECIES[f.c] || {}).name || 'Cá ' + f.c)} · ${money(FISH_SELL[f.c] || TUNE.fishSell)}</span>`).join('')}</div>`;
    }
    return `<div class="pet-card">
      <div class="pet-head"><div><div class="pet-name">${tank ? '🫧' : sp.emoji} ${esc(p.name)}</div><div class="pet-sub">${sub}</div></div><div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;justify-content:flex-end">${tags}</div></div>
      ${tank ? tankHtml(p) : stageHtml(p)}
      ${lvRow}
      ${bars}
      ${fishRow}
      <div class="pet-btns">${btns}</div>
    </div>`;
  }

  // ---------- GIAO DIỆN: MÀN HÌNH CHÍNH CỦA TAB ----------
  let view = 'mine', shopCat = 'animal', selPet = null;
  function viewMine() {
    const pets = ensure().pets.filter(Boolean);
    if (!pets.length) {
      return `<div class="pet-card" style="text-align:center;color:#718096;font-size:0.85rem;line-height:1.6;">
        Bạn chưa nuôi bé nào.<br>Mua thú ở <b>🛍️ Teemall → Shop thú cưng</b>, rồi vào <b>🎒 Túi → Thú cưng</b> bấm <b>🐾 Nuôi</b> để nhận nuôi nhé.
        <div class="pet-btns" style="justify-content:center;margin-top:8px;"><button class="btn btn-pink" onclick="PET.view('shop')">🏪 Đến shop thú cưng</button><button class="btn btn-outline" onclick="PET.view('bag')">🎒 Mở túi</button></div>
      </div>`;
    }
    if (!pets.some(x => x.id === selPet)) selPet = pets[0].id;
    const cur = pets.find(x => x.id === selPet);
    const sw = pets.length > 1 ? `<div class="pet-chips">${pets.map(x => `<span class="pet-chip ${x.id === selPet ? 'on' : ''}" onclick="PET.selPet('${x.id}')">${isTank(x) ? '🫧' : SPECIES[x.species].emoji} ${esc(x.name)}</span>`).join('')}</div>` : '';
    const dock = `<div class="pet-card"><div style="font-weight:bold;color:var(--app-dark-green);font-size:0.85rem;">Túi & cửa hàng</div><div class="pet-btns"><button class="btn btn-outline" onclick="PET.view('bag')">🎒 Túi thú cưng</button><button class="btn btn-outline" onclick="PET.view('shop')">🏪 Cửa hàng thú</button></div></div>`;
    return sw + petCardHtml(cur) + dock;
  }
  function viewShop() {
    const chips = PCATS.map(c => `<span class="pet-chip ${shopCat === c[0] ? 'on' : ''}" onclick="PET.shopCat('${c[0]}')">${c[1]} ${c[2]}</span>`).join('');
    const mine = {}; ensure().pets.forEach(p => { if (p) mine[p.species] = 1; });
    const rows = ITEMS.filter(i => i.cat === shopCat).map(it => {
      const owned = bagQty(it.id);
      const fit = Object.keys(mine).some(s => okFor(it, s));
      const packTxt = it.pack > 1 ? ` · gói ${it.pack} lần` : '';
      return `<div class="pet-item">
        <div class="ic">${itemIcon(it)}</div>
        <div class="tx"><b>${esc(it.name)}</b><div>${esc(it.desc || '')}${packTxt}</div><div>Hợp với: ${forEmoji(it)}${fit ? '' : ' <span style="color:#a0aec0">(chưa có thú hợp)</span>'}${owned ? ` · Đang có: <b>${owned}</b>` : ''}</div></div>
        <button class="btn btn-pink" onclick="PET.buy('${it.id}')">${money(it.price)}</button>
      </div>`;
    }).join('');
    return `<div class="pet-card"><div style="font-weight:bold;color:var(--app-dark-green)">🏪 Cửa hàng thú cưng</div><div class="pet-chips">${chips}</div><div style="display:flex;flex-direction:column;gap:6px">${rows}</div></div>`;
  }
  function gearShopHtml() {
    const cats = [['animal', '🐾', 'Thú cưng']].concat(PCATS);
    const side = cats.map(c => {
      const on = shopCat === c[0];
      return `<button onclick="PET.shopCat('${c[0]}')" class="mall-cat ${on ? 'on' : ''}"><span>${c[1]}</span><small>${c[2]}</small></button>`;
    }).join('');
    const mine = {}; ensure().pets.forEach(x => { if (x) mine[x.species] = 1; });
    let cards;
    if (shopCat === 'animal') cards = (typeof window.petAnimalGridHtml === 'function') ? window.petAnimalGridHtml() : '';
    else cards = ITEMS.filter(i => i.cat === shopCat).map(it => {
      const owned = bagQty(it.id);
      const fit = Object.keys(mine).some(s => okFor(it, s));
      const packTxt = it.pack > 1 ? ` · gói ${it.pack} lần` : '';
      return `<div style="background:#fff;border-radius:10px;overflow:hidden;border:1px solid #f1e3dd;display:flex;flex-direction:column;min-width:0;">
        <div class="pet-bigic" style="height:88px;background:linear-gradient(135deg,#fff3ef,#ffe4d9);">${itemIcon(it)}</div>
        <div style="padding:6px 8px;display:flex;flex-direction:column;gap:3px;flex:1;">
          <div style="font-size:0.78rem;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.5em;">${esc(it.name)}</div>
          <div style="color:#ee4d2d;font-weight:bold;font-size:0.9rem;">${money(it.price)}</div>
          <div style="font-size:0.66rem;color:#888;line-height:1.3;">Hợp: ${forEmoji(it)}${packTxt}${fit ? '' : ' <span style="color:#bbb">(chưa có thú hợp)</span>'}${owned ? ` · Có <b>${owned}</b>` : ''}</div>
          <button class="btn" style="background:#ee4d2d;color:#fff;border:none;padding:6px;font-size:0.78rem;margin-top:2px;" onclick="PET.buy('${it.id}')">🛒 Mua ngay</button>
        </div></div>`;
    }).join('');
    if (!cards) cards = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:0.85rem;padding:24px;">Chưa có sản phẩm.</div>';
    const cur = cats.find(c => c[0] === shopCat) || cats[0];
    return `<div class="mall-split"><div class="mall-side">${side}</div>
      <div class="mall-main"><div class="mall-title">${cur[1]} ${cur[2]}</div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;">${cards}</div></div></div>`;
  }
  function viewBag() {
    const bag = ensure().petBag;
    const ids = Object.keys(bag).filter(id => bag[id] > 0 && ITEM_BY_ID[id]);
    const body = ids.length ? ids.map(id => {
      const it = ITEM_BY_ID[id];
      return `<div class="pet-item"><div class="ic">${itemIcon(it)}</div><div class="tx"><b>${esc(it.name)}</b><div>Hợp với: ${forEmoji(it)}</div></div><b>x${bag[id]}</b></div>`;
    }).join('') : '<div style="font-size:0.82rem;color:#888;text-align:center;">Kho trống. Mua đồ ở tab Cửa hàng, rồi bấm Đồ mặc trên thẻ thú để dùng.</div>';
    return `<div class="pet-card"><div style="font-weight:bold;color:var(--app-dark-green)">🎒 Kho đồ thú cưng</div>${body}</div>`;
  }
  function render() {
    const root = document.getElementById('pet-root');
    if (!root) return;
    injectStyle();
    ensure();
    tickAll();
    root.innerHTML = viewMine();
  }

  // ---------- TOAST + MODAL ----------
  let toastTimer = null;
  function toast(msg) {
    let el = document.getElementById('pet-toast');
    if (!el) { el = document.createElement('div'); el.id = 'pet-toast'; document.body.appendChild(el); }
    el.innerText = msg; el.style.display = 'block';
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.style.display = 'none'; }, 2600);
  }
  function modalEl() {
    let m = document.getElementById('pet-modal');
    if (!m) {
      m = document.createElement('div'); m.id = 'pet-modal'; m.className = 'modal';
      m.innerHTML = '<div class="modal-content"><div class="modal-header"><h3 id="pet-modal-title"></h3><button class="btn btn-outline" onclick="PET.closeModal()">✖</button></div><div id="pet-modal-body" style="display:flex;flex-direction:column;gap:8px;"></div></div>';
      document.body.appendChild(m);
    }
    return m;
  }
  function openModal2(title, html) {
    const m = modalEl();
    document.getElementById('pet-modal-title').innerText = title;
    document.getElementById('pet-modal-body').innerHTML = html;
    m.classList.add('active');
  }
  function closeModal2() {
    if (game) gameStop(true, true);
    const m = document.getElementById('pet-modal'); if (m) m.classList.remove('active');
  }

  // ---------- NHẬN NUÔI / BÁN TỪ TÚI ĐỒ ----------
  function parseVariants(obj) {
    const v = obj.variants || {}, txt = (obj.desc || '') + ' ' + (obj.singleName || '') + ' ' + (obj.name || '');
    let g = v.gender || (/Giới tính:\s*(Đực|Cái)/.exec(txt) || [])[1];
    let c = v.fur || (/Màu lông:\s*(Trắng|Vàng|Xám|Đen|Nâu)/.exec(txt) || [])[1];
    return { gender: g === 'Đực' ? 'male' : g === 'Cái' ? 'female' : null, color: c || null };
  }
  function paidOf(obj) {
    if (obj.paid) return obj.paid;
    try { const c = SHOP_CATALOG.find(i => i.id === obj.id); if (c) return c.price; } catch (e) {}
    return 0;
  }
  function speciesBasePrice(p) {
    try { const c = SHOP_CATALOG.find(i => i.id === SPECIES_ITEM[p.species]); return (c && c.price) || 1000000; } catch (e) { return 1000000; }
  }
  // Thú mua về bán lại 50% (hiếm hơn thì nhích lên). Con non lai tạo bán theo độ hiếm + cấp.
  function sellValue(p) {
    if (isTank(p)) {
      const v = (p.paid || 0) * 0.5 + (p.fish || []).reduce((s, f) => s + (FISH_SELL[f.c] || TUNE.fishSell), 0);
      return Math.round(v / 1000) * 1000;
    }
    const r = rarityOf(p), lv = levelOf(p);
    const v = p.paid
      ? p.paid * (0.5 + 0.06 * (r - 1))
      : speciesBasePrice(p) * (0.25 + 0.15 * (r - 1)) * (0.7 + 0.05 * (lv - 1));
    return Math.max(1000, Math.round(v / 1000) * 1000);
  }
  // Con non thừa hưởng màu bố/mẹ; màu càng hiếm càng khó ra.
  function pickBabyColor(c1, c2) {
    const colors = Object.keys(RARITY);
    const w = colors.map(c => 1 + (5 - RARITY[c]) * 2 + (c === c1 ? 6 : 0) + (c === c2 ? 6 : 0));
    const total = w.reduce((s, x) => s + x, 0);
    let r = Math.random() * total;
    for (let i = 0; i < colors.length; i++) { r -= w[i]; if (r <= 0) return colors[i]; }
    return colors[colors.length - 1];
  }
  function addPetMemory(charId, text) {
    if (!charId || !text) return;
    const st = S();
    if (!st.petMemories || typeof st.petMemories !== 'object') st.petMemories = {};
    const arr = st.petMemories[charId] || (st.petMemories[charId] = []);
    arr.push({ ts: now(), text: String(text).slice(0, 240) });
    if (arr.length > 20) arr.splice(0, arr.length - 20);
  }
  function takeOneFromInv(obj) {
    const inv = S().inventory || [];
    const idx = inv.findIndex(x => x.uniqueId === obj.uniqueId);
    const have = obj.qty || 1;
    const base = obj.singleName || String(obj.name || '').replace(/\s*\(x\d+\).*/, '');
    if (have > 1) { obj.qty = have - 1; obj.name = `${base} (x${obj.qty})`; }
    else if (idx >= 0) inv.splice(idx, 1);
    return base;
  }
  function findInv(uid) { return (S().inventory || []).find(x => x.uniqueId === uid); }

  function adopt(uid) {
    const obj = findInv(uid);
    if (!obj || !PET_BY_ITEM[obj.id]) return;
    const sp = PET_BY_ITEM[obj.id], tank = SPECIES[sp].tank;
    const defName = tank ? 'Bể cá nhà mình' : DEFAULT_NAMES[rand(0, DEFAULT_NAMES.length - 1)];
    openModal2(tank ? '🫧 Đặt tên cho bể cá' : '🐾 Đặt tên cho bé ' + SPECIES[sp].name.toLowerCase(), `
      <div style="font-size:0.85rem;color:#718096;">Bé sẽ về nhà bạn ngay sau khi đặt tên.</div>
      <input id="pet-name-input" type="text" maxlength="24" value="${esc(defName)}" onkeydown="if(event.key==='Enter')PET.confirmAdopt('${uid}')" style="padding:10px;border-radius:10px;border:2px solid var(--app-green);font-size:0.9rem;background:var(--surface-2);color:var(--text);">
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline" style="flex:1;" onclick="PET.closeModal()">Hủy</button>
        <button class="btn btn-pink" style="flex:1;" onclick="PET.confirmAdopt('${uid}')">🐾 Nhận nuôi</button>
      </div>`);
    setTimeout(function () { const inp = document.getElementById('pet-name-input'); if (inp) { inp.focus(); inp.select(); } }, 60);
  }
  function confirmAdopt(uid) {
    const inp = document.getElementById('pet-name-input');
    const name = inp ? inp.value.trim().slice(0, 24) : '';
    closeModal2();
    adoptNow(uid, name);
  }
  function adoptNow(uid, name) {
    const obj = findInv(uid);
    if (!obj || !PET_BY_ITEM[obj.id]) return;
    ensure();
    const sp = PET_BY_ITEM[obj.id], v = parseVariants(obj), t = now();
    const tank = SPECIES[sp].tank;
    const defName = tank ? 'Bể cá nhà mình' : DEFAULT_NAMES[rand(0, DEFAULT_NAMES.length - 1)];
    const p = {
      id: 'pet-' + t.toString(36) + Math.random().toString(36).slice(2, 6),
      species: sp, name: (name || defName).slice(0, 24),
      gender: v.gender || (Math.random() < 0.5 ? 'male' : 'female'),
      color: tank ? 'Bể' : (v.color || 'Trắng'),
      born: t, tickTs: t, stats: { food: 80, mood: 80, clean: 80, energy: 80 },
      worn: {}, daily: { d: '', walks: 0, plays: 0, taps: 0 }, paid: paidOf(obj),
      xp: 0, lv: 1, breedTs: 0
    };
    if (tank) {
      const cs = Object.keys(COLORS);
      p.fish = ['male', 'female'].map(g => ({ id: 'f-' + t.toString(36) + Math.random().toString(36).slice(2, 6), g: g, c: cs[rand(0, cs.length - 1)], born: t }));
    }
    takeOneFromInv(obj);
    S().pets.push(p);
    save();
    if (typeof renderLifeModeUI === 'function') renderLifeModeUI();
    toast('🐾 Đã nhận nuôi ' + p.name + '!');
    view = 'mine';
    if (typeof switchLifeSub === 'function') switchLifeSub('pet');
  }
  function sellInv(uid) {
    const obj = findInv(uid);
    if (!obj || !PET_BY_ITEM[obj.id]) return;
    const price = Math.round(paidOf(obj) * TUNE.sellPetRate / 1000) * 1000;
    if (!confirm(`Bán 1x ${obj.singleName || obj.name} với giá ${money(price)}?`)) return;
    takeOneFromInv(obj);
    S().walletBalance = (S().walletBalance || 0) + price;
    save();
    if (typeof renderLifeModeUI === 'function') renderLifeModeUI();
    toast('💰 Đã bán, nhận ' + money(price));
  }
  function invButtons(obj) {
    if (!obj || !PET_BY_ITEM[obj.id]) return '';
    const st = 'padding:2px 8px;font-size:0.72rem;';
    return ` <button class="btn btn-outline" style="${st}" onclick="openSelectCharGiftModal('${obj.uniqueId}')">🎁 Tặng</button>`
      + ` <button class="btn btn-outline" style="${st}" onclick="PET.adopt('${obj.uniqueId}')">🐾 Nuôi</button>`
      + ` <button class="btn btn-outline" style="${st}" onclick="PET.sellInv('${obj.uniqueId}')">💰 Bán</button>`;
  }

  // ---------- HÀNH ĐỘNG CHĂM SÓC ----------
  function guardAlive(p) { tickPet(p); return true; }
  function openFeed(id) {
    const p = findPet(id); if (!p) return; guardAlive(p);
    if (p.stats.food >= 95) { render(); return toast(p.name + ' còn no lắm rồi 😋'); }
    const foods = Object.keys(ensure().petBag).filter(i => bagQty(i) > 0 && ITEM_BY_ID[i] && ITEM_BY_ID[i].cat === 'food' && okFor(ITEM_BY_ID[i], p.species));
    if (!foods.length) {
      return openModal2('Chưa có thức ăn', `<div style="font-size:0.85rem;color:#4a5568">Bạn chưa có thức ăn hợp với ${esc(p.name)}.</div><button class="btn btn-pink" onclick="PET.closeModal();PET.shopCat('food');PET.view('shop')">🏪 Đến cửa hàng</button>`);
    }
    openModal2('Cho ' + p.name + ' ăn', foods.map(i => {
      const it = ITEM_BY_ID[i];
      return `<div class="pet-item"><div class="ic">${itemIcon(it)}</div><div class="tx"><b>${esc(it.name)}</b><div>${esc(it.desc || '')} · còn ${bagQty(i)}</div></div><button class="btn btn-pink" onclick="PET.feed('${id}','${i}')">Cho ăn</button></div>`;
    }).join(''));
  }
  function feed(id, itemId) {
    const p = findPet(id), it = ITEM_BY_ID[itemId];
    if (!p || !it || bagQty(itemId) <= 0) return;
    tickPet(p);
    const fx = wornFx(p), gain = Math.round(it.gain * fx.feed);
    p.stats.food = clamp(p.stats.food + gain);
    p.stats.mood = clamp(p.stats.mood + (it.mood || 3));
    bagAdd(itemId, -1);
    addXp(p, TUNE.xp.feed);
    closeModal2(); commit();
    toast(`${p.name} ăn ngon lành! +${gain} no`);
    try { if (typeof mtrack === 'function') { mtrack('petFeeds', 1); save(); } } catch (e) {}
  }
  function bathe(id) {
    const p = findPet(id); if (!p) return; tickPet(p);
    const tank = isTank(p), cost = tank ? TUNE.tankCleanCost : TUNE.bathCost;
    if (p.stats.clean >= 90) return toast(tank ? 'Nước còn rất trong.' : p.name + ' còn thơm tho lắm.');
    if (!spend(cost)) return;
    p.stats.clean = clamp(p.stats.clean + (tank ? 60 : 55));
    if (!tank) p.stats.mood = clamp(p.stats.mood - 2);
    addXp(p, TUNE.xp.bathe);
    commit();
    toast(tank ? '💧 Đã thay nước mới' : '🛁 ' + p.name + ' sạch bong!');
  }
  function vet(id) {
    const p = findPet(id); if (!p) return; tickPet(p);
    if (!p.sick && !p.injured) return toast(p.name + ' khỏe mạnh, không cần khám.');
    if (!spend(TUNE.vetCost)) return;
    const wasInjured = p.injured;
    p.sick = false; delete p.injured;
    p.stats.food = Math.max(p.stats.food, 45); p.stats.clean = Math.max(p.stats.clean, 50); p.stats.mood = clamp(Math.max(p.stats.mood, 40) + 10);
    addXp(p, TUNE.xp.vet);
    commit();
    toast(wasInjured ? '🩺 ' + p.name + ' đã được chữa lành vết thương!' : '🩺 ' + p.name + ' đã khỏe lại!');
  }
  function quickPlay(p) {
    const fx = wornFx(p), gain = Math.round(15 * fx.play);
    p.daily.plays++;
    p.stats.mood = clamp(p.stats.mood + gain); p.stats.energy = clamp(p.stats.energy - 10); p.stats.food = clamp(p.stats.food - 3);
    addXp(p, TUNE.xp.play);
    commit();
    toast(`🎮 ${p.name} chơi rất vui! +${gain} vui`);
    try { if (typeof mtrack === 'function') { mtrack('petPlays', 1); save(); } } catch (e) {}
  }
  function play(id) {
    const p = findPet(id); if (!p || isTank(p)) return;
    tickPet(p); ensureDaily(p);
    if (p.species === 'dog' || p.species === 'golden') return openFrisbee(id);
    if (p.species === 'cat') return openLightDot(id);
    if (p.sick) return toast(p.name + ' đang ốm, cho đi khám trước nhé.');
    if (p.injured) return toast(p.name + ' đang bị thương, cho đi khám trước nhé.');
    if (p.daily.plays >= TUNE.playsPerDay) return toast('Hôm nay chơi đủ rồi, mai chơi tiếp nhé.');
    if (p.stats.energy < 15) return toast(p.name + ' mệt rồi, cho nghỉ chút nhé.');
    if (p.stats.food < 10) return toast(p.name + ' đói quá, cho ăn trước nhé.');
    quickPlay(p);
  }

  // ---------- MINI GAME ----------
  let game = null;
  function startPlay(id) {
    const p = findPet(id); if (!p || isTank(p)) return null;
    tickPet(p); ensureDaily(p);
    if (p.sick) { toast(p.name + ' đang ốm, cho đi khám trước nhé.'); return null; }
    if (p.injured) { toast(p.name + ' đang bị thương, cho đi khám trước nhé.'); return null; }
    if (p.daily.plays >= TUNE.playsPerDay) { toast('Hôm nay chơi đủ rồi, mai chơi tiếp nhé.'); return null; }
    if (p.stats.energy < 15) { toast(p.name + ' mệt rồi, cho nghỉ chút nhé.'); return null; }
    if (p.stats.food < 10) { toast(p.name + ' đói quá, cho ăn trước nhé.'); return null; }
    p.daily.plays++;
    p.stats.energy = clamp(p.stats.energy - 10);
    p.stats.food = clamp(p.stats.food - 3);
    save();
    game = { petId: p.id, score: 0, dead: false, settled: false, raf: 0, cleanup: null };
    return p;
  }
  function settleGame(g, silent) {
    const p = findPet(g.petId); if (!p) return;
    const score = Math.max(0, g.score || 0);
    const fx = wornFx(p);
    const moodGain = Math.round((g.kind === 'frisbee' ? 8 + score * 3 : 8 + score * 4) * fx.play);
    const coin = score * (g.kind === 'frisbee' ? 5000 : 8000);
    p.stats.mood = clamp(p.stats.mood + moodGain);
    if (coin) S().walletBalance = (S().walletBalance || 0) + coin;
    addXp(p, TUNE.xp.play + Math.min(30, score * 2));
    save(); refreshWallet(); render();
    try { if (typeof mtrack === 'function') mtrack('petPlays', 1); } catch (e) {}
    if (silent) { toast(`🎮 ${p.name}: ${score} điểm · +${moodGain} vui${coin ? ' · ' + money(coin) : ''}`); return; }
    const left = TUNE.playsPerDay - p.daily.plays;
    openModal2('🎮 Kết quả', `
      <div style="text-align:center;font-size:2.2rem;line-height:1.2;">${g.kind === 'frisbee' ? '🥏' : '🐾'}</div>
      <div style="text-align:center;font-size:0.92rem;line-height:1.7;color:#2d3748;"><b>${esc(p.name)}</b> được <b>${score} điểm</b><br>+${moodGain} vui${coin ? ' · nhặt được ' + money(coin) : ''}<br><span style="font-size:0.8rem;color:#718096;">Lv.${levelOf(p)} · còn ${left} lượt chơi hôm nay</span></div>
      <div style="display:flex;gap:8px;"><button class="btn btn-outline" style="flex:1;" onclick="PET.closeModal()">Đóng</button>${left > 0 ? `<button class="btn btn-pink" style="flex:1;" onclick="PET.play('${p.id}')">Chơi tiếp</button>` : ''}</div>`);
  }
  function gameStop(settle, silent) {
    if (!game) return;
    const g = game; game = null;
    g.dead = true;
    if (g.raf) cancelAnimationFrame(g.raf);
    if (g.cleanup) { try { g.cleanup(); } catch (e) {} }
    if (settle && !g.settled) { g.settled = true; settleGame(g, silent); }
  }
  function finishGame(g) { if (game !== g) return; gameStop(true, false); }
  function runLoop(g, step) {
    let last = performance.now();
    function frame(t) {
      if (g.dead || game !== g) return;
      const dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
      last = t;
      if (!document.hidden) step(dt);
      g.raf = requestAnimationFrame(frame);
    }
    g.raf = requestAnimationFrame(frame);
  }
  function canvasOf() { return document.getElementById('pg-canvas'); }
  function setHud(score, timeLeft) {
    const s = document.getElementById('pg-score'), t = document.getElementById('pg-time');
    if (s) s.textContent = 'Điểm: ' + score;
    if (t) t.textContent = Math.max(0, Math.ceil(timeLeft)) + 's';
  }
  function openFrisbee(id) {
    const p = startPlay(id); if (!p) return;
    const W = 340, H = 380, g = game;
    g.kind = 'frisbee'; g.miss = 0; g.lane = 1; g.items = []; g.spawn = 0.6; g.time = 0; g.limit = 45;
    openModal2('🥏 Hứng đĩa cùng ' + p.name, `
      <div class="pg-score"><span id="pg-score">Điểm: 0</span><span id="pg-time">45s</span></div>
      <canvas id="pg-canvas" class="pg-canvas" width="${W}" height="${H}"></canvas>
      <div class="pg-hint">Đỡ đĩa rơi xuống bằng cách đứng đúng làn. Trượt 3 lần là kết thúc, càng lâu đĩa càng nhanh.</div>
      <div class="pg-lanes">
        <button data-lane="0" onclick="PET.gameLane(0)">◀ Trái</button>
        <button data-lane="1" onclick="PET.gameLane(1)">▲ Giữa</button>
        <button data-lane="2" onclick="PET.gameLane(2)">Phải ▶</button>
      </div>`);
    const paintLane = () => {
      document.querySelectorAll('.pg-lanes button').forEach(b => b.classList.toggle('on', +b.dataset.lane === g.lane));
    };
    g.setLane = (i) => { g.lane = Math.max(0, Math.min(2, i)); paintLane(); };
    paintLane();
    const onKey = (e) => {
      const k = e.key;
      const i = (k === 'ArrowLeft' || k === '1') ? 0 : (k === 'ArrowUp' || k === '2') ? 1 : (k === 'ArrowRight' || k === '3') ? 2 : -1;
      if (i >= 0) { g.setLane(i); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    g.cleanup = () => window.removeEventListener('keydown', onKey);
    const cvs = canvasOf();
    const dogEmoji = p.species === 'golden' ? '🦮' : '🐶';
    const draw = () => {
      if (!cvs) return;
      const x = cvs.getContext('2d'), W2 = cvs.width, H2 = cvs.height;
      x.clearRect(0, 0, W2, H2);
      x.fillStyle = '#eaf7ff'; x.fillRect(0, 0, W2, H2);
      x.strokeStyle = 'rgba(66,153,225,.3)'; x.lineWidth = 2; x.setLineDash([8, 8]);
      for (let i = 1; i < 3; i++) { x.beginPath(); x.moveTo(W2 * i / 3, 0); x.lineTo(W2 * i / 3, H2); x.stroke(); }
      x.setLineDash([]);
      x.fillStyle = '#c6f6d5'; x.fillRect(0, H2 - 46, W2, 46);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = '40px serif';
      x.fillText(dogEmoji, W2 * (g.lane * 2 + 1) / 6, H2 - 34);
      x.font = '27px serif';
      g.items.forEach(f => x.fillText('🥏', W2 * (f.lane * 2 + 1) / 6, f.y));
      x.textAlign = 'left'; x.font = 'bold 13px sans-serif'; x.fillStyle = '#c53030';
      x.fillText('Trượt: ' + g.miss + '/3', 10, 16);
    };
    runLoop(g, (dt) => {
      g.time += dt;
      if (g.time >= g.limit) return finishGame(g);
      g.spawn -= dt;
      if (g.spawn <= 0) {
        g.spawn = Math.max(0.4, 0.95 - g.score * 0.025);
        g.items.push({ lane: rand(0, 2), y: -16, vy: 155 + g.score * 9 });
      }
      for (let i = g.items.length - 1; i >= 0; i--) {
        const f = g.items[i];
        f.y += f.vy * dt;
        if (f.y < H - 52) continue;
        if (f.lane === g.lane) g.score++;
        else g.miss++;
        g.items.splice(i, 1);
        if (g.miss >= 3) return finishGame(g);
      }
      setHud(g.score, g.limit - g.time);
      draw();
    });
  }
  function openLightDot(id) {
    const p = startPlay(id); if (!p) return;
    const W = 340, H = 380, g = game;
    g.kind = 'dot'; g.time = 0; g.limit = 30; g.hold = 0; g.cool = 0.4; g.drag = false;
    g.dot = { x: W / 2, y: H / 2 }; g.prev = { x: W / 2, y: H / 2 };
    g.cat = { x: W / 2, y: H - 36 };
    g.ring = { x: 0, y: 0, r: 34 };
    const newRing = () => { g.ring.x = rand(50, W - 50); g.ring.y = rand(70, H - 90); };
    newRing();
    openModal2('🐾 Đuổi chấm sáng cùng ' + p.name, `
      <div class="pg-score"><span id="pg-score">Điểm: 0</span><span id="pg-time">30s</span></div>
      <canvas id="pg-canvas" class="pg-canvas" width="${W}" height="${H}"></canvas>
      <div class="pg-hint">Kéo chấm sáng vào vòng và GIỮ YÊN — mèo chỉ vồ khi chấm đứng lại.</div>`);
    const cvs = canvasOf();
    const toLocal = (ev) => {
      const r = cvs.getBoundingClientRect();
      return {
        x: Math.max(6, Math.min(W - 6, (ev.clientX - r.left) * W / r.width)),
        y: Math.max(6, Math.min(H - 6, (ev.clientY - r.top) * H / r.height))
      };
    };
    const setDot = (ev) => { const pt = toLocal(ev); g.dot.x = pt.x; g.dot.y = pt.y; };
    const onDown = (e) => { g.drag = true; try { cvs.setPointerCapture(e.pointerId); } catch (err) {} setDot(e); e.preventDefault(); };
    const onMove = (e) => { if (g.drag) { setDot(e); e.preventDefault(); } };
    const onUp = () => { g.drag = false; };
    cvs.addEventListener('pointerdown', onDown);
    cvs.addEventListener('pointermove', onMove);
    cvs.addEventListener('pointerup', onUp);
    cvs.addEventListener('pointercancel', onUp);
    g.cleanup = () => {
      cvs.removeEventListener('pointerdown', onDown);
      cvs.removeEventListener('pointermove', onMove);
      cvs.removeEventListener('pointerup', onUp);
      cvs.removeEventListener('pointercancel', onUp);
    };
    const draw = () => {
      if (!cvs) return;
      const x = cvs.getContext('2d'), W2 = cvs.width, H2 = cvs.height;
      x.clearRect(0, 0, W2, H2);
      x.fillStyle = '#1f2937'; x.fillRect(0, 0, W2, H2);
      x.fillStyle = 'rgba(255,255,255,.05)';
      for (let i = 0; i < 18; i++) x.fillRect((i * 53) % W2, (i * 97) % H2, 2, 2);
      const pulse = 1 + Math.sin(performance.now() / 220) * 0.08;
      x.beginPath();
      x.arc(g.ring.x, g.ring.y, g.ring.r * pulse, 0, Math.PI * 2);
      x.fillStyle = 'rgba(255,214,102,.16)'; x.fill();
      x.strokeStyle = 'rgba(255,214,102,.9)'; x.lineWidth = 3; x.stroke();
      x.beginPath();
      x.arc(g.dot.x, g.dot.y, 10, 0, Math.PI * 2);
      x.fillStyle = '#ffe066'; x.shadowColor = '#ffe066'; x.shadowBlur = 18; x.fill(); x.shadowBlur = 0;
      x.font = '40px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.save(); x.translate(g.cat.x, g.cat.y); x.scale(1, 0.92); x.fillText('🐱', 0, 0); x.restore();
      x.font = 'bold 13px sans-serif'; x.textAlign = 'left'; x.fillStyle = '#ffe066';
      x.fillText('Vồ được: ' + g.score, 10, 16);
    };
    runLoop(g, (dt) => {
      g.time += dt;
      if (g.time >= g.limit) return finishGame(g);
      g.cool = Math.max(0, g.cool - dt);
      const vx = (g.dot.x - g.prev.x) / Math.max(dt, 0.001);
      const vy = (g.dot.y - g.prev.y) / Math.max(dt, 0.001);
      g.prev.x = g.dot.x; g.prev.y = g.dot.y;
      const still = Math.hypot(vx, vy) < 40;
      const inside = Math.hypot(g.dot.x - g.ring.x, g.dot.y - g.ring.y) <= g.ring.r;
      g.hold = still ? g.hold + dt : 0;
      if (g.hold >= 0.55 && g.cool <= 0 && inside) {
        g.score++; g.cool = 0.7; g.hold = 0; newRing();
      }
      const ease = Math.min(1, dt * 2.6);
      g.cat.x += (g.dot.x - g.cat.x) * ease;
      g.cat.y += ((g.dot.y + 34) - g.cat.y) * ease;
      g.cat.y = Math.min(H - 26, Math.max(46, g.cat.y));
      setHud(g.score, g.limit - g.time);
      draw();
    });
  }
  function rename(id) {
    const p = findPet(id); if (!p) return;
    openModal2('✏️ Đổi tên', `
      <input id="pet-rename-input" type="text" maxlength="24" value="${esc(p.name)}" onkeydown="if(event.key==='Enter')PET.renameNow('${id}')" style="padding:10px;border-radius:10px;border:2px solid var(--app-green);font-size:0.9rem;background:var(--surface-2);color:var(--text);">
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline" style="flex:1;" onclick="PET.closeModal()">Hủy</button>
        <button class="btn btn-pink" style="flex:1;" onclick="PET.renameNow('${id}')">Lưu tên</button>
      </div>`);
    setTimeout(function () { const inp = document.getElementById('pet-rename-input'); if (inp) { inp.focus(); inp.select(); } }, 60);
  }
  function renameNow(id) {
    const p = findPet(id); if (!p) return closeModal2();
    const inp = document.getElementById('pet-rename-input');
    const v = inp ? inp.value.trim().slice(0, 24) : '';
    closeModal2();
    if (!v) return;
    p.name = v; commit();
    toast('✏️ Đã đổi tên thành ' + v);
  }
  function tap(id, el, ev) {
    const p = findPet(id); if (!p) return;
    el.classList.remove('pet-jump'); void el.offsetWidth; el.classList.add('pet-jump');
    const h = document.createElement('span');
    h.className = 'pet-heart'; h.textContent = '❤️';
    const r = el.getBoundingClientRect();
    h.style.left = ((ev && ev.clientX ? ev.clientX - r.left : r.width / 2) - 10) + 'px';
    h.style.top = ((ev && ev.clientY ? ev.clientY - r.top : r.height / 2) - 10) + 'px';
    el.appendChild(h); setTimeout(() => { if (h.parentNode) h.parentNode.removeChild(h); }, 900);
    ensureDaily(p);
    if (!p.sick && p.daily.taps < TUNE.tapsPerDay) { p.daily.taps++; p.stats.mood = clamp(p.stats.mood + 2); addXp(p, TUNE.xp.tap); save(); }
  }
  function sellPet(id) {
    const p = findPet(id); if (!p) return;
    const price = sellValue(p);
    const tag = isTank(p) ? '' : `\n${rarityLabel(p)} · Lv.${levelOf(p)}${p.parents ? '\nCon của ' + p.parents.join(' & ') : ''}`;
    if (!confirm(`Bán ${p.name} với giá ${money(price)}?${tag}\nĐồ đang mặc sẽ được trả về kho.`)) return;
    Object.keys(p.worn || {}).forEach(slot => bagAdd(p.worn[slot], 1));
    S().pets = S().pets.filter(x => x.id !== id);
    S().walletBalance = (S().walletBalance || 0) + price;
    commit();
    toast('💰 Đã bán, nhận ' + money(price));
  }
  function sellFish(petId, fishId) {
    const p = findPet(petId); if (!p || !p.fish) return;
    const f = p.fish.find(x => x.id === fishId); if (!f) return;
    const val = FISH_SELL[f.c] || TUNE.fishSell;
    const fn = (FISH_SPECIES[f.c] || {}).name || ('Cá ' + f.c);
    if (!confirm(`Bán ${fn} ${f.g === 'male' ? 'đực' : 'cái'} (${RARITY_LABEL[RARITY[f.c] || 1]}) với giá ${money(val)}?`)) return;
    p.fish = p.fish.filter(x => x.id !== fishId);
    S().walletBalance = (S().walletBalance || 0) + val;
    commit();
  }

  // ---------- LAI TẠO ----------
  function breedCooldownLeft(p) {
    return Math.max(0, (p.breedTs || 0) + TUNE.breedCooldownH * 3600000 - now());
  }
  function breedReady(p) {
    return p && !isTank(p) && levelOf(p) >= TUNE.breedLv && !p.sick && !p.injured &&
      breedCooldownLeft(p) <= 0 && p.stats.food >= 40 && p.stats.energy >= 40;
  }
  function openBreed(id) {
    const p = findPet(id); if (!p || isTank(p)) return toast('Bể cá sẽ có lai tạo riêng ở giai đoạn sau.');
    tickPet(p); ensureDaily(p);
    const lv = levelOf(p);
    if (lv < TUNE.breedLv) return toast(`${p.name} mới Lv.${lv} — cần Lv.${TUNE.breedLv} mới sinh sản được (chăm bé thêm nhé).`);
    if (p.sick || p.injured) return toast('Bé đang không khỏe, chữa lành trước đã.');
    const left = breedCooldownLeft(p);
    if (left > 0) return toast(`Bé cần nghỉ thêm ${Math.ceil(left / 3600000)} giờ.`);
    if (p.stats.food < 40 || p.stats.energy < 40) return toast('Cho bé ăn và nghỉ cho lại sức đã nhé.');
    const partners = ensure().pets.filter(x => x && x.id !== p.id && x.species === p.species && x.gender !== p.gender && breedReady(x));
    const rows = partners.map(x => {
      const q = xpProgress(x);
      return `<div class="pet-item"><div class="tx"><b>${x.gender === 'male' ? '♂' : '♀'} ${esc(x.name)}</b><div>Lv.${q.lv} · ${esc(x.color)} · ${rarityLabel(x)}</div></div><button class="btn btn-pink" onclick="PET.breed('${p.id}','${x.id}')">Chọn</button></div>`;
    }).join('');
    openModal2(`🍼 Lai tạo cho ${p.name}`, `
      <div style="font-size:0.83rem;color:#4a5568;line-height:1.5;">Cần bạn đời cùng loài, khác giới, Lv.${TUNE.breedLv}+ và đang khỏe. Chi phí mỗi lần: <b>${money(TUNE.breedCost)}</b>. Con non thừa hưởng màu bố mẹ; màu càng hiếm càng khó ra và bán càng được giá.</div>
      ${rows || '<div style="font-size:0.8rem;color:#a0aec0;text-align:center;">Chưa có bạn đời phù hợp. Nuôi thêm một bé cùng loài khác giới lên Lv.5 nhé.</div>'}
      <button class="btn btn-outline" onclick="PET.closeModal()">Đóng</button>`);
  }
  function breed(id, partnerId) {
    const p = findPet(id), q = findPet(partnerId);
    if (!p || !q || p.species !== q.species || p.gender === q.gender) return;
    if (!breedReady(p) || !breedReady(q)) { closeModal2(); return toast('Điều kiện sinh sản đã thay đổi, thử lại nhé.'); }
    if (ensure().pets.length >= TUNE.maxPets) return toast(`Nhà đã đủ ${TUNE.maxPets} bé, bán bớt trước khi lai tạo.`);
    if (!spend(TUNE.breedCost)) return;
    const t = now(), color = pickBabyColor(p.color, q.color);
    const baby = {
      id: 'pet-' + t.toString(36) + Math.random().toString(36).slice(2, 6),
      species: p.species, name: DEFAULT_NAMES[rand(0, DEFAULT_NAMES.length - 1)],
      gender: Math.random() < 0.5 ? 'male' : 'female', color: color,
      born: t, tickTs: t, stats: { food: 80, mood: 80, clean: 80, energy: 80 },
      worn: {}, daily: { d: '', walks: 0, plays: 0, taps: 0 }, paid: 0, xp: 0, lv: 1, breedTs: 0,
      parents: [p.name, q.name]
    };
    p.breedTs = q.breedTs = t;
    addXp(p, TUNE.xp.breed); addXp(q, TUNE.xp.breed);
    ensure().pets.push(baby);
    selPet = baby.id;
    closeModal2(); commit();
    openModal2('🍼 Chào đón em bé!', `
      <div style="text-align:center;font-size:2.6rem;line-height:1.1;">${SPECIES[baby.species].emoji}</div>
      <div style="font-size:0.9rem;line-height:1.65;color:#2d3748;text-align:center;"><b>${esc(baby.name)}</b> chào đời!<br>${esc(baby.color)} · ${baby.gender === 'male' ? 'Đực' : 'Cái'} · Lv.1<br>${rarityLabel(baby)}</div>
      <div style="font-size:0.78rem;color:#718096;text-align:center;">Bố/mẹ: ${esc(p.name)} & ${esc(q.name)}. Bé còn nhỏ, nuôi tới Lv.${TUNE.breedLv} để tiếp tục lai tạo.</div>
      <div style="display:flex;gap:8px;"><button class="btn btn-outline" style="flex:1;" onclick="PET.closeModal()">Đóng</button><button class="btn btn-pink" style="flex:1;" onclick="PET.closeModal();PET.rename('${baby.id}')">✏️ Đặt tên</button></div>`);
  }

  // ---------- SHOP, ĐỒ MẶC, THẢ CÁ ----------
  function buy(itemId) {
    const it = ITEM_BY_ID[itemId]; if (!it) return;
    if (!spend(it.price)) return;
    bagAdd(itemId, it.pack || 1);
    commit();
    toast(`🛍️ Đã mua ${it.name}`);
  }
  function slotsFor(p) { return isTank(p) ? SLOTS_TANK : SLOTS_STD; }
  function openEquip(id) {
    const p = findPet(id); if (!p) return;
    p.worn = p.worn || {};
    const html = slotsFor(p).map(slot => {
      const cur = p.worn[slot] && ITEM_BY_ID[p.worn[slot]];
      const options = Object.keys(ensure().petBag).filter(i => bagQty(i) > 0 && ITEM_BY_ID[i] && ITEM_BY_ID[i].slot === slot && okFor(ITEM_BY_ID[i], p.species));
      const curRow = cur
        ? `<div class="pet-item"><div class="ic">${itemIcon(cur)}</div><div class="tx"><b>${esc(cur.name)}</b><div>Đang dùng</div></div><button class="btn btn-outline" onclick="PET.unequip('${id}','${slot}')">Tháo</button></div>`
        : '<div style="font-size:0.78rem;color:#a0aec0;">Chưa có</div>';
      const optRows = options.map(i => {
        const it = ITEM_BY_ID[i];
        return `<div class="pet-item"><div class="ic">${itemIcon(it)}</div><div class="tx"><b>${esc(it.name)}</b><div>${esc(it.desc || '')} · có ${bagQty(i)}</div></div><button class="btn btn-pink" onclick="PET.equip('${id}','${i}')">Dùng</button></div>`;
      }).join('');
      return `<div><div style="font-weight:bold;font-size:0.82rem;color:var(--app-dark-green);margin-bottom:4px;">${SLOT_LABEL[slot]}</div><div style="display:flex;flex-direction:column;gap:6px">${curRow}${optRows}</div></div>`;
    }).join('');
    openModal2((isTank(p) ? 'Đồ bể: ' : 'Đồ mặc: ') + p.name, html + `<div style="font-size:0.75rem;color:#718096;">Chưa có đồ? Vào tab 🏪 Cửa hàng để mua.</div>`);
  }
  function equip(id, itemId) {
    const p = findPet(id), it = ITEM_BY_ID[itemId];
    if (!p || !it || bagQty(itemId) <= 0 || !okFor(it, p.species)) return;
    if (it.slot === 'home' && isTank(p) && it.cap && (p.fish || []).length > it.cap) return toast(`Bể này chỉ chứa ${it.cap} cá, bán bớt cá trước đã.`);
    p.worn = p.worn || {};
    if (p.worn[it.slot]) bagAdd(p.worn[it.slot], 1);
    p.worn[it.slot] = itemId;
    bagAdd(itemId, -1);
    save(); render(); openEquip(id);
  }
  function unequip(id, slot) {
    const p = findPet(id); if (!p || !p.worn || !p.worn[slot]) return;
    if (slot === 'home' && isTank(p)) {
      const it = ITEM_BY_ID[p.worn[slot]];
      if (it && it.cap && (p.fish || []).length > TUNE.tankBaseCap) return toast('Bể đang có nhiều cá hơn sức chứa của bể nhỏ, hãy bán bớt cá trước.');
    }
    bagAdd(p.worn[slot], 1);
    delete p.worn[slot];
    save(); render(); openEquip(id);
  }
  function openAddFish(id) {
    const p = findPet(id); if (!p || !isTank(p)) return;
    const cap = tankCap(p), n = (p.fish || []).length;
    if (n >= cap) return toast(`Bể đã đầy (${n}/${cap}). Mua bể lớn hơn hoặc bán bớt cá.`);
    const fishIds = Object.keys(ensure().petBag).filter(i => bagQty(i) > 0 && ITEM_BY_ID[i] && ITEM_BY_ID[i].cat === 'fish');
    const bagRows = fishIds.map(i => {
      const it = ITEM_BY_ID[i];
      return `<div class="pet-item"><div class="ic">${it.emoji}</div><div class="tx"><b>${esc(it.name)}</b><div>có ${bagQty(i)}</div></div><button class="btn btn-pink" onclick="PET.addFish('${id}','${i}')">Thả</button></div>`;
    }).join('');
    const saleRows = ITEMS.filter(i => i.cat === 'fish' && i.fish).map(it => {
      const r = RARITY[it.fish.c] || 1;
      return `<div class="pet-item"><div class="ic">${it.emoji}</div><div class="tx"><b>${esc(it.name)}</b><div>${RARITY_STAR[r]} ${RARITY_LABEL[r]} · ${money(it.price)}</div></div><button class="btn" onclick="PET.buyFish('${id}','${it.id}')">Mua & thả</button></div>`;
    }).join('');
    openModal2(`🐟 Chợ cá — ${p.name} (${n}/${cap})`,
      (bagRows ? `<div style="font-weight:bold;font-size:.8rem;color:var(--app-dark-green)">Cá trong kho</div>${bagRows}` : '') +
      `<div style="font-weight:bold;font-size:.8rem;color:var(--app-dark-green);margin-top:6px">Mua cá thả ngay</div>${saleRows}`);
  }
  function buyFish(id, itemId) {
    const p = findPet(id), it = ITEM_BY_ID[itemId];
    if (!p || !it || !it.fish) return;
    if (!isTank(p)) return toast('Chỉ thả cá vào bể cá được thôi.');
    if ((p.fish || []).length >= tankCap(p)) return toast('Bể đã đầy.');
    if (!spend(it.price)) return;
    p.fish = p.fish || [];
    p.fish.push({ id: 'f-' + now().toString(36) + Math.random().toString(36).slice(2, 6), g: it.fish.g, c: it.fish.c, born: now() });
    closeModal2(); commit();
    toast('🐟 Đã thả cá vào bể');
  }
  function addFish(id, itemId) {
    const p = findPet(id), it = ITEM_BY_ID[itemId];
    if (!p || !it || !it.fish || bagQty(itemId) <= 0) return;
    if (!isTank(p)) return toast('Chỉ thả cá vào bể cá được thôi.');
    if ((p.fish || []).length >= tankCap(p)) return toast('Bể đã đầy.');
    p.fish = p.fish || [];
    p.fish.push({ id: 'f-' + now().toString(36) + Math.random().toString(36).slice(2, 6), g: it.fish.g, c: it.fish.c, born: now() });
    bagAdd(itemId, -1);
    closeModal2(); commit();
    toast('🐟 Đã thả cá vào bể');
  }

  // ---------- DẮT ĐI CHƠI ----------
  function walkLuck(p) {
    let n = 0;
    Object.keys(p.worn || {}).forEach(slot => {
      if (slot !== 'outfit' && slot !== 'acc') return;
      if (ITEM_BY_ID[p.worn[slot]]) n++;
    });
    return Math.min(2, n);
  }
  function openWalk(id) {
    const p = findPet(id); if (!p) return; tickPet(p); ensureDaily(p);
    if (!WALK_SPECIES[p.species]) return toast(`${SPECIES[p.species].name} ở nhà chơi thôi, không dắt đi dạo được.`);
    if (p.sick) return toast(p.name + ' đang ốm, cho đi khám trước nhé.');
    if (p.injured) return toast(p.name + ' đang bị thương, cho đi khám trước nhé.');
    if (p.daily.walks >= TUNE.walksPerDay) return toast('Hôm nay đã dắt đi đủ ' + TUNE.walksPerDay + ' lần rồi.');
    if (p.stats.energy < 25) return toast(p.name + ' mệt rồi, nghỉ chút đã nhé.');
    if (p.stats.food < 15) return toast(p.name + ' đói quá, cho ăn trước nhé.');
    const story = (S().stories || []).find(s => s.id === S().activeStoryId);
    const chars = (story && story.characters) || [];
    const rows = chars.map(c => {
      const a = (S().affectionLevels || {})[c.id] || { level: 1 };
      return `<div class="pet-item"><div class="tx"><b>${esc(c.name)}</b><div>Thân mật Lv.${a.level || 1}</div></div><button class="btn btn-pink" onclick="PET.walk('${id}','${c.id}')">Đi cùng</button></div>`;
    }).join('');
    const luck = walkLuck(p);
    const luckTxt = luck ? `<div style="font-size:0.76rem;color:#2f855a;">👗 ${p.name} đang mặc đồ đẹp — chuyến đi dễ gặp chuyện vui hơn.</div>` : '';
    openModal2(`Dắt ${p.name} đi chơi (còn ${TUNE.walksPerDay - p.daily.walks} lượt)`,
      luckTxt +
      (rows || '<div style="font-size:0.8rem;color:#888">Truyện đang mở chưa có nhân vật để đi cùng.</div>')
      + `<div class="pet-item"><div class="tx"><b>Đi một mình</b><div>Không tăng thân mật</div></div><button class="btn btn-outline" onclick="PET.walk('${id}','')">Đi</button></div>`);
  }
  function pickWeighted(table) {
    const total = table.reduce((s, x) => s + x[1], 0);
    let r = Math.random() * total;
    for (let i = 0; i < table.length; i++) { r -= table[i][1]; if (r <= 0) return table[i][0]; }
    return table[0][0];
  }
  function boxLabel(theme, tier) {
    try { return `${BOX_TIERS[tier].icon} Box ${BOX_TIERS[tier].label} ${CRAFTS[theme].label}`; } catch (e) { return '🎁 một chiếc box'; }
  }
  // Trả về kết quả chuyến đi (không đụng state), tách riêng để dễ chỉnh/thử
  function rollWalk(p, withChar) {
    const happy = p.stats.mood >= 70, dressed = walkLuck(p);
    const good = (happy ? 1.15 : 1) + dressed * 0.12;
    const bad = Math.max(0.5, (happy ? 0.72 : 1) - dressed * 0.08);
    const table = withChar
      ? [['calm', 34 * good], ['friend', 14 * good], ['money', 9 * good], ['box', 10 * good], ['mess', 8 * bad], ['rain', 5], ['bite', 4 * bad], ['car', 2 * bad], ['leg', 3 * bad]]
      : [['calm', 45 * good], ['money', 22 * good], ['box', 10 * good], ['mess', 10 * bad], ['rain', 8], ['car', 2 * bad], ['leg', 3 * bad]];
    const ev = pickWeighted(table);
    const r = { ev: ev, aff: 0, money: 0, mood: 0, box: null, injure: false };
    if (ev === 'calm') { r.aff = rand(2, 3) + (happy ? 1 : 0); r.mood = 10; }
    else if (ev === 'friend') { r.aff = 4; r.mood = 14; }
    else if (ev === 'money') { r.aff = 2; r.mood = 8; r.money = rand(20, 150) * 1000; }
    else if (ev === 'box') {
      r.aff = 3; r.mood = 10;
      let themes = []; try { themes = THEMES.slice(); } catch (e) {}
      if (themes.length) r.box = { theme: themes[rand(0, themes.length - 1)], tier: (happy && Math.random() < 0.15) ? 'silver' : 'normal' };
    }
    else if (ev === 'mess') { r.aff = -1; r.mood = -5; r.money = -rand(30, 120) * 1000; }
    else if (ev === 'rain') { r.aff = 1; r.mood = -8; }
    else if (ev === 'bite') { r.aff = -3; r.mood = -6; }
    else if (ev === 'car') { r.aff = 2; r.mood = -22; r.injure = true; }
    else if (ev === 'leg') { r.aff = 2; r.mood = -15; r.injure = true; }
    if (!withChar) r.aff = 0;
    return r;
  }
  function walkText(ev, petName, who, r) {
    const t = {
      calm: `${petName} tung tăng cùng ${who} dạo quanh công viên, cả hai cười nói vui vẻ.`,
      friend: `${petName} làm quen được với một bé thú khác, ${who} bật cười vì cảnh tượng đáng yêu.`,
      money: `${who} nhặt được ${money(r.money)} rơi bên đường.`,
      box: `Một cụ bà tặng ${who} ${r.box ? boxLabel(r.box.theme, r.box.tier) : 'một món quà nhỏ'} vì quá mê ${petName}.`,
      mess: `${petName} nghịch làm đổ hàng của một quán ven đường, ${who} phải đền ${money(-r.money)}.`,
      rain: `Trời đổ mưa bất chợt, cả đám chạy về nhà ướt sũng.`,
      bite: `${petName} bất ngờ cắn vào tay một người đi đường, ${who} phải xin lỗi rối rít.`,
      car: `${petName} sổng dây lao ra lòng đường và bị xe tông, ${who} hoảng hốt bế bé chạy về ngay.`,
      leg: `${petName} trượt chân té ngã, ${who} phát hiện chân bé đã gãy và vội đưa đi khám.`
    };
    return t[ev] || '';
  }
  function walk(id, charId) {
    const p = findPet(id); if (!p || !WALK_SPECIES[p.species]) return; tickPet(p); ensureDaily(p);
    if (p.daily.walks >= TUNE.walksPerDay || p.sick || p.injured || p.stats.energy < 25 || p.stats.food < 15) return closeModal2();
    const story = (S().stories || []).find(s => s.id === S().activeStoryId);
    const ch = charId && story ? (story.characters || []).find(c => c.id === charId) : null;
    const who = ch ? ch.name : 'bạn';
    const r = rollWalk(p, !!ch);
    p.daily.walks++;
    p.stats.energy = clamp(p.stats.energy - 20); p.stats.food = clamp(p.stats.food - 8); p.stats.clean = clamp(p.stats.clean - 12);
    p.stats.mood = clamp(p.stats.mood + r.mood);
    if (r.injure) p.injured = true;
    if (r.money > 0) S().walletBalance = (S().walletBalance || 0) + r.money;
    if (r.money < 0) { const pay = Math.min(-r.money, S().walletBalance || 0); S().walletBalance -= pay; r.money = -pay; }
    if (r.box && typeof addBox === 'function') addBox(r.box.theme, r.box.tier, 1);
    if (ch && r.aff && typeof addAffectionPoints === 'function') addAffectionPoints(ch.id, r.aff);
    addXp(p, TUNE.xp.walk);
    try { if (typeof mtrack === 'function') mtrack('petWalks', 1); } catch (e) {}
    const text = walkText(r.ev, p.name, who, r);
    if (ch) addPetMemory(ch.id, `${(S().persona && S().persona.name) || 'Bạn'} dắt ${p.name} đi dạo cùng ${ch.name}. ${text}`);
    save(); refreshWallet(); render();

    const a = ch ? ((S().affectionLevels || {})[ch.id] || { level: 1, points: 0 }) : null;
    const affTxt = ch && r.aff ? `<div style="font-size:0.85rem;font-weight:bold;color:${r.aff > 0 ? '#2f855a' : '#c53030'}">${r.aff > 0 ? '+' : ''}${r.aff} thân mật với ${esc(ch.name)} (Lv.${a.level})</div>` : '';
    const hurtTxt = p.injured ? `<div style="font-size:0.82rem;font-weight:bold;color:#c53030;">🩹 ${p.name} bị thương — đưa bé đi khám bác sĩ (${money(TUNE.vetCost)}) trước khi đi dạo hay chơi tiếp.</div>` : '';
    const memTxt = ch ? `<div style="font-size:0.75rem;color:#718096;">${esc(ch.name)} sẽ nhớ chuyện này khi trò chuyện với bạn.</div>` : '';
    openModal2('Kết quả chuyến đi', `
      <div style="font-size:0.9rem;line-height:1.5;color:#2d3748">${esc(text)}</div>${hurtTxt}${affTxt}
      <div style="font-size:0.78rem;color:#718096">${p.name}: ${p.stats.mood >= 80 ? 'rất vui 😊' : p.stats.mood >= 50 ? 'khá ổn' : 'hơi buồn 😞'} · còn ${TUNE.walksPerDay - p.daily.walks} lượt hôm nay</div>
      ${memTxt}
      <button class="btn btn-outline" onclick="PET.closeModal()">Đóng</button>`);
  }

  // ---------- KHỞI ĐỘNG ----------
  window.PET = {
    view: (v) => {
      if (v === 'shop') { if (window.openMallGear) window.openMallGear(); return; }
      if (v === 'bag') { if (window.openBagTab) window.openBagTab('pet'); return; }
      view = 'mine'; render();
    },
    selPet: (id) => { selPet = id; render(); },
    gearShopHtml, bagHtml: viewBag,
    shopCat: (c) => { shopCat = c; if (typeof renderShopUI === 'function') renderShopUI(); },
    imgFail: (img) => { failed.add(img.getAttribute('src')); img.style.display = 'none'; const n = img.nextElementSibling; if (n) n.style.display = ''; },
    fishImgFail: (img) => { failed.add(img.getAttribute('src')); img.style.display = 'none'; const n = img.nextElementSibling; if (n) n.style.display = 'block'; },
    closeModal: closeModal2,
    adopt, confirmAdopt, sellInv, openFeed, feed, bathe, vet, play, rename, renameNow, tap, sellPet, sellFish,
    buy, openEquip, equip, unequip, openAddFish, addFish, buyFish, openWalk, walk,
    openBreed, breed, gameLane: (i) => { if (game && game.setLane) game.setLane(i); }
  };
  window.renderPetTab = render;
  window.petInvButtons = invButtons;
  // Cho phép kiểm thử/ chỉnh từ ngoài
  window.__petInternals = { TUNE, ITEMS, rollWalk, tickPet, poseOf, wornFx, tankCap, parseVariants };

  function syncPaused() {
    document.documentElement.classList.toggle('pet-paused', !!document.hidden);
  }
  document.addEventListener('visibilitychange', syncPaused);
  syncPaused();
  window.PET.resetDailies = () => { ensure().pets.forEach(p => { if (p) ensureDaily(p); }); save(); };

  setInterval(() => {
    const m = document.getElementById('pet-modal');
    if (window.lifeSub === 'pet' && !document.hidden && !(m && m.classList.contains('active'))) render();
  }, 60000);
})();
