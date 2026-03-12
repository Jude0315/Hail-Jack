import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

import IntroScreen from "./pages/IntroScreen";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Game from "./pages/Game";
import Leaderboard from "./pages/Leaderboard";
import HowToPlay from "./pages/HowToPlay";
import Home from "./pages/Home";

// Protect private pages like dashboard/game/leaderboard
function ProtectedRoute() {
  const [authState, setAuthState] = useState({
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        await axios.get("http://localhost:3001/me", {
          withCredentials: true,
        });

        if (mounted) {
          setAuthState({
            loading: false,
            isAuthenticated: true,
          });
        }
      } catch (err) {
        if (mounted) {
          setAuthState({
            loading: false,
            isAuthenticated: false,
          });
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  if (authState.loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#08111f",
          color: "white",
          fontSize: "1.2rem",
        }}
      >
        Checking session...
      </div>
    );
  }

  return authState.isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

// Prevent logged-in users from visiting login/register again
function PublicRoute() {
  const [authState, setAuthState] = useState({
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        await axios.get("http://localhost:3001/me", {
          withCredentials: true,
        });

        if (mounted) {
          setAuthState({
            loading: false,
            isAuthenticated: true,
          });
        }
      } catch (err) {
        if (mounted) {
          setAuthState({
            loading: false,
            isAuthenticated: false,
          });
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  if (authState.loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#08111f",
          color: "white",
          fontSize: "1.2rem",
        }}
      >
        Loading...
      </div>
    );
  }

  return authState.isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function App() {
  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={<IntroScreen />} />

      {/* Public only routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/game" element={<Game />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/how" element={<HowToPlay />} />
      </Route>

      {/* Optional home route */}
      <Route path="/home" element={<Home />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;