import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface CameraRig3DProps {
  children: React.ReactNode;
  tiltX?: number; // degrees
  tiltY?: number; // degrees
  zoom?: number; // scale multiplier
  panY?: number; // translateY
}

export const CameraRig3D: React.FC<CameraRig3DProps> = ({
  children,
  tiltX = 0,
  tiltY = 0,
  zoom = 1,
  panY = 0,
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
          transform: `perspective(1400px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${zoom}) translateY(${panY}px)`,
          transition: "transform 0.1s ease-out",
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>
    </div>
  );
};
