// ===================== KEY / THỜI GIAN / ĐỒNG BỘ =====================
    function loadKeys() {
      try {
        const k = JSON.parse(localStorage.getItem('teechat_keys_v1') || '[]');
        return Array.isArray(k) ? k : [];
      } catch (e) { return []; }
    }
    function saveKeys(arr) {
      try { localStorage.setItem('teechat_keys_v1', JSON.stringify(arr || [])); } catch (e) {}
    }
    // Bản state để lưu / đồng bộ / xuất file: KHÔNG chứa API key
    function getSyncableState() {
      const c = JSON.parse(JSON.stringify(window.state));
      delete c.apiKeys;
      return c;
    }
    // Giờ chuẩn: ưu tiên giờ server Firebase, không cho lùi về trước mốc đã thấy
    function nowTs() {
      let t = Date.now() + (window.serverOffset || 0);
      const last = (window.state && window.state.lastSeenTs) || 0;
      if (t < last) t = last;
      return t;
    }

    // Bộ nhớ trình duyệt chỉ ~5MB: ảnh gửi trong chat là thứ làm đầy nhanh nhất. Đầy thì bỏ ảnh cũ (giữ lại tin chữ) để lưu được tiếp
    function dropOldImages(keep) {
      const all = [];
      Object.values(window.state.chatHistories || {}).forEach(h => (h || []).forEach(m => { if (m && m.img) all.push(m); }));
      all.sort((x, y) => (y.ts || 0) - (x.ts || 0));
      all.slice(keep).forEach(m => { m.img = null; });
    }
    function saveStorage() {
      // Chưa nạp dữ liệu cũ (loadStorage chưa chạy) thì tuyệt đối không ghi đè, tránh xóa nhầm dữ liệu bằng bản trống
      if (!window.__stateLoaded) { console.warn('saveStorage bị chặn: dữ liệu chưa được nạp'); return; }
      window.state.lastUpdated = Date.now();
      const write = () => {
        const str = JSON.stringify(getSyncableState());
        // Bản dự phòng: nếu dữ liệu mới nhỏ đi bất thường (mất quá nửa) thì giữ lại bản cũ ở khóa riêng
        const prev = localStorage.getItem('teechat_state_v10');
        if (prev && prev.length > 3000 && str.length < prev.length * 0.5) { try { localStorage.setItem('teechat_state_v10_bak', prev); } catch (e2) {} }
        localStorage.setItem('teechat_state_v10', str);
      };
      try { write(); }
      catch (e) {
        try { dropOldImages(3); write(); }
        catch (e2) {
          try { dropOldImages(0); write(); }
          catch (e3) {
            console.warn('saveStorage lỗi:', e3);
            if (!window.__quotaWarned) { window.__quotaWarned = true; alert('⚠️ Không lưu được dữ liệu vào máy (bộ nhớ trình duyệt đầy). Hãy bấm Sao lưu rồi xóa bớt tin/ảnh cũ.'); }
            return;
          }
        }
      }
      try { if (typeof window.autoSyncToCloud === 'function') window.autoSyncToCloud(); } catch (e) {}
    }

    // ===================== CỬA HÀNG KIỂU SÀN THƯƠNG MẠI =====================
    const SHOP_CATS = [
      ['all', '🛍️', 'Tất cả'], ['flower', '🌹', 'Hoa'], ['tech', '💻', 'Công nghệ'], ['clothes', '👗', 'Thời trang'], ['shoes', '👟', 'Giày & Túi'],
      ['jewelry', '💍', 'Trang sức'], ['food', '🍔', 'Ăn uống'], ['decor', '🛋️', 'Nội thất'], ['vehicle', '🏍️', 'Xe cộ'], ['estate', '🏠', 'Nhà đất'],
      ['pet', '🐱', 'Thú cưng'], ['book', '📚', 'Sách & Bút'], ['beauty', '💄', 'Làm đẹp'], ['toy', '🧸', 'Đồ chơi'], ['travel', '✈️', 'Du lịch'], ['music', '🎸', 'Nhạc cụ']
    ];
    let shopCat = 'all', shopQ = '';
    const estateLoc = (id) => REAL_ESTATE_MAPS.find(m => m.id === id) || REAL_ESTATE_MAPS[0];
    const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => [String(a + i), 1]);
    const VG = {
      color: { label: '🎨 Màu sắc', opts: [['Đen', 1], ['Trắng', 1], ['Đỏ', 1], ['Xanh dương', 1], ['Hồng', 1], ['Be', 1]] },
      colorTech: { label: '🎨 Màu sắc', opts: [['Đen', 1], ['Bạc', 1], ['Trắng', 1], ['Xanh', 1]] },
      storage: { label: '💾 Dung lượng', opts: [['128GB', 1], ['256GB', 1.1], ['512GB', 1.25], ['1TB', 1.5]] },
      size: { label: '📏 Size áo/đầm', opts: [['S', 1], ['M', 1], ['L', 1], ['XL', 1]] },
      shoe: { label: '📏 Size giày', opts: range(36, 44) },
      ring: { label: '💍 Size nhẫn', opts: range(10, 16) },
      scent: { label: '🌸 Mùi hương', opts: [['Hoa hồng', 1], ['Vani', 1], ['Gỗ đàn', 1], ['Trà trắng', 1], ['Biển khơi', 1], ['Oải hương', 1]] },
      lip: { label: '💋 Màu son', opts: [['Đỏ cherry', 1], ['Hồng đào', 1], ['Cam đất', 1], ['Nude', 1], ['Đỏ rượu', 1]] },
      flower: { label: '🌈 Màu hoa', opts: [['Đỏ', 1], ['Hồng', 1], ['Trắng', 1], ['Vàng', 1], ['Tím', 1]] },
      wrap: { label: '🎀 Kiểu gói', opts: [['Giấy kraft', 1], ['Hộp quà', 1.15], ['Giỏ mây', 1.1]] },
      metal: { label: '✨ Chất liệu', opts: [['Bạc', 1], ['Vàng 18K', 1.2], ['Vàng trắng', 1.25], ['Bạch kim', 1.5]] },
      portion: { label: '🍽️ Khẩu phần', opts: [['Nhỏ', 1], ['Vừa', 1.4], ['Lớn', 1.8]] },
      carVer: { label: '⚙️ Phiên bản', opts: [['Tiêu chuẩn', 1], ['Cao cấp', 1.2], ['Đặc biệt', 1.45]] },
      gender: { label: '🐾 Giới tính', opts: [['Đực', 1], ['Cái', 1]] },
      fur: { label: '🎨 Màu lông', opts: [['Trắng', 1], ['Vàng', 1], ['Xám', 1], ['Đen', 1], ['Nâu', 1]] },
      cover: { label: '📖 Loại bìa', opts: [['Bìa mềm', 1], ['Bìa cứng', 1.3]] },
      people: { label: '👥 Số người', opts: [['1 người', 1], ['2 người', 2], ['4 người', 4]] },
      wood: { label: '🎨 Màu / chất liệu', opts: [['Gỗ sáng', 1], ['Gỗ nâu', 1], ['Đen nhám', 1], ['Trắng ngà', 1]] },
      furnish: { label: '🛋️ Nội thất', opts: [['Cơ bản', 1], ['Đầy đủ', 1.1], ['Cao cấp', 1.25]] },
      facing: { label: '🧭 Hướng nhà', opts: [['Đông Nam', 1], ['Nam', 1], ['Đông', 1], ['Tây Bắc', 1]] }
    };
    function variantKeys(it) {
      const n = it.name;
      switch (it.cat) {
        case 'flower': return ['flower', 'wrap'];
        case 'tech': return /Điện Thoại|Laptop/.test(n) ? ['colorTech', 'storage'] : ['colorTech'];
        case 'clothes': return /Mũ|Khăn/.test(n) ? ['color'] : ['size', 'color'];
        case 'shoes': return /Túi|Balo/.test(n) ? ['color'] : ['shoe', 'color'];
        case 'jewelry': return /Nhẫn/.test(n) ? ['metal', 'ring'] : ['metal'];
        case 'food': return ['portion'];
        case 'decor': return /Nến/.test(n) ? ['scent'] : ['wood'];
        case 'vehicle': return ['color', 'carVer'];
        case 'pet': return /Bể Cá|Hamster/.test(n) ? ['wood'] : ['gender', 'fur'];
        case 'book': return /Bút|Màu Vẽ/.test(n) ? ['color'] : ['cover'];
        case 'beauty': return /Son/.test(n) ? ['lip'] : (/Nail/.test(n) ? ['color'] : ['scent']);
        case 'toy': return ['color'];
        case 'travel': return ['people'];
        case 'music': return ['wood'];
        case 'estate': return ['furnish', 'facing'];
      }
      return [];
    }
    let selectedVars = {};
    function varMult(it) { return variantKeys(it).reduce((m, k) => m * VG[k].opts[selectedVars[k] || 0][1], 1); }
    function varText(it) { return variantKeys(it).map(k => `${VG[k].label.replace(/^\S+\s/, '')}: ${VG[k].opts[selectedVars[k] || 0][0]}`).join(', '); }
    function unitPrice(it, base) {
      const withVar = !base && selectedBuyItem && it.id === selectedBuyItem.id;
      let p = it.price * (withVar ? varMult(it) : 1);
      if (it.cat === 'estate') return Math.max(1000000, Math.round(p * estateLoc(selectedEstateMap).mult / 1000000) * 1000000);
      return Math.round(p / 1000) * 1000;
    }
    function pickVariant(k, i) { selectedVars[k] = i; renderVariantChips(); updateBuyQty(0); }
    function renderVariantChips() {
      const box = document.getElementById('buy-variants');
      if (!box || !selectedBuyItem) return;
      box.innerHTML = variantKeys(selectedBuyItem).map(k => `<div style="margin-bottom:8px;"><div style="font-size:0.82rem;color:#4a5568;margin-bottom:4px;">${VG[k].label}:</div><div style="display:flex;flex-wrap:wrap;gap:6px;">${VG[k].opts.map((o, i) => `<button onclick="pickVariant('${k}',${i})" style="padding:5px 10px;border-radius:14px;font-size:0.78rem;cursor:pointer;background:${(selectedVars[k] || 0) === i ? '#fff3ef' : '#fff'};border:2px solid ${(selectedVars[k] || 0) === i ? '#ee4d2d' : '#e2e8f0'};color:${(selectedVars[k] || 0) === i ? '#ee4d2d' : '#4a5568'};">${o[0]}${o[1] > 1 && k !== 'people' ? ' (+' + Math.round((o[1] - 1) * 100) + '%)' : ''}</button>`).join('')}</div></div>`).join('');
    }
    function moneyShort(n) {
      if (n >= 1e12) return (n / 1e12).toFixed(2).replace(/\.?0+$/, '').replace('.', ',') + ' nghìn tỷ';
      if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, '').replace('.', ',') + ' tỷ';
      if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '').replace('.', ',') + ' triệu';
      return n.toLocaleString('vi-VN') + 'đ';
    }
    const fold = (t) => (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    const itemHash = (id) => { let h = 7; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 99991; return h; };
    function shopSetCat(c) { shopCat = c; renderShopUI(); }
    function shopSearch(v) { shopQ = v; renderShopList(); }
    function shopSetLoc(v) { selectedEstateMap = v; renderShopList(); }

    function renderShopUI() {
      const box = document.getElementById('shop-items-container');
      if (!box) return;
      box.innerHTML = `
        <div style="background:linear-gradient(135deg,#ee4d2d,#ff7337);padding:8px;border-radius:12px;margin-bottom:8px;width:100%;box-sizing:border-box;">
          <div style="color:#fff;font-weight:bold;font-size:0.9rem;margin-bottom:6px;">🛍️ TEEMALL</div>
          <input id="shop-q" type="text" placeholder="🔍 Tìm sản phẩm..." value="${shopQ.replace(/"/g, '&quot;')}" oninput="shopSearch(this.value)" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:none;font-size:0.85rem;">
        </div>
        <div id="shop-income" style="width:100%;"></div>
        <div style="display:flex;overflow-x:auto;gap:6px;padding:2px 2px 8px;width:100%;">
          ${SHOP_CATS.map(c => `<button onclick="shopSetCat('${c[0]}')" style="flex:0 0 auto;min-width:62px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 6px;border-radius:12px;cursor:pointer;font-size:0.68rem;background:${shopCat === c[0] ? '#fff3ef' : '#fff'};border:2px solid ${shopCat === c[0] ? '#ee4d2d' : '#eee'};color:${shopCat === c[0] ? '#ee4d2d' : '#555'};"><span style="font-size:1.4rem;">${c[1]}</span>${c[2]}</button>`).join('')}
        </div>
        <div id="shop-loc-box" style="width:100%;"></div>
        <div id="shop-list" style="width:100%;"></div>`;
      renderShopIncome();
      renderShopList();
    }

    function renderShopList() {
      const list = document.getElementById('shop-list'), locBox = document.getElementById('shop-loc-box');
      if (!list) return;
      locBox.innerHTML = shopCat === 'estate' ? `
        <div style="background:#fff;border:1px solid #ffd9cc;border-radius:10px;padding:8px;margin-bottom:8px;">
          <div style="font-size:0.8rem;font-weight:bold;color:#ee4d2d;">📍 Khu vực mua nhà (giá mỗi nơi mỗi khác)</div>
          <select onchange="shopSetLoc(this.value)" style="width:100%;margin-top:4px;padding:8px;border-radius:8px;border:1px solid #cbd5e0;">
            ${REAL_ESTATE_MAPS.map(m => `<option value="${m.id}" ${m.id === selectedEstateMap ? 'selected' : ''}>${m.name}</option>`).join('')}
          </select>
          <div style="font-size:0.78rem;color:#666;margin-top:6px;line-height:1.4;">${estateLoc(selectedEstateMap).desc}</div>
        </div>` : '';
      const q = fold(shopQ.trim());
      const items = SHOP_CATALOG.filter(i => (shopCat === 'all' || i.cat === shopCat) && (!q || fold(i.name).includes(q) || fold(i.desc).includes(q)));
      if (!items.length) { list.innerHTML = '<div style="text-align:center;color:#888;font-size:0.85rem;padding:20px;">Không tìm thấy sản phẩm nào.</div>'; return; }
      list.innerHTML = `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;">${items.map(it => {
        const m = it.name.match(/^(\S+)\s+(.*)$/) || ['', '🎁', it.name];
        const h = itemHash(it.id), sold = 20 + (h % 4800), rating = (4.5 + (h % 6) / 10).toFixed(1);
        return `<div style="background:#fff;border-radius:10px;overflow:hidden;border:1px solid #f1e3dd;display:flex;flex-direction:column;min-width:0;">
          <div style="height:88px;display:flex;align-items:center;justify-content:center;font-size:3rem;background:linear-gradient(135deg,#fff3ef,#ffe4d9);position:relative;">${m[1]}${it.tag === 'luxury' ? '<span style="position:absolute;top:0;left:0;background:#ee4d2d;color:#fff;font-size:0.6rem;padding:2px 6px;border-radius:0 0 8px 0;">Yêu thích</span>' : ''}</div>
          <div style="padding:6px 8px;display:flex;flex-direction:column;gap:3px;flex:1;">
            <div style="font-size:0.78rem;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.5em;">${m[2]}</div>
            <div style="color:#ee4d2d;font-weight:bold;font-size:0.9rem;">${it.cat === 'estate' ? '' : ''}${moneyShort(unitPrice(it, true))}</div>
            <div style="font-size:0.66rem;color:#888;display:flex;justify-content:space-between;"><span>Đã bán ${sold >= 1000 ? (sold / 1000).toFixed(1).replace('.', ',') + 'k' : sold}</span><span>⭐${rating}</span></div>
            <button class="btn" style="background:#ee4d2d;color:#fff;border:none;padding:6px;font-size:0.78rem;margin-top:2px;" onclick="openBuyDetailModal('${it.id}')">🛒 Mua ngay</button>
          </div></div>`;
      }).join('')}</div>`;
    }

    // ----- Thu nhập: điểm danh + tiền thuê bất động sản -----
    const RENT_RATE = 0.005;
    const isEstateObj = (it) => { const c = SHOP_CATALOG.find(x => x.id === it.id); return !!c && c.cat === 'estate'; };
    const rentBaseOf = (it) => it.rentBase || ((SHOP_CATALOG.find(x => x.id === it.id) || {}).price || 0) * (it.qty || 1);
    function rentedList() { return (window.state.inventory || []).filter(it => isEstateObj(it) && it.rented); }
    function rentOf(it) {
      const days = Math.min(7, Math.max(0, (nowTs() - (it.rentLast || nowTs())) / 86400000));
      return Math.floor(rentBaseOf(it) * RENT_RATE * days / 1000) * 1000;
    }
    function rentPending() { return rentedList().reduce((sum, it) => sum + rentOf(it), 0); }
    function collectRent() {
      const list = rentedList(), p = rentPending();
      if (!list.length) return alert('Bạn chưa cho thuê căn nhà nào. Mở Túi đồ và bấm "Cho thuê" ở căn nhà muốn cho thuê nhé.');
      if (p <= 0) return alert('Chưa có tiền thuê để thu, quay lại sau nhé!');
      window.state.walletBalance = (window.state.walletBalance || 0) + p;
      list.forEach(it => { it.rentLast = nowTs(); });
      saveStorage(); renderLifeModeUI();
      alert(`🏦 Đã thu tiền thuê: +${p.toLocaleString('vi-VN')} VNĐ`);
    }
    function toggleRent(uid) {
      const it = (window.state.inventory || []).find(x => x.uniqueId === uid);
      if (!it) return;
      if (it.rented) {
        const p = rentOf(it);
        if (p > 0) window.state.walletBalance = (window.state.walletBalance || 0) + p;
        it.rented = false; it.rentLast = null;
        alert(p > 0 ? `Đã ngừng cho thuê, thu nốt +${p.toLocaleString('vi-VN')} VNĐ.` : 'Đã ngừng cho thuê căn nhà này.');
      } else {
        it.rented = true; it.rentLast = nowTs();
        alert(`🏷️ Đã đăng cho thuê! Mỗi ngày thu khoảng ${Math.floor(rentBaseOf(it) * RENT_RATE).toLocaleString('vi-VN')} VNĐ (dồn tối đa 7 ngày, bấm Thu tiền thuê để nhận).`);
      }
      saveStorage(); renderLifeModeUI();
    }
    function checkinInfo() {
      const today = new Date(nowTs()).toDateString(), yest = new Date(nowTs() - 86400000).toDateString();
      const done = window.state.checkinDate === today;
      const streak = done ? (window.state.checkinStreak || 1) : (window.state.checkinDate === yest ? (window.state.checkinStreak || 0) + 1 : 1);
      return { done, streak, reward: 10000000 * Math.min(7, streak), today };
    }
    function doCheckin() {
      const c = checkinInfo();
      if (c.done) return;
      window.state.checkinDate = c.today; window.state.checkinStreak = c.streak;
      window.state.walletBalance = (window.state.walletBalance || 0) + c.reward;
      // Mốc thưởng box: ngày 3 (box thường) và ngày 7 (box bạc), lặp lại mỗi chu kỳ 7 ngày
      const m = c.streak % 7, boxTxt = (m === 3 || m === 0) ? grantFreeBox(1, { force: true, tier: m === 0 ? 'silver' : 'normal' }) : '';
      saveStorage(); renderLifeModeUI();
      alert(`📅 Điểm danh ngày ${c.streak}: +${c.reward.toLocaleString('vi-VN')} VNĐ (ngày 7 là mức cao nhất, chuỗi bị đứt sẽ về ngày 1)${boxTxt ? '\n🎁 Tặng thêm: ' + boxTxt : ''}`);
    }
    function renderShopIncome() {
      const box = document.getElementById('shop-income');
      if (!box) return;
      const c = checkinInfo(), rented = rentedList().length, rent = rentPending();
      const owned = (window.state.inventory || []).some(isEstateObj);
      box.innerHTML = `<div style="display:flex;gap:6px;margin-bottom:8px;">
        <button class="btn btn-outline" style="flex:1;min-width:0;font-size:0.75rem;padding:8px 4px;" ${c.done ? 'disabled' : ''} onclick="doCheckin()">${c.done ? '✅ Đã điểm danh' : '📅 Điểm danh +' + moneyShort(c.reward)}</button>
        ${rented ? `<button class="btn btn-outline" style="flex:1;min-width:0;font-size:0.75rem;padding:8px 4px;" onclick="collectRent()">🏦 Thu tiền thuê: ${moneyShort(rent)}</button>` : ''}
      </div>${owned && !rented ? '<div style="font-size:0.72rem;color:#718096;margin:-4px 0 8px;">🏠 Bạn có nhà. Mở Túi đồ, bấm "Cho thuê" để nhận tiền thuê mỗi ngày.</div>' : ''}`;
    }

    function openBuyDetailModal(itemId) {
      selectedBuyItem = SHOP_CATALOG.find(i => i.id === itemId);
      if (!selectedBuyItem) return;
      selectedBuyQty = 1; selectedVars = {};
      document.getElementById('buy-modal-title').innerText = `🛒 Mua: ${selectedBuyItem.name}`;
      const body = document.getElementById('buy-modal-body');
      let locHtml = '';
      if (selectedBuyItem.cat === 'estate') {
        locHtml = `
          <div class="form-group" style="margin-bottom: 10px;">
            <label style="color:var(--app-dark-green);">📍 Chọn địa điểm:</label>
            <select id="estate-map-select" onchange="onEstateLocChange(this.value)" style="width:100%; padding:8px; border-radius:8px; border:1px solid #cbd5e0; margin-top:4px;">
              ${REAL_ESTATE_MAPS.map(m => `<option value="${m.id}" ${m.id === selectedEstateMap ? 'selected' : ''}>${m.name}</option>`).join('')}
            </select>
            <div id="estate-loc-desc" style="font-size:0.78rem;color:#666;margin-top:6px;line-height:1.4;">${estateLoc(selectedEstateMap).desc}</div>
          </div>`;
      }
      body.innerHTML = `
        ${locHtml}
        <div style="font-size:0.85rem; color:#666; margin-bottom:8px;">${selectedBuyItem.desc}</div>
        <div id="buy-variants"></div>
        ${selectedBuyItem.cat === 'estate' ? '<label style="display:flex;align-items:center;gap:6px;font-size:0.85rem;color:#4a5568;margin-bottom:10px;"><input type="checkbox" id="buy-rent-now" checked> 🏷️ Cho thuê ngay sau khi mua (nhận tiền thuê mỗi ngày)</label>' : ''}
        <div class="form-group" style="margin-bottom: 10px;">
          <label style="font-size:0.85rem; color:#4a5568;">🔢 Chọn Số Lượng:</label>
          <div style="display:flex; align-items:center; gap:10px; margin-top:4px;">
            <button class="btn btn-outline" style="width:36px; height:36px; font-size:1.1rem;" onclick="updateBuyQty(-1)">-</button>
            <span id="buy-qty-display" style="font-size:1.1rem; font-weight:bold; min-width:30px; text-align:center;">1</span>
            <button class="btn btn-outline" style="width:36px; height:36px; font-size:1.1rem;" onclick="updateBuyQty(1)">+</button>
          </div>
        </div>
        <div style="margin-top:12px; font-size:0.9rem; color:#4a5568;">
          Đơn giá: <span id="buy-unit-price" style="font-weight:bold;"></span><br>
          Tổng tiền: <span id="buy-total-price" style="color:#e53e3e; font-weight:bold; font-size:1.1rem;"></span>
        </div>`;
      renderVariantChips();
      updateBuyQty(0);
      openModal('modal-buy-detail');
    }

    function onEstateLocChange(v) {
      selectedEstateMap = v;
      const d = document.getElementById('estate-loc-desc');
      if (d) d.innerText = estateLoc(v).desc;
      updateBuyQty(0);
    }

    function updateBuyQty(delta) {
      selectedBuyQty = Math.max(1, Math.min(99, selectedBuyQty + delta));
      document.getElementById('buy-qty-display').innerText = selectedBuyQty;
      const unit = unitPrice(selectedBuyItem);
      document.getElementById('buy-unit-price').innerText = unit.toLocaleString('vi-VN') + ' VNĐ';
      document.getElementById('buy-total-price').innerText = (unit * selectedBuyQty).toLocaleString('vi-VN') + ' VNĐ';
    }

    function confirmBuyItem() {
      if (!selectedBuyItem) return;
      const unit = unitPrice(selectedBuyItem);
      const totalCost = unit * selectedBuyQty;

      if ((window.state.walletBalance || 0) < totalCost) {
        closeModal('modal-buy-detail');
        return alert('Số dư ví của bạn không đủ!');
      }

      window.state.walletBalance -= totalCost;
      if (!window.state.inventory) window.state.inventory = [];

      let mapInfo = '';
      if (selectedBuyItem.cat === 'estate') mapInfo = ` | Vị trí: ${estateLoc(selectedEstateMap).name}`;
      const vt = varText(selectedBuyItem);
      if (vt) mapInfo += ` | ${vt}`;
      const rentNow = selectedBuyItem.cat === 'estate' && !!(document.getElementById('buy-rent-now') || {}).checked;

      window.state.inventory.push({
        id: selectedBuyItem.id,
        name: `${selectedBuyItem.name} (x${selectedBuyQty})${mapInfo}`,
        singleName: selectedBuyItem.name + (vt ? ` (${vt})` : ''),
        qty: selectedBuyQty,
        tag: selectedBuyItem.tag,
        desc: selectedBuyItem.desc + mapInfo,
        rentBase: selectedBuyItem.cat === 'estate' ? totalCost : undefined,
        rented: rentNow || undefined,
        rentLast: rentNow ? nowTs() : undefined,
        uniqueId: 'inv-' + Date.now() + Math.random()
      });

      saveStorage();
      closeModal('modal-buy-detail');
      renderLifeModeUI();
      const it = selectedBuyItem;
      const big = totalCost >= 500000000;
      const lux = big && (it.cat === 'estate' || it.cat === 'vehicle');
      if (big) showBigPurchase(it, selectedBuyQty, lux, totalCost);
      else alert(`🎉 Đã mua thành công ${selectedBuyQty}x "${it.name}"!`);
    }

    function showBigPurchase(it, qty, congrats, total) {
      if (!document.getElementById('bigbuy-style')) {
        const st = document.createElement('style'); st.id = 'bigbuy-style';
        st.textContent = '@keyframes bbPop{0%{transform:scale(.2) rotate(-12deg);opacity:0}60%{transform:scale(1.25) rotate(4deg);opacity:1}100%{transform:scale(1) rotate(0)}}@keyframes bbGlow{0%,100%{filter:drop-shadow(0 0 12px #ffd54f)}50%{filter:drop-shadow(0 0 34px #ff80ab)}}@keyframes bbFall{to{transform:translateY(110vh) rotate(540deg)}}';
        document.head.appendChild(st);
      }
      const em = (it.name.split(' ')[0]) || '🎁';
      const ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(20,10,40,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff;padding:20px;overflow:hidden;';
      let conf = '';
      for (let k = 0; k < 36; k++) conf += `<span style="position:absolute;top:-30px;left:${Math.random() * 100}%;font-size:${16 + Math.random() * 16}px;animation:bbFall ${2.5 + Math.random() * 2.5}s linear ${Math.random() * 2}s infinite;">${['🎉', '✨', '💖', '🎊', '⭐'][k % 5]}</span>`;
      ov.innerHTML = `${conf}<div style="font-size:7.5rem;line-height:1.1;animation:bbPop .7s ease-out both,bbGlow 1.6s ease-in-out .7s infinite;">${em}</div>
        <div style="font-size:1.3rem;font-weight:bold;margin-top:14px;">${congrats ? '🎊 Chúc mừng bạn đã tậu' : '🎁 Bạn vừa mua'}</div>
        <div style="font-size:1.1rem;margin-top:6px;">${qty > 1 ? qty + 'x ' : ''}${escapeHtml(it.name)}</div>
        <div style="font-size:.85rem;opacity:.8;margin-top:6px;">-${(total || it.price * qty).toLocaleString('vi-VN')} VNĐ</div>
        <div style="font-size:.8rem;opacity:.6;margin-top:22px;">Chạm để đóng</div>`;
      ov.onclick = () => ov.remove();
      document.body.appendChild(ov);
    }

    let pendingGiftUniqueId = null;
    // Quà dùng chung (bữa ăn/tiệc/hộp chia được): tặng 1 cái cho cả nhóm. Món khác: mỗi người một cái.
    const SHARED_GIFT_IDS = ['item-603','item-604','item-605','item-606','item-607','item-608','item-609','item-610','item-612','item-613','item-614','item-615'];

    function openSelectCharGiftModal(uniqueId) {
      pendingGiftUniqueId = uniqueId;
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      if (!story || !story.characters || story.characters.length === 0) {
        return alert('Chưa có nhân vật nào trong cốt truyện hiện tại để tặng!');
      }

      renderGiftTargets();

      openModal('modal-select-char-gift');
    }

    function renderGiftTargets() {
      const box = document.getElementById('gift-target-char-select');
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      if (!box || !story || !story.characters) return;
      box.innerHTML = `
        <label style="display:flex;align-items:center;gap:8px;font-weight:bold;color:#d53f8c;padding:6px 4px;border-bottom:1px dashed #e2e8f0;">
          <input type="checkbox" id="gift-all-chk" onchange="toggleGiftAll(this.checked)"> Tất cả
        </label>` + story.characters.map(c => `
        <label style="display:flex;align-items:center;gap:8px;padding:6px 4px;">
          <input type="checkbox" class="gift-chk" value="${c.id}" onchange="syncGiftAll()"> ${escapeHtml(c.name)}
        </label>`).join('');
    }

    function toggleGiftAll(v) {
      document.querySelectorAll('#gift-target-char-select .gift-chk').forEach(c => c.checked = v);
    }

    function syncGiftAll() {
      const all = document.querySelectorAll('#gift-target-char-select .gift-chk');
      const chk = document.querySelectorAll('#gift-target-char-select .gift-chk:checked');
      const a = document.getElementById('gift-all-chk');
      if (a) a.checked = all.length > 0 && all.length === chk.length;
    }

    function executeSendGift() {
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      const targets = [];
      document.querySelectorAll('#gift-target-char-select .gift-chk:checked').forEach(c => {
        const ch = story && story.characters ? story.characters.find(x => x.id === c.value) : null;
        if (ch) targets.push({ id: ch.id, name: ch.name });
      });
      confirmSendGiftToChar(targets);
    }

    function affectionNeeded(level) {
      return Math.floor(15 * Math.pow(level, 1.4));
    }

    function addAffectionPoints(charId, points) {
      if (!window.state.affectionLevels) window.state.affectionLevels = {};
      if (!window.state.affectionLevels[charId]) {
        window.state.affectionLevels[charId] = { level: 1, points: 0 };
      }
      
      let affData = window.state.affectionLevels[charId];
      affData.points += points;

      // Công thức tính điểm level thân mật dãn rộng dạng số mũ nhẹ nhàng
      while (true) {
        let pointsNeeded = affectionNeeded(affData.level);
        if (affData.points >= pointsNeeded) {
          affData.points -= pointsNeeded;
          affData.level += 1;
        } else {
          break;
        }
      }
      // Trừ điểm: tụt cấp nếu âm
      while (affData.points < 0) {
        if (affData.level <= 1) { affData.points = 0; break; }
        affData.level -= 1;
        affData.points += affectionNeeded(affData.level);
      }
      saveStorage();
    }

    // Phản ứng của nhân vật với đồ thủ công (thích -> cộng, không thích -> trừ)
    function craftGiftReaction(charId, item) {
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      const char = story && story.characters ? story.characters.find(c => c.id === charId) : null;
      const pers = ((char && char.personality) || '').toLowerCase();
      const lvl = item.level || 1;
      const has = (arr) => arr.some(k => pers.includes(k));

      const cold = has(['lạnh lùng', 'lạnh', 'kiêu', 'thực dụng', 'khó tính', 'xa cách', 'cộc', 'tàn nhẫn', 'băng giá']);
      const warm = has(['dịu dàng', 'hiền', 'ngọt', 'lãng mạn', 'dễ thương', 'ấm áp', 'tình cảm', 'trẻ con', 'hòa đồng', 'mơ mộng', 'nhạy cảm']);
      const fitMap = {
        cake: ['ăn', 'ngọt', 'nấu', 'bếp', 'tham ăn', 'đầu bếp'],
        flower: ['lãng mạn', 'dịu dàng', 'nghệ sĩ', 'mơ mộng', 'tình cảm'],
        necklace: ['sang', 'quý phái', 'thời trang', 'kiêu', 'tiểu thư', 'cô gái', 'nữ'],
        lego: ['trẻ con', 'nghịch', 'game', 'kỹ sư', 'sưu tầm', 'tinh nghịch'],
        teddy: ['dễ thương', 'trẻ con', 'ngây thơ', 'hiền', 'ấm áp']
      };
      const fit = has(fitMap[item.craftType] || []);

      const aff = (window.state.affectionLevels && window.state.affectionLevels[charId]) || { level: 1 };
      let prob = 0.5 + 0.06 * lvl + Math.min(0.1, aff.level * 0.01);
      if (cold) prob -= 0.2;
      if (warm) prob += 0.15;
      if (fit) prob += 0.15;
      prob = Math.max(0.1, Math.min(0.95, prob));

      const liked = Math.random() < prob;
      let pts, reason;
      if (liked) {
        pts = Math.max(1, Math.min(10, Math.round(lvl * 1.5) + 1));
        reason = fit ? 'đúng gu của nhân vật' : 'tấm lòng tự tay làm khiến nhân vật cảm động';
      } else {
        pts = -Math.max(1, Math.min(5, 1 + (cold ? 2 : 0) + Math.floor(Math.random() * 2)));
        reason = cold ? 'nhân vật khó tính, không thích đồ tự làm' : 'món quà không hợp gu nhân vật';
      }
      return { liked, pts, reason };
    }

    function confirmSendGiftToChar(targets) {
      if (!targets || targets.length === 0) return alert('Hãy chọn ít nhất một nhân vật!');
      const inv = window.state.inventory || [];
      const itemIdx = inv.findIndex(i => i.uniqueId === pendingGiftUniqueId);
      if (itemIdx === -1) return;

      const giftedItem = inv[itemIdx];
      const shared = SHARED_GIFT_IDS.includes(giftedItem.id);
      const need = shared ? 1 : targets.length;
      const have = giftedItem.qty || 1;
      if (giftedItem.tag === 'propose' && targets.length > 1) return alert('Quà cầu hôn chỉ tặng được cho 1 người!');
      if (have < need) return alert(`Cần ${need} cái để tặng ${targets.length} người (mỗi người một cái), nhưng bạn chỉ có ${have}.`);

      const baseSingleName = giftedItem.singleName || giftedItem.name.replace(/\s*\(x\d+\).*/, '');

      if (have > need) {
        giftedItem.qty = have - need;
        giftedItem.name = `${baseSingleName} (x${giftedItem.qty})`;
      } else {
        inv.splice(itemIdx, 1);
      }

      const userName = (window.state && window.state.persona && window.state.persona.name) ? window.state.persona.name : 'Bạn';
      const results = [];
      const hints = [];

      targets.forEach(t => {
        let bonusPts = Math.floor(Math.random() * 5) + 1; // 1-5 điểm cho quà thường
        if (giftedItem.tag === 'romantic') bonusPts = Math.floor(Math.random() * 5) + 3; // 3-7 điểm
        if (giftedItem.tag === 'luxury') bonusPts = Math.floor(Math.random() * 6) + 5; // 5-10 điểm
        if (giftedItem.tag === 'propose') bonusPts = 15;

        let craftReact = null;
        if (giftedItem.kind === 'craft') {
          craftReact = craftGiftReaction(t.id, giftedItem);
          bonusPts = craftReact.pts;
          hints.push(`${t.name} ${craftReact.liked ? 'THÍCH' : 'KHÔNG THÍCH'} món quà thủ công này (${craftReact.reason}).`);
        }

        addAffectionPoints(t.id, bonusPts);
        results.push({ name: t.name, aff: window.state.affectionLevels[t.id] });
      });

      mtrack('gifts', 1);
      saveStorage();
      closeModal('modal-select-char-gift');
      switchStoryTab('chat');

      const names = targets.map(t => t.name).join(', ');
      const lv = results.map(r => `${r.name} Lv.${r.aff.level} (${r.aff.points}pts)`).join('; ');
      const r0 = results[0].aff;
      let giftActionText = '';
      if (giftedItem.tag === 'propose') {
        giftActionText = `[${userName} trao tặng "${baseSingleName}" cho ${names}. {{Thân mật: Lv.${r0.level}, ${r0.points}pts}}]`;
      } else if (targets.length === 1) {
        giftActionText = `[${userName} tặng ${names} 1x ${baseSingleName}. {{Thân mật: Lv.${r0.level}, ${r0.points}pts}}]`;
      } else if (shared) {
        giftActionText = `[${userName} mời cả nhóm (${names}) cùng thưởng thức "${baseSingleName}". {{${lv}}}]`;
      } else {
        giftActionText = `[${userName} tặng mỗi người (${names}) 1x ${baseSingleName}. {{${lv}}}]`;
      }

      if (hints.length) {
        window.__nextHint = hints.join(' ') + ' Hãy để từng nhân vật phản ứng đúng như vậy theo tính cách, không nhắc đến điểm số.';
      }

      sendMessage(giftActionText);
    }

    function checkDailyReset() {
      const t = nowTs();
      window.state.lastSeenTs = t;
      const today = new Date(t).toDateString();
      if (window.state.lastWorkDate !== today) {
        window.state.lastWorkDate = today;
        window.state.dailyWorkCount = 0;
        window.state.dailyCraftCount = 0;
        saveStorage();
      }
    }

    function loadStorage() {
      const saved = localStorage.getItem('teechat_state_v10');
      if (saved) { try { window.state = JSON.parse(saved); } catch(e) {} }
      window.__stateLoaded = true;

      // API key lưu riêng, không đồng bộ. Chuyển key cũ (nếu có) sang kho riêng.
      let keys = loadKeys();
      if (keys.length === 0 && Array.isArray(window.state.apiKeys) && window.state.apiKeys.length) {
        keys = window.state.apiKeys.slice();
        saveKeys(keys);
      }
      window.state.apiKeys = keys;

      if (!window.state.stories) window.state.stories = [];
      if (!window.state.chatHistories) window.state.chatHistories = {};
      if (typeof window.state.walletBalance !== 'number') window.state.walletBalance = 10000000;
      if (!window.state.inventory) window.state.inventory = [];
      if (!window.state.affectionLevels) window.state.affectionLevels = {};
      if (!window.state.currentJob || !JOBS[window.state.currentJob]) window.state.currentJob = 'barista';
      if (typeof window.state.jobChangeTimestamp !== 'number') window.state.jobChangeTimestamp = 0;
      if (typeof window.state.jobPicked !== 'boolean') window.state.jobPicked = false;
      if (typeof window.state.dailyWorkCount !== 'number') window.state.dailyWorkCount = 0;
      if (typeof window.state.dailyCraftCount !== 'number') window.state.dailyCraftCount = 0;
      if (typeof window.state.lastSeenTs !== 'number') window.state.lastSeenTs = 0;
      if (!window.state.currentModel) window.state.currentModel = 'gemini-2.5-flash';
      if (!window.state.boxes) window.state.boxes = {};
      if (!window.state.stats) window.state.stats = {};
      if (!window.state.milestoneClaimed) window.state.milestoneClaimed = {};
      if (!window.state.unlockedModes) window.state.unlockedModes = {};
      if (!window.state.activeMode) window.state.activeMode = {};
      migrateOldCraft();

      if (window.state.stories.length === 0) {
        window.state.stories.push({
          id: 'story-1',
          title: 'Tên truyện',
          avatar: DEFAULT_LOGO,
          setting: 'Cốt truyện',
          openingScene: 'Bối cảnh',
          characters: [
            { id: 'char-1', name: 'Tên nhân vật', avatar: DEFAULT_LOGO, personality: 'Thân thế, tính cách, xưng hô mối quan hệ', firstMsg: 'Trần Hạo Nam: "Cô có vẻ... biết chọn món."' }
          ]
        });
        saveStorage();
      }

      document.getElementById('cfg-api-keys').value = (window.state.apiKeys || []).join('\n');
      document.getElementById('cfg-model-select').value = window.state.currentModel;
      if (window.state.persona) {
        document.getElementById('per-name').value = window.state.persona.name || '';
        document.getElementById('per-avatar').value = window.state.persona.avatar || '';
        document.getElementById('per-memories').value = window.state.persona.memories || '';
      }

      applyActiveStoryTheme();
    }

    function escapeHtml(str) {
      return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    function switchPage(pageId) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById(pageId).classList.add('active');
    }

    function openModal(id) { document.getElementById(id).classList.add('active'); }
    function closeModal(id) { document.getElementById(id).classList.remove('active'); }

    function switchStoryTab(tabName) {
      const chatView = document.getElementById('subview-chat');
      const lifeView = document.getElementById('subview-life');
      const chatBtn = document.getElementById('tab-btn-chat');
      const lifeBtn = document.getElementById('tab-btn-life');

      if (tabName === 'chat') {
        chatView.classList.remove('hidden'); lifeView.classList.add('hidden');
        chatBtn.classList.add('active'); lifeBtn.classList.remove('active');
        setTimeout(() => {
          const container = document.getElementById('chat-history');
          if (container) container.scrollTop = container.scrollHeight;
        }, 60);
      } else {
        chatView.classList.add('hidden'); lifeView.classList.remove('hidden');
        chatBtn.classList.remove('active'); lifeBtn.classList.add('active');
        renderLifeModeUI();
        maybeTriggerRandomEvent();
      }
    }

    function switchLifeSub(name) {
      ['work', 'shop', 'craft', 'mission'].forEach(n => {
        document.getElementById('life-sub-' + n).classList.toggle('hidden', n !== name);
        document.getElementById('life-sub-btn-' + n).classList.toggle('active', n === name);
      });
      window.lifeSub = name;
      if (name === 'craft') { updateCraftPreview(); renderCraftBag(); }
      if (name === 'mission') renderMissionTab();
    }

    function switchConfigTab(tabName) {
      document.getElementById('cfg-tab-view-story').classList.add('hidden');
      document.getElementById('cfg-tab-view-theme').classList.add('hidden');
      document.getElementById('cfg-tab-view-chars').classList.add('hidden');

      document.getElementById('cfg-tab-btn-story').classList.remove('active');
      document.getElementById('cfg-tab-btn-theme').classList.remove('active');
      document.getElementById('cfg-tab-btn-chars').classList.remove('active');

      if (tabName === 'story') {
        document.getElementById('cfg-tab-view-story').classList.remove('hidden');
        document.getElementById('cfg-tab-btn-story').classList.add('active');
      } else if (tabName === 'theme') {
        document.getElementById('cfg-tab-view-theme').classList.remove('hidden');
        document.getElementById('cfg-tab-btn-theme').classList.add('active');
      } else if (tabName === 'chars') {
        document.getElementById('cfg-tab-view-chars').classList.remove('hidden');
        document.getElementById('cfg-tab-btn-chars').classList.add('active');
        renderCharacterList();
      }
    }
