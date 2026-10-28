import {
  state,
  save,
  seats,
  cookTime,
  batchSize,
  rating,
  ratingCount,
  addXp,
  addReview,
  dailyFixed,
  brothById,
  toppingById,
} from '../state.js';
import { BROTHS, TOPPINGS, SPICE } from '../data.js';
import { makeOrder, orderHTML, evaluate, reactionFor, reviewFor, bumpMission } from '../game.js';
import { money, mmss, ratingText, esc } from '../format.js';
import { starsHTML, toast, modal } from '../ui.js';
import { sfx } from '../audio.js';
import { go } from '../router.js';

export default function service(root) {
  const plan = state.dayPlan;
  const saved = state.serviceSave && state.serviceSave.day === state.day ? JSON.parse(JSON.stringify(state.serviceSave)) : null;
  const session = saved
    ? {
        plan,
        ...saved,
        paused: true,
        ended: false,
        lastTs: 0,
      }
    : {
        plan,
        time: plan.duration,
        tables: [],
        spawnLeft: plan.expected,
        spawnTimer: 1.4,
        pot: { phase: 'idle', t: 0, ready: 0 },
        noodles: 0,
        bowl: null,
        earnings: 0,
        served: 0,
        stars: [],
        paused: false,
        ended: false,
        selectedId: null,
        nextId: 1,
        lastTs: 0,
      };
  if (!saved) state.serviceSave = null;

  const refs = { pats: [], potFill: null, orderBar: null };
  let raf = 0;

  root.innerHTML = `
    <div class="svc">
      <header class="svc-head">
        <button class="ic-btn" data-act="pause" aria-label="Tạm dừng">⏸</button>
        <div class="svc-day"><b>Ngày ${state.day}</b><span id="svcTimer">--:--</span></div>
        <div class="svc-money"><span class="cap">Két</span><b id="svcMoney">0k</b></div>
        <div class="svc-rate" id="svcRate">
          ${starsHTML(rating())}
          <span>${ratingText(rating())} · ${ratingCount()} đánh giá</span>
        </div>
      </header>

      <section class="dining">
        <div class="awning-strip"></div>
        <div class="tables" id="tables"></div>
      </section>

      <section class="order-card" id="orderCard"></section>
      <div class="stock-row" id="stockRow"></div>
      <div class="stations" id="stations"></div>

      <div class="build">
        <div class="bowl-box" id="bowlBox"></div>
        <div class="build-side">
          <button class="sauce-btn" data-act="sauce" aria-label="Thêm sốt ớt">
            <span class="sauce-emoji">🌶️</span>
            <b id="sauceLevel">0</b>
            <small>Sốt ớt</small>
          </button>
          <button class="dump-btn" data-act="dump">
            <span>🗑️</span>
            <b>Đổ tô</b>
          </button>
        </div>
      </div>

      <div class="spice-row" id="spiceRow"></div>
      <button class="serve-btn" id="serveBtn" data-act="serve"><span>🛎️</span> Giao món</button>
      <div class="topping-grid" id="toppingGrid"></div>

      <div class="pause-layer" id="pauseLayer" hidden>
        <div class="pause-card">
          <h2>Tạm dừng</h2>
          <p id="pauseInfo"></p>
          <button class="btn primary" data-act="resume">Tiếp tục nấu</button>
          <button class="btn ghost" data-act="endday" style="margin-top:8px">Kết thúc ngày luôn</button>
        </div>
      </div>
    </div>`;

  const q = (sel) => root.querySelector(sel);

  function selected() {
    return session.tables.find((c) => c.id === session.selectedId) || session.tables[0] || null;
  }

  function renderTables() {
    const n = seats();
    let html = '';
    for (let i = 0; i < n; i += 1) {
      const c = session.tables[i];
      if (c) {
        const pct = Math.max(0, (c.t / c.max) * 100);
        html += `<button class="tbl occupied ${c.id === session.selectedId ? 'sel' : ''}" data-seat="${c.id}">
          <span class="tbl-ava" style="--bg:${c.cust.bg}">${c.cust.emoji}</span>
          <span class="tbl-name">${esc(c.cust.name)}</span>
          <span class="tbl-pat"><i data-pat="${c.id}" style="width:${pct}%"></i></span>
        </button>`;
      } else {
        html += '<div class="tbl empty"><span>Bàn trống</span></div>';
      }
    }
    q('#tables').innerHTML = html;
  }

  function renderOrderCard() {
    const c = selected();
    const card = q('#orderCard');
    if (!c) {
      card.innerHTML = '<div class="oc-empty">Chưa có khách. Thả mì và chờ khách ghé nha.</div>';
      refs.orderBar = null;
      return;
    }
    const pct = Math.max(0, (c.t / c.max) * 100);
    card.innerHTML = `
      <div class="oc-face" style="background:${c.cust.bg}">${c.cust.emoji}</div>
      <div class="oc-main">
        <div class="oc-name">${esc(c.cust.name)}</div>
        <div class="oc-text">${orderHTML(c.cust, c.order)}</div>
        <div class="oc-bar"><i style="width:${pct}%"></i></div>
      </div>`;
    refs.orderBar = card.querySelector('.oc-bar i');
  }

  function renderStock() {
    const chips = [
      `<button class="stock-chip bowl ${session.bowl ? 'on' : ''}" data-act="take-bowl">
        <span class="sc-ic">🥣</span><b>${state.stock.bowls}</b><small>Lấy tô</small>
      </button>`,
    ];
    for (const b of BROTHS) {
      const locked = b.unlock > state.level;
      const have = state.stock.broth[b.id] || 0;
      const on = session.bowl?.broth === b.id;
      chips.push(`<button class="stock-chip ${locked ? 'locked' : ''} ${on ? 'on' : ''}"
        ${locked ? 'disabled' : `data-broth="${b.id}"`}>
        <span class="sc-ic" ${locked ? '' : `style="background:${b.color}22"`}>${locked ? '🔒' : b.emoji}</span>
        <b>${locked ? 'Cấp ' + b.unlock : have}</b>
        <small>${b.name}</small>
      </button>`);
    }
    q('#stockRow').innerHTML = chips.join('');
  }

  function renderStations() {
    const totalBroth = BROTHS.reduce((s, b) => s + (state.stock.broth[b.id] || 0), 0);
    const cap = 18 + state.upgrades.pot * 8;
    const brothPct = Math.min(100, (totalBroth / cap) * 100);
    const p = session.pot;
    const cookPct = p.phase === 'cooking' ? Math.min(100, (p.t / cookTime()) * 100) : p.phase === 'ready' ? 100 : 0;
    q('#stations').innerHTML = `
      <div class="st-card">
        <span class="st-ic">🍲</span>
        <span class="st-name">Nước dùng</span>
        <div class="st-gauge"><i style="width:${brothPct}%"></i></div>
        <b class="st-num">${totalBroth}<small>phần</small></b>
      </div>
      <button class="st-card pot ${p.phase}" data-act="pot">
        <span class="st-ic">${p.phase === 'ready' ? '✅' : '🍜'}</span>
        <span class="st-name">${p.phase === 'idle' ? 'Thả mì' : p.phase === 'cooking' ? 'Đang nấu' : 'Vớt mì'}</span>
        <div class="st-gauge cook"><i style="width:${cookPct}%"></i></div>
        <b class="st-num">${p.phase === 'ready' ? 'Vớt!' : p.phase === 'cooking' ? '...' : `+${batchSize()}<small>phần</small>`}</b>
      </button>
      <div class="st-card basket">
        <span class="st-ic">🧺</span>
        <span class="st-name">Rổ mì chín</span>
        <div class="st-gauge"><i style="width:${Math.min(100, (session.noodles / 12) * 100)}%"></i></div>
        <b class="st-num">${session.noodles}<small>phần</small></b>
      </div>`;
    refs.potFill = q('#stations .pot .st-gauge i');
  }

  function renderBowl() {
    const box = q('#bowlBox');
    const b = session.bowl;
    if (!b) {
      box.innerHTML = `<div class="bowl-empty"><span class="dashed-bowl">🥣</span><p>Chưa có tô.<br>Chạm <b>Lấy tô</b> để lấy.</p></div>`;
      return;
    }
    const broth = b.broth ? brothById(b.broth) : null;
    const tops = b.toppings.map((id) => toppingById(id).emoji).join('');
    box.innerHTML = `
      <div class="bowl-visual ${broth ? 'filled' : ''}" style="--broth:${broth ? broth.color : '#e9d6c6'};--deep:${broth ? broth.deep : '#c9b0a0'}">
        <div class="bv-tops">${tops}</div>
        <div class="bv-rim"></div>
        <div class="bv-body"></div>
        <div class="bv-badge">Cấp ${b.spice}</div>
      </div>
      <div class="bowl-meta">${broth ? `Mì ${broth.name.toLowerCase()}` : 'Chưa chọn nước dùng'}${
        b.toppings.length ? ` · ${b.toppings.length} topping` : ''
      }</div>`;
  }

  function renderSpice() {
    const cur = session.bowl?.spice ?? -1;
    q('#spiceRow').innerHTML = SPICE.map(
      (s) => `<button class="spice-chip ${cur === s.level ? 'on' : ''}" data-spice="${s.level}"
        style="--c:${s.color};--ink:${s.ink}" aria-label="${s.name}">${s.level}</button>`,
    ).join('');
    const lvl = q('#sauceLevel');
    if (lvl) lvl.textContent = String(cur < 0 ? 0 : cur);
  }

  function renderToppings() {
    const cur = session.bowl?.toppings || [];
    q('#toppingGrid').innerHTML = TOPPINGS.map((t) => {
      const locked = t.unlock > state.level;
      const have = state.stock.toppings[t.id] || 0;
      const on = cur.includes(t.id);
      return `<button class="top ${locked ? 'locked' : ''} ${on ? 'on' : ''}" ${locked ? 'disabled' : ''} data-top="${t.id}">
        <span class="top-ic">${locked ? '🔒' : t.emoji}</span>
        ${locked ? `<span class="top-lock">Cấp ${t.unlock}</span>` : `<span class="top-count ${have === 0 ? 'zero' : ''}">${have}</span>`}
        <span class="top-name">${t.name}</span>
      </button>`;
    }).join('');
  }

  function renderServe() {
    const btn = q('#serveBtn');
    const ready = !!session.bowl?.broth && session.noodles > 0 && session.tables.length > 0;
    btn.classList.toggle('off', !ready);
  }

  function renderHeaderRating() {
    const el = q('#svcRate');
    if (!el) return;
    el.innerHTML = `${starsHTML(rating())}<span>${ratingText(rating())} · ${ratingCount()} đánh giá</span>`;
  }

  function renderAll() {
    renderTables();
    renderOrderCard();
    renderStock();
    renderStations();
    renderBowl();
    renderSpice();
    renderToppings();
    renderServe();
    cachePatience();
  }

  function cachePatience() {
    refs.pats = [...root.querySelectorAll('[data-pat]')].map((el) => ({
      el,
      id: Number(el.dataset.pat),
    }));
  }

  function paint() {
    const timer = q('#svcTimer');
    if (timer) timer.textContent = mmss(session.time);
    const cash = q('#svcMoney');
    if (cash) cash.textContent = money(state.money + session.earnings);

    for (const { el, id } of refs.pats) {
      const c = session.tables.find((x) => x.id === id);
      if (!c) continue;
      const pct = Math.max(0, (c.t / c.max) * 100);
      el.style.width = pct + '%';
      el.classList.toggle('warn', pct < 45 && pct >= 22);
      el.classList.toggle('danger', pct < 22);
    }
    if (refs.orderBar) {
      const c = selected();
      if (c) {
        const pct = Math.max(0, (c.t / c.max) * 100);
        refs.orderBar.style.width = pct + '%';
      }
    }
    if (refs.potFill) {
      const p = session.pot;
      const pct = p.phase === 'cooking' ? Math.min(100, (p.t / cookTime()) * 100) : p.phase === 'ready' ? 100 : 0;
      refs.potFill.style.width = pct + '%';
    }
  }

  function seatCustomer() {
    const order = makeOrder();
    const c = {
      id: session.nextId++,
      cust: order.cust,
      order,
      t: plan.patience,
      max: plan.patience,
    };
    session.tables.push(c);
    if (!session.selectedId) session.selectedId = c.id;
    sfx('pop');
    renderTables();
    if (session.tables.length === 1) renderOrderCard();
    cachePatience();
  }

  function takeBowl() {
    if (session.bowl) return session.bowl;
    if (state.stock.bowls <= 0) {
      toast('Hết tô sạch rồi', 'bad');
      sfx('error');
      return null;
    }
    state.stock.bowls -= 1;
    session.bowl = { broth: null, spice: 0, toppings: [] };
    sfx('pop');
    renderStock();
    renderBowl();
    renderSpice();
    renderToppings();
    renderServe();
    return session.bowl;
  }

  function chooseBroth(id) {
    const b = brothById(id);
    if (!b) return;
    if (b.unlock > state.level) return toast(`Mở ở cấp ${b.unlock}`, 'bad');
    if ((state.stock.broth[id] || 0) <= 0) {
      toast(`Hết nước dùng ${b.name.toLowerCase()} rồi`, 'bad');
      sfx('error');
      return;
    }
    if (!session.bowl && !takeBowl()) return;
    if (session.bowl.broth === id) return;
    if (session.bowl.broth) state.stock.broth[session.bowl.broth] += 1;
    state.stock.broth[id] -= 1;
    session.bowl.broth = id;
    sfx('tap');
    renderStock();
    renderStations();
    renderBowl();
    renderServe();
  }

  function toggleTop(id) {
    const t = toppingById(id);
    if (!t) return;
    if (t.unlock > state.level) return toast(`Mở ở cấp ${t.unlock}`, 'bad');
    if (!session.bowl && !takeBowl()) return;
    const idx = session.bowl.toppings.indexOf(id);
    if (idx >= 0) {
      session.bowl.toppings.splice(idx, 1);
      state.stock.toppings[id] = (state.stock.toppings[id] || 0) + 1;
    } else {
      if ((state.stock.toppings[id] || 0) <= 0) {
        toast(`Hết ${t.name.toLowerCase()} rồi`, 'bad');
        sfx('error');
        return;
      }
      state.stock.toppings[id] -= 1;
      session.bowl.toppings.push(id);
    }
    sfx('tap');
    renderToppings();
    renderBowl();
  }

  function setSpice(level) {
    if (!session.bowl && !takeBowl()) return;
    session.bowl.spice = level;
    sfx('tap');
    renderSpice();
    renderBowl();
  }

  function dumpBowl() {
    if (!session.bowl) return;
    if (session.bowl.broth) state.stock.broth[session.bowl.broth] += 1;
    for (const id of session.bowl.toppings) state.stock.toppings[id] = (state.stock.toppings[id] || 0) + 1;
    session.bowl = null;
    sfx('tap');
    renderStock();
    renderStations();
    renderBowl();
    renderSpice();
    renderToppings();
    renderServe();
  }

  function potTap() {
    const p = session.pot;
    if (p.phase === 'idle') {
      p.phase = 'cooking';
      p.t = 0;
      sfx('tap');
      renderStations();
    } else if (p.phase === 'ready') {
      const got = batchSize();
      session.noodles += got;
      session.pot = { phase: 'idle', t: 0, ready: 0 };
      sfx('ready');
      toast(`Vớt được ${got} phần mì`);
      renderStations();
      renderServe();
    } else {
      toast('Mì chưa chín, chờ chút đã');
    }
  }

  function floatMoney(text, good) {
    const host = q('.dining');
    const el = document.createElement('div');
    el.className = `float-money ${good ? 'good' : 'bad'}`;
    el.textContent = text;
    host.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  function serve() {
    if (session.paused || session.ended) return;
    if (!session.bowl) return toast('Chưa có tô nào trên tay', 'bad');
    if (!session.bowl.broth) return toast('Chọn nước dùng cho tô đã', 'bad');
    if (session.noodles <= 0) return toast('Chưa có mì chín, thả mì trước đã', 'bad');
    const c = selected();
    if (!c) return toast('Chưa có khách nào', 'bad');

    const waitRatio = 1 - c.t / c.max;
    const res = evaluate(session.bowl, c.order, waitRatio);
    session.noodles -= 1;
    session.bowl = null;
    session.earnings += res.total;
    session.served += 1;
    session.stars.push(res.stars);
    addReview(res.stars, reviewFor(res.stars, c.order), c.cust.name);

    const done = [];
    if (bumpMission('sell')) done.push('Bán đủ tô');
    if (res.stars === 5 && bumpMission('five')) done.push('Đủ 5 sao');
    if (c.order.spice >= 4 && bumpMission('spicy')) done.push('Đủ tô cay');

    session.tables = session.tables.filter((x) => x.id !== c.id);
    const next = session.tables[0];
    session.selectedId = next ? next.id : null;

    sfx(res.stars >= 4 ? 'serve' : 'error');
    toast(`${reactionFor(res.stars)} +${money(res.total)}`, res.stars >= 4 ? 'good' : 'bad');
    floatMoney(`+${money(res.total)}`, res.stars >= 4);
    done.forEach((d) => setTimeout(() => toast(`Xong nhiệm vụ: ${d}`, 'good'), 400));

    renderAll();
    renderHeaderRating();
    save();
  }

  function snapshot() {
    state.serviceSave = {
      day: state.day,
      time: session.time,
      tables: session.tables,
      spawnLeft: session.spawnLeft,
      spawnTimer: session.spawnTimer,
      pot: session.pot,
      noodles: session.noodles,
      bowl: session.bowl,
      earnings: session.earnings,
      served: session.served,
      stars: session.stars,
      nextId: session.nextId,
      selectedId: session.selectedId,
    };
  }

  function finish() {
    if (session.ended) return;
    session.ended = true;
    state.serviceSave = null;
    cancelAnimationFrame(raf);

    const fixed = dailyFixed();
    const spent = state.daySpent;
    const revenue = session.earnings;
    const expenses = spent + fixed.total;
    const profit = revenue - expenses;

    let missionMoney = 0;
    let missionXp = 0;
    const missions = state.missions.map((m) => {
      const done = m.progress >= m.target;
      if (done) {
        missionMoney += m.reward;
        missionXp += m.xp;
      }
      return { ...m, done };
    });

    const starSum = session.stars.reduce((s, x) => s + x, 0);
    const avgStars = session.stars.length ? starSum / session.stars.length : 0;
    const baseXp = Math.round(session.served * 18 + starSum * 2 + missionXp);
    const levels = addXp(baseXp);

    state.money += missionMoney + revenue - fixed.total;

    let spoil = 0;
    for (const b of BROTHS) {
      spoil += state.stock.broth[b.id] || 0;
      state.stock.broth[b.id] = 0;
    }

    const record = {
      day: state.day,
      revenue,
      expenses,
      profit,
      customers: session.served,
      stars: avgStars,
    };
    state.history.push(record);
    state.lastSummary = {
      ...record,
      xp: baseXp,
      levels,
      missions,
      spoil,
      fixed,
      spent,
      missionMoney,
      expected: plan.expected,
      unserved: session.tables.length,
    };
    state.phase = 'summary';
    save();
    go('summary');
  }

  function openPause(resumed) {
    session.paused = true;
    snapshot();
    save();
    const layer = q('#pauseLayer');
    layer.hidden = false;
    q('#pauseInfo').textContent = `${resumed ? 'Bạn quay lại giữa ca. ' : ''}Còn ${mmss(session.time)} và ${session.tables.length} khách đang chờ.`;
  }

  function closePause() {
    session.paused = false;
    state.serviceSave = null;
    save();
    q('#pauseLayer').hidden = true;
  }

  root.addEventListener('click', (e) => {
    const seatBtn = e.target.closest('[data-seat]');
    if (seatBtn) {
      session.selectedId = Number(seatBtn.dataset.seat);
      sfx('tap');
      renderTables();
      renderOrderCard();
      return;
    }
    const brothBtn = e.target.closest('[data-broth]');
    if (brothBtn) return chooseBroth(brothBtn.dataset.broth);
    const topBtn = e.target.closest('[data-top]');
    if (topBtn) return toggleTop(topBtn.dataset.top);
    const spiceBtn = e.target.closest('[data-spice]');
    if (spiceBtn) return setSpice(Number(spiceBtn.dataset.spice));

    const act = e.target.closest('[data-act]')?.dataset.act;
    switch (act) {
      case 'take-bowl':
        return takeBowl();
      case 'sauce':
        if (!session.bowl && !takeBowl()) return;
        return setSpice(Math.min(7, session.bowl.spice + 1));
      case 'dump':
        return dumpBowl();
      case 'pot':
        return potTap();
      case 'serve':
        return serve();
      case 'pause':
        return openPause();
      case 'resume':
        sfx('tap');
        return closePause();
      case 'endday':
        return modal({
          title: 'Kết thúc ngày?',
          sub: 'Khách đang chờ sẽ phải về, doanh thu hôm nay giữ nguyên.',
          actions: [
            {
              label: 'Nấu tiếp',
              onClick: () => closePause(),
            },
            {
              label: 'Đóng cửa',
              kind: 'primary',
              onClick: () => finish(),
            },
          ],
        });
      default:
        return;
    }
  });

  function update(dt) {
    session.time -= dt;
    if (session.time <= 0) {
      session.time = 0;
      finish();
      return;
    }

    if (session.spawnLeft > 0) {
      session.spawnTimer -= dt;
      if (session.spawnTimer <= 0) {
        if (session.tables.length < seats()) {
          seatCustomer();
          session.spawnLeft -= 1;
          session.spawnTimer = plan.interval * (0.8 + Math.random() * 0.4);
        } else {
          session.spawnTimer = 0.6;
        }
      }
    }

    for (const c of [...session.tables]) {
      c.t -= dt;
      if (c.t <= 0) {
        session.tables = session.tables.filter((x) => x !== c);
        if (session.selectedId === c.id) session.selectedId = session.tables[0]?.id ?? null;
        addReview(1, 'Chờ lâu quá nên mình đi trước...', c.cust.name);
        toast(`${c.cust.name} bỏ đi vì chờ lâu`, 'bad');
        sfx('error');
        renderAll();
      }
    }

    const p = session.pot;
    if (p.phase === 'cooking') {
      p.t += dt;
      if (p.t >= cookTime()) {
        p.phase = 'ready';
        p.ready = 0;
        sfx('ready');
        toast('Mì chín rồi, vớt thôi!');
        renderStations();
      }
    } else if (p.phase === 'ready') {
      p.ready += dt;
      if (p.ready >= 12) {
        session.pot = { phase: 'idle', t: 0, ready: 0 };
        toast('Mì cháy rồi, bỏ mẻ đó', 'bad');
        sfx('error');
        renderStations();
      }
    }

    if (session.spawnLeft === 0 && session.tables.length === 0) {
      finish();
    }
  }

  function loop(ts) {
    if (session.ended) return;
    const dt = Math.min(0.05, (ts - (session.lastTs || ts)) / 1000);
    session.lastTs = ts;
    if (!session.paused) update(dt);
    if (session.ended) return;
    paint();
    raf = requestAnimationFrame(loop);
  }

  const onHide = () => {
    if (document.hidden && !session.ended && !session.paused) openPause();
  };
  document.addEventListener('visibilitychange', onHide);

  // Đóng tab giữa ca thì lưu lại nguyên ca để lần sau mở tiếp.
  const onPageHide = () => {
    if (session.ended) return;
    snapshot();
    save();
  };
  window.addEventListener('pagehide', onPageHide);

  // Teechat: khung quán bị đóng thì ngày đang bán cũng dừng lại.
  const onHostHide = (e) => {
    if (e.data?.type !== 'teechat:biz-hidden') return;
    if (!session.ended && !session.paused) openPause();
  };
  window.addEventListener('message', onHostHide);

  renderAll();
  paint();
  if (saved) openPause(true);
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener('visibilitychange', onHide);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('message', onHostHide);
  };
}
