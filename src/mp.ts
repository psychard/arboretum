import * as THREE from 'three';
import { $ } from './dom';
import { DC, SEASON_LEN, SP } from './data';
import { save, state } from './save';
import { camera, scene } from './render';
import { freeGeo } from './util';
import { addTree, treeRoot, trees } from './trees';
import { addDecor, decorRoot, decors } from './decor';
import { walkRoute, waterChanged } from './water';
import { clearPeople, makePerson } from './people';
import { camTarget } from './camera';
import { closeShop, dropPick } from './shop';
import { floatText, toast } from './ui';

/* ---------- multiplayer: visit other gardeners’ arboretums ---------- */
export const MP = {
  room: null,
  db: null,
  user: null,
  myId: null,
  canPublish: true,
  lastSig: '',
  lastPub: 0,
  ver: 0,
  peers: [],
  names: {},
  avatars: new Map(),
  wasHere: new Set(),
};
export let visiting = null,
  presClock = 0,
  lastPres = '';
export const currentWorld = () => (visiting ? visiting.owner : MP.myId);
export const AV_RING = new THREE.RingGeometry(0.45, 0.6, 24);
export function hashStr(t) {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
  return Math.abs(h);
}
export function peerKey(p) {
  const pr = p.presence || {};
  return p.by || (typeof pr.home === 'string' ? pr.home : null) || p.peer;
}
export function nameOf(id) {
  return (id && MP.names[id]) || 'A fellow gardener';
}
export async function initMultiplayer() {
  if (!(window as any).claude || typeof (window as any).claude.use !== 'function') return;
  try {
    const [room, db, user] = await Promise.all([
      (window as any).claude.use('room'),
      (window as any).claude.use('db'),
      (window as any).claude.use('user'),
    ]);
    MP.db = db;
    MP.user = user;
    MP.myId = user ? await user.id() : null;
    if (!room) return;
    MP.room = room;
    $('#playersBtn').style.display = '';
    room.onPeers(
      ch => {
        MP.peers = ch.peers;
        onPeersChanged();
      },
      () => {},
    );
    room.on(
      'wave',
      msg => {
        const d = msg.data || {};
        if (typeof d.world !== 'string' || d.world !== currentWorld()) return;
        const av = MP.avatars.get(msg.peer),
          pos = av ? av.p.g.position.clone() : camTarget.clone();
        floatText('👋', pos.setY(2.5));
        if (!msg.isMe) toast(`${nameOf(msg.by)} waves at you.`);
      },
      () => {},
    );
    sendPresence(true);
    publishWorld(true);
  } catch (e) {}
}
export function sendPresence(force?) {
  if (!MP.room) return;
  const p = {
    home: MP.myId || null,
    world: currentWorld() || null,
    x: Math.round(camTarget.x * 10) / 10,
    z: Math.round(camTarget.z * 10) / 10,
  };
  const sig = JSON.stringify(p);
  if (!force && sig === lastPres) return;
  lastPres = sig;
  MP.room.presence(p).catch(() => {});
}
export function publishWorld(force?) {
  if (!MP.db || !MP.myId || visiting || !MP.canPublish || !state.started) return;
  const sig = JSON.stringify([
      (state.trees || []).map(t => [t.s, t.x, t.z, Math.round(t.g * 50)]),
      state.decor || [],
    ]),
    now = Date.now();
  if (!force && sig === MP.lastSig && now - MP.lastPub < 120000) return;
  if (sig !== MP.lastSig) MP.ver = now;
  MP.lastSig = sig;
  MP.lastPub = now;
  MP.db
    .doc('worlds/' + MP.myId)
    .set({
      trees: state.trees || [],
      decor: state.decor || [],
      season: Math.round(state.season),
      at: now,
      ver: MP.ver,
    })
    .catch(e => {
      if (e && ['not_granted', 'capability_disabled', 'capability_removed', 'revoked'].includes(e.code))
        MP.canPublish = false;
    });
}
export function onPeersChanged() {
  const others = MP.peers.filter(p => !p.isMe && p.kind === 'viewer');
  const ids = new Set(others.map(peerKey));
  others.forEach(p => {
    const w = (p.presence || {}).world;
    if (typeof w === 'string') ids.add(w);
  });
  if (visiting) ids.add(visiting.owner);
  if (MP.user && ids.size)
    MP.user
      .profiles([...ids])
      .then(ps => {
        let ch = false;
        for (const id of ids) {
          const n = (ps[id] && ps[id].name) || '';
          if (MP.names[id] !== n) {
            MP.names[id] = n;
            ch = true;
          }
        }
        if (ch) renderPlayers();
      })
      .catch(() => {});
  const people_ = new Set(others.map(peerKey));
  $('#online').textContent = String(people_.size);
  if (!visiting && MP.myId) {
    const here = new Set(others.filter(p => (p.presence || {}).world === MP.myId).map(peerKey));
    for (const id of here)
      if (!MP.wasHere.has(id))
        toast(`${nameOf(id)} is visiting your arboretum.`, { label: '👋 Wave', fn: sendWave }, 6000);
    MP.wasHere = here;
  }
  syncAvatars();
  renderPlayers();
}
export function syncAvatars() {
  const w = currentWorld(),
    want = new Map();
  for (const p of MP.peers) {
    if (p.isMe || p.kind !== 'viewer') continue;
    const pr = p.presence || {};
    if (!w || pr.world !== w) continue;
    const x = +pr.x,
      z = +pr.z;
    if (!isFinite(x) || !isFinite(z)) continue;
    want.set(p.peer, {
      x: Math.max(-34, Math.min(34, x)),
      z: Math.max(-34, Math.min(40, z)),
      key: peerKey(p),
    });
  }
  for (const [peer, av] of MP.avatars)
    if (!want.has(peer)) {
      scene.remove(av.p.g);
      av.tag.remove();
      MP.avatars.delete(peer);
    }
  for (const [peer, info] of want) {
    let av = MP.avatars.get(peer);
    if (!av) {
      const p = makePerson();
      const ring = new THREE.Mesh(
        AV_RING,
        new THREE.MeshBasicMaterial({
          color: '#f2c14e',
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.userData.ui = true; // marks the player, not part of the garden: never in a photo
      ring.position.y = 0.05;
      p.g.add(ring);
      p.g.position.set(info.x, 0, info.z);
      scene.add(p.g);
      const tag = document.createElement('div');
      tag.className = 'tag';
      $('#tags').appendChild(tag);
      av = { p, tag, phase: 0, shown: '' };
      MP.avatars.set(peer, av);
    }
    const off = (hashStr(peer) % 628) / 100;
    av.target = new THREE.Vector3(info.x + Math.cos(off) * 1.4, 0, info.z + Math.sin(off) * 1.4);
    av.key = info.key;
  }
}
export function updateAvatars(dt) {
  for (const [, av] of MP.avatars) {
    const g = av.p.g;
    if (!walkRoute(g, av, av.target, 3.2, dt)) {
      av.phase += dt * 10;
      const sw = Math.sin(av.phase) * 0.5;
      av.p.legs[0].rotation.x = sw;
      av.p.legs[1].rotation.x = -sw;
      av.p.arms[0].rotation.x = -sw * 0.7;
      av.p.arms[1].rotation.x = sw * 0.7;
    } else {
      av.p.legs.forEach(l => (l.rotation.x *= 0.8));
      av.p.arms.forEach(a => (a.rotation.x *= 0.8));
    }
    const nm = nameOf(av.key);
    if (av.shown !== nm) {
      av.shown = nm;
      av.tag.textContent = nm;
    }
    const v = g.position.clone().setY(2.35).project(camera),
      vis = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
    av.tag.style.display = vis ? '' : 'none';
    if (vis) {
      av.tag.style.left = ((v.x + 1) / 2) * innerWidth + 'px';
      av.tag.style.top = ((1 - v.y) / 2) * innerHeight + 'px';
    }
  }
}
export function sendWave() {
  if (MP.room) MP.room.emit('wave', { world: currentWorld() }).catch(() => {});
}
export function renderPlayers() {
  const box = $('#plist');
  if (!$('#players').classList.contains('open')) return;
  const seen = new Map();
  MP.peers
    .filter(p => !p.isMe && p.kind === 'viewer')
    .forEach(p => {
      const k = peerKey(p);
      if (!seen.has(k)) seen.set(k, p);
    });
  box.textContent = '';
  if (!seen.size) {
    const e = document.createElement('p');
    e.className = 'empty';
    e.textContent =
      'Nobody else is playing right now. Share this game with friends; when they’re in their gardens, they’ll appear here.';
    box.appendChild(e);
    return;
  }
  for (const [k, p] of seen) {
    const pr = p.presence || {},
      home = typeof pr.home === 'string' ? pr.home : null,
      w = typeof pr.world === 'string' ? pr.world : null;
    const row = document.createElement('div');
    row.className = 'prow';
    const info = document.createElement('div');
    const h = document.createElement('h3');
    h.textContent = nameOf(k);
    const st = document.createElement('p');
    st.textContent = !w
      ? 'Just arrived'
      : w === home
        ? 'Tending their own arboretum'
        : w === MP.myId
          ? 'Visiting your arboretum'
          : `Visiting ${nameOf(w)}’s arboretum`;
    info.append(h, st);
    row.appendChild(info);
    if (home && home !== MP.myId) {
      const b = document.createElement('button');
      b.className = 'btn primary';
      if (visiting && visiting.owner === home) {
        b.textContent = 'You’re here';
        b.disabled = true;
      } else {
        b.textContent = 'Visit';
        b.onclick = () => {
          closePlayers();
          enterVisit(home);
        };
      }
      row.appendChild(b);
    }
    if (w && w !== home && w !== currentWorld()) {
      const j = document.createElement('button');
      j.className = 'btn';
      j.textContent = 'Join them';
      j.onclick = () => {
        closePlayers();
        if (w === MP.myId) leaveVisit();
        else enterVisit(w);
      };
      row.appendChild(j);
    }
    box.appendChild(row);
  }
}
export function openPlayers() {
  $('#players').classList.add('open');
  $('#players').setAttribute('aria-hidden', 'false');
  renderPlayers();
}
export function closePlayers() {
  $('#players').classList.remove('open');
  $('#players').setAttribute('aria-hidden', 'true');
}

export function clearShown() {
  trees.splice(0).forEach(t => {
    treeRoot.remove(t.group);
    freeGeo(t.group);
  });
  decors.splice(0).forEach(d => {
    decorRoot.remove(d.group);
    freeGeo(d.group);
  });
  clearPeople();
  waterChanged();
}
/** Where we are, for the visit bar: someone's arboretum, or one shared by link. */
export function visitLabel() {
  return visiting.shared ? 'a shared arboretum' : `${nameOf(visiting.owner)}’s arboretum`;
}
export function setVisitUi() {
  $('#visitBar').style.display = visiting ? 'flex' : 'none';
  $('#shopBtn').style.display = visiting ? 'none' : '';
  $('#waveBtn').style.display = MP.room ? '' : 'none';
  if (visiting) $('#visitTxt').textContent = `Visiting ${visitLabel()}`;
}
/* Put our own garden aside (it comes back in leaveVisit) and save it first. */
function leaveHome(v) {
  if (visiting) leaveVisit(true);
  save();
  dropPick();
  closeShop();
  const stash = { trees: trees.splice(0), decors: decors.splice(0), season: state.season, start: Date.now() };
  stash.trees.forEach(t => treeRoot.remove(t.group));
  stash.decors.forEach(d => decorRoot.remove(d.group));
  clearPeople();
  visiting = { ...v, stash, ver: null, unsub: null, first: true };
  waterChanged();
  setVisitUi();
}
/* A garden from a share link (#g=...): a snapshot to walk around, with no owner online. */
export function visitShared(view) {
  leaveHome({ owner: null, shared: true });
  buildVisit({ ...view, ver: 1 });
}
let afterShared = () => {};
/** What to do on the way home from a shared garden (game.ts shows the intro to someone new). */
export function onLeaveShared(f) {
  afterShared = f;
}
export function enterVisit(owner) {
  if (!MP.db || !owner || owner === MP.myId) return;
  leaveHome({ owner });
  sendPresence(true);
  syncAvatars();
  toast('Walking over…');
  try {
    visiting.unsub = MP.db.doc('worlds/' + owner).onSnapshot(
      snap => {
        if (!visiting || visiting.owner !== owner) return;
        if (!snap.exists) {
          toast('That gardener hasn’t opened their arboretum to visitors yet.');
          leaveVisit(true);
          return;
        }
        buildVisit(snap.data() || {});
      },
      () => {
        toast('Couldn’t reach that arboretum.');
        leaveVisit(true);
      },
    );
  } catch (e) {
    leaveVisit(true);
  }
}
export function buildVisit(d) {
  if (d.ver === visiting.ver) return;
  visiting.ver = d.ver;
  clearShown();
  const num = (v, lo, hi, def) => {
    v = +v;
    return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : def;
  };
  (Array.isArray(d.trees) ? d.trees.slice(0, 600) : []).forEach(t => {
    if (t && typeof t.s === 'string' && SP[t.s])
      addTree(
        t.s,
        num(t.x, -34, 34, 0),
        num(t.z, -34, 34, 0),
        num(t.g, 0, 1, 0.1),
        Math.floor(num(t.seed, 1, 1e9, 1)),
      );
  });
  (Array.isArray(d.decor) ? d.decor.slice(0, 300) : []).forEach(o => {
    if (o && typeof o.d === 'string' && DC[o.d])
      addDecor(o.d, num(o.x, -34, 34, 0), num(o.z, -34, 34, 0), num(o.r, -100, 100, 0));
  });
  if (visiting.first) {
    visiting.first = false;
    state.season = num(d.season, 0, SEASON_LEN * 4 - 1, state.season);
    toast(
      visiting.shared
        ? 'Someone shared their arboretum with you. Have a look around!'
        : `Welcome to ${nameOf(visiting.owner)}’s arboretum.`,
      null,
      visiting.shared ? 5000 : undefined,
    );
  }
}
export function leaveVisit(silent?) {
  if (!visiting) return;
  const v = visiting;
  visiting = null;
  try {
    v.unsub && v.unsub();
  } catch (e) {}
  clearShown();
  v.stash.trees.forEach(t => {
    treeRoot.add(t.group);
    trees.push(t);
  });
  v.stash.decors.forEach(d => {
    decorRoot.add(d.group);
    decors.push(d);
  });
  state.season = (v.stash.season + (Date.now() - v.stash.start) / 1000) % (SEASON_LEN * 4);
  waterChanged();
  MP.wasHere = new Set();
  setVisitUi();
  sendPresence(true);
  syncAvatars();
  // a silent leave is on the way to another garden, not home
  if (v.shared && !silent) {
    history.replaceState(null, '', location.pathname + location.search);
    afterShared();
  }
  if (!silent) toast('Back home in your own arboretum.');
}
$('#playersBtn').onclick = openPlayers;
$('#closePlayers').onclick = closePlayers;
$('#homeBtn').onclick = () => leaveVisit();
$('#waveBtn').onclick = sendWave;
$('#waveChip').onclick = sendWave;

export function tickPresence(dt) {
  presClock += dt;
  if (presClock > 0.3) {
    presClock = 0;
    sendPresence();
  }
}
