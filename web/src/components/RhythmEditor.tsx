import React from 'react';
import {
  Measure,
  RhythmNote,
  NoteTypeDefinition,
} from '../types/metronome';
import {
  getBeatFilledDuration,
  isBeatFull,
  isBeatOverflow,
  getNoteDefinition,
  formatDurationFraction,
} from '../utils/rhythmUtils';
import {
  create16thTripletBeat,
  create8thTripletBeat,
  create16thBeat,
  create8thBeat,
  createQuarterBeat,
  createNote,
} from '../presets/metronomePresets';
import {
  Plus,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Zap,
  Star,
  X,
  Volume2,
  Sparkles,
  VolumeX,
} from 'lucide-react';

interface RhythmEditorProps {
  measures: Measure[];
  currentMeasureIndex: number;
  onSelectMeasure: (index: number) => void;
  onUpdateMeasures: (measures: Measure[]) => void;
  selectedBeatIndex: number;
  onSelectBeat: (beatIndex: number) => void;
  activeNoteId: string | null;
  isPlaying: boolean;
  onPreviewNote: (note: RhythmNote) => void;
}

export const RhythmEditor: React.FC<RhythmEditorProps> = ({
  measures,
  currentMeasureIndex,
  onSelectMeasure,
  onUpdateMeasures,
  selectedBeatIndex,
  onSelectBeat,
  activeNoteId,
  isPlaying,
  onPreviewNote,
}) => {
  const currentMeasure = measures[currentMeasureIndex] || measures[0];

  // Helper to update current measure
  const updateCurrentMeasure = (newMeasure: Measure) => {
    const updated = [...measures];
    updated[currentMeasureIndex] = newMeasure;
    onUpdateMeasures(updated);
  };

  // Add new blank measure
  const handleAddMeasure = () => {
    const newMeasure: Measure = {
      id: 'm_' + Math.random().toString(36).substring(2, 9),
      timeSignatureNumerator: currentMeasure.timeSignatureNumerator,
      timeSignatureDenominator: currentMeasure.timeSignatureDenominator,
      beatGroups: Array.from({ length: currentMeasure.timeSignatureNumerator }, (_, i) => ({
        beatIndex: i,
        capacity: 1.0,
        notes: createQuarterBeat(i === 0),
      })),
    };
    onUpdateMeasures([...measures, newMeasure]);
    onSelectMeasure(measures.length);
  };

  // Duplicate current measure
  const handleDuplicateMeasure = () => {
    const duplicated: Measure = {
      ...JSON.parse(JSON.stringify(currentMeasure)),
      id: 'm_' + Math.random().toString(36).substring(2, 9),
    };
    const updated = [...measures];
    updated.splice(currentMeasureIndex + 1, 0, duplicated);
    onUpdateMeasures(updated);
    onSelectMeasure(currentMeasureIndex + 1);
  };

  // Delete current measure
  const handleDeleteMeasure = () => {
    if (measures.length <= 1) return;
    const updated = measures.filter((_, idx) => idx !== currentMeasureIndex);
    onUpdateMeasures(updated);
    onSelectMeasure(Math.max(0, currentMeasureIndex - 1));
  };

  // Handle Drag & Drop of notes into a beat
  const handleDropOnBeat = (e: React.DragEvent, beatIndex: number) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const noteType: NoteTypeDefinition = JSON.parse(dataStr);
        insertNoteIntoBeat(beatIndex, noteType);
      }
    } catch {
      // Fallback
    }
  };

  const insertNoteIntoBeat = (beatIndex: number, noteType: NoteTypeDefinition) => {
    const newMeasure = JSON.parse(JSON.stringify(currentMeasure)) as Measure;
    const beatGroup = newMeasure.beatGroups.find((b) => b.beatIndex === beatIndex);
    if (!beatGroup) return;

    // Check if replacing single default quarter note or appending
    const isSingleDefaultQuarter =
      beatGroup.notes.length === 1 && beatGroup.notes[0].duration === 1.0;

    const newNote = createNote(
      noteType.id,
      noteType.duration,
      noteType.isRest || false,
      false,
      noteType.tupletGroupSize
    );

    if (isSingleDefaultQuarter && noteType.duration < 1.0) {
      // If we are adding something smaller than a quarter note to a single 1-beat note, replace it
      beatGroup.notes = [newNote];
    } else {
      beatGroup.notes.push(newNote);
    }

    updateCurrentMeasure(newMeasure);
    onSelectBeat(beatIndex);
    onPreviewNote(newNote);
  };

  // Quick fill beat helpers
  const handleQuickFill = (
    beatIndex: number,
    fillType: '16th_triplets' | '8th_triplets' | '16ths' | '8ths' | 'quarter' | 'clear'
  ) => {
    const newMeasure = JSON.parse(JSON.stringify(currentMeasure)) as Measure;
    const beatGroup = newMeasure.beatGroups.find((b) => b.beatIndex === beatIndex);
    if (!beatGroup) return;

    switch (fillType) {
      case '16th_triplets':
        beatGroup.notes = create16thTripletBeat(true);
        break;
      case '8th_triplets':
        beatGroup.notes = create8thTripletBeat(true);
        break;
      case '16ths':
        beatGroup.notes = create16thBeat(true);
        break;
      case '8ths':
        beatGroup.notes = create8thBeat(true);
        break;
      case 'quarter':
        beatGroup.notes = createQuarterBeat(true);
        break;
      case 'clear':
        beatGroup.notes = [];
        break;
    }

    updateCurrentMeasure(newMeasure);
    onSelectBeat(beatIndex);
  };

  // Note actions
  const toggleAccent = (beatIndex: number, noteId: string) => {
    const newMeasure = JSON.parse(JSON.stringify(currentMeasure)) as Measure;
    const beatGroup = newMeasure.beatGroups.find((b) => b.beatIndex === beatIndex);
    if (!beatGroup) return;

    const note = beatGroup.notes.find((n: RhythmNote) => n.id === noteId);
    if (note) {
      note.isAccented = !note.isAccented;
      updateCurrentMeasure(newMeasure);
    }
  };

  const toggleRest = (beatIndex: number, noteId: string) => {
    const newMeasure = JSON.parse(JSON.stringify(currentMeasure)) as Measure;
    const beatGroup = newMeasure.beatGroups.find((b) => b.beatIndex === beatIndex);
    if (!beatGroup) return;

    const note = beatGroup.notes.find((n: RhythmNote) => n.id === noteId);
    if (note) {
      note.isRest = !note.isRest;
      updateCurrentMeasure(newMeasure);
    }
  };

  const deleteNote = (beatIndex: number, noteId: string) => {
    const newMeasure = JSON.parse(JSON.stringify(currentMeasure)) as Measure;
    const beatGroup = newMeasure.beatGroups.find((b) => b.beatIndex === beatIndex);
    if (!beatGroup) return;

    beatGroup.notes = beatGroup.notes.filter((n: RhythmNote) => n.id !== noteId);
    updateCurrentMeasure(newMeasure);
  };

  const moveNote = (beatIndex: number, noteIndex: number, direction: 'left' | 'right') => {
    const newMeasure = JSON.parse(JSON.stringify(currentMeasure)) as Measure;
    const beatGroup = newMeasure.beatGroups.find((b) => b.beatIndex === beatIndex);
    if (!beatGroup) return;

    const targetIndex = direction === 'left' ? noteIndex - 1 : noteIndex + 1;
    if (targetIndex < 0 || targetIndex >= beatGroup.notes.length) return;

    const [moved] = beatGroup.notes.splice(noteIndex, 1);
    beatGroup.notes.splice(targetIndex, 0, moved);
    updateCurrentMeasure(newMeasure);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-5">
      {/* Measure Navigation & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSelectMeasure(Math.max(0, currentMeasureIndex - 1))}
              disabled={currentMeasureIndex === 0}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold font-mono px-2 text-slate-200">
              Measure {currentMeasureIndex + 1} of {measures.length}
            </span>
            <button
              onClick={() =>
                onSelectMeasure(Math.min(measures.length - 1, currentMeasureIndex + 1))
              }
              disabled={currentMeasureIndex === measures.length - 1}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick 16th Triplet Highlight Banner */}
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/70 border border-indigo-800/60 px-2.5 py-1 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Drop or quick-fill 16th triplets (6 per beat)
          </span>
        </div>

        {/* Measure management buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAddMeasure}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Bar</span>
          </button>
          <button
            onClick={handleDuplicateMeasure}
            title="Duplicate Measure"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {measures.length > 1 && (
            <button
              onClick={handleDeleteMeasure}
              title="Delete Measure"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-rose-400 border border-slate-700 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Beats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {currentMeasure.beatGroups.map((beatGroup) => {
          const beatIndex = beatGroup.beatIndex;
          const filledDuration = getBeatFilledDuration(beatGroup.notes);
          const isFull = isBeatFull(beatGroup.notes, beatGroup.capacity);
          const isOverflow = isBeatOverflow(beatGroup.notes, beatGroup.capacity);
          const isSelected = selectedBeatIndex === beatIndex;

          return (
            <div
              key={beatIndex}
              onClick={() => onSelectBeat(beatIndex)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropOnBeat(e, beatIndex)}
              className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all duration-150 relative ${
                isSelected
                  ? 'bg-slate-900/95 border-sky-500/80 shadow-lg shadow-sky-500/10 ring-2 ring-sky-500/30'
                  : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
              }`}
            >
              {/* Beat Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black font-mono ${
                      beatIndex === 0
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {beatIndex + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    Beat {beatIndex + 1}
                  </span>
                </div>

                {/* Duration meter badge */}
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isFull
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                      : isOverflow
                      ? 'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse'
                      : 'bg-amber-950/80 text-amber-300 border-amber-800'
                  }`}
                >
                  {filledDuration.toFixed(2)} / {beatGroup.capacity.toFixed(1)} beats
                </span>
              </div>

              {/* Notes Container / Drop Zone */}
              <div className="min-h-[105px] bg-slate-900/80 rounded-xl border border-dashed border-slate-800 p-2 flex flex-wrap gap-1.5 items-center content-start">
                {beatGroup.notes.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center py-4 text-slate-400 text-xs text-center">
                    <span>Empty (plays rest)</span>
                    <span className="text-[10px] text-slate-400">
                      Drag note or click quick fill
                    </span>
                  </div>
                ) : (
                  beatGroup.notes.map((note, noteIdx) => {
                    const noteDef = getNoteDefinition(note.noteTypeId);
                    const isPlayingThisNote = isPlaying && activeNoteId === note.id;
                    const is16thTriplet = note.noteTypeId === 'sixteenth_triplet';

                    return (
                      <div
                        key={note.id}
                        className={`group/note relative flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs transition-all duration-100 ${
                          isPlayingThisNote
                            ? 'bg-sky-400 text-slate-950 border-sky-300 scale-110 shadow-lg shadow-sky-400/50 font-bold z-20'
                            : is16thTriplet
                            ? 'bg-indigo-950/90 text-indigo-200 border-indigo-700/80 hover:border-indigo-500'
                            : note.isRest
                            ? 'bg-slate-800/60 text-slate-400 border-slate-700'
                            : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {/* Note Symbol */}
                        <span className="font-serif text-sm font-bold">
                          {note.isRest ? '𝄽' : noteDef.symbol}
                        </span>

                        {/* Note Short Name */}
                        <span className="font-mono text-[10px]">
                          {formatDurationFraction(note.duration)}
                        </span>

                        {/* Controls (Accent, Rest, Delete) */}
                        <div className="flex items-center gap-0.5 ml-0.5">
                          {/* Accent */}
                          {!note.isRest && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAccent(beatIndex, note.id);
                              }}
                              title="Toggle Accent"
                              className={`p-0.5 rounded hover:bg-slate-700 transition ${
                                note.isAccented ? 'text-amber-400' : 'text-slate-400'
                              }`}
                            >
                              <Star className={`w-3 h-3 ${note.isAccented ? 'fill-current' : ''}`} />
                            </button>
                          )}

                          {/* Rest Toggle */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRest(beatIndex, note.id);
                            }}
                            title="Toggle Rest / Sound"
                            className="p-0.5 rounded hover:bg-slate-700 text-slate-400 transition"
                          >
                            {note.isRest ? (
                              <VolumeX className="w-3 h-3 text-rose-400" />
                            ) : (
                              <Volume2 className="w-3 h-3" />
                            )}
                          </button>

                          {/* Reorder Buttons (on hover) */}
                          {noteIdx > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveNote(beatIndex, noteIdx, 'left');
                              }}
                              className="hidden group-hover/note:block p-0.5 text-slate-400 hover:text-slate-200"
                            >
                              ◀
                            </button>
                          )}
                          {noteIdx < beatGroup.notes.length - 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveNote(beatIndex, noteIdx, 'right');
                              }}
                              className="hidden group-hover/note:block p-0.5 text-slate-400 hover:text-slate-200"
                            >
                              ▶
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNote(beatIndex, note.id);
                            }}
                            title="Remove Note"
                            className="p-0.5 rounded hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Fill Actions Bar */}
              <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Fill Beat:
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {/* Specific 16th Triplet Fill Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickFill(beatIndex, '16th_triplets');
                    }}
                    title="Fill with 6 sixteenth-note triplets (total 1 beat)"
                    className="col-span-2 flex items-center justify-center gap-1 py-1 px-1.5 text-[11px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition"
                  >
                    <Zap className="w-3 h-3 fill-current text-amber-300" />
                    <span>6× 16th Triplets</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickFill(beatIndex, '8th_triplets');
                    }}
                    title="Fill with 3 eighth-note triplets"
                    className="py-1 px-1.5 text-[10px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-900/50 transition"
                  >
                    3× 8th Tr.
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickFill(beatIndex, '16ths');
                    }}
                    title="Fill with 4 sixteenth notes"
                    className="py-1 px-1 text-[10px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  >
                    4× 16ths
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickFill(beatIndex, '8ths');
                    }}
                    title="Fill with 2 eighth notes"
                    className="py-1 px-1 text-[10px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  >
                    2× 8ths
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickFill(beatIndex, 'quarter');
                    }}
                    title="Fill with 1 quarter note"
                    className="py-1 px-1 text-[10px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  >
                    1× Quarter
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickFill(beatIndex, 'clear');
                    }}
                    title="Clear all notes in beat"
                    className="col-span-3 py-1 px-1 text-[10px] font-semibold rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800 transition text-center"
                  >
                    Clear Beat
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
