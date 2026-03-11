const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

const deposit = async (req, res) => {
  const { amount } = req.body;

  const wallet = await Wallet.findOne({
    userId: req.user._id,
    tenantId: req.user.tenantId,
  });

  wallet.balance += Number(amount);
  await wallet.save();

  await Transaction.create({
    tenantId: req.user.tenantId,
    userId: req.user._id,
    type: "deposit",
    amount,
  });

  res.json({ message: "Deposit successful", balance: wallet.balance });
};

const withdraw = async (req, res) => {
  const { amount } = req.body;

  const wallet = await Wallet.findOne({
    userId: req.user._id,
    tenantId: req.user.tenantId,
  });

  if (wallet.balance < amount) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  wallet.balance -= Number(amount);
  await wallet.save();

  await Transaction.create({
    tenantId: req.user.tenantId,
    userId: req.user._id,
    type: "withdraw",
    amount,
  });

  res.json({ message: "Withdraw successful", balance: wallet.balance });
};

module.exports = { deposit, withdraw };