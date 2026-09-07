import Foundation
import Carbon
import AppKit

class HotkeyService: ObservableObject {
    static let shared = HotkeyService()

    @Published var isListening: Bool = false
    var onVoiceHotkeyPressed: (() -> Void)?
    var onTextHotkeyPressed: (() -> Void)?

    private var voiceHotKeyRef: EventHotKeyRef?
    private var textHotKeyRef: EventHotKeyRef?
    private var eventHandler: EventHandlerRef?

    private init() {}

    /// Start listening for global hotkeys via Carbon Events
    func startMonitoring() {
        stopMonitoring()

        var eventType = EventTypeSpec(
            eventClass: OSType(kEventClassKeyboard),
            eventKind: UInt32(kEventHotKeyPressed)
        )

        let handlerBlock: EventHandlerUPP = { _, event, userData -> OSStatus in
            guard let event = event, let userData = userData else { return noErr }
            let service = Unmanaged<HotkeyService>.fromOpaque(userData).takeUnretainedValue()

            var hotKeyID = EventHotKeyID()
            let status = GetEventParameter(
                event,
                EventParamName(kEventParamDirectObject),
                EventParamType(typeEventHotKeyID),
                nil,
                MemoryLayout<EventHotKeyID>.size,
                nil,
                &hotKeyID
            )

            if status == noErr {
                if hotKeyID.id == 1 {
                    DispatchQueue.main.async {
                        service.onVoiceHotkeyPressed?()
                    }
                } else if hotKeyID.id == 2 {
                    DispatchQueue.main.async {
                        service.onTextHotkeyPressed?()
                    }
                }
            }
            return noErr
        }

        let selfPtr = UnsafeMutableRawPointer(Unmanaged.passUnretained(self).toOpaque())
        InstallEventHandler(GetApplicationEventTarget(), handlerBlock, 1, &eventType, selfPtr, &eventHandler)

        // Hotkey 1: Option + Space for Voice (kVK_Space = 49)
        let voiceHotKeyID = EventHotKeyID(signature: OSType(0x56544541), id: 1) // 'VTEA'
        RegisterEventHotKey(
            UInt32(kVK_Space),
            UInt32(optionKey),
            voiceHotKeyID,
            GetApplicationEventTarget(),
            0,
            &voiceHotKeyRef
        )

        // Hotkey 2: Option + I for Text-to-English (kVK_ANSI_I = 34)
        let textHotKeyID = EventHotKeyID(signature: OSType(0x56544542), id: 2) // 'VTEB'
        RegisterEventHotKey(
            UInt32(kVK_ANSI_I),
            UInt32(optionKey),
            textHotKeyID,
            GetApplicationEventTarget(),
            0,
            &textHotKeyRef
        )

        isListening = true
    }

    /// Stop listening for hotkeys
    func stopMonitoring() {
        if let ref = voiceHotKeyRef {
            UnregisterEventHotKey(ref)
            voiceHotKeyRef = nil
        }
        if let ref = textHotKeyRef {
            UnregisterEventHotKey(ref)
            textHotKeyRef = nil
        }
        if let handler = eventHandler {
            RemoveEventHandler(handler)
            eventHandler = nil
        }
        isListening = false
    }
}
