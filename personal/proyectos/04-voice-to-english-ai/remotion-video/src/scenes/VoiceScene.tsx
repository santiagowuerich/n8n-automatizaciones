import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { ClaudeCodeTerminal } from "../components/ClaudeCodeTerminal";
import { CompactRedRecordingPopover } from "../components/CompactRedRecordingPopover";
import { KeypressHUD } from "../components/KeypressHUD";
import { Spotlight } from "../effects/Spotlight";
import { CinematicCamera } from "../effects/CinematicCamera";
import { AnamorphicStreak } from "../effects/AnamorphicStreak";

export const VoiceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isRecording = frame < 145;
  const isProcessing = frame >= 145 && frame < 180;
  const isPasted = frame >= 180;

  const entrance = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.6 },
  });

  // 1. Aggressive snap macro zoom on activation (1.65x), then smooth dezoom during speech
  const cameraZoom = interpolate(
    frame,
    [0, 15, 30, 135, 160],
    [1.0, 1.68, 1.68, 1.12, 1.0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }
  );

  // 2. Pan to center tightly on the red popover & prompt bar during activation, then return to center
  const cameraPanY = interpolate(
    frame,
    [0, 15, 30, 135, 160],
    [0, 190, 190, 35, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }
  );

  // 3. Subtle 3D perspective pitch on snap zoom
  const tiltX = interpolate(
    frame,
    [0, 15, 30, 135, 160],
    [0, 3.8, 3.8, 0.8, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }
  );

  const originalVoiceText =
    "Refactorizá este endpoint a Server-Sent Events con reconexión automática";

  const generatedPrompt =
    "Refactor this endpoint to support Server-Sent Events (SSE) streaming with an adaptive backpressure buffer and automatic client reconnection.";

  const executionProgress = interpolate(frame, [245, 295], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Spotlight focusX={50} focusY={50} radius={55} dimAmount={0.25} />

      {/* Anamorphic Lens Flare Streak on 140ms Groq Morph */}
      <AnamorphicStreak triggerFrame={145} durationFrames={16} centerY={46} />

      {/* Solid Cinematic Camera with Aggressive Macro Zoom & Progressive Dezoom */}
      <CinematicCamera
        zoom={interpolate(entrance, [0, 1], [0.95, 1]) * cameraZoom}
        panY={cameraPanY}
        tiltX={tiltX}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: entrance,
          }}
        >
          {/* Sleek Compact Red Recording Pill */}
          <div style={{ marginBottom: 18 }}>
            <CompactRedRecordingPopover
              isRecording={isRecording}
              isProcessing={isProcessing}
              isPasted={isPasted}
              recordingDuration={frame / 30}
            />
          </div>

          {/* Full Centered 1400px Claude Code Terminal */}
          <ClaudeCodeTerminal
            isRecording={isRecording}
            isProcessing={isProcessing}
            isPasted={isPasted}
            spanishText={originalVoiceText}
            englishPrompt={generatedPrompt}
            isExecuting={frame >= 245}
            executionProgress={executionProgress}
            hotkey="⌥ Space"
            width={1400}
          />
        </div>
      </CinematicCamera>

      {/* Floating Keypress HUD on Hotkey */}
      <KeypressHUD
        keys={["⌥ Option", "Space"]}
        activeFromFrame={0}
        durationFrames={150}
        label="Hold to Speak"
        position="bottom-center"
      />
    </div>
  );
};
