/* Will Power Fitness — app logic (no build step, no dependencies) */
(() => {
  'use strict';

  /* ───────────── helpers ───────────── */
  const KEY = 'wpf.v1';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const num = (x) => { const n = parseFloat(x); return Number.isFinite(n) ? n : 0; };
  const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const fmtDate = (t) => new Date(t).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtClock = (sec) => {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  };
  const fmtNum = (n) => Math.round(n).toLocaleString();
  const LEVELS = ['', 'Beginner', 'Intermediate', 'Advanced'];

  const GOALS = {
    strength: { label: 'Strength', compound: { sets: 5, reps: '5', rest: 180 }, iso: { sets: 3, reps: '8-10', rest: 90 } },
    hypertrophy: { label: 'Muscle', compound: { sets: 4, reps: '8-10', rest: 90 }, iso: { sets: 3, reps: '10-12', rest: 60 } },
    endurance: { label: 'Endurance', compound: { sets: 3, reps: '15-20', rest: 45 }, iso: { sets: 3, reps: '15-20', rest: 45 } },
  };
  const WEIGHT = { chest: 3, back: 3, quads: 3, hamstrings: 2, glutes: 2, shoulders: 2, core: 1.2, biceps: 1, triceps: 1, calves: 1, forearms: 0.8 };
  const MUSCLE_PRESETS = [
    ['full', 'Full body', ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'core']],
    ['push', 'Push', ['chest', 'shoulders', 'triceps']],
    ['pull', 'Pull', ['back', 'biceps', 'forearms']],
    ['legs', 'Legs', ['quads', 'hamstrings', 'glutes', 'calves']],
    ['upper', 'Upper', ['chest', 'back', 'shoulders', 'biceps', 'triceps']],
    ['arms', 'Arms', ['biceps', 'triceps', 'forearms']],
  ];
  const EQUIP_PRESETS = [
    ['gym', 'Full gym', () => [...ALL_EQUIPMENT]],
    ['home', 'Home: DB + bench + bands', () => ['dumbbell', 'bench', 'bands']],
    ['db', 'Dumbbells only', () => ['dumbbell']],
    ['tag', 'TAG Functional Trainer', () => ['functional_trainer']],
    ['lfcorner', 'Life Fitness pulley corner', () => ['dual_pulley', 'suspension', 'bands', 'stability_ball', 'parallettes']],
    ['bw', 'Bodyweight only', () => []],
  ];

  /* ───────────── state ───────────── */
  function defaults() {
    const gym = { id: uid(), name: 'Gym', equipment: [...ALL_EQUIPMENT] };
    const home = { id: uid(), name: 'Home – Upstairs', equipment: ['dumbbell', 'bench', 'bands'] };
    return {
      v: 1,
      profiles: [gym, home],
      activeProfile: gym.id,
      settings: { units: 'lb', goal: 'hypertrophy', level: 'intermediate', count: 6, restTimer: true, weight: 0, warmups: true, supersets: false, sport: '', restAlert: true, wakeLock: true },
      selected: [],
      regions: {},
      history: [],
      current: null,
      cardio: [],
      health: {},
      cardioLive: null,
      body: { heightCm: 0, ideal: 0, focus: '', set: false },
      plan: { days: [false, true, false, true, false, true, false], split: 'auto', time: '18:00', set: false },
      weights: [],
      measures: [],
      intake: {},
      custom: [],
      favs: [],
    };
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && Array.isArray(s.profiles) && s.profiles.length) {
        const d = defaults();
        return Object.assign(d, s, { settings: Object.assign(d.settings, s.settings || {}), body: Object.assign(d.body, s.body || {}) });
      }
    } catch (e) { /* fall through */ }
    return defaults();
  }
  let state = load();
  if (!Array.isArray(state.custom)) state.custom = [];
  if (!Array.isArray(state.favs)) state.favs = [];
  if (!Array.isArray(state.routines)) state.routines = [];
  if (!state.settings.stackSeeded) { state.profiles.forEach((p) => { if (p.name === 'Gym' && !p.stack) p.stack = { start: 2.5, step: 5, max: 97.5 }; }); state.settings.stackSeeded = true; }
  const isFav = (id) => state.favs.includes(id);
  CUSTOM.sync(state.custom, EXERCISES, EX_BY_ID);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage full / blocked */ } };

  // UI-only state (not persisted)
  const ui = { tab: 'train', libMuscle: 'all', libSearch: '', libMine: true, restEnd: 0, restTotal: 0, draft: null, cdraft: null, addMuscle: 'workout', addSearch: '' };

  const C = WPC({
    state: () => state, save: () => save(), render: () => render(), ui, toast: (m) => toast(m),
    openSheet: (t, h) => openSheet(t, h), closeSheet: () => closeSheet(), esc, fmtClock, fmtNum, fmtDate, uid, num,
  });

  const P = WPP({
    state: () => state, save: () => save(), render: () => render(), ui, toast: (m) => toast(m),
    openSheet: (t, h) => openSheet(t, h), closeSheet: () => closeSheet(), esc, build: (m) => buildFor(m),
  });
  const T = WPT({
    state: () => state, save: () => save(), render: () => render(), ui, toast: (m) => toast(m),
    openSheet: (t, h) => openSheet(t, h), closeSheet: () => closeSheet(), esc, num, fmtNum,
  });
  const B = WPB({
    state: () => state, save: () => save(), render: () => render(), ui, toast: (m) => toast(m),
    openSheet: (t, h) => openSheet(t, h), closeSheet: () => closeSheet(), esc, num,
  });

  const titleOf = (muscles, regions) => muscles.map((m) => {
    const r = regions && regions[m] && REGIONS[m] && REGIONS[m].find((x) => x[0] === regions[m]);
    return MUSCLE_NAME[m] + (r ? ` (${r[1]})` : '');
  }).join(' + ');

  const profile = () => state.profiles.find((p) => p.id === state.activeProfile) || state.profiles[0];
  const workoutProfile = () => (state.current && state.profiles.find((p) => p.id === state.current.profileId)) || profile();
  const equipLabel = (ex) => (ex.equip.length ? ex.equip.map((r) => r.split('|').map((x) => EQUIP_NAME[x]).join(' / ')).join(' + ') : 'Bodyweight');
  const poolCount = (muscle, owned) => EXERCISES.filter((e) => e.muscle === muscle && isAvailable(e, owned)).length;

  /* ───────────── history-derived info ───────────── */
  function daysSince(muscle) {
    let last = 0;
    for (const w of state.history) {
      if (w.exercises.some((e) => e.muscle === muscle && e.sets.length)) last = Math.max(last, w.endedAt || w.date);
    }
    return last ? Math.floor((startOfDay(Date.now()) - startOfDay(last)) / 86400000) : null;
  }
  function lastLog(exId) {
    for (const w of state.history) {
      const e = w.exercises.find((x) => x.exId === exId);
      const ws = e ? e.sets.filter((s) => !s.warm) : [];
      if (ws.length) return ws;
    }
    return null;
  }
  const volumeOf = (w) => w.exercises.reduce((t, e) => t + (e.timed ? 0 : e.sets.filter((s) => !s.warm).reduce((a, s) => a + s.w * s.r, 0)), 0);
  const setsOf = (w) => w.exercises.reduce((t, e) => t + e.sets.filter((s) => !s.warm).length, 0);

  /* ───────────── workout generation ───────────── */
  function prescription(ex, goal) {
    if (ex.timed) return { sets: 3, reps: '30-45', rest: 45 };
    const g = GOALS[goal] || GOALS.hypertrophy;
    return { ...(ex.compound ? g.compound : g.iso) };
  }
  /* Selectorized machines and cables only offer the weights on their stack (e.g. Life Fitness: 2.5, 7.5 … 97.5). */
  const stackOf = (ex, prof) => { const st = prof && prof.stack, k = PROG.kindOf(ex); return st && st.step > 0 && (k === 'machine' || k === 'cable') ? st : null; };
  function snapStack(st, w, dir) {
    const n = Math.max(0, Math.floor((st.max - st.start) / st.step + 1e-9));
    let k = (num(w) - st.start) / st.step;
    k = dir > 0 ? Math.ceil(k + 1e-9) : dir < 0 ? Math.floor(k - 1e-9) : Math.round(k);
    return st.start + Math.min(n, Math.max(0, k)) * st.step;
  }
  function snapEntry(en) {
    const ex = EX_BY_ID[en.exId], st = stackOf(ex, workoutProfile());
    if (!st) return;
    en.sets.forEach((s) => { if (num(s.w) > 0) s.w = String(snapStack(st, s.w, 0)); });
  }
  const REST_CHOICES = [30, 45, 60, 90, 120, 150, 180, 240, 300];
  const restLabel = (s) => (s < 60 ? `${s}s` : s % 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s / 60} min`);
  const restSelect = (cur, attrs, autoLabel) => `<select ${attrs} aria-label="Rest between sets">${autoLabel ? `<option value="0" ${!cur ? 'selected' : ''}>${autoLabel}</option>` : ''}${[...new Set([...REST_CHOICES, cur].filter(Boolean))].sort((x, y) => x - y).map((v) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${restLabel(v)}</option>`).join('')}</select>`;
  function makeEntry(ex, goal, fixed) {
    const target = fixed ? { ...prescription(ex, goal), ...fixed } : prescription(ex, goal);
    if (!fixed && state.settings.restSec > 0 && !ex.timed) target.rest = state.settings.restSec;
    const sg = PROG.suggest(ex, target, state.history, state.settings.units, EX_BY_ID);
    const sets = sg.sets.map((s) => ({ w: ex.timed ? '' : s.w, r: s.r, done: false }));
    const entry = { exId: ex.id, target, sets, note: sg.note, nkind: sg.kind };
    const dl = MOTIVE.deloadCheck(state);
    if (dl && dl.active && !ex.timed) {                      // deload week: fewer sets, about 15% lighter
      const k = Math.max(2, Math.round(entry.sets.length * 0.67));
      entry.sets = entry.sets.slice(0, k); entry.target = { ...entry.target, sets: k };
      const st = state.settings.units === 'kg' ? 1 : 2.5;
      entry.sets.forEach((s) => { if (num(s.w) > 0) s.w = String(Math.max(st, Math.round((num(s.w) * 0.85) / st) * st)); });
      entry.note = 'Deload week: fewer sets and about 15% lighter so you recover and come back stronger.'; entry.nkind = 'repeat';
    }
    snapEntry(entry);
    return entry;
  }

  /* Pair antagonist muscles (chest/back, biceps/triceps, quads/hamstrings) — or two isolation lifts — as supersets. */
  function pairSupersets(list) {
    const ANT = { chest: 'back', back: 'chest', biceps: 'triceps', triceps: 'biceps', quads: 'hamstrings', hamstrings: 'quads' };
    const used = new Set(), out = [], ssOf = new Map();
    let n = 0;
    list.forEach((e, a) => {
      if (used.has(e)) return;
      used.add(e); out.push(e);
      let f = list.find((x, k) => k > a && !used.has(x) && x.muscle === ANT[e.muscle]);
      if (!f && !e.compound) f = list.find((x, k) => k > a && !used.has(x) && !x.compound);
      if (f) { used.add(f); out.push(f); const L = String.fromCharCode(65 + n++); ssOf.set(e, [L, 1]); ssOf.set(f, [L, 2]); }
    });
    return { out, ssOf };
  }
  /* Ramp-up sets before the first heavy lift for each muscle. */
  function addWarmups(entries) {
    const u = state.settings.units, min = u === 'kg' ? 20 : 45, done = new Set();
    entries.forEach((en) => {
      const ex = EX_BY_ID[en.exId];
      if (en.ss || !PROG.weighted(ex) || done.has(ex.muscle)) return;
      const W = Math.max(0, ...en.sets.map((s) => num(s.w)));
      if (!(W >= min)) return;
      const kind = PROG.kindOf(ex), inc = u === 'kg' ? 2.5 : (kind === 'dumbbell' || kind === 'kettlebell' ? 2.5 : 5);
      const plan = ex.compound && W >= (u === 'kg' ? 50 : 100) ? [[0.4, 8], [0.6, 5], [0.8, 3]] : [[0.5, 8], [0.75, 4]];
      const warm = plan.map(([f, r]) => ({ w: Math.max(kind === 'barbell' ? min : inc, Math.round((W * f) / inc) * inc), r, done: false, warm: true, wm: true }))
        .filter((s, k, arr) => s.w < W && (k === 0 || s.w !== arr[k - 1].w))
        .map((s) => ({ ...s, w: String(s.w), r: String(s.r) }));
      if (warm.length) { en.sets = [...warm, ...en.sets]; done.add(ex.muscle); }
    });
  }
  function buildFor(muscles) {
    state.selected = muscles.filter((m) => poolCount(m, profile().equipment) > 0);
    if (state.selected.length && generate()) { ui.trainMode = 'strength'; ui.tab = 'train'; render(); window.scrollTo(0, 0); }
    else toast('No exercises available for that with this equipment profile');
  }

  function generate(sportDay) {
    const prof = profile();
    const sport = SPORT.get(state.settings.sport);
    const goal = sport ? sport.goal : state.settings.goal;
    const level = state.settings.level;
    const avail = EXERCISES.filter((e) => isAvailable(e, prof.equipment) && (level !== 'beginner' || e.level <= 2));
    const muscles = state.selected.filter((m) => avail.some((e) => e.muscle === m));
    if (!muscles.length) return false;

    const pool = {};
    muscles.forEach((m) => { pool[m] = avail.filter((e) => e.muscle === m); });
    const n = Math.max(state.settings.count, muscles.length);

    // Split the exercise budget across muscles — bigger muscles get more.
    const alloc = {};
    muscles.forEach((m) => { alloc[m] = 1; });
    let total = muscles.length;
    while (total < n) {
      let best = null, bs = -1;
      for (const m of muscles) {
        if (alloc[m] >= pool[m].length) continue;
        const s = ((WEIGHT[m] || 1) * SPORT.muscleWeight(sport, m)) / (alloc[m] + 1);
        if (s > bs) { bs = s; best = m; }
      }
      if (!best) break;
      alloc[best]++; total++;
    }

    // Variety: lightly avoid exercises done in the last few workouts.
    const recent = state.history.slice(0, 3).map((w) => new Set(w.exercises.map((e) => e.exId)));
    const penalty = (e) => (recent[0]?.has(e.id) ? 1.2 : 0) + (recent[1]?.has(e.id) ? 0.7 : 0) + (recent[2]?.has(e.id) ? 0.3 : 0);

    const chosen = [];
    for (const m of muscles) {
      const picked = [];
      const usedEquip = new Set();
      for (let k = 0; k < alloc[m]; k++) {
        let cands = pool[m].filter((e) => !picked.includes(e));
        const reg = state.regions[m];
        if (reg) { const pref = cands.filter((e) => (e.regions || []).includes(reg)); if (pref.length) cands = pref; }
        if (!cands.length) break;
        let best = null, bs = -Infinity;
        for (const e of cands) {
          let s = Math.random() - penalty(e) + SPORT.pickBonus(sport, e) + (isFav(e.id) ? 0.8 : 0);
          if (k === 0 && e.compound) s += 1.2;
          if (k > 0 && !e.compound) s += 0.6;
          if (usedEquip.has(e.equip.join('+') || 'bw')) s -= 0.7;
          if (level === 'advanced' && e.level === 3) s += 0.3;
          if (level === 'beginner' && e.level === 1) s += 0.3;
          if (s > bs) { bs = s; best = e; }
        }
        picked.push(best);
        usedEquip.add(best.equip.join('+') || 'bw');
      }
      chosen.push(...picked);
    }

    // Big compound lifts first, isolation next, core last.
    const rank = (e) => (e.muscle === 'core' ? 2 : e.compound ? 0 : 1);
    chosen.sort((a, b) => rank(a) - rank(b));

    let order = chosen, ssOf = new Map();
    if (state.settings.supersets && chosen.length > 1) ({ out: order, ssOf } = pairSupersets(chosen));
    const entries = order.map((e) => {
      const en = makeEntry(e, goal), ss = ssOf.get(e);
      const wy = SPORT.why(sport, e); if (wy) en.why = wy;
      if (ss) { en.ss = ss[0]; en.ssPos = ss[1]; }
      return en;
    });
    entries.forEach((en) => { if (en.ssPos === 2) { const pa = entries.find((x) => x.ss === en.ss && x.ssPos === 1); if (pa) evenSets(pa, en); } });
    entries.forEach(snapEntry);
    if (state.settings.warmups) addWarmups(entries);
    entries.forEach(snapEntry);

    state.current = {
      id: uid(), createdAt: Date.now(), startedAt: null,
      profileId: prof.id, profileName: prof.name, muscles, goal,
      regions: Object.fromEntries(muscles.filter((m) => state.regions[m]).map((m) => [m, state.regions[m]])),
      exercises: entries,
    };
    if (sport) state.current.sport = typeof sportDay === 'number' ? { id: sport.id, day: sportDay } : { id: sport.id };
    save();
    return true;
  }

  /* ───────────── rendering ───────────── */
  function viewTrain() {
    if (state.current) return viewWorkout();
    if (ui.trainMode === 'cardio') return C.modeSwitch() + C.trainView();
    const planSet = P.isSet();
    return C.modeSwitch() + C.liveBanner() + todayCard() + recoveryCard() + viewRoutines() + (planSet ? P.trainCard() : '') + viewBuilder()
      + `<h2 class="section">Your day</h2>` + C.todayMini() + B.trainBanner() + (planSet ? "" : P.trainCard());
  }

  /* ───────────── saved routines ───────────── */
  function routineFrom(w, name) {
    return { id: uid(), name, created: Date.now(), lastUsed: 0, goal: w.goal, muscles: w.muscles.slice(), regions: { ...(w.regions || {}) },
      exercises: w.exercises.filter((en) => EX_BY_ID[en.exId]).map((en) => ({ exId: en.exId, sets: en.sets.filter((s) => !s.warm).length || en.target.sets,
        reps: en.target.reps, rest: en.target.rest, ...(en.ss ? { ss: en.ss, ssPos: en.ssPos } : {}) })) };
  }
  /* ───────────── recovery map ───────────── */
  const recStatus = () => RECOVERY.status(state.history, EX_BY_ID, Date.now(), state.cardio || []);
  function recoveryCard() {
    if (!state.history.length && !(state.cardio || []).length) return '';
    const st = recStatus();
    const order = MUSCLES.map((m) => m.id).sort((x, y) => st[x].pct - st[y].pct);
    const pick = ui.recM && st[ui.recM] ? ui.recM : order[0];
    const fig = (side, dx) => ANATOMY.figure(side, dx, (m) => RECOVERY.color(st[m].pct), pick, (m) => MUSCLE_NAME[m], (m) => st[m].pct);
    const r = st[pick], ago = r.lastAt ? Math.round((Date.now() - r.lastAt) / 3600e3) : null;
    const agoTxt = ago === null ? 'not trained this week' : ago < 24 ? `trained ${ago}h ago` : `trained ${Math.round(ago / 24)}d ago`;
    const ready = r.pct >= 95 ? 'Ready to train' : `About ${r.readyIn < 24 ? r.readyIn + 'h' : Math.round(r.readyIn / 24) + ' day' + (Math.round(r.readyIn / 24) > 1 ? 's' : '')} until fully recovered`;
    const sel = state.selected.includes(pick);
    const fresh = order.filter((m) => st[m].pct >= 90).length;
    return `<details class="card recovery" ${ui.recOpen === false ? '' : 'open'} id="recCard">
      <summary><h2>Recovery</h2><span class="muted small">${fresh} of ${MUSCLES.length} muscles fresh</span></summary>
      <svg class="recmap" viewBox="${ANATOMY.VIEWBOX}" role="group" aria-label="Recovery map">${fig('front', 0)}${fig('back', 110)}</svg>
      <div class="legend"><span><i style="background:${RECOVERY.color(15)}"></i>Recovering</span><span><i style="background:${RECOVERY.color(70)}"></i>Almost</span><span><i style="background:${RECOVERY.color(100)}"></i>Fresh</span></div>
      <div class="recinfo">
        <div><b>${MUSCLE_NAME[pick]} · ${r.pct}%</b><small>${agoTxt}${r.via ? ` · ${esc(CARDIO.TYPE_NAME[r.via] || r.via)}` : r.sets ? ` · ${r.sets} sets` : ''} · ${ready}</small></div>
        <button class="pill ${sel ? 'on' : ''}" data-act="toggle-muscle" data-m="${pick}">${sel ? '✓ In workout' : '＋ Train it'}</button>
      </div>
      <p class="muted small">An estimate from your logged sets and cardio (runs, elliptical, golf and other activities count too): bigger muscles and harder sessions take longer. Tap a muscle for details.</p>
    </details>`;
  }

  function deloadHtml() {
    const dl = MOTIVE.deloadCheck(state);
    if (!dl) return '';
    if (dl.active) return `<div class="deload on"><b>🌿 Deload week</b><small>Fewer sets, ~15% lighter until ${new Date(dl.until).toLocaleDateString(undefined, { weekday: 'short' })}.</small><button class="link" data-act="dl-end">End early</button></div>`;
    return `<div class="deload"><b>Time for a lighter week?</b><small>${esc(dl.reason)}. A deload week (fewer sets, ~15% lighter) helps you recover and keep progressing.</small>
      <div class="row gap"><button class="pill on" data-act="dl-start">Start deload week</button><button class="pill" data-act="dl-snooze">Not now</button></div></div>`;
  }
  function todayCard() {
    const now = Date.now(), sug = P.isSet() ? PLAN.suggestToday(state, now) : null;
    const last = state.history[0];
    const days = last ? Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(last.date).setHours(0, 0, 0, 0)) / 86400000) : null;
    const wk = state.history.filter((h) => h.date >= now - 7 * 86400000).length;
    const r = state.routines.slice().sort((x, y) => (y.lastUsed || y.created) - (x.lastUsed || x.created))[0];
    let btn;
    if (sug && sug.doneToday) btn = '<p class="tc-done">✓ Done for today — nice work.</p>';
    else if (sug && sug.planned && sug.routineId) btn = `<button class="primary big" data-act="rt-start" data-id="${sug.routineId}">▶ Today: ${esc(sug.label)}</button>`;
    else if (sug && sug.planned) btn = `<button class="primary big" data-act="pl-build">▶ Today: ${esc(sug.label)}</button>`;
    else if (r) btn = `<button class="primary big" data-act="rt-start" data-id="${r.id}">▶ Start ${esc(r.name)}</button>`;
    else btn = '<button class="primary big" data-act="go-build">Build today’s workout ↓</button>';
    const d = new Date();
    return `<section class="card todaycard">
      <div class="row between"><p class="tc-date">${d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>${(() => { const s = MOTIVE.streak(state); return s.weeks ? `<span class="streak" title="Weeks in a row with a workout">🔥 ${s.weeks}-week streak</span>` : ''; })()}</div>
      ${deloadHtml()}
      <div class="tc-stats">
        <div><b>${wk}</b><small>workouts this week</small></div>
        <div><b>${last ? (days === 0 ? 'Today' : days === 1 ? 'Yesterday' : days + 'd ago') : '—'}</b><small>${last ? esc(titleOf(last.muscles, last.regions)) : 'no workouts yet'}</small></div>
      </div>
      ${btn}
      <button class="link" data-act="log-open">＋ Log a run, sport or workout I didn’t track here</button></section>`;
  }
  function viewRoutines() {
    const rs = state.routines;
    if (!rs.length) return `<section class="card routines"><div class="row between"><h2>Routines</h2><button class="link" data-act="rt-paste">＋ Paste a routine</button></div><p class="muted small">Save a workout you like with ☆ Save as routine, or paste one from a website or notes.</p></section>`;
    return `<section class="card routines"><div class="row between"><h2>Your routines</h2><button class="link" data-act="rt-paste">＋ Paste</button></div>
      ${rs.map((r) => `<div class="rt">
        <div><b>${esc(r.name)}</b><small>${r.exercises.length} exercises · ${esc(r.exercises.slice(0, 3).map((x) => (EX_BY_ID[x.exId] || {}).name).filter(Boolean).join(', '))}${r.exercises.length > 3 ? '…' : ''}${r.lastUsed ? ' · last ' + fmtDate(r.lastUsed) : ''}</small></div>
        <button class="pill on" data-act="rt-start" data-id="${r.id}">▶ Start</button>
        <button class="link" data-act="rt-menu" data-id="${r.id}" aria-label="More for ${esc(r.name)}">⋯</button>
      </div>`).join('')}</section>`;
  }
  function startRoutine(r) {
    const prof = profile(), owned = prof.equipment;
    const list = r.exercises.filter((x) => EX_BY_ID[x.exId]);
    const missing = list.filter((x) => !isAvailable(EX_BY_ID[x.exId], owned)).length;
    const entries = list.map((x) => {
      const ex = EX_BY_ID[x.exId];
      const en = makeEntry(ex, r.goal || state.settings.goal, { sets: x.sets, reps: x.reps, rest: x.rest });
      if (x.ss) { en.ss = x.ss; en.ssPos = x.ssPos; }
      return en;
    });
    entries.forEach((en) => { if (en.ss && entries.filter((x) => x.ss === en.ss).length !== 2) { delete en.ss; delete en.ssPos; } });
    entries.forEach((en) => { if (en.ssPos === 2) { const pa = entries.find((x) => x.ss === en.ss && x.ssPos === 1); if (pa) evenSets(pa, en); } });
    if (state.settings.warmups) addWarmups(entries);
    entries.forEach(snapEntry);
    state.current = { id: uid(), createdAt: Date.now(), startedAt: null, profileId: prof.id, profileName: prof.name,
      muscles: r.muscles, goal: r.goal || state.settings.goal, regions: { ...(r.regions || {}) }, exercises: entries, routineId: r.id, routineName: r.name };
    save(); ui.tab = 'train'; render(); window.scrollTo(0, 0);
    toast(missing ? `${missing} exercise${missing > 1 ? 's' : ''} need gear this profile doesn’t have — swap them if needed` : `${r.name} ready — weights updated from last time`);
  }
  function saveRoutinePrompt(w) {
    const name = (prompt('Name this routine', w.routineName || titleOf(w.muscles, w.regions)) || '').trim();
    if (!name) return;
    state.routines.unshift(routineFrom(w, name)); save(); toast(`Saved “${name}” — find it on the Train tab`);
  }
  /* paste a routine from text */
  function sheetPaste() {
    const d = ui.paste || (ui.paste = { text: '', name: '', items: null, skipped: [] });
    if (!d.items) {
      openSheet('Paste a routine', `
        <p class="muted">Paste a workout from a website, a note or a message. One exercise per line, like <i>Bench Press 4x8</i> or <i>Lat pulldown – 3 sets of 10-12</i>.</p>
        <textarea id="pasteText" rows="9" placeholder="Push Day&#10;Bench Press 4x6-8&#10;Incline DB Press 3x10&#10;Cable flyes 3 x 12-15&#10;Tricep pushdowns 3x12">${esc(d.text)}</textarea>
        <div class="row gap wrap"><button class="pill on" data-act="rt-parse">Read it</button><button class="pill" data-act="close-sheet">Cancel</button></div>`);
      return;
    }
    openSheet('Check your routine', `
      <div class="field"><label for="pasteName">Routine name</label><input id="pasteName" value="${esc(d.name)}" maxlength="40"></div>
      ${d.items.length ? `<div class="rt-list">${d.items.map((x, k) => `<div class="pr"><div><b>${esc(x.name)}</b><small>${x.sets} × ${esc(x.reps)}${x.max ? ' · last set max' : ''} · from “${esc(x.src)}”</small></div><button class="link danger" data-act="rt-pdel" data-k="${k}" aria-label="Remove ${esc(x.name)}">✕</button></div>`).join('')}</div>` : '<p class="empty">No exercises recognised.</p>'}
      ${d.skipped.length ? `<p class="muted small">Couldn’t match: ${d.skipped.map(esc).join(' · ')}. Add those with ＋ Add exercise after you start, or create them as custom exercises.</p>` : ''}
      <div class="row gap wrap">${d.items.length ? '<button class="pill on" data-act="rt-psave">Save routine</button>' : ''}<button class="pill" data-act="rt-pback">Edit text</button></div>`);
  }
  function sheetRoutineMenu(r) {
    openSheet(r.name, `
      <div class="rt-list">${r.exercises.map((x) => { const ex = EX_BY_ID[x.exId]; return ex ? `<p><b>${esc(ex.name)}</b> <span class="muted">${x.sets} × ${esc(x.reps)}${ex.timed ? 's' : ''}${x.ss ? ` · superset ${x.ss}` : ''}</span></p>` : ''; }).join('')}</div>
      <button class="primary big" data-act="rt-start" data-id="${r.id}">▶ Start this routine</button>
      <div class="row gap wrap"><button class="pill" data-act="rt-rename" data-id="${r.id}">Rename</button><button class="pill ghost danger" data-act="rt-del" data-id="${r.id}">Delete</button></div>`);
  }

  function viewBuilder() {
    const prof = profile();
    const owned = prof.equipment;
    const selected = state.selected.filter((m) => poolCount(m, owned) > 0);
    const unlocked = EXERCISES.filter((e) => isAvailable(e, owned)).length;
    const s = state.settings;

    const rst = recStatus();
    const chips = MUSCLES.map((m) => {
      const count = poolCount(m.id, owned);
      const d = daysSince(m.id), pct = rst[m.id] ? rst[m.id].pct : 100;
      const rec = RECOVERY.level(pct);
      const ago = pct < 95 ? ` · ${pct}% recovered` : d === null ? '' : d === 0 ? ' · today' : ` · ${d}d ago`;
      const on = selected.includes(m.id);
      return `<button class="chip ${on ? 'on' : ''}" data-act="toggle-muscle" data-m="${m.id}" aria-pressed="${on}" ${count ? '' : 'disabled'}>
        <span class="dot ${rec}"></span><b>${m.name}</b><small>${count ? `${count} exercises${ago}` : 'no gear for this'}</small></button>`;
    }).join('');

    const presets = MUSCLE_PRESETS.map(([id, label]) => `<button class="pill" data-act="preset" data-p="${id}">${label}</button>`).join('')
      + `<button class="pill ghost" data-act="preset" data-p="clear">Clear</button>`;

    const regionRows = selected.filter((m) => REGIONS[m]).map((m) => {
      const cur = state.regions[m] || '';
      const cnt = (r) => EXERCISES.filter((e) => e.muscle === m && isAvailable(e, owned) && e.regions.includes(r)).length;
      return `<div class="field regions"><label>${MUSCLE_NAME[m]} focus</label><div class="pills">
        <button class="pill ${cur ? '' : 'on'}" data-act="set-region" data-m="${m}" data-r="">All</button>
        ${REGIONS[m].map(([id, label]) => `<button class="pill ${cur === id ? 'on' : ''}" data-act="set-region" data-m="${m}" data-r="${id}" ${cnt(id) ? '' : 'disabled'}>${label}</button>`).join('')}</div></div>`;
    }).join('');

    const seg = (key, opts) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button data-act="set-${key}" data-v="${v}" class="${s[key] === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;

    const sp = SPORT.get(s.sport);
    const summary = [GOALS[s.goal].label, s.level[0].toUpperCase() + s.level.slice(1), sp ? sp.icon + ' ' + sp.name : null, `${s.count} exercises`].filter(Boolean).join(' · ');
    return `<div class="builder">
      <section class="card">
        <div><h2>What are we training?</h2>
        <p class="muted">Tap the muscles you want today.</p></div>
        <div class="pills">${presets}</div>
        <div class="chips">${chips}</div>
        ${regionRows}
        <p class="muted small gearline"><b>${esc(prof.name)}</b> · ${unlocked} exercises · <button class="link" data-act="edit-profile" data-id="${prof.id}">Edit gear</button> · <button class="link" data-act="open-profiles">Switch</button></p>
      </section>
      <details class="card opts" id="opts" ${ui.optsOpen ? 'open' : ''}>
        <summary><span><b>Workout options</b><small>${esc(summary)}</small></span><i aria-hidden="true">▾</i></summary>
        ${sportCard()}
        <div class="field"><label>Goal</label>${seg('goal', Object.entries(GOALS).map(([k, g]) => [k, g.label]))}</div>
        <div class="field"><label>Experience</label>${seg('level', [['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']])}</div>
        <div class="field restfield"><label for="restDefault">Rest between sets</label>${restSelect(s.restSec || 0, 'id="restDefault"', 'Auto (by goal)')}</div>
        <label class="toggle"><input type="checkbox" id="warmToggle" ${s.warmups ? 'checked' : ''}> <span>Add warm-up sets before heavy lifts</span></label>
        <label class="toggle"><input type="checkbox" id="ssToggle" ${s.supersets ? 'checked' : ''}> <span>Auto-pair into supersets when building (you can also link any two during a workout)</span></label>
        <div class="field row between"><label>Exercises</label>
          <div class="stepper"><button data-act="count" data-d="-1" aria-label="Fewer">−</button><output>${s.count}</output><button data-act="count" data-d="1" aria-label="More">+</button></div>
        </div>
      </details>
      <div class="buildbar"><button class="primary big" data-act="generate" ${selected.length ? '' : 'disabled'}>${selected.length ? `Build ${titleOf(selected, state.regions)} workout${sp ? ' for ' + esc(sp.name) : ''}` : 'Pick a body part to start'}</button></div>
    </div>`;
  }

  function sportCard() {
    const sp = SPORT.get(state.settings.sport);
    const pills = `<button class="pill ${sp ? '' : 'on'}" data-act="set-sport" data-v="">None</button>` + SPORT.SPORTS.map((x) => `<button class="pill ${sp && sp.id === x.id ? 'on' : ''}" data-act="set-sport" data-v="${x.id}" aria-pressed="${!!sp && sp.id === x.id}">${x.icon} ${x.name}</button>`).join('');
    let more = '';
    if (sp) {
      const di = SPORT.nextDay(sp, state.history), day = sp.days[di];
      more = `<p class="muted">${esc(sp.blurb)}</p>
        <p class="muted small">Sets and reps follow ${esc(GOALS[sp.goal].label.toLowerCase())} training for this sport. Exercises that help ${esc(sp.name)} are chosen first, and each one says why.</p>
        <p class="muted small"><b>Pick the muscles you want above</b> and the workout stays on them, using the lifts that help ${esc(sp.name)}.</p>
        <button class="pill" data-act="sport-build">Or let ${esc(sp.name)} pick today’s session: ${esc(day[0])}</button>
        <p class="muted small">Session rotation: ${sp.days.map((d, k) => (k === di ? `<b>${esc(d[0])}</b>` : esc(d[0]))).join(' → ')}.</p>`;
    }
    return `<div class="field sport"><label>Train for a sport</label><div class="pills scroll" id="sportPills">${pills}</div>${more}</div>`;
  }

  function lastText(ex) {
    const last = lastLog(ex.id);
    return last ? 'Last: ' + last.map((x) => (ex.timed ? `${x.r}s` : `${x.w ? x.w + '×' : ''}${x.r}`)).join(' · ') : 'First time — pick a weight that feels right';
  }
  const noteHtml = (entry) => (entry.note ? `<p class="sugg ${entry.nkind}"><span aria-hidden="true">${entry.nkind === 'progress' || entry.nkind === 'reps' ? '▲' : entry.nkind === 'lighter' ? '▼' : entry.nkind === 'estimate' ? '≈' : '='}</span> ${esc(entry.note)}</p>` : '');
  const whyHtml = (entry) => (entry.why ? `<p class="why">${(SPORT.get(state.current && state.current.sport && state.current.sport.id) || {}).icon || '★'} ${esc(entry.why)}</p>` : '');
  /** One set row. label = number shown at the left. */
  function setRow(entry, i, j, label) {
    const ex = EX_BY_ID[entry.exId], st = entry.sets[j], units = state.settings.units;
    return `
      <div class="set ${st.done ? 'done' : ''} ${st.warm ? 'warm' : ''} ${st.max ? 'max' : ''}" data-i="${i}" data-j="${j}">
        <span class="n">${st.max ? '★' : label}</span>
        ${ex.timed ? '<span class="w-na"></span><span></span>' : `<input class="w" inputmode="decimal" data-field="w" placeholder="${ex.loaded ? '0' : 'BW'}" value="${esc(st.w)}" aria-label="Weight"><span class="u">${units}</span>`}
        <input class="r" inputmode="numeric" data-field="r" placeholder="${st.max ? 'max' : esc(entry.target.reps)}" value="${esc(st.r)}" aria-label="${ex.timed ? 'Seconds' : 'Reps'}"><span class="u">${ex.timed ? 'sec' : 'reps'}</span>
        <button class="check" data-act="toggle-set" aria-pressed="${st.done}" aria-label="Mark set ${j + 1} done">✓</button>
        ${prevHtml(entry, ex, j)}
      </div>${effortHtml(entry, i, j)}${st.max && !st.done ? '<p class="fxhint">Max out: as many good reps as you can, then tick it.</p>' : ''}`;
  }
  /** What you did on this same set last time; tap to copy it in. */
  function prevSet(entry, j) {
    const st = entry.sets[j]; if (st.warm) return null;
    const last = lastLog(entry.exId); if (!last) return null;
    const k = entry.sets.slice(0, j).filter((s) => !s.warm).length;
    return last[k] || null;
  }
  /** The working set just before j in this workout, if it's done and j is the next one to do. */
  function sameSrc(entry, j) {
    const st = entry.sets[j]; if (st.warm || st.done || st.max) return null;
    let k = j - 1; while (k >= 0 && entry.sets[k].warm) k--;
    if (k < 0 || !entry.sets[k].done) return null;
    return { k, s: entry.sets[k], n: entry.sets.slice(0, k + 1).filter((x) => !x.warm).length };
  }
  function prevHtml(entry, ex, j) {
    const st = entry.sets[j], same = sameSrc(entry, j);
    if (same) {
      const txt = ex.timed ? `${same.s.r}s` : `${num(same.s.w) ? same.s.w + ' × ' : ''}${same.s.r}`;
      return `<button class="prev same" data-act="same-prev" aria-label="Same as set ${same.n}: ${txt}, and mark done">↻ Same as set ${same.n} · <b>${txt}</b> ✓</button>`;
    }
    const p = prevSet(entry, j);
    if (!p || st.done) return '';
    const txt = ex.timed ? `${p.r}s` : `${p.w ? p.w + ' ' + state.settings.units + ' × ' : ''}${p.r}`;
    return `<button class="prev" data-act="use-prev" aria-label="Last time: ${txt}. Tap to use">Last time: <b>${txt}</b>${p.max ? ' (max)' : ''}</button>`;
  }
  const FX = { hard: ['Hard', 'No more reps'], ok: ['Just right', '1–2 more'], easy: ['Easy', '3+ more'] };
  /** After a working set is ticked: "could you have done more reps?" (not asked for warm-ups or max sets). */
  const lastWorkIdx = (en) => { for (let k = en.sets.length - 1; k >= 0; k--) if (!en.sets[k].warm) return k; return -1; };
  const exerciseDone = (en) => en.sets.every((s) => s.warm || s.done);
  function effortHtml(en, i, j) {
    if (j !== lastWorkIdx(en) || !exerciseDone(en) || en.sets[j].max) return '';
    if (en.fx) return `<div class="fx fx-done" data-i="${i}" data-j="${j}"><span class="fxtag fx-${en.fx}">${FX[en.fx][0]} · ${FX[en.fx][1]}</span><button class="link" data-act="fx-clear">change</button></div>`;
    return `<div class="fx" data-i="${i}" data-j="${j}" role="group" aria-label="Could you have done more reps?"><span class="fxq">How was ${esc(EX_BY_ID[en.exId].name)}? Could you have done more reps?</span>
      ${Object.entries(FX).map(([k, [l, s]]) => `<button class="fxb fx-${k}" data-act="fx" data-v="${k}"><b>${l}</b><small>${s}</small></button>`).join('')}</div>`;
  }
  /** Two linked exercises as one card: A1, B1, A2, B2 … with the rest timer after each round. */
  function ssCard(a, ia, b, ib) {
    const blocks = [[a, ia, 'A'], [b, ib, 'B']].map(([en, idx, tag]) => {
      const ex = EX_BY_ID[en.exId];
      return `<div class="ssblock">
        <div class="hd-text"><p class="who"><b>${tag}</b> <span class="muted small">${MUSCLE_NAME[ex.muscle]}</span></p><h3>${esc(ex.name)}</h3>
        <p class="meta">${esc(equipLabel(ex))} · <b>${en.target.sets} × ${esc(en.target.reps)}${ex.timed ? 's' : ''}</b></p>
        ${lastLog(ex.id) ? '' : `<p class="last">${esc(lastText(ex))}</p>`}${whyHtml(en)}${noteHtml(en)}
        <p class="blk-actions"><label class="restpick">Rest ${restSelect(en.target.rest, `class="restsel" data-xi="${idx}"`)}</label><button class="link" data-act="swap" data-xi="${idx}">Swap</button><button class="link danger" data-act="remove-ex" data-xi="${idx}">Remove</button></p></div>
        <div class="anim" data-ex="${ex.id}" data-act="form-guide" role="button" tabindex="0" aria-label="Open form guide for ${esc(ex.name)}"></div>
      </div>`;
    }).join('');
    const warm = [[a, ia, 'A'], [b, ib, 'B']].map(([en, idx, tag]) => en.sets.map((st, j) => (st.warm ? `<p class="rlab">Warm-up · ${tag} · ${esc(EX_BY_ID[en.exId].name)}</p>${setRow(en, idx, j, 'W')}` : '')).join('')).join('');
    const wa = workIdx(a), wb = workIdx(b), rounds = Math.max(wa.length, wb.length);
    let rr = '';
    for (let r = 0; r < rounds; r++) {
      rr += `<div class="round"><p class="rh">Round ${r + 1}</p>
        ${wa[r] !== undefined ? `<p class="rlab"><b>A</b> ${esc(EX_BY_ID[a.exId].name)}</p>${setRow(a, ia, wa[r], r + 1)}` : ''}
        ${wb[r] !== undefined ? `<p class="rlab"><b>B</b> ${esc(EX_BY_ID[b.exId].name)}</p>${setRow(b, ib, wb[r], r + 1)}` : ''}</div>`;
    }
    return `<article class="ex ss ssgroup" data-i="${ia}">
      <header class="sshd"><span class="badge ss-badge">Superset ${a.ss}</span><span class="muted small">Do A, then B straight away — rest after each round.</span></header>
      <div class="sspair">${blocks}</div>
      ${warm}${rr}
      <footer>
        <button class="link" data-act="ss-add" data-xi="${ia}">+ Round</button>
        <button class="link" data-act="ss-rem" data-xi="${ia}">− Round</button>
        <button class="link" data-act="ss-unlink" data-xi="${ia}">Unlink</button>
      </footer>
    </article>`;
  }
  function entriesHtml(w) {
    let out = '';
    for (let k = 0; k < w.exercises.length; k++) {
      const en = w.exercises[k], nx = w.exercises[k + 1];
      if (en.ss && en.ssPos === 1 && nx && nx.ss === en.ss && nx.ssPos === 2) { out += ssCard(en, k, nx, k + 1); k++; }
      else out += entryCard(en, k);
    }
    return out;
  }

  function entryCard(entry, i) {
    const ex = EX_BY_ID[entry.exId];
    const lastTxt = lastText(ex);
    let wn = 0;
    const rows = entry.sets.map((st, j) => setRow(entry, i, j, st.warm ? 'W' : ++wn)).join('');
    return `
      <article class="ex ${entry.ss ? 'ss' : ''}" data-i="${i}">
        <header>
          <div class="hd-text"><h3>${esc(ex.name)}</h3>
          ${entry.ss ? `<span class="badge ss-badge">Superset ${entry.ss} · ${entry.ssPos}/2</span>` : ''}
          <p class="meta">${MUSCLE_NAME[ex.muscle]} · ${esc(equipLabel(ex))} · <b>${entry.target.sets} × ${esc(entry.target.reps)}${ex.timed ? 's' : ''}</b></p></div>
          <div class="anim" data-ex="${ex.id}" data-act="form-guide" role="button" tabindex="0" aria-label="Open form guide for ${esc(ex.name)}"></div>
        </header>
        <p class="cue">${esc(ex.cue)}</p>
        ${entry.why ? `<p class="why">${(SPORT.get(state.current && state.current.sport && state.current.sport.id) || {}).icon || '★'} ${esc(entry.why)}</p>` : ''}
        ${entry.note ? `<p class="sugg ${entry.nkind}"><span aria-hidden="true">${entry.nkind === 'progress' || entry.nkind === 'reps' ? '▲' : entry.nkind === 'lighter' ? '▼' : entry.nkind === 'estimate' ? '≈' : '='}</span> ${esc(entry.note)}</p>` : ''}
        ${lastLog(ex.id) ? '' : `<p class="last">${esc(lastTxt)}</p>`}
        <div class="sets">${rows}</div>
        <footer>
          <button class="link" data-act="add-set">+ Set</button>
          <button class="link" data-act="remove-set">− Set</button>
          <button class="link" data-act="swap">Swap</button>
          <label class="restpick">Rest ${restSelect(entry.target.rest, `class="restsel" data-xi="${i}"`)}</label>
          ${!ex.timed ? `<button class="link ${entry.sets.some((s) => s.max) ? 'on' : ''}" data-act="max-set">${entry.sets.some((s) => s.max) ? '★ Max set on' : '★ Max out'}</button>` : ''}
          ${!entry.ss && state.current && state.current.exercises.length > 1 ? '<button class="link" data-act="ss-open">🔗 Superset</button>' : ''}
          <button class="link danger" data-act="remove-ex">Remove</button>
        </footer>
      </article>`;
  }

  function exProgress(w) {
    const total = w.exercises.length, done = w.exercises.filter((e) => e.sets.length && e.sets.every((s) => s.done)).length;
    return { total, done };
  }
  function progress(w) {
    const total = w.exercises.reduce((t, e) => t + e.sets.length, 0);
    const done = w.exercises.reduce((t, e) => t + e.sets.filter((s) => s.done).length, 0);
    return { total, done };
  }

  function viewWorkout() {
    const w = state.current;
    const { total, done } = progress(w);
    const started = !!w.startedAt;
    const xp = exProgress(w);
    return `
      <div class="wbar" role="status" aria-label="Workout progress">
        <div class="wclock"><span id="elapsed">${started ? fmtClock((Date.now() - w.startedAt) / 1000) : '0:00'}</span><small>${started ? 'elapsed' : 'not started'}</small></div>
        <div class="wprog"><b id="exProg">${xp.done} of ${xp.total} exercises</b><div class="bar"><i id="barFill" style="width:${total ? (done / total) * 100 : 0}%"></i></div><small id="progressTxt">${done} of ${total} sets done</small></div>
      </div>
      <section class="card summary">
        <div><h2>${esc(w.routineName || titleOf(w.muscles, w.regions))}</h2>
          <p class="muted">${esc(w.profileName)} · ${GOALS[w.goal]?.label || ''}${w.sport && SPORT.get(w.sport.id) ? ` · ${SPORT.get(w.sport.id).icon} ${esc(SPORT.get(w.sport.id).name)}` : ''}</p></div>
        ${started ? '' : '<button class="primary big" data-act="start-workout">▶ Start workout</button>'}
        <div class="row gap">
          ${done === 0 ? '<button class="pill" data-act="regen">↻ Regenerate</button>' : ''}
          ${w.routineId ? '' : '<button class="pill" data-act="rt-save-cur">☆ Save as routine</button>'}
          <button class="pill ghost" data-act="discard">Discard</button>
        </div>
      </section>
      ${entriesHtml(w)}
      <button class="pill wide" data-act="open-add">＋ Add exercise</button>
      ${started ? '<div class="buildbar"><button class="primary big" data-act="finish">Finish workout</button></div>' : ''}`;
  }

  function libItems() {
    const owned = profile().equipment;
    const q = ui.libSearch.trim().toLowerCase();
    const list = EXERCISES.filter((e) =>
      (ui.libMuscle === 'all' || (ui.libMuscle === 'fav' ? isFav(e.id) : e.muscle === ui.libMuscle)) &&
      (!ui.libMine || isAvailable(e, owned)) &&
      (!q || CUSTOM.matches(`${e.name} ${MUSCLE_NAME[e.muscle]}`, q)));
    if (!list.length && ui.libMuscle === 'fav' && !q) return '<p class="empty">No favorites yet. Tap the ☆ beside any exercise to save it here.</p>';
    if (!list.length) return `<p class="empty">No exercises match. Try turning off “My equipment only”, or <button class="link" data-act="cx-new" data-name="${esc(ui.libSearch.trim())}">create “${esc(ui.libSearch.trim() || 'your own')}”</button>.</p>`;
    return list.map((e) => `
      <details class="lib">
        <summary><span><b>${esc(e.name)}</b><small>${MUSCLE_NAME[e.muscle]} · ${esc(equipLabel(e))}</small></span>${isAvailable(e, owned) ? '' : '<em class="needgear">needs gear</em>'}<button class="star ${isFav(e.id) ? 'on' : ''}" data-act="fav" data-id="${e.id}" aria-pressed="${isFav(e.id)}" aria-label="Favorite ${esc(e.name)}">${isFav(e.id) ? '★' : '☆'}</button></summary>
        <div class="anim" data-ex="${e.id}" data-act="form-guide" role="button" tabindex="0" aria-label="Open form guide for ${esc(e.name)}"></div>
        <p>${esc(e.cue)}</p>
        <p class="tags">${e.custom ? '<span class="cust">Custom</span>' : ''}<span>${LEVELS[e.level]}</span>${e.compound ? '<span>Compound</span>' : '<span>Isolation</span>'}${e.secondary.map((s) => `<span>+ ${MUSCLE_NAME[s]}</span>`).join('')}</p>
        <div class="row gap wrap">${state.current && isAvailable(e, owned) ? `<button class="pill" data-act="lib-add" data-id="${e.id}">Add to current workout</button>` : ''}${e.custom ? `<button class="pill" data-act="cx-edit" data-id="${e.id}">Edit</button><button class="pill danger" data-act="cx-del" data-id="${e.id}">Delete</button>` : ''}</div>
      </details>`).join('');
  }

  function viewLibrary() {
    const chips = [['all', 'All'], ['fav', `★ Favorites${state.favs.length ? ' (' + state.favs.length + ')' : ''}`], ...MUSCLES.map((m) => [m.id, m.name])]
      .map(([id, l]) => `<button class="pill ${ui.libMuscle === id ? 'on' : ''}" data-act="lib-muscle" data-m="${id}">${l}</button>`).join('');
    return `
      <section class="card">
        <h2>Exercise library</h2>
        <input type="search" id="libSearch" class="search" placeholder="Search ${EXERCISES.length} exercises" value="${esc(ui.libSearch)}">
        <div class="pills scroll">${chips}</div>
        <button class="pill wide" data-act="cx-new">＋ Create your own exercise</button>
        <label class="toggle"><input type="checkbox" id="libMine" ${ui.libMine ? 'checked' : ''}> <span>Only exercises I can do with <b>${esc(profile().name)}</b></span></label>
      </section>
      <div id="libList">${libItems()}</div>`;
  }

  function viewHistory() {
    if (ui.histMode === 'body') return T.bodyView();
    return T.histSwitch() + '<button class="pill wide" data-act="log-open">＋ Log a workout, sport or activity</button>' + viewWorkoutHistory();
  }

  function calendarCard() {
    const now = new Date(), off = ui.calOff || 0;
    const first = new Date(now.getFullYear(), now.getMonth() + off, 1);
    const days = MOTIVE.activeDays(state), st = MOTIVE.streak(state);
    const nDays = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const todayK = MOTIVE.dayKey(Date.now());
    let cells = '';
    for (let i = 0; i < first.getDay(); i++) cells += '<span></span>';
    let monthCount = 0;
    for (let dd = 1; dd <= nDays; dd++) {
      const k = MOTIVE.dayKey(new Date(first.getFullYear(), first.getMonth(), dd, 12).getTime()), a = days[k];
      if (a) monthCount++;
      cells += `<button class="cd ${a && a.lift ? 'lift' : ''} ${a && a.cardio ? 'cardio' : ''} ${k === todayK ? 'today' : ''} ${ui.histDay === k ? 'sel' : ''}" data-act="cal-day" data-k="${k}" ${a ? '' : 'tabindex="-1"'} aria-label="${k}${a ? ' — trained' : ''}">${dd}</button>`;
    }
    return `<section class="card cal">
      <div class="row between"><button class="link" data-act="cal-nav" data-v="-1" aria-label="Previous month">‹</button>
        <b>${first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</b>
        <button class="link" data-act="cal-nav" data-v="1" ${off >= 0 ? 'disabled' : ''} aria-label="Next month">›</button></div>
      <div class="calgrid">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((x) => `<small>${x}</small>`).join('')}${cells}</div>
      <div class="calfoot"><span><i class="lg lift"></i>Strength</span><span><i class="lg cardio"></i>Cardio</span><span>${monthCount} active day${monthCount === 1 ? '' : 's'}</span></div>
      <p class="streakline">🔥 <b>${st.weeks}-week streak</b>${st.thisWeek || !st.weeks ? '' : ' — train this week to keep it'}${st.best > st.weeks ? ` · best ${st.best}` : ''}</p>
    </section>`;
  }
  function badgeStrip() {
    const bs = MOTIVE.badges(state), got = bs.filter((b) => b.earned);
    return `<button class="card badgestrip" data-act="badges-open"><span>${got.slice(-6).map((b) => b.icon).join(' ') || '🏅'}</span><b>${got.length} of ${bs.length} badges</b><small>See all ›</small></button>`;
  }
  function sheetBadges() {
    MOTIVE.newBadges(state); save();
    openSheet('Badges', `<div class="badges">${MOTIVE.badges(state).map((b) => `<div class="bdg ${b.earned ? 'got' : ''}"><span class="bi">${b.icon}</span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small>${b.earned ? (state.badges && state.badges[b.id] ? `<small class="when">${fmtDate(state.badges[b.id])}</small>` : '') : `<div class="bar"><i style="width:${b.pct}%"></i></div>`}</div>`).join('')}</div>`);
  }
  /* shareable image of a finished workout */
  async function shareWorkout(rec) {
    const u = state.settings.units, st = MOTIVE.streak(state);
    const lines = rec.exercises.map((e) => {
      const ws = e.sets.filter((s) => !s.warm); if (!ws.length) return null;
      const top = ws.reduce((b, s) => (num(s.w) * (1 + num(s.r) / 30) > num(b.w) * (1 + num(b.r) / 30) ? s : b), ws[0]);
      return [e.name, e.timed ? `${ws.length} × ${top.r}s` : num(top.w) ? `${ws.length} × ${top.r} @ ${top.w} ${u}` : `${ws.length} × ${top.r}`];
    }).filter(Boolean);
    const cv = MOTIVE.drawShare(rec, {
      title: rec.routineName || titleOf(rec.muscles, rec.regions), date: new Date(rec.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
      tiles: [[fmtClock(((rec.endedAt || rec.date) - rec.date) / 1000), 'time'], [String(setsOf(rec)), 'sets'], [fmtNum(volumeOf(rec)), `${u} lifted`]],
      lines, prs: rec.prs && rec.prs.length ? `${rec.prs.length} new personal record${rec.prs.length > 1 ? 's' : ''}` : '', streak: st.weeks ? `🔥 ${st.weeks}-week streak` : '',
    });
    const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
    const file = new File([blob], 'will-power-workout.png', { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'My workout' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const url = URL.createObjectURL(blob), aEl = document.createElement('a'); aEl.href = url; aEl.download = 'will-power-workout.png'; document.body.appendChild(aEl); aEl.click(); aEl.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000); toast('Image saved');
  }
  function viewWorkoutHistory() {
    const h = state.history;
    const weekAgo = Date.now() - 7 * 86400000;
    const wk = h.filter((w) => (w.endedAt || w.date) >= weekAgo);
    const stats = `
      <section class="card stats">
        <div><b>${wk.length}</b><small>workouts<br>this week</small></div>
        <div><b>${wk.reduce((t, w) => t + setsOf(w), 0)}</b><small>sets<br>this week</small></div>
        <div><b>${fmtNum(wk.reduce((t, w) => t + volumeOf(w), 0))}</b><small>${state.settings.units}<br>lifted</small></div>
        <div><b>${h.length}</b><small>all-time<br>workouts</small></div>
      </section>`;
    const prog = PROG.summaries(h, EX_BY_ID, 6);
    const progCard = prog.length ? `
      <section class="card"><h2>Strength progress</h2>
        ${prog.map((p) => `<div class="prog"><div><b>${esc(p.name)}</b><small>${p.latest.w} ${state.settings.units} × ${p.latest.r} lately · best ${p.best.w} × ${p.best.r} · ${p.sessions} session${p.sessions === 1 ? '' : 's'}</small></div>
          <span class="chg ${p.change === null ? '' : p.change >= 0 ? 'up' : 'down'}">${p.change === null ? 'new' : (p.change >= 0 ? '▲ ' : '▼ ') + Math.abs(p.change).toFixed(0) + '%'}</span></div>`).join('')}
        <p class="muted small">Change is your estimated one-rep max now versus your first logged session.</p></section>` : '';
    const cardio = state.cardio || [];
    if (!h.length && !cardio.length) return stats + '<p class="empty">No workouts yet. Build one on the Train tab, or start a walk on the Cardio tab, and it will show up here.</p>';
    const items = h.map((w) => ({ t: w.date, html: () => {
      const dur = w.endedAt && w.date ? fmtClock((w.endedAt - w.date) / 1000) : '';
      return `
      <details class="hist">
        <summary><span><b>${esc(w.routineName || titleOf(w.muscles, w.regions))}</b>
          <small>${fmtDate(w.date)} · ${esc(w.profileName || '')}${dur ? ' · ' + dur : ''}${w.kcal ? ' · ~' + fmtNum(w.kcal) + ' kcal' : ''}</small></span>
          <span class="vol">${setsOf(w)} sets<small>${fmtNum(volumeOf(w))} ${state.settings.units}</small></span></summary>
        ${w.exercises.map((e) => { const ws = e.sets.filter((s) => !s.warm), fx = (ws.find((s) => s.fx) || {}).fx;
          return `<div class="hx"><b>${esc(e.name)}${fx ? ` <span class="fxtag fx-${fx}">${FX[fx][0]}</span>` : ''}</b><span>${ws.map((s) => `${s.max ? '★' : ''}${e.timed ? `${s.r}s` : `${s.w ? s.w + '×' : ''}${s.r}`}`).join(' · ')}</span></div>`; }).join('')}
        <button class="link" data-act="hist-share" data-id="${w.id}">Share</button>
        ${w.sent ? '<span class="badge">In Health</span>' : `<button class="link" data-act="hist-send" data-id="${w.id}">Send to Apple Health</button>`}
        <button class="link danger" data-act="hist-del" data-id="${w.id}">Delete workout</button>
      </details>`; } }))
      .concat(cardio.map((c) => ({ t: c.date, html: () => `
      <div class="hist cardio-row">
        <span><b>${esc(c.label || CARDIO.TYPE_NAME[c.type] || 'Cardio')}</b>${c.source === 'health' ? ' <span class="badge">Apple Health</span>' : ''}
          <small>${fmtDate(c.date)} · ${fmtClock(c.dur)}${c.dist ? ` · ${c.dist} ${CARDIO.distUnit(state.settings.units)}` : ''}</small></span>
        <span class="vol">${fmtNum(c.kcal || 0)}<small>kcal</small></span>
        <button class="link danger" data-act="cd-del" data-id="${c.id}">Delete</button>
      </div>` })))
      .sort((a, b) => b.t - a.t);
    const shown = ui.histDay ? items.filter((x) => MOTIVE.dayKey(x.t) === ui.histDay) : items;
    const dayHead = ui.histDay ? `<div class="row between dayhead"><b>${new Date(ui.histDay + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</b><button class="link" data-act="cal-all">Show all</button></div>` : '';
    return calendarCard() + badgeStrip() + stats + progCard + dayHead + (shown.length ? shown.map((x) => x.html()).join('') : '<p class="empty">Nothing logged that day.</p>');
  }

  function viewGear() {
    const s = state.settings;
    const cards = state.profiles.map((p) => {
      const active = p.id === state.activeProfile;
      const unlocked = EXERCISES.filter((e) => isAvailable(e, p.equipment)).length;
      return `
      <article class="card profile ${active ? 'active' : ''}">
        <div class="row between">
          <div><h3>${esc(p.name)} ${active ? '<span class="badge">Active</span>' : ''}</h3>
          <p class="muted">${p.equipment.length} items · ${unlocked} exercises unlocked</p></div>
        </div>
        <p class="tags">${p.equipment.length ? p.equipment.slice(0, 8).map((x) => `<span>${esc(EQUIP_NAME[x] || x)}</span>`).join('') + (p.equipment.length > 8 ? `<span>+${p.equipment.length - 8} more</span>` : '') : '<span>Bodyweight only</span>'}</p>
        <div class="row gap">
          ${active ? '' : `<button class="pill on" data-act="use-profile" data-id="${p.id}">Use this</button>`}
          <button class="pill" data-act="edit-profile" data-id="${p.id}">Edit gear</button>
          <button class="pill" data-act="dup-profile" data-id="${p.id}">Duplicate</button>
          ${state.profiles.length > 1 ? `<button class="pill ghost danger" data-act="del-profile" data-id="${p.id}">Delete</button>` : ''}
        </div>
      </article>`;
    }).join('');
    return `
      ${B.profileCard()}
      <div class="row between head"><h2>Equipment profiles</h2><button class="pill on" data-act="new-profile">＋ New profile</button></div>
      <p class="muted pad">A profile is a set of equipment — for example your gym, or the room upstairs. Workouts only use exercises you can actually do with the active profile.</p>
      ${cards}
      <section class="card">
        <h2>Settings</h2>
        <div class="field"><label>Appearance</label>
          <div class="seg">${[['auto', 'Match phone'], ['dark', 'Dark'], ['light', 'Light']].map(([v, l]) => `<button data-act="set-theme" data-v="${v}" class="${(s.theme || 'auto') === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
        <div class="field"><label>Weight units</label>
          <div class="seg"><button data-act="set-units" data-v="lb" class="${s.units === 'lb' ? 'on' : ''}">lb</button><button data-act="set-units" data-v="kg" class="${s.units === 'kg' ? 'on' : ''}">kg</button></div></div>
        <label class="toggle"><input type="checkbox" id="restToggle" ${s.restTimer ? 'checked' : ''}> <span>Auto-start rest timer after each set</span></label>
        <label class="toggle"><input type="checkbox" id="alertToggle" ${s.restAlert !== false ? 'checked' : ''}> <span>Beep (3-2-1) and vibrate when rest ends</span></label>
        <label class="toggle"><input type="checkbox" id="wakeToggle" ${s.wakeLock !== false ? 'checked' : ''}> <span>Keep the screen on during a workout</span></label>
        <div class="row gap wrap">
          <button class="pill" data-act="export">Export backup</button>
          <button class="pill" data-act="import">Import backup</button>
          <button class="pill ghost danger" data-act="reset">Erase all data</button>
        </div>
        <input type="file" id="importFile" accept="application/json" hidden>
        <p class="muted small">Everything is stored on this device only. Export a backup now and then.</p>
      </section>`;
  }

  function applyTheme() {
    const th = state.settings.theme;
    if (th === 'light' || th === 'dark') document.documentElement.dataset.theme = th; else delete document.documentElement.dataset.theme;
  }
  applyTheme();
  function render() {
    const y = window.scrollY;
    $('#profileChip').textContent = profile().name;
    $$('nav button').forEach((b) => b.classList.toggle('on', b.dataset.tab === ui.tab));
    $('#main').innerHTML = { train: viewTrain, cardio: C.view, library: viewLibrary, history: viewHistory, gear: viewGear }[ui.tab]();
    window.scrollTo(0, y);
    if (ui.tab === 'train') { WPA.hydrate($('#main')); markNext(); }
    tick(); keepAwake();
  }

  /* ───────────── sheets (modals) ───────────── */
  function openSheet(title, html) {
    $('#sheetTitle').textContent = title;
    $('#sheetBody').innerHTML = html;
    $('#sheet').hidden = false;
    document.body.classList.add('lock');
    $('#sheetBody').scrollTop = 0;
  }
  function closeSheet() {
    $('#sheet').hidden = true;
    document.body.classList.remove('lock');
    ui.draft = null; ui.cdraft = null;
  }

  function sheetProfiles() {
    openSheet('Choose equipment profile', state.profiles.map((p) => `
      <button class="pick ${p.id === state.activeProfile ? 'on' : ''}" data-act="use-profile" data-id="${p.id}">
        <b>${esc(p.name)}</b><small>${p.equipment.length} items · ${EXERCISES.filter((e) => isAvailable(e, p.equipment)).length} exercises</small>
      </button>`).join('') + '<button class="pill wide" data-act="new-profile">＋ New profile</button>');
  }

  function sheetEditor() {
    const d = ui.draft;
    const groups = EQUIPMENT_GROUPS.map((g) => `
      <fieldset><legend>${g.name}</legend>
        ${g.items.map((i) => `<label class="check-row"><input type="checkbox" data-equip="${i.id}" ${d.equipment.includes(i.id) ? 'checked' : ''}><span>${i.name}</span></label>`).join('')}
      </fieldset>`).join('');
    openSheet(d.id ? 'Edit profile' : 'New profile', `
      <div class="field"><label for="pname">Profile name</label><input id="pname" class="search" maxlength="40" value="${esc(d.name)}" placeholder="e.g. Home – Upstairs"></div>
      <div class="pills scroll">${EQUIP_PRESETS.map(([id, l]) => `<button class="pill" data-act="equip-preset" data-p="${id}">${l}</button>`).join('')}</div>
      <p class="muted" id="unlockInfo"></p>
      <fieldset class="stackbox"><legend>Machine weight stack (optional)</legend>
        <p class="muted small">Selectorized machines and cables only offer the weights on their stack. Enter the lightest plate, the jump between plates and the heaviest, and suggestions will land on real pins. Leave blank for no limit.</p>
        <div class="grid3">
          <div class="field"><label for="stStart">Lightest</label><input id="stStart" type="number" inputmode="decimal" step="any" value="${d.stack ? d.stack.start : ''}" placeholder="2.5"></div>
          <div class="field"><label for="stStep">Step</label><input id="stStep" type="number" inputmode="decimal" step="any" value="${d.stack ? d.stack.step : ''}" placeholder="5"></div>
          <div class="field"><label for="stMax">Heaviest</label><input id="stMax" type="number" inputmode="decimal" step="any" value="${d.stack ? d.stack.max : ''}" placeholder="97.5"></div>
        </div>
      </fieldset>
      ${groups}
      <button class="primary big" data-act="save-profile">Save profile</button>`);
    updateUnlockInfo();
  }
  function updateUnlockInfo() {
    const el = $('#unlockInfo');
    if (!el || !ui.draft) return;
    const n = EXERCISES.filter((e) => isAvailable(e, ui.draft.equipment)).length;
    el.textContent = `${ui.draft.equipment.length} items selected · ${n} of ${EXERCISES.length} exercises unlocked`;
  }

  function entryPickerList(exercises, act, extra = '') {
    if (!exercises.length) return '<p class="empty">Nothing available with this profile’s equipment.</p>';
    return exercises.map((e) => `
      <button class="pick" data-act="${act}" data-id="${e.id}" ${extra}>
        <b>${isFav(e.id) ? '★ ' : ''}${esc(e.name)}</b><small>${MUSCLE_NAME[e.muscle]} · ${esc(equipLabel(e))} · ${LEVELS[e.level]}</small>
      </button>`).join('');
  }

  function sheetGuide(exId) {
    const ex = EX_BY_ID[exId]; if (!ex) return;
    const spec = WPA.forExercise(ex), tpl = WPA.T[spec.tpl];
    const gear = ex.equip.length ? equipLabel(ex) : '';
    const sec = (ex.secondary || []).map((m) => MUSCLE_NAME[m]);
    openSheet(ex.name, `
      <div class="anim big" id="guideAnim" data-ex="${ex.id}"></div>
      <div class="phase" id="guidePhase" aria-live="off"></div>
      <div class="gctrl">
        <button class="pill" data-act="g-play" id="gPlay">⏸ Pause</button>
        <div class="seg" role="group" aria-label="Speed"><button data-act="g-speed" data-v="0.5" id="gs-0.5">Slow</button><button data-act="g-speed" data-v="1" id="gs-1" class="on">Normal</button></div>
      </div>
      ${tpl && tpl.front ? '<div class="gctrl"><div class="seg" role="group" aria-label="View"><button data-act="g-view" data-v="side" class="on">Side view</button><button data-act="g-view" data-v="front">Front view</button></div></div>' : ''}
      ${tpl && !tpl.loop ? '<div class="gctrl two"><button class="pill" data-act="g-seek" data-v="0">① Show start</button><button class="pill" data-act="g-seek" data-v="1">② Show finish</button></div>' : ''}
      <div class="tags"><span>${MUSCLE_NAME[ex.muscle]}${sec.length ? ' + ' + sec.join(', ') : ''}</span><span>${esc(equipLabel(ex))}</span><span>${GUIDE.LEVEL[ex.level]}</span></div>
      <h3>How to do it</h3>
      <ol class="guide">${GUIDE.steps(ex, tpl, gear).map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      <h3>Watch for</h3>
      <ul class="guide">${GUIDE.tips(ex).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <p class="muted small">The glowing area is the muscle this works. The faint figures show the start (1) and finish (2) positions.</p>
      <button class="primary big" data-act="close-sheet">Got it</button>`);
    WPA.hydrate($('#sheetBody'));
  }
  const guideM = () => { const h = $('#guideAnim'); return h && h.__wpa; };

  function sheetSwap(i) {
    const w = state.current;
    const cur = EX_BY_ID[w.exercises[i].exId];
    const owned = workoutProfile().equipment;
    const inUse = new Set(w.exercises.map((e) => e.exId));
    const alts = EXERCISES.filter((e) => e.muscle === cur.muscle && isAvailable(e, owned) && !inUse.has(e.id));
    ui.swapIndex = i;
    openSheet(`Swap ${cur.name}`, (alts.length ? '<button class="pill on wide" data-act="swap-random">🎲 Surprise me</button>' : '') + entryPickerList(alts, 'pick-swap'));
  }

  /* ── custom exercises ── */
  function cxOpen(d, edit) {
    ui.cdraft = Object.assign({ id: '', name: '', muscle: '', equip: [], level: 2, cue: '', secondary: [], timed: false, loaded: null, regions: [], like: 'auto', add: false }, d);
    ui.cdraft.edit = !!edit;
    sheetCustom();
  }
  function sheetCustom() {
    const d = ui.cdraft, regs = REGIONS[d.muscle] || [];
    const likeOpts = EXERCISES.filter((e) => !e.custom && e.muscle === d.muscle).map((e) => `<option value="${esc(e.name)}" ${d.like === e.name ? 'selected' : ''}>${esc(e.name)}</option>`).join('');
    const eq = EQUIPMENT_GROUPS.map((g) => `<p class="muted small">${esc(g.name)}</p><div class="pills">${g.items.map((i) => `<button class="pill ${d.equip.includes(i.id) ? 'on' : ''}" data-act="cx-equip" data-v="${i.id}" aria-pressed="${d.equip.includes(i.id)}">${esc(i.name)}</button>`).join('')}</div>`).join('');
    openSheet(d.edit ? 'Edit exercise' : 'Create exercise', `
      <div class="field"><label for="cxName">Name</label><input id="cxName" type="text" maxlength="40" placeholder="e.g. Hanging Knee Ups" value="${esc(d.name)}" autocomplete="off"></div>
      <div id="cxSimilar" class="muted small"></div>
      <div class="field"><label for="cxMuscle">Main muscle</label><select id="cxMuscle"><option value="">Choose…</option>${MUSCLES.map((m) => `<option value="${m.id}" ${d.muscle === m.id ? 'selected' : ''}>${m.name}</option>`).join('')}</select></div>
      ${regs.length ? `<p class="muted small">Which part? (optional)</p><div class="pills">${regs.map(([id, l]) => `<button class="pill ${d.regions.includes(id) ? 'on' : ''}" data-act="cx-reg" data-v="${id}" aria-pressed="${d.regions.includes(id)}">${l}</button>`).join('')}</div>` : ''}
      <p class="muted small">Also works (optional)</p><div class="pills">${MUSCLES.filter((m) => m.id !== d.muscle).map((m) => `<button class="pill ${d.secondary.includes(m.id) ? 'on' : ''}" data-act="cx-sec" data-v="${m.id}" aria-pressed="${d.secondary.includes(m.id)}">${m.name}</button>`).join('')}</div>
      <h3>Equipment needed</h3><p class="muted small">Leave empty for bodyweight.</p>${eq}
      <div class="field"><label for="cxLevel">Difficulty</label><select id="cxLevel">${[1, 2, 3].map((l) => `<option value="${l}" ${+d.level === l ? 'selected' : ''}>${LEVELS[l]}</option>`).join('')}</select></div>
      <label class="toggle"><input type="checkbox" id="cxTimed" ${d.timed ? 'checked' : ''}> <span>It’s a timed hold (log seconds, not reps)</span></label>
      <label class="toggle"><input type="checkbox" id="cxLoaded" ${(d.loaded === null ? CUSTOM.loadedFor(d.equip) : d.loaded) ? 'checked' : ''}> <span>I add weight to it (track and suggest weights)</span></label>
      <div class="field"><label for="cxCue">Form tip (optional)</label><input id="cxCue" type="text" maxlength="120" placeholder="One line to remember" value="${esc(d.cue)}"></div>
      ${d.muscle ? `<div class="field"><label for="cxLike">Animation looks like</label><select id="cxLike"><option value="auto" ${d.like === 'auto' ? 'selected' : ''}>Closest match (automatic)</option>${likeOpts}</select></div>` : ''}
      <div class="row gap wrap"><button class="pill on" data-act="cx-save">${d.edit ? 'Save changes' : d.add && state.current ? 'Create & add to workout' : 'Create exercise'}</button><button class="pill" data-act="close-sheet">Cancel</button></div>`);
    cxHint();
  }
  function cxHint() {
    const d = ui.cdraft, n = $('#cxSimilar'); if (!d || !n) return;
    const sim = d.edit ? [] : CUSTOM.similar(d.name, EXERCISES);
    n.innerHTML = sim.length ? `Already in the app: ${sim.map((e) => `<b>${esc(e.name)}</b>`).join(', ')} — search the Library before creating a duplicate.` : '';
  }
  function cxSave() {
    const d = ui.cdraft; if (!d) return;
    d.loaded = $('#cxLoaded').checked; d.timed = $('#cxTimed').checked;
    const r = CUSTOM.make(d, EXERCISES, d.edit ? d.id : '');
    if (r.error) { toast(r.error); return; }
    const i = state.custom.findIndex((c) => c.id === r.ex.id);
    if (i >= 0) state.custom[i] = r.ex; else state.custom.push(r.ex);
    CUSTOM.sync(state.custom, EXERCISES, EX_BY_ID);
    const addNow = d.add && state.current && !d.edit;
    if (addNow) {
      const w = state.current;
      w.exercises.push(makeEntry(EX_BY_ID[r.ex.id], w.goal));
      if (!w.muscles.includes(r.ex.muscle)) w.muscles.push(r.ex.muscle);
    }
    save(); closeSheet(); render(); toast(addNow ? `Created and added ${r.ex.name}` : d.edit ? 'Exercise updated' : `Created ${r.ex.name}`);
  }

  function sheetSuperset(i) {
    const w = state.current, me = w.exercises[i];
    ui.ssIndex = i;
    const others = w.exercises.map((e, k) => [e, k]).filter(([e, k]) => k !== i && !e.ss);
    openSheet('Superset with…', `<p class="muted">Pick the exercise to pair with <b>${esc(EX_BY_ID[me.exId].name)}</b>. You’ll alternate a set of each, resting only after both.</p>
      ${others.length ? others.map(([e, k]) => `<button class="pill wide" data-act="pick-ss" data-k="${k}">${esc(EX_BY_ID[e.exId].name)} <small class="muted">${MUSCLE_NAME[EX_BY_ID[e.exId].muscle]}</small></button>`).join('') : '<p class="empty">No other exercise to pair with. Add one first.</p>'}`);
  }

  function sheetAdd() {
    const w = state.current;
    const owned = workoutProfile().equipment;
    const inUse = new Set(w.exercises.map((e) => e.exId));
    const q = ui.addSearch.trim().toLowerCase();
    const list = EXERCISES.filter((e) => isAvailable(e, owned) && !inUse.has(e.id)
      && (ui.addMuscle === 'all' || (ui.addMuscle === 'workout' ? w.muscles.includes(e.muscle) : ui.addMuscle === 'fav' ? isFav(e.id) : e.muscle === ui.addMuscle))
      && (!q || CUSTOM.matches(`${e.name} ${MUSCLE_NAME[e.muscle]}`, q)))
      .sort((x, y) => isFav(y.id) - isFav(x.id));
    const chips = [['workout', 'This workout'], ['all', 'All'], ['fav', '★ Favorites'], ...MUSCLES.map((m) => [m.id, m.name])]
      .map(([id, l]) => `<button class="pill ${ui.addMuscle === id ? 'on' : ''}" data-act="add-filter" data-m="${id}">${l}</button>`).join('');
    openSheet('Add exercise', `<input type="search" id="addSearch" class="search" placeholder="Search" value="${esc(ui.addSearch)}"><div class="pills scroll">${chips}</div><div id="addList">${entryPickerList(list, 'pick-add')}</div><button class="pill wide" data-act="cx-new" data-add="1" data-name="${esc(ui.addSearch.trim())}">＋ Can’t find it? Create your own${ui.addSearch.trim() ? ': “' + esc(ui.addSearch.trim()) + '”' : ''}</button>`);
  }

  /* ───────────── log a workout done earlier ───────────── */
  const dayVal = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  function sheetLogChoose() {
    openSheet('Log a workout', `
      <p class="muted">Add something you did that never made it into the app — today or any earlier day.</p>
      <button class="pick" data-act="cd-manual"><b>Run, walk, bike or other cardio</b><small>Pick the activity, minutes, distance and the day</small></button>
      <button class="pick" data-act="cd-manual-sport"><b>Sport or activity</b><small>Golf, basketball, tennis, pickleball, soccer, climbing, yoga and more</small></button>
      <button class="pick" data-act="log-strength"><b>Strength workout</b><small>Pick exercises and enter sets, reps and weight for any day</small></button>`);
  }

  function sheetPast() {
    const md = ui.mdraft; if (!md) return;
    const today = dayVal(Date.now()), u = state.settings.units;
    const rows = md.exercises.map((en, mi) => {
      const ex = EX_BY_ID[en.exId];
      return `<div class="card mp">
        <div class="row between"><b>${esc(ex.name)}</b><button class="link danger" data-act="mp-rm" data-mi="${mi}">Remove</button></div>
        ${en.sets.map((s, mj) => `<div class="mprow"><span class="muted">Set ${mj + 1}</span>
          ${ex.timed ? '' : `<input type="number" inputmode="decimal" placeholder="${u}" value="${esc(s.w)}" data-mi="${mi}" data-mj="${mj}" data-mf="w" aria-label="Weight">`}
          <input type="number" inputmode="numeric" placeholder="${ex.timed ? 'seconds' : 'reps'}" value="${esc(s.r)}" data-mi="${mi}" data-mj="${mj}" data-mf="r" aria-label="${ex.timed ? 'Seconds' : 'Reps'}"></div>`).join('')}
        <div class="row gap"><button class="pill" data-act="mp-set+" data-mi="${mi}">＋ Set</button>${en.sets.length > 1 ? `<button class="pill ghost" data-act="mp-set-" data-mi="${mi}">− Set</button>` : ''}</div>
      </div>`;
    }).join('');
    openSheet('Log strength workout', `
      <div class="grid2">
        <div class="field"><label for="mpDate">Day</label><input id="mpDate" type="date" value="${md.date}" max="${today}"></div>
        <div class="field"><label for="mpMin">Minutes</label><input id="mpMin" type="number" inputmode="numeric" min="5" value="${md.min}"></div>
      </div>
      ${rows || '<p class="empty">No exercises yet.</p>'}
      <button class="pill wide" data-act="mp-pick-open">＋ Add exercise</button>
      <div class="row gap wrap"><button class="pill on" data-act="mp-save">Save workout</button><button class="pill" data-act="close-sheet">Cancel</button></div>`);
  }

  function mpList() {
    const q = (ui.mpSearch || '').trim().toLowerCase();
    const list = EXERCISES.filter((e) => (ui.mpMuscle === 'all' || (ui.mpMuscle === 'fav' ? isFav(e.id) : e.muscle === ui.mpMuscle))
      && (!q || CUSTOM.matches(`${e.name} ${MUSCLE_NAME[e.muscle]}`, q))).sort((x, y) => isFav(y.id) - isFav(x.id));
    return list.length ? list.map((e) => `<button class="pick" data-act="mp-add" data-id="${e.id}"><b>${isFav(e.id) ? '★ ' : ''}${esc(e.name)}</b><small>${MUSCLE_NAME[e.muscle]} · ${esc(equipLabel(e))}</small></button>`).join('') : '<p class="empty">No matches.</p>';
  }
  function sheetMPick() {
    const chips = [['all', 'All'], ['fav', '★ Favorites'], ...MUSCLES.map((m) => [m.id, m.name])]
      .map(([id, l]) => `<button class="pill ${ui.mpMuscle === id ? 'on' : ''}" data-act="mp-filter" data-m="${id}">${l}</button>`).join('');
    openSheet('Add exercise', `<input type="search" id="mpSearch" class="search" placeholder="Search" value="${esc(ui.mpSearch || '')}"><div class="pills scroll">${chips}</div><div id="mpList">${mpList()}</div><button class="pill wide" data-act="log-back">Back</button>`);
  }

  function savePast() {
    const md = ui.mdraft; if (!md) return;
    const exercises = md.exercises.map((en) => {
      const ex = EX_BY_ID[en.exId];
      return { exId: ex.id, name: ex.name, muscle: ex.muscle, timed: ex.timed,
        sets: en.sets.filter((s) => num(s.r) > 0).map((s) => ({ w: ex.timed ? 0 : num(s.w), r: num(s.r) })) };
    }).filter((e) => e.sets.length);
    if (!exercises.length) { toast('Add at least one set with reps'); return; }
    const mins = Math.max(5, md.min || 45), now = Date.now();
    let date = new Date(`${md.date}T12:00:00`).getTime();
    if (md.date === dayVal(now)) date = now - mins * 60000;
    const endedAt = date + mins * 60000;
    const kcal = CARDIO.kcalFor(CARDIO.metFor('strength'), CARDIO.toKg(state.settings.weight || (state.settings.units === 'kg' ? 75 : 165), state.settings.units), mins * 60);
    const muscles = [...new Set(exercises.map((e) => e.muscle))];
    const rec = { id: uid(), date, endedAt, kcal, profileId: profile().id, profileName: profile().name, muscles, regions: {}, goal: state.settings.goal, exercises, manual: true };
    const older = state.history.filter((h) => h.date < date).sort((x, y) => y.date - x.date);   // PRs are judged against what came before that day
    rec.prs = PROG.newPRs(older, rec, EX_BY_ID);
    state.history.push(rec); state.history.sort((x, y) => y.date - x.date);
    ui.mdraft = null; save(); closeSheet(); render(); toast('Workout logged');
  }

  function sheetSummary(rec) {
    const dur = fmtClock((rec.endedAt - rec.date) / 1000);
    const fresh = MOTIVE.newBadges(state); if (fresh.length) save();
    openSheet('Workout complete 💪', `
      <div class="stats big">
        <div><b>${dur}</b><small>time</small></div>
        <div><b>${setsOf(rec)}</b><small>sets</small></div>
        <div><b>${fmtNum(volumeOf(rec))}</b><small>${state.settings.units} lifted</small></div>
      </div>
      ${rec.prs && rec.prs.length ? `<div class="card prs"><h3>🏆 New personal ${rec.prs.length > 1 ? 'records' : 'record'}</h3>${rec.prs.map((p) => `<p><b>${esc(p.name)}</b> — ${p.w} ${state.settings.units} × ${p.r}</p>`).join('')}</div>` : ''}
      ${fresh.length ? `<div class="card newbadge">${fresh.map((b) => `<p><span class="bi">${b.icon}</span> <b>New badge: ${esc(b.name)}</b> <small>${esc(b.desc)}</small></p>`).join('')}</div>` : ''}
      <button class="pill wide" data-act="hist-share" data-id="${rec.id}">📤 Share this workout</button>
      <p class="muted">Saved to your history. Next time, the app will suggest what to lift based on this.</p>
      ${ui.lastPlan && ui.lastPlan.routineId && state.routines.some((r) => r.id === ui.lastPlan.routineId)
        ? `<button class="pill wide" data-act="rt-update">Update “${esc(ui.lastPlan.routineName)}” with today’s exercises</button>`
        : ui.lastPlan ? '<button class="pill wide" data-act="rt-save-last">☆ Save as a routine to repeat</button>' : ''}
      <button class="primary big" data-act="close-sheet">Done</button>`);
  }

  /* ───────────── timers & sound ───────────── */
  let audioCtx = null;
  function unlockAudio() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      if (navigator.audioSession && navigator.audioSession.type !== 'transient') navigator.audioSession.type = 'transient';   // Safari: short alert sound
    } catch (e) { /* no audio */ }
  }
  /** A light tap: vibration where supported, and the iOS 18+ switch-control haptic in Safari. */
  let hapt = null;
  function haptic() {
    try {
      if (navigator.vibrate) { navigator.vibrate(12); return; }
      if (!hapt) { hapt = document.createElement('label'); hapt.setAttribute('aria-hidden', 'true'); hapt.style.cssText = 'position:fixed;left:-99px;top:0;opacity:0;pointer-events:none';
        hapt.innerHTML = '<input type="checkbox" switch tabindex="-1">'; document.body.appendChild(hapt); }
      hapt.click();
    } catch (e) { /* no haptics */ }
  }
  /** Short blip for the 3-2-1 countdown. */
  function blip() {
    if (!audioCtx || state.settings.restAlert === false) return;
    try {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination); o.frequency.value = 660;
      g.gain.setValueAtTime(0.18, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      o.start(); o.stop(audioCtx.currentTime + 0.12);
    } catch (e) { /* ignore */ }
  }
  /* Keep the screen awake during a workout so the rest timer keeps running and can sound. */
  let wakeLock = null, wakeBusy = false;
  async function keepAwake() {
    const want = !!(state.current && state.current.startedAt) && state.settings.wakeLock !== false && document.visibilityState === 'visible';
    try {
      if (want && !wakeLock && !wakeBusy && 'wakeLock' in navigator) {
        wakeBusy = true; wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } else if (!want && wakeLock) { const l = wakeLock; wakeLock = null; await l.release(); }
    } catch (e) { wakeLock = null; } finally { wakeBusy = false; }
  }
  document.addEventListener('visibilitychange', () => { keepAwake(); if (!document.hidden) tick(); });
  /* Inside the iPhone app: a lock-screen notification when rest ends. */
  const capN = () => (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() ? window.Capacitor : null);
  let LN = null;
  async function restNotify(at) {
    const cap = capN(); if (!cap) return;
    try {
      LN = LN || cap.registerPlugin('LocalNotifications');
      await LN.cancel({ notifications: [{ id: 4242 }] });
      if (!at || state.settings.restAlert === false) return;
      if (!state.settings.lnAsked) { await LN.requestPermissions(); state.settings.lnAsked = true; save(); }
      await LN.schedule({ notifications: [{ id: 4242, title: 'Rest over', body: 'Time for your next set 💪', schedule: { at: new Date(at) }, sound: 'default' }] });
    } catch (e) { /* plugin not installed */ }
  }
  function beep() {
    if (state.settings.restAlert === false) return;
    try {
      if (audioCtx) {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.frequency.value = 880; g.gain.setValueAtTime(0.25, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        o.start(); o.stop(audioCtx.currentTime + 0.5);
      }
    } catch (e) { /* ignore */ }
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }
  /* Typing a weight fills the same weight into this exercise's remaining sets (unless you edited them yourself). */
  /** Carry a weight ('w') or reps ('r') change down to the remaining, not-yet-done working sets of that exercise. */
  function propagate(i, j, field) {
    const sets = state.current.exercises[i].sets, src = sets[j];
    if (src.warm || !String(src[field]).trim()) return;
    sets.forEach((s, k) => {
      if (k <= j || s.warm || s.done || (s.max && field === 'r')) return;
      s[field] = src[field];
      const el = document.querySelector(`.set[data-i="${i}"][data-j="${k}"] input.${field}`);
      if (el) el.value = src[field];
    });
  }
  /* ── supersets: linked pairs share a letter; they render as one card and alternate set by set ── */
  const workIdx = (en) => en.sets.map((x, j) => (x.warm ? -1 : j)).filter((j) => j >= 0);
  const partnerOf = (w, en) => (en.ss ? w.exercises.find((x) => x !== en && x.ss === en.ss) : null);
  /** A superset has the same number of working sets on both lifts. */
  function evenSets(a, b) {
    const work = (x) => x.sets.filter((s) => !s.warm).length;
    const n = Math.max(work(a), work(b));
    [a, b].forEach((x) => {
      while (work(x) < n) { const p = x.sets[x.sets.length - 1] || { w: '', r: '10' }; x.sets.push({ w: p.w, r: p.r, done: false }); }
      x.target.sets = n;
    });
  }
  function ssLink(i, k) {
    const arr = state.current.exercises, a = arr[i], b = arr[k];
    if (!a || !b || a === b || a.ss || b.ss) return;
    const used = new Set(arr.map((x) => x.ss).filter(Boolean));
    let L = 'A'; while (used.has(L)) L = String.fromCharCode(L.charCodeAt(0) + 1);
    arr.splice(k, 1); arr.splice(arr.indexOf(a) + 1, 0, b);
    a.ss = b.ss = L; a.ssPos = 1; b.ssPos = 2;
    evenSets(a, b);
  }
  function ssUnlink(en) {
    const p = partnerOf(state.current, en);
    [en, p].forEach((x) => { if (x) { delete x.ss; delete x.ssPos; } });
  }
  /** Highlight the next set to do in every superset card (A then B, round by round). */
  function markNext() {
    $$('.set.next').forEach((n) => n.classList.remove('next'));
    $$('.ssgroup').forEach((card) => {
      const row = Array.from(card.querySelectorAll('.round .set')).find((r) => !r.classList.contains('done'));
      if (row) row.classList.add('next');
    });
  }

  function startRest(sec) {
    if (!state.settings.restTimer || !sec) return;
    ui.restTotal = sec;
    ui.restEnd = Date.now() + sec * 1000; ui.restBlip = 0;
    restNotify(ui.restEnd);
    tick();
  }
  function tick() {
    const w = state.current;
    const el = $('#elapsed');
    if (el && w && w.startedAt) el.textContent = fmtClock((Date.now() - w.startedAt) / 1000);
    const bar = $('#rest');
    if (ui.restEnd) {
      const left = Math.ceil((ui.restEnd - Date.now()) / 1000);
      if (left <= 0) {
        const late = Math.round((Date.now() - ui.restEnd) / 1000);
        ui.restEnd = 0; beep(); setTimeout(beep, 650); bar.hidden = true;
        toast(late > 5 ? `Rest over (${fmtClock(late)} ago) — next set` : 'Rest over — next set 💪');
        document.body.classList.add('restdone'); setTimeout(() => document.body.classList.remove('restdone'), 1600);
        return;
      }
      if (left <= 3 && ui.restBlip !== left) { ui.restBlip = left; blip(); }
      bar.hidden = false;
      $('#restTime').textContent = fmtClock(left);
      $('#restFill').style.width = `${(left / ui.restTotal) * 100}%`;
    } else {
      bar.hidden = true;
    }
  }
  setInterval(tick, 500);

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => { t.hidden = true; }, 2200);
  }

  /* ───────────── actions ───────────── */
  function updateProgressDom() {
    const w = state.current; if (!w) return;
    const { total, done } = progress(w);
    const f = $('#barFill'), t = $('#progressTxt');
    if (f) f.style.width = `${total ? (done / total) * 100 : 0}%`;
    if (t) t.textContent = `${done} of ${total} sets done`;
    const xp = exProgress(w), x = $('#exProg'); if (x) x.textContent = `${xp.done} of ${xp.total} exercises`;
    const ck = $('.wclock small'); if (ck && w.startedAt) ck.textContent = 'elapsed';
  }

  function finishWorkout() {
    const w = state.current;
    const exercises = w.exercises.map((en) => {
      const ex = EX_BY_ID[en.exId];
      return { exId: ex.id, name: ex.name, muscle: ex.muscle, timed: ex.timed,
        sets: en.sets.filter((s) => s.done).map((s, k, arr) => (s.warm ? { w: num(s.w), r: num(s.r), warm: true } : { w: num(s.w), r: num(s.r), ...(en.fx && k === arr.length - 1 ? { fx: en.fx } : {}), ...(s.max ? { max: true } : {}) })) };
    }).filter((e) => e.sets.length);
    if (!exercises.length) {
      if (confirm('No sets were logged. Discard this workout?')) { state.current = null; ui.restEnd = 0; save(); render(); }
      return;
    }
    const startedAt = w.startedAt || w.createdAt, endedAt = Date.now();
    const durSec = Math.min(Math.max((endedAt - startedAt) / 1000, 300), 3 * 3600);
    const kcal = CARDIO.kcalFor(CARDIO.metFor('strength'), CARDIO.toKg(state.settings.weight || (state.settings.units === 'kg' ? 75 : 165), state.settings.units), durSec);
    const rec = { id: w.id, date: startedAt, endedAt, kcal, profileId: w.profileId, profileName: w.profileName, muscles: w.muscles, regions: w.regions || {}, goal: w.goal, exercises };
    if (w.sport) rec.sport = w.sport;
    if (w.routineName) rec.routineName = w.routineName;
    rec.prs = PROG.newPRs(state.history, rec, EX_BY_ID);
    state.history.unshift(rec);
    if (w.routineId) { const r = state.routines.find((x) => x.id === w.routineId); if (r) r.lastUsed = endedAt; }
    ui.lastPlan = w;
    state.current = null;
    ui.restEnd = 0;
    save(); render(); sheetSummary(rec);
  }

  function saveProfile() {
    const d = ui.draft;
    const name = ($('#pname').value || '').trim() || 'My profile';
    const st = { start: num($('#stStart').value), step: num($('#stStep').value), max: num($('#stMax').value) };
    const stack = st.step > 0 && st.max >= st.start && st.start >= 0 && $('#stMax').value !== '' ? st : null;
    if (d.id) {
      const p = state.profiles.find((x) => x.id === d.id);
      p.name = name; p.equipment = d.equipment.slice();
      if (stack) p.stack = stack; else delete p.stack;
    } else {
      const p = { id: uid(), name, equipment: d.equipment.slice(), ...(stack ? { stack } : {}) };
      state.profiles.push(p);
      if (!state.profiles.some((x) => x.id === state.activeProfile)) state.activeProfile = p.id;
    }
    save(); closeSheet(); render(); toast('Profile saved');
  }

  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function handleAction(act, t) {
    const d = t.dataset;
    const w = state.current;
    const entryEl = t.closest('.ex');
    const rowEl = t.closest('.set');
    const i = d.xi !== undefined ? +d.xi : rowEl ? +rowEl.dataset.i : entryEl ? +entryEl.dataset.i : null;
    switch (act) {
      case 'nav': ui.tab = d.tab; closeSheet(); render(); window.scrollTo(0, 0); break;

      /* builder */
      case 'toggle-muscle': {
        const k = state.selected.indexOf(d.m);
        if (k >= 0) state.selected.splice(k, 1); else state.selected.push(d.m);
        save(); render(); break;
      }
      case 'set-region': if (d.r) state.regions[d.m] = d.r; else delete state.regions[d.m]; save(); render(); break;
      case 'preset': {
        if (d.p === 'clear') state.selected = [];
        else state.selected = MUSCLE_PRESETS.find((p) => p[0] === d.p)[2].filter((m) => poolCount(m, profile().equipment) > 0);
        save(); render(); break;
      }
      case 'set-goal': state.settings.goal = d.v; save(); render(); break;
      case 'set-level': state.settings.level = d.v; save(); render(); break;
      case 'set-units': if (state.settings.weight && state.settings.units !== d.v) { const k = d.v === 'kg' ? 0.4536 : 1 / 0.4536; state.settings.weight = Math.round(state.settings.weight * k); if (state.body.ideal) state.body.ideal = Math.round(state.body.ideal * k); } state.settings.units = d.v; save(); render(); break;
      case 'count': state.settings.count = Math.min(12, Math.max(3, state.settings.count + +d.d)); save(); render(); break;
      case 'generate':
        if (generate()) { render(); window.scrollTo(0, 0); } else toast('No exercises match that profile');
        break;
      case 'regen': generate(state.current && state.current.sport ? state.current.sport.day : undefined); render(); break;
      case 'set-sport': state.settings.sport = d.v || ''; save(); render(); break;
      case 'sport-build': {
        const sp = SPORT.get(state.settings.sport); if (!sp) break;
        const di = SPORT.nextDay(sp, state.history), prof = profile();
        state.selected = sp.days[di][1].filter((m) => poolCount(m, prof.equipment) > 0);
        if (state.selected.length && generate(di)) { render(); window.scrollTo(0, 0); } else toast('No exercises available for that with this equipment profile');
        break;
      }
      case 'discard':
        if (confirm('Discard this workout?')) { state.current = null; ui.restEnd = 0; save(); render(); }
        break;
      case 'form-guide': sheetGuide(d.ex); break;
      case 'g-play': { const m = guideM(); if (m) { m.playing ? m.pause() : m.play(); t.textContent = m.playing ? '⏸ Pause' : '▶ Play'; } break; }
      case 'g-view': { const h = $('#guideAnim'); if (h) { const was = guideM(), sp = was ? was.speed : 1; const m = WPA.setView(h, d.v); if (m) m.speed = sp; $$('[data-act="g-view"]').forEach((b) => b.classList.toggle('on', b === t)); const pl = $('#gPlay'); if (pl) pl.textContent = '⏸ Pause'; } break; }
      case 'g-speed': { const m = guideM(); if (m) { m.speed = +d.v; $$('[data-act="g-speed"]').forEach((b) => b.classList.toggle('on', b === t)); } break; }
      case 'g-seek': { const m = guideM(); if (m) { const K = m.tpl.poses.length; m.pause(); m.seek(+d.v ? (K - 1) / (2 * K - 2) : 0); $('#gPlay').textContent = '▶ Play'; } break; }
      case 'start-workout': if (w && !w.startedAt) { w.startedAt = Date.now(); save(); render(); } break;
      case 'finish': finishWorkout(); break;

      /* sets & exercises */
      case 'rt-start': { const r = state.routines.find((x) => x.id === d.id); if (!r) break;
        if (state.current && !confirm('Replace the workout you have open?')) break;
        closeSheet(); startRoutine(r); break; }
      case 'rt-menu': { const r = state.routines.find((x) => x.id === d.id); if (r) sheetRoutineMenu(r); break; }
      case 'rt-rename': { const r = state.routines.find((x) => x.id === d.id); if (!r) break; const n = (prompt('Rename routine', r.name) || '').trim(); if (n) { r.name = n; save(); closeSheet(); render(); } break; }
      case 'rt-del': { const r = state.routines.find((x) => x.id === d.id); if (r && confirm(`Delete “${r.name}”?`)) { state.routines = state.routines.filter((x) => x !== r); save(); closeSheet(); render(); } break; }
      case 'rt-save-cur': if (w) saveRoutinePrompt(w); break;
      case 'rt-save-last': if (ui.lastPlan) { saveRoutinePrompt(ui.lastPlan); closeSheet(); render(); } break;
      case 'rt-update': { const p = ui.lastPlan, k = p && state.routines.findIndex((x) => x.id === p.routineId); if (k >= 0) { const old = state.routines[k], nr = routineFrom(p, old.name); nr.id = old.id; nr.created = old.created; nr.lastUsed = Date.now(); state.routines[k] = nr; save(); toast('Routine updated'); closeSheet(); render(); } break; }
      case 'rec-pick': { ui.recM = d.m; const c = $('#recCard'); if (c) c.outerHTML = recoveryCard(); break; }
      case 'cal-nav': ui.calOff = Math.min(0, (ui.calOff || 0) + +d.v); render(); break;
      case 'cal-day': ui.histDay = ui.histDay === d.k ? null : d.k; render(); break;
      case 'cal-all': ui.histDay = null; render(); break;
      case 'badges-open': sheetBadges(); break;
      case 'hist-share': { const x = state.history.find((h) => h.id === d.id); if (x) shareWorkout(x); break; }
      case 'dl-start': state.deload = { ...(state.deload || {}), until: Date.now() + 7 * 86400000, last: Date.now() }; save(); render(); toast('Deload week on — new workouts are lighter for 7 days'); break;
      case 'dl-end': state.deload = { ...(state.deload || {}), until: 0, last: Date.now() }; save(); render(); toast('Deload ended'); break;
      case 'dl-snooze': state.deload = { ...(state.deload || {}), snooze: Date.now() + 7 * 86400000 }; save(); render(); break;
      case 'rt-paste': ui.paste = null; sheetPaste(); break;
      case 'rt-parse': {
        const txt = ($('#pasteText') || {}).value || ''; if (!txt.trim()) { toast('Paste a routine first'); break; }
        const owned = profile().equipment, r = MOTIVE.parseRoutine(txt, EXERCISES, (e) => isAvailable(e, owned));
        ui.paste = { text: txt, name: r.title || 'Pasted routine', items: r.items, skipped: r.skipped }; sheetPaste(); break;
      }
      case 'rt-pback': if (ui.paste) { ui.paste.items = null; sheetPaste(); } break;
      case 'rt-pdel': if (ui.paste && ui.paste.items) { ui.paste.name = ($('#pasteName') || {}).value || ui.paste.name; ui.paste.items.splice(+d.k, 1); sheetPaste(); } break;
      case 'rt-psave': {
        const p = ui.paste; if (!p || !p.items || !p.items.length) break;
        const name = (($('#pasteName') || {}).value || p.name).trim() || 'Pasted routine';
        const muscles = [...new Set(p.items.map((x) => EX_BY_ID[x.exId].muscle))];
        state.routines.unshift({ id: uid(), name, created: Date.now(), lastUsed: 0, goal: state.settings.goal, muscles, regions: {},
          exercises: p.items.map((x) => ({ exId: x.exId, sets: x.sets, reps: x.reps, rest: prescription(EX_BY_ID[x.exId], state.settings.goal).rest })) });
        ui.paste = null; save(); closeSheet(); render(); toast(`Saved “${name}” — tap ▶ Start to use it`); break;
      }
      case 'go-build': { const b = $('.builder'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'start' }); break; }
      case 'set-theme': state.settings.theme = d.v; save(); applyTheme(); render(); break;
      case 'same-prev': {
        const row = t.closest('.set'), j = +row.dataset.j, en = w.exercises[i], src = sameSrc(en, j); if (!src) break;
        const s = en.sets[j]; s.w = src.s.w; s.r = src.s.r;
        const wi = row.querySelector('input.w'), ri = row.querySelector('input.r'); if (wi) wi.value = s.w; if (ri) ri.value = s.r;
        row.querySelector('.check').click(); break;
      }
      case 'use-prev': {
        const row = t.closest('.set'), j = +row.dataset.j, s = w.exercises[i].sets[j], p = prevSet(w.exercises[i], j); if (!p) break;
        const ex = EX_BY_ID[w.exercises[i].exId];
        if (!ex.timed) s.w = p.w ? String(p.w) : s.w;
        s.r = String(p.r); save();
        const wi = row.querySelector('input.w'), ri = row.querySelector('input.r'); if (wi) wi.value = s.w; if (ri) ri.value = s.r;
        break;
      }
      case 'toggle-set': {
        const j = +t.closest('.set').dataset.j;
        const s = w.exercises[i].sets[j];
        if (!s.done && s.max && !(num(s.r) > 0)) { toast('Enter how many reps you got on the max set'); const inp = t.closest('.set').querySelector('input.r'); if (inp) inp.focus(); break; }
        s.done = !s.done;
        if (s.done) haptic();
        if (s.done) {
          if (!w.startedAt) w.startedAt = Date.now();
          if (!String(s.r).trim()) s.r = String(parseInt(w.exercises[i].target.reps, 10) || 10);
          propagate(i, j, 'w'); propagate(i, j, 'r');
          const en = w.exercises[i], partner = partnerOf(w, en);
          let moveOn = false;
          if (partner && !s.warm) {
            const ord = workIdx(en).indexOf(j), pj = workIdx(partner)[ord], ps = pj === undefined ? null : partner.sets[pj];
            if (ps && !ps.done) {
              moveOn = true; toast(`Superset — now ${EX_BY_ID[partner.exId].name}`);
              const row = document.querySelector(`.set[data-i="${w.exercises.indexOf(partner)}"][data-j="${pj}"]`);
              if (row) setTimeout(() => row.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
            }
          }
          if (!moveOn) startRest(s.warm ? 40 : en.target.rest);
        }
        save();
        {
          const en = w.exercises[i];
          if (!exerciseDone(en) && en.fx) { delete en.fx; save(); }
          $$(`.fx[data-i="${i}"]`).forEach((n) => n.remove());
          const lj = lastWorkIdx(en), lrow = document.querySelector(`.set[data-i="${i}"][data-j="${lj}"]`);
          if (lrow && exerciseDone(en)) {
            lrow.insertAdjacentHTML('afterend', effortHtml(en, i, lj));
            const fxEl = lrow.nextElementSibling;                       // keep it clear of the rest bar and tab bar at the bottom
            if (fxEl && fxEl.classList.contains('fx') && fxEl.getBoundingClientRect().bottom > window.innerHeight - 170) fxEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
        t.closest('.set').classList.toggle('done', s.done);
        t.setAttribute('aria-pressed', s.done);
        updateProgressDom(); markNext();
        if (s.done && w.exercises[i].sets.every((x) => x.done)) toast('Exercise complete ✔');
        // the "Regenerate" button should vanish once a set is done
        if (s.done) render();
        break;
      }
      case 'fx': {
        haptic();
        const row = t.closest('.fx'); const ei = +row.dataset.i, en = state.current.exercises[ei]; en.fx = d.v; save();
        row.outerHTML = effortHtml(en, ei, +row.dataset.j); break;
      }
      case 'fx-clear': { const row = t.closest('.fx'), ei = +row.dataset.i, en = state.current.exercises[ei]; delete en.fx; save(); row.outerHTML = effortHtml(en, ei, +row.dataset.j); break; }
      case 'max-set': {
        const en = w.exercises[i], on = en.sets.find((s) => s.max);
        if (on) { delete on.max; }
        else {
          let k = en.sets.length - 1; while (k >= 0 && en.sets[k].warm) k--;
          if (k < 0 || en.sets[k].done) { toast('Add a set first, then make it the max set'); break; }
          en.sets[k].max = true; en.sets[k].r = '';
          if (!String(en.sets[k].w).trim() && k > 0) en.sets[k].w = en.sets[k - 1].w;
        }
        save(); render(); break;
      }
      case 'add-set': {
        const sets = w.exercises[i].sets, prev = sets[sets.length - 1];
        sets.push({ w: prev ? prev.w : '', r: prev ? prev.r : '10', done: false }); delete w.exercises[i].fx;
        save(); render(); break;
      }
      case 'remove-set': {
        const sets = w.exercises[i].sets;
        if (sets.length > 1) { sets.pop(); save(); render(); }
        break;
      }
      case 'remove-ex':
        ssUnlink(w.exercises[i]);
        w.exercises.splice(i, 1);
        if (!w.exercises.length) state.current = null;
        save(); render(); break;
      case 'swap':
        if (w.exercises[i].sets.some((x) => x.done) && !confirm('This exercise has logged sets. Swapping it will clear them. Continue?')) break;
        sheetSwap(i); break;
      case 'ss-open': sheetSuperset(i); break;
      case 'pick-ss': ssLink(ui.ssIndex, +d.k); save(); closeSheet(); render(); toast('Superset linked — alternate A, then B'); break;
      case 'ss-unlink': ssUnlink(w.exercises[i]); save(); render(); toast('Superset unlinked'); break;
      case 'ss-add': case 'ss-rem': {
        const en = w.exercises[i], pa = partnerOf(w, en);
        [en, pa].forEach((x) => {
          if (!x) return;
          delete x.fx;
          if (act === 'ss-add') { const prev = x.sets[x.sets.length - 1]; x.sets.push({ w: prev ? prev.w : '', r: prev ? prev.r : '10', done: false }); }
          else if (x.sets.length > 1) x.sets.pop();
        });
        save(); render(); break;
      }
      case 'swap-random': {
        const btns = $$('#sheetBody [data-act="pick-swap"]');
        if (btns.length) btns[Math.floor(Math.random() * btns.length)].click();
        break;
      }
      case 'pick-swap': {
        const ex = EX_BY_ID[d.id];
        { const old = w.exercises[ui.swapIndex], ne = makeEntry(ex, w.goal); if (old.ss) { ne.ss = old.ss; ne.ssPos = old.ssPos; } w.exercises[ui.swapIndex] = ne; }
        save(); closeSheet(); render(); break;
      }
      case 'cx-new': cxOpen({ name: d.name || '', add: !!d.add }, false); break;
      case 'cx-edit': { const c = state.custom.find((x) => x.id === d.id); if (c) cxOpen({ id: c.id, name: c.name, muscle: c.muscle, equip: c.equip.slice(), level: c.level, cue: c.cue, secondary: c.secondary.slice(), timed: c.timed, loaded: c.loaded, regions: (c.regions || []).slice(), like: c.animLike || 'auto' }, true); break; }
      case 'cx-del': {
        const c = state.custom.find((x) => x.id === d.id); if (!c) break;
        if (state.current && state.current.exercises.some((e) => e.exId === c.id)) { toast('Remove it from your current workout first'); break; }
        if (!confirm(`Delete “${c.name}”? Your past workouts keep their logged sets.`)) break;
        state.custom = state.custom.filter((x) => x.id !== c.id); CUSTOM.sync(state.custom, EXERCISES, EX_BY_ID); save(); render(); toast('Exercise deleted'); break;
      }
      case 'cx-equip': case 'cx-sec': case 'cx-reg': {
        const cd = ui.cdraft; if (!cd) break;
        const key = act === 'cx-equip' ? 'equip' : act === 'cx-sec' ? 'secondary' : 'regions';
        const on = cd[key].includes(d.v); cd[key] = on ? cd[key].filter((x) => x !== d.v) : cd[key].concat(d.v);
        t.classList.toggle('on', !on); t.setAttribute('aria-pressed', !on);
        if (act === 'cx-equip' && cd.loaded === null) { const l = $('#cxLoaded'); if (l) l.checked = CUSTOM.loadedFor(cd.equip); }
        break;
      }
      case 'cx-save': cxSave(); break;
      case 'open-add': ui.addMuscle = 'workout'; ui.addSearch = ''; sheetAdd(); break;
      case 'add-filter': ui.addMuscle = d.m; sheetAdd(); break;
      case 'pick-add':
      case 'lib-add': {
        const ex = EX_BY_ID[d.id];
        if (!w) break;
        w.exercises.push(makeEntry(ex, w.goal));
        if (!w.muscles.includes(ex.muscle)) w.muscles.push(ex.muscle);
        save();
        if (act === 'pick-add') { closeSheet(); render(); } else toast(`Added ${ex.name}`);
        break;
      }

      /* library */
      case 'lib-muscle': ui.libMuscle = d.m; render(); break;
      case 'fav': {
        const k = state.favs.indexOf(d.id);
        if (k >= 0) state.favs.splice(k, 1); else state.favs.push(d.id);
        save();
        const on = isFav(d.id);
        t.classList.toggle('on', on); t.textContent = on ? '★' : '☆'; t.setAttribute('aria-pressed', on);
        if (ui.libMuscle === 'fav' && !on) $('#libList').innerHTML = libItems();
        const chip = $('[data-act="lib-muscle"][data-m="fav"]'); if (chip) chip.textContent = `★ Favorites${state.favs.length ? ' (' + state.favs.length + ')' : ''}`;
        break;
      }

      /* log something done earlier */
      case 'log-open': sheetLogChoose(); break;
      case 'log-strength': ui.mdraft = { date: dayVal(Date.now()), min: 45, exercises: [] }; ui.mpMuscle = 'all'; ui.mpSearch = ''; sheetPast(); break;
      case 'mp-pick-open': ui.mpMuscle = ui.mpMuscle || 'all'; sheetMPick(); break;
      case 'mp-filter': ui.mpMuscle = d.m; sheetMPick(); break;
      case 'mp-add': {
        const ex = EX_BY_ID[d.id], md = ui.mdraft; if (!ex || !md) break;
        md.exercises.push({ exId: ex.id, sets: [{ w: '', r: '' }] });
        sheetPast(); break;
      }
      case 'mp-set+': { const e = ui.mdraft.exercises[+d.mi], last = e.sets[e.sets.length - 1] || { w: '', r: '' }; e.sets.push({ w: last.w, r: last.r }); sheetPast(); break; }
      case 'mp-set-': { const e = ui.mdraft.exercises[+d.mi]; if (e.sets.length > 1) e.sets.pop(); sheetPast(); break; }
      case 'mp-rm': ui.mdraft.exercises.splice(+d.mi, 1); sheetPast(); break;
      case 'mp-save': savePast(); break;
      case 'log-back': sheetPast(); break;

      /* history */
      case 'hist-send': {
        const x = state.history.find((h) => h.id === d.id); if (!x) break;
        const end = x.endedAt || x.date + 45 * 60000;
        if (C.native) {
          C.nativeSave({ type: 'strength', label: 'Strength Training', date: x.date, dur: Math.max(60, (end - x.date) / 1000), kcal: x.kcal || 0, dist: 0 })
            .then((ok) => { if (ok === true) { x.sent = true; save(); render(); } });
          break;
        }
        x.sent = true; save(); toast('Sending to Apple Health…'); render();
        location.href = CARDIO.sendToHealthUrl({ type: 'strength', date: x.date, dur: Math.max(60, (end - x.date) / 1000), kcal: x.kcal || 0, dist: 0 }, state.settings.units);
        break;
      }
      case 'hist-del':
        if (confirm('Delete this workout from your history?')) {
          state.history = state.history.filter((x) => x.id !== d.id); save(); render();
        }
        break;

      /* profiles */
      case 'open-profiles': sheetProfiles(); break;
      case 'use-profile':
        state.activeProfile = d.id;
        state.selected = state.selected.filter((m) => poolCount(m, profile().equipment) > 0);
        save(); closeSheet(); render(); toast(`Using ${profile().name}`); break;
      case 'new-profile': ui.draft = { id: null, name: '', equipment: ['dumbbell', 'bench', 'bands'] }; sheetEditor(); break;
      case 'edit-profile': {
        const p = state.profiles.find((x) => x.id === d.id);
        ui.draft = { id: p.id, name: p.name, equipment: p.equipment.slice(), stack: p.stack ? { ...p.stack } : null }; sheetEditor(); break;
      }
      case 'dup-profile': {
        const p = state.profiles.find((x) => x.id === d.id);
        state.profiles.push({ id: uid(), name: `${p.name} copy`, equipment: p.equipment.slice() });
        save(); render(); break;
      }
      case 'del-profile': {
        const p = state.profiles.find((x) => x.id === d.id);
        if (state.profiles.length > 1 && confirm(`Delete the “${p.name}” profile?`)) {
          state.profiles = state.profiles.filter((x) => x.id !== d.id);
          if (state.activeProfile === d.id) state.activeProfile = state.profiles[0].id;
          save(); render();
        }
        break;
      }
      case 'equip-preset': {
        ui.draft.name = $('#pname').value;
        ui.draft.equipment = EQUIP_PRESETS.find((p) => p[0] === d.p)[2]();
        sheetEditor(); break;
      }
      case 'save-profile': saveProfile(); break;
      case 'close-sheet': closeSheet(); break;

      /* rest timer */
      case 'rest-add': if (ui.restEnd) { ui.restEnd += 15000; ui.restTotal += 15; ui.restBlip = 0; restNotify(ui.restEnd); tick(); } break;
      case 'rest-skip': ui.restEnd = 0; restNotify(0); tick(); break;

      /* data */
      case 'export':
        download(`will-power-fitness-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(state, null, 2));
        break;
      case 'import': $('#importFile').click(); break;
      case 'reset':
        if (confirm('Erase ALL profiles, workouts and history on this device? This cannot be undone.')) {
          state = defaults(); save(); ui.tab = 'train'; render();
        }
        break;
      default: if (!C.act(act, t) && !B.act(act, t) && !P.act(act, t)) T.act(act, t); break;
    }
  }

  /* ───────────── events ───────────── */
  document.addEventListener('click', (ev) => {
    unlockAudio();
    const t = ev.target.closest('[data-act], [data-tab]');
    if (!t) { if (ev.target.id === 'sheet') closeSheet(); return; }
    if (t.dataset.tab) return handleAction('nav', t);
    if (t.disabled) return;
    if (t.dataset.act === 'fav') ev.preventDefault();      // star sits inside a <summary>; don't toggle it
    handleAction(t.dataset.act, t);
  });

  document.addEventListener('input', (ev) => {
    const t = ev.target;
    if (C.input(t) || B.input(t) || P.input(t)) return;
    if (t.dataset && t.dataset.field && state.current) {
      const row = t.closest('.set');
      const s = state.current.exercises[+row.dataset.i].sets[+row.dataset.j];
      s[t.dataset.field] = t.value;
      if (t.dataset.field === 'w' || t.dataset.field === 'r') propagate(+row.dataset.i, +row.dataset.j, t.dataset.field);
      save();
    } else if (ui.cdraft && t.id === 'cxName') {
      ui.cdraft.name = t.value; cxHint();
    } else if (ui.cdraft && t.id === 'cxCue') {
      ui.cdraft.cue = t.value;
    } else if (ui.mdraft && t.dataset && t.dataset.mf) {
      ui.mdraft.exercises[+t.dataset.mi].sets[+t.dataset.mj][t.dataset.mf] = t.value;
    } else if (ui.mdraft && t.id === 'mpMin') {
      ui.mdraft.min = +t.value;
    } else if (ui.mdraft && t.id === 'mpSearch') {
      ui.mpSearch = t.value; const l = $('#mpList'); if (l) l.innerHTML = mpList();
    } else if (t.id === 'libSearch') {
      ui.libSearch = t.value; $('#libList').innerHTML = libItems();
    } else if (t.id === 'addSearch') {
      ui.addSearch = t.value;
      const pos = t.selectionStart;
      sheetAdd(); const n = $('#addSearch'); n.focus(); n.setSelectionRange(pos, pos);
    } else if (t.id === 'pname' && ui.draft) {
      ui.draft.name = t.value;
    }
  });

  document.addEventListener('change', (ev) => {
    const t = ev.target;
    if (C.change(t) || T.change(t)) return;
    if (ui.cdraft && t.id === 'cxMuscle') { ui.cdraft.muscle = t.value; ui.cdraft.regions = []; ui.cdraft.secondary = ui.cdraft.secondary.filter((m) => m !== t.value); ui.cdraft.like = 'auto'; ui.cdraft.loaded = $('#cxLoaded').checked; ui.cdraft.timed = $('#cxTimed').checked; sheetCustom(); }
    else if (ui.cdraft && t.id === 'cxLevel') ui.cdraft.level = +t.value;
    else if (ui.cdraft && t.id === 'cxLike') ui.cdraft.like = t.value;
    else if (ui.cdraft && t.id === 'cxLoaded') ui.cdraft.loaded = t.checked;
    else if (ui.cdraft && t.id === 'cxTimed') ui.cdraft.timed = t.checked;
    else if (ui.mdraft && t.id === 'mpDate') ui.mdraft.date = t.value;
    else if (t.id === 'libMine') { ui.libMine = t.checked; $('#libList').innerHTML = libItems(); }
    else if (t.id === 'warmToggle') { state.settings.warmups = t.checked; save(); }
    else if (t.id === 'ssToggle') { state.settings.supersets = t.checked; save(); }
    else if (t.id === 'restDefault') {
      state.settings.restSec = +t.value;
      if (state.current && state.settings.restSec > 0) state.current.exercises.forEach((en) => { if (!EX_BY_ID[en.exId].timed) en.target.rest = state.settings.restSec; });
      save(); toast(state.settings.restSec ? `Rest set to ${restLabel(state.settings.restSec)}` : 'Rest back to automatic');
    }
    else if (t.classList && t.classList.contains('restsel') && state.current) {
      const en = state.current.exercises[+t.dataset.xi]; if (!en) return;
      en.target.rest = +t.value; save(); toast(`Rest ${restLabel(en.target.rest)} for ${EX_BY_ID[en.exId].name}`);
    }
    else if (t.id === 'alertToggle') { state.settings.restAlert = t.checked; save(); if (t.checked) { unlockAudio(); beep(); } }
    else if (t.id === 'wakeToggle') { state.settings.wakeLock = t.checked; save(); keepAwake(); }
    else if (t.id === 'restToggle') { state.settings.restTimer = t.checked; save(); if (!t.checked) { ui.restEnd = 0; tick(); } }
    else if (t.dataset && t.dataset.equip && ui.draft) {
      const eq = ui.draft.equipment, k = eq.indexOf(t.dataset.equip);
      if (t.checked && k < 0) eq.push(t.dataset.equip);
      if (!t.checked && k >= 0) eq.splice(k, 1);
      updateUnlockInfo();
    } else if (t.id === 'importFile' && t.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data || !Array.isArray(data.profiles) || !data.profiles.length || !Array.isArray(data.history)) throw new Error('bad file');
          if (confirm('Replace everything on this device with the backup?')) {
            const d = defaults();
            state = Object.assign(d, data, { settings: Object.assign(d.settings, data.settings || {}), body: Object.assign(d.body, data.body || {}) });
            if (!state.profiles.some((p) => p.id === state.activeProfile)) state.activeProfile = state.profiles[0].id;
            if (!Array.isArray(state.custom)) state.custom = [];
            CUSTOM.sync(state.custom, EXERCISES, EX_BY_ID);
            save(); render(); toast('Backup restored');
          }
        } catch (e) { toast('That file isn’t a valid backup'); }
      };
      reader.readAsText(t.files[0]);
      t.value = '';
    }
  });

  // library items only mount their animation once opened
  document.addEventListener('toggle', (ev) => { if (ev.target.id === 'opts') ui.optsOpen = ev.target.open; else if (ev.target.id === 'recCard') ui.recOpen = ev.target.open; else if (ev.target.open && ev.target.classList.contains('lib')) WPA.hydrate(ev.target); }, true);

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !$('#sheet').hidden) closeSheet();
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList && ev.target.classList.contains('anim') && ev.target.dataset.act) { ev.preventDefault(); handleAction(ev.target.dataset.act, ev.target); }
  });

  /* ───────────── boot ───────────── */
  C.bootHash();
  render();
  C.boot();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((reg) => {
      // Check for a new version whenever the app comes back to the screen.
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(() => { /* offline support is optional */ });
    // When a new version takes over, reload once so the new code runs (your data is kept in storage).
    let reloaded = false;
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
  }
})();
