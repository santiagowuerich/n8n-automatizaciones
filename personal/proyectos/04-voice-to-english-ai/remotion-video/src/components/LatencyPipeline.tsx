import React from "react";
import { Mic, Brain, Zap, ArrowRight } from "lucide-react";
import { useCurrentFrame, interpolate } from "remotion";

interface LatencyPipelineProps {
  activeStep?: number; // 0: Idle, 1: Audio, 2: LLM Refine, 3: Injected
}

export const LatencyPipeline: React.FC<LatencyPipelineProps> = ({
  activeStep = 1,
}) => {
  const frame = useCurrentFrame();
  const pulsePos = (frame % 45) / 45; // loop 0 to 1

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 18px",
        background: "rgba(15, 18, 28, 0.88)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderRadius: 999,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.1)",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      {/* Node 1: Audio */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            backgroundColor: activeStep >= 1 ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Mic size={12} color={activeStep >= 1 ? "#38BDF8" : "#64748B"} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: activeStep >= 1 ? "#F1F5F9" : "#64748B" }}>
          Audio (ES)
        </span>
      </div>

      {/* Line 1 */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#64748B", fontSize: 11, fontFamily: "ui-monospace, monospace" }}>
        <span style={{ color: "#38BDF8", fontWeight: 700 }}>82ms</span>
        <ArrowRight size={12} color="rgba(255, 255, 255, 0.3)" />
      </div>

      {/* Node 2: Groq LLaMA 3.1 Refine */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            backgroundColor: activeStep >= 2 ? "rgba(168, 85, 247, 0.2)" : "rgba(255, 255, 255, 0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Brain size={12} color={activeStep >= 2 ? "#C084FC" : "#64748B"} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: activeStep >= 2 ? "#F1F5F9" : "#64748B" }}>
          Groq Refine (EN)
        </span>
      </div>

      {/* Line 2 */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#64748B", fontSize: 11, fontFamily: "ui-monospace, monospace" }}>
        <span style={{ color: "#22C55E", fontWeight: 700 }}>58ms</span>
        <ArrowRight size={12} color="rgba(255, 255, 255, 0.3)" />
      </div>

      {/* Node 3: Active Cursor Code */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            backgroundColor: activeStep >= 3 ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Zap size={12} color={activeStep >= 3 ? "#22C55E" : "#64748B"} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: activeStep >= 3 ? "#F1F5F9" : "#64748B" }}>
          Cursor Output
        </span>
      </div>

      {/* Total Latency Pill */}
      <div
        style={{
          marginLeft: 8,
          background: "linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(34, 197, 94, 0.2) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.4)",
          padding: "2px 8px",
          borderRadius: 6,
          color: "#38BDF8",
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "ui-monospace, monospace",
        }}
      >
        ⚡ 140ms Total
      </div>
    </div>
  );
};
