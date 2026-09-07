import Foundation
import AppKit
import SwiftUI

class FloatingInputPanel: NSPanel {
    override var canBecomeKey: Bool { return true }
    override var canBecomeMain: Bool { return true }
}

@MainActor
class HUDWindowManager: NSObject {
    static let shared = HUDWindowManager()

    private var hudPanel: NSPanel?
    private var textHUDPanel: FloatingInputPanel?
    private var autoDismissTimer: Timer?

    private override init() {
        super.init()
    }

    /// Show the compact micro-pill persistently at the top center of the screen
    func showHUD(with coordinator: AppCoordinator) {
        autoDismissTimer?.invalidate()
        autoDismissTimer = nil

        if hudPanel == nil {
            createVoicePanel(with: coordinator)
        }

        guard let panel = hudPanel else { return }

        let panelWidth: CGFloat = 260
        let panelHeight: CGFloat = 48

        // Persistent top-center positioning on active screen
        let mouseLocation = NSEvent.mouseLocation
        let screen = NSScreen.screens.first(where: { NSMouseInRect(mouseLocation, $0.frame, false) }) ?? NSScreen.main ?? NSScreen.screens[0]
        let screenFrame = screen.visibleFrame

        let xPos = screenFrame.midX - (panelWidth / 2)
        let yPos = screenFrame.maxY - panelHeight - 10 // Pinned to the top center!

        panel.setFrame(NSRect(x: xPos, y: yPos, width: panelWidth, height: panelHeight), display: true)

        panel.alphaValue = 0
        panel.orderFrontRegardless()

        NSAnimationContext.runAnimationGroup { context in
            context.duration = 0.12
            panel.animator().alphaValue = 1.0
        }
    }

    /// Hide the micro-pill with a smooth fast fade
    func hideHUD() {
        autoDismissTimer?.invalidate()
        autoDismissTimer = nil

        guard let panel = hudPanel, panel.isVisible else { return }

        NSAnimationContext.runAnimationGroup({ context in
            context.duration = 0.15
            panel.animator().alphaValue = 0.0
        }) {
            panel.orderOut(nil)
        }
    }

    /// Show the Quick Text-to-English translation input bar at the top center of the screen
    func showTextHUD(with coordinator: AppCoordinator) {
        if textHUDPanel == nil {
            createTextPanel(with: coordinator)
        }

        guard let panel = textHUDPanel else { return }

        let panelWidth: CGFloat = 540
        let panelHeight: CGFloat = 64

        let mouseLocation = NSEvent.mouseLocation
        let screen = NSScreen.screens.first(where: { NSMouseInRect(mouseLocation, $0.frame, false) }) ?? NSScreen.main ?? NSScreen.screens[0]
        let screenFrame = screen.visibleFrame

        let xPos = screenFrame.midX - (panelWidth / 2)
        let yPos = screenFrame.maxY - panelHeight - 16

        panel.setFrame(NSRect(x: xPos, y: yPos, width: panelWidth, height: panelHeight), display: true)

        panel.alphaValue = 0
        panel.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)

        NSAnimationContext.runAnimationGroup { context in
            context.duration = 0.12
            panel.animator().alphaValue = 1.0
        }
    }

    /// Hide the Quick Text HUD
    func hideTextHUD() {
        guard let panel = textHUDPanel, panel.isVisible else { return }

        NSAnimationContext.runAnimationGroup({ context in
            context.duration = 0.15
            panel.animator().alphaValue = 0.0
        }) {
            panel.orderOut(nil)
        }
    }

    /// Auto-dismiss timer after paste
    func scheduleAutoDismiss(seconds: TimeInterval = 1.2) {
        autoDismissTimer?.invalidate()
        autoDismissTimer = Timer.scheduledTimer(withTimeInterval: seconds, repeats: false) { [weak self] _ in
            Task { @MainActor in
                self?.hideHUD()
                self?.hideTextHUD()
            }
        }
    }

    private func createVoicePanel(with coordinator: AppCoordinator) {
        let panel = NSPanel(
            contentRect: NSRect(x: 0, y: 0, width: 240, height: 48),
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )

        panel.level = .floating
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        panel.isMovableByWindowBackground = false
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
        panel.ignoresMouseEvents = false
        panel.hidesOnDeactivate = false

        let hostingView = NSHostingView(rootView: FloatingHUDView(appCoordinator: coordinator))
        hostingView.wantsLayer = true
        hostingView.layer?.backgroundColor = NSColor.clear.cgColor
        panel.contentView = hostingView

        hudPanel = panel
    }

    private func createTextPanel(with coordinator: AppCoordinator) {
        let panel = FloatingInputPanel(
            contentRect: NSRect(x: 0, y: 0, width: 520, height: 64),
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )

        panel.level = .floating
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        panel.isMovableByWindowBackground = true
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
        panel.hidesOnDeactivate = false

        let hostingView = NSHostingView(rootView: QuickTranslateHUDView(appCoordinator: coordinator))
        hostingView.wantsLayer = true
        hostingView.layer?.backgroundColor = NSColor.clear.cgColor
        panel.contentView = hostingView

        textHUDPanel = panel
    }
}
