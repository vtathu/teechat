// Khai báo biến toàn cục để các file khác (như firebase.js) có thể gọi được
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
  affectionLevels: {},
  aiBubbleBg: '#ffffff',
  userBubbleBg: '#c1ebd9',
  
  missionData: null,
  stats: {},
  milestoneClaimed: {},
  unlockedModes: {}
};
