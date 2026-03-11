import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Signup.css";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validatePassword = (pwd) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()[\]{}\-_=+\\|;:'",.<>/?`~]).{8,}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const result = await axios.post("http://localhost:3001/register", {
        name,
        email,
        password,
      });

      if (result.data?.message === "Registration successful") {
        setSuccess("Registration successful. Redirecting to login...");
        setTimeout(() => navigate("/login"), 1200);
        return;
      }

      setSuccess("Registration complete. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed.";
      setError(msg);
      console.error("Signup error:", err?.response || err);
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const passwordStrong = validatePassword(password);

  return (
    <div className="hail-signup-page">
      <div className="hail-signup-overlay" />

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

      <div className="hail-signup-content">
        <div className="hail-brand">
          <p className="hail-brand-kicker">Join the adventure</p>
          <h1 className="hail-title">HAIL JACK</h1>
          <p className="hail-tagline">
            Create your account, brave the icy sea, and help Jack survive one
            question at a time.
          </p>

          <div className="hail-quote-box">
            <span className="hail-quote-label">Jack says</span>
            <p>“New crew? Perfect. I could really use the help out here!”</p>
          </div>
        </div>

        <div className="hail-signup-card">
          <div className="hail-card-top">
            <span className="hail-badge">Crew Registration</span>
            <h2>Create Account</h2>
            <p>Sign up and step onto the plank.</p>
          </div>

          {error && (
            <div className="hail-message hail-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="hail-message hail-success" role="alert">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="hail-form">
            <div className="hail-form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                placeholder="Enter your name"
                className="hail-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="hail-form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="hail-input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="hail-form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Create a password"
                className="hail-input"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <small
                className={`hail-helper ${
                  password.length > 0
                    ? passwordStrong
                      ? "is-good"
                      : "is-bad"
                    : ""
                }`}
              >
                Minimum 8 characters, with uppercase, lowercase, number, and
                special character.
              </small>
            </div>

            <div className="hail-form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Retype your password"
                className="hail-input"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword && (
                <small
                  className={`hail-helper ${
                    passwordsMatch ? "is-good" : "is-bad"
                  }`}
                >
                  {passwordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </small>
              )}
            </div>

            <button
              type="submit"
              className="hail-signup-btn"
              disabled={loading}
            >
              {loading ? "Creating Crew Pass..." : "Join the Voyage"}
            </button>
          </form>

          <div className="hail-divider">
            <span>Already part of the crew?</span>
          </div>

          <Link to="/login" className="hail-login-btn-secondary">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;