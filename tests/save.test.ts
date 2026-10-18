import { describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { AVAIL, DC, DECOR, SP, SPECIES } from '../src/data';
import { RENAMED, SAVE_V, fresh, migrate, sortKnown } from '../src/saveformat';

// load() runs exactly this: migrate, sort into known and orphans, then lay it over fresh().
const loadFrom = (s: any) => Object.assign(fresh(), sortKnown(migrate(structuredClone(s))));
const fixture = (name: string) => JSON.parse(readFileSync(new URL(`saves/${name}`, import.meta.url), 'utf8'));

// One fixture per save version that has ever shipped. When SAVE_V goes up, keep
// the old fixtures and add one saved by the new version.
describe('every saved version still loads', () => {
  for (const name of readdirSync(new URL('saves/', import.meta.url)).filter(f => f.endsWith('.json'))) {
    it(name, () => {
      const old = fixture(name), s = loadFrom(old);
      expect(s.v).toBe(SAVE_V);
      expect(s.money).toBe(old.money);
      expect(s.season).toBe(old.season);
      expect(s.cats).toBe(old.cats);
      expect(s.started).toBe(old.started);
      // nothing is lost: every tree and decoration is either shown or kept as an orphan
      expect(s.trees.length + s.orphans.trees.length).toBe(old.trees.length + (old.orphans?.trees?.length ?? 0));
      expect(s.decor.length + s.orphans.decor.length).toBe(old.decor.length + (old.orphans?.decor?.length ?? 0));
      expect(s.trees).toEqual(old.trees.filter((t: any) => SP[t.s]));
    });
  }
});

describe('unknown ids', () => {
  const quiet = () => vi.spyOn(console, 'warn').mockImplementation(() => {});

  it('keeps a tree or decoration this version cannot build, rather than dropping it', () => {
    quiet();
    const s = loadFrom({ ...fixture('v1.json'),
      trees: [{ s: 'oak', x: 1, z: 1, g: 0.5, seed: 1 }, { s: 'zelkova', x: 2, z: 2, g: 0.7, seed: 2 }],
      decor: [{ d: 'bench', x: 3, z: 3, r: 0 }, { d: 'statue', x: 4, z: 4, r: 0 }] });
    expect(s.trees.map((t: any) => t.s)).toEqual(['oak']);
    expect(s.decor.map((d: any) => d.d)).toEqual(['bench']);
    expect(s.orphans.trees).toEqual([{ s: 'zelkova', x: 2, z: 2, g: 0.7, seed: 2 }]);
    expect(s.orphans.decor).toEqual([{ d: 'statue', x: 4, z: 4, r: 0 }]);
  });

  it('brings an orphan back once its id is known again', () => {
    const s = loadFrom({ ...fixture('v1.json'), v: 2, trees: [],
      orphans: { trees: [{ s: 'birch', x: 5, z: 5, g: 1, seed: 3 }], decor: [] } });
    expect(s.trees.map((t: any) => t.s)).toEqual(['birch']);
    expect(s.orphans.trees).toEqual([]);
  });

  it('follows RENAMED to a tree’s new id', () => {
    (RENAMED as any).oldoak = 'oak';
    try {
      const s = loadFrom({ ...fixture('v1.json'), trees: [{ s: 'oldoak', x: 1, z: 1, g: 1, seed: 1 }] });
      expect(s.trees).toEqual([{ s: 'oak', x: 1, z: 1, g: 1, seed: 1 }]);
    } finally { delete (RENAMED as any).oldoak; }
  });

  it('ignores junk entries instead of throwing', () => {
    const s = loadFrom({ ...fixture('v1.json'), trees: [null, 7, 'oak'], decor: 'nope', orphans: 5 });
    expect(s.trees).toEqual([]);
    expect(s.decor).toEqual([]);
  });
});

describe('the catalogue', () => {
  it('lists the seasons for every species, and only real ones', () => {
    for (const id of Object.keys(AVAIL)) expect(SP[id], id).toBeDefined();
    for (const sp of SPECIES) expect(AVAIL[sp.id], sp.id).toBeDefined();
  });
  it('has unique ids', () => {
    expect(new Set(SPECIES.map(s => s.id)).size).toBe(SPECIES.length);
    expect(new Set(DECOR.map(d => d.id)).size).toBe(DECOR.length);
  });
  it('renames only to ids that exist', () => {
    for (const [from, to] of Object.entries(RENAMED)) expect(SP[to as string] || DC[to as string], `${from} → ${to}`).toBeDefined();
  });
});
