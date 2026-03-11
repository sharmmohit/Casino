const Bet = require("../models/Bet");
const Game = require("../models/Game");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

// Game outcome logic per game type
const resolveGameOutcome = (gameType, betAmount, houseEdge, gameData) => {
  const houseEdgeFactor = 1 - houseEdge / 100;

  switch (gameType) {
    case "dice": {
      // Player picks a number 1-6, win = 5x minus house edge
      const roll = Math.floor(Math.random() * 6) + 1;
      const playerPick = gameData?.pick || 1;
      const win = roll === playerPick;
      return {
        outcome: win ? "win" : "loss",
        multiplier: win ? 5 * houseEdgeFactor : 0,
        resultData: { roll, playerPick },
      };
    }

    case "roulette": {
      // Simplified: player bets on red/black (1:1 payout)
      const spin = Math.floor(Math.random() * 37); // 0-36
      const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(spin);
      const playerBet = gameData?.color || "red"; // "red" or "black"
      const win = (playerBet === "red" && isRed) || (playerBet === "black" && !isRed && spin !== 0);
      return {
        outcome: win ? "win" : "loss",
        multiplier: win ? 1.95 * houseEdgeFactor : 0, // ~1:1 with house edge
        resultData: { spin, color: isRed ? "red" : spin === 0 ? "green" : "black", playerBet },
      };
    }

    case "crash": {
      // Multiplier game - crashes at a random point
      const crashAt = Math.max(1, (Math.random() * 10 * houseEdgeFactor).toFixed(2));
      const playerCashOut = gameData?.cashOutAt || 1.5;
      const win = parseFloat(playerCashOut) <= parseFloat(crashAt);
      return {
        outcome: win ? "win" : "loss",
        multiplier: win ? parseFloat(playerCashOut) : 0,
        resultData: { crashAt: parseFloat(crashAt), playerCashOut: parseFloat(playerCashOut) },
      };
    }

    case "blackjack": {
      // Simplified: random win/loss with house edge applied
      const rand = Math.random();
      const win = rand > (0.5 + houseEdge / 200); // house has slight edge
      const push = !win && rand > (0.45 + houseEdge / 200);
      return {
        outcome: win ? "win" : push ? "draw" : "loss",
        multiplier: win ? 2 * houseEdgeFactor : push ? 1 : 0,
        resultData: { result: win ? "player wins" : push ? "push" : "dealer wins" },
      };
    }

    case "slots":
    default: {
      // Slots: weighted random with RTP = (100 - houseEdge)%
      const rand = Math.random() * 100;
      const rtp = 100 - houseEdge;
      let multiplier = 0;
      let outcome = "loss";

      if (rand < 1) { multiplier = 50; outcome = "win"; }        // 1% chance: 50x jackpot
      else if (rand < 3) { multiplier = 10; outcome = "win"; }   // 2% chance: 10x
      else if (rand < 8) { multiplier = 5; outcome = "win"; }    // 5% chance: 5x
      else if (rand < rtp) { multiplier = 2; outcome = "win"; }  // remaining RTP %: 2x

      return {
        outcome,
        multiplier,
        resultData: { symbols: generateSlotSymbols(), rtp },
      };
    }
  }
};

const generateSlotSymbols = () => {
  const symbols = ["🍒", "🍋", "🍊", "⭐", "💎", "7️⃣", "🔔"];
  return [
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];
};

// @desc    Place a bet
// @route   POST /api/bets/place
// @access  Player only
const placeBet = async (req, res) => {
  try {
    const { gameId, betAmount, gameData } = req.body;

    if (!gameId || !betAmount || isNaN(betAmount) || Number(betAmount) <= 0) {
      return res.status(400).json({ message: "gameId and valid betAmount are required" });
    }

    const game = await Game.findOne({
      _id: gameId,
      tenantId: req.user.tenantId,
      isActive: true,
    });

    if (!game) {
      return res.status(404).json({ message: "Game not found or inactive" });
    }

    const bet = Number(betAmount);

    if (bet < game.minBet || bet > game.maxBet) {
      return res.status(400).json({
        message: `Bet must be between ${game.minBet} and ${game.maxBet}`,
      });
    }

    const wallet = await Wallet.findOne({
      userId: req.user._id,
      tenantId: req.user.tenantId,
    });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (wallet.isLocked) {
      return res.status(403).json({ message: "Wallet is locked" });
    }

    if (wallet.balance < bet) {
      return res.status(400).json({
        message: "Insufficient balance",
        currentBalance: wallet.balance,
      });
    }

    // Deduct bet from wallet
    const balanceBeforeBet = wallet.balance;
    wallet.balance -= bet;
    await wallet.save();

    // Resolve game outcome
    const { outcome, multiplier, resultData } = resolveGameOutcome(
      game.type,
      bet,
      game.houseEdge,
      gameData
    );

    const winAmount = outcome === "win" ? parseFloat((bet * multiplier).toFixed(2)) :
                      outcome === "draw" ? bet : 0;

    // Create the bet record
    const betRecord = await Bet.create({
      tenantId: req.user.tenantId,
      userId: req.user._id,
      gameId: game._id,
      betAmount: bet,
      winAmount,
      outcome,
      multiplier,
      gameData: resultData,
      status: "settled",
    });

    // Record bet transaction
    await Transaction.create({
      tenantId: req.user.tenantId,
      userId: req.user._id,
      type: "bet",
      amount: bet,
      balanceBefore: balanceBeforeBet,
      balanceAfter: wallet.balance,
      gameId: game._id,
      betId: betRecord._id,
      status: "completed",
      description: `Bet on ${game.name}`,
    });

    // If win or draw, credit the winnings
    if (winAmount > 0) {
      const balanceBeforeWin = wallet.balance;
      wallet.balance += winAmount;
      await wallet.save();

      await Transaction.create({
        tenantId: req.user.tenantId,
        userId: req.user._id,
        type: "win",
        amount: winAmount,
        balanceBefore: balanceBeforeWin,
        balanceAfter: wallet.balance,
        gameId: game._id,
        betId: betRecord._id,
        status: "completed",
        description: `Win on ${game.name}`,
      });
    }

    res.json({
      betId: betRecord._id,
      game: game.name,
      gameType: game.type,
      betAmount: bet,
      outcome,
      multiplier,
      winAmount,
      resultData,
      newBalance: wallet.balance,
    });
  } catch (err) {
    console.error("placeBet error:", err);
    res.status(500).json({ message: "Server error placing bet" });
  }
};

// @desc    Get bet history for current user
// @route   GET /api/bets/my-history
// @access  Private
const getMyBetHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, gameId, outcome } = req.query;

    const query = {
      userId: req.user._id,
      tenantId: req.user.tenantId,
    };

    if (gameId) query.gameId = gameId;
    if (outcome) query.outcome = outcome;

    const bets = await Bet.find(query)
      .populate("gameId", "name type")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Bet.countDocuments(query);

    // Aggregate stats
    const stats = await Bet.aggregate([
      { $match: { userId: req.user._id, tenantId: req.user.tenantId } },
      {
        $group: {
          _id: null,
          totalBets: { $sum: 1 },
          totalWagered: { $sum: "$betAmount" },
          totalWon: { $sum: "$winAmount" },
          wins: { $sum: { $cond: [{ $eq: ["$outcome", "win"] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ["$outcome", "loss"] }, 1, 0] } },
        },
      },
    ]);

    res.json({
      bets,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      total,
      stats: stats[0] || {},
    });
  } catch (err) {
    console.error("getMyBetHistory error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Admin: Get all bets for this tenant
// @route   GET /api/bets/admin/all
// @access  TenantAdmin only
const getAllBetsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 50, gameId, userId, outcome } = req.query;

    const query = { tenantId: req.user.tenantId };
    if (gameId) query.gameId = gameId;
    if (userId) query.userId = userId;
    if (outcome) query.outcome = outcome;

    const bets = await Bet.find(query)
      .populate("userId", "name email")
      .populate("gameId", "name type")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Bet.countDocuments(query);

    // Revenue stats
    const stats = await Bet.aggregate([
      { $match: { tenantId: req.user.tenantId } },
      {
        $group: {
          _id: null,
          totalBets: { $sum: 1 },
          totalWagered: { $sum: "$betAmount" },
          totalPaidOut: { $sum: "$winAmount" },
          grossRevenue: { $sum: { $subtract: ["$betAmount", "$winAmount"] } },
        },
      },
    ]);

    res.json({
      bets,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      total,
      stats: stats[0] || {},
    });
  } catch (err) {
    console.error("getAllBetsAdmin error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { placeBet, getMyBetHistory, getAllBetsAdmin };