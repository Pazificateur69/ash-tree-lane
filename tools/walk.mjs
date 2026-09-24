// Walks the whole story in headless Chromium: the house, Exploration A, Holloway's corridor and the Hall, the quarter, the stairs,
// the tear, the rescue and the house closing, the yard, the empty hallway, the last pages, and the journal at the end. Screenshots each scene.
// Run from the repository root with a static server on port 8123: node tools/walk.mjs (needs playwright-core; LOW=1 for software rendering; CHROME=... to pick a Chromium)
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const OUT = new URL('../.cache/shots/', import.meta.url).pathname; mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.addInitScript(low => { if (low) localStorage.setItem('atl:low', 'true'); }, !!process.env.LOW);
const errors = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('requestfailed', r => { if (!/fonts\.g/.test(r.url())) errors.push('requestfailed: ' + r.url()); });
let fails = 0;
const check = (name, ok, info) => { console.log(ok ? 'PASS' : 'FAIL', name, info === undefined ? '' : JSON.stringify(info)); if (!ok) fails++; };
await page.goto('http://127.0.0.1:8123/index.html?t=' + Date.now(), { waitUntil: 'load' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'load' });
await page.screenshot({ path: OUT + '00-threshold.png' });
await page.click('#enter');
await page.waitForFunction(() => window.ATL && window.ATL.loaded(), null, { timeout: 120000 });
await page.waitForFunction(() => window.ATL.models.loaded >= window.ATL.models.wanted, null, { timeout: 120000 });
await page.waitForTimeout(1800);
const ev = (fn, arg) => page.evaluate(fn, arg);
const shot = async (name, x, z, yaw, pitch = 0, wait = 900) => {
  await ev(([x, z, yaw, pitch]) => { ATL.teleport(x, z, yaw); ATL.look(yaw, pitch); }, [x, z, yaw, pitch]);
  await page.waitForTimeout(wait);
  await page.screenshot({ path: OUT + name + '.png' });
  console.log(name, 'target', await ev(() => ATL.target()));
};
// pick something up: stand where it can be seen, wait for the prompt, press E, read the page, close the journal
const take = async (id, x, z, yaw, pitch = -.3) => {
  await ev(([x, z, yaw, pitch]) => { ATL.teleport(x, z, yaw); ATL.look(yaw, pitch); }, [x, z, yaw, pitch]);
  try { await page.waitForFunction(id => ATL.target() === id, id, { timeout: 25000 }); } catch (e) { check('target ' + id, false, await ev(() => ({ target: ATL.target(), x: ATL.P.x.toFixed(2), z: ATL.P.z.toFixed(2), yaw: ATL.P.yaw.toFixed(2), camY: ATL.camY().toFixed(2), paused: ATL.paused(), near: ATL.near() }))); return false; }
  await ev(() => ATL.interact());
  await page.waitForTimeout(700);
  const opened = await ev(() => !document.querySelector('#journal').hidden);
  if (opened) { await page.click('[data-close]'); await page.waitForTimeout(500); }
  return true;
};
const W = Math.PI / 2, E = -Math.PI / 2;
await ev(() => document.querySelector('[data-card]').hidden = true);
await shot('01-foyer', 3, 12.1, 0);
await shot('02-living', 8.2, 11.5, -Math.PI / 2 + .4, .05);
await ev(() => { document.querySelector('.hud').style.visibility = 'hidden'; });
await page.screenshot({ path: OUT + 'og.png', clip: { x: 40, y: 45, width: 1200, height: 630 } });
await ev(() => { document.querySelector('.hud').style.visibility = ''; });
await shot('03-living-window', 10.8, 8.9, Math.PI + .3, .1);
await shot('04-kitchen', 4.8, 9.6, Math.PI / 2 + .5, -.1);
await shot('05-bedroom', 4.2, 3.2, Math.PI / 2 - .6, -.15);
await shot('06-kids', 9.2, 3.4, -Math.PI / 2 - .5, -.1);
// the house opens up to the hallway
await ev(() => { ATL.unlock('ch1', false); ATL.unlock('ch2', false); ATL.unlock('ch3', false); });
await page.waitForTimeout(600);
await shot('07-closet', 6.9, 3.4, 0, -.2);
await shot('08-hallway-door', 12.2, 8.5, -Math.PI / 2, 0);
check('Exploration A: a short corridor', await ev(() => ATL.G.phase === 'a' && ATL.G.L === 24), await ev(() => ({ phase: ATL.G.phase, L: ATL.G.L })));
await shot('09-corridor-a', 16, 8.6, E, 0);
// into the room at its end, facing away from the door: the corridor grows behind you
const endRoom = await ev(() => ({ x: ATL.G.x0 + (ATL.G.L + 2) * ATL.G.T, z: ATL.G.z0 + 77.5 * ATL.G.T }));
await ev(([x, z]) => { ATL.teleport(x, z, -Math.PI / 2); ATL.look(-Math.PI / 2, 0); }, [endRoom.x, endRoom.z]);
await page.waitForFunction(() => ATL.S.grewA, null, { timeout: 15000 }).catch(() => {});
const grew = await ev(() => ({ grewA: ATL.S.grewA, L: ATL.G.L, x: +ATL.P.x.toFixed(1) }));
check('Exploration A: the corridor is longer on the way back', grew.grewA && grew.L === 54 && grew.x > endRoom.x + 10, grew);
await ev(() => ATL.look(Math.PI / 2, 0)); await page.waitForFunction(() => !ATL.S.turnA, null, { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(400);
await page.screenshot({ path: OUT + '10-corridor-a-back.png' });
check('Exploration A: the subtitle', await ev(() => !ATL.S.turnA && /longer than it was/.test(document.querySelector('[data-sub]').textContent)));
const cam = await ev(() => ({ x: ATL.G.x0 + (ATL.G.L + 3.5) * ATL.G.T, z: ATL.G.z0 + 80.5 * ATL.G.T }));
check('Exploration A: the Hi8', await take('navidson_cam', cam.x - 1.2, cam.z - .3, ATL_YAW(cam.x - 1.2, cam.z - .3, cam.x, cam.z), -.35));
function ATL_YAW(x0, z0, x1, z1) { return Math.atan2(-(x1 - x0), -(z1 - z0)); }
check('Exploration A: read', await ev(() => ATL.found.has('explA') && ATL.S.regrow === 'long'), await ev(() => ({ regrow: ATL.S.regrow })));
// back in the house, the hallway becomes Holloway's
await ev(() => { ATL.teleport(12.2, 8.5, -Math.PI / 2); });
await page.waitForFunction(() => ATL.G.phase === 'long', null, { timeout: 15000 }).catch(() => {});
check('Holloway\'s corridor once you are home', await ev(() => ATL.G.phase === 'long' && ATL.G.L === 140 && ATL.S.regrow === null), await ev(() => ({ phase: ATL.G.phase, L: ATL.G.L })));
await shot('11-corridor', 20, 8.6, E, 0);
await shot('12-corridor-far', 43, 8.6, E, 0, 1200);
await ev(() => { ATL.teleport(56, 8.6, -Math.PI / 2); }); await page.waitForFunction(() => ATL.G.L === 180, null, { timeout: 15000 }).catch(() => {});
check('the corridor grows longer at the 40 m beat', await ev(() => ATL.G.L === 180 && ATL.G.hallStart === 184), await ev(() => ({ L: ATL.G.L, hallStart: ATL.G.hallStart })));
// a wall moves while you are not looking
const before = await ev(() => { const t = []; for (let i = 4; i < 100; i++) for (const r of [75, 79]) t.push(ATL.tileAt(i, r)); return t.join(''); });
await ev(() => { ATL.teleport(50, 8.6, -Math.PI / 2); ATL.look(-Math.PI / 2, 0); for (let k = 0; k < 6; k++) ATL.driftWalls(100); ATL.flushChunks(); });
const after = await ev(() => { const t = []; for (let i = 4; i < 100; i++) for (const r of [75, 79]) t.push(ATL.tileAt(i, r)); return t.join(''); });
check('walls move behind you', before !== after);
await shot('12b-corridor-tall', 55, 8.6, E, .25, 1200);
const G = await ev(() => ({ x: ATL.G.stair.x, z: ATL.G.stair.z, x0: ATL.G.x0, ante: ATL.G.ante, T: ATL.G.T }));
await shot('12c-anteroom', G.x0 + (G.ante[0] + 6) * G.T, 8.6, E, 0, 1200);
check('the anteroom is noticed', await ev(() => ATL.S.saidAnte));
await shot('13-hall', G.x - 26, G.z + 2, -Math.PI / 2 + .1, -.02, 1500);
await shot('13b-relay', G.x - 7.5, G.z + 1.5, -Math.PI / 2 + .05, -.15, 1200);
check('Tom\'s recorder', await take('tom', G.x - 4.1 - 1.3, G.z + .85, -Math.PI / 2));
await page.waitForTimeout(1200);
await page.screenshot({ path: OUT + '13c-relay-out.png' });
check('the map', await take('map', G.x - 4.8, G.z - 1.2, ATL_YAW(G.x - 4.8, G.z - 1.2, G.x - 4.8, G.z - 2.4)));
check('the quarter', await take('quarter', G.x - 3.1 - 1.7, G.z + 1.7, ATL_YAW(G.x - 4.8, G.z + 1.7, G.x - 3.7, G.z + 1.7)));
await page.waitForFunction(() => /falling for/.test(document.querySelector('[data-meter]').textContent), null, { timeout: 15000 }).catch(() => {});
check('the quarter falls', await ev(() => ATL.S.quarterAt > 0 && /falling for/.test(document.querySelector('[data-meter]').textContent)), await ev(() => document.querySelector('[data-meter]').textContent));
await shot('14-well', G.x - 4.2, G.z, -Math.PI / 2, -.35);
// onto the top step from the lip, then down the helix to the markers
await ev(([x, z]) => { ATL.teleport(x - 3.4, z + .2, ATL.yawTo(1, 0)); ATL.keys.add('f'); }, [G.x, G.z]);
await page.waitForFunction(() => ATL.stair.active, null, { timeout: 150000 });
await ev(() => { ATL.keys.delete('f'); ATL.stairTo(7.8); const a = Math.atan2(ATL.P.z - ATL.G.stair.z, ATL.P.x - ATL.G.stair.x); ATL.look(ATL.yawTo(-Math.sin(a), Math.cos(a)), -.35); });
await page.waitForTimeout(900);
await page.screenshot({ path: OUT + '15-stairs.png' });
console.log('stair', await ev(() => ({ active: ATL.stair.active, depth: ATL.stair.depth().toFixed(1), target: ATL.target() })));
await ev(() => { ATL.stairTo(22); const a = Math.atan2(ATL.P.z - ATL.G.stair.z, ATL.P.x - ATL.G.stair.x); ATL.look(ATL.yawTo(-Math.sin(a), Math.cos(a)), -.5); });
await page.waitForTimeout(600);
check('Jed\'s landing', await ev(() => ATL.target() === 'jed'), await ev(() => ATL.target()));
// read Holloway's tape (ch7): the way up stretches, then climbing out tears the house
await ev(() => { ATL.unlock('ch7', false); ATL.stairTo(10); ATL.stair.lastSkip = -100; const a = Math.atan2(ATL.P.z - ATL.G.stair.z, ATL.P.x - ATL.G.stair.x); ATL.look(ATL.yawTo(Math.sin(a), -Math.cos(a)), .2); ATL.keys.add('f'); }); // up the helix: the angle decreases
await page.waitForFunction(() => ATL.stair.stretched >= 1, null, { timeout: 30000 }).catch(() => {});
await ev(() => ATL.keys.delete('f'));
check('the staircase stretches under you', await ev(() => ATL.stair.stretched >= 1 && ATL.stair.depth() > 10.5), await ev(() => ({ stretched: ATL.stair.stretched, depth: ATL.stair.depth().toFixed(1) })));
await ev(() => { ATL.stairTo(0); ATL.look(ATL.yawTo(-1, 0), 0); ATL.keys.add('f'); });
await page.waitForFunction(() => !ATL.stair.active, null, { timeout: 60000 });
await ev(() => ATL.keys.delete('f'));
await page.waitForTimeout(600);
console.log('after stairs', await ev(() => ({ active: ATL.stair.active, torn: ATL.S.torn, phase: ATL.G.phase, x: ATL.P.x.toFixed(1) })));
check('the house tears and the corridor is short', await ev(() => ATL.S.torn && ATL.G.phase === 'short'));
await shot('16-torn-living', 8.2, 11.5, -Math.PI / 2 + .4, .05, 1200);
// the rescue: the rig at the lip; then the house closes around you
check('the rig', await take('rig', G.x + 3.7, G.z + 2.2, 0, -.3));
check('the collapse waits for you at home', await ev(() => ATL.S.collapsePending));
await ev(() => { ATL.teleport(12.2, 8.5, Math.PI / 2); ATL.look(Math.PI / 2, 0); });
await page.waitForFunction(() => ATL.S.collapseT > 0, null, { timeout: 20000 }).catch(() => {});
check('the house is closing', await ev(() => ATL.S.collapseT > 0 && ATL.S.doorOpen), await ev(() => ({ t: ATL.S.collapseT.toFixed(1), meter: document.querySelector('[data-meter]').textContent })));
await shot('17-collapse', 8.2, 11.5, -Math.PI / 2 + .4, .05, 1500);
check('the front door opens', await take('front_door', 2.5, 12.0, Math.PI, .05));
await ev(() => { ATL.teleport(2.5, 12.6, Math.PI); ATL.keys.add('f'); });
await page.waitForFunction(() => ATL.P.z > 13.6, null, { timeout: 40000 }).catch(() => {});
await ev(() => ATL.keys.delete('f'));
check('out through the front door', await ev(() => ATL.P.z > 13.6 && ATL.S.doorAjar), await ev(() => ({ z: ATL.P.z.toFixed(2) })));
await page.waitForFunction(() => ATL.S.collapsed, null, { timeout: 60000 }).catch(() => {});
check('the house stops', await ev(() => ATL.S.collapsed && ATL.S.collapseT < 0));
await shot('18-yard', 2.5, 17, 0, .1, 1500);
// what the house took, what some have thought: the radio and the tapes, then the empty hallway
await ev(() => { ATL.unlock('collapse', false); ATL.unlock('ch8', false); ATL.unlock('ch9', false); ATL.teleport(4, 2.5, 0); });
await page.waitForFunction(() => ATL.G.phase === 'empty', null, { timeout: 20000 }).catch(() => {});
check('the hallway is empty for Exploration #5', await ev(() => ATL.G.phase === 'empty' && ATL.S.regrow === null), await ev(() => ({ phase: ATL.G.phase })));
await shot('19-empty', 40, 8.6, E, .2, 1200);
const low = await ev(() => ({ x0: ATL.G.x0, low: ATL.G.low, T: ATL.G.T }));
await shot('20-bicycle', low.x0 + (low.low[0] - 6) * low.T, 8.6, E - .35, -.3, 1200);
await ev(([x]) => { ATL.teleport(x, 8.75, -Math.PI / 2); ATL.look(-Math.PI / 2, 0); }, [low.x0 + (low.low[0] + 8) * low.T]);
await page.waitForFunction(() => ATL.camY() < 1.2, null, { timeout: 20000 }).catch(() => {});
check('on your hands and knees in the crawlspace', await ev(() => ATL.camY() < 1.2 && ATL.target() !== 'bicycle'), await ev(() => ({ camY: ATL.camY().toFixed(2) })));
await page.screenshot({ path: OUT + '20b-crawl.png' });
await ev(() => { ATL.teleport(ATL.G.x0 + 74, 8.6, -Math.PI / 2); ATL.keys.add('f'); });
await page.waitForFunction(() => !document.querySelector('#dark').hidden, null, { timeout: 60000 });
await ev(() => ATL.keys.delete('f'));
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT + '21-last-pages.png' });
for (let i = 0; i < 9; i++) { const b = page.locator('[data-act="primary"]'); if (await b.isHidden()) break; await b.click(); await page.waitForTimeout(2400); }
await page.waitForTimeout(12000);
await page.screenshot({ path: OUT + '22-finale.png' });
await page.waitForFunction(() => document.querySelector('#dark').hidden, null, { timeout: 400000 }); // the finale runs on simulated time, slow under software rendering
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT + '23-vermont.png' });
const ended = await ev(() => ({ card: document.querySelector('[data-card]').textContent.slice(0, 40), journal: document.querySelector('[data-journal]').textContent }));
check('the ending', /Vermont/.test(ended.card), ended);
await page.click('[data-card] [data-journal]');
await page.waitForTimeout(600);
await page.screenshot({ path: OUT + '24-journal.png' });
await page.click('[data-show="index"]'); await page.waitForTimeout(400); await page.screenshot({ path: OUT + '25-index.png' });
await page.click('[data-show="collapse"]'); await page.waitForTimeout(400); await page.screenshot({ path: OUT + '26-collapse.png' });
console.log('found', await ev(() => [...ATL.found]));
console.log('errors', errors.length ? errors.join('\n') : 'none');
console.log(fails ? `FAILED ${fails}` : 'ALL PASS');
await browser.close();
process.exit(fails ? 1 : 0);
