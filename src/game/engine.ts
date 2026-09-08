import * as THREE from 'three';
import { SFX } from './audio';
import { buildWorld, type WorldData, type Collider } from './world';
import {
  makeYaris, makeClomp, makeKart, makeNpc, makeCat, makeOmbra, makeSereno, makeFata,
  makeSword, makeItemBox, makeHeartShell, makeDiamond, makePickup, heartTexture,
  glowTexture, ITEM_INFO, type WalkRig,
} from './actors';
import { MISSIONS, SIDES, OMBRA_INTRO, OMBRA_CHASE, OMBRA_HIT_LINES, OMBRA_WAVE_LINES, ENDING_EPILOGUE } from './missions';
import type {
  EngineHooks, HudData, DialoguePayload, DialogueData, Flags, StepDef, ItemKind,
  NpcId, CutsceneKey, MissionCardData, SideQuest,
} from './types';

// ── costanti di gioco ─────────────────────────────────────────────────────
const CAR_MAX = 34, CAR_ACC = 30, CAR_REV = -12, TURN = 2.1;
const FOOT_SPEED = 8.5, SPRINT = 13.5;

const angleLerp = (a: number, b: number, t: number) => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * Math.min(1, t);
};

interface NpcRec {
  id: string; name: string; color: string; group: THREE.Group; rig: WalkRig;
  home: [number, number]; target: [number, number] | null; wait: number; hop: number;
  wanders: boolean; marker?: THREE.Mesh; lastBonk?: number;
}
interface KartAI {
  group: THREE.Group; wheels: THREE.Mesh[]; heading: number; x: number; z: number;
  cp: number; lap: number; stun: number; speed: number; progress: number;
  finished: boolean; hp: number; fireT: number; color: number; waypoints?: [number, number][]; wpIdx?: number;
}
interface Projectile { mesh: THREE.Group; kind: 'shell' | 'gray'; target: 'player' | 'kart' | null; kartIdx: number; vx: number; vz: number; life: number; }
interface Particle { mesh: THREE.Object3D; vx: number; vy: number; vz: number; life: number; max: number; grav: number; spin: number; }
interface PickupRec { group: THREE.Group; x: number; z: number; kind: string; }
interface BoxRec { group: THREE.Group; x: number; z: number; respawn: number; }
interface BlobRec { mesh: THREE.Group; x: number; z: number; harmless: boolean; dead: boolean; }

interface CutsceneDef { dur: number; frames: [number, number, number][]; looks: [number, number, number][]; captions: [number, string][]; }

const CUTSCENES: Record<CutsceneKey, CutsceneDef> = {
  intro: {
    dur: 11,
    frames: [[40, 130, 240], [0, 60, 120], [-60, 18, -40], [-100, 7, -96]],
    looks: [[0, 0, 0], [0, 0, 0], [-40, 4, -60], [-102, 2, -120]],
    captions: [
      [0.02, 'Cuorcontento. Popolazione: gente dal cuore contento. (E un gatto che li ignora tutti.)'],
      [0.32, 'Questa è la storia di Clomp: capelli blu fino al fondoschiena, cuore grande come il lungomare.'],
      [0.62, 'E della sua Toyota Yaris del 2007. Che non è una macchina. È una compagna di avventure.'],
      [0.86, 'In questa città non si ruba, non si spara. Si aiuta. Si corre. Si vuole bene.'],
    ],
  },
  gray: {
    dur: 12,
    frames: [[0, 12, 40], [0, 20, 10], [14, 26, -14], [0, 34, -2]],
    looks: [[0, 18, -30], [0, 24, -34], [0, 28, -36], [0, 30, -38]],
    captions: [
      [0.02, OMBRA_INTRO[0]],
      [0.36, OMBRA_INTRO[1]],
      [0.7, OMBRA_INTRO[2]],
    ],
  },
  fata: {
    dur: 8,
    frames: [[120, 6, 134], [128, 5, 116], [114, 4, 112]],
    looks: [[120, 3, 120], [120, 3, 120], [120, 3, 120]],
    captions: [
      [0.05, 'La giostra gira da sola. Nessuna musica, eppure suona.'],
      [0.5, 'Qualcosa di antico e dolcissimo si sta svegliando...'],
    ],
  },
  finale: {
    dur: 14,
    frames: [[0, 8, -40], [26, 14, -10], [10, 26, 26], [0, 60, -4]],
    looks: [[0, 8, 0], [0, 10, 0], [0, 14, 0], [0, 0, 0]],
    captions: [
      [0.02, 'Il nucleo rosa pulsa un\'ultima volta... e si apre come un fiore.'],
      [0.35, 'L\'Ombra Grigia si scioglie in una pioggia di coriandoli.'],
      [0.65, 'Ogni coriandolo che tocca terra restituisce un colore alla città.'],
      [0.88, 'Cuorcontento è salva. E Clomp... beh, Clomp è una leggenda coi capelli blu.'],
    ],
  },
  sagra: {
    dur: 6,
    frames: [[0, 10, -30], [0, 6, -18]],
    looks: [[0, 2, 0], [0, 2, 0]],
    captions: [[0.05, 'La Sagra della Focaccia è pronta a esplodere di bontà.']],
  },
};

const GIVER_NAMES: Record<string, string> = {
  pina: 'Nonna Pina', rosa: 'Signora Rosa', tonino: 'Tonino "Turbo"', focaccino: 'DJ Focaccino',
  sindaco: 'il Sindaco Malinconetti', bruscolo: 'Bruscolo', ugo: 'Ugo', spolverina: 'la Prof.ssa Spolverina',
  steve: 'Steve il Gabbiano', fata: 'la Fata del Carosello', gelsomino: 'Gelsomino', wanda: 'Wanda', anselmo: 'Anselmo',
};

const SAVE_KEY = 'clomp-cuorcontento-v1';

// ═══════════════════════════════════════════════════════════════════════
export class ClompGame {
  private hooks: EngineHooks;
  private canvas: HTMLCanvasElement;
  private mapCanvas: HTMLCanvasElement | null = null;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private raf = 0;
  private sfx = new SFX();
  private keys = new Set<string>();
  private destroyed = false;

  private world!: WorldData;
  private heartTex!: THREE.Texture;
  private hemi!: THREE.HemisphereLight;
  private sun!: THREE.DirectionalLight;
  private dayCol = new THREE.Color(0x8fd3ff);
  private nightCol = new THREE.Color(0x0e2347);
  private dayFog = new THREE.Color(0xbfe6ff);
  private nightFog = new THREE.Color(0x16304f);

  // auto
  private car!: THREE.Group;
  private carWheels: THREE.Mesh[] = [];
  private carHeading = 0; private carSpeed = 0; private carStun = 0;
  private carShield: THREE.Mesh | null = null; private carBoost = 0;
  private carItem: ItemKind | null = null;
  private headlights: THREE.SpotLight[] = [];

  // giocatore a piedi
  private player!: THREE.Group;
  private rig!: WalkRig;
  private onFoot = true;
  private pHeading = 0; private pJump = 0; private pJumpV = 0;
  private sword: THREE.Group | null = null;
  private hasSword = false; private attackT = 0; private swingArc: THREE.Mesh | null = null;
  private tenderitudine = 3;

  // entità
  private npcs: NpcRec[] = [];
  private npcById: Record<string, NpcRec> = {};
  private cat!: THREE.Group; private catActive = false;
  private marker!: THREE.Mesh; private markerOn = false; private markerPos = new THREE.Vector3();
  private pickups: PickupRec[] = [];
  private hearts: { spr: THREE.Sprite; x: number; z: number; taken: boolean }[] = [];
  private golds: { group: THREE.Group; x: number; z: number; taken: boolean }[] = [];
  private boxes: BoxRec[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private clouds: THREE.Group[] = [];

  // modalità
  private raceOn = false; private raceLaps = 2; private raceCp = 0; private raceLap = 0; private raceFinishedAi = 0;
  private battleOn = false;
  private karts: KartAI[] = [];
  private bossOn = false; private bossPhase = 0; private bossHp = 5; private bossFireT = 3; private bossMoveT = 0; private bossTarget = 0;
  private ombra!: THREE.Group; private ombraCore: THREE.Mesh | null = null;
  private sereno: THREE.Group | null = null;
  private blobs: BlobRec[] = [];

  // missione
  private mIdx = 0; private sIdx = 0; private mActive = false;
  private step: StepDef | null = null;
  private objective = ''; private stepTimer: number | null = null;
  private collectTotal = 0; private collectGot = 0;
  private talkNpc: string | null = null;
  private freeTarget: [number, number] | null = null;
  private flags: Flags = {};
  private sidesUnlocked = false; private sideNpcs: NpcRec[] = [];
  private activeSide: SideQuest | null = null; private sidesDone = 0; private sidesBaseline = 0;
  private dialogOpen = false; private dialogEnd: ((idx: number) => void) | null = null;
  private pendingOnEnd: (() => void) | null = null;

  // stato
  private love = 0; private heartsCount = 0; private goldCount = 0; private playSec = 0;
  private nightCur = 0; private nightTarget = 0;
  private grayCur = 0; private grayTarget = 0;
  private paused = false; private ended = false; private started = false;
  private cutscene: { key: CutsceneKey; t: number } | null = null;
  private shake = 0;
  private shout: HudData['shout'] = null; private shoutT = 0; private shoutId = 0;
  private hudT = 0; private mapT = 0;
  private chaseLinesT = 0;
  private caption = '';

  private onKeyDown = (e: KeyboardEvent) => this.keyDown(e);
  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.code); };
  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  constructor(hooks: EngineHooks, canvas: HTMLCanvasElement, minimap: HTMLCanvasElement | null) {
    this.hooks = hooks;
    this.canvas = canvas;
    this.mapCanvas = minimap;
  }

  // ── INIZIALIZZAZIONE ────────────────────────────────────────────────────
  init() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.scene = new THREE.Scene();
    this.scene.background = this.dayCol.clone();
    this.scene.fog = new THREE.Fog(this.dayFog.clone(), 120, 430);
    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.5, 700);
    this.camera.position.set(-60, 40, -140);

    this.hemi = new THREE.HemisphereLight(0xbfe3ff, 0x7fae6a, 1.15);
    this.sun = new THREE.DirectionalLight(0xfff1d6, 2.1);
    this.sun.position.set(70, 110, 40);
    this.scene.add(this.hemi, this.sun, this.sun.target);

    this.world = buildWorld(this.scene);
    this.heartTex = heartTexture();

    // nuvole vive
    for (let i = 0; i < 7; i++) {
      const c = new THREE.Group();
      const m = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
      for (let p = 0; p < 3; p++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(6 + Math.random() * 5, 8, 6), m);
        s.position.set(p * 8 - 8, Math.random() * 2, Math.random() * 4);
        s.scale.y = 0.55;
        c.add(s);
      }
      c.position.set(-260 + i * 85, 70 + Math.random() * 25, -200 + Math.random() * 380);
      this.clouds.push(c);
      this.scene.add(c);
    }

    // la Yaris
    this.car = makeYaris();
    this.car.position.set(this.world.carSpawn.x, 0, this.world.carSpawn.z);
    this.carHeading = this.world.carSpawn.heading;
    this.carWheels = this.car.userData.wheels as THREE.Mesh[];
    for (const s of [-1, 1]) {
      const sl = new THREE.SpotLight(0xfff3c4, 0, 42, 0.5, 0.4, 1.2);
      sl.position.set(2.1, 1, 0.55 * s);
      const tgt = new THREE.Object3D();
      tgt.position.set(14, 0, 0.55 * s);
      this.car.add(sl, tgt);
      sl.target = tgt;
      this.headlights.push(sl);
    }
    this.scene.add(this.car);

    // Clomp
    const c = makeClomp();
    this.player = c.group; this.rig = c.rig;
    this.player.position.set(this.world.playerSpawn.x, 0, this.world.playerSpawn.z);
    this.scene.add(this.player);

    // NPC fissi della storia
    const fixed: [string, string, string, number, number, number, number, Partial<{ hat: number; bun: boolean; cane: boolean }>][] = [
      ['pina', 'Nonna Pina', '#ff7b54', 0xef6f8e, 0x5a4632, 0xe8b58a, 0xd8d8d8, { bun: true }],
      ['rosa', 'Signora Rosa', '#ef6f8e', 0xef6f8e, 0x3a3f4a, 0xffd9b3, 0xf4f7fa, { bun: true }],
      ['tonino', 'Tonino "Turbo"', '#ffc93c', 0xffd166, 0x274c77, 0xe8b58a, 0x3a2b22, { hat: 0xd64545 }],
      ['focaccino', 'DJ Focaccino', '#2ec4b6', 0x2ec4b6, 0x2c3440, 0xc68863, 0x141824, { hat: 0x141824 }],
      ['sindaco', 'Sindaco Malinconetti', '#6fc3df', 0x6fc3df, 0x3a3f4a, 0xffd9b3, 0x888f9a, {}],
      ['bruscolo', 'Bruscolo', '#d64545', 0xd64545, 0x3a3f4a, 0xffd9b3, 0x8a3a2a, { hat: 0x2c3440 }],
      ['ugo', 'Ugo', '#8d939e', 0x8d939e, 0x5a4632, 0xe8b58a, 0xd8d8d8, { cane: true }],
      ['spolverina', 'Prof.ssa Spolverina', '#b8a1e0', 0xb8a1e0, 0x274c77, 0xffd9b3, 0xb04a2f, { bun: true }],
      ['gelsomino', 'Gelsomino', '#9db56b', 0x9db56b, 0x5a4632, 0xe8b58a, 0xd8d8d8, { hat: 0x8a5a33, cane: true }],
      ['wanda', 'Wanda', '#ef6f8e', 0xffd166, 0x3a3f4a, 0xffd9b3, 0xf4f7fa, { bun: true }],
      ['anselmo', 'Anselmo', '#77c4d4', 0x77c4d4, 0x2c3440, 0xe8b58a, 0x888f9a, { cane: true }],
    ];
    for (const [id, name, color, shirt, pants, skin, hair, extra] of fixed) {
      const spot = this.world.questSpots[id];
      this.addNpc(id, name, color, spot, { shirt, pants, skin, hair, ...extra }, false);
    }
    // Steve il gabbiano
    this.makeSeagull();
    // Fata (nascosta all'inizio)
    const fataG = makeFata();
    fataG.visible = false;
    this.scene.add(fataG);
    const fataRec: NpcRec = { id: 'fata', name: 'Fata del Carosello', color: '#ffd166', group: fataG, rig: { legL: fataG, legR: fataG, armL: fataG, armR: fataG, hair: fataG, head: fataG }, home: this.world.questSpots.fata, target: null, wait: 0, hop: 0, wanders: false };
    fataG.position.set(fataRec.home[0], 0, fataRec.home[1]);
    this.npcs.push(fataRec); this.npcById.fata = fataRec;

    // passanti che gironzolano
    for (const h of this.world.npcHomes) {
      this.addNpc(h.id, h.name, '#8d939e', h.spot, { shirt: h.shirt, pants: h.pants, skin: h.skin, hair: h.hair, hat: h.hat, bun: h.bun, cane: h.cane }, true);
    }

    // gatto
    this.cat = makeCat();
    this.cat.visible = false;
    this.scene.add(this.cat);

    // Ombra Grigia (per cutscene/boss)
    this.ombra = makeOmbra();
    this.ombraCore = this.ombra.userData.core as THREE.Mesh;
    this.ombra.visible = false;
    this.scene.add(this.ombra);

    // marcatore missione
    this.marker = makeDiamond(0xff5d8f);
    this.marker.visible = false;
    this.scene.add(this.marker);

    // cuoricini sparsi
    for (const [x, z] of this.world.heartSpots) {
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.heartTex, transparent: true, depthWrite: false }));
      spr.scale.setScalar(1.1);
      spr.position.set(x, 1.3, z);
      this.scene.add(spr);
      this.hearts.push({ spr, x, z, taken: false });
    }
    // focacce d'oro
    for (const [x, z] of this.world.goldFocacciaSpots) {
      const g = makePickup('focaccia');
      (g.userData.bob as THREE.Group).children.forEach(ch => {
        const mm = (ch as THREE.Mesh).material as THREE.MeshLambertMaterial;
        if (mm && mm.color) mm.color.set(0xffd700);
      });
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#ffd700'), transparent: true, opacity: 0.8, depthWrite: false }));
      glow.scale.setScalar(3); glow.position.y = 1;
      g.add(glow);
      g.position.set(x, 0, z);
      this.scene.add(g);
      this.golds.push({ group: g, x, z, taken: false });
    }

    // swing arc visual
    const arcGeo = new THREE.RingGeometry(0.6, 2.9, 16, 1, -Math.PI / 2.6, Math.PI / 1.3);
    this.swingArc = new THREE.Mesh(arcGeo, new THREE.MeshBasicMaterial({ color: 0xff8fb3, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    this.swingArc.rotation.x = -Math.PI / 2;
    this.scene.add(this.swingArc);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);

    this.clock.start();
    const loop = () => {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(loop);
      this.frame();
    };
    loop();
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
    this.sfx.stopMusic();
    this.sfx.stopEngine();
    this.renderer.dispose();
  }

  // ── API PUBBLICA ────────────────────────────────────────────────────────
  hasSave(): boolean { try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; } }

  newGame() {
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ok */ }
    this.sfx.unlock(); this.sfx.startMusic(); this.sfx.startEngine();
    this.started = true;
    this.startMission(0);
  }

  continueGame() {
    this.sfx.unlock(); this.sfx.startMusic(); this.sfx.startEngine();
    this.started = true;
    let s: { mIdx: number; love: number; hearts: number; gold: number; sides: string[]; flags: Flags; playSec: number; muted: boolean } | null = null;
    try { const raw = localStorage.getItem(SAVE_KEY); if (raw) s = JSON.parse(raw); } catch { s = null; }
    if (s) {
      this.mIdx = Math.min(s.mIdx, MISSIONS.length - 1);
      this.love = s.love; this.heartsCount = s.hearts; this.goldCount = s.gold;
      this.flags = s.flags || {}; this.playSec = s.playSec || 0;
      this.sidesDone = (s.sides || []).length;
      this.sfx.setMuted(!!s.muted);
      if (this.mIdx >= 2) this.unlockSides(s.sides || []);
      if (this.flags.goldenCar) this.paintCarGold();
      if (this.flags.hasSword) this.grantSword(true);
      if (this.mIdx < MISSIONS.length) {
        const giver = MISSIONS[this.mIdx].giver;
        this.freeTarget = this.world.questSpots[giver];
        this.objective = `Vai da ${GIVER_NAMES[giver] ?? giver}`;
      }
    } else this.startMission(0);
    this.hooks.toast('Bentornato a Cuorcontento!', 'info');
  }

  setPaused(p: boolean) {
    this.paused = p;
    this.hooks.paused(p);
    this.sfx.setEngine(0, false);
  }

  toggleMute(): boolean {
    this.sfx.setMuted(!this.sfx.muted);
    return this.sfx.muted;
  }

  /** la UI ha finito le righe (choiceIdx = -1 se nessuna scelta) */
  dialogDone(choiceIdx: number) {
    if (choiceIdx >= 0) {
      const payload = this.lastPayload;
      const choice = payload?.choices?.[choiceIdx];
      if (choice) {
        if (choice.love) this.addLove(choice.love);
        if (choice.flag) this.flags[choice.flag] = true;
        if (choice.reply && choice.reply.length) {
          // conserva il callback originale (es. avanza la missione) anche dopo la risposta
          this.openDialog({ lines: choice.reply, choices: undefined }, this.pendingOnEnd ?? (() => undefined));
          return;
        }
      }
    }
    this.finishDialog();
  }

  // ── NPC ─────────────────────────────────────────────────────────────────
  private addNpc(id: string, name: string, color: string, spot: [number, number], o: { shirt: number; pants: number; skin: number; hair: number; hat?: number; bun?: boolean; cane?: boolean }, wanders: boolean) {
    const n = makeNpc(o);
    n.group.position.set(spot[0], 0, spot[1]);
    this.scene.add(n.group);
    const rec: NpcRec = { id, name, color, group: n.group, rig: n.rig, home: spot, target: null, wait: Math.random() * 2, hop: 0, wanders };
    this.npcs.push(rec);
    this.npcById[id] = rec;
    return rec;
  }

  private makeSeagull() {
    const g = new THREE.Group();
    const white = new THREE.MeshLambertMaterial({ color: 0xf2f6fa, flatShading: true });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.7, 4, 8), white);
    body.rotation.z = Math.PI / 2;
    body.position.y = 1.4;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), white);
    head.position.set(0.55, 1.6, 0);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 6), new THREE.MeshLambertMaterial({ color: 0xffa500 }));
    beak.rotation.z = -Math.PI / 2;
    beak.position.set(0.88, 1.58, 0);
    const wingM = new THREE.MeshLambertMaterial({ color: 0xd9e2ea, flatShading: true });
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.3), wingM);
    w1.position.set(0, 1.65, 0.4);
    const w2 = w1.clone(); w2.position.z = -0.4;
    const eyeM = new THREE.MeshLambertMaterial({ color: 0x141824 });
    const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), eyeM);
    e1.position.set(0.66, 1.68, 0.14);
    const e2 = e1.clone(); e2.position.z = -0.14;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 6), new THREE.MeshLambertMaterial({ color: 0x8a5a33 }));
    pole.position.y = 0.55;
    g.add(body, head, beak, w1, w2, e1, e2, pole);
    const spot = this.world.questSpots.steve;
    g.position.set(spot[0], 0, spot[1]);
    g.rotation.y = Math.PI;
    this.scene.add(g);
    const rec: NpcRec = { id: 'steve', name: 'Steve il Gabbiano', color: '#8d939e', group: g, rig: { legL: g, legR: g, armL: w1, armR: w2, hair: g, head }, home: spot, target: null, wait: 0, hop: 0, wanders: false };
    this.npcs.push(rec); this.npcById.steve = rec;
  }

  // ── DIALOGHI ────────────────────────────────────────────────────────────
  private lastPayload: DialoguePayload | null = null;
  private openDialog(data: DialogueData, onEnd: () => void) {
    this.dialogOpen = true;
    this.pendingOnEnd = onEnd;
    this.lastPayload = { lines: data.lines, choices: data.choices ?? null };
    if (data.setFlag) this.flags[data.setFlag] = true;
    this.hooks.dialog(this.lastPayload);
    this.sfx.blip();
  }
  private finishDialog() {
    this.dialogOpen = false;
    this.lastPayload = null;
    this.hooks.dialog(null);
    const fn = this.pendingOnEnd;
    this.pendingOnEnd = null;
    if (fn) fn();
  }

  // ── MISSIONI ────────────────────────────────────────────────────────────
  private startMission(i: number) {
    this.mIdx = i; this.sIdx = 0; this.mActive = true;
    this.freeTarget = null;
    const m = MISSIONS[i];
    this.hooks.missionCard({ kind: 'start', title: m.title, zone: m.zone });
    this.enterStep();
  }

  private enterStep() {
    const m = MISSIONS[this.mIdx];
    const s = m.steps[this.sIdx];
    this.step = s;
    this.stepTimer = null;
    this.objective = s.label;
    this.markerOn = false;
    switch (s.t) {
      case 'cutscene':
        this.startCutscene(s.key);
        break;
      case 'night': this.nightTarget = 1; this.stepTimer = 3; break;
      case 'day': this.nightTarget = 0; this.stepTimer = 3; break;
      case 'graystart':
        this.grayTarget = 0.85; this.stepTimer = 2.5;
        this.toast('L\'Ombra Grigia sta rubando i colori di Cuorcontento!', 'warn');
        break;
      case 'grayend': this.grayTarget = 0; this.stepTimer = 2.5; break;
      case 'sword':
        this.grantSword(false);
        this.stepTimer = 2;
        break;
      case 'goto': {
        this.setMarker(s.x, s.z);
        this.stepTimer = s.timed ?? null;
        // durante la Notte Grigia, l'Ombra semina blob innocui (ma fastidiosi) sulle strade
        if (this.grayTarget > 0.5) {
          for (const [bx, bz] of [[-20, 20], [20, 44], [52, 62], [72, 72], [88, 90], [102, 102]] as [number, number][]) {
            this.spawnBlob(bx, bz, true);
          }
          this.toast('Dei blob grigi vagano per le strade! Colpiscili o schivali!', 'warn');
        }
        break;
      }
      case 'talk': {
        this.talkNpc = s.npc;
        const rec = this.npcById[s.npc];
        if (rec) {
          if (s.npc === 'fata') rec.group.visible = true;
          this.setMarker(rec.home[0], rec.home[1]);
        }
        break;
      }
      case 'collect': {
        this.collectTotal = s.spots.length; this.collectGot = 0;
        for (const [x, z] of s.spots) this.spawnPickup(s.kind, x, z);
        this.stepTimer = s.timed ?? null;
        this.updateCollectLabel();
        break;
      }
      case 'chase': {
        const [x, z] = s.spots[0];
        if (s.target === 'cat') {
          this.cat.visible = true;
          this.cat.position.set(x, 0, z);
          this.catActive = true;
          this.setMarker(x, z);
          this.sfx.meow();
        } else {
          const b = this.npcById.bruscolo;
          b.group.position.set(x, 0, z);
          b.home = [x, z];
          this.chaseIdx = 0;
          this.setMarker(x, z);
        }
        this.chaseIdx = 0;
        break;
      }
      case 'race': this.initRace(s.laps); break;
      case 'battle': this.initBattle(s.rivals); break;
      case 'sides': {
        this.sidesBaseline = this.sidesDone;
        if (!this.sidesUnlocked) this.unlockSides([]);
        this.toast('Cerca i diamanti VERDI in città: ogni Buona Azione è un motivo di gioia!', 'info');
        if (this.sidesDone >= this.sidesBaseline + s.count) this.completeStep();
        break;
      }
      case 'boss': this.initBoss(); break;
    }
  }
  private chaseIdx = 0;

  private updateCollectLabel() {
    if (this.step && this.step.t === 'collect') {
      this.objective = `${this.step.label} (${this.collectGot}/${this.collectTotal})`;
    }
  }

  private completeStep() {
    this.sIdx++;
    this.stepTimer = null;
    this.clearPickups();
    // ripulisci i blob "da strada" della Notte Grigia
    for (const b of this.blobs) if (b.harmless) this.scene.remove(b.mesh);
    this.blobs = this.blobs.filter(b => !b.harmless);
    const m = MISSIONS[this.mIdx];
    if (this.sIdx >= m.steps.length) this.completeMission();
    else this.enterStep();
  }

  private completeMission() {
    const m = MISSIONS[this.mIdx];
    this.mActive = false;
    this.step = null;
    this.talkNpc = null;
    this.addLove(m.rewardLove);
    this.sfx.success();
    const next = this.mIdx + 1 < MISSIONS.length ? MISSIONS[this.mIdx + 1] : null;
    this.hooks.missionCard({ kind: 'complete', title: m.title, reward: m.rewardLove, next: next ? next.title : undefined });
    // sblocca side dopo la seconda missione
    if (this.mIdx >= 1 && !this.sidesUnlocked) this.unlockSides([]);
    if (this.mIdx === 6) this.objective = 'Missione compiuta!';
    if (next) {
      this.mIdx++;
      const spot = this.world.questSpots[next.giver];
      this.freeTarget = spot;
      this.objective = `Prossima missione: vai da ${GIVER_NAMES[next.giver] ?? next.giver}`;
      this.setMarker(spot[0], spot[1]);
      this.marker.material = new THREE.MeshLambertMaterial({ color: 0xffc93c, emissive: 0xffc93c, emissiveIntensity: 0.9 });
    } else {
      this.objective = 'Gira libero per Cuorcontento! Cuoricini, focacce d\'oro e buone azioni ti aspettano.';
    }
    this.save();
  }

  private spawnPickup(kind: string, x: number, z: number) {
    const g = makePickup(kind as Parameters<typeof makePickup>[0]);
    g.position.set(x, 0, z);
    this.scene.add(g);
    this.pickups.push({ group: g, x, z, kind });
  }
  private clearPickups() {
    for (const p of this.pickups) this.scene.remove(p.group);
    this.pickups = [];
  }
  private setMarker(x: number, z: number) {
    this.markerOn = true;
    this.markerPos.set(x, 0, z);
    this.marker.visible = true;
    this.marker.material = new THREE.MeshLambertMaterial({ color: 0xff5d8f, emissive: 0xff5d8f, emissiveIntensity: 0.9 });
  }

  // ── SIDE QUESTS ─────────────────────────────────────────────────────────
  private unlockSides(doneIds: string[]) {
    this.sidesUnlocked = true;
    this.toast('Le BUONE AZIONI sono disponibili! Cerca i diamanti verdi in città (fanno anche brodo per il cuore).', 'info');
    const palette = [0xff8b7b, 0x43c6b8, 0xffd166, 0x6fc3df, 0x2ec4b6, 0xef6f8e, 0xf4a259, 0x8fd08a, 0x77c4d4, 0xb8a1e0, 0xff5d5d, 0x9db56b];
    SIDES.forEach((sq, i) => {
      if (doneIds.includes(sq.id)) return;
      const spot = this.world.sideSpots[i] ?? sq.spot;
      const rec = this.addNpc('side_' + sq.id, sq.npcName, sq.color, spot, {
        shirt: palette[i % palette.length], pants: 0x3a3f4a, skin: i % 2 ? 0xffd9b3 : 0xe8b58a, hair: [0x3a2b22, 0xd8d8d8, 0xb04a2f, 0x141824][i % 4],
        hat: i % 3 === 0 ? palette[(i + 4) % palette.length] : undefined, bun: i % 3 === 1,
      }, false);
      const mk = makeDiamond(0x63c04f);
      mk.position.set(spot[0], 3.2, spot[1]);
      this.scene.add(mk);
      rec.marker = mk;
      this.sideNpcs.push(rec);
    });
  }

  private startSide(rec: NpcRec) {
    const sq = SIDES.find(s => 'side_' + s.id === rec.id);
    if (!sq) return;
    this.openDialog(sq.intro, () => {
      this.activeSide = sq;
      this.spawnPickup(sq.kind, sq.target[0], sq.target[1]);
      if (rec.marker) { rec.marker.position.set(sq.target[0], 1.6, sq.target[1]); (rec.marker.material as THREE.MeshLambertMaterial).color.set(0xffc93c); }
      this.objective = `${sq.npcName}: ${sq.label}`;
      this.sfx.blip();
    });
  }

  private completeSide() {
    const sq = this.activeSide;
    if (!sq) return;
    this.activeSide = null;
    this.sidesDone++;
    this.addLove(2);
    this.toast(sq.thanks, 'love');
    this.sfx.chime();
    const rec2 = this.sideNpcs.find(r => r.id === rec2id(sq));
    if (rec2) {
      this.scene.remove(rec2.group);
      if (rec2.marker) this.scene.remove(rec2.marker);
      this.sideNpcs = this.sideNpcs.filter(r => r !== rec2);
      this.npcs = this.npcs.filter(r => r !== rec2);
      delete this.npcById[rec2.id];
    }
    if (this.step && this.step.t === 'sides') {
      const need = this.sidesBaseline + this.step.count;
      this.objective = `Motivi di gioia per il Sindaco: ${Math.min(this.sidesDone, need) - this.sidesBaseline}/${this.step.count}`;
      if (this.sidesDone >= need) this.completeStep();
    }
    this.save();
  }

  // ── GARA ────────────────────────────────────────────────────────────────
  private initRace(laps: number) {
    if (this.onFoot) this.enterCar(true);
    this.raceOn = true; this.raceLaps = laps; this.raceCp = 0; this.raceLap = 0; this.raceFinishedAi = 0;
    this.car.position.set(-206, 0, -166);
    this.carHeading = 0; this.carSpeed = 0;
    const cols = [0xd64545, 0x2ec4b6, 0xffc93c];
    const names = ['Tonino "Turbo"', 'Cugina Saetta', 'Zio Razzo'];
    for (let i = 0; i < 3; i++) {
      const k = makeKart(cols[i]);
      const x = -206, z = -176 - i * 9;
      k.position.set(x, 0, z);
      this.scene.add(k);
      this.karts.push({ group: k, wheels: k.userData.wheels as THREE.Mesh[], heading: 0, x, z, cp: 0, lap: 0, stun: 0, speed: 24, progress: -i, finished: false, hp: 0, fireT: 0, color: cols[i] });
      void names;
    }
    for (const [x, z] of this.world.ringItemSpots) this.spawnBox(x, z);
    this.toast('VIA! 2 giri dell\'Anello. F = usa power-up!', 'info');
    this.sfx.boom();
  }

  private endRace() {
    const pos = 1 + this.raceFinishedAi;
    this.flags.raceWin = pos === 1;
    this.cleanupKarts();
    this.raceOn = false;
    this.toast(pos === 1 ? 'PRIMO! La Yaris ha VOLATO!' : `Sei arrivato ${pos}°. La Yaris ti vuole bene lo stesso.`, pos === 1 ? 'love' : 'info');
    this.completeStep();
  }

  private initBattle(rivals: number) {
    if (this.onFoot) this.enterCar(true);
    this.battleOn = true;
    this.tenderitudine = 3;
    this.car.position.set(104, 0, -90);
    this.carHeading = Math.PI; this.carSpeed = 0;
    const cols = [0xd64545, 0x2ec4b6, 0xffc93c, 0xb8a1e0];
    for (let i = 0; i < rivals; i++) {
      const k = makeKart(cols[i % cols.length]);
      const a = (i / rivals) * Math.PI * 2;
      const x = 104 + Math.cos(a) * 12, z = -104 + Math.sin(a) * 12;
      k.position.set(x, 0, z);
      this.scene.add(k);
      const wps: [number, number][] = [];
      for (let w = 0; w < 6; w++) {
        const wa = (w / 6) * Math.PI * 2 + i;
        wps.push([104 + Math.cos(wa) * 13, -104 + Math.sin(wa) * 13]);
      }
      this.karts.push({ group: k, wheels: k.userData.wheels as THREE.Mesh[], heading: a, x, z, cp: 0, lap: 0, stun: 0, speed: 16, progress: 0, finished: false, hp: 3, fireT: 3 + Math.random() * 4, color: cols[i % cols.length], waypoints: wps, wpIdx: 0 });
    }
    for (const [x, z] of this.world.arenaItemSpots) this.spawnBox(x, z);
    this.toast('BATTAGLIA D\'AMORE! Colpisci i kart: 3 cuori ciascuno. F = usa power-up', 'info');
    this.sfx.boom();
  }

  private endBattle() {
    this.cleanupKarts();
    this.battleOn = false;
    this.toast('Il cortile è di nuovo di tutti!', 'love');
    this.completeStep();
  }

  private cleanupKarts() {
    for (const k of this.karts) this.scene.remove(k.group);
    this.karts = [];
    for (const b of this.boxes) this.scene.remove(b.group);
    this.boxes = [];
    for (const p of this.projectiles) this.scene.remove(p.mesh);
    this.projectiles = [];
    this.carItem = null;
    if (this.carShield) { this.car.remove(this.carShield); this.carShield = null; }
  }

  private spawnBox(x: number, z: number) {
    const g = makeItemBox();
    g.position.set(x, 0, z);
    this.scene.add(g);
    this.boxes.push({ group: g, x, z, respawn: 0 });
  }

  private randomItem(): ItemKind {
    const r = Math.random();
    return r < 0.4 ? 'shell' : r < 0.65 ? 'boost' : r < 0.85 ? 'confetti' : 'shield';
  }

  private useItem() {
    if (!this.carItem) return;
    const item = this.carItem;
    this.carItem = null;
    const fwd = new THREE.Vector3(Math.sin(this.carHeading), 0, Math.cos(this.carHeading));
    if (item === 'shell') {
      // cerca un kart davanti (progress maggiore) o il più vicino
      let target: KartAI | null = null;
      let best = Infinity;
      const myProg = this.raceOn ? this.raceLap * 1000 + this.raceCp * 40 : 0;
      for (const k of this.karts) {
        if (this.raceOn && k.progress <= myProg) continue;
        const d = (k.x - this.car.position.x) ** 2 + (k.z - this.car.position.z) ** 2;
        if (d < best) { best = d; target = k; }
      }
      this.fireShell(this.car.position.clone().add(new THREE.Vector3(0, 0.8, 0)), this.carHeading, target ? this.karts.indexOf(target) : -1);
    } else if (item === 'boost') {
      this.carBoost = 1.4;
      this.sfx.whoosh();
      this.burst(this.car.position.clone().add(new THREE.Vector3(0, 1, 0)), 'spark', 10);
    } else if (item === 'shield') {
      if (!this.carShield) {
        const sh = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 10), new THREE.MeshLambertMaterial({ color: 0x7fd0ff, transparent: true, opacity: 0.3, emissive: 0x7fd0ff, emissiveIntensity: 0.4 }));
        sh.position.y = 1;
        this.car.add(sh);
        this.carShield = sh;
      }
      this.sfx.sparkle();
    } else {
      // coriandoli: stordisce tutti i kart vicini
      for (const k of this.karts) {
        const d = Math.hypot(k.x - this.car.position.x, k.z - this.car.position.z);
        if (d < 11) { k.stun = 2.2; this.burst(new THREE.Vector3(k.x, 1.5, k.z), 'confetti', 16); }
      }
      this.sfx.pop();
      this.burst(this.car.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 'confetti', 24);
      this.shake = Math.max(this.shake, 0.3);
    }
    void fwd;
  }

  private fireShell(from: THREE.Vector3, heading: number, kartIdx: number) {
    const g = makeHeartShell();
    g.position.copy(from);
    this.scene.add(g);
    this.projectiles.push({ mesh: g, kind: 'shell', target: kartIdx >= 0 ? 'kart' : null, kartIdx, vx: Math.sin(heading) * 30, vz: Math.cos(heading) * 30, life: 4 });
    this.sfx.whoosh();
  }

  // ── BOSS ────────────────────────────────────────────────────────────────
  private initBoss() {
    if (!this.onFoot) this.exitCar(true);
    this.player.position.set(0, 0, -26);
    this.pHeading = 0;
    this.tenderitudine = 3;
    this.bossOn = true; this.bossPhase = 0; this.bossHp = 5;
    this.spawnWave(0);
    this.shoutSay('Ombra Grigia', 'Tu?! Il ragazzo dai capelli blu? Il mio grigio ti seppellirà!', '#3a4157');
    this.ombra.visible = true;
    this.ombra.position.set(0, 7, 8);
    this.ombra.scale.setScalar(1.1);
  }

  private spawnWave(w: number) {
    const n = w === 0 ? 4 : 6;
    for (let i = 0; i < n; i++) {
      const [bx, bz] = this.world.blobRing[(i * 2 + w) % this.world.blobRing.length];
      this.spawnBlob(bx, bz, false);
    }
    if (w > 0) this.shoutSay('Ombra Grigia', OMBRA_WAVE_LINES[Math.min(w - 1, OMBRA_WAVE_LINES.length - 1)], '#3a4157');
    this.sfx.boom();
  }

  private spawnBlob(x: number, z: number, harmless: boolean) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 7), new THREE.MeshLambertMaterial({ color: 0x3a4157, flatShading: true }));
    m.position.y = 0.9;
    const eM = new THREE.MeshLambertMaterial({ color: 0xf4f7fa });
    const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), eM);
    e1.position.set(0.25, 1.1, 0.75);
    const e2 = e1.clone(); e2.position.x = -0.25;
    g.add(m, e1, e2);
    g.position.set(x, 0, z);
    this.scene.add(g);
    this.blobs.push({ mesh: g, x, z, harmless, dead: false });
  }

  private hitOmbra() {
    this.bossHp--;
    this.burst(this.ombra.position.clone(), 'heart', 14);
    this.sfx.heart();
    this.shake = Math.max(this.shake, 0.5);
    if (this.bossHp > 0) {
      this.shoutSay('Ombra Grigia', OMBRA_HIT_LINES[5 - this.bossHp] ?? OMBRA_HIT_LINES[OMBRA_HIT_LINES.length - 1], '#3a4157');
    } else {
      this.ombra.visible = false;
      this.bossOn = false;
      this.confettiRain(4);
      this.sfx.levelup();
      this.completeStep();
    }
  }

  private rainT = 0;
  private confettiRain(sec: number) { this.rainT = sec; }

  // ── CUTSCENE ────────────────────────────────────────────────────────────
  private startCutscene(key: CutsceneKey) {
    this.cutscene = { key, t: 0 };
    if (key === 'gray') {
      this.ombra.visible = true;
      this.ombra.position.set(0, 28, -36);
      this.ombra.scale.setScalar(2.4);
    }
    if (key === 'finale') {
      this.sereno = makeSereno();
      this.sereno.position.set(0, 8, 0);
      this.scene.add(this.sereno);
      this.ombra.visible = false;
      this.confettiRain(8);
    }
  }

  private updateCutscene(dt: number) {
    if (!this.cutscene) return;
    const def = CUTSCENES[this.cutscene.key];
    this.cutscene.t += dt;
    const p = Math.min(1, this.cutscene.t / def.dur);
    const seg = def.frames.length - 1;
    const f = Math.min(seg - 0.0001, p * seg);
    const i = Math.floor(f);
    const t = f - i;
    const sm = t * t * (3 - 2 * t);
    const pos = new THREE.Vector3().lerpVectors(new THREE.Vector3(...def.frames[i]), new THREE.Vector3(...def.frames[Math.min(i + 1, seg)]), sm);
    const look = new THREE.Vector3().lerpVectors(new THREE.Vector3(...def.looks[i]), new THREE.Vector3(...def.looks[Math.min(i + 1, seg)]), sm);
    this.camera.position.copy(pos);
    this.camera.lookAt(look);
    let cap = '';
    for (const [at, txt] of def.captions) if (p >= at) cap = txt;
    this.caption = cap;
    if (p >= 1) {
      const key = this.cutscene.key;
      this.cutscene = null;
      this.caption = '';
      if (key === 'finale') this.paintCarGold();
      this.completeStep();
      if (key === 'finale' && !this.ended) {
        this.ended = true;
        this.freeTarget = null;
        this.hooks.ending({
          love: this.love, hearts: this.heartsCount, focacce: this.goldCount,
          sides: this.sidesDone, missions: MISSIONS.length, minutes: this.playSec / 60,
        });
      }
    }
  }

  private skipCutscene() {
    if (!this.cutscene) return;
    const def = CUTSCENES[this.cutscene.key];
    this.cutscene.t = def.dur;
  }

  // ── OGGETTI / AMORE ─────────────────────────────────────────────────────
  private addLove(n: number) {
    this.love = Math.max(0, this.love + n);
    if (n > 0) this.toast(`+${n} Amore Puro`, 'love');
  }

  toast(text: string, kind: 'info' | 'love' | 'warn' | 'fun' = 'info') {
    this.hooks.toast(text, kind);
  }

  private shoutSay(speaker: string, text: string, color: string) {
    this.shout = { speaker, text, color, id: ++this.shoutId };
    this.shoutT = 5;
  }

  private grantSword(silent: boolean) {
    if (!this.hasSword) {
      this.hasSword = true;
      this.sword = makeSword();
      this.sword.position.set(0, -0.5, 0);
      this.sword.rotation.x = -0.3;
      this.rig.armR.add(this.sword);
      this.flags.hasSword = true;
    }
    if (!silent) {
      this.sfx.levelup();
      this.burst(this.player.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 'heart', 26);
      this.burst(this.player.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 'spark', 16);
      this.toast('HAI OTTENUTO LA SPADA DELL\'AMORE! (F = fendente che cosparge di amore puro)', 'love');
    }
  }

  private paintCarGold() {
    const mat = this.car.userData.bodyMat as THREE.MeshLambertMaterial;
    mat.color.set(0xffd700);
    mat.emissive.set(0x6b5200);
    mat.emissiveIntensity = 0.35;
    this.flags.goldenCar = true;
  }

  // ── INPUT ───────────────────────────────────────────────────────────────
  private keyDown(e: KeyboardEvent) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    this.keys.add(e.code);
    if (e.repeat) return;
    this.sfx.unlock();
    if (e.code === 'Escape') {
      if (this.started && !this.ended) this.setPaused(!this.paused);
      return;
    }
    if (this.paused || !this.started) return;
    if (e.code === 'KeyM') { this.toast(this.toggleMute() ? 'Audio: silenzioso (che pace)' : 'Audio: di nuovo festa', 'info'); return; }
    if (this.dialogOpen) return;
    if (e.code === 'KeyE') {
      if (this.cutscene) { this.skipCutscene(); return; }
      this.interact();
      return;
    }
    if (e.code === 'KeyH') this.honk();
    if (e.code === 'KeyF') {
      if (this.onFoot && this.hasSword) this.swingSword();
      else if (!this.onFoot) this.useItem();
    }
    if (e.code === 'Space' && this.onFoot && this.pJump === 0) { this.pJumpV = 7.5; this.pJump = 0.0001; }
    if (e.code === 'KeyR' && !this.onFoot) {
      this.carSpeed = 0;
      this.car.position.y = 0;
      this.toast('Yaris rimessa in carreggiata. Capita anche ai migliori.', 'fun');
    }
  }

  private honk() {
    this.sfx.horn();
    const pos = this.onFoot ? this.player.position : this.car.position;
    for (const n of this.npcs) {
      const d = Math.hypot(n.group.position.x - pos.x, n.group.position.z - pos.z);
      if (d < 9) n.hop = 1;
    }
    if (this.catActive) this.cat.userData.hop = 1;
  }

  private interact() {
    const pos = this.onFoot ? this.player.position : this.car.position;
    // sali/scendi dalla macchina
    const carD = Math.hypot(this.car.position.x - this.player.position.x, this.car.position.z - this.player.position.z);
    if (this.onFoot) {
      if (carD < 4) { this.enterCar(false); return; }
    } else if (Math.abs(this.carSpeed) < 3) { this.exitCar(false); return; }
    // parla con NPC
    const talk = this.resolveTalkTarget(pos);
    if (talk) this.openTalk(talk);
  }

  private resolveTalkTarget(pos: THREE.Vector3): NpcRec | null {
    const maxD = this.onFoot ? 3.6 : 8;
    let best: NpcRec | null = null;
    let bestD = maxD;
    const candidates: NpcRec[] = [];
    if (this.talkNpc && this.npcById[this.talkNpc]) candidates.push(this.npcById[this.talkNpc]);
    for (const r of this.sideNpcs) candidates.push(r);
    for (const r of candidates) {
      if (!r.group.visible) continue;
      const d = Math.hypot(r.group.position.x - pos.x, r.group.position.z - pos.z);
      if (d < bestD) { bestD = d; best = r; }
    }
    return best;
  }

  private openTalk(rec: NpcRec) {
    if (rec.id.startsWith('side_')) { this.startSide(rec); return; }
    const m = MISSIONS[this.mIdx];
    const s = this.step;
    if (!this.mActive || !s || s.t !== 'talk' || s.npc !== rec.id) {
      // chiacchiere fuori missione
      const small = AMBIENT_TALK[rec.id];
      if (small) this.openDialog({ lines: small }, () => { /* nulla */ });
      return;
    }
    const raw = s.dialogue;
    const data: DialogueData = typeof raw === 'function' ? raw(this.flags) : raw;
    this.sfx.blip();
    void m;
    this.openDialog(data, () => {
      this.talkNpc = null;
      this.completeStep();
    });
  }

  private enterCar(silent: boolean) {
    this.onFoot = false;
    this.player.visible = false;
    if (!silent) this.sfx.pop();
    this.sfx.setEngine(0.1, true);
  }
  private exitCar(silent: boolean) {
    this.onFoot = true;
    this.player.visible = true;
    const right = new THREE.Vector3(Math.cos(this.carHeading), 0, -Math.sin(this.carHeading));
    this.player.position.copy(this.car.position).addScaledVector(right, 2.6);
    this.player.position.y = 0;
    this.pHeading = this.carHeading;
    this.carSpeed = 0;
    if (!silent) this.sfx.pop();
    this.sfx.setEngine(0, false);
  }

  private swingSword() {
    if (this.attackT > 0) return;
    this.attackT = 0.38;
    this.sfx.swing();
    const px = this.player.position.x, pz = this.player.position.z;
    const fx = Math.sin(this.pHeading), fz = Math.cos(this.pHeading);
    // arco visibile
    if (this.swingArc) {
      this.swingArc.position.set(px + fx * 1.4, 0.25, pz + fz * 1.4);
      this.swingArc.rotation.z = -this.pHeading;
      (this.swingArc.material as THREE.MeshBasicMaterial).opacity = 0.75;
    }
    this.burst(new THREE.Vector3(px + fx * 1.6, 1, pz + fz * 1.6), 'heart', 6);
    // colpisci blob
    for (const b of this.blobs) {
      if (b.dead) continue;
      const dx = b.x - px, dz = b.z - pz;
      const d = Math.hypot(dx, dz);
      if (d < 3.2) {
        const dot = (dx / d) * fx + (dz / d) * fz;
        if (dot > 0.2 || d < 1.8) {
          b.dead = true;
          this.scene.remove(b.mesh);
          this.burst(new THREE.Vector3(b.x, 1.2, b.z), 'heart', 12);
          this.sfx.heart();
          this.love += 1;
        }
      }
    }
    this.blobs = this.blobs.filter(b => !b.dead);
    // proiettili grigi
    for (const p of this.projectiles) {
      if (p.kind !== 'gray') continue;
      const d = Math.hypot(p.mesh.position.x - px, p.mesh.position.z - pz);
      if (d < 3) {
        p.life = 0;
        this.burst(p.mesh.position.clone(), 'spark', 8);
        this.sfx.pop();
      }
    }
    // Ombra
    if (this.bossOn && this.bossPhase >= 2 && this.ombra.visible) {
      const d = Math.hypot(this.ombra.position.x - px, this.ombra.position.z - pz);
      if (d < 5.5) this.hitOmbra();
    }
  }

  // ── AGGIORNAMENTO ───────────────────────────────────────────────────────
  private frame() {
    const dt = Math.min(0.05, this.clock.getDelta());
    if (!this.paused && this.started) {
      if (this.cutscene) {
        this.updateCutscene(dt);
        this.updateAmbient(dt);
      } else if (!this.dialogOpen) {
        if (!this.ended) this.playSec += dt;
        this.updateSim(dt);
        this.updateAmbient(dt);
      }
      this.updateFx(dt);
    }
    // notte / grigio sempre lisci
    this.nightCur += (this.nightTarget - this.nightCur) * Math.min(1, dt * 1.2);
    this.grayCur += (this.grayTarget - this.grayCur) * Math.min(1, dt * 1.5);
    this.applyAtmosphere();
    this.renderer.render(this.scene, this.camera);
    this.hudT += dt;
    if (this.hudT > 0.1) { this.hudT = 0; this.pushHud(); }
    this.mapT += dt;
    if (this.mapT > 0.12) { this.mapT = 0; this.drawMinimap(); }
  }

  private updateAmbient(dt: number) {
    // nuvole
    for (let i = 0; i < this.clouds.length; i++) {
      const c = this.clouds[i];
      c.position.x += dt * (1.2 + i * 0.15);
      if (c.position.x > 320) c.position.x = -320;
    }
    // giostra
    const spin = this.world.carousel.userData.spin as THREE.Group;
    spin.rotation.y += dt * (this.grayCur > 0.5 ? -0.4 : 0.6);
    // fontana
    const fh = (this.world.carousel.parent as THREE.Scene) === this.scene ? null : null;
    void fh;
    // NPC che gironzolano
    for (const n of this.npcs) {
      if (!n.group.visible) continue;
      if (n.hop > 0) {
        n.hop -= dt * 2.4;
        n.group.position.y = Math.abs(Math.sin(n.hop * Math.PI)) * 0.6;
      } else n.group.position.y = 0;
      if (!n.wanders) {
        n.rig.head.rotation.y = Math.sin(this.clock.elapsedTime * 0.7 + n.home[0]) * 0.2;
        continue;
      }
      const gp = n.group.position;
      if (n.target) {
        const dx = n.target[0] - gp.x, dz = n.target[1] - gp.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.6) { n.target = null; n.wait = 1.5 + Math.random() * 4; }
        else {
          const h = Math.atan2(dx, dz);
          n.group.rotation.y = h - Math.PI / 2;
          gp.x += (dx / d) * 1.7 * dt;
          gp.z += (dz / d) * 1.7 * dt;
          this.walkAnim(n.rig, this.clock.elapsedTime * 6);
        }
      } else {
        n.wait -= dt;
        if (n.wait < 0) {
          const a = Math.random() * Math.PI * 2;
          const r = 3 + Math.random() * 5;
          n.target = [n.home[0] + Math.cos(a) * r, n.home[1] + Math.sin(a) * r];
        }
      }
    }
    // gatto
    if (this.catActive) {
      const hop = (this.cat.userData.hop as number) || 0;
      if (hop > 0) {
        this.cat.userData.hop = hop - dt * 2;
        this.cat.position.y = Math.abs(Math.sin(hop * Math.PI * 2)) * 0.7;
      } else this.cat.position.y = 0;
      (this.cat.userData.tail as THREE.Object3D).rotation.y = Math.sin(this.clock.elapsedTime * 5) * 0.4;
    }
    // fata fluttua
    const fata = this.npcById.fata;
    if (fata.group.visible) fata.group.position.y = 0.4 + Math.sin(this.clock.elapsedTime * 2) * 0.25;
  }

  private walkAnim(rig: WalkRig, t: number) {
    const s = Math.sin(t);
    // gli arti oscillano attorno all'asse trasversale (z locale):
    // il piede/mano si muove in avanti-indietro, non lateralmente
    rig.legL.rotation.z = s * 0.7;
    rig.legR.rotation.z = -s * 0.7;
    rig.armL.rotation.z = -s * 0.5;
    rig.armR.rotation.z = s * 0.5;
  }

  // ── SIMULAZIONE ─────────────────────────────────────────────────────────
  private updateSim(dt: number) {
    const k = this.keys;
    const up = k.has('KeyW') || k.has('ArrowUp');
    const down = k.has('KeyS') || k.has('ArrowDown');
    const left = k.has('KeyA') || k.has('ArrowLeft');
    const right = k.has('KeyD') || k.has('ArrowRight');
    const brake = k.has('Space');

    if (this.onFoot) {
      const sprint = k.has('ShiftLeft') || k.has('ShiftRight');
      const sp = sprint ? SPRINT : FOOT_SPEED;
      let mx = 0, mz = 0;
      if (up) { mx += Math.sin(this.pHeading); mz += Math.cos(this.pHeading); }
      if (down) { mx -= Math.sin(this.pHeading); mz -= Math.cos(this.pHeading); }
      if (left) this.pHeading += 2.6 * dt;
      if (right) this.pHeading -= 2.6 * dt;
      const len = Math.hypot(mx, mz);
      if (len > 0) {
        this.player.position.x += (mx / len) * sp * dt;
        this.player.position.z += (mz / len) * sp * dt;
        this.walkAnim(this.rig, this.clock.elapsedTime * (sprint ? 12 : 8));
      } else {
        this.rig.legL.rotation.z *= 0.8; this.rig.legR.rotation.z *= 0.8;
        this.rig.armL.rotation.z *= 0.8; this.rig.armR.rotation.z *= 0.8;
      }
      this.player.rotation.y = this.pHeading - Math.PI / 2;
      // salto
      if (this.pJump > 0 || this.pJumpV !== 0) {
        this.pJump += dt;
        this.player.position.y += this.pJumpV * dt;
        this.pJumpV -= 22 * dt;
        if (this.player.position.y <= 0) { this.player.position.y = 0; this.pJump = 0; this.pJumpV = 0; }
      }
      // spada swing visual
      if (this.attackT > 0) {
        this.attackT -= dt;
        if (this.sword) this.sword.rotation.z = Math.sin((0.38 - this.attackT) * 9) * 1.4;
      } else if (this.sword) this.sword.rotation.z *= 0.8;
      if (this.swingArc) (this.swingArc.material as THREE.MeshBasicMaterial).opacity = Math.max(0, this.attackT * 2);
      // collisioni a piedi
      this.resolveCollisions(this.player.position, 0.6);
      this.clampToWorld(this.player.position);
      this.updateCameraFoot(dt);
      this.sfx.setEngine(0, false);
    } else {
      // GUIDA
      if (this.carStun > 0) {
        this.carStun -= dt;
        this.carSpeed *= 0.95;
        this.car.rotation.z = Math.sin(this.clock.elapsedTime * 30) * 0.1;
      } else {
        this.car.rotation.z *= 0.85;
        const max = CAR_MAX + (this.carBoost > 0 ? 16 : 0);
        if (up) this.carSpeed = Math.min(max, this.carSpeed + CAR_ACC * dt);
        else if (down) this.carSpeed = Math.max(CAR_REV, this.carSpeed - CAR_ACC * 1.1 * dt);
        else this.carSpeed *= 1 - 1.4 * dt;
        if (brake) this.carSpeed *= 1 - 3.5 * dt;
        if (this.carBoost > 0) this.carBoost -= dt;
        const dir = this.carSpeed >= 0 ? 1 : -1;
        const turnAmt = TURN * dt * Math.min(1, Math.abs(this.carSpeed) / 9) * dir;
        if (left) this.carHeading += turnAmt * (brake ? 1.7 : 1);
        if (right) this.carHeading -= turnAmt * (brake ? 1.7 : 1);
      }
      const fx = Math.sin(this.carHeading), fz = Math.cos(this.carHeading);
      const nx = this.car.position.x + fx * this.carSpeed * dt;
      const nz = this.car.position.z + fz * this.carSpeed * dt;
      // collisioni
      const before = this.carSpeed;
      this.car.position.x = nx; this.car.position.z = nz;
      if (this.resolveCollisions(this.car.position, 1.9)) {
        if (Math.abs(before) > 12) { this.sfx.crash(); this.shake = Math.max(this.shake, 0.35); this.burst(this.car.position.clone().add(new THREE.Vector3(0, 1, 0)), 'spark', 6); }
        this.carSpeed *= -0.35;
      }
      this.clampToWorld(this.car.position);
      this.car.rotation.y = this.carHeading - Math.PI / 2;
      for (const w of this.carWheels) w.rotation.y += this.carSpeed * dt * 1.4;
      this.sfx.setEngine(Math.min(1, Math.abs(this.carSpeed) / CAR_MAX), true);
      this.updateCameraDrive(dt);
      // collisione con NPC: spavento bonario
      const now = performance.now();
      for (const n of this.npcs) {
        if (!n.group.visible) continue;
        const d = Math.hypot(n.group.position.x - this.car.position.x, n.group.position.z - this.car.position.z);
        if (d < 2.2 && Math.abs(this.carSpeed) > 4 && (!n.lastBonk || now - n.lastBonk > 2500)) {
          n.lastBonk = now;
          n.hop = 1;
          this.sfx.pop();
          this.toast(`${n.name}: "EHI! Guarda dove guidi, giovanotto dal ciuffo blu!"`, 'fun');
        }
      }
    }

    // raccolta cuoricini
    const pp = this.onFoot ? this.player.position : this.car.position;
    for (const h of this.hearts) {
      if (h.taken) continue;
      if (Math.hypot(h.x - pp.x, h.z - pp.z) < 2.2) {
        h.taken = true;
        h.spr.visible = false;
        this.heartsCount++;
        this.love += 1;
        this.sfx.coin();
        this.burst(new THREE.Vector3(h.x, 1.3, h.z), 'heart', 6);
        if (this.heartsCount % 10 === 0) this.toast(`Cuoricini: ${this.heartsCount}! Cuorcontento ti adora.`, 'love');
      }
      h.spr.position.y = 1.3 + Math.sin(this.clock.elapsedTime * 2 + h.x) * 0.2;
    }
    for (const g of this.golds) {
      if (g.taken) continue;
      if (Math.hypot(g.x - pp.x, g.z - pp.z) < 2.4) {
        g.taken = true;
        this.scene.remove(g.group);
        this.goldCount++;
        this.sfx.levelup();
        this.burst(new THREE.Vector3(g.x, 1.2, g.z), 'heart', 18);
        this.toast(`FOCACCIA D'ORO ${this.goldCount}/5! Da qualche parte, Nonna Pina piange di gioia.`, 'love');
        this.save();
      }
      g.group.userData.bob && ((g.group.userData.bob as THREE.Group).rotation.y += dt * 1.5);
    }

    // logica missione
    if (this.mActive && this.step) this.updateMissionStep(dt);

    // raccolta oggetto di una Buona Azione attiva
    if (this.activeSide && !(this.step && this.step.t === 'collect')) {
      for (let i = this.pickups.length - 1; i >= 0; i--) {
        const p = this.pickups[i];
        if (Math.hypot(p.x - pp.x, p.z - pp.z) < 2.6) {
          this.scene.remove(p.group);
          this.pickups.splice(i, 1);
          this.completeSide();
          break;
        }
      }
    }

    // prossima missione: vai dal mandante
    if (!this.mActive && this.freeTarget && this.mIdx < MISSIONS.length) {
      const d = Math.hypot(this.freeTarget[0] - pp.x, this.freeTarget[1] - pp.z);
      if (d < 5) this.startMission(this.mIdx);
    }

    // gara
    if (this.raceOn) this.updateRace(dt);
    if (this.battleOn) this.updateBattle(dt);
    if (this.bossOn) this.updateBoss(dt);
    this.updateKartsCommon(dt);
    this.updateProjectiles(dt);
    this.updateBoxes(dt);
    this.updateBlobs(dt);

    // rombi dell'Ombra durante la fuga (M10)
    if (this.step && this.step.t === 'goto' && this.grayTarget > 0.5) {
      this.chaseLinesT -= dt;
      if (this.chaseLinesT <= 0) {
        this.chaseLinesT = 9;
        this.shoutSay('Ombra Grigia', OMBRA_CHASE[Math.floor(Math.random() * OMBRA_CHASE.length)], '#3a4157');
      }
    }
  }

  private updateMissionStep(dt: number) {
    const s = this.step!;
    const pp = this.onFoot ? this.player.position : this.car.position;

    if (this.stepTimer !== null) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        if (s.t === 'collect' || s.t === 'goto') {
          this.toast('Tempo scaduto! Ma l\'amore non ha fretta: si riparte.', 'warn');
          this.sfx.fail();
          this.stepTimer = (s.t === 'collect' ? s.timed : (s as { timed?: number }).timed) ?? 60;
        } else {
          this.stepTimer = null;
          this.completeStep();
          return;
        }
      }
    }

    switch (s.t) {
      case 'goto': {
        const d = Math.hypot(s.x - pp.x, s.z - pp.z);
        if (d < (s.r ?? 6)) this.completeStep();
        break;
      }
      case 'talk': {
        // gestito da interact()
        break;
      }
      case 'collect': {
        for (let i = this.pickups.length - 1; i >= 0; i--) {
          const p = this.pickups[i];
          const d = Math.hypot(p.x - pp.x, p.z - pp.z);
          if (d < (this.onFoot ? 1.8 : 2.8)) {
            this.scene.remove(p.group);
            this.pickups.splice(i, 1);
            this.collectGot++;
            this.sfx.coin();
            this.burst(new THREE.Vector3(p.x, 1, p.z), 'heart', 5);
            this.updateCollectLabel();
          }
        }
        if (this.collectGot >= this.collectTotal) {
          if (s.doneLine) this.toast(s.doneLine, 'fun');
          this.completeStep();
        }
        break;
      }
      case 'chase': {
        const spots = s.spots;
        const t = this.chaseIdx < spots.length ? spots[this.chaseIdx] : null;
        if (t) {
          const tx = s.target === 'cat' ? this.cat.position.x : this.npcById.bruscolo.group.position.x;
          const tz = s.target === 'cat' ? this.cat.position.z : this.npcById.bruscolo.group.position.z;
          const d = Math.hypot(tx - pp.x, tz - pp.z);
          if (d < (this.onFoot ? 3 : 5)) {
            this.chaseIdx++;
            if (s.target === 'cat') this.sfx.meow(); else this.sfx.pop();
            if (this.chaseIdx >= spots.length) {
              if (s.target === 'cat') {
                this.cat.visible = false;
                this.catActive = false;
                this.toast('Mr. Baffi si è arreso alle coccole. Che colpo di scena.', 'fun');
              } else {
                this.toast('Bruscolo è a corto di fiato (e di scuse)!', 'fun');
              }
              this.completeStep();
            } else {
              const [nx, nz] = spots[this.chaseIdx];
              if (s.target === 'cat') { this.cat.position.set(nx, 0, nz); this.cat.userData.hop = 1; }
              else { this.npcById.bruscolo.group.position.set(nx, 0, nz); this.npcById.bruscolo.hop = 1; }
              this.setMarker(nx, nz);
            }
          }
        }
        break;
      }
      case 'sides': {
        // controllato in completeSide
        break;
      }
    }
  }

  private updateRace(dt: number) {
    const cps = this.world.raceCheckpoints;
    const cp = cps[this.raceCp];
    const d = Math.hypot(cp[0] - this.car.position.x, cp[1] - this.car.position.z);
    if (d < 13) {
      this.raceCp++;
      this.sfx.blip();
      if (this.raceCp >= cps.length) {
        this.raceCp = 0;
        this.raceLap++;
        this.toast(this.raceLap >= this.raceLaps ? 'ULTIMO TRAGUARDO!' : `Giro ${this.raceLap}/${this.raceLaps} completato!`, 'info');
        if (this.raceLap >= this.raceLaps) { this.endRace(); return; }
      }
    }
    const playerProg = this.raceLap * 1000 + this.raceCp * 40 - d * 0.05;
    for (const k of this.karts) {
      if (k.stun > 0) { k.stun -= dt; k.speed *= 0.96; }
      else {
        const kcp = cps[k.cp];
        const kd = Math.hypot(kcp[0] - k.x, kcp[1] - k.z);
        const want = Math.atan2(kcp[0] - k.x, kcp[1] - k.z);
        k.heading = angleLerp(k.heading, want, 3.2 * dt);
        const rubber = Math.max(-6, Math.min(7, (playerProg - k.progress) * 0.02));
        k.speed = Math.min(30, k.speed + (24 + rubber - k.speed) * dt * 1.5);
        if (kd < 13) {
          k.cp++;
          if (k.cp >= cps.length) {
            k.cp = 0; k.lap++;
            if (k.lap >= this.raceLaps && !k.finished) {
              k.finished = true;
              this.raceFinishedAi++;
              this.toast('Un rivale ha tagliato il traguardo! Dai, Clomp!', 'warn');
            }
          }
        }
        k.progress = k.lap * 1000 + k.cp * 40 - kd * 0.05;
      }
      k.x += Math.sin(k.heading) * k.speed * dt;
      k.z += Math.cos(k.heading) * k.speed * dt;
    }
  }

  private updateBattle(dt: number) {
    let alive = 0;
    for (const k of this.karts) {
      if (k.hp <= 0) continue;
      alive++;
      if (k.stun > 0) { k.stun -= dt; continue; }
      const wps = k.waypoints!;
      const wp = wps[k.wpIdx!];
      const kd = Math.hypot(wp[0] - k.x, wp[1] - k.z);
      if (kd < 3) k.wpIdx = (k.wpIdx! + 1) % wps.length;
      const want = Math.atan2(wp[0] - k.x, wp[1] - k.z);
      k.heading = angleLerp(k.heading, want, 4 * dt);
      k.x += Math.sin(k.heading) * k.speed * dt;
      k.z += Math.cos(k.heading) * k.speed * dt;
      // spara al giocatore
      k.fireT -= dt;
      if (k.fireT <= 0) {
        k.fireT = 5 + Math.random() * 4;
        const d = Math.hypot(this.car.position.x - k.x, this.car.position.z - k.z);
        if (d < 46) {
          const g = makeHeartShell();
          g.position.set(k.x, 0.8, k.z);
          (g.children[0] as THREE.Mesh).scale.setScalar(0.8);
          this.scene.add(g);
          this.projectiles.push({ mesh: g, kind: 'shell', target: 'player', kartIdx: -1, vx: 0, vz: 0, life: 5 });
          this.sfx.whoosh();
        }
      }
    }
    if (alive === 0) this.endBattle();
  }

  private updateKartsCommon(dt: number) {
    for (const k of this.karts) {
      if (k.hp <= 0 && this.battleOn) {
        k.group.position.y -= dt * 2;
        if (k.group.position.y < -3) { this.scene.remove(k.group); }
        continue;
      }
      k.group.position.set(k.x, k.group.position.y, k.z);
      k.group.rotation.y = k.heading - Math.PI / 2;
      if (k.stun > 0) k.group.rotation.z = Math.sin(this.clock.elapsedTime * 25) * 0.25;
      else k.group.rotation.z = 0;
      for (const w of k.wheels) w.rotation.y += k.speed * dt * 1.6;
    }
  }

  private updateBoss(dt: number) {
    const px = this.player.position.x, pz = this.player.position.z;
    // onde di blob
    const aliveBlobs = this.blobs.filter(b => !b.harmless).length;
    if (this.bossPhase === 0 && aliveBlobs === 0) { this.bossPhase = 1; this.spawnWave(1); }
    else if (this.bossPhase === 1 && aliveBlobs === 0) {
      this.bossPhase = 2;
      this.ombra.position.set(0, 6.5, 8);
      this.shoutSay('Ombra Grigia', 'Basta scherzare. ORA arriva il grigio VERO. Colpiscimi se hai il coraggio... e la spada.', '#3a4157');
      this.bossMoveT = 0; this.bossFireT = 2.5;
    }
    if (this.bossPhase >= 2 && this.ombra.visible) {
      // movimento
      this.bossMoveT -= dt;
      const paths = this.world.bossPath;
      const tgt = paths[this.bossTarget % paths.length];
      const ox = this.ombra.position.x, oz = this.ombra.position.z;
      const dd = Math.hypot(tgt[0] - ox, tgt[1] - oz);
      if (dd > 1) {
        this.ombra.position.x += ((tgt[0] - ox) / dd) * 6 * dt;
        this.ombra.position.z += ((tgt[1] - oz) / dd) * 6 * dt;
      } else {
        this.bossTarget++;
        this.bossMoveT = 2;
      }
      this.ombra.position.y = 6.5 + Math.sin(this.clock.elapsedTime * 1.5) * 0.6;
      this.ombra.rotation.y += dt * 0.4;
      if (this.ombraCore) (this.ombraCore.material as THREE.MeshLambertMaterial).emissiveIntensity = 1 + Math.sin(this.clock.elapsedTime * 6) * 0.5;
      // spara
      this.bossFireT -= dt;
      if (this.bossFireT <= 0) {
        this.bossFireT = 3.2;
        for (let i = -1; i <= 1; i++) {
          const grp = new THREE.Group();
          const ball = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), new THREE.MeshLambertMaterial({ color: 0x555c70, emissive: 0x33384a, emissiveIntensity: 0.6 }));
          grp.add(ball);
          grp.position.set(ox, 4, oz);
          this.scene.add(grp);
          const ang = Math.atan2(px - ox, pz - oz) + i * 0.35;
          this.projectiles.push({ mesh: grp, kind: 'gray', target: 'player', kartIdx: -1, vx: Math.sin(ang) * 15, vz: Math.cos(ang) * 15, life: 5 });
        }
        this.sfx.hit();
      }
    }
  }

  private updateBlobs(dt: number) {
    const px = this.onFoot ? this.player.position.x : this.car.position.x;
    const pz = this.onFoot ? this.player.position.z : this.car.position.z;
    for (const b of this.blobs) {
      const dx = px - b.x, dz = pz - b.z;
      const d = Math.hypot(dx, dz);
      const sp = b.harmless ? 2.2 : 3.6;
      if (d > 0.5) {
        b.x += (dx / d) * sp * dt;
        b.z += (dz / d) * sp * dt;
      }
      b.mesh.position.set(b.x, Math.abs(Math.sin(this.clock.elapsedTime * 4 + b.x)) * 0.3, b.z);
      b.mesh.rotation.y += dt;
      const hitR = this.onFoot ? 1.4 : 2.4;
      if (d < hitR) {
        if (b.harmless && !this.onFoot) {
          b.dead = true;
          this.scene.remove(b.mesh);
          this.carStun = Math.max(this.carStun, 0.7);
          this.sfx.hit();
          this.burst(new THREE.Vector3(b.x, 1, b.z), 'spark', 10);
        } else if (!b.harmless && this.onFoot && this.bossOn) {
          b.dead = true;
          this.scene.remove(b.mesh);
          this.tenderitudine--;
          this.sfx.hit();
          this.shake = Math.max(this.shake, 0.5);
          this.burst(this.player.position.clone().add(new THREE.Vector3(0, 1, 0)), 'spark', 10);
          if (this.tenderitudine <= 0) {
            this.tenderitudine = 3;
            this.player.position.set(0, 0, -30);
            this.toast('Clomp barcolla... ma l\'amore lo rimette in piedi!', 'warn');
          }
        }
      }
    }
    this.blobs = this.blobs.filter(b => !b.dead);
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      let tx = p.mesh.position.x + p.vx * dt;
      let tz = p.mesh.position.z + p.vz * dt;
      if (p.target === 'kart' && p.kartIdx >= 0) {
        const k = this.karts[p.kartIdx];
        if (k && !(this.battleOn && k.hp <= 0)) {
          const want = Math.atan2(k.x - p.mesh.position.x, k.z - p.mesh.position.z);
          const cur = Math.atan2(p.vx, p.vz);
          const nh = angleLerp(cur, want, 5 * dt);
          const sp = 32;
          p.vx = Math.sin(nh) * sp; p.vz = Math.cos(nh) * sp;
        }
      } else if (p.target === 'player') {
        const cx = this.car.position.x, cz = this.car.position.z;
        const plx = this.onFoot ? this.player.position.x : cx;
        const plz = this.onFoot ? this.player.position.z : cz;
        const want = Math.atan2(plx - p.mesh.position.x, plz - p.mesh.position.z);
        const cur = Math.atan2(p.vx, p.vz);
        const nh = angleLerp(cur, want, 3.2 * dt);
        const sp = p.kind === 'gray' ? 15 : 26;
        p.vx = Math.sin(nh) * sp; p.vz = Math.cos(nh) * sp;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.y += dt * 8;
      tx = p.mesh.position.x; tz = p.mesh.position.z;

      // collisioni guscio del giocatore → kart
      if (p.kind === 'shell' && p.target !== 'player') {
        for (const k of this.karts) {
          if (this.battleOn && k.hp <= 0) continue;
          const d = Math.hypot(k.x - tx, k.z - tz);
          if (d < 1.8) {
            p.life = 0;
            this.burst(new THREE.Vector3(k.x, 1, k.z), 'heart', 12);
            this.sfx.hit();
            if (this.battleOn) {
              k.hp--;
              k.stun = 1.6;
              if (k.hp <= 0) this.toast('Un kart è stato sommerso d\'amore! Ne resta qualcuno?', 'fun');
            } else {
              k.stun = 1.8;
              k.speed = 6;
            }
            break;
          }
        }
      }
      // guscio nemico → giocatore
      if (p.kind === 'shell' && p.target === 'player') {
        const cx = this.car.position.x, cz = this.car.position.z;
        if (Math.hypot(cx - tx, cz - tz) < 2.2) {
          p.life = 0;
          if (this.carShield) {
            this.car.remove(this.carShield);
            this.carShield = null;
            this.sfx.sparkle();
            this.toast('Lo Scudo di Tenerezza ha assorbito il colpo!', 'info');
          } else {
            this.carStun = 1.4;
            this.shake = Math.max(this.shake, 0.4);
            this.sfx.hit();
            if (this.battleOn) {
              this.tenderitudine--;
              if (this.tenderitudine <= 0) {
                this.toast('L\'amore non si arrende! Si riparte!', 'warn');
                this.resetBattle();
              }
            }
          }
        }
      }
      // grigio → giocatore a piedi
      if (p.kind === 'gray' && this.onFoot) {
        if (Math.hypot(this.player.position.x - tx, this.player.position.z - tz) < 1.3) {
          p.life = 0;
          this.tenderitudine--;
          this.sfx.hit();
          this.shake = Math.max(this.shake, 0.4);
          if (this.tenderitudine <= 0) {
            this.tenderitudine = 3;
            this.player.position.set(0, 0, -30);
            this.toast('Una botta di grigio! Ma Clomp si rialza, come sempre.', 'warn');
          }
        }
      }
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private resetBattle() {
    this.tenderitudine = 3;
    this.car.position.set(104, 0, -90);
    this.carHeading = Math.PI; this.carSpeed = 0; this.carStun = 0;
    this.karts.forEach((k, i) => {
      const a = (i / this.karts.length) * Math.PI * 2;
      k.x = 104 + Math.cos(a) * 12; k.z = -104 + Math.sin(a) * 12;
      k.hp = 3; k.stun = 0; k.group.position.y = 0;
      if (k.group.parent === null) this.scene.add(k.group);
    });
  }

  private updateBoxes(dt: number) {
    const pp = this.onFoot ? this.player.position : this.car.position;
    for (const b of this.boxes) {
      if (b.respawn > 0) {
        b.respawn -= dt;
        if (b.respawn <= 0) b.group.visible = true;
        continue;
      }
      const box = b.group.userData.box as THREE.Mesh;
      box.rotation.y += dt * 2;
      box.position.y = 1 + Math.sin(this.clock.elapsedTime * 3 + b.x) * 0.15;
      if (!this.onFoot && Math.hypot(b.x - pp.x, b.z - pp.z) < 2.6 && !this.carItem) {
        this.carItem = this.randomItem();
        b.group.visible = false;
        b.respawn = 6;
        this.sfx.coin();
        this.toast(`Power-up: ${ITEM_INFO[this.carItem].name}! (F per usarlo)`, 'fun');
      }
    }
  }

  // ── FISICA BASE ─────────────────────────────────────────────────────────
  private resolveCollisions(pos: THREE.Vector3, radius: number): boolean {
    let hit = false;
    for (const c of this.world.colliders) {
      if (pos.x < c.minX - radius || pos.x > c.maxX + radius || pos.z < c.minZ - radius || pos.z > c.maxZ + radius) continue;
      const nx = Math.max(c.minX, Math.min(pos.x, c.maxX));
      const nz = Math.max(c.minZ, Math.min(pos.z, c.maxZ));
      const dx = pos.x - nx, dz = pos.z - nz;
      const d2 = dx * dx + dz * dz;
      if (d2 < radius * radius) {
        hit = true;
        const d = Math.sqrt(d2) || 0.001;
        if (d2 > 0.0001) {
          pos.x = nx + (dx / d) * radius;
          pos.z = nz + (dz / d) * radius;
        } else {
          const l = pos.x - c.minX, r = c.maxX - pos.x, t = pos.z - c.minZ, btm = c.maxZ - pos.z;
          const m = Math.min(l, r, t, btm);
          if (m === l) pos.x = c.minX - radius;
          else if (m === r) pos.x = c.maxX + radius;
          else if (m === t) pos.z = c.minZ - radius;
          else pos.z = c.maxZ + radius;
        }
      }
    }
    return hit;
  }

  private clampToWorld(pos: THREE.Vector3) {
    const B = this.world.bounds - 6;
    pos.x = Math.max(-B, Math.min(B, pos.x));
    pos.z = Math.max(-B, Math.min(B, pos.z));
    pos.y = Math.max(0, pos.y);
  }

  // ── CAMERA ──────────────────────────────────────────────────────────────
  private updateCameraDrive(dt: number) {
    const f = 1 - Math.exp(-5.5 * dt);
    const fx = Math.sin(this.carHeading), fz = Math.cos(this.carHeading);
    const target = new THREE.Vector3(this.car.position.x - fx * 9.5, 4.7, this.car.position.z - fz * 9.5);
    this.camera.position.lerp(target, f);
    this.camera.lookAt(this.car.position.x + fx * 5, 1.4, this.car.position.z + fz * 5);
    const wantFov = 62 + Math.min(1, Math.abs(this.carSpeed) / 40) * 10;
    this.camera.fov += (wantFov - this.camera.fov) * Math.min(1, dt * 4);
    this.camera.updateProjectionMatrix();
    this.applyShake();
  }
  private updateCameraFoot(dt: number) {
    const f = 1 - Math.exp(-6 * dt);
    const fx = Math.sin(this.pHeading), fz = Math.cos(this.pHeading);
    const target = new THREE.Vector3(this.player.position.x - fx * 6.2, 3.4, this.player.position.z - fz * 6.2);
    this.camera.position.lerp(target, f);
    this.camera.lookAt(this.player.position.x + fx * 2, 1.6, this.player.position.z + fz * 2);
    this.camera.fov += (60 - this.camera.fov) * Math.min(1, dt * 4);
    this.camera.updateProjectionMatrix();
    this.applyShake();
  }
  private applyShake() {
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - this.clock.getDelta() * 0 - 0.016);
      this.camera.position.x += (Math.random() - 0.5) * this.shake;
      this.camera.position.y += (Math.random() - 0.5) * this.shake;
    }
  }

  // ── EFFETTI ─────────────────────────────────────────────────────────────
  private burst(at: THREE.Vector3, kind: 'heart' | 'spark' | 'confetti', n: number) {
    const colors = [0xff5d8f, 0xffc93c, 0x2ec4b6, 0xff8b7b, 0x63c04f];
    for (let i = 0; i < n; i++) {
      let mesh: THREE.Object3D;
      if (kind === 'heart') {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.heartTex, transparent: true, depthWrite: false }));
        s.scale.setScalar(0.5 + Math.random() * 0.5);
        mesh = s;
      } else if (kind === 'spark') {
        mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.12 + Math.random() * 0.12), new THREE.MeshBasicMaterial({ color: 0xfff3b0 }));
      } else {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.03), new THREE.MeshBasicMaterial({ color: colors[i % colors.length] }));
      }
      mesh.position.copy(at);
      this.scene.add(mesh);
      const a = Math.random() * Math.PI * 2;
      const v = 2 + Math.random() * 5;
      this.particles.push({
        mesh, vx: Math.cos(a) * v, vy: 3 + Math.random() * 5, vz: Math.sin(a) * v,
        life: 0.9 + Math.random() * 0.5, max: 1.2, grav: kind === 'confetti' ? 4 : 9, spin: (Math.random() - 0.5) * 10,
      });
    }
  }

  private updateFx(dt: number) {
    // particelle
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.scene.remove(p.mesh); this.particles.splice(i, 1); continue; }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= p.grav * dt;
      if (p.mesh.position.y < 0.1) { p.mesh.position.y = 0.1; p.vy = Math.abs(p.vy) * 0.3; }
      p.mesh.rotation.z += p.spin * dt;
      p.mesh.rotation.x += p.spin * 0.7 * dt;
      const s = Math.max(0.01, p.life / p.max);
      p.mesh.scale.setScalar(s * (p.mesh.scale.x > 0 ? 1 : 1));
    }
    // pioggia di coriandoli
    if (this.rainT > 0) {
      this.rainT -= dt;
      if (Math.random() < 0.5) {
        const x = this.camera.position.x + (Math.random() - 0.5) * 60;
        const z = this.camera.position.z + (Math.random() - 0.5) * 60;
        this.burst(new THREE.Vector3(x, 18, z), 'confetti', 2);
      }
    }
    // pickup bob
    for (const p of this.pickups) {
      const bob = p.group.userData.bob as THREE.Group | undefined;
      if (bob) { bob.rotation.y += dt * 2; bob.position.y = Math.sin(this.clock.elapsedTime * 3 + p.x) * 0.12; }
    }
    // marker
    if (this.markerOn && this.marker.visible) {
      this.marker.position.set(this.markerPos.x, 3.4 + Math.sin(this.clock.elapsedTime * 3) * 0.5, this.markerPos.z);
      this.marker.rotation.y += dt * 2.4;
    }
    // shout timer
    if (this.shout && this.shoutT > 0) {
      this.shoutT -= dt;
      if (this.shoutT <= 0) this.shout = null;
    }
    // cartelli missione
  }

  private applyAtmosphere() {
    const n = this.nightCur;
    const bg = this.scene.background as THREE.Color;
    bg.lerpColors(this.dayCol, this.nightCol, n);
    const fog = (this.scene.fog as THREE.Fog).color;
    fog.lerpColors(this.dayFog, this.nightFog, n);
    this.hemi.intensity = 1.15 - n * 0.8;
    this.sun.intensity = 2.1 - n * 1.8;
    for (const l of this.world.lamps) {
      l.bulb.emissiveIntensity = 0.1 + n * 1.6;
      (l.glow.material as THREE.SpriteMaterial).opacity = n * 0.85;
    }
    for (const h of this.headlights) h.intensity = n * 3.2;
    this.canvas.style.filter = this.grayCur > 0.01 ? `grayscale(${(this.grayCur * 0.92).toFixed(3)})` : '';
  }

  // ── HUD & MINIMAPPA ─────────────────────────────────────────────────────
  private promptText(): string {
    if (this.cutscene) return 'E · Salta la scena';
    if (this.dialogOpen) return '';
    const carD = Math.hypot(this.car.position.x - this.player.position.x, this.car.position.z - this.player.position.z);
    if (this.onFoot && carD < 4) return 'E · Sali sulla Yaris';
    if (!this.onFoot && Math.abs(this.carSpeed) < 3) {
      const talk = this.resolveTalkTarget(this.car.position);
      if (talk) return `E · Parla con ${talk.name}`;
      return 'E · Scendi dalla Yaris';
    }
    const pos = this.onFoot ? this.player.position : this.car.position;
    const talk = this.resolveTalkTarget(pos);
    if (talk) return `E · Parla con ${talk.name}`;
    if (this.onFoot && this.hasSword && (this.bossOn || this.blobs.length)) return 'F · Fendente dell\'Amore';
    return '';
  }

  private pushHud() {
    let lap: number | null = null, laps: number | null = null, pos: number | null = null, tot: number | null = null;
    if (this.raceOn) {
      lap = this.raceLap + 1; laps = this.raceLaps;
      const cp = this.world.raceCheckpoints[this.raceCp];
      const myProg = this.raceLap * 1000 + this.raceCp * 40 - Math.hypot(cp[0] - this.car.position.x, cp[1] - this.car.position.z) * 0.05;
      pos = 1 + this.karts.filter(k => k.progress > myProg).length;
      tot = this.karts.length + 1;
    }
    if (this.battleOn) { tot = this.karts.length; pos = this.karts.filter(k => k.hp > 0).length; }
    const h: HudData = {
      mode: this.onFoot ? 'foot' : 'drive',
      speed: Math.abs(Math.round(this.carSpeed * 3.6)),
      love: this.love,
      hearts: this.heartsCount,
      item: this.carItem,
      missionTitle: this.mActive && this.mIdx < MISSIONS.length ? MISSIONS[this.mIdx].title : (this.ended ? 'Giro libero' : 'Cuorcontento'),
      objective: this.objective,
      timer: this.stepTimer !== null && (this.step?.t === 'collect' || this.step?.t === 'goto') ? Math.max(0, Math.ceil(this.stepTimer)) : null,
      racePos: pos, raceTotal: tot, lap, laps,
      tenderitudine: this.tenderitudine,
      prompt: this.promptText(),
      timeOfDay: this.nightCur > 0.5 ? 'night' : 'day',
      grayscale: this.grayCur,
      sword: this.hasSword,
      sideCount: this.sidesDone,
      shout: this.shout,
      caption: this.cutscene ? this.caption : '',
    };
    this.hooks.hud(h);
  }

  private drawMinimap() {
    if (!this.mapCanvas) return;
    const ctx = this.mapCanvas.getContext('2d');
    if (!ctx) return;
    const S = 256 / (this.world.bounds * 2);
    const px = (v: number) => (v + this.world.bounds) * S;
    ctx.clearRect(0, 0, 256, 256);
    ctx.drawImage(this.world.minimap, 0, 0);
    const pp = this.onFoot ? this.player.position : this.car.position;
    // cuori d'oro rimanenti
    ctx.fillStyle = '#ffd700';
    for (const g of this.golds) if (!g.taken) { ctx.beginPath(); ctx.arc(px(g.x), px(g.z), 3, 0, Math.PI * 2); ctx.fill(); }
    // side npc
    ctx.fillStyle = '#63c04f';
    for (const r of this.sideNpcs) { ctx.beginPath(); ctx.arc(px(r.group.position.x), px(r.group.position.z), 3.4, 0, Math.PI * 2); ctx.fill(); }
    // gara: prossimo checkpoint
    if (this.raceOn) {
      const cp = this.world.raceCheckpoints[this.raceCp];
      ctx.fillStyle = '#ffc93c';
      ctx.beginPath(); ctx.arc(px(cp[0]), px(cp[1]), 5, 0, Math.PI * 2); ctx.fill();
    }
    // kart rivali
    for (const k of this.karts) {
      ctx.fillStyle = '#' + k.color.toString(16).padStart(6, '0');
      ctx.beginPath(); ctx.arc(px(k.x), px(k.z), 3.4, 0, Math.PI * 2); ctx.fill();
    }
    // boss
    if (this.bossOn && this.ombra.visible) {
      ctx.fillStyle = '#3a4157';
      ctx.beginPath(); ctx.arc(px(this.ombra.position.x), px(this.ombra.position.z), 6, 0, Math.PI * 2); ctx.fill();
    }
    // marcatore missione
    if (this.markerOn) {
      ctx.fillStyle = '#ff5d8f';
      ctx.save();
      ctx.translate(px(this.markerPos.x), px(this.markerPos.z));
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }
    // giocatore (freccia)
    const heading = this.onFoot ? this.pHeading : this.carHeading;
    ctx.save();
    ctx.translate(px(pp.x), px(pp.z));
    ctx.rotate(-heading + Math.PI);
    ctx.fillStyle = '#fffdf6';
    ctx.strokeStyle = '#16324f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(0, 3); ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // ── SALVATAGGIO ─────────────────────────────────────────────────────────
  private save() {
    try {
      const data = {
        mIdx: this.mIdx + (this.mActive ? 0 : 0),
        love: this.love, hearts: this.heartsCount, gold: this.goldCount,
        sides: SIDES.filter((_, i) => i < this.sidesDone).map(s => s.id),
        flags: this.flags, playSec: Math.round(this.playSec), muted: this.sfx.muted,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch { /* pazienza */ }
  }
}

const rec2id = (sq: SideQuest) => 'side_' + sq.id;

// chiacchiere ambientali fuori missione
const AMBIENT_TALK: Record<string, { speaker: string; color: string; text: string }[]> = {
  pina: [{ speaker: 'Nonna Pina', color: '#ff7b54', text: 'Mangia qualcosa, che sei sciupato. Gli eroi sciupati non ispirano nessuno.' }],
  rosa: [{ speaker: 'Signora Rosa', color: '#ef6f8e', text: 'Mr. Baffi oggi mi ha portato un topo finto. FINTO. Che pensiero moderno.' }],
  tonino: [{ speaker: 'Tonino "Turbo"', color: '#ffc93c', text: 'Sto mettendo il turbo all\'Ape. Se senti un\'esplosione, è progresso.' }],
  focaccino: [{ speaker: 'DJ Focaccino', color: '#2ec4b6', text: 'Sto scrivendo una canzone sulla tua Yaris. Si intitola "2007 (Anno del Cuore)".' }],
  sindaco: [{ speaker: 'Sindaco Malinconetti', color: '#6fc3df', text: 'Ho sorriso oggi. Due volte. Il Comune sta organizzando una festa nazionale.' }],
  bruscolo: [{ speaker: 'Bruscolo', color: '#d64545', text: 'Ora aiuto la Professoressa a riordinare i libri. Quelli di cucina. Per motivi di studio.' }],
  ugo: [{ speaker: 'Ugo', color: '#8d939e', text: 'Sai qual è il bello di non essere più un fantasma? Che adesso quando urlo "ciao" la gente risponde. Strano mondo.' }],
  spolverina: [{ speaker: 'Prof.ssa Spolverina', color: '#b8a1e0', text: 'La sezione "Eroi Locali" della biblioteca è vuota. Sto pensando a chi dedicarla... mh, capelli blu... no, non mi viene in mente nessuno.' }],
  steve: [{ speaker: 'Steve il Gabbiano', color: '#8d939e', text: 'GAAK. Il mercato della pizza è in crescita. Non investire in patatine. GAAK.' }],
  fata: [{ speaker: 'Fata del Carosello', color: '#ffd166', text: 'La giostra gira perché giri tu. Non fermarti mai, sciocchino.' }],
  gelsomino: [{ speaker: 'Gelsomino', color: '#9db56b', text: 'Il geranio è guarito! Ora ha anche un amico: un vaso. Si vogliono bene a modo loro.' }],
  wanda: [{ speaker: 'Wanda', color: '#ef6f8e', text: 'Ho sognato di nuovo il gatto. Stavolta portava le calze a ME. Che mondo al contrario meraviglioso.' }],
  anselmo: [{ speaker: 'Anselmo', color: '#77c4d4', text: 'Non ti ringrazio per la focaccia. ...Grazie. Ecco, l\'ho detto. Ora vattene.' }],
};
