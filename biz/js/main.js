import { state, load, save, ensureDay, startNextDay, resumeScreen } from './state.js';
import { register, go, currentScreen } from './router.js';
import { initAuth, cloudConfigured } from './cloud.js';
import { enterGame } from './session.js';
import auth from './screens/auth.js';
import prep from './screens/prep.js';
import service from './screens/service.js';
import summary from './screens/summary.js';

register('auth', auth);
register('prep', prep);
register('service', service);
register('summary', summary);

async function boot() {
  const session = await initAuth();
  if (session) {
    enterGame(session.user);
    return;
  }
  if (cloudConfigured()) {
    go('auth');
    return;
  }
  load();
  // Nếu lần trước đóng giữa lúc xem tổng kết thì qua ngày mới luôn.
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

boot();

window.addEventListener('beforeunload', () => {
  if (currentScreen() !== 'auth') save();
});
