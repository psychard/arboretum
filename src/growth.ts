import { RARITY, SEASON_LEN, type RarityName } from './data';

/* ---------- how trees grow ----------
   Growth follows the garden's calendar, not the clock: a tree puts on most of its growth in the
   spring flush, keeps going through summer, slows in autumn and rests through winter. Young trees
   grow fastest, slowing as they near full size. Because it runs on the calendar, the time the
   seasons drift on while you're away grows the trees just as play does. */

export const YEAR = SEASON_LEN * 4;
/** how fast trees grow at the middle of spring, summer, autumn and winter; they average 1 */
export const SEASON_GROWTH = [1.8, 1.5, 0.7, 0];
/* A tree's vigour is FULL - g: three times as fast as a sapling as when nearly grown. Over a
   year of average seasons, ln(FULL / (FULL - 1)) of vigour-weighted growth takes a tree from
   nothing to full size, so dividing by it makes RARITY's years come out right. */
const FULL = 1.5,
  LN = Math.log(FULL / (FULL - 1));

/** The growth rate at a point in the year (seconds in, as state.season), between season middles. */
export function seasonGrowth(season: number): number {
  const p = season / SEASON_LEN - 0.5,
    fl = Math.floor(p),
    a = ((fl % 4) + 4) % 4,
    b = (a + 1) % 4;
  return SEASON_GROWTH[a] + (SEASON_GROWTH[b] - SEASON_GROWTH[a]) * (p - fl);
}

/** Growth g after dt seconds of the year from season, for a step short enough that the season's
    rate holds (a frame, or a minute). Vigour falls as g grows, so this is exact within the step. */
export function growStep(g: number, rarity: RarityName, season: number, dt: number): number {
  if (g >= 1) return 1;
  const k = (seasonGrowth(season + dt / 2) * LN) / (RARITY[rarity].years * YEAR);
  return Math.min(1, FULL - (FULL - g) * Math.exp(-k * dt));
}

/** Growth g after span seconds of the year from season, a minute of the calendar at a time. */
export function growOver(g: number, rarity: RarityName, season: number, span: number): number {
  span = Math.min(span, YEAR * 4);
  for (let s = 0; s < span && g < 1; s += 60) g = growStep(g, rarity, season + s, Math.min(60, span - s));
  return g;
}
