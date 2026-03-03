const Tenant = require("../models/Tenant");
const crypto = require("crypto");

const createTenant = async (req, res) => {
  const { name, domain } = req.body;

  const apiKey = crypto.randomBytes(16).toString("hex");

  const tenant = await Tenant.create({
    name,
    domain,
    apiKey
  });

  res.status(201).json(tenant);
};

module.exports = { createTenant };