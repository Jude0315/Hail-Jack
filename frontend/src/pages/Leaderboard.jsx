/*
Parts of this file were developed with assistance from ChatGPT (OpenAI), April 2026.
The suggestions were reviewed, understood, modified, tested, and integrated into this project by me.
This includes support with leaderboard data loading, filtering, summary display, and table rendering logic.
*/

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/leaderboard.css";

export default function Leaderboard() {
  const navigate = useNavigate();

  // Store leaderboard data from the backend
  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState({
    totalPlayers: 0,
    totalMatches: 0,
    highestScoreEver: 0,
    topPlayer: "-",
  });

  // General page states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  // Search and table display controls
  const [search, setSearch] = useState("");
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);

  // If the user is not authenticated, return them to login
  const handleUnauthorized = () => {
    navigate("/login", { replace: true });
  };

  // Log out the user and go back to login
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

  // The leaderboard loading logic below was developed with assistance from ChatGPT (OpenAI), April 2026.
  // I reviewed, understood, adapted, and integrated it into this project.
  useEffect(() => {
    // Load all leaderboard sections together
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

        if (err?.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        setError(
          err?.response?.data?.message || "Failed to load leaderboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [navigate]);

  // Filter players based on the search text
  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;

    return players.filter((player) =>
      String(player.playerName || "")
        .toLowerCase()
        .includes(q)
    );
  }, [players, search]);

  // Show either all players or just the top 10
  const visiblePlayers = showAllPlayers
    ? filteredPlayers
    : filteredPlayers.slice(0, 10);

  // Show either all match sessions or just the top 10
  const visibleSessions = showAllSessions
    ? sessions
    : sessions.slice(0, 10);

  // Format date values for display in the table
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  };

  // Return a badge for the player rank
  const getRankBadge = (rank) => {
    if (rank === 1) return "1";
    if (rank === 2) return "2";
    if (rank === 3) return "3";
    return `#${rank}`;
  };

  // Loading screen while leaderboard data is being fetched
  if (loading) {
    return (
      <div className="hail-board-page">
        <video className="hail-board-video" autoPlay loop muted playsInline>
          <source src="/videos/dashboard.mp4" type="video/mp4" />
        </video>

        <div className="hail-board-overlay" />
        <div className="hail-board-stars" />
        <div className="hail-board-fog hail-board-fog-one" />
        <div className="hail-board-fog hail-board-fog-two" />
        <div className="hail-board-wave hail-board-wave-back" />
        <div className="hail-board-wave hail-board-wave-front" />

        <div className="hail-board-shell">
          <div className="hail-loading-card">
            <div className="hail-loading-orb" />
            <h2>Loading Hall of Survival...</h2>
            <p>Gathering the bravest names from the icy sea.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hail-board-page">
      <video className="hail-board-video" autoPlay loop muted playsInline>
        <source src="/videos/dashboard.mp4" type="video/mp4" />
      </video>

      {/* Background layers and effects */}
      <div className="hail-board-overlay" />
      <div className="hail-board-stars" />
      <div className="hail-board-fog hail-board-fog-one" />
      <div className="hail-board-fog hail-board-fog-two" />
      <div className="hail-board-wave hail-board-wave-back" />
      <div className="hail-board-wave hail-board-wave-mid" />
      <div className="hail-board-wave hail-board-wave-front" />

      <div className="hail-board-shell">
        <div className="hail-board-panel">
          {/* Page heading and top action buttons */}
          <div className="hail-board-header">
            <div className="hail-board-title-wrap">
              <p className="hail-board-kicker">Frozen records</p>
              <h1 className="hail-board-title">HALL OF SURVIVAL</h1>
              <p className="hail-board-subtitle">
                The bravest players, highest scores, and fiercest rescue runs
                in Hail Jack.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                className="hail-board-back-btn"
                onClick={() => navigate("/dashboard")}
              >
                Back
              </button>

              <button
                className="hail-board-back-btn"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>

          {/* Error message if loading fails */}
          {error && (
            <div className="hail-board-alert hail-board-alert-error">
              {error}
            </div>
          )}

          {/* Summary cards */}
          <div className="hail-summary-grid">
            <div className="hail-summary-card icy-blue">
              <span className="hail-summary-label">Total Players</span>
              <strong className="hail-summary-value">
                {summary.totalPlayers}
              </strong>
            </div>

            <div className="hail-summary-card icy-cyan">
              <span className="hail-summary-label">Total Matches</span>
              <strong className="hail-summary-value">
                {summary.totalMatches}
              </strong>
            </div>

            <div className="hail-summary-card icy-gold">
              <span className="hail-summary-label">Highest Score Ever</span>
              <strong className="hail-summary-value">
                {summary.highestScoreEver}
              </strong>
            </div>

            <div className="hail-summary-card icy-violet">
              <span className="hail-summary-label">Top Survivor</span>
              <strong className="hail-summary-value">{summary.topPlayer}</strong>
            </div>
          </div>

          {/* Overall player leaderboard */}
          <section className="hail-section">
            <div className="hail-section-head">
              <div>
                <h2 className="hail-section-title">Overall Players</h2>
                <p className="hail-section-note">
                  Search the legends who kept Jack afloat the longest.
                </p>
              </div>

              <div className="hail-search-wrap">
                <input
                  type="text"
                  placeholder="Search player by name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowAllPlayers(true);
                  }}
                  className="hail-search-input"
                />
              </div>
            </div>

            {filteredPlayers.length === 0 ? (
              <div className="hail-empty-state">
                No players found in the frozen records.
              </div>
            ) : (
              <>
                <div className="hail-table-wrap">
                  <table className="hail-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Total Score</th>
                        <th>Games</th>
                        <th>Wins</th>
                        <th>Losses</th>
                        <th>Win Rate</th>
                        <th>Accuracy</th>
                        <th>Best Streak</th>
                        <th>Last Played</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePlayers.map((player) => {
                        // Keep rank consistent with the filtered player list
                        const actualRank =
                          filteredPlayers.findIndex((p) => p._id === player._id) + 1;

                        return (
                          <tr
                            key={player._id}
                            className={actualRank <= 3 ? "is-top-rank" : ""}
                          >
                            <td>
                              <span className={`hail-rank-pill rank-${actualRank}`}>
                                {getRankBadge(actualRank)}
                              </span>
                            </td>
                            <td className="hail-player-name-cell">
                              <span className="hail-player-name">
                                {player.playerName || "Unknown"}
                              </span>
                            </td>
                            <td>{player.totalScore}</td>
                            <td>{player.gamesPlayed}</td>
                            <td>{player.wins}</td>
                            <td>{player.losses}</td>
                            <td>{Number(player.winRate || 0).toFixed(1)}%</td>
                            <td>{Number(player.accuracy || 0).toFixed(1)}%</td>
                            <td>{player.bestStreak}</td>
                            <td>{formatDate(player.lastPlayed)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Button to expand or collapse the player list */}
                {filteredPlayers.length > 10 && (
                  <div className="hail-action-row">
                    <button
                      className="hail-board-toggle-btn"
                      onClick={() => setShowAllPlayers((prev) => !prev)}
                    >
                      {showAllPlayers ? "Show Top 10 Only" : "Show More Players"}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Top individual match sessions */}
          <section className="hail-section">
            <div className="hail-section-head">
              <div>
                <h2 className="hail-section-title">Top Match Sessions</h2>
                <p className="hail-section-note">
                  The strongest individual rescue attempts across the sea.
                </p>
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="hail-empty-state">
                No match sessions have been recorded yet.
              </div>
            ) : (
              <>
                <div className="hail-table-wrap">
                  <table className="hail-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Score</th>
                        <th>Result</th>
                        <th>Correct</th>
                        <th>Wrong</th>
                        <th>Best Streak</th>
                        <th>Final Meter</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleSessions.map((session, index) => (
                        <tr
                          key={session._id}
                          className={index < 3 ? "is-top-rank" : ""}
                        >
                          <td>
                            <span className={`hail-rank-pill rank-${index + 1}`}>
                              {getRankBadge(index + 1)}
                            </span>
                          </td>
                          <td className="hail-player-name-cell">
                            <span className="hail-player-name">
                              {session.playerName || "Unknown"}
                            </span>
                          </td>
                          <td>{session.score}</td>
                          <td>
                            <span
                              className={`hail-result-pill ${
                                session.result === "win" ? "win" : "lose"
                              }`}
                            >
                              {session.result === "win" ? "Win" : "Lose"}
                            </span>
                          </td>
                          <td>{session.correctAnswers}</td>
                          <td>{session.wrongAnswers}</td>
                          <td>{session.bestStreak}</td>
                          <td>{session.finalMeter}</td>
                          <td>{formatDate(session.playedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Button to expand or collapse the session list */}
                {sessions.length > 10 && (
                  <div className="hail-action-row">
                    <button
                      className="hail-board-toggle-btn"
                      onClick={() => setShowAllSessions((prev) => !prev)}
                    >
                      {showAllSessions ? "Show Top 10 Only" : "Show More Matches"}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}