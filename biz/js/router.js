const registry = {};
let mounted = null;

export function register(name, fn) {
  registry[name] = fn;
}

export function go(name, params = {}) {
  const root = document.getElementById('screen');
  if (mounted?.cleanup) {
    try {
      mounted.cleanup();
    } catch (err) {
      console.warn(err);
    }
  }
  root.innerHTML = '';
  root.dataset.screen = name;
  document.getElementById('modal-root').innerHTML = '';
  document.querySelectorAll('#toasts .toast').forEach((t) => t.remove());
  const cleanup = registry[name]?.(root, params) || null;
  mounted = { name, cleanup };
  return mounted;
}

export function currentScreen() {
  return mounted?.name || null;
}
