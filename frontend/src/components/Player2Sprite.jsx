/*
Parts of this file were developed with assistance from ChatGPT (OpenAI), April 2026.
The suggestions were reviewed, understood, modified, tested, and integrated into this project by me.
This includes support with sprite animation timing, frame progression, and animation completion handling.
*/

import { useEffect, useMemo, useRef, useState } from "react";
import { PLAYER2_ANIMS } from "../game/player2Animations";

const FRAME_SIZE = 256;
const COLS = 20;

export default function Player2Sprite({
  anim = "HANG_IDLE",
  speed = 0.75,
  onDone = null,
  className = "",
  style = {},
}) {
  // Track the current frame index of the sprite
  const [frame, setFrame] = useState(0);

  // Refs used for animation timing and completion tracking
  const requestRef = useRef(null);
  const lastTimeRef = useRef(0);
  const doneRef = useRef(false);

  // Get animation configuration for the selected animation
  const animData = useMemo(() => PLAYER2_ANIMS[anim], [anim]);

  // Reset animation state whenever animation changes
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
          // Stay on last frame if animation is not looping
          if (!animData.loop && f >= animData.end) return animData.end;

          const next = f + 1;

          if (next <= animData.end) return next;

          // Restart animation if looping
          if (animData.loop) return animData.start;

          // Trigger onDone callback once when animation completes
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

  // Convert frame index into sprite sheet coordinates
  const col = frame % COLS;
  const row = Math.floor(frame / COLS);

  return (
    <div
      className={className}
      style={{
        width: FRAME_SIZE,
        height: FRAME_SIZE,
        backgroundImage: `url(/src/assets/sprite/player2_sprite_sheet.png)`,
        backgroundPosition: `-${col * FRAME_SIZE}px -${row * FRAME_SIZE}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        ...style,
      }}
    />
  );
}