const mongoose = require("mongoose");

const tenantSchema = mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  domain: { 
    type: String, 
    required: true,
    unique: true 
  },
  apiKey: { 
    type: String 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  // Add these owner fields
  ownerName: {
    type: String,
    required: true
  },
  ownerEmail: {
    type: String,
    required: true
  },
  settings: {
    currency: { type: String, default: "USD" },
    theme: { type: String, default: "dark" },
    primaryColor: { type: String, default: "#fbbf24" }
  }
}, { timestamps: true });

module.exports = mongoose.model("Tenant", tenantSchema);