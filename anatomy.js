/* Will Power Fitness — anatomical front/back muscle map for the recovery view.
   Each figure is 100 units wide (centre line x = 50). Paths describe the figure's left half
   and are mirrored for the right. Minor muscles are grouped into the app's 11 muscle groups. */
const ANATOMY = (() => {
  const silhouette = 'M50 2 Q40 2 40.5 13 Q41 21 44 25 L44 29 Q36 30.5 28 33 Q19 35.5 17.5 46 Q16.5 56 16.5 66 Q15.5 76 14.5 86 Q11.5 98 11.5 110 Q11.5 118 13.5 126 Q16.5 129 19.5 124 Q19.5 116 21 111 Q24 100 26 90 Q28 80 29.5 70 L31 63 Q31 78 32 92 Q29.5 101 29.5 111 Q27 125 28 140 Q29 155 32 166 Q30 180 32 196 Q33 204 33 210 Q37 215 43.5 213 Q44.5 206 42 199 Q44.5 184 43.5 168 Q46.5 150 47.5 132 L49.5 117 L50 117 Z';
  const front = [
    ['back', ['M44.5 26 Q38 30.5 29.5 33.5 L43 33.5 Q45.5 30.5 46 27 Z']],                                     // upper trapezius
    ['chest', ['M31 36.5 Q40 34 49 36 L49 54.5 Q42 57.5 35 54.5 Q29.5 51.5 27.5 47.5 Q28.5 41 31 36.5 Z']],      // pectoralis major
    ['shoulders', ['M29.5 34.5 Q21.5 35.5 19.5 44 Q18.5 52 21.5 58 Q25.5 50.5 30.5 46.5 Q32.5 40 29.5 34.5 Z']], // deltoid
    ['biceps', ['M21 59.5 Q18 66.5 18 75 Q18.5 80 21.5 81.5 Q26 76 27 68 Q27.5 61 25 56.5 Z']],
    ['forearms', ['M17.5 83.5 Q14 92 13 103 Q12.5 110 14.5 115 L18.5 115.5 Q21.5 105 23.5 95.5 Q25 88 23 82.5 Z']],
    ['core', ['M49 58.5 L41.5 58.5 Q40.5 70 40.5 82 Q41.5 92 44 100 L49 104 Z',                                // rectus abdominis
              'M39.5 57.5 Q34 58.5 32.5 64.5 Q32.5 76 34 88 Q37.5 96 42.5 100 Q39.5 90 39.5 80 Q39 68 39.5 57.5 Z']], // obliques
    ['quads', ['M33 104.5 Q28.5 115 28.5 132 Q29 148 33.5 158 L41.5 160 Q45.5 148 46.5 134 Q47 120 45.5 110 Q39.5 108 33 104.5 Z',
               'M46.5 110.5 Q49 113 49 119 Q48.5 130 46.5 141 Q47.5 125 46.5 110.5 Z']],                        // + adductors
    ['calves', ['M33.5 168.5 Q31.5 180 33 194 Q34.5 201 36.5 204 L40.5 204 Q42.5 192 42.5 180 Q42 172 40 167 Z']], // tibialis / calf
  ];
  const back = [
    ['back', ['M43.5 46 Q37 40 31 40.5 Q30 52 33 64 Q37 76 42 84.5 Q46 80 49 76 L49 64 Q47.5 54 43.5 46 Z',      // latissimus dorsi
              'M49 22 L44 26 Q36 31 29 34 Q38 38 43.5 45.5 Q47.5 53 49 61 Z',                                // trapezius
              'M49 65 L45.5 71 Q43.5 80 43.5 90 L49 93.5 Z']],                                               // erector spinae
    ['shoulders', ['M29.5 34.5 Q21.5 35.5 19.5 44 Q18.5 52 21.5 58 Q25.5 50.5 30.5 46.5 Q32.5 40 29.5 34.5 Z']], // rear deltoid
    ['triceps', ['M21 58.5 Q17.5 66.5 18 76 Q18.5 81 22.5 82 Q27 74 28 66 Q28.5 59 25.5 54.5 Z']],
    ['forearms', ['M17.5 83.5 Q14 92 13 103 Q12.5 110 14.5 115 L18.5 115.5 Q21.5 105 23.5 95.5 Q25 88 23 82.5 Z']],
    ['glutes', ['M49 96 Q40 93.5 33 99.5 Q29.5 108 31.5 116 Q38 122.5 46 120.5 Q49 118 49 112 Z']],
    ['hamstrings', ['M32 121.5 Q29 132 30 146 Q31.5 156 35 160.5 L41.5 160.5 Q45.5 150 47 138 Q48 128 47 122.5 Q40 125 32 121.5 Z']],
    ['calves', ['M33.5 167.5 Q29 176 30 186 Q31.5 194 35.5 197 L41 197 Q44.5 188 43.5 178 Q42.5 170 40.5 166 Z']],  // gastrocnemius
  ];
  const grooves = {
    front: 'M41.5 67.5 H49 M41 76.5 H49 M41.5 85.5 H49 M35 46 Q40 49 48 48'          // abs, pec fibres
      + ' M25.5 37.5 Q23.5 46 24 55'                                                  // front / side deltoid
      + ' M21.5 86 Q18.5 98 16.5 112'                                                 // brachioradialis
      + ' M38 108 Q38 130 40 151 M46 141 Q41.5 148 41.5 158'                          // rectus femoris, vastus medialis
      + ' M38.5 170 Q37 185 38 202',                                                  // tibialis
    back: 'M33.5 52 Q38 57 43 65 M32.5 43 Q37.5 45 41.5 51'                            // lat edge, scapula
      + ' M24 59.5 Q22 70 23.5 80'                                                    // triceps long head
      + ' M33.5 105 Q40.5 100.5 48.5 103.5'                                           // gluteus medius
      + ' M39.5 125 Q39.5 143 38.5 160'                                               // biceps femoris / semitendinosus
      + ' M37.5 170 Q37 182 38.5 196',                                                // gastrocnemius heads
  };
  const mirror = 'translate(100 0) scale(-1 1)';

  /** SVG markup for one figure; fillFor(muscle) gives the colour, pick is the selected muscle. */
  function figure(side, dx, fillFor, pick, nameOf, pctOf) {
    const both = (d, cls = '') => `<path ${cls} d="${d}"/><path ${cls} d="${d}" transform="${mirror}"/>`;
    return `<g transform="translate(${dx} 0)">
      <g class="rb-base">${both(silhouette)}<ellipse cx="50" cy="13" rx="9.5" ry="11.5"/></g>
      ${(side === 'front' ? front : back).map(([m, ds]) => `<g class="rm ${m === pick ? 'sel' : ''}" data-act="rec-pick" data-m="${m}" style="fill:${fillFor(m)}" role="button" tabindex="0" aria-label="${nameOf(m)} ${pctOf(m)}% recovered">${ds.map((d) => both(d)).join('')}</g>`).join('')}
      <g class="groove">${both(grooves[side])}</g>
      <text x="50" y="226" text-anchor="middle">${side === 'front' ? 'Front' : 'Back'}</text></g>`;
  }
  return { figure, VIEWBOX: '0 0 210 232' };
})();
