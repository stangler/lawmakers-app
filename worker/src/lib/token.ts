/**
 * Token Generation and Verification
 * jose ライブラリを使用した JWT 署名・検証
 */

import * as jose from 'jose';
import type { Env, AccessTokenPayload, VerifyTokenPayload } from '../types';
import { TOKEN_CONFIG } from '../types';

// ============================================
// Utility Functions
// ============================================

/**
 * ランダムなトークンIDを生成（Base64URL エンコード）
 */
export function generateTokenId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return jose.base64url.encode(bytes);
}

/**
 * ランダムな Refresh トークンを生成
 */
export function generateRefreshToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return jose.base64url.encode(bytes);
}

// ============================================
// Verify Token (Email Confirmation)
// ============================================

/**
 * メール確認用トークンを生成
 * 
 * @param userId - ユーザーID
 * @param email - メールアドレス
 * @param env - 環境変数
 * @returns 署名された JWT
 */
export async function generateVerifyToken(
  userId: string,
  email: string,
  env: Env
): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const jti = generateTokenId();
  
  const token = await new jose.SignJWT({
    sub: userId,
    email,
    purpose: 'verify',
    jti,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_CONFIG.verifyTokenExpiresIn)
    .sign(secret);
  
  // KV にトークンIDを保存（一度きり使用のため）
  await env.KV.put(
    `verify:${jti}`,
    JSON.stringify({ userId, email }),
    { expirationTtl: TOKEN_CONFIG.verifyTokenMaxAge }
  );
  
  return token;
}

/**
 * メール確認トークンを検証
 * 
 * @param token - JWT
 * @param env - 環境変数
 * @returns ペイロード（検証失敗時は null）
 */
export async function verifyVerifyToken(
  token: string,
  env: Env
): Promise<VerifyTokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    
    // タイプガード
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      payload.purpose !== 'verify' ||
      typeof payload.jti !== 'string'
    ) {
      console.error('Invalid verify token payload structure');
      return null;
    }
    
    // KV にトークンが存在するか確認（一度きり使用）
    const storedData = await env.KV.get(`verify:${payload.jti}`);
    if (!storedData) {
      console.error('Verify token already used or expired');
      return null;
    }
    
    // トークンを削除（再利用防止）
    await env.KV.delete(`verify:${payload.jti}`);
    
    return {
      sub: payload.sub,
      email: payload.email,
      purpose: 'verify',
      jti: payload.jti,
      iat: payload.iat!,
      exp: payload.exp!,
    };
  } catch (error) {
    console.error('Verify token validation error:', error);
    return null;
  }
}

// ============================================
// Access Token
// ============================================

/**
 * アクセストークンを生成
 * 
 * @param userId - ユーザーID
 * @param email - メールアドレス
 * @param env - 環境変数
 * @returns 署名された JWT
 */
export async function generateAccessToken(
  userId: string,
  email: string,
  env: Env
): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  
  const token = await new jose.SignJWT({
    sub: userId,
    email,
    purpose: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_CONFIG.accessTokenExpiresIn)
    .setAudience(TOKEN_CONFIG.audience)
    .sign(secret);
  
  return token;
}

/**
 * アクセストークンを検証
 * 
 * @param token - JWT
 * @param env - 環境変数
 * @returns ペイロード（検証失敗時は null）
 */
export async function verifyAccessToken(
  token: string,
  env: Env
): Promise<AccessTokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ['HS256'],
      audience: TOKEN_CONFIG.audience,
    });
    
    // タイプガード
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      payload.purpose !== 'access'
    ) {
      console.error('Invalid access token payload structure');
      return null;
    }
    
    return {
      sub: payload.sub,
      email: payload.email,
      purpose: 'access',
      iat: payload.iat!,
      exp: payload.exp!,
      aud: TOKEN_CONFIG.audience,
    };
  } catch (error) {
    // JWT expired or invalid
    if (error instanceof jose.errors.JWTExpired) {
      console.log('Access token expired');
    } else {
      console.error('Access token validation error:', error);
    }
    return null;
  }
}

// ============================================
// Refresh Token (Rotating)
// ============================================

/**
 * Refresh トークンを保存
 * 
 * @param kv - KV Namespace
 * @param userId - ユーザーID
 * @param tokenId - トークンID
 */
export async function storeRefreshToken(
  kv: KVNamespace,
  userId: string,
  tokenId: string
): Promise<void> {
  await kv.put(
    `refresh:${userId}:${tokenId}`,
    JSON.stringify({ createdAt: Date.now() }),
    { expirationTtl: TOKEN_CONFIG.refreshTokenMaxAge }
  );
}

/**
 * Refresh トークンを検証
 * 
 * @param kv - KV Namespace
 * @param userId - ユーザーID
 * @param tokenId - トークンID
 * @returns 有効かどうか
 */
export async function validateRefreshToken(
  kv: KVNamespace,
  userId: string,
  tokenId: string
): Promise<boolean> {
  const storedData = await kv.get(`refresh:${userId}:${tokenId}`);
  return storedData !== null;
}

/**
 * Refresh トークンを削除（ログアウト時）
 * 
 * @param kv - KV Namespace
 * @param userId - ユーザーID
 * @param tokenId - トークンID
 */
export async function deleteRefreshToken(
  kv: KVNamespace,
  userId: string,
  tokenId: string
): Promise<void> {
  await kv.delete(`refresh:${userId}:${tokenId}`);
}

/**
 * Rotating Refresh Token ロジック
 * 新しいトークンを発行し、古いトークンを無効化
 * 
 * @param kv - KV Namespace
 * @param userId - ユーザーID
 * @param oldTokenId - 古いトークンID
 * @returns 新しいトークンID
 */
export async function rotateRefreshToken(
  kv: KVNamespace,
  userId: string,
  oldTokenId: string
): Promise<string> {
  // 新しいトークンを生成
  const newTokenId = generateRefreshToken();
  
  // 新しいトークンを保存
  await storeRefreshToken(kv, userId, newTokenId);
  
  // 古いトークンを削除
  await deleteRefreshToken(kv, userId, oldTokenId);
  
  return newTokenId;
}

/**
 * ユーザーのすべての Refresh トークンを無効化
 * （パスワード変更時などに使用）
 * 
 * @param kv - KV Namespace
 * @param userId - ユーザーID
 */
export async function revokeAllRefreshTokens(
  kv: KVNamespace,
  userId: string
): Promise<void> {
  // KV でプレフィックス検索して一括削除
  const list = await kv.list({ prefix: `refresh:${userId}:` });
  
  for (const key of list.keys) {
    await kv.delete(key.name);
  }
}

// ============================================
// Cookie Helpers
// ============================================

/**
 * アクセストークン用 Cookie オプション
 */
export function getAccessTokenCookieOptions(): string {
  return `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${TOKEN_CONFIG.accessTokenMaxAge}`;
}

/**
 * Refresh トークン用 Cookie オプション
 */
export function getRefreshTokenCookieOptions(): string {
  return `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${TOKEN_CONFIG.refreshTokenMaxAge}`;
}

/**
 * 削除用 Cookie オプション
 */
export function getDeleteCookieOptions(): string {
  return 'HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
}