import React from "react";
import { Mic, Terminal, Zap, Sparkles } from "lucide-react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ScanLineReveal } from "../effects/ScanLineReveal";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 16, mass: 0.9 } });
  const subtitleIn = spring({ frame: frame - 10, fps, config: { damping: 16, mass: 0.9 } });
  const valueBadgeIn = spring({ frame: frame - 18, fps, config: { damping: 14, mass: 0.8 } });
  const pillsIn = spring({ frame: frame - 25, fps, config: { damping: 14, mass: 0.8 } });
  const shortcutsIn = spring({ frame: frame - 32, fps, config: { damping: 14, mass: 0.8 } });

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 80px",
      }}
    >
      {/* Main Headline with Scan Reveal */}
      <ScanLineReveal startFrame={0} duration={20}>
        <h1
          style={{
            fontSize: 96,
            fontWeight: 800,
            color: "#FFFFFF",
            lineHeight: 1.05,
            letterSpacing: "-0.045em",
            margin: 0,
            maxWidth: 1200,
            transform: `translateY(${interpolate(titleIn, [0, 1], [30, 0])}px)`,
            opacity: titleIn,
          }}
        >
          Think in Spanish.
          <br />
          <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>
            Prompt in English.
          </span>
        </h1>
      </ScanLineReveal>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 22,
          color: "rgba(255, 255, 255, 0.45)",
          marginTop: 20,
          marginBottom: 16,
          fontWeight: 400,
          letterSpacing: "-0.01em",
          transform: `translateY(${interpolate(subtitleIn, [0, 1], [20, 0])}px)`,
          opacity: subtitleIn,
        }}
      >
        Universal macOS AI Injection for Spanish Developers · &lt;180ms
      </p>

      {/* Value Proposition Badge: Token Savings & Accuracy */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          padding: "6px 16px",
          borderRadius: 999,
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          marginBottom: 24,
          transform: `translateY(${interpolate(valueBadgeIn, [0, 1], [15, 0])}px)`,
          opacity: valueBadgeIn,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#FFFFFF", fontSize: 13, fontWeight: 600 }}>
          <Zap size={13} color="#FFFFFF" />
          <span>Save up to 45% Tokens</span>
        </div>
        <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "rgba(255, 255, 255, 0.3)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255, 255, 255, 0.8)", fontSize: 13, fontWeight: 500 }}>
          <Sparkles size={13} color="rgba(255, 255, 255, 0.8)" />
          <span>Maximize LLM Reasoning Accuracy</span>
        </div>
      </div>

      {/* App targets */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 24,
          transform: `translateY(${interpolate(pillsIn, [0, 1], [16, 0])}px)`,
          opacity: pillsIn,
        }}
      >
        {["Claude Code", "Cursor", "Codex", "Terminal"].map((name, i) => (
          <div
            key={i}
            style={{
              padding: "8px 16px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: "rgba(255, 255, 255, 0.7)",
            }}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Global shortcuts */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          transform: `translateY(${interpolate(shortcutsIn, [0, 1], [14, 0])}px)`,
          opacity: shortcutsIn,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 20px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: 10,
          }}
        >
          <Mic size={16} color="rgba(255, 255, 255, 0.6)" />
          <span style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 14, fontWeight: 500 }}>
            Hold to Speak
          </span>
          <span
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 12,
              fontWeight: 600,
              color: "#FFFFFF",
              background: "rgba(255, 255, 255, 0.1)",
              padding: "3px 8px",
              borderRadius: 5,
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            ⌥ Space
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 20px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: 10,
          }}
        >
          <Terminal size={16} color="rgba(255, 255, 255, 0.6)" />
          <span style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 14, fontWeight: 500 }}>
            Quick Input
          </span>
          <span
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 12,
              fontWeight: 600,
              color: "#FFFFFF",
              background: "rgba(255, 255, 255, 0.1)",
              padding: "3px 8px",
              borderRadius: 5,
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            ⌥ I
          </span>
        </div>
      </div>
    </div>
  );
};
