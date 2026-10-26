import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
    import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
    import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

    const firebaseConfig = {
      apiKey: "AIzaSyD6jSVSBLMp7hC_MSEYpph1xjCZ7vYS9oU",
      authDomain: "teechat-2ad90.firebaseapp.com",
      databaseURL: "https://teechat-2ad90-default-rtdb.firebaseio.com",
      projectId: "teechat-2ad90",
      storageBucket: "teechat-2ad90.firebasestorage.app",
      messagingSenderId: "919705805231",
      appId: "1:919705805231:web:4f70360c54167df92c4f5a",
      measurementId: "G-F2RPZHRRJK"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getDatabase(app);

    window.auth = auth;
    window.db = db;
    window.ref = ref;
    window.set = set;

    // Xin trình duyệt/iOS đừng tự dọn dữ liệu của app (giảm nguy cơ mất localStorage khi dùng icon màn hình chính)
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}

    // Lấy chênh lệch giờ máy so với giờ server (chống chỉnh giờ máy để lách lượt)
    try {
      onValue(ref(db, '.info/serverTimeOffset'), (snap) => { window.serverOffset = snap.val() || 0; });
    } catch (e) {}

    const LS_KEY = 'teechat_state_v10';
    const userPath = (uid) => 'users/' + uid + '/teechat_state';

    // Bỏ API key khỏi dữ liệu đồng bộ
    function stripKeys(s) {
      const c = JSON.parse(JSON.stringify(s));
      delete c.apiKeys;
      return c;
    }

    // Ảnh base64 quá lớn không đẩy lên cloud (Firebase giới hạn dung lượng mỗi lần ghi); bản trên máy vẫn giữ nguyên
    const MAX_CLOUD_IMG = 150000;
    function cloudCopy(s) {
      const c = stripKeys(s);
      Object.values(c.chatHistories || {}).forEach(h => (h || []).forEach(m => {
        if (m && typeof m.img === 'string' && m.img.length > MAX_CLOUD_IMG) m.img = null;
      }));
      return c;
    }

    // ---------- Gộp dữ liệu máy <-> cloud (không để bản này đè mất bản kia) ----------
    const arr = (x) => Array.isArray(x) ? x : (x && typeof x === 'object' ? Object.values(x) : []);

    function hasRealMessages(s) {
      return Object.values((s && s.chatHistories) || {}).some(h => arr(h).some(m => m && m.ts));
    }
    // Bản "trống" = chưa có tin thật, chỉ có truyện mặc định (VD: localStorage bị dọn). Bản trống KHÔNG BAO GIỜ được ghi đè cloud
    function isBlank(s) {
      if (!s) return true;
      return !hasRealMessages(s) && arr(s.stories).length <= 1 && arr(s.inventory).length === 0 &&
        (s.walletBalance === undefined || s.walletBalance === 10000000);
    }

    function msgKey(m) { return m.ts ? (m.ts + '|' + m.sender) : ('n|' + m.sender + '|' + (m.text || '')); }
    function mergeHistories(primary, other) {
      const map = new Map();
      arr(primary).forEach(m => { if (m && !map.has(msgKey(m))) map.set(msgKey(m), m); });
      arr(other).forEach(m => {
        if (!m) return;
        const k = msgKey(m);
        if (!map.has(k)) map.set(k, m);
        else { const ex = map.get(k); if (!ex.img && m.img) ex.img = m.img; }
      });
      const all = [...map.values()];
      return all.filter(m => !m.ts).concat(all.filter(m => m.ts).sort((x, y) => x.ts - y.ts));
    }
    function mergeStates(local, cloud) {
      const baseIsLocal = (local.lastUpdated || 0) >= (cloud.lastUpdated || 0);
      const base = baseIsLocal ? local : cloud, other = baseIsLocal ? cloud : local;
      const merged = JSON.parse(JSON.stringify(base));
      // Truyện chỉ có ở phía kia (tạo ở máy khác) thì giữ lại
      const stories = arr(merged.stories);
      const have = new Set(stories.map(s => s && s.id));
      arr(other.stories).forEach(s => { if (s && !have.has(s.id)) { stories.push(JSON.parse(JSON.stringify(s))); have.add(s.id); } });
      merged.stories = stories;
      // Tin nhắn: hợp nhất theo từng truyện
      const hist = {};
      const ids = new Set([...Object.keys(base.chatHistories || {}), ...Object.keys(other.chatHistories || {})]);
      ids.forEach(id => {
        if (!have.has(id)) return;
        hist[id] = mergeHistories((base.chatHistories || {})[id], (other.chatHistories || {})[id]);
      });
      merged.chatHistories = hist;
      return merged;
    }

    async function readLocal() {
      try {
        if (window.__stateLoaded && typeof window.getSyncableState === 'function') return window.getSyncableState();
        if (window.idbReady) await window.idbReady;
        const raw = typeof window.readSavedRaw === 'function' ? window.readSavedRaw() : localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    }

    // ---------- Trạng thái hiển thị ----------
    function setSyncStatus(err) {
      const box = document.getElementById('auth-status-box');
      const u = auth.currentUser;
      if (!box || !u) return;
      box.innerText = 'Đã đăng nhập: ' + u.email + (err ? ' — ⚠️ Lỗi đồng bộ: ' + (err.message || err) : ' — ✅ đã đồng bộ');
    }
    function reportSyncError(err) {
      console.error('Lỗi đồng bộ cloud:', err);
      setSyncStatus(err);
      if (!window.__syncErrWarned) {
        window.__syncErrWarned = true;
        alert('⚠️ Không sao lưu được lên cloud: ' + ((err && err.message) || err) + '\nTin nhắn vẫn được lưu trên máy này.');
      }
    }

    // ---------- Đối chiếu khi mở app / đăng nhập ----------
    let reconciling = null;
    function reconcile(user) {
      if (reconciling) return reconciling;
      reconciling = (async () => {
        const pathRef = ref(db, userPath(user.uid));
        const snap = await get(pathRef);
        const cloud = snap.exists() ? snap.val() : null;
        const local = await readLocal();
        let result = null, upload = false;

        if (!cloud) {
          if (local && !isBlank(local)) { result = local; upload = true; }
        } else if (isBlank(local)) {
          result = cloud;                      // máy trống -> lấy từ cloud, tuyệt đối không đẩy bản trống lên
        } else {
          result = mergeStates(local, cloud);  // cả hai đều có dữ liệu -> gộp tin nhắn
          upload = true;
        }

        if (result) {
          if (cloud && Array.isArray(cloud.apiKeys) && cloud.apiKeys.length && window.loadKeys && window.loadKeys().length === 0) {
            window.saveKeys(cloud.apiKeys);
          }
          result = stripKeys(result);
          if (upload && cloud) result.lastUpdated = Date.now();
          // Giữ 1 bản dự phòng của dữ liệu trên máy trước khi thay
          try { if (local && !isBlank(local) && window.persistBackup) window.persistBackup(JSON.stringify(local)); } catch (e) {}
          window.persistState(JSON.stringify(result));
          window.state = result;
          if (upload) await set(pathRef, cloudCopy(result));
        }

        window.__cloudReady = true;
        window.loadStorage();
        window.renderStoryList();
        if (window.state.activeStoryId) window.openStoryDetail(window.state.activeStoryId);
      })();
      const clear = () => { reconciling = null; };
      reconciling.then(clear, clear);
      return reconciling;
    }

    onAuthStateChanged(auth, async (user) => {
      const statusBox = document.getElementById('auth-status-box');
      const formContainer = document.getElementById('auth-form-container');
      const actionContainer = document.getElementById('cloud-action-container');

      if (user) {
        statusBox.innerText = `Đã đăng nhập: ${user.email}`;
        formContainer.classList.add('hidden');
        actionContainer.classList.remove('hidden');
        try { await reconcile(user); setSyncStatus(null); }
        catch (err) { reportSyncError(err); }
      } else {
        window.__cloudReady = false;
        statusBox.innerText = "Chưa đăng nhập";
        formContainer.classList.remove('hidden');
        actionContainer.classList.add('hidden');
      }
    });

    // ---------- Tự động đẩy lên cloud ----------
    let syncTimer = null;
    async function doSync() {
      syncTimer = null;
      const user = auth.currentUser;
      if (!user || !window.state) return;
      try {
        if (!window.__cloudReady) await reconcile(user);   // chưa đối chiếu xong thì đối chiếu trước, không ghi đè mù
        else await set(ref(db, userPath(user.uid)), cloudCopy(window.state));
        setSyncStatus(null);
      } catch (err) { reportSyncError(err); }
    }
    // now=true: đẩy ngay (dùng khi thoát app); mặc định gom lại ~1.5s để đỡ ghi liên tục
    window.autoSyncToCloud = function(now) {
      if (!auth.currentUser) return;
      if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }
      if (now) return doSync();
      syncTimer = setTimeout(doSync, 1500);
    };
    window.addEventListener('pagehide', () => { if (window.autoSyncToCloud) window.autoSyncToCloud(true); });

    window.handleFirebaseRegister = async function() {
      const email = document.getElementById('fb-email').value.trim();
      const pass = document.getElementById('fb-password').value.trim();
      if (!email || !pass) return alert("Nhập Email và Mật khẩu!");
      try { await createUserWithEmailAndPassword(auth, email, pass); alert("Đăng ký thành công!"); } catch (err) { alert(err.message); }
    };
    window.handleFirebaseLogin = async function() {
      const email = document.getElementById('fb-email').value.trim();
      const pass = document.getElementById('fb-password').value.trim();
      if (!email || !pass) return alert("Nhập Email và Mật khẩu!");
      try { await signInWithEmailAndPassword(auth, email, pass); alert("Đăng nhập thành công!"); } catch (err) { alert(err.message); }
    };
    window.handleFirebaseLogout = function() { signOut(auth); };
    window.uploadDataToFirebase = async function() {
      const user = auth.currentUser;
      if (!user) return alert("Đăng nhập trước!");
      try {
        if (typeof window.saveStorage === 'function') window.saveStorage();
        await set(ref(db, userPath(user.uid)), cloudCopy(window.state));
        setSyncStatus(null);
        alert("Đã đồng bộ lên Cloud thành công!");
      } catch (err) { alert("Lỗi đồng bộ: " + err.message); }
    };
    window.downloadDataFromFirebase = async function() {
      const user = auth.currentUser;
      if (!user) return alert("Đăng nhập trước!");
      try {
        const snap = await get(ref(db, userPath(user.uid)));
        if (snap.exists()) { window.state = stripKeys(snap.val()); window.saveStorage(); window.loadStorage(); window.renderStoryList(); if (window.state.activeStoryId) window.openStoryDetail(window.state.activeStoryId); alert("Đã tải về thành công!"); closeModal('modal-auth'); }
        else alert("Chưa có dữ liệu trên Cloud!");
      } catch (err) { alert(err.message); }
    };
