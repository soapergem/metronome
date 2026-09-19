import { Measure, RhythmNote, SoundType } from '../types/metronome';
import { NOTE_DEFINITIONS } from './rhythmConstants';

export interface FlattenedNote {
  noteId: string;
  duration: number;
  isRest: boolean;
  isAccented: boolean;
  measureIndex: number;
  beatIndex: number;
  soundOverride?: SoundType;
}

/**
 * Converts nested measure and beat structures into an exact flat timeline list for the AudioEngine.
 */
export function flattenMeasures(measures: Measure[]): FlattenedNote[] {
  const result: FlattenedNote[] = [];

  measures.forEach((measure, measureIdx) => {
    measure.beatGroups.forEach((beatGroup) => {
      // If a beat has no notes, insert a default 1.0 quarter rest so timing is preserved
      if (beatGroup.notes.length === 0) {
        result.push({
          noteId: `empty_beat_${measureIdx}_${beatGroup.beatIndex}`,
          duration: beatGroup.capacity,
          isRest: true,
          isAccented: false,
          measureIndex: measureIdx,
          beatIndex: beatGroup.beatIndex
        });
      } else {
        beatGroup.notes.forEach((note) => {
          result.push({
            noteId: note.id,
            duration: note.duration,
            isRest: note.isRest,
            isAccented: note.isAccented,
            measureIndex: measureIdx,
            beatIndex: beatGroup.beatIndex,
            soundOverride: note.soundOverride
          });
        });
      }
    });
  });

  return result;
}

/**
 * Sums the total duration of notes currently inside a BeatGroup.
 */
export function getBeatFilledDuration(notes: RhythmNote[]): number {
  return notes.reduce((sum, n) => sum + n.duration, 0);
}

/**
 * Helper to check if a beat is mathematically full within floating point tolerance.
 */
export function isBeatFull(notes: RhythmNote[], capacity: number = 1.0): boolean {
  const filled = getBeatFilledDuration(notes);
  return Math.abs(filled - capacity) < 0.001;
}

/**
 * Helper to check if a beat is overflowing.
 */
export function isBeatOverflow(notes: RhythmNote[], capacity: number = 1.0): boolean {
  const filled = getBeatFilledDuration(notes);
  return filled - capacity > 0.001;
}

/**
 * Helper to format duration nicely (e.g. 1/6, 1/4, 1/2, 1).
 */
export function formatDurationFraction(duration: number): string {
  if (Math.abs(duration - 1.0) < 0.001) return '1';
  if (Math.abs(duration - 0.5) < 0.001) return '1/2';
  if (Math.abs(duration - 0.25) < 0.001) return '1/4';
  if (Math.abs(duration - 0.125) < 0.001) return '1/8';
  if (Math.abs(duration - 1 / 3) < 0.001) return '1/3';
  if (Math.abs(duration - 1 / 6) < 0.001) return '1/6';
  if (Math.abs(duration - 1 / 5) < 0.001) return '1/5';
  if (Math.abs(duration - 1.5) < 0.001) return '3/2';
  if (Math.abs(duration - 0.75) < 0.001) return '3/4';
  return duration.toFixed(2);
}

export function getNoteDefinition(noteTypeId: string) {
  return NOTE_DEFINITIONS.find((n) => n.id === noteTypeId) || NOTE_DEFINITIONS[0];
}
