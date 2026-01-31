// components/board/Column.jsx
import { Droppable } from "@hello-pangea/dnd";
import { Task } from "./Task";
import "./styleColumn.css";

export default function Column({
  column,
  index,
  currentBoardData,
  onOpenTask,
  onChanged,
  refetch,
}) {
  const tasks = Array.isArray(column?.tasks) ? column.tasks : [];

  function circle() {
    return index % 2 === 0 ? "bg-cyan-400" : "bg-violet-500";
  }

  return (
    <div className="w-72 md:w-80 flex-shrink-0">
      {/* header outside the droppable */}
      <div className="flex items-center gap-2 mb-3 pt-10 pr-2">
        <div className={`${circle()} h-4 w-4 rounded-full`} />
        <p className="uppercase text-gray-500 font-semibold tracking-wider text-sm">
          {column.columnName} ({tasks.length})
        </p>
      </div>

      <Droppable
        droppableId={String(column._id)}
        direction="vertical"
        isDropDisabled={false}
        isCombineEnabled={false}
        ignoreContainerClipping={false}
        type="TASK"
      >
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="taskList-scroll rounded-md pr-1 pt-1"
            style={{ minHeight: 24 }}
          >
            {tasks.length === 0 && (
              <div className="rounded-lg h-24 border-4 border-dashed border-gray-300 dark:border-zinc-700 mb-2" />
            )}

            {tasks.map((task, i) => (
              <Task
                key={String(task._id)}
                task={task}
                index={i}
                currentBoardData={currentBoardData}
                onOpenTask={onOpenTask}
                onChanged={onChanged}
                refetch={refetch}
              />
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

















// // components/board/Column.jsx
// // import { Droppable } from "react-beautiful-dnd";
// import { Droppable } from "@hello-pangea/dnd";
// import { Task } from "./Task";
// import "./styleColumn.css";

// export default function Column({ 
//   column, 
//   index, 
//   currentBoardData, 
//   onOpenTask, 
//   onChanged,
//   refetch

// }) {
//   const tasks = Array.isArray(column?.tasks) ? column.tasks : [];

//   function circle() {
//     return index % 2 === 0 ? "bg-cyan-400" : "bg-violet-500";
//   }


//   return (
//     // <Droppable droppableId={column._id}>
//     <Droppable
//       droppableId={String(column._id)}
// isDropDisabled={false}
// isCombineEnabled={false}
// ignoreContainerClipping={false}
// type="TASK"
//     >
//       {(provided) => (
//         <div ref={provided.innerRef} {...provided.droppableProps}>
//           <div className="flex items-center gap-2 mb-5 w-60 pt-10">
//             <div className={`${circle()} h-4 w-4 rounded-full`} />
//             <p className="uppercase text-gray-500 font-semibold tracking-wider text-sm">
//               {column.columnName} ({tasks.length})
//             </p>
//           </div>

//           {tasks.length === 0 && (
//             <div className="rounded-lg w-[40vh] border-4 border-dashed border-gray-200 dark:border-zinc-700 custom-container" />
//           )}

//           <div className="w-[40vh]">
//             {tasks.map((task, i) => (
//               <Task
//                 key={String(task._id)}
//                 task={task} 
//                 index={i} 
//                 currentBoardData={currentBoardData} 
//                 onOpenTask={onOpenTask}
//                 onChanged={onChanged}
//                 refetch={refetch}
//                />
//             ))}
//           </div>

//           {provided.placeholder}
//         </div>
//       )}
//     </Droppable>
//   );
// }
