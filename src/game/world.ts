import * as THREE from 'three';
import { makeCarouselTree, makeFountain, makeStreetLamp, makeTree, makePalm, makeBench } from './props';

export interface Collider { minX: number; maxX: number; minZ: number; maxZ: number; }
export interface Lamp { bulb: THREE.MeshLambertMaterial; glow: THREE.Sprite; }

export interface WorldData {
  colliders: Collider[];
  minimap: HTMLCanvasElement;
  lamps: Lamp[];
  carSpawn: { x: number; z: number; heading: number };
  playerSpawn: { x: number; z: number };
  questSpots: Record<string, [number, number]>;
  npcHomes: { id: string; spot: [number, number]; shirt: number; pants: number; skin: number; hair: number; hat?: number; bun?: boolean; cane?: boolean; name: string }[];
  heartSpots: [number, number][];
  goldFocacciaSpots: [number, number][];
  sideSpots: [number, number][];
  raceCheckpoints: [number, number][];
  ringItemSpots: [number, number][];
  arenaCenter: [number, number];
  arenaItemSpots: [number, number][];
  catSpots: [number, number][];
  bruscoloSpots: [number, number][];
  bookSpots: [number, number][];
  deliverySpots: [number, number][];
  focacciaHouses: [number, number][];
  blobRing: [number, number][];
  bossPath: [number, number][];
  carouselPos: [number, number];
  carousel: THREE.Group;
  bounds: number;
  seaX: number;
}

const ROAD_LINES = [-156, -52, 52, 156];
const ROAD_W = 14;
const BOUNDS = 280;
const RING = 206;
const SEA_X = 246;

const BUILDING_COLORS = [0xff8b7b, 0x43c6b8, 0xffd166, 0x6fc3df, 0xf4a259, 0x8fd08a, 0xef6f8e, 0xf7f3e9, 0xb8a1e0, 0x77c4d4];

function addCollider(list: Collider[], x: number, z: number, w: number, d: number) {
  list.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
}

function building(scene: THREE.Scene, colliders: Collider[], x: number, z: number, w: number, d: number, h: number, color: number, awning = 0) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color, flatShading: true }));
  body.position.y = h / 2;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 0.5, d + 0.8), new THREE.MeshLambertMaterial({ color: new THREE.Color(color).multiplyScalar(0.72), flatShading: true }));
  roof.position.y = h + 0.25;
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.3), new THREE.MeshLambertMaterial({ color: 0x5a4632 }));
  door.position.set(0, 1.2, d / 2 + 0.1);
  g.add(body, roof, door);
  // finestre: fascia scara
  const winM = new THREE.MeshLambertMaterial({ color: 0x9fd8ef });
  const rows = Math.max(1, Math.floor(h / 5));
  for (let r = 0; r < rows; r++) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 1, 0.16), winM);
    win.position.set(0, 3.4 + r * 4.4, d / 2 + 0.05);
    if (3.4 + r * 4.4 < h - 0.6) g.add(win);
  }
  if (awning) {
    const aw = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 0.18, 2.2), new THREE.MeshLambertMaterial({ color: awning }));
    aw.position.set(0, 2.9, d / 2 + 1.1);
    g.add(aw);
  }
  g.position.set(x, 0, z);
  scene.add(g);
  addCollider(colliders, x, z, w + 0.6, d + 0.6);
}

export function buildWorld(scene: THREE.Scene): WorldData {
  const colliders: Collider[] = [];
  const lamps: Lamp[] = [];

  // ── terreno, mare, spiaggia ──
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(BOUNDS * 2 + 80, BOUNDS * 2 + 80),
    new THREE.MeshLambertMaterial({ color: 0x79c96e })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const sand = new THREE.Mesh(new THREE.PlaneGeometry(BOUNDS - 170, BOUNDS * 2 + 80), new THREE.MeshLambertMaterial({ color: 0xf2d98d }));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set((163 + SEA_X) / 2 + 6, 0.02, 0);
  scene.add(sand);

  const sea = new THREE.Mesh(new THREE.PlaneGeometry(90, BOUNDS * 2 + 80), new THREE.MeshLambertMaterial({ color: 0x2f9de0, transparent: true, opacity: 0.92 }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(SEA_X + 40, 0.05, 0);
  scene.add(sea);
  // il mare blocca... tranne il molo
  colliders.push({ minX: SEA_X + 2, maxX: 9999, minZ: -9999, maxZ: 31.6 });
  colliders.push({ minX: SEA_X + 2, maxX: 9999, minZ: 40.4, maxZ: 9999 });

  // ── strade a griglia ──
  const roadM = new THREE.MeshLambertMaterial({ color: 0x4d525e });
  const stripeM = new THREE.MeshBasicMaterial({ color: 0xf6f1e3 });
  for (const r of ROAD_LINES) {
    const h = new THREE.Mesh(new THREE.PlaneGeometry(BOUNDS * 2 - 60, ROAD_W), roadM);
    h.rotation.x = -Math.PI / 2; h.position.set(10, 0.03, r);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, BOUNDS * 2 - 60), roadM);
    v.rotation.x = -Math.PI / 2; v.position.set(r, 0.03, 0);
    scene.add(h, v);
    for (let s = -210; s <= 210; s += 14) {
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.4), stripeM);
      sh.rotation.x = -Math.PI / 2; sh.position.set(s, 0.045, r);
      const sv = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 5), stripeM);
      sv.rotation.x = -Math.PI / 2; sv.position.set(r, 0.045, s);
      scene.add(sh, sv);
    }
  }
  // ── strada anello (circuito) ──
  const ringM = new THREE.MeshLambertMaterial({ color: 0x5a4a6e });
  const mkRing = (w: number, d: number, x: number, z: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ringM);
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.035, z);
    scene.add(m);
  };
  const ringLen = RING * 2 + 12;
  mkRing(12, ringLen, -RING, 0);
  mkRing(12, ringLen, RING, 0);
  mkRing(ringLen, 12, 0, -RING);
  mkRing(ringLen, 12, 0, RING);
  // collegamenti anello-griglia
  mkRing(46, 10, -183, -156); mkRing(46, 10, 183, -156); mkRing(46, 10, -183, 156); mkRing(46, 10, 183, 156);

  // ── marciapiedi/piazze speciali ──
  const piazza = new THREE.Mesh(new THREE.PlaneGeometry(88, 88), new THREE.MeshLambertMaterial({ color: 0xd9d2c5 }));
  piazza.rotation.x = -Math.PI / 2; piazza.position.set(0, 0.04, 0);
  scene.add(piazza);

  const park = new THREE.Mesh(new THREE.PlaneGeometry(88, 88), new THREE.MeshLambertMaterial({ color: 0x5fbb58 }));
  park.rotation.x = -Math.PI / 2; park.position.set(104, 0.04, 104);
  scene.add(park);

  const lot = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshLambertMaterial({ color: 0x9aa0ab }));
  lot.rotation.x = -Math.PI / 2; lot.position.set(104, 0.04, -104);
  scene.add(lot);

  // ── edifici ──
  building(scene, colliders, -124, -88, 22, 20, 9, 0xf4a259, 0xd64545);   // casa di Nonna Pina (con insegna)
  building(scene, colliders, -84, -88, 16, 16, 7, 0x8fd08a);
  building(scene, colliders, -124, -124, 18, 14, 8, 0x6fc3df);
  building(scene, colliders, 124, 88, 18, 16, 10, 0xef6f8e);
  building(scene, colliders, 88, 124, 16, 16, 8, 0xffd166, 0x2ec4b6);
  building(scene, colliders, -88, 88, 20, 18, 12, 0x77c4d4);
  building(scene, colliders, -124, 124, 18, 16, 9, 0xf7f3e9);
  building(scene, colliders, 88, -88, 16, 16, 8, 0xb8a1e0);
  building(scene, colliders, 124, -124, 18, 18, 10, 0x43c6b8, 0xff8b7b); // pizzeria da Gennaro
  building(scene, colliders, -16, 124, 26, 20, 14, 0xff8b7b);             // scuola
  building(scene, colliders, 20, 124, 18, 18, 10, 0x6fc3df);
  building(scene, colliders, -16, -124, 24, 20, 16, 0xf7f3e9);            // municipio
  building(scene, colliders, 22, -124, 16, 16, 9, 0x8fd08a);
  building(scene, colliders, 124, -16, 18, 22, 11, 0xef6f8e);
  building(scene, colliders, 124, 22, 16, 18, 8, 0xffd166);
  building(scene, colliders, -124, -16, 20, 22, 13, 0x77c4d4);
  building(scene, colliders, -124, 24, 16, 16, 9, 0xf4a259);

  // parcheggio multipiano (il regno del "fantasma")
  const parkGarage = new THREE.Group();
  for (let f = 0; f < 3; f++) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(30, 0.6, 26), new THREE.MeshLambertMaterial({ color: 0x8d939e, flatShading: true }));
    slab.position.y = 1.5 + f * 4.4;
    parkGarage.add(slab);
    if (f < 2) {
      for (const px of [-13, 13]) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.4, 1.2), new THREE.MeshLambertMaterial({ color: 0x6d737e }));
        col.position.set(px, 3.7 + f * 4.4, 0);
        parkGarage.add(col);
      }
    }
  }
  parkGarage.position.set(-104, 0, 108);
  scene.add(parkGarage);
  addCollider(colliders, -104, 108, 30, 26);

  // ── Piazza del Cuore: fontana + chiosco + panchine ──
  const fountain = makeFountain();
  fountain.position.set(0, 0, 0);
  scene.add(fountain);
  addCollider(colliders, 0, 0, 9, 9);
  const kiosk = new THREE.Group();
  const kb = new THREE.Mesh(new THREE.BoxGeometry(4, 3.2, 3), new THREE.MeshLambertMaterial({ color: 0x2ec4b6, flatShading: true }));
  kb.position.y = 1.6;
  const kr = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.6, 4), new THREE.MeshLambertMaterial({ color: 0xd64545, flatShading: true }));
  kr.position.y = 3.9; kr.rotation.y = Math.PI / 4;
  kiosk.add(kb, kr);
  kiosk.position.set(28, 0, 26);
  scene.add(kiosk);
  addCollider(colliders, 28, 26, 4.4, 3.4);
  for (const [bx, bz] of [[-26, 20], [20, -26], [-20, -24], [26, -18]]) {
    const b = makeBench();
    b.position.set(bx, 0, bz);
    b.rotation.y = Math.atan2(bx, bz);
    scene.add(b);
  }

  // ── Parco dell'Amore: alberi, aiuole, laghetto, giostra ──
  const lake = new THREE.Mesh(new THREE.CircleGeometry(9, 20), new THREE.MeshLambertMaterial({ color: 0x4fb3e8 }));
  lake.rotation.x = -Math.PI / 2; lake.position.set(86, 0.05, 122);
  scene.add(lake);
  addCollider(colliders, 86, 122, 15, 15);
  const carouselPos: [number, number] = [120, 120];
  const carousel = makeCarouselTree();
  carousel.position.set(carouselPos[0], 0, carouselPos[1]);
  scene.add(carousel);
  addCollider(colliders, carouselPos[0], carouselPos[1], 8, 8);
  const treePos: [number, number][] = [
    [76, 80], [92, 72], [130, 76], [140, 92], [74, 100], [138, 108],
    [78, 140], [100, 144], [134, 140], [96, 96], [116, 92], [90, 132],
  ];
  for (const [tx, tz] of treePos) {
    const t = makeTree();
    t.position.set(tx, 0, tz);
    scene.add(t);
    addCollider(colliders, tx, tz, 1.4, 1.4);
  }
  // aiuole fiorite
  for (const [fx, fz] of [[104, 78], [78, 104], [132, 132]]) {
    const bed = new THREE.Mesh(new THREE.CircleGeometry(3, 12), new THREE.MeshLambertMaterial({ color: 0xd98cb3 }));
    bed.rotation.x = -Math.PI / 2;
    bed.position.set(fx, 0.05, fz);
    scene.add(bed);
  }

  // alberi cittadini
  const cityTrees: [number, number][] = [[-156, -20], [52, -84], [-52, 84], [156, 60], [-84, -156], [84, 156], [-156, 120], [30, 156]];
  for (const [tx, tz] of cityTrees) {
    const t = makeTree();
    t.position.set(tx + 10, 0, tz);
    scene.add(t);
    addCollider(colliders, tx + 10, tz, 1.4, 1.4);
  }
  // palme della spiaggia
  for (let i = 0; i < 7; i++) {
    const p = makePalm();
    const pz = -180 + i * 60;
    p.position.set(196, 0, pz);
    scene.add(p);
    addCollider(colliders, 196, pz, 1.2, 1.2);
  }

  // ── molo ──
  const pier = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.36, 5.6), new THREE.MeshLambertMaterial({ color: 0xb07b4f, flatShading: true }));
    plank.position.set(238 + i * 5.6, 0.18, 36);
    pier.add(plank);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.2, 6), new THREE.MeshLambertMaterial({ color: 0x8a5a33 }));
    post.position.set(238 + i * 5.6, 0.4, i % 2 === 0 ? 39 : 33);
    pier.add(post);
  }
  scene.add(pier);
  colliders.push({ minX: 236, maxX: 280, minZ: 32.4, maxZ: 33.2 });
  colliders.push({ minX: 236, maxX: 280, minZ: 38.8, maxZ: 39.6 });
  colliders.push({ minX: 275, maxX: 9999, minZ: 31.6, maxZ: 40.4 }); // fine del molo: la Yaris non salpa

  // ── lampioni agli incroci ──
  for (const rx of ROAD_LINES) {
    for (const rz of ROAD_LINES) {
      for (const [ox, oz] of [[10, 10], [-10, -10]]) {
        const lamp = makeStreetLamp();
        lamp.group.position.set(rx + ox, 0, rz + oz);
        scene.add(lamp.group);
        lamps.push({ bulb: lamp.bulb, glow: lamp.glow });
      }
    }
  }

  // ── muretto del cortile della furia (arena) ──
  const arenaCenter: [number, number] = [104, -104];
  const wallM = new THREE.MeshLambertMaterial({ color: 0xd9a05b, flatShading: true });
  const walls: [number, number, number, number, number, number][] = [
    [104, -126, 46, 1.6, 2.2, 0], [104, -82, 46, 1.6, 2.2, 0], [82, -104, 1.6, 46, 2.2, 1], [126, -104, 1.6, 46, 2.2, 1],
  ];
  for (const [wx, wz, ww, wd, wh] of walls) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(ww, wh, wd), wallM);
    w.position.set(wx, wh / 2, wz);
    scene.add(w);
    addCollider(colliders, wx, wz, ww, wd);
  }
  // scivolo e altalena scenografici
  const slide = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 1.6), new THREE.MeshLambertMaterial({ color: 0xff8b7b }));
  slide.position.set(116, 1.4, -116); slide.rotation.z = -0.4; slide.rotation.y = 0.6;
  scene.add(slide);
  const swing = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.BoxGeometry(5, 0.25, 0.25), new THREE.MeshLambertMaterial({ color: 0x2ec4b6 }));
  bar.position.y = 2.6;
  swing.add(bar);
  for (const sx of [-2.3, 2.3]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 0.2), new THREE.MeshLambertMaterial({ color: 0x2ec4b6 }));
    leg.position.set(sx, 1.3, 0);
    swing.add(leg);
  }
  swing.position.set(92, 0, -92);
  scene.add(swing);

  // ── punti d'interesse ──
  const questSpots: Record<string, [number, number]> = {
    pina: [-112, -76], rosa: [90, 66], tonino: [14, 14], focaccino: [262, 36],
    sindaco: [-16, 12], bruscolo: [104, -74], ugo: [-104, 92], spolverina: [-16, 108],
    steve: [270, 36], fata: [120, 112],
    gelsomino: [-140, -80], wanda: [-60, 80], anselmo: [60, -80],
    pizzeria: [124, -112], garage: [-100, -120],
  };

  const npcHomes: WorldData['npcHomes'] = [
    { id: 'w_g1', name: 'Ambrogio', spot: [-160, -40], shirt: 0x9db56b, pants: 0x5a4632, skin: 0xe8b58a, hair: 0xd8d8d8, hat: 0x8a5a33 },
    { id: 'w_g2', name: 'Cunegonda', spot: [-40, 160], shirt: 0xef6f8e, pants: 0x3a3f4a, skin: 0xffd9b3, hair: 0xf4f7fa, bun: true },
    { id: 'w_g3', name: 'Ermes', spot: [160, 40], shirt: 0x6fc3df, pants: 0x274c77, skin: 0xc68863, hair: 0x3a2b22 },
    { id: 'w_g4', name: 'Doralice', spot: [40, -160], shirt: 0xffd166, pants: 0x6d4c77, skin: 0xffd9b3, hair: 0xb04a2f, bun: true },
    { id: 'w_g5', name: 'Tancredi', spot: [-160, 60], shirt: 0x2ec4b6, pants: 0x3a3f4a, skin: 0xe8b58a, hair: 0x888f9a, cane: true },
    { id: 'w_g6', name: 'Vitalia', spot: [60, 160], shirt: 0xff8b7b, pants: 0x274c77, skin: 0xffd9b3, hair: 0x3a2b22 },
  ];

  // cuoricini sparsi lungo i marciapiedi (40)
  const heartSpots: [number, number][] = [];
  {
    const offsets = [-196, -130, -64, 0, 64, 130, 196];
    let i = 0;
    outer:
    for (const r of ROAD_LINES) {
      for (const o of offsets) {
        if (heartSpots.length >= 40) break outer;
        if (i % 2 === 0) heartSpots.push([r + 10, o + (i % 3) * 4]);
        else heartSpots.push([o + (i % 3) * 4, r - 10]);
        i++;
      }
    }
  }
  const goldFocacciaSpots: [number, number][] = [[128, 138], [268, 42], [-88, 122], [196, 196], [0, -196]];
  const sideSpots: [number, number][] = [
    [-146, -40], [40, -146], [146, 40], [-40, 146], [64, 40], [-146, 146],
    [166, -40], [-40, -166], [166, -146], [-166, -40], [40, 166], [146, 166],
  ];

  // circuito: checkpoints orari, 20
  const raceCheckpoints: [number, number][] = [];
  {
    const lin = [-140, -70, 0, 70, 140];
    for (const z of lin) raceCheckpoints.push([-RING, z]);
    for (const x of lin) raceCheckpoints.push([x, RING]);
    for (let i = lin.length - 1; i >= 0; i--) raceCheckpoints.push([RING, lin[i]]);
    for (let i = lin.length - 1; i >= 0; i--) raceCheckpoints.push([lin[i], -RING]);
  }
  const ringItemSpots: [number, number][] = [
    [-RING, -RING + 20], [0, RING - 16], [RING - 20, RING], [RING, 0],
    [RING - 20, -RING], [0, -RING + 16], [-RING + 20, -RING], [-RING, 20],
  ];
  const arenaItemSpots: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    arenaItemSpots.push([104 + Math.cos(a) * 13, -104 + Math.sin(a) * 13]);
  }

  const catSpots: [number, number][] = [[96, 86], [122, 94], [112, 132], [130, 122], [132, 132]];
  const bruscoloSpots: [number, number][] = [[22, 12], [-20, -14], [16, -22], [-8, 20]];
  const bookSpots: [number, number][] = [[8, 8], [-12, 5], [5, -14], [-18, -10], [18, -6]];
  const focacciaHouses: [number, number][] = [[-140, -80], [-60, 80], [60, -80]];
  const deliverySpots: [number, number][] = [
    [-140, -80], [-60, 80], [60, -80], [-130, 52], [140, 72], [88, -144], [-68, -148], [150, 150],
  ];
  const blobRing: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    blobRing.push([Math.cos(a) * 30, Math.sin(a) * 30]);
  }
  const bossPath: [number, number][] = [[10, 10], [-16, 6], [4, -18], [-8, -10], [18, -8]];

  // ── minimappa base ──
  const minimap = document.createElement('canvas');
  minimap.width = minimap.height = 256;
  const mc = minimap.getContext('2d')!;
  const S = 256 / (BOUNDS * 2);
  const px = (v: number) => (v + BOUNDS) * S;
  mc.fillStyle = '#6fbf67';
  mc.fillRect(0, 0, 256, 256);
  mc.fillStyle = '#5fbb58';
  mc.fillRect(px(60), px(60), 88 * S, 88 * S);
  mc.fillStyle = '#f2d98d';
  mc.fillRect(px(163), 0, (SEA_X - 163 + 20) * S, 256);
  mc.fillStyle = '#2f9de0';
  mc.fillRect(px(SEA_X + 4), 0, 256 - px(SEA_X + 4), 256);
  mc.fillStyle = '#4d525e';
  for (const r of ROAD_LINES) {
    mc.fillRect(px(-BOUNDS + 30), px(r - ROAD_W / 2), (BOUNDS * 2 - 60) * S, ROAD_W * S);
    mc.fillRect(px(r - ROAD_W / 2), px(-BOUNDS + 30), ROAD_W * S, (BOUNDS * 2 - 60) * S);
  }
  mc.fillStyle = '#5a4a6e';
  mc.fillRect(px(-RING - 6), px(-RING - 6), 12 * S, (RING * 2 + 12) * S);
  mc.fillRect(px(RING - 6), px(-RING - 6), 12 * S, (RING * 2 + 12) * S);
  mc.fillRect(px(-RING - 6), px(-RING - 6), (RING * 2 + 12) * S, 12 * S);
  mc.fillRect(px(-RING - 6), px(RING - 6), (RING * 2 + 12) * S, 12 * S);
  mc.fillStyle = '#d9d2c5';
  mc.fillRect(px(-44), px(-44), 88 * S, 88 * S);
  mc.fillStyle = '#9aa0ab';
  mc.fillRect(px(69), px(-139), 70 * S, 70 * S);
  mc.fillStyle = '#b07b4f';
  mc.fillRect(px(236), px(33), 40 * S, 6 * S);
  mc.fillStyle = '#c96f6f';
  const blds: [number, number, number, number][] = [
    [-124, -88, 22, 20], [-84, -88, 16, 16], [-124, -124, 18, 14], [124, 88, 18, 16], [88, 124, 16, 16],
    [-88, 88, 20, 18], [-124, 124, 18, 16], [88, -88, 16, 16], [124, -124, 18, 18], [-16, 124, 26, 20],
    [20, 124, 18, 18], [-16, -124, 24, 20], [22, -124, 16, 16], [124, -16, 18, 22], [124, 22, 16, 18],
    [-124, -16, 20, 22], [-124, 24, 16, 16], [-104, 108, 30, 26],
  ];
  for (const [x, z, w, d] of blds) mc.fillRect(px(x - w / 2), px(z - d / 2), w * S, d * S);

  return {
    colliders, minimap, lamps,
    carSpawn: { x: -100, z: -124, heading: Math.PI },
    playerSpawn: { x: -104, z: -118 },
    questSpots, npcHomes, heartSpots, goldFocacciaSpots, sideSpots,
    raceCheckpoints, ringItemSpots, arenaCenter, arenaItemSpots,
    catSpots, bruscoloSpots, bookSpots, deliverySpots, focacciaHouses,
    blobRing, bossPath, carouselPos, carousel,
    bounds: BOUNDS, seaX: SEA_X,
  };
}
