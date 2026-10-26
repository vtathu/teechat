// ===================== THỦ CÔNG MỸ NGHỆ (BÀN 9x12, GỘP 5 CHỦ ĐỀ) =====================
    const CRAFTS = {
      cake: { label: '🎂 Bánh', chain: [['🌾', 'Bột mì'], ['🥚', 'Trứng gà'], ['🍞', 'Bột nhào'], ['🥐', 'Bánh ra lò'], ['🧁', 'Cupcake'], ['🍰', 'Bánh kem'], ['🎂', 'Bánh sinh nhật'], ['🍮', 'Flan caramel'], ['🥧', 'Tart hoa quả'], ['🥞', 'Bánh ngàn lớp'], ['🍓', 'Bánh dâu hoàng gia'], ['🍯', 'Bánh mật ong thượng hạng'], ['💒', 'Bánh cưới ba tầng'], ['🏆', 'Bánh quán quân'], ['🎆', 'Bánh hoàng gia kim tuyến']] },
      flower: { label: '🌷 Hoa', chain: [['🌱', 'Hạt giống'], ['🌿', 'Mầm non'], ['🍀', 'Cây con'], ['🌷', 'Nụ hoa'], ['🌻', 'Hoa nở'], ['🌹', 'Hoa hồng'], ['💐', 'Bó hoa'], ['🌸', 'Cành anh đào'], ['🪷', 'Sen hồng'], ['🌺', 'Giỏ hoa nhiệt đới'], ['🏵️', 'Vòng hoa rực rỡ'], ['🪻', 'Vườn oải hương'], ['🌼', 'Cánh đồng hoa'], ['🦋', 'Vườn hoa bướm'], ['🌈', 'Vườn hoa cầu vồng']] },
      necklace: { label: '📿 Dây chuyền', chain: [['🪨', 'Đá thô'], ['🔹', 'Hạt cườm'], ['📿', 'Chuỗi hạt'], ['🔗', 'Dây xích'], ['🦪', 'Ngọc trai'], ['💎', 'Kim cương'], ['💫', 'Dây chuyền lấp lánh'], ['🌟', 'Mặt dây ngôi sao'], ['💠', 'Mặt dây đá quý'], ['🔮', 'Lục bảo huyền bí'], ['💖', 'Mặt dây trái tim'], ['🪙', 'Vòng cổ vàng khối'], ['💍', 'Bộ trang sức đôi'], ['👸', 'Vòng cổ công chúa'], ['👑', 'Dây chuyền hoàng hậu']] },
      lego: { label: '🧱 Lego (đồ ghép)', chain: [['🧱', 'Viên gạch'], ['🟦', 'Khối ghép'], ['🚗', 'Xe nhỏ'], ['🏠', 'Ngôi nhà'], ['🏰', 'Lâu đài'], ['🚀', 'Tên lửa'], ['🌆', 'Thành phố mô hình'], ['🚢', 'Tàu thủy'], ['✈️', 'Máy bay'], ['🎡', 'Công viên giải trí'], ['🏟️', 'Sân vận động'], ['🛰️', 'Trạm vũ trụ'], ['🌉', 'Cây cầu khổng lồ'], ['🗼', 'Tháp mô hình'], ['🌍', 'Thế giới thu nhỏ']] },
      teddy: { label: '🧸 Gấu len', chain: [['🧶', 'Cuộn len'], ['🧵', 'Sợi len se'], ['🧣', 'Khăn len'], ['🧦', 'Tất len'], ['🐥', 'Thú len nhỏ'], ['🧸', 'Gấu bông'], ['🎀', 'Gấu bông nơ'], ['🐰', 'Thỏ len'], ['🐻', 'Gấu len cỡ lớn'], ['🪆', 'Búp bê len'], ['🎠', 'Ngựa len'], ['🐘', 'Voi len khổng lồ'], ['🦄', 'Kỳ lân len'], ['🐉', 'Rồng len'], ['🌠', 'Gấu bông ngôi sao']] }
    };
    const THEMES = Object.keys(CRAFTS);
    const THEME_HUE = { cake: 28, flower: 335, necklace: 200, lego: 130, teddy: 265 };
    const CRAFT_COLS = 9, CRAFT_ROWS = 12, CRAFT_CELLS = 108;
    // Các số cân bằng game: chỉnh ở đây nếu thấy quá dễ / quá khó
    // Lượt mua nguyên liệu dùng chung mọi ván: tối đa 10, hồi 1 lượt sau mỗi 90 phút
    const BUY_REGEN_MS = 90 * 60000;
    function buyTokens() {
      const st = window.state, now = nowTs(), MAX = CRAFT_CFG.maxBuys;
      let b = st.craftBuys;
      if (!b || typeof b.n !== 'number' || typeof b.ts !== 'number') b = st.craftBuys = { n: MAX, ts: now };
      if (b.n >= MAX) { b.n = MAX; b.ts = now; }
      else {
        const k = Math.floor((now - b.ts) / BUY_REGEN_MS);
        if (k > 0) { b.n = Math.min(MAX, b.n + k); b.ts = b.n >= MAX ? now : b.ts + k * BUY_REGEN_MS; }
      }
      return b;
    }
    function buyNextMs() { const b = buyTokens(); return b.n >= CRAFT_CFG.maxBuys ? 0 : Math.max(0, b.ts + BUY_REGEN_MS - nowTs()); }
    const CRAFT_CFG = { startPieces: 60, buyPieces: 12, maxBuys: 10, orderSlots: 3, dailyRuns: 4 };
    const BOX_TIERS = {
      normal: { label: 'thường', icon: '📦', pieces: 12 },
      silver: { label: 'bạc', icon: '🥈', pieces: 10 },
      gold: { label: 'vàng', icon: '🥇', pieces: 8 }
    };
    // Đồ cũ (Lv1-7) còn trong túi vẫn giữ giá cũ. Đồ mới chỉ bán được từ Lv10.
    const CRAFT_PRICE_OLD = [0, 10000, 30000, 80000, 200000, 500000, 1200000, 3000000];
    const CRAFT_PRICE_HI = { 10: 4000000, 11: 7000000, 12: 12000000, 13: 21000000, 14: 37000000, 15: 65000000 };
    const CRAFT_MAX = 15;
    const CRAFT_SELL_MIN = 10;

    // Mỗi ô bàn lưu 1 số: chủ đề * 100 + cấp (0 = ô trống)
    const ccode = (t, lv) => t * 100 + lv;
    const cTheme = (c) => Math.floor(c / 100);
    const cLv = (c) => c % 100;

    // Thời giá: mỗi ngày mỗi loại có hệ số 0.7 - 1.4
    function craftMarketMult(type) {
      const s = new Date(nowTs()).toDateString() + type;
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return 0.7 + (h % 71) / 100;
    }
    function craftPrice(type, level, giftOnly) {
      let base;
      if (level >= CRAFT_SELL_MIN) base = CRAFT_PRICE_HI[level] || 0;
      else if (giftOnly) return 0;
      else base = CRAFT_PRICE_OLD[level] || 0;
      return Math.round(base * craftMarketMult(type) / 1000) * 1000;
    }
    function craftSellable(it) { return it.level >= CRAFT_SELL_MIN || !it.giftOnly; }
    function refreshWalletDisplay() {
      const el = document.getElementById('life-wallet-display');
      if (el) el.innerText = (window.state.walletBalance || 0).toLocaleString('vi-VN') + ' VNĐ';
    }

    function craftBagButtons(obj) {
      const price = craftPrice(obj.craftType, obj.level, obj.giftOnly);
      let h = '';
      if (craftSellable(obj)) {
        h += `<button class="action-text-btn" onclick="sellCraftItem('${obj.uniqueId}')">Bán ~${price.toLocaleString('vi-VN')}</button> `;
        if ((obj.qty || 1) > 1) h += `<button class="action-text-btn" onclick="sellCraftItem('${obj.uniqueId}', true)">Bán hết</button> `;
      } else {
        h += `<span style="font-size:0.7rem;color:#718096;">Chỉ để tặng</span> `;
      }
      h += `<button class="action-text-btn" onclick="openSelectCharGiftModal('${obj.uniqueId}')">Tặng</button>`;
      return h;
    }

    function updateCraftPreview() {
      const box = document.getElementById('craft-chain-preview');
      if (!box) return;
      box.innerHTML = THEMES.map(t => `<div style="margin:2px 0;"><b style="font-size:0.75rem;">${CRAFTS[t].label}</b><div style="font-size:1.05rem;line-height:1.3;word-break:break-all;">${CRAFTS[t].chain.map(x => x[0]).join('')}</div></div>`).join('');
      const info = document.getElementById('craft-market-info');
      if (info) {
        info.innerHTML = '<b>Thời giá hôm nay:</b> ' + THEMES.map(k => `${CRAFTS[k].label.split(' ')[0]} ×${craftMarketMult(k).toFixed(2)}`).join(' | ') +
          `<br>Giá bán gốc (chỉ từ Lv10): ` + [10, 11, 12, 13, 14, 15].map(l => `Lv${l} ${(CRAFT_PRICE_HI[l]).toLocaleString('vi-VN')}`).join(' | ') +
          `<br>Có tối đa ${CRAFT_CFG.maxBuys} lượt mua nguyên liệu (tốn tiền), hồi 1 lượt sau mỗi 90 phút. Thêm nguyên liệu bằng box từ tab Nhiệm Vụ. Tối đa ${CRAFT_CFG.dailyRuns} ván mỗi ngày: đã chơi ${window.state.dailyCraftCount || 0}/${CRAFT_CFG.dailyRuns}.`;
      }
      const btn = document.getElementById('craft-start-btn');
      if (btn) btn.innerText = window.state.craftSession ? '▶ Tiếp tục ván đang làm' : '🛠 Bắt Đầu Ván Mới';
    }

    function renderCraftBag() {
      const box = document.getElementById('craft-bag-container');
      if (!box) return;
      const items = (window.state.inventory || []).filter(i => i.kind === 'craft');
      if (items.length === 0) { box.innerHTML = '<div style="font-size:0.8rem;color:#888;text-align:center;">Chưa có đồ thủ công nào.</div>'; return; }
      box.innerHTML = '';
      items.forEach(obj => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:6px;background:#fff;border:1px solid #90d4b8;border-radius:8px;padding:6px 8px;font-size:0.8rem;flex-wrap:wrap;';
        row.innerHTML = `<span>${obj.name}</span><span style="display:flex;gap:4px;flex-shrink:0;align-items:center;flex-wrap:wrap;">${craftBagButtons(obj)}</span>`;
        box.appendChild(row);
      });
    }

    function setCraftQty(it, q) {
      const base = it.name.replace(/\s*\(x\d+\)$/, '');
      it.qty = q;
      it.name = q > 1 ? `${base} (x${q})` : base;
    }

    function addCraftToBag(type, lvl, giftOnly) {
      if (!window.state.inventory) window.state.inventory = [];
      const inv = window.state.inventory;
      const ex = inv.find(i => i.kind === 'craft' && i.craftType === type && i.level === lvl && !!i.giftOnly === !!giftOnly);
      if (ex) { setCraftQty(ex, (ex.qty || 1) + 1); return; }
      const info = CRAFTS[type].chain[lvl - 1];
      const baseName = `${info[0]} ${info[1]} (Lv.${lvl})`;
      inv.push({
        id: 'craft-' + type + '-' + lvl,
        kind: 'craft',
        craftType: type,
        level: lvl,
        giftOnly: !!giftOnly,
        name: baseName,
        singleName: baseName + ' tự làm',
        qty: 1,
        tag: 'handmade',
        desc: `Đồ thủ công tự làm cấp ${lvl}` + (giftOnly ? ' (chỉ để tặng)' : ''),
        uniqueId: 'inv-' + Date.now() + Math.random()
      });
    }

    function sellCraftItem(uniqueId, all) {
      const inv = window.state.inventory || [];
      const idx = inv.findIndex(i => i.uniqueId === uniqueId);
      if (idx === -1) return;
      const it = inv[idx];
      if (!craftSellable(it)) return alert('Món này chỉ để tặng, không bán được (chỉ bán từ Lv10 trở lên).');
      const have = it.qty || 1;
      const qty = all ? have : 1;
      const unit = craftPrice(it.craftType, it.level, it.giftOnly);
      const total = unit * qty;
      const nm = it.name.replace(/\s*\(x\d+\)$/, '');
      if (!confirm(`Bán ${qty}x "${nm}" với giá ${total.toLocaleString('vi-VN')} VNĐ (thời giá hôm nay ×${craftMarketMult(it.craftType).toFixed(2)})?`)) return;
      if (qty >= have) inv.splice(idx, 1); else setCraftQty(it, have - qty);
      window.state.walletBalance = (window.state.walletBalance || 0) + total;
      mtrack('sells', qty);
      saveStorage();
      renderLifeModeUI();
      alert(`💰 Đã bán, nhận ${total.toLocaleString('vi-VN')} VNĐ.`);
    }

    // ---------- Box nguyên liệu (nhận từ nhiệm vụ) ----------
    function addBox(theme, tier, n) {
      if (!window.state.boxes) window.state.boxes = {};
      const k = theme + '_' + tier;
      window.state.boxes[k] = (window.state.boxes[k] || 0) + (n || 1);
    }
    function boxCount(theme, tier) { return (window.state.boxes && window.state.boxes[theme + '_' + tier]) || 0; }
    function totalBoxes() {
      let n = 0;
      Object.values(window.state.boxes || {}).forEach(v => { n += v || 0; });
      return n;
    }

    // ---------- Sinh nguyên liệu ----------
    // Tỉ lệ ra cấp cao phụ thuộc số món cấp cao CỦA CÙNG CHỦ ĐỀ đang có trên bàn
    function themeStats(board, tIdx) {
      let n3 = 0, n5 = 0, n7 = 0;
      for (const c of board) {
        if (c && cTheme(c) === tIdx) {
          const l = cLv(c);
          if (l >= 3) n3++;
          if (l >= 5) n5++;
          if (l >= 7) n7++;
        }
      }
      return { n3, n5, n7 };
    }
    function spawnLevel(board, tIdx) {
      const st = themeStats(board, tIdx);
      const p4 = Math.min(0.08, 0.01 * st.n7);
      const p3 = Math.min(0.22, 0.02 * st.n5);
      const p2 = Math.min(0.40, 0.04 * st.n3);
      const r = Math.random();
      if (r < p4) return 4;
      if (r < p4 + p3) return 3;
      if (r < p4 + p3 + p2) return 2;
      return 1;
    }
    function boxLevel(tier, board, tIdx) {
      const r = Math.random() * 100;
      if (tier === 'silver') return r < 55 ? 2 : (r < 90 ? 3 : 4);
      if (tier === 'gold') return r < 50 ? 3 : (r < 85 ? 4 : 5);
      return spawnLevel(board, tIdx);
    }
    function placePieces(s, tIdx, n, tier) {
      const free = [];
      s.board.forEach((v, i) => { if (!v) free.push(i); });
      jgShuffle(free);
      const take = free.slice(0, n);
      take.forEach(i => { s.board[i] = ccode(tIdx, boxLevel(tier || 'normal', s.board, tIdx)); });
      recalcBest(s);
      return take.length;
    }
    function recalcBest(s) {
      if (!s.best) s.best = {};
      THEMES.forEach(t => { if (typeof s.best[t] !== 'number') s.best[t] = 0; });
      s.board.forEach(c => {
        if (!c) return;
        const t = THEMES[cTheme(c)];
        if (cLv(c) > s.best[t]) s.best[t] = cLv(c);
      });
    }
    function freeCells(s) { return s.board.filter(v => !v).length; }
    function buyCost(s, t, n) {
      const full = 8000 + 3000 * Math.max(1, s.best[t] || 1);
      return Math.round(full * Math.min(n, CRAFT_CFG.buyPieces) / CRAFT_CFG.buyPieces / 100) * 100;
    }

    // ---------- Đơn hàng (tùy chọn) ----------
    const orderUnit = (lv) => Math.round(2000 * Math.pow(1.8, lv - 2) / 100) * 100;
    function genOrder(s) {
      const bestAll = Math.max(1, ...THEMES.map(t => s.best[t] || 0));
      const maxLv = Math.max(3, Math.min(9, bestAll + 1));
      const lv = jgRand(2, maxLv);
      const two = lv <= 5 && Math.random() < 0.4;
      const ts = jgShuffle(THEMES.slice()).slice(0, two ? 2 : 1);
      const need = ts.map(t => ({ t, lv: two ? Math.max(2, lv - jgRand(0, 1)) : lv, n: 1 }));
      const money = Math.round(need.reduce((a, x) => a + orderUnit(x.lv) * x.n, 0) * 1.5 / 100) * 100;
      const o = { id: 'o' + Date.now() + Math.floor(Math.random() * 1e5), need, money };
      if (Math.random() < 0.4) o.box = { theme: need[0].t, tier: Math.max(...need.map(x => x.lv)) >= 7 ? 'silver' : 'normal' };
      return o;
    }
    // Trả về danh sách ô sẽ bị lấy (dùng món đúng cấp hoặc cao hơn, ưu tiên cấp thấp), hoặc null nếu chưa đủ
    function orderPick(s, o) {
      const used = new Set();
      const picks = [];
      for (const nd of o.need) {
        const ti = THEMES.indexOf(nd.t);
        const cand = [];
        s.board.forEach((c, i) => { if (c && cTheme(c) === ti && cLv(c) >= nd.lv && !used.has(i)) cand.push(i); });
        cand.sort((a, b) => s.board[a] - s.board[b]);
        if (cand.length < nd.n) return null;
        cand.slice(0, nd.n).forEach(i => { used.add(i); picks.push(i); });
      }
      return picks;
    }
    function deliverOrder(id) {
      const s = window.state.craftSession;
      if (!s) return;
      const k = s.orders.findIndex(o => o.id === id);
      if (k < 0) return;
      const o = s.orders[k];
      const picks = orderPick(s, o);
      if (!picks) return craftToast('Chưa đủ nguyên liệu cho đơn này!');
      picks.forEach(i => { s.board[i] = 0; });
      window.state.walletBalance = (window.state.walletBalance || 0) + o.money;
      if (o.box) addBox(o.box.theme, o.box.tier, 1);
      s.orders[k] = genOrder(s);
      mtrack('orders', 1);
      craftSel = -1;
      craftPersist(true);
      renderCraftBoard();
      renderCraftSheet('orders');
      refreshWalletDisplay();
      craftToast(`✅ Giao đơn xong! +${o.money.toLocaleString('vi-VN')}đ${o.box ? ' + 1 box' : ''}`);
    }

    // ---------- Ván chơi ----------
    let craftSel = -1, craftPop = -1, craftSaveTimer = null, craftSheetKind = null, craftBound = false, craftDrag = null, craftToastTimer = null;

    function newCraftSession() {
      const s = { v: 2, autoUsed: false, board: Array(CRAFT_CELLS).fill(0), buys: 0, spent: 0, merges: 0, best: {}, orders: [] };
      THEMES.forEach(t => { s.best[t] = 0; });
      const cells = jgShuffle(Array.from({ length: CRAFT_CELLS }, (_, i) => i)).slice(0, CRAFT_CFG.startPieces);
      cells.forEach((i, k) => { s.board[i] = ccode(k % THEMES.length, 1); });
      recalcBest(s);
      for (let k = 0; k < CRAFT_CFG.orderSlots; k++) s.orders.push(genOrder(s));
      return s;
    }

    function craftPersist(now) {
      if (craftSaveTimer) { clearTimeout(craftSaveTimer); craftSaveTimer = null; }
      if (now) { saveStorage(); return; }
      craftSaveTimer = setTimeout(() => { craftSaveTimer = null; saveStorage(); }, 1200);
    }

    function craftToast(msg) {
      const el = document.getElementById('craft-toast');
      if (!el) return;
      el.innerText = msg;
      el.style.display = 'block';
      if (craftToastTimer) clearTimeout(craftToastTimer);
      craftToastTimer = setTimeout(() => { el.style.display = 'none'; }, 1800);
    }

    function startCraftGame() {
      checkDailyReset();
      if (!window.state.craftSession) {
        if ((window.state.dailyCraftCount || 0) >= CRAFT_CFG.dailyRuns) {
          return alert(`Bạn đã hết ${CRAFT_CFG.dailyRuns} ván thủ công trong ngày hôm nay! Hãy quay lại vào ngày mai.`);
        }
        window.state.dailyCraftCount = (window.state.dailyCraftCount || 0) + 1;
        window.state.craftSession = newCraftSession();
        saveStorage();
        renderLifeModeUI();
      }
      craftSel = -1;
      bindCraftBoard();
      document.getElementById('craft-screen').classList.add('active');
      renderCraftSheet(null);
      requestAnimationFrame(() => { fitCraftBoard(); renderCraftBoard(); });
    }

    function fitCraftBoard() {
      const wrap = document.getElementById('craft-board-wrap');
      const el = document.getElementById('craft-board');
      if (!wrap || !el) return;
      const w = wrap.clientWidth - 8, h = wrap.clientHeight - 8;
      const size = Math.max(200, Math.floor(Math.min(w, h * CRAFT_COLS / CRAFT_ROWS)));
      el.style.width = size + 'px';
      el.style.height = Math.floor(size * CRAFT_ROWS / CRAFT_COLS) + 'px';
      el.style.fontSize = Math.floor(size / CRAFT_COLS * 0.58) + 'px';
    }
    window.addEventListener('resize', () => {
      const sc = document.getElementById('craft-screen');
      if (sc && sc.classList.contains('active')) fitCraftBoard();
    });

    function renderCraftBoard() {
      const s = window.state.craftSession;
      if (!s) return;
      const pop = craftPop; craftPop = -1;
      const el = document.getElementById('craft-board');
      el.innerHTML = s.board.map((c, i) => {
        if (!c) return `<div class="craft-cell" data-i="${i}"></div>`;
        const th = THEMES[cTheme(c)], lv = cLv(c), info = CRAFTS[th].chain[lv - 1];
        const hue = THEME_HUE[th];
        const hi = lv >= CRAFT_SELL_MIN;
        const bg = hi ? 'linear-gradient(135deg,#fff3b0,#ffd166)' : `hsl(${hue},75%,${93 - Math.min(lv, 9) * 2.5}%)`;
        const bd = hi ? '#d69e2e' : `hsl(${hue},55%,62%)`;
        return `<div class="craft-cell${craftSel === i ? ' sel' : ''}${pop === i ? ' pop' : ''}" data-i="${i}" style="background:${bg};border-color:${bd};">${info[0]}<span class="craft-lv">${lv}</span></div>`;
      }).join('');
      updateCraftHud();
    }

    function updateCraftHud() {
      const s = window.state.craftSession;
      if (!s) return;
      const m = document.getElementById('craft-hud-money');
      if (m) m.innerText = '💲 ' + (window.state.walletBalance || 0).toLocaleString('vi-VN');
      const ch = document.getElementById('craft-chips');
      if (ch) {
        ch.innerHTML = THEMES.map(t => {
          const lv = s.best[t] || 0;
          const info = lv ? CRAFTS[t].chain[lv - 1] : CRAFTS[t].chain[0];
          return `<span style="background:hsl(${THEME_HUE[t]},75%,92%);border:1px solid hsl(${THEME_HUE[t]},55%,62%);border-radius:10px;padding:1px 6px;">${info[0]} ${lv ? 'Lv' + lv : '-'}</span>`;
        }).join('');
      }
      const left = buyTokens().n;
      const bb = document.getElementById('craft-btn-buy'); if (bb) bb.innerText = `🛒 Mua (${left})`;
      const xb = document.getElementById('craft-btn-box'); if (xb) xb.innerText = `🎁 Box (${totalBoxes()})`;
      const ab = document.getElementById('craft-btn-auto'); if (ab) { ab.innerText = s.autoUsed ? '⚡ Gộp (0)' : '⚡ Gộp (1)'; ab.disabled = !!s.autoUsed; }
      const ob = document.getElementById('craft-btn-orders'); if (ob) ob.innerText = `📋 Đơn (${s.orders.length})`;
    }

    // ---------- Thao tác: chạm 2 ô hoặc kéo thả ----------
    function craftAct(from, to) {
      const s = window.state.craftSession;
      const b = s.board;
      if (from === to || !b[from]) return false;
      if (!b[to]) { b[to] = b[from]; b[from] = 0; return 'move'; }
      if (b[from] === b[to] && cLv(b[to]) < CRAFT_MAX) {
        b[to] = b[to] + 1;
        b[from] = 0;
        s.merges = (s.merges || 0) + 1;
        const th = THEMES[cTheme(b[to])], lv = cLv(b[to]);
        if (lv > (s.best[th] || 0)) s.best[th] = lv;
        craftPop = to;
        mtrack('merges', 1);
        mtrack('craftBest', lv, 'max');
        return 'merge';
      }
      return false;
    }

    // Sắp xếp: gom cùng chủ đề thành cụm, trong cụm xếp theo cấp, không tốn lượt
    function craftSortBoard() {
      const s = window.state.craftSession; if (!s) return;
      const items = s.board.filter(v => v).sort((a, b) => cTheme(a) - cTheme(b) || cLv(a) - cLv(b));
      s.board = Array(CRAFT_CELLS).fill(0);
      items.forEach((v, i) => { s.board[i] = v; });
      craftSel = -1; craftPersist(); renderCraftBoard(); craftToast('🧹 Đã sắp xếp');
    }
    // Tự gộp: 1 lần mỗi ván, gộp mọi cặp giống nhau đang có trên bàn (1 vòng)
    function craftAutoMerge() {
      const s = window.state.craftSession; if (!s || s.autoUsed) return;
      const groups = {};
      s.board.forEach((v, i) => { if (v && cLv(v) < CRAFT_MAX) (groups[v] = groups[v] || []).push(i); });
      const pairs = [];
      Object.values(groups).forEach(g => { for (let k = 0; k + 1 < g.length; k += 2) pairs.push([g[k], g[k + 1]]); });
      if (!pairs.length) return craftToast('Chưa có cặp nào để gộp');
      pairs.forEach(([a, b]) => craftAct(a, b));
      s.autoUsed = true;
      craftSel = -1; craftPersist(true);
      craftToast(`⚡ Đã gộp ${pairs.length} cặp`);
      craftAfterAct('merge');
    }

    function craftAfterAct(r) {
      if (r) { craftSel = -1; craftPersist(); }
      renderCraftBoard();
      if (r === 'merge') checkCraftStuck();
    }

    function tapCraftCell(i) {
      const s = window.state.craftSession;
      if (!s) return;
      const b = s.board;
      if (craftSel === -1) { if (b[i]) craftSel = i; renderCraftBoard(); return; }
      if (craftSel === i) { craftSel = -1; renderCraftBoard(); return; }
      const r = craftAct(craftSel, i);
      if (r) { craftAfterAct(r); return; }
      craftSel = b[i] ? i : -1;
      renderCraftBoard();
    }

    function bindCraftBoard() {
      if (craftBound) return;
      craftBound = true;
      const el = document.getElementById('craft-board');
      el.addEventListener('pointerdown', (e) => {
        const c = e.target.closest('[data-i]');
        const s = window.state.craftSession;
        if (!c || !s) return;
        const i = parseInt(c.dataset.i, 10);
        craftDrag = { i, x: e.clientX, y: e.clientY, moved: false, ghost: null, has: !!s.board[i] };
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
      });
      el.addEventListener('pointermove', (e) => {
        const d = craftDrag;
        if (!d || !d.has) return;
        if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) {
          d.moved = true;
          const src = el.querySelector(`[data-i="${d.i}"]`);
          if (src) {
            src.classList.add('dragging');
            const g = src.cloneNode(true);
            g.className = 'craft-cell craft-ghost';
            g.style.width = src.offsetWidth + 'px';
            g.style.height = src.offsetHeight + 'px';
            g.style.fontSize = getComputedStyle(src).fontSize;
            document.body.appendChild(g);
            d.ghost = g;
          }
        }
        if (d.ghost) { d.ghost.style.left = e.clientX + 'px'; d.ghost.style.top = e.clientY + 'px'; }
      });
      const end = (e, cancel) => {
        const d = craftDrag;
        craftDrag = null;
        if (!d) return;
        if (d.ghost) d.ghost.remove();
        if (cancel) { renderCraftBoard(); return; }
        if (d.moved) {
          const t = document.elementFromPoint(e.clientX, e.clientY);
          const cell = t && t.closest ? t.closest('#craft-board [data-i]') : null;
          if (cell) { craftAfterAct(craftAct(d.i, parseInt(cell.dataset.i, 10))); return; }
          renderCraftBoard();
          return;
        }
        tapCraftCell(d.i);
      };
      el.addEventListener('pointerup', (e) => end(e, false));
      el.addEventListener('pointercancel', (e) => end(e, true));
    }

    // Bàn đầy và không còn cặp nào ghép được (cũng không giao đơn được) thì tự kết thúc
    function checkCraftStuck() {
      const s = window.state.craftSession;
      if (!s) return;
      if (s.board.some(v => !v)) return;
      const seen = {};
      for (const v of s.board) {
        if (cLv(v) < CRAFT_MAX) {
          if (seen[v]) return;
          seen[v] = 1;
        }
      }
      if (s.orders.some(o => orderPick(s, o))) return;
      setTimeout(() => {
        alert('🧩 Bàn đã kẹt, không ghép được nữa! Ván tự động kết thúc.');
        finishCraft(true);
      }, 200);
    }

    // ---------- Bảng chọn phía dưới: mua / box / đơn hàng ----------
    function renderCraftSheet(kind) {
      const sh = document.getElementById('craft-sheet');
      const s = window.state.craftSession;
      if (!sh) return;
      if (!kind || !s) {
        craftSheetKind = null;
        sh.classList.remove('active');
        sh.innerHTML = '';
        sh.dataset.kind = '';
        return;
      }
      craftSheetKind = kind;
      sh.dataset.kind = kind;
      const titles = { buy: '🛒 Mua nguyên liệu', box: '🎁 Mở box nguyên liệu', orders: '📋 Đơn hàng (tùy chọn)' };
      let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><b style="color:var(--app-dark-green);">${titles[kind]}</b><button class="btn btn-outline" onclick="renderCraftSheet(null)">✖</button></div>`;
      const free = freeCells(s);

      if (kind === 'buy') {
        const left = buyTokens().n;
        html += `<div style="font-size:0.8rem;color:#718096;margin-bottom:6px;">Còn <b>${left}/${CRAFT_CFG.maxBuys}</b> lượt mua (hồi 1 lượt mỗi 90 phút${buyNextMs() ? ', lượt kế tiếp sau ' + Math.ceil(buyNextMs() / 60000) + ' phút' : ''}). Mỗi lượt được ${CRAFT_CFG.buyPieces} miếng của chủ đề bạn chọn (có thể ra cấp cao hơn nếu bàn đã có món cao của chủ đề đó). Bàn còn ${free} ô trống.</div>`;
        THEMES.forEach(t => {
          const n = Math.min(free, CRAFT_CFG.buyPieces);
          const cost = buyCost(s, t, n);
          const dis = left <= 0 || free <= 0;
          html += `<div class="shop-item-row" style="margin-bottom:6px;"><div><b>${CRAFTS[t].label}</b><div style="font-size:0.75rem;color:#718096;">Cao nhất đã làm: ${s.best[t] ? 'Lv' + s.best[t] : 'chưa có'}</div></div><button class="btn btn-pink" ${dis ? 'disabled style="opacity:.5"' : ''} onclick="buyCraftMaterials('${t}')">-${cost.toLocaleString('vi-VN')}đ · +${n}</button></div>`;
        });
      } else if (kind === 'box') {
        let any = false;
        THEMES.forEach(t => {
          Object.keys(BOX_TIERS).forEach(tier => {
            const c = boxCount(t, tier);
            if (c <= 0) return;
            any = true;
            const bt = BOX_TIERS[tier];
            html += `<div class="shop-item-row" style="margin-bottom:6px;"><div><b>${bt.icon} Box ${bt.label} · ${CRAFTS[t].label}</b><div style="font-size:0.75rem;color:#718096;">Có ${c} · mở ra ${bt.pieces} miếng${tier === 'silver' ? ' (Lv2-4)' : (tier === 'gold' ? ' (Lv3-5)' : '')}</div></div><button class="btn btn-pink" onclick="openCraftBox('${t}','${tier}')">Mở</button></div>`;
          });
        });
        if (!any) html += '<div style="font-size:0.85rem;color:#888;text-align:center;padding:10px;">Chưa có box nào. Làm nhiệm vụ ở tab Nhiệm Vụ để nhận box nhé!</div>';
        else html += `<div style="font-size:0.75rem;color:#718096;">Bàn còn ${free} ô trống (cần đủ chỗ để mở).</div>`;
      } else if (kind === 'orders') {
        html += '<div style="font-size:0.8rem;color:#718096;margin-bottom:6px;">Giao đủ món (đúng cấp hoặc cao hơn) để nhận tiền, có thể kèm box. Làm hay không tùy bạn.</div>';
        s.orders.forEach(o => {
          const ok = !!orderPick(s, o);
          const needTxt = o.need.map(n => { const info = CRAFTS[n.t].chain[n.lv - 1]; return `${info[0]} ${info[1]} (Lv.${n.lv}+)`; }).join(' + ');
          const reward = `💲 ${o.money.toLocaleString('vi-VN')}` + (o.box ? ` + ${BOX_TIERS[o.box.tier].icon} Box ${BOX_TIERS[o.box.tier].label} ${CRAFTS[o.box.theme].label.split(' ')[0]}` : '');
          html += `<div class="shop-item-row" style="margin-bottom:6px;"><div style="min-width:0;"><div style="font-size:0.85rem;font-weight:bold;">${needTxt}</div><div style="font-size:0.75rem;color:#2c7a7b;">${reward}</div></div><button class="btn ${ok ? 'btn-pink' : 'btn-outline'}" ${ok ? '' : 'disabled style="opacity:.5"'} onclick="deliverOrder('${o.id}')">Giao</button></div>`;
        });
      }
      sh.innerHTML = html;
      sh.classList.add('active');
    }
    function toggleCraftSheet(kind) {
      if (craftSheetKind === kind) renderCraftSheet(null);
      else renderCraftSheet(kind);
    }

    function buyCraftMaterials(t) {
      const s = window.state.craftSession;
      if (!s) return;
      if (buyTokens().n <= 0) return craftToast(`Hết lượt mua! Lượt kế tiếp hồi sau ${Math.ceil(buyNextMs() / 60000)} phút.`);
      const free = freeCells(s);
      if (free <= 0) return craftToast('Bàn đã đầy! Hãy ghép bớt trước.');
      const n = Math.min(free, CRAFT_CFG.buyPieces);
      const cost = buyCost(s, t, n);
      if ((window.state.walletBalance || 0) < cost) return craftToast(`Không đủ tiền! Cần ${cost.toLocaleString('vi-VN')}đ`);
      window.state.walletBalance -= cost;
      s.spent = (s.spent || 0) + cost;
      s.buys++; buyTokens().n--;
      placePieces(s, THEMES.indexOf(t), n);
      craftPersist(true);
      renderCraftBoard();
      renderCraftSheet('buy');
      refreshWalletDisplay();
    }

    function openCraftBox(t, tier) {
      const s = window.state.craftSession;
      if (!s || boxCount(t, tier) <= 0) return;
      const need = BOX_TIERS[tier].pieces;
      if (freeCells(s) < need) return craftToast(`Cần ít nhất ${need} ô trống để mở box này!`);
      window.state.boxes[t + '_' + tier]--;
      placePieces(s, THEMES.indexOf(t), need, tier);
      craftPersist(true);
      renderCraftBoard();
      renderCraftSheet('box');
    }

    function closeCraft() {
      craftPersist(true);
      renderCraftSheet(null);
      document.getElementById('craft-screen').classList.remove('active');
      renderLifeModeUI();
    }

    function requestFinishCraft() {
      const s = window.state.craftSession;
      if (!s) { closeCraft(); return; }
      const hi = s.board.filter(c => c && cLv(c) >= CRAFT_SELL_MIN).length;
      const msg = hi > 0
        ? `Kết thúc ván? Bạn có ${hi} món từ Lv10 trở lên sẽ vào túi để bán/tặng. Các món dưới Lv10 và đơn hàng chưa giao sẽ bị bỏ.`
        : 'Kết thúc ván? Chưa có món nào từ Lv10, chỉ món cao nhất được giữ lại để TẶNG (không bán được). Các món còn lại bị bỏ.';
      if (confirm(msg)) finishCraft(false);
    }

    function finishCraft(auto) {
      const s = window.state.craftSession;
      if (!s) return;
      if (craftSaveTimer) { clearTimeout(craftSaveTimer); craftSaveTimer = null; }

      const counts = {};
      s.board.forEach(c => { if (c && cLv(c) >= CRAFT_SELL_MIN) counts[c] = (counts[c] || 0) + 1; });
      const keys = Object.keys(counts).map(Number).sort((a, b) => cLv(b) - cLv(a));
      let summary = '', est = 0;

      if (keys.length > 0) {
        keys.forEach(code => {
          const th = THEMES[cTheme(code)], lv = cLv(code);
          for (let k = 0; k < counts[code]; k++) addCraftToBag(th, lv, false);
          est += craftPrice(th, lv) * counts[code];
          const info = CRAFTS[th].chain[lv - 1];
          summary += `${counts[code]}x ${info[0]} ${info[1]} (Lv.${lv})\n`;
        });
        summary = `Thu về:\n${summary}Giá bán ước tính hôm nay: ~${est.toLocaleString('vi-VN')} VNĐ.`;
      } else {
        let bestC = 0;
        s.board.forEach(c => { if (c && cLv(c) > cLv(bestC)) bestC = c; });
        if (bestC) {
          const th = THEMES[cTheme(bestC)], lv = cLv(bestC);
          addCraftToBag(th, lv, true);
          const info = CRAFTS[th].chain[lv - 1];
          summary = `Chưa có món nào từ Lv10 nên không có gì để bán.\nBạn giữ lại 1 món để tặng: ${info[0]} ${info[1]} (Lv.${lv}).`;
        } else {
          summary = 'Bàn trống, không có gì để giữ lại.';
        }
      }

      const spent = s.spent || 0;
      window.state.craftSession = null;
      craftSel = -1;
      renderCraftSheet(null);
      document.getElementById('craft-screen').classList.remove('active');
      saveStorage();
      renderLifeModeUI();
      alert(`${auto ? '' : '✅ '}Kết thúc ván!\n${summary}\nĐã chi nguyên liệu: ${spent.toLocaleString('vi-VN')} VNĐ.`);
    }

    // Ván cũ (bàn 12x12 một chủ đề) tự kết thúc khi vào bản mới
    function migrateOldCraft() {
      const old = window.state.craftSession;
      if (!old || old.v) return;
      const type = CRAFTS[old.type] ? old.type : 'cake';
      let best = 1;
      const counts = {};
      (old.board || []).forEach(v => { if (v > best) best = v; if (v >= CRAFT_SELL_MIN) counts[v] = (counts[v] || 0) + 1; });
      const lvls = Object.keys(counts);
      if (lvls.length) lvls.forEach(l => { for (let k = 0; k < counts[l]; k++) addCraftToBag(type, parseInt(l, 10), false); });
      else if (best > 1) addCraftToBag(type, Math.min(best, CRAFT_MAX), true);
      window.state.craftSession = null;
      saveStorage();
      setTimeout(() => alert('🧶 Ván thủ công cũ (bàn 12×12) đã tự kết thúc, đồ đã được đưa vào túi thủ công. Bàn mới 9×12 gộp 5 chủ đề đã sẵn sàng!'), 600);
    }
