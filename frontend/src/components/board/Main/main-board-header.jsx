import { useState } from "react";
import { ArrowLeft, Edit, MoreVertical, PlusIcon } from "lucide-react";
import { Button } from "../../form/Button";

/**
 * Props:
 *  - title?: string
 *  - onBack: () => void
 *  - onAddColumn: () => void
 *  - onAddTask: () => void
 */
export default function MainBoardHeader({
  title = "Board",
  onBack,
  onAddColumn,
  onAddTask,
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-lg min-h-[56px]">
          {/* LEFT */}
          <div className="flex items-center gap-3 min-w-0 grow">
            <button
              type="button"
              onClick={onBack}
              className="h-9 w-9 inline-flex items-center justify-center rounded-md
                         text-neutral-700 hover:bg-black/10
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                         dark:text-neutral-200 dark:hover:bg-white/10"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <h2 className="text-xl md:text-2xl font-semibold truncate leading-none text-black dark:text-white">
              {title}
            </h2>
          </div>

          {/* RIGHT — desktop buttons */}
          <div className="hidden sm:flex items-center gap-3 shrink-0 h-10">
            <Button
              onClick={onAddColumn}
              className="h-10 px-3 py-0 w-auto inline-flex items-center leading-none whitespace-nowrap mt-0"
            >
              <Edit className="mr-2 h-5 w-5" />
              Edit Columns
            </Button>

            <Button
              onClick={onAddTask}
              className="h-10 px-3 py-0 w-auto inline-flex items-center leading-none whitespace-nowrap mt-0"
            >
              <PlusIcon className="mr-2 h-5 w-5" />
              Add Task
            </Button>
          </div>

          {/* RIGHT — mobile kebab */}
          <KebabActions
            onEditColumns={onAddColumn}
            onAddTask={onAddTask}
            className="sm:hidden"
          />
        </div>
      </div>
    </div>
  );
}

function KebabActions({ onEditColumns, onAddTask, className = "" }) {
  const [open, setOpen] = useState(false);

  const kill = (e) => {
    e.preventDefault?.();
    e.stopPropagation?.();
  };

  return (
    <div className={`relative shrink-0 h-10 ${className}`}>
      <button
        type="button"
        aria-label="More actions"
        aria-expanded={open}
        className="h-10 w-10 inline-flex items-center justify-center rounded-md
                   text-neutral-700 hover:bg-black/10
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                   dark:text-neutral-200 dark:hover:bg-white/10"
        onClick={(e) => {
          kill(e);
          setOpen((v) => !v);
        }}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onMouseDown={() => setOpen(false)}
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            aria-orientation="vertical"
            className="absolute right-0 top-full mt-0 z-50 w-48 rounded-xl p-1
                       origin-top-right
                       bg-white text-neutral-800 shadow-lg ring-1 ring-black/5 border border-neutral-200
                       dark:bg-neutral-800 dark:text-neutral-100 dark:ring-white/10 dark:border-neutral-700"
            onClick={kill}
          >
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-sm rounded-md inline-flex items-center gap-2
                         hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                         dark:hover:bg-neutral-700"
              onClick={() => {
                setOpen(false);
                onEditColumns?.();
              }}
            >
              <Edit className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              Edit Columns
            </button>

            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-sm rounded-md inline-flex items-center gap-2
                         hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                         dark:hover:bg-neutral-700"
              onClick={() => {
                setOpen(false);
                onAddTask?.();
              }}
            >
              <PlusIcon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              Add Task
            </button>
          </div>
        </>
      )}
    </div>
  );
}























// // components/board/main-board-header.jsx
// import { ArrowLeft, Edit, Plus, PlusIcon } from "lucide-react";
// import { Button } from "../../form/Button";

// export default function MainBoardHeader({
//   title = "Board",
//   onBack,
//   onAddColumn,
//   onAddTask,

// }) {
//   return (
//     <div className="w-full px-4 flex items-center justify-between rounded-lg text-black dark:text-white">
//       {/* LEFT */}
//       <div className="flex items-center gap-3 min-w-0">
//         <button
//           type="button"
//           onClick={onBack}
//           className="h-9 w-9 inline-flex items-center justify-center rounded-md
//                      text-neutral-700 hover:bg-black/10
//                      focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
//                      dark:text-neutral-200 dark:hover:bg-white/10"
//           aria-label="Back"
//         >
//           <ArrowLeft className="h-5 w-5" />
//         </button>

//         <h2 className="text-lg md:text-xl font-semibold truncate leading-none">
//           {title}
//         </h2>
//       </div>

//       {/* RIGHT */}
//       <div className="ml-auto flex items-center gap-2 flex-nowrap">
//         <Button
//           onClick={onAddColumn}
//           className="h-10 px-3 inline-flex items-center gap-2 whitespace-nowrap w-auto max-w-none mt-0"
//         >
//           <Edit className="h-5 w-5" />
//           <span className="block whitespace-nowrap">Edit&nbsp;Column</span>
//         </Button>

//         <Button
//           onClick={onAddTask}
//           className="h-10 px-3 inline-flex items-center gap-2 whitespace-nowrap w-auto max-w-none  mt-0"
//         >
//           <PlusIcon className="h-5 w-5" />
//           <span className="block whitespace-nowrap">Add Task</span>
//         </Button>
//       </div>


     
//     </div>
//   );
// }
