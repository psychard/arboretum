import * as THREE from 'three';
import { POND, POND_R } from './world';
import { decors, localToWorld } from './decor';

/* ---------- water obstacles and ducks ---------- */

export let obsDirty=true, OBS=[], ducksDirty=true;
export function waterObstacles(){
  if(!obsDirty) return OBS; obsDirty=false; OBS=[{x:POND.x,z:POND.z,r:POND_R+0.2}];
  for(const d of decors){
    if(d.d.id==='minipond') OBS.push({x:d.x,z:d.z,r:1.7});
    if(d.d.id==='bridge') [[-1.4,0.85],[1.4,0.85],[-2.3,0.8],[2.3,0.8]].forEach(([lx,r])=>{const p=localToWorld(d,lx,0);OBS.push({x:p.x,z:p.z,r});});
  }
  return OBS;
}
export function inWater(x,z,m){for(const c of waterObstacles()) if(Math.hypot(x-c.x,z-c.z)<c.r+(m||0)) return true; return false;}
export function duckPonds(){return [{x:POND.x,z:POND.z,r:POND_R}].concat(decors.filter(d=>d.d.id==='minipond').map(d=>({x:d.x,z:d.z,r:1.5})));}

export function walkTo(obj,target,speed,dt,avoid?){
  const d=new THREE.Vector3().subVectors(target,obj.position); d.y=0; const dist=d.length();
  if(dist<0.15) return true;
  d.normalize();
  if(avoid){const ob=waterObstacles(),px=obj.position.x,pz=obj.position.z;
    for(const c of ob){const ox=px-c.x,oz=pz-c.z,od=Math.hypot(ox,oz)||0.001;
      if(od<c.r+0.1){d.set(ox/od,0,oz/od);break;}
      const look=Math.min(1.2,dist),ax=px+d.x*look-c.x,az=pz+d.z*look-c.z;
      if(Math.hypot(ax,az)<c.r+0.35&&Math.hypot(target.x-c.x,target.z-c.z)>c.r){let tx=-oz/od,tz=ox/od;if(tx*d.x+tz*d.z<0){tx=-tx;tz=-tz;}d.set(tx,0,tz);break;}}}
  const step=Math.min(dist,speed*dt); obj.position.addScaledVector(d,step);
  const want=Math.atan2(d.x,d.z); let diff=want-obj.rotation.y; diff=Math.atan2(Math.sin(diff),Math.cos(diff)); obj.rotation.y+=diff*Math.min(1,dt*6);
  return false;
}

/* placing, clearing or swapping decorations moves the water: rebuild obstacles and ducks */
export function waterChanged(){obsDirty=true; ducksDirty=true;}
export function takeDucksDirty(){const d=ducksDirty; ducksDirty=false; return d;}
