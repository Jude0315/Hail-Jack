const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const PlayerModel = require("./models/Player");

const app = express();

// Middleware
app.use(express.json());

// ✅ CORS (frontend is Vite default 5173)
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  })
);

// Local MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/players")
  .then(() => console.log("MongoDB connected locally ✅"))
  .catch((err) => console.log("MongoDB connection failed ❌", err));

// Register
app.post("/register", (req, res) => {
  PlayerModel.create(req.body)
    .then((player) => res.json(player))
    .catch((err) => res.status(500).json({ message: "Register failed", error: err.message }));
});

// Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  PlayerModel.findOne({ email })
    .then((user) => {
      if (!user) return res.status(404).json({ message: "No record existed" });

      if (user.password !== password) {
        return res.status(401).json({ message: "Password incorrect" });
      }

      return res.json({ message: "Success" });
    })
    .catch((err) => res.status(500).json({ message: "Login failed", error: err.message }));
});

// ✅ Questions route (external API via backend)
app.get("/game/questions", async (req, res) => {
  try {
    const amount = Number(req.query.amount || 5);

    const url = `https://opentdb.com/api.php?amount=${amount}&type=multiple&difficulty=easy`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OpenTDB HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.results)) {
      throw new Error("OpenTDB returned invalid format");
    }

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
    console.error("GAME QUESTIONS ERROR:", err);
    res.status(500).json({
      message: "Failed to fetch questions",
      error: err.message,
    });
  }
});

// Start server
app.listen(3001, () => {
  console.log("Server running on port 3001 ✅");
});
