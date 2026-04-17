/*
Parts of this file were developed with assistance from ChatGPT (OpenAI), April 2026.
The suggestions were reviewed, understood, modified, tested, and integrated into this project by me.
This includes support with backend structure, authentication/session handling, API integration, and leaderboard-related logic.
*/

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const bcrypt = require("bcrypt");
const PlayerModel = require("./models/Player");
const GameResultModel = require("./models/GameResult");

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
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  })
);

// Configure session storage in MongoDB so login state can persist across requests
// The session setup below was developed with assistance from ChatGPT (OpenAI), April 2026.
// I reviewed, understood, adapted, and integrated it into this project.
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
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// =========================
// Database
// =========================
// Connect to the local MongoDB database before handling application data
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected locally ✅"))
  .catch((err) => console.log("MongoDB connection failed ❌", err));

// =========================
// Helpers
// =========================
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()[\]{}\-_=+\\|;:'",.<>/?`~]).{8,}$/;

// Validate user input before creating a new account
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

// Protect routes that should only be accessible to logged-in users
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Randomize answer order before sending quiz options to the frontend
function shuffleArray(items) {
  const arr = [...items];

  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

// =========================
// Auth Routes
// =========================

// Register
// The registration logic below was developed with assistance from ChatGPT (OpenAI), April 2026.
// I reviewed, understood, modified, and integrated it into this project.
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

    // Hash the password before storing it in the database
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
// The login and session creation logic below was developed with assistance from ChatGPT (OpenAI), April 2026.
// I reviewed, understood, adapted, and integrated it into this project.
app.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await PlayerModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No record existed" });
    }

    // Compare entered password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Password incorrect" });
    }

    // Store key user details in the session after successful login
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
// Destroy the session and clear the cookie when the user logs out
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }

    res.clearCookie("quiz.sid");
    return res.json({ message: "Logged out successfully" });
  });
});

// Current logged-in user
// Return the current authenticated user from the session
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

// Fetch external trivia data with a timeout to avoid hanging requests
// The external API request handling below was developed with assistance from ChatGPT (OpenAI), April 2026.
// I reviewed, understood, modified, and integrated it into this project.
async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    return res;
  } finally {
    clearTimeout(timer);
  }
}

// Retry failed API requests a few times before returning an error
async function fetchTriviaApiWithRetry(url, retries = 3) {
  let lastErr;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, 8000);

      if (!response.ok) {
        throw new Error(`The Trivia API HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("The Trivia API returned invalid format");
      }

      if (data.length === 0) {
        throw new Error("The Trivia API returned empty results");
      }

      return data;
    } catch (err) {
      lastErr = err;
      console.warn(`The Trivia API attempt ${attempt} failed: ${err.message}`);
    }
  }

  throw lastErr;
}

// =========================
// Questions Route
// =========================

// Fetch quiz questions from the external trivia service and prepare them for the game
// The question fetching and formatting logic below was developed with assistance from ChatGPT (OpenAI), April 2026.
// I reviewed, understood, adapted, and integrated it into this project.
app.get("/game/questions", requireAuth, async (req, res) => {
  try {
    const amount = Number(req.query.amount || 5);
    const safeAmount = Number.isNaN(amount)
      ? 5
      : Math.min(Math.max(amount, 1), 10);

    const url =
      `https://the-trivia-api.com/v2/questions` +
      `?limit=${safeAmount}` +
      `&difficulties=easy`;

    const data = await fetchTriviaApiWithRetry(url, 3);

    const questions = data.map((q) => {
      const correctAnswer = String(q.correctAnswer || "").trim();
      const incorrectAnswers = Array.isArray(q.incorrectAnswers)
        ? q.incorrectAnswers.map((item) => String(item).trim())
        : [];

      const options = shuffleArray([correctAnswer, ...incorrectAnswers]);

      const rawCategory = String(q.category || "")
        .replace(/_/g, " ")
        .trim();

      const category =
        rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1);

      const difficulty = String(q.difficulty || "easy").trim();

      return {
        question: String(q.question?.text || "").trim(),
        options,
        answer: correctAnswer,
        category: category || "General Knowledge",
        difficulty,
      };
    });

    return res.json({ questions });
  } catch (err) {
    console.error("GAME QUESTIONS FINAL FAIL:", err.message);
    return res.status(502).json({
      message: "Question service unavailable (The Trivia API)",
      error: err.message,
    });
  }
});

// =========================
// Leaderboard Routes
// =========================

// Save completed game
// The leaderboard persistence logic below was developed with assistance from ChatGPT (OpenAI), April 2026.
// I reviewed, understood, modified, and integrated it into this project.
app.post("/leaderboard/save", requireAuth, async (req, res) => {
  try {
    const {
      result,
      score,
      correctAnswers,
      wrongAnswers,
      bestStreak,
      finalMeter,
    } = req.body;

    if (!["win", "lose"].includes(result)) {
      return res.status(400).json({ message: "Invalid result" });
    }

    const gameResult = await GameResultModel.create({
      playerId: req.session.userId,
      playerName: req.session.userName,
      result,
      score: Number(score) || 0,
      correctAnswers: Number(correctAnswers) || 0,
      wrongAnswers: Number(wrongAnswers) || 0,
      bestStreak: Number(bestStreak) || 0,
      finalMeter: Number(finalMeter) || 0,
      playedAt: new Date(),
    });

    return res.status(201).json({
      message: "Game result saved",
      gameResult,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to save game result",
      error: err.message,
    });
  }
});

// Overall player leaderboard
// Aggregate player performance across all saved matches
app.get("/leaderboard/players", requireAuth, async (req, res) => {
  try {
    const leaderboard = await GameResultModel.aggregate([
      {
        $group: {
          _id: "$playerId",
          playerName: { $first: "$playerName" },
          totalScore: { $sum: "$score" },
          gamesPlayed: { $sum: 1 },
          wins: {
            $sum: {
              $cond: [{ $eq: ["$result", "win"] }, 1, 0],
            },
          },
          losses: {
            $sum: {
              $cond: [{ $eq: ["$result", "lose"] }, 1, 0],
            },
          },
          bestStreak: { $max: "$bestStreak" },
          totalCorrectAnswers: { $sum: "$correctAnswers" },
          totalWrongAnswers: { $sum: "$wrongAnswers" },
          lastPlayed: { $max: "$playedAt" },
        },
      },
      {
        $addFields: {
          winRate: {
            $cond: [
              { $eq: ["$gamesPlayed", 0] },
              0,
              {
                $multiply: [{ $divide: ["$wins", "$gamesPlayed"] }, 100],
              },
            ],
          },
          accuracy: {
            $cond: [
              {
                $eq: [
                  { $add: ["$totalCorrectAnswers", "$totalWrongAnswers"] },
                  0,
                ],
              },
              0,
              {
                $multiply: [
                  {
                    $divide: [
                      "$totalCorrectAnswers",
                      { $add: ["$totalCorrectAnswers", "$totalWrongAnswers"] },
                    ],
                  },
                  100,
                ],
              },
            ],
          },
        },
      },
      { $sort: { totalScore: -1, wins: -1, bestStreak: -1, lastPlayed: -1 } },
    ]);

    return res.json({ leaderboard });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch player leaderboard",
      error: err.message,
    });
  }
});

// Top match sessions
// Return the highest scoring individual game sessions
app.get("/leaderboard/sessions", requireAuth, async (req, res) => {
  try {
    const sessions = await GameResultModel.find({})
      .sort({ score: -1, playedAt: -1 })
      .limit(100);

    return res.json({ sessions });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch session leaderboard",
      error: err.message,
    });
  }
});

// Summary stats
// Return overall statistics for the leaderboard dashboard
app.get("/leaderboard/summary", requireAuth, async (req, res) => {
  try {
    const totalPlayers = await GameResultModel.distinct("playerId");
    const totalMatches = await GameResultModel.countDocuments();

    const topMatch = await GameResultModel.findOne({})
      .sort({ score: -1, playedAt: -1 })
      .lean();

    const topPlayerAgg = await GameResultModel.aggregate([
      {
        $group: {
          _id: "$playerId",
          playerName: { $first: "$playerName" },
          totalScore: { $sum: "$score" },
        },
      },
      { $sort: { totalScore: -1 } },
      { $limit: 1 },
    ]);

    return res.json({
      totalPlayers: totalPlayers.length,
      totalMatches,
      highestScoreEver: topMatch?.score || 0,
      topPlayer: topPlayerAgg[0]?.playerName || "-",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch leaderboard summary",
      error: err.message,
    });
  }
});

// =========================
// Start Server
// =========================
// Start the Express server on the configured port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ✅`);
});