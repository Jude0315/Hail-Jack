import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/howtoplay.css";

export default function HowToPlay() {
  const navigate = useNavigate();
  const sceneRef = useRef(null);

  const [muted, setMuted] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);

  const audioRef = useRef(null);
  const clickAudioRef = useRef(null);
  const backAudioRef = useRef(null);
  const startAudioRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    let rafId = null;

    const updateVars = (clientX, clientY) => {
      const rect = scene.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;

      const px = (x - 0.5) * 2;
      const py = (y - 0.5) * 2;

      scene.style.setProperty("--mx", String(px));
      scene.style.setProperty("--my", String(py));
      scene.style.setProperty("--mouse-x", `${clientX - rect.left}px`);
      scene.style.setProperty("--mouse-y", `${clientY - rect.top}px`);
      scene.style.setProperty("--card-rx", `${-py * 6}deg`);
      scene.style.setProperty("--card-ry", `${px * 8}deg`);
    };

    const handleMove = (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => updateVars(e.clientX, e.clientY));
    };

    const handleLeave = () => {
      scene.style.setProperty("--mx", "0");
      scene.style.setProperty("--my", "0");
      scene.style.setProperty("--card-rx", "0deg");
      scene.style.setProperty("--card-ry", "0deg");
      scene.style.setProperty("--mouse-x", "50%");
      scene.style.setProperty("--mouse-y", "50%");
    };

    scene.addEventListener("mousemove", handleMove);
    scene.addEventListener("mouseleave", handleLeave);

    return () => {
      scene.removeEventListener("mousemove", handleMove);
      scene.removeEventListener("mouseleave", handleLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const playAudio = (audioEl, volume = 0.7) => {
    if (!audioEl) return;

    try {
      audioEl.pause();
      audioEl.currentTime = 0;
      audioEl.volume = volume;

      const playPromise = audioEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } catch {}
  };

  const playMuteClickSound = () => {
    playAudio(clickAudioRef.current, 0.6);
  };

  const playBackSound = () => {
    playAudio(backAudioRef.current, 0.75);
  };

  const playStartSound = () => {
    playAudio(startAudioRef.current, 0.75);
  };

  const primeAudio = async (audioEl) => {
    if (!audioEl) return;
    try {
      await audioEl.play();
      audioEl.pause();
      audioEl.currentTime = 0;
    } catch {}
  };

  // ✅ FIXED MUTE BUTTON
  const toggleMute = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (muted) {
        // 🔊 TURN ON
        audio.muted = false;
        audio.volume = 0.3;

        if (!audioStarted) {
          await audio.play();

          await primeAudio(clickAudioRef.current);
          await primeAudio(backAudioRef.current);
          await primeAudio(startAudioRef.current);

          setAudioStarted(true);
        }

        playMuteClickSound();
        setMuted(false);
      } else {
        // 🔇 TURN OFF
        playMuteClickSound();

        setTimeout(() => {
          audio.muted = true;
          setMuted(true);
        }, 120);
      }
    } catch (err) {
      console.warn("HowToPlay audio could not start:", err);
    }
  };

  const goBack = () => {
    playBackSound();
    setTimeout(() => {
      navigate("/dashboard");
    }, 400);
  };

  const goToGame = () => {
    playStartSound();
    setTimeout(() => {
      navigate("/game");
    }, 400);
  };

  const snowflakes = Array.from({ length: 18 }, (_, i) => i + 1);

  return (
    <div className="hail-how-page" ref={sceneRef}>
      <audio ref={audioRef} loop preload="auto" muted>
        <source src="/sounds/icy-wind.mp3" type="audio/mpeg" />
      </audio>

      <audio ref={clickAudioRef} preload="auto">
        <source src="/sounds/ui-click.mp3" type="audio/mpeg" />
      </audio>

      <audio ref={backAudioRef} preload="auto">
        <source src="/sounds/back-login.mp3" type="audio/mpeg" />
      </audio>

      <audio ref={startAudioRef} preload="auto">
        <source src="/sounds/start-voyage.mp3" type="audio/mpeg" />
      </audio>

      <div className="hail-how-overlay" />
      <div className="hail-how-stars layer" />
      <div className="hail-how-moon-glow layer" />
      <div className="hail-how-moon layer" />

      <div className="hail-how-cloud hail-how-cloud-1 layer" />
      <div className="hail-how-cloud hail-how-cloud-2 layer" />
      <div className="hail-how-cloud hail-how-cloud-3 layer" />

      <div className="hail-how-snow layer">
        {snowflakes.map((n) => (
          <span key={n} className={`hail-howflake hail-howflake-${n}`}>
            ❄
          </span>
        ))}
      </div>

      <div className="hail-how-wave hail-how-wave-back layer" />
      <div className="hail-how-wave hail-how-wave-mid layer" />
      <div className="hail-how-wave hail-how-wave-front layer" />

      <div className="hail-how-shell">
        <div className="hail-how-card">
          <div className="hail-how-topbar">
            <div>
              <p className="hail-how-kicker">Frozen Survival Guide</p>
              <h1 className="hail-how-title">How to Play</h1>
            </div>

            <button className="hail-how-btn secondary compact" onClick={goBack}>
              Back
            </button>
          </div>

          <div className="hail-how-layout">
            <section className="hail-how-left">
              <div className="hail-how-hero">
                <span className="hail-how-badge">Jack Needs You</span>
                <h2>Keep Jack on the plank. Don’t let the sea win.</h2>
                <p>
                  Every correct answer pulls the balance toward survival. Every
                  wrong answer pushes the duel toward the freezing Atlantic.
                </p>

                <div className="hail-how-quote">
                  <span>Jack says</span>
                  <p>“Answer fast, answer smart... I really don’t want to sink.”</p>
                </div>
              </div>

              <div className="hail-how-preview">
                <div className="hail-how-preview-top">
                  <span>Game Flow</span>
                  <span>Quiz Duel</span>
                </div>

                <div className="hail-how-meter-demo">
                  <div className="hail-how-side left">Rose</div>
                  <div className="hail-how-bar">
                    <div className="hail-how-bar-fill" />
                    <div className="hail-how-bar-center" />
                  </div>
                  <div className="hail-how-side right">Jack</div>
                </div>

                <div className="hail-how-preview-steps">
                  <div className="hail-how-mini-step"><strong>1</strong><span>Read the question</span></div>
                  <div className="hail-how-mini-step"><strong>2</strong><span>Pick the right answer</span></div>
                  <div className="hail-how-mini-step"><strong>3</strong><span>Shift the balance</span></div>
                  <div className="hail-how-mini-step"><strong>4</strong><span>Stay above the sea</span></div>
                </div>
              </div>
            </section>

            <section className="hail-how-right">
              <div className="hail-how-rule-card">
                <div className="hail-how-rule-head">
                  <span className="hail-how-badge blue">Core Rules</span>
                </div>

                <div className="hail-how-rule-list">
                  <div className="hail-how-rule-item"><div className="hail-how-rule-num">01</div><div><h3>Answer correctly</h3><p>A correct answer moves the balance toward Jack.</p></div></div>
                  <div className="hail-how-rule-item"><div className="hail-how-rule-num">02</div><div><h3>Wrong answers hurt</h3><p>A wrong answer pushes the duel toward the sea.</p></div></div>
                  <div className="hail-how-rule-item"><div className="hail-how-rule-num">03</div><div><h3>Watch the meter</h3><p>The meter shows who is winning the plank battle.</p></div></div>
                  <div className="hail-how-rule-item"><div className="hail-how-rule-num">04</div><div><h3>Reach the edge first</h3><p>If the balance reaches Jack’s side, you win. If it reaches Rose’s side, you lose.</p></div></div>
                </div>
              </div>

              <div className="hail-how-actions">
                <button className="hail-how-btn primary" onClick={goToGame}>
                  Start Rescue
                </button>
                <button className="hail-how-btn secondary" onClick={goBack}>
                  Back to Dashboard
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      <button className="hail-sound-btn" onClick={toggleMute}>
        {muted ? "🔇 Muted" : "🔊 Sound On"}
      </button>
    </div>
  );
}