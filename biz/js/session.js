import { state, load, save, setUserScope, ensureDay, startNextDay, resumeScreen } from './state.js';
import { go } from './router.js';
import { getUser } from './cloud.js';

export function enterGame(user = getUser()) {
  setUserScope(user?.id || null);
  const hadSave = load();
  const metaName = String(user?.user_metadata?.shop_name || '').trim();
  if (!hadSave && metaName) {
    state.shopName = metaName.slice(0, 24);
  }
  if (state.lastSummary) {
    startNextDay();
    state.lastSummary = null;
    state.serviceSave = null;
  }
  ensureDay();
  const screen = resumeScreen();
  save();
  go(screen);
}

export function leaveToAuth() {
  setUserScope(null);
  go('auth');
}
