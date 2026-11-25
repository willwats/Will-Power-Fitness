/* Will Power Fitness — motivation & planning helpers (pure logic + one canvas drawer):
   weekly streaks, badges, deload check, routine text parser and the shareable workout image. */
const MOTIVE = (() => {
  const DAY = 86400000;
  const dayKey = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  /** Sunday-start week index (matches the weekly plan strip). */
  const weekStart = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay()); return d.getTime(); };
  const n = (v) => (Number.isFinite(+v) ? +v : 0);

  /** Every day with a logged session: { 'YYYY-MM-DD': { lift: n, cardio: n } } */
  function activeDays(state) {
    const out = {};
    for (const w of state.history || []) { const k = dayKey(w.date); (out[k] = out[k] || { lift: 0, cardio: 0 }).lift++; }
    for (const c of state.cardio || []) { const k = dayKey(c.date); (out[k] = out[k] || { lift: 0, cardio: 0 }).cardio++; }
    return out;
  }

  /** Consecutive weeks (Sun–Sat) with at least one session. This week counts once it has one; until then the streak runs to last week. */
  function streak(state, now = Date.now()) {
    const weeks = new Set(Object.keys(activeDays(state)).map((k) => weekStart(new Date(k + 'T12:00:00').getTime())));
    let w = weekStart(now), count = 0;
    const thisWeek = weeks.has(w);
    if (!thisWeek) w = weekStart(w - DAY);
    while (weeks.has(w)) { count++; w = weekStart(w - DAY); }
    let best = 0, run = 0, prev = null;
    [...weeks].sort((a, b) => a - b).forEach((x) => { run = prev !== null && Math.round((x - prev) / (7 * DAY)) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = x; });
    return { weeks: count, thisWeek, best };
  }

  /* ── badges ── */
  const setsOf = (w) => (w.exercises || []).reduce((t, e) => t + (e.sets || []).filter((s) => !s.warm).length, 0);
  const volOf = (w) => (w.exercises || []).reduce((t, e) => t + (e.sets || []).filter((s) => !s.warm).reduce((a, s) => a + n(s.w) * n(s.r), 0), 0);
  function stats(state, now = Date.now()) {
    const h = state.history || [], c = state.cardio || [];
    const units = (state.settings || {}).units || 'lb';
    const miles = c.reduce((t, x) => t + (x.dist ? (units === 'kg' ? x.dist / 1.609344 : x.dist) : 0), 0);
    const weekMuscles = {};
    h.forEach((w) => { const k = weekStart(w.date); (weekMuscles[k] = weekMuscles[k] || new Set()); (w.muscles || []).forEach((m) => weekMuscles[k].add(m)); });
    return {
      workouts: h.length, cardio: c.length, sets: h.reduce((t, w) => t + setsOf(w), 0),
      volume: h.reduce((t, w) => t + volOf(w), 0), prs: h.reduce((t, w) => t + ((w.prs || []).length), 0),
      early: h.filter((w) => new Date(w.date).getHours() < 7).length,
      miles, streak: streak(state, now).best, routines: (state.routines || []).length,
      fullWeek: Object.values(weekMuscles).some((s) => s.size >= 9),
      maxSet: h.some((w) => (w.exercises || []).some((e) => (e.sets || []).some((s) => s.max))),
    };
  }
  const BADGES = [
    { id: 'first', icon: '🎉', name: 'First workout', desc: 'Log your first workout', goal: 1, of: (s) => s.workouts },
    { id: 'w10', icon: '💪', name: 'Ten down', desc: '10 workouts', goal: 10, of: (s) => s.workouts },
    { id: 'w25', icon: '🔥', name: 'Regular', desc: '25 workouts', goal: 25, of: (s) => s.workouts },
    { id: 'w50', icon: '🏋️', name: 'Committed', desc: '50 workouts', goal: 50, of: (s) => s.workouts },
    { id: 'w100', icon: '👑', name: 'Centurion', desc: '100 workouts', goal: 100, of: (s) => s.workouts },
    { id: 's500', icon: '📈', name: '500 sets', desc: '500 working sets', goal: 500, of: (s) => s.sets },
    { id: 's2000', icon: '🧱', name: '2,000 sets', desc: '2,000 working sets', goal: 2000, of: (s) => s.sets },
    { id: 'pr1', icon: '🏆', name: 'Record breaker', desc: 'Set a personal record', goal: 1, of: (s) => s.prs },
    { id: 'pr25', icon: '🥇', name: 'PR machine', desc: '25 personal records', goal: 25, of: (s) => s.prs },
    { id: 'st4', icon: '📅', name: 'One month strong', desc: '4-week streak', goal: 4, of: (s) => s.streak },
    { id: 'st12', icon: '⚡', name: 'Unstoppable', desc: '12-week streak', goal: 12, of: (s) => s.streak },
    { id: 'c10', icon: '🏃', name: 'Cardio habit', desc: '10 cardio sessions', goal: 10, of: (s) => s.cardio },
    { id: 'mi50', icon: '🛣️', name: '50 miles', desc: '50 miles walked, run or ridden', goal: 50, of: (s) => s.miles },
    { id: 'early', icon: '🌅', name: 'Early bird', desc: '5 workouts before 7 am', goal: 5, of: (s) => s.early },
    { id: 'full', icon: '🧩', name: 'Full house', desc: 'Train 9+ muscle groups in one week', goal: 1, of: (s) => (s.fullWeek ? 1 : 0) },
    { id: 'max', icon: '🚀', name: 'All out', desc: 'Finish a max-out set', goal: 1, of: (s) => (s.maxSet ? 1 : 0) },
    { id: 'rt', icon: '🗂️', name: 'Planner', desc: 'Save a routine', goal: 1, of: (s) => s.routines },
  ];
  function badges(state, now = Date.now()) {
    const s = stats(state, now);
    return BADGES.map((b) => { const v = b.of(s); return { ...b, value: v, earned: v >= b.goal, pct: Math.min(100, Math.round((v / b.goal) * 100)) }; });
  }
  /** Badges earned now that weren't recorded before; records them (mutates state.badges). */
  function newBadges(state, now = Date.now()) {
    state.badges = state.badges || {};
    const fresh = badges(state, now).filter((b) => b.earned && !state.badges[b.id]);
    fresh.forEach((b) => { state.badges[b.id] = now; });
    return fresh;
  }

  /* ── deload ── */
  /** Suggest a lighter week after a run of hard sessions or long unbroken training. */
  function deloadCheck(state, now = Date.now()) {
    const st = state.deload || {};
    if (st.until && st.until > now) return { active: true, until: st.until };
    if (st.snooze && st.snooze > now) return null;
    const h = (state.history || []).filter((w) => w.date >= now - 14 * DAY);
    const rated = []; h.forEach((w) => (w.exercises || []).forEach((e) => { const f = (e.sets || []).find((s) => s.fx); if (f) rated.push(f.fx); }));
    const hard = rated.filter((x) => x === 'hard').length;
    if (rated.length >= 5 && hard / rated.length >= 0.6) return { reason: `${hard} of your last ${rated.length} exercises felt hard` };
    // 6+ straight weeks of 3+ workouts since the last deload
    let weeks = 0, w = weekStart(now - 7 * DAY);
    const since = st.last || 0;
    while (w > since && (state.history || []).filter((x) => weekStart(x.date) === w).length >= 3) { weeks++; w = weekStart(w - DAY); }
    if (weeks >= 6) return { reason: `${weeks} hard weeks in a row without a break` };
    return null;
  }

  /* ── routine text parser ── */
  const SYN = { 'cable flyes': 'cable crossover', 'cable flys': 'cable crossover', 'cable fly': 'cable crossover', 'chest flyes': 'dumbbell fly', 'chest fly': 'dumbbell fly', 'bicep curls': 'dumbbell curl', 'biceps curls': 'dumbbell curl', 'bicep curl': 'dumbbell curl', 'biceps curl': 'dumbbell curl', db: 'dumbbell', dbs: 'dumbbell', bb: 'barbell', kb: 'kettlebell', ohp: 'overhead press', rdl: 'romanian deadlift', bw: 'bodyweight', ez: 'ez-bar', 'lat pull down': 'lat pulldown', 'pull down': 'pulldown', 'pullups': 'pull-up', 'pull ups': 'pull-up', 'pushups': 'push-up', 'push ups': 'push-up', 'chinups': 'chin-up', 'chin ups': 'chin-up', 'situps': 'sit-up', 'sit ups': 'sit-up', 'tricep': 'triceps', 'bicep': 'biceps', 'flyes': 'fly', 'flys': 'fly', 'raises': 'raise', 'curls': 'curl', 'rows': 'row', 'presses': 'press', 'extensions': 'extension', 'lunges': 'lunge', 'squats': 'squat', 'dips': 'dip', 'crunches': 'crunch', 'shrugs': 'shrug', 'deadlifts': 'deadlift', 'kickbacks': 'kickback', 'pushdowns': 'pushdown' };
  const STOP = new Set(['the', 'a', 'with', 'and', 'on', 'of', 'to', 'x', 'sets', 'set', 'reps', 'rep']);
  // The plain version people mean when they don't name a variation.
  const CANON = new Set(['Barbell Back Squat', 'Barbell Bench Press', 'Barbell Overhead Press', 'Dumbbell Lateral Raise', 'Dumbbell Curl', 'Lying Leg Curl', 'Standing Calf Raise', 'Cable Crossover', 'Dumbbell Fly', 'Barbell Bent-Over Row', 'One-Arm Dumbbell Row', 'Romanian Deadlift', 'Deadlift', 'Barbell Hip Thrust', 'Pull-Up', 'Lat Pulldown', 'Triceps Pushdown', 'Plank', 'Crunch', 'Push-Up', 'Leg Press', 'Leg Extension', 'Walking Lunge', 'Hammer Curl', 'Face Pull', 'Seated Cable Row', 'Dumbbell Shoulder Press', 'Chest Dip', 'Hanging Leg Raise', 'Glute Bridge', 'Bulgarian Split Squat']);
  const norm = (s) => {
    let t = ' ' + String(s).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\- ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
    Object.entries(SYN).forEach(([k, v]) => { t = t.replace(new RegExp(` ${k} `, 'g'), ` ${v} `); });
    return t.trim();
  };
  const stem = (w) => (w.length > 4 && /[^s]s$/.test(w) ? w.slice(0, -1) : w);
  const toks = (s) => norm(s).split(/[\s-]+/).filter((w) => w && !STOP.has(w) && !/^\d+$/.test(w)).map(stem);
  // Variations people usually name on purpose; without them in the text, prefer the plain version.
  const NICHE = new Set(['band', 'banded', 'smith', 'trx', 'stability', 'ball', 'landmine', 'reverse', 'single', 'one', 'kettlebell', 'machine', 'cable', 'seated', 'incline', 'decline', 'close', 'wide', 'pause', 'deficit', 'zercher', 'suspended', 'parallette', 'feet', 'weighted', 'eccentric', 'box', 'step', 'drag', 'spider']);
  /** Best matching exercise for a free-text name, or null. Score = how much of each name the other covers. */
  function match(name, list, prefer) {
    const q = toks(name); if (!q.length) return null;
    let best = null, bs = 0;
    for (const e of list) {
      const t = toks(e.name), hitQ = q.filter((w) => t.includes(w)).length, hitT = t.filter((w) => q.includes(w)).length;
      if (!hitQ) continue;
      const niche = t.filter((w) => NICHE.has(w) && !q.includes(w)).length;
      const s = (hitQ / q.length) * 0.6 + (hitT / t.length) * 0.4 - niche * 0.04 - (t.includes('reverse') && !q.includes('reverse') ? 0.06 : 0) + (CANON.has(e.name) ? 0.06 : 0) + (prefer && prefer(e) ? 0.03 : 0) - (e.custom ? 0.01 : 0);
      if (s > bs + 1e-9 || (Math.abs(s - bs) < 1e-9 && best && e.name.length < best.name.length)) { bs = s; best = e; }
    }
    return bs >= 0.5 ? best : null;
  }
  /** Lines like "Bench Press 4x8-10", "3 sets of 12 Leg Press", "Pull-ups – 3 x AMRAP". */
  function parseRoutine(text, list, prefer) {
    const lines = String(text || '').split(/\r?\n/).map((l) => l.replace(/^\s*(?:[-*•·]|\d+[.)]|[A-Z]\d?[.):])\s*/, '').trim()).filter(Boolean);
    const items = [], skipped = [];
    let title = '';
    for (const raw of lines) {
      if (/^(rest|note|tip|warm[- ]?up|cool[- ]?down)\b/i.test(raw)) continue;
      let line = raw, sets = 0, reps = '';
      const m1 = line.match(/(\d+)\s*(?:x|×|sets?\s*(?:of|x)?)\s*(\d+\s*(?:[-–]\s*\d+)?|amrap|max|failure)\s*(?:reps?)?/i);
      if (m1) { sets = +m1[1]; reps = m1[2].replace(/\s+/g, '').replace('–', '-'); line = line.replace(m1[0], ' '); }
      const secs = line.match(/(\d+)\s*(?:s|sec|secs|seconds)\b/i);
      if (secs && !reps) { reps = secs[1]; line = line.replace(secs[0], ' '); }
      line = line.replace(/\b(each|per)\s+(side|leg|arm)\b/gi, ' ');
      line = line.replace(/[(:–—-]\s*$/, '').replace(/\brest\b.*$/i, '').replace(/[()]/g, ' ').trim();
      const header = !m1 && (/:\s*$/.test(raw) || /\b(day|week|workout|routine|session|circuit|superset)\b/i.test(raw));
      const ex = header ? null : match(line, list, prefer);
      if (ex) items.push({ exId: ex.id, name: ex.name, src: raw, sets: Math.min(10, sets || 3), reps: /amrap|max|failure/i.test(reps) ? '8-12' : reps || (ex.timed ? '30-45' : '8-12'), max: /amrap|max|failure/i.test(reps) });
      else if (!title && !items.length && !m1 && raw.length <= 40) title = raw.replace(/[:\-–]+$/, '').trim();
      else skipped.push(raw);
    }
    return { title, items, skipped };
  }

  /* ── shareable workout image ── */
  function drawShare(rec, opts) {
    const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#16131c'); bg.addColorStop(1, '#0b0a0e');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const acc = g.createLinearGradient(0, 0, W, 0); acc.addColorStop(0, '#ff5a1f'); acc.addColorStop(1, '#ffb020');
    g.fillStyle = acc; g.fillRect(0, 0, W, 14);
    const font = (w, s) => `${w} ${s}px -apple-system, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
    g.fillStyle = '#fff'; g.font = font(900, 46); g.fillText('WILL POWER', 72, 120);
    g.fillStyle = '#ff7a2f'; g.fillText('FITNESS', 72 + g.measureText('WILL POWER ').width, 120);
    g.fillStyle = '#a9a3b6'; g.font = font(600, 34); g.fillText(opts.date, 72, 176);
    g.fillStyle = '#fff'; g.font = font(800, 74);
    const title = opts.title.length > 22 ? opts.title.slice(0, 21) + '…' : opts.title; g.fillText(title, 72, 290);
    const tiles = opts.tiles;
    tiles.forEach((t, i) => {
      const x = 72 + i * 320, y = 340;
      g.fillStyle = 'rgba(255,255,255,.06)'; roundRect(g, x, y, 296, 170, 28); g.fill();
      g.fillStyle = '#fff'; g.font = font(800, 62); g.fillText(t[0], x + 30, y + 92);
      g.fillStyle = '#a9a3b6'; g.font = font(600, 30); g.fillText(t[1], x + 30, y + 140);
    });
    let y = 600;
    g.fillStyle = '#a9a3b6'; g.font = font(700, 30); g.fillText('EXERCISES', 72, y); y += 26;
    (opts.lines || []).slice(0, 7).forEach((l) => {
      y += 70; g.fillStyle = '#fff'; g.font = font(700, 40);
      const nm = l[0].length > 26 ? l[0].slice(0, 25) + '…' : l[0]; g.fillText(nm, 72, y);
      g.fillStyle = '#ffb27a'; g.font = font(700, 36); const tw = g.measureText(l[1]).width; g.fillText(l[1], W - 72 - tw, y);
    });
    if ((opts.lines || []).length > 7) { y += 56; g.fillStyle = '#a9a3b6'; g.font = font(600, 32); g.fillText(`+ ${opts.lines.length - 7} more`, 72, y); }
    let fy = H - 150;
    if (opts.prs) { g.fillStyle = acc; roundRect(g, 72, fy - 60, W - 144, 84, 42); g.fill(); g.fillStyle = '#1a1208'; g.font = font(800, 38); g.fillText(`🏆 ${opts.prs}`, 108, fy - 4); fy -= 110; }
    if (opts.streak) { g.fillStyle = '#fff'; g.font = font(700, 36); g.fillText(opts.streak, 72, fy); }
    g.fillStyle = '#6f6880'; g.font = font(600, 28); g.fillText('Stronger today, a brighter tomorrow.', 72, H - 50);
    return cv;
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  return { dayKey, weekStart, activeDays, streak, badges, newBadges, BADGES, stats, deloadCheck, parseRoutine, match, drawShare };
})();

if (typeof module !== 'undefined') module.exports = MOTIVE;
