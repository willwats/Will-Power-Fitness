/* Will Power Fitness — water & protein tracker (Train) and the Body view (weight trend, measurements, photos). */
const WPT = (ctx) => {
  const { esc, num, ui, openSheet, closeSheet, toast, fmtNum } = ctx;
  const S = () => ctx.state();
  const U = () => S().settings.units;
  ui.histMode = 'workouts'; ui.photos = null;
  const today = () => TRACK.dayKey(Date.now());
  const kgNow = () => BODY.kgOf(S().settings.weight || 0, U());
  const dispW = (kg) => Math.round(BODY.fromKg(kg, U()) * 10) / 10;
  const fmtDay = (t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  /* ───────── photos (IndexedDB, stays on this device) ───────── */
  const DB = (() => {
    let p = null;
    const open = () => p || (p = new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('no idb'));
      const r = indexedDB.open('wpf-photos', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('p', { keyPath: 'id' });
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    }));
    const tx = (mode, fn) => open().then((db) => new Promise((res, rej) => {
      const t = db.transaction('p', mode); const rq = fn(t.objectStore('p'));
      t.oncomplete = () => res(rq && rq.result); t.onerror = () => rej(t.error);
    }));
    return { all: () => tx('readonly', (s) => s.getAll()), put: (r) => tx('readwrite', (s) => s.put(r)), del: (id) => tx('readwrite', (s) => s.delete(id)) };
  })();
  async function shrink(file) {
    const bmp = await createImageBitmap(file), k = Math.min(1, 1000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise((r) => c.toBlob(r, 'image/jpeg', 0.82));
  }
  function loadPhotos() {
    DB.all().then((rows) => {
      (ui.photos || []).forEach((p) => URL.revokeObjectURL(p.url));
      ui.photos = (rows || []).sort((a, b) => a.date - b.date).map((r) => ({ id: r.id, date: r.date, url: URL.createObjectURL(r.blob) }));
      if (ui.tab === 'history' && ui.histMode === 'body') ctx.render();
    }).catch(() => { ui.photos = []; });
  }
  async function addPhoto(file) {
    try { const blob = await shrink(file); await DB.put({ id: Math.random().toString(36).slice(2, 10), date: Date.now(), blob }); toast('Photo saved on this device'); loadPhotos(); }
    catch (e) { toast('Couldn’t save that photo'); }
  }

  /* ───────── water & protein ───────── */
  function nutritionCard() {
    const st = S(), key = today(), d = TRACK.intakeFor(st, key), kg = kgNow();
    const g = TRACK.targets(kg, (st.body || {}).focus, TRACK.trainedOn(st, key));
    const wu = TRACK.dispUnit(U()), lb = U() !== 'kg';
    const waterBtns = (lb ? [8, 16, 24] : [250, 500, 750]).map((v) => `<button class="pill" data-act="nt-water" data-ml="${lb ? Math.round(TRACK.oz2ml(v)) : v}">+${v} ${wu}</button>`).join('');
    const row = (label, cur, tgt, unit) => `<div class="nt"><div class="row between"><b>${label}</b><span class="muted small">${fmtNum(cur)}${tgt ? ` / ${fmtNum(tgt)}` : ''} ${unit}</span></div>
      <div class="meter"><span style="width:${tgt ? Math.min(100, (cur / tgt) * 100) : 0}%"></span></div></div>`;
    return `<section class="card nutrition">
      <h2>Water &amp; protein</h2>
      ${row('Water', TRACK.ml2disp(d.water, U()), g ? TRACK.ml2disp(g.water, U()) : 0, wu)}
      <div class="row gap wrap">${waterBtns}<button class="pill ghost" data-act="nt-water" data-ml="${lb ? -Math.round(TRACK.oz2ml(8)) : -250}" aria-label="Undo water">−</button></div>
      ${row('Protein', d.protein, g ? g.protein : 0, 'g')}
      <div class="row gap wrap"><button class="pill" data-act="nt-protein" data-g="10">+10 g</button><button class="pill" data-act="nt-protein" data-g="25">+25 g</button><button class="pill" data-act="nt-protein" data-g="40">+40 g</button><button class="pill ghost" data-act="nt-protein" data-g="-10" aria-label="Undo protein">−</button></div>
      <p class="muted small">${g ? `Targets from your weight${(st.body || {}).focus ? ` and “${esc(BODY.FOCUS_BY_ID[st.body.focus].name)}” focus` : ''}${TRACK.trainedOn(st, key) ? ' (extra water for training today)' : ''}.` : 'Add your weight in Profiles → You to get daily targets.'}</p>
    </section>`;
  }

  /* ───────── Body view ───────── */
  const histSwitch = () => `<div class="seg modes" role="group" aria-label="History view"><button data-act="hist-mode" data-v="workouts" class="${ui.histMode === 'workouts' ? 'on' : ''}">Workouts</button><button data-act="hist-mode" data-v="body" class="${ui.histMode === 'body' ? 'on' : ''}">Body</button></div>`;

  function weightCard() {
    const st = S(), ws = st.weights || [], u = U();
    const cur = ws.length ? ws[ws.length - 1].kg : kgNow(), ideal = (st.body || {}).ideal || 0;
    const tr = TRACK.weeklyTrend(ws);
    const pts = ws.map((w) => ({ t: w.date, v: dispW(w.kg) }));
    return `<section class="card"><h2>Weight</h2>
      <div class="stats4"><div><b>${cur ? dispW(cur) : '–'}</b><small>${u} now</small></div><div><b>${ideal || '–'}</b><small>ideal</small></div>
        <div><b>${ws.length > 1 ? (dispW(cur) - dispW(ws[0].kg) > 0 ? '+' : '') + (Math.round((dispW(cur) - dispW(ws[0].kg)) * 10) / 10) : '–'}</b><small>since start</small></div>
        <div><b>${tr === null ? '–' : (tr > 0 ? '+' : '') + (Math.round(BODY.fromKg(tr, u) * 10) / 10)}</b><small>${u}/week</small></div></div>
      ${ws.length > 1 ? TRACK.chart(pts, { ideal }) : '<p class="muted small">Log your weight a few times and a trend chart appears here.</p>'}
      <div class="row gap"><input id="bwInput" class="search" type="number" inputmode="decimal" step="0.1" placeholder="Today’s weight (${u})" aria-label="Today’s weight"><button class="pill on" data-act="bw-log">Log</button></div>
      ${ws.length ? `<details class="entries"><summary>Entries (${ws.length})</summary>${ws.slice().reverse().slice(0, 14).map((w) => `<div class="citem"><div><b>${dispW(w.kg)} ${u}</b><small>${fmtDay(w.date)}</small></div><div class="acts"><button class="link danger" data-act="bw-del" data-t="${w.date}">Delete</button></div></div>`).join('')}</details>` : ''}
    </section>`;
  }

  const cmDisp = (cm) => (U() === 'kg' ? Math.round(cm * 10) / 10 : Math.round((cm / 2.54) * 10) / 10);
  const mUnit = () => (U() === 'kg' ? 'cm' : 'in');
  function measureCard() {
    const sum = TRACK.measureSummary(S().measures || []);
    return `<section class="card"><div class="row between"><h2>Measurements</h2><button class="pill on" data-act="ms-open">＋ Add</button></div>
      ${sum.length ? `<div class="mtable">${sum.map((m) => `<div class="mrow"><span>${m.label}</span><b>${cmDisp(m.last)} ${mUnit()}</b><em class="${m.change === null ? '' : m.change <= 0 ? 'dn' : 'up'}">${m.change === null ? '' : (m.change > 0 ? '+' : '') + cmDisp(m.change) + ' ' + mUnit()}</em></div>`).join('')}</div>
      <p class="muted small">Change since your first entry.</p>` : '<p class="muted small">Track waist, chest, arms and more. Tape measurements show progress the scale can’t.</p>'}
    </section>`;
  }
  function sheetMeasure() {
    const last = (S().measures || []).slice(-1)[0], u = mUnit();
    openSheet('Add measurements', `<p class="muted">Fill in what you measured today (${u}). Leave the rest blank.</p>
      <div class="grid2">${TRACK.MEASURES.map(([k, label]) => `<div class="field"><label for="ms-${k}">${label}</label><input id="ms-${k}" type="number" inputmode="decimal" step="0.1" placeholder="${last && last.vals[k] ? cmDisp(last.vals[k]) : ''}"></div>`).join('')}</div>
      <div class="row gap"><button class="pill on" data-act="ms-save">Save</button><button class="pill" data-act="close-sheet">Cancel</button></div>`);
  }

  function photoCard() {
    const ph = ui.photos;
    if (ph === null) { loadPhotos(); }
    const list = ph || [];
    const cmp = list.length >= 2 ? `<div class="compare"><figure><img src="${list[0].url}" alt="First photo"><figcaption>Then · ${fmtDay(list[0].date)}</figcaption></figure><figure><img src="${list[list.length - 1].url}" alt="Latest photo"><figcaption>Now · ${fmtDay(list[list.length - 1].date)}</figcaption></figure></div>` : '';
    return `<section class="card"><div class="row between"><h2>Progress photos</h2><button class="pill on" data-act="ph-add">＋ Add</button></div>
      <input type="file" id="photoFile" accept="image/*" hidden>
      ${cmp}
      ${list.length ? `<div class="pgrid">${list.slice().reverse().map((p) => `<button class="ph" data-act="ph-view" data-id="${p.id}" aria-label="Photo from ${fmtDay(p.date)}"><img src="${p.url}" alt=""><small>${fmtDay(p.date)}</small></button>`).join('')}</div>` : '<p class="muted small">Take a photo every few weeks, in the same light and pose.</p>'}
      <p class="muted small">Photos are stored only on this device — they aren’t uploaded and aren’t included in backups.</p></section>`;
  }
  const bodyView = () => histSwitch() + weightCard() + measureCard() + photoCard();

  /* ───────── events ───────── */
  function act(a, t) {
    const st = S();
    switch (a) {
      case 'hist-mode': ui.histMode = t.dataset.v; ctx.render(); return true;
      case 'nt-water': TRACK.addIntake(st, today(), 'water', +t.dataset.ml); ctx.save(); ctx.render(); return true;
      case 'nt-protein': TRACK.addIntake(st, today(), 'protein', +t.dataset.g); ctx.save(); ctx.render(); return true;
      case 'bw-log': {
        const v = num(document.getElementById('bwInput').value);
        if (v < 20 || v > 700) { toast('Enter your weight'); return true; }
        TRACK.addWeight(st, BODY.kgOf(v, U())); st.settings.weight = v; ctx.save(); ctx.render(); toast('Weight logged'); return true;
      }
      case 'bw-del': st.weights = (st.weights || []).filter((w) => String(w.date) !== t.dataset.t); ctx.save(); ctx.render(); return true;
      case 'ms-open': sheetMeasure(); return true;
      case 'ms-save': {
        const vals = {}; TRACK.MEASURES.forEach(([k]) => { const v = num(document.getElementById('ms-' + k).value); vals[k] = U() === 'kg' ? v : v * 2.54; });
        if (!TRACK.addMeasure(st, vals)) { toast('Enter at least one measurement'); return true; }
        ctx.save(); closeSheet(); ctx.render(); toast('Measurements saved'); return true;
      }
      case 'ph-add': { const f = document.getElementById('photoFile'); if (f) f.click(); return true; }
      case 'ph-view': {
        const p = (ui.photos || []).find((x) => x.id === t.dataset.id); if (!p) return true;
        openSheet(fmtDay(p.date), `<img class="phbig" src="${p.url}" alt="Progress photo"><div class="row gap"><button class="pill ghost danger" data-act="ph-del" data-id="${p.id}">Delete photo</button><button class="pill" data-act="close-sheet">Close</button></div>`); return true;
      }
      case 'ph-del': if (confirm('Delete this photo?')) { DB.del(t.dataset.id).then(() => { closeSheet(); loadPhotos(); }); } return true;
      default: return false;
    }
  }
  function change(t) { if (t.id === 'photoFile' && t.files[0]) { addPhoto(t.files[0]); t.value = ''; return true; } return false; }

  return { nutritionCard, bodyView, histSwitch, act, change };
};
