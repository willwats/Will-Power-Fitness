/* Movement templates — upper body (chest, back, shoulders, arms). Figure faces right. */
(() => {
  const { pose, fpose, add, S, H, A, G, line, rect, bench, box, bar } = WPA;

  const stand = (o = {}) => pose({ hip: [80, 57], t: 0, foot: G(80), ...o });
  const lie = (o = {}) => pose({ hip: [56, 73], t: 90, foot: G(36), kb: 1, ...o });        // on a flat bench
  const floorLie = (o = {}) => pose({ hip: [56, 91], t: 90, foot: G(38), kb: 1, ...o });
  const seat = (o = {}) => pose({ hip: [60, 76], t: 0, foot: A(79, 94), ...o });
  const BENCH = bench(42, 100, 76);
  const SEAT = rect(46, 78, 28, 3) + line(50, 81, 50, 94) + line(70, 81, 70, 94) + line(54, 78, 54, 36, 3);
  const SEAT_LOW = rect(46, 78, 28, 3) + line(50, 81, 50, 94) + line(70, 81, 70, 94);

  /** Straight body from a foot point to a given shoulder height (push-up / row style). */
  function incl(fx, fy, shY) {
    const L = 61, dy = fy - shY, dx = Math.sqrt(L * L - dy * dy), ux = dx / L, uy = dy / L;
    return { hip: [fx + 37 * ux, fy - 37 * uy], t: (Math.atan2(ux, uy) * 180) / Math.PI };
  }
  const planked = (fx, fy, shY, o = {}) => { const b = incl(fx, fy, shY); return pose({ hip: b.hip, t: b.t, foot: A(fx, fy), ...o }); };
  WPA.incl = incl; WPA.planked = planked;

  /* ───────── push ───────── */
  add('pushup', { poses: [planked(44, 94, 69, { hand: A(102, 94) }), planked(44, 94, 84, { hand: A(102, 94) })] });
  add('pushup_incline', {
    static: box(74, 98, 70),
    poses: [planked(40, 94, 45, { hand: A(83, 70) }), planked(40, 94, 60, { hand: A(83, 70) })],
  });
  add('pushup_decline', {
    static: box(14, 44, 70),
    poses: [planked(30, 70, 69, { hand: A(91, 94) }), planked(30, 70, 81, { hand: A(91, 94) })],
  });
  add('pike', {
    poses: [
      pose({ hip: [78, 64], t: 104, foot: G(58), hand: A(108, 94) }),
      pose({ hip: [78, 64], t: 132, nk: 25, foot: G(58), hand: A(108, 94) }),
    ],
  });

  add('bench', { static: BENCH, poses: [lie({ hand: S(0, -5), eb: -1 }), lie({ hand: S(0, -24), eb: -1 })] });
  add('bench_incline', {
    static: rect(44, 74, 16, 3) + line(46, 77, 46, 94) + line(58, 77, 58, 94) + line(52, 77, 85, 46, 4),
    poses: [
      pose({ hip: [58, 71], t: 55, foot: G(38), kb: 1, hand: S(3, -5), eb: -1 }),
      pose({ hip: [58, 71], t: 55, foot: G(38), kb: 1, hand: S(0, -24), eb: -1 }),
    ],
  });
  add('floor_press', { poses: [floorLie({ hand: S(0, -5), eb: -1 }), floorLie({ hand: S(0, -23), eb: -1 })] });
  add('fly_lying', { static: BENCH, poses: [lie({ hand: S(2, -24), eb: -1 }), lie({ hand: S(10, -3), eb: 1 })] });
  add('pullover', { static: BENCH, poses: [lie({ hand: S(0, -24), eb: 1 }), lie({ hand: S(28, 6), eb: 1 })] });
  add('fly_seated', {
    static: SEAT,
    poses: [seat({ hand: S(0, 2), eb: 1 }), seat({ hand: S(24, -1), eb: 1 })],
  });
  add('seated_press', {
    static: SEAT,
    poses: [seat({ hand: S(6, 2) }), seat({ hand: S(24, -2) })],
  });
  add('fly_stand', {
    anchor: [136, 10],
    poses: [stand({ t: 8, hand: S(-6, 4) }), stand({ t: 8, hand: S(18, 18) })],
  });
  add('fly_lowhigh', {
    anchor: [30, 90],
    poses: [stand({ t: 5, hand: S(4, 24) }), stand({ t: 5, hand: S(18, -6) })],
  });
  add('press_stand', {
    anchor: [20, 40],
    poses: [stand({ hand: S(6, 3) }), stand({ hand: S(24, -1) })],
  });
  add('dip', {
    static: line(70, 52, 98, 52, 2.5) + line(98, 52, 98, 94, 2),
    poses: [
      pose({ hip: [84, 51], t: 0, foot: H(-12, 27), hand: A(84, 52) }),
      pose({ hip: [84, 65], t: 12, foot: H(-12, 27), hand: A(84, 52) }),
    ],
  });
  add('bench_dip', {
    static: bench(30, 66, 76),
    poses: [
      pose({ hip: [70, 74], t: -14, foot: G(98), hand: A(64, 76) }),
      pose({ hip: [70, 86], t: -14, foot: G(98), hand: A(64, 76) }),
    ],
  });

  /* ───────── pull ───────── */
  // bar at y=22; knees bent so the feet clear the floor
  const hang = (y, o = {}) => pose({ hip: [80, y + 49], t: 0, foot: H(-15, 19), hand: A(80, 22), ...o });
  add('pullup', { static: bar(60, 100, 22), poses: [hang(22), hang(5, { eb: -1 })] });
  add('dead_hang', { static: bar(60, 100, 22), poses: [hang(22), hang(20)] });
  add('inverted_row', {
    static: line(86, 58, 100, 58, 2.5) + line(100, 58, 100, 94, 2),
    poses: [planked(30, 94, 84, { hand: A(92, 58), eb: -1 }), planked(30, 94, 64, { hand: A(92, 58), eb: -1 })],
  });
  add('row_bent', {
    poses: [
      pose({ hip: [68, 56], t: 60, foot: G(74), hand: S(2, 25) }),
      pose({ hip: [68, 56], t: 60, foot: G(74), hand: S(-6, 14) }),
    ],
  });
  add('deadlift', {
    poses: [
      pose({ hip: [56, 74], t: 65, foot: G(78), hand: A(78, 88) }),
      stand({ hand: S(2, 25) }),
    ],
  });
  add('row_onearm', {
    static: bench(50, 94, 76),
    poses: [
      pose({ hip: [62, 60], t: 75, foot: G(60), hand: S(2, 24), hand2: A(86, 76) }),
      pose({ hip: [62, 60], t: 75, foot: G(60), hand: S(-8, 10), hand2: A(86, 76) }),
    ],
  });
  add('row_chest_supported', {
    static: line(66, 72, 84, 42, 5),
    poses: [
      pose({ hip: [60, 62], t: 35, foot: G(58), hand: S(8, 25) }),
      pose({ hip: [60, 62], t: 35, foot: G(58), hand: S(-2, 12) }),
    ],
  });
  add('renegade', {
    poses: [
      planked(44, 94, 69, { hand: A(102, 94) }),
      planked(44, 94, 69, { hand: S(-12, 8), hand2: A(102, 94) }),
    ],
  });
  add('pulldown', {
    rope: true, anchor: [76, 4], static: SEAT_LOW,
    poses: [seat({ hand: S(8, -25) }), seat({ hand: S(10, -7) })],
  });
  add('row_seated', {
    rope: true, anchor: [146, 84], static: SEAT_LOW + line(104, 70, 104, 94, 3),
    poses: [
      seat({ foot: A(98, 90), hand: S(24, 3) }),
      seat({ foot: A(98, 90), hand: S(6, 10) }),
    ],
  });
  add('straightarm_pd', {
    rope: true, anchor: [100, 4],
    poses: [stand({ t: 10, hand: S(14, -20) }), stand({ t: 10, hand: S(4, 22) })],
  });
  add('superman', {
    poses: [
      pose({ hip: [56, 90], t: 90, foot: A(19, 90), hand: S(25, 0) }),
      pose({ hip: [56, 90], t: 78, nk: -12, foot: A(19, 83), hand: S(25, -4) }),
    ],
  });

  /* ───────── shoulders ───────── */
  add('ohp', { poses: [stand({ hand: S(6, -4) }), stand({ hand: S(2, -25) })] });
  add('ohp_seated', { static: SEAT, poses: [seat({ hand: S(6, -4) }), seat({ hand: S(2, -25) })] });
  add('push_press', {
    poses: [stand({ hand: S(6, -4) }), pose({ hip: [80, 65], t: 0, foot: G(80), hand: S(6, -4) }), stand({ hand: S(2, -25) })],
  });
  add('front_raise', { poses: [stand({ hand: S(2, 24) }), stand({ hand: S(24, -4) })] });
  add('face_pull', {
    rope: true, anchor: [138, 32],
    poses: [stand({ hand: S(22, -3) }), stand({ hand: S(6, -9), eb: -1 })],
  });
  add('upright_row', { poses: [stand({ hand: S(3, 22) }), stand({ hand: S(6, -3), eb: -1 })] });
  add('halo', {
    loop: true, dur: 3600,
    poses: [stand({ hand: S(10, -8) }), stand({ hand: S(0, -18) }), stand({ hand: S(-10, -8) }), stand({ hand: S(0, 0) })],
  });
  // front-view figures
  add('lat_raise', { poses: [fpose({ a: [6, 4] }), fpose({ a: [86, 84] })] });
  add('rear_fly', { poses: [fpose({ sy: 12, a: [4, 4] }), fpose({ sy: 12, a: [84, 82] })] });
  add('shrug', { poses: [fpose({ a: [4, 4] }), fpose({ sy: -5, a: [4, 4] })] });
  add('pullapart', { poses: [fpose({ a: [20, -110] }), fpose({ a: [88, 88] })] });

  /* ───────── arms ───────── */
  add('curl', { poses: [stand({ hand: S(1, 24) }), stand({ hand: S(10, -5) })] });
  add('curl_incline', {
    static: rect(44, 74, 16, 3) + line(46, 77, 46, 94) + line(58, 77, 58, 94) + line(52, 77, 85, 46, 4),
    poses: [
      pose({ hip: [58, 71], t: 55, foot: G(38), kb: 1, hand: S(-2, 25) }),
      pose({ hip: [58, 71], t: 55, foot: G(38), kb: 1, hand: S(10, -5) }),
    ],
  });
  add('conc_curl', {
    static: rect(52, 78, 34, 3) + line(56, 81, 56, 94) + line(82, 81, 82, 94),
    poses: [
      pose({ hip: [70, 75], t: 40, foot: A(88, 94), hand: S(2, 24) }),
      pose({ hip: [70, 75], t: 40, foot: A(88, 94), hand: S(12, -2) }),
    ],
  });
  add('spider_curl', {
    static: line(66, 72, 84, 42, 5),
    poses: [
      pose({ hip: [60, 62], t: 35, foot: G(58), hand: S(8, 25) }),
      pose({ hip: [60, 62], t: 35, foot: G(58), hand: S(14, 7) }),
    ],
  });
  add('oh_ext', { poses: [stand({ hand: S(2, -25) }), stand({ hand: S(-8, -6) })] });
  add('skull', { static: BENCH, poses: [lie({ hand: S(0, -24), eb: -1 }), lie({ hand: S(8, -10), eb: -1 })] });
  add('pushdown', {
    rope: true, anchor: [92, 6],
    poses: [stand({ hand: S(12, -2) }), stand({ hand: S(3, 24) })],
  });
  add('kickback', {
    poses: [
      pose({ hip: [68, 57], t: 65, foot: G(72), hand: S(-4, 10) }),
      pose({ hip: [68, 57], t: 65, foot: G(72), hand: S(-23, 2) }),
    ],
  });
  add('wrist_curl', {
    static: rect(52, 78, 34, 3) + line(56, 81, 56, 94) + line(82, 81, 82, 94),
    poses: [seat({ t: 20, hip: [62, 76], hand: S(18, 22) }), seat({ t: 20, hip: [62, 76], hand: S(19, 16) })],
  });
  add('carry', {
    poses: [
      stand({ hand: S(0, 25), foot: G(68), foot2: G(92) }),
      stand({ hand: S(0, 25), foot: G(92), foot2: G(68) }),
    ],
  });
})();
