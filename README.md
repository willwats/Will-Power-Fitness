# Will Power Fitness

A workout planner you can run from your phone. Pick the body part(s) you want to train, tell the app what equipment you have, and it builds the workout. Keep separate **profiles** for the gym (everything) and the room upstairs (limited gear).

No account, no backend, no build step — it's a static web app that runs entirely in the browser and keeps your data on your device.

## Features

- **Target any body part** — chest, back, shoulders, biceps, triceps, forearms, core, quads, hamstrings, glutes, calves. One-tap presets for Full body, Push, Pull, Legs, Upper and Arms.
- **Equipment profiles** — create as many as you want (e.g. *Gym*, *Home – Upstairs*). Each profile is a checklist of gear; workouts only ever use exercises you can do with the active profile.
- **169 exercises** with form cues, from bodyweight to full gym, tagged by muscle, equipment, difficulty and compound/isolation.
- **Workout generator** — splits the exercise budget across your target muscles, leads with compound lifts, finishes with isolation/core, and avoids repeating what you did in your last few workouts. Choose goal (Strength / Muscle / Endurance), experience level and number of exercises.
- **Animated demos** — every exercise has a looping stick-figure animation (with the weight or cable it uses) showing the movement pattern. On workout cards and in the library.
- **Swap / add / remove** any exercise, add or drop sets.
- **Logging** — weight + reps per set, last-time numbers shown and pre-filled, auto rest timer (with sound and vibration), workout summary.
- **Recovery dots** on each muscle (red = trained in the last day or so, green = rested) based on your history.
- **History** with weekly stats, **exercise library** with search, **export/import** backups.
- **Cardio tab** — start a walk, run, hike or ride with a live timer, GPS distance, pace and calories; or log any cardio by hand (elliptical, rower, swim, HIIT…). A daily **calories burned** total shows on Cardio and Train, with a 7-day chart. Strength workouts get an estimated calorie count too.
- **Apple Health bridge** — a one-time iOS Shortcut brings in your day's calories, steps and workouts (so walks not logged in the app still count), and another sends sessions from the app to Apple Fitness. See *Apple Health* below.
- **Installable & offline** — works as a home-screen app (PWA).

## Put it on GitHub Pages

1. Create a new repository on GitHub (e.g. `will-power-fitness`).
2. Upload everything in this folder to the **root** of the repo (or push it with git):
   ```bash
   git init
   git add .
   git commit -m "Will Power Fitness"
   git branch -M main
   git remote add origin https://github.com/<your-username>/will-power-fitness.git
   git push -u origin main
   ```
3. In the repo go to **Settings → Pages**, set **Source** to *Deploy from a branch*, choose **main** and **/ (root)**, then **Save**.
4. After a minute your app is live at `https://<your-username>.github.io/will-power-fitness/`.

### Install it on your phone

- **iPhone (Safari):** open the URL → Share → **Add to Home Screen**.
- **Android (Chrome):** open the URL → menu → **Install app** / **Add to Home screen**.

## Apple Health

Web apps can't read Apple Health directly, so the app uses iOS Shortcuts as the bridge (full steps are in the app: **Cardio → Apple Health → Setup guide**).

- **Sync in:** a Shortcut named `Will Power Sync` reads today's Active Energy, Steps (and optionally Workouts), and copies text like `#health&kcal=512&steps=8423&wtype=Walking&wmin=32&wkcal=178&wdist=1.8` to the clipboard. Tap **Sync Apple Health**, then **Paste from clipboard**. Opening a link ending in that `#health&…` text also imports it.
- **Send out:** a Shortcut named `Will Power Log Workout` receives JSON (`type, minutes, kcal, miles, start, end`) and runs **Log Workout**. The **Send to Health** button on a session calls it.
- **Daily total** = Apple Health calories + sessions logged in the app that weren't sent to Health (no double counting).
- **Limits:** this is a manual hand-off, not background sync (that needs a native iOS app). iPhone suspends web apps when the screen locks, so the live GPS tracker works best with the screen on.

## Run it locally

Any static file server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(You can also just open `index.html` directly; the offline cache only activates over http/https.)

## Customize

- **Exercises & gear:** edit `exercises.js`. Each exercise is one line:
  `E('Name', 'muscle', ['required gear'], level 1-3, 'form cue', ['secondary muscles'])`.
  Use `'a|b'` inside the gear list to mean "a **or** b"; an empty list means bodyweight.
- **Sets / reps / rest per goal:** the `GOALS` table at the top of `app.js`.
- **Default profiles:** `defaults()` in `app.js`.
- **Colors:** CSS variables at the top of `styles.css`.
- After changing files, bump `CACHE` in `sw.js` (e.g. `wpf-v2`) so installed copies pick up the update.

## Your data

Profiles, workouts and settings live in your browser's `localStorage` on the device you use. Nothing is uploaded anywhere. Use **Profiles → Export backup** to save a JSON copy, and **Import backup** to move to another device. Clearing site data erases the app's data.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | App shell |
| `styles.css` | Styling (dark/light automatic) |
| `exercises.js` | Exercise library, muscles and equipment lists |
| `anim*.js` | Exercise animations: engine, movement templates, and the exercise → animation map |
| `cardio.js` | Calorie (MET) maths, GPS distance filtering, daily totals, Apple Health link parsing |
| `cardio-ui.js` | Cardio tab: live tracker, manual log, Health sync UI |
| `app.js` | Profiles, generator, logging, history, UI |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline support and home-screen install |
