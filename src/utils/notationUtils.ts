import { BaseDuration, NotationElement } from '../types/metronome';

export const BASE_DURATION_BEATS: Record<BaseDuration, number> = {
  whole: 4.0,
  half: 2.0,
  quarter: 1.0,
  eighth: 0.5,
  sixteenth: 0.25,
};

export const DURATION_NAMES: Record<BaseDuration, string> = {
  whole: 'Whole',
  half: 'Half',
  quarter: 'Quarter',
  eighth: '1/8th',
  sixteenth: '1/16th',
};

export const NOTE_SYMBOLS: Record<BaseDuration, string> = {
  whole: '𝅝',
  half: '𝅗𝅥',
  quarter: '♩',
  eighth: '♪',
  sixteenth: '𝅘𝅥𝅯',
};

export const REST_SYMBOLS: Record<BaseDuration, string> = {
  whole: '𝄻',
  half: '𝄼',
  quarter: '𝄽',
  eighth: '𝄾',
  sixteenth: '𝄿',
};

export function calculateElementDuration(
  base: BaseDuration,
  isDotted: boolean,
  isTriplet: boolean
): number {
  let dur = BASE_DURATION_BEATS[base];
  if (isTriplet) {
    dur = dur * (2 / 3);
  }
  if (isDotted) {
    dur = dur * 1.5;
  }
  return dur;
}

export function createNotationElement(
  base: BaseDuration,
  isRest: boolean = false,
  isDotted: boolean = false,
  isTriplet: boolean = false,
  isTiedToNext: boolean = false,
  isAccented: boolean = false
): NotationElement {
  return {
    id: 'el_' + Math.random().toString(36).substring(2, 9),
    baseDuration: base,
    isRest,
    isDotted,
    isTriplet,
    isTiedToNext,
    isAccented,
    calculatedDuration: calculateElementDuration(base, isDotted, isTriplet),
  };
}

export function getMeasureCapacity(num: number, den: number): number {
  return num * (4.0 / den);
}

export function getMeasureDuration(elements: NotationElement[]): number {
  return elements.reduce((sum, el) => sum + el.calculatedDuration, 0);
}

export function formatBeats(duration: number): string {
  // Common fractions
  if (Math.abs(duration - 4.0) < 0.001) return '4';
  if (Math.abs(duration - 3.0) < 0.001) return '3';
  if (Math.abs(duration - 2.0) < 0.001) return '2';
  if (Math.abs(duration - 1.5) < 0.001) return '1 ½';
  if (Math.abs(duration - 1.0) < 0.001) return '1';
  if (Math.abs(duration - 0.75) < 0.001) return '¾';
  if (Math.abs(duration - 0.5) < 0.001) return '½';
  if (Math.abs(duration - 0.25) < 0.001) return '¼';
  if (Math.abs(duration - 1 / 3) < 0.001) return '⅓';
  if (Math.abs(duration - 2 / 3) < 0.001) return '⅔';
  if (Math.abs(duration - 1 / 6) < 0.001) return '⅙';
  if (Math.abs(duration - 1 / 12) < 0.001) return '¹/₁₂';
  return duration.toFixed(2);
}
