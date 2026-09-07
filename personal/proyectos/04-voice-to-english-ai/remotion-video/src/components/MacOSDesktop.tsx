import React from "react";
import { Wifi, Battery, Search, Sliders, Mic } from "lucide-react";

interface MacOSDesktopProps {
  activeApp?: string;
  children: React.ReactNode;
}

export const MacOSDesktop: React.FC<MacOSDesktopProps> = ({
  activeApp = "Cursor",
  children,
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#07080C",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* 1. Realistic Top macOS Menu Bar */}
      <div
        style={{
          height: 38,
          background: "rgba(18, 20, 29, 0.75)",
          backdropFilter: "blur(30px) saturate(180%)",
          WebkitBackdropFilter: "blur(30px) saturate(180%)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          color: "rgba(255, 255, 255, 0.85)",
          fontSize: 13.5,
          fontWeight: 500,
          zIndex: 50,
        }}
      >
        {/* Left Side App Menus */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {/* Apple Logo */}
          <span style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", cursor: "default" }}></span>
          <span style={{ fontWeight: 700, color: "#FFFFFF" }}>{activeApp}</span>
          <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>File</span>
          <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Edit</span>
          <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Selection</span>
          <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>View</span>
          <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Terminal</span>
          <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Help</span>
        </div>

        {/* Right Side Status Icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13 }}>
          {/* VoiceToEnglish Status Bar App Icon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "2px 8px",
              background: "rgba(56, 189, 248, 0.12)",
              borderRadius: 6,
              border: "1px solid rgba(56, 189, 248, 0.25)",
              color: "#38BDF8",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            <Mic size={12} color="#38BDF8" />
            <span>VoiceToEnglish</span>
          </div>

          <Wifi size={15} color="rgba(255, 255, 255, 0.75)" />
          <Battery size={16} color="rgba(255, 255, 255, 0.75)" />
          <Search size={14} color="rgba(255, 255, 255, 0.75)" />
          <Sliders size={14} color="rgba(255, 255, 255, 0.75)" />
          <span style={{ fontWeight: 600, color: "rgba(255, 255, 255, 0.9)" }}>Wed 9:41 AM</span>
        </div>
      </div>

      {/* 2. Main Desktop Work Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        {children}
      </div>

      {/* 3. Sleek Floating macOS Dock */}
      <div
        style={{
          height: 70,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 14,
          zIndex: 50,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "8px 18px",
            background: "rgba(25, 28, 40, 0.65)",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            borderRadius: 22,
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
          }}
        >
          {/* Finder */}
          <div style={{ width: 44, height: 44, borderRadius: 11, background: "linear-gradient(180deg, #38BDF8 0%, #0284C7 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontWeight: 800, fontSize: 18 }}>
            
          </div>
          {/* Cursor IDE */}
          <div style={{ width: 44, height: 44, borderRadius: 11, background: "#111318", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38BDF8", fontWeight: 700, fontSize: 16 }}>
            ⌁
          </div>
          {/* VS Code */}
          <div style={{ width: 44, height: 44, borderRadius: 11, background: "linear-gradient(180deg, #007ACC 0%, #005A9E 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontWeight: 700, fontSize: 16 }}>
            Code
          </div>
          {/* Terminal */}
          <div style={{ width: 44, height: 44, borderRadius: 11, background: "#1E293B", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#22C55E", fontWeight: 700, fontSize: 16, fontFamily: "monospace" }}>
            &gt;_
          </div>
          {/* VoiceToEnglish App Icon in Dock */}
          <div style={{ width: 44, height: 44, borderRadius: 11, background: "linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF" }}>
            <Mic size={20} color="#FFFFFF" />
          </div>
        </div>
      </div>
    </div>
  );
};
