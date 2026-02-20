import { useState, useEffect, useMemo } from 'react';
import type { SingleSeatMember, ProportionalMember } from '../types/member';
import { parseSingleSeatMarkdown, parseProportionalMarkdown } from '../lib/parseMembers';

// 小選挙区データを読み込む
export function useSingleSeatMembers() {
  const [members, setMembers] = useState<SingleSeatMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch('/data/singler-seat.md')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load single-seat data');
        return res.text();
      })
      .then((markdown) => {
        const parsed = parseSingleSeatMarkdown(markdown);
        setMembers(parsed);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, []);

  return { members, isLoading, error };
}

// 比例代表データを読み込む
export function useProportionalMembers() {
  const [members, setMembers] = useState<ProportionalMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch('/data/proportional.md')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load proportional data');
        return res.text();
      })
      .then((markdown) => {
        const parsed = parseProportionalMarkdown(markdown);
        setMembers(parsed);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, []);

  return { members, isLoading, error };
}

// 都道府県コードでグループ化
export function useMembersByPrefecture(members: SingleSeatMember[]) {
  return useMemo(() => {
    const map = new Map<string, SingleSeatMember[]>();
    for (const member of members) {
      const existing = map.get(member.prefectureCode) || [];
      map.set(member.prefectureCode, [...existing, member]);
    }
    return map;
  }, [members]);
}

// ブロックでグループ化
export function useMembersByBlock(members: ProportionalMember[]) {
  return useMemo(() => {
    const map = new Map<string, ProportionalMember[]>();
    for (const member of members) {
      const existing = map.get(member.block) || [];
      map.set(member.block, [...existing, member]);
    }
    return map;
  }, [members]);
}