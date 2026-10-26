(function () {
  const VAPID = 'BP3VMoU0k_FfMJmw20PxHeLGRkMnObf56bhf7oZVttu4hNzhLsKAMK4PHuIBWpuAibCdRY1GthW3LBsQuG_vIss';
  const API = '/api/push';
  const post = (body) => fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).then(r => r.json());
  const u8 = (b64) => { const p = '='.repeat((4 - b64.length % 4) % 4); const raw = atob((b64 + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...raw].map(c => c.charCodeAt(0))); };
  const standalone = () => window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const on = () => { try { return localStorage.getItem('teechat_push') === '1'; } catch (e) { return false; } };
  // Xếp nhân vật theo độ thân mật (Level rồi điểm), thân nhất đứng đầu
  function rankedChars() {
    const st = window.state || {}, out = [], seen = {};
    (st.stories || []).forEach(s => (s.characters || []).forEach(c => {
      if (!c.name) return;
      const a = (st.affectionLevels && st.affectionLevels[c.id]) || { level: 1, points: 0 };
      out.push({ c: c, s: s, level: a.level || 1, score: (a.level || 1) * 100000 + (a.points || 0) });
    }));
    out.sort((x, y) => y.score - x.score);
    return out.filter(o => !seen[o.c.name] && (seen[o.c.name] = 1));
  }
  function chars() { return rankedChars().map(o => o.c.name).slice(0, 12); }
  // Tin nhắn soạn sẵn theo cốt truyện + lịch sử chat, lưu tạm trong máy rồi gửi lên máy chủ
  const QKEY = 'teechat_push_queue';
  function loadQueue() { try { const q = JSON.parse(localStorage.getItem(QKEY) || 'null'); return q && Array.isArray(q.list) ? q : { ts: 0, list: [] }; } catch (e) { return { ts: 0, list: [] }; } }
  function rankedPayload() {
    const q = loadQueue();
    return rankedChars().slice(0, 3).map(o => { const m = q.list.find(x => x.name === o.c.name); return { name: o.c.name, level: o.level, msgs: (m && m.msgs) || [] }; });
  }
  async function prepMessages() {
    if (!on() || freq() === 'off' || window.__pushPrepBusy) return;
    const st = window.state || {}, keys = st.apiKeys || [];
    if (!keys.length || Date.now() - loadQueue().ts < 3 * 3600 * 1000) return;
    const top = rankedChars().slice(0, 3); if (!top.length) return;
    window.__pushPrepBusy = true;
    try {
      const me = (st.persona && st.persona.name) || 'bạn';
      const blocks = top.map(o => {
        const hist = ((st.chatHistories || {})[o.s.id] || []).slice(-14).map(m => (m.sender === 'user' ? me : m.sender === 'ai' ? 'Nhân vật' : 'Dẫn truyện') + ': ' + String(m.text || '').slice(0, 260)).join('\n');
        return `### ${o.c.name} (Level thân mật ${o.level})\nTính cách: ${String(o.c.personality || '').slice(0, 300)}\nBối cảnh truyện: ${String(o.s.setting || '').slice(0, 300)}\nĐoạn chat gần nhất:\n${hist || '(chưa có)'}`;
      }).join('\n\n');
      const prompt = `Bạn viết tin nhắn thông báo ngắn cho game nhập vai. Mỗi nhân vật dưới đây nhắn cho người chơi "${me}" lúc người chơi vắng mặt.
Yêu cầu: mỗi nhân vật viết 5 tin, mỗi tin tối đa 110 ký tự, đúng tính cách và xưng hô, bám sát bối cảnh và đoạn chat gần nhất (nhắc đúng chuyện đã xảy ra, nhân vật có thể hỏi han, chờ đợi, rủ rê tiếp câu chuyện). Level thân mật càng cao thì càng gần gũi. Không bịa chuyện chưa từng xảy ra, không viết thay lời người chơi, không dùng ngoặc hành động, không quá 1 emoji.
${blocks}
Trả về JSON thuần, không markdown: {"items":[{"name":"tên nhân vật","texts":["tin 1","tin 2","tin 3","tin 4","tin 5"]}]}`;
      const model = (st.currentModel || 'gemini-2.5-flash').trim().replace(/^models\//, '');
      let items = null;
      for (const raw of keys) {
        const key = String(raw).trim().replace(/^["']|["']$/g, '');
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }) });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) continue;
          let t = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts || []).map(x => x.text || '').join('').replace(/```json/g, '').replace(/```/g, '');
          const a = t.indexOf('{'), b = t.lastIndexOf('}');
          if (a !== -1 && b !== -1) { items = (JSON.parse(t.slice(a, b + 1)).items) || null; if (items) break; }
        } catch (e) {}
      }
      if (!items) return;
      const list = top.map(o => { const it = items.find(i => i && i.name === o.c.name) || {}; return { name: o.c.name, msgs: (it.texts || []).map(x => String(x).trim().slice(0, 140)).filter(Boolean).slice(0, 5) }; });
      localStorage.setItem(QKEY, JSON.stringify({ ts: Date.now(), list: list }));
      const sub = await getSub(false); if (sub) await sync(sub);
    } catch (e) {} finally { window.__pushPrepBusy = false; }
  }
  async function getSub(create) {
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub && create) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: u8(VAPID) });
    return sub;
  }
  // Tần suất nhân vật nhắn trước (người chơi chọn trong Cài đặt): số tin tối đa mỗi ngày
  const FREQ = { off: 0, it: 1, vua: 3, nhieu: 5 };
  const freq = () => { try { const f = localStorage.getItem('teechat_push_freq'); return f in FREQ ? f : 'vua'; } catch (e) { return 'vua'; } };
  async function sync(sub) {
    const f = freq(), perDay = FREQ[f];
    await post({ type: 'subscribe', sub: sub.toJSON(), chars: chars(), me: (window.state && window.state.persona && window.state.persona.name) || 'bạn', ranked: rankedPayload(), prepTs: loadQueue().ts, freq: f, perDay: perDay, minGapHours: perDay ? Math.floor(16 / perDay) : 0 });
  }
  window.setPushFreq = async function (v) {
    try { localStorage.setItem('teechat_push_freq', v in FREQ ? v : 'vua'); } catch (e) {}
    paint();
    try { if (on() && supported() && Notification.permission === 'granted') { const sub = await getSub(false); if (sub) await sync(sub); } } catch (e) {}
  };
  function paint() {
    const st = document.getElementById('push-status'), bt = document.getElementById('push-toggle-btn');
    if (!st || !bt) return;
    if (!supported()) { st.innerText = 'Máy hoặc trình duyệt này chưa hỗ trợ thông báo.'; bt.disabled = true; return; }
    const sel = document.getElementById('push-freq'); if (sel) sel.value = freq();
    st.innerText = on() ? (freq() === 'off' ? '✅ Đã bật thông báo nhưng đang để "Tắt nhắn trước": nhân vật sẽ không nhắn khi bạn vắng.' : '✅ Đang bật: nhân vật sẽ nhắn khi bạn vắng mặt vài tiếng, theo tần suất bạn chọn (không nhắn lúc 23h-8h).') : 'Đang tắt. Trên iPhone cần mở game từ icon ngoài màn hình chính.';
    bt.innerText = on() ? 'Tắt' : 'Bật';
  }
  window.togglePushNotif = async function () {
    try {
      if (on()) {
        // Tắt trước ở máy này, rồi mới báo máy chủ (máy chủ lỗi cũng không làm kẹt nút)
        localStorage.setItem('teechat_push', '0'); paint();
        try {
          const sub = await getSub(false);
          if (sub) { try { await post({ type: 'unsubscribe', endpoint: sub.endpoint }); } catch (e) {} await sub.unsubscribe(); }
        } catch (e) {}
        return;
      }
      if (!supported()) return alert('Máy này chưa hỗ trợ thông báo.');
      if (!standalone()) return alert('Hãy mở game từ icon ngoài màn hình chính (không mở bằng Safari) rồi bật lại nhé.');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return alert('Bạn chưa cho phép thông báo. Vào Cài đặt iPhone, Teechat, Thông báo để bật.');
      const sub = await getSub(true);
      await sync(sub);
      localStorage.setItem('teechat_push', '1'); paint();
      alert('Đã bật thông báo! Bấm "Gửi thử" để kiểm tra.');
    } catch (e) { alert('Không bật được thông báo: ' + (e && e.message || e)); }
  };
  window.testPushNotif = async function () {
    try {
      const sub = await getSub(false);
      if (!sub || !on()) return alert('Hãy bật thông báo trước.');
      await sync(sub);
      const r = await post({ type: 'test', endpoint: sub.endpoint });
      if (r.error) alert('Lỗi: ' + r.error); else alert('Đã gửi, vài giây nữa sẽ có thông báo. Thử thoát ra màn hình chính để thấy.');
    } catch (e) { alert('Không gửi thử được: ' + (e && e.message || e)); }
  };
  // Báo cho máy chủ biết bạn đang chơi (để không nhắn khi bạn đang online) và cập nhật danh sách nhân vật
  async function ping() {
    if (!on() || !supported() || Notification.permission !== 'granted') return;
    try { const sub = await getSub(false); if (sub) await post({ type: 'ping', endpoint: sub.endpoint }); } catch (e) {}
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { ping(); setTimeout(prepMessages, 15000); } });
  setInterval(() => { if (!document.hidden) ping(); }, 5 * 60 * 1000);
  window.addEventListener('load', () => {
    paint(); setTimeout(prepMessages, 30000);
    if (on() && supported() && Notification.permission === 'granted') getSub(false).then(sub => { if (sub) sync(sub); }).catch(() => {});
  });
  document.addEventListener('click', e => { if (e.target && e.target.closest && e.target.closest('[onclick*="modal-settings"]')) setTimeout(paint, 50); });
})();
