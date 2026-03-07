import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/scene.css";
import "../styles/game.css";
import Player1Sprite from "../components/Player1Sprite";
import plankImg from "../assets/scene/plank.png";

export default function Game() {
  const navigate = useNavigate();

  const [meter, setMeter] = useState(0);
  const [streak, setStreak] = useState(0);
  const [status, setStatus] = useState("playing");

  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);

  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [p1Anim, setP1Anim] = useState("HANG_IDLE");
  const [p1Pose, setP1Pose] = useState("HANG"); // HANG | CLIMB | PLANK | SINK

  const isLoadingRef = useRef(false);
  const prevMeterRef = useRef(0);

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
      return;
    }

    if (status === "lose") {
      setP1Pose("SINK");
      setP1Anim("LOSE_SINK");
      return;
    }

    // Hanging -> climb up onto plank
    if (prevMeter <= 0 && currMeter >= 1) {
      setP1Pose("CLIMB");
      setP1Anim("CLIMB_UP");
      return;
    }

    // Plank -> hanging
    if (prevMeter >= 1 && currMeter <= 0) {
      setP1Pose("HANG");
      setP1Anim(currMeter < 0 ? "PANIC_HANG_IDLE" : "HANG_IDLE");
      return;
    }

    // Already on plank
    if (currMeter >= 1) {
      setP1Pose("PLANK");
      if (streak >= 2) setP1Anim("HYPE_IDLE");
      else setP1Anim("PLANK_IDLE");
      return;
    }

    // Hanging
    setP1Pose("HANG");
    if (currMeter < 0) setP1Anim("PANIC_HANG_IDLE");
    else setP1Anim("HANG_IDLE");
  }, [meter, streak, status]);

  const computerPull = () => {
    const cpuPulls = Math.random() < 0.35;
    if (cpuPulls) setMeter((m) => m - 1);
  };

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
      const prev = meter;
      setMeter((m) => m + 1);
      setStreak((s) => s + 1);

      if (prev >= 1 && status === "playing") {
        setP1Anim("MINI_PULL");
      }

      setTimeout(async () => {
        await nextQuestion();
        setLocked(false);
      }, 650);
    } else {
      setMeter((m) => m - 1);
      setStreak(0);

      setTimeout(async () => {
        computerPull();
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

    setP1Anim("HANG_IDLE");
    setP1Pose("HANG");
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

    if (finishedAnim === "LOSE_SINK") {
      setP1Anim("UNDERWATER_DRIFT");
    }
  };

  const getP1Speed = () => {
    if (p1Anim === "CLIMB_UP") return 0.28;       // slower climb
    if (p1Anim === "BACKFLIP_WIN") return 0.5;
    if (p1Anim === "MINI_PULL") return 0.5;
    return 0.65; // loops
  };

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

          <div className="tugStage">
            <div className="tugArena">
              <img
                src={plankImg}
                alt="plank"
                className="plankImg"
                style={{
                  transform: `translateX(calc(-50% + ${meter * 8}px)) rotate(${meter * 1.5}deg)`
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
              <div className="questionText">{current.question}</div>

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