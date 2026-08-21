import { useEffect, useMemo, useRef, useState } from 'react';
import type { DialoguePayload } from '../game/types';

export default function Dialogue({ payload, onDone }: { payload: DialoguePayload; onDone: (choiceIdx: number) => void }) {
  const [lineIdx, setLineIdx] = useState(0);
  const [shown, setShown] = useState(0);
  const [choosing, setChoosing] = useState(false);
  const doneRef = useRef(false);

  const lines = payload.lines;
  const line = lines[Math.min(lineIdx, lines.length - 1)];
  const text = useMemo(() => line?.text ?? '', [line]);

  // reset quando cambia il payload
  useEffect(() => {
    setLineIdx(0); setShown(0); setChoosing(false);
    doneRef.current = false;
  }, [payload]);

  // typewriter
  useEffect(() => {
    if (choosing) return;
    if (shown >= text.length) return;
    const id = window.setTimeout(() => setShown(s => Math.min(text.length, s + 2)), 14);
    return () => clearTimeout(id);
  }, [shown, text, choosing]);

  const advance = () => {
    if (doneRef.current) return;
    if (choosing) return;
    if (shown < text.length) { setShown(text.length); return; }
    if (lineIdx < lines.length - 1) {
      setLineIdx(i => i + 1);
      setShown(0);
      return;
    }
    // fine righe
    if (payload.choices && payload.choices.length) setChoosing(true);
    else { doneRef.current = true; onDone(-1); }
  };

  const choose = (i: number) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone(i);
  };

  // tastiera: Spazio/Invio avanza, 1-9 sceglie
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); advance(); }
      if (choosing && payload.choices) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= payload.choices.length) choose(n - 1);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 pointer-events-auto" onMouseDown={e => { if (!(e.target as HTMLElement).closest('[data-choice]')) advance(); }}>
      <div className="mx-auto mb-5 w-[min(860px,94vw)]">
        <div className="sticker px-5 pt-4 pb-5 cursor-pointer">
          {/* nome parlante */}
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-display text-lg leading-none" style={{ color: line?.color ?? '#16324f' }}>
              {line?.speaker}
            </span>
            {line?.mood === 'serious' && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">momento serio (mica tanto)</span>
            )}
          </div>
          {/* testo */}
          <p className="mt-2 min-h-[52px] text-[15px] md:text-[16px] leading-relaxed font-medium text-ink">
            {text.slice(0, shown)}
            {shown < text.length && <span className="anim-blink text-love font-bold">▌</span>}
          </p>

          {/* scelte */}
          {choosing && payload.choices && (
            <div className="mt-2 grid gap-2">
              {payload.choices.map((c, i) => (
                <button
                  key={i}
                  data-choice
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => choose(i)}
                  className="btn-toy text-left px-4 py-2.5 bg-[#fff3d6] hover:bg-gold/60 text-ink text-sm font-bold flex items-center gap-3"
                >
                  <span className="font-display text-lovedeep">{i + 1}</span>
                  <span className="font-body">{c.label}</span>
                  {c.love != null && c.love !== 0 && (
                    <span className={`ml-auto font-display text-xs ${c.love > 0 ? 'text-love' : 'text-ink/50'}`}>
                      {c.love > 0 ? `+${c.love} ♥` : `${c.love} ♥`}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* continua */}
          {!choosing && shown >= text.length && (
            <div className="mt-1 text-right text-[11px] font-bold text-ink/50">
              Spazio / click per continuare <span className="anim-blink text-love">▼</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
