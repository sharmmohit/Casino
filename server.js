const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors"); // Add this line

dotenv.config();          
connectDB();              

const app = express();

// Add CORS middleware - place this BEFORE your routes
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Your frontend URLs
  credentials: true, // Allow cookies if needed
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id']
}));

app.use(express.json());  

// Routes
const tenantRoutes = require("./routes/tenantRoutes");
const authRoutes = require("./routes/authRoutes");
const walletRoutes = require("./routes/walletRoutes");

app.use("/api/wallet", walletRoutes);
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