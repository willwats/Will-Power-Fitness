/* Movement templates — core. Figure faces right. */
(() => {
  const { pose, add, S, H, A, G, line, rect } = WPA;
  const stand = (o = {}) => pose({ hip: [80, 57], t: 0, foot: G(80), ...o });
  const floorLie = (o = {}) => pose({ hip: [56, 91], t: 90, foot: G(38), kb: 1, ...o });
  const hang = (y, o = {}) => pose({ hip: [80, y + 49], t: 0, foot: A(80, 93), hand: A(80, 8), ...o });
  const BAR = line(60, 8, 100, 8, 2.5) + line(60, 8, 60, 94, 1.5) + line(100, 8, 100, 94, 1.5);

  add('plank', {
    poses: [
      WPA.planked(44, 94, 80, { hand: A(113, 92) }),
      WPA.planked(44, 94, 78, { hand: A(113, 92) }),
    ],
  });
  add('dead_bug', {
    poses: [
      floorLie({ foot: A(38, 71), foot2: A(20, 88), hand: S(0, -23), hand2: S(24, 2) }),
      floorLie({ foot: A(20, 88), foot2: A(38, 71), hand: S(24, 2), hand2: S(0, -23) }),
    ],
  });
  const quad = (o) => pose({ hip: [72, 69], t: 90, hand: A(96, 94), ...o });
  add('bird_dog', {
    poses: [
      quad({ foot: A(58, 90), foot2: A(58, 90) }),
      quad({ foot: A(58, 90), foot2: A(36, 62), hand: S(25, -2), hand2: A(96, 94) }),
    ],
  });
  add('crunch', {
    poses: [floorLie({ hand: S(8, -5) }), pose({ hip: [56, 91], t: 68, nk: -10, foot: G(38), kb: 1, hand: S(8, -5) })],
  });
  add('situp', {
    poses: [floorLie({ hand: S(8, -5) }), pose({ hip: [56, 91], t: 12, foot: G(38), kb: 1, hand: S(8, -5) })],
  });
  add('bicycle', {
    poses: [
      pose({ hip: [56, 91], t: 68, nk: -8, foot: A(24, 88), foot2: A(50, 72), kb: 1, hand: S(8, -5) }),
      pose({ hip: [56, 91], t: 68, nk: -8, foot: A(50, 72), foot2: A(24, 88), kb: 1, hand: S(8, -5) }),
    ],
  });
  add('leg_raise_lying', {
    poses: [floorLie({ foot: A(19, 91), hand: H(0, 0) }), floorLie({ foot: A(56, 54), hand: H(0, 0) })],
  });
  add('flutter', {
    poses: [
      pose({ hip: [56, 91], t: 85, foot: A(20, 84), foot2: A(20, 76), hand: H(0, 0) }),
      pose({ hip: [56, 91], t: 85, foot: A(20, 76), foot2: A(20, 84), hand: H(0, 0) }),
    ],
  });
  add('v_up', {
    poses: [
      floorLie({ foot: A(19, 91), hand: S(24, 0) }),
      pose({ hip: [56, 86], t: -35, foot: A(36, 56), hand: A(40, 58) }),
    ],
  });
  add('hollow', {
    poses: [
      pose({ hip: [56, 91], t: 82, nk: -8, foot: A(20, 84), hand: S(24, -3) }),
      pose({ hip: [56, 91], t: 80, nk: -8, foot: A(20, 86), hand: S(24, -2) }),
    ],
  });
  add('mountain_climber', {
    poses: [
      WPA.planked(44, 94, 69, { hand: A(102, 94), foot2: A(90, 88) }),
      WPA.planked(44, 94, 69, { hand: A(102, 94), foot: A(90, 88), foot2: A(44, 94) }),
    ],
  });
  add('russian_twist', {
    poses: [
      pose({ hip: [66, 88], t: -30, foot: A(98, 74), hand: S(20, 8) }),
      pose({ hip: [66, 88], t: -30, foot: A(98, 74), hand: S(18, 20) }),
    ],
  });
  add('hang_knee', {
    static: BAR,
    poses: [hang(8), pose({ hip: [80, 57], t: -10, foot: A(98, 71), hand: A(80, 8) })],
  });
  add('hang_leg', {
    static: BAR,
    poses: [hang(8), pose({ hip: [80, 57], t: -12, foot: A(116, 58), hand: A(80, 8) })],
  });
  add('ab_wheel', {
    poses: [
      pose({ hip: [66, 76], t: 70, foot: A(54, 92), hand: A(92, 90) }),
      pose({ hip: [90, 82], t: 82, foot: A(54, 92), hand: A(120, 90) }),
    ],
  });
  add('cable_crunch', {
    rope: true, anchor: [84, 6],
    poses: [
      pose({ hip: [70, 72], t: 5, foot: A(50, 92), hand: S(6, -5) }),
      pose({ hip: [70, 74], t: 55, nk: 20, foot: A(50, 92), hand: S(4, -2) }),
    ],
  });
  add('woodchop', {
    rope: true, anchor: [112, 4],
    poses: [stand({ hand: S(8, -22) }), pose({ hip: [76, 58], t: 28, foot: G(80), hand: S(8, 14) })],
  });
  add('ball_slam', {
    poses: [stand({ hand: S(3, -25) }), pose({ hip: [70, 60], t: 70, foot: G(76), hand: A(98, 88) })],
  });
})();
