import type { HudData } from '../game/types';
import { ITEM_INFO } from '../game/actors';

const HeartIcon = ({ className = '', filled = true }: { className?: string; filled?: boolean }) => (
  <svg viewBox="0 0 24 24" className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M12 21s-7.5-4.8-10-9.5C.5 7.5 3 4 6.5 4 9 4 11 5.5 12 7.5 13 5.5 15 4 17.5 4 21 4 23.5 7.5 22 11.5 19.5 16.2 12 21 12 21z" />
  </svg>
);
const SwordIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14.5 17.5 3 6V3h3l11.5 11.5" /><path d="m13 19 6-6" /><path d="m16 16 4 4" /><path d="m19 21 2-2" />
  </svg>
);
const WheelIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 3v6M3.5 15l5.8-1.9M20.5 15l-5.8-1.9" />
  </svg>
);

export function loveLevel(love: number): { lvl: number; name: string } {
  const names = ['Novellino Gentile', 'Aiutante di Quartiere', 'Cuore d\'Oro', 'Eroe della Focaccia', 'Paladino dell\'Amore', 'Leggenda di Cuorcontento'];
  const lvl = Math.min(names.length - 1, Math.floor(love / 25));
  return { lvl: lvl + 1, name: names[lvl] };
}

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

export default function HUD({ hud, mapRef }: { hud: HudData; mapRef: React.RefObject<HTMLCanvasElement> }) {
  const { lvl, name } = loveLevel(hud.love);
  const battle = hud.raceTotal != null && hud.lap == null;
  return (
    <div className="absolute inset-0 pointer-events-none select-none font-body">
      {/* ── tracker missione (alto-sinistra) ── */}
      <div className="absolute top-4 left-4 max-w-[340px]">
        <div className="sticker px-4 py-3 anim-card">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-love anim-heartbeat inline-block" />
            <span className="font-display text-[13px] text-ink leading-tight">{hud.missionTitle}</span>
          </div>
          <p className="mt-1 text-[13px] font-medium text-ink/85 leading-snug">{hud.objective}</p>
        </div>
        {hud.timer != null && (
          <div
            className={`mt-2 px-4 py-2 inline-block rounded-xl border-3 border-ink shadow-[3px_3px_0_#16324f] ${
              hud.timer < 10 ? 'bg-[#ffe3ec]' : 'bg-[#fffdf6]'
            }`}
          >
            <span className="font-display text-xl text-lovedeep tabular-nums">⏱ {hud.timer}s</span>
          </div>
        )}
        {hud.shout && (
          <div key={hud.shout.id} className="sticker-dark mt-2 px-4 py-2.5 anim-shout max-w-[380px]">
            <span
              className="font-display text-[11px] tracking-wider uppercase block"
              style={{ color: !isLightHex(hud.shout.color) || hud.shout.color === '#3a4157' ? '#ffd166' : hud.shout.color }}
            >
              {hud.shout.speaker}
            </span>
            <p className="text-[13px] leading-snug text-white font-medium mt-0.5">{hud.shout.text}</p>
          </div>
        )}
      </div>

      {/* ── gara / battaglia (alto-centro) ── */}
      {hud.racePos != null && hud.lap != null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 items-stretch">
          <div className="sticker px-5 py-2 text-center">
            <div className="font-display text-3xl text-lovedeep leading-none">{hud.racePos}°<span className="text-base text-ink/60">/{hud.raceTotal}</span></div>
            <div className="text-[11px] font-bold text-ink/70">POSIZIONE</div>
          </div>
          <div className="sticker px-5 py-2 text-center">
            <div className="font-display text-3xl text-ink leading-none">{hud.lap}<span className="text-base text-ink/60">/{hud.laps}</span></div>
            <div className="text-[11px] font-bold text-ink/70">GIRO</div>
          </div>
        </div>
      )}
      {battle && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 sticker px-5 py-2 text-center">
          <div className="font-display text-xl text-ink leading-none">Kart rimasti: {hud.racePos}</div>
          <div className="mt-1 flex gap-1 justify-center text-love">
            {[0, 1, 2].map(i => <HeartIcon key={i} className={`w-5 h-5 ${i < hud.tenderitudine ? '' : 'opacity-20'}`} />)}
          </div>
        </div>
      )}
      {hud.sword && !battle && hud.lap == null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 sticker px-4 py-2 flex items-center gap-2 text-lovedeep">
          <SwordIcon className="w-5 h-5" />
          <span className="font-display text-sm">Spada dell'Amore</span>
          <span className="flex gap-0.5 text-love">
            {[0, 1, 2].map(i => <HeartIcon key={i} className={`w-4 h-4 ${i < hud.tenderitudine ? '' : 'opacity-20'}`} />)}
          </span>
        </div>
      )}

      {/* ── amore / cuoricini / power-up (alto-destra) ── */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
        <div className="sticker px-4 py-2.5 text-right">
          <div className="flex items-center gap-2 justify-end">
            <HeartIcon className="w-6 h-6 text-love anim-heartbeat" />
            <span className="font-display text-2xl text-ink leading-none">{hud.love}</span>
          </div>
          <div className="text-[10px] font-bold text-ink/70 mt-0.5">LIV. {lvl} · {name}</div>
        </div>
        <div className="sticker px-3 py-1.5 flex items-center gap-1.5">
          <HeartIcon className="w-4 h-4 text-love" />
          <span className="font-display text-sm text-ink">{hud.hearts}</span>
          <span className="w-px h-4 bg-ink/20 mx-1" />
          <span className="font-display text-sm text-gold">{hud.sideCount}</span>
          <span className="text-[10px] font-bold text-ink/60">azioni</span>
        </div>
        {hud.item && (
          <div className="sticker px-3 py-2 flex items-center gap-2 anim-pop" style={{ borderColor: ITEM_INFO[hud.item].color }}>
            <span className="w-7 h-7 rounded-lg border-2 border-ink grid place-items-center font-display text-sm" style={{ background: ITEM_INFO[hud.item].color, color: '#fffdf6' }}>?</span>
            <div>
              <div className="font-display text-[11px] text-ink leading-tight">{ITEM_INFO[hud.item].name}</div>
              <div className="text-[10px] font-bold text-ink/60">premi F</div>
            </div>
          </div>
        )}
        {hud.timeOfDay === 'night' && (
          <div className="sticker-dark px-3 py-1.5 font-display text-xs text-skyy">NOTTE</div>
        )}
      </div>

      {/* ── minimappa + tachimetro (basso-sinistra) ── */}
      <div className="absolute bottom-4 left-4">
        <div className="sticker p-1.5">
          <canvas ref={mapRef} width={256} height={256} className="w-[168px] h-[168px] rounded-[8px]" />
        </div>
        {hud.mode === 'drive' && (
          <div className="sticker mt-2 px-4 py-2 flex items-end gap-2">
            <WheelIcon className="w-6 h-6 text-ink mb-0.5" />
            <span className="font-display text-3xl text-ink leading-none tabular-nums">{hud.speed}</span>
            <span className="text-[11px] font-bold text-ink/60 mb-0.5">km/h</span>
          </div>
        )}
        {hud.mode === 'foot' && (
          <div className="sticker mt-2 px-4 py-2 flex items-center gap-2">
            <SwordIcon className={`w-5 h-5 ${hud.sword ? 'text-lovedeep' : 'text-ink/30'}`} />
            <span className="font-display text-sm text-ink">{hud.sword ? 'A piedi · F = fendente' : 'A piedi · Shift = corri'}</span>
          </div>
        )}
      </div>

      {/* ── suggerimento controlli (basso-destra) ── */}
      <div className="absolute bottom-4 right-4 hidden md:block">
        <div className="sticker-dark px-3 py-2 text-[11px] leading-relaxed text-white/80">
          <span className="font-bold text-white">WASD</span> guida/cammina · <span className="font-bold text-white">E</span> interagisci ·{' '}
          <span className="font-bold text-white">F</span> power-up/spada · <span className="font-bold text-white">H</span> clacson ·{' '}
          <span className="font-bold text-white">Spazio</span> freno/salto · <span className="font-bold text-white">Esc</span> pausa
        </div>
      </div>

      {/* ── prompt interazione (basso-centro) ── */}
      {hud.prompt && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
          <div className="sticker anim-prompt px-5 py-2.5">
            <span className="font-display text-[15px] text-ink">{hud.prompt}</span>
          </div>
        </div>
      )}

      {/* ── didascalia cutscene ── */}
      {hud.caption && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[min(760px,92vw)]">
          <div className="sticker-dark px-6 py-4 anim-rise">
            <p className="text-[15px] md:text-base leading-relaxed text-white/95 text-center font-medium">{hud.caption}</p>
          </div>
        </div>
      )}

      {/* vignetta quando il grigio avanza */}
      {hud.grayscale > 0.3 && (
        <div className="absolute inset-0" style={{ boxShadow: `inset 0 0 ${120 * hud.grayscale}px rgba(20,24,36,${0.5 * hud.grayscale})` }} />
      )}
    </div>
  );
}
