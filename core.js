// ===================== CORE (HỆ THỐNG CƠ BẢN) =====================
// Khai báo dưới dạng biến toàn cục gắn trực tiếp vào window
window.DEFAULT_LOGO = 'https://i.postimg.cc/MT2v8p4Y/Thiet-ke-chua-co-ten.png';

// Đảm bảo mọi tệp khác gọi DEFAULT_LOGO không bị lỗi Undefined
if (typeof DEFAULT_LOGO === 'undefined') {
  var DEFAULT_LOGO = window.DEFAULT_LOGO;
}

window.state = {
  apiKeys: [],
  currentModel: 'gemini-2.5-flash',
  activeStoryId: null,
  stories: [],
  persona: { name: 'Nguyễn Thị Bé Cưng', dob: '', avatar: window.DEFAULT_LOGO, memories: '' },
  chatHistories: {},
  walletBalance: 10000000,
  inventory: [],
  currentJob: 'barista',
  jobChangeTimestamp: 0,
  jobPicked: false,
  dailyWorkCount: 0,
  dailyCraftCount: 0,
  lastWorkDate: '',
  lastSeenTs: 0,
  affectionLevels: {}, // { charId: { level: 1, points: 0 } }
  aiBubbleBg: '#ffffff',
  userBubbleBg: '#c1ebd9',
  
  // Trạng thái Nhiệm Vụ, Thành Tựu và Chế Độ
  missionData: null,
  stats: {},
  milestoneClaimed: {},
  unlockedModes: {}
};

// Hàm chuyển tab con trong mục "Cuộc Sống"
function switchLifeSub(subTab) {
  document.querySelectorAll('.life-sub').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('#life-sub-tabs .modal-tab-btn').forEach(btn => btn.classList.remove('active'));
  
  const target = document.getElementById(`life-sub-${subTab}`);
  if (target) target.classList.remove('hidden');
  
  const activeBtn = document.getElementById(`life-sub-btn-${subTab}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Tự động gọi render khi người dùng bấm sang tab Nhiệm Vụ
  if (subTab === 'mission' && typeof renderMissionTab === 'function') {
    renderMissionTab();
  }
}

// Hàm cung cấp thời gian cho nhiệm vụ
function nowTs() {
  return Date.now();
}
