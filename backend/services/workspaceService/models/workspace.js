import mongoose, { Schema } from "mongoose";

const workspaceModel = new Schema(
  {
    WorkspaceName: {
      type: String,
      required: true,
      trim: true,
    },
    WorkspaceDescription: { type: String, trim: true },
    WorkspaceColor: { type: String, default: "#FF5733" },
    owner: { type: Schema.Types.ObjectId, ref: "UserView", required: true },
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: "UserView" },
        userId: { type: Schema.Types.ObjectId },
        role: {
          type: String,
          enum: ["owner", "member", "admin", "viewer"],
          default: "member",
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    projects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
  },
  { timestamps: true }
);

const Workspace = mongoose.model("Workspace", workspaceModel);

export default Workspace;
