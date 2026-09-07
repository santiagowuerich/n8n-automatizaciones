# VoiceToEnglishAI (macOS - 100% Free & On-Device)

A lightweight native macOS menu-bar utility that captures audio from your microphone, transcribes it using Apple's built-in **Speech Framework (`SFSpeechRecognizer`)** on-device, and automatically pastes the result into your active application.

**Zero API keys. Zero external costs. 100% private and offline.**

---

## 🏗 Architecture

```text
04-voice-to-english-ai/
├── App/
│   ├── VoiceToEnglishAIApp.swift     # App entry point & MenuBarExtra
│   └── AppDelegate.swift             # AppCoordinator lifecycle & state machine
├── Services/
│   ├── AudioRecorderService.swift    # macOS AVAudioRecorder microphone capture
│   ├── AppleSpeechService.swift      # Apple SFSpeechRecognizer on-device engine
│   ├── ClipboardService.swift        # NSPasteboard management & simulated Cmd+V
│   └── HotkeyService.swift           # Global hotkey monitoring (⌥ Option + Space)
├── Views/
│   ├── MenuBarView.swift             # Popover UI & live duration counter
│   └── SettingsView.swift            # Locale selector & macOS permission prompts
├── Info.plist                        # Mic & Speech Recognition permissions (LSUIElement)
├── VoiceToEnglishAI.entitlements      # Hardware audio entitlements
├── build.sh                          # CLI compilation and code-signing script
└── README.md
```

---

## 🚀 Compilación y Ejecución

Compilá directamente desde la terminal con:

```bash
cd personal/proyectos/04-voice-to-english-ai
./build.sh
```

Para abrir la aplicación:

```bash
open VoiceToEnglishAI.app
```

### Permisos del Sistema Requeridos:
1. **Micrófono**: Para capturar el audio.
2. **Reconocimiento de Voz (Apple Speech)**: Para procesar el audio en el dispositivo de forma gratuita.
3. **Accesibilidad**: Para inyectar la pulsación `Cmd+V` y pegar automáticamente en el campo de texto activo.
