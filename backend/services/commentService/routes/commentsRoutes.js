import express from "express";

import { createComment, listByTask, listCommentReplies, react, remove, reply, unreact, update } from "../controllers/comment-controller.js";

const router = express.Router();

// top-level comments per task
router.post("/tasks/:taskId/comments", createComment);
router.get("/tasks/:taskId/comments", listByTask);


// replies
router.get("/:commentId/replies", listCommentReplies);
router.post("/:commentId/replies", reply);

// edit and delete
router.put("/:commentId", update);
router.delete("/:commentId", remove);

// reactions
router.post("/:commentId/reactions", react);
router.delete("/:commentId/reactions", unreact);


export default router;
