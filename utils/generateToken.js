const jwt = require("jsonwebtoken");

const generateToken = (id, tenantId, role) => {
  return jwt.sign(
    { id, tenantId, role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

module.exports = generateToken;