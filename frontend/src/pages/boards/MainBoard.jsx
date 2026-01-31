// components/board/MainBoard.jsx
import React, { useEffect, useContext, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Main from "../../components/board/Main/Main";
import { ToastContainer } from "react-toastify";
import { BoardContext } from "../../context/BoardContext";
 // ← columns-only modal (jo tum use kar rahe ho)
import MainBoardHeader from "../../components/board/Main/main-board-header";
import AddNewColumnsModal from "../../modals/board/AddNewColumnsModal";
import AddNewTaskModal from "../../components/task/AddNewTaskModal";
import { UseBoardById } from "../../hooks/useBoardService";
import { Loader } from "../../components/loader/dotLoader";

export default function MainBoard() {
  const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);
  const [openColumnsModal, setOpenColumnsModal] = useState(false);

  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null); 
  
  const navigate = useNavigate();
  const { boards = [], currentBoard, setCurrentBoard, loading, refetchBoards } =
    useContext(BoardContext) || {};

  const { boardId, workspaceId } = useParams();
  // ✅ keep a primitive for deps
  const currentBoardId = currentBoard?._id;
 const { data, isLoading, error, refetch , isFetching} = UseBoardById(boardId);
 const currentBoardData = data?.board;


  useEffect(() => {
    if (!boards?.length) return;

    // 1) If the URL has :boardId → pick that
    if (boardId) {
      const byRoute = boards.find((b) => String(b._id) === String(boardId));
      if (byRoute && byRoute._id !== currentBoardId) {
        setCurrentBoard?.(byRoute);
        return;
      }
    }

    // 2) Else keep previous if it still exists
    if (currentBoardId && boards.some((b) => b._id === currentBoardId)) return;

    // 3) Else fallback to first
    setCurrentBoard?.(boards[0]);
  }, [boards, boardId, currentBoardId, setCurrentBoard]); // ✅ no warning

  // if (loading) return <div>Loading...</div>;

  if ((loading || isLoading) && !currentBoardData) return <div><Loader /></div>;



  const boardName = currentBoardData?.boardName || currentBoard?.boardName || "Board";
  const projectId = currentBoardData?.projectId || currentBoard?.projectId;

  const handleEditTask = (task) => {
    setEditingTaskId(task?._id || null);
    setOpenTaskModal(true);
  };
  const handleOpenTask = (task) => {
    // example: navigate(`/tasks/${task._id}`)
    // ya koi view modal open
  };
   const handleAddTask = () => {
    setEditingTaskId(null);            // IMPORTANT: reset so mode becomes "create"
    setOpenTaskModal(true);
  };
    const handleCloseTaskModal = () => {
    setOpenTaskModal(false);
    setEditingTaskId(null);            // also clear on close
  };


  return (
    <div className="flex flex-col h-full">
      {/* NEW: header */}
      <MainBoardHeader
        title={boardName}
        onBack={() => navigate(-1)}
        onAddColumn={() => setOpenColumnsModal(true)}
        onAddTask={handleAddTask}
      />

      <div className="flex-1 overflow-x-auto mt-4 bg-gray-200 dark:bg-[#282828] rounded-lg shadow-md custom-scroll">
        <Main
          isMenuModalVisible={isMenuModalVisible}
          setIsMenuModalVisible={setIsMenuModalVisible}
          currentBoard={currentBoardData || currentBoard}
          boards={boards}
          onChanged={() => {
            refetchBoards?.();
            refetch?.();
          }}
          refetch={refetch}
          onOpenTask={() => {}}
        />
      </div>

      {/* Columns-only modal trigger from header button */}
      <AddNewColumnsModal
        isOpen={openColumnsModal}
        onOpenChange={setOpenColumnsModal}
        board={currentBoardData || currentBoard}
        projectId={projectId}
      />

      {/* <AddNewTaskModal
        open={openTaskModal}
        onClose={() => setOpenTaskModal(false)}
        boardId={currentBoardId}
        defaultStatus="Backlog"
        currentBoard={currentBoardData}
        workspaceId={workspaceId}
        projectId={projectId}
        mode="create"
        taskId={null}
      /> */}

      <AddNewTaskModal
        open={openTaskModal}
        onClose={() => setOpenTaskModal(false)}
        boardId={currentBoardId}
        defaultStatus="Backlog"
        currentBoard={currentBoardData || currentBoard}
        workspaceId={workspaceId}
        projectId={projectId}
        mode="create"
        taskId={null}
        refetch={refetch}
      />


      <ToastContainer />
    </div>
  );
}














// // components/board/MainBoard.jsx
// import React, { useEffect, useContext, useState } from "react";
// import { useParams } from "react-router-dom";
// import Main from "../../components/board/Main/Main";
// import { ToastContainer } from "react-toastify";
// import { BoardContext } from "../../context/BoardContext";

// export default function MainBoard() {
//   const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);

//   const { boards = [], currentBoard, setCurrentBoard, loading, refetchBoards } =
//     useContext(BoardContext) || {};

//   const { boardId } = useParams();

//   // ✅ read only a primitive so exhaustive-deps is happy
//   const currentBoardId = currentBoard?._id;

//   useEffect(() => {
//     if (!boards?.length) return;

//     // 1) If the URL has :boardId → pick that
//     if (boardId) {
//       const byRoute = boards.find((b) => String(b._id) === String(boardId));
//       if (byRoute && byRoute._id !== currentBoardId) {
//         setCurrentBoard?.(byRoute);
//         return;
//       }
//     }

//     // 2) Else keep previous if it still exists
//     if (currentBoardId && boards.some((b) => b._id === currentBoardId)) return;

//     // 3) Else fallback to first
//     setCurrentBoard?.(boards[0]);
//   }, [boards, boardId, currentBoardId, setCurrentBoard]); // ✅ no warning
  

//   if (loading) return <div>Loading...</div>;

//   return (
//     <div className="flex flex-col h-full">
//       <div className="flex-1 overflow-x-auto mt-5 bg-gray-200 dark:bg-[#282828] rounded-lg shadow-md">
//         <Main
//           isMenuModalVisible={isMenuModalVisible}
//           setIsMenuModalVisible={setIsMenuModalVisible}
//           currentBoard={currentBoard}
//           boards={boards}
//           onChanged={refetchBoards}
//         />
//       </div>
//       <ToastContainer />
//     </div>
//   );
// }
