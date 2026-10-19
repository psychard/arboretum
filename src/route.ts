/* ---------- finding a way round the water ----------
   The garden as a grid of small cells, with every cell in or beside water blocked, and A* across
   it. A route is the cells' path pulled straight wherever there is a clear line, so visitors walk
   in lines and curves round ponds, over a bridge's deck (the gap its stream leaves) and never into
   a pocket they can't leave. If the goal is in water, the route ends at the nearest dry cell. If
   water walls the goal off entirely, the route goes straight there, wet feet and all, rather than
   leaving anyone stuck. */

export interface Circle {
  x: number;
  z: number;
  r: number;
}
export interface Point {
  x: number;
  z: number;
}

/** How far from water a walker keeps; the gap a bridge's deck leaves is about 1.1 wide. */
export const MARGIN = 0.1;
const CELL = 0.35,
  X0 = -40,
  Z0 = -40,
  NX = Math.ceil(80 / CELL),
  NZ = Math.ceil(90 / CELL); // to z = 50, past the gate where visitors arrive

const SQRT2 = Math.SQRT2;
const NEIGHBOURS: [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, SQRT2],
  [1, -1, SQRT2],
  [-1, 1, SQRT2],
  [-1, -1, SQRT2],
];

export class WalkGrid {
  private readonly blocked = new Uint8Array(NX * NZ);
  constructor(private readonly water: Circle[]) {
    for (const c of water) {
      const r = c.r + MARGIN;
      const i0 = Math.max(0, Math.floor((c.x - r - X0) / CELL)),
        i1 = Math.min(NX - 1, Math.ceil((c.x + r - X0) / CELL));
      const j0 = Math.max(0, Math.floor((c.z - r - Z0) / CELL)),
        j1 = Math.min(NZ - 1, Math.ceil((c.z + r - Z0) / CELL));
      for (let j = j0; j <= j1; j++)
        for (let i = i0; i <= i1; i++) {
          const x = X0 + (i + 0.5) * CELL,
            z = Z0 + (j + 0.5) * CELL;
          if ((x - c.x) ** 2 + (z - c.z) ** 2 < r * r) this.blocked[j * NX + i] = 1;
        }
    }
  }

  /** Whether a point is in or beside water. */
  wet(x: number, z: number): boolean {
    for (const c of this.water) if ((x - c.x) ** 2 + (z - c.z) ** 2 < (c.r + MARGIN) ** 2) return true;
    return false;
  }

  /** Whether the straight line from a to b stays dry. */
  clear(a: Point, b: Point): boolean {
    const d = Math.hypot(b.x - a.x, b.z - a.z),
      n = Math.ceil(d / (CELL * 0.5));
    for (let k = 1; k < n; k++) {
      const t = k / n;
      if (this.wet(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
    }
    return true;
  }

  private cellOf(x: number, z: number): number {
    const i = Math.max(0, Math.min(NX - 1, Math.floor((x - X0) / CELL))),
      j = Math.max(0, Math.min(NZ - 1, Math.floor((z - Z0) / CELL)));
    return j * NX + i;
  }
  private centre(c: number): Point {
    return { x: X0 + ((c % NX) + 0.5) * CELL, z: Z0 + (Math.floor(c / NX) + 0.5) * CELL };
  }
  /** The nearest dry cell to cell c (c itself if it is dry). */
  private nearestDry(c: number): number {
    if (!this.blocked[c]) return c;
    const seen = new Uint8Array(NX * NZ),
      queue = [c];
    seen[c] = 1;
    for (let q = 0; q < queue.length; q++) {
      const cur = queue[q],
        i = cur % NX,
        j = Math.floor(cur / NX);
      for (const [di, dj] of NEIGHBOURS) {
        const ni = i + di,
          nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= NX || nj >= NZ) continue;
        const n = nj * NX + ni;
        if (seen[n]) continue;
        if (!this.blocked[n]) return n;
        seen[n] = 1;
        queue.push(n);
      }
    }
    return c;
  }

  /** Waypoints from a to b, ending at b, or at the dry spot nearest b if b is in water. */
  findPath(ax: number, az: number, bx: number, bz: number): Point[] {
    const a = { x: ax, z: az },
      b = { x: bx, z: bz };
    const goalWet = this.wet(bx, bz);
    if (!goalWet && this.clear(a, b)) return [b];
    const start = this.nearestDry(this.cellOf(ax, az)),
      goal = this.nearestDry(this.cellOf(bx, bz));
    const end = goalWet ? this.centre(goal) : b;
    const cells = this.astar(start, goal);
    if (!cells) return [b]; // walled off: better wet feet than stuck
    // pull the cell path straight: from each point, on to the furthest one in a clear line
    const pts: Point[] = [...cells.map(c => this.centre(c)), end];
    const out: Point[] = [];
    let from: Point = a,
      k = 0;
    if (start !== this.cellOf(ax, az)) {
      // starting in water: first step out to the dry cell
      from = pts[0];
      out.push(from);
      k = 1;
    }
    while (k < pts.length) {
      let far = k;
      for (let m = pts.length - 1; m > k; m--)
        if (this.clear(from, pts[m])) {
          far = m;
          break;
        }
      from = pts[far];
      out.push(from);
      k = far + 1;
    }
    return out;
  }

  private astar(start: number, goal: number): number[] | null {
    if (start === goal) return [start];
    const N = NX * NZ,
      g = new Float32Array(N).fill(Infinity),
      came = new Int32Array(N).fill(-1),
      closed = new Uint8Array(N);
    const gi = goal % NX,
      gj = Math.floor(goal / NX);
    const h = (c: number) => {
      const dx = Math.abs((c % NX) - gi),
        dz = Math.abs(Math.floor(c / NX) - gj);
      return dx + dz + (SQRT2 - 2) * Math.min(dx, dz);
    };
    const heap = new Heap();
    g[start] = 0;
    heap.push(start, h(start));
    while (heap.size) {
      const cur = heap.pop();
      if (cur === goal) {
        const path = [cur];
        for (let c = came[cur]; c !== -1; c = came[c]) path.push(c);
        return path.reverse();
      }
      if (closed[cur]) continue;
      closed[cur] = 1;
      const i = cur % NX,
        j = Math.floor(cur / NX);
      for (const [di, dj, cost] of NEIGHBOURS) {
        const ni = i + di,
          nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= NX || nj >= NZ) continue;
        const n = nj * NX + ni;
        if (this.blocked[n] || closed[n]) continue;
        // no cutting the corner of a pond on a diagonal
        if (di && dj && (this.blocked[j * NX + ni] || this.blocked[nj * NX + i])) continue;
        const ng = g[cur] + cost;
        if (ng < g[n]) {
          g[n] = ng;
          came[n] = cur;
          heap.push(n, ng + h(n));
        }
      }
    }
    return null;
  }
}

/** A binary min-heap of cells by priority. */
class Heap {
  private items: number[] = [];
  private pri: number[] = [];
  get size() {
    return this.items.length;
  }
  push(item: number, p: number) {
    const it = this.items,
      pr = this.pri;
    let k = it.length;
    it.push(item);
    pr.push(p);
    while (k > 0) {
      const up = (k - 1) >> 1;
      if (pr[up] <= p) break;
      it[k] = it[up];
      pr[k] = pr[up];
      k = up;
    }
    it[k] = item;
    pr[k] = p;
  }
  pop(): number {
    const it = this.items,
      pr = this.pri,
      top = it[0],
      lastI = it.pop()!,
      lastP = pr.pop()!;
    if (it.length) {
      let k = 0;
      const n = it.length;
      for (;;) {
        let c = 2 * k + 1;
        if (c >= n) break;
        if (c + 1 < n && pr[c + 1] < pr[c]) c++;
        if (pr[c] >= lastP) break;
        it[k] = it[c];
        pr[k] = pr[c];
        k = c;
      }
      it[k] = lastI;
      pr[k] = lastP;
    }
    return top;
  }
}
