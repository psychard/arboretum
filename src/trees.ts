import * as THREE from 'three';
import { SP, SPECIES } from './data';
import { scene } from './render';
import { BLOBS, mat, rng, shadowAll, toCols } from './util';

/* per-species materials */
SPECIES.forEach(s=>{
  s.trunkMat=mat(s.trunk);
  s.folMat=mat(s.col[1],{side:s.shape==='dragon'?THREE.DoubleSide:THREE.FrontSide});
  s.colors=toCols(s.col); s.folScale=1;
});

/* ---------- trees ---------- */
export const trees=[]; export const treeRoot=new THREE.Group(); scene.add(treeRoot);
export function makeTree(sp,seed,mats?){
  const R=rng(seed), g=new THREE.Group(), fol=[];
  const T=mats?mats.T:sp.trunkMat, F=mats?mats.F:sp.folMat;
  const trunk=(h,rt,rb)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,7),T);m.position.y=h/2;g.add(m);return m;};
  const branch=(pos,yaw,tilt,len,rad)=>{const pv=new THREE.Object3D();pv.position.copy(pos);pv.rotation.y=yaw;
    const geo=new THREE.CylinderGeometry(rad*0.55,rad,len,5);geo.translate(0,len/2,0);const m=new THREE.Mesh(geo,T);m.rotation.z=tilt;pv.add(m);g.add(pv);
    return new THREE.Vector3(pos.x-len*Math.sin(tilt)*Math.cos(yaw),pos.y+len*Math.cos(tilt),pos.z+len*Math.sin(tilt)*Math.sin(yaw));};
  const blob=(pos,r,sy?)=>{const m=new THREE.Mesh(BLOBS[Math.floor(R()*6)],F);m.position.copy(pos);
    m.scale.set(r*(0.9+R()*0.2),r*(sy||1)*(0.85+R()*0.2),r*(0.9+R()*0.2));m.rotation.set(R()*3,R()*3,R()*3);
    m.userData.base=m.scale.clone();g.add(m);fol.push(m);return m;};
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  switch(sp.shape){
    case 'round':{const w=sp.wide?1.25:1;trunk(2.1,0.2,0.32);const n=4+Math.floor(R()*2);
      for(let i=0;i<n;i++){const e=branch(V(0,1.6+R()*0.3,0),i/n*Math.PI*2+R()*0.6,0.55+R()*0.3,1.3*w,0.13);blob(e,(0.95+R()*0.25)*w,sp.wide?0.8:1);}
      blob(V(0,3.1,0),1.35*w,sp.wide?0.75:1);blob(V((R()-.5)*.8,3.8,(R()-.5)*.8),0.95*w);break;}
    case 'narrow':{trunk(3.6,0.11,0.17);for(let i=0;i<3;i++)branch(V(0,1.8+i*0.5,0),i*2.1+R(),0.5,0.8,0.06);
      for(let i=0;i<6;i++){const a=R()*6.28,r=0.25+R()*0.35;blob(V(Math.cos(a)*r,2.1+i*0.45,Math.sin(a)*r),0.62+R()*0.2-i*0.03,1.25);}break;}
    case 'ginkgo':{trunk(3.4,0.14,0.24);for(let i=0;i<4;i++)branch(V(0,1.6+i*0.4,0),i*1.6+R(),0.4,1.0,0.08);
      const L=[[1.9,1.0,.75],[2.7,.95,.65],[3.5,.8,.55],[4.2,.6,.4]];
      L.forEach(([y,r,o])=>{for(let k=0;k<3;k++){const a=k*2.1+R();blob(V(Math.cos(a)*o,y,Math.sin(a)*o),r*(0.85+R()*0.25),0.9);}});
      blob(V(0,4.8,0),0.45);break;}
    case 'cone':{trunk(4.2,0.12,0.24);const L=[[1.3,1.6,2.0],[2.2,1.3,1.8],[3.1,0.95,1.5],[3.9,0.6,1.2]];
      L.forEach(([y,r,h])=>{const m=new THREE.Mesh(new THREE.ConeGeometry(r*(0.9+R()*0.2),h,9),F);m.position.set((R()-.5)*.15,y+h/2-0.2,(R()-.5)*.15);m.rotation.y=R()*3;m.userData.base=m.scale.clone();g.add(m);fol.push(m);});break;}
    case 'tallcone':{trunk(7,0.3,0.62);for(let i=0;i<7;i++){const y=2.6+i*0.95,r=1.9-i*0.22,h=1.9;
      const m=new THREE.Mesh(new THREE.ConeGeometry(r*(0.9+R()*0.2),h,10),F);m.position.set((R()-.5)*.2,y+h/2-0.3,(R()-.5)*.2);m.rotation.y=R()*3;m.userData.base=m.scale.clone();g.add(m);fol.push(m);}break;}
    case 'willow':{trunk(1.9,0.24,0.38);for(let i=0;i<3;i++){const e=branch(V(0,1.6,0),i*2.1+R()*0.5,0.7,1.3,0.14);blob(e,0.95,0.7);}
      blob(V(0,3.1,0),1.3,0.7);
      for(let i=0;i<18;i++){const a=i/18*Math.PI*2+R()*0.2,r=1.4+R()*0.5;const m=new THREE.Mesh(new THREE.ConeGeometry(0.26,2.5+R()*0.5,5),F);
        m.rotation.x=Math.PI;m.rotation.z=(R()-.5)*0.15;m.position.set(Math.cos(a)*r,2.1,Math.sin(a)*r);m.userData.base=m.scale.clone();m.userData.sway=R()*6;g.add(m);fol.push(m);}break;}
    case 'umbrella':{trunk(1.0,0.13,0.22);const n=4;for(let i=0;i<n;i++){const e=branch(V(0,0.85,0),i/n*Math.PI*2+R()*0.5,0.95,1.2,0.09);blob(e,0.95+R()*0.2,0.45);
      blob(V(e.x*0.55,e.y+0.45,e.z*0.55),0.75,0.45);}blob(V(0,2.25,0),1.0,0.45);break;}
    case 'spread':{trunk(1.9,0.16,0.28);const n=5;for(let i=0;i<n;i++){const e=branch(V(0,1.6,0),i/n*Math.PI*2+R()*0.4,1.0+R()*0.15,2.0,0.12);
      blob(e,1.1+R()*0.2,0.42);blob(V(e.x*0.55,e.y+0.25,e.z*0.55),0.95,0.42);}blob(V(0,3.2,0),1.3,0.45);break;}
    case 'baobab':{const pts=[[1.25,0],[1.45,0.3],[1.42,0.9],[1.25,2],[1.02,3.2],[0.78,3.9],[0.55,4.25],[0,4.35]].map(([r,y])=>new THREE.Vector2(r,y));
      g.add(new THREE.Mesh(new THREE.LatheGeometry(pts,14),T));
      for(let i=0;i<7;i++){const yaw=i/7*Math.PI*2+R()*0.4;const e=branch(V(0,4.05,0),yaw,0.9+R()*0.3,1.2+R()*0.4,0.22);
        const e2=branch(e,yaw+0.4,0.5,0.6,0.1);blob(e2,0.55+R()*0.15,0.6);}
      blob(V(0,4.9,0),0.8,0.6);break;}
    case 'column':{trunk(5.2,0.1,0.2);for(let i=0;i<9;i++){const a=R()*6.28,r=0.12+R()*0.18;blob(V(Math.cos(a)*r,1.3+i*0.62,Math.sin(a)*r),0.62-Math.abs(i-3.5)*0.05,1.5);}
      blob(V(0,7.0,0),0.35,1.6);break;}
    case 'whorl':{trunk(5.8,0.14,0.3);for(let l=0;l<4;l++){const y=2.4+l*0.9,len=1.7-l*0.3;for(let i=0;i<5;i++){const yaw=i/5*Math.PI*2+l*0.6;
        const e=branch(V(0,y,0),yaw,1.35,len,0.07);blob(e,0.36,0.7);blob(V(e.x*0.55,e.y-0.05,e.z*0.55),0.3,0.7);}}
      blob(V(0,6.1,0),0.85,0.75);break;}
    case 'palm':{const curve=new THREE.CatmullRomCurve3([V(0,0,0),V(0.25,2,0),V(0.8,4,0),V(1.4,5.6,0)]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve,16,0.19,7,false),T));const top=V(1.4,5.6,0);
      for(let i=0;i<9;i++){const yaw=i/9*Math.PI*2+R()*0.3;const m=new THREE.Mesh(BLOBS[i%6],F);m.rotation.order='YXZ';m.rotation.set(0.35+R()*0.25,yaw,0);
        m.scale.set(0.32,0.06,1.5);m.position.set(top.x+Math.sin(yaw)*1.2,top.y-0.4,top.z+Math.cos(yaw)*1.2);m.userData.base=m.scale.clone();m.userData.plain=true;g.add(m);fol.push(m);}
      const nut=mat('#5a4228');for(let i=0;i<3;i++){const c=new THREE.Mesh(new THREE.SphereGeometry(0.16,7,5),nut);c.position.set(top.x+Math.cos(i*2.1)*0.22,top.y-0.3,top.z+Math.sin(i*2.1)*0.22);g.add(c);}
      break;}
    case 'dragon':{trunk(2.2,0.24,0.32);for(let i=0;i<7;i++){const e=branch(V(0,2.0,0),i/7*Math.PI*2+R()*0.3,0.45+R()*0.12,1.5,0.12);
      branch(e,i/7*Math.PI*2+0.5,0.5,0.5,0.06);}
      const crown=new THREE.Mesh(new THREE.SphereGeometry(2.5,16,8,0,Math.PI*2,0,Math.PI/2),F);crown.scale.set(1,0.42,1);crown.position.y=3.3;crown.userData.base=crown.scale.clone();g.add(crown);fol.push(crown);break;}
  }
  shadowAll(g);
  return {group:g,fol};
}
export function growthScale(g){return 0.22+0.78*g;}
export function addTree(spId,x,z,g,seed?){
  const sp=SP[spId]; if(!sp) return null;
  seed=seed||Math.floor(Math.random()*1e9);
  const {group,fol}=makeTree(sp,seed);
  group.position.set(x,0,z); group.rotation.y=(seed%628)/100;
  const t={sp,group,fol,x,z,g,seed}; group.userData.tree=t; group.scale.setScalar(growthScale(g));
  treeRoot.add(group); trees.push(t); return t;
}
