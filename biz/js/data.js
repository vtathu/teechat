export const SPICE = [
  { level: 0, color: '#f6dcae', ink: '#8a5a2b', name: 'Không cay' },
  { level: 1, color: '#f5bd76', ink: '#8a4a1f', name: 'Cấp 1' },
  { level: 2, color: '#f2a25c', ink: '#7d3c18', name: 'Cấp 2' },
  { level: 3, color: '#ef8149', ink: '#fff' },
  { level: 4, color: '#e8563f', ink: '#fff' },
  { level: 5, color: '#d63b2f', ink: '#fff' },
  { level: 6, color: '#b8281f', ink: '#fff' },
  { level: 7, color: '#8f1a14', ink: '#fff' },
];

export const BROTHS = [
  {
    id: 'kimchi',
    name: 'Kim chi',
    emoji: '🥬',
    color: '#e8563f',
    deep: '#b23a2a',
    light: '#f08a71',
    cost: 6000,
    price: 45000,
    unlock: 1,
  },
  {
    id: 'tomyum',
    name: 'Tomyum',
    emoji: '🍤',
    color: '#f08a3c',
    deep: '#c96822',
    light: '#f7ac70',
    cost: 7000,
    price: 50000,
    unlock: 1,
  },
  {
    id: 'tuongden',
    name: 'Tương đen',
    emoji: '🫘',
    color: '#7a4b32',
    deep: '#593423',
    light: '#a3704f',
    cost: 8000,
    price: 55000,
    unlock: 2,
  },
  {
    id: 'sate',
    name: 'Sa tế',
    emoji: '🔥',
    color: '#c93f2c',
    deep: '#96271a',
    light: '#e0715f',
    cost: 9000,
    price: 60000,
    unlock: 4,
  },
];

export const TOPPINGS = [
  { id: 'bo', name: 'Bò Mỹ', emoji: '🥩', cost: 18000, price: 20000, unlock: 1 },
  { id: 'xucxich', name: 'Xúc xích', emoji: '🌭', cost: 7000, price: 10000, unlock: 1 },
  { id: 'kimchi', name: 'Kim chi', emoji: '🥬', cost: 5000, price: 8000, unlock: 1 },
  { id: 'trung', name: 'Trứng', emoji: '🥚', cost: 4000, price: 8000, unlock: 1 },
  { id: 'nam', name: 'Nấm', emoji: '🍄', cost: 4000, price: 8000, unlock: 1 },
  { id: 'cavien', name: 'Cá viên', emoji: '🍢', cost: 6000, price: 10000, unlock: 3 },
  { id: 'phomai', name: 'Phô mai', emoji: '🧀', cost: 9000, price: 12000, unlock: 4 },
  { id: 'banhgao', name: 'Bánh gạo', emoji: '🍥', cost: 6000, price: 10000, unlock: 5 },
  { id: 'haisan', name: 'Hải sản', emoji: '🦐', cost: 14000, price: 18000, unlock: 6 },
  { id: 'wagyu', name: 'Bò Wagyu', emoji: '🐮', cost: 40000, price: 45000, unlock: 9 },
];

export const UPGRADES = [
  {
    id: 'pot',
    name: 'Nồi nước dùng',
    icon: '🍲',
    desc: 'Chứa thêm 8 phần nước dùng mỗi ngày.',
    unlock: 1,
    costs: [90000, 200000, 350000],
  },
  {
    id: 'stove',
    name: 'Bếp mì',
    icon: '🔥',
    desc: 'Mì chín nhanh hơn, mỗi mẻ thêm 1 phần.',
    unlock: 1,
    costs: [80000, 180000, 320000],
  },
  {
    id: 'tables',
    name: 'Bàn ăn',
    icon: '🪑',
    desc: 'Thêm 1 chỗ ngồi cho khách.',
    unlock: 1,
    costs: [120000, 260000, 450000],
  },
  {
    id: 'fan',
    name: 'Quạt mát',
    icon: '🌀',
    desc: 'Khách chờ thêm được 8 giây.',
    unlock: 2,
    costs: [70000, 160000],
  },
  {
    id: 'sign',
    name: 'Biển hiệu',
    icon: '🪧',
    desc: 'Khách ghé đông hơn 12%.',
    unlock: 3,
    costs: [100000, 220000],
  },
];

export const DECOR = [
  { id: 'lantern', name: 'Đèn lồng', icon: '🏮', cost: 60000 },
  { id: 'plant', name: 'Cây xanh', icon: '🪴', cost: 45000 },
  { id: 'cat', name: 'Mèo ngủ', icon: '🐈', cost: 80000 },
  { id: 'painting', name: 'Tranh tường', icon: '🖼️', cost: 55000 },
];

export const WEATHERS = [
  {
    id: 'sunny',
    name: 'Trời nắng',
    icon: '☀️',
    mult: 1,
    spiceBias: -0.4,
    text: 'Nắng đẹp, khách đi chơi đông.',
  },
  {
    id: 'rain',
    name: 'Trời mưa',
    icon: '🌧️',
    mult: 1.35,
    spiceBias: 1.2,
    text: 'Mưa lạnh ai cũng thèm mì cay, khách đông hơn 35%.',
  },
  {
    id: 'cold',
    name: 'Trời lạnh',
    icon: '❄️',
    mult: 1.18,
    spiceBias: 1.6,
    text: 'Gió lạnh, khách gọi cay hơn thường lệ.',
  },
  {
    id: 'hot',
    name: 'Trời nóng',
    icon: '🥵',
    mult: 0.85,
    spiceBias: -1.4,
    text: 'Nóng nực, khách ngại ăn cay.',
  },
];

export const CUSTOMERS = [
  { name: 'Anh Sơn', emoji: '🧑🏻‍💼', call: 'Em', self: 'anh', bg: '#cfe6c5', tone: 'male' },
  { name: 'Chị Lan', emoji: '👩🏻‍🦰', call: 'Em', self: 'chị', bg: '#f7c6cd', tone: 'female' },
  { name: 'Em Hân', emoji: '🧑🏻‍🎓', call: 'Chị', self: 'em', bg: '#f5dfae', tone: 'female' },
  { name: 'Bác Tư', emoji: '🧔🏻‍♂️', call: 'Cháu', self: 'bác', bg: '#d8cff0', tone: 'male' },
  { name: 'Cô Bảy', emoji: '👩🏻‍🍳', call: 'Cháu', self: 'cô', bg: '#f8cabf', tone: 'female' },
  { name: 'Bé Na', emoji: '👧🏻', call: 'Cô', self: 'con', bg: '#c5e8ea', tone: 'kid' },
  { name: 'Anh Dũng', emoji: '👨🏻‍🔧', call: 'Em', self: 'anh', bg: '#d2def2', tone: 'male' },
  { name: 'Chị Trang', emoji: '👩🏻‍💻', call: 'Em', self: 'chị', bg: '#f0d3e6', tone: 'female' },
  { name: 'Anh Khánh', emoji: '🧑🏻‍🎤', call: 'Em', self: 'anh', bg: '#e6dda9', tone: 'male' },
  { name: 'Chú Hải', emoji: '👨🏻‍🦳', call: 'Cháu', self: 'chú', bg: '#cdd9c5', tone: 'male' },
  { name: 'Chị My', emoji: '👩🏻‍🏫', call: 'Em', self: 'chị', bg: '#f6cbc0', tone: 'female' },
  { name: 'Em Bo', emoji: '🧒🏻', call: 'Chị', self: 'em', bg: '#cfe3f5', tone: 'kid' },
  { name: 'Anh Phúc', emoji: '🧑🏻‍🚀', call: 'Em', self: 'anh', bg: '#d9d2f4', tone: 'male' },
  { name: 'Chị Thảo', emoji: '👩🏻‍🌾', call: 'Em', self: 'chị', bg: '#d8ecc0', tone: 'female' },
];

export const MISSION_TYPES = {
  sell: { label: (t) => `Bán ${t} tô mì`, icon: '🍜' },
  five: { label: (t) => `${t} khách chấm 5 sao`, icon: '⭐' },
  spicy: { label: (t) => `Bán ${t} tô cay từ cấp 4`, icon: '🌶️' },
};

export const REVIEW_TEXT = {
  5: [
    'Nước dùng thơm, cay đúng cấp mình gọi. Lần sau ghé tiếp!',
    'Tô mì nóng hổi, ăn xong toát mồ hôi luôn. Mười điểm!',
    'Quán nhỏ mà nấu kỹ, thêm topping ăn là hết sẩy.',
    'Đúng vị mình thích, nhân viên lại dễ thương.',
    'Cay tê lưỡi mà vẫn muốn húp hết nước. Tuyệt!',
  ],
  4: [
    'Ngon, chỉ hơi chờ một chút. Vẫn sẽ quay lại.',
    'Vừa miệng, cấp cay chuẩn. Giá hơi cao xíu nhưng đáng.',
    'Nước dùng ổn, topping tươi. Lần sau thêm bò nữa.',
  ],
  3: [
    'Tạm được, ăn hơi nhạt so với mình gọi.',
    'Mì ổn nhưng thiếu chút topping, thông cảm được.',
  ],
  2: [
    'Chờ hơi lâu, mì lại nguội. Hơi buồn.',
    'Cấp cay không đúng ý, ăn không đã.',
  ],
  1: [
    'Đợi mãi không thấy món, mình phải đi gấp.',
    'Gọi một đằng mang ra một nẻo, thôi lần sau vậy.',
  ],
};

export const TIPS = [
  'Khách gọi món có in đậm là phần bạn phải làm đúng.',
  'Bấm vào thẻ khách để chọn người cần giao trước.',
  'Mì chín quá sẽ cháy, nhớ vớt đúng lúc.',
  'Nước dùng hết là hết bán, nhớ nấu đủ ở màn chuẩn bị.',
  'Giá cao thì khách khó tính hơn, nhưng lời hơn.',
];

export const CUSTOMER_COMEBACKS = {
  high: [
    'Nghe em nói vậy chị vui quá, mai chị ghé tiếp nha!',
    'Chị tin em rồi đó, giữ đúng vị này nhé!',
    'Cảm ơn em, chị khen với cả xóm rồi đấy.',
    'Được vậy thì chị yên tâm ăn dài.',
  ],
  good: [
    'Ừ em, chị thấy ổn, lần sau thử món khác.',
    'Cảm ơn em, chị sẽ ghé nữa.',
    'Nghe hợp lý đấy, giữ sức khỏe nha em.',
  ],
  mid: [
    'Vâng em, chị ghi nhận góp ý.',
    'Cũng được em, mong lần sau đỡ hơn.',
    'Ừ, em rút kinh nghiệm là được.',
  ],
  low: [
    'Chị vẫn thấy chưa ổn, em xem lại giúp.',
    'Thôi em, chị chưa chắc quay lại.',
    'Em nói vậy chị cũng nghe, nhưng lần này chị hơi thất vọng.',
  ],
};
