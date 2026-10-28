import { BROTHS, TOPPINGS, CUSTOMERS, REVIEW_TEXT } from './data.js';
import { unlockedBroths, unlockedToppings, state, ambience, weather, brothById, toppingById } from './state.js';
import { clamp, randInt, pick, sample, pickWeighted } from './format.js';

export function makeOrder() {
  const broths = unlockedBroths();
  const toppings = unlockedToppings();
  const cust = pick(CUSTOMERS);
  const w = weather();

  let spice = randInt(0, 4) + (w.spiceBias > 0 ? 1 : w.spiceBias < 0 ? -1 : 0);
  if (state.day > 6 && Math.random() < 0.22) spice += 1;
  if (Math.random() < 0.08) spice = 0;
  spice = clamp(spice, 0, 7);

  const count = pickWeighted([
    [0, state.day < 3 ? 22 : 10],
    [1, state.day < 3 ? 48 : 38],
    [2, state.day < 4 ? 18 : 34],
    [3, state.day < 6 ? 0 : 18],
  ]);

  return {
    cust,
    broth: pick(broths).id,
    spice,
    toppings: sample(toppings, Math.min(count, toppings.length)).map((t) => t.id),
  };
}

export function orderHTML(cust, order) {
  const broth = brothById(order.broth);
  const tops = order.toppings.map((id) => toppingById(id).name).join(', ');
  const call = cust.call.toLowerCase();
  let s = `${cust.call} ơi cho ${cust.self} 1 tô mì <b>${broth.name.toLowerCase()}${order.spice > 0 ? ' cay' : ''}</b>`;
  if (tops) s += ` thêm <b>${tops}</b>`;
  s += `, ${order.spice > 0 ? `cấp ${order.spice}` : 'không cay'} nha`;
  s += cust.tone === 'kid' ? ', con cảm ơn!' : `, cảm ơn ${call}!`;
  return s;
}

export function orderValue(order) {
  const base = state.prices[order.broth] || 0;
  return base + order.toppings.reduce((sum, id) => sum + (toppingById(id)?.price || 0), 0);
}

export function bowlValue(bowl) {
  const base = state.prices[bowl.broth] || 0;
  return base + bowl.toppings.reduce((sum, id) => sum + (toppingById(id)?.price || 0), 0);
}

export function evaluate(bowl, order, waitRatio) {
  let score = 5;
  const issues = [];

  if (bowl.broth !== order.broth) {
    score -= 2.5;
    issues.push('broth');
  }

  const diff = Math.abs(bowl.spice - order.spice);
  if (diff === 1) {
    score -= 1;
    issues.push('spice');
  } else if (diff > 1) {
    score -= 2;
    issues.push('spice');
  }

  const missing = order.toppings.filter((id) => !bowl.toppings.includes(id));
  const extra = bowl.toppings.filter((id) => !order.toppings.includes(id));
  if (missing.length) {
    score -= missing.length;
    issues.push('missing');
  }
  if (extra.length) {
    score -= extra.length * 0.8;
    issues.push('extra');
  }

  if (waitRatio > 0.7) {
    score -= 0.5;
    issues.push('slow');
  }

  score += ambience() * 0.15;
  const stars = clamp(Math.round(score), 1, 5);
  const served = bowlValue(bowl);
  const tipRate = stars === 5 ? 0.15 : stars === 4 ? 0.08 : 0;
  let tip = Math.round((served * tipRate) / 1000) * 1000;
  if (waitRatio < 0.35 && stars >= 4) tip += 3000;

  return { stars, issues, served, tip, total: served + tip, waitRatio };
}

export function reviewFor(stars, order) {
  const text = pick(REVIEW_TEXT[stars] || REVIEW_TEXT[3]);
  return text
    .replace('{broth}', brothById(order.broth).name.toLowerCase())
    .replace('{spice}', String(order.spice));
}

const REACTIONS = {
  5: ['Ngon tuyệt em ơi!', 'Đúng ý anh quá!', 'Tuyệt cú mèo!', 'Cay đã luôn!'],
  4: ['Được đó em!', 'Ngon nha, lần sau ghé tiếp.', 'Ổn áp!'],
  3: ['Tạm được...', 'Cũng được em ạ.', 'Hơi khác ý một chút.'],
  2: ['Ơ, mình gọi khác cơ mà?', 'Không đúng ý rồi em.', 'Thôi để anh ăn tạm.'],
  1: ['Gì vậy trời...', 'Không ổn rồi em ơi.', 'Thôi anh về nha.'],
};

export function reactionFor(stars) {
  return pick(REACTIONS[stars] || REACTIONS[3]);
}

export function bumpMission(type) {
  const m = state.missions.find((x) => x.type === type);
  if (!m || m.progress >= m.target) return false;
  m.progress += 1;
  return m.progress >= m.target;
}
