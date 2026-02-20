/**
 * lawmakers-app Worker
 * Provides API for fetching House of Representatives related news from NHK RSS
 */

import { fetchAllNews, getHouseNews, filterByCategory, filterByMember } from './rss-fetcher';
import type { NewsItem, NewsApiResponse } from './types';

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
    // Return cached data if available, otherwise return empty array
    return cachedNews.length > 0 ? cachedNews : [];
  }
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }
    
    // Route: /api/news - Get all house-related news
    if (pathname === '/api/news' || pathname === '/api/news/') {
      const category = url.searchParams.get('category') as NewsItem['category'] | null;
      const member = url.searchParams.get('member');
      const all = url.searchParams.get('all') === 'true';
      
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
      
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
    
    // Route: /api/health - Health check
    if (pathname === '/api/health' || pathname === '/api/health/') {
      return new Response(JSON.stringify({
        status: 'ok',
        lastFetched: lastFetched?.toISOString() ?? null,
        cachedCount: cachedNews.length,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
    
    // Route: /api/refresh - Force refresh cache
    if (pathname === '/api/refresh' || pathname === '/api/refresh/') {
      await getNews(true);
      
      return new Response(JSON.stringify({
        status: 'refreshed',
        lastFetched: lastFetched?.toISOString() ?? null,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
    
    // Default: 404
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  },
} satisfies ExportedHandler<Env>;
