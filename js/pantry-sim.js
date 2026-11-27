// Disco Pantry: a model of the pantry LEDs, drawn on a canvas.
//
// The geometry, the LED route and the guide-light math are copies of the real app
// (~/disco-pantry/src/lib/lightshow.ts and docs/hardware.md). The disco effects are
// simple copies of four WLED effects. The item search is a short word list: the real
// tablet asks an AI model.

/* ---------------- The pantry ---------------- */

// Seen from the door: x goes to the right, y goes up, z goes into the pantry (meters).
const SIDE = 0.91; // The left and the right shelves (36 in).
const BACK = 2.54; // The back shelf (100 in).
const SHELF_DEPTH = 0.4;
const SHELF1_Y = 0.35;
const SHELF_GAP = 0.38;
const LEVELS = 5; // Wire shelves on each wall.
const LIT_LEVELS = 4; // Shelves 1 to 4 have LEDs.
const JUMP = 4; // LEDs that go up to the next shelf, at the door end of a side wall.

const WALLS = [
  { id: 'left', name: 'Left wall', n: 9, a: [0, 0], b: [0, SIDE], back: [-1, 0] },
  { id: 'back', name: 'Back wall', n: 25, a: [0, SIDE], b: [BACK, SIDE], back: [0, 1] },
  { id: 'right', name: 'Right wall', n: 9, a: [BACK, SIDE], b: [BACK, 0], back: [1, 0] },
];

export const shelfY = (level) => (level <= 0 ? 0 : SHELF1_Y + (level - 1) * SHELF_GAP);

const lerp = (a, b, t) => a + (b - a) * t;
const onWall = (w, t, y) => ({ x: lerp(w.a[0], w.b[0], t), y, z: lerp(w.a[1], w.b[1], t) });

// The LED string: shelf 1 goes left, back, right. Then the string goes up at the door
// end and comes back on shelf 2, and so on. 4 × 43 shelf LEDs + 3 × 4 jump LEDs = 184.
function buildLeds() {
  const leds = [];
  for (let level = 1; level <= LIT_LEVELS; level++) {
    const row = [];
    const fwd = level % 2 === 1;
    for (const w of fwd ? WALLS : [...WALLS].reverse()) {
      for (let j = 0; j < w.n; j++) {
        const k = fwd ? j : w.n - 1 - j;
        const t = (k + 0.5) / w.n;
        row.push({ ...onWall(w, t, shelfY(level)), wall: w.id, level, t });
      }
    }
    if (leds.length) {
      const a = leds[leds.length - 1], b = row[0];
      for (let j = 1; j <= JUMP; j++) {
        const t = j / (JUMP + 1);
        leds.push({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t), wall: null, level: 0, t: 0 });
      }
    }
    leds.push(...row);
  }
  return leds;
}

export const LEDS = buildLeds();
export const LED_COUNT = LEDS.length;

// The three walls unfolded into one line (meters from the door end of the left wall).
// A jump LED gets the position between the LEDs next to it.
export const FLAT = (() => {
  const start = { left: 0, back: SIDE, right: SIDE + BACK };
  const len = { left: SIDE, back: BACK, right: SIDE };
  const out = LEDS.map((p) => (p.wall ? { u: start[p.wall] + p.t * len[p.wall], y: p.y } : null));
  out.forEach((q, i) => {
    if (q) return;
    let a = i - 1, b = i + 1;
    while (!out[a]) a--;
    while (!LEDS[b].wall) b++;
    const t = (i - a) / (b - a), A = out[a], B = { u: start[LEDS[b].wall] + LEDS[b].t * len[LEDS[b].wall], y: LEDS[b].y };
    out[i] = { u: lerp(A.u, B.u, t), y: lerp(A.y, B.y, t) };
  });
  return out;
})();
export const FLAT_LENGTH = SIDE + BACK + SIDE;
export const WALL_INFO = WALLS.map((w) => ({ id: w.id, name: w.name, n: w.n, len: w.id === 'back' ? BACK : SIDE }));

// The zones of the pantry (config/zones.draft.json in the app). Level 0 is the floor.
// Shelf 5 and the floor have no LEDs: their zones light the nearest lit shelf.
export const ZONES = [
  ['left-5', 'left', 5, 0, 1, 'Baking, spices, boxed pasta'],
  ['left-4', 'left', 4, 0, 1, 'Jars: olives, salsa, sauces'],
  ['left-3', 'left', 3, 0, 1, 'Seasonings and jars'],
  ['left-2', 'left', 2, 0, 1, 'Peanut butter and spreads'],
  ['left-1', 'left', 1, 0, 1, 'Bulk jars and canned extras'],
  ['back-4-cereal', 'back', 4, 0, 0.3, 'Cereal'],
  ['back-4-coffee', 'back', 4, 0.3, 0.5, 'Coffee'],
  ['back-4-broth', 'back', 4, 0.5, 0.75, 'Stuffing, bone broth, protein powder'],
  ['back-4-wrap', 'back', 4, 0.75, 1, 'Foil, parchment, wraps'],
  ['back-3-pasta', 'back', 3, 0, 0.25, 'Dry pasta and rice'],
  ['back-3-crumbs', 'back', 3, 0.25, 0.5, 'Bread crumbs and crackers'],
  ['back-3-beans', 'back', 3, 0.5, 0.6, 'Dry beans'],
  ['back-3-bread', 'back', 3, 0.6, 0.85, 'Bread, buns, tortillas'],
  ['back-2-bars', 'back', 2, 0, 0.2, 'Granola bars'],
  ['back-2-snacks', 'back', 2, 0.2, 0.45, 'Goldfish and graham crumbs'],
  ['back-2-bread', 'back', 2, 0.45, 0.6, 'Sandwich bread'],
  ['back-2-crack', 'back', 2, 0.6, 0.7, 'Club crackers'],
  ['back-2-broth', 'back', 2, 0.7, 0.85, 'Broth cartons'],
  ['back-2-cookie', 'back', 2, 0.85, 1, 'Wheat Thins and cookies'],
  ['back-1-cans', 'back', 1, 0, 0.3, 'Beans and pie filling cans'],
  ['back-1-chips', 'back', 1, 0.3, 0.6, 'Chips'],
  ['back-1-cheese', 'back', 1, 0.6, 1, 'Cracker snack packs'],
  ['back-0-soup', 'back', 0, 0, 0.4, 'Can rack: soups and vegetables'],
  ['back-0-water', 'back', 0, 0.4, 0.6, 'Water bottles'],
  ['back-0-cans2', 'back', 0, 0.6, 1, 'Can rack: tomato soup and sauce'],
  ['right-3-jars', 'right', 3, 0, 1, 'Pasta sauce and Alfredo jars'],
  ['right-2', 'right', 2, 0, 1, 'Slow cooker and dry beans'],
  ['right-1', 'right', 1, 0, 1, 'Drinks and energy shots'],
  ['right-0', 'right', 0, 0, 1, 'Paper goods'],
].map(([id, wall, level, s0, s1, name]) => ({ id, wall, level, span: [s0, s1], name }));
export const zoneById = (id) => ZONES.find((z) => z.id === id);

// The default light colors of the app (src/lib/wled.ts).
export const COLORS = { shelf: [0, 255, 70], floor: [255, 0, 170], above: [255, 140, 0], guide: [255, 0, 0] };

/** Where the kid looks, and the light that tells it. */
export function describeZone(z) {
  const wall = WALLS.find((w) => w.id === z.wall).name;
  if (z.level === 0) return { where: `${wall} · floor`, hint: 'Look on the floor, below the light.', color: COLORS.floor, style: 'breathe' };
  if (z.level > LIT_LEVELS) return { where: `${wall} · shelf ${z.level}`, hint: 'Look above the light.', color: COLORS.above, style: 'breathe' };
  return { where: `${wall} · shelf ${z.level}`, hint: 'The item goes on the lit shelf.', color: COLORS.shelf, style: 'blink' };
}

/** The LED indexes [first, last] that light a zone. */
export function zoneRange(z) {
  const level = Math.min(LIT_LEVELS, Math.max(1, z.level));
  const ids = [];
  LEDS.forEach((p, i) => { if (p.wall === z.wall && p.level === level && p.t >= z.span[0] && p.t <= z.span[1]) ids.push(i); });
  return [Math.min(...ids), Math.max(...ids)];
}

/* ---------------- The guide lights (a copy of lightshow.ts) ---------------- */

export const GUIDE = { max: 0.6, floor: 0.22, falloffM: 0.5, base: 0.25, waveM: 0.8, periodS: 1.2, revealMps: 5, collapseMs: 900, zoneFadeMs: 500 };

function zoneLevel(style, ts) {
  if (style === 'breathe') return 0.25 + 0.75 * (0.5 + 0.5 * Math.cos((2 * Math.PI * ts) / 2));
  return 0.35 + 0.65 * (0.5 + 0.5 * Math.cos((2 * Math.PI * ts) / GUIDE.periodS));
}
export function guideLevel(d, ts) {
  const glow = GUIDE.floor + (1 - GUIDE.floor) * Math.exp(-d / GUIDE.falloffM);
  const wave = 0.5 + 0.5 * Math.cos(2 * Math.PI * (d / GUIDE.waveM + ts / GUIDE.periodS));
  return GUIDE.max * glow * (GUIDE.base + (1 - GUIDE.base) * wave * wave);
}
function soft(x, width = 0.25) {
  const t = Math.max(0, Math.min(1, x / width + 0.5));
  return t * t * (3 - 2 * t);
}

/** A light show for one zone. render(t, endT) gives 3 values (0 to 1) for each LED, or null at the end. */
export function guideShow(z) {
  const [lo, hi] = zoneRange(z);
  const { color, style } = describeZone(z);
  const dist = LEDS.map((p) => {
    let best = Infinity;
    for (let k = lo; k <= hi; k++) best = Math.min(best, Math.hypot(p.x - LEDS[k].x, p.y - LEDS[k].y, p.z - LEDS[k].z));
    return best;
  });
  const far = Math.max(...dist);
  const zc = color.map((c) => c / 255), gc = COLORS.guide.map((c) => c / 255);
  return {
    // The real ripples are dim on purpose. A screen needs more light to show them.
    gain: 1.8,
    render(t, endT) {
      const s = endT === null ? -1 : t - endT;
      if (s >= GUIDE.collapseMs + GUIDE.zoneFadeMs) return null;
      const ts = t / 1000;
      const reveal = GUIDE.revealMps * ts;
      const reach = s < 0 ? Infinity : (far + 0.3) * (1 - Math.min(1, s / GUIDE.collapseMs)) - 0.15;
      const zoneFade = s < GUIDE.collapseMs ? 1 : 1 - (s - GUIDE.collapseMs) / GUIDE.zoneFadeMs;
      const zl = zoneLevel(style, ts) * Math.max(0, zoneFade);
      const out = new Float32Array(LED_COUNT * 3);
      for (let k = 0; k < LED_COUNT; k++) {
        const c = k >= lo && k <= hi ? zc : gc;
        const level = k >= lo && k <= hi ? zl
          : guideLevel(dist[k], ts) * soft(reveal - dist[k]) * (reach === Infinity ? 1 : soft(reach - dist[k]));
        out[k * 3] = c[0] * level; out[k * 3 + 1] = c[1] * level; out[k * 3 + 2] = c[2] * level;
      }
      return out;
    },
  };
}

/* ---------------- The disco (simple copies of four WLED effects) ---------------- */

export const DISCO_BPM = 124;
export const DISCO_MS = 30000;
const BAR2_MS = (8 * 60000) / DISCO_BPM; // The effect changes each 2 bars.

function hsv(h, s, v) {
  const f = (n) => { const k = (n + h * 6) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [f(5), f(3), f(1)];
}
const rand = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

export const DISCO_LOOKS = [
  // Bpm: a rainbow that moves, brighter on each beat.
  { name: 'Bpm', fn: (i, ts, beat) => hsv((i / 46 + ts * 0.15) % 1, 1, 0.3 + 0.55 * Math.exp(-3 * beat)) },
  // Theater Rainbow: each third LED, moving along the string.
  { name: 'Theater Rainbow', fn: (i, ts) => ((i + Math.floor(ts * 8)) % 3 === 0 ? hsv((i / LED_COUNT + ts * 0.1) % 1, 1, 0.85) : [0, 0, 0]) },
  // Popcorn: LEDs pop up and fade.
  { name: 'Popcorn', fn: (i, ts) => { const slot = Math.floor(ts * 3), age = ts * 3 - slot; return rand(i, slot) > 0.86 ? hsv(rand(slot, i), 0.9, 0.9 * (1 - age)) : [0, 0, 0]; } },
  // Gravcenter: a bar grows from the middle of the string with the beat.
  { name: 'Gravcenter', fn: (i, ts, beat) => { const r = (1 - beat) * 0.5, d = Math.abs(i / LED_COUNT - 0.5); return d < r ? hsv((0.55 + d * 1.5) % 1, 1, 0.9 * (1 - d / r)) : [0, 0, 0]; } },
];

export function discoShow() {
  return {
    look: (t) => DISCO_LOOKS[Math.floor(t / BAR2_MS) % DISCO_LOOKS.length],
    render(t, endT) {
      if (t >= DISCO_MS || (endT !== null && t - endT > 600)) return null;
      const ts = t / 1000, beat = (ts * DISCO_BPM / 60) % 1;
      const fade = Math.min(1, t / 400, (DISCO_MS - t) / 600, endT === null ? 1 : 1 - (t - endT) / 600);
      const fn = this.look(t).fn;
      const out = new Float32Array(LED_COUNT * 3);
      for (let k = 0; k < LED_COUNT; k++) {
        const c = fn(k, ts, beat);
        out[k * 3] = c[0] * fade; out[k * 3 + 1] = c[1] * fade; out[k * 3 + 2] = c[2] * fade;
      }
      return out;
    },
  };
}

/* ---------------- Find a zone from words (the demo only) ---------------- */

// The real app asks an AI model and remembers each answer. This page has a short word list.
const WORDS = [
  ['back-2-snacks', 'goldfish graham'], ['back-4-cereal', 'cereal cheerios oatmeal oats'], ['back-4-coffee', 'coffee tea'],
  ['left-2', 'peanut butter nutella jelly jam spread honey'], ['back-0-cans2', 'tomato sauce paste'],
  ['back-0-soup', 'soup vegetables corn peas green beans'], ['back-1-chips', 'chips doritos pretzels popcorn party mix'],
  ['back-2-bread', 'sandwich bread loaf'], ['back-3-bread', 'buns tortillas bagels'], ['back-2-bars', 'granola bar bars'],
  ['back-3-pasta', 'pasta spaghetti macaroni noodles rice'], ['left-4', 'olives salsa pickles'],
  ['back-4-wrap', 'foil parchment plastic wrap ziploc bags'], ['back-3-beans', 'dry lentils'],
  ['back-2-crack', 'club ritz'], ['back-2-cookie', 'cookies oreos wheat thins'], ['back-2-broth', 'broth stock'],
  ['back-0-water', 'water bottles'], ['right-0', 'paper towels napkins plates cups'], ['right-3-jars', 'alfredo marinara ragu'],
  ['right-1', 'drinks juice soda energy gatorade'], ['left-5', 'flour sugar baking spices cake mix brownie'],
  ['back-1-cheese', 'cheez snack packs lunchables'], ['back-3-crumbs', 'crumbs crackers panko'],
  ['back-4-broth', 'protein powder stuffing'], ['left-3', 'seasoning salt pepper'], ['back-1-cans', 'pie filling baked'],
];
const PARTY = new Set(['disco', 'party']);
const FILLER = new Set(['hey', 'jarvis', 'lets', "let's", 'a', 'the', 'start', 'go', 'time', 'please', 'have']);

/** null = no match. { disco: true } = the dance party. { zone } = the zone of the item. */
export function findZone(text) {
  const words = text.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
  const rest = words.filter((w) => !FILLER.has(w));
  // A party word alone starts the party. "Party mix" is a snack.
  if (rest.length && rest.every((w) => PARTY.has(w))) return { disco: true };
  const stem = (w) => w.replace(/(es|s)$/, '');
  let best = null, score = 0;
  for (const [id, list] of WORDS) {
    const keys = list.split(' ');
    const s = rest.filter((w) => keys.some((k) => stem(k) === stem(w))).length;
    if (s > score) { best = id; score = s; }
  }
  return best ? { zone: zoneById(best) } : null;
}

/* ---------------- The canvas ---------------- */

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };

// The camera stands behind the door and looks into the pantry.
const EYE = [BACK / 2, 1.15, -2.3];
const AIM = [BACK / 2, 0.8, SIDE];
const F = norm(sub(AIM, EYE));
const R = norm(cross([0, 1, 0], F));
const U = cross(F, R);
const view = (p) => { const d = sub([p.x, p.y, p.z], EYE); return [dot(d, R), dot(d, U), dot(d, F)]; };

// The lines of the shelves, the posts and the walls, in meters.
function wireLines() {
  const lines = [];
  for (const w of WALLS) {
    const bk = (p) => ({ x: p.x + w.back[0] * SHELF_DEPTH, y: p.y, z: p.z + w.back[1] * SHELF_DEPTH });
    for (let level = 0; level <= LEVELS; level++) {
      const y = shelfY(level);
      const a = onWall(w, 0, y), b = onWall(w, 1, y);
      const lit = level >= 1 && level <= LIT_LEVELS;
      lines.push({ a, b, kind: lit ? 'edge' : 'faint' });
      lines.push({ a: bk(a), b: bk(b), kind: 'back' });
    }
    const top = shelfY(LEVELS) + 0.25;
    for (const t of [0, 1]) {
      const p = onWall(w, t, 0);
      lines.push({ a: p, b: { ...p, y: top }, kind: 'post' });
      lines.push({ a: bk(p), b: { ...bk(p), y: top }, kind: 'back' });
    }
  }
  return lines;
}
const LINES = wireLines();

/** The position of each LED in the view from the door, from 0 to 1 (x and y), and the aspect ratio. */
export function doorView() {
  const pts = LEDS.map((p) => { const v = view(p); return [v[0] / v[2], -v[1] / v[2]]; });
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { points: pts.map(([x, y]) => [(x - x0) / (x1 - x0), (y - y0) / (y1 - y0)]), aspect: (x1 - x0) / (y1 - y0) };
}

/**
 * Draw the pantry and its LEDs. The show gives the LED colors.
 * opts.reduce: draw still frames only. opts.onEnd: called when a show ends.
 */
export function createPantrySim(canvas, { reduce = false, onEnd = null, reserve = null } = {}) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, scale = 1, ox = 0, oy = 0;
  let show = null, t0 = 0, endT = null, raf = 0, visible = true, last = null;

  function fit() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Fit the projected pantry in the canvas.
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const l of LINES) for (const p of [l.a, l.b]) {
      const v = view(p), x = v[0] / v[2], y = -v[1] / v[2];
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    // reserve(): the width (px) at the right that a panel covers.
    const pad = Math.min(W, H) * 0.06, free = W - (reserve?.() || 0);
    scale = Math.max(1, Math.min((free - 2 * pad) / (x1 - x0), (H - 2 * pad) / (y1 - y0)));
    ox = free / 2 - ((x0 + x1) / 2) * scale; oy = H / 2 - ((y0 + y1) / 2) * scale;
  }
  const proj = (p) => { const v = view(p); return [ox + (v[0] / v[2]) * scale, oy - (v[1] / v[2]) * scale, v[2]]; };

  function draw(colors, gain = show?.gain || 1) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    const style = { edge: 'rgba(232,234,237,.24)', faint: 'rgba(232,234,237,.08)', back: 'rgba(232,234,237,.05)', post: 'rgba(232,234,237,.12)' };
    for (const l of LINES) {
      const a = proj(l.a), b = proj(l.b);
      ctx.strokeStyle = style[l.kind];
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    const unit = scale * 0.016;
    // Brighter LEDs get a larger glow. The sizes are for the eye, not to scale.
    const pts = LEDS.map(proj);
    // The LEDs that are off.
    ctx.fillStyle = '#3A4048';
    for (const [x, y, z] of pts) { ctx.beginPath(); ctx.arc(x, y, Math.max(1.2, (unit / z) * 0.8), 0, Math.PI * 2); ctx.fill(); }
    if (!colors) return;
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < LED_COUNT; k++) {
      const r = colors[k * 3], g = colors[k * 3 + 1], b = colors[k * 3 + 2];
      const m = Math.min(1, Math.max(r, g, b) * gain);
      if (m < 0.01) continue;
      const [x, y, z] = pts[k];
      const mx = Math.max(r, g, b);
      const c = `${Math.round((r / mx) * 255)},${Math.round((g / mx) * 255)},${Math.round((b / mx) * 255)}`;
      const rad = Math.max(3, (unit / z) * (3 + 11 * m));
      const grad = ctx.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0, `rgba(${c},${Math.min(1, m * 1.8)})`);
      grad.addColorStop(0.2, `rgba(${c},${Math.min(1, m * 1.1)})`);
      grad.addColorStop(0.45, `rgba(${c},${m * 0.3})`);
      grad.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
      // A white core on the bright LEDs.
      if (m > 0.25) {
        ctx.fillStyle = `rgba(255,255,255,${Math.min(0.9, (m - 0.25) * 1.3)})`;
        ctx.beginPath(); ctx.arc(x, y, Math.max(1, (unit / z) * 0.7), 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function frame(now) {
    raf = 0;
    if (!show) { draw(null); return; }
    // The frame time can be a little before the start of the show.
    const t = Math.max(0, now - t0);
    const colors = show.render(t, endT);
    if (!colors) { show = null; endT = null; last = null; draw(null); onEnd?.(); return; }
    last = colors;
    draw(colors);
    if (visible && !reduce) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };

  function play(s, stillAt = 1800) {
    show = s; endT = null;
    if (reduce) { last = s.render(stillAt, null); draw(last); return; }
    t0 = performance.now(); kick();
  }

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) (reduce ? draw(last) : kick()); });
  io.observe(canvas);
  const ro = new ResizeObserver(() => { fit(); draw(last); });
  ro.observe(canvas);
  fit(); draw(null);

  return {
    /** Light one zone, with the guide ripples. */
    guide(z) { play(guideShow(z)); },
    disco() { play(discoShow(), 2000); },
    /** Start the end animation (the red goes into the zone, then the zone fades). */
    end() { if (show && !reduce) endT = performance.now() - t0; else { show = null; last = null; draw(null); } },
    /** Milliseconds since the show started. */
    time() { return show ? performance.now() - t0 : 0; },
    get show() { return show; },
    stop() { show = null; last = null; draw(null); },
    destroy() { io.disconnect(); ro.disconnect(); cancelAnimationFrame(raf); },
  };
}
