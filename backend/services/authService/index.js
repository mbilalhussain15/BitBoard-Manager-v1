// backend/services/authService/index.js
import { setupServer, connectDB, commonMiddleware } from '../../sharedConfig.js';
// import { setupServer, connectDB, commonMiddleware } from './sharedConfig.js';
import { initRabbit } from "./libs/rabbitmq.js";
import routes from './routes/index.js';

// Initialize
const app = setupServer();

// Database connection
connectDB().catch(err => {
  console.error("DB Connection Error:", err);
  process.exit(1);
});

initRabbit().catch(err => console.error("RMQ init error:", err));

// Service-specific routes
app.get('/', (req, res) => {
  res.json({ message: "Auth Service Running" });
});

app.use('/api-v1', routes);

// Common middleware
commonMiddleware(app);

// Start server
const PORT = process.env.PORT_AUTH_SERVICE || 5001;
app.listen(PORT, () => console.log(`Auth Service on ${PORT}`));

















// import cors from "cors";
// import dotenv from "dotenv";
// import express from "express";
// import mongoose from "mongoose";
// import morgan from "morgan";
// import path from "path";
// import routes from "./routes/index.js";



// dotenv.config({ path: path.resolve("../../.env") });

// const app = express();

// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL,
//     methods: ["GET", "POST", "DELETE", "PUT"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true
//   })
// );
// app.use(morgan("dev"));

// // db connection
// mongoose
//   .connect(process.env.MONGODB_URI)
//   .then(() => console.log("BD Connected successfully."))
//   .catch((err) => console.log("Failed to connect to DB:", err));

// app.use(express.json());

// const PORT = process.env.PORT_AUTH_SERVICE || 5000;

// app.get("/", async (req, res) => {
//   res.status(200).json({
//     message: "Welcome to BitBoard API",
//   });
// });
// // http:localhost:500/api-v1/
// app.use("/api-v1", routes);
// app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
//   res.status(204).end(); // No Content
// });
// // error middleware
// app.use((err, req, res, next) => {
//   console.log(err.stack);
//   res.status(500).json({ message: "Internal server error" });
// });

// // not found middleware
// app.use((req, res) => {
//   res.status(404).json({
//     message: "Not found",
//   });
// });

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });