// The Disco Pantry case study (pantry.html).
// The page works without this script: it adds the live models and the animations.
import {
  createPantrySim, findZone, describeZone, guideLevel, GUIDE,
  FLAT, FLAT_LENGTH, WALL_INFO, LEDS, LED_COUNT, shelfY, doorView,
} from './pantry-sim.js';
import { CLIP, profile } from './pantry-clip.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Run fn on each animation frame while el is on the screen. */
function whileVisible(el, fn) {
  let raf = 0, on = false;
  const loop = (now) => { fn(now); raf = on ? requestAnimationFrame(loop) : 0; };
  new IntersectionObserver(([e]) => {
    on = e.isIntersecting;
    if (on && !raf) raf = requestAnimationFrame(loop);
  }).observe(el);
}

/* ---------------- Hero: say an item ---------------- */
function initHero() {
  const stage = $('#demo');
  const wide = matchMedia('(min-width: 900px)');
  const sim = createPantrySim($('.pt-canvas', stage), {
    reduce: REDUCE, onEnd: () => ended(),
    // On a wide screen, the readout panel covers the right side of the model.
    reserve: () => (wide.matches ? $('.pt-readout', stage).offsetWidth + 24 : 0),
  });
  stage.classList.add('live');
  const out = {
    heard: $('.pt-heard', stage), zone: $('.pt-zone', stage), where: $('.pt-where .w', stage),
    sw: $('.pt-where .sw', stage), hint: $('.pt-hint', stage), mode: $('.pt-mode', stage),
  };
  const AUTO = ['goldfish crackers', 'cereal', 'tomato soup', 'paper towels', 'flour', 'peanut butter'];
  let auto = !REDUCE, k = 0, timer = 0, discoTick = 0;

  function say(text, { user = false } = {}) {
    clearTimeout(timer); clearInterval(discoTick);
    if (user) auto = false;
    const hit = findZone(text);
    out.heard.textContent = `“${text}”`;
    stage.classList.toggle('is-disco', !!hit?.disco);
    if (!hit) {
      sim.stop();
      out.mode.textContent = 'No match';
      out.zone.textContent = 'This page knows a short word list only';
      out.where.textContent = 'Try one of the examples';
      out.sw.style.setProperty('--c', 'transparent');
      out.hint.textContent = 'The real tablet asks an AI model, so it always lights a zone.';
      return;
    }
    if (hit.disco) {
      sim.disco();
      out.zone.textContent = 'Dance party';
      out.where.textContent = 'All LEDs · 30 s';
      out.sw.style.setProperty('--c', 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)');
      out.hint.textContent = 'The effect changes each 2 bars.';
      const show = sim.show;
      const tick = () => { if (sim.show === show) out.mode.textContent = `Disco · ${show.look(sim.time()).name}`; };
      tick();
      if (!REDUCE) discoTick = setInterval(tick, 250);
      return;
    }
    const d = describeZone(hit.zone);
    sim.guide(hit.zone);
    out.mode.textContent = 'Guide lights';
    out.zone.textContent = hit.zone.name;
    out.where.textContent = d.where;
    out.sw.style.setProperty('--c', hex(d.color));
    out.hint.textContent = d.hint;
    // The tablet keeps the lights on for 10 s (Light time). The auto demo moves on sooner.
    if (!REDUCE) timer = setTimeout(() => sim.end(), auto ? 6500 : 10000);
  }
  function ended() {
    clearInterval(discoTick);
    stage.classList.remove('is-disco');
    out.mode.textContent = auto ? 'Guide lights' : 'Ready';
    if (auto) timer = setTimeout(() => { k = (k + 1) % AUTO.length; say(AUTO[k]); }, 900);
  }

  $('.pt-ask', stage).addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#pt-say');
    const text = input.value.trim();
    if (text) say(text, { user: true });
    input.blur();
  });
  $$('.pt-chips button', stage).forEach((b) => b.addEventListener('click', () => {
    $$('.pt-chips button', stage).forEach((x) => x.classList.toggle('on', x === b));
    say(b.dataset.say, { user: true });
  }));
  say(AUTO[0]);
}

/* ---------------- The wave graph ---------------- */
function initWave() {
  const canvas = $('.pt-wave'), label = $('.pt-wave-t');
  const ctx = canvas.getContext('2d');
  const MAX_D = 3;
  let W = 0, H = 0;
  const fit = () => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const draw = (ts) => {
    const L = 34, R = 14, T = 16, B = 30, pw = W - L - R, ph = H - T - B;
    const X = (d) => L + (d / MAX_D) * pw, Y = (v) => T + ph - (v / GUIDE.max) * ph;
    ctx.clearRect(0, 0, W, H);
    ctx.font = '10px "Geist Mono", ui-monospace, monospace';
    ctx.fillStyle = '#767D87'; ctx.strokeStyle = 'rgba(232,234,237,.08)'; ctx.lineWidth = 1;
    for (let d = 0; d <= MAX_D; d++) {
      ctx.beginPath(); ctx.moveTo(X(d), T); ctx.lineTo(X(d), T + ph); ctx.stroke();
      ctx.fillText(`${d} m`, X(d) - (d ? 9 : 0), H - 10);
    }
    ctx.beginPath(); ctx.moveTo(L, T + ph); ctx.lineTo(L + pw, T + ph); ctx.stroke();
    ctx.save(); ctx.translate(12, T + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('brightness', -28, 0); ctx.restore();
    // The envelope (the glow) and the curve.
    ctx.strokeStyle = 'rgba(255,90,80,.35)'; ctx.setLineDash([3, 4]); ctx.beginPath();
    for (let i = 0; i <= 200; i++) { const d = (i / 200) * MAX_D; const v = GUIDE.max * (GUIDE.floor + (1 - GUIDE.floor) * Math.exp(-d / GUIDE.falloffM)); i ? ctx.lineTo(X(d), Y(v)) : ctx.moveTo(X(d), Y(v)); }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#FF5A50'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i <= 300; i++) { const d = (i / 300) * MAX_D; const v = guideLevel(d, ts); i ? ctx.lineTo(X(d), Y(v)) : ctx.moveTo(X(d), Y(v)); }
    ctx.stroke();
    // The real LEDs: one each 10 cm.
    for (let d = 0.1; d <= MAX_D + 1e-6; d += 0.1) {
      const v = guideLevel(d, ts), a = v / GUIDE.max;
      ctx.fillStyle = `rgba(255,${Math.round(40 * a)},${Math.round(30 * a)},${0.25 + 0.75 * a})`;
      ctx.beginPath(); ctx.arc(X(d), T + ph + 0.5, 2 + 3 * a, 0, Math.PI * 2); ctx.fill();
    }
    // The zone.
    const z = 0.35 + 0.65 * (0.5 + 0.5 * Math.cos((2 * Math.PI * ts) / GUIDE.periodS));
    ctx.fillStyle = `rgba(0,255,70,${z})`; ctx.fillRect(L - 4, T, 4, ph);
    label.textContent = `t = ${ts.toFixed(1)} s`;
  };
  new ResizeObserver(() => { fit(); draw(0.6); }).observe(canvas);
  fit(); draw(0.6);
  if (!REDUCE) { const t0 = performance.now(); whileVisible(canvas, (now) => draw(((now - t0) / 1000) % 60)); }
}

/* ---------------- The LED finder ---------------- */
const STEPS = ['Lead', 'Start', 'Dark', 'Bit 0', 'Bit 1', 'Bit 2', 'Bit 3', 'Bit 4', 'Bit 5', 'Bit 6', 'Bit 7', 'Parity', 'End', 'Tail'];
const ones = (n) => n.toString(2).split('').filter((b) => b === '1').length;
function ledOn(i, step) {
  const n = i + 1;
  if (step === 1 || step === 12) return true;
  if (step >= 3 && step <= 10) return ((n >> (step - 3)) & 1) === 1;
  if (step === 11) return ones(n) % 2 === 1;
  return false;
}
function initFinder() {
  const box = $('.pt-finder'), cam = $('.pt-cam', box), bar = $('.pt-steps-bar', box), stepL = $('.pt-step', box);
  const { points, aspect } = doorView();
  const SAMPLE = [4, 56, 139];
  cam.style.setProperty('--ar', String(aspect * 1.18));
  cam.innerHTML = points.map(([x, y], i) => `<i style="left:${(6 + x * 88).toFixed(2)}%;top:${(8 + y * 84).toFixed(2)}%"${SAMPLE.includes(i) ? ' class="s"' : ''}></i>`).join('')
    + SAMPLE.map((i) => `<b class="tag label" style="left:${(6 + points[i][0] * 88).toFixed(2)}%;top:${(8 + points[i][1] * 84).toFixed(2)}%">LED ${i}</b>`).join('');
  bar.innerHTML = STEPS.map((s) => `<li><span>${s.replace('Bit ', 'b')}</span></li>`).join('');
  const table = document.createElement('div');
  table.className = 'pt-bits';
  table.innerHTML = SAMPLE.map((i) => `<div class="row" data-i="${i}"><span class="label">LED ${i}</span><span class="cells">${'<i></i>'.repeat(8)}</span><span class="par label">P</span><span class="out label num">…</span></div>`).join('');
  box.insertBefore(table, $('figcaption', box));
  const dots = $$('i', cam), cells = $$('.row', table), segs = $$('li', bar);

  function show(step) {
    dots.forEach((d, i) => d.classList.toggle('on', ledOn(i, step)));
    segs.forEach((s, k) => { s.classList.toggle('now', k === step); s.classList.toggle('done', k < step); });
    stepL.textContent = `Step ${String(step + 1).padStart(2, '0')} / 14 · ${STEPS[step]}`;
    cells.forEach((row) => {
      const i = +row.dataset.i, n = i + 1;
      $$('.cells i', row).forEach((c, b) => {
        const known = step >= 3 + b;
        c.textContent = known ? String((n >> b) & 1) : '';
        c.classList.toggle('one', known && ((n >> b) & 1) === 1);
      });
      const par = $('.par', row);
      par.classList.toggle('ok', step >= 11);
      par.textContent = step >= 11 ? `P ${ones(n) % 2} ✓` : 'P';
      $('.out', row).textContent = step >= 11 ? `${n} − 1 = ${i}` : '…';
    });
    box.classList.toggle('decoded', step >= 11);
  }
  if (REDUCE) { show(11); return; }
  let step = 0, timer = 0, running = false;
  const tick = () => { show(step); const wait = step === 13 ? 2600 : step === 11 ? 1600 : 750; step = (step + 1) % 14; timer = setTimeout(tick, wait); };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; tick(); }
    if (!e.isIntersecting && running) { running = false; clearTimeout(timer); }
  }, { threshold: 0.25 }).observe(box);
  show(0);
}

/* ---------------- The route ---------------- */
function initRoute() {
  const host = $('.pt-route-svg');
  const VW = 1000, VH = 350, L = 60, R = 40, pw = VW - L - R;
  const X = (u) => L + (u / FLAT_LENGTH) * pw;
  const Y = (y) => 290 - (y / shelfY(5)) * 225;
  let u = 0;
  const walls = WALL_INFO.map((w) => {
    const a = u; u += w.len;
    return `<g class="wall"><line x1="${X(u)}" y1="${Y(0)}" x2="${X(u)}" y2="${Y(shelfY(5)) - 18}" class="div"/>
      <text x="${(X(a) + X(u)) / 2}" y="${Y(shelfY(5)) - 26}" text-anchor="middle" class="t">${esc(w.name)} · ${w.len} m · ${w.n} LEDs</text></g>`;
  }).join('');
  const shelves = [0, 1, 2, 3, 4, 5].map((lv) => `<line x1="${X(0)}" x2="${X(FLAT_LENGTH)}" y1="${Y(shelfY(lv))}" y2="${Y(shelfY(lv))}" class="${lv >= 1 && lv <= 4 ? 'sh' : 'sh off'}"/>
    <text x="${L - 12}" y="${Y(shelfY(lv)) + 4}" text-anchor="end" class="t">${lv ? `S${lv}` : 'Floor'}</text>`).join('');
  const path = FLAT.map((q, i) => `${i ? 'L' : 'M'}${X(q.u).toFixed(1)} ${Y(q.y).toFixed(1)}`).join(' ');
  const dots = FLAT.map((q, i) => `<circle cx="${X(q.u).toFixed(1)}" cy="${Y(q.y).toFixed(1)}" r="${LEDS[i].wall ? 3 : 2.4}" class="${LEDS[i].wall ? 'led' : 'led jump'}" style="--k:${i}"/>`).join('');
  const mark = (i, text, dy, anchor = 'middle') => `<text x="${X(FLAT[i].u)}" y="${Y(FLAT[i].y) + dy}" text-anchor="${anchor}" class="t n">${text}</text>`;
  const j = 100, jx = (X(FLAT[j - 1].u) + X(FLAT[j].u)) / 2, jy = Y(FLAT[j].y);
  host.innerHTML = `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="The LED route on the three walls, unfolded. The string runs along shelf 1 from the left wall to the right wall, goes up at the door end, comes back on shelf 2, and so on to shelf 4. 184 LEDs.">
    ${shelves}${walls}
    <path d="${path}" class="path"/>
    ${dots}
    ${mark(0, 'LED 0', 20, 'start')}${mark(42, '42', 20, 'end')}${mark(183, '183', -10, 'start')}
    <g class="junction"><line x1="${jx}" y1="${jy}" x2="${jx}" y2="${Y(0) + 6}"/><circle cx="${jx}" cy="${jy}" r="7"/>
      <text x="${jx + 12}" y="${(Y(shelfY(1)) + Y(shelfY(2))) / 2 + 4}" class="t">String A → B at LED 100 · second power feed</text></g>
    <g class="ctrl"><rect x="${X(0) - 4}" y="${Y(0) + 14}" width="172" height="24"/><text x="${X(0) + 6}" y="${Y(0) + 30}" class="t">Controller · GPIO 16</text></g>
    <text x="${X(0) + 182}" y="${Y(0) + 30}" class="t dim">← door end</text><text x="${X(FLAT_LENGTH)}" y="${Y(0) + 30}" text-anchor="end" class="t dim">door end →</text>
  </svg>`;
  if (REDUCE) return;
  // The data runs along the string: one LED after the other.
  const circles = $$('circle.led', host);
  let k = 0;
  whileVisible(host, () => {
    k = (k + 1) % (LED_COUNT + 40);
    circles.forEach((c, i) => c.classList.toggle('hot', i <= k && k - i < 18));
  });
}

/* ---------------- Disco ---------------- */
function initDisco() {
  const fig = $('.pt-stage--disco'), look = $('.pt-look', fig), btn = $('.pt-party');
  const sim = createPantrySim($('.pt-canvas2', fig), { reduce: REDUCE, onEnd: () => { look.textContent = 'Ready'; btn.disabled = false; } });
  let tick = 0;
  // The party starts once by itself, when the model first comes into view.
  if (!REDUCE) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); btn.click(); } }, { threshold: 0.6 });
    io.observe(fig);
  }
  btn.addEventListener('click', () => {
    sim.disco();
    btn.disabled = !REDUCE;
    const show = sim.show;
    clearInterval(tick);
    const upd = () => { if (sim.show === show) look.textContent = show.look(sim.time()).name; else clearInterval(tick); };
    upd();
    if (!REDUCE) tick = setInterval(upd, 250);
  });
}

/* ---------------- The clip ---------------- */
function initClip() {
  const box = $('.pt-clipbox'), host = $('.pt-clip-svg', box);
  const P = { ...CLIP };
  const f1 = (v) => v.toFixed(1);
  function draw() {
    const c = profile(P);
    // Millimeters, with y down in the SVG. The frame stays the same, so the clip grows and shrinks.
    const Y = (y) => -y;
    const path = 'M' + c.pts.map(([x, y]) => `${x.toFixed(2)} ${Y(y).toFixed(2)}`).join(' L') + ' Z';
    const wire = [(c.x0 + c.xu) / 2, c.yb + c.ta + 1];
    const lx = 24;
    const lead = (x, y, text) => `<line x1="${x}" y1="${Y(y)}" x2="${lx - 1}" y2="${Y(y)}" class="ld"/><text x="${lx}" y="${Y(y) + 0.7}" class="t">${text}</text>`;
    host.innerHTML = `<svg viewBox="-16 -9 72 69" role="img" aria-label="The clip profile: a hook over the top bar, a spine, a small U for the LED string, and a catch under the bottom bar. ${f1(c.size[0])} by ${f1(c.size[1])} by ${P.width} millimeters.">
      <line x1="-10" y1="${Y(0)}" x2="-10" y2="${Y(-c.D)}" class="dim"/>
      <line x1="-11.5" y1="${Y(0)}" x2="-8.5" y2="${Y(0)}" class="dim"/><line x1="-11.5" y1="${Y(-c.D)}" x2="-8.5" y2="${Y(-c.D)}" class="dim"/>
      <text transform="translate(-11.8 ${Y(-c.D / 2)}) rotate(-90)" text-anchor="middle" class="t n">${f1(c.D)} mm</text>
      <circle cx="0" cy="${Y(0)}" r="${c.R}" class="bar"/><circle cx="0" cy="${Y(-c.D)}" r="${c.R}" class="bar"/>
      <path d="${path}" class="clip"/>
      <circle cx="${wire[0]}" cy="${Y(wire[1])}" r="1" class="wire"/>
      ${lead(c.ri + P.t + 0.5, c.ri * 0.6, 'Top hook · the load')}
      ${lead(c.xu + P.ta + 0.6, wire[1], 'Light hook · string')}
      ${lead(c.ri + P.t, -c.D - c.ri * 0.7, 'Catch · snaps under')}
    </svg>`;
    $('.pt-clip-size', box).textContent = `${f1(c.size[0])} × ${f1(c.size[1])} × ${P.width} mm`;
    $('[data-m="snap"]', box).textContent = `${c.snap.toFixed(2)} mm`;
    $('[data-m="bore"]', box).textContent = `Ø${(2 * c.ri).toFixed(1)} mm`;
    $('[data-m="D"]', box).textContent = `${f1(c.D)} mm`;
    $('.pt-clip-warn', box).hidden = c.snap <= 1;
  }
  $$('input[data-k]', box).forEach((inp) => inp.addEventListener('input', () => {
    const k = inp.dataset.k;
    P[k] = +inp.value;
    $(`[data-v="${k}"]`, box).textContent = `${k === 'gap' && P.gap % 1 === 0 ? P.gap : P[k].toFixed(1)} mm`;
    draw();
  }));
  box.classList.add('live');
  draw();
}

/* ---------------- Chapter nav ---------------- */
function initNav() {
  const links = $$('.pt-nav a');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === `#${e.target.id}`));
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((a) => { const s = $(a.getAttribute('href')); if (s) io.observe(s); });
}

initHero();
initWave();
initFinder();
initRoute();
initDisco();
initClip();
initNav();
window.__ready = true;
