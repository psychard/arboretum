import * as THREE from 'three';
import { TICKET } from './data';
import { curSeason, state } from './save';
import { scene } from './render';
import { G, pmat, shadowAll } from './util';
import { trees } from './trees';
import { decors, groundY, localToWorld } from './decor';
import { duckPonds, inWater, walkRoute, walkTo } from './water';
import { startFeed } from './animals';
import { floatText } from './ui';
import { visiting } from './mp';

/* ---------- people ---------- */
export const COATS = [
  '#a2412e',
  '#3f5f8a',
  '#c9a23a',
  '#5f7a4a',
  '#7a4a7a',
  '#d0763a',
  '#4f8a9a',
  '#b85a6a',
  '#e8dcc0',
  '#6a4a3a',
];
export const SKIN = ['#f1c9a5', '#d9a47a', '#a8704a', '#7a4a2e', '#e8b896'];
export const people = [];
export const legGeo = new THREE.CylinderGeometry(0.075, 0.055, 0.8, 7);
legGeo.translate(0, -0.4, 0);
export const armGeo = new THREE.CylinderGeometry(0.052, 0.04, 0.6, 6);
armGeo.translate(0, -0.3, 0);
export const HAIR = ['#6a4426', '#5a3a22', '#7a5530', '#b89060', '#9a4a26', '#d8c8a8', '#8a3a1a'];
export function makePerson() {
  const g = new THREE.Group();
  g.rotation.order = 'YXZ';
  const coat = pmat(COATS[Math.floor(Math.random() * COATS.length)]);
  const pants = pmat(['#6a5a8a', '#4a6a8a', '#8a6a4a'][Math.floor(Math.random() * 3)]);
  const skin = pmat(SKIN[Math.floor(Math.random() * SKIN.length)]),
    hairM = pmat(HAIR[Math.floor(Math.random() * HAIR.length)]),
    shoeM = pmat(['#8a5a3a', '#6a4a2e', '#e8e4dc'][Math.floor(Math.random() * 3)]);
  const legs = [-0.1, 0.1].map(x => {
    const l = new THREE.Mesh(legGeo, pants);
    l.position.set(x, 0.86, 0);
    const shoe = new THREE.Mesh(G('BoxGeometry', 0.11, 0.08, 0.24), shoeM);
    shoe.position.set(0, -0.8, 0.05);
    l.add(shoe);
    g.add(l);
    return l;
  });
  const hips = new THREE.Mesh(G('CylinderGeometry', 0.19, 0.2, 0.2, 10), pants);
  hips.position.y = 0.9;
  hips.scale.z = 0.75;
  g.add(hips);
  const torso = new THREE.Mesh(G('CylinderGeometry', 0.21, 0.19, 0.58, 10), coat);
  torso.position.y = 1.28;
  torso.scale.z = 0.68;
  g.add(torso);
  const shoulders = new THREE.Mesh(G('SphereGeometry', 0.2, 10, 6), coat);
  shoulders.position.y = 1.52;
  shoulders.scale.set(1.3, 0.45, 0.75);
  g.add(shoulders);
  const neck = new THREE.Mesh(G('CylinderGeometry', 0.055, 0.065, 0.12, 6), skin);
  neck.position.y = 1.6;
  g.add(neck);
  const arms = [-0.27, 0.27].map(x => {
    const a = new THREE.Mesh(armGeo, coat);
    a.position.set(x, 1.5, 0);
    a.rotation.z = x > 0 ? -0.06 : 0.06;
    const hand = new THREE.Mesh(G('SphereGeometry', 0.048, 6, 5), skin);
    hand.position.y = -0.63;
    a.add(hand);
    g.add(a);
    return a;
  });
  const head = new THREE.Group();
  head.position.y = 1.76;
  g.add(head);
  const skull = new THREE.Mesh(G('SphereGeometry', 0.13, 12, 9), skin);
  skull.scale.set(0.95, 1.15, 1.02);
  head.add(skull);
  const nose = new THREE.Mesh(G('ConeGeometry', 0.022, 0.06, 4), skin);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.01, 0.135);
  head.add(nose);
  [-0.13, 0.13].forEach(x => {
    const e = new THREE.Mesh(G('SphereGeometry', 0.025, 5, 4), skin);
    e.position.set(x, 0, 0);
    head.add(e);
  });
  const hair = new THREE.Mesh(G('SphereGeometry', 0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM);
  hair.position.set(0, 0.025, -0.012);
  hair.scale.set(1, 1.12, 1.05);
  hair.rotation.x = -0.25;
  head.add(hair);
  if (Math.random() < 0.35) {
    const long = new THREE.Mesh(G('SphereGeometry', 0.13, 10, 8), hairM);
    long.scale.set(1, 1.5, 0.6);
    long.position.set(0, -0.1, -0.07);
    head.add(long);
  }
  if (Math.random() < 0.35) {
    const hm = pmat(['#8a5a3a', '#e3d6b4', '#9a3a3a', '#4f6a8a'][Math.floor(Math.random() * 4)]);
    const brim = new THREE.Mesh(G('CylinderGeometry', 0.24, 0.24, 0.02, 14), hm);
    brim.position.y = 0.1;
    head.add(brim);
    const crown = new THREE.Mesh(G('CylinderGeometry', 0.12, 0.14, 0.13, 12), hm);
    crown.position.y = 0.17;
    head.add(crown);
  }
  shadowAll(g);
  g.scale.setScalar(0.93 + Math.random() * 0.15);
  return { g, legs, arms, head };
}
export function randGardenPoint() {
  for (let k = 0; k < 30; k++) {
    if (trees.length && Math.random() < 0.7) {
      const t = trees[Math.floor(Math.random() * trees.length)];
      const a = Math.random() * 6.28,
        r = 2 + Math.random() * 1.5;
      const x = t.x + Math.cos(a) * r,
        z = t.z + Math.sin(a) * r;
      if (Math.hypot(x, z) < 31 && !inWater(x, z, 1)) return new THREE.Vector3(x, 0, z);
    }
    const a = Math.random() * 6.28,
      r = 4 + Math.random() * 26;
    const x = Math.cos(a) * r,
      z = Math.sin(a) * r;
    if (!inWater(x, z, 1)) return new THREE.Vector3(x, 0, z);
  }
  return new THREE.Vector3(3, 0, 3);
}
export function spawnVisitor() {
  const p = makePerson();
  const start = new THREE.Vector3((Math.random() - 0.5) * 1.4, 0, 44);
  p.g.position.copy(start);
  scene.add(p.g);
  const path = [new THREE.Vector3((Math.random() - 0.5) * 1.4, 0, 33)],
    acts = {},
    stopIdx = new Set();
  const stops = 2 + Math.floor(Math.random() * 3);
  let fedAdded = false;
  for (let i = 0; i < stops; i++) {
    if (!fedAdded && Math.random() < 0.3) {
      const ponds = duckPonds(),
        pd = ponds[Math.floor(Math.random() * ponds.length)],
        a = Math.random() * 6.28;
      path.push(new THREE.Vector3(pd.x + Math.cos(a) * (pd.r + 0.6), 0, pd.z + Math.sin(a) * (pd.r + 0.6)));
      acts[path.length - 1] = { type: 'feed', pd };
      fedAdded = true;
      continue;
    }
    const usable = decors.filter(d => d.d.act);
    if (usable.length && Math.random() < 0.55) {
      const d = usable[Math.floor(Math.random() * usable.length)];
      if (d.d.act === 'bridge') {
        let a = localToWorld(d, 0, -2.9),
          b = localToWorld(d, 0, 2.9);
        if (Math.random() < 0.5) [a, b] = [b, a];
        path.push(a, b);
        continue;
      }
      if (d.d.act === 'sit') {
        const si = Math.floor(Math.random() * d.d.seats.length),
          st = d.d.seats[si];
        path.push(localToWorld(d, st[0] + Math.sin(st[2]) * 0.9, st[1] + Math.cos(st[2]) * 0.9));
        acts[path.length - 1] = { type: 'sit', d, si };
        continue;
      }
      if (d.d.act === 'look') {
        const a = Math.random() * 6.28,
          r = d.d.rad + 0.5;
        path.push(new THREE.Vector3(d.x + Math.cos(a) * r, 0, d.z + Math.sin(a) * r));
        acts[path.length - 1] = { type: 'look', d };
        continue;
      }
    }
    path.push(randGardenPoint());
    stopIdx.add(path.length - 1);
  }
  path.push(
    new THREE.Vector3((Math.random() - 0.5) * 1.4, 0, 33),
    new THREE.Vector3((Math.random() - 0.5) * 1.4, 0, 46),
  );
  const v = {
    p,
    path,
    i: 0,
    pause: 0,
    phase: Math.random() * 6,
    speed: 1.2 + Math.random() * 0.4,
    stops: stopIdx,
    acts,
    sitting: null,
    looking: false,
  };
  people.push(v);
  if (!visiting) {
    state.money += TICKET;
    state.earned += TICKET;
    state.visitorsTotal++;
    floatText('+$' + TICKET, new THREE.Vector3(0, 3.6, 35));
  }
}

export function sitDown(v, a) {
  const d = a.d,
    st = d.d.seats[a.si];
  if (!decors.includes(d) || d.occ[a.si]) {
    v.pause = 1.5 + Math.random() * 2;
    return;
  }
  d.occ[a.si] = v;
  v.sitting = a;
  const p = localToWorld(d, st[0], st[1]),
    g = v.p.g;
  g.position.set(p.x, d.d.seatY - 0.8 * g.scale.y, p.z);
  g.rotation.y = st[2] + d.r;
  v.p.legs.forEach(l => (l.rotation.x = -1.15));
  v.p.arms.forEach(m => (m.rotation.x = -0.55));
  v.pause = 7 + Math.random() * 10;
}
export function standUp(v) {
  const a = v.sitting;
  v.sitting = null;
  if (a.d.occ[a.si] === v) a.d.occ[a.si] = null;
  const st = a.d.d.seats[a.si],
    p = localToWorld(a.d, st[0] + Math.sin(st[2]) * 0.6, st[1] + Math.cos(st[2]) * 0.6);
  v.p.g.position.set(p.x, 0, p.z);
}
/* swimming (or skating when the ponds are frozen) */
export const RIPPLE_GEO = new THREE.RingGeometry(0.35, 0.45, 24);
export function startSwim(v, pd) {
  const skate = curSeason() === 3,
    inner = Math.max(0.6, pd.r - 1.0),
    pts = [];
  for (let i = 0, n = 3 + Math.floor(Math.random() * 3); i < n; i++) {
    const a = Math.random() * 6.28,
      r = Math.sqrt(Math.random()) * inner;
    pts.push(new THREE.Vector3(pd.x + Math.cos(a) * r, 0, pd.z + Math.sin(a) * r));
  }
  v.swim = { pd, pts, j: 0, skate, exit: v.p.g.position.clone(), out: false };
  if (!skate) {
    v.ripple = new THREE.Mesh(
      RIPPLE_GEO,
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false }),
    );
    v.ripple.rotation.x = -Math.PI / 2;
    scene.add(v.ripple);
    v.rt = 0;
  }
  floatText(skate ? '⛸️' : '💦', v.p.g.position.clone().setY(2));
}
export function updateSwim(v, dt) {
  const s = v.swim,
    g = v.p.g;
  v.phase += dt * (s.skate ? 3 : 5);
  const target = s.out ? s.exit : s.pts[s.j];
  const inWater = Math.hypot(g.position.x - s.pd.x, g.position.z - s.pd.z) < s.pd.r - 0.15;
  const done = walkTo(g, target, s.skate ? 1.7 : 0.75, dt);
  if (s.skate) {
    g.rotation.x = 0;
    g.position.y = 0.04;
    v.p.arms[0].rotation.z = 1.2;
    v.p.arms[1].rotation.z = -1.2;
    v.p.arms.forEach(a => (a.rotation.x = 0));
    const sw = Math.sin(v.phase) * 0.35;
    v.p.legs[0].rotation.x = sw;
    v.p.legs[1].rotation.x = -sw;
    g.rotation.z = Math.sin(v.phase) * 0.08;
  } else {
    const prone = inWater ? 1.3 : 0;
    g.rotation.x += (prone - g.rotation.x) * Math.min(1, dt * 4);
    g.position.y = -0.35 * (g.rotation.x / 1.3);
    v.p.arms[0].rotation.x = -v.phase;
    v.p.arms[1].rotation.x = -v.phase - Math.PI;
    v.p.legs[0].rotation.x = Math.sin(v.phase * 2) * 0.3;
    v.p.legs[1].rotation.x = -Math.sin(v.phase * 2) * 0.3;
    v.rt += dt;
    const f = (v.rt % 1.4) / 1.4;
    v.ripple.position.set(
      g.position.x + Math.sin(g.rotation.y) * 1.1,
      0.06,
      g.position.z + Math.cos(g.rotation.y) * 1.1,
    );
    v.ripple.scale.setScalar(1 + f * 3);
    v.ripple.material.opacity = inWater ? 0.55 * (1 - f) : 0;
  }
  if (done) {
    if (!s.out) {
      s.j++;
      if (s.j >= s.pts.length) s.out = true;
    } else endSwim(v);
  }
}
export function endSwim(v) {
  const g = v.p.g;
  g.rotation.x = 0;
  g.rotation.z = 0;
  g.position.y = 0;
  v.p.arms.forEach(a => {
    a.rotation.x = 0;
    a.rotation.z = 0;
  });
  if (v.ripple) {
    scene.remove(v.ripple);
    v.ripple.material.dispose();
    v.ripple = null;
  }
  v.swim = null;
}

/* visitors chatting and waving to each other */
export let socialClock = 0;
export const canChat = (v, now) =>
  !v.swim &&
  !v.sitting &&
  v.pause <= 0 &&
  !v.chat &&
  v.i > 0 &&
  v.i < v.path.length - 2 &&
  (v.nextSocial || 0) < now;
export function startChat(a, b, now) {
  const dur = 4 + Math.random() * 4;
  [a, b].forEach((v, k) => {
    const o = k ? a : b,
      g = v.p.g;
    v.chat = { k, next: now + 600 + Math.random() * 900 };
    v.pause = dur;
    g.rotation.y = Math.atan2(o.p.g.position.x - g.position.x, o.p.g.position.z - g.position.z);
    v.nextSocial = now + dur * 1000 + 15000;
    v.p.legs.forEach(l => (l.rotation.x = 0));
  });
  floatText(['👋', '😊', '🙂'][Math.floor(Math.random() * 3)], a.p.g.position.clone().setY(2.3));
}
export function updateSocial(dt) {
  socialClock += dt;
  if (socialClock < 0.3) return;
  socialClock = 0;
  const now = performance.now();
  for (let i = 0; i < people.length; i++) {
    const a = people[i];
    if (!canChat(a, now)) continue;
    for (let j = i + 1; j < people.length; j++) {
      const b = people[j];
      if (!canChat(b, now)) continue;
      if (a.p.g.position.distanceTo(b.p.g.position) > 1.8) continue;
      if (Math.random() < 0.45) startChat(a, b, now);
      else {
        a.wave = b.wave = now + 1300;
        a.nextSocial = b.nextSocial = now + 8000;
        floatText('👋', a.p.g.position.clone().setY(2.3));
      }
      break;
    }
  }
}
export function updatePeople(dt) {
  const now = performance.now();
  for (let k = people.length - 1; k >= 0; k--) {
    const v = people[k],
      g = v.p.g;
    if (v.swim) {
      updateSwim(v, dt);
      continue;
    }
    if (v.pause > 0) {
      v.pause -= dt;
      if (!v.sitting) {
        v.p.legs.forEach(l => (l.rotation.x *= 0.85));
        v.p.arms.forEach(m => (m.rotation.x *= 0.85));
      }
      if (v.feeding) {
        v.p.arms[1].rotation.x = -0.5 - 0.9 * Math.max(0, Math.sin(now / 320 + k));
        v.p.head.rotation.x = 0.3;
        v.p.head.rotation.y = Math.sin(now / 1100 + k) * 0.2;
        if (Math.random() < dt * 0.45) floatText('🍞', g.position.clone().setY(1.9));
      } else if (v.chat) {
        const talk = (Math.floor(now / 1400) + v.chat.k) % 2 === 0;
        v.p.head.rotation.y *= 0.8;
        v.p.head.rotation.x = talk ? Math.sin(now / 180) * 0.08 : Math.sin(now / 420) * 0.15;
        if (talk) v.p.arms[1].rotation.x = -0.6 - 0.35 * Math.sin(now / 260);
        if (talk && now > v.chat.next) {
          v.chat.next = now + 2200 + Math.random() * 2000;
          floatText(
            ['💬', '😄', '🌳', '🐈', '👍'][Math.floor(Math.random() * 5)],
            g.position.clone().setY(2.3),
          );
        }
      } else if (v.sitting) {
        const mate = v.sitting.d.occ.find(o => o && o !== v);
        if (mate) {
          const mg = mate.p.g.position;
          const want = Math.atan2(mg.x - g.position.x, mg.z - g.position.z) - g.rotation.y;
          const w = Math.atan2(Math.sin(want), Math.cos(want));
          v.p.head.rotation.y = Math.max(-1, Math.min(1, w)) * (0.5 + 0.5 * Math.sin(now / 2000 + k));
          v.p.head.rotation.x = Math.sin(now / 300 + k) * 0.05;
          if (Math.random() < dt * 0.15)
            floatText(['💬', '😄', '🙂'][Math.floor(Math.random() * 3)], g.position.clone().setY(1.9));
        } else {
          v.p.head.rotation.y = Math.sin(now / 900 + k) * 0.5;
          v.p.head.rotation.x = -0.12 + Math.sin(now / 1400 + k) * 0.1;
        }
      } else {
        v.p.head.rotation.y = Math.sin(now / 900 + k) * (v.looking ? 0.25 : 0.5);
        v.p.head.rotation.x = (v.looking ? 0.4 : -0.12) + Math.sin(now / 1400 + k) * 0.1;
      }
      if (v.pause <= 0) {
        if (v.sitting) standUp(v);
        v.looking = false;
        v.chat = null;
        v.feeding = null;
      }
      continue;
    }
    v.phase += dt * v.speed * 6;
    const sw = Math.sin(v.phase) * 0.5;
    v.p.legs[0].rotation.x = sw;
    v.p.legs[1].rotation.x = -sw;
    v.p.arms[0].rotation.x = -sw * 0.75;
    v.p.arms[1].rotation.x = sw * 0.75;
    v.p.head.rotation.x *= 0.9;
    if (v.wave && v.wave > now) {
      v.p.arms[1].rotation.x = -2.7;
      v.p.arms[1].rotation.z = -0.3 - 0.35 * Math.sin(now / 90);
    } else if (v.wave) {
      v.wave = 0;
      v.p.arms[1].rotation.z = -0.06;
    }
    if (walkRoute(g, v, v.path[v.i], v.speed, dt)) {
      const a = v.acts[v.i];
      if (a && a.type === 'sit') sitDown(v, a);
      else if (a && a.type === 'feed') startFeed(v, a.pd);
      else if (a && a.type === 'look') {
        v.looking = true;
        v.pause = 3 + Math.random() * 4;
        g.rotation.y = Math.atan2(a.d.x - g.position.x, a.d.z - g.position.z);
      } else if (v.stops.has(v.i)) v.pause = 2.5 + Math.random() * 5;
      v.i++;
      if (v.i >= v.path.length) {
        if (v.sitting) standUp(v);
        scene.remove(g);
        people.splice(k, 1);
        continue;
      }
    }
    if (!v.sitting) g.position.y = groundY(g.position.x, g.position.z) + Math.abs(Math.sin(v.phase)) * 0.04;
  }
}

export function clearPeople() {
  people.forEach(v => {
    if (v.sitting) standUp(v);
    scene.remove(v.p.g);
    if (v.ripple) scene.remove(v.ripple);
  });
  people.length = 0;
}
