import * as THREE from 'three';
import { scene } from './render';
import { BLOBS, hash3, mat, shadowAll, toCols } from './util';

/* ---------- world ---------- */
export const GARDEN_R = 32,
  GATE = new THREE.Vector3(0, 0, 35),
  POND = new THREE.Vector3(-14, 0, -8),
  POND_R = 4.4;
/* the world's shared materials, recoloured each frame by the season */
export const W = {} as {
  ground: THREE.Mesh;
  groundMat: THREE.MeshPhongMaterial;
  pathMat: THREE.MeshPhongMaterial;
  waterMat: THREE.MeshPhongMaterial;
  hedgeMat: THREE.MeshPhongMaterial;
  hillMat: THREE.MeshPhongMaterial;
  farMat: THREE.MeshPhongMaterial;
  forestMat: THREE.MeshPhongMaterial;
};
(function buildWorld() {
  // ground
  const gg = new THREE.CircleGeometry(110, 96);
  gg.rotateX(-Math.PI / 2);
  const cols = [];
  const p = gg.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      z = p.getZ(i);
    const n =
      0.86 +
      0.14 * Math.sin(x * 0.23 + Math.cos(z * 0.17) * 2) * Math.cos(z * 0.21 - x * 0.07) +
      0.06 * hash3(x, 0, z);
    cols.push(n, n, n * 0.97);
  }
  gg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  W.groundMat = mat('#6f9a46', { vertexColors: true });
  const ground = new THREE.Mesh(gg, W.groundMat);
  ground.receiveShadow = true;
  scene.add(ground);
  W.ground = ground;
  // path and plaza
  W.pathMat = mat('#c9b48a');
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 40), W.pathMat);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.02, 20);
  path.receiveShadow = true;
  scene.add(path);
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(4.2, 40), W.pathMat);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.025;
  plaza.receiveShadow = true;
  scene.add(plaza);
  // fountain
  const stone = mat('#a59c8c');
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.55, 16), stone);
  basin.position.y = 0.27;
  scene.add(basin);
  W.waterMat = mat('#6a98a8');
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.4, 16), W.waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.56;
  scene.add(water);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.4, 8), stone);
  col.position.y = 1.1;
  scene.add(col);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.3, 0.25, 12), stone);
  bowl.position.y = 1.85;
  scene.add(bowl);
  shadowAll(basin);
  shadowAll(col);
  shadowAll(bowl);
  // pond
  const pond = new THREE.Mesh(new THREE.CircleGeometry(POND_R, 36), W.waterMat);
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(POND.x, 0.03, POND.z);
  scene.add(pond);
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const r = new THREE.Mesh(BLOBS[i % 6], stone);
    const s = 0.35 + 0.25 * hash3(i, 1, 2);
    r.scale.set(s, s * 0.6, s);
    r.position.set(POND.x + Math.cos(a) * (POND_R + 0.2), 0.1, POND.z + Math.sin(a) * (POND_R + 0.2));
    r.castShadow = true;
    scene.add(r);
  }
  // hedge with a gap at the gate
  W.hedgeMat = mat('#3f6334');
  const gap = 0.13;
  const hg = new THREE.TorusGeometry(35, 0.7, 6, 90, Math.PI * 2 - gap);
  const hedge = new THREE.Mesh(hg, W.hedgeMat);
  hedge.rotation.x = -Math.PI / 2;
  hedge.scale.z = 1.4;
  const hp = new THREE.Group();
  hp.add(hedge);
  hp.rotation.y = -Math.PI / 2 + gap / 2 - 0.0;
  hp.position.y = 0.5;
  shadowAll(hp);
  scene.add(hp);
  // gate
  const wood = mat('#5a4430');
  [-2.1, 2.1].forEach(x => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3, 0.35), wood);
    post.position.set(x, 1.5, 35);
    shadowAll(post);
    scene.add(post);
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(5, 0.35, 0.45), wood);
  beam.position.set(0, 3.1, 35);
  shadowAll(beam);
  scene.add(beam);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.6, 0.12), mat('#e2d4ac'));
  sign.position.set(0, 2.55, 35.1);
  scene.add(sign);
  // benches
  [
    [3.4, 12],
    [-3.4, 22],
    [5.5, -2.5],
  ].forEach(([x, z], i) => {
    const b = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 1.8), wood);
    seat.position.y = 0.5;
    b.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 1.8), wood);
    back.position.set(x > 0 ? 0.28 : -0.28, 0.8, 0);
    b.add(back);
    [-0.7, 0.7].forEach(dz => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.1), wood);
      l.position.set(0, 0.25, dz);
      b.add(l);
    });
    b.position.set(x, 0, z);
    if (i === 2) b.rotation.y = Math.PI / 2;
    shadowAll(b);
    scene.add(b);
  });
  // hills
  W.hillMat = mat('#6f8d5a');
  W.farMat = mat('#8aa0a0');
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.2 * Math.sin(i * 3);
    const h = new THREE.Mesh(BLOBS[i % 6], i % 2 ? W.hillMat : W.farMat);
    const r = (i % 2 ? 78 : 95) + 8 * Math.sin(i * 1.7);
    const s = 14 + 10 * hash3(i, 3, 4);
    h.scale.set(s * 1.6, s * (0.45 + 0.3 * hash3(i, 5, 1)), s);
    h.position.set(Math.cos(a) * r, -2, Math.sin(a) * r);
    h.rotation.y = a;
    scene.add(h);
  }
  // distant tree line
  W.forestMat = mat('#4c6b40');
  for (let i = 0; i < 70; i++) {
    const a = (i / 70) * Math.PI * 2 + hash3(i, 9, 9) * 0.08;
    const r = 56 + 6 * hash3(i, 2, 7);
    const m = new THREE.Mesh(BLOBS[i % 6], W.forestMat);
    const s = 2 + 1.6 * hash3(i, 4, 4);
    m.scale.set(s, s * 1.5, s);
    m.position.set(Math.cos(a) * r, s * 0.9, Math.sin(a) * r);
    scene.add(m);
  }
})();

/* season palettes */
export const PAL = {
  sky: toCols(['#d4e3e6', '#b9d4e6', '#e6cfa4', '#cdd4da']),
  ground: toCols(['#7fa851', '#5f8a3a', '#a3894a', '#e2e5e6']),
  path: toCols(['#cbb68c', '#d0b886', '#c3a679', '#e8e4dc']),
  hedge: toCols(['#4c7a3c', '#36602f', '#6a6a34', '#7a8c7c']),
  hill: toCols(['#7f9d62', '#628655', '#a48a5a', '#c6ccd0']),
  far: toCols(['#9ab0ac', '#8ea8b4', '#b8a890', '#b8c2ca']),
  forest: toCols(['#5f8a48', '#3f6234', '#8a6a34', '#8a9286']),
  water: toCols(['#6a9cab', '#5a8ea8', '#6f8e94', '#c4d8e0']),
  sunC: toCols(['#fff2dc', '#fff6e0', '#ffd9a8', '#e8eef6']),
  hemiTop: toCols(['#e4ecf0', '#e8f0f6', '#f0dcc0', '#dfe6ee']),
  part: toCols(['#f6c0d0', '#ffffff', '#d0702a', '#ffffff']),
};
export const SUN_I = [0.95, 1.05, 0.85, 0.7],
  PART_O = [0.8, 0, 0.85, 0.95],
  PART_V = [0.7, 1, 1.1, 0.55];
export const tmpC = new THREE.Color();

/* falling petals, leaves, snow */
export const PN = 320;
export const pGeo = new THREE.BufferGeometry();
export const pPos = new Float32Array(PN * 3);
export const pSeed = new Float32Array(PN);
for (let i = 0; i < PN; i++) {
  const a = Math.random() * Math.PI * 2,
    r = Math.sqrt(Math.random()) * 34;
  pPos[i * 3] = Math.cos(a) * r;
  pPos[i * 3 + 1] = Math.random() * 16;
  pPos[i * 3 + 2] = Math.sin(a) * r;
  pSeed[i] = Math.random() * 10;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
export const pMat = new THREE.PointsMaterial({
  size: 0.28,
  transparent: true,
  opacity: 0.8,
  depthWrite: false,
});
export const points = new THREE.Points(pGeo, pMat);
scene.add(points);
