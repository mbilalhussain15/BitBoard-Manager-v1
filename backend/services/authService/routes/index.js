import express from "express";

import authRoutes from "./authRoutes.js";


const router = express.Router();

router.use("/auth", authRoutes);
// router.use("/workspaces", workspaceRoutes);
// router.use("/projects", projectRoutes);
// router.use("/tasks", taskRoutes);
// router.use("/users", userRoutes);

export default router;