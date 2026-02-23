/**
 * Rate Limiting Library
 * KV を使用した IP/メール単位のレート制御
 */

import { RATE_LIMITS, type RateLimitConfig } from '../types';

// ============================================
// Utility Functions
// ============================================

/**
 * IP アドレスをハッシュ化（ログ用にマスク）
 */
function maskIp(ip: string): string {
  if (ip.includes('.')) {
    // IPv4
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.***.***`;
  } else if (ip.includes(':')) {
    // IPv6
    const parts = ip.split(':');
    return `${parts[0]}:${parts[1]}:****:****`;
  }
  return '***';
}

/**
 * メールアドレスをハッシュ化（KV キー用）
 * 個人を特定できない形でハッシュ化
 */
async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, (b) => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

// ============================================
// Rate Limit Keys
// ============================================

/**
 * IP ベースのレート制限キーを生成
 */
function getIpRateKey(ip: string, action: string): string {
  return `rate:ip:${ip}:${action}`;
}

/**
 * メールベースのレート制限キーを生成
 */
async function getEmailRateKey(email: string, action: string): Promise<string> {
  const emailHash = await hashEmail(email);
  return `rate:email:${emailHash}:${action}`;
}

// ============================================
// Rate Limit Functions
// ============================================

/**
 * 現在のリクエスト数を取得
 */
async function getRequestCount(kv: KVNamespace, key: string): Promise<number> {
  const count = await kv.get(key);
  return count ? parseInt(count, 10) : 0;
}

/**
 * レート制限をチェック
 * 
 * @param kv - KV Namespace
 * @param ip - クライアント IP アドレス
 * @param email - メールアドレス（オプション）
 * @param action - アクション名（signup, login, resend 等）
 * @param config - レート制限設定
 * @returns 制限内なら true、超過なら false
 */
export async function checkRateLimit(
  kv: KVNamespace,
  ip: string,
  action: string,
  email?: string,
  config?: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const rateConfig = config || RATE_LIMITS[action];
  
  if (!rateConfig) {
    console.warn(`Rate limit config not found for action: ${action}`);
    return { allowed: true, remaining: Infinity, resetIn: 0 };
  }
  
  const { windowMs, maxRequests } = rateConfig;
  
  // IP ベースのチェック
  const ipKey = getIpRateKey(ip, action);
  const ipCount = await getRequestCount(kv, ipKey);
  
  // メールベースのチェック（指定がある場合）
  let emailCount = 0;
  let emailKey: string | null = null;
  if (email) {
    emailKey = await getEmailRateKey(email, action);
    emailCount = await getRequestCount(kv, emailKey);
  }
  
  // より制限の厳しい方を採用
  const maxCount = Math.max(ipCount, emailCount);
  const remaining = Math.max(0, maxRequests - maxCount - 1);
  
  // 制限超過チェック
  if (ipCount >= maxRequests || emailCount >= maxRequests) {
    console.log(JSON.stringify({
      event: 'rate_limited',
      ip: maskIp(ip),
      action,
      ipCount,
      emailCount,
      maxRequests,
      timestamp: new Date().toISOString(),
    }));
    
    return {
      allowed: false,
      remaining: 0,
      resetIn: windowMs,
    };
  }
  
  return {
    allowed: true,
    remaining,
    resetIn: windowMs,
  };
}

/**
 * レート制限カウンタをインクリメント
 * 
 * @param kv - KV Namespace
 * @param ip - クライアント IP アドレス
 * @param email - メールアドレス（オプション）
 * @param action - アクション名
 * @param ttl - TTL（ミリ秒）
 */
export async function incrementRateLimit(
  kv: KVNamespace,
  ip: string,
  action: string,
  email?: string,
  ttl?: number
): Promise<void> {
  const rateConfig = RATE_LIMITS[action];
  const expirationTtl = Math.floor((ttl || rateConfig?.windowMs || 3600000) / 1000);
  
  // IP カウンタをインクリメント
  const ipKey = getIpRateKey(ip, action);
  const ipCount = await getRequestCount(kv, ipKey);
  await kv.put(ipKey, String(ipCount + 1), { expirationTtl });
  
  // メールカウンタをインクリメント
  if (email) {
    const emailKey = await getEmailRateKey(email, action);
    const emailCount = await getRequestCount(kv, emailKey);
    await kv.put(emailKey, String(emailCount + 1), { expirationTtl });
  }
}

/**
 * KV が有効かチェック
 */
async function isKvAvailable(kv: KVNamespace): Promise<boolean> {
  try {
    await kv.get('health-check');
    return true;
  } catch {
    return false;
  }
}

/**
 * サインアップのレート制限チェックとインクリメント
 */
export async function checkAndIncrementSignupRate(
  kv: KVNamespace,
  ip: string,
  email: string
): Promise<{ allowed: boolean; remaining: number }> {
  // ローカル開発環境または KV が利用不可の場合はスキップ
  const kvAvailable = await isKvAvailable(kv);
  if (!kvAvailable) {
    return { allowed: true, remaining: Infinity };
  }
  
  const result = await checkRateLimit(kv, ip, 'signup', email);
  
  if (result.allowed) {
    await incrementRateLimit(kv, ip, 'signup', email);
  }
  
  return {
    allowed: result.allowed,
    remaining: result.remaining,
  };
}

/**
 * ログインのレート制限チェックとインクリメント
 */
export async function checkAndIncrementLoginRate(
  kv: KVNamespace,
  ip: string,
  email: string
): Promise<{ allowed: boolean; remaining: number }> {
  // ローカル開発環境または KV が利用不可の場合はスキップ
  const kvAvailable = await isKvAvailable(kv);
  if (!kvAvailable) {
    return { allowed: true, remaining: Infinity };
  }
  
  const result = await checkRateLimit(kv, ip, 'login', email);
  
  if (result.allowed) {
    await incrementRateLimit(kv, ip, 'login', email);
  }
  
  return {
    allowed: result.allowed,
    remaining: result.remaining,
  };
}

/**
 * 再送のレート制限チェックとインクリメント
 */
export async function checkAndIncrementResendRate(
  kv: KVNamespace,
  ip: string,
  email: string
): Promise<{ allowed: boolean; remaining: number }> {
  // ローカル開発環境または KV が利用不可の場合はスキップ
  const kvAvailable = await isKvAvailable(kv);
  if (!kvAvailable) {
    return { allowed: true, remaining: Infinity };
  }
  
  const result = await checkRateLimit(kv, ip, 'resend', email);
  
  if (result.allowed) {
    await incrementRateLimit(kv, ip, 'resend', email);
  }
  
  return {
    allowed: result.allowed,
    remaining: result.remaining,
  };
}

// ============================================
// IP Extraction
// ============================================

/**
 * リクエストからクライアント IP を抽出
 * Cloudflare Workers 環境用
 */
export function getClientIp(request: Request): string {
  // CF-Connecting-IP は Cloudflare が設定
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) {
    return cfIp;
  }
  
  // X-Forwarded-For（プロキシ経由の場合）
  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // X-Real-IP（Nginx 等）
  const realIp = request.headers.get('X-Real-IP');
  if (realIp) {
    return realIp;
  }
  
  // フォールバック
  return 'unknown';
}