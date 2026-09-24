/* Ash Tree Lane. Plain script, no dependencies. The page reads fine without it; this adds the house. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(pointer: coarse)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fmt = n => Math.round(n).toLocaleString('en-US');

  const store = {
    get(k, d) { try { const v = localStorage.getItem('atl:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('atl:' + k, JSON.stringify(v)); } catch (e) { /* private mode: the house simply stops growing */ } }
  };
  const visits = store.get('visits', 0) + 1;
  store.set('visits', visits);

  // seeded, so every reader sees the page tear the same way
  const rng = seed => () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  /* ---------- text preparation (before colouring words) ---------- */

  $$('.torn p').forEach((p, pi) => {
    const rand = rng(97 + pi * 13);
    const words = p.textContent.trim().split(/\s+/);
    const strength = pi === 0 ? 1 : 1.9;
    p.textContent = '';
    for (let i = 0; i < words.length;) {
      const n = 2 + Math.floor(rand() * 4);
      const s = document.createElement('span');
      s.className = 'shard';
      s.textContent = words.slice(i, i + n).join(' ');
      s.style.setProperty('--dx', ((rand() - .5) * 22 * strength).toFixed(1) + 'px');
      s.style.setProperty('--dy', ((rand() - .3) * 15 * strength).toFixed(1) + 'px');
      s.style.setProperty('--r', ((rand() - .5) * 7 * strength).toFixed(2) + 'deg');
      if (rand() < .1 * strength) s.style.setProperty('--fade', '.2');
      p.append(s, ' ');
      i += n;
    }
  });

  $$('[data-cipher]').forEach(p => {
    p.innerHTML = p.textContent.replace(/[A-Za-z]+/g, w => `<span class="ini">${w[0]}</span><span class="rest">${w.slice(1)}</span>`);
  });

  /* ---------- the two coloured words ---------- */

  const WORDS = /\b(houses?|maisons?|haus|casa)\b|\b(minotaurs?)\b/gi;
  const HAS_WORD = new RegExp(WORDS.source, 'i'); // stateless twin: a /g regex's lastIndex leaks into matchAll
  function mark(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentElement;
        if (!p || p.closest('script, style, title, textarea, .house, .minotaur, [data-plain]')) return NodeFilter.FILTER_REJECT;
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
  mark(document.body);

  /* ---------- measurements: the house grows a sixteenth of a pixel per visit ---------- */

  const growth = (() => {
    const n = 4 + (visits - 1); // sixteenths
    let r = n % 16, d = 16;
    while (r && r % 2 === 0) { r /= 2; d /= 2; }
    return { whole: Math.floor(n / 16), frac: r ? `${r}⁄${d}` : '' };
  })();
  const inside = px => `${fmt(px + growth.whole)}${growth.frac ? ' ' + growth.frac : ''} px`;

  function measure() {
    const out = $('[data-outside]'), inn = $('[data-inside]');
    if (out && inn) { out.textContent = fmt(innerHeight) + ' px'; inn.textContent = inside(innerHeight); }
    const ch = $('#ch2'), co = $('[data-chapter-out]'), ci = $('[data-chapter-in]');
    if (ch && co && ci) { co.textContent = fmt(ch.offsetHeight) + ' px'; ci.textContent = inside(ch.offsetHeight); }
  }
  measure();

  if (visits > 1) {
    const vn = $('[data-visit-note]');
    if (vn) { vn.hidden = false; vn.textContent = `On your first visit the difference was a quarter of a pixel. This is visit ${visits}.`; }
    const band = $('.hallway-band');
    if (band) band.style.setProperty('--grow', Math.min(visits - 1, 30) * 9 + 'vh');
    const bn = $('[data-band-note]');
    if (bn) { bn.hidden = false; bn.textContent = 'This passage was shorter the first time you came.'; }
  }

  /* ---------- note references, and notes as leaves ---------- */

  const VOICE = { zampano: 'Zampanò', johnny: 'Johnny Truant', editors: 'The Editors', pelafina: 'Pelafina' };
  $$('a.ref').forEach(a => {
    const n = document.getElementById(a.hash.slice(1));
    if (!n) return;
    a.dataset.voice = n.dataset.voice;
    a.setAttribute('aria-label', `Note ${n.dataset.num}, ${VOICE[n.dataset.voice]}`);
    a.setAttribute('aria-haspopup', 'dialog');
  });

  const leaves = $('#leaves');
  const opened = [];

  function openLeaf(ref) {
    const src = document.getElementById(ref.hash.slice(1));
    if (!src) return;
    const i = opened.length;
    const leaf = document.createElement('section');
    leaf.className = 'leaf';
    leaf.dataset.voice = src.dataset.voice;
    leaf.setAttribute('role', 'dialog');
    leaf.setAttribute('aria-label', `Note ${src.dataset.num}, ${VOICE[src.dataset.voice]}`);
    leaf.style.setProperty('--i', i);
    leaf.style.setProperty('--tilt', ((((i * 5 + +src.dataset.num * 3) % 7) - 3) * .32).toFixed(2) + 'deg');

    const head = document.createElement('header');
    head.className = 'leaf-head';
    head.innerHTML = `<span class="leaf-num"></span><span class="leaf-voice"></span><button class="leaf-close" type="button">Close</button>`;
    head.children[0].textContent = src.dataset.num;
    head.children[1].textContent = VOICE[src.dataset.voice];

    const body = src.cloneNode(true);
    body.removeAttribute('id');
    body.className = 'leaf-body';
    body.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));

    leaf.append(head, body);
    leaves.append(leaf);
    leaves.classList.add('open');
    opened.push({ leaf, ref });
    requestAnimationFrame(() => requestAnimationFrame(() => leaf.classList.add('in')));
    head.querySelector('.leaf-close').focus({ preventScroll: true });
  }
  function closeLeaf(restore = true) {
    const o = opened.pop();
    if (!o) return;
    o.leaf.classList.remove('in');
    setTimeout(() => o.leaf.remove(), 450);
    if (!opened.length) leaves.classList.remove('open');
    if (restore) o.ref.focus({ preventScroll: true });
  }
  const closeAllLeaves = () => { while (opened.length) closeLeaf(opened.length === 1); };

  /* ---------- clicks ---------- */

  const contents = $('#contents');

  document.addEventListener('click', e => {
    const t = e.target;

    const explore = t.closest('[data-explore]');
    if (explore) { if (contents.open) contents.close(); openDark(explore.dataset.explore, explore); return; }

    const ref = t.closest('a.ref');
    if (ref) { e.preventDefault(); openLeaf(ref); return; }

    if (t.closest('.leaf-close')) { closeLeaf(); return; }
    if (opened.length && t.closest('.leaf a[href^="#"]')) { closeAllLeaves(); return; }
    if (opened.length && !t.closest('.leaf')) { closeAllLeaves(); return; }

    const turn = t.closest('[data-turn]');
    if (turn) {
      const el = document.getElementById(turn.dataset.turn);
      const cls = turn.dataset.turn === 'inventory' ? 'flipped' : 'turned';
      const on = el.classList.toggle(cls);
      turn.textContent = on ? 'Turn it back' : (cls === 'flipped' ? 'Turn the leaf' : 'Turn the book');
      return;
    }

    if (t.closest('[data-decode]')) { decode(t.closest('[data-decode]')); return; }

    if (t.closest('.runhead-contents')) { contents.showModal(); return; }
    if (contents.open && t.closest('#contents a')) contents.close();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && opened.length && !D.mode) { e.preventDefault(); closeLeaf(); }
  });

  /* ---------- Pelafina's cipher ---------- */

  const GROUPS = [3, 2, 7, 3];
  function decode(btn) {
    const c = $('[data-cipher]'), out = $('[data-decoded]');
    const on = c.classList.toggle('decoding');
    const letters = $$('.ini', c).map(s => s.textContent.toLowerCase()).join('');
    let k = 0;
    out.textContent = on ? GROUPS.map(n => letters.slice(k, (k += n))).join(' ') : '';
    out.hidden = !on;
    btn.textContent = on ? 'Read the whole words' : 'Read the first letters';
  }

  /* ---------- running head, folio, doors, tape ---------- */

  const runChapter = $('.runhead-chapter'), folio = $('.folio');

  new IntersectionObserver(([e]) => document.body.classList.toggle('past-threshold', !e.isIntersecting))
    .observe($('.threshold'));

  const chapterIO = new IntersectionObserver(es => {
    for (const e of es) if (e.isIntersecting) setText(runChapter, e.target.dataset.title || '');
  }, { rootMargin: '-45% 0px -54% 0px' });
  $$('[data-title]').forEach(s => chapterIO.observe(s));

  const paras = $$('main p').filter(p => !p.closest('.note, .threshold, .hallway-band'));
  function paginate() {
    const ph = innerHeight * .9;
    for (const p of paras) p.dataset.page = 1 + Math.floor((p.getBoundingClientRect().top + scrollY) / ph);
  }
  let pageTimer = 0;
  const schedulePaginate = () => { clearTimeout(pageTimer); pageTimer = setTimeout(() => { paginate(); measure(); }, 250); };
  const folioIO = new IntersectionObserver(es => {
    for (const e of es) if (e.isIntersecting && e.target.dataset.page) folio.textContent = e.target.dataset.page;
  }, { rootMargin: '-50% 0px -49% 0px' });
  paras.forEach(p => folioIO.observe(p));
  paginate();
  if (document.fonts) document.fonts.ready.then(schedulePaginate);
  addEventListener('resize', () => { schedulePaginate(); if (D.mode) resize(); });

  // a door only shows itself to someone who lingers
  $$('.door').forEach(door => {
    let timer = 0;
    new IntersectionObserver(([e]) => {
      clearTimeout(timer);
      if (e.isIntersecting) timer = setTimeout(() => door.classList.add('open'), reduced ? 0 : 1500);
    }, { threshold: .5 }).observe(door);
  });

  const tc = $('.tape-tc');
  if (tc) {
    let t0 = 0, raf = 0;
    const OFFSET = (41 * 60 + 8) * 30; // frames
    const tick = now => {
      if (!t0) t0 = now;
      const f = OFFSET + Math.floor((now - t0) / (1000 / 30)), s = Math.floor(f / 30);
      tc.textContent = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60, f % 30].map(v => String(v).padStart(2, '0')).join(':');
      raf = requestAnimationFrame(tick);
    };
    new IntersectionObserver(([e]) => { cancelAnimationFrame(raf); if (e.isIntersecting) raf = requestAnimationFrame(tick); }).observe(tc);
  }

  /* ---------- time spent in the house ---------- */

  const tStart = Date.now(), before = store.get('ms', 0);
  addEventListener('pagehide', () => store.set('ms', before + Date.now() - tStart));
  const human = ms => {
    const m = Math.floor(ms / 60000);
    if (m < 1) return 'less than a minute';
    if (m < 60) return `${m} minute${m > 1 ? 's' : ''}`;
    const h = Math.floor(m / 60), r = m % 60;
    return `${h} hour${h > 1 ? 's' : ''}${r ? ` ${r} minute${r > 1 ? 's' : ''}` : ''}`;
  };
  const timeEl = $('[data-time-inside]');
  const tickTime = () => {
    const now = Date.now() - tStart;
    setText(timeEl, visits > 1
      ? `You have been in the house for ${human(now)} this time, and ${human(before + now)} in all.`
      : `You have been in the house for ${human(now)}.`);
  };
  if (timeEl) { tickTime(); setInterval(tickTime, 20000); }

  /* ================================================================
     Sound: synthesized, nothing downloaded
     ================================================================ */

  const Sound = {
    ctx: null, out: null, buf: null, drone: null,
    on: store.get('sound', true),
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.out = this.ctx.createGain();
      this.out.gain.value = this.on ? .9 : 0;
      this.out.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 4, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; } // brown noise
      this.buf = buf;
    },
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    noise() { const s = this.ctx.createBufferSource(); s.buffer = this.buf; s.loop = true; s.playbackRate.value = .8 + Math.random() * .4; return s; },
    ambience(on) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      if (on && !this.drone) {
        const src = this.noise(), lp = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
        lp.type = 'lowpass'; lp.frequency.value = 210;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + 3);
        src.connect(lp).connect(g).connect(this.out);
        src.start();
        this.drone = { src, g };
      } else if (!on && this.drone) {
        const { src, g } = this.drone;
        g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, .4);
        src.stop(t + 2.5);
        this.drone = null;
      }
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
      g.connect(this.out);
      src.start(t); o.start(t); src.stop(t + 7); o.stop(t + 7);
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
    if (document.hidden) Sound.ctx.suspend(); else if (D.mode) Sound.ctx.resume();
  });

  /* ================================================================
     The dark: one overlay, three rooms
     ================================================================ */

  const dark = $('#dark');
  const D = {
    cv: $('.dark-canvas', dark), words: $('.dark-words', dark), page: $('.dark-page', dark),
    meter: $('.dark-meter', dark), hint: $('.dark-hint', dark), live: $('#dark-live'), title: $('#dark-title'),
    btn: { primary: $('[data-act="primary"]', dark), sound: $('[data-act="sound"]', dark), back: $('[data-act="back"]', dark) },
    ctx: null, w: 0, h: 0, dpr: 1, mode: null, kind: '', raf: 0, last: 0, t: 0,
    px: 0, py: 0, tx: 0, ty: 0, idle: 0, shake: 0, opener: null, startedAt: 0, closing: false, hintTimer: 0
  };

  function resize() {
    D.dpr = Math.min(2, window.devicePixelRatio || 1);
    D.w = innerWidth; D.h = innerHeight;
    D.cv.width = Math.round(D.w * D.dpr); D.cv.height = Math.round(D.h * D.dpr);
    D.ctx = D.cv.getContext('2d');
    if (D.mode && D.mode.onResize) D.mode.onResize();
  }

  const syncSound = () => { D.btn.sound.textContent = Sound.on ? 'Sound on' : 'Sound off'; D.btn.sound.setAttribute('aria-pressed', String(Sound.on)); };

  function say(html, x, y) {
    for (const old of $$('p:not(.dying)', D.words)) { old.classList.add('dying'); old.classList.remove('in'); setTimeout(() => old.remove(), 2000); }
    const p = document.createElement('p');
    p.textContent = html;
    mark(p);
    p.style.left = x * 100 + '%';
    p.style.top = y * 100 + '%';
    D.words.append(p);
    requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add('in')));
    D.live.textContent = p.textContent;
  }
  const SPOTS = [[.5, .6], [.38, .44], [.62, .42], [.44, .66], [.58, .56], [.5, .38], [.36, .58], [.64, .62]];
  const spot = i => SPOTS[i % SPOTS.length];

  function openDark(kind, opener) {
    if (D.mode || !MODES[kind]) return;
    closeAllLeaves();
    Sound.init(); Sound.resume();
    D.opener = opener || document.activeElement;
    D.kind = kind;
    D.mode = MODES[kind];
    D.closing = false;
    dark.hidden = false;
    dark.classList.remove('leaving', 'unmasked');
    document.documentElement.style.overflow = 'hidden';
    resize();
    D.px = D.tx = D.w / 2; D.py = D.ty = D.h * .55; D.idle = 0; D.shake = 0;
    D.words.innerHTML = '';
    D.page.hidden = true;
    D.meter.textContent = '';
    D.title.textContent = D.mode.title;
    D.hint.textContent = D.mode.hint;
    D.hint.classList.remove('off');
    clearTimeout(D.hintTimer);
    D.hintTimer = setTimeout(() => D.hint.classList.add('off'), 7000);
    D.btn.back.textContent = D.mode.back;
    D.btn.back.disabled = false;
    D.btn.primary.hidden = !D.mode.primary;
    if (D.mode.primary) D.btn.primary.textContent = D.mode.primary;
    syncSound();
    D.startedAt = performance.now();
    D.mode.init();
    Sound.ambience(true);
    dark.tabIndex = -1;
    dark.focus({ preventScroll: true });
    requestAnimationFrame(() => dark.classList.add('in'));
    D.last = performance.now();
    cancelAnimationFrame(D.raf);
    D.raf = requestAnimationFrame(frame);
  }

  function closeDark(receiptText) {
    if (!D.mode || D.closing) return;
    D.closing = true;
    const kind = D.kind, mode = D.mode;
    Sound.ambience(false);
    if (mode.onClose) mode.onClose();
    dark.classList.add('leaving');
    setTimeout(() => {
      cancelAnimationFrame(D.raf);
      dark.hidden = true;
      dark.classList.remove('in', 'leaving');
      document.documentElement.style.overflow = '';
      D.mode = null;
      if (receiptText) {
        const r = $(`[data-receipt="${kind}"]`);
        if (r) { r.hidden = false; setText(r, receiptText); }
      }
      if (!mode.keepFocus && D.opener && D.opener.focus) D.opener.focus({ preventScroll: true });
    }, reduced ? 60 : 1400);
  }

  function frame(now) {
    const dt = Math.min(.05, (now - D.last) / 1000);
    D.last = now; D.t += dt;
    D.idle += dt;
    if (D.idle > 4) { // no input for a while: the light drifts on its own
      D.tx = D.w / 2 + Math.sin(D.t * .4) * D.w * .08;
      D.ty = D.h * .52 + Math.cos(D.t * .33) * D.h * .06;
    }
    const k = 1 - Math.exp(-dt * 9);
    D.px += (D.tx - D.px) * k;
    D.py += (D.ty - D.py) * k;

    D.mode.update(dt);
    const c = D.ctx;
    c.setTransform(D.dpr, 0, 0, D.dpr, 0, 0);
    if (D.shake > 0 && !reduced) {
      c.translate((Math.random() - .5) * 7 * D.shake, (Math.random() - .5) * 7 * D.shake);
      D.shake = Math.max(0, D.shake - dt * .5);
    }
    D.mode.draw(c, D.w, D.h);
    if (D.mode.torch !== false) torch(c);
    D.words.style.setProperty('--tx', D.px.toFixed(1) + 'px');
    D.words.style.setProperty('--ty', D.py.toFixed(1) + 'px');
    D.raf = requestAnimationFrame(frame);
  }

  function torch(c) {
    const { w, h, px, py } = D;
    const flick = reduced ? 0 : Math.sin(D.t * 13) * .012 + Math.sin(D.t * 29) * .008 + (Math.random() - .5) * .012;
    const R = Math.min(w, h) * .36 * (1 + flick);
    const amb = D.mode.ambient ? D.mode.ambient() : 0;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const warm = c.createRadialGradient(px, py, 0, px, py, R * .9);
    warm.addColorStop(0, 'rgba(255, 236, 205, .07)');
    warm.addColorStop(1, 'rgba(255, 236, 205, 0)');
    c.fillStyle = warm;
    c.fillRect(0, 0, w, h);
    c.restore();
    const g = c.createRadialGradient(px, py, R * .04, px, py, R);
    g.addColorStop(0, 'rgba(11, 11, 13, 0)');
    g.addColorStop(.5, `rgba(11, 11, 13, ${(.3 * (1 - amb)).toFixed(3)})`);
    g.addColorStop(1, `rgba(11, 11, 13, ${(1 - amb).toFixed(3)})`);
    c.fillStyle = g;
    c.fillRect(-20, -20, w + 40, h + 40);
    D.words.style.setProperty('--tr', (R * 1.05).toFixed(0) + 'px');
  }

  function quad(c, x1, y1, x2, y2, x3, y3, x4, y4, fill) {
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.lineTo(x4, y4); c.closePath();
    c.fillStyle = fill; c.fill();
  }
  const ash = (base, fog) => `rgb(${(base * fog) | 0}, ${(base * fog * .985) | 0}, ${(base * fog * .95) | 0})`;

  function walk(mode, dt, beats, value) {
    while (mode.beat < beats.length && value >= beats[mode.beat][0]) {
      const [, text, fx] = beats[mode.beat];
      say(text, ...spot(mode.beat));
      if (fx === 'growl') { Sound.growl(); D.shake = 1; }
      mode.beat++;
    }
  }
  const duration = s => s < 60 ? `${Math.round(s)} seconds` : `${Math.floor(s / 60)} min ${Math.round(s % 60)} s`;

  /* ---------- room 1: the hallway ---------- */

  const HALL_BEATS = [
    [2, 'The doorway is behind you. Its light is the only light.'],
    [18, 'Ash-gray walls. No switch, no socket, no seam.'],
    [45, 'It is cold the way a cellar is cold, with no season in it.'],
    [80, 'Your light goes forward and does not arrive anywhere.'],
    [125, 'A doorway on the left. Another on the right. Rooms with nothing in them.'],
    [175, 'Something, very far off, shifts its weight.', 'growl'],
    [230, 'You have walked farther than the house is wide.'],
    [300, 'The line on the spool is thinner than it was.'],
    [390, 'Nobody would blame you for turning back.'],
    [500, 'The dark ahead is the same as the dark behind.'],
    [650, 'It keeps going. It will keep going for as long as you do.']
  ];

  function drawCorridor(c, w, h, z) {
    c.fillStyle = '#0b0b0d';
    c.fillRect(-20, -20, w + 40, h + 40);
    const f = Math.min(w, h) * .95;
    const vx = w / 2 - (D.px - w / 2) * .05, vy = h * .5 - (D.py - h / 2) * .04;
    const HW = 1.15, TOP = 1.45, BOT = 1.2, SEG = 3.2, NEAR = .35;
    const first = Math.floor(z / SEG);
    for (let k = first + 48; k >= first; k--) {
      const za = k * SEG - z, zb = za + SEG;
      if (zb <= NEAR) continue;
      const a = f / Math.max(NEAR, za), b = f / zb;
      const fog = Math.exp(-(Math.max(0, za) + zb) * .5 / 40);
      const seam = k % 2 ? 1 : .93;
      const A = { l: vx - HW * a, r: vx + HW * a, t: vy - TOP * a, b: vy + BOT * a };
      const B = { l: vx - HW * b, r: vx + HW * b, t: vy - TOP * b, b: vy + BOT * b };
      quad(c, A.l, A.t, B.l, B.t, B.l, B.b, A.l, A.b, ash(124 * seam, fog));
      quad(c, A.r, A.t, B.r, B.t, B.r, B.b, A.r, A.b, ash(116 * seam, fog));
      quad(c, A.l, A.b, B.l, B.b, B.r, B.b, A.r, A.b, ash(90 * seam, fog));
      quad(c, A.l, A.t, B.l, B.t, B.r, B.t, A.r, A.t, ash(62 * seam, fog));
      const hk = hash(k);
      if (k > 3 && hk < .16 && za + SEG * .25 > NEAR) { // an opening in a side wall
        const side = hk < .08 ? -1 : 1;
        const s0 = f / (za + SEG * .25), s1 = f / (za + SEG * .75);
        const lintel = BOT - (BOT + TOP) * .78;
        quad(c,
          vx + side * HW * s0, vy + lintel * s0,
          vx + side * HW * s1, vy + lintel * s1,
          vx + side * HW * s1, vy + BOT * s1,
          vx + side * HW * s0, vy + BOT * s0, '#050506');
      }
      c.strokeStyle = `rgba(0, 0, 0, ${(.28 * fog).toFixed(3)})`;
      c.lineWidth = 1;
      c.strokeRect(A.l, A.t, A.r - A.l, A.b - A.t);
    }
  }

  const hallway = {
    title: 'The hallway',
    back: 'Follow the line back',
    hint: touch ? 'Drag up to walk. The light follows your finger.' : 'Scroll or use the arrow keys to walk. Move the pointer to aim the light.',
    init() { this.z = 0; this.target = 0; this.beat = 0; this.ret = null; },
    advance(d) { if (!this.ret) this.target = Math.max(0, this.target + d * .04); },
    ambient() { return .24 * Math.exp(-this.z / 22); }, // the doorway behind you
    leave() {
      if (this.ret) return;
      if (this.z < 4) return closeDark();
      this.ret = { from: this.z, t: 0, dur: clamp(this.z / 40, 2.5, 9) };
      say('It is longer going back.', .5, .42);
      D.btn.back.disabled = true;
    },
    update(dt) {
      if (this.ret) {
        const r = this.ret;
        r.t += dt;
        const u = clamp(r.t / r.dur, 0, 1), e = u * u * (3 - 2 * u);
        this.z = r.from * (1 - e);
        D.meter.textContent = `In: ${fmt(r.from)} ft. Back: ${fmt(r.from * 1.6 * e)} ft.`;
        if (u >= 1 && !D.closing) {
          const secs = (performance.now() - D.startedAt) / 1000;
          closeDark(`You were inside for ${duration(secs)}. You walked ${fmt(r.from)} ft in and ${fmt(r.from * 1.6)} ft back.`);
        }
        return;
      }
      this.z += (this.target - this.z) * (1 - Math.exp(-dt * 3.5));
      walk(this, dt, HALL_BEATS, this.z);
      if (this.z > 420 && Math.random() < dt / 45) { Sound.growl(.6); D.shake = .6; }
      D.meter.textContent = `Line paid out: ${fmt(this.z)} ft`;
    },
    draw(c, w, h) { drawCorridor(c, w, h, this.z); }
  };

  /* ---------- room 2: the Great Hall and the staircase ---------- */

  const HALL_LEN = 60, RISE = .6, TURN = .27;
  const STAIR_BEATS = [
    [2, 'The Great Hall.'],
    [15, 'Your light goes out into it and does not come back.'],
    [32, 'No wall in reach. No ceiling you can find.'],
    [50, 'In the middle of all that nothing, a staircase, going down.'],
    [72, 'They counted the steps. Then they stopped counting.'],
    [115, 'Holloway wants to go down. Jed and Wax want to go home.'],
    [175, 'Drop something and listen. You will not hear it land.'],
    [245, 'The growl comes from below. Or from the walls. Or from you.', 'growl'],
    [335, 'Somewhere above you, Tom is keeping the radio alive.'],
    [470, 'The markers you left on the way down are gone.'],
    [650, 'There is always another turn.'],
    [920, 'If there is a bottom, it is not for you.']
  ];

  function drawDust(c, w, h, d, alpha, dust) {
    const f = Math.min(w, h) * .9;
    c.fillStyle = 'rgb(217, 216, 210)';
    for (const [x, y, z0] of dust) {
      let dz = ((z0 - d) % 90 + 90) % 90; // the dust never runs out
      if (dz < .6) continue;
      const s = f / dz;
      const sx = w / 2 + x * s * .12 - (D.px - w / 2) * .03, sy = h / 2 + y * s * .12 - (D.py - h / 2) * .03;
      if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) continue;
      c.globalAlpha = alpha * clamp(5 / dz, 0, .8);
      c.beginPath();
      c.arc(sx, sy, clamp(s * .004, .5, 2.2), 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
  }

  function drawSpiral(c, w, h, down, alpha) {
    const f = Math.min(w, h) * (h > w * 1.3 ? .75 : .55); // portrait phones get a wider well
    const cx = w / 2 - (D.px - w / 2) * .04, cy = h / 2 - (D.py - h / 2) * .04;
    const EYE = 1.7, R0 = 1.1, R1 = 3.4;
    const i0 = Math.floor(down / RISE);
    const rot = (down / RISE) * TURN * (reduced ? .4 : 1); // you turn as you go down
    c.globalAlpha = alpha;
    for (let i = i0 + 210; i >= i0 - 1; i--) {
      const dy = i * RISE - down + EYE;
      if (dy < .25) continue;
      const s = f / dy;
      const a0 = i * TURN - rot + Math.PI / 2, a1 = a0 + TURN * 1.03;
      const fog = Math.exp(-dy / 30);
      const lum = (i % 2 ? 128 : 114);
      c.beginPath();
      c.moveTo(cx + Math.cos(a0) * R0 * s, cy + Math.sin(a0) * R0 * s);
      c.lineTo(cx + Math.cos(a0) * R1 * s, cy + Math.sin(a0) * R1 * s);
      c.arc(cx, cy, R1 * s, a0, a1);
      c.lineTo(cx + Math.cos(a1) * R0 * s, cy + Math.sin(a1) * R0 * s);
      c.arc(cx, cy, R0 * s, a1, a0, true);
      c.closePath();
      c.fillStyle = ash(lum, fog);
      c.fill();
      c.strokeStyle = `rgba(0, 0, 0, ${(.55 * fog).toFixed(3)})`;
      c.lineWidth = Math.max(.5, s * .012);
      c.beginPath();
      c.moveTo(cx + Math.cos(a0) * R0 * s, cy + Math.sin(a0) * R0 * s);
      c.lineTo(cx + Math.cos(a0) * R1 * s, cy + Math.sin(a0) * R1 * s);
      c.stroke();
    }
    c.globalAlpha = 1;
  }

  const stair = {
    title: 'The staircase',
    back: 'Climb back up',
    hint: touch ? 'Drag up to go on. The light follows your finger.' : 'Scroll or use the arrow keys to go on. Move the pointer to aim the light.',
    init() {
      this.d = 0; this.target = 0; this.beat = 0; this.ret = null;
      this.dust = Array.from({ length: 260 }, (_, i) => [(hash(i) - .5) * 60, (hash(i + 500) - .5) * 16, hash(i + 900) * 90]);
    },
    advance(dy) { if (!this.ret) this.target = Math.max(0, this.target + dy * .035); },
    down() { return Math.max(0, this.d - HALL_LEN); },
    leave() {
      if (this.ret) return;
      if (this.d < 3) return closeDark();
      this.ret = { from: this.d, t: 0, dur: clamp(this.d / 45, 2.5, 9) };
      say(this.down() > 0 ? 'The way up is longer than the way down.' : 'Back across the Hall.', .5, .42);
      D.btn.back.disabled = true;
    },
    update(dt) {
      if (this.ret) {
        const r = this.ret;
        r.t += dt;
        const u = clamp(r.t / r.dur, 0, 1), e = u * u * (3 - 2 * u);
        this.d = r.from * (1 - e);
        const deep = Math.max(0, r.from - HALL_LEN);
        D.meter.textContent = deep ? `Down: ${fmt(deep)} ft. Up: ${fmt(deep * 1.4 * e)} ft.` : `Across: ${fmt(this.d)} ft`;
        if (u >= 1 && !D.closing) {
          closeDark(deep
            ? `You went down ${fmt(deep)} ft, about ${fmt(deep / RISE)} steps, and did not reach the bottom.`
            : `You crossed ${fmt(r.from)} ft of the Great Hall and touched nothing.`);
        }
        return;
      }
      this.d += (this.target - this.d) * (1 - Math.exp(-dt * 3.5));
      walk(this, dt, STAIR_BEATS, this.d);
      if (this.d > 400 && Math.random() < dt / 40) { Sound.growl(.7); D.shake = .7; }
      const down = this.down();
      D.meter.textContent = down > 0 ? `Down: ${fmt(down)} ft. Steps: ${fmt(down / RISE)}.` : `Across the Great Hall: ${fmt(this.d)} ft`;
    },
    draw(c, w, h) {
      c.fillStyle = '#0b0b0d';
      c.fillRect(-20, -20, w + 40, h + 40);
      const hallAlpha = clamp(1 - (this.d - (HALL_LEN - 14)) / 14, 0, 1);
      if (hallAlpha > 0) drawDust(c, w, h, this.d, hallAlpha, this.dust);
      if (hallAlpha < 1) drawSpiral(c, w, h, this.down(), 1 - hallAlpha);
    }
  };

  /* ---------- room 3: Exploration #5, the last pages ---------- */

  function bookPages() {
    const pages = [{ title: true, html: '<p class="page-title">House of Leaves</p>' }];
    const src = $$('#edition p, #introduction p:not(.signature), #ch1 > p');
    let cur = '', len = 0;
    for (const p of src) {
      const voice = p.closest('.voice-johnny') ? 'voice-johnny' : p.closest('.voice-editors') ? 'voice-editors' : '';
      const text = p.textContent.replace(/\s+/g, ' ').trim();
      if (len && len + text.length > 520) { pages.push({ html: cur }); cur = ''; len = 0; }
      const el = document.createElement('p');
      if (voice) el.className = voice;
      el.textContent = text;
      cur += el.outerHTML;
      len += text.length;
      if (pages.length >= 7) break;
    }
    if (cur && pages.length < 7) pages.push({ html: cur });
    return pages;
  }

  function showPage(pg, n, total) {
    D.page.className = 'dark-page' + (pg.title ? ' title-page' : '');
    D.page.innerHTML = pg.html + (pg.title ? '' : `<p class="page-foot">${n}</p>`);
    mark(D.page);
    D.page.hidden = false;
    D.live.textContent = pg.title ? 'A book. The title on its cover: House of Leaves.' : `Page ${n} of ${total - 1}.`;
    match.rect = null;
  }

  function drawFlame(c, x, y, t, size) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 5; k++) {
      const j = Math.sin(t * (11 + k * 3)) * 3 + (Math.random() - .5) * 3;
      const hgt = (40 + k * 11 + Math.sin(t * 7 + k) * 6) * size;
      const cy = y - hgt * .35;
      const g = c.createRadialGradient(x + j, cy, 1, x + j, cy, hgt * .62);
      g.addColorStop(0, 'rgba(255, 228, 160, .5)');
      g.addColorStop(.35, 'rgba(255, 140, 50, .28)');
      g.addColorStop(1, 'rgba(255, 90, 20, 0)');
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(x + j, cy, hgt * .3, hgt * .64, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  const FINALE = [
    [0, 'No more pages.'],
    [3.4, 'Nothing under you. Nothing above.'],
    [7.2, 'Nothing, for a long time.'],
    [11.6, 'Then, very far off, a light that is not yours.'],
    [16.8, 'Karen.']
  ];

  const match = {
    title: 'The last pages',
    back: 'Leave',
    primary: 'Burn this page',
    hint: 'Burn a page to read the next one by its light.',
    torch: false,
    init() {
      this.pages = bookPages();
      this.i = 0; this.light = .5; this.state = 'reading'; this.clock = 0; this.fi = 0; this.fin = 0; this.rect = null; this.warned = false;
      this.after = false;
      D.btn.primary.hidden = false;
      dark.classList.add('unmasked');
      showPage(this.pages[0], 0, this.pages.length);
      say('Your last light is dying. You have a book.', .5, .115);
    },
    primaryAct() {
      if (this.state !== 'reading') return;
      this.state = 'burning';
      D.page.classList.add('burning');
      Sound.crackle(2.2);
      this.light = 1.15;
      setTimeout(() => {
        if (!D.mode) return;
        this.i++;
        D.page.classList.remove('burning');
        if (this.i < this.pages.length) {
          showPage(this.pages[this.i], this.i, this.pages.length);
          this.state = 'reading';
          if (this.i === 1) say('You read it by the light of the one before.', .5, .115);
        } else {
          D.page.hidden = true;
          D.btn.primary.hidden = true;
          this.state = 'finale';
          this.clock = 0;
          D.words.innerHTML = '';
        }
      }, reduced ? 300 : 2100);
    },
    leave() { closeDark(this.i ? `You burned ${this.i} page${this.i > 1 ? 's' : ''} and left before the end.` : ''); },
    onClose() {
      if (this.state === 'finale' && this.fin >= 1) {
        const target = $('#ch11');
        if (target) { target.scrollIntoView({ behavior: 'instant', block: 'start' }); target.querySelector('.ch-head').setAttribute('tabindex', '-1'); }
        this.after = true;
      }
    },
    get keepFocus() { return this.after; },
    update(dt) {
      if (this.state === 'reading') {
        this.light = Math.max(0, this.light - dt * .075);
        if (this.light < .08 && !this.warned) { this.warned = true; say('Burn it, or read in the dark.', .5, .115); }
      } else if (this.state === 'burning') {
        this.light = Math.max(.6, this.light - dt * .1);
      } else if (this.state === 'finale') {
        this.light = Math.max(0, this.light - dt * .5);
        this.clock += dt;
        while (this.fi < FINALE.length && this.clock >= FINALE[this.fi][0]) { say(FINALE[this.fi][1], .5, .46); this.fi++; }
        if (this.clock > 11.6) this.fin = Math.min(1, (this.clock - 11.6) / 8);
        if (this.fin >= 1 && !D.closing) {
          closeDark('You burned every page.');
          setTimeout(() => { const h = $('#ch11 .ch-head'); if (h) h.focus({ preventScroll: true }); }, reduced ? 80 : 1450);
        }
      }
      if (this.state !== 'finale') D.meter.textContent = `Pages left: ${this.pages.length - this.i}`;
      else D.meter.textContent = '';
    },
    onResize() { this.rect = null; },
    draw(c, w, h) {
      c.fillStyle = '#0b0b0d';
      c.fillRect(-20, -20, w + 40, h + 40);
      if (!this.rect && !D.page.hidden) this.rect = D.page.getBoundingClientRect();
      const r = this.rect || { left: w / 2 - 150, width: 300, bottom: h * .7 };
      const L = clamp(this.light, 0, 1.2);
      const gx = r.left + r.width * .16, gy = r.bottom;
      if (L > .01) {
        const g = c.createRadialGradient(gx, gy, 0, gx, gy, Math.max(w, h) * .6 * L);
        g.addColorStop(0, `rgba(255, 150, 70, ${(.3 * L).toFixed(3)})`);
        g.addColorStop(.4, `rgba(120, 60, 25, ${(.12 * L).toFixed(3)})`);
        g.addColorStop(1, 'rgba(11, 11, 13, 0)');
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
      }
      if (this.state === 'burning') drawFlame(c, gx, gy + 6, D.t, 1.2);
      else if (this.state === 'reading' && L > .05) drawFlame(c, gx, gy + 6, D.t, .35 * L);
      if (this.state === 'finale' && this.fin > 0) {
        const e = this.fin * this.fin;
        const g = c.createRadialGradient(w / 2, h * .3, 0, w / 2, h * .3, Math.max(w, h) * (.05 + e * 1.2));
        g.addColorStop(0, `rgba(255, 244, 222, ${(.25 + .75 * e).toFixed(3)})`);
        g.addColorStop(1, 'rgba(255, 244, 222, 0)');
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
        if (e > .7) { c.fillStyle = `rgba(246, 246, 243, ${((e - .7) / .3).toFixed(3)})`; c.fillRect(0, 0, w, h); }
      }
      D.page.style.setProperty('--light', clamp(L, .05, 1).toFixed(3));
    }
  };

  const MODES = { hallway, stair, match };

  /* ---------- input in the dark ---------- */

  dark.addEventListener('pointermove', e => { D.tx = e.clientX; D.ty = e.clientY; D.idle = 0; });
  dark.addEventListener('wheel', e => {
    e.preventDefault();
    if (!D.mode || !D.mode.advance) return;
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * D.h : e.deltaY;
    D.mode.advance(dy);
  }, { passive: false });
  let touchY = null;
  dark.addEventListener('touchstart', e => {
    const t = e.touches[0];
    touchY = t.clientY;
    D.tx = t.clientX; D.ty = t.clientY - 90; D.idle = 0; // the light sits above the finger, not under it
  }, { passive: true });
  dark.addEventListener('touchmove', e => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    const t = e.touches[0];
    if (touchY != null && D.mode && D.mode.advance) D.mode.advance((touchY - t.clientY) * 2.4);
    touchY = t.clientY;
    D.tx = t.clientX; D.ty = t.clientY - 90; D.idle = 0;
  }, { passive: false });
  dark.addEventListener('touchend', () => { touchY = null; });

  dark.addEventListener('keydown', e => {
    if (!D.mode) return;
    if (e.key === 'Escape') { e.preventDefault(); D.mode.leave ? D.mode.leave() : closeDark(); return; }
    if (e.key === 'Tab') {
      const f = $$('button:not([hidden]):not([disabled])', dark);
      if (!f.length) return;
      e.preventDefault();
      const i = f.indexOf(document.activeElement);
      f[e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i + 1) % f.length].focus();
      return;
    }
    if (e.key === ' ' && e.target === dark) {
      e.preventDefault();
      if (D.mode.primaryAct) D.mode.primaryAct(); else if (D.mode.advance) D.mode.advance(90);
      return;
    }
    const fwd = ['ArrowUp', 'w', 'W', 'PageDown'].includes(e.key), back = ['ArrowDown', 's', 'S', 'PageUp'].includes(e.key);
    if ((fwd || back) && D.mode.advance) { e.preventDefault(); D.mode.advance(fwd ? 70 : -70); }
  });

  D.page.addEventListener('click', () => { if (D.mode && D.mode.primaryAct) D.mode.primaryAct(); });
  D.btn.primary.addEventListener('click', () => { if (D.mode && D.mode.primaryAct) D.mode.primaryAct(); });
  D.btn.back.addEventListener('click', () => { if (D.mode) D.mode.leave ? D.mode.leave() : closeDark(); });
  D.btn.sound.addEventListener('click', () => { Sound.init(); Sound.resume(); Sound.toggle(); syncSound(); });
})();
