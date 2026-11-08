// ===================== NHIỆM VỤ =====================
    // Bộ chủ đề hoạt động nằm trong themes.js (nạp trước file này).
    const MISSION_DAILY = [
      { id: 'd_work', name: 'Qua 10 màn công việc', metric: 'workLevels', target: 10, reward: [{ type: 'box', tier: 'normal', theme: 'rand', n: 1 }] },
      { id: 'd_workbest', name: 'Đạt màn 8 trong một ca làm', metric: 'workBest', target: 8, reward: [{ type: 'box', tier: 'silver', theme: 'rand', n: 1 }] },
      { id: 'd_orders', name: 'Giao 2 đơn hàng thủ công', metric: 'orders', target: 2, reward: [{ type: 'box', tier: 'normal', theme: 'rand', n: 2 }] },
      { id: 'd_merge', name: 'Ghép 60 lần trong game thủ công', metric: 'merges', target: 60, reward: [{ type: 'box', tier: 'normal', theme: 'rand', n: 1 }] },
      { id: 'd_gift', name: 'Tặng quà cho nhân vật 1 lần', metric: 'gifts', target: 1, reward: [{ type: 'aff', pts: 3 }, { type: 'box', tier: 'normal', theme: 'rand', n: 1 }] },
      { id: 'd_chat', name: 'Gửi 10 tin nhắn trong truyện', metric: 'chats', target: 10, reward: [{ type: 'aff', pts: 2 }] },
      { id: 'd_lv', name: 'Tạo một món cấp 6 trở lên', metric: 'craftBest', target: 6, reward: [{ type: 'box', tier: 'silver', theme: 'rand', n: 1 }] },
      { id: 'd_work2', name: 'Qua 20 màn công việc', metric: 'workLevels', target: 20, reward: [{ type: 'box', tier: 'silver', theme: 'rand', n: 1 }, { type: 'aff', pts: 3 }] },
      { id: 'd_work5', name: 'Qua 5 màn công việc', metric: 'workLevels', target: 5, reward: [{ type: 'box', tier: 'normal', theme: 'rand', n: 1 }] },
      { id: 'd_work15', name: 'Qua 15 màn công việc', metric: 'workLevels', target: 15, reward: [{ type: 'box', tier: 'silver', theme: 'rand', n: 1 }] },
      { id: 'd_workbest4', name: 'Đạt màn 4 trong một ca làm', metric: 'workBest', target: 4, reward: [{ type: 'box', tier: 'normal', theme: 'rand', n: 1 }] },
      { id: 'd_workbest12', name: 'Đạt màn 12 trong một ca làm', metric: 'workBest', target: 12, reward: [{ type: 'box', tier: 'gold', theme: 'rand', n: 1 }] },
      { id: 'd_orders1', name: 'Giao 1 đơn hàng thủ công', metric: 'orders', target: 1, reward: [{ type: 'box', tier: 'normal', theme: 'rand', n: 1 }] },
      { id: 'd_orders4', name: 'Giao 4 đơn hàng thủ công', metric: 'orders', target: 4, reward: [{ type: 'box', tier: 'silver', theme: 'rand', n: 2 }] },
      { id: 'd_merge30', name: 'Ghép 30 lần trong game thủ công', metric: 'merges', target: 30, reward: [{ type: 'box', tier: 'normal', theme: 'rand', n: 1 }] },
      { id: 'd_merge120', name: 'Ghép 120 lần trong game thủ công', metric: 'merges', target: 120, reward: [{ type: 'box', tier: 'silver', theme: 'rand', n: 2 }] },
      { id: 'd_gift2', name: 'Tặng quà cho nhân vật 2 lần', metric: 'gifts', target: 2, reward: [{ type: 'aff', pts: 5 }, { type: 'box', tier: 'silver', theme: 'rand', n: 1 }] },
      { id: 'd_chat5', name: 'Gửi 5 tin nhắn trong truyện', metric: 'chats', target: 5, reward: [{ type: 'aff', pts: 1 }] },
      { id: 'd_chat20', name: 'Gửi 20 tin nhắn trong truyện', metric: 'chats', target: 20, reward: [{ type: 'aff', pts: 4 }, { type: 'box', tier: 'normal', theme: 'rand', n: 1 }] },
      { id: 'd_lv4', name: 'Tạo một món cấp 4 trở lên', metric: 'craftBest', target: 4, reward: [{ type: 'box', tier: 'normal', theme: 'rand', n: 1 }] },
      { id: 'd_lv8', name: 'Tạo một món cấp 8 trở lên', metric: 'craftBest', target: 8, reward: [{ type: 'box', tier: 'gold', theme: 'rand', n: 1 }] },
      { id: 'd_pet_feed2', name: 'Cho thú cưng ăn 2 lần', metric: 'petFeeds', target: 2, reward: [{ type: 'box', tier: 'normal', theme: 'rand', n: 1 }] },
      { id: 'd_pet_feed5', name: 'Cho thú cưng ăn 5 lần', metric: 'petFeeds', target: 5, reward: [{ type: 'box', tier: 'silver', theme: 'rand', n: 1 }] },
      { id: 'd_pet_play2', name: 'Chơi với thú cưng 2 lần', metric: 'petPlays', target: 2, reward: [{ type: 'box', tier: 'normal', theme: 'rand', n: 1 }] },
      { id: 'd_pet_play5', name: 'Chơi với thú cưng 5 lần', metric: 'petPlays', target: 5, reward: [{ type: 'aff', pts: 3 }, { type: 'box', tier: 'normal', theme: 'rand', n: 1 }] },
      { id: 'd_pet_walk1', name: 'Dắt thú cưng đi dạo 1 lần', metric: 'petWalks', target: 1, reward: [{ type: 'aff', pts: 2 }, { type: 'box', tier: 'normal', theme: 'rand', n: 1 }] },
      { id: 'd_pet_walk3', name: 'Dắt thú cưng đi dạo 3 lần', metric: 'petWalks', target: 3, reward: [{ type: 'box', tier: 'silver', theme: 'rand', n: 1 }] },
      { id: 'd_sell1', name: 'Bán 1 món thủ công', metric: 'sells', target: 1, reward: [{ type: 'box', tier: 'normal', theme: 'rand', n: 1 }] },
      { id: 'd_sell3', name: 'Bán 3 món thủ công', metric: 'sells', target: 3, reward: [{ type: 'box', tier: 'silver', theme: 'rand', n: 1 }] },
      { id: 'd_craft10', name: 'Làm 10 món thủ công', metric: 'craftDaily', target: 10, reward: [{ type: 'box', tier: 'normal', theme: 'rand', n: 1 }] },
      { id: 'd_craft25', name: 'Làm 25 món thủ công', metric: 'craftDaily', target: 25, reward: [{ type: 'aff', pts: 4 }, { type: 'box', tier: 'silver', theme: 'rand', n: 1 }] },
    ];
    // Thành tựu chạy theo chuỗi bậc: bậc sau mốc cao hơn và thưởng hậu hơn.
    const MISSION_MILESTONE = [
      { id: 'm_call', name: 'Màn công việc đã qua', metric: 'workLevels', tiers: [
        { target: 30, reward: [{ type: 'unlock', mode: 'adventure' }, { type: 'box', tier: 'normal', theme: 'rand', n: 1 }] },
        { target: 60, reward: [{ type: 'aff', pts: 8 }, { type: 'box', tier: 'silver', theme: 'rand', n: 2 }] },
        { target: 100, reward: [{ type: 'aff', pts: 15 }, { type: 'box', tier: 'gold', theme: 'rand', n: 2 }] }
      ] },
      { id: 'm_gift', name: 'Quà đã tặng nhân vật', metric: 'gifts', tiers: [
        { target: 10, reward: [{ type: 'aff', pts: 10 }, { type: 'box', tier: 'silver', theme: 'rand', n: 1 }] },
        { target: 25, reward: [{ type: 'aff', pts: 20 }, { type: 'box', tier: 'gold', theme: 'rand', n: 1 }] },
        { target: 50, reward: [{ type: 'aff', pts: 40 }, { type: 'box', tier: 'gold', theme: 'rand', n: 2 }] }
      ] },
      { id: 'm_date', name: 'Đơn hàng thủ công đã giao', metric: 'orders', tiers: [
        { target: 8, reward: [{ type: 'unlock', mode: 'date' }, { type: 'box', tier: 'silver', theme: 'rand', n: 1 }] },
        { target: 20, reward: [{ type: 'box', tier: 'gold', theme: 'rand', n: 2 }] },
        { target: 40, reward: [{ type: 'aff', pts: 20 }, { type: 'box', tier: 'gold', theme: 'rand', n: 2 }] }
      ] },
      { id: 'm_chat', name: 'Tin nhắn đã gửi', metric: 'chats', tiers: [
        { target: 150, reward: [{ type: 'aff', pts: 8 }] },
        { target: 400, reward: [{ type: 'aff', pts: 20 }, { type: 'box', tier: 'silver', theme: 'rand', n: 1 }] },
        { target: 800, reward: [{ type: 'aff', pts: 40 }, { type: 'box', tier: 'gold', theme: 'rand', n: 2 }] }
      ] },
      { id: 'm_night', name: 'Màn cao nhất trong ca làm', metric: 'workBest', tiers: [
        { target: 15, reward: [{ type: 'unlock', mode: 'night' }, { type: 'box', tier: 'gold', theme: 'rand', n: 1 }] },
        { target: 20, reward: [{ type: 'aff', pts: 15 }, { type: 'box', tier: 'gold', theme: 'rand', n: 1 }] },
        { target: 25, reward: [{ type: 'aff', pts: 30 }, { type: 'box', tier: 'gold', theme: 'rand', n: 2 }] }
      ] },
      { id: 'm_sell', name: 'Món thủ công đã bán', metric: 'sells', tiers: [
        { target: 3, reward: [{ type: 'box', tier: 'silver', theme: 'rand', n: 2 }] },
        { target: 8, reward: [{ type: 'box', tier: 'gold', theme: 'rand', n: 2 }] },
        { target: 15, reward: [{ type: 'aff', pts: 20 }, { type: 'box', tier: 'gold', theme: 'rand', n: 3 }] }
      ] },
      { id: 'm_confess', name: 'Cấp món thủ công cao nhất', metric: 'craftBest', tiers: [
        { target: 12, reward: [{ type: 'unlock', mode: 'confess' }, { type: 'box', tier: 'gold', theme: 'rand', n: 2 }] },
        { target: 14, reward: [{ type: 'aff', pts: 15 }, { type: 'box', tier: 'gold', theme: 'rand', n: 3 }] },
        { target: 15, reward: [{ type: 'aff', pts: 40 }, { type: 'box', tier: 'gold', theme: 'rand', n: 3 }] }
      ] },
      { id: 'm_work25', name: 'Màn thứ 25 trở lên trong ca', metric: 'workBest', tiers: [
        { target: 25, reward: [{ type: 'aff', pts: 20 }, { type: 'box', tier: 'gold', theme: 'rand', n: 2 }] },
        { target: 32, reward: [{ type: 'aff', pts: 30 }, { type: 'box', tier: 'gold', theme: 'rand', n: 2 }] },
        { target: 40, reward: [{ type: 'aff', pts: 50 }, { type: 'box', tier: 'gold', theme: 'rand', n: 3 }] }
      ] }
    ];

    function mHash(str) {
      let h = 0;
      for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
      return h;
    }
    function ensureMissionDay() {
      const today = new Date(nowTs()).toDateString();
      let md = window.state.missionData;
      if (!md || md.date !== today) {
        md = { date: today, progress: {}, claimed: {} };
        window.state.missionData = md;
      }
      // Firebase xóa object rỗng khi đồng bộ cloud -> bổ sung lại, nếu không sẽ lỗi và tab Nhiệm Vụ trống
      if (!md.progress || typeof md.progress !== 'object') md.progress = {};
      if (!md.claimed || typeof md.claimed !== 'object') md.claimed = {};
      if (!window.state.stats) window.state.stats = {};
      if (!window.state.milestoneClaimed) window.state.milestoneClaimed = {};
      if (!window.state.milestoneTiers || typeof window.state.milestoneTiers !== 'object') window.state.milestoneTiers = {};
      // Mốc cũ đã nhận (true) quy đổi thành bậc 1 của chuỗi, giữ nguyên lịch sử
      Object.keys(window.state.milestoneClaimed).forEach(id => {
        if (window.state.milestoneClaimed[id] && !window.state.milestoneTiers[id]) window.state.milestoneTiers[id] = 1;
      });
      if (!window.state.unlockedModes) window.state.unlockedModes = {};
      return md;
    }
    // Ghi nhận tiến độ nhiệm vụ (không tự lưu, nơi gọi sẽ lưu)
    function mtrack(metric, n, mode) {
      const md = ensureMissionDay();
      const st = window.state.stats;
      if (mode === 'max') {
        st[metric] = Math.max(st[metric] || 0, n);
        md.progress[metric] = Math.max(md.progress[metric] || 0, n);
      } else {
        st[metric] = (st[metric] || 0) + n;
        md.progress[metric] = (md.progress[metric] || 0) + n;
      }
    }
    function dailyMissionList() {
      const md = ensureMissionDay();
      const order = (d) => MISSION_DAILY.slice().sort((a, b) => mHash(d + a.id) - mHash(d + b.id));
      const yest = new Set(order(new Date(nowTs() - 86400000).toDateString()).slice(0, 4).map(x => x.id));
      const pool = order(md.date), picked = [], seen = new Set();
      [pool.filter(x => !yest.has(x.id)), pool.filter(x => yest.has(x.id))].forEach(list => {
        list.forEach(x => { if (picked.length < 4 && !seen.has(x.metric)) { picked.push(x); seen.add(x.metric); } });
      });
      pool.forEach(x => { if (picked.length < 4 && !picked.includes(x)) picked.push(x); });
      return picked;
    }
    function missionProgress(kind, def) {
      const md = ensureMissionDay();
      return kind === 'daily' ? (md.progress[def.metric] || 0) : ((window.state.stats && window.state.stats[def.metric]) || 0);
    }
    function missionTierCount(def) {
      const m = window.state.milestoneTiers || {};
      return Math.max(0, Math.min(m[def.id] || 0, def.tiers ? def.tiers.length : 0));
    }
    function missionNextTier(def) {
      if (!def || !def.tiers) return null;
      const n = missionTierCount(def);
      return n < def.tiers.length ? { idx: n, tier: def.tiers[n] } : null;
    }
    function missionClaimed(kind, id) {
      const md = ensureMissionDay();
      if (kind === 'daily') return !!md.claimed[id];
      const def = MISSION_MILESTONE.find(m => m.id === id);
      return !!def && !missionNextTier(def);
    }
    function rewardLabel(r) {
      if (r.type === 'box') {
        const tierObj = (typeof BOX_TIERS !== 'undefined' && BOX_TIERS[r.tier]) ? BOX_TIERS[r.tier] : { icon: '🎁', label: r.tier };
        return `${tierObj.icon} Box ${tierObj.label}${r.n > 1 ? ' ×' + r.n : ''} (chủ đề ngẫu nhiên)`;
      }
      if (r.type === 'aff') return `❤️ +${r.pts} thân mật`;
      if (r.type === 'unlock') return '🎭 Phiếu hoạt động riêng của nhân vật được chọn (vào Túi)';
      return '';
    }
    function missionRowHtml(kind, def) {
      const cur = missionProgress(kind, def);
      const done = cur >= def.target;
      const claimed = missionClaimed(kind, def.id);
      const pct = Math.min(100, Math.round(Math.min(cur, def.target) / def.target * 100));
      let btn;
      if (claimed) btn = '<button class="btn btn-outline" disabled style="opacity:.6;">✓ Đã nhận</button>';
      else if (done) btn = `<button class="btn btn-pink" onclick="claimMission('${kind}','${def.id}')">Nhận</button>`;
      else btn = missionJumpBtn(def.metric);
      return `<div style="background:#f7faf8;border:1px solid #e2e8f0;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
          <div style="font-size:0.88rem;font-weight:bold;">${def.name}</div>${btn}
        </div>
        <div style="height:8px;background:#e2e8f0;border-radius:6px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:var(--app-green);"></div></div>
        <div style="font-size:0.75rem;color:#4a5568;">${Math.min(cur, def.target)}/${def.target} · Thưởng: ${def.reward.map(rewardLabel).join(' + ')}</div>
      </div>`;
    }

    const MISSION_JUMP = {
      workLevels: () => openFs('work'),
      workBest: () => openFs('work'),
      gifts: () => { switchStoryTab('chat'); setTimeout(() => { if (typeof openGiftModal === 'function') openGiftModal(); }, 120); },
      chats: () => switchStoryTab('chat'),
      orders: () => openFs('craft'),
      merges: () => openFs('craft'),
      craftBest: () => openFs('craft'),
      craftDaily: () => openFs('craft'),
      sells: () => { if (typeof openBagTab === 'function') openBagTab('craft'); },
      petFeeds: () => openFs('pet'),
      petPlays: () => openFs('pet'),
      petWalks: () => openFs('pet')
    };
    function missionJumpBtn(metric) {
      if (!MISSION_JUMP[metric]) return '<button class="btn btn-outline" disabled style="opacity:.6;">Chưa xong</button>';
      return `<button class="btn btn-outline" style="opacity:.85;" onclick="jumpMission('${metric}')">Chưa xong</button>`;
    }
    function jumpMission(metric) {
      const fn = MISSION_JUMP[metric];
      if (!fn) return;
      try { fn(); } catch (e) { console.error('jumpMission', e); }
    }

    function missionChainHtml(def) {
      const next = missionNextTier(def);
      const cur = missionProgress('ms', def);
      const goal = next ? next.tier.target : def.tiers[def.tiers.length - 1].target;
      const reward = next ? next.tier.reward : def.tiers[def.tiers.length - 1].reward;
      const pct = Math.min(100, Math.round(Math.min(cur, goal) / goal * 100));
      let btn;
      if (!next) btn = '<button class="btn btn-outline" disabled style="opacity:.6;">✓ Đã nhận</button>';
      else if (cur >= goal) btn = `<button class="btn btn-pink" onclick="claimMission('ms','${def.id}')">Nhận</button>`;
      else btn = missionJumpBtn(def.metric);
      return `<div style="background:#f7faf8;border:1px solid #e2e8f0;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
          <div style="font-size:0.88rem;font-weight:bold;">${def.name}</div>${btn}
        </div>
        <div style="height:8px;background:#e2e8f0;border-radius:6px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:var(--app-green);"></div></div>
        <div style="font-size:0.75rem;color:#4a5568;">${Math.min(cur, goal)}/${goal} · Thưởng: ${reward.map(rewardLabel).join(' + ')}</div>
      </div>`;
    }

    function renderMissionTab() {
      const d = document.getElementById('mission-daily');
      if (!d) return;
      d.innerHTML = dailyMissionList().map(m => missionRowHtml('daily', m)).join('');
      
      const milestoneEl = document.getElementById('mission-milestone');
      if (milestoneEl) {
        milestoneEl.innerHTML = MISSION_MILESTONE.map(m => missionChainHtml(m)).join('');
      }

      const rows = [];
      if (typeof THEMES !== 'undefined' && typeof BOX_TIERS !== 'undefined' && typeof CRAFTS !== 'undefined' && typeof boxCount === 'function') {
        THEMES.forEach(t => {
          const parts = Object.keys(BOX_TIERS).filter(tier => boxCount(t, tier) > 0).map(tier => `${BOX_TIERS[tier].icon}×${boxCount(t, tier)}`);
          if (parts.length && CRAFTS[t]) rows.push(`<div style="font-size:0.85rem;">${CRAFTS[t].label}: ${parts.join('  ')}</div>`);
        });
      }
      const boxesEl = document.getElementById('mission-boxes');
      if (boxesEl) {
        boxesEl.innerHTML = rows.length ? rows.join('') + '<div style="font-size:0.75rem;color:#718096;margin-top:4px;">Mở box bằng nút 🎁 trong game thủ công.</div>' : '<div style="font-size:0.8rem;color:#888;">Chưa có box nào. Hoàn thành nhiệm vụ để nhận!</div>';
      }

      const story = window.state.stories ? window.state.stories.find(s => s.id === window.state.activeStoryId) : null;
      if (story && typeof ensureThemeStory === 'function') ensureThemeStory(story);
      const mrows = [];
      ((story && story.characters) || []).forEach(c => {
        const t = CHAT_THEMES[c.activityId];
        if (!t) return;
        const unlocked = themeIsUnlocked(t, c, story);
        const state = unlocked ? '<span style="color:var(--app-dark-green);">đã mở</span>' : `<span style="color:#888;">mở ở Lv.${t.minLv}</span>`;
        mrows.push(`<div style="font-size:0.85rem;"><b>${typeof escapeHtml === 'function' ? escapeHtml(c.name) : c.name}</b>: ${t.icon} ${t.name} · ${state}</div>`);
      });
      const modesEl = document.getElementById('mission-modes');
      if (modesEl) {
        modesEl.innerHTML = (mrows.join('') || '<div style="font-size:0.8rem;color:#888;">Truyện chưa có nhân vật.</div>') + '<div style="font-size:0.75rem;color:#718096;margin-top:4px;">Phiếu hoạt động nằm trong 🎒 Túi, bấm Dùng để mở.</div>';
      }
    }

    let pendingClaim = null;
    function claimMission(kind, id) {
      const list = kind === 'daily' ? MISSION_DAILY : MISSION_MILESTONE;
      const def = list.find(m => m.id === id);
      if (!def) return;
      let reward, tier = null;
      if (kind === 'daily') {
        if (missionClaimed('daily', id) || missionProgress('daily', def) < def.target) return;
        reward = def.reward;
      } else {
        const next = missionNextTier(def);
        if (!next || missionProgress('ms', def) < next.tier.target) return;
        tier = next.idx;
        reward = next.tier.reward;
      }
      const needsChar = reward.some(r => r.type === 'aff' || r.type === 'unlock');
      if (!needsChar) { applyMissionReward(kind, id, null, tier); return; }
      const story = window.state.stories ? window.state.stories.find(s => s.id === window.state.activeStoryId) : null;
      if (!story || !story.characters || story.characters.length === 0) return alert('Truyện chưa có nhân vật nào để nhận phần thưởng này!');
      pendingClaim = { kind, id, tier };
      
      const charSelectEl = document.getElementById('mission-char-select');
      if (charSelectEl) {
        charSelectEl.innerHTML = story.characters.map(c => {
          const lv = ((window.state.affectionLevels || {})[c.id] || { level: 1 }).level;
          const safeName = typeof escapeHtml === 'function' ? escapeHtml(c.name) : c.name;
          return `<option value="${c.id}">${safeName} (Lv.${lv})</option>`;
        }).join('');
      }
      
      const rewardEl = document.getElementById('mission-char-reward');
      if (rewardEl) {
        rewardEl.innerText = 'Thưởng: ' + reward.map(rewardLabel).join(' + ');
      }
      if (typeof openModal === 'function') openModal('modal-mission-char');
    }
    function confirmMissionChar() {
      if (!pendingClaim) return;
      const charSelectEl = document.getElementById('mission-char-select');
      const charId = charSelectEl ? charSelectEl.value : null;
      applyMissionReward(pendingClaim.kind, pendingClaim.id, charId, pendingClaim.tier);
    }
    function applyMissionReward(kind, id, charId, tierIdx) {
      const list = kind === 'daily' ? MISSION_DAILY : MISSION_MILESTONE;
      const def = list.find(m => m.id === id);
      if (!def) return;
      const reward = kind === 'daily' ? def.reward : (def.tiers && def.tiers[tierIdx || 0] ? def.tiers[tierIdx || 0].reward : null);
      if (!reward) return;
      const story = window.state.stories ? window.state.stories.find(s => s.id === window.state.activeStoryId) : null;
      const ch = story && charId && story.characters ? story.characters.find(c => c.id === charId) : null;

      for (const r of reward) {
        if (r.type === 'unlock' && !ch) return;
      }

      const got = [];
      const newActivityItems = [];
      reward.forEach(r => {
        if (r.type === 'box') {
          for (let k = 0; k < (r.n || 1); k++) {
            const t = (r.theme === 'rand' && typeof THEMES !== 'undefined') ? THEMES[Math.floor(Math.random() * THEMES.length)] : r.theme;
            if (typeof addBox === 'function') addBox(t, r.tier, 1);
            const tierObj = (typeof BOX_TIERS !== 'undefined' && BOX_TIERS[r.tier]) ? BOX_TIERS[r.tier] : { icon: '🎁', label: r.tier };
            const craftObj = (typeof CRAFTS !== 'undefined' && CRAFTS[t]) ? CRAFTS[t] : { label: t };
            got.push(`${tierObj.icon} Box ${tierObj.label} ${craftObj.label}`);
          }
        } else if (r.type === 'aff' && ch) {
          if (typeof addAffectionPoints === 'function') addAffectionPoints(ch.id, r.pts);
          got.push(`❤️ Thân mật với ${ch.name} tăng`);
        } else if (r.type === 'unlock' && ch) {
          if (!story.activityUnlocks) story.activityUnlocks = {};
          const theme = CHAT_THEMES[ch.activityId] || CHAT_THEMES.daily;
          const hadItem = typeof themeActivityItemFor === 'function' ? themeActivityItemFor(story, ch) : null;
          const item = typeof themeGrantActivityItem === 'function' ? themeGrantActivityItem(story, ch) : null;
          story.activityUnlocks[ch.id] = true;
          if (hadItem) {
            got.push(`🎭 ${ch.name} đã có phiếu ${theme.icon} ${theme.name} trong túi`);
          } else {
            got.push(`🎭 ${ch.name} nhận phiếu ${theme.icon} ${theme.name}`);
            if (item) newActivityItems.push(item);
          }
        }
      });

      if (kind === 'daily') ensureMissionDay().claimed[id] = true;
      else {
        if (!window.state.milestoneClaimed) window.state.milestoneClaimed = {};
        if (!window.state.milestoneTiers) window.state.milestoneTiers = {};
        window.state.milestoneTiers[id] = Math.max(window.state.milestoneTiers[id] || 0, (tierIdx || 0) + 1);
        window.state.milestoneClaimed[id] = true;
      }
      pendingClaim = null;
      if (typeof saveStorage === 'function') saveStorage();
      if (typeof closeModal === 'function') closeModal('modal-mission-char');
      renderMissionTab();
      if (newActivityItems.length && typeof themeShowRewardItems === 'function' && themeShowRewardItems(got, newActivityItems)) return;
      alert('🎉 Nhận thưởng!\n' + got.join('\n'));
    }
