// components/board-card.jsx
import { useState, useMemo, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../form/card.jsx"; // ⬅ CardAction intentionally NOT used
import { Progress } from "../form/progress.jsx";
import { cn } from "../../utils/index.js";
import { getTaskStatusColor } from "../../lib/index.js";
import { CalendarDays, MoreVertical } from "lucide-react";
import CreateEditBoardDialog from "./create-edit-board.jsx";
import { toast } from "sonner";

import { BoardContext } from "../../context/BoardContext";

// 🔁 same utilities used in Workspaces
import SimplePopup from "../../modals/workspace/SimplePopup.jsx";
import { useIsClamped } from "../../hooks/useIsClamped.js";
import { UseDeleteBoard } from "../../hooks/useBoardService.js";

const Confirm = ({ open, title, desc, onCancel, onConfirm, loading }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onMouseDown={onCancel} />
      <div className="relative w-full max-w-sm rounded-lg bg-white p-5 shadow-xl dark:bg-[#2e2e2e]">
        <h3 className="text-lg font-semibold">{title}</h3>
        {desc ? (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-200">{desc}</p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded-md border dark:border-white/20"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
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

export const BoardCard = ({
  board,
  progress = 0,
  projectId,
  workspaceId,
  workspaceMembers = [],
  showActions = true, // jisme 3-dots chahiye
}) => {
  const { setBoards, refetchBoards } = useContext(BoardContext) || {};
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Description clamp + popup (Workspace pattern)
  const [viewOpen, setViewOpen] = useState(false);
  const descRef = useRef(null);
  const hasDesc = !!(board?.description && board.description.trim());
  const isClamped = useIsClamped(descRef, [board?.description]);

  const { mutateAsync: deleteAsync, isPending: deleting } = UseDeleteBoard();

  const tasksCount = useMemo(() => {
    const t = board?.tasks;
    return Array.isArray(t) ? t.length : board?.tasksCount ?? 0;
  }, [board]);

  const dueLabel = useMemo(() => {
    if (!board?.updatedAt) return null;
    try {
      const d = new Date(board.updatedAt);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return null;
    }
  }, [board?.updatedAt]);

  const onDelete = async () => {
    try {
      await deleteAsync({ boardId: board._id, projectId });
      toast.success("board deleted");
      setConfirmOpen(false);
      setBoards?.((prev) =>
        Array.isArray(prev) ? prev.filter((b) => b._id !== board._id) : prev
      );
      await refetchBoards?.();
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to delete board";
      toast.error(msg);
    }
  };

  return (
    <>
      <Card className="relative h-full min-h-[220px] flex flex-col transition-all hover:-translate-y-1 hover:shadow-md hover:shadow-indigo-800 dark:hover:shadow-emerald-500 bg-[#ececec] border-[#ececec] dark:bg-[#2f2f2f] dark:border-[#2f2f2f] cursor-pointer">
        {/* HEADER */}
        <CardHeader className="relative pb-2 pr-12">
          {/* 3-dots pinned top-right */}
          {showActions && (
            <div className="absolute right-3 top-0 z-10">
              <button
                type="button"
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                aria-label="board actions"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onMouseDown={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-8 w-44 rounded-md border bg-white shadow-lg z-50 py-1 dark:bg-[#4f4f4f] dark:border-[#4f4f4f]">
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm dark:hover:bg-[#636363]"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuOpen(false);
                        setEditOpen(true);
                      }}
                    >
                      Edit board
                    </button>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:hover:bg-[#636363]"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuOpen(false);
                        setConfirmOpen(true);
                      }}
                    >
                      Delete board
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* title */}
          <CardTitle className="line-clamp-1 mt-2">{board.boardName}</CardTitle>

        </CardHeader>

        {/* CONTENT */}
        <Link
          to={`/workspaces/${workspaceId}/projects/${projectId}/boards/${board._id}`}
          className="block mt-auto"
        >
          <CardContent className="pt-3 pb-0">
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground ">
                <div className="flex items-center gap-2">
                  <span>{tasksCount}</span>
                  <span>Tasks</span>
                </div>
                <div className="flex items-center gap-3">
                  {/* <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      getTaskStatusColor(board.status)
                    )}
                  >
                    {board.status}
                  </span> */}
                  {dueLabel && (
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      <span>{dueLabel}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>

      {/* EDIT */}
      <CreateEditBoardDialog
        isOpen={editOpen}
        onOpenChange={setEditOpen}
        projectId={projectId}
        projectMembers={workspaceMembers}
        mode="edit"
        initialData={board}
      />

      {/* DELETE CONFIRM */}
      <Confirm
        open={confirmOpen}
        title="Delete board?"
        desc="This will permanently delete the board and its tasks."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onDelete}
        loading={deleting}
      />
    </>
  );
};







































// // components/board-card.jsx
// import { useState, useMemo } from "react";
// import { Link } from "react-router-dom";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "../form/card.jsx";
// import { Progress } from "../form/progress.jsx";
// import { cn } from "../../utils/index.js";
// import { getTaskStatusColor } from "../../lib/index.js";
// import { CalendarDays, MoreVertical } from "lucide-react";
// import CreateboardDialog from "./create-board.jsx";
// import { UseDeleteboard } from "../../hooks/useboardService";
// import { toast } from "sonner";

// // --- small helpers ---
// const kill = (e) => {
//   e.preventDefault?.();
//   e.stopPropagation?.();
// };

// const Dropdown = ({ open, onClose, children }) => {
//   if (!open) return null;
//   return (
//     <>
//       {/* click-away overlay */}
//       <div
//         className="fixed inset-0 z-40"
//         onMouseDown={(e) => {
//           kill(e);
//           onClose?.();
//         }}
//       />
//       <div className="absolute right-0 mt-2 w-44 rounded-md border bg-white shadow-lg z-50 py-1 dark:bg-[#4f4f4f] dark:border-[#4f4f4f]">
//         {children}
//       </div>
//     </>
//   );
// };

// const Confirm = ({ open, title, desc, onCancel, onConfirm, loading }) => {
//   if (!open) return null;
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       <div className="fixed inset-0 bg-black/40" onMouseDown={onCancel} />
//       <div className="relative w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
//         <h3 className="text-lg font-semibold">{title}</h3>
//         {desc ? <p className="mt-2 text-sm text-gray-600">{desc}</p> : null}
//         <div className="mt-4 flex justify-end gap-2">
//           <button type="button" className="px-3 py-1.5 rounded-md border" onClick={onCancel}>
//             Cancel
//           </button>
//           <button
//             type="button"
//             className="px-3 py-1.5 rounded-md bg-red-600 text-white disabled:opacity-50"
//             onClick={onConfirm}
//             disabled={loading}
//           >
//             {loading ? "Deleting..." : "Delete"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export const boardCard = ({
//   board,
//   progress = 0,
//   workspaceId,
//   workspaceMembers = [],
// }) => {
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [editOpen, setEditOpen] = useState(false);
//   const [confirmOpen, setConfirmOpen] = useState(false);

//   const { mutateAsync: deleteAsync, isPending: deleting } = UseDeleteboard();

//   const tasksCount = useMemo(() => {
//     const t = board?.tasks;
//     return Array.isArray(t) ? t.length : (board?.tasksCount ?? 0);
//   }, [board]);

//   const dueLabel = useMemo(() => {
//     if (!board?.dueDate) return null;
//     try {
//       const d = new Date(board.dueDate);
//       const fmt = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
//       return fmt;
//     } catch {
//       return null;
//     }
//   }, [board?.dueDate]);

//   const onDelete = async () => {
//     try {
//       await deleteAsync({ boardId: board._id, workspaceId });
//       toast.success("board deleted");
//       setConfirmOpen(false);
//     } catch (e) {
//       const msg = e?.response?.data?.message || "Failed to delete board";
//       toast.error(msg);
//     }
//   };

//   return (
//     <>
//       {/* <Card className="relative transition-all duration-300 hover:shadow-md hover:translate-y-1"> */}
//        <Card className="relative h-full min-h-[220px] flex flex-col transition-all hover:shadow-md hover:-translate-y-1 hover:shadow-emerald-500 bg-[#e2e2e2] border-[#e2e2e2] dark:bg-[#3c3c3c] dark:border-[#3c3c3c]">
//         {/* clickable area ONLY (not including menu) */}
//         <Link
//           to={`/workspaces/${workspaceId}/boards/${board._id}`}
//           className="block"
//         >
//           <CardHeader>
//             <div className="flex items-start justify-between pr-10">
//               <CardTitle className="line-clamp-1">{board.title}</CardTitle>
//               {/* spacer for the absolute menu button */}
//             </div>
//             <CardDescription className="line-clamp-2">
//               {board.description || "No description"}
//             </CardDescription>
//           </CardHeader>

//           <CardContent>
//             <div className="space-y-4">
//               <div className="space-y-1">
//                 <div className="flex justify-between text-xs">
//                   <span>Progress</span>
//                   <span>{progress}%</span>
//                 </div>
//                 <Progress value={progress} className="h-2" />
//               </div>

//               <div className="flex items-center justify-between text-xs text-muted-foreground">
//                 <div className="flex items-center gap-2">
//                   <span>{tasksCount}</span>
//                   <span>Tasks</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <span
//                     className={cn(
//                       "rounded-full px-2 py-0.5 text-xs",
//                       getTaskStatusColor(board.status)
//                     )}
//                   >
//                     {board.status}
//                   </span>
//                   {dueLabel && (
//                     <div className="flex items-center gap-1">
//                       <CalendarDays className="h-4 w-4" />
//                       <span>{dueLabel}</span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Link>

//         {/* 3-dot menu button — outside the Link, absolutely positioned */}
//         <div
//           className="absolute right-3 top-3"
//           onMouseDown={kill}
//           onClick={kill}
//           role="presentation"
//         >
//           <button
//             type="button"
//             className="p-1 rounded hover:bg-gray-100"
//             aria-haspopup="menu"
//             aria-expanded={menuOpen}
//             aria-label="board actions"
//             onMouseDown={kill}
//             onClick={(e) => {
//               kill(e);
//               setMenuOpen((v) => !v);
//             }}
//           >
//             <MoreVertical className="h-5 w-5" />
//           </button>

//           <div className="relative ">
//             <Dropdown open={menuOpen} onClose={() => setMenuOpen(false)}>
//               <button
//                 type="button"
//                 className="w-full px-4 py-2 text-left text-sm dark:hover:bg-[#636363]"
//                 onClick={(e) => {
//                   kill(e);
//                   setMenuOpen(false);
//                   setEditOpen(true);
//                 }}
//               >
//                 Edit board
//               </button>
//               <button
//                 type="button"
//                 className="w-full px-4 py-2 text-left text-sm text-red-600 dark:hover:bg-[#636363]"
//                 onClick={(e) => {
//                   kill(e);
//                   setMenuOpen(false);
//                   setConfirmOpen(true);
//                 }}
//               >
//                 Delete board
//               </button>
//             </Dropdown>
//           </div>
//         </div>
//       </Card>

//       {/* Edit dialog (same create modal, prefilled) */}
//       <CreateboardDialog
//         isOpen={editOpen}
//         onOpenChange={setEditOpen}
//         workspaceId={workspaceId}
//         workspaceMembers={workspaceMembers}
//         mode="edit"
//         initialData={board}
//       />

//       {/* Delete confirmation */}
//       <Confirm
//         open={confirmOpen}
//         title="Delete board?"
//         desc="This will permanently delete the board and its tasks."
//         onCancel={() => setConfirmOpen(false)}
//         onConfirm={onDelete}
//         loading={deleting}
//       />
//     </>
//   );
// };

























// import { Link } from "react-router-dom"
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle
// } from "../form/card.jsx"
// import { cn } from "../../utils/index.js"
// import { getTaskStatusColor } from "../../lib/index.js"
// import { Progress } from "../form/progress.jsx"
// import { format } from "date-fns"
// import { CalendarDays } from "lucide-react"

// export const boardCard = ({ board, progress, workspaceId }) => {
//   return (
//     <Link to={`/workspaces/${workspaceId}/boards/${board._id}`}>
//       <Card className="transition-all duration-300 hover:shadow-md hover:translate-y-1">
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <CardTitle>{board.title}</CardTitle>
//             <span
//               className={cn(
//                 "text-xs rounded-full",
//                 getTaskStatusColor(board.status)
//               )}
//             >
//               {board.status}
//             </span>
//           </div>
//           <CardDescription className="line-clamp-2">
//             {board.description || "No description"}
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             <div className="space-y-1">
//               <div className="flex justify-between text-xs">
//                 <span>Progress</span>
//                 <span>{progress}%</span>
//               </div>

//               <Progress value={progress} className="h-2" />
//             </div>

//             <div className="flex items-center justify-between">
//               <div className="flex items-center text-sm gap-2 text-muted-foreground">
//                 <span>{board.tasks.length}</span>
//                 <span>Tasks</span>
//               </div>

//               {board.dueDate && (
//                 <div className="flex items-center text-xs text-muted-foreground">
//                   <CalendarDays className="w-4 h-4" />
//                   <span>{format(board.dueDate, "MMM d, yyyy")}</span>
//                 </div>
//               )}
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </Link>
//   )
// }
