import React from "react";
import { Code2 } from "lucide-react";

interface MacWindowProps {
  title?: string;
  children: React.ReactNode;
  width?: number | string;
}

export const MacWindow: React.FC<MacWindowProps> = ({
  title = "Cursor — AI Prompt Input",
  children,
  width = 1180,
}) => {
  return (
    <div
      style={{
        width,
        background: "rgba(13, 15, 24, 0.94)",
        backdropFilter: "blur(40px) saturate(190%)",
        WebkitBackdropFilter: "blur(40px) saturate(190%)",
        borderRadius: 18,
        border: "1.5px solid rgba(255, 255, 255, 0.12)",
        boxShadow: "0 40px 100px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        overflow: "hidden",
      }}
    >
      {/* Top Titlebar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "14px 24px",
          background: "rgba(20, 23, 34, 0.92)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* macOS Traffic Lights */}
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          <div style={{ width: 13, height: 13, borderRadius: "50%", backgroundColor: "#FF5F56", border: "0.5px solid rgba(0,0,0,0.2)" }} />
          <div style={{ width: 13, height: 13, borderRadius: "50%", backgroundColor: "#FFBD2E", border: "0.5px solid rgba(0,0,0,0.2)" }} />
          <div style={{ width: 13, height: 13, borderRadius: "50%", backgroundColor: "#27C93F", border: "0.5px solid rgba(0,0,0,0.2)" }} />
        </div>

        {/* Title / Tab */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: 15,
            fontWeight: 500,
            fontFamily: "Inter, -apple-system, sans-serif",
            marginRight: 40,
          }}
        >
          <Code2 size={16} color="rgba(255, 255, 255, 0.5)" />
          <span>{title}</span>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: "28px 32px" }}>{children}</div>
    </div>
  );
};
