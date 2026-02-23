# Lawmakers App

日本の衆議院議員をインタラクティブな地図で可視化するWebアプリケーション。

## 概要

このアプリケーションは、日本の衆議院議員（小選挙区・比例代表）を地図上で可視化し、議員情報や関連ニュースを閲覧できます。メール認証付きのユーザーアカウント機能を備えています。

### 主な機能

- 🗾 **インタラクティブな日本地図** - 都道府県・比例ブロックを選択して議員を表示
- 👥 **議員情報の表示** - 氏名、年齢、党派、当選回数、経歴など
- 📰 **ニュースパネル** - NHK RSSから衆議院関連ニュースを取得・表示
- 🔄 **小選挙区/比例代表モード切替** - 2つの選挙制度を切り替えて表示
- 🔐 **ユーザー認証** - メール認証付きサインアップ・ログイン機能

## 技術スタック

### フロントエンド
- **React 19** - UIフレームワーク
- **React Router 7** - ルーティング
- **TypeScript** - 型安全な開発
- **Vite 8** - ビルドツール
- **Tailwind CSS v4** - スタイリング
- **D3.js** - 地図描画・TopoJSON処理
- **Framer Motion** - アニメーション
- **Vitest** - テストフレームワーク
- **Playwright** - E2Eテスト

### バックエンド (Worker)
- **Cloudflare Workers** - サーバーレスAPI
- **Hono** - Webフレームワーク
- **D1 Database** - SQLite データベース（ユーザー管理）
- **KV Namespace** - キーバリューストア（レート制限・トークン管理）
- **JWT (jose)** - トークンベース認証
- **Resend** - メール配信サービス
- **Wrangler** - デプロイツール

## プロジェクト構成

```
lawmakers-app/
├── src/                    # フロントエンドソース
│   ├── components/         # Reactコンポーネント
│   ├── hooks/              # カスタムフック
│   ├── lib/                # ユーティリティ関数
│   ├── pages/              # ページコンポーネント
│   ├── types/              # TypeScript型定義
│   └── test/               # テスト設定
├── worker/                 # Cloudflare Worker
│   ├── migrations/         # D1 マイグレーション
│   └── src/
│       ├── lib/            # ライブラリ（DB、認証、レート制限など）
│       ├── middleware/     # ミドルウェア
│       └── routes/         # APIルート
├── data/                   # 議員データ（Markdown）
├── public/                 # 静的アセット
├── tests/                  # Playwright E2Eテスト
└── package.json
```

## ディレクトリ・ファイル詳細

### `src/components/` - Reactコンポーネント

| ファイル | 説明 |
|---------|------|
| `App.tsx` | アプリケーションのメインコンポーネント。モード切替（小選挙区/比例代表）、都道府県・ブロック選択の状態管理を行う |
| `AuthProvider.tsx` | 認証プロバイダー。ユーザーの認証状態を管理し、ログイン・ログアウト機能を提供 |
| `Header.tsx` | ヘッダーコンポーネント。タイトル、議員総数の表示、小選挙区/比例代表のモード切替ボタン、政党カラーマップの凡例を表示 |
| `JapanMap.tsx` | 日本地図コンポーネント。D3.jsを使ってTopoJSONから地図を描画。都道府県・ブロックの選択、ズーム操作、ニュースカードの地図上表示を管理 |
| `MemberPanel.tsx` | 議員一覧パネル。選択された都道府県・ブロックの議員を政党ごとにグループ化して表示。議員選択時にニュースを表示する機能も持つ |
| `MemberCard.tsx` | 議員カード。議員の写真、氏名、選挙区、年齢、当選回数、経歴などを表示 |
| `NewsPanel.tsx` | ニュース一覧パネル。カテゴリフィルタ、更新ボタン、ニュース一覧を表示。ローディング状態のスケルトン表示も実装 |
| `NewsCard.tsx` | ニュースカード。ニュースタイトル、公開日時、カテゴリラベルを表示 |
| `MapNewsCard.tsx` | 地図上に表示するニュースカード。地図上の都道府県位置にニュースをオーバーレイ表示 |
| `ZoomControls.tsx` | 地図のズームコントロールボタン（ズームイン・アウト・リセット） |

### `src/pages/` - ページコンポーネント

| ファイル | 説明 |
|---------|------|
| `Login.tsx` | ログインページ。メールアドレスとパスワードでログイン |
| `Signup.tsx` | サインアップページ。メールアドレスとパスワードで新規登録 |
| `Verify.tsx` | メール確認ページ。確認リンククリック後の結果を表示 |

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

#### `worker/src/` - メインソース

| ファイル | 説明 |
|---------|------|
| `index.ts` | Workerエントリーポイント。Honoアプリケーションのセットアップ、CORS設定、ニュースAPIルーティングを定義。インメモリキャッシュを実装 |
| `rss-fetcher.ts` | RSS取得・パース。NHK RSSからニュースを取得、カテゴリ分類、議員名・都道府県の抽出を行う。OGP画像取得機能も提供 |
| `types.ts` | 型定義。環境変数、ユーザー型、JWTペイロード、レート制限設定、トークン設定、ニュース型などを定義 |

#### `worker/src/lib/` - ライブラリ

| ファイル | 説明 |
|---------|------|
| `db.ts` | データベース操作。ユーザーの作成、検索、更新（D1 Database） |
| `password.ts` | パスワードハッシュ化・検証（PBKDF2） |
| `token.ts` | JWT トークン生成・検証。アクセストークン、リフレッシュトークン、確認トークンを管理 |
| `email.ts` | メール送信。確認メールの送信・再送（Resend API） |
| `rate.ts` | レート制限。サインアップ・ログイン・メール再送の回数制限（KV Namespace） |

#### `worker/src/middleware/` - ミドルウェア

| ファイル | 説明 |
|---------|------|
| `auth.ts` | 認証ミドルウェア。JWTアクセストークンの検証、ユーザー情報のコンテキストへの設定 |

#### `worker/src/routes/` - ルート

| ファイル | 説明 |
|---------|------|
| `auth.ts` | 認証関連のエンドポイント。サインアップ、ログイン、ログアウト、メール確認、トークン更新など |

#### `worker/migrations/` - データベースマイグレーション

| ファイル | 説明 |
|---------|------|
| `001_create_users.sql` | ユーザーテーブル作成。ID、メールアドレス、パスワードハッシュ、確認状態など |

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

### `tests/` - E2Eテスト

| ファイル | 説明 |
|---------|------|
| `app.spec.ts` | アプリケーション全体のテスト |
| `map.spec.ts` | 地図機能のテスト |
| `member-panel.spec.ts` | 議員パネルのテスト |
| `news-panel.spec.ts` | ニュースパネルのテスト |

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

### 環境変数の設定

Worker側で以下のシークレットを設定する必要があります：

```bash
cd worker

# JWTシークレット
wrangler secret put JWT_SECRET

# リフレッシュトークンシークレット
wrangler secret put REFRESH_SECRET

# Resend APIキー（メール送信用）
wrangler secret put RESEND_API_KEY

# アプリケーションオリジンURL
wrangler secret put APP_ORIGIN
```

### データベースのセットアップ

```bash
cd worker

# D1データベースの作成
wrangler d1 create lawmakers-db

# マイグレーションの実行
wrangler d1 execute lawmakers-db --file=migrations/001_create_users.sql
```

### 開発環境

#### 1. Cloudflareにログイン（初回のみ）
```bash
cd worker
pnpm wrangler login --callback-host=0.0.0.0
```
ブラウザが開き、Cloudflareアカウントで認証します。

※ Devcontainer等の環境では `--callback-host=0.0.0.0` オプションが必要です。

#### 2. 開発サーバー起動
```bash
# プロジェクトルートに戻る
cd ..

# フロントエンドのみ起動
pnpm dev

# または、フロントエンド + Worker 同時起動
pnpm dev:full
```

- フロントエンド: `http://localhost:5173`
- Worker: `http://localhost:8787`
- ホットリロード有効（コード変更は自動反映）

### テスト

```bash
# ユニットテスト実行
pnpm test

# テストUI
pnpm test:ui

# カバレッジ付きテスト
pnpm test:coverage

# E2Eテスト（Playwright）
pnpm exec playwright test
```

### ビルド

```bash
pnpm build
```

### 本番環境へのデプロイ

#### 1. Cloudflareにログイン（初回のみ）
```bash
cd worker
pnpm wrangler login --callback-host=0.0.0.0
```
ブラウザが開き、Cloudflareアカウントで認証します。

※ Devcontainer等の環境では `--callback-host=0.0.0.0` オプションが必要です。

#### 2. デプロイ実行
```bash
# プロジェクトルートに戻る
cd ..

# ビルド + デプロイ（一括）
pnpm deploy
```

これにより以下が実行されます：
1. `tsc -b && vite build`（フロントエンドのビルド）
2. `cd worker && pnpm run deploy`（Workerのデプロイ）

#### 補足コマンド

```bash
# Worker側だけデプロイ
cd worker && pnpm run deploy

# ログイン状態を確認
cd worker && pnpm wrangler whoami
```

## API エンドポイント (Worker)

### 認証関連（認証不要）

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/api/signup` | POST | 新規ユーザー登録。確認メールを送信 |
| `/api/login` | POST | ログイン。Cookieにトークンを設定 |
| `/api/logout` | POST | ログアウト。Cookieをクリア |
| `/api/verify` | GET | メール確認。トークン検証後にアカウントを有効化 |
| `/api/resend` | POST | 確認メール再送 |
| `/api/refresh` | POST | トークン更新 |
| `/api/health` | GET | ヘルスチェック |

### 認証関連（認証必要）

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/api/me` | GET | 現在のユーザー情報取得 |

### ニュース関連（認証必要）

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/api/news` | GET | ニュース一覧取得（クエリパラメータ: `category`, `member`, `all`） |
| `/api/refresh` | POST | ニュースキャッシュ強制更新 |
| `/api/ogp` | GET | OGP画像URL取得 |

## 認証フロー

### サインアップ
1. ユーザーがメールアドレスとパスワードを入力
2. 確認メールを送信（24時間有効なトークン）
3. ユーザーがメール内のリンクをクリック
4. アカウントが有効化され、自動的にログイン

### ログイン
1. ユーザーがメールアドレスとパスワードを入力
2. 認証成功時、Cookieにアクセストークン（15分）とリフレッシュトークン（30日）を設定
3. アクセストークンは自動更新可能

### レート制限
| 操作 | 制限 |
|-----|------|
| サインアップ | 1時間に3回（IP + メールアドレスごと） |
| ログイン | 15分に5回（IP + メールアドレスごと） |
| 確認メール再送 | 1時間に3回（IP + メールアドレスごと） |

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

### ユーザー (User)
```typescript
{
  id: string;            // UUID
  email: string;         // メールアドレス
  verified: boolean;     // 確認済みフラグ
  createdAt: string;     // 作成日時
}
```

## ライセンス

MIT