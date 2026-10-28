import { state, save, startNextDay, levelNeed, rating, ratingCount, leaderScore } from '../state.js';
import { money, ratingText } from '../format.js';
import { starsHTML } from '../ui.js';
import { MISSION_TYPES } from '../data.js';
import { chiliSVG } from '../art.js';
import { sfx } from '../audio.js';
import { go } from '../router.js';
import { pushScore, cloudConfigured, getUser } from '../cloud.js';
import { reportDay, closeShop } from '../teechat-bridge.js';

export default function summary(root) {
  const s = state.lastSummary;
  if (!s) {
    go('prep');
    return;
  }

  const profit = s.profit;
  reportDay(s);
  const levelUp = s.levels?.length ? s.levels[s.levels.length - 1] : null;
  const xpPct = Math.min(100, (state.xp / levelNeed()) * 100);

  const missions = s.missions
    .map(
      (m) => `<div class="sm-row ${m.done ? 'done' : ''}">
        <span class="sm-ic">${MISSION_TYPES[m.type].icon}</span>
        <span class="sm-label">${MISSION_TYPES[m.type].label(m.target)}</span>
        <b>${m.done ? `+${money(m.reward)}` : `${m.progress}/${m.target}`}</b>
      </div>`,
    )
    .join('');

  const subtitle = s.customers
    ? `${s.customers} khách đã ăn no${s.unserved ? `, ${s.unserved} khách còn chờ` : ''}.`
    : s.unserved
      ? `Chưa kịp bán tô nào, ${s.unserved} khách lỡ hẹn.`
      : 'Hôm nay quán đóng cửa sớm.';

  root.innerHTML = `
    <div class="summary">
      <div class="sum-scroll">
        <div class="sum-mascot">${chiliSVG('sum-chili')}</div>
        <h1 class="sum-title">Ngày ${s.day} xong rồi!</h1>
        <p class="sum-sub">${subtitle}</p>

        <div class="sum-stars">
          ${starsHTML(s.stars || 0)}
          <span>${s.stars ? `${ratingText(s.stars)} sao hôm nay` : 'Chưa phục vụ ai'}</span>
        </div>

        ${
          levelUp
            ? `<div class="level-up">🎉 Lên cấp ${levelUp}! Mở thêm món và nâng cấp mới.</div>`
            : ''
        }

        <div class="sum-card">
          <div class="sum-line"><span>Tiền bán mì</span><b>${money(s.revenue)}</b></div>
          <div class="sum-line neg"><span>Nguyên liệu đã nhập</span><b>-${money(s.spent)}</b></div>
          <div class="sum-line neg"><span>Mặt bằng</span><b>-${money(s.fixed.rent)}</b></div>
          <div class="sum-line neg"><span>Điện nước</span><b>-${money(s.fixed.util)}</b></div>
          <div class="sum-line neg"><span>Lương nhân viên</span><b>-${money(s.fixed.salary)}</b></div>
          <div class="sum-line total"><span>Lời hôm nay</span><b class="${profit >= 0 ? 'pos' : 'neg'}">${money(profit)}</b></div>
          <div class="sum-line"><span>Két còn lại</span><b>${money(state.money)}</b></div>
        </div>

        <div class="sum-card">
          <div class="sum-head"><b>Nhiệm vụ</b><span>${s.missions.filter((m) => m.done).length}/${s.missions.length} xong</span></div>
          ${missions}
        </div>

        <div class="sum-card xp-card">
          <div class="sum-head"><b>Kinh nghiệm</b><span>+${s.xp} XP</span></div>
          <div class="xp-bar big"><i style="width:${xpPct}%"></i><span>${state.xp}/${levelNeed()} XP</span></div>
          <p class="xp-note">Tiệm cấp ${state.level} · ${ratingText(rating())} sao (${ratingCount()} đánh giá)</p>
        </div>

        ${
          s.spoil
            ? `<p class="sum-note">Nước dùng còn thừa ${s.spoil} phần phải bỏ. Lần sau nấu vừa thôi nhé.</p>`
            : ''
        }
      </div>

      <div class="sum-actions">
        <button class="btn primary next-btn" data-act="next">Ngày tiếp theo →</button>
        <button class="link-btn" data-act="home">Về Teechat</button>
      </div>
    </div>`;

  const next = () => {
    sfx('pop');
    startNextDay();
    state.phase = 'prep';
    state.lastSummary = null;
    state.serviceSave = null;
    save();
    go('prep');
  };

  root.querySelector('[data-act="next"]').addEventListener('click', next);
  root.querySelector('[data-act="home"]').addEventListener('click', () => {
    sfx('tap');
    startNextDay();
    state.phase = 'prep';
    state.lastSummary = null;
    state.serviceSave = null;
    save();
    closeShop();
    go('prep');
  });

  if (cloudConfigured() && getUser()) {
    pushScore({
      name: state.shopName,
      score: leaderScore(),
      level: state.level,
      day: s.day,
    }).catch((err) => console.warn('Chưa cập nhật được bảng xếp hạng', err));
  }

  if (levelUp) setTimeout(() => sfx('level'), 250);
}
