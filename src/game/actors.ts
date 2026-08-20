import * as THREE from 'three';
import type { ItemKind, PickupKind } from './types';

// ── Materiali di base ─────────────────────────────────────────────────────
const lam = (c: number, e = 0, ec = 0x000000) =>
  new THREE.MeshLambertMaterial({ color: c, flatShading: true, emissive: ec, emissiveIntensity: e });

export function blobShadow(w: number, d: number): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(1, 18),
    new THREE.MeshBasicMaterial({ color: 0x10233f, transparent: true, opacity: 0.22, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.scale.set(w, d, 1);
  m.position.y = 0.02;
  return m;
}

export function heartTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, 64, 64);
  g.fillStyle = '#ff5d8f';
  g.beginPath();
  g.moveTo(32, 56);
  g.bezierCurveTo(4, 36, 4, 12, 20, 10);
  g.bezierCurveTo(28, 9, 32, 16, 32, 20);
  g.bezierCurveTo(32, 16, 36, 9, 44, 10);
  g.bezierCurveTo(60, 12, 60, 36, 32, 56);
  g.fill();
  g.fillStyle = '#ffd7e6';
  g.beginPath(); g.ellipse(21, 20, 6, 4, -0.5, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  return t;
}

export function glowTexture(color: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  grad.addColorStop(0, color);
  grad.addColorStop(0.4, color + 'aa');
  grad.addColorStop(1, color + '00');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function questionTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffc93c';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#16324f';
  g.lineWidth = 10;
  g.strokeRect(8, 8, 112, 112);
  g.fillStyle = '#16324f';
  g.font = '900 88px Rubik, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('?', 64, 70);
  return new THREE.CanvasTexture(c);
}

// ── La Toyota Yaris 2007 ──────────────────────────────────────────────────
export function makeYaris(paint = 0xcfd6dd) {
  const g = new THREE.Group();
  const bodyMat = lam(paint);
  const dark = lam(0x2c3440);
  const glass = lam(0x9fd8ef);

  const lower = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.85, 1.95), bodyMat);
  lower.position.y = 0.72;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.78, 1.75), bodyMat);
  cabin.position.set(-0.15, 1.45, 0);
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 1.6), glass);
  windshield.position.set(1.02, 1.42, 0);
  windshield.rotation.z = 0.42;
  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.66, 1.6), glass);
  rearGlass.position.set(-1.32, 1.44, 0);
  rearGlass.rotation.z = -0.5;
  const sideGlassL = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 0.06), glass);
  sideGlassL.position.set(-0.15, 1.5, 0.88);
  const sideGlassR = sideGlassL.clone(); sideGlassR.position.z = -0.88;

  const wheels: THREE.Mesh[] = [];
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.34, 14);
  const hubGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.36, 8);
  const hubMat = lam(0xdfe5ea);
  for (const [x, z] of [[1.35, 0.95], [1.35, -0.95], [-1.35, 0.95], [-1.35, -0.95]]) {
    const w = new THREE.Mesh(wheelGeo, dark);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.42, z);
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.rotation.x = Math.PI / 2;
    w.add(hub);
    wheels.push(w);
    g.add(w);
  }

  const headMat = new THREE.MeshLambertMaterial({ color: 0xfff3b0, emissive: 0xfff3b0, emissiveIntensity: 0.5 });
  const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.5), headMat);
  hl1.position.set(2.16, 0.85, 0.55);
  const hl2 = hl1.clone(); hl2.position.z = -0.55;
  const tailMat = new THREE.MeshLambertMaterial({ color: 0xff4d5e, emissive: 0xff2233, emissiveIntensity: 0.6 });
  const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.4), tailMat);
  tl1.position.set(-2.16, 0.9, 0.6);
  const tl2 = tl1.clone(); tl2.position.z = -0.6;
  const bumperF = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 1.95), dark);
  bumperF.position.set(2.14, 0.42, 0);
  const bumperR = bumperF.clone(); bumperR.position.x = -2.14;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.7), lam(0xf4f7fa));
  plate.position.set(-2.19, 0.62, 0);
  const mirrorL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.1), bodyMat);
  mirrorL.position.set(0.95, 1.32, 1.02);
  const mirrorR = mirrorL.clone(); mirrorR.position.z = -1.02;

  g.add(lower, cabin, windshield, rearGlass, sideGlassL, sideGlassR, hl1, hl2, tl1, tl2, bumperF, bumperR, plate, mirrorL, mirrorR);
  const shadow = blobShadow(2.7, 1.4);
  g.add(shadow);
  g.userData = { wheels, bodyMat, headMat };
  return g;
}

// ── Clomp: capelli blu fino al fondoschiena ───────────────────────────────
export interface WalkRig { legL: THREE.Object3D; legR: THREE.Object3D; armL: THREE.Object3D; armR: THREE.Object3D; hair: THREE.Object3D; head: THREE.Object3D; }

function makeWalker(opts: { shirt: number; pants: number; skin: number; hair: number; scale?: number; longHair?: boolean; hat?: number; bun?: boolean; cane?: boolean }): { group: THREE.Group; rig: WalkRig } {
  const s = opts.scale ?? 1;
  const g = new THREE.Group();
  const shirtM = lam(opts.shirt);
  const pantsM = lam(opts.pants);
  const skinM = lam(opts.skin);
  const hairM = lam(opts.hair);

  const legL = new THREE.Group(); legL.position.set(0, 0.5, 0.14);
  const legR = new THREE.Group(); legR.position.set(0, 0.5, -0.14);
  const ll = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.22), pantsM); ll.position.y = -0.25;
  const lr = ll.clone();
  legL.add(ll); legR.add(lr);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.42), shirtM);
  torso.position.y = 0.85;

  const armL = new THREE.Group(); armL.position.set(0, 1.08, 0.36);
  const armR = new THREE.Group(); armR.position.set(0, 1.08, -0.36);
  const al = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), skinM); al.position.y = -0.28;
  const ar = al.clone();
  armL.add(al); armR.add(ar);

  const head = new THREE.Group(); head.position.y = 1.42;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), skinM);
  skull.position.y = 0.22;
  const eyeM = lam(0x16324f);
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), eyeM);
  e1.position.set(0.26, 0.26, 0.11);
  const e2 = e1.clone(); e2.position.z = -0.11;
  const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), hairM);
  hairTop.position.set(-0.02, 0.28, 0);
  hairTop.scale.set(1.04, 0.92, 1.06);
  head.add(skull, e1, e2, hairTop);

  let hair: THREE.Object3D = hairTop;
  if (opts.longHair) {
    const mane = new THREE.Group();
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.5), hairM);
    back.position.set(-0.26, -0.42, 0);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.4, 6), hairM);
    tip.rotation.z = Math.PI;
    tip.position.set(-0.26, -1.08, 0);
    tip.scale.set(0.5, 1, 1.6);
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.12), hairM);
    sideL.position.set(-0.05, -0.18, 0.27);
    const sideR = sideL.clone(); sideR.position.z = -0.27;
    mane.add(back, tip, sideL, sideR);
    mane.position.y = 0.3;
    head.add(mane);
    hair = mane;
  }
  if (opts.hat !== undefined) {
    const hatB = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.06, 12), lam(opts.hat));
    hatB.position.y = 0.42;
    const hatT = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.26, 12), lam(opts.hat));
    hatT.position.y = 0.56;
    head.add(hatB, hatT);
  }
  if (opts.bun) {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), hairM);
    bun.position.set(-0.22, 0.5, 0);
    head.add(bun);
  }

  g.add(legL, legR, torso, armL, armR, head);
  if (opts.cane) {
    const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), lam(0x8a5a33));
    cane.position.set(0.1, 0.42, 0.5);
    cane.rotation.x = 0.12;
    g.add(cane);
  }
  const shadow = blobShadow(0.55, 0.55);
  g.add(shadow);
  g.scale.setScalar(s);
  return { group: g, rig: { legL, legR, armL, armR, hair, head } };
}

export function makeClomp() {
  return makeWalker({ shirt: 0xff7b54, pants: 0x274c77, skin: 0xffd9b3, hair: 0x35a7ff, longHair: true });
}

export function makeNpc(o: { shirt: number; pants: number; skin: number; hair: number; hat?: number; bun?: boolean; cane?: boolean; scale?: number }) {
  return makeWalker(o);
}

export function makeKart(color: number) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.45, 1.35), lam(color));
  body.position.y = 0.5;
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.7), lam(color));
  nose.position.set(1.1, 0.42, 0);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.9), lam(0x2c3440));
  seat.position.set(-0.55, 0.85, 0);
  const driver = makeNpc({ shirt: 0xf4f7fa, pants: 0x2c3440, skin: 0xffd9b3, hair: 0x3a2b22, scale: 0.62 });
  driver.group.position.set(-0.45, 0.55, 0);
  const wheels: THREE.Mesh[] = [];
  const wg = new THREE.CylinderGeometry(0.34, 0.34, 0.3, 10);
  const wm = lam(0x222831);
  for (const [x, z] of [[0.75, 0.72], [0.75, -0.72], [-0.75, 0.78], [-0.75, -0.78]]) {
    const w = new THREE.Mesh(wg, wm);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.34, z);
    wheels.push(w);
    g.add(w);
  }
  g.add(body, nose, seat, driver.group);
  g.add(blobShadow(1.5, 1.0));
  g.userData = { wheels };
  return g;
}

export function makeCat() {
  const g = new THREE.Group();
  const fur = lam(0xff9f43);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.34, 0.34), fur);
  body.position.y = 0.36;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.32), fur);
  head.position.set(0.5, 0.55, 0);
  const earG = new THREE.ConeGeometry(0.08, 0.16, 4);
  const e1 = new THREE.Mesh(earG, fur); e1.position.set(0.45, 0.76, 0.1);
  const e2 = new THREE.Mesh(earG, fur); e2.position.set(0.45, 0.76, -0.1);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.6, 6), fur);
  tail.position.set(-0.5, 0.6, 0);
  tail.rotation.z = -0.9;
  const eyeM = lam(0x16324f);
  const ey1 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeM);
  ey1.position.set(0.68, 0.6, 0.08);
  const ey2 = ey1.clone(); ey2.position.z = -0.08;
  g.add(body, head, e1, e2, tail, ey1, ey2);
  g.add(blobShadow(0.5, 0.4));
  g.userData = { tail };
  return g;
}

export function makeOmbra() {
  const g = new THREE.Group();
  const dark = lam(0x3a4157);
  const puffs: THREE.Mesh[] = [];
  const offs: [number, number, number, number][] = [
    [0, 0, 0, 2.6], [1.8, 0.6, 0.5, 1.7], [-1.9, 0.4, -0.4, 1.8], [0.6, 1.4, -0.8, 1.5], [-0.7, 1.2, 0.9, 1.4],
  ];
  for (const [x, y, z, r] of offs) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), dark);
    p.position.set(x, y, z);
    puffs.push(p);
    g.add(p);
  }
  const eyeW = lam(0xf4f7fa);
  const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), eyeW);
  eye1.position.set(0.75, 0.6, 2.05);
  const eye2 = eye1.clone(); eye2.position.x = -0.75;
  const pupilM = lam(0x141824);
  const p1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), pupilM);
  p1.position.set(0.75, 0.55, 2.5);
  const p2 = p1.clone(); p2.position.x = -0.75;
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0xff5d8f, emissive: 0xff5d8f, emissiveIntensity: 1.1 })
  );
  core.position.set(0, 0.2, 1.2);
  g.add(eye1, eye2, p1, p2, core);
  g.userData = { core, puffs };
  return g;
}

export function makeSereno() {
  const g = new THREE.Group();
  const white = lam(0xf7fbff);
  const offs: [number, number, number, number][] = [
    [0, 0, 0, 2.4], [1.7, 0.5, 0.3, 1.5], [-1.8, 0.4, -0.3, 1.6], [0.5, 1.2, -0.5, 1.3], [-0.6, 1.1, 0.7, 1.2],
  ];
  for (const [x, y, z, r] of offs) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), white);
    p.position.set(x, y, z);
    g.add(p);
  }
  const eyeM = lam(0x16324f);
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), eyeM);
  e1.position.set(0.7, 0.5, 1.95);
  const e2 = e1.clone(); e2.position.x = -0.7;
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.09, 6, 12, Math.PI), eyeM);
  smile.position.set(0, -0.1, 2.1);
  smile.rotation.z = Math.PI;
  g.add(e1, e2, smile);
  return g;
}

export function makeFata() {
  const g = new THREE.Group();
  const dress = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 1.3, 10),
    new THREE.MeshLambertMaterial({ color: 0xffd166, emissive: 0xffb703, emissiveIntensity: 0.55, flatShading: true })
  );
  dress.position.y = 0.65;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), lam(0xffe0c2));
  head.position.y = 1.55;
  const hairM = lam(0xfff3b0);
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), hairM);
  h.position.set(-0.03, 1.66, 0);
  const wingM = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, emissive: 0xbfe8ff, emissiveIntensity: 0.7 });
  const w1 = new THREE.Mesh(new THREE.CircleGeometry(0.42, 10), wingM);
  w1.position.set(-0.3, 1.15, 0.3); w1.rotation.y = 0.7;
  const w2 = w1.clone(); w2.position.z = -0.3; w2.rotation.y = -0.7;
  const wand = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 6), lam(0x8a5a33));
  wand.position.set(0.45, 1.1, 0.2); wand.rotation.z = -0.6;
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), new THREE.MeshLambertMaterial({ color: 0xff5d8f, emissive: 0xff5d8f, emissiveIntensity: 1.2 }));
  star.position.set(0.68, 1.42, 0.2);
  g.add(dress, head, h, w1, w2, wand, star);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#ffe08a'), transparent: true, opacity: 0.7, depthWrite: false }));
  glow.scale.setScalar(3.4);
  glow.position.y = 1;
  g.add(glow);
  g.userData = { star, w1, w2 };
  return g;
}

export function makeSword() {
  const g = new THREE.Group();
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 1.15, 0.035),
    new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.85, flatShading: true })
  );
  blade.position.y = 0.85;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.26, 4), blade.material);
  tip.position.y = 1.55;
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 6, 12), lam(0xff5d8f, 0.8, 0xff5d8f));
  guard.position.y = 0.24;
  guard.rotation.x = Math.PI / 2;
  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), lam(0x8a5a33));
  hilt.position.y = 0.08;
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), new THREE.MeshLambertMaterial({ color: 0xff5d8f, emissive: 0xff5d8f, emissiveIntensity: 1.3 }));
  gem.position.y = -0.08;
  g.add(blade, tip, guard, hilt, gem);
  return g;
}

export function makeItemBox() {
  const tex = questionTexture();
  const m = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.15, 1.15), new THREE.MeshLambertMaterial({ map: tex, emissive: 0x8a6a00, emissiveIntensity: 0.35 }));
  m.position.y = 1;
  const g = new THREE.Group();
  g.add(m);
  g.userData = { box: m };
  return g;
}

export function makeHeartShell() {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0xff4d6d, emissive: 0xd62f6d, emissiveIntensity: 0.8, flatShading: true });
  const l = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), mat);
  l.position.set(0.16, 0.12, 0);
  const r = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), mat);
  r.position.set(-0.16, 0.12, 0);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.5, 8), mat);
  tip.rotation.z = Math.PI;
  tip.position.y = -0.28;
  const eyeW = lam(0xffffff);
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), eyeW);
  e1.position.set(0.14, 0.2, 0.26);
  const e2 = e1.clone(); e2.position.x = -0.14;
  g.add(l, r, tip, e1, e2);
  return g;
}

export function makeDiamond(color: number) {
  const m = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.5),
    new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.9, transparent: true, opacity: 0.95 })
  );
  return m;
}

export function makePickup(kind: PickupKind) {
  const g = new THREE.Group();
  const bob = new THREE.Group();
  switch (kind) {
    case 'focaccia': {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.16, 10), lam(0xe8b04b));
      b.position.y = 0.9;
      const dots = lam(0x9c6b1e);
      for (let i = 0; i < 5; i++) {
        const d = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 5), dots);
        d.position.set(Math.cos(i * 1.3) * 0.22, 0.99, Math.sin(i * 1.3) * 0.22);
        bob.add(d);
      }
      bob.add(b);
      break;
    }
    case 'book': {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.38), lam(0x2ec4b6));
      b.position.y = 0.9;
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.34), lam(0xf4f7fa));
      p.position.y = 0.87;
      bob.add(b, p);
      break;
    }
    case 'pizza': {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 10), lam(0xf4c542));
      b.position.y = 0.9;
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.03, 10), lam(0xd64545));
      s.position.y = 0.95;
      bob.add(b, s);
      break;
    }
    case 'balloon': {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), lam(0xff5d8f));
      b.position.y = 1.7;
      const str = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.9, 4), lam(0xf4f7fa));
      str.position.y = 1.15;
      bob.add(b, str);
      break;
    }
    case 'ball': {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), lam(0xff5d5d));
      b.position.y = 0.85;
      bob.add(b);
      break;
    }
    case 'flower': {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 5), lam(0x3f9d3f));
      st.position.y = 0.95;
      const pm = lam(0xff8fb3);
      for (let i = 0; i < 5; i++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), pm);
        p.position.set(Math.cos(i * 1.26) * 0.18, 1.28, Math.sin(i * 1.26) * 0.18);
        bob.add(p);
      }
      const c = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), lam(0xffd166));
      c.position.y = 1.28;
      bob.add(st, c);
      break;
    }
    case 'trash': {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), lam(0x9db56b));
      b.position.y = 0.85;
      bob.add(b);
      break;
    }
    case 'letter': {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.06, 0.3), lam(0xf4f7fa));
      b.position.y = 0.9;
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.07, 0.14), lam(0xff5d8f));
      s.position.y = 0.94;
      bob.add(b, s);
      break;
    }
    case 'crate': {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), lam(0xb07b4f));
      b.position.y = 0.9;
      bob.add(b);
      break;
    }
    case 'note': {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), lam(0x16324f));
      b.position.y = 0.95;
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5), lam(0x16324f));
      st.position.set(0.16, 1.25, 0);
      bob.add(b, st);
      break;
    }
    case 'cross': {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.3), lam(0xf4f7fa));
      b.position.y = 0.05;
      g.add(b);
      break;
    }
  }
  g.add(bob);
  g.userData = { bob, kind };
  return g;
}

export const ITEM_INFO: Record<ItemKind, { name: string; color: string }> = {
  shell: { name: 'Guscio Rosso d\'Amore', color: '#ff4d6d' },
  boost: { name: 'Stella di Bontà', color: '#ffc93c' },
  shield: { name: 'Scudo di Tenerezza', color: '#7fd0ff' },
  confetti: { name: 'Bomba di Coriandoli', color: '#1fc8b7' },
};
