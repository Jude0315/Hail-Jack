/*
Parts of this file were developed with assistance from ChatGPT (OpenAI), April 2026.
The suggestions were reviewed, understood, modified, tested, and integrated into this project by me.
This includes support with sprite animation timing, frame progression, and completion handling logic.
*/

import { useEffect, useMemo, useRef, useState } from "react";
import { PLAYER1_ANIMS } from "../game/player1Animations";

const FRAME_SIZE = 256;
const COLS = 20;

export default function Player1Sprite({
  anim = "HANG_IDLE",
  speed = 0.75,
  onDone = null,
  className = "",
  style = {},
}) {
  // Store the current sprite frame being displayed
  const [frame, setFrame] = useState(0);

  // Refs used to control animation timing and avoid repeated completion events
  const requestRef = useRef(null);
  const lastTimeRef = useRef(0);
  const doneRef = useRef(false);

  // Get animation settings for the current animation name
  const animData = useMemo(() => PLAYER1_ANIMS[anim], [anim]);

  // Reset the frame whenever the animation changes
  useEffect(() => {
    if (!animData) return;
    setFrame(animData.start);
    lastTimeRef.current = 0;
    doneRef.current = false;
  }, [animData]);

  // The sprite animation loop below was developed with assistance from ChatGPT (OpenAI), April 2026.
  // I reviewed, understood, adapted, and integrated it into this project.
  useEffect(() => {
    if (!animData) return;

    const tick = (time) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;

      const delta = time - lastTimeRef.current;
      const fps = Math.max(1, animData.fps || 8);
      const frameDuration = (1000 / fps) / Math.max(0.1, speed);

      if (delta >= frameDuration) {
        lastTimeRef.current = time;

        setFrame((f) => {
          // Stay on the final frame if this animation does not loop
          if (!animData.loop && f >= animData.end) return animData.end;

          const next = f + 1;

          if (next <= animData.end) return next;

          // Restart from the first frame if the animation is a loop
          if (animData.loop) return animData.start;

          // Notify the parent component once when a non-looping animation finishes
          if (!doneRef.current) {
            doneRef.current = true;
            if (typeof onDone === "function") {
              Promise.resolve().then(() => onDone(anim));
            }
          }

          return animData.end;
        });
      }

      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animData, speed, onDone, anim]);

  // Convert the frame number into sprite sheet row and column coordinates
  const col = frame % COLS;
  const row = Math.floor(frame / COLS);

  return (
    <div
      className={className}
      style={{
        width: FRAME_SIZE,
        height: FRAME_SIZE,
        backgroundImage: `url(/src/assets/sprite/player1_sprite_sheet.png)`,
        backgroundPosition: `-${col * FRAME_SIZE}px -${row * FRAME_SIZE}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        ...style,
      }}
    />
  );
}