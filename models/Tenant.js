const mongoose = require("mongoose");

const tenantSchema = mongoose.Schema({
  name: { type: String, required: true },
  domain: { type: String, required: true },
  apiKey: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Tenant", tenantSchema);