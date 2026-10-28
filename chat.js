// Xóa mọi dấu vết thẻ điểm thân mật (kể cả AI viết sai định dạng) để không hiện "+2" trong khung chat
function cleanAiTags(t) {
  return (t || '')
    .replace(/[\[\(（][^\[\]()（）\n]{0,40}?[+\-−–]\s*\d+\s*(?:điểm\s*)?(?:thân mật|tình cảm|hảo cảm|affection|love)[^\[\]()（）\n]{0,10}[\]\)）]/gi, '')
    .replace(/\[\s*(SYSTEM_TRANSFER|ACTION|EVENT|STATE|AFFECTION)\s*[:：][\s\S]*?\]/gi, '')
    .replace(/\[?\s*AFFECTION\s*[:：][^\n]*/gi, '')
    .replace(/\[?[^\[\]\n|:]{1,40}\|\s*[+\-−–]\s*\d+\s*\]?/g, '')
    .replace(/[❤💕💗💖💘]\uFE0F?\s*[+\-−–]\s*\d+(?:\s*(?:điểm|pts?))?/g, '')
    .replace(/[\[\(]?\s*(?:độ\s*)?thân mật\s*[:：]?\s*[+\-−–]\s*\d+\s*(?:điểm|pts?)?\s*[\]\)]?/gi, '')
    .replace(/[\[\(]?\s*[+\-−–]\s*\d+\s*(?:điểm\s*)?thân mật\s*[\]\)]?/gi, '')
    .replace(/^[ \t]*[\[\(]?\s*[+\-−–]\s*\d+\s*(?:điểm|pts?)?\s*[\]\)]?[ \t]*$/gim, '')
    .replace(/\{\{[\s\S]*?\}\}/g, '')
    .replace(/\(\s*Lv\.?\s*\d+[^)\n]{0,40}\)/gi, '')
    .replace(/[+\-−–]\s*\d+\s*(?:điểm\s*)?[❤💕💗💖💘]\uFE0F?/g, '')
    .replace(/[\[\(（]\s*[+\-−–]\s*\d+\s*(?:điểm|pts?|❤\uFE0F?)?\s*[\]\)）]/gi, '')
    .replace(/(?:thân mật|hảo cảm|tình cảm|affection|love)\s*[:：]?\s*[+\-−–]\s*\d+\s*(?:điểm|pts?)?/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
// Tin sự kiện cũ lưu dạng "📢 sự kiện / 👉 ... lựa chọn: ..." — đọc lại thành một câu kể tự nhiên
function naturalizeEventText(t) {
  const m = /^\s*📢\s*([\s\S]*?)\r?\n\s*👉\s*([\s\S]*)$/.exec(t || '');
  if (!m) return t;
  const choice = m[2].replace(/^[^\n]{0,40}?lựa chọn\s*:\s*"?/i, '').replace(/"\s*$/, '').trim();
  return `${m[1].trim()} ${choice}`.replace(/\s+/g, ' ').trim();
}
// Lọc bằng code: nếu AI lỡ viết thay người chơi thì cắt từ dòng đó trở đi, và xóa các câu "Tên nói: ..." nằm lẫn trong dòng
function stripUserVoice(text, name) {
  name = (name || '').trim();
  if (name.length < 2 || !text) return text;
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = name.split(/\s+/).filter(Boolean);
  const given = parts.length > 1 ? parts[parts.length - 1] : '';
  const two = parts.length > 2 ? parts.slice(-2).join(' ') : '';
  const names = esc(name) + (two ? '|' + esc(two) : '') + (given && given.length >= 2 ? '|' + esc(given) : '');
  const VERB = '(?:nói|đáp|trả lời|hỏi|thì thầm|thì thào|bảo|thốt|hét|gật|lắc|mỉm|cười|khóc|nghĩ|cảm thấy|quyết định|ngước|cúi|quay|bước|đứng|ngồi|nhìn|ôm|nắm|siết|đưa|run|đỏ mặt|im lặng|khẽ|bật|tựa|vòng|gục|nhắm|mở|thở|chớp|cắn|mím|lẩm bẩm|nức nở|thút thít|vội|chạy|kéo|đẩy|hôn|gọi|reo|ngập ngừng)';
  const head = new RegExp('^\\s*(?:\\[\\s*' + esc(name) + '\\s*\\]|' + esc(name) + ')\\s*[:：]', 'iu');
  const act = new RegExp('^\\s*\\*+\\s*' + esc(name) + '(?![\\p{L}])', 'iu');
  const nar = new RegExp('^\\s*[\\*_\\[]*\\s*(?:' + names + ')(?![\\p{L}])\\s*[\\*_\\]]*\\s*' + VERB, 'iu');
  const inline = new RegExp('(?:' + names + ')\\s+(?:nói|đáp|trả lời|hỏi|thì thầm|thì thào|bảo|thốt|hét|lẩm bẩm)[^"“”\\n]{0,25}[:,]?\\s*["“][^"”\\n]*["”]', 'giu');
  text = text.replace(inline, '').replace(/[ \t]{2,}/g, ' ');
  const lines = text.split('\n'), bad = lines.map(l => head.test(l) || act.test(l) || nar.test(l)), first = bad.indexOf(true);
  if (first === -1) return text;
  const before = lines.slice(0, first).join('\n').trim();
  const out = before || lines.filter((l, i) => !bad[i]).join('\n').trim();
  return out || text;
}
// ===================== CHẾ ĐỘ TRÒ CHUYỆN =====================
    function updateModeBanner() {
      const el = document.getElementById('mode-banner');
      if (!el) return;
      const sid = window.state.activeStoryId;
      const am = (window.state.activeMode || {})[sid];
      const story = window.state.stories.find(s => s.id === sid);
      const ch = am && story && story.characters ? story.characters.find(c => c.id === am.charId) : null;
      if (!am || !ch || !MODES[am.mode]) { el.classList.add('hidden'); el.innerHTML = ''; return; }
      el.innerHTML = `<span>${MODES[am.mode].icon} ${MODES[am.mode].name} · ${escapeHtml(ch.name)}</span><button class="action-text-btn" onclick="endChatMode()">Tắt</button>`;
      el.classList.remove('hidden');
    }

    function openModeModal() {
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      if (!story || !story.characters || story.characters.length === 0) return alert('Truyện chưa có nhân vật nào!');
      const am = (window.state.activeMode || {})[story.id];
      const un = window.state.unlockedModes || {};
      let html = '';
      if (am && MODES[am.mode]) html += `<div class="status-badge">Đang bật: ${MODES[am.mode].icon} ${MODES[am.mode].name} <button class="action-text-btn" onclick="endChatMode()">Tắt chế độ</button></div>`;
      story.characters.forEach(c => {
        const btns = Object.keys(MODES).map(k => {
          const m = MODES[k];
          if (un[c.id] && un[c.id][k]) return `<button class="btn btn-pink" style="padding:6px 10px;" onclick="startChatMode('${c.id}','${k}')">${m.icon} ${m.name}</button>`;
          return `<span style="font-size:0.75rem;color:#a0aec0;border:1px dashed #cbd5e0;border-radius:12px;padding:5px 8px;">🔒 ${m.name}</span>`;
        }).join('');
        html += `<div style="border:1px solid var(--app-green);border-radius:12px;padding:8px;display:flex;flex-direction:column;gap:6px;"><b>${escapeHtml(c.name)}</b><div style="display:flex;flex-wrap:wrap;gap:6px;">${btns}</div></div>`;
      });
      html += '<div style="font-size:0.75rem;color:#718096;">Mở khóa chế độ bằng cách hoàn thành nhiệm vụ ở tab Cuộc Sống → Nhiệm Vụ.</div>';
      document.getElementById('mode-modal-body').innerHTML = html;
      openModal('modal-mode');
    }

    function startChatMode(charId, mode) {
      const sid = window.state.activeStoryId;
      const story = window.state.stories.find(s => s.id === sid);
      const ch = story && story.characters ? story.characters.find(c => c.id === charId) : null;
      if (!ch || !MODES[mode]) return;
      if (!window.state.activeMode) window.state.activeMode = {};
      window.state.activeMode[sid] = { charId, mode };
      window.state.chatHistories[sid].push({ sender: 'system', text: `${MODES[mode].icon} Bắt đầu chế độ "${MODES[mode].name}" với ${ch.name}.`, event: true, ts: Date.now() });
      saveStorage();
      closeModal('modal-mode');
      switchStoryTab('chat');
      renderChatHistory();
      sendMessage(`Hãy mở đầu chế độ "${MODES[mode].name}" bằng lời thoại và hành động tự nhiên của "${ch.name}".`, false, true);
    }

    function endChatMode() {
      const sid = window.state.activeStoryId;
      const am = (window.state.activeMode || {})[sid];
      if (!am) return;
      const story = window.state.stories.find(s => s.id === sid);
      const ch = story && story.characters ? story.characters.find(c => c.id === am.charId) : null;
      delete window.state.activeMode[sid];
      window.state.chatHistories[sid].push({ sender: 'system', text: `Kết thúc chế độ "${MODES[am.mode] ? MODES[am.mode].name : ''}"${ch ? ' với ' + ch.name : ''}.`, event: true, ts: Date.now() });
      saveStorage();
      closeModal('modal-mode');
      renderChatHistory();
    }

    // ===================== SỰ KIỆN NGẪU NHIÊN =====================
    let eventBusy = false;

    // Quà thưởng sự kiện: chia theo tỷ lệ độ hiếm
    function pickRewardByRarity() {
      const pool = SHOP_CATALOG.filter(i => i.cat !== 'estate');
      const tiers = [
        { max: 300000, w: 60 },
        { max: 3000000, w: 25 },
        { max: 50000000, w: 10 },
        { max: 1000000000, w: 4 },
        { max: Infinity, w: 1 }
      ];
      let r = Math.random() * 100, acc = 0, ti = 0;
      for (let k = 0; k < tiers.length; k++) { acc += tiers[k].w; if (r < acc) { ti = k; break; } }
      const min = ti > 0 ? tiers[ti - 1].max : 0;
      let cand = pool.filter(i => i.price > min && i.price <= tiers[ti].max);
      if (cand.length === 0) cand = pool.filter(i => i.price <= 300000);
      return cand[Math.floor(Math.random() * cand.length)];
    }

    // ⚡ SỰ KIỆN NGẪU NHIÊN: tự nhớ truyện + nhân vật, tạo sự kiện đúng lịch sử chat và thân phận nhân vật
    const STORY_EVENT_MIN_MSGS = 4;

    // Chọn nhân vật đang "có mặt" trong mạch chat gần nhất (ai vừa nói nhiều/gần đây thì dễ được chọn hơn)
    function eventPickCharacter(chars, history) {
      const recent = history.slice(-14);
      const weight = new Map(chars.map(c => [c.id, 1]));
      recent.forEach((m, i) => {
        if (!m || m.sender !== 'ai') return;
        const rec = 1 + (i / Math.max(1, recent.length - 1)) * 4;
        const txt = String(m.text || '').toLowerCase();
        chars.forEach(c => {
          if (c.name && txt.includes('[' + c.name.toLowerCase() + ']')) weight.set(c.id, weight.get(c.id) + rec);
        });
      });
      let total = 0; chars.forEach(c => { total += weight.get(c.id); });
      let r = Math.random() * total;
      for (const c of chars) { r -= weight.get(c.id); if (r <= 0) return c; }
      return chars[chars.length - 1];
    }

    async function maybeTriggerRandomEvent() {
      if (eventBusy) return;
      if (Math.random() > 0.3) return;
      if (!(window.state.apiKeys || []).length) return;

      const storyId = window.state.activeStoryId;
      const story = window.state.stories ? window.state.stories.find(s => s.id === storyId) : null;
      const chars = (story && story.characters) ? story.characters.filter(c => c && c.name) : [];
      if (!story || chars.length === 0) return;

      // Lịch sử thật (có ts), bỏ cảnh mở đầu; chưa đủ chat thì chưa đủ cơ sở để tạo sự kiện đúng mạch
      const fullHistory = ((window.state.chatHistories && window.state.chatHistories[storyId]) || []).filter(m => m && (m.ts || m.event));
      const realMsgs = fullHistory.filter(m => m.sender === 'user' || m.sender === 'ai');
      if (realMsgs.length < STORY_EVENT_MIN_MSGS) return;

      eventBusy = true;
      try {
        const activeChar = eventPickCharacter(chars, fullHistory);
        const charId = activeChar.id;
        const charName = activeChar.name;
        const persona = window.state.persona || {};
        const userName = persona.name ? persona.name : 'Bạn';
        const cut = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

        // Diễn biến gần nhất (30 tin cuối) - tin AI vốn đã có dạng [Tên nhân vật]: ...
        const recentHistory = fullHistory.slice(-30).map(m => {
          const t = cut(cleanAiTags(m.text), 420);
          if (!t) return '';
          if (m.sender === 'user') return `${userName}: ${t}`;
          if (m.sender === 'ai') return t;
          if (m.sender === 'system' && m.event) return `[Sự kiện] ${t}`;
          return '';
        }).filter(Boolean).join('\n');

        // Sự kiện đã diễn ra trước đó của truyện này (để không lặp và nối tiếp hậu quả)
        const pastEvents = (story.eventLog || []).slice(-6).map(e => `- ${cut(e.desc, 220)} → ${cut(e.result || e.choice, 160)}`).join('\n');
        const petMemEvents = ((window.state.petMemories || {})[charId] || []).slice(-4).map(m => `- ${cut(m.text, 200)}`).join('\n');

        const aff = (window.state.affectionLevels && window.state.affectionLevels[charId]) || { level: 1, points: 0 };
        let living = '';
        if (activeChar.livesWith) living = `${charName} đang SỐNG CHUNG NHÀ với ${userName}.`;
        else if (activeChar.movedOut) living = `${charName} từng ở chung nhưng đã dọn đi, hiện sống riêng.`;

        const others = chars.filter(c => c.id !== charId).slice(0, 6).map(c => `- ${c.name}: ${cut(c.personality, 150)}`).join('\n') || '(không có)';
        const randomRewardItem = pickRewardByRarity();

        const prompt = `Bạn là Trợ lý Hệ thống của game nhập vai. Hãy tạo MỘT sự kiện nhỏ nảy sinh TỰ NHIÊN từ chính câu chuyện đang diễn ra, xoay quanh nhân vật "${charName}" và người chơi "${userName}".

[HỒ SƠ TRUYỆN - ĐÃ THIẾT LẬP, PHẢI NHỚ]
Bối cảnh: ${cut(story.setting, 900) || '(không có)'}
Cảnh mở đầu: ${cut(story.openingScene, 600) || '(không có)'}

[NHÂN VẬT CHÍNH CỦA SỰ KIỆN]
Tên: ${charName}
Thân phận / tính cách / cách nói chuyện: ${cut(activeChar.personality, 900) || '(chưa mô tả)'}
Lời mở đầu đặc trưng: ${cut(activeChar.firstMsg, 300) || '(không có)'}
Độ thân mật với người chơi: Lv.${aff.level} (Lv càng thấp thì nhân vật càng giữ ý, giữ khoảng cách; Lv cao thì gần gũi, quan tâm hơn).
${living}

[NGƯỜI CHƠI]
${userName}${persona.memories ? ': ' + cut(persona.memories, 400) : ''}
${petMemEvents ? `\n[KÝ ỨC THÚ CƯNG CỦA ${charName} - SỰ THẬT ĐÃ XẢY RA]\n${petMemEvents}\n` : ''}

[CÁC NHÂN VẬT KHÁC TRONG TRUYỆN]
${others}

[SỰ KIỆN ĐÃ XẢY RA TRƯỚC ĐÂY - KHÔNG LẶP LẠI Ý TƯỞNG, CÓ THỂ NỐI TIẾP HẬU QUẢ]
${pastEvents || '(chưa có)'}

[DIỄN BIẾN CHAT GẦN NHẤT - ĐÂY LÀ NHỮNG GÌ ĐÃ THẬT SỰ XẢY RA]
${recentHistory}

[QUY TẮC BẮT BUỘC]
1. Sự kiện phải tiếp nối ĐÚNG địa điểm, thời điểm, tâm trạng và chủ đề của đoạn chat cuối cùng; nảy ra từ chi tiết đã có trong hồ sơ hoặc lịch sử chat, không đột ngột sang bối cảnh khác.
2. Hành động, nghề nghiệp, khả năng, địa vị, xưng hô của ${charName} phải khớp thân phận và tính cách đã mô tả; không làm điều trái thân phận (người túng thiếu không thể tặng món quá đắt, người lạnh lùng không đột nhiên sến súa...).
3. Chỉ dùng nhân vật đã có trong truyện, hoặc người qua đường thoáng qua (người bán hàng, hàng xóm, shipper...). Không bịa quan hệ/quá khứ chưa từng xuất hiện.
4. Tuyệt đối KHÔNG tạo biến cố lớn không thể đảo ngược (mang thai, có con, kết hôn, qua đời, mất trí nhớ, chia tay hẳn, tai nạn nặng, tiết lộ bí mật lớn của cốt truyện).
5. Phần "desc" chỉ tả tình huống và hành động/lời nói của nhân vật rồi dừng lại để người chơi chọn; KHÔNG viết thay lời nói, hành động hay suy nghĩ của ${userName}.
6. Lựa chọn 1: hợp tác/ngọt ngào/xử lý khéo (thưởng tiền ${(5000000).toLocaleString('vi-VN')} đến ${(60000000).toLocaleString('vi-VN')}, có thể tặng vật phẩm, tăng thân mật 1-10). Lựa chọn 2: phũ phàng/né tránh/trêu chọc/ích kỷ nhưng vẫn hợp lý với tình huống (trừ tiền ${(2000000).toLocaleString('vi-VN')} đến ${(20000000).toLocaleString('vi-VN')}, giảm thân mật 1-10). Nội dung lựa chọn viết ở ngôi người chơi, ngắn gọn dưới 120 ký tự.
7. "desc" tối đa 350 ký tự và phải có tên ${charName} và ${userName}; "log" tối đa 200 ký tự, mô tả kết quả hợp lý của lựa chọn đó.

Trả về ĐÚNG JSON thuần, không markdown:
{
  "desc": "...",
  "choice1": { "text": "...", "moneyChange": 20000000, "affectionChange": 5, "getItem": true, "log": "..." },
  "choice2": { "text": "...", "moneyChange": 5000000, "affectionChange": 5, "getItem": false, "log": "..." }
}`;

        let eventData = null;
        const model = (window.state.currentModel || 'gemini-2.5-flash').trim().replace(/^models\//, '');

        for (const rawKey of window.state.apiKeys || []) {
          const key = rawKey.trim().replace(/^["']|["']$/g, '');
          try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
              body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9, responseMimeType: 'application/json' } })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
              let rawText = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
              rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
              const start = rawText.indexOf('{');
              const end = rawText.lastIndexOf('}');
              if (start !== -1 && end !== -1) {
                eventData = JSON.parse(rawText.substring(start, end + 1));
                break;
              }
            }
          } catch (e) {}
        }

        if (eventData && eventData.desc && eventData.choice1 && eventData.choice2) {
          // ÉP GIỚI HẠN số liệu do AI sinh ra
          const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.abs(parseInt(v, 10) || 0)));
          const c1 = {
            text: eventData.choice1.text,
            log: eventData.choice1.log,
            moneyChange: clampN(eventData.choice1.moneyChange, 0, 60000000),
            affectionChange: clampN(eventData.choice1.affectionChange || 1, 1, 10),
            getItem: !!eventData.choice1.getItem
          };
          const c2 = {
            text: eventData.choice2.text,
            log: eventData.choice2.log,
            moneyChange: -clampN(eventData.choice2.moneyChange, 0, 20000000),
            affectionChange: -clampN(eventData.choice2.affectionChange || 1, 1, 10),
            getItem: false
          };

          const dynamicEvent = {
            desc: eventData.desc,
            choices: [
              { text: c1.text, action: () => executeEventChoice(charId, charName, eventData.desc, c1, randomRewardItem) },
              { text: c2.text, action: () => executeEventChoice(charId, charName, eventData.desc, c2, null) }
            ]
          };
          triggerEventModal(dynamicEvent);
        }
      } finally {
        eventBusy = false;
      }
    }

    function executeEventChoice(charId, charName, eventDesc, choiceObj, rewardItem) {
      if (choiceObj.moneyChange) {
        window.state.walletBalance = Math.max(0, (window.state.walletBalance || 0) + choiceObj.moneyChange);
      }

      if (choiceObj.affectionChange) {
        addAffectionPoints(charId, choiceObj.affectionChange);
      }

      if (choiceObj.getItem && rewardItem) {
        if (!window.state.inventory) window.state.inventory = [];
        window.state.inventory.push({
          id: rewardItem.id,
          name: `${rewardItem.name} (x1)`,
          singleName: rewardItem.name,
          qty: 1,
          tag: rewardItem.tag,
          desc: rewardItem.desc,
          uniqueId: 'inv-' + Date.now() + Math.random()
        });
      }

      // Ghi nhớ sự kiện vào truyện để lần sau không lặp và nối tiếp hậu quả
      try {
        const st = window.state.stories.find(x => x.id === window.state.activeStoryId);
        if (st) { st.eventLog = (st.eventLog || []).concat({ ts: Date.now(), charId, charName, desc: eventDesc, choice: choiceObj.text, result: choiceObj.log || '' }).slice(-8); }
      } catch (e) {}
      saveStorage();
      if (typeof renderLifeModeUI === 'function') renderLifeModeUI();

      const statBits = [];
      if (choiceObj.moneyChange) statBits.push(`💵 ${choiceObj.moneyChange >= 0 ? '+' : ''}${choiceObj.moneyChange.toLocaleString('vi-VN')}đ`);
      if (choiceObj.affectionChange) statBits.push(`❤️ ${choiceObj.affectionChange >= 0 ? '+' : ''}${choiceObj.affectionChange} thân mật`);
      if (choiceObj.getItem && rewardItem) statBits.push(`🎁 ${rewardItem.name}`);

      handleEventAndChat(charName, eventDesc, choiceObj.text, choiceObj.log, statBits);
    }

    function handleEventAndChat(charName, eventContext, playerChoice, playerResult, statBits) {
      if (typeof switchStoryTab === 'function') {
        switchStoryTab('chat');
      }

      // Kể lại sự kiện như một đoạn truyện liền mạch, không nhãn [SỰ KIỆN] / "lựa chọn:"
      const prose = cleanAiTags([eventContext, playerChoice, playerResult]
        .map(t => String(t || '').trim())
        .filter(Boolean)
        .reduce((acc, t) => !acc ? t : acc + (/[.!?…"”’]$/.test(acc) ? ' ' : '. ') + t, '')
        .replace(/\s+([.,!?…])/g, '$1'));
      const statLine = (statBits || []).filter(Boolean).join(' · ');
      // noClean: phần truyện đã lọc sẵn, chỉ phần thưởng được giữ nguyên (+N thân mật...)
      const chatNarrativeText = statLine ? `${prose} (${statLine})` : prose;
      
      const storyId = window.state.activeStoryId;
      if (!window.state.chatHistories[storyId]) {
        window.state.chatHistories[storyId] = [];
      }

      // event:true => tin hệ thống này được gửi cho AI đọc
      window.state.chatHistories[storyId].push({ sender: 'system', text: chatNarrativeText, event: true, noClean: !!statLine, ts: Date.now() });
      saveStorage();
      renderChatHistory();

      const hiddenAiPrompt = `Hãy ngay lập tức nhập vai nhân vật "${charName}" để gửi lời thoại và hành động phản ứng trực tiếp với sự kiện vừa xảy ra ở trên và lựa chọn của người chơi. Bám sát tính cách nhân vật, thể hiện cảm xúc rõ ràng tùy theo kết quả lựa chọn!`;

      sendMessage(hiddenAiPrompt, false, true);
    }

    function triggerEventModal(eventObj) {
      document.getElementById('revent-desc').innerText = eventObj.desc;
      const bContainer = document.getElementById('revent-btns');
      bContainer.innerHTML = '';

      eventObj.choices.forEach(ch => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-pink';
        btn.style.width = '100%';
        btn.style.padding = '10px 14px';
        btn.style.whiteSpace = 'normal';
        btn.style.wordBreak = 'break-word';
        btn.style.textAlign = 'left';
        btn.style.lineHeight = '1.4';
        btn.innerText = ch.text;
        
        btn.onclick = () => { 
          closeModal('modal-random-event'); 
          ch.action(); 
          saveStorage(); 
          renderLifeModeUI(); 
        };
        bContainer.appendChild(btn);
      });

      openModal('modal-random-event');
    }

    function togglePlusMenu() {
      const menu = document.getElementById('plus-menu');
      const overlay = document.getElementById('plus-menu-overlay');
      const isActive = menu.classList.contains('active');
      if (isActive) { menu.classList.remove('active'); overlay.classList.remove('active'); }
      else { menu.classList.add('active'); overlay.classList.add('active'); }
    }

    function handlePlusAction(action) {
      togglePlusMenu();
      if (action === 'mode') {
        openModeModal();
      } else if (action === 'transfer') {
        openTransferModal();
      } else if (action === 'gift') {
        openGiftModal();
      } else if (action === 'image') {
        document.getElementById('chat-img-upload-input').click();
      } else if (action === 'voice') {
        sendMessage('[Đang gửi tin nhắn thoại voice]');
      } else if (action === 'redo') {
        if (confirm('Bạn có chắc muốn reset lại toàn bộ cuộc trò chuyện về từ đầu không?')) {
          const storyId = window.state.activeStoryId;
          const story = window.state.stories.find(s => s.id === storyId);
          window.state.chatHistories[storyId] = [];
          if (story) {
            if (story.openingScene) window.state.chatHistories[storyId].push({ sender: 'system', text: story.openingScene });
            else if (story.characters && story.characters[0] && story.characters[0].firstMsg) window.state.chatHistories[storyId].push({ sender: 'ai', text: story.characters[0].firstMsg });
          }
          saveStorage();
          renderChatHistory();
        }
      }
    }

    function openTransferModal() {
      document.getElementById('wallet-balance-display').innerText = (window.state.walletBalance || 0).toLocaleString('vi-VN') + ' VNĐ';
      
      const selectEl = document.getElementById('transfer-target-char');
      const lblEl = document.getElementById('lbl-transfer-char');
      
      lblEl.innerText = 'Chọn Nhân Vật Nhận Tiền:';
      selectEl.innerHTML = '<option value="system">-- Chuyển chung / Không chỉ định nhân vật --</option>';
      
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      if (story && story.characters) {
        story.characters.forEach(char => {
          const opt = document.createElement('option');
          opt.value = char.name;
          opt.innerText = `Chuyển cho: ${char.name}`;
          selectEl.appendChild(opt);
        });
      }

      const dirSelect = document.getElementById('transfer-direction');
      if (dirSelect && dirSelect.parentNode) {
        dirSelect.parentNode.style.display = 'none';
      }

      openModal('modal-transfer');
    }

    function updateTransferUI() {}

    function executeTransfer() {
      const amt = parseInt(document.getElementById('transfer-amount').value, 10);
      const note = document.getElementById('transfer-note').value.trim() || 'Chuyển khoản';
      const targetChar = document.getElementById('transfer-target-char').value;

      if (isNaN(amt) || amt <= 0) return alert('Nhập số tiền hợp lệ!');

      if (amt > (window.state.walletBalance || 0)) {
        return alert('Số dư ví của bạn không đủ!');
      }

      window.state.walletBalance -= amt;
      saveStorage();
      closeModal('modal-transfer');
      switchStoryTab('chat');

      const userTransferTag = `[USER_TRANSFER: ${amt} | ${note} | ${targetChar === 'system' ? 'Hệ thống' : targetChar}]`;
      sendMessage(userTransferTag);
    }

    function openGiftModal() {
      const container = document.getElementById('gift-modal-items');
      container.innerHTML = '';
      const inv = window.state.inventory || [];
      if (inv.length === 0) { container.innerHTML = '<div style="font-size:0.85rem; color:#888; text-align:center; padding: 15px;">Túi đồ trống! Hãy vào tab Cuộc Sống mua quà.</div>'; openModal('modal-gift'); return; }

      inv.forEach((item) => {
        const row = document.createElement('div');
        row.style.background = '#f7faf8'; row.style.border = '1px solid #d0ebd8'; row.style.padding = '10px'; row.style.borderRadius = '12px'; row.style.display = 'flex'; row.style.justifyContent = 'space-between'; row.style.alignItems = 'center';
        row.innerHTML = `
          <div>
            <div style="font-weight: bold; font-size: 0.9rem;">${item.name}</div>
            <div style="font-size: 0.75rem; color: #666; font-style: italic;">${item.desc}</div>
          </div>
          <button class="btn btn-pink" style="padding: 4px 10px; font-size: 0.75rem;" onclick="openTargetCharForGift('${item.uniqueId}')">Chọn Quà</button>
        `;
        container.appendChild(row);
      });
      openModal('modal-gift');
    }

    function openTargetCharForGift(uniqueId) {
      pendingGiftUniqueId = uniqueId;
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      if (!story || !story.characters || story.characters.length === 0) return alert('Truyện chưa có nhân vật nào!');
      renderGiftTargets();
      closeModal('modal-gift');
      openModal('modal-select-char-gift');
    }

    function insertInputFormat(type) {
      const input = document.getElementById('user-input');
      const val = input.value;
      const pos = input.selectionStart || val.length;
      let ins = '';
      if (type === 'dialogue') ins = '""';
      else if (type === 'action') ins = '**';

      input.value = val.slice(0, pos) + ins + val.slice(pos);
      input.focus();
      input.setSelectionRange(pos + 1, pos + 1);
    }

    function handleChatImageFile(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        const original = e.target.result;
        const msgText = `[Gửi một hình ảnh trực quan từ điện thoại]`;
        // Thu nhỏ ảnh (tối đa 900px, JPEG 70%) để không làm đầy bộ nhớ lưu chat
        const im = new Image();
        im.onload = function() {
          let out = original;
          try {
            const ratio = Math.min(1, 900 / Math.max(im.width, im.height));
            const w = Math.max(1, Math.round(im.width * ratio)), h = Math.max(1, Math.round(im.height * ratio));
            const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
            const cx = cv.getContext('2d'); cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, w, h); cx.drawImage(im, 0, 0, w, h);
            out = cv.toDataURL('image/jpeg', 0.7);
          } catch (err) {}
          sendMessage(msgText, false, false, out);
        };
        im.onerror = function() { sendMessage(msgText, false, false, original); };
        im.src = original;
      };
      reader.readAsDataURL(file); event.target.value = '';
    }

    function handleImageUpload(event, targetInputId) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const target = document.getElementById(targetInputId);
          const original = e.target.result;
          const img = new Image();
          img.onload = function() {
            try {
              const max = 512; const ratio = Math.min(1, max / Math.max(img.width, img.height));
              const w = Math.max(1, Math.round(img.width * ratio)); const h = Math.max(1, Math.round(img.height * ratio));
              const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
              const ctx = canvas.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
              target.value = canvas.toDataURL('image/jpeg', 0.88);
            } catch (err) { target.value = original; }
          };
          img.src = original;
        };
        reader.readAsDataURL(file);
      }
    }

    function renderStoryList() {
      const container = document.getElementById('story-list');
      container.innerHTML = '';
      (window.state.stories || []).forEach(story => {
        const card = document.createElement('div');
        card.className = 'scenario-card';
        card.innerHTML = `
          <div>
            <div class="scenario-header">
              <img src="${story.avatar || DEFAULT_LOGO}" class="scenario-avatar" onerror="this.src='${DEFAULT_LOGO}'">
              <h3>${escapeHtml(story.title)}</h3>
            </div>
            <p class="scenario-desc">${escapeHtml(story.setting || 'Chưa có bối cảnh')}</p>
            <div style="font-size:0.8rem; color:var(--app-dark-green); font-weight:bold;">🎭 ${story.characters ? story.characters.length : 0} Nhân vật</div>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 10px;">
            <button class="btn" style="flex:1;" onclick="openStoryDetail('${story.id}')">💬 Trò Chuyện</button>
            <button class="btn btn-outline" onclick="deleteStory('${story.id}')">Xóa</button>
          </div>
        `;
        container.appendChild(card);
      });
    }

    function createNewStory() {
      const title = document.getElementById('new-story-title').value.trim();
      const avatar = document.getElementById('new-story-avatar').value.trim();
      const setting = document.getElementById('new-story-desc').value.trim();
      const openingScene = document.getElementById('new-story-opening').value.trim();
      if (!title) return alert('Nhập tên truyện!');
      const newStory = { 
        id: 'story-' + Date.now(), 
        title, 
        avatar: avatar || DEFAULT_LOGO, 
        setting, 
        openingScene, 
        characters: [],
        theme: {
          userBg: '#c1ebd9', userText: '#1b4332',
          aiBg: '#ffffff', aiText: '#333333',
          chatBgColor: '#e7f5ee', chatBgImg: ''
        }
      };
      if (!window.state.stories) window.state.stories = [];
      window.state.stories.push(newStory);
      saveStorage(); renderStoryList(); closeModal('modal-story');
      openStoryDetail(newStory.id);
    }

    function deleteStory(id) {
      if (confirm('Xóa truyện này?')) {
        window.state.stories = window.state.stories.filter(s => s.id !== id);
        if (window.state.chatHistories) delete window.state.chatHistories[id];
        saveStorage(); renderStoryList();
      }
    }

    function openStoryDetail(storyId) {
      const story = window.state.stories.find(s => s.id === storyId);
      if (!story) return;
      
      window.state.activeStoryId = storyId;
      document.getElementById('active-story-title').innerText = story.title || 'Trò Chuyện';

      if (!story.theme) {
        story.theme = { userBg: '#c1ebd9', userText: '#1b4332', aiBg: '#ffffff', aiText: '#333333', chatBgColor: '#e7f5ee', chatBgImg: '' };
      }

      if (!window.state.chatHistories[storyId]) {
        window.state.chatHistories[storyId] = [];
        if (story.openingScene) window.state.chatHistories[storyId].push({ sender: 'system', text: story.openingScene });
        else if (story.characters && story.characters[0] && story.characters[0].firstMsg) window.state.chatHistories[storyId].push({ sender: 'ai', text: story.characters[0].firstMsg });
      }

      switchPage('page-story-detail');
      applyActiveStoryTheme();
      renderChatHistory();
      switchStoryTab('chat');
    }

    // ===== Giao diện từng truyện: CHỈ áp lên trang chat bên trong, không đổi giao diện bên ngoài =====
    const STORY_THEME_VARS = ['--user-bubble-bg', '--user-text-color', '--ai-bubble-bg', '--ai-text-color', '--bg-color', '--chat-bg-image'];
    // Bộ màu mặc định cũ = "theo giao diện chung" (tự đổi theo pastel / chế độ sáng-tối của app)
    function isDefaultStoryTheme(t) {
      const lo = (v) => String(v || '').trim().toLowerCase();
      return lo(t.userBg) === '#c1ebd9' && lo(t.userText) === '#1b4332' && lo(t.aiBg) === '#ffffff' &&
        lo(t.aiText) === '#333333' && lo(t.chatBgColor) === '#e7f5ee' && !String(t.chatBgImg || '').trim();
    }

    function applyActiveStoryTheme() {
      // Bản cũ từng gắn biến lên <html> làm đổi cả app: dọn sạch để không còn dính ra ngoài
      const root = document.documentElement;
      STORY_THEME_VARS.forEach(p => root.style.removeProperty(p));

      const page = document.getElementById('page-story-detail');
      if (!page) return;
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      const t = story && story.theme;
      if (!t || isDefaultStoryTheme(t)) { STORY_THEME_VARS.forEach(p => page.style.removeProperty(p)); return; }

      page.style.setProperty('--user-bubble-bg', t.userBg || '#c1ebd9');
      page.style.setProperty('--user-text-color', t.userText || '#1b4332');
      page.style.setProperty('--ai-bubble-bg', t.aiBg || '#ffffff');
      page.style.setProperty('--ai-text-color', t.aiText || '#333333');
      page.style.setProperty('--bg-color', t.chatBgColor || '#e7f5ee');
      page.style.setProperty('--chat-bg-image', t.chatBgImg ? `url('${t.chatBgImg}')` : 'none');
    }

    function applyThemeTemplate(type) {
      let t = {};
      if (type === 'mint') {
        t = { userBg: '#c1ebd9', userText: '#1b4332', aiBg: '#ffffff', aiText: '#333333', chatBgColor: '#e7f5ee', chatBgImg: '' };
      } else if (type === 'pink') {
        t = { userBg: '#ffd1dc', userText: '#5a2a27', aiBg: '#ffffff', aiText: '#444444', chatBgColor: '#fff0f3', chatBgImg: '' };
      } else if (type === 'dark') {
        t = { userBg: '#2d3748', userText: '#edf2f7', aiBg: '#1a202c', aiText: '#e2e8f0', chatBgColor: '#0f172a', chatBgImg: '' };
      } else if (type === 'minimal') {
        t = { userBg: '#f1f5f9', userText: '#0f172a', aiBg: '#ffffff', aiText: '#334155', chatBgColor: '#f8fafc', chatBgImg: '' };
      }
      document.getElementById('cfg-user-bg').value = t.userBg;
      document.getElementById('cfg-user-text').value = t.userText;
      document.getElementById('cfg-ai-bg').value = t.aiBg;
      document.getElementById('cfg-ai-text').value = t.aiText;
      document.getElementById('cfg-chat-bg-color').value = t.chatBgColor;
      document.getElementById('cfg-chat-bg-img').value = t.chatBgImg;
    }

    function openStoryConfigModal() {
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      if (!story) return;
      document.getElementById('story-setting-input').value = story.setting || '';
      document.getElementById('story-opening-input').value = story.openingScene || '';
      
      if (story.theme) {
        document.getElementById('cfg-user-bg').value = story.theme.userBg || '#c1ebd9';
        document.getElementById('cfg-user-text').value = story.theme.userText || '#1b4332';
        document.getElementById('cfg-ai-bg').value = story.theme.aiBg || '#ffffff';
        document.getElementById('cfg-ai-text').value = story.theme.aiText || '#333333';
        document.getElementById('cfg-chat-bg-color').value = story.theme.chatBgColor || '#e7f5ee';
        document.getElementById('cfg-chat-bg-img').value = story.theme.chatBgImg || '';
      }

      switchConfigTab('story');
      openModal('modal-story-config');
    }

    function saveStorySettings() {
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      if (story) {
        story.setting = document.getElementById('story-setting-input').value.trim();
        story.openingScene = document.getElementById('story-opening-input').value.trim();
        
        if (!story.theme) story.theme = {};
        story.theme.userBg = document.getElementById('cfg-user-bg').value;
        story.theme.userText = document.getElementById('cfg-user-text').value;
        story.theme.aiBg = document.getElementById('cfg-ai-bg').value;
        story.theme.aiText = document.getElementById('cfg-ai-text').value;
        story.theme.chatBgColor = document.getElementById('cfg-chat-bg-color').value.trim() || '#e7f5ee';
        story.theme.chatBgImg = document.getElementById('cfg-chat-bg-img').value.trim();
        story.updatedAt = Date.now(); // để lúc gộp máy ↔ cloud biết bản truyện nào mới hơn

        saveStorage();
        applyActiveStoryTheme();
        closeModal('modal-story-config');
        alert('Đã lưu cài đặt truyện thành công!');
      }
    }

    function renderCharacterList() {
      const container = document.getElementById('character-list-container');
      container.innerHTML = '';
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      if (!story || !story.characters || story.characters.length === 0) {
        container.innerHTML = '<div style="font-size:0.85rem; color:#888; text-align:center; padding: 15px;">Chưa có nhân vật nào trong truyện này.</div>';
        return;
      }
      story.characters.forEach(char => {
        if (!window.state.affectionLevels) window.state.affectionLevels = {};
        const affData = window.state.affectionLevels[char.id] || { level: 1, points: 0 };

        const div = document.createElement('div');
        div.className = 'char-card';
        div.innerHTML = `
          <div class="char-header">
            <img src="${char.avatar || DEFAULT_LOGO}" class="char-avatar-mini" onerror="this.src='${DEFAULT_LOGO}'">
            <div class="char-info-body">
              <h4>${escapeHtml(char.name)}${char.livesWith ? ' 🏠' : ''} <span style="font-size:0.7rem; color:#319795;">❤️ Lv.${affData.level} (${affData.points}/${affectionNeeded(affData.level)}pts)</span></h4>
              <p>${escapeHtml(char.personality)}</p>
            </div>
          </div>
          <div style="display:flex; gap:4px; flex-shrink:0;">
            <button class="btn btn-outline" style="font-size:0.7rem; padding: 2px 6px;${char.livesWith ? ' border-color:#d53f8c; color:#d53f8c;' : ''}" onclick="toggleCohabit('${char.id}')">${char.livesWith ? '🚪 Dọn đi' : '🏠 Dọn vô ở'}</button>
            <button class="btn btn-outline" style="font-size:0.7rem; padding: 2px 6px;" onclick="openEditCharModal('${char.id}')">✏️ Sửa</button>
            <button class="btn btn-outline" style="font-size:0.7rem; padding: 2px 6px; border-color:#f44336; color:#f44336;" onclick="deleteCharacter('${char.id}')">✖</button>
          </div>
        `;
        container.appendChild(div);
      });
    }

    function openAddCharModal() {
      document.getElementById('char-modal-title').innerText = '🎭 Thêm Nhân Vật';
      document.getElementById('char-edit-id').value = '';
      document.getElementById('char-name').value = ''; document.getElementById('char-avatar').value = '';
      document.getElementById('char-personality').value = ''; document.getElementById('char-first-msg').value = '';
      openModal('modal-char');
    }

    function openEditCharModal(charId) {
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      const char = story ? story.characters.find(c => c.id === charId) : null;
      if (!char) return;
      document.getElementById('char-modal-title').innerText = '✏️ Sửa';
      document.getElementById('char-edit-id').value = char.id;
      document.getElementById('char-name').value = char.name; document.getElementById('char-avatar').value = char.avatar || '';
      document.getElementById('char-personality').value = char.personality || ''; document.getElementById('char-first-msg').value = char.firstMsg || '';
      openModal('modal-char');
    }

    function saveCharacter() {
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      if (!story) return;
      const charId = document.getElementById('char-edit-id').value;
      const name = document.getElementById('char-name').value.trim();
      const avatar = document.getElementById('char-avatar').value.trim();
      const personality = document.getElementById('char-personality').value.trim();
      const firstMsg = document.getElementById('char-first-msg').value.trim();
      if (!name) return alert('Nhập tên nhân vật!');

      if (charId) {
        const c = story.characters.find(x => x.id === charId);
        if (c) { c.name = name; c.avatar = avatar || DEFAULT_LOGO; c.personality = personality; c.firstMsg = firstMsg; }
      } else {
        if (!story.characters) story.characters = [];
        story.characters.push({ id: 'char-' + Date.now(), name, avatar: avatar || DEFAULT_LOGO, personality, firstMsg });
      }
      story.updatedAt = Date.now();
      saveStorage(); renderCharacterList(); closeModal('modal-char');
    }

    // Dọn nhân vật vào ở chung / dọn đi: lưu vào nhân vật (đồng bộ cloud) + ghi 1 sự kiện vào lịch sử để AI nhớ
    function toggleCohabit(charId) {
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      const ch = story && story.characters ? story.characters.find(c => c.id === charId) : null;
      if (!ch) return;
      const me = (window.state.persona && window.state.persona.name) || 'người chơi';
      const moveIn = !ch.livesWith;
      if (!confirm(moveIn ? `Cho ${ch.name} dọn vào ở chung nhà với ${me}?` : `Cho ${ch.name} dọn ra khỏi nhà?`)) return;
      ch.livesWith = moveIn;
      ch.movedOut = !moveIn;
      if (!window.state.chatHistories[story.id]) window.state.chatHistories[story.id] = [];
      window.state.chatHistories[story.id].push({ sender: 'system', event: true, text: moveIn ? `[${ch.name} đã dọn vào ở chung nhà với ${me}. Từ nay hai người sống chung một mái nhà.]` : `[${ch.name} đã dọn ra khỏi nhà của ${me} và sống riêng.]`, ts: Date.now() });
      saveStorage(); renderCharacterList();
      try { renderChatHistory(); } catch (e) {}
    }

    function deleteCharacter(charId) {
      if (confirm('Xóa nhân vật này?')) {
        const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
        if (story) { story.characters = story.characters.filter(c => c.id !== charId); saveStorage(); renderCharacterList(); }
      }
    }

    function renderChatHistory() {
      updateModeBanner();
      const container = document.getElementById('chat-history');
      container.innerHTML = '';
      const history = (window.state.chatHistories && window.state.chatHistories[window.state.activeStoryId]) || [];
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);

      history.forEach((msg, idx) => {
        if (msg.sender === 'system') {
          const div = document.createElement('div'); 
          div.className = 'narrative-block system-action'; 
          div.innerText = naturalizeEventText(msg.noClean ? String(msg.text || '') : cleanAiTags(msg.text)).replace(/[\[\]\*\"]/g, '').trim(); 
          container.appendChild(div);
        } else if (msg.sender === 'user') {
          renderUserFormattedMessage(msg.text, msg.img, container, idx, msg.ts);
        } else {
          parseAndRenderAiMessage(msg.text, story, container, idx, msg.transfers, msg.affection);
        }
      });
      
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 60);
    }

    // Thẻ chuyển tiền kiểu Momo / Zalo
    function buildTransferCardHtml(dir, amount, note, who, ts) {
      const incoming = dir === 'in';
      const t = ts ? new Date(ts).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '';
      return `
        <div class="mm-card">
          <div class="mm-head">
            <div class="mm-logo">₫</div>
            <div>
              <div class="mm-title">${incoming ? 'Nhận tiền thành công' : 'Chuyển tiền thành công'}</div>
              <div class="mm-sub">Ví Teechat</div>
            </div>
          </div>
          <div class="mm-body">
            <div class="mm-amount">${incoming ? '+' : '-'}${amount.toLocaleString('vi-VN')}đ</div>
            <div class="mm-row"><span>${incoming ? 'Từ' : 'Đến'}</span><b>${escapeHtml(who)}</b></div>
            <div class="mm-row"><span>Lời nhắn</span><b>${escapeHtml(note)}</b></div>
            ${t ? `<div class="mm-row"><span>Thời gian</span><b>${t}</b></div>` : ''}
            <div class="mm-status">✔ Giao dịch thành công</div>
          </div>
        </div>`;
    }

    // Thống nhất ngoặc: lời thoại dùng "..." ; trích dẫn/từ lóng bên trong dùng ‘...’. Nếu đã có "..." thì “ ” lọt vào bên trong được đổi thành ‘ ’
    function normQuotes(t) {
      t = t || '';
      if ((t.match(/"/g) || []).length >= 2) return t.replace(/“/g, '‘').replace(/”/g, '’');
      return t.replace(/[“”]/g, '"');
    }
    // Lời thoại bị lồng trong đoạn mô tả hành động: tách thành bong bóng lời thoại riêng
    function isSpeechQuote(t) { const w = t.trim().split(/\s+/).length; return (w >= 4 && /[.,!?…]/.test(t)) || w >= 9; }
    function expandSpeech(arr) {
      const out = [];
      arr.forEach(sg => {
        if (sg.type !== 'action' || sg.text.indexOf('"') < 0) { out.push(sg); return; }
        const re = /"([^"]+)"/g; let last = 0, m; const parts = [];
        while ((m = re.exec(sg.text)) !== null) {
          if (!isSpeechQuote(m[1])) continue;
          if (m.index > last) parts.push({ type: 'action', text: sg.text.slice(last, m.index).trim().replace(/[,:\s]+$/, '') });
          parts.push({ type: 'dialogue', text: m[1].trim() });
          last = m.index + m[0].length;
        }
        if (!parts.length) { out.push(sg); return; }
        if (last < sg.text.length) parts.push({ type: 'action', text: sg.text.slice(last).trim().replace(/^[,.\s]+/, '') });
        parts.filter(p => p.text).forEach(p => out.push(Object.assign({}, sg, p)));
      });
      arr.length = 0; out.forEach(x => arr.push(x));
    }
    // Từ chửi/từ lóng che bằng dấu * (đ**, c*c...) không được tính là dấu hành động
    function protectStars(t) {
      return (t || '').replace(/(?<=[\p{L}\d])\*{1,3}(?=[\p{L}\d])|(?<=[\p{L}\d])\*{2,3}(?=[\s.,!?;:"”’)\]]|$)/gu, m => '\uE000'.repeat(m.length));
    }
    function restoreStars(t) { return (t || '').replace(/\uE000/g, '*'); }

    function renderUserFormattedMessage(rawText, imgData, container, idx, ts) {
      const text = normQuotes(rawText);

      const userTransferMatch = text.match(/\[USER_TRANSFER:\s*(\d+)\s*\|\s*(.*?)\s*\|\s*(.*?)\]/);
      if (userTransferMatch) {
        const amt = parseInt(userTransferMatch[1], 10);
        const note = userTransferMatch[2] || 'Chuyển khoản';
        const target = userTransferMatch[3] || 'Nhân vật';

        const wrapDiv = document.createElement('div');
        wrapDiv.style.display = 'flex'; wrapDiv.style.flexDirection = 'column'; wrapDiv.style.alignItems = 'flex-end'; wrapDiv.style.width = '100%';
        wrapDiv.innerHTML = buildTransferCardHtml('out', amt, note, target, ts);

        const bar = document.createElement('div');
        bar.className = 'msg-action-bar';
        bar.innerHTML = `<button class="action-text-btn" onclick="deleteMessage(${idx})">Xóa</button>`;
        wrapDiv.appendChild(bar);
        container.appendChild(wrapDiv);
        return;
      }

      // Tin dạng [nội dung] (tặng quà, voice...) hiển thị như hành động, không kèm ngoặc vuông
      const trimmed = text.trim();
      if (!imgData && /^\[[\s\S]*\]$/.test(trimmed)) {
        const inner = trimmed.slice(1, -1).replace(/\{\{[\s\S]*?\}\}/g, '').replace(/\s*\(Lv\.\d+ - Tích lũy: \d+pts\)/g, '').replace(/\*/g, '').trim(); /*aff*/
        const actDiv = document.createElement('div');
        actDiv.className = 'narrative-block user-action';
        actDiv.innerText = inner;
        const wrapDiv = document.createElement('div');
        wrapDiv.style.display = 'flex'; wrapDiv.style.flexDirection = 'column'; wrapDiv.style.alignItems = 'flex-end'; wrapDiv.style.width = '100%';
        wrapDiv.appendChild(actDiv);
        const bar = document.createElement('div');
        bar.className = 'msg-action-bar';
        bar.innerHTML = `<button class="action-text-btn" onclick="editMessage(${idx})">Sửa</button><button class="action-text-btn" onclick="deleteMessage(${idx})">Xóa</button>`;
        wrapDiv.appendChild(bar);
        container.appendChild(wrapDiv);
        return;
      }

      const ptext = protectStars(text);
      const hasQuote = (ptext.match(/"/g) || []).length >= 2;
      const segs = []; let m;
      if (hasQuote) {
        const re = /"([^"]*)"|\*([^*]*)\*|([^"*]+)/g;
        while ((m = re.exec(ptext)) !== null) {
          if (m[1] !== undefined) segs.push({ type: 'dialogue', text: m[1].trim() });
          else if (m[2] !== undefined) segs.push({ type: 'action', text: m[2].trim() });
          else segs.push({ type: 'action', text: m[3].trim() });
        }
      } else {
        const re = /\*([^*]*)\*|([^*]+)/g;
        while ((m = re.exec(ptext)) !== null) {
          if (m[1] !== undefined) segs.push({ type: 'action', text: m[1].trim() });
          else segs.push({ type: 'dialogue', text: m[2].replace(/"/g, '').trim() });
        }
      }
      segs.forEach(sg => { sg.text = restoreStars(sg.text); });
      expandSpeech(segs);
      const filled = segs.filter(sg => sg.text);
      let lastDialogueIdx = -1; filled.forEach((sg, k) => { if (sg.type === 'dialogue') lastDialogueIdx = k; });
      if (lastDialogueIdx === -1 && filled.length > 0) lastDialogueIdx = filled.length - 1;

      filled.forEach((sg, k) => {
        if (sg.type === 'action') {
          const actDiv = document.createElement('div'); 
          actDiv.className = 'narrative-block user-action'; 
          actDiv.innerText = sg.text; 
          
          if (k === lastDialogueIdx) {
            const wrapDiv = document.createElement('div');
            wrapDiv.style.display = 'flex'; wrapDiv.style.flexDirection = 'column'; wrapDiv.style.alignItems = 'flex-end'; wrapDiv.style.width = '100%';
            wrapDiv.appendChild(actDiv);
            const bar = document.createElement('div');
            bar.className = 'msg-action-bar';
            bar.innerHTML = `<button class="action-text-btn" onclick="editMessage(${idx})">Sửa</button><button class="action-text-btn" onclick="deleteMessage(${idx})">Xóa</button>`;
            wrapDiv.appendChild(bar);
            container.appendChild(wrapDiv);
          } else {
            container.appendChild(actDiv);
          }
        } else {
          const bar = (k === lastDialogueIdx) ? `<div class="msg-action-bar"><button class="action-text-btn" onclick="editMessage(${idx})">Sửa</button><button class="action-text-btn" onclick="deleteMessage(${idx})">Xóa</button></div>` : '';
          const imgHtml = (k === lastDialogueIdx && imgData) ? `<img src="${imgData}" class="msg-img">` : '';
          const div = document.createElement('div'); div.className = 'chat-message user';
          div.innerHTML = `
            <img src="${(window.state.persona && window.state.persona.avatar) || DEFAULT_LOGO}" class="msg-avatar" onerror="this.src='${DEFAULT_LOGO}'">
            <div class="msg-bubble-wrap">
              <div class="msg-sender">${escapeHtml((window.state.persona && window.state.persona.name) || 'Bạn')}</div>
              <div class="msg-bubble"><span class="dialogue-text">${escapeHtml(sg.text)}</span>${imgHtml}</div>${bar}
            </div>
          `;
          container.appendChild(div);
        }
      });
      if (filled.length === 0 && imgData) {
        const div = document.createElement('div'); div.className = 'chat-message user';
        div.innerHTML = `
          <img src="${(window.state.persona && window.state.persona.avatar) || DEFAULT_LOGO}" class="msg-avatar" onerror="this.src='${DEFAULT_LOGO}'">
          <div class="msg-bubble-wrap"><div class="msg-sender">${escapeHtml((window.state.persona && window.state.persona.name) || 'Bạn')}</div><div class="msg-bubble"><img src="${imgData}" class="msg-img"></div>
          <div class="msg-action-bar"><button class="action-text-btn" onclick="editMessage(${idx})">Sửa</button><button class="action-text-btn" onclick="deleteMessage(${idx})">Xóa</button></div></div>
        `;
        container.appendChild(div);
      }
    }

    // Avatar nhân vật phụ: vòng tròn màu + chữ cái đầu, cố định theo tên
    function npcAvatar(name) {
      let h = 0;
      for (const ch of name) h = (h * 31 + ch.codePointAt(0)) >>> 0;
      const hue = h % 360;
      const initial = (Array.from(name.trim())[0] || '?').toUpperCase();
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72'><rect width='72' height='72' rx='36' fill='hsl(${hue},55%,62%)'/><text x='36' y='47' font-size='34' font-family='sans-serif' font-weight='bold' text-anchor='middle' fill='white'>${escapeHtml(initial)}</text></svg>`;
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }

    // Xác định người nói: nhân vật trong truyện, nhiều người ("A&B"), hoặc nhân vật phụ có thoại
    function resolveSpeakers(speakerRaw, restText, story) {
      if (!speakerRaw) return [];
      const chars = (story && story.characters) || [];
      const find = (n) => chars.find(c => (c.name || '').trim().toLowerCase() === n.trim().toLowerCase());
      const mk = (c) => ({ id: c.id, name: c.name, avatar: c.avatar || DEFAULT_LOGO });

      const whole = find(speakerRaw);
      if (whole) return [mk(whole)];

      const userName = ((window.state.persona && window.state.persona.name) || '').trim().toLowerCase();
      if (speakerRaw.trim().toLowerCase() === userName) return [];

      const q = normQuotes(restText);
      const hasDlg = (q.match(/"/g) || []).length >= 2;
      const okNpcName = (n) => n.length <= 30 && n.split(/\s+/).length <= 4 && !/^(lưu ý|chú thích|ghi chú|bối cảnh|hệ thống|dẫn truyện|tóm tắt)/i.test(n);

      const parts = speakerRaw.split(/\s*(?:&|\+|,|\/)\s*|\s+và\s+/i).map(s => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        const out = [];
        parts.forEach(p => {
          const f = find(p);
          if (f) { if (!out.some(o => o.name === f.name)) out.push(mk(f)); }
          else if (hasDlg && okNpcName(p)) out.push({ name: p, avatar: npcAvatar(p) });
        });
        if (out.length === parts.length) return out;
        return [];
      }

      if (hasDlg && okNpcName(speakerRaw.trim())) return [{ name: speakerRaw.trim(), avatar: npcAvatar(speakerRaw.trim()) }];
      return [];
    }

    // Giai đoạn quan hệ theo cấp thân mật
    function affectionStage(lv) {
      if (lv >= 60) return 'Tri kỷ';
      if (lv >= 40) return 'Tâm giao';
      if (lv >= 20) return 'Hảo hữu';
      if (lv >= 10) return 'Thân thiết';
      return 'Mới quen';
    }
    function nextAffectionMilestone(lv) {
      for (const m of [10, 20, 40, 60]) if (lv < m) return m;
      return null;
    }

    function showAffectionCard(sp) {
      const body = document.getElementById('aff-card-body');
      if (!body || !sp) return;
      const av = `<img src="${sp.avatar}" onerror="this.src='${DEFAULT_LOGO}'" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid var(--app-green);">`;
      if (!sp.id) {
        body.innerHTML = `${av}<h3 style="font-size:1.1rem;color:var(--app-dark-green);">${escapeHtml(sp.name)}</h3><div style="font-size:0.82rem;color:#718096;">Nhân vật phụ</div>`;
      } else {
        const aff = (window.state.affectionLevels && window.state.affectionLevels[sp.id]) || { level: 1, points: 0 };
        const need = affectionNeeded(aff.level);
        const pct = Math.max(0, Math.min(100, Math.round(aff.points / need * 100)));
        const nm = nextAffectionMilestone(aff.level);
        body.innerHTML = `
          ${av}
          <h3 style="font-size:1.1rem;color:var(--app-dark-green);">${escapeHtml(sp.name)}</h3>
          <div style="font-size:0.95rem;font-weight:bold;color:#d53f8c;">❤️ Lv.${aff.level} · ${affectionStage(aff.level)}</div>
          <div style="width:100%;height:12px;background:#edf2f7;border-radius:8px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#ff8fa3,#d53f8c);"></div>
          </div>
          <div style="font-size:0.78rem;color:#4a5568;">${aff.points}/${need} điểm để lên Lv.${aff.level + 1}</div>
          <div style="font-size:0.75rem;color:#718096;">${nm ? `Mốc tiếp theo: Lv.${nm} · ${affectionStage(nm)}` : 'Đã đạt mốc cao nhất'}</div>`;
      }
      openModal('modal-affection');
    }

    function parseAndRenderAiMessage(fullText, story, container, msgIndex, transfers, affection) {
      const barsBefore = container.querySelectorAll('.msg-action-bar').length;
      // ⚡ LỌC ẨN TOÀN BỘ CÁC THẺ LỆNH HỆ THỐNG / ACTION / EVENT KHỎI MÀN HÌNH CHÁT
      fullText = stripUserVoice(cleanAiTags(fullText), window.state.persona && window.state.persona.name);

      const lines = fullText.split('\n').filter(p => p.trim() !== '');

      // Thẻ nhận tiền kiểu Momo/Zalo: chỉ VẼ, tiền đã được cộng 1 lần lúc nhận tin
      if (transfers && transfers.length) {
        let tName = 'Nhân vật', tAvatar = (story && story.avatar) || DEFAULT_LOGO;
        if (story && story.characters && story.characters.length) {
          let found = null;
          for (const ln of lines) {
            const cm = ln.match(/^\s*[\[\*]*([^:\[\]\*"\n]{1,40}?)[\]\*]*\s*:/);
            if (cm) {
              found = story.characters.find(c => (c.name || '').trim().toLowerCase() === cm[1].trim().toLowerCase());
              if (found) break;
            }
          }
          if (!found) found = story.characters[0];
          tName = found.name; if (found.avatar) tAvatar = found.avatar;
        }
        transfers.forEach((tr, ti) => {
          const isLastCard = (ti === transfers.length - 1) && lines.length === 0;
          const bar = isLastCard ? `
            <div class="msg-action-bar">
              <button class="action-text-btn" onclick="regenerateAiResponse(${msgIndex})">Tạo lại</button>
              <button class="action-text-btn" onclick="deleteMessage(${msgIndex})">Xóa</button>
            </div>` : '';
          const row = document.createElement('div');
          row.className = 'chat-message ai';
          row.innerHTML = `
            <img src="${tAvatar}" class="msg-avatar" onerror="this.src='${DEFAULT_LOGO}'">
            <div class="msg-bubble-wrap">
              <div class="msg-sender">${escapeHtml(tName)}</div>
              ${buildTransferCardHtml('in', tr.amount, tr.note, tName, tr.ts)}
              ${bar}
            </div>`;
          container.appendChild(row);
        });
      }

      lines.forEach((line, lineIdx) => {
        const charMatch = line.match(/^\s*[\[\*]*([^:\[\]\*"\n]{1,40}?)[\]\*]*\s*:\s*(.*)$/);

        {
          let speakerRaw = charMatch ? charMatch[1].trim() : '';
          let speakerName = speakerRaw || 'AI';
          let restText = charMatch ? (charMatch[2] || '').trim() : line.trim();

          let matchedAvatar = (story && story.avatar) || DEFAULT_LOGO;
          const speakers = resolveSpeakers(speakerRaw, restText, story);
          const isKnownChar = speakers.length > 0;

          if (!isKnownChar) {
            const narrText = restText.replace(/\*/g, '').trim();
            if (narrText) {
              const nDiv = document.createElement('div');
              nDiv.className = 'narrative-block ai-action';
              nDiv.innerText = narrText; // văn tả: bỏ tiền tố "Tên:" của người không có thoại
              
              if (lineIdx === lines.length - 1) {
                const wrapDiv = document.createElement('div');
                wrapDiv.style.display = 'flex'; wrapDiv.style.flexDirection = 'column'; wrapDiv.style.alignItems = 'flex-start'; wrapDiv.style.width = '100%';
                wrapDiv.appendChild(nDiv);
                const bar = document.createElement('div');
                bar.className = 'msg-action-bar';
                bar.innerHTML = `<button class="action-text-btn" onclick="editMessage(${msgIndex})">Sửa</button><button class="action-text-btn" onclick="regenerateAiResponse(${msgIndex})">Tạo lại</button><button class="action-text-btn" onclick="deleteMessage(${msgIndex})">Xóa</button>`;
                wrapDiv.appendChild(bar);
                container.appendChild(wrapDiv);
              } else {
                container.appendChild(nDiv);
              }
            }
            return;
          }

          restText = protectStars(normQuotes(restText));
          const hasQuote = (restText.match(/"/g) || []).length >= 2;
          const segs = [];
          if (hasQuote) {
            const re = /"([^"]*)"|\*([^*]*)\*|([^"*]+)/g;
            let m;
            while ((m = re.exec(restText)) !== null) {
              if (m[1] !== undefined) segs.push({ type: 'dialogue', text: m[1].trim() });
              else if (m[2] !== undefined) segs.push({ type: 'action', text: m[2].trim() });
              else if (m[3] !== undefined) segs.push({ type: 'action', text: m[3].trim() });
            }
          } else {
            const re = /\*([^*]*)\*|([^*]+)/g;
            const hasStar = /\*[^*]+\*/.test(restText);
            let m;
            while ((m = re.exec(restText)) !== null) {
              if (m[1] !== undefined) segs.push({ type: 'action', text: m[1].trim() });
              else if (m[2] !== undefined) segs.push({ type: 'dialogue', text: m[2].replace(/"/g, '').trim() });
            }
            if (!hasStar && segs.length === 0) segs.push({ type: 'dialogue', text: restText.replace(/[\*"]/g, '').trim() });
          }

          segs.forEach(sg => { sg.text = restoreStars(sg.text); });
          expandSpeech(segs);
          speakers.forEach((sp, spIdx) => {
          matchedAvatar = sp.avatar; speakerName = sp.name;
          segs.forEach((seg, segIdx) => {
            if (!seg.text) return;
            const isLastSeg = (lineIdx === lines.length - 1 && segIdx === segs.length - 1 && spIdx === speakers.length - 1);

            if (seg.type === 'action') {
              const actDiv = document.createElement('div');
              actDiv.className = 'narrative-block ai-action';
              actDiv.innerText = seg.text;

              if (isLastSeg) {
                const wrapDiv = document.createElement('div');
                wrapDiv.style.display = 'flex'; wrapDiv.style.flexDirection = 'column'; wrapDiv.style.alignItems = 'flex-start'; wrapDiv.style.width = '100%';
                wrapDiv.appendChild(actDiv);
                const bar = document.createElement('div');
                bar.className = 'msg-action-bar';
                bar.innerHTML = `<button class="action-text-btn" onclick="editMessage(${msgIndex})">Sửa</button><button class="action-text-btn" onclick="regenerateAiResponse(${msgIndex})">Tạo lại</button><button class="action-text-btn" onclick="deleteMessage(${msgIndex})">Xóa</button>`;
                wrapDiv.appendChild(bar);
                container.appendChild(wrapDiv);
              } else {
                container.appendChild(actDiv);
              }
            } else {
              const div = document.createElement('div');
              div.className = 'chat-message ai';

              const bar = isLastSeg ? `
                <div class="msg-action-bar">
                  <button class="action-text-btn" onclick="editMessage(${msgIndex})">Sửa</button>
                  <button class="action-text-btn" onclick="regenerateAiResponse(${msgIndex})">Tạo lại</button>
                  <button class="action-text-btn" onclick="deleteMessage(${msgIndex})">Xóa</button>
                </div>` : '';

              div.innerHTML = `
                <img src="${matchedAvatar}" class="msg-avatar" onerror="this.src='${DEFAULT_LOGO}'">
                <div class="msg-bubble-wrap">
                  <div class="msg-sender">${escapeHtml(speakerName)}</div>
                  <div class="msg-bubble"><span class="dialogue-text">${escapeHtml(seg.text)}</span></div>
                  ${bar}
                </div>
              `;
              const av = div.querySelector('.msg-avatar');
              if (av) { av.style.cursor = 'pointer'; av.onclick = () => showAffectionCard(sp); }
              container.appendChild(div);
            }
          });
          });
        }
      });

      // Dự phòng: nếu dòng cuối bị bỏ qua (rỗng, dòng thừa...) khiến tin này không có thanh nút, thêm thanh Sửa / Tạo lại / Xóa riêng ở cuối
      if (container.querySelectorAll('.msg-action-bar').length === barsBefore) {
        const fb = document.createElement('div');
        fb.className = 'msg-action-bar';
        fb.style.cssText = 'margin:2px 0 8px 46px;';
        fb.innerHTML = `<button class="action-text-btn" onclick="editMessage(${msgIndex})">Sửa</button><button class="action-text-btn" onclick="regenerateAiResponse(${msgIndex})">Tạo lại</button><button class="action-text-btn" onclick="deleteMessage(${msgIndex})">Xóa</button>`;
        container.appendChild(fb);
      }

    }

    function editMessage(idx) {
      const history = window.state.chatHistories[window.state.activeStoryId];
      if (!history) return;
      const newText = prompt('Sửa tin nhắn:', history[idx].text);
      if (newText !== null) { history[idx].text = newText; saveStorage(); renderChatHistory(); }
    }

    // Hoàn lại tiền nếu xóa / tạo lại tin AI đã chuyển tiền
    function revertTransfers(m) {
      if (m && m.sender === 'ai' && m.transfers && m.transfers.length) {
        const sum = m.transfers.reduce((s, t) => s + (t.amount || 0), 0);
        window.state.walletBalance = Math.max(0, (window.state.walletBalance || 0) - sum);
      }
      if (m && m.sender === 'ai' && m.affection && m.affection.length) {
        m.affection.forEach(a => addAffectionPoints(a.id, -a.pts));
      }
    }

    function deleteMessage(idx) {
      if (confirm('Xóa tin nhắn?')) {
        const hist = window.state.chatHistories[window.state.activeStoryId];
        revertTransfers(hist[idx]);
        hist.splice(idx, 1);
        saveStorage(); renderChatHistory();
      }
    }

    function regenerateAiResponse(idx) {
      const history = window.state.chatHistories[window.state.activeStoryId];
      if (!history) return;
      const removed = history.splice(idx);
      removed.forEach(revertTransfers);
      saveStorage();
      renderChatHistory();
      sendMessage(null, false, true);
    }

    function triggerAutoPlay() { sendMessage(null, false, true); }

    async function sendMessage(overrideText = null, isRegen = false, isAutoPlay = false, overrideImg = null) {
      const inputEl = document.getElementById('user-input');
      let text = overrideText || (inputEl ? inputEl.value.trim() : '');
      if (!text && !isRegen && !isAutoPlay && !overrideImg) return;

      const storyId = window.state.activeStoryId;
      const story = window.state.stories.find(s => s.id === storyId);
      if (!window.state.chatHistories[storyId]) window.state.chatHistories[storyId] = [];

      if (!window.state.apiKeys || window.state.apiKeys.length === 0) {
        alert('Vui lòng nhập API Key trong Cài Đặt!');
        return openModal('modal-settings');
      }

      // Ghi chú ẩn dùng 1 lần cho lượt này (VD: phản ứng với quà thủ công)
      const hintText = window.__nextHint || '';
      window.__nextHint = '';

      if (!isRegen && !isAutoPlay && text) {
        if (!overrideText && !overrideImg) mtrack('chats', 1);
        window.state.chatHistories[storyId].push({ sender: 'user', text: text, img: overrideImg || null, ts: Date.now() });
        saveStorage();
        renderChatHistory();
        if (inputEl) inputEl.value = '';
      }

      const histLen = window.state.chatHistories[storyId].length;
      const histStart = Math.max(0, histLen - 20);

      // Lấy cấp độ thân mật hiện tại để đưa vào System Prompt cho AI nhận thức mức độ gắn bó (Yêu đương sâu đậm 18+ hay anh em bạn bè thân thiết tâm sự nhiệt tình)
      let charAffectionSummary = '';
      if (story && story.characters) {
        story.characters.forEach(c => {
          const aff = window.state.affectionLevels[c.id] || { level: 1, points: 0 };
          charAffectionSummary += `- Nhân vật ${c.name}: Cấp độ thân mật hiện tại là Lv.${aff.level} (Điểm tích lũy: ${aff.points}).\n`;
        });
      }

      let charsPrompt = ((story && story.characters) || []).map(c => `- ${c.name}: ${c.personality}`).join('\n');

      const hintBlock = hintText ? `\n[GHI CHÚ HỆ THỐNG CHO LƯỢT NÀY]\n${hintText}\n` : '';
      const activeModeNow = (window.state.activeMode || {})[storyId];
      let modeBlock = '';
      if (activeModeNow && MODES[activeModeNow.mode]) {
        const modeChar = story && story.characters ? story.characters.find(c => c.id === activeModeNow.charId) : null;
        if (modeChar) modeBlock = `\n[CHẾ ĐỘ TRÒ CHUYỆN ĐANG BẬT]\n${MODES[activeModeNow.mode].prompt(modeChar.name)}\n`;
      }
      
      let cohabBlock = '';
      if (story && story.characters) {
        const meN = (window.state.persona && window.state.persona.name) || 'người chơi';
        const inHome = story.characters.filter(c => c.livesWith), outHome = story.characters.filter(c => c.movedOut && !c.livesWith);
        if (inHome.length) cohabBlock += `[Ở CHUNG NHÀ - GHI NHỚ LÂU DÀI] ${inHome.map(c => c.name).join(', ')} đang SỐNG CHUNG NHÀ với "${meN}". Nhân vật nhớ rõ điều này trong mọi lượt: cùng một mái nhà, biết nhà cửa, đồ đạc, thói quen sinh hoạt chung (ăn uống, ngủ nghỉ, việc nhà, giờ giấc ra vào), không cư xử như người ở nơi khác hay mới đến lần đầu; cảnh trong nhà là bối cảnh mặc định khi phù hợp.\n`;
        if (outHome.length) cohabBlock += `${outHome.map(c => c.name).join(', ')} từng ở chung nhưng ĐÃ DỌN ĐI, hiện sống riêng (vẫn nhớ thời gian từng ở chung).\n`;
      }
      let petMemBlock = '';
      if (story && story.characters) {
        const pm = window.state.petMemories || {};
        const lines = [];
        story.characters.forEach(c => {
          const arr = (pm[c.id] || []).slice(-6);
          if (!arr.length) return;
          const txt = arr.map(m => {
            let d = '';
            try { d = new Date(m.ts).toLocaleDateString('vi-VN') + ': '; } catch (e) {}
            return d + m.text;
          }).join(' | ');
          lines.push(`- ${c.name} nhớ: ${txt}`);
        });
        if (lines.length) petMemBlock = `[KÝ ỨC VỀ THÚ CƯNG VÀ CHUYẾN ĐI DẠO - SỰ THẬT ĐÃ XẢY RA] Những chuyện dưới đây thật sự đã xảy ra khi người chơi dắt thú đi dạo (không tự động hiện trong khung chat). Nhân vật biết rõ, có thể nhắc lại tự nhiên khi phù hợp, nhất là khi thú bị thương hoặc gặp chuyện, nhưng không kể lại máy móc toàn bộ:\n${lines.join('\n')}\n`;
      }
      const systemInstruction = `
[QUY TẮC NHẬP VAI & BÁM SÁT CỐT TRUYỆN BẮT BUỘC]
1. Bối cảnh kịch bản: "${(story && story.setting) || ''}".
2. Cảnh mở đầu: "${(story && story.openingScene) || ''}".
3. Các nhân vật bạn nhập vai:
${charsPrompt}
4. Thông tin cấp độ thân mật hiện tại của các nhân vật với người chơi:
${charAffectionSummary}${cohabBlock}${petMemBlock}
5. Người tương tác: "${(window.state.persona && window.state.persona.name) || 'Thư'}" (${(window.state.persona && window.state.persona.memories) || ''}).

[QUY TẮC CHIỀU SÂU THÂN MẬT & MỐI QUAN HỆ]
- Nếu mối quan hệ là NGƯỜI YÊU / LÃNG MẠN và Level thân mật cao (Lv.10, Lv.20, Lv.40, Lv.60 trở lên): Nhân vật sẽ cực kỳ bám người, quấn quýt, thể hiện tình cảm mãnh liệt, nồng cháy. Các phân cảnh thân mật, âu yếm (18+) được miêu tả chi tiết, cảm xúc và sâu sắc hơn.
- Nếu mối quan hệ là TRI KỶ / ANH EM / BẠN BÈ và Level cao: Nhân vật trở thành chỗ dựa vững chắc, sẵn sàng tâm sự, thấu hiểu, giúp đỡ nhiệt tình hết mình khi người chơi gặp khó khăn.

[CẤM TUYỆT ĐỐI - LỖI NGHÊM TRỌNG]
⛔ KHÔNG ĐƯỢC TỰ Ý VIẾT LỜI THOẠI, HÀNH ĐỘNG, CẢM XÚC HOẶC SUY NGHĨ CHO "${(window.state.persona && window.state.persona.name) || 'Thư'}" (người chơi). Người chơi là người DUY NHẤT quyết định mình nói gì, làm gì, nghĩ gì.
⛔ KHÔNG ĐƯỢC sinh ra bất kỳ dòng nào bắt đầu bằng tên người dùng, kể cả dạng [Tên]: hay *Tên + hành động*. Khi đến lượt người dùng tương tác, PHẢI DỪNG LẠI NGAY LẬP TỨC.
⛔ Không viết câu kể người chơi đã nói/gật đầu/đáp/mỉm cười/cảm thấy/quyết định gì, cũng không "đoán trước" câu trả lời của người chơi. Chỉ được tả PHẢN ỨNG BÊN NGOÀI của nhân vật (ánh mắt, giọng điệu, cử chỉ của CHÍNH nhân vật) trước những gì người chơi ĐÃ viết trong lượt trước.
⛔ TUYỆT ĐỐI không viết dòng nào có chủ ngữ là người chơi (ví dụ "${(window.state.persona && window.state.persona.name) || 'Thư'} nói...", "${(window.state.persona && window.state.persona.name) || 'Thư'} gật đầu...") và không đặt lời thoại, hành động, suy nghĩ của người chơi vào trong ngoặc kép hay dấu * của bất kỳ ai. Nếu cần nhắc đến người chơi, chỉ mô tả cái NHÂN VẬT nhìn thấy/nghe thấy từ những gì người chơi ĐÃ viết.
⛔ Mỗi lượt kết thúc bằng lời nói hoặc hành động của NHÂN VẬT (có thể là một câu hỏi, một lời mời) để trao lượt lại cho người chơi, không viết tiếp diễn biến sau đó.

[NGUYÊN TẮC QUAN TRỌNG & CHỐNG SAI LỆCH]
- QUY TẮC THỜI GIAN: ĐƯỢC PHÉP chuyển/nhảy thời gian (sang buổi sau, hôm sau, vài ngày sau...) khi mạch truyện hợp lý, nhưng phải nói rõ mốc thời gian mới và không bỏ qua phản ứng hay hậu quả của những gì vừa xảy ra.
- CẤM BỊA ĐẶT: Chỉ những gì ĐÃ XUẤT HIỆN trong lịch sử chat mới là sự thật đã xảy ra. Phần "Bối cảnh kịch bản" chỉ là thiết lập/hướng đi, KHÔNG phải sự kiện đã xảy ra. Tuyệt đối không tự bịa hoặc nhớ nhầm những sự kiện, mối quan hệ, chi tiết lớn chưa từng diễn ra (như có con, mang thai, kết hôn, qua đời, mất trí nhớ, tai nạn...) và không tiết lộ trước tình tiết tương lai. Người chơi chưa dẫn tới thì chưa xảy ra. Mỗi lượt chỉ tiến triển một bước nhỏ, hợp lý.
- BÁM SÁT CỐT TRUYỆN & NHÂN VẬT: Mọi diễn biến, lời thoại đúng tính cách, xưng hô cố định. Luôn đối chiếu với bối cảnh kịch bản, cảnh mở đầu và những gì đã diễn ra trong lịch sử chat; mỗi lượt đẩy truyện tiến một bước nhỏ ĐÚNG HƯỚNG cốt truyện, không lạc đề, không đổi hướng đột ngột, không tự thêm nhân vật hay tình tiết mâu thuẫn với những gì đã có.
- TÊN TRONG HÀNH ĐỘNG: Mỗi đoạn hành động PHẢI nêu rõ tên nhân vật đang thực hiện ngay trong câu.

[TÍNH NĂNG CHUYỂN TIỀN TỰ ĐỘNG CỦA NHÂN VẬT]:
- Khi người dùng xin tiền, mượn tiền hoặc đòi tiền, dựa vào tính cách nhân vật và độ thân mật để quyết định CÓ CHUYỂN TIỀN HAY KHÔNG.
- Nếu ĐỒNG Ý, chèn cú pháp sau vào cuối hoặc trong câu trả lời:
  [SYSTEM_TRANSFER: số_tiền_nguyên | Lời nhắn kèm theo]
  (Ví dụ: [SYSTEM_TRANSFER: 20000000 | Tiền tiêu vặt cho em đấy])
- Nếu KHÔNG, chỉ từ chối bằng lời thoại đúng tính cách.

[VĂN PHONG]
- Viết tiếng Việt tự nhiên, mượt mà, giàu hình ảnh và cảm xúc như tiểu thuyết: câu văn có nhịp điệu, chọn từ tinh tế, tả cử chỉ - ánh mắt - không khí cụ thể thay vì liệt kê khô khan. Tránh lặp từ, tránh câu cụt lủn, tránh sáo rỗng. Lời thoại đúng khẩu khí từng nhân vật.

[QUY TẮC DẤU NGOẶC TRONG LỜI THOẠI]
- Lời thoại luôn đặt trong dấu ngoặc kép thẳng "..." (một cặp duy nhất cho mỗi câu nói).
- Muốn nhấn mạnh, trích dẫn hoặc dùng từ lóng/biệt danh BÊN TRONG lời thoại thì dùng dấu nháy đơn ‘...’ (ví dụ: "Nó đúng là đồ ‘ba hoa’ thật."). Tuyệt đối không dùng “...” hay "..." lồng bên trong lời thoại.
- Lời nói của nhân vật LUÔN đặt riêng trong "...", tuyệt đối không nhét lời nói vào giữa đoạn mô tả hành động/cảm xúc (không viết kiểu *Anh nhìn cô, nói "..."*): hãy viết đoạn hành động riêng rồi lời thoại riêng.
- KHÔNG dùng dấu * để che chữ trong lời thoại (không viết kiểu đ**, c*c); dấu * chỉ dùng để bao quanh đoạn hành động.

[ĐỊNH DẠNG ĐẦU RA - BẮT BUỘC]
- Mỗi nhân vật phát ngôn nằm riêng trên một dòng dạng:
[Tên Nhân Vật]: *Tên Nhân Vật + hành động ngắn* "lời thoại ngắn"
- Hai nhân vật cùng nói thì viết MỖI NGƯỜI MỘT DÒNG RIÊNG, tuyệt đối không ghép tên bằng dấu & hoặc chữ "và".
- Nhân vật phụ chưa có trong danh sách (bác sĩ, y tá, phục vụ, bảo vệ...) khi NÓI phải viết thành dòng riêng dạng [Tên hoặc chức danh]: "lời thoại" (dùng một tên nhất quán). KHÔNG nhét lời thoại của họ vào câu hành động hay đoạn tả.
- Đoạn tả cảnh/dẫn truyện viết thành dòng riêng, KHÔNG có tiền tố "Tên:" phía trước.
- Cuối câu trả lời, CHỈ KHI thái độ/tình cảm của nhân vật dành cho người chơi thay đổi rõ rệt do lời nói hoặc hành động trong lượt này, thêm thẻ ở dòng cuối: [AFFECTION: Tên Nhân Vật | +2] (số nguyên từ -3 đến +3: dương = thân mật hơn, âm = giảm; mức thường dùng là +2, khoảnh khắc đặc biệt xúc động/ngọt ngào là +3, bị tổn thương hay giận dỗi thì -1 đến -3). Thẻ này chỉ để hệ thống đọc, người chơi không nhìn thấy. Tuyệt đối KHÔNG viết số điểm thân mật (+2, -1...) hay chữ "thân mật" kèm số ở bất kỳ chỗ nào khác trong câu trả lời, chỉ dùng đúng định dạng thẻ này. Mỗi nhân vật tối đa một thẻ. Không có biến động thì KHÔNG thêm thẻ.
${modeBlock}${hintBlock}
      `;
      let rawHistory = window.state.chatHistories[storyId].slice(histStart);
      let contents = [];

      rawHistory.forEach(m => {
        let mText = m.text || '';
        if (m.sender === 'system') {
          // Chỉ tin sự kiện mới được gửi cho AI; cảnh mở đầu đã nằm trong system prompt
          if (!m.event) return;
          mText = `[Sự kiện trong truyện] ${mText}`;
        }
        const role = m.sender === 'ai' ? 'model' : 'user';
        if (m.sender === 'ai' && m.transfers && m.transfers.length) {
          mText += '\n' + m.transfers.map(t => `(Đã chuyển ${t.amount} VNĐ cho người chơi, lời nhắn: ${t.note})`).join(' ');
        }
        const partsArr = [{ text: mText }];
        if (m.img) {
          partsArr.push({ inline_data: { mime_type: "image/jpeg", data: m.img.split(',')[1] || m.img } });
        }
        
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += "\n" + mText;
        } else {
          contents.push({ role, parts: partsArr });
        }
      });

      if (isAutoPlay) {
        // Nếu có lệnh ẩn (VD: phản ứng với sự kiện) thì dùng lệnh đó thay cho câu mặc định
        const autoText = overrideText ? overrideText : 'Tự tiếp tục diễn biến câu chuyện.';
        if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
          contents[contents.length - 1].parts[0].text += "\n" + autoText;
        } else {
          contents.push({ role: 'user', parts: [{ text: autoText }] });
        }
      }

      const payload = {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: contents,
        generationConfig: { temperature: 0.85 },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      };

      const chatBox = document.getElementById('chat-history');
      let loadingEl = document.createElement('div');
      loadingEl.className = 'narrative-block system-action'; loadingEl.innerText = 'Đang trả lời...';
      chatBox.appendChild(loadingEl);
      
      setTimeout(() => { chatBox.scrollTop = chatBox.scrollHeight; }, 50);

      let responseText = null;
      const model = (window.state.currentModel || 'gemini-2.5-flash').trim().replace(/^models\//,'');

      // Đánh dấu đang chờ AI trả lời: nếu iPhone tắt/ngủ app giữa chừng thì lần mở sau hỏi gọi lại
      window.state.pendingReply = { storyId: storyId, ts: Date.now() };
      saveStorage();

      let netFail = false;
      const tryKeys = async () => {
        netFail = false;
        for (const rawKey of window.state.apiKeys) {
          const key = rawKey.trim().replace(/^["']|["']$/g, '');
          const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 75000);
          try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(payload), signal: ctl.signal
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
              const parts = data.candidates?.[0]?.content?.parts;
              responseText = parts ? parts.map(p => p.text || '').join('') : '';
              if (responseText) { clearTimeout(tm); return; }
            }
          } catch (e) { netFail = true; }
          clearTimeout(tm);
        }
      };
      // Mất mạng / app bị ngủ giữa chừng thì chờ app hiện lại rồi thử lại (tối đa 3 lần), lỗi key hoặc từ chối thì không thử lại
      for (let attempt = 0; attempt < 3 && !responseText; attempt++) {
        if (attempt > 0) {
          if (document.hidden) await new Promise(r => { const f = () => { if (!document.hidden) { document.removeEventListener('visibilitychange', f); r(); } }; document.addEventListener('visibilitychange', f); });
          else await new Promise(r => setTimeout(r, 1500));
        }
        await tryKeys();
        if (!netFail) break;
      }

      if (loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);
      
      if (responseText) {
        // XỬ LÝ CHUYỂN TIỀN ĐÚNG 1 LẦN NGAY KHI NHẬN TIN (không xử lý lúc vẽ chat)
        const transfers = [];
        const tre = /\[SYSTEM_TRANSFER:\s*([\d.,]+)\s*\|\s*([^\]]*)\]/g;
        let tm;
        while ((tm = tre.exec(responseText)) !== null) {
          const amt = parseInt(tm[1].replace(/[^\d]/g, ''), 10);
          if (amt > 0) transfers.push({ amount: amt, note: (tm[2] || '').trim() || 'Chuyển khoản', ts: Date.now() });
        }
        const cleaned = stripUserVoice(cleanAiTags(responseText), window.state.persona && window.state.persona.name);

        const totalIn = transfers.reduce((s, t) => s + t.amount, 0);
        if (totalIn > 0) window.state.walletBalance = (window.state.walletBalance || 0) + totalIn;

        // THÂN MẬT KHI CHAT: đọc thẻ [AFFECTION: Tên | +n] đúng 1 lần, ép về -3..+3
        const affChanges = [];
        const are = /\[\s*AFFECTION\s*[:：]\s*([^|\]]+?)\s*\|\s*([+\-−–]?\s*\d+)\s*\]/gi;
        let am;
        while ((am = are.exec(responseText)) !== null) {
          const nm = am[1].trim().toLowerCase();
          const ch = (story && story.characters) ? story.characters.find(c => (c.name || '').trim().toLowerCase() === nm) : null;
          if (!ch || affChanges.some(a => a.id === ch.id)) continue;
          let v = parseInt(am[2].replace(/[−–]/g, '-').replace(/\s/g, ''), 10);
          if (isNaN(v) || v === 0) continue;
          if (v === 1) v = 2; // mỗi lần thân mật tăng ít nhất +2
          v = Math.max(-3, Math.min(3, v));
          affChanges.push({ id: ch.id, name: ch.name, pts: v });
        }
        affChanges.forEach(a => addAffectionPoints(a.id, a.pts));

        const aiMsg = { sender: 'ai', text: cleaned, ts: Date.now() };
        if (transfers.length) aiMsg.transfers = transfers;
        if (affChanges.length) aiMsg.affection = affChanges;
        window.state.chatHistories[storyId].push(aiMsg);
        window.state.pendingReply = null;
        saveStorage(); 
        // Vẽ tin nhắn TRƯỚC, phần giao diện phụ để sau và có bắt lỗi: lỗi ở tab khác không được làm kẹt khung chat
        try { renderChatHistory(); } catch (e) { console.error('renderChatHistory', e); }
        try { if (typeof renderLifeModeUI === 'function') renderLifeModeUI(); } catch (e) { console.error('renderLifeModeUI', e); }
      } else {
        window.state.pendingReply = null; saveStorage();
        alert('Lỗi kết nối API!');
      }
    }

    // Mở app lại mà lượt trả lời trước bị gián đoạn (tin của bạn có nhưng AI chưa kịp trả lời) thì hỏi có gọi lại không
    function checkPendingReply() {
      const p = window.state.pendingReply; if (!p) return;
      const h = (window.state.chatHistories || {})[p.storyId] || [], last = h[h.length - 1];
      window.state.pendingReply = null; saveStorage();
      if (!last || last.sender !== 'user') return;
      setTimeout(() => {
        if (confirm('Lượt trả lời trước bị gián đoạn khi bạn thoát app. Gọi AI trả lời lại ngay?')) {
          window.state.activeStoryId = p.storyId;
          if (typeof openStoryDetail === 'function') openStoryDetail(p.storyId);
          sendMessage(null, true);
        }
      }, 800);
    }
    // Rời app thì đẩy bản mới nhất lên cloud ngay
    document.addEventListener('visibilitychange', () => { if (document.hidden && typeof window.autoSyncToCloud === 'function') window.autoSyncToCloud(true); });

    function handleKeyPress(e) { if (e.key === 'Enter') sendMessage(); }
    function saveAppSettings() {
      window.state.apiKeys = document.getElementById('cfg-api-keys').value.split('\n').map(k => k.trim()).filter(Boolean);
      saveKeys(window.state.apiKeys);
      window.state.currentModel = document.getElementById('cfg-model-select').value.trim() || 'gemini-2.5-flash';
      saveStorage(); closeModal('modal-settings'); alert('Đã lưu!');
    }
    function savePersona() {
      window.state.persona.name = document.getElementById('per-name').value;
      window.state.persona.avatar = document.getElementById('per-avatar').value;
      window.state.persona.memories = document.getElementById('per-memories').value;
      saveStorage(); closeModal('modal-persona'); alert('Đã lưu!');
    }
    function exportToFile() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(getSyncableState(), null, 2));
      const a = document.createElement('a'); a.href = dataStr; a.download = `teechat_backup_${Date.now()}.json`; document.body.appendChild(a); a.click(); a.remove();
    }
    function importFromFile(e) {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        try {
          const p = JSON.parse(evt.target.result);
          if (Array.isArray(p.apiKeys) && p.apiKeys.length) saveKeys(p.apiKeys); // file backup cũ có thể còn key
          delete p.apiKeys;
          const bizBackup = p.bizSave; // giữ riêng: saveStorage bên dưới đọc tiệm đang có trên máy và ghi đè
          try { if (window.__stateLoaded && window.persistBackup) window.persistBackup(JSON.stringify(getSyncableState())); } catch (e) {}
          window.state = p; saveStorage(); loadStorage();
          if (bizBackup) {
            window.state.bizSave = bizBackup;
            try { if (window.applyBizSave) window.applyBizSave(true); } catch (e) {}
            saveStorage();
          }
          renderStoryList(); alert('Khôi phục thành công!'); closeModal('modal-auth');
        } catch(err) { alert('File không hợp lệ!'); }
      };
      reader.readAsText(file);
    }
