import { useNavigate } from "react-router-dom";
import "../styles/scene.css";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="scene">
      <div className="layer sky" />
      <div className="layer stars" />
      <div className="layer moon" />
      <div className="layer icebergs" />
      <div className="layer ship" />
      <div className="layer water" />

      <div className="ui">
        <div className="card">
          <h1 className="title">HAIL JACK</h1>
          <p className="subtitle">Tug-of-War Quiz • Survive the sea • Beat the rival</p>

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
