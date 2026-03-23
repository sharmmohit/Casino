const mongoose = require("mongoose");

const gameSchema = mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["slots", "roulette", "blackjack", "poker", "baccarat", "craps", "keno", "bingo", "sportsbook"],
    required: true
  },
  provider: {
    type: String,
    required: true,
    enum: ["evolution", "pragmatic", "netent", "microgaming", "playtech", "custom"]
  },
  imageUrl: {
    type: String,
    default: "/games/default.jpg"
  },
  minBet: {
    type: Number,
    default: 1,
    min: 0
  },
  maxBet: {
    type: Number,
    default: 1000,
    min: 0
  },
  jackpot: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  settings: {
    rtp: { type: Number, default: 96, min: 0, max: 100 }, // Return to Player %
    volatility: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    maxWin: { type: Number, default: 10000 },
    houseEdge: { type: Number, default: 4 } // House edge percentage
  },
  description: String,
  instructions: String
}, { timestamps: true });

module.exports = mongoose.model("Game", gameSchema);