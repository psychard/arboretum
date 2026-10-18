import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { SEASON_LEN } from '../src/data';
import { fresh } from '../src/saveformat';
import { backupJson, fromCode, gardenFromCode, readBackup, shareCode, toCode } from '../src/share';

const v1 = JSON.parse(readFileSync(new URL('saves/v1.json', import.meta.url), 'utf8'));
const view = { trees: v1.trees, decor: v1.decor, season: v1.season };

describe('share links', () => {
  it('round-trips a garden, to a tenth of a unit', async () => {
    const back = (await gardenFromCode(await shareCode(view)))!;
    expect(back.trees.map(t => t.s)).toEqual(view.trees.map((t: any) => t.s));
    back.trees.forEach((t, i) => {
      expect(t.x).toBeCloseTo(view.trees[i].x, 1);
      expect(t.z).toBeCloseTo(view.trees[i].z, 1);
      expect(t.g).toBeCloseTo(view.trees[i].g, 2);
      expect(t.seed).toBe(view.trees[i].seed);
    });
    expect(back.decor.map(d => d.d)).toEqual(['bench', 'gazebo']);
    expect(back.season).toBe(Math.round(view.season));
  });

  it('keeps a big garden short enough for a link', async () => {
    const trees = Array.from({ length: 150 }, (_, i) => ({
      s: 'oak',
      x: (i % 30) - 15,
      z: i / 5 - 15,
      g: 1,
      seed: 1e8 + i * 7919,
    }));
    const code = await shareCode({ trees, decor: [], season: 0 });
    expect(code[0]).toBe('z');
    expect(code.length).toBeLessThan(3000);
  });

  it('works without CompressionStream, as in older Safari', async () => {
    vi.stubGlobal('CompressionStream', undefined);
    try {
      const code = await shareCode(view);
      expect(code[0]).toBe('j');
      expect((await gardenFromCode(code))!.trees).toHaveLength(3);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('drops what this version can’t show and clamps the rest into the garden', async () => {
    const code = await toCode({
      v: 1,
      s: 1e12,
      t: [['oak', 99999, -99999, 500, -3], ['zelkova', 0, 0, 50, 1], 'junk'],
      d: [['statue', 0, 0, 0]],
    });
    const g = (await gardenFromCode(code))!;
    expect(g.trees).toEqual([{ s: 'oak', x: 34, z: -34, g: 1, seed: 1 }]);
    expect(g.decor).toEqual([]);
    expect(g.season).toBe(SEASON_LEN * 4 - 1);
  });

  it('turns a broken or foreign code into null, not an exception', async () => {
    for (const code of ['', 'z', 'zAAAA', 'q123', 'j' + btoa('{"v":2}'), 'j%%%'])
      expect(await gardenFromCode(code)).toBeNull();
    expect(await fromCode('znot-deflate')).toBeNull();
  });
});

describe('backups', () => {
  it('restores everything a backup holds', () => {
    const s = { ...fresh(), ...v1, v: 2, started: true };
    const back = readBackup(backupJson(s))!;
    expect(back.money).toBe(v1.money);
    expect(back.trees).toEqual(v1.trees);
    expect(back.earned).toBe(v1.earned);
  });
  it('accepts a bare save too, and refuses anything else', () => {
    expect(readBackup(JSON.stringify(v1))!.v).toBe(2);
    for (const junk of ['', 'nope', '[]', '{"arboretum":"backup"}', '{"money":"lots"}'])
      expect(readBackup(junk)).toBeNull();
  });
});
