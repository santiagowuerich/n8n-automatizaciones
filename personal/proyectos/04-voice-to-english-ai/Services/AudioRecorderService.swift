import Foundation
import AVFoundation

struct AudioInputDevice: Identifiable, Hashable {
    let id: String
    let name: String
}

@MainActor
class AudioRecorderService: NSObject, ObservableObject, AVAudioRecorderDelegate, AVCaptureFileOutputRecordingDelegate {
    static let shared = AudioRecorderService()

    @Published var isRecording: Bool = false
    @Published var recordingDuration: TimeInterval = 0
    @Published var lastError: String?
    @Published var availableMicrophones: [AudioInputDevice] = []

    private var audioRecorder: AVAudioRecorder?
    private var captureSession: AVCaptureSession?
    private var audioFileOutput: AVCaptureAudioFileOutput?
    private var recordingTimer: Timer?
    private var recordingURL: URL?

    override init() {
        super.init()
        refreshAvailableMicrophones()
    }

    /// Refresh list of available audio input devices
    func refreshAvailableMicrophones() {
        let discovery = AVCaptureDevice.DiscoverySession(
            deviceTypes: [.microphone, .external],
            mediaType: .audio,
            position: .unspecified
        )

        var devices: [AudioInputDevice] = [
            AudioInputDevice(id: "default", name: "Por Defecto del Sistema")
        ]

        for device in discovery.devices {
            devices.append(AudioInputDevice(id: device.uniqueID, name: device.localizedName))
        }

        self.availableMicrophones = devices
    }

    /// Check and request microphone permissions on macOS
    func requestMicrophonePermission() async -> Bool {
        let status = AVCaptureDevice.authorizationStatus(for: .audio)
        if status == .authorized {
            return true
        } else if status == .denied || status == .restricted {
            return false
        }

        if #available(macOS 14.0, *) {
            return await AVCaptureDevice.requestAccess(for: .audio)
        } else {
            return await withCheckedContinuation { continuation in
                AVCaptureDevice.requestAccess(for: .audio) { granted in
                    continuation.resume(returning: granted)
                }
            }
        }
    }

    /// Start recording audio using selected microphone
    func startRecording() {
        let selectedDeviceID = UserDefaults.standard.string(forKey: "selected_microphone_id") ?? "default"
        let tempDir = FileManager.default.temporaryDirectory

        // Strategy A: Specific Microphone selected via AVCaptureSession
        if selectedDeviceID != "default", let targetDevice = AVCaptureDevice(uniqueID: selectedDeviceID) {
            let url = tempDir.appendingPathComponent("voice_input_\(UUID().uuidString).m4a")
            recordingURL = url
            startCaptureSessionRecording(device: targetDevice, outputURL: url)
        } else {
            // Strategy B: Standard Default Recorder
            let url = tempDir.appendingPathComponent("voice_input_\(UUID().uuidString).wav")
            recordingURL = url
            startStandardAudioRecording(outputURL: url)
        }
    }

    private func startStandardAudioRecording(outputURL: URL) {
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatLinearPCM),
            AVSampleRateKey: 16000.0,
            AVNumberOfChannelsKey: 1,
            AVLinearPCMBitDepthKey: 16,
            AVLinearPCMIsFloatKey: false,
            AVLinearPCMIsBigEndianKey: false
        ]

        do {
            audioRecorder = try AVAudioRecorder(url: outputURL, settings: settings)
            audioRecorder?.delegate = self
            audioRecorder?.prepareToRecord()
            audioRecorder?.record()

            startRecordingState()
        } catch {
            lastError = "Recording failed to start: \(error.localizedDescription)"
            isRecording = false
        }
    }

    private func startCaptureSessionRecording(device: AVCaptureDevice, outputURL: URL) {
        do {
            let session = AVCaptureSession()
            let input = try AVCaptureDeviceInput(device: device)

            if session.canAddInput(input) {
                session.addInput(input)
            }

            let fileOutput = AVCaptureAudioFileOutput()
            if session.canAddOutput(fileOutput) {
                session.addOutput(fileOutput)
            }

            session.startRunning()
            fileOutput.startRecording(to: outputURL, outputFileType: .m4a, recordingDelegate: self)

            self.captureSession = session
            self.audioFileOutput = fileOutput

            startRecordingState()
        } catch {
            // Fallback to standard recording
            startStandardAudioRecording(outputURL: outputURL)
        }
    }

    private func startRecordingState() {
        isRecording = true
        recordingDuration = 0
        lastError = nil

        recordingTimer?.invalidate()
        recordingTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self = self, self.isRecording else { return }
                self.recordingDuration += 0.1
            }
        }
    }

    /// Stop recording and return the URL to the temporary audio file
    func stopRecording() -> URL? {
        recordingTimer?.invalidate()
        recordingTimer = nil

        // Stop standard recorder
        audioRecorder?.stop()
        audioRecorder = nil

        // Stop capture session if active
        if let fileOutput = audioFileOutput {
            if fileOutput.isRecording {
                fileOutput.stopRecording()
            }
            // Brief sleep to allow the audio buffer to flush to disk
            Thread.sleep(forTimeInterval: 0.08)
        }
        captureSession?.stopRunning()
        captureSession = nil
        audioFileOutput = nil

        isRecording = false
        return recordingURL
    }

    /// Cancel active recording and discard audio file
    func cancelRecording() {
        _ = stopRecording()
        if let url = recordingURL {
            try? FileManager.default.removeItem(at: url)
            recordingURL = nil
        }
    }

    // MARK: - AVCaptureFileOutputRecordingDelegate
    nonisolated func fileOutput(_ output: AVCaptureFileOutput, didFinishRecordingTo outputFileURL: URL, from connections: [AVCaptureConnection], error: Error?) {
        // Handled upon completion
    }
}
