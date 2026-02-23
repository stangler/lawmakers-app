/**
 * D1 Database Query Wrapper
 * ユーザーテーブル操作用のクエリラッパー
 */

import type { User, UserRow } from '../types';

/**
 * UserRow を User に変換
 */
function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    emailNormalized: row.email_normalized,
    passwordHash: row.password_hash,
    verified: row.verified === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * UUID v4 を生成
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * メールアドレスを正規化
 * - 小文字化
 * - 前後の空白を削除
 * - プラス記号以降を削除（Gmail 等）
 */
export function normalizeEmail(email: string): string {
  const normalized = email.toLowerCase().trim();
  
  // プラス記号以降を削除（オプション、必要に応じて有効化）
  // const plusIndex = normalized.indexOf('+');
  // if (plusIndex > 0) {
  //   const atIndex = normalized.indexOf('@');
  //   if (plusIndex < atIndex) {
  //     normalized = normalized.substring(0, plusIndex) + normalized.substring(atIndex);
  //   }
  // }
  
  return normalized;
}

/**
 * メールアドレスの形式を検証
 */
export function validateEmail(email: string): string | null {
  if (!email || email.length === 0) {
    return 'メールアドレスを入力してください';
  }
  
  if (email.length > 255) {
    return 'メールアドレスは255文字以内にしてください';
  }
  
  // 基本的なメール形式チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'メールアドレスの形式が正しくありません';
  }
  
  return null;
}

/**
 * ユーザーを作成
 */
export async function createUser(
  db: D1Database,
  email: string,
  passwordHash: string
): Promise<User> {
  const id = generateUUID();
  const emailNormalized = normalizeEmail(email);
  const now = new Date().toISOString();
  
  await db
    .prepare(
      `INSERT INTO users (id, email, email_normalized, password_hash, verified, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`
    )
    .bind(id, email, emailNormalized, passwordHash, now, now)
    .run();
  
  return {
    id,
    email,
    emailNormalized,
    passwordHash,
    verified: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * メールアドレスでユーザーを検索（正規化済み）
 */
export async function findUserByNormalizedEmail(
  db: D1Database,
  email: string
): Promise<User | null> {
  const emailNormalized = normalizeEmail(email);
  
  const result = await db
    .prepare('SELECT * FROM users WHERE email_normalized = ?')
    .bind(emailNormalized)
    .first<UserRow>();
  
  if (!result) {
    return null;
  }
  
  return rowToUser(result);
}

/**
 * メールアドレスでユーザーを検索（入力形式）
 */
export async function findUserByEmail(
  db: D1Database,
  email: string
): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first<UserRow>();
  
  if (!result) {
    return null;
  }
  
  return rowToUser(result);
}

/**
 * ID でユーザーを検索
 */
export async function findUserById(
  db: D1Database,
  id: string
): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first<UserRow>();
  
  if (!result) {
    return null;
  }
  
  return rowToUser(result);
}

/**
 * ユーザーを確認済みに更新
 */
export async function verifyUser(
  db: D1Database,
  userId: string
): Promise<void> {
  const now = new Date().toISOString();
  
  await db
    .prepare(
      'UPDATE users SET verified = 1, updated_at = ? WHERE id = ?'
    )
    .bind(now, userId)
    .run();
}

/**
 * パスワードを更新
 */
export async function updatePassword(
  db: D1Database,
  userId: string,
  passwordHash: string
): Promise<void> {
  const now = new Date().toISOString();
  
  await db
    .prepare(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'
    )
    .bind(passwordHash, now, userId)
    .run();
}

/**
 * ユーザーを削除
 */
export async function deleteUser(
  db: D1Database,
  userId: string
): Promise<void> {
  await db
    .prepare('DELETE FROM users WHERE id = ?')
    .bind(userId)
    .run();
}

/**
 * 未確認ユーザーの確認トークンを再送する準備
 * - 未確認ユーザーの場合、更新日時を更新
 */
export async function touchUnverifiedUser(
  db: D1Database,
  userId: string
): Promise<void> {
  const now = new Date().toISOString();
  
  await db
    .prepare(
      'UPDATE users SET updated_at = ? WHERE id = ? AND verified = 0'
    )
    .bind(now, userId)
    .run();
}