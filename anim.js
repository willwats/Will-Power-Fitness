/* Will Power Fitness — exercise animations.
 * A tiny stick-figure engine: each movement is a few key poses; the figure is drawn with
 * two-segment inverse kinematics so elbows and knees bend naturally between poses.
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

  function build(host, name, held, label) {
    const tpl = T[name];
    host.innerHTML = '';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
    svg.setAttribute('class', 'wpa');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label || 'Exercise demonstration');
    const anchor = tpl.anchor;
    svg.innerHTML = `
      <line class="gnd" x1="4" y1="${GY}" x2="156" y2="${GY}"/>
      ${tpl.static || ''}
      ${anchor && (held === 'rope' || tpl.rope) ? `<circle class="p" cx="${anchor[0]}" cy="${anchor[1]}" r="2.2"/><line class="rope" x1="0" y1="0" x2="${anchor[0]}" y2="${anchor[1]}"/>` : ''}
      <polyline class="far" data-r="fa"/><polyline class="far" data-r="fl"/>
      <polyline class="near" data-r="tr"/><polyline class="near" data-r="ar"/><polyline class="near" data-r="lg"/>
      <circle class="head" r="${HEAD_R}"/>
      ${held && held !== 'rope' && !tpl.rope && HELD[held] ? `<g class="held">${HELD[held]}</g>` : ''}`;
    host.appendChild(svg);
    const q = (s) => svg.querySelector(s);
    const ref = {
      svg, fa: q('[data-r=fa]'), fl: q('[data-r=fl]'), tr: q('[data-r=tr]'), ar: q('[data-r=ar]'), lg: q('[data-r=lg]'),
      head: q('.head'), held: q('.held'), rope: q('.rope'),
    };
    return ref;
  }

  const pts = (a) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

  function drawFront(ref, p) {
    const hipY = 57 + p.hy, neckY = hipY - 24 + p.sy;
    const arm = (sx, a, dir) => {
      const s0 = [sx, neckY + 2];
      const e = [s0[0] + dir * UA * Math.sin(rad(a[0])), s0[1] + UA * Math.cos(rad(a[0]))];
      return [s0, e, [e[0] + dir * FA * Math.sin(rad(a[1])), e[1] + FA * Math.cos(rad(a[1]))]];
    };
    const leg = (x, g, dir) => {
      const f = [x + dir * 37 * Math.sin(rad(g)), hipY + 37 * Math.cos(rad(g))];
      return [[x, hipY], [(x + f[0]) / 2, (hipY + f[1]) / 2], f];
    };
    const ra = arm(89, p.a, 1), la = arm(71, p.a2, -1);
    ref.tr.setAttribute('points', pts([[80, hipY], [80, neckY], [89, neckY + 2], [71, neckY + 2]].slice(0, 2)));
    ref.ar.setAttribute('points', pts(ra));
    ref.fa.setAttribute('points', pts(la));
    ref.lg.setAttribute('points', pts(leg(85, p.g, 1)));
    ref.fl.setAttribute('points', pts(leg(75, p.g2, -1)));
    ref.head.setAttribute('cx', '80');
    ref.head.setAttribute('cy', (neckY - 7).toFixed(1));
    if (ref.held) ref.held.setAttribute('transform', `translate(${ra[2][0].toFixed(1)} ${ra[2][1].toFixed(1)})`);
    if (ref.rope) { ref.rope.setAttribute('x1', ra[2][0].toFixed(1)); ref.rope.setAttribute('y1', ra[2][1].toFixed(1)); }
  }

  function draw(ref, p, tpl) {
    if (p.v === 'f') return drawFront(ref, p);
    const sh = [p.hip[0] + LT * Math.sin(rad(p.t)), p.hip[1] - LT * Math.cos(rad(p.t))];
    const arm = ik(sh, p.hand, UA, FA, p.eb), arm2 = ik(sh, p.hand2, UA, FA, p.eb);
    const leg = ik(p.hip, p.foot, TH, SH, p.kb), leg2 = ik(p.hip, p.foot2, TH, SH, p.kb);
    ref.tr.setAttribute('points', pts([p.hip, sh]));
    ref.ar.setAttribute('points', pts([sh, arm.j, arm.e]));
    ref.fa.setAttribute('points', pts([sh, arm2.j, arm2.e]));
    ref.lg.setAttribute('points', pts([p.hip, leg.j, leg.e]));
    ref.fl.setAttribute('points', pts([p.hip, leg2.j, leg2.e]));
    const ha = rad(p.t + p.nk);
    ref.head.setAttribute('cx', (sh[0] + 9.5 * Math.sin(ha)).toFixed(1));
    ref.head.setAttribute('cy', (sh[1] - 9.5 * Math.cos(ha)).toFixed(1));
    if (ref.held) ref.held.setAttribute('transform', `translate(${arm.e[0].toFixed(1)} ${arm.e[1].toFixed(1)})`);
    if (ref.rope) { ref.rope.setAttribute('x1', arm.e[0].toFixed(1)); ref.rope.setAttribute('y1', arm.e[1].toFixed(1)); }
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

  function mount(host, name, held, label) {
    const tpl = T[name];
    if (!tpl) return;
    tpl.dur = tpl.dur || 2800;
    const ref = build(host, name, held, label);
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
      mount(el, spec.tpl, spec.held, `How to do ${ex.name}`);
    });
  }

  /** Static render (for tests / contact sheets). */
  function still(host, name, u, held) {
    const ref = build(host, name, held || false, name);
    draw(ref, frame(T[name], u), T[name]);
  }

  return { pose, fpose, add, T, S, H, A, G, line, rect, bench, box, bar, wall, mount, hydrate, still, GY, forExercise: null };
})();

if (typeof module !== 'undefined') module.exports = WPA;
