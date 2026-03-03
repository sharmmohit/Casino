const mongoose = require("mongoose");

const walletSchema = mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  balance: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("Wallet", walletSchema);