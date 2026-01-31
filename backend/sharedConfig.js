// backend/sharedConfig.js
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import fs from 'fs';
// Load environment variables
// dotenv.config({ path: path.resolve('./env') });

// dotenv.config({ 
//   path: path.resolve(process.cwd(), '../../.env') 
// });
dotenv.config({ 
  path: path.resolve("../../.env") 
});

export const setupServer = () => {
  const app = express();
  
  // Common middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }));
  app.use(morgan('dev'));
  app.use(express.json());
  
  return app;
};

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ DB Connected successfully");
  } catch (err) {
    console.log("❌ DB Connection failed:", err);
    throw err;
  }
};

// mongoose.connection.on("connected", () => {
//   console.log("Mongo connected to", mongoose.connection.name);
//   console.log("Models loaded:", mongoose.modelNames());
// });

export const commonMiddleware = (app) => {
  // Error handling
  app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).json({ message: "Internal server error" });
  });
  
  // Not found
  app.use((req, res) => {
    res.status(404).json({ message: "Not found" });
  });
};