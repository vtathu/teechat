import { BROTHS, TOPPINGS, UPGRADES, DECOR, WEATHERS, CUSTOMER_COMEBACKS } from './data.js';
import { clamp, pick } from './format.js';

const KEY = 'mycay.save.v2';
let scope = null;

export function setUserScope(id) {
  scope = id || null;
}

function saveKey() {
  return scope ? `${KEY}.${scope}` : KEY;
}

function newReviewId() {
  return globalThis.crypto?.randomUUID?.() || `rv-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const MAX_LEVEL_UP = 99;

function fresh() {
  return {
    v: 2,
    phase: 'prep',
    shopName: 'Mỳ cay nhà tui',
    day: 1,
    money: 500000,
    level: 1,
    xp: 0,
    rating: { sum: 0, count: 0 },
    reviews: [],
    decor: [],
    upgrades: { pot: 0, stove: 0, tables: 0, sign: 0, fan: 0 },
    prices: Object.fromEntries(BROTHS.map((b) => [b.id, b.price])),
    stock: {
      broth: Object.fromEntries(BROTHS.map((b) => [b.id, 0])),
      toppings: Object.fromEntries(TOPPINGS.map((t) => [t.id, 0])),
      bowls: 20,
    },
    missions: [],
    missionDay: 0,
    dayPlan: null,
    daySpent: 0,
    history: [],
    lastSummary: null,
    serviceSave: null,
    settings: { sound: true },
  };
}

export const state = fresh();

export function load() {
  const base = fresh();
  let saved = null;
  try {
    const raw = localStorage.getItem(saveKey());
    saved = raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('Không đọc được bản lưu', err);
  }
  if (!saved) {
    Object.assign(state, base);
    return false;
  }
  try {
    Object.assign(state, base, saved);
    state.stock = { ...base.stock, ...(saved.stock || {}) };
    state.stock.broth = { ...base.stock.broth, ...((saved.stock || {}).broth || {}) };
    state.stock.toppings = { ...base.stock.toppings, ...((saved.stock || {}).toppings || {}) };
    state.upgrades = { ...base.upgrades, ...(saved.upgrades || {}) };
    state.prices = { ...base.prices, ...(saved.prices || {}) };
    state.settings = { ...base.settings, ...(saved.settings || {}) };
    state.rating = { ...base.rating, ...(saved.rating || {}) };
    state.reviews = (Array.isArray(saved.reviews) ? saved.reviews : []).map((r, i) => ({
      ...r,
      id: r.id || `old-${i}`,
      ownerReply: r.ownerReply || null,
      customerReply: r.customerReply || null,
    }));
    const canResume = state.phase === 'service' && state.serviceSave && state.serviceSave.day === state.day;
    if (!canResume) state.phase = 'prep';
    if (state.serviceSave && !canResume) state.serviceSave = null;
    return true;
  } catch (err) {
    console.warn('Bản lưu hỏng, bắt đầu lại', err);
    Object.assign(state, base);
    return false;
  }
}

export function save() {
  try {
    localStorage.setItem(saveKey(), JSON.stringify(state));
  } catch (err) {
    console.warn('Không lưu được', err);
  }
}

export function resetSave() {
  localStorage.removeItem(saveKey());
  Object.assign(state, fresh());
}

export const rating = () => (state.rating.count ? state.rating.sum / state.rating.count : 4.5);
export const ratingCount = () => state.rating.count;
export const levelNeed = (l = state.level) => 600 + l * 40;

export const brothById = (id) => BROTHS.find((b) => b.id === id);
export const toppingById = (id) => TOPPINGS.find((t) => t.id === id);
export const upgradeById = (id) => UPGRADES.find((u) => u.id === id);

export const unlockedBroths = () => BROTHS.filter((b) => b.unlock <= state.level);
export const unlockedToppings = () => TOPPINGS.filter((t) => t.unlock <= state.level);
export const foodUnlocked = (item) => item.unlock <= state.level;

export const seats = () => 2 + state.upgrades.tables;
export const cookTime = () => 3.6 - state.upgrades.stove * 0.4;
export const batchSize = () => 3 + state.upgrades.stove;
export const brothCap = () => 18 + state.upgrades.pot * 8;
export const ambience = () => Math.min(4, state.decor.length);
export const patienceBase = () => Math.max(30, 46 + state.upgrades.fan * 8 - (state.day - 1) * 0.4);

export function avgPrice() {
  const list = unlockedBroths();
  return list.reduce((s, b) => s + state.prices[b.id], 0) / list.length;
}

export function dailyFixed() {
  const lv = state.level - 1;
  const rent = 40000 + lv * 3000;
  const util = 27000 + lv * 2000;
  const salary = 60000 + lv * 10000;
  return { rent, util, salary, total: rent + util + salary };
}

export function addXp(amount) {
  state.xp += Math.max(0, Math.round(amount));
  const gained = [];
  while (state.xp >= levelNeed(state.level) && state.level < MAX_LEVEL_UP) {
    state.xp -= levelNeed(state.level);
    state.level += 1;
    gained.push(state.level);
  }
  return gained;
}

export function nextUnlocksAt(level = state.level) {
  const out = [];
  for (const b of BROTHS) if (b.unlock > level) out.push({ level: b.unlock, label: `Nước dùng ${b.name}` });
  for (const t of TOPPINGS) if (t.unlock > level) out.push({ level: t.unlock, label: `Topping ${t.name}` });
  for (const u of UPGRADES) if (u.unlock > level) out.push({ level: u.unlock, label: `Nâng cấp ${u.name}` });
  return out.sort((a, b) => a.level - b.level);
}

export function weather() {
  const id = state.dayPlan?.weather;
  return WEATHERS.find((w) => w.id === id) || WEATHERS[0];
}

export function estimateCustomers() {
  const base = 9 + state.level * 1.2 + state.day * 0.7;
  const rep = 0.85 + (rating() / 5) * 0.25;
  const extras = 1 + ambience() * 0.03 + state.upgrades.sign * 0.12;
  return clamp(Math.round(base * weather().mult * rep * extras), 5, 60);
}

export function refreshDayPlan() {
  if (!state.dayPlan) return;
  const w = weather();
  const base = 9 + state.level * 1.2 + state.day * 0.7;
  const rep = 0.85 + (rating() / 5) * 0.25;
  const extras = 1 + ambience() * 0.03 + state.upgrades.sign * 0.12;
  const expected = clamp(Math.round(base * w.mult * rep * extras), 5, 60);
  const duration = Math.round(80 + expected * 4.2);
  const priceDrag = clamp(1 - (avgPrice() - 50000) / 260000, 0.86, 1.08);
  state.dayPlan = {
    ...state.dayPlan,
    day: state.day,
    expected,
    duration,
    interval: duration / expected,
    patience: patienceBase() * priceDrag,
  };
}

export function rollDayPlan() {
  const w = pick(WEATHERS);
  state.dayPlan = { day: state.day, weather: w.id };
  refreshDayPlan();
}

export function rollMissions() {
  const d = state.day;
  const reward = 40000 + d * 1500;
  state.missions = [
    { id: 'sell', type: 'sell', target: 8 + Math.round(d * 0.9), progress: 0, reward, xp: 50 },
    { id: 'five', type: 'five', target: 2 + Math.floor(d / 3), progress: 0, reward, xp: 50 },
    { id: 'spicy', type: 'spicy', target: 2 + Math.floor(d / 4), progress: 0, reward, xp: 50 },
  ];
  state.missionDay = d;
}

export function ensureDay() {
  if (!state.dayPlan || state.dayPlan.day !== state.day || state.missionDay !== state.day) {
    rollDayPlan();
    rollMissions();
    state.daySpent = 0;
  }
}

export function addReview(stars, text, customerName = '') {
  state.rating.sum += stars;
  state.rating.count += 1;
  state.reviews.unshift({
    id: newReviewId(),
    day: state.day,
    stars,
    text,
    name: customerName,
    ownerReply: null,
    customerReply: null,
  });
  if (state.reviews.length > 80) state.reviews.length = 80;
}

export function replyToReview(id, text) {
  const review = state.reviews.find((r) => r.id === id);
  const body = String(text || '').trim().slice(0, 160);
  if (!review || !body || review.ownerReply) return false;
  review.ownerReply = body;
  return true;
}

export function customerReplyToReview(id) {
  const review = state.reviews.find((r) => r.id === id);
  if (!review || !review.ownerReply || review.customerReply) return false;
  const tone = review.stars >= 5 ? 'high' : review.stars === 4 ? 'good' : review.stars === 3 ? 'mid' : 'low';
  review.customerReply = pick(CUSTOMER_COMEBACKS[tone]);
  return true;
}

export function leaderScore() {
  const profit = state.history.reduce((s, h) => s + Math.max(0, h.profit) / 1000, 0);
  return Math.round(state.level * 120 + state.xp / 2 + profit);
}

// Mở lại app: còn ca đang dở thì vào tiếp ca đó (đứng ở trạng thái tạm dừng), không thì về trang chuẩn bị.
export function resumeScreen() {
  if (state.phase === 'service' && state.serviceSave && state.serviceSave.day === state.day) return 'service';
  state.phase = 'prep';
  state.serviceSave = null;
  return 'prep';
}

export function startNextDay() {
  state.day += 1;
  state.daySpent = 0;
  state.dayPlan = null;
  state.missions = [];
  state.missionDay = 0;
}
