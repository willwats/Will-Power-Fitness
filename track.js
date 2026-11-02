/* Will Power Fitness — body tracking maths: water & protein targets, weight trend, measurements, chart (pure logic). */
const TRACK = (() => {
  const OZ = 29.5735;
  const dayKey = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const PROTEIN_PER_KG = { bulk: 2.0, cut: 2.2, strength: 1.8, recomp: 2.0, athletic: 1.6 };   // grams per kg of body weight
  const MEASURES = [['neck', 'Neck'], ['shoulders', 'Shoulders'], ['chest', 'Chest'], ['waist', 'Waist'], ['hips', 'Hips'], ['bicep', 'Arm (flexed)'], ['thigh', 'Thigh'], ['calf', 'Calf']];

  /** Daily protein (g) and water (ml) targets from body weight, focus and whether you trained today. */
  function targets(weightKg, focus, trainedToday) {
    if (!weightKg) return null;
    const protein = Math.round((weightKg * (PROTEIN_PER_KG[focus] || 1.6)) / 5) * 5;
    const water = Math.round((weightKg * 35 + (trainedToday ? 500 : 0)) / 50) * 50;
    return { protein, water };
  }
  const ml2disp = (ml, units) => (units === 'kg' ? Math.round(ml) : Math.round(ml / OZ));
  const dispUnit = (units) => (units === 'kg' ? 'ml' : 'oz');
  const oz2ml = (oz) => oz * OZ;

  function intakeFor(state, key) { return Object.assign({ water: 0, protein: 0 }, (state.intake || {})[key] || {}); }
  function addIntake(state, key, field, amount) {
    state.intake = state.intake || {};
    const cur = intakeFor(state, key);
    cur[field] = Math.max(0, Math.round((cur[field] + amount) * 10) / 10);
    state.intake[key] = cur;
    return cur;
  }
  function trainedOn(state, key) {
    return state.history.some((w) => dayKey(w.date) === key) || (state.cardio || []).some((c) => dayKey(c.date) === key && c.dur >= 1200);
  }

  /* ── weight log (kg internally) ── */
  function addWeight(state, kg, now = Date.now()) {
    state.weights = (state.weights || []).filter((w) => dayKey(w.date) !== dayKey(now));   // one entry a day
    state.weights.push({ date: now, kg: Math.round(kg * 100) / 100 });
    state.weights.sort((a, b) => a.date - b.date);
  }
  /** Change per week over the last ~3 weeks of entries (kg / week), null when there isn't enough data. */
  function weeklyTrend(weights) {
    if (weights.length < 2) return null;
    const last = weights[weights.length - 1], cut = last.date - 21 * 86400000;
    const pts = weights.filter((w) => w.date >= cut);
    const first = pts.length >= 2 ? pts[0] : weights[weights.length - 2];
    const days = (last.date - first.date) / 86400000;
    return days >= 2 ? ((last.kg - first.kg) / days) * 7 : null;
  }

  /* ── measurements (cm internally) ── */
  function addMeasure(state, vals, now = Date.now()) {
    const clean = {};
    for (const [k] of MEASURES) if (vals[k] > 0) clean[k] = Math.round(vals[k] * 10) / 10;
    if (!Object.keys(clean).length) return false;
    state.measures = state.measures || [];
    state.measures.push({ id: Math.random().toString(36).slice(2, 9), date: now, vals: clean });
    state.measures.sort((a, b) => a.date - b.date);
    return true;
  }
  /** For each measurement: first logged, latest, change. */
  function measureSummary(measures) {
    return MEASURES.map(([k, label]) => {
      const list = measures.filter((m) => m.vals[k] > 0);
      if (!list.length) return null;
      const first = list[0].vals[k], last = list[list.length - 1].vals[k];
      return { key: k, label, first, last, change: list.length > 1 ? Math.round((last - first) * 10) / 10 : null };
    }).filter(Boolean);
  }

  /** Small SVG line chart. points: [{t, v}] ascending; ideal: optional horizontal reference value. */
  function chart(points, { ideal = 0, w = 320, h = 140, fmt = (v) => String(Math.round(v * 10) / 10) } = {}) {
    if (points.length < 2) return '';
    const vals = points.map((p) => p.v).concat(ideal ? [ideal] : []);
    let lo = Math.min(...vals), hi = Math.max(...vals);
    const padV = Math.max(0.5, (hi - lo) * 0.12); lo -= padV; hi += padV;
    const t0 = points[0].t, t1 = points[points.length - 1].t, L = 34, R = 8, Tp = 10, B = 18;
    const x = (t) => L + ((t - t0) / (t1 - t0 || 1)) * (w - L - R), y = (v) => Tp + (1 - (v - lo) / (hi - lo)) * (h - Tp - B);
    const poly = points.map((p) => `${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
    const lastP = points[points.length - 1];
    const d = (t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `<svg class="tchart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Weight over time">
      <line x1="${L}" y1="${y(hi).toFixed(1)}" x2="${w - R}" y2="${y(hi).toFixed(1)}" class="grid"/><line x1="${L}" y1="${y(lo).toFixed(1)}" x2="${w - R}" y2="${y(lo).toFixed(1)}" class="grid"/>
      ${ideal ? `<line x1="${L}" y1="${y(ideal).toFixed(1)}" x2="${w - R}" y2="${y(ideal).toFixed(1)}" class="ideal"/><text x="${w - R}" y="${(y(ideal) - 3).toFixed(1)}" class="lbl end">ideal ${fmt(ideal)}</text>` : ''}
      <polyline points="${poly}" class="line"/>
      <circle cx="${x(lastP.t).toFixed(1)}" cy="${y(lastP.v).toFixed(1)}" r="3.6" class="dot"/>
      <text x="${L - 4}" y="${(y(hi) + 3).toFixed(1)}" class="lbl end">${fmt(hi)}</text><text x="${L - 4}" y="${(y(lo) + 3).toFixed(1)}" class="lbl end">${fmt(lo)}</text>
      <text x="${L}" y="${h - 3}" class="lbl">${d(t0)}</text><text x="${w - R}" y="${h - 3}" class="lbl end">${d(t1)}</text></svg>`;
  }

  return { MEASURES, targets, ml2disp, dispUnit, oz2ml, intakeFor, addIntake, trainedOn, addWeight, weeklyTrend, addMeasure, measureSummary, chart, dayKey, PROTEIN_PER_KG };
})();

if (typeof module !== 'undefined') module.exports = TRACK;
