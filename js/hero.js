// Hero: one point for each typeface in content/fontdex.json.
// The points start as noise. A scan line moves across the plot and each
// point lands when the scan passes its x value. Scroll then regroups the
// points into one column for each category.

const COLORS = ['#C9CED6', '#4DE1FF', '#C8FF4D', '#FFB547', '#FFFFFF', '#6B717A'];
const ALPHA = [0.62, 0.9, 0.9, 0.9, 1, 0.8];
const RX = [0.4, 1.05]; // x height / cap height
const SY = [0, 320]; // stem width, units per 1000 em
export const AXES = { RX, SY };

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const expoOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const ease2 = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function createHero({ section, canvas, frame, tip, data, reduce, onIntroDone, onCount }) {
  const ctx = canvas.getContext('2d');
  const cats = data.categories;
  const pts = [];
  for (const r of data.rows) {
    const [fi, ci, cap, xh, stem] = r;
    if (!(cap > 0 && xh > 0 && stem > 0)) continue;
    pts.push({
      fam: data.families[fi], cat: ci, cap, xh, stem,
      ratio: xh / cap, italic: r[8] === 1,
      x: 0, y: 0, nx: 0, ny: 0, ax: 0, ay: 0, bx: 0, by: 0, t: 0, ph: Math.random() * Math.PI * 2,
    });
  }
  const byCat = cats.map((_, c) => pts.filter((p) => p.cat === c));
  const counts = byCat.map((a) => a.length);
  // Medians, for the guide lines.
  const med = (arr) => { const a = arr.slice().sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
  const medRatio = med(pts.map((p) => p.ratio));
  const medStem = med(pts.map((p) => p.stem));

  let W = 0, H = 0, F = { x: 0, y: 0, w: 1, h: 1 }, colGeo = [];
  let dot = 2.2, dotB = 3.2;
  let introStart = -1, introDone = reduce;
  let morph = 0, hover = null, visible = true, running = false;
  let lastScan = 0, scanT = -1;
  const SWEEP = 2.1, LAND = 0.75, LEAD = 0.25;

  function layout() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = section.clientWidth;
    H = section.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sr = section.getBoundingClientRect();
    const fr = frame.getBoundingClientRect();
    F = { x: fr.left - sr.left, y: fr.top - sr.top, w: fr.width, h: fr.height };
    const narrow = W < 700;
    dot = narrow ? 2.1 : 2.8;
    dotB = narrow ? 2.3 : 3.6;

    // Layout A: the scatter.
    for (const p of pts) {
      const rx = (clamp(p.ratio, RX[0], RX[1]) - RX[0]) / (RX[1] - RX[0]);
      const sy = (clamp(p.stem, SY[0], SY[1]) - SY[0]) / (SY[1] - SY[0]);
      p.ax = F.x + rx * F.w;
      p.ay = F.y + F.h - sy * F.h;
      p.t = rx;
      if (!p.nx && !p.ny) { p.nx = Math.random(); p.ny = Math.random(); }
    }

    // Layout B: one unit column for each category, sorted by stem width.
    const gap = narrow ? 8 : 22;
    const colW = (F.w - gap * (cats.length - 1)) / cats.length;
    // The tallest column fills about 72% of the frame.
    const maxN = Math.max(...counts);
    const pitch = clamp(Math.round(Math.sqrt((colW * F.h * 0.72) / maxN) * 10) / 10, 2.6, 9);
    dotB = Math.min(pitch * 0.7, narrow ? 2.4 : 4.6);
    const per = Math.max(1, Math.floor(colW / pitch));
    colGeo = [];
    cats.forEach((_, c) => {
      const list = byCat[c].slice().sort((a, b) => a.stem - b.stem);
      const x0 = F.x + c * (colW + gap);
      list.forEach((p, k) => {
        p.bx = x0 + (k % per) * pitch + pitch / 2;
        p.by = F.y + F.h - Math.floor(k / per) * pitch - pitch / 2 - 2;
      });
      colGeo.push({ x: x0 - F.x, w: colW, rows: Math.ceil(list.length / per) * pitch });
    });
    draw(performance.now() / 1000);
  }

  function pos(p, now) {
    // Intro position: noise until the scan passes, then ease to the target.
    let x, y;
    if (introDone) { x = p.ax; y = p.ay; } else {
      const t = now - introStart;
      const u = introStart < 0 ? 0 : clamp((t - (LEAD + p.t * SWEEP)) / LAND, 0, 1);
      const nx = p.nx * W + Math.sin(now * 0.6 + p.ph) * 6;
      const ny = p.ny * H + Math.cos(now * 0.5 + p.ph) * 6;
      const e = expoOut(u);
      x = nx + (p.ax - nx) * e;
      y = ny + (p.ay - ny) * e;
    }
    if (morph > 0) {
      const local = ease2(clamp((morph - p.cat * 0.055) / 0.62, 0, 1));
      x += (p.bx - x) * local;
      y += (p.by - y) * local;
      p.m = local;
    } else p.m = 0;
    p.x = x; p.y = y;
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    let landed = 0;
    const t = now - introStart;
    const scanX = introDone || introStart < 0 ? -1 : F.x + clamp((t - LEAD) / SWEEP, 0, 1) * F.w;
    // Idle rescan line (only when the scatter shows).
    let rescanX = -1;
    if (introDone && scanT >= 0 && morph < 0.02) rescanX = F.x + scanT * F.w;

    for (let c = 0; c < cats.length; c++) {
      ctx.fillStyle = COLORS[c];
      const list = byCat[c];
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        pos(p, now);
        const s = dot + (dotB - dot) * p.m;
        let a = ALPHA[c];
        if (!introDone) {
          const u = clamp((t - (LEAD + p.t * SWEEP)) / LAND, 0, 1);
          if (u > 0) landed++;
          a *= 0.28 + 0.72 * u;
        }
        if (rescanX >= 0) {
          const d = Math.abs(p.x - rescanX);
          if (d < 18) a = Math.min(1, a + (1 - d / 18) * 0.6);
        }
        ctx.globalAlpha = a;
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
    }
    ctx.globalAlpha = 1;

    // The intro scan line.
    if (scanX >= 0 && scanX < F.x + F.w + 1) {
      ctx.fillStyle = '#C8FF4D';
      ctx.fillRect(scanX, F.y - 10, 1, F.h + 10);
      ctx.font = '500 10px "Geist Mono", monospace';
      ctx.fillText('MEASURING', scanX + 8, F.y + 2);
    }
    if (rescanX >= 0) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#C8FF4D';
      ctx.fillRect(rescanX, F.y, 1, F.h);
      ctx.globalAlpha = 1;
    }

    // Median guide lines, only in the scatter layout.
    if (introDone && morph < 0.3) {
      const a = 1 - morph / 0.3;
      const mx = F.x + ((medRatio - RX[0]) / (RX[1] - RX[0])) * F.w;
      const my = F.y + F.h - ((medStem - SY[0]) / (SY[1] - SY[0])) * F.h;
      ctx.save();
      ctx.globalAlpha = 0.45 * a;
      ctx.strokeStyle = '#E8EAED';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(Math.round(mx) + 0.5, F.y); ctx.lineTo(Math.round(mx) + 0.5, F.y + F.h);
      ctx.moveTo(F.x, Math.round(my) + 0.5); ctx.lineTo(F.x + F.w, Math.round(my) + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.95 * a;
      ctx.font = '10px "Geist Mono", monospace';
      ctx.fillStyle = '#0B0C0E';
      const t1 = `MEDIAN ${medRatio.toFixed(2)}`, t2 = `MEDIAN ${medStem}`;
      const w1 = ctx.measureText(t1).width, w2 = ctx.measureText(t2).width;
      ctx.fillRect(mx + 6, F.y + 4, w1 + 10, 16);
      ctx.fillRect(F.x + F.w - w2 - 16, my - 22, w2 + 10, 16);
      ctx.fillStyle = '#E8EAED';
      ctx.fillText(t1, mx + 11, F.y + 15.5);
      ctx.fillText(t2, F.x + F.w - w2 - 11, my - 10.5);
      // Fonts at 1.0 have an x-height equal to the cap height.
      const x1 = F.x + ((1 - RX[0]) / (RX[1] - RX[0])) * F.w;
      const t3 = 'X = CAP';
      const w3 = ctx.measureText(t3).width;
      // Move the label down when it would touch the median label.
      const dy3 = x1 - w3 - 16 < mx + w1 + 22 ? 22 : 0;
      ctx.fillStyle = '#0B0C0E';
      ctx.fillRect(x1 - w3 - 16, F.y + 4 + dy3, w3 + 10, 16);
      ctx.fillStyle = '#8A9099';
      ctx.fillText(t3, x1 - w3 - 11, F.y + 15.5 + dy3);
      ctx.restore();
    }

    // Hover marker and guide lines to the axes.
    if (hover && introDone) {
      const p = hover;
      ctx.strokeStyle = '#C8FF4D';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.stroke();
      if (morph < 0.05) {
        ctx.setLineDash([2, 3]);
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(F.x, p.y); ctx.lineTo(p.x - 7, p.y);
        ctx.moveTo(p.x, p.y + 7); ctx.lineTo(p.x, F.y + F.h);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
    }
    if (!introDone && onCount) onCount(landed, pts.length);
  }

  let animMorph = false, scanStart = 0, idleTimer = 0;

  function loop() {
    running = false;
    if (!visible) return;
    const now = performance.now() / 1000;
    if (!introDone && introStart >= 0 && now - introStart > LEAD + SWEEP + LAND) {
      introDone = true;
      if (onCount) onCount(pts.length, pts.length);
      if (onIntroDone) onIntroDone();
      lastScan = now;
    }
    if (scanT >= 0) {
      scanT = (now - scanStart) / 2.2;
      if (scanT > 1) { scanT = -1; lastScan = now; }
    }
    draw(now);
    const busy = !introDone || scanT >= 0 || animMorph;
    animMorph = false;
    if (busy) { running = true; requestAnimationFrame(loop); return; }
    // Idle: start a slow rescan after a few seconds. This keeps the plot alive.
    if (introDone && !reduce) {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (visible && morph < 0.02 && scanT < 0) { scanStart = performance.now() / 1000; scanT = 0; kick(); }
      }, 6500);
    }
  }

  function kick() {
    if (!running && visible) { running = true; requestAnimationFrame(loop); }
  }

  // Pointer: show the nearest typeface.
  function nearest(mx, my) {
    let best = null, bd = 14 * 14;
    for (const p of pts) {
      const dx = p.x - mx, dy = p.y - my, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
  function showTip(p, mx, my) {
    if (!p) { tip.classList.remove('on'); return; }
    const ratio = p.ratio.toFixed(2);
    tip.innerHTML = `<div class="tn">${p.fam}${p.italic ? ' Italic' : ''}</div>
      <div class="tm">${cats[p.cat]}<br>Cap <b>${p.cap}</b> · x <b>${p.xh}</b> · Stem <b>${p.stem}</b><br>x / cap <b>${ratio}</b></div>`;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = mx + 18, y = my - th - 14;
    if (x + tw > W - 12) x = mx - tw - 18;
    if (y < 60) y = my + 18;
    tip.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    tip.classList.add('on');
  }
  function onMove(e) {
    if (!introDone) return;
    const r = section.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const p = nearest(mx, my);
    if (p !== hover) { hover = p; draw(performance.now() / 1000); }
    showTip(p, mx, my);
  }
  section.addEventListener('pointermove', onMove);
  section.addEventListener('pointerdown', onMove);
  section.addEventListener('pointerleave', () => { hover = null; showTip(null); draw(performance.now() / 1000); });

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }, { threshold: 0 });
  io.observe(section);

  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });

  layout();

  return {
    counts,
    total: pts.length,
    medRatio,
    medStem,
    colGeo: () => colGeo,
    start() {
      if (reduce) { introDone = true; draw(0); if (onCount) onCount(pts.length, pts.length); if (onIntroDone) onIntroDone(); return; }
      introStart = performance.now() / 1000;
      kick();
    },
    setMorph(m) {
      morph = m;
      animMorph = true;
      if (hover) { hover = null; showTip(null); }
      if (!running) draw(performance.now() / 1000);
      kick();
    },
    relayout: layout,
  };
}
