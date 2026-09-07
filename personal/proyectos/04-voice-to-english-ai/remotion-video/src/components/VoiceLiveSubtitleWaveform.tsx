import React from "react";
import { Mic, Sparkles, ArrowRight, Zap } from "lucide-react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface VoiceLiveSubtitleWaveformProps {
  isRecording: boolean;
  isProcessing: boolean;
  isPasted: boolean;
  spanishText: string;
  englishPrompt: string;
}

/**
 * High-impact visual transformation banner:
 * 1. While recording: Shows real-time Spanish speech waveform + live subtitle text.
 * 2. While processing: AI morphing beam showing Groq Whisper + LLaMA 3.1 translation.
 * 3. While pasted: Confirmation of injection in Claude Code.
 */
export const VoiceLiveSubtitleWaveform: React.FC<VoiceLiveSubtitleWaveformProps> = ({
  isRecording,
  isProcessing,
  isPasted,
  spanishText,
  englishPrompt,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Progressive Spanish subtitle typing as voice speaks
  const spanishTypedLength = Math.floor(
    interpolate(frame, [5, 80], [0, spanishText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const cardEntrance = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  return (
    <div
      style={{
        width: "100%",
        marginBottom: 16,
        transform: `scale(${interpolate(cardEntrance, [0, 1], [0.95, 1])})`,
        opacity: cardEntrance,
      }}
    >
      <div
        style={{
          padding: "12px 20px",
          background: isProcessing
            ? "rgba(24, 24, 27, 0.95)"
            : "rgba(18, 18, 20, 0.9)",
          border: isRecording
            ? "1px solid rgba(255, 255, 255, 0.25)"
            : isProcessing
            ? "1px solid rgba(255, 255, 255, 0.4)"
            : "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          boxShadow: isProcessing
            ? "0 0 30px rgba(255, 255, 255, 0.08)"
            : "none",
        }}
      >
        {/* Left Indicator & Live Text */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
          {isRecording && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 10px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: 6,
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <Mic size={14} color="#FFFFFF" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>
                VOZ (ESPAÑOL)
              </span>
            </div>
          )}

          {isProcessing && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 10px",
                background: "rgba(255, 255, 255, 0.15)",
                borderRadius: 6,
                border: "1px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              <Zap size={14} color="#FFFFFF" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>
                GROQ AI TRANSFORMING
              </span>
            </div>
          )}

          {isPasted && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 10px",
                background: "rgba(255, 255, 255, 0.08)",
                borderRadius: 6,
              }}
            >
              <Sparkles size={14} color="rgba(255, 255, 255, 0.7)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255, 255, 255, 0.7)" }}>
                INGLÉS TÉCNICO INYECTADO
              </span>
            </div>
          )}

          {/* Subtitle text */}
          <div style={{ flex: 1, fontSize: 14.5, color: "#FFFFFF", fontWeight: 500 }}>
            {isRecording ? (
              <span>
                "{spanishText.slice(0, spanishTypedLength)}"
                <span
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: 14,
                    backgroundColor: "#FFFFFF",
                    marginLeft: 4,
                    verticalAlign: "middle",
                  }}
                />
              </span>
            ) : isProcessing ? (
              <span style={{ color: "rgba(255, 255, 255, 0.7)", fontStyle: "italic" }}>
                Whisper ➔ LLaMA 3.1 70B (Estructurando prompt técnico en inglés...)
              </span>
            ) : (
              <span style={{ color: "rgba(255, 255, 255, 0.5)", fontFamily: "ui-monospace, monospace", fontSize: 13 }}>
                Refactored for SSE Streaming & Auto-reconnect
              </span>
            )}
          </div>
        </div>

        {/* Right Audio Waveform Visualizer (Active during recording) */}
        {isRecording && (
          <div style={{ display: "flex", alignItems: "center", gap: 3, height: 24, padding: "0 8px" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => {
              const h = interpolate(
                Math.sin((frame + i * 2.8) * 0.45) * Math.cos(frame * 0.15 + i),
                [-1, 1],
                [4, 22]
              );
              return (
                <div
                  key={i}
                  style={{
                    width: 3,
                    height: h,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 2,
                    opacity: 0.85,
                  }}
                />
              );
            })}
          </div>
        )}

        {isProcessing && (
          <div
            style={{
              fontSize: 12,
              fontFamily: "ui-monospace, monospace",
              fontWeight: 700,
              color: "#FFFFFF",
              background: "rgba(255, 255, 255, 0.1)",
              padding: "4px 8px",
              borderRadius: 6,
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            ⚡ 140ms
          </div>
        )}
      </div>
    </div>
  );
};
