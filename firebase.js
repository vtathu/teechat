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

    // Lấy chênh lệch giờ máy so với giờ server (chống chỉnh giờ máy để lách lượt)
    try {
      onValue(ref(db, '.info/serverTimeOffset'), (snap) => { window.serverOffset = snap.val() || 0; });
    } catch (e) {}

    // Bỏ API key khỏi dữ liệu đồng bộ
    function stripKeys(s) {
      const c = JSON.parse(JSON.stringify(s));
      delete c.apiKeys;
      return c;
    }

    onAuthStateChanged(auth, async (user) => {
      const statusBox = document.getElementById('auth-status-box');
      const formContainer = document.getElementById('auth-form-container');
      const actionContainer = document.getElementById('cloud-action-container');
      
      if (user) {
        statusBox.innerText = `Đã đăng nhập: ${user.email}`;
        formContainer.classList.add('hidden');
        actionContainer.classList.remove('hidden');

        try {
          const snap = await get(ref(db, 'users/' + user.uid + '/teechat_state'));
          
          if (snap.exists()) {
            const cloudState = snap.val();
            const localSaved = localStorage.getItem('teechat_state_v10');
            let localState = null;
            if (localSaved) {
              try { localState = JSON.parse(localSaved); } catch(e) {}
            }

            const cloudTime = cloudState.lastUpdated || 0;
            const localTime = (localState && localState.lastUpdated) ? localState.lastUpdated : 0;

            if (cloudTime > localTime) {
              if (Array.isArray(cloudState.apiKeys) && cloudState.apiKeys.length && window.loadKeys && window.loadKeys().length === 0) {
                window.saveKeys(cloudState.apiKeys);
              }
              window.state = stripKeys(cloudState);
              localStorage.setItem('teechat_state_v10', JSON.stringify(window.state));
            } else if (localTime > cloudTime) {
              const cleanLocal = stripKeys(localState);
              await set(ref(db, 'users/' + user.uid + '/teechat_state'), cleanLocal);
              window.state = localState;
            }
          } else {
            if (window.state) {
              window.state.lastUpdated = Date.now();
              const cleanState = stripKeys(window.state);
              await set(ref(db, 'users/' + user.uid + '/teechat_state'), cleanState);
            }
          }

          window.loadStorage();
          window.renderStoryList();
          if (window.state.activeStoryId) window.openStoryDetail(window.state.activeStoryId);

        } catch (err) {}

      } else {
        statusBox.innerText = "Chưa đăng nhập";
        formContainer.classList.remove('hidden');
        actionContainer.classList.add('hidden');
      }
    });

    window.autoSyncToCloud = async function() {
      try {
        if (auth && auth.currentUser) {
          const cleanState = stripKeys(window.state);
          await set(ref(db, 'users/' + auth.currentUser.uid + '/teechat_state'), cleanState);
        }
      } catch (err) {}
    };

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
        const cleanState = stripKeys(window.state);
        await set(ref(db, 'users/' + user.uid + '/teechat_state'), cleanState); 
        alert("Đã đồng bộ lên Cloud thành công!"); 
      } catch (err) { alert("Lỗi đồng bộ: " + err.message); }
    };
    window.downloadDataFromFirebase = async function() {
      const user = auth.currentUser;
      if (!user) return alert("Đăng nhập trước!");
      try {
        const snap = await get(ref(db, 'users/' + user.uid + '/teechat_state'));
        if (snap.exists()) { window.state = stripKeys(snap.val()); window.saveStorage(); window.loadStorage(); window.renderStoryList(); if (window.state.activeStoryId) window.openStoryDetail(window.state.activeStoryId); alert("Đã tải về thành công!"); closeModal('modal-auth'); }
        else alert("Chưa có dữ liệu trên Cloud!");
      } catch (err) { alert(err.message); }
    };
