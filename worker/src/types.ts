/**
 * Lawmakers App - Type Definitions
 * メール認証システム用の型定義
 */

// ============================================
// Environment Bindings
// ============================================

export interface Env {
  // D1 Database Binding
  lawmakers_db: D1Database;
  
  // KV Namespace Binding
  KV: KVNamespace;
  
  // Application Origin URL
  APP_ORIGIN: string;
  
  // JWT Secret (from wrangler secret)
  JWT_SECRET: string;
  
  // Refresh Token Secret (from wrangler secret)
  REFRESH_SECRET: string;
  
  // Resend API Key (from wrangler secret)
  RESEND_API_KEY: string;
}

// Cloudflare SendEmail binding type
export interface SendEmail {
  send(options: EmailSendOptions): Promise<void>;
}

export interface EmailSendOptions {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  email: string;
  emailNormalized: string;
  passwordHash: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRow {
  id: string;
  email: string;
  email_normalized: string;
  password_hash: string;
  verified: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// JWT Payload Types
// ============================================

export interface AccessTokenPayload {
  sub: string;        // User ID
  email: string;
  purpose: 'access';
  iat: number;
  exp: number;
  aud: string;
}

export interface VerifyTokenPayload {
  sub: string;        // User ID
  email: string;
  purpose: 'verify';
  jti: string;        // Unique token ID for one-time use
  iat: number;
  exp: number;
}

export type JwtPayload = AccessTokenPayload | VerifyTokenPayload;

// ============================================
// Request/Response Types
// ============================================

export interface SignupRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ResendRequest {
  email: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  code?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  verified: boolean;
}

export interface MeResponse {
  id: string;
  email: string;
  verified: boolean;
  createdAt: string;
}

// ============================================
// Cookie Types
// ============================================

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
  path: string;
  maxAge?: number;
}

// ============================================
// Rate Limit Types
// ============================================

export interface RateLimitConfig {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Maximum requests per window
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  signup: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 3,
  },
  login: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 5,
  },
  resend: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 3,
  },
};

// ============================================
// Token Configuration
// ============================================

export const TOKEN_CONFIG = {
  // Access Token
  accessTokenExpiresIn: '15m',
  accessTokenMaxAge: 15 * 60,  // 15 minutes in seconds
  
  // Verify Token
  verifyTokenExpiresIn: '24h',
  verifyTokenMaxAge: 24 * 60 * 60,  // 24 hours in seconds
  
  // Refresh Token
  refreshTokenMaxAge: 30 * 24 * 60 * 60,  // 30 days in seconds
  
  // JWT Audience
  audience: 'lawmakers-app',
} as const;

// ============================================
// App Context Variables (for Hono)
// ============================================

export interface AppVariables {
  user: AccessTokenPayload | null;
}

// ============================================
// News Types
// ============================================

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: 'nhk' | 'other';
  publishedAt: string;
  category: 'election' | 'diet' | 'member' | 'politics' | 'other';
  memberNames: string[];
  prefectureCodes: string[];
}

export interface NewsApiResponse {
  news: NewsItem[];
  fetchedAt: string;
}

// RSS Feed URLs
export const RSS_FEEDS = [
  'https://www.nhk.or.jp/rss/news/cat0.xml',  // 社会
  'https://www.nhk.or.jp/rss/news/cat1.xml',  // 科学・文化
  'https://www.nhk.or.jp/rss/news/cat2.xml',  // 政治
  'https://www.nhk.or.jp/rss/news/cat3.xml',  // 経済
  'https://www.nhk.or.jp/rss/news/cat4.xml',  // 国際
];

// Category keywords for classification
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  election: ['選挙', '投票', '立候補', '当選', '落選', '比例', '小選挙区'],
  diet: ['国会', '衆議院', '参議院', '法案', '予算', '審議', '本会議'],
  member: ['議員', '大臣', '首相', '総理', '党首', '幹事長'],
  politics: ['政治', '政党', '与党', '野党', '政権', '組閣'],
};

// Prefecture keywords for location detection
export const PREFECTURE_KEYWORDS: Record<string, string[]> = {
  '01': ['北海道'],
  '02': ['青森'],
  '03': ['岩手'],
  '04': ['宮城'],
  '05': ['秋田'],
  '06': ['山形'],
  '07': ['福島'],
  '08': ['茨城'],
  '09': ['栃木'],
  '10': ['群馬'],
  '11': ['埼玉'],
  '12': ['千葉'],
  '13': ['東京'],
  '14': ['神奈川'],
  '15': ['新潟'],
  '16': ['富山'],
  '17': ['石川'],
  '18': ['福井'],
  '19': ['山梨'],
  '20': ['長野'],
  '21': ['岐阜'],
  '22': ['静岡'],
  '23': ['愛知'],
  '24': ['三重'],
  '25': ['滋賀'],
  '26': ['京都'],
  '27': ['大阪'],
  '28': ['兵庫'],
  '29': ['奈良'],
  '30': ['和歌山'],
  '31': ['鳥取'],
  '32': ['島根'],
  '33': ['岡山'],
  '34': ['広島'],
  '35': ['山口'],
  '36': ['徳島'],
  '37': ['香川'],
  '38': ['愛媛'],
  '39': ['高知'],
  '40': ['福岡'],
  '41': ['佐賀'],
  '42': ['長崎'],
  '43': ['熊本'],
  '44': ['大分'],
  '45': ['宮崎'],
  '46': ['鹿児島'],
  '47': ['沖縄'],
};