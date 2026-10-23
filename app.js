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
      settings: { units: 'lb', goal: 'hypertrophy', level: 'intermediate', count: 6, restTimer: true },
      selected: [],
      history: [],
      current: null,
    };
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && Array.isArray(s.profiles) && s.profiles.length) {
        const d = defaults();
        return Object.assign(d, s, { settings: Object.assign(d.settings, s.settings || {}) });
      }
    } catch (e) { /* fall through */ }
    return defaults();
  }
  let state = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage full / blocked */ } };

  // UI-only state (not persisted)
  const ui = { tab: 'train', libMuscle: 'all', libSearch: '', libMine: true, restEnd: 0, restTotal: 0, draft: null, addMuscle: 'workout', addSearch: '' };

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
      if (e && e.sets.length) return e.sets;
    }
    return null;
  }
  const volumeOf = (w) => w.exercises.reduce((t, e) => t + (e.timed ? 0 : e.sets.reduce((a, s) => a + s.w * s.r, 0)), 0);
  const setsOf = (w) => w.exercises.reduce((t, e) => t + e.sets.length, 0);

  /* ───────────── workout generation ───────────── */
  function prescription(ex, goal) {
    if (ex.timed) return { sets: 3, reps: '30-45', rest: 45 };
    const g = GOALS[goal] || GOALS.hypertrophy;
    return { ...(ex.compound ? g.compound : g.iso) };
  }
  function makeEntry(ex, goal) {
    const target = prescription(ex, goal);
    const last = lastLog(ex.id);
    const lowRep = parseInt(target.reps, 10) || 10;
    const sets = Array.from({ length: target.sets }, (_, j) => {
      const prev = last ? (last[j] || last[last.length - 1]) : null;
      return {
        w: !ex.timed && prev && prev.w ? String(prev.w) : '',
        r: String(prev && prev.r ? prev.r : lowRep),
        done: false,
      };
    });
    return { exId: ex.id, target, sets };
  }

  function generate() {
    const prof = profile();
    const goal = state.settings.goal;
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
        const s = (WEIGHT[m] || 1) / (alloc[m] + 1);
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
        const cands = pool[m].filter((e) => !picked.includes(e));
        if (!cands.length) break;
        let best = null, bs = -Infinity;
        for (const e of cands) {
          let s = Math.random() - penalty(e);
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

    state.current = {
      id: uid(), createdAt: Date.now(), startedAt: null,
      profileId: prof.id, profileName: prof.name, muscles, goal,
      exercises: chosen.map((e) => makeEntry(e, goal)),
    };
    save();
    return true;
  }

  /* ───────────── rendering ───────────── */
  function viewTrain() {
    return state.current ? viewWorkout() : viewBuilder();
  }

  function viewBuilder() {
    const prof = profile();
    const owned = prof.equipment;
    const selected = state.selected.filter((m) => poolCount(m, owned) > 0);
    const unlocked = EXERCISES.filter((e) => isAvailable(e, owned)).length;
    const s = state.settings;

    const chips = MUSCLES.map((m) => {
      const count = poolCount(m.id, owned);
      const d = daysSince(m.id);
      const rec = d === null ? 'fresh' : d >= 3 ? 'fresh' : d === 2 ? 'mid' : 'hot';
      const ago = d === null ? 'not trained yet' : d === 0 ? 'trained today' : `${d}d ago`;
      const on = selected.includes(m.id);
      return `<button class="chip ${on ? 'on' : ''}" data-act="toggle-muscle" data-m="${m.id}" aria-pressed="${on}" ${count ? '' : 'disabled'}>
        <span class="dot ${rec}"></span><b>${m.name}</b><small>${count ? `${count} exercises · ${ago}` : 'no gear for this'}</small></button>`;
    }).join('');

    const presets = MUSCLE_PRESETS.map(([id, label]) => `<button class="pill" data-act="preset" data-p="${id}">${label}</button>`).join('')
      + `<button class="pill ghost" data-act="preset" data-p="clear">Clear</button>`;

    const seg = (key, opts) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button data-act="set-${key}" data-v="${v}" class="${s[key] === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;

    return `
      <section class="card">
        <div class="row between">
          <div><h2>What are we training?</h2>
          <p class="muted">Using <b>${esc(prof.name)}</b> · ${unlocked} exercises unlocked</p></div>
          <div class="row gap"><button class="pill" data-act="edit-profile" data-id="${prof.id}">Edit gear</button><button class="pill" data-act="open-profiles">Switch</button></div>
        </div>
        <div class="pills">${presets}</div>
        <div class="chips">${chips}</div>
      </section>
      <section class="card">
        <div class="field"><label>Goal</label>${seg('goal', Object.entries(GOALS).map(([k, g]) => [k, g.label]))}</div>
        <div class="field"><label>Experience</label>${seg('level', [['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']])}</div>
        <div class="field row between"><label>Exercises</label>
          <div class="stepper"><button data-act="count" data-d="-1" aria-label="Fewer">−</button><output>${s.count}</output><button data-act="count" data-d="1" aria-label="More">+</button></div>
        </div>
      </section>
      <button class="primary big" data-act="generate" ${selected.length ? '' : 'disabled'}>${selected.length ? `Build ${selected.map((m) => MUSCLE_NAME[m]).join(' + ')} workout` : 'Pick a body part to start'}</button>`;
  }

  function entryCard(entry, i) {
    const ex = EX_BY_ID[entry.exId];
    const units = state.settings.units;
    const last = lastLog(ex.id);
    const lastTxt = last ? 'Last: ' + last.map((x) => (ex.timed ? `${x.r}s` : `${x.w ? x.w + '×' : ''}${x.r}`)).join(' · ') : 'First time — pick a weight that feels right';
    const rows = entry.sets.map((st, j) => `
      <div class="set ${st.done ? 'done' : ''}" data-i="${i}" data-j="${j}">
        <span class="n">${j + 1}</span>
        ${ex.timed ? '<span class="w-na"></span><span></span>' : `<input class="w" inputmode="decimal" data-field="w" placeholder="${ex.loaded ? '0' : 'BW'}" value="${esc(st.w)}" aria-label="Weight"><span class="u">${units}</span>`}
        <input class="r" inputmode="numeric" data-field="r" placeholder="${esc(entry.target.reps)}" value="${esc(st.r)}" aria-label="${ex.timed ? 'Seconds' : 'Reps'}"><span class="u">${ex.timed ? 'sec' : 'reps'}</span>
        <button class="check" data-act="toggle-set" aria-pressed="${st.done}" aria-label="Mark set ${j + 1} done">✓</button>
      </div>`).join('');
    return `
      <article class="ex" data-i="${i}">
        <header>
          <div class="hd-text"><h3>${esc(ex.name)}</h3>
          <p class="meta">${MUSCLE_NAME[ex.muscle]} · ${esc(equipLabel(ex))} · <b>${entry.target.sets} × ${esc(entry.target.reps)}${ex.timed ? 's' : ''}</b></p></div>
          <div class="anim" data-ex="${ex.id}"></div>
        </header>
        <p class="cue">${esc(ex.cue)}</p>
        <p class="last">${esc(lastTxt)}</p>
        <div class="sets">${rows}</div>
        <footer>
          <button class="link" data-act="add-set">+ Set</button>
          <button class="link" data-act="remove-set">− Set</button>
          <button class="link" data-act="swap">Swap</button>
          <button class="link danger" data-act="remove-ex">Remove</button>
        </footer>
      </article>`;
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
    return `
      <section class="card summary">
        <div class="row between">
          <div><h2>${w.muscles.map((m) => MUSCLE_NAME[m]).join(' + ')}</h2>
          <p class="muted">${esc(w.profileName)} · ${GOALS[w.goal]?.label || ''}</p></div>
          <div class="clock"><span id="elapsed">${started ? fmtClock((Date.now() - w.startedAt) / 1000) : '0:00'}</span><small>${started ? 'elapsed' : 'starts on first set'}</small></div>
        </div>
        <div class="bar"><i id="barFill" style="width:${total ? (done / total) * 100 : 0}%"></i></div>
        <p class="muted" id="progressTxt">${done} of ${total} sets done</p>
        <div class="row gap">
          ${done === 0 ? '<button class="pill" data-act="regen">↻ Regenerate</button>' : ''}
          <button class="pill ghost" data-act="discard">Discard</button>
        </div>
      </section>
      ${w.exercises.map(entryCard).join('')}
      <button class="pill wide" data-act="open-add">＋ Add exercise</button>
      <button class="primary big" data-act="finish">Finish workout</button>`;
  }

  function libItems() {
    const owned = profile().equipment;
    const q = ui.libSearch.trim().toLowerCase();
    const list = EXERCISES.filter((e) =>
      (ui.libMuscle === 'all' || e.muscle === ui.libMuscle) &&
      (!ui.libMine || isAvailable(e, owned)) &&
      (!q || e.name.toLowerCase().includes(q)));
    if (!list.length) return '<p class="empty">No exercises match. Try turning off “My equipment only” or edit your profile’s gear.</p>';
    return list.map((e) => `
      <details class="lib">
        <summary><span><b>${esc(e.name)}</b><small>${MUSCLE_NAME[e.muscle]} · ${esc(equipLabel(e))}</small></span>${isAvailable(e, owned) ? '' : '<em class="needgear">needs gear</em>'}</summary>
        <div class="anim" data-ex="${e.id}"></div>
        <p>${esc(e.cue)}</p>
        <p class="tags"><span>${LEVELS[e.level]}</span>${e.compound ? '<span>Compound</span>' : '<span>Isolation</span>'}${e.secondary.map((s) => `<span>+ ${MUSCLE_NAME[s]}</span>`).join('')}</p>
        ${state.current && isAvailable(e, owned) ? `<button class="pill" data-act="lib-add" data-id="${e.id}">Add to current workout</button>` : ''}
      </details>`).join('');
  }

  function viewLibrary() {
    const chips = [['all', 'All'], ...MUSCLES.map((m) => [m.id, m.name])]
      .map(([id, l]) => `<button class="pill ${ui.libMuscle === id ? 'on' : ''}" data-act="lib-muscle" data-m="${id}">${l}</button>`).join('');
    return `
      <section class="card">
        <h2>Exercise library</h2>
        <input type="search" id="libSearch" class="search" placeholder="Search ${EXERCISES.length} exercises" value="${esc(ui.libSearch)}">
        <div class="pills scroll">${chips}</div>
        <label class="toggle"><input type="checkbox" id="libMine" ${ui.libMine ? 'checked' : ''}> <span>Only exercises I can do with <b>${esc(profile().name)}</b></span></label>
      </section>
      <div id="libList">${libItems()}</div>`;
  }

  function viewHistory() {
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
    if (!h.length) return stats + '<p class="empty">No workouts yet. Build one on the Train tab and your history will show up here.</p>';
    return stats + h.map((w) => {
      const dur = w.endedAt && w.date ? fmtClock((w.endedAt - w.date) / 1000) : '';
      return `
      <details class="hist">
        <summary><span><b>${w.muscles.map((m) => MUSCLE_NAME[m]).join(' + ')}</b>
          <small>${fmtDate(w.date)} · ${esc(w.profileName || '')}${dur ? ' · ' + dur : ''}</small></span>
          <span class="vol">${setsOf(w)} sets<small>${fmtNum(volumeOf(w))} ${state.settings.units}</small></span></summary>
        ${w.exercises.map((e) => `<div class="hx"><b>${esc(e.name)}</b><span>${e.sets.map((s) => (e.timed ? `${s.r}s` : `${s.w ? s.w + '×' : ''}${s.r}`)).join(' · ')}</span></div>`).join('')}
        <button class="link danger" data-act="hist-del" data-id="${w.id}">Delete workout</button>
      </details>`;
    }).join('');
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
      <div class="row between head"><h2>Profiles</h2><button class="pill on" data-act="new-profile">＋ New profile</button></div>
      <p class="muted pad">A profile is a set of equipment — for example your gym, or the room upstairs. Workouts only use exercises you can actually do with the active profile.</p>
      ${cards}
      <section class="card">
        <h2>Settings</h2>
        <div class="field"><label>Weight units</label>
          <div class="seg"><button data-act="set-units" data-v="lb" class="${s.units === 'lb' ? 'on' : ''}">lb</button><button data-act="set-units" data-v="kg" class="${s.units === 'kg' ? 'on' : ''}">kg</button></div></div>
        <label class="toggle"><input type="checkbox" id="restToggle" ${s.restTimer ? 'checked' : ''}> <span>Auto-start rest timer after each set</span></label>
        <div class="row gap wrap">
          <button class="pill" data-act="export">Export backup</button>
          <button class="pill" data-act="import">Import backup</button>
          <button class="pill ghost danger" data-act="reset">Erase all data</button>
        </div>
        <input type="file" id="importFile" accept="application/json" hidden>
        <p class="muted small">Everything is stored on this device only. Export a backup now and then.</p>
      </section>`;
  }

  function render() {
    const y = window.scrollY;
    $('#profileChip').textContent = profile().name;
    $$('nav button').forEach((b) => b.classList.toggle('on', b.dataset.tab === ui.tab));
    $('#main').innerHTML = { train: viewTrain, library: viewLibrary, history: viewHistory, gear: viewGear }[ui.tab]();
    window.scrollTo(0, y);
    if (ui.tab === 'train') WPA.hydrate($('#main'));
    tick();
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
    ui.draft = null;
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
        <b>${esc(e.name)}</b><small>${MUSCLE_NAME[e.muscle]} · ${esc(equipLabel(e))} · ${LEVELS[e.level]}</small>
      </button>`).join('');
  }

  function sheetSwap(i) {
    const w = state.current;
    const cur = EX_BY_ID[w.exercises[i].exId];
    const owned = workoutProfile().equipment;
    const inUse = new Set(w.exercises.map((e) => e.exId));
    const alts = EXERCISES.filter((e) => e.muscle === cur.muscle && isAvailable(e, owned) && !inUse.has(e.id));
    ui.swapIndex = i;
    openSheet(`Swap ${cur.name}`, (alts.length ? '<button class="pill on wide" data-act="swap-random">🎲 Surprise me</button>' : '') + entryPickerList(alts, 'pick-swap'));
  }

  function sheetAdd() {
    const w = state.current;
    const owned = workoutProfile().equipment;
    const inUse = new Set(w.exercises.map((e) => e.exId));
    const q = ui.addSearch.trim().toLowerCase();
    const list = EXERCISES.filter((e) => isAvailable(e, owned) && !inUse.has(e.id)
      && (ui.addMuscle === 'all' || (ui.addMuscle === 'workout' ? w.muscles.includes(e.muscle) : e.muscle === ui.addMuscle))
      && (!q || e.name.toLowerCase().includes(q)));
    const chips = [['workout', 'This workout'], ['all', 'All'], ...MUSCLES.map((m) => [m.id, m.name])]
      .map(([id, l]) => `<button class="pill ${ui.addMuscle === id ? 'on' : ''}" data-act="add-filter" data-m="${id}">${l}</button>`).join('');
    openSheet('Add exercise', `<input type="search" id="addSearch" class="search" placeholder="Search" value="${esc(ui.addSearch)}"><div class="pills scroll">${chips}</div><div id="addList">${entryPickerList(list, 'pick-add')}</div>`);
  }

  function sheetSummary(rec) {
    const dur = fmtClock((rec.endedAt - rec.date) / 1000);
    openSheet('Workout complete 💪', `
      <div class="stats big">
        <div><b>${dur}</b><small>time</small></div>
        <div><b>${setsOf(rec)}</b><small>sets</small></div>
        <div><b>${fmtNum(volumeOf(rec))}</b><small>${state.settings.units} lifted</small></div>
      </div>
      <p class="muted">Saved to your history. Muscle recovery dots on the Train tab are updated.</p>
      <button class="primary big" data-act="close-sheet">Done</button>`);
  }

  /* ───────────── timers & sound ───────────── */
  let audioCtx = null;
  function unlockAudio() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { /* no audio */ }
  }
  function beep() {
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
  function startRest(sec) {
    if (!state.settings.restTimer || !sec) return;
    ui.restTotal = sec;
    ui.restEnd = Date.now() + sec * 1000;
    tick();
  }
  function tick() {
    const w = state.current;
    const el = $('#elapsed');
    if (el && w && w.startedAt) el.textContent = fmtClock((Date.now() - w.startedAt) / 1000);
    const bar = $('#rest');
    if (ui.restEnd) {
      const left = Math.ceil((ui.restEnd - Date.now()) / 1000);
      if (left <= 0) { ui.restEnd = 0; beep(); bar.hidden = true; return; }
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
  }

  function finishWorkout() {
    const w = state.current;
    const exercises = w.exercises.map((en) => {
      const ex = EX_BY_ID[en.exId];
      return { exId: ex.id, name: ex.name, muscle: ex.muscle, timed: ex.timed,
        sets: en.sets.filter((s) => s.done).map((s) => ({ w: num(s.w), r: num(s.r) })) };
    }).filter((e) => e.sets.length);
    if (!exercises.length) {
      if (confirm('No sets were logged. Discard this workout?')) { state.current = null; ui.restEnd = 0; save(); render(); }
      return;
    }
    const rec = { id: w.id, date: w.startedAt || w.createdAt, endedAt: Date.now(), profileId: w.profileId, profileName: w.profileName, muscles: w.muscles, goal: w.goal, exercises };
    state.history.unshift(rec);
    state.current = null;
    ui.restEnd = 0;
    save(); render(); sheetSummary(rec);
  }

  function saveProfile() {
    const d = ui.draft;
    const name = ($('#pname').value || '').trim() || 'My profile';
    if (d.id) {
      const p = state.profiles.find((x) => x.id === d.id);
      p.name = name; p.equipment = d.equipment.slice();
    } else {
      const p = { id: uid(), name, equipment: d.equipment.slice() };
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
    const i = entryEl ? +entryEl.dataset.i : null;
    switch (act) {
      case 'nav': ui.tab = d.tab; closeSheet(); render(); window.scrollTo(0, 0); break;

      /* builder */
      case 'toggle-muscle': {
        const k = state.selected.indexOf(d.m);
        if (k >= 0) state.selected.splice(k, 1); else state.selected.push(d.m);
        save(); render(); break;
      }
      case 'preset': {
        if (d.p === 'clear') state.selected = [];
        else state.selected = MUSCLE_PRESETS.find((p) => p[0] === d.p)[2].filter((m) => poolCount(m, profile().equipment) > 0);
        save(); render(); break;
      }
      case 'set-goal': state.settings.goal = d.v; save(); render(); break;
      case 'set-level': state.settings.level = d.v; save(); render(); break;
      case 'set-units': state.settings.units = d.v; save(); render(); break;
      case 'count': state.settings.count = Math.min(12, Math.max(3, state.settings.count + +d.d)); save(); render(); break;
      case 'generate':
        if (generate()) { render(); window.scrollTo(0, 0); } else toast('No exercises match that profile');
        break;
      case 'regen': generate(); render(); break;
      case 'discard':
        if (confirm('Discard this workout?')) { state.current = null; ui.restEnd = 0; save(); render(); }
        break;
      case 'finish': finishWorkout(); break;

      /* sets & exercises */
      case 'toggle-set': {
        const j = +t.closest('.set').dataset.j;
        const s = w.exercises[i].sets[j];
        s.done = !s.done;
        if (s.done) {
          if (!w.startedAt) w.startedAt = Date.now();
          if (!String(s.r).trim()) s.r = String(parseInt(w.exercises[i].target.reps, 10) || 10);
          startRest(w.exercises[i].target.rest);
        }
        save();
        t.closest('.set').classList.toggle('done', s.done);
        t.setAttribute('aria-pressed', s.done);
        updateProgressDom();
        if (s.done && w.exercises[i].sets.every((x) => x.done)) toast('Exercise complete ✔');
        // the "Regenerate" button should vanish once a set is done
        if (s.done) render();
        break;
      }
      case 'add-set': {
        const sets = w.exercises[i].sets, prev = sets[sets.length - 1];
        sets.push({ w: prev ? prev.w : '', r: prev ? prev.r : '10', done: false });
        save(); render(); break;
      }
      case 'remove-set': {
        const sets = w.exercises[i].sets;
        if (sets.length > 1) { sets.pop(); save(); render(); }
        break;
      }
      case 'remove-ex':
        w.exercises.splice(i, 1);
        if (!w.exercises.length) state.current = null;
        save(); render(); break;
      case 'swap':
        if (w.exercises[i].sets.some((x) => x.done) && !confirm('This exercise has logged sets. Swapping it will clear them. Continue?')) break;
        sheetSwap(i); break;
      case 'swap-random': {
        const btns = $$('#sheetBody [data-act="pick-swap"]');
        if (btns.length) btns[Math.floor(Math.random() * btns.length)].click();
        break;
      }
      case 'pick-swap': {
        const ex = EX_BY_ID[d.id];
        w.exercises[ui.swapIndex] = makeEntry(ex, w.goal);
        save(); closeSheet(); render(); break;
      }
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

      /* history */
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
        ui.draft = { id: p.id, name: p.name, equipment: p.equipment.slice() }; sheetEditor(); break;
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
      case 'rest-add': if (ui.restEnd) { ui.restEnd += 15000; ui.restTotal += 15; tick(); } break;
      case 'rest-skip': ui.restEnd = 0; tick(); break;

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
      default: break;
    }
  }

  /* ───────────── events ───────────── */
  document.addEventListener('click', (ev) => {
    unlockAudio();
    const t = ev.target.closest('[data-act], [data-tab]');
    if (!t) { if (ev.target.id === 'sheet') closeSheet(); return; }
    if (t.dataset.tab) return handleAction('nav', t);
    if (t.disabled) return;
    handleAction(t.dataset.act, t);
  });

  document.addEventListener('input', (ev) => {
    const t = ev.target;
    if (t.dataset && t.dataset.field && state.current) {
      const row = t.closest('.set');
      const s = state.current.exercises[+row.dataset.i].sets[+row.dataset.j];
      s[t.dataset.field] = t.value;
      save();
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
    if (t.id === 'libMine') { ui.libMine = t.checked; $('#libList').innerHTML = libItems(); }
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
            state = Object.assign(d, data, { settings: Object.assign(d.settings, data.settings || {}) });
            if (!state.profiles.some((p) => p.id === state.activeProfile)) state.activeProfile = state.profiles[0].id;
            save(); render(); toast('Backup restored');
          }
        } catch (e) { toast('That file isn’t a valid backup'); }
      };
      reader.readAsText(t.files[0]);
      t.value = '';
    }
  });

  // library items only mount their animation once opened
  document.addEventListener('toggle', (ev) => { if (ev.target.open && ev.target.classList.contains('lib')) WPA.hydrate(ev.target); }, true);

  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

  /* ───────────── boot ───────────── */
  render();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* offline support is optional */ });
  }
})();
