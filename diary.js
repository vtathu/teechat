// ===================== NHẬT KÝ NHÂN VẬT =====================
// Nhật ký do chính nhân vật viết, mỗi buổi/ món quà là vài đoạn liền nhau.
const DIARY_MAX = 200;
const DIARY_MAX_PASSAGES = 4;
const DIARY_MIN_PASSAGES = 2;

function diaryEnsure(story) {
  if (!story) return [];
  if (!Array.isArray(story.diary)) story.diary = [];
  return story.diary;
}

function diaryNewGroup() {
  return 'g' + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
}

function diaryPlayerRef(story) {
  let n = '';
  try {
    if (typeof activeStoryPersona === 'function') n = String((activeStoryPersona(story) || {}).name || '').trim();
  } catch (e) {}
  if (!n) n = String(((window.state && window.state.persona) || {}).name || '').trim();
  return (!n || /^bạn$/i.test(n)) ? 'cậu ấy' : n;
}

function diaryDayKey(ts) {
  const d = new Date(Number(ts) || Date.now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function diaryDayLabel(ts) {
  const d = new Date(Number(ts) || Date.now());
  const year = d.getFullYear() === new Date().getFullYear() ? '' : `, ${d.getFullYear()}`;
  return `Ngày ${d.getDate()} tháng ${d.getMonth() + 1}${year}`;
}

function diaryKeys() {
  return (window.state.apiKeys || [])
    .map(k => String(k).trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

async function diaryAiText(prompt) {
  const keys = diaryKeys();
  const model = String(window.state.currentModel || 'gemini-2.5-flash').trim().replace(/^models\//, '');
  for (const key of keys) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.95 }
        })
      });
      if (!res.ok) continue;
      const data = await res.json().catch(() => ({}));
      const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
      const text = parts.map(p => (p && p.text) || '').join('').trim();
      if (text) return text;
    } catch (e) {}
  }
  return '';
}

// Tách văn bản AI thành 2-4 đoạn liền mạch, bỏ tiêu đề/đánh số nếu có.
function diaryParsePassages(text) {
  let raw = String(text || '').replace(/\r/g, '').trim();
  raw = raw.replace(/^["“”']+|["“”']+$/g, '').trim();
  if (!raw) return [];
  let parts = raw.split(/\n\s*\n+/).map(s => s.trim()).filter(Boolean);
  if (parts.length < 2) {
    const lines = raw.split(/\n+/).map(s => s.trim()).filter(Boolean);
    if (lines.length >= 2) parts = lines;
  }
  parts = parts
    .map(p => p.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim())
    .filter(Boolean);
  if (!parts.length) return [];
  if (parts.length > DIARY_MAX_PASSAGES) {
    const merged = [];
    const per = Math.ceil(parts.length / DIARY_MAX_PASSAGES);
    for (let i = 0; i < parts.length; i += per) merged.push(parts.slice(i, i + per).join(' '));
    parts = merged;
  }
  if (parts.length < DIARY_MIN_PASSAGES && parts.length === 1) {
    const sents = parts[0].split(/(?<=[.!?…])\s+/).filter(Boolean);
    if (sents.length >= 3) {
      const mid = Math.ceil(sents.length / 2);
      parts = [sents.slice(0, mid).join(' '), sents.slice(mid).join(' ')];
    }
  }
  return parts.map(p => p.slice(0, 900));
}

// Mọi đoạn của cùng một lần viết chia chung group để hiện thành một trang nhật ký.
function diaryAddGroup(story, kind, char, texts, ts) {
  if (!story) return [];
  const list = diaryEnsure(story);
  const clean = (texts || []).map(t => String(t || '').trim()).filter(Boolean);
  if (!clean.length) return [];
  const group = diaryNewGroup();
  const base = Number(ts) || Date.now();
  const made = clean.map((text, i) => ({
    id: group + '-' + i,
    ts: base + i,
    kind,
    charId: char ? char.id : '',
    charName: char ? char.name : '',
    authorId: char ? char.id : '',
    authorName: char ? char.name : '',
    group,
    text,
    ai: false
  }));
  list.push(...made);
  if (list.length > DIARY_MAX) list.splice(0, list.length - DIARY_MAX);
  if (typeof saveStorage === 'function') saveStorage();
  return made;
}

function diaryApplyPassages(story, group, meta, passages) {
  const list = diaryEnsure(story);
  const idx = list.findIndex(e => e.group === group);
  const head = idx >= 0 ? list.slice(0, idx) : list.slice();
  const rest = idx >= 0 ? list.slice(idx).filter(e => e.group !== group) : [];
  const base = (meta && meta.ts) || Date.now();
  const fresh = passages.map((text, i) => ({
    id: group + '-' + i + '-' + Math.floor(Math.random() * 1000),
    ts: base + i,
    kind: (meta && meta.kind) || 'note',
    charId: (meta && meta.charId) || '',
    charName: (meta && meta.charName) || '',
    authorId: (meta && meta.authorId) || '',
    authorName: (meta && meta.authorName) || '',
    group,
    text,
    ai: true
  }));
  let out = head.concat(fresh, rest);
  if (out.length > DIARY_MAX) out = out.slice(out.length - DIARY_MAX);
  story.diary = out;
  if (typeof saveStorage === 'function') saveStorage();
}

function diaryRefreshIfOpen() {
  const ov = document.getElementById('diary-overlay');
  if (ov && !ov.classList.contains('hidden')) renderDiary();
}

async function diaryRewriteGroup(story, entries, prompt) {
  if (!entries || !entries.length || !diaryKeys().length) return;
  const text = await diaryAiText(prompt);
  if (!text || text.length < 40) return;
  const passages = diaryParsePassages(text);
  if (passages.length < DIARY_MIN_PASSAGES) return;
  diaryApplyPassages(story, entries[0].group, entries[0], passages);
  diaryRefreshIfOpen();
}

function diaryCharLine(char) {
  const p = String((char && char.personality) || '').trim();
  return p ? `${char.name} — ${p}` : (char && char.name) || 'nhân vật';
}

function diaryActivityPrompt(story, theme, char, session, memory) {
  const me = diaryPlayerRef(story);
  const picks = ((session && session.picks) || [])
    .map(p => String(p.label || '').trim())
    .filter(Boolean)
    .join('; ');
  return `Bạn viết nhật ký thay cho một nhân vật trong câu chuyện đời thường. Nhân vật tự ghi lại chuyện vừa xảy ra trong sổ riêng của mình.

[NGƯỜI VIẾT] ${diaryCharLine(char)}
[NGƯỜI ĐI CÙNG] ${me}
[HOẠT ĐỘNG] ${theme.name} — ${theme.tagline}
[DIỄN BIẾN] ${memory}
[NHỮNG ĐIỀU ${me} ĐÃ CHỌN] ${picks || '(không rõ)'}

[QUY TẮC]
- Ngôi thứ nhất, nhân vật xưng "mình", gọi người kia là "${me}" hoặc "cậu ấy". Viết như tự nhủ, không phải kể cho ai nghe.
- Viết thành 2-3 đoạn ngắn liền nhau, cách nhau một dòng trống, như viết liền một hơi: đoạn sau có thể là nghĩ lại, bổ sung cảm xúc, hoặc chuyện xảy ra lúc về.
- Câu ngắn, đời thường, có một chi tiết nhỏ đáng nhớ và một chút cảm xúc thật.
- Đôi khi nhân vật thấy ngại nên gạch bỏ giữa chừng: dùng ~~cụm từ~~ cho một cụm từ bị gạch. Chỉ thỉnh thoảng, không phải đoạn nào cũng có.
- Không tiêu đề, không nhắc điểm số, phần thưởng, hệ thống hay tên game.
- Chỉ trả về các đoạn nhật ký, không thêm lời dẫn.`;
}

// ---- Nhật ký theo ngày: mỗi nhân vật chỉ nhớ phần chuyện trò có mình, viết vào cuối ngày ----
function diaryChatText(m) {
  let t = String((m && m.text) || '')
    .replace(/\[USER_TRANSFER:[^\]]*\]/gi, '')
    .replace(/\[SYSTEM_TRANSFER:[^\]]*\]/gi, '');
  if (typeof cleanAiTags === 'function') t = cleanAiTags(t);
  return t.replace(/\s+/g, ' ').trim();
}

function diaryChatQuote(t) {
  let s = String(t || '').replace(/^\s*\[[^\]]{1,40}\]\s*[:：]?\s*/, '').replace(/[*_~"“”]/g, '').replace(/^[:：\s]+/, '').replace(/\s+/g, ' ').trim();
  if (s.length > 110) s = s.slice(0, 110).trim() + '…';
  return s;
}

// Tách một tin của AI thành từng câu thoại kèm id nhân vật nói câu đó.
// Dùng chung cách nhận tên với khung chat để "Văn An", "An" vẫn là cùng một người.
function diaryMessageSegments(text, story) {
  const segs = [];
  String(text || '').split('\n').forEach(line => {
    const s = line.trim();
    if (!s) return;
    const m = s.match(/^\s*[\[\*]*([^:\[\]\*"\n]{1,40}?)[\]\*]*\s*:\s*(.*)$/);
    const speaker = m ? m[1].trim() : '';
    const rest = m ? (m[2] || '').trim() : s;
    if (!rest) return;
    let speakers = [];
    if (typeof resolveSpeakers === 'function') {
      try { speakers = resolveSpeakers(speaker, rest, story) || []; } catch (e) { speakers = []; }
    }
    segs.push({ ids: speakers.filter(sp => sp && sp.id).map(sp => sp.id), text: rest });
  });
  return segs;
}

// Phần ký ức của một nhân vật trong ngày: chỉ giữ những lượt có nhân vật lên tiếng,
// kèm lời người chơi ngay trước đó và phần dẫn truyện của chính lượt ấy.
function diaryChatPortion(story, char, msgs) {
  const me = diaryPlayerRef(story);
  const out = [];
  const own = [];
  const user = [];
  let waiting = [];
  msgs.forEach(m => {
    if (!m) return;
    if (m.sender === 'user') { waiting.push(m); return; }
    if (m.sender !== 'ai') return;
    const segs = diaryMessageSegments(m.text || '', story);
    if (!segs.some(sg => sg.ids.indexOf(char.id) >= 0)) { waiting = []; return; }
    waiting.forEach(u => {
      const t = diaryChatText(u);
      const line = t || (u.img ? '(gửi một tấm ảnh)' : '');
      if (!line) return;
      out.push(`${me}: ${line}`);
      user.push(line);
    });
    waiting = [];
    segs.forEach(sg => {
      const t = diaryChatText({ text: sg.text });
      if (!t) return;
      if (sg.ids.indexOf(char.id) >= 0) { out.push(`${char.name}: ${t}`); own.push(t); }
      else if (!sg.ids.length) out.push(`(cảnh) ${t}`);
    });
  });
  return { transcript: out.join('\n').slice(0, 6000), own, user };
}

function diaryChatFallback(story, char, portion) {
  const me = diaryPlayerRef(story);
  const firstUser = portion.user.length ? diaryChatQuote(portion.user[0]) : '';
  const ownQuote = portion.own.length ? diaryChatQuote(portion.own[0]) : '';
  const said = (q) => /[.!?…]$/.test(q) ? `"${q}"` : `"${q}".`;
  const p1 = firstUser
    ? `Hôm đó ${me} nói với mình: ${said(firstUser)} Mình nghe rồi ngồi một lúc mới trả lời.`
    : `Hôm đó mình có nói chuyện với ${me} một lúc.`;
  const p2 = ownQuote
    ? `Mình nói: ${said(ownQuote)} Nhớ lại thì vẫn thấy đúng như vậy.`
    : `Chuyện trò dừng ở đó. Mình ngồi lại một mình, nghĩ về những gì ${me} kể.`;
  return [p1, p2];
}

function diaryChatPrompt(story, char, transcript, dayLabel) {
  const me = diaryPlayerRef(story);
  return `Bạn viết nhật ký thay cho một nhân vật trong câu chuyện đời thường. Nhân vật mở sổ riêng và ghi lại phần chuyện trò của mình trong một ngày đã qua.

[NGƯỜI VIẾT] ${diaryCharLine(char)}
[NGƯỜI NÓI CHUYỆN CÙNG] ${me}
[NGÀY] ${dayLabel}
[PHẦN CHUYỆN TRÒ CÓ NHÂN VẬT TRONG NGÀY]
${transcript}

[QUY TẮC]
- Đây là ký ức riêng của nhân vật: chỉ kể phần mình có mặt, những gì mình nghe và thấy trong đoạn trên; không kể chuyện của người khác khi mình không có ở đó, không thêm chuyện ngoài đoạn chat.
- Kể đúng thứ tự từ lúc bắt đầu tới lúc kết thúc, giữ chi tiết quan trọng.
- Ngôi thứ nhất, nhân vật xưng "mình", gọi người kia là "${me}" hoặc "cậu ấy". Viết như tự nhủ, không phải kể cho ai nghe.
- Viết thành 2-3 đoạn ngắn liền nhau, cách nhau một dòng trống: đoạn đầu là lúc câu chuyện bắt đầu, đoạn sau là cảm xúc lúc nhớ lại hoặc chuyện lúc về.
- Câu ngắn, đời thường, có một chi tiết nhỏ đáng nhớ và một chút cảm xúc thật.
- Đôi khi nhân vật thấy ngại nên gạch bỏ giữa chừng: dùng ~~cụm từ~~ cho một cụm từ bị gạch. Chỉ thỉnh thoảng, không phải đoạn nào cũng có.
- Không ghi ngày, không tiêu đề, không nhắc điểm số, phần thưởng, hệ thống hay tên game.
- Chỉ trả về các đoạn nhật ký, không thêm lời dẫn.`;
}

function diaryChatSync(story, char) {
  if (!story || !char || !char.id) return;
  const hist = (window.state.chatHistories || {})[story.id] || [];
  const todayKey = diaryDayKey(Date.now());
  const byDay = {};
  hist.forEach(m => {
    if (!m || !m.ts) return;
    if (m.sender !== 'user' && m.sender !== 'ai') return;
    if (m.opening || m.event) return;
    const key = diaryDayKey(m.ts);
    if (key >= todayKey) return; // hôm nay chưa kết thúc thì chưa viết
    (byDay[key] || (byDay[key] = [])).push(m);
  });

  if (!story.diaryDays || typeof story.diaryDays !== 'object') story.diaryDays = {};
  let done = story.diaryDays[char.id];
  if (!Array.isArray(done)) done = story.diaryDays[char.id] = [];
  const keys = Object.keys(byDay).sort().slice(-10).filter(k => done.indexOf(k) < 0);
  if (!keys.length) return;

  const existing = diaryEnsure(story);
  keys.forEach(key => {
    done.push(key);
    const already = existing.some(e => e && e.kind === 'chat'
      && (e.authorId || e.charId) === char.id && diaryDayKey(e.ts) === key);
    if (already) return;
    const msgs = byDay[key];
    const portion = diaryChatPortion(story, char, msgs);
    if (!portion.own.length || !portion.transcript) return; // không xuất hiện thì thôi
    const ts = msgs[msgs.length - 1].ts;
    const entries = diaryAddGroup(story, 'chat', char, diaryChatFallback(story, char, portion), ts);
    if (!entries.length) return;
    diaryRefreshIfOpen();
    if (diaryKeys().length) diaryRewriteGroup(story, entries, diaryChatPrompt(story, char, portion.transcript, diaryDayLabel(ts)));
  });
  if (done.length > 60) done.splice(0, done.length - 60);
  if (typeof saveStorage === 'function') saveStorage();
}

function diaryGiftPrompt(story, char, itemName, shared, names) {  const me = diaryPlayerRef(story);
  const scene = shared
    ? `${me} mời cả nhóm (${names}) cùng thưởng thức "${itemName}".`
    : `${me} tặng riêng "${itemName}" cho ${char.name}.`;
  return `Bạn viết nhật ký thay cho một nhân vật trong câu chuyện đời thường. Nhân vật tự ghi lại chuyện vừa xảy ra trong sổ riêng của mình.

[NGƯỜI VIẾT] ${diaryCharLine(char)}
[NGƯỜI TẶNG] ${me}
[MÓN QUÀ] ${itemName}
[HOÀN CẢNH] ${scene}

[QUY TẮC]
- Ngôi thứ nhất, nhân vật xưng "mình", gọi người tặng là "${me}" hoặc "cậu ấy".
- Viết 2 đoạn ngắn liền nhau, cách nhau một dòng trống: đoạn đầu lúc nhận quà, đoạn sau là cảm xúc lúc cất đi hoặc nghĩ lại.
- Giọng đời thường, câu ngắn. Có thể ngại nên gạch bỏ giữa chừng bằng ~~cụm từ~~, nhưng chỉ thỉnh thoảng.
- Không tiêu đề, không nhắc điểm số, phần thưởng hay hệ thống.
- Chỉ trả về các đoạn nhật ký, không thêm lời dẫn.`;
}

function diaryAddActivity(story, theme, char, session, memory, tier) {
  if (!story || !theme || !char) return [];
  const me = diaryPlayerRef(story);
  const closing = (theme.closing || [])[tier] || '';
  const themeName = String(theme.name || 'đi chơi').toLowerCase();
  const shy = Math.random() < 0.4;
  const p1 = `Hôm nay ${me} rủ mình ${themeName}. ${closing}`.trim();
  const p2 = shy
    ? `Về đến nhà mình vẫn còn nghĩ tới lúc đó. ~~Không biết ${me} có để ý không.~~ Mà thôi, kệ.`
    : `Về đến nhà mình vẫn còn nghĩ tới lúc đó. Không biết ${me} có để ý không.`;
  const entries = diaryAddGroup(story, 'activity', char, [p1, p2]);
  if (entries.length) diaryRewriteGroup(story, entries, diaryActivityPrompt(story, theme, char, session, memory));
  return entries;
}

function diaryAddGift(story, targets, itemName, shared) {
  if (!story || !targets || !targets.length) return [];
  const me = diaryPlayerRef(story);
  const names = targets.map(t => t.name).join(', ');
  const made = [];
  targets.slice(0, 3).forEach(t => {
    if (!t) return;
    const shy = Math.random() < 0.4;
    let p1;
    let p2;
    if (shared) {
      p1 = `Hôm nay ${me} mời cả bọn cùng thưởng thức ${itemName}. Cả bọn quây lại một chỗ, ồn ào hẳn lên.`;
      p2 = shy
        ? `Mình thích những lúc như vậy hơn là nhận riêng một món gì. ~~Nói ra thì hơi ngại.~~`
        : `Mình thích những lúc như vậy hơn là nhận riêng một món gì.`;
    } else if (targets.length === 1) {
      p1 = `Hôm nay ${me} tặng mình ${itemName}. Mình cầm lên ngắm một lúc mà không biết nói gì.`;
      p2 = shy
        ? `Mình cất món quà ở chỗ dễ thấy nhất. ~~Không phải vì mình thích đâu.~~ Thật ra thì có.`
        : `Mình cất món quà ở chỗ dễ thấy nhất. Chắc mình sẽ nhớ chuyện này lâu.`;
    } else {
      p1 = `Hôm nay ${me} tặng mỗi người một phần, mình được ${itemName}. Ai cũng có phần, nghe vậy là thấy vui rồi.`;
      p2 = shy
        ? `Mình để phần của mình riêng ra. ~~Sợ ai lấy mất.~~ Chắc là mình giữ kỹ.`
        : `Mình để phần của mình riêng ra và giữ kỹ. Không muốn ai lấy mất.`;
    }
    const entries = diaryAddGroup(story, 'gift', t, [p1, p2]);
    if (entries.length) {
      made.push(entries);
      diaryRewriteGroup(story, entries, diaryGiftPrompt(story, t, itemName, shared, names));
    }
  });
  return made;
}

// Gom các đoạn cùng group thành một trang, xếp theo thời gian.
function diaryPages(story) {
  const list = diaryEnsure(story).slice().sort((a, b) => (Number(a.ts) || 0) - (Number(b.ts) || 0));
  const pages = [];
  list.forEach(e => {
    const last = pages[pages.length - 1];
    if (last && e.group && last.group === e.group) last.items.push(e);
    else pages.push({ group: e.group || '', items: [e] });
  });
  return pages;
}

function diaryStrike(text) {
  const esc = (s) => (typeof escapeHtml === 'function' ? escapeHtml(s) : String(s || ''));
  return esc(text).replace(/~~([^~\n<>]{1,160}?)~~/g, '<s>$1</s>');
}

function diaryPageChar(page) {
  const e = (page && page.items && page.items[0]) || {};
  return e.authorId || e.charId || '';
}

function diaryStory() {
  return (window.state.stories || []).find(s => s.id === window.state.activeStoryId) || null;
}

function diaryRenderHead(story, char) {
  const head = document.getElementById('diary-head');
  if (!head) return;
  const esc = (s) => (typeof escapeHtml === 'function' ? escapeHtml(s) : String(s || ''));
  const logo = window.DEFAULT_LOGO || '';
  const av = char ? (char.avatar || char.cutout || logo) : '';
  head.innerHTML = `${char ? `<img class="diary-head-av" src="${esc(av)}" onerror="this.src='${logo}'">` : '<div class="diary-head-mark">📔</div>'}
    <div class="diary-head-text">
      <div class="diary-head-name">${esc(char ? char.name : 'Nhật ký nhân vật')}</div>
      <div class="diary-head-sub">${esc(char ? 'sổ tay viết tay' : 'ghi chép của các nhân vật')}</div>
    </div>`;
}

function renderDiary() {
  const body = document.getElementById('diary-body');
  if (!body) return;
  const esc = (s) => (typeof escapeHtml === 'function' ? escapeHtml(s) : String(s || ''));
  const story = diaryStory();
  const charId = window.__diaryCharId || '';
  const char = charId && story ? (story.characters || []).find(c => c.id === charId) : null;
  diaryRenderHead(story, char);

  let pages = diaryPages(story);
  if (charId) pages = pages.filter(p => diaryPageChar(p) === charId);
  // Nhật ký chat chỉ mở vào cuối ngày: phần của hôm nay để hôm sau mới đọc
  const todayKey = diaryDayKey(Date.now());
  pages = pages.filter(p => {
    const first = p.items[0] || {};
    return !(first.kind === 'chat' && diaryDayKey(first.ts) === todayKey);
  });
  if (!pages.length) {
    body.innerHTML = `<div class="diary-empty">${char
      ? `Sổ còn trống. Ngày nào ${esc(char.name)} có chuyện để kể, nhật ký sẽ được viết vào cuối ngày.`
      : 'Nhật ký còn trống.'}</div>`;
    return;
  }

  const days = [];
  pages.forEach(page => {
    const ts = page.items[0].ts;
    const key = diaryDayKey(ts);
    const last = days[days.length - 1];
    if (last && last.key === key) last.pages.push(page);
    else days.push({ key, ts, pages: [page] });
  });
  days.reverse();
  body.innerHTML = days.map(day => {
    const blocks = day.pages.map(page => {
      const paras = page.items.map(e => `<p>${diaryStrike(e.text)}</p>`).join('');
      return `<div class="diary-entry"><div class="diary-entry-text">${paras}</div></div>`;
    }).join('');
    return `<div class="diary-day">${esc(diaryDayLabel(day.ts))}</div>${blocks}`;
  }).join('');
}

function openDiary(charId) {
  window.__diaryCharId = charId || '';
  const ov = document.getElementById('diary-overlay');
  if (!ov) return;
  renderDiary();
  ov.classList.remove('hidden');
  document.body.classList.add('diary-open');
  const story = diaryStory();
  const char = charId && story ? (story.characters || []).find(c => c.id === charId) : null;
  if (char) setTimeout(() => diaryChatSync(story, char), 80);
}

function closeDiary() {
  const ov = document.getElementById('diary-overlay');
  if (ov) ov.classList.add('hidden');
  document.body.classList.remove('diary-open');
}

window.openDiary = openDiary;
window.closeDiary = closeDiary;
window.renderDiary = renderDiary;
window.diaryAddGift = diaryAddGift;
window.diaryAddActivity = diaryAddActivity;
