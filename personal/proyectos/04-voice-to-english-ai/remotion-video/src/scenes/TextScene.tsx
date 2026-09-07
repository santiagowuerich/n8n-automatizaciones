import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { RealCodeEditor } from "../components/RealCodeEditor";
import { KeypressHUD } from "../components/KeypressHUD";
import { Spotlight } from "../effects/Spotlight";
import { CinematicCamera } from "../effects/CinematicCamera";
import { AnamorphicStreak } from "../effects/AnamorphicStreak";

export const TextScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spanishInput = "agregale caching con redis y middleware de rate limiting a esta api";
  const englishOutput =
    "Add distributed Redis caching and a sliding-window rate limiting middleware to this API endpoint with strict token bucket fallback.";

  const isTypingSpanish = frame < 120;
  const isTranslating = frame >= 120 && frame < 150;
  const isFinished = frame >= 150;

  const codeProgress = interpolate(frame, [230, 295], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const entrance = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.6 },
  });

  // Aggressive snap macro zoom on entrance (1.62x), then smooth dezoom during typing
  const cameraZoom = interpolate(
    frame,
    [0, 15, 30, 115, 145],
    [1.0, 1.62, 1.62, 1.10, 1.0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }
  );

  const cameraPanY = interpolate(
    frame,
    [0, 15, 30, 115, 145],
    [0, 175, 175, 30, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }
  );

  const tiltX = interpolate(
    frame,
    [0, 15, 30, 115, 145],
    [0, 3.4, 3.4, 0.6, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Spotlight focusX={50} focusY={50} radius={55} dimAmount={0.25} />

      {/* Anamorphic Lens Flare Streak on Groq Translate */}
      <AnamorphicStreak triggerFrame={120} durationFrames={16} centerY={48} />

      {/* Solid Cinematic Camera with Aggressive Macro Zoom & Progressive Dezoom */}
      <CinematicCamera
        zoom={interpolate(entrance, [0, 1], [0.95, 1]) * cameraZoom}
        panY={cameraPanY}
        tiltX={tiltX}
      >
        <div style={{ opacity: entrance }}>
          <RealCodeEditor
            fileName="server.ts"
            isTypingSpanish={isTypingSpanish}
            isTranslating={isTranslating}
            isFinished={isFinished}
            spanishInput={spanishInput}
            englishOutput={englishOutput}
            isGeneratingCode={frame >= 230}
            codeProgress={codeProgress}
            hotkey="⌥ I"
          />
        </div>
      </CinematicCamera>

      {/* 1. Quick Input Activation HUD */}
      <KeypressHUD
        keys={["⌥ Option", "I"]}
        activeFromFrame={0}
        durationFrames={100}
        label="Quick Input Bar"
        position="bottom-center"
      />

      {/* 2. Enter to Translate & Inject HUD */}
      <KeypressHUD
        keys={["↵ Return"]}
        activeFromFrame={120}
        durationFrames={75}
        label="Translate & Inject"
        position="bottom-center"
      />
    </div>
  );
};
