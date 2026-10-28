import {
  state,
  save,
  ensureDay,
  rating,
  ratingCount,
  levelNeed,
  unlockedBroths,
  unlockedToppings,
  brothCap,
  dailyFixed,
  refreshDayPlan,
  brothById,
  upgradeById,
  ambience,
  weather,
  replyToReview,
  customerReplyToReview,
  leaderScore,
  resetSave,
} from '../state.js';
import { BROTHS, TOPPINGS, UPGRADES, DECOR, MISSION_TYPES } from '../data.js';
import { money, ratingText, esc } from '../format.js';
import { starsHTML, modal, toast } from '../ui.js';
import { chiliSVG } from '../art.js';
import { sfx } from '../audio.js';
import { go } from '../router.js';
import { fetchLeaderboard, cloudConfigured, getUser, signOut, errorText } from '../cloud.js';
import { leaveToAuth } from '../session.js';
import { openHowto } from '../howto.js';

const BOWL_COST = 1200;

const TABS = [
  { id: 'kho', label: 'Kho' },
  { id: 'gia', label: 'Giá bán' },
  { id: 'nangcap', label: 'Nâng cấp' },
  { id: 'trangtri', label: 'Trang trí' },
  { id: 'danhgia', label: 'Đánh giá' },
  { id: 'so', label: 'Sổ sách' },
];

function missionRows() {
  return state.missions
    .map((m) => {
      const def = MISSION_TYPES[m.type];
      return `<div class="mission">
        <span class="m-ic">${def.icon}</span>
        <div class="m-body">
          <b>${def.label(m.target)}</b>
          <span>Thưởng ${money(m.reward)} · +${m.xp} XP</span>
        </div>
        <em class="m-prog ${m.progress >= m.target ? 'done' : ''}">${m.progress}/${m.target}</em>
      </div>`;
    })
    .join('');
}

function khoHTML() {
  const brothRows = BROTHS.map((b) => {
    const locked = b.unlock > state.level;
    const have = state.stock.broth[b.id] || 0;
    const packCost = b.cost * 5;
    return `<div class="broth-row ${locked ? 'locked' : ''}">
      <span class="b-ic" style="background:${b.color}22;color:${b.color}">${locked ? '🔒' : b.emoji}</span>
      <div class="b-info">
        <b>${b.name}</b>
        <span>${locked ? `Mở ở cấp ${b.unlock}` : `Còn ${have} phần · ${money(b.cost)}/phần`}</span>
      </div>
      ${
        locked
          ? '<span class="lock-tag">Cấp ' + b.unlock + '</span>'
          : `<button class="buy" data-buy-broth="${b.id}" ${have + 5 > brothCap() ? 'disabled' : ''}>+5<small>${money(packCost)}</small></button>`
      }
    </div>`;
  }).join('');

  const ingCards = TOPPINGS.map((t) => {
    const locked = t.unlock > state.level;
    const have = state.stock.toppings[t.id] || 0;
    return `<button class="ing ${locked ? 'locked' : ''}" ${locked ? 'disabled' : ''} data-buy-top="${t.id}">
      <span class="ing-ic">${locked ? '🔒' : t.emoji}</span>
      <span class="ing-name">${t.name}</span>
      ${locked ? `<span class="ing-lock">Cấp ${t.unlock}</span>` : `<span class="ing-count">${have}</span>`}
      ${locked ? '' : `<span class="ing-buy">+5 · ${money(t.cost * 5)}</span>`}
    </button>`;
  }).join('');

  const totalBroth = BROTHS.reduce((s, b) => s + (state.stock.broth[b.id] || 0), 0);

  return `
    <section class="card mission-card">
      <h3>Nhiệm vụ hôm nay</h3>
      ${missionRows()}
    </section>
    <div class="kho-hint">
      <p>Bấm + để nấu và nhập thêm 5 phần. Dự kiến hôm nay khoảng <b>${state.dayPlan.expected} khách</b>.</p>
      <button class="chip-btn" data-act="suggest">Gợi ý số lượng</button>
    </div>
    <h3 class="sec-title">Nước dùng <span>Nồi chứa ${totalBroth}/${brothCap()} phần</span></h3>
    <div class="card list-card">${brothRows}</div>
    <h3 class="sec-title">Nguyên liệu</h3>
    <div class="ing-grid">${ingCards}</div>
    <h3 class="sec-title">Tô</h3>
    <div class="card bowl-row-card">
      <div class="bowl-info">
        <span class="bowl-ic">🥣</span>
        <div><b>Còn ${state.stock.bowls} cái</b><span>${money(BOWL_COST)}/cái</span></div>
      </div>
      <button class="buy" data-buy-bowl>+10<small>${money(BOWL_COST * 10)}</small></button>
    </div>`;
}

function giaHTML() {
  const rows = unlockedBroths()
    .map((b) => {
      const price = state.prices[b.id];
      return `<div class="price-row">
        <span class="b-ic" style="background:${b.color}22;color:${b.color}">${b.emoji}</span>
        <div class="b-info"><b>${b.name}</b><span>Giá gốc ${money(b.price)}</span></div>
        <div class="stepper">
          <button data-price="${b.id}" data-dir="-1">−</button>
          <b>${money(price)}</b>
          <button data-price="${b.id}" data-dir="1">+</button>
        </div>
      </div>`;
    })
    .join('');
  return `
    <section class="card">
      <h3>Chỉnh giá bán</h3>
      <p class="note">Giá cao thì lời hơn nhưng khách khó tính, chờ lâu hơn một chút là họ cằn nhằn. Giá mềm thì khách dễ chịu hơn.</p>
      ${rows}
      <div class="avg-line">Giá trung bình mỗi tô: <b>${money(Math.round((unlockedBroths().reduce((s, b) => s + state.prices[b.id], 0)) / unlockedBroths().length))}</b></div>
    </section>`;
}

function upgradeHTML() {
  return `<div class="up-grid">${UPGRADES.map((u) => {
    const lvl = state.upgrades[u.id];
    const maxed = lvl >= u.costs.length;
    const locked = state.level < u.unlock;
    const cost = maxed ? 0 : u.costs[lvl];
    return `<div class="up-card ${locked ? 'locked' : ''}">
      <span class="up-ic">${u.icon}</span>
      <div class="up-body">
        <b>${u.name}</b>
        <p>${u.desc}</p>
        <div class="pips">${u.costs.map((_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</div>
      </div>
      ${
        locked
          ? `<span class="lock-tag">Cấp ${u.unlock}</span>`
          : maxed
            ? '<span class="tag green">Tối đa</span>'
            : `<button class="buy" data-upgrade="${u.id}" ${state.money < cost ? 'disabled' : ''}>${money(cost)}</button>`
      }
    </div>`;
  }).join('')}</div>`;
}

function decorHTML() {
  const list = DECOR.map((d) => {
    const owned = state.decor.includes(d.id);
    return `<button class="decor-card ${owned ? 'owned' : ''}" data-decor="${d.id}" ${owned ? 'disabled' : ''}>
      <span class="decor-ic">${d.icon}</span>
      <b>${d.name}</b>
      <span>${owned ? 'Đã bày' : money(d.cost)}</span>
      ${owned ? '<em>✓</em>' : ''}
    </button>`;
  }).join('');
  const amb = ambience();
  return `<div class="decor-note">
      <p>Đồ trang trí làm quán ấm cúng hơn: khách dễ cho điểm cao và ghé đông hơn một chút.</p>
      <span class="tag red">Ấm cúng ${amb}/4 ${'❤'.repeat(amb)}</span>
    </div>
    <div class="decor-grid">${list}</div>`;
}

function reviewCard(r) {
  return `<div class="review">
    <div class="rev-top">
      <b>${esc(r.name || 'Khách')}</b>
      <span class="rev-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span>
    </div>
    <p>${esc(r.text)}</p>
    <div class="rev-foot">
      <span class="rev-day">Ngày ${r.day}</span>
      ${r.ownerReply ? '' : `<button class="rev-reply" data-reply="${esc(r.id)}">Trả lời</button>`}
    </div>
    ${r.ownerReply ? `<div class="rev-bubble owner"><b>Quán</b><p>${esc(r.ownerReply)}</p></div>` : ''}
    ${r.customerReply ? `<div class="rev-bubble guest"><b>${esc(r.name || 'Khách')}</b><p>${esc(r.customerReply)}</p></div>` : ''}
  </div>`;
}

function reviewsHTML() {
  const avg = rating();
  const count = ratingCount();
  const list = state.reviews.length
    ? state.reviews.map((r) => reviewCard(r)).join('')
    : '<div class="empty-note">Chưa có ai đánh giá. Mở cửa đi thôi!</div>';
  return `<div class="rating-head">
      <div class="rating-big">${ratingText(avg)}</div>
      <div>${starsHTML(avg)}<span>${count} đánh giá</span></div>
    </div>
    <p class="rev-hint">Trả lời đánh giá của khách. Thỉnh thoảng họ sẽ rep lại bạn.</p>
    <div class="reviews">${list}</div>`;
}

function booksHTML() {
  if (!state.history.length) {
    return '<div class="empty-note">Sổ còn trắng. Ngày đầu tiên sẽ được ghi sau khi đóng cửa.</div>';
  }
  const rows = [...state.history]
    .reverse()
    .map(
      (h) => `<div class="book-row">
      <div class="bk-day"><b>Ngày ${h.day}</b><span>${h.customers} khách</span></div>
      <div class="bk-num"><span>Thu</span><b>${money(h.revenue)}</b></div>
      <div class="bk-num"><span>Chi</span><b>${money(h.expenses)}</b></div>
      <div class="bk-profit ${h.profit >= 0 ? 'pos' : 'neg'}">${money(h.profit)}</div>
    </div>`,
    )
    .join('');
  const total = state.history.reduce((s, h) => s + h.profit, 0);
  return `<div class="books">${rows}</div>
    <div class="book-total">Tổng lời sau ${state.history.length} ngày <b class="${total >= 0 ? 'pos' : 'neg'}">${money(total)}</b></div>`;
}

function bodyHTML(tab) {
  switch (tab) {
    case 'gia':
      return giaHTML();
    case 'nangcap':
      return upgradeHTML();
    case 'trangtri':
      return decorHTML();
    case 'danhgia':
      return reviewsHTML();
    case 'so':
      return booksHTML();
    default:
      return khoHTML();
  }
}

export default function prep(root) {
  ensureDay();
  state.phase = 'prep';
  save();

  let tab = 'kho';
  let scrollTop = 0;
  let replyTimers = [];

  const fixed = dailyFixed();
  const avg = rating();
  const count = ratingCount();
  const xpPct = Math.min(100, (state.xp / levelNeed()) * 100);

  function shell() {
    return `
    <div class="prep">
      <header class="prep-top">
        <div class="prep-day">
          <span class="w-icon">${weather().icon}</span>
          <div><b>Ngày ${state.day}</b><span>Chuẩn bị</span></div>
        </div>
        <div class="prep-money"><span class="cap">Két</span><b class="money">${money(state.money)}</b></div>
        <div class="prep-rate">
          ${starsHTML(avg)}
          <span>${count ? `${ratingText(avg)} · ${count} đánh giá` : 'Chưa có đánh giá'}</span>
        </div>
      </header>

      <div class="prep-scroll">
        <section class="shop-banner">
          <div class="sb-main">
            <div class="sb-name">
              <h2>${esc(state.shopName)}</h2>
              <button class="sb-mini" data-act="rename" aria-label="Đổi tên quán" title="Đổi tên quán">✏️</button>
              <button class="sb-mini sb-info" data-act="how" aria-label="Cách chơi" title="Cách chơi">i</button>
            </div>
            <div class="sb-level">Cấp ${state.level} · ${state.upgrades.tables >= 2 ? 'Tiệm vừa' : state.upgrades.tables >= 1 ? 'Tiệm nhỏ' : 'Quán vỉa hè'}</div>
            <div class="xp-bar"><i style="width:${xpPct}%"></i><span>${state.xp}/${levelNeed()} XP</span></div>
            <div class="sb-actions">
              <button class="pill-btn" data-act="rank">🏆 Bảng xếp hạng</button>
              <button class="pill-btn" data-act="account">${cloudConfigured() && getUser() ? '👤 Tài khoản' : '👤 Chơi thử'}</button>
            </div>
          </div>
          <div class="sb-mascot">${chiliSVG('banner-chili')}</div>
        </section>

        <div class="weather-card">
          <b>${weather().icon} Hôm nay: ${weather().name}</b>
          <span>${weather().text}</span>
        </div>

        <nav class="tabs">
          ${TABS.map((t) => `<button class="tab ${t.id === tab ? 'on' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
        </nav>

        <div class="tab-body">${bodyHTML(tab)}</div>
      </div>

      <footer class="prep-cta">
        <button class="btn primary open-btn" data-act="open">Mở cửa ngày ${state.day}</button>
        <p>Mặt bằng ${money(fixed.rent)}, điện nước ${money(fixed.util)}, lương nhân viên ${money(fixed.salary)} mỗi ngày</p>
      </footer>
    </div>`;
  }

  function render() {
    const sc = root.querySelector('.prep-scroll');
    if (sc) scrollTop = sc.scrollTop;
    root.innerHTML = shell();
    const sc2 = root.querySelector('.prep-scroll');
    if (sc2) sc2.scrollTop = scrollTop;
  }

  function suggestModal() {
    const plan = state.dayPlan;
    const broths = unlockedBroths();
    const tops = unlockedToppings();
    const perBroth = Math.ceil(plan.expected / broths.length) + 2;
    const perTop = Math.ceil((plan.expected * 1.3) / tops.length) + 1;
    modal({
      title: 'Gợi ý số lượng',
      sub: `Dự kiến ${plan.expected} khách, mỗi khách gọi khoảng 1,3 topping.`,
      body: `<div class="suggest">
        <div class="sg-row"><span>Nước dùng</span><b>${broths.map((b) => `${b.name} ${perBroth}`).join(' · ')}</b></div>
        <div class="sg-row"><span>Topping</span><b>mỗi loại ~${perTop} phần</b></div>
        <div class="sg-row"><span>Tô</span><b>${plan.expected + 3} cái</b></div>
      </div>`,
      actions: [{ label: 'Rồi, nhập hàng', kind: 'primary' }],
    });
  }

  function renameModal() {
    const layer = modal({
      title: 'Đổi tên quán',
      sub: 'Đặt tên gì đó thật kêu, khách sẽ nhớ lâu hơn.',
      body: `<input class="text-input" id="shopNameInput" maxlength="24" value="${esc(state.shopName)}" />`,
      actions: [
        { label: 'Thôi' },
        {
          label: 'Lưu tên',
          kind: 'primary',
          onClick: () => {
            const input = layer.querySelector('#shopNameInput');
            const val = input.value.trim();
            if (val) {
              state.shopName = val;
              save();
              toast('Đã đổi tên quán');
            }
            render();
          },
        },
      ],
    });
    const input = layer.querySelector('#shopNameInput');
    input.focus();
    input.select();
  }

  function rankModal() {
    const signedIn = cloudConfigured() && getUser();
    if (!signedIn) {
      modal({
        title: 'Bảng xếp hạng',
        sub: 'Đăng nhập để so điểm với các quán khác.',
        body: `<div class="rank-self"><span>Điểm quán bạn</span><b>${leaderScore().toLocaleString('vi-VN')} điểm</b></div>
          <p class="acc-note">Bản chơi thử chưa nối máy chủ nên bảng xếp hạng chung chưa có.</p>`,
        actions: [{ label: 'Đóng', kind: 'primary' }],
      });
      return;
    }
    const layer = modal({
      title: 'Bảng xếp hạng',
      sub: `Điểm quán bạn: ${leaderScore().toLocaleString('vi-VN')}. Xếp theo độ nổi tiếng cả khu phố.`,
      body: '<div class="rank-loading">Đang lấy bảng xếp hạng…</div>',
      actions: [{ label: 'Đóng' }],
    });
    loadRank(layer);
  }

  function loadRank(layer) {
    const body = layer.querySelector('.modal-body');
    body.innerHTML = '<div class="rank-loading">Đang lấy bảng xếp hạng…</div>';
    fetchLeaderboard()
      .then(({ rows, mine }) => {
        if (!body.isConnected) return;
        body.innerHTML = rankListHTML(rows, mine);
      })
      .catch((err) => {
        if (!body.isConnected) return;
        console.warn('Bảng xếp hạng lỗi', err);
        body.innerHTML = `<div class="rank-error"><p>${esc(errorText(err))}</p><button class="chip-btn" data-rank-retry>Thử lại</button></div>`;
        body.querySelector('[data-rank-retry]')?.addEventListener('click', () => loadRank(layer));
      });
  }

  function rankListHTML(rows, mine) {
    const rowHTML = (r, rank) => `<div class="rank-row ${r.me ? 'me' : ''}">
      <span class="rk-i ${rank && rank <= 3 ? 'top' : ''}">${rank || '–'}</span>
      <div class="rk-info">
        <span class="rk-name">${esc(r.name)}</span>
        <span class="rk-sub">Cấp ${r.level} · ngày ${r.day}</span>
      </div>
      <b>${Math.round(r.score).toLocaleString('vi-VN')}</b>
    </div>`;

    if (!rows.length) {
      return `${mine ? rowHTML(mine, null) : ''}<div class="rank-empty">Chưa có quán nào trên bảng. Chơi xong một ngày là có tên ngay.</div>`;
    }
    return `<div class="rank-list">${rows.map((r, i) => rowHTML(r, i + 1)).join('')}</div>
      ${mine ? `<div class="rank-divider">Ngoài top 10</div><div class="rank-list">${rowHTML(mine, null)}</div>` : ''}`;
  }

  function replyModal(id) {
    const review = state.reviews.find((r) => r.id === id);
    if (!review || review.ownerReply) return;
    const layer = modal({
      title: `Trả lời ${review.name || 'khách'}`,
      sub: 'Khách sẽ đọc được câu này ngay dưới đánh giá.',
      body: `<p class="reply-quote">“${esc(review.text)}”</p>
        <textarea class="text-input reply-box" id="replyBox" maxlength="160" rows="3"
          placeholder="Cảm ơn bạn đã ghé quán, lần sau mình nấu kỹ hơn…"></textarea>`,
      actions: [
        { label: 'Thôi' },
        {
          label: 'Gửi trả lời',
          kind: 'primary',
          onClick: () => {
            const box = layer.querySelector('#replyBox');
            if (!replyToReview(id, box.value)) {
              toast('Viết vài chữ đã nhé', 'bad');
              return false;
            }
            save();
            render();
            scheduleComeback(id);
            sfx('pop');
            toast('Đã gửi trả lời');
          },
        },
      ],
    });
    layer.querySelector('#replyBox').focus();
  }

  function scheduleComeback(id) {
    if (Math.random() >= 0.35) return;
    const who = state.reviews.find((r) => r.id === id)?.name || 'Khách';
    const timer = setTimeout(() => {
      replyTimers = replyTimers.filter((t) => t !== timer);
      if (!customerReplyToReview(id)) return;
      save();
      render();
      sfx('tap');
      toast(`${who} vừa rep lại bạn`, 'good');
    }, 1400 + Math.random() * 1600);
    replyTimers.push(timer);
  }

  function accountModal() {
    const user = getUser();
    const signedIn = cloudConfigured() && user;
    if (!signedIn) {
      modal({
        title: 'Tài khoản',
        sub: 'Chơi thử trên máy này',
        body: `<p class="acc-note">Chưa có tài khoản hay bảng xếp hạng chung. Tiệm vẫn được lưu trên máy để chơi tiếp.</p>`,
        actions: [{ label: 'Chơi lại từ đầu', kind: 'ghost', onClick: resetConfirm }, { label: 'Đóng', kind: 'primary' }],
      });
      return;
    }
    modal({
      title: 'Tài khoản',
      sub: 'Quán của bạn',
      body: `<div class="acc-head"><span class="acc-dot"></span><div><b>${esc(user.email || '')}</b><span>Đã đăng nhập</span></div></div>
        <div class="acc-rows">
          <div><span>Tên quán</span><b>${esc(state.shopName)}</b></div>
          <div><span>Điểm xếp hạng</span><b>${leaderScore().toLocaleString('vi-VN')} điểm</b></div>
        </div>
        <p class="acc-note">Tiệm lưu trên máy này theo tài khoản. Điểm trên bảng xếp hạng dùng chung với mọi người.</p>`,
      actions: [{ label: 'Đóng' }, { label: 'Đăng xuất', onClick: logoutConfirm }],
    });
  }

  function resetConfirm() {
    modal({
      title: 'Chơi lại từ đầu?',
      sub: 'Tiệm, tiền và cấp độ hiện tại sẽ mất hết. Không lấy lại được đâu.',
      actions: [
        { label: 'Thôi, giữ lại' },
        {
          label: 'Xoá và chơi lại',
          kind: 'primary',
          onClick: () => {
            resetSave();
            ensureDay();
            save();
            sfx('tap');
            toast('Đã dọn tiệm, bắt đầu lại nhé');
            render();
          },
        },
      ],
    });
    return false;
  }

  function logoutConfirm() {
    modal({
      title: 'Đăng xuất?',
      sub: 'Tiệm vẫn còn đó, đăng nhập lại là thấy ngay.',
      actions: [
        { label: 'Ở lại' },
        {
          label: 'Đăng xuất',
          kind: 'primary',
          onClick: () => {
            signOut().finally(() => leaveToAuth());
          },
        },
      ],
    });
    return false;
  }

  function buyBroth(id) {
    const b = brothById(id);
    if (!b || b.unlock > state.level) return;
    if ((state.stock.broth[id] || 0) + 5 > brothCap()) {
      toast(`Nồi chỉ chứa được ${brothCap()} phần thôi`, 'bad');
      return;
    }
    const cost = b.cost * 5;
    if (state.money < cost) {
      toast('Không đủ tiền rồi', 'bad');
      sfx('error');
      return;
    }
    state.money -= cost;
    state.daySpent += cost;
    state.stock.broth[id] = (state.stock.broth[id] || 0) + 5;
    sfx('coin');
    save();
    render();
    toast(`Nấu thêm 5 phần nước dùng ${b.name.toLowerCase()}`);
  }

  function buyTop(id) {
    const t = TOPPINGS.find((x) => x.id === id);
    if (!t || t.unlock > state.level) return;
    const cost = t.cost * 5;
    if (state.money < cost) {
      toast('Không đủ tiền rồi', 'bad');
      sfx('error');
      return;
    }
    state.money -= cost;
    state.daySpent += cost;
    state.stock.toppings[id] = (state.stock.toppings[id] || 0) + 5;
    sfx('coin');
    save();
    render();
  }

  function buyBowl() {
    const cost = BOWL_COST * 10;
    if (state.money < cost) {
      toast('Không đủ tiền rồi', 'bad');
      sfx('error');
      return;
    }
    state.money -= cost;
    state.daySpent += cost;
    state.stock.bowls += 10;
    sfx('coin');
    save();
    render();
  }

  function buyUpgrade(id) {
    const u = upgradeById(id);
    if (!u) return;
    if (state.level < u.unlock) return toast(`Mở ở cấp ${u.unlock}`, 'bad');
    const lvl = state.upgrades[id];
    if (lvl >= u.costs.length) return;
    const cost = u.costs[lvl];
    if (state.money < cost) {
      toast('Không đủ tiền rồi', 'bad');
      sfx('error');
      return;
    }
    state.money -= cost;
    state.daySpent += cost;
    state.upgrades[id] = lvl + 1;
    sfx('level');
    save();
    render();
    toast(`Đã nâng cấp ${u.name.toLowerCase()}`, 'good');
  }

  function buyDecor(id) {
    const d = DECOR.find((x) => x.id === id);
    if (!d || state.decor.includes(id)) return;
    if (state.money < d.cost) {
      toast('Không đủ tiền rồi', 'bad');
      sfx('error');
      return;
    }
    state.money -= d.cost;
    state.daySpent += d.cost;
    state.decor.push(id);
    refreshDayPlan();
    sfx('coin');
    save();
    render();
    toast(`Đã bày ${d.name.toLowerCase()}`, 'good');
  }

  function changePrice(id, dir) {
    const next = Math.max(25000, Math.min(90000, state.prices[id] + dir * 5000));
    if (next === state.prices[id]) return;
    state.prices[id] = next;
    refreshDayPlan();
    sfx('tap');
    save();
    render();
  }

  function openShop() {
    const total = BROTHS.reduce((s, b) => s + (state.stock.broth[b.id] || 0), 0);
    if (total <= 0) {
      toast('Nấu ít nhất một phần nước dùng đã', 'bad');
      sfx('error');
      return;
    }
    sfx('pop');
    state.phase = 'service';
    save();
    go('service');
  }

  function onClick(e) {
    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) {
      tab = tabBtn.dataset.tab;
      scrollTop = 0;
      sfx('tap');
      render();
      return;
    }
    const brothBtn = e.target.closest('[data-buy-broth]');
    if (brothBtn) return buyBroth(brothBtn.dataset.buyBroth);
    const topBtn = e.target.closest('[data-buy-top]');
    if (topBtn) return buyTop(topBtn.dataset.buyTop);
    if (e.target.closest('[data-buy-bowl]')) return buyBowl();
    const upBtn = e.target.closest('[data-upgrade]');
    if (upBtn) return buyUpgrade(upBtn.dataset.upgrade);
    const decorBtn = e.target.closest('[data-decor]');
    if (decorBtn) return buyDecor(decorBtn.dataset.decor);
    const priceBtn = e.target.closest('[data-price]');
    if (priceBtn) return changePrice(priceBtn.dataset.price, Number(priceBtn.dataset.dir));
    const replyBtn = e.target.closest('[data-reply]');
    if (replyBtn) return replyModal(replyBtn.dataset.reply);

    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'open') return openShop();
    if (act === 'suggest') return suggestModal();
    if (act === 'rename') return renameModal();
    if (act === 'how') return openHowto();
    if (act === 'rank') return rankModal();
    if (act === 'account') return accountModal();
  }

  root.addEventListener('click', onClick);
  render();

  return () => {
    root.removeEventListener('click', onClick);
    replyTimers.forEach(clearTimeout);
    replyTimers = [];
  };
}
