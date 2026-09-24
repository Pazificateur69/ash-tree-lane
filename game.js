/* Ash Tree Lane: the house. One module, no build step. three.js is fetched when the door opens. */
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
  const visits = store.get('visits', 0) + 1;
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

  const BOOK = $('#book').content;
  const ORDER = ['edition', 'introduction', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9', 'ch10', 'ch11', 'letters', 'colophon'];
  const TITLES = Object.fromEntries(ORDER.map(id => [id, BOOK.getElementById(id).dataset.title]));
  const found = new Set(store.get('found', ['edition', 'colophon']));
  let readAll = false;
  const journal = $('#journal'), jPage = $('[data-page]', journal), jContents = $('[data-contents]', journal), jCount = $('[data-count]', journal);
  const has = id => readAll || found.has(id);

  function renderContents() {
    jContents.innerHTML = '';
    let n = 0;
    for (const id of ORDER) {
      const li = document.createElement('li');
      if (has(id)) {
        if (!['edition', 'colophon'].includes(id)) n++;
        const b = document.createElement('button');
        b.type = 'button'; b.dataset.show = id; b.textContent = TITLES[id];
        if (id === jPage.dataset.id) b.setAttribute('aria-current', 'page');
        mark(b);
        li.append(b);
      } else {
        li.className = 'locked';
        li.innerHTML = '<span aria-label="Not found yet">· · · · ·</span>';
      }
      jContents.append(li);
    }
    const total = ORDER.length - 2;
    jCount.textContent = `${Math.min(n, total)} of ${total} found`;
  }
  function showPage(id) {
    const src = BOOK.getElementById(id);
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
  let journalReturn = null;
  function openJournal(id) {
    journalReturn = document.activeElement;
    journal.hidden = false;
    document.body.classList.add('journal-open');
    game.pause();
    showPage(id || ORDER.find(has));
  }
  function closeJournal() {
    closeAllLeaves();
    journal.hidden = true;
    document.body.classList.remove('journal-open');
    const id = jPage.dataset.id;
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
    leaf.setAttribute('role', 'dialog');
    leaf.setAttribute('aria-label', `Note ${src.dataset.num}, ${VOICE[src.dataset.voice]}`);
    leaf.style.setProperty('--i', i);
    leaf.style.setProperty('--tilt', ((((i * 5 + +src.dataset.num * 3) % 7) - 3) * .32).toFixed(2) + 'deg');
    const head = document.createElement('header');
    head.className = 'leaf-head';
    head.innerHTML = '<span class="leaf-num"></span><span class="leaf-voice"></span><button class="leaf-close" type="button">Close</button>';
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

  /* torn text in chapter VIII, prepared once in the template */
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
    }
  });

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
      for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
      this.buf = buf;
    },
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
    step(hard, echo) {
      if (!this.ctx) return;
      const c = this.ctx, t = c.currentTime;
      const burst = (at, gain) => {
        const s = this.noise(), f = c.createBiquadFilter(), g = c.createGain();
        f.type = hard ? 'bandpass' : 'lowpass'; f.frequency.value = hard ? 900 : 380; f.Q.value = hard ? 1.2 : .7;
        g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(gain, at + .008); g.gain.setTargetAtTime(0, at + .02, hard ? .05 : .03);
        s.connect(f).connect(g).connect(this.out);
        s.start(at); s.stop(at + .5);
      };
      burst(t, hard ? .22 : .12);
      if (echo) { burst(t + .33, .09); burst(t + .71, .045); }
    },
    creak() {
      if (!this.ctx) return;
      const c = this.ctx, t = c.currentTime;
      const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(48, t + 2.2);
      l.frequency.value = 9; lg.gain.value = 6; l.connect(lg).connect(o.frequency);
      f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = 4;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + .4); g.gain.setTargetAtTime(0, t + 1.8, .4);
      o.connect(f).connect(g).connect(this.out);
      o.start(t); l.start(t); o.stop(t + 3.5); l.stop(t + 3.5);
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
    sub: $('[data-sub]'), prompt: $('[data-prompt]'), meter: $('[data-meter]'), hint: $('[data-hint]'),
    journal: $('[data-journal]'), sound: $('[data-sound]'), veil: $('[data-veil]'), card: $('[data-card]')
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
  const syncJournalButton = () => { hud.journal.textContent = `Journal · ${[...found].filter(id => !['edition', 'colophon'].includes(id)).length}`; };
  syncJournalButton();

  /* ================================================================
     The game
     ================================================================ */

  const game = { started: false, paused: false, ended: false, three: null, world: null };
  game.pause = () => { game.paused = true; if (document.pointerLockElement) document.exitPointerLock(); };
  game.resume = () => { game.paused = false; if (game.started && !game.ended && !touch && !document.pointerLockElement) { hud.veil.hidden = false; } };

  $('#enter').addEventListener('click', start);

  async function start() {
    if (game.started) return;
    Sound.init(); Sound.resume();
    const btn = $('#enter');
    btn.disabled = true; btn.textContent = 'Opening';
    try {
      game.three = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js');
    } catch (e) {
      btn.disabled = false; btn.textContent = 'Open the door';
      say('The door will not open: the 3D library could not be loaded. You can still read the journal.', 8000);
      return;
    }
    game.started = true;
    $('.threshold').hidden = true;
    $('#game').hidden = false;
    document.body.classList.add('in-house');
    buildWorld(game.three);
  }

  const HALL_BEATS = [
    [3, 'The doorway is behind you. Its light is the only light that is not yours.'],
    [9, 'Ash-gray walls. No switch, no socket, no seam.'],
    [16, 'It is cold the way a cellar is cold, with no season in it.'],
    [26, 'Your light goes forward and does not arrive anywhere.'],
    [36, 'You have walked farther than the house is wide.'],
    [48, 'Something, very far off, shifts its weight.', 'growl'],
    [58, 'The line on the spool is thinner than it was.'],
    [66, 'The dark ahead is the same as the dark behind.']
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

  function buildWorld(THREE) {
    const canvas = $('.game-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, touch ? 1.25 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030304);
    scene.fog = new THREE.FogExp2(0x070608, 0.05);
    const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 220);
    camera.rotation.order = 'YXZ';

    /* textures, drawn rather than downloaded */
    const tex = (draw, size = 256, rx = 1, ry = 1) => {
      const c = document.createElement('canvas'); c.width = c.height = size;
      draw(c.getContext('2d'), size);
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      return t;
    };
    const noiseOver = (g, size, n, alpha) => { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(0,0,0,${(Math.random() * alpha).toFixed(3)})`; g.fillRect(Math.random() * size, Math.random() * size, 2, 2); } };
    const woodTex = tex((g, s) => {
      const rand = rng(7);
      for (let y = 0; y < s; y += 32) {
        const l = 38 + rand() * 22;
        g.fillStyle = `hsl(28, 32%, ${l}%)`; g.fillRect(0, y, s, 32);
        g.fillStyle = `rgba(0,0,0,.35)`; g.fillRect(0, y, s, 1);
        const off = rand() * s; g.fillRect(off, y, 1, 32);
        for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(0,0,0,${(.05 + rand() * .08).toFixed(2)})`; g.fillRect(0, y + rand() * 32, s, 1); }
      }
      noiseOver(g, s, 1200, .12);
    }, 256, 3, 3);
    const wallTex = tex((g, s) => { g.fillStyle = '#d9d3c5'; g.fillRect(0, 0, s, s); noiseOver(g, s, 1500, .08); }, 256, 2, 1);
    const grayTex = tex((g, s) => { g.fillStyle = '#7a7a7e'; g.fillRect(0, 0, s, s); noiseOver(g, s, 2600, .16); }, 256, 1, 1);
    const cardboardTex = tex((g, s) => { g.fillStyle = '#b48c5c'; g.fillRect(0, 0, s, s); noiseOver(g, s, 600, .1); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, s / 2 - 3, s, 6); }, 128);

    const M = {
      floor: new THREE.MeshStandardMaterial({ map: woodTex, roughness: .8 }),
      wall: new THREE.MeshStandardMaterial({ map: wallTex, roughness: .95 }),
      ceiling: new THREE.MeshStandardMaterial({ color: 0xe6e2d8, roughness: 1 }),
      gray: new THREE.MeshStandardMaterial({ map: grayTex, roughness: 1 }),
      grayFloor: new THREE.MeshStandardMaterial({ color: 0x5c5c60, roughness: 1 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x1b1b1e, roughness: .9 }),
      black: new THREE.MeshBasicMaterial({ color: 0x020203 }),
      night: new THREE.MeshBasicMaterial({ color: 0x06080f }),
      fabric: new THREE.MeshStandardMaterial({ color: 0x3b4a3c, roughness: 1 }),
      wood: new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: .7 }),
      linen: new THREE.MeshStandardMaterial({ color: 0xd8d2c6, roughness: 1 }),
      cardboard: new THREE.MeshStandardMaterial({ map: cardboardTex, roughness: 1 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x8a8d92, roughness: .35, metalness: .7 }),
      paper: new THREE.MeshStandardMaterial({ color: 0xf1eee6, roughness: 1, side: THREE.DoubleSide, emissive: 0x2a2a28 }),
      tape: new THREE.MeshStandardMaterial({ color: 0x151517, roughness: .5 }),
      label: new THREE.MeshStandardMaterial({ color: 0xece8dc, roughness: 1, emissive: 0x262624 }),
      yellow: new THREE.MeshStandardMaterial({ color: 0xd9b23a, roughness: .6, emissive: 0x2a2208 }),
      orange: new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff5a00, emissiveIntensity: .6, roughness: 1, side: THREE.DoubleSide }),
      leather: new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: .8 }),
      led: new THREE.MeshBasicMaterial({ color: 0xff2020 }),
      bulb: new THREE.MeshBasicMaterial({ color: 0xffe2b0 })
    };

    /* ---------- the house ---------- */

    const H = 2.5, TH = 0.16;
    const colliders = []; // { x0, x1, z0, z1, mesh? }
    const houseWalls = [];
    const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); scene.add(m); return m; };
    const solid = (m, w, d) => { const c = { x0: m.position.x - w / 2, x1: m.position.x + w / 2, z0: m.position.z - d / 2, z1: m.position.z + d / 2, mesh: m }; colliders.push(c); return c; };

    function wallPiece(cx, cz, len, alongX, mat = M.wall, tag) {
      const w = alongX ? len : TH, d = alongX ? TH : len;
      const g = new THREE.BoxGeometry(w, H, d); g.translate(0, H / 2, 0); // pivot at the base, so a wall can lean later
      const m = new THREE.Mesh(g, mat); m.position.set(cx, 0, cz); scene.add(m);
      const c = solid(m, w, d); c.tag = tag;
      houseWalls.push({ mesh: m, col: c, tag, len, alongX });
      return m;
    }
    function lintel(cx, cz, len, alongX) {
      const w = alongX ? len : TH, d = alongX ? TH : len;
      box(w, H - 2.05, d, M.wall, cx, 2.05 + (H - 2.05) / 2, cz);
    }
    // a straight wall from (x1,z1) to (x2,z2) with door gaps given as [from, to] in metres from the start
    function wall(x1, z1, x2, z2, gaps = [], tag) {
      const alongX = z1 === z2, len = alongX ? x2 - x1 : z2 - z1;
      const pieces = []; let t = 0;
      for (const [a, b] of [...gaps].sort((p, q) => p[0] - q[0])) { if (a > t) pieces.push([t, a]); lintel(alongX ? x1 + (a + b) / 2 : x1, alongX ? z1 : z1 + (a + b) / 2, b - a, alongX); t = b; }
      if (t < len) pieces.push([t, len]);
      for (const [a, b] of pieces) wallPiece(alongX ? x1 + (a + b) / 2 : x1, alongX ? z1 : z1 + (a + b) / 2, b - a + TH, alongX, M.wall, tag);
    }
    // a wall segment that can vanish: the door that was not there
    function plug(x1, z1, x2, z2) {
      const alongX = z1 === z2, len = alongX ? x2 - x1 : z2 - z1;
      const m = wallPiece(alongX ? (x1 + x2) / 2 : x1, alongX ? z1 : (z1 + z2) / 2, len + TH, alongX, M.wall, 'plug');
      return { mesh: m, col: colliders[colliders.length - 1], open() { scene.remove(m); colliders.splice(colliders.indexOf(this.col), 1); lintel(alongX ? (x1 + x2) / 2 : x1, alongX ? z1 : (z1 + z2) / 2, len, alongX); } };
    }

    // exterior
    wall(0, 0, 14, 0, [], 'north');
    wall(0, 13, 14, 13, [[2, 3]], 'south');
    wall(0, 0, 0, 13, [], 'west');
    wall(14, 0, 14, 13, [[8, 9]], 'east');
    const hallwayPlug = plug(14, 8, 14, 9);
    // interior
    wall(0, 4, 14, 4, [[2.5, 3.5], [10, 11]], 'bedrooms');
    wall(6.5, 0, 6.5, 4, [[1.5, 2.5]], 'closet-w');
    const closetPlug = plug(6.5, 1.5, 6.5, 2.5);
    wall(7.5, 0, 7.5, 4, [], 'closet-e');
    wall(0, 5.3, 14, 5.3, [[4, 5], [9, 10]], 'hall');
    wall(6, 5.3, 6, 13, [[1.2, 3.2], [5.7, 6.7]], 'kitchen-living');
    wall(0, 10.5, 6, 10.5, [[2, 3]], 'foyer');

    // floors and ceilings
    const houseFloor = new THREE.Mesh(new THREE.PlaneGeometry(14, 13), M.floor);
    houseFloor.rotation.x = -Math.PI / 2; houseFloor.position.set(7, 0, 6.5); scene.add(houseFloor);
    const houseCeiling = new THREE.Mesh(new THREE.PlaneGeometry(14, 13), M.ceiling);
    houseCeiling.rotation.x = Math.PI / 2; houseCeiling.position.set(7, H, 6.5); scene.add(houseCeiling);
    const closetFloor = box(1, .02, 4, M.grayFloor, 7, 0.011, 2); // the closet was never wood

    // windows: night outside
    for (const [x, y, z, w, h, ry] of [[3, 1.5, .09, 1.4, 1.2, 0], [11, 1.5, .09, 1.4, 1.2, 0], [13.91, 1.5, 11, 1.6, 1.2, -Math.PI / 2], [.09, 1.5, 7.5, 1.4, 1.2, Math.PI / 2], [2.5, 1.5, 12.91, 1.2, 1.1, Math.PI]]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.night); p.position.set(x, y, z); p.rotation.y = ry; scene.add(p);
      const f = new THREE.Mesh(new THREE.BoxGeometry(w + .12, h + .12, .03), M.wood); f.position.set(x, y, z); f.rotation.y = ry; scene.add(f);
    }

    // furniture
    solid(box(2.2, .8, .9, M.fabric, 10.5, .4, 6.2), 2.2, .9);      // couch, back to the hall
    solid(box(1.1, .42, .6, M.wood, 10.5, .21, 7.9), 1.1, .6);       // coffee table
    solid(box(.6, .6, .6, M.cardboard, 7.4, .3, 12.2), .6, .6); box(.55, .55, .55, M.cardboard, 7.4, .875, 12.2); box(.6, .6, .6, M.cardboard, 8.2, .3, 12.4); // moving boxes
    solid(box(.6, .9, 4, M.linen, .6, .45, 7.4), .6, 4);           // kitchen counter
    solid(box(3.6, .9, .6, M.linen, 2.4, .45, 5.6), 3.6, .6);
    solid(box(1.4, .75, .9, M.wood, 3.6, .375, 8.6), 1.4, .9);      // kitchen table
    solid(box(.45, .9, .45, M.wood, 2.7, .45, 8.6), .45, .45); solid(box(.45, .9, .45, M.wood, 4.5, .45, 8.6), .45, .45);
    solid(box(1.6, .5, 2, M.linen, 2.4, .3, 1.5), 1.6, 2); box(1.6, .9, .1, M.wood, 2.4, .45, .55); // bed
    solid(box(.5, .55, .5, M.wood, 1.3, .275, .5), .5, .5);         // nightstand
    solid(box(.95, .45, 2, M.linen, 12, .3, 1.5), .95, 2); box(.95, .3, 2, M.linen, 12, 1.5, 1.5); box(.05, 1.7, 2, M.wood, 12.5, .85, 1.5); // bunk
    solid(box(.7, .45, .5, M.cardboard, 9, .225, 1), .7, .5);       // toy box
    solid(box(.9, .75, .4, M.wood, 4.5, .375, 12.6), .9, .4);       // foyer table

    // tripod camera in the living room
    for (const [dx, dz] of [[-.25, .2], [.25, .2], [0, -.3]]) { const leg = box(.03, 1.4, .03, M.metal, 12.4 + dx, .7, 11.4 + dz); leg.rotation.set(dz * .5, 0, -dx * .5); }
    box(.28, .14, .14, M.dark, 12.4, 1.5, 11.4); box(.02, .02, .02, M.led, 12.28, 1.55, 11.4);

    // the cameras Navidson mounted in the rooms
    const leds = [];
    for (const [x, z, ry] of [[.3, 12.7, Math.PI / 4], [13.7, 5.6, -3 * Math.PI / 4], [.3, .3, -Math.PI / 4], [13.7, .3, Math.PI * 5 / 4]]) {
      const cam = box(.16, .1, .22, M.dark, x, 2.25, z); cam.rotation.y = ry;
      const led = box(.02, .02, .02, M.led, x, 2.3, z); leds.push(led);
    }

    // lamps
    const lamps = [];
    for (const [x, z, i] of [[10, 9, 5], [3, 7.5, 4], [7, 4.65, 3], [3, 2, 3], [11, 2, 3], [3, 11.8, 3]]) {
      const l = new THREE.PointLight(0xffc98a, i, 9, 2); l.position.set(x, H - .25, z); scene.add(l);
      const b = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), M.bulb); b.position.copy(l.position); scene.add(b);
      lamps.push({ light: l, bulb: b, base: i, flicker: hash(x * 3 + z) < .35 });
    }
    scene.add(new THREE.AmbientLight(0x303040, .25));

    // the flashlight you carry
    const torch = new THREE.SpotLight(0xffeacc, 42, 40, .62, .75, 1.6);
    torch.position.set(.12, -.1, 0);
    camera.add(torch); camera.add(torch.target); torch.target.position.set(.05, -.3, -1);
    const halo = new THREE.PointLight(0xffe6c8, 1.8, 7, 2); // what the beam scatters back around you
    halo.position.set(0, -.3, -.2); camera.add(halo);
    scene.add(camera);

    /* ---------- the hallway that should not be there ---------- */

    const G = { x0: 14, z0: -30, W: 270, D: 160, T: .5, tiles: null, hallStart: 144, hallJ0: 10, hallJ1: 150, stair: { i: 204, j: 80 }, mesh: null, floor: null, ceiling: null, built: false, short: false };
    G.stair.x = G.x0 + (G.stair.i + .5) * G.T; G.stair.z = G.z0 + (G.stair.j + .5) * G.T;
    const tileAt = (i, j) => (i < 0 || j < 0 || i >= G.W || j >= G.D) ? 1 : G.tiles[i + j * G.W];
    function genMaze(short) {
      const { W, D } = G; const t = G.tiles = new Uint8Array(W * D).fill(1);
      const carve = (i0, i1, j0, j1) => { for (let j = Math.max(0, j0); j <= Math.min(D - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(W - 1, i1); i++) t[i + j * W] = 0; };
      const L = short ? 16 : 140;
      G.hallStart = L + 4;
      carve(0, G.hallStart + 2, 76, 78);
      if (!short) {
        const rand = rng(1331 + visits);
        for (let i = 12; i < L - 12;) {
          const side = rand() < .5 ? -1 : 1, w = 6 + Math.floor(rand() * 18), d = 6 + Math.floor(rand() * 22);
          if (side < 0) { carve(i, i + 1, 75, 75); carve(i - (w >> 1), i + (w >> 1), 75 - d, 74); if (rand() < .5) { carve(i, i + 1, 74 - d, 74 - d); carve(i - 4, i + 6, 74 - d - 8 - Math.floor(rand() * 10), 75 - d - 1); } }
          else { carve(i, i + 1, 79, 79); carve(i - (w >> 1), i + (w >> 1), 80, 80 + d); if (rand() < .5) { carve(i, i + 1, 81 + d, 81 + d); carve(i - 4, i + 6, 82 + d, 82 + d + 8 + Math.floor(rand() * 10)); } }
          i += 12 + Math.floor(rand() * 14);
        }
      }
      carve(G.hallStart, W - 3, G.hallJ0, G.hallJ1);
      for (let j = G.stair.j - 6; j <= G.stair.j + 6; j++) for (let i = G.stair.i - 6; i <= G.stair.i + 6; i++) if ((i - G.stair.i) ** 2 + (j - G.stair.j) ** 2 <= 30) t[i + j * W] = 2;
    }
    function buildMaze(short) {
      if (G.mesh) { scene.remove(G.mesh, G.floor, G.ceiling); G.mesh.geometry.dispose(); }
      G.dust = G.dust || null;
      genMaze(short);
      G.short = short;
      const { W, D, T, x0, z0 } = G;
      const cells = [];
      for (let j = 0; j < D; j++) for (let i = 0; i < W; i++) {
        if (G.tiles[i + j * W] !== 1) continue;
        if (tileAt(i - 1, j) !== 1 || tileAt(i + 1, j) !== 1 || tileAt(i, j - 1) !== 1 || tileAt(i, j + 1) !== 1) cells.push(i, j);
      }
      const geo = new THREE.BoxGeometry(T, 2.6, T);
      const mesh = new THREE.InstancedMesh(geo, M.gray, cells.length / 2);
      const mat = new THREE.Matrix4();
      for (let k = 0; k < cells.length; k += 2) { mat.makeTranslation(x0 + (cells[k] + .5) * T, 1.3, z0 + (cells[k + 1] + .5) * T); mesh.setMatrixAt(k / 2, mat); }
      mesh.instanceMatrix.needsUpdate = true;
      scene.add(mesh); G.mesh = mesh;
      const fw = W * T, fd = D * T;
      G.floor = new THREE.Mesh(new THREE.PlaneGeometry(fw, fd), M.grayFloor);
      G.floor.rotation.x = -Math.PI / 2; G.floor.position.set(x0 + fw / 2, 0, z0 + fd / 2); scene.add(G.floor);
      const cw = G.hallStart * T;
      G.ceiling = new THREE.Mesh(new THREE.PlaneGeometry(cw, fd), M.gray);
      G.ceiling.rotation.x = Math.PI / 2; G.ceiling.position.set(x0 + cw / 2, 2.6, z0 + fd / 2); scene.add(G.ceiling);
      if (G.dust) { scene.remove(G.dust); G.dust.geometry.dispose(); }
      const n = 3000, pos = new Float32Array(n * 3), rand = rng(77);
      for (let k = 0; k < n; k++) { pos[k * 3] = x0 + (G.hallStart + 2 + rand() * (W - G.hallStart - 6)) * T; pos[k * 3 + 1] = .2 + rand() * 9; pos[k * 3 + 2] = z0 + (G.hallJ0 + 2 + rand() * (G.hallJ1 - G.hallJ0 - 4)) * T; }
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      G.dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xb8b6b0, size: .045, transparent: true, opacity: .55 }));
      scene.add(G.dust);
      G.built = true;
    }
    // the well of the staircase in the Great Hall
    const well = new THREE.Mesh(new THREE.CircleGeometry(3.1, 40), M.black);
    well.rotation.x = -Math.PI / 2; well.position.set(G.stair.x, .012, G.stair.z); well.visible = false; scene.add(well);
    const lip = new THREE.Mesh(new THREE.RingGeometry(3.1, 3.3, 40), M.dark);
    lip.rotation.x = -Math.PI / 2; lip.position.set(G.stair.x, .014, G.stair.z); lip.visible = false; scene.add(lip);

    /* the staircase itself: steps on a helix, kept in a window around you */
    const STEP_A = Math.PI * 2 / 16, RISE = .19, R_WALK = 1.45, N_STEPS = 140;
    const stepGeo = new THREE.BoxGeometry(1.95, .17, .84); stepGeo.translate(1.35, -.085, 0);
    const steps = new THREE.InstancedMesh(stepGeo, M.gray, N_STEPS);
    steps.visible = false; scene.add(steps);
    const column = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 400, 18), M.gray);
    column.position.set(G.stair.x, 0, G.stair.z); column.visible = false; scene.add(column);
    const stair = { active: false, s: 0, theta0: 0, beat: 0, deepest: 0, shown: false };
    stair.depth = () => stair.s * RISE / (STEP_A * R_WALK);
    function placeSteps() {
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0);
      const k0 = Math.floor(stair.depth() / RISE) - 30;
      for (let k = 0; k < N_STEPS; k++) {
        const kk = k0 + k, a = stair.theta0 + kk * STEP_A, y = -kk * RISE;
        if (kk < 0) { m.makeScale(0, 0, 0); steps.setMatrixAt(k, m); continue; }
        q.setFromAxisAngle(up, -a); p.set(G.stair.x, y, G.stair.z);
        m.compose(p, q, sc); steps.setMatrixAt(k, m);
      }
      steps.instanceMatrix.needsUpdate = true;
      column.position.y = -stair.depth();
    }

    /* ---------- things to find ---------- */

    const pickups = [];
    function pickup(id, x, y, z, build, data) {
      const g = new THREE.Group(); g.position.set(x, y, z); build(g);
      g.userData = { id, ...data }; scene.add(g); pickups.push(g); return g;
    }
    const add = (g, m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); g.add(m); return m; };
    const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
    const tapeBuild = g => { add(g, mesh(new THREE.BoxGeometry(.095, .017, .063), M.tape), 0, .009, 0); add(g, mesh(new THREE.BoxGeometry(.07, .001, .03), M.label), 0, .018, 0); g.rotation.y = .4; };
    const pageBuild = g => { const p = add(g, mesh(new THREE.PlaneGeometry(.21, .3), M.paper), 0, .004, 0); p.rotation.x = -Math.PI / 2; p.rotation.z = .3; };

    pickup('trunk', 4.6, 0, 11.2, g => { add(g, mesh(new THREE.BoxGeometry(1, .55, .6), M.leather), 0, .275, 0); add(g, mesh(new THREE.BoxGeometry(1.02, .06, .62), M.wood), 0, .56, 0); solid(g.children[0], 1, .6); g.children[0].position.set(4.6, .275, 11.2); g.children[0].updateMatrixWorld(); g.children[0].position.set(0, .275, 0); },
      { label: 'A trunk. Not theirs.', chapter: 'introduction', keep: true, reach: 1.6 });
    colliders.push({ x0: 4.1, x1: 5.1, z0: 10.9, z1: 11.5 });
    pickup('tape1', 7.4, 1.16, 12.2, tapeBuild, { label: 'A Hi8 tape. In marker: ASH TREE LANE, 1.', chapter: 'ch1' });
    pickup('tape_measure', 1.1, .93, 8.6, g => { add(g, mesh(new THREE.BoxGeometry(.075, .07, .035), M.yellow), 0, .035, 0); add(g, mesh(new THREE.BoxGeometry(.4, .002, .016), M.label), .25, .01, 0); }, { label: 'A tape measure, left open on the counter.', chapter: 'ch2' });
    pickup('tape2', 7, .02, 2.6, tapeBuild, { label: 'A Hi8 tape. In marker: 5½.', chapter: 'ch3' });
    pickup('front_door', 2.5, 1, 12.92, g => { const d = add(g, mesh(new THREE.BoxGeometry(1, 2.05, .06), M.wood), 0, 0, 0); add(g, mesh(new THREE.SphereGeometry(.03, 8, 6), M.metal), .38, 0, .05); }, { label: 'The front door.', door: 'front', reach: 1.8 });
    colliders.push({ x0: 2, x1: 3, z0: 12.85, z1: 13.05 });

    // in the hallway, placed once it exists
    let mazePickups = [];
    function placeMazePickups() {
      for (const p of mazePickups) { scene.remove(p); pickups.splice(pickups.indexOf(p), 1); }
      mazePickups = [];
      if (G.short) return;
      const gx = i => G.x0 + (i + .5) * G.T, gz = j => G.z0 + (j + .5) * G.T;
      // the page about echoes lies in the first room off the corridor
      let firstDoor = null;
      for (let i = 10; i < 60 && !firstDoor; i++) { if (tileAt(i, 75) === 0) firstDoor = [i, -1]; else if (tileAt(i, 79) === 0) firstDoor = [i, 1]; }
      const pd = firstDoor || [20, -1];
      const pj = pd[1] < 0 ? 70 : 84;
      mazePickups.push(pickup('page_echo', gx(pd[0]), .01, gz(pj), pageBuild, { label: 'A page in Zampanò’s hand. It is about echoes.', chapter: 'ch4' }));
      mazePickups.push(pickup('cache', gx(96), 0, gz(76.3), g => {
        add(g, mesh(new THREE.BoxGeometry(.5, .35, .4), M.cardboard), 0, .175, 0).rotation.z = .5;
        for (let k = 0; k < 4; k++) add(g, mesh(new THREE.CylinderGeometry(.04, .04, .22, 8), M.metal), -.4 + k * .22, .11, .35 + hash(k) * .3).rotation.z = 1.4;
        add(g, mesh(new THREE.CylinderGeometry(.09, .09, .05, 12), M.label), .5, .025, -.2);
      }, { label: 'A cache of supplies, torn open. Water, batteries, nothing eaten.', chapter: 'ch5' }));
      mazePickups.push(pickup('spool', G.x0 + .35, .02, 9.3, g => { add(g, mesh(new THREE.CylinderGeometry(.06, .06, .05, 12), M.label), 0, .025, 0); const line = add(g, mesh(new THREE.BoxGeometry(60, .004, .004), M.label), 30, .03, 0); }, { label: 'A spool of fishing line, tied off at the door frame.', say: 'As long as the line holds, the way back is simple.', keep: true, reach: 1.4 }));
    }
    let stairPickups = { markers: null, camera: null };
    function placeStairPickups() {
      const at = depth => { const k = depth / RISE, a = stair.theta0 + k * STEP_A; return [G.stair.x + Math.cos(-a) * 1.5, -depth + .01, G.stair.z + Math.sin(-a) * 1.5]; };
      if (!stairPickups.markers) {
        const [x, y, z] = at(8);
        stairPickups.markers = pickup('markers', x, y, z, g => { for (let k = 0; k < 5; k++) { const s = add(g, mesh(new THREE.PlaneGeometry(.05, .3), M.orange), (hash(k) - .5) * .6, .005, (hash(k + 9) - .5) * .6); s.rotation.x = -Math.PI / 2; s.rotation.z = hash(k + 3) * 3; } }, { label: 'Neon markers. Shredded.', chapter: 'ch6', stairDepth: 8 });
      }
      if (!stairPickups.camera) {
        const [x, y, z] = at(30);
        stairPickups.camera = pickup('holloway_cam', x, y, z, g => { add(g, mesh(new THREE.BoxGeometry(.24, .12, .12), M.dark), 0, .06, 0).rotation.y = .7; add(g, mesh(new THREE.CylinderGeometry(.035, .04, .07, 12), M.metal), .13, .07, .06).rotation.z = Math.PI / 2; }, { label: 'A Hi8 camera. Its battery is dead. The tape inside is not.', chapter: 'ch7', stairDepth: 30 });
      }
    }
    let tornPickups = false;
    function placeTornPickups() {
      if (tornPickups) return; tornPickups = true;
      pickup('radio', 12.6, .02, 8.4, g => { add(g, mesh(new THREE.BoxGeometry(.2, .08, .06), M.dark), 0, .04, 0); add(g, mesh(new THREE.CylinderGeometry(.004, .004, .3, 6), M.metal), .08, .2, 0); add(g, mesh(new THREE.BoxGeometry(.01, .01, .01), M.led), -.06, .085, .031); }, { label: 'Tom’s radio. It is still on.', chapter: 'ch8' });
      pickup('karen_tapes', 1.3, .56, .5, g => { for (let k = 0; k < 3; k++) add(g, mesh(new THREE.BoxGeometry(.19, .025, .1), M.tape), 0, .0125 + k * .027, 0).rotation.y = (k - 1) * .15; add(g, mesh(new THREE.BoxGeometry(.12, .001, .05), M.label), 0, .082, 0); }, { label: 'VHS tapes, labelled in Karen’s hand: WHAT SOME HAVE THOUGHT.', chapter: 'ch9' });
    }

    /* ---------- the player ---------- */

    const P = { x: 3, z: 12.1, yaw: 0, pitch: 0, vx: 0, vz: 0, r: .3, bob: 0, walked: 0, stepAcc: 0, inMaze: false, region: 'house', lineOut: 0, deepest: 0 };
    const keys = new Set();
    const KEYMAP = { KeyW: 'f', KeyZ: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', KeyQ: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', ShiftLeft: 'run', ShiftRight: 'run' };
    addEventListener('keydown', e => {
      if (!game.started || game.ended) return;
      if (!journal.hidden || !$('#dark').hidden) return;
      if (KEYMAP[e.code]) { keys.add(KEYMAP[e.code]); e.preventDefault(); }
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
      for (const t of e.changedTouches) fingers.set(t.identifier, { x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY, move: t.clientX < innerWidth * .45 });
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
    const endTouch = e => { for (const t of e.changedTouches) { const f = fingers.get(t.identifier); if (f?.move) stick = { dx: 0, dz: 0 }; fingers.delete(t.identifier); } };
    canvas.addEventListener('touchend', endTouch); canvas.addEventListener('touchcancel', endTouch);
    hud.prompt.addEventListener('click', () => { if (target) interact(target); });

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
          for (let jj = j - 1; jj <= j + 1; jj++) for (let ii = i - 1; ii <= i + 1; ii++) if (tileAt(ii, jj) === 1) push(G.x0 + ii * G.T, G.x0 + (ii + 1) * G.T, G.z0 + jj * G.T, G.z0 + (jj + 1) * G.T);
        }
      }
    }

    /* ---------- story wiring ---------- */

    const S = { closet: false, hallway: false, torn: false, fleeing: false, explore5: false, arrived: false };
    function openCloset(silent) {
      if (S.closet) return; S.closet = true;
      closetPlug.open();
      if (!silent) { Sound.creak(); setTimeout(() => say('Somewhere in the house, a door that was not there.'), 900); }
    }
    function openHallway(silent) {
      if (S.hallway) return; S.hallway = true;
      hallwayPlug.open();
      buildMaze(false); placeMazePickups();
      well.visible = lip.visible = steps.visible = column.visible = true;
      placeSteps();
      if (!silent) { Sound.growl(.35); setTimeout(() => say('The living room has a new door. Behind it, the yard should be.'), 1200); }
    }
    function tearHouse(silent) {
      if (S.torn) return; S.torn = true;
      if (G.built) { buildMaze(true); placeMazePickups(); }
      const rand = rng(41);
      for (const w of houseWalls) {
        if (w.tag === 'plug') continue;
        const roll = rand();
        if (['hall', 'kitchen-living'].includes(w.tag) && roll < .5) { scene.remove(w.mesh); const k = colliders.indexOf(w.col); if (k >= 0) colliders.splice(k, 1); }
        else if (roll < .75) { w.mesh.rotation.z = (rand() - .5) * .16; w.mesh.rotation.x = (rand() - .5) * .1; }
      }
      houseCeiling.material = M.gray; houseCeiling.position.y = H + .6; houseCeiling.rotation.z = .04;
      for (const l of lamps) { l.light.intensity = 0; l.bulb.visible = false; }
      lamps[0].flicker = true; lamps[0].light.intensity = 2; lamps[0].bulb.visible = true;
      const pit = box(3.2, .3, 2.6, M.black, 9.6, -.16, 10.2); solid(pit, 3.2, 2.6);
      placeTornPickups();
      if (!silent) setTimeout(() => say('The house has moved.'), 800);
    }
    AFTER_READ = {
      ch2: () => openCloset(),
      ch3: () => openHallway(),
      ch7: () => { S.fleeing = true; Sound.growl(1); shake = 1.4; setTimeout(() => say('Go back up. Now.', 6000), 1500); },
      ch8: () => say('Karen left with the children. Something of hers is still upstairs, in the bedroom.', 7000),
      ch9: () => { S.explore5 = true; say('The doorway is still there. Navidson went back in alone.', 7000); },
      ch11: () => { unlock('letters', false); }
    };
    // resume a house left half-explored
    if (found.has('ch2')) openCloset(true);
    if (found.has('ch3')) openHallway(true);
    if (found.has('ch7')) tearHouse(true);
    if (found.has('ch9')) S.explore5 = true;
    for (const p of [...pickups]) if (p.userData.chapter && found.has(p.userData.chapter) && !p.userData.keep) { scene.remove(p); pickups.splice(pickups.indexOf(p), 1); }
    if (found.has('ch11')) { game.ended = true; }

    let target = null;
    function findTarget() {
      const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
      let best = null, bd = 9;
      const py = stair.active ? 1.6 - stair.depth() : 1.6;
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
        say(found.has('ch1') ? 'The door does not open. You came in; the house decides when you go.' : 'It closed behind you. It does not open from this side.');
        return;
      }
      if (u.say) say(u.say);
      if (u.chapter) {
        Sound.click();
        if (!u.keep) { scene.remove(p); pickups.splice(pickups.indexOf(p), 1); target = null; hud.prompt.hidden = true; }
        if (u.id === 'trunk' && found.has('ch11')) { unlock('letters'); return; }
        unlock(u.chapter);
        syncJournalButton();
      }
    }

    /* Exploration #5: the dark with no dimensions */
    function startExploration5() {
      if (Match.running) return;
      game.pause();
      Match.start(() => {
        unlock('ch10', false); unlock('ch11', false); syncJournalButton();
        game.ended = true;
        finish();
      }, () => { P.x = 12.8; P.z = 8.5; P.yaw = Math.PI / 2; game.resume(); });
    }
    function finish() {
      game.ended = true;
      if (document.pointerLockElement) document.exitPointerLock();
      hud.veil.hidden = true; hud.prompt.hidden = true; hud.meter.textContent = '';
      Sound.ambience(false);
      card(`<p class="card-kicker">Vermont</p><p>You burned every page. Someone came into the dark with a light that was not yours, and you came out together.</p><p>What you carried out is in the journal. The letters at the back are for whoever is still reading.</p><div class="card-actions"><button type="button" data-journal>Open the journal</button><button type="button" data-again>Walk the house again</button></div>`);
      $('[data-again]', hud.card)?.addEventListener('click', () => location.reload());
    }
    if (game.ended) setTimeout(finish, 600);

    /* ---------- frame ---------- */

    let last = performance.now(), t = 0, shake = 0, fogTarget = .05, sayBeat = 0, fps = 60;
    function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    addEventListener('resize', resize); resize();

    function region() {
      if (P.x < G.x0 - .1) return 'house';
      if (stair.active) return 'stair';
      return P.x > G.x0 + G.hallStart * G.T - 1 ? 'hall' : 'maze';
    }

    function frame(now) {
      requestAnimationFrame(frame);
      const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
      fps += (1 / Math.max(dt, 1e-3) - fps) * .05;
      if (game.paused || game.ended) { render(dt); return; }

      // input
      let mx = 0, mz = 0;
      if (keys.has('f')) mz -= 1; if (keys.has('b')) mz += 1; if (keys.has('l')) mx -= 1; if (keys.has('r')) mx += 1;
      mx += stick.dx; mz += stick.dz;
      const mag = Math.hypot(mx, mz); if (mag > 1) { mx /= mag; mz /= mag; }
      const speed = (keys.has('run') ? 3.4 : 2.1) * (stair.active ? 1.3 : 1);

      if (stair.active) {
        // on the rail: forward goes down, back goes up
        const dir = -mz;
        stair.s = Math.max(0, stair.s + dir * speed * dt);
        const depth = stair.depth();
        const th = stair.theta0 + (depth / RISE) * STEP_A;
        const prevYaw = stair.lastTh ?? th;
        P.yaw -= (th - prevYaw); stair.lastTh = th;
        P.x = G.stair.x + Math.cos(-th) * R_WALK; P.z = G.stair.z + Math.sin(-th) * R_WALK;
        if (dir !== 0) P.walked += speed * dt;
        stair.deepest = Math.max(stair.deepest, depth);
        while (stair.beat < STAIR_BEATS.length && depth >= STAIR_BEATS[stair.beat][0]) { const [, text, fx] = STAIR_BEATS[stair.beat++]; say(text); if (fx === 'growl') { Sound.growl(); shake = 1; } }
        if (depth > 20 && Math.random() < dt / 40) { Sound.growl(.6); shake = .6; }
        hud.meter.textContent = `Down: ${fmt(depth * FT)} ft. Steps: ${fmt(depth / RISE)}.`;
        if (stair.s === 0 && dir < 0) { // back out into the Hall
          stair.active = false; stair.lastTh = null;
          P.x = G.stair.x + Math.cos(-stair.theta0) * 3.9; P.z = G.stair.z + Math.sin(-stair.theta0) * 3.9;
          if (S.fleeing && !S.torn) { tearHouse(); say('The corridor is shorter than it was.'); }
        }
        placeSteps();
      } else {
        const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
        const tx = (fx * -mz + rx * mx) * speed, tz = (fz * -mz + rz * mx) * speed;
        const k = 1 - Math.exp(-dt * 12);
        P.vx += (tx - P.vx) * k; P.vz += (tz - P.vz) * k;
        P.x += P.vx * dt; P.z += P.vz * dt;
        collide();
        const moved = Math.hypot(P.vx, P.vz) * dt;
        P.walked += moved;
        // the Great Hall: step over the edge and you are on the stairs
        if (G.built && P.x > G.x0 + G.hallStart * G.T && Math.hypot(P.x - G.stair.x, P.z - G.stair.z) < 2.6) {
          stair.active = true; stair.s = 0; stair.beat = 0; stair.lastTh = null;
          stair.theta0 = -Math.atan2(P.z - G.stair.z, P.x - G.stair.x);
          P.yaw = -stair.theta0 - Math.PI / 2 + Math.PI; // look along the descent
          placeStairPickups(); placeSteps();
          if (!stair.shown) { stair.shown = true; say('A staircase. Going down.'); }
        }
        // the door back, once you have seen the bottom of what you can see
        if (S.explore5 && P.x > G.x0 + .5 && P.x < G.x0 + 3 && P.z > 7.4 && P.z < 9.8) startExploration5();
      }

      // footsteps
      const reg = region();
      P.region = reg;
      if (P.walked - P.stepAcc > .62) { P.stepAcc = P.walked; Sound.step(reg !== 'house', reg === 'maze' || reg === 'hall'); }

      // hallway beats by line paid out
      if (reg === 'maze' || reg === 'hall') {
        P.lineOut = Math.max(P.lineOut, P.x - G.x0);
        const out = (P.x - G.x0) * FT;
        hud.meter.textContent = reg === 'hall' ? 'The Great Hall.' : `Line paid out: ${fmt(out)} ft`;
        while (sayBeat < HALL_BEATS.length && !G.short && (P.x - G.x0) >= HALL_BEATS[sayBeat][0]) { const [, text, fx] = HALL_BEATS[sayBeat++]; say(text); if (fx === 'growl') { Sound.growl(); shake = 1; } }
        if (S.torn && (P.x - G.x0) > 2 && Math.random() < dt / 30) { Sound.growl(.5); shake = .5; }
      } else if (reg === 'house') {
        hud.meter.textContent = S.torn ? 'The house is not the size it was.' : '';
        if (S.torn && Math.random() < dt / 25) { Sound.growl(.4); shake = .4; }
      }
      Sound.ambience(reg !== 'house' || S.torn, reg === 'house' ? .08 : reg === 'stair' ? .22 : .16);
      fogTarget = reg === 'house' ? (S.torn ? .1 : .05) : reg === 'maze' ? .1 : reg === 'hall' ? .06 : .08;
      findTarget();
      render(dt);
    }

    let bobPhase = 0;
    function render(dt) {
      scene.fog.density += (fogTarget - scene.fog.density) * (1 - Math.exp(-dt * 2));
      const reg = P.region;
      scene.fog.color.setHex(reg === 'house' && !S.torn ? 0x0a0808 : 0x050506);
      const moving = Math.hypot(P.vx, P.vz) > .3 || (stair.active && (keys.size || stick.dz));
      bobPhase += dt * (moving ? 9 : 0);
      const bob = reduced ? 0 : Math.sin(bobPhase) * .028 * (moving ? 1 : 0);
      const y = (stair.active ? 1.6 - stair.depth() : 1.6) + bob;
      camera.position.set(P.x, y, P.z);
      camera.rotation.y = P.yaw; camera.rotation.x = P.pitch;
      if (shake > 0) { camera.position.x += (Math.random() - .5) * .02 * shake; camera.position.y += (Math.random() - .5) * .02 * shake; shake = Math.max(0, shake - dt * .6); }
      const bright = reg === 'house' && !S.torn ? .75 : 1;
      if (!reduced) torch.intensity = 42 * bright * (1 + Math.sin(t * 13) * .02 + (Math.random() - .5) * .03);
      halo.intensity = 1.8 * (reg === 'house' ? .45 : 1);
      for (const l of lamps) if (l.flicker && l.light.intensity > 0) { const f = Math.random() < .04 ? .2 : 1; l.light.intensity = l.base * f * (S.torn ? .4 : 1); l.bulb.visible = f > .5; }
      for (const led of leds) led.visible = Math.floor(t * 2) % 2 === 0;
      for (const p of pickups) { const m = p.children[0]; if (m && !p.userData.door) { const near = Math.hypot(p.position.x - P.x, p.position.z - P.z) < 3.5; if (m.material.emissive) m.material.emissiveIntensity = near && p === target ? 3 : 1; } }
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);

    // arrival
    setTimeout(() => {
      card(`<p class="card-kicker">Ash Tree Lane</p><p>The house is empty. Whatever they left is still inside.</p><p class="card-help">${touch ? 'Drag on the left to walk, on the right to look. Tap what you find.' : 'Click to look around. Walk with the arrow keys, WASD or ZQSD. Press E for what you find, J for the journal.'}</p>`, 9000);
    }, 400);
    if (found.size > 2 && !game.ended) setTimeout(() => say('You have been here before. What you found is still in the journal.', 6000), 10000);

    // for tests and the curious
    window.ATL = { P, S, G, stair, fps: () => Math.round(fps), teleport(x, z, yaw = P.yaw) { P.x = x; P.z = z; P.yaw = yaw; P.vx = P.vz = 0; }, look(yaw, pitch = 0) { P.yaw = yaw; P.pitch = pitch; }, target: () => target?.userData.id, interact: () => target && interact(target), found, unlock, keys };
  }

  /* ================================================================
     Exploration #5, in the DOM: the last pages
     ================================================================ */

  const dark = $('#dark');
  const Match = { running: false };
  Match.start = (onDone, onLeave) => {
    Match.running = true;
    const cv = $('.dark-canvas', dark), words = $('.dark-words', dark), page = $('.dark-page', dark), meter = $('.dark-meter', dark), hint = $('.dark-hint', dark), live = $('#dark-live');
    const btn = { primary: $('[data-act="primary"]', dark), sound: $('[data-act="sound"]', dark), back: $('[data-act="back"]', dark) };
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, raf = 0, tt = 0, last = performance.now(), closing = false;
    const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); w = innerWidth; h = innerHeight; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); m.rect = null; };
    const sayD = text => {
      for (const old of $$('p:not(.dying)', words)) { old.classList.add('dying'); old.classList.remove('in'); setTimeout(() => old.remove(), 2000); }
      const p = document.createElement('p'); p.textContent = text; mark(p); p.style.left = '50%'; p.style.top = '11.5%';
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
        else { page.hidden = true; btn.primary.hidden = true; m.state = 'finale'; m.clock = 0; words.innerHTML = ''; }
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
        removeEventListener('resize', resize);
        done ? onDone() : onLeave();
      }, reduced ? 60 : 1400);
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(.05, (now - last) / 1000); last = now; tt += dt;
      if (m.state === 'reading') { m.light = Math.max(0, m.light - dt * .075); if (m.light < .08 && !m.warned) { m.warned = true; sayD('Burn it, or read in the dark.'); } }
      else if (m.state === 'burning') m.light = Math.max(.6, m.light - dt * .1);
      else if (m.state === 'finale') {
        m.light = Math.max(0, m.light - dt * .5); m.clock += dt;
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
    dark.onkeydown = e => { if (e.key === 'Escape') { e.preventDefault(); end(false); } if (e.key === ' ' && e.target === dark) { e.preventDefault(); burn(); } };
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
