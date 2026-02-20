import type { SingleSeatMember, ProportionalMember } from '../types/member';
import { PARTY_COLORS } from '../lib/parseMembers';

interface MemberCardProps {
  member: SingleSeatMember | ProportionalMember;
  showDistrict?: boolean;
}

export function MemberCard({ member, showDistrict = true }: MemberCardProps) {
  const partyColor = PARTY_COLORS[member.party] || '#808080';
  const isSingleSeat = 'district' in member;

  return (
    <div className="bg-slate-800/60 border border-cyan-500/30 rounded-lg p-3 hover:bg-slate-700/60 transition-colors">
      <div className="flex items-start gap-3">
        {/* Party color indicator */}
        <div
          className="w-2 h-16 rounded-full flex-shrink-0"
          style={{ backgroundColor: partyColor }}
        />
        
        <div className="flex-1 min-w-0">
          {/* Name & Party */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: partyColor + '40', color: partyColor }}
            >
              {member.party}
            </span>
            {member.status === '新' && (
              <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                初当選
              </span>
            )}
          </div>
          
          <h3 className="text-white font-bold text-lg truncate">{member.name}</h3>
          <p className="text-gray-400 text-xs mb-1">{member.kana}</p>
          
          {/* Info */}
          <div className="flex flex-wrap gap-2 text-xs text-gray-300">
            <span>{member.age}歳</span>
            <span>•</span>
            <span>{member.terms}回</span>
            {showDistrict && isSingleSeat && (
              <>
                <span>•</span>
                <span>{(member as SingleSeatMember).district}</span>
              </>
            )}
            {showDistrict && !isSingleSeat && member.originDistrict && (
              <>
                <span>•</span>
                <span>{member.originDistrict}</span>
              </>
            )}
          </div>
          
          {/* Background */}
          <p className="text-gray-400 text-xs mt-1 truncate">{member.background}</p>
        </div>
      </div>
    </div>
  );
}