// Máy chủ thông báo đẩy cho Teechat (Vercel Serverless Function)
// Biến môi trường cần có: VAPID_PUBLIC, VAPID_PRIVATE, FIREBASE_SERVICE_ACCOUNT, CRON_SECRET
const crypto = require('crypto');
const webpush = require('web-push');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    databaseURL: process.env.FIREBASE_DB_URL || 'https://teechat-2ad90-default-rtdb.firebaseio.com'
  });
}
const db = admin.database();
webpush.setVapidDetails('mailto:' + (process.env.VAPID_EMAIL || 'teechat@example.com'), process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);

const HOUR = 3600000;
const idOf = ep => crypto.createHash('sha1').update(ep).digest('hex');
const vnHour = t => new Date(t + 7 * HOUR).getUTCHours();
const vnDay = t => Math.floor((t + 7 * HOUR) / (24 * HOUR));
const pick = a => a[Math.floor(Math.random() * a.length)];

async function sendTo(id, rec, title, body) {
  try {
    await webpush.sendNotification(rec.sub, JSON.stringify({ title, body }));
    return true;
  } catch (e) {
    if (e && (e.statusCode === 404 || e.statusCode === 410)) await db.ref('push_subs/' + id).remove();
    return false;
  }
}

// Ưu tiên nhân vật thân nhất: hạng 1 ~60%, hạng 2 ~25%, hạng 3 ~15%. Chỉ gửi tin AI soạn theo cốt truyện, hết tin thì không gửi.
function makeMessage(rec) {
  const ranked = Array.isArray(rec.ranked) ? rec.ranked.filter(r => r && r.name && Array.isArray(r.msgs) && r.msgs.length) : [];
  if (!ranked.length) return null;
  const w = [0.6, 0.25, 0.15];
  const ws = ranked.map(r => w[Math.min(rec.ranked.indexOf(r), 2)]);
  let x = Math.random() * ws.reduce((a, b) => a + b, 0), pickIdx = 0;
  for (let i = 0; i < ws.length; i++) { if (x < ws[i]) { pickIdx = i; break; } x -= ws[i]; }
  const r = ranked[pickIdx];
  return { title: r.name, body: r.msgs[0], idx: rec.ranked.indexOf(r) };
}

async function runCron() {
  const now = Date.now();
  const h = vnHour(now);
  if (h >= 23 || h < 8) return { sent: 0, note: 'giờ nghỉ' };
  const snap = await db.ref('push_subs').once('value');
  const all = snap.val() || {};
  let sent = 0;
  for (const id of Object.keys(all)) {
    const r = all[id];
    if (!r || !r.sub || !(r.perDay > 0)) continue;
    if (now - (r.lastPing || 0) < 3 * HOUR) continue;                      // đang chơi hoặc mới chơi
    if (now - (r.lastSent || 0) < Math.max(1, r.minGapHours || 1) * HOUR) continue;
    const today = vnDay(now);
    const count = r.sentDay === today ? (r.sentCount || 0) : 0;
    if (count >= r.perDay) continue;
    const m = makeMessage(r);
    if (!m) continue;
    if (await sendTo(id, r, m.title, m.body)) {
      sent++;
      await db.ref('push_subs/' + id + '/ranked/' + m.idx + '/msgs').set(r.ranked[m.idx].msgs.slice(1));
      await db.ref('push_subs/' + id).update({ lastSent: now, sentDay: today, sentCount: count + 1 });
    }
  }
  return { sent };
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      if (!process.env.CRON_SECRET || req.query.cron !== process.env.CRON_SECRET) return res.status(401).json({ error: 'unauthorized' });
      return res.status(200).json(await runCron());
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const now = Date.now();
    if (b.type === 'subscribe' && b.sub && b.sub.endpoint) {
      const id = idOf(b.sub.endpoint);
      const old = (await db.ref('push_subs/' + id).once('value')).val() || {};
      const inc = (Array.isArray(b.ranked) ? b.ranked : []).slice(0, 3).map(r => ({ name: String(r.name || '').slice(0, 60), level: +r.level || 1, msgs: (Array.isArray(r.msgs) ? r.msgs : []).slice(0, 5).map(t => String(t).slice(0, 160)) }));
      // Cùng một lượt soạn tin thì giữ phần tin chưa gửi trên máy chủ, tránh gửi lặp tin đã dùng
      const keep = old.prepTs && old.prepTs === b.prepTs && Array.isArray(old.ranked);
      const ranked = inc.map(r => { const o = keep && old.ranked.find(x => x && x.name === r.name); return o ? { name: r.name, level: r.level, msgs: o.msgs || [] } : r; });
      await db.ref('push_subs/' + id).update({
        ranked: ranked, prepTs: +b.prepTs || 0,
        sub: b.sub, chars: (b.chars || []).slice(0, 12), me: String(b.me || 'bạn').slice(0, 40),
        perDay: Math.min(5, Math.max(0, +b.perDay || 0)),
        minGapHours: Math.min(24, Math.max(1, +b.minGapHours || 1)), lastPing: now
      });
      return res.status(200).json({ ok: true });
    }
    if (b.endpoint) {
      const id = idOf(b.endpoint), ref = db.ref('push_subs/' + id);
      if (b.type === 'unsubscribe') { await ref.remove(); return res.status(200).json({ ok: true }); }
      if (b.type === 'ping') { await ref.update({ lastPing: now }); return res.status(200).json({ ok: true }); }
      if (b.type === 'test') {
        const rec = (await ref.once('value')).val();
        if (!rec) return res.status(200).json({ error: 'Chưa đăng ký, hãy tắt rồi bật lại thông báo.' });
        const m = makeMessage(rec);
        if (!m) return res.status(200).json({ error: 'Chưa có tin soạn sẵn. Hãy mở game chơi khoảng 1 phút rồi thử lại.' });
        const ok = await sendTo(id, rec, m.title, m.body);
        return res.status(200).json(ok ? { ok: true } : { error: 'Gửi không được' });
      }
    }
    return res.status(400).json({ error: 'bad request' });
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message || e) });
  }
};
