import { useState } from 'react';
import { JapanMap } from './components/JapanMap';
import { MemberPanel } from './components/MemberPanel';
import { Header } from './components/Header';
import { useSingleSeatMembers, useProportionalMembers } from './hooks/useMembers';

function App() {
  const [mode, setMode] = useState<'single-seat' | 'proportional'>('single-seat');
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  const { members, isLoading: loadingSingle, error: errorSingle } = useSingleSeatMembers();
  const { members: proportionalMembers, isLoading: loadingProp, error: errorProp } = useProportionalMembers();

  const isLoading = loadingSingle || loadingProp;
  const error = errorSingle || errorProp;
  const totalCount = members.length + proportionalMembers.length;

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
        <div className="text-cyan-400 text-xl">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
        <div className="text-red-400 text-xl">エラー: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900">
      <Header
        mode={mode}
        onModeChange={(newMode) => {
          setMode(newMode);
          setSelectedPrefecture(null);
          setSelectedBlock(null);
        }}
        totalCount={totalCount}
      />
      
      <div className="flex flex-1 min-h-0">
        {/* Map area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <JapanMap
            members={members}
            proportionalMembers={proportionalMembers}
            selectedPrefecture={selectedPrefecture}
            onSelectPrefecture={setSelectedPrefecture}
            selectedBlock={selectedBlock}
            onSelectBlock={setSelectedBlock}
            mode={mode}
          />
        </div>

        {/* Side panel */}
        <MemberPanel
          selectedPrefecture={selectedPrefecture}
          selectedBlock={selectedBlock}
          members={members}
          proportionalMembers={proportionalMembers}
          mode={mode}
        />
      </div>
    </div>
  );
}

export default App;