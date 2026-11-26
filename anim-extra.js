/* Movement templates — accuracy pass 2: fixes for poses that showed the wrong movement or only part of it,
   plus new templates (suspension trainer, L-sit, box jump, seated leg curl, standing cable row).
   Loaded after the other anim-*.js files, so a template added here replaces the older one of the same name. */
(() => {
  const { pose, fpose, add, S, H, A, G, line, rect, bench } = WPA;
  const GY = WPA.GY;
  const stand = (o = {}) => pose({ hip: [80, 57], t: 0, foot: G(80), ...o });
  const lie = (o = {}) => pose({ hip: [56, 73], t: 90, foot: G(36), kb: 1, ...o });
  const floorLie = (o = {}) => pose({ hip: [56, 91], t: 90, foot: G(38), kb: 1, ...o });
  const seat = (o = {}) => pose({ hip: [60, 76], t: 0, foot: A(79, 94), ...o });
  const BENCH = bench(42, 100, 76);
  const SEAT = rect(46, 78, 28, 3) + line(50, 81, 50, 94) + line(70, 81, 70, 94) + line(54, 78, 54, 36, 3);

  /** Straight body standing on footX, leaning by `a` degrees (positive = leaning back, away from where the figure faces). */
  function lean(footX, a, o = {}) {
    const r = (a * Math.PI) / 180;
    const hip = [footX - 37 * Math.sin(r), GY - 37 * Math.cos(r)];
    return pose({ hip, t: -a, foot: G(footX), ...o });
  }

  /* ── chest ── */
  // Dumbbell fly: arms start straight up over the chest, then open wide so the hands sink beside the bench.
  add('fly_lying', { static: BENCH, poses: [lie({ hand: S(1, -24), eb: -1 }), lie({ hand: S(-3, 16), eb: -1 })] });
  // Cable crossover / chest fly seen from the front: arms wide and high, hands meet in front of the hips.
  add('fly_stand', { poses: [fpose({ a: [100, 112] }), fpose({ a: [-8, -32] })] });
  add('fly_lowhigh', { poses: [fpose({ a: [42, 30] }), fpose({ a: [-20, -70] })] });
  // Pec deck from the front, seated: elbows open wide, then squeeze together in front of the chest.
  add('fly_seated', {
    static: rect(68, 33, 24, 30),
    poses: [fpose({ hy: 12, a: [82, 170], f: [70, 94], f2: [90, 94] }), fpose({ hy: 12, a: [20, 150], f: [70, 94], f2: [90, 94] })],
  });

  /* ── back ── */
  // Inverted row: hang under the bar with straight arms, then pull the chest up to it; body stays straight.
  add('inverted_row', {
    held: false,
    static: line(84, 52, 104, 52, 2.5) + line(104, 52, 104, 94, 2),
    poses: [WPA.planked(46, 94, 77, { hand: A(93, 52), eb: 1 }), WPA.planked(46, 94, 61, { hand: A(93, 52), eb: -1 })],
  });
  // Deadlift: hips back, shins near vertical, bar against the shins; stand tall with the bar at the hips.
  add('deadlift', {
    poses: [pose({ hip: [62, 68], t: 70, foot: G(80), hand: S(0, 25) }), stand({ hand: S(2, 25) })],
  });
  // Standing cable row: pulley in front at chest height, row the handle to the ribs.
  add('row_stand', {
    anchor: [140, 50],
    poses: [pose({ hip: [80, 58], t: 10, foot: G(86), foot2: G(70), hand: S(24, 2) }), pose({ hip: [80, 58], t: 2, foot: G(86), foot2: G(70), hand: S(-2, 12), eb: 1 })],
  });

  /* ── suspension trainer (straps from a high anchor) ── */
  const TRX_FRONT = [138, 6], TRX_BACK = [22, 6];
  add('trx_row', {
    anchor: TRX_FRONT, rope: true, held: false,
    poses: [lean(96, 36, { hand: S(20, -12) }), lean(96, 22, { hand: S(4, 6), eb: 1 })],
  });
  add('trx_curl', {
    anchor: TRX_FRONT, rope: true, held: false,
    poses: [lean(96, 36, { hand: S(20, -13) }), lean(96, 24, { hand: S(8, -12), eb: -1 })],
  });
  add('trx_press', {
    anchor: TRX_BACK, rope: true, held: false,
    poses: [lean(62, -26, { hand: S(24, 3) }), lean(62, -40, { hand: S(4, 4), eb: -1 })],
  });
  add('trx_tri', {
    anchor: TRX_BACK, rope: true, held: false,
    poses: [lean(62, -30, { hand: S(22, -9) }), lean(62, -38, { hand: S(4, -10), eb: 1 })],
  });

  /* ── anti-rotation ── */
  // Pallof press from the front: cable pulls from the side; press the handle straight out from the chest and back
  // (arms pointing at you look short) while the torso stays square.
  add('pallof', {
    anchor: [136, 47],
    poses: [fpose({ a: [5, -122] }), fpose({ a: [-50, -50], fs: 0.47 })],   // both hands on one handle at the centre of the chest
  });

  /* ── arms ── */
  // Preacher curl: upper arm resting on a sloped pad, curl from straight arm to the shoulder.
  add('preacher', {
    static: SEAT.replace(line(54, 78, 54, 36, 3), '') + line(66, 66, 82, 74, 4) + line(76, 72, 76, 94, 2),
    poses: [seat({ t: 14, hand: S(25, 9) }), seat({ t: 14, hand: S(9, -6), eb: -1 })],
  });

  /* ── legs ── */
  add('leg_curl_seated', {
    static: SEAT,
    poses: [seat({ foot: A(100, 80), hand: S(10, 18) }), seat({ foot: A(73, 92), hand: S(10, 18) })],
  });
  add('box_jump', {
    static: rect(98, 68, 28, GY - 68),
    poses: [
      pose({ hip: [66, 70], t: 32, foot: G(76), hand: S(-14, 18) }),
      pose({ hip: [92, 42], t: 8, foot: A(100, 62), kb: -1, hand: S(16, 2) }),
      pose({ hip: [106, 48], t: 4, foot: A(110, 68), hand: S(4, 22) }),
    ],
  });

  /* ── core ── */
  // V-up: from flat, lift legs and torso together and reach for the feet, balancing on the hips.
  add('v_up', {
    poses: [floorLie({ foot: A(19, 91), hand: S(24, 0) }), pose({ hip: [60, 88], t: 42, nk: 10, foot: A(40, 58), hand: A(44, 58) })],
  });
  add('situp', {
    poses: [floorLie({ hand: S(6, -6) }), pose({ hip: [56, 91], t: 18, foot: G(36), kb: 1, hand: S(6, -6) })],
  });
  // L-sit on push-up handles: arms straight, hips lifted, legs held out.
  const HANDLES = rect(64, 87, 14, 3) + line(66, 90, 66, 94, 1.5) + line(76, 90, 76, 94, 1.5);
  add('lsit', {
    static: HANDLES,
    poses: [pose({ hip: [70, 84], t: 6, foot: A(106, 82), hand: A(71, 86) }), pose({ hip: [70, 82], t: 6, foot: A(106, 80), hand: A(71, 86) })],
  });
  add('tuck_hold', {
    static: HANDLES,
    poses: [pose({ hip: [70, 84], t: 6, foot: A(86, 86), hand: A(71, 86) }), pose({ hip: [70, 82], t: 6, foot: A(86, 83), hand: A(71, 86) })],
  });
  // Russian twist from the front: seated and leaning back, hands sweep from one hip to the other.
  add('russian_twist', {
    poses: [
      fpose({ hy: 22, sy: 4, hx: 3, a: [38, 70], a2: [-26, -40], f: [72, 80], f2: [88, 80] }),
      fpose({ hy: 22, sy: 4, hx: -3, a: [-26, -40], a2: [38, 70], f: [72, 80], f2: [88, 80] }),
    ],
  });
  // Kneeling push-up: knees down, body straight from knees to head.
  const kneel = (shY, kb) => {
    const b = WPA.incl(70, 94, shY), kx = b.hip[0] - Math.sqrt(Math.max(0, 19 * 19 - (92 - b.hip[1]) ** 2));
    return pose({ hip: b.hip, t: b.t, foot: A(kx - 17.5, 91.5), hand: A(100, 94), kb });
  };
  add('kneel_pushup', { poses: [kneel(70, 1), kneel(86, 1)] });

  /* ── glute bridges: head and shoulders stay on the floor at the top ── */
  add('bridge', {
    poses: [
      pose({ hip: [56, 88], t: 90, foot: G(40), kb: 1, hand: A(72, 92) }),
      pose({ hip: [56, 76], t: 123, nk: -33, foot: G(40), kb: 1, hand: A(72, 92) }),
    ],
  });
  // Frog pump: soles together close to the hips, knees dropped out; short, quick bridges.
  add('frog_pump', {
    poses: [
      pose({ hip: [58, 89], t: 90, foot: A(47, 93), kb: 1, hand: A(74, 92) }),
      pose({ hip: [58, 80], t: 112, nk: -22, foot: A(47, 93), kb: 1, hand: A(74, 92) }),
    ],
  });
  // Russian twist from the front: seated V with knees up, hands together sweeping from hip to hip.
  const tw = (side) => fpose({ hy: 29, sy: 7, hx: side * 2.5, k: [91, 73], k2: [69, 73], f: [84, 89], f2: [76, 89],
    h: [80 + side * 21, 86], h2: [80 + side * 21, 86] });
  add('russian_twist', { poses: [tw(1), tw(-1)] });

  /* ── front views become the main view where the side view hides the movement ── */
  ['side_lunge_f', 'abduct_f', 'adduct_f', 'ext_rotation_f'].forEach((n) => { if (WPA.T[n]) delete WPA.T[n].front; });
})();
