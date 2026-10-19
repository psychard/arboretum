import * as THREE from 'three';
import { curSeason, state } from './save';
import { scene } from './render';
import { G, GEO, PMAT, pmat, shadowAll } from './util';
import { duckPonds, inWater, walkRoute, walkTo } from './water';
import { focusCam, unfocus } from './camera';
import { floatText, toast } from './ui';

export const ducks = [];
/* ---------- the cat ---------- */
export let cat = null;
export function makeCat() {
  const g = new THREE.Group();
  const fur = pmat('#a8a8ae'),
    dark = pmat('#93939a');
  const body = new THREE.Mesh(G('SphereGeometry', 0.28, 10, 8), fur);
  body.scale.set(1, 0.85, 1.7);
  body.position.y = 0.4;
  g.add(body);
  const head = new THREE.Group();
  head.position.set(0, 0.62, 0.44);
  g.add(head);
  head.add(new THREE.Mesh(G('SphereGeometry', 0.2, 10, 8), fur));
  [-0.1, 0.1].forEach(x => {
    const e = new THREE.Mesh(G('ConeGeometry', 0.07, 0.15, 4), dark);
    e.position.set(x, 0.18, 0);
    head.add(e);
    const eye = new THREE.Mesh(
      G('SphereGeometry', 0.03, 6, 4),
      PMAT.catEye || (PMAT.catEye = new THREE.MeshBasicMaterial({ color: '#c9d65a' })),
    );
    eye.position.set(x * 0.7, 0.04, 0.18);
    head.add(eye);
  });
  const tail = new THREE.Object3D();
  tail.position.set(0, 0.5, -0.42);
  g.add(tail);
  const tg =
    GEO.catTail || (GEO.catTail = new THREE.CylinderGeometry(0.03, 0.045, 0.6, 5).translate(0, 0.3, 0));
  const tm = new THREE.Mesh(tg, dark);
  tm.rotation.x = -0.7;
  tail.add(tm);
  const lg =
    GEO.catLeg || (GEO.catLeg = new THREE.CylinderGeometry(0.045, 0.04, 0.3, 5).translate(0, -0.15, 0));
  const legs = [
    [-0.12, 0.3],
    [0.12, 0.3],
    [-0.12, -0.3],
    [0.12, -0.3],
  ].map(([x, z]) => {
    const l = new THREE.Mesh(lg, fur);
    l.position.set(x, 0.3, z);
    g.add(l);
    return l;
  });
  shadowAll(g);
  g.scale.setScalar(1.35);
  return { g, body, head, tail, legs };
}
export function spawnCat() {
  const c = makeCat();
  const a = Math.random() * 6.28;
  c.g.position.set(Math.cos(a) * 33, 0, Math.sin(a) * 33);
  scene.add(c.g);
  const b = a + Math.PI + (Math.random() - 0.5) * 1.4;
  cat = {
    c,
    state: 'in',
    target: randCatSpot(),
    exit: new THREE.Vector3(Math.cos(b) * 36, 0, Math.sin(b) * 36),
    sit: 28,
    phase: 0,
  };
  state.cats++;
  toast(
    'A gray cat has wandered into the arboretum.',
    { label: 'Look', fn: () => focusCam(cat ? cat.c.g.position : null, 18) },
    8000,
  );
}
export function randCatSpot() {
  for (let k = 0; k < 20; k++) {
    const a = Math.random() * 6.28,
      r = 7 + Math.random() * 20;
    const x = Math.cos(a) * r,
      z = Math.sin(a) * r;
    if (!inWater(x, z, 1.5)) return new THREE.Vector3(x, 0, z);
  }
  return new THREE.Vector3(8, 0, -8);
}
export function updateCat(dt) {
  if (!cat) return;
  const c = cat.c;
  cat.phase += dt;
  c.tail.rotation.z = Math.sin(cat.phase * 2.2) * 0.5;
  if (cat.state === 'sit') {
    cat.sit -= dt;
    c.legs.forEach(l => (l.rotation.x *= 0.8));
    c.body.rotation.x = -0.25;
    c.head.rotation.y = Math.sin(cat.phase * 0.6) * 0.6;
    if (cat.sit <= 0) {
      cat.state = 'out';
      c.body.rotation.x = 0;
    }
    return;
  }
  const sw = Math.sin(cat.phase * 9) * 0.5;
  c.legs[0].rotation.x = sw;
  c.legs[3].rotation.x = sw;
  c.legs[1].rotation.x = -sw;
  c.legs[2].rotation.x = -sw;
  const done = walkRoute(c.g, cat, cat.state === 'in' ? cat.target : cat.exit, 1.5, dt);
  if (done) {
    if (cat.state === 'in') cat.state = 'sit';
    else {
      scene.remove(c.g);
      unfocus(c.g.position);
      cat = null;
    }
  }
}

export function makeDuck() {
  const g = new THREE.Group(),
    male = Math.random() < 0.5;
  const bodyM = pmat(male ? '#d2cab6' : '#a8825a'),
    headM = pmat(male ? '#3f8a52' : '#94704a'),
    wingM = pmat(male ? '#b9b098' : '#8e6a44'),
    chestM = pmat(male ? '#94603c' : '#a8825a');
  const body = new THREE.Mesh(G('SphereGeometry', 0.22, 10, 8), bodyM);
  body.scale.set(0.85, 0.6, 1.3);
  body.position.y = 0.08;
  g.add(body);
  const chest = new THREE.Mesh(G('SphereGeometry', 0.15, 8, 6), chestM);
  chest.position.set(0, 0.1, 0.17);
  g.add(chest);
  [-1, 1].forEach(sd => {
    const w = new THREE.Mesh(G('SphereGeometry', 0.15, 8, 6), wingM);
    w.scale.set(0.35, 0.5, 1.1);
    w.position.set(sd * 0.15, 0.12, -0.03);
    g.add(w);
  });
  const tail = new THREE.Mesh(G('ConeGeometry', 0.07, 0.16, 5), bodyM);
  tail.rotation.x = -1.9;
  tail.position.set(0, 0.16, -0.3);
  g.add(tail);
  const neck = new THREE.Mesh(G('CylinderGeometry', 0.05, 0.07, 0.16, 6), male ? headM : bodyM);
  neck.position.set(0, 0.2, 0.2);
  g.add(neck);
  const head = new THREE.Group();
  head.position.set(0, 0.3, 0.22);
  g.add(head);
  head.add(new THREE.Mesh(G('SphereGeometry', 0.1, 10, 8), headM));
  if (male) {
    const collar = new THREE.Mesh(G('TorusGeometry', 0.075, 0.015, 5, 12), pmat('#f4f0e4'));
    collar.rotation.x = Math.PI / 2;
    collar.position.y = -0.08;
    head.add(collar);
  }
  const bill = new THREE.Mesh(G('BoxGeometry', 0.07, 0.03, 0.12), pmat('#e8a23a'));
  bill.position.set(0, -0.02, 0.12);
  head.add(bill);
  shadowAll(g);
  g.scale.setScalar(1.25);
  return { g, head };
}
export function syncDucks() {
  ducks.splice(0).forEach(k => scene.remove(k.m.g));
  duckPonds().forEach((pd, i) => {
    const n = i === 0 ? 5 : 2;
    for (let j = 0; j < n; j++) {
      const m = makeDuck(),
        a = Math.random() * 6.28,
        r = Math.random() * (pd.r - 0.6);
      m.g.position.set(pd.x + Math.cos(a) * r, 0, pd.z + Math.sin(a) * r);
      m.g.rotation.y = Math.random() * 6.28;
      scene.add(m.g);
      ducks.push({ m, pond: pd, target: null, feed: null, seed: Math.random() * 10 });
    }
  });
}
export function startFeed(v, pd) {
  const g = v.p.g,
    dx = pd.x - g.position.x,
    dz = pd.z - g.position.z,
    l = Math.hypot(dx, dz) || 1;
  g.rotation.y = Math.atan2(dx, dz);
  v.feeding = pd;
  v.pause = 7 + Math.random() * 5;
  const pt = new THREE.Vector3(g.position.x + (dx / l) * 1.6, 0, g.position.z + (dz / l) * 1.6),
    until = performance.now() + v.pause * 1000;
  ducks
    .filter(k => k.pond.x === pd.x && k.pond.z === pd.z)
    .forEach(k => {
      k.feed = { pt, until };
      k.target = null;
    });
  floatText('🍞', g.position.clone().setY(2.2));
}
export function updateDucks(dt) {
  const now = performance.now(),
    frozen = curSeason() === 3;
  for (const k of ducks) {
    const g = k.m.g;
    if (k.feed && k.feed.until < now) k.feed = null;
    if (!k.target || walkTo(g, k.target, k.feed ? 0.9 : 0.32, dt)) {
      if (k.feed)
        k.target = k.feed.pt
          .clone()
          .add(new THREE.Vector3((Math.random() - 0.5) * 0.9, 0, (Math.random() - 0.5) * 0.9));
      else {
        const a = Math.random() * 6.28,
          r = Math.sqrt(Math.random()) * Math.max(0.3, k.pond.r - 0.6);
        k.target = new THREE.Vector3(k.pond.x + Math.cos(a) * r, 0, k.pond.z + Math.sin(a) * r);
      }
    }
    g.position.y = (frozen ? 0.03 : 0) + Math.sin(now / 600 + k.seed) * 0.02;
    k.m.head.rotation.x = k.feed
      ? Math.max(0, Math.sin(now / 180 + k.seed)) * 0.7
      : Math.sin(now / 1500 + k.seed) * 0.15;
    if (k.feed && Math.random() < dt * 0.2) floatText('🦆', g.position.clone().setY(0.9));
  }
}

export function removeCat() {
  if (cat) {
    scene.remove(cat.c.g);
    cat = null;
  }
}
