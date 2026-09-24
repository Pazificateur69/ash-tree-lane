// Walks onto the staircase from the lip of the well, down the helix past the markers and the camera, and back out into the Hall.
// Run from the repository root with a static server on port 8123: node tools/stairs.mjs (needs playwright-core; CHROME=... to pick a Chromium)
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const OUT = new URL('../.cache/shots/', import.meta.url).pathname; mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', e => { errors.push('pageerror: ' + e.message); console.log('PAGEERROR', e.message); });
page.on('console', m => { if (m.type() === 'error' && !/fonts|CERT/.test(m.text())) errors.push(m.text().slice(0, 200)); });
await page.goto('http://127.0.0.1:8123/index.html?t=' + Date.now(), { waitUntil: 'load' });
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('atl:low', 'true'); }); // software rendering: no bloom, pixel ratio 1
await page.reload({ waitUntil: 'load' });
await page.click('#enter');
await page.waitForFunction(() => window.ATL && window.ATL.loaded(), null, { timeout: 120000 });
await page.evaluate(() => { document.querySelector('[data-card]').hidden = true; ATL.unlock('ch1', false); ATL.unlock('ch2', false); ATL.unlock('ch3', false); });
await page.waitForTimeout(800);
const G = await page.evaluate(() => ({ x: ATL.G.stair.x, z: ATL.G.stair.z }));
const shot = async (name, wait = 900) => { await page.waitForTimeout(wait); await page.screenshot({ path: OUT + name + '.png' }); console.log(name, await page.evaluate(() => ({ active: ATL.stair.active, u: ATL.stair.u.toFixed(2), depth: ATL.stair.depth().toFixed(2), x: ATL.P.x.toFixed(2), z: ATL.P.z.toFixed(2), target: ATL.target() }))); };
// from the lip, looking at the top step and down the well
await page.evaluate(([x, z]) => { ATL.teleport(x - 4.6, z + .2, ATL.yawTo(1, 0)); ATL.look(ATL.yawTo(1, 0), -.45); }, [G.x, G.z]);
await shot('s1-lip');
await page.evaluate(([x, z]) => { ATL.teleport(x - 4.2, z - 4.2, ATL.yawTo(1, 1)); ATL.look(ATL.yawTo(1, 1), -.5); }, [G.x, G.z]);
await shot('s0-well-from-side');
// walk onto the top step
await page.evaluate(([x, z]) => { ATL.teleport(x - 3.4, z + .2, ATL.yawTo(1, 0)); ATL.keys.add('f'); }, [G.x, G.z]);
await page.waitForFunction(() => ATL.stair.active, null, { timeout: 150000 });
await page.evaluate(() => ATL.keys.delete('f'));
await shot('s2-top-step');
// regression: from the lip, hold forward along the tangent and re-aim; you must go down, not be thrown back into the Hall
await page.evaluate(([x, z]) => { ATL.teleport(x - 3.6, z + .2, ATL.yawTo(1, 0)); ATL.keys.add('f'); }, [G.x, G.z]);
await page.waitForFunction(() => ATL.stair.active, null, { timeout: 150000 });
await page.evaluate(() => { window.__w0 = ATL.P.walked; window.__aim = () => { const a = Math.atan2(ATL.P.z - ATL.G.stair.z, ATL.P.x - ATL.G.stair.x); ATL.look(ATL.yawTo(-Math.sin(a), Math.cos(a)), -.3); if (ATL.P.walked - window.__w0 < 7) requestAnimationFrame(window.__aim); }; window.__aim(); });
await page.waitForFunction(() => ATL.P.walked - window.__w0 >= 7 || !ATL.stair.active, null, { timeout: 300000 });
await page.evaluate(() => ATL.keys.delete('f'));
const reg = await page.evaluate(() => ({ active: ATL.stair.active, depth: ATL.stair.depth().toFixed(2), walked: (ATL.P.walked - window.__w0).toFixed(1), r: Math.hypot(ATL.P.x - ATL.G.stair.x, ATL.P.z - ATL.G.stair.z).toFixed(2) }));
console.log('tangent-walk regression', reg, reg.active && +reg.depth > 1 ? 'PASS' : 'FAIL');
// a few steps down, looking along the descent
const along = () => page.evaluate(() => { const a = Math.atan2(ATL.P.z - ATL.G.stair.z, ATL.P.x - ATL.G.stair.x); ATL.look(ATL.yawTo(-Math.sin(a), Math.cos(a)), -.35); });
await page.evaluate(() => ATL.stairTo(2.4)); await along(); await shot('s3-descending');
await page.evaluate(() => ATL.stairTo(7.8)); await along(); await shot('s4-markers');
await page.evaluate(() => ATL.stairTo(12)); await page.evaluate(() => { const a = Math.atan2(ATL.P.z - ATL.G.stair.z, ATL.P.x - ATL.G.stair.x); ATL.look(ATL.yawTo(Math.sin(a), -Math.cos(a)), .6); }); await shot('s5-looking-up');
await page.evaluate(() => ATL.stairTo(30)); await along(); await shot('s6-camera');
// walk down for real: steer along the tangent each tick
await page.evaluate(() => ATL.stairTo(1)); await along();
await page.evaluate(() => ATL.keys.add('f'));
for (let i = 0; i < 30; i++) { await page.waitForTimeout(250); await along(); }
await page.evaluate(() => ATL.keys.delete('f'));
await shot('s7-walked-down');
// and back out at the top
await page.evaluate(() => { ATL.stairTo(0); ATL.look(ATL.yawTo(-1, 0), 0); ATL.keys.add('f'); });
await page.waitForFunction(() => !ATL.stair.active, null, { timeout: 60000 });
await page.evaluate(() => ATL.keys.delete('f'));
await shot('s8-back-in-hall');
console.log('errors', errors.length ? errors.join('\n') : 'none');
await browser.close();
