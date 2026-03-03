const mongoose = require("mongoose");

const gameSchema = mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
  name: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Game", gameSchema);