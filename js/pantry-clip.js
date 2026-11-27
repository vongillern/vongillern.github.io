// The 3D-printable clip that holds the LED string on a wire shelf.
// profile() is a copy of the profile in ~/spruce-pine/pantry-clip.html. That page extrudes
// the profile with three.js and exports the STL. This page draws only the profile.

export const CLIP = {
  barD: 6.1, gap: 26, clr: 0.25, width: 10, t: 2.4,
  topWrap: 180, catchWrap: 40, tc: 1.6,
  hookGap: 3, hookH: 9, ta: 1.8, hookPos: 0.6,
};

const ARC_STEP = Math.PI / 90;
const rad = (d) => (d * Math.PI) / 180;

/** The closed outline of the clip (mm). The top bar center is at (0, 0), the bottom bar at (0, -D). */
export function profile(P = CLIP) {
  const R = P.barD / 2, ri = R + P.clr, t = P.t;
  const D = P.gap + P.barD;
  const pts = [];
  const arc = (cx, cy, r, a0, a1) => {
    const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / ARC_STEP));
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  const thTop = rad(P.topWrap);
  const thBot = -rad(90 + P.catchWrap);
  // The catch gets thinner to its tip, so that it can flex.
  const tBot = (a) => {
    const u = Math.min(1, Math.abs(a / thBot));
    const s = u * u * (3 - 2 * u);
    return t + (P.tc - t) * s;
  };
  // 1. The top hook, outer face.
  arc(0, 0, ri + t, thTop, 0);
  // 2. The spine, with the light hook.
  const x0 = ri + t, ta = P.ta, rin = 1.2;
  const yb = -D * P.hookPos - ta / 2;
  const xu = x0 + P.hookGap;
  const yTop = yb + P.hookH;
  pts.push([x0, yb + ta]);
  arc(xu - rin, yb + ta + rin, rin, -Math.PI / 2, 0);
  arc(xu + ta / 2, yTop - ta / 2, ta / 2, Math.PI, 0);
  arc(xu - rin, yb + ta + rin, rin + ta, 0, -Math.PI / 2);
  pts.push([x0, yb]);
  // 3. The bottom catch, outer face.
  const n = Math.ceil(Math.abs(thBot) / ARC_STEP);
  for (let i = 0; i <= n; i++) {
    const a = (thBot * i) / n, r = ri + tBot(a);
    pts.push([r * Math.cos(a), -D + r * Math.sin(a)]);
  }
  // 4. The round tip of the catch.
  const tcB = tBot(thBot), cr = ri + tcB / 2;
  arc(cr * Math.cos(thBot), -D + cr * Math.sin(thBot), tcB / 2, thBot, thBot - Math.PI);
  // 5. The inner faces.
  arc(0, -D, ri, thBot, 0);
  arc(0, 0, ri, 0, thTop);
  // 6. The round tip of the top hook.
  const ct = ri + t / 2;
  arc(ct * Math.cos(thTop), ct * Math.sin(thTop), t / 2, thTop + Math.PI, thTop);

  // The catch tip blocks the path of the bottom bar by this much: the snap.
  const snap = P.catchWrap > 0 ? Math.max(0, R - Math.abs(ri * Math.sin(thBot))) : 0;
  return {
    pts, R, ri, D, x0, xu, yb, ta, snap,
    size: [xu + ta + ri, D + 2 * (ri + t), P.width],
  };
}
