/* Will Power Fitness — cardio, calories and Apple Health bridge (pure logic, no DOM). */
const CARDIO = (() => {
  const TYPES = [
    { id: 'walk', name: 'Walk', gps: true },
    { id: 'run', name: 'Run', gps: true },
    { id: 'hike', name: 'Hike', gps: true },
    { id: 'cycle', name: 'Cycle', gps: true },
    { id: 'elliptical', name: 'Elliptical' },
    { id: 'rower', name: 'Rower' },
    { id: 'stairs', name: 'Stairs' },
    { id: 'swim', name: 'Swim' },
    { id: 'hiit', name: 'HIIT' },
    { id: 'jumprope', name: 'Jump rope' },
    { id: 'strength', name: 'Strength' },
    { id: 'other', name: 'Other' },
  ];
  const TYPE_NAME = Object.fromEntries(TYPES.map((t) => [t.id, t.name]));

  /* MET = how many times resting energy use an activity burns (Compendium of Physical Activities). */
  const SPEED_MET = {
    walk: [[2, 2.8], [2.5, 3.0], [3, 3.5], [3.5, 4.3], [4, 5.0], [4.5, 7.0]],
    run: [[4, 6.0], [5, 8.3], [6, 9.8], [7, 11.0], [8, 11.8], [9, 12.8], [10, 14.5]],
    cycle: [[10, 6.0], [12, 8.0], [14, 10.0], [16, 12.0], [20, 15.8]],
  };
  const FIXED_MET = { walk: 3.5, run: 9.8, cycle: 8.0, hike: 6.0, elliptical: 5.0, rower: 7.0, stairs: 8.8, swim: 6.0, hiit: 8.0, jumprope: 11.8, strength: 5.0, other: 5.0 };

  const MI = 1609.344;
  const lerp = (a, b, k) => a + (b - a) * k;

  function interp(table, x) {
    if (x <= table[0][0]) return table[0][1];
    for (let i = 1; i < table.length; i++) {
      if (x <= table[i][0]) { const [x0, y0] = table[i - 1], [x1, y1] = table[i]; return lerp(y0, y1, (x - x0) / (x1 - x0)); }
    }
    return table[table.length - 1][1];
  }

  /** MET for an activity; pass average speed in mph when known (walk / run / cycle). */
  function metFor(type, mph) {
    if (mph > 0 && SPEED_MET[type]) return interp(SPEED_MET[type], mph);
    return FIXED_MET[type] || 5;
  }
  const kcalFor = (met, kg, sec) => Math.round((met * kg * sec) / 3600);
  const toKg = (w, units) => (units === 'kg' ? w : w * 0.45359237);

  /** Distance between two GPS fixes in metres. */
  function haversine(a, b) {
    const R = 6371000, rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  /** Should this GPS fix add distance? Filters out noisy / teleporting readings. Returns metres to add. */
  function stepMeters(prev, cur) {
    if (!prev || cur.acc > 35) return 0;
    const d = haversine(prev, cur), dt = Math.max(1, (cur.t - prev.t) / 1000);
    if (d < 3 || d / dt > 12) return 0;       // standing still jitter, or an impossible jump (> 12 m/s)
    return d;
  }

  const dayKey = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const distUnit = (units) => (units === 'kg' ? 'km' : 'mi');
  const metersToUnit = (m, units) => (units === 'kg' ? m / 1000 : m / MI);
  const unitToMeters = (v, units) => (units === 'kg' ? v * 1000 : v * MI);
  const mphFrom = (meters, sec) => (sec > 0 ? meters / MI / (sec / 3600) : 0);

  /* ───────── daily totals ─────────
   * Apple Health "active energy" already includes everything your watch/phone recorded.
   * Things logged here count on top of it unless they were sent to Health (sent: true).
   */
  function dailyTotals(state, key) {
    const strength = state.history.filter((w) => dayKey(w.date) === key);
    const cardio = (state.cardio || []).filter((c) => dayKey(c.date) === key);
    const h = (state.health && state.health[key]) || null;
    const appKcal = (list) => list.filter((x) => !x.sent && x.source !== 'health').reduce((t, x) => t + (x.kcal || 0), 0);
    const strengthKcal = strength.reduce((t, w) => t + (w.kcal || 0), 0);
    const cardioKcal = cardio.filter((c) => c.source !== 'health').reduce((t, c) => t + (c.kcal || 0), 0);
    const extra = appKcal(strength) + appKcal(cardio);
    const healthKcal = h && h.kcal ? h.kcal : 0;
    return {
      key, strengthKcal, cardioKcal, healthKcal, extra,
      total: Math.round(healthKcal + extra),
      steps: h && h.steps ? h.steps : 0,
      minutes: Math.round(cardio.reduce((t, c) => t + c.dur / 60, 0) + strength.reduce((t, w) => t + (w.endedAt && w.date ? (w.endedAt - w.date) / 60000 : 0), 0)),
      sessions: strength.length + cardio.length,
      hasHealth: !!healthKcal,
    };
  }

  function lastDays(state, n, now = Date.now()) {
    return Array.from({ length: n }, (_, i) => dailyTotals(state, dayKey(now - (n - 1 - i) * 86400000)));
  }

  /* ───────── Apple Health bridge ───────── */
  const HEALTH_TYPES = [
    [/walk/i, 'walk'], [/run/i, 'run'], [/hik/i, 'hike'], [/cycl|bik/i, 'cycle'], [/ellip/i, 'elliptical'], [/row/i, 'rower'],
    [/stair/i, 'stairs'], [/swim/i, 'swim'], [/high intensity|hiit|interval/i, 'hiit'], [/jump rope/i, 'jumprope'], [/strength|weight/i, 'strength'],
  ];
  const healthType = (s) => { for (const [re, id] of HEALTH_TYPES) if (re.test(s || '')) return id; return 'other'; };
  const numOf = (v) => { if (v == null) return 0; const n = parseFloat(String(v).replace(/,/g, '').trim()); return Number.isFinite(n) ? n : 0; };

  /**
   * Parse what a Shortcut sends us. Accepts a full link, "#health&kcal=…", or plain "kcal=512&steps=8000".
   *   kcal, steps, min, dist, date        → that day's totals (dist in miles; use distkm for kilometres)
   *   wtype, wmin, wkcal, wdist, wstart   → a workout (repeat the set for several workouts)
   */
  function parseHealthLink(text, units = 'lb', now = Date.now()) {
    if (!text) return null;
    let q = String(text).trim();
    const hash = q.indexOf('#'), ques = q.indexOf('?');
    if (hash >= 0) q = q.slice(hash + 1); else if (ques >= 0) q = q.slice(ques + 1);
    q = q.replace(/^health&?/i, '');
    const p = new URLSearchParams(q);
    const day = /^\d{4}-\d{2}-\d{2}/.test(p.get('date') || '') ? p.get('date').slice(0, 10) : dayKey(now);
    const miles = (v, km) => (km ? numOf(km) / 1.609344 : numOf(v));
    const out = { day, kcal: Math.round(numOf(p.get('kcal'))), steps: Math.round(numOf(p.get('steps'))), minutes: Math.round(numOf(p.get('min'))), miles: miles(p.get('dist'), p.get('distkm')), workouts: [] };
    const types = p.getAll('wtype'), mins = p.getAll('wmin'), kc = p.getAll('wkcal'), ds = p.getAll('wdist'), st = p.getAll('wstart');
    const dk = p.getAll('wdistkm');
    for (let i = 0; i < Math.max(types.length, mins.length, kc.length); i++) {
      const dur = Math.round(numOf(mins[i]) * 60);
      if (!dur && !numOf(kc[i])) continue;
      let start = st[i] ? (/^\d{9,}$/.test(st[i]) ? +st[i] * (st[i].length > 11 ? 1 : 1000) : Date.parse(st[i])) : NaN;
      if (!Number.isFinite(start)) start = now - dur * 1000;
      out.workouts.push({ type: healthType(types[i]), label: types[i] || '', dur, kcal: Math.round(numOf(kc[i])), miles: miles(ds[i], dk[i]), start });
    }
    if (!out.kcal && !out.steps && !out.minutes && !out.workouts.length) return null;
    return out;
  }

  /** Merge a parsed link into state (mutates). Returns what changed. */
  function mergeHealth(state, parsed, units, now = Date.now()) {
    state.health = state.health || {};
    state.cardio = state.cardio || [];
    const h = (state.health[parsed.day] = state.health[parsed.day] || {});
    if (parsed.kcal) h.kcal = parsed.kcal;               // latest total for the day wins (it's a running total)
    if (parsed.steps) h.steps = parsed.steps;
    if (parsed.minutes) h.minutes = parsed.minutes;
    if (parsed.miles) h.miles = parsed.miles;
    h.syncedAt = now;
    state.healthSyncedAt = now;
    let added = 0;
    for (const w of parsed.workouts) {
      const dup = state.cardio.some((c) => c.source === 'health' && c.type === w.type && Math.abs(c.date - w.start) < 120000);
      if (dup) continue;
      state.cardio.unshift({
        id: Math.random().toString(36).slice(2, 10), type: w.type, label: w.label, date: w.start, dur: w.dur,
        dist: w.miles ? Math.round(metersToUnit(w.miles * MI, units) * 100) / 100 : 0, kcal: w.kcal, source: 'health',
      });
      added++;
    }
    state.cardio.sort((a, b) => b.date - a.date);
    return { day: parsed.day, added };
  }

  /** shortcuts:// link that hands a finished session to a user-made "Will Power Log Workout" Shortcut. */
  function sendToHealthUrl(rec, units, name = 'Will Power Log Workout') {
    const mi = rec.dist ? (units === 'kg' ? rec.dist / 1.609344 : rec.dist) : 0;
    const payload = JSON.stringify({
      type: TYPE_NAME[rec.type] || 'Other', start: new Date(rec.date).toISOString(), end: new Date(rec.date + rec.dur * 1000).toISOString(),
      minutes: Math.round(rec.dur / 60), kcal: rec.kcal || 0, miles: mi ? +mi.toFixed(2) : 0,
    });
    return `shortcuts://run-shortcut?name=${encodeURIComponent(name)}&input=text&text=${encodeURIComponent(payload)}`;
  }

  return { TYPES, TYPE_NAME, metFor, kcalFor, toKg, haversine, stepMeters, dayKey, distUnit, metersToUnit, unitToMeters, mphFrom, dailyTotals, lastDays, parseHealthLink, mergeHealth, sendToHealthUrl, healthType, MI };
})();

if (typeof module !== 'undefined') module.exports = CARDIO;
