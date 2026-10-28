import { clamp } from './format.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function starsHTML(value) {
  const pct = (clamp(value, 0, 5) / 5) * 100;
  return `<span class="stars" role="img" aria-label="${value.toFixed(1)} trên 5 sao"><span class="stars-base">★★★★★</span><span class="stars-fill" style="width:${pct}%">★★★★★</span></span>`;
}

export function toast(msg, kind = '') {
  const host = document.getElementById('toasts');
  if (!host) return;
  const node = document.createElement('div');
  node.className = `toast ${kind}`;
  node.textContent = msg;
  while (host.children.length >= 2) host.firstElementChild.remove();
  host.appendChild(node);
  setTimeout(() => {
    node.classList.add('out');
    setTimeout(() => node.remove(), 260);
  }, 1700);
}

let activeModal = null;

export function closeModal() {
  if (!activeModal) return;
  activeModal.layer.remove();
  activeModal = null;
}

export function modal({ title = '', sub = '', body = '', actions = [{ label: 'Đóng' }], onClose = null }) {
  closeModal();
  const layer = document.createElement('div');
  layer.className = 'modal-layer';
  layer.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      ${title ? `<h2>${title}</h2>` : ''}
      ${sub ? `<div class="sub">${sub}</div>` : ''}
      <div class="modal-body">${body}</div>
      <div class="modal-actions"></div>
    </div>`;
  const bar = layer.querySelector('.modal-actions');
  actions.forEach((act) => {
    const b = document.createElement('button');
    b.className = `btn ${act.kind === 'primary' ? 'solid' : act.kind === 'ghost' ? 'ghost' : ''}`.trim() || 'btn';
    if (act.kind === 'ghost') b.style.background = 'rgba(0,0,0,.06)';
    b.textContent = act.label;
    b.addEventListener('click', () => {
      const keep = act.onClick ? act.onClick() === false : false;
      if (!keep) closeModal();
    });
    bar.appendChild(b);
  });
  layer.addEventListener('click', (e) => {
    if (e.target === layer) {
      closeModal();
      onClose?.();
    }
  });
  document.getElementById('modal-root').appendChild(layer);
  activeModal = { layer, onClose };
  return layer;
}
