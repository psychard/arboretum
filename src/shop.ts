import * as THREE from 'three';
import { $ } from './dom';
import { DC, DECOR, RARITY, SEASONS, SEASON_ICON, SEASON_LEN, SP, SPECIES, STAGES, nextAvail } from './data';
import { askPersist, curSeason, resetState, save, state } from './save';
import { camera, scene } from './render';
import { freeGeo } from './util';
import { GARDEN_R, POND, POND_R } from './world';
import { addTree, growthScale, treeRoot, trees } from './trees';
import { addDecor, decorRoot, decors, makeDecor } from './decor';
import { waterChanged } from './water';
import { clearPeople } from './people';
import { cat, removeCat } from './animals';
import { toast } from './ui';
import { refreshHud } from './hud';
import { leaveVisit, visiting } from './mp';
import { backupGarden, prepareShare, restoreGarden, shareGarden } from './sharing';

/* ---------- planting ---------- */
export let stage = STAGES[0],
  picked = null,
  ghostPos = null,
  pickRot = 0,
  shopTab = 'trees';
export const ghost = new THREE.Group();
export const ghostRingMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.85,
  depthWrite: false,
});
export const ghostRing = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.2, 32), ghostRingMat);
ghostRing.rotation.x = -Math.PI / 2;
ghostRing.position.y = 0.06;
ghost.add(ghostRing);
export const ghostCone = new THREE.Mesh(
  new THREE.ConeGeometry(0.7, 2.2, 8),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }),
);
ghostCone.position.y = 1.3;
ghost.add(ghostCone);
export let ghostDecor = null;
export const ghostDecorMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.4,
  depthWrite: false,
});
ghost.visible = false;
scene.add(ghost);
export const ray = new THREE.Raycaster(),
  groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
export function priceOf(sp, st) {
  return Math.round(sp.price * st.mult);
}
export const isDecor = p => !!p && p.kind === 'decor';
export function pickPrice(p) {
  return isDecor(p) ? p.price : priceOf(p, stage);
}
export function pickRad(p) {
  return isDecor(p) ? p.rad : 1.1;
}
export function placeError(x, z, rad) {
  rad = rad || 1.1;
  const r = Math.hypot(x, z);
  if (r > GARDEN_R + 1.1 - rad) return 'That spot is outside the hedge.';
  if (r < 3.9 + rad) return 'Leave the fountain plaza clear.';
  if (Math.abs(x) < 1.2 + rad && z > -rad) return 'Keep the path clear for visitors.';
  if (Math.hypot(x - POND.x, z - POND.z) < POND_R + 0.1 + rad) return 'That’s in the pond.';
  for (const t of trees) {
    if (Math.hypot(t.x - x, t.z - z) < 1.1 + rad) return 'Too close to a tree.';
  }
  for (const d of decors) {
    if (Math.hypot(d.x - x, d.z - z) < d.d.rad + rad) return `Too close to the ${d.d.name.toLowerCase()}.`;
  }
  return null;
}
export function onTap(cx, cy) {
  const ndc = new THREE.Vector2((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  if (picked) {
    const hit = new THREE.Vector3();
    if (!ray.ray.intersectPlane(groundPlane, hit)) return;
    const err = placeError(hit.x, hit.z, pickRad(picked));
    if (err) {
      toast(err);
      return;
    }
    ghostPos = hit;
    ghost.position.copy(hit);
    ghost.visible = true;
    updateBanner();
    return;
  }
  if (cat) {
    const h = ray.intersectObject(cat.c.g, true);
    if (h.length) {
      toast(`The gray cat ignores you completely. Sighting number ${state.cats}.`);
      return;
    }
  }
  const hits = ray.intersectObjects([treeRoot, decorRoot], true);
  if (hits.length) {
    let o = hits[0].object;
    while (o && !o.userData.tree && !o.userData.decor) o = o.parent;
    if (o && o.userData.tree) {
      const t = o.userData.tree;
      toast(`${t.sp.name}: ${Math.round(t.g * 100)}% grown. ${t.sp.rarity}.`);
    } else if (o && o.userData.decor) {
      toast(`${o.userData.decor.d.name}. Visitors love it.`);
    }
  }
}
export function setGhost() {
  if (ghostDecor) {
    ghost.remove(ghostDecor);
    freeGeo(ghostDecor);
    ghostDecor = null;
  }
  ghostCone.visible = !isDecor(picked);
  if (isDecor(picked)) {
    ghostDecor = makeDecor(picked.id);
    ghostDecor.traverse(m => {
      if (m.isMesh) {
        m.material = ghostDecorMat;
        m.castShadow = false;
        m.receiveShadow = false;
      }
    });
    ghost.add(ghostDecor);
  }
}
export function pick(p) {
  if (!p.seasons.includes(curSeason())) return;
  picked = p;
  ghostPos = null;
  pickRot = 0;
  setGhost();
  ghost.visible = false;
  closeShop();
  updateBanner();
}
export function updateBanner() {
  const b = $('#banner'),
    txt = $('#bannerTxt'),
    pb = $<HTMLButtonElement>('#plantBtn'),
    rb = $('#rotBtn');
  if (!picked) {
    b.style.display = 'none';
    ghost.visible = false;
    return;
  }
  b.style.display = 'flex';
  const price = pickPrice(picked),
    ok = state.money >= price,
    dec = isDecor(picked);
  const label = dec ? picked.name.toLowerCase() : `${stage.name.toLowerCase()} ${picked.name}`;
  rb.style.display = dec && ghostPos ? '' : 'none';
  if (!ghostPos) {
    txt.textContent = `Tap the ground to place a ${label} ($${price}).`;
    pb.style.display = 'none';
  } else {
    txt.textContent = ok
      ? `${dec ? 'Place' : 'Plant'} the ${dec ? label : picked.name} here for $${price}?`
      : `You need $${price - Math.floor(state.money)} more for this ${dec ? label : picked.name}.`;
    pb.style.display = '';
    pb.disabled = !ok;
    pb.textContent = `${dec ? 'Place' : 'Plant'} for $${price}`;
  }
  ghostRingMat.color.set(ok ? 0xffffff : 0xd06040);
  if (dec) {
    ghost.scale.setScalar(1);
    ghostRing.scale.setScalar(picked.rad / 1.05);
    ghost.rotation.y = pickRot;
  } else {
    ghostRing.scale.setScalar(1);
    ghost.rotation.y = 0;
    ghost.scale.setScalar(growthScale(stage.g) * 1.4);
  }
}
$('#plantBtn').onclick = () => {
  if (!picked || !ghostPos) return;
  const price = pickPrice(picked);
  if (state.money < price) {
    toast('Not enough money yet; visitors will bring more.');
    return;
  }
  const err = placeError(ghostPos.x, ghostPos.z, pickRad(picked));
  if (err) {
    toast(err);
    return;
  }
  state.money -= price;
  if (isDecor(picked)) {
    addDecor(picked.id, ghostPos.x, ghostPos.z, pickRot);
    toast(`Placed a ${picked.name.toLowerCase()}.`);
  } else {
    addTree(picked.id, ghostPos.x, ghostPos.z, stage.g);
    toast(`Planted a ${picked.name}.`);
  }
  ghostPos = null;
  ghost.visible = false;
  updateBanner();
  save();
  askPersist();
  refreshHud(true);
};
$('#rotBtn').onclick = () => {
  pickRot += Math.PI / 4;
  updateBanner();
};
$('#doneBtn').onclick = () => {
  picked = null;
  ghostPos = null;
  updateBanner();
};

export function renderSeg() {
  $('#tabs').innerHTML = [
    ['trees', '🌳 Trees'],
    ['decor', '🪑 Garden decor'],
  ]
    .map(([id, l]) => `<button data-t="${id}" aria-pressed="${shopTab === id}">${l}</button>`)
    .join('');
  $('#tabs')
    .querySelectorAll('button')
    .forEach(
      b =>
        (b.onclick = () => {
          shopTab = b.dataset.t;
          renderSeg();
          renderList();
          $('#list').scrollTop = 0;
        }),
    );
  const tr = shopTab === 'trees';
  $('#seg').style.display = tr ? '' : 'none';
  $('#note').textContent = tr
    ? 'Stock changes with every season. Older trees cost more but draw visitors sooner; rare trees draw more of them.'
    : 'Decorations are always in stock and make the garden a little more appealing to visitors. Use Rotate to turn them before placing.';
  $('#seg').innerHTML = STAGES.map(
    s =>
      `<button data-s="${s.id}" aria-pressed="${s === stage}">${s.name}<small>${s.mult === 1 ? 'base price' : '× ' + s.mult}</small></button>`,
  ).join('');
  $('#seg')
    .querySelectorAll('button')
    .forEach(
      b =>
        (b.onclick = () => {
          stage = STAGES.find(s => s.id === b.dataset.s);
          renderSeg();
          renderList();
          updateBanner();
        }),
    );
}
export function renderList() {
  const ph = state.season / SEASON_LEN;
  const si = curSeason();
  const row = (sp, avail) => {
    const pr = priceOf(sp, stage),
      ok = state.money >= pr;
    const btn = avail
      ? `<button class="btn buy ${ok ? '' : 'cant'}" data-id="${sp.id}"><span class="num">$${pr.toLocaleString()}</span>${ok ? 'Choose' : 'Save up'}</button>`
      : `<button class="btn buy" disabled><span class="num">$${pr.toLocaleString()}</span>Back in ${SEASONS[nextAvail(sp, si)].toLowerCase()}</button>`;
    return `<div class="tree-row${avail ? '' : ' off'}"><canvas class="thumb" width="144" height="144" data-id="${sp.id}" aria-hidden="true"></canvas>
      <div><h3>${sp.name}<span class="rar" style="color:${RARITY[sp.rarity].c}">${sp.rarity}</span></h3><p>${sp.desc}</p></div>${btn}</div>`;
  };
  const inS = SPECIES.filter(s => s.seasons.includes(si)),
    outS = SPECIES.filter(s => !s.seasons.includes(si));
  if (shopTab === 'decor') {
    $('#list').innerHTML = DECOR.map(d => {
      const ok = state.money >= d.price;
      return `<div class="tree-row"><canvas class="thumb" width="144" height="144" data-kind="decor" data-id="${d.id}" aria-hidden="true"></canvas>
      <div><h3>${d.name}</h3><p>${d.desc}</p></div><button class="btn buy ${ok ? '' : 'cant'}" data-d="${d.id}"><span class="num">$${d.price}</span>${ok ? 'Choose' : 'Save up'}</button></div>`;
    }).join('');
    $('#list')
      .querySelectorAll<HTMLButtonElement>('.buy[data-d]')
      .forEach(b => (b.onclick = () => pick(DC[b.dataset.d])));
  } else {
    $('#list').innerHTML =
      `<div class="sec">${SEASON_ICON[si]} In stock this ${SEASONS[si].toLowerCase()}</div>` +
      inS.map(s => row(s, true)).join('') +
      `<div class="sec">Out of season</div>` +
      outS.map(s => row(s, false)).join('');
    $('#list')
      .querySelectorAll<HTMLButtonElement>('.buy[data-id]')
      .forEach(b => (b.onclick = () => pick(SP[b.dataset.id])));
  }
  $('#wallet').textContent = '$' + Math.floor(state.money).toLocaleString();
  const mins = Math.floor(state.play / 60);
  $('#stats').innerHTML =
    `<span>${trees.length} trees</span><span>${decors.length} decorations</span><span>${state.visitorsTotal} visitors</span><span>$${state.earned.toLocaleString()} in tickets</span><span>${mins} min played</span><span class="acts"><button class="btn" id="shareBtn">Share</button><button class="btn" id="backupBtn">Back up</button><button class="btn" id="restoreBtn">Restore</button><button class="btn" id="reset">Start over</button></span>`;
  $('#shareBtn').onclick = shareGarden;
  $('#backupBtn').onclick = backupGarden;
  $('#restoreBtn').onclick = restoreGarden;
  let armed = false;
  const rb = $('#reset');
  rb.onclick = () => {
    if (!armed) {
      armed = true;
      rb.textContent = 'Tap again to erase';
      setTimeout(() => {
        armed = false;
        if (rb.isConnected) rb.textContent = 'Start over';
      }, 3000);
      return;
    }
    resetGame();
  };
}
export function openShop() {
  if (visiting) {
    toast('You can only shop in your own arboretum.');
    return;
  }
  renderSeg();
  renderList();
  prepareShare();
  $('#shop').classList.add('open');
  $('#shop').setAttribute('aria-hidden', 'false');
}
export function closeShop() {
  $('#shop').classList.remove('open');
  $('#shop').setAttribute('aria-hidden', 'true');
}
$('#shopBtn').onclick = openShop;
$('#closeShop').onclick = closeShop;
export function resetGame() {
  if (visiting) leaveVisit(true);
  waterChanged();
  trees.slice().forEach(t => {
    treeRoot.remove(t.group);
    freeGeo(t.group);
  });
  trees.length = 0;
  decors.slice().forEach(d => {
    decorRoot.remove(d.group);
    freeGeo(d.group);
  });
  decors.length = 0;
  clearPeople();
  removeCat();
  resetState();
  state.started = true;
  picked = null;
  updateBanner();
  save();
  closeShop();
  refreshHud(true);
  toast('A fresh meadow and $100 to spend.');
}

export function dropPick() {
  picked = null;
  ghostPos = null;
  updateBanner();
}
