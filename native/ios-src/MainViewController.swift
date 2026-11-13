import UIKit
import Capacitor

/// Registers the local HealthKit plugin with Capacitor's bridge.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(HealthBridgePlugin())
    }
}
