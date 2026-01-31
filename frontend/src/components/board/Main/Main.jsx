// components/board/Main/Main.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import Column from "./Column";
import NewColumn from "./NewColumn";
import "./styles.css";
import { UseMoveTaskStatus } from "../../../hooks/useTaskService";


export default function Main({ currentBoard, onChanged, onOpenTask, refetch }) {
  const [columns, setColumns] = useState([]);
  const [syncPaused, setSyncPaused] = useState(false);        // pause props→state sync while dragging/saving

  // const { mutateAsync: updateTaskAsync } = UseUpdateTask?.() || { mutateAsync: async () => {} };
  const { mutateAsync: moveStatusAsync } = UseMoveTaskStatus?.() || { mutateAsync: async () => {} };
  
  
  const currentBoardId = currentBoard?._id ?? "";
  const currentBoardCols = currentBoard?.columns
  const columnsLen = currentBoardCols.length;

  // keep local state in sync with props unless paused
  useEffect(() => {
    if (syncPaused) return;
    setColumns(currentBoardCols);
  }, [currentBoardId, columnsLen, currentBoardCols, syncPaused]);

  const columnElements = useMemo(
    () =>
      (columns || []).map((column, index) => (
        <Column
          key={String(column._id)}
          column={column}
          index={index}
          currentBoardData={currentBoard}
          onOpenTask={onOpenTask}
          onChanged={onChanged}
          refetch={refetch}
        />
      )),
    [columns, currentBoard, onOpenTask, onChanged, refetch]
  );

  const onDragStart = () => {
    setSyncPaused(true);       // lock local state so it doesn’t get overwritten by old props
  };

  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination) {
      setSyncPaused(false);
      return;
    }
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      setSyncPaused(false);
      return;
    }

    const getId = (c) => String(c?._id ?? c?.columnName);
    const start = columns.find((c) => getId(c) === String(source.droppableId));
    const end   = columns.find((c) => getId(c) === String(destination.droppableId));
    if (!start || !end) {
      setSyncPaused(false);
      return;
    }

    // optimistic local update
    if (start === end) {
      const list = Array.from(start.tasks || []);
      const [moved] = list.splice(source.index, 1);
      list.splice(destination.index, 0, moved);
      const newStart = { ...start, tasks: list };
      setColumns((prev) =>
        prev.map((c) => (String(getId(c)) === String(getId(start)) ? newStart : c))
      );
    } else {
      const startList = Array.from(start.tasks || []);
      const [moved] = startList.splice(source.index, 1);

      const endList = Array.from(end.tasks || []);
      endList.splice(destination.index, 0, { ...moved, status: end.columnName });

      const newStart = { ...start, tasks: startList };
      const newEnd   = { ...end, tasks: endList };

      setColumns((prev) =>
        prev.map((c) => {
          const id = getId(c);
          if (id === getId(start)) return newStart;
          if (id === getId(end))   return newEnd;
          return c;
        })
      );
    }

    console.log("currentBoard?.workspaceId=", currentBoard?.workspaceId);
    console.log("currentBoard?.projectId=", currentBoard?.projectId);
    // persist to server, then resume sync after refetch
    try {
      const movedTaskId = String(draggableId);
      const destCol = columns.find((c) => getId(c) === String(destination.droppableId));
      const newStatus = destCol?.columnName;

      if (newStatus && moveStatusAsync) {
        await moveStatusAsync({
          taskId: movedTaskId,
          status: newStatus,
          boardId: currentBoard?._id,
          projectId: currentBoard?.projectId,
          workspaceId: currentBoard?.workspaceId,
        });
      }

      // let parent refresh board data
      onChanged?.();
      // if you rely on refetch to update currentBoard.props, await it if it returns a promise
      const maybePromise = refetch?.();
      if (maybePromise?.then) {
        await maybePromise;
      }
    } catch {
      // on error you can refetch to rollback to server truth
      refetch?.();
    } finally {
      // small microtask delay so new props land before re-enabling sync
      setTimeout(() => setSyncPaused(false), 0);
    }
  };

  // optional drag-to-scroll helpers
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const isFromDraggable = (e) => {
    const el = e.target;
    if (el.closest('[data-rbd-drag-handle-draggable-id]')) return true;
    if (el.closest('.task-card')) return true;
    return false;
  };

  const handleMouseDown = (e) => {
    if (syncPaused) return;
    if (isFromDraggable(e)) return;
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (syncPaused) return;
    if (isFromDraggable(e)) return;
    if (!isDragging || !containerRef.current) return;
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      className="boardScroll-x flex gap-8 pl-10 pr-20 flex-1 custom-scroll-x-visible custom-scroll"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-8 md:pr-16 pr-10">
          {columnElements}
          <NewColumn />
        </div>
      </DragDropContext>
    </div>
  );
}


























// // components/board/Main/Main.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { DragDropContext } from "@hello-pangea/dnd";
// import Column from "./Column";
// import NewColumn from "./NewColumn";
// import "./styles.css";
// import { UseUpdateTask } from "../../../hooks/useTaskService";

// export default function Main({ currentBoard, onChanged, onOpenTask, refetch }) {
//   const [columns, setColumns] = useState([]);
//   const [rbdDragging, setRbdDragging] = useState(false);

//   const { mutateAsync: updateTaskAsync } = UseUpdateTask?.() || { mutateAsync: async () => {} };

//   const currentBoardId = currentBoard?._id ?? "";
//   const currentBoardCols = Array.isArray(currentBoard?.columns) ? currentBoard.columns : [];
//   const columnsLen = currentBoardCols.length;

//   useEffect(() => {
//     if (rbdDragging) return;
//     setColumns(currentBoardCols);
//   }, [currentBoardId, columnsLen, rbdDragging]);

//   const columnElements = useMemo(
//     () =>
//       (columns || []).map((column, index) => (
//         <Column
//           key={String(column._id)}
//           column={column}
//           index={index}
//           currentBoardData={currentBoard}
//           onOpenTask={onOpenTask}
//           onChanged={onChanged}
//           refetch={refetch}
//         />
//       )),
//     [columns, currentBoard, onOpenTask, onChanged, refetch]
//   );

//   const onDragStart = () => setRbdDragging(true);

//   const onDragEnd = async ({ source, destination, draggableId }) => {
//     setRbdDragging(false);
//     if (!destination) return;
//     if (source.droppableId === destination.droppableId && source.index === destination.index) return;

//     const getId = (c) => String(c?._id ?? c?.columnName);
//     const start = columns.find((c) => getId(c) === String(source.droppableId));
//     const end = columns.find((c) => getId(c) === String(destination.droppableId));
//     if (!start || !end) return;

//     if (start === end) {
//       const list = Array.from(start.tasks || []);
//       const [moved] = list.splice(source.index, 1);
//       list.splice(destination.index, 0, moved);
//       const newStart = { ...start, tasks: list };
//       setColumns((prev) => prev.map((c) => (c === start ? newStart : c)));
//     } else {
//       const startList = Array.from(start.tasks || []);
//       const [moved] = startList.splice(source.index, 1);
//       const endList = Array.from(end.tasks || []);
//       endList.splice(destination.index, 0, { ...moved, status: end.columnName });
//       const newStart = { ...start, tasks: startList };
//       const newEnd = { ...end, tasks: endList };
//       setColumns((prev) => prev.map((c) => (c === start ? newStart : c === end ? newEnd : c)));
//     }

//     try {
//       const movedTaskId = String(draggableId);
//       const destCol = columns.find((c) => getId(c) === String(destination.droppableId));
//       const newStatus = destCol?.columnName;
//       if (newStatus && updateTaskAsync) {
//         await updateTaskAsync({
//           taskId: movedTaskId,
//           status: newStatus,
//           boardId: currentBoard?._id,
//           projectId: currentBoard?.projectId,
//           workspaceId: currentBoard?.workspaceId,
//         });
//       }
//       onChanged?.();
//       refetch?.();
//     } catch {
//       // ignore
//     }
//   };

//   // drag-to-scroll
//   const containerRef = useRef(null);
//   const [isDragging, setIsDragging] = useState(false);
//   const [startX, setStartX] = useState(0);
//   const [scrollLeft, setScrollLeft] = useState(0);

//   const isFromDraggable = (e) => {
//   const el = e.target;
//   // ignore if inside a drag handle
//   if (el.closest('[data-rbd-drag-handle-draggable-id]')) return true;
//   // or if inside our task card wrapper
//   if (el.closest('.task-card')) return true;
//   return false;
// };

//   const handleMouseDown = (e) => {
//     if (rbdDragging) return;      // block while dragging a card
//     if (isFromDraggable(e)) return;    
//     if (!containerRef.current) return;
//     setIsDragging(true);
//     setStartX(e.pageX - containerRef.current.offsetLeft);
//     setScrollLeft(containerRef.current.scrollLeft);
//   };

//   const handleMouseMove = (e) => {
//     if (rbdDragging) return;      // block while dragging a card
//     if (isFromDraggable(e)) return;   
//     if (!isDragging || !containerRef.current) return;
//     const x = e.pageX - containerRef.current.offsetLeft;
//     const walk = (x - startX) * 2;
//     containerRef.current.scrollLeft = scrollLeft - walk;
//   };

//   const handleMouseUp = () => setIsDragging(false);

//   return (
//     <div
//       ref={containerRef}
//       className="boardScroll-x flex gap-8 pl-10 pr-20 flex-1 custom-scroll-x-visible"
//       onMouseDown={handleMouseDown}
//       onMouseMove={handleMouseMove}
//       onMouseUp={handleMouseUp}
//       onMouseLeave={handleMouseUp}
//     >
//       <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
//         <div className="flex gap-8 md:pr-16">
//           {columnElements}
//           <NewColumn />
//         </div>
//       </DragDropContext>
//     </div>
//   );
// }


























// // components/board/Main/Main.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { DragDropContext } from "@hello-pangea/dnd";
// import Column from "./Column";
// import NewColumn from "./NewColumn";
// import "./styles.css";
// import { UseUpdateTask } from "../../../hooks/useTaskService";

// export default function Main({ currentBoard, onChanged, onOpenTask, refetch }) {
//   const [columns, setColumns] = useState([]);
//   const [rbdDragging, setRbdDragging] = useState(false);

//   const { mutateAsync: updateTaskAsync } = UseUpdateTask?.() || { mutateAsync: async () => {} };

//   const currentBoardId = currentBoard?._id ?? "";
//   const currentBoardCols = Array.isArray(currentBoard?.columns) ? currentBoard.columns : [];
//   const columnsLen = currentBoardCols.length;

//   useEffect(() => {
//     if (rbdDragging) return;
//     setColumns(currentBoardCols);
//   }, [currentBoardId, columnsLen, rbdDragging]);

//   const columnElements = useMemo(
//     () =>
//       (columns || []).map((column, index) => (
//         <Column
//           key={String(column._id)}
//           column={column}
//           index={index}
//           currentBoardData={currentBoard}
//           onOpenTask={onOpenTask}
//           onChanged={onChanged}
//           refetch={refetch}
//         />
//       )),
//     [columns, currentBoard, onOpenTask, onChanged, refetch]
//   );

//   const onDragStart = () => setRbdDragging(true);

//   const onDragEnd = async ({ source, destination, draggableId }) => {
//     setRbdDragging(false);
//     if (!destination) return;
//     if (source.droppableId === destination.droppableId && source.index === destination.index) return;

//     const getId = (c) => String(c?._id ?? c?.columnName);
//     const start = columns.find((c) => getId(c) === String(source.droppableId));
//     const end = columns.find((c) => getId(c) === String(destination.droppableId));
//     if (!start || !end) return;

//     if (start === end) {
//       const list = Array.from(start.tasks || []);
//       const [moved] = list.splice(source.index, 1);
//       list.splice(destination.index, 0, moved);
//       const newStart = { ...start, tasks: list };
//       setColumns((prev) => prev.map((c) => (c === start ? newStart : c)));
//     } else {
//       const startList = Array.from(start.tasks || []);
//       const [moved] = startList.splice(source.index, 1);
//       const endList = Array.from(end.tasks || []);
//       endList.splice(destination.index, 0, { ...moved, status: end.columnName });
//       const newStart = { ...start, tasks: startList };
//       const newEnd = { ...end, tasks: endList };
//       setColumns((prev) => prev.map((c) => (c === start ? newStart : c === end ? newEnd : c)));
//     }

//     try {
//       const movedTaskId = String(draggableId);
//       const destCol = columns.find((c) => getId(c) === String(destination.droppableId));
//       const newStatus = destCol?.columnName;
//       if (newStatus && updateTaskAsync) {
//         await updateTaskAsync({
//           taskId: movedTaskId,
//           status: newStatus,
//           boardId: currentBoard?._id,
//           projectId: currentBoard?.projectId,
//           workspaceId: currentBoard?.workspaceId,
//         });
//       }
//       onChanged?.();
//       refetch?.();
//     } catch {
//       // ignore errors here; user can manually refresh if needed
//     }
//   };

//   return (
//     <div
//       className="boardScroll-x flex gap-8 pl-10 pr-20 flex-1 custom-scroll-x-visible"
//     >
//       <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
//         <div className="flex gap-8 md:pr-16">
//           {columnElements}
//           <NewColumn />
//         </div>
//       </DragDropContext>
//     </div>
//   );
// }





























// // components/board/Main/Main.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { DragDropContext } from "react-beautiful-dnd";
// import Column from "./Column";
// import NewColumn from "./NewColumn";
// import "./styles.css";
// import { useSelector, useDispatch } from "react-redux";
// import { UseUpdateTask } from "../../../hooks/useTaskService"; 

// export default function Main({
//   currentBoard,
//   onChanged,
//   onOpenTask,
//   refetch
// }) {
//   const [columns, setColumns] = useState([]);

//   // ✅ extract primitives so deps stay simple & stable
//   const currentBoardId   = currentBoard?._id ?? "";
//   const currentBoardCols = currentBoard?.columns;
//   const columnsLen       = Array.isArray(currentBoardCols) ? currentBoardCols.length : 0;

//    const { mutateAsync: updateTaskAsync } = UseUpdateTask();

//   // keep local state in sync with the selected board’s columns (even when same board updates)
//   useEffect(() => {
//     const next = Array.isArray(currentBoardCols) ? currentBoardCols : [];
//     setColumns(next);
//   }, [currentBoardId, currentBoardCols, columnsLen]);

//   // ✅ memo uses only primitives; no object spread → lint is happy
//   const columnElements = useMemo(
//     () =>
//       (columns || []).map((column, index) => (
//         <Column
//           key={column._id}
//           column={column}
//           index={index}
//           currentBoardData={currentBoard}
//           onOpenTask={onOpenTask}
//           onChanged={onChanged}
//           refetch={refetch}
//         />
//       )),
//     [columns, currentBoard, onOpenTask, onChanged, refetch]
//   );

//   const onDragEnd = ({ source, destination }) => {
//     if (!destination) return;
//     if (source.droppableId === destination.droppableId && source.index === destination.index) return;

//     const idOf = (c) => String(c?._id ?? c?.columnName);
//     const start = columns.find((c) => idOf(c) === source.droppableId);
//     const end   = columns.find((c) => idOf(c) === destination.droppableId);
//     if (!start || !end) return;

//     if (start === end) {
//       const list = Array.from(start.tasks || []);
//       const [moved] = list.splice(source.index, 1);
//       list.splice(destination.index, 0, moved);
//       const newStart = { ...start, tasks: list };
//       setColumns((prev) => prev.map((c) => (c === start ? newStart : c)));
//     } else {
//       const startList = Array.from(start.tasks || []);
//       const [moved] = startList.splice(source.index, 1);

//       const endList = Array.from(end.tasks || []);
//       endList.splice(destination.index, 0, { ...moved, status: end.columnName });

//       const newStart = { ...start, tasks: startList };
//       const newEnd   = { ...end, tasks: endList };

//       setColumns((prev) => prev.map((c) => (c === start ? newStart : c === end ? newEnd : c)));
//     }
//   };


//   // drag-scroll
//   const containerRef = useRef(null);
//   const [isDragging, setIsDragging] = useState(false);
//   const [startX, setStartX] = useState(0);
//   const [scrollLeft, setScrollLeft] = useState(0);

//   const handleMouseDown = (e) => {
//     setIsDragging(true);
//     setStartX(e.pageX - containerRef.current.offsetLeft);
//     setScrollLeft(containerRef.current.scrollLeft);
//   };
//   const handleMouseMove = (e) => {
//     if (!isDragging) return;
//     const x = e.pageX - containerRef.current.offsetLeft;
//     const walk = (x - startX) * 2;
//     containerRef.current.scrollLeft = scrollLeft - walk;
//   };
//   const handleMouseUp = () => setIsDragging(false);

//   return (
//     <div
//       ref={containerRef}
//       className="flex gap-5 pl-10 pr-20 flex-1 overflow-x-auto custom-scroll-x-visible"
//       onMouseDown={handleMouseDown}
//       onMouseMove={handleMouseMove}
//       onMouseUp={handleMouseUp}
//       onMouseLeave={handleMouseUp}
//     >
//       <DragDropContext onDragEnd={onDragEnd}>
//         <div className="flex gap-8 pr-10 md:pr-16">
//           {columnElements}
//           <NewColumn />
//         </div>
//       </DragDropContext>
//     </div>
//   );
// }
