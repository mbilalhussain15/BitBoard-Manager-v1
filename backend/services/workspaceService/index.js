// backend/services/authService/index.js
import { setupServer, connectDB, commonMiddleware } from '../../sharedConfig.js';
import routes from './routes/index.js';
import { startUserViewConsumer } from "./rabbitmq/userView.consumer.js";
import { startProjectConsumer } from './rabbitmq/projectConsumer.js'
import { startBoardConsumer } from './rabbitmq/boardConsumer.js'
import { startTaskConsumer } from './rabbitmq/taskConsumer.js'
import { startTaskAgentConsumer } from './rabbitmq/taskAgentConsumer.js';

const app = setupServer();

// koi extra static /uploads serve ki zaroorat nahi
// files serve hone ka route taskFileRoutes ke GET se hi hoga

const AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672'
const COMMANDS_EX = process.env.COMMANDS_EX || 'bitboard.commands'
const EVENTS_EX   = process.env.EVENTS_EX   || 'bitboard.events'

connectDB().catch(err => {
  console.error("DB Connection Error:", err);
  process.exit(1);
});

await startUserViewConsumer().catch((err) => console.error("RMQ consumer error:", err));
async function startConsumers() {
  await startProjectConsumer(AMQP_URL, COMMANDS_EX, EVENTS_EX)
  await startBoardConsumer(AMQP_URL, COMMANDS_EX, EVENTS_EX)
  await startTaskConsumer(AMQP_URL, COMMANDS_EX, EVENTS_EX)
  await startTaskAgentConsumer()
}

startConsumers().catch(err => {
  console.error('Failed to start consumers', err)
  process.exit(1)
})

app.use("/api-v1", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});

app.get('/', (req, res) => {
  res.json({ message: "Kanban Service is Running" });
});

app.use('/api-v1', routes);

commonMiddleware(app);

const PORT = process.env.PORT_WORKSPACE_SERVICE || 5002;
app.listen(PORT, () => console.log(`Workspace Service on ${PORT}`));




















// // backend/services/authService/index.js
// import { setupServer, connectDB, commonMiddleware } from '../../sharedConfig.js';
// // import { setupServer, connectDB, commonMiddleware } from './sharedConfig.js';

// import routes from './routes/index.js';
// import { startUserViewConsumer } from "./rabbitmq/userView.consumer.js";

// // Initialize
// const app = setupServer();

// // app.use('/uploads', (await import('express')).default.static(new URL('./uploads', import.meta.url).pathname));


// // Database connection
// connectDB().catch(err => {
//   console.error("DB Connection Error:", err);
//   process.exit(1); // Exit if DB connection fails
// });

// startUserViewConsumer().catch((err) => console.error("RMQ consumer error:", err));


//  app.use("/api-v1", (req, res, next) => {
//    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
//    res.set("Pragma", "no-cache");
//    res.set("Expires", "0");
//    res.set("Surrogate-Control", "no-store");
//    next();
//  });

// // Service-specific routes
// app.get('/', (req, res) => {
//   res.json({ message: "Kanban Service is Running" });
// });

// app.use('/api-v1', routes);

// // Common middleware
// commonMiddleware(app);

// // Start server
// const PORT = process.env.PORT_WORKSPACE_SERVICE || 5002;
// app.listen(PORT, () => console.log(`Workspace Service on ${PORT}`));

















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