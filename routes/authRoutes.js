const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const verifyTenant = require("../middleware/tenantMiddleware");

router.post("/register", verifyTenant, registerUser);
router.post("/login", verifyTenant, loginUser);

module.exports = router;