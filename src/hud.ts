import { $ } from './dom';
import { DECOR, SEASONS, SEASON_ICON, SEASON_LEN, SPECIES } from './data';
import { state } from './save';
import { trees } from './trees';
import { people } from './people';
import { dropPick, openShop, picked, priceOf, renderList, shopTab, stage, updateBanner } from './shop';
import { toast } from './ui';
import { MP, visitLabel, visiting } from './mp';

/* ---------- HUD ---------- */
export let hudClock = 0,
  lastMoney = -1,
  lastAfford = '',
  lastSi = -1,
  lastHudH = -1;
export function onSeasonChange(si, prev) {
  const arrivals = SPECIES.filter(s => s.seasons.includes(si) && !s.seasons.includes(prev)).map(s => s.name);
  toast(
    `${SEASONS[si]} has arrived. New at the nursery: ${arrivals.join(', ')}.`,
    { label: 'Shop', fn: openShop },
    8000,
  );
  if (picked && !picked.seasons.includes(si)) {
    toast(`The ${picked.name} is out of season now.`);
    dropPick();
  }
}
export function refreshHud(force?) {
  const m = Math.floor(state.money);
  if (m !== lastMoney || force) {
    $('#money').textContent = '$' + m.toLocaleString();
    lastMoney = m;
  }
  $('#vis').textContent = String(people.length);
  $('#cats').textContent = String(state.cats);
  const ph = state.season / SEASON_LEN,
    si = Math.floor(ph) % 4,
    frac = ph - Math.floor(ph),
    left = Math.ceil(((1 - frac) * SEASON_LEN) / 60);
  // only the home garden's seasons count: a visit shows someone else's, and the nursery is shut
  if (!visiting) {
    if (lastSi >= 0 && si !== lastSi) onSeasonChange(si, lastSi);
    lastSi = si;
  }
  $('#seasonTxt').textContent = `${SEASON_ICON[si]} ${SEASONS[si]}, ${left} min left`;
  $('#seasonBar').style.width = (frac * 100).toFixed(1) + '%';
  $('#hint').style.display = trees.length || visiting || picked ? 'none' : 'block';
  const hh = $('#hud').offsetHeight;
  if (hh !== lastHudH) {
    lastHudH = hh;
    document.documentElement.style.setProperty('--hud-h', hh + 'px');
  }
  $('#waveChip').style.display = MP.avatars.size && !visiting ? '' : 'none';
  if (visiting) $('#visitTxt').textContent = `Visiting ${visitLabel()}`;
  if ($('#shop').classList.contains('open')) {
    const sig =
      shopTab +
      si +
      ':' +
      SPECIES.map(s => (state.money >= priceOf(s, stage) ? 1 : 0)).join('') +
      DECOR.map(d => (state.money >= d.price ? 1 : 0)).join('');
    if (sig !== lastAfford || force) {
      lastAfford = sig;
      renderList();
    }
  }
  if (picked) updateBanner();
}

export function tickHud(dt) {
  hudClock += dt;
  if (hudClock > 0.25) {
    hudClock = 0;
    refreshHud();
  }
}
