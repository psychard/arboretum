import { $ } from './dom';
import { camera } from './render';

/* ---------- toasts and floaters ---------- */
export function toast(msg,action?,ms?){
  const box=$('#toasts'); while(box.children.length>2) box.firstChild.remove();
  const t=document.createElement('div'); t.className='toast paper'; const s=document.createElement('span'); s.textContent=msg; t.appendChild(s);
  if(action){const b=document.createElement('button');b.className='btn primary';b.textContent=action.label;b.onclick=()=>{action.fn();t.remove();};t.appendChild(b);}
  box.appendChild(t); setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),450);},ms||2600);
}
export function floatText(txt,world){
  const v=world.clone().project(camera); if(v.z>1||Math.abs(v.x)>1.1||Math.abs(v.y)>1.1) return;
  const el=document.createElement('div'); el.className='floater'; el.textContent=txt;
  el.style.left=((v.x+1)/2*innerWidth)+'px'; el.style.top=((1-v.y)/2*innerHeight)+'px';
  document.body.appendChild(el); setTimeout(()=>el.remove(),1700);
}
