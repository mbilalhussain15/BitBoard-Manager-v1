
import mongoose from "mongoose";
import { ProjectBoards } from "../models/boardModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// controllers/task-controller.js (addTask only)
export const addTask = async (req, res) => {
   const boardId = req.params.boardId || req.body.boardId;
    const {
      projectId,
      taskName,
      taskDescription,
      subtasks = [],
      status,
      fileUrls = [],
      assigneeIds = [],
      reporterIds = [],
      priorityLevel = "medium",
    } = req.body;

  try {
    const boardDoc = await ProjectBoards.findOne({
      projectId,
      "boards._id": boardId,
      "boards.columns.columnName": status
    });

    console.log("boardDoc=", boardDoc);

    if (!boardDoc) return res.status(404).json({ error: "Board or column not found" });

    const boardIndex = boardDoc.boards.findIndex(b => b._id.toString() === boardId);
    if (boardIndex === -1) return res.status(404).json({ error: "Board not found" });

    const columnIndex = boardDoc.boards[boardIndex].columns.findIndex(c => c.columnName === status);
    if (columnIndex === -1) return res.status(404).json({ error: "Column not found" });

    const attachments = Array.isArray(fileUrls) ? fileUrls.map(f => ({
      fileUrl: f.fileUrl,
      fileName: f.fileName,
      fileType: f.fileType,
      fileSize: f.fileSize,
      uploadedBy: f.uploadedBy || req.user?._id,
      uploadedAt: new Date()
    })) : [];

    const normalizedSubtasks = Array.isArray(subtasks) ? subtasks.map(s => ({
      subtaskName: s.subtaskName,
      subTaskDescription: s.subTaskDescription,
      isCompleted: !!s.isCompleted
    })) : [];

    const newTask = {
      taskName,
      taskDescription,
      subtasks: normalizedSubtasks,
      status,
      assignee: Array.isArray(assigneeIds) ? assigneeIds : [],
      reporter: Array.isArray(reporterIds) ? reporterIds : [],
      priorityLevel,
      attachments,
      activities: [{
        type: "created",
        activity: `Task "${taskName}" created`,
        date: new Date(),
        by: req.user?._id
      }],
      // comments: [],
      relatedTaskIDs: [],
      isTrashed: false
    };

    boardDoc.boards[boardIndex].columns[columnIndex].tasks.push(newTask);
    await boardDoc.save();

    const addedTask = boardDoc.boards[boardIndex].columns[columnIndex].tasks.slice(-1)[0];
    return res.status(200).json({ board: boardDoc, taskId: addedTask._id });
  } catch (error) {
    console.error("Error during task addition:", error);
    return res.status(400).json({ error: error.message });
  }
};


export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { projectId } = req.query; 

    // Check if taskId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    // Fetch ProjectBoards and find the task within the nested structure
    const projectBoards = await ProjectBoards.findOne({
      projectId,
      'boards.columns.tasks._id': taskId
    })
    .populate({
      path: 'boards.columns.tasks.comments',
      populate: [
        {
          path: 'author',
          select: 'name' // Adjust the fields as necessary
        },
        {
          path: 'replies',
          populate: {
            path: 'author',
            select: 'name' // Adjust the fields as necessary
          }
        }
      ]
    });

    if (!projectBoards) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Find the specific task within the nested structure
    const task = projectBoards.boards
      .flatMap(board => board.columns)
      .flatMap(column => column.tasks)
      .find(task => task._id.toString() === taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(task);
  } catch (error) {
    console.error('Error fetching task by ID:', error);
    res.status(500).json({ error: error.message });
  }
};



export const editTask = async (req, res) => {
  try {
    const taskId = req.params.taskId || req.body.taskId;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    const {
      projectId,
      taskName,
      taskDescription,
      subtasks = [],
      status,                // target columnName AND task.status
      assigneeIds = [],
      reporterIds = [],
      priorityLevel = "medium",
      fileUrls = [],         // [{ fileUrl, fileName, fileType, fileSize, uploadedBy?, uploadedAt? }]
    } = req.body;

    // parent doc nikaalo
    const boardDoc = await ProjectBoards.findOne({ projectId, "boards.columns.tasks._id": taskId });
    if (!boardDoc) return res.status(404).json({ error: "Task not found" });

    // locate nested pointers
    let boardIndex = -1, columnIndex = -1, taskIndex = -1;
    for (let bi = 0; bi < boardDoc.boards.length; bi++) {
      const b = boardDoc.boards[bi];
      for (let ci = 0; ci < b.columns.length; ci++) {
        const ti = b.columns[ci].tasks.findIndex(t => String(t._id) === String(taskId));
        if (ti !== -1) { boardIndex = bi; columnIndex = ci; taskIndex = ti; break; }
      }
      if (taskIndex !== -1) break;
    }
    if (boardIndex === -1 || columnIndex === -1 || taskIndex === -1) {
      return res.status(404).json({ error: "Task not found" });
    }

    const currentCol = boardDoc.boards[boardIndex].columns[columnIndex];
    const taskRef = currentCol.tasks[taskIndex];
    const currentStatus = currentCol.columnName;

    // core fields
    if (typeof taskName === "string") taskRef.taskName = taskName;
    if (typeof taskDescription === "string") taskRef.taskDescription = taskDescription;

    if (Array.isArray(subtasks)) {
      taskRef.subtasks = subtasks.map(s => ({
        subtaskName: s.subtaskName || "",
        subTaskDescription: s.subTaskDescription || "",
        isCompleted: !!s.isCompleted,
      }));
    }
    if (Array.isArray(assigneeIds)) taskRef.assignee = assigneeIds;
    if (Array.isArray(reporterIds)) taskRef.reporter = reporterIds;
    if (priorityLevel) taskRef.priorityLevel = priorityLevel;

    if (Array.isArray(fileUrls)) {
      taskRef.attachments = fileUrls.map(f => ({
        fileUrl: f.fileUrl,
        fileName: f.fileName,
        fileType: f.fileType,
        fileSize: f.fileSize,
        uploadedBy: f.uploadedBy,
        uploadedAt: f.uploadedAt || new Date(),
      }));
    }

    // status update + optional column move
    // 1) agar status aaya hi nahi to sirf save kar do
    // 2) agar status aaya aur wahi column hai: task ki status string ko bhi update kar do
    // 3) agar status different hai: task ko nayi column me move karo aur status ko new value set karo
    if (typeof status === "string" && status.length) {
      if (status === currentStatus) {
        // same column, just sync the field
        taskRef.status = status;
      } else {
        const newColIdx = boardDoc.boards[boardIndex].columns.findIndex(c => c.columnName === status);
        if (newColIdx === -1) {
          return res.status(404).json({ error: `Column '${status}' not found` });
        }
        const [removed] = boardDoc.boards[boardIndex].columns[columnIndex].tasks.splice(taskIndex, 1);
        removed.status = status;               // CRITICAL: sync the task's own status field
        boardDoc.boards[boardIndex].columns[newColIdx].tasks.push(removed);
      }
    }

    await boardDoc.save();
    return res.status(200).json({ ok: true, taskId });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({ error: error.message });
  }
};


// PATCH /tasks/:taskId/move-status
export async function moveTaskStatus(req, res) {
  try {
    const taskId = req.params.taskId || req.body.taskId;
    const newStatus = req.body.status;
    const { projectId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: "Invalid task ID" });
    }
    if (typeof newStatus !== "string" || !newStatus.trim()) {
      return res.status(400).json({ error: "Target status is required" });
    }

    const boardDoc = await ProjectBoards.findOne({ projectId, "boards.columns.tasks._id": taskId });
    if (!boardDoc) {
      return res.status(404).json({ error: "Task not found" });
    }

    let boardIndex = -1, fromColIdx = -1, taskIdx = -1;
    for (let bi = 0; bi < boardDoc.boards.length; bi++) {
      const b = boardDoc.boards[bi];
      for (let ci = 0; ci < b.columns.length; ci++) {
        const ti = b.columns[ci].tasks.findIndex(t => String(t._id) === String(taskId));
        if (ti !== -1) { boardIndex = bi; fromColIdx = ci; taskIdx = ti; break; }
      }
      if (taskIdx !== -1) break;
    }
    if (boardIndex === -1) {
      return res.status(404).json({ error: "Task not found" });
    }

    const boardRef = boardDoc.boards[boardIndex];
    const fromCol = boardRef.columns[fromColIdx];
    const taskRef = fromCol.tasks[taskIdx];
    const currentStatus = fromCol.columnName;

    // agar same column me move ki request hai to sirf taskRef.status sync karo
    if (newStatus === currentStatus) {
      taskRef.status = newStatus;
      await boardDoc.save({ validateBeforeSave: false });
      return res.status(200).json({
        ok: true,
        task: taskRef.toObject ? taskRef.toObject() : taskRef,
        boardId: boardRef._id,
        fromColumn: currentStatus,
        toColumn: newStatus
      });
    }

    const toColIdx = boardRef.columns.findIndex(c => c.columnName === newStatus);
    if (toColIdx === -1) {
      return res.status(404).json({ error: `Column '${newStatus}' not found` });
    }

    // remove from old, set status, push to new
    const [removed] = boardRef.columns[fromColIdx].tasks.splice(taskIdx, 1);
    removed.status = newStatus;              // sirf status update
    boardRef.columns[toColIdx].tasks.push(removed);

    // mark modified arrays to be safe on deeply nested arrays
    boardDoc.markModified(`boards.${boardIndex}.columns.${fromColIdx}.tasks`);
    boardDoc.markModified(`boards.${boardIndex}.columns.${toColIdx}.tasks`);

    await boardDoc.save({ validateBeforeSave: false });

    const updatedTask =
      boardRef.columns[toColIdx].tasks[boardRef.columns[toColIdx].tasks.length - 1];

    return res.status(200).json({
      ok: true,
      task: updatedTask.toObject ? updatedTask.toObject() : updatedTask,
      boardId: boardRef._id,
      fromColumn: currentStatus,
      toColumn: newStatus
    });
  } catch (err) {
    console.error("moveTaskStatus error:", err);
    return res.status(500).json({ error: err.message });
  }
}



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { boardId, workspaceId, projectId } = req.body || {};

    // console.log("deleteTask called with:", { taskId, boardId, workspaceId, projectId });
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    // task locate
    const boardDoc = await ProjectBoards.findOne({ projectId, "boards.columns.tasks._id": taskId });
    if (!boardDoc) return res.status(404).json({ error: "Task not found" });

    // console.log("boardDoc=", boardDoc);
    let bIdx = -1, cIdx = -1, tIdx = -1;
    for (let i = 0; i < boardDoc.boards.length; i++) {
      const b = boardDoc.boards[i];
      for (let j = 0; j < b.columns.length; j++) {
        const k = b.columns[j].tasks.findIndex(t => String(t._id) === String(taskId));
        if (k !== -1) { bIdx = i; cIdx = j; tIdx = k; break; }
      }
      if (tIdx !== -1) break;
    }
    if (tIdx === -1) return res.status(404).json({ error: "Task not found" });

    // remove from doc
    boardDoc.boards[bIdx].columns[cIdx].tasks.splice(tIdx, 1);
    await boardDoc.save();

    // delete local directory for this task (best-effort)
    if (workspaceId && projectId && (boardId || boardDoc.boards[bIdx]?._id)) {
      const finalBoardId = boardId || String(boardDoc.boards[bIdx]._id);
      const taskDir = path.resolve(
        __dirname,
        "..",
        "uploads",
        "workspace",
        String(workspaceId),
        "project",
        String(projectId),
        "board",
        String(finalBoardId),
        "task",
        String(taskId)
      );
      try {
        await fs.promises.rm(taskDir, { recursive: true, force: true });
      } catch (e) {
        // swallow error; deletion is best-effort
        console.warn("Task dir delete error:", e?.message);
      }
    }

    return res.status(200).json({ ok: true, taskId });
  } catch (err) {
    console.error("deleteTask error:", err);
    return res.status(500).json({ error: err.message });
  }
};