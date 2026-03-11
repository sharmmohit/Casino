const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { deposit, withdraw } = require("../controllers/walletController");

router.post("/deposit", protect, deposit);
router.post("/withdraw", protect, withdraw);

module.exports = router;