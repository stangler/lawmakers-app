/**
 * 议员IDから画像パスを取得するユーティリティ
 * 画像がない場合はnullを返す
 */

// 画像ファイルのベースパス（public/data/ フォルダ）
const IMAGE_BASE_PATH = '/data';

/**
 * 议员ID对应的画像URLを取得
 * @param id 议员ID
 * @returns 画像URL、または画像がない場合はnull
 * 
 * 画像ファイル名の例: 1_katou-takahiro.jpg, 2_takahashi-yuusuke.jpg
 * ファイル名は {ID}_{名前（ハイフン区切り）}.jpg
 */
export function getMemberImageUrl(id: number): string | null {
  // 現時点では動的にパスを解決できないため、
  // 事前に登録された画像マッピングを使用
  // 将来的に画像が追加されたら、このマッピングを更新
  
  // 既に分かっている画像マッピング
  const imageMapping: Record<number, string> = {
    1: '1_katou-takahiro.jpg',
    2: '2_takahashi-yuusuke.jpg',
    3: '3_takagi-hirohisa.jpg',
    4: '4_nakamura-hiroyuki.jpg',
    5: '5_wada-yoshiaki.jpg',
    6: '6_azuma-kuniyoshi.jpg',
    7: '7_suzuki_takako.jpg',
    8: '8_mukouyama-jyun.jpg',
    9: '9_matsushita-hideki.jpg',
    10: '10_kamiya-hiroshi.jpg',
    11: '11_nakagawa-koichi.jpg',
    12: '12_takebe-arata.jpg',
  };

  const filename = imageMapping[id];
  if (!filename) {
    return null;
  }

  return `${IMAGE_BASE_PATH}/${filename}`;
}
