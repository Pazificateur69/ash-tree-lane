// node check.mjs: the structural things that break silently when the text is edited
import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';

const read = f => readFileSync(new URL(f, import.meta.url), 'utf8');
const html = read('./index.html'), css = read('./style.css'), js = read('./game.js');
const fail = [];
const ok = (cond, msg) => { if (!cond) fail.push(msg); };

// no em or en dashes anywhere
for (const [name, src] of Object.entries({ html, css, js })) ok(!/[–—]/.test(src), `${name}: contains an em or en dash`);

// every note reference has its note, numbers run in document order, every note is referenced
const refs = [...html.matchAll(/class="ref" href="#(n\d+)">(\d+)</g)];
const notes = new Map([...html.matchAll(/<aside class="note" id="(n\d+)" data-voice="(\w+)" data-num="(\d+)"/g)].map(m => [m[1], { voice: m[2], num: m[3] }]));
refs.forEach(([, id, num], i) => {
  ok(notes.has(id), `note ${num}: #${id} missing`);
  ok(notes.get(id)?.num === num, `note ${num}: label does not match #${id}`);
  ok(+num === i + 1, `note ${num}: out of order (position ${i + 1})`);
});
ok(refs.length === notes.size, `${refs.length} references for ${notes.size} notes`);
for (const { voice } of notes.values()) ok(['zampano', 'johnny', 'editors', 'pelafina'].includes(voice), `unknown voice ${voice}`);

// Pelafina's sentence spells what the decoder prints
const cipher = html.match(/data-cipher>([^<]+)</)?.[1] ?? '';
const initials = (cipher.match(/[A-Za-z]+/g) || []).map(w => w[0].toLowerCase()).join('');
const groups = (js.match(/GROUPS = \[([\d, ]+)\]/)?.[1] ?? '').split(',').map(Number);
ok(initials === 'whoiswritingyou', `cipher spells "${initials}"`);
ok(groups.reduce((a, b) => a + b, 0) === initials.length, 'decoder groups do not cover the cipher');

// every page of the book is in the journal's order, and everything the house can unlock is a page
for (const [, id] of html.matchAll(/<section [^>]*id="([\w-]+)" data-title=/g)) ok(js.includes(`'${id}'`), `section #${id} is not in the journal order`);
// the assets the house asks for exist

for (const [, name] of js.matchAll(/T\('([\w.]+)'/g)) ok(existsSync(new URL('./assets/textures/' + name, import.meta.url)), `texture ${name} is missing`);
for (const [, name] of js.matchAll(/model\('([\w]+)'/g)) ok(existsSync(new URL('./assets/models/' + name + '.glb', import.meta.url)), `model ${name} is missing`);
for (const [, name] of js.matchAll(/M\.label\('([\w.]+)'/g)) ok(existsSync(new URL('./assets/textures/' + name, import.meta.url)), `label ${name} is missing`);
for (const [, path] of html.matchAll(/"(\.\/vendor\/[^"]+\.js)"/g)) ok(existsSync(new URL(path, import.meta.url)), `${path} is missing`);
// everything the house can unlock is a page of the book
for (const [, id] of js.matchAll(/(?:unlock\('|chapter: ')([\w]+)'/g)) ok(html.includes(`id="${id}"`), `unlock('${id}') has no page`);
const ORDER = (js.match(/const ORDER = \[([^\]]+)\]/)?.[1] ?? '').split(',').map(s => s.trim().replace(/'/g, '')).filter(Boolean);
ok(ORDER.length === 22, `journal order has ${ORDER.length} pages`);
for (const id of ORDER) ok(new RegExp(`id="${id}" data-title="`).test(html), `${id} has no data-title`);
for (const [, id] of html.matchAll(/href="#([\w-]+)"/g)) ok(html.includes(`id="${id}"`), `#${id} has no target`);

if (fail.length) { console.error(fail.join('\n')); process.exit(1); }
console.log(`ok: ${ORDER.length} pages, ${refs.length} notes, cipher "${initials}", no dashes`);
