// Accessibility smoke: the book without script, modal journal and leaves, keyboard turning, and the threshold coming back when WebGL is missing.
// Run from the repository root with a static server on port 8123: node tools/a11y.mjs (needs playwright-core; CHROME=... to pick a Chromium)
import { chromium } from 'playwright-core';
const CHROME = process.env.CHROME || undefined;
const ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'];
let fails = 0;
const check = (name, ok, info) => { console.log(ok ? 'PASS' : 'FAIL', name, JSON.stringify(info)); if (!ok) fails++; };
const URL = 'http://127.0.0.1:8123/index.html?t=' + Date.now();
// 1. no script: the whole book is on the page
{
  const browser = await chromium.launch({ executablePath: CHROME, args: ARGS });
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'load' });
  const r = await page.evaluate(() => { const b = document.querySelector('#book'); const cs = getComputedStyle(b); return { display: cs.display, sections: b.querySelectorAll(':scope > section[data-title]').length, notesInline: getComputedStyle(b.querySelector('aside.note')).display, js: document.documentElement.classList.contains('js') }; });
  check('no script: the book is readable on the page', r.display !== 'none' && r.sections === 25 && r.notesInline !== 'none' && !r.js, r);
  await browser.close();
}
// 2. with script: the book is out of the page, the journal and leaves are modal, focus comes back
{
  const browser = await chromium.launch({ executablePath: CHROME, args: ARGS });
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(URL, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  check('script: the book has left the page', await page.evaluate(() => !document.querySelector('#book') && document.querySelectorAll('[id="ch1"]').length === 0), {});
  await page.click('[data-read]');
  await page.waitForTimeout(300);
  const j = await page.evaluate(() => ({ hidden: document.querySelector('#journal').hidden, mainInert: document.querySelector('main').inert, role: document.querySelector('#journal').getAttribute('role') }));
  check('journal: open and modal', !j.hidden && j.mainInert === true && j.role === 'dialog', j);
  await page.click('[data-show="ch1"]'); await page.waitForTimeout(300); // 'or just read' opens every page
  const hasRef = await page.evaluate(() => !!document.querySelector('.journal-page a.ref'));
  if (hasRef) {
    await page.click('.journal-page a.ref'); await page.waitForTimeout(400);
    const l = await page.evaluate(() => ({ frameInert: document.querySelector('.journal-frame').inert, leaves: document.querySelectorAll('.leaf').length, modal: document.querySelector('.leaf')?.getAttribute('aria-modal'), focus: document.activeElement?.className }));
    check('leaf: open, the frame under it inert, focus on Close', l.frameInert === true && l.leaves === 1 && l.modal === 'true' && l.focus === 'leaf-close', l);
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    const l2 = await page.evaluate(() => ({ frameInert: document.querySelector('.journal-frame').inert, focus: document.activeElement?.className }));
    check('leaf closed: frame usable again, focus back on the reference', l2.frameInert === false && l2.focus === 'ref', l2);
  } else check('chapter I has a reference to try', false, {});
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  const c = await page.evaluate(() => ({ hidden: document.querySelector('#journal').hidden, mainInert: document.querySelector('main').inert, focus: document.activeElement?.getAttribute('data-read') !== null }));
  check('journal closed: main usable, focus back on "or just read"', c.hidden && c.mainInert === false && c.focus, c);
  // into the house: the arrows turn, Enter on a focused HUD button is the button's
  await page.evaluate(() => localStorage.setItem('atl:low', 'true'));
  await page.reload({ waitUntil: 'load' }); // 'or just read' unlocked every page for this visit; a fresh visit has locked lines
  await page.click('#enter');
  await page.waitForFunction(() => window.ATL && window.ATL.loaded(), null, { timeout: 180000 });
  await page.evaluate(() => { document.querySelector('[data-card]').hidden = true; ATL.look(0, 0); });
  // hold each key until a frame has taken it: under software rendering a frame can take longer than a second
  await page.keyboard.down('ArrowLeft'); await page.waitForFunction(() => ATL.P.yaw > .04, null, { timeout: 20000 }).catch(() => {}); await page.keyboard.up('ArrowLeft');
  await page.keyboard.down('PageUp'); await page.waitForFunction(() => ATL.P.pitch > .03, null, { timeout: 20000 }).catch(() => {}); await page.keyboard.up('PageUp');
  const t = await page.evaluate(() => ({ yaw: +ATL.P.yaw.toFixed(2), pitch: +ATL.P.pitch.toFixed(2) }));
  check('keyboard: the left arrow turns left, Page Up looks up', t.yaw > .05 && t.pitch > .03, t);
  await page.keyboard.press('KeyJ'); await page.waitForTimeout(400);
  const lk = await page.evaluate(() => ({ open: !document.querySelector('#journal').hidden, locked: document.querySelector('.journal-nav .locked .sr-only')?.textContent, dots: document.querySelector('.journal-nav .locked [aria-hidden]')?.textContent }));
  check('journal from the house: locked lines read as words', lk.open && lk.locked === 'Not found yet' && /·/.test(lk.dots || ''), lk);
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  await page.evaluate(() => { ATL.teleport(6.9, 3.4, 0); ATL.look(0, -.2); ATL.unlock('ch1', false); ATL.unlock('ch2', false); });
  await page.waitForTimeout(800);
  const target = await page.evaluate(() => ATL.target());
  await page.focus('[data-sound]');
  await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  const s = await page.evaluate(() => ({ sound: document.querySelector('[data-sound]').textContent, journalHidden: document.querySelector('#journal').hidden }));
  check('Enter on the Sound button toggles sound and does not pick anything up', s.sound === 'Sound off' && s.journalHidden, { ...s, target });
  check('no page errors', errors.length === 0, errors);
  await browser.close();
}
// 3. no WebGL: the threshold comes back with a sentence
{
  const browser = await chromium.launch({ executablePath: CHROME, args: [...ARGS, '--disable-3d-apis'] });
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'load' });
  await page.click('#enter');
  await page.waitForTimeout(6000);
  const w = await page.evaluate(() => ({ threshold: !document.querySelector('.threshold').hidden, game: document.querySelector('#game').hidden, note: document.querySelector('[data-visit-note]').textContent.slice(0, 60), btn: document.querySelector('#enter').textContent, inHouse: document.body.classList.contains('in-house') }));
  check('no WebGL: back on the threshold, told why', w.threshold && w.game && /will not open/.test(w.note) && w.btn === 'Open the door' && !w.inHouse, w);
  await browser.close();
}
console.log(fails ? `FAILED ${fails}` : 'ALL PASS');
process.exit(fails ? 1 : 0);
