import { useContext, useState } from "react";
import "./styleColumn.css";
import { BoardContext } from "../../../context/BoardContext";
import AddNewColumnsModal from "../../../modals/board/AddNewColumnsModal";

export default function NewColumn() {
  const [open, setOpen] = useState(false);
  const { currentBoard } = useContext(BoardContext) || {};

  return (
    <>
      {/* <div className="rounded-lg bg-gray-300 dark:bg-zinc-700 mt-20 custom-container ">
        <div className="text-gray-500 hover:text-slate-100 mx-10 text-center w-44 font-semibold text-xl "> */}
        <div className="rounded-lg bg-gray-300 dark:bg-zinc-700 mt-20 custom-container flex items-center justify-center ">
  <div className="text-gray-500 hover:text-slate-100 text-center font-semibold text-xl w-44 mx-10">
          <button
            onClick={() => setOpen(true)}
            disabled={!currentBoard}
            title={!currentBoard ? "Select a board first" : "Add / Edit Columns"}
           
          >
            + New Column
          </button>
        </div>
      </div>

      {open && currentBoard && (
        <AddNewColumnsModal
          isOpen={open}
          onOpenChange={setOpen}
          board={currentBoard}
          projectId={currentBoard?.projectId || currentBoard?.project?.toString?.()}
        />
      )}
    </>
  );
}
