import React from "react";
import { Check, Sparkles } from "lucide-react";

interface CleanPromptBoxProps {
  label?: string;
  hotkey?: string;
  text: string;
  showCursor?: boolean;
  isPasted?: boolean;
}

export const CleanPromptBox: React.FC<CleanPromptBoxProps> = ({
  label = "Prompt injected at cursor",
  hotkey = "⌥ Option + I",
  text,
  showCursor = true,
  isPasted = true,
}) => {
  return (
    <div
      style={{
        background: "rgba(18, 21, 31, 0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: 12,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.6)",
        overflow: "hidden",
      }}
    >
      {/* Top Meta Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 18px",
          background: "rgba(255, 255, 255, 0.02)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isPasted ? (
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                backgroundColor: "rgba(34, 197, 94, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={11} color="#22C55E" strokeWidth={3} />
            </div>
          ) : (
            <Sparkles size={14} color="#94A3B8" />
          )}
          <span
            style={{
              color: isPasted ? "#E2E8F0" : "#94A3B8",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "Inter, -apple-system, sans-serif",
            }}
          >
            {label}
          </span>
        </div>

        <div
          style={{
            color: "#94A3B8",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "2px 8px",
            borderRadius: 5,
          }}
        >
          {hotkey}
        </div>
      </div>

      {/* Clean Text Area */}
      <div
        style={{
          padding: "20px 22px",
          minHeight: 85,
          fontFamily: "Inter, -apple-system, sans-serif",
          fontSize: 18,
          lineHeight: 1.55,
          color: "#F1F5F9",
          fontWeight: 400,
          letterSpacing: "-0.01em",
        }}
      >
        <span>{text}</span>
        {showCursor && (
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: 20,
              backgroundColor: "#38BDF8",
              marginLeft: 3,
              verticalAlign: "middle",
            }}
          />
        )}
      </div>
    </div>
  );
};
