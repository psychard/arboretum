import * as THREE from 'three';
import { $ } from './dom';
import { SEASONS } from './data';
import { camera, postCam, postMat, postScene, renderer, rt, scene, sun } from './render';
import { curSeason } from './save';
import { closeShop, dropPick } from './shop';
import { closePlayers, visiting, visitLabel } from './mp';

/* ---------- photo mode ----------
   The 📷 chip clears the screen of menus, bars and notes, leaving the garden to frame by dragging
   and pinching. The shutter paints that view again, bigger than the screen and with sharper
   shadows, and offers it framed on paper with a caption, to save or share.
   The HUD and its notes are HTML over the canvas, so they never reach a picture; the few things
   drawn in the scene itself only as UI (the placing ghost, the rings under other players) carry
   userData.ui and are hidden here. */

export let photoMode = false;
let raw: HTMLCanvasElement | null = null,
  framed = true,
  shot: { blob: Blob; name: string } | null = null,
  busy = false,
  developing = 0;

const hiddenUi: THREE.Object3D[] = [];
function hideSceneUi() {
  scene.traverse(o => {
    if (o.userData.ui && o.visible) {
      o.visible = false;
      hiddenUi.push(o);
    }
  });
}
function showSceneUi() {
  hiddenUi.splice(0).forEach(o => (o.visible = true));
}

export function enterPhoto() {
  if (photoMode) return;
  closeShop();
  closePlayers();
  dropPick();
  photoMode = true;
  document.body.classList.add('photo');
  hideSceneUi();
}
export function exitPhoto() {
  if (!photoMode) return;
  closeView();
  photoMode = false;
  document.body.classList.remove('photo');
  showSceneUi();
}

function setShadowMap(n: number) {
  if (sun.shadow.mapSize.x === n) return;
  sun.shadow.mapSize.set(n, n);
  // three.js makes a new shadow map, at the new size, the next time it finds none
  (sun.shadow.map as THREE.WebGLRenderTarget | null)?.dispose();
  sun.shadow.map = null;
}

/** The current view painted at up to 4096 px on its long side (about twice a phone screen). */
export function paint(): HTMLCanvasElement {
  const screen = new THREE.Vector2();
  renderer.getDrawingBufferSize(screen);
  const maxSide = Math.min(4096, renderer.capabilities.maxTextureSize);
  const long = Math.min(maxSide, Math.max(2048, 2 * Math.max(screen.x, screen.y)));
  const k = long / Math.max(screen.x, screen.y),
    W = Math.round(screen.x * k),
    H = Math.round(screen.y * k);

  hideSceneUi();
  // sharper shadows for this one frame (1024 on screen); 4096 only for a big picture, as it is 64 MB
  const shadow = sun.shadow.mapSize.x;
  setShadowMap(Math.min(long > 3000 ? 4096 : 2048, maxSide));
  const sceneRT = new THREE.WebGLRenderTarget(W, H, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });
  const outRT = new THREE.WebGLRenderTarget(W, H);
  const px = new Uint8Array(W * H * 4);
  try {
    renderer.setRenderTarget(sceneRT);
    renderer.render(scene, camera);
    postMat.uniforms.tDiffuse.value = sceneRT.texture;
    postMat.uniforms.res.value.set(W, H);
    postMat.uniforms.scale.value = W / screen.x;
    renderer.setRenderTarget(outRT);
    renderer.render(postScene, postCam);
    renderer.readRenderTargetPixels(outRT, 0, 0, W, H, px);
  } finally {
    renderer.setRenderTarget(null);
    postMat.uniforms.tDiffuse.value = rt.texture;
    postMat.uniforms.res.value.copy(screen);
    postMat.uniforms.scale.value = 1;
    setShadowMap(shadow);
    sceneRT.dispose();
    outRT.dispose();
    if (!photoMode) showSceneUi();
  }
  // WebGL's rows run bottom to top
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!,
    img = g.createImageData(W, H),
    row = W * 4;
  for (let y = 0; y < H; y++) img.data.set(px.subarray((H - 1 - y) * row, (H - y) * row), y * row);
  g.putImageData(img, 0, 0);
  return c;
}

const caption = () => `${SEASONS[curSeason()]} in ${visiting ? visitLabel() : 'the Painted Arboretum'}`;
const today = () =>
  new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

/** The picture mounted on aged paper, with the season and the date written underneath. */
async function mount(src: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const W = src.width,
    H = src.height,
    m = Math.round(Math.max(W, H) * 0.035),
    band = Math.round(m * 2.1),
    fs = Math.round(band * 0.42);
  const c = document.createElement('canvas');
  c.width = W + 2 * m;
  c.height = H + m + band;
  const g = c.getContext('2d')!;
  g.fillStyle = '#efe1bf';
  g.fillRect(0, 0, c.width, c.height);
  const light = g.createRadialGradient(c.width * 0.12, 0, 0, c.width * 0.12, 0, c.width * 1.15);
  light.addColorStop(0, 'rgba(255,251,236,.75)');
  light.addColorStop(0.55, 'rgba(255,251,236,0)');
  light.addColorStop(1, 'rgba(160,110,45,.32)');
  g.fillStyle = light;
  g.fillRect(0, 0, c.width, c.height);
  // the paper's fibres: faint specks, seeded so every print of a view matches
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0, n = Math.round((c.width * c.height) / 900); i < n; i++) {
    g.fillStyle = `rgba(${rnd() < 0.5 ? '120,82,38' : '255,250,235'},${0.05 + rnd() * 0.07})`;
    g.fillRect(rnd() * c.width, rnd() * c.height, 1 + rnd() * m * 0.06, 1 + rnd() * m * 0.06);
  }
  g.shadowColor = 'rgba(90,60,25,.35)';
  g.shadowBlur = m * 0.35;
  g.shadowOffsetY = m * 0.08;
  g.drawImage(src, m, m);
  g.shadowColor = 'transparent';
  g.strokeStyle = 'rgba(75,50,25,.5)';
  g.lineWidth = Math.max(1, m * 0.04);
  g.strokeRect(m, m, W, H);
  const font = (px: number) => `${px}px "Architects Daughter", "Bradley Hand", cursive`;
  try {
    await document.fonts.load(font(fs));
  } catch {}
  // the caption on the left, the date on the right; smaller if a tall, narrow picture can't fit both
  g.font = font(fs);
  const need = g.measureText(caption()).width + g.measureText(today()).width + fs * 1.5;
  if (need > W) g.font = font(Math.floor((fs * W) / need));
  g.textBaseline = 'middle';
  const y = H + m + band * 0.52;
  g.fillStyle = '#4b3219';
  g.textAlign = 'left';
  g.fillText(caption(), m, y);
  g.fillStyle = '#80603a';
  g.textAlign = 'right';
  g.fillText(today(), W + m, y);
  return c;
}

/* The picture shows as soon as it is painted; the JPEG (most of a second on a phone) is made
   behind it, and Save waits for it. */
async function develop() {
  if (!raw) return;
  const mine = ++developing;
  const c = framed ? await mount(raw) : raw;
  if (mine !== developing) return;
  c.setAttribute('role', 'img');
  c.setAttribute('aria-label', 'The garden as you framed it, painted');
  $('#photoPic').replaceChildren(c);
  $('#photoFrame').setAttribute('aria-pressed', String(framed));
  shot = null;
  const save = $<HTMLButtonElement>('#photoSave');
  save.disabled = true;
  save.textContent = 'Preparing…';
  const blob = await new Promise<Blob | null>(r => c.toBlob(r, 'image/jpeg', 0.92));
  if (mine !== developing || !blob) return;
  shot = { blob, name: `arboretum-${new Date().toISOString().slice(0, 10)}.jpg` };
  save.disabled = false;
  save.textContent = 'Save picture';
}

async function takePicture() {
  if (busy) return;
  busy = true;
  const flash = $('#flash');
  flash.classList.remove('go');
  void flash.offsetWidth; // restart the animation
  flash.classList.add('go');
  try {
    raw = paint();
    await develop();
    $('#photoView').classList.add('open');
    $('#photoView').setAttribute('aria-hidden', 'false');
  } catch (e) {
    console.warn('Arboretum: couldn’t take the picture', e);
  } finally {
    busy = false;
  }
}

function closeView() {
  $('#photoView').classList.remove('open');
  $('#photoView').setAttribute('aria-hidden', 'true');
  developing++;
  raw = null;
  shot = null;
  $('#photoPic').replaceChildren();
}

/* The tap on Save shares the file straight away (the picture is ready by then), since Safari
   only opens the share sheet, with its Save Image, straight after a tap. */
function savePicture() {
  if (!shot) return;
  const file = new File([shot.blob], shot.name, { type: 'image/jpeg' });
  if (navigator.canShare?.({ files: [file] })) {
    navigator.share({ files: [file] }).catch(() => {});
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(shot.blob);
  a.download = shot.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

$('#photoBtn').onclick = enterPhoto;
$('#photoExit').onclick = exitPhoto;
$('#shutter').onclick = takePicture;
$('#photoBack').onclick = closeView;
$('#photoSave').onclick = savePicture;
$('#photoFrame').onclick = () => {
  framed = !framed;
  develop();
};
addEventListener('keydown', e => {
  if (e.key === 'Escape' && photoMode) {
    if ($('#photoView').classList.contains('open')) closeView();
    else exitPhoto();
  }
});
