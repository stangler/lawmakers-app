import { XMLParser } from 'fast-xml-parser';
import type { NewsItem } from './types';
import { RSS_FEEDS, CATEGORY_KEYWORDS, PREFECTURE_KEYWORDS } from './types';

// Hash function for generating unique IDs
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// Extract text from CDATA or string
function extractText(value: string | { __cdata?: string } | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value.__cdata) return value.__cdata;
  return '';
}

// Classify news category based on title
function classifyCategory(title: string): NewsItem['category'] {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (title.includes(keyword)) {
        return category as NewsItem['category'];
      }
    }
  }
  return 'other';
}

// Detect member names in title (simple keyword matching)
function detectMemberNames(title: string): string[] {
  const found: string[] = [];
  // Common politician names to check
  const knownPoliticians = [
    '岸田', '石破', 'コラー', '茂木', '松本', '猪口', '棚橋', '福田',
    '麻生', '河野', '林', '齊藤', '宮沢', '鈴木', '塩谷', '西村',
    '加藤', '佐藤', '田中', '鈴木', '高橋', '渡辺', '伊藤', '山本',
  ];
  
  for (const name of knownPoliticians) {
    if (title.includes(name)) {
      found.push(name);
    }
  }
  return found;
}

interface RssItem {
  title?: string | { __cdata?: string };
  link?: string;
  pubDate?: string;
  'dc:date'?: string;
  description?: string | { __cdata?: string };
}

// Fetch and parse RSS from a single URL
async function fetchRssFeed(url: string): Promise<NewsItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'lawmakers-app/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      cdataPropName: '__cdata',
    });
    
    const parsed = parser.parse(xml);
    const items: RssItem[] = parsed?.rss?.channel?.item ?? [];
    const itemList = Array.isArray(items) ? items : [items];

    return itemList.map((item): NewsItem => {
      const title = extractText(item.title);
      const link = typeof item.link === 'string' ? item.link : '';
      const publishedAt = item.pubDate ?? item['dc:date'] ?? new Date().toISOString();

      return {
        id: hashString(link),
        title,
        link,
        source: 'nhk',
        publishedAt: new Date(publishedAt).toISOString(),
        category: classifyCategory(title),
        memberNames: detectMemberNames(title),
      };
    }).filter(item => item.title && item.link);
  } catch (error) {
    console.error(`Error fetching RSS from ${url}:`, error);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// Main function to fetch all RSS feeds and combine results
export async function fetchAllNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(url => fetchRssFeed(url))
  );

  const allNews: NewsItem[] = [];
  const seenIds = new Set<string>();

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    
    for (const item of result.value) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        allNews.push(item);
      }
    }
  }

  // Sort by published date (newest first)
  allNews.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return allNews;
}

// Filter news by category
export function filterByCategory(news: NewsItem[], category: NewsItem['category']): NewsItem[] {
  if (category === 'other') {
    return news.filter(item => 
      item.category === 'other' || 
      !Object.keys(CATEGORY_KEYWORDS).includes(item.category)
    );
  }
  return news.filter(item => item.category === category);
}

// Filter news by member name
export function filterByMember(news: NewsItem[], memberName: string): NewsItem[] {
  return news.filter(item => 
    item.memberNames.some(name => name.includes(memberName)) ||
    item.title.includes(memberName)
  );
}

// Get house-related news (election, diet, politics)
export function getHouseNews(news: NewsItem[]): NewsItem[] {
  return news.filter(item => 
    ['election', 'diet', 'politics', 'member'].includes(item.category)
  );
}
