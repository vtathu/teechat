// ===== Chế độ Sáng / Tối / Theo máy (lưu riêng trên từng thiết bị) =====
(function () {
  var KEY = 'teechat_mode';
  var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function get() { try { var v = localStorage.getItem(KEY); return (v === 'dark' || v === 'auto') ? v : 'light'; } catch (e) { return 'light'; } }
  function resolve(m) { return m === 'auto' ? (mq && mq.matches ? 'dark' : 'light') : m; }
  function apply() {
    var r = resolve(get());
    document.documentElement.setAttribute('data-mode', r);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', r === 'dark' ? '#1f1c2e' : '#f6f1ff');
    paintToggle();
  }
  // Nút đổi nhanh Sáng/Tối đặt ngoài giao diện chính
  function paintToggle() {
    var btn = document.getElementById('ui-mode-toggle');
    if (!btn) return;
    var dark = resolve(get()) === 'dark';
    var ico = btn.querySelector('.ri'), lbl = btn.querySelector('small');
    if (ico) {
      ico.textContent = dark ? '☀️' : '🌙';
      if (lbl) lbl.textContent = dark ? 'Sáng' : 'Tối';
    } else {
      btn.textContent = dark ? '☀️' : '🌙';
    }
    btn.title = dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';
  }
  window.toggleUiMode = function () {
    window.setUiMode(resolve(get()) === 'dark' ? 'light' : 'dark');
  };
  function paint() {
    paintToggle();
    var box = document.getElementById('ui-mode-box'); if (!box) return;
    var cur = get();
    box.querySelectorAll('button[data-mode]').forEach(function (b) {
      var on = b.getAttribute('data-mode') === cur;
      b.className = on ? 'btn' : 'btn btn-outline';
    });
  }
  window.setUiMode = function (m) {
    try { localStorage.setItem(KEY, m); } catch (e) {}
    apply(); paint();
  };
  function inject() {
    var modal = document.getElementById('modal-settings');
    if (!modal || document.getElementById('ui-mode-box')) return;
    var content = modal.querySelector('.modal-content') || modal;
    var box = document.createElement('div');
    box.id = 'ui-mode-box';
    box.className = 'form-group';
    box.innerHTML = '<label>🎨 Giao diện</label>' +
      '<div style="display:flex;gap:6px;">' +
      '<button type="button" class="btn" data-mode="light" style="flex:1;padding:8px;" onclick="setUiMode(\'light\')">☀️ Sáng</button>' +
      '<button type="button" class="btn" data-mode="dark" style="flex:1;padding:8px;" onclick="setUiMode(\'dark\')">🌙 Tối</button>' +
      '<button type="button" class="btn" data-mode="auto" style="flex:1;padding:8px;" onclick="setUiMode(\'auto\')">📱 Theo máy</button>' +
      '</div>';
    var header = content.querySelector('.modal-header');
    if (header && header.nextSibling) content.insertBefore(box, header.nextSibling);
    else content.insertBefore(box, content.firstChild);
    paint();
  }
  apply();
  if (mq && mq.addEventListener) mq.addEventListener('change', function () { if (get() === 'auto') apply(); });
  function boot() { inject(); paintToggle(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('[onclick*="modal-settings"]')) setTimeout(function () { inject(); paint(); }, 30);
  });
})();
