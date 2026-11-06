/* Will Power Fitness — sport-specific training: which muscles matter, which lifts help, and a rotation of session types (pure logic). */
const SPORT = (() => {
  /* muscles: relative priority (1 = normal). picks: exercise name → why it helps this sport. days: rotating sessions [label, muscles]. */
  const SPORTS = [
    { id: 'basketball', traits: { power: 1, uni: 0.7, stab: 0.4 }, name: 'Basketball', icon: '🏀', goal: 'strength',
      blurb: 'Jumping, quick direction changes and strong landings. Heavy leg power, hamstring and ankle strength, a stable core.',
      muscles: { quads: 1.6, glutes: 1.6, hamstrings: 1.4, calves: 1.5, core: 1.4, shoulders: 1.1, chest: 0.9, back: 1 },
      days: [['Leg power', ['quads', 'glutes', 'hamstrings', 'calves']], ['Upper & core', ['chest', 'back', 'shoulders', 'core']], ['Explosive & stability', ['glutes', 'calves', 'core', 'hamstrings']]],
      picks: { 'Jump Squat': 'Builds vertical jump power', 'Barbell Back Squat': 'Base leg strength for jumping', 'Barbell Front Squat': 'Leg strength with an upright torso', 'Bulgarian Split Squat': 'Single-leg strength for cuts and landings', 'Dumbbell Bulgarian Split Squat': 'Single-leg strength for cuts and landings', 'Step-Up': 'Single-leg drive for jumping', 'Dumbbell Step-Up': 'Single-leg drive for jumping', 'Romanian Deadlift': 'Hamstring strength protects knees', 'Single-Leg Romanian Deadlift': 'Balance and hamstring strength on one leg', 'Standing Calf Raise': 'Calf and ankle strength for jumps', 'Single-Leg Calf Raise': 'Ankle stability and spring', 'Kettlebell Swing': 'Explosive hip extension', 'Push Press': 'Full-body power transfer', 'Medicine Ball Slam': 'Explosive power', 'Banded Lateral Walk': 'Hip stability for side-to-side moves', 'Walking Lunge': 'Leg endurance and control' } },
    { id: 'football', traits: { power: 1, grip: 0.8, uni: 0.2, stab: 0.3 }, name: 'Football', icon: '🏈', goal: 'strength',
      blurb: 'Raw strength and power: big squats, pulls and presses, explosive hips and a strong neck-to-hip chain.',
      muscles: { quads: 1.5, glutes: 1.5, hamstrings: 1.4, back: 1.5, chest: 1.4, shoulders: 1.3, core: 1.2, forearms: 1.2, calves: 0.9 },
      days: [['Lower strength', ['quads', 'hamstrings', 'glutes', 'calves']], ['Upper push & pull', ['chest', 'back', 'shoulders', 'triceps']], ['Power & grip', ['glutes', 'back', 'core', 'forearms']]],
      picks: { 'Barbell Back Squat': 'Foundation of lower-body strength', 'Deadlift': 'Total-body pulling power', 'Barbell Bench Press': 'Pressing strength for blocking', 'Barbell Overhead Press': 'Shoulder strength', 'Push Press': 'Explosive pressing power', 'Pendlay Row': 'Explosive pulling', 'Barbell Bent-Over Row': 'Back strength for contact', 'Barbell Hip Thrust': 'Hip drive for acceleration', 'Kettlebell Swing': 'Explosive hips', 'Medicine Ball Slam': 'Full-body power', 'Farmer\'s Carry': 'Grip and trunk strength', 'Barbell Shrug': 'Upper trap and neck support', 'Dumbbell Shrug': 'Upper trap and neck support', 'Pull-Up': 'Pulling strength' } },
    { id: 'soccer', traits: { uni: 1, stab: 0.6, power: 0.5 }, name: 'Soccer', icon: '⚽', goal: 'endurance',
      blurb: 'Repeated sprints, change of direction and 90 minutes of running. Strong hamstrings, hips and adductors with a stable core.',
      muscles: { quads: 1.4, hamstrings: 1.6, glutes: 1.5, calves: 1.3, core: 1.4, shoulders: 0.7, chest: 0.7, back: 0.9, biceps: 0.6, triceps: 0.6 },
      days: [['Legs & hamstrings', ['quads', 'hamstrings', 'glutes', 'calves']], ['Core & upper', ['core', 'back', 'chest', 'shoulders']], ['Single-leg & stability', ['glutes', 'hamstrings', 'quads', 'core']]],
      picks: { 'Single-Leg Romanian Deadlift': 'Balance and hamstring strength', 'Weighted Single-Leg RDL': 'Hamstring strength for sprinting', 'Romanian Deadlift': 'Hamstring strength reduces injury risk', 'Bulgarian Split Squat': 'Single-leg strength for kicking and cuts', 'Dumbbell Bulgarian Split Squat': 'Single-leg strength for kicking and cuts', 'Curtsy Lunge': 'Hip and adductor strength for turning', 'Walking Lunge': 'Running endurance in the legs', 'Reverse Lunge': 'Knee-friendly single-leg strength', 'Step-Up': 'Single-leg drive', 'Lying Leg Curl': 'Hamstring strength', 'Banded Lateral Walk': 'Hip stability', 'Single-Leg Calf Raise': 'Ankle strength', 'Jump Squat': 'Explosive first step', 'Plank': 'Trunk stability', 'Side Plank': 'Lateral core stability', 'Dead Bug': 'Core control' } },
    { id: 'baseball', traits: { rot: 1, stab: 0.9, power: 0.6, grip: 0.5 }, name: 'Baseball / Softball', icon: '⚾', goal: 'strength',
      blurb: 'Rotational power for throwing and swinging, strong hips and healthy shoulders.',
      muscles: { core: 1.7, glutes: 1.5, shoulders: 1.4, back: 1.4, quads: 1.2, hamstrings: 1.2, forearms: 1.3, chest: 1, biceps: 0.8, triceps: 0.9 },
      days: [['Lower & hips', ['quads', 'glutes', 'hamstrings', 'core']], ['Upper & shoulder health', ['back', 'shoulders', 'chest', 'forearms']], ['Rotation & power', ['core', 'glutes', 'back', 'forearms']]],
      picks: { 'Cable Woodchop': 'Rotational power for swinging', 'Band Woodchop': 'Rotational power for swinging', 'Medicine Ball Slam': 'Explosive trunk power', 'Pallof Press': 'Anti-rotation core control', 'Russian Twist': 'Rotation strength', 'Weighted Russian Twist': 'Rotation strength', 'Face Pull': 'Rear-shoulder health for throwers', 'Band Face Pull': 'Rear-shoulder health for throwers', 'Rear Delt Dumbbell Fly': 'Shoulder balance', 'Reverse Pec Deck': 'Shoulder balance', 'Band Pull-Apart': 'Shoulder stability', 'Wrist Curl': 'Grip and wrist strength', 'Reverse Wrist Curl': 'Wrist health', 'Kettlebell Swing': 'Hip power', 'Single-Leg Romanian Deadlift': 'Balance in the stride', 'One-Arm Dumbbell Row': 'Back strength', 'Barbell Hip Thrust': 'Hip drive' } },
    { id: 'golf', traits: { rot: 1, stab: 0.8, grip: 0.5, uni: 0.3 }, name: 'Golf', icon: '⛳', goal: 'strength',
      blurb: 'Rotation, hip and glute power, a stable core and healthy shoulders and lower back to add clubhead speed.',
      muscles: { core: 1.8, glutes: 1.6, back: 1.3, shoulders: 1.2, forearms: 1.2, hamstrings: 1.1, quads: 1, chest: 0.8, biceps: 0.6, triceps: 0.6 },
      days: [['Rotation & core', ['core', 'glutes', 'back']], ['Legs & hips', ['quads', 'hamstrings', 'glutes', 'calves']], ['Upper & posture', ['back', 'shoulders', 'chest', 'forearms']]],
      picks: { 'Cable Woodchop': 'Builds swing rotation power', 'Band Woodchop': 'Builds swing rotation power', 'Pallof Press': 'Resists rotation to protect your back', 'Medicine Ball Slam': 'Fast, explosive trunk power', 'Russian Twist': 'Rotation strength', 'Weighted Russian Twist': 'Rotation strength', 'Bird Dog': 'Lower-back stability', 'Dead Bug': 'Core control through the swing', 'Side Plank': 'Lateral trunk strength', 'Barbell Hip Thrust': 'Glute power for hip drive', 'Dumbbell Hip Thrust': 'Glute power for hip drive', 'Kettlebell Swing': 'Hip speed', 'Romanian Deadlift': 'Hip hinge pattern for setup and posture', 'Single-Leg Romanian Deadlift': 'Balance through the swing', 'Face Pull': 'Shoulder and posture health', 'Band Pull-Apart': 'Posture and shoulder control', 'Seated Cable Row': 'Back strength for posture', 'Wrist Curl': 'Grip and wrist strength', 'Reverse Wrist Curl': 'Wrist and elbow health', 'Farmer\'s Carry': 'Grip and core endurance for 18 holes' } },
    { id: 'tennis', traits: { rot: 0.9, stab: 0.8, uni: 0.6, grip: 0.6, power: 0.4 }, name: 'Tennis / Pickleball', icon: '🎾', goal: 'endurance',
      blurb: 'Quick lateral movement, rotational power and shoulder and elbow durability across long matches.',
      muscles: { core: 1.6, glutes: 1.4, quads: 1.3, hamstrings: 1.2, calves: 1.3, shoulders: 1.3, back: 1.2, forearms: 1.4, chest: 0.9 },
      days: [['Legs & lateral', ['quads', 'glutes', 'hamstrings', 'calves']], ['Shoulders & arms', ['shoulders', 'back', 'forearms', 'triceps']], ['Core & rotation', ['core', 'glutes', 'back']]],
      picks: { 'Curtsy Lunge': 'Lateral and crossover footwork', 'Banded Lateral Walk': 'Hip stability for side-to-side moves', 'Reverse Lunge': 'Single-leg strength', 'Walking Lunge': 'Leg endurance for long points', 'Single-Leg Calf Raise': 'Ankle strength for quick pushes', 'Cable Woodchop': 'Rotation for groundstrokes', 'Band Woodchop': 'Rotation for groundstrokes', 'Medicine Ball Slam': 'Explosive trunk power', 'Pallof Press': 'Core control', 'Face Pull': 'Rotator cuff health', 'Band Face Pull': 'Rotator cuff health', 'Rear Delt Dumbbell Fly': 'Shoulder balance', 'Reverse Wrist Curl': 'Prevents tennis elbow', 'Wrist Curl': 'Grip and forearm endurance', 'Reverse Curl': 'Forearm and elbow health', 'Jump Squat': 'Explosive first step' } },
    { id: 'hockey', traits: { uni: 0.9, power: 0.7, rot: 0.4, stab: 0.5 }, name: 'Hockey', icon: '🏒', goal: 'strength',
      blurb: 'Skating power from strong hips and quads, plus stability, core strength and upper-body for contact and shots.',
      muscles: { quads: 1.5, glutes: 1.6, hamstrings: 1.3, core: 1.5, back: 1.2, chest: 1.1, shoulders: 1.1, forearms: 1.1, calves: 0.8 },
      days: [['Skating legs', ['quads', 'glutes', 'hamstrings']], ['Upper & core', ['chest', 'back', 'shoulders', 'core']], ['Hips & stability', ['glutes', 'hamstrings', 'core', 'quads']]],
      picks: { 'Bulgarian Split Squat': 'Single-leg strength for each stride', 'Dumbbell Bulgarian Split Squat': 'Single-leg strength for each stride', 'Barbell Back Squat': 'Leg drive', 'Curtsy Lunge': 'Lateral push-off', 'Banded Lateral Walk': 'Hip abductor strength for skating', 'Barbell Hip Thrust': 'Glute power', 'Kettlebell Swing': 'Explosive hips', 'Single-Leg Romanian Deadlift': 'Balance on one leg', 'Jump Squat': 'Explosive strides', 'Pallof Press': 'Anti-rotation stability', 'Medicine Ball Slam': 'Explosive power', 'Barbell Bench Press': 'Pressing strength for contact', 'Pull-Up': 'Upper-body pulling', 'Farmer\'s Carry': 'Grip and trunk' } },
    { id: 'combat', traits: { grip: 1, power: 0.9, rot: 0.6, stab: 0.3 }, name: 'Boxing / MMA / Wrestling', icon: '🥊', goal: 'endurance',
      blurb: 'Explosive power, grip and pulling strength, a tough core and the conditioning to keep going late in rounds.',
      muscles: { core: 1.6, back: 1.4, shoulders: 1.3, glutes: 1.3, quads: 1.2, hamstrings: 1.2, forearms: 1.4, chest: 1.1, biceps: 1, triceps: 1.1 },
      days: [['Pull & grip', ['back', 'biceps', 'forearms', 'core']], ['Legs & power', ['quads', 'hamstrings', 'glutes']], ['Push & core', ['chest', 'shoulders', 'triceps', 'core']]],
      picks: { 'Pull-Up': 'Pulling strength for grappling', 'Chin-Up': 'Pulling strength for grappling', 'Dead Hang': 'Grip endurance', 'Farmer\'s Carry': 'Grip and trunk strength', 'Medicine Ball Slam': 'Explosive full-body power', 'Push Press': 'Explosive punching power', 'Kettlebell Swing': 'Explosive hips', 'Deadlift': 'Total-body strength', 'Renegade Row': 'Anti-rotation strength', 'Mountain Climber': 'Conditioning', 'Cable Woodchop': 'Rotational punching power', 'Band Woodchop': 'Rotational punching power', 'Hanging Leg Raise': 'Tough core', 'Push-Up': 'Punching endurance', 'Wall Sit': 'Mental toughness and leg endurance' } },
    { id: 'volleyball', traits: { power: 1, stab: 0.8, uni: 0.4 }, name: 'Volleyball', icon: '🏐', goal: 'strength',
      blurb: 'Vertical jump, a strong swing and healthy shoulders, with ankle and knee stability for repeated landings.',
      muscles: { quads: 1.5, glutes: 1.5, calves: 1.5, shoulders: 1.4, core: 1.4, back: 1.2, hamstrings: 1.2, chest: 0.9 },
      days: [['Jump power', ['quads', 'glutes', 'calves', 'hamstrings']], ['Shoulders & back', ['shoulders', 'back', 'chest', 'triceps']], ['Core & landing', ['core', 'glutes', 'calves', 'hamstrings']]],
      picks: { 'Jump Squat': 'Builds vertical jump', 'Barbell Back Squat': 'Leg strength for jumping', 'Step-Up': 'Single-leg jump drive', 'Dumbbell Step-Up': 'Single-leg jump drive', 'Single-Leg Calf Raise': 'Ankle spring and landing control', 'Standing Calf Raise': 'Ankle spring', 'Romanian Deadlift': 'Landing and hamstring strength', 'Kettlebell Swing': 'Explosive hips', 'Medicine Ball Slam': 'Overhead hitting power', 'Face Pull': 'Shoulder health for hitters', 'Band Face Pull': 'Shoulder health for hitters', 'Rear Delt Dumbbell Fly': 'Shoulder balance', 'Pull-Up': 'Swing strength', 'Dumbbell Pullover': 'Overhead range and lat power', 'Dead Bug': 'Core control in the air' } },
    { id: 'running', traits: { uni: 1, stab: 0.7 }, name: 'Running', icon: '🏃', goal: 'endurance',
      blurb: 'Stay injury-free and efficient: single-leg strength, glutes and calves, a stable trunk. Keep upper body light.',
      muscles: { glutes: 1.7, quads: 1.2, hamstrings: 1.4, calves: 1.6, core: 1.5, back: 0.8, shoulders: 0.6, chest: 0.5, biceps: 0.4, triceps: 0.4 },
      days: [['Single-leg strength', ['quads', 'glutes', 'hamstrings', 'calves']], ['Core & posture', ['core', 'back', 'glutes']], ['Hips & ankles', ['glutes', 'calves', 'hamstrings', 'core']]],
      picks: { 'Single-Leg Romanian Deadlift': 'Balance and hamstring strength', 'Weighted Single-Leg RDL': 'Hamstring strength', 'Bulgarian Split Squat': 'Single-leg strength like each stride', 'Dumbbell Bulgarian Split Squat': 'Single-leg strength like each stride', 'Step-Up': 'Hill-climbing power', 'Dumbbell Step-Up': 'Hill-climbing power', 'Single-Leg Glute Bridge': 'Glute strength for hip stability', 'Barbell Hip Thrust': 'Glute strength', 'Banded Lateral Walk': 'Hip stability to protect knees', 'Single-Leg Calf Raise': 'Calf and Achilles strength', 'Step Calf Raise': 'Calf and Achilles strength', 'Reverse Lunge': 'Knee-friendly leg strength', 'Plank': 'Trunk stability late in a run', 'Side Plank': 'Hip and trunk stability', 'Dead Bug': 'Core control', 'Bird Dog': 'Posture and balance' } },
    { id: 'swimming', traits: { stab: 1, grip: 0.3, rot: 0.3 }, name: 'Swimming', icon: '🏊', goal: 'endurance',
      blurb: 'Strong lats, shoulders and core for the stroke, plus kick power and healthy shoulders.',
      muscles: { back: 1.7, shoulders: 1.4, core: 1.6, triceps: 1.2, chest: 1.1, glutes: 1.1, quads: 0.9, hamstrings: 1, biceps: 0.9 },
      days: [['Pull & shoulders', ['back', 'shoulders', 'biceps', 'core']], ['Push & core', ['chest', 'triceps', 'core']], ['Legs & stability', ['glutes', 'quads', 'hamstrings', 'core']]],
      picks: { 'Lat Pulldown': 'Pulling power through the water', 'Pull-Up': 'Pulling power', 'Straight-Arm Pulldown': 'Mimics the stroke’s catch and pull', 'Dumbbell Pullover': 'Overhead reach and lat strength', 'Face Pull': 'Shoulder health for swimmers', 'Band Face Pull': 'Shoulder health for swimmers', 'Band Pull-Apart': 'Rotator cuff stability', 'Rear Delt Dumbbell Fly': 'Shoulder balance', 'Triceps Pushdown': 'Strong finish to each stroke', 'Hollow Body Hold': 'Streamline body position', 'Flutter Kicks': 'Kick endurance', 'Lying Scissor Kicks': 'Kick endurance', 'Plank': 'Core for body position', 'Superman': 'Back and posture', 'Prone Y-T-W Raise': 'Shoulder health' } },
    { id: 'cycling', traits: { uni: 0.6, stab: 0.6, power: 0.3 }, name: 'Cycling', icon: '🚴', goal: 'strength',
      blurb: 'Leg power and a strong core to hold a position for hours, plus back and shoulder strength for comfort on the bike.',
      muscles: { quads: 1.5, glutes: 1.5, hamstrings: 1.3, calves: 1.2, core: 1.5, back: 1.2, shoulders: 0.8, chest: 0.6, forearms: 0.9 },
      days: [['Leg power', ['quads', 'glutes', 'hamstrings', 'calves']], ['Core & back', ['core', 'back', 'shoulders']], ['Single-leg & hips', ['glutes', 'quads', 'hamstrings', 'core']]],
      picks: { 'Barbell Back Squat': 'Pedaling force', 'Leg Press': 'Pedaling force', 'Step-Up': 'Single-leg pedal strength', 'Dumbbell Step-Up': 'Single-leg pedal strength', 'Bulgarian Split Squat': 'Single-leg power', 'Romanian Deadlift': 'Hamstring and back strength', 'Barbell Hip Thrust': 'Glute power', 'Single-Leg Calf Raise': 'Calf endurance', 'Plank': 'Stay stable in the saddle', 'Side Plank': 'Hip and trunk stability', 'Dead Bug': 'Core control', 'Bird Dog': 'Lower-back support', 'Superman': 'Back endurance on long rides', 'Seated Cable Row': 'Back strength for posture' } },
  ];
  const BY_ID = Object.fromEntries(SPORTS.map((s) => [s.id, s]));

  const get = (id) => BY_ID[id] || null;
  /** What kind of movement an exercise is, worked out from its name (so every muscle gets sport-aware choices, not just named picks). */
  const TRAIT_RE = {
    uni: /Single-Leg|Single-Arm|One-Arm|Split Squat|Lunge|Step-Up|Pistol|Curtsy|Bulgarian|Renegade|Concentration|Kickback|Suitcase/,
    power: /Jump|Push Press|Swing|Slam/,
    rot: /Woodchop|Pallof|Russian|Twist|Renegade|Bicycle|Side Plank|Halo/,
    grip: /Farmer|Dead Hang|Shrug|Wrist|Pull-Up|Chin-Up|Deadlift|Reverse Curl|Hammer|Row|Carry/,
    stab: /Face Pull|Pull-Apart|Rear Delt|Reverse Pec|Y-T-W|Plank|Dead Bug|Bird Dog|Lateral Walk|Push-Up|Fly|Superman|Single-Leg|Hollow|Scapular/,
  };
  const TRAIT_WHY = {
    uni: (n) => `One side at a time — how you move in ${n}`,
    power: (n) => `Explosive effort builds ${n} power`,
    rot: (n) => `Trunk rotation and control for ${n}`,
    grip: (n) => `Grip and pulling strength for ${n}`,
    stab: (n) => `Joint and shoulder stability for ${n}`,
  };
  /** Best-matching trait for this sport and exercise: { trait, w } or null. */
  function trait(sport, ex) {
    let best = null;
    for (const t of Object.keys(sport.traits || {})) {
      if (TRAIT_RE[t].test(ex.name) && (!best || sport.traits[t] > best.w)) best = { trait: t, w: sport.traits[t] };
    }
    return best;
  }

  /** Multiplier for how many exercises a muscle gets (1 when no sport). */
  const muscleWeight = (sport, m) => (sport && sport.muscles[m]) || (sport ? 0.8 : 1);
  /** Score bonus: named sport picks first, then lifts whose movement type suits the sport (0 otherwise). */
  function pickBonus(sport, ex) {
    if (!sport) return 0;
    if (sport.picks[ex.name]) return 1.6;
    const t = trait(sport, ex);
    return t ? 1.2 * t.w : 0;
  }
  function why(sport, ex) {
    if (!sport) return '';
    if (sport.picks[ex.name]) return sport.picks[ex.name];
    const t = trait(sport, ex);
    return t && t.w >= 0.5 ? TRAIT_WHY[t.trait](sport.name) : '';
  }

  /** Index of the next session in the sport's rotation, based on the last sport workout in history. */
  function nextDay(sport, history) {
    if (!sport) return 0;
    const last = history.find((w) => w.sport && w.sport.id === sport.id && typeof w.sport.day === 'number');
    return last ? (last.sport.day + 1) % sport.days.length : 0;
  }

  return { SPORTS, get, muscleWeight, pickBonus, why, nextDay };
})();

if (typeof module !== 'undefined') module.exports = SPORT;
