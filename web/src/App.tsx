import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Minus, Plus, Volume2, VolumeX, HelpCircle } from 'lucide-react';
import { audioEngine, ScheduledBeatEvent } from './audio/AudioEngine';
import { BaseDuration, NotationElement, SoundType } from './types/metronome';
import { NotationToolbar } from './components/NotationToolbar';
import { NotationMeasureCanvas } from './components/NotationMeasureCanvas';
import { RhythmNotationBox } from './components/RhythmNotationBox';
import { createNotationElement } from './utils/notationUtils';

const STORAGE_KEY = 'polyrhythm_metronome_state_v1';

function getDefaultElements(): NotationElement[] {
  return [
    createNotationElement('quarter', false, false, false, false, true),
    createNotationElement('quarter'),
    createNotationElement('quarter'),
    createNotationElement('quarter'),
  ];
}

function loadSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      if (Array.isArray(data.elements) && data.elements.length > 0) {
        return {
          bpm: typeof data.bpm === 'number' ? data.bpm : 80,
          timeSigNum: typeof data.timeSigNum === 'number' ? data.timeSigNum : 4,
          timeSigDen: typeof data.timeSigDen === 'number' ? data.timeSigDen : 4,
          soundType: (data.soundType as SoundType) || 'woodblock',
          elements: data.elements as NotationElement[],
        };
      }
    }
  } catch {}
  return null;
}

export function App() {
  const savedState = loadSavedState();

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(savedState?.bpm ?? 80);
  const [bpmInput, setBpmInput] = useState<string>(String(savedState?.bpm ?? 80));
  const [timeSigNum, setTimeSigNum] = useState<number>(savedState?.timeSigNum ?? 4);
  const [timeSigDen, setTimeSigDen] = useState<number>(savedState?.timeSigDen ?? 4);

  // A measure always starts complete. Editing replaces time; it never adds or
  // removes time from the bar.
  const [elements, setElements] = useState<NotationElement[]>(
    savedState?.elements ?? getDefaultElements()
  );

  // Toolbar state
  const [selectedDuration, setSelectedDuration] = useState<BaseDuration>('quarter');
  const [isRestMode, setIsRestMode] = useState<boolean>(false);
  const [isTripletActive, setIsTripletActive] = useState<boolean>(false);
  const [isDotActive, setIsDotActive] = useState<boolean>(false);
  const [isTieActive, setIsTieActive] = useState<boolean>(false);

  // Selection & Active Playback State
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isPulseAccented, setIsPulseAccented] = useState<boolean>(false);
  const [soundType, setSoundType] = useState<SoundType>(savedState?.soundType ?? 'woodblock');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Tap tempo ref
  const tapTimesRef = useRef<number[]>([]);

  // Save to localStorage on state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          bpm,
          timeSigNum,
          timeSigDen,
          soundType,
          elements,
        })
      );
    } catch {}
  }, [bpm, timeSigNum, timeSigDen, soundType, elements]);

  const handleBpmInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBpmInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 20 && parsed <= 300) {
      setBpm(parsed);
    }
  };

  const handleBpmInputBlur = () => {
    const parsed = parseInt(bpmInput, 10);
    if (isNaN(parsed) || parsed < 20) {
      setBpm(20);
      setBpmInput('20');
    } else if (parsed > 300) {
      setBpm(300);
      setBpmInput('300');
    } else {
      setBpm(parsed);
      setBpmInput(String(parsed));
    }
  };

  const setAndSyncBpm = useCallback((updater: number | ((prev: number) => number)) => {
    setBpm((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const clamped = Math.max(20, Math.min(300, next));
      setBpmInput(String(clamped));
      return clamped;
    });
  }, []);

  // Press-and-hold auto-repeat for BPM +/- buttons
  const holdTimerRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);

  const stopBpmHold = useCallback(() => {
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdIntervalRef.current !== null) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  const startBpmHold = useCallback(
    (delta: number, e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();

      // Immediate step on press
      setAndSyncBpm((b) => (delta > 0 ? Math.min(300, b + delta) : Math.max(20, b + delta)));
      stopBpmHold();

      let counter = 0;
      // Start auto-repeat after 320ms hold
      holdTimerRef.current = window.setTimeout(() => {
        holdIntervalRef.current = window.setInterval(() => {
          counter++;
          // Gradually accelerate when held longer
          const step = counter > 18 ? (delta > 0 ? 3 : -3) : counter > 8 ? (delta > 0 ? 2 : -2) : delta;
          setAndSyncBpm((b) => (delta > 0 ? Math.min(300, b + step) : Math.max(20, b + step)));
        }, 70);
      }, 320);
    },
    [setAndSyncBpm, stopBpmHold]
  );

  useEffect(() => {
    const handleGlobalPointerUp = () => stopBpmHold();
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [stopBpmHold]);

  // Update flattened sequence for AudioEngine whenever elements change
  useEffect(() => {
    let currentBeatPos = 0;
    const flatSeq = elements.map((el, idx) => {
      const isTiedFromPrev = idx > 0 && elements[idx - 1].isTiedToNext;
      const noteEvent = {
        noteId: el.id,
        duration: el.calculatedDuration,
        isRest: el.isRest,
        isAccented: el.isAccented,
        isTiedFromPrev,
        isTiedToNext: el.isTiedToNext,
        measureIndex: 0,
        beatPosition: currentBeatPos,
      };
      currentBeatPos += el.calculatedDuration;
      return noteEvent;
    });

    audioEngine.setRhythmSequence(flatSeq);
  }, [elements]);

  // Keep AudioEngine parameters synchronized
  useEffect(() => {
    audioEngine.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    audioEngine.setTimeSignature(timeSigNum, timeSigDen);
  }, [timeSigNum, timeSigDen]);

  useEffect(() => {
    audioEngine.updatePulseSettings({
      enabled: true,
      volume: 0.85,
      sound: soundType,
      accentDownbeat: true,
      subdivision: '1',
      muted: isMuted,
      solo: false,
    });
    audioEngine.updateRhythmSettings({
      enabled: true,
      volume: 0.95,
      sound: soundType,
      muted: isMuted,
      solo: false,
    });
  }, [soundType, isMuted]);

  // Subscribe to real-time audio playback events
  useEffect(() => {
    const unsub = audioEngine.subscribe((event: ScheduledBeatEvent) => {
      if (event.type === 'pulse') {
        setIsPulseAccented(event.isAccented);
      } else if (event.type === 'rhythm' && event.noteId) {
        setActiveNoteId(event.noteId);
      }
    });
    return () => unsub();
  }, []);

  // Screen Wake Lock API: Prevent mobile screen from dimming/sleeping while metronome is playing
  useEffect(() => {
    let wakeLockSentinel: any = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isPlaying) {
        try {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        } catch {
          // Wake lock request can fail if device battery saver is active
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        requestWakeLock();
      }
    };

    if (isPlaying) {
      requestWakeLock();
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
        wakeLockSentinel = null;
      }
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
        wakeLockSentinel = null;
      }
    };
  }, [isPlaying]);

  const handleTogglePlay = useCallback(async () => {
    if (isStarting) return;
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
      setActiveNoteId(null);
      return;
    }

    setIsStarting(true);
    const started = await audioEngine.start();
    setIsStarting(false);
    if (started) setIsPlaying(true);
  }, [isPlaying, isStarting]);

  // Tap Tempo
  const handleTap = () => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    if (taps.length > 0 && now - taps[taps.length - 1] > 2500) {
      tapTimesRef.current = [];
    }
    tapTimesRef.current.push(now);
    if (tapTimesRef.current.length > 5) tapTimesRef.current.shift();
    if (tapTimesRef.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = Math.round(60000 / avg);
      if (newBpm >= 20 && newBpm <= 300) setAndSyncBpm(newBpm);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAndSyncBpm((b) => Math.min(300, b + (e.shiftKey ? 5 : 1)));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAndSyncBpm((b) => Math.max(20, b - (e.shiftKey ? 5 : 1)));
      } else if (e.key.toLowerCase() === 't') {
        handleTap();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedElementId) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('notation:rest-selected'));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, selectedElementId, setAndSyncBpm]);

  // Keyboard-style insertion replaces the selected position. The canvas owns
  // validation because it also handles drag-and-drop at exact positions.
  const handleInsertActiveNote = () => {
    window.dispatchEvent(new CustomEvent('notation:insert-selected', {
      detail: {
        baseDuration: selectedDuration,
        isRest: isRestMode,
        isDotted: isDotActive,
        isTriplet: isTripletActive,
        isTiedToNext: isTieActive,
      },
    }));
  };

  const changeTimeSignature = (num: number, den: number) => {
    setTimeSigNum(num);
    setTimeSigDen(den);
    const capacity = num * (4 / den);
    const replacement: NotationElement[] = [];
    let remaining = capacity;
    while (remaining >= 1 - 0.0001) {
      replacement.push(createNotationElement('quarter'));
      remaining -= 1;
    }
    if (remaining >= 0.5 - 0.0001) {
      replacement.push(createNotationElement('eighth'));
      remaining -= 0.5;
    }
    while (remaining >= 0.25 - 0.0001) {
      replacement.push(createNotationElement('sixteenth'));
      remaining -= 0.25;
    }
    if (replacement[0]) replacement[0].isAccented = true;
    setElements(replacement);
    setSelectedElementId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-3 sm:p-6 md:p-8 font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Bar: Minimal Settings */}
      <div className="w-full max-w-2xl flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-400 mb-2">
        <span className="tracking-widest uppercase font-bold text-slate-200 flex items-center gap-2 text-xs sm:text-sm">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          PolyRhythm Metronome
        </span>
        <div className="flex items-center gap-2 sm:gap-3">
          <select
            value={soundType}
            onChange={(e) => setSoundType(e.target.value as SoundType)}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="woodblock">Woodblock</option>
            <option value="digital">Digital Beep</option>
            <option value="mechanical">Mechanical Click</option>
            <option value="rimshot">Snare / Rimshot</option>
            <option value="cowbell">Cowbell</option>
          </select>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition active:scale-95"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>
        </div>
      </div>

      {/* Main Column */}
      <div className="w-full max-w-2xl flex flex-col items-center gap-5 sm:gap-6 my-auto">
        {/* 1. Large Circular Play Button Matching Wireframe */}
        <button
          onClick={handleTogglePlay}
          disabled={isStarting}
          className={`w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full border-4 sm:border-[5px] flex items-center justify-center transition-all duration-150 transform active:scale-95 shadow-2xl shrink-0 ${
            isPlaying
              ? isPulseAccented
                ? 'bg-rose-500 border-rose-400 text-white shadow-rose-500/40 ring-6 sm:ring-8 ring-rose-500/20'
                : 'bg-rose-600 border-rose-500 text-white shadow-rose-600/30 ring-4 ring-rose-600/20'
              : 'bg-slate-900 hover:bg-slate-800 border-sky-400/80 hover:border-sky-300 text-sky-400 shadow-sky-500/20 hover:shadow-sky-500/30'
          }`}
          aria-label={isStarting ? 'Starting audio' : isPlaying ? 'Stop' : 'Play'}
        >
          {isPlaying ? (
            <Square className="w-10 h-10 sm:w-14 sm:h-14 fill-current text-white" />
          ) : (
            <Play className={`w-12 h-12 sm:w-16 sm:h-16 fill-current ml-1 sm:ml-2 ${isStarting ? 'animate-pulse' : ''}`} />
          )}
        </button>

        {/* 2. BPM Controls (-) [ 80 ] BPM (+) */}
        <div className="flex items-center gap-2 sm:gap-3 select-none flex-wrap justify-center">
          <button
            type="button"
            onPointerDown={(e) => startBpmHold(-1, e)}
            onPointerUp={stopBpmHold}
            onPointerLeave={stopBpmHold}
            onPointerCancel={stopBpmHold}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-slate-700 bg-slate-900 flex items-center justify-center text-slate-300 hover:text-white hover:border-sky-400 active:scale-90 transition font-bold shrink-0 touch-none"
            title="Decrease BPM (hold to auto-repeat)"
          >
            <Minus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] pointer-events-none" />
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={bpmInput}
              onChange={handleBpmInputChange}
              onBlur={handleBpmInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="w-16 sm:w-20 h-10 sm:h-11 border-2 border-slate-700 focus:border-sky-400 rounded-lg text-center text-xl sm:text-2xl font-bold font-mono bg-slate-900 text-white focus:outline-none"
            />
            <span className="font-bold text-xs sm:text-sm text-slate-400 tracking-wider">
              BPM
            </span>
          </div>

          <button
            type="button"
            onPointerDown={(e) => startBpmHold(1, e)}
            onPointerUp={stopBpmHold}
            onPointerLeave={stopBpmHold}
            onPointerCancel={stopBpmHold}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-slate-700 bg-slate-900 flex items-center justify-center text-slate-300 hover:text-white hover:border-sky-400 active:scale-90 transition font-bold shrink-0 touch-none"
            title="Increase BPM (hold to auto-repeat)"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] pointer-events-none" />
          </button>

          <button
            type="button"
            onClick={handleTap}
            className="text-xs font-bold border-2 border-slate-700 bg-slate-900 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-sky-400 hover:border-sky-400 hover:bg-slate-800 transition uppercase tracking-wider active:scale-95"
            title="Tap Tempo (or press T)"
          >
            Tap
          </button>
        </div>

        {/* 3. Time Signature [ 4 ] / [ 4 ] */}
        <div className="flex items-center gap-2 font-mono text-base sm:text-lg font-bold">
          <select
            value={timeSigNum}
            onChange={(e) => changeTimeSignature(Math.max(1, parseInt(e.target.value, 10)), timeSigDen)}
            className="w-11 sm:w-12 h-9 sm:h-10 border-2 border-slate-700 focus:border-sky-400 rounded-lg text-center font-bold text-base sm:text-lg bg-slate-900 text-white cursor-pointer focus:outline-none"
          >
            {[2, 3, 4, 5, 6, 7, 8, 9, 12].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <span className="text-lg sm:text-xl font-bold text-slate-500">/</span>

          <select
            value={timeSigDen}
            onChange={(e) => changeTimeSignature(timeSigNum, parseInt(e.target.value, 10))}
            className="w-11 sm:w-12 h-9 sm:h-10 border-2 border-slate-700 focus:border-sky-400 rounded-lg text-center font-bold text-base sm:text-lg bg-slate-900 text-white cursor-pointer focus:outline-none"
          >
            {[2, 4, 8, 16].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Finale / Dorico / Sibelius Notation Toolbar */}
        <NotationToolbar
          selectedDuration={selectedDuration}
          onSelectDuration={setSelectedDuration}
          isRestMode={isRestMode}
          onToggleRestMode={setIsRestMode}
          isTripletActive={isTripletActive}
          onToggleTriplet={() => setIsTripletActive(!isTripletActive)}
          isDotActive={isDotActive}
          onToggleDot={() => setIsDotActive(!isDotActive)}
          isTieActive={isTieActive}
          onToggleTie={() => setIsTieActive(!isTieActive)}
          onInsertActiveNote={handleInsertActiveNote}
        />

        {/* 5. The Measure Staff Canvas */}
        <NotationMeasureCanvas
          elements={elements}
          onUpdateElements={setElements}
          timeSigNum={timeSigNum}
          timeSigDen={timeSigDen}
          activeNoteId={activeNoteId}
          isPlaying={isPlaying}
          selectedElementId={selectedElementId}
          onSelectElementId={setSelectedElementId}
        />

        {/* 6. Compact Rhythm Notation Text Box */}
        <RhythmNotationBox
          elements={elements}
          timeSigNum={timeSigNum}
          timeSigDen={timeSigDen}
          onUpdateFromText={(newElements, newNum, newDen) => {
            setElements(newElements);
            if (newNum !== undefined && newDen !== undefined) {
              if (newNum !== timeSigNum) setTimeSigNum(newNum);
              if (newDen !== timeSigDen) setTimeSigDen(newDen);
            }
          }}
        />

        {/* Helper Footer text */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>
            <strong className="text-slate-300">Spacebar:</strong> Play/Stop &bull; <strong className="text-slate-300">Delete/Backspace:</strong> Rest &bull; Drag values onto score
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center text-[11px] text-slate-500 mt-4">
        “Is mayonnaise an instrument?” —Patrick Star
      </footer>
    </div>
  );
}

export default App;
