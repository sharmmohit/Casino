const mongoose = require("mongoose");

const transactionSchema = mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: {
    type: String,
    enum: ["deposit", "withdraw", "bet", "win"]
  },
  amount: Number
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);