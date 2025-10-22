import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import spotifyRoutes from "./routes/spotify.js";
import sessionRoutes from "./routes/session.js";
import logger from "./utils/logger.js";
import mongoose from "mongoose";

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url}`);
  next();
});

app.use("/auth", authRoutes);
app.use("/api", sessionRoutes);
app.use("/api", spotifyRoutes);

app.get("/health", async (req, res) => {
  await mongoose.connect(process.env.MONGO_URI);
  res.json({
    status: "ok",
    version: 1.14,
    readyState: mongoose.connection.readyState
  });
});

export default app;
