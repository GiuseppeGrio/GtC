import { useEffect, useMemo, useRef, useState } from 'react';
import type { DialoguePayload } from '../game/types';

function isLightHex(hex?: string): boolean {
  if (!hex) return true;
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return true;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 145;
}

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
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="font-display text-base md:text-lg px-3.5 py-1 rounded-xl border-2 border-ink shadow-[2px_2px_0_#16324f] inline-flex items-center font-bold"
              style={{
                backgroundColor: line?.color || '#ffd166',
                color: isLightHex(line?.color || '#ffd166') ? '#16324f' : '#ffffff',
              }}
            >
              {line?.speaker}
            </span>
            {line?.mood === 'serious' && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink/70 bg-gold/30 px-2.5 py-0.5 rounded-lg border border-ink/20">
                momento serio (mica tanto)
              </span>
            )}
          </div>
          {/* testo */}
          <p className="mt-2.5 min-h-[52px] text-[15px] md:text-[16px] leading-relaxed font-medium text-ink">
            {text.slice(0, shown)}
            {shown < text.length && <span className="anim-blink text-lovedeep font-bold">▌</span>}
          </p>

          {/* scelte */}
          {choosing && payload.choices && (
            <div className="mt-3 grid gap-2">
              {payload.choices.map((c, i) => (
                <button
                  key={i}
                  data-choice
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => choose(i)}
                  className="btn-toy text-left px-4 py-2.5 bg-[#fff3d6] hover:bg-gold/60 text-ink text-sm font-bold flex items-center gap-3"
                >
                  <span className="font-display text-lovedeep">{i + 1}</span>
                  <span className="font-body text-ink font-bold">{c.label}</span>
                  {c.love != null && c.love !== 0 && (
                    <span className={`ml-auto font-display text-xs ${c.love > 0 ? 'text-lovedeep' : 'text-ink/65'}`}>
                      {c.love > 0 ? `+${c.love} ♥` : `${c.love} ♥`}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* continua */}
          {!choosing && shown >= text.length && (
            <div className="mt-1 text-right text-[12px] font-bold text-ink/70">
              Spazio / click per continuare <span className="anim-blink text-lovedeep">▼</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
