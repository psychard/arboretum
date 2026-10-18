import * as THREE from 'three';
import { $ } from './dom';
import { SP } from './data';
import { BLOBS, canvasTex, rng, shadowAll } from './util';
import { makeTree } from './trees';
import { makeDecor } from './decor';

/* ---------- nursery thumbnails: detailed, rotating 3D trees ---------- */
export const SHOWCASE = {
  cherry: 0,
  jacaranda: 0,
  maple: 2,
  ginkgo: 2,
  jmaple: 2,
  apple: 0,
  paperbark: 0,
  trumpet: 0,
  pear: 0,
  rowan: 2,
  dogwood: 0,
  redbud: 0,
  magnolia: 0,
  tulip: 2,
  silkfloss: 2,
  wisteria: 0,
  redoak: 2,
};

export const barkTex = canvasTex(128, (g, s) => {
  g.fillStyle = '#8c8c8c';
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 260; i++) {
    const x = Math.random() * s,
      y = Math.random() * s,
      w = 1 + Math.random() * 3,
      h = 12 + Math.random() * 44,
      v = (70 + Math.random() * 130) | 0;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(x, y, w, h);
    g.fillRect(x, y - s, w, h);
  }
});
barkTex.repeat.set(2, 2);
export const birchTex = canvasTex(128, (g, s) => {
  g.fillStyle = '#f4f2ec';
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * s,
      y = Math.random() * s,
      w = 6 + Math.random() * 22,
      v = (40 + Math.random() * 60) | 0;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(x, y, w, 1.5 + Math.random() * 2.5);
    g.fillRect(x - s, y, w, 2);
  }
});
export const paperTex = canvasTex(128, (g, s) => {
  g.fillStyle = '#8a3a26';
  g.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 4 + Math.random() * 6) {
    g.fillStyle = Math.random() < 0.5 ? '#c06a40' : '#a04a2e';
    g.fillRect(0, y, s, 2 + Math.random() * 3);
  }
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * s,
      y = Math.random() * s;
    g.fillStyle = 'rgba(50,20,12,.7)';
    g.fillRect(x, y, 8 + Math.random() * 16, 1.5);
  }
});
export const rainbowTex = canvasTex(128, (g, s) => {
  const cs = ['#6a9a5a', '#d0803a', '#8a5aa0', '#c0a040', '#4a7a8a', '#b04a3a'];
  g.fillStyle = '#8a9a6a';
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 90; i++) {
    g.fillStyle = cs[i % cs.length];
    const x = Math.random() * s,
      w = 3 + Math.random() * 10,
      y = Math.random() * s,
      h = 20 + Math.random() * 60;
    g.fillRect(x, y, w, h);
    g.fillRect(x, y - s, w, h);
  }
});
export const leafTex = canvasTex(256, (g, s) => {
  g.fillStyle = '#a8a8a8';
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * s,
      y = Math.random() * s,
      v = (110 + Math.random() * 145) | 0;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.save();
    g.translate(x, y);
    g.rotate(Math.random() * 6.28);
    g.beginPath();
    g.ellipse(0, 0, 4 + Math.random() * 3, 1.6 + Math.random(), 0, 0, 6.28);
    g.fill();
    g.restore();
  }
});
export const grassTex = canvasTex(128, (g, s) => {
  const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  r.addColorStop(0, 'rgba(104,146,66,1)');
  r.addColorStop(0.6, 'rgba(104,146,66,.7)');
  r.addColorStop(1, 'rgba(104,146,66,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, s, s);
});
export let TR = null;
export const thumbModels = {};
export function initThumbs() {
  if (TR) return true;
  if (TR === false) return false;
  try {
    const cv = document.createElement('canvas');
    TR = {
      r: new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, preserveDrawingBuffer: true }),
      scene: new THREE.Scene(),
      cam: new THREE.PerspectiveCamera(30, 1, 0.1, 100),
      cur: null,
    };
  } catch (e) {
    TR = false;
    return false;
  }
  TR.r.setPixelRatio(1);
  TR.r.setSize(144, 144, false);
  TR.r.setClearColor(0x000000, 0);
  TR.r.shadowMap.enabled = true;
  TR.r.shadowMap.type = THREE.PCFSoftShadowMap;
  const s = TR.scene;
  s.add(new THREE.HemisphereLight(0xeef4ff, 0x5a4a30, 0.75));
  const d = new THREE.DirectionalLight(0xfff2dc, 1.0);
  d.position.set(4, 9, 6);
  d.castShadow = true;
  d.shadow.mapSize.set(512, 512);
  Object.assign(d.shadow.camera, { left: -5, right: 5, top: 6, bottom: -3, near: 0.5, far: 30 });
  d.shadow.bias = -0.001;
  s.add(d);
  const rim = new THREE.DirectionalLight(0xdfe8ff, 0.35);
  rim.position.set(-6, 4, -6);
  s.add(rim);
  const gnd = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 40),
    new THREE.MeshPhongMaterial({ map: grassTex, transparent: true, depthWrite: false, shininess: 2 }),
  );
  gnd.rotation.x = -Math.PI / 2;
  gnd.receiveShadow = true;
  s.add(gnd);
  return true;
}
export function thumbModel(sp) {
  if (thumbModels[sp.id]) return thumbModels[sp.id];
  const R = rng(sp.price * 7919 + 13);
  const si = SHOWCASE[sp.id] !== undefined ? SHOWCASE[sp.id] : 1;
  const base = new THREE.Color(sp.col[si]);
  const side = sp.shape === 'dragon' ? THREE.DoubleSide : THREE.FrontSide;
  const leaf = c =>
    new THREE.MeshPhongMaterial({ color: c, map: leafTex, shininess: 10, specular: 0x181818, side });
  const special = { birch: birchTex, paperbark: paperTex, eucalyptus: rainbowTex }[sp.id],
    paper = sp.id === 'paperbark' || sp.id === 'eucalyptus';
  const mats = {
    T: new THREE.MeshPhongMaterial({
      color: special ? '#ffffff' : new THREE.Color(sp.trunk).lerp(new THREE.Color('#ffffff'), 0.35),
      map: special || barkTex,
      shininess: paper ? 40 : 3,
      specular: paper ? 0x553322 : 0x111111,
    }),
    F: leaf(base),
    light: leaf(base.clone().lerp(new THREE.Color('#fff4c0'), 0.22)),
    dark: leaf(base.clone().multiplyScalar(0.62)),
  };
  const { group, fol } = makeTree(sp, 4242 + sp.price, mats);
  const up = new THREE.Vector3();
  fol.forEach(m => {
    const type = m.geometry.type;
    if (m.userData.sway !== undefined || m.userData.plain) {
      m.material = R() < 0.5 ? mats.F : mats.light;
      return;
    }
    if (type === 'IcosahedronGeometry') {
      m.rotation.set(0, R() * 6.28, 0);
      m.material = mats.dark;
      for (let i = 0; i < 12; i++) {
        up.set(R() * 2 - 1, R() * 1.6 - 0.5, R() * 2 - 1).normalize();
        const c = new THREE.Mesh(BLOBS[i % 6], up.y > 0.35 ? mats.light : up.y < -0.2 ? mats.dark : mats.F);
        c.position.copy(up).multiplyScalar(0.82);
        c.scale.setScalar(0.32 + R() * 0.18);
        c.rotation.set(R() * 3, R() * 3, R() * 3);
        m.add(c);
      }
    } else if (type === 'ConeGeometry') {
      const r = m.geometry.parameters.radius,
        h = m.geometry.parameters.height;
      m.material = mats.dark;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + R() * 0.3;
        const c = new THREE.Mesh(BLOBS[i % 6], i % 3 === 0 ? mats.light : mats.F);
        const yy = -h / 2 + 0.15 + R() * h * 0.35,
          rr = r * (0.5 - yy / h) * 0.9;
        c.position.set(Math.cos(a) * rr, yy, Math.sin(a) * rr);
        c.scale.set(r * 0.32, h * 0.12, r * 0.32);
        c.rotation.y = a;
        m.add(c);
      }
      const tip = new THREE.Mesh(BLOBS[0], mats.light);
      tip.position.y = h * 0.15;
      tip.scale.set(r * 0.3, h * 0.22, r * 0.3);
      m.add(tip);
    } else if (type === 'SphereGeometry') {
      m.material = mats.dark;
      for (let i = 0; i < 34; i++) {
        up.set(R() * 2 - 1, 0.15 + R() * 0.9, R() * 2 - 1).normalize();
        const c = new THREE.Mesh(BLOBS[i % 6], up.y > 0.6 ? mats.light : mats.F);
        c.position.copy(up).multiplyScalar(2.45);
        c.scale.set(0.55, 0.9, 0.55);
        m.add(c);
      }
    }
  });
  shadowAll(group);
  const box = new THREE.Box3().setFromObject(group),
    size = box.getSize(new THREE.Vector3());
  const k = 4 / Math.max(size.y, Math.max(size.x, size.z) * 0.9);
  group.scale.setScalar(k);
  group.position.y = -box.min.y * k;
  const h = size.y * k,
    w = Math.max(size.x, size.z) * k;
  group.userData.fit = { cy: h * 0.5, dist: (Math.max(h, w) * 0.62) / Math.tan((15 * Math.PI) / 180) };
  thumbModels[sp.id] = group;
  return group;
}
export const decorThumbs = {};
export function decorThumb(id) {
  if (decorThumbs[id]) return decorThumbs[id];
  const g = makeDecor(id);
  const box = new THREE.Box3().setFromObject(g),
    size = box.getSize(new THREE.Vector3());
  const k = 3.4 / Math.max(size.y, Math.max(size.x, size.z));
  g.scale.setScalar(k);
  g.position.y = -box.min.y * k;
  const h = size.y * k,
    w = Math.max(size.x, size.z) * k;
  g.userData.fit = { cy: h * 0.5, dist: (Math.max(h, w) * 0.66) / Math.tan((15 * Math.PI) / 180), el: 0.45 };
  decorThumbs[id] = g;
  return g;
}
export let thumbClock = 0;
export function renderThumbs(dt, t) {
  if (!$('#shop').classList.contains('open')) return;
  thumbClock += dt;
  if (thumbClock < 1 / 15) return;
  thumbClock = 0;
  if (!initThumbs()) return;
  const lr = $('#list').getBoundingClientRect();
  document.querySelectorAll<HTMLCanvasElement>('#list canvas.thumb').forEach((cv, i) => {
    const b = cv.getBoundingClientRect();
    if (b.bottom < lr.top || b.top > lr.bottom) return;
    const m = cv.dataset.kind === 'decor' ? decorThumb(cv.dataset.id) : thumbModel(SP[cv.dataset.id]);
    if (TR.cur !== m) {
      if (TR.cur) TR.scene.remove(TR.cur);
      TR.scene.add(m);
      TR.cur = m;
    }
    const f = m.userData.fit;
    m.rotation.y = t * 0.5 + i * 0.9;
    TR.cam.position.set(0, f.cy + f.dist * (f.el || 0.2), f.dist);
    TR.cam.lookAt(0, f.cy * 0.92, 0);
    TR.r.render(TR.scene, TR.cam);
    const g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    g.drawImage(TR.r.domElement, 0, 0, cv.width, cv.height);
  });
}
