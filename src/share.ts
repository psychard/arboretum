import { DC, SEASON_LEN, SP } from './data';
import { type DecorEntry, type SaveState, type TreeEntry, SAVE_V, readSave } from './saveformat';

/* Two ways a garden leaves this browser:
   - a share link (#g=...) carries what a visitor sees: the trees, the decorations and the season,
     packed small and compressed, with no money or stats. Opening it is a read-only visit.
   - a backup file carries the whole save as plain JSON, to restore on another device or browser
     (or into the Home Screen app, which on iOS has its own storage, apart from Safari's). */

/** What a visitor needs to see a garden. */
export interface GardenView {
  trees: TreeEntry[];
  decor: DecorEntry[];
  season: number;
}

const MAX_TREES = 600,
  MAX_DECOR = 300;
const clamp = (v: unknown, lo: number, hi: number, def: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : def;
};

/* Packed: positions in tenths, growth in hundredths, rotation in hundredths of a radian. Ids stay
   as strings: an index into SPECIES would change meaning whenever a species is added. */
type PackedTree = [string, number, number, number, number];
type PackedDecor = [string, number, number, number];
interface Packed {
  v: 1;
  t: PackedTree[];
  d: PackedDecor[];
  s: number;
}

export function packGarden(g: GardenView): Packed {
  return {
    v: 1,
    t: g.trees.map(t => [t.s, Math.round(t.x * 10), Math.round(t.z * 10), Math.round(t.g * 100), t.seed]),
    d: g.decor.map(d => [d.d, Math.round(d.x * 10), Math.round(d.z * 10), Math.round(d.r * 100)]),
    s: Math.round(g.season),
  };
}

/** The garden in a packed link, keeping only entries this version can show; null if it isn't one. */
export function unpackGarden(p: unknown): GardenView | null {
  if (!p || typeof p !== 'object' || (p as Packed).v !== 1) return null;
  const { t, d, s } = p as Packed;
  const rows = (a: unknown) => (Array.isArray(a) ? a.filter(Array.isArray) : []);
  return {
    trees: rows(t)
      .slice(0, MAX_TREES)
      .filter(r => typeof r[0] === 'string' && SP[r[0]])
      .map(r => ({
        s: r[0],
        x: clamp(r[1], -340, 340, 0) / 10,
        z: clamp(r[2], -340, 340, 0) / 10,
        g: clamp(r[3], 0, 100, 10) / 100,
        seed: Math.floor(clamp(r[4], 1, 1e9, 1)),
      })),
    decor: rows(d)
      .slice(0, MAX_DECOR)
      .filter(r => typeof r[0] === 'string' && DC[r[0]])
      .map(r => ({
        d: r[0],
        x: clamp(r[1], -340, 340, 0) / 10,
        z: clamp(r[2], -340, 340, 0) / 10,
        r: clamp(r[3], -10000, 10000, 0) / 100,
      })),
    season: clamp(s, 0, SEASON_LEN * 4 - 1, SEASON_LEN * 0.5),
  };
}

/* ---------- link codes: JSON, deflated where the browser can, then base64url ---------- */
const b64url = (bytes: Uint8Array) => {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64url = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
};
const through = async (bytes: Uint8Array, stream: CompressionStream | DecompressionStream) =>
  new Uint8Array(
    await new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream)).arrayBuffer(),
  );

/** 'z' + deflated, or 'j' + plain where CompressionStream is missing (Safari before 16.4). */
export async function toCode(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  if (typeof CompressionStream === 'function')
    return 'z' + b64url(await through(bytes, new CompressionStream('deflate-raw')));
  return 'j' + b64url(bytes);
}

/** The value in a code, or null if it can't be read. */
export async function fromCode(code: string): Promise<unknown> {
  try {
    const kind = code[0],
      bytes = unb64url(code.slice(1));
    const json =
      kind === 'z'
        ? await through(bytes, new DecompressionStream('deflate-raw'))
        : kind === 'j'
          ? bytes
          : null;
    return json ? JSON.parse(new TextDecoder().decode(json)) : null;
  } catch {
    return null;
  }
}

export const shareCode = (g: GardenView) => toCode(packGarden(g));
export const gardenFromCode = async (code: string) => unpackGarden(await fromCode(code));

/* ---------- backup files ---------- */
export function backupJson(s: SaveState): string {
  return JSON.stringify({ arboretum: 'backup', v: SAVE_V, at: new Date().toISOString(), save: s }, null, 1);
}
/** The save in a backup file (or a bare save), ready to play; null if it isn't one. */
export function readBackup(text: string): SaveState | null {
  try {
    const p = JSON.parse(text);
    return readSave(p && typeof p === 'object' && p.arboretum === 'backup' ? p.save : p);
  } catch {
    return null;
  }
}
