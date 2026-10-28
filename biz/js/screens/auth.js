import { cloudConfigured, signIn, signUp, errorText } from '../cloud.js';
import { enterGame } from '../session.js';
import { sfx } from '../audio.js';
import { esc } from '../format.js';
import { chiliSVG } from '../art.js';

export default function auth(root) {
  let mode = 'login';
  let email = '';
  let shopName = '';
  let busy = false;
  let notice = null;

  function fieldsHTML() {
    return `
      <label class="auth-field">
        <span>Email</span>
        <input class="text-input" name="email" type="email" inputmode="email" autocomplete="email"
          placeholder="ban@vidu.com" value="${esc(email)}" required />
      </label>
      <label class="auth-field">
        <span>Mật khẩu</span>
        <input class="text-input" name="password" type="password" minlength="6"
          autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" placeholder="Ít nhất 6 ký tự" required />
      </label>
      ${
        mode === 'register'
          ? `<label class="auth-field">
              <span>Tên quán</span>
              <input class="text-input" name="shop" maxlength="24" autocomplete="organization"
                placeholder="Mỳ cay nhà tui" value="${esc(shopName)}" required />
            </label>`
          : ''
      }`;
  }

  function formHTML() {
    return `
      <form class="auth-form" novalidate>
        ${fieldsHTML()}
        <p class="auth-msg ${notice?.kind || ''}" ${notice ? '' : 'hidden'}>${notice ? esc(notice.text) : ''}</p>
        <button class="btn primary auth-submit" type="submit" ${busy ? 'disabled' : ''}>
          ${busy ? 'Đang mở cửa…' : mode === 'login' ? 'Đăng nhập' : 'Mở quán'}
        </button>
      </form>`;
  }

  function bodyHTML() {
    if (!cloudConfigured()) {
      return `
        <div class="auth-card">
          <div class="auth-offline">
            <b>Chưa nối Supabase</b>
            <p>Bản này đang chạy một mình trên máy bạn. Dán Project URL và anon key vào <code>js/config.js</code> là có tài khoản với bảng xếp hạng chung.</p>
          </div>
          <button class="btn primary auth-submit" data-act="guest">Chơi thử trên máy này</button>
        </div>`;
    }
    return `
      <div class="auth-card">
        <div class="auth-tabs" role="tablist">
          <button class="${mode === 'login' ? 'on' : ''}" data-mode="login" role="tab" aria-selected="${mode === 'login'}">Đăng nhập</button>
          <button class="${mode === 'register' ? 'on' : ''}" data-mode="register" role="tab" aria-selected="${mode === 'register'}">Tạo quán</button>
        </div>
        ${formHTML()}
        <p class="auth-note">${mode === 'login' ? 'Quán của bạn nằm trên máy này và trên bảng xếp hạng.' : 'Email dùng để giữ tiệm và so điểm với quán khác.'}</p>
      </div>`;
  }

  function render() {
    root.innerHTML = `
      <div class="auth-screen">
        <div class="auth-hero">
          <div class="auth-mascot">${chiliSVG('auth-chili')}</div>
          <h1>Mỳ cay nhà tui</h1>
          <p>${cloudConfigured() ? 'Đăng nhập để giữ tiệm của bạn và leo bảng xếp hạng khu phố.' : 'Nấu mì, chiều khách, cay đúng cấp.'}</p>
        </div>
        ${bodyHTML()}
        <p class="auth-foot">${cloudConfigured() ? 'Tiệm được lưu riêng cho từng tài khoản trên máy này.' : 'Chưa có tài khoản? Cứ chơi thử trước đã.'}</p>
      </div>`;
  }

  function setNotice(kind, text) {
    notice = { kind, text };
  }

  function switchMode(next) {
    if (next === mode) return;
    const form = root.querySelector('.auth-form');
    if (form) {
      email = form.elements.email?.value.trim() ?? email;
      shopName = form.elements.shop?.value.trim() ?? shopName;
    }
    mode = next;
    notice = null;
    sfx('tap');
    render();
  }

  async function submit(form) {
    if (busy) return;
    email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    shopName = form.elements.shop?.value.trim() ?? shopName;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNotice('bad', 'Email chưa đúng dạng, xem lại giúp mình.');
      render();
      return;
    }
    if (password.length < 6) {
      setNotice('bad', 'Mật khẩu cần ít nhất 6 ký tự.');
      render();
      return;
    }
    if (mode === 'register' && shopName.length < 2) {
      setNotice('bad', 'Đặt tên quán ít nhất 2 ký tự nhé.');
      render();
      return;
    }

    busy = true;
    notice = null;
    render();
    try {
      if (mode === 'login') {
        const session = await signIn(email, password);
        enterGame(session.user);
      } else {
        const result = await signUp(email, password, shopName);
        if (result.session) {
          enterGame(result.session.user);
        } else {
          busy = false;
          mode = 'login';
          setNotice('good', 'Đã gửi email xác nhận. Mở hộp thư rồi quay lại đăng nhập nhé.');
          render();
        }
      }
    } catch (err) {
      console.warn('Đăng nhập lỗi', err);
      busy = false;
      setNotice('bad', errorText(err));
      render();
    }
  }

  function onClick(e) {
    const modeBtn = e.target.closest('[data-mode]');
    if (modeBtn) return switchMode(modeBtn.dataset.mode);
    if (e.target.closest('[data-act="guest"]')) {
      sfx('pop');
      enterGame(null);
    }
  }

  function onSubmit(e) {
    const form = e.target.closest('.auth-form');
    if (!form) return;
    e.preventDefault();
    submit(form);
  }

  root.addEventListener('click', onClick);
  root.addEventListener('submit', onSubmit);
  render();

  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('submit', onSubmit);
  };
}
