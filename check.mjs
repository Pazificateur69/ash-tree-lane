// node check.mjs: the structural things that break silently when the text is edited
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL(f, import.meta.url), 'utf8');
const html = read('./index.html'), css = read('./style.css'), js = read('./main.js');
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

// every door opens a room that exists, every internal link lands somewhere
for (const [, kind] of html.matchAll(/data-explore="(\w+)"/g)) ok(new RegExp(`MODES = \\{[^}]*\\b${kind}\\b`).test(js), `no room called ${kind}`);
for (const [, id] of html.matchAll(/href="#([\w-]+)"/g)) ok(html.includes(`id="${id}"`), `#${id} has no target`);

if (fail.length) { console.error(fail.join('\n')); process.exit(1); }
console.log(`ok: ${refs.length} notes, cipher "${initials}", no dashes`);
