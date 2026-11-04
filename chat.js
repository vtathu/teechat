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
// Hồ sơ người chơi riêng của từng truyện; truyện chưa có thì lấy hồ sơ chung làm gốc
function activeStoryPersona(story) {
  const s = story || (window.state.stories || []).find(x => x.id === window.state.activeStoryId);
  if (!s) return window.state.persona || {};
  if (!s.persona || typeof s.persona !== 'object') {
    const g = window.state.persona || {};
    s.persona = { name: g.name || 'Bạn', avatar: g.avatar || '', memories: g.memories || '' };
  }
  return s.persona;
}
window.activeStoryPersona = activeStoryPersona;
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

    // Nhịp drama dùng chung cho chat kể chuyện và sự kiện "Có biến": cách nhau 20-30 lượt người chơi
    function storyUserTurns(storyId) {
      const list = (window.state.chatHistories || {})[storyId] || [];
      return list.filter(m => m && m.sender === 'user').length;
    }
    function storyDramaGap(story) {
      return (story && story.dramaGap) || 24;
    }
    function storyDramaDue(story, userTurns) {
      return userTurns - ((story && story.lastDramaTurn) || 0) >= storyDramaGap(story);
    }
    function markStoryDrama(story, userTurns) {
      if (!story) return;
      story.lastDramaTurn = userTurns;
      story.dramaGap = 20 + Math.floor(Math.random() * 11);
    }

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
      if (!(window.state.apiKeys || []).length) return;

      const storyId = window.state.activeStoryId;
      const story = window.state.stories ? window.state.stories.find(s => s.id === storyId) : null;
      const chars = (story && story.characters) ? story.characters.filter(c => c && c.name) : [];
      if (!story || chars.length === 0) return;

      // Lịch sử thật (có ts), bỏ cảnh mở đầu; chưa đủ chat thì chưa đủ cơ sở để tạo sự kiện đúng mạch
      const fullHistory = ((window.state.chatHistories && window.state.chatHistories[storyId]) || []).filter(m => m && (m.ts || m.event));
      const realMsgs = fullHistory.filter(m => m.sender === 'user' || m.sender === 'ai');
      if (realMsgs.length < STORY_EVENT_MIN_MSGS) return;

      // Drama thưa: chỉ nổ sau 20-30 lượt người chơi kể từ lần biến cố gần nhất
      const userTurns = storyUserTurns(storyId);
      if (!storyDramaDue(story, userTurns)) return;
      if (Math.random() > 0.45) return;
      markStoryDrama(story, userTurns);
      saveStorage();

      eventBusy = true;
      try {
        const activeChar = eventPickCharacter(chars, fullHistory);
        const charId = activeChar.id;
        const charName = activeChar.name;
        const persona = activeStoryPersona(story);
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
1. Sự kiện phải tiếp nối ĐÚNG địa điểm, thời điểm, tâm trạng và chủ đề của đoạn chat cuối cùng; nảy ra từ chi tiết đã có trong hồ sơ hoặc lịch sử chat, không đột ngột sang bối cảnh khác. Nếu diễn biến chat đã đi khác thiết lập ban đầu thì đi theo diễn biến chat, không kéo ngược về cốt truyện cũ.
2. Hành động, nghề nghiệp, khả năng, địa vị, xưng hô của ${charName} phải khớp thân phận và tính cách đã mô tả; không làm điều trái thân phận (người túng thiếu không thể tặng món quá đắt, người lạnh lùng không đột nhiên sến súa...).
3. Chỉ dùng nhân vật đã có trong truyện, hoặc người qua đường thoáng qua (người bán hàng, hàng xóm, shipper...). Không bịa quan hệ/quá khứ chưa từng xuất hiện.
4. Tuyệt đối KHÔNG tạo biến cố lớn không thể đảo ngược (mang thai, có con, kết hôn, qua đời, mất trí nhớ, chia tay hẳn, tai nạn nặng, tiết lộ bí mật lớn của cốt truyện).
5. Phần "desc" chỉ tả tình huống và hành động/lời nói của nhân vật rồi dừng lại để người chơi chọn; KHÔNG viết thay lời nói, hành động hay suy nghĩ của ${userName}.
6. Lựa chọn 1: hợp tác/ngọt ngào/xử lý khéo (thưởng tiền ${(5000000).toLocaleString('vi-VN')} đến ${(60000000).toLocaleString('vi-VN')}, có thể tặng vật phẩm, tăng thân mật 1-10). Lựa chọn 2: phũ phàng/né tránh/trêu chọc/ích kỷ nhưng vẫn hợp lý với tình huống (trừ tiền ${(2000000).toLocaleString('vi-VN')} đến ${(20000000).toLocaleString('vi-VN')}, giảm thân mật 1-10). Nội dung lựa chọn viết ở ngôi người chơi, ngắn gọn dưới 120 ký tự.
7. "desc" tối đa 350 ký tự và phải có tên ${charName} và ${userName}; "log" tối đa 200 ký tự, mô tả kết quả hợp lý của lựa chọn đó.
8. Viết tiếng Việt có dấu, đúng chính tả và đúng nghĩa từ theo "Từ điển tiếng Việt" (Viện Ngôn ngữ học): không viết tắt, không chèn chữ nước ngoài, không dùng từ lệch nghĩa; câu đủ chủ ngữ - vị ngữ, đọc lên tự nhiên và gợi hình ảnh.

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
          const clean = (v) => scrubAiText(v).text;
          const c1 = {
            text: clean(eventData.choice1.text),
            log: clean(eventData.choice1.log),
            moneyChange: clampN(eventData.choice1.moneyChange, 0, 60000000),
            affectionChange: clampN(eventData.choice1.affectionChange || 1, 1, 10),
            getItem: !!eventData.choice1.getItem
          };
          const c2 = {
            text: clean(eventData.choice2.text),
            log: clean(eventData.choice2.log),
            moneyChange: -clampN(eventData.choice2.moneyChange, 0, 20000000),
            affectionChange: -clampN(eventData.choice2.affectionChange || 1, 1, 10),
            getItem: false
          };

          const dynamicEvent = {
            desc: clean(eventData.desc),
            choices: [
              { text: c1.text, action: () => executeEventChoice(charId, charName, clean(eventData.desc), c1, randomRewardItem) },
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
      if (action === 'transfer') {
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
            if (story.openingScene) window.state.chatHistories[storyId].push({ sender: 'system', text: story.openingScene, opening: true });
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

    // Ảnh tách nền phải giữ nguyên độ trong suốt nên xuất PNG, không tô nền trắng
    function handleCutoutUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        const target = document.getElementById('char-cutout');
        if (!target) return;
        const original = e.target.result;
        const img = new Image();
        img.onload = function() {
          try {
            const max = 640; const ratio = Math.min(1, max / Math.max(img.width, img.height));
            const w = Math.max(1, Math.round(img.width * ratio)); const h = Math.max(1, Math.round(img.height * ratio));
            const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            target.value = canvas.toDataURL('image/png');
          } catch (err) { target.value = original; }
        };
        img.src = original;
      };
      reader.readAsDataURL(file);
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
      // Truyện mới: cho AI đọc cốt truyện rồi mở bảng tick chọn nhân vật, không tự thêm bừa
      startCharScan({ story: newStory, text: setting + '\n' + openingScene });
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
      if (typeof ensureThemeStory === 'function') ensureThemeStory(story);

      // Mỗi truyện có hồ sơ người chơi riêng; truyện cũ chưa có thì chép từ hồ sơ chung một lần
      if (!story.persona) { activeStoryPersona(story); saveStorage(); }

      if (!window.state.chatHistories[storyId]) {
        window.state.chatHistories[storyId] = [];
        if (story.openingScene) window.state.chatHistories[storyId].push({ sender: 'system', text: story.openingScene, opening: true });
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

      const me = activeStoryPersona(story);
      document.getElementById('cfg-per-name').value = me.name || '';
      document.getElementById('cfg-per-avatar').value = me.avatar || '';
      document.getElementById('cfg-per-memories').value = me.memories || '';

      switchConfigTab('story');
      openModal('modal-story-config');
    }

    function saveStorySettings() {
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      if (story) {
        const oldOpening = story.openingScene || '';
        const newOpening = document.getElementById('story-opening-input').value.trim();
        story.setting = document.getElementById('story-setting-input').value.trim();
        story.openingScene = newOpening;
        // Đồng bộ tin mở đầu trong lịch sử chat khi người chơi sửa lại cảnh mở đầu
        if (newOpening !== oldOpening) {
          const hist = (window.state.chatHistories || {})[window.state.activeStoryId];
          if (hist) {
            const isOpening = hist.length && isOpeningSceneMessage(hist[0], 0, { openingScene: oldOpening });
            if (isOpening) {
              if (newOpening) { hist[0].text = newOpening; hist[0].opening = true; }
              else hist.shift();
            }
          }
        }
        
        if (!story.theme) story.theme = {};
        story.theme.userBg = document.getElementById('cfg-user-bg').value;
        story.theme.userText = document.getElementById('cfg-user-text').value;
        story.theme.aiBg = document.getElementById('cfg-ai-bg').value;
        story.theme.aiText = document.getElementById('cfg-ai-text').value;
        story.theme.chatBgColor = document.getElementById('cfg-chat-bg-color').value.trim() || '#e7f5ee';
        story.theme.chatBgImg = document.getElementById('cfg-chat-bg-img').value.trim();

        const me = activeStoryPersona(story);
        me.name = document.getElementById('cfg-per-name').value.trim() || 'Bạn';
        me.avatar = document.getElementById('cfg-per-avatar').value.trim();
        me.memories = document.getElementById('cfg-per-memories').value.trim();
        story.updatedAt = Date.now(); // để lúc gộp máy ↔ cloud biết bản truyện nào mới hơn

        saveStorage(); renderCharacterList();
        applyActiveStoryTheme();
        if (typeof renderChatHistory === 'function') renderChatHistory();
        closeModal('modal-story-config');
      }
    }

    let editingCharId = null;

    function renderCharacterList() {
      const container = document.getElementById('character-list-container');
      if (!container) return;
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      if (!story || !story.characters || story.characters.length === 0) {
        editingCharId = null;
        container.innerHTML = '<div class="char-empty">Chưa có nhân vật nào trong truyện này.<br>Bấm "+ Thêm Nhân Vật" hoặc "🔍 Quét nhân vật" để lấy tên từ cốt truyện.</div>';
        renderCharEditorSheet(null);
        return;
      }
      if (editingCharId && !story.characters.some(c => c.id === editingCharId)) editingCharId = null;
      if (!window.state.affectionLevels) window.state.affectionLevels = {};

      container.innerHTML = story.characters.map(char => {
        const affData = window.state.affectionLevels[char.id] || { level: 1, points: 0 };
        const isEditing = editingCharId === char.id;
        const desc = char.personality
          ? escapeHtml(char.personality)
          : '<i style="color:#a0aec0;">Chưa có mô tả — bấm ✏️ Sửa để thêm</i>';
        const row = `<div class="char-row${isEditing ? ' editing' : ''}">
          <img src="${char.avatar || DEFAULT_LOGO}" class="char-avt" alt="" onerror="this.src='${DEFAULT_LOGO}'" onclick="openEditCharInline('${char.id}')">
          <div class="char-body">
            <div class="char-name">${escapeHtml(char.name)}${char.livesWith ? ' 🏠' : ''}</div>
            <div class="char-aff">❤️ Lv.${affData.level} · ${affData.points}/${affectionNeeded(affData.level)}</div>
            <div class="char-desc">${desc}</div>
          </div>
          <div class="char-acts">
            <button class="btn btn-outline char-btn${char.livesWith ? ' live' : ''}" onclick="toggleCohabit('${char.id}')">${char.livesWith ? '🚪 Đi' : '🏠 Ở'}</button>
            <button class="btn btn-outline char-btn" onclick="openEditCharInline('${char.id}')">✏️ Sửa</button>
            <button class="btn btn-outline char-btn del" onclick="deleteCharacter('${char.id}')">✖</button>
          </div>
        </div>`;
        return row;
      }).join('');
      renderCharEditorSheet(story);
    }

    // Form sửa nhân vật hiện đè lên danh sách (không đẩy danh sách xuống)
    function renderCharEditorSheet(story) {
      const panel = document.getElementById('cfg-tab-view-chars');
      if (!panel) return;
      const old = panel.querySelector('.char-edit-sheet');
      if (old) old.remove();
      const char = story && editingCharId ? story.characters.find(c => c.id === editingCharId) : null;
      if (!char) { editingCharId = null; return; }
      panel.insertAdjacentHTML('beforeend', charEditorSheet(char));
      const sheet = panel.querySelector('.char-edit-sheet');
      if (sheet) {
        sheet.scrollTop = 0;
        const inp = document.getElementById('ce-name');
        if (inp && sheet.getBoundingClientRect().width > 0) inp.focus({ preventScroll: true });
      }
    }

    function charEditorSheet(char) {
      return `<div class="char-edit-sheet">
        <div class="sheet-head">
          <h4>✏️ Sửa Nhân Vật</h4>
          <button class="btn btn-outline" type="button" style="padding: 2px 9px; font-size: 0.8rem;" onclick="cancelCharInline()">✖</button>
        </div>
        <div class="form-group">
          <label>Tên Nhân Vật:</label>
          <input type="text" id="ce-name" value="${escapeHtml(char.name)}" placeholder="VD: Trần Hạo Nam">
        </div>
        <div class="form-group">
          <label>Avatar:</label>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="ce-avatar" value="${escapeHtml(char.avatar || '')}" placeholder="URL ảnh..." style="flex: 1;">
            <button class="btn btn-outline" type="button" onclick="document.getElementById('ce-file').click()">📁 Ảnh</button>
          </div>
          <input type="file" id="ce-file" accept="image/*" style="display:none;" onchange="handleImageUpload(event, 'ce-avatar')">
        </div>
        <div class="form-group">
          <label>Tính Cách &amp; Xưng Hô:</label>
          <textarea id="ce-personality" rows="4" placeholder="Lạnh lùng, xưng hô Anh - em...">${escapeHtml(char.personality || '')}</textarea>
        </div>
        <div class="form-group">
          <label>Lời Mở Đầu:</label>
          <textarea id="ce-first-msg" rows="3">${escapeHtml(char.firstMsg || '')}</textarea>
        </div>
        <div class="sheet-acts">
          <button class="btn btn-pink" style="flex: 1;" onclick="saveCharInline('${char.id}')">💾 Lưu</button>
          <button class="btn btn-outline" style="flex: 1;" onclick="cancelCharInline()">Huỷ</button>
        </div>
      </div>`;
    }

    function openEditCharInline(charId) {
      const list = document.getElementById('character-list-container');
      const keepScroll = list ? list.scrollTop : 0;
      editingCharId = editingCharId === charId ? null : charId;
      renderCharacterList();
      if (list) list.scrollTop = keepScroll;
      if (editingCharId) {
        const sheet = document.querySelector('#cfg-tab-view-chars .char-edit-sheet');
        if (sheet) sheet.scrollTop = 0;
      }
    }

    function saveCharInline(charId) {
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      const char = story && story.characters ? story.characters.find(c => c.id === charId) : null;
      if (!char) return;
      const name = document.getElementById('ce-name').value.trim();
      if (!name) return alert('Nhập tên nhân vật!');
      char.name = name;
      char.avatar = document.getElementById('ce-avatar').value.trim() || DEFAULT_LOGO;
      char.personality = document.getElementById('ce-personality').value.trim();
      char.firstMsg = document.getElementById('ce-first-msg').value.trim();
      story.updatedAt = Date.now();
      editingCharId = null;
      saveStorage(); renderCharacterList();
    }

    function cancelCharInline() { editingCharId = null; renderCharacterList(); }

    // ===== QUÉT TÊN NHÂN VẬT TRONG CỐT TRUYỆN =====
    // Nhận tên Viết Hoa có hành động/chức danh, tên 2+ từ lặp lại, tên ở đầu dòng thoại,
    // danh sách sau "Nhân vật:", và cả tên viết thường kiểu "hạo nam khẽ cười" / "cô giáo lan".
    const SCAN_TITLES = new Set('co chu ong ba bac anh chi em thay cau mo di sep ngai'.split(' '));
    const SCAN_TITLES2 = new Set(('co giao|thay giao|dai ca|nhi ca|dai ty|chu tich|giam doc|bac si|thu ky|quan ly|y ta|su phu|su muoi|su ty|truong phong|' +
      'tong giam doc|pho giam doc').split('|'));
    const SCAN_STOP = new Set(('toi minh to cau ban anh chi em co chu ong ba bac thay han nang a ga chang no me ba bo cha con thang nho nguoi ai gi sao the nao do kia nay ' +
      'mot hai bon sau bay tam chin muoi hom mai qua luc khi vi neu nhung va hoac nen roi da dang se van con cung rat hoi qua lam ve ' +
      'tieng mua gio nang troi dat nuoc lua dem sang chieu canh phong ban ghe chiec cai duong mat mep nu cuoi noi buoc').split(/\s+/));
    const SCAN_ADV = new Set('khe nhe van da dang con roi lien bong chot lai cung vua moi se thi rat hoi nhanh cham luon cu hay deu tung sap'.split(' '));
    const SCAN_LINK = new Set('va voi cung roi thi'.split(' '));
    const SCAN_ACTION = new Set(('mim cuoi bat noi dap chao het goi gat cui ngang quay buoc ngoi dung nhin liec nhiu cau om khoc tho ' +
      'vo xoa tua dua chay ghe buong keo day giu go vuot gio giat run hu do siet hit lui nep ngu uong thay muon den toi vao ' +
      'phang phay nhun vai hui ngung ngai la ten nhao tron nuong xao luoc hap rua bam goi mang don lau quet tuoi xep bua').split(/\s+/));
    const SCAN_PLACE_HEAD = new Set(('cho pho benh khach tiem khu lang xom hoi bang cong tap sieu ngan cua hoc vien so bo uy nha ' +
      'thanh tinh xa ap thon buon cang ben bai hon deo suoi toa thi nui song bien').split(/\s+/));
    const SCAN_PLACES = new Set(('da lat|ha noi|sai gon|ho chi minh|hai phong|da nang|hue|can tho|nha trang|vung tau|ha long|sa pa|sapa|ha giang|quy nhon|' +
      'quang ninh|ninh binh|phu quoc|con dao|bien hoa|thu duc|binh duong|dong nai').split('|'));
    const SCAN_ROLE = new Set(('chu tien|khach|thay|co|co giao|giao vien|hoc sinh|bac si|y ta|quan ly|giam doc|chu tich|nhan vien|truong phong|thu ky|' +
      'le tan|dau bep|phuc vu|canh sat|linh|thuong nhan|nong dan|tho|cong nhan|nghe si|ca nhac|hoa si|dao dien').split('|'));
    const SCAN_HEAD_NOUN = new Set(('buoi mui tieng giong anh mat ban tay chan dau vai lung toc doi chiec cai con nguoi nha cua phong canh bau khong ' +
      'dem hom sang trua chieu toi mua nang gio may sao trang dat nuoc lua mong uoc ky uc cau chuyen cau hoi loi noi').split(/\s+/));
    const SCAN_LABEL_SINGLE = new Set(['ten']);
    const SCAN_NONNAME_HEAD = new Set(('gai nguoi con cai chiec dem hom buoi tieng mui giong toc ban tay chan mat cua nha canh cau hoi loi noi').split(/\s+/));
    const SCAN_STRONG_NOUN = new Set(('kiem khay mam bat coc banh tien vang nha cua phong duong ghe ban tay chan mat moi rang toc ao quan non giay tui sach but ' +
      'vuon ruong dat troi mua nang gio may sao trang nuoc lua guom thap cau tho').split(/\s+/));
    const SCAN_LSTOP = new Set(('toi ban cua va voi cung roi thi la nhung mot hai bon sau bay tam chin muoi hom nay qua luc khi vi neu dang se van con rat hoi lam ' +
      'nguoi ai gi sao the nao do kia ay o no ho ta chung co cau chu ong ba bac chi em thay can nghi ve ca').split(/\s+/));
    const SCAN_LABEL = new Set(['boi canh', 'tom tat', 'ghi chu', 'nhan vat', 'nhan vat chinh', 'nhan vat phu', 'dia diem', 'thoi gian', 'tinh cach',
      'ngoai hinh', 'chu de', 'the loai', 'gioi thieu', 'cau chuyen', 'tieu de', 'vai tro', 'ky nang', 'suc manh', 'phe phai', 'nhan xet',
      'the gioi', 'quy tac', 'luu y', 'dong y', 'tuong']);
    const SCAN_FACTION_HEAD = new Set(['bang', 'hoi', 'bang dang', 'gia toc', 'mon phai', 'to chuc', 'cong ty', 'tap doan', 'quan an', 'tiem an']);
    const SCAN_NAME_RAW = new Set(['lâm', 'thơ', 'dũng', 'đỗ', 'võ', 'an', 'nam', 'chi', 'tiên', 'đông', 'phi', 'cẩm', 'mơ', 'châu', 'trà', 'lạc', 'châm']);
    const SCAN_TITLES_RAW = new Set(['cô', 'chú', 'ông', 'bà', 'bác', 'anh', 'chị', 'em', 'thầy', 'cậu', 'mợ', 'dì', 'sếp', 'ngài']);
    const SCAN_TITLES2_RAW = new Set(['cô giáo', 'thầy giáo', 'đại ca', 'nhị ca', 'đại tỷ', 'chủ tịch', 'giám đốc', 'bác sĩ', 'thư ký', 'quản lý', 'y tá', 'sư phụ', 'sư mẫu', 'sư tỷ', 'trưởng phòng', 'tổng giám đốc', 'phó giám đốc']);
    const SCAN_ROLE_RAW = new Set(['chủ tiệm', 'khách', 'thầy', 'cô', 'cô giáo', 'giáo viên', 'học sinh', 'bác sĩ', 'y tá', 'quản lý', 'giám đốc',
      'chủ tịch', 'nhân viên', 'trưởng phòng', 'thư ký', 'lễ tân', 'đầu bếp', 'phục vụ', 'cảnh sát', 'lính', 'thương nhân', 'nông dân', 'thợ', 'công nhân',
      'nghệ sĩ', 'ca nhạc', 'họa sĩ', 'đạo diễn']);

    function foldVi(s) {
      return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    }

    function scanStoryCharNames(raw, existingNames) {
      const text = String(raw || '');
      if (!text.trim()) return [];
      const existsArr = (existingNames || []).reduce((acc, n) => {
        const s = String(n || '');
        const outer = foldVi(s.replace(/[（(][^（()）\[\]]*[）)]/g, ' ').replace(/\s+/g, ' ').trim());
        if (outer) acc.push(outer);
        // Tên trong ngoặc của nhân vật đã có cũng là tên của họ
        const reIn = /[（(]\s*([^（()）\[\]]+?)\s*[）)]/g;
        let mIn;
        while ((mIn = reIn.exec(s)) !== null) {
          const k = foldVi(mIn[1].replace(/\s+/g, ' ').trim());
          if (k) acc.push(k);
        }
        return acc;
      }, []);
      const isDup = (k) => existsArr.some(e => k === e || (' ' + e + ' ').indexOf(' ' + k + ' ') >= 0 || (' ' + k + ' ').indexOf(' ' + e + ' ') >= 0);
      const tokens = [];
      const re = /[\p{L}][\p{L}'’]*|[^\s\p{L}]+/gu;
      let m;
      while ((m = re.exec(text)) !== null) tokens.push({ w: m[0], i: m.index });
      const isWord = t => /^\p{L}/u.test(t.w);
      const isCap = t => /^\p{Lu}/u.test(t.w) && t.w.length > 1;

      // Ngoặc ngay sau tên là tên gọi khác: "Tô Đát Kỷ (Hồ Tiên Nhi)" — nhận cả hai, tên ngoài là chính
      const SCAN_ALIAS = new Map();     // khóa bí danh -> khóa tên chính
      const SCAN_ALIAS_RAW = new Map(); // khóa tên chính -> bí danh gốc
      const aliasRe = /([\p{L}][\p{L}'’]*(?:[ \t]+[\p{L}][\p{L}'’]*){0,3})[ \t]*[（(][ \t]*([^（()）\[\]]{1,50}?)[ \t]*[）)]/gu;
      const aliasWords = (s) => String(s || '').trim().split(/\s+/).filter(Boolean);
      const capsName = (ws) => ws.length > 0 && ws.length <= 4 && ws.every(w => /^\p{Lu}/u.test(w));
      const lowName = (ws) => ws.length > 0 && ws.length <= 4 && ws.every(w => /^\p{Ll}/u.test(w));
      let arm;
      const aliasPairs = [];
      while ((arm = aliasRe.exec(text)) !== null) {
        const outer = arm[1].replace(/\s+/g, ' ').trim();
        const inner = arm[2].replace(/\s+/g, ' ').trim();
        if (/\d/.test(inner)) continue;
        const iws = aliasWords(inner);
        // Ngoặc viết thường chỉ là bí danh khi cả tên ngoài cũng viết thường;
        // "Hạo Nam (chủ tiệm bánh)" vẫn là ghi chú
        if (!capsName(iws) && !(lowName(iws) && lowName(aliasWords(outer)))) continue;
        const ok = foldVi(outer), ik = foldVi(inner);
        if (!ok || !ik || ik === ok) continue;
        SCAN_ALIAS.set(ik, ok);
        if (!SCAN_ALIAS_RAW.has(ok)) {
          SCAN_ALIAS_RAW.set(ok, lowName(iws) ? iws.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : inner);
        }
        aliasPairs.push({ outer, ok, at: arm.index });
      }

      const cands = new Map();
      const niceName = (ws) => ws.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      const put = (key, name, pos, flags) => {
        let c = cands.get(key);
        if (!c) { c = { name: name, count: 0, action: false, title: false, dialog: false, low: false, listed: false, first: pos }; cands.set(key, c); }
        else if (/^\p{Ll}/u.test(c.name) && /^\p{Lu}/u.test(name)) c.name = name;
        c.count++;
        if (flags && flags.action) c.action = true;
        if (flags && flags.title) c.title = true;
        if (flags && flags.dialog) c.dialog = true;
        if (flags && flags.low) c.low = true;
        if (flags && flags.listed) c.listed = true;
      };
      // Tên ngoài viết thường vẫn phải thành nhân vật chính: "tô đát kỷ (hồ tiên nhi)"
      const aliasOuterOk = (outer) => {
        const ws = outer.split(/\s+/).filter(Boolean);
        if (!ws.length || ws.length > 4) return null;
        const f = foldVi(ws[0]);
        if (ws[0] === f && (SCAN_STOP.has(f) || SCAN_LSTOP.has(f) || SCAN_ADV.has(f) || SCAN_ACTION.has(f) || SCAN_LINK.has(f) || SCAN_PLACE_HEAD.has(f))) return null;
        if (SCAN_LABEL.has(foldVi(ws.join(' '))) || SCAN_PLACES.has(foldVi(ws.join(' ')))) return null;
        if (SCAN_TITLES.has(f) || (ws.length > 1 && SCAN_TITLES2.has(foldVi(ws[0] + ' ' + ws[1])))) return null;
        return ws;
      };
      aliasPairs.forEach(p => {
        if (/^\p{Lu}/u.test(p.outer)) return; // viết hoa đã được lượt 1 bắt
        const ws = aliasOuterOk(p.outer);
        if (!ws) return;
        put(p.ok, niceName(ws), p.at, { title: true, listed: true });
      });
      const lineHead = (before) => /(?:^|[\n\r])[ \t]*[-–—*•]?[ \t]*\[?[ \t]*$/.test(before);
      const titleBefore = (i) => {
        const a = tokens[i - 1], b = tokens[i - 2];
        if (!a || !isWord(a)) return false;
        if (!/^[ \t]+$/.test(text.slice(a.i + a.w.length, tokens[i].i))) return false;
        if (SCAN_TITLES_RAW.has(String(a.w).toLowerCase())) return true;
        if (b && isWord(b) && /^[ \t]+$/.test(text.slice(b.i + b.w.length, a.i))) return SCAN_TITLES2_RAW.has(String(b.w).toLowerCase() + ' ' + String(a.w).toLowerCase());
        return false;
      };
      const roleBefore = (i) => {
        const a = tokens[i - 1], b = tokens[i - 2];
        if (!a || !isWord(a)) return false;
        if (!/^[ \t]+$/.test(text.slice(a.i + a.w.length, tokens[i].i))) return false;
        if (SCAN_ROLE_RAW.has(String(a.w).toLowerCase())) return true;
        if (b && isWord(b) && /^[ \t]+$/.test(text.slice(b.i + b.w.length, a.i))) return SCAN_ROLE_RAW.has(String(b.w).toLowerCase() + ' ' + String(a.w).toLowerCase());
        return false;
      };
      const rolePhraseAt = (i) => {
        const a = tokens[i - 1];
        if (!a || !isWord(a)) return false;
        if (!/^[ \t]+$/.test(text.slice(a.i + a.w.length, tokens[i].i))) return false;
        return SCAN_ROLE_RAW.has(String(a.w).toLowerCase() + ' ' + String(tokens[i].w).toLowerCase());
      };
      const titlePairHead = (i) => {
        const b = tokens[i + 1];
        if (!b || !isWord(b)) return false;
        if (!/^[ \t]+$/.test(text.slice(tokens[i].i + tokens[i].w.length, b.i))) return false;
        return SCAN_TITLES2_RAW.has(String(tokens[i].w).toLowerCase() + ' ' + String(b.w).toLowerCase());
      };
      const titleTail = (i) => {
        const a = tokens[i - 1];
        if (!a || !isWord(a)) return false;
        return /^[ \t]+$/.test(text.slice(a.i + a.w.length, tokens[i].i)) && SCAN_TITLES2_RAW.has(String(a.w).toLowerCase() + ' ' + String(tokens[i].w).toLowerCase());
      };
      // Nhìn về sau tối đa 8 từ: bỏ qua dấu câu, trạng từ, từ nối và tên khác để tìm dấu hiệu là người
      const actionAfter = (j) => {
        let k = j + 1, hops = 0, afterPunct = false, linkBudget = 0;
        while (tokens[k] && hops < 8) {
          if (!isWord(tokens[k])) {
            if (/^[.!?…]+$/.test(tokens[k].w)) return false;
            if (!/^[()[\]{}（）]+$/.test(tokens[k].w)) afterPunct = true;
            k++; hops++;
            continue;
          }
          const f = foldVi(tokens[k].w);
          if (afterPunct && isCap(tokens[k])) return false;
          if (f === 'la' && tokens[k + 1] && isWord(tokens[k + 1])) {
            const n1 = foldVi(tokens[k + 1].w);
            const n2 = tokens[k + 2] && isWord(tokens[k + 2]) ? foldVi(tokens[k + 2].w) : '';
            if (SCAN_ROLE.has(n1) || (n2 && SCAN_ROLE.has(n1 + ' ' + n2))) return true;
          }
          if (f === 'va' || f === 'voi') { linkBudget = 2; k++; hops++; continue; }
          if (SCAN_ADV.has(f) || isCap(tokens[k])) { k++; hops++; continue; }
          if (SCAN_ACTION.has(f)) return true;
          if (linkBudget > 0) { linkBudget--; k++; hops++; continue; }
          return false;
        }
        return false;
      };
      const addListName = (ws, pos) => {
        const parts = ws.map(foldVi);
        if (!parts.length || parts.length > 3 || !/^\p{L}/u.test(ws[0])) return;
        if ((!/^\p{Lu}/u.test(ws[0]) && SCAN_STOP.has(parts[0])) || SCAN_PLACE_HEAD.has(parts[0])) return;
        if (SCAN_LABEL.has(parts.join(' ')) || (parts.length === 1 && SCAN_LABEL_SINGLE.has(parts[0]))) return;
        if (SCAN_PLACES.has(parts.join(' ')) || parts.some((p, i) => !/^\p{Lu}/u.test(ws[i]) && SCAN_STRONG_NOUN.has(p))) return;
        put(parts.join(' '), niceName(ws), pos, { title: true, listed: true });
      };

      // 1) Cụm Viết Hoa: "Hạo Nam khẽ cười", "Cô giáo Minh Anh", "Hạo Nam:"
      for (let i = 0; i < tokens.length; i++) {
        if (!isWord(tokens[i]) || !isCap(tokens[i])) continue;
        let j = i;
        while (j - i < 3 && tokens[j + 1] && isWord(tokens[j + 1]) && isCap(tokens[j + 1])) {
          const gap = text.slice(tokens[j].i + tokens[j].w.length, tokens[j + 1].i);
          if (!/^[ \t]+$/.test(gap)) break;
          j++;
        }
        let words = tokens.slice(i, j + 1).map(t => t.w);
        const headTitle = titleBefore(i);
        let stripped = false;
        for (;;) {
          if (words.length > 2 && SCAN_TITLES2.has(foldVi(words[0] + ' ' + words[1]))) { words = words.slice(2); stripped = true; continue; }
          if (words.length > 1 && SCAN_TITLES.has(foldVi(words[0]))) { words = words.slice(1); stripped = true; continue; }
          break;
        }
        words = words.slice(0, 3);
        const ti = i, pos = tokens[i].i;
        i = j; // đã xét trọn cụm, không tách nhỏ thành tên rác
        if (!words.length) continue;
        const parts = words.map(foldVi);
        const key = parts.join(' ');
        if (parts.length === 1 && SCAN_STOP.has(parts[0])) continue;
        const dialog = tokens[j + 1] && tokens[j + 1].w === ':' && lineHead(text.slice(0, pos));
        put(key, niceName(words), pos, { action: actionAfter(j), title: headTitle || stripped || roleBefore(ti), dialog: dialog });
      }

      // 2) Danh sách sau nhãn "Nhân vật:" (kể cả viết thường, có ghi chú trong ngoặc)
      const labelRe = /(?:^|[\n\r])[ \t]*[-–—*•]?[ \t]*(?:nhân\s*vật(?:\s*chính|\s*phụ)?|tuyến\s*nhân\s*vật|dàn\s*nhân\s*vật)\s*[:：]\s*([^\n\r]+)/gi;
      while ((m = labelRe.exec(text)) !== null) {
        const bodyStart = m.index + m[0].length - m[1].length;
        let cursor = 0;
        String(m[1]).split(/[,;\/&+]|\s+và\s+|\s+va\s+|\s*[-–—]\s*/g).forEach(seg => {
          const at = m[1].indexOf(seg, cursor);
          if (at >= 0) cursor = at + seg.length;
          const ws = seg.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ').replace(/^[\s.!?*•]+|[\s.!?]+$/g, '').split(/\s+/).filter(Boolean);
          if (ws.length) addListName(ws, bodyStart + (at >= 0 ? at : 0));
        });
      }

      // 3) Tên viết thường: "hạo nam khẽ cười", "cô giáo lan", "hạo nam:", hoặc lặp lại 2 lần
      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (!isWord(t) || isCap(t)) continue;
        const f0 = foldVi(t.w), rawLow = String(t.w).toLowerCase();
        if (!SCAN_NAME_RAW.has(rawLow) && (SCAN_LSTOP.has(f0) || SCAN_ADV.has(f0) || SCAN_ACTION.has(f0) || SCAN_LINK.has(f0))) continue;
        if (SCAN_TITLES_RAW.has(rawLow) || titlePairHead(i) || titleTail(i)) continue;
        let j = i;
        const words = [t.w];
        while (j - i < 2 && tokens[j + 1] && isWord(tokens[j + 1]) && !isCap(tokens[j + 1])) {
          const gap = text.slice(tokens[j].i + tokens[j].w.length, tokens[j + 1].i);
          if (!/^[ \t]+$/.test(gap)) break;
          const f = foldVi(tokens[j + 1].w);
          if (SCAN_LSTOP.has(f) || SCAN_ADV.has(f) || SCAN_ACTION.has(f) || SCAN_LINK.has(f)) break;
          j++;
          words.push(tokens[j].w);
        }
        const parts = words.map(foldVi);
        if (!parts[0] || parts[0].length < 2) continue;
        const dialog = tokens[j + 1] && tokens[j + 1].w === ':' && lineHead(text.slice(0, t.i));
        const title = titleBefore(i);
        if (!title && !SCAN_NAME_RAW.has(rawLow) && (roleBefore(i) || rolePhraseAt(i)) && !words.slice(1).some(w => SCAN_NAME_RAW.has(String(w).toLowerCase()))) continue;
        put(parts.join(' '), niceName(words), t.i, { low: true, title: title, dialog: dialog, action: actionAfter(j) });
      }

      const list = Array.from(cands.values()).sort((a, b) => a.first - b.first);
      const pass = [];
      list.forEach(c => {
        const parts = c.name.split(/\s+/).map(foldVi);
        const single = parts.length === 1;
        if (SCAN_PLACES.has(parts.join(' ')) || SCAN_LABEL.has(parts.join(' ')) || (single && SCAN_LABEL_SINGLE.has(parts[0]))) return;
        if (parts.length > 1 && (SCAN_FACTION_HEAD.has(parts[0]) || SCAN_FACTION_HEAD.has(parts[0] + ' ' + parts[1]))) return;
        if (SCAN_NONNAME_HEAD.has(parts[0])) return;
        const personish = !!(c.action || c.dialog || c.title);
        if (!personish && SCAN_PLACE_HEAD.has(parts[0])) return;
        if (single) {
          if (SCAN_STOP.has(parts[0])) return;
          if (c.low && !c.title && !c.dialog) return;
          if (!c.action && !c.dialog && !c.title) return;
        } else if (!c.action && !c.dialog && !c.title && c.low && c.count < 2) {
          return;
        }
        if (!c.listed && !c.action && !c.dialog && (SCAN_HEAD_NOUN.has(parts[0]) || parts.some(p => SCAN_STRONG_NOUN.has(p)))) return;
        pass.push(c);
      });
      const out = [];
      const passKeys = new Set(pass.map(c => foldVi(c.name)));
      // Gộp tên ngoài và tên trong ngoặc thành một chuỗi để so lồng nhau
      const flat = (n) => ' ' + foldVi(String(n).replace(/[（()）\[\]]/g, ' ').replace(/\s+/g, ' ').trim()) + ' ';
      // Bí danh (hay một phần bí danh) không thành nhân vật riêng khi tên chính đã có
      const liveAlias = [];
      SCAN_ALIAS.forEach((pk, ik) => { if (passKeys.has(pk)) liveAlias.push(ik); });
      const inAliasOfPrimary = (cf) => liveAlias.some(ik => (' ' + ik + ' ').indexOf(cf) >= 0);
      pass.forEach(c => {
        const key = foldVi(c.name);
        const cf = flat(c.name);
        if (SCAN_ALIAS.has(key) && passKeys.has(SCAN_ALIAS.get(key))) return;
        if (inAliasOfPrimary(cf)) return;
        // Bỏ tên ngắn nằm trong một tên dài hơn ("Hạo Nam" khi đã có "Trần Hạo Nam",
        // "Tiên Nhi" khi đã có "Tô Đát Kỷ (Hồ Tiên Nhi)")
        if (pass.some(d => d !== c && flat(d.name) !== cf && flat(d.name).indexOf(cf) >= 0)) return;
        if (isDup(key)) return;
        const alt = SCAN_ALIAS_RAW.get(key);
        if (out.length < 16) out.push(c.name + (alt ? ' (' + alt + ')' : ''));
      });
      return out;
    }

    function makeScannedChar(name, idx) {
      return { id: 'char-' + Date.now() + '-' + (idx || 0), name, avatar: DEFAULT_LOGO, personality: '', firstMsg: '' };
    }

    function addScannedChars(story, names) {
      if (!story || !names || !names.length) return [];
      if (!story.characters) story.characters = [];
      const added = [];
      const pk = (s) => foldVi(String(s || '').replace(/[（(][^（()）\[\]]*[）)]/g, ' ').replace(/\s+/g, ' ').trim());
      names.forEach((n, idx) => {
        const same = story.characters.find(c => pk(c.name) === pk(n));
        if (same) {
          // Đã có tên chính: bổ sung tên trong ngoặc nếu bản cũ chưa có, không đổi id/dữ liệu khác
          if (!/[（(]/.test(same.name) && /[（(]/.test(n)) same.name = n;
          return;
        }
        story.characters.push(makeScannedChar(n, idx));
        added.push(n);
      });
      return added;
    }

    function scanStoryNow() {
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      if (!story) return;
      const text = (document.getElementById('story-setting-input').value || '') + '\n' + (document.getElementById('story-opening-input').value || '');
      startCharScan({ story, text, statusEl: document.getElementById('scan-char-status') });
    }

    // ---------- Đọc cốt truyện: chỉ lọc ra NGƯỜI rồi cho tick chọn ----------
    const SCAN_FACTION_PREFIX = ['bang ', 'hoi ', 'gia toc ', 'mon phai ', 'to chuc ', 'cong ty ', 'tap doan ', 'quan an ', 'tiem an '];
    const SCAN_PLACE_PREFIX = ['thanh pho ', 'thi tran ', 'tinh ', 'huyen ', 'lang ', 'nui ', 'song ', 'bien ', 'dao ', 'chau '];
    function scanKeyName(s) { return foldVi(String(s || '')).replace(/[\[\]]/g, ' ').replace(/\s+/g, ' ').trim(); }
    function scanGuessKind(text, name) {
      const key = scanKeyName(name);
      if (!key) return { person: false, kind: 'khác', note: '' };
      const t = ' ' + scanKeyName(text) + ' ';
      const hit = (arr, kind) => arr.some(p => key.indexOf(p) === 0);
      if (hit(SCAN_FACTION_PREFIX, 'bang hội')) return { person: false, kind: 'bang hội', note: 'Tên bắt đầu bằng từ chỉ bang hội/tổ chức' };
      if (hit(SCAN_PLACE_PREFIX, 'địa danh')) return { person: false, kind: 'địa danh', note: 'Tên bắt đầu bằng từ chỉ địa danh' };
      if (SCAN_FACTION_PREFIX.some(p => t.indexOf(' ' + p + key) >= 0)) return { person: false, kind: 'bang hội', note: 'Đứng sau từ chỉ bang hội/tổ chức' };
      if (SCAN_PLACE_PREFIX.some(p => t.indexOf(' ' + p + key) >= 0)) return { person: false, kind: 'địa danh', note: 'Đứng sau từ chỉ địa danh' };
      return { person: true, kind: 'người', note: '' };
    }
    async function aiScanNames(text, names) {
      const fallback = () => names.map(n => Object.assign({ name: n }, scanGuessKind(text, n)));
      const keys = (window.state.apiKeys || []).map(k => String(k).trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      if (!keys.length) return { items: fallback(), ai: false };
      const model = (window.state.currentModel || 'gemini-2.5-flash').trim().replace(/^models\//, '');
      const prompt = `Bạn là trợ lý đọc truyện, giúp lọc ra NHÂN VẬT (con người) trong cốt truyện.
[CỐT TRUYỆN]
${String(text).slice(0, 12000)}

[TÊN MÁY DÒ ĐƯỢC - CẦN LỌC]
${names.length ? names.map(n => '- ' + n).join('\n') : '(không có)'}

[QUY TẮC]
1. CHỈ trả về những tên là MỘT NGƯỜI cụ thể trong truyện: biết nói, hành động, xuất hiện, có vai trò.
2. TUYỆT ĐỐI không trả về tên bang hội, hội, môn phái, gia tộc, tổ chức, công ty, nhóm giang hồ (ví dụ "bang Hồng Hưng", "Đông Tinh" nếu trong truyện là tên bang), địa danh, con đường, toà nhà, món đồ, hay chức danh chung (bác sĩ, cảnh sát, phục vụ... nếu không phải một nhân vật có tên riêng).
3. Đọc cả cốt truyện và bổ sung những NGƯỜI có trong truyện mà máy dò còn thiếu.
4. Không bịa tên ngoài cốt truyện; gộp tên trùng; tối đa 20 người.
5. note: một câu ngắn dưới 12 từ nói người này là ai trong truyện.
6. isPerson luôn là true (chỉ trả về người).

Trả về ĐÚNG JSON thuần:
{"items":[{"name":"Nguyễn Văn An","isPerson":true,"kind":"người","note":"kiếm khách trẻ đi tìm sư phụ"}]}`;
      for (const key of keys) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
            body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) continue;
          let raw = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').replace(/```json/g, '').replace(/```/g, '').trim();
          const a = raw.indexOf('{'), b = raw.lastIndexOf('}');
          if (a < 0 || b < 0) continue;
          const items = (JSON.parse(raw.slice(a, b + 1)).items || [])
            .filter(it => it && typeof it.name === 'string' && it.name.trim())
            .filter(it => it.isPerson !== false)
            .map(it => ({
              name: String(it.name).trim().slice(0, 40),
              person: true,
              kind: 'người',
              note: String(it.note || '').trim().slice(0, 140)
            })).slice(0, 20);
          if (items.length) return { items, ai: true };
        } catch (err) {}
      }
      return { items: fallback(), ai: false };
    }
    function scanMergeItems(text, aiItems, names, existingNames) {
      const out = [], seen = new Set();
      const exists = (existingNames || []).map(scanKeyName);
      const push = (it) => {
        const k = scanKeyName(it.name);
        if (!k || seen.has(k)) return;
        seen.add(k);
        out.push({
          name: String(it.name).trim(), person: !!it.person,
          kind: it.person ? 'người' : (it.kind || 'khác'), note: it.note || '',
          already: exists.includes(k)
        });
      };
      (aiItems || []).forEach(it => {
        // AI lỡ gán "người" cho tên rõ ràng là bang hội/địa danh thì vẫn loại
        const guess = scanGuessKind(text, it.name);
        push(guess.person ? it : Object.assign({}, it, { person: false, kind: guess.kind }));
      });
      (names || []).forEach(n => push(Object.assign({ name: n }, scanGuessKind(text, n))));
      return out.slice(0, 24);
    }
    let scanPickCtx = null;
    function openScanPicker(items, ctx) {
      const box = document.getElementById('scan-pick-list');
      if (!box) return;
      const people = items.filter(it => it.person);
      scanPickCtx = { items: people, story: ctx.story, statusEl: ctx.statusEl || null };
      box.innerHTML = people.map((it, i) => {
        const checked = !it.already;
        return `<label style="display:flex;gap:8px;align-items:flex-start;padding:8px 9px;border:1px solid ${it.already ? '#e2e8f0' : '#cbd5e0'};border-radius:10px;margin-bottom:6px;background:${it.already ? '#f7fafc' : '#fff'};${it.already ? 'opacity:.62;' : ''}">
          <input type="checkbox" data-i="${i}" ${checked ? 'checked' : ''} ${it.already ? 'disabled' : ''} style="margin-top:2px;width:17px;height:17px;flex:none;">
          <span style="min-width:0;flex:1;">
            <span style="font-weight:bold;font-size:0.88rem;">${escapeHtml(it.name)}</span>
            <span style="font-size:0.7rem;color:#718096;">${it.already ? ' · đã có' : ''}</span>
            ${it.note ? `<span style="display:block;font-size:0.72rem;color:#4a5568;line-height:1.35;">${escapeHtml(it.note)}</span>` : ''}
          </span></label>`;
      }).join('');
      openModal('modal-scan-pick');
    }
    function confirmScanPick() {
      const ctx = scanPickCtx;
      const picked = [];
      document.querySelectorAll('#scan-pick-list input[type=checkbox]').forEach(el => {
        if (!el.checked || el.disabled) return;
        const it = ctx && ctx.items[+el.dataset.i];
        if (it) picked.push(it.name);
      });
      scanPickCtx = null;
      closeModal('modal-scan-pick');
      if (!ctx) return;
      const added = picked.length ? addScannedChars(ctx.story, picked) : [];
      if (ctx.story) ctx.story.updatedAt = Date.now();
      saveStorage();
      renderCharacterList();
      if (ctx.statusEl) {
        ctx.statusEl.innerText = added.length
          ? 'Đã thêm: ' + added.join(', ') + '. Bấm vào nhân vật để thêm tính cách và ảnh đại diện.'
          : (picked.length ? 'Những người này đã có trong danh sách nhân vật.' : 'Không thêm nhân vật nào.');
      }
    }
    async function startCharScan(opts) {
      const story = opts && opts.story;
      if (!story) return;
      const status = opts.statusEl || null;
      const text = String(opts.text || '');
      if (!text.trim()) { if (status) status.innerText = 'Chưa có nội dung cốt truyện để quét.'; return; }
      const existing = (story.characters || []).map(c => c.name);
      const names = scanStoryCharNames(text, existing);
      if (status) status.innerText = 'Đang đọc cốt truyện...';
      let res;
      try { res = await aiScanNames(text, names); }
      catch (e) { res = { items: names.map(n => Object.assign({ name: n }, scanGuessKind(text, n))) }; }
      const items = scanMergeItems(text, res.items, names, existing).filter(it => it.person);
      const fresh = items.filter(it => !it.already);
      if (!fresh.length) {
        if (status) status.innerText = 'Không tìm thấy người mới nào trong cốt truyện.';
        return;
      }
      if (status) status.innerText = '';
      openScanPicker(items, { story, statusEl: status });
    }

    function openAddCharModal() {
      document.getElementById('char-modal-title').innerText = '🎭 Thêm Nhân Vật';
      document.getElementById('char-edit-id').value = '';
      document.getElementById('char-name').value = ''; document.getElementById('char-avatar').value = '';
      const cut = document.getElementById('char-cutout'); if (cut) cut.value = '';
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
      const cut = document.getElementById('char-cutout'); if (cut) cut.value = char.cutout || '';
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
      const cutoutEl = document.getElementById('char-cutout');
      const cutout = cutoutEl ? cutoutEl.value.trim() : '';
      if (!name) return alert('Nhập tên nhân vật!');

      if (charId) {
        const c = story.characters.find(x => x.id === charId);
        if (c) { c.name = name; c.avatar = avatar || DEFAULT_LOGO; c.personality = personality; c.firstMsg = firstMsg; c.cutout = cutout; }
      } else {
        if (!story.characters) story.characters = [];
        story.characters.push({ id: 'char-' + Date.now(), name, avatar: avatar || DEFAULT_LOGO, personality, firstMsg, cutout });
      }
      story.updatedAt = Date.now();
      saveStorage(); renderCharacterList(); closeModal('modal-char');
    }

    // Dọn nhân vật vào ở chung / dọn đi: lưu vào nhân vật (đồng bộ cloud) + ghi 1 sự kiện vào lịch sử để AI nhớ
    function toggleCohabit(charId) {
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);
      const ch = story && story.characters ? story.characters.find(c => c.id === charId) : null;
      if (!ch) return;
      const me = activeStoryPersona(story).name || 'người chơi';
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

    // Cảnh mở đầu do người chơi nhập cũng có thể chứa thoại "..." và hành động *...*,
    // nên phải vẽ bằng bộ phân tích tin nhắn thay vì in thô như tin system.
    function isOpeningSceneMessage(msg, idx, story) {
      if (!msg || msg.sender !== 'system' || msg.event) return false;
      if (msg.opening) return true;
      // Save cũ chưa có cờ opening: nhận diện đúng tin đầu tiên trùng nội dung cảnh mở đầu
      return idx === 0 && !!story && !!story.openingScene &&
        String(msg.text || '').trim() === String(story.openingScene || '').trim();
    }

    function renderOpeningScene(text, story, container) {
      const lines = String(text || '').split('\n').filter(l => l.trim() !== '');
      const wrap = document.createElement('div');
      wrap.className = 'opening-scene';
      const speakerRe = /^\s*[\[\*]*([^:\[\]\*"\n]{1,40}?)[\]\*]*\s*:\s*(.*)$/;
      lines.forEach(line => {
        const cm = line.match(speakerRe);
        const speakers = cm ? resolveSpeakers(cm[1].trim(), (cm[2] || '').trim(), story) : [];
        if (!speakers.length) {
          const div = document.createElement('div');
          div.className = 'narrative-block ai-action';
          div.innerText = line.replace(/\*/g, '').trim();
          if (div.innerText) wrap.appendChild(div);
          return;
        }
        const tmp = document.createElement('div');
        parseAndRenderAiMessage(line, story, tmp, -1, null, null);
        Array.from(tmp.childNodes).forEach(node => {
          if (node.nodeType !== 1) return;
          if (node.classList.contains('msg-action-bar')) return;
          node.querySelectorAll('.msg-action-bar').forEach(b => b.remove());
          wrap.appendChild(node);
        });
      });
      container.appendChild(wrap);
    }

    function renderChatHistory() {
      updateModeBanner();
      const container = document.getElementById('chat-history');
      container.innerHTML = '';
      const history = (window.state.chatHistories && window.state.chatHistories[window.state.activeStoryId]) || [];
      const story = window.state.stories.find(s => s.id === window.state.activeStoryId);

      history.forEach((msg, idx) => {
        if (isOpeningSceneMessage(msg, idx, story)) {
          renderOpeningScene(msg.text, story, container);
        } else if (msg.sender === 'system') {
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

    // Thống nhất ngoặc: lời thoại dùng "..." ; từ đặc biệt/trích dẫn bên trong dùng '...' để không bị tách thành hai lời thoại
    function normQuotes(t) {
      t = t || '';
      if ((t.match(/"/g) || []).length >= 2) return t.replace(/[“”‘’]/g, "'");
      return t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    }
    // Trong lời thoại, **...** là in đậm/nhấn mạnh -> đổi sang '...' (không đụng tới từ che kiểu đ**)
    function tidyDialogue(t) {
      return (t || '').replace(/\*\*(?!\s)([^*]+?)(?<!\s)\*\*/g, "'$1'");
    }
    // ===== Chặn ký tự lạ / tiếng nước ngoài lọt vào lời AI =====
    const AI_FULLWIDTH_MAP = { '　': ' ', '！': '!', '＂': '"', '＇': "'", '（': '(', '）': ')', '，': ',', '．': '.', '：': ':', '；': ';', '？': '?', '、': ',', '。': '.', '【': '[', '】': ']', '［': '[', '］': ']' };
    function scrubAiText(t) {
      let s = String(t || ''), bad = 0;
      s = s.replace(/[\u3000\uFF01\uFF02\uFF07\uFF08\uFF09\uFF0C\uFF0E\uFF1A\uFF1B\uFF1F\u3001\u3002\u3010\u3011\uFF3B\uFF3D]/g, ch => { const m = AI_FULLWIDTH_MAP[ch]; if (m === undefined) bad++; return m || ''; });
      s = s.replace(/[\u0370-\u03FF\u0400-\u052F\u0530-\u058F\u0590-\u05FF\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u10A0-\u10FF\u1100-\u11FF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uFFE0-\uFFEE\uFFFD]/g, () => { bad++; return ''; });
      s = s.replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF\u00AD\uE000-\uF8FF\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
      s = s.replace(/\s+([,.;:!?%…])/g, '$1');
      s = s.replace(/([,;:])(?=\p{L})/gu, '$1 ').replace(/([.!?])(?=\p{L})/gu, '$1 ');
      s = s.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      return { text: s, bad };
    }
    const AI_UNACCENTED = /\b(khong|nguoi|nhung|duoc|trong|phai|cung|voi|minh|toi|nay|roi|sao|lam|noi|den|vao|len|xuong|nhieu|khac|chi|anh|em|ban)\b/gi;
    function aiTextNeedsFix(scrub) {
      if (scrub.bad > 0) return true;
      const body = scrub.text.replace(/\[[^\]]*\]/g, ' ');
      return (body.match(AI_UNACCENTED) || []).length >= 2;
    }
    // Nhờ AI soát lại chính tả/ngữ pháp khi phát hiện dấu hiệu lỗi (chỉ sửa câu chữ, giữ nguyên nội dung)
    async function fixAiVietnamese(text) {
      const first = scrubAiText(text);
      let out = first.text;
      if (!out || !aiTextNeedsFix(first)) return out;
      const keys = (window.state.apiKeys || []).map(k => String(k).trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      if (!keys.length) return out;
      const model = (window.state.currentModel || 'gemini-2.5-flash').trim().replace(/^models\//, '');
      const prompt = `Bạn là biên tập viên tiếng Việt của một nhà xuất bản, lấy "Từ điển tiếng Việt" của Viện Ngôn ngữ học (GS. Hoàng Phê chủ biên) làm chuẩn. Sửa lỗi chính tả, dấu thanh, ngữ pháp, từ dùng sai, từ không có trong từ điển và thay mọi ký tự lạ/tiếng nước ngoài lọt vào bằng tiếng Việt đúng nghĩa trong đoạn văn dưới đây.

[QUY TẮC]
- Giữ nguyên nội dung, cảm xúc, tên riêng và thứ tự các dòng; không thêm lời bình, không giải thích.
- Giữ nguyên định dạng: dòng [Tên Nhân Vật]:, đoạn *hành động*, lời thoại "...", các thẻ [SYSTEM_TRANSFER: ...] và [AFFECTION: ...] nếu có.
- Chỉ dùng tiếng Việt có dấu, câu đủ chủ ngữ - vị ngữ, đúng chính tả và đúng ngữ cảnh.
- Từ nào dùng sai nghĩa, sai từ loại, sai ngữ cảnh hoặc không có trong từ điển thì thay bằng từ đúng nghĩa và tự nhiên hơn; câu lủng củng, lặp từ, thiếu ý thì viết lại cho mượt mà đúng ngữ pháp, ý nghĩa không đổi.
- Chỉ trả về đoạn văn đã sửa, không kèm gì khác.

[ĐOẠN VĂN]
${out}`;
      for (const key of keys) {
        const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 45000);
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
            body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.15 } }),
            signal: ctl.signal
          });
          const data = await res.json().catch(() => ({}));
          clearTimeout(tm);
          if (!res.ok) continue;
          const raw = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').replace(/```[a-z]*/gi, '').replace(/```/g, '').trim();
          const fixed = scrubAiText(raw).text;
          if (!fixed || fixed.length < out.length * 0.55 || fixed.length > out.length * 1.8) continue;
          if (['[SYSTEM_TRANSFER', '[AFFECTION'].some(tg => out.indexOf(tg) >= 0 && fixed.indexOf(tg) < 0)) continue;
          return fixed;
        } catch (e) { clearTimeout(tm); }
      }
      return out;
    }
    // Dọn lỗi chính tả nhỏ khi hiển thị (không đụng vào dữ liệu đã lưu)
    function polishVi(t) {
      let s = String(t || '');
      if (!s) return s;
      const links = [];
      s = s.replace(/https?:\/\/[^\s]+|www\.[^\s]+|[\w.+-]+@[\w.-]+\.\w+/g, mm => { links.push(mm); return '\uE100' + (links.length - 1) + '\uE101'; });
      s = s.replace(/\u00A0/g, ' ');
      s = s.replace(/[ \t]{2,}/g, ' ');
      s = s.replace(/\s+([,.;:!?%…])/g, '$1');
      // "," giữa hai chữ số là dấu thập phân (12,5) -> không chèn space
      s = s.replace(/([,;:])(?=[\p{L}\d])/gu, (m, p, off, str) => (p === ',' && /\d/.test(str[off - 1] || '') && /\d/.test(str[off + 1] || '')) ? m : p + ' ');
      s = s.replace(/(^|[^\s])([.!?])(\p{L})/gu, (all, pre, p, c) => (/[A-Z]$/.test(pre) && /\p{Lu}/u.test(c)) ? all : pre + p + ' ' + c);
      s = s.replace(/(…)(?=\p{L})/gu, '$1 ');
      s = s.replace(/!{2,}/g, '!').replace(/\?{2,}/g, '?');
      s = s.replace(/\.{4,}/g, '...');
      // Dấu "…" hoặc "..." giữa câu thường là ngắt ý, không viết hoa theo
      s = s.replace(/(^|([.!?])\s+|\n\s*)(\p{Ll})/gu, (mm, sep, punct, c, off) => (punct === '.' && s[off - 1] === '.') ? mm : sep + c.toUpperCase());
      s = s.replace(/\uE100(\d+)\uE101/g, (mm, i) => links[+i] || mm);
      return s.trim();
    }
    // AI lỡ lồng "..." bên trong lời thoại ("Cậu là "thần tượng" của tớ.") -> đổi cặp bên trong thành '...' để không tách đôi câu
    function repairNestedQuotes(t) {
      const q = [];
      for (let i = 0; i < t.length; i++) if (t[i] === '"') q.push(i);
      if (q.length !== 4) return t;
      const inner = t.slice(q[1] + 1, q[2]);
      const words = inner.trim().split(/\s+/).filter(Boolean).length;
      if (!words || words > 6 || /["*]/.test(inner) || /[.!?…]/.test(inner)) return t;
      return t.slice(0, q[1]) + "'" + inner + "'" + t.slice(q[2] + 1);
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
      const me = activeStoryPersona();

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
      segs.forEach(sg => { sg.text = restoreStars(sg.text); if (sg.type === 'dialogue') sg.text = tidyDialogue(sg.text); });
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
            <img src="${me.avatar || DEFAULT_LOGO}" class="msg-avatar" onerror="this.src='${DEFAULT_LOGO}'">
            <div class="msg-bubble-wrap">
              <div class="msg-sender">${escapeHtml(me.name || 'Bạn')}</div>
              <div class="msg-bubble"><span class="dialogue-text">${escapeHtml(sg.text)}</span>${imgHtml}</div>${bar}
            </div>
          `;
          container.appendChild(div);
        }
      });
      if (filled.length === 0 && imgData) {
        const div = document.createElement('div'); div.className = 'chat-message user';
        div.innerHTML = `
          <img src="${me.avatar || DEFAULT_LOGO}" class="msg-avatar" onerror="this.src='${DEFAULT_LOGO}'">
          <div class="msg-bubble-wrap"><div class="msg-sender">${escapeHtml(me.name || 'Bạn')}</div><div class="msg-bubble"><img src="${imgData}" class="msg-img"></div>
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
    // "Nguyễn Văn An" còn được gọi "Văn An", "An" — mọi cách gọi đều là cùng một nhân vật
    const NAME_PRONOUNS = new Set('anh em chi co chu bac ong ba no han ta minh ban thay cau mo'.split(' '));
    // "Tô Đát Kỷ (Hồ Tiên Nhi)" → tên chính "Tô Đát Kỷ", tên gọi khác "Hồ Tiên Nhi".
    // Nhận diện được cả hai tên nhưng luôn ưu tiên tên ngoài ngoặc.
    function splitCharName(name) {
      const raw = String(name || '').trim();
      const alts = [];
      const re = /[（(]\s*([^（()）\[\]]+?)\s*[）)]/g;
      let m;
      while ((m = re.exec(raw)) !== null) {
        const t = m[1].replace(/\s+/g, ' ').trim();
        if (t && !/\d/.test(t) && !NAME_PRONOUNS.has(foldVi(t))) alts.push(t);
      }
      const primary = raw.replace(/[（(][^（()）\[\]]*[）)]/g, ' ').replace(/[\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
      return { primary: primary || raw.replace(/[\[\]]/g, ' ').replace(/\s+/g, ' ').trim(), alts };
    }
    function charNameParts(name) {
      return splitCharName(name).primary.split(/\s+/).filter(Boolean);
    }
    function aliasLabelsOf(s) {
      const p = String(s || '').trim().split(/\s+/).filter(Boolean);
      const out = [];
      if (p.length >= 2) out.push(p.slice(1).join(' '));
      if (p.length >= 3) out.push(p.slice(2).join(' '));
      if (p.length) out.push(p[p.length - 1]);
      if (p.length >= 3) out.push(p[0] + ' ' + p[p.length - 1]);
      return out;
    }
    function charAliasLabels(name) {
      const p = charNameParts(name);
      if (!p.length) return [];
      const out = [...aliasLabelsOf(p.join(' '))];
      splitCharName(name).alts.forEach(a => { out.push(a); aliasLabelsOf(a).forEach(x => out.push(x)); });
      return [...new Set(out)].filter(x => x && !NAME_PRONOUNS.has(foldVi(x)));
    }
    function charAliases(name) {
      const full = foldVi(charNameParts(name).join(' '));
      return [...new Set([full, ...charAliasLabels(name).map(foldVi)])].filter(Boolean);
    }
    function findCharByName(chars, label) {
      const list = chars || [];
      const rawKey = String(label || '').replace(/[\[\]]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
      if (!rawKey) return null;
      const asRaw = (c) => String(c.name || '').replace(/[\[\]]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
      const exactFull = list.find(c => asRaw(c) === rawKey);
      if (exactFull) return exactFull;
      const key = foldVi(rawKey);
      const exactPrimary = list.find(c => foldVi(charNameParts(c.name).join(' ')) === key);
      if (exactPrimary) return exactPrimary;
      const hits = list.filter(c => charAliases(c.name).includes(key));
      return hits.length === 1 ? hits[0] : null;
    }

    function resolveSpeakers(speakerRaw, restText, story) {
      if (!speakerRaw) return [];
      const chars = (story && story.characters) || [];
      const mk = (c) => ({ id: c.id, name: splitCharName(c.name).primary, avatar: c.avatar || DEFAULT_LOGO });
      const norm = (s) => foldVi(String(s || '').replace(/[\[\]]/g, ' ').replace(/\s+/g, ' ').trim());

      // Khớp họ tên đầy đủ, tên ngoài ngoặc hoặc bí danh; ưu tiên đúng tên chính trước
      const matchChar = (label) => findCharByName(chars, label);

      const whole = matchChar(speakerRaw);
      if (whole) return [mk(whole)];

      const userName = norm(activeStoryPersona(story).name || '');
      if (userName && norm(speakerRaw) === userName) return [];

      const q = normQuotes(restText);
      const hasDlg = (q.match(/"/g) || []).length >= 2;
      const okNpcName = (n) => n.length <= 30 && n.split(/\s+/).length <= 4 && !/^(lưu ý|chú thích|ghi chú|bối cảnh|hệ thống|dẫn truyện|tóm tắt)/i.test(n);

      const parts = speakerRaw.split(/\s*(?:&|\+|,|\/)\s*|\s+và\s+/i).map(s => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        const out = [];
        parts.forEach(p => {
          const f = matchChar(p);
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
    // Tên gọi trong đoạn hành động: 2 chữ -> giữ nguyên; từ 3 chữ trở lên -> 2 chữ cuối hoặc tên đầy đủ (ngẫu nhiên nhưng cố định theo từng đoạn)
      function actionCallName(name, seed) {
        const p = charNameParts(name);
        if (p.length <= 2) return p.join(' ');
          let h = 0;
          const s = name + '|' + seed;
          for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
            return h % 2 ? p.join(' ') : p.slice(-2).join(' ');
    }
// Đoạn hành động đã mở đầu bằng tên nhân vật (đủ tên hoặc tên gọi tắt) chưa?
    function actionHasName(t, name) {
      const f = foldVi(t).replace(/^[\s*_\[]+/, '');
      return charAliases(name).some(a => f === a || f.startsWith(a + ' '));
    }

    function parseAndRenderAiMessage(fullText, story, container, msgIndex, transfers, affection) {
      const barsBefore = container.querySelectorAll('.msg-action-bar').length;
      // ⚡ LỌC ẨN TOÀN BỘ CÁC THẺ LỆNH HỆ THỐNG / ACTION / EVENT KHỎI MÀN HÌNH CHÁT
      fullText = stripUserVoice(cleanAiTags(fullText), activeStoryPersona(story).name);

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
              nDiv.innerText = polishVi(narrText); // văn tả: bỏ tiền tố "Tên:" của người không có thoại
              
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

          restText = repairNestedQuotes(protectStars(normQuotes(restText)));
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

          segs.forEach(sg => { sg.text = polishVi(restoreStars(sg.text)); if (sg.type === 'dialogue') sg.text = tidyDialogue(sg.text); });
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
              let actText = seg.text;
        if (!actionHasName(actText, sp.name)) {
  actText = actionCallName(sp.name, msgIndex + '-' + lineIdx + '-' + segIdx) + ' ' + actText.charAt(0).toLowerCase() + actText.slice(1);
}
actDiv.innerText = actText;

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
      const me = activeStoryPersona(story);
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

      let charsPrompt = ((story && story.characters) || []).map(c => {
        const nm = splitCharName(c.name);
        const al = [...new Set([...nm.alts, ...charAliasLabels(c.name)])];
        const aliasNote = al.length ? ` (cùng một người, người chơi có thể gọi: ${al.join(', ')})` : '';
        return `- ${nm.primary}${aliasNote}: ${c.personality}`;
      }).join('\n');

      const hintBlock = hintText ? `\n[GHI CHÚ HỆ THỐNG CHO LƯỢT NÀY]\n${hintText}\n` : '';
      const activeModeNow = (window.state.activeMode || {})[storyId];
      let modeBlock = '';
      if (activeModeNow && MODES[activeModeNow.mode]) {
        const modeChar = story && story.characters ? story.characters.find(c => c.id === activeModeNow.charId) : null;
        if (modeChar) modeBlock = `\n[CHẾ ĐỘ TRÒ CHUYỆN ĐANG BẬT]\n${MODES[activeModeNow.mode].prompt(modeChar.name)}\n`;
      }

      // Đã lâu chưa có biến cố: gợi ý AI thêm một tình huống căng thẳng nhỏ ngay trong cảnh hiện tại
      let dramaBlock = '';
      if (!modeBlock) {
        const userTurns = storyUserTurns(storyId);
        if (story && storyDramaDue(story, userTurns)) {
          markStoryDrama(story, userTurns);
          saveStorage();
          dramaBlock = `\n[NHỊP TRUYỆN - ĐÃ LÂU CHƯA CÓ BIẾN]
Đã nhiều lượt trôi qua yên ả. Ở lượt này, hãy để một tình huống căng thẳng nhỏ nảy ra NGAY TRONG cảnh hiện tại: một câu nói chạm lòng, một hiểu lầm, một người quen cũ thoáng xuất hiện, một tin nhắn hoặc cuộc gọi bất ngờ, hay một trở ngại khiến nhân vật phải phản ứng. Giữ đúng bối cảnh, tính cách và mạch truyện; không nhảy thời gian, không thêm biến cố lớn không thể đảo ngược, không giải quyết mâu thuẫn ngay trong lượt này. Chỉ mở ra rồi dừng ở khoảnh khắc căng thẳng để người chơi quyết định.
`;
        }
      }

      let cohabBlock = '';
      if (story && story.characters) {
        const meN = me.name || 'người chơi';
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
      let themeMemBlock = '';
      if (story && Array.isArray(story.themeMemories) && story.themeMemories.length) {
        const lines = story.themeMemories.slice(-6).map(m => {
          let d = '';
          try { d = new Date(m.ts).toLocaleDateString('vi-VN') + ': '; } catch (e) {}
          return `- ${d}${m.text}`;
        });
        themeMemBlock = `[KÝ ỨC HOẠT ĐỘNG CHỦ ĐỀ - SỰ THẬT ĐÃ XẢY RA] Những hoạt động dưới đây đã thật sự diễn ra giữa người chơi và nhân vật trong hoạt động riêng. Nhân vật nhớ rõ, có thể nhắc lại tự nhiên khi phù hợp, không kể lại máy móc toàn bộ:\n${lines.join('\n')}\n`;
      }
      const systemInstruction = `
[QUY TẮC NHẬP VAI & BÁM SÁT CỐT TRUYỆN BẮT BUỘC]
1. Bối cảnh kịch bản: "${(story && story.setting) || ''}".
2. Cảnh mở đầu: "${(story && story.openingScene) || ''}".
3. Các nhân vật bạn nhập vai:
${charsPrompt}
4. Thông tin cấp độ thân mật hiện tại của các nhân vật với người chơi:
${charAffectionSummary}${cohabBlock}${petMemBlock}${themeMemBlock}
5. Người tương tác: "${me.name || 'người chơi'}" (${me.memories || ''}).

[NHẬN DIỆN TÊN NHÂN VẬT & LỜI GỌI]
- Tên đầy đủ, tên riêng, tên gọi tắt và biệt danh của cùng một nhân vật đều là CÙNG MỘT NGƯỜI. Ví dụ nhân vật "Nguyễn Văn An" thì "Văn An", "An", "bạn An" đều là An.
- Tên nằm trong ngoặc sau tên chính là tên gọi khác của CÙNG nhân vật đó (ví dụ "Tô Đát Kỷ (Hồ Tiên Nhi)" thì "Hồ Tiên Nhi" cũng là Tô Đát Kỷ). Khi viết dòng thoại, LUÔN dùng tên ngoài ngoặc làm tên chính.
- Người chơi gọi nhân vật bằng bất kỳ cách nào ở trên → nhân vật đó là người xuất hiện, phản hồi, lên tiếng (dòng thoại ghi ĐÚNG tên đầy đủ trong danh sách, không ghi tên gọi tắt).
- Người chơi nhắc tới nhân vật (kể cả gián tiếp qua đại từ, biệt danh) → hiểu là đang nói về nhân vật đó, không coi là người mới.
- TUYỆT ĐỐI không tạo thêm nhân vật trùng hoặc gần giống một nhân vật đã có chỉ vì tên được gọi khác đi.

[QUY TẮC CHIỀU SÂU THÂN MẬT & MỐI QUAN HỆ]
- Nếu mối quan hệ là NGƯỜI YÊU / LÃNG MẠN và Level thân mật cao (Lv.10, Lv.20, Lv.40, Lv.60 trở lên): Nhân vật sẽ cực kỳ bám người, quấn quýt, thể hiện tình cảm mãnh liệt, nồng cháy. Các phân cảnh thân mật, âu yếm (18+) được miêu tả chi tiết, cảm xúc và sâu sắc hơn.
- Nếu mối quan hệ là TRI KỶ / ANH EM / BẠN BÈ và Level cao: Nhân vật trở thành chỗ dựa vững chắc, sẵn sàng tâm sự, thấu hiểu, giúp đỡ nhiệt tình hết mình khi người chơi gặp khó khăn.

[CẤM TUYỆT ĐỐI - LỖI NGHÊM TRỌNG]
⛔ KHÔNG ĐƯỢC TỰ Ý VIẾT LỜI THOẠI, HÀNH ĐỘNG, CẢM XÚC HOẶC SUY NGHĨ CHO "${me.name || 'người chơi'}" (người chơi). Người chơi là người DUY NHẤT quyết định mình nói gì, làm gì, nghĩ gì.
⛔ KHÔNG ĐƯỢC sinh ra bất kỳ dòng nào bắt đầu bằng tên người dùng, kể cả dạng [Tên]: hay *Tên + hành động*. Khi đến lượt người dùng tương tác, PHẢI DỪNG LẠI NGAY LẬP TỨC.
⛔ Không viết câu kể người chơi đã nói/gật đầu/đáp/mỉm cười/cảm thấy/quyết định gì, cũng không "đoán trước" câu trả lời của người chơi. Chỉ được tả PHẢN ỨNG BÊN NGOÀI của nhân vật (ánh mắt, giọng điệu, cử chỉ của CHÍNH nhân vật) trước những gì người chơi ĐÃ viết trong lượt trước.
⛔ TUYỆT ĐỐI không viết dòng nào có chủ ngữ là người chơi (ví dụ "${me.name || 'người chơi'} nói...", "${me.name || 'người chơi'} gật đầu...") và không đặt lời thoại, hành động, suy nghĩ của người chơi vào trong ngoặc kép hay dấu * của bất kỳ ai. Nếu cần nhắc đến người chơi, chỉ mô tả cái NHÂN VẬT nhìn thấy/nghe thấy từ những gì người chơi ĐÃ viết.
⛔ Mỗi lượt kết thúc bằng lời nói hoặc hành động của NHÂN VẬT (có thể là một câu hỏi, một lời mời) để trao lượt lại cho người chơi, không viết tiếp diễn biến sau đó.

[NGUYÊN TẮC QUAN TRỌNG & CHỐNG SAI LỆCH]
- DIỄN BIẾN CHI TIẾT & ĐẬM CHẤT DRAMA: Mỗi lượt chỉ tập trung vào khoảnh khắc hiện tại nhưng phải kể thật sâu: tả cụ thể không gian, âm thanh, ánh sáng, nét mặt, hơi thở, cử chỉ và cảm xúc ẩn sau hành động. Trong mỗi lượt phải có ít nhất một lớp căng thẳng nhỏ (một ánh mắt né tránh, một câu nói hai nghĩa, một khoảng lặng khó xử, một chi tiết bất an) để diễn biến có sức nặng chứ không phẳng. Lời thoại đúng khẩu khí, có thể cộc hoặc mềm, nhưng phải để lộ thái độ. Không gói nhiều sự việc vào một lượt; độ dài đủ để tả kỹ khoảnh khắc, không lan man.
- TUYỆT ĐỐI KHÔNG TUA TRUYỆN: Không tự chuyển sang "một lúc sau", "hôm sau", "vài ngày sau", "cuối cùng" hay tóm tắt nhiều sự việc để đi nhanh. Chỉ khi người chơi chủ động nhắc tới thời điểm hoặc cảnh khác thì mới theo, và vẫn kể chậm từng nhịp ở cảnh mới.
- KHÔNG TỰ ĐẨY SANG TÌNH HUỐNG MỚI: Để người chơi quyết định bước tiếp theo. Lượt trả lời dừng ở một khoảng lặng tự nhiên (một câu hỏi, ánh mắt chờ, một hành động dở dang), không tự giải quyết mâu thuẫn vừa mở và không tự thêm biến cố lớn.
- CẤM BỊA ĐẶT: Chỉ những gì ĐÃ XUẤT HIỆN trong lịch sử chat mới là sự thật đã xảy ra. Phần "Bối cảnh kịch bản" chỉ là thiết lập/hướng đi, KHÔNG phải sự kiện đã xảy ra. Tuyệt đối không tự bịa hoặc nhớ nhầm những sự kiện, mối quan hệ, chi tiết lớn chưa từng diễn ra (như có con, mang thai, kết hôn, qua đời, mất trí nhớ, tai nạn...) và không tiết lộ trước tình tiết tương lai. Người chơi chưa dẫn tới thì chưa xảy ra. Mỗi lượt chỉ mở thêm một chi tiết nhỏ, hợp lý.
- BÁM SÁT CỐT TRUYỆN & NHÂN VẬT: Mọi diễn biến, lời thoại đúng tính cách, xưng hô cố định. Luôn đối chiếu với bối cảnh kịch bản, cảnh mở đầu và những gì đã diễn ra trong lịch sử chat; mỗi lượt đẩy truyện tiến một bước RẤT nhỏ ĐÚNG HƯỚNG cốt truyện, không lạc đề, không tự thêm nhân vật hay tình tiết mâu thuẫn với những gì đã có. Không đổi hướng đột ngột, TRỪ KHI người chơi chủ động đổi hướng. Diễn biến chậm rãi như thời gian thật, không được lướt quá nhanh đến hết cốt truyện: chỉ người chơi quyết định đến cảnh nào, còn lại chỉ trao đổi để chi tiết hoá tình tiết tại đó.
- ƯU TIÊN DIỄN BIẾN HIỆN TẠI: Cốt truyện là nền tảng phải bám sát để giữ đúng thế giới và nhân vật, nhưng khi người chơi tự biến tấu thêm tình tiết, thay đổi chi tiết nhỏ hay đẩy câu chuyện sang hướng mới thì DIỄN BIẾN HIỆN TẠI do người chơi tạo ra là sự thật mới và được ưu tiên.
  + Tiếp nhận thay đổi đó một cách tự nhiên, có phản ứng hợp lý, không phủ định, không kéo câu chuyện quay lại đoạn cũ, không nhắc "theo cốt truyện thì..." hay tỏ ra khó chịu.
  + Khéo léo dung hoà: giữ được tinh thần, bối cảnh và tính cách nhân vật của cốt truyện, đồng thời nối phần người chơi vừa thêm vào cho liền mạch, như thể cốt truyện vốn đã đi theo hướng đó.
  + Chỉ khi người chơi thêm chi tiết phá vỡ hoàn toàn logic đã thiết lập (mâu thuẫn trực tiếp với sự kiện đã xảy ra) thì mới xử lý nhẹ nhàng bằng phản ứng của nhân vật, không gay gắt sửa sai người chơi.
- TÊN TRONG HÀNH ĐỘNG: Mỗi đoạn hành động PHẢI nêu rõ tên nhân vật đang thực hiện ngay trong câu.
- 18+: Thoải mái trò chuyện và mô tả chi tiết, cảm xúc khi cần thiết theo tình huống không lãng đi hay né tránh.

[TÍNH NĂNG CHUYỂN TIỀN TỰ ĐỘNG CỦA NHÂN VẬT]:
- Khi người dùng xin tiền, mượn tiền hoặc đòi tiền, dựa vào tính cách nhân vật và độ thân mật để quyết định CÓ CHUYỂN TIỀN HAY KHÔNG.
- Nếu ĐỒNG Ý, chèn cú pháp sau vào cuối hoặc trong câu trả lời:
  [SYSTEM_TRANSFER: số_tiền_nguyên | Lời nhắn kèm theo]
  (Ví dụ: [SYSTEM_TRANSFER: 20000000 | Tiền tiêu vặt cho em đấy])
- Nếu KHÔNG, chỉ từ chối bằng lời thoại đúng tính cách.

[DÙNG TỪ - CHUẨN TỪ ĐIỂN TIẾNG VIỆT]
- Lấy "Từ điển tiếng Việt" của Viện Ngôn ngữ học (GS. Hoàng Phê chủ biên) làm chuẩn cho mọi từ được dùng: đúng từ loại, đúng nghĩa gốc, đúng nghĩa đang dùng trong câu và đúng ngữ cảnh. Không tự chế từ, không ghép từ vô nghĩa, không dùng từ lệch nghĩa, không dùng thành ngữ - tục ngữ sai nghĩa hay đảo trật tự từ trong thành ngữ.
- Trước khi dùng một từ ít gặp hoặc một từ Hán Việt, tự soát: từ này có nghĩa rõ ràng không, nghĩa đó có khớp điều mình muốn nói không, có hợp trình độ - tính cách - vùng miền của nhân vật không. Không chắc thì đổi sang từ thông dụng mà mình chắc chắn đúng nghĩa.
- Ưu tiên từ thuần Việt và từ Hán Việt đã Việt hoá quen thuộc; tránh từ dịch thô từ tiếng nước ngoài, tránh từ đa nghĩa gây hiểu nhầm, tránh từ lóng không hợp nhân vật.
- Câu văn theo đúng ngữ pháp tiếng Việt: trật tự từ tự nhiên (chủ ngữ - vị ngữ - bổ ngữ đúng chỗ), dùng đúng loại từ và lượng từ (một con mèo, một cái ghế, đôi mắt ấy...), dùng đúng phó từ chỉ thời - thể (đã, đang, sẽ, vừa, từng, sắp).
- Dùng đúng cặp quan hệ từ và đúng cấu trúc câu tiếng Việt (vì... nên..., tuy... nhưng..., không những... mà còn...); không bỏ vế, không ghép hai cấu trúc khác nhau vào một câu.

[VĂN PHONG]
- Viết tiếng Việt tự nhiên, mượt mà, giàu hình ảnh và cảm xúc như tiểu thuyết: câu văn có nhịp điệu, câu dài ngắn đan xen, chọn từ tinh tế, tả cử chỉ - ánh mắt - không khí cụ thể thay vì liệt kê khô khan. Tránh lặp từ, tránh câu cụt lủn, tránh sáo rỗng, tránh lạm dụng từ "rất", "cực kỳ", "vô cùng". Lời thoại đúng khẩu khí từng nhân vật, câu nói của mỗi người phải đọc lên thấy đúng là người đó đang nói.

[CHÍNH TẢ & CÂU CÚ - BẮT BUỘC]
- Toàn bộ câu trả lời CHỈ dùng tiếng Việt có dấu. TUYỆT ĐỐI không chèn chữ Hán, chữ Nhật, chữ Hàn, chữ Nga, chữ Thái hay bất kỳ ký tự nước ngoài/ký tự lạ nào; không chen từ tiếng Anh vào câu (trừ tên riêng/thương hiệu bắt buộc phải giữ nguyên).
- Viết đúng chính tả tiếng Việt, đủ dấu thanh, đúng dấu hỏi/ngã đúng như từ điển ghi; không viết tắt kiểu "k", "ko", "kh", "j", "dc", "đc", "vs", "ntn", "r", "uk".
- Dùng từ đúng nghĩa và đúng ngữ cảnh của câu, đúng tính cách/nghề nghiệp/vùng miền của nhân vật; không dùng từ lệch nghĩa, không dịch máy từng chữ, không ghép từ vô nghĩa.
- Mỗi câu phải đủ chủ ngữ - vị ngữ và kết thúc bằng dấu câu (., ?, ! hoặc …). Không viết câu rời rạc thiếu vị ngữ, không nối nhiều ý bằng dấu phẩy thành một câu dài lê thê.
- Câu phải đọc lên xuôi tai: nếu phải ngắt hơi giữa cụm từ mới hiểu, hoặc phải đọc lại hai lần mới rõ ý thì viết lại câu đó cho gọn và sáng nghĩa.
- Viết hoa đầu câu, sau dấu chấm/hỏi/than và tên riêng. Không viết hoa giữa câu cho đẹp.
- Không dùng dấu câu lặp (!!!, ???, ....); không đặt dấu cách trước dấu phẩy/chấm; mỗi dấu phẩy/chấm chỉ một dấu cách phía sau.
- Xưng hô thống nhất trong toàn bộ câu trả lời và đúng thiết lập nhân vật; không đổi cách gọi giữa các câu.
- Trước khi trả lời, tự đọc lại từng câu như một biên tập viên soát bản thảo: sai chính tả, thiếu dấu, lặp từ, từ lệch nghĩa, lẫn ký tự lạ, câu cụt hoặc lủng củng thì viết lại cho đúng và mượt rồi mới xuất ra.

[QUY TẮC DẤU NGOẶC TRONG LỜI THOẠI]
- Lời thoại luôn đặt trong một cặp ngoặc kép thẳng "..." duy nhất cho mỗi câu nói.
- Từ đặc biệt nằm BÊN TRONG lời thoại (nhấn mạnh, trích dẫn, từ lóng, biệt danh) PHẢI đặt trong nháy đơn '...' (ví dụ: "Nó đúng là 'ba hoa' thật.").
- TUYỆT ĐỐI KHÔNG dùng **...** (in đậm) trong lời thoại. Bộ đọc chat hiểu ** là dấu mở đoạn hành động nên câu sẽ bị cắt đôi.
- TUYỆT ĐỐI KHÔNG lồng thêm "..." hay “...” bên trong lời thoại, kể cả để nhấn mạnh hay trích dẫn: sẽ bị hiểu nhầm thành hai lời thoại rời rạc. Phần bên trong chỉ dùng '...'.
- Lời nói của nhân vật LUÔN đặt riêng trong "...", tuyệt đối không nhét lời nói vào giữa đoạn mô tả hành động/cảm xúc (không viết kiểu *Anh nhìn cô, nói "..."*): hãy viết đoạn hành động riêng rồi lời thoại riêng.
- Dấu * chỉ dùng để bao quanh đoạn hành động/cử chỉ. KHÔNG dùng * hay ** để nhấn mạnh, in đậm hay che chữ trong lời thoại (không viết kiểu đ**, c*c).

[ĐỊNH DẠNG ĐẦU RA - BẮT BUỘC]
- Mỗi nhân vật phát ngôn nằm riêng trên một dòng dạng:
[Tên Nhân Vật]: *Tên Nhân Vật + hành động ngắn* "lời thoại ngắn"
- Hai nhân vật cùng nói thì viết MỖI NGƯỜI MỘT DÒNG RIÊNG, tuyệt đối không ghép tên bằng dấu & hoặc chữ "và".
- Nhân vật phụ chưa có trong danh sách (bác sĩ, y tá, phục vụ, bảo vệ...) khi NÓI phải viết thành dòng riêng dạng [Tên hoặc chức danh]: "lời thoại" (dùng một tên nhất quán). KHÔNG nhét lời thoại của họ vào câu hành động hay đoạn tả.
- Đoạn tả cảnh/dẫn truyện viết thành dòng riêng, KHÔNG có tiền tố "Tên:" phía trước.
- Cuối câu trả lời, CHỈ KHI thái độ/tình cảm của nhân vật dành cho người chơi thay đổi rõ rệt do lời nói hoặc hành động trong lượt này, thêm thẻ ở dòng cuối: [AFFECTION: Tên Nhân Vật | +2] (số nguyên từ -3 đến +3: dương = thân mật hơn, âm = giảm; mức thường dùng là +2, khoảnh khắc đặc biệt xúc động/ngọt ngào là +3, bị tổn thương hay giận dỗi thì -1 đến -3). Thẻ này chỉ để hệ thống đọc, người chơi không nhìn thấy. Tuyệt đối KHÔNG viết số điểm thân mật (+2, -1...) hay chữ "thân mật" kèm số ở bất kỳ chỗ nào khác trong câu trả lời, chỉ dùng đúng định dạng thẻ này. Mỗi nhân vật tối đa một thẻ. Không có biến động thì KHÔNG thêm thẻ.
${dramaBlock}${modeBlock}${hintBlock}
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

      // Soát lại chính tả/ngữ pháp trước khi lưu (chỉ khi thấy dấu hiệu lỗi, tránh làm chậm mọi lượt)
      if (responseText) responseText = await fixAiVietnamese(responseText);

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
        const cleaned = stripUserVoice(cleanAiTags(responseText), me.name);

        const totalIn = transfers.reduce((s, t) => s + t.amount, 0);
        if (totalIn > 0) window.state.walletBalance = (window.state.walletBalance || 0) + totalIn;

        // THÂN MẬT KHI CHAT: đọc thẻ [AFFECTION: Tên | +n] đúng 1 lần, ép về -3..+3
        const affChanges = [];
        const are = /\[\s*AFFECTION\s*[:：]\s*([^|\]]+?)\s*\|\s*([+\-−–]?\s*\d+)\s*\]/gi;
        let am;
        while ((am = are.exec(responseText)) !== null) {
          const ch = findCharByName((story && story.characters) || [], am[1]);
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
