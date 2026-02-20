// News item type
export interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: 'nhk';
  publishedAt: string;
  category: 'election' | 'diet' | 'member' | 'politics' | 'other';
  memberNames: string[];
}

// API response type
export interface NewsApiResponse {
  news: NewsItem[];
  fetchedAt: string;
}

// Category keywords for classification
export const CATEGORY_KEYWORDS: Record<NewsItem['category'], string[]> = {
  election: ['衆院選', '衆议院選挙', '総選挙', '小選挙区', '比例代表', '衆院', '衆议院'],
  diet: ['国会', '参院', '法案', '予算', '委員会', '審議', '採決'],
  member: ['大臣', '首相', '官房長官', '総務大臣', '財務大臣', '外務大臣', '防衛大臣', '岸田', '石破', 'コラー'],
  politics: ['政府', '内閣', '与党', '野党', '選挙', '投票'],
  other: [],
};

// RSS feed URLs
export const RSS_FEEDS = [
  'https://www3.nhk.or.jp/rss/news/cat0.xml', // 社会
  'https://www3.nhk.or.jp/rss/news/cat1.xml', // 政治
];

// Prefecture mapping for region classification
export const PREFECTURE_KEYWORDS: Record<string, string[]> = {
  '01': ['北海道', '札幌', '道'],
  '02': ['青森', '青森'],
  '03': ['岩手', '盛岡'],
  '04': ['宮城', '仙台'],
  '05': ['秋田', '秋田'],
  '06': ['山形', '山形'],
  '07': ['福島', '福島'],
  '08': ['茨城', '水戸'],
  '09': ['栃木', '宇都宮'],
  '10': ['群馬', '前橋'],
  '11': ['埼玉', 'さいたま'],
  '12': ['千葉', '千葉'],
  '13': ['東京', '都', '。都'],
  '14': ['神奈川', '横浜', '川崎'],
  '15': ['新潟', '新潟'],
  '16': ['富山', '富山'],
  '17': ['石川', '金沢'],
  '18': ['福井', '福井'],
  '19': ['山梨', '甲府'],
  '20': ['長野', '長野'],
  '21': ['岐阜', '岐阜'],
  '22': ['静岡', '静岡'],
  '23': ['愛知', '名古屋'],
  '24': ['三重', '津'],
  '25': ['滋賀', '大津'],
  '26': ['京都', '京都'],
  '27': ['大阪', '大阪'],
  '28': ['兵庫', '神戸'],
  '29': ['奈良', '奈良'],
  '30': ['和歌山', '和歌山'],
  '31': ['鳥取', '鳥取'],
  '32': ['島根', '松江'],
  '33': ['岡山', '岡山'],
  '34': ['広島', '広島'],
  '35': ['山口', '山口'],
  '36': ['徳島', '徳島'],
  '37': ['香川', '高松'],
  '38': ['愛媛', '松山'],
  '39': ['高知', '高知'],
  '40': ['福岡', '福岡'],
  '41': ['佐賀', '佐賀'],
  '42': ['長崎', '長崎'],
  '43': ['熊本', '熊本'],
  '44': ['大分', '大分'],
  '45': ['宮崎', '宮崎'],
  '46': ['鹿児島', '鹿児島'],
  '47': ['沖縄', '那覇'],
};
