import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface KeypressHUDProps {
  keys: string[];
  activeFromFrame: number;
  durationFrames?: number;
  label?: string;
  position?: "bottom-center" | "bottom-right" | "bottom-left";
}

/**
 * Keypress HUD: displays floating physical macOS keycaps with haptic feedback visual pulse
 * when global shortcuts (like ⌥ Option + Space or ⌥ Option + I) are triggered.
 */
export const KeypressHUD: React.FC<KeypressHUDProps> = ({
  keys,
  activeFromFrame,
  durationFrames = 60,
  label,
  position = "bottom-center",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // If outside active frame range, don't render
  if (frame < activeFromFrame || frame > activeFromFrame + durationFrames) {
    return null;
  }

  const localFrame = frame - activeFromFrame;

  // Entrance spring
  const entrance = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, mass: 0.7 },
  });

  // Fade out at end
  const exitOpacity = interpolate(
    localFrame,
    [durationFrames - 15, durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Haptic press effect: quick keypress compression and release
  const pressScale = interpolate(
    localFrame,
    [0, 4, 10, 16],
    [1, 0.92, 1.02, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Border highlight on press
  const borderHighlight = interpolate(
    localFrame,
    [0, 6, 20],
    [0.6, 0.9, 0.2],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case "bottom-left":
        return { bottom: 36, left: 60 };
      case "bottom-right":
        return { bottom: 36, right: 60 };
      case "bottom-center":
      default:
        return { bottom: 36, left: "50%", transform: "translateX(-50%)" };
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        ...getPositionStyles(),
        zIndex: 100,
        pointerEvents: "none",
        opacity: entrance * exitOpacity,
        transform: `${getPositionStyles().transform || ""} translateY(${interpolate(entrance, [0, 1], [20, 0])}px) scale(${pressScale})`,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 18px",
          background: "rgba(15, 15, 18, 0.92)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderRadius: 14,
          border: `1px solid rgba(255, 255, 255, ${borderHighlight})`,
          boxShadow: `0 16px 36px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 255, 255, ${borderHighlight * 0.15})`,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
        }}
      >
        {label && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "rgba(255, 255, 255, 0.5)",
              marginRight: 4,
            }}
          >
            {label}
          </span>
        )}

        {/* Keycaps */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {keys.map((key, index) => (
            <React.Fragment key={index}>
              <div
                style={{
                  minWidth: 34,
                  height: 34,
                  padding: "0 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(180deg, #2A2A2E 0%, #18181B 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  borderBottom: "2.5px solid rgba(255, 255, 255, 0.4)",
                  borderRadius: 7,
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.5)",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)",
                }}
              >
                {key}
              </div>

              {index < keys.length - 1 && (
                <span style={{ color: "rgba(255, 255, 255, 0.3)", fontSize: 13, fontWeight: 600 }}>
                  +
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
