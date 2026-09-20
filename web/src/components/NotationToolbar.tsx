import React from 'react';
import { BaseDuration } from '../types/metronome';
import { DURATION_NAMES } from '../utils/notationUtils';
import { MusicalNoteIcon, MusicalRestIcon } from './MusicalIcons';
import { Plus } from 'lucide-react';

interface NotationToolbarProps {
  selectedDuration: BaseDuration;
  onSelectDuration: (dur: BaseDuration) => void;
  isRestMode: boolean;
  onToggleRestMode: (isRest: boolean) => void;
  isTripletActive: boolean;
  onToggleTriplet: () => void;
  isDotActive: boolean;
  onToggleDot: () => void;
  isTieActive: boolean;
  onToggleTie: () => void;
  onInsertActiveNote: () => void;
}

export const NotationToolbar: React.FC<NotationToolbarProps> = ({
  selectedDuration,
  onSelectDuration,
  isRestMode,
  onToggleRestMode,
  isTripletActive,
  onToggleTriplet,
  isDotActive,
  onToggleDot,
  isTieActive,
  onToggleTie,
  onInsertActiveNote,
}) => {
  const durations: BaseDuration[] = ['sixteenth', 'eighth', 'quarter', 'half', 'whole'];

  const handleDragStart = (e: React.DragEvent, dur: BaseDuration, isRest: boolean) => {
    const payload = {
      baseDuration: dur,
      isRest: isRest,
      isTriplet: isTripletActive,
      isDotted: isDotActive,
      isTiedToNext: isTieActive,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleModifierDragStart = (
    e: React.DragEvent,
    modifier: 'triplet' | 'dot' | 'tie',
  ) => {
    const payload = { kind: 'modifier', modifier };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-2 sm:p-2.5 flex items-center justify-start sm:justify-between gap-1.5 sm:gap-2 shadow-xl select-none overflow-x-auto touch-pan-x scrollbar-thin">
      {/* 1. Note Duration Buttons (Icons Only) */}
      <div className="flex items-center gap-1 shrink-0">
        {durations.map((dur) => {
          const isSelected = selectedDuration === dur && !isRestMode;
          return (
            <div
              key={`note_${dur}`}
              draggable
              onDragStart={(e) => handleDragStart(e, dur, false)}
              onClick={() => {
                onSelectDuration(dur);
                onToggleRestMode(false);
              }}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border flex items-center justify-center cursor-grab active:cursor-grabbing transition-all shrink-0 p-1 ${
                isSelected
                  ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold shadow-lg shadow-sky-500/30 scale-105 ring-2 ring-sky-500/40'
                  : 'bg-slate-950/80 text-slate-200 border-slate-800 hover:border-slate-600 hover:bg-slate-800'
              }`}
              title={`${DURATION_NAMES[dur]} Note (${dur})`}
            >
              <MusicalNoteIcon duration={dur} className="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* Vertical Divider */}
      <div className="w-[1px] h-6 sm:h-7 bg-slate-800 shrink-0 mx-0.5" />

      {/* 2. Rest Duration Buttons (Icons Only) */}
      <div className="flex items-center gap-1 shrink-0">
        {durations.map((dur) => {
          const isSelected = selectedDuration === dur && isRestMode;
          return (
            <div
              key={`rest_${dur}`}
              draggable
              onDragStart={(e) => handleDragStart(e, dur, true)}
              onClick={() => {
                onSelectDuration(dur);
                onToggleRestMode(true);
              }}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border flex items-center justify-center cursor-grab active:cursor-grabbing transition-all shrink-0 p-1 ${
                isSelected
                  ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold shadow-lg shadow-sky-500/30 scale-105 ring-2 ring-sky-500/40'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title={`${DURATION_NAMES[dur]} Rest`}
            >
              <MusicalRestIcon duration={dur} className="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* Vertical Divider */}
      <div className="w-[1px] h-6 sm:h-7 bg-slate-800 shrink-0 mx-0.5" />

      {/* 3. Modifier / Toggle Buttons: Triplet, Dot, Tie (Icons Only) */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Triplet Modifier */}
        <button
          type="button"
          draggable
          onDragStart={(e) => handleModifierDragStart(e, 'triplet')}
          onClick={onToggleTriplet}
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
            isTripletActive
              ? 'bg-indigo-600 text-white border-indigo-400 font-black shadow-lg shadow-indigo-600/30 scale-105 ring-2 ring-indigo-500/40'
              : 'bg-slate-950/80 text-indigo-300 border-slate-800 hover:border-slate-600 hover:bg-slate-800'
          }`}
          title="Triplet modifier: toggle for note entry or drag onto an existing value"
        >
          <span className="text-base sm:text-xl font-serif font-black leading-none select-none">
            3
          </span>
        </button>

        {/* Dot Modifier */}
        <button
          type="button"
          draggable
          onDragStart={(e) => handleModifierDragStart(e, 'dot')}
          onClick={onToggleDot}
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
            isDotActive
              ? 'bg-indigo-600 text-white border-indigo-400 font-black shadow-lg shadow-indigo-600/30 scale-105 ring-2 ring-indigo-500/40'
              : 'bg-slate-950/80 text-indigo-300 border-slate-800 hover:border-slate-600 hover:bg-slate-800'
          }`}
          title="Dot modifier: toggle for note entry or drag onto an existing value"
        >
          <span className="text-xl sm:text-2xl font-black leading-none select-none">
            •
          </span>
        </button>

        {/* Tie Modifier */}
        <button
          type="button"
          draggable
          onDragStart={(e) => handleModifierDragStart(e, 'tie')}
          onClick={onToggleTie}
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
            isTieActive
              ? 'bg-indigo-600 text-white border-indigo-400 font-black shadow-lg shadow-indigo-600/30 scale-105 ring-2 ring-indigo-500/40'
              : 'bg-slate-950/80 text-indigo-300 border-slate-800 hover:border-slate-600 hover:bg-slate-800'
          }`}
          title="Tie modifier: toggle for note entry or drag onto an existing note"
        >
          <span className="text-lg sm:text-2xl font-sans font-black leading-none select-none">
            ⌢
          </span>
        </button>
      </div>

      {/* Vertical Divider */}
      <div className="w-[1px] h-6 sm:h-7 bg-slate-800 shrink-0 mx-0.5" />

      {/* 4. Append / Add Button (Icon Only) */}
      <button
        type="button"
        onClick={onInsertActiveNote}
        className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 hover:border-sky-500/50 rounded-lg flex items-center justify-center transition shadow-sm active:scale-95 shrink-0"
        title="Append note/rest to measure"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
      </button>
    </div>
  );
};
