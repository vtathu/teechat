    const DEFAULT_LOGO = 'https://i.postimg.cc/MT2v8p4Y/Thiet-ke-chua-co-ten.png';

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
      userBubbleBg: '#c1ebd9'
    };

