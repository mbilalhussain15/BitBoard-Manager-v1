import express from "express";

import commentsRoutes from "./commentsRoutes.js";


const router = express.Router();

router.use("/comments", commentsRoutes);


// router.use("/users", userRoutes);

export default router;