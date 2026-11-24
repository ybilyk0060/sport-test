// Синтетические позы из QA-имитатора Студії вправ Kidsney (mockPoseFrameSource, сборка 09c55bebf) — без изменений.
const et = 0.95,
  f = (o, s) => ({ x: o, y: s, z: 0, visibility: et });
function O(o, s, e) {
  const t = Array.from({ length: 33 }, () => f(0.5, 0.5)),
    r = s * Math.min(1, Math.max(0, (155 - o) / 15)),
    i = 0.5 + r,
    n = 0.66 + r,
    c = (o * Math.PI) / 180,
    a = i - n,
    h = -a * Math.sin(c),
    l = a * Math.cos(c);
  for (const u of [0, 1]) {
    const y = u * 0.08;
    ((t[11 + u] = f(0.46 + y, 0.3)),
      (t[23 + u] = f(0.46 + y, i)),
      (t[25 + u] = f(0.46 + y, n)),
      (t[27 + u] = f(0.46 + y + h, n + l)),
      (t[13 + u] = f(0.42 + y, 0.38)),
      (t[15 + u] = e === "down" ? f(0.46 + y, 0.42) : f(0.53 + y, 0.3)));
  }
  return ((t[0] = f(0.5, 0.14)), t);
}
function it(o, s, e) {
  const t = [],
    r = (i) => {
      const n = O(o, s, "forward");
      return ((n[15] = f(0.46 + i, 0.3)), (n[16] = f(0.54 + i, 0.3)), n);
    };
  for (let i = 0; i < 6; i++) t.push(O(175, 0, "down"));
  for (let i = 1; i <= 20; i++)
    t.push(O(175 + ((o - 175) * i) / 20, s * (i / 20), "down"));
  for (let i = 0; i < 3; i++) t.push(r(e));
  for (let i = 1; i <= 12; i++) {
    const n = o + ((175 - o) * i) / 12;
    t.push(O(n, s * (1 - i / 12), n > 135 ? "down" : "forward"));
  }
  return t;
}
const rt = () => it(100, 0.1, 0.14),
  ct = 1080 / 1920;
function T(o) {
  return (Math.atan(ct * Math.tan((o * Math.PI) / 180)) * 180) / Math.PI;
}
function p(o, s, e, t, r) {
  const n = Math.atan2(o.y - s.y, o.x - s.x) + (r * (t * Math.PI)) / 180;
  return { x: s.x + e * Math.cos(n), y: s.y + e * Math.sin(n) };
}
function m(o, s, e) {
  return o + (s - o) * e;
}
function k() {
  return Array.from({ length: 33 }, () => f(0.5, 0.5));
}
function I(o, s, e) {
  for (const t of s) o[t + 1] = f(o[t].x + e, o[t].y);
}
const x = 0.16,
  g = 0.14,
  N = 0.13,
  w = 0.075,
  H = 0.105;
function E(o) {
  const s = k(),
    e = (T(o.tilt) * Math.PI) / 180,
    t = { x: 0.3, y: 0.4 },
    r = { x: t.x + x * Math.cos(e), y: t.y + x * Math.sin(e) },
    i = p(t, r, g, o.hip, 1),
    n = p(r, i, N, o.knee, 1),
    c = {
      x: t.x + w * Math.cos((75 * Math.PI) / 180),
      y: t.y + w * Math.sin((75 * Math.PI) / 180),
    },
    a = p(t, c, H, o.elbow, 1);
  return (
    (s[11] = f(t.x, t.y)),
    (s[13] = f(c.x, c.y)),
    (s[15] = f(a.x, a.y)),
    (s[23] = f(r.x, r.y)),
    (s[25] = f(i.x, i.y)),
    (s[27] = f(n.x, n.y)),
    I(s, [11, 13, 15, 23, 25, 27], 0.07),
    (s[0] = f(t.x + 0.04, t.y - 0.06)),
    s
  );
}
function at(o) {
  const { top: s, bottom: e } = o,
    t = { lead: 6, down: 14, hold: 3, up: 12, ...o.frames },
    r = [],
    i = (n) => ({
      elbow: m(s.elbow, e.elbow, n),
      hip: m(s.hip, e.hip, n),
      knee: m(s.knee, e.knee, n),
      tilt: m(s.tilt, e.tilt, n),
    });
  for (let n = 0; n < t.lead; n++) r.push(E(s));
  for (let n = 1; n <= t.down; n++) r.push(E(i(n / t.down)));
  for (let n = 0; n < t.hold; n++) r.push(E(e));
  for (let n = 1; n <= t.up; n++) r.push(E(i(1 - n / t.up)));
  for (let n = 0; n < 6; n++) r.push(E(s));
  return r;
}
const lt = () =>
  at({
    top: { elbow: 165, hip: 176, knee: 176, tilt: 3 },
    bottom: { elbow: 70, hip: 170, knee: 172, tilt: 6 },
  });
function F(o) {
  const s = k(),
    e = (T(o.thighTilt) * Math.PI) / 180,
    t = { x: 0.48, y: 0.55 },
    r = { x: t.x + g * Math.cos(e), y: t.y - g * Math.sin(e) },
    i = p(t, r, N, o.knee, 1),
    n = p(r, t, x, o.hip, -1);
  return (
    (s[11] = f(n.x, n.y)),
    (s[23] = f(t.x, t.y)),
    (s[25] = f(r.x, r.y)),
    (s[27] = f(i.x, i.y)),
    I(s, [11, 23, 25, 27], 0.07),
    (s[0] = f(n.x - 0.05, n.y - 0.04)),
    s
  );
}
function ht(o) {
  const { rest: s, top: e } = o,
    t = { lead: 6, up: 14, hold: 3, down: 12, ...o.frames },
    r = [],
    i = (n) => ({
      hip: m(s.hip, e.hip, n),
      knee: m(s.knee, e.knee, n),
      thighTilt: m(s.thighTilt, e.thighTilt, n),
    });
  for (let n = 0; n < t.lead; n++) r.push(F(s));
  for (let n = 1; n <= t.up; n++) r.push(F(i(n / t.up)));
  for (let n = 0; n < t.hold; n++) r.push(F(e));
  for (let n = 1; n <= t.down; n++) r.push(F(i(1 - n / t.down)));
  for (let n = 0; n < 6; n++) r.push(F(s));
  return r;
}
const ft = () =>
  ht({
    rest: { hip: 148, knee: 96, thighTilt: 52 },
    top: { hip: 52, knee: 70, thighTilt: 78 },
  });
function Y(o) {
  const s = k(),
    e = (T(o.tilt) * Math.PI) / 180,
    t = { x: 0.45, y: 0.5 },
    r = { x: t.x + x * Math.cos(e), y: t.y - x * Math.sin(e) },
    i = p(r, t, g + N, o.hip, -1);
  return (
    (s[11] = f(r.x, r.y)),
    (s[23] = f(t.x, t.y)),
    (s[25] = f(i.x, i.y)),
    I(s, [11, 23, 25], 0.07),
    (s[0] = f(r.x + 0.03, r.y - 0.06)),
    s
  );
}
const D = { hip: 176, tilt: 86 },
  U = { hip: 174, tilt: 3 };
function ut(o) {
  const s = { seg: 10, hold: 4, ...o.frames },
    e = [],
    t = (n, c, a) => ({ hip: m(n.hip, c.hip, a), tilt: m(n.tilt, c.tilt, a) }),
    r = (n, c) => {
      for (let a = 1; a <= s.seg; a++) e.push(Y(t(n, c, a / s.seg)));
    },
    i = (n) => {
      for (let c = 0; c < s.hold; c++) e.push(Y(n));
    };
  return (
    i(D),
    r(D, o.fold),
    i(o.fold),
    r(o.fold, U),
    i(U),
    r(U, o.fold),
    i(o.fold),
    r(o.fold, D),
    i(D),
    e
  );
}
const yt = () => ut({ fold: { hip: 40, tilt: 55 } }),
  z = g + 0.01;
function mt(o, s) {
  const e = Math.PI / 180,
    t = T(s) * e,
    r = x * Math.cos(t),
    i = -x * Math.sin(t);
  let n = 0,
    c = 1 / 0;
  for (let a = -180; a < 180; a += 0.5) {
    const h = z * Math.cos(a * e),
      l = z * Math.sin(a * e),
      u = h + r,
      y = l + i,
      b = Math.atan2(l, h),
      d = Math.atan2(y, u);
    let _ = Math.abs(d - b) / e;
    _ > 180 && (_ = 360 - _);
    const M = Math.abs(_ - o);
    M < c && ((c = M), (n = a));
  }
  return n;
}
function q(o) {
  const s = k(),
    e = { x: 0.45, y: 0.55 },
    t = (mt(o.knee, o.tilt) * Math.PI) / 180,
    r = (T(o.tilt) * Math.PI) / 180,
    i = { x: e.x + z * Math.cos(t), y: e.y + z * Math.sin(t) },
    n = { x: i.x + x * Math.cos(r), y: i.y - x * Math.sin(r) },
    c = {
      x: n.x + w * Math.cos((75 * Math.PI) / 180),
      y: n.y + w * Math.sin((75 * Math.PI) / 180),
    },
    a = p(n, c, H, o.elbow, 1);
  return (
    (s[11] = f(n.x, n.y)),
    (s[13] = f(c.x, c.y)),
    (s[15] = f(a.x, a.y)),
    (s[23] = f(i.x, i.y)),
    (s[25] = f(e.x, e.y)),
    I(s, [11, 13, 15, 23, 25], 0.07),
    (s[0] = f(n.x + 0.03, n.y - 0.06)),
    s
  );
}
const v = { knee: 4, tilt: 86, elbow: 170 },
  P = { knee: 2, tilt: 3, elbow: 165 };
function xt(o) {
  const s = { seg: 10, hold: 4, ...o.frames },
    e = { knee: o.foldKnee, tilt: 20, elbow: 60 },
    t = { knee: 3, tilt: 3, elbow: o.pushUpElbow },
    r = [],
    i = (a, h, l) => ({
      knee: m(a.knee, h.knee, l),
      tilt: m(a.tilt, h.tilt, l),
      elbow: m(a.elbow, h.elbow, l),
    }),
    n = (a, h) => {
      for (let l = 1; l <= s.seg; l++) r.push(q(i(a, h, l / s.seg)));
    },
    c = (a) => {
      for (let h = 0; h < s.hold; h++) r.push(q(a));
    };
  return (
    c(v),
    n(v, e),
    c(e),
    n(e, P),
    c(P),
    n(P, t),
    c(t),
    n(t, P),
    c(P),
    n(P, e),
    c(e),
    n(e, v),
    c(v),
    c(v),
    r
  );
}
const pt = () => xt({ foldKnee: 118, pushUpElbow: 80 });
function C(o) {
  const s = k(),
    e = { x: 0.45, y: 0.5 },
    t = { x: 0.45, y: 0.32 },
    r = p(e, t, w + H, o, 1);
  return (
    (s[11] = f(t.x, t.y)),
    (s[13] = f(r.x, r.y)),
    (s[23] = f(e.x, e.y)),
    I(s, [11, 13, 23], 0.07),
    (s[0] = f(t.x + 0.03, t.y - 0.06)),
    s
  );
}
function dt(o) {
  const s = { lead: 6, raise: 12, down: 10, trail: 12, ...o.frames },
    e = [];
  for (let t = 0; t < s.lead; t++) e.push(C(o.bottom));
  for (let t = 1; t <= s.raise; t++) e.push(C(m(o.bottom, o.top, t / s.raise)));
  for (let t = 1; t <= s.down; t++) e.push(C(m(o.top, o.bottom, t / s.down)));
  for (let t = 0; t < s.trail; t++) e.push(C(o.bottom));
  return e;
}
const bt = () => dt({ top: 120, bottom: 38 });
function Mt(o) {
  const s = k(),
    e = { x: 0.3, y: 0.42 },
    t = {
      x: e.x + x * Math.cos((2 * Math.PI) / 180),
      y: e.y + x * Math.sin((2 * Math.PI) / 180),
    },
    r = p(e, t, g, o.hip, 1),
    i = p(t, r, N, o.knee, 1),
    n = {
      x: e.x + w * Math.cos((80 * Math.PI) / 180),
      y: e.y + w * Math.sin((80 * Math.PI) / 180),
    },
    c = p(e, n, H, o.elbow, 1);
  return (
    (s[11] = f(e.x, e.y)),
    (s[13] = f(n.x, n.y)),
    (s[15] = f(c.x, c.y)),
    (s[23] = f(t.x, t.y)),
    (s[25] = f(r.x, r.y)),
    (s[27] = f(i.x, i.y)),
    I(s, [11, 13, 15, 23, 25, 27], 0.07),
    (s[0] = f(e.x + 0.04, e.y - 0.06)),
    s
  );
}
const wt = (o, s) => Array.from({ length: s }, () => Mt(o)),
  kt = () => ({ hip: 174, elbow: 73, knee: 175 });
function S(o, s) {
  const e = k(),
    t = { x: 0.45, y: 0.42 },
    r = { x: 0.45, y: 0.26 };
  return (
    (e[23] = f(t.x - 0.035, t.y)),
    (e[24] = f(t.x + 0.035, t.y)),
    (e[11] = f(r.x - 0.035, r.y)),
    (e[12] = f(r.x + 0.035, r.y)),
    (e[25] = f(0.42, t.y + o * x)),
    (e[26] = f(0.48, t.y + s * x)),
    (e[0] = f(0.45, 0.2)),
    e
  );
}
function _t(o) {
  const s = o.lifts ?? 8,
    e = o.framesPerHalf ?? 10,
    t = [];
  for (let r = 0; r < 6; r++) t.push(S(o.plant, o.plant));
  for (let r = 0; r < s; r++) {
    const i = r % 2 === 0;
    for (let n = 1; n <= e; n++) {
      const c = m(o.plant, o.peak, n / e);
      t.push(i ? S(c, o.plant) : S(o.plant, c));
    }
    for (let n = 1; n <= e; n++) {
      const c = m(o.peak, o.plant, n / e);
      t.push(i ? S(c, o.plant) : S(o.plant, c));
    }
  }
  return t;
}
const Pt = () => _t({ peak: 0.2, plant: 0.85 });
export { rt as squatRep, wt as plankFrames, kt as plankPose, Pt as highKneesRun, _t as highKnees, it as squat, f as pt };
