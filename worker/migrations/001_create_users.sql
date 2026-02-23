-- Lawmakers App Users Table
-- メール認証システム用のユーザーテーブル

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  -- 主キー（UUID形式の文字列）
  id TEXT PRIMARY KEY,
  
  -- メールアドレス（入力時の形式を維持）
  email TEXT UNIQUE NOT NULL,
  
  -- 正規化されたメールアドレス（小文字化、トリム済み）
  -- 検索・重複チェックに使用
  email_normalized TEXT UNIQUE NOT NULL,
  
  -- パスワードハッシュ（PBKDF2またはArgon2形式）
  password_hash TEXT NOT NULL,
  
  -- メール確認フラグ（0: 未確認, 1: 確認済み）
  verified INTEGER DEFAULT 0,
  
  -- 作成日時（ISO 8601形式）
  created_at TEXT DEFAULT (datetime('now')),
  
  -- 更新日時（ISO 8601形式）
  updated_at TEXT DEFAULT (datetime('now'))
);

-- メールアドレス検索用インデックス
CREATE INDEX IF NOT EXISTS idx_users_email_normalized ON users(email_normalized);

-- 確認状態でのフィルタリング用インデックス
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified);

-- 作成日時でのソート用インデックス
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);