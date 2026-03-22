const express = require("express");
const router = express.Router();
const { 
  createTenant, 
  getActiveTenants, 
  getTenantById 
} = require("../controllers/tenantController");
const { protect } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", createTenant);
router.get("/active", getActiveTenants);

// Protected routes
router.get("/:id", protect, getTenantById);

module.exports = router;