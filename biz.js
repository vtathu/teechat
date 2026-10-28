// ===================== TỰ KINH DOANH: game Mỳ cay nhà tui =====================
// Game nằm trong biz/ và chạy trong khung riêng; lãi mỗi ngày được chuyển về ví Teechat.
(function () {
  const SRC = 'biz/index.html?v=3';
  const ORIGIN = window.location.origin;
  let creditTimer = 0;

  const cash = (n) => (typeof window.moneyShort === 'function' ? window.moneyShort(Math.round(n)) : Math.round(n).toLocaleString('vi-VN') + 'đ');

  function boot() {
    const frame = document.getElementById('biz-frame');
    if (!frame || frame.dataset.booted === '1') return;
    frame.dataset.booted = '1';
    frame.src = SRC;
  }

  // Đổi bản lưu của tiệm (nhập file sao lưu / tải cloud) thì khởi động lại khung quán.
  function reload() {
    const frame = document.getElementById('biz-frame');
    if (!frame) return;
    const open = document.getElementById('fs-biz')?.classList.contains('active');
    if (open) {
      frame.dataset.booted = '1';
      frame.src = `${SRC}&r=${Date.now()}`;
    } else {
      frame.dataset.booted = '0';
      frame.src = 'about:blank';
    }
    paintWallet();
  }

  function paintWallet() {
    const w = Number(window.state && window.state.walletBalance) || 0;
    document.querySelectorAll('.wallet-mini').forEach((el) => { el.innerText = '💲' + cash(w); });
    const life = document.getElementById('life-wallet-display');
    if (life) life.innerText = w.toLocaleString('vi-VN') + ' VNĐ';
  }

  function showCredit(profit, day) {
    const el = document.getElementById('biz-credit');
    if (!el) return;
    el.className = 'biz-credit show ' + (profit > 0 ? '' : profit < 0 ? 'down' : 'flat');
    el.textContent =
      profit === 0
        ? `Ngày ${day}: quán huề vốn, ví chưa đổi.`
        : profit > 0
          ? `Ngày ${day}: lãi +${cash(profit)} đã chuyển vào ví.`
          : `Ngày ${day}: lỗ ${cash(-profit)}, trừ vào ví.`;
    clearTimeout(creditTimer);
    creditTimer = setTimeout(() => el.classList.remove('show'), 6000);
  }

  function creditDay(data) {
    const profit = Math.round(Number(data.profit) || 0);
    const s = window.state;
    if (s && profit) {
      s.walletBalance = Math.max(0, (Number(s.walletBalance) || 0) + profit);
      try { if (typeof saveStorage === 'function') saveStorage(); } catch (e) { console.warn('Chưa lưu được ví', e); }
    }
    paintWallet();
    try { if (typeof window.renderLifeModeUI === 'function') window.renderLifeModeUI(); } catch (e) { console.warn(e); }
    showCredit(profit, data.day);
  }

  window.addEventListener('message', (e) => {
    if (e.origin !== ORIGIN) return;
    if (!e.data) return;
    if (e.data.type === 'teechat:biz-day') creditDay(e.data);
    else if (e.data.type === 'teechat:biz-close' && typeof closeFs === 'function') closeFs();
  });

  // Đóng khung quán giữa ngày thì báo game tạm dừng, không để ngày chạy ngầm.
  const host = document.getElementById('fs-biz');
  if (host) {
    new MutationObserver(() => {
      if (host.classList.contains('active')) return;
      const frame = document.getElementById('biz-frame');
      if (!frame || frame.dataset.booted !== '1') return;
      try { frame.contentWindow.postMessage({ type: 'teechat:biz-hidden' }, ORIGIN); } catch (e) { console.warn(e); }
      // Game vừa lưu ca đang dở; chép sang state Teechat để sao lưu/đồng bộ kịp.
      setTimeout(() => { try { if (typeof saveStorage === 'function') saveStorage(); } catch (e) {} }, 160);
    }).observe(host, { attributes: true, attributeFilter: ['class'] });
  }

  window.Biz = { render: boot, creditDay, reload };
})();
