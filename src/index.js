import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./server.js";
import logger from "./utils/logger.js";

dotenv.config();

const PORT = process.env.SERVER_PORT || 5002;
const MONGO_URI = "mongodb+srv://affanshykh_db_user:A3g2bqBfkRFrNliA@affanshykh.xbbjqgg.mongodb.net/vibevault?retryWrites=true&w=majority&appName=affanshykh";
const start = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is required");
    }

    await mongoose.connect(MONGO_URI);
    logger.info("Connected to MongoDB");

    app.listen(PORT, () => {
      logger.info(`Server ready on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
