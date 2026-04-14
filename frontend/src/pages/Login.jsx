import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [muted, setMuted] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);

  const audioRef = useRef(null);
  const clickAudioRef = useRef(null);
  const startAudioRef = useRef(null);
  const registerAudioRef = useRef(null);
  const errorAudioRef = useRef(null);
  const typingAudioRef = useRef(null);
  const lastTypeTimeRef = useRef(0);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const checkExistingSession = async () => {
      try {
        await axios.get("http://localhost:3001/me", {
          withCredentials: true,
        });

        if (!mounted) return;
        navigate("/dashboard", { replace: true });
      } catch (err) {
        if (!mounted) return;
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    checkExistingSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

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

  const playRegisterSound = () => {
    playAudio(registerAudioRef.current, 0.75);
  };

  const playErrorSound = () => {
    playAudio(errorAudioRef.current, 0.8);
  };

  const playTypingSound = () => {
    const audio = typingAudioRef.current;
    if (!audio || muted) return;

    const now = Date.now();
    if (now - lastTypeTimeRef.current < 45) return;
    lastTypeTimeRef.current = now;

    try {
      audio.currentTime = 0;
      audio.volume = 0.18;
      audio.play().catch(() => {});
    } catch {
      // ignore playback failures
    }
  };

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
      console.warn("Login audio could not start:", err);
    }
  };

  const goToRegister = () => {
    playRegisterSound();
    setTimeout(() => {
      navigate("/register");
    }, 250);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      playErrorSound();
      return;
    }

    setLoading(true);
    playStartSound();

    try {
      const result = await axios.post(
        "http://localhost:3001/login",
        { email, password },
        { withCredentials: true }
      );

      if (result.data?.message === "Success") {
        navigate("/dashboard", { replace: true });
        return;
      }

      setError(result.data?.message || "Login failed. Try again.");
      playErrorSound();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Server error.";
      setError(msg);
      playErrorSound();
      console.error("Login error:", err?.response || err);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="hail-login-page">
        <audio ref={audioRef} loop preload="auto" muted>
          <source src="/sounds/icy-wind.mp3" type="audio/mpeg" />
        </audio>

        <audio ref={clickAudioRef} preload="auto">
          <source src="/sounds/ui-click.mp3" type="audio/mpeg" />
        </audio>

        <audio ref={startAudioRef} preload="auto">
          <source src="/sounds/start-voyage.mp3" type="audio/mpeg" />
        </audio>

        <audio ref={registerAudioRef} preload="auto">
          <source src="/sounds/open-register.mp3" type="audio/mpeg" />
        </audio>

        <audio ref={errorAudioRef} preload="auto">
          <source src="/sounds/error-buzz.mp3" type="audio/mpeg" />
        </audio>

        <audio ref={typingAudioRef} preload="auto">
          <source src="/sounds/typewriter-key.mp3" type="audio/mpeg" />
        </audio>

        <div className="hail-login-overlay" />
        <div className="hail-stars layer" />
        <div className="hail-moon layer" />
        <div className="hail-moon-glow layer" />

        <div className="hail-login-content">
          <div className="hail-login-card">
            <div className="hail-card-top">
              <span className="hail-badge">Ocean Login</span>
              <h2>Checking Session</h2>
              <p>Please wait while we verify your crew pass.</p>
            </div>
          </div>
        </div>

        <button className="hail-sound-btn" onClick={toggleMute}>
          {muted ? "🔇 Muted" : "🔊 Sound On"}
        </button>
      </div>
    );
  }

  return (
    <div className="hail-login-page">
      <audio ref={audioRef} loop preload="auto" muted>
        <source src="/sounds/icy-wind.mp3" type="audio/mpeg" />
      </audio>

      <audio ref={clickAudioRef} preload="auto">
        <source src="/sounds/ui-click.mp3" type="audio/mpeg" />
      </audio>

      <audio ref={startAudioRef} preload="auto">
        <source src="/sounds/start-voyage.mp3" type="audio/mpeg" />
      </audio>

      <audio ref={registerAudioRef} preload="auto">
        <source src="/sounds/open-register.mp3" type="audio/mpeg" />
      </audio>

      <audio ref={errorAudioRef} preload="auto">
        <source src="/sounds/error-buzz.mp3" type="audio/mpeg" />
      </audio>

      <audio ref={typingAudioRef} preload="auto">
        <source src="/sounds/typewriter-key.mp3" type="audio/mpeg" />
      </audio>

      <div className="hail-login-overlay" />

      <div className="hail-stars layer" />
      <div className="hail-moon layer" />
      <div className="hail-moon-glow layer" />

      <div className="hail-cloud hail-cloud-1 layer" />
      <div className="hail-cloud hail-cloud-2 layer" />
      <div className="hail-cloud hail-cloud-3 layer" />

      <div className="hail-snow layer">
        <span className="snowflake snowflake-1">❄</span>
        <span className="snowflake snowflake-2">❄</span>
        <span className="snowflake snowflake-3">❄</span>
        <span className="snowflake snowflake-4">❄</span>
        <span className="snowflake snowflake-5">❄</span>
        <span className="snowflake snowflake-6">❄</span>
        <span className="snowflake snowflake-7">❄</span>
        <span className="snowflake snowflake-8">❄</span>
        <span className="snowflake snowflake-9">❄</span>
        <span className="snowflake snowflake-10">❄</span>
        <span className="snowflake snowflake-11">❄</span>
        <span className="snowflake snowflake-12">❄</span>
      </div>

      <div className="hail-sparkles layer">
        <span className="spark spark-1" />
        <span className="spark spark-2" />
        <span className="spark spark-3" />
        <span className="spark spark-4" />
        <span className="spark spark-5" />
      </div>

      <div className="hail-wave hail-wave-back layer" />
      <div className="hail-wave hail-wave-mid layer" />
      <div className="hail-wave hail-wave-front layer" />

      <div className="hail-login-content">
        <div className="hail-brand">
          <p className="hail-brand-kicker">Welcome aboard</p>
          <h1 className="hail-title">HAIL JACK</h1>
          <p className="hail-tagline">
            Answer smart. Stay afloat. Keep Jack on the plank.
          </p>

          <div className="hail-quote-box">
            <span className="hail-quote-label">Jack says</span>
            <p>“It’s freezing out here... log in and save me!”</p>
          </div>
        </div>

        <div className="hail-login-card">
          <div className="hail-card-top">
            <span className="hail-badge">Ocean Login</span>
            <h2>Start Voyage</h2>
            <p>Log in and jump back into the storm.</p>
          </div>

          {error && (
            <div className="hail-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="hail-form" noValidate>
            <div className="hail-form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  playTypingSound();
                }}
                className="hail-input"
              />
            </div>

            <div className="hail-form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  playTypingSound();
                }}
                className="hail-input"
              />
            </div>

            <button
              type="submit"
              className="hail-login-btn"
              disabled={loading}
            >
              {loading ? "Boarding..." : "Start Voyage"}
            </button>
          </form>

          <div className="hail-divider">
            <span>New to the ship?</span>
          </div>

          <button
            type="button"
            className="hail-register-btn"
            onClick={goToRegister}
          >
            Create Account
          </button>
        </div>
      </div>

      <button className="hail-sound-btn" onClick={toggleMute}>
        {muted ? "🔇 Muted" : "🔊 Sound On"}
      </button>
    </div>
  );
}

export default Login;