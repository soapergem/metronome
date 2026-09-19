import { Preset, Measure, RhythmNote } from '../types/metronome';

// Helper to create a note
export function createNote(
  noteTypeId: string,
  duration: number,
  isRest: boolean = false,
  isAccented: boolean = false,
  tupletGroupSize?: number
): RhythmNote {
  return {
    id: 'note_' + Math.random().toString(36).substring(2, 9),
    noteTypeId,
    duration,
    isRest,
    isAccented,
    tupletGroupSize
  };
}

// Helper to create 6 16th-note triplets (total 1.0 beat)
export function create16thTripletBeat(accentFirst: boolean = true): RhythmNote[] {
  return Array.from({ length: 6 }, (_, i) =>
    createNote('sixteenth_triplet', 1 / 6, false, i === 0 && accentFirst, 6)
  );
}

// Helper to create 3 8th-note triplets (total 1.0 beat)
export function create8thTripletBeat(accentFirst: boolean = true): RhythmNote[] {
  return Array.from({ length: 3 }, (_, i) =>
    createNote('eighth_triplet', 1 / 3, false, i === 0 && accentFirst, 3)
  );
}

// Helper to create 4 16th notes (total 1.0 beat)
export function create16thBeat(accentFirst: boolean = true): RhythmNote[] {
  return Array.from({ length: 4 }, (_, i) =>
    createNote('sixteenth', 0.25, false, i === 0 && accentFirst)
  );
}

// Helper to create 2 8th notes (total 1.0 beat)
export function create8thBeat(accentFirst: boolean = false): RhythmNote[] {
  return [
    createNote('eighth', 0.5, false, accentFirst),
    createNote('eighth', 0.5, false, false)
  ];
}

// Helper to create 1 quarter note (total 1.0 beat)
export function createQuarterBeat(isAccented: boolean = false): RhythmNote[] {
  return [createNote('quarter', 1.0, false, isAccented)];
}

export const DEFAULT_MEASURE_4_4_WITH_TRIPLETS: Measure = {
  id: 'm1',
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  beatGroups: [
    { beatIndex: 0, capacity: 1.0, notes: createQuarterBeat(true) },
    { beatIndex: 1, capacity: 1.0, notes: create8thBeat(false) },
    { beatIndex: 2, capacity: 1.0, notes: create16thTripletBeat(true) },
    { beatIndex: 3, capacity: 1.0, notes: create16thTripletBeat(true) }
  ]
};

export const PRESETS: Preset[] = [
  {
    id: 'sixteenth-triplet-study',
    name: '16th Triplets on Beats 3 & 4 (4/4)',
    category: 'Featured / Practice Piece',
    description: 'Steady 4/4 downbeats with fast 6-note 16th triplets on beats 3 and 4 against the pulse.',
    bpm: 80,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    pulseSettings: {
      sound: 'woodblock',
      accentDownbeat: true,
      volume: 0.85
    },
    measures: [
      {
        id: 'p1_m1',
        timeSignatureNumerator: 4,
        timeSignatureDenominator: 4,
        beatGroups: [
          { beatIndex: 0, capacity: 1.0, notes: createQuarterBeat(true) },
          { beatIndex: 1, capacity: 1.0, notes: create8thBeat(false) },
          { beatIndex: 2, capacity: 1.0, notes: create16thTripletBeat(true) },
          { beatIndex: 3, capacity: 1.0, notes: create16thTripletBeat(true) }
        ]
      }
    ]
  },
  {
    id: 'full-sixteenth-triplets',
    name: 'Full Measure 16th Triplets (24 Notes/Bar)',
    category: 'Tuplet Drills',
    description: 'Continuous 16th-note sextuplets (6 per beat) across all 4 beats to lock into sub-beat subdividing.',
    bpm: 72,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    pulseSettings: {
      sound: 'woodblock',
      accentDownbeat: true,
      volume: 0.8
    },
    measures: [
      {
        id: 'p2_m1',
        timeSignatureNumerator: 4,
        timeSignatureDenominator: 4,
        beatGroups: [
          { beatIndex: 0, capacity: 1.0, notes: create16thTripletBeat(true) },
          { beatIndex: 1, capacity: 1.0, notes: create16thTripletBeat(true) },
          { beatIndex: 2, capacity: 1.0, notes: create16thTripletBeat(true) },
          { beatIndex: 3, capacity: 1.0, notes: create16thTripletBeat(true) }
        ]
      }
    ]
  },
  {
    id: 'chopin-impro-cross-rhythm',
    name: 'Classical / Romantic Cross-Rhythm',
    category: 'Classical',
    description: 'Eighth notes transitioning into rapid 16th-note triplet cascades over a steady quarter-note pulse.',
    bpm: 86,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    pulseSettings: {
      sound: 'digital',
      accentDownbeat: true,
      volume: 0.8
    },
    measures: [
      {
        id: 'p3_m1',
        timeSignatureNumerator: 4,
        timeSignatureDenominator: 4,
        beatGroups: [
          { beatIndex: 0, capacity: 1.0, notes: create8thBeat(true) },
          { beatIndex: 1, capacity: 1.0, notes: create16thTripletBeat(true) },
          { beatIndex: 2, capacity: 1.0, notes: create16thBeat(true) },
          { beatIndex: 3, capacity: 1.0, notes: create16thTripletBeat(true) }
        ]
      }
    ]
  },
  {
    id: 'blues-shuffle-triplets',
    name: 'Blues & Jazz Shuffle (8th Triplets)',
    category: 'Groove / Styles',
    description: '8th-note triplets with middle rest (swing feel) over standard 4/4 walking pulse.',
    bpm: 110,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    pulseSettings: {
      sound: 'hihat',
      accentDownbeat: true,
      volume: 0.75
    },
    measures: [
      {
        id: 'p4_m1',
        timeSignatureNumerator: 4,
        timeSignatureDenominator: 4,
        beatGroups: [
          {
            beatIndex: 0,
            capacity: 1.0,
            notes: [
              createNote('eighth_triplet', 1 / 3, false, true, 3),
              createNote('eighth_triplet', 1 / 3, true, false, 3),
              createNote('eighth_triplet', 1 / 3, false, false, 3)
            ]
          },
          {
            beatIndex: 1,
            capacity: 1.0,
            notes: [
              createNote('eighth_triplet', 1 / 3, false, true, 3),
              createNote('eighth_triplet', 1 / 3, true, false, 3),
              createNote('eighth_triplet', 1 / 3, false, false, 3)
            ]
          },
          {
            beatIndex: 2,
            capacity: 1.0,
            notes: [
              createNote('eighth_triplet', 1 / 3, false, true, 3),
              createNote('eighth_triplet', 1 / 3, true, false, 3),
              createNote('eighth_triplet', 1 / 3, false, false, 3)
            ]
          },
          {
            beatIndex: 3,
            capacity: 1.0,
            notes: [
              createNote('eighth_triplet', 1 / 3, false, true, 3),
              createNote('eighth_triplet', 1 / 3, true, false, 3),
              createNote('eighth_triplet', 1 / 3, false, false, 3)
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'funk-syncopation-16th',
    name: 'Funk 16th Syncopation & Rests',
    category: 'Groove / Styles',
    description: 'Complex 16th-note groove with syncopated accents and ghosted rest intervals.',
    bpm: 96,
    timeSignatureNumerator: 4,
    timeSignatureDenominator: 4,
    pulseSettings: {
      sound: 'cowbell',
      accentDownbeat: true,
      volume: 0.7
    },
    measures: [
      {
        id: 'p5_m1',
        timeSignatureNumerator: 4,
        timeSignatureDenominator: 4,
        beatGroups: [
          {
            beatIndex: 0,
            capacity: 1.0,
            notes: [
              createNote('sixteenth', 0.25, false, true),
              createNote('sixteenth', 0.25, true, false),
              createNote('sixteenth', 0.25, false, true),
              createNote('sixteenth', 0.25, false, false)
            ]
          },
          {
            beatIndex: 1,
            capacity: 1.0,
            notes: [
              createNote('sixteenth', 0.25, true, false),
              createNote('sixteenth', 0.25, false, true),
              createNote('sixteenth', 0.25, false, false),
              createNote('sixteenth', 0.25, false, true)
            ]
          },
          {
            beatIndex: 2,
            capacity: 1.0,
            notes: create16thTripletBeat(true)
          },
          {
            beatIndex: 3,
            capacity: 1.0,
            notes: [
              createNote('sixteenth', 0.25, false, true),
              createNote('eighth', 0.5, false, false),
              createNote('sixteenth', 0.25, false, true)
            ]
          }
        ]
      }
    ]
  }
];
