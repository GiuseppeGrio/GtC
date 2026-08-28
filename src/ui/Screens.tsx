import { useEffect, useState } from 'react';
import type { MissionCardData, EndingStats, ToastKind } from '../game/types';
import { ENDING_CREDITS, ENDING_EPILOGUE } from '../game/missions';
import { loveLevel } from './HUD';

const TITLE_BG = 'https://image.qwenlm.ai/generated-images/8c39eb39-a567-44cb-8a74-55a0dc9357f4/_result.png';

const FloatHeart = ({ left, delay, size }: { left: string; delay: string; size: number }) => (
  <svg viewBox="0 0 24 24" className="absolute bottom-[-40px] text-love/60 anim-floaty" style={{ left, animationDelay: delay, width: size, height: size, animationDuration: '5s' }} fill="currentColor">
    <path d="M12 21s-7.5-4.8-10-9.5C.5 7.5 3 4 6.5 4 9 4 11 5.5 12 7.5 13 5.5 15 4 17.5 4 21 4 23.5 7.5 22 11.5 19.5 16.2 12 21 12 21z" />
  </svg>
);

export function TitleScreen({ hasSave, onNew, onContinue }: { hasSave: boolean; onNew: () => void; onContinue: () => void }) {
  const [bgOk, setBgOk] = useState(true);
  return (
    <div className="absolute inset-0 overflow-hidden bg-nightx">
      {bgOk ? (
        <img src={TITLE_BG} alt="" onError={() => setBgOk(false)} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg,#7fd0ff 0%,#ffc9a3 55%,#ff8b7b 100%)' }} />
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(14,35,71,0.15) 0%, rgba(14,35,71,0.25) 45%, rgba(14,35,71,0.9) 88%)' }} />
      <FloatHeart left="8%" delay="0s" size={26} /><FloatHeart left="22%" delay="1.2s" size={18} /><FloatHeart left="71%" delay="0.6s" size={30} /><FloatHeart left="88%" delay="1.8s" size={20} /><FloatHeart left="55%" delay="2.4s" size={16} />

      <div className="relative h-full flex flex-col items-center justify-end pb-10 px-4">
        {/* logo */}
        <div className="text-center mb-2 anim-rise">
          <div className="font-display text-[11px] md:text-sm tracking-[0.35em] text-paper/90 text-outline">IL GIOCO DOVE SI VUOLE BENE</div>
          <h1 className="font-display leading-[0.9] text-paper text-outline anim-wobble inline-block mt-2" style={{ fontSize: 'clamp(64px, 13vw, 150px)' }}>
            CLOMP
          </h1>
          <div className="mt-1 font-display text-love text-outline" style={{ fontSize: 'clamp(18px, 3.4vw, 34px)' }}>
            CUORCONTENTO CITY
          </div>
          <div className="mt-2 sticker inline-block px-4 py-1.5 rotate-[-2deg]">
            <span className="font-display text-[13px] text-ink">un "GTA" dell'amore · protagonista: un ragazzino dai capelli blu fino al fondoschiena · veicolo: Toyota Yaris 2007</span>
          </div>
        </div>

        {/* pulsanti */}
        <div className="flex flex-col md:flex-row gap-3 mt-6 anim-rise" style={{ animationDelay: '0.15s' }}>
          <button onClick={onNew} className="btn-toy bg-love text-white px-10 py-4 text-xl">NUOVA PARTITA</button>
          {hasSave && (
            <button onClick={onContinue} className="btn-toy bg-gold text-ink px-10 py-4 text-xl">CONTINUA</button>
          )}
        </div>

        {/* controlli + info */}
        <div className="mt-6 grid md:grid-cols-3 gap-3 w-[min(900px,94vw)] anim-rise" style={{ animationDelay: '0.3s' }}>
          <div className="sticker px-4 py-3">
            <div className="font-display text-[12px] text-lovedeep mb-1">CONTROLLI</div>
            <p className="text-[12px] text-ink/85 leading-relaxed font-medium">
              <b>WASD/frecce</b> guida &amp; cammina · <b>E</b> sali/parla · <b>F</b> power-up o Spada · <b>H</b> clacson · <b>Spazio</b> freno/salto · <b>Shift</b> corri · <b>Esc</b> pausa
            </p>
          </div>
          <div className="sticker px-4 py-3">
            <div className="font-display text-[12px] text-lovedeep mb-1">LA STORIA</div>
            <p className="text-[12px] text-ink/85 leading-relaxed font-medium">
              13 missioni, corse a colpi di Guscio Rosso d'Amore, drammi da panchina, un fantasma nel parcheggio e una Spada che cosparge di amore puro tutto ciò che trafigge.
            </p>
          </div>
          <div className="sticker px-4 py-3">
            <div className="font-display text-[12px] text-lovedeep mb-1">PER I COMPLETISTI</div>
            <p className="text-[12px] text-ink/85 leading-relaxed font-medium">
              40 cuoricini, 5 focacce d'oro nascoste, 12 buone azioni, gare, battaglie e chiacchiere con ogni abitante. Servono tastiera e un cuore grande.
            </p>
          </div>
        </div>
        <div className="mt-4 text-[11px] font-bold text-paper/60">Nessun pixel è stato maltrattato · l'audio parte dopo il primo click · v1.0 "Focaccia"</div>
      </div>
    </div>
  );
}

export function PauseScreen({ onResume, onMute, muted, onQuit }: { onResume: () => void; onMute: () => void; muted: boolean; onQuit: () => void }) {
  return (
    <div className="absolute inset-0 z-40 bg-nightx/70 grid place-items-center backdrop-blur-[2px]">
      <div className="sticker px-8 py-7 w-[min(420px,92vw)] anim-pop">
        <h2 className="font-display text-3xl text-ink">PAUSA</h2>
        <p className="text-sm text-ink/70 font-medium mt-1">La Yaris riposa. I cuoricini aspettano.</p>
        <div className="mt-5 grid gap-2.5">
          <button onClick={onResume} className="btn-toy bg-tealx text-white px-6 py-3">RIPRENDI</button>
          <button onClick={onMute} className="btn-toy bg-gold text-ink px-6 py-3">{muted ? 'AUDIO: SPENTO' : 'AUDIO: ACCESO'}</button>
          <button onClick={onQuit} className="btn-toy bg-[#e8eef4] text-ink px-6 py-3">SALVA E TORNA AL TITOLO</button>
        </div>
        <p className="mt-4 text-[11px] text-ink/50 font-bold text-center">Il progresso si salva a ogni missione compiuta</p>
      </div>
    </div>
  );
}

export function MissionCardView({ card }: { card: MissionCardData }) {
  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className={`sticker px-7 py-4 anim-pop text-center ${card.kind === 'complete' ? 'bg-[#eafff0]' : 'bg-[#fff3d6]'}`}>
        {card.kind === 'start' && (
          <>
            <div className="font-display text-[11px] tracking-[0.25em] text-lovedeep">NUOVA MISSIONE</div>
            <div className="font-display text-2xl text-ink mt-1">{card.title}</div>
            <div className="text-[12px] font-bold text-ink/60 mt-1">📍 {card.zone}</div>
          </>
        )}
        {card.kind === 'complete' && (
          <>
            <div className="font-display text-[11px] tracking-[0.25em] text-[#1f9d55]">MISSIONE COMPIUTA</div>
            <div className="font-display text-2xl text-ink mt-1">{card.title}</div>
            <div className="text-[13px] font-bold text-love mt-1">+{card.reward} Amore Puro</div>
            {card.next && <div className="text-[12px] font-bold text-ink/60 mt-1">Prossima tappa: {card.next}</div>}
          </>
        )}
      </div>
    </div>
  );
}

export function ToastStack({ toasts }: { toasts: { id: number; text: string; kind: ToastKind }[] }) {
  const styles: Record<ToastKind, string> = {
    info: 'bg-paper text-ink',
    love: 'bg-love text-white',
    warn: 'bg-gold text-ink',
    fun: 'bg-tealx text-white',
  };
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 grid gap-2 pointer-events-none w-[min(560px,92vw)]">
      {toasts.map(t => (
        <div key={t.id} className={`sticker anim-toast px-4 py-2.5 text-center ${styles[t.kind]}`}>
          <span className="font-bold text-[13px]">{t.text}</span>
        </div>
      ))}
    </div>
  );
}

export function EndingScreen({ stats, onContinue }: { stats: EndingStats; onContinue: () => void }) {
  const [phase, setPhase] = useState<'epilogue' | 'credits'>('epilogue');
  const [lineIdx, setLineIdx] = useState(0);
  const { lvl, name } = loveLevel(stats.love);

  useEffect(() => {
    if (phase !== 'epilogue') return;
    if (lineIdx >= ENDING_EPILOGUE.length) {
      const t = setTimeout(() => setPhase('credits'), 1600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLineIdx(i => i + 1), 3400);
    return () => clearTimeout(t);
  }, [phase, lineIdx]);

  return (
    <div className="absolute inset-0 z-50 bg-nightx/92 overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 30%, #ff5d8f 0%, transparent 60%)' }} />
      {phase === 'epilogue' ? (
        <div className="h-full grid place-items-center px-6">
          <div className="max-w-[720px] w-full">
            {ENDING_EPILOGUE.slice(0, lineIdx).map((l, i) => (
              <p key={i} className="anim-rise mb-4 text-center">
                <span className="font-display text-sm block" style={{ color: l.color === '#8d939e' ? '#b9c2d8' : l.color }}>{l.speaker}</span>
                <span className="text-paper/95 text-lg leading-relaxed font-medium">{l.text}</span>
              </p>
            ))}
            <button onClick={() => setPhase('credits')} className="mx-auto mt-4 btn-toy bg-paper/10 text-paper/70 px-5 py-2 text-sm pointer-events-auto">
              salta ▸▸
            </button>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col md:flex-row">
          {/* crediti scorrevoli */}
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-x-0 top-full anim-credits px-6">
              <h2 className="font-display text-4xl text-love text-center mb-10 text-outline">CUORCONTENTO È SALVA</h2>
              {ENDING_CREDITS.map(([role, who], i) => (
                <div key={i} className="text-center mb-6">
                  <div className="font-display text-gold text-sm tracking-widest">{role}</div>
                  <div className="text-paper/90 font-medium">{who}</div>
                </div>
              ))}
              <div className="text-center font-display text-paper/70 text-xl mt-10 mb-24">♥ grazie di cuore ♥</div>
            </div>
          </div>
          {/* statistiche */}
          <div className="md:w-[380px] p-6 grid place-items-center">
            <div className="sticker px-7 py-6 w-full anim-pop">
              <h3 className="font-display text-xl text-ink">PAGELLA DELL'EROE</h3>
              <div className="mt-4 grid gap-2.5 text-sm font-medium text-ink/85">
                <div className="flex justify-between"><span>Amore Puro raccolto</span><b className="font-display text-love">{stats.love}</b></div>
                <div className="flex justify-between"><span>Livello</span><b className="font-display text-ink">{lvl} · {name}</b></div>
                <div className="flex justify-between"><span>Cuoricini</span><b className="font-display text-love">{stats.hearts}/40</b></div>
                <div className="flex justify-between"><span>Focacce d'oro</span><b className="font-display text-gold">{stats.focacce}/5</b></div>
                <div className="flex justify-between"><span>Buone azioni</span><b className="font-display text-tealx">{stats.sides}</b></div>
                <div className="flex justify-between"><span>Missioni</span><b className="font-display text-ink">{stats.missions}/13</b></div>
                <div className="flex justify-between"><span>Tempo a Cuorcontento</span><b className="font-display text-ink">{Math.max(1, Math.round(stats.minutes))} min</b></div>
              </div>
              <button onClick={onContinue} className="btn-toy bg-love text-white w-full mt-5 px-6 py-3">
                CONTINUA A GIRARE (YARIS D'ORO SBLOCCATA)
              </button>
              <p className="mt-3 text-[11px] text-ink/55 font-bold text-center">La città resta tua: cuoricini, focacce e buone azioni ti aspettano.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
