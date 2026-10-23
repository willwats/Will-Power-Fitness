/* Will Power Fitness — Cardio tab: live GPS tracker, manual log, daily calories, Apple Health bridge UI. */
const WPC = (ctx) => {
  const { esc, fmtClock, fmtNum, fmtDate, uid, num, ui, toast, openSheet, closeSheet } = ctx;
  const S = () => ctx.state();
  const U = () => S().settings.units;
  const SYNC_SHORTCUT = 'Will Power Sync';
  const kgNow = () => CARDIO.toKg(S().settings.weight || (U() === 'kg' ? 75 : 165), U());
  const typeName = (id) => CARDIO.TYPE_NAME[id] || 'Other';
  const du = () => CARDIO.distUnit(U());
  const timeOf = (t) => new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  let watchId = null, wake = null, lastSave = 0;
  ui.trainMode = 'strength'; ui.ctype = 'walk'; ui.cgps = true; ui.awaiting = false; ui.cdraft = null;

  /* ───────── live session ───────── */
  const live = () => S().cardioLive;
  const elapsed = (L, now = Date.now()) => (L.acc + (L.running ? now - L.resumedAt : 0)) / 1000;
  function liveStats(L) {
    const sec = elapsed(L);
    const mph = L.dist > 50 ? CARDIO.mphFrom(L.dist, sec) : 0;
    return { sec, mph, dist: L.dist, kcal: CARDIO.kcalFor(CARDIO.metFor(L.type, mph), kgNow(), sec) };
  }
  const fmtDist = (m) => CARDIO.metersToUnit(m, U()).toFixed(2);
  function fmtPace(m, sec) {
    const d = CARDIO.metersToUnit(m, U());
    if (d < 0.02 || sec < 10) return '–';
    return fmtClock(sec / d);
  }

  function stopWatch() {
    if (watchId != null && navigator.geolocation) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    if (wake) { try { wake.release(); } catch (e) { /* ignore */ } wake = null; }
  }
  function startWatch() {
    const L = live();
    stopWatch();
    if (!L || !L.running || !L.gps) return;
    if (!navigator.geolocation) { L.gps = false; toast('This browser has no GPS access'); return; }
    watchId = navigator.geolocation.watchPosition(onFix, onGeoErr, { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 });
    if (navigator.wakeLock) navigator.wakeLock.request('screen').then((w) => { wake = w; }).catch(() => { /* optional */ });
  }
  function onFix(p) {
    const L = live();
    if (!L || !L.running) return;
    const cur = { lat: p.coords.latitude, lon: p.coords.longitude, t: p.timestamp || Date.now(), acc: p.coords.accuracy || 0 };
    L.dist += CARDIO.stepMeters(L.fix, cur);
    const moved = L.fix && CARDIO.haversine(L.fix, cur) >= 3;
    if (cur.acc <= 35 && (!L.fix || moved || cur.t - L.fix.t > 30000)) L.fix = cur;
    L.lastFix = Date.now();
    if (Date.now() - lastSave > 5000) { lastSave = Date.now(); ctx.save(); }
    updateLiveDom();
  }
  function onGeoErr(e) {
    const L = live();
    if (e && e.code === 1 && L) { L.gps = false; stopWatch(); ctx.save(); toast('Location is blocked — tracking time only'); ctx.render(); }
    else if (L) toast('Waiting for a GPS signal…');
  }
  function updateLiveDom() {
    const L = live();
    if (!L || !(ui.tab === 'cardio' || (ui.tab === 'train' && ui.trainMode === 'cardio') || ui.tab === 'train')) return;
    const s = liveStats(L), set = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };
    set('lvTime', fmtClock(s.sec)); set('lvMini', fmtClock(s.sec)); set('lvDist', L.gps || L.dist ? fmtDist(L.dist) : '–'); set('lvPace', L.gps || L.dist ? fmtPace(L.dist, s.sec) : '–'); set('lvKcal', fmtNum(s.kcal));
    const g = document.getElementById('lvGps');
    if (g) g.textContent = !L.gps ? 'GPS off — time only' : !L.running ? 'Paused' : L.lastFix && Date.now() - L.lastFix < 15000 ? 'GPS locked' : 'Searching for GPS…';
  }
  setInterval(updateLiveDom, 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    const L = live();
    if (L && L.running && watchId == null) startWatch();
    if (ui.awaiting && ui.tab === 'cardio') ctx.render();
  });

  function start() {
    const t = CARDIO.TYPES.find((x) => x.id === ui.ctype) || CARDIO.TYPES[0];
    const now = Date.now();
    S().cardioLive = { type: t.id, gps: !!(t.gps && ui.cgps), startedAt: now, acc: 0, resumedAt: now, running: true, dist: 0, fix: null };
    ctx.save(); startWatch(); ctx.render();
  }
  function pause() {
    const L = live(); if (!L || !L.running) return;
    L.acc += Date.now() - L.resumedAt; L.running = false; stopWatch(); ctx.save(); ctx.render();
  }
  function resume() {
    const L = live(); if (!L || L.running) return;
    L.resumedAt = Date.now(); L.running = true; L.fix = null; ctx.save(); startWatch(); ctx.render();
  }
  function finish() {
    const L = live(); if (!L) return;
    if (L.running) { L.acc += Date.now() - L.resumedAt; L.running = false; stopWatch(); }
    const s = liveStats(L);
    ui.cdraft = { type: L.type, min: Math.max(1, Math.round(s.sec / 60)), dist: L.dist ? +CARDIO.metersToUnit(L.dist, U()).toFixed(2) : 0, kcal: s.kcal, kedit: false, live: true, date: L.startedAt, sec: Math.round(s.sec) };
    ctx.save(); sheetLog();
  }

  /* ───────── log sheet (finish a session, or log one by hand) ───────── */
  function estimate(d) {
    const sec = d.min * 60, m = CARDIO.unitToMeters(d.dist, U());
    return CARDIO.kcalFor(CARDIO.metFor(d.type, m > 0 ? CARDIO.mphFrom(m, sec) : 0), kgNow(), sec);
  }
  function sheetLog() {
    const d = ui.cdraft, today = CARDIO.dayKey(Date.now());
    const w = S().settings.weight || (U() === 'kg' ? 75 : 165);
    openSheet(d.live ? 'Save session' : 'Log cardio', `
      <div class="field"><label for="clType">Activity</label>
        <select id="clType">${CARDIO.TYPES.map((t) => `<option value="${t.id}" ${t.id === d.type ? 'selected' : ''}>${t.name}</option>`).join('')}</select></div>
      <div class="grid2">
        <div class="field"><label for="clMin">Minutes</label><input id="clMin" type="number" inputmode="decimal" min="1" value="${d.min || ''}"></div>
        <div class="field"><label for="clDist">Distance (${du()})</label><input id="clDist" type="number" inputmode="decimal" min="0" step="0.01" value="${d.dist || ''}" placeholder="optional"></div>
      </div>
      <div class="grid2">
        <div class="field"><label for="clKcal">Calories burned</label><input id="clKcal" type="number" inputmode="numeric" min="0" value="${d.kcal || ''}"></div>
        ${d.live ? '' : `<div class="field"><label for="clDate">Day</label><input id="clDate" type="date" value="${today}" max="${today}"></div>`}
      </div>
      <p class="muted small">Calories are estimated from activity, pace and your weight (${w} ${U()}). Type your own number if your watch or machine shows one.</p>
      <div class="row gap wrap">
        <button class="pill on" data-act="cd-save">Save</button>
        <button class="pill" data-act="close-sheet">${d.live ? 'Keep going' : 'Cancel'}</button>
        ${d.live ? '<button class="pill ghost danger" data-act="cd-discard">Discard</button>' : ''}
      </div>`);
  }
  function saveLog() {
    const d = ui.cdraft; if (!d) return;
    const min = num(document.getElementById('clMin').value), sec = d.live ? Math.max(Math.round(min * 60), 60) : Math.round(min * 60);
    if (sec < 60) { toast('Enter how many minutes'); return; }
    let date = d.date;
    if (!d.live) {
      const day = document.getElementById('clDate').value, now = Date.now();
      const sod = new Date(); sod.setHours(0, 0, 0, 0);
      date = !day || day === CARDIO.dayKey(now) ? Math.max(now - sec * 1000, sod.getTime()) : new Date(day + 'T12:00:00').getTime();
    }
    const rec = { id: uid(), type: d.type, date, dur: sec, dist: num(document.getElementById('clDist').value), kcal: Math.round(num(document.getElementById('clKcal').value)), source: 'app' };
    const st = S();
    st.cardio = st.cardio || [];
    st.cardio.unshift(rec); st.cardio.sort((a, b) => b.date - a.date);
    if (d.live) st.cardioLive = null;
    ui.cdraft = null;
    ctx.save(); closeSheet(); ctx.render(); toast(`Saved · ${rec.kcal} kcal`);
  }

  /* ───────── Apple Health bridge ───────── */
  function importText(text) {
    const parsed = CARDIO.parseHealthLink(text, U());
    if (!parsed) { toast('No Health data found in that text'); return false; }
    const r = CARDIO.mergeHealth(S(), parsed, U());
    ui.awaiting = false;
    ctx.save(); closeSheet(); ctx.render();
    toast(`Synced${parsed.kcal ? ` · ${fmtNum(parsed.kcal)} kcal` : ''}${r.added ? ` · ${r.added} workout${r.added > 1 ? 's' : ''}` : ''}`);
    return true;
  }
  function sheetPaste() {
    openSheet('Paste from Apple Health', `
      <p class="muted">Paste the text your <b>${SYNC_SHORTCUT}</b> Shortcut copied (it starts with <code>#health&amp;kcal=…</code>).</p>
      <textarea id="pasteBox" rows="4" placeholder="#health&kcal=512&steps=8423"></textarea>
      <div class="row gap"><button class="pill on" data-act="cd-paste-go">Import</button><button class="pill" data-act="close-sheet">Cancel</button></div>`);
  }
  function sheetGuide() {
    const url = location.origin + location.pathname;
    openSheet('Apple Health setup', `
      <p class="muted">Web apps can’t read Apple Health directly. Instead, a Shortcut on your iPhone reads it and hands the numbers to this app. Set it up once (about 3 minutes):</p>
      <h3>1 · “${SYNC_SHORTCUT}” — bring Health data in</h3>
      <ol class="guide">
        <li>Open <b>Shortcuts</b> → <b>＋</b> → name it exactly <code>${SYNC_SHORTCUT}</code>.</li>
        <li>Add <b>Find Health Samples</b>: Type <i>Active Energy</i>, Start Date <i>is today</i>. Then <b>Calculate Statistics → Sum</b>. Save it as a variable called <code>kcal</code>.</li>
        <li>Add another <b>Find Health Samples</b> for <i>Steps</i>, today → <b>Calculate Statistics → Sum</b> → variable <code>steps</code>.</li>
        <li>Add a <b>Text</b> action containing:<br><code>#health&amp;kcal=[kcal]&amp;steps=[steps]</code><br>(tap the blue words to insert the variables).</li>
        <li>Add <b>Copy to Clipboard</b>. Allow Health access when asked.</li>
      </ol>
      <p class="muted small"><b>Walks, runs &amp; other workouts:</b> add <b>Find Health Samples</b> (Type <i>Workouts</i>, today) and, for each one, append <code>&amp;wtype=[Workout Type]&amp;wmin=[Duration in minutes]&amp;wkcal=[Active Energy]&amp;wdist=[Distance in miles]</code> to the text. They then show up in your cardio list. Even without this step, a walk your Watch or phone records is already inside the day’s calorie total.</p>
      <h3>2 · Sync</h3>
      <p>Tap <b>Sync Apple Health</b> on the Cardio tab. The Shortcut runs and copies your numbers; switch back here and tap <b>Paste from clipboard</b>. Do this whenever you want your total updated.</p>
      <p class="muted small">Prefer one tap? End the Shortcut with <b>Open URL</b> → <code>${esc(url)}#health&amp;kcal=[kcal]&amp;steps=[steps]</code>. That opens in Safari, which keeps its own copy of your data separate from the home-screen app, so use it only if you use the app in Safari.</p>
      <h3>3 · “Will Power Log Workout” — send a workout to Health</h3>
      <ol class="guide">
        <li>New Shortcut named exactly <code>Will Power Log Workout</code>.</li>
        <li><b>Get Dictionary from Input</b> (the app sends JSON: <code>type, minutes, kcal, miles, start, end</code>).</li>
        <li>Add <b>Log Workout</b> and fill its fields from <b>Get Dictionary Value</b> for each key (Duration = <code>minutes</code>, Calories = <code>kcal</code>, Distance = <code>miles</code>).</li>
      </ol>
      <p class="muted small">Then the <b>Send to Health</b> button on any logged session adds it to Apple Fitness. Sessions you send are not double counted in your daily total.</p>
      <p class="muted small">Honest limits: this is a manual hand-off, not automatic background sync — that needs a native iOS app. Also, iPhone suspends web apps when the screen locks, so the live GPS tracker works best with the screen on; for long walks, start a Workout on your Watch/Fitness app and sync afterwards.</p>`);
  }

  function sendToHealth(id) {
    const rec = (S().cardio || []).find((c) => c.id === id); if (!rec) return;
    rec.sent = true; ctx.save();
    toast('Sending to Apple Health…');
    ctx.render();
    location.href = CARDIO.sendToHealthUrl(rec, U());
  }

  function bootHash() {
    if (!/^#health/i.test(location.hash)) return;
    const ok = CARDIO.parseHealthLink(location.hash, U());
    if (ok) { CARDIO.mergeHealth(S(), ok, U()); ctx.save(); ui.tab = 'cardio'; setTimeout(() => toast(`Synced from Apple Health${ok.kcal ? ` · ${fmtNum(ok.kcal)} kcal` : ''}`), 300); }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
  }
  function boot() { const L = live(); if (L && L.running) startWatch(); }

  /* ───────── views ───────── */
  const todayKey = () => CARDIO.dayKey(Date.now());
  function syncNote(d) {
    const st = S(), h = st.health && st.health[todayKey()];
    return h && h.syncedAt ? `Apple Health synced ${timeOf(h.syncedAt)}` : (d.hasHealth ? 'From Apple Health' : 'Not synced with Apple Health yet');
  }

  function todayMini() {
    const d = CARDIO.dailyTotals(S(), todayKey());
    return `<button class="card today mini" data-tab="cardio" aria-label="Open cardio and calories">
      <span><small>Calories burned today</small><b>${fmtNum(d.total)} <i>kcal</i></b></span>
      <span class="r">${d.steps ? `<em>${fmtNum(d.steps)} steps</em>` : ''}<em>${d.sessions} session${d.sessions === 1 ? '' : 's'}</em></span>
    </button>`;
  }

  function todayCard() {
    const d = CARDIO.dailyTotals(S(), todayKey());
    const parts = [];
    if (d.healthKcal) parts.push(`${fmtNum(d.healthKcal)} from Apple Health`);
    if (d.extra) parts.push(`${fmtNum(d.extra)} logged here`);
    return `<section class="card today">
      <small>Calories burned today</small>
      <div class="big"><b>${fmtNum(d.total)}</b><i>kcal</i></div>
      <p class="muted small">${parts.length ? parts.join(' + ') : 'Nothing yet — sync Apple Health or start a session.'}</p>
      <div class="row gap wrap stats-line">
        <span><b>${d.steps ? fmtNum(d.steps) : '–'}</b> steps</span>
        <span><b>${d.minutes}</b> active min</span>
        <span><b>${d.sessions}</b> session${d.sessions === 1 ? '' : 's'}</span>
      </div>
      <p class="muted small">${syncNote(d)}</p>
    </section>`;
  }

  function weekBars() {
    const days = CARDIO.lastDays(S(), 7), max = Math.max(1, ...days.map((x) => x.total));
    return `<section class="card"><h2>Last 7 days</h2>
      <div class="bars" role="img" aria-label="Calories burned per day, last 7 days">${days.map((x, i) => {
        const dt = new Date(x.key + 'T12:00:00');
        return `<div class="bar ${i === 6 ? 'now' : ''}"><small>${x.total ? fmtNum(x.total) : ''}</small><span style="height:${Math.max(3, (x.total / max) * 100)}%"></span><em>${dt.toLocaleDateString(undefined, { weekday: 'narrow' })}</em></div>`;
      }).join('')}</div></section>`;
  }

  function livePanel(L) {
    const s = liveStats(L);
    return `<section class="card livecard">
      <div class="row between"><h2>${typeName(L.type)}</h2><small id="lvGps" class="badge">${!L.gps ? 'GPS off — time only' : !L.running ? 'Paused' : 'Searching for GPS…'}</small></div>
      <div class="lv-time" id="lvTime">${fmtClock(s.sec)}</div>
      <div class="lv-grid">
        <div><b id="lvDist">${L.gps || L.dist ? fmtDist(L.dist) : '–'}</b><small>${du()}</small></div>
        <div><b id="lvPace">${L.gps || L.dist ? fmtPace(L.dist, s.sec) : '–'}</b><small>min/${du()}</small></div>
        <div><b id="lvKcal">${fmtNum(s.kcal)}</b><small>kcal</small></div>
      </div>
      <div class="row gap wrap">
        ${L.running ? '<button class="pill" data-act="cd-pause">Pause</button>' : '<button class="pill on" data-act="cd-resume">Resume</button>'}
        <button class="pill on" data-act="cd-finish">Finish</button>
      </div>
    </section>`;
  }

  function startPanel() {
    const t = CARDIO.TYPES.find((x) => x.id === ui.ctype) || CARDIO.TYPES[0];
    return `<section class="card">
      <h2>Start a session</h2>
      <div class="pills">${CARDIO.TYPES.map((x) => `<button class="pill ${x.id === ui.ctype ? 'on' : ''}" data-act="cd-type" data-v="${x.id}">${x.name}</button>`).join('')}</div>
      ${t.gps ? `<label class="toggle"><input type="checkbox" id="gpsToggle" ${ui.cgps ? 'checked' : ''}> <span>Track distance with GPS (keep the screen on)</span></label>` : ''}
      <div class="row gap wrap"><button class="pill on big" data-act="cd-start">Start ${t.name.toLowerCase()}</button><button class="pill" data-act="cd-manual">Log one manually</button></div>
    </section>`;
  }

  function healthPanel() {
    const st = S(), at = st.healthSyncedAt;
    return `<section class="card">
      <h2>Apple Health</h2>
      <p class="muted small">Pull in walks and workouts you didn’t log here — plus your day’s total calories and steps — with a one-time Shortcut.</p>
      <div class="row gap wrap">
        <button class="pill on" data-act="cd-sync">Sync Apple Health</button>
        <button class="pill ${ui.awaiting ? 'on attn' : ''}" data-act="cd-paste">Paste from clipboard</button>
        <button class="pill ghost" data-act="cd-guide">Setup guide</button>
      </div>
      ${ui.awaiting ? '<p class="small attn-note">Back from Shortcuts? Tap <b>Paste from clipboard</b> to import.</p>' : ''}
      <p class="muted small">${at ? `Last synced ${fmtDate(at)} ${timeOf(at)}` : 'Never synced'}</p>
    </section>`;
  }

  function recentList() {
    const list = (S().cardio || []).slice(0, 25);
    if (!list.length) return '';
    return `<section class="card"><h2>Recent cardio</h2>${list.map((c) => `
      <div class="citem">
        <div><b>${esc(typeName(c.type))}</b>${c.source === 'health' ? ' <span class="badge">Apple Health</span>' : c.sent ? ' <span class="badge">In Health</span>' : ''}
          <small>${fmtDate(c.date)} · ${fmtClock(c.dur)}${c.dist ? ` · ${c.dist} ${du()}` : ''}</small></div>
        <div class="r"><b>${fmtNum(c.kcal || 0)}</b><small>kcal</small></div>
        <div class="acts">
          ${c.source !== 'health' && !c.sent ? `<button class="link" data-act="cd-send" data-id="${c.id}">Send to Health</button>` : ''}
          <button class="link danger" data-act="cd-del" data-id="${c.id}">Delete</button>
        </div>
      </div>`).join('')}</section>`;
  }

  function targetCard() {
    const w = BODY.cardioWeek(S());
    return `<section class="card"><div class="row between"><h2>Weekly cardio</h2><small class="muted">${w.done} / ${w.target} min</small></div>
      <div class="meter" role="progressbar" aria-valuenow="${w.done}" aria-valuemax="${w.target}"><span style="width:${w.pct}%"></span></div>
      <p class="muted small">${w.focus ? `Target for “${esc(w.focus.name)}”. Change it in Profiles → You.` : 'General health target. Pick a training focus in Profiles to tailor it.'}</p></section>`;
  }
  function modeSwitch() {
    return `<div class="seg modes" role="group" aria-label="Workout type"><button data-act="cd-mode" data-v="strength" class="${ui.trainMode !== 'cardio' ? 'on' : ''}">Strength</button><button data-act="cd-mode" data-v="cardio" class="${ui.trainMode === 'cardio' ? 'on' : ''}">Cardio</button></div>`;
  }
  function liveBanner() {
    const L = live(); if (!L) return '';
    return `<button class="card today mini live" data-act="cd-mode" data-v="cardio"><span><small>${typeName(L.type)} in progress${L.running ? '' : ' (paused)'}</small><b id="lvMini">${fmtClock(elapsed(L))}</b></span><span class="r"><em>Tap to open</em></span></button>`;
  }
  function trainView() {
    const L = live();
    return `${todayCard()}${L ? livePanel(L) : startPanel()}${targetCard()}
      <p class="muted small pad">Apple Health sync, history and body-weight settings are on the Cardio tab.</p>`;
  }

  function view() {
    const L = live(), w = S().settings.weight || (U() === 'kg' ? 75 : 165);
    return `<div class="row between head"><h2>Cardio</h2></div>
      ${todayCard()}
      ${L ? livePanel(L) : startPanel()}
      ${targetCard()}
      ${healthPanel()}
      ${weekBars()}
      ${recentList()}
      <section class="card"><h2>Calorie estimate</h2>
        <div class="field"><label for="cdWeight">Your body weight (${U()})</label><input id="cdWeight" type="number" inputmode="decimal" min="30" value="${w}"></div>
        <p class="muted small">Used to estimate calories for sessions logged here (activity intensity × weight × time). Apple Health totals use your watch’s own numbers.</p>
      </section>`;
  }

  /* ───────── events from app.js ───────── */
  function act(a, t) {
    switch (a) {
      case 'cd-mode': ui.trainMode = t.dataset.v; ui.tab = 'train'; ctx.render(); window.scrollTo(0, 0); return true;
      case 'cd-type': ui.ctype = t.dataset.v; ctx.render(); return true;
      case 'cd-start': start(); return true;
      case 'cd-pause': pause(); return true;
      case 'cd-resume': resume(); return true;
      case 'cd-finish': finish(); return true;
      case 'cd-discard':
        if (confirm('Discard this session?')) { S().cardioLive = null; stopWatch(); ctx.save(); closeSheet(); ctx.render(); }
        return true;
      case 'cd-manual': ui.cdraft = { type: ui.ctype, min: 30, dist: 0, kcal: 0, kedit: false, live: false }; ui.cdraft.kcal = estimate(ui.cdraft); sheetLog(); return true;
      case 'cd-save': saveLog(); return true;
      case 'cd-del':
        if (confirm('Delete this entry?')) { S().cardio = S().cardio.filter((c) => c.id !== t.dataset.id); ctx.save(); ctx.render(); }
        return true;
      case 'cd-send': sendToHealth(t.dataset.id); return true;
      case 'cd-sync': ui.awaiting = true; ctx.render(); location.href = `shortcuts://run-shortcut?name=${encodeURIComponent(SYNC_SHORTCUT)}`; return true;
      case 'cd-paste':
        if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then((x) => { if (!importText(x)) sheetPaste(); }).catch(sheetPaste);
        else sheetPaste();
        return true;
      case 'cd-paste-go': importText(document.getElementById('pasteBox').value); return true;
      case 'cd-guide': sheetGuide(); return true;
      default: return false;
    }
  }
  function input(t) {
    const d = ui.cdraft;
    if (!d || !t.id || t.id.slice(0, 2) !== 'cl') return false;
    if (t.id === 'clKcal') { d.kedit = true; return true; }
    if (t.id === 'clType') d.type = t.value;
    if (t.id === 'clMin') d.min = num(t.value);
    if (t.id === 'clDist') d.dist = num(t.value);
    if (!d.kedit && t.id !== 'clDate') { d.kcal = estimate(d); document.getElementById('clKcal').value = d.kcal; }
    return true;
  }
  function change(t) {
    if (t.id === 'gpsToggle') { ui.cgps = t.checked; return true; }
    if (t.id === 'cdWeight') { const v = num(t.value); if (v >= 30) { S().settings.weight = v; ctx.save(); } return true; }
    if (t.id === 'clType') { input(t); return true; }
    return false;
  }

  return { view, trainView, modeSwitch, liveBanner, todayMini, todayCard, act, input, change, bootHash, boot };
};
