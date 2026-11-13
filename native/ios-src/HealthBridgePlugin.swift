import Foundation
import Capacitor
import HealthKit

/// Minimal HealthKit bridge for Will Power Fitness.
/// JS name: "HealthBridge" — methods: isAvailable, requestAccess, today, saveWorkout.
@objc(HealthBridgePlugin)
public class HealthBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HealthBridgePlugin"
    public let jsName = "HealthBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAccess", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "today", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveWorkout", returnType: CAPPluginReturnPromise),
    ]

    private let store = HKHealthStore()

    private func qty(_ id: HKQuantityTypeIdentifier) -> HKQuantityType { HKQuantityType.quantityType(forIdentifier: id)! }

    private var readTypes: Set<HKObjectType> {
        var s: Set<HKObjectType> = [
            qty(.activeEnergyBurned), qty(.basalEnergyBurned), qty(.stepCount), qty(.appleExerciseTime),
            qty(.distanceWalkingRunning), qty(.distanceCycling),
            HKObjectType.workoutType(), HKObjectType.activitySummaryType(),
        ]
        if let stand = HKObjectType.categoryType(forIdentifier: .appleStandHour) { s.insert(stand) }
        return s
    }
    private var writeTypes: Set<HKSampleType> {
        [HKObjectType.workoutType(), qty(.activeEnergyBurned), qty(.distanceWalkingRunning), qty(.distanceCycling)]
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": HKHealthStore.isHealthDataAvailable()])
    }

    @objc func requestAccess(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { call.reject("Health data is not available on this device"); return }
        store.requestAuthorization(toShare: writeTypes, read: readTypes) { ok, err in
            if let err = err { call.reject(err.localizedDescription) } else { call.resolve(["granted": ok]) }
        }
    }

    private func sum(_ type: HKQuantityType, _ unit: HKUnit, from: Date, to: Date, done: @escaping (Double) -> Void) {
        let pred = HKQuery.predicateForSamples(withStart: from, end: to, options: .strictStartDate)
        let q = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: pred, options: .cumulativeSum) { _, stats, _ in
            done(stats?.sumQuantity()?.doubleValue(for: unit) ?? 0)
        }
        store.execute(q)
    }

    private func workoutName(_ t: HKWorkoutActivityType) -> String {
        switch t {
        case .walking: return "Walking"
        case .running: return "Running"
        case .hiking: return "Hiking"
        case .cycling: return "Cycling"
        case .elliptical: return "Elliptical"
        case .rowing: return "Rowing"
        case .stairClimbing, .stairs: return "Stairs"
        case .swimming: return "Swimming"
        case .highIntensityIntervalTraining: return "High Intensity Interval Training"
        case .jumpRope: return "Jump Rope"
        case .traditionalStrengthTraining, .functionalStrengthTraining: return "Strength Training"
        default: return "Other"
        }
    }

    /// Everything the app shows for today: active/resting kcal, steps, exercise minutes, stand hours, ring goals, workouts.
    @objc func today(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { call.reject("Health data is not available on this device"); return }
        let cal = Calendar.current, now = Date(), start = cal.startOfDay(for: now)
        var out: [String: Any] = [:]
        let lock = NSLock()
        let group = DispatchGroup()
        func put(_ k: String, _ v: Any) { lock.lock(); out[k] = v; lock.unlock() }

        group.enter(); sum(qty(.activeEnergyBurned), .kilocalorie(), from: start, to: now) { put("kcal", $0); group.leave() }
        group.enter(); sum(qty(.basalEnergyBurned), .kilocalorie(), from: start, to: now) { put("rest", $0); group.leave() }
        group.enter(); sum(qty(.stepCount), .count(), from: start, to: now) { put("steps", $0); group.leave() }
        group.enter(); sum(qty(.appleExerciseTime), .minute(), from: start, to: now) { put("exercise", $0); group.leave() }

        // Stand hours: count the hours marked "stood".
        if let standType = HKObjectType.categoryType(forIdentifier: .appleStandHour) {
            group.enter()
            let pred = HKQuery.predicateForSamples(withStart: start, end: now, options: .strictStartDate)
            let q = HKSampleQuery(sampleType: standType, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                let n = (samples as? [HKCategorySample])?.filter { $0.value == HKCategoryValueAppleStandHour.stood.rawValue }.count ?? 0
                put("stand", n); group.leave()
            }
            store.execute(q)
        }

        // Ring goals from today's Activity summary.
        group.enter()
        var comps = cal.dateComponents([.year, .month, .day], from: now); comps.calendar = cal
        let sq = HKActivitySummaryQuery(predicate: HKQuery.predicateForActivitySummary(with: comps)) { _, summaries, _ in
            if let s = summaries?.first {
                put("goals", [
                    "move": s.activeEnergyBurnedGoal.doubleValue(for: .kilocalorie()),
                    "exercise": s.appleExerciseTimeGoal.doubleValue(for: .minute()),
                    "stand": s.appleStandHoursGoal.doubleValue(for: .count()),
                ])
            }
            group.leave()
        }
        store.execute(sq)

        // Today's workouts.
        group.enter()
        let wpred = HKQuery.predicateForSamples(withStart: start, end: now, options: .strictStartDate)
        let wq = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: wpred, limit: HKObjectQueryNoLimit,
                               sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]) { _, samples, _ in
            let list: [[String: Any]] = (samples as? [HKWorkout] ?? []).map { w in
                var kcal = 0.0
                if let e = w.statistics(for: HKQuantityType(.activeEnergyBurned))?.sumQuantity() { kcal = e.doubleValue(for: .kilocalorie()) }
                let meters = w.totalDistance?.doubleValue(for: .meter()) ?? 0
                return ["type": self.workoutName(w.workoutActivityType), "minutes": w.duration / 60.0, "kcal": kcal,
                        "miles": meters / 1609.344, "start": w.startDate.timeIntervalSince1970 * 1000]
            }
            put("workouts", list); group.leave()
        }
        store.execute(wq)

        group.notify(queue: .main) { call.resolve(out) }
    }

    /// Writes a workout into Apple Health. Args: type (string), start/end (ms since epoch), kcal, meters.
    @objc func saveWorkout(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { call.reject("Health data is not available on this device"); return }
        guard let startMs = call.getDouble("start"), let endMs = call.getDouble("end"), endMs > startMs else { call.reject("start and end are required"); return }
        let start = Date(timeIntervalSince1970: startMs / 1000), end = Date(timeIntervalSince1970: endMs / 1000)
        let kcal = call.getDouble("kcal") ?? 0, meters = call.getDouble("meters") ?? 0
        let name = (call.getString("type") ?? "Other").lowercased()

        let config = HKWorkoutConfiguration()
        switch true {
        case name.contains("run"): config.activityType = .running
        case name.contains("walk"): config.activityType = .walking
        case name.contains("hik"): config.activityType = .hiking
        case name.contains("cycl") || name.contains("bike"): config.activityType = .cycling
        case name.contains("ellip"): config.activityType = .elliptical
        case name.contains("row"): config.activityType = .rowing
        case name.contains("stair"): config.activityType = .stairClimbing
        case name.contains("swim"): config.activityType = .swimming
        case name.contains("hiit") || name.contains("interval"): config.activityType = .highIntensityIntervalTraining
        case name.contains("jump"): config.activityType = .jumpRope
        case name.contains("strength"): config.activityType = .traditionalStrengthTraining
        default: config.activityType = .other
        }

        let builder = HKWorkoutBuilder(healthStore: store, configuration: config, device: .local())
        builder.beginCollection(withStart: start) { ok, err in
            if let err = err { call.reject(err.localizedDescription); return }
            var samples: [HKSample] = []
            if kcal > 0 {
                samples.append(HKQuantitySample(type: HKQuantityType(.activeEnergyBurned),
                                                quantity: HKQuantity(unit: .kilocalorie(), doubleValue: kcal), start: start, end: end))
            }
            if meters > 0 {
                let dt: HKQuantityTypeIdentifier = config.activityType == .cycling ? .distanceCycling : .distanceWalkingRunning
                samples.append(HKQuantitySample(type: HKQuantityType(dt), quantity: HKQuantity(unit: .meter(), doubleValue: meters), start: start, end: end))
            }
            let finish = {
                builder.endCollection(withEnd: end) { _, err in
                    if let err = err { call.reject(err.localizedDescription); return }
                    builder.finishWorkout { _, err in
                        if let err = err { call.reject(err.localizedDescription) } else { call.resolve(["saved": true]) }
                    }
                }
            }
            if samples.isEmpty { finish() } else {
                builder.add(samples) { _, err in
                    if let err = err { call.reject(err.localizedDescription) } else { finish() }
                }
            }
        }
    }
}
