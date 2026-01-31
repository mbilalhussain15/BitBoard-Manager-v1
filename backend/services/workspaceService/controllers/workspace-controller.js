// controllers/workspace.js
import Project from "../models/project.js";
import Workspace from "../models/workspace.js";
import UserView from "../models/user-view.js";
import { ProjectBoards } from "../models/boardModel.js";
import authMiddleware from "../middleware/auth-middleware.js";

export const createWorkspace = async (req, res) => {
  try {
    const { WorkspaceName, WorkspaceDescription, WorkspaceColor } = req.body;
    const userId = req.user?._id;

 
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!WorkspaceName || !WorkspaceColor) {
      return res.status(400).json({ message: "Workspace name and color are required" });
    }

    const uv = await UserView.findOne({ userId: req.user._id });

    const workspace = await Workspace.create({
      WorkspaceName: WorkspaceName,
      WorkspaceDescription: WorkspaceDescription ?? "",
      WorkspaceColor: WorkspaceColor,
      owner: uv._id,
      members: [
        {
          user: uv._id,
          userId: req.user._id,
          role: "owner",
          joinedAt: new Date(),
        },
      ],
    });

    return res.status(201).json(workspace);
  } catch (error) {
    console.error(error);
    // If you want to surface validation errors precisely:
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getWorkspaces = async (req, res) => {
  try {

    const uv = await UserView.findOne({ userId: req.user._id }, { _id: 1 });
    if (!uv) {
      return res.status(404).json({ message: "Workspace user not found" });
    }

    const workspaces = await Workspace.find({
      "members.user": uv._id,
    }).sort({ createdAt: -1 });

    res.status(200).json(workspaces);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};


export const getWorkspaceDetails = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById({
      _id: workspaceId,
    }).populate("members.user", "name email profilePicture");

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    res.status(200).json(workspace);
  } catch (error) {}
};

export const getWorkspaceProjects = async (req, res) => {
  try {
    const { workspaceId } = req.params;

      //  console.log("authMiddleware userId:", authMiddleware);

    const uv = await UserView.findOne({ userId: req.user._id }, { _id: 1 });
    if (!uv) {
      return res.status(404).json({ message: "Workspace user not found" });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": uv._id,
    }).populate("members.user", "name email profilePicture");

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const projects = await Project.find({
      workspace: workspaceId,
      isArchived: false,
      members: { $elemMatch: { user: uv._id } },
    })
      .sort({ createdAt: -1 });

       // CHANGED: Pull all boards for these projects and attach
    const projectIds = projects.map((p) => p._id);
    const boardsDocs = await ProjectBoards.find(
      { projectId: { $in: projectIds } },
      { projectId: 1, boards: 1 }
    );

    // console.log(projectIds);
    // Map: projectId -> boards[] (optionally filter to only boards where current user is a member)
    const byPid = new Map(
      boardsDocs.map((doc) => [
        String(doc.projectId),
        // Optional filter: sirf woh boards jisme current user member ho
        doc.boards.filter((b) =>
          Array.isArray(b.members)
            ? b.members.some((m) => String(m.user) === String(uv._id))
            : true
        ),
      ])
    );

    // CHANGED: attach boards (or a boardsCount) to each project object
    const projectsWithBoards = projects.map((p) => {
      const pObj = p.toObject();
      pObj.boards = byPid.get(String(p._id)) || [];  // full boards attach
      // Agar payload halka rakhna ho to sirf count bhej sakte ho:
      pObj.boardsCount = (byPid.get(String(p._id)) || []).length;
      return pObj;
    });
    
    res.status(200).json({ projects: projectsWithBoards, workspace });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
