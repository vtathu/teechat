    // ===================== NGHỀ NGHIỆP =====================
    // Nghề càng khó thắng thì lương càng cao
    const JOBS = {
      cleaner: { unit: 27000, desc: 'Lau sạch vết bẩn, không giới hạn màn: càng về sau vết càng nhiều, nhỏ và cứng đầu, thời gian càng ít (khó dần đến màn 20). Sai hoặc hết giờ mất 1 mạng, hết 3 mạng thì dừng. Mỗi màn qua được nhận tiền, càng xa càng nhiều.' },
      cashier: { unit: 36000, desc: 'Thối tiền cho khách, không giới hạn màn: hóa đơn dài dần, tiền thối lẻ hơn, thời gian càng ít (khó dần đến màn 20). Sai hoặc hết giờ mất 1 mạng, hết 3 mạng thì dừng. Mỗi màn qua được nhận tiền, càng xa càng nhiều.' },
      barista: { unit: 48000, desc: 'Pha đúng công thức khách gọi, không giới hạn màn: nhiều nguyên liệu hơn, ít thời gian hơn, từ màn 6 các nút đảo vị trí sau mỗi lần bấm. Sai hoặc hết giờ mất 1 mạng, hết 3 mạng thì dừng. Mỗi màn qua được nhận tiền, càng xa càng nhiều.' },
      teacher: { unit: 60000, desc: 'Chấm bài, không giới hạn màn: nhiều phép tính hơn, số lớn hơn, lỗi sai tinh vi hơn, thời gian càng ít. Phải chấm chuẩn 100% mới qua màn, sai hoặc hết giờ mất 1 mạng, hết 3 mạng thì dừng. Mỗi màn qua được nhận tiền, càng xa càng nhiều.' },
      driver:  { unit: 84000, desc: 'Né chướng ngại vật: mỗi màn chạy không giới hạn, xe càng lúc càng nhanh, đâm 5 lần thì hết màn. 3 màn là 1 ca làm. Tiền tính theo thời gian sống sót mỗi màn.' },
      sudoku:  { unit: 100000000, desc: 'Giải mã sudoku: chọn Dễ, Cực khó hoặc Địa ngục (rất ít số gợi ý, không báo đúng/sai, có chế độ viết nháp, bấm Nộp bài mới chấm). Mỗi màn thắng nhận 100.000.000 VNĐ, thắng thì sang màn mới, nộp sai thì hết ca. Chơi không giới hạn lượt mỗi ngày, thoát giữa chừng được lưu ván.' }
    };

    function canChangeJob() {
      if (!window.state.jobPicked) return { ok: true, left: 0 };
      const hrs = (nowTs() - (window.state.jobChangeTimestamp || 0)) / 3600000;
      return { ok: hrs >= 3, left: Math.max(0, Math.ceil((3 - hrs) * 60)) };
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
        limitInfo.innerText = `Lượt làm việc: ${window.state.dailyWorkCount}/8 | Lượt thủ công: ${window.state.dailyCraftCount || 0}/4 | ${jobTxt}`;
      }

      renderShopUI();

      renderInventoryUI();
      renderCraftBag();
      updateCraftPreview();
      renderMissionTab();
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

    // Giải thử chỉ bằng 2 kỹ thuật dễ (ô chỉ còn 1 số, số chỉ có 1 chỗ trong hàng/cột/khối); true nếu giải xong
    function sdkSolvableBySingles(p) {
      const g = p.map(row => row.map(v => v || 0));
      const units = [];
      for (let i = 0; i < 9; i++) {
        const row = [], col = [], box = [];
        for (let j = 0; j < 9; j++) { row.push(i * 9 + j); col.push(j * 9 + i); box.push((Math.floor(i / 3) * 3 + Math.floor(j / 3)) * 9 + (i % 3) * 3 + (j % 3)); }
        units.push(row, col, box);
      }
      const cand = (idx) => {
        const r = Math.floor(idx / 9), c = idx % 9, br = r - r % 3, bc = c - c % 3; let used = 0;
        for (let k = 0; k < 9; k++) { used |= 1 << g[r][k]; used |= 1 << g[k][c]; used |= 1 << g[br + Math.floor(k / 3)][bc + k % 3]; }
        return used;
      };
      let progress = true;
      while (progress) {
        progress = false;
        for (let idx = 0; idx < 81; idx++) {
          const r = Math.floor(idx / 9), c = idx % 9; if (g[r][c]) continue;
          const used = cand(idx); let n = 0, last = 0;
          for (let v = 1; v <= 9; v++) if (!(used & (1 << v))) { n++; last = v; }
          if (n === 1) { g[r][c] = last; progress = true; }
        }
        for (const u of units) for (let v = 1; v <= 9; v++) {
          let place = -1, cnt = 0, has = false;
          for (const idx of u) { const r = Math.floor(idx / 9), c = idx % 9; if (g[r][c] === v) { has = true; break; } if (!g[r][c] && !(cand(idx) & (1 << v))) { cnt++; place = idx; } }
          if (!has && cnt === 1) { g[Math.floor(place / 9)][place % 9] = v; progress = true; }
        }
      }
      return g.every(row => row.every(v => v));
    }

    function generateRandomSudoku(targetGivens) {
      let grid = Array(9).fill(0).map(() => Array(9).fill(0));
      
      function isValid(g, r, c, num) {
        for (let i = 0; i < 9; i++) {
          if (g[r][i] === num || g[i][c] === num) return false;
          let boxR = 3 * Math.floor(r / 3) + Math.floor(i / 3);
          let boxC = 3 * Math.floor(c / 3) + (i % 3);
          if (g[boxR][boxC] === num) return false;
        }
        return true;
      }

      function fillGrid(r, c) {
        if (r === 9) return true;
        let nextR = c === 8 ? r + 1 : r;
        let nextC = c === 8 ? 0 : c + 1;
        
        let nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
        for (let num of nums) {
          if (isValid(grid, r, c, num)) {
            grid[r][c] = num;
            if (fillGrid(nextR, nextC)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }

      fillGrid(0, 0);
      currentSudokuSolution = grid.map(row => [...row]);

      function carve(target) {
        const p = grid.map(row => [...row]);
        const order = [];
        for (let i = 0; i < 81; i++) order.push(i);
        order.sort(() => Math.random() - 0.5);
        let givens = 81;
        for (const idx of order) {
          if (givens <= target) break;
          const r = Math.floor(idx / 9), c = idx % 9, keep = p[r][c];
          p[r][c] = null;
          if (sdkCountSolutions(p) === 1) givens--; else p[r][c] = keep;
        }
        return { p, givens };
      }
      let puzzle;
      if (targetGivens <= 20) {
        // Địa ngục: thử nhiều lần trong ~1,2 giây, giữ đề ít số nhất mà chỉ dùng "điền số duy nhất" thì không giải xong
        let best = null; const t0 = Date.now();
        do {
          const t = carve(targetGivens);
          if (!sdkSolvableBySingles(t.p) && (!best || t.givens < best.givens)) best = t;
          if (best && best.givens <= targetGivens + 1) break;
        } while (Date.now() - t0 < 1200);
        puzzle = (best || carve(targetGivens)).p;
      } else {
        puzzle = carve(targetGivens).p;
      }
      currentSudokuPuzzle = puzzle;
    }

    const SDK_REWARD = 100000000;
    const SDK_GIVENS = { easy: 38, hard: 24, hell: 17 };
    const SDK_LABEL = { easy: '🟢 Dễ', hard: '🔴 Cực khó', hell: '💀 Địa ngục' };
    let sdk = null;

    let sdkSaveTimer = null;
    function sdkPersist(now) {
      if (sdkSaveTimer) { clearTimeout(sdkSaveTimer); sdkSaveTimer = null; }
      const write = () => {
        sdkSaveTimer = null;
        if (!sdk || !sdk.vals) return;
        window.state.sudokuSave = { level: sdk.level, stage: sdk.stage, earned: sdk.earned, puzzle: currentSudokuPuzzle, solution: currentSudokuSolution, vals: sdk.vals, notes: sdk.notes };
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

    function openSudoku9Minigame() {
      // Sudoku không giới hạn lượt chơi mỗi ngày
      const sv = window.state.sudokuSave;
      const box = document.getElementById('sdk-resume');
      box.innerHTML = sv && sv.puzzle ? `<button class="btn btn-pink" style="width:100%;" onclick="resumeSudoku()">▶ Tiếp tục ván đang chơi (${SDK_LABEL[sv.level]}, màn ${sv.stage})</button><div style="font-size:0.75rem;color:#718096;margin-top:4px;">Hoặc bắt đầu ván mới bên dưới (ván đang lưu sẽ mất):</div>` : '';
      document.getElementById('sdk-menu').style.display = 'flex';
      document.getElementById('sdk-play').style.display = 'none';
      openModal('modal-sudoku');
    }

    function resumeSudoku() {
      const sv = window.state.sudokuSave;
      if (!sv || !sv.puzzle) return;
      currentSudokuPuzzle = sv.puzzle;
      currentSudokuSolution = sv.solution || [];
      sdk = { level: sv.level, stage: sv.stage, earned: sv.earned || 0, noteMode: false, sel: null, vals: sv.vals, notes: sv.notes };
      document.getElementById('sdk-menu').style.display = 'none';
      document.getElementById('sdk-play').style.display = 'block';
      sdkShowControls();
      sdkBuildPad();
      sdkRender();
    }

    function startSudoku(level) {
      if (window.state.sudokuSave && !confirm('Ván đang lưu sẽ bị xóa. Bắt đầu ván mới?')) return;
      window.state.sudokuSave = null;
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
        generateRandomSudoku(SDK_GIVENS[cur.level]);
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
        saveStorage(); renderLifeModeUI();
        alert(`🎉 CHÍNH XÁC! Màn ${sdk.stage} +${SDK_REWARD.toLocaleString('vi-VN')} VNĐ. Sang màn tiếp theo!`);
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

