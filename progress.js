/* Will Power Fitness — remembers what you lifted and suggests what to lift next (pure logic, no DOM).
 * History shape: [{ date, exercises: [{ exId, sets: [{ w, r }] }] }], newest first.
 */
const PROG = (() => {
  const MACHINE = ['chest_press', 'pec_deck', 'lat_pulldown', 'leg_press', 'leg_extension', 'leg_curl', 'shoulder_press_machine', 'calf_machine', 'seated_row', 'hack_squat', 'hip_thrust_machine'];
  /* How heavy a lift of this type usually is, relative to a barbell lift of the same strength level.
   * (A dumbbell is per hand, so the number on it is smaller than the bar total.) */
  const KIND_FACTOR = { barbell: 1, smith: 0.9, ez_bar: 0.75, machine: 0.9, cable: 0.5, dumbbell: 0.38, kettlebell: 0.3 };

  const repsTop = (s) => { const m = String(s).match(/\d+/g); return m ? +m[m.length - 1] : 10; };
  const repsLow = (s) => { const m = String(s).match(/\d+/g); return m ? +m[0] : 10; };
  const e1rm = (w, r) => (r <= 1 ? w : w * (1 + Math.min(r, 15) / 30));
  const num = (x) => { const n = parseFloat(x); return Number.isFinite(n) ? n : 0; };

  function kindOf(ex) {
    const tokens = ex.equip.flatMap((req) => req.split('|'));
    for (const k of ['dumbbell', 'kettlebell', 'barbell', 'ez_bar', 'smith', 'cable']) if (tokens.includes(k)) return k;
    if (tokens.some((t) => MACHINE.includes(t))) return 'machine';
    return null;                                           // bodyweight, bands…
  }
  const weighted = (ex) => !ex.timed && !!kindOf(ex) && ex.loaded;
  const factorOf = (ex) => (KIND_FACTOR[kindOf(ex)] || 0) * (ex.compound ? 1 : 0.45);

  function step(units, kind, w) {
    if (units === 'kg') return 2.5;
    return (kind === 'dumbbell' || kind === 'kettlebell') && w < 25 ? 2.5 : 5;
  }
  const roundTo = (v, s) => Math.max(s, Math.round(v / s) * s);

  /** Most recent logged sets for an exercise. */
  function lastSets(history, exId) {
    for (const w of history) {
      const e = (w.exercises || []).find((x) => x.exId === exId);
      const ws = e && e.sets ? e.sets.filter((s) => !s.warm) : [];
      if (ws.length) return { sets: ws, date: w.date };
    }
    return null;
  }

  /** Best estimated one-rep max for an exercise across the last `n` sessions it appears in. */
  function bestE1rm(history, exId, n = 8) {
    let best = null, seen = 0;
    for (const w of history) {
      const e = (w.exercises || []).find((x) => x.exId === exId);
      if (!e) continue;
      for (const s of e.sets) { if (s.warm) continue; const w1 = num(s.w), r = num(s.r); if (w1 > 0 && r > 0) { const v = e1rm(w1, r); if (!best || v > best.v) best = { v, w: w1, r }; } }
      if (++seen >= n) break;
    }
    return best;
  }

  /**
   * What to put in the weight/reps boxes. Returns { sets:[{w,r}], note, kind } where kind is one of
   * progress | repeat | lighter | estimate | reps | none.
   */
  function suggest(ex, target, history, units, exById) {
    const lowRep = repsLow(target.reps), topRep = repsTop(target.reps), n = target.sets;
    const blank = () => Array.from({ length: n }, () => ({ w: '', r: String(lowRep) }));
    const last = lastSets(history, ex.id);

    /* No weight to track (bodyweight / timed): nudge the reps or seconds up when the top was hit */
    if (!weighted(ex)) {
      if (!last) return { sets: blank(), note: '', kind: 'none' };
      const rs = last.sets.map((s) => num(s.r)), hit = rs.length && rs.every((r) => r >= topRep);
      const bump = ex.timed ? 5 : 2;
      const base = Math.max(...rs, lowRep);
      const r = hit ? base + bump : Math.max(lowRep, Math.round(rs.reduce((a, b) => a + b, 0) / rs.length));
      return { sets: Array.from({ length: n }, () => ({ w: '', r: String(r) })), kind: hit ? 'reps' : 'repeat',
        note: hit ? `Go for ${r}${ex.timed ? ' seconds' : ' reps'} — you hit ${base} on every set last time.` : `Repeat last time and add a rep or two where you can.` };
    }

    const kind = kindOf(ex);
    if (last) {
      const ws = last.sets.map((s) => num(s.w)), top = Math.max(...ws);
      if (top > 0) {
        const atTop = last.sets.filter((s) => num(s.w) === top);
        const best = Math.max(...atTop.map((s) => num(s.r)));
        const hit = atTop.length >= Math.min(2, last.sets.length) && atTop.every((s) => num(s.r) >= topRep);
        const inc = step(units, kind, top);
        if (hit) {
          const nw = top + inc;
          return { kind: 'progress', note: `Try ${nw} ${units} × ${lowRep}. You got ${topRep}+ reps on every set at ${top} ${units} last time.`,
            sets: Array.from({ length: n }, () => ({ w: String(nw), r: String(lowRep) })) };
        }
        if (best < lowRep - 2) {
          const nw = roundTo(top * 0.93, step(units, kind, top));
          return { kind: 'lighter', note: `Drop to ${nw} ${units}. You only got ${best} reps at ${top} ${units} last time.`,
            sets: Array.from({ length: n }, () => ({ w: String(nw), r: String(lowRep) })) };
        }
        return { kind: 'repeat', note: `Repeat ${top} ${units}. Get ${topRep} reps on every set, then go heavier.`,
          sets: Array.from({ length: n }, (_, j) => { const p = last.sets[j] || last.sets[last.sets.length - 1]; return { w: String(num(p.w) || top), r: String(Math.min(topRep, Math.max(lowRep, num(p.r) || lowRep))) }; }) };
      }
    }

    /* Never done this one: estimate from similar lifts you have logged (same muscle, any equipment) */
    const f = factorOf(ex);
    if (f > 0) {
      const ests = [];
      for (const other of Object.values(exById)) {
        if (other.id === ex.id || other.muscle !== ex.muscle || !weighted(other)) continue;
        const b = bestE1rm(history, other.id);
        if (b) ests.push({ name: other.name, b, norm: b.v / factorOf(other) });
      }
      if (ests.length) {
        const norm = ests.reduce((t, e) => t + e.norm, 0) / ests.length;
        const src = ests.sort((a, b) => b.b.v - a.b.v)[0];
        const w = roundTo((norm * f) / (1 + lowRep / 30) * 0.85, step(units, kind, 0));
        return { kind: 'estimate', note: `Starting guess: ${w} ${units} × ${lowRep}, based on your ${src.name} (${src.b.w} ${units} × ${src.b.r}). Adjust to feel.`,
          sets: Array.from({ length: n }, () => ({ w: String(w), r: String(lowRep) })) };
      }
    }
    return { sets: blank(), note: '', kind: 'none' };
  }

  /** Personal records set by a finished workout (compared with everything before it). */
  function newPRs(history, workout, exById) {
    const out = [];
    for (const e of workout.exercises) {
      const ex = exById[e.exId]; if (!ex || !weighted(ex)) continue;
      const prior = bestE1rm(history, e.exId, 1000);
      let top = null;
      for (const s of e.sets) { if (s.warm) continue; const w = num(s.w), r = num(s.r); if (w > 0 && r > 0) { const v = e1rm(w, r); if (!top || v > top.v) top = { v, w, r }; } }
      if (top && (!prior || top.v > prior.v * 1.005)) out.push({ exId: e.exId, name: ex.name, w: top.w, r: top.r, first: !prior });
    }
    return out.filter((p) => !p.first || out.length <= 3);
  }

  /** Progress per exercise: first vs best estimated max, newest first. */
  function summaries(history, exById, limit = 6) {
    const seen = new Map();
    for (const w of history) for (const e of w.exercises || []) {
      const ex = exById[e.exId]; if (!ex || !weighted(ex)) continue;
      if (!seen.has(e.exId)) seen.set(e.exId, []);
      let top = 0, tw = 0, tr = 0;
      for (const s of e.sets) { if (s.warm) continue; const v = e1rm(num(s.w), num(s.r)); if (num(s.w) > 0 && v > top) { top = v; tw = num(s.w); tr = num(s.r); } }
      if (top) seen.get(e.exId).push({ date: w.date, v: top, w: tw, r: tr });
    }
    return [...seen.entries()].filter(([, list]) => list.length).map(([exId, list]) => {
      const first = list[list.length - 1], best = list.reduce((a, b) => (b.v > a.v ? b : a)), latest = list[0];
      return { exId, name: exById[exId].name, sessions: list.length, latest, best, first, change: list.length > 1 ? (latest.v / first.v - 1) * 100 : null };
    }).slice(0, limit);
  }

  return { suggest, newPRs, summaries, bestE1rm, lastSets, e1rm, kindOf, repsTop, repsLow, weighted };
})();

if (typeof module !== 'undefined') module.exports = PROG;
