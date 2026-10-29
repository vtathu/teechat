// ===================== NGHỀ NGHIỆP =====================
    // Nghề càng khó thắng thì lương càng cao
    const JOBS = {
      cleaner: { unit: 27000, desc: 'Lau sạch vết bẩn. Sai hoặc hết giờ mất 1 mạng, hết 3 mạng thì dừng. Mỗi màn qua được nhận tiền, càng xa càng nhiều.' },
      cashier: { unit: 36000, desc: 'Thối tiền cho khách. Sai hoặc hết giờ mất 1 mạng, hết 3 mạng thì dừng. Mỗi màn qua được nhận tiền, càng xa càng nhiều.' },
      barista: { unit: 48000, desc: 'Pha đúng công thức khách gọi. Sai hoặc hết giờ mất 1 mạng, hết 3 mạng thì dừng. Mỗi màn qua được nhận tiền, càng xa càng nhiều.' },
      teacher: { unit: 60000, desc: 'Chấm bài. Phải chấm chuẩn 100% mới qua màn, sai hoặc hết giờ mất 1 mạng, hết 3 mạng thì dừng. Mỗi màn qua được nhận tiền, càng xa càng nhiều.' },
      driver:  { unit: 84000, desc: 'Né chướng ngại vật, đâm 5 lần thì hết màn. 3 màn là 1 ca làm. Tiền tính theo thời gian sống sót mỗi màn.' },
      sudoku:  { unit: 100000000, desc: 'Giải mã sudoku bấm Nộp bài để hoàn thành màn. Mỗi màn thắng nhận 100.000.000 VNĐ, thắng thì sang màn mới, nộp sai thì hết ca.' }
    };

    function canChangeJob() {
      if (!window.state.jobPicked) return { ok: true, left: 0 };
      return { ok: true, left: 0 };
    }

    function renderLifeModeUI() {
      checkDailyReset();
      document.getElementById('life-wallet-display').innerText = (window.state.walletBalance || 0).toLocaleString('vi-VN') + ' VNĐ';
      
      const jobSel = document.getElementById('job-select');
      if (jobSel) jobSel.value = window.state.currentJob || 'barista';
      updateJobDesc();

      const cj = canChangeJob();
      const limitInfo = document.getElementById('job-limit-info');
      if (limitInfo) {
        let jobTxt;
        if (!window.state.jobPicked) jobTxt = 'Lần đầu được chọn nghề tự do!';
        else if (cj.ok) jobTxt = 'Đã có thể đổi nghề tự do!';
        else jobTxt = `Cần đợi thêm ${cj.left} phút nữa mới được đổi nghề.`;
        limitInfo.innerText = `Lượt làm việc: ${window.state.dailyWorkCount}/8 | Lượt thủ công: ${window.state.dailyCraftCount || 0}/${(typeof CRAFT_CFG !== 'undefined' && CRAFT_CFG.dailyRuns) || 3} | ${jobTxt}`;
      }

      renderShopUI();

      renderInventoryUI();
      renderCraftBag();
      updateCraftPreview();
      renderMissionTab();
      try { if (window.Biz && typeof Biz.paintPending === 'function') Biz.paintPending(); } catch (e) {}
    }

    function changeJobSelection() {
      const cj = canChangeJob();
      if (!cj.ok) {
        alert(`Bạn chưa đủ 3 tiếng để đổi nghề! Còn ${cj.left} phút nữa.`);
        document.getElementById('job-select').value = window.state.currentJob;
        return;
      }

      window.state.currentJob = document.getElementById('job-select').value;
      window.state.jobChangeTimestamp = nowTs();
      window.state.jobPicked = true;
      saveStorage();
      updateJobDesc();
      renderLifeModeUI();
      alert('Đã đổi nghề thành công!');
    }

    function updateJobDesc() {
      const box = document.getElementById('job-desc-box');
      const j = JOBS[window.state.currentJob];
      if (box && j) box.innerText = j.desc;
    }

    function renderInventoryUI() {
      const container = document.getElementById('inventory-list-container');
      container.innerHTML = '';
      const inv = window.state.inventory || [];
      if (inv.length === 0) { container.innerHTML = '<div style="font-size:0.8rem; color:#888; width:100%; text-align:center;">Túi đồ trống.</div>'; return; }
      inv.forEach(obj => {
        const badge = document.createElement('div');
        badge.style.background = '#fff'; badge.style.border = '1px solid #90d4b8'; badge.style.padding = '4px 8px'; badge.style.borderRadius = '8px'; badge.style.fontSize = '0.78rem';
        if (obj.kind === 'craft') {
          badge.innerHTML = `<span>${obj.name}</span> ${craftBagButtons(obj)}`;
        } else {
          badge.innerHTML = `<span>${obj.name}</span>`;
          if (isEstateObj(obj)) {
            const day = Math.floor(rentBaseOf(obj) * RENT_RATE);
            badge.innerHTML += obj.rented
              ? ` <button class="btn btn-outline" style="padding:2px 8px;font-size:0.72rem;" onclick="toggleRent('${obj.uniqueId}')">✅ Đang cho thuê (+${moneyShort(day)}/ngày) · Ngừng</button>`
              : ` <button class="btn btn-outline" style="padding:2px 8px;font-size:0.72rem;" onclick="toggleRent('${obj.uniqueId}')">🏷️ Cho thuê (+${moneyShort(day)}/ngày)</button>`;
          }
          if (typeof window.petInvButtons === 'function') badge.innerHTML += window.petInvButtons(obj);
        }
        container.appendChild(badge);
      });
    }

    // ===================== MINI-GAME CÔNG VIỆC (THAO TÁC TAY) =====================
    let jobGameState = { job: '', raf: null, timers: [], listeners: [] };

    const jgShuffle = (arr) => arr.sort(() => Math.random() - 0.5);
    const jgRand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    function jgArea() { return document.getElementById('jgame-area'); }
    function jgSetQ(t) { document.getElementById('jgame-question-box').innerText = t; }
    function jgSetStats(t) { document.getElementById('jgame-stats').innerText = t; }
    function jgAddTimer(id) { jobGameState.timers.push(id); return id; }

    function jgClear() {
      if (jobGameState.raf) { cancelAnimationFrame(jobGameState.raf); jobGameState.raf = null; }
      jobGameState.timers.forEach(t => { clearInterval(t); clearTimeout(t); });
      jobGameState.timers = [];
      jobGameState.listeners.forEach(fn => { try { fn(); } catch (e) {} });
      jobGameState.listeners = [];
      const a = jgArea();
      if (a) a.innerHTML = '';
      const ob = document.getElementById('jgame-options-box');
      if (ob) ob.innerHTML = '';
    }

    function abortJobGame() {
      jgClear();
      closeModal('modal-job-game');
    }

    function endJobGame(earned, title, msg) {
      jgClear();
      closeModal('modal-job-game');
      earned = Math.max(0, Math.floor(earned));
      if (earned > 0) {
        window.state.walletBalance = (window.state.walletBalance || 0) + earned;
        saveStorage();
        renderLifeModeUI();
        try { if (window.Sound) window.Sound.play('coin'); } catch (e) {}
      }
      alert(`${title}\n${msg}\nTiền kiếm được: ${earned.toLocaleString('vi-VN')} VNĐ${earned > 0 ? ' (đã cộng vào ví)' : ''}`);
    }

    function executeWorkMinigame() {
      const job = window.state.currentJob;
      if (job === 'sudoku') {
        openSudoku9Minigame();
        return;
      }
      checkDailyReset();
      if (window.state.dailyWorkCount >= 8) {
        return alert('Bạn đã hết 8 lượt làm việc trong ngày hôm nay! Hãy quay lại vào ngày mai.');
      }

      // TRỪ LƯỢT NGAY KHI BẤM MỞ NHIỆM VỤ CÔNG VIỆC
      window.state.dailyWorkCount++;
      saveStorage();
      renderLifeModeUI();

      jgClear();
      jobGameState.job = job;
      document.getElementById('jgame-title').innerText = '📋 Ca làm việc';
      jgSetStats('Bắt đầu ca làm...');
      openModal('modal-job-game');

      const plays = { barista: playBarista, cleaner: playCleaner, cashier: playCashier, driver: playDriver, teacher: playTeacher };
      if (job === 'driver') runDriverShift(JOBS.driver.unit);
      else if (plays[job]) runJobLevels(plays[job], JOBS[job].unit);
    }

    // ---------- KHUNG CA LÀM: không giới hạn màn, sai đủ 3 lần thì dừng ----------
    const JOB_LIVES = 3;
    // Độ khó tăng đến màn 20 rồi giữ nguyên; tiền mỗi màn tăng đến màn 20 rồi đi ngang
    function jgDifficulty(lv) { return Math.min(15, Math.round(lv <= 10 ? lv : 10 + (lv - 10) * 0.5)); }
    function jgPayForLevel(base, lv) { return Math.round(base * (1 + 0.15 * (Math.min(lv, 20) - 1)) / 100) * 100; }

    function runJobLevels(playFn, base) {
      const F = { lv: 0, lives: JOB_LIVES, earned: 0, passed: 0, busy: false };
      const stats = () => jgSetStats(`Màn ${F.lv} | ❤️ ${F.lives} | Đã kiếm: ${F.earned.toLocaleString('vi-VN')}đ`);
      const ctx = { hit() { F.lives--; stats(); return F.lives; } };

      function endAll() {
        mtrack('workBest', F.passed, 'max');
        saveStorage();
        endJobGame(F.earned, '🛑 Hết mạng!', `Bạn qua được ${F.passed} màn.`);
      }
      function next() {
        F.lv++; F.busy = false; stats();
        playFn(jgDifficulty(F.lv), ctx, finish);
      }
      function finish(ok, msg, alreadyLost) {
        if (F.busy) return;
        F.busy = true;
        jgClear();
        if (ok) {
          const pay = jgPayForLevel(base, F.lv);
          F.earned += pay; F.passed++;
          mtrack('workLevels', 1);
          jgSetQ(`✅ ${msg || 'Qua màn!'} +${pay.toLocaleString('vi-VN')}đ`);
        } else {
          if (!alreadyLost) F.lives--;
          jgSetQ(`❌ ${msg || 'Hỏng màn!'}`);
        }
        stats();
        jgAddTimer(setTimeout(F.lives <= 0 ? endAll : next, 1100));
      }
      next();
    }

    // ---------- CA TÀI XẾ: 3 màn, mỗi màn chạy vô hạn đến khi đâm 5 lần ----------
    function runDriverShift(base) {
      const STAGES = 3, LIVES = 5;
      const F = { stage: 0, lives: LIVES, earned: 0, passed: 0 };
      const stats = () => jgSetStats(`Màn ${F.stage}/${STAGES} | ❤️ ${F.lives} | Đã kiếm: ${F.earned.toLocaleString('vi-VN')}đ`);
      const ctx = {
        endless: true,
        hit() { F.lives--; stats(); return F.lives; },
        over(sec) {
          jgClear();
          const pay = Math.round(base * Math.min(sec, 120) / 12 / 100) * 100;
          F.earned += pay; F.passed++;
          mtrack('workLevels', 1);
          jgSetQ(`💥 Hết màn ${F.stage}! Sống sót ${sec}s, +${pay.toLocaleString('vi-VN')}đ`);
          stats();
          if (F.stage >= STAGES) {
            mtrack('workBest', F.passed, 'max'); saveStorage();
            jgAddTimer(setTimeout(() => endJobGame(F.earned, '🏁 Hết ca làm!', `Bạn hoàn thành ${F.passed}/${STAGES} màn.`), 1400));
          } else jgAddTimer(setTimeout(next, 1400));
        }
      };
      function next() { F.stage++; F.lives = LIVES; stats(); playDriver(2 + F.stage * 2, ctx, () => {}); }
      next();
    }

    // ---------- 1. VỆ SINH: chùi vết bẩn ----------
    function playCleaner(lv, ctx, finish) {
      const total = Math.min(18, 4 + lv);
      const TIME = Math.max(11, Math.round(24 - lv * 1.3));
      const sMin = Math.max(30, 66 - lv * 3), sMax = Math.max(40, 78 - lv * 3);
      const hpBase = 60 + lv * 8;
      jgSetQ(`🧹 Lau sạch ${total} vết bẩn! Kéo ngón tay (hoặc chuột) lên vết bẩn.`);
      jgArea().innerHTML = `<div id="cl-time" style="font-size:0.85rem;margin-bottom:4px;">⏱ ${TIME}s</div><div id="cl-board" style="position:relative;width:100%;max-width:320px;aspect-ratio:1/1;margin:0 auto;background:linear-gradient(135deg,#e6f2ff,#fdfdfd);border:2px solid var(--app-green);border-radius:14px;overflow:hidden;touch-action:none;user-select:none;"></div>`;
      const board = document.getElementById('cl-board');
      const stains = [];
      for (let i = 0; i < total; i++) {
        const size = jgRand(sMin, sMax);
        const el = document.createElement('div');
        const x = jgRand(12, 88), y = jgRand(12, 88);
        el.style.cssText = `position:absolute;left:${x}%;top:${y}%;width:${size}px;height:${size}px;margin:-${size / 2}px 0 0 -${size / 2}px;border-radius:${jgRand(35, 50)}% ${jgRand(35, 50)}% ${jgRand(35, 50)}% ${jgRand(35, 50)}%;background:radial-gradient(circle,rgba(110,70,30,.9),rgba(110,70,30,.35));pointer-events:none;`;
        board.appendChild(el);
        stains.push({ el, x, y, size, hp: jgRand(hpBase, hpBase + 50), alive: true });
      }
      let cleared = 0, left = TIME, down = false;

      const wipe = (e) => {
        if (!down) return;
        const r = board.getBoundingClientRect();
        const px = e.clientX - r.left, py = e.clientY - r.top;
        stains.forEach(st => {
          if (!st.alive) return;
          const cx = r.width * st.x / 100, cy = r.height * st.y / 100;
          if (Math.hypot(px - cx, py - cy) < st.size / 2 + 10) {
            st.hp -= 9;
            st.el.style.opacity = Math.max(0, st.hp / (hpBase + 30)).toFixed(2);
            if (st.hp <= 0) { st.alive = false; st.el.remove(); cleared++; if (cleared >= total) finish(true, 'Sạch bong!'); }
          }
        });
      };
      board.addEventListener('pointerdown', (e) => { down = true; wipe(e); });
      board.addEventListener('pointermove', wipe);
      const up = () => { down = false; };
      window.addEventListener('pointerup', up);
      jobGameState.listeners.push(() => window.removeEventListener('pointerup', up));

      jgAddTimer(setInterval(() => {
        left--;
        const t = document.getElementById('cl-time'); if (t) t.innerText = `⏱ ${left}s`;
        if (left <= 0) finish(false, `Hết giờ! Còn ${total - cleared} vết bẩn.`);
      }, 1000));
    }

    // ---------- 2. THU NGÂN: thối tiền ----------
    function playCashier(lv, ctx, finish) {
      const DEN = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000];
      const ITEMS = [
        ['🥤 Nước ngọt', 8, 15], ['🍞 Bánh mì', 12, 25], ['🍜 Mì ly', 10, 20], ['🧃 Sữa hộp', 7, 18],
        ['🍫 Sô-cô-la', 15, 45], ['🧴 Dầu gội', 30, 95], ['🪥 Bàn chải', 12, 30], ['🍎 Táo (túi)', 25, 60],
        ['🧻 Giấy vệ sinh', 20, 55], ['🍪 Bánh quy', 10, 35]
      ];
      const NAMES = ['Cô Hoa', 'Anh Nam', 'Bé Mi', 'Chú Tư', 'Chị Lan', 'Bạn Khoa', 'Bà Sáu', 'Anh Dũng'];
      const n = Math.min(5, 2 + Math.floor(lv / 3));
      const items = jgShuffle(ITEMS.slice()).slice(0, n).map(it => ({ name: it[0], price: jgRand(it[1], it[2]) * 1000 }));
      const bill = items.reduce((t, i) => t + i.price, 0);
      const bills = [20000, 50000, 100000, 200000, 500000].filter(d => d > bill);
      const maxDiff = 60000 + lv * 45000;
      let opts = bills.filter(d => d - bill <= maxDiff);
      if (opts.length === 0) opts = [bills[0] || 500000];
      const paid = opts[jgRand(0, opts.length - 1)];
      const change = paid - bill;
      const name = NAMES[jgRand(0, NAMES.length - 1)];
      let left = Math.max(10, Math.round(26 - lv * 1.5));
      let picked = [];
      const sum = () => picked.reduce((t, v) => t + v, 0);
      const showSum = () => { const el = document.getElementById('cs-sum'); if (el) el.innerText = sum().toLocaleString('vi-VN') + 'đ'; };

      jgSetQ('💵 Thối đúng số tiền khách cần nhận lại.');
      jgArea().innerHTML = `
        <div id="cs-time" style="font-size:0.85rem;margin-bottom:4px;">⏱ ${left}s</div>
        <div style="text-align:left;background:#f7faf8;border:1px solid #e2e8f0;border-radius:10px;padding:10px;font-size:0.85rem;line-height:1.6;">
          <b>👤 ${name}</b><br>
          ${items.map(i => `${i.name}: ${i.price.toLocaleString('vi-VN')}đ`).join('<br>')}
          <hr style="border:0;border-top:1px dashed #cbd5e0;margin:4px 0;">
          Tổng: <b>${bill.toLocaleString('vi-VN')}đ</b> &nbsp;|&nbsp; Khách đưa: <b style="color:#e53e3e;">${paid.toLocaleString('vi-VN')}đ</b>
        </div>
        <div style="margin:8px 0;font-size:0.95rem;">Thối lại: <b id="cs-sum" style="color:#2b6cb0;">0đ</b></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
          ${DEN.map(d => `<button class="btn btn-outline jg-btn" data-d="${d}" style="padding:8px 2px;">${d / 1000}k</button>`).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn btn-outline" style="flex:1;" id="cs-undo">↩ Hoàn tác</button>
          <button class="btn btn-pink" style="flex:1;" id="cs-ok">✅ Đưa tiền</button>
        </div>`;
      jgArea().querySelectorAll('[data-d]').forEach(b => b.onclick = () => { picked.push(parseInt(b.dataset.d, 10)); showSum(); });
      document.getElementById('cs-undo').onclick = () => { picked.pop(); showSum(); };
      document.getElementById('cs-ok').onclick = () => {
        if (sum() === change) finish(true, 'Thối chính xác!');
        else finish(false, `Sai rồi! Cần thối ${change.toLocaleString('vi-VN')}đ, bạn đưa ${sum().toLocaleString('vi-VN')}đ.`);
      };
      jgAddTimer(setInterval(() => {
        left--;
        const t = document.getElementById('cs-time'); if (t) t.innerText = `⏱ ${left}s`;
        if (left <= 0) finish(false, `Hết giờ! Cần thối ${change.toLocaleString('vi-VN')}đ.`);
      }, 1000));
    }

    // ---------- 3. PHA CHẾ: làm đúng công thức ----------
    function playBarista(lv, ctx, finish) {
      const ING = [
        { k: 'cf', e: '☕', n: 'Cà phê' }, { k: 'milk', e: '🥛', n: 'Sữa' }, { k: 'sug', e: '🍬', n: 'Đường' },
        { k: 'ice', e: '🧊', n: 'Đá' }, { k: 'tea', e: '🍵', n: 'Trà' }, { k: 'syr', e: '🍓', n: 'Siro' }, { k: 'cream', e: '🍦', n: 'Kem' }
      ];
      const DRINKS = ['Latte đặc biệt', 'Trà sữa chiều', 'Cà phê muối', 'Mocha lạ', 'Trà trái cây', 'Cacao kem', 'Bạc xỉu'];
      const nTypes = lv <= 3 ? 2 : (lv <= 7 ? 3 : 4);
      const pieces = Math.min(12, 3 + Math.ceil(lv * 0.8));
      const picks = jgShuffle(ING.slice()).slice(0, nTypes);
      const order = {};
      picks.forEach(i => order[i.k] = 1);
      for (let t = nTypes; t < pieces; t++) order[picks[jgRand(0, nTypes - 1)].k]++;
      let cup = {};
      let left = Math.max(8, Math.round(16 - lv * 0.8));
      const fmt = (o) => ING.filter(i => o[i.k]).map(i => `${i.e}${i.n} ×${o[i.k]}`).join('  ');

      jgSetQ(`🧾 Khách gọi "${DRINKS[jgRand(0, DRINKS.length - 1)]}":\n${fmt(order)}`);
      jgArea().innerHTML = `
        <div id="bs-time" style="font-size:0.85rem;margin-bottom:4px;">⏱ ${left}s</div>
        <div style="background:#f7faf8;border:1px solid #e2e8f0;border-radius:10px;padding:10px;font-size:0.9rem;">🥤 Trong ly: <b id="bs-cup">(trống)</b></div>
        <div id="bs-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 0;"></div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-outline" style="flex:1;" id="bs-reset">🗑 Đổ đi</button>
          <button class="btn btn-pink" style="flex:1;" id="bs-ok">✅ Giao khách</button>
        </div>`;
      const upCup = () => { const el = document.getElementById('bs-cup'); if (el) el.innerText = fmt(cup) || '(trống)'; };
      function drawGrid() {
        const grid = document.getElementById('bs-grid');
        if (!grid) return;
        grid.innerHTML = jgShuffle(ING.slice()).map(i => `<button class="btn btn-outline jg-btn" data-k="${i.k}" style="flex-direction:column;padding:8px 2px;font-size:0.7rem;"><span style="font-size:1.4rem;">${i.e}</span>${i.n}</button>`).join('');
        grid.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
          cup[b.dataset.k] = (cup[b.dataset.k] || 0) + 1; upCup();
          if (lv >= 6) drawGrid(); // từ màn 6: nút đảo vị trí sau mỗi lần bấm
        });
      }
      drawGrid();
      document.getElementById('bs-reset').onclick = () => { cup = {}; upCup(); };
      document.getElementById('bs-ok').onclick = () => {
        const ok = ING.every(i => (cup[i.k] || 0) === (order[i.k] || 0));
        finish(ok, ok ? 'Khách khen ngon!' : `Sai công thức! Đúng là: ${fmt(order)}`);
      };
      jgAddTimer(setInterval(() => {
        left--;
        const t = document.getElementById('bs-time'); if (t) t.innerText = `⏱ ${left}s`;
        if (left <= 0) finish(false, `Hết giờ! Công thức đúng: ${fmt(order)}`);
      }, 1000));
    }

    // ---------- 4. TÀI XẾ / SHIPPER: né chướng ngại ----------
    function playDriver(lv, ctx, finish) {
      const DUR = ctx.endless ? Infinity : 10;
      jgSetQ('🛵 Chạm nửa trái/phải màn hình, bấm ◀ ▶ hoặc phím mũi tên để đổi làn.');
      jgArea().innerHTML = `
        <div id="dr-time" style="font-size:0.85rem;margin-bottom:4px;">⏱ ${DUR}s</div>
        <div id="dr-board" style="position:relative;width:100%;max-width:300px;height:380px;margin:0 auto;background:#4a5568;border-radius:14px;overflow:hidden;touch-action:none;user-select:none;">
          <div style="position:absolute;left:33.33%;top:0;bottom:0;border-left:3px dashed #cbd5e0;opacity:.6;"></div>
          <div style="position:absolute;left:66.66%;top:0;bottom:0;border-left:3px dashed #cbd5e0;opacity:.6;"></div>
          <div id="dr-car" style="position:absolute;bottom:10px;width:33.33%;height:44px;line-height:44px;text-align:center;font-size:2rem;transition:left .08s;">🛵</div>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:8px;">
          <button class="btn btn-outline jg-btn" id="dr-left" style="flex:1;">◀</button>
          <button class="btn btn-outline jg-btn" id="dr-right" style="flex:1;">▶</button>
        </div>`;
      const board = document.getElementById('dr-board');
      const car = document.getElementById('dr-car');
      const timeEl = document.getElementById('dr-time');
      const H = board.clientHeight || 380;
      const OBS = ['🚧', '🕳️', '🐕', '🚗', '🛢️', '🪨'];
      let lane = 1, elapsed = 0, spawnT = 0.4, last = null;
      const obstacles = [];
      const baseSpeed = Math.min(400, 140 + lv * 22);

      function setLane(l) { lane = Math.max(0, Math.min(2, l)); car.style.left = (lane * 33.33) + '%'; }
      setLane(1);
      document.getElementById('dr-left').onclick = () => setLane(lane - 1);
      document.getElementById('dr-right').onclick = () => setLane(lane + 1);
      board.addEventListener('pointerdown', (e) => {
        const r = board.getBoundingClientRect();
        setLane(lane + ((e.clientX - r.left) < r.width / 2 ? -1 : 1));
      });
      const keyH = (e) => { if (e.key === 'ArrowLeft') setLane(lane - 1); else if (e.key === 'ArrowRight') setLane(lane + 1); };
      window.addEventListener('keydown', keyH);
      jobGameState.listeners.push(() => window.removeEventListener('keydown', keyH));

      function loop(ts) {
        if (last === null) last = ts;
        const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
        elapsed += dt;
        const speed = ctx.endless ? Math.min(520, baseSpeed + elapsed * 5) : baseSpeed + elapsed * 6;

        spawnT -= dt;
        if (spawnT <= 0) {
          const nearTop = obstacles.filter(o => o.y < 120).length;
          if (nearTop < 2) {
            const l = jgRand(0, 2);
            const el = document.createElement('div');
            el.style.cssText = `position:absolute;top:-40px;left:${l * 33.33}%;width:33.33%;height:40px;line-height:40px;text-align:center;font-size:1.8rem;`;
            el.innerText = OBS[jgRand(0, OBS.length - 1)];
            board.appendChild(el);
            obstacles.push({ el, lane: l, y: -40 });
          }
          spawnT = Math.max(0.3, 0.8 - lv * 0.04 - (ctx.endless ? Math.min(0.3, elapsed * 0.004) : 0) + Math.random() * 0.5);
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
          const o = obstacles[i];
          o.y += speed * dt;
          o.el.style.top = o.y + 'px';
          if (o.lane === lane && o.y + 34 > H - 54 + 6 && o.y < H - 10 - 6) {
            o.el.remove(); obstacles.splice(i, 1);
            board.style.background = '#e53e3e';
            setTimeout(() => { if (board) board.style.background = '#4a5568'; }, 120);
            if (ctx.hit() <= 0) { if (ctx.over) ctx.over(Math.floor(elapsed)); else finish(false, 'Tai nạn!', true); return; }
            continue;
          }
          if (o.y > H) { o.el.remove(); obstacles.splice(i, 1); }
        }
        timeEl.innerText = ctx.endless ? `⏱ ${Math.floor(elapsed)}s sống sót` : `⏱ ${Math.max(0, Math.ceil(DUR - elapsed))}s`;

        if (!ctx.endless && elapsed >= DUR) { finish(true, 'Qua đoạn đường!'); return; }
        jobGameState.raf = requestAnimationFrame(loop);
      }
      jobGameState.raf = requestAnimationFrame(loop);
    }

    // ---------- 5. GIÁO VIÊN: chấm bài ----------
    function playTeacher(lv, ctx, finish) {
      const N = Math.min(12, 6 + Math.floor(lv / 2));
      const numWrong = Math.min(5, 2 + Math.floor(lv / 3));
      let left = Math.max(14, Math.round(32 - lv * 1.8));
      const M = 20 + lv * 12;
      const dMax = Math.max(2, 10 - lv);
      const ops = lv < 3 ? ['+', '−'] : ['+', '−', '×'];
      const wrongIdx = new Set();
      while (wrongIdx.size < numWrong) wrongIdx.add(jgRand(0, N - 1));
      const eqs = [];
      for (let i = 0; i < N; i++) {
        const op = ops[jgRand(0, ops.length - 1)];
        let a, b, r;
        if (op === '+') { a = jgRand(5, M); b = jgRand(5, M); r = a + b; }
        else if (op === '−') { a = jgRand(10, M + 20); b = jgRand(3, a - 1); r = a - b; }
        else { a = jgRand(3, 6 + lv); b = jgRand(3, 6 + lv); r = a * b; }
        let shown = r;
        if (wrongIdx.has(i)) { let d = 0; while (d === 0) d = jgRand(-dMax, dMax); shown = r + d; if (shown < 0) shown = r + Math.abs(d); }
        eqs.push({ text: `${a} ${op} ${b} = ${shown}`, wrong: wrongIdx.has(i) });
      }
      const marked = new Set();
      jgSetQ(`🎓 Có ${numWrong} phép tính SAI. Chạm để khoanh đỏ, rồi bấm Nộp bài.`);
      jgArea().innerHTML = `
        <div id="tc-time" style="font-size:0.85rem;margin-bottom:4px;">⏱ ${left}s</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          ${eqs.map((q, i) => `<button class="btn btn-outline jg-btn" data-i="${i}" style="font-size:0.95rem;padding:12px 4px;">${q.text}</button>`).join('')}
        </div>
        <button class="btn btn-pink" style="width:100%;margin-top:10px;" id="tc-submit">📝 Nộp bài</button>`;
      jgArea().querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
        const i = parseInt(b.dataset.i, 10);
        if (marked.has(i)) { marked.delete(i); b.style.background = 'transparent'; b.style.borderColor = 'var(--app-green)'; b.style.color = 'var(--app-dark-green)'; }
        else { marked.add(i); b.style.background = '#fed7d7'; b.style.borderColor = '#e53e3e'; b.style.color = '#c53030'; }
      });
      document.getElementById('tc-submit').onclick = () => {
        let missed = 0, falseMarks = 0;
        eqs.forEach((q, i) => { if (q.wrong && !marked.has(i)) missed++; if (!q.wrong && marked.has(i)) falseMarks++; });
        if (missed + falseMarks === 0) finish(true, 'Chấm chuẩn từng câu!');
        else finish(false, `Chấm sai: bỏ sót ${missed} câu sai, khoanh nhầm ${falseMarks} câu đúng.`);
      };
      jgAddTimer(setInterval(() => {
        left--;
        const t = document.getElementById('tc-time'); if (t) t.innerText = `⏱ ${left}s`;
        if (left <= 0) finish(false, 'Hết giờ nộp bài!');
      }, 1000));
    }

    // ---------- 6. CÔNG NGHỆ: sudoku (khó, thưởng cao) ----------
    let currentSudokuSolution = [];
    let currentSudokuPuzzle = [];

    // Đếm nghiệm (tối đa 2) để đảm bảo đề có đúng 1 lời giải; quá giới hạn bước thì coi như không an toàn
    function sdkCountSolutions(p) {
      const g = p.map(row => row.map(v => v || 0));
      const rows = Array(9).fill(0), cols = Array(9).fill(0), boxes = Array(9).fill(0);
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (g[r][c]) {
        const bit = 1 << g[r][c]; rows[r] |= bit; cols[c] |= bit; boxes[Math.floor(r / 3) * 3 + Math.floor(c / 3)] |= bit;
      }
      let count = 0, nodes = 0, aborted = false;
      function solve() {
        if (count > 1 || aborted) return;
        if (++nodes > 20000) { aborted = true; return; }
        let best = -1, bestMask = 0, bestN = 10;
        for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (!g[r][c]) {
          const used = rows[r] | cols[c] | boxes[Math.floor(r / 3) * 3 + Math.floor(c / 3)];
          let n = 0; for (let v = 1; v <= 9; v++) if (!(used & (1 << v))) n++;
          if (n < bestN) { bestN = n; best = r * 9 + c; bestMask = used; if (n <= 1) break; }
        }
        if (best < 0) { count++; return; }
        if (bestN === 0) return;
        const r = Math.floor(best / 9), c = best % 9, b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        for (let v = 1; v <= 9; v++) {
          const bit = 1 << v; if (bestMask & bit) continue;
          g[r][c] = v; rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
          solve();
          g[r][c] = 0; rows[r] &= ~bit; cols[c] &= ~bit; boxes[b] &= ~bit;
          if (count > 1 || aborted) return;
        }
      }
      solve();
      return aborted ? 99 : count;
    }

    // Chấm độ khó: 0 = chỉ cần ô/số duy nhất, 1 = cần thêm cặp đôi (naked/hidden pair), 2 = phải dùng kỹ thuật cao hơn hoặc đoán
    function sdkTechniqueLevel(p) {
      const g = p.map(row => row.map(v => v || 0));
      const boxOf = (r, c) => Math.floor(r / 3) * 3 + Math.floor(c / 3);
      const rowBit = Array(9).fill(0), colBit = Array(9).fill(0), boxBit = Array(9).fill(0);
      const cand = new Uint16Array(81);
      const refresh = () => {
        for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
          cand[r * 9 + c] = g[r][c] ? 0 : (0x3FE & ~(rowBit[r] | colBit[c] | boxBit[boxOf(r, c)]));
        }
      };
      const put = (r, c, v) => {
        const b = 1 << v; g[r][c] = v; rowBit[r] |= b; colBit[c] |= b; boxBit[boxOf(r, c)] |= b; refresh();
      };
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (g[r][c]) {
        const b = 1 << g[r][c]; rowBit[r] |= b; colBit[c] |= b; boxBit[boxOf(r, c)] |= b;
      }
      refresh();
      const units = [];
      for (let r = 0; r < 9; r++) { const u = []; for (let c = 0; c < 9; c++) u.push(r * 9 + c); units.push(u); }
      for (let c = 0; c < 9; c++) { const u = []; for (let r = 0; r < 9; r++) u.push(r * 9 + c); units.push(u); }
      for (let br = 0; br < 9; br += 3) for (let bc = 0; bc < 9; bc += 3) {
        const u = []; for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) u.push(r * 9 + c); units.push(u);
      }
      const full = () => g.every(row => row.every(v => v));
      const bits = (m) => { let n = 0; for (; m; m &= m - 1) n++; return n; };

      const applySingles = () => {
        let moved = false, again = true;
        while (again) {
          again = false;
          for (let i = 0; i < 81; i++) {
            const r = (i / 9) | 0, c = i % 9, m = cand[i];
            if (!g[r][c] && m && !(m & (m - 1))) { put(r, c, Math.round(Math.log2(m))); again = moved = true; }
          }
          if (again) continue;
          for (const u of units) for (let v = 1; v <= 9; v++) {
            const b = 1 << v; let at = -1, n = 0, has = false;
            for (const i of u) {
              const r = (i / 9) | 0, c = i % 9;
              if (g[r][c] === v) { has = true; break; }
              if (!g[r][c] && (cand[i] & b)) { n++; at = i; }
            }
            if (!has && n === 1) { put((at / 9) | 0, at % 9, v); again = moved = true; if (full()) return moved; }
          }
        }
        return moved;
      };

      // Bỏ ứng viên nhờ cặp đôi: 2 ô cùng đúng 2 khả năng (naked), hoặc 2 số chỉ nằm trong đúng 2 ô (hidden)
      const applyPairs = () => {
        let changed = false;
        for (const u of units) {
          const byMask = new Map();
          for (const i of u) {
            if (g[(i / 9) | 0][i % 9]) continue;
            const m = cand[i];
            if (bits(m) !== 2) continue;
            if (!byMask.has(m)) byMask.set(m, []);
            byMask.get(m).push(i);
          }
          for (const [m, cells] of byMask) {
            if (cells.length < 2) continue;
            for (const i of u) {
              if (cells.indexOf(i) >= 0 || g[(i / 9) | 0][i % 9]) continue;
              if (cand[i] & ~m) { cand[i] &= ~m; changed = true; }
            }
          }
          const spots = {};
          for (let v = 1; v <= 9; v++) spots[v] = [];
          for (const i of u) {
            if (g[(i / 9) | 0][i % 9]) continue;
            for (let v = 1; v <= 9; v++) if (cand[i] & (1 << v)) spots[v].push(i);
          }
          for (let a = 1; a <= 9; a++) for (let b = a + 1; b <= 9; b++) {
            if (spots[a].length !== 2 || spots[b].length !== 2) continue;
            if (spots[a][0] !== spots[b][0] || spots[a][1] !== spots[b][1]) continue;
            const m = (1 << a) | (1 << b);
            for (const i of spots[a]) if (cand[i] !== m) { cand[i] = m; changed = true; }
          }
        }
        return changed;
      };

      for (let round = 0; round < 80; round++) {
        if (full()) return 0;
        applySingles();
        if (full()) return 0;
        if (!applyPairs()) return 2;
        applySingles();
        if (full()) return 1;
      }
      return 2;
    }

    // Điểm khó: ít số đề hơn + cần kỹ thuật cao hơn + phải thử nhiều nước hơn khi giải
    function sdkGivensOf(p) {
      let n = 0;
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (p[r][c]) n++;
      return n;
    }
    // Số nút phải ngó tới khi giải bằng "thử từng nước + loại dần"; càng lớn càng khó
    function sdkGuessEffort(p) {
      const g = p.map(row => row.map(v => v || 0));
      const rows = Array(9).fill(0), cols = Array(9).fill(0), boxes = Array(9).fill(0);
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (g[r][c]) {
        const bit = 1 << g[r][c]; rows[r] |= bit; cols[c] |= bit; boxes[Math.floor(r / 3) * 3 + Math.floor(c / 3)] |= bit;
      }
      let nodes = 0, solved = false;
      function solve() {
        if (++nodes > 50000 || solved) return solved;
        let best = -1, bestMask = 0, bestN = 10;
        for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (!g[r][c]) {
          const used = rows[r] | cols[c] | boxes[Math.floor(r / 3) * 3 + Math.floor(c / 3)];
          let n = 0; for (let v = 1; v <= 9; v++) if (!(used & (1 << v))) n++;
          if (n < bestN) { bestN = n; best = r * 9 + c; bestMask = used; if (n <= 1) break; }
        }
        if (best < 0) { solved = true; return true; }
        if (bestN === 0) return false;
        const r = Math.floor(best / 9), c = best % 9, b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        for (let v = 1; v <= 9; v++) {
          const bit = 1 << v; if (bestMask & bit) continue;
          g[r][c] = v; rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
          if (solve()) return true;
          g[r][c] = 0; rows[r] &= ~bit; cols[c] &= ~bit; boxes[b] &= ~bit;
        }
        return false;
      }
      solve();
      return nodes;
    }
    function sdkDifficulty(p) {
      return (81 - sdkGivensOf(p)) * 2000 + sdkTechniqueLevel(p) * 5000 + Math.min(900, sdkGuessEffort(p));
    }

    const SDK_GIVENS = { easy: 36, hard: 30, hell: 22 };
    const SDK_FLOOR = { easy: 30, hard: 25, hell: 17 };
    // Mức Dễ vẫn phải giải được bằng suy luận, không bắt người chơi đoán
    const SDK_TECH_MAX = { easy: 1, hard: 2, hell: 2 };
    // Càng lên màn, đề càng ít số cho sẵn; chạm sàn (mức khó nhất còn tạo được) thì giữ nguyên
    function sdkGivensFor(level, stage) {
      const base = SDK_GIVENS[level] || 36, floor = SDK_FLOOR[level] || 30;
      const step = level === 'easy' ? 2 : 1;
      return Math.max(floor, base - Math.max(0, stage - 1) * step);
    }

    // Từ 23 ô trở xuống bộ dò đục lỗ không đủ chắc, nên giữ sẵn đề chuẩn rồi xáo trộn mỗi ván:
    // 17 ô theo mức kỷ lục thế giới (bộ sưu tập 17-clue của Gordon Royle), 18–21 ô là đề 17 ô
    // thêm số cho sẵn (nghiệm vẫn duy nhất), 22–23 ô do bộ dò của game tạo. Tất cả đều buộc phải đoán.
    const SDK_DEEP = {
      17: [
        ['6.2.5.........3.4..........43...8....1....2........7..5..27...........81...6.....', '682154379951763842374892165437528916816937254295416738568271493729345681143689527'],
        ['6.2.5.........4.3..........43...8....1....2........7..5..27...........81...6.....', '682153479951764832374892165437528916816947253295316748568271394729435681143689527'],
        ['.5.6...........73....1.........7.8...6.....5.1........7...4.2....4.3.......5...6.', '351627948286459731479183625543271896867394152192865374715946283624738519938512467'],
        ['....1.8...9.....3.2........4..5.3.6.7.1.....4..........5.2.......8...1.....3.....', '543912876197864235286735419429583761731629584865147923654271398378496152912358647'],
        ['....1.8...9.....3.2........4..5.3.6.7.1.....4..........5.2.......8...1.....6.....', '546312879197864235283795416429583761731926584865147923354271698678439152912658347'],
        ['35...2....1.....8.....9.7..4...6.......8...1..3.......6.....2..7.......4...1.....', '358712649917634582264598731482361975576829413139457826641973258793285164825146397'],
        ['...35.9..6.....4....1......2..8......3.9............6.....46.1.39.......7........', '842351976653297481971684235265813794437965128189472563528746319394128657716539842'],
        ['5..17.....3....2.....6.........248..1.............3....28........4.....6...7...5.', '592178643836459217471632598967524831143867925285913764628345179754291386319786452'],
        ['....2..53.6.....7.....1....6.2...1..4....8......5........4..2...5.3.......3......', '741629853269853471538714962682937145415268397397541628176485239854392716923176584'],
        ['.....83...6.....7.....1....851.........4...6............3...1.24..6........2..5..', '572968314169543278384712695851376429937425861246189753693857142425631987718294536'],
        ['....1.6..3......2.7...........7.2....1....8..5..3........2...354.......7.6.......', '824517693351649728796823514948762351613954872572381946189276435435198267267435189'],
        ['....4.9....3.2.....1..........1.2..34......8.9..6.....8....74.....3............5.', '286543971743921865519876324658192743421735689937684512895217436164358297372469158']
      ],
      18: [
        ['....81.6.6......3...4.......2....8.57..4...........1.....65..4.3.9.......8.......', '295381467617594238834267951421736895758419623963825174172658349349172586586943712'],
        ['...87.5..3......2.6.........7..1.8..4....3.............8.5.46.....6...3.........1', '214879563398165724657342189573916842461283975829457316182534697745691238936728451'],
        ['7834.........7..5...........4.1.8..........27...3.....2.6.5....5.....8........1..', '783465219421973658965281734347128596198546327652397481216854973534719862879632145'],
        ['.836.........7..4...........6.1.8..........27...3.....4.2.56...7.....8........1..', '583642719621973548974581236367128495198465327245397681412856973736219854859734162'],
        ['6..3.2....1.....5..2.......7.26............843.........8.15........8.2........7..', '654312879913876452827495136742638591165729384398541627286157943471983265539264718'],
        ['6..3.2....4.....1..........7.26............543.........8.15...3....4.2........7..', '615382479943765812827491536752634198168279354394518627286157943579843261431926785'],
        ['6..3.2....5.....1..........7.26.5..........543.........8.15........4.2........7..', '614382579953764812827591436742635198168279354395418627286157943579843261431926785'],
        ['..3.....7...5...1..8..........8..3...6.4.....1........5...37.......2.6....21..8..', '913264587726589413485371296257896341869413752134752968598637124341928675672145839'],
        ['5.1.......9.6...8....2........4..62.3...8....9.........4..7.....2....4.......3..9', '581794362297635184436218795178459623352186947964327851843972516729561438615843279'],
        ['......26..9.8............5.2.6.....7...7....4..1..........261..84........6....3..', '518374269693852471724691853286543917359718624471269538937426185842135796165987342'],
        ['1..3...5.94................67....4....42..8.....1.......2....1.....7...3.8..4....', '127386954946715382835429176671538429354297861298164537462953718519872643783641295'],
        ['34...2....1.....7.....8.6..2...5.......7...1..3.9.....5.....2..6.......5...1.....', '347612859816539472952487631278351964469728513135946728591863247683274195724195386']
      ],
      19: [
        ['4.72........5..8.1...3......54.1.6..2......7.....8....3..4...2..1..5.............', '487261359623579841195348762854712693261934578739685214378496125912857436546123987'],
        ['.84.6.......7...3..........73.1...........671......8....6.4.2..1..3...5...7......', '984563127612798435573412968739186542825934671461275893356847219148329756297651384'],
        ['...6..31...2..4....539..7...9.81............2......6..3.67............9.2........', '978625314162374859453981726697812435531467982824593671316759248785246193249138567'],
        ['.543........26..7..........76..2.......5..3.81..........24........6.35.........6.', '254387196391265874876149253763821945429576318185934627612458739947613582538792461'],
        ['53.91..........6.1.........2.1...7..6.8.35..........9..8.4...7.....6.....5.......', '534916287829374651167258349241689735698735412375142896986421573413567928752893164'],
        ['...3..71...6.5................1.73.5.85..2......4......6..2...87.....4..1........', '549368712276951834831274569692187345485632971317495286964723158728516493153849627'],
        ['..4...53..8..65.......1....1..5..7..2.......6..3..8....3.4...8.6..1..............', '964872531381965427527314869196523748258741396473698215739456182642187953815239674'],
        ['....8..31.28..................2.84..73.....6....5.....16..7.......4..2..3......8.', '476982531528316974913754628691238457735149862284567193162875349857493216349621785'],
        ['8...1..632.9...........2......9.51.....28.....3.......5.....9...6..3.......8...4.', '854719263219368457376452819687945132195283674432671598543127986968534721721896345'],
        ['....7..2...3...5..6..1.....17.....4..4.8........3.....5.4...8.3...24.........6...', '451673928793482516682159437178965342349827651265314789524791863936248175817536294'],
        ['...4...3.1.....8...........5...29....1.....7.6.......4..75..4......8.2.7.34......', '725498631196273845483651729548729316319846572672135984867512493951384267234967158'],
        ['...42...6.1...9......6.........6.31.4..7.5................31.522.6............8..', '395428176617359428824617593578962314431785269962143785749831652286574931153296847']
      ],
      20: [
        ['..1...4.....39.......1........2.1..875.....3....4..........42..3..95....69.....5.', '831526479426397815579148326963271548754689132218435967185764293347952681692813754'],
        ['..6.7.45..1.8......2.......7...4....4......87.....9..1.8.2.....3.....7.....1.4...', '836971452514823976927456138761348295493512687258769341189237564342685719675194823'],
        ['..82..1..3.2.....7............5..82.....7....8...6....67....4.3...8.1.5.4........', '968257134312489567547613298736594821129378645854162379671925483293841756485736912'],
        ['..96..13.3.......8............5..92.....8.....6..7....78......3...9.1.674........', '579628134312495678648713259837564921125389746964172385781256493253941867496837512'],
        ['.5.4..8..3...12.........1...1.7...5.....8..62.4.......2.9......6...3..8....1.....', '157469823364812975928357146812746359793581462546293718289674531671935284435128697'],
        ['.6...1..........2.......41....47.8...94.....1...8.....4..73....1.....59........46', '267941358941358627583627419612479835894563271735812964459736182176284593328195746'],
        ['1.4...2..6..5...3..........93.....582...14................2.1...5.8....47.....5..', '194683275678542931523179846931267458285314697467958312849725163356891724712436589'],
        ['21.3...7.....6..5.5........3.....7.2..4.5..........1.....1.2.8..36.......2.7.....', '219385476487961253563427819358614792174259368692873145945132687736548921821796534'],
        ['5.2...3.1.4.2............8..2...6.4.....3.5..8...........4.7.233...5......1......', '592748361148263975736195284923576148467831592815924637659417823384652719271389456'],
        ['5..2..7491..3.6........9......14.2...2..8......6.............6378....9...........', '563218749149376528278459631397145286421687395856932174915724863784563912632891457'],
        ['6.27..8.....8..13........9.4.....7...3..9........1.3..57.4..6...1.....2..........', '692731845754829136183645297421368759835297461967514382579482613318976524246153978'],
        ['..627..4..5....2...........52....1......4.......6........3.251.7.8....6.2....1...', '186273945457896231392514678524937186863145729971628453649382517718459362235761894']
      ],
      21: [
        ['.5.4...718....6.........9...931...........2...........4.8...6..2..514.8....7...3.', '659423871821976354347851926793142568164385297582697143478239615236514789915768432'],
        ['6.2.5.........4.3..........43...8....169..2........7..5..27...........81..368....', '682153479951764832374892165437528916816947253295316748568271394729435681143689527'],
        ['.5.6...4.2.....73....1.........7.8.6.6.....5.1........7...4.2....4.3.....3.5...6.', '351627948286459731479183625543271896867394152192865374715946283624738519938512467'],
        ['.834..2......7..58..........471.8..........276..3.....2.6.5....5.....8........1..', '783465219421973658965281734347128596198546327652397481216854973534719862879632145'],
        ['6..3.2....1.....5..2...5...7.26............843.8.......8.15........832........7..', '654312879913876452827495136742638591165729384398541627286157943471983265539264718'],
        ['6..3.2....4..6..12.........7.26.41.........543.........8.15........4.2........7..', '615382479943765812827491536752634198168279354394518627286157943579843261431926785'],
        ['..3....877..5...1..8....2....78..3...6.4.....1........5...37.......2.6....2...8..', '913264587726589413485371296257896341869413752134752968598637124341928675672145839'],
        ['5.1.......9.63..8....2........4..62.3...8...79.........4..7...6.2....4.......3..9', '581794362297635184436218795178459623352186947964327851843972516729561438615843279'],
        ['347..2....1...9.7.....8.6.12...5.......7...1..3.......5.1...2..6.......5...1.....', '347612859816539472952487631278351964469728513135946728591863247683274195724195386'],
        ['...6..31...2..4....5.98.7...9.81............2.2....6..3.67..2.........9.2........', '978625314162374859453981726697812435531467982824593671316759248785246193249138567'],
        ['53.9...........6.1.6....3..2.1...7..6..735.........89..8.4...7.....6.....5.......', '534916287829374651167258349241689735698735412375142896986421573413567928752893164'],
        ['...3..71...6.5............9...1.73...85........74......6..2...87...1.4..1...4....', '549368712276951834831274569692187345485632971317495286964723158728516493153849627']
      ],
      22: [
        ['.......9.......5.6.217.......4.2.............68...1..35...9.3.48..3.5.61..2......', '365418792478239516921756438154923687293687145687541923516892374849375261732164859'],
        ['...39...8...1...9...........45...21....6...89..7....4.6...1...3.9..2.........4.52', '471396528386152497259478631845937216132645789967281345624519873598723164713864952'],
        ['2......4.7..8....5..9....6..5......4..896..1.....25.....4...89.9....3......47....', '286531749743896125519247368652318974378964512491725683134652897927183456865479231'],
        ['..72...........2.3..675...16.9.....48...2.....3.5.1...4.1..8..........8.....4..9.', '147283956598164273326759841619837524875426319234591768451978632962315487783642195'],
        ['3.............86...98.....7................364827.3....4...5..91..9...5.7...1..4.', '361527984274398615598641327635189472917452836482763591843275169126934758759816243'],
        ['...43.7....8.1....61....3..49...........761....2.......54....8.1.6....9.......5.7', '529438716348617952617259348491382675835976124762541839954763281176825493283194567'],
        ['....56.3...8....7.9.....5..13......7....9..6...2.6...57....3...21...7.5.....8....', '471956238658132479923874516136425987547398162892761345785213694219647853364589721'],
        ['.7...6.......7.34...5.9..6.1.27....94................6.8...47....91....5...52....', '874316592926875341315492867162783459493651278758249136581964723249137685637528914'],
        ['.1.....3..8.2....4..7...................4.71.9.61.....8....3..5...9.5.41.....12.6', '219564837683217594457839162134792658528346719976158423841623975762985341395471286'],
        ['38..1.........3..9.7..2..4...1....5.2.9.5....4.....9.....3.1..67...4...1.....8...', '384917265125463879976825143861239457239754618457186932548391726793642581612578394'],
        ['..7..........8...34..9.3.8...6...........1.4...2...31...1.6.2.7....18..6...2.9...', '837152964129486573465973182316845729798321645542697318981564237253718496674239851'],
        ['4....17..2.....9.......6..8..728....8.......4......1...5..3.....6....41..2.7..35.', '483921765276853941519476238147285693832169574695347182751634829368592417924718356'],
        ['..135.8.....41..7...............86..2..7...93..6..3..197...........9....45.....1.', '641357829829416375537289146314928657285761493796543281978134562162895734453672918'],
        ['..4......1.5..8.2...84.3..1.3.1....6.....7........49.......57..6..3....4....9...2', '324516897165978423798423561837159246942867315516234978281645739679382154453791682'],
        ['8.....3...2..8....6....7......21.4.......95....3...81.....45.7..5..2....37......8', '817652394429183765635497182598216437741839526263574819982345671156728943374961258'],
        ['....1....49...6...1.....8.36..4....8.1.3..........82......5..923.....1..74...3...', '583217469497836521126945873675421938218369754934578216861754392359682147742193685'],
        ['....13..7....2.....4.....8..5......61......7......52.47.1....3....9.....6...7892.', '529813647816724359347596182253147896164289573978365214791652438482931765635478921'],
        ['...1.8..9....4.....267.....8..5..........1....3.....65..8.....3..4..9.7.1.9...4.2', '743168259981245736526793814812536947695471328437982165278614593354829671169357482']
      ],
      23: [
        ['.8.6...........3......1..........71....79....9....3.6...15.6.3..92.4...576.8..2..', '583674192124958376679312458238465719456791823917283564841526937392147685765839241'],
        ['...47....2.....6...37..5..2...79...5.....8...396.........1......61...3.....5.3.84', '619472853254839671837615492148796235725348916396251748483127569561984327972563184'],
        ['......8...3.7....5..76.4.2.41...5...2...3.....5......2...897.........9.1.7...2.4.', '624153897831729465597684123413275689268931754759468312145897236382546971976312548'],
        ['..2..89...57......4..6...2.9..2....4..13.7.5.........6.....46....5.8.1...1.....3.', '362458971157932468489671523976215384841367259523849716738124695695783142214596837'],
        ['8....5..6....69..7..9..2....1.....2....69....5....38.....5.6..4.3......1..8.1.7..', '827135946145869237369472158914758623283691475576243819791526384432987561658314792'],
        ['.......3823...5........921.......4....41...62.5...2...17..6.......7....5....4..21', '619274538237815946485639217721386459394157862856492173172568394943721685568943721'],
        ['...3.6.5.3..4..2..5....2.1.1....56....2.6......9..8...84...3.......9........4..75', '284316759371459286596782413138275694752964138469138527847523961615897342923641875'],
        ['.8..94..52...6.1..........3......9....7......598..6.2..4....6..3.2.......5.4.7.8.', '781394265234865197965271843423758916617942538598136724849513672372689451156427389'],
        ['......9.7....3....815......127.......5.2.8.....3.9........5.61.9..3...5...1.7...3', '234185967796432185815769432127643598459218376683597241372854619968321754541976823'],
        ['...7.9.256....14..7....5..........9..5.8..14.38..1...7........8....6......95.7...', '138749625625381479794625381417256893956873142382914567561492738273168954849537216'],
        ['..1...5.7....4.......6..98......3..8.4.7...5.9.7......79....1..3.28..7.6...5.....', '461982537879345612235671984526193478143768259987254361798436125352819746614527893'],
        ['.......6...5.24.....73.6.42.7.6.....8....1.2.....8...4.8...36..........5614......', '248917563365824197197356842471632958853491726926785314589243671732169485614578239'],
        ['...3.........4.8..9......2.3..7.4..5.8..9...6..5...187.....8.7.26...9......6....3', '824315769673942851951876324316784295782591436495263187139458672267139548548627913'],
        ['......49..4....1.......8..5.8.3............169..8.7.....9.62.5.86..3.....5...1.7.', '618523497245679183793148265481356729537294816926817534179462358862735941354981672'],
        ['......86..5.8..3.7..2.9...5..4...2...9.6.........3291.7.9..1....2......86........', '473125869951846327862397145314958276297614583586732914749581632125463798638279451'],
        ['.....8..98.5..1....4.56........7....16..2....7..4....8.......5.57.3..8...32....4.', '617248539825931467349567182258173694164829375793456218486712953571394826932685741'],
        ['...........17....5.36..4..22..6..9....9.....1...1.3....5...8.3...8.....9..741..6.', '574261893821739645936584712213645987469827351785193426652978134148356279397412568'],
        ['..64..5.....2....8.4..6........8.3...2..4......3.71...9..5...7.8.2.....54....72..', '296418537317259648548763129754682391129345786683971452931526874872134965465897213']
      ]
    };
    // Xáo trộn đề mẫu: đổi nhãn số, đổi hàng/cột trong từng khối và đổi cả khối, lật bàn cờ.
    // Các phép này giữ nguyên số ô, tính duy nhất và độ khó nên mỗi ván vẫn là một đề 17–23 ô mới.
    function sdkShuffleSeed(seed) {
      const shuf3 = (n) => { const a = [0, 1, 2]; for (let i = 2; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = a[i]; a[i] = a[j]; a[j] = t; } return a.map(x => x + n * 3); };
      const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let i = 8; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = digits[i]; digits[i] = digits[j]; digits[j] = t; }
      const rows = [...shuf3(0), ...shuf3(1), ...shuf3(2)];
      const cols = [...shuf3(0), ...shuf3(1), ...shuf3(2)];
      const flip = Math.random() < 0.5;
      const at = (s, r, c) => {
        const rr = flip ? cols[c] : rows[r], cc = flip ? rows[r] : cols[c];
        const v = +s[rr * 9 + cc];
        return v ? digits[v - 1] : 0;
      };
      const p = [], sol = [];
      for (let r = 0; r < 9; r++) {
        const pr = [], sr = [];
        for (let c = 0; c < 9; c++) { pr.push(at(seed[0], r, c) || null); sr.push(at(seed[1], r, c)); }
        p.push(pr); sol.push(sr);
      }
      return { p, sol, givens: sdkGivensOf(p) };
    }
    function sdkDeepPuzzle(givens) {
      const set = SDK_DEEP[givens] || SDK_DEEP[17];
      return sdkShuffleSeed(set[(Math.random() * set.length) | 0]);
    }

    function generateRandomSudoku(targetGivens, minScore, needLevel, maxGivens, minGivens, maxTechLevel) {
      // Mức sâu nhất: lấy đúng đề 17–23 ô có sẵn rồi xáo trộn (bộ dò đục lỗ không xuống tới mức này)
      const deep = Math.min(targetGivens, Math.max(maxGivens || 99, targetGivens));
      if (needLevel >= 2 && deep <= 23 && SDK_DEEP[deep]) {
        const d = sdkDeepPuzzle(deep);
        currentSudokuSolution = d.sol;
        currentSudokuPuzzle = d.p;
        return { p: d.p, sol: d.sol, givens: d.givens, score: sdkDifficulty(d.p) };
      }
      // Mỗi lượt thử điền một bàn đầy mới rồi đục lỗ, nên các lượt không bị kẹt chung một thế cờ
      function fillSolution() {
        const g = Array(9).fill(0).map(() => Array(9).fill(0));
        const ok = (r, c, num) => {
          for (let i = 0; i < 9; i++) {
            if (g[r][i] === num || g[i][c] === num) return false;
            if (g[3 * Math.floor(r / 3) + Math.floor(i / 3)][3 * Math.floor(c / 3) + (i % 3)] === num) return false;
          }
          return true;
        };
        const put = (r, c) => {
          if (r === 9) return true;
          const nr = c === 8 ? r + 1 : r, nc = c === 8 ? 0 : c + 1;
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (const num of nums) {
            if (ok(r, c, num)) {
              g[r][c] = num;
              if (put(nr, nc)) return true;
              g[r][c] = 0;
            }
          }
          return false;
        };
        put(0, 0);
        return g;
      }

      function carve(sol, target, deadline) {
        const p = sol.map(row => [...row]);
        const order = [];
        for (let i = 0; i < 81; i++) order.push(i);
        order.sort(() => Math.random() - 0.5);
        let givens = 81;
        // Quét lại nhiều lượt: ô giữ lại ở lượt trước có thể bỏ được sau khi bàn đã thưa hơn
        for (let pass = 0; pass < 3 && givens > target; pass++) {
          let moved = false;
          for (const idx of order) {
            if (givens <= target) break;
            const r = Math.floor(idx / 9), c = idx % 9, keep = p[r][c];
            if (!keep) continue;
            p[r][c] = null;
            if (sdkCountSolutions(p) === 1) { givens--; moved = true; } else p[r][c] = keep;
          }
          if (!moved) break;
        }
        // Bỏ từng ô đã bí thì thử bỏ cặp: có đề chỉ xuống thêm được khi bỏ hai ô cùng lúc
        if (givens > target) {
          const cells = [];
          for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (p[r][c]) cells.push(r * 9 + c);
          for (let i = 0; i < cells.length && givens > target; i++) {
            if (Date.now() > deadline) break;
            const ra = (cells[i] / 9) | 0, ca = cells[i] % 9;
            if (!p[ra][ca]) continue;
            const ka = p[ra][ca];
            p[ra][ca] = null;
            let paired = false;
            for (let j = i + 1; j < cells.length; j++) {
              const rb = (cells[j] / 9) | 0, cb = cells[j] % 9;
              if (!p[rb][cb]) continue;
              const kb = p[rb][cb];
              p[rb][cb] = null;
              if (sdkCountSolutions(p) === 1) { givens -= 2; paired = true; break; }
              p[rb][cb] = kb;
            }
            if (!paired) p[ra][ca] = ka;
          }
        }
        return { p, sol, givens };
      }

      // Ván sau phải khó hơn ván trước: thử nhiều lượt trong ngân sách thời gian, giữ đề khó nhất;
      // nếu vẫn chưa hơn thì bỏ thêm ô (vẫn giữ đúng 1 lời giải) cho tới khi hơn hoặc chạm sàn.
      const floor = Math.max(17, minGivens || 17);   // sàn của từng mức: không đục xuống thấp hơn
      const cap = Math.max(maxGivens || 99, targetGivens);   // không bao giờ cho ra đề dễ hơn ván trước
      const hardCap = Math.min(targetGivens, cap);
      const plateau = targetGivens <= floor;          // đã là mức ít số nhất tạo được
      // Bản lưu cũ có thể khó hơn mức tạo được; chặn mốc so sánh để không dò vô ích
      minScore = Math.min(minScore || 0, (81 - floor) * 2000 + (maxTechLevel == null ? 2 : maxTechLevel) * 5000);
      // Chạm sàn vẫn phải dò tiếp: đề ít số mà vẫn giải bằng suy luận đơn thì chưa phải khó nhất
      const budget = plateau ? 3000
        : minScore ? (targetGivens <= 21 ? 3200 : targetGivens <= 24 ? 2400 : 1400)
        : (targetGivens <= 21 ? 1600 : 800);
      const t0 = Date.now();
      // Đã chạm sàn thì không thể khó hơn được nữa, nên ván ngang độ khó cũng đạt (điểm lệch trong mức nhiễu)
      const minOut = plateau && minScore ? minScore - 900 : minScore;
      let best = null, bestScore = -1, bestAny = null, bestAnyScore = -1, tries = 0;
      do {
        const t = carve(fillSolution(), hardCap, t0 + budget);
        tries++;
        const sc = sdkDifficulty(t.p);
        const tech = sdkTechniqueLevel(t.p);
        if (sc > bestAnyScore) { bestAny = t; bestAnyScore = sc; }
        if (t.givens <= cap && tech >= needLevel && tech <= (maxTechLevel == null ? 2 : maxTechLevel) && sc > bestScore) { best = t; bestScore = sc; }
        if (best && best.givens <= hardCap && (!minScore || bestScore > minOut)) break;
      } while (tries < 40 && Date.now() - t0 < budget);
      if (!best) { best = bestAny; bestScore = bestAnyScore; }
      if ((minScore && bestScore <= minOut) || best.givens > hardCap) {
        // Vẫn chưa khó hơn ván trước: bỏ thêm ô, bỏ lẻ không được thì bỏ cặp
        const p = best.p, cells = [];
        for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (p[r][c]) cells.push(r * 9 + c);
        cells.sort(() => Math.random() - 0.5);
        for (let i = 0; i < cells.length && best.givens > floor && (best.givens > hardCap || (minScore && bestScore <= minOut)); i++) {
          if (Date.now() - t0 > budget + 1500) break;
          const ra = (cells[i] / 9) | 0, ca = cells[i] % 9;
          if (!p[ra][ca]) continue;
          const ka = p[ra][ca];
          p[ra][ca] = null;
          if (sdkCountSolutions(p) === 1) {
            best.givens--;
            bestScore = sdkDifficulty(p);
            if (bestScore > minOut) break;
            continue;
          }
          p[ra][ca] = ka;
          for (let j = i + 1; j < cells.length; j++) {
            const rb = (cells[j] / 9) | 0, cb = cells[j] % 9;
            if (!p[rb][cb]) continue;
            const kb = p[rb][cb];
            p[rb][cb] = null;
            if (sdkCountSolutions(p) === 1) {
              best.givens -= 2;
              bestScore = sdkDifficulty(p);
              if (bestScore > minOut) i = cells.length;
              break;
            }
            p[rb][cb] = kb;
          }
          if (bestScore > minOut) break;
        }
      }
      best.score = bestScore;
      currentSudokuSolution = best.sol;
      currentSudokuPuzzle = best.p;
      return best;
    }

    const SDK_REWARD = 100000000;
    const SDK_NEED = { easy: 0, hard: 1, hell: 2 };   // kỹ thuật tối thiểu buộc phải dùng để giải
    const SDK_LABEL = { easy: '🟢 Dễ', hard: '🔴 Cực khó', hell: '💀 Địa ngục' };
    let sdk = null;

    // So 2 ván lưu để gộp máy ↔ cloud: ưu tiên màn cao hơn, rồi số ô đã điền, cuối cùng là lưu gần nhất
    const sdkRow = (m, r) => (m && typeof m === 'object' ? m[r] : null);
    const sdkCellOf = (row, c) => {
      const v = row && typeof row === 'object' ? row[c] : 0;
      return (v === undefined || v === null || v === 0) ? 0 : (Number(v) || 0);
    };
    function sdkFilled(sv) {
      if (!sv || !sv.vals) return 0;
      let n = 0;
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (sdkCellOf(sdkRow(sv.vals, r), c)) n++;
      return n;
    }
    // Ván coi là dùng được khi có bàn cờ (9 hàng) và ít nhất một ô đề. Bản lưu hỏng vẫn được giữ làm dự phòng,
    // tuyệt đối không trả null chỉ vì hình dạng lạ (Firebase bỏ ô null nên hàng về dạng object).
    function sdkScore(sv) {
      if (!sv || typeof sv !== 'object' || !sv.puzzle || typeof sv.puzzle !== 'object') return -1;
      let rows = 0;
      for (let r = 0; r < 9; r++) if (sdkRow(sv.puzzle, r)) rows++;
      if (!rows) return -1;
      return (sv.stage || 0) * 10000 + Math.min(9999, sdkFilled(sv)) + rows;
    }
    function pickSudokuSave(a, b) {
      const sa = sdkScore(a), sb = sdkScore(b);
      if (sa < 0 && sb < 0) {
        if (a && typeof a === 'object') return a;
        if (b && typeof b === 'object') return b;
        return null;
      }
      if (sa !== sb) return sa > sb ? a : b;
      return ((a && a.savedAt) || 0) >= ((b && b.savedAt) || 0) ? a : b;
    }
    window.pickSudokuSave = pickSudokuSave;

    let sdkSaveTimer = null;
    function sdkPersist(now) {
      if (sdkSaveTimer) { clearTimeout(sdkSaveTimer); sdkSaveTimer = null; }
      const write = () => {
        sdkSaveTimer = null;
        if (!sdk || !sdk.vals) return;
        // Ô trống lưu bằng 0 chứ không dùng null: Firebase bỏ khoá null nên bản trên cloud sẽ hỏng hàng ô
        const puzzle = currentSudokuPuzzle.map(row => row.map(v => (v === null || v === undefined) ? 0 : Number(v)));
        window.state.sudokuSave = { level: sdk.level, stage: sdk.stage, earned: sdk.earned, puzzle: puzzle, solution: currentSudokuSolution, vals: sdk.vals, notes: sdk.notes, savedAt: Date.now() };
        saveStorage();
      };
      if (now) write(); else sdkSaveTimer = setTimeout(write, 1200);
    }
    function sdkFinishReview() { sdk = null; closeModal('modal-sudoku'); }
    function sdkClose() { if (sdk && !sdk.review) sdkPersist(true); if (sdk && sdk.review) sdk = null; closeModal('modal-sudoku'); }
    document.addEventListener('visibilitychange', () => { if (document.hidden && sdk && sdk.vals) sdkPersist(true); });

    function sdkShowControls() {
      document.getElementById('sdk-controls').style.display = 'flex';
      document.getElementById('sdk-pad').style.display = 'grid';
      document.getElementById('sdk-submit').style.display = 'block';
      document.getElementById('sdk-review-btn').style.display = 'none';
    }

    function sdkBuildPad() {
      const pad = document.getElementById('sdk-pad');
      pad.innerHTML = '';
      for (let n = 1; n <= 9; n++) {
        const b = document.createElement('button');
        b.className = 'btn btn-outline'; b.style.cssText = 'padding:0;height:42px;min-height:0;border-radius:10px;font-size:1.05rem;font-weight:bold;';
        b.innerText = n; b.onclick = () => sdkInput(n);
        pad.appendChild(b);
      }
    }

    let sdkMenuSave = null;   // ván đã hiện trên nút Tiếp tục: bấm là mở đúng ván đó, không đọc lại state
    // Chuẩn hoá ván lưu: chấp nhận object, chuỗi JSON, và puzzle dạng phẳng 81 ô của bản cũ
    function sdkNormalizeSave(raw) {
      let sv = raw;
      if (typeof sv === 'string') { try { sv = JSON.parse(sv); } catch (e) { return null; } }
      if (!sv || typeof sv !== 'object') return null;
      if (typeof sv.puzzle === 'string') {
        const digits = sv.puzzle.replace(/[^0-9.]/g, '');
        if (digits.length === 81) sv.puzzle = Array.from({ length: 9 }, (_, r) => digits.slice(r * 9, r * 9 + 9).split('').map(ch => ch === '.' ? 0 : Number(ch)));
      }
      if (Array.isArray(sv.puzzle) && sv.puzzle.length === 81) {
        sv.puzzle = Array.from({ length: 9 }, (_, r) => sv.puzzle.slice(r * 9, r * 9 + 9).map(v => Number(v) || 0));
      }
      if (Array.isArray(sv.puzzle) && sv.puzzle.length === 9 && sv.puzzle.every(row => typeof row === 'string')) {
        sv.puzzle = sv.puzzle.map(row => { const d = row.replace(/[^0-9.]/g, ''); return Array.from({ length: 9 }, (_, c) => d[c] === '.' || d[c] === undefined ? 0 : (Number(d[c]) || 0)); });
      }
      return sv;
    }
    function sdkResumeBtn(sv) {
      const filled = sdkFilled(sv);
      const tail = filled ? 'đã điền ' + filled + ' ô' : 'bàn còn trống';
      return `<button class="btn btn-pink" style="width:100%;white-space:normal;line-height:1.3;height:auto;min-height:44px;padding:8px 10px;" onclick="resumeSudoku()">▶ Tiếp tục ván đang chơi · ${SDK_LABEL[sv.level] || ''} · màn ${sv.stage || 1} · ${tail}</button>`
        + '<div style="font-size:0.75rem;color:#718096;margin-top:4px;">Hoặc bắt đầu ván mới bên dưới (ván đang lưu sẽ mất):</div>';
    }
    // Tự khôi phục ván đi xa nhất trong chuỗi bản lưu trên máy: chỉ đổi nút Tiếp tục, không thêm dòng nào
    function sdkNewGameAt() { return Number(localStorage.getItem('sdk_new_game_at') || 0) || 0; }
    async function sdkAutoRestoreBackup(box) {
      if (typeof window.readBackupStates !== 'function') return;
      let list = [];
      try { list = await window.readBackupStates(); } catch (e) { return; }
      if (document.getElementById('sdk-menu').style.display === 'none') return;   // người chơi đã vào ván khác
      const cur = sdkMenuSave ? sdkNormalizeSave(sdkMenuSave) : null;
      const since = sdkNewGameAt();
      // Ván trong máy được tạo sau mốc "bắt đầu ván mới" -> người chơi cố ý chơi ván này, không đè
      const keepNew = !!cur && sdkHasGivens(cur) && (cur.savedAt || 0) >= since;
      let best = cur;
      list.forEach(x => {
        const sv = sdkNormalizeSave(x.sudokuSave);
        if (!sv || !sdkHasGivens(sv)) return;
        if (since && keepNew && (x.updatedAt || 0) < since) return;
        best = pickSudokuSave(best, sv);
      });
      if (!best || best === cur || sdkScore(best) <= sdkScore(cur)) return;
      window.state.sudokuSave = best;
      sdkMenuSave = best;
      saveStorage();
      box.innerHTML = sdkResumeBtn(best);
    }

    function openSudoku9Minigame() {
      // Sudoku không giới hạn lượt chơi mỗi ngày
      const raw = window.state.sudokuSave;
      const sv = sdkNormalizeSave(raw);
      if (sv && sv !== raw) window.state.sudokuSave = sv;   // bản cũ (chuỗi JSON / mảng phẳng) -> dùng luôn dạng chuẩn
      sdkMenuSave = (sv && sdkHasGivens(sv)) ? sv : null;
      const box = document.getElementById('sdk-resume');
      box.innerHTML = sdkMenuSave ? sdkResumeBtn(sdkMenuSave) : '';
      document.getElementById('sdk-menu').style.display = 'flex';
      document.getElementById('sdk-play').style.display = 'none';
      openModal('modal-sudoku');
      sdkAutoRestoreBackup(box);
    }

    // Giải đề (trả về lưới đầy đủ) — dùng khi ván lưu cũ không có sẵn đáp án
    function sdkSolveOne(p) {
      const g = p.map(row => row.map(v => v || 0));
      const rows = Array(9).fill(0), cols = Array(9).fill(0), boxes = Array(9).fill(0);
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (g[r][c]) {
        const bit = 1 << g[r][c]; rows[r] |= bit; cols[c] |= bit; boxes[Math.floor(r / 3) * 3 + Math.floor(c / 3)] |= bit;
      }
      // Có ngân sách bước: bàn cờ lưu cũ bị hỏng có thể không giải được, không được để web treo cứng
      let sdkBudget = 200000;
      function solve() {
        if (--sdkBudget < 0) return false;
        let best = -1, bestMask = 0, bestN = 10;
        for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (!g[r][c]) {
          const used = rows[r] | cols[c] | boxes[Math.floor(r / 3) * 3 + Math.floor(c / 3)];
          let n = 0; for (let v = 1; v <= 9; v++) if (!(used & (1 << v))) n++;
          if (n < bestN) { bestN = n; best = r * 9 + c; bestMask = used; }
        }
        if (best < 0) return true;
        if (bestN === 0) return false;
        const r = Math.floor(best / 9), c = best % 9, b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        for (let v = 1; v <= 9; v++) {
          const bit = 1 << v; if (bestMask & bit) continue;
          g[r][c] = v; rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
          if (solve()) return true;
          g[r][c] = 0; rows[r] &= ~bit; cols[c] &= ~bit; boxes[b] &= ~bit;
        }
        return false;
      }
      return solve() ? g : null;
    }

    // Chỉ cần một ô đề là mở được. Hàng trống bị Firebase bỏ hẳn (đề địa ngục có hàng không có số) vẫn hợp lệ
    function sdkHasGivens(sv) {
      if (!sv || !sv.puzzle || typeof sv.puzzle !== 'object') return false;
      for (let r = 0; r < 9; r++) {
        const row = sv.puzzle[r];
        if (!row || typeof row !== 'object') continue;
        for (let c = 0; c < 9; c++) if (sdkCellOf(row, c)) return true;
      }
      return false;
    }
    function resumeSudoku() {
      try { sdkResumeBoard(); }
      catch (e) {
        console.error('Mở ván sudoku lỗi:', e);
        alert('Chưa mở được ván đã lưu: ' + ((e && e.message) || e) + '\nVán vẫn còn trong máy, bạn bấm lại giúp mình nhé.');
      }
    }
    function sdkResumeBoard() {
      // Dùng đúng ván đang hiện trên nút: state có thể bị thay trong lúc mở (đăng nhập/đồng bộ)
      const sv = sdkNormalizeSave(sdkMenuSave || window.state.sudokuSave);
      if (!sv) {
        alert('Không thấy ván đang chơi trong dữ liệu hiện tại. Nếu đã đăng nhập, bạn thử tải lại trang rồi mở lại nhé.');
        openSudoku9Minigame();
        return;
      }
      // Firebase trả mảng thiếu ô null về dạng object {0:5,2:3} -> đọc theo chỉ số, chấp nhận cả hai kiểu
      const cell = sdkCellOf;
      const grid9 = (m) => Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => cell(m && m[r], c)));
      const rows = (sv.puzzle && typeof sv.puzzle === 'object') ? Array.from({ length: 9 }, (_, r) => sv.puzzle[r]) : null;
      const puzzle = rows ? rows.map(row => Array.from({ length: 9 }, (_, c) => cell(row, c) || null)) : null;
      if (!puzzle || !sdkHasGivens(sv)) {
        alert('Ván lưu này thiếu bàn cờ nên chưa mở được (bản lưu vẫn được giữ nguyên). Bạn chọn ván mới, hoặc lấy lại từ bản sao lưu nếu có.');
        openSudoku9Minigame();
        return;
      }
      currentSudokuPuzzle = puzzle;
      const solOk = Array.isArray(sv.solution) && sv.solution.length === 9 && sv.solution.every(r => r && typeof r === 'object' && Array.from({ length: 9 }, (_, c) => cell(r, c)).every(v => v >= 1 && v <= 9));
      currentSudokuSolution = solOk ? Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => cell(sv.solution[r], c))) : (sdkSolveOne(puzzle) || []);
      sdk = {
        level: sv.level || 'easy', stage: sv.stage || 1, earned: sv.earned || 0,
        noteMode: false, sel: null, review: false,
        diffScore: sdkDifficulty(puzzle),   // giữ đà: màn sau vẫn phải khó hơn ván đang mở
        diffGivens: sdkGivensOf(puzzle),
        vals: grid9(sv.vals), notes: grid9(sv.notes)
      };
      sdkMenuSave = sv;
      document.getElementById('sdk-menu').style.display = 'none';
      document.getElementById('sdk-play').style.display = 'block';
      sdkShowControls();
      sdkBuildPad();
      sdkRender();
    }

    function startSudoku(level) {
      if (window.state.sudokuSave && !confirm('Ván đang lưu sẽ bị xóa. Bắt đầu ván mới?')) return;
      // Đánh dấu mốc để bản lưu cũ hơn không tự khôi phục đè lên ván mới người chơi vừa mở
      localStorage.setItem('sdk_new_game_at', String(Date.now()));
      window.state.sudokuSave = null;
      sdkMenuSave = null;
      sdk = { level, stage: 0, earned: 0, noteMode: false };
      document.getElementById('sdk-menu').style.display = 'none';
      document.getElementById('sdk-play').style.display = 'block';
      sdkShowControls();
      sdkBuildPad();
      sdkNextStage();
    }

    function sdkNextStage() {
      sdk.stage++;
      sdk.noteMode = false; sdk.sel = null;
      document.getElementById('sdk-status').innerText = '⏳ Đang tạo đề...';
      const cur = sdk;
      setTimeout(() => {
        if (sdk !== cur) return;
        const target = sdkGivensFor(cur.level, cur.stage);
        const res = generateRandomSudoku(target, cur.diffScore || 0, SDK_NEED[cur.level] || 0, cur.diffGivens || 99, SDK_FLOOR[cur.level] || 17, SDK_TECH_MAX[cur.level]);
        cur.diffScore = res.score;
        cur.diffGivens = res.givens;
        cur.vals = Array(9).fill(0).map(() => Array(9).fill(0));
        cur.notes = Array(9).fill(0).map(() => Array(9).fill(0));
        sdkPersist(true);
        sdkRender();
      }, 40);
    }

    function sdkRender() {
      const grid = document.getElementById('sudoku-grid-9');
      grid.innerHTML = '';
      document.getElementById('sdk-status').innerText = `${SDK_LABEL[sdk.level]} | Màn ${sdk.stage} | Đã nhận: ${sdk.earned.toLocaleString('vi-VN')}đ`;
      const nb = document.getElementById('sdk-note-btn');
      nb.innerText = '✏️ Nháp: ' + (sdk.noteMode ? 'Bật' : 'Tắt');
      nb.style.background = sdk.noteMode ? '#fefcbf' : '';
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const given = currentSudokuPuzzle[r][c] !== null;
          const cell = document.createElement('div');
          const isSel = sdk.sel && sdk.sel[0] === r && sdk.sel[1] === c;
          let bg = (Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 1 ? '#f0f9f4' : '#fff';
          if (given) bg = '#edf2f7';
          if (isSel) bg = '#fefcbf';
          const solV = currentSudokuSolution[r] ? currentSudokuSolution[r][c] : undefined;
          const wrong = sdk.review && !given && solV !== undefined && sdk.vals[r][c] !== solV;
          if (wrong) bg = '#fed7d7';
          cell.style.cssText = `position:relative;min-width:0;overflow:hidden;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;box-sizing:border-box;background:${bg};border:1px solid #cbd5e0;` +
            (c % 3 === 2 && c < 8 ? 'border-right:3px solid #2d3748;' : '') + (r % 3 === 2 && r < 8 ? 'border-bottom:3px solid #2d3748;' : '');
          const v = given ? currentSudokuPuzzle[r][c] : sdk.vals[r][c];
          if (v) {
            cell.innerHTML = `<span style="font-size:1.15rem;font-weight:bold;color:${wrong ? '#c53030' : (given ? '#2d3748' : '#2b6cb0')};">${v}</span>`;
          } else if (sdk.notes[r][c]) {
            let h = '<div style="position:absolute;inset:0;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);font-size:0.6rem;color:#718096;line-height:1;">';
            for (let n = 1; n <= 9; n++) h += `<span style="display:flex;align-items:center;justify-content:center;">${sdk.notes[r][c] & (1 << n) ? n : ''}</span>`;
            cell.innerHTML = h + '</div>';
          }
          if (wrong && !v) cell.innerHTML = `<span style="font-size:0.7rem;color:#c53030;">${solV}</span>`;
          if (!given && !sdk.review) cell.onclick = () => { sdk.sel = [r, c]; sdkRender(); };
          grid.appendChild(cell);
        }
      }
    }

    function sdkToggleNote() { sdk.noteMode = !sdk.noteMode; sdkRender(); }

    function sdkInput(n) {
      if (!sdk || !sdk.sel || sdk.review) return;
      const [r, c] = sdk.sel;
      if (n === 0) { sdk.vals[r][c] = 0; sdk.notes[r][c] = 0; }
      else if (sdk.noteMode) { if (!sdk.vals[r][c]) sdk.notes[r][c] ^= (1 << n); }
      else { sdk.vals[r][c] = sdk.vals[r][c] === n ? 0 : n; sdk.notes[r][c] = 0; }
      sdkPersist();
      sdkRender();
    }

    function checkSudoku9Result() {
      if (!sdk) return;
      const g = Array(9).fill(0).map((_, r) => Array(9).fill(0).map((_, c) => currentSudokuPuzzle[r][c] !== null ? currentSudokuPuzzle[r][c] : sdk.vals[r][c]));
      // Kiểm tra theo luật sudoku (hàng, cột, ô 3x3)
      let isAllCorrect = true;
      for (let i = 0; i < 9 && isAllCorrect; i++) {
        const row = new Set(), col = new Set(), box = new Set();
        for (let j = 0; j < 9; j++) {
          const a = g[i][j], b = g[j][i], c = g[3 * Math.floor(i / 3) + Math.floor(j / 3)][3 * (i % 3) + (j % 3)];
          if (a < 1 || a > 9 || b < 1 || b > 9 || c < 1 || c > 9) { isAllCorrect = false; break; }
          row.add(a); col.add(b); box.add(c);
        }
        if (isAllCorrect && (row.size !== 9 || col.size !== 9 || box.size !== 9)) isAllCorrect = false;
      }
      if (isAllCorrect) {
        sdk.earned += SDK_REWARD;
        window.state.walletBalance = (window.state.walletBalance || 0) + SDK_REWARD;
        mtrack('workLevels', 1); mtrack('workBest', sdk.stage, 'max');
        const boxTxt = grantFreeBox(0.15);
        saveStorage(); renderLifeModeUI();
        alert(`🎉 CHÍNH XÁC! Màn ${sdk.stage} +${SDK_REWARD.toLocaleString('vi-VN')} VNĐ.${boxTxt ? '\n🎁 Nhặt được ' + boxTxt + '!' : ''} Sang màn tiếp theo!`);
        sdkNextStage();
      } else {
        window.state.sudokuSave = null; saveStorage();
        sdk.review = true; sdk.sel = null;
        let nWrong = 0;
        for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (currentSudokuPuzzle[r][c] === null && currentSudokuSolution[r] && sdk.vals[r][c] !== currentSudokuSolution[r][c]) nWrong++;
        ['sdk-controls', 'sdk-pad', 'sdk-submit'].forEach(id => { document.getElementById(id).style.display = 'none'; });
        document.getElementById('sdk-review-btn').style.display = 'block';
        sdkRender();
        document.getElementById('sdk-status').innerHTML = `<b style="color:#c53030;">❌ Sai ${nWrong} ô</b> (ô đỏ là chỗ sai, số đỏ nhỏ là đáp án đúng). Tổng đã nhận: ${sdk.earned.toLocaleString('vi-VN')}đ. Hiểu rồi thì bấm Đóng.`;
      }
    }
