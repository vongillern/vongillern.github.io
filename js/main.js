// The homepage (the "Instrument" design). All content comes from content/site.js.
//
// Two modes:
// - Build: tools/prerender.py opens index.template.html?prerender. The page writes
//   only the markup, and the tool saves it as index.html.
// - Visit: index.html has data-prerendered. The page skips the markup step and
//   only adds the motion and the demos. index.template.html renders everything.
import { site, asset } from '../content/site.js';
import { createHero, AXES } from './hero.js';
import { roomScan, igorDemo, pioneerDemo, rndTerminal, airplaneCells } from './demos.js';

const { gsap, ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin, TextPlugin } = window;
gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin, TextPlugin);

const ROOT = document.documentElement;
const PRERENDER = new URLSearchParams(location.search).has('prerender');
const PRE = ROOT.hasAttribute('data-prerendered');
// The inline script in <head> removes the "js" class if this module is too late.
// In that case the content already shows, so do not hide it again.
const LATE = window.__jsFailsafe === true;
if (PRERENDER) ROOT.classList.remove('js');
else if (!LATE) ROOT.classList.add('js');
window.__booted = true;
const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches || LATE;
const HOVER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad2 = (n) => String(n).padStart(2, '0');
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const fmtInt = (n) => n.toLocaleString('en-US');

// A short, stable hex id from a string (FNV-1a). It looks like a commit hash.
function hash7(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  let h2 = h ^ 0x5bd1e995;
  for (let i = s.length - 1; i >= 0; i--) { h2 ^= s.charCodeAt(i); h2 = Math.imul(h2, 0x01000193); }
  return ((h >>> 0).toString(16) + (h2 >>> 0).toString(16)).padStart(14, '0').slice(0, 7);
}

const rule = () => '<div class="rule" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>';
const secHead = (a, b, c) => `${rule()}<div class="sec-head"><span class="label sh">${a}</span><span class="label sh">${b}</span><span class="label">${c}</span></div>`;

// Smaller copies made by the build tools:
// images 1000 px or wider have name-800.webp; images wider than 1400 px also have name-1200.webp.
const sized = (src, w) => src.replace(/\.webp$/, `-${w}.webp`);
function srcset(m, sizes) {
  // Tall phone screenshots have a 400 px copy.
  if (m.h > m.w && m.w >= 700 && /\.webp$/.test(m.src)) return ` srcset="${asset(sized(m.src, 400))} 400w, ${asset(m.src)} ${m.w}w" sizes="${sizes}"`;
  if (!(m.w >= 1000 && /\.webp$/.test(m.src))) return '';
  const set = [`${asset(sized(m.src, 800))} 800w`];
  if (m.w > 1400) set.push(`${asset(sized(m.src, 1200))} 1200w`);
  set.push(`${asset(m.src)} ${m.w}w`);
  return ` srcset="${set.join(', ')}" sizes="${sizes}"`;
}
// A poster of a video 900 px or wider is 1000 px or wider, so it has an 800 px copy.
const posterSrc = (m) => (m.w >= 900 ? sized(m.poster, 800) : m.poster);

function media(m, { eager = false, cls = '', loop = true, sizes = '(max-width: 899px) 100vw, 60vw' } = {}) {
  if (!m) return '';
  if (m.type === 'video') {
    return `<video class="${cls}" muted playsinline ${loop ? 'loop' : ''} preload="none" poster="${asset(posterSrc(m))}" width="${m.w}" height="${m.h}" aria-label="${esc(m.alt)}" data-autoplay><source src="${asset(m.src)}" type="video/mp4"></video>`;
  }
  return `<img class="${cls}" src="${asset(m.src)}"${srcset(m, sizes)} width="${m.w}" height="${m.h}" alt="${esc(m.alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;
}
function phone(m, extra = '') {
  return `<div class="phone ${extra}"><div class="scr">${media(m, { sizes: '(max-width: 899px) 30vw, 180px' })}</div><span class="isl" aria-hidden="true"></span></div>`;
}

/* ---------------- HUD and clock ---------------- */
const tzName = (() => {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: site.person.timezone, timeZoneName: 'short' })
      .formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value || 'CT';
  } catch { return 'CT'; }
})();
const clockFmt = new Intl.DateTimeFormat('en-GB', { timeZone: site.person.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

function renderHud() {
  const city = site.person.location.split(',')[0];
  $('#hud').innerHTML = `<div class="container">
    <a class="hud-brand" href="#top" aria-label="${esc(site.person.name)}, back to top">${esc(site.person.name)}</a>
    <div class="hud-center label"><span>${esc(site.person.coords)}</span><span>·</span><span>${esc(city)}</span><span>·</span><time class="clock num">--:--:--</time><span class="tz">CT</span></div>
    <nav class="hud-nav label" aria-label="Sections">
      <a href="#work" data-nav="work">Work</a><a href="#rnd" data-nav="rnd">R&amp;D</a><a href="#field" data-nav="field">Field</a><a href="#log" data-nav="log">Log</a><a href="#contact" data-nav="contact">Contact</a>
    </nav>
    <div class="hud-status label"><span class="pulse" aria-hidden="true"></span><span class="st-text">${esc(site.person.status)}</span><time class="clock-m num"></time></div>
  </div><span class="hud-prog" aria-hidden="true"><i></i></span>`;
}

function initHud() {
  $$('.tz').forEach((e) => (e.textContent = tzName));
  const tick = () => {
    const s = clockFmt.format(new Date());
    $$('.clock').forEach((e) => (e.textContent = s));
    $$('.clock-m').forEach((e) => (e.textContent = `${s.slice(0, 5)} ${tzName}`));
    $$('.clock-c').forEach((e) => (e.textContent = `${s} ${tzName}`));
  };
  tick();
  setInterval(tick, 1000);
}

/* ---------------- Hero ---------------- */
function renderHeroCopy() {
  const p = site.person;
  $('.hero-copy').innerHTML = `
    <p class="eyebrow label">${esc(p.name)} <span style="color:var(--dim)">—</span> ${p.roles.map(esc).join(' · ')}</p>
    <h1 class="display" id="hero-title"><span class="dl">Hard problems,</span><br><span class="dl ac">measured.</span></h1>
    <div class="hero-side">
      <p class="intro">${esc(site.hero.intro)}</p>
      <p class="cap label"><span class="cap-a">Each point is a typeface, measured from its outlines.</span><span class="cap-b">The same typefaces, grouped by category.</span></p>
    </div>`;
  // Axes and ticks of the scatter.
  const [r0, r1] = AXES.RX, [s0, s1] = AXES.SY;
  let h = '';
  for (let v = r0; v <= r1 + 1e-6; v += 0.1) {
    const l = ((v - r0) / (r1 - r0)) * 100;
    h += `<span class="gl-x" style="left:${l}%"></span><span class="tk tk-x" style="left:${l}%">${v.toFixed(1)}</span>`;
  }
  for (let v = s0; v <= s1; v += 80) {
    const b = ((v - s0) / (s1 - s0)) * 100;
    h += `<span class="gl-y" style="bottom:${b}%"></span><span class="tk tk-y" style="bottom:${b}%;transform:translate(-100%,50%)">${v}</span>`;
  }
  h += '<span class="ax-t ax-tx">x-height ÷ cap height →</span><span class="ax-t ax-ty">↑ stem width, per 1,000 em</span>';
  h += '<span class="crn tl"></span><span class="crn tr"></span><span class="crn br"></span>';
  $('.plot-frame').innerHTML = `<div class="axes">${h}</div><div class="cats"></div>`;
}

function renderPlotHead(counts, total, cats) {
  const COLORS = ['#C9CED6', '#4DE1FF', '#C8FF4D', '#FFB547', '#FFFFFF', '#6B717A'];
  $('.plot-head').innerHTML = `
    <span class="label fig">Fig. 00 · Fontdex · N = <b class="num n-count">0</b></span>
    <span class="label legend">${cats.map((c, i) => `<span><i style="background:${COLORS[i]}"></i>${esc(c)} <b class="num">${fmtInt(counts[i])}</b></span>`).join('')}</span>`;
}

/* ---------------- Readouts ---------------- */
function meterFor(stat) {
  const v = stat.value;
  const nums = (s) => (s.match(/\d[\d,]*/g) || []).map((x) => parseInt(x.replace(/,/g, ''), 10));
  if (v.includes('%')) {
    const pct = nums(v)[0] || 0;
    return { from: 40, to: Math.max(1, Math.round(40 * (1 - pct / 100))) };
  }
  if (v.includes('→')) {
    const [l, r] = v.split('→');
    const ln = nums(l), rn = nums(r);
    const left = ln.length > 1 ? (ln[0] + ln[1]) / 2 : ln[0];
    const right = rn[0];
    if (right > left) return { from: Math.max(1, Math.round(40 * left / right)), to: 40, cyan: true };
    return { from: 40, to: Math.max(1, Math.round(40 * right / left)) };
  }
  const n = nums(v)[0] || 0;
  if (n <= 40) return { from: 0, to: n };
  return { from: 0, to: 40, cyan: true };
}

function renderReadouts() {
  const head = site.hero.headlines[0];
  const stmt = esc(head).replace(/(unsolvable)/, '<span class="ac">$1</span>');
  $('#readouts').innerHTML = `<div class="container">
    ${secHead('Sec 01', 'Readouts', `${pad2(site.stats.length)} values · since ${site.person.since}`)}
    <div class="st-row">
      <h2 class="statement">${stmt}</h2>
      <div class="st-note"><p>${esc(site.hero.short)}</p><div class="doms">${site.domains.map((d) => `<span>${esc(d)}</span>`).join('')}</div></div>
    </div>
    <div class="ro-grid">
      ${site.stats.map((s, i) => {
        const m = meterFor(s);
        return `<div class="ro" data-from="${m.from}" data-to="${m.to}" ${m.cyan ? 'data-cyan' : ''}>
          <div class="ro-top"><span class="label">R-${pad2(i + 1)}</span><span class="label">${m.from > m.to ? 'Δ down' : m.from > 0 ? 'Δ up' : 'Count'}</span></div>
          <div class="ro-val" data-value="${esc(s.value)}">${esc(s.value).replace(/→/g, '<span class="ar">→</span>')}</div>
          <p class="ro-lab">${esc(s.label)}</p>
          <div class="ro-ticks" aria-hidden="true">${Array.from({ length: 40 }, (_, k) => (k < m.to ? `<i class="on${m.cyan ? ' c' : ''}"></i>` : '<i></i>')).join('')}</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

/* ---------------- Work modules ---------------- */
const LAYOUT = {
  roomscale: { span: 7, h: 640, ar: '3 / 2' },
  finityforge: { span: 5, h: 640, ar: '4 / 3.4', screen: true },
  skyline: { span: 7, h: 520, ar: '16 / 9' },
  films: { span: 5, h: 520, ar: '16 / 9' },
  reduction: { span: 4, h: 620, ar: '1 / 0.95' },
  airplane: { span: 5, h: 620, ar: '3 / 3.3' },
  sermons: { span: 3, h: 620, ar: '1 / 1' },
};

// The sizes value for an image that fills a work module.
const modSizes = (w) => `(max-width: 899px) 100vw, ${Math.round(((LAYOUT[w.id]?.span || 6) / 12) * 96)}vw`;

function previewFor(w) {
  // The scan demo replaces this first stage at runtime. Without JS, the photo stays.
  if (w.id === 'roomscale' && w.stages?.length) {
    const s = w.stages[0];
    return `<img class="rs-layer" src="${asset(s.src)}"${srcset({ ...s, w: 1500 }, '(max-width: 899px) 100vw, 58vw')} width="1500" height="1001" alt="${esc(s.label)}: ${esc(s.note)}" loading="lazy" decoding="async">`;
  }
  const phones = w.media.filter((m) => m.device === 'phone');
  if (phones.length) {
    const met = w.metrics[0];
    const count = parseInt(met?.value, 10) || 0;
    return `<div class="air">
      <div class="air-band">
        <div class="air-big num"><span class="k">${pad2(count)}</span><span class="sl"> / </span>${pad2(count)}</div>
        <div class="air-side">
          <div class="air-net label"><span class="dot"></span><span class="t">${esc(met?.label || '')}</span></div>
          <div class="air-cells">${Array.from({ length: count }, (_, i) => `<i>${pad2(i + 1)}</i>`).join('')}</div>
        </div>
      </div>
      <div class="phones">${phones.slice(0, 3).map((m, i) => phone(m, i === 2 ? 'p3' : '')).join('')}</div>
    </div>`;
  }
  if (!w.media.length) {
    const m = w.metrics[0];
    return `<div class="typo"><span class="label">${esc(w.kind)}</span><div class="big num">${esc(m?.value || w.name)}</div><span class="label">${esc(m?.label || '')}</span></div>`;
  }
  const vids = w.media.filter((m) => m.type === 'video' && m.device !== 'phone');
  if (w.id === 'films' && vids.length > 1) {
    return `${media(vids[0], { loop: false, cls: 'reel' })}<div class="ov ov-tl"><span class="chip reel-chip"><i></i><span>Reel 01 / ${pad2(vids.length)}</span></span></div>
      <div class="ov ov-bl"><span class="note-line reel-note">${esc(vids[0].alt)}</span></div>`;
  }
  const lead = vids[0] || w.media[0];
  if (lead.type === 'video' && LAYOUT[w.id]?.screen) {
    const [m1, m2, m3] = w.metrics;
    const chip = (m) => (m ? `<span class="label"><b>${esc(m.value)}</b> · ${esc(m.label)}</span>` : '');
    return `<div class="screen"><div class="band">${chip(m1)}<span class="chip"><i></i>Live</span></div><div class="vid">${media(lead)}</div><div class="band">${chip(m2)}${chip(m3)}</div></div>`;
  }
  if (lead.type === 'video') return media(lead);
  if (w.id === 'reduction') {
    const imgs = w.media.filter((m) => m.type === 'image').slice(0, 2);
    return `<div class="sheets">${imgs.map((m) => `<figure class="sheet">${media(m, { sizes: modSizes(w) })}</figure>`).join('')}</div>`;
  }
  return media(lead, { cls: 'kb', sizes: modSizes(w) });
}

function renderWork() {
  $('#work').innerHTML = `<div class="container">
    ${secHead('Sec 02', 'Work modules', `${pad2(site.work.length)} modules · ${site.work[0].year}`)}
    <div class="title-row"><h2 class="h2 rv">Selected work.</h2><p class="lede rv">Each module runs live. Open one for the problem, the insight and the result.</p></div>
    <div class="bento">
      ${site.work.map((w, i) => {
        const L = LAYOUT[w.id] || { span: 6, h: 480, ar: '16 / 10' };
        const met = w.metrics[0];
        return `<article class="mod mod--${w.id} rv" style="--span:${L.span};--h:${L.h}px;--ar:${L.ar}" data-id="${w.id}">
          <button class="mod-open" aria-label="Open details: ${esc(w.name)}"></button>
          <header class="mod-bar"><span class="label">M-${pad2(i + 1)}</span><span class="mod-name">${esc(w.name)}</span><span class="label kind">${esc(w.kind)}</span><span class="label">${esc(w.year)}</span><span class="mod-plus" aria-hidden="true"></span></header>
          <div class="mod-view">${previewFor(w)}</div>
          <footer class="mod-foot"><p class="mod-title">${esc(w.title)}</p>${met ? `<p class="mod-met"><span class="v num">${esc(met.value)}</span><span class="label">${esc(met.label)}</span></p>` : ''}</footer>
          <span class="crn4" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        </article>`;
      }).join('')}
    </div>
  </div>`;
}

function initWorkPreviews() {
  site.work.forEach((w) => {
    const mod = $(`.mod--${w.id}`);
    if (!mod) return;
    const view = $('.mod-view', mod);
    if (w.id === 'roomscale' && w.stages?.length) {
      const stages = w.stages.map((s) => ({ ...s, src: asset(s.src), srcset: `${asset(sized(s.src, 800))} 800w, ${asset(sized(s.src, 1200))} 1200w, ${asset(s.src)} 1500w` }));
      roomScan(view, stages, { reduce: REDUCE, hover: HOVER, alt: w.media[0]?.alt || w.title });
    }
    const air = $('.air', view);
    if (air) airplaneCells(air, { reduce: REDUCE });

    // Films: play the reels one after another.
    const reel = $('video.reel', view);
    if (reel) {
      const vids = w.media.filter((m) => m.type === 'video' && m.device !== 'phone');
      let k = 0;
      reel.addEventListener('ended', () => {
        k = (k + 1) % vids.length;
        reel.poster = asset(posterSrc(vids[k]));
        reel.src = asset(vids[k].src);
        reel.setAttribute('aria-label', vids[k].alt);
        $('.reel-chip span', view).textContent = `Reel ${pad2(k + 1)} / ${pad2(vids.length)}`;
        $('.reel-note', view).textContent = vids[k].alt;
        reel.play().catch(() => {});
      });
    }
    if (REDUCE) return;
    // Slow camera moves on still images.
    const kb = $('img.kb', view);
    if (kb) {
      const tw = gsap.fromTo(kb, { scale: 1.02, xPercent: -1 }, { scale: 1.1, xPercent: 1.5, duration: 14, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true });
      ScrollTrigger.create({ trigger: mod, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? tw.play() : tw.pause()) });
    }
    const pan = $('img.pan-x', view);
    if (pan) {
      let tw = null;
      const setup = () => {
        if (tw) tw.kill();
        const vw = view.clientWidth, iw = pan.getBoundingClientRect().width;
        const dist = Math.max(0, iw - vw);
        gsap.set(pan, { x: 0 });
        tw = gsap.to(pan, { x: -dist, duration: Math.max(8, dist / 40), ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true });
        ScrollTrigger.create({ trigger: mod, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? tw.play() : tw.pause()) });
      };
      if (pan.complete && pan.naturalWidth) setup(); else pan.addEventListener('load', setup, { once: true });
    }
  });
  $$('.mod-open').forEach((b) => b.addEventListener('click', () => openDrawer(b.closest('.mod').dataset.id, b)));
}

/* ---------------- Bench ---------------- */
function renderBench() {
  const list = site.builds;
  const first = list.find((b) => b.media);
  $('#bench').innerHTML = `<div class="container">
    ${secHead('Sec 03', 'Bench', `${pad2(list.length)} builds · ${list[0]?.year || ''}`)}
    <div class="title-row"><h2 class="h2 rv">On the bench.</h2><p class="lede rv">Smaller builds and experiments.</p></div>
    <div class="bench-wrap">
      <ol class="bench-list" role="list">
        ${list.map((b, i) => `<li class="bench-row rv ${b.media ? 'has-img' : ''}" data-i="${i}">
          <span class="label">B-${pad2(i + 1)}</span>
          <span class="bn">${esc(b.name)}</span>
          <span class="bt-wrap"><span class="bt">${esc(b.title)}</span><span class="bd">${esc(b.detail)}</span></span>
          <span class="label by">${esc(b.year)}</span>
          ${b.media ? `<img class="thumb" src="${asset(b.media.src)}"${srcset(b.media, '(max-width: 899px) 100vw, 160px')} width="${b.media.w}" height="${b.media.h}" alt="${esc(b.media.alt)}" loading="lazy" decoding="async">` : ''}
        </li>`).join('')}
      </ol>
      <aside class="bench-view" aria-hidden="true">
        <div class="bv-bar"><span class="label bv-name">${esc(first?.name || '')}</span><span class="label bv-i">B-${pad2(list.indexOf(first) + 1)}</span></div>
        <div class="bv-img">${list.map((b, i) => [b.media, b.media2].filter(Boolean).map((m, k) => `<img data-i="${i}" data-k="${k}" class="${b === first && k === 0 ? 'on' : ''}" src="${asset(m.src)}"${srcset(m, '40vw')} width="${m.w}" height="${m.h}" alt="" loading="lazy" decoding="async">`).join('')).join('')}</div>
        <p class="bv-cap">${esc(first?.media?.alt || '')}</p>
      </aside>
    </div>
  </div>`;
}

function initBench() {
  const list = site.builds;
  if (!HOVER) return;
  const lede = $('#bench .lede');
  if (lede) lede.textContent = `${lede.textContent} Point at a row to see it.`;
  const view = $('.bench-view'), imgs = $$('.bv-img img', view);
  let timer = 0;
  const show = (i) => {
    const b = list[i];
    if (!b.media) return;
    clearInterval(timer);
    const pics = imgs.filter((im) => +im.dataset.i === i);
    let k = 0;
    const set = () => {
      imgs.forEach((im) => im.classList.toggle('on', im === pics[k]));
      $('.bv-cap', view).textContent = (k === 0 ? b.media : b.media2).alt;
    };
    set();
    if (pics.length > 1) timer = setInterval(() => { k = (k + 1) % pics.length; set(); }, 1800);
    $('.bv-name', view).textContent = b.name;
    $('.bv-i', view).textContent = `B-${pad2(i + 1)}`;
  };
  $$('.bench-row').forEach((row) => {
    row.addEventListener('pointerenter', () => { $$('.bench-row').forEach((r) => r.classList.toggle('on', r === row)); show(+row.dataset.i); });
  });
}

/* ---------------- R&D ---------------- */
function statusClass(s) {
  const t = s.toLowerCase();
  if (t.includes('utility')) return 'u';
  if (t.includes('provisional')) return 'p';
  if (t.includes('acquired')) return 'a';
  return '';
}
function renderRnd() {
  const inv = site.inventions;
  const heo = inv.find((x) => x.id === 'humaneyesonly');
  const mono = site.experience.find((e) => e.org === 'Monotype');
  const patents = site.stats.find((s) => /patent/i.test(s.label));
  $('#rnd').innerHTML = `<div class="container">
    ${secHead('Sec 04', 'R&amp;D log', `${esc(mono?.org || '')} · ${esc(mono?.years || '')}`)}
    <div class="title-row"><h2 class="h2 rv">Type that reads differently to people and to machines.</h2>
      <p class="lede rv">${patents ? `${esc(patents.value)} ${esc(patents.label)} at ${esc(mono?.org || '')}. ` : ''}${esc(heo.name)} ${esc(heo.summary.split('. ').slice(-1)[0].replace(/^It /, ''))}</p></div>
    <div class="term rv">
      <div class="term-pane">
        <div class="term-head"><span class="label"><b>Rendered</b> · what a person sees</span><span class="label">Glyphs</span></div>
        <div class="term-row"><span class="label">${esc(heo.name)} · ${esc(heo.status)}</span><div class="term-human">${esc(heo.demo.see)}</div></div>
      </div>
      <div class="term-pane">
        <span class="term-arrow label" aria-hidden="true">Text layer →</span>
        <div class="term-head"><span class="label"><b>What a scraper reads</b></span><span class="label term-status">Idle</span></div>
        <div class="term-row"><span class="label">Copy and paste</span><div class="term-bot c" data-bot="${esc(heo.demo.bot)}" data-chars="ƐコϘおᆵグゆƨᄰɵっӊЖѮ">${esc(heo.demo.bot)}</div></div>
      </div>
    </div>
    <div class="rnd-grid">
      <ol class="rd-list" role="list">
        ${inv.map((x, i) => `<li class="rd rv">
          <span class="label id">RD-${pad2(i + 1)}</span>
          <div class="rd-top"><span class="rd-name">${esc(x.name)}</span><span class="st ${statusClass(x.status)}">${esc(x.status)}</span></div>
          <p class="rd-body"><strong>${esc(x.title)}</strong>${esc(x.summary)}</p>
        </li>`).join('')}
      </ol>
      ${heo.media ? `<figure class="heo rv">
        <div class="bar"><span class="label">${esc(heo.name)} · live</span><span class="label">${esc(heo.status)}</span></div>
        <div class="shot">${media(heo.media)}</div>
        <figcaption class="cap">${esc(heo.title)} ${heo.link ? `<a href="${esc(heo.link.href)}" target="_blank" rel="noopener">${esc(heo.link.label)} ↗</a>` : ''}</figcaption>
      </figure>` : ''}
    </div>
  </div>`;
}

function initRnd() {
  rndTerminal($('.term'), { reduce: REDUCE });
}

/* ---------------- Field ---------------- */
function renderField() {
  const S = Object.fromEntries(site.stories.map((s) => [s.id, s]));
  const ig = S.igor, pi = S.pioneer, wc = S.webcare;
  const role = (org) => site.experience.find((e) => e.org === org)?.role || '';
  $('#field').innerHTML = `<div class="container">
    ${secHead('Sec 05', 'Field work', `${esc(pi.years.split('–')[0])}–${esc(wc.years.split('–')[1])} · before Monotype`)}
    <div class="title-row"><h2 class="h2 rv">Problems from the field.</h2><p class="lede rv">Three older problems, drawn as instruments. The demos are illustrations of the method.</p></div>
    <div class="field-grid">
      <div class="panel p-igor rv">
        <div class="panel-bar"><span class="label"><b>${esc(ig.org)}</b> · ${esc(ig.years)}</span><span class="chip"><i></i>Illustration</span></div>
        <div class="igor-root">
          <div class="panel-body">
            <h3>${esc(ig.title)}</h3>
            <p class="s">${esc(ig.summary)}</p>
            <div class="igor-meta">
              <div><div class="bar-t label"><span>Webcam · blink codes</span><span class="t-w num">00:00 / 02:00</span></div><div class="meter w"><i></i></div></div>
              <div><div class="bar-t label"><span>Manual · MAC addresses</span><span class="t-m num">00:00 / 20–30 MIN</span></div><div class="meter m"><i></i></div></div>
            </div>
          </div>
        </div>
      </div>
      <div class="panel p-pioneer rv">
        <div class="panel-bar"><span class="label"><b>${esc(pi.org)}</b> · ${esc(pi.years)}</span><span class="label">1 cell = 1 MB</span></div>
        <canvas class="pio-canvas" aria-label="Illustration: 1,400 one-megabyte cells collapse into 30." role="img"></canvas>
        <div class="panel-body">
          <div class="pio-read"><span class="v num">1,400 MB</span><span class="d">${esc(pi.before)} → ${esc(pi.after)} · −97%</span></div>
          <h3>${esc(pi.title)}</h3>
          <p class="s">${esc(pi.summary)}</p>
        </div>
      </div>
      <div class="panel p-webcare rv">
        <div class="panel-bar"><span class="label"><b>${esc(wc.org)}</b> · ${esc(wc.years)}</span><span class="label">${esc(role(wc.org))}</span></div>
        <svg class="wc-svg" viewBox="0 0 600 150" role="img" aria-label="Patients: ${esc(wc.before)} at the start, ${esc(wc.after)} at the end.">
          <defs><pattern id="wc-g" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(232,234,237,.04)"/></pattern></defs>
          <rect width="600" height="150" fill="url(#wc-g)"/>
          <line x1="40" y1="122" x2="560" y2="122" stroke="#2F343B"/>
          <clipPath id="wc-clip"><rect class="wc-clip-r" x="0" y="0" width="600" height="150"/></clipPath>
          <path class="wc-line" d="M48 116 L552 30" fill="none" stroke="#4DE1FF" stroke-width="1.5" stroke-dasharray="4 5" clip-path="url(#wc-clip)"/>
          <rect x="44" y="112" width="8" height="8" fill="#4DE1FF"/>
          <rect class="wc-end" x="548" y="26" width="8" height="8" fill="#C8FF4D"/>
          <text x="58" y="106" fill="#E8EAED" font-family="Geist Mono, monospace" font-size="12">${esc(wc.before)}</text>
          <text x="58" y="140" fill="#767D87" font-family="Geist Mono, monospace" font-size="10" letter-spacing=".8">${esc(wc.years.split('–')[0])}</text>
          <text class="wc-endt" x="540" y="20" text-anchor="end" fill="#C8FF4D" font-family="Geist Mono, monospace" font-size="12">${esc(wc.after)}</text>
          <text x="552" y="140" text-anchor="end" fill="#767D87" font-family="Geist Mono, monospace" font-size="10" letter-spacing=".8">${esc(wc.years.split('–')[1])}</text>
        </svg>
        <div class="panel-body">
          <h3>${esc(wc.title)}</h3>
          <p class="s">${esc(wc.summary)}</p>
        </div>
      </div>
    </div>
  </div>`;
}

function initField() {
  const S = Object.fromEntries(site.stories.map((s) => [s.id, s]));
  const ig = S.igor;
  // Pioneer: the readout and text sit at the bottom of the panel.
  igorDemo($('.igor-root'), ig, { reduce: REDUCE });
  pioneerDemo($('.pio-canvas'), { v: $('.pio-read .v'), d: $('.pio-read .d') }, { reduce: REDUCE });
  if (!REDUCE) {
    // The markup shows the full line. Hide it, then draw it when it comes into view.
    gsap.set('.wc-clip-r', { attr: { width: 0 } });
    gsap.to('.wc-clip-r', { attr: { width: 600 }, duration: 1.6, ease: 'power2.inOut', scrollTrigger: { trigger: '.wc-svg', start: 'top 90%' } });
    gsap.from(['.wc-end', '.wc-endt'], { opacity: 0, duration: 0.4, delay: 1.4, scrollTrigger: { trigger: '.wc-svg', start: 'top 90%' } });
  }
}

/* ---------------- Archive ---------------- */
function renderArchive() {
  const items = site.archive;
  const yrs = items.map((a) => parseInt(String(a.year).replace(/\D/g, ''), 10)).filter(Boolean);
  const abLabel = (a, k) => (a.id === 'regexpixie' ? (k ? '2026' : '2012') : k ? '02' : '01');
  $('#archive').innerHTML = `<div class="container">
    ${secHead('Sec 06', 'Archive', `Shipped before · ${Math.min(...yrs)}–${Math.max(...yrs)}`)}
    <div class="title-row"><h2 class="h2 rv">Shipped before.</h2><p class="lede rv">Earlier products. The old screenshots come from the Wayback Machine.</p></div>
    <div class="arch-grid">
      ${items.map((a) => {
        let view = '';
        if (a.media) {
          view = `<div class="arc-view">${media(a.media, { cls: 'a' })}${a.media2 ? media(a.media2, { cls: 'b' }) : ''}
            ${a.media2 ? `<div class="ab" role="group" aria-label="Switch view"><button type="button" aria-pressed="true" data-k="0">${abLabel(a, 0)}</button><button type="button" aria-pressed="false" data-k="1">${abLabel(a, 1)}</button></div>` : ''}</div>`;
        } else {
          view = `<div class="arc-view"><div class="staging-typo">
            <svg viewBox="0 0 300 170" aria-hidden="true">
              <g fill="none" stroke="#4DE1FF" stroke-width="1">
                <path class="sg" d="M150 30 V120"/><path class="sg" d="M150 120 L20 160"/><path class="sg" d="M150 120 L280 160"/>
                <path class="sg" d="M150 30 L20 6"/><path class="sg" d="M150 30 L280 6"/>
              </g>
              <g stroke="#2F343B" stroke-width="1"><path d="M60 148 L150 120 L240 148" fill="none"/><path d="M100 136 L150 120 L200 136" fill="none"/></g>
              <g font-family="Geist Mono, monospace" font-size="9" fill="#C8FF4D" letter-spacing=".6"><text x="158" y="78">CEILING HEIGHT</text><text x="158" y="90" fill="#8A9099">8 FT OR 9 FT</text></g>
              <path d="M146 30 H154 M146 120 H154" stroke="#C8FF4D"/>
            </svg>
            <span class="label">One orthogonal corner. One known height. <a href="#work">See Room Scale ↑</a></span>
          </div></div>`;
        }
        return `<article class="arc a-${a.id} rv">
          <div class="arc-bar"><span class="mod-name">${esc(a.name)}</span><span class="yr">${esc(a.year)}</span></div>
          ${view}
          <div class="arc-body"><h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p></div>
        </article>`;
      }).join('')}
    </div>
  </div>`;
}

function initArchive() {
  $$('.arc-view').forEach((v) => {
    const btns = $$('.ab button', v);
    if (!btns.length) return;
    let k = 0, auto = 0;
    const set = (n) => {
      k = n;
      v.classList.toggle('alt', k === 1);
      btns.forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.k === k)));
      const vid = $(k ? '.b' : '.a', v);
      if (vid && vid.tagName === 'VIDEO') vid.play().catch(() => {});
    };
    btns.forEach((b) => b.addEventListener('click', () => { clearInterval(auto); set(+b.dataset.k); }));
    if (!REDUCE) {
      ScrollTrigger.create({
        trigger: v, start: 'top 85%', end: 'bottom 15%',
        onToggle: (s) => { clearInterval(auto); if (s.isActive) auto = setInterval(() => set(1 - k), 3600); },
      });
    }
  });
}

/* ---------------- Career log ---------------- */
function renderLog() {
  const ex = site.experience;
  $('#log').innerHTML = `<div class="container">
    ${secHead('Sec 07', 'Log', `git log --graph · ${site.person.since} → now`)}
    <div class="title-row"><h2 class="h2 rv"><span class="yrs-n">${new Date().getFullYear() - site.person.since}</span> years, one branch.</h2><p class="lede rv">Newest first. ${site.domains.map(esc).join(' · ')}.</p></div>
    <div class="git-wrap">
      <svg class="git-svg" aria-hidden="true"><path class="git-line" fill="none" stroke="#C8FF4D" stroke-width="1.5"/><g class="git-nodes"></g></svg>
      <ol class="git" role="list">
        ${ex.map((e, i) => `<li class="cm rv">
          <span class="g" aria-hidden="true"></span>
          <span class="meta"><span class="hash">${hash7(e.org + e.years)}</span><span class="yrs">${esc(e.years)}</span></span>
          <span class="who">${esc(e.org)}${i === 0 ? '<span class="head-tag">HEAD</span>' : ''}<span class="role">${esc(e.role)}</span></span>
          <p class="sum">${esc(e.summary)}</p>
        </li>`).join('')}
      </ol>
    </div>
  </div>`;
}
function layoutGit() {
  const wrap = $('.git-wrap'); if (!wrap) return;
  const svg = $('.git-svg', wrap), line = $('.git-line', svg), nodes = $('.git-nodes', svg);
  const wr = wrap.getBoundingClientRect();
  const sw = svg.getBoundingClientRect().width || 48;
  const gx = sw < 40 ? 9 : 12;
  const ys = $$('.cm', wrap).map((row) => {
    const who = $('.who', row).getBoundingClientRect();
    return who.top - wr.top + 11;
  });
  svg.setAttribute('height', wr.height);
  svg.setAttribute('viewBox', `0 0 ${sw} ${wr.height}`);
  svg.style.height = `${wr.height}px`;
  line.setAttribute('d', `M${gx} ${ys[0]} V${ys[ys.length - 1]}`);
  nodes.innerHTML = ys.map((y, i) => `<g class="gn" transform="translate(${gx} ${y})"><circle r="${i === 0 ? 5 : 4}" fill="${i === 0 ? '#C8FF4D' : '#0B0C0E'}" stroke="#C8FF4D" stroke-width="1.5"/></g>`).join('');
}

/* ---------------- Contact ---------------- */
function renderContact() {
  const c = site.consulting, p = site.person;
  $('#contact').innerHTML = `<div class="container">
    ${secHead('Sec 08', 'Contact', 'Open channel')}
    <p class="prompt" aria-label="${esc(site.contact.line)}"><span class="gt">&gt;</span> <span class="typed">${esc(site.contact.line)}</span><span class="caret" aria-hidden="true"></span></p>
    <div class="contact-row">
      <a class="mail" href="mailto:${esc(p.email)}"><span>${esc(p.email)}</span><span class="arr" aria-hidden="true">→</span></a>
      <div class="contact-meta label">
        <a href="${esc(p.github)}" target="_blank" rel="noopener">GitHub · ${esc(p.githubHandle)} ↗</a>
        <span>${esc(p.location)} · ${esc(p.coords)}</span>
        <span>Local time <b class="clock-c num"></b></span>
      </div>
    </div>
    <div class="consult">
      <div class="c-l rv"><span class="label">${esc(c.name)}</span><h3>${esc(c.pitch)}</h3></div>
      <div class="c-r rv">
        ${c.services.map((s, i) => `<div class="svc"><span class="label">${pad2(i + 1)}</span><span class="n">${esc(s.name)}</span><span class="d">${esc(s.detail)}</span></div>`).join('')}
        <div class="tools">${c.tools.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
      </div>
    </div>
  </div>`;
}

function renderFooter() {
  const p = site.person;
  $('#foot').innerHTML = `<div class="container">
    <p class="f-l label">© <span class="yr-now">${new Date().getFullYear()}</span> ${esc(p.name)} · ${esc(p.location)}</p>
    <p class="f-r label">Set in Geist and Geist Mono · Hero data: fontdex · Archive screenshots: Wayback Machine</p>
  </div>`;
}

/* ---------------- Drawer ---------------- */
let lastFocus = null;
function openDrawer(id, from) {
  const w = site.work.find((x) => x.id === id); if (!w) return;
  const i = site.work.indexOf(w);
  const d = $('#drawer'), panel = $('.drawer-panel', d);
  const phones = w.media.filter((m) => m.device === 'phone');
  const others = w.media.filter((m) => m.device !== 'phone');
  panel.innerHTML = `
    <div class="dr-bar"><span class="label">M-${pad2(i + 1)} · ${esc(w.kind)} · ${esc(w.year)}</span><button class="dr-close" data-close>Close <span>Esc</span></button></div>
    <div class="dr-body">
      <h3 id="drawer-title">${esc(w.name)}</h3>
      <p class="dr-title">${esc(w.title)}</p>
      <p class="dr-sum">${esc(w.summary)}</p>
      <div class="dr-pir">
        <div><span class="label">Problem</span><p>${esc(w.problem)}</p></div>
        <div><span class="label">Insight</span><p>${esc(w.insight)}</p></div>
        <div><span class="label">Result</span><p>${esc(w.result)}</p></div>
      </div>
      <div class="dr-met">${w.metrics.map((m) => `<div><span class="v num">${esc(m.value)}</span><span class="label">${esc(m.label)}</span></div>`).join('')}</div>
      <div class="dr-stack">${w.stack.map((s) => `<span>${esc(s)}</span>`).join('')}</div>
      ${w.links?.length ? `<div class="dr-links">${w.links.map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('')}</div>` : ''}
      ${w.credit ? `<p class="label dr-credit">${esc(w.credit)}</p>` : ''}
      ${w.stages?.length ? `<div class="dr-stages">${w.stages.map((s, k) => `<figure><img src="${asset(s.src)}" alt="${esc(s.label)}: ${esc(s.note)}" loading="lazy"><figcaption class="label">${pad2(k + 1)} · ${esc(s.label)}</figcaption></figure>`).join('')}</div>` : ''}
      ${w.models?.length ? `<p class="label" style="margin-top:28px">Same plan, ${w.models.length} models</p><div class="dr-stages" style="margin-top:10px">${w.models.map((m) => `<figure><img src="${asset(m.src)}" alt="Render by ${esc(m.name)}" loading="lazy"><figcaption class="label">${esc(m.name)}</figcaption></figure>`).join('')}</div>` : ''}
      ${phones.length ? `<div class="dr-media phones-row">${phones.map((m) => `<figure>${phone(m)}<figcaption class="label">${esc(m.alt)}</figcaption></figure>`).join('')}</div>` : ''}
      ${others.length ? `<div class="dr-media">${others.map((m) => `<figure>${media(m)}<figcaption class="label">${esc(m.alt)}</figcaption></figure>`).join('')}</div>` : ''}
    </div>`;
  lastFocus = from || document.activeElement;
  d.hidden = false;
  window.lenis?.stop();
  $$('video[data-autoplay]', panel).forEach((v) => v.play().catch(() => {}));
  if (!REDUCE) {
    gsap.fromTo($('.drawer-scrim', d), { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(panel, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'expo.out' });
  }
  panel.scrollTop = 0;
  panel.focus();
}
function closeDrawer() {
  const d = $('#drawer');
  if (d.hidden) return;
  const panel = $('.drawer-panel', d);
  const done = () => { d.hidden = true; panel.innerHTML = ''; window.lenis?.start(); lastFocus?.focus?.(); };
  if (REDUCE) return done();
  gsap.to(panel, { x: 60, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: done });
  gsap.to($('.drawer-scrim', d), { opacity: 0, duration: 0.3 });
}
document.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeDrawer(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

/* ---------------- Videos ---------------- */
function initVideos() {
  if (REDUCE) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
    }
  }, { threshold: 0.2 });
  $$('main video[data-autoplay]').forEach((v) => {
    // Archive B views play only when shown.
    if (v.classList.contains('b')) return;
    io.observe(v);
  });
}

/* ---------------- Motion ---------------- */
function initMotion() {
  // Crosshairs on each section rule.
  $$('.rule').forEach((r) => {
    gsap.from($$('i', r), { scale: 0, opacity: 0, duration: 0.7, stagger: 0.07, ease: 'expo.out', scrollTrigger: { trigger: r, start: 'top 94%' } });
    gsap.from(r, { scaleX: 0, transformOrigin: 'left center', duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: r, start: 'top 94%' } });
  });
  // Scramble the section labels once.
  $$('.sec-head .sh').forEach((el) => {
    const text = el.textContent;
    ScrollTrigger.create({
      trigger: el, start: 'top 94%', once: true,
      onEnter: () => gsap.to(el, { duration: 0.8, scrambleText: { text, chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', speed: 0.5 } }),
    });
  });
  // General reveal.
  ScrollTrigger.batch('.rv', {
    start: 'top 98%', once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.05, overwrite: true }),
  });
  // The statement: words rise in order.
  const st = $('.statement');
  if (st) {
    const split = new SplitText(st, { type: 'lines,words', linesClass: 'ln' });
    gsap.set(split.lines, { overflow: 'hidden', paddingBottom: '0.06em' });
    gsap.from(split.words, { yPercent: 110, duration: 1.0, ease: 'expo.out', stagger: 0.035, scrollTrigger: { trigger: st, start: 'top 90%' } });
  }
  // Readouts: the value settles and the meter moves.
  $$('.ro').forEach((ro, i) => {
    const val = $('.ro-val', ro), ticks = $$('.ro-ticks i', ro);
    const from = +ro.dataset.from, to = +ro.dataset.to, cyan = ro.hasAttribute('data-cyan');
    const paint = (n) => ticks.forEach((t, k) => { t.classList.toggle('on', k < n); t.classList.toggle('c', cyan && k < n); });
    paint(from);
    const raw = val.dataset.value;
    ScrollTrigger.create({
      trigger: ro, start: 'top 94%', once: true,
      onEnter: () => {
        gsap.to(val, {
          duration: 1.1, delay: i * 0.08,
          scrambleText: { text: raw, chars: '0123456789', speed: 0.6, revealDelay: 0.25 },
          onComplete: () => { val.innerHTML = esc(raw).replace(/→/g, '<span class="ar">→</span>'); },
        });
        const o = { n: from };
        gsap.to(o, { n: to, duration: 1.6, delay: 0.3 + i * 0.08, ease: 'power2.inOut', onUpdate: () => paint(Math.round(o.n)) });
      },
    });
  });
  // Contact prompt types itself.
  const typed = $('.prompt .typed');
  if (typed) {
    // The markup holds the full line. Clear it, then type it when it comes into view.
    typed.textContent = '';
    ScrollTrigger.create({
      trigger: '.prompt', start: 'top 92%', once: true,
      onEnter: () => gsap.to(typed, { duration: site.contact.line.length * 0.035, text: { value: esc(site.contact.line) }, ease: 'none' }),
    });
  }
  // Career graph line draws with scroll.
  layoutGit();
  const gl = $('.git-line');
  if (gl) {
    const nodes = () => $$('.gn');
    gsap.fromTo(gl, { drawSVG: '0%' }, {
      drawSVG: '100%', ease: 'none',
      scrollTrigger: {
        trigger: '.git-wrap', start: 'top 70%', end: 'bottom 75%', scrub: 0.5,
        onUpdate: (s) => nodes().forEach((n, k, arr) => n.classList.toggle('lit', s.progress >= k / Math.max(1, arr.length - 1) - 0.001)),
      },
    });
  }
  // Staging corner lines draw once.
  gsap.from('.staging-typo .sg', { drawSVG: '0%', duration: 1.2, stagger: 0.12, ease: 'power2.inOut', scrollTrigger: { trigger: '.a-staging', start: 'top 85%' } });
}

/* ---------------- Navigation ---------------- */
function initNav() {
  const ids = ['readouts', 'work', 'bench', 'rnd', 'field', 'archive', 'log', 'contact'];
  ids.forEach((id) => {
    ScrollTrigger.create({
      trigger: `#${id}`, start: 'top 50%', end: 'bottom 50%',
      onToggle: (s) => { if (s.isActive) $$('.hud-nav a').forEach((a) => a.classList.toggle('on', a.dataset.nav === id)); },
    });
  });
  const bar = $('.hud-prog i');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { bar.style.transform = `scaleX(${s.progress.toFixed(4)})`; } });
  // Smooth anchor links.
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const t = id === '#top' ? 0 : $(id);
    if (t === null) return;
    e.preventDefault();
    if (window.lenis) window.lenis.scrollTo(t, { duration: 1.4 });
    else (t === 0 ? window.scrollTo(0, 0) : t.scrollIntoView());
  }));
}

/* ---------------- Head (build only) ---------------- */
// The build writes the social tags and the JSON-LD into index.html.
// With site.meta.url set, the links are absolute, as social sites require.
function renderHead() {
  const m = site.meta, p = site.person;
  const abs = (path) => (m.url ? new URL(path, m.url.replace(/\/?$/, '/')).href : path);
  const set = (sel, attr, val) => { const el = document.head.querySelector(sel); if (el) el.setAttribute(attr, val); };
  document.title = m.title;
  set('meta[name="description"]', 'content', m.description);
  set('meta[property="og:title"]', 'content', m.title);
  set('meta[property="og:description"]', 'content', m.description);
  set('meta[property="og:image"]', 'content', abs(m.ogImage));
  set('meta[name="twitter:image"]', 'content', abs(m.ogImage));
  if (m.url) {
    set('meta[property="og:url"]', 'content', abs(''));
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = abs('');
    document.head.append(link);
  } else {
    document.head.querySelector('meta[property="og:url"]')?.remove();
  }
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    jobTitle: site.experience[0].role,
    description: m.description,
    email: `mailto:${p.email}`,
    address: { '@type': 'PostalAddress', addressLocality: 'West Des Moines', addressRegion: 'IA', addressCountry: 'US' },
    worksFor: { '@type': 'Organization', name: site.consulting.name },
    sameAs: [p.github],
    knowsAbout: m.knowsAbout,
    ...(m.url ? { url: abs('') } : {}),
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(ld);
  document.head.append(script);
}

/* ---------------- Boot ---------------- */
function renderAll() {
  $('.grid-overlay .container').innerHTML = '<i></i>'.repeat(12);
  renderHud();
  renderHeroCopy();
  renderReadouts();
  renderWork();
  renderBench();
  renderRnd();
  renderField();
  renderArchive();
  renderLog();
  renderContact();
  renderFooter();
}

async function boot() {
  if (!PRE) renderAll();
  if (PRERENDER) {
    renderHead();
    // Write the plot head with the final counts, so it is in the HTML.
    const data = await fetch(asset('content/fontdex.json')).then((r) => r.json());
    const counts = data.categories.map(() => 0);
    for (const r of data.rows) if (r[2] > 0 && r[3] > 0 && r[4] > 0) counts[r[1]]++;
    renderPlotHead(counts, 0, data.categories);
    $('.n-count').textContent = fmtInt(counts.reduce((a, b) => a + b, 0));
    window.__prerendered = true;
    return;
  }
  const plotHeadWasEmpty = !$('.plot-head').children.length;
  // Values that change with the date.
  const years = new Date().getFullYear();
  $$('.yrs-n').forEach((e) => (e.textContent = String(years - site.person.since)));
  $$('.yr-now').forEach((e) => (e.textContent = String(years)));

  // Lenis smooth scroll, driven by the GSAP ticker.
  if (!REDUCE) {
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  initHud();
  initBench();
  initRnd();
  initField();
  initArchive();

  let readySet = false;
  const ready = () => { if (!readySet) { readySet = true; window.__ready = true; } };
  setTimeout(ready, 5000);

  try { await document.fonts.ready; } catch { /* Continue without fonts. */ }

  // Hero data.
  let hero = null;
  try {
    const data = await fetch(asset('content/fontdex.json')).then((r) => r.json());
    const section = $('.hero');
    hero = createHero({
      section, canvas: $('.hero-canvas'), frame: $('.plot-frame'), tip: $('.tip'), data, reduce: REDUCE,
      onIntroDone: ready,
      onCount: (n) => { const el = $('.n-count'); if (el) el.textContent = fmtInt(n); },
    });
    renderPlotHead(hero.counts, hero.total, data.categories);
    const cats = $('.plot-frame .cats');
    const SHORT = { 'Sans Serif': 'Sans', Handwriting: 'Hand', Monospace: 'Mono' };
    const placeCats = () => {
      const narrow = window.innerWidth < 700;
      cats.innerHTML = hero.colGeo().map((g, i) => {
        const name = data.categories[i];
        return `<span class="cat-l" style="left:${g.x}px;width:${g.w}px"><b class="num">${fmtInt(hero.counts[i])}</b>${esc(narrow ? SHORT[name] || name : name)}</span>`;
      }).join('');
    };
    placeCats();
    window.addEventListener('resize', () => setTimeout(placeCats, 160));
  } catch (err) {
    console.warn('fontdex data did not load', err);
    ready();
  }

  // The hero pin goes first, so later triggers include its scroll space.
  if (!REDUCE && hero) {
    const heroEl = $('.hero'), axes = $('.plot-frame .axes'), cats = $('.plot-frame .cats');
    ScrollTrigger.create({
      trigger: heroEl, start: 'top top', end: () => `+=${Math.round(innerHeight * 0.9)}`,
      pin: true, scrub: 0.6, anticipatePin: 1, refreshPriority: 10,
      onUpdate: (s) => {
        const p = s.progress;
        hero.setMorph(clamp(p * 1.18, 0, 1));
        axes.style.opacity = String(1 - clamp(p / 0.32, 0, 1));
        cats.style.opacity = String(clamp((p - 0.45) / 0.35, 0, 1));
        heroEl.classList.toggle('is-grouped', p > 0.5);
      },
      onRefresh: () => hero.relayout(),
    });
  }

  initWorkPreviews();
  initVideos();
  initNav();

  if (!REDUCE) {
    initMotion();
    // The headline, the intro and the plot frame enter in CSS. The plot head gets
    // its text when the data loads, so it fades in here.
    if (plotHeadWasEmpty) gsap.from('.plot-head', { opacity: 0, y: 12, duration: 1, ease: 'expo.out' });
  } else {
    $$('.rv').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
    $$('.ro').forEach((ro) => { const n = +ro.dataset.to; $$('.ro-ticks i', ro).forEach((t, k) => t.classList.toggle('on', k < n)); });
    layoutGit();
  }

  hero?.start();
  ScrollTrigger.refresh();
  window.addEventListener('resize', () => { layoutGit(); });
  ScrollTrigger.addEventListener('refresh', layoutGit);
  if (REDUCE) ready();
}

boot();
