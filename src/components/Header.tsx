import { PARTY_COLORS } from '../lib/parseMembers';

interface HeaderProps {
  mode: 'single-seat' | 'proportional';
  onModeChange: (mode: 'single-seat' | 'proportional') => void;
  totalCount: number;
}

export function Header({ mode, onModeChange, totalCount }: HeaderProps) {
  return (
    <header className="bg-slate-900/90 border-b border-cyan-500/30 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-cyan-400">
            衆議院議員マップ
          </h1>
          <span className="text-gray-400 text-sm">
            全{totalCount}名
          </span>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onModeChange('single-seat')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'single-seat'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'bg-slate-800 text-gray-400 hover:text-gray-300'
            }`}
          >
            小選挙区
          </button>
          <button
            onClick={() => onModeChange('proportional')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'proportional'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'bg-slate-800 text-gray-400 hover:text-gray-300'
            }`}
          >
            比例代表
          </button>
        </div>
      </div>
      
      {/* Party Legend */}
      <div className="flex items-center gap-3 mt-3 text-xs">
        <span className="text-gray-400">政党:</span>
        {Object.entries(PARTY_COLORS).slice(0, 6).map(([party, color]) => (
          <div key={party} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: color }}
            />
            <span className="text-gray-300">{party}</span>
          </div>
        ))}
      </div>
    </header>
  );
}