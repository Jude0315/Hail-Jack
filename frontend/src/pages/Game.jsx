import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/scene.css";
import "../styles/game.css";

export default function Game() {
  const navigate = useNavigate();

  const [meter, setMeter] = useState(0);
  const [streak, setStreak] = useState(0);
  const [status, setStatus] = useState("playing"); // playing | win | lose

  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);

  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [loadError, setLoadError] = useState("");

  // ✅ avoid overlapping loads (mount + end-of-batch + retry)
  const isLoadingRef = useRef(false);

  const loadQuestions = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      setLoading(true);
      setLoadError("");

      const url = `http://localhost:3001/game/questions?amount=5&t=${Date.now()}`;
      const res = await fetch(url);

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Backend ${res.status}: ${txt || "No details"}`);
      }

      const data = await res.json();

      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("Backend returned no questions");
      }

      setQuestions(data.questions);
      setIdx(0);
    } catch (err) {
      console.error("Failed to load questions:", err);
      setQuestions([]);
      setIdx(0);
      setLoadError(err.message);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  // load on mount
  useEffect(() => {
    loadQuestions();
  }, []);

  // win/lose
  useEffect(() => {
    if (meter >= 4) setStatus("win");
    if (meter <= -4) setStatus("lose");
  }, [meter]);

  // CPU pull only on wrong answer
  const computerPull = () => {
    const cpuPulls = Math.random() < 0.35;
    if (cpuPulls) setMeter((m) => m - 1);
  };

  // no repeats: fetch new batch after last question
  const nextQuestion = async () => {
    if (status !== "playing") return;

    if (idx >= questions.length - 1) {
      await loadQuestions();
      return;
    }
    setIdx((prev) => prev + 1);
  };

  const submitAnswer = (choice) => {
    if (status !== "playing") return;
    if (locked) return;

    const current = questions[idx];
    if (!current) return;

    setLocked(true);

    const normalize = (s) => String(s).trim().toLowerCase();
    const correct = normalize(choice) === normalize(current.answer);

    if (correct) {
      setMeter((m) => m + 1);
      setStreak((s) => s + 1);

      setTimeout(async () => {
        await nextQuestion();
        setLocked(false);
      }, 350);
    } else {
      setMeter((m) => m - 1);
      setStreak(0);

      setTimeout(async () => {
        computerPull();
        await nextQuestion();
        setLocked(false);
      }, 350);
    }
  };

  const resetGame = async () => {
    setMeter(0);
    setStreak(0);
    setStatus("playing");
    setLocked(false);
    await loadQuestions();
  };

  // LOADING
  if (loading) {
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

  // FAILED
  if (!questions.length) {
    return (
      <div className="scene">
        <video className="bgVideo" autoPlay loop muted playsInline>
          <source src="/videos/dashboard.mp4" type="video/mp4" />
        </video>

        <div className="ui">
          <div className="card">
            <h2 className="title">Failed to Load Questions</h2>
            <p className="subtitle" style={{ opacity: 0.85 }}>
              {loadError || "Unknown error"}
            </p>

            <div className="rowBtns" style={{ marginTop: 14 }}>
              <button className="smallBtn" onClick={loadQuestions}>
                Retry
              </button>
              <button className="smallBtn" onClick={() => navigate("/dashboard")}>
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
          <div className="gameHeader">
            <h2 className="title gameTitle">Tug-of-War Quiz</h2>
            <div className="miniInfo">
              <span className="pill">Easy</span>
              <span className="pill">{current.category}</span>
            </div>
          </div>

          {/* Tug Visual Placeholder */}
          <div className={`tugStage stage-${meter}`}>
            <div className="tugSide cpu">
              <div className="avatar cpuAvatar">CPU</div>
            </div>

            <div className="tugCenter">
              <div className="plank" />
              <div className="marker" style={{ left: `${((meter + 4) / 8) * 100}%` }} />
            </div>

            <div className="tugSide player">
              <div className="avatar playerAvatar">YOU</div>
            </div>
          </div>

          {/* Meter */}
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

          {/* Win/Lose */}
          {status !== "playing" ? (
            <div className="resultBox">
              <h3 className="resultTitle">
                {status === "win" ? "You Win 🏆" : "You Lose 🌊"}
              </h3>

              <div className="rowBtns" style={{ marginTop: 14 }}>
                <button className="smallBtn" onClick={resetGame}>
                  Play Again (New Questions)
                </button>
                <button className="smallBtn" onClick={() => navigate("/dashboard")}>
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Question */}
              <div className="questionText">{current.question}</div>

              {/* Options */}
              <div className="rowBtns optionGrid">
                {current.options.map((opt) => (
                  <button
                    key={opt}
                    className="smallBtn"
                    onClick={() => submitAnswer(opt)}
                    disabled={locked}
                    style={locked ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 16, textAlign: "center" }}>
                <button className="smallBtn" onClick={() => navigate("/dashboard")}>
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