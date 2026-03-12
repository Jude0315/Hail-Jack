import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/intro.css";

export default function IntroScreen() {
  const navigate = useNavigate();
  const introRef = useRef(null);
  const audioRef = useRef(null);
  const clickAudioRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [titleVisible, setTitleVisible] = useState(false);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [muted, setMuted] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);

  useEffect(() => {
    const intro = introRef.current;
    if (!intro) return;

    let rafId = null;

    const handleMove = (e) => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const rect = intro.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const mx = (x - 0.5) * 2;
        const my = (y - 0.5) * 2;

        intro.style.setProperty("--mx", mx.toFixed(3));
        intro.style.setProperty("--my", my.toFixed(3));
        intro.style.setProperty("--px", `${x * 100}%`);
        intro.style.setProperty("--py", `${y * 100}%`);
      });
    };

    const handleLeave = () => {
      intro.style.setProperty("--mx", "0");
      intro.style.setProperty("--my", "0");
      intro.style.setProperty("--px", "50%");
      intro.style.setProperty("--py", "50%");
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const timers = [];

    timers.push(setTimeout(() => setTitleVisible(true), 500));
    timers.push(setTimeout(() => setSubtitleVisible(true), 1500));
    timers.push(setTimeout(() => setLoaderVisible(true), 2200));
    timers.push(setTimeout(() => setActionsVisible(true), 3000));

    const totalDuration = 10000;
    const intervalMs = 50;
    const step = 100 / (totalDuration / intervalMs);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return next;
      });
    }, intervalMs);

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 9800);

    const navTimer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 10500);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(progressInterval);
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  const goToLogin = () => {
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.volume = 0.6;
      clickAudioRef.current.play().catch(() => {});
    }

    setFadeOut(true);

    setTimeout(() => {
      navigate("/login", { replace: true });
    }, 700);
  };

  const toggleMute = async () => {
    const audio = audioRef.current;
    const clickAudio = clickAudioRef.current;

    if (!audio) return;

    try {
      if (clickAudio) {
        clickAudio.currentTime = 0;
        clickAudio.volume = 0.6;
        await clickAudio.play().catch(() => {});
      }

      if (muted) {
        audio.muted = false;
        audio.volume = 0.35;

        if (!audioStarted) {
          await audio.play();
          setAudioStarted(true);
        }

        setMuted(false);
      } else {
        audio.muted = true;
        setMuted(true);
      }
    } catch (err) {
      console.warn("Audio could not start:", err);
    }
  };

  return (
    <div
      className={`hail-intro ${fadeOut ? "intro-fade-out" : ""}`}
      ref={introRef}
    >
      <audio ref={audioRef} loop preload="auto" muted>
        <source src="/sounds/icy-wind.mp3" type="audio/mpeg" />
      </audio>

      <audio ref={clickAudioRef} preload="auto">
        <source src="/sounds/ui-click.mp3" type="audio/mpeg" />
      </audio>

      <div className="intro-vignette" />
      <div className="intro-exit-vignette" />
      <div className="intro-noise" />
      <div className="intro-cursor-glow" />
      <div className="intro-aurora aurora-a" />
      <div className="intro-aurora aurora-b" />

      <div className="intro-moon-wrap">
        <div className="intro-moon-aura" />
        <div className="intro-moon-rays" />
        <div className="intro-moon" />
      </div>

      <div className="intro-stars intro-stars-a" />
      <div className="intro-stars intro-stars-b" />

      <div className="intro-fog fog-1" />
      <div className="intro-fog fog-2" />
      <div className="intro-fog fog-3" />
      <div className="intro-fog fog-4" />

      <div className="intro-snow">
        {Array.from({ length: 28 }, (_, i) => (
          <span key={i} className={`flake flake-${i + 1}`}>
            ❄
          </span>
        ))}
      </div>

      <div className="intro-icefield">
        <div className="iceberg iceberg-1" />
        <div className="iceberg iceberg-2" />
        <div className="iceberg iceberg-3" />
        <div className="iceberg iceberg-4" />
      </div>

      <div className="intro-water">
        <div className="wave wave-1" />
        <div className="wave wave-2" />
        <div className="wave wave-3" />
        <div className="wave wave-4" />
        <div className="water-shine" />
        <div className="water-ripple" />
      </div>

      <div className="intro-center">
        <p className={`intro-pretitle ${titleVisible ? "show" : ""}`}>
          frozen ocean rescue protocol
        </p>

        <h1 className={`intro-title ${titleVisible ? "show" : ""}`}>
          <span>HAIL</span>
          <span>JACK</span>
        </h1>

        <p className={`intro-subtitle ${subtitleVisible ? "show" : ""}`}>
          Survive the storm. Save the sailor.
        </p>

        <div className={`intro-loader-shell ${loaderVisible ? "show" : ""}`}>
          <div className="intro-loader-label-row">
            <span>Preparing voyage...</span>
            <span>{Math.floor(progress)}%</span>
          </div>

          <div className="intro-loader-track">
            <div
              className="intro-loader-fill"
              style={{ width: `${progress}%` }}
            />
            <div className="intro-loader-scan" />
          </div>

          <p className="intro-loader-note">
            Loading frozen sea environment...
          </p>
        </div>

        
      </div>

      <button className="intro-mute-btn" onClick={toggleMute}>
        {muted ? "🔇 Muted" : "🔊 Sound On"}
      </button>
    </div>
  );
}