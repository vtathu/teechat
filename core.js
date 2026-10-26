// ===================== CORE (HỆ THỐNG CƠ BẢN) =====================
window.DEFAULT_LOGO = 'https://i.postimg.cc/MT2v8p4Y/Thiet-ke-chua-co-ten.png';
const DEFAULT_LOGO = window.DEFAULT_LOGO;

window.state = {
  apiKeys: [],
  currentModel: 'gemini-2.5-flash',
  activeStoryId: null,
  stories: [],
  persona: { name: 'Nguyễn Thị Bé Cưng', dob: '', avatar: DEFAULT_LOGO, memories: '' },
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
  
  // Bổ sung các trạng thái để hỗ trợ hiển thị Nhiệm Vụ, Thành Tựu và Chế Độ
  missionData: null,
  stats: {},
  milestoneClaimed: {},
  unlockedModes: {}
};

// Hàm chuyển tab con trong mục "Cuộc Sống" (Đã tích hợp gọi renderMissionTab an toàn)
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
