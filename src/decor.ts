import * as THREE from 'three';
import { DC } from './data';
import { scene } from './render';
import { BLOBS, V3, hash3, mat, shadowAll, toCols } from './util';
import { W } from './world';
import { waterChanged } from './water';

export const DM={wood:mat('#6a4a30'),dark:mat('#7a5636'),stone:mat('#a59c8c'),iron:mat('#5f8f7f'),soil:mat('#5a4030'),reed:mat('#5a7a3a'),roof:mat('#8a3a2e'),
  glow:new THREE.MeshBasicMaterial({color:'#ffe2a0'}),flower:mat('#e86a8a')};
export const FLOWER_C=toCols(['#e86a8a','#e8c03a','#d0702a','#8a7a6a']);

export const decors=[]; export const decorRoot=new THREE.Group(); scene.add(decorRoot);
export function makeDecor(id){
  const g=new THREE.Group();
  const box=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);return o;};
  const cyl=(rt,rb,h,m,x,y,z,seg)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||10),m);o.position.set(x,y,z);g.add(o);return o;};
  switch(id){
    case 'flowers':{cyl(1,1.05,0.18,DM.soil,0,0.09,0,16);
      for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=0.35+(i%3)*0.22;const b=new THREE.Mesh(BLOBS[i%6],i%3===1?DM.reed:DM.flower);
        b.scale.setScalar(i%3===1?0.2:0.16);b.position.set(Math.cos(a)*r,0.3,Math.sin(a)*r);g.add(b);}break;}
    case 'bench':{box(1.8,0.1,0.55,DM.wood,0,0.5,0);box(1.8,0.45,0.08,DM.wood,0,0.82,-0.26);
      [-0.75,0.75].forEach(x=>box(0.08,0.5,0.5,DM.iron,x,0.25,0));break;}
    case 'lamp':{cyl(0.06,0.09,3,DM.iron,0,1.5,0,8);cyl(0.22,0.3,0.15,DM.iron,0,0.07,0,8);box(0.32,0.4,0.32,DM.glow,0,3.15,0);
      const cap=new THREE.Mesh(new THREE.ConeGeometry(0.3,0.3,4),DM.iron);cap.position.y=3.5;cap.rotation.y=Math.PI/4;g.add(cap);break;}
    case 'birdbath':{cyl(0.16,0.28,0.9,DM.stone,0,0.45,0,10);cyl(0.55,0.25,0.2,DM.stone,0,0.98,0,14);
      const w=new THREE.Mesh(new THREE.CircleGeometry(0.47,14),W.waterMat);w.rotation.x=-Math.PI/2;w.position.y=1.085;g.add(w);break;}
    case 'picnic':{box(1.9,0.08,0.85,DM.wood,0,0.78,0);[-0.7,0.7].forEach(z=>box(1.9,0.07,0.3,DM.wood,0,0.46,z));
      [-0.75,0.75].forEach(x=>{box(0.08,0.06,1.75,DM.dark,x,0.42,0);
        const a=box(0.07,0.85,0.07,DM.dark,x,0.4,0.2);a.rotation.x=0.45;const b=box(0.07,0.85,0.07,DM.dark,x,0.4,-0.2);b.rotation.x=-0.45;});break;}
    case 'minipond':{const w=new THREE.Mesh(new THREE.CircleGeometry(1.5,24),W.waterMat);w.rotation.x=-Math.PI/2;w.position.y=0.04;g.add(w);
      for(let i=0;i<16;i++){const a=i/16*Math.PI*2;const r=new THREE.Mesh(BLOBS[i%6],DM.stone);const sc=0.22+0.12*hash3(i,2,3);r.scale.set(sc,sc*0.6,sc);r.position.set(Math.cos(a)*1.6,0.08,Math.sin(a)*1.6);g.add(r);}
      for(let i=0;i<7;i++){const a=2.2+i*0.18;const c=new THREE.Mesh(new THREE.ConeGeometry(0.04,0.9+0.3*hash3(i,1,1),4),DM.reed);c.position.set(Math.cos(a)*1.4,0.45,Math.sin(a)*1.4);g.add(c);}
      const pad=new THREE.Mesh(new THREE.CircleGeometry(0.22,10),DM.reed);pad.rotation.x=-Math.PI/2;pad.position.set(0.4,0.05,0.3);g.add(pad);break;}
    case 'bridge':{const w=new THREE.Mesh(new THREE.PlaneGeometry(5,1.5),W.waterMat);w.rotation.x=-Math.PI/2;w.position.y=0.035;g.add(w);
      for(let i=0;i<8;i++){const r=new THREE.Mesh(BLOBS[i%6],DM.stone);r.scale.set(0.3,0.15,0.25);r.position.set((i-3.5)*0.62,0.06,(i%2?0.8:-0.8));g.add(r);}
      const L=1.9,n=9;for(let i=0;i<n;i++){const z=-L+i*(2*L/(n-1));const y=0.2+0.55*Math.cos(z/L*Math.PI/2);const dy=-0.55*Math.sin(z/L*Math.PI/2)*(Math.PI/2/L);
        const pl=box(1.1,0.08,0.44,DM.wood,0,y,z);pl.rotation.x=-Math.atan(dy);}
      [-0.55,0.55].forEach(x=>{const pts=[];for(let i=0;i<=12;i++){const z=-L+i*(2*L/12);pts.push(V3(x,0.75+0.55*Math.cos(z/L*Math.PI/2),z));}
        g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,0.04,5,false),DM.dark));
        [-L,0,L].forEach(z=>{const y=0.2+0.55*Math.cos(z/L*Math.PI/2);box(0.08,0.6,0.08,DM.dark,x,y+0.3,z);});});break;}
    case 'gazebo':{cyl(2.4,2.5,0.3,DM.stone,0,0.15,0,8);for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8;cyl(0.08,0.1,2.4,DM.wood,Math.cos(a)*2.1,1.5,Math.sin(a)*2.1,6);}
      const roof=new THREE.Mesh(new THREE.ConeGeometry(2.9,1.6,8),DM.roof);roof.position.y=3.5;roof.rotation.y=Math.PI/8;g.add(roof);
      cyl(2.5,2.5,0.18,DM.wood,0,2.72,0,8);const f=new THREE.Mesh(new THREE.SphereGeometry(0.15,8,6),DM.iron);f.position.y=4.35;g.add(f);
      [1.4,-1.4].forEach(z=>box(1.4,0.08,0.4,DM.wood,0,0.62,z));break;}
  }
  shadowAll(g); return g;
}
export function addDecor(id,x,z,r){const d=DC[id];if(!d)return null;const g=makeDecor(id);g.position.set(x,0,z);g.rotation.y=r||0;
  const o={d,group:g,x,z,r:r||0,occ:[]};g.userData.decor=o;decorRoot.add(g);decors.push(o);waterChanged();return o;}

export function localToWorld(d,lx,lz){const c=Math.cos(d.r),sn=Math.sin(d.r);return new THREE.Vector3(d.x+lx*c+lz*sn,0,d.z-lx*sn+lz*c);}
export function groundY(x,z){let y=0;for(const d of decors){const id=d.d.id;if(id!=='bridge'&&id!=='gazebo')continue;const dx=x-d.x,dz=z-d.z;
  if(id==='gazebo'){if(dx*dx+dz*dz<2.3*2.3)y=Math.max(y,0.3);continue;}
  const c=Math.cos(d.r),sn=Math.sin(d.r),lx=dx*c-dz*sn,lz=dx*sn+dz*c;
  if(Math.abs(lx)<0.6&&Math.abs(lz)<1.9)y=Math.max(y,0.24+0.55*Math.cos(lz/1.9*Math.PI/2));}return y;}
