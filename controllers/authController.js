const User = require("../models/User");
const Wallet = require("../models/Wallet");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

// Register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const tenantId = req.headers["x-tenant-id"];

    if (!tenantId) return res.status(400).json({ message: "Tenant ID missing" });

    const userExists = await User.findOne({ email, tenantId });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      tenantId,
      name,
      email,
      password: hashedPassword
    });

    // Auto Wallet Creation
    await Wallet.create({
      tenantId,
      userId: user._id
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id, tenantId, user.role)
    });
  } catch (err) {
    console.error("registerUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const tenantId = req.headers["x-tenant-id"];

    if (!tenantId) return res.status(400).json({ message: "Tenant ID missing" });

    const user = await User.findOne({ email, tenantId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id, tenantId, user.role)
    });
  } catch (err) {
    console.error("loginUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerUser, loginUser };