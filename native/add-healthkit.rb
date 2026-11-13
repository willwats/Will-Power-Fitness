# Adds the HealthKit plugin, entitlements and capability to the Xcode project made by `npx cap add ios`.
# Safe to run more than once.
require 'xcodeproj'
require 'fileutils'

root = File.expand_path('ios/App', __dir__)
proj_path = File.join(root, 'App.xcodeproj')
abort 'Run `npm run ios:add` first (ios/App/App.xcodeproj not found).' unless File.exist?(proj_path)

%w[HealthBridgePlugin.swift MainViewController.swift App.entitlements].each do |f|
  FileUtils.cp(File.join(__dir__, 'ios-src', f), File.join(root, 'App', f))
end

proj = Xcodeproj::Project.open(proj_path)
target = proj.targets.find { |t| t.name == 'App' } or abort 'App target not found'
group = proj.main_group['App']

%w[HealthBridgePlugin.swift MainViewController.swift].each do |f|
  next if group.files.any? { |r| r.path == f }
  ref = group.new_file(f)
  target.add_file_references([ref])
end
group.new_file('App.entitlements') unless group.files.any? { |r| r.path == 'App.entitlements' }

target.build_configurations.each do |c|
  c.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'App/App.entitlements'
end
attrs = (proj.root_object.attributes['TargetAttributes'] ||= {})
attrs[target.uuid] ||= {}
attrs[target.uuid]['SystemCapabilities'] = (attrs[target.uuid]['SystemCapabilities'] || {}).merge('com.apple.HealthKit' => { 'enabled' => '1' })
proj.save

# Info.plist: why we ask for Health access
plist = File.join(root, 'App', 'Info.plist')
{ 'NSHealthShareUsageDescription' => 'Will Power Fitness shows your calories, steps, workouts and activity rings.',
  'NSHealthUpdateUsageDescription' => 'Will Power Fitness saves the workouts you log to Apple Health.' }.each do |k, v|
  system('/usr/libexec/PlistBuddy', '-c', "Delete :#{k}", plist, out: File::NULL, err: File::NULL)
  system('/usr/libexec/PlistBuddy', '-c', "Add :#{k} string #{v}", plist) or abort "Could not edit Info.plist"
end

# Storyboard: use our MainViewController so the plugin gets registered
sb = File.join(root, 'App', 'Base.lproj', 'Main.storyboard')
if File.exist?(sb)
  s = File.read(sb)
  s = s.gsub('customClass="CAPBridgeViewController" customModule="Capacitor"', 'customClass="MainViewController" customModule="App"')
  File.write(sb, s)
end
puts 'HealthKit added. Open Xcode, pick your Team under Signing & Capabilities, then Run.'
