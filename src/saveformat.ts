import { CAT_EVERY, DC, SEASON_LEN, SP, START_MONEY } from './data';

/* ---------- state ---------- */
/* SAVE_KEY never changes: it is where every garden already lives. A change to the save's shape
   bumps SAVE_V and adds a step to migrate(), which upgrades old saves in place, one version at a
   time. An id renamed in SPECIES or DECOR goes in RENAMED (old: new). Anything a save holds that
   this version can't build is kept in state.orphans and written back, never dropped, so a later
   version can bring it back. The save as it stood when the page opened is kept under BAK_KEY. */
export const SAVE_KEY = 'painted-arboretum-v1';
export const SAVE_V = 2,
  BAK_KEY = SAVE_KEY + '.bak';
export const RENAMED: Record<string, string> = {};

/** A planted tree: species id, position, growth (0 to 1) and the seed its shape grows from. */
export interface TreeEntry {
  s: string;
  x: number;
  z: number;
  g: number;
  seed: number;
}
/** A placed decoration: id, position and rotation in radians. */
export interface DecorEntry {
  d: string;
  x: number;
  z: number;
  r: number;
}
export interface Orphans {
  trees: TreeEntry[];
  decor: DecorEntry[];
}
export interface SaveState {
  v: number;
  money: number;
  trees: TreeEntry[];
  /** seconds played */
  play: number;
  /** seconds into the year; each season lasts SEASON_LEN */
  season: number;
  visitorsTotal: number;
  earned: number;
  cats: number;
  /** the play time at which the cat next wanders in */
  nextCat: number;
  started: boolean;
  decor: DecorEntry[];
  orphans: Orphans;
  /** ms since the epoch, for the seasons drifting on while away */
  savedAt: number;
}

export function fresh(): SaveState {
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

/** Upgrade a save of any earlier version to SAVE_V, in place. */
export function migrate(s: any): any {
  if (!(s.v >= 1)) s.v = 1;
  if (s.v < 2) {
    // v2: versioned, with orphans
    s.orphans = { trees: [], decor: [] };
    s.v = 2;
  }
  return s;
}

/* Sort a save's trees and decorations into ones this version can build and orphans; orphans whose
   id is known again (re-added, or renamed) come back. */
export function sortKnown(s: any): any {
  const o = s.orphans && typeof s.orphans === 'object' ? s.orphans : {};
  const list = (a: unknown): any[] => (Array.isArray(a) ? a : []).filter(e => e && typeof e === 'object');
  const rename = <T extends Record<string, any>>(e: T, k: string): T => {
    if (RENAMED[e[k]]) (e as Record<string, any>)[k] = RENAMED[e[k]];
    return e;
  };
  const trees: TreeEntry[] = [...list(s.trees), ...list(o.trees)].map(e => rename(e, 's'));
  const decor: DecorEntry[] = [...list(s.decor), ...list(o.decor)].map(e => rename(e, 'd'));
  s.trees = trees.filter(e => SP[e.s]);
  s.decor = decor.filter(e => DC[e.d]);
  s.orphans = { trees: trees.filter(e => !SP[e.s]), decor: decor.filter(e => !DC[e.d]) };
  if (s.orphans.trees.length || s.orphans.decor.length)
    console.warn('Arboretum: keeping items this version can’t show', s.orphans);
  return s;
}

/** Everything load() does to a parsed save: the state to play, or null if it isn't a save. */
export function readSave(parsed: unknown): SaveState | null {
  if (!parsed || typeof parsed !== 'object' || typeof (parsed as any).money !== 'number') return null;
  return Object.assign(fresh(), sortKnown(migrate(parsed)));
}
