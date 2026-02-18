import { useNavigate } from "react-router-dom";
import "../styles/scene.css";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="scene">
      {/* VIDEO BACKGROUND */}
      <video
        className="bgVideo"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src="/videos/dashboard.mp4" type="video/mp4" />
      </video>

      {/* Optional: dark overlay so text/buttons pop */}
      <div className="videoOverlay" />

      {/* Optional: keep some layers on top of video if you want */}
      {/* <div className="layer stars" /> */}
      {/* <div className="layer moon" /> */}

      <div className="ui">
        <div className="card">
          <h1 className="title">HAIL JACK</h1>
          <p className="subtitle">
            Tug-of-War Quiz • Survive the sea • Beat the rival
          </p>

          <button className="bigBtn" onClick={() => navigate("/game")}>
            START GAME
          </button>

          <div className="rowBtns">
            <button className="smallBtn" onClick={() => navigate("/leaderboard")}>
              LEADERBOARD
            </button>
            <button className="smallBtn" onClick={() => navigate("/how")}>
              HOW TO PLAY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
