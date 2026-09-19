import React, { useRef } from 'react';
import { Play, Square, Minus, Plus, HeartPulse, Music } from 'lucide-react';
import { getTempoMarking } from '../utils/rhythmConstants';

interface TempoSectionProps {
  bpm: number;
  onBpmChange: (newBpm: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  timeSignatureNumerator: number;
  timeSignatureDenominator: number;
  onTimeSignatureChange: (num: number, den: number) => void;
}

export const TempoSection: React.FC<TempoSectionProps> = ({
  bpm,
  onBpmChange,
  isPlaying,
  onTogglePlay,
  timeSignatureNumerator,
  timeSignatureDenominator,
  onTimeSignatureChange,
}) => {
  const tapTimesRef = useRef<number[]>([]);

  const handleTapTempo = () => {
    const now = performance.now();
    const taps = tapTimesRef.current;

    // Reset if last tap was more than 2.5 seconds ago
    if (taps.length > 0 && now - taps[taps.length - 1] > 2500) {
      tapTimesRef.current = [];
    }

    tapTimesRef.current.push(now);

    // Keep only last 5 taps
    if (tapTimesRef.current.length > 5) {
      tapTimesRef.current.shift();
    }

    if (tapTimesRef.current.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 20 && calculatedBpm <= 300) {
        onBpmChange(calculatedBpm);
      }
    }
  };

  const adjustBpm = (delta: number) => {
    onBpmChange(Math.max(20, Math.min(300, bpm + delta)));
  };

  const tempoMarking = getTempoMarking(bpm);

  const TIME_SIGNATURE_PRESETS = [
    { num: 4, den: 4, label: '4/4' },
    { num: 3, den: 4, label: '3/4' },
    { num: 2, den: 4, label: '2/4' },
    { num: 6, den: 8, label: '6/8' },
    { num: 5, den: 4, label: '5/4' },
    { num: 7, den: 8, label: '7/8' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: BPM & Play button */}
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
          {/* Main Play / Stop Button */}
          <button
            onClick={onTogglePlay}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 transform active:scale-95 shadow-xl ${
              isPlaying
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
                : 'bg-gradient-to-tr from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-indigo-500/30 ring-4 ring-indigo-500/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-8 h-8 fill-current mb-1" />
                <span className="text-[10px] font-bold tracking-wider uppercase">STOP</span>
              </>
            ) : (
              <>
                <Play className="w-9 h-9 fill-current ml-1 mb-0.5" />
                <span className="text-[10px] font-bold tracking-wider uppercase">START</span>
              </>
            )}
          </button>

          {/* BPM Display and Adjusters */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white">
                {bpm}
              </span>
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                BPM
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/80 border border-indigo-700/60 text-indigo-300">
                {tempoMarking}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {timeSignatureNumerator}/{timeSignatureDenominator} Time
              </span>
            </div>

            {/* Stepper buttons */}
            <div className="flex items-center gap-1.5 mt-3">
              <button
                onClick={() => adjustBpm(-5)}
                className="px-2.5 py-1 text-xs font-bold font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                -5
              </button>
              <button
                onClick={() => adjustBpm(-1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => adjustBpm(1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => adjustBpm(5)}
                className="px-2.5 py-1 text-xs font-bold font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                +5
              </button>

              {/* Tap Tempo */}
              <button
                onClick={handleTapTempo}
                className="ml-2 flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-700 transition active:scale-95"
              >
                <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                <span>TAP</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Slider & Time Signatures */}
        <div className="flex flex-col gap-4 w-full md:max-w-md">
          {/* Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>20</span>
              <span>120</span>
              <span>200</span>
              <span>300</span>
            </div>
            <input
              type="range"
              min={20}
              max={300}
              value={bpm}
              onChange={(e) => onBpmChange(parseInt(e.target.value, 10))}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>

          {/* Time Signature Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Music className="w-3.5 h-3.5 text-slate-400" /> Meter:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {TIME_SIGNATURE_PRESETS.map((ts) => {
                const isSelected =
                  timeSignatureNumerator === ts.num && timeSignatureDenominator === ts.den;
                return (
                  <button
                    key={ts.label}
                    onClick={() => onTimeSignatureChange(ts.num, ts.den)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition ${
                      isSelected
                        ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {ts.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
