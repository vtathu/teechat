import { SUPABASE_URL, SUPABASE_ANON_KEY, cloudConfigured } from './config.js';

const SESSION_KEY = 'mycay.auth.v1';

class CloudError extends Error {
  constructor(message, code = '') {
    super(message);
    this.code = code;
  }
}

let session = null;

function base() {
  return SUPABASE_URL.replace(/\/+$/, '');
}

function readSaved() {
  try {
    session = JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    session = null;
  }
  return session;
}

function writeSession(next) {
  session = next;
  try {
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Bộ nhớ trình duyệt đầy hoặc bị chặn: vẫn giữ phiên trong RAM.
  }
}

function sessionFrom(data) {
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at ?? Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    user: data.user,
  };
}

async function api(path, { method = 'GET', body, auth = true, prefer } = {}) {
  if (!cloudConfigured()) throw new CloudError('Game chưa nối với Supabase.', 'config');
  const headers = { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
  if (auth && session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  if (prefer) headers.Prefer = prefer;

  let res;
  try {
    res = await fetch(`${base()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new CloudError('Không kết nối được máy chủ.', 'network');
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const err = new CloudError(data?.msg || data?.error_description || data?.message || 'Máy chủ trả lỗi.', 'server');
    err.status = res.status;
    err.code = data?.error_code || data?.error || data?.code || '';
    throw err;
  }
  return data;
}

const AUTH_ERRORS = {
  invalid_grant: 'Email hoặc mật khẩu chưa đúng.',
  invalid_credentials: 'Email hoặc mật khẩu chưa đúng.',
  email_not_confirmed: 'Bạn cần mở email xác nhận trước khi đăng nhập.',
  user_already_exists: 'Email này đã có tài khoản rồi.',
  email_exists: 'Email này đã có tài khoản rồi.',
  weak_password: 'Mật khẩu cần ít nhất 6 ký tự.',
  over_email_send_rate_limit: 'Gửi hơi nhanh rồi, thử lại sau ít phút nhé.',
  email_address_invalid: 'Email chưa hợp lệ.',
  signup_disabled: 'Tạm thời không mở đăng ký.',
  auth: 'Bạn cần đăng nhập lại.',
};

export function errorText(err) {
  if (err?.code === 'network') return 'Không kết nối được máy chủ, kiểm tra mạng rồi thử lại.';
  if (err?.code === 'config') return 'Game chưa được nối với Supabase.';
  if (err?.code && AUTH_ERRORS[err.code]) return AUTH_ERRORS[err.code];
  if (err?.status === 401) return 'Phiên đăng nhập đã hết, đăng nhập lại nhé.';
  return 'Có gì đó không ổn, thử lại sau nhé.';
}

async function refreshToken() {
  if (!session?.refresh_token) throw new CloudError('Bạn cần đăng nhập lại.', 'auth');
  const data = await api('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: { refresh_token: session.refresh_token },
    auth: false,
  });
  writeSession(sessionFrom(data));
  return session;
}

async function ensureToken() {
  if (!session) throw new CloudError('Bạn cần đăng nhập lại.', 'auth');
  if (session.expires_at - Date.now() / 1000 > 60) return;
  try {
    await refreshToken();
  } catch (err) {
    if (err.code === 'network') return;
    writeSession(null);
    throw err;
  }
}

export async function initAuth() {
  readSaved();
  if (!session || !cloudConfigured()) return session;
  if (session.expires_at - Date.now() / 1000 > 60) return session;
  try {
    await refreshToken();
  } catch (err) {
    if (err.code !== 'network') writeSession(null);
  }
  return session;
}

export async function signIn(email, password) {
  const data = await api('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email: email.trim(), password },
    auth: false,
  });
  writeSession(sessionFrom(data));
  return session;
}

export async function signUp(email, password, shopName) {
  const data = await api('/auth/v1/signup', {
    method: 'POST',
    body: { email: email.trim(), password, data: { shop_name: shopName.trim() } },
    auth: false,
  });
  if (data?.access_token) {
    writeSession(sessionFrom(data));
    return { session };
  }
  if (Array.isArray(data?.user?.identities) && data.user.identities.length === 0) {
    throw new CloudError('Email này đã có tài khoản rồi.', 'user_already_exists');
  }
  return { needsConfirm: true };
}

export async function signOut() {
  try {
    if (session && cloudConfigured()) await api('/auth/v1/logout', { method: 'POST' });
  } catch {
    // Đăng xuất cục bộ vẫn phải chạy dù mạng lỗi.
  }
  writeSession(null);
}

const ROW = 'user_id,shop_name,score,level,day,updated_at';

function toRow(r, meId) {
  return {
    id: r.user_id,
    name: r.shop_name,
    score: r.score,
    level: r.level,
    day: r.day,
    me: r.user_id === meId,
  };
}

export async function fetchLeaderboard() {
  await ensureToken();
  const meId = session.user.id;
  const top = (await api(`/rest/v1/leaderboard?select=${ROW}&order=score.desc,updated_at.asc&limit=10`)) || [];
  const rows = top.map((r) => toRow(r, meId));
  let mine = null;
  if (!rows.some((r) => r.me)) {
    const own = await api(`/rest/v1/leaderboard?select=${ROW}&user_id=eq.${encodeURIComponent(meId)}&limit=1`);
    if (own?.[0]) mine = toRow(own[0], meId);
  }
  return { rows, mine };
}

export async function pushScore({ name, score, level, day }) {
  await ensureToken();
  await api('/rest/v1/leaderboard?on_conflict=user_id', {
    method: 'POST',
    body: {
      user_id: session.user.id,
      shop_name: String(name || 'Quán ẩn danh').slice(0, 24),
      score: Math.max(0, Math.round(score)),
      level,
      day,
      updated_at: new Date().toISOString(),
    },
    prefer: 'resolution=merge-duplicates,return=minimal',
  });
}

export function getSession() {
  return session;
}

export function getUser() {
  return session?.user || null;
}

export { cloudConfigured };
