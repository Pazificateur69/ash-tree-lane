// Run from the repository root with a static server on port 8123: node tools/resume.mjs (needs playwright-core; CHROME=... to pick a Chromium)
// Loads the house with saved progress at several points of the story and checks that the frame loop runs and nothing throws.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const STATES = {
  fresh: ['edition', 'colophon'],
  closet: ['edition', 'colophon', 'ch1', 'ch2'],
  hallway: ['edition', 'colophon', 'ch1', 'ch2', 'ch3', 'karen', 'samples'],
  torn: ['edition', 'colophon', 'ch1', 'ch2', 'ch3', 'tom', 'ch7'],
  explore5: ['edition', 'colophon', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9'],
  ended: ['edition', 'colophon', 'ch1', 'ch2', 'ch3', 'ch7', 'ch8', 'ch9', 'ch10', 'ch11', 'letters', 'exhibits', 'index'],
};
let failed = 0;
for (const [name, found] of Object.entries(STATES)) {
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|CERT/.test(m.text())) errors.push(m.text().slice(0, 160)); });
  await page.addInitScript(f => { localStorage.setItem('atl:found', JSON.stringify(f)); localStorage.setItem('atl:low', 'true'); localStorage.setItem('atl:visits', '3'); }, found);
  await page.goto('http://127.0.0.1:8123/index.html?t=' + Date.now(), { waitUntil: 'load' });
  await page.click('#enter');
  let ok = false;
  try {
    await page.waitForFunction(() => window.ATL && window.ATL.loaded(), null, { timeout: 120000 });
    const ended = found.includes('ch11');
    if (!ended) await page.waitForFunction(() => document.querySelector('[data-rec]').textContent !== '00:00:00', null, { timeout: 60000 }).catch(() => {});
    else await page.waitForTimeout(1500);
    const rec = await page.evaluate(() => document.querySelector('[data-rec]').textContent);
    const state = await page.evaluate(() => ({ torn: ATL.S.torn, hallway: ATL.S.hallway, closet: ATL.S.closet, built: ATL.G.built, short: ATL.G.short, found: ATL.found.size }));
    ok = errors.length === 0 && (ended || rec !== '00:00:00') && state.closet === found.includes('ch2') && state.hallway === found.includes('ch3') && state.torn === found.includes('ch7');
    console.log((ok ? 'PASS' : 'FAIL').padEnd(5), name.padEnd(9), 'rec', rec, JSON.stringify(state), errors.length ? 'errors: ' + errors.join(' | ') : '');
  } catch (e) { console.log('FAIL', name, e.message.split('\n')[0], errors.join(' | ')); }
  if (!ok) failed++;
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
