import { useEffect, useMemo, useRef, useState } from "react";
import { PLAYER1_ANIMS } from "../game/player1Animations";

const FRAME_SIZE = 256;
const COLS = 20;

export default function Player1Sprite({
  anim = "HANG_IDLE",
  speed = 0.75,          // ✅ 1 = normal, 0.75 slower, 0.5 much slower
  onDone = null,         // ✅ called when a non-loop anim finishes
  className = "",
  style = {},
}) {
  const [frame, setFrame] = useState(0);

  const requestRef = useRef(null);
  const lastTimeRef = useRef(0);
  const doneRef = useRef(false);

  const animData = useMemo(() => PLAYER1_ANIMS[anim], [anim]);

  // Reset frame + completion whenever anim changes
  useEffect(() => {
    if (!animData) return;
    setFrame(animData.start);
    lastTimeRef.current = 0;
    doneRef.current = false;
  }, [animData]);

  // RAF loop (✅ only one loop, not every render)
  useEffect(() => {
    if (!animData) return;

    const tick = (time) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;

      const delta = time - lastTimeRef.current;

      // ✅ slow down by speed
      const fps = Math.max(1, animData.fps || 8);
      const frameDuration = (1000 / fps) / Math.max(0.1, speed);

      if (delta >= frameDuration) {
        lastTimeRef.current = time;

        setFrame((f) => {
          // If already done and non-loop, freeze last frame
          if (!animData.loop && f >= animData.end) return animData.end;

          const next = f + 1;

          if (next <= animData.end) return next;

          if (animData.loop) return animData.start;

          // non-loop finished
          if (!doneRef.current) {
            doneRef.current = true;
            if (typeof onDone === "function") {
              // call on next microtask so React state updates are safe
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

  const col = frame % COLS;
  const row = Math.floor(frame / COLS);

  return (
    <div
      className={className}
      style={{
        width: FRAME_SIZE,
        height: FRAME_SIZE,
        backgroundImage: `url(/src/assets/sprite/character_sprite_sheet.png)`,
        backgroundPosition: `-${col * FRAME_SIZE}px -${row * FRAME_SIZE}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        ...style,
      }}
    />
  );
}