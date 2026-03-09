const mongoose = require("mongoose");

const GameResultSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "players",
      required: true,
    },
    playerName: {
      type: String,
      required: true,
      trim: true,
    },
    result: {
      type: String,
      enum: ["win", "lose"],
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    wrongAnswers: {
      type: Number,
      default: 0,
    },
    bestStreak: {
      type: Number,
      default: 0,
    },
    finalMeter: {
      type: Number,
      default: 0,
    },
    playedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("game_results", GameResultSchema);