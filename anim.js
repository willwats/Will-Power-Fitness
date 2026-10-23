/* Will Power Fitness — exercise animations.
 * Each movement is a few key poses; the athlete is drawn as a filled, tapered body (clothing, shoes,
 * the trained muscle glowing) using two-segment inverse kinematics so elbows and knees bend naturally.
 * Templates live in anim-upper.js / anim-lower.js / anim-core.js; anim-map.js maps exercises → templates.
 */
const WPA = (() => {
  const VB_W = 160, VB_H = 100, GY = 94;           // scene size and ground line
  const LT = 24, UA = 13, FA = 12, TH = 19, SH = 18, HEAD_R = 5;
  const rad = (d) => (d * Math.PI) / 180;

  /* ── authoring helpers ── */
  const S = (dx, dy) => ['s', dx, dy];              // relative to shoulder
  const H = (dx, dy) => ['h', dx, dy];              // relative to hip
  const A = (x, y) => ['a', x, y];                  // absolute scene coords
  const G = (x) => ['a', x, GY];                    // on the ground at x

  /** Resolve an authored pose into absolute numbers (so interpolation is simple). */
  function pose(o) {
    const t = o.t || 0, hip = o.hip;
    const sh = [hip[0] + LT * Math.sin(rad(t)), hip[1] - LT * Math.cos(rad(t))];
    const at = (spec) => (spec[0] === 'a' ? [spec[1], spec[2]] : spec[0] === 's' ? [sh[0] + spec[1], sh[1] + spec[2]] : [hip[0] + spec[1], hip[1] + spec[2]]);
    const hand = at(o.hand || S(0, 25)), foot = at(o.foot || G(hip[0]));
    return {
      hip, t, nk: o.nk || 0, hand, hand2: o.hand2 ? at(o.hand2) : hand, foot, foot2: o.foot2 ? at(o.foot2) : foot,
      eb: o.eb === undefined ? 1 : o.eb, kb: o.kb === undefined ? -1 : o.kb,
    };
  }

  /** Front-view pose (for lateral raises etc.): arm angles are measured from straight down, outward positive. */
  function fpose(o) {
    return { v: 'f', sy: o.sy || 0, hy: o.hy || 0, a: o.a || [0, 0], a2: o.a2 || o.a || [0, 0], g: o.g || 0, g2: o.g2 === undefined ? (o.g || 0) : o.g2 };
  }

  /** Two-segment IK: returns the middle joint (elbow/knee) and the (possibly clamped) end point. */
  function ik(root, end, a, b, sign) {
    let dx = end[0] - root[0], dy = end[1] - root[1];
    let d = Math.hypot(dx, dy);
    const max = a + b - 0.01, min = Math.abs(a - b) + 0.4;
    if (d > max) { const k = max / d; dx *= k; dy *= k; d = max; }
    else if (d < min) {
      const ang = d > 0.001 ? Math.atan2(dy, dx) : Math.PI / 2;
      d = min; dx = Math.cos(ang) * d; dy = Math.sin(ang) * d;
    }
    const x = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - x * x));
    const ux = dx / d, uy = dy / d;
    return { j: [root[0] + ux * x - uy * h * sign, root[1] + uy * x + ux * h * sign], e: [root[0] + dx, root[1] + dy] };
  }

  const lerp = (a, b, k) => a + (b - a) * k;
  const lerp2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  function mix(p, q, k) {
    if (p.v === 'f') {
      const l2 = (a, b) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
      return { v: 'f', sy: lerp(p.sy, q.sy, k), hy: lerp(p.hy, q.hy, k), a: l2(p.a, q.a), a2: l2(p.a2, q.a2), g: lerp(p.g, q.g, k), g2: lerp(p.g2, q.g2, k) };
    }
    return {
      hip: lerp2(p.hip, q.hip, k), t: lerp(p.t, q.t, k), nk: lerp(p.nk, q.nk, k),
      hand: lerp2(p.hand, q.hand, k), hand2: lerp2(p.hand2, q.hand2, k),
      foot: lerp2(p.foot, q.foot, k), foot2: lerp2(p.foot2, q.foot2, k),
      eb: k < 0.5 ? p.eb : q.eb, kb: k < 0.5 ? p.kb : q.kb,
    };
  }

  /* ── static prop shorthands (SVG strings, class "p" = fixed equipment) ── */
  const line = (x1, y1, x2, y2, w = 2) => `<line class="p" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${w}"/>`;
  const rect = (x, y, w, h) => `<rect class="p" x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5"/>`;
  const bench = (x1, x2, y) => rect(x1, y, x2 - x1, 3) + line(x1 + 3, y + 3, x1 + 3, GY) + line(x2 - 3, y + 3, x2 - 3, GY);
  const box = (x1, x2, y) => rect(x1, y, x2 - x1, GY - y);
  const bar = (x1, x2, y) => line(x1, y, x2, y, 2.5) + line(x1, y, x1, GY, 1.5) + line(x2, y, x2, GY, 1.5);
  const wall = (x) => line(x, 6, x, GY, 2.5);

  const T = {};                                      // template registry (filled by anim-*.js)
  /** def: { poses:[...pose()], static:'svg', loop:bool, anchor:[x,y], held:false (no weights), hold:'bb' (forced) } */
  const add = (name, def) => { T[name] = def; };

  /* ── drawing ── */
  const NS = 'http://www.w3.org/2000/svg';
  const HELD = {
    bb: '<circle r="6.2" class="w"/><circle r="2" class="wi"/>',
    db: '<circle r="4" class="w"/><circle r="1.4" class="wi"/>',
    kb: '<circle r="4.8" class="w" cy="2"/><path class="wh" d="M-3 -1 Q0 -7 3 -1"/>',
    ball: '<circle r="6.5" class="w2"/>',
    wheel: '<circle r="5" class="w2"/>',
  };

  /* ── body: filled, tapered limbs, shaped torso, clothing and a glowing target muscle ── */
  const f1 = (n) => n.toFixed(1);
  const P2 = (p) => `${f1(p[0])} ${f1(p[1])}`;
  /** Tapered limb with rounded ends and a slight muscle belly (k). */
  function limb(a, b, w0, w1, k = 1) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const r0 = w0 / 2, r1 = w1 / 2, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, c = (r0 + r1) / 2 + k;
    const Q = (p, s, r) => [p[0] + nx * s * r, p[1] + ny * s * r];
    const a1 = Q(a, 1, r0), b1 = Q(b, 1, r1), b2 = Q(b, -1, r1), a2 = Q(a, -1, r0);
    return `M${P2(a1)}Q${P2([mx + nx * c, my + ny * c])} ${P2(b1)}A${f1(r1)} ${f1(r1)} 0 0 0 ${P2(b2)}Q${P2([mx - nx * c, my - ny * c])} ${P2(a2)}A${f1(r0)} ${f1(r0)} 0 0 0 ${P2(a1)}Z`;
  }
  /** Smooth closed outline through points (midpoint quadratics). */
  function blob(p) {
    const m = (i, j) => [(p[i][0] + p[j][0]) / 2, (p[i][1] + p[j][1]) / 2], n = p.length;
    let d = `M${P2(m(0, 1))}`;
    for (let i = 1; i <= n; i++) d += `Q${P2(p[i % n])} ${P2(m(i % n, (i + 1) % n))}`;
    return d + 'Z';
  }
  const lerpP = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const deg = (dx, dy) => (Math.atan2(dy, dx) * 180) / Math.PI;
  const ellAlong = (a, b, w, frac = 0.8) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (Math.hypot(b[0] - a[0], b[1] - a[1]) / 2) * frac, w / 2, deg(b[0] - a[0], b[1] - a[1])];
  const along = (G, k, off) => [G.hip[0] + (G.sh[0] - G.hip[0]) * k + G.n[0] * off, G.hip[1] + (G.sh[1] - G.hip[1]) * k + G.n[1] * off];

  /** Which body parts glow for each trained muscle: n ellipses, f(G, i) → [cx, cy, rx, ry, rotation]. */
  const HL = {
    chest: { n: 1, f: (G) => [...along(G, 0.8, 3.4), 4.8, 3.4, G.axis] },
    back: { n: 1, f: (G) => [...along(G, 0.66, -3.6), 6.4, 3, G.axis] },
    shoulders: { n: 2, f: (G, i) => [G.arms[i][0][0], G.arms[i][0][1], 3.9, 3.9, 0] },
    biceps: { n: 2, f: (G, i) => ellAlong(G.arms[i][0], G.arms[i][1], 5) },
    triceps: { n: 2, f: (G, i) => ellAlong(G.arms[i][0], G.arms[i][1], 5) },
    forearms: { n: 2, f: (G, i) => ellAlong(G.arms[i][1], G.arms[i][2], 4) },
    core: { n: 1, f: (G) => [...along(G, 0.34, 3.6), 5, 2.6, G.axis] },
    quads: { n: 2, f: (G, i) => ellAlong(G.legs[i][0], G.legs[i][1], 8.5) },
    hamstrings: { n: 2, f: (G, i) => ellAlong(G.legs[i][0], G.legs[i][1], 8.5) },
    glutes: { n: 1, f: (G) => [G.hip[0] + G.n[0] * -2.6, G.hip[1] + G.n[1] * -2.6, 5.2, 4.6, G.axis] },
    calves: { n: 2, f: (G, i) => ellAlong(G.legs[i][1], G.legs[i][2], 6.2) },
  };

  function build(host, name, held, label, muscle) {
    const tpl = T[name];
    host.innerHTML = '';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
    svg.setAttribute('class', 'wpa');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label || 'Exercise demonstration');
    const anchor = tpl.anchor;
    const hl = HL[muscle];
    const e = (tag, cls, r) => `<${tag} class="${cls}" data-r="${r}"/>`;
    svg.innerHTML = `
      <line class="gnd" x1="4" y1="${GY}" x2="156" y2="${GY}"/>
      <ellipse class="shadow" cx="80" cy="${GY + 0.5}" rx="22" ry="1.6"/>
      ${tpl.static || ''}
      ${anchor && (held === 'rope' || tpl.rope) ? `<circle class="p" cx="${anchor[0]}" cy="${anchor[1]}" r="2.2"/><line class="rope" x1="0" y1="0" x2="${anchor[0]}" y2="${anchor[1]}"/>` : ''}
      ${e('path', 'skin far', 'fa1')}${e('path', 'skin far', 'fa2')}${e('circle', 'skin far', 'fh')}
      ${e('path', 'skin far', 'fl1')}${e('path', 'skin far', 'fl2')}${e('path', 'short far', 'fs')}${e('ellipse', 'shoe far', 'ff')}
      ${e('path', 'shirt', 'tr')}${e('circle', 'short', 'hp')}
      ${e('path', 'skin', 'nk')}
      ${e('path', 'skin', 'lg1')}${e('path', 'skin', 'lg2')}${e('path', 'short', 'ns')}${e('ellipse', 'shoe', 'nf')}
      ${e('path', 'skin', 'ar1')}${e('path', 'skin', 'ar2')}${e('circle', 'skin', 'nh')}
      ${hl ? Array.from({ length: hl.n }, (_, i) => e('ellipse', 'hl', 'hl' + i)).join('') : ''}
      ${e('circle', 'hair', 'hr')}${e('circle', 'skin', 'hd')}${e('circle', 'skin', 'ns2')}
      ${held && held !== 'rope' && !tpl.rope && HELD[held] ? `<g class="held">${HELD[held]}</g>` : ''}`;
    host.appendChild(svg);
    const ref = { svg, hl, held: svg.querySelector('.held'), rope: svg.querySelector('.rope'), hls: [] };
    svg.querySelectorAll('[data-r]').forEach((n) => { ref[n.dataset.r] = n; });
    if (hl) for (let i = 0; i < hl.n; i++) ref.hls.push(ref['hl' + i]);
    return ref;
  }

  const setD = (el, d) => el.setAttribute('d', d);
  const setC = (el, c, r) => { el.setAttribute('cx', f1(c[0])); el.setAttribute('cy', f1(c[1])); if (r) el.setAttribute('r', r); };
  function setShoe(el, ankle, knee) {
    const dx = ankle[0] - knee[0], dy = ankle[1] - knee[1], L = Math.hypot(dx, dy) || 1, d = [dx / L, dy / L], f = [d[1], -d[0]];
    const c = [ankle[0] + f[0] * 2.4 - d[0] * 1.3, ankle[1] + f[1] * 2.4 - d[1] * 1.3];
    el.setAttribute('cx', 0); el.setAttribute('cy', 0); el.setAttribute('rx', 5); el.setAttribute('ry', 2.5);
    el.setAttribute('transform', `translate(${f1(c[0])} ${f1(c[1])}) rotate(${f1(deg(f[0], f[1]))})`);
  }
  function applyHL(ref, G) {
    if (!ref.hl) return;
    ref.hls.forEach((el, i) => {
      const v = ref.hl.f(G, i);
      el.setAttribute('rx', f1(Math.max(1, v[2]))); el.setAttribute('ry', f1(Math.max(1, v[3])));
      el.setAttribute('transform', `translate(${f1(v[0])} ${f1(v[1])}) rotate(${f1(v[4])})`);
    });
  }
  function head(ref, c, fwd, up) {
    const at = (a, b) => [c[0] + fwd[0] * a + up[0] * b, c[1] + fwd[1] * a + up[1] * b];
    setC(ref.hr, at(-1.1, 0.7), 5.4); setC(ref.hd, at(0.5, -0.2), 4.7);
    setC(ref.ns2, at(4.7, -0.6), 1.1);
  }

  function drawFront(ref, p) {
    const hipY = 57 + p.hy, neckY = hipY - 24 + p.sy;
    const arm = (sx, a, dir) => {
      const s0 = [sx, neckY + 3];
      const j = [s0[0] + dir * UA * Math.sin(rad(a[0])), s0[1] + UA * Math.cos(rad(a[0]))];
      return [s0, j, [j[0] + dir * FA * Math.sin(rad(a[1])), j[1] + FA * Math.cos(rad(a[1]))]];
    };
    const leg = (x, g, dir) => {
      const f = [x + dir * 37 * Math.sin(rad(g)), hipY + 37 * Math.cos(rad(g))];
      return [[x, hipY], [(x + f[0]) / 2 + dir * 0.4, (hipY + f[1]) / 2], f];
    };
    const ra = arm(89, p.a, 1), la = arm(71, p.a2, -1), rl = leg(84.5, p.g, 1), ll = leg(75.5, p.g2, -1);
    const G = { hip: [80, hipY], sh: [80, neckY + 3], n: [0, 0], axis: -90, arms: [ra, la], legs: [rl, ll] };
    setD(ref.tr, blob([[69.5, neckY + 4], [75, neckY + 0.5], [85, neckY + 0.5], [90.5, neckY + 4], [88, neckY + 12], [86, hipY - 4], [86, hipY], [74, hipY], [74, hipY - 4], [72, neckY + 12]]));
    setC(ref.hp, [80, hipY - 1], 7.2);
    setD(ref.nk, limb([80, neckY + 1], [80, neckY - 5], 4.4, 3.8, 0));
    setD(ref.ar1, limb(ra[0], ra[1], 6.2, 4.8, 1.2)); setD(ref.ar2, limb(ra[1], ra[2], 4.8, 3.4, 0.8)); setC(ref.nh, ra[2], 2.5);
    setD(ref.fa1, limb(la[0], la[1], 6.2, 4.8, 1.2)); setD(ref.fa2, limb(la[1], la[2], 4.8, 3.4, 0.8)); setC(ref.fh, la[2], 2.5);
    setD(ref.lg1, limb(rl[0], rl[1], 9.5, 7.2, 1.6)); setD(ref.lg2, limb(rl[1], rl[2], 7.2, 4.8, 1.2));
    setD(ref.fl1, limb(ll[0], ll[1], 9.5, 7.2, 1.6)); setD(ref.fl2, limb(ll[1], ll[2], 7.2, 4.8, 1.2));
    setD(ref.ns, limb(rl[0], lerpP(rl[0], rl[1], 0.55), 11, 9.4, 0.4));
    setD(ref.fs, limb(ll[0], lerpP(ll[0], ll[1], 0.55), 11, 9.4, 0.4));
    for (const [el, l, dir] of [[ref.nf, rl, 1], [ref.ff, ll, -1]]) {
      el.setAttribute('cx', 0); el.setAttribute('cy', 0); el.setAttribute('rx', 3.6); el.setAttribute('ry', 2.2);
      el.setAttribute('transform', `translate(${f1(l[2][0] + dir * 1.2)} ${f1(l[2][1] - 0.6)})`);
    }
    head(ref, [80, neckY - 8], [0, 0], [0, -1]);
    setC(ref.hr, [80, neckY - 9], 5.5); setC(ref.hd, [80, neckY - 7.6], 4.8); setC(ref.ns2, [80, neckY - 7], 0);
    applyHL(ref, G);
    if (ref.held) ref.held.setAttribute('transform', `translate(${f1(ra[2][0])} ${f1(ra[2][1])})`);
    if (ref.rope) { ref.rope.setAttribute('x1', f1(ra[2][0])); ref.rope.setAttribute('y1', f1(ra[2][1])); }
  }

  function draw(ref, p, tpl) {
    if (p.v === 'f') return drawFront(ref, p);
    const sh = [p.hip[0] + LT * Math.sin(rad(p.t)), p.hip[1] - LT * Math.cos(rad(p.t))];
    const arm = ik(sh, p.hand, UA, FA, p.eb), arm2 = ik(sh, p.hand2, UA, FA, p.eb);
    const leg = ik(p.hip, p.foot, TH, SH, p.kb), leg2 = ik(p.hip, p.foot2, TH, SH, p.kb);
    const t = rad(p.t), n = [Math.cos(t), Math.sin(t)], hip = p.hip;
    const at = (k, off) => [hip[0] + (sh[0] - hip[0]) * k + n[0] * off, hip[1] + (sh[1] - hip[1]) * k + n[1] * off];
    setD(ref.tr, blob([at(0, -5), at(0.34, -4.4), at(0.7, -5.4), at(1.0, -4.4), at(1.1, 0.4), at(1.0, 5.2), at(0.78, 6.6), at(0.52, 5.3), at(0.3, 4.4), at(0, 5.2)]));
    setC(ref.hp, [hip[0] + n[0] * 0.2, hip[1] + n[1] * 0.2], 5.3);
    const ha = rad(p.t + p.nk), up = [Math.sin(ha), -Math.cos(ha)], fwd = [Math.cos(ha), Math.sin(ha)];
    const hc = [sh[0] + up[0] * 10, sh[1] + up[1] * 10];
    setD(ref.nk, limb(at(1.0, 0), hc, 4.6, 3.8, 0));
    head(ref, hc, fwd, up);
    const W = { a0: 6.4, a1: 4.9, a2: 3.5, t0: 10, t1: 7.4, t2: 5 };
    setD(ref.ar1, limb(sh, arm.j, W.a0, W.a1, 1.4)); setD(ref.ar2, limb(arm.j, arm.e, W.a1, W.a2, 0.8)); setC(ref.nh, arm.e, 2.5);
    setD(ref.fa1, limb(sh, arm2.j, W.a0, W.a1, 1.4)); setD(ref.fa2, limb(arm2.j, arm2.e, W.a1, W.a2, 0.8)); setC(ref.fh, arm2.e, 2.5);
    setD(ref.lg1, limb(hip, leg.j, W.t0, W.t1, 1.8)); setD(ref.lg2, limb(leg.j, leg.e, W.t1, W.t2, 1.5));
    setD(ref.fl1, limb(hip, leg2.j, W.t0, W.t1, 1.8)); setD(ref.fl2, limb(leg2.j, leg2.e, W.t1, W.t2, 1.5));
    setD(ref.ns, limb(hip, lerpP(hip, leg.j, 0.46), 10.8, 9.6, 0.3));
    setD(ref.fs, limb(hip, lerpP(hip, leg2.j, 0.46), 10.8, 9.6, 0.3));
    setShoe(ref.nf, leg.e, leg.j); setShoe(ref.ff, leg2.e, leg2.j);
    applyHL(ref, { hip, sh, n, axis: deg(sh[0] - hip[0], sh[1] - hip[1]), arms: [[sh, arm.j, arm.e], [sh, arm2.j, arm2.e]], legs: [[hip, leg.j, leg.e], [hip, leg2.j, leg2.e]] });
    if (ref.held) ref.held.setAttribute('transform', `translate(${f1(arm.e[0])} ${f1(arm.e[1])})`);
    if (ref.rope) { ref.rope.setAttribute('x1', f1(arm.e[0])); ref.rope.setAttribute('y1', f1(arm.e[1])); }
  }

  /** Pose at progress u in [0,1) of the looping cycle. */
  function frame(tpl, u) {
    const K = tpl.poses;
    const seq = tpl.loop ? K.concat([K[0]]) : K.concat(K.slice(0, -1).reverse());
    const n = seq.length - 1;
    const x = (((u % 1) + 1) % 1) * n, i = Math.min(n - 1, Math.floor(x));
    let s = x - i;
    s = Math.min(1, Math.max(0, (s - 0.1) / 0.8));        // brief hold at each end
    s = (1 - Math.cos(Math.PI * s)) / 2;
    return mix(seq[i], seq[i + 1], s);
  }

  /* ── mounting & the shared animation loop ── */
  const live = new Set();
  let raf = 0, io = null;
  function loop(ts) {
    for (const m of live) {
      if (!m.host.isConnected) { live.delete(m); continue; }
      if (!m.vis || m.reduce) continue;
      draw(m.ref, frame(m.tpl, (ts % m.tpl.dur || 0) / m.tpl.dur + m.phase), m.tpl);
    }
    raf = live.size && !document.hidden ? requestAnimationFrame(loop) : 0;
  }
  const kick = () => { if (!raf && live.size) raf = requestAnimationFrame(loop); };
  document.addEventListener('visibilitychange', kick);

  function mount(host, name, held, label, muscle) {
    const tpl = T[name];
    if (!tpl) return;
    tpl.dur = tpl.dur || 2800;
    const ref = build(host, name, held, label, muscle);
    const m = { host, ref, tpl, phase: 0, vis: true, reduce: window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches };
    draw(ref, frame(tpl, m.reduce ? 0 : 0.5), tpl);      // paint something immediately
    if (m.reduce) draw(ref, frame(tpl, 0.25), tpl);
    if ('IntersectionObserver' in window) {
      io = io || new IntersectionObserver((es) => es.forEach((e) => { const mm = e.target.__wpa; if (mm) { mm.vis = e.isIntersecting; if (mm.vis) kick(); } }), { rootMargin: '80px' });
      host.__wpa = m; m.vis = false; io.observe(host);
    }
    live.add(m); kick();
  }

  /** Mount every <div class="anim" data-ex="…"> under root that isn't mounted yet. */
  function hydrate(root = document) {
    root.querySelectorAll('.anim:not([data-on])').forEach((el) => {
      const ex = typeof EX_BY_ID !== 'undefined' && EX_BY_ID[el.dataset.ex];
      if (!ex) return;
      const spec = WPA.forExercise(ex);
      el.dataset.on = '1';
      mount(el, spec.tpl, spec.held, `How to do ${ex.name}`, ex.muscle);
    });
  }

  /** Static render (for tests / contact sheets). */
  function still(host, name, u, held, muscle) {
    const ref = build(host, name, held || false, name, muscle);
    draw(ref, frame(T[name], u), T[name]);
  }

  return { pose, fpose, add, T, S, H, A, G, line, rect, bench, box, bar, wall, mount, hydrate, still, GY, forExercise: null };
})();

if (typeof module !== 'undefined') module.exports = WPA;
