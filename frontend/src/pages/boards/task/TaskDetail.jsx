import React, { useContext, useEffect, useState } from "react";
import TaskDetailHeader from "../../../components/task/taskDetail/TaskDetailHeader";
import { useParams, useNavigate } from "react-router-dom";
import { BoardContext } from "../../../context/BoardContext";
import { UseBoardById } from "../../../hooks/useBoardService";
import { Loader } from "../../../components/loader/dotLoader";
import TaskDetailLeftPannel from "../../../components/task/taskDetail/TaskDetailLeftPannel";
import TaskDetailRightPannel from "../../../components/task/taskDetail/TaskDetailRightPannel";
import { UseGetTaskById } from "../../../hooks/useTaskService";
import AddNewTaskModal from "../../../components/task/AddNewTaskModal";


function TaskDetail() {

  const { workspaceId, projectId, boardId, taskId } = useParams();

  const [status, setStatus] = useState(null);
  const [priority, setPriority] = useState(null);
  const [teamAssignee, setTeamAssignee] = useState([]);
  const [teamReporter, setTeamReporter] = useState([]);

  const { data: taskData, isFetching: isTaskLoading } = UseGetTaskById({ taskId, projectId });
 
  const navigate = useNavigate();

  const { 
    boards = [], 
    currentBoard, 
    setCurrentBoard, 
    loading, 
    refetchBoards } =
    useContext(BoardContext) || {};
    
    const [editOpen, setEditOpen] = useState(false);
    const currentTask = taskData 


  
  const currentBoardId = currentBoard?._id;

  const { data, isLoading, error, refetch , isFetching} = UseBoardById(boardId);
  const currentBoardData = data?.board;
  
  useEffect(() => {
    if (!boards?.length) return;

    if (boardId) {
      const byRoute = boards.find((b) => String(b._id) === String(boardId));
      if (byRoute && byRoute._id !== currentBoardId) {
        setCurrentBoard?.(byRoute);
        return;
      }
    }

    if (currentBoardId && boards.some((b) => b._id === currentBoardId)) return;


    setCurrentBoard?.(boards[0]);
  }, [boards, boardId, currentBoardId, setCurrentBoard]); 


      
  useEffect(() => {
  if (!currentTask || !currentBoardData) return;

  // --- ASSIGNEE ---
  const assigneeId = Array.isArray(currentTask?.assignee)
    ? currentTask.assignee[0]
    : currentTask?.assignee;

  if (assigneeId) {
    const found = (currentBoardData?.members || [])
      .map(m => m.user || m)
      .find(u => String(u?._id) === String(assigneeId));

    setTeamAssignee(
      found
        ? {
            _id: found._id,
            firstName: found.firstName || found.name,
            profileImage: found.profilePicture || found.profileImage,
          }
        : { _id: assigneeId }
    );
  } else {
    setTeamAssignee(null);
  }

  // --- REPORTER ---
  const reporterId = Array.isArray(currentTask?.reporter)
    ? currentTask.reporter[0]
    : currentTask?.reporter;

  if (reporterId) {
    const foundR = (currentBoardData?.members || [])
      .map(m => m.user || m)
      .find(u => String(u?._id) === String(reporterId));

    setTeamReporter(
      foundR
        ? {
            _id: foundR._id,
            firstName: foundR.firstName || foundR.name,
            profileImage: foundR.profilePicture || foundR.profileImage,
          }
        : { _id: reporterId }
    );
  } else {
    setTeamReporter(null);
  }

  if (currentTask?.status) {
    setStatus({ name: currentTask.status });
  } else {
    setStatus(null);
  }

  // --- PRIORITY ---
  if (currentTask?.priorityLevel) {
    setPriority({ name: currentTask.priorityLevel });
  } else {
    setPriority(null);
  }

}, [currentTask, currentBoardData]);




  if ((loading || isLoading) && !currentBoardData) return <div><Loader /></div>;



  const boardName = currentBoardData?.boardName || currentBoard?.boardName || "Board";
  const projectId0 = currentBoardData?.projectId || currentBoard?.projectId;


  


  return (
    <>
    <div className="h-full flex flex-col">
      <TaskDetailHeader
                title={boardName}
                onBack={() => navigate(-1)}
                onEditTask={() => setEditOpen(true)}
                onAddTask={() => {}}
              />
      <div className="flex flex-col md:flex-row h-full gap-4 md:overflow-hidden lg:overflow-hidden xl:overflow-hidden 2xl:overflow-hidden overflow-auto custom-scroll ">
          
        {/* LEFT PANEL (Main Content) */}
        <div className="order-2 md:order-1 flex-1 border border-[#e5e5e5] dark:border-[#282828] bg-[#fafafa] dark:bg-[#282828] rounded-lg p-6 shadow-md">
        
        <TaskDetailLeftPannel
          workspaceId={workspaceId}
          projectId={projectId0}
          boardId={boardId}
          taskId={taskId}
          taskData={taskData}
          currentBoard={currentBoardData || currentBoard}
          isTaskLoading={isTaskLoading}
        />

        </div>

        {/* RIGHT PANEL (Side Info) */}
        <div className="order-1 md:order-2 w-full md:w-1/3 border border-[#e5e5e5] dark:border-[#282828] bg-[#fafafa] dark:bg-[#282828] rounded-lg p-6 shadow-md">
          <TaskDetailRightPannel
          teamAssignee={teamAssignee}
          teamReporter={teamReporter}
          status={status}
          priority={priority}
         

          />
        </div>
      </div>
    </div>

      <AddNewTaskModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        mode="edit"                              // or "create" if needed
        taskId={taskId}
        boardId={boardId}
        defaultStatus={taskData?.status || "Todo"}
        currentBoard={currentBoardData || currentBoard}
        workspaceId={workspaceId || currentBoardData?.workspaceId}
        projectId={projectId0}
        refetch={refetch}                        // re-fetch after save
      />
    </>
  );
}

export default TaskDetail;
