import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState(""); // show login errors nicely
  const [loading, setLoading] = useState(false); // prevent double submit

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await axios.post("http://localhost:3001/login", {
        email,
        password,
      });

      console.log("Login response:", result.data);

      // ✅ Your backend returns: { message: "Success" }
      if (result.data?.message === "Success") {
        navigate("/dashboard");
        return;
      }

      // fallback if backend returns something else
      setError(result.data?.message || "Login failed. Try again.");
    } catch (err) {
      // Show proper error message from backend (404/401/etc.)
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
    <div className="bg-secondary min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-6 col-lg-4">
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-center mb-4">Login</h2>

              {/* ✅ Error message UI */}
              {error && (
                <div className="alert alert-danger py-2" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    <strong>Email</strong>
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter Email"
                    className="form-control"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Password */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    <strong>Password</strong>
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter Password"
                    className="form-control"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

                <p className="text-center mt-3 mb-2">
                  Don&apos;t have an account?
                </p>

                <Link to="/register" className="btn btn-outline-secondary w-100">
                  Register
                </Link>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;