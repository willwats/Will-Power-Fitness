# Will Power Fitness — iPhone app (scaffold)

**Status: unverified scaffold.** It was written without being able to install packages or build on a Mac, so it has not been run. Expect to fix small things.

## What you need
- A Mac with Xcode (free), Node 18+
- A free Apple ID to run on your own phone (7-day signing); a paid Apple Developer account ($99/yr) for TestFlight / App Store

## Steps
```
cd native
npm install
npm run ios:add     # creates the Xcode project
npm run ios:sync    # copies the web app into it
npm run ios:open    # opens Xcode — pick your iPhone, press Run
```

## Why go native?
The web app can't read Apple Health automatically (Safari has no HealthKit access). The Shortcuts bridge in the Cardio tab is the workaround. A native build can add a HealthKit plugin to read steps/calories/workouts and write workouts directly. That plugin is **not included yet** — it needs a Capacitor HealthKit plugin, the HealthKit capability in Xcode, and an `NSHealthShareUsageDescription` entry in Info.plist.
