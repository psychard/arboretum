import { SEASON_LEN } from './data';
import { BAK_KEY, SAVE_KEY, fresh, migrate, sortKnown } from './saveformat';
import { trees } from './trees';
import { decors } from './decor';
import { toast } from './ui';
import { publishWorld, visiting } from './mp';

export let state=fresh();

export function curSeason(){return Math.floor(state.season/SEASON_LEN)%4;}

export function load(){
  let raw;
  try{raw=localStorage.getItem(SAVE_KEY);}catch(e){console.warn('Arboretum: can’t read the save',e);return false;}
  if(!raw) return false;
  try{localStorage.setItem(BAK_KEY,raw);}catch(e){console.warn('Arboretum: can’t back up the save',e);}
  let s=null; try{s=JSON.parse(raw); s=s&&typeof s.money==='number'?sortKnown(migrate(s)):null;}catch(e){console.warn(e);s=null;}
  if(!s){
    // a fresh game will save over this, and the next page load over BAK_KEY: keep it somewhere neither touches
    try{localStorage.setItem(SAVE_KEY+'.unreadable',raw);}catch(e){}
    console.warn('Arboretum: the save is unreadable; a copy is under '+SAVE_KEY+'.unreadable'); return false;}
  state=Object.assign(fresh(),s); return true;
}
export let saveWarned=false;
export function save(){
  if(visiting) return;
  try{state.decor=decors.map(d=>({d:d.d.id,x:+d.x.toFixed(2),z:+d.z.toFixed(2),r:+d.r.toFixed(3)})); state.savedAt=Date.now();
    state.trees=trees.map(t=>({s:t.sp.id,x:+t.x.toFixed(2),z:+t.z.toFixed(2),g:+t.g.toFixed(4),seed:t.seed}));
    localStorage.setItem(SAVE_KEY,JSON.stringify(state)); saveWarned=false;}
  catch(e){console.warn('Arboretum: couldn’t save',e);
    if(!saveWarned){saveWarned=true;toast('Your garden couldn’t be saved on this device. Is storage full, or turned off?',null,6000);}}
  publishWorld();
}
/* Ask the browser not to clear the save when space runs low (Safari and Chrome decide quietly;
   Firefox asks the player, once). Only from a tap on Begin or Plant, never out of nowhere. */
export function askPersist(){try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist().catch(()=>{});}catch(e){}}

export function resetState(){state=fresh();}
