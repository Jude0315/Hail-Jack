import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/scene.css";

export default function Game() {
  const navigate = useNavigate();

  const [meter, setMeter] = useState(0);
  const [streak, setStreak] = useState(0);
  const [status, setStatus] = useState("playing"); // playing | win | lose

  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);

  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false); // ✅ prevents double clicks

  // ✅ Reusable question loader
  const loadQuestions = async () => {
    try {
      setLoading(true);

      const url = `http://localhost:3001/game/questions?amount=5&t=${Date.now()}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error(`Backend returned ${res.status}`);

      const data = await res.json();

      if (!Array.isArray(data.questions)) {
        throw new Error("Invalid questions format");
      }

      setQuestions(data.questions);
      setIdx(0);
    } catch (err) {
      console.error("Failed to load questions:", err);
      setQuestions([]);
      setIdx(0);
    } finally {
      setLoading(false);
    }
  };

  // Load on first mount
  useEffect(() => {
    loadQuestions();
  }, []);

  // Win/Lose logic
  useEffect(() => {
    if (meter >= 4) setStatus("win");
    if (meter <= -4) setStatus("lose");
  }, [meter]);

  // ✅ CPU pull (only triggered on wrong answer)
  const computerPull = () => {
    const cpuPulls = Math.random() < 0.35;
    if (cpuPulls) setMeter((m) => m - 1);
  };

  // ✅ No-repeat nextQuestion:
  // If this was the last question -> fetch a new batch
  const nextQuestion = async () => {
    // If we are at the end of the current batch, fetch a new batch
    if (idx >= questions.length - 1) {
      await loadQuestions();
      return;
    }
    setIdx((prev) => prev + 1);
  };

  // ✅ Answer handling
  const submitAnswer = (choice) => {
    if (status !== "playing") return;
    if (locked) return; // ✅ ignore spam clicks

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

  // ✅ Play Again = reset + fetch fresh questions
  const resetGame = async () => {
    setMeter(0);
    setStreak(0);
    setStatus("playing");
    setLocked(false);
    await loadQuestions();
  };

  // Loading Screen
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

  // Failed fetch
  if (!questions.length) {
    return (
      <div className="scene">
        <video className="bgVideo" autoPlay loop muted playsInline>
          <source src="/videos/dashboard.mp4" type="video/mp4" />
        </video>

        <div className="ui">
          <div className="card">
            <h2 className="title">Failed to Load Questions</h2>
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
        <div className="card" style={{ width: "min(720px, 92vw)" }}>
          <h2 className="title" style={{ fontSize: 32 }}>
            Tug-of-War Quiz
          </h2>

          {/* Meter */}
          <div style={{ margin: "10px 0 18px", color: "rgba(234,241,255,0.8)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Computer</span>
              <span>Meter: {meter}</span>
              <span>You</span>
            </div>

            <div
              style={{
                marginTop: 10,
                height: 14,
                borderRadius: 999,
                background: "rgba(255,255,255,0.12)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${((meter + 4) / 8) * 100}%`,
                  background: "rgba(94,219,255,0.9)",
                  transition: "width 250ms ease",
                }}
              />
            </div>

            <div style={{ marginTop: 10, textAlign: "center" }}>
              Streak: <strong>{streak}</strong>
            </div>
          </div>

          {status !== "playing" ? (
            <div style={{ textAlign: "center" }}>
              <h3 style={{ color: "#eaf1ff" }}>
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
              <div style={{ color: "#eaf1ff", fontSize: 20, marginBottom: 14 }}>
                {current.question}
              </div>

              {/* Options */}
              <div className="rowBtns" style={{ gridTemplateColumns: "1fr 1fr" }}>
                {current.options.map((opt) => (
                  <button
                    key={opt}
                    className="smallBtn"
                    onClick={() => submitAnswer(opt)}
                    disabled={locked} // ✅ prevent double click
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
