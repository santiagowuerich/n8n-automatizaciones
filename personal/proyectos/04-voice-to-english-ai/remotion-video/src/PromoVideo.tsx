import React from "react";
import { AbsoluteFill, Sequence, staticFile, Audio, useCurrentFrame, interpolate } from "remotion";
import { FilmGrain } from "./effects/FilmGrain";
import { HookScene } from "./scenes/HookScene";
import { VoiceScene } from "./scenes/VoiceScene";
import { TextScene } from "./scenes/TextScene";
import { OutroScene } from "./scenes/OutroScene";

export const PromoVideo: React.FC = () => {
  const frame = useCurrentFrame();

  // Smart Audio Ducking: lowers music to 0.04 during Spanish voice speech (150-295), restores to 0.14
  const musicVolume = interpolate(
    frame,
    [0, 30, 148, 160, 290, 305, 920, 960],
    [0, 0.14, 0.14, 0.04, 0.04, 0.14, 0.14, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "geometricPrecision",
        overflow: "hidden",
      }}
    >
      {/* 1. Ambient Soundtrack with Smart Ducking */}
      <Audio src={staticFile("ambient_track.wav")} volume={musicVolume} />

      {/* --- SCENE 1: Hook (0 - 150) --- */}
      <Sequence from={0} durationInFrames={150}>
        <HookScene />
      </Sequence>

      {/* --- SCENE 2: Voice Demo (150 - 450) --- */}
      {/* Transition Whoosh */}
      <Sequence from={148} durationInFrames={30}>
        <Audio src={staticFile("remotion_whoosh.wav")} volume={0.12} />
      </Sequence>

      {/* Authentic Apple Record Start Audio Cue */}
      <Sequence from={150} durationInFrames={30}>
        <Audio src={staticFile("apple_record_start.wav")} volume={0.4} />
      </Sequence>

      {/* Real Spoken Spanish Voice Audio Track (Ducked Music) */}
      <Sequence from={155} durationInFrames={145}>
        <Audio src={staticFile("spanish_voice.wav")} volume={0.9} />
      </Sequence>

      {/* Authentic Apple Record Stop Audio Cue */}
      <Sequence from={295} durationInFrames={35}>
        <Audio src={staticFile("apple_record_stop.wav")} volume={0.4} />
      </Sequence>

      {/* ⚡ AI Morph SFX on 140ms Groq Transformation */}
      <Sequence from={298} durationInFrames={15}>
        <Audio src={staticFile("ai_morph.wav")} volume={0.2} />
      </Sequence>

      {/* Authentic Apple Sent / Prompt Injected Confirmation */}
      <Sequence from={330} durationInFrames={40}>
        <Audio src={staticFile("apple_sent.wav")} volume={0.35} />
      </Sequence>

      <Sequence from={150} durationInFrames={300}>
        <VoiceScene />
      </Sequence>

      {/* --- SCENE 3: Text Demo (450 - 750) --- */}
      {/* Transition Whoosh */}
      <Sequence from={448} durationInFrames={30}>
        <Audio src={staticFile("remotion_whoosh.wav")} volume={0.12} />
      </Sequence>

      {/* Apple Pop on Quick Input Bar Activation */}
      <Sequence from={450} durationInFrames={25}>
        <Audio src={staticFile("apple_pop.wav")} volume={0.25} />
      </Sequence>

      {/* Enter Keypress Click */}
      <Sequence from={570} durationInFrames={25}>
        <Audio src={staticFile("remotion_click.wav")} volume={0.15} />
      </Sequence>

      {/* ⚡ AI Morph SFX on Groq Translation */}
      <Sequence from={572} durationInFrames={15}>
        <Audio src={staticFile("ai_morph.wav")} volume={0.2} />
      </Sequence>

      {/* Authentic Apple Sent / Code Generation Injected */}
      <Sequence from={600} durationInFrames={40}>
        <Audio src={staticFile("apple_sent.wav")} volume={0.35} />
      </Sequence>

      <Sequence from={450} durationInFrames={300}>
        <TextScene />
      </Sequence>

      {/* --- SCENE 4: Outro (750 - 960) --- */}
      <Sequence from={748} durationInFrames={30}>
        <Audio src={staticFile("remotion_whoosh.wav")} volume={0.12} />
      </Sequence>

      <Sequence from={750} durationInFrames={210}>
        <OutroScene />
      </Sequence>

      {/* Subtle Micro Film Grain */}
      <FilmGrain opacity={0.025} />
    </AbsoluteFill>
  );
};
