import * as THREE from 'three';
import { $ } from './dom';

/* ---------- renderer ---------- */
export const canvas=$<HTMLCanvasElement>('#c');
export const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
export const scene=new THREE.Scene();
scene.background=new THREE.Color('#cfe0e8');
scene.fog=new THREE.Fog(0xcfe0e8,55,160);
export const camera=new THREE.PerspectiveCamera(50,1,0.1,500);
export const rt=new THREE.WebGLRenderTarget(2,2,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});

export const FRAG=`
precision highp float;
uniform sampler2D tDiffuse; uniform vec2 res;
varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));
 return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
const int R=3;
void main(){
 vec2 px=1.0/res; vec2 p=vUv*res;
 vec2 jit=vec2(vn(p*0.045),vn(p*0.045+19.3))-0.5;
 vec2 uv=vUv+jit*px*5.0;
 float st=1.7;
 vec3 m0=vec3(0.),m1=vec3(0.),m2=vec3(0.),m3=vec3(0.);
 vec3 s0=vec3(0.),s1=vec3(0.),s2=vec3(0.),s3=vec3(0.);
 vec3 c;
 for(int j=0;j<=R;j++){for(int i=0;i<=R;i++){
   vec2 o=vec2(float(i),float(j))*px*st;
   c=texture2D(tDiffuse,uv+vec2(-o.x,-o.y)).rgb; m0+=c; s0+=c*c;
   c=texture2D(tDiffuse,uv+vec2( o.x,-o.y)).rgb; m1+=c; s1+=c*c;
   c=texture2D(tDiffuse,uv+vec2( o.x, o.y)).rgb; m2+=c; s2+=c*c;
   c=texture2D(tDiffuse,uv+vec2(-o.x, o.y)).rgb; m3+=c; s3+=c*c;
 }}
 float n=float((R+1)*(R+1));
 m0/=n;m1/=n;m2/=n;m3/=n;
 vec3 v0=abs(s0/n-m0*m0),v1=abs(s1/n-m1*m1),v2=abs(s2/n-m2*m2),v3=abs(s3/n-m3*m3);
 float a0=v0.r+v0.g+v0.b,a1=v1.r+v1.g+v1.b,a2=v2.r+v2.g+v2.b,a3=v3.r+v3.g+v3.b;
 vec3 col=m0; float mv=a0;
 if(a1<mv){mv=a1;col=m1;} if(a2<mv){mv=a2;col=m2;} if(a3<mv){mv=a3;col=m3;}
 float l=dot(col,vec3(0.299,0.587,0.114));
 col=mix(vec3(l),col,1.18);
 float stroke=vn(vec2(p.x*0.07+p.y*0.035,p.y*0.32-p.x*0.025));
 float stroke2=vn(vec2(p.x*0.3-p.y*0.06,p.y*0.05+p.x*0.12)+31.0);
 col*=0.93+0.1*stroke+0.04*stroke2;
 float weave=(sin(p.x*1.35)*sin(p.y*1.35))*0.5+0.5;
 col*=0.965+0.045*weave;
 col+=(hash(p)-0.5)*0.025;
 col=mix(col,col*vec3(1.05,1.0,0.86),0.38);
 vec2 q=vUv-0.5; col*=1.0-dot(q,q)*0.6;
 gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`;
export const postScene=new THREE.Scene(), postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
export const postMat=new THREE.ShaderMaterial({uniforms:{tDiffuse:{value:rt.texture},res:{value:new THREE.Vector2(2,2)}},
  vertexShader:'varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:FRAG,depthTest:false,depthWrite:false});
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMat));
export function resize(){
  const w=innerWidth,h=innerHeight; renderer.setSize(w,h,false);
  camera.aspect=w/h; camera.updateProjectionMatrix();
  const v=new THREE.Vector2(); renderer.getDrawingBufferSize(v); rt.setSize(v.x,v.y); postMat.uniforms.res.value.copy(v);
}
addEventListener('resize',resize); resize();

/* ---------- lights ---------- */
export const hemi=new THREE.HemisphereLight(0xe4ecf0,0x6a5a3a,0.62); scene.add(hemi);
export const sun=new THREE.DirectionalLight(0xfff0d8,0.95); sun.position.set(30,48,18); sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024); Object.assign(sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,near:1,far:160});
sun.shadow.bias=-0.0008; scene.add(sun);
