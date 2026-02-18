import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/scene.css"; // reuse your card/button styles

export default function Game() {
  const navigate = useNavigate();

  // tug meter: -4..+4
  const [meter, setMeter] = useState(0);
  const [streak, setStreak] = useState(0);
  const [status, setStatus] = useState("playing"); // playing | win | lose

  // TEMP questions (replace with API later)
  const questions = useMemo(
    () => [
      {
        q: "2 + 2 = ?",
        options: ["3", "4", "5", "22"],
        answer: "4",
      },
      {
        q: "5 × 3 = ?",
        options: ["8", "15", "10", "53"],
        answer: "15",
      },
      {
        q: "12 ÷ 4 = ?",
        options: ["2", "3", "4", "6"],
        answer: "3",
      },
      {
        q: "9 − 1 = ?",
        options: ["7", "8", "9", "10"],
        answer: "8",
      },
    ],
    []
  );

  const [idx, setIdx] = useState(0);
  const current = questions[idx];

  // decide win/lose
  useEffect(() => {
    if (meter >= 4) setStatus("win");
    if (meter <= -4) setStatus("lose");
  }, [meter]);

  const nextQuestion = () => {
    setIdx((prev) => (prev + 1) % questions.length);
  };

  const computerPull = () => {
    // simple AI: 55% chance to pull back (tune later)
    const cpuCorrect = Math.random() < 0.55;
    if (cpuCorrect) setMeter((m) => m - 1);
  };

  const submitAnswer = (choice) => {
    if (status !== "playing") return;

    const correct = choice === current.answer;

    if (correct) {
      setMeter((m) => m + 1);
      setStreak((s) => s + 1);
    } else {
      setMeter((m) => m - 1);
      setStreak(0);
    }

    // CPU responds after you answer (small delay feels better)
    setTimeout(() => {
      computerPull();
      nextQuestion();
    }, 350);
  };

  const resetGame = () => {
    setMeter(0);
    setStreak(0);
    setStatus("playing");
    setIdx(0);
  };

  return (
    <div className="scene">
      {/* Reuse your background video (optional) */}
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

            {/* simple bar */}
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

          {/* Win/Lose */}
          {status !== "playing" ? (
            <div style={{ textAlign: "center" }}>
              <h3 style={{ color: "#eaf1ff" }}>
                {status === "win" ? "You Win 🏆 (Hammer time)" : "You Lose 🌊"}
              </h3>
              <p style={{ color: "rgba(234,241,255,0.75)" }}>
                Meter reached {meter}.
              </p>

              <div className="rowBtns" style={{ marginTop: 14 }}>
                <button className="smallBtn" onClick={resetGame}>
                  Play Again
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
                {current.q}
              </div>

              {/* Options */}
              <div className="rowBtns" style={{ gridTemplateColumns: "1fr 1fr" }}>
                {current.options.map((opt) => (
                  <button
                    key={opt}
                    className="smallBtn"
                    onClick={() => submitAnswer(opt)}
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
