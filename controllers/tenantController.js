const Tenant = require("../models/Tenant");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id, tenantId, role) => {
  return jwt.sign(
    { id, tenantId, role },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// Create tenant with owner account
const createTenant = async (req, res) => {
  try {
    const { name, domain, ownerName, ownerEmail, password } = req.body;
    
    console.log("Creating new tenant:", { name, domain, ownerEmail });
    
    // Check if tenant exists
    const existingTenant = await Tenant.findOne({ domain });
    if (existingTenant) {
      return res.status(400).json({ message: "Domain already exists" });
    }
    
    // Check if owner email already used
    const existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }
    
    // Generate API key
    const apiKey = crypto.randomBytes(16).toString("hex");
    
    // Create tenant
    const tenant = await Tenant.create({
      name,
      domain,
      apiKey,
      isActive: true
    });
    
    console.log("Tenant created:", tenant._id);
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create owner/admin user
    const ownerUser = await User.create({
      tenantId: tenant._id,
      name: ownerName,
      email: ownerEmail,
      password: hashedPassword,
      role: "tenantadmin"
    });
    
    console.log("Owner user created:", ownerUser._id);
    
    // Create wallet for owner
    await Wallet.create({
      tenantId: tenant._id,
      userId: ownerUser._id,
      balance: 0,
      currency: "USD"
    });
    
    // Generate token for auto-login
    const token = generateToken(ownerUser._id, tenant._id, ownerUser.role);
    
    res.status(201).json({
      success: true,
      tenant: {
        _id: tenant._id,
        name: tenant.name,
        domain: tenant.domain,
        apiKey: tenant.apiKey
      },
      user: {
        _id: ownerUser._id,
        name: ownerUser.name,
        email: ownerUser.email,
        role: ownerUser.role
      },
      token: token
    });
    
  } catch (error) {
    console.error("Create tenant error:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get all active tenants (for dropdown)
const getActiveTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({ isActive: true })
      .select("name domain");
    
    res.json(tenants);
  } catch (error) {
    console.error("Get tenants error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get tenant by ID
const getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    res.json(tenant);
  } catch (error) {
    console.error("Get tenant error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createTenant, getActiveTenants, getTenantById };