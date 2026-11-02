/* Will Power Fitness — weekly plan card (Train tab), planner sheet and calendar reminders. */
const WPP = (ctx) => {
  const { esc, ui, openSheet, closeSheet, toast } = ctx;
  const S = () => ctx.state();
  ui.pdraft = null;
  const MN = (m) => (typeof MUSCLE_NAME !== 'undefined' ? MUSCLE_NAME[m] : m);

  function trainCard() {
    const st = S(), plan = PLAN.getPlan(st), now = Date.now();
    const wk = PLAN.weekStatus(st, now), sug = PLAN.suggestToday(st, now);
    const strip = wk.map((d) => `<div class="wd ${d.today ? 'today' : ''} ${d.planned ? 'planned' : ''} ${d.strength ? 'lift' : ''} ${d.cardio ? 'cardio' : ''}" title="${d.key}">
      <small>${d.label}</small><i aria-hidden="true">${d.strength ? '✓' : d.cardio ? '♥' : d.planned ? '•' : ''}</i></div>`).join('');
    let body;
    if (!plan.set) {
      body = `<p class="muted">Pick your training days and get a suggested workout each day — plus calendar reminders.</p>
        <button class="pill on" data-act="pl-edit">Set up my week</button>`;
    } else if (sug.doneToday) {
      body = `<p>✓ <b>Done for today.</b> <span class="muted">Next up: ${esc(sug.label)} (${sug.muscles.map(MN).join(', ')})</span></p>`;
    } else {
      const sk = sug.skipped.length ? `<p class="muted small">Resting ${sug.skipped.map(MN).join(', ')} — trained in the last day or so.</p>` : '';
      body = `<p>${sug.planned ? 'Today' : 'Rest day — next up'}: <b>${esc(sug.label)}</b> <span class="muted">· ${sug.muscles.map(MN).join(', ')}</span></p>${sk}
        <div class="row gap wrap"><button class="pill on" data-act="pl-build">${sug.planned ? 'Build today’s workout' : 'Train anyway'}</button>
        ${sug.planned ? '' : '<button class="pill" data-act="cd-mode" data-v="cardio">A walk counts — Cardio</button>'}</div>`;
    }
    return `<section class="card plan">
      <div class="row between"><h2>This week</h2><button class="link" data-act="pl-edit">${plan.set ? 'Edit plan' : ''}</button></div>
      <div class="week" role="group" aria-label="This week">${strip}</div>
      ${body}</section>`;
  }

  function sheet() {
    const p = ui.pdraft, rs = PLAN.resolveSplit(p, (S().body || {}).focus);
    openSheet('Your week', `
      <p class="muted">Which days do you train? Recovery and your last workout decide what to train each day.</p>
      <div class="pills" id="plDays">${PLAN.DOW.map((d, i) => `<button class="pill ${p.days[i] ? 'on' : ''}" data-act="pl-day" data-i="${i}" aria-pressed="${!!p.days[i]}">${d}</button>`).join('')}</div>
      <h3>Split</h3>
      <div class="focus-list" id="plSplits">${Object.entries(PLAN.SPLITS).map(([id, s]) => `
        <button class="focus ${p.split === id ? 'on' : ''}" data-act="pl-split" data-v="${id}" aria-pressed="${p.split === id}"><b>${s.name}</b>${id === 'auto' ? ` <span class="badge" id="plAuto">${PLAN.SPLITS[rs].name}</span>` : ''}<small>${s.blurb}</small></button>`).join('')}</div>
      <h3>Reminders</h3>
      <div class="field"><label for="plTime">Workout time</label><input id="plTime" type="time" value="${esc(p.time)}"></div>
      <button class="pill" data-act="pl-ics">📅 Add weekly reminders to Calendar</button>
      <p class="muted small">Downloads a calendar file with a repeating event and a 15-minute alert on your training days. Open it and tap <b>Add All</b>. Web apps can’t send push alerts on iPhone reliably, so Calendar is the dependable option.</p>
      <div class="row gap wrap"><button class="pill on" data-act="pl-save">Save</button><button class="pill" data-act="close-sheet">Cancel</button></div>`);
  }
  const edit = () => { const p = PLAN.getPlan(S()); ui.pdraft = { days: p.days.slice(), split: p.split, time: p.time }; sheet(); };

  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function act(a, t) {
    const d = ui.pdraft;
    switch (a) {
      case 'pl-edit': edit(); return true;
      case 'pl-day': if (!d) return true; d.days[+t.dataset.i] = !d.days[+t.dataset.i]; t.classList.toggle('on', d.days[+t.dataset.i]); t.setAttribute('aria-pressed', d.days[+t.dataset.i]); refreshAuto(); return true;
      case 'pl-split': if (!d) return true; d.split = t.dataset.v; document.querySelectorAll('#plSplits .focus').forEach((n) => { const on = n.dataset.v === d.split; n.classList.toggle('on', on); n.setAttribute('aria-pressed', on); }); return true;
      case 'pl-save':
        if (!d) return true;
        if (!d.days.some(Boolean)) { toast('Pick at least one training day'); return true; }
        S().plan = { days: d.days, split: d.split, time: d.time || '18:00', set: true };
        ui.pdraft = null; ctx.save(); closeSheet(); ctx.render(); toast('Week saved'); return true;
      case 'pl-ics':
        if (!d) return true;
        if (!d.days.some(Boolean)) { toast('Pick at least one training day'); return true; }
        download('will-power-fitness-workouts.ics', PLAN.ics(d), 'text/calendar'); toast('Open the file and tap Add All'); return true;
      case 'pl-build': {
        const sug = PLAN.suggestToday(S());
        ctx.build(sug.muscles); return true;
      }
      default: return false;
    }
  }
  function refreshAuto() { const d = ui.pdraft, n = document.getElementById('plAuto'); if (d && n) n.textContent = PLAN.SPLITS[PLAN.resolveSplit(d, (S().body || {}).focus)].name; }
  function input(t) { if (t.id === 'plTime' && ui.pdraft) { ui.pdraft.time = t.value; return true; } return false; }

  return { trainCard, act, input };
};
