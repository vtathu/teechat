// Cầu nối với Teechat: lãi sau mỗi ngày của quán được chuyển về ví của app.
import { state } from './state.js';

const HOST = window.parent !== window ? window.parent : null;

export function reportDay(summary) {
  if (!HOST) return;
  try {
    HOST.postMessage(
      {
        type: 'teechat:biz-day',
        day: summary.day,
        profit: Math.round(summary.profit || 0),
        revenue: Math.round(summary.revenue || 0),
        register: Math.round(state.money || 0),
      },
      window.location.origin,
    );
  } catch (err) {
    console.warn('Chưa báo được kết quả ngày cho Teechat', err);
  }
}

export function closeShop() {
  if (!HOST) return;
  try {
    HOST.postMessage({ type: 'teechat:biz-close' }, window.location.origin);
  } catch (err) {
    console.warn('Chưa đóng được khung quán', err);
  }
}

window.__teechatBiz = { state, reportDay, closeShop };
