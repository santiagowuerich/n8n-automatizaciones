import React from "react";
import { CornerDownLeft } from "lucide-react";

interface QuickInputBarProps {
  typedText: string;
  isTranslating?: boolean;
}

export const QuickInputBar: React.FC<QuickInputBarProps> = ({ typedText, isTranslating = false }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "18px 28px",
        borderRadius: 14,
        border: "1px solid rgba(255, 255, 255, 0.15)",
        width: 1100,
        background: "#0A0A0A",
      }}
    >
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <span
          style={{
            color: "#FFFFFF",
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: "-0.01em",
          }}
        >
          {typedText}
        </span>
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: 24,
            backgroundColor: "#FFFFFF",
            marginLeft: 5,
            borderRadius: 1,
          }}
        />
      </div>

      {isTranslating ? (
        <span
          style={{
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "ui-monospace, monospace",
          }}
        >
          Translating...
        </span>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: 6,
              color: "rgba(255, 255, 255, 0.5)",
              fontSize: 13,
              fontFamily: "ui-monospace, monospace",
              fontWeight: 500,
            }}
          >
            <span>Enter</span>
            <CornerDownLeft size={13} />
          </div>
          <div
            style={{
              padding: "7px 12px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 6,
              color: "rgba(255, 255, 255, 0.3)",
              fontSize: 13,
              fontFamily: "ui-monospace, monospace",
            }}
          >
            Esc
          </div>
        </div>
      )}
    </div>
  );
};
