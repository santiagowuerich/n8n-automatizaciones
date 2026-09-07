import Foundation
import Speech
import AVFoundation

enum AppleSpeechError: LocalizedError {
    case notAuthorized
    case recognizerUnavailable
    case audioFileNotFound
    case recognitionFailed(String)

    var errorDescription: String? {
        switch self {
        case .notAuthorized:
            return "Speech recognition is not authorized. Enable it in macOS Settings > Privacy & Security > Speech Recognition."
        case .recognizerUnavailable:
            return "Speech recognizer is not available for the selected language."
        case .audioFileNotFound:
            return "Recorded audio file was not found."
        case .recognitionFailed(let message):
            return "Speech recognition failed: \(message)"
        }
    }
}

class AppleSpeechService {
    static let shared = AppleSpeechService()

    private init() {}

    /// Request user authorization for Apple Speech Recognition
    func requestSpeechAuthorization() async -> Bool {
        await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                switch status {
                case .authorized:
                    continuation.resume(returning: true)
                default:
                    continuation.resume(returning: false)
                }
            }
        }
    }

    /// Transcribe audio file using Apple's on-device/native speech engine
    func transcribeAudio(url: URL, localeIdentifier: String = "es-ES") async throws -> String {
        guard FileManager.default.fileExists(atPath: url.path) else {
            throw AppleSpeechError.audioFileNotFound
        }

        let locale = Locale(identifier: localeIdentifier)
        guard let recognizer = SFSpeechRecognizer(locale: locale), recognizer.isAvailable else {
            throw AppleSpeechError.recognizerUnavailable
        }

        let request = SFSpeechURLRecognitionRequest(url: url)
        request.shouldReportPartialResults = false
        // Prefer on-device processing when supported
        if recognizer.supportsOnDeviceRecognition {
            request.requiresOnDeviceRecognition = true
        }

        return try await withCheckedThrowingContinuation { continuation in
            recognizer.recognitionTask(with: request) { result, error in
                if let error = error {
                    continuation.resume(throwing: AppleSpeechError.recognitionFailed(error.localizedDescription))
                    return
                }

                if let result = result, result.isFinal {
                    let transcribed = result.bestTranscription.formattedString
                    continuation.resume(returning: transcribed)
                }
            }
        }
    }
}
