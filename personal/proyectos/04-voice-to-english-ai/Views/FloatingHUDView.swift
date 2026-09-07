import SwiftUI

struct FloatingHUDView: View {
    @ObservedObject var appCoordinator: AppCoordinator
    @State private var pulse: Bool = false
    @State private var isHovered: Bool = false

    var body: some View {
        Button(action: {
            if appCoordinator.isRecording {
                appCoordinator.toggleRecording()
            }
        }) {
            HStack(spacing: 8) {
                if appCoordinator.isRecording {
                    Circle()
                        .fill(Color.red)
                        .frame(width: 8, height: 8)
                        .scaleEffect(pulse ? 1.3 : 0.8)
                        .animation(Animation.easeInOut(duration: 0.5).repeatForever(autoreverses: true), value: pulse)
                        .onAppear { pulse = true }

                    Text("Recording")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)
                        .fixedSize()

                    Text(String(format: "%.1fs", appCoordinator.recordingDuration))
                        .font(.system(size: 11, weight: .bold, design: .monospaced))
                        .foregroundColor(Color(red: 1.0, green: 0.4, blue: 0.4))
                        .lineLimit(1)
                        .fixedSize()

                    Image(systemName: "stop.fill")
                        .font(.system(size: 8))
                        .foregroundColor(.white.opacity(0.7))
                        .padding(.leading, 2)
                } else if appCoordinator.isProcessing {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(0.65)
                        .frame(width: 14, height: 14)

                    Text("Translating...")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)
                        .fixedSize()
                } else {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                        .font(.system(size: 13))

                    Text("Pasted")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundColor(.green)
                        .lineLimit(1)
                        .fixedSize()
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(
                Capsule()
                    .fill(Color(red: 0.1, green: 0.1, blue: 0.12).opacity(isHovered && appCoordinator.isRecording ? 0.98 : 0.92))
            )
            .overlay(
                Capsule()
                    .stroke(isHovered && appCoordinator.isRecording ? Color.red.opacity(0.6) : Color.white.opacity(0.18), lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.4), radius: 8, x: 0, y: 4)
            .scaleEffect(isHovered && appCoordinator.isRecording ? 1.03 : 1.0)
            .animation(.spring(response: 0.25, dampingFraction: 0.7), value: isHovered)
            .padding(6)
        }
        .buttonStyle(.plain)
        .onHover { hovering in
            isHovered = hovering
            if hovering && appCoordinator.isRecording {
                NSCursor.pointingHand.push()
            } else {
                NSCursor.pop()
            }
        }
    }
}
