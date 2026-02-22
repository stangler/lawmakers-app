# Lawmakers App

日本の衆議院議員をインタラクティブな地図で可視化するWebアプリケーション。

## 概要

このアプリケーションは、日本の衆議院議員（小選挙区・比例代表）を地図上で可視化し、議員情報や関連ニュースを閲覧できます。

### 主な機能

- 🗾 **インタラクティブな日本地図** - 都道府県・比例ブロックを選択して議員を表示
- 👥 **議員情報の表示** - 氏名、年齢、党派、当選回数、経歴など
- 📰 **ニュースパネル** - NHK RSSから衆議院関連ニュースを取得・表示
- 🔄 **小選挙区/比例代表モード切替** - 2つの選挙制度を切り替えて表示

## 技術スタック

### フロントエンド
- **React 19** - UIフレームワーク
- **TypeScript** - 型安全な開発
- **Vite** - ビルドツール
- **Tailwind CSS v4** - スタイリング
- **D3.js** - 地図描画・TopoJSON処理
- **Framer Motion** - アニメーション
- **Vitest** - テストフレームワーク

### バックエンド (Worker)
- **Cloudflare Workers** - サーバーレスAPI
- **Wrangler** - デプロイツール

## プロジェクト構成

```
lawmakers-app/
├── src/                    # フロントエンドソース
│   ├── components/         # Reactコンポーネント
│   ├── hooks/              # カスタムフック
│   ├── lib/                # ユーティリティ関数
│   ├── types/              # TypeScript型定義
│   └── test/               # テスト設定
├── worker/                 # Cloudflare Worker
│   └── src/
├── data/                   # 議員データ（Markdown）
├── public/                 # 静的アセット
└── package.json
```

## ディレクトリ・ファイル詳細

### `src/components/` - Reactコンポーネント

| ファイル | 説明 |
|---------|------|
| `App.tsx` | アプリケーションのメインコンポーネント。モード切替（小選挙区/比例代表）、都道府県・ブロック選択の状態管理を行う |
| `Header.tsx` | ヘッダーコンポーネント。タイトル、議員総数の表示、小選挙区/比例代表のモード切替ボタン、政党カラーマップの凡例を表示 |
| `JapanMap.tsx` | 日本地図コンポーネント。D3.jsを使ってTopoJSONから地図を描画。都道府県・ブロックの選択、ズーム操作、ニュースカードの地図上表示を管理 |
| `MemberPanel.tsx` | 議員一覧パネル。選択された都道府県・ブロックの議員を政党ごとにグループ化して表示。議員選択時にニュースを表示する機能も持つ |
| `MemberCard.tsx` | 議員カード。議員の写真、氏名、選挙区、年齢、当選回数、経歴などを表示 |
| `NewsPanel.tsx` | ニュース一覧パネル。カテゴリフィルタ、更新ボタン、ニュース一覧を表示。ローディング状態のスケルトン表示も実装 |
| `NewsCard.tsx` | ニュースカード。ニュースタイトル、公開日時、カテゴリラベルを表示 |
| `MapNewsCard.tsx` | 地図上に表示するニュースカード。地図上の都道府県位置にニュースをオーバーレイ表示 |
| `ZoomControls.tsx` | 地図のズームコントロールボタン（ズームイン・アウト・リセット） |

### `src/hooks/` - カスタムフック

| ファイル | 説明 |
|---------|------|
| `useMembers.ts` | 議員データ取得用フック。小選挙区・比例代表のMarkdownデータをフェッチ・パース。都道府県・ブロックでグループ化するフックも提供 |
| `useNewsData.ts` | ニュースデータ取得用フック。Worker APIからニュースを取得、カテゴリ・議員名でフィルタリング、定期ポーリング（1分間隔）を実装 |
| `useMapZoom.ts` | 地図ズーム状態管理フック。ズームイン・アウト・リセット・特定座標へのズーム機能を提供 |

### `src/lib/` - ユーティリティ関数

| ファイル | 説明 |
|---------|------|
| `parseMembers.ts` | 議員データパーサー。Markdown形式の議員データをTypeScriptオブジェクトに変換。政党カラーマップ（`PARTY_COLORS`）も定義 |
| `memberMatcher.ts` | 議員名マッチング。ニュース記事から議員名を抽出・マッチングする機能を提供。氏名のバリエーション（姓のみ、空白なし、ふりがな）を生成 |
| `memberImage.ts` | 議員画像パス生成。議員IDから画像ファイルパスを生成 |
| `prefectures.ts` | 都道府県データ。都道府県コード・名称・緯度経度のマッピングを提供 |

### `src/types/` - TypeScript型定義

| ファイル | 説明 |
|---------|------|
| `member.ts` | 議員型定義。`SingleSeatMember`（小選挙区議員）、`ProportionalMember`（比例代表議員）のインターフェースと比例ブロック定数を定義 |
| `news.ts` | ニュース型定義。`NewsItem`インターフェース、カテゴリラベル、カテゴリカラーを定義 |

### `src/test/` - テスト設定

| ファイル | 説明 |
|---------|------|
| `setup.ts` | Vitestのテストセットアップ。テスト環境の初期化を行う |

### `worker/` - Cloudflare Worker

| ファイル | 説明 |
|---------|------|
| `src/index.ts` | Workerエントリーポイント。APIルーティング（`/api/news`, `/api/health`, `/api/refresh`, `/api/ogp`）を定義。インメモリキャッシュを実装 |
| `src/rss-fetcher.ts` | RSS取得・パース。NHK RSSからニュースを取得、カテゴリ分類、議員名・都道府県の抽出を行う。OGP画像取得機能も提供 |
| `src/types.ts` | Worker型定義。RSSフィードURL、カテゴリキーワード、都道府県キーワードを定義 |

### `data/` - 議員データ

| ファイル | 説明 |
|---------|------|
| `singler-seat.md` | 小選挙区議員データ。都道府県ごとの議員情報をMarkdown形式で格納 |
| `proportional.md` | 比例代表議員データ。ブロックごとの議員情報をMarkdown形式で格納 |

### `public/` - 静的アセット

| ファイル/ディレクトリ | 説明 |
|---------------------|------|
| `japan-topo.json` | 日本地図のTopoJSONデータ。都道府県境界情報を含む |
| `data/` | 議員写真などの画像ファイル |
| `vite.svg` | Viteファビコン |

## セットアップ

### 前提条件
- Node.js 18+
- pnpm

### インストール

```bash
# 依存関係のインストール
pnpm install

# Workerの依存関係もインストール
cd worker && pnpm install
```

### 開発

```bash
# フロントエンドのみ開発サーバー起動
pnpm dev

# フロントエンド + Worker 同時起動
pnpm dev:full
```

### テスト

```bash
# テスト実行
pnpm test

# テストUI
pnpm test:ui

# カバレッジ付きテスト
pnpm test:coverage
```

### ビルド

```bash
pnpm build
```

### デプロイ

```bash
pnpm deploy
```

## API エンドポイント (Worker)

| エンドポイント | 説明 |
|--------------|------|
| `GET /api/news` | ニュース一覧取得（クエリパラメータ: `category`, `member`, `all`） |
| `GET /api/health` | ヘルスチェック |
| `GET /api/refresh` | キャッシュ強制更新 |
| `GET /api/ogp` | OGP画像URL取得 |

## データ形式

### 小選挙区議員 (SingleSeatMember)
```typescript
{
  id: number;
  prefecture: string;    // 都道府県名
  prefectureCode: string; // 都道府県コード
  district: string;      // 選挙区
  party: string;         // 政党
  name: string;          // 氏名
  kana: string;          // ふりがな
  age: number;           // 年齢
  status: '新' | '前' | '元';
  terms: number;         // 当選回数
  background: string;    // 経歴
}
```

### 比例代表議員 (ProportionalMember)
```typescript
{
  id: number;
  block: string;         // 比例ブロック
  party: string;         // 政党
  name: string;
  kana: string;
  status: '新' | '前' | '元';
  age: number;
  terms: number;
  background: string;
  originDistrict?: string; // 原本選挙区
}
```

## ライセンス

MIT