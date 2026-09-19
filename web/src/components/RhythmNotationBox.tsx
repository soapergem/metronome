import React, { useState, useEffect } from 'react';
import { Copy, Check, Info, Code2 } from 'lucide-react';
import { NotationElement } from '../types/metronome';
import {
  serializeToCompactRhythm,
  parseCompactRhythm,
} from '../utils/rhythmFen';

interface RhythmNotationBoxProps {
  elements: NotationElement[];
  timeSigNum: number;
  timeSigDen: number;
  onUpdateFromText: (
    elements: NotationElement[],
    newTimeSigNum?: number,
    newTimeSigDen?: number
  ) => void;
}

export const RhythmNotationBox: React.FC<RhythmNotationBoxProps> = ({
  elements,
  timeSigNum,
  timeSigDen,
  onUpdateFromText,
}) => {
  const [textValue, setTextValue] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'valid' | 'invalid' | 'info';
    text: string;
  }>({ type: 'valid', text: 'In sync with score' });
  const [isUserEditing, setIsUserEditing] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Sync text box from elements whenever elements or time signature changes (when user is not actively typing)
  useEffect(() => {
    if (!isUserEditing) {
      const serialized = serializeToCompactRhythm(elements, timeSigNum, timeSigDen);
      setTextValue(serialized);
      setStatusMessage({ type: 'valid', text: 'In sync with score' });
    }
  }, [elements, timeSigNum, timeSigDen, isUserEditing]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textValue);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback for clipboard
      const textarea = document.createElement('textarea');
      textarea.value = textValue;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextValue(val);
    setIsUserEditing(true);

    const result = parseCompactRhythm(val, timeSigNum, timeSigDen);
    if (result.success && result.elements) {
      setStatusMessage({ type: 'valid', text: 'Valid rhythm notation' });
      onUpdateFromText(result.elements, result.timeSigNum, result.timeSigDen);
    } else {
      setStatusMessage({
        type: 'invalid',
        text: result.error || 'Incomplete notation',
      });
    }
  };

  const handleBlur = () => {
    setIsUserEditing(false);
    // On blur, if valid re-serialize cleanly, otherwise keep user text
    const result = parseCompactRhythm(textValue, timeSigNum, timeSigDen);
    if (result.success && result.elements) {
      onUpdateFromText(result.elements, result.timeSigNum, result.timeSigDen);
    }
  };

  return (
    <div className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-3 flex flex-col gap-2 shadow-xl select-none">
      {/* Header with Title & Legend Toggle */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300">
          <Code2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Compact Rhythm Notation</span>
        </div>

        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-sky-400 transition"
        >
          <Info className="w-3 h-3" />
          <span>{showGuide ? 'Hide Syntax' : 'Syntax Guide'}</span>
        </button>
      </div>

      {/* Input Row with Copy Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={textValue}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onFocus={() => setIsUserEditing(true)}
            placeholder="[4/4] q e e 3(s s s s s s) 3(s s s s s s)"
            className={`w-full bg-slate-950 border-2 rounded-lg px-3 py-2 text-sm font-mono tracking-wide text-sky-300 focus:outline-none transition ${
              statusMessage.type === 'valid'
                ? 'border-slate-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-400'
                : 'border-amber-600/80 focus:border-amber-500'
            }`}
          />
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-xs font-bold font-mono transition shadow-sm active:scale-95 ${
            isCopied
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-slate-600 text-slate-200'
          }`}
          title="Copy Rhythm Notation to Clipboard"
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-sky-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Validation Status & Syntax Guide */}
      <div className="flex items-center justify-between text-[11px] px-1">
        <span
          className={`font-mono ${
            statusMessage.type === 'valid'
              ? 'text-emerald-400'
              : 'text-amber-400 font-semibold'
          }`}
        >
          {statusMessage.text}
        </span>

        <span className="text-[10px] text-slate-500 font-mono">
          Edit/paste text to update score in real-time
        </span>
      </div>

      {/* Syntax Guide Card (Collapsible) */}
      {showGuide && (
        <div className="mt-1 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 font-mono animate-in fade-in zoom-in-95 duration-100">
          <div className="font-bold text-sky-400 text-xs">Compact Rhythm Syntax:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <div><span className="text-white font-bold">w, h, q, e, s</span> = whole, half, 1/4, 1/8, 1/16 note</div>
            <div><span className="text-white font-bold">W, H, Q, E, S</span> = equivalent rest (or <span className="text-white">rq, re</span>)</div>
            <div><span className="text-white font-bold">.</span> = dotted (<span className="text-sky-300">q.</span> = dotted quarter)</div>
            <div><span className="text-white font-bold">&gt;</span> = accent (<span className="text-sky-300">&gt;q</span> = accented note)</div>
            <div><span className="text-white font-bold">_</span> = tie (<span className="text-sky-300">q_</span> = tied to next)</div>
            <div><span className="text-white font-bold">3(...)</span> = triplet (<span className="text-sky-300">3(s s s s s s)</span> = 16th triplets)</div>
          </div>
          <div className="text-slate-400 text-[10px] pt-1 border-t border-slate-800">
            Example: <code className="text-sky-300">[4/4] &gt;q e e 3(s s s s s s) 3(s s s s s s)</code>
          </div>
        </div>
      )}
    </div>
  );
};
