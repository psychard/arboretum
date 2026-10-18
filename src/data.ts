import type { Color, MeshPhongMaterial } from 'three';

export type RarityName = 'Common' | 'Uncommon' | 'Rare' | 'Exotic' | 'Legendary';
export interface Stage {
  id: string;
  name: string;
  mult: number;
  g: number;
}
/* A tree for sale. The fields after desc are filled in at load: seasons from AVAIL below, and the
   materials and seasonal colours by trees.ts. */
export interface Species {
  id: string;
  name: string;
  rarity: RarityName;
  price: number;
  shape: string;
  wide?: boolean;
  trunk: string;
  col: string[];
  fol: number[];
  desc: string;
  kind?: undefined;
  seasons?: number[];
  trunkMat?: MeshPhongMaterial;
  folMat?: MeshPhongMaterial;
  colors?: Color[];
  folScale?: number;
}
/* x, z and facing of one seat, in the decoration's own frame */
export type Seat = [number, number, number];
export interface Decor {
  id: string;
  name: string;
  price: number;
  rad: number;
  w: number;
  desc: string;
  kind?: 'decor';
  seasons?: number[];
  act?: 'sit' | 'look' | 'bridge';
  seatY?: number;
  seats?: Seat[];
}
export type Buyable = Species | Decor;

export const SEASON_LEN = 3600,
  CAT_EVERY = 300,
  TICKET = 25,
  START_MONEY = 100;
export const SEASONS: string[] = ['Spring', 'Summer', 'Autumn', 'Winter'];
export const SEASON_ICON: string[] = ['🌸', '☀️', '🍂', '❄️'];
export const RARITY: Record<RarityName, { w: number; c: string; grow: number }> = {
  Common: { w: 1, c: '#5f8a3f', grow: 1200 },
  Uncommon: { w: 1.7, c: '#2f7480', grow: 1800 },
  Rare: { w: 2.8, c: '#80479a', grow: 2400 },
  Exotic: { w: 4.2, c: '#b0532e', grow: 3000 },
  Legendary: { w: 7, c: '#a8821e', grow: 4200 },
};
export const STAGES: Stage[] = [
  { id: 'sapling', name: 'Sapling', mult: 1, g: 0.05 },
  { id: 'young', name: 'Young', mult: 2.5, g: 0.4 },
  { id: 'mature', name: 'Mature', mult: 6, g: 0.85 },
];
export const SPECIES: Species[] = [
  {
    id: 'oak',
    name: 'English Oak',
    rarity: 'Common',
    price: 20,
    shape: 'round',
    trunk: '#5d4632',
    col: ['#8cb55a', '#4f7d32', '#b8742e', '#7a5a3a'],
    fol: [0.85, 1, 0.9, 0],
    desc: 'Broad and sturdy; a dependable first tree.',
  },
  {
    id: 'birch',
    name: 'Silver Birch',
    rarity: 'Common',
    price: 25,
    shape: 'narrow',
    trunk: '#e6e0d2',
    col: ['#a8cc6a', '#6f9a3e', '#e2b93b', '#8a6a3a'],
    fol: [0.8, 1, 0.85, 0],
    desc: 'Pale bark and slender crowns that turn butter yellow.',
  },
  {
    id: 'maple',
    name: 'Sugar Maple',
    rarity: 'Common',
    price: 30,
    shape: 'round',
    trunk: '#5a4232',
    col: ['#9cc062', '#4d7a34', '#d2482a', '#7a4a2a'],
    fol: [0.85, 1, 0.95, 0],
    desc: 'Unremarkable in summer; blazing red in autumn.',
  },
  {
    id: 'apple',
    name: 'Apple Tree',
    rarity: 'Common',
    price: 35,
    shape: 'round',
    trunk: '#5e4a36',
    col: ['#f2dde0', '#4f7d32', '#b0782e', '#7a5a3a'],
    fol: [0.9, 1, 0.85, 0],
    desc: 'White-pink blossom in spring on a classic orchard shape.',
  },
  {
    id: 'pine',
    name: 'Scots Pine',
    rarity: 'Uncommon',
    price: 45,
    shape: 'cone',
    trunk: '#4d3a2a',
    col: ['#456f3c', '#365e34', '#3d5c36', '#66806a'],
    fol: [1, 1, 1, 1],
    desc: 'Evergreen; it keeps the garden green through winter.',
  },
  {
    id: 'willow',
    name: 'Weeping Willow',
    rarity: 'Uncommon',
    price: 70,
    shape: 'willow',
    trunk: '#6a5638',
    col: ['#b8d46a', '#7ea84a', '#c9b44a', '#8a7a4a'],
    fol: [0.8, 1, 0.8, 0],
    desc: 'Long trailing strands that sway like brushstrokes.',
  },
  {
    id: 'paperbark',
    name: 'Paperbark Cherry',
    rarity: 'Uncommon',
    price: 80,
    shape: 'round',
    trunk: '#7a2e22',
    col: ['#f4eee8', '#4f7a34', '#d07a2a', '#7a4a3a'],
    fol: [0.95, 1, 0.85, 0],
    desc: 'Glossy copper bark that peels in ribbons; white flowers in spring.',
  },
  {
    id: 'cherry',
    name: 'Yoshino Cherry',
    rarity: 'Rare',
    price: 110,
    shape: 'round',
    wide: true,
    trunk: '#5a3a32',
    col: ['#f4b6c8', '#5e8a3c', '#c4562e', '#7a4a3a'],
    fol: [1, 0.95, 0.85, 0],
    desc: 'A cloud of pink blossom each spring.',
  },
  {
    id: 'ginkgo',
    name: 'Ginkgo',
    rarity: 'Rare',
    price: 140,
    shape: 'ginkgo',
    trunk: '#6a5a44',
    col: ['#a6c95a', '#6d9a3a', '#f0c42a', '#9a8a3a'],
    fol: [0.85, 1, 1, 0],
    desc: 'A living fossil with fan-shaped leaves of pure gold.',
  },
  {
    id: 'trumpet',
    name: 'Yellow Trumpet Tree',
    rarity: 'Rare',
    price: 160,
    shape: 'round',
    wide: true,
    trunk: '#6a5a46',
    col: ['#f2c72a', '#5a8a3a', '#8a9a3a', '#6a6a3a'],
    fol: [1, 0.95, 0.85, 0],
    desc: 'Covered in golden trumpet-shaped flowers each spring.',
  },
  {
    id: 'jmaple',
    name: 'Japanese Maple',
    rarity: 'Exotic',
    price: 220,
    shape: 'umbrella',
    trunk: '#6e4e3c',
    col: ['#b0362e', '#7e2c2c', '#de2c1c', '#6a2a22'],
    fol: [0.9, 1, 1, 0],
    desc: 'Low, layered and crimson nearly all year.',
  },
  {
    id: 'poinciana',
    name: 'Royal Poinciana',
    rarity: 'Exotic',
    price: 260,
    shape: 'spread',
    trunk: '#7a6a58',
    col: ['#6a9a3a', '#d8401c', '#6a8a34', '#7a6a3a'],
    fol: [0.9, 1, 0.9, 0],
    desc: 'A flat, spreading crown that blazes scarlet in summer.',
  },
  {
    id: 'jacaranda',
    name: 'Jacaranda',
    rarity: 'Exotic',
    price: 300,
    shape: 'round',
    wide: true,
    trunk: '#5a4636',
    col: ['#9a7ad6', '#5f8a3c', '#b39a3a', '#7a6a4a'],
    fol: [1, 0.95, 0.8, 0],
    desc: 'Spring brings a haze of violet flowers.',
  },
  {
    id: 'dragon',
    name: 'Dragon Blood Tree',
    rarity: 'Exotic',
    price: 380,
    shape: 'dragon',
    trunk: '#8a7a62',
    col: ['#4f7a3a', '#3f6c34', '#4a7034', '#5c7a52'],
    fol: [1, 1, 1, 1],
    desc: 'An upturned umbrella from the island of Socotra; evergreen.',
  },
  {
    id: 'baobab',
    name: 'Baobab',
    rarity: 'Exotic',
    price: 450,
    shape: 'baobab',
    trunk: '#9a8a78',
    col: ['#8ab05a', '#5f8a3a', '#9a8a4a', '#7a6a4a'],
    fol: [0.65, 0.85, 0.5, 0],
    desc: 'A colossal bottle-shaped trunk with branches like roots.',
  },
  {
    id: 'redoak',
    name: 'Northern Red Oak',
    rarity: 'Common',
    price: 22,
    shape: 'round',
    trunk: '#74583e',
    col: ['#9ab85a', '#3f6a2e', '#b8281e', '#6a3a2a'],
    fol: [0.85, 1, 0.95, 0],
    desc: 'Deep green all summer, then a rich crimson.',
  },
  {
    id: 'rowan',
    name: 'Rowan',
    rarity: 'Common',
    price: 26,
    shape: 'round',
    trunk: '#6a5a4a',
    col: ['#9ac05a', '#5a8a3a', '#e05a1e', '#7a3a2a'],
    fol: [0.8, 1, 0.9, 0],
    desc: 'A small tree hung with orange berries in autumn.',
  },
  {
    id: 'linden',
    name: 'Linden',
    rarity: 'Common',
    price: 28,
    shape: 'round',
    trunk: '#5a4a3a',
    col: ['#a8c86a', '#5a8a3a', '#d2b84a', '#7a6a3a'],
    fol: [0.85, 1, 0.85, 0],
    desc: 'Heart-shaped leaves and honey-scented summer flowers.',
  },
  {
    id: 'pear',
    name: 'Pear Tree',
    rarity: 'Common',
    price: 32,
    shape: 'round',
    trunk: '#6e5238',
    col: ['#f6f4ec', '#4a7a34', '#b8462a', '#6a3a2a'],
    fol: [0.95, 1, 0.9, 0],
    desc: 'Snow-white spring blossom and glossy leaves.',
  },
  {
    id: 'poplar',
    name: 'Lombardy Poplar',
    rarity: 'Uncommon',
    price: 40,
    shape: 'column',
    trunk: '#7a7060',
    col: ['#a8c85a', '#5f8a3a', '#e0c43a', '#8a7a4a'],
    fol: [0.85, 1, 0.9, 0],
    desc: 'A tall green exclamation mark on the skyline.',
  },
  {
    id: 'cypress',
    name: 'Italian Cypress',
    rarity: 'Uncommon',
    price: 55,
    shape: 'column',
    trunk: '#5a4a3a',
    col: ['#3a5a32', '#2f522e', '#34542f', '#4a6448'],
    fol: [1, 1, 1, 1],
    desc: 'Dark, slender and evergreen; pure Tuscany.',
  },
  {
    id: 'spruce',
    name: 'Blue Spruce',
    rarity: 'Uncommon',
    price: 60,
    shape: 'cone',
    trunk: '#6e5238',
    col: ['#6f9aa0', '#5f8c94', '#628c90', '#8aa8b0'],
    fol: [1, 1, 1, 1],
    desc: 'Silvery blue needles that glow against the snow.',
  },
  {
    id: 'redbud',
    name: 'Eastern Redbud',
    rarity: 'Uncommon',
    price: 65,
    shape: 'round',
    trunk: '#6e4a3a',
    col: ['#c8508a', '#5a8a3a', '#d0b03a', '#6a4a3a'],
    fol: [1, 1, 0.85, 0],
    desc: 'Bare branches burst into magenta before the leaves.',
  },
  {
    id: 'dogwood',
    name: 'Flowering Dogwood',
    rarity: 'Uncommon',
    price: 75,
    shape: 'umbrella',
    trunk: '#5a4636',
    col: ['#f4f0e4', '#4f7a34', '#b8302a', '#6a3a2a'],
    fol: [0.95, 1, 0.95, 0],
    desc: 'Layered branches of white spring bracts.',
  },
  {
    id: 'magnolia',
    name: 'Saucer Magnolia',
    rarity: 'Uncommon',
    price: 90,
    shape: 'round',
    wide: true,
    trunk: '#6a6058',
    col: ['#f2d2dc', '#3f6a34', '#8a7a3a', '#6a5a4a'],
    fol: [1, 1, 0.8, 0],
    desc: 'Great goblet flowers of pink and ivory.',
  },
  {
    id: 'beech',
    name: 'Copper Beech',
    rarity: 'Rare',
    price: 130,
    shape: 'round',
    wide: true,
    trunk: '#8a8a84',
    col: ['#9a5a5a', '#5c2a36', '#a0502a', '#7a4a34'],
    fol: [0.85, 1, 0.95, 0],
    desc: 'Leaves the color of polished copper and wine.',
  },
  {
    id: 'tulip',
    name: 'Tulip Tree',
    rarity: 'Rare',
    price: 150,
    shape: 'ginkgo',
    trunk: '#6a5a48',
    col: ['#9ac85a', '#5a8a3a', '#f0c83a', '#8a7a3a'],
    fol: [0.85, 1, 1, 0],
    desc: 'Tall and straight, with tulip-shaped flowers.',
  },
  {
    id: 'palm',
    name: 'Coconut Palm',
    rarity: 'Rare',
    price: 170,
    shape: 'palm',
    trunk: '#8a7a5a',
    col: ['#6a9a3a', '#5a8a34', '#6a8a3a', '#6a8a4a'],
    fol: [1, 1, 1, 1],
    desc: 'Arching fronds on a curving trunk; sold in summer only.',
  },
  {
    id: 'monkey',
    name: 'Monkey Puzzle',
    rarity: 'Rare',
    price: 190,
    shape: 'whorl',
    trunk: '#6a5a4a',
    col: ['#3f6234', '#355a30', '#3a5a32', '#4a6446'],
    fol: [1, 1, 1, 1],
    desc: 'Spiky, prehistoric and slightly ridiculous.',
  },
  {
    id: 'silkfloss',
    name: 'Silk Floss Tree',
    rarity: 'Exotic',
    price: 280,
    shape: 'round',
    wide: true,
    trunk: '#6a8a5a',
    col: ['#5f8a3c', '#4f7d34', '#e87aa8', '#7a6a4a'],
    fol: [0.9, 1, 1, 0],
    desc: 'A green, spiny trunk that flowers bright pink in autumn.',
  },
  {
    id: 'eucalyptus',
    name: 'Rainbow Eucalyptus',
    rarity: 'Exotic',
    price: 320,
    shape: 'narrow',
    trunk: '#9a7a6a',
    col: ['#7aa07a', '#6a9472', '#7a9a74', '#7a9a80'],
    fol: [1, 1, 1, 1],
    desc: 'Bark that peels into streaks of green, orange and violet.',
  },
  {
    id: 'wisteria',
    name: 'Wisteria Tree',
    rarity: 'Exotic',
    price: 340,
    shape: 'willow',
    trunk: '#765a42',
    col: ['#a07ad8', '#5f8a3c', '#b8a03a', '#7a6a4a'],
    fol: [1, 0.95, 0.8, 0],
    desc: 'Cascades of lilac flowers trailing like a curtain.',
  },
  {
    id: 'bristlecone',
    name: 'Bristlecone Pine',
    rarity: 'Legendary',
    price: 520,
    shape: 'umbrella',
    trunk: '#b0a088',
    col: ['#3f5a3a', '#36522f', '#3a5434', '#5f7a58'],
    fol: [1, 1, 1, 1],
    desc: 'Among the oldest living things on Earth; gnarled and patient.',
  },
  {
    id: 'sequoia',
    name: 'Giant Sequoia',
    rarity: 'Legendary',
    price: 600,
    shape: 'tallcone',
    trunk: '#8a4a32',
    col: ['#3e6638', '#345c32', '#3b5c34', '#5f7a62'],
    fol: [1, 1, 1, 1],
    desc: 'The largest tree on Earth; it towers over everything.',
  },
];
export const SP: Record<string, Species> = {};
SPECIES.forEach(s => (SP[s.id] = s));
/* seasonal nursery stock: 0 spring, 1 summer, 2 autumn, 3 winter */
export const AVAIL: Record<string, number[]> = {
  oak: [0, 2, 3],
  birch: [0, 2],
  maple: [1, 2],
  apple: [0, 3],
  pine: [2, 3],
  willow: [0, 1],
  paperbark: [0, 3],
  cherry: [0],
  ginkgo: [2],
  trumpet: [1],
  jmaple: [2, 3],
  poinciana: [1],
  jacaranda: [0, 1],
  dragon: [1, 3],
  baobab: [1, 2],
  sequoia: [3],
  redoak: [0, 2],
  linden: [0, 1],
  pear: [0, 3],
  rowan: [2, 3],
  poplar: [0, 2],
  cypress: [1, 3],
  spruce: [2, 3],
  dogwood: [0, 2],
  redbud: [0, 1],
  magnolia: [0],
  beech: [1, 2],
  tulip: [1, 2],
  monkey: [3, 0],
  palm: [1],
  eucalyptus: [1, 3],
  silkfloss: [2],
  wisteria: [0],
  bristlecone: [3],
};
SPECIES.sort((a, b) => a.price - b.price);
SPECIES.forEach(s => (s.seasons = AVAIL[s.id] || [0, 1, 2, 3]));

export function nextAvail(sp: Species, si: number): number {
  for (let k = 1; k < 4; k++) {
    if (sp.seasons?.includes((si + k) % 4)) return (si + k) % 4;
  }
  return si;
}

/* ---------- decorations ---------- */
export const DECOR: Decor[] = [
  {
    id: 'flowers',
    name: 'Flower Bed',
    price: 10,
    rad: 1.1,
    w: 0.3,
    desc: 'A ring of blooms that changes with the seasons.',
  },
  {
    id: 'bench',
    name: 'Garden Bench',
    price: 15,
    rad: 1.0,
    w: 0.25,
    desc: 'A place for visitors to rest and admire the view.',
  },
  {
    id: 'lamp',
    name: 'Lamp Post',
    price: 20,
    rad: 0.5,
    w: 0.2,
    desc: 'Wrought iron with a warm amber glow.',
  },
  {
    id: 'birdbath',
    name: 'Bird Bath',
    price: 25,
    rad: 0.6,
    w: 0.3,
    desc: 'A stone basin for passing sparrows.',
  },
  {
    id: 'picnic',
    name: 'Picnic Table',
    price: 30,
    rad: 1.4,
    w: 0.35,
    desc: 'Room for a family lunch under the trees.',
  },
  {
    id: 'minipond',
    name: 'Tiny Pond',
    price: 45,
    rad: 2.0,
    w: 0.6,
    desc: 'A little pool ringed with stones and reeds.',
  },
  {
    id: 'bridge',
    name: 'Little Bridge',
    price: 60,
    rad: 2.3,
    w: 0.7,
    desc: 'An arched footbridge over a trickling stream.',
  },
  {
    id: 'gazebo',
    name: 'Gazebo',
    price: 250,
    rad: 2.7,
    w: 1.6,
    desc: 'An open pavilion with a painted roof.',
  },
];
export const DC: Record<string, Decor> = {};
DECOR.forEach(d => {
  d.kind = 'decor';
  d.seasons = [0, 1, 2, 3];
  DC[d.id] = d;
});
Object.assign(DC.bench, {
  act: 'sit',
  seatY: 0.55,
  seats: [
    [-0.45, -0.02, 0],
    [0.45, -0.02, 0],
  ],
});
Object.assign(DC.picnic, {
  act: 'sit',
  seatY: 0.5,
  seats: [
    [-0.5, 0.72, Math.PI],
    [0.5, 0.72, Math.PI],
    [-0.5, -0.72, 0],
    [0.5, -0.72, 0],
  ],
});
Object.assign(DC.gazebo, {
  act: 'sit',
  seatY: 0.66,
  seats: [
    [-0.35, 1.42, Math.PI],
    [0.35, 1.42, Math.PI],
    [-0.35, -1.42, 0],
    [0.35, -1.42, 0],
  ],
});
['flowers', 'birdbath', 'minipond'].forEach(id => (DC[id].act = 'look'));
DC.bridge.act = 'bridge';
