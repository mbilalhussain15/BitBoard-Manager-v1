import express from "express";
import authMiddleware from "../middleware/auth-middleware.js";import { z } from "zod";
import { addTask, deleteTask, editTask, getTaskById, moveTaskStatus } from "../controllers/task-controller.js";



const router = express.Router();


router.post("/:boardId/add-task",authMiddleware, addTask); 
router.get('/:taskId', getTaskById);
router.put('/:taskId/update-task', editTask);
router.put("/:taskId/move-status", moveTaskStatus);
router.delete('/:taskId/delete-task', deleteTask);
export default router;









