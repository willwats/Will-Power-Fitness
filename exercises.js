/* Will Power Fitness — exercise library
 *
 * Each exercise: E(name, primaryMuscle, requiredEquipment[], level 1-3, cue, secondaryMuscles[])
 *  - Equipment entries are ANDed. Use "a|b" inside one entry to mean "a OR b".
 *  - An empty equipment list means bodyweight only (always available).
 *  - Exercises with secondary muscles are treated as compound lifts.
 */

const MUSCLES = [
  { id: 'chest', name: 'Chest' },
  { id: 'back', name: 'Back' },
  { id: 'shoulders', name: 'Shoulders' },
  { id: 'biceps', name: 'Biceps' },
  { id: 'triceps', name: 'Triceps' },
  { id: 'forearms', name: 'Forearms' },
  { id: 'core', name: 'Core' },
  { id: 'quads', name: 'Quads' },
  { id: 'hamstrings', name: 'Hamstrings' },
  { id: 'glutes', name: 'Glutes' },
  { id: 'calves', name: 'Calves' },
];

const EQUIPMENT_GROUPS = [
  { name: 'Free weights', items: [
    { id: 'dumbbell', name: 'Dumbbells' },
    { id: 'barbell', name: 'Barbell & plates' },
    { id: 'ez_bar', name: 'EZ-curl bar' },
    { id: 'kettlebell', name: 'Kettlebell' },
  ]},
  { name: 'Racks, benches & bars', items: [
    { id: 'bench', name: 'Bench (flat / incline)' },
    { id: 'squat_rack', name: 'Squat / power rack' },
    { id: 'smith', name: 'Smith machine' },
    { id: 'pullup_bar', name: 'Pull-up bar' },
    { id: 'dip_bars', name: 'Dip bars' },
    { id: 'box', name: 'Plyo box / step' },
  ]},
  { name: 'Machines & cables', items: [
    { id: 'cable', name: 'Cable machine' },
    { id: 'lat_pulldown', name: 'Lat pulldown' },
    { id: 'seated_row', name: 'Seated row machine' },
    { id: 'chest_press', name: 'Chest press machine' },
    { id: 'pec_deck', name: 'Pec deck / rear-delt machine' },
    { id: 'shoulder_press_machine', name: 'Shoulder press machine' },
    { id: 'leg_press', name: 'Leg press' },
    { id: 'leg_extension', name: 'Leg extension' },
    { id: 'leg_curl', name: 'Leg curl' },
    { id: 'calf_machine', name: 'Calf raise machine' },
  ]},
  { name: 'Small gear', items: [
    { id: 'bands', name: 'Resistance bands' },
    { id: 'suspension', name: 'Suspension trainer (TRX)' },
    { id: 'stability_ball', name: 'Stability ball' },
    { id: 'med_ball', name: 'Medicine ball' },
    { id: 'ab_wheel', name: 'Ab wheel' },
  ]},
];

// Exercises held for time (seconds) instead of reps
const TIMED_NAMES = ['Plank', 'Side Plank', 'Wall Sit', 'Dead Hang', 'Hollow Body Hold',
  "Farmer's Carry", 'Suitcase Carry'];

// Gear that only supports bodyweight movements (nothing to load with plates/dumbbells)
const BODYWEIGHT_GEAR = ['bench', 'box', 'pullup_bar', 'dip_bars', 'suspension', 'squat_rack', 'stability_ball', 'ab_wheel'];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const E = (name, muscle, equip, level, cue, secondary = []) => ({
  id: slug(name), name, muscle, equip, level, cue, secondary,
  compound: secondary.length > 0,
  timed: TIMED_NAMES.includes(name),
  // true when you'd normally log a weight (dumbbells, cables, bands...); false for bodyweight moves
  loaded: equip.some((req) => req.split('|').every((x) => !BODYWEIGHT_GEAR.includes(x))),
});

const EXERCISES = [
  // ───────────── CHEST ─────────────
  E('Push-Up', 'chest', [], 1, 'Body in one line, elbows ~45° from torso, chest to the floor.', ['triceps', 'shoulders']),
  E('Incline Push-Up', 'chest', ['bench|box'], 1, 'Hands on a bench or step; easier push-up variation.', ['triceps', 'shoulders']),
  E('Decline Push-Up', 'chest', ['bench|box'], 2, 'Feet elevated; keep hips level and core tight.', ['shoulders', 'triceps']),
  E('Diamond Push-Up', 'triceps', [], 2, 'Hands close together under the chest, elbows tucked.', ['chest', 'shoulders']),
  E('Barbell Bench Press', 'chest', ['barbell', 'bench'], 2, 'Shoulder blades pinched, bar to mid-chest, drive up.', ['triceps', 'shoulders']),
  E('Incline Barbell Press', 'chest', ['barbell', 'bench'], 2, 'Bench at ~30°; press to upper chest.', ['shoulders', 'triceps']),
  E('Smith Machine Bench Press', 'chest', ['smith', 'bench'], 1, 'Feet planted, lower under control to mid-chest.', ['triceps', 'shoulders']),
  E('Dumbbell Bench Press', 'chest', ['dumbbell', 'bench'], 1, 'Lower until elbows are just below the bench, press together.', ['triceps', 'shoulders']),
  E('Incline Dumbbell Press', 'chest', ['dumbbell', 'bench'], 2, 'Bench at 30–45°; keep wrists stacked over elbows.', ['shoulders', 'triceps']),
  E('Dumbbell Floor Press', 'chest', ['dumbbell'], 1, 'Lie on the floor; elbows stop when they touch down.', ['triceps']),
  E('Dumbbell Fly', 'chest', ['dumbbell', 'bench'], 2, 'Soft elbows, wide arc, squeeze at the top.'),
  E('Floor Fly', 'chest', ['dumbbell'], 1, 'Same as a fly but on the floor to protect shoulders.'),
  E('Dumbbell Pullover', 'chest', ['dumbbell|kettlebell', 'bench'], 2, 'Reach back over your head with slightly bent arms, pull over chest.', ['back']),
  E('Machine Chest Press', 'chest', ['chest_press'], 1, 'Set seat so handles align with mid-chest; press smoothly.', ['triceps', 'shoulders']),
  E('Pec Deck Fly', 'chest', ['pec_deck'], 1, 'Lead with elbows, squeeze at the center, slow return.'),
  E('Cable Crossover', 'chest', ['cable'], 2, 'Slight forward lean, hands meet in front of the chest.'),
  E('Low-to-High Cable Fly', 'chest', ['cable'], 2, 'Sweep from hips to eye level to hit the upper chest.'),
  E('Band Chest Press', 'chest', ['bands'], 1, 'Anchor behind you, press forward and squeeze.', ['triceps', 'shoulders']),
  E('Band Chest Fly', 'chest', ['bands'], 1, 'Arms wide with a slight bend, bring hands together.'),
  E('Chest Dip', 'chest', ['dip_bars'], 3, 'Lean forward, elbows flared slightly, lower until stretch.', ['triceps', 'shoulders']),

  // ───────────── BACK ─────────────
  E('Pull-Up', 'back', ['pullup_bar'], 3, 'Start from a dead hang; chin over the bar, no swinging.', ['biceps']),
  E('Chin-Up', 'back', ['pullup_bar'], 3, 'Palms facing you; pull chest toward the bar.', ['biceps']),
  E('Inverted Row', 'back', ['smith|squat_rack|suspension'], 2, 'Body straight under a bar; pull chest to the bar.', ['biceps']),
  E('TRX Row', 'back', ['suspension'], 1, 'Lean back, pull elbows past your ribs, squeeze shoulder blades.', ['biceps']),
  E('Barbell Bent-Over Row', 'back', ['barbell'], 2, 'Hinge to ~45°, flat back, pull bar to lower ribs.', ['biceps']),
  E('Pendlay Row', 'back', ['barbell'], 3, 'Bar returns to the floor each rep; explosive pull, flat back.', ['biceps']),
  E('Deadlift', 'back', ['barbell'], 3, 'Bar over mid-foot, brace, push the floor away, lock out hips.', ['hamstrings', 'glutes']),
  E('One-Arm Dumbbell Row', 'back', ['dumbbell'], 1, 'Hand on a bench or knee; pull elbow to hip.', ['biceps']),
  E('Chest-Supported Dumbbell Row', 'back', ['dumbbell', 'bench'], 1, 'Lie chest-down on an incline bench; row to your sides.', ['biceps']),
  E('Renegade Row', 'back', ['dumbbell'], 3, 'Plank on dumbbells; row one at a time without rotating.', ['core', 'biceps']),
  E('Kettlebell Row', 'back', ['kettlebell'], 1, 'Hinge and row the bell to your hip.', ['biceps']),
  E('Lat Pulldown', 'back', ['lat_pulldown'], 1, 'Chest up, pull bar to upper chest, elbows down.', ['biceps']),
  E('Close-Grip Lat Pulldown', 'back', ['lat_pulldown'], 1, 'Neutral or close grip; drive elbows to your sides.', ['biceps']),
  E('Seated Cable Row', 'back', ['seated_row|cable'], 1, 'Sit tall, pull handle to belly, pause and squeeze.', ['biceps']),
  E('Straight-Arm Pulldown', 'back', ['cable'], 2, 'Arms nearly straight, sweep bar down to thighs.'),
  E('Band Row', 'back', ['bands'], 1, 'Anchor in front, pull elbows back and squeeze.', ['biceps']),
  E('Band Lat Pulldown', 'back', ['bands', 'pullup_bar'], 1, 'Loop the band over a bar; kneel and pull down.', ['biceps']),
  E('Band Pull-Apart', 'back', ['bands'], 1, 'Arms straight, pull the band apart to your chest.'),
  E('Dumbbell Shrug', 'back', ['dumbbell'], 1, 'Lift shoulders straight up toward your ears, pause.'),
  E('Barbell Shrug', 'back', ['barbell'], 1, 'Straight up and down—no rolling the shoulders.'),
  E('Superman', 'back', [], 1, 'Face down; lift arms and legs, squeeze lower back and glutes.'),
  E('Prone Y-T-W Raise', 'back', [], 1, 'Lie face down; raise arms in Y, T, then W shapes.'),

  // ───────────── SHOULDERS ─────────────
  E('Pike Push-Up', 'shoulders', [], 2, 'Hips high in an inverted V; lower head between hands.', ['triceps']),
  E('Wall Handstand Push-Up', 'shoulders', [], 3, 'Kick up to the wall, lower head to the floor, press.', ['triceps']),
  E('Dumbbell Shoulder Press', 'shoulders', ['dumbbell'], 1, 'Brace core, press overhead without arching your back.', ['triceps']),
  E('Seated Dumbbell Press', 'shoulders', ['dumbbell', 'bench'], 1, 'Back supported, press up and slightly together.', ['triceps']),
  E('Arnold Press', 'shoulders', ['dumbbell'], 2, 'Rotate palms from facing you to forward as you press.', ['triceps']),
  E('Barbell Overhead Press', 'shoulders', ['barbell'], 2, 'Squeeze glutes, press bar past your face, lock out.', ['triceps', 'core']),
  E('Push Press', 'shoulders', ['barbell'], 3, 'Dip with the knees, drive the bar up with your legs.', ['triceps', 'quads']),
  E('Smith Machine Shoulder Press', 'shoulders', ['smith'], 1, 'Press straight up from chin height.', ['triceps']),
  E('Machine Shoulder Press', 'shoulders', ['shoulder_press_machine'], 1, 'Seat so handles start at shoulder height.', ['triceps']),
  E('Kettlebell Press', 'shoulders', ['kettlebell'], 2, 'Rack the bell at the shoulder and press overhead.', ['triceps']),
  E('Band Overhead Press', 'shoulders', ['bands'], 1, 'Stand on the band; press overhead with ribs down.', ['triceps']),
  E('Dumbbell Lateral Raise', 'shoulders', ['dumbbell'], 1, 'Lead with elbows to shoulder height; control the way down.'),
  E('Cable Lateral Raise', 'shoulders', ['cable'], 2, 'Constant tension; raise the handle out to the side.'),
  E('Band Lateral Raise', 'shoulders', ['bands'], 1, 'Stand on the band; raise arms out to shoulder height.'),
  E('Dumbbell Front Raise', 'shoulders', ['dumbbell'], 1, 'Raise to eye level, no swinging.'),
  E('Rear Delt Dumbbell Fly', 'shoulders', ['dumbbell'], 1, 'Hinge forward; raise arms wide, squeeze shoulder blades.'),
  E('Reverse Pec Deck', 'shoulders', ['pec_deck'], 1, 'Chest on the pad; sweep arms back and wide.'),
  E('Face Pull', 'shoulders', ['cable'], 1, 'Rope to forehead, elbows high, rotate hands out.', ['back']),
  E('Band Face Pull', 'shoulders', ['bands'], 1, 'Pull the band to your face with elbows high.', ['back']),
  E('Upright Row', 'shoulders', ['dumbbell|barbell|ez_bar'], 2, 'Pull toward the chest, elbows leading, below shoulder height.', ['back']),
  E('Kettlebell Halo', 'shoulders', ['kettlebell'], 1, 'Circle the bell around your head, ribs down.', ['core']),

  // ───────────── BICEPS ─────────────
  E('Dumbbell Curl', 'biceps', ['dumbbell'], 1, 'Elbows pinned to your sides; squeeze at the top.'),
  E('Hammer Curl', 'biceps', ['dumbbell'], 1, 'Neutral grip; also hits the forearms.'),
  E('Incline Dumbbell Curl', 'biceps', ['dumbbell', 'bench'], 2, 'Lie back on an incline bench; deep stretch at the bottom.'),
  E('Concentration Curl', 'biceps', ['dumbbell'], 1, 'Elbow braced on your inner thigh; slow curl.'),
  E('Zottman Curl', 'biceps', ['dumbbell'], 2, 'Curl up palms-up, rotate and lower palms-down.'),
  E('Spider Curl', 'biceps', ['dumbbell', 'bench'], 2, 'Chest on an incline bench; arms hang straight down and curl.'),
  E('Barbell Curl', 'biceps', ['barbell'], 1, 'No swinging; full range, squeeze at the top.'),
  E('EZ-Bar Curl', 'biceps', ['ez_bar'], 1, 'Angled grip is easier on the wrists.'),
  E('Cable Curl', 'biceps', ['cable'], 1, 'Constant tension; keep elbows still.'),
  E('Band Curl', 'biceps', ['bands'], 1, 'Stand on the band and curl to shoulders.'),
  E('TRX Biceps Curl', 'biceps', ['suspension'], 2, 'Lean back, arms extended, curl your hands to your head.'),

  // ───────────── TRICEPS ─────────────
  E('Close-Grip Push-Up', 'triceps', [], 1, 'Hands under shoulders, elbows brushing your ribs.', ['chest']),
  E('Bench Dip', 'triceps', ['bench|box'], 1, 'Hands on a bench behind you; lower until elbows hit 90°.', ['chest']),
  E('Parallel Bar Dip', 'triceps', ['dip_bars'], 3, 'Stay upright, elbows back, lower until upper arms are parallel.', ['chest', 'shoulders']),
  E('Close-Grip Bench Press', 'triceps', ['barbell', 'bench'], 2, 'Hands shoulder-width; elbows tucked.', ['chest', 'shoulders']),
  E('Overhead Dumbbell Extension', 'triceps', ['dumbbell'], 1, 'Both hands on one dumbbell; lower behind your head.'),
  E('Dumbbell Skull Crusher', 'triceps', ['dumbbell', 'bench'], 2, 'Lower dumbbells toward your forehead; elbows still.'),
  E('EZ-Bar Skull Crusher', 'triceps', ['ez_bar', 'bench'], 2, 'Lower the bar behind your head, extend without flaring elbows.'),
  E('Triceps Pushdown', 'triceps', ['cable'], 1, 'Elbows pinned; push down and fully extend.'),
  E('Overhead Cable Extension', 'triceps', ['cable'], 2, 'Face away from the stack; extend over your head.'),
  E('Band Pushdown', 'triceps', ['bands'], 1, 'Anchor high; push down and lock out.'),
  E('Dumbbell Kickback', 'triceps', ['dumbbell'], 1, 'Hinge forward, upper arm parallel to floor, extend the elbow.'),
  E('TRX Triceps Extension', 'triceps', ['suspension'], 2, 'Lean forward; bend only at the elbows.'),

  // ───────────── FOREARMS ─────────────
  E('Wrist Curl', 'forearms', ['dumbbell|barbell|ez_bar'], 1, 'Forearms on thighs, palms up; curl with the wrists only.'),
  E('Reverse Wrist Curl', 'forearms', ['dumbbell|barbell|ez_bar'], 1, 'Palms down; extend the wrists up.'),
  E('Reverse Curl', 'forearms', ['ez_bar|barbell|dumbbell'], 1, 'Overhand grip curl; hits forearms and brachialis.', ['biceps']),
  E("Farmer's Carry", 'forearms', ['dumbbell|kettlebell'], 1, 'Walk tall holding heavy weights; crush the handles.', ['core']),
  E('Dead Hang', 'forearms', ['pullup_bar'], 1, 'Hang with active shoulders for time.'),

  // ───────────── CORE ─────────────
  E('Plank', 'core', [], 1, 'Straight line head to heels; squeeze glutes and abs.'),
  E('Side Plank', 'core', [], 1, 'Stack feet, lift hips, hold a straight line.'),
  E('Dead Bug', 'core', [], 1, 'Lower back pressed down; extend opposite arm and leg.'),
  E('Bird Dog', 'core', [], 1, 'Extend opposite arm and leg without rotating hips.'),
  E('Crunch', 'core', [], 1, 'Curl ribs toward hips; don’t pull on your neck.'),
  E('Bicycle Crunch', 'core', [], 1, 'Opposite elbow to knee, slow and controlled.'),
  E('Lying Leg Raise', 'core', [], 2, 'Keep lower back flat; lower legs slowly.'),
  E('Flutter Kicks', 'core', [], 1, 'Small fast kicks, lower back pressed down.'),
  E('V-Up', 'core', [], 2, 'Reach hands to toes at the top, control the descent.'),
  E('Hollow Body Hold', 'core', [], 2, 'Lower back glued to the floor, arms and legs extended.'),
  E('Mountain Climber', 'core', [], 1, 'Plank position; drive knees to chest quickly.', ['shoulders']),
  E('Russian Twist', 'core', [], 1, 'Lean back slightly; rotate your torso side to side.'),
  E('Weighted Russian Twist', 'core', ['med_ball|dumbbell|kettlebell'], 2, 'Same twist with weight held at chest.'),
  E('Decline Sit-Up', 'core', ['bench'], 2, 'Feet anchored; control the way up and down.'),
  E('Hanging Knee Raise', 'core', ['pullup_bar'], 2, 'Curl pelvis up; don’t swing.'),
  E('Hanging Leg Raise', 'core', ['pullup_bar'], 3, 'Straight legs to bar height with no swing.'),
  E('Ab Wheel Rollout', 'core', ['ab_wheel'], 3, 'Brace hard, roll out only as far as you can keep a flat back.'),
  E('Cable Crunch', 'core', ['cable'], 2, 'Kneel and crunch elbows to knees, hips stay still.'),
  E('Pallof Press', 'core', ['cable|bands'], 1, 'Press the handle out and resist rotation.'),
  E('Cable Woodchop', 'core', ['cable'], 2, 'Rotate through the torso, arms stay long.'),
  E('Band Woodchop', 'core', ['bands'], 1, 'Chop high-to-low, pivoting through your feet.'),
  E('Medicine Ball Slam', 'core', ['med_ball'], 1, 'Reach overhead, slam the ball down with your whole body.', ['shoulders']),
  E('Stability Ball Crunch', 'core', ['stability_ball'], 1, 'Ball under lower back; crunch with control.'),
  E('Suitcase Carry', 'core', ['dumbbell|kettlebell'], 1, 'Carry one heavy weight; don’t lean to either side.', ['forearms']),
  E('TRX Fallout', 'core', ['suspension'], 3, 'Arms extend overhead from a plank; keep hips locked.'),

  // ───────────── QUADS ─────────────
  E('Bodyweight Squat', 'quads', [], 1, 'Chest up, knees track over toes, hips below parallel.', ['glutes']),
  E('Jump Squat', 'quads', [], 2, 'Explode up, land softly into the next rep.', ['glutes', 'calves']),
  E('Split Squat', 'quads', [], 1, 'Stationary lunge; drop your back knee straight down.', ['glutes']),
  E('Reverse Lunge', 'quads', [], 1, 'Step back, lower the knee, drive through the front heel.', ['glutes']),
  E('Walking Lunge', 'quads', [], 1, 'Long steps, upright torso, alternate legs.', ['glutes']),
  E('Wall Sit', 'quads', [], 1, 'Back on the wall, thighs parallel to the floor.'),
  E('Pistol Squat', 'quads', [], 3, 'Single-leg squat; hold a doorframe for assistance if needed.', ['glutes']),
  E('Bulgarian Split Squat', 'quads', ['bench|box'], 2, 'Rear foot elevated; lower straight down.', ['glutes']),
  E('Step-Up', 'quads', ['box|bench'], 1, 'Drive through the whole foot on the step; control down.', ['glutes']),
  E('Goblet Squat', 'quads', ['dumbbell|kettlebell'], 1, 'Hold weight at chest, elbows inside knees, sit deep.', ['glutes', 'core']),
  E('Dumbbell Lunge', 'quads', ['dumbbell'], 1, 'Hold dumbbells at sides; step and lower with control.', ['glutes']),
  E('Dumbbell Bulgarian Split Squat', 'quads', ['dumbbell', 'bench|box'], 2, 'Rear foot elevated, dumbbells at sides.', ['glutes']),
  E('Dumbbell Step-Up', 'quads', ['dumbbell', 'box|bench'], 1, 'Step up while holding dumbbells; control the descent.', ['glutes']),
  E('Barbell Back Squat', 'quads', ['barbell', 'squat_rack'], 2, 'Brace, sit between your hips, drive up through midfoot.', ['glutes', 'hamstrings']),
  E('Barbell Front Squat', 'quads', ['barbell', 'squat_rack'], 3, 'Elbows high, torso upright, bar on front delts.', ['glutes', 'core']),
  E('Smith Machine Squat', 'quads', ['smith'], 1, 'Feet slightly forward; sit down and back.', ['glutes']),
  E('Leg Press', 'quads', ['leg_press'], 1, 'Feet shoulder-width, lower until knees ~90°, don’t lock out.', ['glutes']),
  E('Leg Extension', 'quads', ['leg_extension'], 1, 'Extend fully, pause, lower slowly.'),
  E('Band Squat', 'quads', ['bands'], 1, 'Stand on the band, hold at shoulders and squat.', ['glutes']),

  // ───────────── HAMSTRINGS ─────────────
  E('Romanian Deadlift', 'hamstrings', ['barbell'], 2, 'Soft knees, push hips back, bar close to legs.', ['glutes', 'back']),
  E('Dumbbell Romanian Deadlift', 'hamstrings', ['dumbbell'], 1, 'Hinge at the hips, feel the hamstring stretch.', ['glutes', 'back']),
  E('Single-Leg Romanian Deadlift', 'hamstrings', [], 2, 'Balance on one leg; hinge until torso is parallel.', ['glutes', 'core']),
  E('Weighted Single-Leg RDL', 'hamstrings', ['dumbbell|kettlebell'], 2, 'Same hinge holding weight in the opposite hand.', ['glutes', 'core']),
  E('Good Morning', 'hamstrings', ['barbell'], 3, 'Bar on back; hinge with a flat spine.', ['glutes', 'back']),
  E('Band Good Morning', 'hamstrings', ['bands'], 1, 'Stand on the band; hinge at the hips.', ['glutes']),
  E('Lying Leg Curl', 'hamstrings', ['leg_curl'], 1, 'Curl heels to glutes, slow lowering.'),
  E('Stability Ball Leg Curl', 'hamstrings', ['stability_ball'], 2, 'Bridge up, roll the ball in with your heels.', ['glutes']),
  E('TRX Hamstring Curl', 'hamstrings', ['suspension'], 2, 'Heels in straps, hips high; curl heels toward you.', ['glutes']),
  E('Hamstring Walkout', 'hamstrings', [], 2, 'Bridge up and walk your feet out and back in.', ['glutes']),

  // ───────────── GLUTES ─────────────
  E('Glute Bridge', 'glutes', [], 1, 'Drive through heels, squeeze at the top.', ['hamstrings']),
  E('Single-Leg Glute Bridge', 'glutes', [], 2, 'One foot planted; keep hips level.', ['hamstrings']),
  E('Bodyweight Hip Thrust', 'glutes', ['bench'], 1, 'Upper back on the bench; thrust hips to full lockout.', ['hamstrings']),
  E('Dumbbell Hip Thrust', 'glutes', ['dumbbell', 'bench'], 1, 'Dumbbell across hips; chin tucked, pause at top.', ['hamstrings']),
  E('Barbell Hip Thrust', 'glutes', ['barbell', 'bench'], 2, 'Bar over hips with a pad; drive through the heels.', ['hamstrings']),
  E('Frog Pump', 'glutes', [], 1, 'Soles together, knees out; short, fast bridges.'),
  E('Donkey Kick', 'glutes', [], 1, 'On all fours; press your heel to the ceiling.'),
  E('Fire Hydrant', 'glutes', [], 1, 'On all fours; lift the knee out to the side.'),
  E('Curtsy Lunge', 'glutes', [], 2, 'Step back diagonally, sink low, drive up.', ['quads']),
  E('Banded Glute Bridge', 'glutes', ['bands'], 1, 'Band above knees; press knees out as you bridge.', ['hamstrings']),
  E('Banded Lateral Walk', 'glutes', ['bands'], 1, 'Band around knees; stay low and step sideways.'),
  E('Kettlebell Swing', 'glutes', ['kettlebell'], 2, 'Hinge, snap hips forward, let the bell float.', ['hamstrings', 'core']),
  E('Kettlebell Sumo Deadlift', 'glutes', ['kettlebell'], 1, 'Wide stance, chest up, stand tall.', ['quads', 'hamstrings']),
  E('Sumo Deadlift', 'glutes', ['barbell'], 3, 'Wide stance, grip inside knees, push the floor apart.', ['quads', 'hamstrings']),
  E('Cable Kickback', 'glutes', ['cable'], 1, 'Ankle strap; kick back with a squeeze.'),
  E('Cable Pull-Through', 'glutes', ['cable'], 1, 'Face away; hinge and snap hips forward.', ['hamstrings']),

  // ───────────── CALVES ─────────────
  E('Standing Calf Raise', 'calves', [], 1, 'Full stretch at the bottom, pause at the top.'),
  E('Single-Leg Calf Raise', 'calves', [], 2, 'One leg; hold a wall for balance.'),
  E('Step Calf Raise', 'calves', ['box'], 1, 'Heels hang off the edge for a deeper stretch.'),
  E('Dumbbell Calf Raise', 'calves', ['dumbbell'], 1, 'Hold dumbbells at your sides, rise onto toes.'),
  E('Barbell Calf Raise', 'calves', ['barbell'], 2, 'Bar on back; slow reps with a pause at the top.'),
  E('Smith Machine Calf Raise', 'calves', ['smith'], 1, 'Balls of feet on a plate; full stretch and squeeze.'),
  E('Seated Calf Raise', 'calves', ['calf_machine'], 1, 'Knees bent at 90°; hits the soleus.'),
  E('Leg Press Calf Raise', 'calves', ['leg_press'], 1, 'Press with your toes only; keep knees nearly straight.'),
];

const EX_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
const MUSCLE_NAME = Object.fromEntries(MUSCLES.map((m) => [m.id, m.name]));
const EQUIP_NAME = {};
EQUIPMENT_GROUPS.forEach((g) => g.items.forEach((i) => { EQUIP_NAME[i.id] = i.name; }));
const ALL_EQUIPMENT = Object.keys(EQUIP_NAME);

function isAvailable(ex, owned) {
  return ex.equip.every((req) => req.split('|').some((r) => owned.includes(r)));
}

if (typeof module !== 'undefined') {
  module.exports = { MUSCLES, EQUIPMENT_GROUPS, EXERCISES, EX_BY_ID, MUSCLE_NAME, EQUIP_NAME, ALL_EQUIPMENT, isAvailable };
}
