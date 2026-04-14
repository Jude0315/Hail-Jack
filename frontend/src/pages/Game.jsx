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

  const [meter, setMeter] = useState(0);
  const [streak, setStreak] = useState(0);
  const [status, setStatus] = useState("playing");

  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);

  const [pageLoading, setPageLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [resultSaved, setResultSaved] = useState(false);

  const [p1Anim, setP1Anim] = useState("HANG_IDLE");
  const [p1Pose, setP1Pose] = useState("HANG");

  const [p2Anim, setP2Anim] = useState("HANG_IDLE");
  const [p2Pose, setP2Pose] = useState("HANG");

  const isLoadingRef = useRef(false);
  const prevMeterRef = useRef(0);

  const calculateFinalScore = () => {
    return (
      (status === "win" ? 100 : 25) +
      correctAnswers * 10 +
      bestStreak * 5 +
      Math.max(meter, 0) * 5
    );
  };

  const handleUnauthorized = () => {
    navigate("/login", { replace: true });
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await axios.post(
        "http://localhost:3001/logout",
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.warn("Logout failed, continuing anyway.", err?.response || err);
    } finally {
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  const loadQuestions = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      setPageLoading(true);
      setLoadError("");

      const authRes = await axios.get("http://localhost:3001/me", {
        withCredentials: true,
      });

      if (!authRes.data?.user?.id) {
        handleUnauthorized();
        return;
      }

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
    } finally {
      setPageLoading(false);
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (meter >= 4) setStatus("win");
    else if (meter <= -4) setStatus("lose");
    else setStatus("playing");
  }, [meter]);

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

  const nextQuestion = async () => {
    if (status !== "playing") return;

    if (idx >= questions.length - 1) {
      await loadQuestions();
      return;
    }

    setIdx((prev) => prev + 1);
  };

  const submitAnswer = (choice) => {
    if (status !== "playing" || locked) return;

    const current = questions[idx];
    if (!current) return;

    setLocked(true);

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

      setTimeout(async () => {
        await nextQuestion();
        setLocked(false);
      }, 650);
    }
  };

  const resetGame = async () => {
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

  const getP1Speed = () => {
    if (p1Anim === "CLIMB_UP") return 0.28;
    if (p1Anim === "BACKFLIP_WIN") return 0.5;
    if (p1Anim === "MINI_PULL") return 0.5;
    return 0.65;
  };

  const getP2Speed = () => {
    if (p2Anim === "CLIMB_UP") return 0.28;
    if (p2Anim === "BACKFLIP_WIN") return 0.5;
    if (p2Anim === "MINI_PULL") return 0.5;
    return 0.65;
  };

  if (pageLoading) {
    return (
      <div className="scene hail-game-page">
        <div className="hail-game-overlay" />
        <div className="hail-stars layer" />
        <div className="hail-moon-glow layer" />
        <div className="hail-moon layer" />
        <div className="hail-cloud hail-cloud-1 layer" />
        <div className="hail-cloud hail-cloud-2 layer" />
        <div className="hail-cloud hail-cloud-3 layer" />
        <div className="hail-snow layer">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className={`snowflake snowflake-${i + 1}`}>✦</span>
          ))}
        </div>
        <div className="hail-wave hail-wave-back layer" />
        <div className="hail-wave hail-wave-mid layer" />
        <div className="hail-wave hail-wave-front layer" />

        <div className="hail-game-shell loadingShell">
          <div className="hail-loading-card">
            <div className="hail-mini-badge">Preparing Voyage</div>
            <h2>Loading Questions...</h2>
            <p>The sea is getting ready for your next round.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="scene hail-game-page">
        <div className="hail-game-overlay" />
        <div className="hail-stars layer" />
        <div className="hail-moon-glow layer" />
        <div className="hail-moon layer" />
        <div className="hail-cloud hail-cloud-1 layer" />
        <div className="hail-cloud hail-cloud-2 layer" />
        <div className="hail-cloud hail-cloud-3 layer" />
        <div className="hail-wave hail-wave-back layer" />
        <div className="hail-wave hail-wave-mid layer" />
        <div className="hail-wave hail-wave-front layer" />

        <div className="hail-game-shell loadingShell">
          <div className="hail-loading-card errorCard">
            <div className="hail-mini-badge">Voyage Interrupted</div>
            <h2>Failed to Load Questions</h2>
            <p>{loadError || "Unknown error"}</p>

            <div className="hail-result-actions">
              <button className="hail-ui-btn primary" onClick={loadQuestions}>
                Retry
              </button>
              <button
                className="hail-ui-btn secondary"
                onClick={() => navigate("/dashboard")}
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
      </div>
    );
  }

  const current = questions[idx];
  const progressPercent = Math.max(0, Math.min(100, ((meter + 4) / 8) * 100));

  return (
    <div className="scene hail-game-page">
      <div className="hail-game-overlay" />
      <div className="hail-stars layer" />
      <div className="hail-moon-glow layer" />
      <div className="hail-moon layer" />
      <div className="hail-cloud hail-cloud-1 layer" />
      <div className="hail-cloud hail-cloud-2 layer" />
      <div className="hail-cloud hail-cloud-3 layer" />

      <div className="hail-snow layer">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className={`snowflake snowflake-${i + 1}`}>✦</span>
        ))}
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

      <div className="hail-game-shell">
        <section className="hail-game-card">
          <header className="hail-game-topbar">
            <div className="hail-brand-block">
              <div className="hail-game-kicker">Frozen Duel</div>
              <h1 className="hail-game-title">Tug of War Quiz</h1>
            </div>

            <div className="hail-top-actions">
              <div className="hail-status-chip">
                <span className="status-dot" />
                {status === "playing"
                  ? "Battle Active"
                  : status === "win"
                  ? "Victory"
                  : "Defeat"}
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
                  <div className="hail-stage-label">The Frozen Deck</div>
                  <div className="hail-category-pill">{current.category}</div>
                </div>

                <div className="tugStage">
                  <div className="tugArena">
                    <div className="hail-stage-glow" />

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
                    <span>Computer</span>
                    <span className="hail-meter-value">Meter {meter}</span>
                    <span>You</span>
                  </div>

                  <div className="hail-meter-track">
                    <div
                      className="hail-meter-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                    <div className="hail-meter-center" />
                  </div>

                  <div className="hail-stats-row">
                    <div className="hail-stat-pill">
                      <span>Streak</span>
                      <strong>{streak}</strong>
                    </div>
                    <div className="hail-stat-pill">
                      <span>Correct</span>
                      <strong>{correctAnswers}</strong>
                    </div>
                    <div className="hail-stat-pill">
                      <span>Wrong</span>
                      <strong>{wrongAnswers}</strong>
                    </div>
                    <div className="hail-stat-pill">
                      <span>Best</span>
                      <strong>{bestStreak}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="hail-right-panel">
              {status !== "playing" ? (
                <div className="hail-result-panel">
                  <div className="hail-mini-badge">
                    {status === "win" ? "Glorious Finish" : "Storm Took Over"}
                  </div>

                  <h2 className="hail-result-title">
                    {status === "win" ? "You Win" : "You Lose"}
                  </h2>

                  <p className="hail-result-copy">
                    {status === "win"
                      ? "You conquered the icy duel and claimed the final plank."
                      : "The frozen sea won this round, but the next voyage is yours to take."}
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
                      <span>Final Meter</span>
                      <strong>{meter}</strong>
                    </div>
                  </div>

                  <div className="hail-result-actions">
                    <button className="hail-ui-btn primary" onClick={resetGame}>
                      Play Again
                    </button>
                    <button
                      className="hail-ui-btn secondary"
                      onClick={() => navigate("/dashboard")}
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hail-question-panel">
                  <div className="hail-question-top">
                    <div className="hail-mini-badge">Question {idx + 1}</div>
                    <div className="hail-easy-pill">Easy Voyage</div>
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
                    Choose wisely. Each answer shifts the balance across the freezing sea.
                  </div>

                  <div className="hail-panel-actions">
                    <button
                      className="hail-ui-btn secondary"
                      onClick={() => navigate("/dashboard")}
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
    </div>
  );
}