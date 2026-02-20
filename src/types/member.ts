// 小選挙区議員
export interface SingleSeatMember {
  prefecture: string;    // 北海道
  prefectureCode: string; // 01
  district: string;      // 1区
  party: string;         // 自民
  name: string;          // 加藤 貴弘
  kana: string;          // かとう たかひろ
  age: number;           // 43
  status: '新' | '前' | '元';
  terms: number;         // 1
  recommendation?: string; // 維新
  background: string;    // 元北海道議会議員
}

// 比例代表議員
export interface ProportionalMember {
  block: string;         // 北海道ブロック
  party: string;         // 自民
  name: string;
  kana: string;
  status: '新' | '前' | '元';
  age: number;
  terms: number;
  background: string;
  originDistrict?: string; // 北海道10区 または 比例単独
}

// 比例代表ブロック定義
export const PROPORTIONAL_BLOCKS = [
  { id: 'hokkaido', name: '北海道ブロック', prefectures: ['01'] },
  { id: 'tohoku', name: '東北ブロック', prefectures: ['02', '03', '04', '05', '06', '07'] },
  { id: 'kitakanto', name: '北関東ブロック', prefectures: ['08', '09', '10', '11'] },
  { id: 'minamikanto', name: '南関東ブロック', prefectures: ['12', '13', '14'] },
  { id: 'tokyo', name: '東京ブロック', prefectures: ['13'] },
  { id: 'hokuriku', name: '北陸信越ブロック', prefectures: ['15', '16', '17', '18', '19', '20'] },
  { id: 'tokai', name: '東海ブロック', prefectures: ['21', '22', '23', '24'] },
  { id: 'kinki', name: '近畿ブロック', prefectures: ['25', '26', '27', '28', '29', '30'] },
  { id: 'chugoku', name: '中国ブロック', prefectures: ['31', '32', '33', '34', '35'] },
  { id: 'shikoku', name: '四国ブロック', prefectures: ['36', '37', '38', '39'] },
  { id: 'kyushu', name: '九州ブロック', prefectures: ['40', '41', '42', '43', '44', '45', '46', '47'] },
] as const;

export type BlockId = typeof PROPORTIONAL_BLOCKS[number]['id'];