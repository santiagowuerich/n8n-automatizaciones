import SwiftUI

struct MenuBarView: View {
    @ObservedObject var appCoordinator: AppCoordinator
    @ObservedObject private var audioRecorder = AudioRecorderService.shared
    @AppStorage("selected_microphone_id") private var selectedMicrophoneId: String = "default"
    @Environment(\.openSettings) private var openSettings

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header & Status
            HStack {
                Circle()
                    .fill(appCoordinator.isRecording ? Color.red : (appCoordinator.isProcessing ? Color.orange : Color.green))
                    .frame(width: 10, height: 10)
                Text(appCoordinator.statusText)
                    .font(.headline)
                Spacer()
                if appCoordinator.isRecording {
                    Text(String(format: "%.1fs", appCoordinator.recordingDuration))
                        .font(.system(.subheadline, design: .monospaced))
                        .foregroundColor(.red)
                }
            }

            Divider()

            // Main Action Button
            Button(action: {
                appCoordinator.toggleRecording()
            }) {
                HStack {
                    Image(systemName: appCoordinator.isRecording ? "stop.circle.fill" : "mic.circle.fill")
                        .font(.title2)
                    Text(appCoordinator.isRecording ? "Detener y Traducir" : "Iniciar Grabación")
                        .fontWeight(.semibold)
                    Spacer()
                    Text("⌥ Space")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(8)
            }
            .buttonStyle(.borderedProminent)
            .tint(appCoordinator.isRecording ? .red : .blue)
            .disabled(appCoordinator.isProcessing)

            // Quick Microphone Selector
            VStack(alignment: .leading, spacing: 4) {
                Text("Micrófono:")
                    .font(.caption2)
                    .foregroundColor(.secondary)
                
                Picker("", selection: $selectedMicrophoneId) {
                    ForEach(audioRecorder.availableMicrophones) { mic in
                        Text(mic.name).tag(mic.id)
                    }
                }
                .pickerStyle(.menu)
                .labelsHidden()
            }

            // Result Preview
            if !appCoordinator.lastTranslation.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    if !appCoordinator.lastOriginalText.isEmpty && appCoordinator.lastOriginalText != appCoordinator.lastTranslation {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Voz:")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            Text(appCoordinator.lastOriginalText)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .lineLimit(2)
                        }
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Prompt pegado:")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Text(appCoordinator.lastTranslation)
                            .font(.callout)
                            .padding(8)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.secondary.opacity(0.1))
                            .cornerRadius(6)
                            .textSelection(.enabled)
                    }
                }
            }

            // Error Display
            if let error = appCoordinator.errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
                    .padding(6)
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(4)
            }

            Divider()

            // Footer
            HStack {
                Button("Configuración...") {
                    openSettings()
                    NSApp.activate(ignoringOtherApps: true)
                }
                Spacer()
                Button("Salir") {
                    NSApplication.shared.terminate(nil)
                }
            }
            .buttonStyle(.plain)
            .font(.caption)
        }
        .padding(14)
        .frame(width: 320)
        .onAppear {
            audioRecorder.refreshAvailableMicrophones()
        }
    }
}
