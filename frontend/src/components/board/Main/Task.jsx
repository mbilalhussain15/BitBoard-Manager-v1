// components/board/Task.jsx
import { useState, useEffect, useMemo } from "react";
// import { Draggable } from "react-beautiful-dnd";
import { Draggable } from "@hello-pangea/dnd";
import {
  MdAttachFile,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowUp,
} from "react-icons/md";
import { MoreHorizontal, MoreVertical } from "lucide-react";
import clsx from "clsx";
import { BGS, PRIOTITYSTYELS, formatDate } from "../../../utils";
import ProgressBar from "../../loader/ProgressBar";
import { UseDeleteTask } from "../../../hooks/useTaskService";
import AddNewTaskModal from "../../task/AddNewTaskModal";
import { useNavigate, useParams } from "react-router-dom";
import { FaList } from "react-icons/fa";

const ICONS = {
  high: <MdKeyboardDoubleArrowUp />,
  medium: <MdKeyboardArrowUp />,
  low: <MdKeyboardArrowDown />,
};

const Confirm = ({ open, title, desc, onCancel, onConfirm, loading }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onMouseDown={onCancel} />
      <div className="relative w-full max-w-sm rounded-lg bg-white p-5 shadow-xl dark:bg-[#2e2e2e]">
        <h3 className="text-lg font-semibold">{title}</h3>
        {desc ? <p className="mt-2 text-sm opacity-80">{desc}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-1.5 rounded-md border dark:border-white/20" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="px-3 py-1.5 rounded-md bg-red-600 text-white disabled:opacity-50"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};
  const toId = (v) => (typeof v === "string" ? v : v?._id || v?.id || v?.userId || null);

export function Task({
  task,
  index,
  currentBoardData,       // must contain {_id, columns}
  onOpenTask,             // optional view handler
  onChanged,              // parent refetch callback
  refetch                 // parent refetch function
  
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);     // local edit modal

  const { mutateAsync: deleteTaskAsync, isPending: deleting } = UseDeleteTask();

   const { workspaceId } = useParams();

   const navigate = useNavigate();

  const columns = currentBoardData?.columns || [];
  const totalColumns = columns.length;
  const taskColumnIndex = columns.findIndex((col) =>
    (col.tasks || []).some((t) => t._id === task._id)
  );
  const taskProgressPercentage =
    totalColumns > 1 ? (taskColumnIndex / (totalColumns - 1)) * 100 : 0;

  // mini assignee initials
  const [assignees, setAssignees] = useState([]);

  // helper: id normalize (file top pe ya component ke start me rakh lo)

    // members lookup (component ke andar)
  const boardMembers = useMemo(
    () => (currentBoardData?.members || []).map((m) => m?.user || m || {}),
    [currentBoardData?.members]
  );
  const membersById = useMemo(() => {
    const map = new Map();
    for (const u of boardMembers) {
      const id = toId(u);
      if (id) map.set(String(id), u);
    }
    return map;
  }, [boardMembers]);


// REPLACE your existing assignee effect with this:
useEffect(() => {
  const raw = Array.isArray(task?.assignee) ? task.assignee : [];
  const list = raw.map((a) => {
    const id = toId(a);
    const u = id ? membersById.get(String(id)) : null;
    const name = u ? (u.firstName || u.name || u.fullName || "User") : "User";
    const profileImage = u?.profilePicture || u?.profileImage || null;
    return {
      id,
      name,
      initial: String(name).charAt(0).toUpperCase(),
      profileImage,
    };
  });
  setAssignees(list);
}, [task?.assignee, membersById, task]);

  async function handleDelete() {
    try {
      await deleteTaskAsync({
      taskId: task._id,
      boardId: currentBoardData?._id,
      workspaceId: workspaceId,
      projectId: currentBoardData?.projectId,
    });
      setConfirmOpen(false);
      onChanged?.();
      refetch?.();
    } catch {
      // ignore error, toast already shown in hook
    }
  }

  return (
    <>
      <Draggable draggableId={String(task._id)} index={index} key={String(task._id)}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="task-card"
          onClick={(e) => {
            e.stopPropagation();
            console.log("clicked task", task._id);
            navigate(`tasks/${task._id}`, { state: { task } })
          }}
          >
            <div
              className="relative cursor-pointer  flex flex-col my-3 hover:shadow-indigo-800  dark:hover:shadow-emerald-900 bg-[#ececec] border-[#ececec] dark:bg-[#2f2f2f] dark:border-[#2f2f2f] shadow-md p-3 w-full rounded-lg hover:shadow-md"
              onClick={(e) =>{
                  // e.stopPropagation();
                  onOpenTask?.(task)
                  }

              } 
            >
              <div className="absolute right-2 top-2 z-10">
                <button
                  type="button"
                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((v) => !v);
                  }}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onMouseDown={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-8 w-44 rounded-md border bg-white shadow-lg z-50 py-1 dark:bg-[#4f4f4f] dark:border-[#4f4f4f]">
                      <button
                        className="w-full px-4 py-2 text-left text-sm dark:hover:bg-[#636363]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          onOpenTask?.(task);
                        }}
                      >
                        Open Task
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left text-sm dark:hover:bg-[#636363]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          setEditOpen(true);       // open local edit modal
                        }}
                      >
                        Edit Task
                      </button>
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:hover:bg-[#636363]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          setConfirmOpen(true);
                        }}
                      >
                        Delete task
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className={clsx("flex gap-1 items-center text-sm font-medium", PRIOTITYSTYELS[task?.priorityLevel])}>
                <span className="text-lg">{ICONS[task?.priorityLevel]}</span>
                <span className="uppercase">{task?.priorityLevel} Priority</span>
              </div>

              <p className="mt-2 line-clamp-2 text-gray-900 font-bold dark:text-zinc-200
               min-h-[50px]">
                {task?.taskName || "Task"}
              </p>

              <span className="text-sm opacity-75 mt-5">
                {task?.createdAt ? formatDate(new Date(task.createdAt)) : ""}
              </span>

              <div className="w-full border-t border-gray-300 dark:border-gray-700 my-2" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1 items-center text-sm opacity-80">
                    <MdAttachFile />
                    <span>{(task?.attachments || []).length}</span>
                  </div>
                  <div className="flex gap-1 items-center text-sm opacity-80">
                    <span className="inline-flex items-center">
                      <FaList />
                      <span className="ml-1">
                        {(task?.subtasks || []).filter(s => s.isCompleted).length}/{(task?.subtasks || []).length}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-row-reverse">
                  {assignees.slice(0, 3).map((m, i) => (
                    <div
                      key={`${m.initial}-${i}`}
                      title={m.name}
                      className={clsx("w-7 h-7 rounded-full text-white flex items-center justify-center text-sm -mr-1", BGS[i % BGS.length])}
                    >
                      {m.initial}
                    </div>
                  ))}
                  {assignees.length > 3 && (
                    <div className="w-7 h-7 rounded-full bg-gray-500 text-white flex items-center justify-center text-xs -mr-1">
                      +{assignees.length - 3}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full border-t border-gray-300 dark:border-gray-700 my-2" />

              <div className="flex">
                <ProgressBar label="Task" percentage={taskProgressPercentage} key={task._id} />
              </div>
            </div>

            <Confirm
              open={confirmOpen}
              title="Delete task"
              desc="This will permanently delete the task."
              onCancel={() => setConfirmOpen(false)}
              onConfirm={handleDelete}
              loading={deleting}
            />
          </div>
        )}
      </Draggable>

      {/* Local edit modal lives inside each Task */}
      <AddNewTaskModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onAfterSave={() => {
          setEditOpen(false);
          setTimeout(() => onChanged?.(), 0);
        }}
        onAfterCancel={() => {
          setEditOpen(false);
          setTimeout(() => onChanged?.(), 0);
        }}
        boardId={currentBoardData?._id}
        defaultStatus={task?.status || "Backlog"}
        currentBoard={currentBoardData}
        workspaceId={ workspaceId || currentBoardData?.workspaceId}
        projectId={currentBoardData?.projectId}
        mode="edit"
        taskId={task?._id}
        refetch={refetch}
      />
    </>
  );
}
























// // components/board/Task.jsx
// // CHANGED: Redux auth + useGetTeamListQuery hattaya (no API calls).
// // UI same; assignee bubbles ko simple initials/count me convert kiya.

// import { useState, useEffect } from "react";
// import { Draggable } from "react-beautiful-dnd";
// import {
//   MdAttachFile,
//   MdKeyboardArrowDown,
//   MdKeyboardArrowUp,
//   MdKeyboardDoubleArrowUp,
// } from "react-icons/md";
// import clsx from "clsx";
// import { BGS, PRIOTITYSTYELS, TASK_TYPE, formatDate } from "../../../utils/index";
// import ProgressBar from "../../loader/ProgressBar";
// // import TaskDialog from "../task/TaskDialog"; // (optional) agar chahiye to rakh sakte ho
// import { UseGetTaskById } from "../../../hooks/useTaskService";


// const ICONS = {
//   high: <MdKeyboardDoubleArrowUp />,
//   medium: <MdKeyboardArrowUp />,
//   low: <MdKeyboardArrowDown />,
// };

// export function Task({ task, index, currentBoardData }) {
//   const [isCardOpenEditStatus, setIsCardOpenEditStatus] = useState(false);

//   const numCompletedSubtasks = getNumCompletedSubtasks();

//     const { data, isLoading, error }= UseGetTaskById("68e715011430e223ce359f58");
  
//    const currentTaskData = data;
//   // console.log("currentTaskData=", currentTaskData);


//   function getNumCompletedSubtasks() {
//     let count = 0;
//     (task?.subtasks || []).forEach((s) => (s?.isCompleted ? count++ : null));
//     return count;
//   }

//   // CHANGED: Assignees — API remove. Try to render from task.assignee if objects; else show count circles.
//   const [assignees, setAssignees] = useState([]);
//   useEffect(() => {
//     const raw = Array.isArray(task?.assignee) ? task.assignee : [];
//     // if elements are objects with name/initials
//     const normalized = raw.map((u, i) => {
//       if (u && typeof u === "object") {
//         const n = u.name || u.fullName || "U";
//         return { name: n, initial: n.charAt(0).toUpperCase() };
//       }
//       return { name: "User", initial: "U" };
//     });
//     setAssignees(normalized);
//   }, [task?.assignee]);

//   // Progress by column index (Taskify logic)
//   if (!currentBoardData || !currentBoardData.columns) {
//     return <div>No board data available</div>;
//   }
//   const columns = currentBoardData.columns || [];
//   const totalColumns = columns.length;
//   const taskColumnIndex = columns.findIndex((col) =>
//     (col.tasks || []).some((t) => t._id === task._id)
//   );
//   const taskProgressPercentage =
//     totalColumns > 1 ? (taskColumnIndex / (totalColumns - 1)) * 100 : 0;

//   return (
//     <Draggable draggableId={task._id} index={index} key={task._id}>
//       {(provided) => (
//         <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
//           <div
//             onClick={() => setIsCardOpenEditStatus(true)}
//             className="cursor-pointer dark:bg-zinc-800 hover:dark:bg-zinc-700 flex flex-col my-3 bg-gray-50 hover:bg-gray-100 shadow-md p-3 h-full w-full rounded-lg hover:shadow-lg"
//           >
//             {/* Priority */}
//             <div className="w-full flex justify-between">
//               <div
//                 className={clsx(
//                   "flex flex-1 gap-1 items-center text-sm font-medium",
//                   PRIOTITYSTYELS[task?.priorityLevel]
//                 )}
//               >
//                 <span className="text-lg">{ICONS[task?.priorityLevel]}</span>
//                 <span className="uppercase">{task?.priorityLevel} Priority</span>
//               </div>

//               {/* {user?.user.isAdmin && <TaskDialog task={task} onClose={()=>{}} />} */}
//             </div>

//             {/* Title */}
//             <div className="flex items-center gap-2 mt-2">
//               <p className="line-clamp-1 text-gray-900 font-bold dark:text-zinc-200">
//                 {task?.taskName || task?.title || "Task"}
//               </p>
//             </div>

//             <span className="text-sm text-gray-700 dark:text-gray-400 mt-2">
//               {task?.startDate ? formatDate(new Date(task.startDate)) : ""}
//             </span>

//             <div className="w-full border-t border-gray-300 dark:border-gray-700 my-2" />

//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="flex gap-1 items-center text-sm text-gray-700 dark:text-gray-400">
//                   <MdAttachFile />
//                   <span>{(task?.files || []).length}</span>
//                 </div>
//                 <div className="flex gap-1 items-center text-sm text-gray-700 dark:text-gray-400">
//                   <span className="inline-flex items-center">
//                     Sub:
//                     <span className="ml-1">
//                       {numCompletedSubtasks || 0}/{(task?.subtasks || []).length || 0}
//                     </span>
//                   </span>
//                 </div>
//               </div>

//               {/* Assignees (no API): show initials bubbles */}
//               <div className="flex flex-row-reverse">
//                 {assignees.slice(0, 3).map((m, i) => (
//                   <div
//                     key={`${m.initial}-${i}`}
//                     title={m.name}
//                     className={clsx(
//                       "w-7 h-7 rounded-full text-white flex items-center justify-center text-sm -mr-1",
//                       BGS[i % BGS.length]
//                     )}
//                   >
//                     {m.initial}
//                   </div>
//                 ))}
//                 {assignees.length > 3 && (
//                   <div className="w-7 h-7 rounded-full bg-gray-500 text-white flex items-center justify-center text-xs -mr-1">
//                     +{assignees.length - 3}
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="w-full border-t border-gray-300 dark:border-gray-700 my-2" />

//             <div className="flex">
//               <ProgressBar label="Task" percentage={taskProgressPercentage} key={task._id} />
//             </div>

//             {(task?.subtasks || []).length > 0 && (
//               <div className="flex">
//                 <ProgressBar
//                   label="Subtask"
//                   percentage={
//                     (task?.subtasks || []).length > 0
//                       ? (numCompletedSubtasks / task.subtasks.length) * 100
//                       : 0
//                   }
//                 />
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </Draggable>
//   );
// }
