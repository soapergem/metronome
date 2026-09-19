import React from 'react';
import { Volume2, VolumeX, Sliders, Music, Zap, Volume1 } from 'lucide-react';
import { SoundType, PulseTrackSettings, LayerSettings } from '../types/metronome';
import { SOUND_NAMES } from '../utils/rhythmConstants';

interface MixerLayersProps {
  pulseSettings: PulseTrackSettings;
  onUpdatePulseSettings: (settings: PulseTrackSettings) => void;
  rhythmSettings: LayerSettings;
  onUpdateRhythmSettings: (settings: LayerSettings) => void;
  masterVolume: number;
  onMasterVolumeChange: (vol: number) => void;
  onPreviewSound: (sound: SoundType, isAccented?: boolean) => void;
}

export const MixerLayers: React.FC<MixerLayersProps> = ({
  pulseSettings,
  onUpdatePulseSettings,
  rhythmSettings,
  onUpdateRhythmSettings,
  masterVolume,
  onMasterVolumeChange,
  onPreviewSound,
}) => {
  const sounds: SoundType[] = [
    'woodblock',
    'digital',
    'mechanical',
    'rimshot',
    'cowbell',
    'marimba',
    'hihat',
  ];

  const subdivisions: Array<{ value: '1' | '2' | '3' | '4' | '6'; label: string }> = [
    { value: '1', label: '1 (Quarter)' },
    { value: '2', label: '2 (8ths)' },
    { value: '3', label: '3 (Triplets)' },
    { value: '4', label: '4 (16ths)' },
    { value: '6', label: '6 (16th Triplets)' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Multi-Track Audio Mixer
          </h2>
        </div>

        {/* Master Volume */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-400">Master:</span>
          {masterVolume === 0 ? (
            <VolumeX className="w-4 h-4 text-slate-500" />
          ) : (
            <Volume2 className="w-4 h-4 text-sky-400" />
          )}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
            className="w-20 sm:w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
          <span className="text-xs font-mono text-slate-400 w-8">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Track 1: Pulse & Downbeat Track */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <span className="text-sm font-bold text-slate-200">
                Layer 1: Pulse & Metronome
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Mute Button */}
              <button
                onClick={() =>
                  onUpdatePulseSettings({ ...pulseSettings, muted: !pulseSettings.muted })
                }
                className={`px-2 py-1 text-xs font-bold rounded-md transition ${
                  pulseSettings.muted
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                MUTE
              </button>
              {/* Solo Button */}
              <button
                onClick={() =>
                  onUpdatePulseSettings({ ...pulseSettings, solo: !pulseSettings.solo })
                }
                className={`px-2 py-1 text-xs font-bold rounded-md transition ${
                  pulseSettings.solo
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                SOLO
              </button>
            </div>
          </div>

          {/* Sound picker & volume */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Sound Profile
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={pulseSettings.sound}
                  onChange={(e) => {
                    const sound = e.target.value as SoundType;
                    onUpdatePulseSettings({ ...pulseSettings, sound });
                    onPreviewSound(sound, true);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {sounds.map((s) => (
                    <option key={s} value={s}>
                      {SOUND_NAMES[s]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onPreviewSound(pulseSettings.sound, true)}
                  title="Test Sound"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  <Volume1 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 flex justify-between mb-1">
                <span>Volume</span>
                <span className="font-mono">{Math.round(pulseSettings.volume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={pulseSettings.volume}
                onChange={(e) =>
                  onUpdatePulseSettings({
                    ...pulseSettings,
                    volume: parseFloat(e.target.value),
                  })
                }
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>

          {/* Subdivision & Accent toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-400">Subdivision:</label>
              <select
                value={pulseSettings.subdivision}
                onChange={(e) =>
                  onUpdatePulseSettings({
                    ...pulseSettings,
                    subdivision: e.target.value as '1' | '2' | '3' | '4' | '6',
                  })
                }
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 font-mono focus:outline-none"
              >
                {subdivisions.map((sub) => (
                  <option key={sub.value} value={sub.value}>
                    {sub.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={pulseSettings.accentDownbeat}
                onChange={(e) =>
                  onUpdatePulseSettings({
                    ...pulseSettings,
                    accentDownbeat: e.target.checked,
                  })
                }
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 bg-slate-900"
              />
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Accent Beat 1
              </span>
            </label>
          </div>
        </div>

        {/* Track 2: Custom Rhythm Layer */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50" />
              <span className="text-sm font-bold text-slate-200">
                Layer 2: Custom Rhythm Track
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Mute Button */}
              <button
                onClick={() =>
                  onUpdateRhythmSettings({ ...rhythmSettings, muted: !rhythmSettings.muted })
                }
                className={`px-2 py-1 text-xs font-bold rounded-md transition ${
                  rhythmSettings.muted
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                MUTE
              </button>
              {/* Solo Button */}
              <button
                onClick={() =>
                  onUpdateRhythmSettings({ ...rhythmSettings, solo: !rhythmSettings.solo })
                }
                className={`px-2 py-1 text-xs font-bold rounded-md transition ${
                  rhythmSettings.solo
                    ? 'bg-sky-950/80 text-sky-300 border border-sky-800'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                SOLO
              </button>
            </div>
          </div>

          {/* Sound picker & volume */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Sound Profile
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={rhythmSettings.sound}
                  onChange={(e) => {
                    const sound = e.target.value as SoundType;
                    onUpdateRhythmSettings({ ...rhythmSettings, sound });
                    onPreviewSound(sound, true);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {sounds.map((s) => (
                    <option key={s} value={s}>
                      {SOUND_NAMES[s]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onPreviewSound(rhythmSettings.sound, true)}
                  title="Test Sound"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  <Volume1 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 flex justify-between mb-1">
                <span>Volume</span>
                <span className="font-mono">{Math.round(rhythmSettings.volume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={rhythmSettings.volume}
                onChange={(e) =>
                  onUpdateRhythmSettings({
                    ...rhythmSettings,
                    volume: parseFloat(e.target.value),
                  })
                }
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>
          </div>

          {/* Tip */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-sky-400" />
              Plays your custom drag-and-drop measure patterns simultaneously with Layer 1.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
