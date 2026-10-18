import * as THREE from 'three';
import { $ } from './dom';
import { camera, canvas } from './render';
import { onTap } from './shop';

/* ---------- camera and controls ---------- */
export let camAz = 0.35,
  camEl = 0.5,
  camR = 34,
  focusOn = null;
export const camTarget = new THREE.Vector3(0, 1, 0),
  home = new THREE.Vector3(0, 1, 0);
export let joyX = 0,
  joyY = 0;
(function joystick() {
  const joy = $('#joy'),
    knob = $('#knob');
  let id = null;
  const set = e => {
    const r = joy.getBoundingClientRect();
    let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2),
      dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const l = Math.hypot(dx, dy);
    if (l > 1) {
      dx /= l;
      dy /= l;
    }
    joyX = dx;
    joyY = dy;
    knob.style.transform = `translate(${dx * 34}px,${dy * 34}px)`;
  };
  joy.addEventListener('pointerdown', e => {
    id = e.pointerId;
    joy.setPointerCapture(id);
    set(e);
    e.preventDefault();
  });
  joy.addEventListener('pointermove', e => {
    if (e.pointerId === id) set(e);
  });
  const end = e => {
    if (e.pointerId !== id) return;
    id = null;
    joyX = joyY = 0;
    knob.style.transform = '';
  };
  joy.addEventListener('pointerup', end);
  joy.addEventListener('pointercancel', end);
})();
export const ptrs = new Map();
export let pinch0 = 0,
  rad0 = 0,
  downAt = null;
canvas.addEventListener('pointerdown', e => {
  // capture is a nicety; if the browser refuses it the drag must still work
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch (err) {}
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 1) downAt = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
  if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()];
    pinch0 = Math.hypot(a.x - b.x, a.y - b.y);
    rad0 = camR;
    if (downAt) downAt.moved = true;
  }
});
canvas.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId);
  if (!p) return;
  const dx = e.clientX - p.x,
    dy = e.clientY - p.y;
  p.x = e.clientX;
  p.y = e.clientY;
  if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinch0 > 0) camR = clampR((rad0 * pinch0) / d);
    return;
  }
  if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8) downAt.moved = true;
  if (downAt && downAt.moved) {
    camAz -= dx * 0.006;
    camEl = clampEl(camEl + dy * 0.004);
  }
});
export const upPtr = e => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if (ptrs.size === 0 && downAt) {
    if (!downAt.moved && performance.now() - downAt.t < 500) onTap(e.clientX, e.clientY);
    downAt = null;
  }
};
canvas.addEventListener('pointerup', upPtr);
canvas.addEventListener('pointercancel', upPtr);
// Also on the window: if a release ever misses the canvas -- a finger leaving by
// the screen edge, or a browser that would not grant the pointer capture above --
// the id would stay in ptrs, and from then on ptrs.size never falls back to zero,
// so nothing would be tappable again until the page was reloaded.
addEventListener('pointerup', upPtr);
addEventListener('pointercancel', upPtr);
canvas.addEventListener(
  'wheel',
  e => {
    camR = clampR(camR * (1 + Math.sign(e.deltaY) * 0.08));
    e.preventDefault();
  },
  { passive: false },
);
$('#zin').onclick = () => (camR = clampR(camR * 0.82));
$('#zout').onclick = () => (camR = clampR(camR * 1.2));
export function clampR(r) {
  return Math.max(7, Math.min(70, r));
}
export function clampEl(e) {
  return Math.max(0.1, Math.min(1.35, e));
}
export function updateCamera(dt) {
  camAz -= joyX * 1.5 * dt;
  camEl = clampEl(camEl - joyY * 0.9 * dt);
  const want = focusOn ? new THREE.Vector3(focusOn.x, 0.8, focusOn.z) : home;
  camTarget.lerp(want, Math.min(1, dt * 2.2));
  camera.position.set(
    camTarget.x + camR * Math.cos(camEl) * Math.sin(camAz),
    camTarget.y + camR * Math.sin(camEl),
    camTarget.z + camR * Math.cos(camEl) * Math.cos(camAz),
  );
  if (camera.position.y < 0.6) camera.position.y = 0.6;
  camera.lookAt(camTarget);
}

/* the cat's toast and the joystick move the camera's focus from outside */
export function focusCam(p, maxR) {
  focusOn = p;
  if (maxR) camR = Math.min(camR, maxR);
}
export function unfocus(p?) {
  if (!p || focusOn === p) focusOn = null;
}
