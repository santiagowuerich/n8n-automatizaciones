import React from "react";
import { Mic, Zap, Terminal, Sparkles, Cpu, Layers } from "lucide-react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ScanLineReveal } from "../effects/ScanLineReveal";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const cardsIn = spring({ frame: frame - 16, fps, config: { damping: 14, mass: 0.8 } });
  const ctaIn = spring({ frame: frame - 30, fps, config: { damping: 14, mass: 0.8 } });

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 60px",
      }}
    >
      {/* App Icon with Scan Reveal */}
      <ScanLineReveal startFrame={0} duration={15}>
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 20,
            border: "1px solid rgba(255, 255, 255, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            transform: `scale(${interpolate(logoIn, [0, 1], [0.85, 1])})`,
            opacity: logoIn,
          }}
        >
          <Mic size={36} color="#FFFFFF" strokeWidth={1.8} />
        </div>
      </ScanLineReveal>

      {/* App Name */}
      <ScanLineReveal startFrame={5} duration={18}>
        <h1
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: "#FFFFFF",
            margin: 0,
            letterSpacing: "-0.04em",
            transform: `scale(${interpolate(logoIn, [0, 1], [0.94, 1])})`,
            opacity: logoIn,
          }}
        >
          VoiceToEnglish<span style={{ color: "rgba(255, 255, 255, 0.4)" }}>AI</span>
        </h1>
      </ScanLineReveal>

      <p
        style={{
          fontSize: 19,
          color: "rgba(255, 255, 255, 0.4)",
          marginTop: 8,
          marginBottom: 34,
          fontWeight: 400,
          opacity: logoIn,
        }}
      >
        Universal macOS AI Injection for Spanish Developers
      </p>

      {/* 4 Feature & Value Cards */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 36,
          transform: `translateY(${interpolate(cardsIn, [0, 1], [16, 0])}px)`,
          opacity: cardsIn,
          maxWidth: 1320,
        }}
      >
        {[
          {
            icon: <Layers size={19} color="#FFFFFF" />,
            title: "-45% Token Usage",
            desc: "English BPE tokenization saves context window & API budget.",
            highlight: "Economy",
          },
          {
            icon: <Sparkles size={19} color="#FFFFFF" />,
            title: "3x AI Performance",
            desc: "Maximizes prompt reasoning in Claude Code, Cursor & Codex.",
            highlight: "Precision",
          },
          {
            icon: <Zap size={19} color="#FFFFFF" />,
            title: "<180ms Ultra-Fast",
            desc: "Instant Whisper & Groq LLaMA 3.1 70B translation pipeline.",
            highlight: "Speed",
          },
          {
            icon: <Terminal size={19} color="#FFFFFF" />,
            title: "Native Everywhere",
            desc: "Global hotkeys inject directly into any macOS active input.",
            highlight: "Universal",
          },
        ].map((f, i) => (
          <div
            key={i}
            style={{
              padding: "18px 20px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 12,
              textAlign: "left",
              flex: 1,
              background: "rgba(255, 255, 255, 0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>{f.icon}</div>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255, 255, 255, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {f.highlight}
              </span>
            </div>
            <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
              {f.title}
            </div>
            <div style={{ color: "rgba(255, 255, 255, 0.38)", fontSize: 12.5, lineHeight: 1.45 }}>
              {f.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Hotkey Pills */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          transform: `translateY(${interpolate(ctaIn, [0, 1], [14, 0])}px)`,
          opacity: ctaIn,
        }}
      >
        <div
          style={{
            padding: "8px 18px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: 999,
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: 14,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>🎙️ Hold to Speak:</span>
          <span style={{ fontFamily: "ui-monospace, monospace", color: "#FFFFFF", fontWeight: 600 }}>⌥ Space</span>
        </div>

        <div
          style={{
            padding: "8px 18px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: 999,
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: 14,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>⌨️ Quick Input:</span>
          <span style={{ fontFamily: "ui-monospace, monospace", color: "#FFFFFF", fontWeight: 600 }}>⌥ I</span>
        </div>
      </div>
    </div>
  );
};
