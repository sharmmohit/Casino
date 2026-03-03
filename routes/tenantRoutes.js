const express = require("express");
const router = express.Router();
const { createTenant } = require("../controllers/tenantController");

router.post("/", createTenant);

module.exports = router;