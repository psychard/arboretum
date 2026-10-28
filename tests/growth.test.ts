import { describe, expect, it } from 'vitest';
import { SEASON_LEN } from '../src/data';
import { SEASON_GROWTH, YEAR, growOver, growStep, seasonGrowth } from '../src/growth';

const mid = (si: number) => (si + 0.5) * SEASON_LEN;

describe('tree growth', () => {
  it('averages 1 over the year, with each season’s rate at its middle', () => {
    expect(SEASON_GROWTH.reduce((a, b) => a + b) / 4).toBeCloseTo(1, 6);
    SEASON_GROWTH.forEach((r, si) => expect(seasonGrowth(mid(si))).toBeCloseTo(r, 6));
    expect(seasonGrowth(mid(3) + YEAR * 2)).toBeCloseTo(0, 6);
  });

  it('takes a tree from nothing to full size in its rarity’s years', () => {
    for (const start of [0, mid(1), mid(3)]) {
      expect(growOver(0, 'Rare', start, YEAR * 0.98)).toBeLessThan(1);
      expect(growOver(0, 'Rare', start, YEAR)).toBeCloseTo(1, 2);
      expect(growOver(0, 'Common', start, YEAR / 2)).toBeGreaterThan(0.6);
    }
  });

  it('grows most in spring and rests in midwinter', () => {
    const hour = 3600;
    const spring = growOver(0.2, 'Common', mid(0) - hour / 2, hour),
      autumn = growOver(0.2, 'Common', mid(2) - hour / 2, hour),
      winter = growStep(0.2, 'Common', mid(3), 1);
    expect(spring).toBeGreaterThan(autumn);
    expect(autumn).toBeGreaterThan(0.2);
    expect(winter).toBeCloseTo(0.2, 6);
  });

  it('slows as a tree nears full size, and stops there', () => {
    const young = growStep(0.1, 'Exotic', mid(0), 600) - 0.1,
      old = growStep(0.8, 'Exotic', mid(0), 600) - 0.8;
    expect(young).toBeGreaterThan(old * 2);
    expect(growOver(0.99, 'Common', mid(0), YEAR)).toBe(1);
    expect(growOver(0.3, 'Common', 0, 0)).toBe(0.3);
  });
});
