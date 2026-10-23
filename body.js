/* Will Power Fitness — body profile maths and training focus options (pure logic, no DOM). */
const BODY = (() => {
  /* kcal = daily energy vs maintenance; cardioMin = weekly cardio minutes to aim for; goal = sets/reps style */
  const FOCUS = [
    { id: 'bulk', name: 'Build muscle', tag: 'Bulk', goal: 'hypertrophy', kcal: 300, cardioMin: 60,
      blurb: 'Lift for size and eat a little above maintenance. Easy cardio keeps your heart healthy without eating into gains.',
      tips: ['Muscle-building sets and reps (8–10 on big lifts)', 'About 60 min of easy cardio a week', 'Roughly +300 kcal/day over maintenance'] },
    { id: 'cut', name: 'Get lean', tag: 'Cut', goal: 'hypertrophy', kcal: -500, cardioMin: 150,
      blurb: 'Lose fat while keeping your muscle. Keep lifting heavy, add steady cardio and eat a moderate deficit.',
      tips: ['Keep weights heavy to hold on to muscle', 'About 150 min of cardio a week (walks count)', 'Roughly −500 kcal/day under maintenance'] },
    { id: 'strength', name: 'Get stronger', tag: 'Strength', goal: 'strength', kcal: 0, cardioMin: 45,
      blurb: 'Heavy, low-rep work on the big lifts with long rests. Cardio stays light so recovery goes into the barbell.',
      tips: ['5×5 style sets with longer rests', 'About 45 min of easy cardio a week', 'Eat around maintenance'] },
    { id: 'recomp', name: 'Lean & muscular', tag: 'Recomp', goal: 'hypertrophy', kcal: 0, cardioMin: 120,
      blurb: 'Slowly add muscle and drop fat at the same time. Best if you’re newer to lifting or coming back after a break.',
      tips: ['Muscle-building sets and reps', 'About 120 min of cardio a week', 'Eat around maintenance, high protein'] },
    { id: 'athletic', name: 'Athletic & conditioned', tag: 'Athletic', goal: 'endurance', kcal: 0, cardioMin: 180,
      blurb: 'Higher reps, shorter rests and plenty of cardio — built for stamina, moving well and feeling fit.',
      tips: ['Higher-rep, shorter-rest sets', 'About 180 min of cardio a week', 'Eat around maintenance'] },
  ];
  const FOCUS_BY_ID = Object.fromEntries(FOCUS.map((f) => [f.id, f]));
  const DEFAULT_CARDIO_MIN = 150;                         // general health guideline when no focus is chosen

  const LB = 0.45359237;
  const kgOf = (v, units) => (units === 'kg' ? v : v * LB);
  const fromKg = (kg, units) => (units === 'kg' ? kg : kg / LB);
  const cmFrom = (ft, inch) => Math.round(((ft || 0) * 12 + (inch || 0)) * 2.54);
  const ftIn = (cm) => { const t = Math.round(cm / 2.54); return { ft: Math.floor(t / 12), inch: t % 12 }; };
  const bmi = (cm, kg) => (cm > 0 && kg > 0 ? kg / Math.pow(cm / 100, 2) : 0);

  /** What the numbers say: distance to ideal weight, a suggested focus, and a rough timeline. */
  function plan(body, weight, units) {
    const cm = body.heightCm || 0, kg = kgOf(weight || 0, units), idealKg = kgOf(body.ideal || 0, units);
    const out = { bmi: bmi(cm, kg), idealBmi: bmi(cm, idealKg), diffKg: 0, diff: 0, suggest: null, weeks: null, notes: [], focus: FOCUS_BY_ID[body.focus] || null };
    if (!kg || !idealKg) return out;
    out.diffKg = idealKg - kg;
    out.diff = fromKg(Math.abs(out.diffKg), units);
    const rel = out.diffKg / kg;
    out.suggest = rel < -0.04 ? 'cut' : rel > 0.03 ? 'bulk' : 'recomp';
    const f = out.focus;
    if (f && f.kcal !== 0) {
      const weekly = (Math.abs(f.kcal) * 7) / 7700;           // kg per week at that surplus / deficit
      const right = (f.kcal > 0) === (out.diffKg > 0);
      if (Math.abs(out.diffKg) < 0.5) out.notes.push('You’re already at your ideal weight — switch to maintenance or recomp to hold it.');
      else if (right) out.weeks = Math.max(1, Math.round(Math.abs(out.diffKg) / weekly));
      else out.notes.push(f.kcal > 0 ? 'Your ideal weight is below your current weight, so a bulk would move you away from it.' : 'Your ideal weight is above your current weight, so a cut would move you away from it.');
    }
    if (out.idealBmi && out.idealBmi < 18.5) out.notes.push('That ideal weight is very low for your height. Check it with a doctor before aiming for it.');
    return out;
  }

  /** Weekly cardio target (minutes) and progress from the last 7 days. */
  function cardioWeek(state, now = Date.now()) {
    const f = FOCUS_BY_ID[(state.body || {}).focus];
    const target = f ? f.cardioMin : DEFAULT_CARDIO_MIN;
    const since = now - 7 * 86400000;
    const done = Math.round((state.cardio || []).filter((c) => c.date >= since && c.date <= now + 3600000).reduce((t, c) => t + c.dur / 60, 0));
    return { target, done, pct: Math.min(100, Math.round((done / target) * 100)), focus: f || null };
  }

  return { FOCUS, FOCUS_BY_ID, kgOf, fromKg, cmFrom, ftIn, bmi, plan, cardioWeek, DEFAULT_CARDIO_MIN };
})();

if (typeof module !== 'undefined') module.exports = BODY;
