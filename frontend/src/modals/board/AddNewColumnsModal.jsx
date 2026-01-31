// components/board/AddNewColumnsModal.jsx
import React, { useContext, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import ModalShell from "../../components/form/ModalShell";
import { Button } from "../../components/form/Button";
import { UseUpdateBoardColumns } from "../../hooks/useBoardService";
import { toast } from "sonner";
import { BoardContext } from "../../context/BoardContext";


export default function AddNewColumnsModal({ isOpen, onOpenChange, board, projectId }) {
  const { mutateAsync: updateCols, isPending } = UseUpdateBoardColumns();
  const { setBoards, setCurrentBoard } = useContext(BoardContext) || {};

  const { control, register, handleSubmit, reset } = useForm({
    defaultValues: { columns: [{ columnName: "" }] },
  });
  const { fields, append, remove, replace } = useFieldArray({ control, name: "columns" });

  useEffect(() => {
    if (!isOpen) return;
    const cols =
      Array.isArray(board?.columns) && board.columns.length
        ? board.columns.map((c) => ({ columnName: c.columnName ?? "" }))
        : [{ columnName: "" }];
    replace(cols);
    reset({ columns: cols });
  }, [isOpen, board?._id]); // eslint-disable-line

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [isOpen]);

  const onSubmit = async (values) => {
    try {
      // mutate -> server update -> fresh board fetch -> returns `freshBoard`
      const freshBoard = await updateCols({
        boardId: board?._id,
        columns: values.columns,
      });

      // Context/state ko sirf wahi single fresh board se patch karo (no refetch)
      if (freshBoard) {
        setBoards?.((prev) =>
          Array.isArray(prev)
            ? prev.map((b) => (String(b._id) === String(freshBoard._id) ? freshBoard : b))
            : prev
        );
        setCurrentBoard?.((prev) =>
          prev && String(prev._id) === String(freshBoard._id) ? freshBoard : prev
        );
      }

      toast.success("Columns updated");
      onOpenChange?.(false);
      reset();
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to update columns";
      toast.error(msg);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={() => onOpenChange?.(false)}
      title="Edit Columns"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
          <Button type="submit" form="columns-only-form" isLoading={isPending}>
            Save Columns
          </Button>
        </div>
      }
    >
      <form id="columns-only-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-neutral-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
            <thead className="bg-gray-50 dark:bg-neutral-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">#</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Column Name</th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
              {fields.map((row, idx) => (
                <tr key={row.id} className="bg-white dark:bg-neutral-900">
                  <td className="px-4 py-2 text-sm w-12">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <input
                      {...register(`columns.${idx}.columnName`, { required: true })}
                      placeholder={idx === 0 ? "Backlog" : idx === 1 ? "In Progress" : "Review / Done"}
                      className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => append({ columnName: "" })}
                    className="text-emerald-600 hover:underline text-sm"
                  >
                    + Add Column
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </form>
    </ModalShell>
  );
}

























// import React, { useEffect } from "react";
// import { useForm, useFieldArray } from "react-hook-form";
// import ModalShell from "../../components/form/ModalShell";
// import { Button } from "../../components/form/Button";
// import { UseUpdateBoardColumns } from "../../hooks/useBoardService";
// import { toast } from "sonner";

// /**
//  * Props:
//  *  - isOpen
//  *  - onOpenChange
//  *  - board       -> current board object { _id, columns, projectId? }
//  *  - projectId   -> parent project (for invalidation/refetch)
//  */
// export default function AddNewColumnsModal({ isOpen, onOpenChange, board, projectId }) {
//   const { mutateAsync: updateCols, isPending } = UseUpdateBoardColumns();

//   const { control, register, handleSubmit, reset } = useForm({
//     defaultValues: {
//       columns: [{ columnName: "" }],
//     },
//   });

//   const { fields, append, remove, replace } = useFieldArray({
//     control,
//     name: "columns",
//   });

//   // Prefill with existing columns when open
//   useEffect(() => {
//     if (!isOpen) return;
//     const cols = Array.isArray(board?.columns) && board.columns.length
//       ? board.columns.map((c) => ({ columnName: c.columnName ?? "" }))
//       : [{ columnName: "" }];
//     replace(cols);
//   }, [isOpen, board?._id]); // eslint-disable-line

//   // Lock scroll
//   useEffect(() => {
//     document.body.style.overflow = isOpen ? "hidden" : "auto";
//     return () => (document.body.style.overflow = "auto");
//   }, [isOpen]);

//   const onSubmit = async (values) => {
//     try {
//       await updateCols({
//         boardId: board?._id,
//         columns: values.columns,
//         projectId,
//       });
//       toast.success("Columns updated");
//       onOpenChange?.(false);
//       reset();
//     } catch (e) {
//       const msg = e?.response?.data?.message || "Failed to update columns";
//       toast.error(msg);
//     }
//   };

//   return (
//     <ModalShell
//       isOpen={isOpen}
//       onClose={() => onOpenChange?.(false)}
//       title="Edit Columns"
//       footer={
//         <div className="flex items-center justify-end gap-2">
//           <Button variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
//           <Button type="submit" form="columns-only-form" isLoading={isPending}>
//             Save Columns
//           </Button>
//         </div>
//       }
//     >
//       <form id="columns-only-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//         <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-neutral-700">
//           <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
//             <thead className="bg-gray-50 dark:bg-neutral-800">
//               <tr>
//                 <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">#</th>
//                 <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Column Name</th>
//                 <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
//               {fields.map((row, idx) => (
//                 <tr key={row.id} className="bg-white dark:bg-neutral-900">
//                   <td className="px-4 py-2 text-sm w-12">{idx + 1}</td>
//                   <td className="px-4 py-2">
//                     <input
//                       {...register(`columns.${idx}.columnName`, { required: true })}
//                       placeholder={idx === 0 ? "Backlog" : idx === 1 ? "In Progress" : "Review / Done"}
//                       className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
//                     />
//                   </td>
//                   <td className="px-4 py-2 text-right">
//                     <button
//                       type="button"
//                       onClick={() => remove(idx)}
//                       className="text-red-600 hover:underline text-sm"
//                     >
//                       Remove
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//               <tr>
//                 <td colSpan={3} className="px-4 py-3">
//                   <button
//                     type="button"
//                     onClick={() => append({ columnName: "" })}
//                     className="text-emerald-600 hover:underline text-sm"
//                   >
//                     + Add Column
//                   </button>
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </form>
//     </ModalShell>
//   );
// }
