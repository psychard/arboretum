import * as THREE from 'three';
import { POND, POND_R } from './world';
import { decors, localToWorld } from './decor';
import { type Point, WalkGrid } from './route';

/* ---------- water obstacles and ducks ---------- */

export let obsDirty = true,
  OBS = [],
  ducksDirty = true;
export function waterObstacles() {
  if (!obsDirty) return OBS;
  obsDirty = false;
  // the big pond, and the fountain's basin in the plaza
  OBS = [
    { x: POND.x, z: POND.z, r: POND_R + 0.2 },
    { x: 0, z: 0, r: 1.85 },
  ];
  for (const d of decors) {
    if (d.d.id === 'minipond') OBS.push({ x: d.x, z: d.z, r: 1.7 });
    if (d.d.id === 'bridge')
      [
        [-1.4, 0.85],
        [1.4, 0.85],
        [-2.3, 0.8],
        [2.3, 0.8],
      ].forEach(([lx, r]) => {
        const p = localToWorld(d, lx, 0);
        OBS.push({ x: p.x, z: p.z, r });
      });
  }
  return OBS;
}
export function inWater(x, z, m) {
  for (const c of waterObstacles()) if (Math.hypot(x - c.x, z - c.z) < c.r + (m || 0)) return true;
  return false;
}
export function duckPonds() {
  return [{ x: POND.x, z: POND.z, r: POND_R }].concat(
    decors.filter(d => d.d.id === 'minipond').map(d => ({ x: d.x, z: d.z, r: 1.5 })),
  );
}

/** One step straight towards target; true once there. */
export function walkTo(obj, target, speed, dt) {
  const d = new THREE.Vector3().subVectors(target, obj.position);
  d.y = 0;
  const dist = d.length();
  if (dist < 0.15) return true;
  d.normalize();
  const step = Math.min(dist, speed * dt);
  obj.position.addScaledVector(d, step);
  const want = Math.atan2(d.x, d.z);
  let diff = want - obj.rotation.y;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  obj.rotation.y += diff * Math.min(1, dt * 6);
  return false;
}

/* The water as a grid to plan routes on (route.ts), remade when the water changes. */
let waterVer = 0,
  grid: WalkGrid | null = null,
  gridVer = -1;
function walkGrid() {
  if (!grid || gridVer !== waterVer) {
    grid = new WalkGrid(waterObstacles());
    gridVer = waterVer;
  }
  return grid;
}
const step = new THREE.Vector3();
/** One step along a route round the water to target; true once there. The route is kept on h
    (a visitor, the cat, an avatar) and planned again when the target or the water changes. */
export function walkRoute(
  obj,
  h: { route?: Point[]; routeTo?: unknown; routeVer?: number },
  target,
  speed,
  dt,
) {
  if (!h.route || h.routeTo !== target || h.routeVer !== waterVer) {
    h.route = walkGrid().findPath(obj.position.x, obj.position.z, target.x, target.z);
    h.routeTo = target;
    h.routeVer = waterVer;
  }
  const r = h.route,
    next = r[0];
  if (!next) return true;
  if (walkTo(obj, step.set(next.x, obj.position.y, next.z), speed, dt)) {
    r.shift();
    return r.length === 0;
  }
  return false;
}

/* placing, clearing or swapping decorations moves the water: rebuild obstacles and ducks */
export function waterChanged() {
  obsDirty = true;
  ducksDirty = true;
  waterVer++;
}
export function takeDucksDirty() {
  const d = ducksDirty;
  ducksDirty = false;
  return d;
}
