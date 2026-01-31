import mongoose from "mongoose";
import Comments from "../models/commentModel.js";

export async function createComment(req, res) {
  try {
    const { taskId } = req.params;
    const { text, userId, mentions = [], attachments = [] } = req.body;

    if (!text?.trim()) return res.status(400).json({ message: "text required" });
    if (!userId) return res.status(400).json({ message: "userId required" });

    // Create new comment instance
    const comment = new Comments({
      text: text.trim(),
      taskId: String(taskId),
      userId: String(userId),
      mentions: mentions.map(m => ({
        user: String(m.user || m.userId),
        offset: Number(m.offset ?? 0),
        length: Number(m.length ?? 0),
      })),
      attachments,
      parentId: null,
    });

    await comment.save(); // ✅ explicitly save (production best practice)
    return res.status(201).json(comment);
  } catch (err) {
    console.error("Error creating comment:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ✅ Create a reply under a comment
export async function reply(req, res) {
  try {
    const { commentId } = req.params;
    const { text, task, userId, mentions = [], attachments = [] } = req.body;

    if (!text?.trim()) return res.status(400).json({ message: "text required" });
    if (!task || !userId) return res.status(400).json({ message: "task and userId required" });

    const parent = await Comments.findById(commentId);
    if (!parent) return res.status(404).json({ message: "Parent comment not found" });

    const reply = new Comments({
      text: text.trim(),
      taskId: String(task),
      userId: String(userId),
      mentions: mentions.map(m => ({
        user: String(m.user || m.userId),
        offset: Number(m.offset ?? 0),
        length: Number(m.length ?? 0),
      })),
      attachments,
      parentId: String(commentId),
    });

    await reply.save(); // ✅ safe save
    return res.status(201).json(reply);
  } catch (err) {
    console.error("Error creating reply:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ✅ Update comment text
export async function update(req, res) {
  try {
    const { commentId } = req.params;
    const { text, mentions = [] } = req.body;

    if (!text?.trim()) return res.status(400).json({ message: "text required" });

    const doc = await Comments.findById(commentId);
    if (!doc) return res.status(404).json({ message: "Comment not found" });

    doc.text = text.trim();
    doc.mentions = mentions.map(m => ({
      user: String(m.user || m.userId),
      offset: Number(m.offset ?? 0),
      length: Number(m.length ?? 0),
    }));
    doc.isEdited = true;
    doc.updatedAt = new Date();

    await doc.save();
    return res.json(doc);
  } catch (err) {
    console.error("Error updating comment:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ✅ Soft delete comment
export async function remove(req, res) {
  try {
    const { commentId } = req.params;


// Delete all replies of this comment
    await Comments.deleteMany({ parentId: String(commentId) });

    // Delete the comment itself
    await Comments.findByIdAndDelete(commentId);


    return res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting comment:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ✅ List top-level comments for a task (paginated)
export async function listByTask(req, res) {
  try {
    const { taskId } = req.params;
    const { limit = 20, after } = req.query;

    const query = { taskId: String(taskId), parentId: null, isDeleted: { $ne: true } };
    if (after && mongoose.isValidObjectId(after)) query._id = { $lt: after };

    const comments = await Comments.find(query)
      .sort({ _id: -1 })
      .limit(Number(limit))
      .lean();

    return res.json(comments);
  } catch (err) {
    console.error("Error listing comments:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ✅ List replies for a comment
export async function listCommentReplies(req, res) {
  try {
    const { commentId } = req.params;
    const { limit = 20, after } = req.query;

    const query = { parentId: String(commentId), isDeleted: { $ne: true } };
    if (after && mongoose.isValidObjectId(after)) query._id = { $lt: after };

    const replies = await Comments.find(query)
      .sort({ _id: -1 })
      .limit(Number(limit))
      .lean();

    return res.json(replies);
  } catch (err) {
    console.error("Error listing replies:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ✅ Add or change a reaction
export async function react(req, res) {
  try {
    const { commentId } = req.params;
    const { emoji, userId } = req.body;

    console.log("emoji:", emoji, "userId:", userId);

    if (!emoji || !userId) {
      return res.status(400).json({ message: "emoji and userId required" });
    }

    const comment = await Comments.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Remove any existing reaction by the same user (only one allowed)
    comment.reactions = comment.reactions.filter(
      (r) => String(r.user) !== String(userId) && String(r.userId) !== String(userId)
    );

    // Add the new reaction
    comment.reactions.push({ emoji, user: String(userId) });

    await comment.save();
    return res.json(comment);
  } catch (err) {
    console.error("❌ Error adding reaction:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function unreact(req, res) {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ message: "userId required" });

    const comment = await Comments.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Remove the reaction from this user
    comment.reactions = comment.reactions.filter(
      (r) => String(r.user) !== String(userId) && String(r.userId) !== String(userId)
    );

    await comment.save();
    return res.json(comment);
  } catch (err) {
    console.error("❌ Error removing reaction:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}






















// // ✅ Add a reaction
// export async function react(req, res) {
//   try {
//     const { commentId } = req.params;
//     const { emoji, user } = req.body;

//     if (!emoji || !user) return res.status(400).json({ message: "emoji and user required" });

//     const doc = await Comments.findById(commentId);
//     if (!doc) return res.status(404).json({ message: "Comment not found" });

//     // Prevent duplicate reaction from same user
//     const exists = doc.reactions.some(
//       (r) => r.emoji === emoji && String(r.userId) === String(user)
//     );
//     if (!exists) doc.reactions.push({ emoji, userId: String(user) });

//     await doc.save();
//     return res.json(doc);
//   } catch (err) {
//     console.error("Error adding reaction:", err);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// }

// // ✅ Remove a reaction
// export async function unreact(req, res) {
//   try {
//     const { commentId } = req.params;
//     const { emoji, user } = req.body;

//     if (!emoji || !user) return res.status(400).json({ message: "emoji and user required" });

//     const doc = await Comments.findById(commentId);
//     if (!doc) return res.status(404).json({ message: "Comment not found" });

//     doc.reactions = doc.reactions.filter(
//       (r) => !(r.emoji === emoji && String(r.userId) === String(user))
//     );

//     await doc.save();
//     return res.json(doc);
//   } catch (err) {
//     console.error("Error removing reaction:", err);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// }
