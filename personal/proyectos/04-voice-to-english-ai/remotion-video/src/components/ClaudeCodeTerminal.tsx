import React from "react";
import { Terminal as TerminalIcon, Cpu, Check, Zap } from "lucide-react";
import { useCurrentFrame, interpolate } from "remotion";
import { CodeLineFlash } from "../effects/CodeLineFlash";

interface ClaudeCodeTerminalProps {
  isRecording?: boolean;
  isProcessing?: boolean;
  isPasted?: boolean;
  spanishText?: string;
  englishPrompt?: string;
  isExecuting?: boolean;
  executionProgress?: number;
  hotkey?: string;
  width?: number;
}

export const ClaudeCodeTerminal: React.FC<ClaudeCodeTerminalProps> = ({
  isRecording = false,
  isProcessing = false,
  isPasted = false,
  spanishText = "Refactorizá este endpoint a Server-Sent Events con reconexión automática",
  englishPrompt = "Refactor this endpoint to support Server-Sent Events (SSE) streaming with an adaptive backpressure buffer and automatic client reconnection.",
  isExecuting = false,
  executionProgress = 0,
  hotkey = "⌥ Space",
  width = 1400,
}) => {
  const frame = useCurrentFrame();

  // Calm Spanish typing during voice recording
  const spanishTyped = Math.floor(
    interpolate(frame, [10, 140], [0, spanishText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Calm English typing after conversion
  const englishTyped = Math.floor(
    interpolate(frame, [180, 245], [0, englishPrompt.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  return (
    <div
      style={{
        width,
        height: 720,
        background: "#080808",
        borderRadius: 16,
        border: "1px solid rgba(255, 255, 255, 0.12)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 40px 100px rgba(0, 0, 0, 0.9)",
      }}
    >
      {/* 1. Terminal Window Chrome */}
      <div
        style={{
          height: 46,
          background: "#0F0F0F",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "rgba(255, 255, 255, 0.2)" }} />
          <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "rgba(255, 255, 255, 0.2)" }} />
          <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "rgba(255, 255, 255, 0.2)" }} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "rgba(255, 255, 255, 0.45)",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <TerminalIcon size={14} color="rgba(255, 255, 255, 0.45)" />
          <span>claude — zsh — 140x40</span>
        </div>

        <div style={{ color: "rgba(255, 255, 255, 0.25)", fontSize: 12 }}>
          Claude 3.7 Sonnet
        </div>
      </div>

      {/* 2. Terminal Body */}
      <div
        style={{
          flex: 1,
          padding: "36px 44px",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: 16.5,
          lineHeight: 1.7,
          color: "rgba(255, 255, 255, 0.55)",
          overflow: "hidden",
        }}
      >
        {/* CLI Header */}
        <div style={{ color: "rgba(255, 255, 255, 0.8)", fontWeight: 600, fontSize: 17, marginBottom: 4 }}>
          Claude Code <span style={{ color: "rgba(255, 255, 255, 0.3)", fontWeight: 400, fontSize: 13 }}>v1.0.18</span>
        </div>
        <div style={{ color: "rgba(255, 255, 255, 0.25)", fontSize: 13, marginBottom: 24 }}>
          Connected to local repository • 14 files indexed
        </div>

        {/* 3. In-Place Self-Contained Prompt Box */}
        <div
          style={{
            border: isProcessing
              ? "1px solid rgba(255, 255, 255, 0.45)"
              : isRecording
              ? "1px solid rgba(255, 255, 255, 0.3)"
              : "1px solid rgba(255, 255, 255, 0.15)",
            background: isProcessing ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.015)",
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 26,
            transition: "border 0.2s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isRecording && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#FFFFFF", fontWeight: 600 }}>
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      backgroundColor: "#FFFFFF",
                      boxShadow: "0 0 6px #FFFFFF",
                    }}
                  />
                  <span>Listening (Español)</span>
                </div>
              )}

              {isProcessing && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#FFFFFF", fontWeight: 600 }}>
                  <Zap size={13} color="#FFFFFF" />
                  <span>Groq AI Refining (Whisper ➔ LLaMA 3.1 70B)</span>
                </div>
              )}

              {isPasted && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255, 255, 255, 0.7)", fontWeight: 500 }}>
                  <span style={{ color: "#FFFFFF", fontWeight: 600 }}>Claude Prompt</span>
                  <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>•</span>
                  <span style={{ color: "#10B981", fontWeight: 600 }}>⚡ -45% Tokens</span>
                  <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>•</span>
                  <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>Injected in English</span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isRecording && (
                <div style={{ display: "flex", alignItems: "center", gap: 2.5, height: 16 }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                    const h = interpolate(Math.sin((frame + i * 3) * 0.35), [-1, 1], [3, 14]);
                    return (
                      <div
                        key={i}
                        style={{
                          width: 2.5,
                          height: h,
                          backgroundColor: "#FFFFFF",
                          borderRadius: 1,
                          opacity: 0.8,
                        }}
                      />
                    );
                  })}
                </div>
              )}

              {isProcessing && (
                <span
                  style={{
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontFamily: "ui-monospace, monospace",
                    fontWeight: 700,
                  }}
                >
                  ⚡ 140ms
                </span>
              )}

              <div
                style={{
                  color: "rgba(255, 255, 255, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontWeight: 600,
                  fontSize: 11,
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                {hotkey}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ color: "rgba(255, 255, 255, 0.4)", fontWeight: 700 }}>❯</span>
            <div style={{ color: "#FFFFFF", fontSize: 17, flex: 1, lineHeight: 1.55 }}>
              {isRecording ? (
                <span style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                  "{spanishText.slice(0, spanishTyped)}"
                  <span
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: 18,
                      backgroundColor: "#FFFFFF",
                      marginLeft: 4,
                      verticalAlign: "middle",
                    }}
                  />
                </span>
              ) : isProcessing ? (
                <span style={{ color: "rgba(255, 255, 255, 0.4)", fontStyle: "italic" }}>
                  Translating & structuring technical prompt...
                </span>
              ) : (
                <span>
                  {englishPrompt.slice(0, englishTyped)}
                  {englishTyped < englishPrompt.length && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: 18,
                        backgroundColor: "#FFFFFF",
                        marginLeft: 4,
                        verticalAlign: "middle",
                      }}
                    />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 4. Execution Output with Code Line Flash */}
        {executionProgress > 0.1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <CodeLineFlash appearFrame={245} flashDuration={10}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255, 255, 255, 0.6)" }}>
                <Cpu size={15} />
                <span style={{ fontWeight: 500 }}>Analyzing workspace & generating implementation...</span>
              </div>
            </CodeLineFlash>

            {executionProgress > 0.35 && (
              <CodeLineFlash appearFrame={260} flashDuration={10}>
                <div style={{ marginLeft: 24, color: "rgba(255, 255, 255, 0.35)", fontSize: 15 }}>
                  ● Reading <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>src/api/stream.service.ts</span>
                </div>
              </CodeLineFlash>
            )}

            {executionProgress > 0.65 && (
              <CodeLineFlash appearFrame={275} flashDuration={10}>
                <div style={{ marginLeft: 24, color: "rgba(255, 255, 255, 0.35)", fontSize: 15 }}>
                  ● Writing <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>src/api/sse-buffer-handler.ts</span> (+84 lines)
                </div>
              </CodeLineFlash>
            )}

            {executionProgress > 0.92 && (
              <CodeLineFlash appearFrame={290} flashDuration={10}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#FFFFFF", marginTop: 4 }}>
                  <Check size={16} />
                  <span style={{ fontWeight: 600 }}>Zero errors • Ready for commit</span>
                </div>
              </CodeLineFlash>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
