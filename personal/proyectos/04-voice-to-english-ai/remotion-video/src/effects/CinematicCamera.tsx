import React from "react";

interface CinematicCameraProps {
  children: React.ReactNode;
  /** Primary zoom scale */
  zoom?: number;
  /** Vertical pan offset */
  panY?: number;
  /** Horizontal pan offset */
  panX?: number;
  /** 3D Pitch tilt (X axis) in degrees */
  tiltX?: number;
  /** 3D Yaw tilt (Y axis) in degrees */
  tiltY?: number;
}

/**
 * Cinematic Physical Camera Wrapper:
 * Clean, solid 3D perspective camera with precise zoom and tilt control (zero wobbly drift).
 */
export const CinematicCamera: React.FC<CinematicCameraProps> = ({
  children,
  zoom = 1.0,
  panY = 0,
  panX = 0,
  tiltX = 0,
  tiltY = 0,
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: 1400,
        transformStyle: "preserve-3d",
      }}
    >
      <div
        style={{
          transform: `perspective(1400px) translate3d(${panX}px, ${panY}px, 0) scale(${zoom}) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          transformStyle: "preserve-3d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
};
