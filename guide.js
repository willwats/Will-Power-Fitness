/* Will Power Fitness — plain-language form guide text for the exercise "Form guide" sheet. */
const GUIDE = (() => {
  const TIPS = {
    chest: ['Pull your shoulder blades back and down before every rep — it protects your shoulders.', 'Lower under control (about 2–3 seconds) and never bounce off your chest.', 'Keep your wrists straight and stacked over your elbows.'],
    back: ['Start each rep by pulling with your elbows, not your hands.', 'Keep your shoulders down and away from your ears — no shrugging.', 'Keep your spine long and don’t swing to move the weight.'],
    shoulders: ['Keep your ribs down and glutes tight so your lower back doesn’t arch.', 'On raises, stop at shoulder height — going higher just shrugs.', 'Use lighter weight than you think; shoulders tire fast.'],
    biceps: ['Keep your elbows pinned to your sides.', 'No swinging — if you need momentum, the weight is too heavy.', 'Lower slowly; that half builds the most muscle.'],
    triceps: ['Keep your upper arms still; only the forearms move.', 'Fully straighten your elbows at the finish.', 'Don’t let your elbows flare out wide.'],
    forearms: ['Use a light weight and the full range of motion.', 'Let the wrist extend fully on the way down.', 'Rest your forearms on something so only the wrist moves.'],
    core: ['Breathe out as you crunch or lift; never hold your breath.', 'On floor moves, keep your lower back pressed into the floor.', 'Slow and controlled beats fast and swingy — don’t pull on your neck.'],
    quads: ['Keep your knees tracking over your toes, not caving in.', 'Keep your chest up and your heels flat.', 'Go only as deep as you can control with a flat back.'],
    hamstrings: ['Hinge at the hips with a flat back — don’t round it.', 'Keep a soft bend in your knees, not locked.', 'Feel the stretch behind your thighs, then squeeze to come back up.'],
    glutes: ['Squeeze your glutes hard at the top.', 'Tuck your ribs so your lower back doesn’t arch.', 'Drive through your heels.'],
    calves: ['Pause at the top and bottom for a full squeeze and stretch.', 'Move slowly — no bouncing.', 'Keep your weight over the ball of your foot.'],
  };
  const LEVEL = ['', 'Beginner friendly', 'Intermediate', 'Advanced — build up to it'];

  /** Numbered instructions that match the ① start / ② finish markers on the animation. */
  function steps(ex, tpl, gear) {
    const out = [];
    out.push(gear ? `Set up: ${gear}. Start light while you learn the movement.` : 'Set up: no equipment needed — clear some floor space.');
    if (ex.timed) {
      out.push(`Get into the position shown (①). ${ex.cue}`);
      out.push('Hold it for the full time, breathing steadily. Stop the set if your form breaks down.');
      return out;
    }
    out.push(`Start in position ① — the first ghost. ${ex.cue}`);
    if (tpl && tpl.loop) {
      out.push('Repeat the motion shown at a steady, controlled pace.');
    } else {
      out.push('Move smoothly to position ② over 1–2 seconds. Keep the rest of your body still.');
      out.push('Pause for a beat, then return slowly (2–3 seconds). Don’t let the weight drop or bounce.');
    }
    out.push('Breathe out on the hard part, in on the way back.');
    return out;
  }
  const tips = (ex) => TIPS[ex.muscle] || [];

  return { steps, tips, LEVEL };
})();

if (typeof module !== 'undefined') module.exports = GUIDE;
