import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/scene.css";

export default function Leaderboard() {
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState({
    totalPlayers: 0,
    totalMatches: 0,
    highestScoreEver: 0,
    topPlayer: "-",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [playersRes, sessionsRes, summaryRes] = await Promise.all([
          axios.get("http://localhost:3001/leaderboard/players", {
            withCredentials: true,
          }),
          axios.get("http://localhost:3001/leaderboard/sessions", {
            withCredentials: true,
          }),
          axios.get("http://localhost:3001/leaderboard/summary", {
            withCredentials: true,
          }),
        ]);

        setPlayers(playersRes.data?.leaderboard || []);
        setSessions(sessionsRes.data?.sessions || []);
        setSummary(
          summaryRes.data || {
            totalPlayers: 0,
            totalMatches: 0,
            highestScoreEver: 0,
            topPlayer: "-",
          }
        );
      } catch (err) {
        console.error("Leaderboard load error:", err?.response || err);
        setError("Failed to load leaderboard.");
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;

    return players.filter((player) =>
      String(player.playerName || "")
        .toLowerCase()
        .includes(q)
    );
  }, [players, search]);

  const visiblePlayers = showAllPlayers
    ? filteredPlayers
    : filteredPlayers.slice(0, 10);

  const visibleSessions = showAllSessions
    ? sessions
    : sessions.slice(0, 10);

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="scene">
        <video className="bgVideo" autoPlay loop muted playsInline>
          <source src="/videos/dashboard.mp4" type="video/mp4" />
        </video>
        <div className="videoOverlay" />
        <div className="ui">
          <div className="card">
            <h2 className="title">Loading Leaderboard...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scene">
      <video className="bgVideo" autoPlay loop muted playsInline>
        <source src="/videos/dashboard.mp4" type="video/mp4" />
      </video>
      <div className="videoOverlay" />

      <div className="ui" style={{ padding: "30px 0" }}>
        <div
          className="card"
          style={{
            width: "min(1100px, 95vw)",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1 className="title" style={{ marginBottom: 8 }}>
                LEADERBOARD
              </h1>
              <p className="subtitle" style={{ marginBottom: 0 }}>
                Track the best players and top game sessions
              </p>
            </div>

            <button className="smallBtn" onClick={() => navigate("/dashboard")}>
              BACK
            </button>
          </div>

          {error && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 10,
                background: "rgba(255,0,0,0.12)",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              marginTop: 20,
            }}
          >
            <div className="pill" style={{ padding: 12, textAlign: "center" }}>
              Total Players: <strong>{summary.totalPlayers}</strong>
            </div>
            <div className="pill" style={{ padding: 12, textAlign: "center" }}>
              Total Matches: <strong>{summary.totalMatches}</strong>
            </div>
            <div className="pill" style={{ padding: 12, textAlign: "center" }}>
              Highest Score: <strong>{summary.highestScoreEver}</strong>
            </div>
            <div className="pill" style={{ padding: 12, textAlign: "center" }}>
              #1 Player: <strong>{summary.topPlayer}</strong>
            </div>
          </div>

          <div style={{ marginTop: 28 }}>
            <h2 className="title" style={{ fontSize: 28 }}>
              Overall Players
            </h2>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                marginTop: 12,
                marginBottom: 16,
              }}
            >
              <input
                type="text"
                placeholder="Search player by name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowAllPlayers(true);
                }}
                style={{
                  flex: 1,
                  minWidth: 240,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #ccc",
                }}
              />
            </div>

            {filteredPlayers.length === 0 ? (
              <p>No players found.</p>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginTop: 10,
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={thStyle}>Rank</th>
                        <th style={thStyle}>Player</th>
                        <th style={thStyle}>Total Score</th>
                        <th style={thStyle}>Games</th>
                        <th style={thStyle}>Wins</th>
                        <th style={thStyle}>Losses</th>
                        <th style={thStyle}>Win Rate</th>
                        <th style={thStyle}>Accuracy</th>
                        <th style={thStyle}>Best Streak</th>
                        <th style={thStyle}>Last Played</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePlayers.map((player, index) => {
                        const actualRank = filteredPlayers.findIndex(
                          (p) => p._id === player._id
                        ) + 1;

                        return (
                          <tr key={player._id}>
                            <td style={tdStyle}>{actualRank}</td>
                            <td style={tdStyle}>{player.playerName}</td>
                            <td style={tdStyle}>{player.totalScore}</td>
                            <td style={tdStyle}>{player.gamesPlayed}</td>
                            <td style={tdStyle}>{player.wins}</td>
                            <td style={tdStyle}>{player.losses}</td>
                            <td style={tdStyle}>
                              {Number(player.winRate || 0).toFixed(1)}%
                            </td>
                            <td style={tdStyle}>
                              {Number(player.accuracy || 0).toFixed(1)}%
                            </td>
                            <td style={tdStyle}>{player.bestStreak}</td>
                            <td style={tdStyle}>{formatDate(player.lastPlayed)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredPlayers.length > 10 && (
                  <div style={{ marginTop: 16, textAlign: "center" }}>
                    <button
                      className="smallBtn"
                      onClick={() => setShowAllPlayers((prev) => !prev)}
                    >
                      {showAllPlayers ? "Show Top 10 Only" : "Show More Players"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ marginTop: 36 }}>
            <h2 className="title" style={{ fontSize: 28 }}>
              Top Match Sessions
            </h2>

            {sessions.length === 0 ? (
              <p>No match sessions yet.</p>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginTop: 10,
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={thStyle}>Rank</th>
                        <th style={thStyle}>Player</th>
                        <th style={thStyle}>Score</th>
                        <th style={thStyle}>Result</th>
                        <th style={thStyle}>Correct</th>
                        <th style={thStyle}>Wrong</th>
                        <th style={thStyle}>Best Streak</th>
                        <th style={thStyle}>Final Meter</th>
                        <th style={thStyle}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleSessions.map((session, index) => (
                        <tr key={session._id}>
                          <td style={tdStyle}>{index + 1}</td>
                          <td style={tdStyle}>{session.playerName}</td>
                          <td style={tdStyle}>{session.score}</td>
                          <td style={tdStyle}>
                            {session.result === "win" ? "Win 🏆" : "Lose 🌊"}
                          </td>
                          <td style={tdStyle}>{session.correctAnswers}</td>
                          <td style={tdStyle}>{session.wrongAnswers}</td>
                          <td style={tdStyle}>{session.bestStreak}</td>
                          <td style={tdStyle}>{session.finalMeter}</td>
                          <td style={tdStyle}>{formatDate(session.playedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {sessions.length > 10 && (
                  <div style={{ marginTop: 16, textAlign: "center" }}>
                    <button
                      className="smallBtn"
                      onClick={() => setShowAllSessions((prev) => !prev)}
                    >
                      {showAllSessions ? "Show Top 10 Only" : "Show More Matches"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "10px",
  borderBottom: "1px solid rgba(255,255,255,0.2)",
  fontWeight: "bold",
};

const tdStyle = {
  padding: "10px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
};