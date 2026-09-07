import Foundation
import AppKit
import Carbon

class ClipboardService {
    static let shared = ClipboardService()

    private init() {}

    /// Copy text to system clipboard
    func copyToClipboard(text: String) {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(text, forType: .string)
    }

    /// Check if Accessibility is trusted
    func isAccessibilityTrusted() -> Bool {
        return AXIsProcessTrusted()
    }

    /// Prompt user to grant Accessibility permissions in System Settings
    func promptAccessibilityPermission() {
        let options: NSDictionary = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true]
        AXIsProcessTrustedWithOptions(options)
    }

    /// Insert text once directly into the active text field using a single atomic Cmd+V event
    func insertText(text: String, targetApp: NSRunningApplication? = nil) {
        // 1. Put text on clipboard
        copyToClipboard(text: text)

        // 2. Reactivate the target application if needed
        if let app = targetApp, app.bundleIdentifier != Bundle.main.bundleIdentifier {
            app.activate()
        }

        // 3. Single atomic Cmd+V dispatch
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) {
            let src = CGEventSource(stateID: .privateState)
            let vKeyCode: CGKeyCode = 0x09 // Virtual key code for 'V'

            guard let vDown = CGEvent(keyboardEventSource: src, virtualKey: vKeyCode, keyDown: true),
                  let vUp = CGEvent(keyboardEventSource: src, virtualKey: vKeyCode, keyDown: false) else {
                return
            }

            vDown.flags = .maskCommand
            vUp.flags = .maskCommand

            // Post exactly one paste event to the annotated session tap
            vDown.post(tap: .cgAnnotatedSessionEventTap)
            vUp.post(tap: .cgAnnotatedSessionEventTap)
        }
    }
}
