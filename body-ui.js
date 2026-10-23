/* Will Power Fitness — "Your profile" sheet: height, weight, ideal weight and training focus. */
const WPB = (ctx) => {
  const { esc, num, ui, openSheet, closeSheet, toast } = ctx;
  const S = () => ctx.state();
  const U = () => S().settings.units;
  ui.bdraft = null;

  const isSet = () => !!(S().body && S().body.set);
  const fmtH = (cm) => { if (!cm) return '–'; if (U() === 'kg') return `${cm} cm`; const x = BODY.ftIn(cm); return `${x.ft}′${x.inch}″`; };
  const fmtW = (v) => (v ? `${Math.round(v * 10) / 10} ${U()}` : '–');
  const draftCm = (d) => (U() === 'kg' ? Math.round(d.cm || 0) : BODY.cmFrom(d.ft, d.inch));

  function summary(d) {
    const p = BODY.plan({ heightCm: draftCm(d), ideal: d.ideal, focus: d.focus }, d.w, U());
    const out = [];
    if (p.bmi) out.push(`<p><b>BMI ${p.bmi.toFixed(1)}</b>${p.idealBmi ? ` now · ${p.idealBmi.toFixed(1)} at your ideal weight` : ''}<br><span class="muted small">BMI can’t tell muscle from fat, so treat it as a rough guide.</span></p>`);
    if (p.suggest && !d.focus) out.push(`<p>Based on your numbers, <b>${BODY.FOCUS_BY_ID[p.suggest].name}</b> looks like a good fit.</p>`);
    if (p.diff >= 0.5) {
      const verb = p.diffKg < 0 ? 'to lose' : 'to gain';
      out.push(`<p><b>${p.diff.toFixed(1)} ${U()}</b> ${verb}${p.weeks ? ` — about <b>${p.weeks} weeks</b> at a steady ${p.focus.kcal > 0 ? 'bulk' : 'cut'}` : ''}.</p>`);
    }
    p.notes.forEach((n) => out.push(`<p class="attn-note">${esc(n)}</p>`));
    return out.join('') || '<p class="muted small">Enter your height and weights to see how far you are from your goal.</p>';
  }
  const refresh = () => { const n = document.getElementById('bdSummary'); if (n && ui.bdraft) n.innerHTML = summary(ui.bdraft); };

  function openDraft() {
    const st = S(), b = st.body || {}, cm = b.heightCm || 0, ft = BODY.ftIn(cm);
    ui.bdraft = { cm, ft: cm ? ft.ft : '', inch: cm ? ft.inch : '', w: st.settings.weight || 0, ideal: b.ideal || 0, focus: b.focus || '' };
    const d = ui.bdraft, kg = U() === 'kg';
    openSheet('Your profile', `
      <p class="muted">Used to estimate calories and to point your training at a goal. It stays on this device.</p>
      ${kg
        ? `<div class="field"><label for="bdCm">Height (cm)</label><input id="bdCm" type="number" inputmode="decimal" value="${d.cm || ''}" placeholder="178"></div>`
        : `<div class="field"><label>Height</label><div class="grid2"><input id="bdFt" type="number" inputmode="numeric" min="3" max="8" value="${d.ft}" placeholder="ft" aria-label="Feet"><input id="bdIn" type="number" inputmode="numeric" min="0" max="11" value="${d.inch}" placeholder="in" aria-label="Inches"></div></div>`}
      <div class="grid2">
        <div class="field"><label for="bdW">Current weight (${U()})</label><input id="bdW" type="number" inputmode="decimal" value="${d.w || ''}"></div>
        <div class="field"><label for="bdIdeal">Ideal weight (${U()})</label><input id="bdIdeal" type="number" inputmode="decimal" value="${d.ideal || ''}"></div>
      </div>
      <h3>What do you want to work toward?</h3>
      <div class="focus-list">${BODY.FOCUS.map((f) => `
        <button class="focus ${d.focus === f.id ? 'on' : ''}" data-act="bd-focus" data-v="${f.id}" aria-pressed="${d.focus === f.id}">
          <b>${f.name}</b><span class="badge">${f.tag}</span>
          <small>${f.blurb}</small>
          <ul>${f.tips.map((t) => `<li>${t}</li>`).join('')}</ul>
        </button>`).join('')}</div>
      <div id="bdSummary" class="card summary">${summary(d)}</div>
      <div class="row gap wrap"><button class="pill on" data-act="bd-save">Save</button><button class="pill" data-act="close-sheet">Cancel</button></div>`);
  }

  function save() {
    const d = ui.bdraft; if (!d) return;
    const st = S(), cm = draftCm(d), prev = (st.body || {}).focus;
    st.body = { heightCm: cm > 0 ? cm : 0, ideal: d.ideal > 0 ? d.ideal : 0, focus: d.focus, set: true };
    if (d.w > 0) st.settings.weight = d.w;
    const f = BODY.FOCUS_BY_ID[d.focus];
    if (f && f.id !== prev) st.settings.goal = f.goal;
    ui.bdraft = null;
    ctx.save(); closeSheet(); ctx.render(); toast(f ? `Focus: ${f.name}` : 'Profile saved');
  }

  function profileCard() {
    const st = S(), b = st.body || {};
    if (!isSet()) {
      return `<section class="card"><h2>You</h2><p class="muted">Add your height, weight and goal weight, then pick what you’re training for — building muscle, getting lean, getting stronger and more.</p>
        <button class="pill on" data-act="bd-edit">Set up your profile</button></section>`;
    }
    const p = BODY.plan(b, st.settings.weight, U()), f = p.focus;
    return `<section class="card">
      <div class="row between"><h2>You</h2><button class="pill" data-act="bd-edit">Edit</button></div>
      <div class="stats4">
        <div><b>${fmtH(b.heightCm)}</b><small>height</small></div>
        <div><b>${fmtW(st.settings.weight)}</b><small>now</small></div>
        <div><b>${fmtW(b.ideal)}</b><small>ideal</small></div>
        <div><b>${p.bmi ? p.bmi.toFixed(1) : '–'}</b><small>BMI</small></div>
      </div>
      <p>${f ? `Focus: <b>${f.name}</b> <span class="badge">${f.tag}</span>` : '<span class="muted">No training focus picked yet.</span>'}</p>
      ${p.diff >= 0.5 ? `<p class="muted small">${p.diff.toFixed(1)} ${U()} ${p.diffKg < 0 ? 'to lose' : 'to gain'}${p.weeks ? ` · about ${p.weeks} weeks` : ''}</p>` : ''}
    </section>`;
  }

  function trainBanner() {
    if (!isSet()) {
      return `<button class="card focusbar prompt" data-act="bd-edit"><span><b>Set up your profile</b><small>Height, weight and what you’re training for</small></span><span class="pill on">Start</span></button>`;
    }
    const f = BODY.FOCUS_BY_ID[S().body.focus];
    return `<div class="focusbar"><span>Focus: <b>${f ? f.name : 'not set'}</b></span><button class="link" data-act="bd-edit">${f ? 'Change' : 'Pick one'}</button></div>`;
  }

  function act(a, t) {
    switch (a) {
      case 'bd-edit': openDraft(); return true;
      case 'bd-focus': {
        const d = ui.bdraft; if (!d) return true;
        d.focus = d.focus === t.dataset.v ? '' : t.dataset.v;
        document.querySelectorAll('.focus').forEach((n) => { const on = n.dataset.v === d.focus; n.classList.toggle('on', on); n.setAttribute('aria-pressed', on); });
        refresh(); return true;
      }
      case 'bd-save': save(); return true;
      default: return false;
    }
  }
  function input(t) {
    const d = ui.bdraft;
    if (!d || !t.id || t.id.slice(0, 2) !== 'bd') return false;
    const map = { bdFt: 'ft', bdIn: 'inch', bdCm: 'cm', bdW: 'w', bdIdeal: 'ideal' };
    if (map[t.id]) { d[map[t.id]] = num(t.value); refresh(); }
    return true;
  }

  return { profileCard, trainBanner, act, input, isSet };
};
