import type { NewsItem } from '../types/news';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types/news';
import { NewsCard } from './NewsCard';

interface NewsPanelProps {
  news: NewsItem[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  selectedCategory: NewsItem['category'] | null;
  onCategoryChange: (category: NewsItem['category'] | null) => void;
  onRefresh: () => void;
}

const CATEGORIES: NewsItem['category'][] = ['election', 'diet', 'member', 'politics'];

// Loading skeleton component
function NewsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-slate-800/60 border border-cyan-500/30 rounded-lg p-3 skeleton"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-12 h-4 rounded skeleton" />
            <div className="w-16 h-4 rounded skeleton" />
          </div>
          <div className="h-4 w-full rounded skeleton mb-2" />
          <div className="h-4 w-3/4 rounded skeleton" />
        </div>
      ))}
    </div>
  );
}

export function NewsPanel({
  news,
  isLoading,
  error,
  lastUpdated,
  selectedCategory,
  onCategoryChange,
  onRefresh,
}: NewsPanelProps) {
  // Format last updated time
  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間前`;
    return date.toLocaleDateString('ja-JP');
  };

  return (
    <div className="w-80 bg-slate-900/80 border-l border-cyan-500/30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-cyan-400 font-bold text-lg">衆院ニュース</h2>
            <span className="text-xs text-gray-500 bg-slate-800 px-2 py-0.5 rounded-full">
              NHK
            </span>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 disabled:opacity-50 transition-all flex items-center gap-1"
          >
            <svg
              className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading ? '更新中' : '更新'}
          </button>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onCategoryChange(null)}
            className={`text-xs px-2.5 py-1.5 rounded transition-all ${
              selectedCategory === null
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            すべて
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`text-xs px-2.5 py-1.5 rounded transition-all ${
                selectedCategory === cat
                  ? 'text-white border shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700'
              }`}
              style={selectedCategory === cat ? {
                backgroundColor: `${CATEGORY_COLORS[cat]}20`,
                borderColor: `${CATEGORY_COLORS[cat]}50`,
                color: CATEGORY_COLORS[cat],
              } : {}}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Last updated */}
      {lastUpdated && (
        <div className="px-4 py-2 text-xs text-gray-500 border-b border-cyan-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
          最終更新: {formatLastUpdated(lastUpdated)}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 m-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="text-red-400 text-sm font-medium mb-1">エラー</div>
          <div className="text-red-300/70 text-xs">{error}</div>
          <button
            onClick={onRefresh}
            className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
          >
            再試行
          </button>
        </div>
      )}

      {/* Loading state with skeleton */}
      {isLoading && news.length === 0 && (
        <div className="flex-1 overflow-y-auto p-3">
          <NewsSkeleton />
        </div>
      )}

      {/* News list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {news.length === 0 && !isLoading && !error ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3 opacity-50">📰</div>
            <div className="text-sm mb-1">ニュースがありません</div>
            <div className="text-xs text-gray-500">
              しばらくお待ちください
            </div>
          </div>
        ) : (
          news.map((item) => (
            <div key={item.id} className="news-card">
              <NewsCard item={item} />
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-cyan-500/20 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {news.length}件のニュース
        </span>
        {isLoading && news.length > 0 && (
          <span className="text-xs text-cyan-400/70 animate-pulse">
            更新中...
          </span>
        )}
      </div>
    </div>
  );
}
