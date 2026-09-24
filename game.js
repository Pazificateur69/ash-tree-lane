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
  const ORDER = ['edition', 'introduction', 'ch1', 'ch2', 'ch3', 'explA', 'karen', 'explorations', 'ch4', 'ch5', 'samples', 'ch6', 'tom', 'ch7', 'rescue', 'collapse', 'ch8', 'ch9', 'ch10', 'ch11', 'letters', 'exhibits', 'index', 'colophon'];
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
  function showPage(id) {
    const src = BOOK.querySelector('#' + id);
    jPage.innerHTML = '';
    const clone = src.cloneNode(true);
    jPage.append(clone);
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
      this.out.gain.value = this.on ? .9 : 0;
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
    growl(level = 1) {
      if (!this.ctx) return;
      const c = this.ctx, t = c.currentTime;
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
      g.connect(this.bus);
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
      if (this.out) this.out.gain.setTargetAtTime(this.on ? .9 : 0, this.ctx.currentTime, .08);
    }
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
    loading: $('[data-loading]'), loadBar: $('[data-load-bar]'), loadText: $('[data-load-text]')
  };
  let subTimer = 0;
  function say(text, ms = 5200) {
    clearTimeout(subTimer);
    setText(hud.sub, text);
    hud.sub.classList.add('in');
    subTimer = setTimeout(() => hud.sub.classList.remove('in'), ms);
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
        import('three/addons/utils/BufferGeometryUtils.js')
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
    const [THREE, { EffectComposer }, { RenderPass }, { ShaderPass }, { UnrealBloomPass }, { OutputPass }, { GLTFLoader }, { RGBELoader }, { mergeGeometries }] = libs;
    try { buildWorld({ THREE, EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, OutputPass, GLTFLoader, RGBELoader, mergeGeometries }); }
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

  function buildWorld({ THREE, EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, OutputPass, GLTFLoader, RGBELoader, mergeGeometries }) {
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
    const texCache = new Map();
    const T = (name, { srgb = false, repeat = [1, 1], aniso = 4 } = {}) => { // one texture per file and tiling; the same one is reused wherever it recurs
      const key = `${name}|${repeat[0]}|${repeat[1]}|${aniso}`;
      let t = texCache.get(key);
      if (t) return t;
      t = texLoader.load('assets/textures/' + name);
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

    const gltf = new GLTFLoader();
    const models = { loaded: 0, wanted: 0 };
    function model(name, { size, axis = 'y', x = 0, y = 0, z = 0, ry = 0, cast = true, mirror = false, onLoad } = {}) {
      const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; if (mirror) g.scale.z = -1; scene.add(g);
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
    const porch = box(2.4, .16, 1.2, M.brick, 2.5, .08, 13.7); block(2.5, 13.7, 2.4, 1.2);
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
      uniforms: { time: { value: 0 }, on: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float time; uniform float on; varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main(){ vec2 uv = vUv; float n = hash(floor(uv * vec2(320.0, 240.0)) + floor(time * 60.0));
          float scan = 0.82 + 0.18 * sin(uv.y * 240.0 * 3.14159); float band = 0.7 + 0.3 * smoothstep(0.0, 0.05, abs(fract(uv.y - time * 0.13) - 0.5) - 0.42);
          vec3 c = vec3(n * scan * band) * 1.4; vec2 d = uv - 0.5; c *= 1.0 - dot(d, d) * 1.4; c = c * on + (1.0 - on) * vec3(0.012, 0.012, 0.016);
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
    model('bed', { size: 2.07, axis: 'max', x: 2.4, z: 1.2, ry: Math.PI / 2 }); block(2.4, 1.2, 1.62, 2.07);
    model('blanket', { size: .5, axis: 'x', x: 2.62, y: .55, z: 1.9, ry: .4 });
    model('nightstand', { size: .6, axis: 'x', x: 1.3, z: .4 }); block(1.3, .4, .6, .32);
    model('nightstand', { size: .6, axis: 'x', x: 3.5, z: .4 }); block(3.5, .4, .6, .32);
    model('picture', { size: .19, x: 3.5, y: .34, z: .38, ry: .3 });
    model('bedside_lamp', { size: .24, x: 1.3, y: .34, z: .36, onLoad: sc => sc.traverse(o => { if (o.isMesh && /emitter/i.test(o.name)) { o.material = o.material.clone(); o.material.emissive = new THREE.Color(0xffe2b8); o.material.emissiveIntensity = 1.6; } }) });
    const bedsideSrc = source(1.3, .58, .36, 0xffd6a0, 1.1, 3.2);
    model('curtain', { size: 2.3, x: 2.05, z: .34, cast: false });
    model('curtain', { size: 2.3, x: .34, z: 1.2, ry: Math.PI / 2, cast: false });
    model('chair_damask_purplegold', { size: .7, x: 5.6, z: 1, ry: -.9 }); block(5.6, 1, .7, .7);
    model('bed', { size: 1.8, axis: 'max', x: 12.4, z: 1.05, ry: Math.PI / 2 }); block(12.4, 1.05, 1.4, 1.8);
    model('bed', { size: 1.8, axis: 'max', x: 9.6, z: 1.05, ry: Math.PI / 2 }); block(9.6, 1.05, 1.4, 1.8);
    model('nightstand', { size: .55, axis: 'x', x: 11, z: .38 }); block(11, .38, .55, .3);
    model('bedside_lamp', { size: .22, x: 11, y: .31, z: .34 });
    model('boxes', { size: .73, axis: 'z', x: 8.3, z: 3.2, ry: .2 }); block(8.3, 3.2, .5, .75);
    model('book', { size: .21, axis: 'x', x: 9.9, y: .01, z: 1.6, ry: .7, cast: false });
    model('toy_car', { size: .17, axis: 'z', x: 9.9, z: 2.3, ry: 1.9 });
    for (let k = 0; k < 4; k++) { const b = box(.16, .16, .16, k % 2 ? M.yellow : M.plastic, 8.3 + hash(k) * .5, .08, 2.6 + hash(k + 4) * .5); b.rotation.y = hash(k + 8) * 2; }

    // foyer
    solid(box(.9, .75, .4, M.wood, 4.5, .375, 12.6, 1), .9, .4);
    model('vase_small', { size: .3, x: 4.78, y: .75, z: 12.58 });
    for (let k = 0; k < 4; k++) { const hook = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .06, 6), M.brass); hook.position.set(5.2 + k * .22, 1.7, 12.88); hook.rotation.x = Math.PI / 2; scene.add(hook); stat(hook); }
    box(.02, .02, 2.4, M.wood, .09, 1.2, 11.7).rotation.z = 0; // a shelf line

    // the cameras Navidson mounted in the rooms, and their red eyes
    const leds = [];
    for (const [x, z, ry] of [[.3, 12.7, Math.PI / 4], [13.7, 5.6, -3 * Math.PI / 4], [.3, .3, -Math.PI / 4], [13.7, .3, Math.PI * 5 / 4], [6.3, 5.6, -Math.PI / 4]]) {
      const cam = box(.16, .1, .22, M.plastic, x, 2.25, z); cam.rotation.y = ry;
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(.03, .035, .04, 12), M.dark); lens.position.set(x - Math.sin(ry) * .12, 2.25, z - Math.cos(ry) * .12); lens.rotation.set(Math.PI / 2, 0, ry); scene.add(lens); stat(lens);
      const led = box(.02, .02, .02, M.led, x, 2.31, z); statics.delete(led); leds.push(led); // the eyes blink, so they stay their own meshes
    }

    const lamps = [];
    const lampAt = (x, y, z, i, shade = true) => {
      const src = source(x, y, z, 0xffc98a, i, 7.5);
      const b = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), M.bulb); b.position.copy(src.pos); scene.add(b);
      if (shade) { const s = new THREE.Mesh(new THREE.CylinderGeometry(.16, .22, .18, 14, 1, true), M.shade); s.position.set(x, y + .04, z); scene.add(s); stat(s); const stem = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, H - y - .1, 6), M.brass); stem.position.set(x, (H + y) / 2, z); scene.add(stem); stat(stem); }
      lamps.push({ src, bulb: b, base: i, flicker: hash(x * 3 + z) < .35 });
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
      G.phase = phase; G.short = phase === 'short'; G.tall = null; G.ante = null; G.low = null;
      if (phase === 'a') { // a corridor that ends in a room with two dark mouths, and a stub that stops
        L = L || 24; G.hallStart = 9999;
        carve(0, L, 76, 78);
        carve(L - 1, L + 7, 71, 83);
        carve(L + 8, L + 9, 76, 78); carve(L + 10, L + 15, 75, 79);
        carve(L + 1, L + 3, 62, 70); carve(L + 3, L + 5, 84, 92);
      } else if (phase === 'empty') { // nothing but corridor, wider as it goes, and from a certain point no ceiling at all
        L = W - 3; G.hallStart = 9999;
        for (let i = 0; i < W - 3; i++) { const half = i >= 108 && i < 126 ? 0 : 1 + Math.floor(Math.max(0, i - 60) / 26); carve(i, i, 77 - half, 77 + half); }
        G.tall = [70, 108]; G.low = [108, 126]; // the ceiling goes, then the passage narrows to a crawl, then it opens out again
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
    pickup('tape_measure', 1.1, .94, 8.6, g => { add(g, mesh(new THREE.BoxGeometry(.075, .07, .035), M.yellow), 0, .035, 0); add(g, mesh(new THREE.BoxGeometry(.4, .002, .016), M.paper), .25, .01, 0); add(g, mesh(new THREE.BoxGeometry(.012, .02, .02), M.metal), .45, .01, 0); }, { label: 'A tape measure, left open on the counter.', chapter: 'ch2' });
    pickup('tape2', 7, .02, 2.6, tapeBuild(M.labelTape2), { label: 'A Hi8 tape. In marker: 5½.', chapter: 'ch3' });
    pickup('photo', 3.7, .345, .49, g => { const p = add(g, mesh(new THREE.PlaneGeometry(.1, .05), M.tagPhoto), 0, .003, 0); p.rotation.x = -Math.PI / 2; p.rotation.z = -.4; p.material.side = THREE.DoubleSide; add(g, mesh(new THREE.BoxGeometry(.11, .002, .13), M.white), 0, .001, 0).rotation.y = -.4; }, { label: 'A photograph, face down. On the back, in pencil: K., 1989.', chapter: 'karen' });
    pickup('samples', 3.9, .77, 8.75, g => { const bag = add(g, mesh(new THREE.BoxGeometry(.14, .05, .1), new THREE.MeshStandardMaterial({ color: 0xcfd2d6, roughness: .3, transparent: true, opacity: .75 })), 0, .025, 0); bag.rotation.y = .3; add(g, mesh(new THREE.BoxGeometry(.11, .025, .08), M.ash), 0, .02, 0).rotation.y = .3; const tag = add(g, mesh(new THREE.PlaneGeometry(.09, .045), M.tagSample), .06, .004, .07); tag.rotation.x = -Math.PI / 2; tag.rotation.z = .9; tag.material.side = THREE.DoubleSide; }, { label: 'A specimen bag of gray dust, tagged in Reston’s hand.', chapter: 'samples' });
    const frontDoor = pickup('front_door', 2.5, 1, 12.92, g => { add(g, mesh(boxUV(new THREE.BoxGeometry(1, 2.05, .06), 1, 2.05, .06, 1), M.wood), 0, 0, 0); for (const y of [.55, -.15, -.75]) add(g, mesh(new THREE.BoxGeometry(.7, .45, .012), M.wood), 0, y, .035); add(g, mesh(new THREE.SphereGeometry(.03, 10, 8), M.brass), .38, -.05, .05); add(g, mesh(new THREE.BoxGeometry(.06, .11, .01), M.brass), .38, -.2, .035); }, { label: 'The front door.', door: 'front', reach: 1.8 });
    block(2.5, 12.95, 1, .2);

    // in the hallway, placed once it exists
    let mazePickups = [];
    let relayLantern = null, relayGlow = null, relayBlocks = [];
    const relaySrc = source(0, .5, 0, 0xffa858, 0, 9);
    function placeMazePickups() {
      for (const p of mazePickups) { scene.remove(p); dropPickup(p); }
      mazePickups = [];
      const gx = i => G.x0 + (i + .5) * G.T, gz = j => G.z0 + (j + .5) * G.T;
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
      for (let i = 10; i < 60 && !firstDoor; i++) { if (tileAt(i, 75) === 0) firstDoor = [i, -1]; else if (tileAt(i, 79) === 0) firstDoor = [i, 1]; }
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
    let stairPickups = { markers: null, camera: null, jed: null };
    function placeStairPickups() {
      if (!stairPickups.markers && !found.has('ch6')) {
        const [x, y, z] = onStair(8);
        stairPickups.markers = pickup('markers', x, y, z, g => { for (let k = 0; k < 6; k++) { const s = add(g, mesh(new THREE.PlaneGeometry(.05, .3), M.orange), (hash(k) - .5) * .7, .005, (hash(k + 9) - .5) * .7); s.rotation.x = -Math.PI / 2; s.rotation.z = hash(k + 3) * 3; } }, { label: 'Neon markers. Shredded.', chapter: 'ch6', stairDepth: 8 });
      }
      if (!stairPickups.jed) {
        const [x, y, z] = onStair(22);
        stairPickups.jed = pickup('jed', x, y, z, g => { add(g, mesh(new THREE.BoxGeometry(.14, .025, .1), new THREE.MeshStandardMaterial({ color: 0x3a1c1c, roughness: 1 })), 0, .012, 0).rotation.y = .6; add(g, mesh(new THREE.BoxGeometry(.06, .015, .06), M.white), .1, .008, .05); }, { label: 'A bandage, stiff with blood. Jed kept Wax alive here for two days.', say: 'Two days. He talked to him the whole time, so that he would stay.', stairDepth: 22 });
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
      put(pickup('karen_tapes', 1.1, .345, .46, g => { for (let k = 0; k < 3; k++) add(g, mesh(new THREE.BoxGeometry(.19, .025, .1), M.tape), 0, .0125 + k * .027, 0).rotation.y = (k - 1) * .15; add(g, mesh(new THREE.PlaneGeometry(.13, .05), M.labelKaren), 0, .082, 0).rotation.set(-Math.PI / 2, 0, .3); }, { label: 'VHS tapes, labeled in Karen’s hand: WHAT SOME HAVE THOUGHT.', chapter: 'ch9' }));
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

    const P = { x: 3, z: 12.1, yaw: 0, pitch: 0, vx: 0, vz: 0, r: .3, bob: 0, walked: 0, stepAcc: 0, inMaze: false, region: 'house', lineOut: 0, deepest: 0 };
    const keys = new Set();
    const KEYMAP = { KeyW: 'f', KeyZ: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', KeyQ: 'l', KeyD: 'r', ArrowLeft: 'tl', ArrowRight: 'tr', PageUp: 'pu', PageDown: 'pd', ShiftLeft: 'run', ShiftRight: 'run' };
    addEventListener('keydown', e => {
      if (!game.started || game.ended) return;
      if (!journal.hidden || !$('#dark').hidden) return;
      if (KEYMAP[e.code]) { keys.add(KEYMAP[e.code]); e.preventDefault(); }
      if ((e.code === 'Enter' || e.code === 'Space') && e.target.closest && e.target.closest('button, a, input')) return; // the control has it
      if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') { if (target) { interact(target); e.preventDefault(); } }
      if (e.code === 'KeyJ') { openJournal(jPage.dataset.id); e.preventDefault(); }
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
      P.yaw -= e.movementX * .0021; P.pitch = clamp(P.pitch - e.movementY * .0021, -1.35, 1.35);
    });
    // touch: left half walks, the rest looks
    const fingers = new Map();
    let stick = { dx: 0, dz: 0 };
    canvas.addEventListener('touchstart', e => {
      for (const t of e.changedTouches) fingers.set(t.identifier, { x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY, t0: performance.now(), move: t.clientX < innerWidth * .45 });
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        const f = fingers.get(t.identifier); if (!f) continue;
        if (f.move) { stick.dx = clamp((t.clientX - f.x0) / 60, -1, 1); stick.dz = clamp((t.clientY - f.y0) / 60, -1, 1); }
        else { P.yaw -= (t.clientX - f.x) * .0048; P.pitch = clamp(P.pitch - (t.clientY - f.y) * .0048, -1.35, 1.35); }
        f.x = t.clientX; f.y = t.clientY;
      }
      e.preventDefault();
    }, { passive: false });
    const endTouch = e => {
      for (const t of e.changedTouches) {
        const f = fingers.get(t.identifier); if (!f) continue;
        if (f.move) stick = { dx: 0, dz: 0 };
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

    const S = { closet: false, hallway: false, torn: false, fleeing: false, explore5: false, arrived: false, grewA: false, turnA: false, regrow: null, regrowText: null, collapsePending: false, collapseT: -1, collapsed: false, doorOpen: false, doorAjar: false, quarterAt: 0, stairShort: false, saidDoor: false, saidAnte: false, farOut: false };
    const mazePhase = () => found.has('ch9') ? 'empty' : found.has('ch7') ? 'short' : found.has('explA') ? 'long' : 'a';
    function openCloset(silent) {
      if (S.closet) return; S.closet = true;
      closetPlug.open(); shadowRef.force = true;
      if (!silent) { Sound.creak(); Sound.play('door_open', { gain: .5, rate: .8, at: .4 }); setTimeout(() => say('Somewhere in the house, a door that was not there.'), 900); }
    }
    function openHallway(silent) {
      if (S.hallway) return; S.hallway = true;
      hallwayPlug.open();
      buildMaze(mazePhase()); placeMazePickups();
      placeSteps(true); placeStairPickups(); bakeStatics();
      if (!silent) { Sound.growl(.35); setTimeout(() => say('The living room has a new door. Behind it, the yard should be.'), 1200); }
    }
    function tearHouse(silent) {
      if (S.torn) return; S.torn = true;
      if (G.built && G.phase !== 'short') { buildMaze('short'); placeMazePickups(); }
      const rand = rng(41);
      for (const w of houseWalls) {
        if (w.tag === 'plug' || w.tag === 'lintel' || w.tag === 'sill') continue;
        const roll = rand();
        if (['hall', 'kitchen-living'].includes(w.tag) && roll < .5) { statics.delete(w.mesh); w.mesh.removeFromParent(); const k = colliders.indexOf(w.col); if (k >= 0) colliders.splice(k, 1); }
        else if (roll < .75) { w.mesh.rotation.z = (rand() - .5) * .16; w.mesh.rotation.x = (rand() - .5) * .1; }
      }
      houseCeiling.material = M.ashFloor; houseCeiling.position.y = H + .6; houseCeiling.rotation.z = .04;
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
      if (u.say) say(u.say);
      if (u.chapter) {
        Sound.click();
        if (!u.keep) { scene.remove(p); dropPickup(p); target = null; hud.prompt.hidden = true; }
        if (u.id === 'trunk' && found.has('ch11')) { unlock('letters'); return; }
        unlock(u.chapter);
      }
    }

    /* the house closes: after the rescue, the rooms the family lives in come apart around them */
    const leanMore = (w, rand) => [(rand() - .5) * .22, (rand() - .5) * .3 * (w.tag === 'plug' || w.tag === 'sill' || w.tag === 'lintel' ? .5 : 1)];
    function startCollapse() {
      S.collapsePending = false; S.collapseT = 0; S.doorOpen = true;
      const rand = rng(77);
      for (const w of houseWalls) {
        if (!w.mesh.parent) continue;
        statics.delete(w.mesh); w.mesh.visible = true; w.mesh.matrixAutoUpdate = true; // the walls move on their own for a while
        const [dx, dz] = leanMore(w, rand);
        w.lean0 = [w.mesh.rotation.x, w.mesh.rotation.z]; w.lean1 = [w.mesh.rotation.x + dx, w.mesh.rotation.z + dz];
      }
      bakeStatics();
      Sound.growl(1.3); shake = 2; torchDip = 1;
      say('The house is closing.', 4000);
      for (const [ms, text] of [[4500, 'Tom has Daisy. Chad is out. The front door.'], [11000, 'The floor is going.'], [18000, 'Get out of the house.']]) setTimeout(() => { if (S.collapseT >= 0) say(text, 5000); }, ms);
    }
    function collapseStep(dt) {
      S.collapseT += dt;
      const k = clamp(S.collapseT / 26, 0, 1), e = k * k * (3 - 2 * k);
      for (const w of houseWalls) if (w.lean1 && w.mesh.parent) { w.mesh.rotation.x = w.lean0[0] + (w.lean1[0] - w.lean0[0]) * e; w.mesh.rotation.z = w.lean0[1] + (w.lean1[1] - w.lean0[1]) * e; }
      houseCeiling.position.y = (S.torn ? H + .6 : H) - .9 * e;
      if (Math.random() < dt / 2.2) { Sound.play('door_close', { gain: .9, rate: .7 + Math.random() * .4 }); shake = Math.max(shake, .8); torchDip = Math.max(torchDip, .5); }
      if (Math.random() < dt / 5) Sound.growl(.6);
      for (const l of lamps) if (l.src.intensity > 0 && Math.random() < dt / 6) { l.src.intensity = 0; l.bulb.visible = false; }
      const outside = P.z > 13.4 || P.z < -.4 || P.x < -.4;
      if (S.collapseT > 30 || (outside && S.collapseT > 6)) endCollapse(outside);
    }
    function endCollapse(outside) {
      S.collapseT = -1; S.collapsed = true;
      for (const w of houseWalls) if (w.lean1 && w.mesh.parent) { w.mesh.rotation.x = w.lean1[0]; w.mesh.rotation.z = w.lean1[1]; stat(w.mesh); }
      houseCeiling.position.y = (S.torn ? H + .6 : H) - .9;
      bakeStatics();
      setTimeout(() => say(outside ? 'The house stops. Tom did not come out.' : 'The house stops. Tom is not in it.', 8000), 1500);
    }
    function applyCollapsed() { // a house reopened after it closed
      if (S.collapsed) return; S.collapsed = true; S.doorOpen = true;
      const rand = rng(77);
      for (const w of houseWalls) { if (!w.mesh.parent) continue; const [dx, dz] = leanMore(w, rand); w.mesh.rotation.x += dx; w.mesh.rotation.z += dz; }
      houseCeiling.position.y = (S.torn ? H + .6 : H) - .9;
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
      S.quarterAt = t; Sound.coin(); say('Listen.', 2500); setTimeout(() => say('You will not hear it land.', 7000), 7000);
    }
    /* Exploration A: the corridor is longer on the way back */
    function explorationA() {
      const fx = -Math.sin(P.yaw);
      if (!S.grewA && P.x > G.x0 + (G.L - 1) * G.T && fx > .4) { S.grewA = true; buildMaze('a', G.L + 30); P.x += 30 * G.T; P.lineOut += 30 * G.T; placeMazePickups(); S.turnA = true; }
      if (S.turnA && fx < -.5) { S.turnA = false; Sound.knock(); say('The corridor is longer than it was.', 6000); }
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
        unlock('ch10', false); unlock('ch11', false);
        store.set('again', false);
        game.ended = true;
        finish();
      }, () => { P.x = 12.8; P.z = 8.5; P.yaw = Math.PI / 2; game.resume(); });
    }
    function finish() {
      game.ended = true;
      if (document.pointerLockElement) document.exitPointerLock();
      hud.veil.hidden = true; hud.prompt.hidden = true; hud.meter.textContent = '';
      Sound.ambience(false); Sound.weather(false); Sound.groan(false);
      card(`<p class="card-kicker">Vermont</p><p>You burned every page. Someone came into the dark with a light, and you came out together.</p><p>What you carried out is in the journal. The letters, the exhibits and the index at the back are for whoever is still reading.</p><div class="card-actions"><button type="button" data-journal>Open the journal</button><button type="button" data-again>Walk the house again</button></div>`);
      $('[data-again]', hud.card)?.addEventListener('click', () => { store.set('again', true); location.reload(); });
      $('button', hud.card)?.focus({ preventScroll: true });
    }
    if (game.ended) setTimeout(finish, 600);

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
      if (P.x < G.x0 - .1) return 'house';
      if (stair.active) return 'stair';
      return P.x > G.x0 + G.hallStart * G.T - 1 ? 'hall' : 'maze';
    }
    const tc = s => { s = Math.max(0, Math.floor(s)); const p = n => String(n).padStart(2, '0'); return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`; };

    function frame(now) {
      requestAnimationFrame(frame);
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
      const mag = Math.hypot(mx, mz); if (mag > 1) { mx /= mag; mz /= mag; }
      let speed = keys.has('run') ? 3.4 : 2.1;
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
          if (!S.stairShort) { S.stairShort = true; say('The staircase is longer than it was. It is adding to itself under you.', 6000); }
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
        while (stair.beat < STAIR_BEATS.length && depth >= STAIR_BEATS[stair.beat][0]) { const [, text, fx] = STAIR_BEATS[stair.beat++]; say(text); if (fx === 'growl') { Sound.growl(); shake = 1; torchDip = 1; } }
        if (depth > 20 && Math.random() < dt / 40) { Sound.growl(.6); shake = .6; torchDip = .7; }
        hud.meter.textContent = `Down: ${fmt(depth * FT)} ft. Steps: ${fmt(depth / RISE)}.`;
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
            } else { const kk = (WELL + P.r) / r; P.x = cx + dx * kk; P.z = cz + dz * kk; }
          }
        }
        // the door back, once you have seen the bottom of what you can see
        if (S.explore5 && G.phase === 'empty' && P.x > G.x0 + 75) startExploration5();
      }
      if (stair.active) { // the eye follows the gait: level on the tread, then down over the edge
        const f = stair.f, target = reduced ? 1.6 - stair.u / STEP_A * RISE : 1.6 - (stair.k + THREE.MathUtils.smoothstep(f, .55, 1)) * RISE - .02 * Math.sin(Math.PI * f);
        camY += (target - camY) * (1 - Math.exp(-dt * (reduced ? 6 : 22)));
      } else { const crawl = !!(G.low && P.x > G.x0 + G.low[0] * G.T && P.x < G.x0 + G.low[1] * G.T); P.crawl = crawl; camY += ((crawl ? .95 : 1.6) - camY) * (1 - Math.exp(-dt * (crawl ? 4 : 14))); }

      // footsteps
      const reg = region();
      if (reg !== P.region) { Sound.room(reg === 'house' ? .06 : reg === 'maze' ? .38 : reg === 'hall' ? .55 : .45); P.region = reg; }
      if (!stair.active && P.walked - P.stepAcc > .62) { P.stepAcc = P.walked; Sound.step(reg !== 'house', reg === 'maze' || reg === 'hall'); }

      // hallway beats by line paid out
      if (reg === 'maze' || reg === 'hall') {
        P.lineOut = Math.max(P.lineOut, P.x - G.x0);
        const out = (P.x - G.x0) * FT;
        hud.meter.textContent = reg === 'hall' ? (S.quarterAt ? `The Great Hall. The quarter has been falling for ${fmt(t - S.quarterAt)} s.` : 'The Great Hall.') : G.phase === 'empty' ? `${fmt(out)} ft. No line.` : `Line paid out: ${fmt(out)} ft.`;
        if (G.phase === 'long') while (sayBeat < HALL_BEATS.length && (P.x - G.x0) >= HALL_BEATS[sayBeat][0]) {
          const [, text, fx] = HALL_BEATS[sayBeat++]; say(text);
          if (fx === 'growl') { Sound.growl(); shake = 1; torchDip = 1; }
          if (fx === 'longer' && G.L < 180) { buildMaze('long', 180); placeMazePickups(); } // the Hall recedes: the corridor is always longer than it was
        }
        if (G.phase === 'empty') while (emptyBeat < EMPTY_BEATS.length && (P.x - G.x0) >= EMPTY_BEATS[emptyBeat][0]) say(EMPTY_BEATS[emptyBeat++][1], 6000);
        if (G.phase === 'a') explorationA();
        if (G.ante && !S.saidAnte) { const i = (P.x - G.x0) / G.T; if (i > G.ante[0] && i < G.ante[1]) { S.saidAnte = true; say('A room with a doorway on every side. All of them go in. None of them go back.', 7000); } }
        if ((G.phase === 'long' || G.phase === 'short') && !stair.active) driftWalls(dt);
        if (S.torn && (P.x - G.x0) > 2 && Math.random() < dt / 30) { Sound.growl(.5); shake = .5; torchDip = .6; }
      } else if (reg === 'house') {
        if (S.regrow && G.built) { buildMaze(S.regrow); placeMazePickups(); const txt = S.regrowText; S.regrow = S.regrowText = null; if (txt) setTimeout(() => say(txt, 7000), 800); }
        if (S.collapsePending && S.collapseT < 0 && !S.collapsed) startCollapse();
        hud.meter.textContent = S.collapseT >= 0 ? 'The house is closing.' : S.torn ? 'The house is not the size it was.' : '';
        if (S.torn && S.collapseT < 0 && Math.random() < dt / 25) { Sound.growl(.4); shake = .4; torchDip = .5; }
        if (!S.torn && Math.random() < dt / 90) Sound.knock();
        if (S.doorAjar && P.z > 14 && !S.farOut && Math.hypot(P.x - 7, P.z - 6.5) > 24) { S.farOut = true; say('The house is behind you. So is everything in it.', 7000); }
      }
      if (S.collapseT >= 0) collapseStep(dt);
      if (S.doorAjar && frontDoor.userData.swing < 1) { const sw = frontDoor.userData.swing = Math.min(1, frontDoor.userData.swing + dt * .7); frontDoor.rotation.y = -1.9 * sw * sw * (3 - 2 * sw); }
      Sound.ambience(reg !== 'house' || S.torn, reg === 'house' ? .08 : reg === 'stair' ? .22 : .16);
      Sound.weather(reg === 'house' && !S.torn);
      Sound.groan(reg === 'house' && S.torn);
      fogTarget = reg === 'house' ? (S.torn ? .1 : .045) : reg === 'maze' ? .085 : reg === 'hall' ? .05 : .075;
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
      const cold = P.region !== 'house' || S.torn;
      breathTimer -= dt;
      if (cold && breathTimer <= 0 && !reduced) {
        breathTimer = 3.2 + Math.random() * 2.2;
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
    let iris = 1;
    let bobPhase = 0;
    function render(dt) {
      scene.fog.density += (fogTarget - scene.fog.density) * (1 - Math.exp(-dt * 2));
      const reg = P.region;
      scene.fog.color.setHex(reg === 'house' && !S.torn ? 0x0a0808 : 0x050506);
      skyDome.visible = reg === 'house';
      const moving = Math.hypot(P.vx, P.vz) > .3;
      bobPhase += dt * (moving ? 9 : 0);
      const bob = reduced ? 0 : Math.sin(bobPhase) * .028 * (moving ? 1 : 0);
      const y = camY + bob;
      camera.position.set(P.x, y, P.z);
      const sway = reduced ? 0 : .0035 * (S.torn ? 2 : 1);
      camera.rotation.y = P.yaw + (Math.sin(t * .61) * .6 + Math.sin(t * 1.73) * .4) * sway;
      camera.rotation.x = P.pitch + (Math.sin(t * .83 + 1) * .6 + Math.sin(t * 2.1) * .4) * sway;
      camera.rotation.z = (reduced ? 0 : Math.sin(bobPhase * .5) * .004 * (moving ? 1 : 0)) + Math.sin(t * .47) * sway * .5;
      if (shake > 0 && !reduced) { camera.position.x += (Math.random() - .5) * .02 * shake; camera.position.y += (Math.random() - .5) * .02 * shake; shake = Math.max(0, shake - dt * .6); }
      const bright = (reg === 'house' && !S.torn ? .8 : 1) * (P.crawl ? .3 : 1); // in the crawlspace the walls are at your elbows
      const irisTarget = clamp(viewDistance() / 4.5, .3, 1);
      iris += (irisTarget - iris) * (1 - Math.exp(-dt * 3));
      torchDip = Math.max(0, torchDip - dt * 1.4);
      const dipK = 1 - torchDip * (reduced ? .3 : .55 + Math.random() * .25);
      torch.intensity = 34 * bright * iris * dipK * (reduced ? 1 : 1 + Math.sin(t * 13) * .015 + (Math.random() - .5) * .03);
      halo.intensity = reg === 'house' ? .7 : 2.2;
      for (const l of lamps) if (l.flicker && l.src.intensity > 0) { const f = Math.random() < .04 ? .2 : 1; l.src.intensity = l.base * f * (S.torn ? .4 : 1); l.bulb.visible = f > .5; }
      for (const led of leds) led.visible = Math.floor(t * 2) % 2 === 0;
      for (const p of pickups) { const m = p.children[0]; if (m && m.isMesh && !p.userData.door) { const near = Math.hypot(p.position.x - P.x, p.position.z - P.z) < 3.5; if (m.material.emissive) m.material.emissiveIntensity = near && p === target ? 3 : 1; } }
      motesTime.value = t; screenMat.uniforms.time.value = t; breathe(dt);
      look.uniforms.time.value = t; look.uniforms.grain.value = reduced ? .015 : (reg === 'house' ? .045 : .06); look.uniforms.breath.value = reduced ? 0 : shake;
      look.uniforms.tear.value = reduced || !S.torn ? 0 : (reg === 'house' ? .8 : .35) * (.5 + .5 * Math.sin(t * .37));
      if (tvSrc.intensity > 0) tvSrc.intensity = 1.2 + Math.random() * .8;
      if (relayGlow && relayGlow.visible) { const k = 1.15 + Math.sin(t * 2.1) * .1 + Math.sin(t * 7.3) * .06; relayGlow.scale.set(k, k, 1); relaySrc.intensity = 2.4 + k; }
      poolLights();
      shadowRef.frame++;
      const camMoved = Math.abs(P.x - shadowRef.x) > .015 || Math.abs(P.z - shadowRef.z) > .015 || Math.abs(P.yaw - shadowRef.yaw) > .003 || Math.abs(P.pitch - shadowRef.pitch) > .003 || Math.abs(camY - shadowRef.y) > .01;
      if ((camMoved && (shadowRef.frame & 1) === 0) || shadowRef.frame < 4 || shadowRef.force) { renderer.shadowMap.needsUpdate = true; shadowRef.force = false; shadowRef.x = P.x; shadowRef.z = P.z; shadowRef.yaw = P.yaw; shadowRef.pitch = P.pitch; shadowRef.y = camY; }
      steps.visible = column.visible = shaft.visible = G.built && (reg === 'hall' || reg === 'stair');
      dust.material.opacity = reg === 'house' ? .45 : reg === 'hall' ? .38 : .3;
      composer.render(dt);
    }
    bakeStatics();
    requestAnimationFrame(frame);

    // arrival
    function arrive() {
      if (game.ended) return; // the end card is already up
      setTimeout(() => Sound.play('door_close', { gain: .8, rate: .9 }), 1400);
      setTimeout(() => {
        card(`<p class="card-kicker">Ash Tree Lane</p><p>The house is empty. Whatever they left is still inside.</p><p class="card-help">${touch ? 'Drag on the left to walk, on the right to look. Tap what you find.' : 'Click to look around. Walk with WASD or ZQSD, turn with the arrow keys. Press E for what you find, J for the journal.'}</p>`, 9000);
      }, 400);
      if (found.size > 2 && !game.ended) setTimeout(() => say('You have been here before. What you found is still in the journal.', 6000), 10000);
    }

    // for tests and the curious
    window.ATL = { P, S, G, stair, stairTo, colliders, statics, baked, sources, pool, regrow: (phase, L) => { buildMaze(phase, L); placeMazePickups(); }, setTile, flushChunks, driftWalls, startCollapse, tileAt, camY: () => camY, paused: () => game.paused, near: () => pickups.filter(p => Math.hypot(p.position.x - P.x, p.position.z - P.z) < 3).map(p => p.userData.id + '@' + Math.hypot(p.position.x - P.x, p.position.z - P.z).toFixed(2)), yawTo: (dx, dz) => Math.atan2(-dx, -dz), models, fps: () => Math.round(fps), loaded: () => loadDone, teleport(x, z, yaw = P.yaw) { P.x = x; P.z = z; P.yaw = yaw; P.vx = P.vz = 0; }, look(yaw, pitch = 0) { P.yaw = yaw; P.pitch = pitch; }, target: () => target?.userData.id, interact: () => target && interact(target), found, unlock, keys, renderer, scene };
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
    const m = { pages: bookPages(), i: 0, light: .5, state: 'reading', clock: 0, fi: 0, fin: 0, rect: null, warned: false };
    const FINALE = [[0, 'No more pages.'], [3.4, 'Nothing under you. Nothing above.'], [7.2, 'Nothing, for a long time.'], [11.6, 'Then, very far off, a light that is not yours.'], [16.8, 'Karen.']];
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
        if (m.clock > 11.6) m.fin = Math.min(1, (m.clock - 11.6) / 8);
        if (m.fin >= 1) end(true);
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
        const e = m.fin * m.fin, g = c.createRadialGradient(w / 2, h * .3, 0, w / 2, h * .3, Math.max(w, h) * (.05 + e * 1.2));
        g.addColorStop(0, `rgba(255, 244, 222, ${(.25 + .75 * e).toFixed(3)})`); g.addColorStop(1, 'rgba(255, 244, 222, 0)');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        if (e > .7) { c.fillStyle = `rgba(246, 246, 243, ${((e - .7) / .3).toFixed(3)})`; c.fillRect(0, 0, w, h); }
      }
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
