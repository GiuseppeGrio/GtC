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

  const resetUi = () => {
    setHud(null);
    setDialog(null);
    setToasts([]);
    setCard(null);
    setPaused(false);
    setEnding(null);
  };

  const makeEngine = (): ClompGame | null => {
    if (!canvasRef.current) return null;
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
    engine.init();
    engineRef.current = engine;
    return engine;
  };

  useEffect(() => {
    const engine = makeEngine();
    if (engine) setHasSave(engine.hasSave());
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // la minimappa viene montata col primo HUD: ricollegala quando appare
  useEffect(() => {
    if (screen === 'game' && mapRef.current && engineRef.current) {
      (engineRef.current as unknown as { mapCanvas: HTMLCanvasElement | null }).mapCanvas = mapRef.current;
    }
  }, [screen, hud == null]); // eslint-disable-line react-hooks/exhaustive-deps

  const startNew = () => {
    engineRef.current?.destroy();
    engineRef.current = null;
    resetUi();
    const eng = makeEngine();
    eng?.newGame();
    setMuted(eng?.getMuted() ?? false);
    setScreen('game');
  };

  const startContinue = () => {
    engineRef.current?.destroy();
    engineRef.current = null;
    resetUi();
    const eng = makeEngine();
    eng?.continueGame();
    setMuted(eng?.getMuted() ?? false);
    setScreen('game');
  };

  const quitToTitle = () => {
    const eng = engineRef.current;
    eng?.setPaused(false);
    eng?.saveNow();
    setHasSave(eng?.hasSave() ?? false);
    eng?.destroy();
    engineRef.current = null;
    resetUi();
    setScreen('title');
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
