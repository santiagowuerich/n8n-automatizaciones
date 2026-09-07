import Foundation
import SwiftUI
import AppKit
import Speech

@MainActor
class AppCoordinator: ObservableObject {
    static let shared = AppCoordinator()

    @Published var isRecording: Bool = false
    @Published var isProcessing: Bool = false
    @Published var recordingDuration: TimeInterval = 0
    @Published var statusText: String = "Ready"
    @Published var lastOriginalText: String = ""
    @Published var lastTranslation: String = ""
    @Published var errorMessage: String?

    private var activeApplicationBeforeRecording: NSRunningApplication?
    private var maxRecordingSafetyTimer: Timer?

    private let audioRecorder = AudioRecorderService.shared
    private let groqService = GroqService.shared
    private let speechService = AppleSpeechService.shared
    private let translationService = TranslationService.shared
    private let clipboardService = ClipboardService.shared
    private let hotkeyService = HotkeyService.shared
    private let hudManager = HUDWindowManager.shared

    private init() {
        registerUserDefaults()
        setupHotkey()
    }

    private func registerUserDefaults() {
        UserDefaults.standard.register(defaults: [
            "use_llama_prompt_refiner": true,
            "speech_locale": "es-AR"
        ])
    }

    private func setupHotkey() {
        hotkeyService.onVoiceHotkeyPressed = { [weak self] in
            Task { @MainActor in
                self?.toggleRecording()
            }
        }
        hotkeyService.onTextHotkeyPressed = { [weak self] in
            Task { @MainActor in
                self?.showQuickTextTranslate()
            }
        }
        hotkeyService.startMonitoring()
    }

    /// Show the Quick Text-to-English translation bar
    func showQuickTextTranslate() {
        let currentApp = NSWorkspace.shared.frontmostApplication
        if currentApp?.bundleIdentifier != Bundle.main.bundleIdentifier {
            activeApplicationBeforeRecording = currentApp
        }
        hudManager.showTextHUD(with: self)
    }

    /// Dismiss Quick Text HUD
    func dismissQuickTextTranslate() {
        hudManager.hideTextHUD()
    }

    /// Process typed text translation and insert at cursor
    func processTextTranslation(text: String) {
        let groqApiKey = (UserDefaults.standard.string(forKey: "groq_api_key") ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let targetApp = activeApplicationBeforeRecording

        isProcessing = true
        statusText = "Translating text..."

        Task {
            do {
                var translatedText = ""
                if !groqApiKey.isEmpty {
                    translatedText = try await groqService.refineToEnglishPrompt(spokenText: text, apiKey: groqApiKey)
                } else {
                    translatedText = await translationService.translateToEnglish(text: text)
                }

                let cleanResult = translatedText.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !cleanResult.isEmpty else {
                    self.isProcessing = false
                    self.dismissQuickTextTranslate()
                    return
                }

                self.lastOriginalText = text
                self.lastTranslation = cleanResult
                self.isProcessing = false

                // Dismiss input HUD
                self.dismissQuickTextTranslate()

                // Insert directly into the active field
                self.clipboardService.insertText(text: cleanResult, targetApp: targetApp)

                // Play chime
                NSSound(named: "Glass")?.play()
            } catch {
                self.isProcessing = false
                self.dismissQuickTextTranslate()
                NSSound(named: "Basso")?.play()
            }
        }
    }

    /// Toggle recording on / off
    func toggleRecording() {
        if isRecording {
            stopAndProcess()
        } else {
            startRecording()
        }
    }

    private func startRecording() {
        let currentApp = NSWorkspace.shared.frontmostApplication
        if currentApp?.bundleIdentifier != Bundle.main.bundleIdentifier {
            activeApplicationBeforeRecording = currentApp
        }

        errorMessage = nil
        lastTranslation = ""
        lastOriginalText = ""

        // Show Non-Interfering Floating HUD
        hudManager.showHUD(with: self)

        Task {
            let hasMicAccess = await audioRecorder.requestMicrophonePermission()
            guard hasMicAccess else {
                errorMessage = "Mic blocked in macOS Settings"
                statusText = "Mic Blocked"
                NSSound(named: "Basso")?.play()
                hudManager.scheduleAutoDismiss(seconds: 3.0)
                return
            }

            audioRecorder.startRecording()
            isRecording = true
            statusText = "Listening..."
            NSSound(named: "Tink")?.play()

            // Max 60-second safety cutoff to prevent runaway recording
            maxRecordingSafetyTimer?.invalidate()
            maxRecordingSafetyTimer = Timer.scheduledTimer(withTimeInterval: 60.0, repeats: false) { [weak self] _ in
                Task { @MainActor in
                    if self?.isRecording == true {
                        self?.stopAndProcess()
                    }
                }
            }

            Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] timer in
                Task { @MainActor in
                    guard let self = self, self.isRecording else {
                        timer.invalidate()
                        return
                    }
                    self.recordingDuration = self.audioRecorder.recordingDuration
                }
            }
        }
    }

    private func stopAndProcess() {
        maxRecordingSafetyTimer?.invalidate()
        maxRecordingSafetyTimer = nil

        isRecording = false
        isProcessing = true
        statusText = "Refining prompt..."
        NSSound(named: "Pop")?.play()

        guard let audioURL = audioRecorder.stopRecording() else {
            isProcessing = false
            statusText = "Error"
            errorMessage = "Audio capture failed"
            hudManager.scheduleAutoDismiss(seconds: 3.0)
            return
        }

        let groqApiKey = (UserDefaults.standard.string(forKey: "groq_api_key") ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let useRefiner = UserDefaults.standard.bool(forKey: "use_llama_prompt_refiner")
        let targetApp = activeApplicationBeforeRecording

        Task {
            do {
                var rawTranscript = ""
                var finalPrompt = ""

                // 1. Primary Engine: Groq Whisper + Llama/GPT
                if !groqApiKey.isEmpty {
                    do {
                        self.statusText = "Transcribing..."
                        rawTranscript = try await groqService.transcribeAudio(audioFileURL: audioURL, apiKey: groqApiKey)
                        self.lastOriginalText = rawTranscript

                        if !rawTranscript.isEmpty && useRefiner {
                            self.statusText = "Crafting prompt..."
                            finalPrompt = try await groqService.refineToEnglishPrompt(spokenText: rawTranscript, apiKey: groqApiKey)
                        } else {
                            finalPrompt = rawTranscript
                        }
                    } catch {
                        // Fallback gracefully to local Apple Speech on Groq rate limit / network error
                        print("Groq failed (\(error.localizedDescription)), falling back to Apple Speech...")
                        self.statusText = "Fallback to Local..."
                        let locale = UserDefaults.standard.string(forKey: "speech_locale") ?? "es-AR"
                        rawTranscript = try await speechService.transcribeAudio(url: audioURL, localeIdentifier: locale)
                        self.lastOriginalText = rawTranscript
                        finalPrompt = await translationService.translateToEnglish(text: rawTranscript)
                    }
                } else {
                    // 2. Local Engine: Apple Speech + Translation
                    self.statusText = "Transcribing..."
                    let locale = UserDefaults.standard.string(forKey: "speech_locale") ?? "es-AR"
                    rawTranscript = try await speechService.transcribeAudio(url: audioURL, localeIdentifier: locale)
                    self.lastOriginalText = rawTranscript
                    finalPrompt = await translationService.translateToEnglish(text: rawTranscript)
                }

                // Cleanup audio file
                try? FileManager.default.removeItem(at: audioURL)

                // Guard against silent / empty recordings
                let cleanFinal = finalPrompt.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !cleanFinal.isEmpty else {
                    self.isProcessing = false
                    self.statusText = "No Speech Detected"
                    self.hudManager.scheduleAutoDismiss(seconds: 2.0)
                    return
                }

                self.lastTranslation = cleanFinal
                self.isProcessing = false
                self.statusText = "Pasted & Ready"

                // Insert directly into the active text field
                clipboardService.insertText(text: cleanFinal, targetApp: targetApp)

                // Play success chime
                NSSound(named: "Glass")?.play()

                // Auto-dismiss HUD
                hudManager.scheduleAutoDismiss(seconds: 1.5)
            } catch {
                try? FileManager.default.removeItem(at: audioURL)
                self.isProcessing = false
                self.statusText = "Error"
                self.errorMessage = error.localizedDescription
                NSSound(named: "Basso")?.play()
                hudManager.scheduleAutoDismiss(seconds: 3.0)
            }
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        _ = AppCoordinator.shared
    }
}
