import SwiftUI

@main
struct VoiceToEnglishAIApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var appCoordinator = AppCoordinator.shared

    var body: some Scene {
        // macOS Menu Bar Extra
        MenuBarExtra {
            MenuBarView(appCoordinator: appCoordinator)
        } label: {
            HStack(spacing: 4) {
                Image(systemName: appCoordinator.isRecording ? "record.circle.fill" : "mic.fill")
                    .foregroundColor(appCoordinator.isRecording ? .red : .primary)
                if appCoordinator.isRecording {
                    Text(String(format: "%.0fs", appCoordinator.recordingDuration))
                        .font(.caption2)
                }
            }
        }
        .menuBarExtraStyle(.window)

        // Settings / Preferences Window
        Settings {
            SettingsView()
        }
    }
}
