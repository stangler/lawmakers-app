/**
 * Email Sending Library
 * Resend API を使用したメール送信
 */

import type { Env } from '../types';

// ============================================
// Email Templates
// ============================================

/**
 * 確認メールの HTML テンプレート
 */
function getVerifyEmailHtml(verifyUrl: string, appOrigin: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>メールアドレスの確認</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9f9f9; border-radius: 8px; padding: 30px; margin-top: 20px;">
    <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 20px; text-align: center;">
      メールアドレスの確認
    </h1>
    <p style="font-size: 16px; margin-bottom: 20px;">
      Lawmakers App にご登録いただきありがとうございます。
    </p>
    <p style="font-size: 16px; margin-bottom: 20px;">
      以下のリンクをクリックして、メールアドレスの確認を完了してください：
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
        確認を完了する
      </a>
    </div>
    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
      リンクがクリックできない場合は、以下のURLをコピーしてブラウザに貼り付けてください：
    </p>
    <p style="font-size: 14px; color: #666; word-break: break-all; background-color: #eee; padding: 10px; border-radius: 4px;">
      ${verifyUrl}
    </p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="font-size: 14px; color: #666;">
      <strong>注意：</strong>このリンクの有効期限は<strong>24時間</strong>です。
    </p>
    <p style="font-size: 14px; color: #666;">
      心当たりがない場合は、このメールを無視してください。
    </p>
  </div>
  <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
    <p style="font-size: 12px; color: #999;">
      © Lawmakers App<br>
      <a href="${appOrigin}" style="color: #666;">${appOrigin}</a>
    </p>
  </div>
</body>
</html>`;
}

/**
 * 確認メールのテキストテンプレート
 */
function getVerifyEmailText(verifyUrl: string, appOrigin: string): string {
  return `メールアドレスの確認

Lawmakers App にご登録いただきありがとうございます。

以下のリンクをクリックして、メールアドレスの確認を完了してください：

${verifyUrl}

このリンクの有効期限は24時間です。
心当たりがない場合は、このメールを無視してください。

---
© Lawmakers App
${appOrigin}`;
}

// ============================================
// Resend API Functions
// ============================================

/**
 * Resend API でメールを送信
 */
async function sendEmailWithResend(
  env: Env,
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<void> {
  // ローカル開発環境かチェック（APP_ORIGIN に localhost が含まれる場合）
  const isLocal = env.APP_ORIGIN.includes('localhost');
  
  if (isLocal) {
    // ローカル開発環境: メール送信の代わりに検証URLをログに出力
    const verifyUrlMatch = html.match(/href="([^"]*verify[^"]*)"/);
    const verifyUrl = verifyUrlMatch ? verifyUrlMatch[1] : 'URL not found';
    
    console.log(JSON.stringify({
      event: 'email_sent_local',
      to: to.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      subject: subject,
      verifyUrl: verifyUrl,
      timestamp: new Date().toISOString(),
    }));
    return;
  }
  
  // 本番環境: Resend API でメール送信
  // 開発環境では onboarding@resend.dev から送信
  // 本番環境では検証済みドメインから送信
  const fromEmail = 'onboarding@resend.dev';
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: to,
      subject: subject,
      html: html,
      text: text,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(JSON.stringify({
      event: 'resend_api_error',
      status: response.status,
      error: errorText,
      timestamp: new Date().toISOString(),
    }));
    throw new Error('メールの送信に失敗しました');
  }
  
  const result = await response.json() as { id?: string };
  
  console.log(JSON.stringify({
    event: 'email_sent_via_resend',
    emailId: result.id,
    to: to.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    timestamp: new Date().toISOString(),
  }));
}

// ============================================
// Email Sending Functions
// ============================================

/**
 * 確認メールを送信
 * 
 * @param email - 送信先メールアドレス
 * @param token - 確認トークン
 * @param env - 環境変数
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  env: Env
): Promise<void> {
  const verifyUrl = `${env.APP_ORIGIN}/verify?token=${token}`;
  
  const html = getVerifyEmailHtml(verifyUrl, env.APP_ORIGIN);
  const text = getVerifyEmailText(verifyUrl, env.APP_ORIGIN);
  
  try {
    await sendEmailWithResend(
      env,
      email,
      '【Lawmakers App】メールアドレスの確認',
      html,
      text
    );
    
    console.log(JSON.stringify({
      event: 'verification_email_sent',
      to: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    console.error(JSON.stringify({
      event: 'verification_email_failed',
      to: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      error: String(error),
      timestamp: new Date().toISOString(),
    }));
    throw error;
  }
}

/**
 * 再送確認メールを送信
 * （確認メールと同じだが、ログが異なる）
 */
export async function resendVerificationEmail(
  email: string,
  token: string,
  env: Env
): Promise<void> {
  await sendVerificationEmail(email, token, env);
  
  console.log(JSON.stringify({
    event: 'verification_email_resent',
    to: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    timestamp: new Date().toISOString(),
  }));
}

/**
 * ようこそメールを送信（確認完了後）
 * 
 * @param email - 送信先メールアドレス
 * @param env - 環境変数
 */
export async function sendWelcomeEmail(
  email: string,
  env: Env
): Promise<void> {
  const loginUrl = `${env.APP_ORIGIN}/login`;
  
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <title>アカウント登録完了</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9f9f9; border-radius: 8px; padding: 30px;">
    <h1 style="color: #16a34a; text-align: center;">登録完了</h1>
    <p>メールアドレスの確認が完了しました。</p>
    <p>Lawmakers App をご利用いただけます。</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" style="background-color: #16a34a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        ログインする
      </a>
    </div>
  </div>
</body>
</html>`;

  const text = `登録完了

メールアドレスの確認が完了しました。
Lawmakers App をご利用いただけます。

ログイン: ${loginUrl}`;

  try {
    await sendEmailWithResend(
      env,
      email,
      '【Lawmakers App】アカウント登録完了',
      html,
      text
    );
    
    console.log(JSON.stringify({
      event: 'welcome_email_sent',
      to: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    // ウェルカムメールの失敗は致命的ではないのでログのみ
    console.error(JSON.stringify({
      event: 'welcome_email_failed',
      to: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      error: String(error),
      timestamp: new Date().toISOString(),
    }));
  }
}