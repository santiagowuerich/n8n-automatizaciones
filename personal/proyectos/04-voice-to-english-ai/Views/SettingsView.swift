import SwiftUI
import Speech
import AVFoundation

struct SettingsView: View {
    @AppStorage("groq_api_key") private var groqApiKey: String = ""
    @AppStorage("selected_microphone_id") private var selectedMicrophoneId: String = "default"
    @AppStorage("use_llama_prompt_refiner") private var useLlamaPromptRefiner: Bool = true
    @AppStorage("auto_paste_enabled") private var autoPasteEnabled: Bool = true
    @AppStorage("speech_locale") private var speechLocale: String = "es-AR"

    @ObservedObject private var audioRecorder = AudioRecorderService.shared
    @State private var isAccessibilityGranted: Bool = AXIsProcessTrusted()
    @State private var speechAuthStatus: SFSpeechRecognizerAuthorizationStatus = SFSpeechRecognizer.authorizationStatus()

    var body: some View {
        Form {
            Section(header: Text("Dispositivo de Audio").font(.headline)) {
                Picker("Micrófono de entrada:", selection: $selectedMicrophoneId) {
                    ForEach(audioRecorder.availableMicrophones) { mic in
                        Text(mic.name).tag(mic.id)
                    }
                }
                .pickerStyle(.menu)

                Button("Refrescar Micrófonos") {
                    audioRecorder.refreshAvailableMicrophones()
                }
                .font(.caption)
            }

            Section(header: Text("Groq AI (Ultra Rápido)").font(.headline)) {
                HStack {
                    SecureField("gsk_...", text: $groqApiKey)
                        .textFieldStyle(.roundedBorder)
                    Button("Obtener Key Gratis") {
                        if let url = URL(string: "https://console.groq.com/keys") {
                            NSWorkspace.shared.open(url)
                        }
                    }
                    .buttonStyle(.bordered)
                }

                Toggle("Optimizar prompt con Groq (Reescribe a inglés técnico)", isOn: $useLlamaPromptRefiner)
                Text("Usa Whisper Large V3 + GPT-OSS en Groq para traducir y estructurar prompts en <200ms. Si no tenés clave, usará Apple Speech local.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Section(header: Text("Permisos de macOS").font(.headline)) {
                // Speech Recognition Permission
                HStack {
                    Image(systemName: speechAuthStatus == .authorized ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                        .foregroundColor(speechAuthStatus == .authorized ? .green : .orange)
                    Text(speechAuthStatus == .authorized ? "Reconocimiento de Voz: Autorizado" : "Reconocimiento de Voz: Pendiente")
                    Spacer()
                    if speechAuthStatus != .authorized {
                        Button("Solicitar") {
                            Task {
                                _ = await AppleSpeechService.shared.requestSpeechAuthorization()
                                speechAuthStatus = SFSpeechRecognizer.authorizationStatus()
                            }
                        }
                    }
                }

                // Accessibility Permission
                HStack {
                    Image(systemName: isAccessibilityGranted ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                        .foregroundColor(isAccessibilityGranted ? .green : .orange)
                    Text(isAccessibilityGranted ? "Accesibilidad (Pegado Automático): Autorizado" : "Accesibilidad: Requiere Permiso")
                    Spacer()
                    if !isAccessibilityGranted {
                        Button("Conceder") {
                            ClipboardService.shared.promptAccessibilityPermission()
                            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                                isAccessibilityGranted = AXIsProcessTrusted()
                            }
                        }
                    }
                }
            }
            .font(.caption)

            Section(header: Text("Atajos Globales").font(.headline)) {
                HStack {
                    Text("Voz a Inglés (Hablar):")
                    Spacer()
                    Text("⌥ Option + Space")
                        .font(.system(.body, design: .monospaced))
                        .padding(4)
                        .background(Color.secondary.opacity(0.15))
                        .cornerRadius(6)
                }

                HStack {
                    Text("Texto a Inglés (Escribir):")
                    Spacer()
                    Text("⌥ Option + I")
                        .font(.system(.body, design: .monospaced))
                        .padding(4)
                        .background(Color.secondary.opacity(0.15))
                        .cornerRadius(6)
                }
            }
        }
        .padding(20)
        .frame(width: 520, height: 460)
        .onAppear {
            audioRecorder.refreshAvailableMicrophones()
            speechAuthStatus = SFSpeechRecognizer.authorizationStatus()
            isAccessibilityGranted = AXIsProcessTrusted()
        }
    }
}
