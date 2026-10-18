import * as THREE from 'three';
import { $ } from './dom';
import { CAT_EVERY, RARITY, SEASONS, SEASON_LEN, SPECIES, TICKET } from './data';
import { askPersist, load, save, state } from './save';
import { camera, hemi, postCam, postScene, renderer, rt, scene, sun } from './render';
import { lerpCol, lerpNum } from './util';
import { PAL, PART_O, PART_V, PN, SUN_I, W, pGeo, pMat, pPos, pSeed, points } from './world';
import { addTree, growthScale, trees } from './trees';
import { DM, FLOWER_C, addDecor, decors } from './decor';
import { takeDucksDirty } from './water';
import { people, spawnVisitor, updatePeople, updateSocial } from './people';
import { cat, spawnCat, syncDucks, updateCat, updateDucks } from './animals';
import { focusOn, joyX, joyY, unfocus, updateCamera } from './camera';
import { renderThumbs } from './thumbs';
import { floatText, toast } from './ui';
import { refreshHud, tickHud } from './hud';
import { initMultiplayer, publishWorld, tickPresence, updateAvatars, visiting } from './mp';

/* ---------- simulation ---------- */
export let visitorClock = 0;
export function beauty() {
  let b = 0;
  for (const t of trees) b += RARITY[t.sp.rarity].w * (0.25 + t.g);
  for (const d of decors) b += d.d.w;
  return b;
}
export function applySeason(ph, t) {
  lerpCol(PAL.sky, ph, scene.background as THREE.Color);
  scene.fog.color.copy(scene.background as THREE.Color);
  lerpCol(PAL.ground, ph, W.groundMat.color);
  lerpCol(PAL.path, ph, W.pathMat.color);
  lerpCol(PAL.hedge, ph, W.hedgeMat.color);
  lerpCol(PAL.hill, ph, W.hillMat.color);
  lerpCol(PAL.far, ph, W.farMat.color);
  lerpCol(PAL.forest, ph, W.forestMat.color);
  lerpCol(PAL.water, ph, W.waterMat.color);
  lerpCol(PAL.sunC, ph, sun.color);
  sun.intensity = lerpNum(SUN_I, ph);
  lerpCol(PAL.hemiTop, ph, hemi.color);
  // sun arcs lower in winter
  const elev = lerpNum([0.95, 1.15, 0.8, 0.55], ph);
  sun.position.set(Math.cos(0.6) * 40, Math.sin(elev) * 55, Math.sin(0.6) * 40);
  lerpCol(FLOWER_C, ph, DM.flower.color);
  SPECIES.forEach(sp => {
    lerpCol(sp.colors, ph, sp.folMat.color);
    sp.folScale = lerpNum(sp.fol, ph);
  });
  lerpCol(PAL.part, ph, pMat.color);
  pMat.opacity = lerpNum(PART_O, ph);
  points.visible = pMat.opacity > 0.03;
  pMat.size = lerpNum([0.26, 0.2, 0.34, 0.22], ph);
}
export function updateTrees(dt, t) {
  for (const tr of trees) {
    if (tr.g < 1) {
      tr.g = Math.min(1, tr.g + dt / RARITY[tr.sp.rarity].grow);
      tr.group.scale.setScalar(growthScale(tr.g));
    }
    const fs = tr.sp.folScale;
    for (const m of tr.fol) {
      if (fs < 0.03) {
        m.visible = false;
        continue;
      }
      m.visible = true;
      const b = m.userData.base;
      m.scale.set(b.x * fs, b.y * (m.userData.sway !== undefined ? Math.max(fs, 0.3) : fs), b.z * fs);
      if (m.userData.sway !== undefined) m.rotation.z = Math.sin(t * 1.1 + m.userData.sway) * 0.06;
    }
  }
}
export function updateParticles(dt, t, ph) {
  if (!points.visible) return;
  const sp = lerpNum(PART_V, ph);
  for (let i = 0; i < PN; i++) {
    const k = i * 3;
    pPos[k + 1] -= dt * sp * (0.6 + 0.5 * Math.sin(pSeed[i]));
    pPos[k] += Math.sin(t * 0.8 + pSeed[i]) * dt * 0.4;
    pPos[k + 2] += Math.cos(t * 0.6 + pSeed[i]) * dt * 0.3;
    if (pPos[k + 1] < 0) {
      const a = Math.random() * Math.PI * 2,
        r = Math.sqrt(Math.random()) * 34;
      pPos[k] = Math.cos(a) * r;
      pPos[k + 1] = 14 + Math.random() * 3;
      pPos[k + 2] = Math.sin(a) * r;
    }
  }
  pGeo.attributes.position.needsUpdate = true;
}

/* ---------- loop ---------- */
export let last = performance.now(),
  saveClock = 0,
  running = false;
export function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const t = now / 1000;
  if (running) {
    state.play += dt;
    state.season = (state.season + dt) % (SEASON_LEN * 4);
    if (trees.length) {
      visitorClock += dt;
      const iv = Math.max(3, Math.min(40, 35 / (1 + beauty() * 0.3)));
      if (visitorClock >= iv) {
        visitorClock = 0;
        if (people.length < 22) spawnVisitor();
        else if (!visiting) {
          state.money += TICKET;
          state.earned += TICKET;
          state.visitorsTotal++;
          floatText('+$' + TICKET, new THREE.Vector3(0, 3.6, 35));
        }
      }
    }
    if (state.play >= state.nextCat) {
      state.nextCat += CAT_EVERY;
      if (!cat) spawnCat();
    }
    updateTrees(dt, t);
    updatePeople(dt);
    updateSocial(dt);
    updateCat(dt);
    updateDucks(dt);
    saveClock += dt;
    if (saveClock > 5) {
      saveClock = 0;
      save();
    }
  }
  const ph = state.season / SEASON_LEN;
  applySeason(ph, t);
  updateParticles(dt, t, ph);
  if (focusOn && (joyX || joyY) && !cat) unfocus();
  if (takeDucksDirty()) syncDucks();
  updateCamera(dt);
  updateAvatars(dt);
  tickPresence(dt);
  renderThumbs(dt, t);
  tickHud(dt);
  renderer.setRenderTarget(rt);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  renderer.render(postScene, postCam);
  requestAnimationFrame(loop);
}

/* ---------- boot ---------- */
export const AWAY_RATE = 0.1; // seasons move at a tenth of normal speed while you're away
export function driftSeasons(sec) {
  if (!(sec > 5)) return 0;
  const adv = Math.min(sec * AWAY_RATE, SEASON_LEN * 4);
  state.season = (state.season + adv) % (SEASON_LEN * 4);
  return adv;
}
export const had = load();
export const awayAdv = had && state.savedAt ? driftSeasons((Date.now() - state.savedAt) / 1000) : 0;
(state.trees || []).forEach(t => addTree(t.s, t.x, t.z, t.g, t.seed));
(state.decor || []).forEach(d => addDecor(d.d, d.x, d.z, d.r));
if (had && state.started) {
  $('#intro').style.display = 'none';
  running = true;
  const extra =
    awayAdv >= 60 ? ` While you were away, the seasons drifted on by ${Math.round(awayAdv / 60)} min.` : '';
  toast(
    `Welcome back. It’s ${SEASONS[Math.floor(state.season / SEASON_LEN) % 4].toLowerCase()} in your arboretum.${extra}`,
    null,
    6000,
  );
}
$('#begin').onclick = () => {
  $('#intro').style.display = 'none';
  state.started = true;
  running = true;
  save();
  publishWorld(true);
  askPersist();
};
export let hiddenAt = 0;
addEventListener('pagehide', save);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    hiddenAt = Date.now();
    save();
  } else if (hiddenAt) {
    const adv = running ? driftSeasons((Date.now() - hiddenAt) / 1000) : 0;
    hiddenAt = 0;
    last = performance.now();
    if (adv >= 60)
      toast(`While you were away, the seasons drifted on by ${Math.round(adv / 60)} min.`, null, 5000);
  }
});
refreshHud(true);
requestAnimationFrame(loop);
initMultiplayer();

// In `npm run dev` the console can reach every module as the game itself
// loaded it, e.g. arb.save.state, arb.people.people or arb.render.renderer.info.
// (Importing a module from the console instead can load a second copy of it.)
// Vite drops this from production builds.
if (import.meta.env.DEV) {
  const mods = import.meta.glob(['./*.ts', '!./main.ts'], { eager: true });
  (window as any).arb = Object.fromEntries(Object.entries(mods).map(([k, m]) => [k.slice(2, -3), m]));
}
