export function money(n) {
  const neg = n < 0 ? '-' : '';
  const k = Math.round(Math.abs(n) / 100) / 10;
  const [int, dec] = (Number.isInteger(k) ? String(k) : k.toFixed(1)).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return neg + grouped + (dec ? ',' + dec : '') + 'k';
}

export function num(n) {
  return Math.round(n).toLocaleString('de-DE');
}

export function ratingText(v) {
  return v.toFixed(1).replace('.', ',');
}

export function mmss(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function randInt(lo, hi) {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickWeighted(pairs) {
  const total = pairs.reduce((s, p) => s + p[1], 0);
  let r = Math.random() * total;
  for (const [value, w] of pairs) {
    r -= w;
    if (r <= 0) return value;
  }
  return pairs[pairs.length - 1][0];
}

export function sample(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
