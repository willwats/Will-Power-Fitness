/* Will Power Fitness — weekly plan: training days, split suggestions, week status, calendar reminders. */
const PLAN = (() => {
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const ICS_DAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const SPLITS = {
    auto: { name: 'Auto', blurb: 'Picks a split that fits how many days you train.' },
    full: { name: 'Full body', blurb: 'Every session hits the whole body. Great for 2–3 days a week.',
      days: [['Full body', ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'core']]] },
    ul: { name: 'Upper / Lower', blurb: 'Alternate upper and lower days. Great for 4 days a week.',
      days: [['Upper body', ['chest', 'back', 'shoulders', 'biceps', 'triceps']], ['Lower body', ['quads', 'hamstrings', 'glutes', 'calves', 'core']]] },
    ppl: { name: 'Push / Pull / Legs', blurb: 'Three-day rotation. Great for 5–6 days a week.',
      days: [['Push', ['chest', 'shoulders', 'triceps']], ['Pull', ['back', 'biceps', 'forearms']], ['Legs', ['quads', 'hamstrings', 'glutes', 'calves']]] },
    bro: { name: 'Body-part split', blurb: 'One or two muscles per day, with more volume each.',
      days: [['Chest & triceps', ['chest', 'triceps']], ['Back & biceps', ['back', 'biceps']], ['Legs', ['quads', 'hamstrings', 'glutes', 'calves']], ['Shoulders & abs', ['shoulders', 'core', 'forearms']]] },
  };
  const DEFAULT_DAYS = [false, true, false, true, false, true, false];       // Mon / Wed / Fri

  const dayKey = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const getPlan = (state) => Object.assign({ days: DEFAULT_DAYS.slice(), split: 'auto', time: '18:00', set: false }, state.plan || {});

  function resolveSplit(plan, focus) {
    if (plan.split !== 'auto') return plan.split;
    const n = plan.days.filter(Boolean).length;
    if (n <= 3) return 'full';
    if (n === 4) return 'ul';
    return focus === 'strength' ? 'ul' : 'ppl';
  }

  const overlap = (a, b) => { const A = new Set(a), B = new Set(b); let i = 0; A.forEach((x) => { if (B.has(x)) i++; }); return i / (A.size + B.size - i || 1); };

  /** Index of the split day a past workout most resembles. */
  function matchDay(split, muscles) {
    let best = 0, bs = -1;
    split.days.forEach((d, i) => { const s = overlap(d[1], muscles); if (s > bs) { bs = s; best = i; } });
    return best;
  }

  /** Days since each muscle was last trained (history entries newest first). */
  function recovery(history, now) {
    const out = {};
    for (const w of history) {
      const d = Math.floor((now - (w.endedAt || w.date)) / 86400000);
      for (const m of w.muscles || []) if (!(m in out)) out[m] = d;
    }
    return out;
  }

  function suggestToday(state, now = Date.now()) {
    const plan = getPlan(state), key = dayKey(now), dow = new Date(now).getDay();
    const focus = (state.body || {}).focus;
    const splitId = resolveSplit(plan, focus), split = SPLITS[splitId];
    const last = state.history[0];
    let idx = 0;
    if (last) idx = (matchDay(split, last.muscles || []) + 1) % split.days.length;
    const doneToday = state.history.some((w) => dayKey(w.date) === key);
    if (doneToday && last) idx = (matchDay(split, last.muscles || []) + 1) % split.days.length;  // preview tomorrow's
    const [label, all] = split.days[idx];
    const rec = recovery(state.history, now);
    const fresh = all.filter((m) => rec[m] === undefined || rec[m] >= 2);
    const skipped = all.filter((m) => !fresh.includes(m));
    return {
      splitId, splitName: split.name, label, muscles: fresh.length ? fresh : all, skipped, allSore: !fresh.length,
      planned: !!plan.days[dow], doneToday, trainingDays: plan.days.filter(Boolean).length,
    };
  }

  /** Sun..Sat for the current week: planned / trained / today. */
  function weekStatus(state, now = Date.now()) {
    const plan = getPlan(state), d0 = new Date(now); d0.setHours(12, 0, 0, 0);
    const start = d0.getTime() - d0.getDay() * 86400000;
    return DOW.map((label, i) => {
      const t = start + i * 86400000, key = dayKey(t);
      return {
        label, key, planned: !!plan.days[i], today: key === dayKey(now), future: t > now && key !== dayKey(now),
        strength: state.history.some((w) => dayKey(w.date) === key),
        cardio: (state.cardio || []).some((c) => dayKey(c.date) === key),
      };
    });
  }

  /* ── calendar reminders (.ics) ── */
  const pad = (n) => String(n).padStart(2, '0');
  const fold = (l) => (l.length <= 74 ? l : l.match(/.{1,73}/g).join('\r\n '));
  function ics(plan, now = Date.now(), name = 'Will Power Fitness workout') {
    const [hh, mm] = (plan.time || '18:00').split(':').map(Number);
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Will Power Fitness//EN', 'CALSCALE:GREGORIAN'];
    plan.days.forEach((on, dow) => {
      if (!on) return;
      const d = new Date(now); d.setHours(hh, mm, 0, 0);
      d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7));
      if (d.getTime() < now) d.setDate(d.getDate() + 7);
      L.push('BEGIN:VEVENT', `UID:wpf-${dow}-${plan.time.replace(':', '')}@will-power-fitness`,
        `DTSTAMP:${new Date(now).toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
        `DTSTART:${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(hh)}${pad(mm)}00`, 'DURATION:PT1H',
        `RRULE:FREQ=WEEKLY;BYDAY=${ICS_DAY[dow]}`, fold(`SUMMARY:${name}`), 'DESCRIPTION:Open Will Power Fitness and hit Start workout.',
        'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', 'DESCRIPTION:Workout in 15 minutes', 'END:VALARM', 'END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.join('\r\n') + '\r\n';
  }

  return { DOW, SPLITS, DEFAULT_DAYS, getPlan, resolveSplit, suggestToday, weekStatus, recovery, ics, dayKey };
})();

if (typeof module !== 'undefined') module.exports = PLAN;
