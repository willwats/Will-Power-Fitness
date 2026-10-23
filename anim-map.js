/* Maps every exercise to a movement template + the kind of weight it holds. */
(() => {
  // First matching rule wins, so specific names come before general ones.
  const RULES = [
    [/^Hamstring Walkout|^Stability Ball Leg Curl|^TRX Hamstring Curl/, 'bridge_curl'],
    [/^Lying Leg Curl/, 'leg_curl'],
    [/Single-Leg Romanian|Single-Leg RDL/, 'sl_rdl'],
    [/Romanian Deadlift/, 'rdl'],
    [/Good Morning/, 'good_morning'],
    [/Wrist Curl/, 'wrist_curl'],
    [/^TRX Biceps Curl/, 'inverted_row'],
    [/^Incline Dumbbell Curl/, 'curl_incline'],
    [/^Concentration Curl/, 'conc_curl'],
    [/^Spider Curl/, 'spider_curl'],
    [/Curl$/, 'curl'],
    [/^Reverse Pec Deck|^Rear Delt/, 'rear_fly'],
    [/^Pec Deck/, 'fly_seated'],
    [/^Incline Push-Up|^Incline Push/, 'pushup_incline'],
    [/^TRX Triceps/, 'pushup_incline'],
    [/^Decline Push-Up/, 'pushup_decline'],
    [/^Pike Push-Up|^Wall Handstand/, 'pike'],
    [/Push-Up$/, 'pushup'],
    [/Floor Press/, 'floor_press'],
    [/^Incline (Barbell|Dumbbell)/, 'bench_incline'],
    [/Bench Press$/, 'bench'],
    [/^(Dumbbell Fly|Floor Fly)/, 'fly_lying'],
    [/Pullover/, 'pullover'],
    [/^Machine Chest Press/, 'seated_press'],
    [/^(Cable Crossover|Band Chest Fly)/, 'fly_stand'],
    [/^Low-to-High/, 'fly_lowhigh'],
    [/^Band Chest Press|^Pallof/, 'press_stand'],
    [/^Bench Dip/, 'bench_dip'],
    [/Dip$/, 'dip'],
    [/^Dead Hang/, 'dead_hang'],
    [/^(Pull-Up|Chin-Up)/, 'pullup'],
    [/^(Inverted Row|TRX Row)/, 'inverted_row'],
    [/^(Barbell Bent-Over Row|Pendlay Row|Kettlebell Row)/, 'row_bent'],
    [/^One-Arm Dumbbell Row/, 'row_onearm'],
    [/^Chest-Supported/, 'row_chest_supported'],
    [/^Renegade/, 'renegade'],
    [/Lat Pulldown/, 'pulldown'],
    [/^Straight-Arm/, 'straightarm_pd'],
    [/^(Seated Cable Row|Band Row)/, 'row_seated'],
    [/Pull-Apart/, 'pullapart'],
    [/Shrug/, 'shrug'],
    [/^(Superman|Prone Y-T-W)/, 'superman'],
    [/Deadlift/, 'deadlift'],
    [/^Push Press/, 'push_press'],
    [/^(Seated Dumbbell Press|Arnold|Machine Shoulder Press)/, 'ohp_seated'],
    [/(Shoulder Press|Overhead Press|Kettlebell Press|Band Overhead Press)/, 'ohp'],
    [/Lateral Raise/, 'lat_raise'],
    [/Front Raise/, 'front_raise'],
    [/Face Pull/, 'face_pull'],
    [/Upright Row/, 'upright_row'],
    [/Halo/, 'halo'],
    [/^(Overhead Dumbbell Extension|Overhead Cable Extension)/, 'oh_ext'],
    [/Skull Crusher/, 'skull'],
    [/Pushdown/, 'pushdown'],
    [/Kickback/, (ex) => (ex.muscle === 'glutes' ? 'cable_kickback' : 'kickback')],
    [/Carry$/, 'carry'],
    [/^Side Plank|^Plank/, 'plank'],
    [/^Dead Bug/, 'dead_bug'],
    [/^Bird Dog/, 'bird_dog'],
    [/^Bicycle/, 'bicycle'],
    [/Crunch$/, (ex) => (/^Cable/.test(ex.name) ? 'cable_crunch' : 'crunch')],
    [/^Lying Leg Raise/, 'leg_raise_lying'],
    [/^Flutter/, 'flutter'],
    [/^V-Up/, 'v_up'],
    [/^Hollow/, 'hollow'],
    [/^Mountain/, 'mountain_climber'],
    [/Russian Twist/, 'russian_twist'],
    [/Sit-Up/, 'situp'],
    [/^Hanging Knee/, 'hang_knee'],
    [/^Hanging Leg/, 'hang_leg'],
    [/^(Ab Wheel|TRX Fallout)/, 'ab_wheel'],
    [/Woodchop/, 'woodchop'],
    [/Medicine Ball Slam/, 'ball_slam'],
    [/^Jump Squat/, 'jump_squat'],
    [/^Split Squat/, 'split_squat'],
    [/Bulgarian/, 'bulgarian'],
    [/Step-Up/, 'step_up'],
    [/Lunge$/, 'lunge_reverse'],
    [/^Wall Sit/, 'wall_sit'],
    [/^Pistol/, 'pistol'],
    [/^Barbell Front Squat/, 'squat_front'],
    [/^(Barbell Back Squat|Smith Machine Squat)/, 'squat_bb'],
    [/Squat$/, 'squat'],
    [/^Leg Press Calf|Calf Raise/, (ex) => (/^Seated/.test(ex.name) ? 'calf_seated' : 'calf_raise')],
    [/^Leg Press/, 'leg_press'],
    [/^Leg Extension/, 'leg_ext'],
    [/Glute Bridge|Frog Pump/, 'bridge'],
    [/Hip Thrust/, 'hip_thrust'],
    [/Donkey|Fire Hydrant/, 'donkey'],
    [/Lateral Walk/, 'lateral_walk'],
    [/Kettlebell Swing/, 'kb_swing'],
    [/Pull-Through/, 'pull_through'],
  ];

  function heldFor(ex) {
    const first = ex.equip.map((r) => r.split('|')[0]);
    const has = (...ids) => first.some((x) => ids.includes(x));
    if (has('barbell', 'ez_bar', 'smith')) return 'bb';
    if (has('dumbbell')) return 'db';
    if (has('kettlebell')) return 'kb';
    if (has('med_ball')) return 'ball';
    if (has('ab_wheel')) return 'wheel';
    if (has('bands', 'cable', 'suspension')) return 'rope';
    return null;
  }

  WPA.templateFor = (ex) => {
    for (const [re, t] of RULES) if (re.test(ex.name)) return typeof t === 'function' ? t(ex) : t;
    return null;
  };

  WPA.forExercise = (ex) => {
    const tpl = WPA.templateFor(ex) || 'squat';
    return { tpl, held: WPA.T[tpl] && WPA.T[tpl].held === false ? null : heldFor(ex) };
  };
})();
// inverted rows hang from a fixed bar, never a weight
if (typeof WPA !== 'undefined' && WPA.T.inverted_row) WPA.T.inverted_row.held = false;
