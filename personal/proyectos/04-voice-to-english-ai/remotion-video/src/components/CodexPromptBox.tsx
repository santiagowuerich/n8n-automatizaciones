import React from "react";
import { Zap, CheckCircle2, Sparkles, Terminal, Copy, Cpu, ArrowRight } from "lucide-react";

interface CodexPromptBoxProps {
  title?: string;
  statusText?: string;
  hotkey?: string;
  modelText?: string;
  latencyText?: string;
  text: string;
  showCursor?: boolean;
  isStreaming?: boolean;
  targetApp?: string;
  accentColor?: string;
}

export const CodexPromptBox: React.FC<CodexPromptBoxProps> = ({
  title = "AI Prompt Stream",
  statusText = "AUTO-PASTED",
  hotkey = "⌥ Option + I",
  modelText = "Groq LLaMA 3.1 70B",
  latencyText = "142ms",
  text,
  showCursor = true,
  isStreaming = false,
  targetApp = "Cursor IDE",
  accentColor = "#38BDF8",
}) => {
  // Syntax highlight helper for technical tokens
  const highlightTechnicalText = (rawText: string) => {
    const technicalKeywords = [
      "TypeScript",
      "Redis",
      "JWT",
      "RS256",
      "API",
      "middleware",
      "RSA",
      "tokens",
      "caching",
      "sliding-window",
      "rate limiting",
      "fallback",
      "endpoint",
    ];

    const regex = new RegExp(`\\b(${technicalKeywords.join("|")})\\b`, "gi");
    const parts = rawText.split(regex);

    return parts.map((part, i) => {
      const isKeyword = technicalKeywords.some(
        (kw) => kw.toLowerCase() === part.toLowerCase()
      );
      if (isKeyword) {
        return (
          <span
            key={i}
            style={{
              color: "#38BDF8",
              fontWeight: 600,
              textShadow: "0 0 16px rgba(56, 189, 248, 0.4)",
            }}
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      style={{
        background: "linear-gradient(180deg, rgba(13, 17, 28, 0.95) 0%, rgba(9, 11, 18, 0.98) 100%)",
        backdropFilter: "blur(30px) saturate(200%)",
        WebkitBackdropFilter: "blur(30px) saturate(200%)",
        borderRadius: 16,
        border: "1px solid rgba(56, 189, 248, 0.28)",
        boxShadow:
          "0 20px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top Ambient Glow Line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "15%",
          right: "15%",
          height: 1.5,
          background: "linear-gradient(90deg, transparent, #38BDF8, #818CF8, transparent)",
          opacity: 0.8,
        }}
      />

      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 22px",
          background: "rgba(17, 24, 39, 0.6)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
        }}
      >
        {/* Left: Status & Latency */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(56, 189, 248, 0.12)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              padding: "4px 10px",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: "#38BDF8",
                boxShadow: "0 0 8px #38BDF8",
              }}
            />
            <span
              style={{
                color: "#E0F2FE",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {title}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "rgba(34, 197, 94, 0.12)",
              border: "1px solid rgba(34, 197, 94, 0.25)",
              padding: "4px 9px",
              borderRadius: 8,
            }}
          >
            <Zap size={13} color="#22C55E" />
            <span
              style={{
                color: "#86EFAC",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {latencyText}
            </span>
          </div>
        </div>

        {/* Right: Shortcut & Destination */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              color: "#94A3B8",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "ui-monospace, monospace",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "3px 10px",
              borderRadius: 6,
            }}
          >
            {hotkey}
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(34, 197, 94, 0.16)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              padding: "4px 12px",
              borderRadius: 8,
            }}
          >
            <CheckCircle2 size={14} color="#22C55E" />
            <span
              style={{
                color: "#4ADE80",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.04em",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {statusText}
            </span>
          </div>
        </div>
      </div>

      {/* Main Body (Codex / Terminal Prompt Stream) */}
      <div
        style={{
          padding: "24px 28px",
          minHeight: 110,
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
          fontSize: 18.5,
          lineHeight: 1.6,
          color: "#F8FAFC",
        }}
      >
        <span
          style={{
            color: "#38BDF8",
            fontWeight: 800,
            fontSize: 22,
            lineHeight: 1.2,
            userSelect: "none",
            filter: "drop-shadow(0 0 8px rgba(56, 189, 248, 0.6))",
          }}
        >
          ❯
        </span>

        <div style={{ flex: 1 }}>
          {highlightTechnicalText(text)}
          {showCursor && (
            <span
              style={{
                display: "inline-block",
                width: 3,
                height: 22,
                backgroundColor: "#38BDF8",
                marginLeft: 4,
                verticalAlign: "middle",
                boxShadow: "0 0 12px #38BDF8, 0 0 20px rgba(56, 189, 248, 0.8)",
                borderRadius: 2,
              }}
            />
          )}
        </div>
      </div>

      {/* Footer Metadata (Codex / IDE Metadata Bar) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 22px",
          background: "rgba(10, 13, 22, 0.8)",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          color: "#64748B",
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "ui-monospace, monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Cpu size={13} color="#94A3B8" />
          <span>{modelText}</span>
          <span>•</span>
          <span style={{ color: "#94A3B8" }}>Target: {targetApp}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>STREAM: ACTIVE</span>
          <span>•</span>
          <span style={{ color: "#38BDF8" }}>READY</span>
        </div>
      </div>
    </div>
  );
};
