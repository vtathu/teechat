    // ===================== NHIỆM VỤ =====================
    const MODES = {
      call: { icon: '📞', name: 'Gọi thoại', minLv: 3, prompt: (n) => `[CHẾ ĐỘ: GỌI THOẠI] Cuộc trò chuyện đang diễn ra qua một cuộc gọi điện thoại giữa "${n}" và người chơi. Hai người KHÔNG ở cùng một chỗ: chỉ miêu tả giọng nói, hơi thở, âm thanh xung quanh và nơi "${n}" đang ở, không có tiếp xúc cơ thể. Cách nói chuyện tự nhiên theo tính cách và độ thân mật hiện tại.` },
      date: { icon: '💞', name: 'Hẹn hò', minLv: 8, prompt: (n) => `[CHẾ ĐỘ: HẸN HÒ] Đây là buổi hẹn riêng giữa "${n}" và người chơi tại một địa điểm phù hợp bối cảnh. Miêu tả không khí, hoạt động hai người cùng làm, cử chỉ ngọt ngào ở mức phù hợp độ thân mật; để người chơi chủ động chọn bước tiếp theo, không tự quyết thay họ.` },
      night: { icon: '🌙', name: 'Tâm sự đêm khuya', minLv: 12, prompt: (n) => `[CHẾ ĐỘ: TÂM SỰ ĐÊM KHUYA] Đêm khuya yên tĩnh, "${n}" mở lòng chia sẻ suy nghĩ, nỗi lo, mong muốn với người chơi và lắng nghe thật sâu. Giọng chậm, ấm. Chỉ nói những điều hợp lý với thiết lập nhân vật và những gì đã xảy ra, không bịa thêm biến cố lớn mới.` },
      confess: { icon: '💌', name: 'Tỏ tình', minLv: 20, prompt: (n) => `[CHẾ ĐỘ: TỎ TÌNH] Đây là khoảnh khắc thổ lộ tình cảm giữa "${n}" và người chơi. Phản ứng của "${n}" phải dựa trên tính cách và độ thân mật thật sự: có thể đồng ý, ngập ngừng hay từ chối. Không tự quyết định thay người chơi.` }
    };

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
    ];
    const MISSION_MILESTONE = [
      { id: 'm_call', name: 'Qua tổng cộng 30 màn công việc', metric: 'workLevels', target: 30, reward: [{ type: 'unlock', mode: 'call' }, { type: 'box', tier: 'normal', theme: 'rand', n: 1 }] },
      { id: 'm_gift', name: 'Tặng quà tổng cộng 10 lần', metric: 'gifts', target: 10, reward: [{ type: 'aff', pts: 10 }, { type: 'box', tier: 'silver', theme: 'rand', n: 1 }] },
      { id: 'm_date', name: 'Giao tổng cộng 8 đơn hàng thủ công', metric: 'orders', target: 8, reward: [{ type: 'unlock', mode: 'date' }, { type: 'box', tier: 'silver', theme: 'rand', n: 1 }] },
      { id: 'm_chat', name: 'Gửi tổng cộng 150 tin nhắn', metric: 'chats', target: 150, reward: [{ type: 'aff', pts: 8 }] },
      { id: 'm_night', name: 'Đạt màn 15 trong một ca làm', metric: 'workBest', target: 15, reward: [{ type: 'unlock', mode: 'night' }, { type: 'box', tier: 'gold', theme: 'rand', n: 1 }] },
      { id: 'm_sell', name: 'Bán tổng cộng 3 món thủ công', metric: 'sells', target: 3, reward: [{ type: 'box', tier: 'silver', theme: 'rand', n: 2 }] },
      { id: 'm_confess', name: 'Tạo một món cấp 12 trong game thủ công', metric: 'craftBest', target: 12, reward: [{ type: 'unlock', mode: 'confess' }, { type: 'box', tier: 'gold', theme: 'rand', n: 2 }] },
      { id: 'm_work25', name: 'Đạt màn 25 trong một ca làm', metric: 'workBest', target: 25, reward: [{ type: 'aff', pts: 20 }, { type: 'box', tier: 'gold', theme: 'rand', n: 2 }] }
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
      if (!window.state.stats) window.state.stats = {};
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
      return kind === 'daily' ? (md.progress[def.metric] || 0) : (window.state.stats[def.metric] || 0);
    }
    function missionClaimed(kind, id) {
      const md = ensureMissionDay();
      return kind === 'daily' ? !!md.claimed[id] : !!(window.state.milestoneClaimed && window.state.milestoneClaimed[id]);
    }
    function rewardLabel(r) {
      if (r.type === 'box') return `${BOX_TIERS[r.tier].icon} Box ${BOX_TIERS[r.tier].label}${r.n > 1 ? ' ×' + r.n : ''} (chủ đề ngẫu nhiên)`;
      if (r.type === 'aff') return `❤️ +${r.pts} thân mật`;
      if (r.type === 'unlock') return `🔓 Mở khóa ${MODES[r.mode].icon} ${MODES[r.mode].name} (nhân vật cần Lv.${MODES[r.mode].minLv})`;
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
      else btn = '<button class="btn btn-outline" disabled style="opacity:.6;">Chưa xong</button>';
      return `<div style="background:#f7faf8;border:1px solid #e2e8f0;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
          <div style="font-size:0.88rem;font-weight:bold;">${def.name}</div>${btn}
        </div>
        <div style="height:8px;background:#e2e8f0;border-radius:6px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:var(--app-green);"></div></div>
        <div style="font-size:0.75rem;color:#4a5568;">${Math.min(cur, def.target)}/${def.target} · Thưởng: ${def.reward.map(rewardLabel).join(' + ')}</div>
      </div>`;
    }

    function renderMissionTab() {
      const d = document.getElementById('mission-daily');
      if (!d) return;
      d.innerHTML = dailyMissionList().map(m => missionRowHtml('daily', m)).join('');
      document.getElementById('mission-milestone').innerHTML = MISSION_MILESTONE.map(m => missionRowHtml('ms', m)).join('');

      const rows = [];
      THEMES.forEach(t => {
        const parts = Object.keys(BOX_TIERS).filter(tier => boxCount(t, tier) > 0).map(tier => `${BOX_TIERS[tier].icon}×${boxCount(t, tier)}`);
        if (parts.length) rows.push(`<div style="font-size:0.85rem;">${CRAFTS[t].label}: ${parts.join('  ')}</div>`);
      });
      document.getElementById('mission-boxes').innerHTML = rows.length ? rows.join('') + '<div style="font-size:0.75rem;color:#718096;margin-top:4px;">Mở box bằng nút 🎁 trong game thủ công.</div>' : '<div style="font-size:0.8rem;color:#888;">Chưa có box nào. Hoàn thành nhiệm vụ để nhận!</div>';

      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      const un = window.state.unlockedModes || {};
      const mrows = [];
      ((story && story.characters) || []).forEach(c => {
        const list = Object.keys(MODES).filter(k => un[c.id] && un[c.id][k]).map(k => `${MODES[k].icon} ${MODES[k].name}`);
        mrows.push(`<div style="font-size:0.85rem;"><b>${escapeHtml(c.name)}</b>: ${list.length ? list.join(', ') : '<span style="color:#888;">chưa mở chế độ nào</span>'}</div>`);
      });
      document.getElementById('mission-modes').innerHTML = (mrows.join('') || '<div style="font-size:0.8rem;color:#888;">Truyện chưa có nhân vật.</div>') + '<div style="font-size:0.75rem;color:#718096;margin-top:4px;">Bật chế độ bằng nút ➕ → 🎭 Chế độ trong màn trò chuyện.</div>';
    }

    let pendingClaim = null;
    function claimMission(kind, id) {
      const list = kind === 'daily' ? MISSION_DAILY : MISSION_MILESTONE;
      const def = list.find(m => m.id === id);
      if (!def || missionClaimed(kind, id) || missionProgress(kind, def) < def.target) return;
      const needsChar = def.reward.some(r => r.type === 'aff' || r.type === 'unlock');
      if (!needsChar) { applyMissionReward(kind, id, null); return; }
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      if (!story || !story.characters || story.characters.length === 0) return alert('Truyện chưa có nhân vật nào để nhận phần thưởng này!');
      pendingClaim = { kind, id };
      document.getElementById('mission-char-select').innerHTML = story.characters.map(c => {
        const lv = ((window.state.affectionLevels || {})[c.id] || { level: 1 }).level;
        return `<option value="${c.id}">${escapeHtml(c.name)} (Lv.${lv})</option>`;
      }).join('');
      document.getElementById('mission-char-reward').innerText = 'Thưởng: ' + def.reward.map(rewardLabel).join(' + ');
      openModal('modal-mission-char');
    }
    function confirmMissionChar() {
      if (!pendingClaim) return;
      const charId = document.getElementById('mission-char-select').value;
      applyMissionReward(pendingClaim.kind, pendingClaim.id, charId);
    }
    function applyMissionReward(kind, id, charId) {
      const list = kind === 'daily' ? MISSION_DAILY : MISSION_MILESTONE;
      const def = list.find(m => m.id === id);
      if (!def) return;
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      const ch = story && charId ? story.characters.find(c => c.id === charId) : null;

      for (const r of def.reward) {
        if (r.type === 'unlock') {
          if (!ch) return;
          const lv = ((window.state.affectionLevels || {})[ch.id] || { level: 1 }).level;
          if (lv < MODES[r.mode].minLv) return alert(`${ch.name} mới Lv.${lv}, cần Lv.${MODES[r.mode].minLv} để mở khóa "${MODES[r.mode].name}". Hãy tăng thân mật (tặng quà, trò chuyện) rồi nhận lại, hoặc chọn nhân vật khác.`);
          if (window.state.unlockedModes && window.state.unlockedModes[ch.id] && window.state.unlockedModes[ch.id][r.mode]) return alert(`${ch.name} đã mở khóa chế độ này rồi. Hãy chọn nhân vật khác!`);
        }
      }

      const got = [];
      def.reward.forEach(r => {
        if (r.type === 'box') {
          for (let k = 0; k < (r.n || 1); k++) {
            const t = r.theme === 'rand' ? THEMES[Math.floor(Math.random() * THEMES.length)] : r.theme;
            addBox(t, r.tier, 1);
            got.push(`${BOX_TIERS[r.tier].icon} Box ${BOX_TIERS[r.tier].label} ${CRAFTS[t].label}`);
          }
        } else if (r.type === 'aff' && ch) {
          addAffectionPoints(ch.id, r.pts);
          got.push(`❤️ Thân mật với ${ch.name} tăng`);
        } else if (r.type === 'unlock' && ch) {
          if (!window.state.unlockedModes) window.state.unlockedModes = {};
          if (!window.state.unlockedModes[ch.id]) window.state.unlockedModes[ch.id] = {};
          window.state.unlockedModes[ch.id][r.mode] = true;
          got.push(`🔓 ${ch.name} mở khóa ${MODES[r.mode].icon} ${MODES[r.mode].name}`);
        }
      });

      if (kind === 'daily') ensureMissionDay().claimed[id] = true;
      else { if (!window.state.milestoneClaimed) window.state.milestoneClaimed = {}; window.state.milestoneClaimed[id] = true; }
      pendingClaim = null;
      saveStorage();
      closeModal('modal-mission-char');
      renderMissionTab();
      alert('🎉 Nhận thưởng!\n' + got.join('\n'));
    }

