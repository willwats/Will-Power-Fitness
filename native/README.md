# Will Power Fitness — iPhone app (HealthKit)

This wraps the web app in a native iPhone app (Capacitor) and adds a small HealthKit plugin, so the Cardio tab can read your calories, steps, Move/Exercise/Stand rings and workouts straight from Apple Health, and the **Send to Apple Health** buttons write workouts into Health — no Shortcuts.

**Status: unverified.** It was written without a Mac, so it has never been compiled. Expect to fix small things (see Troubleshooting).

## What you need
- A Mac with Xcode 15+ (free) and Node 18+
- Your Apple ID signed in to Xcode. A free account works for running on your own phone (re-install every 7 days). The paid $99/yr program is needed for TestFlight, and HealthKit works on both.
- CocoaPods (`brew install cocoapods`) — Capacitor uses it.

## One-time setup
```
cd native
npm run ios:setup      # installs, creates the Xcode project, adds HealthKit, copies the web app
npx cap open ios       # opens Xcode
```
In Xcode: click the **App** project → **Signing & Capabilities** → choose your **Team** (HealthKit should already be listed; if not, press **+ Capability → HealthKit**). Plug in your iPhone, pick it at the top, press **Run**. On the phone: Settings → General → VPN & Device Management → trust your developer profile if asked.

First launch asks for Health access — allow everything (Active Energy, Resting Energy, Steps, Exercise Minutes, Stand, Workouts). If you tapped "Don't allow": Settings → Health → Data Access & Devices → Will Power Fitness.

## After you change the web app
```
cd native && npm run ios:sync   # copies the latest web files into the app
```
then press Run again in Xcode.

## What it does
- Opens → reads today's Health data (also each time you return to the app).
- Cardio tab → **Sync Apple Health** refreshes on demand; rings use the goals from your Activity summary.
- **Send to Apple Health** (cardio sessions and strength workouts) saves a real workout to Health.
- Your logged data is separate from the website's: the iPhone app and the home-screen website keep their own copies. Export a backup from the website (Me → Export backup) and import it in the app to bring your history over.

## Files
- `ios-src/HealthBridgePlugin.swift` — HealthKit queries and workout writing (JS name `HealthBridge`)
- `ios-src/MainViewController.swift` — registers the plugin
- `ios-src/App.entitlements` — HealthKit entitlement
- `add-healthkit.rb` — adds the files, entitlement, capability and Info.plist texts to the generated Xcode project (needs the `xcodeproj` gem; `ios:setup` installs it)

## Troubleshooting
- `xcodeproj` not found: `gem install xcodeproj --user-install`, then `npm run ios:healthkit`.
- "Cannot find 'HealthBridgePlugin' in scope": in Xcode, check that `HealthBridgePlugin.swift` and `MainViewController.swift` are in the App target (File inspector → Target Membership).
- Plugin "not implemented" in the app: the storyboard must use `MainViewController` (module App) — `add-healthkit.rb` edits `Main.storyboard`; set it by hand in Xcode's Identity inspector if it didn't.
- Build errors in the Swift file: send me the exact message and I'll fix it.
