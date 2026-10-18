import * as THREE from 'three';

/* ---------- helpers ---------- */
export const mat = (c, o?) =>
  new THREE.MeshPhongMaterial(
    Object.assign({ color: c, flatShading: true, shininess: 4, specular: 0x111111 }, o || {}),
  );
export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash3(x, y, z) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
}
export const BLOBS = [];
for (let k = 0; k < 6; k++) {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = Math.round(p.getX(i) * 1000) / 1000,
      y = Math.round(p.getY(i) * 1000) / 1000,
      z = Math.round(p.getZ(i) * 1000) / 1000;
    const d = 0.82 + 0.36 * hash3(x + k * 3.1, y - k * 1.7, z + k * 0.9);
    p.setXYZ(i, x * d, y * d, z * d);
  }
  g.computeVertexNormals();
  BLOBS.push(g);
}
export const toCols = a => a.map(h => new THREE.Color(h));
export function cyc(ph) {
  const p = ph - 0.5,
    fl = Math.floor(p);
  const i = ((fl % 4) + 4) % 4;
  return [i, (i + 1) % 4, p - fl];
}
export function lerpNum(arr, ph) {
  const [a, b, f] = cyc(ph);
  return arr[a] + (arr[b] - arr[a]) * f;
}
export function lerpCol(arr, ph, out) {
  const [a, b, f] = cyc(ph);
  return out.copy(arr[a]).lerp(arr[b], f);
}
export const shadowAll = o =>
  o.traverse(m => {
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
/* Visitors, ducks and the cat come and go all day, so their parts share cached geometry and
   materials; three.js never frees GPU memory by itself, and a fresh set per body piled up. */
export const GEO: Record<string, THREE.BufferGeometry> = {},
  PMAT: Record<string, THREE.Material> = {};
export function G(type, ...a) {
  const k = type + a;
  return GEO[k] || (GEO[k] = new THREE[type](...a));
}
export function pmat(c) {
  return PMAT[c] || (PMAT[c] = mat(c));
}
/* Trees and decorations own their geometry (the shared BLOBS aside): free it when they go. */
export function freeGeo(o) {
  o.traverse(m => {
    if (m.geometry && !BLOBS.includes(m.geometry)) m.geometry.dispose();
  });
}

export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export function canvasTex(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
