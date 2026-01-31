import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import mime from "mime";
import { fileURLToPath } from "url";
import { ProjectBoards } from "../models/boardModel.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// uploads ka absolute root yahi rakho
// result path: workspaceService/uploads/workspace/<workspaceId>/project/<projectId>/board/<boardId>/task/<taskId>/<file>
const UPLOAD_ROOT =
  process.env.TASKFILE_UPLOAD_ROOT ||
  path.join(__dirname, "..", "uploads", "workspace");

function taskDir({ workspaceId, projectId, boardId, taskId }) {
  return path.join(
    UPLOAD_ROOT,
    String(workspaceId),
    "project",
    String(projectId),
    "board",
    String(boardId),
    "task",
    String(taskId)
  );
}
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const { workspaceId, projectId, boardId, taskId } = req.params;
    const dir = taskDir({ workspaceId, projectId, boardId, taskId });
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const ext = path.extname(file.originalname || "");
    const base = path.basename(file.originalname || "file", ext);
    cb(null, `${ts}_${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

// bulk upload
router.post(
  "/workspaces/:workspaceId/projects/:projectId/boards/:boardId/tasks/:taskId/files/bulk",
  upload.array("files", 50),
  (req, res) => {
    const { workspaceId, projectId, boardId, taskId } = req.params;
    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) return res.status(400).json({ error: "No files uploaded" });

    const base = `${req.protocol}://${req.get("host")}`;
    const list = files.map((f) => ({
      fileName: f.filename,
      fileType: f.mimetype,
      fileSize: f.size,
      fileUrl: `${base}/api-v1/taskFile/files/workspace/${workspaceId}/project/${projectId}/board/${boardId}/task/${taskId}/${encodeURIComponent(
        f.filename
      )}`,
    }));
    res.json({ files: list, taskId });
  }
);

// list files for a task
router.get(
  "/workspaces/:workspaceId/projects/:projectId/boards/:boardId/tasks/:taskId/files",
  (req, res) => {
    const { workspaceId, projectId, boardId, taskId } = req.params;
    const dir = taskDir({ workspaceId, projectId, boardId, taskId });
    fs.readdir(dir, (err, names) => {
      if (err) {
        if (err.code === "ENOENT") return res.json([]);
        return res.status(500).json({ error: "Unable to read directory" });
      }
      const base = `${req.protocol}://${req.get("host")}`;
      const out = names.map((name) => ({
        fileName: name,
        fileType: mime.getType(path.join(dir, name)) || "application/octet-stream",
        fileUrl: `${base}/api-v1/taskFile/files/workspace/${workspaceId}/project/${projectId}/board/${boardId}/task/${taskId}/${encodeURIComponent(
          name
        )}`,
      }));
      res.json(out);
    });
  }
);

// serve one file
router.get(
  "/files/workspace/:workspaceId/project/:projectId/board/:boardId/task/:taskId/:filename",
  (req, res) => {
    const { workspaceId, projectId, boardId, taskId, filename } = req.params;
    const p = path.join(taskDir({ workspaceId, projectId, boardId, taskId }), filename);
    fs.stat(p, (err, st) => {
      if (err || !st?.isFile()) return res.status(404).json({ error: "File not found" });
      res.sendFile(p);
    });
  }
);

// delete one file
router.delete(
  "/files/workspace/:workspaceId/project/:projectId/board/:boardId/task/:taskId/:filename",
  (req, res) => {
    const { workspaceId, projectId, boardId, taskId, filename } = req.params;
    const p = path.join(taskDir({ workspaceId, projectId, boardId, taskId }), filename);
    fs.unlink(p, (err) => {
      if (err) return res.status(404).json({ error: "File not found" });
      res.json({ success: true, taskId, fileName: filename });
    });
  }
);

// replace attachments in DB and cleanup disk
router.put(
  "/workspaces/:workspaceId/projects/:projectId/boards/:boardId/tasks/:taskId/files",
  async (req, res) => {
    const { workspaceId, projectId, boardId, taskId } = req.params;
    const { fileUrls } = req.body;

    try {
      const doc = await ProjectBoards.findOne({ "boards.columns.tasks._id": taskId });
      if (!doc) return res.status(404).json({ error: "Task not found" });

      let taskRef = null;
      outer: for (const b of doc.boards) {
        for (const c of b.columns) {
          for (const t of c.tasks) {
            if (String(t._id) === String(taskId)) {
              taskRef = t;
              break outer;
            }
          }
        }
      }
      if (!taskRef) return res.status(404).json({ error: "Task not found" });

      const oldFiles = Array.isArray(taskRef.attachments) ? taskRef.attachments : [];
      const newFiles = Array.isArray(fileUrls) ? fileUrls : [];
      const newSet = new Set(newFiles.map((f) => String(f.fileName)));
      const toDelete = oldFiles.filter((f) => !newSet.has(String(f.fileName)));

      const dir = taskDir({ workspaceId, projectId, boardId, taskId });
      await Promise.allSettled(
        toDelete.map((f) => fs.promises.unlink(path.join(dir, f.fileName)))
      );

      taskRef.attachments = newFiles.map((f) => ({
        fileUrl: f.fileUrl,
        fileName: f.fileName,
        fileType: f.fileType,
        fileSize: f.fileSize,
        uploadedBy: f.uploadedBy,
        uploadedAt: f.uploadedAt || new Date(),
      }));

      await doc.save();
      res.json({
        message: "Task files updated successfully",
        removed: toDelete.map((f) => f.fileName),
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update task files" });
    }
  }
);

export default router;


































// import express from "express";
// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import mime from "mime";
// import { fileURLToPath } from "url";
// import { dirname } from "path";
// import { ProjectBoards } from "../models/boardModel.js";

// const router = express.Router();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // ---------- Helpers ----------
// function taskDir({ workspaceId, projectId, boardId, taskId }) {
//   return path.join(
//     __dirname,
//     "..",
//     "uploads",
//     "workspace",
//     String(workspaceId),
//     "project",
//     String(projectId),
//     "board",
//     String(boardId),
//     "task",
//     String(taskId)
//   );
// }
// function ensureDir(dir) {
//   fs.mkdirSync(dir, { recursive: true });
// }

// // ---------- Multer storage ----------
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const { workspaceId, projectId, boardId, taskId } = req.params;
//     const dir = taskDir({ workspaceId, projectId, boardId, taskId });
//     ensureDir(dir);
//     cb(null, dir);
//   },
//   filename: (_req, file, cb) => {
//     const ts = Date.now();
//     const ext = path.extname(file.originalname);
//     const name = path.basename(file.originalname, ext);
//     cb(null, `${ts}_${name}${ext}`);
//   },
// });
// const upload = multer({
//   storage,
//   limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
// });

// // Serve static
// router.use(express.static(path.join(__dirname, "..", "uploads")));

// // ---------- BULK UPLOAD ----------
// /**
//  * POST /api-v1/taskFile/workspaces/:workspaceId/projects/:projectId/boards/:boardId/tasks/:taskId/files/bulk
//  * Field: files (multiple)
//  */
// router.post(
//   "/workspaces/:workspaceId/projects/:projectId/boards/:boardId/tasks/:taskId/files/bulk",
//   upload.array("files", 50),
//   (req, res) => {
//     const files = req.files || [];
//     if (!files.length) return res.status(400).json({ error: "No files uploaded" });
//     const saved = files.map((f) => ({
//       originalname: f.originalname,
//       filename: f.filename,
//       mimetype: f.mimetype,
//       size: f.size,
//     }));
//     res.status(200).json({ files: saved });
//   }
// );

// // ---------- LIST ----------
// /**
//  * GET /api-v1/taskFile/workspaces/:workspaceId/projects/:projectId/boards/:boardId/tasks/:taskId/files
//  */
// router.get(
//   "/workspaces/:workspaceId/projects/:projectId/boards/:boardId/tasks/:taskId/files",
//   (req, res) => {
//     const { workspaceId, projectId, boardId, taskId } = req.params;
//     const dir = taskDir({ workspaceId, projectId, boardId, taskId });
//     fs.readdir(dir, (err, list) => {
//       if (err) {
//         if (err.code === "ENOENT") return res.json([]);
//         return res.status(500).json({ error: "Unable to read directory" });
//       }
//       const base = `${req.protocol}://${req.get("host")}`;
//       const out = list.map((file) => {
//         const t = mime.getType(path.join(dir, file)) || "application/octet-stream";
//         return {
//           fileName: file,
//           fileUrl: `${base}/api-v1/taskFile/files/workspace/${workspaceId}/project/${projectId}/board/${boardId}/task/${taskId}/${encodeURIComponent(
//             file
//           )}`,
//           fileType: t,
//         };
//       });
//       res.json(out);
//     });
//   }
// );

// // ---------- SERVE ONE ----------
// /**
//  * GET /api-v1/taskFile/files/workspace/:workspaceId/project/:projectId/board/:boardId/task/:taskId/:filename
//  */
// router.get(
//   "/files/workspace/:workspaceId/project/:projectId/board/:boardId/task/:taskId/:filename",
//   (req, res) => {
//     const { workspaceId, projectId, boardId, taskId, filename } = req.params;
//     const p = path.join(taskDir({ workspaceId, projectId, boardId, taskId }), filename);
//     fs.stat(p, (err) => {
//       if (err) return res.status(404).json({ error: "File not found" });
//       res.sendFile(p);
//     });
//   }
// );

// // ---------- DELETE ----------
// /**
//  * DELETE /api-v1/taskFile/files/workspace/:workspaceId/project/:projectId/board/:boardId/task/:taskId/:filename
//  */
// router.delete(
//   "/files/workspace/:workspaceId/project/:projectId/board/:boardId/task/:taskId/:filename",
//   (req, res) => {
//     const { workspaceId, projectId, boardId, taskId, filename } = req.params;
//     const p = path.join(taskDir({ workspaceId, projectId, boardId, taskId }), filename);
//     fs.unlink(p, (err) => {
//       if (err) return res.status(404).json({ error: "File not found" });
//       res.json({ success: true });
//     });
//   }
// );

// // ---------- UPDATE attachments in DB (same as before) ----------
// /**
//  * PUT /api-v1/taskFile/workspaces/:workspaceId/projects/:projectId/boards/:boardId/tasks/:taskId/files
//  * body: { fileUrls: [...] }
//  */
// router.put(
//   "/workspaces/:workspaceId/projects/:projectId/boards/:boardId/tasks/:taskId/files",
//   async (req, res) => {
//     const { taskId } = req.params;
//     const { fileUrls } = req.body;
//     try {
//       const doc = await ProjectBoards.findOne({ "boards.columns.tasks._id": taskId });
//       if (!doc) return res.status(404).json({ error: "Task not found" });

//       let taskRef = null;
//       outer: for (const b of doc.boards) {
//         for (const c of b.columns) {
//           for (const t of c.tasks) {
//             if (String(t._id) === String(taskId)) { taskRef = t; break outer; }
//           }
//         }
//       }
//       if (!taskRef) return res.status(404).json({ error: "Task not found" });

//       taskRef.attachments = (fileUrls || []).map((f) => ({
//         fileUrl: f.fileUrl,
//         fileName: f.fileName,
//         fileType: f.fileType,
//         fileSize: f.fileSize,
//         uploadedBy: f.uploadedBy,
//         uploadedAt: f.uploadedAt || new Date(),
//       }));

//       await doc.save();
//       res.json({ message: "Task files updated successfully" });
//     } catch (e) {
//       console.error(e);
//       res.status(500).json({ error: "Failed to update task files" });
//     }
//   }
// );

// export default router;































// import express from 'express';
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import mime from 'mime';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';
// import { ProjectBoards } from '../models/boardModel.js';

// const router = express.Router();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // storage: uploads/<taskId> me save
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const { taskId } = req.params;
//     const dir = path.join(__dirname, '..', 'uploads', taskId);
//     fs.mkdirSync(dir, { recursive: true });
//     cb(null, dir);
//   },
//   filename: (_req, file, cb) => {
//     const ts = Date.now();
//     const ext = path.extname(file.originalname);
//     const name = path.basename(file.originalname, ext);
//     cb(null, `${ts}_${name}${ext}`);
//   },
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
// });

// // serve static files from uploads
// router.use(express.static(path.join(__dirname, '..', 'uploads')));

// // single upload (keep for older callers)
// router.post('/tasks/:taskId/files/upload', upload.single('file'), (req, res) => {
//   const { taskId } = req.params;
//   const f = req.file;
//   if (!f) return res.status(400).json({ error: 'No file uploaded' });

//   return res.status(200).json({
//     file: {
//       originalname: f.originalname,
//       filename: f.filename,
//       mimetype: f.mimetype,
//       size: f.size,
//     },
//   });
// });

// // bulk upload — the important new route
// router.post('/tasks/:taskId/files/bulk', upload.array('files', 30), (req, res) => {
//   const { taskId } = req.params;
//   const files = req.files || [];
//   if (!files.length) return res.status(400).json({ error: 'No files uploaded' });

//   const saved = files.map((f) => ({
//     originalname: f.originalname,
//     filename: f.filename,
//     mimetype: f.mimetype,
//     size: f.size,
//   }));

//   return res.status(200).json({ files: saved });
// });

// // return list of hosted urls
// router.get('/tasks/:taskId/files', (req, res) => {
//   const { taskId } = req.params;
//   const dir = path.join(__dirname, '..', 'uploads', taskId);

//   fs.readdir(dir, (err, list) => {
//     if (err) {
//       if (err.code === 'ENOENT') return res.status(404).json({ error: 'Task not found' });
//       return res.status(500).json({ error: 'Unable to scan directory' });
//     }
//     const base = `${req.protocol}://${req.get('host')}`;
//     const out = list.map((file) => {
//       const t = mime.getType(path.join(dir, file)) || 'application/octet-stream';
//       return {
//         fileName: file,
//         fileUrl: `${base}/api-v1/taskFile/tasks/files/${taskId}/${encodeURIComponent(file)}`,
//         fileType: t,
//       };
//     });
//     res.json(out);
//   });
// });

// // serve one file
// router.get('/tasks/files/:taskId/:filename', (req, res) => {
//   const { taskId, filename } = req.params;
//   const p = path.join(__dirname, '..', 'uploads', taskId, filename);
//   fs.stat(p, (err) => {
//     if (err) return res.status(404).json({ error: 'File not found' });
//     res.sendFile(p);
//   });
// });

// // replace task.attachments with client provided urls
// router.put('/tasks/:taskId/files', async (req, res) => {
//   const { taskId } = req.params;
//   const { fileUrls } = req.body;

//   try {
//     const doc = await ProjectBoards.findOne({ 'boards.columns.tasks._id': taskId });
//     if (!doc) return res.status(404).json({ error: 'Task not found' });

//     let taskRef = null;
//     outer: for (const b of doc.boards) {
//       for (const c of b.columns) {
//         for (const t of c.tasks) {
//           if (String(t._id) === String(taskId)) { taskRef = t; break outer; }
//         }
//       }
//     }
//     if (!taskRef) return res.status(404).json({ error: 'Task not found' });

//     taskRef.attachments = (fileUrls || []).map(f => ({
//       fileUrl: f.fileUrl,
//       fileName: f.fileName,
//       fileType: f.fileType,
//       fileSize: f.fileSize,
//       uploadedBy: f.uploadedBy,
//       uploadedAt: f.uploadedAt || new Date(),
//     }));

//     await doc.save();
//     res.json({ message: 'Task files updated successfully' });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ error: 'Failed to update task files' });
//   }
// });

// // delete one file
// router.delete('/tasks/files/:taskId/:filename', (req, res) => {
//   const { taskId, filename } = req.params;
//   const p = path.join(__dirname, '..', 'uploads', taskId, filename);
//   fs.unlink(p, (err) => {
//     if (err) return res.status(404).json({ error: 'File not found' });
//     res.json({ success: true });
//   });
// });

// export default router;
