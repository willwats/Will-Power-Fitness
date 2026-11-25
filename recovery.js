/* Will Power Fitness — muscle recovery estimate (pure logic, no DOM).
   Each muscle needs a base number of hours to recover; more sets stretch it, and recent sessions add fatigue that fades over that time. */
const RECOVERY = (() => {
  const BASE = { chest: 72, back: 72, quads: 72, hamstrings: 72, glutes: 66, shoulders: 60, biceps: 48, triceps: 48, calves: 48, core: 36, forearms: 36 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* Cardio and other activities tire muscles too. Set-equivalents per 10 minutes at a moderate effort. */
  const ACTIVITY = {
    run: { quads: 1.2, hamstrings: 1.0, calves: 1.4, glutes: 1.0, core: 0.3 },
    walk: { calves: 0.4, quads: 0.3, glutes: 0.3, hamstrings: 0.2 },
    hike: { quads: 0.8, glutes: 0.8, calves: 0.8, hamstrings: 0.5, core: 0.2 },
    cycle: { quads: 0.8, glutes: 0.4, calves: 0.3, hamstrings: 0.3 },
    elliptical: { quads: 0.5, glutes: 0.4, hamstrings: 0.3, calves: 0.3, shoulders: 0.15, back: 0.15, chest: 0.1 },
    rower: { back: 1.0, quads: 0.7, hamstrings: 0.5, glutes: 0.5, biceps: 0.4, forearms: 0.4, core: 0.3 },
    stairs: { quads: 1.2, glutes: 1.0, calves: 1.0, hamstrings: 0.4 },
    swim: { back: 1.0, shoulders: 1.0, chest: 0.5, triceps: 0.4, core: 0.4 },
    hiit: { quads: 0.8, glutes: 0.6, core: 0.6, calves: 0.5, shoulders: 0.4, chest: 0.3 },
    jumprope: { calves: 1.5, quads: 0.5, shoulders: 0.3, forearms: 0.3 },
    strength: { chest: 0.5, back: 0.5, shoulders: 0.5, quads: 0.6, glutes: 0.5, hamstrings: 0.4, core: 0.5, biceps: 0.3, triceps: 0.3 },
    golf: { core: 0.6, back: 0.5, shoulders: 0.4, forearms: 0.5, glutes: 0.3, calves: 0.4, quads: 0.3 },
    sports: { quads: 0.8, calves: 0.8, glutes: 0.6, hamstrings: 0.6, core: 0.4, shoulders: 0.3 },
    yoga: { core: 0.3, hamstrings: 0.2, shoulders: 0.2 },
    other: { quads: 0.3, calves: 0.3, core: 0.2 },
  };
  /** Per-muscle load for one cardio/activity session: longer and harder sessions count more (long easy ones taper off). */
  function activityLoads(c) {
    const map = ACTIVITY[c.type] || ACTIVITY.other, min = (c.dur || 0) / 60;
    if (min < 5) return {};
    const eff = Math.min(min, 60) + Math.max(0, min - 60) * 0.25;
    const inten = c.kcal ? clamp(c.kcal / min / 10, 0.5, 1.2) : 1;
    const out = {};
    Object.entries(map).forEach(([m, w]) => { out[m] = Math.min(8, w * (eff / 10) * inten); });
    return out;
  }

  /** Per-muscle load (working sets, secondary muscles count half) for one logged workout. */
  function loads(w, byId) {
    const out = {};
    (w.exercises || []).forEach((e) => {
      const n = (e.sets || []).filter((s) => !s.warm).length; if (!n) return;
      out[e.muscle] = (out[e.muscle] || 0) + n;
      const ex = byId && byId[e.exId];
      ((ex && ex.secondary) || []).forEach((m) => { if (m !== e.muscle) out[m] = (out[m] || 0) + n * 0.5; });
    });
    return out;
  }

  /** { muscle: { pct, lastAt, sets, readyIn (hours until ~95%) } } */
  function status(history, byId, now = Date.now(), cardio = []) {
    const res = {}, hits = {};
    Object.keys(BASE).forEach((m) => { res[m] = { pct: 100, lastAt: 0, sets: 0, readyIn: 0 }; hits[m] = []; });
    (history || []).forEach((w) => {
      const at = w.endedAt || w.date; if (!at || at > now + 3600e3 || now - at > 7 * 86400e3) return;
      Object.entries(loads(w, byId)).forEach(([m, load]) => {
        if (!res[m]) return;
        if (at > res[m].lastAt) { res[m].lastAt = at; res[m].sets = Math.round(load); res[m].via = ''; }
        hits[m].push({ at, rec: (BASE[m] || 48) * clamp(0.55 + load / 12, 0.6, 1.4), k: clamp(load / 4, 0.3, 1) });
      });
    });
    (cardio || []).forEach((c) => {
      const at = c.date + (c.dur || 0) * 1000; if (!c.date || at > now + 3600e3 || now - at > 7 * 86400e3) return;
      Object.entries(activityLoads(c)).forEach(([m, load]) => {
        if (!res[m] || load < 0.3) return;
        if (at > res[m].lastAt) { res[m].lastAt = at; res[m].sets = 0; res[m].via = c.label || c.type; }
        hits[m].push({ at, rec: (BASE[m] || 48) * clamp(0.4 + load / 14, 0.45, 1), k: clamp(load / 6, 0.1, 0.8) });   // endurance work recovers faster than heavy sets
      });
    });
    const fatigue = (m, t) => clamp(hits[m].reduce((f, h) => { const left = h.rec - (t - h.at) / 3600e3; return f + (left > 0 ? (left / h.rec) * h.k : 0); }, 0), 0, 1);
    Object.keys(res).forEach((m) => {
      const r = res[m]; r.pct = Math.round(100 * (1 - fatigue(m, now)));
      if (r.pct < 95) { let h = 1; while (h < 24 * 7 && fatigue(m, now + h * 3600e3) > 0.05) h++; r.readyIn = h; }
    });
    return res;
  }

  const level = (pct) => (pct >= 90 ? 'fresh' : pct >= 60 ? 'mid' : 'hot');
  /** Red (0%) → amber → green (100%). */
  const color = (pct) => `hsl(${Math.round(clamp(pct, 0, 100) * 1.22)}, 58%, 46%)`;

  return { BASE, ACTIVITY, status, loads, activityLoads, level, color };
})();

if (typeof module !== 'undefined') module.exports = RECOVERY;
