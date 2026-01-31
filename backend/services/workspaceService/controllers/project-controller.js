import Workspace from "../models/workspace.js";
import Project from "../models/project.js";
// import Task from "../models/task.js";
import userView from "../models/user-view.js";
import { ProjectBoards } from "../models/boardModel.js";

const createProject = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, description, status, startDate, dueDate, tags, members } =
      req.body;
      
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }
    const uv = await userView.findOne({ userId: req.user._id }, { _id: 1 });
      if (!uv) {
        return res.status(404).json({ message: "You are not a member of this workspace" });
      }

    const isMember = workspace.members.some(
      (member) => member.user.toString() === uv._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this workspace",
      });
    }

    const tagArray = tags ? tags.split(",") : [];

    const newProject = await Project.create({
      title,
      description,
      status,
      startDate,
      dueDate,
      tags: tagArray,
      workspace: workspaceId,
      members,
      createdBy: req.user._id,
    });

    workspace.projects.push(newProject._id);
    await workspace.save();

    return res.status(201).json(newProject);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    res.status(200).json(project);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// const getProjectTasks = async (req, res) => {
//   try {
//     const { projectId } = req.params;
//     const project = await Project.findById(projectId).populate("members.user");

//     if (!project) {
//       return res.status(404).json({
//         message: "Project not found",
//       });
//     }

//     const isMember = project.members.some(
//       (member) => member.user._id.toString() === req.user._id.toString()
//     );

//     if (!isMember) {
//       return res.status(403).json({
//         message: "You are not a member of this project",
//       });
//     }

//     const tasks = await Task.find({
//       project: projectId,
//       isArchived: false,
//     })
//       .populate("assignees", "name profilePicture")
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       project,
//       tasks,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };



const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      status,
      startDate,
      dueDate,
      tags,
      members,
    } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const uv = await userView.findOne({ userId: req.user._id }, { _id: 1 });
      if (!uv) {
        return res.status(404).json({ message: "You are not a member of this workspace" });
      }

    // membership check
    const isMember = project.members.some(
      m => m.user.toString() === uv._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this project" });
    }

    // update fields
    if (typeof title === "string") project.title = title;
    if (typeof description === "string") project.description = description;
    if (typeof status === "string") project.status = status;
    if (startDate !== undefined) project.startDate = startDate || undefined;
    if (dueDate !== undefined) project.dueDate = dueDate || undefined;

    if (typeof tags === "string") {
      project.tags = tags.split(",").map(t => t.trim()).filter(Boolean);
    } else if (Array.isArray(tags)) {
      project.tags = tags;
    }

    if (Array.isArray(members)) {
      project.members = members; // [{user, role}]
    }

    await project.save();
    return res.status(200).json(project);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// NEW: delete project (hard delete + cleanup)
const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const uv = await userView.findOne({ userId: req.user._id }, { _id: 1 });
      if (!uv) {
        return res.status(404).json({ message: "You are not a member of this workspace" });
      }

    const isMember = project.members.some(
      m => m.user.toString() === uv._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this project" });
    }

    // remove from workspace list
    await Workspace.updateOne(
      { _id: project.workspace },
      { $pull: { projects: project._id } }
    );

    // delete tasks of this project
    await Task.deleteMany({ project: projectId });

    // delete project
    await Project.deleteOne({ _id: projectId });

    return res.status(200).json({ message: "Project deleted" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getProjectBoards = async (req, res) => {
  try {
    const { projectId } = req.params;

    // 1) requester is a member of the project?
    const uv = await userView.findOne({ userId: req.user._id }, { _id: 1 }).lean();
    if (!uv) return res.status(404).json({ message: "Project not found" });

    const project = await Project.findOne({
      _id: projectId,
      "members.user": uv._id,
    })
      .populate("members.user", "firstName name email profilePicture")
      .lean();

    if (!project) {
      return res.status(404).json({ message: "project not found" });
    }

    // 2) Ab root pe projectId nahi hota -> container doc lao, phir JS me filter
    const doc = await ProjectBoards.findOne({projectId}, { boards: 1, _id: 0 }).lean();

    let boards = Array.isArray(doc?.boards) ? doc.boards : [];

    // sirf isi project ke boards
    boards = boards.filter(
      (b) => String(b.projectId) === String(projectId)
    );

    // (optional) agar board membership per restrict karna hai to uncomment:
    // const uid = String(uv._id);
    // boards = boards.filter(
    //   (b) => !b.members?.length || b.members.some((m) => String(m.user) === uid)
    // );

    // 3) newest first
    boards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({ boards, project });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



// const getProjectBoards = async (req, res) => {
//   try {
//     const { projectId } = req.params;

//     // 1) Verify requester is a member of the project
//     const uv = await userView.findOne({ userId: req.user._id }, { _id: 1 });
//     if (!uv) return res.status(404).json({ message: "Project not found" });

//     const project = await Project.findOne({
//       _id: projectId,
//       "members.user": uv._id,
//     }).populate("members.user", "name email profilePicture");

//     if (!project) {
//       return res.status(404).json({ message: "project not found" });
//     }

//     // 2) Read the single ProjectBoards doc (schema key is project_id)
//     const doc = await ProjectBoards.findOne(
//       { projectId: projectId },        // ✅ correct field
//       { boards: 1, _id: 0 }
//     ).lean();
//     // 3) Pull boards array; (optional) filter to only boards where the user is a member
//     let boards = doc?.boards || [];
//     // If you want to restrict by membership, uncomment:
//     // const uid = String(uv._id);
//     // boards = boards.filter(b => !b.members?.length || b.members.some(m => String(m.user) === uid));

//     // 4) Sort newest first (createdAt inside subdocs)
//     boards = boards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//     return res.status(200).json({ boards, project });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };




export { 
  createProject, 
  getProjectDetails, 
  // getProjectTasks,
  updateProject, 
  deleteProject,
  getProjectBoards
};
