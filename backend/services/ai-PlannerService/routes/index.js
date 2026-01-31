import express from "express";

import plannerRoutes from "./plannerRoutes.js";
import taskAgentRoutes from "./taskAgentRoutes.js";

const router = express.Router();

export function makeHttp(app) {
  app.get('/health', (req, res) => res.json({ message: "Ai Planner Service is Running" }))

  app.use('/plan', plannerRoutes)
  app.use('/task-agent', taskAgentRoutes)
}

export default router;