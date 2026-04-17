/*
Parts of this file were developed with assistance from ChatGPT (OpenAI), April 2026.
The suggestions were reviewed, understood, modified, tested, and integrated into this project by me.
This includes support with game-state handling, API integration, animation flow, audio controls, and result-saving logic.
*/

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/scene.css";
import "../styles/game.css";
import Player1Sprite from "../components/Player1Sprite";
import Player2Sprite from "../components/Player2Sprite";
import plankImg from "../assets/scene/plank.png";

export default function Game() {
  const navigate = useNavigate();

  // Core game state used to control balance, streaks, and win/lose status
  const [meter, setMeter] = useState(0);
  const [streak, setStreak] = useState(0);
  const [status, setStatus] = useState("playing");

  // Question data and current question index
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);

  // Loading, error, and logout state for the page
  const [pageLoading, setPageLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  // Track game performance for leaderboard saving
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [resultSaved, setResultSaved] = useState(false);

  // Animation and pose state for Player 1
  const [p1Anim, setP1Anim] = useState("HANG_IDLE");
  const [p1Pose, setP1Pose] = useState("HANG");

  // Animation and pose state for Player 2
  const [p2Anim, setP2Anim] = useState("HANG_IDLE");
  const [p2Pose, setP2Pose] = useState("HANG");

  // Audio state
  const [muted, setMuted] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);

  // Audio references
  const audioRef = useRef(null);
  const clickAudioRef = useRef(null);
  const startAudioRef = useRef(null);
  const menuAudioRef = useRef(null);
  const errorAudioRef = useRef(null);

  // References used to prevent duplicate loading and track previous meter position
  const isLoadingRef = useRef(false);
  const prevMeterRef = useRef(0);

  // Navigate after playing a UI sound for smoother interaction
  const navigateTo = (path, sound = "menu") => {
    if (sound === "start") playStartSound();
    else playMenuSound();

    setTimeout(() => {
      navigate(path);
    }, 250);
  };

  // Generic helper to safely play audio effects
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

  const playErrorSound = () => {
    playAudio(errorAudioRef.current, 0.8);
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
      console.warn("Game audio could not start:", err);
    }
  };

  // Calculate the final score based on outcome, accuracy, streak, and meter position
  const calculateFinalScore = () => {
    return (
      (status === "win" ? 100 : 25) +
      correctAnswers * 10 +
      bestStreak * 5 +
      Math.max(meter, 0) * 5
    );
  };

  // Redirect unauthenticated users back to login
  const handleUnauthorized = () => {
    navigate("/login", { replace: true });
  };

  // Log the user out and clear the current game session on the frontend
  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      playMenuSound();

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

  // The question-loading logic below was developed with assistance from ChatGPT (OpenAI), April 2026.
  // I reviewed, understood, modified, and integrated it into this project.
  const loadQuestions = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      setPageLoading(true);
      setLoadError("");

      // Check that the user is still authenticated before loading questions
      const authRes = await axios.get("http://localhost:3001/me", {
        withCredentials: true,
      });

      if (!authRes.data?.user?.id) {
        handleUnauthorized();
        return;
      }

      // Fetch a fresh set of questions from the backend
      const res = await axios.get(
        "http://localhost:3001/game/questions?amount=5",
        {
          withCredentials: true,
        }
      );

      if (!Array.isArray(res.data?.questions) || res.data.questions.length === 0) {
        throw new Error("Backend returned no questions");
      }

      setQuestions(res.data.questions);
      setIdx(0);
    } catch (err) {
      console.error("Failed to load questions:", err?.response || err);

      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setQuestions([]);
      setIdx(0);
      setLoadError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load questions."
      );

      playErrorSound();
    } finally {
      setPageLoading(false);
      isLoadingRef.current = false;
    }
  };

  // Load the first set of questions when the page opens
  useEffect(() => {
    loadQuestions();
  }, []);

  // Update win/lose status based on the current balance meter
  useEffect(() => {
    if (meter >= 4) setStatus("win");
    else if (meter <= -4) setStatus("lose");
    else setStatus("playing");
  }, [meter]);

  // The animation state handling below was developed with assistance from ChatGPT (OpenAI), April 2026.
  // I reviewed, understood, adapted, and integrated it into this project.
  useEffect(() => {
    const prevMeter = prevMeterRef.current;
    const currMeter = meter;
    prevMeterRef.current = currMeter;

    if (status === "win") {
      setP1Pose("PLANK");
      setP1Anim("BACKFLIP_WIN");

      setP2Pose("SINK");
      setP2Anim("LOSE_SINK");
      return;
    }

    if (status === "lose") {
      setP1Pose("SINK");
      setP1Anim("LOSE_SINK");

      setP2Pose("PLANK");
      setP2Anim("BACKFLIP_WIN");
      return;
    }

    if (prevMeter <= 0 && currMeter >= 1) {
      setP1Pose("CLIMB");
      setP1Anim("CLIMB_UP");
    } else if (prevMeter >= 1 && currMeter <= 0) {
      setP1Pose("HANG");
      setP1Anim(currMeter < 0 ? "PANIC_HANG_IDLE" : "HANG_IDLE");
    } else if (currMeter >= 1) {
      setP1Pose("PLANK");
      setP1Anim(streak >= 2 ? "HYPE_IDLE" : "PLANK_IDLE");
    } else {
      setP1Pose("HANG");
      setP1Anim(currMeter < 0 ? "PANIC_HANG_IDLE" : "HANG_IDLE");
    }

    if (prevMeter >= 0 && currMeter <= -1) {
      setP2Pose("CLIMB");
      setP2Anim("CLIMB_UP");
      return;
    }

    if (prevMeter <= -1 && currMeter >= 0) {
      setP2Pose("HANG");
      setP2Anim(currMeter > 0 ? "PANIC_HANG_IDLE" : "HANG_IDLE");
      return;
    }

    if (currMeter <= -1) {
      setP2Pose("PLANK");
      setP2Anim("HYPE_IDLE");
      return;
    }

    setP2Pose("HANG");
    if (currMeter > 0) setP2Anim("PANIC_HANG_IDLE");
    else setP2Anim("HANG_IDLE");
  }, [meter, streak, status]);

  // Save the completed game result once the match ends
  useEffect(() => {
    const saveResult = async () => {
      if ((status !== "win" && status !== "lose") || resultSaved) return;

      try {
        await axios.post(
          "http://localhost:3001/leaderboard/save",
          {
            result: status,
            score: calculateFinalScore(),
            correctAnswers,
            wrongAnswers,
            bestStreak,
            finalMeter: meter,
          },
          { withCredentials: true }
        );

        setResultSaved(true);
      } catch (err) {
        console.error("Failed to save game result:", err?.response || err);

        if (err?.response?.status === 401) {
          handleUnauthorized();
        }
      }
    };

    saveResult();
  }, [status, resultSaved, correctAnswers, wrongAnswers, bestStreak, meter]);

  // Move to the next question or reload a new batch when the set ends
  const nextQuestion = async () => {
    if (status !== "playing") return;

    if (idx >= questions.length - 1) {
      await loadQuestions();
      return;
    }

    setIdx((prev) => prev + 1);
  };

  // The answer submission logic below was developed with assistance from ChatGPT (OpenAI), April 2026.
  // I reviewed, understood, modified, and integrated it into this project.
  const submitAnswer = (choice) => {
    if (status !== "playing" || locked) return;

    const current = questions[idx];
    if (!current) return;

    setLocked(true);
    playMenuSound();

    const normalize = (s) => String(s).trim().toLowerCase();
    const correct = normalize(choice) === normalize(current.answer);

    if (correct) {
      const prev = meter;

      setMeter((m) => m + 1);
      setCorrectAnswers((c) => c + 1);

      setStreak((s) => {
        const newStreak = s + 1;
        setBestStreak((best) => Math.max(best, newStreak));
        return newStreak;
      });

      if (prev >= 1 && status === "playing") {
        setP1Anim("MINI_PULL");
      }

      setTimeout(async () => {
        await nextQuestion();
        setLocked(false);
      }, 650);
    } else {
      setMeter((m) => m - 1);
      setWrongAnswers((w) => w + 1);
      setStreak(0);
      playErrorSound();

      setTimeout(async () => {
        await nextQuestion();
        setLocked(false);
      }, 650);
    }
  };

  // Reset the full game state for a fresh playthrough
  const resetGame = async () => {
    playStartSound();

    setMeter(0);
    setStreak(0);
    setStatus("playing");
    setLocked(false);

    setCorrectAnswers(0);
    setWrongAnswers(0);
    setBestStreak(0);
    setResultSaved(false);

    setP1Anim("HANG_IDLE");
    setP1Pose("HANG");

    setP2Anim("HANG_IDLE");
    setP2Pose("HANG");

    prevMeterRef.current = 0;

    await loadQuestions();
  };

  // Handle post-animation transitions for Player 1
  const handleP1AnimDone = (finishedAnim) => {
    if (status === "win") return;

    if (status === "lose") {
      setP1Anim("UNDERWATER_DRIFT");
      return;
    }

    if (finishedAnim === "CLIMB_UP") {
      setP1Pose("PLANK");
      if (streak >= 2) setP1Anim("HYPE_IDLE");
      else setP1Anim("PLANK_IDLE");
      return;
    }

    if (finishedAnim === "MINI_PULL") {
      if (streak >= 2) setP1Anim("HYPE_IDLE");
      else setP1Anim("PLANK_IDLE");
      return;
    }

    if (finishedAnim === "BACKFLIP_WIN") {
      setP1Pose("PLANK");
      setP1Anim("HYPE_IDLE");
      return;
    }

    if (finishedAnim === "LOSE_SINK") {
      setP1Anim("UNDERWATER_DRIFT");
    }
  };

  // Handle post-animation transitions for Player 2
  const handleP2AnimDone = (finishedAnim) => {
    if (status === "win") {
      setP2Anim("UNDERWATER_DRIFT");
      return;
    }

    if (finishedAnim === "CLIMB_UP") {
      setP2Pose("PLANK");
      setP2Anim("HYPE_IDLE");
      return;
    }

    if (finishedAnim === "BACKFLIP_WIN") {
      setP2Pose("PLANK");
      setP2Anim("HYPE_IDLE");
      return;
    }

    if (finishedAnim === "LOSE_SINK") {
      setP2Anim("UNDERWATER_DRIFT");
    }
  };

  // Control animation playback speed for Player 1
  const getP1Speed = () => {
    if (p1Anim === "CLIMB_UP") return 0.28;
    if (p1Anim === "BACKFLIP_WIN") return 0.5;
    if (p1Anim === "MINI_PULL") return 0.5;
    return 0.65;
  };

  // Control animation playback speed for Player 2
  const getP2Speed = () => {
    if (p2Anim === "CLIMB_UP") return 0.28;
    if (p2Anim === "BACKFLIP_WIN") return 0.5;
    if (p2Anim === "MINI_PULL") return 0.5;
    return 0.65;
  };

  // Loading screen while questions are being prepared
  if (pageLoading) {
    return (
      <div className="scene hail-game-page">
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

        <audio ref={errorAudioRef} preload="auto">
          <source src="/sounds/error-buzz.mp3" type="audio/mpeg" />
        </audio>

        <div className="hail-game-overlay" />
        <div className="hail-stars layer" />
        <div className="hail-wave hail-wave-back layer" />
        <div className="hail-wave hail-wave-mid layer" />
        <div className="hail-wave hail-wave-front layer" />
        <div className="hail-wave hail-wave-extra layer" />

        <div className="hail-game-shell loadingShell">
          <div className="hail-loading-card">
            <div className="hail-mini-badge">Atlantic Crossing</div>
            <h2>Preparing the Voyage...</h2>
            <p>The night sea is gathering your next round.</p>
          </div>
        </div>

        <button className="hail-sound-btn" onClick={toggleMute}>
          {muted ? "🔇 Muted" : "🔊 Sound On"}
        </button>
      </div>
    );
  }

  // Error state if questions fail to load
  if (!questions.length) {
    return (
      <div className="scene hail-game-page">
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

        <audio ref={errorAudioRef} preload="auto">
          <source src="/sounds/error-buzz.mp3" type="audio/mpeg" />
        </audio>

        <div className="hail-game-overlay" />
        <div className="hail-stars layer" />
        <div className="hail-wave hail-wave-back layer" />
        <div className="hail-wave hail-wave-mid layer" />
        <div className="hail-wave hail-wave-front layer" />
        <div className="hail-wave hail-wave-extra layer" />

        <div className="hail-game-shell loadingShell">
          <div className="hail-loading-card errorCard">
            <div className="hail-mini-badge">Voyage Interrupted</div>
            <h2>Failed to Load Questions</h2>
            <p>{loadError || "Unknown error"}</p>

            <div className="hail-result-actions">
              <button
                className="hail-ui-btn primary"
                onClick={() => {
                  playStartSound();
                  loadQuestions();
                }}
              >
                Retry
              </button>
              <button
                className="hail-ui-btn secondary"
                onClick={() => navigateTo("/dashboard")}
              >
                Back
              </button>
              <button
                className="hail-ui-btn secondary"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out..." : "Logout"}
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

  const current = questions[idx];
  const progressPercent = Math.max(0, Math.min(100, ((meter + 4) / 8) * 100));

  return (
    <div className="scene hail-game-page">
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

      <audio ref={errorAudioRef} preload="auto">
        <source src="/sounds/error-buzz.mp3" type="audio/mpeg" />
      </audio>

      <div className="hail-game-overlay" />
      <div className="hail-stars layer" />

      <div className="hail-wave hail-wave-back layer" />
      <div className="hail-wave hail-wave-mid layer" />
      <div className="hail-wave hail-wave-front layer" />
      <div className="hail-wave hail-wave-extra layer" />

      <div className="hail-game-shell">
        <section className="hail-game-card">
          <header className="hail-game-topbar">
            <div className="hail-brand-block">
              <div className="hail-game-kicker">Jack & Rose • Night of Fate</div>
              <h1 className="hail-game-title">Titanic Tug of Fate</h1>
            </div>

            <div className="hail-top-actions">
              <div className="hail-status-chip">
                <span className="status-dot" />
                {status === "playing"
                  ? "Hold the Plank"
                  : status === "win"
                  ? "Love Survives"
                  : "The Sea Takes Over"}
              </div>

              <button
                className="hail-ui-btn secondary compact"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </header>

          <div className="hail-game-layout">
            <section className="hail-left-panel">
              <div className="hail-stage-card">
                <div className="hail-stage-header">
                  <div className="hail-stage-label">The Atlantic Plank</div>
                  <div className="hail-category-pill">{current.category}</div>
                </div>

                <div className="tugStage">
                  <div className="tugArena">
                    <div className="hail-stage-glow" />
                    <div className="hail-water-glow" />

                    {/* Move and rotate the plank visually based on the current game balance */}
                    <img
                      src={plankImg}
                      alt="plank"
                      className="plankImg"
                      style={{
                        transform: `translateX(calc(-50% + ${meter * 8}px)) rotate(${meter * 1.5}deg)`,
                      }}
                    />

                    <div
                      className={`playerAnchor playerAnchorLeft pose-${p2Pose.toLowerCase()} ${
                        status === "win" ? "playerFadeOut" : ""
                      }`}
                    >
                      <div className="playerAvatar playerAvatarLeft">
                        <Player2Sprite
                          anim={p2Anim}
                          speed={getP2Speed()}
                          onDone={handleP2AnimDone}
                        />
                      </div>
                    </div>

                    <div
                      className={`playerAnchor playerAnchorRight pose-${p1Pose.toLowerCase()} ${
                        status === "lose" ? "playerFadeOut" : ""
                      }`}
                    >
                      <div className="playerAvatar">
                        <Player1Sprite
                          anim={p1Anim}
                          speed={getP1Speed()}
                          onDone={handleP1AnimDone}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hail-meter-card">
                  <div className="hail-meter-header">
                    <span>Rose</span>
                    <span className="hail-meter-value">Balance {meter}</span>
                    <span>Jack</span>
                  </div>

                  <div className="hail-meter-track">
                    <div
                      className="hail-meter-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                    <div className="hail-meter-center" />
                  </div>
                </div>
              </div>
            </section>

            <section className="hail-right-panel">
              {status !== "playing" ? (
                <div className="hail-result-panel">
                  <div className="hail-mini-badge">
                    {status === "win" ? "A Heart Still Holds On" : "The Atlantic Wins"}
                  </div>

                  <h2 className="hail-result-title">
                    {status === "win" ? "You Win" : "You Lose"}
                  </h2>

                  <p className="hail-result-copy">
                    {status === "win"
                      ? "You held your place above the freezing sea and kept the last fragile hope alive."
                      : "The cold Atlantic claimed the moment, but another dawn may still belong to you."}
                  </p>

                  <div className="hail-score-box">
                    <span>Final Score</span>
                    <strong>{calculateFinalScore()}</strong>
                  </div>

                  <div className="hail-result-grid">
                    <div className="hail-summary-tile">
                      <span>Correct</span>
                      <strong>{correctAnswers}</strong>
                    </div>
                    <div className="hail-summary-tile">
                      <span>Wrong</span>
                      <strong>{wrongAnswers}</strong>
                    </div>
                    <div className="hail-summary-tile">
                      <span>Best Streak</span>
                      <strong>{bestStreak}</strong>
                    </div>
                    <div className="hail-summary-tile">
                      <span>Final Balance</span>
                      <strong>{meter}</strong>
                    </div>
                  </div>

                  <div className="hail-result-actions">
                    <button className="hail-ui-btn primary" onClick={resetGame}>
                      Sail Again
                    </button>
                    <button
                      className="hail-ui-btn secondary"
                      onClick={() => navigateTo("/dashboard")}
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hail-question-panel">
                  <div className="hail-question-top">
                    <div className="hail-mini-badge">Chapter {idx + 1}</div>
                    <div className="hail-easy-pill">Ocean Trial</div>
                  </div>

                  <div className="hail-question-box">
                    <p className="hail-question-text">{current.question}</p>
                  </div>

                  <div className="hail-options-grid">
                    {current.options.map((opt) => (
                      <button
                        key={opt}
                        className="hail-answer-btn"
                        onClick={() => submitAnswer(opt)}
                        disabled={locked}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  <div className="hail-side-note">
                    Choose with care. Every answer shifts the fragile balance between survival and the sea.
                  </div>

                  <div className="hail-panel-actions">
                    <button
                      className="hail-ui-btn secondary"
                      onClick={() => navigateTo("/dashboard")}
                    >
                      Quit
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>

      <button className="hail-sound-btn" onClick={toggleMute}>
        {muted ? "🔇 Muted" : "🔊 Sound On"}
      </button>
    </div>
  );
}