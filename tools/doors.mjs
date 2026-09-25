// Doors and endings: the corridor door at x 14 can be walked both ways, the door in the hall wall opens on the living room,
// the torn house's short corridor leads home, a finished house still draws once its assets are in, and "Walk the house again" lands in a living house.
// Run from the repository root with a static server on port 8123: node tools/doors.mjs (needs playwright-core; CHROME=... to pick a Chromium)
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const OUT = new URL('../.cache/shots/', import.meta.url).pathname; mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
await page.addInitScript(() => localStorage.setItem('atl:low', 'true'));
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
page.on('requestfailed', r => errors.push('requestfailed: ' + r.url()));
let fails = 0;
const check = (name, ok, info) => { console.log(ok ? 'PASS' : 'FAIL', name, JSON.stringify(info)); if (!ok) fails++; };
await page.goto('http://127.0.0.1:8123/index.html?t=' + Date.now(), { waitUntil: 'load' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'load' });
await page.click('#enter');
await page.waitForFunction(() => window.ATL && window.ATL.loaded(), null, { timeout: 180000 });
await page.evaluate(() => { document.querySelector('[data-card]').hidden = true; ATL.unlock('ch1', false); ATL.unlock('ch2', false); ATL.unlock('ch3', false); });
await page.waitForTimeout(500);
// walk with a key held until the player passes a predicate or the time runs out
const walk = async (x, z, yaw, pred, ms) => {
  await page.evaluate(([x, z, yaw]) => { ATL.teleport(x, z, yaw); ATL.look(yaw, 0); ATL.keys.add('f'); }, [x, z, yaw]);
  let ok = false;
  try { await page.waitForFunction(pred, null, { timeout: ms }); ok = true; } catch (e) { ok = false; }
  await page.evaluate(() => ATL.keys.delete('f'));
  return { ok, ...(await page.evaluate(() => ({ x: +ATL.P.x.toFixed(2), z: +ATL.P.z.toFixed(2), region: ATL.P.region }))) };
};
const W = Math.PI / 2, E = -Math.PI / 2, N = 0, S = Math.PI; // yaw: forward is (-sin yaw, -cos yaw), so 0 walks toward smaller z (north on the plan) and PI toward larger z
check('corridor west into the house', ...(r => [r.ok, r])(await walk(15, 8.6, W, () => ATL.P.x < 13.7, 60000))); // through the doorway at x 14 and clear of it
check('house east into the corridor', ...(r => [r.ok, r])(await walk(13, 8.6, E, () => ATL.P.x > 14.5, 60000)));
check('hall door south past the sofa', ...(r => [r.ok, r])(await walk(9.5, 4.7, S, () => ATL.P.z > 6.2, 60000)));
check('hall door north from the living room', ...(r => [r.ok, r])(await walk(9.5, 6.8, N, () => ATL.P.z < 5.0, 60000)));
// every interior doorway, both ways, and the hallway plug: a metre clear, so the centre of the player has .4 m to play with
for (const [name, x, z, yaw, pred] of [
  ['bedroom door, in', 3, 4.65, N, () => ATL.P.z < 3.5], ['bedroom door, out', 3, 3.3, S, () => ATL.P.z > 4.5],
  ['children\'s door, in', 10.5, 4.65, N, () => ATL.P.z < 3.5], ['children\'s door, out', 10.5, 3.3, S, () => ATL.P.z > 4.5],
  ['kitchen door from the hall', 4.5, 4.65, S, () => ATL.P.z > 6], ['kitchen door to the hall', 4.5, 6.2, N, () => ATL.P.z < 4.9],
  ['kitchen to living room', 5.5, 7.5, E, () => ATL.P.x > 6.6], ['living room to kitchen', 6.6, 7.5, W, () => ATL.P.x < 5.5],
  ['foyer to living room', 5.5, 11.5, E, () => ATL.P.x > 6.6], ['living room to foyer', 6.6, 11.5, W, () => ATL.P.x < 5.5],
  ['foyer to kitchen', 2.5, 11, N, () => ATL.P.z < 10], ['kitchen to foyer', 2.5, 10, S, () => ATL.P.z > 11]
]) check(name, ...(r => [r.ok, r])(await walk(x, z, yaw, pred, 60000)));
await page.evaluate(() => ATL.unlock('ch7', false));
await page.waitForTimeout(800);
check('torn: short corridor home', ...(r => [r.ok && r.region === 'house', r])(await walk(15, 8.6, W, () => ATL.P.x < 13.7, 60000)));
// across the torn living room: north of the pit, down its west side, out through the foyer door
check('torn: living room, along the north band', ...(r => [r.ok, r])(await walk(13.4, 8.6, W, () => ATL.P.x < 7.5, 90000)));
check('torn: living room, down the west side', ...(r => [r.ok, r])(await walk(7.2, 8.6, S, () => ATL.P.z > 11.4, 60000)));
check('torn: living room, out through the foyer door', ...(r => [r.ok, r])(await walk(7.2, 11.5, W, () => ATL.P.x < 5.6, 60000)));
check('torn: living room, into the kitchen', ...(r => [r.ok, r])(await walk(7.2, 7.6, W, () => ATL.P.x < 5.5, 60000)));
// Exploration #5: the crawlspace can be crawled through
await page.evaluate(() => { for (const id of ['ch8', 'ch9']) ATL.unlock(id, false); ATL.teleport(3, 12, 0); });
await page.waitForFunction(() => ATL.G.phase === 'empty', null, { timeout: 20000 });
const low = await page.evaluate(() => ({ x0: ATL.G.x0, T: ATL.G.T, a: ATL.G.low[0], b: ATL.G.low[1] }));
check('crawlspace: in through its mouth', ...(r => [r.ok, r])(await walk(low.x0 + (low.a - 3) * low.T, 8.75, E, () => ATL.P.x > low.x0 + (low.a + 3) * low.T, 90000)));
check('crawlspace: out the far end', ...(r => [r.ok, r])(await walk(low.x0 + (low.b - 3) * low.T, 8.75, E, () => ATL.P.x > low.x0 + (low.b + 3) * low.T, 90000)));
check('torn: teleport into the house stays there', ...(r => [r.x < 13.5, r])(await (async () => { await page.evaluate(() => { ATL.teleport(13.4, 8.5, Math.PI / 2); }); await page.waitForTimeout(400); return page.evaluate(() => ({ x: +ATL.P.x.toFixed(2), region: ATL.P.region })); })()));
const lean = await page.evaluate(() => { let leaning = 0, stale = 0; for (const m of ATL.statics) { if (!m.rotation || (!m.rotation.z && !m.rotation.x)) continue; leaning++; const e = new (m.matrix.constructor)().compose(m.position, m.quaternion, m.scale); if (!m.matrix.equals(e)) stale++; } return { leaning, stale }; });
check('torn: leaning walls carry their lean into the bake', lean.stale === 0 && lean.leaning > 0, lean);
// a finished house, reopened
await page.evaluate(() => localStorage.setItem('atl:found', JSON.stringify(['edition', 'introduction', 'ch1', 'ch2', 'ch3', 'explA', 'karen', 'explorations', 'ch4', 'ch5', 'samples', 'ch6', 'tom', 'ch7', 'rescue', 'collapse', 'ch8', 'ch9', 'ch10', 'ch11', 'letters', 'exhibits', 'index', 'colophon'])));
await page.reload({ waitUntil: 'load' });
await page.click('#enter');
await page.waitForFunction(() => window.ATL && window.ATL.loaded(), null, { timeout: 180000 });
const f0 = await page.evaluate(() => ATL.renderer.info.render.frame);
await page.waitForTimeout(3500);
const f1 = await page.evaluate(() => ATL.renderer.info.render.frame);
const cardText = await page.evaluate(() => document.querySelector('[data-card]').textContent.trim().slice(0, 30));
check('finished house draws after its assets arrive', f1 > f0, { before: f0, after: f1 });
check('finished house shows the end card', /Vermont/.test(cardText), { cardText });
await page.evaluate(() => document.querySelector('[data-card]').hidden = true);
await page.waitForTimeout(300);
await page.screenshot({ path: OUT + 'ended.png' });
await page.evaluate(() => document.querySelector('[data-card]').hidden = false);
// Walk the house again: the reload must land in a living house
await page.click('[data-again]');
await page.waitForLoadState('load');
await page.click('#enter');
await page.waitForFunction(() => window.ATL && window.ATL.loaded(), null, { timeout: 180000 });
await page.waitForTimeout(1500);
const again = await page.evaluate(() => ({ card: document.querySelector('[data-card]').textContent.trim().slice(0, 20), rec: document.querySelector('[data-rec]').textContent, veil: document.querySelector('[data-veil]') ? document.querySelector('[data-veil]').hidden : null }));
check('walk the house again lands in a living house', /Ash Tree Lane/.test(again.card), again);
console.log('errors', errors.length ? errors.join('\n') : 'none');
console.log(fails ? `FAILED ${fails}` : 'ALL PASS');
await browser.close();
process.exit(fails ? 1 : 0);
