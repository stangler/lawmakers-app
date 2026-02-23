/**
 * Authentication Routes
 * 認証関連のエンドポイント
 */

import { Hono, type Context } from 'hono';
import { setCookie, getCookie } from 'hono/cookie';
import type { Env, AppVariables, SignupRequest, LoginRequest, ResendRequest } from '../types';
import { TOKEN_CONFIG } from '../types';
import {
  createUser,
  findUserByNormalizedEmail,
  findUserById,
  verifyUser,
  validateEmail,
  normalizeEmail,
} from '../lib/db';
import { hashPassword, verifyPassword, validatePassword } from '../lib/password';
import {
  generateVerifyToken,
  verifyVerifyToken,
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  validateRefreshToken,
  rotateRefreshToken,
  deleteRefreshToken,
} from '../lib/token';
import { sendVerificationEmail, resendVerificationEmail } from '../lib/email';
import {
  checkAndIncrementSignupRate,
  checkAndIncrementLoginRate,
  checkAndIncrementResendRate,
  getClientIp,
} from '../lib/rate';
import { authMiddleware, getAuthenticatedUser } from '../middleware/auth';

// ============================================
// Router Setup
// ============================================

const authRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// ============================================
// Helper Functions
// ============================================

type AuthContext = Context<{ Bindings: Env; Variables: AppVariables }>;

/**
 * ログイン処理：Cookie にトークンを設定
 */
async function setAuthCookies(
  c: AuthContext,
  userId: string,
  email: string
): Promise<void> {
  // アクセストークン生成
  const accessToken = await generateAccessToken(userId, email, c.env);
  
  // Refresh トークン生成・保存
  const refreshTokenId = generateRefreshToken();
  await storeRefreshToken(c.env.KV, userId, refreshTokenId);
  
  // Cookie 設定
  setCookie(c, 'access_token', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: TOKEN_CONFIG.accessTokenMaxAge,
  });
  
  setCookie(c, 'refresh_token', refreshTokenId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: TOKEN_CONFIG.refreshTokenMaxAge,
  });
}

/**
 * Cookie からトークンを削除
 */
function clearAuthCookies(c: AuthContext): void {
  setCookie(c, 'access_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 0,
  });
  
  setCookie(c, 'refresh_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 0,
  });
}

// ============================================
// POST /api/signup - サインアップ
// ============================================

authRoutes.post('/signup', async (c) => {
  const ip = getClientIp(c.req.raw);
  
  try {
    const body = await c.req.json<SignupRequest>();
    const { email, password } = body;
    
    // 入力バリデーション
    const emailError = validateEmail(email);
    if (emailError) {
      return c.json({ error: emailError, code: 'INVALID_EMAIL' }, 400);
    }
    
    const passwordError = validatePassword(password);
    if (passwordError) {
      return c.json({ error: passwordError, code: 'INVALID_PASSWORD' }, 400);
    }
    
    // レート制限チェック
    const rateCheck = await checkAndIncrementSignupRate(c.env.KV, ip, email);
    if (!rateCheck.allowed) {
      return c.json(
        { error: 'しばらく待ってから再度お試しください', code: 'RATE_LIMITED' },
        429
      );
    }
    
    // 既存ユーザーチェック
    const normalizedEmail = normalizeEmail(email);
    const existingUser = await findUserByNormalizedEmail(c.env.lawmakers_db, email);
    
    if (existingUser) {
      if (existingUser.verified) {
        // 既に確認済みのユーザー
        return c.json(
          { error: 'このメールアドレスは既に登録されています', code: 'USER_EXISTS' },
          400
        );
      } else {
        // 未確認ユーザー
        const isLocal = c.env.APP_ORIGIN.includes('localhost');
        
        if (isLocal) {
          // ローカル開発環境: ユーザーを自動確認＆ログイン
          await verifyUser(c.env.lawmakers_db, existingUser.id);
          await setAuthCookies(c, existingUser.id, existingUser.email);
          
          console.log(JSON.stringify({
            event: 'signup_resend_local',
            email: normalizedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
            userId: existingUser.id,
            ip,
            timestamp: new Date().toISOString(),
          }));
          
          return c.json({
            message: 'アカウントを確認しました',
            user: {
              id: existingUser.id,
              email: existingUser.email,
              verified: true,
            },
          });
        }
        
        // 本番環境: 確認メール再送
        const verifyToken = await generateVerifyToken(
          existingUser.id,
          existingUser.email,
          c.env
        );
        await resendVerificationEmail(existingUser.email, verifyToken, c.env);
        
        console.log(JSON.stringify({
          event: 'signup_resend',
          email: normalizedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          ip,
          timestamp: new Date().toISOString(),
        }));
        
        return c.json({
          message: '確認メールを再送信しました',
          resend: true,
        });
      }
    }
    
    // パスワードハッシュ化
    const passwordHash = await hashPassword(password);
    
    // ローカル開発環境かチェック
    const isLocal = c.env.APP_ORIGIN.includes('localhost');
    
    // ユーザー作成
    const user = await createUser(c.env.lawmakers_db, email, passwordHash);
    
    if (isLocal) {
      // ローカル開発環境: ユーザーを自動確認＆ログイン
      await verifyUser(c.env.lawmakers_db, user.id);
      await setAuthCookies(c, user.id, user.email);
      
      console.log(JSON.stringify({
        event: 'signup_local',
        email: normalizedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        userId: user.id,
        ip,
        timestamp: new Date().toISOString(),
      }));
      
      return c.json({
        message: 'アカウントを作成しました',
        user: {
          id: user.id,
          email: user.email,
          verified: true,
        },
      });
    }
    
    // 本番環境: 確認メール送信
    const verifyToken = await generateVerifyToken(user.id, user.email, c.env);
    await sendVerificationEmail(user.email, verifyToken, c.env);
    
    console.log(JSON.stringify({
      event: 'signup',
      email: normalizedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      userId: user.id,
      ip,
      timestamp: new Date().toISOString(),
    }));
    
    return c.json({
      message: '確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json(
      { error: 'サーバーエラーが発生しました', code: 'SERVER_ERROR' },
      500
    );
  }
});

// ============================================
// GET /api/verify - メール確認
// ============================================

authRoutes.get('/verify', async (c) => {
  const ip = getClientIp(c.req.raw);
  const token = c.req.query('token');
  
  if (!token) {
    return c.json(
      { error: 'トークンが指定されていません', code: 'MISSING_TOKEN' },
      400
    );
  }
  
  try {
    // トークン検証
    const payload = await verifyVerifyToken(token, c.env);
    
    if (!payload) {
      console.log(JSON.stringify({
        event: 'verify_failed',
        reason: 'invalid_token',
        ip,
        timestamp: new Date().toISOString(),
      }));
      
      return c.redirect(`${c.env.APP_ORIGIN}/verify?error=invalid_token`);
    }
    
    // ユーザー確認
    const user = await findUserById(c.env.lawmakers_db, payload.sub);
    
    if (!user) {
      return c.redirect(`${c.env.APP_ORIGIN}/verify?error=user_not_found`);
    }
    
    // 既に確認済みかチェック
    if (user.verified) {
      // 既に確認済み：そのままログイン
      await setAuthCookies(c, user.id, user.email);
      return c.redirect(c.env.APP_ORIGIN);
    }
    
    // 確認済みに更新
    await verifyUser(c.env.lawmakers_db, user.id);
    
    // Cookie 設定（ログイン）
    await setAuthCookies(c, user.id, user.email);
    
    console.log(JSON.stringify({
      event: 'verify_success',
      userId: user.id,
      ip,
      timestamp: new Date().toISOString(),
    }));
    
    // ホームページにリダイレクト
    return c.redirect(c.env.APP_ORIGIN);
  } catch (error) {
    console.error('Verify error:', error);
    return c.redirect(`${c.env.APP_ORIGIN}/verify?error=server_error`);
  }
});

// ============================================
// POST /api/login - ログイン
// ============================================

authRoutes.post('/login', async (c) => {
  const ip = getClientIp(c.req.raw);
  
  try {
    const body = await c.req.json<LoginRequest>();
    const { email, password } = body;
    
    // 入力バリデーション
    if (!email || !password) {
      return c.json(
        { error: 'メールアドレスとパスワードを入力してください', code: 'MISSING_CREDENTIALS' },
        400
      );
    }
    
    // レート制限チェック
    const rateCheck = await checkAndIncrementLoginRate(c.env.KV, ip, email);
    if (!rateCheck.allowed) {
      return c.json(
        { error: 'しばらく待ってから再度お試しください', code: 'RATE_LIMITED' },
        429
      );
    }
    
    // ユーザー検索
    const user = await findUserByNormalizedEmail(c.env.lawmakers_db, email);
    
    if (!user) {
      return c.json(
        { error: 'メールアドレスまたはパスワードが正しくありません', code: 'INVALID_CREDENTIALS' },
        401
      );
    }
    
    // 確認済みチェック
    if (!user.verified) {
      return c.json(
        { error: 'メールアドレスが確認されていません', code: 'NOT_VERIFIED' },
        401
      );
    }
    
    // パスワード検証
    const passwordValid = await verifyPassword(password, user.passwordHash);
    
    if (!passwordValid) {
      console.log(JSON.stringify({
        event: 'login_failed',
        reason: 'invalid_password',
        email: normalizeEmail(email).replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        ip,
        timestamp: new Date().toISOString(),
      }));
      
      return c.json(
        { error: 'メールアドレスまたはパスワードが正しくありません', code: 'INVALID_CREDENTIALS' },
        401
      );
    }
    
    // Cookie 設定（ログイン）
    await setAuthCookies(c, user.id, user.email);
    
    console.log(JSON.stringify({
      event: 'login_success',
      userId: user.id,
      ip,
      timestamp: new Date().toISOString(),
    }));
    
    return c.json({
      message: 'ログインしました',
      user: {
        id: user.id,
        email: user.email,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json(
      { error: 'サーバーエラーが発生しました', code: 'SERVER_ERROR' },
      500
    );
  }
});

// ============================================
// POST /api/refresh - トークン更新
// ============================================

authRoutes.post('/refresh', async (c) => {
  const ip = getClientIp(c.req.raw);
  
  try {
    const refreshToken = getCookie(c, 'refresh_token');
    
    if (!refreshToken) {
      return c.json(
        { error: 'リフレッシュトークンがありません', code: 'MISSING_REFRESH_TOKEN' },
        401
      );
    }
    
    // アクセストークンからユーザー情報を取得（期限切れでもOK）
    const accessToken = getCookie(c, 'access_token');
    if (!accessToken) {
      return c.json(
        { error: '認証情報がありません', code: 'UNAUTHORIZED' },
        401
      );
    }
    
    // 期限切れのアクセストークンからユーザー ID を抽出
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      return c.json(
        { error: '無効なトークンです', code: 'INVALID_TOKEN' },
        401
      );
    }
    
    let userId: string;
    try {
      const payload = JSON.parse(atob(parts[1]));
      userId = payload.sub;
    } catch {
      return c.json(
        { error: '無効なトークンです', code: 'INVALID_TOKEN' },
        401
      );
    }
    
    // Refresh トークン検証
    const isValid = await validateRefreshToken(c.env.KV, userId, refreshToken);
    
    if (!isValid) {
      return c.json(
        { error: 'リフレッシュトークンが無効です', code: 'INVALID_REFRESH_TOKEN' },
        401
      );
    }
    
    // ユーザー情報取得
    const user = await findUserById(c.env.lawmakers_db, userId);
    
    if (!user || !user.verified) {
      return c.json(
        { error: 'ユーザーが見つかりません', code: 'USER_NOT_FOUND' },
        401
      );
    }
    
    // Rotating: 新しい Refresh トークンを発行
    const newRefreshTokenId = await rotateRefreshToken(c.env.KV, userId, refreshToken);
    
    // 新しいアクセストークン生成
    const newAccessToken = await generateAccessToken(user.id, user.email, c.env);
    
    // Cookie 設定
    setCookie(c, 'access_token', newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: TOKEN_CONFIG.accessTokenMaxAge,
    });
    
    setCookie(c, 'refresh_token', newRefreshTokenId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: TOKEN_CONFIG.refreshTokenMaxAge,
    });
    
    console.log(JSON.stringify({
      event: 'token_refresh',
      userId: user.id,
      ip,
      timestamp: new Date().toISOString(),
    }));
    
    return c.json({
      message: 'トークンを更新しました',
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return c.json(
      { error: 'サーバーエラーが発生しました', code: 'SERVER_ERROR' },
      500
    );
  }
});

// ============================================
// POST /api/logout - ログアウト
// ============================================

authRoutes.post('/logout', async (c) => {
  const ip = getClientIp(c.req.raw);
  
  try {
    const refreshToken = getCookie(c, 'refresh_token');
    const accessToken = getCookie(c, 'access_token');
    
    // Refresh トークンを無効化
    if (refreshToken && accessToken) {
      try {
        const parts = accessToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          await deleteRefreshToken(c.env.KV, payload.sub, refreshToken);
          
          console.log(JSON.stringify({
            event: 'logout',
            userId: payload.sub,
            ip,
            timestamp: new Date().toISOString(),
          }));
        }
      } catch {
        // トークン解析エラーは無視
      }
    }
    
    // Cookie 削除
    clearAuthCookies(c);
    
    return c.json({
      message: 'ログアウトしました',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json(
      { error: 'サーバーエラーが発生しました', code: 'SERVER_ERROR' },
      500
    );
  }
});

// ============================================
// GET /api/me - 現在のユーザー情報
// ============================================

authRoutes.get('/me', authMiddleware, async (c) => {
  const user = getAuthenticatedUser(c);
  
  if (!user) {
    return c.json(
      { error: '認証が必要です', code: 'UNAUTHORIZED' },
      401
    );
  }
  
  // データベースから最新のユーザー情報を取得
  const dbUser = await findUserById(c.env.lawmakers_db, user.sub);
  
  if (!dbUser) {
    return c.json(
      { error: 'ユーザーが見つかりません', code: 'USER_NOT_FOUND' },
      404
    );
  }
  
  return c.json({
    id: dbUser.id,
    email: dbUser.email,
    verified: dbUser.verified,
    createdAt: dbUser.createdAt,
  });
});

// ============================================
// POST /api/resend - 確認メール再送
// ============================================

authRoutes.post('/resend', async (c) => {
  const ip = getClientIp(c.req.raw);
  
  try {
    const body = await c.req.json<ResendRequest>();
    const { email } = body;
    
    // 入力バリデーション
    const emailError = validateEmail(email);
    if (emailError) {
      return c.json({ error: emailError, code: 'INVALID_EMAIL' }, 400);
    }
    
    // レート制限チェック
    const rateCheck = await checkAndIncrementResendRate(c.env.KV, ip, email);
    if (!rateCheck.allowed) {
      return c.json(
        { error: 'しばらく待ってから再度お試しください', code: 'RATE_LIMITED' },
        429
      );
    }
    
    // ユーザー検索
    const user = await findUserByNormalizedEmail(c.env.lawmakers_db, email);
    
    if (!user) {
      // ユーザーが存在しない場合も成功メッセージを返す（セキュリティ）
      return c.json({
        message: '確認メールを送信しました',
      });
    }
    
    if (user.verified) {
      return c.json(
        { error: 'このメールアドレスは既に確認済みです', code: 'ALREADY_VERIFIED' },
        400
      );
    }
    
    // 確認トークン生成
    const verifyToken = await generateVerifyToken(user.id, user.email, c.env);
    
    // 確認メール再送
    await resendVerificationEmail(user.email, verifyToken, c.env);
    
    console.log(JSON.stringify({
      event: 'resend',
      email: normalizeEmail(email).replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      userId: user.id,
      ip,
      timestamp: new Date().toISOString(),
    }));
    
    return c.json({
      message: '確認メールを送信しました',
    });
  } catch (error) {
    console.error('Resend error:', error);
    return c.json(
      { error: 'サーバーエラーが発生しました', code: 'SERVER_ERROR' },
      500
    );
  }
});

export default authRoutes;