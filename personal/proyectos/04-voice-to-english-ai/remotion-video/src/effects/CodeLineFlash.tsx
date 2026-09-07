import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface CodeLineFlashProps {
  children: React.ReactNode;
  /** Frame at which this line first appears */
  appearFrame: number;
  /** Duration of the flash effect in frames */
  flashDuration?: number;
}

/**
 * Wraps a code line and adds a brief horizontal white flash
 * that sweeps across when the line first appears. The line fades
 * in simultaneously. After the flash, the line renders normally.
 */
export const CodeLineFlash: React.FC<CodeLineFlashProps> = ({
  children,
  appearFrame,
  flashDuration = 8,
}) => {
  const frame = useCurrentFrame();

  // Not yet visible
  if (frame < appearFrame) {
    return null;
  }

  const localFrame = frame - appearFrame;

  // Flash progress 0→1 over flashDuration
  const flashProgress = interpolate(localFrame, [0, flashDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Line opacity fades in quickly
  const lineOpacity = interpolate(localFrame, [0, flashDuration * 0.6], [0.3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Flash X position (sweeps left to right)
  const flashX = flashProgress * 120 - 20; // -20% to 100%

  // Flash opacity (peaks in the middle, fades at edges)
  const flashOpacity = interpolate(flashProgress, [0, 0.3, 0.7, 1], [0, 0.9, 0.6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "relative", opacity: lineOpacity }}>
      {children}

      {/* The horizontal flash sweep */}
      {flashProgress < 1 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${flashX}%`,
              width: "20%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
              opacity: flashOpacity,
              filter: "blur(4px)",
            }}
          />
        </div>
      )}
    </div>
  );
};
