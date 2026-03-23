const express = require("express");
const router = express.Router();
const { 
  getGames, 
  getGame,
  addGame, 
  updateGame, 
  deleteGame,
  toggleGameStatus,
  getGameStats 
} = require("../controllers/gameController");
const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// Game management routes
router.get("/", getGames);
router.get("/stats", getGameStats);
router.get("/:id", getGame);
router.post("/", addGame);
router.put("/:id", updateGame);
router.patch("/:id/toggle", toggleGameStatus);
router.delete("/:id", deleteGame);

module.exports = router;