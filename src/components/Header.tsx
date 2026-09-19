import React from 'react';
import { Activity, Dumbbell, Keyboard, RotateCcw, Sparkles } from 'lucide-react';
import { PRESETS } from '../presets/metronomePresets';
import { Preset } from '../types/metronome';

interface HeaderProps {
  onSelectPreset: (preset: Preset) => void;
  onOpenTrainer: () => void;
  onOpenShortcuts: () => void;
  onResetToDefault: () => void;
  isPlaying: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectPreset,
  onOpenTrainer,
  onOpenShortcuts,
  onResetToDefault,
  isPlaying,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 shadow-lg shadow-indigo-500/20 text-white font-bold">
            <Activity className={`w-6 h-6 ${isPlaying ? 'animate-pulse' : ''}`} />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping" />
            )}
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              PolyRhythm <span className="text-sky-400 font-semibold text-xs sm:text-sm px-2 py-0.5 rounded-full bg-sky-950/80 border border-sky-800">Pro</span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              Precision Metronome & Visual Layered Rhythm Editor
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Preset Selector */}
          <div className="relative group">
            <button className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Presets & Exercises</span>
              <span className="md:hidden">Presets</span>
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                Preset Rhythms & Studies
              </div>
              <div className="max-h-80 overflow-y-auto space-y-1 py-1">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectPreset(p)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 transition flex flex-col gap-0.5 group/item"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-200 group-hover/item:text-sky-400">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                        {p.bpm} BPM
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 line-clamp-1">
                      {p.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Speed Trainer Modal Button */}
          <button
            onClick={onOpenTrainer}
            title="Tempo Trainer (Speed Builder)"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Dumbbell className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline">Tempo Trainer</span>
          </button>

          {/* Shortcuts Button */}
          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Reset Button */}
          <button
            onClick={onResetToDefault}
            title="Reset to Default 4/4 with 16th Triplets"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
