const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true
  },
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ["player", "admin"],
    default: "player"
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);