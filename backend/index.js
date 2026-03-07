const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const bcrypt = require("bcrypt");
const PlayerModel = require("./models/Player");

const app = express();

// =========================
// Config
// =========================
const PORT = 3001;
const MONGO_URI = "mongodb://127.0.0.1:27017/players";
const SESSION_SECRET = "super-secret-session-key-change-this";

// =========================
// Middleware
// =========================
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(
  session({
    name: "quiz.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: false, // true only with HTTPS
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// =========================
// Database
// =========================
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected locally ✅"))
  .catch((err) => console.log("MongoDB connection failed ❌", err));

// =========================
// Helpers
// =========================
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Minimum 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()[\]{}\-_=+\\|;:'",.<>/?`~]).{8,}$/;

function validateRegisterInput(name, email, password) {
  if (!name || !name.trim()) {
    return "Name is required";
  }

  if (name.trim().length < 2) {
    return "Name must be at least 2 characters";
  }

  if (!email || !emailRegex.test(email)) {
    return "Please enter a valid email address";
  }

  if (!password || !passwordRegex.test(password)) {
    return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";
  }

  return null;
}

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// =========================
// Auth Routes
// =========================

// Register
app.post("/register", async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    const validationError = validateRegisterInput(name, email, password);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingUser = await PlayerModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const player = await PlayerModel.create({
      name,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: player._id,
        name: player.name,
        email: player.email,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Register failed",
      error: err.message,
    });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await PlayerModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No record existed" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Password incorrect" });
    }

    req.session.userId = user._id.toString();
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    return res.json({
      message: "Success",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Login failed",
      error: err.message,
    });
  }
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }

    res.clearCookie("quiz.sid");
    return res.json({ message: "Logged out successfully" });
  });
});

// Check current logged-in user
app.get("/me", (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Not logged in" });
  }

  return res.json({
    message: "Authenticated",
    user: {
      id: req.session.userId,
      name: req.session.userName,
      email: req.session.userEmail,
    },
  });
});

// Example protected route
app.get("/protected", requireAuth, (req, res) => {
  return res.json({
    message: "You are authorized to access this route",
    userId: req.session.userId,
  });
});

// =========================
// Trivia API Helpers
// =========================
async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOpenTdbWithRetry(url, retries = 3) {
  let lastErr;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, 8000);

      if (!response.ok) {
        throw new Error(`OpenTDB HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.results)) {
        throw new Error("OpenTDB returned invalid format");
      }

      if (data.results.length === 0) {
        throw new Error("OpenTDB returned empty results");
      }

      return data;
    } catch (err) {
      lastErr = err;
      console.warn(`OpenTDB attempt ${attempt} failed: ${err.message}`);
    }
  }

  throw lastErr;
}

// =========================
// Questions Route
// =========================
app.get("/game/questions", async (req, res) => {
  try {
    const amount = Number(req.query.amount || 5);
    const url = `https://opentdb.com/api.php?amount=${amount}&type=multiple&difficulty=easy`;

    const data = await fetchOpenTdbWithRetry(url, 3);

    const decode = (s = "") =>
      s
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");

    const questions = data.results.map((q) => {
      const options = [...q.incorrect_answers, q.correct_answer]
        .map(decode)
        .sort(() => Math.random() - 0.5);

      return {
        question: decode(q.question),
        options,
        answer: decode(q.correct_answer),
        category: q.category,
        difficulty: q.difficulty,
      };
    });

    res.json({ questions });
  } catch (err) {
    console.error("GAME QUESTIONS FINAL FAIL:", err.message);
    res.status(502).json({
      message: "Question service unavailable (OpenTDB)",
      error: err.message,
    });
  }
});

// =========================
// Start Server
// =========================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ✅`);
});