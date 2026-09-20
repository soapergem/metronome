import React from 'react';
import { BaseDuration } from '../types/metronome';

interface MusicalIconProps {
  duration: BaseDuration;
  isRest?: boolean;
  className?: string;
}

export const MusicalNoteIcon: React.FC<{ duration: BaseDuration; className?: string }> = ({
  duration,
  className = 'w-6 h-6',
}) => {
  switch (duration) {
    case 'whole':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          {/* Whole note: Open angled oval */}
          <ellipse cx="12" cy="12" rx="6.5" ry="4.5" transform="rotate(-20 12 12)" fill="none" stroke="currentColor" strokeWidth="2.8" />
        </svg>
      );
    case 'half':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          {/* Half note: Open oval + Stem */}
          <ellipse cx="8.5" cy="15.5" rx="5" ry="3.5" transform="rotate(-20 8.5 15.5)" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <line x1="12.5" y1="15" x2="12.5" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'quarter':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          {/* Quarter note: Solid oval + Stem */}
          <ellipse cx="8.5" cy="15.5" rx="5" ry="3.5" transform="rotate(-20 8.5 15.5)" fill="currentColor" />
          <line x1="12.5" y1="15" x2="12.5" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'eighth':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          {/* Eighth note: Solid oval + Stem + 1 Flag */}
          <ellipse cx="8" cy="16" rx="4.5" ry="3.2" transform="rotate(-20 8 16)" fill="currentColor" />
          <line x1="11.5" y1="15.5" x2="11.5" y2="4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M 11.5 4.5 C 15 5.5 18 8 16 13 C 15 11 13 9 11.5 8.5 Z" fill="currentColor" />
        </svg>
      );
    case 'sixteenth':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          {/* Sixteenth note: Solid oval + Stem + 2 Flags */}
          <ellipse cx="8" cy="16.5" rx="4.5" ry="3.2" transform="rotate(-20 8 16.5)" fill="currentColor" />
          <line x1="11.5" y1="16" x2="11.5" y2="3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M 11.5 3.5 C 15 4.5 18 7 16 11.5 C 15 9.8 13 8 11.5 7.5 Z" fill="currentColor" />
          <path d="M 11.5 8 C 15 9 17.5 11.5 16 15 C 15 13.5 13 12 11.5 11.5 Z" fill="currentColor" />
        </svg>
      );
  }
};

export const MusicalRestIcon: React.FC<{ duration: BaseDuration; className?: string }> = ({
  duration,
  className = 'w-6 h-6',
}) => {
  switch (duration) {
    case 'whole':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          {/* Whole rest: hanging rectangle below staff line */}
          <line x1="4" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="1.5" />
          <rect x="8" y="10" width="8" height="4.5" fill="currentColor" />
        </svg>
      );
    case 'half':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          {/* Half rest: sitting rectangle on staff line */}
          <line x1="4" y1="14" x2="20" y2="14" stroke="currentColor" strokeWidth="1.5" />
          <rect x="8" y="9.5" width="8" height="4.5" fill="currentColor" />
        </svg>
      );
    case 'quarter':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          {/* Quarter rest: traditional zig-zag glyph */}
          <path
            d="M 13 4 L 9 9.5 C 8.5 10.2 9 11 10 11.2 L 14 12 C 14.8 12.2 15 13 14 13.8 L 9.5 17.5 C 9 18 9.5 19 10.5 19 C 12 19 13.5 17.8 14 16.5 L 14.8 17.2 C 14.2 19.5 12 21 9.8 21 C 8.2 21 7.2 19.5 8 18 C 8.5 17 9.5 16.2 10.5 15.5 L 12.2 14.2 L 8.5 13.2 C 7.2 12.8 7.2 11 8.2 9.8 L 11.5 4 Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'eighth':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          {/* Eighth rest: dot with diagonal slash */}
          <circle cx="10" cy="8.5" r="2.2" fill="currentColor" />
          <path d="M 10 8.5 C 13.5 8.5 14 11 13 13 L 9.5 20.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'sixteenth':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          {/* Sixteenth rest: two dots with diagonal slash */}
          <circle cx="10" cy="7" r="1.8" fill="currentColor" />
          <path d="M 10 7 C 13 7 13.5 9 12.5 10.5 L 10 14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="9" cy="12" r="1.8" fill="currentColor" />
          <path d="M 9 12 C 12 12 12.5 14 11.5 15.5 L 8.5 21" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
      );
  }
};

export const MusicalGlyph: React.FC<MusicalIconProps> = ({ duration, isRest, className }) => {
  if (isRest) {
    return <MusicalRestIcon duration={duration} className={className} />;
  }
  return <MusicalNoteIcon duration={duration} className={className} />;
};
