import SwiftUI
import AppKit

// MARK: - Native AppKit TextField for 100% Reliable Keyboard Focus in Floating Windows
struct NativeFocusTextField: NSViewRepresentable {
    @Binding var text: String
    var placeholder: String
    var onSubmit: () -> Void
    var onCancel: () -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeNSView(context: Context) -> NSTextField {
        let textField = NSTextField()
        textField.placeholderString = placeholder
        textField.isBordered = false
        textField.drawsBackground = false
        textField.focusRingType = .none
        textField.textColor = .white
        textField.font = NSFont.systemFont(ofSize: 13, weight: .medium)
        textField.delegate = context.coordinator

        // Auto-focus immediately
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
            textField.window?.makeFirstResponder(textField)
        }

        return textField
    }

    func updateNSView(_ nsView: NSTextField, context: Context) {
        if nsView.stringValue != text {
            nsView.stringValue = text
        }
    }

    class Coordinator: NSObject, NSTextFieldDelegate {
        var parent: NativeFocusTextField

        init(_ parent: NativeFocusTextField) {
            self.parent = parent
        }

        func controlTextDidChange(_ obj: Notification) {
            if let textField = obj.object as? NSTextField {
                parent.text = textField.stringValue
            }
        }

        func control(_ control: NSControl, textView: NSTextView, doCommandBy commandSelector: Selector) -> Bool {
            if commandSelector == #selector(NSResponder.insertNewline(_:)) {
                parent.onSubmit()
                return true
            } else if commandSelector == #selector(NSResponder.cancelOperation(_:)) {
                parent.onCancel()
                return true
            }
            return false
        }
    }
}

// MARK: - Quick Translate Floating HUD View
struct QuickTranslateHUDView: View {
    @ObservedObject var appCoordinator: AppCoordinator
    @State private var textInput: String = ""

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "character.book.closed.fill")
                .foregroundColor(.cyan)
                .font(.system(size: 15))

            NativeFocusTextField(
                text: $textInput,
                placeholder: "Escribe en español... (Enter: Traducir y Pegar | Esc: Salir)",
                onSubmit: {
                    let trimmed = textInput.trimmingCharacters(in: .whitespacesAndNewlines)
                    if !trimmed.isEmpty {
                        appCoordinator.processTextTranslation(text: trimmed)
                    } else {
                        appCoordinator.dismissQuickTextTranslate()
                    }
                },
                onCancel: {
                    appCoordinator.dismissQuickTextTranslate()
                }
            )
            .frame(height: 24)

            if appCoordinator.isProcessing {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    .scaleEffect(0.65)
                    .frame(width: 16, height: 16)
            } else {
                HStack(spacing: 4) {
                    Text("↵ Enter")
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundColor(.white.opacity(0.8))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(Color.white.opacity(0.12))
                        .cornerRadius(4)

                    Text("Esc")
                        .font(.system(size: 9, weight: .semibold, design: .monospaced))
                        .foregroundColor(.white.opacity(0.6))
                        .padding(.horizontal, 5)
                        .padding(.vertical, 3)
                        .background(Color.white.opacity(0.08))
                        .cornerRadius(4)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color(red: 0.12, green: 0.12, blue: 0.15).opacity(0.96))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.cyan.opacity(0.4), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.55), radius: 12, x: 0, y: 6)
        .padding(8)
    }
}
