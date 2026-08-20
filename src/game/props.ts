import * as THREE from 'three';
import { glowTexture } from './actors';
import type { Lamp } from './world';

export function makeTree() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.4, 7), new THREE.MeshLambertMaterial({ color: 0x8a5a33, flatShading: true }));
  trunk.position.y = 1.2;
  const folM = new THREE.MeshLambertMaterial({ color: 0x3f9d3f, flatShading: true });
  const f1 = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 7), folM);
  f1.position.y = 3.2;
  const f2 = new THREE.Mesh(new THREE.SphereGeometry(1.15, 8, 7), folM);
  f2.position.set(0.9, 4.1, 0.3);
  const f3 = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 7), folM);
  f3.position.set(-0.8, 4.0, -0.2);
  g.add(trunk, f1, f2, f3);
  return g;
}

export function makePalm() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 5, 7), new THREE.MeshLambertMaterial({ color: 0xa9743f, flatShading: true }));
  trunk.position.y = 2.5;
  trunk.rotation.z = 0.12;
  const leafM = new THREE.MeshLambertMaterial({ color: 0x2f9d4f, flatShading: true, side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.8, 5), leafM);
    leaf.position.y = 5.1;
    leaf.rotation.z = Math.PI / 2.4;
    leaf.rotation.y = (i / 6) * Math.PI * 2;
    leaf.translateY(1.2);
    g.add(leaf);
  }
  g.add(trunk);
  return g;
}

export function makeFountain() {
  const g = new THREE.Group();
  const stone = new THREE.MeshLambertMaterial({ color: 0xd8dee6, flatShading: true });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.8, 16), stone);
  base.position.y = 0.4;
  const water = new THREE.Mesh(new THREE.CylinderGeometry(3.7, 3.7, 0.3, 16), new THREE.MeshLambertMaterial({ color: 0x4fb3e8 }));
  water.position.y = 0.85;
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 2.2, 10), stone);
  col.position.y = 1.6;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.2, 0.5, 12), stone);
  top.position.y = 2.8;
  const heart = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshLambertMaterial({ color: 0xff5d8f, emissive: 0xff5d8f, emissiveIntensity: 0.9 }));
  heart.position.y = 3.6;
  g.add(base, water, col, top, heart);
  g.userData = { heart };
  return g;
}

export function makeStreetLamp(): { group: THREE.Group; bulb: THREE.MeshLambertMaterial; glow: THREE.Sprite } {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5.4, 6), new THREE.MeshLambertMaterial({ color: 0x2c3440 }));
  pole.position.y = 2.7;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.12), new THREE.MeshLambertMaterial({ color: 0x2c3440 }));
  arm.position.set(0.6, 5.3, 0);
  const bulbM = new THREE.MeshLambertMaterial({ color: 0xfff3b0, emissive: 0xffdd77, emissiveIntensity: 0.1 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), bulbM);
  bulb.position.set(1.2, 5.2, 0);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#ffd97a'), transparent: true, opacity: 0, depthWrite: false }));
  glow.scale.setScalar(3);
  glow.position.set(1.2, 5.2, 0);
  g.add(pole, arm, bulb, glow);
  return { group: g, bulb: bulbM, glow };
}

export function makeBench() {
  const g = new THREE.Group();
  const wood = new THREE.MeshLambertMaterial({ color: 0xb07b4f, flatShading: true });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 0.8), wood);
  seat.position.y = 0.55;
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 0.14), wood);
  back.position.set(0, 0.95, -0.35);
  const legM = new THREE.MeshLambertMaterial({ color: 0x2c3440 });
  const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.7), legM);
  l1.position.set(-1, 0.28, 0);
  const l2 = l1.clone(); l2.position.x = 1;
  g.add(seat, back, l1, l2);
  return g;
}

// la giostra del parco (carosello) — qui nasce la Spada dell'Amore
export function makeCarouselTree() {
  const g = new THREE.Group();
  const baseM = new THREE.MeshLambertMaterial({ color: 0xf4f7fa, flatShading: true });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.4, 0.5, 16), baseM);
  base.position.y = 0.25;
  const roofM = new THREE.MeshLambertMaterial({ color: 0xef6f8e, flatShading: true });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.2, 12), roofM);
  roof.position.y = 4.6;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 3.6, 8), new THREE.MeshLambertMaterial({ color: 0xffd166 }));
  pole.position.y = 2.6;
  const spin = new THREE.Group();
  const horseColors = [0xffd166, 0x2ec4b6, 0xff8b7b, 0x6fc3df];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const hp = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), new THREE.MeshLambertMaterial({ color: 0xd9d2c5 }));
    stick.position.y = 2.2;
    const horse = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.45), new THREE.MeshLambertMaterial({ color: horseColors[i], flatShading: true }));
    horse.position.y = 1.4;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, 0.35), horse.material);
    head.position.set(0.55, 1.85, 0);
    hp.add(stick, horse, head);
    hp.position.set(Math.cos(a) * 2.8, 0.5, Math.sin(a) * 2.8);
    hp.rotation.y = -a;
    spin.add(hp);
  }
  g.add(base, roof, pole, spin);
  g.userData = { spin, roofM };
  return g;
}

export type { Lamp };
