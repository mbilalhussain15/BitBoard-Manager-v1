import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    taskId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    parentId: { type: String, default: null, index: true },

    mentions: [
      {
        user: { type: String }, 
        offset: { type: Number },
        length: { type: Number }
      }
    ],
    reactions: [
      {
        emoji: { type: String },
        user: { type: String } 
      }
    ],
    attachments: [
      {
        fileName: { type: String },
        fileUrl: { type: String },
        fileType: { type: String },
        fileSize: { type: Number }
      }
    ],

    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true}
);

commentSchema.index({ tenantId: 1, taskId: 1, parentId: 1, createdAt: -1, _id: -1 });
commentSchema.index({ tenantId: 1, parentId: 1, createdAt: 1, _id: 1 });
commentSchema.index({ tenantId: 1, path: 1 });
commentSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });




export default mongoose.model("Comments", commentSchema);
