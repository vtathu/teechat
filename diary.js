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

function diaryDateLabel(ts) {
  const d = new Date(ts);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, new Date())) return 'Hôm nay';
  if (sameDay(d, new Date(Date.now() - 86400000))) return 'Hôm qua';
  return `${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
}

function diaryTimeLabel(ts) {
  return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
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
function diaryAddGroup(story, kind, char, texts) {
  if (!story) return [];
  const list = diaryEnsure(story);
  const clean = (texts || []).map(t => String(t || '').trim()).filter(Boolean);
  if (!clean.length) return [];
  const group = diaryNewGroup();
  const base = Date.now();
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

// ---- Nhật ký theo ngày: ghi lại đoạn chat từ đầu ngày tới lúc này ----
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

function diaryChatTranscript(story, char, msgs) {
  const me = diaryPlayerRef(story);
  return msgs.map(m => {
    const t = diaryChatText(m);
    if (!t) return m.img ? `${m.sender === 'user' ? me : char.name}: (một tấm ảnh)` : '';
    if (m.sender === 'user') return `${me}: ${t}`;
    return /^\s*\[[^\]]{1,40}\]/.test(t) ? t : `${char.name}: ${t}`;
  }).filter(Boolean).join('\n');
}

function diaryChatPrompt(story, char, transcript) {
  const me = diaryPlayerRef(story);
  return `Bạn viết nhật ký thay cho một nhân vật trong câu chuyện đời thường. Nhân vật tự ghi lại chuyện trò đã diễn ra trong ngày hôm nay.

[NGƯỜI VIẾT] ${diaryCharLine(char)}
[NGƯỜI NÓI CHUYỆN CÙNG] ${me}
[CHUYỆN ĐÃ XẢY RA HÔM NAY - TỪ ĐẦU NGÀY]
${transcript}

[QUY TẮC]
- Kể lại trung thực chuyện đã xảy ra trong ngày đúng thứ tự từ lúc bắt đầu tới lúc kết thúc, giữ đúng chi tiết quan trọng; không thêm chuyện không có trong đoạn chat.
- Ngôi thứ nhất, nhân vật xưng "mình", gọi người kia là "${me}" hoặc "cậu ấy". Viết như tự nhủ, không phải kể cho ai nghe.
- Viết thành 2-3 đoạn ngắn liền nhau, cách nhau một dòng trống: đoạn đầu là lúc câu chuyện bắt đầu, đoạn sau là cảm xúc lúc nhớ lại hoặc chuyện lúc về.
- Câu ngắn, đời thường, có một chi tiết nhỏ đáng nhớ và một chút cảm xúc thật.
- Đôi khi nhân vật thấy ngại nên gạch bỏ giữa chừng: dùng ~~cụm từ~~ cho một cụm từ bị gạch. Chỉ thỉnh thoảng, không phải đoạn nào cũng có.
- Không tiêu đề, không nhắc điểm số, phần thưởng, hệ thống hay tên game.
- Chỉ trả về các đoạn nhật ký, không thêm lời dẫn.`;
}

function diaryChatSync(story, char) {
  if (!story || !char) return;
  const hist = (window.state.chatHistories || {})[story.id] || [];
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const covered = (story.diaryChatMarks && story.diaryChatMarks[char.id]) || 0;
  const from = Math.max(dayStart.getTime(), covered + 1);
  const msgs = hist.filter(m => m && m.ts >= from && (m.sender === 'user' || m.sender === 'ai') && !m.opening && !m.event).slice(-60);
  if (msgs.length < 2) return;
  const transcript = diaryChatTranscript(story, char, msgs).slice(0, 6000);
  if (!transcript) return;

  if (!story.diaryChatMarks || typeof story.diaryChatMarks !== 'object') story.diaryChatMarks = {};
  story.diaryChatMarks[char.id] = msgs[msgs.length - 1].ts;

  const me = diaryPlayerRef(story);
  const firstUser = msgs.find(m => m.sender === 'user');
  const lastAi = [...msgs].reverse().find(m => m.sender === 'ai');
  const users = msgs.filter(m => m.sender === 'user');
  const midUser = users.length > 2 ? users[Math.floor(users.length / 2)] : null;
  const firstQuote = firstUser ? diaryChatQuote(diaryChatText(firstUser)) : '';
  const midQuote = midUser && midUser !== firstUser ? diaryChatQuote(diaryChatText(midUser)) : '';
  const lastQuote = lastAi ? diaryChatQuote(diaryChatText(lastAi)) : '';
  const p1 = firstQuote
    ? `Hôm nay ${me} mở lời trước: "${firstQuote}". Mình đọc xong, ngồi một lúc mới trả lời.`
    : `Hôm nay mình nói chuyện với ${me} một lúc.`;
  const pMid = midQuote
    ? `Giữa buổi, ${me} còn kể: "${midQuote}". Mình nghe rồi ghi lại trong đầu, sợ quên.`
    : '';
  const p2 = lastQuote
    ? `Tới cuối buổi, mình nói với ${me}: "${lastQuote}". Nói xong vẫn thấy còn điều chưa kịp nói.`
    : `Chuyện trò dừng ở đó. Mình ngồi lại một lúc, nghĩ về những gì ${me} kể.`;

  const entries = diaryAddGroup(story, 'chat', char, [p1, pMid, p2].filter(Boolean));
  if (!entries.length) return;
  diaryRefreshIfOpen();
  if (diaryKeys().length) diaryRewriteGroup(story, entries, diaryChatPrompt(story, char, transcript));
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

// Gom các đoạn cùng group thành một trang, hiện mới nhất trước.
function diaryPages(story) {
  const list = diaryEnsure(story);
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

  let pages = diaryPages(story).reverse();
  if (charId) pages = pages.filter(p => diaryPageChar(p) === charId);
  if (!pages.length) {
    body.innerHTML = `<div class="diary-empty">${char
      ? `Trang này còn trống. Mỗi buổi đi chơi hay món quà tặng sẽ được ${esc(char.name)} ghi lại ở đây.`
      : 'Nhật ký còn trống. Mỗi buổi đi chơi hay món quà tặng đều được nhân vật tự ghi lại ở đây.'}</div>`;
    return;
  }

  let dayKey = '';
  body.innerHTML = pages.map(page => {
    const items = page.items;
    const last = items[items.length - 1];
    const t1 = diaryTimeLabel(items[0].ts);
    const t2 = diaryTimeLabel(last.ts);
    const when = items.length > 1 && t1 !== t2 ? `${t1} – ${t2}` : t2;
    const dk = new Date(last.ts).toDateString();
    let dayLabel = '';
    if (dk !== dayKey) {
      dayKey = dk;
      dayLabel = `<div class="diary-day">${esc(diaryDateLabel(last.ts))}</div>`;
    }
    const legacy = !last.authorId;
    const who = (!charId || legacy)
      ? `<div class="diary-entry-who">✎ ${esc(last.authorName || 'Bạn')} viết</div>`
      : '';
    const paras = items.map(e => `<p>${diaryStrike(e.text)}</p>`).join('');
    return `${dayLabel}<div class="diary-entry">
      <div class="diary-entry-top"><span class="diary-entry-time">${esc(when)}</span></div>
      ${who}
      <div class="diary-entry-text">${paras}</div>
    </div>`;
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
