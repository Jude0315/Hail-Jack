const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Local MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/players")
  .then(() => console.log("MongoDB connected locally ✅"))
  .catch((err) => console.log("MongoDB connection failed ❌", err));

// Simple test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Start server
app.listen(3001, () => {
  console.log("Server running on port 3001");
});
