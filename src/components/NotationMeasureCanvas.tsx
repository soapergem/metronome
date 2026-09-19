import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NotationElement, BaseDuration } from '../types/metronome';
import {
  BASE_DURATION_BEATS,
  NOTE_SYMBOLS,
  REST_SYMBOLS,
  calculateElementDuration,
  createNotationElement,
  getMeasureCapacity,
} from '../utils/notationUtils';
import { RotateCcw, Star, VolumeX, MousePointer, Hand } from 'lucide-react';

interface ToolPayload {
  kind?: 'value';
  baseDuration: BaseDuration;
  isRest: boolean;
  isDotted: boolean;
  isTriplet: boolean;
  isTiedToNext: boolean;
}

interface ModifierPayload {
  kind: 'modifier';
  modifier: 'triplet' | 'dot' | 'tie';
}

interface Props {
  elements: NotationElement[];
  onUpdateElements: (elements: NotationElement[]) => void;
  timeSigNum: number;
  timeSigDen: number;
  activeNoteId: string | null;
  isPlaying: boolean;
  selectedElementId: string | null;
  onSelectElementId: (id: string | null) => void;
}

const EPSILON = 0.0001;

function makeRest(duration: number): NotationElement {
  const candidates: Array<[BaseDuration, boolean, boolean]> = [
    ['whole', false, false],
    ['half', true, false],
    ['half', false, false],
    ['quarter', true, false],
    ['quarter', false, false],
    ['eighth', true, false],
    ['eighth', false, false],
    ['quarter', false, true],
    ['sixteenth', false, false],
    ['eighth', false, true],
    ['sixteenth', false, true],
  ];
  const match = candidates.find(([base, dotted, triplet]) =>
    Math.abs(calculateElementDuration(base, dotted, triplet) - duration) < EPSILON
  );
  if (match) return createNotationElement(match[0], true, match[1], match[2]);
  const rest = createNotationElement('quarter', true);
  rest.calculatedDuration = duration;
  return rest;
}

function decomposeRests(duration: number): NotationElement[] {
  const values = [4, 3, 2, 1.5, 1, 0.75, 2 / 3, 0.5, 1 / 3, 0.25, 1 / 6];
  const rests: NotationElement[] = [];
  let remaining = duration;
  for (const value of values) {
    while (remaining + EPSILON >= value) {
      rests.push(makeRest(value));
      remaining -= value;
    }
  }
  if (remaining > EPSILON) rests.push(makeRest(remaining));
  return rests;
}

function createReplacement(payload: ToolPayload): NotationElement[] {
  if (!payload.isTriplet) {
    return [createNotationElement(
      payload.baseDuration,
      payload.isRest,
      payload.isDotted,
      false,
      payload.isTiedToNext,
    )];
  }

  const tupletId = `tuplet_${Math.random().toString(36).slice(2, 8)}`;
  return Array.from({ length: 3 }, (_, index) => {
    const element = createNotationElement(
      payload.baseDuration,
      payload.isRest,
      payload.isDotted,
      true,
      index === 2 && payload.isTiedToNext,
    );
    element.tupletId = tupletId;
    element.tupletIndex = index;
    element.tupletTotal = 3;
    return element;
  });
}

export const NotationMeasureCanvas: React.FC<Props> = ({
  elements,
  onUpdateElements,
  timeSigNum,
  timeSigDen,
  activeNoteId,
  isPlaying,
  selectedElementId,
  onSelectElementId,
}) => {
  const [interactMode, setInteractMode] = useState<'select' | 'scroll'>('select');
  const [message, setMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionAnchor, setSelectionAnchor] = useState<number | null>(null);
  const isSelecting = useRef(false);
  const isPanning = useRef(false);
  const panStartX = useRef(0);
  const panStartScrollLeft = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const capacity = getMeasureCapacity(timeSigNum, timeSigDen);

  const starts = useMemo(() => {
    let position = 0;
    return elements.map((element) => {
      const start = position;
      position += element.calculatedDuration;
      return start;
    });
  }, [elements]);

  const elementWidths = useMemo(
    () => elements.map((element) => Math.max(42, (element.calculatedDuration / capacity) * 520)),
    [capacity, elements],
  );
  const scoreWidth = Math.max(
    580,
    elementWidths.reduce((total, width) => total + width, 0) + 40,
  );

  useEffect(() => {
    const handlePointerUp = () => {
      isSelecting.current = false;
      isPanning.current = false;
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (isPanning.current && containerRef.current) {
        const dx = e.clientX - panStartX.current;
        containerRef.current.scrollLeft = panStartScrollLeft.current - dx;
      }
    };
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  useEffect(() => {
    if (!selectedElementId) {
      setSelectedIds(new Set());
    } else if (!selectedIds.has(selectedElementId)) {
      setSelectedIds(new Set([selectedElementId]));
    }
  }, [selectedElementId]);

  const selectRange = (from: number, to: number) => {
    const start = Math.min(from, to);
    const end = Math.max(from, to);
    setSelectedIds(new Set(elements.slice(start, end + 1).map((element) => element.id)));
  };

  const startSelection = (index: number, event: React.PointerEvent) => {
    if (interactMode === 'scroll') {
      if (containerRef.current) {
        isPanning.current = true;
        panStartX.current = event.clientX;
        panStartScrollLeft.current = containerRef.current.scrollLeft;
      }
      return;
    }

    if (event.button !== 0) return;
    event.preventDefault();
    isSelecting.current = true;
    const anchor = event.shiftKey && selectionAnchor !== null ? selectionAnchor : index;
    if (!event.shiftKey) setSelectionAnchor(index);
    selectRange(anchor, index);
    onSelectElementId(elements[anchor].id);
  };

  const extendSelection = (index: number) => {
    if (interactMode === 'select' && isSelecting.current && selectionAnchor !== null) {
      selectRange(selectionAnchor, index);
    }
  };

  const replaceAt = (index: number, payload: ToolPayload) => {
    if (index < 0 || index >= elements.length) return;
    const target = elements[index];

    // Dropping the matching value into a tuplet slot changes the slot from a
    // rest to a note (or vice versa) without changing the tuplet's timing.
    if (
      target.isTriplet &&
      !payload.isTriplet &&
      payload.baseDuration === target.baseDuration &&
      payload.isDotted === target.isDotted
    ) {
      const updated = [...elements];
      updated[index] = {
        ...target,
        id: `el_${Math.random().toString(36).slice(2, 9)}`,
        isRest: payload.isRest,
        isTiedToNext: payload.isTiedToNext,
      };
      onUpdateElements(updated);
      onSelectElementId(updated[index].id);
      setMessage(null);
      return;
    }

    const replacement = createReplacement(payload);
    const needed = replacement.reduce((sum, element) => sum + element.calculatedDuration, 0);
    const availableInMeasure = capacity - starts[index];

    if (needed > availableInMeasure + EPSILON) {
      setMessage('That value does not fit at this position in the measure.');
      return;
    }

    let consumed = elements[index].calculatedDuration;
    let end = index + 1;
    while (consumed + EPSILON < needed && end < elements.length && elements[end].isRest) {
      consumed += elements[end].calculatedDuration;
      end += 1;
    }

    if (consumed + EPSILON < needed) {
      setMessage('Replace the following notes with rests before placing this value here.');
      return;
    }

    const remainder = Math.max(0, consumed - needed);
    const updated = [
      ...elements.slice(0, index),
      ...replacement,
      ...decomposeRests(remainder),
      ...elements.slice(end),
    ];
    onUpdateElements(updated);
    onSelectElementId(replacement[0].id);
    setMessage(null);
  };

  const consumeRestSpace = (index: number, needed: number) => {
    let consumed = elements[index].calculatedDuration;
    let end = index + 1;
    while (consumed + EPSILON < needed && end < elements.length && elements[end].isRest) {
      consumed += elements[end].calculatedDuration;
      end += 1;
    }
    return { consumed, end };
  };

  const applyModifier = (index: number, payload: ModifierPayload) => {
    const target = elements[index];
    if (!target) return;

    if (payload.modifier === 'tie') {
      const next = elements[index + 1];
      if (target.isRest || !next || next.isRest) {
        setMessage('A tie must connect this note to the following note.');
        return;
      }
      const updated = [...elements];
      updated[index] = { ...target, isTiedToNext: true };
      onUpdateElements(updated);
      setMessage(null);
      return;
    }

    if (payload.modifier === 'dot') {
      if (target.isDotted) {
        setMessage('This value is already dotted.');
        return;
      }
      const needed = target.calculatedDuration * 1.5;
      if (needed > capacity - starts[index] + EPSILON) {
        setMessage('The dotted value does not fit at this position.');
        return;
      }
      const { consumed, end } = consumeRestSpace(index, needed);
      if (consumed + EPSILON < needed) {
        setMessage('Replace enough following notes with rests before adding the dot.');
        return;
      }
      const dotted = { ...target, isDotted: true, calculatedDuration: needed };
      onUpdateElements([
        ...elements.slice(0, index),
        dotted,
        ...decomposeRests(consumed - needed),
        ...elements.slice(end),
      ]);
      onSelectElementId(dotted.id);
      setMessage(null);
      return;
    }

    if (target.isTriplet) {
      setMessage('This value already belongs to a triplet.');
      return;
    }
    const baseDuration = BASE_DURATION_BEATS[target.baseDuration] * (target.isDotted ? 1.5 : 1);
    const needed = baseDuration * 2;
    if (needed > capacity - starts[index] + EPSILON) {
      setMessage('The triplet group does not fit at this position.');
      return;
    }
    const { consumed, end } = consumeRestSpace(index, needed);
    if (consumed + EPSILON < needed) {
      setMessage('Replace enough following notes with rests before creating the triplet.');
      return;
    }

    const tupletId = `tuplet_${Math.random().toString(36).slice(2, 8)}`;
    const tripletDuration = baseDuration * (2 / 3);
    const triplet = Array.from({ length: 3 }, (_, tupletIndex) => ({
      ...target,
      id: `el_${Math.random().toString(36).slice(2, 9)}`,
      isRest: tupletIndex === 0 ? target.isRest : true,
      isTriplet: true,
      isTiedToNext: false,
      isAccented: tupletIndex === 0 && target.isAccented,
      calculatedDuration: tripletDuration,
      tupletId,
      tupletIndex,
      tupletTotal: 3,
    }));
    onUpdateElements([
      ...elements.slice(0, index),
      ...triplet,
      ...decomposeRests(consumed - needed),
      ...elements.slice(end),
    ]);
    onSelectElementId(triplet[0].id);
    setMessage(null);
  };

  useEffect(() => {
    const insert = (event: Event) => {
      const payload = (event as CustomEvent<ToolPayload>).detail;
      const selectedIndex = elements.findIndex((element) => element.id === selectedElementId);
      const firstRest = elements.findIndex((element) => element.isRest);
      replaceAt(selectedIndex >= 0 ? selectedIndex : firstRest, payload);
    };
    window.addEventListener('notation:insert-selected', insert);
    return () => window.removeEventListener('notation:insert-selected', insert);
  });

  useEffect(() => {
    const restSelected = () => {
      const index = elements.findIndex((element) =>
        selectedIds.size > 0 ? selectedIds.has(element.id) : element.id === selectedElementId
      );
      if (index >= 0) replaceWithRest(index);
    };
    window.addEventListener('notation:rest-selected', restSelected);
    return () => window.removeEventListener('notation:rest-selected', restSelected);
  });

  const replaceWithRest = (index: number) => {
    const idsToReplace = selectedIds.has(elements[index].id)
      ? selectedIds
      : new Set([elements[index].id]);
    const replacementIds = new Set<string>();
    const updated = elements.map((current) => {
      if (!idsToReplace.has(current.id)) return current;
      const id = `rest_${Math.random().toString(36).slice(2, 8)}`;
      replacementIds.add(id);
      return {
        ...current,
        id,
        isRest: true,
        isAccented: false,
        isTiedToNext: false,
      };
    });
    onUpdateElements(updated);
    setSelectedIds(replacementIds);
    onSelectElementId(replacementIds.values().next().value ?? null);
  };

  const toggleAccent = (index: number) => {
    const updated = [...elements];
    updated[index] = { ...updated[index], isAccented: !updated[index].isAccented };
    onUpdateElements(updated);
  };

  const handleDrop = (event: React.DragEvent, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      const payload = JSON.parse(event.dataTransfer.getData('application/json')) as ToolPayload | ModifierPayload;
      if (payload.kind === 'modifier') {
        applyModifier(index, payload);
      } else {
        replaceAt(index, payload);
      }
    } catch {
      setMessage('Choose a notation tool, then drag it onto a note or rest.');
    }
  };

  const resetMeasure = () => {
    const reset: NotationElement[] = [];
    let remaining = capacity;
    while (remaining >= 1 - EPSILON) {
      reset.push(createNotationElement('quarter'));
      remaining -= 1;
    }
    if (remaining >= 0.5 - EPSILON) {
      reset.push(createNotationElement('eighth'));
      remaining -= 0.5;
    }
    while (remaining >= 0.25 - EPSILON) {
      reset.push(createNotationElement('sixteenth'));
      remaining -= 0.25;
    }
    if (reset[0]) reset[0].isAccented = true;
    onUpdateElements(reset);
    onSelectElementId(null);
    setSelectedIds(new Set());
    setSelectionAnchor(null);
    setMessage(null);
  };

  return (
    <div className="w-full space-y-2">
      {/* Top Measure Status & Mode Toggle */}
      <div className="flex flex-wrap min-h-7 items-center justify-between gap-2 px-1 text-xs font-medium text-slate-400">
        <span>
          {message ?? (interactMode === 'select'
            ? 'Select Mode: Drag across notes to highlight range.'
            : 'Scroll Mode: Drag canvas horizontally to pan score.')}
        </span>

        <div className="flex items-center gap-2">
          {/* Select vs. Scroll Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setInteractMode('select')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold text-xs transition ${
                interactMode === 'select'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Select Mode: Highlight and edit notes"
            >
              <MousePointer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Select</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInteractMode('scroll');
                setSelectedIds(new Set());
                setSelectionAnchor(null);
                onSelectElementId(null);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold text-xs transition ${
                interactMode === 'scroll'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Scroll Mode: Click & drag to pan the score"
            >
              <Hand className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Scroll</span>
            </button>
          </div>

          {/* Reset Button */}
          <button
            type="button"
            onClick={resetMeasure}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 font-semibold text-slate-200 transition hover:border-slate-600 active:scale-95 shadow-sm"
            title="Reset the measure"
          >
            <RotateCcw className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`w-full overflow-x-auto border-2 border-slate-800 bg-slate-900/90 rounded-xl shadow-2xl ${
          interactMode === 'scroll' ? 'cursor-grab active:cursor-grabbing select-none' : ''
        }`}
        onPointerDown={(event) => {
          if (interactMode === 'scroll' && containerRef.current) {
            isPanning.current = true;
            panStartX.current = event.clientX;
            panStartScrollLeft.current = containerRef.current.scrollLeft;
          }
        }}
      >
      <div
        className="relative min-h-52 px-5 pb-8 pt-12"
        style={{ minWidth: scoreWidth }}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            if (interactMode === 'select') {
              setSelectedIds(new Set());
              setSelectionAnchor(null);
              onSelectElementId(null);
            }
          }
        }}
      >
        <div className="pointer-events-none absolute inset-x-5 top-[125px] h-[2px] bg-slate-700" />
        <div className="pointer-events-none absolute bottom-3 left-4 top-3 w-[2px] bg-slate-600" />
        <div className="pointer-events-none absolute bottom-3 right-4 top-3 w-[3px] bg-slate-500" />

        <div className="relative z-10 flex items-end">
          {elements.map((element, index) => {
            const selected = selectedIds.has(element.id);
            const active = isPlaying && activeNoteId === element.id;
            const width = elementWidths[index];
            const startsTuplet = element.isTriplet && element.tupletIndex === 0;
            const tupletWidth = element.isTriplet
              ? Math.max(126, (element.calculatedDuration * 3 / capacity) * 520)
              : 0;
            const next = elements[index + 1];
            const previous = elements[index - 1];
            const beatLength = 4 / timeSigDen;
            const sharesBeatWithNext = next
              ? Math.floor((starts[index] + EPSILON) / beatLength) ===
                Math.floor((starts[index + 1] + EPSILON) / beatLength)
              : false;
            const sharesBeatWithPrevious = previous
              ? Math.floor((starts[index] + EPSILON) / beatLength) ===
                Math.floor((starts[index - 1] + EPSILON) / beatLength)
              : false;
            const canBeam = (value?: NotationElement) =>
              !!value &&
              !value.isRest &&
              (value.baseDuration === 'eighth' || value.baseDuration === 'sixteenth');
            const sharesTupletWithNext =
              element.tupletId !== undefined && element.tupletId === next?.tupletId;
            const sharesTupletWithPrevious =
              element.tupletId !== undefined && element.tupletId === previous?.tupletId;
            const beamToNext =
              canBeam(element) &&
              canBeam(next) &&
              (sharesTupletWithNext ||
                (!element.isTriplet && !next?.isTriplet && sharesBeatWithNext));
            const beamFromPrevious =
              canBeam(element) &&
              canBeam(previous) &&
              (sharesTupletWithPrevious ||
                (!element.isTriplet && !previous?.isTriplet && sharesBeatWithPrevious));
            const nextWidth = next ? elementWidths[index + 1] : 0;

            return (
              <div
                key={element.id}
                className={`relative flex h-28 shrink-0 items-end justify-center transition-colors rounded-lg ${
                  selected ? 'bg-sky-500/20 ring-1 ring-sky-500/50' : ''
                }`}
                style={{ width }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, index)}
                onPointerDown={(event) => startSelection(index, event)}
                onPointerEnter={() => extendSelection(index)}
              >
                {startsTuplet && (
                  <div className="pointer-events-none absolute left-0 top-0 z-20 h-6" style={{ width: tupletWidth }}>
                    <div className="absolute left-1 top-3 w-[calc(50%-14px)] border-t border-slate-400" />
                    <div className="absolute right-1 top-3 w-[calc(50%-14px)] border-t border-slate-400" />
                    <div className="absolute left-1 top-3 h-2 border-l border-slate-400" />
                    <div className="absolute right-1 top-3 h-2 border-r border-slate-400" />
                    <span className="absolute left-1/2 top-0 -translate-x-1/2 bg-slate-900 px-1 font-serif text-sm italic text-slate-300">3</span>
                  </div>
                )}

                {selected && selectedElementId === element.id && (
                  <div
                    className="absolute -top-9 z-30 flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-2xl text-slate-200"
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    {!element.isRest && (
                      <button title="Accent" onClick={(event) => { event.stopPropagation(); toggleAccent(index); }} className="p-1 rounded hover:bg-slate-800 transition">
                        <Star className={`h-3.5 w-3.5 ${element.isAccented ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                      </button>
                    )}
                    <button title="Replace with an equal rest" onClick={(event) => { event.stopPropagation(); replaceWithRest(index); }} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition">
                      <VolumeX className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {beamToNext && (
                  <>
                    <span
                      className="pointer-events-none absolute bottom-[77px] left-[calc(50%+3px)] z-20 h-[4px] bg-slate-100"
                      style={{ width: (width + nextWidth) / 2 }}
                    />
                    {element.baseDuration === 'sixteenth' && next?.baseDuration === 'sixteenth' && (
                      <span
                        className="pointer-events-none absolute bottom-[70px] left-[calc(50%+3px)] z-20 h-[4px] bg-slate-100"
                        style={{ width: (width + nextWidth) / 2 }}
                      />
                    )}
                  </>
                )}

                <NotationGlyph
                  element={element}
                  active={active}
                  isBeamed={beamFromPrevious || beamToNext}
                />
                {element.isTiedToNext && <div className="pointer-events-none absolute -bottom-2 -right-5 z-20 text-3xl text-indigo-400">⌣</div>}
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
};

function NotationGlyph({
  element,
  active,
  isBeamed,
}: {
  element: NotationElement;
  active: boolean;
  isBeamed: boolean;
}) {
  if (element.isRest) {
    return (
      <div className={`mb-6 font-[serif] text-4xl leading-none transition-transform ${active ? 'scale-125 text-sky-400' : 'text-slate-400'}`}>
        {REST_SYMBOLS[element.baseDuration]}{element.isDotted && <span className="ml-1 text-xl text-slate-300">•</span>}
      </div>
    );
  }

  if (
    element.baseDuration === 'quarter' ||
    element.baseDuration === 'eighth' ||
    element.baseDuration === 'sixteenth'
  ) {
    const hasFlag = element.baseDuration === 'eighth' || element.baseDuration === 'sixteenth';
    const isSixteenth = element.baseDuration === 'sixteenth';
    return (
      <div className={`relative mb-5 h-16 w-8 transition-transform ${active ? 'scale-125 text-sky-400' : 'text-slate-100'}`}>
        <span className={`absolute bottom-[7px] left-[7px] h-[10px] w-[15px] -rotate-[18deg] rounded-[50%] ${active ? 'bg-sky-400' : 'bg-slate-100'}`} />
        <span className={`absolute bottom-[12px] left-[19px] h-12 w-[3px] ${active ? 'bg-sky-400' : 'bg-slate-100'}`} />

        {hasFlag && !isBeamed && (
          <>
            <svg
              className={`absolute bottom-[41px] left-[20px] h-[18px] w-4 overflow-visible ${active ? 'text-sky-400' : 'text-slate-100'}`}
              viewBox="0 0 16 18"
              aria-hidden="true"
            >
              <path d="M1 1 C11 3 14 8 8 16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
            {isSixteenth && (
              <svg
                className={`absolute bottom-[32px] left-[20px] h-[18px] w-4 overflow-visible ${active ? 'text-sky-400' : 'text-slate-100'}`}
                viewBox="0 0 16 18"
                aria-hidden="true"
              >
                <path d="M1 1 C11 3 14 8 8 16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
            )}
          </>
        )}

        {element.isDotted && <span className="absolute bottom-[5px] right-0 text-xl text-slate-100">•</span>}
        {element.isAccented && <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-base text-amber-400 font-bold">&gt;</span>}
      </div>
    );
  }

  return (
    <div className={`relative mb-5 transition-transform ${active ? 'scale-125 text-sky-400' : 'text-slate-100'}`}>
      <span className="font-[serif] text-5xl leading-none">{NOTE_SYMBOLS[element.baseDuration]}</span>
      {element.isDotted && <span className="absolute -right-3 bottom-1 text-xl">•</span>}
      {element.isAccented && <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-base text-amber-400 font-bold">&gt;</span>}
    </div>
  );
}
