// Walks the house in headless Chromium: loads the page, opens the door, teleports through the story and screenshots each scene.
// Run from the repository root with a static server on port 8123 (python3 -m http.server 8123): node tools/walk.mjs
// Needs playwright-core; set CHROME to a Chromium binary, or leave it unset to use Playwright's own.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const OUT = new URL('../.cache/shots/', import.meta.url).pathname; mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('requestfailed', r => errors.push('requestfailed: ' + r.url()));
await page.goto('http://127.0.0.1:8123/index.html?t=' + Date.now(), { waitUntil: 'load' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'load' });
await page.screenshot({ path: OUT + '00-threshold.png' });
await page.click('#enter');
await page.waitForFunction(() => window.ATL && window.ATL.loaded(), null, { timeout: 120000 });
await page.waitForFunction(() => window.ATL.models.loaded >= window.ATL.models.wanted, null, { timeout: 120000 });
await page.waitForTimeout(1800);
const shot = async (name, x, z, yaw, pitch = 0, wait = 900) => {
  await page.evaluate(([x, z, yaw, pitch]) => { ATL.teleport(x, z, yaw); ATL.look(yaw, pitch); }, [x, z, yaw, pitch]);
  await page.waitForTimeout(wait);
  await page.screenshot({ path: OUT + name + '.png' });
  const fps = await page.evaluate(() => ATL.fps());
  console.log(name, 'fps', fps, 'target', await page.evaluate(() => ATL.target()));
};
await page.evaluate(() => document.querySelector('[data-card]').hidden = true);
await shot('01-foyer', 3, 12.1, 0);
await shot('02-living', 8.2, 11.5, -Math.PI / 2 + .4, .05);
await page.evaluate(() => { document.querySelector('.hud').style.visibility = 'hidden'; });
await page.screenshot({ path: OUT + 'og.png', clip: { x: 40, y: 45, width: 1200, height: 630 } });
await page.evaluate(() => { document.querySelector('.hud').style.visibility = ''; });
await shot('03-living-window', 10.8, 8.9, Math.PI + .3, .1);
await shot('04-kitchen', 4.8, 9.6, Math.PI / 2 + .5, -.1);
await shot('05-bedroom', 4.2, 3.2, Math.PI / 2 - .6, -.15);
await shot('06-kids', 9.2, 3.4, -Math.PI / 2 - .5, -.1);
// open everything up to the hallway
await page.evaluate(() => { ATL.unlock('ch1', false); ATL.unlock('ch2', false); ATL.unlock('ch3', false); });
await page.waitForTimeout(600);
await shot('07-closet', 6.9, 3.4, 0, -.2);
await shot('08-hallway-door', 12.2, 8.5, -Math.PI / 2, 0);
await shot('09-corridor', 20, 8.6, -Math.PI / 2, 0);
await shot('10-corridor-far', 43, 8.6, -Math.PI / 2, 0, 1200);
const G = await page.evaluate(() => ({ x: ATL.G.stair.x, z: ATL.G.stair.z }));
await shot('11-hall', G.x - 26, G.z + 2, -Math.PI / 2 + .1, -.02, 1500);
await shot('11b-relay', G.x - 7.5, G.z + 1.5, -Math.PI / 2 + .05, -.15, 1200);
// pick up Tom's recorder: the journal opens on his chapter, and when it closes the lantern goes out
await page.evaluate(([x, z]) => { ATL.teleport(x - 4.1 - 1.3, z + .85, -Math.PI / 2); ATL.look(-Math.PI / 2, -.3); }, [G.x, G.z]);
await page.waitForFunction(() => ATL.target() === 'tom', null, { timeout: 15000 });
await page.evaluate(() => ATL.interact());
await page.waitForTimeout(800);
await page.screenshot({ path: OUT + '11c-journal-tom.png' });
await page.click('[data-close]');
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT + '11d-relay-out.png' });
console.log('tom found', await page.evaluate(() => ATL.found.has('tom')));
await shot('12-well', G.x - 4.2, G.z, -Math.PI / 2, -.35);
// down the stairs
await page.evaluate(([x, z]) => { ATL.teleport(x - 2.4, z, -Math.PI / 2); }, [G.x, G.z]);
await page.waitForTimeout(400);
await page.evaluate(() => ATL.keys.add('f'));
await page.waitForFunction(() => ATL.stair.active && ATL.stair.depth() > 1.2, null, { timeout: 90000 });
await page.evaluate(() => ATL.keys.delete('f'));
await page.waitForTimeout(500);
await page.screenshot({ path: OUT + '13-stairs.png' });
console.log('stair', await page.evaluate(() => ({ active: ATL.stair.active, depth: ATL.stair.depth().toFixed(1), target: ATL.target() })));
// tear the house
await page.evaluate(() => { ATL.unlock('ch7', false); });
await page.evaluate(() => { ATL.stair.s = 0.4; ATL.keys.add('b'); });
await page.waitForFunction(() => !ATL.stair.active, null, { timeout: 90000 });
await page.evaluate(() => ATL.keys.delete('b'));
await page.waitForTimeout(600);
console.log('after stairs', await page.evaluate(() => ({ active: ATL.stair.active, torn: ATL.S.torn, x: ATL.P.x.toFixed(1) })));
await shot('14-torn-living', 8.2, 11.5, -Math.PI / 2 + .4, .05, 1200);
await shot('15-torn-tv', 9.5, 10.8, Math.PI - .3, 0);
await page.evaluate(() => { ATL.unlock('ch8', false); ATL.unlock('ch9', false); });
await page.waitForTimeout(300);
await page.evaluate(() => { ATL.teleport(15.6, 8.6, -Math.PI / 2); });
await page.waitForFunction(() => !document.querySelector('#dark').hidden, null, { timeout: 10000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT + '16-last-pages.png' });
for (let i = 0; i < 9; i++) { const b = page.locator('[data-act="primary"]'); if (await b.isHidden()) break; await b.click(); await page.waitForTimeout(2400); }
await page.waitForTimeout(12000);
await page.screenshot({ path: OUT + '17-finale.png' });
await page.waitForFunction(() => document.querySelector('#dark').hidden, null, { timeout: 400000 }); // the finale runs on simulated time, slow under software rendering
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT + '18-vermont.png' });
console.log('ended', await page.evaluate(() => ({ card: document.querySelector('[data-card]').textContent.slice(0, 40), journal: document.querySelector('[data-journal]').textContent })));
await page.click('[data-card] [data-journal]');
await page.waitForTimeout(600);
await page.screenshot({ path: OUT + '19-journal.png' });
await page.click('[data-show="index"]'); await page.waitForTimeout(400); await page.screenshot({ path: OUT + '20-index.png' });
await page.click('[data-show="tom"]'); await page.waitForTimeout(400); await page.screenshot({ path: OUT + '21-tom.png' });
console.log('found', await page.evaluate(() => [...ATL.found]));
console.log('errors', errors.length ? errors.join('\n') : 'none');
await browser.close();
