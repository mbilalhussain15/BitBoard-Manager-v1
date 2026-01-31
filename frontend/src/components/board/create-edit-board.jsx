// components/board/create-edit-board.jsx
import React, { useContext, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ModalShell from "../form/ModalShell";
import { Button } from "../form/Button";
import { InputField } from "../form/InputField";
import TeamMembersDropdown from "../form/dropdown/TeamMembersDropdown";
import { UseCreateBoard, UseUpdateBoard } from "../../hooks/useBoardService";
import { toast } from "sonner";
import { BoardContext } from "../../context/BoardContext";
// OPTIONAL: if you have a zod schema for board, plug it here
// import { boardSchema } from "../../lib/schema";

export default function CreateEditBoardDialog({
  isOpen,
  onOpenChange,
  mode = "create",          // "create" | "edit"
  projectId = null,         // required for "create" (board is under a project)
  projectMembers = [],      // same shape as used in project form
  initialData = null,       // when editing: {_id, boardName, columns:[{columnName}], members:[...]} (old data may have teamMemberIDs)
}) {


  const boardCtx = useContext(BoardContext) || {};
  const { refetchBoards, setBoards } = boardCtx;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: /* boardSchema ? zodResolver(boardSchema) : */ undefined,
    defaultValues: {
      boardName: "",
      columns: [{ columnName: "" }],
      members: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "columns" });

  const membersValue = watch("members") || [];


  const setMembers = (next) =>
    setValue("members", next, { shouldValidate: true, shouldDirty: true });

  const { mutateAsync: createAsync = async () => {}, isPending: createPending = false } =
    (typeof UseCreateBoard === "function" && UseCreateBoard()) || {};

  const { mutateAsync: updateAsync = async () => {}, isPending: updatePending = false } =
    (typeof UseUpdateBoard === "function" && UseUpdateBoard()) || {};

  // Lock body scroll similar to your other modals
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [isOpen]);

  // When opening: prefill for edit, reset for create
  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && initialData) {
      // Prefer same shape as project: initialData.members (objects)
      // Fallback: if only teamMemberIDs exist, map them to objects from projectMembers
      const fallbackFromIds = () => {
        const ids = Array.isArray(initialData?.teamMemberIDs) ? initialData.teamMemberIDs : [];
        if (!ids.length) return [];
        return (projectMembers || []).filter(
          (m) => ids.includes(m?._id) || ids.includes(m?.user?._id)
        );
      };

  
      reset({
        boardName: initialData?.boardName || initialData?.title || "",
        columns:
          Array.isArray(initialData?.columns) && initialData.columns.length
            ? initialData.columns
            : [{ columnName: "" }],
        members:
          Array.isArray(initialData?.members) && initialData.members.length
            ? initialData.members
            : fallbackFromIds(),
      });
    } else {
      reset({
        boardName: "",
        columns: [{ columnName: "" }],
        members: [],
      });
    }
  }, [isOpen, mode, initialData, projectMembers, reset]);

  const onSubmit = async (values) => {
    if (mode === "create") {
      if (!projectId) return; // must have parent project
      try {
        await createAsync({
          projectId,
          boardName: values.boardName,
          columns: values.columns,
          // IMPORTANT: same as project form — send `members` array as-is
          members: values.members || [],
        });

        toast.success("Board created successfully");
        onOpenChange?.(false);
        reset();
        await refetchBoards?.();
      } catch (error) {
        const msg = error?.response?.data?.message || "Failed to create board";
        toast.error(msg);
      }
      return;
    }

    // EDIT
    if (!initialData?._id) return;
    try {
        const updated = await updateAsync({    
          boardId: initialData._id,
          projectId,
          boardName: values.boardName,
          columns: values.columns,
          members: values.members || [],
      });

      

      toast.success("Board updated successfully");
      onOpenChange?.(false);
      reset();
      setBoards?.((prev) => (             
        Array.isArray(prev)
          ? prev.map((b) => (b._id === updated?._id ? updated : b))
          : prev
      ));
      await refetchBoards?.();
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to update board";
      toast.error(msg);
    }
  };

  const isBusy = isSubmitting || createPending || updatePending;
  const titleText = mode === "edit" ? "Edit Board" : "Create Board";
  const btnText = mode === "edit" ? "Save Changes" : "Create Board";

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={() => onOpenChange?.(false)}
      title={titleText}
      footer={
        <Button type="submit" form="create-edit-board-form" isLoading={isBusy}>
          {btnText}
        </Button>
      }
    >
      <form id="create-edit-board-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputField
          label="Board Name"
          name="boardName"
          type="text"
          register={register}
          errors={errors}
          placeholder="e.g. Sprint 12"
          required
        />

        {/* Columns */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Columns</label>
          <ul className="space-y-2">
            {fields.map((item, index) => (
              <li key={item.id} className="flex items-center gap-2">
                <input
                  {...register(`columns.${index}.columnName`, { required: true })}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
            focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
            block w-full p-2.5
            dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
            dark:focus:ring-1 dark:focus:ring-green-500 dark:focus:border-green-500"
                  placeholder={index === 0 ? "e.g. Backlog" : "e.g. In Progress"}
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-600 text-sm px-2 py-1 rounded hover:bg-red-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => append({ columnName: "" })}
            className="text-indigo-600 hover:underline text-sm"
          >
            + Add New Column
          </button>
        </div>

        {/* Members — same dropdown used in project form */}
        <TeamMembersDropdown
          workspaceMembers={projectMembers || []}
          value={membersValue}
          onChange={setMembers}
          label="Members"
          placeholder="Select Members"
        />
      </form>
    </ModalShell>
  );
}
