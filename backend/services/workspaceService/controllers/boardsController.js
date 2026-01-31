import mongoose from "mongoose";
import { ProjectBoards } from "../models/boardModel.js";
import Project from "../models/project.js";
import userView from "../models/user-view.js";


export const createBoard00 = async (req, res) => {
  const { projectId } = req.params; 
  const newBoard = req.body;

  try {

    const project = await Project.findById(projectId);

    if (!project) return res.status(404).json({ message: "Project not found" });

    let projectBoards = await ProjectBoards.findOne({ projectId: projectId });

    if (!projectBoards) {
      // If userBoards document doesn't exist, create a new one
      projectBoards = await ProjectBoards.create(
        { 
          projectId: projectId,
          boards: [newBoard],
        }
      );
    } else {
      // Check if a board with the same name already exists
      const boardExists = projectBoards.boards.some(
        (board) => board.boardName === newBoard.boardName
      );

      if (boardExists) {
        return res.status(400).json({ error: "Board with this name already exists." });
      }

      // If not, push new board to boards array
      projectBoards.boards.push(newBoard);
      await projectBoards.save();
    }

    res.status(200).json(projectBoards.boards);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

export const createBoard = async (req, res) => {
  const { projectId } = req.params;
  const newBoard = { ...req.body, projectId }; // <-- attach projectId inside board

  try {
    // confirm project exists (tumhari pehli check theek hai)
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // ab root level par projectId nahi hai, isliye holder doc laane ka tareeqa badlo
    // simple approach: ek hi ProjectBoards document ko container ke tor par use karo
    let projectBoards = await ProjectBoards.findOne({projectId});

    if (!projectBoards) {
      projectBoards = await ProjectBoards.create({ projectId, boards: [newBoard] });
      return res.status(200).json(projectBoards.boards.filter(
        b => String(b.projectId) === String(projectId)
      ));
    }

    // duplicate name check: sirf isi project ke andar
    const boardExists = projectBoards.boards.some(
      b => String(b.projectId) === String(projectId) && b.boardName === newBoard.boardName
    );
    if (boardExists) {
      return res.status(400).json({ error: "Board with this name already exists." });
    }

    projectBoards.boards.push(newBoard);
    await projectBoards.save();

    // response: is project ke boards bhej do (agar tumhari UI ko saare chahiye)
    const boardsInProject = projectBoards.boards.filter(
      b => String(b.projectId) === String(projectId)
    );
    return res.status(200).json(boardsInProject);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
};

export const editBoard = async (req, res) => {
  try {
    const boardId = req.params.boardId || req.body.boardId;
    if (!boardId) return res.status(400).json({ error: "boardId is required" });

    const { boardName, columns, members } = req.body;

    const $set = {};
    if (typeof boardName === "string") $set["boards.$.boardName"] = boardName;
    if (Array.isArray(columns))       $set["boards.$.columns"]   = columns;
    if (Array.isArray(members))       $set["boards.$.members"]   = members;

    if (!Object.keys($set).length) {
      return res.status(400).json({ error: "No valid fields to update." });
    }

    const updatedDoc = await ProjectBoards.findOneAndUpdate(
      { "boards._id": boardId },
      { $set },
      { new: true }
    );
    if (!updatedDoc) return res.status(404).json({ error: "Board not found." });

    return res.status(200).json(updatedDoc.boards.id(boardId));
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
};

export const updateBoardColumns = async (req, res) => {
  try {
    // CHANGED: support param or body boardId
    const boardId = req.params.boardId || req.body.boardId;
    const { columns } = req.body;

    if (!boardId) return res.status(400).json({ error: "boardId is required" });
    if (!Array.isArray(columns)) {
      return res.status(400).json({ error: "columns must be an array" });
    }

    const updatedDoc = await ProjectBoards.findOneAndUpdate(
      { "boards._id": boardId },
      { $set: { "boards.$.columns": columns } },
      { new: true }
    );

    if (!updatedDoc) return res.status(404).json({ error: "Board not found." });

    const updatedBoard = updatedDoc.boards.id(boardId);
    return res.status(200).json(updatedBoard);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
};

export const deleteBoard = async (req, res) => {
  try {
    // CHANGED: accept boardId from route param or body (both supported)
    const boardId = req.params.boardId || req.body.boardId;
    if (!boardId) return res.status(400).json({ error: "boardId is required" });

    // 1) Find the document which contains this board so we can return deleted board
    const holder = await ProjectBoards.findOne({ "boards._id": boardId });
    if (!holder) return res.status(404).json({ error: "Board not found." });

    const toDelete = holder.boards.id(boardId);
    if (!toDelete) return res.status(404).json({ error: "Board not found." });

    // 2) Pull the board from the array
    await ProjectBoards.updateOne(
      { _id: holder._id },
      { $pull: { boards: { _id: boardId } } }
    );

    return res.status(200).json(toDelete); // return the removed board
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
};

export const getBoardById = async (req, res) => {
  try {
    const { boardId } = req.params;

    const uv = await userView.findOne({ userId: req.user._id }, { _id: 1 }).lean();
    if (!uv) return res.status(403).json({ message: "UserView not found" });

    const boardObjectId = new mongoose.Types.ObjectId(boardId);

    const doc = await ProjectBoards.findOne(
      {
        boards: {
          $elemMatch: {
            _id: boardObjectId,
            "members.user": uv._id,
          },
        },
      },
      { "boards.$": 1 } // <-- root-level projectId mat maango
    )
      .populate("boards.members.user", "firstName name email profilePicture userId")
      .lean();

    if (!doc || !doc.boards || doc.boards.length === 0) {
      return res.status(404).json({ message: "Board not found" });
    }

    const board = doc.boards[0];
    return res.status(200).json({ board, projectId: board.projectId }); // <-- yahan se bhejo
  } catch (e) {
    console.error(e);
    return res.status(400).json({ message: e.message });
  }
};





























// export const deleteBoard = async (req, res) => {
 
//   const { userId } = req.body;
//   // const boardId = req.body.boardId;
//   const boardId = req.params.id;

//   console.log("userId= ", userId);
//   console.log("boardId= ", boardId);
//   try {
//     // Find the user's document
//     const userBoards = await UserBoards.findOne({ user_id: userId });

//     if (!userBoards) {
//       console.log("404= User not found.")
//       return res.status(404).json({ error: "User not found." });
//     }

//     // Find the board by its ID within the user's boards array
//     const boardIndex = userBoards.boards.findIndex(board => board._id.toString() === boardId);

//     if (boardIndex === -1) {
//       console.log("404= Board not found")
//       return res.status(404).json({ error: "Board not found." });
//     }

//     // Remove the board from the array
//     const deletedBoard = userBoards.boards.splice(boardIndex, 1);

//     // Save the updated user boards document
//     await userBoards.save();

//     // Respond with the deleted board data
//     res.status(200).json(deletedBoard[0]);
//   } catch (error) {
//     console.error(error);
//     console.log("400= ",error)
//     res.status(400).json({ error: error.message });
//   }
// };

// export const editBoard = async (req, res) => {
//   const { userId, boardId, data, teamMemberIDs } = req.body;
//   console.log("req.body= ", req.body)
//   console.log("data= ", data)
//   try {
//     // Check if the user exists and has permission to edit the board
//     const userBoards = await UserBoards.findOne({ user_id: userId });

//     if (!userBoards) {
//       return res.status(404).json({ error: "User not found." });
//     }

//     // Find the board by its ID within the user's boards array
//     const boardToUpdate = userBoards.boards.id(boardId);

//     if (!boardToUpdate) {
//       return res.status(404).json({ error: "Board not found." });
//     }

//     // Update the board's fields
//     boardToUpdate.boardName = data.boardName;
//     boardToUpdate.columns = data.columns;

   
//     boardToUpdate.teamMemberIDs = teamMemberIDs;

//     // Save the updated user boards document
//     await userBoards.save();

//     // Respond with the updated board data
//     res.status(200).json(boardToUpdate);
//   } catch (error) {
//     console.error(error);
//     res.status(400).json({ error: error.message });
//   }
// };


// export const updateBoardColumns = async (req, res) => {
//   const { userId, boardId, columns } = req.body;

//   console.log("userId= ",userId)

//   console.log("boardId= ",boardId)

//   console.log("columns= ",columns)


//   try {
//     const userBoards = await UserBoards.findOne({ user_id: userId });

//     if (!userBoards) {
//       return res.status(404).json({ error: "User not found." });
//     }

//     const boardIndex = userBoards.boards.findIndex(board => board._id.toString() === boardId);

//     if (boardIndex === -1) {
//       return res.status(404).json({ error: "Board not found." });
//     }

//     userBoards.boards[boardIndex].columns = columns;

//     await userBoards.save();

//     res.status(200).json(userBoards.boards[boardIndex]);
//   } catch (error) {
//     console.error(error);
//     res.status(400).json({ error: error.message });
//   }
// };





























// export const getTaskById = async (req, res) => {
//   try {
//     const { taskId } = req.params;
//     console.log("taskId = ", taskId)

//     // Check if taskId is a valid ObjectId
//     if (!mongoose.Types.ObjectId.isValid(taskId)) {
//       return res.status(400).json({ message: 'Invalid task ID' });
//     }

//     // Fetch UserBoards and find the task within the nested structure
//     const userBoards = await UserBoards.findOne({
//       'boards.columns.tasks._id': taskId
//     })
//     .populate({
//       path: 'boards.columns.tasks.comments',
//       populate: [
//         {
//           path: 'author',
//           select: 'name' // Adjust the fields as necessary
//         },
//         {
//           path: 'replies',
//           populate: {
//             path: 'author',
//             select: 'name' // Adjust the fields as necessary
//           }
//         }
//       ]
//     });

//     if (!userBoards) {
//       return res.status(404).json({ message: 'Task not found' });
//     }

//     // Find the specific task within the nested structure
//     const task = userBoards.boards
//       .flatMap(board => board.columns)
//       .flatMap(column => column.tasks)
//       .find(task => task._id.toString() === taskId);

//     if (!task) {
//       return res.status(404).json({ message: 'Task not found' });
//     }

//     res.status(200).json(task);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// export const dashboardStatistics = async (req, res, next) => {
//   try {
//     // Retrieve the logged-in user's ID and role from the request
//     const userId = "6681725234bf2379cba351a1"; // Replace with req.user._id if using authenticated routes
//     const isAdmin = true; // Replace with req.user.isAdmin if using authenticated routes

//     // Retrieve the logged-in user's data including embedded employees
//     const loggedInUser = await User.findById(userId).exec();
//     if (!loggedInUser) {
//       return res.status(404).json({ status: false, message: "User not found" });
//     }

//     // Limit and sort employees (latest 5)
//     const employees = loggedInUser.employees
//       .sort((a, b) => b.createdAt - a.createdAt)
//       .slice(0, 5);

//     // Convert employee IDs to strings
//     const employeeIds = employees.map(emp => emp._id.toString());
//     const allUserIds = [userId, ...employeeIds];

//     // Define the query for user boards
//     const userBoardsQuery = isAdmin
//       ? { 'boards.columns.tasks.assignee': { $in: allUserIds } }
//       : { 'boards.columns.tasks.assignee': { $in: allUserIds } };

//     // Retrieve the tasks according to user role
//     const userBoards = await UserBoards.find(userBoardsQuery)
//       .populate({
//         path: "boards.columns.tasks.reporter",
//         select: "firstName lastName role email",
//       })
//       .lean(); // Use lean to get plain JavaScript objects

//       // Collect all column names
//     const columnNames = new Set();

//     // Manually map over the tasks to populate the assignee from the employees if necessary
//     const allTasks = userBoards.reduce((acc, board) => {
//       board.boards.forEach((boardItem) => {
//         boardItem.columns.forEach((column) => {

//           columnNames.add(column.columnName); // Collect column name

//           column.tasks.forEach(task => {
           
//             // If the assignee is an ID, populate it manually from employees or the user
//             task.assignee = task.assignee.map(assigneeId => {
//               if (assigneeId.toString() === userId) {
//                 return loggedInUser; // Assign logged-in user if it matches
//               }
//               // Find the employee who matches the assignee ID
//               return employees.find(emp => emp._id.toString() === assigneeId.toString()) || null;
//             }).filter(Boolean); // Remove any null values
//             acc.push({
//               ...task, // Spread the task object to include all fields
//               createdAt: task.createdAt, // Ensure the createdAt field is included
//             });
//           });
//           // acc.push(...column.tasks);

         
//         });
//       });
//       return acc;
//     }, []);


//     // Group tasks by stage
//     const groupTasks = allTasks.reduce((result, task) => {
//       const stage = task.status;
    
//       if (!result[stage]) {
//         result[stage] = 1;
//       } else {
//         result[stage] += 1;
//       }
//       return result;
//     }, {});

//     // Group tasks by priority
//     const groupData = Object.entries(
//       allTasks.reduce((result, task) => {
//         const { priorityLevel } = task;
//         result[priorityLevel] = (result[priorityLevel] || 0) + 1;
//         return result;
//       }, {})
//     ).map(([priorityLevel, total]) => ({ priorityLevel, total }));

//     // Calculate total tasks
//     const totalTasks = allTasks.length;
//     const last10Tasks = allTasks.slice(0, 10);

//     // Fetch recent users for admins or specific user with their employees
//     const users = isAdmin
//       ? await User.find({ _id: { $in: allUserIds }, isActive: true })
//           .populate('employees') // Populate employees if they are references
//           .select("firstName lastName role isAdmin isActive createdAt")
//           .limit(10)
//           .sort({ _id: -1 })
//       : [loggedInUser, ...employees];

//     // Prepare the summary
//     const summary = {
//       totalTasks,
//       last10Tasks,
//       users,
//       tasks: groupTasks,
//       graphData: groupData,
//       columnNames: Array.from(columnNames), // Include the column names
//     };

//     // Send the response
//     res.status(200).json({ status: true, message: "Successful", ...summary });
//   } catch (error) {
//     console.error(error);
//     return res.status(400).json({ status: false, message: error.message });
//   }
// };


// export const addTask = async (req, res) => {
//   const boardId = req.params.id; // Board ID
//   const {
//     taskName,
//     taskDescription,
//     subtasks,
//     status,
//     startDate,
//     dueDate,
//     fileUrls,
//     assigneeIds,
//     reporterIds,
//     priorityLevel
//   } = req.body;

//   try {
//     console.log("Request Body:", req.body);
//     console.log("fileUrls= ", fileUrls);

//     // Find the board and column
//     const board = await UserBoards.findOne({
//       "boards._id": boardId,
//       "boards.columns.columnName": status
//     });

//     if (!board) {
//       return res.status(404).json({ error: "Board or column not found" });
//     }

//     // Find the column index
//     const boardIndex = board.boards.findIndex(b => b._id.toString() === boardId);
//     const columnIndex = board.boards[boardIndex].columns.findIndex(c => c.columnName === status);

//     if (boardIndex === -1 || columnIndex === -1) {
//       return res.status(404).json({ error: "Column not found" });
//     }




//     // Prepare task data
//     const newTask = {
//       taskName,
//       taskDescription,
//       subtasks,
//       status,
//       startDate: startDate ? new Date(startDate) : null,
//       endDate: dueDate ? new Date(dueDate) : null,
//       assignee: assigneeIds.length > 0 ? assigneeIds : undefined,
//       reporter: reporterIds.length > 0 ? reporterIds : undefined,
//       priorityLevel, // Ensure this is included
//       files: fileUrls.map(file => ({
//         fileUrl: file.fileUrl,
//         fileName: file.fileName,
//         fileType: file.fileType,
//         isValidUrl: true // Ensure the file URL is permanent
//       })),
      
//     };

//     console.log("New Task Object:", newTask);

//     // Directly update the board document
//     board.boards[boardIndex].columns[columnIndex].tasks.push(newTask);

//     // Print the updated board to verify the task is added correctly
//     console.log("Updated board before save:", board);

//     await board.save();

//     // Print the updated board after saving
//     console.log("Updated board after save:", board);

//      // Retrieve the newly added task's ID
//      const addedTask = board.boards[boardIndex].columns[columnIndex].tasks.slice(-1)[0];


//     res.status(200).json({board, taskId: addedTask._id});
//   } catch (error) {
//     console.error("Error during task addition:", error);
//     res.status(400).json({ error: error.message });
//   }
// };




// export const editTask = async (req, res) => {
//   const { userId, boardId, taskId, originalStatus, data } = req.body;

//   // console.log("Debug - Inputs:");
//   // console.log("userId:", userId);
//   // console.log("boardId:", boardId);
//   // console.log("originalStatus:", originalStatus);
//   // console.log("data.fileUrls:", data.fileUrls);
//   // console.log("endDate:", data.endDate);
//   // console.log("Debug - newStatus from request data:", data);

//   try {
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//       // Find the original task and column
//       const board = await UserBoards.findOne({
//         "user_id": userId,
//         "boards._id": boardId,
//         "boards.columns": { $elemMatch: { columnName: originalStatus, "tasks._id": taskId } },
//       }).session(session);

//       console.log("Debug - Retrieved Board:");
//       console.log(board);

//       if (!board) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(404).json({ error: "Task not found." });
//       }

//       // Find the indexes of the board and column
//       const boardIndex = board.boards.findIndex(b => b._id.toString() === boardId);
//       const originalColumnIndex = board.boards[boardIndex].columns.findIndex(c => c.columnName === originalStatus);
//       const newColumnIndex = data.newStatus ?
//         board.boards[boardIndex].columns.findIndex(c => c.columnName === data.newStatus) :
//         originalColumnIndex; // If newStatus is undefined, do not change column

//       if (boardIndex === -1 || originalColumnIndex === -1 || (data.newStatus && newColumnIndex === -1)) {
//         await session.abortTransaction();
//         session.endSession();

//         const errorMessage = [
//           boardIndex === -1 ? "Board index not found" : null,
//           originalColumnIndex === -1 ? "Original column index not found" : null,
//           data.newStatus && newColumnIndex === -1 ? `New column '${data.newStatus}' not found` : null,
//         ].filter(Boolean).join(", ");

//         return res.status(404).json({ error: errorMessage });
//       }

//       // Update task fields
//       const task = board.boards[boardIndex].columns[originalColumnIndex].tasks.id(taskId);

//       // Update task with new data
//       task.taskName = data.taskName || task.taskName;
//       task.taskDescription = data.taskDescription || task.taskDescription;
//       task.subtasks = data.subtasks || task.subtasks;
//       task.status = data.newStatus || task.status;
//       task.startDate = data.startDate ? new Date(data.startDate) : task.startDate;
//       task.endDate = data.endDate ? new Date(data.endDate) : task.endDate;
//       task.assignee = data.assigneeIds.length > 0 ? data.assigneeIds : task.assignee;
//       task.reporter = data.reporterIds.length > 0 ? data.reporterIds : task.reporter;
//       task.priorityLevel = data.priorityLevel || task.priorityLevel;
//       task.files = data.fileUrls.map(file => ({
//         fileUrl: file.fileUrl,
//         fileName: file.fileName,
//         fileType: file.fileType,
//         isValidUrl: true
//       })) || task.files;
//       task.updated_at = new Date();

//       // console.log("Debug - Updated Task:");
//       // console.log(task);

//       // If the status has changed, move the task to the new column
//       if (originalStatus !== data.newStatus) {
//         // Remove the task from the original column
//         const taskIndex = board.boards[boardIndex].columns[originalColumnIndex].tasks.findIndex(t => t._id.toString() === taskId);
//         if (taskIndex !== -1) {
//           board.boards[boardIndex].columns[originalColumnIndex].tasks.splice(taskIndex, 1);
//         }

//         // Add the task to the new column
//         board.boards[boardIndex].columns[newColumnIndex].tasks.push(task);
//       }

//       // Save the updated board
//       await board.save({ session });

//       await session.commitTransaction();
//       session.endSession();

//       // Fetch and respond with the updated board
//       const updatedBoard = await UserBoards.findOne(
//         { "user_id": userId, "boards._id": boardId },
//         { "boards.$": 1 }
//       );

//       res.status(200).json(updatedBoard);
//     } catch (error) {
//       await session.abortTransaction();
//       session.endSession();
//       console.error("Error:", error);
//       res.status(400).json({ error: error.message });
//     }
//   } catch (error) {
//     console.error("Error starting transaction:", error);
//     res.status(500).json({ error: "Database error" });
//   }
// };

// export const addNewSubtask = async (req, res) => {
//   const { userId, boardId, taskId, subtaskData } = req.body;

//   try {

//     // Validate required fields
//     if (!userId || !boardId || !taskId || !subtaskData?.subtaskName) {
//       return res
//         .status(400)
//         .json({ error: "userId, boardId, taskId, and subtaskName are required" });
//     }

//     // Find the board and task
//     const board = await UserBoards.findOne({
//       "boards._id": boardId,
//       "boards.columns.tasks._id": taskId,
//     });

//     if (!board) {
//       return res.status(404).json({ error: "Board or task not found" });
//     }

//     // Find the task within the board
//     const boardIndex = board.boards.findIndex(
//       (b) => b._id.toString() === boardId
//     );
//     const columnIndex = board.boards[boardIndex].columns.findIndex((c) =>
//       c.tasks.some((t) => t._id.toString() === taskId)
//     );
//     const taskIndex = board.boards[boardIndex].columns[columnIndex].tasks.findIndex(
//       (t) => t._id.toString() === taskId
//     );

//     if (boardIndex === -1 || columnIndex === -1 || taskIndex === -1) {
//       return res.status(404).json({ error: "Task not found" });
//     }

//     // Prepare subtask data
//     const newSubtask = {
//       subtaskName: subtaskData.subtaskName,
//       subTaskDescription: subtaskData.subtaskDescription || "", // Correct property name
//       isCompleted: false, // Default value for isCompleted
//       createdAt: new Date(),
//     };

//     // Add the subtask to the task's subtask array
//     const task =
//       board.boards[boardIndex].columns[columnIndex].tasks[taskIndex];
//     task.subtasks.push(newSubtask);
//     await board.save();

//     // Retrieve the newly added subtask's ID
//     const addedSubtask = task.subtasks.slice(-1)[0];

//     res
//       .status(200)
//       .json({ taskId, subtaskId: addedSubtask._id, updatedTask: task });
//   } catch (error) {
//     console.error("Error during subtask addition:", error);
//     res.status(400).json({ error: error.message });
//   }
// };

// export const editNewSubtask = async (req, res) => {
//   const { userId, boardId, taskId, subtaskId, subtaskData } = req.body;

//   try {
//     console.log("Request Body:", req.body);

//     // Validate required fields
//     if (!userId || !boardId || !taskId || !subtaskId || !subtaskData?.subtaskName) {
//       return res
//         .status(400)
//         .json({ error: "userId, boardId, taskId, subtaskId, and subtaskName are required" });
//     }

//     // Find the board and task
//     const board = await UserBoards.findOne({
//       "boards._id": boardId,
//       "boards.columns.tasks._id": taskId,
//     });

//     if (!board) {
//       return res.status(404).json({ error: "Board or task not found" });
//     }

//     // Find the task within the board
//     const boardIndex = board.boards.findIndex(
//       (b) => b._id.toString() === boardId
//     );
//     const columnIndex = board.boards[boardIndex].columns.findIndex((c) =>
//       c.tasks.some((t) => t._id.toString() === taskId)
//     );
//     const taskIndex = board.boards[boardIndex].columns[columnIndex].tasks.findIndex(
//       (t) => t._id.toString() === taskId
//     );

//     if (boardIndex === -1 || columnIndex === -1 || taskIndex === -1) {
//       return res.status(404).json({ error: "Task not found" });
//     }

//     // Find the subtask
//     const task = board.boards[boardIndex].columns[columnIndex].tasks[taskIndex];
//     const subtask = task.subtasks.find(
//       (st) => st._id.toString() === subtaskId
//     );

//     if (!subtask) {
//       return res.status(404).json({ error: "Subtask not found" });
//     }

//     // Update the subtask
//     subtask.subtaskName = subtaskData.subtaskName;
//     subtask.subTaskDescription = subtaskData.subtaskDescription || "";
//     subtask.isCompleted = subtaskData.isCompleted ?? subtask.isCompleted; // Update isCompleted if provided

//     console.log("Updated Subtask:", subtask);

//     await board.save();

//     // Send back the updated subtask
//     res.status(200).json({ taskId, subtaskId, updatedSubtask: subtask });
//   } catch (error) {
//     console.error("Error during subtask update:", error);
//     res.status(400).json({ error: error.message });
//   }
// };
// export const deleteNewSubtask = async (req, res) => {
//   const { userId, boardId, taskId, subtaskId } = req.body;

//   try {
//     console.log("Request Body:", req.body);

//     // Validate required fields
//     if (!userId || !boardId || !taskId || !subtaskId) {
//       return res
//         .status(400)
//         .json({ error: "userId, boardId, taskId, and subtaskId are required" });
//     }

//     // Find the board and task
//     const board = await UserBoards.findOne({
//       "boards._id": boardId,
//       "boards.columns.tasks._id": taskId,
//     });

//     if (!board) {
//       return res.status(404).json({ error: "Board or task not found" });
//     }

//     // Find the task within the board
//     const boardIndex = board.boards.findIndex(
//       (b) => b._id.toString() === boardId
//     );
//     const columnIndex = board.boards[boardIndex].columns.findIndex((c) =>
//       c.tasks.some((t) => t._id.toString() === taskId)
//     );
//     const taskIndex = board.boards[boardIndex].columns[columnIndex].tasks.findIndex(
//       (t) => t._id.toString() === taskId
//     );

//     if (boardIndex === -1 || columnIndex === -1 || taskIndex === -1) {
//       return res.status(404).json({ error: "Task not found" });
//     }

//     // Find the task and remove the subtask
//     const task = board.boards[boardIndex].columns[columnIndex].tasks[taskIndex];
//     const subtaskIndex = task.subtasks.findIndex(
//       (st) => st._id.toString() === subtaskId
//     );

//     if (subtaskIndex === -1) {
//       return res.status(404).json({ error: "Subtask not found" });
//     }

//     // Remove the subtask from the task
//     task.subtasks.splice(subtaskIndex, 1);

//     console.log("Subtask Deleted:", subtaskId);

//     await board.save();

//     // Send back a success message
//     res.status(200).json({ message: "Subtask deleted successfully", subtaskId });
//   } catch (error) {
//     console.error("Error during subtask deletion:", error);
//     res.status(400).json({ error: error.message });
//   }
// };


// export const editSubtask = async (req, res) => {
//   const { userId, boardId, originalStatus, newStatus, taskId, subtasks } = req.body;

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // Find the board and the task within the specified column
//     const board = await UserBoards.findOne({
//       "user_id": userId,
//       "boards._id": boardId,
//       "boards.columns": { $elemMatch: { columnName: originalStatus, "tasks._id": taskId } },
//     }).session(session);

//     if (!board) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ error: "Task not found." });
//     }

//     // Find the board and column indices
//     const boardIndex = board.boards.findIndex(b => b._id.toString() === boardId);
//     const originalColumnIndex = board.boards[boardIndex].columns.findIndex(c => c.columnName === originalStatus);
//     const newColumnIndex = newStatus ? 
//       board.boards[boardIndex].columns.findIndex(c => c.columnName === newStatus) : 
//       originalColumnIndex; // If newStatus is undefined, keep the task in the same column

//     if (boardIndex === -1 || originalColumnIndex === -1 || (newStatus && newColumnIndex === -1)) {
//       await session.abortTransaction();
//       session.endSession();
//       const errorMessage = [
//         boardIndex === -1 ? "Board index not found" : null,
//         originalColumnIndex === -1 ? "Original column index not found" : null,
//         newStatus && newColumnIndex === -1 ? `New column '${newStatus}' not found` : null,
//       ].filter(Boolean).join(", ");
//       return res.status(404).json({ error: errorMessage });
//     }

//     // Update the task fields
//     const task = board.boards[boardIndex].columns[originalColumnIndex].tasks.id(taskId);
//     if (!task) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ error: "Task not found in original column." });
//     }

//     // Update task fields
//     task.taskName = req.body.task.taskName || task.taskName;
//     task.taskDescription = req.body.task.taskDescription || task.taskDescription;
//     task.subtasks = subtasks || task.subtasks;
//     task.status = newStatus || task.status;
//     task.startDate = req.body.task.startDate ? new Date(req.body.task.startDate) : task.startDate;
//     task.endDate = req.body.task.endDate ? new Date(req.body.task.endDate) : task.endDate;
//     task.assignee = req.body.task.assignee.length > 0 ? req.body.task.assignee : task.assignee;
//     task.reporter = req.body.task.reporter.length > 0 ? req.body.task.reporter : task.reporter;
//     task.priorityLevel = req.body.task.priorityLevel || task.priorityLevel;
//     task.files = req.body.task.files.map(file => ({
//       fileUrl: file.fileUrl,
//       fileName: file.fileName,
//       fileType: file.fileType,
//       isValidUrl: true
//     })) || task.files;
//     task.updated_at = new Date();

//     // If the status has changed, move the task to the new column
//     if (originalStatus !== newStatus) {
//       // Remove task from original column
//       board.boards[boardIndex].columns[originalColumnIndex].tasks.pull({ _id: taskId });

//       // Add task to new column
//       board.boards[boardIndex].columns[newColumnIndex].tasks.push(task);
//     }

//     // Save the updated board
//     await board.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     // Fetch and respond with the updated board
//     const updatedBoard = await UserBoards.findOne(
//       { "user_id": userId, "boards._id": boardId },
//       { "boards.$": 1 }
//     );

//     res.status(200).json(updatedBoard);
//   } catch (error) {
//     // Only call abortTransaction if an error occurred
//     if (session.inTransaction()) {
//       await session.abortTransaction();
//     }
//     session.endSession();
//     console.error("Error:", error);
//     res.status(400).json({ error: error.message });
//   }
// };

// export const updateSubtaskCompletion = async (req, res) => {
//   const { userId, boardId, taskId, subtaskId, isCompleted } = req.body;

//   console.log("userId= ",userId)
//   console.log("boardId= ",boardId)
//   console.log("taskId= ",taskId)
//   console.log("subtaskId= ",subtaskId)
//   console.log("isCompleted= ",isCompleted)

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // Find the board containing the task and subtask
//     const board = await UserBoards.findOne({
//       "user_id": userId,
//       "boards._id": boardId,
//       "boards.columns.tasks._id": taskId,
//     }).session(session);

//     if (!board) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ error: "Board or task not found." });
//     }

//     // Locate the task and subtask
//     const boardIndex = board.boards.findIndex((b) => b._id.toString() === boardId);
//     const columnIndex = board.boards[boardIndex].columns.findIndex((c) =>
//       c.tasks.some((t) => t._id.toString() === taskId)
//     );

//     if (boardIndex === -1 || columnIndex === -1) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ error: "Task or column not found." });
//     }

//     const task = board.boards[boardIndex].columns[columnIndex].tasks.id(taskId);
//     const subtask = task.subtasks.id(subtaskId);

//     if (!subtask) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ error: "Subtask not found." });
//     }

//     // Update the isCompleted field
//     subtask.isCompleted = isCompleted;

//     // Save the updated board
//     await board.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     // Fetch and return the updated board
//     const updatedBoard = await UserBoards.findOne(
//       { "user_id": userId, "boards._id": boardId },
//       { "boards.$": 1 }
//     );
//     console.log("updatedBoard= ",updatedBoard)

//     res.status(200).json(updatedBoard);
//   } catch (error) {
//     if (session.inTransaction()) {
//       await session.abortTransaction();
//     }
//     session.endSession();
//     console.error("Error updating subtask completion:", error);
//     res.status(400).json({ error: error.message });
//   }
// };


// export const trashTask = async (req, res) => {
//   const { userId, boardId, taskId, isTrashed } = req.body;

//   // const userId="6681725234bf2379cba351a1"
//   // const boardId="66c3c636536fa83d8c7b89bd"
//   // const taskId="66c4fea8d5d61408f5ac28ab"
//   // const isTrashed="true"

//   console.log("userId= ",userId)
//   console.log("boardId= ",boardId)
//   console.log("taskId= ",taskId)
//   console.log("isTrashed= ",isTrashed)


//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // Find the task within the specified board and column
//     const board = await UserBoards.findOne({
//       "user_id": userId,
//       "boards._id": boardId,
//       "boards.columns.tasks._id": taskId,
//     }).session(session);

//     if (!board) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ error: "Task not found." });
//     }

//     // Find the board, column, and task indices
//     const boardIndex = board.boards.findIndex(b => b._id.toString() === boardId);
//     const columnIndex = board.boards[boardIndex].columns.findIndex(c => 
//       c.tasks.some(t => t._id.toString() === taskId)
//     );
//     const taskIndex = board.boards[boardIndex].columns[columnIndex].tasks.findIndex(t => 
//       t._id.toString() === taskId
//     );

//     if (boardIndex === -1 || columnIndex === -1 || taskIndex === -1) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ error: "Task not found." });
//     }

//     // Update the isTrashed field
//     board.boards[boardIndex].columns[columnIndex].tasks[taskIndex].isTrashed = isTrashed;

//     // Save the updated board
//     await board.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     // Respond with the updated task
//     res.status(200).json({ success: true, message: "Task deleted successfully." });
//   } catch (error) {
//     if (session.inTransaction()) {
//       await session.abortTransaction();
//     }
//     session.endSession();
//     console.error("Error:", error);
//     res.status(400).json({ error: error.message });
//   }
// };


// export const deleteTask = async (req, res) => {
 
//   const { userId, boardId, taskId, originalStatus } = req.body;
//   // console.log("userId= ",userId);
//   // console.log("boardId= ",boardId);
//   // console.log("taskId= ",taskId);
//   // console.log("originalStatus= ",originalStatus);

//   try {
//     const deletedTask = await UserBoards.findOneAndUpdate(
//       { "boards._id": boardId, "boards.columns.columnName": originalStatus },
//       { $pull: { "boards.$[board].columns.$[column].tasks": { _id: taskId } } },
//       {
//         arrayFilters: [{ "board._id": boardId }, { "column.columnName": originalStatus }],
//         new: true,
//       }
//     );

//     res.status(200).json(deletedTask);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };





// // POST: Add a related task
// // POST: Add a related task
// export const addRelatedTask = async (req, res) => {
//   try {
//     const { userId, boardId, taskId, relatedTaskIds } = req.body; // Handling multiple relatedTaskIds

//     console.log(req.body);

//     // Find the board for the specific user
//     const board = await UserBoards.findOne({ _id: boardId, user_id: userId });
//     if (!board) {
//       return res.status(404).json({ message: 'Board not found or does not belong to the user' });
//     }

//     // Find the task within the board
//     const task = board.columns
//       .flatMap(col => col.tasks)
//       .find(task => task._id.toString() === taskId);

//     if (!task) {
//       return res.status(404).json({ message: 'Task not found' });
//     }

//     // Add the related task IDs if they don't already exist
//     relatedTaskIds.forEach((relatedTaskId) => {
//       if (!task.relatedTaskIDs.includes(relatedTaskId)) {
//         task.relatedTaskIDs.push(relatedTaskId);
//       }
//     });
    
//     task.updated_at = new Date(); // Optional: update the timestamp if necessary
//     await board.save(); // Save the updated board

//     res.status(200).json({ message: 'Related tasks added successfully', task });
//   } catch (error) {
//     console.error('Error adding related task:', error);
//     res.status(500).json({ message: 'Error adding related task', error: error.message });
//   }
// };



// // PUT: Update related tasks
// export const updateRelatedTasks = async (req, res) => {
//   try {
//     console.log(req.body);
//     const { userId, boardId, taskId, relatedTaskIds } = req.body;

//     // Find the board
//     const board = await UserBoards.findOne({ user_id: userId, "boards._id": boardId });
//     if (!board) {
//       return res.status(404).json({ message: "Board not found" });
//     }

//     // Find the board index
//     const boardIndex = board.boards.findIndex(b => b._id.toString() === boardId);
//     if (boardIndex === -1) {
//       return res.status(404).json({ message: "Board index not found" });
//     }

//     // Find the task
//     const task = board.boards[boardIndex].columns
//       .flatMap(col => col.tasks)
//       .find(t => t._id.toString() === taskId);

//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     // Update the related tasks
//     task.relatedTaskIDs = relatedTaskIds;
//     task.updated_at = new Date();

//     // Save the updated board
//     await board.save();

//     res.status(200).json({ message: "Related tasks updated successfully", task });
//   } catch (error) {
//     console.error("Error updating related tasks:", error);
//     res.status(500).json({ message: "Error updating related tasks", error: error.message });
//   }
// };


// // DELETE: Remove a related task
// export const removeRelatedTask = async (req, res) => {
//   try {
//     const { userId, boardId, taskId, relatedTaskId } = req.body;

//     console.log(req.body);

//     // Find the board for the specific user
//     const board = await UserBoards.findOne({ user_id: userId, "boards._id": boardId });

//     if (!board) {
//       return res.status(404).json({ message: 'Board not found or does not belong to the user' });
//     }

//     // Find the board index
//     const boardIndex = board.boards.findIndex(b => b._id.toString() === boardId);
//     if (boardIndex === -1) {
//       return res.status(404).json({ message: 'Board index not found' });
//     }

//     // Find the task within the board
//     const task = board.boards[boardIndex].columns
//       .flatMap(col => col.tasks)
//       .find(t => t._id.toString() === taskId);

//     if (!task) {
//       return res.status(404).json({ message: 'Task not found' });
//     }

//     // Remove the related task ID from the task's relatedTaskIDs
//     task.relatedTaskIDs = task.relatedTaskIDs.filter(id => id !== relatedTaskId);

//     // Save the updated board
//     await board.save();

//     res.status(200).json({ message: 'Related task removed', task });
//   } catch (error) {
//     console.error('Error removing related task:', error);
//     res.status(500).json({ message: 'Error removing related task', error: error.message });
//   }
// };






