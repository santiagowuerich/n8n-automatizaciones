import React from "react";
import { Mic, StopCircle, Settings, ChevronDown, Check } from "lucide-react";

interface NativeMenuBarPopoverProps {
  isRecording?: boolean;
  isProcessing?: boolean;
  recordingDuration?: number;
  originalText?: string;
  translatedText?: string;
  statusText?: string;
}

/**
 * 1:1 React replica of Views/MenuBarView.swift from the native SwiftUI macOS app.
 * Matches exact macOS native popover styling, typography, buttons, and layout.
 */
export const NativeMenuBarPopover: React.FC<NativeMenuBarPopoverProps> = ({
  isRecording = false,
  isProcessing = false,
  recordingDuration = 0,
  originalText = "",
  translatedText = "",
  statusText = isRecording ? "Grabando..." : isProcessing ? "Traduciendo con Groq..." : "Listo",
}) => {
  return (
    <div
      style={{
        width: 340,
        background: "rgba(24, 24, 27, 0.95)",
        backdropFilter: "blur(40px) saturate(190%)",
        WebkitBackdropFilter: "blur(40px) saturate(190%)",
        borderRadius: 14,
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        padding: 16,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Icons', sans-serif",
        color: "#FFFFFF",
        textAlign: "left",
      }}
    >
      {/* 1. Header & Status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              backgroundColor: isRecording ? "#EF4444" : isProcessing ? "#F59E0B" : "#10B981",
              boxShadow: isRecording ? "0 0 8px #EF4444" : "none",
            }}
          />
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "#F4F4F5" }}>
            {statusText}
          </span>
        </div>

        {isRecording && (
          <span
            style={{
              fontSize: 13,
              fontFamily: "ui-monospace, monospace",
              fontWeight: 600,
              color: "#EF4444",
            }}
          >
            {recordingDuration.toFixed(1)}s
          </span>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: "rgba(255, 255, 255, 0.08)", marginBottom: 12 }} />

      {/* 2. Main Action Button (SwiftUI .borderedProminent style) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 14px",
          background: isRecording ? "#DC2626" : "#2563EB",
          borderRadius: 8,
          cursor: "pointer",
          marginBottom: 12,
          boxShadow: isRecording ? "0 4px 12px rgba(220, 38, 38, 0.3)" : "0 4px 12px rgba(37, 99, 235, 0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isRecording ? (
            <StopCircle size={18} color="#FFFFFF" />
          ) : (
            <Mic size={18} color="#FFFFFF" />
          )}
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>
            {isRecording ? "Detener y Traducir" : "Iniciar Grabación"}
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            color: "rgba(255, 255, 255, 0.7)",
            fontWeight: 500,
            fontFamily: "ui-monospace, monospace",
          }}
        >
          ⌥ Space
        </span>
      </div>

      {/* 3. Quick Microphone Selector */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.45)", marginBottom: 4 }}>
          Micrófono:
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "5px 10px",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 6,
            fontSize: 12,
            color: "rgba(255, 255, 255, 0.8)",
          }}
        >
          <span>MacBook Pro Microphone (Built-in)</span>
          <ChevronDown size={12} color="rgba(255, 255, 255, 0.4)" />
        </div>
      </div>

      {/* 4. Result Preview */}
      {(originalText || translatedText) && (
        <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {originalText && (
            <div>
              <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.45)", marginBottom: 2 }}>
                Voz (Español):
              </div>
              <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.65)", fontStyle: "italic", lineHeight: 1.35 }}>
                "{originalText}"
              </div>
            </div>
          )}

          {translatedText && (
            <div>
              <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.45)", marginBottom: 2 }}>
                Prompt pegado:
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "#FFFFFF",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 6,
                  padding: "8px 10px",
                  lineHeight: 1.4,
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                }}
              >
                {translatedText}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: "rgba(255, 255, 255, 0.08)", marginBottom: 10 }} />

      {/* 5. Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11.5,
          color: "rgba(255, 255, 255, 0.5)",
        }}
      >
        <span style={{ cursor: "pointer" }}>Configuración...</span>
        <span style={{ cursor: "pointer" }}>Salir</span>
      </div>
    </div>
  );
};
