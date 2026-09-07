import React from "react";
import { Composition } from "remotion";
import { PromoVideo } from "./PromoVideo";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="PromoVideo"
        component={PromoVideo}
        durationInFrames={960}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PromoVideoVertical"
        component={PromoVideo}
        durationInFrames={960}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
