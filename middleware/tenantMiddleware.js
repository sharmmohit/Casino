const Tenant = require("../models/Tenant");

const verifyTenant = async (req, res, next) => {
  const tenantId = req.headers["x-tenant-id"];

  if (!tenantId) {
    return res.status(400).json({ message: "Tenant ID missing" });
  }

  const tenant = await Tenant.findById(tenantId);

  if (!tenant || !tenant.isActive) {
    return res.status(404).json({ message: "Invalid Tenant" });
  }

  req.tenant = tenant;
  next();
};

module.exports = verifyTenant;