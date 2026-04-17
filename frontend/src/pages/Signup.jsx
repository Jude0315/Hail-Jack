/*
Parts of this file were developed with assistance from ChatGPT (OpenAI), April 2026.
The suggestions were reviewed, understood, modified, tested, and integrated into this project by me.
This includes support with signup flow, session checking, password validation, audio controls, and UI interaction logic.
*/

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Signup.css";

function Signup() {
  // Form input state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI feedback state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Audio state
  const [muted, setMuted] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);

  // Audio references
  const audioRef = useRef(null);
  const clickAudioRef = useRef(null);
  const signupAudioRef = useRef(null);
  const backAudioRef = useRef(null);
  const errorAudioRef = useRef(null);
  const typingAudioRef = useRef(null);
  const lastTypeTimeRef = useRef(0);

  const navigate = useNavigate();

  // Check if the user already has an active session and redirect if logged in
  // The session-checking logic below was developed with assistance from ChatGPT (OpenAI), April 2026.
  // I reviewed, understood, adapted, and integrated it into this project.
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

  // Generic helper to safely play UI audio
  const playAudio = async (audioEl, volume = 0.7) => {
    if (!audioEl) return;

    try {
      audioEl.pause();
      audioEl.currentTime = 0;
      audioEl.volume = volume;
      await audioEl.play();
    } catch {
      // ignore playback failures
    }
  };

  const playMuteClickSound = async () => {
    await playAudio(clickAudioRef.current, 0.6);
  };

  const playSignupSound = async () => {
    await playAudio(signupAudioRef.current, 0.8);
  };

  const playBackSound = async () => {
    await playAudio(backAudioRef.current, 0.8);
  };

  const playErrorSound = async () => {
    await playAudio(errorAudioRef.current, 0.8);
  };

  // Play a soft typing sound while the user types in the form
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

  // The audio toggle logic below was developed with assistance from ChatGPT (OpenAI), April 2026.
  // I reviewed, understood, adapted, and integrated it into this project.
  const toggleMute = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      await playMuteClickSound();

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
      console.warn("Signup audio could not start:", err);
    }
  };

  // Navigate back to the login page after playing a sound
  const goToLogin = async () => {
    await playBackSound();
    setTimeout(() => {
      navigate("/login");
    }, 450);
  };

  // Validate password strength before allowing registration
  const validatePassword = (pwd) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()[\]{}\-_=+\\|;:'",.<>/?`~]).{8,}$/;
    return regex.test(pwd);
  };

  // The signup submission and validation logic below was developed with assistance from ChatGPT (OpenAI), April 2026.
  // I reviewed, understood, modified, and integrated it into this project.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basic frontend validation before sending the request
    if (!name.trim()) {
      setError("Name is required");
      await playErrorSound();
      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      await playErrorSound();
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      await playErrorSound();
      return;
    }

    if (!confirmPassword.trim()) {
      setError("Please confirm your password");
      await playErrorSound();
      return;
    }

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      await playErrorSound();
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
      );
      await playErrorSound();
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      await playErrorSound();
      return;
    }

    setLoading(true);

    try {
      const result = await axios.post("http://localhost:3001/register", {
        name,
        email,
        password,
      });

      if (result.data?.message === "Registration successful") {
        setSuccess("Registration successful. Redirecting to login...");
        await playSignupSound();
        setTimeout(() => navigate("/login", { replace: true }), 650);
        return;
      }

      setSuccess("Registration complete. Redirecting to login...");
      await playSignupSound();
      setTimeout(() => navigate("/login", { replace: true }), 650);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed.";
      setError(msg);
      await playErrorSound();
      console.error("Signup error:", err?.response || err);
    } finally {
      setLoading(false);
    }
  };

  // Helper values for live password feedback in the form
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const passwordStrong = validatePassword(password);

  // Loading view while the application checks for an existing session
  if (checkingSession) {
    return (
      <div className="hail-signup-page">
        <audio ref={audioRef} loop preload="auto" muted>
          <source src="/sounds/icy-wind.mp3" type="audio/mpeg" />
        </audio>

        <audio ref={clickAudioRef} preload="auto">
          <source src="/sounds/ui-click.mp3" type="audio/mpeg" />
        </audio>

        <audio ref={signupAudioRef} preload="auto">
          <source src="/sounds/open-register.mp3" type="audio/mpeg" />
        </audio>

        <audio ref={backAudioRef} preload="auto">
          <source src="/sounds/start-voyage.mp3" type="audio/mpeg" />
        </audio>

        <audio ref={errorAudioRef} preload="auto">
          <source src="/sounds/error-buzz.mp3" type="audio/mpeg" />
        </audio>

        <audio ref={typingAudioRef} preload="auto">
          <source src="/sounds/typewriter-key.mp3" type="audio/mpeg" />
        </audio>

        <div className="hail-signup-overlay" />
        <div className="hail-stars layer" />
        <div className="hail-moon layer" />
        <div className="hail-moon-glow layer" />

        <div className="hail-signup-content">
          <div className="hail-signup-card">
            <div className="hail-card-top">
              <span className="hail-badge">Crew Registration</span>
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
    <div className="hail-signup-page">
      <audio ref={audioRef} loop preload="auto" muted>
        <source src="/sounds/icy-wind.mp3" type="audio/mpeg" />
      </audio>

      <audio ref={clickAudioRef} preload="auto">
        <source src="/sounds/ui-click.mp3" type="audio/mpeg" />
      </audio>

      <audio ref={signupAudioRef} preload="auto">
        <source src="/sounds/join-voyage.mp3" type="audio/mpeg" />
      </audio>

      <audio ref={backAudioRef} preload="auto">
        <source src="/sounds/back-login.mp3" type="audio/mpeg" />
      </audio>

      <audio ref={errorAudioRef} preload="auto">
        <source src="/sounds/error-buzz.mp3" type="audio/mpeg" />
      </audio>

      <audio ref={typingAudioRef} preload="auto">
        <source src="/sounds/typewriter-key.mp3" type="audio/mpeg" />
      </audio>

      <div className="hail-signup-overlay" />

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

      <div className="hail-signup-content">
        <div className="hail-brand">
          <p className="hail-brand-kicker">Join the adventure</p>
          <h1 className="hail-title">HAIL JACK</h1>
          <p className="hail-tagline">
            Create your account, brave the icy sea, and help Jack survive one
            question at a time.
          </p>

          <div className="hail-quote-box">
            <span className="hail-quote-label">Jack says</span>
            <p>“New crew? Perfect. I could really use the help out here!”</p>
          </div>
        </div>

        <div className="hail-signup-card">
          <div className="hail-card-top">
            <span className="hail-badge">Crew Registration</span>
            <h2>Create Account</h2>
            <p>Sign up and step onto the plank.</p>
          </div>

          {error && (
            <div className="hail-message hail-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="hail-message hail-success" role="alert">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="hail-form" noValidate>
            <div className="hail-form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                placeholder="Enter your name"
                className="hail-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  playTypingSound();
                }}
              />
            </div>

            <div className="hail-form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="hail-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  playTypingSound();
                }}
              />
            </div>

            <div className="hail-form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Create a password"
                className="hail-input"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  playTypingSound();
                }}
              />
              <small
                className={`hail-helper ${
                  password.length > 0
                    ? passwordStrong
                      ? "is-good"
                      : "is-bad"
                    : ""
                }`}
              >
                Minimum 8 characters, with uppercase, lowercase, number, and
                special character.
              </small>
            </div>

            <div className="hail-form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Retype your password"
                className="hail-input"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  playTypingSound();
                }}
              />
              {confirmPassword && (
                <small
                  className={`hail-helper ${
                    passwordsMatch ? "is-good" : "is-bad"
                  }`}
                >
                  {passwordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </small>
              )}
            </div>

            <button
              type="submit"
              className="hail-signup-btn"
              disabled={loading}
            >
              {loading ? "Creating Crew Pass..." : "Join the Voyage"}
            </button>
          </form>

          <div className="hail-divider">
            <span>Already part of the crew?</span>
          </div>

          <button
            type="button"
            className="hail-login-btn-secondary"
            onClick={goToLogin}
          >
            Back to Login
          </button>
        </div>
      </div>

      <button className="hail-sound-btn" onClick={toggleMute}>
        {muted ? "🔇 Muted" : "🔊 Sound On"}
      </button>
    </div>
  );
}

export default Signup;