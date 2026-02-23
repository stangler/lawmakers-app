import { useState, useEffect, useCallback, useMemo } from 'react';
import type { NewsItem, NewsApiResponse } from '../types/news';

// Worker API URL - configurable via environment variable
// In production, use relative path (same origin), in dev use localhost
const API_URL = import.meta.env.VITE_WORKER_URL || '';
const POLL_INTERVAL = 60_000; // 1 minute
const MAX_RETRIES = 3;

interface UseNewsDataResult {
  news: NewsItem[];
  filteredNews: NewsItem[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  filterByCategory: (category: NewsItem['category'] | null) => void;
  filterByMember: (memberName: string | null) => void;
  selectedCategory: NewsItem['category'] | null;
  selectedMember: string | null;
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<NewsApiResponse> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        credentials: 'include', // Cookie を送信（認証用）
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: NewsApiResponse = await res.json();
      return data;
    } catch (error) {
      if (attempt === retries - 1) throw error;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
  }
  throw new Error('Failed to fetch news');
}

export function useNewsData(): UseNewsDataResult {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<NewsItem['category'] | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const fetchNews = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const data = await fetchWithRetry(`${API_URL}/api/news`);
      setNews(data.news);
      setLastUpdated(new Date(data.fetchedAt));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchNews();
    const interval = setInterval(() => fetchNews(false), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNews]);

  // Filter news based on selected category and member
  const filteredNews = useMemo(() => {
    let result = news;

    if (selectedCategory) {
      result = result.filter(item => item.category === selectedCategory);
    }

    if (selectedMember) {
      result = result.filter(item => 
        item.memberNames.some(name => name.includes(selectedMember)) ||
        item.title.includes(selectedMember)
      );
    }

    return result;
  }, [news, selectedCategory, selectedMember]);

  const filterByCategory = useCallback((category: NewsItem['category'] | null) => {
    setSelectedCategory(category);
  }, []);

  const filterByMember = useCallback((memberName: string | null) => {
    setSelectedMember(memberName);
  }, []);

  const refresh = useCallback(async () => {
    await fetchNews();
  }, [fetchNews]);

  return {
    news,
    filteredNews,
    isLoading,
    error,
    lastUpdated,
    refresh,
    filterByCategory,
    filterByMember,
    selectedCategory,
    selectedMember,
  };
}
