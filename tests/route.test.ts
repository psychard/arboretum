import { describe, expect, it } from 'vitest';
import { type Circle, type Point, MARGIN, WalkGrid } from '../src/route';

// The water of the garden that showed the bug: three little ponds round a bridge, plus the big
// pond. Bridge circles as water.ts places them: along its stream, with a gap for the deck.
const bridge = (x: number, z: number, r: number): Circle[] =>
  [
    [-1.4, 0.85],
    [1.4, 0.85],
    [-2.3, 0.8],
    [2.3, 0.8],
  ].map(([lx, rad]) => ({
    x: x + lx * Math.cos(r),
    z: z - lx * Math.sin(r),
    r: rad,
  }));
const water: Circle[] = [
  { x: -14, z: -8, r: 4.6 },
  { x: 14.4, z: -12.8, r: 1.7 },
  { x: 19.1, z: -17.8, r: 1.7 },
  { x: 18.5, z: -8.6, r: 1.7 },
  ...bridge(18.8, -13.3, 4.71),
];
const grid = new WalkGrid(water);
const wetAt = (p: Point) => water.some(c => Math.hypot(p.x - c.x, p.z - c.z) < c.r);
// every leg of a route, sampled finely, stays out of the water
const dryRoute = (from: Point, route: Point[]) => {
  let a = from;
  for (const b of route) {
    for (let t = 0; t <= 1; t += 0.02)
      if (wetAt({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t })) return false;
    a = b;
  }
  return true;
};

describe('routes round the water', () => {
  it('goes straight when nothing is in the way', () => {
    expect(grid.findPath(0, 30, 5, 20)).toEqual([{ x: 5, z: 20 }]);
  });

  it('goes round the big pond, not through it', () => {
    const route = grid.findPath(-22, -8, -6, -8);
    expect(route.length).toBeGreaterThan(1);
    expect(route.at(-1)).toEqual({ x: -6, z: -8 });
    expect(dryRoute({ x: -22, z: -8 }, route)).toBe(true);
  });

  it('gets out of the pocket between the ponds and the bridge (the stuck visitor)', () => {
    const from = { x: 17.6, z: -16.8 },
      route = grid.findPath(from.x, from.z, 22, -16.5);
    expect(route.at(-1)).toEqual({ x: 22, z: -16.5 });
    expect(dryRoute(from, route)).toBe(true);
  });

  it('crosses the stream over the bridge deck', () => {
    // either side of the stream, level with the deck
    const from = { x: 16.6, z: -13.3 },
      route = grid.findPath(from.x, from.z, 21.2, -13.3);
    expect(dryRoute(from, route)).toBe(true);
    const length = route.reduce(
      (s, p, k) => s + Math.hypot(p.x - (k ? route[k - 1] : from).x, p.z - (k ? route[k - 1] : from).z),
      0,
    );
    expect(length).toBeLessThan(6); // over the deck, not the long way round the ponds
  });

  it('stops at the water’s edge when the goal is in it', () => {
    const route = grid.findPath(10, -4, 14.4, -12.8); // the middle of a little pond
    const end = route.at(-1)!;
    expect(wetAt(end)).toBe(false);
    expect(Math.hypot(end.x - 14.4, end.z + 12.8)).toBeLessThan(1.7 + MARGIN + 0.6);
  });

  it('steps out first when it starts in the water', () => {
    const route = grid.findPath(14.4, -12.1, 10, -4);
    expect(wetAt(route[0])).toBe(false);
    expect(dryRoute(route[0], route.slice(1))).toBe(true);
  });

  it('walks straight on, rather than freezing, when water walls the goal off', () => {
    const ring: Circle[] = Array.from({ length: 24 }, (_, k) => ({
      x: 6 * Math.cos((k * Math.PI) / 12),
      z: 6 * Math.sin((k * Math.PI) / 12),
      r: 1.2,
    }));
    expect(new WalkGrid(ring).findPath(20, 0, 0, 0)).toEqual([{ x: 0, z: 0 }]);
  });

  it('is quick enough to plan for every visitor', () => {
    const t0 = performance.now();
    for (let k = 0; k < 20; k++) grid.findPath(-30, 30, 25, -25);
    expect((performance.now() - t0) / 20).toBeLessThan(25);
  });
});
