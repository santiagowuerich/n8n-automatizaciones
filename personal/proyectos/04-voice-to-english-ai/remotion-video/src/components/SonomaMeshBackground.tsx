import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

export const SonomaMeshBackground: React.FC = () => {
  const frame = useCurrentFrame();

  // Smooth undulating motions for the mesh gradient blobs
  const t = frame * 0.02;
  const x1 = Math.sin(t) * 120;
  const y1 = Math.cos(t * 0.8) * 90;
  const x2 = Math.cos(t * 1.2) * 140;
  const y2 = Math.sin(t * 0.9) * 100;
  const x3 = Math.sin(t * 0.7 + 1.5) * 100;
  const y3 = Math.cos(t * 1.1 + 0.8) * 80;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#05060A",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {/* 1. Deep Midnight Base Gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 0%, #0F172A 0%, #030712 100%)",
        }}
      />

      {/* 2. Fluid Sonoma Mesh Blob 1 (Electric Cyan) */}
      <div
        style={{
          position: "absolute",
          top: -150 + y1,
          left: "15%",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14, 165, 233, 0.16) 0%, rgba(14, 165, 233, 0) 70%)",
          filter: "blur(100px)",
          transform: `translateX(${x1}px)`,
        }}
      />

      {/* 3. Fluid Sonoma Mesh Blob 2 (Violet / Indigo Glow) */}
      <div
        style={{
          position: "absolute",
          bottom: -200 + y2,
          right: "10%",
          width: 950,
          height: 950,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.14) 0%, rgba(99, 102, 241, 0) 70%)",
          filter: "blur(110px)",
          transform: `translateX(${x2}px)`,
        }}
      />

      {/* 4. Fluid Sonoma Mesh Blob 3 (Emerald Accent) */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          right: "35%",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0) 70%)",
          filter: "blur(120px)",
          transform: `translate(${x3}px, ${y3}px)`,
        }}
      />

      {/* 5. Isometric Perspective Grid with Depth Falloff */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 85%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 85%)",
        }}
      />

      {/* 6. Subtle Floating Dust Bokeh Highlights */}
      {[
        { x: 180, y: 220, s: 4, o: 0.25 },
        { x: 1400, y: 310, s: 6, o: 0.2 },
        { x: 450, y: 780, s: 5, o: 0.18 },
        { x: 1650, y: 820, s: 3, o: 0.3 },
        { x: 920, y: 150, s: 5, o: 0.22 },
      ].map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y + Math.sin(t + i) * 20,
            width: p.s,
            height: p.s,
            borderRadius: "50%",
            backgroundColor: "#38BDF8",
            boxShadow: `0 0 16px rgba(56, 189, 248, 0.8)`,
            opacity: p.o,
          }}
        />
      ))}
    </div>
  );
};
