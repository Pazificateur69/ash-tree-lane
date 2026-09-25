/* Ash Tree Lane: the house. One classic script, no build step. three.js and its addons are vendored under /vendor and
   imported when the door opens; the textures, models and sky live under /assets. */
(async () => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const FT = 3.2808;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SET = Object.assign({ sens: 1, fov: 70, sub: 'm', calm: false, fps: false, vol: .9 }, (() => { try { return JSON.parse(localStorage.getItem('atl:settings') || '{}') || {}; } catch (e) { return {}; } })());
  const saveSet = () => { try { localStorage.setItem('atl:settings', JSON.stringify(SET)); } catch (e) { /* private mode */ } };
  const touch = matchMedia('(pointer: coarse)').matches;

  const store = {
    get(k, d) { try { const v = localStorage.getItem('atl:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('atl:' + k, JSON.stringify(v)); } catch (e) { /* private mode: nothing is kept */ } }
  };
  const visits = (Number.isFinite(store.get('visits', 0)) ? store.get('visits', 0) : 0) + 1;
  store.set('visits', visits);
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const rng = seed => () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* ---------- the two coloured words ---------- */

  const WORDS = /\b(houses?|maisons?|haus|casa)\b|\b(minotaurs?)\b/gi;
  const HAS_WORD = new RegExp(WORDS.source, 'i');
  function mark(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentElement;
        if (!p || p.closest('script, style, .house, .minotaur, [data-plain]')) return NodeFilter.FILTER_REJECT;
        return HAS_WORD.test(n.data) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      const s = n.data, frag = document.createDocumentFragment();
      let last = 0;
      WORDS.lastIndex = 0;
      for (const m of s.matchAll(WORDS)) {
        frag.append(s.slice(last, m.index));
        const span = document.createElement('span');
        span.className = m[1] ? 'house' : 'minotaur';
        span.textContent = m[0];
        frag.append(span);
        last = m.index + m[0].length;
      }
      frag.append(s.slice(last));
      n.replaceWith(frag);
    }
  }
  const setText = (el, text) => { el.textContent = text; mark(el); };
  mark($('.threshold'));

  /* ---------- threshold measurements ---------- */

  const growth = (() => {
    const n = 4 + (visits - 1);
    let r = n % 16, d = 16;
    while (r && r % 2 === 0) { r /= 2; d /= 2; }
    return { whole: Math.floor(n / 16), frac: r ? `${r}⁄${d}` : '' };
  })();
  const inside = px => `${fmt(px + growth.whole)}${growth.frac ? ' ' + growth.frac : ''} px`;
  function measure() {
    const out = $('[data-outside]'), inn = $('[data-inside]');
    if (out && inn) { out.textContent = fmt(innerHeight) + ' px'; inn.textContent = inside(innerHeight); }
  }
  measure();
  if (visits > 1) {
    const vn = $('[data-visit-note]');
    if (vn) { vn.hidden = false; vn.textContent = `On your first visit the difference was a quarter of a pixel. This is visit ${visits}.`; }
  }

  /* ================================================================
     The journal: what you bring out of the house
     ================================================================ */

  const BOOK = $('#book'); BOOK.remove(); // the book is in the page for readers without script; with script it is read from here
  const ORDER = ['edition', 'introduction', 'ch1', 'ch2', 'ch3', 'explA', 'karen', 'explorations', 'ch4', 'ch5', 'samples', 'ch6', 'tom', 'ch7', 'rescue', 'collapse', 'ch8', 'ch9', 'ch10', 'ch11', 'explSix', 'letters', 'exhibits', 'well', 'index', 'colophon'];
  const FREE = ['edition', 'colophon'];
  const TITLES = Object.fromEntries(ORDER.map(id => [id, BOOK.querySelector('#' + id).dataset.title]));
  const savedFound = store.get('found', FREE);
  const found = new Set(Array.isArray(savedFound) ? savedFound.filter(id => ORDER.includes(id)) : FREE); // whatever was stored, the script must still run
  let readAll = false;
  const journal = $('#journal'), jPage = $('[data-page]', journal), jContents = $('[data-contents]', journal), jCount = $('[data-count]', journal);
  const has = id => readAll || found.has(id);
  const foundCount = () => [...found].filter(id => !FREE.includes(id)).length;

  function renderContents() {
    jContents.innerHTML = '';
    let n = 0;
    for (const id of ORDER) {
      const li = document.createElement('li');
      if (has(id)) {
        if (!FREE.includes(id)) n++;
        const b = document.createElement('button');
        b.type = 'button'; b.dataset.show = id; b.textContent = TITLES[id];
        if (id === jPage.dataset.id) b.setAttribute('aria-current', 'page');
        mark(b);
        li.append(b);
      } else {
        li.className = 'locked';
        li.innerHTML = '<span class="sr-only">Not found yet</span><span aria-hidden="true">· · · · ·</span>';
      }
      jContents.append(li);
    }
    const total = ORDER.length - FREE.length;
    jCount.textContent = `${Math.min(n, total)} of ${total} found`;
    if (matchMedia('(max-width: 760px)').matches) jContents.querySelector('[aria-current]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }
  // Exploration #6: the reader's own numbers, and Johnny, who read them
  function fillSix(root) {
    const st = ATL.stats(), n = x => Math.round(x).toLocaleString('en-US'), jumps = store.get('jumped', 0), stills = store.get('stills', []);
    const setv = (k, v) => { const e = root.querySelector(`[data-six-${k}]`); if (e) e.textContent = v; };
    const hms = s => { s = Math.floor(s); const p = x => String(x).padStart(2, '0'); return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`; };
    setv('deep', st.deep > 0 ? `${n(st.deep)} ft` : 'DNE'); setv('line', st.line > 0 ? `${n(st.line)} ft` : 'DNE'); setv('dark', st.dark > 0 ? hms(st.dark) : 'DNE');
    setv('quarters', st.quarters || 'none'); setv('jumps', jumps || 'none'); setv('turned', st.turned || 'never'); setv('stills', Array.isArray(stills) ? stills.length || 'none' : 'none'); setv('visits', visits);
    const lines = [];
    if (jumps > 0) lines.push(jumps > 1 ? `You jumped. ${jumps} times. I read that and put the book face down on the table for a while.` : 'You jumped, huh. I knew somebody would. I just thought it would be me.');
    else lines.push('You never jumped. Smart. I would have. I think about it every time I go down the stairs in this building.');
    if (st.turned > 0) lines.push('You turned round when the corridor would not end. I didn’t, the first time. I kept walking and it kept being the same ten feet, and I only stopped because my legs did.');
    if (st.quarters > 0) lines.push(`You dropped ${st.quarters > 1 ? st.quarters + ' quarters' : 'a quarter'}. Nobody has ever heard one land. I have started listening for them at night. I know how that sounds.`);
    if (st.deep > 150) lines.push(`${n(st.deep)} feet. Holloway would have wanted to know how you did it, and then he would have wanted to go farther.`);
    lines.push('Whatever you took out of there, keep it somewhere with a light on.');
    const jd = root.querySelector('[data-six-johnny]'); if (jd) jd.innerHTML = lines.map(l => `<p>${l.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c])}</p>`).join('') + '<p class="signature">J.T.</p>';
    const film = root.querySelector('[data-six-film]'), strip = root.querySelector('[data-six-strip]');
    if (film && strip && Array.isArray(stills) && stills.length) { film.hidden = false; strip.innerHTML = ''; stills.forEach((s2, i) => { const f = document.createElement('div'); const im = document.createElement('img'); im.src = s2.url; im.alt = `Still ${i + 1}, at ${s2.rec}`; const c = document.createElement('span'); c.textContent = `${i + 1} · ${s2.rec}`; f.append(im, c); strip.append(f); }); }
  }
  function showPage(id) {
    const src = BOOK.querySelector('#' + id);
    jPage.innerHTML = '';
    const clone = src.cloneNode(true);
    jPage.append(clone);
    if (id === 'explSix' && window.ATL && ATL.stats) fillSix(clone);
    const vdoor = $('[data-visitdoor]', jPage); if (vdoor) vdoor.textContent = store.get('endings', 0) > 0 ? `visit ${visits}` : 'DNE';
    const jumped = $('[data-jumped]', jPage); if (jumped) { const n = store.get('jumped', 0); jumped.textContent = n ? `${n} (you, in this browser)` : 'DNE (so far)'; }
    jPage.dataset.id = id;
    const back = document.createElement('button');
    back.type = 'button'; back.className = 'journal-continue'; back.dataset.close = '';
    back.textContent = game.started && !game.ended ? 'Back to the house' : 'Close the journal';
    jPage.append(back);
    mark(jPage);
    const co = $('[data-chapter-out]', jPage), ci = $('[data-chapter-in]', jPage);
    if (co && ci) { const h = clone.offsetHeight; co.textContent = fmt(h) + ' px'; ci.textContent = inside(h); }
    $$('a.ref', jPage).forEach(a => {
      const n = jPage.querySelector(a.hash);
      if (!n) return;
      a.dataset.voice = n.dataset.voice;
      a.setAttribute('aria-label', `Note ${n.dataset.num}, ${VOICE[n.dataset.voice]}`);
      a.setAttribute('aria-haspopup', 'dialog');
    });
    renderContents();
    jPage.scrollTop = 0;
    jPage.focus({ preventScroll: true });
  }
  function openJournal(id) {
    Sound.play('page', { gain: .45, room: false, detune: .1 });
    journal.opener = document.activeElement;
    journal.hidden = false;
    $('main').inert = true;
    document.body.classList.add('journal-open');
    game.pause();
    showPage(id || ORDER.find(has));
  }
  function closeJournal() {
    Sound.play('page', { gain: .35, room: false, rate: 1.1, detune: .1 });
    closeAllLeaves();
    journal.hidden = true;
    $('main').inert = false;
    document.body.classList.remove('journal-open');
    const id = jPage.dataset.id;
    const o = journal.opener;
    const back = o && o !== document.body && o.isConnected && !o.closest('[hidden]') ? o : game.started ? hud.journal : $('[data-read]');
    back?.focus({ preventScroll: true });
    game.resume();
    if (id && pendingAfterRead.has(id)) { const fn = pendingAfterRead.get(id); pendingAfterRead.delete(id); fn(); }
  }
  const pendingAfterRead = new Map();
  let AFTER_READ = {}; // filled once the house exists
  function unlock(id, open = true) {
    const fresh = !found.has(id);
    found.add(id);
    store.set('found', [...found]);
    if (fresh && AFTER_READ[id]) pendingAfterRead.set(id, AFTER_READ[id]);
    if (open) openJournal(id); else if (fresh && AFTER_READ[id]) { pendingAfterRead.delete(id); AFTER_READ[id](); }
    syncJournalButton();
    return fresh;
  }

  /* notes as leaves of paper */
  const VOICE = { zampano: 'Zampanò', johnny: 'Johnny Truant', editors: 'The Editors', pelafina: 'Pelafina' };
  const leaves = $('#leaves');
  const opened = [];
  function openLeaf(ref) {
    const src = jPage.querySelector(ref.hash);
    if (!src) return;
    const i = opened.length;
    const leaf = document.createElement('section');
    leaf.className = 'leaf';
    leaf.dataset.voice = src.dataset.voice;
    leaf.setAttribute('role', 'dialog'); leaf.setAttribute('aria-modal', 'true');
    leaf.setAttribute('aria-label', `Note ${src.dataset.num}, ${VOICE[src.dataset.voice]}`);
    leaf.style.setProperty('--i', i);
    leaf.style.setProperty('--tilt', ((((i * 5 + +src.dataset.num * 3) % 7) - 3) * .32).toFixed(2) + 'deg');
    const head = document.createElement('header');
    head.className = 'leaf-head';
    head.innerHTML = '<span class="leaf-num"></span><span class="sr-only">, </span><span class="leaf-voice"></span><button class="leaf-close" type="button">Close</button>';
    head.querySelector('.leaf-num').textContent = src.dataset.num;
    head.querySelector('.leaf-voice').textContent = VOICE[src.dataset.voice];
    const body = src.cloneNode(true);
    body.removeAttribute('id');
    body.className = 'leaf-body';
    body.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
    leaf.append(head, body);
    leaves.append(leaf);
    leaves.classList.add('open');
    for (const o of opened) o.leaf.inert = true; // only the top leaf can be read
    $('.journal-frame').inert = true;
    opened.push({ leaf, ref });
    requestAnimationFrame(() => requestAnimationFrame(() => leaf.classList.add('in')));
    head.querySelector('.leaf-close').focus({ preventScroll: true });
  }
  function closeLeaf(restore = true) {
    const o = opened.pop();
    if (!o) return;
    o.leaf.classList.remove('in');
    setTimeout(() => o.leaf.remove(), 450);
    if (!opened.length) { leaves.classList.remove('open'); $('.journal-frame').inert = false; }
    else opened[opened.length - 1].leaf.inert = false;
    if (restore && o.ref.isConnected) o.ref.focus({ preventScroll: true });
  }
  const closeAllLeaves = () => { while (opened.length) closeLeaf(opened.length === 1); };

  /* Pelafina's cipher */
  $$('[data-cipher]', BOOK).forEach(p => {
    p.innerHTML = p.textContent.replace(/[A-Za-z]+/g, w => `<span class="ini">${w[0]}</span><span class="rest">${w.slice(1)}</span>`);
  });
  const GROUPS = [3, 2, 7, 3];
  function decode(btn) {
    const c = $('[data-cipher]', jPage), out = $('[data-decoded]', jPage);
    const on = c.classList.toggle('decoding');
    const letters = $$('.ini', c).map(s => s.textContent.toLowerCase()).join('');
    let k = 0;
    out.textContent = on ? GROUPS.map(n => letters.slice(k, (k += n))).join(' ') : '';
    out.hidden = !on;
    btn.textContent = on ? 'Read the whole words' : 'Read the first letters';
  }

  /* torn text in chapter XV, prepared once in the book */
  $$('.torn p', BOOK).forEach((p, pi) => {
    const rand = rng(97 + pi * 13);
    const words = p.textContent.trim().split(/\s+/);
    p.textContent = '';
    for (let i = 0; i < words.length;) {
      const n = 2 + Math.floor(rand() * 4);
      const s = document.createElement('span');
      s.className = 'shard';
      s.textContent = words.slice(i, i + n).join(' ');
      s.style.setProperty('--dx', ((rand() - .5) * 22).toFixed(1) + 'px');
      s.style.setProperty('--dy', ((rand() - .3) * 15).toFixed(1) + 'px');
      s.style.setProperty('--r', ((rand() - .5) * 7).toFixed(2) + 'deg');
      if (rand() < .1) s.style.setProperty('--fade', '.2');
      p.append(s, ' ');
      i += n;
    }
  });

  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-show]')) { showPage(t.closest('[data-show]').dataset.show); return; }
    if (t.closest('[data-close]')) { closeJournal(); return; }
    const ref = t.closest('a.ref');
    if (ref) { e.preventDefault(); openLeaf(ref); return; }
    if (t.closest('.leaf-close')) { closeLeaf(); return; }
    if (opened.length && t.closest('.leaf a[href^="#"]')) { closeAllLeaves(); return; }
    if (opened.length && !t.closest('.leaf')) { closeAllLeaves(); return; }
    const turn = t.closest('[data-turn]');
    if (turn) {
      const el = jPage.querySelector('#' + turn.dataset.turn);
      const cls = turn.dataset.turn === 'inventory' ? 'flipped' : 'turned';
      const on = el.classList.toggle(cls);
      turn.textContent = on ? 'Turn it back' : (cls === 'flipped' ? 'Turn the leaf' : 'Turn the book');
      return;
    }
    if (t.closest('[data-decode]')) { decode(t.closest('[data-decode]')); return; }
    if (t.closest('[data-read]')) { readAll = true; openJournal('edition'); return; }
    if (t.closest('[data-journal]')) { openJournal(jPage.dataset.id); return; }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (opened.length) { e.preventDefault(); closeLeaf(); }
      else if (!journal.hidden) { e.preventDefault(); closeJournal(); }
      else if (hud.settings && !hud.settings.hidden) { e.preventDefault(); closeSettings(); }
      else if (!hud.card.hidden && hud.card.onclick) { e.preventDefault(); hud.card.onclick(); }
    }
  });

  /* ================================================================
     Sound: synthesized in the browser, with a room around it
     ================================================================ */

  const Sound = {
    ctx: null, out: null, bus: null, send: null, buf: null, drone: null, wind: null, night: null, timbers: null,
    bufs: {}, loading: false,
    on: store.get('sound', true),
    FILES: { wind: 'wind', night: 'night', timbers: 'timbers', door_close: 'door_close', door_open: 'door_open', page: 'page', creak_1: 'creak_1', creak_2: 'creak_2', creak_3: 'creak_3',
      step_wood_0: 'step_wood_0', step_wood_1: 'step_wood_1', step_wood_2: 'step_wood_2', step_wood_3: 'step_wood_3', step_wood_4: 'step_wood_4',
      step_stone_0: 'step_stone_0', step_stone_1: 'step_stone_1', step_stone_2: 'step_stone_2', step_stone_3: 'step_stone_3', step_stone_4: 'step_stone_4' },
    load() { // the recordings, all of them CC0: footsteps, creaks, doors, a page, the wind, a summer night, old timbers
      if (this.loading || !this.ctx) return; this.loading = true;
      for (const [key, file] of Object.entries(this.FILES)) fetch(`assets/sounds/${file}.ogg`).then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status)).then(b => this.ctx.decodeAudioData(b)).then(buf => { this.bufs[key] = buf; }).catch(() => {});
    },
    play(key, { gain = 1, rate = 1, room = true, at = 0, detune = 0 } = {}) {
      const buf = this.bufs[key]; if (!buf || !this.ctx) return false;
      const c = this.ctx, s = c.createBufferSource(), g = c.createGain();
      s.buffer = buf; s.playbackRate.value = rate * (1 + detune * (Math.random() * 2 - 1)); g.gain.value = gain;
      s.connect(g).connect(room ? this.bus : this.out); s.start(c.currentTime + at);
      return true;
    },
    loop(key, level, fade = 3) {
      const buf = this.bufs[key]; if (!buf || !this.ctx) return null;
      const c = this.ctx, s = c.createBufferSource(), g = c.createGain(), t = c.currentTime;
      s.buffer = buf; s.loop = true; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + fade);
      s.connect(g).connect(this.out); s.start(t, Math.random() * buf.duration);
      return { src: s, g };
    },
    stopLoop(l, fade = 2) { if (!l) return; const t = this.ctx.currentTime; l.g.gain.cancelScheduledValues(t); l.g.gain.setTargetAtTime(0, t, fade / 3); l.src.stop(t + fade * 2); },
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const c = this.ctx = new AC();
      this.out = c.createGain();
      this.out.gain.value = this.on ? SET.vol : 0;
      this.out.connect(c.destination);
      // everything goes to the bus; the bus goes straight out, and through a long gray room
      this.bus = c.createGain(); this.bus.connect(this.out);
      const ir = c.createBuffer(2, c.sampleRate * 3.2, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < d.length; i++) { const t = i / c.sampleRate; d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 2.1) * (t < .02 ? t / .02 : 1); } }
      const conv = c.createConvolver(); conv.buffer = ir;
      this.send = c.createGain(); this.send.gain.value = 0;
      this.bus.connect(this.send).connect(conv).connect(this.out);
      const len = c.sampleRate * 4, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
      this.buf = buf;
    },
    room(amount) { if (this.send) this.send.gain.setTargetAtTime(amount, this.ctx.currentTime, 1.2); },
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    noise() { const s = this.ctx.createBufferSource(); s.buffer = this.buf; s.loop = true; s.playbackRate.value = .8 + Math.random() * .4; return s; },
    ambience(on, level = .16) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      if (on && !this.drone) {
        const src = this.noise(), lp = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
        lp.type = 'lowpass'; lp.frequency.value = 210;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + 4);
        src.connect(lp).connect(g).connect(this.out);
        src.start();
        this.drone = { src, g };
      } else if (on && this.drone) {
        this.drone.g.gain.setTargetAtTime(level, t, 2);
      } else if (!on && this.drone) {
        const { src, g } = this.drone;
        g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, .6);
        src.stop(t + 3);
        this.drone = null;
      }
    },
    weather(on) { // wind against the house and a summer night outside, only while the house is a house
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      if (on && !this.wind && this.bufs.wind) { this.wind = this.loop('wind', .32, 5); this.wind.real = true; this.night = this.loop('night', .16, 6); return; }
      if (!on && this.wind && this.wind.real) { this.stopLoop(this.wind, 3); this.stopLoop(this.night, 3); this.wind = null; this.night = null; return; }
      if (on && this.wind && this.wind.real) { if (!this.night && this.bufs.night) this.night = this.loop('night', .16, 6); return; }
      if (on && !this.wind) {
        const src = this.noise(), bp = this.ctx.createBiquadFilter(), g = this.ctx.createGain(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
        bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = .6;
        lfo.frequency.value = .07; lg.gain.value = 260; lfo.connect(lg).connect(bp.frequency);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + 6);
        src.connect(bp).connect(g).connect(this.out); src.start(); lfo.start();
        this.wind = { src, g, lfo };
      } else if (!on && this.wind) {
        const { src, g, lfo } = this.wind;
        g.gain.setTargetAtTime(0, t, 1.5); src.stop(t + 6); lfo.stop(t + 6); this.wind = null;
      }
    },
    groan(on) { // the old timbers of a house that has moved
      if (!this.ctx) return;
      if (on && !this.timbers && this.bufs.timbers) this.timbers = this.loop('timbers', .22, 6);
      else if (!on && this.timbers) { this.stopLoop(this.timbers, 3); this.timbers = null; }
    },
    growl(level = 1, sweep = null) {
      if (!this.ctx) return;
      const c = this.ctx, t = c.currentTime;
      if (sweep == null) sweep = [(Math.random() * 2 - 1), (Math.random() * 2 - 1)]; // it comes from somewhere, and it moves
      const src = this.noise(), lp = c.createBiquadFilter(), g = c.createGain();
      lp.type = 'lowpass'; lp.Q.value = 7;
      lp.frequency.setValueAtTime(60, t); lp.frequency.linearRampToValueAtTime(140, t + 1.4); lp.frequency.linearRampToValueAtTime(55, t + 4.5);
      const o = c.createOscillator(), olp = c.createBiquadFilter(), og = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(31, t); o.frequency.linearRampToValueAtTime(38, t + 1.6); o.frequency.linearRampToValueAtTime(27, t + 4.5);
      olp.type = 'lowpass'; olp.frequency.value = 90; og.gain.value = .35;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.9 * level, t + 1.2); g.gain.setTargetAtTime(0, t + 2.2, .9);
      src.connect(lp).connect(g);
      o.connect(olp).connect(og).connect(g);
      if (c.createPanner && this.L) { // it moves round you, in the space around your head
        const [ax, ay, az] = this.around(sweep[0] * Math.PI), [bx, by, bz] = this.around(sweep[1] * Math.PI), pn = this.at(ax, ay, az, 6);
        if (pn.positionX) { pn.positionX.setValueAtTime(ax, t); pn.positionZ.setValueAtTime(az, t); pn.positionX.linearRampToValueAtTime(bx, t + 4.5); pn.positionZ.linearRampToValueAtTime(bz, t + 4.5); }
        g.connect(pn).connect(this.bus);
      } else if (c.createStereoPanner) { const pn = c.createStereoPanner(); pn.pan.setValueAtTime(sweep[0], t); pn.pan.linearRampToValueAtTime(sweep[1], t + 4.5); g.connect(pn).connect(this.bus); } else g.connect(this.bus);
      src.start(t); o.start(t); src.stop(t + 7); o.stop(t + 7);
    },
    step(hard, echo) {
      if (!this.ctx) return;
      if (this.play((hard ? 'step_stone_' : 'step_wood_') + Math.floor(Math.random() * 5), { gain: hard ? .55 : .38, rate: hard ? .92 : 1, detune: .08 })) return;
      const c = this.ctx, t = c.currentTime;
      const burst = (at, gain) => {
        const s = this.noise(), f = c.createBiquadFilter(), g = c.createGain();
        f.type = hard ? 'bandpass' : 'lowpass'; f.frequency.value = (hard ? 900 : 380) * (.9 + Math.random() * .2); f.Q.value = hard ? 1.2 : .7;
        g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(gain, at + .008); g.gain.setTargetAtTime(0, at + .02, hard ? .05 : .03);
        s.connect(f).connect(g).connect(this.bus);
        s.start(at); s.stop(at + .5);
      };
      burst(t, hard ? .22 : .12);
      if (echo) { burst(t + .33, .09); burst(t + .71, .045); }
    },
    creak() {
      if (!this.ctx) return;
      if (this.play('creak_' + (1 + Math.floor(Math.random() * 3)), { gain: .7, rate: .85, detune: .1 })) return;
      const c = this.ctx, t = c.currentTime;
      const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(48, t + 2.2);
      l.frequency.value = 9; lg.gain.value = 6; l.connect(lg).connect(o.frequency);
      f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = 4;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + .4); g.gain.setTargetAtTime(0, t + 1.8, .4);
      o.connect(f).connect(g).connect(this.bus);
      o.start(t); l.start(t); o.stop(t + 3.5); l.stop(t + 3.5);
    },
    knock() { // something in the walls, twice
      if (!this.ctx) return;
      const c = this.ctx, t = c.currentTime;
      for (const at of [t, t + .42]) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(140, at); o.frequency.exponentialRampToValueAtTime(48, at + .18);
        g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(.5, at + .006); g.gain.setTargetAtTime(0, at + .03, .09);
        o.connect(g).connect(this.bus); o.start(at); o.stop(at + .8);
      }
    },
    coin() { // a quarter dropped down the well: it rings on a step, and again, fainter, and again, and never lands
      if (!this.ctx) return;
      const c = this.ctx; let at = c.currentTime + .25, gap = .35, level = .5;
      for (let k = 0; k < 18; k++) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.value = 3100 + (k % 3) * 380 - k * 25;
        g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(level, at + .004); g.gain.setTargetAtTime(0, at + .02, .06 + k * .012);
        o.connect(g).connect(this.bus); o.start(at); o.stop(at + 1.5);
        at += gap; gap *= 1.22; level *= .84;
      }
    },
    L: null,
    listen(x, y, z, yaw) { // the ears go where the camera goes
      if (!this.ctx) return;
      const l = this.ctx.listener, fx = -Math.sin(yaw), fz = -Math.cos(yaw), t = this.ctx.currentTime;
      if (l.positionX) { l.positionX.setTargetAtTime(x, t, .03); l.positionY.setTargetAtTime(y, t, .03); l.positionZ.setTargetAtTime(z, t, .03); l.forwardX.setTargetAtTime(fx, t, .03); l.forwardY.setTargetAtTime(0, t, .03); l.forwardZ.setTargetAtTime(fz, t, .03); l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0; }
      else if (l.setPosition) { l.setPosition(x, y, z); l.setOrientation(fx, 0, fz, 0, 1, 0); }
      this.L = { x, y, z, yaw };
    },
    at(x, y, z, ref = 2) { // a point in the house that a sound comes from
      const p = this.ctx.createPanner(); p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = ref; p.rolloffFactor = .9; p.maxDistance = 200;
      if (p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; } else p.setPosition(x, y, z);
      return p;
    },
    around(ang, r = 12) { // a point at an angle round the listener: 0 ahead, PI behind
      const L = this.L || { x: 0, y: 1.6, z: 0, yaw: 0 }, a = L.yaw + ang;
      return [L.x - Math.sin(a) * r, L.y, L.z - Math.cos(a) * r];
    },
    // a voice you can hear but not make out: a buzz through moving vowel formants, syllable by syllable, then the tape it was recorded on
    voice({ pitch = 120, dur = 3, pan = 0, far = 0, radio = false, level = .5, at = 0, pos = null } = {}) {
      if (!this.ctx) return;
      const c = this.ctx, t0 = c.currentTime + .05 + at;
      const VOW = [[730, 1090, 2440], [530, 1840, 2480], [270, 2290, 3010], [570, 840, 2410], [300, 870, 2240], [660, 1720, 2410], [490, 1350, 1690]];
      const o = c.createOscillator(); o.type = 'sawtooth';
      const wow = c.createOscillator(), wowG = c.createGain(); wow.frequency.value = .7 + Math.random() * .6; wowG.gain.value = radio ? 6 : 14; wow.connect(wowG).connect(o.detune); // the tape is not quite steady
      const env = c.createGain(); env.gain.value = 0;
      const mix = c.createGain(); mix.gain.value = 1;
      const fs = [0, 1, 2].map(k => { const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = k === 0 ? 7 : 11; const g = c.createGain(); g.gain.value = [1, .55, .22][k]; o.connect(f).connect(g).connect(env); return f; });
      const hp = c.createBiquadFilter(), lp = c.createBiquadFilter(), sh = c.createWaveShaper(), pn = pos && c.createPanner ? this.at(pos[0], pos[1], pos[2], 3) : c.createStereoPanner ? c.createStereoPanner() : null, out = c.createGain();
      hp.type = 'highpass'; hp.frequency.value = radio ? 480 : 220; lp.type = 'lowpass'; lp.frequency.value = (radio ? 2600 : 3600) * (1 - far * .6);
      const curve = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * (radio ? 4 : 2)); } sh.curve = curve;
      out.gain.value = level * (1 - far * .75);
      env.connect(hp).connect(sh).connect(lp);
      let tail = lp; if (pn) { if (pn.pan) pn.pan.value = clamp(pan, -1, 1); tail.connect(pn); tail = pn; }
      tail.connect(out); out.connect(far > .3 ? this.bus : this.out); if (far > .3) out.connect(this.send);
      let t = t0, p = pitch * (.95 + Math.random() * .1);
      o.frequency.setValueAtTime(p, t);
      while (t < t0 + dur) {
        if (Math.random() < .14) { t += .12 + Math.random() * .25; continue; } // a breath between words
        const len = .09 + Math.random() * .2, v = VOW[Math.floor(Math.random() * VOW.length)];
        p = clamp(p * (1 + (Math.random() - .5) * .18), pitch * .75, pitch * 1.35);
        o.frequency.linearRampToValueAtTime(p, t + len * .6);
        fs.forEach((f, k) => f.frequency.linearRampToValueAtTime(v[k] * (.94 + Math.random() * .12) * (pitch > 180 ? 1.15 : 1), t + len * .5));
        env.gain.setTargetAtTime(.9, t, .012); env.gain.setTargetAtTime(.0, t + len * .85, .03);
        t += len;
      }
      o.frequency.linearRampToValueAtTime(p * .85, t + .2); // the sentence falls at the end
      o.start(t0); wow.start(t0); o.stop(t + .6); wow.stop(t + .6);
      // the tape hiss or the radio's static under it
      const n = this.noise(), nf = c.createBiquadFilter(), ng = c.createGain();
      nf.type = radio ? 'bandpass' : 'highpass'; nf.frequency.value = radio ? 1800 : 3000; nf.Q.value = .8;
      ng.gain.setValueAtTime(0, t0 - .05); ng.gain.linearRampToValueAtTime((radio ? .09 : .035) * (1 - far * .7), t0 + .1); ng.gain.setTargetAtTime(0, t + .1, .15);
      n.connect(nf).connect(ng); (pn ? ng.connect(pn) : ng.connect(out)); n.start(t0 - .05); n.stop(t + 1);
      if (radio) for (let k = 0; k < 3; k++) { const at2 = t0 + Math.random() * dur; ng.gain.setValueAtTime(.3 * (1 - far * .7), at2); ng.gain.setTargetAtTime(.09 * (1 - far * .7), at2 + .05, .05); } // squelch
    },
    grind(on) { // stone on stone: a wall that is moving
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      if (on && !this.grinding) {
        const src = this.noise(), bp = this.ctx.createBiquadFilter(), g = this.ctx.createGain(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
        bp.type = 'bandpass'; bp.frequency.value = 140; bp.Q.value = 1.4; lfo.frequency.value = 7; lg.gain.value = .12;
        lfo.connect(lg).connect(g.gain); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.45, t + .6);
        src.connect(bp).connect(g).connect(this.bus); src.start(); lfo.start();
        this.grinding = { src, g, lfo };
      } else if (!on && this.grinding) {
        const { src, g, lfo } = this.grinding; g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, .3); src.stop(t + 2); lfo.stop(t + 2); this.grinding = null;
      }
    },
    swell(dur = 4) { // the house letting go: everything at once, then nothing
      if (!this.ctx) return;
      const c = this.ctx, t = c.currentTime, n = this.noise(), f = c.createBiquadFilter(), g = c.createGain();
      f.type = 'lowpass'; f.frequency.setValueAtTime(120, t); f.frequency.exponentialRampToValueAtTime(5000, t + dur * .8);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.7, t + dur * .8); g.gain.linearRampToValueAtTime(0, t + dur);
      n.connect(f).connect(g).connect(this.bus); n.start(t); n.stop(t + dur + .2);
    },
    tapeZip(dur = 1.1) { // a steel tape running out of its case
      if (!this.ctx) return;
      const c = this.ctx, t = c.currentTime, n = this.noise(), f = c.createBiquadFilter(), g = c.createGain();
      f.type = 'bandpass'; f.Q.value = 3; f.frequency.setValueAtTime(2200, t); f.frequency.linearRampToValueAtTime(3400, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.18, t + .05); g.gain.setValueAtTime(.18, t + dur - .08); g.gain.linearRampToValueAtTime(0, t + dur);
      n.connect(f).connect(g).connect(this.bus); n.start(t); n.stop(t + dur + .1);
    },
    hush(sec = 3) { // everything stops for a moment
      if (!this.ctx) return;
      const t = this.ctx.currentTime, lv = this.on ? SET.vol : 0;
      this.out.gain.cancelScheduledValues(t); this.out.gain.setTargetAtTime(.03 * lv, t, .08); this.out.gain.setTargetAtTime(lv, t + sec, .8);
    },
    pant(on) { // short breaths, close: someone afraid of the dark, walking into it
      if (!this.ctx) return;
      const c = this.ctx, t = c.currentTime;
      if (on && !this.panting) {
        const n = this.noise(), f = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
        f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = .8; lfo.frequency.value = 1.15; lg.gain.value = .05; g.gain.value = .05;
        lfo.connect(lg).connect(g.gain); n.connect(f).connect(g).connect(this.out); n.start(t); lfo.start(t);
        this.panting = { n, lfo, g };
      } else if (!on && this.panting) { const { n, lfo, g } = this.panting; g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, .4); n.stop(t + 2); lfo.stop(t + 2); this.panting = null; }
    },
    breathBehind() { // someone breathing, close, behind you; it stops the moment you look
      if (!this.ctx) return null;
      const c = this.ctx, t = c.currentTime, n = this.noise(), f = c.createBiquadFilter(), lp = c.createBiquadFilter(), g = c.createGain();
      f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = .9; lp.type = 'lowpass'; lp.frequency.value = 1600; // muffled: it is behind you
      g.gain.value = 0;
      for (let k = 0; k < 5; k++) { const a = t + .4 + k * 1.7; g.gain.setTargetAtTime(.22, a, .25); g.gain.setTargetAtTime(.02, a + .7, .18); g.gain.setTargetAtTime(.14, a + .95, .3); g.gain.setTargetAtTime(0, a + 1.45, .15); }
      let dst = this.out; if (c.createPanner && this.L) { const [x, y, z] = this.around(Math.PI, 1.1); const pn = this.at(x, y, z, .6); pn.connect(this.out); dst = pn; } // right behind your head
      n.connect(f).connect(lp).connect(g).connect(dst); n.start(t); n.stop(t + 10);
      return { stop: () => { const t2 = c.currentTime; g.gain.cancelScheduledValues(t2); g.gain.setValueAtTime(0, t2); try { n.stop(t2 + .05); } catch (e) { /* already stopped */ } } };
    },
    click() {
      if (!this.ctx) return;
      const c = this.ctx, t = c.currentTime, s = this.noise(), f = c.createBiquadFilter(), g = c.createGain();
      f.type = 'highpass'; f.frequency.value = 2400;
      g.gain.setValueAtTime(.25, t); g.gain.setTargetAtTime(0, t + .01, .012);
      s.connect(f).connect(g).connect(this.out); s.start(t); s.stop(t + .2);
    },
    crackle(dur) {
      if (!this.ctx) return;
      const c = this.ctx, t = c.currentTime;
      const src = this.noise(), hp = c.createBiquadFilter(), g = c.createGain();
      hp.type = 'highpass'; hp.frequency.value = 1800;
      g.gain.setValueAtTime(0, t);
      const times = Array.from({ length: 70 }, () => Math.random() * dur).sort((a, b) => a - b);
      for (const at of times) { g.gain.setValueAtTime(Math.random() * .45, t + at); g.gain.setTargetAtTime(0, t + at + .004, .012); }
      src.connect(hp).connect(g).connect(this.out);
      src.start(t); src.stop(t + dur + .4);
      const w = this.noise(), bp = c.createBiquadFilter(), wg = c.createGain();
      bp.type = 'bandpass'; bp.frequency.value = 520;
      wg.gain.setValueAtTime(0, t); wg.gain.linearRampToValueAtTime(.28, t + .5); wg.gain.setTargetAtTime(0, t + dur * .7, .35);
      w.connect(bp).connect(wg).connect(this.out);
      w.start(t); w.stop(t + dur + 2);
    },
    toggle() {
      this.on = !this.on;
      store.set('sound', this.on);
      this.volume();
    },
    volume() { if (this.out) this.out.gain.setTargetAtTime(this.on ? SET.vol : 0, this.ctx.currentTime, .08); }
  };
  document.addEventListener('visibilitychange', () => {
    if (!Sound.ctx) return;
    if (document.hidden) Sound.ctx.suspend(); else if (game.started) Sound.ctx.resume();
  });

  /* ================================================================
     HUD
     ================================================================ */

  const hud = {
    sub: $('[data-sub]'), prompt: $('[data-prompt]'), meter: $('[data-meter]'), rec: $('[data-rec]'),
    journal: $('[data-journal]'), sound: $('[data-sound]'), quality: $('[data-quality]'), veil: $('[data-veil]'), card: $('[data-card]'),
    loading: $('[data-loading]'), loadBar: $('[data-load-bar]'), loadText: $('[data-load-text]'), stick: $('[data-stick]'), settings: $('[data-settings]'), setBtn: $('[data-settings-btn]'), fps: $('[data-fps]'), fall: $('[data-fall]'), watch: $('[data-watch]'), flash: $('[data-flash]'), still: $('[data-still]')
  };
  let subTimer = 0;
  // subtitles wait their turn: a line is on screen long enough to read before the next one replaces it
  const subQueue = []; let subShownAt = 0, subMin = 0;
  const subLook = { mode: () => '' }; // the house sets how its words are laid out: sparser the deeper you go, as the book's pages do
  function showSub(text, ms, style) {
    clearTimeout(subTimer);
    let mode = style || subLook.mode(); if (mode === 'column' && text.split(' ').length > 14) mode = 'sparse';
    hud.sub.dataset.mode = mode;
    if (mode === 'sparse' || mode === 'column') { // one word at a time, drifting apart
      hud.sub.textContent = '';
      text.split(' ').forEach((w, i, all) => { const sp = document.createElement('span'); sp.className = 'w'; sp.textContent = w; if (mode === 'sparse') sp.style.transform = `translateY(${((Math.sin(i * 12.9898 + text.length) * 43758.5) % 1) * .7}em)`; hud.sub.append(sp); if (i < all.length - 1) hud.sub.append(' '); });
      mark(hud.sub);
    } else setText(hud.sub, text);
    hud.sub.classList.add('in');
    subShownAt = performance.now(); subMin = Math.min(ms, 1200 + text.length * 45);
    subTimer = setTimeout(() => { hud.sub.classList.remove('in'); if (subQueue.length) setTimeout(nextSub, 350); }, ms);
  }
  function nextSub() { const n = subQueue.shift(); if (n) showSub(n[0], n[1], n[2]); }
  function say(text, ms = 5200, now = false, style) { // now: what the house just did, said as it happens; style: how the words sit on the screen
    if (subQueue.some(q => q[0] === text) || (hud.sub.textContent === text && hud.sub.classList.contains('in'))) return; // the same line twice says nothing new
    const shown = performance.now() - subShownAt;
    if (now) { subQueue.length = 0; showSub(text, ms, style); return; }
    if (subQueue.length) { subQueue.push([text, ms, style]); if (subQueue.length > 3) subQueue.shift(); return; } // wait your turn
    if (hud.sub.classList.contains('in') && shown < subMin) { // the current line has not been read yet
      subQueue.push([text, ms, style]); if (subQueue.length > 3) subQueue.shift();
      clearTimeout(subTimer); subTimer = setTimeout(() => { hud.sub.classList.remove('in'); setTimeout(nextSub, 350); }, subMin - shown);
      return;
    }
    subQueue.length = 0; showSub(text, ms, style);
  }
  function card(html, ms) {
    hud.card.innerHTML = html;
    mark(hud.card);
    hud.card.hidden = false;
    requestAnimationFrame(() => hud.card.classList.add('in'));
    const off = () => { hud.card.classList.remove('in'); setTimeout(() => { hud.card.hidden = true; }, 1200); };
    if (ms) { setTimeout(off, ms); hud.card.onclick = off; } else hud.card.onclick = null;
  }
  const syncSound = () => { hud.sound.textContent = Sound.on ? 'Sound on' : 'Sound off'; hud.sound.setAttribute('aria-pressed', String(Sound.on)); };
  hud.sound.addEventListener('click', () => { Sound.init(); Sound.resume(); Sound.toggle(); syncSound(); });
  syncSound();
  const syncJournalButton = () => { hud.journal.textContent = `Journal · ${foundCount()}`; };
  syncJournalButton();
  const savedLow = store.get('low', null);
  const Q = { low: typeof savedLow === 'boolean' ? savedLow : touch };
  // settings: sensitivity, field of view, subtitle size, calm mode, invert, frame rate, volume
  function applySettings() {
    document.body.dataset.subsize = SET.sub; hud.fps.hidden = !SET.fps;
    if (Sound.ctx) Sound.volume();
  }
  function openSettings() {
    const p = hud.settings; if (!p) return;
    p.querySelector('[name=sens]').value = SET.sens; p.querySelector('[name=fov]').value = SET.fov; p.querySelector('[name=vol]').value = SET.vol;
    p.querySelector('[name=sub]').value = SET.sub; p.querySelector('[name=calm]').checked = SET.calm; p.querySelector('[name=fps]').checked = SET.fps; p.querySelector('[name=invert]').checked = store.get('invert', false);
    p.hidden = false; game.pause(); p.querySelector('[name=sens]').focus({ preventScroll: true });
  }
  function closeSettings() { hud.settings.hidden = true; hud.setBtn.focus({ preventScroll: true }); game.resume(); }
  if (hud.settings) {
    hud.settings.addEventListener('input', e => {
      const el = e.target, k = el.name;
      if (k === 'sens' || k === 'fov' || k === 'vol') SET[k] = +el.value; else if (k === 'sub') SET.sub = el.value; else if (k === 'calm' || k === 'fps') SET[k] = el.checked; else if (k === 'invert') store.set('invert', el.checked);
      saveSet(); applySettings();
    });
    hud.settings.querySelector('[data-settings-close]').addEventListener('click', closeSettings);
    hud.setBtn.addEventListener('click', openSettings);
  }
  applySettings();
  const syncQuality = () => { hud.quality.textContent = Q.low ? 'Detail: low' : 'Detail: high'; };
  syncQuality();

  /* ================================================================
     The game
     ================================================================ */

  const game = { started: false, paused: false, ended: false, world: null };
  game.pause = () => { game.paused = true; if (document.pointerLockElement) document.exitPointerLock(); };
  game.resume = () => { game.paused = false; if (game.started && !game.ended && !touch && !document.pointerLockElement) { hud.veil.hidden = false; } };

  $('#enter').addEventListener('click', start);

  async function start() {
    if (game.started) return;
    Sound.init(); Sound.resume(); Sound.load();
    const btn = $('#enter');
    btn.disabled = true; btn.textContent = 'Opening';
    let libs;
    try {
      libs = await Promise.all([
        import('three'),
        import('three/addons/postprocessing/EffectComposer.js'),
        import('three/addons/postprocessing/RenderPass.js'),
        import('three/addons/postprocessing/ShaderPass.js'),
        import('three/addons/postprocessing/UnrealBloomPass.js'),
        import('three/addons/postprocessing/OutputPass.js'),
        import('three/addons/loaders/GLTFLoader.js'),
        import('three/addons/loaders/RGBELoader.js'),
        import('three/addons/utils/BufferGeometryUtils.js'),
        import('three/addons/libs/meshopt_decoder.module.js')
      ]);
    } catch (e) {
      console.error(e);
      btn.disabled = false; btn.textContent = 'Open the door';
      const vn = $('[data-visit-note]');
      if (vn) { vn.hidden = false; vn.textContent = 'The door will not open: the 3D library could not be loaded. You can still read the journal.'; }
      return;
    }
    game.started = true;
    $('.threshold').hidden = true;
    $('#game').hidden = false;
    document.body.classList.add('in-house');
    const [THREE, { EffectComposer }, { RenderPass }, { ShaderPass }, { UnrealBloomPass }, { OutputPass }, { GLTFLoader }, { RGBELoader }, { mergeGeometries }, { MeshoptDecoder }] = libs;
    try { buildWorld({ THREE, EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, OutputPass, GLTFLoader, RGBELoader, mergeGeometries, MeshoptDecoder }); }
    catch (e) {
      console.error(e);
      $('#game').hidden = true; $('.threshold').hidden = false; document.body.classList.remove('in-house'); game.started = false;
      btn.disabled = false; btn.textContent = 'Open the door';
      const vn = $('[data-visit-note]');
      if (vn) { vn.hidden = false; vn.textContent = 'The door will not open: ' + String(e && e.message || e).replace(/\.+$/, '') + '. You can still read the journal.'; }
    }
  }

  const HALL_BEATS = [
    [3, 'The doorway is behind you. Its light is the last warm thing you will see for a while.'],
    [9, 'Ash-gray walls. No switch, no socket, no seam.'],
    [16, 'It is cold the way a cellar is cold, with no season in it.'],
    [22, 'The line runs on ahead of you, farther than a spool should go.'],
    [30, 'Your light goes forward and does not arrive anywhere.'],
    [40, 'You have walked farther than the house is wide.', 'longer'],
    [48, 'Something, very far off, shifts its weight.', 'growl'],
    [58, 'The line on the spool is thinner than it was.'],
    [66, 'The dark ahead is the same as the dark behind.'],
    [74, 'A light, far off, at the level of the floor. Someone left it burning, and it has not moved for days.']
  ];
  const EMPTY_BEATS = [ // Exploration #5: the hallway with nothing in it
    [2, 'He rode in on a bicycle, with food and water for weeks.'],
    [12, 'No rooms. No line. Nothing to tie one to.'],
    [26, 'The walls are farther apart than they were.'],
    [36, 'The ceiling is gone. The walls go up, and the light does not follow them.'],
    [50, 'Nothing has been this far. Not Holloway. Not the line.'],
    [54, 'The passage narrows. It goes on on its hands and knees, and so will you.'],
    [64, 'The floor is thinner than it looks.'],
    [70, 'Ahead of you, nothing. Under you, less.']
  ];
  const STAIR_BEATS = [
    [1, 'They counted the steps. Then they stopped counting.'],
    [4, 'Drop something and listen. You will not hear it land.'],
    [9, 'Holloway wanted to go down. Jed and Wax wanted to go home.'],
    [14, 'The growl comes from below. Or from the walls. Or from you.', 'growl'],
    [19, 'Somewhere above you, Tom is keeping the radio alive.'],
    [24, 'There is always another turn.'],
    [28, 'If there is a bottom, it is not for you.']
  ];

  function buildWorld({ THREE, EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, OutputPass, GLTFLoader, RGBELoader, mergeGeometries, MeshoptDecoder }) {
    const canvas = $('.game-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    let prCap = Q.low ? 1 : 1.25; // lowered automatically when frames come slowly
    const dpr = () => Math.min(devicePixelRatio || 1, prCap);
    renderer.setPixelRatio(dpr());
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .86;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020203);
    scene.fog = new THREE.FogExp2(0x070608, 0.05);
    const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 62); // the fog has eaten everything long before this
    camera.rotation.order = 'YXZ';

    /* ---------- assets ---------- */

    const manager = new THREE.LoadingManager();
    let loadDone = false;
    manager.onProgress = (url, n, total) => { if (loadDone) return; const p = Math.round(n / total * 100); hud.loadBar.style.width = p + '%'; hud.loadText.textContent = `The house is loading · ${p}%`; };
    const texLoader = new THREE.TextureLoader(manager);
    THREE.Cache.enabled = true; // one download per file
    const texCache = new Map(), lateTex = [];
    const LOWTEX = new Set(['ash_color.jpg', 'ash_normal.jpg', 'ash_rough.jpg', 'brick_bump.jpg', 'brick_diffuse.jpg', 'brick_roughness.jpg', 'ground_color.jpg', 'leather_color.jpg', 'leather_normal.jpg', 'leather_rough.jpg', 'linen_color.jpg', 'linen_normal.jpg', 'linen_rough.jpg', 'mahogany_color.jpg', 'mahogany_normal.jpg', 'mahogany_rough.jpg', 'plaster_color.jpg', 'plaster_normal.jpg', 'plaster_rough.jpg', 'woodfloor_ao.jpg', 'woodfloor_color.jpg', 'woodfloor_normal.jpg', 'woodfloor_rough.jpg']); // half size copies, for phones and the low setting
    const T = (name, { srgb = false, repeat = [1, 1], aniso = 4 } = {}) => { // one texture per file and tiling; the same one is reused wherever it recurs
      const key = `${name}|${repeat[0]}|${repeat[1]}|${aniso}`;
      let t = texCache.get(key);
      if (t) return t;
      const url = 'assets/textures/' + (Q.low && LOWTEX.has(name) ? 'low/' : '') + name;
      if (name.startsWith('ash_')) { t = new THREE.Texture(); lateTex.push([t, url]); } // the ash is only seen beyond the house: it can arrive after the door opens
      else t = texLoader.load(url);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.anisotropy = Math.min(aniso, maxAniso);
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      texCache.set(key, t);
      return t;
    };
    // the night: a photographed sky for the windows, and its HDR twin for the light on everything that shines
    const sky = texLoader.load('assets/sky/night.jpg'); sky.colorSpace = THREE.SRGBColorSpace; sky.anisotropy = 2; sky.wrapS = THREE.RepeatWrapping;
    const skyHDR = new RGBELoader(manager).load('assets/sky/night_1k.hdr');

    const M = {
      floor: new THREE.MeshStandardMaterial({ color: new THREE.Color(1.22, 1.18, 1.12), map: T('woodfloor_color.jpg', { srgb: true, repeat: [5.2, 4.8], aniso: 8 }), normalMap: T('woodfloor_normal.jpg', { repeat: [5.2, 4.8], aniso: 8 }), normalScale: new THREE.Vector2(.8, .8), roughnessMap: T('woodfloor_rough.jpg', { repeat: [5.2, 4.8] }), aoMap: T('woodfloor_ao.jpg', { repeat: [5.2, 4.8] }), aoMapIntensity: .9, roughness: 1, metalness: 0 }),
      wall: new THREE.MeshStandardMaterial({ map: T('plaster_color.jpg', { srgb: true }), normalMap: T('plaster_normal.jpg'), normalScale: new THREE.Vector2(.6, .6), roughnessMap: T('plaster_rough.jpg'), roughness: 1 }),
      ceiling: new THREE.MeshStandardMaterial({ color: 0xf2eee6, map: T('plaster_color.jpg', { srgb: true, repeat: [6, 6] }), normalMap: T('plaster_normal.jpg', { repeat: [6, 6] }), normalScale: new THREE.Vector2(.4, .4), roughness: 1 }),
      pale: new THREE.MeshStandardMaterial({ color: 0xfffdf6, map: T('plaster_color.jpg', { srgb: true, repeat: [.5, .5] }), roughness: 1 }),
      ash: new THREE.MeshStandardMaterial({ map: T('ash_color.jpg', { srgb: true }), normalMap: T('ash_normal.jpg'), normalScale: new THREE.Vector2(.5, .5), roughnessMap: T('ash_rough.jpg'), roughness: 1 }),
      ashFloor: new THREE.MeshStandardMaterial({ color: 0x9a9a9e, map: T('ash_color.jpg', { srgb: true, repeat: [40, 24] }), normalMap: T('ash_normal.jpg', { repeat: [40, 24] }), normalScale: new THREE.Vector2(.35, .35), roughness: 1 }),
      wood: new THREE.MeshStandardMaterial({ map: T('mahogany_color.jpg', { srgb: true }), normalMap: T('mahogany_normal.jpg'), normalScale: new THREE.Vector2(.6, .6), roughnessMap: T('mahogany_rough.jpg'), roughness: 1 }),
      linen: new THREE.MeshStandardMaterial({ map: T('linen_color.jpg', { srgb: true }), normalMap: T('linen_normal.jpg'), normalScale: new THREE.Vector2(.7, .7), roughnessMap: T('linen_rough.jpg'), roughness: 1 }),
      cardboard: new THREE.MeshStandardMaterial({ map: T('cardboard_color.jpg', { srgb: true }), normalMap: T('cardboard_normal.jpg'), normalScale: new THREE.Vector2(.5, .5), roughness: 1 }),
      leather: new THREE.MeshStandardMaterial({ map: T('leather_color.jpg', { srgb: true }), normalMap: T('leather_normal.jpg'), normalScale: new THREE.Vector2(.8, .8), roughnessMap: T('leather_rough.jpg'), roughness: 1 }),
      laminate: new THREE.MeshStandardMaterial({ map: T('laminate_color.jpg', { srgb: true }), roughness: .55 }),
      brick: new THREE.MeshStandardMaterial({ map: T('brick_diffuse.jpg', { srgb: true, repeat: [1.5, 1.5] }), bumpMap: T('brick_bump.jpg', { repeat: [1.5, 1.5] }), bumpScale: .02, roughnessMap: T('brick_roughness.jpg', { repeat: [1.5, 1.5] }), roughness: 1 }),
      ground: new THREE.MeshStandardMaterial({ color: 0x6f6a60, map: T('ground_color.jpg', { srgb: true }), normalMap: T('ground_normal.jpg'), roughnessMap: T('ground_rough.jpg'), roughness: 1 }),
      tree: new THREE.MeshStandardMaterial({ color: 0x0a0b0a, roughness: 1 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x1b1b1e, roughness: .8 }),
      plastic: new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: .45 }),
      white: new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: .5 }),
      shade: new THREE.MeshStandardMaterial({ color: 0xf0e6d0, roughness: 1, side: THREE.DoubleSide, emissive: 0x554a33 }),
      black: new THREE.MeshBasicMaterial({ color: 0x020203 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x9a9da3, roughness: .3, metalness: .85 }),
      brass: new THREE.MeshStandardMaterial({ color: 0xb08d4a, roughness: .35, metalness: .9 }),
      glass: new THREE.MeshPhysicalMaterial({ color: 0xbfd0e6, roughness: .04, metalness: 0, transparent: true, opacity: .16, envMapIntensity: 1.2, side: THREE.DoubleSide, depthWrite: false }),
      tape: new THREE.MeshStandardMaterial({ color: 0x151517, roughness: .45 }),
      pawprint: new THREE.MeshBasicMaterial({ color: 0x2a221c, transparent: true, opacity: .55, depthWrite: false }),
      label: (name, emissive = 0x1a1a18) => { const t = T(name, { srgb: true, aniso: 2 }); return new THREE.MeshStandardMaterial({ map: t, roughness: 1, emissive, emissiveMap: t, emissiveIntensity: 1 }); },
      paper: new THREE.MeshStandardMaterial({ color: 0xf1eee6, roughness: 1, side: THREE.DoubleSide, emissive: 0x2a2a28 }),
      yellow: new THREE.MeshStandardMaterial({ color: 0xd9b23a, roughness: .5, emissive: 0x2a2208 }),
      orange: new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff5a00, emissiveIntensity: .8, roughness: 1, side: THREE.DoubleSide }),
      rope: new THREE.MeshStandardMaterial({ color: 0xb7a37a, roughness: 1 }),
      led: new THREE.MeshBasicMaterial({ color: 0xff2020 }),
      bulb: new THREE.MeshBasicMaterial({ color: 0xffe2b0 })
    };
    M.pageEcho = M.label('page_echo.jpg', 0x222220); M.pageTom = M.label('page_tom.jpg', 0x222220); M.map = M.label('map.jpg', 0x222220);
    M.tagSample = M.label('tag_sample.jpg'); M.tagPhoto = M.label('tag_photo.jpg');
    M.labelTape1 = M.label('label_tape1.jpg'); M.labelTape2 = M.label('label_tape2.jpg'); M.labelKaren = M.label('label_karen.jpg'); M.labelHolloway = M.label('label_holloway.jpg'); M.labelTom = M.label('label_tom.jpg');
    const cookie = T('cookie.png'); cookie.wrapS = cookie.wrapT = THREE.ClampToEdgeWrapping;
    const moteTex = T('mote.png');

    // environment: the night, very faintly, on everything that shines
    const pmrem = new THREE.PMREMGenerator(renderer);
    manager.onLoad = () => {
      if (loadDone) return; loadDone = true;
      const lateLoader = new THREE.TextureLoader(); for (const [t, url] of lateTex) lateLoader.load(url, l => { t.image = l.image; t.needsUpdate = true; l.dispose(); });
      skyHDR.mapping = THREE.EquirectangularReflectionMapping; scene.environment = pmrem.fromEquirectangular(skyHDR).texture; scene.environmentIntensity = .4; skyHDR.dispose();
      hud.loadBar.style.width = '100%';
      const go = () => { idle = 0; shadowRef.force = true; hud.loading.classList.add('off'); setTimeout(() => { hud.loading.hidden = true; }, 1400); arrive(); };
      (renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve()).catch(() => {}).then(() => setTimeout(go, 200));
    };

    // world-space texture coordinates for the instanced gray walls: no seams, no tool marks
    const worldUV = (mat, scale = .42) => {
      const m = mat.clone();
      m.onBeforeCompile = shader => {
        shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
          #ifdef USE_INSTANCING
            vec4 wpUV = modelMatrix * instanceMatrix * vec4(position, 1.0);
          #else
            vec4 wpUV = modelMatrix * vec4(position, 1.0);
          #endif
          #ifdef USE_INSTANCING
            vec3 nUV = abs(normalize(mat3(modelMatrix) * (mat3(instanceMatrix) * normal)));
          #else
            vec3 nUV = abs(normalize(mat3(modelMatrix) * normal));
          #endif
          vec2 wuv = nUV.y > 0.5 ? wpUV.xz : (nUV.x > 0.5 ? wpUV.zy : wpUV.xy);
          wuv *= ${scale.toFixed(3)};
          vMapUv = wuv;
          #ifdef USE_NORMALMAP
            vNormalMapUv = wuv;
          #endif
          #ifdef USE_ROUGHNESSMAP
            vRoughnessMapUv = wuv;
          #endif`);
        // up close, the same stone again at seven times the scale: the grain a wall has when your face is next to it
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
          #ifdef USE_MAP
            float nearK = 1.0 - smoothstep(1.2, 5.5, length(vViewPosition));
            float dl = dot(texture2D(map, vMapUv * 7.3).rgb, vec3(0.3333));
            diffuseColor.rgb *= 1.0 + (dl - 0.4818) * 3.2 * nearK;
          #endif`);
      };
      return m;
    };
    M.ashWorld = worldUV(M.ash);
    M.ashWorld2 = worldUV(M.ash); M.ashWorld2.side = THREE.DoubleSide;
    M.ashShaft = worldUV(M.ash); M.ashShaft.side = THREE.BackSide;

    // the walls of the house: one texture tile every 2.2 m, whatever the length of the wall
    function boxUV(geo, w, h, d, s = 2.2) {
      const uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
      for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / s, uv.getY(i) * dims[f][1] / s); }
      return geo;
    }
    const shadowed = (m, cast = true, receive = true) => { m.castShadow = cast; m.receiveShadow = receive; return m; };
    // everything that never moves on its own is baked into one mesh per material: a few draw calls instead of a few hundred
    const statics = new Set(), baked = [];
    const stat = m => { statics.add(m); return m; };
    function bakeStatics() {
      for (const m of baked) { scene.remove(m); m.geometry.dispose(); }
      baked.length = 0;
      const groups = new Map();
      for (const m of statics) {
        if (!m.geometry || !m.material) continue;
        m.updateMatrix(); m.updateWorldMatrix(true, false);
        const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
        for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
        if (!groups.has(m.material)) groups.set(m.material, []);
        groups.get(m.material).push(g);
        m.visible = false; m.matrixAutoUpdate = false;
      }
      for (const [mat, geos] of groups) {
        const g = mergeGeometries(geos, false);
        for (const x of geos) x.dispose();
        if (!g) { for (const m of statics) if (m.material === mat) m.visible = true; continue; }
        const mesh = new THREE.Mesh(g, mat); shadowed(mesh); mesh.matrixAutoUpdate = false; scene.add(mesh); baked.push(mesh);
      }
      shadowRef.force = true;
    }

    /* ---------- models: real things, streamed in as they arrive ---------- */

    const gltf = new GLTFLoader(); gltf.setMeshoptDecoder(MeshoptDecoder); // the furniture arrives packed, a third lighter
    const models = { loaded: 0, wanted: 0 };
    function model(name, { size, axis = 'y', x = 0, y = 0, z = 0, ry = 0, cast = true, mirror = false, onLoad } = {}) {
      const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; if (mirror) g.scale.z = -1; g.userData.model = name; scene.add(g);
      models.wanted++;
      gltf.load(`assets/models/${name}.glb`, r => {
        const s = r.scene;
        const lights = []; s.traverse(o => { if (o.isLight) lights.push(o); });
        for (const l of lights) l.parent.remove(l);
        const box = new THREE.Box3().setFromObject(s), dim = box.getSize(new THREE.Vector3());
        const k = size / (axis === 'y' ? dim.y : axis === 'x' ? dim.x : axis === 'z' ? dim.z : Math.max(dim.x, dim.z));
        s.scale.setScalar(k);
        box.setFromObject(s);
        s.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
        s.traverse(o => {
          if (!o.isMesh) return;
          o.castShadow = cast; o.receiveShadow = size >= .6; // small things do not need to be drawn into the map
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) {
            if (m.transmission > 0) { const glass = m.transmission > .85 || /glass/i.test(m.name || ''); m.transmission = 0; if (glass) { m.transparent = true; m.opacity = .4; m.depthWrite = false; } } // no second render pass for glass; a hint of it stays opaque
            if (m.map) m.map.anisotropy = maxAniso;
            m.envMapIntensity = .5;
          }
        });
        g.add(s); models.loaded++; idle = 0; // a model that arrives while the loop idles still gets drawn
        if (onLoad) onLoad(s, g);
      }, undefined, e => { models.loaded++; console.warn('model', name, e); });
      return g;
    }

    const G = { x0: 14, z0: -30, W: 270, D: 160, T: .5, tiles: null, hallStart: 144, hallJ0: 10, hallJ1: 150, stair: { i: 204, j: 80 }, meshes: [], chunks: new Map(), floor: null, ceiling: null, built: false, short: false, phase: null, tall: null, L: 0 };
    G.stair.x = G.x0 + (G.stair.i + .5) * G.T; G.stair.z = G.z0 + (G.stair.j + .5) * G.T;
    const STEP_A = Math.PI * 2 / 16, RISE = .19, N_STEPS = 224, N_ABOVE = 80, R_IN = .58, R_OUT = 2.95, WELL = 3.1, HALF_STEP = STEP_A * .54;
    let camY = 1.6;

    /* ---------- the house ---------- */

    const H = 2.5, TH = 0.16;
    const shadowRef = { x: NaN, z: NaN, yaw: 0, pitch: 0, y: 0, frame: 0, force: true }; // declared first: a resumed game reopens doors before the frame loop exists
    // lamps: every light in the house is a source; each frame the few nearest become real point lights
    const sources = [];
    const source = (x, y, z, color, intensity, dist) => { const src = { pos: new THREE.Vector3(x, y, z), color: new THREE.Color(color), intensity, dist }; sources.push(src); return src; };
    const POOL = Q.low ? 3 : 4;
    const pool = Array.from({ length: POOL }, () => { const l = new THREE.PointLight(0xffffff, 0, 8, 2); scene.add(l); return l; });
    const colliders = []; // { x0, x1, z0, z1, mesh? }
    const houseWalls = [];
    const box = (w, h, d, mat, x, y, z, uvs) => {
      const geo = new THREE.BoxGeometry(w, h, d); if (uvs) boxUV(geo, w, h, d, uvs);
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); shadowed(m); scene.add(m); return stat(m);
    };
    const solid = (m, w, d) => { const c = { x0: m.position.x - w / 2, x1: m.position.x + w / 2, z0: m.position.z - d / 2, z1: m.position.z + d / 2, mesh: m }; colliders.push(c); return c; };
    const block = (x, z, w, d) => colliders.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });

    function wallPiece(cx, cz, len, alongX, tag, y0 = 0, y1 = H, mat = M.wall) {
      const w = alongX ? len : TH, d = alongX ? TH : len, h = y1 - y0;
      const g = boxUV(new THREE.BoxGeometry(w, h, d), w, h, d); g.translate(0, y0 + h / 2, 0); // pivot at the base, so a wall can lean later
      const m = new THREE.Mesh(g, mat); m.position.set(cx, 0, cz); shadowed(m); scene.add(m); stat(m);
      if (y0 === 0) { const c = solid(m, w, d); c.tag = tag; houseWalls.push({ mesh: m, col: c, tag, len, alongX }); }
      else houseWalls.push({ mesh: m, tag, len, alongX });
      return m;
    }
    const glassPanes = [];
    function windowIn(cx, cz, len, alongX) {
      wallPiece(cx, cz, len, alongX, 'sill', 0, .95); wallPiece(cx, cz, len, alongX, 'lintel', 2.15, H);
      const w = len, h = 1.2, y = 1.55, ry = alongX ? 0 : Math.PI / 2;
      const frame = new THREE.Group(); frame.position.set(cx, y, cz); frame.rotation.y = ry; scene.add(frame);
      const bar = (bw, bh, bx, by) => { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, TH + .04), M.wood); m.position.set(bx, by, 0); shadowed(m); frame.add(m); stat(m); };
      bar(w + .1, .06, 0, h / 2 + .03); bar(w + .1, .06, 0, -h / 2 - .03); bar(.06, h, -w / 2 - .03, 0); bar(.06, h, w / 2 + .03, 0); bar(.04, h, 0, 0); bar(w, .04, 0, 0);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.glass); frame.add(pane); glassPanes.push(pane);
    }
    // a straight wall from (x1,z1) to (x2,z2); gaps are [from, to] in metres from the start, doors unless a third value says 'win'
    function wall(x1, z1, x2, z2, gaps = [], tag) {
      const alongX = z1 === z2, len = alongX ? x2 - x1 : z2 - z1;
      const pieces = []; let t = 0;
      for (const [a, b, kind] of [...gaps].sort((p, q) => p[0] - q[0])) {
        if (a > t) pieces.push([t, a]);
        const cx = alongX ? x1 + (a + b) / 2 : x1, cz = alongX ? z1 : z1 + (a + b) / 2;
        if (kind === 'win') windowIn(cx, cz, b - a, alongX); else wallPiece(cx, cz, b - a, alongX, 'lintel', 2.05, H);
        t = b;
      }
      if (t < len) pieces.push([t, len]);
      for (const [a, b] of pieces) wallPiece(alongX ? x1 + (a + b) / 2 : x1, alongX ? z1 : z1 + (a + b) / 2, b - a + TH, alongX, tag);
    }
    // a wall segment that can vanish: the door that was not there
    function plug(x1, z1, x2, z2) {
      const alongX = z1 === z2, len = alongX ? x2 - x1 : z2 - z1;
      const m = wallPiece(alongX ? (x1 + x2) / 2 : x1, alongX ? z1 : (z1 + z2) / 2, len + TH, alongX, 'plug');
      return { mesh: m, col: colliders[colliders.length - 1], open() { statics.delete(m); m.removeFromParent(); colliders.splice(colliders.indexOf(this.col), 1); wallPiece(alongX ? (x1 + x2) / 2 : x1, alongX ? z1 : (z1 + z2) / 2, len, alongX, 'lintel', 2.05, H); bakeStatics(); } };
    }

    // exterior
    wall(0, 0, 14, 0, [[2.3, 3.7, 'win'], [10.3, 11.7, 'win']], 'north');
    wall(0, 13, 14, 13, [[2, 3], [4.2, 5.4, 'win'], [9.3, 10.7, 'win']], 'south');
    wall(0, 0, 0, 13, [[1.3, 2.7, 'win'], [6.8, 8.2, 'win']], 'west');
    wall(14, 0, 14, 13, [[7.92, 9.08], [1.3, 2.7, 'win'], [10.3, 11.9, 'win']], 'east');
    const hallwayPlug = plug(14, 7.92, 14, 9.08);
    // interior
    wall(0, 4, 14, 4, [[2.42, 3.58], [9.92, 11.08]], 'bedrooms'); // doorways a metre clear once the wall pieces overlap them
    wall(6.5, 0, 6.5, 4, [[1.5, 2.5]], 'closet-w');
    const closetPlug = plug(6.5, 1.5, 6.5, 2.5);
    wall(7.5, 0, 7.5, 4, [], 'closet-e');
    wall(0, 5.3, 14, 5.3, [[3.92, 5.08], [8.92, 10.08]], 'hall');
    wall(6, 5.3, 6, 13, [[1.2, 3.2], [5.62, 6.78]], 'kitchen-living');
    wall(0, 10.5, 6, 10.5, [[1.92, 3.08]], 'foyer');
    // skirting and door frames, the small carpentry that makes a wall a wall
    for (const [x1, z1, x2, z2] of [[.08, .08, 13.92, .08], [.08, 12.92, 13.92, 12.92], [.08, .08, .08, 12.92], [13.92, .08, 13.92, 12.92]]) {
      const alongX = z1 === z2, len = alongX ? x2 - x1 : z2 - z1;
      const m = new THREE.Mesh(new THREE.BoxGeometry(alongX ? len : .03, .1, alongX ? .03 : len), M.wood);
      m.position.set((x1 + x2) / 2, .05, (z1 + z2) / 2); scene.add(m); stat(m);
    }

    // floors and ceilings
    const houseFloor = shadowed(new THREE.Mesh(new THREE.PlaneGeometry(14, 13), M.floor), false, true);
    houseFloor.rotation.x = -Math.PI / 2; houseFloor.position.set(7, 0, 6.5); scene.add(houseFloor);
    const houseCeiling = shadowed(new THREE.Mesh(new THREE.PlaneGeometry(14, 13), M.ceiling), false, true);
    houseCeiling.rotation.x = Math.PI / 2; houseCeiling.position.set(7, H, 6.5); scene.add(houseCeiling);
    box(1, .02, 4, M.ashWorld, 7, 0.011, 2); // the closet was never wood
    // the roof, seen from the yard
    const roof = new THREE.Mesh(new THREE.BoxGeometry(15, .3, 14), M.dark); roof.position.set(7, H + .21, 6.5); scene.add(roof); stat(roof); // clear of the ceiling, or the two would fight

    // outside: the yard, the trees, and the night
    const groundShape = new THREE.Shape(); groundShape.moveTo(-193, -206.5); groundShape.lineTo(207, -206.5); groundShape.lineTo(207, 193.5); groundShape.lineTo(-193, 193.5); groundShape.closePath();
    const groundHole = new THREE.Path(); groundHole.absarc(G.stair.x, -G.stair.z, WELL + 1, 0, Math.PI * 2, true); groundShape.holes.push(groundHole); // the well goes down through the yard as well
    const groundGeo = new THREE.ShapeGeometry(groundShape, 24); { const uv = groundGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 3.6, uv.getY(i) / 3.6); }
    const ground = shadowed(new THREE.Mesh(groundGeo, M.ground), false, true);
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -.03, 0); scene.add(ground);
    const brickBase = new THREE.Mesh(new THREE.BoxGeometry(14.4, .6, 13.4), M.brick); brickBase.position.set(7, -.315, 6.5); scene.add(brickBase); stat(brickBase); // its top sits just under the floorboards
    const porch = box(2.4, .16, 1.2, M.brick, 2.5, .08, 13.7); // a step, not a wall: the way out once the door opens
    const treeRand = rng(5);
    for (let i = 0; i < 14; i++) {
      const a = treeRand() * Math.PI * 2, r = 13 + treeRand() * 22;
      const x = 7 + Math.cos(a) * r, z = 6.5 + Math.sin(a) * r;
      if (x > 12 && z > -36 && z < 56) continue; // the hallway will need that ground
      const h = 7 + treeRand() * 7;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.14, .22, h, 6), M.tree); trunk.position.set(x, h / 2, z); scene.add(trunk); stat(trunk);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1.8 + treeRand() * 1.6, 7, 6), M.tree); crown.position.set(x, h - .5, z); crown.scale.y = 1.5; scene.add(crown); stat(crown);
    }
    const skyDome = new THREE.Mesh(new THREE.SphereGeometry(52, 48, 24), new THREE.ShaderMaterial({
      uniforms: { sky: { value: sky }, center: { value: new THREE.Vector3(7, 1.6, 6.5) }, turn: { value: 1.9 } },
      vertexShader: 'uniform vec3 center; varying vec3 vDir; void main(){ vDir = (modelMatrix * vec4(position, 1.0)).xyz - center; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D sky; uniform float turn; varying vec3 vDir; void main(){ vec3 d = normalize(vDir); vec2 uv = vec2(atan(d.z, d.x) / 6.2831853 + 0.5 + turn, asin(clamp(d.y, -1.0, 1.0)) / 3.1415927 + 0.5); vec3 c = texture2D(sky, uv).rgb; c = c * 0.2 + pow(c, vec3(8.0)) * 0.4; gl_FragColor = vec4(c, 1.0); }', // the glow of a town over the hill stays faint; the stars stay stars
      side: THREE.BackSide, depthWrite: false
    }));
    skyDome.position.set(7, 0, 6.5); skyDome.renderOrder = 10; scene.add(skyDome);
    // the hallway is built in the yard, east of the house. Seen from outside, from any window, it must not be there: a shell around it that shows
    // the night beyond, a far tree line and the sky, as if the yard went on, open only at the hallway's own door. From inside the hallway you see through the shell.
    const beyond = new THREE.ShaderMaterial({
      uniforms: skyDome.material.uniforms,
      vertexShader: 'varying vec3 vDir; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vDir = wp.xyz - cameraPosition; gl_Position = projectionMatrix * viewMatrix * wp; }',
      fragmentShader: skyDome.material.fragmentShader.replace(/gl_FragColor\s*=\s*vec4\(([^;]*)\);/, (m, c) => `vec4 skyC = vec4(${c}); vec3 dd = normalize(vDir); float az = atan(dd.z, dd.x); float tl = 0.17 + 0.045 * sin(az * 9.0) + 0.03 * sin(az * 23.0 + 1.3) + 0.018 * sin(az * 57.0 + 0.4) + 0.008 * sin(az * 190.0); float below = 1.0 - smoothstep(tl - 0.004, tl + 0.004, dd.y); gl_FragColor = vec4(mix(skyC.rgb, vec3(0.004, 0.005, 0.006), below), 1.0);`),
      side: THREE.FrontSide
    });
    {
      const X0 = G.x0 + .09, X1 = G.x0 + G.W * G.T + .5, Z0 = G.z0 - .5, Z1 = G.z0 + G.D * G.T + .5, TOP = 90, Y0 = -.06, dz0 = 7.92, dz1 = 9.08, dy = 2.05;
      const quad = (w, h, x, y, z, ry, rx = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), beyond); m.position.set(x, y, z); m.rotation.set(rx, ry, 0, 'YXZ'); m.frustumCulled = false; scene.add(m); return m; };
      quad(dz0 - Z0, TOP - Y0, X0, (TOP + Y0) / 2, (Z0 + dz0) / 2, -Math.PI / 2); // the west face, around the door
      quad(Z1 - dz1, TOP - Y0, X0, (TOP + Y0) / 2, (dz1 + Z1) / 2, -Math.PI / 2);
      quad(dz1 - dz0, TOP - dy, X0, (TOP + dy) / 2, (dz0 + dz1) / 2, -Math.PI / 2);
      quad(X1 - X0, TOP - Y0, (X0 + X1) / 2, (TOP + Y0) / 2, Z0, Math.PI); // north
      quad(X1 - X0, TOP - Y0, (X0 + X1) / 2, (TOP + Y0) / 2, Z1, 0); // south
      quad(Z1 - Z0, TOP - Y0, X1, (TOP + Y0) / 2, (Z0 + Z1) / 2, Math.PI / 2); // east
      quad(X1 - X0, Z1 - Z0, (X0 + X1) / 2, TOP, (Z0 + Z1) / 2, 0, -Math.PI / 2); // above
    }

    // pale rectangles where the photographs hung
    for (const [x, y, z, w, h, ry] of [[10, 1.65, .09, .5, .4, 0], [13.91, 1.6, 7, .6, .45, -Math.PI / 2], [6.09, 1.7, 8.5, .42, .55, Math.PI / 2], [.09, 1.6, 3, .35, .45, Math.PI / 2], [3, 1.65, 5.21, .5, .38, Math.PI], [9, 1.6, 4.09, .45, .35, 0]]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.pale); p.position.set(x, y, z); p.rotation.y = ry; scene.add(p); stat(p);
      const nail = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .03, 5), M.metal); nail.position.set(x, y + h / 2 + .04, z); nail.rotation.set(Math.PI / 2, 0, ry); scene.add(nail); stat(nail);
    }

    // furniture: living room
    model('leather_sofa', { size: 2.4, axis: 'x', x: 11.6, z: 6.2, ry: 0 }); block(11.6, 6.2, 2.4, 1); // clear of the door in the hall wall at x 9..10
    model('cushion', { size: .42, x: 10.65, y: .42, z: 6.22, ry: .35 });
    model('rug', { size: 2.3, axis: 'x', x: 11.6, y: .004, z: 8.2, cast: false });
    model('sheen_chair', { size: .72, x: 12.9, z: 10.1, ry: -2.1 }); block(12.9, 10.1, .8, .8);
    box(1.1, .04, .6, M.wood, 11.6, .4, 7.55, 1); for (const [dx, dz] of [[-.5, -.25], [.5, -.25], [-.5, .25], [.5, .25]]) box(.04, .4, .04, M.wood, 11.6 + dx, .2, 7.55 + dz); block(11.6, 7.55, 1.1, .6); // close to the sofa: the way across the room runs north of the pit
    model('coffee_mug', { size: .1, x: 11.25, y: .42, z: 7.43, ry: .8 });
    model('magazine', { size: .33, axis: 'x', x: 11.55, y: .421, z: 7.65, ry: .2, cast: false });
    model('vase_flowers', { size: .22, x: 11.98, y: .42, z: 7.47 });
    model('glass_hurricane_candle_holder', { size: .26, x: 10.15, y: .45, z: 12.5 });
    model('books', { size: .5, x: 10.85, y: .45, z: 12.55, ry: Math.PI / 2 });
    model('curtain', { size: 2.3, x: 13.62, z: 10.15, ry: Math.PI / 2, cast: false });
    model('antique_camera', { size: 1.55, x: 12.6, z: 11.6, ry: -2.4 }); block(12.6, 11.6, .7, .7);
    const floorLamp = model('lights_punctual_lamp', { size: 1.75, x: 6.75, z: 12.55, ry: .6 }); block(6.75, 12.55, .5, .5);
    model('plant_small', { size: .95, x: 13.4, z: 5.9, cast: false }); block(13.4, 5.9, .6, .6);
    // the television, on a low unit, facing the couch
    box(.9, .45, .45, M.wood, 10.5, .225, 12.5, 1); block(10.5, 12.5, .9, .45);
    const tv = box(.62, .5, .5, M.plastic, 10.5, .7, 12.5);
    const screenMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, on: { value: 0 }, feed: { value: null }, feedOn: { value: 0 }, label: { value: null } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float time; uniform float on; uniform sampler2D feed; uniform float feedOn; uniform sampler2D label; varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main(){ vec2 uv = vUv; float n = hash(floor(uv * vec2(320.0, 240.0)) + floor(time * 60.0));
          float scan = 0.82 + 0.18 * sin(uv.y * 240.0 * 3.14159); float band = 0.7 + 0.3 * smoothstep(0.0, 0.05, abs(fract(uv.y - time * 0.13) - 0.5) - 0.42);
          vec3 c = vec3(n * scan * band) * 1.4; vec2 d = uv - 0.5; c *= 1.0 - dot(d, d) * 1.4; c = c * on + (1.0 - on) * vec3(0.012, 0.012, 0.016);
          if (feedOn > 0.0) { vec2 fu = uv + vec2((hash(vec2(floor(uv.y * 90.0), floor(time * 24.0))) - 0.5) * 0.004, 0.0); vec3 f = texture2D(feed, fu).rgb; float g = dot(f, vec3(0.3, 0.59, 0.11)); g = pow(g, 0.7) * 1.7 + 0.03;
            vec3 m = vec3(g * 0.92, g, g * 0.95) * scan * (0.9 + n * 0.2); vec4 lb = texture2D(label, vec2(uv.x, uv.y)); m = mix(m, vec3(0.9), lb.a * 0.85); m *= 1.0 - dot(d, d) * 1.2;
            c = mix(c, m, feedOn); }
          gl_FragColor = vec4(c, 1.0); }`
    });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(.5, .38), screenMat); screen.position.set(10.5, .72, 12.245); screen.rotation.y = Math.PI; scene.add(screen);
    const tvSrc = source(10.5, 1, 11.8, 0xbfd0ff, 0, 4);
    // moving boxes
    solid(box(.6, .6, .6, M.cardboard, 7.6, .3, 12.5), .6, .6); box(.55, .55, .55, M.cardboard, 7.6, .875, 12.5).rotation.y = .2; box(.6, .6, .6, M.cardboard, 8.2, .3, 12.4).rotation.y = -.15; block(8.2, 12.4, .6, .6);
    box(.5, .4, .5, M.cardboard, 8.9, .2, 12.5).rotation.y = .5;

    // kitchen
    model('cupboards', { size: 4.75, axis: 'z', x: .42, z: 7.9 }); block(.45, 7.9, .75, 4.75); // the run along the west wall of the original kitchen
    model('worktops', { size: 4.75, axis: 'z', x: .5, y: .9, z: 7.9, cast: false });
    model('cooker', { size: .88, axis: 'x', x: 3.45, z: 5.85, ry: Math.PI }); block(3.45, 5.85, .9, 1.1);
    model('hood', { size: .49, axis: 'x', x: 3.45, y: 1.5, z: 5.75, ry: Math.PI });
    model('microwave', { size: .6, axis: 'x', x: .5, y: .92, z: 9.7, ry: Math.PI / 2 });
    model('plant_small', { size: .5, x: .45, y: .92, z: 6.3, cast: false });
    solid(box(.75, 1.75, .7, M.white, 5.5, .875, 5.75), .75, .7); box(.02, .3, .02, M.metal, 5.14, 1.1, 5.55);      // the fridge and its handle
    const kitchenTable = box(1.4, .05, .9, M.wood, 3.6, .74, 8.6, 1); for (const [dx, dz] of [[-.62, -.38], [.62, -.38], [-.62, .38], [.62, .38]]) box(.05, .72, .05, M.wood, 3.6 + dx, .36, 8.6 + dz); block(3.6, 8.6, 1.4, .9);
    for (const [x, z, ry] of [[2.7, 8.6, Math.PI / 2], [4.5, 8.6, -Math.PI / 2], [3.6, 9.5, 0]]) { // chairs
      const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; scene.add(c);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(.42, .04, .42), M.wood); seat.position.y = .45; shadowed(seat); c.add(seat); stat(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(.42, .5, .04), M.wood); back.position.set(0, .72, -.19); shadowed(back); c.add(back); stat(back);
      for (const [dx, dz] of [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.03, .45, .03), M.wood); l.position.set(dx, .225, dz); c.add(l); stat(l); }
      block(x, z, .45, .45);
    }
    model('coffee_mug', { size: .1, x: 3.2, y: .765, z: 8.45, ry: 2.2 });
    model('teacup', { size: .15, axis: 'x', x: 4.0, y: .765, z: 8.35, ry: .6 });

    // bedroom (west) and the children's room (east)
    // their bed: the headboard against the north wall, beside the window, a nightstand either side
    model('bed', { size: 2.07, axis: 'max', x: 4.95, z: 1.13, ry: 0 }); block(4.95, 1.13, 1.62, 2.07);
    model('blanket', { size: .5, axis: 'x', x: 5.1, y: .55, z: 1.75, ry: 1.9 });
    model('nightstand', { size: .6, axis: 'x', x: 3.8, z: .4 }); block(3.8, .4, .6, .32);
    model('nightstand', { size: .6, axis: 'x', x: 6.07, z: .4 }); block(6.07, .4, .6, .32);
    model('picture', { size: .19, x: 3.66, y: .34, z: .38, ry: .3 });
    model('bedside_lamp', { size: .24, x: 6.12, y: .34, z: .36, onLoad: sc => sc.traverse(o => { if (o.isMesh && /emitter/i.test(o.name)) { o.material = o.material.clone(); o.material.emissive = new THREE.Color(0xffe2b8); o.material.emissiveIntensity = 1.6; } }) });
    const bedsideSrc = source(6.12, .58, .36, 0xffd6a0, 1.1, 3.2);
    model('curtain', { size: 2.3, x: 2.05, z: .34, cast: false });
    model('curtain', { size: 2.3, x: .34, z: 1.2, ry: Math.PI / 2, cast: false });
    model('chair_damask_purplegold', { size: .7, x: .9, z: 3.1, ry: -2.2 }); block(.9, 3.1, .7, .7); // in the corner by the west window, turned to the room
    // the children's beds, side by side, heads to the north wall, the nightstand between them under the window
    model('bed', { size: 1.8, axis: 'max', x: 12.45, z: .99, ry: 0 }); block(12.45, .99, 1.4, 1.8);
    model('bed', { size: 1.8, axis: 'max', x: 9.55, z: .99, ry: 0 }); block(9.55, .99, 1.4, 1.8);
    model('nightstand', { size: .55, axis: 'x', x: 11, z: .38 }); block(11, .38, .55, .3);
    model('bedside_lamp', { size: .22, x: 11, y: .31, z: .34 });
    model('boxes', { size: .73, axis: 'z', x: 13.45, z: 3.4, ry: -.2 }); block(13.45, 3.4, .5, .75);
    model('book', { size: .21, axis: 'x', x: 11.1, y: .01, z: 2.2, ry: .7, cast: false });
    model('toy_car', { size: .17, axis: 'z', x: 10.1, z: 2.75, ry: 1.9 });
    for (let k = 0; k < 4; k++) { const b = box(.16, .16, .16, k % 2 ? M.yellow : M.plastic, 8.2 + hash(k) * .6, .08, 2.7 + hash(k + 4) * .6); b.rotation.y = hash(k + 8) * 2; }

    // foyer
    solid(box(.9, .75, .4, M.wood, 4.5, .375, 12.6, 1), .9, .4);
    model('vase_small', { size: .3, x: 4.78, y: .75, z: 12.58 });
    for (let k = 0; k < 4; k++) { const hook = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .06, 6), M.brass); hook.position.set(5.2 + k * .22, 1.7, 12.88); hook.rotation.x = Math.PI / 2; scene.add(hook); stat(hook); }
    box(.02, .02, 2.4, M.wood, .09, 1.2, 11.7).rotation.z = 0; // a shelf line

    // the cameras Navidson mounted in the rooms, and their red eyes; each looks into its room, and the television shows what they see
    const leds = [], cams = [];
    for (const [x, z, tx, tz, name] of [[.3, 12.7, 3, 11.4, 'FOYER'], [13.7, 5.6, 11, 10.6, 'LIVING ROOM'], [.3, .3, 3.6, 2.6, 'BEDROOM'], [13.7, .3, 10.6, 2.3, 'CHILDREN'], [6.3, 5.6, 9.6, 11.2, 'LIVING ROOM, WEST']]) {
      const rig = new THREE.Group(); rig.position.set(x, 2.25, z); scene.add(rig); rig.lookAt(tx, .7, tz);
      const body = new THREE.Mesh(new THREE.BoxGeometry(.16, .1, .22), M.plastic); rig.add(body); stat(body);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(.03, .035, .04, 12), M.dark); lens.position.z = .12; lens.rotation.x = Math.PI / 2; rig.add(lens); stat(lens);
      const led = new THREE.Mesh(new THREE.BoxGeometry(.02, .02, .02), M.led); led.position.set(.05, .06, .08); rig.add(led); leds.push(led); // the eyes blink, so they stay their own meshes
      cams.push({ x, z, tx, tz, name, rig });
    }
    const lamps = [];
    const lampAt = (x, y, z, i, shade = true) => {
      const src = source(x, y, z, 0xffc98a, i, 7.5);
      const b = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), M.bulb); b.position.copy(src.pos); scene.add(b);
      const parts = [b];
      if (shade) { const s = new THREE.Mesh(new THREE.CylinderGeometry(.16, .22, .18, 14, 1, true), M.shade); s.position.set(x, y + .04, z); scene.add(s); stat(s); const stem = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, H - y - .1, 6), M.brass); stem.position.set(x, (H + y) / 2, z); scene.add(stem); stat(stem); parts.push(s, stem); }
      lamps.push({ src, bulb: b, base: i, flicker: hash(x * 3 + z) < .35, hung: shade, parts: parts.map(o => [o, o.position.y]), y0: src.pos.y });
      return src;
    };
    lampAt(10, H - .35, 9, 7); lampAt(3, H - .35, 7.5, 6); lampAt(7, H - .3, 4.65, 4); lampAt(3, H - .35, 2, 4.5); lampAt(11, H - .35, 2, 4.5); lampAt(3, H - .35, 11.8, 4.5);
    lampAt(7.1, 1.45, 12.2, 5, false).dist = 7; // inside the floor lamp
    scene.add(new THREE.HemisphereLight(0x22283a, 0x050403, .06));
    const lightPos = new THREE.Vector3();
    function poolLights() {
      lightPos.set(P.x, camY, P.z);
      const near = sources.filter(s => s.intensity > 0).map(s => [s.pos.distanceTo(lightPos) - s.dist * .5, s]).sort((a, b) => a[0] - b[0]);
      for (let i = 0; i < POOL; i++) {
        const l = pool[i], s = near[i] && near[i][0] < 6 ? near[i][1] : null;
        if (!s) { l.intensity = 0; continue; }
        l.position.copy(s.pos); l.color.copy(s.color); l.intensity = s.intensity; l.distance = s.dist;
      }
    }

    // the flashlight you carry
    const torch = new THREE.SpotLight(0xfff5e8, 34, 34, .58, .62, 1.75);
    torch.position.set(.14, -.12, .05);
    torch.castShadow = true; torch.shadow.mapSize.set(Q.low ? 1024 : 2048, Q.low ? 1024 : 2048);
    torch.shadow.camera.near = .12; torch.shadow.camera.far = 34; torch.shadow.bias = -.0002; torch.shadow.normalBias = .02; torch.shadow.radius = Q.low ? 2 : 4; torch.shadow.blurSamples = Q.low ? 6 : 8;
    torch.map = cookie;
    camera.add(torch); camera.add(torch.target); torch.target.position.set(.05, -.3, -1);
    const dayHemi = new THREE.HemisphereLight(0xf3f6ff, 0xd8cdbd, 0); scene.add(dayHemi); // Vermont, and only Vermont
    const daySun = new THREE.DirectionalLight(0xfff2e0, 0); daySun.position.set(-296, 6, -8); daySun.target.position.set(-300, 0, 0); scene.add(daySun, daySun.target);
    const halo = new THREE.PointLight(0xffe6c8, 1.4, 6, 2); // what the beam scatters back around you
    halo.position.set(0, -.3, -.2); camera.add(halo);
    scene.add(camera);

    // dust in the beam: one small cloud that wraps around wherever you are, so it is the same everywhere and costs the same
    const motesTime = { value: 0 };
    const DUST_BOX = new THREE.Vector3(9, 3.6, 9);
    const dust = (() => {
      const n = Q.low ? 320 : 560, pos = new Float32Array(n * 3), rand = rng(3);
      for (let k = 0; k < n; k++) { pos[k * 3] = rand() * DUST_BOX.x; pos[k * 3 + 1] = rand() * DUST_BOX.y; pos[k * 3 + 2] = rand() * DUST_BOX.z; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ map: moteTex, color: 0xd8d2c4, size: .05, transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
      mat.onBeforeCompile = sh => {
        sh.uniforms.time = motesTime; sh.uniforms.box = { value: DUST_BOX };
        sh.vertexShader = 'uniform float time; uniform vec3 box; varying float vFade;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          vec3 drift = vec3(sin(time * 0.22 + position.y * 3.0) * 0.05, sin(time * 0.35 + position.x * 2.1 + position.z * 1.3) * 0.06 - time * 0.01, sin(time * 0.17 + position.x * 1.7) * 0.04);
          vec3 rel = mod(position + drift - cameraPosition + box * 0.5, box) - box * 0.5;
          transformed = rel + cameraPosition;
          vec3 e = 1.0 - abs(rel) / (box * 0.5); vFade = clamp(min(min(e.x, e.y), e.z) * 3.0, 0.0, 1.0);`);
        sh.fragmentShader = 'varying float vFade;\n' + sh.fragmentShader.replace('#include <premultiplied_alpha_fragment>', 'gl_FragColor.rgb *= vFade;\n#include <premultiplied_alpha_fragment>');
      };
      const p = new THREE.Points(g, mat); p.frustumCulled = false; scene.add(p); return p;
    })();

    /* ---------- the hallway that should not be there ---------- */

    const tileAt = (i, j) => (i < 0 || j < 0 || i >= G.W || j >= G.D) ? 1 : G.tiles[i + j * G.W];
    // the hallway has phases, like the film's explorations: a short dead end (Exploration A), Holloway's long corridor with its rooms,
    // the corridor the house shortened when it tore, and the empty width Navidson rode into alone
    function genMaze(phase, L) {
      const { W, D } = G; const t = G.tiles = new Uint8Array(W * D).fill(1);
      const carve = (i0, i1, j0, j1) => { for (let j = Math.max(0, j0); j <= Math.min(D - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(W - 1, i1); i++) t[i + j * W] = 0; };
      G.phase = phase; G.short = phase === 'short'; G.tall = null; G.ante = null; G.low = null; G.shrink = null; G.loop = null;
      if (phase === 'a') { // a corridor that ends in a room with two dark mouths, and a stub that stops
        L = L || 24; G.hallStart = 9999;
        carve(0, L, 76, 78);
        carve(L - 1, L + 7, 71, 83);
        carve(L + 8, L + 9, 76, 78); carve(L + 10, L + 15, 75, 79);
        carve(L + 1, L + 3, 62, 70); carve(L + 3, L + 5, 84, 92);
      } else if (phase === 'karen') { // one straight corridor; it does not stay as long as it looks
        L = 140; G.hallStart = 9999; carve(0, L, 76, 78);
      } else if (phase === 'empty') { // nothing but corridor, wider as it goes, and from a certain point no ceiling at all
        L = W - 3; G.hallStart = 9999;
        for (let i = 0; i < W - 3; i++) { if (i >= 108 && i < 126) carve(i, i, 77, 78); else { const half = 1 + Math.floor(Math.max(0, i - 60) / 26); carve(i, i, 77 - half, 77 + half); } }
        G.tall = [70, 108]; G.low = [108, 126]; // the ceiling goes, then the passage narrows to a crawl, then it opens out again
        carve(88, 106, 66, 88); G.shrink = [88, 106, 66, 88]; // a room, just before the crawl, that will not stay a room
      } else {
        L = L || (phase === 'short' ? 16 : 140);
        G.hallStart = L + 4;
        carve(0, G.hallStart + 2, 76, 78);
        if (phase === 'long') {
          const rand = rng(1331 + visits); // the rooms are never twice the same between two visits, and the same within one, however long the corridor grows
          for (let i = 12; i < L - 12;) {
            const side = rand() < .5 ? -1 : 1, w = 6 + Math.floor(rand() * 18), d = 6 + Math.floor(rand() * 22);
            if (side < 0) { carve(i, i + 1, 75, 75); carve(i - (w >> 1), i + (w >> 1), 75 - d, 74); if (rand() < .5) { carve(i, i + 1, 74 - d, 74 - d); carve(i - 4, i + 6, 74 - d - 8 - Math.floor(rand() * 10), 75 - d - 1); } }
            else { carve(i, i + 1, 79, 79); carve(i - (w >> 1), i + (w >> 1), 80, 80 + d); if (rand() < .5) { carve(i, i + 1, 81 + d, 81 + d); carve(i - 4, i + 6, 82 + d, 82 + d + 8 + Math.floor(rand() * 10)); } }
            i += 12 + Math.floor(rand() * 14);
          }
          G.tall = [100, 116]; // a stretch where the light goes up and does not arrive anywhere
          for (let j = 2; j <= 74; j++) for (let i = 59; i <= 67; i++) t[i + j * W] = 1; // a side corridor with nothing in it, so that it can be the same corridor twice
          carve(62, 64, 4, 75); G.loop = [62, 64];
          carve(L - 16, L - 4, 67, 87); carve(L - 11, L - 9, 58, 66); carve(L - 11, L - 9, 88, 96); // the anteroom, with a mouth on every side
          G.ante = [L - 16, L - 4];
        }
        carve(G.hallStart, W - 3, G.hallJ0, G.hallJ1);
        for (let j = G.stair.j - 6; j <= G.stair.j + 6; j++) for (let i = G.stair.i - 6; i <= G.stair.i + 6; i++) if ((i - G.stair.i) ** 2 + (j - G.stair.j) ** 2 <= 30) t[i + j * W] = 2;
      }
      G.L = L;
    }
    let hallLid = null;
    const mazeTileGeo = new THREE.BoxGeometry(.5, 2.6, .5);
    const tallTileGeo = new THREE.BoxGeometry(.5, 40, .5); tallTileGeo.translate(0, 18.7, 0); // a wall that goes up out of the light
    const CH = 24; // tiles per chunk side: the frustum culls whole blocks, and a wall that moves rebuilds one block
    const chunkKey = (i, j) => ((i / CH) | 0) * 1000 + ((j / CH) | 0);
    const isTall = i => G.tall && i >= G.tall[0] && i < G.tall[1];
    function buildChunk(key) {
      const old = G.chunks.get(key);
      if (old) { for (const m of old) { scene.remove(m); m.dispose(); G.meshes.splice(G.meshes.indexOf(m), 1); } }
      const ci = Math.floor(key / 1000) * CH, cj = (key % 1000) * CH, { W, T, x0, z0 } = G;
      const cells = [], tall = [];
      for (let j = cj; j < Math.min(G.D, cj + CH); j++) for (let i = ci; i < Math.min(W, ci + CH); i++) {
        if (G.tiles[i + j * W] !== 1) continue;
        if (tileAt(i - 1, j) !== 1 || tileAt(i + 1, j) !== 1 || tileAt(i, j - 1) !== 1 || tileAt(i, j + 1) !== 1) (isTall(i) ? tall : cells).push(i, j);
      }
      const made = [];
      const mat = new THREE.Matrix4();
      for (const [list, geo] of [[cells, mazeTileGeo], [tall, tallTileGeo]]) {
        if (!list.length) continue;
        const mesh = new THREE.InstancedMesh(geo, M.ashWorld, list.length / 2);
        for (let k = 0; k < list.length; k += 2) { mat.makeTranslation(x0 + (list[k] + .5) * T, 1.3, z0 + (list[k + 1] + .5) * T); mesh.setMatrixAt(k / 2, mat); }
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
        shadowed(mesh); scene.add(mesh); G.meshes.push(mesh); made.push(mesh);
      }
      G.chunks.set(key, made);
      return made;
    }
    const dirtyChunks = new Set();
    function setTile(i, j, v) { // a wall that arrives, or a doorway that is gone: the block it is in is rebuilt at the end of the frame
      if (i < 0 || j < 0 || i >= G.W || j >= G.D || G.tiles[i + j * G.W] === v) return;
      G.tiles[i + j * G.W] = v;
      for (const [di, dj] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) { const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < G.W && jj < G.D) dirtyChunks.add(chunkKey(ii, jj)); }
    }
    function flushChunks() { if (!dirtyChunks.size) return; for (const k of dirtyChunks) buildChunk(k); dirtyChunks.clear(); shadowRef.force = true; }
    function buildMaze(phase, L) {
      for (const m of G.meshes) { scene.remove(m); m.dispose(); }
      G.meshes = []; G.chunks = new Map(); dirtyChunks.clear();
      if (G.floor) { scene.remove(G.floor, G.ceiling); G.floor.geometry.dispose(); G.ceiling.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
      genMaze(phase, L);
      const { W, D, T, x0, z0 } = G;
      const keys = new Set();
      for (let j = 0; j < D; j += CH) for (let i = 0; i < W; i += CH) keys.add(chunkKey(i, j));
      for (const k of keys) buildChunk(k);
      const fw = W * T, fd = D * T;
      // the floor is one sheet with a round hole in it: the well of the staircase
      const floorShape = new THREE.Shape(); floorShape.moveTo(x0, -(z0 + fd)); floorShape.lineTo(x0 + fw, -(z0 + fd)); floorShape.lineTo(x0 + fw, -z0); floorShape.lineTo(x0, -z0); floorShape.closePath();
      const hole = new THREE.Path(); hole.absarc(G.stair.x, -G.stair.z, WELL, 0, Math.PI * 2, true); floorShape.holes.push(hole);
      G.floor = shadowed(new THREE.Mesh(new THREE.ShapeGeometry(floorShape, 48), M.ashWorld2), false, true);
      G.floor.rotation.x = -Math.PI / 2; scene.add(G.floor);
      // the ceiling covers the corridor, except where the walls go up out of the light
      G.ceiling = new THREE.Group(); scene.add(G.ceiling);
      const cwT = Math.min(G.hallStart, W);
      const spans = G.tall ? [[0, Math.min(G.tall[0], cwT), 2.6], [Math.min(G.tall[1], cwT), cwT, 2.6]] : [[0, cwT, 2.6]];
      if (G.low) { for (const sp of spans) if (sp[0] < G.low[0] && sp[1] > G.low[1]) { spans.push([G.low[1], sp[1], 2.6]); sp[1] = G.low[0]; } spans.push([G.low[0], G.low[1], 1.3]); }
      for (const [a, b, y] of spans) {
        if (b <= a) continue;
        const c = shadowed(new THREE.Mesh(new THREE.PlaneGeometry((b - a) * T, fd), M.ashWorld), false, true);
        c.rotation.x = Math.PI / 2; c.position.set(x0 + (a + b) / 2 * T, y, z0 + fd / 2); G.ceiling.add(c);
      }
      if (!hallLid) { hallLid = new THREE.Mesh(new THREE.PlaneGeometry(fw, fd), M.black); hallLid.rotation.x = Math.PI / 2; hallLid.position.set(x0 + fw / 2, 60, z0 + fd / 2); scene.add(hallLid); }
      lip.visible = G.hallStart < W;
      G.built = true;
      shadowRef.force = true;
    }
    // the lip of the well in the Great Hall
    const lip = new THREE.Mesh(new THREE.RingGeometry(WELL, WELL + .25, 48), new THREE.MeshStandardMaterial({ color: 0x1b1b1e, roughness: .8, side: THREE.DoubleSide }));
    lip.rotation.x = -Math.PI / 2; lip.position.set(G.stair.x, .014, G.stair.z); lip.visible = false; scene.add(lip);
    // the shaft the stairs go down: a wall far enough off that the light rarely reaches it
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 120, 48, 1, true), M.ashShaft);
    shaft.position.set(G.stair.x, -60, G.stair.z); shaft.visible = false; shaft.receiveShadow = true; scene.add(shaft);

    /* the staircase itself: wedge-shaped steps on a helix around the column, walked freely, kept in a window around you */
    const stepShape = new THREE.Shape();
    { const r0 = .3, r1 = WELL, h = STEP_A * 1.08 / 2;
      stepShape.moveTo(Math.cos(-h) * r0, Math.sin(-h) * r0); stepShape.lineTo(Math.cos(-h) * r1, Math.sin(-h) * r1);
      stepShape.absarc(0, 0, r1, -h, h, false); stepShape.lineTo(Math.cos(h) * r0, Math.sin(h) * r0); stepShape.absarc(0, 0, r0, h, -h, true); }
    const stepGeo = new THREE.ExtrudeGeometry(stepShape, { depth: .17, bevelEnabled: false, curveSegments: 5 });
    stepGeo.rotateX(-Math.PI / 2); stepGeo.translate(0, -.17, 0); // the tread is at y = 0, the riser hangs below it
    const steps = new THREE.InstancedMesh(stepGeo, M.ashWorld, N_STEPS);
    steps.visible = false; steps.frustumCulled = false; shadowed(steps); scene.add(steps);
    const columnGeo = new THREE.CylinderGeometry(.42, .42, 400, 24); columnGeo.translate(0, -200 + .9, 0); // a newel stub above the floor, the rest going down
    const column = new THREE.Mesh(columnGeo, M.ashWorld);
    column.position.set(G.stair.x, 0, G.stair.z); column.visible = false; shadowed(column); scene.add(column);
    const stair = { active: false, u: 0, lastA: 0, theta0: Math.PI, beat: 0, deepest: 0, shown: false, k: 0, k0: null, f: .5, lastStep: 0, lastU: 0, lastSkip: 0, stretched: 0 };
    stair.depth = () => Math.max(0, Math.round(stair.u / STEP_A)) * RISE;
    const wrapPi = a => Math.atan2(Math.sin(a), Math.cos(a));
    function placeSteps(force) {
      const k0 = Math.round(stair.u / STEP_A) - N_ABOVE;
      if (!force && k0 === stair.k0) return; // the window moves one tread at a time
      stair.k0 = k0;
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
      for (let k = 0; k < N_STEPS; k++) {
        const kk = k0 + k;
        if (kk < 0) { m.makeScale(0, 0, 0); steps.setMatrixAt(k, m); continue; }
        const edge = Math.min(k, N_STEPS - 1 - k), sh = kk === 0 ? 1 : Math.min(1, (edge + 1) / 7); // the ends of the window shrink away instead of popping
        q.setFromAxisAngle(up, -(stair.theta0 + kk * STEP_A)); p.set(G.stair.x, -kk * RISE, G.stair.z); sc.set(sh, 1, sh);
        m.compose(p, q, sc); steps.setMatrixAt(k, m);
      }
      steps.instanceMatrix.needsUpdate = true;
    }
    // a point on the helix, for the things left on the stairs
    const onStair = (depth, r = 1.7) => { const k = Math.round(depth / RISE), a = stair.theta0 + k * STEP_A; return [G.stair.x + Math.cos(a) * r, -k * RISE + .01, G.stair.z + Math.sin(a) * r, a]; };
    function stairTo(depth) { // step onto the helix at a given depth (used when arriving from the Hall, and by the tests)
      const k = Math.max(0, depth / RISE), a = stair.theta0 + k * STEP_A;
      stair.active = true; stair.u = k * STEP_A; stair.lastA = wrapPi(a); stair.k = Math.round(k);
      P.x = G.stair.x + Math.cos(a) * 1.7; P.z = G.stair.z + Math.sin(a) * 1.7; P.vx = P.vz = 0;
      camY = 1.6 - stair.depth(); placeSteps(true);
    }

    /* ---------- things to find ---------- */

    const pickups = [];
    const dropPickup = p => { const k = pickups.indexOf(p); if (k >= 0) pickups.splice(k, 1); }; // never splice at -1: that would take the last thing found instead
    function pickup(id, x, y, z, build, data) {
      const g = new THREE.Group(); g.position.set(x, y, z); build(g);
      g.traverse(o => { if (o.isMesh) shadowed(o); });
      g.userData = { id, ...data }; scene.add(g); pickups.push(g); return g;
    }
    const add = (g, m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); g.add(m); return m; };
    const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
    const tapeBuild = label => g => { add(g, mesh(new THREE.BoxGeometry(.095, .017, .063), M.tape), 0, .009, 0); add(g, mesh(new THREE.PlaneGeometry(.075, .028), label), 0, .0181, .004).rotation.x = -Math.PI / 2; g.rotation.y = .4; };
    const pageBuild = (mat, w = .21, h = .3) => g => { const p = add(g, mesh(new THREE.PlaneGeometry(w, h), mat), 0, .004, 0); p.rotation.x = -Math.PI / 2; p.rotation.z = .3; p.material.side = THREE.DoubleSide; };

    pickup('trunk', 4.6, 0, 11.2, g => { add(g, mesh(new THREE.BoxGeometry(1, .55, .6), M.leather), 0, .275, 0); add(g, mesh(new THREE.BoxGeometry(1.02, .06, .62), M.wood), 0, .56, 0); for (const dx of [-.3, .3]) add(g, mesh(new THREE.BoxGeometry(.04, .58, .64), M.brass), dx, .29, 0); add(g, mesh(new THREE.BoxGeometry(.08, .06, .02), M.brass), 0, .5, .31); },
      { label: 'A trunk. Not theirs.', chapter: 'introduction', keep: true, reach: 1.6 });
    block(4.6, 11.2, 1, .6);
    pickup('tape1', 7.4, 1.16, 12.2, tapeBuild(M.labelTape1), { label: 'A Hi8 tape. In marker: ASH TREE LANE, 1.', chapter: 'ch1' });
    pickup('tape_measure', 1.1, .94, 8.6, g => { add(g, mesh(new THREE.BoxGeometry(.075, .07, .035), M.yellow), 0, .035, 0); add(g, mesh(new THREE.BoxGeometry(.4, .002, .016), M.paper), .25, .01, 0); add(g, mesh(new THREE.BoxGeometry(.012, .02, .02), M.metal), .45, .01, 0); }, { label: 'A tape measure, left open on the counter.', tool: 'tape', reach: 2 });
    pickup('tape2', 7, .02, 2.6, tapeBuild(M.labelTape2), { label: 'A Hi8 tape. In marker: 5½.', chapter: 'ch3' });
    pickup('photo', 3.95, .345, .47, g => { const p = add(g, mesh(new THREE.PlaneGeometry(.1, .05), M.tagPhoto), 0, .003, 0); p.rotation.x = -Math.PI / 2; p.rotation.z = -.4; p.material.side = THREE.DoubleSide; add(g, mesh(new THREE.BoxGeometry(.11, .002, .13), M.white), 0, .001, 0).rotation.y = -.4; }, { label: 'A photograph, face down. On the back, in pencil: K., 1989.', chapter: 'karen' });
    pickup('samples', 3.9, .77, 8.75, g => { const bag = add(g, mesh(new THREE.BoxGeometry(.14, .05, .1), new THREE.MeshStandardMaterial({ color: 0xcfd2d6, roughness: .3, transparent: true, opacity: .75 })), 0, .025, 0); bag.rotation.y = .3; add(g, mesh(new THREE.BoxGeometry(.11, .025, .08), M.ash), 0, .02, 0).rotation.y = .3; const tag = add(g, mesh(new THREE.PlaneGeometry(.09, .045), M.tagSample), .06, .004, .07); tag.rotation.x = -Math.PI / 2; tag.rotation.z = .9; tag.material.side = THREE.DoubleSide; }, { label: 'A specimen bag of gray dust, tagged in Reston’s hand.', chapter: 'samples' });
    const frontDoor = pickup('front_door', 2.5, 1, 12.92, g => { add(g, mesh(boxUV(new THREE.BoxGeometry(1, 2.05, .06), 1, 2.05, .06, 1), M.wood), 0, 0, 0); for (const y of [.55, -.15, -.75]) add(g, mesh(new THREE.BoxGeometry(.7, .45, .012), M.wood), 0, y, .035); add(g, mesh(new THREE.SphereGeometry(.03, 10, 8), M.brass), .38, -.05, .05); add(g, mesh(new THREE.BoxGeometry(.06, .11, .01), M.brass), .38, -.2, .035); }, { label: 'The front door.', door: 'front', reach: 1.8 });
    block(2.5, 12.95, 1, .2);

    // the measuring: inside, wall to wall along the hall; then outside, the same wall, leaning out of the children's window
    const FRAC = n16 => ({ 4: 'and a quarter', 5: 'and five-sixteenths', 6: 'and three-eighths', 7: 'and seven-sixteenths', 8: 'and a half', 9: 'and nine-sixteenths', 10: 'and five-eighths' })[Math.min(10, n16)] || 'and a little';
    let measurePickups = null, tapeLine = null;
    function placeMeasuring() {
      if (measurePickups) return;
      const mark = (id, x, y, z, ry, label) => pickup(id, x, y, z, g => { const m = add(g, mesh(new THREE.PlaneGeometry(.012, .09), M.dark), 0, 0, 0); m.rotation.y = ry; const t = add(g, mesh(new THREE.PlaneGeometry(.05, .006), M.dark), 0, .03, 0); t.rotation.y = ry; }, { label, measure: id, keep: true, reach: 1.9 });
      measurePickups = [
        mark('measure_in', 13.9, .95, 4.65, -Math.PI / 2, 'A pencil mark on the east wall of the hall. Hook the tape here and walk it to the west wall.'),
        mark('measure_out', 13.9, 1.3, 2.4, -Math.PI / 2, 'The window. Lean out and run the tape along the outside of the same wall.')
      ];
      measurePickups[1].visible = false; measurePickups[1].userData.hidden = true;
    }
    function measure(which) {
      const n16 = (found.has('ch3') ? 5 : 4) + store.get('endings', 0); // it has grown since the morning, and it grows between visits
      if (which === 'measure_in') {
        Sound.tapeZip(1.3);
        if (!tapeLine) { tapeLine = new THREE.Mesh(new THREE.BoxGeometry(1, .004, .016), M.yellow); scene.add(tapeLine); }
        tapeLine.visible = true; tapeLine.userData.t = 0;
        S.measuredIn = true;
        say(`Inside, wall to wall: forty-five feet eleven ${FRAC(n16)} inches.`, 7000);
        if (measurePickups && measurePickups[1].userData.hidden) { measurePickups[1].visible = true; measurePickups[1].userData.hidden = false; setTimeout(() => say('Now the same wall from the outside. The window in the children’s room opens.', 7000), 7200); }
        else if (found.has('ch2') && !S.remeasured) { S.remeasured = true; setTimeout(() => say(n16 > 4 ? 'It was a quarter of an inch this morning.' : 'The same quarter of an inch. It is still there.', 6000), 7200); }
      } else {
        if (!S.measuredIn) { say('Measure the inside first. The pencil mark in the hall.', 5000); return; }
        Sound.tapeZip(1.6);
        say('Outside, the same wall: forty-five feet eleven inches.', 5000);
        if (!found.has('ch2')) setTimeout(() => { say(n16 > 4 ? 'The inside is bigger than the outside. By more than it was.' : 'The inside is bigger than the outside. By a quarter of an inch.', 6000); setTimeout(() => unlock('ch2'), 3500); }, 5200);
        else setTimeout(() => say('The inside is still bigger than the outside.', 5000), 5200);
      }
    }
    // Delial, face down
    pickup('delial', 11.2, .421, 7.72, g => { add(g, mesh(new THREE.BoxGeometry(.13, .003, .1), M.white), 0, .0015, 0).rotation.y = .5; }, { label: 'A photograph, face down. On the back, in pencil: Delial.', say: 'You do not turn it over. Navidson never could either.', keep: true, reach: 1.8 });
    // the second visit: a door that was not here last time
    if (store.get('endings', 0) > 0) pickup('new_door', 6.09, 1.02, 9.7, g => { add(g, mesh(new THREE.BoxGeometry(.05, 2.04, .9), M.wood), 0, 0, 0); add(g, mesh(new THREE.SphereGeometry(.03, 10, 8), M.brass), .05, -.02, .35); }, { label: 'A door. It was not here last time.', say: 'It opens onto the wall behind it. Plaster, then brick, then nothing you can get a fingernail into.', keep: true, reach: 1.8 });

    // in the hallway, placed once it exists
    let mazePickups = [];
    let relayLantern = null, relayGlow = null, relayBlocks = [];
    const relaySrc = source(0, .5, 0, 0xffa858, 0, 9);
    let mazeDecor = [], blueBoxTex = null;
    function blueBox() { // the book's blue-framed box, on a wall: a list of what the house does not have
      if (blueBoxTex) return blueBoxTex;
      const c = document.createElement('canvas'); c.width = 640; c.height = 470; const cx = c.getContext('2d');
      cx.strokeStyle = '#3552d8'; cx.lineWidth = 7; cx.strokeRect(10, 10, 620, 450);
      cx.fillStyle = 'rgba(20, 22, 30, .88)'; cx.font = '23px "Courier Prime", Courier, monospace';
      const words = 'Not in here: no light fixtures, no switches, no outlets, no vents, no radiators, no windows, no sills, no molding, no trim, no hinges, no knobs, no locks, no nails, no screws, no paint, no paper, no carpet, no tile, no dust but the gray kind, no corners that meet quite square, no draft, no smell, no echo that comes back when it should, no second way out, no floor plan that agrees with the last one, and no end that anyone has reached and come back to describe.'.split(' ');
      let line = '', y = 50; for (const w of words) { if (cx.measureText(line + w).width > 555) { cx.fillText(line, 30, y); y += 30; line = ''; } line += w + ' '; } cx.fillText(line, 30, y);
      blueBoxTex = new THREE.CanvasTexture(c); blueBoxTex.colorSpace = THREE.SRGBColorSpace; blueBoxTex.anisotropy = 4;
      return blueBoxTex;
    }
    function placeMazePickups() {
      for (const p of mazePickups) { scene.remove(p); dropPickup(p); }
      mazePickups = [];
      for (const m of mazeDecor) scene.remove(m); mazeDecor = [];
      const gx = i => G.x0 + (i + .5) * G.T, gz = j => G.z0 + (j + .5) * G.T;
      if (G.phase === 'long') { // on the north wall of Holloway's corridor, some way in
        for (let i = 44; i < 110; i++) {
          let j = 77; while (j > 60 && tileAt(i, j) === 0) j--;
          if (![i - 1, i, i + 1].every(ii => tileAt(ii, j) === 1 && tileAt(ii, j + 1) === 0)) continue;
          const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .955), new THREE.MeshStandardMaterial({ map: blueBox(), transparent: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }));
          m.position.set(gx(i), 1.45, G.z0 + (j + 1) * G.T + .004); scene.add(m); mazeDecor.push(m); break;
        }
      }
      const put = p => { if (found.has(p.userData.chapter) && !p.userData.keep) { scene.remove(p); dropPickup(p); return; } mazePickups.push(p); };
      // the fishing line, tied off at the door: Navidson's, on the first trip, and everyone's after
      if (G.phase !== 'empty') put(pickup('spool', G.x0 + .35, .02, 9.3, g => { add(g, mesh(new THREE.CylinderGeometry(.06, .06, .05, 12), M.paper), 0, .025, 0); add(g, mesh(new THREE.BoxGeometry(60, .004, .004), M.paper), 30, .03, 0); }, { label: 'A spool of fishing line, tied off at the door frame.', say: 'As long as the line holds, the way back is simple.', keep: true, reach: 1.4 }));
      if (G.phase !== 'long') { // no Hall, no post at the top of the stairs
        if (relayLantern) relayLantern.visible = false; relaySrc.intensity = 0; if (relayGlow) relayGlow.visible = false;
        for (const c of relayBlocks) { const k = colliders.indexOf(c); if (k >= 0) colliders.splice(k, 1); } relayBlocks = [];
        if (G.phase === 'a') put(pickup('navidson_cam', gx(G.L + 3), .01, gz(80), g => { add(g, mesh(new THREE.BoxGeometry(.2, .1, .11), M.plastic), 0, .05, 0).rotation.y = -.5; add(g, mesh(new THREE.CylinderGeometry(.03, .035, .06, 12), M.dark), -.09, .06, -.07).rotation.z = Math.PI / 2; add(g, mesh(new THREE.PlaneGeometry(.05, .022), M.white), .02, .101, .01).rotation.set(-Math.PI / 2, 0, -.5); }, { label: 'Navidson’s Hi8, set down on the floor. The tape inside is marked A.', chapter: 'explA' }));
        if (G.phase === 'empty') put(pickup('bicycle', gx(G.low[0] - 3), 0, gz(77) + .55, g => { for (const dx of [-.55, .55]) add(g, mesh(new THREE.TorusGeometry(.32, .014, 6, 28), M.metal), dx, .03, 0).rotation.x = Math.PI / 2; add(g, mesh(new THREE.BoxGeometry(.9, .03, .03), M.dark), 0, .05, .02).rotation.y = .08; add(g, mesh(new THREE.BoxGeometry(.5, .03, .03), M.dark), .1, .05, .18).rotation.y = -.9; add(g, mesh(new THREE.BoxGeometry(.4, .03, .03), M.dark), -.2, .05, .2).rotation.y = .7; add(g, mesh(new THREE.CylinderGeometry(.02, .02, .3, 8), M.dark), .05, .05, .32).rotation.x = Math.PI / 2; add(g, mesh(new THREE.BoxGeometry(.22, .05, .08), M.leather), -.1, .06, .36); g.rotation.y = .5; }, { label: 'Navidson’s bicycle, left where the passage got too small for it.', say: 'He rode for days. Then the house made him crawl.', keep: true, reach: 2.4 }));
        return;
      }
      // the page about echoes lies in the first room off the corridor
      let firstDoor = null;
      for (let i = 10; i < 58 && !firstDoor; i++) { if (tileAt(i, 75) === 0) firstDoor = [i, -1]; else if (tileAt(i, 79) === 0) firstDoor = [i, 1]; }
      const pd = firstDoor || [20, -1];
      const pj = pd[1] < 0 ? 70 : 84;
      G.firstDoor = pd[0]; // the door the page lies behind is one the house does not take away before you have read it
      put(pickup('page_echo', gx(pd[0]), .01, gz(pj), pageBuild(M.pageEcho), { label: 'A page in Zampanò’s hand. It is about echoes.', chapter: 'ch4' }));
      // Tom's post at the top of the stairs: a lantern, a recorder, and the only light in the Hall that is not yours
      const rx = G.stair.x - 4.1, rz = G.stair.z + .8;
      if (!relayLantern) {
        relayLantern = model('lantern', { size: .5, x: rx + .55, z: rz, ry: .8, onLoad: s => { s.traverse(o => { if (o.isMesh && o.material && /glass|lamp|light/i.test(o.material.name || '')) { o.material.emissive = new THREE.Color(0xffa040); o.material.emissiveIntensity = 1.2; } }); } });
        relaySrc.pos.set(rx + .55, .5, rz);
        relayGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: moteTex, color: 0xffb266, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); relayGlow.scale.set(1.2, 1.2, 1); relayGlow.position.set(rx + .55, .42, rz); scene.add(relayGlow);
        const seat = new THREE.Mesh(new THREE.BoxGeometry(.4, .04, .4), M.metal); seat.position.set(rx - .5, .42, rz); shadowed(seat); scene.add(seat); stat(seat);
        for (const [dx, dz] of [[-.17, -.17], [.17, -.17], [-.17, .17], [.17, .17]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .42, 6), M.metal); l.position.set(rx - .5 + dx, .21, rz + dz); scene.add(l); stat(l); }
        const thermos = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .26, 12), M.metal); thermos.position.set(rx - .1, .13, rz + .35); shadowed(thermos); scene.add(thermos); stat(thermos);
      }
      relayLantern.visible = true; relaySrc.intensity = found.has('tom') ? 0 : 3.2; relayGlow.visible = !found.has('tom');
      if (!relayBlocks.length) { block(rx + .55, rz, .4, .4); block(rx - .5, rz, .4, .4); relayBlocks = colliders.slice(-2); }
      put(pickup('tom', rx, .01, rz + .05, g => { const r = model('tape_recorder', { size: .42, axis: 'z' }); scene.remove(r); r.position.set(0, 0, 0); r.rotation.y = -.3; g.add(r); add(g, mesh(new THREE.PlaneGeometry(.1, .04), M.labelTom), .02, .318, -.06).rotation.set(-Math.PI / 2, 0, -.3); const p = add(g, mesh(new THREE.PlaneGeometry(.21, .3), M.pageTom), .3, .004, .1); p.rotation.set(-Math.PI / 2, 0, .6); p.material.side = THREE.DoubleSide; }, { label: 'A tape recorder, labeled TOM, at the lip of the well. Beside it, pages of jokes.', chapter: 'tom', reach: 2.5 }));
      put(pickup('cache', gx(96), 0, gz(76.3), g => {
        add(g, mesh(new THREE.BoxGeometry(.5, .35, .4), M.cardboard), 0, .175, 0).rotation.z = .5;
        const b0 = model('water_bottle', { size: .25, onLoad: sc => { for (let k = 1; k < 5; k++) { const c = sc.clone(); const h = new THREE.Group(); h.add(c); h.position.set(-.45 + k * .22, k % 2 ? .05 : 0, .35 + hash(k) * .3); h.rotation.set(k % 2 ? Math.PI / 2 : 0, hash(k + 3) * 6, 0); g.add(h); } } }); scene.remove(b0); b0.position.set(-.45, 0, .35 + hash(0) * .3); b0.rotation.y = hash(3) * 6; g.add(b0);
        add(g, mesh(new THREE.CylinderGeometry(.09, .09, .05, 12), M.paper), .5, .025, -.2);
        for (let k = 0; k < 3; k++) add(g, mesh(new THREE.BoxGeometry(.05, .014, .05), M.dark), .3 + k * .07, .007, -.4 + hash(k + 7) * .1);
      }, { label: 'A cache of supplies, torn open. Water, batteries, nothing eaten.', chapter: 'ch5' }));
      put(pickup('map', G.stair.x - 4.8, .01, G.stair.z - 2.4, pageBuild(M.map, .42, .32), { label: 'A hand-drawn map. It stops at the stairs.', chapter: 'explorations' }));
      if (!S.quarterAt) put(pickup('quarter', G.stair.x - WELL - .6, .012, G.stair.z + 1.7, g => { add(g, mesh(new THREE.CylinderGeometry(.012, .012, .002, 16), M.metal), 0, .001, 0); }, { label: 'A quarter. Drop it into the well and listen.', quarter: true, reach: 1.6 }));
    }
    let stairPickups = { markers: null, camera: null, jed: null, hollEnd: null };
    function placeStairPickups() {
      if (!stairPickups.markers && !found.has('ch6')) {
        const [x, y, z] = onStair(8);
        stairPickups.markers = pickup('markers', x, y, z, g => { for (let k = 0; k < 6; k++) { const s = add(g, mesh(new THREE.PlaneGeometry(.05, .3), M.orange), (hash(k) - .5) * .7, .005, (hash(k + 9) - .5) * .7); s.rotation.x = -Math.PI / 2; s.rotation.z = hash(k + 3) * 3; } }, { label: 'Neon markers. Shredded.', chapter: 'ch6', stairDepth: 8 });
      }
      if (!stairPickups.jed) {
        const [x, y, z] = onStair(22);
        stairPickups.jed = pickup('jed', x, y, z, g => { add(g, mesh(new THREE.BoxGeometry(.14, .025, .1), new THREE.MeshStandardMaterial({ color: 0x3a1c1c, roughness: 1 })), 0, .012, 0).rotation.y = .6; add(g, mesh(new THREE.BoxGeometry(.06, .015, .06), M.white), .1, .008, .05); }, { label: 'A bandage, stiff with blood. Jed kept Wax alive here for two days.', say: 'Two days. He talked to him the whole time, so that he would stay.', stairDepth: 22 });
      }
      if (!stairPickups.hollEnd) {
        // his markers and his shell casings, lower than anyone else went
        for (const [d, r, what] of [[34, 1.2, 'm'], [36.5, 2.1, 'c'], [39, 1.5, 'm'], [41.5, 2.4, 'c'], [44, 1.1, 'c'], [46.5, 1.8, 'm'], [49, 2.2, 'c']]) {
          const [x, y, z] = onStair(d, r);
          const m = what === 'm' ? new THREE.Mesh(new THREE.PlaneGeometry(.05, .28), M.orange) : new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .045, 8), M.brass);
          if (what === 'm') { m.rotation.x = -Math.PI / 2; m.rotation.z = hash(d) * 3; m.position.set(x, y + .004, z); } else { m.rotation.z = Math.PI / 2; m.rotation.y = hash(d) * 6; m.position.set(x, y + .006, z); }
          scene.add(m);
        }
        const [x, y, z, a] = onStair(52, 1.3);
        stairPickups.hollEnd = pickup('holloway_end', x, y, z, g => {
          add(g, mesh(new THREE.BoxGeometry(.95, .035, .045), M.dark), 0, .025, 0).rotation.y = .9; add(g, mesh(new THREE.BoxGeometry(.32, .07, .06), M.wood), -.36, .035, .3).rotation.y = .9;
          for (let k = 0; k < 4; k++) add(g, mesh(new THREE.CylinderGeometry(.006, .006, .045, 8), M.brass), .2 + hash(k) * .3, .006, -.1 + hash(k + 5) * .3).rotation.z = Math.PI / 2;
        }, { label: 'A rifle, empty. Four shells. The column is scratched at the height of a man’s hands.', stairDepth: 52, keep: true });
        // the scratches, on the column, facing the tread
        const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; const cx = cv.getContext('2d');
        cx.strokeStyle = 'rgba(235, 232, 225, .85)'; cx.lineCap = 'round';
        for (let k = 0; k < 26; k++) { const x0 = 40 + hash(k) * 176, y0 = 30 + hash(k + 40) * 120; cx.lineWidth = 1 + hash(k + 9) * 2.2; cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x0 + (hash(k + 3) - .5) * 30, y0 + 50 + hash(k + 7) * 70); cx.stroke(); }
        const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
        const scr = new THREE.Mesh(new THREE.CylinderGeometry(.426, .426, .8, 16, 1, true, Math.PI / 2 - a - .45, .9), new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: .1, roughness: .9, depthWrite: false }));
        scr.position.set(G.stair.x, y + 1.05, G.stair.z); scene.add(scr);
      }
      if (!stairPickups.camera && !found.has('ch7')) {
        const [x, y, z, a] = onStair(30);
        stairPickups.camera = pickup('holloway_cam', x, y, z, g => { add(g, mesh(new THREE.BoxGeometry(.24, .12, .12), M.plastic), 0, .06, 0).rotation.y = .7; add(g, mesh(new THREE.CylinderGeometry(.035, .04, .07, 12), M.dark), .13, .07, .06).rotation.z = Math.PI / 2; add(g, mesh(new THREE.PlaneGeometry(.075, .028), M.labelHolloway), 0, .121, 0).rotation.set(-Math.PI / 2, 0, .7); g.rotation.y = -a; }, { label: 'A Hi8 camera. Its battery is dead. The tape inside is not.', chapter: 'ch7', stairDepth: 30 });
      }
    }
    let tornPickups = false;
    function placeTornPickups() {
      if (tornPickups) return; tornPickups = true;
      const put = p => { if (found.has(p.userData.chapter)) { scene.remove(p); dropPickup(p); } };
      put(pickup('radio', 12.6, 0, 8.4, g => { const r = model('radio', { size: .23 }); scene.remove(r); r.position.set(0, 0, 0); r.rotation.y = -.6; g.add(r); add(g, mesh(new THREE.BoxGeometry(.012, .012, .012), M.led), .06, .12, .11); }, { label: 'Tom’s radio. It is still on.', chapter: 'ch8', reach: 2.4 }));
      put(pickup('karen_tapes', 5.92, .345, .46, g => { for (let k = 0; k < 3; k++) add(g, mesh(new THREE.BoxGeometry(.19, .025, .1), M.tape), 0, .0125 + k * .027, 0).rotation.y = (k - 1) * .15; add(g, mesh(new THREE.PlaneGeometry(.13, .05), M.labelKaren), 0, .082, 0).rotation.set(-Math.PI / 2, 0, .3); }, { label: 'VHS tapes, labeled in Karen’s hand: WHAT SOME HAVE THOUGHT.', chapter: 'ch9' }));
      // the rigging Tom built at the top of the stairs, for the wounded
      put(pickup('rig', G.stair.x + 3.7, 0, G.stair.z, g => {
        for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3; const leg = add(g, mesh(new THREE.CylinderGeometry(.03, .035, 2.2, 8), M.wood), Math.cos(a) * .5, 1.05, Math.sin(a) * .5); leg.rotation.set(Math.sin(a) * .42, 0, -Math.cos(a) * .42); }
        add(g, mesh(new THREE.TorusGeometry(.12, .03, 8, 20), M.metal), 0, 2.02, 0).rotation.x = Math.PI / 2;
        add(g, mesh(new THREE.TorusGeometry(.2, .04, 8, 24), M.rope), .6, .04, .3).rotation.x = Math.PI / 2;
        add(g, mesh(new THREE.TorusGeometry(.22, .035, 8, 24), M.rope), .55, .11, .32).rotation.x = Math.PI / 2;
        add(g, mesh(new THREE.CylinderGeometry(.012, .012, 2.0, 6), M.rope), 0, 1.0, 0);
      }, { label: 'A tripod and a pulley, roped to the lip of the well.', chapter: 'rescue', reach: 2.6 }));
    }

    /* ---------- the player ---------- */

    const P = { x: 3, z: 12.1, yaw: 0, pitch: 0, vx: 0, vz: 0, r: .3, air: 0, airV: 0, fallV: 0, bob: 0, walked: 0, stepAcc: 0, inMaze: false, region: 'house', lineOut: 0, deepest: 0 };
    const keys = new Set();
    const KEYMAP = { KeyW: 'f', KeyZ: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', KeyQ: 'l', KeyD: 'r', ArrowLeft: 'tl', ArrowRight: 'tr', PageUp: 'pu', PageDown: 'pd', ShiftLeft: 'run', ShiftRight: 'run' };
    addEventListener('keydown', e => {
      if (!game.started || game.ended) return;
      if (!journal.hidden || !$('#dark').hidden) return;
      if (KEYMAP[e.code]) { keys.add(KEYMAP[e.code]); e.preventDefault(); }
      if ((e.code === 'Enter' || e.code === 'Space') && e.target.closest && e.target.closest('button, a, input')) return; // the control has it
      if (e.code === 'KeyE' || e.code === 'Enter') { if (target) { interact(target); e.preventDefault(); } }
      if (e.code === 'Space') { jump(); e.preventDefault(); }
      if (e.code === 'KeyJ') { openJournal(jPage.dataset.id); e.preventDefault(); }
      if (e.code === 'KeyC') { takeStill(); e.preventDefault(); }
      if (e.code === 'KeyO') { openSettings(); e.preventDefault(); }
      if (e.code === 'KeyI') { const inv = !store.get('invert', false); store.set('invert', inv); say(inv ? 'Mouse inverted. I again to put it back.' : 'Mouse as it was.', 3000); e.preventDefault(); }
    });
    addEventListener('keyup', e => { if (KEYMAP[e.code]) keys.delete(KEYMAP[e.code]); });
    addEventListener('blur', () => keys.clear());

    canvas.addEventListener('click', () => {
      if (game.paused || game.ended) return;
      if (!touch && !document.pointerLockElement) { lock(); return; }
      if (target) interact(target);
    });
    const lock = () => { try { const r = canvas.requestPointerLock?.(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* no pointer lock here */ } };
    hud.veil.addEventListener('click', () => { hud.veil.hidden = true; if (!touch) lock(); });
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement) hud.veil.hidden = true;
      else if (game.started && !game.paused && !game.ended && !touch && journal.hidden && $('#dark').hidden) hud.veil.hidden = false;
    });
    document.addEventListener('mousemove', e => {
      if (!document.pointerLockElement) return;
      const k = .0021 * SET.sens; P.yaw -= e.movementX * k; P.pitch = clamp(P.pitch - e.movementY * k * (store.get('invert', false) ? -1 : 1), -1.35, 1.35);
    });
    // touch: left half walks, the rest looks
    const fingers = new Map();
    let stick = { dx: 0, dz: 0 };
    canvas.addEventListener('touchstart', e => {
      for (const t of e.changedTouches) {
        const move = t.clientX < innerWidth * .45;
        fingers.set(t.identifier, { x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY, t0: performance.now(), move });
        if (move && hud.stick) { hud.stick.hidden = false; hud.stick.style.left = t.clientX + 'px'; hud.stick.style.top = t.clientY + 'px'; hud.stick.firstElementChild.style.transform = 'translate(-50%, -50%)'; } // the stick shows where the finger landed
      }
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        const f = fingers.get(t.identifier); if (!f) continue;
        if (f.move) { stick.dx = clamp((t.clientX - f.x0) / 60, -1, 1); stick.dz = clamp((t.clientY - f.y0) / 60, -1, 1); if (hud.stick) hud.stick.firstElementChild.style.transform = `translate(calc(-50% + ${stick.dx * 34}px), calc(-50% + ${stick.dz * 34}px))`; }
        else { P.yaw -= (t.clientX - f.x) * .0048 * SET.sens; P.pitch = clamp(P.pitch - (t.clientY - f.y) * .0048 * SET.sens, -1.35, 1.35); }
        f.x = t.clientX; f.y = t.clientY;
      }
      e.preventDefault();
    }, { passive: false });
    const endTouch = e => {
      for (const t of e.changedTouches) {
        const f = fingers.get(t.identifier); if (!f) continue;
        if (f.move) { stick = { dx: 0, dz: 0 }; if (hud.stick) hud.stick.hidden = true; }
        if (performance.now() - f.t0 < 300 && Math.hypot(t.clientX - f.x0, t.clientY - f.y0) < 12 && target && !game.paused && !game.ended) interact(target); // a tap
        fingers.delete(t.identifier);
      }
    };
    canvas.addEventListener('touchend', endTouch); canvas.addEventListener('touchcancel', endTouch);
    hud.prompt.addEventListener('click', () => { if (target) interact(target); });
    hud.quality.addEventListener('click', () => {
      Q.low = !Q.low; store.set('low', Q.low); syncQuality();
      prCap = Q.low ? 1 : 1.25; slow = 0; renderer.setPixelRatio(dpr()); resize();
      const s = Q.low ? 1024 : 2048; torch.shadow.mapSize.set(s, s); if (torch.shadow.map) { torch.shadow.map.dispose(); torch.shadow.map = null; }
      bloom.enabled = !Q.low;
    });

    function collide() {
      const r = P.r;
      const push = (x0, x1, z0, z1) => {
        const cx = clamp(P.x, x0, x1), cz = clamp(P.z, z0, z1);
        let dx = P.x - cx, dz = P.z - cz; const d2 = dx * dx + dz * dz;
        if (d2 >= r * r) return;
        if (d2 < 1e-9) { // inside: leave by the nearest face
          const e = [P.x - x0, x1 - P.x, P.z - z0, z1 - P.z], k = e.indexOf(Math.min(...e));
          if (k === 0) P.x = x0 - r; else if (k === 1) P.x = x1 + r; else if (k === 2) P.z = z0 - r; else P.z = z1 + r;
          return;
        }
        const d = Math.sqrt(d2); P.x += dx * (r - d) / d; P.z += dz * (r - d) / d;
      };
      for (let pass = 0; pass < 2; pass++) {
        if (P.x < G.x0 + 1) for (const c of colliders) push(c.x0, c.x1, c.z0, c.z1);
        if (G.built && P.x > G.x0 - 1) {
          const i = Math.floor((P.x - G.x0) / G.T), j = Math.floor((P.z - G.z0) / G.T);
          for (let jj = j - 1; jj <= j + 1; jj++) for (let ii = Math.max(0, i - 1); ii <= i + 1; ii++) if (tileAt(ii, jj) === 1) push(G.x0 + ii * G.T, G.x0 + (ii + 1) * G.T, G.z0 + jj * G.T, G.z0 + (jj + 1) * G.T); // west of the first tile is the house, and its walls are colliders of their own
          for (const c of colliders) if (c.x0 > G.x0) push(c.x0, c.x1, c.z0, c.z1);
        }
      }
    }

    /* ---------- story wiring ---------- */

    const S = { closet: false, hallway: false, torn: false, fleeing: false, explore5: false, arrived: false, grewA: false, turnA: false, regrow: null, regrowText: null, collapsePending: false, collapseT: -1, collapsed: false, doorOpen: false, doorAjar: false, quarterAt: 0, stairShort: false, saidDoor: false, saidAnte: false, farOut: false, saidCam: false, saidBottom: false, falling: 0, gone: 0, clocked: false, measuredIn: false, remeasured: false, pets: false, hollEnd: false, breathN: 0, breath: null, shape: false, kids: 0, radioT: 20, joke: 0, loops: 0, letGo: false, shrinkT: -1, shrunk: false, far: 0 };
    const mazePhase = () => found.has('ch10') && !found.has('ch11') ? 'karen' : found.has('ch9') ? 'empty' : found.has('ch7') ? 'short' : found.has('explA') ? 'long' : 'a';
    function openCloset(silent) {
      if (S.closet) return; S.closet = true;
      closetPlug.open(); shadowRef.force = true;
      if (!silent) { Sound.creak(); Sound.play('door_open', { gain: .5, rate: .8, at: .4 }); setTimeout(() => say('Somewhere in the house, a door that was not there.'), 900); }
    }
    function openHallway(silent) {
      if (S.hallway) return; S.hallway = true;
      hallwayPlug.open();
      buildMaze(mazePhase()); placeMazePickups();
      for (let k = 0; k < 11; k++) { const f = k / 10, p = new THREE.Mesh(new THREE.CircleGeometry(.035, 8), M.pawprint); p.rotation.x = -Math.PI / 2; p.scale.y = 1.35; p.position.set(10.4 + f * 3.3 + (k % 2 ? .06 : -.06), .006, 9.6 - f * 1.05); scene.add(p); stat(p); } // prints, going in
      placeSteps(true); placeStairPickups(); bakeStatics();
      if (!silent) { const home = f => () => { if (!S.karen && !S.vermont) f(); }; Sound.growl(.35); setTimeout(home(() => say('The living room has a new door. Behind it, the yard should be.')), 1200); setTimeout(home(() => say('The dog goes in first. Then the cat, as if it had been called.', 6500)), 9000); setTimeout(home(() => { Sound.knock(); say('Scratching at the back door. From the yard. The dog is outside, and nothing in there goes outside.', 8000); }), 26000); }
    }
    function tearHouse(silent) {
      if (S.torn) return; S.torn = true;
      if (G.built && (G.phase === 'long' || G.phase === 'a')) { buildMaze('short'); placeMazePickups(); } // a house reopened later keeps its later hallway
      const rand = rng(41);
      for (const w of houseWalls) {
        if (w.tag === 'plug' || w.tag === 'lintel' || w.tag === 'sill') continue;
        if (['hall', 'kitchen-living'].includes(w.tag) && rand() < .5) { statics.delete(w.mesh); w.mesh.removeFromParent(); const k = colliders.indexOf(w.col); if (k >= 0) colliders.splice(k, 1); }
      }
      lean().tear();
      houseCeiling.material = M.ashFloor; houseCeiling.position.y = H + .6; houseCeiling.rotation.z = .04; lean().ceiling();
      for (const l of lamps) { l.src.intensity = 0; l.bulb.visible = false; }
      bedsideSrc.intensity = 0;
      const pane = glassPanes.reduce((a, b) => { const pa = new THREE.Vector3(), pb = new THREE.Vector3(); a.getWorldPosition(pa); b.getWorldPosition(pb); return pb.distanceTo(new THREE.Vector3(13.9, 1.55, 11.1)) < pa.distanceTo(new THREE.Vector3(13.9, 1.55, 11.1)) ? b : a; });
      pane.visible = false; model('glass_broken_window', { size: 1.25, x: 13.86, y: .93, z: 11.1, ry: Math.PI / 2, cast: false, onLoad: sc => sc.traverse(o => { if (o.isMesh && /glass/i.test(o.material.name || '')) { const m = o.material; m.transparent = true; m.opacity = .7; m.metalness = 0; m.roughness = .12; m.envMapIntensity = 2; m.emissive = new THREE.Color(0x9aa4b4); m.emissiveMap = m.map; m.emissiveIntensity = .55; m.alphaTest = .5; m.side = THREE.DoubleSide; m.needsUpdate = true; } }) }); // the cracks are drawn in the pane's texture: let them catch a little light of their own
      lamps[0].flicker = true; lamps[0].src.intensity = 2; lamps[0].bulb.visible = true;
      screenMat.uniforms.on.value = 1; tvSrc.intensity = 1.6;
      const pit = box(2.6, .3, 2.0, M.black, 9.4, -.16, 10.3); solid(pit, 2.6, 2.0); // leaves a way round it on every side
      const crack = new THREE.Mesh(new THREE.PlaneGeometry(.12, 6), M.black); crack.rotation.x = -Math.PI / 2; crack.rotation.z = .3; crack.position.set(4, .005, 8); scene.add(crack); stat(crack);
      placeTornPickups();
      bakeStatics();
      if (!silent) setTimeout(() => say('The house has moved.'), 800);
    }
    const regrow = (phase, text) => { S.regrow = phase; S.regrowText = text || null; }; // the hallway is rebuilt the next time the house is between you and it
    AFTER_READ = {
      ch2: () => openCloset(),
      ch3: () => openHallway(),
      explA: () => regrow('long', 'Karen wants it sealed. Navidson wants a camera on it. Holloway wants in.'),
      karen: () => say('She did not want to live in a house with a closed room in it. Then the house grew one.', 7000),
      explorations: () => say('The map ends at the stairs. So did the line.', 6000),
      samples: () => say('The dust is older than the house. Older than Virginia. Older, if the lab is right, than the earth.', 8000),
      tom: () => { relaySrc.intensity = 0; if (relayGlow) relayGlow.visible = false; if (relayLantern) relayLantern.traverse(o => { if (o.isMesh && o.material.emissive) o.material.emissiveIntensity = 0; }); Sound.knock(); setTimeout(() => say('The lantern has gone out. Tom kept it lit for days.', 6000), 700); },
      ch7: () => { S.fleeing = true; Sound.growl(1); shake = 1.4; torchDip = 1; setTimeout(() => say('Go back up. Now.', 6000), 1500); },
      rescue: () => { S.collapsePending = true; say('Everyone the rope reached came up. It did not reach everyone.', 7000); },
      collapse: () => say('Karen has the children in the car. Navidson is still filming.', 7000),
      ch8: () => say('Karen left with the children. Something of hers is still in the bedroom.', 7000),
      ch9: () => { S.explore5 = true; regrow('empty'); say('The doorway is still there. Navidson went back in alone.', 7000); },
      ch11: () => { unlock('letters', false); unlock('exhibits', false); unlock('index', false); }
    };
    /* your own exploration: what the counter kept */
    const stats = Object.assign({ deep: 0, line: 0, quarters: 0, dark: 0, turned: 0, stills: 0 }, store.get('stats', {}));
    const saveStats = () => store.set('stats', stats);
    let stills = store.get('stills', []); if (!Array.isArray(stills)) stills = [];
    let stillReq = false;
    function grabStill() { // Navidson is a photographer: the camcorder takes a still
      stillReq = false;
      const src = renderer.domElement, cv = document.createElement('canvas'); cv.width = 320; cv.height = 180;
      const k = Math.max(320 / src.width, 180 / src.height), w = src.width * k, h = src.height * k;
      const cx = cv.getContext('2d'); cx.drawImage(src, (320 - w) / 2, (180 - h) / 2, w, h);
      cx.fillStyle = 'rgba(255, 70, 60, .9)'; cx.font = '11px monospace'; cx.fillText(hud.rec.textContent, 10, 170);
      try { stills.push({ url: cv.toDataURL('image/jpeg', .7), rec: hud.rec.textContent }); stills = stills.slice(-12); store.set('stills', stills); } catch (e) { /* no room left: the still is not kept */ }
      stats.stills++; saveStats();
      hud.flash.classList.remove('go'); void hud.flash.offsetWidth; hud.flash.classList.add('go');
      Sound.click(); setTimeout(() => Sound.click(), 90);
      say(`Still ${stills.length}. It goes in the journal.`, 2200);
    }
    const takeStill = () => { if (!game.paused && !game.ended) stillReq = true; };

    /* Karen: she goes in to find him */
    let karenGlow = null, karenSrc = null, karenCall = 6;
    function startKaren(resumed) {
      S.karen = true; S.vermont = false; S.karenDone = false;
      S.regrow = null; S.regrowText = null; // nothing else is going to rebuild the hallway now
      if (G.built && G.phase !== 'karen') { buildMaze('karen'); placeMazePickups(); }
      P.x = 2.5; P.z = 15.6; P.yaw = 0; P.pitch = 0; P.vx = P.vz = 0; camY = 1.6;
      if (!karenGlow) {
        karenGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: moteTex, color: 0xff9a4a, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
        karenGlow.scale.set(.9, .9, 1); scene.add(karenGlow); karenSrc = source(0, 0, 0, 0xff9448, 0, 7);
      }
      const gx = G.x0 + 56; karenGlow.position.set(gx, .2, G.z0 + 77.5 * G.T); karenSrc.pos.set(gx, .35, G.z0 + 77.5 * G.T); karenSrc.intensity = 2.4; karenGlow.visible = true;
      Sound.pant(true);
      if (!resumed) card('<p class="card-kicker">Karen</p><p>She is afraid of the dark, and of small rooms. She has not been inside since the house closed. She goes in anyway.</p><p class="card-help">Her lamp is small. Find him.</p>', 9000);
      setTimeout(() => say('The front door is open. It opens outward now.', 6000), resumed ? 1500 : 9500);
    }
    function karenStep(dt) {
      if (P.vx > .2 && P.x > G.x0) P.x += P.vx * dt * 1.25; // every step she takes, the corridor gives up a little more
      const k = (P.x - G.x0) / 56;
      karenCall -= dt;
      if (karenCall <= 0 && P.x > G.x0) { karenCall = 8 + Math.random() * 4; Sound.voice({ pitch: 212, dur: .7, level: .5 }); say('“Will?”', 2200); }
      if (k > .3 && !S.kSaid1) { S.kSaid1 = true; say('It is shorter than it was a moment ago. It is letting her through.', 6000); }
      if (k > .62 && !S.kSaid2) { S.kSaid2 = true; say('A light on the floor, far ahead. Paper, burning.', 6000); }
      karenSrc.intensity = 2 + Math.random() * .9; karenGlow.scale.setScalar(.8 + Math.random() * .25);
      if (k > .97 && !S.karenDone) endKaren();
    }
    function endKaren() {
      S.karenDone = true;
      Sound.voice({ pitch: 208, dur: .9, level: .65 }); say('“Will.”', 3000);
      setTimeout(() => { hud.fall.classList.add('white', 'in'); Sound.swell(4.5); Sound.pant(false); }, 1600);
      setTimeout(() => { enterVermont(); }, 6400);
    }

    /* Vermont: daylight, snow, a small house the right size */
    const VX = -300, VZ = 0;
    let vermont = null;
    function crayon(draw) { // a child's drawing, in crayon
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 384; const cx = cv.getContext('2d');
      cx.fillStyle = '#f4f1e8'; cx.fillRect(0, 0, 512, 384); cx.lineCap = 'round'; cx.lineJoin = 'round';
      const line = (pts, col, w = 7) => { cx.strokeStyle = col; cx.lineWidth = w; cx.beginPath(); pts.forEach(([x, y], i) => { const jx = x + (Math.random() - .5) * 4, jy = y + (Math.random() - .5) * 4; i ? cx.lineTo(jx, jy) : cx.moveTo(jx, jy); }); cx.stroke(); };
      draw(line, cx);
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
    }
    function buildVermont() {
      if (vermont) return vermont;
      const g = new THREE.Group(); scene.add(g);
      const W = 7, D = 5, x0 = VX - W / 2, x1 = VX + W / 2, z0 = VZ - D / 2, z1 = VZ + D / 2;
      const wall = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.wall); m.position.set(x, y, z); shadowed(m); g.add(m); colliders.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 }); return m; };
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), M.floor); floor.rotation.x = -Math.PI / 2; floor.position.set(VX, 0, VZ); floor.receiveShadow = true; g.add(floor);
      const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), M.ceiling); ceil.rotation.x = Math.PI / 2; ceil.position.set(VX, H, VZ); g.add(ceil);
      // the north wall has a window onto the snow
      wall(W / 2 - .9, H, TH, x0 + (W / 2 - .9) / 2, H / 2, z0); wall(W / 2 - .9, H, TH, x1 - (W / 2 - .9) / 2, H / 2, z0);
      wall(1.8, .9, TH, VX, .45, z0); wall(1.8, H - 2.1, TH, VX, 2.1 + (H - 2.1) / 2, z0);
      wall(W, H, TH, VX, H / 2, z1); wall(TH, H, D, x0, H / 2, VZ); wall(TH, H, D, x1, H / 2, VZ);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2), M.glass); pane.position.set(VX, 1.5, z0); g.add(pane);
      const out = new THREE.Mesh(new THREE.PlaneGeometry(60, 20), new THREE.MeshBasicMaterial({ color: 0xc3ccd8, fog: false })); out.position.set(VX, 4, z0 - 14); g.add(out); // a low winter sky
      const treeline = (far, seed) => { const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const cx = c.getContext('2d'); // a painted row of pines, snow on the boughs
        for (let k = 0; k < 24; k++) { const x = (k / 24) * 1100 - 30 + hash(k + seed) * 30, h = 60 + hash(k * 3 + seed) * 110, w = h * (.32 + hash(k + seed * 7) * .1), base = 256;
          cx.fillStyle = far ? '#9aa4ad' : '#56626b'; cx.beginPath(); cx.moveTo(x, base - h); for (let t = 1; t <= 6; t++) { const y = base - h + (h * t) / 6, ww = (w * t) / 6; cx.lineTo(x + ww / 2 + 6, y - 8); cx.lineTo(x + ww / 3, y - 4); } cx.lineTo(x + w / 2, base); cx.lineTo(x - w / 2, base); for (let t = 6; t >= 1; t--) { const y = base - h + (h * t) / 6, ww = (w * t) / 6; cx.lineTo(x - ww / 3, y - 4); cx.lineTo(x - ww / 2 - 6, y - 8); } cx.closePath(); cx.fill();
          cx.fillStyle = far ? 'rgba(236,240,245,.35)' : 'rgba(236,240,245,.55)'; for (let t = 2; t <= 6; t += 2) { const y = base - h + (h * t) / 6, ww = (w * t) / 6; cx.fillRect(x - ww / 4, y - 9, ww / 2, 2); } }
        const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex; };
      for (const [far, d, h] of [[true, 13, 7], [false, 8, 6]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(40, h), new THREE.MeshBasicMaterial({ map: treeline(far, far ? 5 : 17), transparent: true, depthWrite: false, fog: false })); m.position.set(VX, h / 2 - .1, z0 - d); g.add(m); } // pines, gray with distance and snow
      const snowField = new THREE.Mesh(new THREE.PlaneGeometry(60, 12), new THREE.MeshBasicMaterial({ color: 0xe9edf2 })); snowField.rotation.x = -Math.PI / 2; snowField.position.set(VX, -.02, z0 - 6.2); g.add(snowField);
      // snow, falling past the window
      const n = 420, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = VX - 4 + Math.random() * 8; pos[i * 3 + 1] = Math.random() * 4; pos[i * 3 + 2] = z0 - .4 - Math.random() * 7; }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: .06, map: moteTex, transparent: true, opacity: 1, depthWrite: false })); snow.frustumCulled = false; g.add(snow);
      const inner = source(VX + 1.5, 2.1, VZ + 1.2, 0xffdcb0, 2.2, 8); inner.vermont = true; // the light of a room people live in
      // the children's drawings, on the south wall
      const drawings = [
        crayon((line, cx) => { line([[70, 300], [70, 170], [170, 90], [270, 170], [270, 300], [70, 300]], '#3b5bd6'); line([[150, 300], [150, 225], [195, 225], [195, 300]], '#c43b2f'); line([[270, 250], [500, 250]], '#222', 5); line([[270, 272], [500, 272]], '#222', 5); cx.fillStyle = '#222'; cx.font = 'bold 28px Comic Sans MS, cursive'; cx.fillText('OUR HOUSE', 60, 360); }),
        crayon((line) => { const pts = []; for (let a = 0; a < 26; a += .2) pts.push([256 + Math.cos(a) * (170 - a * 6), 190 + Math.sin(a) * (130 - a * 4.5)]); line(pts, '#444', 6); line([[256, 190], [258, 196]], '#e2a21a', 16); }),
        crayon((line, cx) => { const fig = (x, h, col) => { line([[x, 300 - h], [x, 300 - h * .35]], col); line([[x, 300 - h * .35], [x - 22, 300]], col); line([[x, 300 - h * .35], [x + 22, 300]], col); line([[x - 30, 300 - h * .7], [x + 30, 300 - h * .7]], col); cx.strokeStyle = col; cx.lineWidth = 6; cx.beginPath(); cx.arc(x, 300 - h - 20, 20, 0, Math.PI * 2); cx.stroke(); }; fig(110, 170, '#2f6fc4'); fig(220, 150, '#c43b8e'); fig(320, 100, '#2c9e4b'); fig(400, 85, '#e07a1a'); line([[440, 70], [500, 20]], '#f2c21a', 10); cx.fillStyle = '#f2c21a'; cx.beginPath(); cx.arc(470, 50, 26, 0, Math.PI * 2); cx.fill(); })
      ];
      drawings.forEach((tex, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.62, .46), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 })); m.position.set(VX - 1.5 + i * 1.05, 1.45 + (i % 2) * .08, z1 - .09); m.rotation.y = Math.PI; m.rotation.z = (i - 1) * .04; g.add(m); });
      // Reston's chair, against the east wall
      const chair = new THREE.Group(); chair.position.set(x1 - .45, 0, VZ + .9); chair.rotation.y = -Math.PI / 2 + .2;
      for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.TorusGeometry(.3, .018, 8, 32), M.metal); w.position.set(s * .27, .32, 0); w.rotation.y = Math.PI / 2; chair.add(w); const f = new THREE.Mesh(new THREE.TorusGeometry(.07, .015, 6, 16), M.dark); f.position.set(s * .2, .08, .38); f.rotation.y = Math.PI / 2; chair.add(f); }
      const seat = new THREE.Mesh(new THREE.BoxGeometry(.46, .05, .44), M.leather); seat.position.set(0, .48, .05); chair.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(.46, .5, .04), M.leather); back.position.set(0, .78, -.17); chair.add(back);
      chair.traverse(o => { if (o.isMesh) shadowed(o); }); g.add(chair); block(chair.position.x, chair.position.z, .7, .7);
      // a table, and the finished film on it
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, .05, .7), M.wood); top.position.set(VX + .6, .74, VZ + .4); shadowed(top); g.add(top);
      for (const [dx, dz] of [[-.55, -.3], [.55, -.3], [-.55, .3], [.55, .3]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.05, .72, .05), M.wood); l.position.set(VX + .6 + dx, .36, VZ + .4 + dz); g.add(l); }
      block(VX + .6, VZ + .4, 1.2, .7);
      pickup('record', VX + .6, .765, VZ + .4, gg => { add(gg, mesh(new THREE.BoxGeometry(.34, .12, .22), M.cardboard), 0, .06, 0).rotation.y = .2; for (let k = 0; k < 3; k++) add(gg, mesh(new THREE.BoxGeometry(.095, .017, .063), M.tape), -.05 + k * .05, .128 + k * .018, 0).rotation.y = .3 + k * .2; }, { label: 'A box of tapes. On the lid, in Karen’s hand: THE NAVIDSON RECORD.', finale: true, reach: 2 });
      vermont = { g, snow, z0 };
      return vermont;
    }
    function enterVermont(resumed) {
      buildVermont();
      S.vermont = true; S.karen = false; if (karenGlow) { karenGlow.visible = false; karenSrc.intensity = 0; }
      Sound.pant(false); Sound.ambience(false); Sound.weather(false); Sound.groan(false);
      if (!S.vwind) S.vwind = Sound.loop('wind', .1, 4);
      P.x = VX - 1.6; P.z = VZ + 1.3; P.yaw = Math.atan2(-(VX + .4 - P.x), -(VZ - 2.5 - P.z)); P.pitch = 0; P.vx = P.vz = 0; camY = 1.6; shadowRef.force = true;
      unlock('ch11', false); unlock('explSix', false);
      if (!resumed) {
        setTimeout(() => { hud.fall.classList.remove('in'); setTimeout(() => hud.fall.classList.remove('white'), 2600); }, 300);
        for (const [ms, text] of [[2500, 'Vermont. It has been snowing since before anyone woke.'], [9000, 'Karen is outside with the children. The house on Ash Tree Lane is a long way south, and the right size.'], [16500, 'Navidson has not picked up a camera since. The tapes are on the table.']]) setTimeout(() => { if (!game.ended) say(text, 6500); }, ms);
      }
    }

    // resume a house left half-explored
    if (found.has('ch2')) openCloset(true);
    if (found.has('ch3')) openHallway(true);
    if (found.has('ch7')) tearHouse(true);
    if (found.has('rescue')) applyCollapsed();
    if (found.has('ch9')) S.explore5 = true;
    for (const p of [...pickups]) if (p.userData.chapter && found.has(p.userData.chapter) && !p.userData.keep) { scene.remove(p); dropPickup(p); }
    if (found.has('ch11') && !store.get('again', false)) { game.ended = true; }

    let target = null;
    function findTarget() {
      const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
      let best = null, bd = 9;
      const py = camY;
      for (const p of pickups) {
        if (p.userData.stairDepth != null && !stair.active) continue;
        if (p.userData.hidden) continue;
        const dx = p.position.x - P.x, dz = p.position.z - P.z, dy = p.position.y - py;
        const d = Math.hypot(dx, dz, dy * .6), reach = p.userData.reach || 2.3;
        if (d > reach || d >= bd) continue;
        const dot = (dx * fx + dz * fz) / (Math.hypot(dx, dz) || 1);
        if (dot < .35 && d > .9) continue;
        best = p; bd = d;
      }
      if (best !== target) {
        target = best;
        if (target) { setText(hud.prompt, (touch ? '' : 'E · ') + target.userData.label); hud.prompt.hidden = false; }
        else hud.prompt.hidden = true;
      }
    }
    function interact(p) {
      const u = p.userData;
      Sound.init(); Sound.resume();
      if (u.door === 'front') {
        if (game.ended) { finish(); return; }
        if (S.doorOpen) { openFrontDoor(p); return; }
        say(found.has('ch1') ? 'The door does not open. You came in; the house decides when you go.' : 'It closed behind you. It does not open from this side.');
        return;
      }
      if (u.quarter) { dropQuarter(p); return; }
      if (u.finale) { Sound.click(); finish(); return; }
      if (u.tool === 'tape') { Sound.click(); scene.remove(p); dropPickup(p); target = null; hud.prompt.hidden = true; placeMeasuring(); say('Navidson measured everything. Start where the house is widest: the hall, wall to wall.', 8000); return; }
      if (u.measure) { if (!u.hidden) measure(u.measure); return; }
      const TAPE = { tape1: [118, 5], tape2: [118, 4], navidson_cam: [118, 6], holloway_cam: [96, 7], tom: [128, 6], karen_tapes: [212, 6], radio: [128, 5, true] }; // who is on the tape, for how long
      if (TAPE[u.id]) { const [pitch, dur, radio] = TAPE[u.id]; Sound.voice({ pitch, dur, radio: !!radio, level: .42, at: .5 }); }
      if (u.id === 'holloway_end') { if (!S.hollEnd) { S.hollEnd = true; Sound.voice({ pitch: 94, dur: 9, level: .5, at: 1 }); setTimeout(() => say('On the tape he says his name, and where he was born, and that he is sorry. Then, for a long time, he says nothing anyone would want to hear.', 9000, false, 'mirror'), 5500); } }
      if (u.say) say(u.say);
      if (u.chapter) {
        Sound.click();
        if (!u.keep) { scene.remove(p); dropPickup(p); target = null; hud.prompt.hidden = true; }
        if (u.id === 'trunk' && found.has('ch11')) { unlock('letters'); return; }
        unlock(u.chapter);
      }
    }

    /* the house closes: after the rescue, the rooms the family lives in come apart around them */
    /* the house closing: each wall is one line that leans and steps in as a whole; what hangs on it goes with it, and what stands against it is shoved */
    var leanNow; // declarations: a reopened house leans before this section runs
    function lean() { return leanNow || (leanNow = makeLean()); }
    function makeLean() {
      const state = new Map(); // line key: { t, a } where t is a step across the line and a a lean, both toward +z or +x
      const q = new THREE.Quaternion(), v = new THREE.Vector3(), X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(0, 0, 1);
      const key = (alongX, c) => (alongX ? 'x' : 'z') + c.toFixed(2);
      function lines() {
        const out = new Map();
        for (const w of houseWalls) {
          if (!w.mesh.parent) continue;
          const alongX = w.alongX, base = w.mesh.userData.base, c = base ? (alongX ? base.p.z : base.p.x) : (alongX ? w.mesh.position.z : w.mesh.position.x), k = key(alongX, c);
          let L = out.get(k); if (!L) out.set(k, L = { k, alongX, c, a0: Infinity, a1: -Infinity, walls: [], hangs: [] });
          const m = base ? (alongX ? base.p.x : base.p.z) : (alongX ? w.mesh.position.x : w.mesh.position.z);
          L.a0 = Math.min(L.a0, m - w.len / 2); L.a1 = Math.max(L.a1, m + w.len / 2); L.walls.push(w);
        }
        for (const L of out.values()) { L.ext = L.alongX ? (L.c < .1 || L.c > 12.9) : (L.c < .1 || L.c > 13.9); L.s = state.get(L.k) || { t: 0, a: 0 }; state.set(L.k, L.s); }
        return [...out.values()];
      }
      const baseOf = o => o.userData.base || (o.userData.base = { p: o.position.clone(), q: o.quaternion.clone() });
      function place(o, L, t, a) { // turn about the foot of the line, then step across
        const b = baseOf(o);
        q.setFromAxisAngle(L.alongX ? X : Z, L.alongX ? a : -a);
        if (L.alongX) { v.set(0, b.p.y, b.p.z - L.c).applyQuaternion(q); o.position.set(b.p.x + v.x, v.y, L.c + t + v.z); }
        else { v.set(b.p.x - L.c, b.p.y, 0).applyQuaternion(q); o.position.set(L.c + t + v.x, v.y, b.p.z + v.z); }
        o.quaternion.copy(q).multiply(b.q); o.updateMatrix();
      }
      function colliderOf(w, L, t, a) { // the foot steps across; the side it leans toward thickens to where your head would meet it
        const c = w.col; if (!c) return;
        if (!c.base) c.base = { x0: c.x0, x1: c.x1, z0: c.z0, z1: c.z1 };
        const lean = Math.sin(a) * 1.5;
        if (L.alongX) { c.z0 = c.base.z0 + t + Math.min(0, lean); c.z1 = c.base.z1 + t + Math.max(0, lean); }
        else { c.x0 = c.base.x0 + t + Math.min(0, lean); c.x1 = c.base.x1 + t + Math.max(0, lean); }
      }
      // what is in the house besides the walls, sorted once the furniture has arrived
      let sorted = null;
      const skip = new Set();
      const inHouse = b => b.min.x > -.4 && b.max.x < 14.4 && b.min.z > -.4 && b.max.z < 13.4 && b.max.y < 3.3 && b.min.y > -.2;
      function sort(ls) {
        const wallMeshes = new Set(houseWalls.map(w => w.mesh)), items = [];
        for (const o of scene.children) {
          if (wallMeshes.has(o) || skip.has(o) || baked.includes(o) || o.isLight || o.isPoints || o.isSprite || !(o.isMesh || o.isGroup)) continue;
          if (o.userData.id === 'front_door') continue;
          const b = new THREE.Box3().setFromObject(o, true); if (b.isEmpty() || !inHouse(b)) continue;
          items.push({ o, b });
        }
        const near = (b, thin) => { // the line this thing hangs on, if any
          let best = null, bd = thin ? .3 : .16;
          for (const L of ls) {
            const lo = L.alongX ? b.min.x : b.min.z, hi = L.alongX ? b.max.x : b.max.z; if (hi < L.a0 - .05 || lo > L.a1 + .05) continue;
            const p0 = L.alongX ? b.min.z : b.min.x, p1 = L.alongX ? b.max.z : b.max.x;
            const gap = p0 > L.c ? p0 - (L.c + TH / 2) : p1 < L.c ? (L.c - TH / 2) - p1 : -1;
            if (gap < bd) { bd = gap; best = L; }
          }
          return best;
        };
        const hangs = [], floor = [], rest = [];
        for (const it of items) {
          const { b, o } = it, h = b.max.y - b.min.y, thick = Math.min(b.max.x - b.min.x, b.max.z - b.min.z), name = o.userData.model || '';
          if (lamps.some(l => l.parts.some(([p]) => p === o))) continue; // the lamps hang from the ceiling, below
          it.L = near(b, thick < .3 || name === 'curtain');
          if (it.L && (name === 'curtain' || (b.min.y < .05 && (h < .15 || thick < .12)))) { hangs.push([o, it.L]); continue; } // skirting, frames, curtains: part of the wall
          if (b.min.y < .05) { if (h >= .12) floor.push(it); continue; } // flat on the floor: a rug, a book, a print; the walls pass over it
          rest.push(it);
        }
        // what sits on something goes with it; what is fixed to a wall goes with the wall; things that touch are one piece of furniture
        const groups = floor.map(it => ({ items: [it], b: it.b.clone() }));
        rest.sort((p, q2) => p.b.min.y - q2.b.min.y);
        for (const it of rest) {
          const cx = (it.b.min.x + it.b.max.x) / 2, cz = (it.b.min.z + it.b.max.z) / 2;
          const on = groups.find(g => cx > g.b.min.x - .06 && cx < g.b.max.x + .06 && cz > g.b.min.z - .06 && cz < g.b.max.z + .06 && it.b.min.y < g.b.max.y + .12);
          if (on) { on.items.push(it); on.b.union(it.b); }
          else if (it.L) hangs.push([it.o, it.L]);
          else if (it.b.min.y > 1.7) continue; // hung from the ceiling
          else groups.push({ items: [it], b: it.b.clone() });
        }
        for (let merged = true; merged;) {
          merged = false;
          for (let i = 0; i < groups.length && !merged; i++) for (let j = i + 1; j < groups.length; j++) {
            const A = groups[i].b.clone().expandByScalar(.02); if (!A.intersectsBox(groups[j].b)) continue;
            groups[i].items.push(...groups[j].items); groups[i].b.union(groups[j].b); groups.splice(j, 1); merged = true; break;
          }
        }
        for (const g of groups) {
          g.cols = colliders.filter(c => !c.tag && c.x1 > g.b.min.x - .05 && c.x0 < g.b.max.x + .05 && c.z1 > g.b.min.z - .05 && c.z0 < g.b.max.z + .05 && (!c.mesh || g.items.some(it => it.o === c.mesh)));
          for (const c of g.cols) c.base = c.base || { x0: c.x0, x1: c.x1, z0: c.z0, z1: c.z1 };
          for (const it of g.items) baseOf(it.o);
          g.c = new THREE.Vector3(); g.b.getCenter(g.c);
          g.yaw = (hash(g.c.x * 7.1 + g.c.z * 3.3) - .5) * .14;
        }
        return { hangs, groups };
      }
      function unbake(o) { o.traverse(m => { if (statics.has(m)) { statics.delete(m); m.visible = true; m.matrixAutoUpdate = true; (o.userData.rebake ||= []).push(m); } }); o.matrixAutoUpdate = true; }
      function rebake(o) { for (const m of o.userData.rebake || []) stat(m); o.userData.rebake = null; }
      function shove(g, ls) { // how far the walls, as they stand now, push this piece into the room
        let dx = 0, dz = 0;
        for (const L of ls) {
          const lo = L.alongX ? g.b.min.x : g.b.min.z, hi = L.alongX ? g.b.max.x : g.b.max.z; if (hi < L.a0 || lo > L.a1) continue;
          const p0 = L.alongX ? g.b.min.z : g.b.min.x, p1 = L.alongX ? g.b.max.z : g.b.max.x, { t, a } = L.s, hi2 = g.b.max.y;
          let push = 0;
          if (p0 >= L.c) { const face = h => L.c + TH / 2 + t + Math.sin(a) * h, into = Math.max(face(hi2), face(g.b.min.y)) - p0; if (into > 0) push = into + .03; }
          else if (p1 <= L.c) { const face = h => L.c - TH / 2 + t + Math.sin(a) * h, into = p1 - Math.min(face(hi2), face(g.b.min.y)); if (into > 0) push = -(into + .03); }
          push = clamp(push, -.7, .7);
          if (L.alongX) dz = Math.abs(push) > Math.abs(dz) ? push : dz; else dx = Math.abs(push) > Math.abs(dx) ? push : dx;
        }
        const k = Math.min(1, Math.hypot(dx, dz) / .2), yaw = g.yaw * k;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        for (const it of g.items) { const b = baseOf(it.o); v.copy(b.p).sub(g.c).applyQuaternion(q); it.o.position.set(g.c.x + v.x + dx, b.p.y, g.c.z + v.z + dz); it.o.quaternion.copy(q).multiply(b.q); }
        for (const c of g.cols) { c.x0 = c.base.x0 + dx; c.x1 = c.base.x1 + dx; c.z0 = c.base.z0 + dz; c.z1 = c.base.z1 + dz; }
      }
      let anim = null;
      function apply(ls) {
        for (const L of ls) {
          for (const w of L.walls) { place(w.mesh, L, L.s.t, L.s.a); colliderOf(w, L, L.s.t, L.s.a); }
          if (sorted) for (const [o, HL] of sorted.hangs) if (HL === L) place(o, L, L.s.t, L.s.a);
        }
        if (sorted) for (const g of sorted.groups) shove(g, ls);
      }
      function ready(fn) { if (models.loaded >= models.wanted) fn(); else setTimeout(() => ready(fn), 400); }
      function freeze(ls) { for (const w of houseWalls) if (w.mesh.parent) { statics.delete(w.mesh); w.mesh.visible = true; w.mesh.matrixAutoUpdate = true; } }
      function settle() { for (const w of houseWalls) if (w.mesh.parent) stat(w.mesh); if (sorted) { for (const [o] of sorted.hangs) rebake(o); for (const g of sorted.groups) for (const it of g.items) rebake(it.o); } bakeStatics(); }
      function withThings(ls, fn) { // the furniture streams in: sort it once it is all there
        ready(() => {
          if (!sorted) sorted = sort(lines());
          for (const [o] of sorted.hangs) unbake(o); for (const g of sorted.groups) for (const it of g.items) unbake(it.o);
          fn(lines());
        });
      }
      return {
        tear() { // the house has moved: every wall a little off true
          const rand = rng(41), ls = lines();
          for (const L of ls) L.s.a = (rand() - .5) * .07;
          freeze(ls); apply(ls); settle();
          withThings(ls, l2 => { apply(l2); settle(); });
        },
        close(instant) { // the house closes: the outside walls step in and lean in, the inside ones lurch
          const rand = rng(77), ls = lines(), from = new Map(), to = new Map();
          for (const L of ls) {
            const inward = L.alongX ? (L.c < 6.5 ? 1 : -1) : (L.c < 7 ? 1 : -1);
            const step = L.ext ? (L.alongX && L.c > 12.9 || !L.alongX && L.c > 13.9 ? 0 : .34) : (rand() - .5) * .24; // the front door and the hallway's door stay where they open
            const lean = L.ext ? (.07 + rand() * .06) : (rand() - .5) * .16;
            from.set(L.k, { ...L.s }); to.set(L.k, { t: L.s.t + (L.ext ? inward * step : step), a: L.s.a + (L.ext ? inward * lean : lean) });
          }
          freeze(ls);
          if (instant) { for (const L of ls) Object.assign(L.s, to.get(L.k)); apply(ls); settle(); withThings(ls, l2 => { apply(l2); settle(); }); return; }
          anim = { from, to, ls };
          withThings(ls, l2 => { if (anim) anim.ls = l2; });
        },
        step(e) { // 0..1 through the closing
          if (!anim) return;
          for (const L of anim.ls) { const f = anim.from.get(L.k), t = anim.to.get(L.k); if (!f) continue; L.s.t = f.t + (t.t - f.t) * e; L.s.a = f.a + (t.a - f.a) * e; }
          apply(anim.ls);
        },
        end() { if (!anim) return; this.step(1); anim = null; settle(); },
        ceiling() { // the lamps hang from the ceiling, wherever it has got to
          const d = houseCeiling.position.y - H;
          for (const l of lamps) if (l.hung) { for (const [o, y] of l.parts) { o.position.y = y + d; if (statics.has(o)) o.matrixAutoUpdate = true; o.updateMatrix(); } l.src.pos.y = l.y0 + d; }
        },
        lines, state
      };
    }
    function startCollapse() {
      S.collapsePending = false; S.collapseT = 0; S.doorOpen = true;
      lean().close(false);
      for (const l of lamps) if (l.hung) for (const [o] of l.parts) statics.delete(o);
      bakeStatics();
      Sound.growl(1.3); shake = 2; torchDip = 1;
      say('The house is closing.', 4000);
      for (const [ms, text] of [[4500, 'Tom has Daisy. Chad is out. The front door.'], [9500, 'The floor is going.'], [17500, 'Tom does not come up.'], [21500, 'Get out of the house.']]) setTimeout(() => { if (S.collapseT >= 0) say(text, 5000); }, ms);
    }
    // Tom, seen only as his light: across the living room, to the edge, and down
    let tomLight = null;
    const tomSrc = source(0, 0, 0, 0xffe2b8, 0, 6);
    function tomStep(ct) {
      if (ct < 7 || ct > 17) { if (tomLight && ct > 17) { scene.remove(tomLight); tomLight = null; tomSrc.intensity = 0; } return; }
      if (!tomLight) {
        tomLight = new THREE.Group();
        const beamGeo = new THREE.ConeGeometry(.75, 4.5, 20, 1, true); beamGeo.translate(0, -2.25, 0); beamGeo.rotateX(-Math.PI / 2); // apex at the lamp, opening forward (+z)
        const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: .06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: moteTex, color: 0xfff0d6, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }));
        glow.scale.set(.35, .35, 1); tomLight.add(beam, glow); tomLight.userData.beam = beam; scene.add(tomLight);
      }
      const a = new THREE.Vector3(6.4, 1.1, 7.6), b = new THREE.Vector3(9.2, 1.05, 9.8), pit = new THREE.Vector3(9.4, 1, 10.3);
      if (ct < 12) { // crossing the room, quickly, with something in his arms
        const k = (ct - 7) / 5, e = k * k * (3 - 2 * k);
        tomLight.position.lerpVectors(a, b, e); tomLight.position.y += Math.abs(Math.sin(ct * 9)) * .05;
        tomLight.lookAt(k < .8 ? b.x + 1 : 12.5, .7, k < .8 ? b.z + 1.2 : 12.8); // toward the door, then back
        tomSrc.intensity = 1.6;
      } else { // the floor is not there
        if (!tomLight.userData.fell) { tomLight.userData.fell = true; Sound.growl(1.1, [0, 0]); Sound.play('door_close', { gain: 1, rate: .6 }); shake = 2; torchDip = 1; setTimeout(() => Sound.hush(3.2), 1400); }
        const f = ct - 12;
        tomLight.position.set(pit.x, pit.y - 4.9 * f * f, pit.z); tomLight.rotation.x += .19; tomLight.rotation.z += .11; // it turns over and over
        tomLight.userData.beam.material.opacity = .06 * Math.max(0, 1 - f / 4);
        tomSrc.intensity = Math.max(0, 1.6 - f * .6);
      }
      tomSrc.pos.copy(tomLight.position);
    }
    function collapseStep(dt) {
      S.collapseT += dt;
      tomStep(S.collapseT);
      const k = clamp(S.collapseT / 26, 0, 1), e = k * k * (3 - 2 * k);
      lean().step(e);
      houseCeiling.position.y = (S.torn ? H + .6 : H) - .9 * e; lean().ceiling();
      if (Math.random() < dt / 2.2) { Sound.play('door_close', { gain: .9, rate: .7 + Math.random() * .4 }); shake = Math.max(shake, .8); torchDip = Math.max(torchDip, .5); }
      if (Math.random() < dt / 5) Sound.growl(.6);
      for (const l of lamps) if (l.src.intensity > 0 && Math.random() < dt / 6) { l.src.intensity = 0; l.bulb.visible = false; }
      const outside = P.z > 13.4 || P.z < -.4 || P.x < -.4;
      if (S.collapseT > 30 || (outside && S.collapseT > 6)) endCollapse(outside);
    }
    function endCollapse(outside) {
      S.collapseT = -1; S.collapsed = true;
      houseCeiling.position.y = (S.torn ? H + .6 : H) - .9; lean().ceiling();
      for (const l of lamps) if (l.hung) for (const [o] of l.parts) if (o !== l.bulb) stat(o);
      lean().end();
      setTimeout(() => say(outside ? 'The house stops. Tom did not come out.' : 'The house stops. Tom is not in it.', 8000), 1500);
      setTimeout(() => { if (!found.has('collapse')) unlock('collapse'); }, 6500);
    }
    function applyCollapsed() { // a house reopened after it closed
      if (S.collapsed) return; S.collapsed = true; S.doorOpen = true;
      if (!found.has('collapse')) unlock('collapse', false); // reopened in the middle of it: what happened is in the journal
      lean().close(true);
      houseCeiling.position.y = (S.torn ? H + .6 : H) - .9; lean().ceiling(); bakeStatics();
      openFrontDoor(frontDoor, true);
    }
    function openFrontDoor(p, silent) { // hinged on the west jamb, it swings outward
      if (S.doorAjar) return; S.doorAjar = true;
      for (const c of p.children) c.position.x += .5; p.position.x -= .5; p.userData.swing = silent ? 1 : 0;
      if (silent) p.rotation.y = -1.9;
      const k = colliders.findIndex(c => Math.abs(c.x0 - 2) < .01 && Math.abs(c.z0 - 12.85) < .01); if (k >= 0) colliders.splice(k, 1);
      p.userData.label = 'The front door. Open.';
      if (!silent) { Sound.play('door_open', { gain: .8, rate: .9 }); say('The door opens. Outward.', 4000); }
    }
    function dropQuarter(p) {
      scene.remove(p); dropPickup(p); target = null; hud.prompt.hidden = true;
      S.quarterAt = t; stats.quarters++; saveStats(); Sound.coin(); say('Listen.', 2500); setTimeout(() => say('You will not hear it land.', 7000), 7000);
    }
    const panTo = (x, z) => { const dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz) || 1; return clamp((dx * Math.cos(P.yaw) - dz * Math.sin(P.yaw)) / d, -1, 1); };
    // the cold: the hallway holds at freezing, and the deeper you go the less it holds
    const temperature = () => {
      const reg = P.region;
      if (reg === 'vermont') return 64;
      if (reg === 'house') return S.torn ? 51 : 68;
      if (reg === 'stair') return 32 - Math.min(16, stair.depth() * .3);
      if (G.phase === 'empty') return 31 - Math.min(22, Math.max(0, P.x - G.x0) / 4);
      return 34 - Math.min(5, Math.max(0, P.x - G.x0) / 20);
    };
    const TOM_JOKES = [
      'Tom, on the radio: “Mr. Monster, if you can hear me, I brought marshmallows. Knock once for yes.”',
      'Tom, on the radio: “Day three. The dark and I have agreed not to talk about politics.”',
      'Tom, on the radio: “Navy, if you get to the bottom, don’t touch anything. Especially the bottom.”',
      'Tom, on the radio: “Knock knock. Nobody. That’s the whole joke. That’s this whole house.”'
    ];
    /* the room that gets smaller: Exploration #5, before the crawl */
    let shrinkParts = null;
    function startShrink() {
      S.shrinkT = 0;
      const { T, x0, z0 } = G, [i0, i1, j0, j1] = G.shrink;
      const xa = x0 + i0 * T, xb = x0 + (i1 + 1) * T, zN = z0 + j0 * T, zS = z0 + (j1 + 1) * T, cN = z0 + 75 * T, cS = z0 + 80 * T;
      const slab = (w, d) => { const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, 40, d), M.ashWorld)); m.position.y = 20 - .02; scene.add(m); return m; };
      const D = cN - zN + .5;
      const north = slab(xb - xa, D), south = slab(xb - xa, D), gate = slab(1, cS - cN);
      north.position.set((xa + xb) / 2, north.position.y, zN - D / 2); south.position.set((xa + xb) / 2, south.position.y, zS + D / 2);
      gate.position.set(xa - .5, -20, (cN + cS) / 2);
      const cn = { x0: xa, x1: xb, z0: zN - D, z1: zN }, cs = { x0: xa, x1: xb, z0: zS, z1: zS + D }, cg = { x0: xa - 1, x1: xa, z0: cN, z1: cS };
      colliders.push(cn, cs, cg);
      shrinkParts = { north, south, gate, cn, cs, cg, zN, zS, cN, cS, D };
      Sound.grind(true); Sound.growl(.7, [-1, 1]); shake = .8;
      say('The way you came in is a wall.', 5000);
      setTimeout(() => { if (S.shrinkT >= 0) say('The room is smaller than it was. It is still getting smaller.', 6000); }, 5200);
    }
    function shrinkStep(dt) {
      const p = shrinkParts; S.shrinkT += dt;
      const g = clamp(S.shrinkT / 1.5, 0, 1); p.gate.position.y = -20 + 40 * g * (2 - g);
      const k = clamp((S.shrinkT - 1.5) / 12, 0, 1), e = k * k * (3 - 2 * k);
      const fN = p.zN + (p.cN - p.zN) * e, fS = p.zS - (p.zS - p.cS) * e;
      p.north.position.z = fN - p.D / 2; p.cn.z0 = fN - p.D; p.cn.z1 = fN;
      p.south.position.z = fS + p.D / 2; p.cs.z0 = fS; p.cs.z1 = fS + p.D;
      shadowRef.force = true; shake = Math.max(shake, .25);
      if (k >= 1) endShrink();
    }
    function endShrink() {
      const p = shrinkParts, [i0, i1, j0, j1] = G.shrink;
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) if (j < 75 || j > 79) setTile(i, j, 1);
      flushChunks();
      for (const m of [p.north, p.south, p.gate]) { scene.remove(m); m.geometry.dispose(); }
      for (const c of [p.cn, p.cs, p.cg]) { const k = colliders.indexOf(c); if (k >= 0) colliders.splice(k, 1); }
      shrinkParts = null; S.shrinkT = -1; S.shrunk = true; Sound.grind(false); Sound.knock();
      setTimeout(() => say('Behind you, the way back is there again. Ahead, the passage goes on on its hands and knees.', 7000), 600);
    }
    /* a small jump, because every first-person game should have one; and the well in the Hall, which has no bottom */
    function jump() {
      if (stair.active || P.air > 0 || P.crawl || S.falling || game.paused || game.ended) return;
      P.airV = 2.6; P.air = .001;
    }
    function startFall() {
      S.falling = t; P.air = 0; P.airV = 0; P.fallV = 1;
      Sound.growl(1.2); shake = 1.5; torchDip = 1;
      say('You will not hear yourself land.', 6000);
      setTimeout(() => { if (S.falling) hud.fall.classList.add('in'); }, 6500);
      setTimeout(() => {
        if (!S.falling) return;
        const n = store.get('jumped', 0) + 1; store.set('jumped', n);
        if (!found.has('well')) setTimeout(() => unlock('well'), 3200);
        S.falling = 0; P.fallV = 0; camY = 1.6;
        P.x = G.stair.x - WELL - .8; P.z = G.stair.z + 1.2; P.yaw = Math.atan2(-(G.stair.x - P.x), -(G.stair.z - P.z)); P.pitch = -.2; P.vx = P.vz = 0;
        shadowRef.force = true;
        setTimeout(() => { hud.fall.classList.remove('in'); say(n === 1 ? 'You are at the top of the stairs. You do not remember the climb.' : `You are at the top of the stairs again. That is ${n} times.`, 7000); }, 900);
      }, 9500);
    }
    /* Exploration A: the corridor is longer on the way back */
    function explorationA() {
      const fx = -Math.sin(P.yaw);
      if (!S.grewA && P.x > G.x0 + (G.L - 1) * G.T && fx > .4) { S.grewA = true; buildMaze('a', G.L + 30); P.x += 30 * G.T; P.lineOut += 30 * G.T; placeMazePickups(); S.turnA = true; }
      if (S.turnA && fx < -.5) { S.turnA = false; stats.turned++; Sound.knock(); say('The corridor is longer than it was.', 6000, true); }
    }
    /* walls that move only when nobody is looking: a doorway you passed is gone, a wall you passed has one */
    let driftT = 16;
    function driftWalls(dt) {
      driftT -= dt; if (driftT > 0) return; driftT = 14 + Math.random() * 12;
      const j = Math.floor((P.z - G.z0) / G.T); if (j < 76 || j > 78) return; // only while you stand in the corridor itself
      const fx = -Math.sin(P.yaw), pi = Math.floor((P.x - G.x0) / G.T);
      const behind = i => Math.abs(i - pi) > 12 && ((i - pi) * fx < 0 || Math.abs(i - pi) > 40);
      const doors = [], walls = [];
      for (let i = 4; i < Math.min(G.hallStart, G.W) - 4; i++) for (const [row, back] of [[75, 74], [79, 80]]) {
        if (!behind(i)) continue;
        if (tileAt(i, row) === 0 && (i !== G.firstDoor || found.has('ch4'))) doors.push([i, row]);
        else if (tileAt(i, back) === 0 && tileAt(i, row) === 1) walls.push([i, row]);
      }
      let changed = false;
      if (doors.length && Math.random() < .7) { const [i, row] = doors[Math.floor(Math.random() * doors.length)]; setTile(i, row, 1); changed = true; if (!S.saidDoor) { S.saidDoor = true; setTimeout(() => say('There was a door there.', 5000), 400); } }
      if (walls.length && Math.random() < .6) { const [i, row] = walls[Math.floor(Math.random() * walls.length)]; setTile(i, row, 0); changed = true; }
      else if (Math.random() < .5) { // a niche where there was wall
        const i = pi + (fx > 0 ? -1 : 1) * (14 + Math.floor(Math.random() * 20)), row = Math.random() < .5 ? 75 : 79, dir = row === 75 ? -1 : 1;
        if (i > 4 && i < Math.min(G.hallStart, G.W) - 4 && tileAt(i, row) === 1) { setTile(i, row, 0); for (let k = 1; k <= 3; k++) for (let di = -1; di <= 1; di++) setTile(i + di, row + dir * k, 0); changed = true; }
      }
      if (changed) { flushChunks(); Sound.knock(); }
    }

    /* Exploration #5: the dark with no dimensions */
    function startExploration5() {
      if (Match.running) return;
      game.pause();
      Match.start(() => {
        unlock('ch10', false);
        store.set('again', false);
        startKaren(); game.resume();
      }, () => { P.x = 12.8; P.z = 8.5; P.yaw = Math.PI / 2; game.resume(); });
    }
    // a card to share: how far down, and what never landed
    function shareCard() {
      const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 630; const cx = cv.getContext('2d');
      cx.fillStyle = '#0b0b0d'; cx.fillRect(0, 0, 1200, 630);
      const draw = () => {
        const g = cx.createLinearGradient(0, 0, 0, 630); g.addColorStop(0, 'rgba(11,11,13,.35)'); g.addColorStop(1, 'rgba(11,11,13,.92)'); cx.fillStyle = g; cx.fillRect(0, 0, 1200, 630);
        cx.fillStyle = '#9a9aa2'; cx.font = '600 22px Georgia, serif'; cx.fillText('ASH TREE LANE', 72, 92);
        cx.fillStyle = '#efeee9'; cx.font = '54px Georgia, serif';
        const ft = Math.round(stats.deep);
        cx.fillText(ft > 0 ? `I went ${ft.toLocaleString('en-US')} feet down` : 'I went into the house', 72, 400);
        cx.fillText('on Ash Tree Lane.', 72, 466);
        cx.fillStyle = '#b8b7b0'; cx.font = 'italic 30px Georgia, serif';
        cx.fillText(stats.quarters > 0 ? 'The quarter is still falling.' : store.get('jumped', 0) > 0 ? 'I jumped. I did not land.' : 'I never heard anything land.', 72, 530);
        cx.fillStyle = '#6f6f78'; cx.font = '20px monospace'; cx.fillText(location.host + location.pathname.replace(/index\.html$/, ''), 72, 585);
        cv.toBlob(blob => {
          if (!blob) return;
          const file = new File([blob], 'ash-tree-lane.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], text: 'Ash Tree Lane', url: location.href }).catch(() => {});
          else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ash-tree-lane.png'; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
        }, 'image/png');
      };
      const last = stills[stills.length - 1];
      if (last) { const im = new Image(); im.onload = () => { cx.globalAlpha = .75; cx.drawImage(im, 0, 0, 1200, 675); cx.globalAlpha = 1; draw(); }; im.onerror = draw; im.src = last.url; } else draw();
    }
    const HINTS = { introduction: 'a trunk in the foyer', ch1: 'a tape in the living room', ch2: 'the quarter of an inch, with the tape measure from the kitchen', ch3: 'a tape in the closet that was not there', explA: 'a camera at the end of the first corridor', karen: 'a photograph on a nightstand', samples: 'a specimen bag on the kitchen table', explorations: 'a map by the well', ch4: 'a page in the first room off the corridor', ch5: 'a cache in the corridor', ch6: 'markers on the stairs', tom: 'a recorder at the lip of the well', ch7: 'a camera a hundred steps down', rescue: 'a rig at the lip of the well', ch8: 'a radio by the door that should not be there', ch9: 'tapes in the bedroom', well: 'the well itself' };
    function finish() {
      if (!game.ended) store.set('endings', store.get('endings', 0) + 1);
      game.ended = true;
      if (document.pointerLockElement) document.exitPointerLock();
      hud.veil.hidden = true; hud.prompt.hidden = true; hud.meter.textContent = '';
      Sound.ambience(false); Sound.weather(false); Sound.groan(false);
      const missed = ORDER.filter(id => HINTS[id] && !found.has(id));
      const still = missed.length ? `<p class="card-help">Still in the house: ${missed.map(id => HINTS[id]).join('; ')}.</p>` : '<p class="card-help">You found everything the house was willing to give up.</p>';
      card(`<p class="card-kicker">Vermont</p><p>You burned every page. Someone came into the dark with a light, and you came out together.</p><p>What you carried out is in the journal. The letters, the exhibits and the index at the back are for whoever is still reading.</p>${still}<div class="card-actions"><button type="button" data-journal>Open the journal</button><button type="button" data-share>Make a card to share</button><button type="button" data-again>Walk the house again</button></div>`);
      $('[data-again]', hud.card)?.addEventListener('click', () => { store.set('again', true); location.reload(); });
      $('[data-share]', hud.card)?.addEventListener('click', shareCard);
      $('button', hud.card)?.focus({ preventScroll: true });
    }
    if (game.ended) { enterVermont(true); setTimeout(finish, 600); }
    else if (found.has('ch10') && !found.has('ch11')) startKaren(true);
    // where you were: the house keeps its rooms and the corridor its line, so a place in either can be gone back to
    {
      const pos = store.get('pos', null);
      if (pos && !game.ended && typeof pos.x === 'number' && pos.phase === (G.built ? G.phase : null) && pos.torn === S.torn && pos.collapsed === S.collapsed) {
        const i = Math.floor((pos.x - G.x0) / G.T), j = Math.floor((pos.z - G.z0) / G.T);
        const inHouse = pos.x < G.x0 - .2 && pos.x > .3 && pos.x < 13.7 && pos.z > .3 && pos.z < 12.7;
        const inCorridor = G.built && pos.x > G.x0 && tileAt(i, j) === 0 && ((j >= 76 && j <= 78) || i >= G.hallStart);
        if (inHouse || inCorridor) { P.x = pos.x; P.z = pos.z; P.yaw = pos.yaw || 0; S.resumed = true; }
      }
    }
    let posT = 3;
    let hintT = 0, hintSig = '';
    function nextHint() {
      if (S.vermont) return 'The tapes are on the table.';
      if (S.karen) return 'Keep walking. The corridor is shorter than it looks, and the light is at the end of it.';
      if (!found.has('ch1')) return 'There is a tape on the moving boxes in the living room, by the lamp.';
      if (!found.has('ch2')) return S.measuredIn ? 'The children’s window. Measure the same wall from the outside.' : measurePickups ? 'The pencil mark at the east end of the hall. Measure from there.' : 'The tape measure is on the kitchen counter.';
      if (!found.has('ch3')) return 'The closet between the bedrooms. Something is on its floor.';
      if (!found.has('explA')) return 'Follow the corridor to the room at its end. He set his camera down on the floor.';
      if (S.fleeing && !S.torn) return 'Go back up. Walk off the top step, onto the floor of the Hall.';
      if (!found.has('ch7')) return 'The corridor ends in a hall, and the stairs are in the middle of it. A camera is a hundred steps down.';
      if (!found.has('rescue')) return 'Tom rigged a tripod at the lip of the well. It is still there.';
      if (S.collapsePending) return 'Go home. Something is waiting in the living room.';
      if (S.collapseT >= 0) return 'The front door. It opens outward now.';
      if (!found.has('ch8')) return 'Tom’s radio is in the living room, by the door that should not be there.';
      if (!found.has('ch9')) return 'Karen’s tapes are on the nightstand in the bedroom.';
      if (!found.has('ch10')) return 'The hallway, all the way: past the room that closes, past the bicycle, on your hands and knees.';
      return null;
    }

    /* ---------- the look: what the lens does to the light ---------- */

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .22, .55, 1.05);
    bloom.enabled = !Q.low;
    composer.addPass(bloom);
    const look = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, time: { value: 0 }, grain: { value: .07 }, vignette: { value: .55 }, aberration: { value: .0035 }, resolution: { value: new THREE.Vector2(1, 1) }, breath: { value: 0 }, tear: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float time, grain, vignette, aberration, breath, tear; uniform vec2 resolution; varying vec2 vUv;
        float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
        void main(){
          vec2 uv = vUv;
          if (tear > 0.0) { float ty = fract(time * 0.19); float band = 1.0 - smoothstep(0.0, 0.035, abs(uv.y - ty)); uv.x += band * tear * 0.03 * sin(time * 37.0 + uv.y * 90.0); uv.y += band * tear * 0.004; }
          vec2 c = uv - 0.5; float r2 = dot(c, c);
          vec2 ab = c * (aberration + breath * 0.004) * (1.0 + r2 * 6.0);
          vec3 col; col.r = texture2D(tDiffuse, uv + ab).r; col.g = texture2D(tDiffuse, uv).g; col.b = texture2D(tDiffuse, uv - ab).b;
          float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
          float n = hash(floor(uv * resolution * 0.5) + fract(time) * 100.0) - 0.5;
          col += n * grain * (0.25 + 0.75 * (1.0 - smoothstep(0.0, 0.6, lum)));
          col *= 1.0 - vignette * smoothstep(0.15, 0.95, r2 * 2.2);
          gl_FragColor = vec4(max(col, 0.0), 1.0);
        }`
    });
    composer.addPass(look);
    composer.addPass(new OutputPass());

    /* ---------- frame ---------- */

    let last = performance.now(), t = 0, shake = 0, torchDip = 0, fogTarget = .05, sayBeat = 0, emptyBeat = 0, fps = 60, recStart = 0, idle = 0, slow = 0, settled = 0;
    function resize() {
      const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer.setPixelRatio(dpr()); composer.setSize(w, h); bloom.setSize(w / 2, h / 2);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      look.uniforms.resolution.value.set(w * dpr(), h * dpr());
    }
    addEventListener('resize', resize); resize();

    function region() {
      if (S.vermont) return 'vermont';
      if (P.x < G.x0 - .1) return 'house';
      if (stair.active) return 'stair';
      return P.x > G.x0 + G.hallStart * G.T - 1 ? 'hall' : 'maze';
    }
    subLook.mode = () => stair.active ? (stair.depth() > 30 ? 'column' : stair.depth() > 9 ? 'sparse' : '') : ''; // on the stairs the page empties, as it does in the book
    const tc = s => { s = Math.max(0, Math.floor(s)); const p = n => String(n).padStart(2, '0'); return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`; };

    // a gamepad, in the standard layout: left stick walks, right stick looks, A takes, X jumps, Y or Start opens the journal, B closes it
    const pad = { on: false, mx: 0, mz: 0, lx: 0, ly: 0, run: false, prev: [] };
    function pollPad() {
      const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(g => g && g.connected && g.mapping === 'standard') : null;
      if (!gp) { pad.on = false; return; }
      const dz = v => Math.abs(v) < .16 ? 0 : v, b = k => !!(gp.buttons[k] && gp.buttons[k].pressed), hit = k => b(k) && !pad.prev[k];
      pad.mx = dz(gp.axes[0]); pad.mz = dz(gp.axes[1]); pad.lx = dz(gp.axes[2]); pad.ly = dz(gp.axes[3]); pad.run = b(10) || b(4);
      if (!pad.on && (pad.mx || pad.mz || pad.lx || pad.ly || gp.buttons.some(x => x.pressed))) { pad.on = true; hud.veil.hidden = true; }
      if (!journal.hidden) { if (hit(1) || hit(3) || hit(9)) closeJournal(); }
      else if ($('#dark').hidden && game.started && !game.ended && !game.paused) {
        if (hit(0) && target) interact(target);
        if (hit(2)) jump();
        if (hit(3) || hit(9)) openJournal(jPage.dataset.id);
        if (hit(5)) takeStill();
      } else if (!$('#dark').hidden && hit(0)) $('[data-act="primary"]', $('#dark'))?.click();
      pad.prev = gp.buttons.map(x => x.pressed);
    }
    function frame(now) {
      requestAnimationFrame(frame);
      pollPad();
      const raw = (now - last) / 1000, dt = Math.min(.05, raw); last = now; t += dt; // the step is clamped; the frame rate is measured as it is
      fps += (1 / Math.max(raw, 1e-3) - fps) * .05;
      if (game.paused || game.ended || !loadDone) { if (idle++ < 3) render(dt); return; } // the last frame stays on the canvas while you read
      idle = 0;
      if (!recStart) recStart = now;
      hud.rec.textContent = tc((now - recStart) / 1000);
      // if the frames come slowly for a few seconds, draw fewer pixels; then fewer effects
      settled += dt;
      if (settled > 6) {
        if (fps < 40) slow += dt; else slow = Math.max(0, slow - dt * .5);
        if (slow > 2) {
          slow = 0;
          if (bloom.enabled) bloom.enabled = false;
          else if (prCap > 1) { prCap = 1; renderer.setPixelRatio(dpr()); resize(); }
          else if (!Q.low) { Q.low = true; syncQuality(); torch.shadow.mapSize.set(1024, 1024); if (torch.shadow.map) { torch.shadow.map.dispose(); torch.shadow.map = null; } }
          else if (prCap > .8) { prCap = .8; renderer.setPixelRatio(dpr()); resize(); }
        }
      }

      // input
      let mx = 0, mz = 0;
      if (keys.has('f')) mz -= 1; if (keys.has('b')) mz += 1; if (keys.has('l')) mx -= 1; if (keys.has('r')) mx += 1;
      if (keys.has('tl')) P.yaw += dt * 1.8; if (keys.has('tr')) P.yaw -= dt * 1.8; // turning from the keyboard
      if (keys.has('pu')) P.pitch = clamp(P.pitch + dt * 1.2, -1.35, 1.35); if (keys.has('pd')) P.pitch = clamp(P.pitch - dt * 1.2, -1.35, 1.35);
      mx += stick.dx; mz += stick.dz;
      if (pad.on) { mx += pad.mx; mz += pad.mz; P.yaw -= pad.lx * dt * 2.4 * SET.sens; P.pitch = clamp(P.pitch - pad.ly * dt * 1.8 * (store.get('invert', false) ? -1 : 1), -1.35, 1.35); }
      if (S.falling) mx = mz = 0;
      const mag = Math.hypot(mx, mz); if (mag > 1) { mx /= mag; mz /= mag; }
      let speed = keys.has('run') || pad.run ? 3.4 : 2.1;
      if (G.low && P.x > G.x0 + G.low[0] * G.T && P.x < G.x0 + G.low[1] * G.T) speed *= .5; // on your hands and knees
      if (stair.active) speed *= .85 * clamp(Math.hypot(P.x - G.stair.x, P.z - G.stair.z) / 1.7, .45, 1); // the turn is tighter near the column

      const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
      const tx = (fx * -mz + rx * mx) * speed, tz = (fz * -mz + rz * mx) * speed;
      const k = 1 - Math.exp(-dt * 12);
      P.vx += (tx - P.vx) * k; P.vz += (tz - P.vz) * k;
      P.x += P.vx * dt; P.z += P.vz * dt;
      if (stair.active) {
        // on the helix: the column on one side, nothing on the other, the tread under your feet
        const cx = G.stair.x, cz = G.stair.z;
        let dx = P.x - cx, dz = P.z - cz, r = Math.hypot(dx, dz) || 1e-6;
        if (r < R_IN) { P.x = cx + dx / r * R_IN; P.z = cz + dz / r * R_IN; dx = P.x - cx; dz = P.z - cz; r = R_IN; }
        const a = Math.atan2(dz, dx);
        stair.u += wrapPi(a - stair.lastA); stair.lastA = a;
        if (stair.u < -HALF_STEP) { // the back edge of the top tread: nothing beyond it but the well
          stair.u = -HALF_STEP; const ta = stair.theta0 - HALF_STEP; stair.lastA = wrapPi(ta);
          P.x = cx + Math.cos(ta) * r; P.z = cz + Math.sin(ta) * r; dx = P.x - cx; dz = P.z - cz;
        }
        let sk = Math.round(stair.u / STEP_A);
        // climbing out after Holloway's tape: the house stretches under you, and puts back six of the stairs you climbed, four times at most
        if (S.fleeing && !S.torn && sk > 2 && stair.u < stair.lastU - 1e-4 && t - stair.lastSkip > 7 && stair.stretched < 4 && Math.hypot(P.vx, P.vz) > .3 && !reduced) {
          const dk = -6, da = dk * STEP_A; stair.lastSkip = t; stair.stretched++; stair.u -= da; sk -= dk;
          const a2 = a - da; P.x = cx + Math.cos(a2) * r; P.z = cz + Math.sin(a2) * r; P.yaw += da; stair.lastA = wrapPi(a2); stair.k = sk; dx = P.x - cx; dz = P.z - cz;
          camY = 1.6 - stair.depth(); placeSteps(true); shadowRef.force = true; Sound.growl(.8); shake = Math.max(shake, 1.2); torchDip = .6;
          if (!S.stairShort) { S.stairShort = true; say('The staircase is longer than it was. It is adding to itself under you.', 6000, true); }
        }
        stair.lastU = stair.u;
        const outward = (P.vx * dx + P.vz * dz) / (r * (Math.hypot(P.vx, P.vz) || 1e-6));
        if (sk === 0 && r > R_OUT && outward > .5) { // walking out over the edge of the top tread, back onto the floor of the Hall
          stair.active = false; const kk = (WELL + P.r + .05) / r; P.x = cx + dx * kk; P.z = cz + dz * kk;
          if (S.fleeing && !S.torn) { setTimeout(() => tearHouse(), 60); setTimeout(() => say('The corridor is shorter than it was.', 6000), 6200); }
        } else if (r > R_OUT) { P.x = cx + dx / r * R_OUT; P.z = cz + dz / r * R_OUT; }
        // the gait: feet on tread sk, the drop to the next one taken as a step, with a footfall at the edge
        const f = stair.u / STEP_A - sk + .5;
        stair.f = f;
        if (sk !== stair.k) stair.k = sk;
        const edge = f > .65 || f < .35;
        if (edge !== stair.onEdge && t - stair.lastStep > .12 && P.walked !== stair.lastWalked) { stair.onEdge = edge; if (edge) { stair.lastStep = t; Sound.step(true, true); } }
        stair.lastWalked = P.walked;
        const depth = stair.depth();
        P.walked += Math.hypot(P.vx, P.vz) * dt;
        stair.deepest = Math.max(stair.deepest, depth);
        if (depth > 33 && depth < 60 && !found.has('ch7') && !S.saidCam) { S.saidCam = true; say('You passed a camera on its side, a few treads up. Its battery is dead. Its tape is not.', 8000); }
        if (depth > 58 && !S.saidBottom) { S.saidBottom = true; say('There is nothing below that you need. Everything you came for is above you.', 8000); }
        while (stair.beat < STAIR_BEATS.length && depth >= STAIR_BEATS[stair.beat][0]) { const [, text, fx] = STAIR_BEATS[stair.beat++]; say(text); if (fx === 'growl') { Sound.growl(); shake = 1; torchDip = 1; } }
        if (depth > 20 && Math.random() < dt / 40) { Sound.growl(.6); shake = .6; torchDip = .7; }
        hud.meter.textContent = `Down: ${fmt(depth * FT)} ft. Steps: ${fmt(depth / RISE)}. ${Math.round(temperature())}°F.`;
        placeSteps();
      } else {
        collide();
        const moved = Math.hypot(P.vx, P.vz) * dt;
        P.walked += moved;
        // the Great Hall: the well is a hole, and the only way into it is the top tread
        if (G.built && P.x > G.x0 + G.hallStart * G.T) {
          const cx = G.stair.x, cz = G.stair.z, dx = P.x - cx, dz = P.z - cz, r = Math.hypot(dx, dz) || 1e-6;
          if (r < WELL + P.r) {
            const a = Math.atan2(dz, dx), rel = wrapPi(a - stair.theta0);
            if (Math.abs(rel) < HALF_STEP + P.r / r) {
              if (r < WELL - .1) {
                stair.active = true; stair.u = rel; stair.lastA = a; stair.k = 0; stair.onEdge = false;
                const rr = Math.min(r, R_OUT - .05); P.x = cx + Math.cos(a) * rr; P.z = cz + Math.sin(a) * rr; // onto the tread
                placeStairPickups(); placeSteps(true);
                if (!stair.shown) { stair.shown = true; say('A staircase. Going down.'); }
              }
            } else if (P.air > 0 || S.falling) { if (r < WELL - .35 && !S.falling) startFall(); } // in the air over the well: nothing holds you
            else { const kk = (WELL + P.r) / r; P.x = cx + dx * kk; P.z = cz + dz * kk; }
          }
        }
        // the door back, once you have seen the bottom of what you can see
        if (S.explore5 && G.phase === 'empty' && P.x > G.x0 + 75) startExploration5();
      }
      if (stair.active) { // the eye follows the gait: level on the tread, then down over the edge
        const f = stair.f, target = reduced ? 1.6 - stair.u / STEP_A * RISE : 1.6 - (stair.k + THREE.MathUtils.smoothstep(f, .55, 1)) * RISE - .02 * Math.sin(Math.PI * f);
        camY += (target - camY) * (1 - Math.exp(-dt * (reduced ? 6 : 22)));
      } else if (!S.falling) { const crawl = !!(G.low && P.x > G.x0 + G.low[0] * G.T && P.x < G.x0 + G.low[1] * G.T); P.crawl = crawl; camY += ((crawl ? .95 : 1.6) - camY) * (1 - Math.exp(-dt * (crawl ? 4 : 14))); }

      // footsteps
      const reg = region();
      if (reg !== P.region) { Sound.room(reg === 'house' || reg === 'vermont' ? .06 : reg === 'maze' ? .38 : reg === 'hall' ? .01 : .45); P.region = reg; } // the Hall returns no echo
      if (!stair.active && P.walked - P.stepAcc > .62) { P.stepAcc = P.walked; Sound.step(reg !== 'house' && reg !== 'vermont', reg === 'maze'); }

      // hallway beats by line paid out
      if (G.phase === 'a' && reg === 'maze') S.gone += dt; // how long the camera says you were in there
      if (reg === 'house' && S.gone > 20 && !S.clocked) { S.clocked = true; const watch = Math.max(Math.round(S.gone * 3.7 / 60), Math.round(S.gone / 60) + 30); hud.watch.textContent = `TOM’S WATCH ${tc(watch * 60 + (S.gone % 60))}`; hud.watch.hidden = false; setTimeout(() => { hud.watch.hidden = true; }, 12000); say(`The camera says you were in there ${tc(S.gone).slice(3)}. Tom’s watch says ${watch} minutes. Neither will change its mind.`, 9000); }
      // outside, at the corner where the hallway should run through the yard: grass, and under it, very far down, Tom's radio
      if (reg === 'house' && S.collapsed && !S.underYard && P.x > 12.4 && (P.z > 13.4 || P.z < -.4)) { S.underYard = true; Sound.voice({ pitch: 130, dur: 2.2, radio: true, far: 1, level: .7, pos: [18, -6, 8.6] }); setTimeout(() => say('Where the hallway runs, there is only the yard. Grass, and the tree line.', 6000), 400); setTimeout(() => say('Under it, very far down, a radio clicks on. Tom’s voice. Then nothing.', 7000), 6800); }
      if (reg === 'maze' || reg === 'hall') {
        P.lineOut = Math.max(P.lineOut, P.x - G.x0);
        const out = (P.x - G.x0) * FT;
        hud.meter.textContent = (reg === 'hall' ? (S.quarterAt ? `The Great Hall. The quarter has been falling for ${fmt(t - S.quarterAt)} s.` : 'The Great Hall.') : G.phase === 'empty' ? `${fmt(out)} ft. No line.` : `Line paid out: ${fmt(out)} ft.`) + ` ${Math.round(temperature())}°F.`;
        if (G.phase === 'long') while (sayBeat < HALL_BEATS.length && (P.x - G.x0) >= HALL_BEATS[sayBeat][0]) {
          const [, text, fx] = HALL_BEATS[sayBeat++]; say(text);
          if (fx === 'growl') { Sound.growl(); shake = 1; torchDip = 1; }
          if (fx === 'longer' && G.L < 180) { buildMaze('long', 180); placeMazePickups(); } // the Hall recedes: the corridor is always longer than it was
        }
        if (G.phase === 'empty') while (emptyBeat < EMPTY_BEATS.length && (P.x - G.x0) >= EMPTY_BEATS[emptyBeat][0]) say(EMPTY_BEATS[emptyBeat++][1], 6000);
        if (G.phase === 'a') explorationA();
        // the children, the first time: calling from much farther away than the yard goes
        if (G.phase === 'a' && !S.kids && P.x - G.x0 > 5) { S.kids = 1; Sound.voice({ pitch: 300, dur: 1.4, far: .95, level: .9, pos: [P.x + 30, 1.2, P.z - 1] }); Sound.voice({ pitch: 270, dur: 1.1, far: 1, level: .85, at: 2.2, pos: [P.x + 45, 1.2, P.z + 1] }); setTimeout(() => say('Daisy’s voice, from much farther off than the yard goes. Then Chad’s, farther.', 7000), 900); }
        // Tom on the radio, while his lantern is lit
        if (reg === 'hall' && relayLantern && relayLantern.visible && !found.has('tom')) {
          const d = Math.hypot(P.x - relaySrc.pos.x, P.z - relaySrc.pos.z);
          S.radioT -= dt;
          if (S.radioT <= 0 && d < 34) {
            S.radioT = 14 + Math.random() * 10;
            Sound.voice({ pitch: 128, dur: 2.5 + Math.random() * 2, radio: true, level: .9, pos: [relaySrc.pos.x, .5, relaySrc.pos.z] });
            if (S.joke < TOM_JOKES.length && d < 16) setTimeout(() => say(TOM_JOKES[S.joke++], 7000), 700);
          }
        }
        if (reg === 'hall' && Math.random() < dt / 110) Sound.growl(.2, [panTo(G.stair.x, G.stair.z) * .5, panTo(G.stair.x, G.stair.z) * .5]); // from the well, and nowhere else
        // a side corridor that is the same corridor however far you walk it, until you turn round
        if (G.loop && !stair.active) {
          const i = Math.floor((P.x - G.x0) / G.T), j = Math.floor((P.z - G.z0) / G.T), fz = -Math.cos(P.yaw);
          if (i >= G.loop[0] && i <= G.loop[1]) {
            if (j < 40 && fz < -.3) { P.z += 20 * G.T; S.loops++; shadowRef.force = true; if (S.loops === 3) say('This corridor is not getting any shorter.', 6000); if (S.loops === 6) say('You have walked this stretch before. More than once.', 6000); }
            if (S.loops >= 2 && fz > .5 && !S.letGo) { S.letGo = true; stats.turned++; say('You turn round. The way out is closer than it should be.', 6000); }
          }
        }
        // something breathing behind you: it stops the moment you turn round (twice in a whole visit at most)
        if (!S.breath && S.breathN < 2 && (G.phase === 'long' || G.phase === 'short') && P.x - G.x0 > 25 && Math.random() < dt / 150) { S.breathN++; S.breath = { h: Sound.breathBehind(), yaw: P.yaw, t: 0 }; }
        if (S.breath) { S.breath.t += dt; if (Math.abs(Math.atan2(Math.sin(P.yaw - S.breath.yaw), Math.cos(P.yaw - S.breath.yaw))) > 1.5 || S.breath.t > 9) { if (S.breath.h) S.breath.h.stop(); S.breath = null; } }
        // a shape at the edge of the light, once in the whole game
        if (!S.shape && !store.get('shape', false) && G.phase === 'long' && P.x - G.x0 > 55 && Math.random() < dt / 20) {
          const side = Math.random() < .5 ? -1 : 1, ang = P.yaw + side * .42, dx = -Math.sin(ang), dz = -Math.cos(ang);
          let ok = true; for (let d = .5; d < 8; d += .25) if (tileAt(Math.floor((P.x + dx * d - G.x0) / G.T), Math.floor((P.z + dz * d - G.z0) / G.T)) !== 0) { ok = false; break; }
          if (ok) {
            S.shape = true; store.set('shape', true);
            const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const cx = cv.getContext('2d');
            const gr = cx.createRadialGradient(32, 110, 4, 32, 120, 120); gr.addColorStop(0, 'rgba(0,0,0,.95)'); gr.addColorStop(.55, 'rgba(0,0,0,.8)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
            cx.fillStyle = gr; cx.beginPath(); cx.ellipse(32, 140, 22, 110, 0, 0, Math.PI * 2); cx.fill(); cx.beginPath(); cx.ellipse(32, 44, 26, 30, 0, 0, Math.PI * 2); cx.fill();
            const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, fog: true }));
            sp.scale.set(.75, 3, 1); sp.position.set(P.x + dx * 8, 1.45, P.z + dz * 8); scene.add(sp);
            S.shapeObj = { sp, t: 0 };
          }
        }
        if (S.shapeObj) { const o = S.shapeObj; o.t += dt; const ax = o.sp.position.x - P.x, az = o.sp.position.z - P.z, rel = Math.atan2(Math.sin(Math.atan2(-ax, -az) - P.yaw), Math.cos(Math.atan2(-ax, -az) - P.yaw)); if (Math.abs(rel) < .14 || o.t > 1.3) { scene.remove(o.sp); o.sp.material.map.dispose(); S.shapeObj = null; Sound.play('creak_2', { gain: .15, rate: .7 }); } }
        // the room that gets smaller
        if (G.shrink && !S.shrunk && S.shrinkT < 0) { const i = (P.x - G.x0) / G.T, j = (P.z - G.z0) / G.T; if (i > 90 && i < 95 && j > 70 && j < 85) startShrink(); }
        if (G.ante && !S.saidAnte) { const i = (P.x - G.x0) / G.T; if (i > G.ante[0] && i < G.ante[1]) { S.saidAnte = true; say('A room with a doorway on every side. All of them go in. None of them go back.', 7000); } }
        if ((G.phase === 'long' || G.phase === 'short') && !stair.active) driftWalls(dt);
        if (S.torn && (P.x - G.x0) > 2 && Math.random() < dt / 30) { Sound.growl(.5); shake = .5; torchDip = .6; }
      } else if (reg === 'house') {
        if (S.regrow && G.built && !S.karen && !S.vermont) { buildMaze(S.regrow); placeMazePickups(); const txt = S.regrowText; S.regrow = S.regrowText = null; if (txt) setTimeout(() => say(txt, 7000), 800); }
        if (S.collapsePending && S.collapseT < 0 && !S.collapsed) startCollapse();
        hud.meter.textContent = S.collapseT >= 0 ? 'The house is closing.' : S.torn ? 'The house is not the size it was.' : '';
        if (S.torn && S.collapseT < 0 && Math.random() < dt / 25) { Sound.growl(.4); shake = .4; torchDip = .5; }
        if (!S.torn && Math.random() < dt / 90) Sound.knock();
        if (S.doorAjar && P.z > 14 && !S.farOut && Math.hypot(P.x - 7, P.z - 6.5) > 24) { S.farOut = true; say('The house is behind you. So is everything in it.', 7000); }
      }
      if (S.collapseT >= 0) collapseStep(dt);
      if (tapeLine && tapeLine.visible) { const u = tapeLine.userData; u.t += dt; const k = Math.min(1, u.t / 1.2), len = .02 + 13.8 * k; tapeLine.scale.x = len; tapeLine.position.set(13.9 - len / 2, .95, 4.65); if (u.t > 6) tapeLine.visible = false; }
      if (reg === 'maze' || reg === 'hall' || reg === 'stair') stats.dark += dt;
      if (stair.active) stats.deep = Math.max(stats.deep, stair.depth() * FT);
      stats.line = Math.max(stats.line, P.lineOut * FT);
      const sig = found.size + G.phase + S.torn + S.collapsed + S.measuredIn + S.karen + S.vermont + S.fleeing + (measurePickups ? 1 : 0);
      if (sig !== hintSig) { hintSig = sig; hintT = 0; } else if (!Match.running) { hintT += dt; if (hintT > 180) { hintT = 60; const h = nextHint(); if (h) say(h, 8000); } }
      posT -= dt; if (posT <= 0) { posT = 3; saveStats(); if (!stair.active && !S.falling && S.collapseT < 0 && S.shrinkT < 0 && !Match.running && (reg === 'house' || reg === 'maze' || reg === 'hall')) store.set('pos', { x: +P.x.toFixed(2), z: +P.z.toFixed(2), yaw: +P.yaw.toFixed(2), phase: G.built ? G.phase : null, torn: S.torn, collapsed: S.collapsed }); }
      if (S.shrinkT >= 0 && shrinkParts) shrinkStep(dt);
      if (S.doorAjar && frontDoor.userData.swing < 1) { const sw = frontDoor.userData.swing = Math.min(1, frontDoor.userData.swing + dt * .7); frontDoor.rotation.y = -1.9 * sw * sw * (3 - 2 * sw); }
      Sound.ambience(reg !== 'vermont' && (reg !== 'house' || S.torn), reg === 'house' ? .08 : reg === 'stair' ? .22 : reg === 'hall' ? .05 : .16); // the Hall is almost silent
      Sound.weather(reg === 'house' && !S.torn && !S.karen);
      Sound.groan(reg === 'house' && S.torn);
      if (reg === 'vermont') { hud.meter.textContent = ''; const sp = vermont.snow.geometry.attributes.position; for (let i = 0; i < sp.count; i++) { let y = sp.getY(i) - dt * (.5 + (i % 7) * .05); if (y < 0) y += 4; sp.setY(i, y); sp.setX(i, sp.getX(i) + Math.sin(t * .7 + i) * dt * .05); } sp.needsUpdate = true; }
      if (G.phase === 'karen' && reg === 'maze' && !S.karenDone) karenStep(dt);
      fogTarget = reg === 'vermont' ? .012 : reg === 'house' ? (S.torn ? .1 : .045) : reg === 'maze' ? (G.phase === 'karen' ? .11 : .085) : reg === 'hall' ? .05 : .075;
      findTarget();
      render(dt);
    }

    // how far the beam travels before it meets something: the camcorder's iris closes down on a near wall
    function viewDistance() {
      const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
      let best = 14;
      if (P.x < G.x0 + 1) for (const c of colliders) { // slab test against each box in the house
        let t0 = 0, t1 = best;
        for (const [p, d, lo, hi] of [[P.x, fx, c.x0, c.x1], [P.z, fz, c.z0, c.z1]]) {
          if (Math.abs(d) < 1e-6) { if (p < lo || p > hi) { t1 = -1; break; } continue; }
          let a = (lo - p) / d, b = (hi - p) / d; if (a > b) [a, b] = [b, a];
          t0 = Math.max(t0, a); t1 = Math.min(t1, b);
          if (t0 > t1) break;
        }
        if (t1 >= t0 && t0 < best) best = t0;
      }
      if (G.built && P.x > G.x0 - 1) for (let d = .25; d < best; d += .25) { const ii = Math.floor((P.x + fx * d - G.x0) / G.T); if (ii >= 0 && tileAt(ii, Math.floor((P.z + fz * d - G.z0) / G.T)) === 1) { best = d; break; } } // west of the first tile is the house: its walls were measured above
      return best;
    }
    // your breath, in the cold of the hallway
    const breaths = Array.from({ length: 3 }, () => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: moteTex, color: 0xdfe4ee, transparent: true, opacity: 0, depthWrite: false })); sp.visible = false; scene.add(sp); return { sp, age: 9, vel: new THREE.Vector3() }; });
    let breathTimer = 3;
    const breathPos = new THREE.Vector3(), breathDir = new THREE.Vector3();
    function breathe(dt) {
      const cold = P.region !== 'vermont' && (P.region !== 'house' || S.torn);
      breathTimer -= dt;
      if (cold && breathTimer <= 0 && !reduced) {
        breathTimer = clamp(3.2 - (32 - temperature()) * .08, 1.3, 3.2) + Math.random() * 1.6; // the colder, the more often
        const b = breaths.find(b => b.age > 2.4); if (b) {
          camera.getWorldDirection(breathDir);
          breathPos.copy(camera.position).addScaledVector(breathDir, .45); breathPos.y -= .14;
          b.sp.position.copy(breathPos); b.sp.visible = true; b.age = 0;
          b.vel.copy(breathDir).multiplyScalar(.35); b.vel.y += .12; b.vel.x += (Math.random() - .5) * .1; b.vel.z += (Math.random() - .5) * .1;
        }
      }
      for (const b of breaths) {
        if (!b.sp.visible) continue;
        b.age += dt; b.sp.position.addScaledVector(b.vel, dt); b.vel.multiplyScalar(1 - dt * .8);
        const k = b.age / 2.4, sc = .12 + k * .5;
        b.sp.scale.set(sc, sc * .8, 1); b.sp.material.opacity = .28 * Math.sin(Math.min(1, k) * Math.PI);
        if (b.age > 2.4) b.sp.visible = false;
      }
    }
    let iris = 1, fpsT = 0;
    let bobPhase = 0;
    /* the monitor: Navidson's cameras, one after another, on the television. They see you. They see what you do not. */
    const feedRT = new THREE.WebGLRenderTarget(Q.low ? 128 : 192, Q.low ? 96 : 144);
    const feedCam = new THREE.PerspectiveCamera(80, 4 / 3, .1, 28); feedCam.layers.enable(1);
    const labelCv = document.createElement('canvas'); labelCv.width = 256; labelCv.height = 192;
    const labelTex = new THREE.CanvasTexture(labelCv);
    screenMat.uniforms.feed.value = feedRT.texture; screenMat.uniforms.label.value = labelTex;
    const onTape = o => { o.traverse(m => m.layers.set(1)); scene.add(o); return o; }; // drawn for the cameras only
    const figure = (h, mat) => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(.17, .21, h * .62, 10), mat); b.position.y = h * .31 + h * .1; const hd = new THREE.Mesh(new THREE.SphereGeometry(h * .075, 10, 8), mat); hd.position.y = h * .8; const l = new THREE.Mesh(new THREE.CylinderGeometry(.14, .12, h * .12, 8), mat); l.position.y = h * .06; g.add(b, hd, l); return g; };
    const meOnTape = onTape(figure(1.75, new THREE.MeshStandardMaterial({ color: 0x2b2a2a, roughness: 1 })));
    const otherOnTape = onTape(figure(2.05, new THREE.MeshBasicMaterial({ color: 0x050505 }))); otherOnTape.visible = false;
    const doorOnTape = onTape(new THREE.Mesh(new THREE.PlaneGeometry(1.12, 2.05), new THREE.MeshBasicMaterial({ color: 0x030303 }))); doorOnTape.position.set(13.905, 1.025, 8.5); doorOnTape.rotation.y = -Math.PI / 2;
    const mon = { cam: 1, t: 0, frame: 0, other: -1, yaw0: 0, look: 0, zoom: 0 };
    function monitorLabel() {
      const cx = labelCv.getContext('2d'); cx.clearRect(0, 0, 256, 192); cx.fillStyle = '#fff'; cx.font = 'bold 13px monospace';
      cx.fillText(`CAM ${mon.cam + 1}  ${cams[mon.cam].name}`, 12, 22); cx.fillText('● REC', 196, 180); labelTex.needsUpdate = true;
    }
    function monitor(dt, reg) {
      const tvx = 10.5, tvz = 12.25, dx = tvx - P.x, dz = tvz - P.z, d = Math.hypot(dx, dz);
      const facing = (-Math.sin(P.yaw) * dx - Math.cos(P.yaw) * dz) / (d || 1);
      if (reg !== 'house' || d > 8 || S.collapseT >= 0) { screenMat.uniforms.feedOn.value = 0; otherOnTape.visible = false; mon.look = 0; mon.zoom = 0; return; }
      const watching = d < 4.5 && facing > .75;
      // stand and look at the screen, and the camcorder zooms in on it
      const dy = .72 - camY, aim = Math.acos(clamp((-Math.sin(P.yaw) * Math.cos(P.pitch) * dx + Math.sin(P.pitch) * dy - Math.cos(P.yaw) * Math.cos(P.pitch) * dz) / Math.hypot(dx, dy, dz), -1, 1));
      mon.look = d < 3.4 && aim < .2 && Math.hypot(P.vx, P.vz) < .3 ? mon.look + dt : 0;
      mon.zoom = mon.look > .7 ? THREE.MathUtils.radToDeg(2 * Math.atan(.3 / Math.hypot(dx, dy, dz))) * 1.25 : 0;
      mon.t += dt;
      if (mon.t > 7 && mon.other < 0) { mon.t = 0; mon.cam = (mon.cam + 1) % cams.length; if (!S.hallway && Math.random() < .5) mon.cam = Math.random() < .5 ? 1 : 4; monitorLabel(); }
      // before the hallway: on the tape, the door is already there
      if (!S.hallway && watching && (mon.cam === 1 || mon.cam === 4) && !S.tapeDoor) { S.tapeDoor = true; say('On the monitor, the living room has a door in its east wall. In the room, it does not.', 7000); }
      // after the house has moved: once, the camera sees someone behind you
      if (S.torn && watching && !store.get('behind', false) && mon.other < 0) { store.set('behind', true); mon.other = 0; mon.cam = 1; mon.t = 0; mon.yaw0 = P.yaw; monitorLabel(); say('On the monitor, someone is standing behind you.', 5000); Sound.breathBehind(); }
      if (mon.other >= 0) {
        mon.other += dt;
        otherOnTape.visible = true; otherOnTape.position.set(P.x + Math.sin(P.yaw) * 1.1, 0, P.z + Math.cos(P.yaw) * 1.1); otherOnTape.rotation.y = P.yaw + Math.PI;
        let turned = Math.abs(((P.yaw - mon.yaw0 + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI) > 1.6;
        if (turned || mon.other > 9) { otherOnTape.visible = false; mon.other = -1; if (turned) say('There is no one there. On the monitor, now, no one either.', 5000); }
      }
      screenMat.uniforms.feedOn.value = mon.other >= 0 ? 1 : S.torn ? (Math.sin(t * 1.3) > .2 ? .55 + Math.random() * .25 : 0) : 1;
      if (++mon.frame % (mon.zoom ? 2 : Q.low ? 8 : 5) !== 0 || screenMat.uniforms.feedOn.value === 0) return;
      const c = cams[mon.cam]; feedCam.position.set(c.x, 2.2, c.z); feedCam.lookAt(c.tx, .7, c.tz);
      meOnTape.position.set(P.x, 0, P.z); meOnTape.rotation.y = P.yaw; doorOnTape.visible = !S.hallway;
      const old = renderer.getRenderTarget(); renderer.setRenderTarget(feedRT); renderer.render(scene, feedCam); renderer.setRenderTarget(old);
    }
    monitorLabel();
    function render(dt) {
      scene.fog.density += (fogTarget - scene.fog.density) * (1 - Math.exp(-dt * 2));
      const reg = P.region;
      scene.fog.color.setHex(reg === 'vermont' ? 0xdfe5ec : reg === 'house' && !S.torn ? 0x0a0808 : 0x050506);
      scene.background.setHex(reg === 'vermont' ? 0xdfe5ec : 0x020203);
      dayHemi.intensity = reg === 'vermont' ? 1.7 : 0; daySun.intensity = reg === 'vermont' ? 2.3 : 0;
      skyDome.visible = reg === 'house';
      const moving = Math.hypot(P.vx, P.vz) > .3;
      bobPhase += dt * (moving ? 9 : 0);
      const bob = reduced ? 0 : Math.sin(bobPhase) * .028 * (moving ? 1 : 0);
      const y = camY + bob;
      if (P.air > 0) { P.airV -= 9.8 * dt; P.air += P.airV * dt; if (P.air <= 0) { P.air = 0; P.airV = 0; if (!S.falling && !reduced) Sound.step(P.region !== 'house', P.region === 'maze' || P.region === 'hall'); } }
      if (S.falling) { P.fallV = Math.min(30, P.fallV + 9.8 * dt); camY -= P.fallV * dt; }
      camera.position.set(P.x, y + P.air, P.z);
      const sway = reduced ? 0 : .0035 * (S.torn ? 2 : 1) * (S.karen ? 1.8 : 1) * (SET.calm ? .3 : 1);
      camera.rotation.y = P.yaw + (Math.sin(t * .61) * .6 + Math.sin(t * 1.73) * .4) * sway;
      camera.rotation.x = P.pitch + (Math.sin(t * .83 + 1) * .6 + Math.sin(t * 2.1) * .4) * sway;
      camera.rotation.z = (reduced ? 0 : Math.sin(bobPhase * .5) * .004 * (moving ? 1 : 0)) + Math.sin(t * .47) * sway * .5;
      if (shake > 0 && !reduced && !SET.calm) { camera.position.x += (Math.random() - .5) * .02 * shake; camera.position.y += (Math.random() - .5) * .02 * shake; shake = Math.max(0, shake - dt * .6); }
      const bright = (reg === 'house' && !S.torn ? .8 : 1) * (P.crawl ? .3 : 1) * (reg === 'vermont' ? 0 : S.karen ? .5 : 1); // in the crawlspace the walls are at your elbows; Karen's lamp is small; in Vermont it is day
      torch.angle = S.karen ? .4 : .58;
      const irisTarget = clamp(viewDistance() / 4.5, .3, 1);
      iris += (irisTarget - iris) * (1 - Math.exp(-dt * 3));
      torchDip = Math.max(0, torchDip - dt * 1.4);
      const dipK = 1 - torchDip * (reduced ? .3 : .55 + Math.random() * .25);
      torch.intensity = 34 * bright * iris * dipK * (reduced ? 1 : 1 + Math.sin(t * 13) * .015 + (Math.random() - .5) * .03);
      halo.intensity = reg === 'vermont' ? 0 : reg === 'house' ? .7 : 2.2;
      for (const l of lamps) if (l.flicker && l.src.intensity > 0 && !SET.calm) { const f = Math.random() < .04 ? .2 : 1; l.src.intensity = l.base * f * (S.torn ? .4 : 1); l.bulb.visible = f > .5; }
      for (const led of leds) led.visible = Math.floor(t * 2) % 2 === 0;
      for (const p of pickups) { const m = p.children[0]; if (m && m.isMesh && !p.userData.door) { const near = Math.hypot(p.position.x - P.x, p.position.z - P.z) < 3.5; if (m.material.emissive) m.material.emissiveIntensity = near && p === target ? 3 : 1; } }
      motesTime.value = t; screenMat.uniforms.time.value = t; breathe(dt);
      look.uniforms.time.value = t; look.uniforms.grain.value = reduced ? .015 : (reg === 'house' ? .045 : .06); look.uniforms.breath.value = reduced ? 0 : shake;
      look.uniforms.tear.value = reduced || !S.torn || reg === 'vermont' ? 0 : (reg === 'house' ? .8 : .35) * (.5 + .5 * Math.sin(t * .37));
      look.uniforms.vignette.value = reg === 'vermont' ? .3 : S.karen ? .85 : .55;
      if (reg === 'vermont') look.uniforms.grain.value = .02;
      if (SET.calm) { look.uniforms.grain.value *= .35; look.uniforms.tear.value = 0; look.uniforms.breath.value = 0; }
      look.uniforms.aberration.value = SET.calm ? 0 : .0035;
      const fovTo = mon.zoom || SET.fov; if (Math.abs(camera.fov - fovTo) > .05) { camera.fov += (fovTo - camera.fov) * (1 - Math.exp(-dt * (mon.zoom ? 3.5 : 5))); camera.updateProjectionMatrix(); }
      if (SET.fps) { fpsT -= dt; if (fpsT <= 0) { fpsT = .5; hud.fps.textContent = `${Math.round(fps)} fps`; } }
      if (tvSrc.intensity > 0) tvSrc.intensity = 1.2 + Math.random() * .8;
      if (relayGlow && relayGlow.visible) { const k = 1.15 + Math.sin(t * 2.1) * .1 + Math.sin(t * 7.3) * .06; relayGlow.scale.set(k, k, 1); relaySrc.intensity = 2.4 + k; }
      poolLights();
      shadowRef.frame++;
      const camMoved = Math.abs(P.x - shadowRef.x) > .015 || Math.abs(P.z - shadowRef.z) > .015 || Math.abs(P.yaw - shadowRef.yaw) > .003 || Math.abs(P.pitch - shadowRef.pitch) > .003 || Math.abs(camY - shadowRef.y) > .01;
      if ((camMoved && (shadowRef.frame & 1) === 0) || shadowRef.frame < 4 || shadowRef.force) { renderer.shadowMap.needsUpdate = true; shadowRef.force = false; shadowRef.x = P.x; shadowRef.z = P.z; shadowRef.yaw = P.yaw; shadowRef.pitch = P.pitch; shadowRef.y = camY; }
      steps.visible = column.visible = shaft.visible = G.built && (reg === 'hall' || reg === 'stair');
      dust.material.opacity = reg === 'house' ? .45 : reg === 'hall' ? .38 : .3;
      monitor(dt, reg);
      composer.render(dt);
      if (stillReq) grabStill();
      Sound.listen(camera.position.x, camera.position.y, camera.position.z, P.yaw);
    }
    bakeStatics();
    requestAnimationFrame(frame);

    // arrival
    function arrive() {
      if (game.ended) return; // the end card is already up
      setTimeout(() => Sound.play('door_close', { gain: .8, rate: .9 }), 1400);
      setTimeout(() => {
        card(`<p class="card-kicker">Ash Tree Lane</p><p>${store.get('endings', 0) > 0 ? 'The house is empty. It was empty last time too. It is not quite the same house.' : 'The house is empty. Whatever they left is still inside.'}</p><p class="card-help">${touch ? 'Drag on the left to walk, on the right to look. Tap what you find.' : 'Click to look around. Walk with WASD or ZQSD, turn with the arrow keys, Space to jump. Press E for what you find, J for the journal, I to invert the mouse. A gamepad works too.'}</p>`, 9000);
      }, 400);
      if (found.size > 2 && !game.ended) setTimeout(() => say(S.resumed ? 'You are where you left off. The house remembers too.' : 'You have been here before. What you found is still in the journal.', 6000), S.resumed ? 3000 : 10000);
    }

    // for tests and the curious
    window.ATL = { P, S, G, stair, stairTo, colliders, statics, baked, sources, pool, regrow: (phase, L) => { buildMaze(phase, L); placeMazePickups(); }, startKaren, enterVermont, hint: () => nextHint(), say, decor: () => mazeDecor.map(m => [+m.position.x.toFixed(2), +m.position.z.toFixed(2)]), stats: () => stats, stills: () => stills.length, takeStill, jump, air: () => P.air, temperature, startShrink, setTile, flushChunks, driftWalls, startCollapse, tileAt, camY: () => camY, paused: () => game.paused, near: () => pickups.filter(p => Math.hypot(p.position.x - P.x, p.position.z - P.z) < 3).map(p => p.userData.id + '@' + Math.hypot(p.position.x - P.x, p.position.z - P.z).toFixed(2)), yawTo: (dx, dz) => Math.atan2(-dx, -dz), models, fps: () => Math.round(fps), loaded: () => loadDone, teleport(x, z, yaw = P.yaw) { P.x = x; P.z = z; P.yaw = yaw; P.vx = P.vz = 0; }, look(yaw, pitch = 0) { P.yaw = yaw; P.pitch = pitch; }, target: () => target?.userData.id, interact: () => target && interact(target), found, unlock, keys, renderer, scene };
  }

  /* ================================================================
     Exploration #5, in the DOM: the last pages
     ================================================================ */

  const dark = $('#dark');
  const Match = { running: false };
  Match.start = (onDone, onLeave) => {
    Match.running = true;
    $('main').inert = true; journal.inert = true;
    const cv = $('.dark-canvas', dark), words = $('.dark-words', dark), page = $('.dark-page', dark), meter = $('.dark-meter', dark), hint = $('.dark-hint', dark), live = $('#dark-live');
    const btn = { primary: $('[data-act="primary"]', dark), sound: $('[data-act="sound"]', dark), back: $('[data-act="back"]', dark) };
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, raf = 0, tt = 0, last = performance.now(), closing = false;
    const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); w = innerWidth; h = innerHeight; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); m.rect = null; };
    const sayD = text => {
      for (const old of $$('p:not(.dying)', words)) { old.classList.add('dying'); old.classList.remove('in'); setTimeout(() => old.remove(), 2000); }
      const p = document.createElement('p'); p.textContent = text; mark(p); p.style.left = '50%'; p.style.top = 'max(11.5%, 6rem)';
      words.append(p); requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add('in'))); live.textContent = text;
    };
    function bookPages() {
      const pages = [{ title: true, html: '<p class="page-title">House of Leaves</p>' }];
      const src = $$('#edition p, #introduction p:not(.signature), #ch1 > p', BOOK);
      let cur = '', len = 0;
      for (const p of src) {
        const voice = p.closest('.voice-johnny') ? 'voice-johnny' : p.closest('.voice-editors') ? 'voice-editors' : '';
        const text = p.textContent.replace(/\s+/g, ' ').trim();
        if (len && len + text.length > 520) { pages.push({ html: cur }); cur = ''; len = 0; }
        const el = document.createElement('p'); if (voice) el.className = voice; el.textContent = text;
        cur += el.outerHTML; len += text.length;
        if (pages.length >= 7) break;
      }
      if (cur && pages.length < 7) pages.push({ html: cur });
      return pages;
    }
    const m = { pages: bookPages(), i: 0, light: .5, state: 'reading', clock: 0, fi: 0, fin: 0, white: 0, called: false, called2: false, swelled: false, rect: null, warned: false };
    const FINALE = [[0, 'No more pages.'], [3.4, 'Nothing under you. Nothing above.'], [7.2, 'Nothing, for a long time.'], [10.8, 'Far above you, in the house, a door opens.']];
    const ARRIVE = 99, LETGO = 99, END = 14.5; // the light that comes for him is Karen's, and you carry it
    function showPage(pg, n, total) {
      page.className = 'dark-page' + (pg.title ? ' title-page' : '');
      page.innerHTML = pg.html + (pg.title ? '' : `<p class="page-foot">${n}</p>`);
      mark(page); page.hidden = false; m.rect = null;
      live.textContent = pg.title ? 'A book. The title on its cover: House of Leaves.' : `Page ${n} of ${total - 1}.`;
    }
    function burn() {
      if (m.state !== 'reading') return;
      m.state = 'burning'; page.classList.add('burning'); Sound.crackle(2.2); m.light = 1.15;
      setTimeout(() => {
        if (!Match.running) return;
        m.i++; page.classList.remove('burning');
        if (m.i < m.pages.length) { showPage(m.pages[m.i], m.i, m.pages.length); m.state = 'reading'; if (m.i === 1) sayD('You read it by the light of the one before.'); }
        else { page.hidden = true; btn.primary.hidden = true; btn.back.disabled = true; m.state = 'finale'; m.clock = 0; words.innerHTML = ''; }
      }, reduced ? 300 : 2100);
    }
    function drawFlame(c, x, y, tm, size) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 5; k++) {
        const j = Math.sin(tm * (11 + k * 3)) * 3 + (Math.random() - .5) * 3, hgt = (40 + k * 11 + Math.sin(tm * 7 + k) * 6) * size, cy = y - hgt * .35;
        const g = c.createRadialGradient(x + j, cy, 1, x + j, cy, hgt * .62);
        g.addColorStop(0, 'rgba(255, 228, 160, .5)'); g.addColorStop(.35, 'rgba(255, 140, 50, .28)'); g.addColorStop(1, 'rgba(255, 90, 20, 0)');
        c.fillStyle = g; c.beginPath(); c.ellipse(x + j, cy, hgt * .3, hgt * .64, 0, 0, Math.PI * 2); c.fill();
      }
      c.restore();
    }
    function end(done) {
      if (closing) return; closing = true;
      Sound.ambience(false);
      dark.classList.add('leaving');
      setTimeout(() => {
        cancelAnimationFrame(raf); dark.hidden = true; dark.classList.remove('in', 'leaving'); Match.running = false;
        $('main').inert = false; journal.inert = false;
        removeEventListener('resize', resize);
        done ? onDone() : onLeave();
      }, reduced ? 60 : 1400);
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dtRaw = Math.min(.5, (now - last) / 1000), dt = Math.min(.05, dtRaw); last = now; tt += dt;
      if (m.state === 'reading') { m.light = Math.max(0, m.light - dtRaw * .075); if (m.light < .08 && !m.warned) { m.warned = true; sayD('Burn it, or read in the dark.'); } }
      else if (m.state === 'burning') m.light = Math.max(.6, m.light - dt * .1);
      else if (m.state === 'finale') {
        m.light = Math.max(0, m.light - dtRaw * .5); m.clock += dtRaw;
        while (m.fi < FINALE.length && m.clock >= FINALE[m.fi][0]) { const p = document.createElement('p'); p.textContent = FINALE[m.fi][1]; p.style.left = '50%'; p.style.top = '46%'; for (const old of $$('p:not(.dying)', words)) { old.classList.add('dying'); old.classList.remove('in'); setTimeout(() => old.remove(), 2000); } words.append(p); requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add('in'))); live.textContent = FINALE[m.fi][1]; m.fi++; }
        m.fin = clamp((m.clock - ARRIVE) / (LETGO - ARRIVE), 0, 1); m.white = clamp((m.clock - LETGO) / (END - LETGO - 1), 0, 1);
        if (!m.called && m.clock > 20.6) { m.called = true; Sound.voice({ pitch: 215, dur: .9, far: .8, level: .6 }); }
        if (!m.called2 && m.clock > 25.4) { m.called2 = true; Sound.voice({ pitch: 210, dur: 1.1, level: .7 }); }
        if (!m.swelled && m.clock > LETGO - .5) { m.swelled = true; Sound.swell(4.5); Sound.ambience(false); }
        if (m.clock >= END) end(true);
      }
      meter.textContent = m.state === 'finale' ? '' : `Pages left: ${m.pages.length - m.i}`;
      const c = ctx; c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = '#0b0b0d'; c.fillRect(-20, -20, w + 40, h + 40);
      if (!m.rect && !page.hidden) m.rect = page.getBoundingClientRect();
      const r = m.rect || { left: w / 2 - 150, width: 300, bottom: h * .7 };
      const L = clamp(m.light, 0, 1.2), gx = r.left + r.width * .16, gy = r.bottom;
      if (L > .01) {
        const g = c.createRadialGradient(gx, gy, 0, gx, gy, Math.max(w, h) * .6 * L);
        g.addColorStop(0, `rgba(255, 150, 70, ${(.3 * L).toFixed(3)})`); g.addColorStop(.4, `rgba(120, 60, 25, ${(.12 * L).toFixed(3)})`); g.addColorStop(1, 'rgba(11, 11, 13, 0)');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
      }
      if (m.state === 'burning') drawFlame(c, gx, gy + 6, tt, 1.2); else if (m.state === 'reading' && L > .05) drawFlame(c, gx, gy + 6, tt, .35 * L);
      if (m.state === 'finale' && m.fin > 0) {
        // a light, far off, coming closer: it sways the way a light carried by someone walking sways
        const e = m.fin * m.fin, sway = Math.sin(tt * 2.1) * (6 + 30 * e) + Math.sin(tt * .7) * 12 * (1 - e);
        const lx = w / 2 + sway, ly = h * (.34 + .1 * e) + Math.abs(Math.sin(tt * 4.2)) * 4 * e, rad = Math.max(w, h) * (.012 + e * .7);
        const g = c.createRadialGradient(lx, ly, 0, lx, ly, rad);
        g.addColorStop(0, `rgba(255, 248, 232, ${(.55 + .45 * e).toFixed(3)})`); g.addColorStop(.18, `rgba(255, 228, 190, ${(.28 + .5 * e).toFixed(3)})`); g.addColorStop(1, 'rgba(255, 228, 190, 0)');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.fillStyle = `rgba(255, 252, 244, ${(.6 + .4 * e).toFixed(3)})`; c.beginPath(); c.arc(lx, ly, 1.5 + 5 * e, 0, Math.PI * 2); c.fill(); // the lamp itself
        if (e > .35) { const b = (e - .35) / .65; c.fillStyle = `rgba(255, 244, 222, ${(.05 * b).toFixed(3)})`; c.fillRect(0, 0, w, h); } // it starts to reach you
      }
      if (m.state === 'finale' && m.white > 0) { const q = m.white * m.white; c.fillStyle = `rgba(246, 246, 243, ${q.toFixed(3)})`; c.fillRect(0, 0, w, h); } // the house letting go
      page.style.setProperty('--light', clamp(L, .05, 1).toFixed(3));
    }
    // wire the room
    dark.hidden = false; dark.classList.remove('leaving'); dark.classList.add('unmasked');
    words.innerHTML = ''; page.hidden = true;
    $('#dark-title').textContent = 'The last pages';
    hint.textContent = 'Burn a page to read the next one by its light.'; hint.classList.remove('off'); setTimeout(() => hint.classList.add('off'), 7000);
    btn.back.textContent = 'Turn back'; btn.back.disabled = false; btn.primary.hidden = false; btn.primary.textContent = 'Burn this page';
    btn.sound.textContent = Sound.on ? 'Sound on' : 'Sound off';
    btn.primary.onclick = burn; page.onclick = burn;
    btn.back.onclick = () => end(false);
    btn.sound.onclick = () => { Sound.toggle(); btn.sound.textContent = Sound.on ? 'Sound on' : 'Sound off'; syncSound(); };
    dark.onkeydown = e => { if (e.key === 'Escape') { e.preventDefault(); if (m.state !== 'finale') end(false); } if (e.key === ' ' && e.target === dark) { e.preventDefault(); burn(); } };
    addEventListener('resize', resize); resize();
    Sound.ambience(true, .2);
    showPage(m.pages[0], 0, m.pages.length);
    sayD('Your last light is dying. You have a book.');
    dark.tabIndex = -1; dark.focus({ preventScroll: true });
    requestAnimationFrame(() => dark.classList.add('in'));
    raf = requestAnimationFrame(frame);
  };

  renderContents();
})();
