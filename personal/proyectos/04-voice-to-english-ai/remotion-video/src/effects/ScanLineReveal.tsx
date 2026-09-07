import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface ScanLineRevealProps {
  children: React.ReactNode;
  /** Frame at which the reveal starts (relative to the Sequence) */
  startFrame?: number;
  /** Duration of the full reveal in frames */
  duration?: number;
}

/**
 * Wraps children in a scan-line reveal: a bright horizontal line sweeps
 * top-to-bottom, progressively revealing the content beneath.
 */
export const ScanLineReveal: React.FC<ScanLineRevealProps> = ({
  children,
  startFrame = 0,
  duration = 25,
}) => {
  const frame = useCurrentFrame();

  // Progress 0→1 over the reveal duration
  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Before reveal starts, fully hidden
  if (progress <= 0) {
    return <div style={{ opacity: 0 }}>{children}</div>;
  }

  // After reveal, fully visible (no mask overhead)
  if (progress >= 1) {
    return <>{children}</>;
  }

  // Reveal percentage (scan position)
  const revealY = progress * 100;

  return (
    <div style={{ position: "relative" }}>
      {/* Content with progressive mask */}
      <div
        style={{
          maskImage: `linear-gradient(to bottom, black ${revealY}%, transparent ${revealY + 2}%)`,
          WebkitMaskImage: `linear-gradient(to bottom, black ${revealY}%, transparent ${revealY + 2}%)`,
        }}
      >
        {children}
      </div>

      {/* The scan line itself */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: `${revealY}%`,
          height: 2,
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 30%, #FFFFFF 50%, rgba(255,255,255,0.8) 70%, transparent 100%)",
          boxShadow: "0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 255, 255, 0.2)",
          pointerEvents: "none",
          transform: "translateY(-50%)",
        }}
      />
    </div>
  );
};
