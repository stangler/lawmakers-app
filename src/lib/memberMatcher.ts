import type { SingleSeatMember, ProportionalMember } from '../types/member';
import type { NewsItem } from '../types/news';

// Extract name variations for matching
export function getNameVariations(member: SingleSeatMember | ProportionalMember): string[] {
  const variations: string[] = [];
  
  // Full name (e.g., "加藤 貴弘")
  variations.push(member.name);
  
  // Name without space (e.g., "加藤貴弘")
  variations.push(member.name.replace(/\s+/g, ''));
  
  // Last name only
  const nameParts = member.name.split(/\s+/);
  if (nameParts.length > 0) {
    variations.push(nameParts[0]);
  }
  
  // Kana variations
  if (member.kana) {
    variations.push(member.kana);
    variations.push(member.kana.replace(/\s+/g, ''));
  }
  
  return [...new Set(variations)];
}

// Match news items to a member
export function matchNewsForMember(
  news: NewsItem[],
  member: SingleSeatMember | ProportionalMember
): NewsItem[] {
  const variations = getNameVariations(member);
  
  return news.filter(item => {
    // Check if any variation is in the title
    for (const variation of variations) {
      if (item.title.includes(variation)) {
        return true;
      }
    }
    
    // Check member names from the news item
    for (const newsMemberName of item.memberNames) {
      for (const variation of variations) {
        if (newsMemberName.includes(variation) || variation.includes(newsMemberName)) {
          return true;
        }
      }
    }
    
    return false;
  });
}

// Match news items to multiple members
export function matchNewsForMembers(
  news: NewsItem[],
  members: (SingleSeatMember | ProportionalMember)[]
): Map<string, NewsItem[]> {
  const result = new Map<string, NewsItem[]>();
  
  for (const member of members) {
    const matchedNews = matchNewsForMember(news, member);
    if (matchedNews.length > 0) {
      result.set(member.name, matchedNews);
    }
  }
  
  return result;
}

// Get all unique member names from news
export function getMemberNamesFromNews(news: NewsItem[]): string[] {
  const names = new Set<string>();
  
  for (const item of news) {
    for (const name of item.memberNames) {
      names.add(name);
    }
  }
  
  return Array.from(names);
}
