// ── Tipi condivisi tra engine Three.js e UI React ─────────────────────────

export type NpcId =
  | 'pina' | 'rosa' | 'tonino' | 'focaccino' | 'sindaco' | 'bruscolo'
  | 'ugo' | 'spolverina' | 'steve' | 'fata' | 'gelsomino' | 'wanda' | 'anselmo';

export type ItemKind = 'shell' | 'boost' | 'shield' | 'confetti';

export type PickupKind =
  | 'focaccia' | 'book' | 'pizza' | 'balloon' | 'ball' | 'flower'
  | 'trash' | 'letter' | 'crate' | 'note' | 'cross';

export type CutsceneKey = 'intro' | 'gray' | 'fata' | 'finale' | 'sagra';

export interface DialogueLine {
  speaker: string;
  color: string;
  text: string;
  mood?: 'fun' | 'serious';
}

export interface DialogueChoice {
  label: string;
  love?: number;
  flag?: string;
  reply?: DialogueLine[];
}

export interface DialogueData {
  lines: DialogueLine[];
  choices?: DialogueChoice[];
  setFlag?: string;
}

export type Flags = Record<string, boolean | number>;

export type StepDef =
  | { t: 'cutscene'; key: CutsceneKey; label: string }
  | { t: 'night'; label: string }
  | { t: 'day'; label: string }
  | { t: 'graystart'; label: string }
  | { t: 'grayend'; label: string }
  | { t: 'sword'; label: string }
  | { t: 'goto'; x: number; z: number; r?: number; label: string; timed?: number }
  | { t: 'talk'; npc: NpcId; label: string; dialogue: DialogueData | ((f: Flags) => DialogueData) }
  | { t: 'collect'; label: string; kind: PickupKind; spots: [number, number][]; timed?: number; doneLine?: string }
  | { t: 'chase'; label: string; target: 'cat' | 'bruscolo'; spots: [number, number][] }
  | { t: 'race'; label: string; laps: number }
  | { t: 'battle'; label: string; rivals: number }
  | { t: 'sides'; label: string; count: number }
  | { t: 'boss'; label: string };

export interface Mission {
  id: string;
  title: string;
  zone: string;
  giver: NpcId;
  rewardLove: number;
  steps: StepDef[];
}

export interface SideQuest {
  id: string;
  npcName: string;
  color: string;
  spot: [number, number];
  intro: DialogueData;
  label: string;
  kind: PickupKind;
  target: [number, number];
  thanks: string;
}

// ── Payload verso la UI ───────────────────────────────────────────────────

export interface HudData {
  mode: 'drive' | 'foot';
  speed: number;
  love: number;
  hearts: number;
  item: ItemKind | null;
  missionTitle: string;
  objective: string;
  timer: number | null;
  racePos: number | null;
  raceTotal: number | null;
  lap: number | null;
  laps: number | null;
  tenderitudine: number;
  prompt: string;
  timeOfDay: 'day' | 'night';
  grayscale: number;
  sword: boolean;
  sideCount: number;
  shout: { speaker: string; text: string; color: string; id: number } | null;
  caption: string;
}

export interface DialoguePayload {
  lines: DialogueLine[];
  choices: DialogueChoice[] | null;
}

export type ToastKind = 'info' | 'love' | 'warn' | 'fun';

export interface MissionCardData {
  kind: 'start' | 'complete' | 'fail';
  title: string;
  zone?: string;
  reward?: number;
  next?: string;
}

export interface EndingStats {
  love: number;
  hearts: number;
  focacce: number;
  sides: number;
  missions: number;
  minutes: number;
}

export interface EngineHooks {
  hud: (h: HudData) => void;
  dialog: (d: DialoguePayload | null) => void;
  toast: (text: string, kind?: ToastKind) => void;
  missionCard: (c: MissionCardData | null) => void;
  ending: (s: EndingStats) => void;
  paused: (p: boolean) => void;
}
