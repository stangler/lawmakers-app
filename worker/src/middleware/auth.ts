/**
 * Authentication Middleware
 * JWT 検証ミドルウェア（Hono 用）
 */

import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyAccessToken } from '../lib/token';
import type { Env, AccessTokenPayload, AppVariables } from '../types';

/**
 * 認証が必要なルート用のミドルウェア
 * Cookie からアクセストークンを取得して検証
 */
export async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  next: Next
): Promise<Response | void> {
  const accessToken = getCookie(c, 'access_token');
  
  if (!accessToken) {
    return c.json(
      { error: '認証が必要です', code: 'UNAUTHORIZED' },
      401
    );
  }
  
  const payload = await verifyAccessToken(accessToken, c.env);
  
  if (!payload) {
    return c.json(
      { error: 'トークンが無効または期限切れです', code: 'INVALID_TOKEN' },
      401
    );
  }
  
  // ユーザー情報をコンテキストに設定
  c.set('user', payload);
  
  await next();
}

/**
 * オプショナル認証ミドルウェア
 * トークンがあれば検証するが、なくてもエラーにしない
 */
export async function optionalAuthMiddleware(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  next: Next
): Promise<void> {
  const accessToken = getCookie(c, 'access_token');
  
  if (accessToken) {
    const payload = await verifyAccessToken(accessToken, c.env);
    c.set('user', payload);
  } else {
    c.set('user', null);
  }
  
  await next();
}

/**
 * 管理者権限チェックミドルウェア（将来拡張用）
 */
export async function adminMiddleware(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  next: Next
): Promise<Response | void> {
  const user = c.get('user');
  
  if (!user) {
    return c.json(
      { error: '認証が必要です', code: 'UNAUTHORIZED' },
      401
    );
  }
  
  // TODO: 管理者権限チェック
  // 現在は一般ユーザーのみなので、常に true
  // 将来的に users テーブルに role カラムを追加してチェック
  
  await next();
}

/**
 * 認証済みユーザー情報を取得
 */
export function getAuthenticatedUser(
  c: Context<{ Bindings: Env; Variables: AppVariables }>
): AccessTokenPayload | null {
  return c.get('user');
}

/**
 * 認証済みユーザー ID を取得
 */
export function getAuthenticatedUserId(
  c: Context<{ Bindings: Env; Variables: AppVariables }>
): string | null {
  const user = c.get('user');
  return user?.sub ?? null;
}

/**
 * 認証済みユーザーのメールアドレスを取得
 */
export function getAuthenticatedUserEmail(
  c: Context<{ Bindings: Env; Variables: AppVariables }>
): string | null {
  const user = c.get('user');
  return user?.email ?? null;
}