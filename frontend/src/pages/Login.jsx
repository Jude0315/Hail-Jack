import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await axios.post(
        "http://localhost:3001/login",
        { email, password },
        { withCredentials: true }
      );

      if (result.data?.message === "Success") {
        navigate("/dashboard");
        return;
      }

      setError(result.data?.message || "Login failed. Try again.");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Server error.";
      setError(msg);
      console.error("Login error:", err?.response || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hail-login-page">
      <div className="hail-login-overlay" />

      <div className="hail-stars layer" />
      <div className="hail-moon layer" />
      <div className="hail-moon-glow layer" />

      <div className="hail-cloud hail-cloud-1 layer" />
      <div className="hail-cloud hail-cloud-2 layer" />
      <div className="hail-cloud hail-cloud-3 layer" />

      <div className="hail-snow layer">
        <span className="snowflake snowflake-1">❄</span>
        <span className="snowflake snowflake-2">❄</span>
        <span className="snowflake snowflake-3">❄</span>
        <span className="snowflake snowflake-4">❄</span>
        <span className="snowflake snowflake-5">❄</span>
        <span className="snowflake snowflake-6">❄</span>
        <span className="snowflake snowflake-7">❄</span>
        <span className="snowflake snowflake-8">❄</span>
        <span className="snowflake snowflake-9">❄</span>
        <span className="snowflake snowflake-10">❄</span>
        <span className="snowflake snowflake-11">❄</span>
        <span className="snowflake snowflake-12">❄</span>
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

      <div className="hail-login-content">
        <div className="hail-brand">
          <p className="hail-brand-kicker">Welcome aboard</p>
          <h1 className="hail-title">HAIL JACK</h1>
          <p className="hail-tagline">
            Answer smart. Stay afloat. Keep Jack on the plank.
          </p>

          <div className="hail-quote-box">
            <span className="hail-quote-label">Jack says</span>
            <p>“It’s freezing out here... log in and save me!”</p>
          </div>
        </div>

        <div className="hail-login-card">
          <div className="hail-card-top">
            <span className="hail-badge">Ocean Login</span>
            <h2>Start Voyage</h2>
            <p>Log in and jump back into the storm.</p>
          </div>

          {error && (
            <div className="hail-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="hail-form">
            <div className="hail-form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="hail-input"
              />
            </div>

            <div className="hail-form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="hail-input"
              />
            </div>

            <button
              type="submit"
              className="hail-login-btn"
              disabled={loading}
            >
              {loading ? "Boarding..." : "Start Voyage"}
            </button>
          </form>

          <div className="hail-divider">
            <span>New to the ship?</span>
          </div>

          <Link to="/register" className="hail-register-btn">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;