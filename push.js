(function () {
  const VAPID = 'BA9-CUVf_48ud7ZqQ_qD73p88wMMcHtNfx18dCTSi5reud5MXmXR7cUTAOqm23k8pEg5B52iF-G8jP6_Uv9tJ18';
  const API = '/api/push';
  const LINES = ["{me} ơi, đang làm gì đó?", "Nãy giờ không thấy {me} nhắn, hơi nhớ rồi đó.", "Ăn gì chưa {me}? Nhớ ăn uống đàng hoàng nhé.", "Tự nhiên nghĩ đến {me}, thế là nhắn luôn.", "Có chuyện này muốn kể {me} nghe, vào đây đi.", "Im lặng lâu vậy, giận mình hả {me}?", "{me}, hôm nay của bạn thế nào rồi?", "Mở máy lên một chút đi, có người đang đợi đó.", "Trời hôm nay đẹp lắm, tiếc là {me} không ở đây.", "Đừng thức khuya quá nha {me}.", "Có tin vui, nhưng chỉ kể cho {me} thôi.", "Này, {me} còn nhớ chuyện hôm trước không?", "Vừa nhìn thấy một thứ rất hợp với {me}.", "Mình chờ mãi mà chưa thấy {me} vào.", "Uống nước chưa {me}? Hỏi vậy thôi, nhắn lại đi.", "Tối nay rảnh không {me}, trò chuyện với mình chút.", "Nghỉ ngơi một lát rồi vào chơi với mình nhé.", "Đoán xem mình đang nghĩ gì nào? Vào đây mình nói.", "Có người vừa nhắc đến {me} đấy.", "{me}, mình có chuyện muốn nói.", "Hôm nay có gì vui không? Kể mình nghe với.", "Sao im thế, bận lắm à {me}?", "Mình vừa nhớ ra một chuyện buồn cười, kể {me} nghe nhé.", "Mệt rồi thì cứ vào đây, mình nghe {me} nói.", "Hôm nay mình lỡ làm một chuyện, muốn {me} biết trước.", "Mưa rồi đó {me}, nhớ mang theo áo khoác.", "Có phải {me} quên mình rồi không?"];
  const post = (body) => fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).then(r => r.json());
  const u8 = (b64) => { const p = '='.repeat((4 - b64.length % 4) % 4); const raw = atob((b64 + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...raw].map(c => c.charCodeAt(0))); };
  const standalone = () => window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const on = () => { try { return localStorage.getItem('teechat_push') === '1'; } catch (e) { return false; } };
  function chars() {
    const out = [];
    ((window.state && window.state.stories) || []).forEach(st => (st.characters || []).forEach(c => { if (c.name && !out.includes(c.name)) out.push(c.name); }));
    return out.slice(0, 12);
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
    await post({ type: 'subscribe', sub: sub.toJSON(), chars: chars(), me: (window.state && window.state.persona && window.state.persona.name) || 'bạn', lines: LINES, freq: f, perDay: perDay, minGapHours: perDay ? Math.floor(16 / perDay) : 0 });
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
        const sub = await getSub(false);
        if (sub) { await post({ type: 'unsubscribe', endpoint: sub.endpoint }); await sub.unsubscribe(); }
        localStorage.setItem('teechat_push', '0'); paint(); return;
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
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ping(); });
  setInterval(() => { if (!document.hidden) ping(); }, 5 * 60 * 1000);
  window.addEventListener('load', () => {
    paint();
    if (on() && supported() && Notification.permission === 'granted') getSub(false).then(sub => { if (sub) sync(sub); }).catch(() => {});
  });
  document.addEventListener('click', e => { if (e.target && e.target.closest && e.target.closest('[onclick*="modal-settings"]')) setTimeout(paint, 50); });
})();
