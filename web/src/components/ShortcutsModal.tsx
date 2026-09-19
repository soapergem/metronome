import React from 'react';
import { X, Keyboard, Zap } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const SHORTCUTS = [
    { key: 'Spacebar', action: 'Start / Stop Playback' },
    { key: '↑ / ↓', action: 'Increase / Decrease BPM by 1' },
    { key: 'Shift + ↑ / ↓', action: 'Increase / Decrease BPM by 5' },
    { key: 'T', action: 'Tap Tempo' },
    { key: '1, 2, 3, 4', action: 'Select Beat 1, 2, 3, or 4 in editor' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-5 relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-800 text-sky-400 border border-slate-700">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Keyboard Shortcuts</h2>
              <p className="text-xs text-slate-400">Quick controls for seamless practice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800"
            >
              <span className="text-xs text-slate-300 font-medium">{s.action}</span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-bold text-sky-300 bg-slate-800 rounded-lg border border-slate-700 shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3 bg-indigo-950/40 border border-indigo-900/60 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
          <Zap className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Tip: You can drag and drop note tokens directly from the palette to any beat!
          </span>
        </div>
      </div>
    </div>
  );
};
