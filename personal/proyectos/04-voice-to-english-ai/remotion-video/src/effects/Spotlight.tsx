import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface SpotlightProps {
  /** Vertical center of the spotlight as percentage (0-100) */
  focusY?: number;
  /** Horizontal center of the spotlight as percentage (0-100) */
  focusX?: number;
  /** How tight the spotlight is (smaller = tighter focus) */
  radius?: number;
  /** How dark the non-focused area gets (0 = invisible, 1 = full black) */
  dimAmount?: number;
}

/**
 * Full-screen radial vignette that highlights a focal area
 * and subtly dims everything else. The focus point can be
 * animated by passing dynamic focusX/focusY values.
 */
export const Spotlight: React.FC<SpotlightProps> = ({
  focusX = 50,
  focusY = 55,
  radius = 45,
  dimAmount = 0.35,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 90,
        background: `radial-gradient(ellipse ${radius}% ${radius}% at ${focusX}% ${focusY}%, transparent 0%, rgba(0, 0, 0, ${dimAmount}) 100%)`,
      }}
    />
  );
};
