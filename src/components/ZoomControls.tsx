interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function ZoomControls({ onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2">
      <button
        onClick={onZoomIn}
        className="w-10 h-10 bg-cyan-900/80 border border-cyan-500/50 rounded-lg text-cyan-400 hover:bg-cyan-800/80 transition-colors flex items-center justify-center"
        title="ズームイン"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
        </svg>
      </button>
      <button
        onClick={onZoomOut}
        className="w-10 h-10 bg-cyan-900/80 border border-cyan-500/50 rounded-lg text-cyan-400 hover:bg-cyan-800/80 transition-colors flex items-center justify-center"
        title="ズームアウト"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12" />
        </svg>
      </button>
      <button
        onClick={onReset}
        className="w-10 h-10 bg-cyan-900/80 border border-cyan-500/50 rounded-lg text-cyan-400 hover:bg-cyan-800/80 transition-colors flex items-center justify-center text-xs font-bold"
        title="リセット"
      >
        リセット
      </button>
    </div>
  );
}