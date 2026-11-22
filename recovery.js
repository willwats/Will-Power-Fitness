/* Will Power Fitness — muscle recovery estimate (pure logic, no DOM).
   Each muscle needs a base number of hours to recover; more sets stretch it, and recent sessions add fatigue that fades over that time. */
const RECOVERY = (() => {
  const BASE = { chest: 72, back: 72, quads: 72, hamstrings: 72, glutes: 66, shoulders: 60, biceps: 48, triceps: 48, calves: 48, core: 36, forearms: 36 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

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
  function status(history, byId, now = Date.now()) {
    const res = {}, hits = {};
    Object.keys(BASE).forEach((m) => { res[m] = { pct: 100, lastAt: 0, sets: 0, readyIn: 0 }; hits[m] = []; });
    (history || []).forEach((w) => {
      const at = w.endedAt || w.date; if (!at || at > now + 3600e3 || now - at > 7 * 86400e3) return;
      Object.entries(loads(w, byId)).forEach(([m, load]) => {
        if (!res[m]) return;
        if (at > res[m].lastAt) { res[m].lastAt = at; res[m].sets = Math.round(load); }
        hits[m].push({ at, rec: (BASE[m] || 48) * clamp(0.55 + load / 12, 0.6, 1.4), k: clamp(load / 4, 0.3, 1) });
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
  const color = (pct) => `hsl(${Math.round(clamp(pct, 0, 100) * 1.25)}, 72%, 47%)`;

  return { BASE, status, loads, level, color };
})();

if (typeof module !== 'undefined') module.exports = RECOVERY;
