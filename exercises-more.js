/* Will Power Fitness — extra exercise variations (names drawn from the public StrengthLog exercise directory; cues written for this app).
   Each entry: [name, muscle, equipment, level, cue, secondary muscles, built-in exercise whose animation it borrows, options]. */
(() => {
  const MORE = [
    // ── chest ──
    ['Decline Bench Press', 'chest', ['barbell', 'bench'], 2, 'Bench set to a slight decline; lower to the lower chest and press up.', ['triceps', 'shoulders'], 'Barbell Bench Press'],
    ['Dumbbell Decline Chest Press', 'chest', ['dumbbell', 'bench'], 2, 'Slight decline, dumbbells over the lower chest; press and squeeze.', ['triceps', 'shoulders'], 'Dumbbell Bench Press'],
    ['Feet-Up Bench Press', 'chest', ['barbell', 'bench'], 2, 'Lift your feet onto the bench to flatten your back and keep the work on the chest.', ['triceps', 'shoulders'], 'Barbell Bench Press'],
    ['Smith Machine Incline Bench Press', 'chest', ['smith', 'bench'], 1, 'Bench at ~30°; lower to the upper chest and press straight up.', ['shoulders', 'triceps'], 'Incline Barbell Press'],
    ['Cable Chest Press', 'chest', ['cable'], 1, 'Split stance, press the handles forward and squeeze your chest at the front.', ['triceps', 'shoulders'], 'Band Chest Press'],
    ['Seated Cable Chest Fly', 'chest', ['cable', 'bench'], 1, 'Sit tall, arms slightly bent, bring the handles together in a wide hugging arc.', [], 'Cable Crossover'],
    ['Kettlebell Floor Press', 'chest', ['kettlebell'], 1, 'Lie on the floor, press the kettlebell up with your wrist stacked over your elbow.', ['triceps', 'shoulders'], 'Dumbbell Floor Press'],
    ['Kneeling Push-Up', 'chest', [], 1, 'Knees on the floor, body straight from knees to head; lower your chest to the floor.', ['triceps', 'shoulders'], 'Push-Up'],
    ['Clap Push-Up', 'chest', [], 3, 'Push off the floor hard, clap, and land with soft elbows.', ['triceps', 'shoulders'], 'Push-Up'],
    // ── shoulders ──
    ['Seated Barbell Overhead Press', 'shoulders', ['barbell', 'bench'], 2, 'Sit upright with back support; press the bar straight overhead.', ['triceps'], 'Barbell Overhead Press'],
    ['Z Press', 'shoulders', ['barbell'], 3, 'Sit on the floor with legs straight and press without leaning back — core stays tight.', ['triceps', 'core'], 'Barbell Overhead Press'],
    ['Landmine Press', 'shoulders', ['barbell'], 2, 'Hold the bar end at your shoulder and press up and forward, staying tall.', ['triceps', 'chest'], 'Dumbbell Shoulder Press'],
    ['One-Arm Landmine Press', 'shoulders', ['barbell'], 2, 'One hand on the bar end; press up and slightly forward without leaning.', ['triceps', 'core'], 'Dumbbell Shoulder Press'],
    ['Cuban Press', 'shoulders', ['dumbbell'], 2, 'Light weights: pull up to chest height, rotate the forearms up, then press.', ['triceps'], 'Dumbbell Shoulder Press'],
    ['Kettlebell Push Press', 'shoulders', ['kettlebell'], 2, 'Dip your knees slightly, then drive the kettlebell overhead.', ['triceps', 'quads'], 'Kettlebell Press'],
    ['Seated Kettlebell Press', 'shoulders', ['kettlebell', 'bench'], 1, 'Sit tall and press the kettlebell overhead with your wrist stacked.', ['triceps'], 'Kettlebell Press'],
    ['Cable Front Raise', 'shoulders', ['cable'], 1, 'Raise the handle to shoulder height with straight arms; lower slowly.', [], 'Dumbbell Front Raise'],
    ['Barbell Front Raise', 'shoulders', ['barbell'], 1, 'Lift the bar to shoulder height with soft elbows; no swinging.', [], 'Dumbbell Front Raise'],
    ['Plate Front Raise', 'shoulders', ['barbell'], 1, 'Hold a plate at the sides; raise it in front to eye level.', [], 'Dumbbell Front Raise'],
    ['Reverse Dumbbell Fly on Incline Bench', 'shoulders', ['dumbbell', 'bench'], 1, 'Chest on an incline bench; lift the dumbbells out to the sides leading with elbows.', ['back'], 'Rear Delt Dumbbell Fly'],
    ['Dumbbell Rear Delt Row', 'shoulders', ['dumbbell'], 1, 'Hinge forward and row with elbows wide at shoulder height.', ['back'], 'Rear Delt Dumbbell Fly'],
    ['Reverse Cable Fly', 'shoulders', ['cable'], 1, 'Cross the cables and pull them apart in a wide arc to hit the rear delts.', ['back'], 'Reverse Pec Deck'],
    ['Cable Rear Delt Row', 'shoulders', ['cable'], 1, 'Pull the handle toward your shoulder with the elbow flared wide.', ['back'], 'Reverse Pec Deck'],
    ['Band External Shoulder Rotation', 'shoulders', ['bands'], 1, 'Elbow pinned at your side; rotate the forearm outward against the band.', [], 'Band Pull-Apart'],
    ['Band Internal Shoulder Rotation', 'shoulders', ['bands'], 1, 'Elbow pinned at your side; rotate the forearm inward against the band.', [], 'Band Pull-Apart'],
    ['Cable External Shoulder Rotation', 'shoulders', ['cable'], 1, 'Elbow tucked at your side; rotate outward slowly and return.', [], 'Band Pull-Apart'],
    // ── biceps ──
    ['Barbell Preacher Curl', 'biceps', ['barbell', 'bench'], 2, 'Upper arms on the pad; curl up and lower fully under control.', [], 'Barbell Curl'],
    ['Dumbbell Preacher Curl', 'biceps', ['dumbbell', 'bench'], 1, 'Arm over an incline pad; curl and lower slowly to a full stretch.', [], 'Concentration Curl'],
    ['Drag Curl', 'biceps', ['barbell'], 2, 'Slide the bar up your body, elbows going back instead of forward.', [], 'Barbell Curl'],
    ['Cable Curl With Rope', 'biceps', ['cable'], 1, 'Rope at the low pulley; curl with palms facing in and split the rope at the top.', [], 'Cable Curl'],
    ['Overhead Cable Curl', 'biceps', ['cable'], 2, 'Arms out to the sides at head height; curl the handles toward your ears.', [], 'Cable Curl'],
    ['Cable Crossover Bicep Curl', 'biceps', ['cable'], 2, 'Cables at shoulder height; curl the handles toward your head and squeeze.', [], 'Cable Curl'],
    ['Bayesian Curl', 'biceps', ['cable'], 2, 'Face away from the cable with your arm behind you; curl to stretch the biceps hard.', [], 'Cable Curl'],
    ['Kettlebell Curl', 'biceps', ['kettlebell'], 1, 'Hold the kettlebell by the handle or horns and curl with your elbow pinned.', [], 'Dumbbell Curl'],
    // ── triceps ──
    ['Barbell Standing Triceps Extension', 'triceps', ['barbell'], 2, 'Bar overhead; lower behind your head by bending only the elbows.', [], 'Overhead Dumbbell Extension'],
    ['Rope Triceps Pushdown', 'triceps', ['cable'], 1, 'Elbows pinned; push down and spread the rope at the bottom.', [], 'Triceps Pushdown'],
    ['Crossbody Cable Triceps Extension', 'triceps', ['cable'], 2, 'One arm, press the handle down and across your body.', [], 'Triceps Pushdown'],
    ['Tate Press', 'triceps', ['dumbbell', 'bench'], 2, 'Lie back, elbows in, lower the dumbbells to your chest and extend.', [], 'Dumbbell Skull Crusher'],
    ['Smith Machine Skull Crusher', 'triceps', ['smith', 'bench'], 2, 'Lower the bar to your forehead with fixed elbows, then extend.', [], 'EZ-Bar Skull Crusher'],
    // ── back ──
    ['Cable Wide Grip Seated Row', 'back', ['cable'], 1, 'Wide bar, pull to your upper abs with elbows flared; squeeze your shoulder blades.', ['biceps'], 'Seated Cable Row'],
    ['One-Arm Cable Row', 'back', ['cable'], 1, 'One handle, pull your elbow past your torso without twisting.', ['biceps'], 'Seated Cable Row'],
    ['Seated Machine Row', 'back', ['seated_row'], 1, 'Chest on the pad; pull the handles back and pause.', ['biceps'], 'Seated Cable Row'],
    ['Underhand Lat Pulldown', 'back', ['lat_pulldown'], 1, 'Palms toward you; pull the bar to your upper chest.', ['biceps'], 'Lat Pulldown'],
    ['Neutral-Grip Lat Pulldown', 'back', ['lat_pulldown'], 1, 'Palms facing in; drive elbows down to your sides.', ['biceps'], 'Close-Grip Lat Pulldown'],
    ['One-Arm Lat Pulldown', 'back', ['cable'], 1, 'Kneel or sit, pull one handle down by driving the elbow to your side.', ['biceps'], 'Lat Pulldown'],
    ['T-Bar Row', 'back', ['barbell'], 2, 'Hinge with a flat back and row the loaded bar to your chest.', ['biceps'], 'Barbell Bent-Over Row'],
    ['Kroc Row', 'back', ['dumbbell'], 3, 'Heavy one-arm row with controlled momentum, high reps.', ['biceps'], 'One-Arm Dumbbell Row'],
    ['Gorilla Row', 'back', ['kettlebell'], 2, 'Wide stance with two kettlebells on the floor; row one at a time.', ['biceps', 'core'], 'Kettlebell Row'],
    ['Seal Row', 'back', ['barbell', 'bench'], 2, 'Lie face-down on a raised bench and row the bar up to the bench.', ['biceps'], 'Chest-Supported Dumbbell Row'],
    ['Neutral-Grip Pull-Up', 'back', ['pullup_bar'], 2, 'Palms facing in; pull your chest toward the bar.', ['biceps'], 'Pull-Up'],
    ['Close-Grip Chin-Up', 'back', ['pullup_bar'], 2, 'Hands close, palms toward you; pull up and lower fully.', ['biceps'], 'Chin-Up'],
    ['Band-Assisted Pull-Up', 'back', ['bands', 'pullup_bar'], 1, 'Loop a band under your knees or foot for help; full range each rep.', ['biceps'], 'Pull-Up'],
    ['Scap Pull-Up', 'back', ['pullup_bar'], 1, 'Hang with straight arms and pull only your shoulder blades down.', [], 'Dead Hang'],
    ['Rack Pull', 'back', ['barbell', 'squat_rack'], 2, 'Bar starts just below the knees; stand tall squeezing your glutes.', ['glutes', 'hamstrings'], 'Deadlift'],
    ['Deficit Deadlift', 'back', ['barbell'], 3, 'Stand on a small plate to start lower; keep your back flat.', ['hamstrings', 'glutes'], 'Deadlift'],
    ['Pause Deadlift', 'back', ['barbell'], 3, 'Pause for a second just off the floor, then finish the lift.', ['hamstrings', 'glutes'], 'Deadlift'],
    ['Dumbbell Deadlift', 'back', ['dumbbell'], 1, 'Dumbbells at your sides; push your hips back, then stand tall.', ['hamstrings', 'glutes'], 'Dumbbell Romanian Deadlift'],
    ['Floor Back Extension', 'back', [], 1, 'Lie face-down and lift your chest gently, squeezing your lower back and glutes.', ['glutes'], 'Superman'],
    // ── quads ──
    ['Box Squat', 'quads', ['barbell', 'squat_rack', 'box'], 2, 'Sit back to a box, pause lightly, and drive up.', ['glutes', 'hamstrings'], 'Barbell Back Squat'],
    ['Pause Squat', 'quads', ['barbell', 'squat_rack'], 3, 'Pause for two seconds at the bottom, staying braced, then drive up.', ['glutes', 'hamstrings'], 'Barbell Back Squat'],
    ['Zercher Squat', 'quads', ['barbell', 'squat_rack'], 3, 'Bar in the crooks of your elbows; stay upright and squat deep.', ['glutes', 'core'], 'Barbell Front Squat'],
    ['Dumbbell Squat', 'quads', ['dumbbell'], 1, 'Dumbbells at your sides or on your shoulders; sit between your hips.', ['glutes'], 'Goblet Squat'],
    ['Dumbbell Sumo Squat', 'quads', ['dumbbell'], 1, 'Wide stance, toes out, hold one dumbbell and squat straight down.', ['glutes'], 'Goblet Squat'],
    ['Kettlebell Front Squat', 'quads', ['kettlebell'], 1, 'Hold the kettlebell(s) at your chest and squat tall.', ['glutes', 'core'], 'Goblet Squat'],
    ['Landmine Squat', 'quads', ['barbell'], 1, 'Hold the bar end at your chest; squat keeping your torso upright.', ['glutes'], 'Goblet Squat'],
    ['Smith Machine Front Squat', 'quads', ['smith'], 2, 'Feet slightly forward; squat deep with an upright chest.', ['glutes'], 'Smith Machine Squat'],
    ['Smith Machine Lunge', 'quads', ['smith'], 2, 'One foot back; lower your back knee toward the floor and drive up.', ['glutes'], 'Reverse Lunge'],
    ['Smith Machine Bulgarian Split Squat', 'quads', ['smith', 'bench'], 2, 'Back foot on a bench; lower straight down and drive through the front heel.', ['glutes'], 'Bulgarian Split Squat'],
    ['Barbell Lunge', 'quads', ['barbell', 'squat_rack'], 2, 'Bar on your back; step and lower with an upright torso.', ['glutes', 'hamstrings'], 'Reverse Lunge'],
    ['Barbell Walking Lunge', 'quads', ['barbell'], 2, 'Bar on your back; take long steps and lower your back knee.', ['glutes', 'hamstrings'], 'Walking Lunge'],
    ['Dumbbell Walking Lunge', 'quads', ['dumbbell'], 1, 'Dumbbells at your sides; long steps, back knee just above the floor.', ['glutes', 'hamstrings'], 'Walking Lunge'],
    ['Reverse Dumbbell Lunge', 'quads', ['dumbbell'], 1, 'Step back into a lunge and push through the front foot to return.', ['glutes'], 'Reverse Lunge'],
    ['Side Lunge', 'quads', [], 1, 'Step wide, sit back on one leg with the other straight, push back to center.', ['glutes'], 'Curtsy Lunge'],
    ['Box Jump', 'quads', ['box'], 2, 'Swing your arms, jump onto the box, land softly with bent knees, and step down.', ['glutes', 'calves'], 'Jump Squat'],
    ['One-Legged Leg Extension', 'quads', ['leg_extension'], 1, 'One leg at a time; extend fully and lower slowly.', [], 'Leg Extension'],
    // ── hamstrings ──
    ['Seated Leg Curl', 'hamstrings', ['leg_curl'], 1, 'Pad above your heels; curl down and return slowly.', [], 'Lying Leg Curl'],
    ['One-Legged Lying Leg Curl', 'hamstrings', ['leg_curl'], 1, 'Curl one leg at a time, no hip lift.', [], 'Lying Leg Curl'],
    ['Stiff-Legged Deadlift', 'hamstrings', ['barbell'], 2, 'Nearly straight legs; hinge until you feel a deep hamstring stretch.', ['glutes', 'back'], 'Romanian Deadlift'],
    ['Smith Machine Romanian Deadlift', 'hamstrings', ['smith'], 1, 'Slide the bar down your legs, hips back, flat back.', ['glutes', 'back'], 'Romanian Deadlift'],
    ['Kettlebell Single-Leg Deadlift', 'hamstrings', ['kettlebell'], 2, 'Balance on one leg and hinge, reaching the kettlebell toward the floor.', ['glutes', 'core'], 'Single-Leg Romanian Deadlift'],
    // ── glutes ──
    ['Smith Machine Hip Thrust', 'glutes', ['smith', 'bench'], 2, 'Upper back on a bench, drive your hips up and squeeze at the top.', ['hamstrings'], 'Barbell Hip Thrust'],
    ['Single-Leg Hip Thrust', 'glutes', ['bench'], 2, 'One foot planted, other leg lifted; drive your hips up level.', ['hamstrings'], 'Bodyweight Hip Thrust'],
    ['Hip Thrust With Band Around Knees', 'glutes', ['barbell', 'bench', 'bands'], 2, 'Push your knees out into the band as you thrust.', ['hamstrings'], 'Barbell Hip Thrust'],
    ['Dumbbell Frog Pump', 'glutes', ['dumbbell'], 1, 'Soles together, knees out; hold a dumbbell on your hips and thrust up.', [], 'Frog Pump'],
    ['Banded Side Kick', 'glutes', ['bands'], 1, 'Band around your legs; kick one leg out to the side with control.', [], 'Banded Lateral Walk'],
    ['Hip Abduction Against Band', 'glutes', ['bands'], 1, 'Push your leg out against the band and return slowly.', [], 'Banded Lateral Walk'],
    ['Clamshell', 'glutes', [], 1, 'Lie on your side, knees bent; open the top knee without rolling your hips.', [], 'Fire Hydrant'],
    ['Cable Hip Abduction', 'glutes', ['cable'], 1, 'Ankle strap on; lift the leg out to the side and lower with control.', [], 'Cable Kickback'],
    // ── calves ──
    ['Donkey Calf Raise', 'calves', ['bench'], 2, 'Hinge forward with hands on a bench; rise onto your toes and lower fully.', [], 'Standing Calf Raise'],
    ['Barbell Seated Calf Raise', 'calves', ['barbell', 'bench'], 1, 'Pad the bar on your knees and raise your heels.', [], 'Seated Calf Raise'],
    ['Eccentric Heel Drop', 'calves', ['box'], 1, 'Rise on both feet, then lower slowly on one foot off the step edge.', [], 'Step Calf Raise'],
    // ── core ──
    ['Sit-Up', 'core', [], 1, 'Feet anchored or flat; curl your torso up, then lower under control.', [], 'Crunch', { regions: ['upper', 'middle'] }],
    ['Oblique Crunch', 'core', [], 1, 'Lie on your side or rotate as you crunch toward your hip.', [], 'Bicycle Crunch', { regions: ['obliques'] }],
    ['Hanging Windshield Wiper', 'core', ['pullup_bar'], 3, 'Hang, lift your legs, and sweep them side to side with control.', [], 'Hanging Leg Raise', { regions: ['obliques', 'lower'] }],
    ['Plank With Shoulder Taps', 'core', [], 2, 'In a plank, tap each shoulder alternately without rocking your hips.', ['shoulders'], 'Plank', { timed: true, regions: ['middle', 'deep'] }],
    ['Plank With Leg Lifts', 'core', [], 2, 'Hold a plank and lift one leg at a time, hips level.', ['glutes'], 'Plank', { timed: true, regions: ['middle', 'deep'] }],
    ['Kneeling Plank', 'core', [], 1, 'Forearms and knees on the floor, body in a straight line from knees to head.', [], 'Plank', { timed: true, regions: ['middle', 'deep'] }],
    ['Kneeling Side Plank', 'core', [], 1, 'On your side with knees bent; lift your hips and hold.', [], 'Side Plank', { timed: true, regions: ['obliques', 'deep'] }],
    ['Copenhagen Plank', 'core', ['bench'], 3, 'Top leg on a bench, lift your body into a side plank and hold.', [], 'Side Plank', { timed: true, regions: ['obliques', 'deep'] }],
    ['Landmine Rotation', 'core', ['barbell'], 2, 'Hold the bar end and rotate it from side to side, pivoting through your feet.', ['shoulders'], 'Cable Woodchop', { regions: ['obliques'] }],
    ['Dead Bug With Dumbbells', 'core', ['dumbbell'], 2, 'Hold light dumbbells over your chest; lower opposite arm and leg while your back stays flat.', [], 'Dead Bug', { regions: ['lower', 'deep'] }],
    // ── forearms ──
    ['Dumbbell Wrist Curl', 'forearms', ['dumbbell'], 1, 'Forearms on your thighs, palms up; curl your wrists up and lower fully.', [], 'Wrist Curl'],
    ['Barbell Wrist Curl', 'forearms', ['barbell'], 1, 'Forearms on a bench, palms up; curl the bar with only your wrists.', [], 'Wrist Curl'],
    ['Dumbbell Wrist Extension', 'forearms', ['dumbbell'], 1, 'Palms down; lift your wrists up slowly and lower.', [], 'Reverse Wrist Curl'],
    ['Barbell Wrist Extension', 'forearms', ['barbell'], 1, 'Palms down on a bench; lift the bar with your wrists.', [], 'Reverse Wrist Curl'],
    ['Reverse Dumbbell Curl', 'forearms', ['dumbbell'], 1, 'Palms down; curl with your elbows pinned to your sides.', ['biceps'], 'Reverse Curl'],
    ['One-Handed Bar Hang', 'forearms', ['pullup_bar'], 2, 'Hang from one hand for time; keep your shoulder active.', [], 'Dead Hang', { timed: true }],
  ];

  const names = new Set(EXERCISES.map((e) => e.name.toLowerCase()));
  MORE.forEach(([name, muscle, equip, level, cue, secondary, like, opts = {}]) => {
    if (names.has(name.toLowerCase())) return;
    const e = E(name, muscle, equip, level, cue, secondary);
    e.animLike = like;
    if (opts.timed) e.timed = true;
    if (opts.regions) CORE_REGIONS[name] = opts.regions;
    e.regions = regionsFor(e);
    EXERCISES.push(e); EX_BY_ID[e.id] = e;
  });
  if (typeof module !== 'undefined') module.exports = { MORE };
})();
