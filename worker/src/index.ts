/**
 * Lawmakers App Worker
 * Hono フレームワークを使用した API サーバー
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, AppVariables, NewsItem, NewsApiResponse } from './types';
import authRoutes from './routes/auth';
import { authMiddleware } from './middleware/auth';
import { fetchAllNews, getHouseNews, filterByCategory, filterByMember, fetchOgImage } from './rss-fetcher';

// ============================================
// Hono App Setup
// ============================================

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// ============================================
// CORS Middleware
// ============================================

app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: [c.env.APP_ORIGIN, 'http://localhost:5173', 'http://localhost:8787'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Cookie'],
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// ============================================
// Mount Routes
// ============================================

// Auth routes (no authentication required)
app.route('/api', authRoutes);

// ============================================
// News Routes (Authentication Required)
// ============================================

// In-memory cache for news
let cachedNews: NewsItem[] = [];
let lastFetched: Date | null = null;
const CACHE_TTL = 60 * 1000; // 1 minute cache

// Get cached or fresh news
async function getNews(forceRefresh = false): Promise<NewsItem[]> {
  const now = Date.now();
  
  if (!forceRefresh && cachedNews.length > 0 && lastFetched) {
    const elapsed = now - lastFetched.getTime();
    if (elapsed < CACHE_TTL) {
      return cachedNews;
    }
  }
  
  try {
    const news = await fetchAllNews();
    cachedNews = news;
    lastFetched = new Date();
    return news;
  } catch (error) {
    console.error('Error fetching news:', error);
    return cachedNews.length > 0 ? cachedNews : [];
  }
}

// GET /api/news - Get all house-related news (authentication required)
app.get('/api/news', authMiddleware, async (c) => {
  const category = c.req.query('category') as NewsItem['category'] | null;
  const member = c.req.query('member');
  const all = c.req.query('all') === 'true';
  
  let news = await getNews();
  
  // Filter by house-related if not requesting all
  if (!all) {
    news = getHouseNews(news);
  }
  
  // Filter by category
  if (category && ['election', 'diet', 'member', 'politics', 'other'].includes(category)) {
    news = filterByCategory(news, category);
  }
  
  // Filter by member name
  if (member) {
    news = filterByMember(news, member);
  }
  
  const response: NewsApiResponse = {
    news,
    fetchedAt: lastFetched?.toISOString() ?? new Date().toISOString(),
  };
  
  return c.json(response);
});

// GET /api/health - Health check (no authentication required)
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    lastFetched: lastFetched?.toISOString() ?? null,
    cachedCount: cachedNews.length,
  });
});

// POST /api/refresh - Force refresh cache (authentication required)
app.post('/api/refresh', authMiddleware, async (c) => {
  await getNews(true);
  
  return c.json({
    status: 'refreshed',
    lastFetched: lastFetched?.toISOString() ?? null,
  });
});

// GET /api/ogp - Fetch OGP image for a URL (authentication required)
app.get('/api/ogp', authMiddleware, async (c) => {
  const targetUrl = c.req.query('url');
  
  if (!targetUrl) {
    return c.json({ error: 'Missing url parameter', code: 'MISSING_URL' }, 400);
  }

  const ogImageUrl = await fetchOgImage(targetUrl);
  
  return c.json({ url: ogImageUrl });
});

// ============================================
// 404 Handler
// ============================================

app.notFound((c) => {
  return c.json({ error: 'Not Found', code: 'NOT_FOUND' }, 404);
});

// ============================================
// Error Handler
// ============================================

app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal Server Error', code: 'SERVER_ERROR' }, 500);
});

// ============================================
// Export
// ============================================

export default app;