const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./config/db");

const app = express();
const productRoutes = require("./routes/productRoutes");

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/products", productRoutes);

app.use("/api/categories", require("./routes/categoryRoutes"));

app.use("/api/auth", require("./routes/authRoutes"));

app.use("/api/cart", require("./routes/cartRoutes"));

app.use("/api/orders", require("./routes/orderRoutes"));

const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Static files
app.use("/uploads", express.static(uploadsDir));

app.get("/", (req, res) => {
    res.send("Online shoping Backend is Running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
