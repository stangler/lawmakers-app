import { useState, useEffect } from 'react';
import type { NewsItem } from '../types/news';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types/news';

interface MapNewsCardProps {
  item: NewsItem;
  isSelected?: boolean;
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

// Prefecture name mapping
const PREFECTURE_NAMES: Record<string, string> = {
  '01': '北海道', '02': '青森', '03': '岩手', '04': '宮城', '05': '秋田',
  '06': '山形', '07': '福島', '08': '茨城', '09': '栃木', '10': '群馬',
  '11': '埼玉', '12': '千葉', '13': '東京', '14': '神奈川', '15': '新潟',
  '16': '富山', '17': '石川', '18': '福井', '19': '山梨', '20': '長野',
  '21': '岐阜', '22': '静岡', '23': '愛知', '24': '三重', '25': '滋賀',
  '26': '京都', '27': '大阪', '28': '兵庫', '29': '奈良', '30': '和歌山',
  '31': '鳥取', '32': '島根', '33': '岡山', '34': '広島', '35': '山口',
  '36': '徳島', '37': '香川', '38': '愛媛', '39': '高知', '40': '福岡',
  '41': '佐賀', '42': '長崎', '43': '熊本', '44': '大分', '45': '宮崎',
  '46': '鹿児島', '47': '沖縄',
};

// API URL for OGP fetching
// In production, use relative path (same origin), in dev use empty string (same origin)
const API_URL = import.meta.env.VITE_WORKER_URL || '';

export function MapNewsCard({ item, isSelected }: MapNewsCardProps) {
  const [ogImageUrl, setOgImageUrl] = useState<string | null>(item.ogImageUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const accentColor = CATEGORY_COLORS[item.category];
  const categoryLabel = CATEGORY_LABELS[item.category];

  // Fetch OGP image on mount if not already available
  useEffect(() => {
    if (item.ogImageUrl) {
      setOgImageUrl(item.ogImageUrl);
      return;
    }

    const fetchOgImage = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/ogp?url=${encodeURIComponent(item.link)}`);
        const data = await res.json();
        if (data.url) {
          setOgImageUrl(data.url);
        } else {
          setImageError(true);
        }
      } catch (error) {
        console.error('Failed to fetch OGP image:', error);
        setImageError(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Delay to avoid too many requests on initial load
    const timer = setTimeout(fetchOgImage, 1000 + Math.random() * 2000);
    return () => clearTimeout(timer);
  }, [item.link, item.ogImageUrl]);

  const prefectureNames = (item.prefectureCodes || [])
    .filter(code => PREFECTURE_NAMES[code])
    .map(code => PREFECTURE_NAMES[code])
    .slice(0, 2);

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        block w-64 bg-slate-900/90 backdrop-blur-sm rounded-lg overflow-hidden
        transition-all duration-300 cursor-pointer group
        ${isSelected 
          ? 'ring-2 shadow-[0_0_20px_rgba(6,182,212,0.5)]' 
          : 'hover:ring-1 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]'
        }
      `}
      style={{
        borderColor: isSelected ? accentColor : `${accentColor}40`,
        boxShadow: isSelected ? `0 0 20px ${accentColor}40` : 'none',
      }}
    >
      {/* Glow border top */}
      <div 
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          boxShadow: `0 0 10px ${accentColor}`,
        }}
      />

      {/* OGP Image */}
      <div className="relative h-32 bg-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : ogImageUrl && !imageError ? (
          <img
            src={ogImageUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
            <svg className="w-10 h-10 text-cyan-500/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
        )}
        
        {/* Category badge overlay */}
        <div className="absolute top-2 left-2">
          <span
            className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold backdrop-blur-sm"
            style={{
              color: accentColor,
              border: `1px solid ${accentColor}`,
              backgroundColor: 'rgba(0,0,0,0.6)',
              textShadow: `0 0 10px ${accentColor}`,
            }}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Click hint */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] px-2 py-1 rounded bg-black/60 text-white/80 backdrop-blur-sm">
            →
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title with glow effect */}
        <h3
          className="text-sm text-white font-medium leading-snug mb-2"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textShadow: '0 0 10px rgba(255,255,255,0.3)',
          }}
        >
          {item.title}
        </h3>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">{timeAgo(item.publishedAt)}</span>
          
          {prefectureNames.length > 0 && (
            <div className="flex gap-1">
              {prefectureNames.map((name) => (
                <span
                  key={name}
                  className="px-1.5 py-0.5 rounded text-[10px]"
                  style={{
                    backgroundColor: 'rgba(255, 0, 255, 0.2)',
                    color: '#ff00ff',
                    border: '1px solid rgba(255, 0, 255, 0.3)',
                    textShadow: '0 0 5px #ff00ff',
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Decorative corner elements */}
      <div 
        className="absolute top-0 right-0 w-3 h-3"
        style={{
          borderTop: `2px solid ${accentColor}`,
          borderRight: `2px solid ${accentColor}`,
          boxShadow: `2px -2px 8px ${accentColor}40`,
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-3 h-3"
        style={{
          borderBottom: `2px solid ${accentColor}`,
          borderLeft: `2px solid ${accentColor}`,
          boxShadow: `-2px 2px 8px ${accentColor}40`,
        }}
      />
    </a>
  );
}
