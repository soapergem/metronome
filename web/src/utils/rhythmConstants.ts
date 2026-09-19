import { NoteTypeDefinition, SoundType } from '../types/metronome';

export const SOUND_NAMES: Record<SoundType, string> = {
  woodblock: 'Woodblock',
  digital: 'Digital Beep',
  mechanical: 'Mechanical Click',
  rimshot: 'Snare / Rimshot',
  cowbell: 'Cowbell',
  marimba: 'Marimba Ping',
  hihat: 'Closed Hi-Hat'
};

export const NOTE_DEFINITIONS: NoteTypeDefinition[] = [
  {
    id: 'quarter',
    name: 'Quarter Note',
    shortName: '1/4',
    duration: 1.0,
    symbol: '♩',
    description: '1 beat in 4/4 time',
    category: 'standard'
  },
  {
    id: 'eighth',
    name: 'Eighth Note',
    shortName: '1/8',
    duration: 0.5,
    symbol: '♪',
    description: '1/2 beat (2 notes per quarter beat)',
    category: 'standard'
  },
  {
    id: 'sixteenth',
    name: '16th Note',
    shortName: '1/16',
    duration: 0.25,
    symbol: '♬',
    description: '1/4 beat (4 notes per quarter beat)',
    category: 'standard'
  },
  {
    id: 'sixteenth_triplet',
    name: '16th-Note Triplet',
    shortName: '1/16 T (6:1)',
    duration: 1 / 6,
    symbol: '𝅘𝅥𝅯₃',
    description: '6 notes per beat (or 3 per 8th note)',
    isTuplet: true,
    tupletGroupSize: 6,
    category: 'triplet'
  },
  {
    id: 'eighth_triplet',
    name: '8th-Note Triplet',
    shortName: '1/8 T (3:1)',
    duration: 1 / 3,
    symbol: '♪₃',
    description: '3 notes per quarter beat',
    isTuplet: true,
    tupletGroupSize: 3,
    category: 'triplet'
  },
  {
    id: 'dotted_quarter',
    name: 'Dotted Quarter',
    shortName: '1/4.',
    duration: 1.5,
    symbol: '♩.',
    description: '1.5 beats (quarter + eighth)',
    category: 'dotted'
  },
  {
    id: 'dotted_eighth',
    name: 'Dotted Eighth',
    shortName: '1/8.',
    duration: 0.75,
    symbol: '♪.',
    description: '3/4 beat (eighth + 16th)',
    category: 'dotted'
  },
  {
    id: 'thirty_second',
    name: '32nd Note',
    shortName: '1/32',
    duration: 0.125,
    symbol: '𝅘𝅥𝅯𝅘𝅥𝅯',
    description: '1/8 beat (8 notes per quarter beat)',
    category: 'standard'
  },
  {
    id: 'quintuplet',
    name: 'Quintuplet (5:1)',
    shortName: '5-let',
    duration: 1 / 5,
    symbol: '♪₅',
    description: '5 equal notes per beat',
    isTuplet: true,
    tupletGroupSize: 5,
    category: 'tuplet'
  },
  {
    id: 'quarter_rest',
    name: 'Quarter Rest',
    shortName: 'Rest 1/4',
    duration: 1.0,
    symbol: '𝄽',
    description: '1 beat silence',
    isRest: true,
    category: 'rest'
  },
  {
    id: 'eighth_rest',
    name: 'Eighth Rest',
    shortName: 'Rest 1/8',
    duration: 0.5,
    symbol: '𝄾',
    description: '1/2 beat silence',
    isRest: true,
    category: 'rest'
  },
  {
    id: 'sixteenth_rest',
    name: '16th Rest',
    shortName: 'Rest 1/16',
    duration: 0.25,
    symbol: '𝄿',
    description: '1/4 beat silence',
    isRest: true,
    category: 'rest'
  },
  {
    id: 'sixteenth_triplet_rest',
    name: '16th Triplet Rest',
    shortName: 'Rest 1/16 T',
    duration: 1 / 6,
    symbol: '𝄿₃',
    description: '1/6 beat silence',
    isRest: true,
    isTuplet: true,
    tupletGroupSize: 6,
    category: 'rest'
  }
];

export const TEMPO_MARKINGS = [
  { max: 40, name: 'Grave', description: 'Very slow and solemn' },
  { max: 60, name: 'Largo', description: 'Broad and slowly' },
  { max: 66, name: 'Larghetto', description: 'Rather broadly' },
  { max: 76, name: 'Adagio', description: 'Slow with great expression' },
  { max: 108, name: 'Andante', description: 'At a walking pace' },
  { max: 120, name: 'Moderato', description: 'Moderately' },
  { max: 156, name: 'Allegro', description: 'Fast, quickly, and bright' },
  { max: 176, name: 'Vivace', description: 'Lively and fast' },
  { max: 200, name: 'Presto', description: 'Very, very fast' },
  { max: 300, name: 'Prestissimo', description: 'As fast as possible' },
];

export function getTempoMarking(bpm: number): string {
  for (const marking of TEMPO_MARKINGS) {
    if (bpm <= marking.max) {
      return marking.name;
    }
  }
  return 'Prestissimo';
}
