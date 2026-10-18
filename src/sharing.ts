import { replaceWith, save, state } from './save';
import { backupJson, readBackup, shareCode } from './share';
import { toast } from './ui';

/* The shop's Share, Back up and Restore buttons. */

const cancelled = (e: unknown) => (e as { name?: string } | null)?.name === 'AbortError';

/* Safari lets a page share or copy only straight after a tap, and compressing the garden is
   asynchronous; so the link is made when the shop opens, ready for the tap on Share. The shop is
   open throughout, and nothing can be planted while it is, so the link stays current. */
let prepared: Promise<string> | null = null,
  preparedUrl: string | null = null;
export function prepareShare() {
  save();
  preparedUrl = null;
  const p: Promise<string> = shareCode({ trees: state.trees, decor: state.decor, season: state.season }).then(
    code => {
      const url = `${location.origin}${location.pathname}#g=${code}`;
      if (prepared === p) preparedUrl = url;
      return url;
    },
  );
  prepared = p;
}

/** A link anyone can open to walk around this garden as it is now. */
export async function shareGarden() {
  if (!prepared) prepareShare();
  const url = preparedUrl ?? (await prepared!);
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'The Painted Arboretum',
        text: 'Come and walk around my arboretum.',
        url,
      });
      return;
    } catch (e) {
      if (cancelled(e)) return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast('Link copied. Anyone who opens it can walk around your arboretum as it is now.', null, 5000);
  } catch {
    prompt('Copy this link to share your arboretum:', url);
  }
}

/** The whole save as a file: to keep, or to restore on another device or browser. */
export async function backupGarden() {
  save();
  const name = `arboretum-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([backupJson(state)], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Arboretum backup' });
      return;
    } catch (e) {
      if (cancelled(e)) return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  toast('A copy of your garden is in your downloads.');
}

/** Choose a backup file, then confirm before it replaces this garden. */
export function restoreGarden() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = async () => {
    const f = input.files?.[0];
    if (!f) return;
    const s = readBackup(await f.text());
    if (!s) {
      toast('That file isn’t an arboretum backup.');
      return;
    }
    const trees = s.trees.length + s.orphans.trees.length;
    toast(
      `That backup has ${trees} tree${trees === 1 ? '' : 's'} and $${Math.floor(s.money).toLocaleString()}. Replace this garden with it?`,
      { label: 'Replace', fn: () => replaceWith(s) },
      12000,
    );
  };
  input.click();
}
