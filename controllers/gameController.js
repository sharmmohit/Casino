const Game = require('../models/game');

// Get all games for tenant
const getGames = async (req, res) => {
  try {
    const { type, isActive, search } = req.query;
    const filter = { tenantId: req.tenantId };
    
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    
    const games = await Game.find(filter).sort({ createdAt: -1 });
    res.json(games);
  } catch (error) {
    console.error("Get games error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single game
const getGame = async (req, res) => {
  try {
    const game = await Game.findOne({ 
      _id: req.params.id, 
      tenantId: req.tenantId 
    });
    
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }
    
    res.json(game);
  } catch (error) {
    console.error("Get game error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add new game
const addGame = async (req, res) => {
  try {
    const { 
      name, type, provider, imageUrl, minBet, maxBet, 
      description, instructions, settings 
    } = req.body;
    
    // Validate required fields
    if (!name || !type || !provider) {
      return res.status(400).json({ 
        message: "Name, type, and provider are required" 
      });
    }
    
    const game = await Game.create({
      tenantId: req.tenantId,
      name,
      type,
      provider,
      imageUrl: imageUrl || `/games/${type}.jpg`,
      minBet: minBet || 1,
      maxBet: maxBet || 1000,
      description: description || `${name} - Exciting ${type} game`,
      instructions: instructions || "Place your bet and spin to win!",
      settings: settings || {
        rtp: 96,
        volatility: "medium",
        maxWin: 10000,
        houseEdge: 4
      }
    });
    
    res.status(201).json({
      success: true,
      message: "Game created successfully",
      game
    });
  } catch (error) {
    console.error("Add game error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// Update game
const updateGame = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const game = await Game.findOneAndUpdate(
      { _id: id, tenantId: req.tenantId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }
    
    res.json({
      success: true,
      message: "Game updated successfully",
      game
    });
  } catch (error) {
    console.error("Update game error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete/Disable game
const deleteGame = async (req, res) => {
  try {
    const { id } = req.params;
    
    const game = await Game.findOneAndUpdate(
      { _id: id, tenantId: req.tenantId },
      { isActive: false },
      { new: true }
    );
    
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }
    
    res.json({ 
      success: true, 
      message: "Game disabled successfully", 
      game 
    });
  } catch (error) {
    console.error("Delete game error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Toggle game status
const toggleGameStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const game = await Game.findOne({ _id: id, tenantId: req.tenantId });
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }
    
    game.isActive = !game.isActive;
    await game.save();
    
    res.json({
      success: true,
      message: `Game ${game.isActive ? 'enabled' : 'disabled'} successfully`,
      game
    });
  } catch (error) {
    console.error("Toggle game error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get game statistics
const getGameStats = async (req, res) => {
  try {
    const stats = await Game.aggregate([
      { $match: { tenantId: req.tenantId } },
      { $group: {
        _id: "$type",
        count: { $sum: 1 },
        active: { $sum: { $cond: ["$isActive", 1, 0] } }
      }}
    ]);
    
    res.json(stats);
  } catch (error) {
    console.error("Get game stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { 
  getGames, 
  getGame,
  addGame, 
  updateGame, 
  deleteGame,
  toggleGameStatus,
  getGameStats
};