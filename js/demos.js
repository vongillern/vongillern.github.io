// Small live demos for the Instrument variant.
// Each demo pauses when it is not on screen.

const { gsap } = window;
const pad2 = (n) => String(n).padStart(2, '0');
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function whenVisible(el, onChange, threshold = 0.15) {
  const io = new IntersectionObserver(([e]) => onChange(e.isIntersecting), { threshold });
  io.observe(el);
  return io;
}

/* ------------------------------------------------------------------ */
/* Room Scale: a scan line reveals each pipeline stage over the last.  */
/* ------------------------------------------------------------------ */
export function roomScan(view, stages, { reduce, hover, alt }) {
  const n = stages.length;
  view.innerHTML =
    stages.map((s, i) => `<img class="rs-layer" src="${s.src}"${s.srcset ? ` srcset="${s.srcset}" sizes="(max-width: 899px) 100vw, 58vw"` : ''} width="1500" height="1001" alt="${i === 0 ? alt : ''}" ${i ? 'aria-hidden="true"' : ''} decoding="async" style="z-index:${i + 1}">`).join('') +
    `<div class="rs-line" aria-hidden="true"><span class="chip"><i></i><span class="rs-next"></span></span></div>
     <div class="ov ov-bl rs-hud"><span class="chip rs-stage"></span><div class="rs-steps">${stages.map(() => '<i></i>').join('')}</div><span class="note-line rs-note"></span></div>`;
  const layers = [...view.querySelectorAll('.rs-layer')];
  const line = view.querySelector('.rs-line');
  const next = view.querySelector('.rs-next');
  const stageEl = view.querySelector('.rs-stage');
  const noteEl = view.querySelector('.rs-note');
  const steps = [...view.querySelectorAll('.rs-steps i')];

  const st = { x: 0 };
  let base = 0, px = 0, hovering = false, lastNote = -1;

  function apply() {
    const x = hovering ? px : st.x;
    layers.forEach((img, i) => {
      if (i <= base) img.style.clipPath = 'inset(0 0 0 0)';
      else if (i === base + 1) img.style.clipPath = `inset(0 ${((1 - x) * 100).toFixed(3)}% 0 0)`;
      else img.style.clipPath = 'inset(0 100% 0 0)';
    });
    const hasNext = base + 1 < n;
    line.style.left = `${(x * 100).toFixed(3)}%`;
    line.style.opacity = hasNext && x > 0.004 && x < 0.996 ? 1 : 0;
    line.classList.toggle('flip', x > 0.7);
    next.textContent = hasNext ? stages[base + 1].label : '';
    const cur = x > 0.5 && hasNext ? base + 1 : base;
    stageEl.textContent = `Stage ${pad2(cur + 1)} / ${pad2(n)} · ${stages[cur].label}`;
    steps.forEach((s, i) => s.classList.toggle('on', i <= cur));
    if (cur !== lastNote) { noteEl.textContent = stages[cur].note; lastNote = cur; }
  }

  if (reduce) { base = Math.min(3, n - 1); st.x = 0; apply(); return; }

  const tl = gsap.timeline({ repeat: -1, paused: true });
  for (let b = 0; b < n - 1; b++) {
    tl.call(() => { base = b; st.x = 0; apply(); });
    tl.to(st, { x: 1, duration: 1.9, ease: 'power1.inOut', onUpdate: apply });
    tl.to({}, { duration: b === n - 2 ? 2.6 : 1.1 });
  }
  // Fade back to the photo, then loop.
  tl.to(layers.slice(1), { opacity: 0, duration: 0.6, ease: 'power2.inOut' });
  tl.call(() => { base = 0; st.x = 0; layers.forEach((l) => (l.style.opacity = 1)); apply(); });

  apply();
  let onScreen = false;
  whenVisible(view, (v) => { onScreen = v; if (v && !hovering) tl.play(); else tl.pause(); });

  if (hover) {
    view.parentElement.addEventListener('pointermove', (e) => {
      const r = view.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      if (!hovering) { hovering = true; tl.pause(); if (base + 1 >= n) { base = 0; layers.forEach((l) => (l.style.opacity = 1)); } }
      px = clamp((e.clientX - r.left) / r.width, 0, 1);
      apply();
    });
    view.parentElement.addEventListener('pointerleave', () => {
      if (!hovering) return;
      const p = { v: px };
      gsap.to(p, {
        v: st.x, duration: 0.35, ease: 'power2.out',
        onUpdate: () => { px = p.v; apply(); },
        onComplete: () => { hovering = false; apply(); if (onScreen) tl.play(); },
      });
    });
  }
}

/* ------------------------------------------------------------------ */
/* Igor: lights blink their codes; a camera view decodes and names them. */
/* ------------------------------------------------------------------ */
export function igorDemo(root, story, { reduce }) {
  const narrow = root.clientWidth < 560;
  const cols = narrow ? 3 : 6, rows = 4;
  const BW = narrow ? 1 : 2, BH = 2; // the camera sees BW x BH lights
  const PERB = BW * BH;
  const VW = narrow ? 360 : 700, VH = narrow ? 300 : 360;
  const mx = narrow ? 66 : 64, my = narrow ? 54 : 62;
  const dx = (VW - mx * 2) / (cols - 1), dy = (VH - my - 44) / (rows - 1);
  const fs = narrow ? 8.4 : 9.6;
  const nodes = [];
  const used = new Set();
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      // A unique 8-bit code for each light, with a mix of on and off bits.
      let code = (k * 89 + 53) % 251;
      while (used.has(code) || code === 0 || code === 255 || code.toString(2).split('1').length - 1 < 3 || code.toString(2).split('1').length - 1 > 5) code = (code + 7) % 251;
      used.add(code);
      nodes.push({ i, j, x: mx + i * dx, y: my + j * dy, bits: code.toString(2).padStart(8, '0') });
    }
  }
  const svg = `<svg class="igor-svg" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Illustration: ceiling lights blink codes and a camera names them.">
    <defs><pattern id="ig-grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="rgba(232,234,237,.035)" stroke-width="1"/></pattern></defs>
    <rect width="${VW}" height="${VH}" fill="url(#ig-grid)"/>
    <text x="14" y="22" fill="#767D87" font-family="Geist Mono, monospace" font-size="${fs}" letter-spacing=".8">CEILING · ${cols * rows} NODES · VIEW FROM BELOW</text>
    <g class="vf" opacity="0">
      <rect class="vf-r" fill="rgba(77,225,255,.04)" stroke="#4DE1FF" stroke-width="1" stroke-dasharray="3 3"/>
      <path class="vf-c" fill="none" stroke="#4DE1FF" stroke-width="2"/>
    </g>
    ${nodes.map((nd, k) => `
      <g class="nd" transform="translate(${nd.x} ${nd.y})">
        <circle r="13" fill="none" stroke="#2F343B"/>
        <circle class="glow" r="11" fill="#C8FF4D" opacity="0"/>
        <circle class="core" r="5.5" fill="#1C2026"/>
        <rect class="ok" x="9" y="-16" width="5" height="5" fill="#C8FF4D" opacity="0"/>
        <text class="bits" y="28" text-anchor="middle" font-family="Geist Mono, monospace" font-size="${fs}" letter-spacing=".5">${[...nd.bits].map((b) => `<tspan fill="#4A5059">${b}</tspan>`).join('')}</text>
        <text class="name" y="28" text-anchor="middle" fill="#C8FF4D" font-family="Geist Mono, monospace" font-size="${fs}" opacity="0"></text>
      </g>`).join('')}
    <g class="vf-lab" opacity="0"><rect class="vf-tb" height="15" fill="#4DE1FF"/><text class="vf-t" fill="#0B0C0E" font-family="Geist Mono, monospace" font-size="${fs - 0.4}" letter-spacing=".6"></text></g>
  </svg>`;
  root.insertAdjacentHTML('afterbegin', svg);
  const el = root.querySelector('svg');
  const ndEls = [...el.querySelectorAll('.nd')];
  const glows = ndEls.map((g) => g.querySelector('.glow'));
  const cores = ndEls.map((g) => g.querySelector('.core'));
  const oks = ndEls.map((g) => g.querySelector('.ok'));
  const bitsEls = ndEls.map((g) => g.querySelector('.bits'));
  const spans = bitsEls.map((t) => [...t.querySelectorAll('tspan')]);
  const nameEls = ndEls.map((g) => g.querySelector('.name'));
  const vf = el.querySelector('.vf'), vfR = el.querySelector('.vf-r'), vfC = el.querySelector('.vf-c');
  const vfLab = el.querySelector('.vf-lab'), vfT = el.querySelector('.vf-t'), vfTb = el.querySelector('.vf-tb');
  const barW = root.querySelector('.meter.w i'), barM = root.querySelector('.meter.m i');
  const tW = root.querySelector('.t-w'), tM = root.querySelector('.t-m');

  // Camera positions: blocks of 2 x 2 lights.
  const blocks = [];
  for (let bj = 0; bj < rows; bj += BH) for (let bi = 0; bi < cols; bi += BW) blocks.push([bi, bj]);
  const TICK = 0.17, DECODE = 8, MOVE = 0.55, HOLD = 1.5;
  const PER = MOVE + DECODE * TICK + HOLD;
  const LOOP = blocks.length * PER + 1.4;

  const vfGeom = (bi, bj) => ({ x: mx + bi * dx - (narrow ? 50 : 30), y: my + bj * dy - 24, w: (BW - 1) * dx + (narrow ? 100 : 60), h: (BH - 1) * dy + 56 });
  function setVf(g) {
    vfR.setAttribute('x', g.x); vfR.setAttribute('y', g.y); vfR.setAttribute('width', g.w); vfR.setAttribute('height', g.h);
    const c = 10, { x, y, w, h } = g;
    vfC.setAttribute('d', `M${x} ${y + c}V${y}H${x + c} M${x + w - c} ${y}H${x + w}V${y + c} M${x + w} ${y + h - c}V${y + h}H${x + w - c} M${x + c} ${y + h}H${x}V${y + h - c}`);
    vfLab.setAttribute('transform', `translate(${x} ${y + h})`);
  }
  function setLabel(text) {
    vfT.textContent = text;
    const w = text.length * (fs * 0.6) + 12;
    vfTb.setAttribute('width', w);
    vfTb.setAttribute('y', 0);
    vfT.setAttribute('x', 6);
    vfT.setAttribute('y', 10.8);
  }
  const cur = { x: 0, y: 0, w: 0, h: 0 };
  const inBlock = (k, b) => { const nd = nodes[k]; return nd.i >= b[0] && nd.i < b[0] + BW && nd.j >= b[1] && nd.j < b[1] + BH; };
  const fmt = (sec) => `${pad2(Math.floor(sec / 60))}:${pad2(Math.floor(sec % 60))}`;
  function nameNode(k, name) {
    nameEls[k].textContent = name;
    gsap.to(nameEls[k], { opacity: 1, duration: 0.3 });
    gsap.to(bitsEls[k], { opacity: 0, duration: 0.2 });
    oks[k].setAttribute('opacity', 1);
  }
  function unnameAll() {
    nameEls.forEach((t, k) => {
      if (!t.textContent) return;
      gsap.to(t, { opacity: 0, duration: 0.25, onComplete: () => { t.textContent = ''; } });
      gsap.to(bitsEls[k], { opacity: 1, duration: 0.25 });
    });
  }

  let t0 = performance.now() / 1000, raf = 0, on = false, lastBlock = -1, lastTick = -1, named = -1;
  function paintBits(bit) {
    nodes.forEach((nd, k) => {
      const lit = nd.bits[bit] === '1';
      cores[k].setAttribute('fill', lit ? '#C8FF4D' : '#1C2026');
      glows[k].setAttribute('opacity', lit ? '.16' : '0');
      spans[k].forEach((sp, q) => sp.setAttribute('fill', q === bit ? '#E8EAED' : '#4A5059'));
    });
  }
  function frame() {
    raf = 0;
    if (!on) return;
    const now = performance.now() / 1000;
    const t = (now - t0) % LOOP;
    const tick = Math.floor((now - t0) / TICK);
    if (tick !== lastTick) { lastTick = tick; paintBits(tick % 8); }
    const bIdx = Math.min(blocks.length - 1, Math.floor(t / PER));
    const end = t > blocks.length * PER;
    const local = t - bIdx * PER;
    const b = blocks[bIdx];
    if (bIdx !== lastBlock) {
      if (bIdx === 0) oks.forEach((o) => o.setAttribute('opacity', 0));
      lastBlock = bIdx;
      named = -1;
      const target = vfGeom(b[0], b[1]);
      if (!cur.w) Object.assign(cur, target);
      gsap.to(cur, { ...target, duration: MOVE, ease: 'expo.inOut', onUpdate: () => setVf(cur) });
      vf.setAttribute('opacity', 1);
      vfLab.setAttribute('opacity', 1);
    }
    const decoded = clamp(Math.floor((local - MOVE) / TICK), 0, DECODE);
    if (end) setLabel('ALL NODES NAMED');
    else if (decoded < DECODE) setLabel(`DECODING · BIT ${decoded}/${DECODE}`);
    else if (named !== bIdx) {
      named = bIdx;
      setLabel(`NAMED · ${PERB} NODES`);
      unnameAll();
      const ks = nodes.map((_, k) => k).filter((k) => inBlock(k, b));
      ks.forEach((k, q) => nameNode(k, story.names[(bIdx * PERB + q) % story.names.length]));
    }
    // Two clocks: the webcam finishes in two minutes; manual work goes on.
    const q = clamp(t / (blocks.length * PER), 0, 1);
    const sec = q * 120;
    if (barW) barW.style.width = `${q * 100}%`;
    if (barM) barM.style.width = `${q * (2 / 25) * 100}%`;
    if (tW) tW.textContent = `${fmt(sec)} / 02:00`;
    if (tM) tM.textContent = `${fmt(sec)} / 20–30 MIN`;
    raf = requestAnimationFrame(frame);
  }
  if (reduce) {
    const b = blocks[0];
    setVf(vfGeom(b[0], b[1])); vf.setAttribute('opacity', 1); vfLab.setAttribute('opacity', 1);
    paintBits(0);
    setLabel(`NAMED · ${PERB} NODES`);
    nodes.map((_, k) => k).filter((k) => inBlock(k, b)).forEach((k, q) => { nameEls[k].textContent = story.names[q]; nameEls[k].setAttribute('opacity', 1); bitsEls[k].setAttribute('opacity', 0); });
    return;
  }
  paintBits(0);
  whenVisible(root, (v) => {
    on = v;
    if (v && !raf) raf = requestAnimationFrame(frame);
  });
}

/* ------------------------------------------------------------------ */
/* Pioneer: 1,400 one-megabyte cells collapse into 30.                 */
/* ------------------------------------------------------------------ */
export function pioneerDemo(canvas, readout, { reduce }) {
  const ctx = canvas.getContext('2d');
  const N = 1400, C = 70, R = 20;
  const RC = 10, RR = 3; // 30 regions
  const M = RC * RR;
  let W = 0, H = 0, cells = [], targets = [], blockPos = [], s0 = 4;
  function layout() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const padX = 18, padY = 22;
    const s = Math.min((W - padX * 2) / C, (H - padY * 2) / R);
    s0 = s;
    const ox = (W - s * C) / 2, oy = (H - s * R) / 2;
    cells = [];
    for (let k = 0; k < N; k++) {
      const i = k % C, j = Math.floor(k / C);
      const ri = Math.min(RC - 1, Math.floor(i / (C / RC))), rj = Math.min(RR - 1, Math.floor(j / (R / RR)));
      cells.push({ x: ox + i * s, y: oy + j * s, s, r: rj * RC + ri, d: Math.random() * 0.25 });
    }
    targets = [];
    for (let r = 0; r < M; r++) {
      const ri = r % RC, rj = Math.floor(r / RC);
      targets.push({ x: ox + (ri + 0.5) * (C / RC) * s, y: oy + (rj + 0.5) * (R / RR) * s });
    }
    // The final compact block of 30 cells, 10 x 3.
    const bs = Math.max(7, s * 2.4), g = 3;
    const bw = RC * bs + (RC - 1) * g, bh = RR * bs + (RR - 1) * g;
    const bx = (W - bw) / 2, by = (H - bh) / 2;
    blockPos = targets.map((_, r) => ({ x: bx + (r % RC) * (bs + g), y: by + Math.floor(r / RC) * (bs + g), s: bs }));
  }
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const T = { hold: 1.2, a: 1.8, b: 0.9, hold2: 2.6, back: 0.9 };
  const LOOP = T.hold + T.a + T.b + T.hold2 + T.back;

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const pa = clamp((t - T.hold) / T.a, 0, 1);
    const pb = clamp((t - T.hold - T.a) / T.b, 0, 1);
    const back = clamp((t - T.hold - T.a - T.b - T.hold2) / T.back, 0, 1);
    ctx.fillStyle = '#4DE1FF';
    if (back > 0) {
      // Reset: the source cells fade back in.
      ctx.globalAlpha = 0.5 * ease(back);
      for (const c of cells) ctx.fillRect(c.x, c.y, c.s - 1, c.s - 1);
    } else {
      // Source cells move to their region center and fade.
      for (const c of cells) {
        const u = ease(clamp((pa - c.d) / 0.75, 0, 1));
        if (u >= 1) continue;
        const tg = targets[c.r];
        ctx.globalAlpha = 0.5 * (1 - u);
        ctx.fillRect(c.x + (tg.x - c.s / 2 - c.x) * u, c.y + (tg.y - c.s / 2 - c.y) * u, c.s - 1, c.s - 1);
      }
    }
    // The 30 result cells.
    if (pa > 0.35) {
      const appear = clamp((pa - 0.35) / 0.65, 0, 1);
      ctx.fillStyle = '#C8FF4D';
      const u = ease(pb);
      targets.forEach((tg, r) => {
        const bp = blockPos[r];
        const s = s0 * 1.7 + (bp.s - s0 * 1.7) * u;
        const x = (tg.x - s / 2) + (bp.x - (tg.x - s / 2)) * u;
        const y = (tg.y - s / 2) + (bp.y - (tg.y - s / 2)) * u;
        ctx.globalAlpha = appear * (1 - back);
        ctx.fillRect(x, y, s, s);
      });
    }
    ctx.globalAlpha = 1;
    const mb = Math.round(1400 - 1370 * ease(pa) + 1370 * ease(back));
    readout.v.textContent = `${mb.toLocaleString('en-US')} MB`;
    readout.d.style.opacity = pb > 0.9 && back < 0.1 ? 1 : 0.25;
  }
  layout();
  window.addEventListener('resize', () => { layout(); draw(0); });
  if (reduce) { draw(T.hold + T.a + T.b + 0.01); return; }
  let on = false, raf = 0, t0 = performance.now() / 1000;
  function frame() {
    raf = 0;
    if (!on) return;
    draw(((performance.now() / 1000) - t0) % LOOP);
    raf = requestAnimationFrame(frame);
  }
  whenVisible(canvas, (v) => { on = v; if (v && !raf) { t0 = performance.now() / 1000; raf = requestAnimationFrame(frame); } });
  draw(0);
}

/* ------------------------------------------------------------------ */
/* R&D terminal: what a person sees against what a scraper reads.     */
/* ------------------------------------------------------------------ */
export function rndTerminal(root, { reduce }) {
  const bots = [...root.querySelectorAll('.term-bot')];
  const status = root.querySelector('.term-status');
  bots.forEach((b) => (b.textContent = b.dataset.bot));
  status.textContent = `Read complete · ${bots.length} string${bots.length === 1 ? '' : 's'}`;
  if (reduce) return;
  // Start from the finished read. Then clear and read again.
  const tl = gsap.timeline({ repeat: -1, paused: true });
  tl.to({}, { duration: 3.4 });
  tl.call(() => { status.textContent = 'Reading DOM text'; });
  bots.forEach((b) => tl.set(b, { textContent: '' }));
  bots.forEach((b, i) => {
    tl.to(b, {
      duration: 1.4,
      scrambleText: { text: b.dataset.bot, chars: b.dataset.chars || '0123456789$#%&*', revealDelay: 0.3, speed: 0.6 },
      ease: 'none',
    }, i === 0 ? '>' : '<0.45');
  });
  tl.call(() => { status.textContent = `Read complete · ${bots.length} string${bots.length === 1 ? '' : 's'}`; });
  whenVisible(root, (v) => (v ? tl.play() : tl.pause()));
}

/* ------------------------------------------------------------------ */
/* Airplane Mode: open every game, then open it again with no network. */
/* ------------------------------------------------------------------ */
export function airplaneCells(root, { reduce }) {
  const cells = [...root.querySelectorAll('.air-cells i')];
  const net = root.querySelector('.air-net');
  const netT = root.querySelector('.air-net .t');
  const big = root.querySelector('.air-big .k');
  const total = cells.length;
  const done = () => { cells.forEach((c) => { c.classList.remove('c'); c.classList.add('l'); }); net.classList.add('off'); netT.textContent = 'All pass offline'; big.textContent = pad2(total); };
  done();
  if (reduce) return;
  const tl = gsap.timeline({ repeat: -1, paused: true });
  tl.to({}, { duration: 2.6 });
  tl.call(() => { cells.forEach((c) => c.classList.remove('c', 'l')); net.classList.remove('off'); netT.textContent = 'Net on · open each game'; big.textContent = '00'; });
  cells.forEach((c, i) => tl.call(() => { c.classList.add('c'); big.textContent = pad2(i + 1); }, null, '+=0.11'));
  tl.to({}, { duration: 0.5 });
  tl.call(() => { net.classList.add('off'); netT.textContent = 'Net off · open again'; big.textContent = '00'; });
  cells.forEach((c, i) => tl.call(() => { c.classList.remove('c'); c.classList.add('l'); big.textContent = pad2(i + 1); }, null, '+=0.13'));
  tl.call(done);
  whenVisible(root, (v) => (v ? tl.play() : tl.pause()));
}
