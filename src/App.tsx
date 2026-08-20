import { useEffect, useRef, useState } from 'react';
import { ClompGame } from './game/engine';
import type { HudData, DialoguePayload, MissionCardData, ToastKind, EndingStats } from './game/types';
import HUD from './ui/HUD';
import Dialogue from './ui/Dialogue';
import { TitleScreen, PauseScreen, EndingScreen, MissionCardView, ToastStack } from './ui/Screens';

interface Toast { id: number; text: string; kind: ToastKind; }

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ClompGame | null>(null);

  const [screen, setScreen] = useState<'title' | 'game'>('title');
  const [hasSave, setHasSave] = useState(false);
  const [hud, setHud] = useState<HudData | null>(null);
  const [dialog, setDialog] = useState<DialoguePayload | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [card, setCard] = useState<MissionCardData | null>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [ending, setEnding] = useState<EndingStats | null>(null);
  const toastId = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new ClompGame(
      {
        hud: h => setHud(h),
        dialog: d => setDialog(d),
        toast: (text, kind = 'info') => {
          const id = ++toastId.current;
          setToasts(t => [...t.slice(-3), { id, text, kind }]);
          window.setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4600);
        },
        missionCard: c => {
          setCard(c);
          if (c) window.setTimeout(() => setCard(cur => (cur === c ? null : cur)), 4800);
        },
        ending: s => setEnding(s),
        paused: p => setPaused(p),
      },
      canvasRef.current,
      mapRef.current
    );
    engineRef.current = engine;
    engine.init();
    setHasSave(engine.hasSave());
    return () => engine.destroy();
  }, []);

  // la minimappa viene montata dopo il primo render: ricollegala quando esiste
  useEffect(() => {
    if (screen === 'game' && mapRef.current) {
      (engineRef.current as unknown as { mapCanvas: HTMLCanvasElement | null }).mapCanvas = mapRef.current;
    }
  }, [screen, hud == null]);

  const startNew = () => {
    setScreen('game');
    setEnding(null);
    engineRef.current?.newGame();
  };
  const startContinue = () => {
    setScreen('game');
    setEnding(null);
    engineRef.current?.continueGame();
  };
  const quitToTitle = () => {
    engineRef.current?.setPaused(false);
    setPaused(false);
    setScreen('title');
    setHasSave(engineRef.current?.hasSave() ?? false);
  };

  const inGame = screen === 'game';

  return (
    <div className="relative w-full h-full bg-nightx overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {inGame && hud && <HUD hud={hud} mapRef={mapRef} />}
      {inGame && dialog && (
        <Dialogue payload={dialog} onDone={i => engineRef.current?.dialogDone(i)} />
      )}
      {inGame && card && <MissionCardView card={card} />}
      {inGame && <ToastStack toasts={toasts} />}
      {inGame && paused && !ending && (
        <PauseScreen
          onResume={() => engineRef.current?.setPaused(false)}
          onMute={() => setMuted(engineRef.current?.toggleMute() ?? false)}
          muted={muted}
          onQuit={quitToTitle}
        />
      )}
      {ending && <EndingScreen stats={ending} onContinue={() => setEnding(null)} />}
      {screen === 'title' && (
        <TitleScreen hasSave={hasSave} onNew={startNew} onContinue={startContinue} />
      )}
    </div>
  );
}
