import React from "react";
import { FileCode, Search, GitBranch, Settings, Zap } from "lucide-react";
import { useCurrentFrame, interpolate } from "remotion";
import { CodeLineFlash } from "../effects/CodeLineFlash";

interface RealCodeEditorProps {
  fileName?: string;
  isTypingSpanish?: boolean;
  isTranslating?: boolean;
  isFinished?: boolean;
  spanishInput?: string;
  englishOutput?: string;
  isGeneratingCode?: boolean;
  codeProgress?: number;
  hotkey?: string;
}

export const RealCodeEditor: React.FC<RealCodeEditorProps> = ({
  fileName = "server.ts",
  isTypingSpanish = false,
  isTranslating = false,
  isFinished = false,
  spanishInput = "agregale caching con redis y middleware de rate limiting a esta api",
  englishOutput = "Add distributed Redis caching and a sliding-window rate limiting middleware to this API endpoint with strict token bucket fallback.",
  isGeneratingCode = false,
  codeProgress = 0,
  hotkey = "⌥ I",
}) => {
  const frame = useCurrentFrame();

  const spanishTyped = Math.floor(
    interpolate(frame, [15, 115], [0, spanishInput.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const englishTyped = Math.floor(
    interpolate(frame, [150, 230], [0, englishOutput.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  return (
    <div
      style={{
        width: 1400,
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
      {/* 1. Window Chrome */}
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
          <FileCode size={14} color="rgba(255, 255, 255, 0.45)" />
          <span>{fileName}</span>
        </div>

        <div style={{ color: "rgba(255, 255, 255, 0.25)", fontSize: 12 }}>
          Cursor AI
        </div>
      </div>

      {/* 2. Main Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div
          style={{
            width: 44,
            background: "#0F0F0F",
            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "18px 0",
            gap: 22,
            color: "rgba(255, 255, 255, 0.2)",
          }}
        >
          <Search size={17} />
          <GitBranch size={17} />
          <Settings size={17} style={{ marginTop: "auto" }} />
        </div>

        <div
          style={{
            flex: 1,
            padding: "28px 36px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: 16,
            lineHeight: 1.7,
            color: "rgba(255, 255, 255, 0.45)",
            overflow: "hidden",
          }}
        >
          {[
            { num: 1, content: <><span style={{ color: "rgba(255, 255, 255, 0.6)" }}>import</span>{" "}{"{ Injectable, UnauthorizedException }"} <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>from</span> <span style={{ color: "rgba(255, 255, 255, 0.35)" }}>'@nestjs/common'</span>;</> },
            { num: 2, content: <><span style={{ color: "rgba(255, 255, 255, 0.6)" }}>import</span> * <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>as</span> jwt <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>from</span> <span style={{ color: "rgba(255, 255, 255, 0.35)" }}>'jsonwebtoken'</span>;</> },
            { num: 3, content: null },
            { num: 4, content: <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>@Injectable()</span> },
            { num: 5, content: <><span style={{ color: "rgba(255, 255, 255, 0.6)" }}>export class</span> <span style={{ color: "#FFFFFF" }}>AuthService</span> {"{"}</> },
            { num: 6, content: <><span style={{ color: "rgba(255, 255, 255, 0.6)" }}>{"  "}private readonly</span> <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>publicKey</span>: <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>string</span>;</> },
          ].map((line) => (
            <div key={line.num} style={{ display: "flex", gap: 24 }}>
              <span style={{ width: 28, color: "rgba(255, 255, 255, 0.15)", textAlign: "right" }}>{line.num}</span>
              <span>{line.content}</span>
            </div>
          ))}

          {/* 3. In-Place Self-Contained Morphing Prompt Box */}
          <div
            style={{
              margin: "16px 0 20px 52px",
              borderRadius: 12,
              border: isTranslating
                ? "1px solid rgba(255, 255, 255, 0.45)"
                : "1px solid rgba(255, 255, 255, 0.15)",
              background: isTranslating ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.015)",
              padding: "16px 20px",
              overflow: "hidden",
              width: 1140,
              transition: "border 0.2s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                fontSize: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255, 255, 255, 0.6)", fontWeight: 500 }}>
                {isTranslating ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#FFFFFF", fontWeight: 600 }}>
                    <Zap size={13} color="#FFFFFF" />
                    <span>Groq LLaMA 3.1 70B (Translating to English technical prompt...)</span>
                  </div>
                ) : isFinished ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#FFFFFF", fontWeight: 600 }}>Cursor AI Prompt</span>
                    <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>•</span>
                    <span style={{ color: "#10B981", fontWeight: 600 }}>⚡ -45% Tokens</span>
                    <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>•</span>
                    <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>Injected in English</span>
                  </div>
                ) : (
                  <>
                    <span>Quick Input (Español)</span>
                    <span style={{ color: "rgba(255, 255, 255, 0.25)" }}>• Type Spanish and press Enter</span>
                  </>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isTranslating && (
                  <span style={{ color: "#FFFFFF", fontSize: 11, fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>
                    ⚡ 58ms
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

            <div
              style={{
                color: "#FFFFFF",
                fontSize: 16.5,
                lineHeight: 1.5,
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
              }}
            >
              {!isFinished && !isTranslating ? (
                <span>
                  {spanishInput.slice(0, spanishTyped)}
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
              ) : isTranslating ? (
                <span style={{ color: "rgba(255, 255, 255, 0.4)", fontStyle: "italic" }}>
                  Translating Spanish query into technical English specification...
                </span>
              ) : (
                <span>
                  {englishOutput.slice(0, englishTyped)}
                  {englishTyped < englishOutput.length && (
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

          {/* Generated Code with Flash Effects */}
          {codeProgress > 0.1 && (
            <CodeLineFlash appearFrame={230} flashDuration={10}>
              <div style={{ display: "flex", gap: 24 }}>
                <span style={{ width: 28, color: "rgba(255, 255, 255, 0.15)", textAlign: "right" }}>8</span>
                <span style={{ color: "rgba(255, 255, 255, 0.25)", fontStyle: "italic" }}>  // Generated via AI prompt</span>
              </div>
            </CodeLineFlash>
          )}
          {codeProgress > 0.25 && (
            <CodeLineFlash appearFrame={245} flashDuration={10}>
              <div style={{ display: "flex", gap: 24 }}>
                <span style={{ width: 28, color: "rgba(255, 255, 255, 0.15)", textAlign: "right" }}>9</span>
                <span>
                  <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>  public async</span> <span style={{ color: "#FFFFFF" }}>verifyToken</span>(token: <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>string</span>): <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>{"Promise<JwtPayload>"}</span> {"{"}
                </span>
              </div>
            </CodeLineFlash>
          )}
          {codeProgress > 0.5 && (
            <CodeLineFlash appearFrame={260} flashDuration={10}>
              <div style={{ display: "flex", gap: 24 }}>
                <span style={{ width: 28, color: "rgba(255, 255, 255, 0.15)", textAlign: "right" }}>10</span>
                <span>
                  <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>    return new</span> <span style={{ color: "#FFFFFF" }}>Promise</span>{"((resolve, reject) => {"}
                </span>
              </div>
            </CodeLineFlash>
          )}
          {codeProgress > 0.75 && (
            <CodeLineFlash appearFrame={275} flashDuration={10}>
              <div style={{ display: "flex", gap: 24 }}>
                <span style={{ width: 28, color: "rgba(255, 255, 255, 0.15)", textAlign: "right" }}>11</span>
                <span>
                  {"      "}jwt.<span style={{ color: "#FFFFFF" }}>verify</span>(token, <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>this</span>.publicKey, {"{ algorithms: ['RS256'] }"}, (err, decoded) ={">"} {"{"}
                </span>
              </div>
            </CodeLineFlash>
          )}
          {codeProgress >= 0.95 && (
            <CodeLineFlash appearFrame={290} flashDuration={10}>
              <div style={{ display: "flex", gap: 24 }}>
                <span style={{ width: 28, color: "rgba(255, 255, 255, 0.15)", textAlign: "right" }}>12</span>
                <span>
                  <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>        if</span> (err) <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>return</span> <span style={{ color: "#FFFFFF" }}>reject</span>(<span style={{ color: "rgba(255, 255, 255, 0.6)" }}>new</span> UnauthorizedException(<span style={{ color: "rgba(255, 255, 255, 0.35)" }}>'Invalid RS256 token'</span>));
                </span>
              </div>
            </CodeLineFlash>
          )}

          <div style={{ display: "flex", gap: 24 }}>
            <span style={{ width: 28, color: "rgba(255, 255, 255, 0.15)", textAlign: "right" }}>
              {codeProgress >= 0.95 ? 13 : 8}
            </span>
            <span>{"}"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
