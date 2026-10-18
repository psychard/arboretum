import './style.css';
import { $ } from './dom';

function webglOk(){
  try{const c=document.createElement('canvas');
    return !!(window.WebGLRenderingContext&&(c.getContext('webgl')||c.getContext('experimental-webgl')));}
  catch(e){return false;}
}
if(!webglOk()){
  const card=$('#intro .card');
  card.textContent='';
  const h=document.createElement('h1'); h.textContent='The Painted Arboretum';
  const p=document.createElement('p');
  p.textContent='This garden is painted with WebGL, which this browser does not seem to have available. Another browser, or hardware acceleration switched back on in the settings, should bring it back.';
  const a=document.createElement('a'); a.className='home'; a.href='https://www.psychard.com/'; a.textContent='psychard.com';
  card.append(h,p,a);
}else{
  // the game builds a WebGL renderer as its modules load, so it only loads once WebGL is known to work
  import('./game');
}
