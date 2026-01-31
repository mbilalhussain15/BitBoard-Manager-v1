import express from "express";

import workspaceRoutes from "./workspaceRoutes.js";
import projectRoutes from "./projectRoutes.js";
import boardRoutes from "./boardRoutes.js";
import taskRoutes from "./taskRoutes.js";
// import userRoutes from "./userRoutes.js";
import taskFileRoutes from "./taskFileRoutes.js";

const router = express.Router();

router.use("/workspaces", workspaceRoutes);
// router.use("/workspaces", workspaceRoutes);
router.use("/projects", projectRoutes);
router.use("/boards", boardRoutes);
router.use("/tasks", taskRoutes);
router.use("/taskFile", taskFileRoutes);

// router.use("/users", userRoutes);

export default router;