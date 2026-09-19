export type BaseDuration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';

export type SoundType = 
  | 'woodblock'
  | 'digital'
  | 'mechanical'
  | 'rimshot'
  | 'cowbell'
  | 'marimba'
  | 'hihat';

export interface NotationElement {
  id: string;
  baseDuration: BaseDuration;
  isRest: boolean;
  isDotted: boolean;
  isTriplet: boolean;
  isTiedToNext: boolean;
  isAccented: boolean;
  calculatedDuration: number; // Duration in quarter note beats
  tupletId?: string;
  tupletIndex?: number;
  tupletTotal?: number;
}

export interface MeasureData {
  id: string;
  timeSigNum: number;
  timeSigDen: number;
  elements: NotationElement[];
}

export interface NoteTypeDefinition {
  id: string;
  name: string;
  shortName: string;
  duration: number;
  symbol: string;
  description: string;
  isTuplet?: boolean;
  tupletGroupSize?: number;
  isRest?: boolean;
  category: 'standard' | 'triplet' | 'tuplet' | 'dotted' | 'rest';
}

export interface RhythmNote {
  id: string;
  noteTypeId: string;
  duration: number;
  isRest: boolean;
  isAccented: boolean;
  soundOverride?: SoundType;
  tupletGroupSize?: number;
  label?: string;
}

export interface BeatGroup {
  beatIndex: number;
  capacity: number;
  notes: RhythmNote[];
}

export interface Measure {
  id: string;
  timeSignatureNumerator: number;
  timeSignatureDenominator: number;
  beatGroups: BeatGroup[];
}

export interface LayerSettings {
  enabled: boolean;
  volume: number;
  sound: SoundType;
  muted: boolean;
  solo: boolean;
  pitchOffset?: number;
}

export interface PulseTrackSettings {
  enabled: boolean;
  volume: number;
  sound: SoundType;
  accentDownbeat: boolean;
  subdivision: string;
  accentPattern: boolean[];
  muted: boolean;
  solo: boolean;
}

export interface TempoTrainerSettings {
  enabled: boolean;
  startBpm: number;
  targetBpm: number;
  incrementBpm: number;
  incrementEveryBars: number;
  currentBarCount: number;
}

export interface Preset {
  id: string;
  name: string;
  category: string;
  description: string;
  bpm: number;
  timeSignatureNumerator: number;
  timeSignatureDenominator: number;
  pulseSettings: Partial<PulseTrackSettings>;
  measures: Measure[];
}
