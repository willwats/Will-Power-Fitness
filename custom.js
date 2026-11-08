/* Will Power Fitness — custom (user-made) exercises: creation, loading into the library, and forgiving name search (pure logic). */
const CUSTOM = (() => {
  const BODYWEIGHT_GEAR = ['bench', 'box', 'pullup_bar', 'dip_bars', 'suspension', 'squat_rack', 'stability_ball', 'ab_wheel'];
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const tokens = (q) => String(q || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  // Words people use that mean the same thing as the library's wording.
  const SYN = { up: ['raise'], ups: ['raise'], lift: ['raise'], tuck: ['raise'], extension: ['extend'], pushup: ['push-up'], pullup: ['pull-up'], situp: ['sit-up'], crunches: ['crunch'], abs: ['crunch', 'plank'] };
  const forms = (t) => {
    const base = t.replace(/(es|s)$/, '');
    return [t, base].concat(SYN[t] || [], SYN[base] || []).filter((x) => x.length > 1);
  };
  const hit = (name, t) => forms(t).some((f) => name.includes(f));

  /** Every word you type must appear in the name (plurals and common synonyms allowed). */
  function matches(name, q) {
    const toks = tokens(q); if (!toks.length) return true;
    const n = String(name).toLowerCase();
    return toks.every((t) => hit(n, t));
  }
  /** Existing exercises that look like the name being typed (to avoid duplicates). */
  function similar(name, list, limit = 3) {
    const toks = tokens(name); if (toks.length < 2 && (toks[0] || '').length < 4) return [];
    return list.map((e) => { const n = e.name.toLowerCase(); const h = toks.filter((t) => hit(n, t)).length; return { e, s: h / toks.length, h }; })
      .filter((x) => x.h >= 1 && x.s >= 0.6).sort((a, b) => b.s - a.s || a.e.name.length - b.e.name.length).slice(0, limit).map((x) => x.e);
  }
  /** Which built-in exercise's animation to borrow: best word overlap in the same muscle, else the first of that muscle. */
  function guessLike(name, muscle, list) {
    const pool = list.filter((e) => !e.custom && e.muscle === muscle); if (!pool.length) return '';
    const toks = tokens(name);
    let best = null, bs = 0;
    for (const e of pool) { const n = e.name.toLowerCase(); const s = toks.filter((t) => hit(n, t)).length; if (s > bs) { bs = s; best = e; } }
    return (best || pool[0]).name;
  }

  const loadedFor = (equip) => equip.some((req) => req.split('|').every((x) => !BODYWEIGHT_GEAR.includes(x)));

  /** Validate a form draft and build the exercise (or { error }). existing = all exercises, ownId = id being edited. */
  function make(d, existing, ownId) {
    const name = String(d.name || '').trim().replace(/\s+/g, ' ');
    if (name.length < 2) return { error: 'Give the exercise a name' };
    if (name.length > 40) return { error: 'Keep the name under 40 characters' };
    if (!d.muscle) return { error: 'Pick the main muscle' };
    const dup = existing.find((e) => e.id !== ownId && e.name.toLowerCase() === name.toLowerCase());
    if (dup) return { error: `“${dup.name}” already exists` };
    const equip = (d.equip || []).slice();
    const secondary = (d.secondary || []).filter((m) => m !== d.muscle);
    let id = ownId;
    if (!id) { id = 'c-' + slug(name); let k = 2; const base = id; while (existing.some((e) => e.id === id)) id = base + '-' + k++; }
    const ex = {
      id, name, muscle: d.muscle, equip, level: +d.level || 2, cue: String(d.cue || '').trim() || 'Your own exercise — use a controlled tempo and full range of motion.',
      secondary, compound: secondary.length > 0, timed: !!d.timed,
      loaded: typeof d.loaded === 'boolean' ? d.loaded : loadedFor(equip), custom: true,
      animLike: d.like && d.like !== 'auto' ? d.like : guessLike(name, d.muscle, existing),
      regions: (d.regions || []).slice(),
    };
    if (!ex.regions.length && d.muscle === 'core') ex.regions = ['middle'];
    return { ex };
  }

  /** Replace the custom exercises inside the live library with the saved list. */
  function sync(saved, EXERCISES, EX_BY_ID) {
    for (let i = EXERCISES.length - 1; i >= 0; i--) if (EXERCISES[i].custom) { delete EX_BY_ID[EXERCISES[i].id]; EXERCISES.splice(i, 1); }
    (saved || []).forEach((c) => { if (!EX_BY_ID[c.id]) { EXERCISES.push(c); EX_BY_ID[c.id] = c; } });
  }

  return { matches, similar, guessLike, make, sync, loadedFor, tokens };
})();

if (typeof module !== 'undefined') module.exports = CUSTOM;
