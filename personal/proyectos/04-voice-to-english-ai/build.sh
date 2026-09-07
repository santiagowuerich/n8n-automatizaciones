#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "🔨 Building VoiceToEnglishAI (Stable TCC Identity)..."

APP_NAME="VoiceToEnglishAI"
APP_BUNDLE="${APP_NAME}.app"
CONTENTS_DIR="${APP_BUNDLE}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"

# 1. Clean previous build
rm -rf "${APP_BUNDLE}" "${APP_NAME}"

# 2. Create bundle structure
mkdir -p "${MACOS_DIR}"
mkdir -p "${RESOURCES_DIR}"

# 3. Compile Swift sources
SDK_PATH=$(xcrun --show-sdk-path --sdk macosx)
swiftc -O \
    -sdk "${SDK_PATH}" \
    -framework Speech \
    -framework AVFoundation \
    -framework AppKit \
    -framework SwiftUI \
    -framework Carbon \
    -parse-as-library \
    App/VoiceToEnglishAIApp.swift \
    App/AppDelegate.swift \
    Services/AudioRecorderService.swift \
    Services/AppleSpeechService.swift \
    Services/GroqService.swift \
    Services/TranslationService.swift \
    Services/ClipboardService.swift \
    Services/HotkeyService.swift \
    Services/HUDWindowManager.swift \
    Views/FloatingHUDView.swift \
    Views/QuickTranslateHUDView.swift \
    Views/MenuBarView.swift \
    Views/SettingsView.swift \
    -o "${MACOS_DIR}/${APP_NAME}"

# 4. Copy Info.plist
cp Info.plist "${CONTENTS_DIR}/Info.plist"

# 5. Stable code-sign with explicit Designated Requirement
echo "🔏 Signing application bundle with stable identifier..."
codesign --force --deep --sign - \
    --identifier "com.personal.VoiceToEnglishAI" \
    --requirements '=designated => identifier "com.personal.VoiceToEnglishAI"' \
    --entitlements VoiceToEnglishAI.entitlements \
    "${APP_BUNDLE}"

echo "✅ Build completed successfully: ${DIR}/${APP_BUNDLE}"
echo "👉 To launch the app, run: open ${DIR}/${APP_BUNDLE}"
