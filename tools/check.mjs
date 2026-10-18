// Parse (never run) every inline <script> in index.html, so a typo in the one
// file that is the whole game fails the deploy instead of shipping a blank
// meadow. The chat that wrote it checked each edit the same way, with
// `node --check`; this is that check, kept.
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!inline.length) throw new Error('index.html has no inline <script> to check');
inline.forEach((src, i) => new Script(src, { filename: `index.html <script> #${i + 1}` }));
console.log(`ok: ${inline.length} inline script(s) parse`);
