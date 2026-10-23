/* Movement templates — lower body. Figure faces right. */
(() => {
  const { pose, fpose, add, S, H, A, G, line, rect, bench, box, wall } = WPA;
  const stand = (o = {}) => pose({ hip: [80, 57], t: 0, foot: G(80), ...o });
  const seat = (o = {}) => pose({ hip: [60, 76], t: 0, foot: A(79, 94), ...o });
  const SEAT = rect(46, 78, 28, 3) + line(50, 81, 50, 94) + line(70, 81, 70, 94) + line(54, 78, 54, 36, 3);
  const SEAT_LOW = rect(46, 78, 28, 3) + line(50, 81, 50, 94) + line(70, 81, 70, 94);

  /* ───────── squats & lunges ───────── */
  const sqBottom = (hand) => pose({ hip: [64, 70], t: 40, foot: G(80), hand });
  add('squat', { poses: [stand({ hand: S(14, 2) }), sqBottom(S(14, 2))] });
  add('squat_bb', { poses: [stand({ hand: S(-5, -3) }), sqBottom(S(-5, -3))] });
  add('squat_front', { poses: [stand({ hand: S(7, -3) }), sqBottom(S(7, -3))] });
  add('jump_squat', {
    poses: [sqBottom(S(-8, 6)), pose({ hip: [80, 47], t: 0, foot: A(80, 84), hand: S(2, 24) })],
  });
  add('split_squat', {
    poses: [
      pose({ hip: [78, 58], t: 0, foot: G(92), foot2: G(64), hand: S(0, 24) }),
      pose({ hip: [78, 72], t: 0, foot: G(96), foot2: A(56, 92), hand: S(0, 24) }),
    ],
  });
  add('lunge_reverse', {
    poses: [
      stand({ hand: S(0, 24) }),
      pose({ hip: [70, 72], t: 0, foot: G(80), foot2: A(48, 92), hand: S(0, 24) }),
    ],
  });
  add('wall_sit', {
    static: wall(48),
    poses: [seat({ hip: [56, 76], hand: S(20, 6) }), seat({ hip: [56, 77], hand: S(20, 6) })],
  });
  add('pistol', {
    poses: [
      stand({ hand: S(20, 0), foot2: A(100, 68) }),
      pose({ hip: [60, 72], t: 40, foot: G(66), foot2: A(98, 70), hand: S(20, 0) }),
    ],
  });
  add('bulgarian', {
    static: bench(34, 58, 76),
    poses: [
      pose({ hip: [78, 57], t: 0, foot: G(92), foot2: A(46, 74), hand: S(0, 24) }),
      pose({ hip: [74, 70], t: 15, foot: G(94), foot2: A(46, 74), hand: S(0, 24) }),
    ],
  });
  add('step_up', {
    static: box(90, 126, 76),
    poses: [
      pose({ hip: [86, 57], t: 0, foot: G(82), foot2: A(96, 76), hand: S(0, 24) }),
      pose({ hip: [98, 39], t: 0, foot: A(98, 76), foot2: A(88, 62), hand: S(0, 24) }),
    ],
  });
  add('leg_press', {
    static: line(48, 80, 26, 62, 4) + line(84, 74, 100, 48, 3),
    poses: [
      pose({ hip: [50, 76], t: -50, foot: A(76, 64), hand: S(16, 6) }),
      pose({ hip: [50, 76], t: -50, foot: A(86, 56), hand: S(16, 6) }),
    ],
  });
  add('leg_ext', {
    static: SEAT,
    poses: [seat({ hand: S(10, 18) }), seat({ foot: A(98, 77), hand: S(10, 18) })],
  });

  /* ───────── hinges & hamstrings ───────── */
  add('rdl', {
    poses: [stand({ hand: S(2, 25) }), pose({ hip: [66, 58], t: 75, foot: G(78), hand: S(0, 25) })],
  });
  add('good_morning', {
    poses: [stand({ hand: S(-5, -3) }), pose({ hip: [66, 58], t: 75, foot: G(78), hand: S(-5, -3) })],
  });
  add('sl_rdl', {
    poses: [
      stand({ hand: S(0, 25), foot2: G(84) }),
      pose({ hip: [74, 60], t: 80, foot: G(76), foot2: A(38, 66), hand: S(0, 25) }),
    ],
  });
  add('pull_through', {
    rope: true, anchor: [20, 88],
    poses: [stand({ hand: S(2, 24) }), pose({ hip: [66, 58], t: 70, foot: G(78), hand: A(76, 76) })],
  });
  add('leg_curl', {
    static: bench(36, 96, 77),
    poses: [
      pose({ hip: [58, 74], t: 90, foot: A(21, 74), hand: S(8, 4) }),
      pose({ hip: [58, 74], t: 90, foot: A(39, 56), hand: S(8, 4) }),
    ],
  });
  const ballFoot = '<circle class="p" cx="24" cy="86" r="8"/>';
  add('bridge_curl', {
    static: ballFoot,
    poses: [
      pose({ hip: [56, 76], t: 125, foot: A(24, 86), kb: 1, hand: A(72, 92) }),
      pose({ hip: [56, 76], t: 125, foot: A(46, 87), kb: 1, hand: A(72, 92) }),
    ],
  });

  /* ───────── glutes ───────── */
  add('bridge', {
    poses: [
      pose({ hip: [56, 88], t: 90, foot: G(40), kb: 1, hand: A(72, 92) }),
      pose({ hip: [56, 76], t: 125, foot: G(40), kb: 1, hand: A(72, 92) }),
    ],
  });
  add('hip_thrust', {
    static: rect(86, 66, 34, 3) + line(90, 69, 90, 94) + line(116, 69, 116, 94),
    poses: [
      pose({ hip: [72, 84], t: 39, foot: G(46), kb: 1, hand: H(0, -3) }),
      pose({ hip: [64, 62], t: 90, foot: G(46), kb: 1, hand: H(0, -3) }),
    ],
  });
  add('donkey', {
    poses: [
      pose({ hip: [72, 69], t: 90, foot: A(58, 90), foot2: A(58, 90), hand: A(96, 94) }),
      pose({ hip: [72, 69], t: 90, foot: A(34, 62), foot2: A(58, 90), hand: A(96, 94) }),
    ],
  });
  add('kb_swing', {
    poses: [
      pose({ hip: [68, 58], t: 60, foot: G(74), hand: A(78, 70) }),
      stand({ hand: S(24, -2) }),
    ],
  });
  add('cable_kickback', {
    poses: [
      pose({ hip: [78, 57], t: 20, foot: G(78), foot2: G(78), hand: S(22, 10) }),
      pose({ hip: [78, 57], t: 20, foot: G(78), foot2: A(44, 68), hand: S(22, 10) }),
    ],
  });
  add('lateral_walk', {
    poses: [fpose({ hy: 4, a: [30, 60], g: 0, g2: 0 }), fpose({ hy: 4, a: [30, 60], g: 26, g2: 0 })],
  });

  /* ───────── calves ───────── */
  add('calf_raise', { poses: [stand({ hand: S(0, 25) }), pose({ hip: [80, 52], t: 0, foot: A(80, 89), hand: S(0, 25) })] });
  add('calf_seated', {
    static: SEAT_LOW,
    poses: [seat({ hand: S(10, 18) }), seat({ foot: A(79, 90), hand: S(10, 18) })],
  });
})();
