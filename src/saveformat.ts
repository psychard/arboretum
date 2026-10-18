import { CAT_EVERY, DC, SEASON_LEN, SP, START_MONEY } from './data';

export const SAVE_KEY = 'painted-arboretum-v1';

/* ---------- state ---------- */
/* SAVE_KEY never changes: it is where every garden already lives. A change to the save's shape
   bumps SAVE_V and adds a step to migrate(), which upgrades old saves in place, one version at a
   time. An id renamed in SPECIES or DECOR goes in RENAMED (old: new). Anything a save holds that
   this version can't build is kept in state.orphans and written back, never dropped, so a later
   version can bring it back. The save as it stood when the page opened is kept under BAK_KEY. */
export const SAVE_V = 2,
  BAK_KEY = SAVE_KEY + '.bak';
export const RENAMED = {};

export function fresh() {
  return {
    v: SAVE_V,
    money: START_MONEY,
    trees: [],
    play: 0,
    season: SEASON_LEN * 0.5,
    visitorsTotal: 0,
    earned: 0,
    cats: 0,
    nextCat: CAT_EVERY,
    started: false,
    decor: [],
    orphans: { trees: [], decor: [] },
    savedAt: 0,
  };
}
export function migrate(s) {
  if (!(s.v >= 1)) s.v = 1;
  if (s.v < 2) {
    s.orphans = { trees: [], decor: [] };
    s.v = 2;
  } // v2: versioned, with orphans
  return s;
}
/* Sort a save's trees and decorations into ones this version can build and orphans; orphans whose
   id is known again (re-added, or renamed) come back. */
export function sortKnown(s) {
  const o = s.orphans && typeof s.orphans === 'object' ? s.orphans : {},
    ok = e => e && typeof e === 'object';
  const rename = (e, k) => {
    if (RENAMED[e[k]]) e[k] = RENAMED[e[k]];
    return e;
  };
  const trees = []
    .concat(Array.isArray(s.trees) ? s.trees : [], Array.isArray(o.trees) ? o.trees : [])
    .filter(ok)
    .map(e => rename(e, 's'));
  const decor = []
    .concat(Array.isArray(s.decor) ? s.decor : [], Array.isArray(o.decor) ? o.decor : [])
    .filter(ok)
    .map(e => rename(e, 'd'));
  s.trees = trees.filter(e => SP[e.s]);
  s.decor = decor.filter(e => DC[e.d]);
  s.orphans = { trees: trees.filter(e => !SP[e.s]), decor: decor.filter(e => !DC[e.d]) };
  if (s.orphans.trees.length || s.orphans.decor.length)
    console.warn('Arboretum: keeping items this version can’t show', s.orphans);
  return s;
}
