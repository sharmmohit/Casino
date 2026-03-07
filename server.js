const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();          
connectDB();              

const app = express();

app.use(express.json());  

// Routes
const tenantRoutes = require("./routes/tenantRoutes");
const authRoutes = require("./routes/authRoutes");

app.use("/api/tenants", tenantRoutes);
app.use("/api/auth", authRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Multi-Tenant Casino Platform API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
