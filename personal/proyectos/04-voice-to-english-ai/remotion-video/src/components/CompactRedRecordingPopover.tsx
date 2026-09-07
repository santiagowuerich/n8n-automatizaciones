import React from "react";
import { Mic, StopCircle, Zap, Check } from "lucide-react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface CompactRedRecordingPopoverProps {
  isRecording?: boolean;
  isProcessing?: boolean;
  isPasted?: boolean;
  recordingDuration?: number;
}

/**
 * Compact Red macOS Recording Pill / Popover:
 * Sleek, minimal floating capsule matching native macOS Dynamic Island / HUD with
 * active red pulse, live equalizer, time counter, and hotkey tag.
 */
export const CompactRedRecordingPopover: React.FC<CompactRedRecordingPopoverProps> = ({
  isRecording = false,
  isProcessing = false,
  isPasted = false,
  recordingDuration = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulse = Math.sin(frame * 0.3) * 0.18 + 1;

  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.7 },
  });

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 16px",
        background: isRecording
          ? "rgba(220, 38, 38, 0.12)"
          : isProcessing
          ? "rgba(245, 158, 11, 0.12)"
          : "rgba(16, 185, 129, 0.12)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderRadius: 999,
        border: isRecording
          ? "1px solid rgba(239, 68, 68, 0.4)"
          : isProcessing
          ? "1px solid rgba(245, 158, 11, 0.4)"
          : "1px solid rgba(16, 185, 129, 0.3)",
        boxShadow: isRecording
          ? "0 8px 24px rgba(220, 38, 38, 0.25), 0 0 16px rgba(239, 68, 68, 0.2)"
          : "0 8px 24px rgba(0, 0, 0, 0.6)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
        transform: `scale(${interpolate(entrance, [0, 1], [0.9, 1])})`,
        opacity: entrance,
      }}
    >
      {isRecording && (
        <>
          {/* Red Pulsing Dot */}
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              backgroundColor: "#EF4444",
              transform: `scale(${pulse})`,
              boxShadow: "0 0 10px #EF4444",
            }}
          />

          <span
            style={{
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: 13.5,
              letterSpacing: "-0.01em",
            }}
          >
            Grabando voz
          </span>

          {/* Red Equalizer Bars */}
          <div style={{ display: "flex", alignItems: "center", gap: 2.5, height: 16 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => {
              const h = interpolate(Math.sin((frame + i * 3.2) * 0.4), [-1, 1], [4, 15]);
              return (
                <div
                  key={i}
                  style={{
                    width: 2.5,
                    height: h,
                    backgroundColor: "#EF4444",
                    borderRadius: 1.5,
                    opacity: 0.9,
                  }}
                />
              );
            })}
          </div>

          {/* Duration Counter */}
          <span
            style={{
              color: "#EF4444",
              fontWeight: 700,
              fontSize: 12.5,
              fontFamily: "ui-monospace, monospace",
            }}
          >
            {recordingDuration.toFixed(1)}s
          </span>

          {/* Hotkey Tag */}
          <span
            style={{
              fontSize: 11,
              color: "rgba(255, 255, 255, 0.6)",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              padding: "2px 6px",
              borderRadius: 4,
              fontWeight: 600,
              fontFamily: "ui-monospace, monospace",
            }}
          >
            ⌥ Space
          </span>
        </>
      )}

      {isProcessing && (
        <>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#F59E0B",
              boxShadow: "0 0 8px #F59E0B",
            }}
          />
          <span style={{ color: "#FFFFFF", fontWeight: 600, fontSize: 13.5 }}>
            Traduciendo con Groq AI
          </span>
          <span
            style={{
              color: "#F59E0B",
              fontSize: 11.5,
              fontWeight: 700,
              fontFamily: "ui-monospace, monospace",
            }}
          >
            ⚡ 140ms
          </span>
        </>
      )}

      {isPasted && (
        <>
          <Check size={14} color="#10B981" strokeWidth={2.8} />
          <span style={{ color: "#FFFFFF", fontWeight: 600, fontSize: 13.5 }}>
            Pegado en inglés
          </span>
        </>
      )}
    </div>
  );
};
