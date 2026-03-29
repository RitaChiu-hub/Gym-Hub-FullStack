const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const authRoutes    = require("./routes/auth");
const classRoutes   = require("./routes/classes");
const messageRoutes = require("./routes/messages");



const app  = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/messages", messageRoutes);


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});