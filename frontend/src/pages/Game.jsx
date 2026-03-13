import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/scene.css";
import "../styles/game.css";
import Player1Sprite from "../components/Player1Sprite";
import plankImg from "../assets/scene/plank.png";

export default function Game() {
  const navigate = useNavigate();

  // Main game progress values
  const [meter, setMeter] = useState(0);
  const [streak, setStreak] = useState(0);
  const [status, setStatus] = useState("playing");

  // Store the current set of questions and the current question index
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);

  // General page and button states
  const [pageLoading, setPageLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  // Track final result data for the leaderboard
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [resultSaved, setResultSaved] = useState(false);

  // Control the player animation and pose
  const [p1Anim, setP1Anim] = useState("HANG_IDLE");
  const [p1Pose, setP1Pose] = useState("HANG"); // HANG | CLIMB | PLANK | SINK

  // Refs used to avoid repeated loading and to compare previous meter values
  const isLoadingRef = useRef(false);
  const prevMeterRef = useRef(0);

  // Calculate the final score using result, answers, streak, and meter position
  const calculateFinalScore = () => {
    return (
      (status === "win" ? 100 : 25) +
      correctAnswers * 10 +
      bestStreak * 5 +
      Math.max(meter, 0) * 5
    );
  };

  // If the user is not authenticated, send them back to login
  const handleUnauthorized = () => {
    navigate("/login", { replace: true });
  };

  // Log out the current user and return to the login page
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

  // Load a new set of questions from the backend
  const loadQuestions = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      setPageLoading(true);
      setLoadError("");

      // First check whether the user is still logged in
      const authRes = await axios.get("http://localhost:3001/me", {
        withCredentials: true,
      });

      if (!authRes.data?.user?.id) {
        handleUnauthorized();
        return;
      }

      // Request quiz questions from the backend
      const res = await axios.get("http://localhost:3001/game/questions?amount=5", {
        withCredentials: true,
      });

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

  // Load questions when the game page first opens
  useEffect(() => {
    loadQuestions();
  }, []);

  // Update win/lose/playing state based on the meter value
  useEffect(() => {
    if (meter >= 4) setStatus("win");
    else if (meter <= -4) setStatus("lose");
    else setStatus("playing");
  }, [meter]);

  // Change the player pose and animation depending on game progress
  useEffect(() => {
    const prevMeter = prevMeterRef.current;
    const currMeter = meter;
    prevMeterRef.current = currMeter;

    if (status === "win") {
      setP1Pose("PLANK");
      setP1Anim("BACKFLIP_WIN");
      return;
    }

    if (status === "lose") {
      setP1Pose("SINK");
      setP1Anim("LOSE_SINK");
      return;
    }

    // Move from hanging to climbing when the player gains enough progress
    if (prevMeter <= 0 && currMeter >= 1) {
      setP1Pose("CLIMB");
      setP1Anim("CLIMB_UP");
      return;
    }

    // Move back to hanging if progress drops again
    if (prevMeter >= 1 && currMeter <= 0) {
      setP1Pose("HANG");
      setP1Anim(currMeter < 0 ? "PANIC_HANG_IDLE" : "HANG_IDLE");
      return;
    }

    // When the player is ahead, stay on the plank
    if (currMeter >= 1) {
      setP1Pose("PLANK");
      if (streak >= 2) setP1Anim("HYPE_IDLE");
      else setP1Anim("PLANK_IDLE");
      return;
    }

    // Default hanging states
    setP1Pose("HANG");
    if (currMeter < 0) setP1Anim("PANIC_HANG_IDLE");
    else setP1Anim("HANG_IDLE");
  }, [meter, streak, status]);

  // Save the result to the leaderboard once the game ends
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

  // Random computer pull after a wrong answer
  const computerPull = () => {
    const cpuPulls = Math.random() < 0.35;
    if (cpuPulls) setMeter((m) => m - 1);
  };

  // Move to the next question, or reload questions if the set is finished
  const nextQuestion = async () => {
    if (status !== "playing") return;

    if (idx >= questions.length - 1) {
      await loadQuestions();
      return;
    }

    setIdx((prev) => prev + 1);
  };

  // Check the selected answer and update the game state
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

      // Play a short pull animation if the player is already on the plank side
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
        computerPull();
        await nextQuestion();
        setLocked(false);
      }, 650);
    }
  };

  // Reset everything and start again with a new set of questions
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
    prevMeterRef.current = 0;

    await loadQuestions();
  };

  // Decide what animation should play next after one finishes
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

    if (finishedAnim === "LOSE_SINK") {
      setP1Anim("UNDERWATER_DRIFT");
    }
  };

  // Control playback speed for each animation
  const getP1Speed = () => {
    if (p1Anim === "CLIMB_UP") return 0.28;
    if (p1Anim === "BACKFLIP_WIN") return 0.5;
    if (p1Anim === "MINI_PULL") return 0.5;
    return 0.65;
  };

  // Loading screen shown while questions are being fetched
  if (pageLoading) {
    return (
      <div className="scene">
        <video className="bgVideo" autoPlay loop muted playsInline>
          <source src="/videos/dashboard.mp4" type="video/mp4" />
        </video>
        <div className="ui">
          <div className="card">
            <h2 className="title" style={{ fontSize: 32 }}>
              Loading Questions...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  // Error screen shown if questions could not be loaded
  if (!questions.length) {
    return (
      <div className="scene">
        <video className="bgVideo" autoPlay loop muted playsInline>
          <source src="/videos/dashboard.mp4" type="video/mp4" />
        </video>
        <div className="ui">
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h2 className="title" style={{ margin: 0 }}>
                Failed to Load Questions
              </h2>
              <button
                className="smallBtn"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>

            <p className="subtitle" style={{ opacity: 0.85 }}>
              {loadError || "Unknown error"}
            </p>

            <div className="rowBtns" style={{ marginTop: 14 }}>
              <button className="smallBtn" onClick={loadQuestions}>
                Retry
              </button>
              <button
                className="smallBtn"
                onClick={() => navigate("/dashboard")}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const current = questions[idx];

  return (
    <div className="scene">
      <video className="bgVideo" autoPlay loop muted playsInline>
        <source src="/videos/dashboard.mp4" type="video/mp4" />
      </video>

      <div className="ui">
        <div className="card gameCard">
          {/* Logout button in the top corner */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "10px",
            }}
          >
            <button
              className="smallBtn"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>

          {/* Game title and category */}
          <div className="gameHeader">
            <h2 className="title gameTitle">Tug-of-War Quiz</h2>
            <div className="miniInfo">
              <span className="pill">Easy</span>
              <span className="pill">{current.category}</span>
            </div>
          </div>

          {/* Tug-of-war play area */}
          <div className="tugStage">
            <div className="tugArena">
              <img
                src={plankImg}
                alt="plank"
                className="plankImg"
                style={{
                  transform: `translateX(calc(-50% + ${meter * 8}px)) rotate(${meter * 1.5}deg)`,
                }}
              />

              <div
                className="marker"
                style={{ left: `calc(50% + ${meter * 18}px)` }}
              />

              <div
                className={`playerAnchor pose-${p1Pose.toLowerCase()} ${
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

          {/* Meter and streak display */}
          <div className="meterBlock">
            <div className="meterRow">
              <span>Computer</span>
              <span>Meter: {meter}</span>
              <span>You</span>
            </div>

            <div className="meterBar">
              <div
                className="meterFill"
                style={{ width: `${((meter + 4) / 8) * 100}%` }}
              />
            </div>

            <div className="streakText">
              Streak: <strong>{streak}</strong>
            </div>
          </div>

          {status !== "playing" ? (
            <div className="resultBox">
              {/* Final result shown when the game ends */}
              <h3 className="resultTitle">
                {status === "win" ? "You Win" : "You Lose"}
              </h3>

              <p style={{ marginTop: 8 }}>
                Score: <strong>{calculateFinalScore()}</strong>
              </p>
              <p>
                Correct: <strong>{correctAnswers}</strong> | Wrong:{" "}
                <strong>{wrongAnswers}</strong>
              </p>
              <p>
                Best Streak: <strong>{bestStreak}</strong>
              </p>

              <div className="rowBtns" style={{ marginTop: 14 }}>
                <button className="smallBtn" onClick={resetGame}>
                  Play Again (New Questions)
                </button>
                <button
                  className="smallBtn"
                  onClick={() => navigate("/dashboard")}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Current question and answer options */}
              <div className="questionText">{current.question}</div>

              <div className="rowBtns optionGrid">
                {current.options.map((opt) => (
                  <button
                    key={opt}
                    className="smallBtn"
                    onClick={() => submitAnswer(opt)}
                    disabled={locked}
                    style={
                      locked
                        ? { opacity: 0.6, cursor: "not-allowed" }
                        : undefined
                    }
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Quit button */}
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <button
                  className="smallBtn"
                  onClick={() => navigate("/dashboard")}
                >
                  Quit
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}