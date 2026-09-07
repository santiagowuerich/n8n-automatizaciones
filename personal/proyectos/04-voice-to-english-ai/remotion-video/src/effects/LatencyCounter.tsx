import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

interface LatencyCounterProps {
  /** Frame at which the counter starts (relative to Sequence) */
  startFrame: number;
  /** Duration of the count-up animation in frames */
  duration?: number;
  /** Target value in ms */
  targetMs?: number;
  /** Label shown after the number */
  label?: string;
}

/**
 * Animated latency counter that counts up from 0ms to targetMs
 * with an ease-out curve, giving a real-time measurement feel.
 */
export const LatencyCounter: React.FC<LatencyCounterProps> = ({
  startFrame,
  duration = 20,
  targetMs = 140,
  label = "total",
}) => {
  const frame = useCurrentFrame();

  // Before start: show nothing
  if (frame < startFrame) {
    return null;
  }

  // Eased progress
  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const currentMs = Math.round(progress * targetMs);

  // Fade in
  const opacity = interpolate(frame, [startFrame, startFrame + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 4,
        opacity,
        fontFamily: "ui-monospace, SFMono-Regular, monospace",
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#FFFFFF",
          fontVariantNumeric: "tabular-nums",
          minWidth: 42,
          textAlign: "right",
        }}
      >
        {currentMs}ms
      </span>
      <span
        style={{
          fontSize: 11,
          color: "rgba(255, 255, 255, 0.3)",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  );
};
