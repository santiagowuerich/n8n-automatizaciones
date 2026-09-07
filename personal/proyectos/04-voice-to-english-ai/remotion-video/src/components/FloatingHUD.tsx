import React from "react";
import { Mic, Check, Loader2 } from "lucide-react";
import { interpolate, useCurrentFrame } from "remotion";

interface FloatingHUDProps {
  state: "recording" | "processing" | "pasted";
  durationText?: string;
}

export const FloatingHUD: React.FC<FloatingHUDProps> = ({ state, durationText = "2.4s" }) => {
  const frame = useCurrentFrame();
  const pulse = Math.sin(frame * 0.25) * 0.15 + 1;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 24px",
        borderRadius: 999,
        border: "1px solid rgba(255, 255, 255, 0.15)",
      }}
    >
      {state === "recording" && (
        <>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#FFFFFF",
              transform: `scale(${pulse})`,
              boxShadow: "0 0 8px rgba(255, 255, 255, 0.5)",
            }}
          />

          <span
            style={{
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: 16,
              letterSpacing: "-0.01em",
            }}
          >
            Recording Voice
          </span>

          {/* Audio Equalizer */}
          <div style={{ display: "flex", alignItems: "center", gap: 3, height: 20 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
              const height = interpolate(Math.sin((frame + i * 3.5) * 0.35), [-1, 1], [5, 18]);
              return (
                <div
                  key={i}
                  style={{
                    width: 3,
                    height,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 2,
                    opacity: 0.6,
                  }}
                />
              );
            })}
          </div>

          <span
            style={{
              color: "rgba(255, 255, 255, 0.5)",
              fontWeight: 600,
              fontSize: 14,
              fontFamily: "ui-monospace, monospace",
            }}
          >
            {durationText}
          </span>
        </>
      )}

      {state === "processing" && (
        <>
          <Loader2
            size={18}
            color="#FFFFFF"
            style={{ transform: `rotate(${frame * 10}deg)` }}
          />
          <span
            style={{
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            Refining with Groq AI
          </span>
          <span
            style={{
              color: "rgba(255, 255, 255, 0.4)",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "ui-monospace, monospace",
            }}
          >
            &lt;180ms
          </span>
        </>
      )}

      {state === "pasted" && (
        <>
          <Check size={16} color="#FFFFFF" strokeWidth={3} />
          <span
            style={{
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            Pasted in English & Ready
          </span>
        </>
      )}
    </div>
  );
};
