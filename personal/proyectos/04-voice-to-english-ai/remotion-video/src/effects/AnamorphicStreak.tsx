import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface AnamorphicStreakProps {
  /** Frame at which the streak flashes */
  triggerFrame: number;
  /** Duration of the optical bloom in frames */
  durationFrames?: number;
  /** Vertical position percentage (0-100) */
  centerY?: number;
}

/**
 * Anamorphic Lens Flare Streak:
 * A razor-sharp horizontal beam of white light with anamorphic blue/white bloom
 * that flashes across the active element in 100ms when AI transformation occurs.
 */
export const AnamorphicStreak: React.FC<AnamorphicStreakProps> = ({
  triggerFrame,
  durationFrames = 14,
  centerY = 44,
}) => {
  const frame = useCurrentFrame();

  if (frame < triggerFrame || frame > triggerFrame + durationFrames) {
    return null;
  }

  const localFrame = frame - triggerFrame;

  // Flash envelope: rapid attack (2 frames), exponential decay
  const opacity = interpolate(
    localFrame,
    [0, 2, 5, durationFrames],
    [0, 1.0, 0.7, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const scaleX = interpolate(
    localFrame,
    [0, 2, durationFrames],
    [0.4, 1.2, 1.8],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: `${centerY}%`,
        height: 4,
        pointerEvents: "none",
        zIndex: 95,
        opacity,
        transform: `translateY(-50%) scaleX(${scaleX})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 1. Core Needle Thin Laser Line */}
      <div
        style={{
          width: "100%",
          height: 2,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 20%, #FFFFFF 50%, rgba(255,255,255,0.7) 80%, transparent 100%)",
          boxShadow:
            "0 0 25px rgba(255, 255, 255, 0.9), 0 0 50px rgba(255, 255, 255, 0.5), 0 0 100px rgba(200, 225, 255, 0.4)",
        }}
      />

      {/* 2. Anamorphic Glow Bloom */}
      <div
        style={{
          position: "absolute",
          width: "60%",
          height: 18,
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 50%, transparent 80%)",
          filter: "blur(6px)",
        }}
      />
    </div>
  );
};
