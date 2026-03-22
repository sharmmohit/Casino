const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Tenant = require("../models/Tenant");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id, tenantId, role) => {
  return jwt.sign(
    { id, tenantId, role },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// Register user under a tenant
const registerUser = async (req, res) => {
  try {
    const { name, email, password, tenantId } = req.body;

    console.log("User registration:", { email, tenantId });

    if (!tenantId) {
      return res.status(400).json({ 
        message: "Please select a casino" 
      });
    }

    // Verify tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant || !tenant.isActive) {
      return res.status(404).json({ 
        message: "Casino not found or inactive" 
      });
    }

    // Check if user exists in this tenant
    const userExists = await User.findOne({ email, tenantId });
    if (userExists) {
      return res.status(400).json({ 
        message: "User already registered with this casino" 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      tenantId,
      name,
      email,
      password: hashedPassword,
      role: "player"
    });

    // Create wallet for user
    await Wallet.create({
      tenantId,
      userId: user._id,
      balance: 0,
      currency: "USD"
    });

    // Generate token
    const token = generateToken(user._id, tenantId, user.role);

    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: tenantId,
      tenantName: tenant.name,
      token: token
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password, tenantId } = req.body;

    console.log("Login attempt:", { email, tenantId });

    if (!tenantId) {
      return res.status(400).json({ 
        message: "Please select your casino" 
      });
    }

    // Verify tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ 
        message: "Casino not found" 
      });
    }

    // Find user in this tenant
    const user = await User.findOne({ email, tenantId });
    if (!user) {
      return res.status(404).json({ 
        message: "User not found in this casino" 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate token
    const token = generateToken(user._id, tenantId, user.role);

    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: tenantId,
      tenantName: tenant.name,
      token: token
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerUser, loginUser };