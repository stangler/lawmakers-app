import type { NewsItem } from '../types/news';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types/news';

interface NewsCardProps {
  item: NewsItem;
}

// Format time ago
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

export function NewsCard({ item }: NewsCardProps) {
  const accentColor = CATEGORY_COLORS[item.category];
  const categoryLabel = CATEGORY_LABELS[item.category];

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-slate-800/60 border border-cyan-500/30 rounded-lg p-3 hover:bg-slate-700/60 transition-colors"
    >
      {/* Category label */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold"
          style={{
            color: accentColor,
            border: `1px solid ${accentColor}40`,
            backgroundColor: `${accentColor}10`,
          }}
        >
          {categoryLabel}
        </span>
        {item.memberNames.length > 0 && (
          <div className="flex gap-1">
            {item.memberNames.slice(0, 2).map((name) => (
              <span
                key={name}
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: 'rgba(255, 0, 255, 0.2)',
                  color: '#ff00ff',
                }}
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Title */}
      <h3
        className="text-sm text-white font-medium leading-snug mb-2"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {item.title}
      </h3>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="uppercase">NHK</span>
        <span>{timeAgo(item.publishedAt)}</span>
      </div>
    </a>
  );
}
