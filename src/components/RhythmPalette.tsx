import React, { useState } from 'react';
import { NOTE_DEFINITIONS } from '../utils/rhythmConstants';
import { NoteTypeDefinition } from '../types/metronome';
import { Grab, HelpCircle, Layers, Sparkles } from 'lucide-react';

interface RhythmPaletteProps {
  onInsertNote: (noteType: NoteTypeDefinition) => void;
  selectedBeatIndex: number;
}

export const RhythmPalette: React.FC<RhythmPaletteProps> = ({
  onInsertNote,
  selectedBeatIndex,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'triplet' | 'standard' | 'rest'>('all');

  const filteredNotes = NOTE_DEFINITIONS.filter((note) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'triplet') return note.category === 'triplet' || note.category === 'tuplet';
    if (activeTab === 'standard') return note.category === 'standard' || note.category === 'dotted';
    if (activeTab === 'rest') return note.category === 'rest';
    return true;
  });

  const handleDragStart = (e: React.DragEvent, noteType: NoteTypeDefinition) => {
    e.dataTransfer.setData('application/json', JSON.stringify(noteType));
    e.dataTransfer.setData('text/plain', noteType.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
      {/* Palette Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Note & Tuplet Palette
          </h2>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
              activeTab === 'all'
                ? 'bg-slate-800 text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('triplet')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1 ${
              activeTab === 'triplet'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-indigo-300 hover:text-indigo-200'
            }`}
          >
            <Sparkles className="w-3 h-3" /> Triplets / Tuplets
          </button>
          <button
            onClick={() => setActiveTab('standard')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
              activeTab === 'standard'
                ? 'bg-slate-800 text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setActiveTab('rest')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
              activeTab === 'rest'
                ? 'bg-slate-800 text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rests
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-400 flex items-center gap-1">
        <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          Drag any note directly into a beat slot below, or click a note to insert into{' '}
          <strong className="text-sky-400 font-bold">Beat {selectedBeatIndex + 1}</strong>.
        </span>
      </div>

      {/* Grid of Note Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2.5">
        {filteredNotes.map((note) => {
          const isTuplet = note.category === 'triplet' || note.category === 'tuplet';
          const isRest = note.category === 'rest';

          return (
            <div
              key={note.id}
              draggable
              onDragStart={(e) => handleDragStart(e, note)}
              onClick={() => onInsertNote(note)}
              className={`group relative p-2.5 rounded-xl border flex flex-col items-center justify-between gap-1 cursor-grab active:cursor-grabbing hover:scale-[1.03] transition-all duration-150 select-none ${
                note.id === 'sixteenth_triplet'
                  ? 'bg-gradient-to-b from-indigo-900/60 to-slate-900 border-indigo-500/80 shadow-md shadow-indigo-500/10 hover:border-indigo-400 ring-1 ring-indigo-500/30'
                  : isTuplet
                  ? 'bg-slate-900 border-indigo-900/60 hover:border-indigo-600/80'
                  : isRest
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700 opacity-90'
                  : 'bg-slate-900 border-slate-800 hover:border-sky-500/50'
              }`}
            >
              {/* Drag indicator icon */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-60 transition">
                <Grab className="w-3 h-3 text-slate-400" />
              </div>

              {/* Musical Symbol */}
              <div
                className={`text-2xl sm:text-3xl font-serif h-9 flex items-center justify-center ${
                  note.id === 'sixteenth_triplet'
                    ? 'text-indigo-300 font-bold'
                    : isTuplet
                    ? 'text-indigo-400 font-semibold'
                    : isRest
                    ? 'text-slate-400'
                    : 'text-sky-300'
                }`}
              >
                {note.symbol}
              </div>

              {/* Name and Tag */}
              <div className="text-center w-full">
                <div className="text-xs font-bold text-slate-200 truncate group-hover:text-sky-300">
                  {note.shortName}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {note.name}
                </div>
              </div>

              {/* Badge for tuplets */}
              {note.tupletGroupSize && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {note.tupletGroupSize}/beat
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
