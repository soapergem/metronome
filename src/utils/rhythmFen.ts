import { BaseDuration, NotationElement } from '../types/metronome';
import { calculateElementDuration, getMeasureCapacity } from './notationUtils';

const DURATION_TO_TOKEN: Record<BaseDuration, string> = {
  whole: 'w',
  half: 'h',
  quarter: 'q',
  eighth: 'e',
  sixteenth: 's',
};

const TOKEN_TO_DURATION: Record<string, BaseDuration> = {
  w: 'whole',
  h: 'half',
  q: 'quarter',
  e: 'eighth',
  s: 'sixteenth',
};

const EPSILON = 0.0001;

/**
 * Serializes the current measure elements into Compact Rhythm Notation string.
 * Example: "[4/4] >q e e 3(s s s s s s) 3(s s s s s s)"
 */
export function serializeToCompactRhythm(
  elements: NotationElement[],
  timeSigNum: number,
  timeSigDen: number
): string {
  const parts: string[] = [`[${timeSigNum}/${timeSigDen}]`];

  let i = 0;
  while (i < elements.length) {
    const el = elements[i];

    // If part of a tuplet group, group them with 3(...)
    if (el.isTriplet && el.tupletId) {
      const tupletGroup: NotationElement[] = [];
      const currentTupletId = el.tupletId;
      while (i < elements.length && elements[i].tupletId === currentTupletId) {
        tupletGroup.push(elements[i]);
        i++;
      }

      const innerTokens = tupletGroup.map((n) => formatSingleToken(n, false));
      parts.push(`3(${innerTokens.join(' ')})`);
    } else if (el.isTriplet) {
      // Single triplet token without explicit tupletId grouping
      parts.push(`3(${formatSingleToken(el, false)})`);
      i++;
    } else {
      parts.push(formatSingleToken(el, true));
      i++;
    }
  }

  return parts.join(' ');
}

function formatSingleToken(el: NotationElement, _includeTripletPrefix: boolean): string {
  let token = DURATION_TO_TOKEN[el.baseDuration] || 'q';
  if (el.isRest) {
    token = token.toUpperCase();
  }

  // Modifiers
  let prefix = '';
  let suffix = '';

  if (el.isAccented && !el.isRest) {
    prefix = '>';
  }
  if (el.isDotted) {
    suffix += '.';
  }
  if (el.isTiedToNext && !el.isRest) {
    suffix += '_';
  }

  return `${prefix}${token}${suffix}`;
}

export interface ParseResult {
  success: boolean;
  elements?: NotationElement[];
  timeSigNum?: number;
  timeSigDen?: number;
  error?: string;
  totalDuration?: number;
  expectedCapacity?: number;
}

/**
 * Parses Compact Rhythm Notation string back into NotationElements.
 */
export function parseCompactRhythm(
  input: string,
  currentTimeSigNum: number,
  currentTimeSigDen: number
): ParseResult {
  const text = input.trim();
  if (!text) {
    return { success: false, error: 'Empty input' };
  }

  let timeSigNum = currentTimeSigNum;
  let timeSigDen = currentTimeSigDen;

  // Check for leading time signature like [4/4] or [3/4]
  let rhythmBody = text;
  const timeSigMatch = text.match(/^\[(\d{1,2})\/(\d{1,2})\]\s*(.*)$/);
  if (timeSigMatch) {
    timeSigNum = parseInt(timeSigMatch[1], 10);
    timeSigDen = parseInt(timeSigMatch[2], 10);
    rhythmBody = timeSigMatch[3].trim();
  }

  const expectedCapacity = getMeasureCapacity(timeSigNum, timeSigDen);
  const elements: NotationElement[] = [];

  // Tokenize handling parentheses like 3(s s s s s s)
  const tokenRegex = /3\(([^)]+)\)|(\S+)/g;
  let match;

  while ((match = tokenRegex.exec(rhythmBody)) !== null) {
    if (match[1] !== undefined) {
      // Tuplet 3(...) block
      const insideTokens = match[1].trim().split(/\s+/).filter(Boolean);
      const tupletId = `tuplet_${Math.random().toString(36).substring(2, 8)}`;

      for (let idx = 0; idx < insideTokens.length; idx++) {
        const parsed = parseSingleToken(insideTokens[idx], true);
        if (!parsed) {
          return { success: false, error: `Invalid token inside triplet: "${insideTokens[idx]}"` };
        }
        parsed.tupletId = tupletId;
        parsed.tupletIndex = idx % 3;
        parsed.tupletTotal = 3;
        elements.push(parsed);
      }
    } else if (match[2] !== undefined) {
      // Standard token
      const rawToken = match[2];
      const parsed = parseSingleToken(rawToken, false);
      if (!parsed) {
        return { success: false, error: `Unrecognized token: "${rawToken}"` };
      }
      elements.push(parsed);
    }
  }

  if (elements.length === 0) {
    return { success: false, error: 'No note or rest tokens found' };
  }

  const totalDuration = elements.reduce((sum, el) => sum + el.calculatedDuration, 0);

  if (Math.abs(totalDuration - expectedCapacity) > EPSILON) {
    return {
      success: false,
      error: `Measure total is ${totalDuration.toFixed(2)} beats, expected ${expectedCapacity.toFixed(1)} beats for ${timeSigNum}/${timeSigDen}`,
      totalDuration,
      expectedCapacity,
      elements,
      timeSigNum,
      timeSigDen,
    };
  }

  return {
    success: true,
    elements,
    timeSigNum,
    timeSigDen,
    totalDuration,
    expectedCapacity,
  };
}

function parseSingleToken(raw: string, isEnclosedInTriplet: boolean): NotationElement | null {
  let str = raw.trim();
  if (!str) return null;

  let isAccented = false;
  if (str.startsWith('>') || str.startsWith('^')) {
    isAccented = true;
    str = str.substring(1);
  } else if (str.endsWith('>') || str.endsWith('^')) {
    isAccented = true;
    str = str.substring(0, str.length - 1);
  }

  let isTiedToNext = false;
  if (str.endsWith('_') || str.endsWith('~')) {
    isTiedToNext = true;
    str = str.substring(0, str.length - 1);
  }

  let isDotted = false;
  if (str.endsWith('.')) {
    isDotted = true;
    str = str.substring(0, str.length - 1);
  }

  let isTriplet = isEnclosedInTriplet;
  if (str.startsWith('3:')) {
    isTriplet = true;
    str = str.substring(2);
  }

  // Check if rest
  let isRest = false;
  let baseKey = str.toLowerCase();

  if (str.startsWith('r') || str.startsWith('R')) {
    isRest = true;
    baseKey = str.substring(1).toLowerCase();
  } else if (str === str.toUpperCase() && TOKEN_TO_DURATION[baseKey]) {
    isRest = true;
  }

  const baseDuration = TOKEN_TO_DURATION[baseKey];
  if (!baseDuration) {
    return null;
  }

  const calculatedDuration = calculateElementDuration(baseDuration, isDotted, isTriplet);

  return {
    id: 'el_' + Math.random().toString(36).substring(2, 9),
    baseDuration,
    isRest,
    isDotted,
    isTriplet,
    isTiedToNext,
    isAccented,
    calculatedDuration,
  };
}
