import type { SingleSeatMember, ProportionalMember } from '../types/member';
import { MemberCard } from './MemberCard';
import { PREFECTURE_MAP } from '../lib/prefectures';

interface MemberPanelProps {
  selectedPrefecture: string | null;
  selectedBlock: string | null;
  members: SingleSeatMember[];
  proportionalMembers: ProportionalMember[];
  mode: 'single-seat' | 'proportional';
}

export function MemberPanel({
  selectedPrefecture,
  selectedBlock,
  members,
  proportionalMembers,
  mode,
}: MemberPanelProps) {
  // Filter members based on selection
  const singleSeatMembers = mode === 'single-seat'
    ? members.filter((m) => m.prefectureCode === selectedPrefecture)
    : [];
  
  const propMembers = mode === 'proportional'
    ? proportionalMembers.filter((m) => m.block === selectedBlock)
    : [];

  // Get title
  const title = mode === 'single-seat' && selectedPrefecture
    ? PREFECTURE_MAP.get(selectedPrefecture)?.name || ''
    : mode === 'proportional' && selectedBlock
    ? selectedBlock
    : '';

  // Group by party for single-seat mode
  const singleSeatByParty = singleSeatMembers.reduce((acc, member) => {
    const party = member.party;
    if (!acc[party]) acc[party] = [];
    acc[party].push(member);
    return acc;
  }, {} as Record<string, SingleSeatMember[]>);

  // Group by party for proportional mode
  const propByParty = propMembers.reduce((acc, member) => {
    const party = member.party;
    if (!acc[party]) acc[party] = [];
    acc[party].push(member);
    return acc;
  }, {} as Record<string, ProportionalMember[]>);

  const totalCount = singleSeatMembers.length + propMembers.length;

  if (!selectedPrefecture && !selectedBlock) {
    return (
      <div className="w-80 bg-slate-900/80 border-l border-cyan-500/30 p-4 flex flex-col">
        <h2 className="text-cyan-400 font-bold text-lg mb-4">議員一覧</h2>
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          地図上の都道府県または<br />ブロックを選択してください
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-slate-900/80 border-l border-cyan-500/30 p-4 flex flex-col overflow-hidden">
      <h2 className="text-cyan-400 font-bold text-lg mb-2">{title}</h2>
      <p className="text-gray-400 text-sm mb-4">
        {totalCount}名の議員
      </p>
      
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Single-seat mode */}
        {mode === 'single-seat' && Object.entries(singleSeatByParty).map(([party, partyMembers]) => (
          <div key={party}>
            <h3 className="text-gray-300 text-sm font-semibold mb-2 flex items-center gap-2">
              <span>{party}</span>
              <span className="text-gray-500">({partyMembers.length}名)</span>
            </h3>
            <div className="space-y-2">
              {partyMembers.map((member, index) => (
                <MemberCard
                  key={`${member.name}-${index}`}
                  member={member}
                  showDistrict={true}
                />
              ))}
            </div>
          </div>
        ))}
        
        {/* Proportional mode */}
        {mode === 'proportional' && Object.entries(propByParty).map(([party, partyMembers]) => (
          <div key={party}>
            <h3 className="text-gray-300 text-sm font-semibold mb-2 flex items-center gap-2">
              <span>{party}</span>
              <span className="text-gray-500">({partyMembers.length}名)</span>
            </h3>
            <div className="space-y-2">
              {partyMembers.map((member, index) => (
                <MemberCard
                  key={`${member.name}-${index}`}
                  member={member}
                  showDistrict={false}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}