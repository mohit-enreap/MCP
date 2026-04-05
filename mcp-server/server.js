const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables FIRST
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const toolsRouter = require("./routes/tools");
const chatRouter = require("./routes/chat");    // ← ADD THIS

app.use("/tools", toolsRouter);
app.use("/chat", chatRouter);                   // ← ADD THIS

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "✅ MCP Server is running",
    port: process.env.PORT,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(process.env.PORT, () => {
  console.log(`🚀 MCP Server running on port ${process.env.PORT}`);
  console.log(`📋 Tools endpoint: http://localhost:${process.env.PORT}/tools`);
  console.log(`💬 Chat endpoint:  http://localhost:${process.env.PORT}/chat`);
  console.log(`💚 Health check:   http://localhost:${process.env.PORT}/health`);
});