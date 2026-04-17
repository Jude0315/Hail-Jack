/*
Parts of this file were developed with assistance from ChatGPT (OpenAI), April 2026.
The suggestions were reviewed, understood, modified, tested, and integrated into this project by me.
This includes support with dashboard user loading, audio controls, navigation flow, and interactive visual effects.
*/

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const sceneRef = useRef(null);

  // Store the logged-in player's name for the welcome message
  const [playerName, setPlayerName] = useState("Crew Member");
  const [pageLoading, setPageLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Audio state
  const [muted, setMuted] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);

  // Audio references
  const audioRef = useRef(null);
  const clickAudioRef = useRef(null);
  const startAudioRef = useRef(null);
  const menuAudioRef = useRef(null);
  const logoutAudioRef = useRef(null);

  // Load the current logged-in user before showing the dashboard
  // The user-loading logic below was developed with assistance from ChatGPT (OpenAI), April 2026.
  // I reviewed, understood, adapted, and integrated it into this project.
  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        setPageLoading(true);

        const res = await axios.get("http://localhost:3001/me", {
          withCredentials: true,
        });

        if (!mounted) return;

        const name =
          res.data?.name ||
          res.data?.playerName ||
          res.data?.user?.name ||
          res.data?.user?.playerName ||
          "Crew Member";

        setPlayerName(name);
      } catch (err) {
        console.warn("Could not load current user:", err?.response || err);

        if (!mounted) return;
        navigate("/login", { replace: true });
        return;
      } finally {
        if (mounted) {
          setPageLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // The mouse-based dashboard interaction below was developed with assistance from ChatGPT (OpenAI), April 2026.
  // I reviewed, understood, modified, and integrated it into this project.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || pageLoading) return;

    let rafId = null;

    // Update CSS variables so the dashboard reacts to mouse movement
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
      scene.style.setProperty("--card-rx", `${-py * 7}deg`);
      scene.style.setProperty("--card-ry", `${px * 9}deg`);
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
  }, [pageLoading]);

  // Generic helper to safely play UI audio
  const playAudio = (audioEl, volume = 0.7) => {
    if (!audioEl) return;
    audioEl.currentTime = 0;
    audioEl.volume = volume;
    audioEl.play().catch(() => {});
  };

  const playMuteClickSound = () => {
    playAudio(clickAudioRef.current, 0.6);
  };

  const playStartSound = () => {
    playAudio(startAudioRef.current, 0.75);
  };

  const playMenuSound = () => {
    playAudio(menuAudioRef.current, 0.75);
  };

  const playLogoutSound = () => {
    playAudio(logoutAudioRef.current, 0.75);
  };

  // The audio toggle logic below was developed with assistance from ChatGPT (OpenAI), April 2026.
  // I reviewed, understood, adapted, and integrated it into this project.
  const toggleMute = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      playMuteClickSound();

      if (muted) {
        audio.muted = false;
        audio.volume = 0.3;

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
      console.warn("Dashboard audio could not start:", err);
    }
  };

  // Navigate to the main game page
  const goToGame = () => {
    playStartSound();
    setTimeout(() => {
      navigate("/game");
    }, 250);
  };

  // Navigate to the leaderboard page
  const goToLeaderboard = () => {
    playMenuSound();
    setTimeout(() => {
      navigate("/leaderboard");
    }, 250);
  };

  // Navigate to the how-to-play page
  const goToHowToPlay = () => {
    playMenuSound();
    setTimeout(() => {
      navigate("/how");
    }, 250);
  };

  // Log the user out and return them to the login screen
  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      playLogoutSound();

      await axios.post(
        "http://localhost:3001/logout",
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.warn("Logout failed, continuing anyway.", err?.response || err);
    } finally {
      setTimeout(() => {
        setLoggingOut(false);
        navigate("/login", { replace: true });
      }, 250);
    }
  };

  // Create repeated decorative elements for the animated scene
  const snowflakes = Array.from({ length: 34 }, (_, i) => i + 1);
  const stars = Array.from({ length: 18 }, (_, i) => i + 1);
  const shards = Array.from({ length: 12 }, (_, i) => i + 1);

  // Loading screen while the user session is being checked
  if (pageLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(180deg, #08111f 0%, #0d1f33 100%)",
          color: "white",
          fontSize: "1.2rem",
        }}
      >
        <audio ref={audioRef} loop preload="auto" muted>
          <source src="/sounds/icy-wind.mp3" type="audio/mpeg" />
        </audio>

        <audio ref={clickAudioRef} preload="auto">
          <source src="/sounds/ui-click.mp3" type="audio/mpeg" />
        </audio>

        <audio ref={startAudioRef} preload="auto">
          <source src="/sounds/start-voyage.mp3" type="audio/mpeg" />
        </audio>

        <audio ref={menuAudioRef} preload="auto">
          <source src="/sounds/open-register.mp3" type="audio/mpeg" />
        </audio>

        <audio ref={logoutAudioRef} preload="auto">
          <source src="/sounds/open-register.mp3" type="audio/mpeg" />
        </audio>

        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="hail-dashboard" ref={sceneRef}>
      <audio ref={audioRef} loop preload="auto" muted>
        <source src="/sounds/icy-wind.mp3" type="audio/mpeg" />
      </audio>

      <audio ref={clickAudioRef} preload="auto">
        <source src="/sounds/ui-click.mp3" type="audio/mpeg" />
      </audio>

      <audio ref={startAudioRef} preload="auto">
        <source src="/sounds/start-voyage.mp3" type="audio/mpeg" />
      </audio>

      <audio ref={menuAudioRef} preload="auto">
        <source src="/sounds/open-register.mp3" type="audio/mpeg" />
      </audio>

      <audio ref={logoutAudioRef} preload="auto">
        <source src="/sounds/open-register.mp3" type="audio/mpeg" />
      </audio>

      <div className="hail-sky-gradient" />
      <div className="hail-moon-glow" />
      <div className="hail-moon-rays" />
      <div className="hail-moon" />

      <div className="hail-star-layer hail-star-layer-a">
        {stars.map((n) => (
          <span key={`a-${n}`} className={`hail-star star-a-${n}`} />
        ))}
      </div>

      <div className="hail-star-layer hail-star-layer-b">
        {stars.map((n) => (
          <span key={`b-${n}`} className={`hail-star star-b-${n}`} />
        ))}
      </div>

      <div className="hail-aurora aurora-1" />
      <div className="hail-aurora aurora-2" />

      <div className="hail-fog fog-1" />
      <div className="hail-fog fog-2" />
      <div className="hail-fog fog-3" />
      <div className="hail-fog fog-4" />

      <div className="hail-glacier-range glacier-far">
        <div className="glacier gf1" />
        <div className="glacier gf2" />
        <div className="glacier gf3" />
        <div className="glacier gf4" />
        <div className="glacier gf5" />
      </div>

      <div className="hail-glacier-range glacier-back">
        <div className="glacier gb1" />
        <div className="glacier gb2" />
        <div className="glacier gb3" />
        <div className="glacier gb4" />
      </div>

      <div className="hail-glacier-range glacier-mid">
        <div className="glacier gm1" />
        <div className="glacier gm2" />
        <div className="glacier gm3" />
      </div>

      <div className="hail-icebergs-layer">
        <div className="hail-iceberg ib1" />
        <div className="hail-iceberg ib2" />
        <div className="hail-iceberg ib3" />
        <div className="hail-iceberg ib4" />
      </div>

      <div className="hail-shards-layer">
        {shards.map((n) => (
          <span key={n} className={`hail-ice-shard shard-${n}`} />
        ))}
      </div>

      <div className="hail-cursor-ripple" />

      <div className="hail-snow-layer">
        {snowflakes.map((n) => (
          <span key={n} className={`hail-snowflake snow-${n}`}>
            ❄
          </span>
        ))}
      </div>

      <div className="hail-water">
        <div className="hail-wave wave-1" />
        <div className="hail-wave wave-2" />
        <div className="hail-wave wave-3" />
        <div className="hail-wave wave-4" />
        <div className="hail-wave wave-5" />
        <div className="hail-water-shine" />
      </div>

      <div className="hail-dashboard-topbar">
        <div className="hail-user-chip">
          <span className="hail-user-glow" />
          <span className="hail-user-text">
            Welcome aboard, <strong>{playerName}</strong>
          </span>
        </div>

        <button
          className="hail-logout-btn"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>

      <div className="hail-dashboard-ui">
        <div className="hail-main-card">
          <div className="hail-card-top-light" />
          <p className="hail-kicker">Frozen Ocean Challenge</p>
          <h1 className="hail-main-title">HAIL JACK</h1>
          <p className="hail-main-subtitle">
            Tug-of-War Quiz • Survive the sea • Beat the rival
          </p>

          <div className="hail-quote-box">
            <span className="hail-quote-label">Jack says</span>
            <p>“The sea is cold... your answers are my only hope.”</p>
          </div>

          <button className="hail-start-btn" onClick={goToGame}>
            Start Rescue
          </button>

          <div className="hail-menu-grid">
            <button className="hail-menu-btn" onClick={goToLeaderboard}>
              Leaderboard
            </button>

            <button className="hail-menu-btn" onClick={goToHowToPlay}>
              How to Play
            </button>
          </div>
        </div>
      </div>

      <button className="hail-sound-btn" onClick={toggleMute}>
        {muted ? "🔇 Muted" : "🔊 Sound On"}
      </button>
    </div>
  );
}