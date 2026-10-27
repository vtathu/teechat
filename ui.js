// ===================== UI SHELL =====================
// Cột icon ở trang chủ (Teemall, Cuộc Sống, Túi), các trang toàn màn hình, cảnh Cuộc Sống,
// trang Nhà (cho thuê / ở chung), trang Túi (3 tab), Teemall (shop chung + shop thú cưng).
// File này nạp SAU chat.js nên ghi đè một vài hàm cũ (switchStoryTab, switchLifeSub, renderInventoryUI...).
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const S = () => window.state;
  const esc = (t) => (typeof escapeHtml === 'function' ? escapeHtml(String(t == null ? '' : t)) : String(t == null ? '' : t));
  const fold = (t) => (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const short = (n) => (typeof moneyShort === 'function' ? moneyShort(n || 0) : (n || 0).toLocaleString('vi-VN') + 'đ');
  const SELL_RATE = 0.5; // bán đồ trong Túi = 50% giá đã mua

  // ---------- CSS nhỏ cho chip nhân vật ở trang Nhà ----------
  (function () {
    const st = document.createElement('style');
    st.textContent = '.res-chip{display:inline-flex;align-items:center;gap:4px;padding:4px 10px 4px 4px;border-radius:16px;border:2px solid #e2e8f0;background:#fff;font-size:.76rem;color:#4a5568;cursor:pointer}' +
      '.res-chip img{width:22px;height:22px;border-radius:50%;object-fit:cover}' +
      '.res-chip.on{border-color:var(--app-dark-green);background:#f0faf5;color:var(--app-dark-green);font-weight:bold}' +
      '.res-chip small{color:#a0aec0;font-size:.62rem}';
    document.head.appendChild(st);
  })();

  // ---------- DỮ LIỆU DÙNG CHUNG ----------
  const stories = () => (S().stories || []).filter(Boolean);
  const storiesWithChars = () => stories().filter(s => (s.characters || []).length);
  function allChars() {
    const out = [];
    stories().forEach(s => (s.characters || []).forEach(c => { if (c) out.push({ c, s }); }));
    return out;
  }
  const charById = (id) => { const f = allChars().find(x => x.c.id === id); return f ? f.c : null; };
  function ensureActive() {
    const st = S();
    if (stories().some(s => s.id === st.activeStoryId)) return;
    const pick = storiesWithChars()[0] || stories()[0];
    if (pick) st.activeStoryId = pick.id;
  }
  const estates = () => (S().inventory || []).filter(it => it && typeof isEstateObj === 'function' && isEstateObj(it));
  const estateBase = (it) => (it.singleName || it.name || '').replace(/\s*\(x\d+\).*/, '');
  const estateLoc = (it) => { const m = /Vị trí:\s*([^|]+)/.exec(it.name || ''); return m ? m[1].trim() : ''; };

  // ===================== TRANG TOÀN MÀN HÌNH (ngăn xếp) =====================
  const stack = [];
  const top = () => stack[stack.length - 1];

  const HOOKS = {
    life: () => { ensureActive(); houseTick(); renderLifeScene(); try { if (typeof maybeTriggerRandomEvent === 'function') maybeTriggerRandomEvent(); } catch (e) {} },
    work: () => { origRLM(); paintWallets(); },
    mission: () => { ensureActive(); renderMissionTab(); },
    achv: () => { renderMissionTab(); },
    pet: () => { ensureActive(); window.lifeSub = 'pet'; if (typeof window.renderPetTab === 'function') window.renderPetTab(); },
    craft: () => { updateCraftPreview(); },
    house: () => { ensureActive(); houseTick(); renderHouse(); },
    mall: () => { renderMall(); },
    bag: () => { renderBagLists(); applyBagTab(); }
  };

  function openFs(name) {
    const el = $('fs-' + name);
    if (!el) return;
    const i = stack.indexOf(name);
    if (i !== -1) { while (stack.length > i + 1) closeFs(); }
    else {
      stack.push(name);
      el.style.zIndex = String(60 + stack.length);
      el.classList.add('active');
    }
    const body = el.querySelector('.fs-body'); if (body) body.scrollTop = 0;
    paintWallets();
    try { if (HOOKS[name]) HOOKS[name](); } catch (e) { console.error('openFs', name, e); }
  }
  function closeFs() {
    const n = stack.pop();
    if (!n) return;
    const el = $('fs-' + n); if (el) el.classList.remove('active');
    if (n === 'pet') window.lifeSub = null;
    if (n === 'mall') window.__mallGear = false;
    const t = top();
    if (t) { try { if (t === 'life') renderLifeScene(); else if (t === 'house') renderHouse(); else if (t === 'bag') renderBagLists(); else if (t === 'mall') renderMall(); } catch (e) {} paintWallets(); }
  }
  function closeAllFs() { while (stack.length) closeFs(); }

  function paintWallets() {
    const txt = short((S() && S().walletBalance) || 0);
    document.querySelectorAll('.wallet-mini').forEach(el => { el.innerText = '💲' + txt; });
    const w = $('life-wallet-display'); if (w) w.innerText = ((S() && S().walletBalance) || 0).toLocaleString('vi-VN') + ' VNĐ';
  }

  // ---------- Ghi đè các hàm cũ ----------
  window.switchStoryTab = function (tab) {
    if (tab === 'life') { openFs('life'); return; }
    const detail = $('page-story-detail');
    if (detail && !detail.classList.contains('active')) {
      const sid = S().activeStoryId;
      if (sid && stories().some(s => s.id === sid) && typeof window.openStoryDetail === 'function') { closeAllFs(); window.openStoryDetail(sid); return; }
    }
    closeAllFs();
    const chatView = $('subview-chat'); if (chatView) chatView.classList.remove('hidden');
    setTimeout(() => { const c = $('chat-history'); if (c) c.scrollTop = c.scrollHeight; }, 60);
  };
  window.switchLifeSub = function (name) {
    const m = { work: 'work', shop: 'mall', craft: 'craft', mission: 'mission', pet: 'pet' };
    if (m[name]) openFs(m[name]);
  };

  // bọc renderLifeModeUI để các trang đang mở tự làm mới
  const origRLM = window.renderLifeModeUI;
  window.renderLifeModeUI = function () {
    origRLM.apply(this, arguments);
    try {
      paintWallets();
      const t = top();
      if (t === 'life') renderLifeScene();
      else if (t === 'house') renderHouse();
    } catch (e) { console.error(e); }
  };
  window.renderInventoryUI = renderBagLists;

  // ===================== CHỌN TRUYỆN (khi tặng quà / chuyển khoản từ ngoài) =====================
  function pickStory(title, cb) {
    const list = storiesWithChars();
    if (!list.length) return alert('Chưa có truyện nào có nhân vật. Hãy tạo truyện và thêm nhân vật trước nhé!');
    let m = $('ui-story-pick');
    if (!m) {
      m = document.createElement('div'); m.id = 'ui-story-pick'; m.className = 'modal';
      m.innerHTML = '<div class="modal-content"><div class="modal-header"><h3 class="ttl" style="font-size:1rem;color:var(--app-dark-green)"></h3><button class="btn btn-outline" onclick="closeModal(\'ui-story-pick\')">✖</button></div><div class="body" style="display:flex;flex-direction:column;gap:8px"></div></div>';
      document.body.appendChild(m);
    }
    m.querySelector('.ttl').innerText = title;
    window.__pickStoryCb = cb;
    window.__pickStoryIds = list.map(s => s.id);
    m.querySelector('.body').innerHTML = list.map((s, i) => `<button class="btn btn-outline" style="justify-content:space-between;padding:10px 14px;font-size:.85rem;text-align:left;" onclick="UI.pickStory(${i})"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(s.title || 'Truyện')}</span><span style="font-size:.72rem;">🎭 ${(s.characters || []).length}</span></button>`).join('');
    openModal('ui-story-pick');
  }

  // Tặng quà từ ngoài truyện: hỏi truyện trước rồi mới chọn nhân vật
  const origGift = window.openSelectCharGiftModal;
  window.openSelectCharGiftModal = function (uid) {
    const list = storiesWithChars();
    if (!stack.length || list.length <= 1) {
      if (list.length === 1) S().activeStoryId = list[0].id; else ensureActive();
      return origGift(uid);
    }
    pickStory('🎁 Tặng quà ở truyện nào?', (sid) => { S().activeStoryId = sid; origGift(uid); });
  };

  // ===================== CẢNH CUỘC SỐNG =====================
  const SCENES = [
    [/vuong cuc/, '#1e1b4b', '#a855f7', ['🌃', '✨', '🚀']],
    [/mang xa|thuc kim/, '#f59e0b', '#7c2d12', ['🎰', '💎', '✨']],
    [/cyber|bang gia/, '#67e8f9', '#1e3a8a', ['🤖', '🏙️', '❄️']],
    [/cang|suong trang/, '#cbd5e1', '#475569', ['⚓', '🚢', '🌫️']],
    [/bich ngoc|vinh xuan/, '#bbf7d0', '#166534', ['🌳', '🍃', '☕']],
    [/rong ngoc|bai cat|san ho|bien/, '#7dd3fc', '#fde68a', ['🌊', '🐚', '⛵']],
    [/van phong|suong mu/, '#e0f2fe', '#65a30d', ['⛰️', '☁️', '🌾']],
    [/huong giang|co tran/, '#fde68a', '#92400e', ['🏯', '🌧️', '🔔']],
    [/den long|hoa giay/, '#fda4af', '#fbbf24', ['🏮', '🌸', '🌉']],
    [/doi thong|thuy kinh/, '#bae6fd', '#86efac', ['🌲', '🌸', '🦆']]
  ];
  const sceneFor = (loc) => { const f = fold(loc); const s = SCENES.find(x => x[0].test(f)); return s ? [s[1], s[2], s[3]] : ['#bae6fd', '#bbf7d0', ['☁️', '🌳', '🌷']]; };

  let starsCache = '';
  function starsHtml() {
    if (starsCache) return starsCache;
    let h = '';
    for (let i = 0; i < 48; i++) {
      const sz = 1 + Math.random() * 2.4;
      h += `<span class="star" style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 70).toFixed(1)}%;width:${sz.toFixed(1)}px;height:${sz.toFixed(1)}px;animation-delay:${(Math.random() * 3).toFixed(1)}s;animation-duration:${(2 + Math.random() * 3).toFixed(1)}s"></span>`;
    }
    return (starsCache = h);
  }

  function mainHouse() {
    const list = estates();
    if (!list.length) return null;
    const m = list.find(x => x.uniqueId === S().mainHouseUid);
    if (m) return m;
    return list.slice().sort((a, b) => rentBaseOf(b) - rentBaseOf(a))[0];
  }

  function renderLifeScene() {
    paintWallets();
    const art = $('scene-art'); if (!art) return;
    const h = mainHouse();
    if (!h) {
      art.className = 'scene-art night'; art.style.background = '';
      art.innerHTML = starsHtml() + '<div class="moon">🌙</div><div class="cap">Chưa có nhà ✨<br><span style="font-weight:normal;font-size:.72rem;">Mua nhà ở 🛍️ Teemall để có cảnh nhà của riêng mình</span></div>';
      return;
    }
    const loc = estateLoc(h), sc = sceneFor(loc);
    const emoji = ((estateBase(h).match(/^(\S+)/) || [])[1]) || '🏠';
    const who = (h.residents || []).map(charById).filter(Boolean).slice(0, 6);
    art.className = 'scene-art';
    art.style.background = `linear-gradient(${sc[0]}, ${sc[1]})`;
    art.innerHTML = `<div class="deco" style="left:8%;top:30%">${sc[2][0]}</div><div class="deco" style="right:12%;top:24%">${sc[2][1]}</div><div class="deco" style="left:18%;bottom:26%">${sc[2][2]}</div>` +
      '<div class="ground" style="background:rgba(0,0,0,.16)"></div>' +
      `<div class="house">${esc(emoji)}</div>` +
      `<div class="cap">${esc(estateBase(h).replace(/^\S+\s+/, ''))}${loc ? '<br><span style="font-weight:normal;font-size:.72rem;">📍 ' + esc(loc) + '</span>' : ''}${who.length ? '<div class="who">' + who.map(c => `<img src="${esc(c.avatar || window.DEFAULT_LOGO)}" alt="" onerror="this.src='${window.DEFAULT_LOGO}'">`).join('') + '</div>' : ''}</div>`;
  }

  // ===================== NHÀ: CHO THUÊ / Ở CHUNG =====================
  function houseCap(it) {
    const n = fold(it.singleName || it.name);
    let c = 2;
    if (/lo dat|dat nen/.test(n)) c = 0;
    else if (/hon dao|tram khong gian|cao oc|toa nha|dinh biet|sieu do thi/.test(n)) c = 10;
    else if (/lau dai/.test(n)) c = 8;
    else if (/villa mini/.test(n)) c = 3;
    else if (/villa|biet thu|dinh co|nha go|nghi duong/.test(n)) c = 5;
    else if (/nha cap 4/.test(n)) c = 2;
    else if (/nha cap 3|nha pho|shophouse/.test(n)) c = 3;
    else if (/nha cap 2/.test(n)) c = 4;
    else if (/nha cap 1/.test(n)) c = 5;
    else if (/phong tro|studio|1 phong ngu|can ho mini|can ho nho/.test(n)) c = 1;
    else if (/duplex|penthouse|3 phong ngu/.test(n)) c = 3;
    else if (/can ho|chung cu/.test(n)) c = 2;
    return c * (it.qty || 1);
  }

  function houseTick() {
    const st = S(); if (!st) return;
    const today = new Date(nowTs()).toDateString();
    if (st.houseTickDate === today) return;
    let days = 1;
    if (st.houseTickDate) { const d = Math.round((new Date(today) - new Date(st.houseTickDate)) / 86400000); days = Math.max(1, Math.min(3, d || 1)); }
    estates().forEach(it => {
      if (it.rented) return;
      (it.residents || []).forEach(cid => { if (charById(cid) && typeof addAffectionPoints === 'function') addAffectionPoints(cid, days); });
    });
    st.houseTickDate = today;
    saveStorage();
  }

  function renderHouse() {
    const box = $('house-body'); if (!box) return;
    const list = estates();
    if (!list.length) {
      box.innerHTML = '<div class="life-card" style="text-align:center;color:#718096;font-size:.85rem;line-height:1.6;">Bạn chưa có căn nhà nào.<br>Mua nhà ở 🛍️ Teemall → Shop chung → Nhà đất.</div><button class="btn btn-pink" onclick="UI.openMall(\'gen\')">🛍️ Đến Teemall</button>';
      return;
    }
    const main = mainHouse(), rentedN = rentedList().length, pend = rentPending();
    const head = `<div class="life-card" style="gap:6px;"><div style="font-size:.8rem;color:#4a5568;">🏠 ${list.length} căn · đang cho thuê ${rentedN}</div>` +
      (rentedN ? `<button class="btn btn-pink" style="width:100%;" onclick="collectRent()">🏦 Thu tiền thuê: ${short(pend)}</button>` : '<div style="font-size:.74rem;color:#718096;">Căn nào bấm "Cho thuê" sẽ có khách thuê và trả tiền mỗi ngày (dồn tối đa 7 ngày).</div>') + '</div>';
    const chars = allChars();
    const cards = list.map(it => {
      const cap = houseCap(it), res = (it.residents || []).filter(charById), isMain = main && main.uniqueId === it.uniqueId;
      const day = Math.floor(rentBaseOf(it) * RENT_RATE);
      let live;
      if (it.rented) live = '<div style="font-size:.74rem;color:#718096;">🏷️ Đang cho thuê nên chưa ở chung được. Ngừng cho thuê để nhân vật dọn vào.</div>';
      else if (cap === 0) live = '<div style="font-size:.74rem;color:#718096;">🌱 Đất nền chưa xây nhà, chưa ở được.</div>';
      else if (!chars.length) live = '<div style="font-size:.74rem;color:#718096;">Chưa có nhân vật nào để mời ở chung.</div>';
      else {
        const chips = chars.map(({ c }) => {
          const at = res.some(r => r.id === c.id), other = !at && estates().some(h => h !== it && (h.residents || []).includes(c.id));
          return `<span class="res-chip ${at ? 'on' : ''}" onclick="UI.live('${it.uniqueId}','${c.id}')"><img src="${esc(c.avatar || window.DEFAULT_LOGO)}" alt="" onerror="this.src='${window.DEFAULT_LOGO}'">${esc(c.name)}${other ? ' <small>(nhà khác)</small>' : ''}</span>`;
        }).join('');
        live = `<div style="font-size:.78rem;font-weight:bold;color:var(--app-dark-green);">👥 Ở chung (${res.length}/${cap}) <span style="font-weight:normal;color:#718096;">· mỗi ngày +1 thân mật</span></div><div style="display:flex;flex-wrap:wrap;gap:6px;">${chips}</div>`;
      }
      return `<div class="life-card" style="gap:8px;">
        <div style="font-weight:bold;font-size:.92rem;word-break:break-word;">${esc(estateBase(it))}${isMain ? ' ⭐' : ''}</div>
        <div style="font-size:.74rem;color:#718096;">${estateLoc(it) ? '📍 ' + esc(estateLoc(it)) : ''}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          <button class="btn ${isMain ? '' : 'btn-outline'}" style="padding:4px 10px;font-size:.72rem;" onclick="UI.main('${it.uniqueId}')">⭐ ${isMain ? 'Đang là nhà chính' : 'Đặt làm nhà chính'}</button>
          <button class="btn btn-outline" style="padding:4px 10px;font-size:.72rem;" onclick="UI.rent('${it.uniqueId}')">${it.rented ? '✅ Đang cho thuê · Ngừng' : '🏷️ Cho thuê +' + short(day) + '/ngày'}</button>
        </div>${live}</div>`;
    }).join('');
    box.innerHTML = head + cards;
  }

  // ===================== TEEMALL =====================
  let mallMode = 'gen', petSub = 'animal';
  function renderMall() {
    $('mall-seg-gen').classList.toggle('on', mallMode === 'gen');
    $('mall-seg-pet').classList.toggle('on', mallMode === 'pet');
    if (mallMode === 'gen') { window.__mallGear = false; shopSetMode('gen'); }
    else { window.__mallGear = true; renderShopUI(); }
  }
  window.renderGearShop = function () {
    const box = $('shop-items-container'); if (!box) return;
    if (!$('pet-style') && typeof window.renderPetTab === 'function') window.renderPetTab();
    box.innerHTML = window.PET.gearShopHtml();
  };
  window.openMallGear = function () { mallMode = 'pet'; petSub = 'gear'; openFs('mall'); renderMall(); };

  // ===================== TÚI =====================
  let bagTabName = 'gen';
  function applyBagTab() {
    ['gen', 'pet', 'craft'].forEach(n => {
      $('bag-tab-' + n).classList.toggle('hidden', n !== bagTabName);
      $('bag-btn-' + n).classList.toggle('active', n === bagTabName);
    });
  }
  const isPetObj = (o) => o && o.cat === 'pet';
  const sellUnit = (o) => {
    let base = o.paid || 0;
    if (!base) { const c = (typeof SHOP_CATALOG !== 'undefined' ? SHOP_CATALOG : []).find(x => x.id === o.id); base = c ? c.price : 0; }
    return Math.round(base * SELL_RATE / 1000) * 1000;
  };

  function renderBagLists() {
    const gen = $('inventory-list-container'), pet = $('bag-pet-container');
    if (!gen || !pet) return;
    if (!$('pet-style') && typeof window.renderPetTab === 'function') window.renderPetTab(); // nạp CSS của thú cưng

    const items = (S().inventory || []).filter(o => o && o.kind !== 'craft' && !isPetObj(o) && !(typeof isEstateObj === 'function' && isEstateObj(o)));
    const hasHouse = estates().length > 0;
    gen.innerHTML = (items.length ? items.map(o => {
      const unit = sellUnit(o), qty = o.qty || 1;
      return `<div class="bag-row"><div class="nm">${esc(o.name)}</div><div class="bt">
        <button class="btn btn-pink" onclick="UI.gift('${o.uniqueId}')">🎁 Tặng</button>
        ${unit > 0 ? `<button class="btn btn-outline" onclick="UI.sell('${o.uniqueId}',false)">💰 Bán ${short(unit)}</button>` : ''}
        ${unit > 0 && qty > 1 ? `<button class="btn btn-outline" onclick="UI.sell('${o.uniqueId}',true)">Bán hết</button>` : ''}
      </div></div>`;
    }).join('') : '<div class="life-card" style="text-align:center;color:#888;font-size:.82rem;">Túi đồ chung đang trống. Ghé 🛍️ Teemall mua sắm nhé!</div>') +
      (hasHouse ? '<div style="font-size:.74rem;color:#718096;text-align:center;">🏠 Nhà đất xem ở Cuộc Sống → Nhà (cho thuê, ở chung).</div>' : '');

    const pets = (S().inventory || []).filter(isPetObj);
    const petRows = pets.length ? pets.map(o => `<div class="bag-row"><div class="nm">${esc(o.name)}</div><div class="bt">${typeof window.petInvButtons === 'function' ? window.petInvButtons(o) : ''}</div></div>`).join('')
      : '<div class="life-card" style="text-align:center;color:#888;font-size:.82rem;">Chưa có thú nào đang chờ nhận nuôi. Mua ở 🛍️ Teemall → Shop thú cưng.</div>';
    pet.innerHTML = petRows + (window.PET && window.PET.bagHtml ? window.PET.bagHtml() : '');

    try { renderCraftBag(); renderMissionTab(); } catch (e) {}
  }
  window.refreshUiBag = function () { if (stack.includes('bag')) renderBagLists(); };
  window.openBagTab = function (name) { bagTabName = name || 'gen'; openFs('bag'); applyBagTab(); renderBagLists(); };

  function sellGeneral(uid, all) {
    const inv = S().inventory || [], i = inv.findIndex(x => x.uniqueId === uid);
    if (i < 0) return;
    const it = inv[i], have = it.qty || 1, qty = all ? have : 1, unit = sellUnit(it), total = unit * qty;
    if (unit <= 0) return alert('Món này không bán được.');
    const base = it.singleName || it.name.replace(/\s*\(x\d+\).*/, '');
    if (!confirm(`Bán ${qty}x "${base}" với giá ${total.toLocaleString('vi-VN')} VNĐ (${Math.round(SELL_RATE * 100)}% giá đã mua)?`)) return;
    if (qty >= have) inv.splice(i, 1); else { it.qty = have - qty; it.name = `${base} (x${it.qty})`; }
    S().walletBalance = (S().walletBalance || 0) + total;
    try { if (typeof mtrack === 'function') mtrack('sells', qty); } catch (e) {}
    saveStorage(); renderLifeModeUI();
    alert(`💰 Đã bán, nhận ${total.toLocaleString('vi-VN')} VNĐ.`);
  }

  // ===================== API GỌI TỪ HTML =====================
  window.UI = {
    mall: (m) => { mallMode = m; if (m === 'pet' && !petSub) petSub = 'animal'; renderMall(); },
    petSub: (s) => { petSub = s; renderMall(); },
    openMall: (m) => { mallMode = m || 'gen'; openFs('mall'); renderMall(); },
    bagTab: (n) => { bagTabName = n; applyBagTab(); renderBagLists(); },
    gift: (uid) => window.openSelectCharGiftModal(uid),
    sell: sellGeneral,
    pickStory: (i) => {
      const sid = (window.__pickStoryIds || [])[i], cb = window.__pickStoryCb;
      closeModal('ui-story-pick');
      if (sid && cb) cb(sid);
    },
    transfer: () => {
      const list = storiesWithChars();
      if (list.length > 1) return pickStory('💸 Chuyển khoản trong truyện nào?', (sid) => { S().activeStoryId = sid; openTransferModal(); });
      if (list.length === 1) S().activeStoryId = list[0].id; else ensureActive();
      openTransferModal();
    },
    main: (uid) => { S().mainHouseUid = uid; saveStorage(); renderHouse(); renderLifeScene(); },
    rent: (uid) => {
      const it = (S().inventory || []).find(x => x.uniqueId === uid); if (!it) return;
      if (!it.rented && (it.residents || []).length) return alert('Căn này đang có nhân vật ở chung. Hãy cho họ dọn ra trước khi đăng cho thuê nhé!');
      toggleRent(uid);
    },
    live: (uid, cid) => {
      const it = (S().inventory || []).find(x => x.uniqueId === uid); if (!it || it.rented) return;
      it.residents = (it.residents || []).filter(charById);
      const at = it.residents.indexOf(cid);
      if (at >= 0) it.residents.splice(at, 1);
      else {
        const cap = houseCap(it);
        if (it.residents.length >= cap) return alert(`Nhà này chỉ ở chung được tối đa ${cap} nhân vật.`);
        estates().forEach(h => { if (h !== it && h.residents) h.residents = h.residents.filter(x => x !== cid); });
        it.residents.push(cid);
      }
      saveStorage(); renderHouse(); renderLifeScene();
    }
  };
  window.openFs = openFs; window.closeFs = closeFs; window.closeAllFs = closeAllFs;

  // Làm mới ví khi tiền đổi ở nơi khác
  setInterval(() => { if (!document.hidden && stack.length) paintWallets(); }, 4000);
})();
