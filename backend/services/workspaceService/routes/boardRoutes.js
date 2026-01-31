import express from "express";

import { createBoard, deleteBoard, editBoard, getBoardById, updateBoardColumns } from "../controllers/boardsController.js";
import authMiddleware from "../middleware/auth-middleware.js";

const router = express.Router();

router.post("/:projectId/create-board", authMiddleware, createBoard);

router.put("/:boardId/update-board", authMiddleware, editBoard);

router.put("/:boardId/update-columns", authMiddleware, updateBoardColumns);


router.delete("/:boardId/delete-board", authMiddleware, deleteBoard);

router.get("/:boardId", authMiddleware, getBoardById);

export default router;





