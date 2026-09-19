import React from 'react';
import { X, Dumbbell, Square, TrendingUp, Info } from 'lucide-react';
import { TempoTrainerSettings } from '../types/metronome';

interface TempoTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainerSettings: TempoTrainerSettings;
  onUpdateTrainerSettings: (settings: TempoTrainerSettings) => void;
  currentBpm: number;
  onSetBpm: (bpm: number) => void;
}

export const TempoTrainerModal: React.FC<TempoTrainerModalProps> = ({
  isOpen,
  onClose,
  trainerSettings,
  onUpdateTrainerSettings,
  currentBpm,
  onSetBpm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Tempo Speed Trainer</h2>
              <p className="text-xs text-slate-400">
                Gradually increase tempo to build muscle memory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Display */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-semibold">Current Tempo</span>
            <span className="text-3xl font-black font-mono text-sky-400">{currentBpm} BPM</span>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-semibold">Progress Target</span>
            <span className="text-xl font-bold font-mono text-slate-300">
              {trainerSettings.targetBpm} BPM
            </span>
          </div>
        </div>

        {/* Configuration inputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Start BPM
              </label>
              <input
                type="number"
                min="30"
                max="280"
                value={trainerSettings.startBpm}
                onChange={(e) =>
                  onUpdateTrainerSettings({
                    ...trainerSettings,
                    startBpm: parseInt(e.target.value, 10) || 60,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Target BPM
              </label>
              <input
                type="number"
                min="40"
                max="300"
                value={trainerSettings.targetBpm}
                onChange={(e) =>
                  onUpdateTrainerSettings({
                    ...trainerSettings,
                    targetBpm: parseInt(e.target.value, 10) || 120,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                BPM Increment
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={trainerSettings.incrementBpm}
                onChange={(e) =>
                  onUpdateTrainerSettings({
                    ...trainerSettings,
                    incrementBpm: parseInt(e.target.value, 10) || 2,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Every X Bars
              </label>
              <input
                type="number"
                min="1"
                max="32"
                value={trainerSettings.incrementEveryBars}
                onChange={(e) =>
                  onUpdateTrainerSettings({
                    ...trainerSettings,
                    incrementEveryBars: parseInt(e.target.value, 10) || 4,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-sky-950/40 border border-sky-900/60 rounded-xl text-xs text-sky-300">
          <Info className="w-4 h-4 shrink-0" />
          <span>
            When enabled, tempo will auto-increase by +{trainerSettings.incrementBpm} BPM every{' '}
            {trainerSettings.incrementEveryBars} completed measures until reaching{' '}
            {trainerSettings.targetBpm} BPM.
          </span>
        </div>

        {/* Action Toggle */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => onSetBpm(trainerSettings.startBpm)}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            Reset to Start BPM ({trainerSettings.startBpm})
          </button>

          <button
            onClick={() => {
              onUpdateTrainerSettings({
                ...trainerSettings,
                enabled: !trainerSettings.enabled,
              });
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition shadow-lg ${
              trainerSettings.enabled
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            {trainerSettings.enabled ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Disable Trainer</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                <span>Enable Trainer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
