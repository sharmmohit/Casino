const express=require("express")
const app=express();
const tenantRoutes = require("./routes/tenantRoutes");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
dotenv.config();
connectDB();
app.use(express.json());
app.use("/api/tenants", tenantRoutes);
app.get("/", (req, res) => {
  res.send("Multi-Tenant Casino Platform API Running");
});
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

});