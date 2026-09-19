import React from 'react';

interface VisualizerProps {
  currentBeat: number;
  totalBeats: number;
  isPlaying: boolean;
  bpm: number;
  isAccented: boolean;
  activeNoteId: string | null;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  currentBeat,
  totalBeats,
  isPlaying,
  bpm,
  isAccented,
}) => {
  // Pendulum angle calculation based on current beat
  // Alternates left and right on beats
  const pendulumAngle = isPlaying
    ? (currentBeat % 2 === 0 ? -24 : 24)
    : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col items-center justify-between min-h-[160px] relative overflow-hidden">
      {/* Visual Flash for silent practice / downbeat */}
      <div
        className={`absolute inset-0 transition-opacity duration-100 pointer-events-none ${
          isPlaying && isAccented
            ? 'bg-amber-400/10 opacity-100'
            : isPlaying && currentBeat !== 0
            ? 'bg-sky-400/5 opacity-100'
            : 'opacity-0'
        }`}
      />

      {/* Pendulum Animation Container */}
      <div className="relative w-full h-20 flex items-center justify-center">
        {/* Pivot Point */}
        <div className="w-3 h-3 rounded-full bg-slate-600 border border-slate-400 z-20 shadow" />

        {/* Pendulum Arm */}
        <div
          className="absolute top-2 w-1.5 h-16 origin-top rounded-full bg-gradient-to-b from-slate-400 to-sky-400 z-10 transition-transform duration-100 ease-out"
          style={{
            transform: `rotate(${pendulumAngle}deg)`,
            transitionDuration: isPlaying ? `${Math.max(60, (60 / bpm) * 450)}ms` : '300ms',
          }}
        >
          {/* Bob Weight */}
          <div
            className={`absolute -bottom-2 -left-2.5 w-6 h-6 rounded-full border-2 transition shadow-lg ${
              isPlaying
                ? isAccented
                  ? 'bg-amber-400 border-amber-200 shadow-amber-400/50 scale-125'
                  : 'bg-sky-400 border-sky-200 shadow-sky-400/50 scale-110'
                : 'bg-slate-700 border-slate-500'
            }`}
          />
        </div>

        {/* Swing Arc Guide */}
        <div className="w-36 h-8 border-b-2 border-dashed border-slate-800 rounded-[50%] absolute top-8 pointer-events-none" />
      </div>

      {/* Beat Pulse Indicator Nodes */}
      <div className="w-full flex items-center justify-center gap-2 sm:gap-3 z-10 mt-2">
        {Array.from({ length: totalBeats }, (_, i) => {
          const isActive = isPlaying && currentBeat === i;
          const isDownbeat = i === 0;

          return (
            <div
              key={i}
              className={`flex-1 max-w-[70px] h-10 rounded-xl flex flex-col items-center justify-center font-mono font-bold transition-all duration-100 border ${
                isActive
                  ? isDownbeat
                    ? 'bg-gradient-to-t from-amber-500 to-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/30 scale-105'
                    : 'bg-gradient-to-t from-sky-500 to-sky-400 text-slate-950 border-sky-300 shadow-lg shadow-sky-500/30 scale-105'
                  : isDownbeat
                  ? 'bg-slate-800/80 text-amber-400/80 border-amber-900/40'
                  : 'bg-slate-800/50 text-slate-400 border-slate-800'
              }`}
            >
              <span className="text-sm">{i + 1}</span>
              <span className="text-[9px] uppercase tracking-wider font-sans font-semibold opacity-80">
                {isDownbeat ? 'Accent' : 'Beat'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
